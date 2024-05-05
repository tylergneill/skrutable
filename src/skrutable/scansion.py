from skrutable.transliteration import Transliterator
from skrutable import scheme_detection
from skrutable import meter_patterns
from skrutable import phonemes
from skrutable.config import load_config_dict_from_json_file
import re

# load config variables
config = load_config_dict_from_json_file()
scansion_syllable_separator = config["scansion_syllable_separator"] # e.g. " "
additional_pAda_separators = config["additional_pAda_separators"]  # e.g. ["\t", ";"]

class Verse(object):
	"""
	User-facing patient-style object, basically a bundle of attributes.

	Usually constructed only internally.

	Returned by scansion.Scanner.scan()
	as well as by meter_identification.MeterIdentifier.identify_meter().

	Single method summarize() formats key attributes for display
	whether via command line or graphical user interface.
	"""

	def __init__(self):
		self.text_raw = None			# string, may contain newlines
		self.original_scheme = None		# string
		self.text_cleaned = None		# string, may contain newlines
		self.text_SLP = None			# string, may contain newlines
		self.text_syllabified = None	# string, may contain newlines
		self.syllable_weights = None	# string, may contain newlines
		self.morae_per_line = None 		# list of integers
		self.gaRa_abbreviations = None	# string, may contain newlines
		self.meter_label = None			# string
		self.identification_score = 0 	# int

	def summarize(self,
		show_weights=True, show_morae=True, show_gaRas=True, # part_A
		show_alignment=True, # part_B
		show_label=True # part_C
		):
		"""
		Returns display-ready formatted string summarizing scansion
		and (if applicable) meter identification.

		Features on-demand combination of:
			syllable weights
			morae counts
			gaṇa abbreviations
			right-justified alignment of vowel-final syllables and their weights
			meter label (if available)
		"""
		part_A = part_B = part_C = ''

		# part_A

		if show_weights or show_morae or show_gaRas:

			max_weights_len = max(
				[ len(line) for line in self.syllable_weights.split('\n') ]
				)

			for i, weights in enumerate(self.syllable_weights.split('\n')):

				line = ''
				if show_weights:
					line += ('%%%ds' % max_weights_len) % weights
				if show_morae:
					line += ' %10s' % '{m: %s}' % str(self.morae_per_line[i])
				if show_gaRas:
					line += ' %11s' % '[%d: %s]' % (len(weights), self.gaRa_abbreviations.split('\n')[i])
				if show_weights or show_morae or show_gaRas:
					line += '\n'
				part_A += line

			if part_A != '': part_A += '\n'

		# part_B

		if show_alignment:

			# IAST is standard output for alignment (as well as meter label)
			T = Transliterator(from_scheme='SLP', to_scheme='IAST')
			text_syllabified_IAST = T.transliterate(self.text_syllabified)

			# calculate max syllable length for entire verse
			line_max = []
			for line in text_syllabified_IAST.split('\n'):
				line_max.append( max([ len(s_w) for s_w in line.split(' ') ]) )
			max_syllable_len = max(line_max)

			part_B_cell = '%%%ds' % (max_syllable_len + 2)

			for i, line in enumerate(text_syllabified_IAST.split('\n')):

				if line == '': continue

				# display IAST syllables
				for syll in line.split(' '):
					part_B += part_B_cell % syll
				part_B += '\n'

				# display corresponding weights aligned underneath each syllable
				for s_w in self.syllable_weights.split('\n')[i]:
					part_B += part_B_cell % s_w
				part_B += '\n'

			if part_B != '': part_B += '\n'

		# part_C

		if show_label:

			if self.meter_label == None:
				part_C += '(vṛttaṃ gaṇyatām...)'
			else:
				part_C += self.meter_label

			if part_C != '': part_C += '\n'

		cumulative_output = ''.join([part_A, part_B, part_C])
		return cumulative_output


class Scanner(object):
	"""
	User-facing agent-style object, basically a bundle of methods.

	Primary method scan() accepts string.

	Returns single Verse object populated with scansion results.
	"""


	def __init__(self):
		"""Mostly agent-style object.

		These attributes record most recent associated objects."""
		self.Verse = None			# will hold Verse object
		self.Transliterator = None	# will hold Transliterator object


	def clean_input(self, cntnts, scheme_in):
		"""
		Accepts raw text string,
		filters out characters not relevant to scansion,
		with exception of whitespace (space, tab, newline).

		Returns result as string.
		"""

		# manage additional newlines

		for chr in additional_pAda_separators:
			cntnts = cntnts.replace(chr, '\n')
		# also dedupe, also allowing for carriage returns introduced in HTML form input
		regex = re.compile(r"(\n\r?){2,}")
		cntnts = re.sub(regex, '\n', cntnts)
		# also remove buffer-initial and -final newlines
		regex = re.compile(r"(\A\s*)|(\s*\Z)")
		cntnts = re.sub(regex, '', cntnts)

		# filter out disallowed characters

		for c in list(set(cntnts)):
			if c not in phonemes.character_set[scheme_in]:
				cntnts = cntnts.replace(c,'')

		return cntnts

	def syllabify_text(self, txt_SLP):
		"""
		Accepts (newline-separated) multi-line string of SLP text.

		Syllabifies by maximizing number of open (vowel-final) syllables,
		separating them from one another with scansion_syllable_separator.

		Returns new (newline-separated) multi-line string.
		"""

		# e.g. text == 'yadA yadA hi Darmasya glAnir Bavati BArata /\naByutTAnam aDarmasya...'

		# final cleaning for scansion: irrelevant horizontal white space
		horizontal_white_space = [' ', '\t']
		for c in horizontal_white_space:
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

				# exception: do treat M and H as explicit syllable coda
				if letter in ['M', 'H']:
					if line_syllables[-1] == scansion_syllable_separator:
						line_syllables = line_syllables[:-1]

				line_syllables += letter

				if letter in phonemes.SLP_vowels + ['M', 'H']:
					line_syllables += scansion_syllable_separator

			# e.g. 'ya.dA.ya.dA.hi.Da.rma.sya.glA.ni.rBa.va.ti.BA.ra.ta.'
			# BUT e.g. 'a.Byu.tTA.na.ma.Da.rma.sya.ta.dA.tmA.na.Msf.jA.mya.ha.m'

			try:
				# remove final scansion_syllable_separator before final consonant(s)
				if line_syllables[-1] in phonemes.SLP_consonants_for_scansion:

					# final separator is incorrect, remove
					final_separator = line_syllables.rfind(scansion_syllable_separator)
					line_syllables = ( line_syllables[:final_separator]
										+ line_syllables[final_separator+1:] )

					line_syllables += scansion_syllable_separator

				# e.g. 'a.Byu.tTA.na.ma.Da.rma.sya.ta.dA.tmA.na.Msf.jA.mya.ham.'
			except IndexError: pass

			syllables_by_line.append(line_syllables)

		text_syllabified = '\n'.join(syllables_by_line) # restore newlines
		return text_syllabified


	def scan_syllable_weights(self, txt_syl):
		"""
		Accepts (newline-separated) multi-line string of text
		which is syllabified with scansion_syllable_separator.

		Returns corresponding multi-line string light/heavy (l/g) pattern.
		"""
		syllable_weights = ''

		# treat lines individually (newlines to be restored upon return)
		text_lines = txt_syl.split('\n')
		weights_by_line = []

		for line in text_lines:

			line_weights = ''

			syllables = line.split(scansion_syllable_separator)

			try:
				while syllables[-1] == '':
					syllables.pop(-1) # in case of final separator(s)
			except IndexError: pass

			for n, syllable in enumerate(syllables):

				if (
					# heavy by nature
					syllable[-1] in phonemes.SLP_long_vowels + ['M', 'H']

					or

					# heavy by position:
					# consonant closes syllable or is second letter of next syllable
					syllable[-1] in (phonemes.SLP_consonants_for_scansion)
					or
					n <= (len(syllables)-2)
					and len(syllables[n+1]) > 1
					and syllables[n+1][1] in (phonemes.SLP_consonants_for_scansion)

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
		Accepts (newline-separated) multi-line string of text
		detailing light/heavy (l/g) pattern.

		Returns list with length equal to number of lines in argument
		and containing number of morae found in each line.
		"""

		morae_per_line = []

		weights_by_line = syl_wts.split('\n')

		for line in weights_by_line:
			morae_per_line.append( line.count('l') * 1 + line.count('g') * 2 )

		return morae_per_line


	def gaRa_abbreviate(self, syl_wts):
		"""
		Accepts one-line string of light/heavy (l/g) pattern, e.g., 'lllgggl'.

		Returns string of 'gaRa'-trisyllable abbreviation, e.g. 'nml'.
		"""

		for c in list(set(syl_wts)):
			if c not in ['l','g']:
				return None

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


	def scan(self, cntnts, from_scheme=None):
		"""
		Manages overall scansion procedure:
			accept raw text
			detect or accept transliteration scheme
			clean text for scansion
			transliterate text to SLP
			perform syllabification
			determine syllable weights (i.e., convert to l/g pattern)
			count morae per line

		Returns results of each of these steps as attributes of single Verse object.
		"""

		V = Verse()
		V.text_raw = cntnts

		# set up Transliterator and schemes
		T = Transliterator() # default settings
		if from_scheme != None:
			from_scheme = from_scheme.upper()
			T.scheme_in = from_scheme
		elif T.scheme_in.upper() in scheme_detection.auto_detect_synonyms:
			T.set_detected_scheme()

		V.original_scheme = T.scheme_in
		T.scheme_out = 'SLP'

		V.text_cleaned = self.clean_input(V.text_raw, V.original_scheme)
		V.text_SLP = T.transliterate(V.text_cleaned)
		V.text_syllabified = self.syllabify_text(V.text_SLP)
		V.syllable_weights = self.scan_syllable_weights(V.text_syllabified)
		V.morae_per_line = self.count_morae(V.syllable_weights)
		V.gaRa_abbreviations = '\n'.join(
		[ self.gaRa_abbreviate(line) for line in V.syllable_weights.split('\n') ]
		)

		self.Verse = V
		self.Transliterator = T
		return V
