// Scheme detection for Sanskrit text processing
// Hybrid heuristic + statistical approach using MBH corpus vectors

import schemeVectorsData from './scheme_vectors.json' with { type: 'json' };
import impossibleBigramsData from './impossible_bigrams.json' with { type: 'json' };

export const auto_detect_synonyms = [
  'AUTO', 'DETECT', 'AUTO DETECT',
  'AUTO-DETECT', 'AUTO_DETECT', 'AUTODETECT'
];

const _featureIndex = schemeVectorsData['feature_index'];
const _referenceVectors = schemeVectorsData['vectors'];
const _impossibleBigrams = impossibleBigramsData;

const _SCHEME_PRIORITY = [
  'DEV', 'BENGALI', 'GUJARATI',
  'IAST', 'HK', 'ITRANS', 'WX', 'SLP', 'VH',
];

const _ROMAN_SCHEMES = ['IAST', 'HK', 'ITRANS', 'WX', 'SLP', 'VH'];

// Unicode ranges for quick Indic script detection
const _INDIC_RANGES = {
  'DEV':      [0x0900, 0x097F],
  'BENGALI':  [0x0980, 0x09FF],
  'GUJARATI': [0x0A80, 0x0AFF],
};

// Per impossible-bigram-instance penalty subtracted from cosine scores.
const _BIGRAM_PENALTY = 0.01;

// Dandas and similar punctuation fall in the DEV Unicode range but are used
// across all Sanskrit text regardless of transliteration scheme.
const _INDIC_PUNCTUATION = new Set(['\u0964', '\u0965']);

export class SchemeDetector {
  constructor() {}

  _countIndic(text) {
    /**
     * Count non-punctuation Indic characters per script.
     * Returns [dominantScript, count], or [null, 0] if none found.
     */
    const counts = {};
    for (const ch of text) {
      if (_INDIC_PUNCTUATION.has(ch)) continue;
      const cp = ch.codePointAt(0);
      for (const [script, [lo, hi]] of Object.entries(_INDIC_RANGES)) {
        if (cp >= lo && cp <= hi) {
          counts[script] = (counts[script] || 0) + 1;
          break;
        }
      }
    }
    if (Object.keys(counts).length === 0) return [null, 0];
    const dominant = Object.entries(counts).reduce((a, b) => b[1] > a[1] ? b : a)[0];
    return [dominant, counts[dominant]];
  }

  _bigramPenalties(text) {
    /**
     * Count impossible-bigram instances in text for each scheme.
     * Returns dict of scheme -> penalty (count * _BIGRAM_PENALTY).
     */
    const counts = {};
    for (let i = 0; i < text.length - 1; i++) {
      const bg = text[i] + text[i + 1];
      const excluded = _impossibleBigrams[bg];
      if (excluded) {
        for (const s of excluded) {
          counts[s] = (counts[s] || 0) + 1;
        }
      }
    }
    const penalties = {};
    for (const s of _ROMAN_SCHEMES) {
      penalties[s] = (counts[s] || 0) * _BIGRAM_PENALTY;
    }
    return penalties;
  }

  fingerprint(text) {
    /**
     * Returns a feature vector with frequency counts for curated
     * characters and bigrams that discriminate between schemes.
     */
    const charCounts = {};
    const bigramCounts = {};
    for (const ch of text) {
      charCounts[ch] = (charCounts[ch] || 0) + 1;
    }
    for (let i = 0; i < text.length - 1; i++) {
      const bg = text[i] + text[i + 1];
      bigramCounts[bg] = (bigramCounts[bg] || 0) + 1;
    }
    return _featureIndex.map(feat =>
      feat.length === 1
        ? (charCounts[feat] || 0)
        : (bigramCounts[feat] || 0)
    );
  }

  cosineSimilarity(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  detectScheme(fileData = '') {
    /**
     * Detect the transliteration scheme of the input text.
     *
     * 1. Indic ratio check (fast-path): if ≥40% of sample characters are
     *    non-punctuation Indic letters, return the dominant script immediately.
     *
     * 2a. Cosine similarity: build a character/bigram fingerprint and compute
     *     cosine similarity against MBH corpus reference vectors per scheme.
     *
     * 2b. Impossible-bigram penalty: subtract a small penalty for each bigram
     *     that never occurs in a given scheme's MBH corpus.
     *
     * 3.  Priority tiebreaker: among schemes within tolerance, prefer the more
     *     common one (IAST > HK > ITRANS > WX > SLP > VH).
     */
    if (fileData === '') {
      this.confidence = null;
      return null;
    }

    const MAX_SAMPLE_CHARS = 1000;
    const MIN_INDIC_RATIO = 0.4;
    const sample = fileData.slice(0, MAX_SAMPLE_CHARS);

    // --- Indic script check ---
    const [indicScript, indicCount] = this._countIndic(sample);
    if (indicCount / sample.length >= MIN_INDIC_RATIO) {
      this.confidence = 'high';
      return indicScript;
    }

    // --- Cosine + bigram penalty for Roman schemes ---
    const fileVector = this.fingerprint(sample);
    const penalties = this._bigramPenalties(sample);

    const adjustedScores = {};
    for (const scheme of _ROMAN_SCHEMES) {
      const refVec = _referenceVectors[scheme];
      const raw = this.cosineSimilarity(fileVector, refVec);
      adjustedScores[scheme] = raw - (penalties[scheme] || 0);
    }

    const topScore = Math.max(...Object.values(adjustedScores));
    const tolerance = 0.03;
    const CONFIDENCE_REF_LEN = 80;
    const confidenceThreshold = tolerance * Math.max(1, CONFIDENCE_REF_LEN / sample.length);

    for (const scheme of _SCHEME_PRIORITY) {
      const score = adjustedScores[scheme] !== undefined ? adjustedScores[scheme] : -1;
      if (score > 0 && topScore - score < tolerance) {
        const remaining = _ROMAN_SCHEMES.filter(s => s !== scheme);
        const second = Math.max(...remaining.map(s => adjustedScores[s]));
        const gap = adjustedScores[scheme] - second;
        this.confidence = gap >= confidenceThreshold ? 'high' : 'low';
        return scheme;
      }
    }

    // Fallback: cosine winner
    const best = Object.entries(adjustedScores).reduce((a, b) => b[1] > a[1] ? b : a)[0];
    this.confidence = 'low';
    return best;
  }
}
