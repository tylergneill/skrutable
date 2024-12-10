import re
import requests
from typing import List, Tuple

from skrutable.config import load_config_dict_from_json_file

config = load_config_dict_from_json_file()
PRESERVE_PUNCTUATION_DEFAULT = config["preserve_punctuation_default"]
PRESERVE_COMPOUND_HYPHENS_DEFAULT = config["preserve_compound_hyphens_default"]
SPLITTER_SERVER_URL = 'https://2018emnlp-sanskrit-splitter-server.dharma.cl/'

class Splitter(object):

    def __init__(self):

        shared_items = r'।॥\|/\\.,—;\?!\[(<\t\r\n"'
        self.punctuation_regex = fr' *[{shared_items}][{shared_items}\d\])> ]*'
        self.max_char_limit = {
            ("splitter_2018", "don't preserve hyphens"): 128,
            ("dharmamitra_2024_sept", "don't preserve hyphens"): 350,
            ("dharmamitra_2024_sept", "preserve hyphens"): 150,
        }
        self.char_limit_split_regex_options = [r'(?:(?:[kgtdnpbmṃḥ])) ', r'(?:(?:e[nṇ]a|asya|[ie]va|api)) ', r' ', r'a']
        self.center_split_range = 0.8 # percentage distance measured from middle

    def _get_sentences_and_punctuation(self, text: str) -> Tuple[List[str], List[str]]:
        """
        Extract and return lists of sentences and punctuation from text.
        Also return list of markers for proper interleaving on restoration.
        """
        sentences = list(filter(None, re.split(self.punctuation_regex, text, flags=re.MULTILINE)))
        punctuation = re.findall(self.punctuation_regex, text)
        tokens = re.split(f'({self.punctuation_regex})', text)
        tokens = [token for token in tokens if token]
        markers = ['punctuation' if re.fullmatch(self.punctuation_regex, token) else 'content' for token in tokens]
        return sentences, punctuation, markers

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

    def _parse_dharmamitra_result(self, response_json, mode="unsandhied") -> List[str]:
        sentence_results = []
        for sentence_blob in response_json:
            new_sentence = ' '.join([r['unsandhied'] for r in sentence_blob['grammatical_analysis']])
            # conditionally do special post-processing if using unsandhied-lemma-morphosyntax to preserve hyphens
            if mode == "unsandhied-lemma-morphosyntax":
                new_sentence = new_sentence.replace('- ', '-')
            sentence_results.append(new_sentence)
        return sentence_results

    def _get_dharmamitra_split(
            self,
            text_input: str,
            preserve_compound_hyphens: bool=True,
            batch_size: int=2000
        ) -> List[str]:
        # TODO: change to "unsandhied-morphosyntax" when it works
        mode = "unsandhied-lemma-morphosyntax" if preserve_compound_hyphens else "unsandhied"
        """
        Modes can be:
        - unsandhied  (does not distinguish compounds)
        - lemma  (i.e., dictionary info, not needed for splitting)
        - unsandhied-morphosyntax  (would be ideal for distinguishing compounds but doesn't work currently)
        - lemma-morphosyntax  (doesn't work currently, would not be useful for splitting)
        - unsandhied-lemma-morphosyntax  (current best option for distinguishing compound split with hyphen)
        """
        url = 'https://dharmamitra.org/api/tagging/'
        headers = {
            'Content-Type': 'application/json',
        }

        sentences = text_input.split('\n')
        results = []
        for i in range(0, len(sentences), batch_size):
            sentence_batch = sentences[i:i + batch_size]
            batch_text_input = '\n'.join(sentence_batch)
            data = {
                "input_sentence": batch_text_input,
                "mode": mode,
                "input_encoding": "auto",
                "human_readable_tags": False,
            }
            response = requests.post(url, headers=headers, json=data)
            if response.status_code != 200:
                response.raise_for_status()
            batch_result = self._parse_dharmamitra_result(response.json(), mode)
            results.extend(batch_result)

        return results

    def _post_string_2018(self, input_text: str, url: str=SPLITTER_SERVER_URL):
        json_payload = {'input_text': input_text}
        result = requests.post(url, json=json_payload)
        return result.text

    def _clean_up_2018(self, split_sentences_str: str, split_appearance: str=' ') -> List[str]:
        for (r_1, r_2) in [
            ('-\n', '\n'), # remove line-final hyphens
            ('-', split_appearance), # modify appearance of splits ('-', ' ', '- ', etc.)
            ('=', ''), # QUESTION: what does this char in result even mean?
            ('=', ''), # repeat for good measure
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

    def _restore_punctuation(self, sentences: List[str], punctuation: List[str], markers: List[str]) -> str:
        new_sentences = []
        for marker in markers:
            if marker == 'content':
                new_sentences.append(sentences.pop(0))
            elif marker == 'punctuation':
                new_sentences.append(punctuation.pop(0))
        return ''.join(new_sentences)

    def split(
            self,
            text: str,
            splitter_model: str='dharmamitra_2024_sept',
            preserve_compound_hyphens: bool = PRESERVE_COMPOUND_HYPHENS_DEFAULT,
            preserve_punctuation: bool=PRESERVE_PUNCTUATION_DEFAULT,
    ) -> str:
        """
        Splits sandhi and compounds of multi-line Sanskrit string,
        passing maximum of max_char_limit characters to Splitter at a time,
        and preserving original newlines and punctuation.
        """

        # save original punctuation
        sentences: List[str]
        saved_punctuation: List[str]
        sentences, saved_punctuation, markers = self._get_sentences_and_punctuation(text)
        if len(saved_punctuation) - len(sentences) > 1:
            raise ValueError("Punctuation and sentence count mismatch")

        # split sentences that are too long for Splitter
        safe_sentences: List[str]
        sent_counts: List[int]
        safe_sentences, sent_counts = self._enforce_char_limit(
            sentences,
            self.max_char_limit.get(
                (splitter_model, "preserve hyphens" if preserve_compound_hyphens else "don't preserve hyphens"), 128
            )
        )

        sentences_str: str = '\n'.join(safe_sentences)

        split_sentences: List[str]

        if splitter_model == 'dharmamitra_2024_sept':

            split_sentences = self._get_dharmamitra_split(
                sentences_str,
                preserve_compound_hyphens=preserve_compound_hyphens
            )

        elif splitter_model == 'splitter_2018':

            split_sentences_str = self._post_string_2018(sentences_str)
            split_sentences = self._clean_up_2018(split_sentences_str)

        else:
            raise ValueError(f"Invalid splitter model {splitter_model}")

        # restore sentences split to enforce character limit
        restored_sentences: List[str] = self._restore_sentences(split_sentences, sent_counts)

        # restore punctuation
        if preserve_punctuation and saved_punctuation != []:
            final_results = self._restore_punctuation(restored_sentences, saved_punctuation, markers)
        else:
            final_results = '\n'.join(restored_sentences).replace('_', ' ')

        return final_results
