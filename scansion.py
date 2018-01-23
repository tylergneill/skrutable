#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
	Syllabifies and metrically scans Sanskrit text.
	Determines moraic quantities of all syllables.
	Identifies name of meter when known.
	Accepts text of any shape and size.
	Uses SLP under-the-hood.
"""

import sys
import demo_io
import re
import transliteration as tr
from transliteration import TransliterationSettings # pickle bug workaround
import tables

syllable_separator = ' ' # | '.'
light = 'l' # | '̆' | 'ल'
heavy = 'g' # | '¯' | 'ग'


class ScansionResults(object):

	def __init__(self, Scanner, final_scheme=None):
	
		self.original_text = None
		self.text_in_SLP = None
		self.syllabified_text = None
		self.syllable_weights = None
	 	self.morae_per_line = None # list
		self.Scanner = Scanner # parent
		self.final_scheme = fin_f

	def summary(self):
		"""
			Returns scansion results as string, with weights aligned to vowels.
			Algorithm:
				FIRST PART
				find longest line (long_line_len)
				right-align lines with spacing of long_line_len + 2, then morae with 6
				SECOND PART
				find longest syllable string length (long_syll_len)
				right-align everything with spacing of long_syll_len + 2

			If successful, try transliterating.

		"""
	
		out_buffer = ''

		longest_line_len = max([len(line) for line in self.syllable_weights.split('\n')])
		buffer_line = '%%%ds' % longest_line_len + ' %6s\n' % '[%s]'

		# quick view of syllables and morae
		for i, line in enumerate(self.syllable_weights.split('\n')):
			out_buffer += buffer_line % (line, self.morae_per_line[i])
		out_buffer += '\n'

		transl_syll_txt = self.Scanner.Transliterator.transliterate(self.syllabified_text, from_scheme='SLP')

		line_max = []
		for syllabified_line in transl_syll_txt.split('\n'):
			line_max.append(max([len(s_w) for s_w in syllabified_line.decode('utf-8').split(' ')]))
		long_syll_len = max(line_max)

		buffer_bit = '%%%ds' % (long_syll_len + 2)

		for i, syllabified_line in enumerate(transl_syll_txt.split('\n')):
			# display syllables themselves
			for syll in syllabified_line.decode('utf-8').split(' '):
				out_buffer += buffer_bit % syll
			out_buffer += '\n'
			# display corresponding weights
			for s_w in self.syllable_weights.split('\n')[i]:
				out_buffer += buffer_bit % s_w
			out_buffer += '\n'

		return out_buffer


	def test_pAdasamatva(self):
		"""
			Accepts list argument detailing pattern of lights/heavies (l/g) in each quarter.
			Returns string detailing how many out of four quarters have same pattern.
		"""

		weights_by_pAda = self.syllable_weights.split('\n')


		# eliminating trailing syllable_separator, abbreviate name for below
		w_p = [pAda[:-1] for pAda in weights_by_pAda]

		# error checking: empty argument
		if w_p[0] == w_p[1] == w_p[2] == w_p[3] == '':
			print "Error: test_pAdasamatva, empty argument."
			return None

		# all 4 same
		if w_p[0] == w_p[1] == w_p[2] == w_p[3]:
			return '4/4'

		# 3 out of 4 same
		elif (	w_p[0] ==	w_p[1] == 	w_p[2] 				or
				w_p[0] ==	w_p[1] ==				w_p[3]	or
				w_p[0] ==				w_p[2] ==	w_p[3]	or
							w_p[1] == 	w_p[2] ==	w_p[3]
			 ):
			return '3/4'

		# 2 out of 4 same
		elif (	w_p[0] ==	w_p[1] 							or
				w_p[0] ==				w_p[2] 				or
				w_p[0] ==							w_p[3] 	or
							w_p[1] ==	w_p[2] 				or
							w_p[1] ==				w_p[3] 	or
										w_p[2] ==	w_p[3]
			 ):
			return '2/4'

		# no matches whatsoever
		else:
			return '0/4'


	def test_as_anuzwuB(self):
		"""
			Accepts as arugment a list of strings detailing light/heavy (l/g) patterns.
			Determines whether verse (first four lines) is of 'anuzwuB' type.
			Returns string detailing results if identified as such, or None if not.
			Tests halves ab and cd independently, reports if either half found to be valid.
		"""

		weights_by_pAda = self.syllable_weights.split('\n')


		print "Testing halves ab and cd independently as anuzwuB... " + '\n'

		# test
		pAdas_ab = test_anuzwuB_half_line(weights_by_pAda[0], weights_by_pAda[1])
		pAdas_cd = test_anuzwuB_half_line(weights_by_pAda[2], weights_by_pAda[3])

		# report results
		if pAdas_ab != None and pAdas_cd != None:
			return "anuzwuB (ab: " + pAdas_ab + ", cd: " + pAdas_cd + ")"
		elif pAdas_ab == None and pAdas_cd != None:
			return "anuzwuB (ab: invalid, cd: " + pAdas_cd + ")"
		elif pAdas_ab != None and pAdas_cd == None:
			return "anuzwuB (ab: " + pAdas_ab + ", cd: invalid)"
		else:
			return None


	def test_as_samavftta(self):
		"""
			Accepts as arugment a list of strings detailing light/heavy (l/g) patterns.
			Determines whether verse (first four lines) is of 'samavftta' type.
			Returns string detailing results if identified as such, or None if not.
			Tolerates one incorrect quarter out of four, notes when applicable.
		"""

		weights_by_pAda = self.syllable_weights.split('\n')


		print "Testing entire stanza as samavftta... " + '\n'
		samatva_results = self.test_pAdasamatva()

		if samatva_results in ['4/4', '3/4', '2/4']:

			# in case first line is odd one out, choose second for identification
			if (weights_by_pAda[0] != weights_by_pAda[1]
				and weights_by_pAda[1] == weights_by_pAda[2]):
				pAda_for_id = weights_by_pAda[1]

			# otherwise use first pada
			else:
				pAda_for_id = weights_by_pAda[0]

			pAda_gaRas = gaRa_abbreviate(pAda_for_id)

			for gaRa_pattern in tables.samavfttas_by_gaRas:

				regex = re.compile(gaRa_pattern)

				if re.match(regex, pAda_gaRas):

					gaRa_note = ' (%s)' % (gaRa_pattern[:-5] + gaRa_pattern[-4])

					if samatva_results == '3/4': gaRa_note += " (1 quarter incorrect)"

					return tables.samavfttas_by_gaRas[gaRa_pattern] + gaRa_note

			else: # if all patterns tested and no match found and returned
				return "(unclassified samavftta)"
	#
	# 	# eventually: also test as ardhasamavftta
	# 	elif stanza_weights[0] == stanza_weights[2]
	# 		and stanza_weights[1] == stanza_weights[3]: pass

		else:
			return None


	def test_as_jAti(self):
		"""
			Accepts as arguments two lists, one of strings, the other of numbers.
			First argument details light/heavy (l/g) patterns, second reports total morae.
			Determines whether verse (first four lines) is of 'jAti' type.
			Returns string detailing results if identified as such, or None if not.
		"""

		weights_by_pAda = self.syllable_weights.split('\n')

		morae_by_pAda = self.morae_per_line

		# Note: self.morae_by_pAda is a list of numbers,
		# here manipulate as such but also as a single string
		morae_by_pAda_string = str(morae_by_pAda)

		print "Testing entire stanza as jAti..." + '\n'
		print "Morae: %s" % morae_by_pAda_string + '\n'

		"""
			Test whether morae match patterns, with allowance on last syllable:
				final light syllable of a jAti quarter CAN be counted as heavy,
				but ONLY if absolutely necessary
				and NOT otherwise.
		"""
		for flex_pattern, std_pattern, jAti_name in tables.jAtis_by_morae:

			regex = re.compile(flex_pattern)
			if re.match(regex, morae_by_pAda_string):

				# for each of four pAdas
				for i in range(4):

					if	(
						morae_by_pAda[i] == std_pattern[i] or

						# final syllable is light but needs to be heavy
						morae_by_pAda[i] == std_pattern[i] - 1 and
						weights_by_pAda[i][-1] == 'l'

						):
						continue
					else:
						break

				else: # if all four pAdas proven valid, i.e., if no breaks
					return jAti_name + " (jAti)"

		else: # if all patterns tested and nothing returned
			return None


	def identify(self):

		# list needed for testing for all three types
		weights_by_pAda = self.syllable_weights.split('\n')

		anuzwuB_result = self.test_as_anuzwuB()
		if anuzwuB_result != None: return anuzwuB_result

		samavftta_result = self.test_as_samavftta()
		if samavftta_result != None: return samavftta_result

		jAti_result = self.test_as_jAti()
		if jAti_result != None: return jAti_result

		# if here, all three type tests failed
		return None


class Scanner(object):

	def __init__(self, initial_scheme=None, final_scheme=None):

		self.contents = None
		self.Transliterator = tr.Transliterator(default_from=initial_scheme, default_to=final_scheme)
		self.ScansionResults = ScansionResults(self, final_scheme=final_scheme)


	def syllabify_text(self):
		"""
			Accepts multi-line string argument containing text.
			Syllabifies according to simple principle of most possible open syllables.
			Returns corresponding multi-line string containing text syllabified with syllable_separator.
		"""

		# e.g. text == 'yadA yadA hi Darmasya glAnir Bavati BArata /\naByutTAnam aDarmasya...'

		# eliminate irrelevant horizontal white space, punctuation, and numbers (expand set as needed)
		white_space = ' \t';	punctuation = ".,\/|-'’";	numbers ="0123456789०१२३४५६७८९"
		for c in (white_space + punctuation + numbers): self.text_in_SLP = self.text_in_SLP.replace(c,'')

		# e.g. 'yadAyadAhiDarmasyaglAnirBavatiBArata\naByutTAnamaDarmasya...'

		syllabified_text = '' # buffer

		# syllabify one line at a time
		text_lines = self.text_in_SLP.split('\n')

		for line in text_lines:

			# line == e.g. 'yadAyadAhiDarmasyaglAnirBavatiBArata'

			syllabified_line = ''

			# place syllable_separator after vowels
			for letter in line:

				syllabified_line += letter

				if letter in tables.all_vowels_SLP:
					syllabified_line += syllable_separator

			# e.g. 'ya.dA.ya.dA.hi.Da.rma.sya.glA.ni.rBa.va.ti.BA.ra.ta.'
			# BUT e.g. 'a.Byu.tTA.na.ma.Da.rma.sya.ta.dA.tmA.na.Msf.jA.mya.ha.m'

			# readjust final syllable_separator for final consonant(s)
			if syllabified_line[-1] in tables.all_consonants_SLP + ['M', 'H']:

				# final '.' is incorrect, remove
				fnl_prd = syllabified_line.rfind(syllable_separator)
				syllabified_line = syllabified_line[:fnl_prd] + syllabified_line[fnl_prd+1:]

				syllabified_line += syllable_separator

			# e.g. 'a.Byu.tTA.na.ma.Da.rma.sya.ta.dA.tmA.na.Msf.jA.mya.ham.'

			syllabified_text += syllabified_line + '\n'

		self.ScansionResults.syllabified_text = syllabified_text[:-1] # sans final newline


	def scan_syllables(self):
		"""
			Argument is internal, multi-line string containing text syllabified with syllable_separator.
			Returns corresponding multi-line string detailing pattern of lights/heavies (l/g).
		"""

		syllable_weights = ''

		# do one line at a time
		text_lines = self.ScansionResults.syllabified_text.split('\n')

		for line in text_lines:

			weights_for_this_line = ''

			syllables = line.split(syllable_separator)
			syllables.pop(-1) # last '.' generates spurious empty syllable, delete

			for n, syllable in enumerate(syllables):

				if (
					# heavy by nature
					syllable[-1] in tables.long_vowels_SLP

					or

					# heavy by position:
					# consonant closes syllable or is second letter of next syllable
					syllable[-1] in (tables.all_consonants_SLP + ['M', 'H']) or
					n <= (len(syllables)-2) and len(syllables[n+1]) > 1 and syllables[n+1][1] in (tables.all_consonants_SLP + ['M', 'H'])

					):

					weights_for_this_line += 'g'
					# weights_for_this_line += 'g_'
					# insofar as two 'l's can equal one 'g', could use this alternative for better visual alignment

				else:

					weights_for_this_line += 'l'

			syllable_weights += weights_for_this_line + '\n'

		self.ScansionResults.syllable_weights = syllable_weights[:-1] # sans final newline


	def count_morae(self):
		"""
			Accepts multi-line string argument detailing pattern of lights/heavies (l/g).
			Returns list of length equal to number of lines in argument,
				detailing number of morae found in each line.
		"""

		morae_per_line = []

		weights_by_line = self.ScansionResults.syllable_weights.split('\n')

		for line in weights_by_line:
			morae_per_line.append( line.count('l') * 1 + line.count('g') * 2 )

		self.ScansionResults.morae_per_line = morae_per_line


	def scan(self, cntnts):
		"""
			Stores results of syllabification, scansion, and morae count in internal attributes.
		"""

		self.ScansionResults.original_text = cntnts

		self.text_in_SLP = self.Transliterator.transliterate(cntnts, to_scheme='SLP')
		
		self.syllabify_text()
		self.scan_syllables()
		self.count_morae()

		# want to eventually transliterate results to IAST for display...

		return self.ScansionResults



def gaRa_abbreviate(syllable_weights):
	"""
		Accepts string with pattern of light/heavy syllables (l/g), e.g. 'lllgggl'.
		Returns string corresponding to 'gaRa'-trisyllable abbreviation, e.g. 'nml'.
	"""

	weights_of_curr_gaRa = ''
	overall_abbreviation = ''

	for single_weight in syllable_weights:
		weights_of_curr_gaRa += single_weight
		if len(weights_of_curr_gaRa) == 3:
			overall_abbreviation += tables.gaRas_by_weights[weights_of_curr_gaRa]
			weights_of_curr_gaRa = ''

	# leftover lights and heavies (l/g)
	overall_abbreviation += weights_of_curr_gaRa

	return overall_abbreviation


def test_anuzwuB_half_line(odd_pAda_weights, even_pAda_weights):
	"""
		Accepts as arguments two strings detailing light/heavy (l/g) patterns.
		Determines whether a single half-line,
			which is comprised of one odd and one even quarter ('pAda'),
			is of 'anuzwuB' type.
		Returns string detailing results if identified as such, or None if not.
	"""

	"""
		First check relatively rigid structure of even pAda:
		1. Syllables 1 and 8 ALWAYS anceps.
		2. Syllables 2 and 3 NEVER both light.
		3. Syllables 2-4 NEVER ra-gaRa (glg).
		4. Syllables 5-7 ALWAYS has ja-gaRa (lgl).
	"""
	regex = re.compile('^(?!.ll.|.glg).{4}lgl.$')
	if not re.match(regex, even_pAda_weights):
		return None

	# then check for various valid patterns of odd pAda (both 'paTyA' and 'vipulA')
	for weights_pattern in tables.anuzwuB_odd_pAda_types_by_weights:

		regex = re.compile(weights_pattern)

		if re.match(regex, odd_pAda_weights):
			return tables.anuzwuB_odd_pAda_types_by_weights[weights_pattern]

	# if here, then no hits found
	return None




def gaRa_abbreviate(syllable_weights):
	"""
		Accepts string with pattern of light/heavy syllables (l/g), e.g. 'lllgggl'.
		Returns string corresponding to 'gaRa'-trisyllable abbreviation, e.g. 'nml'.
	"""

	weights_of_curr_gaRa = ''
	overall_abbreviation = ''

	for single_weight in syllable_weights:
		weights_of_curr_gaRa += single_weight
		if len(weights_of_curr_gaRa) == 3:
			overall_abbreviation += tables.gaRas_by_weights[weights_of_curr_gaRa]
			weights_of_curr_gaRa = ''

	# leftover lights and heavies (l/g)
	overall_abbreviation += weights_of_curr_gaRa

	return overall_abbreviation


def test_anuzwuB_half_line(odd_pAda_weights, even_pAda_weights):
	"""
		Accepts as arguments two strings detailing light/heavy (l/g) patterns.
		Determines whether a single half-line,
			which is comprised of one odd and one even quarter ('pAda'),
			is of 'anuzwuB' type.
		Returns string detailing results if identified as such, or None if not.
	"""

	"""
		First check relatively rigid structure of even pAda:
		1. Syllables 1 and 8 ALWAYS anceps.
		2. Syllables 2 and 3 NEVER both light.
		3. Syllables 2-4 NEVER ra-gaRa (glg).
		4. Syllables 5-7 ALWAYS has ja-gaRa (lgl).
	"""
	regex = re.compile('^(?!.ll.|.glg).{4}lgl.$')
	if not re.match(regex, even_pAda_weights):
		return None

	# then check for various valid patterns of odd pAda (both 'paTyA' and 'vipulA')
	for weights_pattern in tables.anuzwuB_odd_pAda_types_by_weights:

		regex = re.compile(weights_pattern)

		if re.match(regex, odd_pAda_weights):
			return tables.anuzwuB_odd_pAda_types_by_weights[weights_pattern]

	# if here, then no hits found
	return None



if __name__ == '__main__':
	"""
		Demos basic use of objects.
		Takes input from file. Command-line flag resets transliteration settings.
		Outputs to screen and to file.
	"""

	# for demo
	demo_io.clear_screen()
	contents = demo_io.load() # see module for filenames
	print '\n' + "Input: \n%s" % (contents) + '\n'
 	out_buffer = contents + '\n\n'


	# for demo: command-line flag for menu prompt and replacement of settings
	init_f = None
	fin_f = None
	if 	(
		len(sys.argv) > 1 and '--prompt' in sys.argv or
		T.settings.initial_scheme == None
		):
		init_f = tr.prompt_for_choice('Input', tables.available_schemes)
		fin_f = tr.prompt_for_choice('Output', tables.available_schemes)

	Sc = Scanner(init_f, fin_f)	# loads previous settings from file

	# other constructor option
#	Sc = Scanner()
# 	Sc = Scanner(initial_scheme='HK')
# 	Sc = Scanner(initial_scheme='HK', final_scheme='IAST')

	# for demo (other half of command-line flag part above)
	if init_f != None: Sc.Transliterator.settings.save()

	# for demo
	print "%s > %s..." % (Sc.Transliterator.settings.initial_scheme, Sc.Transliterator.settings.final_scheme)
	print

	ScansionResult = Sc.scan(contents)
	# no structure assumed for input, lines simply analyzed as such
	# returns populated ScansionResults() object

	# for demo
	summary_of_results = ScansionResult.summary()
	print summary_of_results

	identified_as = ScansionResult.identify()
	# 4-pāda structure assumed
	# eventually will develop methods to work with less structured input
	# returns string

	# for demo
	print identified_as
 	print

 	out_buffer = "%s\nSolution: %s" % (summary_of_results.encode('utf-8'), identified_as)
 	demo_io.save(out_buffer)