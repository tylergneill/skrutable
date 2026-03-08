"""
Generate scheme detection reference vectors from the MBH corpus.

Uses a curated set of ~200 features: scheme-characteristic single characters
and discriminative bigrams. Cosine similarity on these vectors gives robust
scheme detection that handles stray/mixed characters gracefully.

Usage: python -m skrutable.generate_scheme_vectors
"""

import json
import os
from collections import Counter

from skrutable.transliteration import Transliterator

CORPUS_PATH = os.path.join(os.path.dirname(__file__), 'mbh1-18u.txt')

SCHEMES = ['IAST', 'SLP', 'HK', 'ITRANS', 'VH', 'WX', 'DEV', 'BENGALI', 'GUJARATI']

# --- Curated feature set: ONLY scheme-distinctive features ---
# Common chars shared across all Roman schemes (a, i, u, e, o, k, g, etc.)
# are deliberately excluded — they add noise without discriminative value.

# IAST diacritics (unique among Roman schemes)
IAST_CHARS = list('āīūṛṝṭḍṇśṣṃḥñṅḷḹ')

# Distinctive lowercase ASCII — letters used as STANDALONE markers in specific
# schemes. Excludes 'h' since its distinctiveness comes from bigrams (kh, gh,
# th, dh, ph, bh, sh, Sh, Th, Dh, .h) which are already in BIGRAMS.
#   f: SLP=ṛ, WX=ṅ (absent in HK, VH, ITRANS, IAST)
#   q: SLP=ḍ, WX=ṛ (absent in HK, VH, ITRANS, IAST)
#   w: WX=t (super-frequent), SLP=ṭ, ITRANS=v (absent in HK, IAST)
#   x: SLP=ḷ, WX=d (absent in HK, VH, ITRANS, IAST)
#   z: SLP=ṣ, HK=ś (absent in VH, ITRANS, IAST, WX)
ASCII_DISTINCTIVE_LOWER = list('fqwxz')

# ALL uppercase ASCII — frequencies differ dramatically across schemes:
#   A: SLP/HK/WX=ā (frequent), absent in IAST/VH/ITRANS
#   B: SLP=bh (frequent), absent in others
#   M: SLP/HK=ṃ, VH/ITRANS use .m instead
#   etc.
ASCII_UPPER = list('ABCDEFGHIJKLMNOPQRSTUVWXYZ')

# VH/ITRANS modifier punctuation (used as prefixes in digraphs)
MODIFIER_PUNCT = ['.', '"', '~']

# Devanagari — high-frequency consonants and vowel signs
DEV_CHARS = list('अआइईउऊकखगघचछजझटठडढतथदधनपफबभमयरलवशषसहािीुूेैोौंःऽ')

# Bengali — high-frequency consonants and vowel signs
BENGALI_CHARS = list('অআইঈউঊকখগঘচছজঝটঠডঢতথদধনপফবভমযরলশষসহািীুূেৈোৌংঃঽ')

# Gujarati — high-frequency consonants and vowel signs
GUJARATI_CHARS = list('અઆઇઈઉઊકખગઘચછજઝટઠડઢતથદધનપફબભમયરલવશષસહાિીુૂેૈોૌંઃઽ')

# Discriminative bigrams for Roman schemes
BIGRAMS = [
    # VH markers (dot-prefix, double-quote prefix)
    '.t', '.T', '.d', '.D', '.n', '.r', '.R', '.l', '.L',
    '.m', '.h', '.s', '.a', '"s', '"n',
    # VH/ITRANS shared vowel digraphs
    'aa', 'ii', 'uu',
    # ITRANS markers (including ee/oo for e/o, ch for c)
    'Sh', 'sh', 'Ch', 'Ri', 'RI', 'Li', 'LI',
    '~n', '~N', 'ee', 'oo',
    # HK markers (ST=ṣṭ, kS=kṣ are common and impossible in SLP)
    'lR', 'RR', 'ST', 'kS',
    # Aspiration digraphs (present in HK, ITRANS, IAST but NOT in SLP, WX)
    'kh', 'gh', 'ch', 'jh', 'th', 'dh', 'ph', 'bh',
    # HK/ITRANS retroflex digraphs
    'Th', 'Dh',
    # Diphthong digraphs
    'ai', 'au',
    # SLP-only bigrams (impossible in HK/WX)
    'kz', 'ft', 'Ra', 'aR', 'za',
    # WX-only bigrams (WX maps t→w, d→x, so these are super-frequent)
    ' w', ' x', 'ax', 'xA', 'uw', 'nw', 'Xa',
]

# Combine all features into a single ordered list
FEATURES = (
    IAST_CHARS
    + ASCII_DISTINCTIVE_LOWER + ASCII_UPPER
    + MODIFIER_PUNCT
    + DEV_CHARS + BENGALI_CHARS + GUJARATI_CHARS
    + BIGRAMS
)
# Deduplicate while preserving order
seen = set()
FEATURE_INDEX = []
for f in FEATURES:
    if f not in seen:
        seen.add(f)
        FEATURE_INDEX.append(f)


def load_corpus():
    """Load MBH corpus, strip reference markers, return plain text."""
    with open(CORPUS_PATH, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    text_lines = []
    for line in lines:
        line = line.strip()
        if not line or line.startswith('{'):
            continue
        if '\t' in line:
            line = line.split('\t', 1)[1]
        text_lines.append(line)
    return '\n'.join(text_lines)


def extract_features(text, feature_index):
    """Count frequency of each feature (char or bigram) in text."""
    # Count all chars
    char_counts = Counter(text)
    # Count all bigrams
    bigram_counts = Counter()
    for i in range(len(text) - 1):
        bg = text[i] + text[i+1]
        bigram_counts[bg] += 1
    # Build vector
    vec = []
    for feat in feature_index:
        if len(feat) == 1:
            vec.append(char_counts.get(feat, 0))
        else:
            vec.append(bigram_counts.get(feat, 0))
    return vec


def main():
    print("Loading corpus...")
    corpus_text = load_corpus()
    print(f"  {len(corpus_text)} characters of clean text")
    print(f"  {len(FEATURE_INDEX)} features in curated index")

    t = Transliterator()

    vectors = {}
    for scheme in SCHEMES:
        print(f"Transliterating to {scheme}...")
        if scheme == 'IAST':
            converted = corpus_text
        else:
            converted = t.transliterate(corpus_text, from_scheme='IAST', to_scheme=scheme)
        vec = extract_features(converted, FEATURE_INDEX)
        nonzero = sum(1 for v in vec if v > 0)
        vectors[scheme] = vec
        print(f"  {nonzero} non-zero features")

    # Normalize each feature dimension across schemes so that
    # scheme-distinctive features (e.g. IAST diacritics, VH dot-prefixes)
    # aren't drowned out by universally common chars (e.g. 'a', 't').
    # For each feature, divide by max across schemes.
    n_features = len(FEATURE_INDEX)
    for i in range(n_features):
        max_val = max(vectors[s][i] for s in SCHEMES)
        if max_val > 0:
            for s in SCHEMES:
                vectors[s][i] = vectors[s][i] / max_val

    output_path = os.path.join(os.path.dirname(__file__), 'scheme_vectors.json')
    data = {
        'feature_index': FEATURE_INDEX,
        'vectors': vectors,
    }
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False)

    print(f"\nSaved to {output_path}")
    print(f"  Feature vector length: {len(FEATURE_INDEX)}")
    for scheme in SCHEMES:
        nonzero = sum(1 for v in vectors[scheme] if v > 0)
        print(f"  {scheme}: {nonzero} non-zero features")


if __name__ == '__main__':
    main()
