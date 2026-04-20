from skrutable.scansion import Scanner as Sc
from skrutable import meter_patterns
from skrutable.config import load_config_dict_from_json_file
import re
from copy import copy
from dataclasses import dataclass, field
from typing import Optional

# load config variables
config = load_config_dict_from_json_file()
scansion_syllable_separator = config["scansion_syllable_separator"]  # e.g. " "
default_resplit_option = config["default_resplit_option"]  # e.g. "none"
default_resplit_keep_midpoint = config["default_resplit_keep_midpoint"]  # e.g. True
disable_non_trizwuB_upajAti = config["disable_non_trizwuB_upajAti"]  # e.g. True
meter_scores = config["meter_scores"]  # dict


@dataclass
class Diagnostic:
	perfect_id_label: Optional[str] = None      # 'pathyā', 'ma-vipulā', etc.; None if imperfect
	imperfect_id_label: Optional[str] = None    # 'asamīcīnā ma-vipulā', etc.; None if perfect or unidentified
	failure_code: Optional[str] = None           # short internal code, e.g. 'hahn_general_2'; None if perfect
	problem_syllables: dict = field(default_factory=lambda: {'odd': [], 'even': []})

	def perfect(self):
		return self.perfect_id_label is not None

	def imperfect(self):
		return self.imperfect_id_label is not None

	def length_error(self):
		return self.failure_code in ('hypermetric', 'hypometric')


def _decompose_into_mAtragaNas(weights_str, gana_6_morae, gana_8_morae):
	"""
	Decomposes an ardha (half-verse) weight string into mātrā-gaṇas.
	Returns list of l/g substrings, one per gaṇa position (8 total).
	gana_6_morae: 1 for upagīti-style 6th gaṇa (la), 4 for ja/kha.
	gana_8_morae: 2 for standard final long, 4 for āryāgīti.
	"""
	ganas = []
	i = 0
	n = len(weights_str)

	while i < n:
		pos = len(ganas) + 1  # 1-indexed

		if pos == 8:
			ganas.append(weights_str[i:])
			break

		target = gana_6_morae if pos == 6 else 4
		seg = ''
		seg_morae = 0
		while i < n and seg_morae < target:
			s = weights_str[i]
			m = 1 if s == 'l' else 2
			if seg_morae + m > target:
				break
			seg += s
			seg_morae += m
			i += 1
		ganas.append(seg)

	return ganas


_jati_name_slugs = {
	'āryā':     'arya',
	'gīti':     'giti',
	'upagīti':  'upagiti',
	'udgīti':   'udgiti',
	'āryāgīti': 'aryagiti',
}

def _validate_jAti_gaNas(ganas, gana_6_morae, jati_name='', ardha_num=0):
	"""
	Validates mātrā-gaṇa structure per Hahn's rules for the āryā family:
	  1. (general) Odd positions (1,3,5,7) must not be ja (lgl).
	  2. (meter-specific) Position 6 must be ja/kha (gana_6_morae==4) or la (gana_6_morae==1).

	Returns None if valid.
	Returns (failure_code, bad_syllable_indices) on failure, where bad_syllable_indices
	is a list of 0-indexed syllable offsets within the ardha weight string.
	"""
	if len(ganas) != 8:
		return ('hahn_jati_wrong_gana_count', [])

	names = meter_patterns.mAtragaNa_names
	slug = _jati_name_slugs.get(jati_name, jati_name)
	prefix = f'hahn_{slug}_ardha{ardha_num}' if slug else 'hahn_jati'

	# build cumulative syllable offsets so we can report syllable positions
	offsets = []
	cur = 0
	for g in ganas:
		offsets.append(cur)
		cur += len(g)

	for pos in [1, 3, 5, 7]:  # 1-indexed odd positions — rule applies to all jāti meters
		if names.get(ganas[pos - 1]) == 'ja':
			start = offsets[pos - 1]
			bad_syls = list(range(start, start + len(ganas[pos - 1])))
			return (f'{prefix}_general_1_gana{pos}', bad_syls)

	g6_name = names.get(ganas[5], 'other')
	g6_raw = ganas[5]
	if gana_6_morae == 4 and g6_name not in ('ja', 'kha'):
		start = offsets[5]
		bad_syls = list(range(start, start + len(g6_raw)))
		return (f'{prefix}_2_gana6_not_ja_kha', bad_syls)
	if gana_6_morae == 1 and g6_raw != 'l':
		start = offsets[5]
		bad_syls = list(range(start, start + len(g6_raw)))
		return (f'{prefix}_2_gana6_not_la', bad_syls)

	return None


def _fix_conjunct_pada_boundaries(syllable_list, break_positions):
	"""
	After resplitting, a pāda may start with a syllable whose onset contains
	multiple consonants (e.g. 'cCa' from saccha). These consonants phonologically
	close the final syllable of the previous pāda, making it heavy by position.
	This function moves all but the last onset consonant of such syllables back
	to the end of the previous syllable, so scan_syllable_weights assigns the
	correct weight.

	break_positions: list of syllable indices where pāda breaks occur (ab and cd
	only — bc is the natural line break and not affected by resplitting).
	syllable_list is modified in place.
	"""
	from skrutable.phonemes import SLP_vowels
	vowel_set = set(SLP_vowels)

	for br in break_positions:
		if br <= 0 or br >= len(syllable_list):
			continue
		syl = syllable_list[br]
		# find index of first vowel in syllable
		vowel_idx = next((i for i, c in enumerate(syl) if c in vowel_set), None)
		if vowel_idx is None or vowel_idx < 2:
			continue  # no vowel found, or only 0-1 onset consonants — nothing to move
		# move all but the last onset consonant to the previous syllable
		surplus = syl[:vowel_idx - 1]
		syllable_list[br - 1] = syllable_list[br - 1] + surplus
		syllable_list[br] = syl[vowel_idx - 1:]


class VerseTester(object):
	"""
	Internal agent-style object.

	Most methods take a populated scansion.Verse object as an argument;
	test_as_anuzwuB_half() is an exception.

	Primary method attempt_identification returns scansion.Verse object
	with populated meter_label attribute if identification was successful.
	"""

	def __init__(self):
		"""Internal constructor"""
		self.pAdasamatva_count = 0 # int
		self.resplit_option = default_resplit_option # string
		self.resplit_keep_midpoint = default_resplit_keep_midpoint # bool
		self.identification_attempt_count = 0
		self._anuzwuB_half_cache = {}  # cleared per wiggle_identify run

	def combine_results(self, Vrs, new_label, new_score):
		old_label = Vrs.meter_label or ''
		old_score = Vrs.identification_score

		# currently strict
		# another more lenient option would test: abs(new_score - old_score) <= 1

		if new_score < old_score:
			return

		elif new_score > old_score:
			# override previous
			Vrs.meter_label = new_label
			Vrs.identification_score = new_score

		elif new_score == old_score:
			# tie, concatenate as old + new
				Vrs.meter_label += " atha vā " + new_label
			# do not change score


	def test_as_anuzwuB_half(self, odd_pAda_weights, even_pAda_weights):
		"""
		Accepts two strings of syllable weights (e.g. 'llglgllg').
		Tries to match to known odd-even 'anuṣṭubh' foot pairings:
				pathyā
				vipulā (4.5 subtypes: na, ra, ma, bha, and variant bha).
		Returns Diagnostic with perfect_id_label set if match found, None otherwise.

		"""

		cache_key = (odd_pAda_weights, even_pAda_weights)
		if cache_key in self._anuzwuB_half_cache:
			return self._anuzwuB_half_cache[cache_key]

		# check lengths first; length_error only reported when exactly one pāda is off
		even_len_ok = len(even_pAda_weights) == 8
		odd_len_ok = len(odd_pAda_weights) == 8
		if not even_len_ok and not odd_len_ok:
			result = None  # both wrong: bad split, not credible
		elif not even_len_ok:
			code = 'hypermetric' if len(even_pAda_weights) > 8 else 'hypometric'
			result = Diagnostic(failure_code=code, problem_syllables={'odd': [], 'even': list(range(len(even_pAda_weights)))})
		elif not odd_len_ok:
			code = 'hypermetric' if len(odd_pAda_weights) > 8 else 'hypometric'
			result = Diagnostic(failure_code=code, problem_syllables={'odd': list(range(len(odd_pAda_weights))), 'even': []})
		else:
			# check even pāda
			if not re.match(meter_patterns.anuzwuB_pAda['even'], even_pAda_weights):
				result = None
				for weights_pattern, (label, problem_syls, code) in meter_patterns.anuzwuB_pAda_asamIcIna['even'].items():
					if re.match(weights_pattern, even_pAda_weights):
						result = Diagnostic(imperfect_id_label=label, failure_code=code, problem_syllables={'odd': [], 'even': problem_syls})
						break
				if result is None:
					result = Diagnostic(imperfect_id_label='asamīcīnā, [caturthāt] pathyā yujo j', failure_code='hahn_general_4', problem_syllables={'odd': [], 'even': [4, 5, 6]})
			else:
				# check odd pāda (both 'paTyA' and 'vipulA')
				result = None
				for weights_pattern, label in meter_patterns.anuzwuB_pAda['odd'].items():
					if re.match(weights_pattern, odd_pAda_weights):
						result = Diagnostic(perfect_id_label=label)
						break
				if result is None:
					# check for broken conditioning on odd pāda
					for weights_pattern, (label, problem_syls, code) in meter_patterns.anuzwuB_pAda_asamIcIna['odd'].items():
						if re.match(weights_pattern, odd_pAda_weights):
							result = Diagnostic(imperfect_id_label=label, failure_code=code, problem_syllables={'odd': problem_syls, 'even': []})
							break
				if result is None:
					result = Diagnostic(imperfect_id_label='asamīcīnā, [vipulāyām asatyām] ya[gaṇaḥ] [ayujo] caturthāt [syāt]', failure_code='hahn_paTyA', problem_syllables={'odd': [4, 5, 6], 'even': []})

		self._anuzwuB_half_cache[cache_key] = result
		return result

	def test_as_anuzwuB(self, Vrs):
	# >> def test_as_zloka(self, Vrs):
		"""
		Accepts Verse object.
		Determines whether first four lines of Verse's syllable_weights is anuṣṭubh.
		Internally sets Verse parameters if identified as such.
		Tests halves ab and cd independently, reports if either half found to be valid.
		Returns Diagnostic if anuṣṭubh, or None if not.
		"""

		w_p = Vrs.syllable_weights.split('\n')  # weights by pāda

		# make sure full four pādas
		try: w_p[3]
		except IndexError: return None

		# test each half
		pAdas_ab_result = self.test_as_anuzwuB_half(w_p[0], w_p[1])
		pAdas_cd_result = self.test_as_anuzwuB_half(w_p[2], w_p[3])

		if pAdas_ab_result is None and pAdas_cd_result is None:
			ardham_eva_result = self.test_as_anuzwuB_half(w_p[0] + w_p[1], w_p[2] + w_p[3])
			if ardham_eva_result is None:
				return None
			if ardham_eva_result.perfect():
				Vrs.meter_label = f"anuṣṭubh (ardham eva: {ardham_eva_result.perfect_id_label})"
				Vrs.identification_score = meter_scores["anuṣṭubh, half, single half perfect)"]
				Vrs.diagnostic = ardham_eva_result
				return ardham_eva_result
			elif ardham_eva_result.imperfect():
				Vrs.meter_label = f"anuṣṭubh (ardham eva: {ardham_eva_result.imperfect_id_label})"
				Vrs.identification_score = meter_scores["anuṣṭubh, half, single half imperfect)"]
				Vrs.diagnostic = ardham_eva_result
				return ardham_eva_result
			else:
				return None

		if pAdas_ab_result is None or pAdas_cd_result is None:
			return None

		# both halves perfect

		if pAdas_ab_result.perfect() and pAdas_cd_result.perfect():
			Vrs.meter_label = f"anuṣṭubh (1,2: {pAdas_ab_result.perfect_id_label}; 3,4: {pAdas_cd_result.perfect_id_label})"
			Vrs.identification_score = meter_scores["anuṣṭubh, full, both halves perfect)"]
			Vrs.diagnostic = {'ab': pAdas_ab_result, 'cd': pAdas_cd_result}
			return pAdas_ab_result

		# one half imperfect

		elif pAdas_ab_result.imperfect() and pAdas_cd_result.perfect():
			Vrs.meter_label = f"anuṣṭubh (1,2: {pAdas_ab_result.imperfect_id_label}; 3,4: {pAdas_cd_result.perfect_id_label})"
			Vrs.identification_score = meter_scores["anuṣṭubh, full, one half perfect, one imperfect)"]
			Vrs.diagnostic = {'ab': pAdas_ab_result, 'cd': pAdas_cd_result}
			return pAdas_ab_result
		elif pAdas_ab_result.perfect() and pAdas_cd_result.imperfect():
			Vrs.meter_label = f"anuṣṭubh (1,2: {pAdas_ab_result.perfect_id_label}; 3,4: {pAdas_cd_result.imperfect_id_label})"
			Vrs.identification_score = meter_scores["anuṣṭubh, full, one half perfect, one imperfect)"]
			Vrs.diagnostic = {'ab': pAdas_ab_result, 'cd': pAdas_cd_result}
			return pAdas_cd_result

		# both halves imperfect

		elif pAdas_ab_result.imperfect() and pAdas_cd_result.imperfect():
			Vrs.meter_label = f"anuṣṭubh (1,2: {pAdas_ab_result.imperfect_id_label}; 3,4: {pAdas_cd_result.imperfect_id_label})"
			Vrs.identification_score = meter_scores["anuṣṭubh, full, both halves imperfect)"]
			Vrs.diagnostic = {'ab': pAdas_ab_result, 'cd': pAdas_cd_result}
			return pAdas_ab_result

		# one half perfect, one length error

		elif pAdas_ab_result.length_error() and pAdas_cd_result.perfect():
			code = pAdas_ab_result.failure_code
			Vrs.meter_label = f"anuṣṭubh (1,2: ?? {code}; 3,4: {pAdas_cd_result.perfect_id_label})"
			Vrs.identification_score = meter_scores["anuṣṭubh, full, one half perfect, one length error)"]
			Vrs.diagnostic = {'ab': pAdas_ab_result, 'cd': pAdas_cd_result}
			return pAdas_cd_result
		elif pAdas_ab_result.perfect() and pAdas_cd_result.length_error():
			code = pAdas_cd_result.failure_code
			Vrs.meter_label = f"anuṣṭubh (1,2: {pAdas_ab_result.perfect_id_label}; 3,4: ?? {code})"
			Vrs.identification_score = meter_scores["anuṣṭubh, full, one half perfect, one length error)"]
			Vrs.diagnostic = {'ab': pAdas_ab_result, 'cd': pAdas_cd_result}
			return pAdas_ab_result

		# one half imperfect, one length error

		elif pAdas_ab_result.length_error() and pAdas_cd_result.imperfect():
			code = pAdas_ab_result.failure_code
			Vrs.meter_label = f"anuṣṭubh (1,2: ?? {code}; 3,4: {pAdas_cd_result.imperfect_id_label})"
			Vrs.identification_score = meter_scores["anuṣṭubh, full, one half imperfect, one length error)"]
			Vrs.diagnostic = {'ab': pAdas_ab_result, 'cd': pAdas_cd_result}
			return pAdas_cd_result
		elif pAdas_ab_result.imperfect() and pAdas_cd_result.length_error():
			code = pAdas_cd_result.failure_code
			Vrs.meter_label = f"anuṣṭubh (1,2: {pAdas_ab_result.imperfect_id_label}; 3,4: ?? {code})"
			Vrs.identification_score = meter_scores["anuṣṭubh, full, one half imperfect, one length error)"]
			Vrs.diagnostic = {'ab': pAdas_ab_result, 'cd': pAdas_cd_result}
			return pAdas_ab_result

		return None

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
		except IndexError: return 0

		# avoid false positive if completely empty string argument list
		if wbp[0] == wbp[1] == wbp[2] == wbp[3] == '': return 0

		# discard any empty strings
		while '' in wbp: wbp.remove('')

		# calculate max number of matching pādas in verse
		max_match = max([wbp.count(i) for i in wbp])
		if max_match in [2, 3, 4]: # exclude value of 1 (= no matches)
			self.pAdasamatva_count = max_match


	def evaluate_samavftta(self, Vrs):
		# sufficient pAdasamatva already assured, now just evaluate

		wbp = Vrs.syllable_weights.split('\n') # weights by pāda

		# get index of most frequent pāda type
		wbp_sans_final = [ w[:-1] for w in wbp ] # omit final anceps from consideration
		most_freq_pAda = max( set(wbp_sans_final), key=wbp_sans_final.count )
		i = wbp_sans_final.index(most_freq_pAda)

		w_to_id = wbp[i] # weights to id, including final anceps
		g_to_id = Vrs.gaRa_abbreviations.split('\n')[i] # gaRa abbreviation to id

		# look for match among regexes with same length
		for gaRa_pattern in meter_patterns.samavfttas_by_family_and_gaRa[len(w_to_id)].keys():

			regex = re.compile(gaRa_pattern)

			if re.match(regex, g_to_id):

				meter_label = meter_patterns.samavfttas_by_family_and_gaRa[len(w_to_id)][gaRa_pattern]
				meter_label += ' [%d: %s]' % (
					len(w_to_id),
					meter_patterns.choose_heavy_gaRa_pattern(gaRa_pattern)
				)
				break

		else:
			meter_label = "ajñātasamavṛtta" # i.e., might need to add to meter_patterns
			meter_label += ' [%d: %s]' % ( len(w_to_id), g_to_id )

		score = meter_scores["samavṛtta, perfect"]
		imperfect_note = None

		if self.pAdasamatva_count == 3:
			imperfect_note = "? 3 eva pādāḥ yuktāḥ"
			meter_label += " (%s)" % imperfect_note
			score = meter_scores["samavṛtta, imperfect (3)"]
		elif self.pAdasamatva_count == 2:
			imperfect_note = "? 2 eva pādāḥ yuktāḥ"
			meter_label += " (%s)" % imperfect_note
			score = meter_scores["samavṛtta, imperfect (2)"]
		elif self.pAdasamatva_count == 0:
			imperfect_note = "1 eva pādaḥ"
			meter_label += " (%s)" % imperfect_note
			score = meter_scores["samavṛtta, quarter, perfect"]

		# experimental penalty, can later incorporate into config meter_scores
		if "ajñātasamavṛtta" in meter_label:
			score -= 2

		# build diagnostic
		problem_syllables = {}
		canonical = w_to_id  # includes final anceps
		for pada_num, w in enumerate(wbp[:4], start=1):
			if w == canonical:
				problem_syllables[pada_num] = []
			elif len(w) != len(canonical):
				problem_syllables[pada_num] = list(range(len(w)))
			else:
				# compare position-by-position; final anceps always matches
				problem_syllables[pada_num] = [
					j for j in range(len(w) - 1) if w[j] != canonical[j]
				]

		# collect any hyper/hypometric notes for imperfect_id_label
		length_notes = []
		for pada_num, w in enumerate(wbp[:4], start=1):
			if len(w) > len(canonical):
				length_notes.append("pāda %d hypermetric" % pada_num)
			elif len(w) < len(canonical):
				length_notes.append("pāda %d hypometric" % pada_num)

		if imperfect_note is None:
			base_label = meter_label
			diagnostic = Diagnostic(perfect_id_label=base_label, problem_syllables=problem_syllables)
		else:
			full_imperfect = imperfect_note
			if length_notes:
				full_imperfect += "; " + "; ".join(length_notes)
			diagnostic = Diagnostic(imperfect_id_label=full_imperfect, problem_syllables=problem_syllables)

		# may tie with pre-existing result (e.g., upajāti)
		old_score = Vrs.identification_score
		self.combine_results(Vrs, new_label=meter_label, new_score=score)
		if score >= old_score:
			Vrs.diagnostic = diagnostic



	def evaluate_ardhasamavftta(self, Vrs):
		# sufficient pAdasamatva already assured, now just evaluate
		Vrs.identification_score = meter_scores["ardhasamavṛtta, perfect"]

		wbp = Vrs.syllable_weights.split('\n') # weights by pāda

		gs_to_id = Vrs.gaRa_abbreviations.split('\n') # gaRa abbreviation to id
		odd_g_to_id = gs_to_id[0]
		even_g_to_id = gs_to_id[1]

		# look for match among regexes with same length
		iterator = meter_patterns.ardhasamavftta_by_odd_even_regex_tuple.keys()
		for (odd_gaRa_pattern, even_gaRa_pattern) in iterator:

			regex_odd = re.compile(odd_gaRa_pattern)
			regex_even = re.compile(even_gaRa_pattern)

			if 	(
				re.match(regex_odd, odd_g_to_id) and
				re.match(regex_even, even_g_to_id)
				):

				meter_label = meter_patterns.ardhasamavftta_by_odd_even_regex_tuple[
					(odd_gaRa_pattern, even_gaRa_pattern)
				]
				break

		else:
			meter_label = "ajñātārdhasamavṛtta" # i.e., might need to add to meter_patterns
			meter_label += ' [%s, %s]' % (odd_g_to_id, even_g_to_id)
			Vrs.identification_score = meter_scores["ardhasamavṛtta, perfect, unknown"]

		Vrs.meter_label = meter_label
		Vrs.diagnostic = Diagnostic(perfect_id_label=meter_label, problem_syllables={1: [], 2: [], 3: [], 4: []})


	def evaluate_upajAti(self, Vrs):
		# sufficient length similarity already assured, now just evaluate

		wbp = Vrs.syllable_weights.split('\n') # weights by pāda
		wbp_lens_orig = [ len(line) for line in wbp ]
		wbp_lens = list(wbp_lens_orig)
		gs_to_id = Vrs.gaRa_abbreviations.split('\n')

		# special exception for triṣṭubh-jagatī mix
		# see Karashima 2016 "The Triṣṭubh-Jagatī Verses in the Saddharmapuṇḍarīka"
		unique_sorted_lens = list(set(wbp_lens))
		unique_sorted_lens.sort()

		# track which original pada indices (0-based) are excluded
		excluded_indices = []

		if unique_sorted_lens != [11, 12]:

			# if imperfect, exclude all info for lines of non-majority lengths

			# find most frequent pAda length
			most_freq_pAda_len = max( set(wbp_lens), key=wbp_lens.count )

			# exclude based on most frequent pAda length
			to_exclude = []
			for i, weights in enumerate(wbp):
				if len(weights) != most_freq_pAda_len:
					to_exclude.append(i)
			excluded_indices = list(to_exclude)
			for i in reversed(to_exclude): # delete in descending index order, avoid index errors
				del wbp[i]
				del wbp_lens[i]
				del gs_to_id[i]

		# calculate what result could possibly score based on analysis so far
		potential_score = meter_scores["upajāti, perfect"]

		if 11 not in wbp_lens: # no triṣṭubh (could be mixed with jagatī)
			potential_score -= 1
		if 	(
				len(wbp_lens) != 4 and
				unique_sorted_lens != [11, 12]
			): # not perfect, less than 4 being analyzed
			potential_score -= 2

		# possibly quit based on analysis so far
		if 	( potential_score < Vrs.identification_score
			# not going to beat pre-existing result (e.g. 7 from imperfect samavftta)
			) or ( disable_non_trizwuB_upajAti
				and potential_score < meter_scores["upajāti, imperfect"]
			):
			return


		# for however many pādas remain, produce labels as possible
		meter_labels = []
		for i, g_to_id in enumerate(gs_to_id):

			for gaRa_pattern in meter_patterns.samavfttas_by_family_and_gaRa[wbp_lens[i]].keys():

				regex = re.compile(gaRa_pattern)

				if re.match(regex, g_to_id):

					meter_label = meter_patterns.samavfttas_by_family_and_gaRa[wbp_lens[i]][gaRa_pattern]
					meter_label += ' [%d: %s]' % (
						wbp_lens[i],
						meter_patterns.choose_heavy_gaRa_pattern(gaRa_pattern)
					)
					break

			else:
				meter_label = "ajñātam" # i.e., might need to add to meter_patterns
				meter_label += ' [%d: %s]' % ( wbp_lens[i], g_to_id )

			meter_labels.append(meter_label)

		unique_meter_labels = list(set(meter_labels)) # de-dupe
		combined_meter_labels = ', '.join(unique_meter_labels)

		# assign scores and labels
		family = meter_patterns.samavftta_family_names[ wbp_lens[0]]
		unique_meter_labels_copy = unique_meter_labels; unique_meter_labels_copy.sort()
		if (family == "triṣṭubh" and
			unique_meter_labels_copy == ['indravajrā [11: ttjgg]', 'upendravajrā [11: jtjgg]']
			):
			family = '' # clearer not to specify in this case

		if len(wbp_lens) == 4 and unique_sorted_lens == [11]: # triṣṭubh
			score = meter_scores["upajāti, perfect"]
		elif unique_sorted_lens == [11, 12]:
			score = meter_scores["upajāti, triṣṭubh-jagatī-saṃkara, perfect"]
			family = "triṣṭubh-jagatī-saṃkara?" # overwrite
		elif len(wbp_lens) == 4 and 11 not in unique_sorted_lens:
			score = meter_scores["upajāti, non-triṣṭubh, perfect"]
		elif len(wbp_lens) in [2,3] and wbp_lens.count(11) == len(wbp_lens): # triṣṭubh
			score = meter_scores["upajāti, imperfect"]
		elif len(wbp_lens) in [2,3] and 11 not in wbp_lens:
			score = meter_scores["upajāti, non-triṣṭubh, imperfect"]
		else:
			score = meter_scores["none found"]

		imperfect_note = None
		overall_meter_label = "upajāti %s: %s" % (
			family,
			combined_meter_labels
			)

		if 	(
				len(wbp_lens) != 4 and
				unique_sorted_lens != [11, 12]
			): # not perfect and also not triṣṭubh-jagatī-saṃkara
			imperfect_note = "? %d eva pādāḥ yuktāḥ" % len(wbp_lens)
			overall_meter_label += " (%s)" % imperfect_note

		# build diagnostic: problem_syllables keyed 1–4
		# included pādas: no positional errors (upajāti pādas are heterogeneous by design)
		# excluded pādas: hyper/hypometric
		most_freq_len = wbp_lens[0] if wbp_lens else None
		problem_syllables = {}
		length_notes = []
		for pada_num in range(1, 5):
			orig_len = wbp_lens_orig[pada_num - 1] if pada_num - 1 < len(wbp_lens_orig) else None
			if pada_num - 1 in excluded_indices:
				problem_syllables[pada_num] = list(range(orig_len)) if orig_len is not None else []
				if orig_len is not None and most_freq_len is not None:
					if orig_len > most_freq_len:
						length_notes.append("pāda %d hypermetric" % pada_num)
					else:
						length_notes.append("pāda %d hypometric" % pada_num)
			else:
				problem_syllables[pada_num] = []

		if imperfect_note is None:
			diagnostic = Diagnostic(perfect_id_label=overall_meter_label, problem_syllables=problem_syllables)
		else:
			full_imperfect = imperfect_note
			if length_notes:
				full_imperfect += "; " + "; ".join(length_notes)
			diagnostic = Diagnostic(imperfect_id_label=full_imperfect, problem_syllables=problem_syllables)

		old_score = Vrs.identification_score
		self.combine_results(Vrs, overall_meter_label, score)
		if score >= old_score:
			Vrs.diagnostic = diagnostic


	def is_vizamavftta(self, Vrs):

		gs_to_id = Vrs.gaRa_abbreviations.split('\n')
		if len(gs_to_id) < 4: return False

		for (a, b, c, d) in meter_patterns.vizamavftta_by_4_tuple:
			if (gs_to_id[0],gs_to_id[1],gs_to_id[2],gs_to_id[3]) == (a, b, c, d):
				Vrs.identification_score = meter_scores["viṣamavṛtta, perfect"]
				Vrs.meter_label = meter_patterns.vizamavftta_by_4_tuple[(a, b, c, d)]
				Vrs.diagnostic = Diagnostic(perfect_id_label=Vrs.meter_label, problem_syllables={1: [], 2: [], 3: [], 4: []})
				return True

		else:
			return False

	def test_as_samavftta_etc(self, Vrs):

		wbp = Vrs.syllable_weights.split('\n') # weights by pāda
		wbp_lens = [ len(line) for line in wbp ]

		# make sure either full four pādas or one and single-pāda mode
		if 	len(wbp) >= 4 or (
			len(wbp) == 1 and self.resplit_option == "single_pAda"
		):
			pass
		else:
			return 0

		self.count_pAdasamatva(Vrs) # [0,2,3,4]

		# test in following order to prioritize left-right presentation of ties
		# ties managed in self.combine_results()

		# test perfect samavṛtta
		if self.pAdasamatva_count == 4:
			# definitely checks out, id_score == 9
			self.evaluate_samavftta(Vrs)
			return 1 # max score already reached

		# test perfect ardhasamavftta
		if ( self.pAdasamatva_count == 2
			 and wbp[0][:-1] == wbp[2][:-1]
			 and wbp[1][:-1] == wbp[3][:-1] # exclude final anceps

			 and wbp_lens.count(11) != 4 # bc triṣṭubh upajāti so common
			 ):
			# will give id_score == 8
			self.evaluate_ardhasamavftta(Vrs)
			# max score not necessarily yet reached, don't return

		# test perfect single pāda of samavṛtta
		if ( self.pAdasamatva_count == 0 and self.resplit_option == "single_pAda"):
			self.evaluate_samavftta(Vrs)

		# test perfect viṣamavṛtta
		if self.pAdasamatva_count == 0 and self.is_vizamavftta(Vrs):
			# will give id_score == 9
			# label and score already set in is_vizamavftta if test was successful
			return 1 # max score already reached

		# test perfect upajāti

		unique_sorted_lens = list(set(wbp_lens))
		unique_sorted_lens.sort()
		if 	len(unique_sorted_lens) == 1: # all same length
			# will give id_score in [8, 7], may tie with above
			self.evaluate_upajAti(Vrs)
			if Vrs.identification_score == 8: return 1 # best score compared to below
			# otherwise, max score not necessarily yet reached, don't return

		# test imperfect samavftta
		if self.pAdasamatva_count in [2, 3]:
			# will give id_score in [7, 6], may tie with above
			self.evaluate_samavftta(Vrs)
			# max score not necessarily yet reached, don't return

		# test imperfect ardhasamavftta? seems hard
		# involves looking specifically for corresponding type...

		# test imperfect upajāti
		if (
			len( list(set(wbp_lens)) ) in [2, 3] or
			unique_sorted_lens == [11, 12]
			): # either not all same length or triṣṭubh-jagatī mix
			# will give id_score in [6, 5, 4], may tie with above
			self.evaluate_upajAti(Vrs)

		# return success
		if Vrs.meter_label != None:
			return 1
		else:
			return 0

	def test_as_jAti(self, Vrs):
		"""
		Determines whether verse is of jāti (mātrāvṛtta) type.
		Operates at the ardha (half-verse) level: concatenates pādas 1+2 and 3+4,
		gates on ardha morae totals, then validates mātrā-gaṇa structure.
		Returns 1 if identified, 0 if not.
		"""

		w_p = Vrs.syllable_weights.split('\n')
		if len(w_p) < 2 or not w_p[0] or not w_p[1]:
			return 0

		# concatenate into two ardhas regardless of number of pādas
		if len(w_p) >= 4:
			ardha1_w = w_p[0] + w_p[1]
			ardha2_w = w_p[2] + w_p[3]
		else:
			ardha1_w = w_p[0]
			ardha2_w = w_p[1]

		def ardha_morae(w): return w.count('l') + w.count('g') * 2
		m1 = ardha_morae(ardha1_w)
		m2 = ardha_morae(ardha2_w)

		for std_ardha, jAti_name, g6_ardha1, g6_ardha2, quarter_label, quarter_morae in meter_patterns.jAtis_by_ardha_morae:

			# ardha-level morae gate with anceps allowance on final syllable of each ardha
			ok1 = m1 == std_ardha[0] or (m1 == std_ardha[0] - 1 and ardha1_w[-1] == 'l')
			ok2 = m2 == std_ardha[1] or (m2 == std_ardha[1] - 1 and ardha2_w[-1] == 'l')
			if not ok1 or not ok2:
				continue

			g8_morae = 4 if jAti_name == 'āryāgīti' else 2
			ardha1_ganas = _decompose_into_mAtragaNas(ardha1_w, g6_ardha1, g8_morae)
			ardha2_ganas = _decompose_into_mAtragaNas(ardha2_w, g6_ardha2, g8_morae)

			err1 = _validate_jAti_gaNas(ardha1_ganas, g6_ardha1, jAti_name, 1)
			err2 = _validate_jAti_gaNas(ardha2_ganas, g6_ardha2, jAti_name, 2)

			# Build mAtragaNa_abbreviations: per-pāda space-separated gaṇa names.
			# Gaṇas spanning the pāda boundary stay with the pāda where they start.
			names = meter_patterns.mAtragaNa_names
			def ganas_to_abbrevs(ganas):
				return ' '.join(names.get(g, g) for g in ganas)
			def split_ardha_ganas_to_padas(ganas, pada_a_syl_count):
				"""Split 8 ardha gaṇas into two pāda abbreviation strings by syllable count."""
				cur = 0
				split = 0
				for i, g in enumerate(ganas):
					if cur >= pada_a_syl_count:
						split = i
						break
					cur += len(g)
				else:
					split = len(ganas)
				return ganas_to_abbrevs(ganas[:split]), ganas_to_abbrevs(ganas[split:])
			if len(w_p) >= 4:
				p1a, p1b = split_ardha_ganas_to_padas(ardha1_ganas, len(w_p[0]))
				p2a, p2b = split_ardha_ganas_to_padas(ardha2_ganas, len(w_p[2]))
				mAtragaNa_abbrevs = '\n'.join([p1a, p1b, p2a, p2b])
			else:
				mAtragaNa_abbrevs = '\n'.join([ganas_to_abbrevs(ardha1_ganas), ganas_to_abbrevs(ardha2_ganas)])

			if err1 or err2:
				# Ardha morae match but gaṇa rules broken — imperfect identification.
				# Map the bad syllable offsets (within the ardha weight string) back to
				# pāda-level syllable indices for problem_syllables.
				pada1_len = len(w_p[0]) if len(w_p) >= 4 else 0
				def ardha_syls_to_padas(bad_offsets, pada_a, pada_b, pada_a_len):
					"""Split flat ardha syllable offsets into two pāda index lists."""
					a_syls = [i for i in bad_offsets if i < pada_a_len]
					b_syls = [i - pada_a_len for i in bad_offsets if i >= pada_a_len]
					return {pada_a: a_syls, pada_b: b_syls}

				prob = {1: [], 2: [], 3: [], 4: []}
				if err1:
					code, bad = err1
					prob.update(ardha_syls_to_padas(bad, 1, 2, pada1_len))
				if err2:
					code2, bad2 = err2
					pada3_len = len(w_p[2]) if len(w_p) >= 4 else 0
					prob.update(ardha_syls_to_padas(bad2, 3, 4, pada3_len))

				_gana_ordinals = {'1': 'prathama', '3': 'tṛtīya', '5': 'pañcama', '7': 'saptama'}
				def _gana_error_label(code):
					if code == 'hahn_jati_wrong_gana_count':
						return 'asamīcīnaṃ, gaṇasaṃkhyā na aṣṭau'
					if 'general_1_gana' in code:
						n = code[-1]
						return f'asamīcīnaṃ, jaḥ {_gana_ordinals.get(n, n)}gaṇe'
					if code.endswith('_2_gana6_not_ja_kha'):
						return 'asamīcīnaṃ, ṣaṣṭhagaṇo na jaḥ/khaḥ'
					if code.endswith('_2_gana6_not_la'):
						return 'asamīcīnaṃ, ṣaṣṭhagaṇo na laḥ'
					return code
				failure_code = (err1 or err2)[0]
				imperfect_label = _gana_error_label(failure_code)
				jati_label = jAti_name + " (%s)" % quarter_label
				Vrs.meter_label = jati_label + f" ({imperfect_label})"
				Vrs.identification_score = meter_scores["jāti, imperfect"]
				Vrs.mAtragaNa_abbreviations = mAtragaNa_abbrevs
				Vrs.diagnostic = Diagnostic(
					imperfect_id_label=imperfect_label,
					failure_code=failure_code,
					problem_syllables=prob,
				)
				return 1

			jati_label = jAti_name + " (%s)" % quarter_label
			def quarters_ok(actual, expected, weights):
				if len(actual) < 4 or len(weights) < 4:
					return False
				return all(
					actual[i] == expected[i] or
					(actual[i] == expected[i] - 1 and weights[i] and weights[i][-1] == 'l')
					for i in range(4)
				)
			if quarters_ok(Vrs.morae_per_line, quarter_morae, w_p):
				score = meter_scores["jāti, perfect"]
				diagnostic = Diagnostic(perfect_id_label=jati_label, problem_syllables={1: [], 2: [], 3: [], 4: []})
				Vrs.meter_label = jati_label
			else:
				imperfect_label = "incorrect quarter split"
				score = meter_scores["jāti, imperfect"]
				diagnostic = Diagnostic(imperfect_id_label=imperfect_label, problem_syllables={1: [], 2: [], 3: [], 4: []})
				Vrs.meter_label = jati_label + f" ({imperfect_label})"

			Vrs.identification_score = score
			Vrs.mAtragaNa_abbreviations = mAtragaNa_abbrevs
			Vrs.diagnostic = diagnostic
			return 1

		return 0

	def attempt_identification(self, Vrs):
		"""
		Receives static, populated Verse object on which to attempt identification.

		Runs through various possible meter types with respective identification_scores:
			zloka
				9 two zloka halves, both perfect
				8 two zloka halves, one perfect and one imperfect
				(not currently supported: two zloka halves, both imperfect)
				9 one zloka half, perfect
				(not currently supported: one zloka half, imperfect)
			samavftta, upajAti, vizamavftta, ardhasamavftta
				9 vizamavftta perfect (trivial, in progress)
				(currently not supported: 5 vizamavftta imperfect)
				(currently not supported but planned: 9 ardhasamavftta perfect)
				(currently not supported: 5 ardhasamavftta imperfect)
				9 samavftta perfect
				8 upajAti perfect trizwuB
				7 samavftta imperfect (2-3 lines match)
				7 upajAti perfect non-trizwuB
				6 upajAti imperfect trizwuB
				5 upajAti imperfect non-trizwuB
			jAti
				8 jAti perfect
				(currently not supported but planned: 5 jAti imperfect)

		Embeds identification results as Verse.meter_label and Verse.identification_score.
		Returns string corresponding to Verse.meter_label. - currently
		Returns int result 1 if successul and 0 if not. - planned
		"""

		self.identification_attempt_count += 1

		# anuzwuB

		anuzwuB_diagnostic = self.test_as_anuzwuB(Vrs) # Diagnostic if successful, None if not
		if anuzwuB_diagnostic and Vrs.identification_score == meter_scores["max score"]:
			return 1

		# samavftta, upajAti, vizamavftta, ardhasamavftta

		success_samavftta_etc = self.test_as_samavftta_etc(Vrs)
		if success_samavftta_etc and Vrs.identification_score >= 8: return 1
		# i.e., if upajāti or anything imperfect, also continue on to check jāti

		# problem: how to change above handling for rare case
		# where ardhasamavftta is also jAti?

		# jāti

		success_jAti = self.test_as_jAti(Vrs)

		if anuzwuB_diagnostic or success_samavftta_etc or success_jAti:
			return 1
		else:
			return 0


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

	def wiggle_iterator(self, start_pos, part_len, resplit_option):
		"""
		E.g., if len(pāda)==10,
		then from the breaks between each pāda,
		wiggle as far as 6 in either direction,
		first right, then left.
		"""

		iter_list = [start_pos]
		if resplit_option == 'resplit_max':
			distance_multiplier = 0.50 # wiggle as far as 50% of part_len
		elif resplit_option == 'resplit_lite':
			distance_multiplier = 0.35 # wiggle as far as 35% of part_len
		max_wiggle_distance = int(part_len * distance_multiplier + 1)
		for i in range(1, max_wiggle_distance):
			iter_list.append(start_pos+i)
			iter_list.append(start_pos-i)
		return iter_list

	def resplit_Verse(self, syllable_list, ab_pAda_br, bc_pAda_br, cd_pAda_br):
		"""
		Input does not have newlines
		"""
		syllable_list = list(syllable_list)  # don't mutate caller's list
		_fix_conjunct_pada_boundaries(syllable_list, [ab_pAda_br, cd_pAda_br])
		sss = scansion_syllable_separator
		return (sss.join(syllable_list[:ab_pAda_br]) + '\n'
				+ sss.join(syllable_list[ab_pAda_br:bc_pAda_br]) + '\n'
				+ sss.join(syllable_list[bc_pAda_br:cd_pAda_br]) + '\n'
				+ sss.join(syllable_list[cd_pAda_br:])
				)

	def wiggle_identify(	self, Vrs, syllable_list,
							VrsTster,
							pAda_brs, quarter_len):
		"""Returns a list for MeterIdentifier.Verses_found"""

		self._anuzwuB_half_cache = {}
		pos_iterators = {}
		for k in ['ab', 'bc', 'cd']:
			if  (
				k == 'bc' and
				VrsTster.resplit_keep_midpoint == True
				):
				pos_iterators['bc'] = [ pAda_brs['bc'] ] # i.e., do not wiggle bc
			else:
				pos_iterators[k] = self.wiggle_iterator(
					pAda_brs[k], quarter_len,
					resplit_option=VrsTster.resplit_option
					)

		wiggle_resplit_output_buffer = ''
		temp_V = None
		S = Sc()
		Verses_found = []

		for pos_ab in pos_iterators['ab']:
			for pos_bc in pos_iterators['bc']:
				for pos_cd in pos_iterators['cd']:

					try:

						new_text_syllabified = self.resplit_Verse(
							syllable_list, pos_ab, pos_bc, pos_cd)

						# print()
						# print(new_text_syllabified)
						# import pdb; pdb.set_trace()

						temp_V = copy(Vrs)
						temp_V.text_syllabified = new_text_syllabified

						# print(temp_V.text_syllabified.replace('\n','\t'))

						temp_V.syllable_weights = S.scan_syllable_weights(
							temp_V.text_syllabified)
						temp_V.morae_per_line = S.count_morae(
							temp_V.syllable_weights)
						temp_V.gaRa_abbreviations = '\n'.join(
						[ S.gaRa_abbreviate(line) for line in temp_V.syllable_weights.split('\n') ]
						)

						# temp_V.meter_label = VrsTster.attempt_identification(temp_V)
						success = VrsTster.attempt_identification(temp_V)

						if success:
							Verses_found.append(temp_V)

						if temp_V.identification_score == meter_scores["max score"]:
							return Verses_found
							# done when any perfect exemplar found
							# for greater speed and efficiency
							# disable for debugging:
							 	# check whether finding multiple 9s
								# check whether any temp_V breaks system


					except IndexError:
						continue

		return Verses_found


	def find_meter(self, rw_str, from_scheme=None):

		self.Scanner = S = Sc()
		tmp_V = S.scan(rw_str, from_scheme=from_scheme)
		all_weights_one_line = tmp_V.syllable_weights.replace('\n','')
		all_syllables_one_line = tmp_V.text_syllabified.replace('\n','')

		pathyA_odd = list(meter_patterns.anuzwuB_pAda['odd'].keys())[0][1:-1]
		even = meter_patterns.anuzwuB_pAda['even'][1:-1]
		overall_pattern = pathyA_odd + even
		# regex = re.compile('(?=(%s))' % overall_pattern) # > e.g. [(2, 2), (18, 18)]
		regex = re.compile('%s' % overall_pattern) # > e.g. [(2, 18), (18, 34)]

		# matches = re.findall(regex, all_weights_one_line) # > e.g. ['lglglgglgglllgll', 'gggllggllggglglg']
		matches = re.finditer(regex, all_weights_one_line)
		match_index_pairs = [ (m.start(0), m.end(0)) for m in matches ] # > e.g. [(2, 18), (18, 34)]

		match_strings = []
		syllables = all_syllables_one_line.split(' ')
		for mip in match_index_pairs:
			match_strings.append( ''.join(syllables[ mip[0]:mip[1] ]) )

		verses_found = []
		for ms in match_strings:
			V = self.identify_meter(ms, from_scheme='SLP', resplit_option='resplit_max')
			verses_found.append(V)

		return verses_found


	def identify_meter(self, rw_str,
		resplit_option=default_resplit_option,
		resplit_keep_midpoint=default_resplit_keep_midpoint,
		from_scheme=None):
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
				2) resplit_max: discards input newlines, resplits based on overall length
				3) resplit_lite: initializes length-based resplit with input newlines
				4) single_pAda: evaluates input as single pAda (verse quarter)

		order
				first: default or override
				if fails, then: try other modes in set order (1 2 3; depending on length 4)

		"""

		self.Scanner = S = Sc()

		# gets back mostly populated Verse object
		V = S.scan(rw_str, from_scheme=from_scheme)

		self.VerseTester = VT = VerseTester()
		self.VerseTester.resplit_option = resplit_option
		self.VerseTester.resplit_keep_midpoint = resplit_keep_midpoint

		if resplit_option in ['none', 'single_pAda'] or V.text_cleaned == '':
			success = VT.attempt_identification(V)
			# label and score set internally

		elif resplit_option in ['resplit_max', 'resplit_lite']:

			# capture any user-provided pāda breaks (= all newlines after scansion cleaning)
			newline_indices = [
				m.start() for m in re.finditer('\n', V.text_syllabified)
				]

			# make pure list of only syllables
			syllable_list = (
							V.text_syllabified.replace('\n', '')
							).split(scansion_syllable_separator)
			# discard any final separator(s)
			try:
				while syllable_list[-1] == '':
					syllable_list.pop(-1)
			except IndexError: pass # empty list...

			# initialize length-based pāda breaks
			pAda_brs = {}
			total_syll_count = len(syllable_list)
			quarter_len = int(total_syll_count / 4)
			pAda_brs['ab'], pAda_brs['bc'], pAda_brs['cd'] = (
				[i * quarter_len for i in [1, 2, 3]]
				)

			if len(newline_indices) == 3:

				if resplit_option == 'resplit_lite':
					# full three breaks provided (ab, bc, cd), override all length-based ones
					pAda_brs['ab'], pAda_brs['bc'], pAda_brs['cd'] = (
						V.text_syllabified[:newline_indices[i]].count(
							scansion_syllable_separator
							) for i in [0, 1, 2]
						)

				elif	(
							resplit_option == 'resplit_max' and
							self.VerseTester.resplit_keep_midpoint
						):
					# full three breaks provided, override second (bc) only, keep other two
					pAda_brs['bc'] = V.text_syllabified[:newline_indices[1]].count(
						scansion_syllable_separator)

			elif len(newline_indices) == 1:

				if 	(
						resplit_option == 'resplit_lite'
					) or (
						resplit_option == 'resplit_max' and
						self.VerseTester.resplit_keep_midpoint
					):
				# only one break provided, assume bc, override that one, keep other two

					pAda_brs['bc'] = V.text_syllabified[:newline_indices[0]].count(
					scansion_syllable_separator)

			else:
				# unusable number of user-provided pāda breaks
				# do nothing, use length-based ones
				# could give user some feedback...
				pass

			# use initial Verse to generate potentially large number of others Verses
			# store their respective results internally, collect overall list
			self.Verses_found =	self.wiggle_identify(
				V, syllable_list, VT,
				pAda_brs, quarter_len
				)

			# pick best match, i.e. resulting Verse with highest identification_score
			if len(self.Verses_found) > 0:
				self.Verses_found.sort(key=lambda x: x.identification_score, reverse=True)
				V = self.Verses_found[0] # replace initial Verse object

		if V.meter_label == None: # initial Verse label still not populated
			V.meter_label = 'na kiṃcid adhyavasitam'  # do not return None
			V.identification_score = meter_scores["none found"] # did at least try

		return V
