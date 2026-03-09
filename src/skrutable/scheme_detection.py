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

	def _detect_indic(self, text):
		"""
		Quick character-range check for Indic scripts.
		Returns the script name if any Indic chars are found, else None.
		"""
		for ch in text:
			cp = ord(ch)
			for script, (lo, hi) in _INDIC_RANGES.items():
				if lo <= cp <= hi:
					return script
		return None

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

		1. Quick Indic check: scan for Devanagari/Bengali/Gujarati chars.
		   If found, return immediately (no cosine needed).

		2. Cosine similarity: score each Roman scheme against reference
		   vectors built from the MBH corpus, adjusted by a bigram
		   penalty for impossible bigrams.

		3. Priority tiebreaker: when adjusted scores are within tolerance,
		   prefer more common schemes (IAST > HK > ITRANS > WX > SLP > VH).

		Confidence ('high'/'low') is stored in self.confidence.
		"""

		if file_data == "":
			self.confidence = None
			return None

		sample = file_data[:self._MAX_SAMPLE_CHARS]

		# --- Indic script check (no cosine needed) ---
		indic = self._detect_indic(sample)
		if indic:
			self.confidence = 'high'
			return indic

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
