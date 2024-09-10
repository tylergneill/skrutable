import re
import requests
from typing import List, Tuple

from skrutable.config import load_config_dict_from_json_file

config = load_config_dict_from_json_file()

Splitter_input_buffer_fn = "data/input/buffer_in.txt"
Splitter_output_buffer_fn = "data/output/buffer_out.txt"

preserve_punc_default = config["preserve_punc_default"]
splitter_server_url = 'https://splitter-server-tylergneill.pythonanywhere.com'

def post_string(input_text):
    json_payload = {'input_text': input_text}
    result = requests.post(splitter_server_url, json=json_payload)
    return result.text

def post_file(input_file_path):
    input_file = open(input_file_path, 'rb')
    file_payload = {"input_file": input_file}
    result = requests.post(splitter_server_url, files=file_payload)
    return result.text

class Splitter(object):

    def __init__(self):

        self.punc_regex = r' *[।॥\|/\\.\\?,—;!\t\n]+ *'
        self.max_char_limit = 128
        self.char_limit_split_regex_options = [r'(?:(?:[kgtdnpbmṃḥ])) ', r'(?:(?:e[nṇ]a|asya|[ie]va|api)) ', r' ', r'a']
        self.ctr_splt_range = 0.8 # percentage distance measured from middle
        self.line_count_before_split = 0
        self.line_count_during_split = 0
        self.line_count_after_split = 0
        self.token_count = 0

    def get_sentences_and_punc(self, txt: str) -> List[str]:
        sentences = list(filter(None, re.split(self.punc_regex, txt, flags=re.MULTILINE)))
        punc = re.findall(self.punc_regex, txt)
        return sentences, punc

    def find_midpoint(self, txt, splt_regex):
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

    def split_smart_half(self, txt, splt_regex_options, max_len):
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
                midpoint = self.find_midpoint(txt, splt_regex)
                if (
                    midpoint > (1.0 - (1.0 - self.ctr_splt_range) / 2) * len(txt)
                    or
                    midpoint < ((1.0 - self.ctr_splt_range) / 2) * len(txt)
                ): continue
                else: break

            part_a = self.split_smart_half( txt[ : midpoint + 1] , splt_regex_options, max_len)
            part_b = self.split_smart_half( txt[midpoint + 1 : ] , splt_regex_options, max_len)
            return part_a + part_b

    def clean_up(self, split_sentences_str: str, split_appearance=' ') -> List[str]:
        for (r_1, r_2) in [
            ('-\n', '\n'), # remove line-final hyphens
            ('-', split_appearance), # modify appearance of splits ('-', ' ', '- ', etc.)
            ('=', ''), # QUESTION: what does this char in result even mean?
            ('=', ''), # QUESTION: what does this char in result even mean?
            ('(\A\s*)|(\s*\Z)', '') # string-initial and -final whitespace
        ]:
            split_sentences_str = re.sub(r_1, r_2, split_sentences_str)
        return split_sentences_str.split('\n')

    def restore_punc(self, sentences, svd_pnc):
        return ''.join(
            [elem for pair in zip(sentences, svd_pnc) for elem in pair]
        )

    def enforce_char_limit(self, txtLines) -> Tuple[List[str], List[int]]:
        sentence_counts = []
        new_txtLines = []
        for i, line in enumerate(txtLines):
            if len(line) <= self.max_char_limit:
                new_txtLines.append(line)
                sentence_counts.append(1)
            else:
                new_txtLines.extend(
                    parts := self.split_smart_half(
                        line,
                        self.char_limit_split_regex_options,
                        self.max_char_limit
                    )
                )
                sentence_counts.append(len(parts))
        return new_txtLines, sentence_counts

    def restore_sentences(self, sentences, sentence_counts):
        restored_sentences = []
        i = 0
        for count in sentence_counts:
            restored_sentences.append(' '.join(sentences[i:i + count]))
            i += count
        return restored_sentences

    def split(self, text, prsrv_punc=preserve_punc_default, wholeFile=False):
        """
        Splits sandhi and compounds of multi-line Sanskrit string,
        passing maximum of max_char_limit characters to Splitter at a time,
        and preserving original newlines and punctuation.
        """
        # save original punctuation
        sentences: List[str]
        svd_punc: List[str]
        sentences, svd_punc = self.get_sentences_and_punc(text)

        # split sentences that are too long for Splitter
        safe_sentences: List[str]
        sent_counts: List[int]
        safe_sentences, sent_counts = self.enforce_char_limit(sentences)

        sentences_str: str = '\n'.join(safe_sentences)

        # post to server_splitter api
        if wholeFile:
            # write prepared string to Splitter input buffer and send as binary
            with open(Splitter_input_buffer_fn, 'w') as f_out:
                f_out.write(sentences_str)
            split_sentences_str = post_file(Splitter_input_buffer_fn)
        else:
            split_sentences_str = post_string(sentences_str)

        # clean up server_splitter result
        split_sentences: List[str] = self.clean_up(split_sentences_str, split_appearance=' ')

        # restore sentences split to enforce character limit
        restored_sentences: List[str] = self.restore_sentences(split_sentences, sent_counts)

        # restore punctuation
        if prsrv_punc and svd_punc != []:
            final_results = self.restore_punc(restored_sentences, svd_punc)
        else:
            final_results = '\n'.join(restored_sentences).replace('_', ' ')

        return final_results
