// Phoneme definitions and character mappings for Sanskrit text processing

export const SLP_short_vowels = ['a','i','u','f','x','ĕ','ŏ']; // latter two exceptions for one-char principle
export const SLP_long_vowels = ['A','I','U','F','X','e','E','o','O'];
export const SLP_vowels = [...SLP_short_vowels, ...SLP_long_vowels];

export const SLP_vowels_with_mAtrAs = SLP_vowels.slice(1); // exclude 'a'

// the below line up with SLP above: first short vowels, then long vowels
export const DEV_vowel_mAtrAs = ['ि', 'ु', 'ृ', 'ॢ', 'े', 'ो', 'ा', 'ी', 'ू', 'ॄ', 'ॣ', 'े', 'ै', 'ो', 'ौ'];
export const BENGALI_vowel_mAtrAs = ['ি', 'ু', 'ৃ', 'ৢ', 'ে', 'ো', 'া', 'ী', 'ূ', 'ৄ', 'ৣ', 'ে', 'ৈ', 'ো', 'ৌ'];
export const GUJARATI_vowel_mAtrAs = ['િ', 'ુ', 'ૃ', 'ૢ',  'ે',  'ો', 'ા', 'ી', 'ૂ', 'ૄ',  'ૣ',  'ે',  'ૈ',  'ો',  'ૌ'];

// Create lookup objects from arrays
function createLookup(keys, values) {
  const lookup = {};
  keys.forEach((key, index) => {
    lookup[key] = values[index];
  });
  return lookup;
}

// dict of dicts
// use like e.g. vowel_mAtrA_lookup['DEV']['o'] or vowel_mAtrA_lookup['BENGALI']['u']
export const vowel_mAtrA_lookup = {
  'DEV': createLookup(SLP_vowels_with_mAtrAs, DEV_vowel_mAtrAs),
  'BENGALI': createLookup(SLP_vowels_with_mAtrAs, BENGALI_vowel_mAtrAs),
  'GUJARATI': createLookup(SLP_vowels_with_mAtrAs, GUJARATI_vowel_mAtrAs),
};

export const vowels_that_preempt_virAma = [
  ...SLP_vowels, 
  ...DEV_vowel_mAtrAs,
  ...BENGALI_vowel_mAtrAs, 
  ...GUJARATI_vowel_mAtrAs
];

export const SLP_unvoiced_consonants = ['k','K','c','C','w','W','t','T','p','P','z','S','s'];
export const SLP_voiced_consonants = ['g','G','N','j','J','Y','q','Q','R','d','D','n','b','B','m','y','r','l','v','h'];

export const SLP_consonants = [...SLP_unvoiced_consonants, ...SLP_voiced_consonants];
/*
Voice distinguished for sake of destroy_spaces functionality.
For transliteration, 'consonant' means 'needs virāma if non-vowel follows' (no M H)
*/

export const SLP_consonants_for_scansion = SLP_consonants;
/* For scansion, 'consonant' means 'contributes to heaviness of previous vowel' (yes M H) */

export const DEV_consonants = ['क', 'ख', 'ग', 'घ', 'ङ','च', 'छ', 'ज', 'झ', 'ञ',
'ट', 'ठ', 'ड', 'ढ', 'ण','त', 'थ', 'द', 'ध', 'न','प', 'फ', 'ब', 'भ', 'म',
'य', 'र', 'ल', 'व','श', 'ष', 'स', 'ह'];

export const BENGALI_consonants = ['ক', 'খ', 'গ', 'ঘ', 'ঙ','চ', 'ছ', 'জ', 'ঝ', 'ঞ',
'ট', 'ঠ', 'ড', 'ঢ', 'ণ','ত', 'থ', 'দ', 'ধ', 'ন','প', 'ফ', 'ব', 'ভ', 'ম',
'য', 'র', 'ল', 'ব','শ', 'ষ', 'স', 'হ'];

export const GUJARATI_consonants = ['ક', 'ખ', 'ગ', 'ઘ', 'ઙ','ચ', 'છ', 'જ', 'ઝ', 'ઞ',
'ટ', 'ઠ', 'ડ', 'ઢ', 'ણ','ત', 'થ', 'દ', 'ધ', 'ન','પ', 'ફ', 'બ', 'ભ', 'મ',
'ય', 'ર', 'લ', 'વ','શ', 'ષ', 'સ', 'હ'];

// lookup table to use like e.g. SLP_and_indic_consonants['BENGALI']
export const SLP_and_indic_consonants = [
  ...SLP_consonants, 
  ...DEV_consonants,
  ...BENGALI_consonants, 
  ...GUJARATI_consonants
];

// build character sets for use in cleaning for scansion

// Generate arrays for Roman character ranges
function rangeArray(start, end) {
  return Array.from({length: end - start + 1}, (_, i) => String.fromCharCode(start + i));
}

export const Roman_upper = rangeArray(65, 90); // A-Z
export const Roman_lower = rangeArray(97, 122); // a-z

export const SLP_chars = [
  ...Roman_upper.filter(c => !['L','V','Z'].includes(c)),
  ...Roman_lower
];

export const IAST_chars = [
  ...Roman_lower.filter(c => !['f','q','w','x','z'].includes(c)),
  ...'ñāīśūḍḥḷḹṃṅṇṛṝṣṭẖḫïüĕŏ'.split(''),
  ...'̣̥̱̮̱̄́̇ṁēō'.split('') // also accept ISO etc. alternates
  // need to add more in case of capital letters, etc.; see scheme_maps.IAST_SLP
];

export const HK_chars = [
  ...'ADGHIJMNRSTU'.split(''),
  ...Roman_lower.filter(c => !['f','q','w','x'].includes(c))
];

export const VH_chars = [
  ...'BCDGJKLPRT'.split(''),
  ...'"~.'.split(''),
  ...Roman_lower.filter(c => !['f','q','w','x','z'].includes(c))
];

export const ITRANS_chars = [
  ...'CDEILNORST'.split(''),
  ...'.^~'.split(''),
  ...Roman_lower.filter(c => !['f','q','v','x','z'].includes(c))
];

export const virAmas = {
  'DEV': '्',
  'BENGALI': '্',
  'GUJARATI': '્',
};

export const DEV_nums = ['१','२','३','४','५','६','७','८','९','०'];
export const BENGALI_nums = ['১','২','৩','৪','৫','৬','৭','৮','৯','০'];
export const GUJARATI_nums = ['૧','૨','૩','૪','૫','૬','૭','૮','૯','૦'];

// Initialize with basic character sets
export const DEV_chars = [
  virAmas['DEV'],
  // Add common Devanagari characters (will be populated dynamically if needed)
  'अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ऋ', 'ॠ', 'ऌ', 'ॡ', 'ए', 'ऐ', 'ओ', 'औ',
  'क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज', 'झ', 'ञ', 'ट', 'ठ', 'ड', 'ढ', 'ण',
  'त', 'थ', 'द', 'ध', 'न', 'प', 'फ', 'ब', 'भ', 'म', 'य', 'र', 'ल', 'व', 'श', 'ष', 'स', 'ह', 'ऽ',
  'ा', 'ि', 'ी', 'ु', 'ू', 'ृ', 'ॄ', 'ॢ', 'ॣ', 'े', 'ै', 'ो', 'ौ', 'ं', 'ः'
];

export const BENGALI_chars = [
  virAmas['BENGALI'],
  // Add common Bengali characters
  'অ', 'আ', 'ই', 'ঈ', 'উ', 'ঊ', 'ঋ', 'ৠ', 'ঌ', 'ৡ', 'এ', 'ঐ', 'ও', 'ঔ',
  'ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ', 'ট', 'ঠ', 'ড', 'ঢ', 'ণ',
  'ত', 'থ', 'দ', 'ধ', 'ন', 'প', 'ফ', 'ব', 'ভ', 'ম', 'য', 'র', 'ল', 'ব', 'শ', 'ষ', 'স', 'হ', 'ঽ',
  'া', 'ি', 'ী', 'ু', 'ূ', 'ৃ', 'ৄ', 'ৢ', 'ৣ', 'ে', 'ৈ', 'ো', 'ৌ', 'ং', 'ঃ'
];

export const GUJARATI_chars = [
  virAmas['GUJARATI'],
  // Add common Gujarati characters
  'અ', 'આ', 'ઇ', 'ઈ', 'ઉ', 'ઊ', 'ઋ', 'ૠ', 'ઌ', 'ૡ', 'એ', 'ઐ', 'ઓ', 'ઔ',
  'ક', 'ખ', 'ગ', 'ઘ', 'ઙ', 'ચ', 'છ', 'જ', 'ઝ', 'ઞ', 'ટ', 'ઠ', 'ડ', 'ઢ', 'ણ',
  'ત', 'થ', 'દ', 'ધ', 'ન', 'પ', 'ફ', 'બ', 'ભ', 'મ', 'ય', 'ર', 'લ', 'વ', 'શ', 'ષ', 'સ', 'હ', 'ઽ',
  'ા', 'િ', 'ી', 'ુ', 'ૂ', 'ૃ', 'ૄ', 'ૢ', 'ૣ', 'ે', 'ૈ', 'ો', 'ૌ', 'ં', 'ઃ'
];

// Function to initialize character sets (called after scheme_maps is available)
export function initializeCharacterSets(schemeMaps) {
  // This function can be used to dynamically populate character sets if needed
  // For now, we use the static sets defined above
}

// lookup table to use like e.g. character_set['HK']
export const character_set = {
  'SLP': SLP_chars,
  'IAST': IAST_chars,
  'HK': HK_chars,
  'DEV': DEV_chars,
  'BENGALI': BENGALI_chars,
  'GUJARATI': GUJARATI_chars,
  'VH': VH_chars,
  'ITRANS': ITRANS_chars
};

// add standard whitespace to all scansion character sets
const to_add = [' ', '\t', '\n'];
for (const k of Object.keys(character_set)) {
  character_set[k].push(...to_add);
}