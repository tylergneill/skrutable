"""
Test scheme detection using random samples from the MBH corpus,
transliterated into all supported schemes at various lengths.

Samples are drawn deterministically (fixed seed) for reproducibility.

How to run:
    # Default ~108 cases (fast, runs with full test suite)
    pytest src/skrutable/tests/unit_tests/test_scheme_detection.py

    # 1000-case stress test (slower, use -k flag)
    pytest src/skrutable/tests/unit_tests/test_scheme_detection.py -k large

    # Both together
    pytest src/skrutable/tests/unit_tests/test_scheme_detection.py -v
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


def _generate_test_cases(n_snippets_per_size, seed):
    """
    Generate test cases: random MBH excerpts at various sizes,
    each transliterated into every scheme.

    When multiple schemes produce identical text, the expected result
    is the highest-priority scheme (since they're indistinguishable).
    """
    lines = _load_corpus_lines()
    full_text = ' '.join(lines)

    rng = random.Random(seed)
    t = Transliterator()

    cases = []
    for char_len in SAMPLE_CHAR_LENGTHS:
        for _ in range(n_snippets_per_size):
            max_start = len(full_text) - char_len - 1
            start = rng.randint(0, max_start)
            while start > 0 and full_text[start - 1] != ' ':
                start += 1
            snippet_iast = full_text[start:start + char_len].strip()
            if len(snippet_iast) >= char_len:
                last_space = snippet_iast.rfind(' ')
                if last_space > 0:
                    snippet_iast = snippet_iast[:last_space]

            scheme_texts = {}
            for scheme in SCHEMES:
                if scheme == 'IAST':
                    scheme_texts[scheme] = snippet_iast
                else:
                    scheme_texts[scheme] = t.transliterate(
                        snippet_iast, from_scheme='IAST', to_scheme=scheme
                    )

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


def _run_detection_test(cases, max_small_failures):
    """Run scheme detection on test cases and assert results."""
    sd = SchemeDetector()

    failures = []
    for expected, char_len, text, original_scheme in cases:
        result = sd.detect_scheme(text)
        if result != expected:
            failures.append(
                f"  size~{char_len:3d}: expected {expected:10s} got {result:10s} "
                f"(from {original_scheme:8s}) | {text[:50]}"
            )

    total = len(cases)
    passed = total - len(failures)
    # Short inputs (<=20 chars) often lack distinctive features,
    # so some misclassification is expected there.
    small_failures = [f for f in failures if 'size~ 10' in f or 'size~ 20' in f]
    large_failures = [f for f in failures if f not in small_failures]
    if large_failures or len(small_failures) > max_small_failures:
        failure_report = '\n'.join(failures)
        assert False, (
            f"\n{passed}/{total} passed. Failures:\n{failure_report}"
        )


# --- Default test: ~108 cases (2 snippets/size × 6 sizes × 9 schemes) ---

_TEST_CASES = _generate_test_cases(n_snippets_per_size=2, seed=42)

def test_scheme_detection_random_samples():
    """~108 random samples, various sizes. Runs as part of normal test suite."""
    _run_detection_test(_TEST_CASES, max_small_failures=5)


# --- Large test: ~999 cases (~18 snippets/size × 6 sizes × 9 schemes) ---

def test_scheme_detection_large():
    """~999 random samples. Run with: pytest -k large"""
    cases = _generate_test_cases(n_snippets_per_size=18, seed=99)
    _run_detection_test(cases, max_small_failures=30)
