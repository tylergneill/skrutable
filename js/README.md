# Skrutable JavaScript Library

A JavaScript port of the [Skrutable](https://github.com/tylergneill/skrutable) Python library, so that it can run in the browser. It is downstream of the Python: the Python library is the reference, and this port replicates its functionality (transliteration, scansion, meter identification and splitting). It may lag behind the latest Python release.

## Quick Start

### Simple HTML Setup

Save this as `index.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Sanskrit Analysis</title>
</head>
<body>
    <textarea id="input" placeholder="Enter Sanskrit text">वागर्थाविव संपृक्तौ वागर्थप्रतिपत्तये । जगतः पितरौ वन्दे पार्वतीपरमेश्वरौ ॥
</textarea>
    <button onclick="analyze()">Analyze</button>
    <pre id="output"></pre>

    <script src="dist/skrutable.bundle.js"></script>
    <script>
        const skrutable = new Skrutable.Skrutable();

        window.analyze = function() {
            const text = document.getElementById('input').value;
            const result = skrutable.analyze(text);
            document.getElementById('output').textContent = result;
        };
    </script>
</body>
</html>
```

## API Usage

### Basic Usage

```html
<script src="dist/skrutable.bundle.js"></script>
<script>
const skrutable = new Skrutable.Skrutable();

// Transliteration
const devanagari = skrutable.transliterate('rāma', 'IAST', 'DEV');
console.log(devanagari); // राम

// Scansion
const verse = skrutable.scan('रामो राजमणिः सदा विजयते');
console.log(verse.syllableWeights); // lgl lglgl ll lglgl

// Meter identification
const analysis = skrutable.identifyMeter('गुरुर्ब्रह्मा गुरुर्विष्णुः गुरुर्देवो महेश्वरः गुरुः साक्षात्परब्रह्म तस्मै श्रीगुरवे नमः');
console.log(analysis.meterLabel);

// Word splitting (async, requires network)
const split = await skrutable.split('vāgarthāviva saṃpṛktau', 'IAST', 'IAST');
console.log(split);
</script>
```

## API Reference

### Skrutable Class

#### `transliterate(text, fromScheme, toScheme)`
- **text**: Input text string
- **fromScheme**: Source scheme (null for auto-detection)
- **toScheme**: Target scheme
- **Returns**: Transliterated string

#### `scan(text, fromScheme)`
- **text**: Sanskrit text to analyze
- **fromScheme**: Input scheme (null for auto-detection)
- **Returns**: Verse object with scansion data

#### `identifyMeter(text, fromScheme, resplitOption, resplit_keep_midpoint)`
- **text**: Sanskrit verse text
- **fromScheme**: Input scheme (null for auto-detection)
- **resplitOption**: `'none'`, `'resplit_max'`, `'resplit_lite'`, `'single_pAda'`
- **resplit_keep_midpoint**: If true, lock the half-verse break and only wiggle the quarter-verse breaks (default: false)
- **Returns**: Verse object with meter identification

#### `split(text, fromScheme, toScheme, splitterModel, preserveCompoundHyphens, preservePunctuation)`
- **text**: Sanskrit text to split
- **fromScheme**: Input scheme (null for auto-detection)
- **toScheme**: Output scheme (null defaults to IAST)
- **splitterModel**: `'dharmamitra_2024_sept'` (default) or `'splitter_2018'`
- **preserveCompoundHyphens**: Mark compound boundaries with hyphens (default: true)
- **preservePunctuation**: Preserve original punctuation (default: true)
- **Returns**: Promise resolving to split text string

#### `analyze(text, fromScheme, options)`
- **text**: Sanskrit verse text
- **fromScheme**: Input scheme (null for auto-detection)
- **options**: Display options object (`showWeights`, `showMorae`, `showGaRas`, `showAlignment`, `showLabel`)
- **Returns**: Formatted analysis string

### Verse Object

Properties:
- `textRaw`: Original input text
- `textCleaned`: Cleaned text
- `textSLP`: Text in SLP scheme
- `textSyllabified`: Syllabified text
- `syllableWeights`: Light/heavy pattern (l/g)
- `moraePerLine`: Mora counts per line
- `gaRaAbbreviations`: Gaṇa abbreviations
- `meterLabel`: Identified meter name
- `identificationScore`: Confidence score (0-9)

Methods:
- `summarize(showWeights, showMorae, showGaRas, showAlignment, showLabel)`: Format results

### Supported Schemes

| Scheme | Description |
|--------|-------------|
| `IAST` | International Alphabet of Sanskrit Transliteration |
| `HK` | Harvard-Kyoto |
| `SLP` | SLP1 |
| `ITRANS` | ITRANS |
| `VH` | Velthuis |
| `WX` | WX notation |
| `DEV` | Devanagari |
| `BENGALI` | Bengali script |
| `GUJARATI` | Gujarati script |

Pass `null` as `fromScheme` to trigger auto-detection.

## Development

### Library

```bash
npm install          # install dependencies
npm run build        # build dist/skrutable.bundle.js via Rollup
npm run dev          # build in watch mode
npm test             # run all tests (Jest + Babel)
```

### Publishing the npm package

The package is published to npm as `skrutable-js` under the `tylergneill` account. The package logic and version number are kept in sync with the Python skrutable library in this same repository.

The `files` field in `package.json` controls what's included in the npm package: `src/`, `dist/skrutable.bundle.js`, `README.md`, and `LICENSE.md`.

```bash
npm whoami                # confirm you're logged in as tylergneill
npm publish --dry-run     # preview what will be packed
npm publish               # publish to registry
```

## File Structure

```
js/
├── src/
│   ├── index.js              # Main entry point (Skrutable facade + re-exports)
│   ├── transliteration.js    # Transliterator class
│   ├── scansion.js           # Scanner and Verse classes
│   ├── meter_identification.js # MeterIdentifier class
│   ├── splitting.js          # Splitter class (sandhi/compound splitting)
│   ├── scheme_detection.js   # Automatic scheme detection
│   ├── meter_patterns.js     # Sanskrit meter definitions
│   ├── phonemes.js           # Character mappings
│   ├── scheme_maps.js        # Transliteration tables
│   ├── virAma_avoidance.js   # Indic script rules
│   └── config.js             # Configuration
├── dist/
│   └── skrutable.bundle.js   # Pre-built bundle (use this in your HTML)
├── tests/
│   └── unit_tests/
│       └── meter_identification.test.js
└── README.md
```

## Browser Extension

A browser extension built on this library lives in the [skrutable_front_end](https://github.com/tylergneill/skrutable_front_end) repository, alongside the Skrutable web app. Install it from the [Chrome Web Store](https://chromewebstore.google.com/detail/skrutable-sanskrit-tools/mgkkdjpbbpalpombplgeecggakdglfnp).

## License

Licensed under [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/), the same license as the original Python skrutable library.

## Credits

This JavaScript library is maintained by [Tyler Neill](https://github.com/tylergneill) in the [skrutable](https://github.com/tylergneill/skrutable) repository, alongside the Python library it ports. Please report issues there.

The original Python skrutable library, including all core logic, meter patterns, and transliteration tables, was created by Tyler Neill.

The JavaScript port was first created by [Antariksh Bothale](https://github.com/linguistrix) using [Claude Code](https://claude.ai/code), with later fixes and refinements by Antariksh Bothale and Tyler Neill.
