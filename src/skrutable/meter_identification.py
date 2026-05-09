from skrutable.scansion import Scanner as Sc
from skrutable import meter_patterns
from skrutable.config import load_config_dict_from_json_file
from skrutable.utils import _DEBUG_TIMING, _section_totals, timed
import re
import time as _time
from copy import copy
from concurrent.futures import ProcessPoolExecutor
from dataclasses import dataclass
from typing import Optional

BATCH_MAX_WORKERS = 3
BATCH_PARALLEL_THRESHOLD = 100

# load config variables
config = load_config_dict_from_json_file()
scansion_syllable_separator = config["scansion_syllable_separator"]  # e.g. " "
default_resplit_option = config["default_resplit_option"]  # e.g. "none"
default_resplit_keep_midpoint = config["default_resplit_keep_midpoint"]  # e.g. True
disable_non_trizwuB_upajAti = config["disable_non_trizwuB_upajAti"]  # e.g. True
meter_scores = config["meter_scores"]  # dict

_category_totals = {}  # { category: { section: float seconds } }, single source of truth


_ARDHASAMAVRTTA_NAMES = [
	'aparavaktra', 'upacitra', 'puṣpitāgrā', 'viyoginī', 'vegavatī',
	'hariṇaplutā', 'aupacchandasika', 'ajñātārdhasamavṛtta',
]
_JATI_SUBCATS = ['āryā', 'gīti', 'upagīti', 'udgīti', 'āryāgīti']

def _meter_label_to_category(label):
	if not label or 'adhyavasitam' in label:
		return 'na kiṃcid adhyavasitam'
	if 'anuṣṭubh' in label or 'anustubh' in label:
		return 'anuṣṭubh'
	if 'upajāti' in label:
		return 'upajāti'
	if any(label.startswith(n) for n in _ARDHASAMAVRTTA_NAMES):
		return 'ardhasamavṛtta'
	if 'ardhasamavṛtta' in label:
		return 'ardhasamavṛtta'
	if label.startswith('udgatā'):
		return 'viṣamavṛtta'
	if any(label.startswith(s) for s in _JATI_SUBCATS):
		return 'jāti'
	if 'jāti' in label or 'vaitālīya' in label or 'mātrā' in label:
		return 'jāti'
	return 'samavṛtta'


def _verse_is_perfect(V):
	"""True iff V.is_perfect was set True at identification time."""
	return getattr(V, 'is_perfect', False)


def flush_profiling_report(write_file=False, wall_clock_secs=None):
	"""Print the accumulated profiling table to stderr, then reset all counters.

	Pass write_file=True to also write the table to profiling_debug.txt alongside the library source.
	Pass wall_clock_secs to append a wall-clock vs table-total speedup line (useful for batch/parallel runs).
	Safe to call even when _DEBUG_TIMING is False (no-op).
	"""
	if not _DEBUG_TIMING or not _category_totals:
		return
	import sys, os
	scan_keys = ('scan_clean', 'scan_translit', 'scan_syllabify', 'scan_weights', 'scan_morae_gana')
	type_keys = ('anuzwuB', 'samavftta_etc', 'samavftta', 'upajAti', 'ardhasamavftta_perfect', 'vizamavftta', 'jAti', 'lev_samavftta', 'lev_ardha', 'lev_vizama')
	type_abbrev = {
		'anuzwuB': 'anuṣṭ', 'samavftta_etc': 'vftta↑', 'samavftta': 'samav', 'upajAti': 'upajāti',
		'ardhasamavftta_perfect': 'ardha✓', 'vizamavftta': 'vizama',
		'jAti': 'jāti',
		'lev_samavftta': 'lev✗sama', 'lev_ardha': 'lev✗ardh', 'lev_vizama': 'lev✗visa',
	}
	scan_abbrev = {'scan_clean': 'clean', 'scan_translit': 'transl', 'scan_syllabify': 'syl', 'scan_weights': 'wts', 'scan_morae_gana': 'mor+g'}
	cat_order = ['anuṣṭubh', 'samavṛtta', 'upajāti', 'ardhasamavṛtta', 'viṣamavṛtta', 'jāti', 'na kiṃcid adhyavasitam']
	hdr_scan_abbrevs = [scan_abbrev[k] for k in scan_keys]
	hdr_type_abbrevs = [type_abbrev[k] for k in type_keys]
	val_w = len('0.00s')
	col_cat_w = max(len(c) for c in cat_order + ['category']) + 2
	sub_w = max(len('scan∑'), len('types∑'), len('total'), val_w) + 2
	scan_col_ws = [max(len(a), val_w) + 1 for a in hdr_scan_abbrevs]
	type_col_ws = [max(len(a), val_w) + 1 for a in hdr_type_abbrevs]
	all_counts = [b.get('_count', 0) for b in _category_totals.values()]
	count_w = max(len(str(max(all_counts))) if all_counts else 1, len('perf'), len('impf')) + 1

	def fmt_row(scan_vals, type_vals):
		return ('  '.join(v.rjust(w) for v, w in zip(scan_vals, scan_col_ws))
			+ '  ' + '  '.join(v.rjust(w) for v, w in zip(type_vals, type_col_ws)))

	n_verses = sum(b.get('_count', 0) for b in _category_totals.values())
	wiggle_count = _section_totals.get('wiggle_count', 0)
	lines = [f'\n=== {n_verses} verses / {wiggle_count} resplit candidates ===']
	hdr = ('  ' + 'category'.ljust(col_cat_w)
		+ 'perf'.rjust(count_w) + 'impf'.rjust(count_w)
		+ 'total'.rjust(sub_w) + 'scan∑'.rjust(sub_w) + 'types∑'.rjust(sub_w)
		+ '  ' + fmt_row(hdr_scan_abbrevs, hdr_type_abbrevs))
	sep_w = col_cat_w + count_w * 2 + sub_w * 3 + 2 + sum(w + 2 for w in scan_col_ws) - 2 + 2 + sum(w + 2 for w in type_col_ws) - 2
	sep = '  ' + '-' * sep_w
	lines += [hdr, sep]
	total_perfect = 0
	total_imperfect = 0
	for cat in cat_order:
		bucket = _category_totals.get(cat)
		if not bucket:
			continue
		cat_scan = sum(bucket.get(k, 0.0) for k in scan_keys)
		cat_types = sum(bucket.get(k, 0.0) for k in type_keys)
		scan_vals = [f'{bucket.get(k, 0.0):.2f}s' for k in scan_keys]
		type_vals = [f'{bucket.get(k, 0.0):.2f}s' for k in type_keys]
		n_perf = bucket.get('_perfect_count', 0)
		n_impf = bucket.get('_count', 0) - n_perf
		total_perfect += n_perf
		total_imperfect += n_impf
		lines.append('  ' + cat.ljust(col_cat_w)
			+ str(n_perf).rjust(count_w) + str(n_impf).rjust(count_w)
			+ f'{cat_scan + cat_types:.2f}s'.rjust(sub_w)
			+ f'{cat_scan:.2f}s'.rjust(sub_w)
			+ f'{cat_types:.2f}s'.rjust(sub_w)
			+ '  ' + fmt_row(scan_vals, type_vals))
	lines.append(sep)
	total_scan = sum(sum(_category_totals.get(c, {}).get(k, 0.0) for c in cat_order) for k in scan_keys)
	total_types = sum(sum(_category_totals.get(c, {}).get(k, 0.0) for c in cat_order) for k in type_keys)
	total_scan_vals = [f'{sum(_category_totals.get(c, {}).get(k, 0.0) for c in cat_order):.2f}s' for k in scan_keys]
	total_type_vals = [f'{sum(_category_totals.get(c, {}).get(k, 0.0) for c in cat_order):.2f}s' for k in type_keys]
	lines.append('  ' + 'TOTAL'.ljust(col_cat_w)
		+ str(total_perfect).rjust(count_w) + str(total_imperfect).rjust(count_w)
		+ f'{total_scan + total_types:.2f}s'.rjust(sub_w)
		+ f'{total_scan:.2f}s'.rjust(sub_w)
		+ f'{total_types:.2f}s'.rjust(sub_w)
		+ '  ' + fmt_row(total_scan_vals, total_type_vals))
	if wall_clock_secs is not None:
		table_total = total_scan + total_types
		speedup = table_total / wall_clock_secs if wall_clock_secs > 0 else float('inf')
		lines.append(f'\n  table total: {table_total:.2f}s  |  wall-clock: {wall_clock_secs:.2f}s  |  parallelization speedup: {speedup:.2f}x')
	block = '\n'.join(lines) + '\n'
	if write_file:
		timing_path = os.path.join(os.path.dirname(__file__), 'profiling_debug.txt')
		with open(timing_path, 'w', encoding='utf-8') as _f:
			_f.write(block)
	print(block, file=sys.stderr, flush=True)
	_category_totals.clear()
	_section_totals.clear()


@dataclass
class Diagnostic:
	perfect_id_label: Optional[str] = None         # 'pathyā', 'indravajrā', etc.; None if imperfect
	imperfect_label_sanskrit: Optional[dict] = None # keyed by pada (1–4 or 'odd'/'even'); Sanskrit only
	imperfect_label_english: Optional[dict] = None  # keyed by pada (1–4 or 'odd'/'even'); English only
	problem_syllables: Optional[dict] = None        # keyed by pada (1–4 or 'odd'/'even'); None if perfect

	def perfect(self):
		return self.perfect_id_label is not None

	def length_error(self):
		return (
			self.imperfect_label_english is not None and
			any(v in ('hypermetric', 'hypometric') for v in self.imperfect_label_english.values())
		)

	def imperfect(self):
		return self.imperfect_label_sanskrit is not None and not self.length_error()


ARDHASAMAVFTTA_EDIT_DISTANCE_THRESHOLD = 2
VIZAMAVFTTA_EDIT_DISTANCE_THRESHOLD = 2

# Precompute vizamavṛtta canonical weight strings once (avoid per-call gaṇa→weight conversion)
_gaRa_to_weights_map = {v: k for k, v in meter_patterns.gaRas_by_weights.items()}
def _gaRa_str_to_weights(s):
	return ''.join(_gaRa_to_weights_map.get(ch, ch) for ch in s)
_vizamavftta_precomputed = [
	(gaRas, [_gaRa_str_to_weights(g) for g in gaRas], label)
	for gaRas, label in meter_patterns.vizamavftta_by_4_tuple.items()
]


def _levenshtein_align(observed, canonical):
	"""Return (distance, problem_indices) comparing observed lg string to canonical,
	excluding the final (anceps) position from both distance and problem reporting.

	- Same length, mismatches: problem_indices = list of mismatched 0-based positions.
	- Hypermetric (len > canonical): problem_indices = [index of extra syllable] (positive).
	- Hypometric (len < canonical): problem_indices = [-(gap_pos + 1)] where gap_pos is
	  the 0-based canonical position of the missing syllable. The -(k+1) encoding keeps
	  gap position 0 distinct from a positive index (never 0). Frontend recovers the
	  canonical column as abs(v) - 1 for any negative v.
	"""
	obs = observed[:-1]   # exclude final anceps
	can = canonical[:-1]

	if len(obs) == len(can):
		bad = [i for i in range(len(obs)) if obs[i] != can[i]]
		return len(bad), bad

	# Standard Levenshtein DP with early exit once threshold is exceeded
	m, n = len(obs), len(can)
	dp = [[0] * (n + 1) for _ in range(m + 1)]
	for i in range(m + 1): dp[i][0] = i
	for j in range(n + 1): dp[0][j] = j
	for i in range(1, m + 1):
		row_min = n  # track row minimum for early exit
		for j in range(1, n + 1):
			cost = 0 if obs[i-1] == can[j-1] else 1
			dp[i][j] = min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + cost)
			if dp[i][j] < row_min: row_min = dp[i][j]
		if row_min > ARDHASAMAVFTTA_EDIT_DISTANCE_THRESHOLD:
			return row_min, []

	dist = dp[m][n]

	# Traceback to find the operation site
	i, j = m, n
	while i > 0 or j > 0:
		if i > 0 and j > 0 and dp[i][j] == dp[i-1][j-1] + (0 if obs[i-1] == can[j-1] else 1):
			i -= 1; j -= 1
		elif i > 0 and dp[i][j] == dp[i-1][j] + 1:
			# deletion from observed — observed has an extra syllable at position i-1
			return dist, [i - 1]
		else:
			# insertion into observed — observed is missing canonical syllable at position j-1
			return dist, [-(j - 1 + 1)]  # encode as -(gap_pos + 1), always negative

	return dist, []


def _decompose_into_mAtragaNas(weights_str, gana_6_morae, gana_8_morae):
	"""
	Decomposes an ardha (half-verse) weight string into mātrā-gaṇas.
	Returns list of l/g substrings, one per gaṇa position (8 total).
	gana_6_morae: 1 for upagīti-style 6th gaṇa (la), 4 for ja/kha.
	gana_8_morae: 2 for standard final long, 4 for āryāgīti.

	Fully greedy: consume syllables into each gaṇa until the running mora count
	meets or exceeds the target, then stop. A perfect verse hits each target
	exactly and never overflows. An imperfect verse overflows at the gaṇa where
	the syllable sequence diverges — making the specific problem visible to
	validation. Gaṇa 8 takes all remaining syllables.
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
			seg += s
			seg_morae += 1 if s == 'l' else 2
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
	Validates mātrā-gaṇa structure for the āryā family:
	  1. (general) Odd positions (1,3,5,7) must not be ja (lgl).
	  2. (meter-specific) Position 6 must be ja/kha (gana_6_morae==4) or la (gana_6_morae==1).
	  3. (meter-specific) Position 8 must be a single anceps syllable (l or g) for all
	     meters except āryāgīti, where it must be 4 morae and not kha (llll).

	Returns None if valid.
	Returns (failure_code, bad_syllable_indices) on failure, where bad_syllable_indices
	is a list of 0-indexed syllable offsets within the ardha weight string.

	Checks rules in position order on however many ganas were built, so the first
	actual rule violation is always reported. Wrong gana count is only a fallback
	when no earlier rule was broken.
	"""
	names = meter_patterns.mAtragaNa_names
	slug = _jati_name_slugs.get(jati_name, jati_name)
	prefix = f'neill_{slug}_ardha{ardha_num}' if slug else 'neill_jati'

	# build cumulative syllable offsets so we can report syllable positions
	offsets = []
	cur = 0
	for g in ganas:
		offsets.append(cur)
		cur += len(g)

	# check each position's rules in order, stopping at the first violation
	for pos in range(1, min(len(ganas), 8) + 1):
		g = ganas[pos - 1]
		morae = g.count('l') + g.count('g') * 2
		start = offsets[pos - 1]
		bad_syls = list(range(start, start + len(g)))

		if pos in (1, 2, 3, 4, 5, 7):
			if morae != 4:
				return (f'{prefix}_general_0_gana{pos}_wrong_morae', bad_syls)
			if pos in (1, 3, 5, 7) and names.get(g) == 'ja':
				return (f'{prefix}_general_1_gana{pos}', bad_syls)

		elif pos == 6:
			if gana_6_morae == 4 and names.get(g) not in ('ja', 'kha'):
				return (f'{prefix}_2_gana6_not_ja_kha', bad_syls)
			if gana_6_morae == 1 and g != 'l':
				return (f'{prefix}_2_gana6_not_la', bad_syls)

		elif pos == 8:
			if jati_name == 'āryāgīti':
				if morae != 4 or names.get(g) == 'kha':
					return (f'{prefix}_3_gana8_not_valid_aryagiti', bad_syls)
			else:
				if g not in ('l', 'g'):
					return (f'{prefix}_3_gana8_not_anceps', bad_syls)

	if len(ganas) != 8:
		return ('hahn_jati_wrong_gana_count', [])

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
	from skrutable.phonemes import SLP_vowels, SLP_long_vowels, SLP_consonants
	vowel_set = set(SLP_vowels)
	already_heavy_finals = set(SLP_long_vowels) | set(SLP_consonants) | {'M', 'H'}

	for br in break_positions:
		if br <= 0 or br >= len(syllable_list):
			continue
		syl = syllable_list[br]
		# find index of first vowel in syllable
		vowel_idx = next((i for i, c in enumerate(syl) if c in vowel_set), None)
		if vowel_idx is None or vowel_idx < 2:
			continue  # no vowel found, or only 0-1 onset consonants — nothing to move
		# skip if previous syllable is already heavy by nature
		if syllable_list[br - 1] and syllable_list[br - 1][-1] in already_heavy_finals:
			continue
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
		self._ardha_stash = []  # accumulated across wiggle candidates
		self._vizama_stash = []  # accumulated across wiggle candidates
		self._samavftta_has_length_error = False  # set during evaluate_samavftta perfect_only pass

	def combine_results(self, Vrs, new_label, new_score, new_is_perfect=False):
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
			Vrs.is_perfect = new_is_perfect

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

		# Length check first: both pādas must be 8 syllables.
		# If both are wrong the split itself is bad — return None rather than
		# producing a misleading imperfect label for one side.
		even_len_ok = len(even_pAda_weights) == 8
		odd_len_ok = len(odd_pAda_weights) == 8
		if not even_len_ok and not odd_len_ok:
			result = None  # both wrong: bad split, not credible
		elif not even_len_ok:
			hyper = len(even_pAda_weights) > 8
			result = Diagnostic(
				imperfect_label_sanskrit={'even': 'adhikākṣarā' if hyper else 'ūnākṣarā'},
				imperfect_label_english={'even': 'hypermetric' if hyper else 'hypometric'},
				problem_syllables={'even': list(range(len(even_pAda_weights)))},
			)
		elif not odd_len_ok:
			hyper = len(odd_pAda_weights) > 8
			result = Diagnostic(
				imperfect_label_sanskrit={'odd': 'adhikākṣarā' if hyper else 'ūnākṣarā'},
				imperfect_label_english={'odd': 'hypermetric' if hyper else 'hypometric'},
				problem_syllables={'odd': list(range(len(odd_pAda_weights)))},
			)
		else:
			# Both pādas are 8 syllables. Even pāda must match first; only if it
			# does do we bother checking the odd pāda's pathyā/vipulā pattern.
			if not re.match(meter_patterns.anuzwuB_pAda['even'], even_pAda_weights):
				# Even pāda fails the general rule — try known asamīcīna patterns
				# before falling back to the generic ja-gaṇa violation label.
				result = None
				for weights_pattern, (label, problem_syls, code) in meter_patterns.anuzwuB_pAda_asamIcIna['even'].items():
					if re.match(weights_pattern, even_pAda_weights):
						result = Diagnostic(
							imperfect_label_sanskrit={'even': label},
							imperfect_label_english={'even': code},
							problem_syllables={'even': problem_syls},
						)
						break
				if result is None:
					result = Diagnostic(
						imperfect_label_sanskrit={'even': 'asamīcīnā, [caturthāt ...] yujo j'},
						imperfect_label_english={'even': 'Syllables 5–7 in even pāda must be ja-gaṇa (Piṅgala; Hahn 2014 anuṣṭubh general rule 4)'},
						problem_syllables={'even': [4, 5, 6]},
					)
			else:
				# Even pāda is valid; check odd pāda for pathyā or a known vipulā.
				result = None
				for weights_pattern, label in meter_patterns.anuzwuB_pAda['odd'].items():
					if re.match(weights_pattern, odd_pAda_weights):
						result = Diagnostic(perfect_id_label=label)
						break
				if result is None:
					# Odd pāda matched no perfect pattern — try asamīcīna patterns
					# before falling back to the generic ya-gaṇa violation label.
					for weights_pattern, (label, problem_syls, code) in meter_patterns.anuzwuB_pAda_asamIcIna['odd'].items():
						if re.match(weights_pattern, odd_pAda_weights):
							result = Diagnostic(
								imperfect_label_sanskrit={'odd': label},
								imperfect_label_english={'odd': code},
								problem_syllables={'odd': problem_syls},
							)
							break
				if result is None:
					result = Diagnostic(
						imperfect_label_sanskrit={'odd': 'asamīcīnā, [vipulāyām asatyām] ya[gaṇaḥ ayujaḥ] caturthāt [syāt]'},
						imperfect_label_english={'odd': 'Syllables 5–7 in odd pāda must be ya-gaṇa when no vipulā applies (Piṅgala; Hahn 2014 anuṣṭubh pathyā)'},
						problem_syllables={'odd': [4, 5, 6]},
					)

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

		# test each half independently
		pAdas_ab_result = self.test_as_anuzwuB_half(w_p[0], w_p[1])
		pAdas_cd_result = self.test_as_anuzwuB_half(w_p[2], w_p[3])

		# if per-pāda split produced nothing, retry treating each ardha as a single unit
		if pAdas_ab_result is None and pAdas_cd_result is None:
			ardham_eva_result = self.test_as_anuzwuB_half(w_p[0] + w_p[1], w_p[2] + w_p[3])
			if ardham_eva_result is None:
				return None
			if ardham_eva_result.perfect():
				Vrs.meter_label = f"anuṣṭubh (ardham eva: {ardham_eva_result.perfect_id_label})"
				Vrs.identification_score = meter_scores["anuṣṭubh, half, single half perfect)"]
				Vrs.is_perfect = True
				Vrs.diagnostic = ardham_eva_result
				return ardham_eva_result
			elif ardham_eva_result.imperfect():
				label_str = '; '.join(f"{k}: {v}" for k, v in ardham_eva_result.imperfect_label_sanskrit.items())
				Vrs.meter_label = f"anuṣṭubh (ardham eva: {label_str})"
				Vrs.identification_score = meter_scores["anuṣṭubh, half, single half imperfect)"]
				Vrs.is_perfect = False
				Vrs.diagnostic = ardham_eva_result
				return ardham_eva_result
			else:
				return None

		# if only one half produced a result, the split is too bad to call
		if pAdas_ab_result is None or pAdas_cd_result is None:
			return None

		# both halves perfect

		if pAdas_ab_result.perfect() and pAdas_cd_result.perfect():
			Vrs.meter_label = f"anuṣṭubh (1,2: {pAdas_ab_result.perfect_id_label}; 3,4: {pAdas_cd_result.perfect_id_label})"
			Vrs.identification_score = meter_scores["anuṣṭubh, full, both halves perfect)"]
			Vrs.is_perfect = True
			Vrs.diagnostic = {'ab': pAdas_ab_result, 'cd': pAdas_cd_result}
			return pAdas_ab_result

		# one half imperfect

		elif pAdas_ab_result.imperfect() and pAdas_cd_result.perfect():
			ab_str = '; '.join(f"{k}: {v}" for k, v in pAdas_ab_result.imperfect_label_sanskrit.items())
			Vrs.meter_label = f"anuṣṭubh (1,2: {ab_str}; 3,4: {pAdas_cd_result.perfect_id_label})"
			Vrs.identification_score = meter_scores["anuṣṭubh, full, one half perfect, one imperfect)"]
			Vrs.is_perfect = False
			Vrs.diagnostic = {'ab': pAdas_ab_result, 'cd': pAdas_cd_result}
			return pAdas_ab_result
		elif pAdas_ab_result.perfect() and pAdas_cd_result.imperfect():
			cd_str = '; '.join(f"{k}: {v}" for k, v in pAdas_cd_result.imperfect_label_sanskrit.items())
			Vrs.meter_label = f"anuṣṭubh (1,2: {pAdas_ab_result.perfect_id_label}; 3,4: {cd_str})"
			Vrs.identification_score = meter_scores["anuṣṭubh, full, one half perfect, one imperfect)"]
			Vrs.is_perfect = False
			Vrs.diagnostic = {'ab': pAdas_ab_result, 'cd': pAdas_cd_result}
			return pAdas_cd_result

		# both halves imperfect

		elif pAdas_ab_result.imperfect() and pAdas_cd_result.imperfect():
			ab_str = '; '.join(f"{k}: {v}" for k, v in pAdas_ab_result.imperfect_label_sanskrit.items())
			cd_str = '; '.join(f"{k}: {v}" for k, v in pAdas_cd_result.imperfect_label_sanskrit.items())
			Vrs.meter_label = f"anuṣṭubh (1,2: {ab_str}; 3,4: {cd_str})"
			Vrs.identification_score = meter_scores["anuṣṭubh, full, both halves imperfect)"]
			Vrs.is_perfect = False
			Vrs.diagnostic = {'ab': pAdas_ab_result, 'cd': pAdas_cd_result}
			return pAdas_ab_result

		# one half perfect, one length error

		elif pAdas_ab_result.length_error() and pAdas_cd_result.perfect():
			ab_str = '; '.join(f"{k}: {v}" for k, v in pAdas_ab_result.imperfect_label_sanskrit.items())
			Vrs.meter_label = f"anuṣṭubh (1,2: ?? {ab_str}; 3,4: {pAdas_cd_result.perfect_id_label})"
			Vrs.identification_score = meter_scores["anuṣṭubh, full, one half perfect, one length error)"]
			Vrs.is_perfect = False
			Vrs.diagnostic = {'ab': pAdas_ab_result, 'cd': pAdas_cd_result}
			return pAdas_cd_result
		elif pAdas_ab_result.perfect() and pAdas_cd_result.length_error():
			cd_str = '; '.join(f"{k}: {v}" for k, v in pAdas_cd_result.imperfect_label_sanskrit.items())
			Vrs.meter_label = f"anuṣṭubh (1,2: {pAdas_ab_result.perfect_id_label}; 3,4: ?? {cd_str})"
			Vrs.identification_score = meter_scores["anuṣṭubh, full, one half perfect, one length error)"]
			Vrs.is_perfect = False
			Vrs.diagnostic = {'ab': pAdas_ab_result, 'cd': pAdas_cd_result}
			return pAdas_ab_result

		# one half imperfect, one length error

		elif pAdas_ab_result.length_error() and pAdas_cd_result.imperfect():
			ab_str = '; '.join(f"{k}: {v}" for k, v in pAdas_ab_result.imperfect_label_sanskrit.items())
			cd_str = '; '.join(f"{k}: {v}" for k, v in pAdas_cd_result.imperfect_label_sanskrit.items())
			Vrs.meter_label = f"anuṣṭubh (1,2: ?? {ab_str}; 3,4: {cd_str})"
			Vrs.identification_score = meter_scores["anuṣṭubh, full, one half imperfect, one length error)"]
			Vrs.is_perfect = False
			Vrs.diagnostic = {'ab': pAdas_ab_result, 'cd': pAdas_cd_result}
			return pAdas_cd_result
		elif pAdas_ab_result.imperfect() and pAdas_cd_result.length_error():
			ab_str = '; '.join(f"{k}: {v}" for k, v in pAdas_ab_result.imperfect_label_sanskrit.items())
			cd_str = '; '.join(f"{k}: {v}" for k, v in pAdas_cd_result.imperfect_label_sanskrit.items())
			Vrs.meter_label = f"anuṣṭubh (1,2: {ab_str}; 3,4: ?? {cd_str})"
			Vrs.identification_score = meter_scores["anuṣṭubh, full, one half imperfect, one length error)"]
			Vrs.is_perfect = False
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


	def evaluate_samavftta(self, Vrs, perfect_only=False):
		# sufficient pAdasamatva already assured, now just evaluate

		wbp = Vrs.syllable_weights.split('\n') # weights by pāda

		# get index of most frequent pāda type
		wbp_sans_final = [ w[:-1] for w in wbp ] # omit final anceps from consideration
		most_freq_pAda = max( set(wbp_sans_final), key=wbp_sans_final.count )
		i = wbp_sans_final.index(most_freq_pAda)

		w_to_id = wbp[i] # weights to id, including final anceps
		g_to_id = Vrs.gaRa_abbreviations.split('\n')[i] # gaRa abbreviation to id

		# look for match among regexes with same length
		canonical_pattern = g_to_id  # fallback for ajñātasamavṛtta case
		for gaRa_pattern in meter_patterns.samavfttas_by_family_and_gaRa[len(w_to_id)].keys():

			regex = re.compile(gaRa_pattern)

			if re.match(regex, g_to_id):

				canonical_pattern = meter_patterns.choose_heavy_gaRa_pattern(gaRa_pattern)
				meter_label = meter_patterns.samavfttas_by_family_and_gaRa[len(w_to_id)][gaRa_pattern]
				meter_label += ' [%d: %s]' % (len(w_to_id), canonical_pattern)
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

		# Build per-pāda diagnostic: length errors (Levenshtein), then pattern errors.
		# In perfect_only mode, skip Levenshtein — just register the result and return.
		problem_syllables = {}
		per_pada_sanskrit = {}
		per_pada_english = {}
		canonical = w_to_id  # includes final anceps
		has_length_error = any(len(w) != len(canonical) for w in wbp[:4])

		if perfect_only and has_length_error:
			# Defer length-error annotation to the imperfect pass; register result now.
			self._samavftta_has_length_error = True
			old_score = Vrs.identification_score
			self.combine_results(Vrs, new_label=meter_label, new_score=score)
			if score >= old_score:
				Vrs.diagnostic = Diagnostic(perfect_id_label=meter_label)
			return

		for pada_num, w in enumerate(wbp[:4], start=1):
			if w == canonical:
				pass  # no entry → perfect for this pada
			elif len(w) > len(canonical):
				_, prob_indices = _levenshtein_align(w, canonical)
				problem_syllables[pada_num] = prob_indices
				per_pada_sanskrit[pada_num] = 'adhikākṣarā'
				per_pada_english[pada_num] = 'hypermetric'
			elif len(w) < len(canonical):
				_, prob_indices = _levenshtein_align(w, canonical)
				problem_syllables[pada_num] = prob_indices
				per_pada_sanskrit[pada_num] = 'ūnākṣarā'
				per_pada_english[pada_num] = 'hypometric'
			else:
				# correct length but wrong pattern; final anceps always matches so skip it
				bad = [j for j in range(len(w) - 1) if w[j] != canonical[j]]
				if bad:
					problem_syllables[pada_num] = bad
					per_pada_sanskrit[pada_num] = 'vikṛtavṛtta'
					per_pada_english[pada_num] = f'does not match expected gaṇa pattern {canonical_pattern}'

		has_any_error = bool(problem_syllables) or bool(per_pada_english)

		if imperfect_note is None and not has_any_error:
			# all four pādas match perfectly
			diagnostic = Diagnostic(perfect_id_label=meter_label)
		elif imperfect_note is None:
			# correct pāda count but some pādas have length or pattern errors
			diagnostic = Diagnostic(
				perfect_id_label=meter_label,
				imperfect_label_sanskrit=per_pada_sanskrit or None,
				imperfect_label_english=per_pada_english or None,
				problem_syllables=problem_syllables or None,
			)
		else:
			# fewer than 4 matching pādas; append any length notes to the meter_label
			length_notes = [f"pāda {p} {v}" for p, v in per_pada_sanskrit.items() if v in ('adhikākṣarā', 'ūnākṣarā')]
			full_imperfect_str = imperfect_note
			if length_notes:
				full_imperfect_str += "; " + "; ".join(length_notes)
				meter_label = meter_label.replace(f"({imperfect_note})", f"({full_imperfect_str})")
			diagnostic = Diagnostic(
				imperfect_label_sanskrit=per_pada_sanskrit or None,
				imperfect_label_english=per_pada_english or None,
				problem_syllables=problem_syllables or None,
			)

		# score arbitration: may tie with pre-existing result (e.g., upajāti)
		old_score = Vrs.identification_score
		self.combine_results(Vrs, new_label=meter_label, new_score=score, new_is_perfect=imperfect_note is None and not has_any_error)
		if score >= old_score:
			Vrs.diagnostic = diagnostic


	def evaluate_ardhasamavftta(self, Vrs, perfect_only=False):
		# bail early if even a perfect result can't beat what's already recorded
		if meter_scores["ardhasamavṛtta, perfect"] <= Vrs.identification_score:
			return

		wbp = Vrs.syllable_weights.split('\n')  # weights by pāda
		tsyl = Vrs.text_syllabified
		gaRa = Vrs.gaRa_abbreviations
		morae = Vrs.morae_per_line

		if perfect_only:
			# Search all patterns; stash imperfect candidates (no Levenshtein yet), commit perfect immediately.
			for (odd_canonical, even_canonical), meter_label in \
					meter_patterns.ardhasamavftta_by_odd_even_weights.items():
				# length pre-filter
				if any(
					len(w) != (len(odd_canonical) if pada_num in (1, 3) else len(even_canonical))
					for pada_num, w in enumerate(wbp[:4], start=1)
				):
					# stash if within threshold (no Levenshtein — just length check)
					if all(
						abs(len(w) - (len(odd_canonical) if pada_num in (1, 3) else len(even_canonical)))
						<= ARDHASAMAVFTTA_EDIT_DISTANCE_THRESHOLD
						for pada_num, w in enumerate(wbp[:4], start=1)
					):
						self._ardha_stash.append((wbp, meter_label, odd_canonical, even_canonical, tsyl, gaRa, morae))
					continue

				# exact length: direct string comparison for perfect match (no Levenshtein needed)
				if all(
					w == (odd_canonical if pada_num in (1, 3) else even_canonical)
					for pada_num, w in enumerate(wbp[:4], start=1)
				):
					score = meter_scores["ardhasamavṛtta, perfect"]
					old_score = Vrs.identification_score
					self.combine_results(Vrs, new_label=meter_label, new_score=score, new_is_perfect=True)
					if score >= old_score:
						Vrs.diagnostic = Diagnostic(perfect_id_label=meter_label)
					self._ardha_stash = []  # perfect found; no need for imperfect pass
					return
				# same length but not perfect — stash without distance computation
				self._ardha_stash.append((wbp, meter_label, odd_canonical, even_canonical, tsyl, gaRa, morae))
			return

		# Imperfect pass: consume the stash built during perfect_only pass.
		# If no stash (e.g. called directly without a prior perfect_only pass), build it now.
		if not self._ardha_stash:
			self.evaluate_ardhasamavftta(Vrs, perfect_only=True)
		if not self._ardha_stash:
			return

		# Run full Levenshtein on every stash entry to find minimum total distance.
		best_total_dist = None
		best_entry = None
		for _stash_wbp, _label, _odd_can, _even_can, _stash_tsyl, _stash_gaRa, _stash_morae in self._ardha_stash:
			total_dist = sum(
				_levenshtein_align(w, _odd_can if pada_num in (1, 3) else _even_can)[0]
				for pada_num, w in enumerate(_stash_wbp[:4], start=1)
			)
			if total_dist <= ARDHASAMAVFTTA_EDIT_DISTANCE_THRESHOLD:
				if best_total_dist is None or total_dist < best_total_dist:
					best_total_dist = total_dist
					best_entry = (_stash_wbp, _label, _odd_can, _even_can, _stash_tsyl, _stash_gaRa, _stash_morae)

		if best_entry is None:
			return

		best_stash_wbp, best_label, best_odd_canonical, best_even_canonical, *_ = best_entry
		score = meter_scores["ardhasamavṛtta, imperfect"] - (best_total_dist - 1)
		if score <= 0:
			return

		problem_syllables = {}
		per_pada_sanskrit = {}
		per_pada_english = {}
		for pada_num, w in enumerate(best_stash_wbp[:4], start=1):
			canonical = best_odd_canonical if pada_num in (1, 3) else best_even_canonical
			dist, prob_indices = _levenshtein_align(w, canonical)
			if dist == 0:
				continue
			problem_syllables[pada_num] = prob_indices
			meter_name = best_label.split(' = ')[0]
			if len(w) > len(canonical):
				per_pada_sanskrit[pada_num] = 'adhikākṣarā'
				per_pada_english[pada_num] = 'hypermetric'
			elif len(w) < len(canonical):
				per_pada_sanskrit[pada_num] = 'ūnākṣarā'
				per_pada_english[pada_num] = 'hypometric'
			else:
				per_pada_sanskrit[pada_num] = 'vikṛtavṛtta'
				per_pada_english[pada_num] = f'does not match expected gaṇa pattern for {meter_name}'

		sa_vals = list(per_pada_sanskrit.items())
		if len(sa_vals) == 1:
			suffix = f"asamīcīnā, pāda {sa_vals[0][0]}: {sa_vals[0][1]}"
		else:
			suffix = 'asamīcīnā, ' + '; '.join(f"pāda {p}: {v}" for p, v in sa_vals)
		imperfect_label = best_label + f" ({suffix})"

		old_score = Vrs.identification_score
		self.combine_results(Vrs, new_label=imperfect_label, new_score=score)
		if score >= old_score:
			Vrs.diagnostic = Diagnostic(
				perfect_id_label=imperfect_label,
				imperfect_label_sanskrit=per_pada_sanskrit or None,
				imperfect_label_english=per_pada_english or None,
				problem_syllables=problem_syllables or None,
			)


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
			# For non-triṣṭubh-jagatī mixes: drop pādas of non-majority length so
			# the identifier works on the largest consistent set.
			most_freq_pAda_len = max( set(wbp_lens), key=wbp_lens.count )
			to_exclude = []
			for i, weights in enumerate(wbp):
				if len(weights) != most_freq_pAda_len:
					to_exclude.append(i)
			excluded_indices = list(to_exclude)
			for i in reversed(to_exclude): # delete in descending index order, avoid index errors
				del wbp[i]
				del wbp_lens[i]
				del gs_to_id[i]

		# Calculate maximum achievable score before doing any pattern work,
		# and bail early if we can't beat the current best.
		potential_score = meter_scores["upajāti, perfect"]
		if 11 not in wbp_lens: # no triṣṭubh (could be mixed with jagatī)
			potential_score -= 1
		if 	(
				len(wbp_lens) != 4 and
				unique_sorted_lens != [11, 12]
			): # not perfect, less than 4 being analyzed
			potential_score -= 2
		if 	( potential_score < Vrs.identification_score
			# not going to beat pre-existing result (e.g. 7 from imperfect samavftta)
			) or ( disable_non_trizwuB_upajAti
				and potential_score < meter_scores["upajāti, imperfect"]
			):
			return

		# Identify each remaining pāda individually and collect labels.
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

		# Assign score based on how complete and homogeneous the match is.
		family = meter_patterns.samavftta_family_names[wbp_lens[0]] if wbp_lens[0] < 27 else 'daṇḍaka'
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

		# Extra penalties for especially weak upajāti results.
		if len(wbp_lens) == 2:
			score -= 1  # two pādas excluded instead of one
		if all(lbl.startswith('ajñātam') for lbl in meter_labels):
			score -= 1

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

		# Build diagnostic: excluded pādas are flagged as hyper/hypometric relative
		# to the majority length; included pādas contribute no error entry.
		most_freq_len = wbp_lens[0] if wbp_lens else None
		problem_syllables = {}
		per_pada_sanskrit = {}
		per_pada_english = {}
		for pada_num in range(1, 5):
			orig_len = wbp_lens_orig[pada_num - 1] if pada_num - 1 < len(wbp_lens_orig) else None
			if pada_num - 1 in excluded_indices:
				syls = list(range(orig_len)) if orig_len is not None else []
				problem_syllables[pada_num] = syls
				if orig_len is not None and most_freq_len is not None:
					hyper = orig_len > most_freq_len
					per_pada_sanskrit[pada_num] = 'adhikākṣarā' if hyper else 'ūnākṣarā'
					per_pada_english[pada_num] = 'hypermetric' if hyper else 'hypometric'

		if imperfect_note is None and not per_pada_english:
			# all four pādas included and none flagged
			diagnostic = Diagnostic(perfect_id_label=overall_meter_label)
		elif imperfect_note is None:
			# all four pādas included but some have length errors
			diagnostic = Diagnostic(
				perfect_id_label=overall_meter_label,
				imperfect_label_sanskrit=per_pada_sanskrit or None,
				imperfect_label_english=per_pada_english or None,
				problem_syllables=problem_syllables or None,
			)
		else:
			# fewer than 4 pādas included; append length notes to the meter_label
			length_notes = [f"pāda {p} {v}" for p, v in per_pada_sanskrit.items()]
			if length_notes:
				full_imperfect_str = imperfect_note + "; " + "; ".join(length_notes)
				overall_meter_label = overall_meter_label.replace(f"({imperfect_note})", f"({full_imperfect_str})")
			diagnostic = Diagnostic(
				imperfect_label_sanskrit=per_pada_sanskrit or None,
				imperfect_label_english=per_pada_english or None,
				problem_syllables=problem_syllables or None,
			)

		# score arbitration: may tie with pre-existing result (e.g., samavṛtta)
		old_score = Vrs.identification_score
		self.combine_results(Vrs, overall_meter_label, score, new_is_perfect=imperfect_note is None and not per_pada_english)
		if score >= old_score:
			Vrs.diagnostic = diagnostic


	def is_vizamavftta(self, Vrs, perfect_only=False):
		# bail early if even a perfect result can't beat what's already recorded
		if meter_scores["viṣamavṛtta, perfect"] <= Vrs.identification_score:
			return False

		wbp = Vrs.syllable_weights.split('\n')
		if len(wbp) < 4: return False
		gs_to_id = Vrs.gaRa_abbreviations.split('\n')
		if len(gs_to_id) < 4: return False
		tsyl = Vrs.text_syllabified
		gaRa = Vrs.gaRa_abbreviations
		morae = Vrs.morae_per_line

		if perfect_only:
			for canonicals, canonical_weights, meter_label in _vizamavftta_precomputed:

				# Perfect match via gaṇa abbreviations
				if all(gs_to_id[i] == canonicals[i] for i in range(4)):
					Vrs.identification_score = meter_scores["viṣamavṛtta, perfect"]
					Vrs.meter_label = meter_label
					Vrs.diagnostic = Diagnostic(perfect_id_label=meter_label)
					self._vizama_stash = []
					return True

				# Not perfect — stash if weight lengths are within threshold
				if all(
					abs(len(wbp[i]) - len(canonical_weights[i])) <= VIZAMAVFTTA_EDIT_DISTANCE_THRESHOLD
					for i in range(4)
				):
					self._vizama_stash.append((wbp, meter_label, canonical_weights, tsyl, gaRa, morae))
			return False

		# Imperfect pass: consume the stash.
		if not self._vizama_stash:
			self.is_vizamavftta(Vrs, perfect_only=True)
		if not self._vizama_stash:
			return False

		best_total_dist = None
		best_entry = None
		for _wbp, _label, _canonical_weights, _tsyl, _gaRa, _morae in self._vizama_stash:
			total_dist = sum(
				_levenshtein_align(_wbp[i], _canonical_weights[i])[0]
				for i in range(4)
			)
			if total_dist <= VIZAMAVFTTA_EDIT_DISTANCE_THRESHOLD:
				if best_total_dist is None or total_dist < best_total_dist:
					best_total_dist = total_dist
					best_entry = (_wbp, _label, _canonical_weights, _tsyl, _gaRa, _morae)

		if best_entry is None:
			return False

		best_wbp, best_label, best_canonical_weights, *_ = best_entry
		score = meter_scores["viṣamavṛtta, imperfect"] - (best_total_dist - 1)
		if score <= 0:
			return False

		problem_syllables = {}
		per_pada_sanskrit = {}
		per_pada_english = {}
		for i, w in enumerate(best_wbp[:4]):
			canonical = best_canonical_weights[i]
			dist, prob_indices = _levenshtein_align(w, canonical)
			if dist == 0:
				continue
			pada_num = i + 1
			problem_syllables[pada_num] = prob_indices
			meter_name = best_label.split(' = ')[0]
			if len(w) > len(canonical):
				per_pada_sanskrit[pada_num] = 'adhikākṣarā'
				per_pada_english[pada_num] = 'hypermetric'
			elif len(w) < len(canonical):
				per_pada_sanskrit[pada_num] = 'ūnākṣarā'
				per_pada_english[pada_num] = 'hypometric'
			else:
				per_pada_sanskrit[pada_num] = 'vikṛtavṛtta'
				per_pada_english[pada_num] = f'does not match expected gaṇa pattern for {meter_name}'

		sa_vals = list(per_pada_sanskrit.items())
		if len(sa_vals) == 1:
			suffix = f"asamīcīnā, pāda {sa_vals[0][0]}: {sa_vals[0][1]}"
		else:
			suffix = 'asamīcīnā, ' + '; '.join(f"pāda {p}: {v}" for p, v in sa_vals)
		imperfect_label = best_label + f" ({suffix})"

		old_score = Vrs.identification_score
		self.combine_results(Vrs, new_label=imperfect_label, new_score=score)
		if score >= old_score:
			Vrs.diagnostic = Diagnostic(
				perfect_id_label=imperfect_label,
				imperfect_label_sanskrit=per_pada_sanskrit or None,
				imperfect_label_english=per_pada_english or None,
				problem_syllables=problem_syllables or None,
			)
		return True

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
			timed('samavftta')(self.evaluate_samavftta)(Vrs)
			return 1 # max score already reached



		# test perfect single pāda of samavṛtta
		if ( self.pAdasamatva_count == 0 and self.resplit_option == "single_pAda"):
			timed('samavftta')(self.evaluate_samavftta)(Vrs)

		# test perfect viṣamavṛtta (Levenshtein for imperfect deferred to imperfect pass)
		if self.pAdasamatva_count == 0 and timed('vizamavftta')(self.is_vizamavftta)(Vrs, perfect_only=True):
			# will give id_score == 9
			# label and score already set in is_vizamavftta if test was successful
			return 1 # max score already reached

		# test perfect upajāti

		unique_sorted_lens = list(set(wbp_lens))
		unique_sorted_lens.sort()
		if 	len(unique_sorted_lens) == 1: # all same length
			# will give id_score in [8, 7], may tie with above
			timed('upajAti')(self.evaluate_upajAti)(Vrs)
			if Vrs.identification_score == 8: return 1 # best score compared to below
			# otherwise, max score not necessarily yet reached, don't return

		# test imperfect samavftta (Levenshtein for length errors deferred to imperfect pass)
		if self.pAdasamatva_count in [2, 3]:
			# will give id_score in [7, 6], may tie with above
			timed('samavftta')(self.evaluate_samavftta)(Vrs, perfect_only=True)
			# max score not necessarily yet reached, don't return

		# test imperfect upajāti
		if (
			len( list(set(wbp_lens)) ) in [2, 3] or
			unique_sorted_lens == [11, 12]
			): # either not all same length or triṣṭubh-jagatī mix
			# will give id_score in [6, 5, 4], may tie with above
			timed('upajAti')(self.evaluate_upajAti)(Vrs)

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

			# ardha-level morae gate: the final syllable is anceps — a light final
			# may stand for heavy, so one short is acceptable when the last is light.
			ok1 = m1 == std_ardha[0] or (m1 == std_ardha[0] - 1 and ardha1_w[-1] == 'l')
			ok2 = m2 == std_ardha[1] or (m2 == std_ardha[1] - 1 and ardha2_w[-1] == 'l')
			if not ok1 or not ok2:
				# "Close" check: within 1 mora of expected on both ardhas.
				# A light final can stand for heavy, closing a 1-mora gap when hypometric —
				# so credit +1 only when actual < expected. A hypermetric ardha with a
				# light final is still hypermetric; the anceps doesn't hurt it.
				eff1 = m1 + (1 if m1 < std_ardha[0] and ardha1_w[-1] == 'l' else 0)
				eff2 = m2 + (1 if m2 < std_ardha[1] and ardha2_w[-1] == 'l' else 0)
				close1 = abs(eff1 - std_ardha[0]) <= 1
				close2 = abs(eff2 - std_ardha[1]) <= 1
				if close1 and close2:
					jati_label = jAti_name + " (%s)" % quarter_label
					likely_score = meter_scores["jāti, likely"]
					if likely_score > Vrs.identification_score:
						per_pada_sanskrit = {}
						per_pada_english = {}
						# Attribute ardha-level mora error to the ardha-final (even) pāda.
						ardha_morae_pairs = [
							(m1, std_ardha[0], 2),
							(m2, std_ardha[1], 4),
						]
						for actual, expected, even_pada in ardha_morae_pairs:
							hyper = actual > expected
							per_pada_sanskrit[even_pada] = 'adhikamātrā' if hyper else 'ūnamātrā'
							per_pada_english[even_pada] = f"ardha mora count off from expected {expected}"
						# Build meter_label suffix from the per-ardha directions.
						sa_vals = list(per_pada_sanskrit.values())
						if len(set(sa_vals)) == 1:
							suffix = sa_vals[0]
						else:
							suffix = '; '.join(f"ardha {i+1}: {v}" for i, v in enumerate(sa_vals))
						Vrs.meter_label = jati_label + f" ({suffix})"
						Vrs.identification_score = likely_score
						Vrs.is_perfect = False
						Vrs.diagnostic = Diagnostic(
							imperfect_label_sanskrit=per_pada_sanskrit or None,
							imperfect_label_english=per_pada_english or None,
						)
				continue

			# Decompose each ardha into mātrā-gaṇas and validate against Hahn's rules.
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
				"""Split ardha gaṇas into two pāda abbreviation strings by syllable count."""
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

			def _pada_morae_from_ganas(ganas, pada_syl_count):
				"""Return (pada_a_morae, pada_b_morae) by splitting gaṇas at pada_syl_count syllables."""
				cur = 0
				split = len(ganas)
				for i, g in enumerate(ganas):
					if cur >= pada_syl_count:
						split = i
						break
					cur += len(g)
				def mora(gs): return sum(g.count('l') + g.count('g') * 2 for g in gs)
				return mora(ganas[:split]), mora(ganas[split:])

			def _pada_split_ok(morae_pair, expected_pair, ganas, pada_syl_count):
				"""True if the gaṇa-derived pāda morae match expected (with anceps allowance)."""
				actual_a, actual_b = _pada_morae_from_ganas(ganas, pada_syl_count)
				exp_a, exp_b = expected_pair
				cur = 0; split = len(ganas)
				for i, g in enumerate(ganas):
					if cur >= pada_syl_count: split = i; break
					cur += len(g)
				last_a = ganas[split - 1][-1] if split > 0 and ganas[split - 1] else ''
				last_b = ganas[-1][-1] if ganas[-1] else ''
				ok_a = actual_a == exp_a or (actual_a == exp_a - 1 and last_a == 'l')
				ok_b = actual_b == exp_b or (actual_b == exp_b - 1 and last_b == 'l')
				return ok_a and ok_b

			if err1 or err2:
				# Gaṇa rules broken — report the specific violation.
				# TODO: it is an open empirical question whether a pāda mora-count
				# mismatch (Vrs.morae_per_line vs quarter_morae) ever occurs without
				# an underlying gaṇa error. If corpus evidence shows it never does,
				# the separate pāda-morae check in the else-branch below is redundant
				# and can be removed, leaving gaṇa errors as the sole failure mode.
				#
				# Map the bad syllable offsets back to pāda-level indices.
				pada1_len = len(w_p[0]) if len(w_p) >= 4 else 0
				def ardha_syls_to_padas(bad_offsets, pada_a, pada_b, pada_a_len):
					a_syls = [i for i in bad_offsets if i < pada_a_len]
					b_syls = [i - pada_a_len for i in bad_offsets if i >= pada_a_len]
					return {pada_a: a_syls, pada_b: b_syls}

				# prob: pāda → list of bad syllable offsets within that pāda.
				prob = {1: [], 2: [], 3: [], 4: []}
				if err1:
					code, bad = err1
					prob.update(ardha_syls_to_padas(bad, 1, 2, pada1_len))
				if err2:
					code2, bad2 = err2
					pada3_len = len(w_p[2]) if len(w_p) >= 4 else 0
					prob.update(ardha_syls_to_padas(bad2, 3, 4, pada3_len))

				def _gana_error_sanskrit(code):
					if 'wrong_gana_count' in code:
						return 'asamīcīnā, gaṇasaṃkhyā na aṣṭau'
					if 'general_0_gana' in code:
						n = code.split('_gana')[1].split('_')[0]
						_ordinals = {'1':'prathama','2':'dvitīya','3':'tṛtīya','4':'caturtha',
									 '5':'pañcama','7':'saptama'}
						o = _ordinals.get(n, n)
						return f'asamīcīnā, {o}gaṇaḥ na caturmātraḥ'
					if 'general_1_gana' in code:
						return 'asamīcīnā, jaḥ ayuggaṇe'
					if code.endswith('_2_gana6_not_ja_kha'):
						return 'asamīcīnā, ṣaṣṭhagaṇaḥ na jaḥ/khaḥ'
					if code.endswith('_2_gana6_not_la'):
						return 'asamīcīnā, ṣaṣṭhagaṇaḥ na laḥ'
					if code.endswith('_3_gana8_not_anceps'):
						return 'asamīcīnā, aṣṭamagaṇaḥ na ekākṣaraḥ'
					if code.endswith('_3_gana8_not_valid_aryagiti'):
						return 'asamīcīnā, aṣṭamagaṇaḥ na caturmātraḥ (akha)'
					return code
				def _gana_error_english(code):
					if 'wrong_gana_count' in code:
						return 'Ardha does not contain exactly 8 mātrā-gaṇas (Hahn general, definition)'
					if 'general_0_gana' in code:
						n = code.split('_gana')[1].split('_')[0]
						return f'Gaṇa {n} does not have exactly 4 morae (Hahn general, definition)'
					if 'general_1_gana' in code:
						return 'Odd gaṇa positions (1, 3, 5, 7) must never be ja-gaṇa (Hahn general rule 1)'
					if code.endswith('_2_gana6_not_ja_kha'):
						return 'The 6th gaṇa must be ja or kha in this meter (Hahn general rule 2)*'
					if code.endswith('_2_gana6_not_la'):
						return 'The 6th gaṇa must be a single laghu in this meter (Hahn special rule 2)'
					if code.endswith('_3_gana8_not_anceps'):
						return 'The last gaṇa of both ardhas must be a single anceps syllable (Hahn general, 8th gaṇa)*'
					if code.endswith('_3_gana8_not_valid_aryagiti'):
						return 'The last gaṇa of both ardhas must be 4 moras long and not kha-gaṇa in āryāgīti (Hahn special rule 4)*'
					return code
				# build per-pāda labels — each error maps to the specific pādas where
				# prob has non-empty syllable lists; for ardha-level errors with no
				# specific syllables (e.g. wrong gana count), label both pādas
				label_sa_by_pada = {}
				label_en_by_pada = {}
				for err, padas in ((err1, [1, 2]), (err2, [3, 4])):
					if not err:
						continue
					code = err[0]
					sa = _gana_error_sanskrit(code)
					en = _gana_error_english(code)
					padas_with_syls = [p for p in padas if prob.get(p)]
					for p in (padas_with_syls if padas_with_syls else padas[:1]):
						label_sa_by_pada[p] = sa
						label_en_by_pada[p] = en

				# Build ardha-located error string: "1,2: <err>; 3,4: <err>"
				# using label_sa_by_pada which keys on pāda number (1–4).
				def _ardha_error_str(err, padas):
					if not err:
						return None
					# representative pāda for this ardha: first one with a syllable hit,
					# or just the first pāda of the ardha if no syllable-level location
					padas_with_syls = [p for p in padas if prob.get(p)]
					rep = padas_with_syls[0] if padas_with_syls else padas[0]
					sa = label_sa_by_pada.get(rep)
					if sa is None:
						return None
					pada_str = ','.join(str(p) for p in (padas_with_syls if padas_with_syls else padas[:1]))
					return f"{pada_str}: {sa}"
				ardha1_str = _ardha_error_str(err1, [1, 2])
				ardha2_str = _ardha_error_str(err2, [3, 4])
				parts = [s for s in [ardha1_str, ardha2_str] if s]
				imperfect_label_sa = '; '.join(parts) if parts else _gana_error_sanskrit((err1 or err2)[0])

				jati_label = jAti_name + " (%s)" % quarter_label
				jati_score = meter_scores["jāti, imperfect"]
				# penalise pāda mora mismatches so that resplit attempts with better
				# pāda alignment score higher and win arbitration in combine_results
				if len(w_p) >= 4:
					for pi, (actual, expected) in enumerate(zip(Vrs.morae_per_line, quarter_morae)):
						is_ardha_final = (pi % 2 == 1)
						anceps_ok = (is_ardha_final and actual == expected - 1
									 and w_p[pi] and w_p[pi][-1] == 'l')
						if actual != expected and not anceps_ok:
							jati_score -= 1
				if jati_score >= Vrs.identification_score:
					Vrs.meter_label = jati_label + f" ({imperfect_label_sa})"
					Vrs.identification_score = jati_score
					Vrs.is_perfect = False
					Vrs.mAtragaNa_abbreviations = mAtragaNa_abbrevs
					Vrs.diagnostic = Diagnostic(
						imperfect_label_sanskrit=label_sa_by_pada or None,
						imperfect_label_english=label_en_by_pada or None,
						problem_syllables=prob or None,
					)
				return 1

			# Gaṇa rules passed — check whether pāda-level morae also match.
			jati_label = jAti_name + " (%s)" % quarter_label
			def quarters_ok(actual, expected, weights):
				if len(actual) < 4 or len(weights) < 4:
					return False
				return all(
					actual[i] == expected[i] or
					# anceps allowed only at ends of pādas 2 and 4 (ardha-final positions)
					(i % 2 == 1 and actual[i] == expected[i] - 1 and weights[i] and weights[i][-1] == 'l')
					for i in range(4)
				)
			# Perfect: all four pāda morae match (with anceps allowance at ardha ends).
			# Imperfect: gaṇas valid but pāda split is off — report per-pāda mora mismatch.
			if quarters_ok(Vrs.morae_per_line, quarter_morae, w_p):
				score = meter_scores["jāti, perfect"]
				diagnostic = Diagnostic(perfect_id_label=jati_label)
				new_label = jati_label
			else:
				score = meter_scores["jāti, imperfect"]
				per_pada_sanskrit = {}
				per_pada_english = {}
				for i, (actual, expected) in enumerate(zip(Vrs.morae_per_line, quarter_morae), start=1):
					is_ardha_final = (i % 2 == 0)
					anceps_ok = (is_ardha_final and actual == expected - 1
								 and i - 1 < len(w_p) and w_p[i-1] and w_p[i-1][-1] == 'l')
					if actual != expected and not anceps_ok:
						hyper = actual > expected
						per_pada_sanskrit[i] = 'adhikamātrā' if hyper else 'ūnamātrā'
						per_pada_english[i] = f"pāda mora count doesn't match expected pattern {list(quarter_morae)}"
				diagnostic = Diagnostic(
					imperfect_label_sanskrit=per_pada_sanskrit or None,
					imperfect_label_english=per_pada_english or None,
				)
				sa_vals = list(per_pada_sanskrit.values())
				if len(set(sa_vals)) == 1:
					suffix = f"asamīcīnā, {sa_vals[0]}"
				else:
					suffix = 'asamīcīnā, ' + '; '.join(f"pāda {p}: {v}" for p, v in per_pada_sanskrit.items())
				new_label = jati_label + f" ({suffix})"

			# Score arbitration: only update if this result ties or beats current best.
			if score >= Vrs.identification_score:
				Vrs.meter_label = new_label
				Vrs.identification_score = score
				Vrs.is_perfect = score == meter_scores["jāti, perfect"]
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
		self._samavftta_has_length_error = False

		# anuzwuB
		success_anuzwuB = timed('anuzwuB')(self.test_as_anuzwuB)(Vrs)
		if success_anuzwuB and Vrs.identification_score == meter_scores["max score"]:
			return 1

		# samavftta, upajAti, vizamavftta
		_inner_keys = ('samavftta', 'upajAti', 'vizamavftta')
		_pre_inner = {k: _section_totals.get(k, 0.0) for k in _inner_keys} if _DEBUG_TIMING else None
		success_samavftta_etc = timed('samavftta_etc')(self.test_as_samavftta_etc)(Vrs)
		if _DEBUG_TIMING:
			inner_delta = sum(_section_totals.get(k, 0.0) - _pre_inner[k] for k in _inner_keys)
			_section_totals['samavftta_etc'] -= inner_delta
		if success_samavftta_etc and Vrs.identification_score >= 8:
			return 1
		# i.e., if upajāti or anything imperfect, also continue on to check jāti

		# ardhasamavftta perfect-only pass (Levenshtein but bails on imperfect)
		# Odd pādas 10–12, even pādas 11–13; with threshold 2, viable range is 9–15.
		# Lower bound 9 excludes anuṣṭubh (8 syllables) which is the most common false candidate.
		wbp_lens_ardha = [len(line) for line in Vrs.syllable_weights.split('\n')]
		_ardha_viable = (
			wbp_lens_ardha.count(11) != 4 and  # exclude 4×11 triṣṭubh upajāti
			all(9 <= l <= 15 for l in wbp_lens_ardha[:4])
		)
		if _ardha_viable:
			timed('ardhasamavftta_perfect')(self.evaluate_ardhasamavftta)(Vrs, perfect_only=True)
		if _ardha_viable and Vrs.identification_score >= meter_scores["ardhasamavṛtta, perfect"]:
			return 1

		# jāti
		success_jAti = timed('jAti')(self.test_as_jAti)(Vrs)
		if success_jAti and Vrs.identification_score >= meter_scores["max score"]:
			return 1

		# imperfect pass: deferred Levenshtein annotation for samavftta length errors.
		if self._samavftta_has_length_error:
			timed('lev_samavftta')(self.evaluate_samavftta)(Vrs)

		if success_anuzwuB or success_samavftta_etc or success_jAti or Vrs.identification_score >= meter_scores["ardhasamavṛtta, perfect"]:
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
		VrsTster._ardha_stash = []
		VrsTster._vizama_stash = []
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

		temp_V = None
		S = Sc()
		Verses_found = []

		for pos_ab in pos_iterators['ab']:
			for pos_bc in pos_iterators['bc']:
				for pos_cd in pos_iterators['cd']:

					try:
						new_text_syllabified = self.resplit_Verse(
							syllable_list, pos_ab, pos_bc, pos_cd)

						temp_V = copy(Vrs)
						temp_V.text_syllabified = new_text_syllabified

						if _DEBUG_TIMING:
							_section_totals['wiggle_count'] = _section_totals.get('wiggle_count', 0) + 1

						temp_V.syllable_weights = timed('scan_weights')(S.scan_syllable_weights)(
							temp_V.text_syllabified)
						temp_V.morae_per_line = timed('scan_morae_gana')(S.count_morae)(
							temp_V.syllable_weights)
						temp_V.gaRa_abbreviations = timed('scan_morae_gana')(
							lambda: '\n'.join([ S.gaRa_abbreviate(line) for line in temp_V.syllable_weights.split('\n') ])
						)()

						success = VrsTster.attempt_identification(temp_V)

						if success:
							Verses_found.append(temp_V)

						# short-circuit as soon as any perfect result is found
						if temp_V.identification_score == meter_scores["max score"]:
							return Verses_found

					except IndexError:
						continue

		return Verses_found


	def find_meter(self, rw_str, from_scheme=None):

		self.Scanner = S = Sc()
		tmp_V = S.scan(rw_str, from_scheme=from_scheme)
		all_weights_one_line = tmp_V.syllable_weights.replace('\n','')
		all_syllables_one_line = tmp_V.text_syllabified.replace('\n','')

		# Build a regex matching one pathyā half-verse (16 syllables) to slide across
		# the flattened weight string and locate candidate anuṣṭubh verses.
		pathyA_odd = list(meter_patterns.anuzwuB_pAda['odd'].keys())[0][1:-1]
		even = meter_patterns.anuzwuB_pAda['even'][1:-1]
		overall_pattern = pathyA_odd + even
		regex = re.compile('%s' % overall_pattern)

		matches = re.finditer(regex, all_weights_one_line)
		match_index_pairs = [ (m.start(0), m.end(0)) for m in matches ]

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

		if _DEBUG_TIMING:
			_pre_keys = ('scan_clean', 'scan_translit', 'scan_syllabify', 'scan_weights', 'scan_morae_gana',
				'anuzwuB', 'samavftta', 'upajAti', 'vizamavftta',
				'ardhasamavftta_perfect', 'jAti', 'lev_samavftta', 'lev_ardha', 'lev_vizama', 'samavftta_etc')
			_pre = {k: _section_totals.get(k, 0.0) for k in _pre_keys}

		# gets back mostly populated Verse object
		V = S.scan(rw_str, from_scheme=from_scheme)

		self.VerseTester = VT = VerseTester()
		self.VerseTester.resplit_option = resplit_option
		self.VerseTester.resplit_keep_midpoint = resplit_keep_midpoint

		if resplit_option in ['none', 'single_pAda'] or V.text_cleaned == '':
			# No resplitting: test the verse exactly as scanned.
			VT._ardha_stash = []
			VT._vizama_stash = []
			success = VT.attempt_identification(V)
			# Post-identification: deferred imperfect ardhasamavṛtta pass over stash.
			if VT._ardha_stash and meter_scores["ardhasamavṛtta, imperfect"] > V.identification_score:
				timed('lev_ardha')(VT.evaluate_ardhasamavftta)(V)
			# Post-identification: deferred imperfect viṣamavṛtta pass over stash.
			if VT._vizama_stash and meter_scores["viṣamavṛtta, imperfect"] > V.identification_score:
				timed('lev_vizama')(VT.is_vizamavftta)(V)

		elif resplit_option in ['resplit_max', 'resplit_lite']:

			# Capture any user-provided pāda breaks (newlines surviving scansion cleaning).
			newline_indices = [
				m.start() for m in re.finditer('\n', V.text_syllabified)
				]

			# Flatten to a pure syllable list for wiggle_identify.
			syllable_list = (
							V.text_syllabified.replace('\n', '')
							).split(scansion_syllable_separator)
			try:
				while syllable_list[-1] == '':
					syllable_list.pop(-1)
			except IndexError: pass # empty list

			# Seed pāda break positions from quarter-length, then override with
			# user-provided newlines according to resplit mode.
			pAda_brs = {}
			total_syll_count = len(syllable_list)
			quarter_len = int(total_syll_count / 4)
			pAda_brs['ab'], pAda_brs['bc'], pAda_brs['cd'] = (
				[i * quarter_len for i in [1, 2, 3]]
				)

			if len(newline_indices) == 3:
				if resplit_option == 'resplit_lite':
					# all three breaks provided — override all three
					pAda_brs['ab'], pAda_brs['bc'], pAda_brs['cd'] = (
						V.text_syllabified[:newline_indices[i]].count(
							scansion_syllable_separator
							) for i in [0, 1, 2]
						)
				elif	(
							resplit_option == 'resplit_max' and
							self.VerseTester.resplit_keep_midpoint
						):
					# all three breaks provided — override bc only, wiggle the rest
					pAda_brs['bc'] = V.text_syllabified[:newline_indices[1]].count(
						scansion_syllable_separator)

			elif len(newline_indices) == 1:
				if 	(
						resplit_option == 'resplit_lite'
					) or (
						resplit_option == 'resplit_max' and
						self.VerseTester.resplit_keep_midpoint
					):
					# single break provided — treat as bc, wiggle the rest
					pAda_brs['bc'] = V.text_syllabified[:newline_indices[0]].count(
					scansion_syllable_separator)

			else:
				# unusable number of user-provided pāda breaks — use length-based seeds
				pass

			# Generate all wiggle candidates and collect identified ones.
			self.Verses_found =	self.wiggle_identify(
				V, syllable_list, VT,
				pAda_brs, quarter_len
				)

			# Post-wiggle: deferred imperfect ardhasamavṛtta pass over accumulated stash.
			_lev_ardha_t0 = _time.perf_counter() if _DEBUG_TIMING else None
			ardha_stash = VT._ardha_stash
			if ardha_stash:
				best_current_score = (
					max(v.identification_score for v in self.Verses_found)
					if self.Verses_found else 0
				)
				if meter_scores["ardhasamavṛtta, imperfect"] > best_current_score:
					best_total_dist = None
					best_entry = None
					for _stash_wbp, _label, _odd_can, _even_can, _stash_tsyl, _stash_gaRa, _stash_morae in ardha_stash:
						total_dist = sum(
							_levenshtein_align(w, _odd_can if pada_num in (1, 3) else _even_can)[0]
							for pada_num, w in enumerate(_stash_wbp[:4], start=1)
						)
						if total_dist <= ARDHASAMAVFTTA_EDIT_DISTANCE_THRESHOLD:
							if best_total_dist is None or total_dist < best_total_dist:
								best_total_dist = total_dist
								best_entry = (_stash_wbp, _label, _odd_can, _even_can, _stash_tsyl, _stash_gaRa, _stash_morae)
					if best_entry is not None:
						ardha_score = meter_scores["ardhasamavṛtta, imperfect"] - (best_total_dist - 1)
						if ardha_score > best_current_score:
							best_stash_wbp, best_label, best_odd_can, best_even_can, best_stash_tsyl, best_stash_gaRa, best_stash_morae = best_entry
							problem_syllables = {}
							per_pada_sanskrit = {}
							per_pada_english = {}
							for pada_num, w in enumerate(best_stash_wbp[:4], start=1):
								canonical = best_odd_can if pada_num in (1, 3) else best_even_can
								dist, prob_indices = _levenshtein_align(w, canonical)
								if dist == 0:
									continue
								problem_syllables[pada_num] = prob_indices
								meter_name = best_label.split(' = ')[0]
								if len(w) > len(canonical):
									per_pada_sanskrit[pada_num] = 'adhikākṣarā'
									per_pada_english[pada_num] = 'hypermetric'
								elif len(w) < len(canonical):
									per_pada_sanskrit[pada_num] = 'ūnākṣarā'
									per_pada_english[pada_num] = 'hypometric'
								else:
									per_pada_sanskrit[pada_num] = 'vikṛtavṛtta'
									per_pada_english[pada_num] = f'does not match expected gaṇa pattern for {meter_name}'
							sa_vals = list(per_pada_sanskrit.items())
							if len(sa_vals) == 1:
								suffix = f"asamīcīnā, pāda {sa_vals[0][0]}: {sa_vals[0][1]}"
							else:
								suffix = 'asamīcīnā, ' + '; '.join(f"pāda {p}: {v}" for p, v in sa_vals)
							imperfect_label = best_label + f" ({suffix})"
							ardha_Vrs = copy(self.Verses_found[0]) if self.Verses_found else copy(V)
							ardha_Vrs.text_syllabified = best_stash_tsyl
							ardha_Vrs.syllable_weights = '\n'.join(best_stash_wbp)
							ardha_Vrs.gaRa_abbreviations = best_stash_gaRa
							ardha_Vrs.morae_per_line = best_stash_morae
							ardha_Vrs.meter_label = imperfect_label
							ardha_Vrs.identification_score = ardha_score
							ardha_Vrs.diagnostic = Diagnostic(
								perfect_id_label=imperfect_label,
								imperfect_label_sanskrit=per_pada_sanskrit or None,
								imperfect_label_english=per_pada_english or None,
								problem_syllables=problem_syllables or None,
							)
							self.Verses_found.append(ardha_Vrs)
			if _DEBUG_TIMING:
				_section_totals['lev_ardha'] = _section_totals.get('lev_ardha', 0.0) + _time.perf_counter() - _lev_ardha_t0

			# Post-wiggle: deferred imperfect viṣamavṛtta pass over accumulated stash.
			_lev_vizama_t0 = _time.perf_counter() if _DEBUG_TIMING else None
			vizama_stash = VT._vizama_stash
			if vizama_stash:
				best_current_score = (
					max(v.identification_score for v in self.Verses_found)
					if self.Verses_found else 0
				)
				if meter_scores["viṣamavṛtta, imperfect"] > best_current_score:
					best_total_dist = None
					best_entry = None
					for _wbp, _label, _canonicals, _tsyl, _gaRa, _morae in vizama_stash:
						total_dist = sum(
							_levenshtein_align(_wbp[i], _canonicals[i])[0]
							for i in range(4)
						)
						if total_dist <= VIZAMAVFTTA_EDIT_DISTANCE_THRESHOLD:
							if best_total_dist is None or total_dist < best_total_dist:
								best_total_dist = total_dist
								best_entry = (_wbp, _label, _canonicals, _tsyl, _gaRa, _morae)
					if best_entry is not None:
						vizama_score = meter_scores["viṣamavṛtta, imperfect"] - (best_total_dist - 1)
						if vizama_score > best_current_score:
							best_wbp, best_label, best_canonicals, best_tsyl, best_gaRa, best_morae = best_entry
							problem_syllables = {}
							per_pada_sanskrit = {}
							per_pada_english = {}
							for i, w in enumerate(best_wbp[:4]):
								canonical = best_canonicals[i]
								dist, prob_indices = _levenshtein_align(w, canonical)
								if dist == 0:
									continue
								pada_num = i + 1
								problem_syllables[pada_num] = prob_indices
								meter_name = best_label.split(' = ')[0]
								if len(w) > len(canonical):
									per_pada_sanskrit[pada_num] = 'adhikākṣarā'
									per_pada_english[pada_num] = 'hypermetric'
								elif len(w) < len(canonical):
									per_pada_sanskrit[pada_num] = 'ūnākṣarā'
									per_pada_english[pada_num] = 'hypometric'
								else:
									per_pada_sanskrit[pada_num] = 'vikṛtavṛtta'
									per_pada_english[pada_num] = f'does not match expected gaṇa pattern for {meter_name}'
							sa_vals = list(per_pada_sanskrit.items())
							if len(sa_vals) == 1:
								suffix = f"asamīcīnā, pāda {sa_vals[0][0]}: {sa_vals[0][1]}"
							else:
								suffix = 'asamīcīnā, ' + '; '.join(f"pāda {p}: {v}" for p, v in sa_vals)
							imperfect_label = best_label + f" ({suffix})"
							vizama_Vrs = copy(self.Verses_found[0]) if self.Verses_found else copy(V)
							vizama_Vrs.text_syllabified = best_tsyl
							vizama_Vrs.syllable_weights = '\n'.join(best_wbp)
							vizama_Vrs.gaRa_abbreviations = best_gaRa
							vizama_Vrs.morae_per_line = best_morae
							vizama_Vrs.meter_label = imperfect_label
							vizama_Vrs.identification_score = vizama_score
							vizama_Vrs.diagnostic = Diagnostic(
								perfect_id_label=imperfect_label,
								imperfect_label_sanskrit=per_pada_sanskrit or None,
								imperfect_label_english=per_pada_english or None,
								problem_syllables=problem_syllables or None,
							)
							self.Verses_found.append(vizama_Vrs)
			if _DEBUG_TIMING:
				_section_totals['lev_vizama'] = _section_totals.get('lev_vizama', 0.0) + _time.perf_counter() - _lev_vizama_t0

			# Pick the candidate with the highest identification score.
			if len(self.Verses_found) > 0:
				self.Verses_found.sort(key=lambda x: x.identification_score, reverse=True)
				V = self.Verses_found[0]

		if V.meter_label == None:
			# No identification succeeded; return a legible failure label.
			V.meter_label = 'na kiṃcid adhyavasitam'
			V.identification_score = meter_scores["none found"]

		if _DEBUG_TIMING:
			all_keys = ('scan_clean', 'scan_translit', 'scan_syllabify', 'scan_weights', 'scan_morae_gana',
				'anuzwuB', 'samavftta', 'upajAti', 'vizamavftta',
				'ardhasamavftta_perfect', 'jAti', 'lev_samavftta', 'lev_ardha', 'lev_vizama', 'samavftta_etc')
			verse_times = {k: _section_totals.get(k, 0.0) - _pre[k] for k in all_keys}
			verse_times['scan'] = sum(verse_times[k] for k in ('scan_clean', 'scan_translit', 'scan_syllabify', 'scan_weights', 'scan_morae_gana'))
			cat = _meter_label_to_category(V.meter_label)
			bucket = _category_totals.setdefault(cat, {})
			for k, v in verse_times.items():
				bucket[k] = bucket.get(k, 0.0) + v
			bucket['_count'] = bucket.get('_count', 0) + 1
			if _verse_is_perfect(V):
				bucket['_perfect_count'] = bucket.get('_perfect_count', 0) + 1

		return V

	def identify_meter_batch(self, rw_strs,
		resplit_option=default_resplit_option,
		resplit_keep_midpoint=default_resplit_keep_midpoint,
		from_scheme=None):
		"""
		Parallel version of identify_meter() for a list of raw strings.

		Spawns up to BATCH_MAX_WORKERS worker processes, one task per verse.
		Returns a list of Verse objects in the same order as the input.
		When _DEBUG_TIMING is on, merges per-verse timing dicts back into
		the main process's _category_totals so flush_profiling_report() works.
		Falls back to serial processing for small batches below BATCH_PARALLEL_THRESHOLD.
		"""
		if len(rw_strs) < BATCH_PARALLEL_THRESHOLD:
			return [self.identify_meter(s, resplit_option=resplit_option,
				resplit_keep_midpoint=resplit_keep_midpoint, from_scheme=from_scheme)
				for s in rw_strs]

		args = [(s, resplit_option, resplit_keep_midpoint, from_scheme, _DEBUG_TIMING) for s in rw_strs]
		with ProcessPoolExecutor(max_workers=BATCH_MAX_WORKERS) as executor:
			results = list(executor.map(_identify_meter_worker, args))

		if _DEBUG_TIMING:
			for V, verse_times, cat in results:
				bucket = _category_totals.setdefault(cat, {})
				for k, v in verse_times.items():
					bucket[k] = bucket.get(k, 0.0) + v
				bucket['_count'] = bucket.get('_count', 0) + 1
				if _verse_is_perfect(V):
					bucket['_perfect_count'] = bucket.get('_perfect_count', 0) + 1
			return [V for V, _, _ in results]

		return results


def _identify_meter_worker(args):
	"""Module-level worker function (must be picklable). One verse per call."""
	rw_str, resplit_option, resplit_keep_midpoint, from_scheme, debug_timing = args
	if debug_timing:
		import skrutable.utils as _utils
		_utils._DEBUG_TIMING = True
	MI = MeterIdentifier()
	all_keys = ('scan_clean', 'scan_translit', 'scan_syllabify', 'scan_weights', 'scan_morae_gana',
		'anuzwuB', 'samavftta', 'upajAti', 'vizamavftta',
		'ardhasamavftta_perfect', 'jAti', 'lev_samavftta', 'lev_ardha', 'lev_vizama', 'samavftta_etc')
	if debug_timing:
		pre = {k: _section_totals.get(k, 0.0) for k in all_keys}
	V = MI.identify_meter(
		rw_str,
		resplit_option=resplit_option,
		resplit_keep_midpoint=resplit_keep_midpoint,
		from_scheme=from_scheme,
	)
	if debug_timing:
		verse_times = {k: _section_totals.get(k, 0.0) - pre[k] for k in all_keys}
		verse_times['scan'] = sum(verse_times[k] for k in ('scan_clean', 'scan_translit', 'scan_syllabify', 'scan_weights', 'scan_morae_gana'))
		cat = _meter_label_to_category(V.meter_label)
		return V, verse_times, cat
	return V
