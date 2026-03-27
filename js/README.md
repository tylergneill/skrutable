# Skrutable JavaScript Library

A comprehensive JavaScript library for Sanskrit text processing, including transliteration, scansion, and meter identification.

## Features

- **Transliteration**: Convert between multiple Sanskrit schemes (Devanagari, IAST, Harvard-Kyoto, SLP1, ITRANS, Velthuis)
- **Scansion**: Syllabification and weight analysis of Sanskrit verses
- **Meter Identification**: Automatic identification of 20+ Sanskrit meters including anuṣṭubh, indravajrā, vasantatilakā, śārdūlavikrīḍita, āryā, and more
- **Client-side**: Runs entirely in the browser with no server dependencies

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

#### `identifyMeter(text, fromScheme, resplitOption)`
- **text**: Sanskrit verse text
- **fromScheme**: Input scheme (null for auto-detection)
- **resplitOption**: 'none', 'resplit_max', 'resplit_lite', 'single_pAda'
- **Returns**: Verse object with meter identification

#### `analyze(text, fromScheme, options)`
- **text**: Sanskrit verse text
- **fromScheme**: Input scheme (null for auto-detection)
- **options**: Display options object
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
│   ├── index.js              # Main entry point
│   ├── transliteration.js    # Transliterator class
│   ├── scansion.js           # Scanner and Verse classes
│   ├── meter_identification.js # MeterIdentifier class
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

## License

This JavaScript port maintains the same license as the original Python skrutable library.

## Contributing

To add new meters or fix issues:
1. Edit the appropriate files in `src/`
2. Run `npm run build` to regenerate `dist/skrutable.bundle.js`
3. Test with `npm test`

## Credits

This is a JavaScript port of the [skrutable](https://github.com/tylergneill/skrutable) Python library by [Tyler Neill](https://github.com/tylergneill). All core logic, meter patterns, and transliteration tables originate from that work.

The JavaScript port was created using [Claude Code](https://claude.ai/code), with subsequent fixes and refinements by [Antariksh Bothale](https://github.com/linguistrix).