# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

`skrutable` is a Sanskrit text processing library. Core modules:
- `scansion.py` — syllabification, syllable weight detection, morae/gaṇa counting
- `meter_identification.py` — meter identification (anuṣṭubh, samavṛtta, jāti, ardhasamavṛtta, viṣamavṛtta)
- `transliteration.py` — scheme conversion (IAST, HK, SLP, Devanāgarī, etc.)
- `meter_patterns.py` — pattern dictionaries for all supported meters

## Running Tests

```bash
cd src
pytest skrutable/tests/
```

## Scan Timing Profiling

The library has a built-in profiling system for measuring meter identification performance across a corpus.

### How it works

- `utils._DEBUG_TIMING` (default `False`) gates all timing instrumentation
- When enabled, `@timed(key)` decorators on `Scanner` methods and `timed()` inline calls in `meter_identification.py` accumulate wall time into `utils._section_totals`
- Each call to `MeterIdentifier.identify_meter()` flushes per-verse timings into `meter_identification._category_totals`, keyed by meter category
- `meter_identification.flush_profiling_report()` prints a formatted breakdown table to stderr and `src/skrutable/profiling_debug.txt`, then clears all accumulators

### Enabling profiling

Set `utils._DEBUG_TIMING = True` before importing `MeterIdentifier`:

```python
import skrutable.utils as _utils
_utils._DEBUG_TIMING = True

from skrutable.meter_identification import MeterIdentifier, flush_profiling_report

MI = MeterIdentifier()
for verse in my_verses:
    MI.identify_meter(verse)

flush_profiling_report()  # prints table, resets counters
```

### Table columns

- `total` — scan + all identification types combined
- `scan∑` — sum of clean/translit/syllabify/weights/mor+g (initial scan + all wiggle rescans)
- `types∑` — sum of all identification-type columns
- `clean / transl / syl / wts / mor+g` — Scanner sub-phase breakdown
- `anuṣṭ / samav / ardha✓ / jāti / lev✗sama / lev✗ardh / lev✗visa` — time per identification type

### Important invariant

`_DEBUG_TIMING` should **never be committed as `True`** in `utils.py`. It must remain `False` by default.

## PR Conventions

Every PR description must include a **Test and deploy plan** section (not just "Test plan"). It must always contain, at minimum:

- [ ] All unit tests pass (`pytest src/skrutable/tests/`)
- [ ] Tag the merge result commit (e.g. `git tag v2.x.y && git push origin v2.x.y`)
- [ ] Publish package to PyPI (`python -m build && twine upload dist/*`)
