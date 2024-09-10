import re
import requests
from typing import List, Tuple

from skrutable.config import load_config_dict_from_json_file

config = load_config_dict_from_json_file()
PRESERVE_PUNCTUATION_DEFAULT = config["preserve_punctuation_default"]
SPLITTER_INPUT_BUFFER_FN = "data/input/buffer_in.txt"
SPLITTER_SERVER_URL = 'https://splitter-server-tylergneill.pythonanywhere.com'

class Splitter(object):

    def __init__(self):

        shared_items = r'।॥\|/\\.,—;!\[(<\t\r\n"'
        self.punctuation_regex = fr' *[{shared_items}][{shared_items}\d\])> ]*'
        self.max_char_limit = {
            "splitter_2018": 128,
            "dharmamitra_2024_sept": 350,
        }
        self.char_limit_split_regex_options = [r'(?:(?:[kgtdnpbmṃḥ])) ', r'(?:(?:e[nṇ]a|asya|[ie]va|api)) ', r' ', r'a']
        self.center_split_range = 0.8 # percentage distance measured from middle

    def _get_sentences_and_punctuation(self, text: str) -> Tuple[List[str], List[str]]:
        sentences = list(filter(None, re.split(self.punctuation_regex, text, flags=re.MULTILINE)))
        punctuation = re.findall(self.punctuation_regex, text)
        return sentences, punctuation

    def _find_midpoint(self, text: str, split_regex: str) -> int:
        """
        Determine position of whitespace of centermost legal split of text based on split_regex.
        Return integer index.
        """

        space_indices = [m.end()-1 for m in re.finditer(split_regex, text)]
        Ds_from_mid = [abs(i - len(text)/2) for i in space_indices] # Distances
        try:
            most_mid_index = space_indices[Ds_from_mid.index(min(Ds_from_mid))]
            return most_mid_index
        except ValueError:
            return 0

    def _split_smart_half(self, text: str, split_regex_options: List[str], max_len: int) -> List[str]:
        """
        Recursively split text (string) according to split_regex_options
            (first go for m/ṃ or t/d, otherwise any space)
        until all resulting substrings conform to max_len.
        Return list of resulting substrings.
        """
        # remove initial and final spaces
        text = re.sub(u"(^ *| *$)",'', text)
        if len(text) <= max_len:
            return [text]
        else:
            for split_regex in split_regex_options:
                midpoint = self._find_midpoint(text, split_regex)
                if (
                    midpoint > (1.0 - (1.0 - self.center_split_range) / 2) * len(text)
                    or
                    midpoint < ((1.0 - self.center_split_range) / 2) * len(text)
                ): continue
                else: break

            part_a = self._split_smart_half( text[ : midpoint + 1] , split_regex_options, max_len)
            part_b = self._split_smart_half( text[midpoint + 1 : ] , split_regex_options, max_len)
            return part_a + part_b

    def _enforce_char_limit(self, text_lines: List[str], max_char_limit: int=128) -> Tuple[List[str], List[int]]:
        sentence_counts = []
        new_text_lines = []
        for i, line in enumerate(text_lines):
            if len(line) <= max_char_limit:
                new_text_lines.append(line)
                sentence_counts.append(1)
            else:
                new_text_lines.extend(
                    parts := self._split_smart_half(
                        line,
                        self.char_limit_split_regex_options,
                        max_char_limit
                    )
                )
                sentence_counts.append(len(parts))
        return new_text_lines, sentence_counts

    def _parse_dharmamitra_result(self, response_json) -> List[str]:
        sentence_results = []
        for sentence_blob in response_json:
            sentence_results.append(
                ' '.join([r['unsandhied'] for r in sentence_blob['grammatical_analysis']])
            )
        return sentence_results

    def _get_dharmamitra_split(self, text_input, mode="unsandhied"):
        """
        Modes can be:
        - unsandhied-lemma-morphosyntax
        - lemma-morphosyntax
        - lemma
        - unsandhied
        """
        url = 'https://dharmamitra.org/api/tagging/'
        headers = {
            'Content-Type': 'application/json',
        }
        data = {
            "input_sentence": text_input,
            "mode": mode,
            "input_encoding": "auto",
            "human_readable_tags": False,
        }

        response = requests.post(url, headers=headers, json=data)

        # Check if the request was successful
        if response.status_code == 200:
            return self._parse_dharmamitra_result(response.json())
        else:
            response.raise_for_status()

    def _post_string_2018(self, input_text: str, url: str=SPLITTER_SERVER_URL):
        json_payload = {'input_text': input_text}
        result = requests.post(url, json=json_payload)
        return result.text

    def _post_file_2018(self, input_file_path: str, url: str=SPLITTER_SERVER_URL):
        input_file = open(input_file_path, 'rb')
        file_payload = {"input_file": input_file}
        result = requests.post(url, files=file_payload)
        return result.text

    def _clean_up_2018(self, split_sentences_str: str, split_appearance: str=' ') -> List[str]:
        for (r_1, r_2) in [
            ('-\n', '\n'), # remove line-final hyphens
            ('-', split_appearance), # modify appearance of splits ('-', ' ', '- ', etc.)
            ('=', ''), # QUESTION: what does this char in result even mean?
            ('=', ''), # QUESTION: what does this char in result even mean?
            ('(\A\s*)|(\s*\Z)', '') # string-initial and -final whitespace
        ]:
            split_sentences_str = re.sub(r_1, r_2, split_sentences_str)
        return split_sentences_str.split('\n')

    def _restore_sentences(self, sentences: List[str], sentence_counts: List[int]) -> List[str]:
        restored_sentences = []
        i = 0
        for count in sentence_counts:
            restored_sentences.append(' '.join(sentences[i:i + count]))
            i += count
        return restored_sentences

    def _restore_punctuation(self, sentences: List[str], punctuation: List[str]) -> str:
        if len(punctuation) == len(sentences) + 1: # started with punctuation
            return punctuation[0] + ''.join(
                [elem for pair in zip(sentences, punctuation[1:]) for elem in pair]
            )
        elif len(punctuation) == len(sentences):
            return ''.join(
                [elem for pair in zip(sentences, punctuation) for elem in pair]
            )

    def split(
            self,
            text: str,
            splitter_model: str='dharmamitra_2024_sept',
            preserve_punctuation: bool=PRESERVE_PUNCTUATION_DEFAULT,
            whole_file: bool=False,
    ) -> str:
        """
        Splits sandhi and compounds of multi-line Sanskrit string,
        passing maximum of max_char_limit characters to Splitter at a time,
        and preserving original newlines and punctuation.
        """
        # save original punctuation
        sentences: List[str]
        saved_punctuation: List[str]
        sentences, saved_punctuation = self._get_sentences_and_punctuation(text)
        if len(saved_punctuation) - len(sentences) > 1:
            raise ValueError("Punctuation and sentence count mismatch")

        # split sentences that are too long for Splitter
        safe_sentences: List[str]
        sent_counts: List[int]
        safe_sentences, sent_counts = self._enforce_char_limit(sentences, self.max_char_limit.get(splitter_model, 128))

        sentences_str: str = '\n'.join(safe_sentences)

        split_sentences: List[str]

        if splitter_model == 'dharmamitra_2024_sept':
            split_sentences = self._get_dharmamitra_split(sentences_str)

        elif splitter_model == 'splitter_2018':

            split_sentences_str: str

            if whole_file:
                # write prepared string to Splitter input buffer and send as binary
                with open(SPLITTER_INPUT_BUFFER_FN, 'w') as f_out:
                    f_out.write(sentences_str)
                split_sentences_str = self._post_file_2018(SPLITTER_INPUT_BUFFER_FN)
            else:
                split_sentences_str = self._post_string_2018(sentences_str)

            split_sentences = self._clean_up_2018(split_sentences_str)

        else:
            raise ValueError(f"Invalid splitter model {splitter_model}")

        # restore sentences split to enforce character limit
        restored_sentences: List[str] = self._restore_sentences(split_sentences, sent_counts)

        # restore punctuation
        if preserve_punctuation and saved_punctuation != []:
            final_results = self._restore_punctuation(restored_sentences, saved_punctuation)
        else:
            final_results = '\n'.join(restored_sentences).replace('_', ' ')

        return final_results
