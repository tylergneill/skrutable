# Skrutable JavaScript Library

A comprehensive JavaScript library for Sanskrit text processing, including transliteration, scansion, meter identification, and word splitting.

## Features

- **Transliteration**: Convert between multiple Sanskrit schemes (Devanagari, IAST, Harvard-Kyoto, SLP1, ITRANS, Velthuis, Bengali, Gujarati)
- **Scansion**: Syllabification and weight analysis of Sanskrit verses
- **Meter Identification**: Automatic identification of 20+ Sanskrit meters including anuṣṭubh, indravajrā, vasantatilakā, śārdūlavikrīḍita, āryā, and more
- **Word Splitting**: Sandhi and compound splitting via external API (Dharmamitra 2024 ByT5 or 2018 model)
- **Client-side**: Runs entirely in the browser with no server dependencies (except word splitting)

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

After making changes to files in `src/`, rebuild the bundle:

```bash
npm install
npm run build   # outputs dist/skrutable.bundle.js
```

To run tests:

```bash
npm test
```

## File Structure

```
skrutable-js/
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
├── extension/                # Browser extension source
│   ├── build.cjs             # Extension build script
│   ├── manifest.common.json  # Shared manifest fields
│   ├── manifest.chrome.json  # Chrome-specific manifest
│   ├── manifest.firefox.json # Firefox-specific manifest
│   ├── js/                   # Extension background and sidepanel scripts
│   ├── ui/                   # Extension HTML and CSS
│   └── assets/               # Extension icons
├── tests/
│   └── unit_tests/
│       └── meter_identification.test.js
└── README.md
```

## Browser Extension

A browser extension built on this library is available for Chrome and Firefox. It provides a side panel with transliteration, scansion, meter identification, and word splitting — accessible via the toolbar icon or by right-clicking selected text on any page.

### Installing (load unpacked)

1. Run `make all` to build the library and both extensions
2. **Chrome**: go to `chrome://extensions`, enable Developer Mode, click "Load unpacked", select `dist/extension/chrome/`
3. **Firefox**: go to `about:debugging` → This Firefox → "Load Temporary Add-on", select any file in `dist/extension/firefox/`

### Building

```bash
make build-extension-chrome    # dev build for Chrome (uses local bundle)
make build-extension-firefox   # dev build for Firefox (uses local bundle)
make release-extension-chrome  # release build for Chrome (uses CDN bundle)
make release-extension-firefox # release build for Firefox (uses CDN bundle)
```

Release builds replace the local bundle reference with the jsDelivr CDN URL for the current package version, so the extension can be submitted to browser stores without bundling the library.

## License

Licensed under [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/), the same license as the original Python skrutable library.

## Credits

The original Python [skrutable](https://github.com/tylergneill/skrutable) library — including all core logic, meter patterns, and transliteration tables — was created by [Tyler Neill](https://github.com/tylergneill).

This JavaScript port was created by [Antariksh Bothale](https://github.com/linguistrix) using [Claude Code](https://claude.ai/code), with subsequent fixes and refinements by [Antariksh Bothale](https://github.com/linguistrix) and [Tyler Neill](https://github.com/tylergneill).
