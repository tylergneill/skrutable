// Main Transliterator class for Sanskrit text processing
import { 
  SLP_and_indic_consonants,
  vowels_that_preempt_virAma,
  SLP_vowels_with_mAtrAs,
  vowel_mAtrA_lookup,
  SLP_consonants,
  virAmas,
  initializeCharacterSets
} from './phonemes.js';
import { indic_schemes, by_name } from './scheme_maps.js';
import { SchemeDetector, auto_detect_synonyms } from './scheme_detection.js';
import { avoidVirama } from './virAma_avoidance.js';
import { config } from './config.js';

// Initialize character sets after importing scheme maps
initializeCharacterSets({ DEV_SLP: by_name.DEV_SLP, BENGALI_SLP: by_name.BENGALI_SLP, GUJARATI_SLP: by_name.GUJARATI_SLP });

// Load config variables
const DEFAULT_SCHEME_IN = config.default_scheme_in; // e.g. "IAST"
const DEFAULT_SCHEME_OUT = config.default_scheme_out; // e.g. "IAST"
const AVOID_VIRAMA_INDIC_SCRIPTS_DEFAULT = config.avoid_virama_indic_scripts; // e.g. true
const AVOID_VIRAMA_NON_INDIC_SCRIPTS_DEFAULT = config.avoid_virama_non_indic_scripts; // e.g. false

export class Transliterator {
  /**
   * User-facing agent-style object.
   * 
   * Can be used with only default settings (see config.js),
   * or with manually passed override settings.
   * 
   * Main method transliterate() accepts and returns string.
   */
  
  constructor(fromScheme = null, toScheme = null) {
    this.contents = null;

    if (fromScheme === null) {
      fromScheme = DEFAULT_SCHEME_IN;
    }
    fromScheme = fromScheme.toUpperCase();
    this.schemeIn = fromScheme;

    if (toScheme === null) {
      toScheme = DEFAULT_SCHEME_OUT;
    }
    toScheme = toScheme.toUpperCase();
    this.schemeOut = toScheme;
  }

  setDetectedScheme() {
    /**
     * Internal method.
     */
    const SD = new SchemeDetector();
    this.schemeIn = SD.detectScheme(this.contents);
  }

  mapReplace(fromScheme, toScheme) {
    /**
     * Internal method.
     * 
     * Performs simple series of global regex replacements for transliteration.
     * 
     * Result returned via updated this.contents.
     */
    const mapKey = fromScheme + '_' + toScheme;
    if (!by_name[mapKey]) {
      throw new Error(`No mapping found for ${fromScheme} to ${toScheme}`);
    }
    
    const map = by_name[mapKey];
    for (const [charIn, charOut] of map) {
      // Use split/join for global replacement (faster than regex for simple strings)
      this.contents = this.contents.split(charIn).join(charOut);
    }
  }

  avoidVirAmas() {
    /**
     * Internal method.
     * 
     * Performs simple series of global regex replacements for avoiding virāma.
     * 
     * Result returned via updated this.contents.
     */
    this.contents = avoidVirama(this.contents);
  }

  linearPreprocessing(fromScheme, toScheme) {
    /**
     * Internal method.
     * 
     * Manages inherent short 'a' vowel and virāma for Indic schemes <<>> SLP,
     * paying special attention to positions immediately after consonants.
     * 
     * Also manages distinction between initial and mātrā vowel forms.
     * 
     * Indic-SLP hybrid result returned via updated this.contents,
     * to be further processed by simple map replacement.
     */

    let charToIgnore, charToAdd;

    if (indic_schemes.includes(fromScheme) && toScheme === 'SLP') {
      charToIgnore = virAmas[fromScheme];
      charToAdd = 'a';
    } else if (fromScheme === 'SLP' && indic_schemes.includes(toScheme)) {
      charToIgnore = 'a';
      charToAdd = virAmas[toScheme];
    } else {
      return;
    }

    const contentIn = this.contents;
    let contentOut = ''; // buffer to build as hybrid mix
    let prevChar = '';

    for (const currChar of contentIn) {
      if (SLP_and_indic_consonants.includes(prevChar)) {
        // only need special action after consonants

        if (currChar === charToIgnore) {
          // from DEV: virāma
          // from SLP: 'a'
          // pass - don't add anything
        } else if (!vowels_that_preempt_virAma.includes(currChar)) {
          // from Indic: not vowel mātrā, therefore need 'a'
          // from SLP: not vowel, therefore need virāma
          // could also be other things (e.g. vowel, whitespace, punct.)
          contentOut += charToAdd + currChar;
        } else if (SLP_vowels_with_mAtrAs.includes(currChar)) {
          // from SLP: any vowel except 'a', therefore need mātrā
          try {
            // being careful of stray characters
            contentOut += vowel_mAtrA_lookup[toScheme][currChar];
          } catch (e) {
            // KeyError equivalent - just skip
          }
        } else if (vowels_that_preempt_virAma.includes(currChar)) {
          // from Indic: vowel mātrā (only possibility left)
          contentOut += currChar;
        }
      } else {
        // whenever preceding is non-consonant (e.g. vowel, whitespace, punct.)
        contentOut += currChar;
      }

      prevChar = currChar;
    }

    if (fromScheme === 'SLP' && SLP_consonants.includes(prevChar)) {
      // found line-final SLP consonant when transliterating to Indic script, therefore final virāma needed
      contentOut += virAmas[toScheme];
    } else if (indic_schemes.includes(fromScheme) && SLP_and_indic_consonants.includes(prevChar)) {
      // found line-final Indic consonant when transliterating to SLP, therefore final 'a' needed
      contentOut += 'a';
    }

    this.contents = contentOut; // hybrid
  }

  normalizeAnunasika(toScheme, preserveAnunasika) {
    /**
     * Internal method.
     *
     * Normalizes SLP ~ (anunāsika) to M (anusvāra) when required:
     * - Always for HK, VH, WX, IASTREDUCED (no anunāsika representation)
     * - For IAST, ITRANS, SLP, DEV, BENGALI, GUJARATI when preserveAnunasika is false
     */
    const alwaysNormalize = ['HK', 'VH', 'WX', 'IASTREDUCED'];
    const conditionallyNormalize = ['IAST', 'ITRANS', 'SLP', 'DEV', 'BENGALI', 'GUJARATI'];
    if (alwaysNormalize.includes(toScheme) || (conditionallyNormalize.includes(toScheme) && !preserveAnunasika)) {
      this.contents = this.contents.split('~').join('M');
    }
  }

  transliterate(
    cntnts,
    fromScheme = null,
    toScheme = null,
    avoidViramaIndicScripts = AVOID_VIRAMA_INDIC_SCRIPTS_DEFAULT,
    avoidViramaNonIndicScripts = AVOID_VIRAMA_NON_INDIC_SCRIPTS_DEFAULT,
    preserveAnunasika = false
  ) {
    /**
     * User-facing method.
     * 
     * Manual specification of input and output schemes is optional here,
     * as it was when calling the constructor,
     * but this is the last chance to do so,
     * otherwise input scheme is auto-detected
     * and fixed output scheme is chosen by default (see config.js).
     * 
     * Executes transliteration via SLP,
     * including linear preprocessing in case of DEV.
     * 
     * Result returned via updated this.contents
     * and also directly as string.
     */

    if (fromScheme === "IASTREDUCED") {
      return cntnts;
    }

    this.contents = cntnts;

    // uppercase
    if (fromScheme !== null) {
      this.schemeIn = fromScheme.toUpperCase();
    }
    if (toScheme !== null) {
      this.schemeOut = toScheme.toUpperCase();
    }

    // looks for auto-detect keywords
    if (auto_detect_synonyms.includes(this.schemeIn)) {
      this.setDetectedScheme();
    }

    // transliterate first to hub scheme SLP
    this.linearPreprocessing(this.schemeIn, 'SLP');
    this.mapReplace(this.schemeIn, 'SLP');

    // normalize anunāsika (~) to anusvāra (M) when target scheme cannot represent it
    this.normalizeAnunasika(this.schemeOut, preserveAnunasika);

    // avoid undesirable virāmas specified in virAma_avoidance.js
    if (
      (indic_schemes.includes(this.schemeOut) && avoidViramaIndicScripts === true) ||
      (!indic_schemes.includes(this.schemeOut) && avoidViramaNonIndicScripts === true)
    ) {
      this.avoidVirAmas();
    }

    // then transliterate to desired scheme
    this.linearPreprocessing('SLP', this.schemeOut);
    this.mapReplace('SLP', this.schemeOut);

    return this.contents;
  }
}