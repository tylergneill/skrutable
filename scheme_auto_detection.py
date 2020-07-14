import scheme_vectors_mbh
from numpy import dot
from numpy.linalg import norm
import operator

def unicode_fingerprint_vector(file_data):
    v = [0] * 10000
    for char in file_data:
        v[ord(char)] += 1
    return v

def cosine_similarity(a,b):
    return dot(a, b)/(norm(a)*norm(b))

def auto_detect_scheme(file_data):
    file_vector = unicode_fingerprint_vector(file_data)

    scheme_scores = {}
    for scheme, mbh_vector in scheme_vectors_mbh.all.items():
        scheme_scores[scheme] = cosine_similarity(file_vector, mbh_vector)
        # print("similarity with mbh %s: %1.3f" % (scheme, cosine_similarity(file_vector, mbh_vector) ) )

    scheme_with_max_score = max(scheme_scores.items(), key=operator.itemgetter(1))[0]
    return scheme_with_max_score
