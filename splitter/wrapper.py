import re
import pathlib
import requests

from skrutable.config import load_config_dict_from_json_file

"""
Hacky temporary path solution to solve Python 3.5 and relative path problems:
    On call to split (e.g. from Python 3.8),
    first store current working directory,
    then switch to absolute path of splitter wrapper,
    execute commands in Python 3.5 via subprocess,
    and finally, return to original working directory.
"""

# paths: absolute

wrapper_module_path = pathlib.Path(__file__).parent.absolute()

# wrapper_config_path = os.path.join(wrapper_module_path, 'wrapper_config.json')
# config_data = open(wrapper_config_path,'r').read()
# config = json.loads(config_data)
config = load_config_dict_from_json_file()

# user must adjust to point at own Python 3.5 executable
# python_3_5_bin_path = config["python_3_5_bin_path"]
# e.g. on local Mac: "/Users/tyler/.pyenv/versions/3.5.9/bin"
# on PythonAnywhere: "/usr/bin"

# user's Python 3.5 install must also have 1.x version of TensorFlow
# e.g. locally: pip3.5 install tensorflow==1.15.0
# on PythonAnywhere: pip3.5 install --user tensorflow==1.15.0 > /tmp/tensorflow-install.log

# paths: relative

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

        self.punc_regex = r'[।॥\|/\\.\\?,—;!\t]+'
        self.max_char_limit = 128
        self.char_limit_split_regex_options = [r'(?<=[mṃtd]) ', r' ']
        self.ctr_splt_range = 0.8 # percentage distance measured from middle
        self.line_count_before_split = 0
        self.line_count_during_split = 0
        self.line_count_after_split = 0
        self.token_count = 0

    def get_punc(self, txt):
        return re.findall(self.punc_regex, txt)

    def presplit(self, txt):
        txt = txt.replace('\n', '\n##\n')
        rgx = re.compile(self.punc_regex)
        return re.sub(rgx, '\n_\n', txt)

    def find_midpoint(self, txt, splt_regex):
        """
        Determine position of centermost legal split of txt based on splt_regex.
        Return integer index.
        """

        all_indices = [m.start() for m in re.finditer(splt_regex, txt)]
        Ds_from_mid = [abs(i - len(txt)/2) for i in all_indices] # Distances
        try:
            most_mid_index = all_indices[Ds_from_mid.index(min(Ds_from_mid))]
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

    def clean_up(self, txt, split_appearance=' '):
        for (r_1, r_2) in [
                ('\n_\n', ' _ '), # maintain markers for original punc
                ('\n', ' '), # restore presplit lines
                (' *?## ?', '\n'), # restore original newlines (sans document-final or -initial space)
                ('-', split_appearance), # modify appearance of splits ('-', ' ', '- ', etc.)
                ('=', ''), # QUESTION: what does this char in result even mean?
                ('=', ''), # QUESTION: what does this char in result even mean?
                ('(\A\s*)|(\s*\Z)', '') # string-initial and -final whitespace
            ]:
            txt = re.sub(r_1, r_2, txt)
        return txt

    def restore_punc(self, txt, svd_pnc):
        spl_txt = txt.split('_')
        # print("len(svd_pnc): ", len(svd_pnc))
        # print("txt: ", txt)
        # print("spl_txt: ", spl_txt)
        # print("len(spl_txt): ", len(spl_txt))
        return ''.join([spl_txt[i] + svd_pnc[i] for i in range(len(svd_pnc))])

    def enforce_char_limit(self, txt):
        old_lines = txt.split('\n')
        new_lines = []
        for line in old_lines:
            if len(line) <= self.max_char_limit:
                new_lines.append(line)
            else:
                new_lines.append(
                    '\n'.join(
                        self.split_smart_half(
                            line,
                            self.char_limit_split_regex_options,
                            self.max_char_limit
                        )
                    )
                )
        return '\n'.join(new_lines)

    def count_tokens(self, text):
        tokens = re.split(r'[\n ]+', text)
        while '' == tokens[-1]: tokens.pop(-1) # discard final empties
        return len(tokens)

    def split(self, text, prsrv_punc=preserve_punc_default, wholeFile=False):
        """
        Splits sandhi and compounds of multi-line Sanskrit string,
        passing maximum of max_char_limit characters to Splitter at a time,
        and preserving original newlines and punctuation.
        """

        # save original working directory, change to SplitterWrapper one
#         orig_cwd = os.getcwd()
#         os.chdir(wrapper_module_path)

        self.line_count_before_split = len(text.split('\n'))

        # save original punctuation
        if prsrv_punc:
            saved_punc = self.get_punc(text)

        # prepare string for Splitter
        text_presplit = self.presplit(text)
        prepared_text = self.enforce_char_limit(text_presplit)

        self.line_count_during_split = len(prepared_text.split('\n'))

        # post to server_splitter api
        if wholeFile:
            # write prepared string to Splitter input buffer and send as binary
            with open(Splitter_input_buffer_fn, 'w') as f_out:
                f_out.write(prepared_text)
            result = post_file(Splitter_input_buffer_fn)
        else:
            result = post_string(prepared_text)

        # # run Splitter
        # command = "%s/python3.5 -W ignore apply.py" % python_3_5_bin_path
        # subprocess.call(command, shell='True')

        # # retrieve Splitter result from output buffer
        # with open(Splitter_output_buffer_fn, 'r') as f_in:
        #     result = f_in.read()

        # clean up results (e.g., newlines, original punctuation)
        result = self.clean_up(result, split_appearance=' ')
        if prsrv_punc and saved_punc != []:
            result = self.restore_punc(result, saved_punc)
        else:
            result = result.replace('_', ' ')

        self.line_count_after_split = result.count('\n') + 1

        self.token_count = self.count_tokens(result)

        # restore original working directory
#         os.chdir(orig_cwd)

        return result
