"""
Test scheme detection using random samples from the MBH corpus,
transliterated into all supported schemes at various lengths.

Samples are drawn deterministically (fixed seed) for reproducibility.

How to run:
    # Small ~100 cases (fast, runs with full test suite)
    pytest src/skrutable/tests/unit_tests/test_scheme_detection.py

    # Medium ~1000 cases (skipped by default)
    pytest src/skrutable/tests/unit_tests/test_scheme_detection.py -k medium

    # Large ~10000 cases (skipped by default)
    pytest src/skrutable/tests/unit_tests/test_scheme_detection.py -k large

    # Regenerate with a new seed (any tier):
    DETECTION_SEED=123 pytest src/skrutable/tests/unit_tests/test_scheme_detection.py -k medium

    # Verbose mode (show every case, not just failures):
    DETECTION_VERBOSE=1 pytest src/skrutable/tests/unit_tests/test_scheme_detection.py -k medium -s
"""

import os
import random
import urllib.request
from collections import defaultdict

import pytest

from skrutable.transliteration import Transliterator
from skrutable.scheme_detection import SchemeDetector

CORPUS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'scheme_detection_mbh_corpus.txt')
CORPUS_URL = "https://github.com/tylergneill/skrutable/releases/download/corpus/scheme_detection_mbh_corpus.txt"


def _ensure_corpus():
    """Download the MBH corpus file if it's not present locally."""
    if os.path.exists(CORPUS_PATH):
        return
    print(f"\nCorpus file not found at:\n  {CORPUS_PATH}")
    print(f"Downloading from:\n  {CORPUS_URL}")
    try:
        os.makedirs(os.path.dirname(CORPUS_PATH), exist_ok=True)
        urllib.request.urlretrieve(CORPUS_URL, CORPUS_PATH)
        print("Download complete.")
    except Exception as e:
        pytest.skip(
            f"Could not download corpus file ({e}). "
            f"Download manually from {CORPUS_URL} and place it at {CORPUS_PATH}."
        )

SCHEMES = ['IAST', 'SLP', 'HK', 'ITRANS', 'VH', 'WX', 'DEV', 'BENGALI', 'GUJARATI']

SAMPLE_CHAR_LENGTHS = [10, 20, 40, 80, 160, 320]

DEFAULT_SEED = 42


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

    Each case is (scheme, char_len, text, iast_source, also) where
    iast_source is the original IAST text, and also is a list of
    other schemes whose transliteration is identical to this one.
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
                also = [s for s in SCHEMES if s != scheme and scheme_texts[s] == text]
                cases.append((scheme, char_len, text, snippet_iast, also))

    return cases


def _highlight_diff(source, target):
    """
    Compare source and target strings, return target with differing
    segments wrapped in [brackets].
    """
    if source == target:
        return target + '  (identical)'
    result = []
    i = 0
    while i < len(target):
        if i < len(source) and source[i] == target[i]:
            result.append(target[i])
            i += 1
        else:
            # Find the extent of the differing region
            j = i
            while j < len(target) and (j >= len(source) or source[j] != target[j]):
                j += 1
            result.append('[')
            result.append(target[i:j])
            result.append(']')
            i = j
    return ''.join(result)


_verbose = bool(os.environ.get('DETECTION_VERBOSE', ''))


def _build_summary(results, failures, high_correct, low_correct, t):
    """Build the summary, distribution table, and failure table as lines."""
    total = len(results)
    passed = total - len(failures)

    # Distribution breakdown
    all_lens = sorted(set(r['size'] for r in results))
    hi_by_len = defaultdict(int)
    lo_by_len = defaultdict(int)
    hi_by_scheme_len = defaultdict(lambda: defaultdict(int))
    lo_by_scheme_len = defaultdict(lambda: defaultdict(int))
    for r in results:
        if r['correct']:
            d = hi_by_scheme_len if r['confidence'] == 'high' else lo_by_scheme_len
            d[r['scheme']][r['size']] += 1
            if r['confidence'] == 'high':
                hi_by_len[r['size']] += 1
            else:
                lo_by_len[r['size']] += 1

    col_w = 5
    len_header = "  ".join(f"{l:>{col_w}}" for l in all_lens)
    tbl = [f"    {'scheme':<10s} {'total':>8s}  |  {len_header}"]
    tbl.append("    " + "-" * (10 + 8 + 5 + len(len_header)))
    for s in SCHEMES:
        th = sum(hi_by_scheme_len[s].values())
        tl = sum(lo_by_scheme_len[s].values())
        by_len = "  ".join(
            (f"{lo_by_scheme_len[s][l]:>{col_w}}" if lo_by_scheme_len[s][l] else f"{'':>{col_w}}")
            for l in all_lens
        )
        tbl.append(f"    {s:<10s} {f'{th}h/{tl}l':>8s}  |  {by_len}")
    tbl.append("    " + "-" * (10 + 8 + 5 + len(len_header)))
    totals = "  ".join(
        (f"{lo_by_len[l]:>{col_w}}" if lo_by_len[l] else f"{'':>{col_w}}")
        for l in all_lens
    )
    tbl.append(f"    {'total':<10s} {f'{high_correct}h/{low_correct}l':>8s}  |  {totals}")

    # Failure table
    ftbl = [
        f"  {'class':>5s} {'len':>3s} | {'input':<50s} | {'scheme':<8s} | {'same as':<8s} | {'conf':<4s} | {'detected':<50s}",
        "  " + "-" * 150,
    ]
    for f in failures:
        also_str = ', '.join(f['also']) if f['also'] else ''
        if f['detected'] == 'IAST':
            detected_text = f['iast']
        else:
            detected_text = t.transliterate(
                f['iast'], from_scheme='IAST', to_scheme=f['detected']
            )
        det_col = f"{f['detected']} ({detected_text[:50]})"
        ftbl.append(
            f"  {f['size']:>5d} {f['actual_len']:>3d} | {f['text']:<50s} | {f['scheme']:<8s} | {also_str:<8s} | {f['confidence']:<4s} | {det_col:<50s}"
        )

    lines = [
        f"\n{passed}/{total} ({passed / total:.1%}) passed "
        f"({high_correct} high-conf, {low_correct} low-conf).",
        "",
        "  Low-confidence correct by scheme × length:",
    ] + tbl + [
        "",
        f"  Failures ({len(failures)}):",
    ] + ftbl

    return lines


def _run_detection_test(cases, max_small_failures):
    """Run scheme detection on test cases and assert results."""
    sd = SchemeDetector()
    t = Transliterator()

    results = []
    for scheme, char_len, text, iast_source, also in cases:
        detected = sd.detect_scheme(text)
        conf = getattr(sd, 'confidence', '?')
        correct = (detected == scheme) or (detected in also)
        results.append({
            'size': char_len,
            'actual_len': len(text),
            'scheme': scheme,
            'detected': detected,
            'confidence': conf,
            'text': text[:50],
            'iast': iast_source,
            'also': also,
            'correct': correct,
        })

    total = len(results)
    failures = [r for r in results if not r['correct']]
    passed = total - len(failures)
    high_correct = sum(1 for r in results if r['correct'] and r['confidence'] == 'high')
    low_correct = sum(1 for r in results if r['correct'] and r['confidence'] == 'low')

    if _verbose:
        header = (
            f"  {'':>1s} {'class':>5s} {'len':>3s} | {'input':<50s} "
            f"| {'scheme':<8s} | {'same as':<8s} | {'conf':<4s} | {'detected':<8s}"
        )
        sep = "  " + "-" * 120
        print(f"\n{header}\n{sep}")
        for r in results:
            mark = '.' if r['correct'] else 'X'
            also_str = ', '.join(r['also']) if r['also'] else ''
            print(
                f"  {mark:>1s} {r['size']:>5d} {r['actual_len']:>3d} | {r['text']:<50s} "
                f"| {r['scheme']:<8s} | {also_str:<8s} | {r['confidence']:<4s} | {r['detected']:<8s}"
            )
        print(sep)
        summary = _build_summary(results, failures, high_correct, low_correct, t)
        print('\n'.join(summary))

    small_failures = [f for f in failures if f['size'] <= 20]
    large_failures = [f for f in failures if f['size'] > 20]
    if large_failures or len(small_failures) > max_small_failures:
        lines = _build_summary(results, failures, high_correct, low_correct, t)
        assert False, '\n'.join(lines)


# --- Get seed from environment or use default ---
_seed = int(os.environ.get('DETECTION_SEED', DEFAULT_SEED))

_ensure_corpus()

# --- Small: ~100 cases (2 snippets/size × 6 sizes × 9 schemes) ---

_SMALL_CASES = _generate_test_cases(n_snippets_per_size=2, seed=_seed)

def test_scheme_detection_small():
    """~100 random samples, various sizes. Runs as part of normal test suite."""
    _run_detection_test(_SMALL_CASES, max_small_failures=5)


# --- Medium: ~1000 cases (18 snippets/size × 6 sizes × 9 schemes) ---

@pytest.mark.skipif(
    "not config.getoption('-k') or 'medium' not in config.getoption('-k')",
    reason="stress test; run with pytest -k medium",
)
def test_scheme_detection_medium():
    """~1000 random samples. Run with: pytest -k medium"""
    cases = _generate_test_cases(n_snippets_per_size=18, seed=_seed)
    _run_detection_test(cases, max_small_failures=30)


# --- Large: ~10000 cases (185 snippets/size × 6 sizes × 9 schemes) ---

@pytest.mark.skipif(
    "not config.getoption('-k') or 'large' not in config.getoption('-k')",
    reason="stress test; run with pytest -k large",
)
def test_scheme_detection_large():
    """~10000 random samples. Run with: pytest -k large"""
    cases = _generate_test_cases(n_snippets_per_size=185, seed=_seed)
    _run_detection_test(cases, max_small_failures=300)
