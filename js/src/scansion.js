// Scanner class and Verse object for Sanskrit metrical analysis
import { Transliterator } from './transliteration.js';
import { auto_detect_synonyms } from './scheme_detection.js';
import { gaRas_by_weights } from './meter_patterns.js';
import { 
  character_set, 
  SLP_vowels, 
  SLP_long_vowels, 
  SLP_consonants_for_scansion 
} from './phonemes.js';
import { config } from './config.js';

// Load config variables
const scansion_syllable_separator = config.scansion_syllable_separator; // e.g. " "
const additional_pAda_separators = config.additional_pAda_separators; // e.g. ["\t", ";"]

export class Verse {
  /**
   * User-facing patient-style object, basically a bundle of attributes.
   * 
   * Usually constructed only internally.
   * 
   * Returned by scansion.Scanner.scan()
   * as well as by meter_identification.MeterIdentifier.identify_meter().
   * 
   * Single method summarize() formats key attributes for display
   * whether via command line or graphical user interface.
   */
  
  constructor() {
    this.textRaw = null;           // string, may contain newlines
    this.originalScheme = null;    // string
    this.textCleaned = null;       // string, may contain newlines
    this.textSLP = null;           // string, may contain newlines
    this.textSyllabified = null;   // string, may contain newlines
    this.syllableWeights = null;   // string, may contain newlines
    this.moraePerLine = null;      // list of integers
    this.gaRaAbbreviations = null; // string, may contain newlines
    this.meterLabel = null;        // string
    this.identificationScore = 0;  // int
  }

  summarize(
    showWeights = true, 
    showMorae = true, 
    showGaRas = true, // part_A
    showAlignment = true, // part_B
    showLabel = true // part_C
  ) {
    /**
     * Returns display-ready formatted string summarizing scansion
     * and (if applicable) meter identification.
     * 
     * Features on-demand combination of:
     *   syllable weights
     *   morae counts
     *   gaṇa abbreviations
     *   right-justified alignment of vowel-final syllables and their weights
     *   meter label (if available)
     */
    let partA = '', partB = '', partC = '';

    // part_A
    if (showWeights || showMorae || showGaRas) {
      const weightsLines = this.syllableWeights.split('\n');
      const maxWeightsLen = Math.max(...weightsLines.map(line => line.length));

      for (let i = 0; i < weightsLines.length; i++) {
        const weights = weightsLines[i];
        let line = '';
        
        if (showWeights) {
          line += weights.padStart(maxWeightsLen);
        }
        if (showMorae) {
          line += ` ${`{m: ${this.moraePerLine[i]}}`.padStart(10)}`;
        }
        if (showGaRas) {
          const gaRaLine = this.gaRaAbbreviations.split('\n')[i];
          line += ` ${`[${weights.length}: ${gaRaLine}]`.padStart(11)}`;
        }
        if (showWeights || showMorae || showGaRas) {
          line += '\n';
        }
        partA += line;
      }

      if (partA !== '') partA += '\n';
    }

    // part_B
    if (showAlignment) {
      // IAST is standard output for alignment (as well as meter label)
      const T = new Transliterator('SLP', 'IAST');
      const textSyllabifiedIAST = T.transliterate(this.textSyllabified);

      // calculate max syllable length for entire verse
      const lineMax = [];
      for (const line of textSyllabifiedIAST.split('\n')) {
        if (line.trim()) {
          lineMax.push(Math.max(...line.split(' ').map(sw => sw.length)));
        }
      }
      const maxSyllableLen = Math.max(...lineMax);
      const partBCellWidth = maxSyllableLen + 2;

      const syllabifiedLines = textSyllabifiedIAST.split('\n');
      const weightLines = this.syllableWeights.split('\n');

      for (let i = 0; i < syllabifiedLines.length; i++) {
        const line = syllabifiedLines[i];
        if (line === '') continue;

        // display IAST syllables
        for (const syll of line.split(' ')) {
          partB += syll.padStart(partBCellWidth);
        }
        partB += '\n';

        // display corresponding weights aligned underneath each syllable
        for (const sw of weightLines[i]) {
          partB += sw.padStart(partBCellWidth);
        }
        partB += '\n';
      }

      if (partB !== '') partB += '\n';
    }

    // part_C
    if (showLabel) {
      if (this.meterLabel === null) {
        partC += '(vṛttaṃ gaṇyatām...)';
      } else {
        partC += this.meterLabel;
      }

      if (partC !== '') partC += '\n';
    }

    const cumulativeOutput = partA + partB + partC;
    return cumulativeOutput;
  }
}

export class Scanner {
  /**
   * User-facing agent-style object, basically a bundle of methods.
   * 
   * Primary method scan() accepts string.
   * 
   * Returns single Verse object populated with scansion results.
   */
  
  constructor() {
    /**
     * Mostly agent-style object.
     * 
     * These attributes record most recent associated objects.
     */
    this.Verse = null;           // will hold Verse object
    this.Transliterator = null;  // will hold Transliterator object
  }

  cleanInput(cntnts, schemeIn) {
    /**
     * Accepts raw text string,
     * filters out characters not relevant to scansion,
     * with exception of whitespace (space, tab, newline).
     * 
     * Returns result as string.
     */

    // manage additional newlines
    for (const chr of additional_pAda_separators) {
      cntnts = cntnts.split(chr).join('\n');
    }
    
    // also dedupe, also allowing for carriage returns introduced in HTML form input
    cntnts = cntnts.replace(/(\n\r?){2,}/g, '\n');
    
    // also remove buffer-initial and -final newlines
    cntnts = cntnts.replace(/(^\s*)|(\s*$)/g, '').trim();

    // filter out disallowed characters (skip filtering for unrecognized schemes)
    const schemeChars = character_set[schemeIn];
    if (!schemeChars) return cntnts;
    const allowedChars = new Set(schemeChars);
    let result = '';
    for (const c of cntnts) {
      if (allowedChars.has(c)) {
        result += c;
      }
    }

    return result;
  }

  syllabifyText(txtSLP) {
    /**
     * Accepts (newline-separated) multi-line string of SLP text.
     * 
     * Syllabifies by maximizing number of open (vowel-final) syllables,
     * separating them from one another with scansion_syllable_separator.
     * 
     * Returns new (newline-separated) multi-line string.
     */

    // final cleaning for scansion: irrelevant horizontal white space
    const horizontalWhiteSpace = [' ', '\t'];
    for (const c of horizontalWhiteSpace) {
      txtSLP = txtSLP.split(c).join('');
    }

    // treat lines individually (newlines to be restored upon return)
    const textLines = txtSLP.split('\n');
    const syllablesByLine = [];

    for (const line of textLines) {
      let lineSyllables = '';

      // place scansion_syllable_separator after vowels
      for (const letter of line) {
        // exception: do treat M and H as explicit syllable coda
        if (['M', 'H'].includes(letter)) {
          if (lineSyllables.endsWith(scansion_syllable_separator)) {
            lineSyllables = lineSyllables.slice(0, -1);
          }
        }

        lineSyllables += letter;

        if ([...SLP_vowels, 'M', 'H'].includes(letter)) {
          lineSyllables += scansion_syllable_separator;
        }
      }

      try {
        // remove final scansion_syllable_separator before final consonant(s)
        if (lineSyllables.length > 0 && 
            SLP_consonants_for_scansion.includes(lineSyllables[lineSyllables.length - 1])) {
          
          // final separator is incorrect, remove
          const finalSeparatorIndex = lineSyllables.lastIndexOf(scansion_syllable_separator);
          if (finalSeparatorIndex >= 0) {
            lineSyllables = lineSyllables.slice(0, finalSeparatorIndex) + 
                           lineSyllables.slice(finalSeparatorIndex + 1);
          }
          lineSyllables += scansion_syllable_separator;
        }
      } catch (e) {
        // IndexError equivalent - just continue
      }

      syllablesByLine.push(lineSyllables);
    }

    const textSyllabified = syllablesByLine.join('\n'); // restore newlines
    return textSyllabified;
  }

  scanSyllableWeights(txtSyl) {
    /**
     * Accepts (newline-separated) multi-line string of text
     * which is syllabified with scansion_syllable_separator.
     * 
     * Returns corresponding multi-line string light/heavy (l/g) pattern.
     */

    // treat lines individually (newlines to be restored upon return)
    const textLines = txtSyl.split('\n');
    const weightsByLine = [];

    for (const line of textLines) {
      let lineWeights = '';
      let syllables = line.split(scansion_syllable_separator);

      try {
        while (syllables.length > 0 && syllables[syllables.length - 1] === '') {
          syllables.pop(); // in case of final separator(s)
        }
      } catch (e) {
        // IndexError equivalent
      }

      for (let n = 0; n < syllables.length; n++) {
        const syllable = syllables[n];

        if (
          // heavy by nature
          [...SLP_long_vowels, 'M', 'H'].includes(syllable[syllable.length - 1])
          ||
          // heavy by position:
          // consonant closes syllable or is second letter of next syllable
          SLP_consonants_for_scansion.includes(syllable[syllable.length - 1])
          ||
          (n <= syllables.length - 2 &&
           syllables[n + 1].length > 1 &&
           SLP_consonants_for_scansion.includes(syllables[n + 1][1]))
        ) {
          lineWeights += 'g';
        } else {
          lineWeights += 'l';
        }
      }

      weightsByLine.push(lineWeights);
    }

    const syllableWeights = weightsByLine.join('\n'); // restore newlines
    return syllableWeights;
  }

  countMorae(sylWts) {
    /**
     * Accepts (newline-separated) multi-line string of text
     * detailing light/heavy (l/g) pattern.
     * 
     * Returns list with length equal to number of lines in argument
     * and containing number of morae found in each line.
     */
    const moraePerLine = [];
    const weightsByLine = sylWts.split('\n');

    for (const line of weightsByLine) {
      const lCount = (line.match(/l/g) || []).length;
      const gCount = (line.match(/g/g) || []).length;
      moraePerLine.push(lCount * 1 + gCount * 2);
    }

    return moraePerLine;
  }

  gaRaAbbreviate(sylWts) {
    /**
     * Accepts one-line string of light/heavy (l/g) pattern, e.g., 'lllgggl'.
     * 
     * Returns string of 'gaRa'-trisyllable abbreviation, e.g. 'nml'.
     */
    for (const c of sylWts) {
      if (!['l', 'g'].includes(c)) {
        return null;
      }
    }

    let weightsOfCurrGaRa = '';
    let overallAbbreviation = '';

    for (const singleWeight of sylWts) {
      weightsOfCurrGaRa += singleWeight;
      if (weightsOfCurrGaRa.length === 3) {
        overallAbbreviation += gaRas_by_weights[weightsOfCurrGaRa];
        weightsOfCurrGaRa = '';
      }
    }

    // leftover lights and heavies (l/g)
    overallAbbreviation += weightsOfCurrGaRa;

    return overallAbbreviation;
  }

  scan(cntnts, fromScheme = null) {
    /**
     * Manages overall scansion procedure:
     *   accept raw text
     *   detect or accept transliteration scheme
     *   clean text for scansion
     *   transliterate text to SLP
     *   perform syllabification
     *   determine syllable weights (i.e., convert to l/g pattern)
     *   count morae per line
     * 
     * Returns results of each of these steps as attributes of single Verse object.
     */
    
    const V = new Verse();
    V.textRaw = cntnts;

    // set up Transliterator and schemes
    const T = new Transliterator(); // default settings
    if (fromScheme !== null) {
      fromScheme = fromScheme.toUpperCase();
      T.schemeIn = fromScheme;
    } else if (auto_detect_synonyms.includes(T.schemeIn.toUpperCase())) {
      T.setDetectedScheme();
    }

    V.originalScheme = T.schemeIn;
    T.schemeOut = 'SLP';

    V.textCleaned = this.cleanInput(V.textRaw, V.originalScheme);
    V.textSLP = T.transliterate(V.textCleaned);
    V.textSyllabified = this.syllabifyText(V.textSLP);
    V.syllableWeights = this.scanSyllableWeights(V.textSyllabified);
    V.moraePerLine = this.countMorae(V.syllableWeights);
    V.gaRaAbbreviations = V.syllableWeights.split('\n')
      .map(line => this.gaRaAbbreviate(line))
      .join('\n');

    this.Verse = V;
    this.Transliterator = T;
    return V;
  }
}