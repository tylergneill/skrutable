# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm run build        # Build dist/skrutable.bundle.js via Rollup
npm run dev          # Build in watch mode
npm test             # Run all tests with Jest
npm run test:watch   # Run tests in watch mode
make all             # Build library + both browser extensions
```

For extension build details (dev vs. release, CDN placeholder, browser-specific preprocessor), npm publishing workflow, and store submission, see the Development section in README.md. `dist/extension/` is gitignored — run `make all` to build locally for testing, or `make release-extension-*` before store submission.

To run a single test file:
```bash
npx jest tests/unit_tests/meter_identification.test.js
```

To run a single test by name:
```bash
npx jest -t "test_test_as_anuzwuB"
```

## Architecture

This is a JavaScript port of the Python [skrutable](https://github.com/tylergneill/skrutable) library. The build target is a browser-loadable UMD bundle (`dist/skrutable.bundle.js`) with global name `Skrutable`, generated via Rollup from ES modules in `src/`.

### Module dependency chain

```
src/index.js (Skrutable facade)
  ├── transliteration.js (Transliterator)
  │     ├── phonemes.js          — character sets, SLP vowel/consonant lists
  │     ├── scheme_maps.js       — per-scheme transliteration tables (by_name dict)
  │     ├── scheme_detection.js  — SchemeDetector, auto-detect logic
  │     ├── virAma_avoidance.js  — Indic script virāma (halant) insertion rules
  │     └── config.js
  ├── scansion.js (Scanner + Verse)
  │     ├── transliteration.js
  │     ├── scheme_detection.js
  │     ├── meter_patterns.js    — gaṇa weight table
  │     ├── phonemes.js
  │     └── config.js
  └── meter_identification.js (MeterIdentifier + VerseTester)
        ├── scansion.js
        ├── meter_patterns.js    — all meter definitions
        └── config.js
```

### Key design patterns

- **Agent/patient split**: "agent" classes (Transliterator, Scanner, MeterIdentifier, VerseTester) hold methods; "patient" `Verse` is a plain property bundle populated by those methods and returned to the caller.
- **SLP as internal pivot**: all processing converts input to SLP1 first, then operates in SLP before converting output back to the requested scheme.
- **`config.js`** centralizes tunable constants (default schemes, separator characters, meter scoring weights, resplit behavior). Edit this file to change defaults rather than touching individual modules.
- **`meter_patterns.js`** is the authoritative source of all meter definitions: `anuzwuB_pAda`, `samavfttas_by_family_and_gaRa`, `ardhasamavftta_by_odd_even_regex_tuple`, `vizamavftta_by_4_tuple`, `jAtis_by_morae`, and the `gaRas_by_weights` trisyllable-to-gaṇa map.

### Supported transliteration schemes

IAST, SLP1 (`SLP`), DEV (Devanagari), HK (Harvard-Kyoto), ITRANS, Velthuis, Bengali, Gujarati. Pass scheme names as uppercase strings. `null` triggers auto-detection.

### Resplit options for meter identification

`identify_meter(text, resplitOption, resplit_keep_midpoint, fromScheme)` accepts:
- `'none'` — use the verse as given
- `'resplit_max'` — try all line-boundary splits (default)
- `'resplit_lite'` — try only the midpoint split
- `'single_pAda'` — treat input as a single quarter-verse

### Tests

Tests live in `tests/unit_tests/` and are run with Jest + Babel (configured in `babel.config.json` for ES module interop). Test files import directly from `src/` modules, not from the built bundle.
