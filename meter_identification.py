from skrutable.scansion import Scanner as Sc
from skrutable.scansion import scansion_syllable_separator
from skrutable.scansion import Verse
from skrutable import meter_patterns
from skrutable.transliteration import Transliterator as Tr
from skrutable.config import load_config_dict_from_json_file
import re
from copy import copy

# load config variables
config = load_config_dict_from_json_file()
default_resplit_option = config["default_resplit_option"] # e.g. "none"

class VerseTester(object):
	"""
	Internal agent-style object.

	Most methods take a populated scansion.Verse object as an argument;
	test_as_anuzwuB_odd_even() is an exception.

	Primary method attempt_none_identification returns scansion.Verse object
	with populated meter_label attribute if identification was successful.
	"""

	def __init__(self):
		"""Internal constructor"""
		pass # agent-style object is just a collection of methods

	def test_as_anuzwuB_odd_even(self, odd_candidate_weights, even_candidate_weights):
		"""
		Accepts two strings of syllable weights (e.g. 'llglgllg').
		Tries to match to known odd-even 'anuṣṭubh' foot pairings:
			pathya
			vipulā (4.5 subtypes: na, ra, ma, bha, and variant bha).
		Returns string result if match found, None otherwise.
		"""

		"""
		First check relatively rigid structure of even pAda:
		1. Syllables 1 and 8 ALWAYS anceps.
		2. Syllables 2 and 3 NEVER both light.
		3. Syllables 2-4 NEVER ra-gaRa (glg).
		4. Syllables 5-7 ALWAYS has ja-gaRa (lgl).
		"""
		# regex = re.compile('^(?!.ll.|.glg).{4}lgl.$')
		regex = re.compile( meter_patterns.anuzwuB_pAda['even'] )
		if not re.match(regex, even_candidate_weights):
			return None

		# then check for various valid patterns of odd pAda (both 'paTyA' and 'vipulA')
		for weights_pattern in meter_patterns.anuzwuB_pAda['odd'].keys():
			regex = re.compile(weights_pattern)
			if re.match(regex, odd_candidate_weights):
				return meter_patterns.anuzwuB_odd_pAda_types_by_weights[weights_pattern]

		else:
			return None

	def test_as_anuzwuB(self, Vrs):
		"""
		Accepts as arugment a list of strings detailing light/heavy (l/g) patterns.
		Determines whether verse (first four lines) is of 'anuṣṭubh' type.
		Returns string detailing results if identified as such, or None if not.
		Tests halves ab and cd independently, reports if either half found to be valid.
		"""

		w_p = Vrs.syllable_weights.split('\n') # weights by pāda
		try: w_p[3]
		except IndexError: return None # didn't find full four pādas

		# test
		pAdas_ab = self.test_as_anuzwuB_odd_even(w_p[0], w_p[1])
		pAdas_cd = self.test_as_anuzwuB_odd_even(w_p[2], w_p[3])

		# report results
		if pAdas_ab != None and pAdas_cd != None:
			return "anuṣṭubh (ab: " + pAdas_ab + ", cd: " + pAdas_cd + ")"
		elif pAdas_ab == None and pAdas_cd != None:
			return "anuṣṭubh (ab: asamīcīna, cd: " + pAdas_cd + ")"
		elif pAdas_ab != None and pAdas_cd == None:
			return "anuṣṭubh (ab: " + pAdas_ab + ", cd: asamīcīna)"
		else:
			return None

	def test_pAdasamatva(self, Vrs):
		"""
		Accepts four-part (newline-separated) string of light/heavy (l/g) pattern.
		Since testing for samavṛtta, ignores final anceps syllable in each part.
		Returns integer 0,2,3,4 indicating size of best matching group.
		"""

		# weights by pāda, omitting last syllable from consideration
		w_p = [ full_w_p[:-1] for full_w_p in Vrs.syllable_weights.split('\n') ]
		try: w_p[3]
		except IndexError: return None # didn't find full four pādas

		# check for empty argument
		if w_p[0] == w_p[1] == w_p[2] == w_p[3] == '':
			return None

		# all 4 same
		if w_p[0] == w_p[1] == w_p[2] == w_p[3]:
			return 4

		# 3 out of 4 same
		elif (	w_p[0] ==	w_p[1] ==	w_p[2]				or
				w_p[0] ==	w_p[1] ==				w_p[3]	or
				w_p[0] ==				w_p[2] ==	w_p[3]	or
							w_p[1] ==	w_p[2] ==	w_p[3]
			 ):
			return 3

		# 2 out of 4 same
		elif (	w_p[0] ==	w_p[1]							 or
				w_p[0] ==				w_p[2]				 or
				w_p[0] ==							w_p[3]	 or
							w_p[1] ==	w_p[2]				 or
							w_p[1] ==				w_p[3]	 or
										w_p[2] ==	w_p[3]
			 ):
			return 2

		# no matches whatsoever
		else:
			return 0


	def test_as_samavftta(self, Vrs):

		"""
			Accepts as arugment a list of strings detailing light/heavy (l/g) patterns.
			Determines whether verse (first four lines) is of 'samavṛtta' type.
			Returns string detailing results if identified as such, or None if not.
			Tolerates one incorrect quarter out of four, notes when applicable.
		"""

		w_p = Vrs.syllable_weights.split('\n') # weights by pāda
		try: w_p[3]
		except IndexError: return None # didn't find full four pādas

		samatva_result = self.test_pAdasamatva(Vrs)

		# HERE: FIRST TEST FOR ardhasamavftta
		if (	samatva_result == 2
				and w_p[0] == w_p[2] and w_p[1] == w_p[3]
			):
			# return("ardhasamavftta...")
			pass

		# otherwise, proceed with normal samavftta test
		if samatva_result in [4, 3, 2]:

			i = 0 # assume first pāda of four is a good representative for all
			# but if not, then find one
			while w_p[i] not in w_p[i+1:]: i += 1

			pAda_for_id = w_p[i]

			S = Sc()
			pAda_gaRas = S.gaRa_abbreviate(pAda_for_id)

			for gaRa_pattern in meter_patterns.samavfttas_by_gaRas:

				regex = re.compile(gaRa_pattern)

				if re.match(regex, pAda_gaRas):

					gaRa_note = ' (%s)' % (gaRa_pattern[:-5] + gaRa_pattern[-4])

					if samatva_result in [2, 3]:
						gaRa_note += " (%d eva pādāḥ samyak)" % samatva_result

					return meter_patterns.samavfttas_by_gaRas[gaRa_pattern] + gaRa_note

			else: # if all patterns tested and no match found and returned
				return "(ajñātasamavṛtta?) (%d: %s)" % (len(pAda_for_id), pAda_gaRas)

		else:
			return None


	def test_as_jAti(self, Vrs):
		"""
		Accepts as arguments two lists, one of strings, the other of numbers.
		First argument details light/heavy (l/g) patterns, second reports total morae.
		Determines whether verse (first four lines) is of 'jāti' type.
		Returns string detailing results if identified as such, or None if not.
		"""

		w_p = Vrs.syllable_weights.split('\n')
		try: w_p[3]
		except IndexError: return None # didn't find full four pādas

		morae_by_pAda = Vrs.morae_per_line

		# Note: self.morae_by_pAda is a list of numbers,
		# here manipulate as such but also as a single string
		morae_by_pAda_string = str(morae_by_pAda)

		"""
			Test whether morae match patterns, with allowance on last syllable:
				final light syllable of a jāti quarter CAN be counted as heavy,
				but ONLY if absolutely necessary
				and NOT otherwise.
		"""
		for flex_pattern, std_pattern, jAti_name in meter_patterns.jAtis_by_morae:

			regex = re.compile(flex_pattern)
			if re.match(regex, morae_by_pAda_string):

				# for each of four pAdas
				for i in range(4):

					if	(
						morae_by_pAda[i] == std_pattern[i] or

						# final syllable is light but needs to be heavy
						morae_by_pAda[i] == std_pattern[i] - 1 and
						w_p[i][-1] == 'l'

						):
						continue
					else:
						break

				else: # if all four pAdas proven valid, i.e., if no breaks
					return jAti_name + " (jāti)"

		else: # if all patterns tested and nothing returned
			return None



	def attempt_none_identification(self, Vrs):
		"""
		= old ScansionResults.identify

		runs through various possible meter types in set order
			MAYBE SET ORDER IN CONFIG

		Receives static, populated Verse object on which to attempt identification.
		"""

		# DOES THIS ORDER MATTER? SHOULD I GENERALIZE IT?

		anuzwuB_result = self.test_as_anuzwuB(Vrs)
		if anuzwuB_result != None: return anuzwuB_result

		samavftta_result = self.test_as_samavftta(Vrs)
		if samavftta_result != None: return samavftta_result

		jAti_result = self.test_as_jAti(Vrs)
		if jAti_result != None: return jAti_result

		# if here, all three type tests failed
		return None


class MeterIdentifier(object):
	"""
	User-facing agent-style object.

	Primary method identify_meter() accepts string.

	Returns single Verse object, whose attribute meter_label
	and method summarize() help in revealing identification results.
	"""

	def __init__(self):
		self.Scanner = None
		self.VerseTester = None
		self.Verses_found = [] # list of Verse objects which passed VerseTester


	def wiggle_iterator(self, start_pos, part_len):
		"""
		E.g., if len(pāda)==10,
		then from the breaks between each pāda,
		wiggle as far as 6 in either direction,
		first right, then left.
		"""

		iter_list = [start_pos]
		max_wiggle_distance = int(part_len / 2 + 1)
		for i in range(1, max_wiggle_distance):
			iter_list.append(start_pos+i)
			iter_list.append(start_pos-i)
		return iter_list

	def resplit_Verse(self, syllable_list, ab_pAda_br, bc_pAda_br, cd_pAda_br):
		"""
		Input does not have newlines
		"""
		sss = scansion_syllable_separator
		return	( 		sss.join(syllable_list[:ab_pAda_br]) 			+ '\n'
					+ 	sss.join(syllable_list[ab_pAda_br:bc_pAda_br]) 	+ '\n'
					+ 	sss.join(syllable_list[bc_pAda_br:cd_pAda_br]) 	+ '\n'
					+ 	sss.join(syllable_list[cd_pAda_br:])
				)

	def wiggle_identify(	self, Vrs, syllable_list, VrsTster,
							ab_pAda_br, bc_pAda_br, cd_pAda_br, quarter_len):
		"""Returns a list for MeterIdentifier.Verses_found"""

		ab_wiggle_iterator = self.wiggle_iterator(ab_pAda_br, quarter_len)
		bc_wiggle_iterator = self.wiggle_iterator(bc_pAda_br, quarter_len)
		cd_wiggle_iterator = self.wiggle_iterator(cd_pAda_br, quarter_len)

		wiggle_resplit_output_buffer = ''
		temp_V = None
		S = Sc()
		Verses_found = []

		for pos_ab in ab_wiggle_iterator:
			for pos_bc in bc_wiggle_iterator:
				for pos_cd in cd_wiggle_iterator:

					try:

						new_text_syllabified = self.resplit_Verse(
							syllable_list, pos_ab, pos_bc, pos_cd )

						temp_V = copy(Vrs)
						temp_V.text_syllabified = new_text_syllabified
						temp_V.syllable_weights = S.scan_syllable_weights(temp_V.text_syllabified)
						temp_V.morae_per_line = S.count_morae(temp_V.syllable_weights)

						id_result = VrsTster.attempt_none_identification(temp_V)

						if id_result != None:
							temp_V.meter_label = id_result
							Verses_found.append(temp_V)

					except IndexError:
						continue

		return Verses_found


	def identify_meter(self, rw_str, resplit_option=default_resplit_option, from_scheme=None):
		"""
		User-facing method, manages overall identification procedure:
			accepts raw string
			sends string to Scanner.scan, receives back scansion.Verse object
			then, according to segmentation mode
				makes and passes series of Verse objects to internal VerseTester
				receives back tested Verses (as internally available dict)
			returns single Verse object with best identification result

		four segmentation modes:
			1) none: uses three newlines exactly as provided in input
			2) resplit_hard: discards input newlines, resplits based on overall length
			3) resplit_soft: initializes length-based resplit with input newlines
			4) single_pAda: evaluates input as single pAda (verse quarter)

		order
			first: default or override
			if fails, then: try other modes in set order (1 2 3; depending on length 4)

		"""

		self.Scanner = S = Sc()

		V = S.scan(rw_str, from_scheme=from_scheme)	# gets back mostly populated Verse object

		self.VerseTester = VT = VerseTester()

		if resplit_option == 'none':

			V.meter_label = VT.attempt_none_identification(V)

		elif resplit_option in ['resplit_hard', 'resplit_soft']:

			if resplit_option == 'resplit_soft':
				# capture user pāda breaks as indicated by newlines
				newline_indices = [m.start() for m in re.finditer('\n', V.text_syllabified)]

				try: newline_indices[2]
				except IndexError: return V # didn't find three newlines for four pādas

				ab_pAda_br = V.text_syllabified[:newline_indices[0]].count(scansion_syllable_separator)
				bc_pAda_br = V.text_syllabified[:newline_indices[1]].count(scansion_syllable_separator)
				cd_pAda_br = V.text_syllabified[:newline_indices[2]].count(scansion_syllable_separator)

			# make list, sans newlines, sans last scansion_syllable_separator
			syllable_list = (	V.text_syllabified.replace('\n','')
						).split(scansion_syllable_separator)

			try:
				while syllable_list[-1] == '':
					syllable_list.pop(-1) # in case of final separator(s)
			except IndexError: pass

			total_syll_count = len(syllable_list)
			quarter_len = int(total_syll_count / 4)

			if resplit_option == 'resplit_hard':
				# discard user pāda breaks, initialize length-based ones
				ab_pAda_br, bc_pAda_br, cd_pAda_br = (
					[ i * quarter_len for i in [1, 2, 3] ] )

			self.Verses_found = self.wiggle_identify( V, syllable_list, VT,
							ab_pAda_br, bc_pAda_br, cd_pAda_br, quarter_len )

			# could look for best match if len(self.Verses_found) > 1
			if len(self.Verses_found) > 0:
				V = self.Verses_found[0]

		return V
