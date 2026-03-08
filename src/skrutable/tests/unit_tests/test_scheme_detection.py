"""
Test scheme detection using random samples from the MBH corpus,
transliterated into all supported schemes at various lengths.

Samples are drawn deterministically (fixed seed) for reproducibility.
"""

import os
import random

from skrutable.transliteration import Transliterator
from skrutable.scheme_detection import SchemeDetector

CORPUS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'mbh1-18u.txt')

SCHEMES = ['IAST', 'SLP', 'HK', 'ITRANS', 'VH', 'WX', 'DEV', 'BENGALI', 'GUJARATI']

# Priority order: when text is identical across schemes, expect the highest-priority one
SCHEME_PRIORITY = [
    'DEV', 'BENGALI', 'GUJARATI',
    'IAST', 'HK', 'ITRANS', 'WX', 'SLP', 'VH',
]

# Sample sizes: very small (1–2 words), small (phrase), medium (sentence), larger (paragraph)
SAMPLE_CHAR_LENGTHS = [10, 20, 40, 80, 160, 320]


def _load_corpus_lines():
    """Load and clean MBH corpus lines."""
    with open(CORPUS_PATH, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    clean = []
    for line in lines:
        line = line.strip()
        if not line or line.startswith('{'):
            continue
        if '\t' in line:
            line = line.split('\t', 1)[1]
        clean.append(line)
    return clean


def _generate_test_cases():
    """
    Generate ~100 test cases: random MBH excerpts at various sizes,
    each transliterated into every scheme.

    When multiple schemes produce identical text, the expected result
    is the highest-priority scheme (since they're indistinguishable).
    """
    lines = _load_corpus_lines()
    full_text = ' '.join(lines)

    rng = random.Random(42)
    t = Transliterator()

    cases = []
    # 2 random samples per size × 9 schemes = 108 cases
    for char_len in SAMPLE_CHAR_LENGTHS:
        for _ in range(2):
            max_start = len(full_text) - char_len - 1
            start = rng.randint(0, max_start)
            while start > 0 and full_text[start - 1] != ' ':
                start += 1
            snippet_iast = full_text[start:start + char_len].strip()
            if len(snippet_iast) >= char_len:
                last_space = snippet_iast.rfind(' ')
                if last_space > 0:
                    snippet_iast = snippet_iast[:last_space]

            # Transliterate into all schemes
            scheme_texts = {}
            for scheme in SCHEMES:
                if scheme == 'IAST':
                    scheme_texts[scheme] = snippet_iast
                else:
                    scheme_texts[scheme] = t.transliterate(
                        snippet_iast, from_scheme='IAST', to_scheme=scheme
                    )

            # For each scheme, determine expected result:
            # if text is identical to a higher-priority scheme's text,
            # expect the higher-priority one.
            for scheme in SCHEMES:
                text = scheme_texts[scheme]
                expected = scheme
                for higher in SCHEME_PRIORITY:
                    if higher == scheme:
                        break
                    if scheme_texts.get(higher) == text:
                        expected = higher
                        break
                cases.append((expected, char_len, text, scheme))

    return cases


_TEST_CASES = _generate_test_cases()


def test_scheme_detection_random_samples():
    """Test scheme detection across ~100 random MBH samples of varying sizes."""
    sd = SchemeDetector()

    failures = []
    for expected, char_len, text, original_scheme in _TEST_CASES:
        result = sd.detect_scheme(text)
        if result != expected:
            failures.append(
                f"  size~{char_len:3d}: expected {expected:10s} got {result:10s} "
                f"(from {original_scheme:8s}) | {text[:50]}"
            )

    total = len(_TEST_CASES)
    passed = total - len(failures)
    # Allow up to 2 failures at very small sizes (≤20 chars), where
    # spurious bigram matches can mislead detection.
    small_failures = [f for f in failures if 'size~ 10' in f or 'size~ 20' in f]
    large_failures = [f for f in failures if f not in small_failures]
    if large_failures or len(small_failures) > 2:
        failure_report = '\n'.join(failures)
        assert False, (
            f"\n{passed}/{total} passed. Failures:\n{failure_report}"
        )
