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
default_resplit_option = config["default_resplit_option"]  # e.g. "none"


class VerseTester(object):
	"""
	Internal agent-style object.

	Most methods take a populated scansion.Verse object as an argument;
	test_as_anuzwuB_odd_even() is an exception.

	Primary method attempt_identification returns scansion.Verse object
	with populated meter_label attribute if identification was successful.
	"""

	def __init__(self):
		"""Internal constructor"""
		self.anuzwuB_result = None # string
		self.pAdasamatva_count = 0 # int
		self.strict_trizwuB_count = 0 # int
		self.loose_eleven_count = 0 # int
		self.trizwuB_types_found = None # list of strings
		self.samavftta_result = None # string
		self.upajAti_result = None # string
		# >> samavftta_and_or_upajAti_result = None # string
		self.jAti_result = None # string

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
		regex = re.compile(meter_patterns.anuzwuB_pAda['even'])
		if not re.match(regex, even_candidate_weights):
			return None

		# then check for various valid patterns of odd pAda (both 'paTyA' and 'vipulA')
		for weights_pattern in meter_patterns.anuzwuB_pAda['odd'].keys():
			regex = re.compile(weights_pattern)
			if re.match(regex, odd_candidate_weights):
				return meter_patterns.anuzwuB_odd_pAda_types_by_weights[weights_pattern]
				# replace with: return meter_patterns.anuzwuB_pAda['odd'][weights_pattern]

		else:
			return None

	def test_as_anuzwuB(self, Vrs):
	# >> def test_as_zloka(self, Vrs):
		"""
		Accepts as arugment a list of strings detailing light/heavy (l/g) patterns.
		Determines whether verse (first four lines) is of 'anuṣṭubh' type.
		Returns string detailing results if identified as such, or None if not.
		Tests halves ab and cd independently, reports if either half found to be valid.
		"""

		w_p = Vrs.syllable_weights.split('\n')  # weights by pāda
		try:
			w_p[3]
		except IndexError:
			return None  # didn't find full four pādas

		# test
		pAdas_ab = self.test_as_anuzwuB_odd_even(w_p[0], w_p[1])
		pAdas_cd = self.test_as_anuzwuB_odd_even(w_p[2], w_p[3])

		# report results
		if pAdas_ab != None and pAdas_cd != None:
			Vrs.meter_label = "anuṣṭubh (ab: " + pAdas_ab + ", cd: " + pAdas_cd + ")"
			Vrs.identification_score = 9
			return 1
		elif pAdas_ab == None and pAdas_cd != None:
			Vrs.meter_label = "anuṣṭubh (ab: asamīcīna, cd: " + pAdas_cd + ")"
			Vrs.identification_score = 8
			return 1
		elif pAdas_ab != None and pAdas_cd == None:
			Vrs.meter_label = "anuṣṭubh (ab: " + pAdas_ab + ", cd: asamīcīna)"
			Vrs.identification_score = 8
			return 1

		# also test whether just a half-verse

		pAdas_ab = self.test_as_anuzwuB_odd_even(w_p[0]+w_p[1], w_p[2]+w_p[3])
		if pAdas_ab != None:
			Vrs.meter_label = "anuṣṭubh (ardham eva: " + pAdas_ab + ")"
			Vrs.identification_score = 8
			return 1

		return 0

	def count_pAdasamatva(self, Vrs):
		"""
		Accepts four-part (newline-separated) string of light/heavy (l/g) pattern.
		Since testing for samavṛtta, ignores final anceps syllable in each part.
		Returns integer 0,2,3,4 indicating size of best matching group.
		"""

		self.pAdasamatva_count = 0

		# prepare weights-by-pāda for samatva count: omit last anceps syllable
		wbp = [true_wbp[:-1] for true_wbp in Vrs.syllable_weights.split('\n')]

		# make sure full four pādas
		try: wbp[3]
		except IndexError: return

		# avoid false positive if completely empty string argument list
		if wbp[0] == wbp[1] == wbp[2] == wbp[3] == '': return

		# discard any empty strings
		while '' in wbp: wbp.remove('')

		# calculate max number of matching pādas in verse
		max_match = max([wbp.count(i) for i in wbp])
		if max_match in [2, 3, 4]: # exclude value of 1 (= no matches)
			self.pAdasamatva_count = max_match


	def test_as_samavftta(self, Vrs):
		"""
				Accepts as arugment a list of strings detailing light/heavy (l/g) patterns.
				Determines whether verse (first four lines) is of 'samavṛtta' type.
				Returns string detailing results if identified as such, or None if not.
				Tolerates one incorrect quarter out of four, notes when applicable.
		"""

		w_p = Vrs.syllable_weights.split('\n')  # weights by pāda

		# make sure full four pādas
		try: w_p[3]
		except IndexError: return

		self.count_pAdasamatva(Vrs) # self.pAdasamatva_count in [0,2,3,4]

		# HERE: FIRST TEST FOR ardhasamavftta
		if ( self.pAdasamatva_count == 2
			 and w_p[0] == w_p[2] and w_p[1] == w_p[3]
			 ):
			# return("ardhasamavftta...")
			pass

		# otherwise, proceed with normal samavftta test
		if self.pAdasamatva_count in [4, 3, 2]:

			i = 0  # assume first pāda of four is a good representative for all
			while w_p[i] not in w_p[i+1:]:  # but if it doesn't match any others
				i += 1  # then move on until one that does is found
			pAda_for_id = w_p[i]

			S = Sc()
			pAda_gaRas = S.gaRa_abbreviate(pAda_for_id)
			# family = len(pAda_for_id)

			for gaRa_pattern in meter_patterns.samavfttas_by_gaRas:
			# for gaRa_pattern in meter_patterns.samavfttas_by_family_and_gaRa[family]:

				regex = re.compile(gaRa_pattern)

				if re.match(regex, pAda_gaRas):

					gaRa_note = ' (%s)' % (
					meter_patterns.choose_heavy_gaRa_pattern(gaRa_pattern)
					)


					if self.pAdasamatva_count in [2, 3]:
						gaRa_note += " (%d eva pādāḥ samyak)" % self.pAdasamatva_count

					return meter_patterns.samavfttas_by_gaRas[gaRa_pattern] + gaRa_note

			else:  # if all patterns tested and no match found and returned
				return "(ajñātasamavṛtta?) (%d: %s)" % (len(pAda_for_id), pAda_gaRas)

		else:
			return None

	def test_as_upajAti(self, Vrs):
		"""
		gglggllglgg   [ttjgg]
		ggggglgglgg   [mttgg]
		ggggglgglgg   [mttgg]
		ggggglgglgg   [mttgg]

		lglggllglgg   [jtjgg]
		gglggllglgg   [ttjgg]
		lglggllglgg   [jtjgg]
		gglggllglgg   [ttjgg]
		"""
		self.strict_trizwuB_count = 0 # only recognized trizwuB patterns
		self.loose_eleven_count = 0 # any 11-syllable pattern
		self.trizwuB_types_found = []

		for g_a in Vrs.gaRa_abbreviations.split('\n'):
			if (
				g_a in ["jtjgg", "jtjgl", "ttjgg", "ttjgl"] # regex to generalize
				or g_a in ["mttgg", "mttgl", "rnBgg", "rnBgl"] # not just indra/upendra
			):
				self.strict_trizwuB_count += 1
				for gaRa_pattern in meter_patterns.samavfttas_by_gaRas:
					regex = re.compile(gaRa_pattern)
					if re.match(regex, g_a):
						self.trizwuB_types_found.append(
						meter_patterns.samavfttas_by_gaRas[gaRa_pattern]
						)
			elif g_a in ["tBjgg", "tBjgl", "jBjgg", "jBjgl"]: # etc.
				self.loose_eleven_count += 1
				self.trizwuB_types_found.append(g_a)
			# condense by grouping "in" lists

		unique_types_found = []
		for t in self.trizwuB_types_found:
			if t not in unique_types_found:
				unique_types_found.append(t)

		if self.strict_trizwuB_count == 4:
			return "upajāti (%s)" % (", ".join(unique_types_found))
		elif self.strict_trizwuB_count + self.loose_eleven_count == 4:
			return "upajāti (?) (%s)" % (", ".join(unique_types_found))
		elif (self.strict_trizwuB_count + self.loose_eleven_count) in [2, 3]:
			return "upajāti (?) (%s) (%d eva pādāḥ samyak)" % (
				", ".join(unique_types_found),
				self.pAdasamatva_count
			)
		else:
			return None

	def evaluate_samavftta(self, Vrs, perfect):

		wbp = Vrs.syllable_weights.split('\n') # weights by pāda

		# get index of best match
		cp_wbp = [ w[:-1] for w in wbp ] # omit final anceps from consideration
		most_freq_pAda = max( set(cp_wbp), key=cp_wbp.count )
		i = cp_wbp.index(most_freq_pAda)

		# i = 0  # assume first pāda of four is a good representative for all
		# if not perfect: # i.e., if first doesn't necessarily match others
		# 	cp_wbp = [ w[:-1] for w in wbp ] # for comparison, omit final anceps
		# 	while cp_wbp[i] not in cp_wbp[i+1:]: # keep moving until match
		# 		i += 1

		w_to_id = wbp[i] # include final anceps
		g_to_id = Vrs.gaRa_abbreviations.split('\n')[i]

		for gaRa_pattern in meter_patterns.samavfttas_by_family_and_gaRa[len(w_to_id)].keys():

			regex = re.compile(gaRa_pattern)

			if re.match(regex, g_to_id):

				meter_label = meter_patterns.samavfttas_by_family_and_gaRa[len(w_to_id)][gaRa_pattern]
				break

		else:
			meter_label = "(ajñātasamavṛttam)" # i.e., need to add to meter_patterns

		gaRa_note = ' [%s]' % (
		meter_patterns.choose_heavy_gaRa_pattern(gaRa_pattern)
		)

		if perfect:

			Vrs.meter_label = meter_label + gaRa_note
			Vrs.identification_score = 9

		elif not perfect:

			meter_label += " (? %d eva pādāḥ samyak)" % self.pAdasamatva_count

			# may tie with pre-existing result

			if Vrs.identification_score == 7:
				# tie, Vrs.meter_label != None, concatenate meter_labels
				Vrs.meter_label += " atha vā " + meter_label + gaRa_note
			else:
				# Vrs.meter_label == None
				Vrs.meter_label = meter_label + gaRa_note
				Vrs.identification_score = 7


	def evaluate_upajAti(self, Vrs, perfect, trizwuB):

		wbp = Vrs.syllable_weights.split('\n') # weights by pāda
		wbp_lens = [ len(line) for line in wbp ]
		gs_to_id = Vrs.gaRa_abbreviations.split('\n')

		# if imperfect, exclude all info for lines of non-majority lengths
		if not perfect:
			# get index of most freq pāda type
			cp_wbp = [ w[:-1] for w in wbp ] # omit final anceps from consideration
			most_freq_pAda = max( set(cp_wbp), key=cp_wbp.count )
			for i, w in enumerate(cp_wbp):
				if len(w) != len(most_freq_pAda):
					del wbp[i]; del wbp_lens[i]; del gs_to_id[i]

		# for however many remain, produce labels as possible
		meter_labels = []
		for i, g_to_id in enumerate(gs_to_id):

			for gaRa_pattern in meter_patterns.samavfttas_by_family_and_gaRa[wbp_lens[0]].keys():

				regex = re.compile(gaRa_pattern)

				if re.match(regex, g_to_id):

					meter_label = meter_patterns.samavfttas_by_family_and_gaRa[wbp_lens[0]][gaRa_pattern]

					gaRa_note = ' [%s]' % (
					meter_patterns.choose_heavy_gaRa_pattern(gaRa_pattern)
					)

					meter_labels.append(meter_label + gaRa_note)

			else:

				meter_label = "ajñātasamavṛttam"

				gaRa_note = ' [%s]' % (
				meter_patterns.choose_heavy_gaRa_pattern(gaRa_pattern)
				)

				meter_labels.append(meter_label + gaRa_note)

		meter_label = "upajāti %d" % wbp_lens[0]
		meter_label += " (? %d eva pādāḥ samyak)" % self.pAdasamatva_count
		gaRa_note = ', '.join(list(set(meter_labels)))

		if Vrs.meter_label != None:
			# pre-exisiting, concatenate meter_labels
			Vrs.meter_label += " atha vā " + meter_label + gaRa_note

		if perfect and trizwuB: 				id_score = 8
		elif perfect and (not trizwuB): 		id_score = 7
		elif (not perfect) and trizwuB: 		id_score = 6
		elif (not perfect) and (not trizwuB): 	id_score = 5







	def test_as_samavftta_and_or_upajAti(self, Vrs):

		wbp = Vrs.syllable_weights.split('\n') # weights by pāda
		wbp_lens = [ len(line) for line in wbp ]

		# make sure full four pādas
		try: wbp[3]
		except IndexError: return

		self.count_pAdasamatva(Vrs) # [0,2,3,4]

		# test perfect samavṛtta (identification_score == 9)

		if self.pAdasamatva_count == 4:
			self.evaluate_samavftta(Vrs, perfect=True)
			return

		# test perfect ardhasamavftta (identification_score == 9)

		# if ( self.pAdasamatva_count == 2
		# 	 and weight_lines[0] == weight_lines[2]
		# 	 and weight_lines[1] == weight_lines[3]
		# 	 ):
		# 	# again, distinguish whether known, output
		# 	# involves looking specifically for corresponding type

		# test perfect viṣamavṛtta (identification_score == 9)
		# if self.pAdasamatva_count == 0:
		# simple lookup table

		# test perfect upajāti (identification_score in [8, 6])

		if len(list(set(wbp_lens))) == 1: # all same length, upajāti in broad sense
			if wbp_lens == [11] * 4: # triṣṭubh
				self.evaluate_upajAti(Vrs, perfect=True, trizwuB=True)
			else:
				self.evaluate_upajAti(Vrs, perfect=True, trizwuB=False)

		# test imperfect samavftta (identification_score == 7 with possibility of tie)

		if self.pAdasamatva_count in [2, 3] and Vrs.identification_score <= 7:
			self.evaluate_samavftta(Vrs, perfect=False)
			return

		# imperfect ardhasamavftta? seems hard
		# involves looking specifically for corresponding type...

		# imperfect upajāti (identification_score in [7, 5])

		if len(list(set(wbp_lens))) in [2, 3]: # not all same length
			if wbp_lens.count(11) in [2, 3]: # triṣṭubh
				self.evaluate_upajAti(Vrs, perfect=False, trizwuB=True)
			else:
				self.evaluate_upajAti(Vrs, perfect=False, trizwuB=False)
			return

		# if len(list(set(wbp_lens))) != 1: # all same length, upajāti in broad sense
		# 	if wbp_lens == [11] * 4: # triṣṭubh
		# 		self.evaluate_upajAti(Vrs, perfect=False, trizwuB=True)
		# 	else:
		# 		self.evaluate_upajAti(Vrs, perfect=False, trizwuB=False)

		# if ( self.strict_trizwuB_count + self.loose_eleven_count ) == 4:
		# 	# at least some unknown, express ?, distinguish known from unknown
		# 	return
		# elif self.strict_trizwuB_count == 3:
		# 	# likely just textual error, express # samyak, identify types, output
		# 	return
		# elif ( self.strict_trizwuB_count + self.loose_eleven_count ) == 3:
		# 	# same, express ?, express # samyak, identify distinguished types
		# 	return
		# elif self.strict_trizwuB_count == 2:
		# 	# same, express # samyak, identify types, output
		# 	return
		# elif ( self.strict_trizwuB_count + self.loose_eleven_count ) == 2:
		# 	# same, express ?, express # samyak, identify distinguished types
		# 	return


		return # if here, nothing was found, Vrs.meter_label == None

	def test_as_jAti(self, Vrs):
		"""
		Accepts as arguments two lists, one of strings, the other of numbers.
		First argument details light/heavy (l/g) patterns, second reports total morae.
		Determines whether verse (first four lines) is of 'jāti' type.
		Returns string detailing results if identified as such, or None if not.
		"""

		w_p = Vrs.syllable_weights.split('\n')
		try:
			w_p[3]
		except IndexError:
			return None  # didn't find full four pādas

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

					if (
							morae_by_pAda[i] == std_pattern[i] or

							# final syllable is light but needs to be heavy
							morae_by_pAda[i] == std_pattern[i] - 1 and
							w_p[i][-1] == 'l'

					):
						continue
					else:
						break

				else:  # if all four pAdas proven valid, i.e., if no breaks
					return jAti_name + " (jāti)"

		else:  # if all patterns tested and nothing returned
			return None

	def attempt_identification(self, Vrs):
		"""
		Receives static, populated Verse object on which to attempt identification.

		Runs through various possible meter types in set order with relative scores:
			anuzwuB
				9 full verse with both halves perfect
				8 full verse with one half perfect, one half imperfect
				(currently no full verse with both halves imperfect planned)
				9 half verse with single half perfect
				(currently no half verse with single half imperfect planned)
			samavftta, upajAti, and vizamavftta
				(9 vizamavftta perfect - planned)
				(currently no vizamavftta imperfect planned)
				(9 ardhasamavftta perfect - planned)
				(currently no ardhasamavftta imperfect planned)
				9 samavftta perfect
				8 trizwuB upajAti standard perfect (known trizwuB patterns)
			[ 	7 samavftta imperfect (2-3 lines match)	- planned				] OUTPUT
			[ 	7 trizwuB upajAti non-standard perfect (any trizwuB) - planned	] TOGETHER
			[	7 non-trizwuB upajAti standard perfect (known) - planned		] WITH
			[	6 non-trizwuB upajAti non-standard perfect (any) - planned		] "?" - planned
				(currently no upajAti imperfect)
			jAti
				8 perfect
				(5 imperfect - planned)

		Embeds identification results as Verse.meter_label and Verse.identification_score.
		Returns string corresponding to Verse.meter_label. - currently
		Returns int result 1 if successul and 0 if not. - planned
		"""

		# anuzwuB

		test_result = self.test_as_anuzwuB(Vrs) # 1 if successful, 0 if not
		if Vrs.meter_label != None: return 1

		# samavftta, upajAti, and vizamavftta

		self.samavftta_result = self.test_as_samavftta(Vrs)
		self.upajAti_result = self.test_as_upajAti(Vrs)
		if self.samavftta_result != None and self.pAdasamatva_count == 4:  # perfect
			return self.samavftta_result
		elif self.upajAti_result != None:
		 	return self.upajAti_result
		elif self.samavftta_result != None:
			return self.samavftta_result
		# >> self.samavftta_and_or_upajAti_result = self.test_as_samavftta_and_or_upajAti()
		# if Vrs.meter_label != None: return 1

		# jAti

		self.jAti_result = self.test_as_jAti(Vrs)
		if self.jAti_result != None: return 1

		return 0 # all three tests failed


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
		self.Verses_found = []  # list of Verse objects which passed VerseTester

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
		return (sss.join(syllable_list[:ab_pAda_br]) + '\n'
				+ sss.join(syllable_list[ab_pAda_br:bc_pAda_br]) + '\n'
				+ sss.join(syllable_list[bc_pAda_br:cd_pAda_br]) + '\n'
				+ sss.join(syllable_list[cd_pAda_br:])
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
							syllable_list, pos_ab, pos_bc, pos_cd)

						temp_V = copy(Vrs)
						temp_V.text_syllabified = new_text_syllabified
						temp_V.syllable_weights = S.scan_syllable_weights(
							temp_V.text_syllabified)
						temp_V.morae_per_line = S.count_morae(
							temp_V.syllable_weights)
						temp_V.gaRa_abbreviations = '\n'.join(
						[ S.gaRa_abbreviate(line) for line in temp_V.syllable_weights.split('\n') ]
						)



						# temp_V.meter_label = VrsTster.attempt_identification(temp_V)
						attempt_result = VrsTster.attempt_identification(temp_V)

						if temp_V.meter_label != None:
							# >> if attempt_result == 1:
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

		# gets back mostly populated Verse object
		V = S.scan(rw_str, from_scheme=from_scheme)

		self.VerseTester = VT = VerseTester()

		if resplit_option == 'none':

			V.meter_label = VT.attempt_identification(V)
			# >> attempt_result = VT.attempt_identification(V)

		elif resplit_option in ['resplit_hard', 'resplit_soft']:

			if resplit_option == 'resplit_soft':
				# capture user pāda breaks as indicated by newlines POSSIBLY OTHER CHARACTER
				newline_indices = [m.start()
								   for m in re.finditer('\n', V.text_syllabified)]

				# make sure three newlines for four pādas
				try: newline_indices[2]
				except IndexError: return V   # PROBLEM, OUT-OF-DATE RETURN

				ab_pAda_br = V.text_syllabified[:newline_indices[0]].count(
					scansion_syllable_separator)
				bc_pAda_br = V.text_syllabified[:newline_indices[1]].count(
					scansion_syllable_separator)
				cd_pAda_br = V.text_syllabified[:newline_indices[2]].count(
					scansion_syllable_separator)

			# make list, sans newlines, sans last scansion_syllable_separator
			syllable_list = (
							V.text_syllabified.replace('\n', '')
							).split(scansion_syllable_separator)

			# discard any final separator(s)
			try:
				while syllable_list[-1] == '':
					syllable_list.pop(-1)
			except IndexError: pass # empty list...

			total_syll_count = len(syllable_list)
			quarter_len = int(total_syll_count / 4)

			if resplit_option == 'resplit_hard':
				# discard user pāda breaks, initialize length-based ones
				ab_pAda_br, bc_pAda_br, cd_pAda_br = (
					[i * quarter_len for i in [1, 2, 3]])

			self.Verses_found = self.wiggle_identify(V, syllable_list, VT,
													 ab_pAda_br, bc_pAda_br, cd_pAda_br, quarter_len)

			# pick best match, i.e. Verse with highest identification_score
			if len(self.Verses_found) > 0:
				V = self.Verses_found[0]
				# >> Verses_found.sort(key=lambda x: x.identification_score, reverse=True)

		if V.meter_label == None:
			V.meter_label = 'ajñātam'  # do not return None

		return V
