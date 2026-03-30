import json
import os
from collections import Counter
from numpy import dot
from numpy.linalg import norm

auto_detect_synonyms = ( ['AUTO', 'DETECT', 'AUTO DETECT',
						'AUTO-DETECT', 'AUTO_DETECT', 'AUTODETECT'] )

# Load reference vectors (generated from MBH corpus)
_vectors_path = os.path.join(os.path.dirname(__file__), 'scheme_vectors.json')
with open(_vectors_path, 'r', encoding='utf-8') as _f:
	_data = json.load(_f)
_feature_index = _data['feature_index']
_reference_vectors = {scheme: vec for scheme, vec in _data['vectors'].items()}

# Load impossible-bigram lookup (generated from MBH corpus).
# Maps bigram -> list of Roman schemes where it never appears.
_impossible_path = os.path.join(os.path.dirname(__file__), 'impossible_bigrams.json')
with open(_impossible_path, 'r', encoding='utf-8') as _f:
	_impossible_bigrams = json.load(_f)

_SCHEME_PRIORITY = [
	'DEV', 'BENGALI', 'GUJARATI',
	'IAST', 'HK', 'ITRANS', 'WX', 'SLP', 'VH',
]

_ROMAN_SCHEMES = ['IAST', 'HK', 'ITRANS', 'WX', 'SLP', 'VH']

# Unicode ranges for quick Indic script detection
_INDIC_RANGES = {
	'DEV':      (0x0900, 0x097F),
	'BENGALI':  (0x0980, 0x09FF),
	'GUJARATI': (0x0A80, 0x0AFF),
}

# Per impossible-bigram-instance penalty subtracted from cosine scores.
# Tuned so several impossible bigrams outweigh a small cosine advantage,
# but a single stray bigram doesn't override a strong cosine signal.
_BIGRAM_PENALTY = 0.01


class SchemeDetector(object):

	def __init__(self): pass

	# Beyond this length, extra text adds noise without improving accuracy.
	_MAX_SAMPLE_CHARS = 1000

	# Dandas and similar punctuation fall in the DEV Unicode range but are used
	# across all Sanskrit text regardless of transliteration scheme, so they
	# must not count as evidence of an Indic script.
	_INDIC_PUNCTUATION = frozenset([
		'\u0964',  # । danda
		'\u0965',  # ॥ double danda
	])

	# Fraction of sample characters that must be non-punctuation Indic letters
	# to trigger the Indic fast-path before cosine.  A ratio is more robust than
	# a fixed count: it handles both very short purely-Indic inputs (e.g. "आस")
	# and long Roman texts with a handful of stray Indic characters correctly.
	_MIN_INDIC_RATIO = 0.4

	def _count_indic(self, text):
		"""
		Count non-punctuation Indic characters per script.
		Returns (dominant_script, count), or (None, 0) if none found.
		"""
		counts = {}
		for ch in text:
			if ch in self._INDIC_PUNCTUATION:
				continue
			cp = ord(ch)
			for script, (lo, hi) in _INDIC_RANGES.items():
				if lo <= cp <= hi:
					counts[script] = counts.get(script, 0) + 1
					break
		if not counts:
			return None, 0
		dominant = max(counts, key=counts.get)
		return dominant, counts[dominant]

	def _bigram_penalties(self, text):
		"""
		Count impossible-bigram instances in text for each scheme.
		Returns dict of scheme -> penalty (count * _BIGRAM_PENALTY).

		Each instance of a bigram absent from a scheme's full MBH corpus
		adds a small penalty to that scheme's adjusted score. One stray
		bigram is a mild nudge; several are a strong signal.
		"""
		counts = Counter()
		for i in range(len(text) - 1):
			bg = text[i] + text[i+1]
			excluded = _impossible_bigrams.get(bg)
			if excluded:
				for s in excluded:
					counts[s] += 1
		return {s: counts.get(s, 0) * _BIGRAM_PENALTY for s in _ROMAN_SCHEMES}

	def fingerprint(self, text):
		"""
		Returns a feature vector with frequency counts for curated
		characters and bigrams that discriminate between schemes.
		"""
		char_counts = Counter(text)
		bigram_counts = Counter()
		for i in range(len(text) - 1):
			bigram_counts[text[i] + text[i+1]] += 1
		vec = []
		for feat in _feature_index:
			if len(feat) == 1:
				vec.append(char_counts.get(feat, 0))
			else:
				vec.append(bigram_counts.get(feat, 0))
		return vec

	def cosine_similarity(self, a, b):
		denom = norm(a) * norm(b)
		if denom == 0:
			return 0.0
		return dot(a, b) / denom

	def detect_scheme(self, file_data=""):
		"""
		Detect the transliteration scheme of the input text.

		1. Indic ratio check (fast-path): if ≥40% of sample characters are
		   non-punctuation Indic letters, return the dominant script immediately.
		   Dandas (।॥) are excluded — they appear in all Sanskrit texts regardless
		   of scheme.  For mixed-script input the script with the most characters
		   wins.

		2a. Cosine similarity: build a character/bigram fingerprint of the input
		    and compute cosine similarity against reference vectors for each Roman
		    scheme, derived from the MBH corpus.

		2b. Impossible-bigram penalty: subtract a small penalty for each bigram
		    that never occurs in a given scheme's MBH corpus.  This is applied
		    directly to the cosine scores (not a separate elimination pass), so
		    2a and 2b together produce a single set of adjusted scores.

		3.  Priority tiebreaker: among schemes whose adjusted score falls within
		    tolerance of the top, prefer the more common one
		    (IAST > HK > ITRANS > WX > SLP > VH).

		Confidence ('high'/'low') is stored in self.confidence.
		"""

		if file_data == "":
			self.confidence = None
			return None

		sample = file_data[:self._MAX_SAMPLE_CHARS]

		# --- Indic script check ---
		# Use a ratio rather than a fixed count: robust for both very short
		# purely-Indic inputs and long Roman texts with stray Indic characters.
		indic_script, indic_count = self._count_indic(sample)
		if indic_count / len(sample) >= self._MIN_INDIC_RATIO:
			self.confidence = 'high'
			return indic_script

		# --- Cosine + bigram penalty for Roman schemes ---
		file_vector = self.fingerprint(sample)
		penalties = self._bigram_penalties(sample)

		adjusted_scores = {}
		for scheme in _ROMAN_SCHEMES:
			raw = self.cosine_similarity(file_vector, _reference_vectors[scheme])
			adjusted_scores[scheme] = raw - penalties.get(scheme, 0)

		top_score = max(adjusted_scores.values())

		# Priority tiebreaker: among schemes within tolerance of the top,
		# pick the highest-priority one.
		tolerance = 0.03
		# Confidence threshold scales with input length: short inputs
		# have few distinctive features, so even a large cosine gap
		# can be unreliable. Require a proportionally larger gap for
		# short text. At 80+ chars the base tolerance applies; at
		# 10 chars the threshold is 8× higher.
		_CONFIDENCE_REF_LEN = 80
		confidence_threshold = tolerance * max(1, _CONFIDENCE_REF_LEN / len(sample))
		for scheme in _SCHEME_PRIORITY:
			score = adjusted_scores.get(scheme, -1)
			if score > 0 and top_score - score < tolerance:
				remaining = [s for s in _ROMAN_SCHEMES if s != scheme]
				second = max(adjusted_scores[s] for s in remaining)
				gap = adjusted_scores[scheme] - second
				self.confidence = 'high' if gap >= confidence_threshold else 'low'
				return scheme

		# Fallback: cosine winner
		best = max(adjusted_scores, key=adjusted_scores.get)
		self.confidence = 'low'
		return best
