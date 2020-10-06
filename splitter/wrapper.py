import os
import subprocess
import re

"""
Hacky temporary path solution to solve Python 3.5 and relative path problems:
	On call to split (e.g. from Python 3.8),
	first store current working directory,
	then switch to absolute path of splitter wrapper,
	execute commands, save result to memory,
	and finally, return to original working directory.
"""

# absolute paths
python_3_5_bin_path = "/Users/tyler/.pyenv/versions/3.5.9/bin"
wrapper_module_path = "/Users/tyler/Git/Sanskrit_Text_Tools/skrutable/splitter"

# relative paths
buffer_in_fn = "data/input/buffer_in.txt"
buffer_out_fn = "data/output/buffer_out.txt"

preserve_punc_default = True

class HellwigSplitterWrapper(object):

	def __init__(self):

		self.punc_regex = r'[।॥/\\.\\?,—;!]+'
		self.max_char_limit = 128
		self.char_limit_split_regex_options = [r'(?<=[mṃtd]) ', r' ']
		self.ctr_splt_range = 0.8 # percentage distance measured from middle

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

	def clean_up(self, txt):
		txt = txt.replace('\n_\n', ' _ ') # maintain markers for original punc
		txt = txt.replace('\n', '')	# restore presplit lines
		txt = txt.replace('##', '\n') # restore original newlines
		txt = txt.replace('-', '- ') # modify appearance of splits (option 1)
		# txt = txt.replace('-', ' ') # modify appearance of splits (option 2)
		# txt = txt.replace('=', '') # what does this char in result even mean?
		return txt

	def restore_punc(self, txt, svd_pnc):
		spl_txt = txt.split('_')
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

	def split(self, text, prsrv_punc=preserve_punc_default):
		"""
		Splits sandhi and compounds of multi-line Sanskrit string,
		passing maximum of max_char_limit characters to Splitter at a time,
		and preserving original newlines and punctuation.
		"""

		# save original working directory, change to SplitterWrapper one
		orig_cwd = os.getcwd()
		os.chdir(wrapper_module_path)

		print("prsrv_punc", prsrv_punc)

		# save original punctuation
		if prsrv_punc:
			saved_punc = self.get_punc(text)

		# prepare string for Splitter
		text_presplit = self.presplit(text)
		prepared_text = self.enforce_char_limit(text_presplit)

		# write prepared string to Splitter input buffer
		buffer_in_f = open(buffer_in_fn, 'w')
		buffer_in_f.write(text_presplit) # f_out.write(text_pre_split)
		buffer_in_f.close()

		# run Splitter
		command = "%s/python3.5 -W ignore apply.py" % python_3_5_bin_path
		subprocess.call(command, shell='True')

		# retrieve Splitter result from output buffer
		result = open(buffer_out_fn, 'r').read()

		# clean up results (e.g., newlines, original punctuation)
		result = self.clean_up(result)
		if prsrv_punc:
			result = self.restore_punc(result, saved_punc)

		# restore original working directory
		os.chdir(orig_cwd)

		return result
