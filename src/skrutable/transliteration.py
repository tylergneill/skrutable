from skrutable import phonemes
from skrutable import scheme_maps
from skrutable import scheme_detection
from skrutable.scheme_detection import SchemeDetector
from skrutable import virAma_avoidance
from skrutable.config import load_config_dict_from_json_file
import re

# load config variables
config = load_config_dict_from_json_file()
default_scheme_in = config["default_scheme_in"] # e.g. "auto"
default_scheme_out = config["default_scheme_out"] # e.g. "IAST"
avoid_virAma_indic_scripts = config["avoid_virAma_indic_scripts"] # e.g. True
avoid_virAma_all_scripts = config["avoid_virAma_all_scripts"] # e.g. False


class Transliterator():
	"""
	User-facing agent-style object.

	Can be used with only default settings (see config.py),
	or with manually passed override settings.

	Main method transliterate() accepts and returns string.
	"""

	def __init__(self, from_scheme=None, to_scheme=None):

		self.contents = None

		if from_scheme == None:
			from_scheme = default_scheme_in
		from_scheme = from_scheme.upper()
		self.scheme_in = from_scheme

		if to_scheme == None:
			to_scheme = default_scheme_out
		to_scheme = to_scheme.upper()
		self.scheme_out = to_scheme


	def set_detected_scheme(self):
		"""Internal method."""
		SD = SchemeDetector()
		self.scheme_in = SD.detect_scheme(self.contents)

	def map_replace(self, from_scheme, to_scheme):
		"""
		Internal method.

		Performs simple series of global regex replacements for transliteration.

		Result returned via updated self.contents.
		"""
		map = scheme_maps.by_name[from_scheme + '_' + to_scheme]
		for (char_in, char_out) in map:
			self.contents = self.contents.replace(char_in, char_out)


	def avoid_virAmas(self):
		"""
		Internal method.

		Performs simple series of global regex replacements for avoiding virāma.

		Result returned via updated self.contents.
		"""
		for pattern in virAma_avoidance.replacements:
			self.contents = re.sub(pattern, r'\1\2', self.contents)

	def linear_preprocessing(self, from_scheme, to_scheme):
		"""
		Internal method.

		Manages inherent short 'a' vowel and virāma for Indic schemes <<>> SLP,
		paying special attention to positions immediately after consonants.

		Also manages distinction between initial and mātrā vowel forms.

		Indic-SLP hybrid result returned via updated self.contents,
		to be further processed by simple map replacement.
		"""

		if from_scheme in scheme_maps.indic_schemes and to_scheme == 'SLP':
			char_to_ignore = phonemes.virAmas[from_scheme]
			char_to_add = 'a'
		elif from_scheme == 'SLP' and to_scheme in scheme_maps.indic_schemes:
			char_to_ignore = 'a'
			char_to_add = phonemes.virAmas[to_scheme]
		else: return

		content_in = self.contents

		content_out = '' # buffer to build as hybrid mix
		prev_char = ''
		for curr_char in content_in:

			if prev_char in phonemes.SLP_and_indic_consonants:
				# only need special action after consonants

				if curr_char == char_to_ignore:
					# from DEV: virāma
					# from SLP: 'a'
					pass

				elif curr_char not in phonemes.vowels_that_preempt_virAma:
					# from Indic: not vowel mātrā, therefore need 'a'
					# from SLP: not vowel, therefore need virāma
					# could also be other things (e.g. vowel, whitesp., punct.)
					content_out += char_to_add + curr_char

				elif curr_char in phonemes.SLP_vowels_with_mAtrAs:
					# from SLP: any vowel except 'a', therefore need mātrā
					try: # being careful of stray characters
						content_out += phonemes.vowel_mAtrA_lookup[to_scheme][curr_char]
					except KeyError: pass

				elif curr_char in phonemes.vowels_that_preempt_virAma:
					# from Indic: vowel mātrā (only possibility left)
					content_out += curr_char

			else:
				# whenever preceding is non-consonant (e.g. vowel, whitesp., punct.)
				content_out += curr_char

			prev_char = curr_char

		if prev_char in phonemes.SLP_consonants:
			# line-final SLP consonant: final virāma needed
			content_out += phonemes.virAmas[to_scheme]
		elif prev_char in phonemes.SLP_and_indic_consonants:
			# line-final Indic consonant: final 'a' needed
			content_out += 'a'

		self.contents = content_out # hybrid


	def transliterate(self, cntnts, from_scheme=None, to_scheme=None):
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

		if from_scheme == "IASTREDUCED":
			return cntnts

		self.contents = cntnts

		# uppercase
		if from_scheme != None:
			self.scheme_in = from_scheme.upper()
		if to_scheme != None:
			self.scheme_out = to_scheme.upper()

		# looks for auto-detect keywords
		if self.scheme_in in scheme_detection.auto_detect_synonyms:
			self.set_detected_scheme()

		# transliterate first to hub scheme SLP
		self.linear_preprocessing(self.scheme_in, 'SLP')
		self.map_replace(self.scheme_in, 'SLP')

		# avoid undesirable virāmas specified in virāma_avoidance.py
		if 	(self.scheme_out in scheme_maps.indic_schemes
			and avoid_virAma_indic_scripts == True
			or avoid_virAma_all_scripts == True):
			self.avoid_virAmas()

		# then transliterate to desired scheme
		self.linear_preprocessing('SLP', self.scheme_out)
		self.map_replace('SLP', self.scheme_out)

		return self.contents
