# -*- coding: utf-8 -*-

import sys
import io
import transkrit
import tables
import re
#import settings

"""
	SCANSKRIT  (< 'scan Sanskrit')

	Syllabifies and metrically scans Sanskrit text,
		determining moraic quantities of all syllables
		in text selection of any shape and size.
	All internal processing performed via SLP transliteration format.
"""

syllable_separator = ' ' # | '.'
light = 'l' # | '̆' | 'ल'
heavy = 'g' # | '¯' | 'ग'


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





class Scansion(object):

	def __init__(self):
	
		self.original_text = None
		self.text_in_SLP = None
		self.initial_format = None
		self.final_format = None
		self.syllabified_text = None
		self.syllable_weights = None
	 	self.morae_per_line = None # list


	def summary(self):
		"""
			Returns aligned scansion results as string.
		"""

		out_buffer = ''

		# quick view of syllables and morae
		max_len = max([len(line) for line in self.syllable_weights.split('\n')])
		for i, line in enumerate(self.syllable_weights.split('\n')):
			out_buffer += line + ' ' * (max_len - len(line)) + '\t'
			out_buffer += '[%s]\n' % self.morae_per_line[i]
		out_buffer += '\n'

		# view of syllables and their weights right-aligned to each syllable
		# currently not aligned well
		# once alignment better, can include transliteration of results

		# PROBLEM: WANT TO TRANSLITERATE HERE BUT DON'T HAVE ACCESS TO TRANSLITERATOR WITHIN SCANSION

		syllabified_lines = self.syllabified_text.split('\n')

		for i, syllabified_line in enumerate(syllabified_lines):

			out_buffer += '%s\n' % syllabified_line

			remainder_of_line_for_alignment = syllabified_line
			annotation_line = ''

			for syllable_weight in self.syllable_weights.split('\n')[i]:

				n = remainder_of_line_for_alignment.find(syllable_separator)

				curr_syllable = remainder_of_line_for_alignment[:n]
				remainder_of_line_for_alignment = remainder_of_line_for_alignment[n+1:]

				annotation_line += ' ' * (len(curr_syllable)-1) + syllable_weight + ' '
			
			out_buffer += "%s\n" % annotation_line

		return out_buffer

# 		cumulative_output = ''
# 
# 		# transliterate syllabified text into user's desired encoding for output
# 		output_settings = io.Settings()
# 
# 		T_out = transkrit.Transliterator(self.final_Settings)
# 		final_syllabified = T_out.transliterate(self.syllabified_text)
# 		cumulative_output += "Syllabified text: \n%s" % final_syllabified + '\n\n'
# 
# 		# remaining attributes are in Roman transliteration
# 		# ('l' preferred rather than 'la', etc.)
# 
# 		# HERE: ADD a'S TO DEVANAGARI
# 		
# 		syllable_weights_by_line = self.syllable_weights.split('\n')
# 
# 		cumulative_output += "Syllable weights [morae]:\n"
# 		for i, line in enumerate(syllable_weights_by_line):
# 			cumulative_output += "%s  [%d]\n" % (line, self.morae_per_line[i])
# 
# 		return cumulative_output


class Identifier(object):

	def __init__(self, scnsn):
		
		self.scansion = scnsn	# Scansion() object


	def test_pAdasamatva(self):
		"""
			Accepts list argument detailing pattern of lights/heavies (l/g) in each quarter.
			Returns string detailing how many out of four quarters have same pattern.
		"""

		weights_by_pAda = self.scansion.syllable_weights.split('\n')


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

		weights_by_pAda = self.scansion.syllable_weights.split('\n')


		print "Testing halves ab and cd independently as anuzwuB... " + '\n'

		# test
		pAdas_ab = test_anuzwuB_half_line(weights_by_pAda[0], weights_by_pAda[1])
		pAdas_cd = test_anuzwuB_half_line(weights_by_pAda[2], weights_by_pAda[3])

		# COULD ENABLE DEVANAGARI RESULTS HERE

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

		weights_by_pAda = self.scansion.syllable_weights.split('\n')


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

		weights_by_pAda = self.scansion.syllable_weights.split('\n')

		morae_by_pAda = self.scansion.morae_per_line

		# Note: self.scansion.morae_by_pAda is a list of numbers,
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
		weights_by_pAda = self.scansion.syllable_weights.split('\n')

		anuzwuB_result = self.test_as_anuzwuB()
		if anuzwuB_result != None: return anuzwuB_result

		samavftta_result = self.test_as_samavftta()
		if samavftta_result != None: return samavftta_result

		jAti_result = self.test_as_jAti()
		if jAti_result != None: return jAti_result

		# if here, all three type tests failed
		return None


class Scanner(object):

	def __init__(self, reset_flag=False):

		self.contents = None
		self.transliterator = transkrit.Transliterator(reset_flag)
		self.scansion = Scansion()

# 		self.initial_Settings = transkrit.Settings()
# 		self.initial_Settings.initial_format = sttngs.initial_format
# 		self.initial_Settings.final_format = 'SLP'

# 		self.final_Settings = transkrit.Settings()
# 		self.final_Settings.initial_format = 'SLP'
# 		self.final_Settings.final_format = sttngs.final_format

#		self.text_in_SLP = None


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

		self.scansion.syllabified_text = syllabified_text[:-1] # sans final newline


	def scan_syllables(self):
		"""
			Argument is internal, multi-line string containing text syllabified with syllable_separator.
			Returns corresponding multi-line string detailing pattern of lights/heavies (l/g).
		"""

		syllable_weights = ''

		# do one line at a time
		text_lines = self.scansion.syllabified_text.split('\n')

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

		self.scansion.syllable_weights = syllable_weights[:-1] # sans final newline


	def count_morae(self):
		"""
			Accepts multi-line string argument detailing pattern of lights/heavies (l/g).
			Returns list of length equal to number of lines in argument,
				detailing number of morae found in each line.
		"""

		morae_per_line = []

		weights_by_line = self.scansion.syllable_weights.split('\n')

		for line in weights_by_line:
			morae_per_line.append( line.count('l') * 1 + line.count('g') * 2 )

		self.scansion.morae_per_line = morae_per_line


	def scan(self, cntnts):
		"""
			Stores results of syllabification, scansion, and morae count in internal attributes.
		"""

		self.scansion.original_text = cntnts

		self.transliterator.settings.update()
		self.transliterator.settings.save()

		initial_format = self.transliterator.settings.initial_format

		self.text_in_SLP = self.transliterator.transliterate(cntnts, initial_format, 'SLP')
		
# 		T_in = transkrit.Transliterator(self.initial_Settings)
# 		self.text_in_SLP = T_in.transliterate(orig_cntnt_txt)

		self.syllabify_text()
# 
# 		print self.scansion.syllabified_text
# 		raw_input()

		self.scan_syllables()
# 
# 		print self.scansion.syllable_weights
# 		raw_input()
# 
		self.count_morae()
# 
# 		print self.scansion.morae_per_line
# 		raw_input()

		return self.scansion


if __name__ == '__main__':
	"""
		Demonstrate basic use of objects.
	"""

	# just for demo run, grab from file, status update
	io.clear_screen()
	contents = io.load()
	print '\n' + "Input: \n%s" % (contents) + '\n'
	out_buffer = contents + '\n\n'

# 	Sttngs = settings.Settings()
	
	# just for demo run, convenient to be able to pass command-line argument
	# if settings file newly created, will be redundant
# 	if len(sys.argv) > 1 and '--reset' in sys.argv:
# 		Sttngs.update()	# also can use to override at any point
	reset_flag = False
	if len(sys.argv) > 1 and '--reset' in sys.argv:
		reset_flag = True

	Scnr = Scanner(reset_flag)
#	Scnr = Scanner(reset_flag=True)	# same, no need to check command line arg

	scansion = Scnr.scan(contents) # Scansion() object

	# VERY TEMPORARY TEST
	scansion.syllabified_text = Scnr.transliterator.transliterate(scansion.syllabified_text)

	summary_of_results = scansion.summary()

# 	print Scnr.transliterator.transliterate(summary_of_results)

	print summary_of_results

	Idntfr = Identifier(scansion)

	identified_as = Idntfr.identify()

	print identified_as
	print

	# just for demo run, status update
# 
# 	print "Transliterating %s > %s..." % (Sttngs.initial_format, Sttngs.final_format)
# 	print
# 
# 	T = transkrit.Transliterator(Scnr.final_Settings)
# 	identified_as = T.transliterate(identified_as)

	# just for demo run, status update, save to file
#	print "%s\nSolution: %s\n" % (summary, identified_as)
	out_buffer = "%s\nSolution: %s" % (summary_of_results, identified_as)
	io.save(out_buffer)