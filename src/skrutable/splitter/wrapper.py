import re
import requests
from typing import List, Tuple

from skrutable.config import load_config_dict_from_json_file

config = load_config_dict_from_json_file()
PRESERVE_PUNC_DEFAULT = config["preserve_punc_default"]
SPLITTER_INPUT_BUFFER_FN = "data/input/buffer_in.txt"
SPLITTER_SERVER_URL = 'https://splitter-server-tylergneill.pythonanywhere.com'

class Splitter(object):

    def __init__(self):

        self.punc_regex = r' *[।॥\|/\\.\\?,—;!\[\(<\t\n"][।॥\|/\\.\\?,—;!\t\n\d\[\]\(\)<>" ]*'
        self.max_char_limit = 128
        self.char_limit_split_regex_options = [r'(?:(?:[kgtdnpbmṃḥ])) ', r'(?:(?:e[nṇ]a|asya|[ie]va|api)) ', r' ', r'a']
        self.ctr_splt_range = 0.8 # percentage distance measured from middle
        self.line_count_before_split = 0
        self.line_count_during_split = 0
        self.line_count_after_split = 0
        self.token_count = 0

    def _get_sentences_and_punc(self, txt: str) -> Tuple[List[str], List[str]]:
        sentences = list(filter(None, re.split(self.punc_regex, txt, flags=re.MULTILINE)))
        punc = re.findall(self.punc_regex, txt)
        return sentences, punc

    def _find_midpoint(self, txt: str, splt_regex: str) -> int:
        """
        Determine position of whitespace of centermost legal split of txt based on splt_regex.
        Return integer index.
        """

        space_indices = [m.end()-1 for m in re.finditer(splt_regex, txt)]
        Ds_from_mid = [abs(i - len(txt)/2) for i in space_indices] # Distances
        try:
            most_mid_index = space_indices[Ds_from_mid.index(min(Ds_from_mid))]
            return most_mid_index
        except ValueError:
            return 0

    def _split_smart_half(self, txt: str, splt_regex_options: List[str], max_len: int) -> List[str]:
        """
        Recursively split txt (string) according to splt_regex_options
            (first go for m/ṃ or t/d, otherwise any space)
        until all resulting substrings conform to max_len.
        Return list of resulting substrings.
        """
        # remove initial and final spaces
        txt = re.sub(u"(^ *| *$)",'', txt)
        if len(txt) <= max_len:
            return [txt]
        else:
            for splt_regex in splt_regex_options:
                midpoint = self._find_midpoint(txt, splt_regex)
                if (
                    midpoint > (1.0 - (1.0 - self.ctr_splt_range) / 2) * len(txt)
                    or
                    midpoint < ((1.0 - self.ctr_splt_range) / 2) * len(txt)
                ): continue
                else: break

            part_a = self._split_smart_half( txt[ : midpoint + 1] , splt_regex_options, max_len)
            part_b = self._split_smart_half( txt[midpoint + 1 : ] , splt_regex_options, max_len)
            return part_a + part_b

    def _enforce_char_limit(self, txtLines: List[str]) -> Tuple[List[str], List[int]]:
        sentence_counts = []
        new_txtLines = []
        for i, line in enumerate(txtLines):
            if len(line) <= self.max_char_limit:
                new_txtLines.append(line)
                sentence_counts.append(1)
            else:
                new_txtLines.extend(
                    parts := self._split_smart_half(
                        line,
                        self.char_limit_split_regex_options,
                        self.max_char_limit
                    )
                )
                sentence_counts.append(len(parts))
        return new_txtLines, sentence_counts

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

    def _restore_punc(self, sentences: List[str], svd_pnc: List[str]) -> str:
        if len(svd_pnc) == len(sentences) + 1: # started with "punctuation"
            return svd_pnc[0] + ''.join(
                [elem for pair in zip(sentences, svd_pnc[1:]) for elem in pair]
            )
        elif len(svd_pnc) == len(sentences):
            return ''.join(
                [elem for pair in zip(sentences, svd_pnc) for elem in pair]
            )

    def split(
            self,
            text: str,
            splitter_model: str='dharmamitra_2024_sept',
            prsrv_punc: bool=PRESERVE_PUNC_DEFAULT,
            wholeFile: bool=False,
    ) -> str:
        """
        Splits sandhi and compounds of multi-line Sanskrit string,
        passing maximum of max_char_limit characters to Splitter at a time,
        and preserving original newlines and punctuation.
        """
        # save original punctuation
        sentences: List[str]
        svd_punc: List[str]
        sentences, svd_punc = self._get_sentences_and_punc(text)

        # split sentences that are too long for Splitter
        safe_sentences: List[str]
        sent_counts: List[int]
        safe_sentences, sent_counts = self._enforce_char_limit(sentences)

        sentences_str: str = '\n'.join(safe_sentences)

        split_sentences: List[str]

        if splitter_model == 'dharmamitra_2024_sept':
            split_sentences = self._get_dharmamitra_split(sentences_str)

        elif splitter_model == 'splitter_2018':

            split_sentences_str: str

            if wholeFile:
                # write prepared string to Splitter input buffer and send as binary
                with open(SPLITTER_INPUT_BUFFER_FN, 'w') as f_out:
                    f_out.write(sentences_str)
                split_sentences_str = self._post_file_2018(SPLITTER_INPUT_BUFFER_FN)
            else:
                split_sentences_str = self._post_string_2018(sentences_str)

            split_sentences = self._clean_up_2018(split_sentences_str)

        # restore sentences split to enforce character limit
        restored_sentences: List[str] = self._restore_sentences(split_sentences, sent_counts)

        # restore punctuation
        if prsrv_punc and svd_punc != []:
            final_results = self._restore_punc(restored_sentences, svd_punc)
        else:
            final_results = '\n'.join(restored_sentences).replace('_', ' ')

        return final_results
