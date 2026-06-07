"""
Profiling runner: runs identify_meter_batch on a corpus N times and reports
mean ± range for key metrics. Use this to compare branches — differences
smaller than the observed run-to-run range are noise.

Usage:
    cd src
    python skrutable/profiling_runner.py /path/to/corpus.txt [--runs N] [--no-parallel]

--runs defaults to 5. --no-parallel uses identify_meter in a loop instead of
identify_meter_batch (no multiprocessing); wall-clock equals CPU time.
Results print to stderr (same as flush_profiling_report).
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import time
import skrutable.utils as _utils
_utils._DEBUG_TIMING = True

import skrutable.meter_identification as _mi
from skrutable.meter_identification import MeterIdentifier, flush_profiling_report

_SCAN_KEYS = ('scan_clean', 'scan_translit', 'scan_syllabify', 'scan_weights', 'scan_morae_gana')
_ID_CASCADE_KEYS = ('anuzwuB', 'ardhatraya', 'samavftta_etc', 'samavftta', 'upajAti',
                    'ardhasamavftta_perfect', 'vizamavftta', 'jAti',
                    'lev_samavftta', 'lev_upajAti', 'lev_ardha', 'lev_vizama')
_SCAN_LABELS = ('clean', 'transl', 'syl', 'wts', 'mor+g')
_ID_CASCADE_LABELS = ('anuṣṭ', 'anuṣṭ3', 'vftta↑', 'samav', 'upajāti',
                      'ardha✓', 'vizama', 'jāti',
                      'lev✗sama', 'lev✗upaj', 'lev✗ardh', 'lev✗visa')


def run_once(verses, no_parallel=False):
    _mi._category_totals.clear()
    _utils._section_totals.clear()

    MI = MeterIdentifier()
    t0 = time.perf_counter()
    if no_parallel:
        for v in verses:
            MI.identify_meter(v, resplit_option='resplit_max', resplit_keep_midpoint=True)
    else:
        MI.identify_meter_batch(verses, resplit_option='resplit_max', resplit_keep_midpoint=True)
    wall = time.perf_counter() - t0

    scan_total = sum(
        sum(_mi._category_totals.get(cat, {}).get(k, 0.0) for cat in _mi._category_totals)
        for k in _SCAN_KEYS
    )
    types_total = sum(
        sum(_mi._category_totals.get(cat, {}).get(k, 0.0) for cat in _mi._category_totals)
        for k in _ID_CASCADE_KEYS
    )
    candidates = _utils._section_totals.get('wiggle_count', 0)
    buckets = {}
    for key in _SCAN_KEYS + _ID_CASCADE_KEYS:
        buckets[key] = sum(_mi._category_totals.get(cat, {}).get(key, 0.0) for cat in _mi._category_totals)
    return {'scan': scan_total, 'types': types_total, 'wall': wall, 'candidates': candidates,
            **buckets}


def main():
    args = sys.argv[1:]
    no_parallel = '--no-parallel' in args
    args = [a for a in args if a != '--no-parallel']

    n_runs = 5
    if '--runs' in args:
        idx = args.index('--runs')
        n_runs = int(args[idx + 1])
        args = args[:idx] + args[idx + 2:]

    if not args:
        print(f"Usage: python {sys.argv[0]} /path/to/corpus.txt [--runs N] [--no-parallel]", file=sys.stderr)
        sys.exit(1)

    corpus_path = args[0]

    with open(corpus_path, encoding='utf-8') as f:
        verses = f.read().splitlines()

    mode = 'no-parallel' if no_parallel else 'multiprocess'
    print(f"\nRunning {n_runs} passes over {len(verses)} verses ({mode})...", file=sys.stderr)

    results = []
    for i in range(n_runs):
        r = run_once(verses, no_parallel=no_parallel)
        print(f"  run {i+1}: scan∑ {r['scan']:.2f}s  types∑ {r['types']:.2f}s  wall {r['wall']:.2f}s  candidates {r['candidates']}", file=sys.stderr)
        results.append(r)

    print(file=sys.stderr)
    col = 14
    print(f"  {'metric':{col}}  {'mean':>8}  {'min':>8}  {'max':>8}  {'range':>8}", file=sys.stderr)
    print(f"  {'-'*56}", file=sys.stderr)

    summary_metrics = [
        ('scan',  'scan∑'),
        ('types', 'types∑'),
        ('wall',  'wall-clock'),
    ] + list(zip(_SCAN_KEYS, _SCAN_LABELS)) + list(zip(_ID_CASCADE_KEYS, _ID_CASCADE_LABELS))

    for key, label in summary_metrics:
        vals = [r[key] for r in results]
        mean = sum(vals) / len(vals)
        print(f"  {label:{col}}  {mean:>7.2f}s  {min(vals):>7.2f}s  {max(vals):>7.2f}s  {max(vals)-min(vals):>7.2f}s", file=sys.stderr)


if __name__ == '__main__':
    main()
