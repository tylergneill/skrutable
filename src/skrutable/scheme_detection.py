import json
import os
import operator
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


class SchemeDetector(object):

	def __init__(self): pass

	def fingerprint(self, text):
		"""
		Returns a feature vector with frequency counts for curated
		characters and bigrams that discriminate between schemes.
		"""
		from collections import Counter
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

		Scores each scheme by cosine similarity against reference vectors,
		then picks a winner. When multiple schemes score within a small
		tolerance of each other (i.e. the input doesn't clearly belong to
		one scheme), ties are broken by a priority list reflecting how
		common each scheme is in practice:
		  DEV > BENGALI > GUJARATI > IAST > HK > ITRANS > WX > SLP > VH
		"""

		if file_data == "": return None

		file_vector = self.fingerprint(file_data)

		scheme_scores = {}
		for scheme, ref_vector in _reference_vectors.items():
			scheme_scores[scheme] = self.cosine_similarity(file_vector, ref_vector)

		top_score = max(scheme_scores.values())

		_scheme_priority = [
			'DEV', 'BENGALI', 'GUJARATI',
			'IAST', 'HK', 'ITRANS', 'WX', 'SLP', 'VH',
		]
		tolerance = 0.03

		for scheme in _scheme_priority:
			score = scheme_scores.get(scheme, 0)
			if score > 0 and top_score - score < tolerance:
				return scheme

		return max(scheme_scores, key=scheme_scores.get)
