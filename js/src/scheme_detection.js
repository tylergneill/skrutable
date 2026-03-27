// Scheme detection for Sanskrit text processing
// Simplified implementation without full Mahabharata vectors

export const auto_detect_synonyms = [
  'AUTO', 'DETECT', 'AUTO DETECT',
  'AUTO-DETECT', 'AUTO_DETECT', 'AUTODETECT'
];

// Vector dot product calculation
function dot(a, b) {
  let sum = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

// Vector magnitude calculation
function norm(vector) {
  return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
}

export class SchemeDetector {
  constructor() {
    // For client-side use, we'll use simplified character frequency detection
    // instead of the full Mahabharata vectors
  }

  fingerprint(fileData) {
    // Returns a Unicode frequency vector for common character ranges
    const codePointFrequencyVector = new Array(10000).fill(0);
    for (const char of fileData) {
      const codePoint = char.charCodeAt(0);
      if (codePoint < 10000) {
        codePointFrequencyVector[codePoint]++;
      }
    }
    return codePointFrequencyVector;
  }

  cosineSimilarity(a, b) {
    const dotProduct = dot(a, b);
    const normA = norm(a);
    const normB = norm(b);
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (normA * normB);
  }

  // Simplified detection based on character presence
  detectSchemeSimple(fileData) {
    if (!fileData || fileData.length === 0) {
      return null;
    }

    // Count characteristic characters for each scheme
    const schemes = {
      'DEV': 0,
      'BENGALI': 0,
      'GUJARATI': 0,
      'IAST': 0,
      'HK': 0,
      'SLP': 0,
      'ITRANS': 0,
      'VH': 0
    };

    // Devanagari Unicode range: 0900-097F
    const devChars = fileData.match(/[\u0900-\u097F]/g);
    if (devChars) schemes.DEV = devChars.length;

    // Bengali Unicode range: 0980-09FF
    const bengaliChars = fileData.match(/[\u0980-\u09FF]/g);
    if (bengaliChars) schemes.BENGALI = bengaliChars.length;

    // Gujarati Unicode range: 0A80-0AFF
    const gujaratiChars = fileData.match(/[\u0A80-\u0AFF]/g);
    if (gujaratiChars) schemes.GUJARATI = gujaratiChars.length;

    // IAST diacritics
    const iastChars = fileData.match(/[āīūṛṝḷḹēōṃḥṅñṭḍṇśṣ]/g);
    if (iastChars) schemes.IAST = iastChars.length;

    // Harvard-Kyoto uppercase chars
    const hkChars = fileData.match(/[AIUGRNCTDPBSHJY]/g);
    if (hkChars) schemes.HK = hkChars.length;

    // SLP specific chars
    const slpChars = fileData.match(/[fFxXwWqQRzMH]/g);
    if (slpChars) schemes.SLP = slpChars.length;

    // ITRANS dots and tildes
    const itransChars = fileData.match(/[~\^\.]/g);
    if (itransChars) schemes.ITRANS = itransChars.length;

    // Velthuis dots and quotes
    const vhChars = fileData.match(/[\.\"]/g);
    if (vhChars) schemes.VH = vhChars.length;

    // Return scheme with highest score
    let maxScheme = 'IAST'; // default
    let maxScore = 0;
    
    for (const [scheme, score] of Object.entries(schemes)) {
      if (score > maxScore) {
        maxScore = score;
        maxScheme = scheme;
      }
    }

    return maxScheme;
  }

  detectScheme(fileData = "") {
    if (fileData === "") return null;

    // Use simplified detection for now
    return this.detectSchemeSimple(fileData);
  }
}