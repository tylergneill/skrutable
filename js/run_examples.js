// run_examples.js - JavaScript port of run_examples.py
// Usage: node run_examples.js
// Note: Example 5 (splitting) requires network access to external servers.

import { Transliterator } from './src/transliteration.js';
import { SchemeDetector } from './src/scheme_detection.js';
import { Scanner } from './src/scansion.js';
import { MeterIdentifier } from './src/meter_identification.js';
import { Splitter } from './src/splitting.js';

const inputString = "tava karakamalasthāṃ sphāṭikīmakṣamālāṃ , nakhakiraṇavibhinnāṃ dāḍimībījabuddhyā | pratikalamanukarṣanyena kīro niṣiddhaḥ , sa bhavatu mama bhūtyai vāṇi te mandahāsaḥ ||";

console.log("=".repeat(60));
console.log("Example 1: Transliterator.transliterate()");
console.log("=".repeat(60));

console.log("\n-- Pattern A: both schemes as constructor defaults --");
let T = new Transliterator('IAST', 'DEV');
let result = T.transliterate(inputString);
console.log(result);

console.log("\n-- Pattern B: to_scheme only at constructor; from_scheme auto-detected --");
T = new Transliterator(null, 'DEV');
result = T.transliterate(inputString);
console.log("auto-detected -> DEV:", result);
result = T.transliterate(inputString, null, 'BENGALI');
console.log("override to BENGALI:", result);
result = T.transliterate(inputString, null, null, false);
console.log("avoidViramaIndicScripts=false:", result);

console.log("\n-- Pattern C: fixed from_scheme at constructor, override to auto for one call --");
T = new Transliterator('DEV', 'IAST');
result = T.transliterate(inputString, 'auto');
console.log("from_scheme='auto':", result);

console.log();
console.log("=".repeat(60));
console.log("Example 2: SchemeDetector.detectScheme()");
console.log("=".repeat(60));

const SD = new SchemeDetector();
const detectedScheme = SD.detectScheme(inputString);
console.log(`detectedScheme: ${detectedScheme}`);
console.log(`confidence: ${SD.confidence}`);

console.log();
console.log("=".repeat(60));
console.log("Example 3: Scanner.scan()");
console.log("=".repeat(60));

const S = new Scanner();
let verse = S.scan(inputString);
console.log("summarize(showLabel=false):");
console.log(verse.summarize(true, true, true, true, false));
console.log("summarize(showAlignment=false, showLabel=false):");
console.log(verse.summarize(true, true, true, false, false));

const T_dev = new Transliterator('IAST', 'DEV');
const devInput = T_dev.transliterate(inputString);
console.log(`\nDEV input: ${devInput}`);
verse = S.scan(devInput, 'DEV');
console.log("scan with fromScheme='DEV':");
console.log(verse.summarize(true, true, true, true, false));

console.log();
console.log("=".repeat(60));
console.log("Example 4: MeterIdentifier.identify_meter()");
console.log("=".repeat(60));

const MI = new MeterIdentifier();
verse = MI.identify_meter(inputString);
console.log(`meterLabel: ${verse.meterLabel}`);
console.log("summarize():");
console.log(verse.summarize());

verse = MI.identify_meter(inputString, 'none');
console.log(`resplit_option='none' -> meterLabel: ${verse.meterLabel}`);

verse = MI.identify_meter(devInput, 'resplit_lite', false, 'DEV');
console.log(`fromScheme='DEV', resplit_lite -> meterLabel: ${verse.meterLabel}`);

console.log();
console.log("=".repeat(60));
console.log("Example 5: Splitter.split()");
console.log("=".repeat(60));
console.log("(requires network access to splitting servers)");

const Spl = new Splitter();

async function runSplitterExamples() {
    try {
        result = await Spl.split(inputString);
        console.log("auto-detected -> IAST:", result);

        result = await Spl.split(inputString, null, 'DEV');
        console.log("toScheme='DEV':", result);

        result = await Spl.split(inputString, 'IAST', 'HK');
        console.log("fromScheme='IAST', toScheme='HK':", result);

        result = await Spl.split(inputString, null, null, 'dharmamitra_2024_sept', true, false);
        console.log("preservePunctuation=false:", result);

        result = await Spl.split(inputString, null, null, 'dharmamitra_2024_sept', false, true);
        console.log("preserveCompoundHyphens=false:", result);

        result = await Spl.split(inputString, null, null, 'splitter_2018');
        console.log("splitterModel='splitter_2018':", result);
    } catch (e) {
        console.log("Splitting failed (server may be unavailable):", e.message);
    }
}

runSplitterExamples();
