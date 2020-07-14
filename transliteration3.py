import tables3 as tables
from scheme_auto_detection import auto_detect_scheme

class Transliterator():

	def __init__(self, schm_in=None, schm_out=None):
		"""
		User-facing constructor.

		Manual specification of input and output schemes is optional here;
		a second chance is also provided when calling self.transliterate().
		"""

		self.contents = None
		self.scheme_in = schm_in
		self.scheme_out = schm_out


	def set_auto_detected_scheme(self):
		"""Internal method."""
		self.scheme_in = auto_detect_scheme(self.contents)

	def map_replace(self, schm_in, schm_out):
		"""
		Internal method.

		Performs simple series of global regex replacements.

		Result returned via updated self.contents.
		"""
		map = tables.maps_by_name[schm_in + '_' + schm_out]
		for (char_in, char_out) in map:
			self.contents = self.contents.replace(char_in, char_out)


	def linear_preprocessing(self, schm_in, schm_out):
		"""
		Internal method.

		Manages inherent short 'a' vowel and virāma for DEV <<>> SLP,
		paying special attention to positions immediately after consonants.

		Also manages distinction between initial and mātrā vowel forms.

		DEV-SLP hybrid result returned via updated self.contents.
		"""

		if (schm_in, schm_out) == ('DEV', 'SLP'):
			char_to_ignore =  '्'; char_to_add = 'a'
		elif (schm_in, schm_out) == ('SLP', 'DEV'):
			char_to_ignore = 'a'; char_to_add =  '्'
		else: return

		content_in = self.contents

		content_out = '' # hybrid
		prev_char = ''
		for curr_char in content_in:

			if prev_char in tables.SLP_and_DEV_consonants:
				# only need special action after consonants

				if curr_char == char_to_ignore:
					# from DEV: virāma
					# from SLP: 'a'
					pass

				elif curr_char not in tables.vowels_that_preempt_virAma:
					# from DEV: no vowel mātrā, therefore need 'a'
					# from SLP: no vowel, therefore need virāma
					content_out += char_to_add + curr_char

				elif curr_char in tables.SLP_vowels_with_mAtrAs:
					# from SLP: any vowel except 'a'
					content_out += tables.SLP_vowels_to_DEV_vowel_mAtrAs[curr_char]

				else:
					# from DEV: is in fact in tables.vowels_that_preempt_virAma
					content_out += curr_char

			else:
				# whenever preceding is non-consonant (vowel, whitesp., punct.)
				content_out += curr_char

			prev_char = curr_char

		if curr_char in tables.SLP_consonants:
			# from SLP: final virāma if needed
			content_out += '्'

		self.contents = content_out # hybrid


	def transliterate(self, cntnts, schm_in=None, schm_out=None):
		"""
		User-facing method.

		Manual specification of input and output schemes is optional here,
		as it was when calling the constructor,
		but this is the last chance to do so,
		otherwise input scheme is auto-detected
		and fixed output scheme is chosen by default (see config.json).

		Executes transliteration via SLP,
		including linear preprocessing in case of DEV.

		Result returned via updated self.contents
		and also directly as string.
		"""

		self.contents = cntnts
		if self.scheme_in == None and schm_in == None:
			self.set_auto_detected_scheme()
		if self.scheme_out == None:
			self.scheme_out = 'IAST' # or could raise error

		# transliterate first to hub scheme SLP
		self.linear_preprocessing(self.scheme_in, 'SLP')
		self.map_replace(self.scheme_in, 'SLP')

		# then to desired scheme
		self.linear_preprocessing('SLP', self.scheme_out)
		self.map_replace('SLP', self.scheme_out)

		return self.contents
