from skrutable.transliteration import Transliterator
from skrutable import meter_patterns
from skrutable import scheme_detection
from skrutable import phonemes
import os.path
import json
import re

# load config variables
abs_dir = os.path.split(os.path.abspath(__file__))[0] # for transliteration.py
settings_file_path = os.path.join(abs_dir, 'config.json')
config_data = open(settings_file_path,'r').read()
config = json.loads(config_data)
scansion_syllable_separator = config["scansion_syllable_separator"] # e.g. " "

class Verse(object):
	"""
	User-facing patient-style object.

	Usually constructed only internally.

	Returned by scansion.Scanner.scan()
	as well as by meter_identification.MeterIdentifier.identify_meter().

	Single method summarize() displays key attributes resulting from scansion.
	"""

	def __init__(self):
		self.text_raw = None			# string, may contain newlines
		self.original_scheme = None		# string
		self.text_cleaned = None		# string, may contain newlines
		self.text_SLP = None			# string, may contain newlines
		self.text_syllabified = None	# string, may contain newlines
		self.syllable_weights = None	# string, may contain newlines
		self.morae_per_line = None 		# list of integers
		self.meter = None				# string


	def summarize(self):
		"""
		Returns display-ready, formatted string summary of attributes.

		Features right-alignment of (vowel-final) syllables and their weights.
		"""

		out_buffer = ''

		longest_line_len = max([len(line) for line in self.syllable_weights.split('\n')])
		buffer_line = '%%%ds' % longest_line_len + ' %6s\n' % '[%s]'

		# quick view of syllables and morae
		for i, line in enumerate(self.syllable_weights.split('\n')):
			out_buffer += buffer_line % (line, self.morae_per_line[i])
		out_buffer += '\n'

		T = Transliterator(from_scheme='SLP', to_scheme=self.original_scheme)
		transl_syll_txt = T.transliterate(self.text_syllabified)

		line_max = []
		for syllabified_line in transl_syll_txt.split('\n'):
			line_max.append(max([len(s_w) for s_w in syllabified_line.split(' ')]))
		long_syll_len = max(line_max)

		buffer_bit = '%%%ds' % (long_syll_len + 2)

		for i, syllabified_line in enumerate(transl_syll_txt.split('\n')):
			# display syllables themselses
			for syll in syllabified_line.split(' '):
				out_buffer += buffer_bit % syll
			out_buffer += '\n'
			# display corresponding weights
			for s_w in self.syllable_weights.split('\n')[i]:
				out_buffer += buffer_bit % s_w
			out_buffer += '\n'

		return out_buffer

class Scanner(object):
	"""
	User-facing agent-style object.

	Primary method scan() accepts string.

	Returns single Verse object, whose various attributes
	and method summarize() help in revealing scansion results.
	"""


	def __init__(self): pass # agent-style object is just a collection of methods


	def clean_input(self, cntnts, scheme_in):
		"""
		Accepts raw text string,
		filters out characters not relevant to scansion,
		with exception of whitespace, which is useful for scheme detection.

		Returns result as string.
		"""
		result = cntnts
		for c in list(set(result)):
			if c not in phonemes.character_set[scheme_in]:
				result = result.replace(c,'')
		result_scheme = scheme_detection.detect_scheme(result)
		return result


	def syllabify_text(self, txt_SLP):
		"""
		Accepts (newline-separated) multi-line string of SLP text.
		Syllabifies by maximizing number of open (vowel-final) syllables.
		Returns corresponding multi-line string containing text syllabified with scansion_syllable_separator.
		"""

		# e.g. text == 'yadA yadA hi Darmasya glAnir Bavati BArata /\naByutTAnam aDarmasya...'

		# final cleaning: irrelevant horizontal white space
		irrelevant_horizontal_white_space = [' ', '\t']
		for c in irrelevant_horizontal_white_space:
			txt_SLP = txt_SLP.replace(c,'')
		# e.g. 'yadAyadAhiDarmasyaglAnirBavatiBArata\naByutTAnamaDarmasya...'

		# treat lines individually (newlines to be restored upon return)
		text_lines = txt_SLP.split('\n')
		syllables_by_line = []

		for line in text_lines:

			# line == e.g. 'yadAyadAhiDarmasyaglAnirBavatiBArata'

			line_syllables = ''

			# place scansion_syllable_separator after vowels
			for letter in line:

				line_syllables += letter

				if letter in phonemes.SLP_vowels:
					line_syllables += scansion_syllable_separator

			# e.g. 'ya.dA.ya.dA.hi.Da.rma.sya.glA.ni.rBa.va.ti.BA.ra.ta.'
			# BUT e.g. 'a.Byu.tTA.na.ma.Da.rma.sya.ta.dA.tmA.na.Msf.jA.mya.ha.m'

			# remove final scansion_syllable_separator before final consonant(s)
			if line_syllables[-1] in phonemes.SLP_consonants_for_scansion:

				# final separator is incorrect, remove
				final_separator = line_syllables.rfind(scansion_syllable_separator)
				line_syllables = ( line_syllables[:final_separator]
									+ line_syllables[final_separator+1:] )

				line_syllables += scansion_syllable_separator

			# e.g. 'a.Byu.tTA.na.ma.Da.rma.sya.ta.dA.tmA.na.Msf.jA.mya.ham.'

			syllables_by_line.append(line_syllables)

		text_syllabified = '\n'.join(syllables_by_line) # restore newlines
		return text_syllabified

	def scan_syllable_weights(self, txt_syl):
		"""
		Argument is internal, multi-line string containing text syllabified with scansion_syllable_separator.
		Returns corresponding multi-line string detailing pattern of lights/heavies (l/g).
		"""
		syllable_weights = ''

		# treat lines individually (newlines to be restored upon return)
		text_lines = txt_syl.split('\n')
		weights_by_line = []

		for line in text_lines:

			line_weights = ''

			syllables = line.split(scansion_syllable_separator)
			syllables.pop(-1) # last '.' generates spurious empty syllable, delete

			for n, syllable in enumerate(syllables):

				if (
					# heavy by nature
					syllable[-1] in phonemes.SLP_long_vowels

					or

					# heavy by position:
					# consonant closes syllable or is second letter of next syllable
					syllable[-1] in (phonemes.SLP_consonants_for_scansion) or
					n <= (len(syllables)-2) and len(syllables[n+1]) > 1 and syllables[n+1][1] in (phonemes.SLP_consonants_for_scansion)

					):

					line_weights += 'g'
					# line_weights += 'g_'
					# insofar as two 'l's can equal one 'g', could use this alternative for better visual alignment

				else:

					line_weights += 'l'

			weights_by_line.append(line_weights)

		syllable_weights = '\n'.join(weights_by_line) # restore newlines
		return syllable_weights


	def count_morae(self, syl_wts):
		"""
		Accepts multi-line string argument detailing pattern of lights/heavies (l/g).
		Returns list of length equal to number of lines in argument,
			detailing number of morae found in each line.
		"""

		"""		MOVE THIS TO MeterIdentifier	 """

		morae_per_line = []

		weights_by_line = syl_wts.split('\n')

		for line in weights_by_line:
			morae_per_line.append( line.count('l') * 1 + line.count('g') * 2 )

		return morae_per_line


	def gaRa_abbreviate(self, syl_wts):
		"""
		Accepts string with pattern of light/heavy syllables (l/g), e.g. 'lllgggl'.

		Returns string corresponding to 'gaRa'-trisyllable abbreviation, e.g. 'nml'.
		"""

		weights_of_curr_gaRa = ''
		overall_abbreviation = ''

		for single_weight in syl_wts:
			weights_of_curr_gaRa += single_weight
			if len(weights_of_curr_gaRa) == 3:
				overall_abbreviation += meter_patterns.gaRas_by_weights[weights_of_curr_gaRa]
				weights_of_curr_gaRa = ''

		# leftover lights and heavies (l/g)
		overall_abbreviation += weights_of_curr_gaRa

		return overall_abbreviation


	def scan(self, cntnts):
		"""
		Manages overall scansion procedure:
			accept raw text
			detect transliteration scheme
			clean text for scansion
			transliterate text to SLP
			perform syllabification
			determine syllable weights (i.e., convert to l/g pattern)
			count morae per line

		Returns each of these results as updated Verse object attributes.
		"""

		V = Verse()

		V.text_raw = cntnts

		# BROKEN
		# V.original_scheme = scheme_detection.detect_scheme(V.text_raw)
		V.original_scheme = 'SLP'

		T = Transliterator()
		T.scheme_in = V.original_scheme
		T.scheme_out = 'SLP'

		V.text_cleaned = self.clean_input(V.text_raw, V.original_scheme)
		# CLEANING DEPENDS ON SCHEME_DETECTION, WHICH MAY NEED TO BE IMPROVED...

		V.text_SLP = T.transliterate(V.text_cleaned)

		V.text_syllabified = self.syllabify_text(V.text_SLP)

		V.syllable_weights = self.scan_syllable_weights(V.text_syllabified)

		V.morae_per_line = self.count_morae(V.syllable_weights)

		return V
