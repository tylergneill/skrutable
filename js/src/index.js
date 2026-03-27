// Main entry point for the skrutable JavaScript library
// Sanskrit text processing toolkit for transliteration, scansion, and meter identification

// Convenience functions for common use cases
export class Skrutable {
  constructor() {
    this.transliterator = new Transliterator();
    this.scanner = new Scanner();
    this.meterIdentifier = new MeterIdentifier();
  }

  /**
   * Transliterate text between schemes
   * @param {string} text - Input text
   * @param {string} fromScheme - Source scheme (IAST, SLP, DEV, etc.)
   * @param {string} toScheme - Target scheme (IAST, SLP, DEV, etc.)
   * @returns {string} Transliterated text
   */
  transliterate(text, fromScheme = null, toScheme = 'IAST') {
    const t = new Transliterator(fromScheme, toScheme);
    return t.transliterate(text);
  }

  /**
   * Perform scansion on Sanskrit text
   * @param {string} text - Sanskrit text to scan
   * @param {string} fromScheme - Input scheme (optional, auto-detected if null)
   * @returns {Verse} Verse object with scansion results
   */
  scan(text, fromScheme = null) {
    return this.scanner.scan(text, fromScheme);
  }

  /**
   * Identify meter of Sanskrit verse
   * @param {string} text - Sanskrit verse text
   * @param {string} fromScheme - Input scheme (optional, auto-detected if null)
   * @param {string} resplitOption - Resplit mode: 'none', 'resplit_max', 'resplit_lite', 'single_pAda'
   * @returns {Verse} Verse object with meter identification
   */
  identifyMeter(text, fromScheme = null, resplitOption = 'resplit_max', resplit_keep_midpoint = false) {
    return this.meterIdentifier.identify_meter(text, resplitOption, resplit_keep_midpoint, fromScheme);
  }

  /**
   * Get a formatted summary of scansion and meter identification
   * @param {string} text - Sanskrit verse text
   * @param {string} fromScheme - Input scheme (optional)
   * @param {Object} options - Display options
   * @returns {string} Formatted summary
   */
  analyze(text, fromScheme = null, options = {}) {
    const {
      showWeights = true,
      showMorae = true,
      showGaRas = true,
      showAlignment = true,
      showLabel = true
    } = options;

    const verse = this.identifyMeter(text, fromScheme);
    return verse.summarize(showWeights, showMorae, showGaRas, showAlignment, showLabel);
  }
}

// Re-export core classes for backward compatibility
import { Transliterator } from './transliteration.js';
import { Scanner, Verse } from './scansion.js';
import { MeterIdentifier } from './meter_identification.js';