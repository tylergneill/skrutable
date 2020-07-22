from skrutable import scheme_vectors_mbh
from numpy import dot
from numpy.linalg import norm
import operator

def fingerprint(file_data):
    """Returns a 10,000-dimensional vector (list) with Unicode frequency counts."""
    code_point_frequency_vector = [0] * 10000
    for char in file_data:
        code_point_frequency_vector[ord(char)] += 1
    return code_point_frequency_vector # Unicode code-point "fingerprint"

def cosine_similarity(a, b):
    return dot(a, b) / (norm(a) * norm(b))

def detect_scheme(file_data=""):

    if file_data == "": return None

    # min_len = 10
    # if len(file_data) < min_len:
    #     print("input might be too short to accurately detect scheme...")

    file_vector = fingerprint(file_data)

    scheme_scores = {}
    for scheme, mbh_vector in scheme_vectors_mbh.all.items():
        scheme_scores[scheme] = cosine_similarity(file_vector, mbh_vector)
        # print("similarity with mbh %s: %1.3f" % (scheme, cosine_similarity(file_vector, mbh_vector) ) )

    scheme_with_max_score = max(scheme_scores.items(), key=operator.itemgetter(1))[0]
    return scheme_with_max_score
