from skrutable.scansion import Scanner as Sc
from skrutable.config import load_config_dict_from_json_file
from skrutable import meter_patterns
import re

# load config variables
config = load_config_dict_from_json_file()
default_meter_segmentation_mode = config["default_meter_segmentation_mode"] # e.g. "simple_strict"

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

		# print "Testing halves ab and cd independently as anuṣṭubh... " + '\n'

		# test
		pAdas_ab = self.test_as_anuzwuB_odd_even(w_p[0], w_p[1])
		pAdas_cd = self.test_as_anuzwuB_odd_even(w_p[2], w_p[3])

		# report results
		if pAdas_ab != None and pAdas_cd != None:
			return "anuṣṭubh (ab: " + pAdas_ab + ", cd: " + pAdas_cd + ")"
		elif pAdas_ab == None and pAdas_cd != None:
			return "anuṣṭubh (ab: invalid, cd: " + pAdas_cd + ")"
		elif pAdas_ab != None and pAdas_cd == None:
			return "anuṣṭubh (ab: " + pAdas_ab + ", cd: invalid)"
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

		# print "Testing entire stanza as samavṛtta... " + '\n'
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

		weights_by_pAda = Vrs.syllable_weights.split('\n')

		morae_by_pAda = Vrs.morae_per_line

		# Note: self.morae_by_pAda is a list of numbers,
		# here manipulate as such but also as a single string
		morae_by_pAda_string = str(morae_by_pAda)

		# print "Testing entire stanza as jāti..." + '\n'
		# print "Morae: %s" % morae_by_pAda_string + '\n'

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
						weights_by_pAda[i][-1] == 'l'

						):
						continue
					else:
						break

				else: # if all four pAdas proven valid, i.e., if no breaks
					return jAti_name + " (jāti)"

		else: # if all patterns tested and nothing returned
			return None



	def attempt_identification(self, Vrs):
		"""
		= old ScansionResults.identify

		runs through various possible meter types in set order
			MAYBE SET ORDER IN CONFIG

		WRONG BELOW

		Receives static, populated Verse object on which to attempt identification.

		four segmentation modes:
			1) simple_strict: uses three newlines exactly as provided in input
			2) resplit_hard: discards input newlines, resplits based on overall length
			3) resplit_soft: initializes length-based resplit with input newlines
			4) single_pAda: evaluates input as single pAda (verse quarter)

		order
			first: default or override
			if fails, then: try other modes in set order (1 2 3; depending on length 4)
		"""
		pass

class MeterIdentifier(object):
	"""
	User-facing agent-style object.

	Primary method identify_meter() accepts string.

	Returns single Verse object, whose attribute meter_label
	and method summarize() help in revealing identification results.
	"""

	def __init__(self):
		self.Verses_found = [] # list of Verse objects which passed VerseTester


	def identify_meter(self, rw_str, seg_mode=default_meter_segmentation_mode):
		"""
		User-facing method, manages overall identification procedure:
			accepts raw string
			sends string to Scanner.scan, receives back scansion.Verse object
			then, according to segmentation mode
				makes and passes series of Verse objects to internal VerseTester
				receives back tested Verses (as internally available dict)
			returns single Verse object with best identification result
		"""

		S = Sc()
		V = S.scan(rw_str) # static, mostly populated Verse object
		VT = VerseTester()

		if seg_mode == 'simple_strict':
			print("mode: ", seg_mode)
			return VT.attempt_identification(V)

		elif seg_mode == 'resplit_hard':
			# (= old split.py)
			# wiggle_iter = VT.wiggle_iterator(pos_a, pos_b, pos_c)
			# for positions i j k
				# tmp_Verse = VT.resplit_Verse(V, i, j, k)
				# VT.attempt_identification(tmp_Verse)   # = old Result.identify()
				# if curr_Verse.meter_label != None: self.Verses.append(tmp_Verse)
			# best_V = max(self.Verses.items(), key=operator.itemgetter(1))[0] # or similar
			# return best_V
			pass
