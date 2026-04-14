(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Skrutable = {}));
})(this, (function (exports) { 'use strict';

  // Phoneme definitions and character mappings for Sanskrit text processing

  const SLP_short_vowels = ['a','i','u','f','x','ĕ','ŏ']; // latter two exceptions for one-char principle
  const SLP_long_vowels = ['A','I','U','F','X','e','E','o','O'];
  const SLP_vowels = [...SLP_short_vowels, ...SLP_long_vowels];

  const SLP_vowels_with_mAtrAs = SLP_vowels.slice(1); // exclude 'a'

  // the below line up with SLP above: first short vowels, then long vowels
  const DEV_vowel_mAtrAs = ['ि', 'ु', 'ृ', 'ॢ', 'े', 'ो', 'ा', 'ी', 'ू', 'ॄ', 'ॣ', 'े', 'ै', 'ो', 'ौ'];
  const BENGALI_vowel_mAtrAs = ['ি', 'ু', 'ৃ', 'ৢ', 'ে', 'ো', 'া', 'ী', 'ূ', 'ৄ', 'ৣ', 'ে', 'ৈ', 'ো', 'ৌ'];
  const GUJARATI_vowel_mAtrAs = ['િ', 'ુ', 'ૃ', 'ૢ',  'ે',  'ો', 'ા', 'ી', 'ૂ', 'ૄ',  'ૣ',  'ે',  'ૈ',  'ો',  'ૌ'];

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
  const vowel_mAtrA_lookup = {
    'DEV': createLookup(SLP_vowels_with_mAtrAs, DEV_vowel_mAtrAs),
    'BENGALI': createLookup(SLP_vowels_with_mAtrAs, BENGALI_vowel_mAtrAs),
    'GUJARATI': createLookup(SLP_vowels_with_mAtrAs, GUJARATI_vowel_mAtrAs),
  };

  const vowels_that_preempt_virAma = [
    ...SLP_vowels, 
    ...DEV_vowel_mAtrAs,
    ...BENGALI_vowel_mAtrAs, 
    ...GUJARATI_vowel_mAtrAs
  ];

  const SLP_unvoiced_consonants = ['k','K','c','C','w','W','t','T','p','P','z','S','s'];
  const SLP_voiced_consonants = ['g','G','N','j','J','Y','q','Q','R','d','D','n','b','B','m','y','r','l','v','h'];

  const SLP_consonants = [...SLP_unvoiced_consonants, ...SLP_voiced_consonants];
  /*
  Voice distinguished for sake of destroy_spaces functionality.
  For transliteration, 'consonant' means 'needs virāma if non-vowel follows' (no M H)
  */

  const SLP_consonants_for_scansion = SLP_consonants;
  /* For scansion, 'consonant' means 'contributes to heaviness of previous vowel' (yes M H) */

  const DEV_consonants = ['क', 'ख', 'ग', 'घ', 'ङ','च', 'छ', 'ज', 'झ', 'ञ',
  'ट', 'ठ', 'ड', 'ढ', 'ण','त', 'थ', 'द', 'ध', 'न','प', 'फ', 'ब', 'भ', 'म',
  'य', 'र', 'ल', 'व','श', 'ष', 'स', 'ह'];

  const BENGALI_consonants = ['ক', 'খ', 'গ', 'ঘ', 'ঙ','চ', 'ছ', 'জ', 'ঝ', 'ঞ',
  'ট', 'ঠ', 'ড', 'ঢ', 'ণ','ত', 'থ', 'দ', 'ধ', 'ন','প', 'ফ', 'ব', 'ভ', 'ম',
  'য', 'র', 'ল', 'ব','শ', 'ষ', 'স', 'হ'];

  const GUJARATI_consonants = ['ક', 'ખ', 'ગ', 'ઘ', 'ઙ','ચ', 'છ', 'જ', 'ઝ', 'ઞ',
  'ટ', 'ઠ', 'ડ', 'ઢ', 'ણ','ત', 'થ', 'દ', 'ધ', 'ન','પ', 'ફ', 'બ', 'ભ', 'મ',
  'ય', 'ર', 'લ', 'વ','શ', 'ષ', 'સ', 'હ'];

  // lookup table to use like e.g. SLP_and_indic_consonants['BENGALI']
  const SLP_and_indic_consonants = [
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

  const Roman_upper = rangeArray(65, 90); // A-Z
  const Roman_lower = rangeArray(97, 122); // a-z

  const SLP_chars = [
    ...Roman_upper.filter(c => !['L','V','Z'].includes(c)),
    ...Roman_lower,
    '~'
  ];

  const IAST_chars = [
    ...Roman_lower.filter(c => !['f','q','w','x','z'].includes(c)),
    ...'ñāīśūḍḥḷḹṃṅṇṛṝṣṭẖḫïüĕŏ'.split(''),
    ...'̣̥̱̮̱̄́̇ṁēō̃'.split('') // also accept ISO etc. alternates; U+0303 = combining tilde (anunāsika)
    // need to add more in case of capital letters, etc.; see scheme_maps.IAST_SLP
  ];

  const HK_chars = [
    ...'ADGHIJMNRSTU'.split(''),
    ...Roman_lower.filter(c => !['f','q','w','x'].includes(c))
  ];

  const VH_chars = [
    ...'BCDGJKLPRT'.split(''),
    ...'"~.'.split(''),
    ...Roman_lower.filter(c => !['f','q','w','x','z'].includes(c))
  ];

  const ITRANS_chars = [
    ...'CDEILNORST'.split(''),
    ...'.^~'.split(''),
    ...Roman_lower.filter(c => !['f','q','v','x','z'].includes(c))
  ];

  const virAmas = {
    'DEV': '्',
    'BENGALI': '্',
    'GUJARATI': '્',
  };

  // Initialize with basic character sets
  const DEV_chars = [
    virAmas['DEV'],
    // Add common Devanagari characters (will be populated dynamically if needed)
    'अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ऋ', 'ॠ', 'ऌ', 'ॡ', 'ए', 'ऐ', 'ओ', 'औ',
    'क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज', 'झ', 'ञ', 'ट', 'ठ', 'ड', 'ढ', 'ण',
    'त', 'थ', 'द', 'ध', 'न', 'प', 'फ', 'ब', 'भ', 'म', 'य', 'र', 'ल', 'व', 'श', 'ष', 'स', 'ह', 'ऽ',
    'ा', 'ि', 'ी', 'ु', 'ू', 'ृ', 'ॄ', 'ॢ', 'ॣ', 'े', 'ै', 'ो', 'ौ', 'ँ', 'ं', 'ः'
  ];

  const BENGALI_chars = [
    virAmas['BENGALI'],
    // Add common Bengali characters
    'অ', 'আ', 'ই', 'ঈ', 'উ', 'ঊ', 'ঋ', 'ৠ', 'ঌ', 'ৡ', 'এ', 'ঐ', 'ও', 'ঔ',
    'ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ', 'ট', 'ঠ', 'ড', 'ঢ', 'ণ',
    'ত', 'থ', 'দ', 'ধ', 'ন', 'প', 'ফ', 'ব', 'ভ', 'ম', 'য', 'র', 'ল', 'ব', 'শ', 'ষ', 'স', 'হ', 'ঽ',
    'া', 'ি', 'ী', 'ু', 'ূ', 'ৃ', 'ৄ', 'ৢ', 'ৣ', 'ে', 'ৈ', 'ো', 'ৌ', 'ঁ', 'ং', 'ঃ'
  ];

  const GUJARATI_chars = [
    virAmas['GUJARATI'],
    // Add common Gujarati characters
    'અ', 'આ', 'ઇ', 'ઈ', 'ઉ', 'ઊ', 'ઋ', 'ૠ', 'ઌ', 'ૡ', 'એ', 'ઐ', 'ઓ', 'ઔ',
    'ક', 'ખ', 'ગ', 'ઘ', 'ઙ', 'ચ', 'છ', 'જ', 'ઝ', 'ઞ', 'ટ', 'ઠ', 'ડ', 'ઢ', 'ણ',
    'ત', 'થ', 'દ', 'ધ', 'ન', 'પ', 'ફ', 'બ', 'ભ', 'મ', 'ય', 'ર', 'લ', 'વ', 'શ', 'ષ', 'સ', 'હ', 'ઽ',
    'ા', 'િ', 'ી', 'ુ', 'ૂ', 'ૃ', 'ૄ', 'ૢ', 'ૣ', 'ે', 'ૈ', 'ો', 'ૌ', 'ઁ', 'ં', 'ઃ'
  ];

  // lookup table to use like e.g. character_set['HK']
  const character_set = {
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

  // Transliteration scheme mappings for Sanskrit text processing

  const indic_schemes = ['DEV', 'BENGALI', 'GUJARATI'];

  // IAST to SLP mappings
  const IAST_SLP = [
      // Normalization 0: anunāsika (candrabindu) — combining tilde above (U+0303) → SLP ~
      ['\u0303','~'],
      // Normalization 1: ISO under-circles to under-dots (longs will feed into later rules)
      ['r̥','ṛ'],['R̥','ṛ'], // r ̥ -> ṛ
      ['l̥','ḷ'],['L̥','ḷ'], // l ̥ -> ḷ
      // Normalization 2: ISO ṁ's, ē's, ō's
      ['ṁ','ṃ'],['ṁ','ṃ'],
      ['ē','e'],['ē','e'],['ĕ','ĕ'],
      ['ō','o'],['ō','o'],['ŏ','ŏ'],
      // Normalization 3: merge of combining diacritics to precomposed combinations
      ['ā', 'ā'], ['Ā','Ā'],
      ['ī','ī'], ['Ī','Ī'],
      ['ū','ū'], ['Ū','Ū'],
      ['ï','ï'], ['ü','ü'],  // Prakrit
      ['ṛ','ṛ'], ['Ṛ','Ṛ'],
      ['ṝ','ṝ'], ['Ṝ','Ṝ'],  // r ̣ ̄ R ̣ ̄
      ['ṝ','ṝ'], ['Ṝ','Ṝ'],  // r ̄ ̣ R ̄ ̣
      ['ṝ','ṝ'], ['Ṝ','Ṝ'],  // ṛ ̄ Ṛ ̄
      ['ḷ','ḷ'], ['Ḷ','Ḷ'],
      ['ḹ','ḹ'], ['Ḹ','Ḹ'],  // l ̣ ̄ L ̣ ̄
      ['ḹ','ḹ'], ['Ḹ','Ḹ'],  // l ̄ ̣ L ̄ ̣
      ['ḹ','ḹ'], ['Ḹ','Ḹ'],  // ḷ ̄ Ḷ ̄
      ['ṅ','ṅ'], ['Ṅ','Ṅ'],
      ['ñ','ñ'], ['Ñ','Ñ'],
      ['ṭ','ṭ'], ['Ṭ','Ṭ'],
      ['ḍ','ḍ'], ['Ḍ','Ḍ'],
      ['ṇ','ṇ'], ['Ṇ','Ṇ'],
      ['ś','ś'], ['Ś','Ś'],
      ['ṣ','ṣ'], ['Ṣ','Ṣ'],
      ['ḥ','ḥ'], ['Ḥ','Ḥ'],
      ['ẖ','ẖ'], ['H̱','H'],
      ['ḫ','ḫ'], ['Ḫ','H'],
      ['ṃ','ṃ'], ['Ṃ','Ṃ'],
      // Normalization 4: lowering of uppercase
      ['A','a'],['B','b'],['C','c'],['D','d'],['E','e'],
      ['F','f'],['G','g'],['H','h'],['I','i'],['J','j'],
      ['K','k'],['L','l'],['M','m'],['N','n'],['O','o'],
      ['P','p'],['Q','q'],['R','r'],['S','s'],['T','t'],
      ['U','u'],['V','v'],['W','w'],['X','x'],['Y','y'],['Z','z'],
      ['Ā','ā'],['Ī','ī'],['Ū','ū'],['Ṛ','ṛ'],['Ḷ','ḷ'],
      ['Ṅ','ṅ'],['Ñ','ñ'],['Ṭ','ṭ'],['Ḍ','ḍ'],['Ṇ','ṇ'],
      ['Ś','ś'],['Ṣ','ṣ'],['Ḥ','ḥ'],['Ḫ','h'],['Ṃ','ṃ'],
      // Transliteration 1: careful ordering to avoid bleeding/feeding
      ['ṭh','W'],
      ['ṭ','w'],
      ['ḍh','Q'],
      ['ḍ','q'],
      // Transliteration 2: simpler remaining mappings
      ['ā','A'],
      ['ī','I'],
      ['ū','U'],
      ['ṛ','f'],
      ['ṝ','F'],
      ['ḷ','x'],
      ['ḹ','X'],
      ['ai','E'],
      ['au','O'],
      ['ï','i'], // for Prakrit
      ['ü','u'], // for Prakrit
      ['kh','K'],
      ['gh','G'],
      ['ṅ','N'],
      ['ch','C'],
      ['jh','J'],
      ['ñ','Y'],
      ['ṇ','R'],
      ['th','T'],
      ['dh','D'],
      ['ph','P'],
      ['bh','B'],
      ['ś','S'],
      ['ṣ','z'],
      ['ṃ','M'],
      ['ḥ','H'],['ẖ','H'],['ḫ','H'] // ẖ ḫ (extended IAST) not supported by SLP1 single char
  ];

  // Harvard-Kyoto to SLP mappings
  const HK_SLP = [
      // Transliteration 1: careful ordering to avoid bleeding/feeding
      ['lRR','X'],
      ['RR','F'],
      ['lR','x'],
      ['R','f'],
      ['N','R'],
      ['G','N'],
      ['gh','G'],
      ['Th','W'],
      ['T','w'],
      ['Dh','Q'],
      ['D','q'],
      ['th','T'],
      ['dh','D'],
      ['J','Y'],
      ['jh','J'],
      // Transliteration 2: roundabout swap to avoid bleeding/feeding
      ['z','Z'], // Z not used in either scheme
      ['S','z'],
      ['Z','S'],
      // Transliteration 3: simpler remaining mappings
      ['ai','E'],
      ['au','O'],
      ['kh','K'],
      ['ch','C'],
      ['ph','P'],
      ['bh','B'],
      ["'", "'"]
  ];

  // Devanagari to SLP mappings
  const DEV_SLP = [
      ['अ', 'a'],
      ['आ', 'A'],
      ['इ', 'i'],
      ['ई', 'I'],
      ['उ', 'u'],
      ['ऊ', 'U'],
      ['ऋ', 'f'],
      ['ॠ', 'F'],
      ['ऌ', 'x'],
      ['ॡ', 'X'],
      ['ए', 'e'],
      ['ऐ', 'E'],
      ['ओ', 'o'],
      ['औ', 'O'],
      ['ँ', '~'], // U+0901 Devanagari candrabindu
      ['ं', 'M'],
      ['ः', 'H'],
      ['क', 'k'],
      ['ख', 'K'],
      ['ग', 'g'],
      ['घ', 'G'],
      ['ङ', 'N'],
      ['च', 'c'],
      ['छ', 'C'],
      ['ज', 'j'],
      ['झ', 'J'],
      ['ञ', 'Y'],
      ['ट', 'w'],
      ['ठ', 'W'],
      ['ड', 'q'],
      ['ढ', 'Q'],
      ['ण', 'R'],
      ['त', 't'],
      ['थ', 'T'],
      ['द', 'd'],
      ['ध', 'D'],
      ['न', 'n'],
      ['प', 'p'],
      ['फ', 'P'],
      ['ब', 'b'],
      ['भ', 'B'],
      ['म', 'm'],
      ['य', 'y'],
      ['र', 'r'],
      ['ल', 'l'],
      ['व', 'v'],
      ['श', 'S'],
      ['ष', 'z'],
      ['स', 's'],
      ['ह', 'h'],
      ['ऽ', "'"],
      ['ा', 'A'],
      ['ि', 'i'],
      ['ी', 'I'],
      ['ु', 'u'],
      ['ू', 'U'],
      ['ृ', 'f'],
      ['ॄ', 'F'],
      ['ॢ', 'x'],
      ['ॣ', 'X'],
      ['े', 'e'],
      ['ै', 'E'],
      ['ो', 'o'],
      ['ौ', 'O'],
      ['१', '1'],
      ['२', '2'],
      ['३', '3'],
      ['४', '4'],
      ['५', '5'],
      ['६', '6'],
      ['७', '7'],
      ['८', '8'],
      ['९', '9'],
      ['०', '0']
  ];

  // Bengali to SLP mappings
  const BENGALI_SLP = [
      ['অ', 'a'],
      ['আ', 'A'],
      ['ই', 'i'],
      ['ঈ', 'I'],
      ['উ', 'u'],
      ['ঊ', 'U'],
      ['ঋ', 'f'],
      ['ৠ', 'F'],
      ['ঌ', 'x'],
      ['ৡ', 'X'],
      ['এ', 'e'],
      ['ঐ', 'E'],
      ['ও', 'o'],
      ['ঔ', 'O'],
      ['ঁ', '~'], // U+0981 Bengali candrabindu
      ['ং', 'M'],
      ['ঃ', 'H'],
      ['ক', 'k'],
      ['খ', 'K'],
      ['গ', 'g'],
      ['ঘ', 'G'],
      ['ঙ', 'N'],
      ['চ', 'c'],
      ['ছ', 'C'],
      ['জ', 'j'],
      ['ঝ', 'J'],
      ['ঞ', 'Y'],
      ['ট', 'w'],
      ['ঠ', 'W'],
      ['ড', 'q'],
      ['ঢ', 'Q'],
      ['ণ', 'R'],
      ['ত', 't'],
      ['থ', 'T'],
      ['দ', 'd'],
      ['ধ', 'D'],
      ['ন', 'n'],
      ['প', 'p'],
      ['ফ', 'P'],
      ['ব', 'b'],
      ['ভ', 'B'],
      ['ম', 'm'],
      ['য', 'y'],
      ['র', 'r'],
      ['ল', 'l'],
      ['ব', 'v'],
      ['শ', 'S'],
      ['ষ', 'z'],
      ['স', 's'],
      ['হ', 'h'],
      ['ঽ', "'"],
      ['া', 'A'],
      ['ি', 'i'],
      ['ী', 'I'],
      ['ু', 'u'],
      ['ূ', 'U'],
      ['ৃ', 'f'],
      ['ৄ', 'F'],
      ['ৢ', 'x'],
      ['ৣ', 'X'],
      ['ে', 'e'],
      ['ৈ', 'E'],
      ['ো', 'o'],
      ['ৌ', 'O'],
      ['১', '1'],
      ['২', '2'],
      ['৩', '3'],
      ['৪', '4'],
      ['৫', '5'],
      ['৬', '6'],
      ['৭', '7'],
      ['৮', '8'],
      ['৯', '9'],
      ['০', '0']
  ];

  // Gujarati to SLP mappings
  const GUJARATI_SLP = [
      ['અ', 'a'],
      ['આ', 'A'],
      ['ઇ', 'i'],
      ['ઈ', 'I'],
      ['ઉ', 'u'],
      ['ઊ', 'U'],
      ['ઋ', 'f'],
      ['ૠ', 'F'],
      ['ઌ', 'x'],
      ['ૡ', 'X'],
      ['એ', 'e'],
      ['ઐ', 'E'],
      ['ઓ', 'o'],
      ['ઔ', 'O'],
      ['ઁ', '~'], // U+0A81 Gujarati candrabindu
      ['ં', 'M'],
      ['ઃ', 'H'],
      ['ક', 'k'],
      ['ખ', 'K'],
      ['ગ', 'g'],
      ['ઘ', 'G'],
      ['ઙ', 'N'],
      ['ચ', 'c'],
      ['છ', 'C'],
      ['જ', 'j'],
      ['ઝ', 'J'],
      ['ઞ', 'Y'],
      ['ટ', 'w'],
      ['ઠ', 'W'],
      ['ડ', 'q'],
      ['ઢ', 'Q'],
      ['ણ', 'R'],
      ['ત', 't'],
      ['થ', 'T'],
      ['દ', 'd'],
      ['ધ', 'D'],
      ['ન', 'n'],
      ['પ', 'p'],
      ['ફ', 'P'],
      ['બ', 'b'],
      ['ભ', 'B'],
      ['મ', 'm'],
      ['ય', 'y'],
      ['ર', 'r'],
      ['લ', 'l'],
      ['વ', 'v'],
      ['શ', 'S'],
      ['ષ', 'z'],
      ['સ', 's'],
      ['હ', 'h'],
      ['ઽ', "'"],
      ['ા', 'A'],
      ['િ', 'i'],
      ['ી', 'I'],
      ['ુ', 'u'],
      ['ૂ', 'U'],
      ['ૃ', 'f'],
      ['ૄ', 'F'],
      ['ૢ', 'x'],
      ['ૣ', 'X'],
      ['ે', 'e'],
      ['ૈ', 'E'],
      ['ો', 'o'],
      ['ૌ', 'O'],
      ['૧', '1'],
      ['૨', '2'],
      ['૩', '3'],
      ['૪', '4'],
      ['૫', '5'],
      ['૬', '6'],
      ['૭', '7'],
      ['૮', '8'],
      ['૯', '9'],
      ['૦', '0']
  ];

  // Velthuis to SLP mappings
  const VH_SLP = [
      // Transliteration 1: careful ordering to avoid bleeding/feeding
      ['.a',"'"],
      // Transliteration 2: simpler remaining mappings
      ['aa','A'],
      ['ii','I'],
      ['uu','U'],
      ['.r','f'],
      ['.R','F'],
      ['.l','x'],
      ['.L','X'],
      ['ai','E'],
      ['au','O'],
      ['.m','M'],
      ['.h','H'],
      ['"n','N'],
      ['~n','Y'],
      ['.t','w'],
      ['.T','W'],
      ['.d','q'],
      ['.D','Q'],
      ['.n','R'],
      ['"s','S'],
      ['.s','z'],
      ["'", "'"]
  ];

  // WX to SLP mappings  
  const WX_SLP = [
      // Transliteration 1: very careful ordering to avoid bleeding/feeding
      // start with what not used in WX: Y
      ['F','Y'], // ñ
      // now progressively map to what is freed up
      ['Q','F'], // ṝ
      ['D','Q'], // ḍh
      ['X','D'], // dh
      // again, start with what not used in WX: z
      ['R','z'], // ṣ
      // now progressively map to what is freed up
      ['N','R'], // ṇ
      ['f','N'], // ṅ
      ['q','f'], // ṛ
      ['d','q'], // ḍ
      ['x','d'], // d
      ['L','x'], // ḷ
      // Transliteration 2: roundabout swaps to avoid bleeding/feeding
      // V not used in either scheme
      ['t','V'], // ṭ
      ['w','t'], // t
      ['V','w'], // ṭ
      ['T','V'], // ṭh
      ['W','T'], // th
      ['V','W'], // ṭh
      // Transliteration 3: simpler remaining mapping
      ['Z',"'"]
  ];

  // ITRANS to SLP mappings
  const ITRANS_SLP = [
      // Transliteration 1: careful ordering to avoid bleeding/feeding
      ['T', 'w'],
      ['Th', 'W'],
      ['D', 'q'],
      ['Dh', 'Q'],
      ['th', 'T'],
      ['dh', 'D'],
      // Transliteration 2: roundabout swap to avoid bleeding/feeding
      ['~N', 'Z'], // Z not used in either scheme
      ['N', 'R'],
      ['Z', 'N'],
      // Transliteration 3: simpler remaining mappings
      ['aa', 'A'],
      ['ii', 'I'],
      ['uu', 'U'],
      ['E', 'e'],
      ['ai', 'E'],
      ['O', 'o'],
      ['au', 'O'],
      ['RRi', 'f'],['Ri', 'f'],['R^i', 'f'],
      ['RRI', 'F'],['RI', 'F'],['R^I', 'F'],
      ['LLi', 'x'],['Li', 'x'],['L^i', 'x'],
      ['LLI', 'X'],['LI', 'X'],['L^I', 'X'],
      ['kh', 'K'],
      ['gh', 'G'],
      ['ch', 'c'],
      ['Ch', 'C'],
      ['jh', 'J'],
      ['~n', 'Y'],
      ['ph', 'P'],
      ['bh', 'B'],
      ['sh', 'S'],
      ['Sh', 'z'],
      ['.m', 'M'],
      ['.a', "'"],
      // Remain the same: a, i, u, e, o, k, g, j, t, d, p, b, m, n, y, r, l, v, s, h, H
  ];

  // SLP to SLP (identity with normalization)
  const SLP_SLP = [
      // Normalization 1: avagraha
      ["'", "'"]
  ];

  // SLP to IAST mappings
  const SLP_IAST = [
      // Transliteration 1: all simple mappings
      ['~','\u0303'], // anunāsika: combining tilde above onto preceding vowel
      ['A','ā'],
      ['I','ī'],
      ['U','ū'],
      ['f','ṛ'],
      ['F','ṝ'],
      ['x','ḷ'],
      ['X','ḹ'],
      ['E','ai'],
      ['O','au'],
      ['M','ṃ'],
      ['H','ḥ'],
      ['K','kh'],
      ['G','gh'],
      ['N','ṅ'],
      ['C','ch'],
      ['J','jh'],
      ['Y','ñ'],
      ['w','ṭ'],
      ['W','ṭh'],
      ['q','ḍ'],
      ['Q','ḍh'],
      ['R','ṇ'],
      ['T','th'],
      ['D','dh'],
      ['P','ph'],
      ['B','bh'],
      ['S','ś'],
      ['z','ṣ']
  ];

  // SLP to Harvard-Kyoto mappings
  const SLP_HK = [
      // Transliteration 1: careful ordering to avoid bleeding/feeding
      ['G','gh'],
      ['N','G'],
      ['R','N'],
      ['f','R'],
      ['F','RR'],
      ['x','lR'],
      ['X','lRR'],
      ['T','th'],
      ['D','dh'],
      ['w','T'],
      ['W','Th'],
      ['q','D'],
      ['Q','Dh'],
      ['J','jh'],
      ['Y','J'],
      // Transliteration 2: roundabout swap to avoid feeding in direct swap
      ['S','Z'], // Z not used in either scheme
      ['z','S'],
      ['Z','z'],
      // Transliteration 3: simpler remaining mappings
      ['E','ai'],
      ['O','au'],
      ['K','kh'],
      ['C','ch'],
      ['P','ph'],
      ['B','bh']
  ];

  // SLP to Devanagari mappings
  const SLP_DEV = [
      // Transliteration 1: all simple mappings
      ['a', 'अ'],
      ['A', 'आ'],
      ['i', 'इ'],
      ['I', 'ई'],
      ['u', 'उ'],
      ['U', 'ऊ'],
      ['f', 'ऋ'],
      ['F', 'ॠ'],
      ['x', 'ऌ'],
      ['X', 'ॡ'],
      ['e', 'ए'],['ĕ', 'ए'],
      ['E', 'ऐ'],
      ['o', 'ओ'],['ŏ', 'ओ'],
      ['O', 'औ'],
      ['~', 'ँ'], // U+0901 Devanagari candrabindu
      ['M', 'ं'],
      ['H', 'ः'],
      ['k', 'क'],
      ['K', 'ख'],
      ['g', 'ग'],
      ['G', 'घ'],
      ['N', 'ङ'],
      ['c', 'च'],
      ['C', 'छ'],
      ['j', 'ज'],
      ['J', 'झ'],
      ['Y', 'ञ'],
      ['w', 'ट'],
      ['W', 'ठ'],
      ['q', 'ड'],
      ['Q', 'ढ'],
      ['R', 'ण'],
      ['t', 'त'],
      ['T', 'थ'],
      ['d', 'द'],
      ['D', 'ध'],
      ['n', 'न'],
      ['p', 'प'],
      ['P', 'फ'],
      ['b', 'ब'],
      ['B', 'भ'],
      ['m', 'म'],
      ['y', 'य'],
      ['r', 'र'],
      ['l', 'ल'],
      ['v', 'व'],
      ['S', 'श'],
      ['z', 'ष'],
      ['s', 'स'],
      ['h', 'ह'],
      ["'", 'ऽ'],
      ['1', '१'],
      ['2', '२'],
      ['3', '३'],
      ['4', '४'],
      ['5', '५'],
      ['6', '६'],
      ['7', '७'],
      ['8', '८'],
      ['9', '९'],
      ['0', '०']
  ];

  // SLP to Bengali mappings
  const SLP_BENGALI = [
      // Transliteration 1: all simple mappings
      ['a', 'অ'],
      ['A', 'আ'],
      ['i', 'ই'],
      ['I', 'ঈ'],
      ['u', 'উ'],
      ['U', 'ঊ'],
      ['f', 'ঋ'],
      ['F', 'ৠ'],
      ['x', 'ঌ'],
      ['X', 'ৡ'],
      ['e', 'এ'],['ĕ', 'এ'],
      ['E', 'ঐ'],
      ['o', 'ও'],['ŏ', 'ও'],
      ['O', 'ঔ'],
      ['~', 'ঁ'], // U+0981 Bengali candrabindu
      ['M', 'ং'],
      ['H', 'ঃ'],
      ['k', 'ক'],
      ['K', 'খ'],
      ['g', 'গ'],
      ['G', 'ঘ'],
      ['N', 'ঙ'],
      ['c', 'চ'],
      ['C', 'ছ'],
      ['j', 'জ'],
      ['J', 'ঝ'],
      ['Y', 'ঞ'],
      ['w', 'ট'],
      ['W', 'ঠ'],
      ['q', 'ড'],
      ['Q', 'ঢ'],
      ['R', 'ণ'],
      ['t', 'ত'],
      ['T', 'থ'],
      ['d', 'দ'],
      ['D', 'ধ'],
      ['n', 'ন'],
      ['p', 'প'],
      ['P', 'ফ'],
      ['b', 'ব'],
      ['B', 'ভ'],
      ['m', 'ম'],
      ['y', 'য'],
      ['r', 'র'],
      ['l', 'ল'],
      ['v', 'ব'],
      ['S', 'শ'],
      ['z', 'ষ'],
      ['s', 'স'],
      ['h', 'হ'],
      ["'", 'ঽ'],
      ['1', '১'],
      ['2', '২'],
      ['3', '৩'],
      ['4', '৪'],
      ['5', '৫'],
      ['6', '৬'],
      ['7', '৭'],
      ['8', '৮'],
      ['9', '৯'],
      ['0', '০']
  ];

  // SLP to Gujarati mappings
  const SLP_GUJARATI = [
      // Transliteration 1: all simple mappings
      ['a', 'અ'],
      ['A', 'આ'],
      ['i', 'ઇ'],
      ['I', 'ઈ'],
      ['u', 'ઉ'],
      ['U', 'ઊ'],
      ['f', 'ઋ'],
      ['F', 'ૠ'],
      ['x', 'ઌ'],
      ['X', 'ૡ'],
      ['e', 'એ'],['ĕ', 'એ'],
      ['E', 'ઐ'],
      ['o', 'ઓ'],['ŏ', 'ઓ'],
      ['O', 'ઔ'],
      ['~', 'ઁ'], // U+0A81 Gujarati candrabindu
      ['M', 'ં'],
      ['H', 'ઃ'],
      ['k', 'ક'],
      ['K', 'ખ'],
      ['g', 'ગ'],
      ['G', 'ઘ'],
      ['N', 'ઙ'],
      ['c', 'ચ'],
      ['C', 'છ'],
      ['j', 'જ'],
      ['J', 'ઝ'],
      ['Y', 'ઞ'],
      ['w', 'ટ'],
      ['W', 'ઠ'],
      ['q', 'ડ'],
      ['Q', 'ઢ'],
      ['R', 'ણ'],
      ['t', 'ત'],
      ['T', 'થ'],
      ['d', 'દ'],
      ['D', 'ધ'],
      ['n', 'ન'],
      ['p', 'પ'],
      ['P', 'ફ'],
      ['b', 'બ'],
      ['B', 'ભ'],
      ['m', 'મ'],
      ['y', 'ય'],
      ['r', 'ર'],
      ['l', 'લ'],
      ['v', 'વ'],
      ['S', 'શ'],
      ['z', 'ષ'],
      ['s', 'સ'],
      ['h', 'હ'],
      ["'", 'ઽ'],
      ['1', '૧'],
      ['2', '૨'],
      ['3', '૩'],
      ['4', '૪'],
      ['5', '૫'],
      ['6', '૬'],
      ['7', '૭'],
      ['8', '૮'],
      ['9', '૯'],
      ['0', '૦']
  ];

  // SLP to Velthuis mappings
  const SLP_VH = [
      // Transliteration 1: all simple mappings
      ['A','aa'],
      ['I','ii'],
      ['U','uu'],
      ['f','.r'],
      ['F','.R'],
      ['x','.l'],
      ['X','.L'],
      ['E','ai'],
      ['O','au'],
      ['M','.m'],
      ['H','.h'],
      ['N','"n'],
      ['Y','~n'],
      ['w','.t'],
      ['W','.T'],
      ['q','.d'],
      ['Q','.D'],
      ['R','.n'],
      ['S','"s'],
      ['z','.s'],
      ["'",'.a']
  ];

  // SLP to WX mappings
  const SLP_WX = [
      // Transliteration 1: very careful ordering to avoid bleeding/feeding
      // start with what not used in SLP: L
      ['x','L'], // ḷ
      // now progressively map to what is freed up
      ['d','x'], // d
      ['q','d'], // ḍ
      ['f','q'], // ṛ
      ['N','f'], // ṅ
      ['R','N'], // ṇ
      ['z','R'], // ṣ
      // WX does not seem to have ḹ, so make something up
      ['X','LL'],
      // now progressively map to what is freed up
      ['D','X'], // dh
      ['Q','D'], // ḍh
      ['F','Q'], // ṝ
      ['Y','F'], // ñ
      // Transliteration 2: roundabout swaps to avoid bleeding/feeding
      // V not used in either scheme
      ['w','V'], // ṭ
      ['t','w'], // t
      ['V','t'], // ṭ
      ['W','V'], // ṭh
      ['T','W'], // th
      ['V','T'], // ṭh
      // Transliteration 3: simpler remaining mapping
      ["'",'Z']
  ];

  // SLP to ITRANS mappings
  const SLP_ITRANS = [
      // Transliteration 1: careful ordering to avoid bleeding/feeding
      ['N','~N'], // palatal nasal
      ['R','N'], // retroflex nasal
      ['T','th'],
      ['w','T'],
      ['W','Th'],
      ['D','dh'],
      ['q','D'],
      // Transliteration 2: simpler remaining mappings
      ['A','aa'],
      ['I','ii'],
      ['U','uu'],
      ['f','Ri'],
      ['F','RI'],
      ['x','Li'],
      ['X','LI'],
      ['E','ai'],
      ['O','au'],
      ['M','.m'],
      ['H','H'],
      ['K','kh'],
      ['G','gh'],
      ['c','ch'],
      ['C','Ch'],
      ['J','jh'],
      ['Y','~n'],
      ['Q','Dh'],
      ['P','ph'],
      ['B','bh'],
      ['S','sh'],
      ['z','Sh'],
      ["'",'.a']
  ];

  // SLP to IAST Reduced mappings
  const SLP_IASTREDUCED = [
      // Transliteration 1: all simple mappings
      ['A','a'],
      ['I','i'],
      ['U','u'],
      ['f','r'],
      ['F','r'],
      ['x','l'],
      ['X','l'],
      ['E','ai'],
      ['O','au'],
      ['M','m'],
      ['H','h'],
      ['K','kh'],
      ['G','gh'],
      ['N','n'],
      ['C','ch'],
      ['J','jh'],
      ['Y','n'],
      ['w','t'],
      ['W','th'],
      ['q','d'],
      ['Q','dh'],
      ['R','n'],
      ['T','th'],
      ['D','dh'],
      ['P','ph'],
      ['B','bh'],
      ['S','s'],
      ['z','s']
  ];

  // Mapping lookup by name
  const by_name = {
      'IAST_SLP': IAST_SLP, 'HK_SLP': HK_SLP,
      'DEV_SLP': DEV_SLP, 'BENGALI_SLP': BENGALI_SLP, 'GUJARATI_SLP': GUJARATI_SLP,
      'VH_SLP': VH_SLP, 'WX_SLP': WX_SLP,
      'ITRANS_SLP': ITRANS_SLP,
      'SLP_SLP': SLP_SLP,
      'SLP_IAST': SLP_IAST, 'SLP_HK': SLP_HK,
      'SLP_DEV': SLP_DEV, 'SLP_BENGALI': SLP_BENGALI, 'SLP_GUJARATI': SLP_GUJARATI,
      'SLP_VH': SLP_VH, 'SLP_WX': SLP_WX, 'SLP_ITRANS': SLP_ITRANS,
      'SLP_IASTREDUCED': SLP_IASTREDUCED,
  };

  var feature_index = [
  	"ā",
  	"ī",
  	"ū",
  	"ṛ",
  	"ṝ",
  	"ṭ",
  	"ḍ",
  	"ṇ",
  	"ś",
  	"ṣ",
  	"ṃ",
  	"ḥ",
  	"ñ",
  	"ṅ",
  	"ḷ",
  	"ḹ",
  	"f",
  	"q",
  	"w",
  	"x",
  	"z",
  	"A",
  	"B",
  	"C",
  	"D",
  	"E",
  	"F",
  	"G",
  	"H",
  	"I",
  	"J",
  	"K",
  	"L",
  	"M",
  	"N",
  	"O",
  	"P",
  	"Q",
  	"R",
  	"S",
  	"T",
  	"U",
  	"V",
  	"W",
  	"X",
  	"Y",
  	"Z",
  	"~",
  	"अ",
  	"आ",
  	"इ",
  	"ई",
  	"उ",
  	"ऊ",
  	"क",
  	"ख",
  	"ग",
  	"घ",
  	"च",
  	"छ",
  	"ज",
  	"झ",
  	"ट",
  	"ठ",
  	"ड",
  	"ढ",
  	"त",
  	"थ",
  	"द",
  	"ध",
  	"न",
  	"प",
  	"फ",
  	"ब",
  	"भ",
  	"म",
  	"य",
  	"र",
  	"ल",
  	"व",
  	"श",
  	"ष",
  	"स",
  	"ह",
  	"ा",
  	"ि",
  	"ी",
  	"ु",
  	"ू",
  	"े",
  	"ै",
  	"ो",
  	"ौ",
  	"ं",
  	"ः",
  	"ऽ",
  	"অ",
  	"আ",
  	"ই",
  	"ঈ",
  	"উ",
  	"ঊ",
  	"ক",
  	"খ",
  	"গ",
  	"ঘ",
  	"চ",
  	"ছ",
  	"জ",
  	"ঝ",
  	"ট",
  	"ঠ",
  	"ড",
  	"ঢ",
  	"ত",
  	"থ",
  	"দ",
  	"ধ",
  	"ন",
  	"প",
  	"ফ",
  	"ব",
  	"ভ",
  	"ম",
  	"য",
  	"র",
  	"ল",
  	"শ",
  	"ষ",
  	"স",
  	"হ",
  	"া",
  	"ি",
  	"ী",
  	"ু",
  	"ূ",
  	"ে",
  	"ৈ",
  	"ো",
  	"ৌ",
  	"ং",
  	"ঃ",
  	"ঽ",
  	"અ",
  	"આ",
  	"ઇ",
  	"ઈ",
  	"ઉ",
  	"ઊ",
  	"ક",
  	"ખ",
  	"ગ",
  	"ઘ",
  	"ચ",
  	"છ",
  	"જ",
  	"ઝ",
  	"ટ",
  	"ઠ",
  	"ડ",
  	"ઢ",
  	"ત",
  	"થ",
  	"દ",
  	"ધ",
  	"ન",
  	"પ",
  	"ફ",
  	"બ",
  	"ભ",
  	"મ",
  	"ય",
  	"ર",
  	"લ",
  	"વ",
  	"શ",
  	"ષ",
  	"સ",
  	"હ",
  	"ા",
  	"િ",
  	"ી",
  	"ુ",
  	"ૂ",
  	"ે",
  	"ૈ",
  	"ો",
  	"ૌ",
  	"ં",
  	"ઃ",
  	"ઽ",
  	".t",
  	".T",
  	".d",
  	".D",
  	".n",
  	".r",
  	".R",
  	".l",
  	".L",
  	".m",
  	".h",
  	".s",
  	".a",
  	"\"s",
  	"\"n",
  	"aa",
  	"ii",
  	"uu",
  	"Sh",
  	"sh",
  	"Ch",
  	"Ri",
  	"RI",
  	"Li",
  	"LI",
  	"~n",
  	"~N",
  	"ee",
  	"oo",
  	"lR",
  	"RR",
  	"ST",
  	"kS",
  	"kh",
  	"gh",
  	"ch",
  	"jh",
  	"th",
  	"dh",
  	"ph",
  	"bh",
  	"Th",
  	"Dh",
  	"ai",
  	"au",
  	"kz",
  	"ft",
  	"Ra",
  	"aR",
  	"za",
  	" w",
  	" x",
  	"ax",
  	"xA",
  	"uw",
  	"nw",
  	"Xa",
  	"Na",
  	"kR",
  	"Rt",
  	"RS",
  	"Ba",
  	" B",
  	"S ",
  	"xa",
  	" z",
  	"az",
  	"iz",
  	"zw"
  ];
  var vectors = {
  	IAST: [
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		0,
  		0.0001632701527318065,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0.0012058250626101475,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0.000008289399515899069,
  		0,
  		0,
  		0,
  		0.0000015092608244186328,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		1,
  		1,
  		0.09268488925642,
  		1,
  		1,
  		1,
  		1,
  		1,
  		0,
  		0,
  		0.9999822196934676,
  		0.9999147920927062,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0
  	],
  	SLP: [
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		1,
  		0.20304869903373754,
  		0.03872525037412225,
  		0.00046707385926192065,
  		0.8628804406137119,
  		1,
  		1,
  		1,
  		0.9797298075483433,
  		1,
  		0.03824515849832306,
  		1,
  		1,
  		1,
  		0.005301309098777453,
  		1,
  		0,
  		1,
  		0.08725570254232674,
  		1,
  		1,
  		1,
  		0.6949144112405189,
  		1,
  		0.8535328924469195,
  		1,
  		0,
  		0.17160101133675884,
  		0,
  		1,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0.000008289399515899069,
  		0,
  		0,
  		0,
  		0.0000015092608244186328,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0.10983628456503347,
  		1,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0.22913719943422914,
  		0,
  		0.0020914569301666076,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		1,
  		1,
  		0.8913810402304431,
  		1,
  		0.7151255641708135,
  		0.000021517870591526262,
  		0.000023868057378809938,
  		0.0003072474245436472,
  		0.0007221954742416948,
  		0.01276595744680851,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0.6493524841064281,
  		1,
  		1,
  		0.0005671857275446014,
  		0.01899056462483151,
  		0.07918787435673913,
  		1,
  		1
  	],
  	HK: [
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		1,
  		1,
  		0,
  		0,
  		0.1778248701440796,
  		0,
  		0,
  		0.7433447732121324,
  		1,
  		1,
  		1,
  		0,
  		0,
  		1,
  		0.9127442974576733,
  		0,
  		0,
  		0,
  		0.5709619927881626,
  		0.8628804406137119,
  		0.44622345979812045,
  		1,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0.000008289399515899069,
  		0,
  		0,
  		0,
  		0.0000015092608244186328,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0.00007421370578718477,
  		0.0013404825737265416,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		0.09268488925642,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		0.9999822196934676,
  		0.9999147920927062,
  		0.0020914569301666076,
  		0,
  		0.0007767744441207885,
  		0.0003014902231027651,
  		1,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0.6387378498100057,
  		0.5559376107763204,
  		1,
  		1,
  		0,
  		0,
  		0,
  		0,
  		1,
  		1,
  		0.8036068447027351,
  		0
  	],
  	ITRANS: [
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		1,
  		0.1778248701440796,
  		0,
  		0,
  		0,
  		1,
  		0.00924581845763532,
  		0,
  		0,
  		1,
  		0,
  		1,
  		0,
  		0,
  		0,
  		0.5643469971401335,
  		0.8628804406137119,
  		0.44622345979812045,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		1,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		1,
  		0,
  		0.000008289399515899069,
  		1,
  		0,
  		0,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		0.3159070598748883,
  		1,
  		0,
  		1,
  		1,
  		0,
  		0,
  		0.021505376344086023,
  		0,
  		0,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		0,
  		0,
  		0,
  		0.0003014902231027651,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		1,
  		0.5559376107763204,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0
  	],
  	VH: [
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		1,
  		1,
  		1,
  		0,
  		0,
  		1,
  		0,
  		0,
  		0.005301309098777453,
  		1,
  		0,
  		0,
  		0,
  		0,
  		1,
  		0,
  		0,
  		0,
  		1,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0.6975849056603773,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		0,
  		1,
  		0,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		0.9998953906505393,
  		1,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		1,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		1,
  		1,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		1,
  		1,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0
  	],
  	WX: [
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0.11894972763569976,
  		1,
  		1,
  		1,
  		0,
  		1,
  		1,
  		1,
  		0.020270192451656743,
  		1,
  		1,
  		1,
  		1,
  		1,
  		0.005301309098777453,
  		1,
  		1,
  		1,
  		0.9127442974576733,
  		1,
  		1,
  		0.4017045454545455,
  		1,
  		1,
  		0.1464671075530804,
  		1,
  		0,
  		1,
  		1,
  		0,
  		1,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0.000008289399515899069,
  		0,
  		0,
  		0,
  		0.0000015092608244186328,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0.1362712065664287,
  		0.8614834673815907,
  		0.054945054945054944,
  		1,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0.0020914569301666076,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		1,
  		0.12128520975105521,
  		0,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		0.5781915898641699,
  		1,
  		0.6571015375247374,
  		0,
  		0.6493524841064281,
  		1,
  		1,
  		1,
  		0,
  		0,
  		0,
  		0
  	],
  	DEV: [
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0
  	],
  	BENGALI: [
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0
  	],
  	GUJARATI: [
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		1,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0,
  		0
  	]
  };
  var schemeVectorsData = {
  	feature_index: feature_index,
  	vectors: vectors
  };

  var AB = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var AC = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var AD = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var AF = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var AG = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var AH = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var AJ = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var AK = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var AL = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var AM = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var AN = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var AP = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var AQ = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var AR = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var AS = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var AT = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var AW = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var AX = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var AY = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Ab = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Ac = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Ad = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Af = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ag = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Ah = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Aj = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Ak = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Al = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Am = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var An = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Ap = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Aq = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Ar = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var As = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var At = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Av = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Aw = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ax = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ay = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Az = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var BA = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var BE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var BI = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var BO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var BU = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ba = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Be = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Bf = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Bi = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Bo = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Bq = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Br = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Bu = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Bv = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var By = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var CA = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var CE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var CI = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var CO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var CU = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ca = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Ce = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Cf = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Ch = [
  	"IAST",
  	"SLP",
  	"HK",
  	"VH",
  	"WX"
  ];
  var Ci = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Cl = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Cm = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Co = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Cq = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Cr = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Cu = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Cv = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Cy = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var DA = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var DD = [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ];
  var DE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var DF = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var DI = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var DO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var DU = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Da = [
  	"IAST"
  ];
  var Db = [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ];
  var Dd = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var De = [
  	"IAST"
  ];
  var Df = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Dg = [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ];
  var Dh = [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ];
  var Di = [
  	"IAST",
  	"WX"
  ];
  var Dj = [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ];
  var Dm = [
  	"IAST",
  	"WX"
  ];
  var Dn = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var Do = [
  	"IAST"
  ];
  var Dr = [
  	"IAST"
  ];
  var Du = [
  	"IAST"
  ];
  var Dv = [
  	"IAST"
  ];
  var Dy = [
  	"IAST"
  ];
  var EB = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ED = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var EG = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var EH = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var EK = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var EM = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var EN = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var EP = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ER = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ES = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ET = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var EW = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var EX = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Eb = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ec = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ed = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ef = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Eg = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Eh = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ej = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ek = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var El = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Em = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var En = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ep = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Eq = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Er = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Es = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Et = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ev = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ew = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ex = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ey = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ez = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var FA = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var FB = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var FC = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var FE = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var FH = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var FI = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var FM = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var FO = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var FR = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var FS = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var FY = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Fa = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Fc = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Fe = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Fi = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Fj = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Fn = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Fo = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Fr = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Fs = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Fu = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var GA = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var GE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var GI = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var GO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var GU = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ga = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Ge = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Gf = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Gg = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Gi = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Gk = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Gm = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Gn = [
  	"IAST",
  	"ITRANS"
  ];
  var Go = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Gp = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Gq = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Gr = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Gt = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Gu = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Gv = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Gy = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var HK = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var HP = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var HR = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var HS = [
  	"IAST",
  	"VH"
  ];
  var Hk = [
  	"IAST",
  	"VH"
  ];
  var Hp = [
  	"IAST",
  	"VH"
  ];
  var Hs = [
  	"IAST",
  	"VH"
  ];
  var Hz = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var IB = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ID = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var IF = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var IG = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var IH = [
  	"IAST",
  	"VH"
  ];
  var IJ = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var IK = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var IM = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var IN = [
  	"IAST",
  	"VH"
  ];
  var IP = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var IQ = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var IR = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var IS = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var IT = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var IW = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var IX = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var IY = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Ib = [
  	"IAST",
  	"VH"
  ];
  var Ic = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Id = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var If = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ig = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Ih = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Ij = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Ik = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Il = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Im = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var In = [
  	"IAST",
  	"VH"
  ];
  var Ip = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Iq = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Ir = [
  	"IAST",
  	"VH"
  ];
  var Is = [
  	"IAST",
  	"VH"
  ];
  var It = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Iv = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Iw = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ix = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Iy = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Iz = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var JA = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var JI = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Ja = [
  	"IAST",
  	"ITRANS"
  ];
  var Jc = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Je = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Ji = [
  	"IAST",
  	"ITRANS"
  ];
  var Jj = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Jo = [
  	"IAST",
  	"ITRANS"
  ];
  var Ju = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var KA = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var KE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var KI = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var KO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ka = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Ke = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Ki = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Kn = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Ko = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Ku = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Ky = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var LA = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var LE = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var LI = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var La = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Le = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Li = [
  	"IAST",
  	"SLP",
  	"HK",
  	"VH"
  ];
  var Lo = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Lp = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Lu = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ly = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var MB = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var MC = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var MD = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var MG = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var MK = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var MP = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var MR = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var MS = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var MX = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Mb = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Mc = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Md = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Mg = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Mh = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Mj = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Mk = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Ml = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Mm = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Mn = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Mp = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Mq = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Mr = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Ms = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Mt = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Mv = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Mw = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Mx = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var My = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Mz = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var NA = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH"
  ];
  var ND = [
  	"IAST",
  	"SLP",
  	"VH"
  ];
  var NE = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var NG = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var NI = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH"
  ];
  var NK = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var NN = [
  	"IAST",
  	"SLP",
  	"VH"
  ];
  var NO = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var NT = [
  	"IAST",
  	"SLP",
  	"VH"
  ];
  var NU = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH"
  ];
  var Na = [
  	"IAST",
  	"SLP",
  	"VH"
  ];
  var Nd = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ne = [
  	"IAST",
  	"SLP",
  	"VH"
  ];
  var Ng = [
  	"IAST",
  	"HK",
  	"VH",
  	"WX"
  ];
  var Ni = [
  	"IAST",
  	"SLP",
  	"VH"
  ];
  var Nk = [
  	"IAST",
  	"HK",
  	"VH",
  	"WX"
  ];
  var Nm = [
  	"IAST",
  	"VH"
  ];
  var Nn = [
  	"IAST",
  	"HK",
  	"VH",
  	"WX"
  ];
  var No = [
  	"IAST",
  	"SLP",
  	"VH"
  ];
  var Nt = [
  	"IAST",
  	"HK",
  	"VH"
  ];
  var Nu = [
  	"IAST",
  	"SLP",
  	"VH"
  ];
  var Nv = [
  	"IAST",
  	"SLP",
  	"VH"
  ];
  var Ny = [
  	"IAST",
  	"SLP",
  	"VH"
  ];
  var OB = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var OD = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var OF = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var OG = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var OH = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var OK = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var OM = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ON = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var OQ = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var OR = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var OS = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var OX = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var OY = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Ob = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Oc = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Od = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Og = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Oh = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Oj = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ok = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ol = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Om = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var On = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Op = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Oq = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Or = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Os = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ot = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ov = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ow = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ox = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Oy = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Oz = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var PA = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var PE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var PI = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var PU = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Pa = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Pe = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Pi = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Po = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Pu = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var Py = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var QA = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var QB = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var QE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var QF = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var QH = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var QI = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var QM = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var QN = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var QO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var QS = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Qa = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Qe = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Qn = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Qo = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Qr = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Qs = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Qu = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Qv = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Qy = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var RA = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var RD = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var RE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var RG = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var RH = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var RI = [
  	"IAST",
  	"VH"
  ];
  var RJ = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var RM = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var RN = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH"
  ];
  var RO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var RP = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var RQ = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var RR = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var RS = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var RT = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH"
  ];
  var RU = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var RW = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Ra = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Rb = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Rc = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Rd = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Re = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Rg = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Rh = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Ri = [
  	"IAST",
  	"VH"
  ];
  var Rj = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Rk = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH"
  ];
  var Rl = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Rm = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Rn = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Ro = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Rp = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH"
  ];
  var Rq = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Rr = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Rs = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Rt = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH"
  ];
  var Ru = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Rv = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Rw = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Ry = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Rz = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var SA = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var SC = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var SE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var SI = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var SN = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var SO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ST = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var SU = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Sa = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Sc = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Se = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Sf = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Sh = [
  	"IAST",
  	"SLP",
  	"HK",
  	"VH",
  	"WX"
  ];
  var Si = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Sk = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Sl = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Sm = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Sn = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var So = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Sp = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Sq = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Sr = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Su = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Sv = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Sy = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var TA = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var TC = [
  	"IAST",
  	"SLP",
  	"HK",
  	"VH",
  	"WX"
  ];
  var TE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var TI = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var TO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var TR = [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ];
  var TS = [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ];
  var TT = [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ];
  var TU = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Ta = [
  	"IAST"
  ];
  var Tc = [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ];
  var Te = [
  	"IAST"
  ];
  var Th = [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ];
  var Ti = [
  	"IAST"
  ];
  var Tk = [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ];
  var Tn = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var To = [
  	"IAST"
  ];
  var Tp = [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ];
  var Tr = [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ];
  var Ts = [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ];
  var Tt = [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ];
  var Tu = [
  	"IAST"
  ];
  var Tv = [
  	"IAST"
  ];
  var Ty = [
  	"IAST"
  ];
  var Tz = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var UB = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var UD = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var UF = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var UH = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var UJ = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var UK = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var UM = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var UN = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH"
  ];
  var UP = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var UQ = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var UR = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var US = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var UT = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var UW = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var UX = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var UY = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Ub = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Uc = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Ud = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Ug = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Uh = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Uj = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Uk = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Ul = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Um = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Un = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Up = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Uq = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Ur = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Us = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Ut = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Uv = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Uw = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Ux = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Uy = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var Uz = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var WA = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var WE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var WI = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var WO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var WU = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Wa = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var We = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Wi = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Wn = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Wo = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Wu = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Wv = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Wy = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var XA = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var XE = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var XI = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var XO = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var XQ = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var XU = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Xa = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Xe = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Xi = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Xm = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Xn = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Xo = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Xq = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Xr = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Xu = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Xv = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Xx = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Xy = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var YA = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var YC = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var YE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var YI = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var YO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Ya = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Yc = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Ye = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Yi = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Yj = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Yo = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var Yu = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var ZB = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ZF = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ZG = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ZK = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ZM = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ZN = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ZP = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ZR = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ZS = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ZW = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ZX = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ZZ = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Zb = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Zc = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Zf = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Zg = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Zh = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Zj = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Zk = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Zl = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Zm = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Zn = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Zp = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Zr = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Zs = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Zv = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Zw = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Zx = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var Zy = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var aA = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var aB = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var aC = [
  	"IAST",
  	"HK"
  ];
  var aD = [
  	"IAST",
  	"WX"
  ];
  var aF = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var aG = [
  	"IAST",
  	"ITRANS"
  ];
  var aH = [
  	"IAST",
  	"VH"
  ];
  var aI = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var aJ = [
  	"IAST",
  	"ITRANS"
  ];
  var aK = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var aL = [
  	"IAST",
  	"SLP",
  	"HK",
  	"VH"
  ];
  var aM = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var aN = [
  	"IAST",
  	"VH"
  ];
  var aP = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var aR = [
  	"IAST",
  	"VH"
  ];
  var aS = [
  	"IAST",
  	"VH"
  ];
  var aT = [
  	"IAST"
  ];
  var aU = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var aW = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var aX = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var aY = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var af = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ai = [
  	"SLP",
  	"WX"
  ];
  var aq = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var au = [
  	"SLP",
  	"WX"
  ];
  var aw = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ax = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var az = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var bA = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var bB = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var bD = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var bE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var bI = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var bO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var bR = [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ];
  var bU = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var bX = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var bd = [
  	"WX"
  ];
  var bf = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var bh = [
  	"SLP",
  	"VH",
  	"WX"
  ];
  var bq = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var bx = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var cA = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var cC = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var cE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var cF = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var cI = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var cJ = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var cO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var cR = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var cU = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var cY = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var ca = [
  	"ITRANS"
  ];
  var cc = [
  	"ITRANS"
  ];
  var cd = [
  	"ITRANS",
  	"WX"
  ];
  var ce = [
  	"ITRANS"
  ];
  var cf = [
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var ch = [
  	"SLP",
  	"VH",
  	"WX"
  ];
  var ci = [
  	"ITRANS"
  ];
  var cm = [
  	"ITRANS"
  ];
  var co = [
  	"ITRANS"
  ];
  var cq = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var cu = [
  	"ITRANS"
  ];
  var cx = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var cy = [
  	"ITRANS"
  ];
  var dA = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var dB = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var dD = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var dE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var dG = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var dI = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var dO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var dR = [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ];
  var dU = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var db = [
  	"WX"
  ];
  var df = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var dh = [
  	"SLP",
  	"VH",
  	"WX"
  ];
  var dj = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS"
  ];
  var dn = [
  	"WX"
  ];
  var eB = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var eD = [
  	"IAST"
  ];
  var eG = [
  	"IAST",
  	"ITRANS"
  ];
  var eH = [
  	"IAST",
  	"VH"
  ];
  var eK = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var eL = [
  	"IAST",
  	"SLP",
  	"HK",
  	"VH"
  ];
  var eM = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var eN = [
  	"IAST",
  	"VH"
  ];
  var eP = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var eQ = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var eR = [
  	"IAST",
  	"VH"
  ];
  var eS = [
  	"IAST",
  	"VH"
  ];
  var eT = [
  	"IAST"
  ];
  var eW = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var eX = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ef = [
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var eq = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ew = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ex = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ez = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var fB = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var fD = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var fG = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var fK = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var fM = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var fN = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var fQ = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var fR = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var fS = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var fT = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var fY = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var fb = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var fc = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var fd = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var fg = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var fh = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var fj = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var fk = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var fl = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var fm = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var fn = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var fp = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var fq = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var fr = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var fs = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var ft = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var fv = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var fw = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var fy = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var fz = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var gA = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var gB = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var gD = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var gE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var gG = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var gI = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var gN = [
  	"IAST",
  	"SLP",
  	"VH"
  ];
  var gO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var gR = [
  	"IAST",
  	"VH",
  	"WX"
  ];
  var gU = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var gX = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var gd = [
  	"WX"
  ];
  var gf = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var gh = [
  	"SLP",
  	"VH",
  	"WX"
  ];
  var gq = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var gx = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var hA = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var hC = [
  	"IAST",
  	"SLP",
  	"HK",
  	"VH",
  	"WX"
  ];
  var hE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var hI = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var hK = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var hN = [
  	"IAST",
  	"SLP",
  	"VH"
  ];
  var hO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var hP = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var hR = [
  	"IAST",
  	"VH",
  	"WX"
  ];
  var hT = [
  	"IAST",
  	"SLP",
  	"HK",
  	"VH",
  	"WX"
  ];
  var hU = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var hc = [
  	"IAST",
  	"SLP",
  	"HK",
  	"VH",
  	"WX"
  ];
  var hd = [
  	"SLP",
  	"VH",
  	"WX"
  ];
  var hf = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var hk = [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ];
  var hp = [
  	"SLP",
  	"WX"
  ];
  var hq = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var hs = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var iB = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var iD = [
  	"IAST",
  	"WX"
  ];
  var iF = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var iG = [
  	"IAST",
  	"ITRANS"
  ];
  var iH = [
  	"IAST",
  	"VH"
  ];
  var iJ = [
  	"IAST",
  	"ITRANS"
  ];
  var iK = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var iL = [
  	"IAST",
  	"SLP",
  	"HK",
  	"VH"
  ];
  var iM = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var iN = [
  	"IAST",
  	"VH"
  ];
  var iP = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var iR = [
  	"IAST",
  	"VH"
  ];
  var iS = [
  	"IAST",
  	"VH"
  ];
  var iT = [
  	"IAST"
  ];
  var iW = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var iX = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var iY = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var ie = [
  	"IAST",
  	"SLP",
  	"HK",
  	"VH",
  	"WX"
  ];
  var ii = [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ];
  var io = [
  	"IAST",
  	"SLP",
  	"HK",
  	"VH",
  	"WX"
  ];
  var iq = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var iu = [
  	"IAST",
  	"SLP",
  	"HK",
  	"VH",
  	"WX"
  ];
  var iw = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ix = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var iz = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var jA = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var jE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var jF = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var jI = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var jJ = [
  	"IAST",
  	"ITRANS"
  ];
  var jO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var jR = [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ];
  var jU = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var jY = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var jf = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var jh = [
  	"SLP",
  	"VH",
  	"WX"
  ];
  var jq = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var kA = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var kC = [
  	"IAST",
  	"HK"
  ];
  var kE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var kI = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var kL = [
  	"IAST",
  	"SLP",
  	"HK",
  	"VH"
  ];
  var kO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var kP = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var kR = [
  	"IAST",
  	"SLP",
  	"VH"
  ];
  var kS = [
  	"IAST",
  	"VH"
  ];
  var kT = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var kU = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var kW = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var kf = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var kh = [
  	"SLP",
  	"VH",
  	"WX"
  ];
  var kq = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var kt = [
  	"WX"
  ];
  var kw = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var kx = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var kz = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var lA = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var lB = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var lE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var lI = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var lO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var lP = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var lR = [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ];
  var lU = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var lf = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var lq = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var mA = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var mB = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var mC = [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ];
  var mD = [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ];
  var mE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var mG = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var mI = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var mK = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var mN = [
  	"IAST",
  	"SLP",
  	"VH"
  ];
  var mO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var mP = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var mR = [
  	"IAST",
  	"VH",
  	"WX"
  ];
  var mS = [
  	"IAST",
  	"SLP",
  	"HK",
  	"VH",
  	"WX"
  ];
  var mU = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var mc = [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ];
  var md = [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ];
  var mf = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var mg = [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ];
  var mh = [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ];
  var mj = [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ];
  var mk = [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ];
  var mq = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ms = [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ];
  var mt = [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ];
  var nA = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var nB = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var nC = [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ];
  var nD = [
  	"IAST",
  	"WX"
  ];
  var nE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var nF = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var nG = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var nI = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var nK = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var nO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var nQ = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var nR = [
  	"IAST",
  	"SLP",
  	"VH"
  ];
  var nS = [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ];
  var nT = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var nU = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var nW = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var nX = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var nc = [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ];
  var nf = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var ng = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var nj = [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ];
  var nk = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var nq = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var nr = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var ns = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var nt = [
  	"WX"
  ];
  var nw = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var nx = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var nz = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var oB = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var oD = [
  	"IAST"
  ];
  var oF = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var oG = [
  	"IAST",
  	"ITRANS"
  ];
  var oH = [
  	"IAST",
  	"VH"
  ];
  var oJ = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var oK = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var oL = [
  	"IAST",
  	"SLP",
  	"HK",
  	"VH"
  ];
  var oM = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var oN = [
  	"IAST",
  	"VH"
  ];
  var oP = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var oQ = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var oR = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var oS = [
  	"IAST",
  	"VH"
  ];
  var oT = [
  	"IAST",
  	"WX"
  ];
  var oW = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var oX = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var oY = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var of = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var oq = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var ow = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ox = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var oz = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var pA = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var pE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var pI = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var pO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var pR = [
  	"IAST",
  	"SLP",
  	"VH"
  ];
  var pS = [
  	"IAST",
  	"VH"
  ];
  var pU = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var pf = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var ph = [
  	"SLP",
  	"VH",
  	"WX"
  ];
  var pq = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var pt = [
  	"WX"
  ];
  var pw = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var pz = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var qA = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var qB = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var qD = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var qE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var qF = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var qG = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var qI = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var qM = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var qN = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var qO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var qQ = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var qR = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var qS = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var qU = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var qW = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var qX = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var qa = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var qb = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var qc = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var qd = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var qe = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var qf = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var qg = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var qh = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var qi = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var qj = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var qk = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ql = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var qm = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var qn = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var qo = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var qp = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var qq = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var qr = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var qs = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var qt = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var qu = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var qv = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var qw = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var qx = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var qy = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var rA = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var rB = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var rC = [
  	"IAST",
  	"HK"
  ];
  var rD = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var rE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var rG = [
  	"IAST",
  	"ITRANS"
  ];
  var rI = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var rJ = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var rK = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var rN = [
  	"IAST",
  	"VH"
  ];
  var rO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var rR = [
  	"IAST",
  	"VH"
  ];
  var rS = [
  	"IAST",
  	"VH"
  ];
  var rT = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var rU = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var rW = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var rX = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var rd = [
  	"WX"
  ];
  var rf = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var rq = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var rr = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var rs = [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ];
  var rt = [
  	"WX"
  ];
  var rw = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var rx = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var rz = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var sA = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var sC = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var sE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var sF = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var sI = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var sK = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var sO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var sP = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var sQ = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var sR = [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ];
  var sT = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var sU = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var sW = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var sc = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var sf = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var sh = [
  	"IAST",
  	"SLP",
  	"HK",
  	"VH",
  	"WX"
  ];
  var sl = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var sq = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var st = [
  	"WX"
  ];
  var sw = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var tA = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var tC = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS"
  ];
  var tE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var tF = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var tI = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var tK = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var tO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var tP = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var tQ = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var tR = [
  	"IAST",
  	"SLP",
  	"VH"
  ];
  var tS = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var tT = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"WX"
  ];
  var tU = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var tc = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS"
  ];
  var tf = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var th = [
  	"SLP",
  	"VH",
  	"WX"
  ];
  var tm = [
  	"WX"
  ];
  var tn = [
  	"WX"
  ];
  var tq = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var tw = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var uA = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var uB = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var uD = [
  	"IAST",
  	"WX"
  ];
  var uF = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var uG = [
  	"IAST",
  	"ITRANS"
  ];
  var uH = [
  	"IAST",
  	"VH"
  ];
  var uJ = [
  	"IAST",
  	"ITRANS"
  ];
  var uK = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var uL = [
  	"IAST",
  	"SLP",
  	"HK",
  	"VH"
  ];
  var uM = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var uN = [
  	"IAST",
  	"VH"
  ];
  var uP = [
  	"IAST",
  	"HK",
  	"ITRANS"
  ];
  var uR = [
  	"IAST",
  	"VH"
  ];
  var uS = [
  	"IAST",
  	"VH"
  ];
  var uT = [
  	"IAST"
  ];
  var uW = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var uX = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var uY = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var ua = [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ];
  var uf = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var uq = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var uu = [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ];
  var uw = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ux = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var uz = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var vA = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var vE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var vI = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var vN = [
  	"IAST",
  	"SLP",
  	"VH"
  ];
  var vO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var vR = [
  	"IAST",
  	"VH",
  	"WX"
  ];
  var vU = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var vf = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var vq = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var wA = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var wC = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var wE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var wF = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var wI = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var wK = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var wO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var wP = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var wQ = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var wS = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var wU = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var wW = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var wa = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var wc = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var we = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var wf = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var wi = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var wk = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var wm = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var wn = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var wo = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var wp = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var wq = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var wr = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ws = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var wt = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var wu = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var wv = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var ww = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var wy = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var wz = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var xA = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var xB = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var xE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var xG = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var xI = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var xO = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var xU = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var xX = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var xa = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var xb = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var xe = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var xg = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var xi = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var xm = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var xn = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var xo = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var xp = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var xq = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var xr = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var xu = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var xv = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var xx = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var xy = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var yA = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var yE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var yI = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var yO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var yR = [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ];
  var yU = [
  	"IAST",
  	"ITRANS",
  	"VH"
  ];
  var yf = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var yq = [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ];
  var zA = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var zE = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var zI = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var zO = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var zP = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var zR = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var zU = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var zW = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var za = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var zc = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var ze = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var zi = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var zk = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var zl = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var zm = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var zn = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var zo = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var zp = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var zr = [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var zu = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var zv = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var zw = [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var zy = [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ];
  var impossibleBigramsData = {
  	" \"": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	" '": [
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	" A": [
  	"IAST",
  	"ITRANS",
  	"VH"
  ],
  	" B": [
  	"IAST",
  	"HK",
  	"ITRANS"
  ],
  	" C": [
  	"IAST",
  	"HK"
  ],
  	" D": [
  	"IAST",
  	"WX"
  ],
  	" E": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	" G": [
  	"IAST",
  	"HK",
  	"ITRANS"
  ],
  	" I": [
  	"IAST",
  	"ITRANS",
  	"VH"
  ],
  	" J": [
  	"IAST",
  	"HK",
  	"ITRANS"
  ],
  	" K": [
  	"IAST",
  	"HK",
  	"ITRANS"
  ],
  	" L": [
  	"IAST",
  	"SLP",
  	"HK",
  	"VH"
  ],
  	" N": [
  	"IAST",
  	"SLP",
  	"VH"
  ],
  	" O": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	" P": [
  	"IAST",
  	"HK",
  	"ITRANS"
  ],
  	" R": [
  	"IAST",
  	"VH"
  ],
  	" S": [
  	"IAST",
  	"VH"
  ],
  	" T": [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ],
  	" U": [
  	"IAST",
  	"ITRANS",
  	"VH"
  ],
  	" X": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	" Z": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	" f": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	" q": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	" w": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	" x": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	" z": [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"\"n": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	"\"s": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	"''": [
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'B": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'D": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'G": [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'J": [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'K": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'M": [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'N": [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'P": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'R": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'S": [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'T": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'Y": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'b": [
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'c": [
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'d": [
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'g": [
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'h": [
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'j": [
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'k": [
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'l": [
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'m": [
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'n": [
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'p": [
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'r": [
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'s": [
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'t": [
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'v": [
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'y": [
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"'z": [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"('": [
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"(.": [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ],
  	"(G": [
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"(R": [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ],
  	"(Z": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	"(f": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"(q": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	")d": [
  	"WX"
  ],
  	")t": [
  	"WX"
  ],
  	")w": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	")x": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	".D": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	".T": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	".a": [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ],
  	".d": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	".h": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	".l": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	".m": [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ],
  	".n": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	".r": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	".t": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	"0d": [
  	"WX"
  ],
  	"0x": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	"1d": [
  	"WX"
  ],
  	"1x": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	"2d": [
  	"WX"
  ],
  	"2x": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	"4R": [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ],
  	"4d": [
  	"WX"
  ],
  	"4f": [
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"4q": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	"4x": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	"6d": [
  	"WX"
  ],
  	"6x": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	"7.": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	"7R": [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ],
  	"7f": [
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"7q": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	"8d": [
  	"WX"
  ],
  	"8x": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	"9d": [
  	"WX"
  ],
  	"9x": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	";.": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	";R": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	";S": [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ],
  	";t": [
  	"WX"
  ],
  	";w": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	";z": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"?d": [
  	"WX"
  ],
  	"?x": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	"A ": [
  	"IAST",
  	"ITRANS",
  	"VH"
  ],
  	"A(": [
  	"IAST",
  	"ITRANS",
  	"VH"
  ],
  	"A)": [
  	"IAST",
  	"ITRANS",
  	"VH"
  ],
  	"A.": [
  	"IAST",
  	"ITRANS",
  	"VH"
  ],
  	"A;": [
  	"IAST",
  	"ITRANS",
  	"VH"
  ],
  	AB: AB,
  	AC: AC,
  	AD: AD,
  	AF: AF,
  	AG: AG,
  	AH: AH,
  	AJ: AJ,
  	AK: AK,
  	AL: AL,
  	AM: AM,
  	AN: AN,
  	AP: AP,
  	AQ: AQ,
  	AR: AR,
  	AS: AS,
  	AT: AT,
  	AW: AW,
  	AX: AX,
  	AY: AY,
  	Ab: Ab,
  	Ac: Ac,
  	Ad: Ad,
  	Af: Af,
  	Ag: Ag,
  	Ah: Ah,
  	Aj: Aj,
  	Ak: Ak,
  	Al: Al,
  	Am: Am,
  	An: An,
  	Ap: Ap,
  	Aq: Aq,
  	Ar: Ar,
  	As: As,
  	At: At,
  	Av: Av,
  	Aw: Aw,
  	Ax: Ax,
  	Ay: Ay,
  	Az: Az,
  	"B.": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	BA: BA,
  	BE: BE,
  	BI: BI,
  	BO: BO,
  	BU: BU,
  	Ba: Ba,
  	Be: Be,
  	Bf: Bf,
  	Bi: Bi,
  	Bo: Bo,
  	Bq: Bq,
  	Br: Br,
  	Bu: Bu,
  	Bv: Bv,
  	By: By,
  	"C.": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	CA: CA,
  	CE: CE,
  	CI: CI,
  	CO: CO,
  	CU: CU,
  	Ca: Ca,
  	Ce: Ce,
  	Cf: Cf,
  	Ch: Ch,
  	Ci: Ci,
  	Cl: Cl,
  	Cm: Cm,
  	Co: Co,
  	Cq: Cq,
  	Cr: Cr,
  	Cu: Cu,
  	Cv: Cv,
  	Cy: Cy,
  	"D ": [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ],
  	"D.": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	DA: DA,
  	DD: DD,
  	DE: DE,
  	DF: DF,
  	DI: DI,
  	DO: DO,
  	DU: DU,
  	Da: Da,
  	Db: Db,
  	Dd: Dd,
  	De: De,
  	Df: Df,
  	Dg: Dg,
  	Dh: Dh,
  	Di: Di,
  	Dj: Dj,
  	Dm: Dm,
  	Dn: Dn,
  	Do: Do,
  	Dr: Dr,
  	Du: Du,
  	Dv: Dv,
  	Dy: Dy,
  	"E ": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	"E;": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	EB: EB,
  	ED: ED,
  	EG: EG,
  	EH: EH,
  	EK: EK,
  	EM: EM,
  	EN: EN,
  	EP: EP,
  	ER: ER,
  	ES: ES,
  	ET: ET,
  	EW: EW,
  	EX: EX,
  	Eb: Eb,
  	Ec: Ec,
  	Ed: Ed,
  	Ef: Ef,
  	Eg: Eg,
  	Eh: Eh,
  	Ej: Ej,
  	Ek: Ek,
  	El: El,
  	Em: Em,
  	En: En,
  	Ep: Ep,
  	Eq: Eq,
  	Er: Er,
  	Es: Es,
  	Et: Et,
  	Ev: Ev,
  	Ew: Ew,
  	Ex: Ex,
  	Ey: Ey,
  	Ez: Ez,
  	"F ": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	"F;": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	FA: FA,
  	FB: FB,
  	FC: FC,
  	FE: FE,
  	FH: FH,
  	FI: FI,
  	FM: FM,
  	FO: FO,
  	FR: FR,
  	FS: FS,
  	FY: FY,
  	Fa: Fa,
  	Fc: Fc,
  	Fe: Fe,
  	Fi: Fi,
  	Fj: Fj,
  	Fn: Fn,
  	Fo: Fo,
  	Fr: Fr,
  	Fs: Fs,
  	Fu: Fu,
  	"G ": [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"G.": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	"G;": [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	GA: GA,
  	GE: GE,
  	GI: GI,
  	GO: GO,
  	GU: GU,
  	Ga: Ga,
  	Ge: Ge,
  	Gf: Gf,
  	Gg: Gg,
  	Gi: Gi,
  	Gk: Gk,
  	Gm: Gm,
  	Gn: Gn,
  	Go: Go,
  	Gp: Gp,
  	Gq: Gq,
  	Gr: Gr,
  	Gt: Gt,
  	Gu: Gu,
  	Gv: Gv,
  	Gy: Gy,
  	"H ": [
  	"IAST",
  	"VH"
  ],
  	"H;": [
  	"IAST",
  	"VH"
  ],
  	HK: HK,
  	HP: HP,
  	HR: HR,
  	HS: HS,
  	Hk: Hk,
  	Hp: Hp,
  	Hs: Hs,
  	Hz: Hz,
  	"I ": [
  	"IAST",
  	"ITRANS",
  	"VH"
  ],
  	"I.": [
  	"IAST",
  	"SLP",
  	"HK",
  	"VH",
  	"WX"
  ],
  	"I;": [
  	"IAST",
  	"ITRANS",
  	"VH"
  ],
  	IB: IB,
  	ID: ID,
  	IF: IF,
  	IG: IG,
  	IH: IH,
  	IJ: IJ,
  	IK: IK,
  	IM: IM,
  	IN: IN,
  	IP: IP,
  	IQ: IQ,
  	IR: IR,
  	IS: IS,
  	IT: IT,
  	IW: IW,
  	IX: IX,
  	IY: IY,
  	Ib: Ib,
  	Ic: Ic,
  	Id: Id,
  	If: If,
  	Ig: Ig,
  	Ih: Ih,
  	Ij: Ij,
  	Ik: Ik,
  	Il: Il,
  	Im: Im,
  	In: In,
  	Ip: Ip,
  	Iq: Iq,
  	Ir: Ir,
  	Is: Is,
  	It: It,
  	Iv: Iv,
  	Iw: Iw,
  	Ix: Ix,
  	Iy: Iy,
  	Iz: Iz,
  	"I~": [
  	"IAST",
  	"SLP",
  	"HK",
  	"VH",
  	"WX"
  ],
  	"J ": [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"J;": [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	JA: JA,
  	JI: JI,
  	Ja: Ja,
  	Jc: Jc,
  	Je: Je,
  	Ji: Ji,
  	Jj: Jj,
  	Jo: Jo,
  	Ju: Ju,
  	KA: KA,
  	KE: KE,
  	KI: KI,
  	KO: KO,
  	Ka: Ka,
  	Ke: Ke,
  	Ki: Ki,
  	Kn: Kn,
  	Ko: Ko,
  	Ku: Ku,
  	Ky: Ky,
  	LA: LA,
  	LE: LE,
  	LI: LI,
  	La: La,
  	Le: Le,
  	Li: Li,
  	Lo: Lo,
  	Lp: Lp,
  	Lu: Lu,
  	Ly: Ly,
  	"M ": [
  	"IAST",
  	"ITRANS",
  	"VH"
  ],
  	"M(": [
  	"IAST",
  	"ITRANS",
  	"VH"
  ],
  	"M)": [
  	"IAST",
  	"ITRANS",
  	"VH"
  ],
  	"M,": [
  	"IAST",
  	"ITRANS",
  	"VH"
  ],
  	"M.": [
  	"IAST",
  	"ITRANS",
  	"VH"
  ],
  	"M;": [
  	"IAST",
  	"ITRANS",
  	"VH"
  ],
  	MB: MB,
  	MC: MC,
  	MD: MD,
  	MG: MG,
  	MK: MK,
  	MP: MP,
  	MR: MR,
  	MS: MS,
  	MX: MX,
  	Mb: Mb,
  	Mc: Mc,
  	Md: Md,
  	Mg: Mg,
  	Mh: Mh,
  	Mj: Mj,
  	Mk: Mk,
  	Ml: Ml,
  	Mm: Mm,
  	Mn: Mn,
  	Mp: Mp,
  	Mq: Mq,
  	Mr: Mr,
  	Ms: Ms,
  	Mt: Mt,
  	Mv: Mv,
  	Mw: Mw,
  	Mx: Mx,
  	My: My,
  	Mz: Mz,
  	"N ": [
  	"IAST",
  	"VH"
  ],
  	"N;": [
  	"IAST",
  	"HK",
  	"VH",
  	"WX"
  ],
  	NA: NA,
  	ND: ND,
  	NE: NE,
  	NG: NG,
  	NI: NI,
  	NK: NK,
  	NN: NN,
  	NO: NO,
  	NT: NT,
  	NU: NU,
  	Na: Na,
  	Nd: Nd,
  	Ne: Ne,
  	Ng: Ng,
  	Ni: Ni,
  	Nk: Nk,
  	Nm: Nm,
  	Nn: Nn,
  	No: No,
  	Nt: Nt,
  	Nu: Nu,
  	Nv: Nv,
  	Ny: Ny,
  	"O ": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	"O;": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	OB: OB,
  	OD: OD,
  	OF: OF,
  	OG: OG,
  	OH: OH,
  	OK: OK,
  	OM: OM,
  	ON: ON,
  	OQ: OQ,
  	OR: OR,
  	OS: OS,
  	OX: OX,
  	OY: OY,
  	Ob: Ob,
  	Oc: Oc,
  	Od: Od,
  	Og: Og,
  	Oh: Oh,
  	Oj: Oj,
  	Ok: Ok,
  	Ol: Ol,
  	Om: Om,
  	On: On,
  	Op: Op,
  	Oq: Oq,
  	Or: Or,
  	Os: Os,
  	Ot: Ot,
  	Ov: Ov,
  	Ow: Ow,
  	Ox: Ox,
  	Oy: Oy,
  	Oz: Oz,
  	PA: PA,
  	PE: PE,
  	PI: PI,
  	PU: PU,
  	Pa: Pa,
  	Pe: Pe,
  	Pi: Pi,
  	Po: Po,
  	Pu: Pu,
  	Py: Py,
  	QA: QA,
  	QB: QB,
  	QE: QE,
  	QF: QF,
  	QH: QH,
  	QI: QI,
  	QM: QM,
  	QN: QN,
  	QO: QO,
  	QS: QS,
  	Qa: Qa,
  	Qe: Qe,
  	Qn: Qn,
  	Qo: Qo,
  	Qr: Qr,
  	Qs: Qs,
  	Qu: Qu,
  	Qv: Qv,
  	Qy: Qy,
  	"R ": [
  	"IAST",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"R)": [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"R.": [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"R;": [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	RA: RA,
  	RD: RD,
  	RE: RE,
  	RG: RG,
  	RH: RH,
  	RI: RI,
  	RJ: RJ,
  	RM: RM,
  	RN: RN,
  	RO: RO,
  	RP: RP,
  	RQ: RQ,
  	RR: RR,
  	RS: RS,
  	RT: RT,
  	RU: RU,
  	RW: RW,
  	Ra: Ra,
  	Rb: Rb,
  	Rc: Rc,
  	Rd: Rd,
  	Re: Re,
  	Rg: Rg,
  	Rh: Rh,
  	Ri: Ri,
  	Rj: Rj,
  	Rk: Rk,
  	Rl: Rl,
  	Rm: Rm,
  	Rn: Rn,
  	Ro: Ro,
  	Rp: Rp,
  	Rq: Rq,
  	Rr: Rr,
  	Rs: Rs,
  	Rt: Rt,
  	Ru: Ru,
  	Rv: Rv,
  	Rw: Rw,
  	Ry: Ry,
  	Rz: Rz,
  	"S ": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	"S;": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	SA: SA,
  	SC: SC,
  	SE: SE,
  	SI: SI,
  	SN: SN,
  	SO: SO,
  	ST: ST,
  	SU: SU,
  	Sa: Sa,
  	Sc: Sc,
  	Se: Se,
  	Sf: Sf,
  	Sh: Sh,
  	Si: Si,
  	Sk: Sk,
  	Sl: Sl,
  	Sm: Sm,
  	Sn: Sn,
  	So: So,
  	Sp: Sp,
  	Sq: Sq,
  	Sr: Sr,
  	Su: Su,
  	Sv: Sv,
  	Sy: Sy,
  	"T ": [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ],
  	"T;": [
  	"IAST",
  	"SLP",
  	"VH",
  	"WX"
  ],
  	TA: TA,
  	TC: TC,
  	TE: TE,
  	TI: TI,
  	TO: TO,
  	TR: TR,
  	TS: TS,
  	TT: TT,
  	TU: TU,
  	Ta: Ta,
  	Tc: Tc,
  	Te: Te,
  	Th: Th,
  	Ti: Ti,
  	Tk: Tk,
  	Tn: Tn,
  	To: To,
  	Tp: Tp,
  	Tr: Tr,
  	Ts: Ts,
  	Tt: Tt,
  	Tu: Tu,
  	Tv: Tv,
  	Ty: Ty,
  	Tz: Tz,
  	"U ": [
  	"IAST",
  	"ITRANS",
  	"VH"
  ],
  	"U;": [
  	"IAST",
  	"ITRANS",
  	"VH"
  ],
  	UB: UB,
  	UD: UD,
  	UF: UF,
  	UH: UH,
  	UJ: UJ,
  	UK: UK,
  	UM: UM,
  	UN: UN,
  	UP: UP,
  	UQ: UQ,
  	UR: UR,
  	US: US,
  	UT: UT,
  	UW: UW,
  	UX: UX,
  	UY: UY,
  	Ub: Ub,
  	Uc: Uc,
  	Ud: Ud,
  	Ug: Ug,
  	Uh: Uh,
  	Uj: Uj,
  	Uk: Uk,
  	Ul: Ul,
  	Um: Um,
  	Un: Un,
  	Up: Up,
  	Uq: Uq,
  	Ur: Ur,
  	Us: Us,
  	Ut: Ut,
  	Uv: Uv,
  	Uw: Uw,
  	Ux: Ux,
  	Uy: Uy,
  	Uz: Uz,
  	WA: WA,
  	WE: WE,
  	WI: WI,
  	WO: WO,
  	WU: WU,
  	Wa: Wa,
  	We: We,
  	Wi: Wi,
  	Wn: Wn,
  	Wo: Wo,
  	Wu: Wu,
  	Wv: Wv,
  	Wy: Wy,
  	XA: XA,
  	XE: XE,
  	XI: XI,
  	XO: XO,
  	XQ: XQ,
  	XU: XU,
  	Xa: Xa,
  	Xe: Xe,
  	Xi: Xi,
  	Xm: Xm,
  	Xn: Xn,
  	Xo: Xo,
  	Xq: Xq,
  	Xr: Xr,
  	Xu: Xu,
  	Xv: Xv,
  	Xx: Xx,
  	Xy: Xy,
  	"Y ": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"Y;": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	YA: YA,
  	YC: YC,
  	YE: YE,
  	YI: YI,
  	YO: YO,
  	Ya: Ya,
  	Yc: Yc,
  	Ye: Ye,
  	Yi: Yi,
  	Yj: Yj,
  	Yo: Yo,
  	Yu: Yu,
  	ZB: ZB,
  	ZF: ZF,
  	ZG: ZG,
  	ZK: ZK,
  	ZM: ZM,
  	ZN: ZN,
  	ZP: ZP,
  	ZR: ZR,
  	ZS: ZS,
  	ZW: ZW,
  	ZX: ZX,
  	ZZ: ZZ,
  	Zb: Zb,
  	Zc: Zc,
  	Zf: Zf,
  	Zg: Zg,
  	Zh: Zh,
  	Zj: Zj,
  	Zk: Zk,
  	Zl: Zl,
  	Zm: Zm,
  	Zn: Zn,
  	Zp: Zp,
  	Zr: Zr,
  	Zs: Zs,
  	Zv: Zv,
  	Zw: Zw,
  	Zx: Zx,
  	Zy: Zy,
  	"a\"": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	"a.": [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ],
  	aA: aA,
  	aB: aB,
  	aC: aC,
  	aD: aD,
  	aF: aF,
  	aG: aG,
  	aH: aH,
  	aI: aI,
  	aJ: aJ,
  	aK: aK,
  	aL: aL,
  	aM: aM,
  	aN: aN,
  	aP: aP,
  	aR: aR,
  	aS: aS,
  	aT: aT,
  	aU: aU,
  	aW: aW,
  	aX: aX,
  	aY: aY,
  	af: af,
  	ai: ai,
  	aq: aq,
  	au: au,
  	aw: aw,
  	ax: ax,
  	az: az,
  	"a~": [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ],
  	"b.": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	bA: bA,
  	bB: bB,
  	bD: bD,
  	bE: bE,
  	bI: bI,
  	bO: bO,
  	bR: bR,
  	bU: bU,
  	bX: bX,
  	bd: bd,
  	bf: bf,
  	bh: bh,
  	bq: bq,
  	bx: bx,
  	"c ": [
  	"ITRANS"
  ],
  	"c)": [
  	"ITRANS"
  ],
  	"c,": [
  	"ITRANS"
  ],
  	"c.": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	"c;": [
  	"ITRANS"
  ],
  	cA: cA,
  	cC: cC,
  	cE: cE,
  	cF: cF,
  	cI: cI,
  	cJ: cJ,
  	cO: cO,
  	cR: cR,
  	cU: cU,
  	cY: cY,
  	ca: ca,
  	cc: cc,
  	cd: cd,
  	ce: ce,
  	cf: cf,
  	ch: ch,
  	ci: ci,
  	cm: cm,
  	co: co,
  	cq: cq,
  	cu: cu,
  	cx: cx,
  	cy: cy,
  	"c~": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	"d)": [
  	"WX"
  ],
  	"d.": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	"d;": [
  	"WX"
  ],
  	dA: dA,
  	dB: dB,
  	dD: dD,
  	dE: dE,
  	dG: dG,
  	dI: dI,
  	dO: dO,
  	dR: dR,
  	dU: dU,
  	db: db,
  	df: df,
  	dh: dh,
  	dj: dj,
  	dn: dn,
  	"e\"": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	"e.": [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ],
  	eB: eB,
  	eD: eD,
  	eG: eG,
  	eH: eH,
  	eK: eK,
  	eL: eL,
  	eM: eM,
  	eN: eN,
  	eP: eP,
  	eQ: eQ,
  	eR: eR,
  	eS: eS,
  	eT: eT,
  	eW: eW,
  	eX: eX,
  	ef: ef,
  	eq: eq,
  	ew: ew,
  	ex: ex,
  	ez: ez,
  	"e~": [
  	"IAST",
  	"SLP",
  	"HK",
  	"VH",
  	"WX"
  ],
  	"f ": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	"f)": [
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"f.": [
  	"HK",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"f;": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	fB: fB,
  	fD: fD,
  	fG: fG,
  	fK: fK,
  	fM: fM,
  	fN: fN,
  	fQ: fQ,
  	fR: fR,
  	fS: fS,
  	fT: fT,
  	fY: fY,
  	fb: fb,
  	fc: fc,
  	fd: fd,
  	fg: fg,
  	fh: fh,
  	fj: fj,
  	fk: fk,
  	fl: fl,
  	fm: fm,
  	fn: fn,
  	fp: fp,
  	fq: fq,
  	fr: fr,
  	fs: fs,
  	ft: ft,
  	fv: fv,
  	fw: fw,
  	fy: fy,
  	fz: fz,
  	"g.": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	gA: gA,
  	gB: gB,
  	gD: gD,
  	gE: gE,
  	gG: gG,
  	gI: gI,
  	gN: gN,
  	gO: gO,
  	gR: gR,
  	gU: gU,
  	gX: gX,
  	gd: gd,
  	gf: gf,
  	gh: gh,
  	gq: gq,
  	gx: gx,
  	"h ": [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ],
  	"h\"": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	"h)": [
  	"IAST",
  	"SLP",
  	"HK",
  	"VH",
  	"WX"
  ],
  	"h,": [
  	"IAST",
  	"SLP",
  	"HK",
  	"VH",
  	"WX"
  ],
  	"h.": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	"h;": [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ],
  	hA: hA,
  	hC: hC,
  	hE: hE,
  	hI: hI,
  	hK: hK,
  	hN: hN,
  	hO: hO,
  	hP: hP,
  	hR: hR,
  	hT: hT,
  	hU: hU,
  	hc: hc,
  	hd: hd,
  	hf: hf,
  	hk: hk,
  	hp: hp,
  	hq: hq,
  	hs: hs,
  	"h~": [
  	"IAST",
  	"SLP",
  	"HK",
  	"VH",
  	"WX"
  ],
  	"i\"": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	"i.": [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ],
  	iB: iB,
  	iD: iD,
  	iF: iF,
  	iG: iG,
  	iH: iH,
  	iJ: iJ,
  	iK: iK,
  	iL: iL,
  	iM: iM,
  	iN: iN,
  	iP: iP,
  	iR: iR,
  	iS: iS,
  	iT: iT,
  	iW: iW,
  	iX: iX,
  	iY: iY,
  	ie: ie,
  	"if": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	ii: ii,
  	io: io,
  	iq: iq,
  	iu: iu,
  	iw: iw,
  	ix: ix,
  	iz: iz,
  	"i~": [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ],
  	"j.": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	jA: jA,
  	jE: jE,
  	jF: jF,
  	jI: jI,
  	jJ: jJ,
  	jO: jO,
  	jR: jR,
  	jU: jU,
  	jY: jY,
  	jf: jf,
  	jh: jh,
  	jq: jq,
  	"j~": [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ],
  	"k\"": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	"k.": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	kA: kA,
  	kC: kC,
  	kE: kE,
  	kI: kI,
  	kL: kL,
  	kO: kO,
  	kP: kP,
  	kR: kR,
  	kS: kS,
  	kT: kT,
  	kU: kU,
  	kW: kW,
  	kf: kf,
  	kh: kh,
  	kq: kq,
  	kt: kt,
  	kw: kw,
  	kx: kx,
  	kz: kz,
  	lA: lA,
  	lB: lB,
  	lE: lE,
  	lI: lI,
  	lO: lO,
  	lP: lP,
  	lR: lR,
  	lU: lU,
  	lf: lf,
  	lq: lq,
  	"m\"": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	"m(": [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ],
  	"m)": [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ],
  	"m,": [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ],
  	"m.": [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ],
  	mA: mA,
  	mB: mB,
  	mC: mC,
  	mD: mD,
  	mE: mE,
  	mG: mG,
  	mI: mI,
  	mK: mK,
  	mN: mN,
  	mO: mO,
  	mP: mP,
  	mR: mR,
  	mS: mS,
  	mU: mU,
  	mc: mc,
  	md: md,
  	mf: mf,
  	mg: mg,
  	mh: mh,
  	mj: mj,
  	mk: mk,
  	mq: mq,
  	ms: ms,
  	mt: mt,
  	"n\"": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	"n.": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	nA: nA,
  	nB: nB,
  	nC: nC,
  	nD: nD,
  	nE: nE,
  	nF: nF,
  	nG: nG,
  	nI: nI,
  	nK: nK,
  	nO: nO,
  	nQ: nQ,
  	nR: nR,
  	nS: nS,
  	nT: nT,
  	nU: nU,
  	nW: nW,
  	nX: nX,
  	nc: nc,
  	nf: nf,
  	ng: ng,
  	nj: nj,
  	nk: nk,
  	nq: nq,
  	nr: nr,
  	ns: ns,
  	nt: nt,
  	nw: nw,
  	nx: nx,
  	nz: nz,
  	"n~": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	"o\"": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	"o.": [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ],
  	oB: oB,
  	oD: oD,
  	oF: oF,
  	oG: oG,
  	oH: oH,
  	oJ: oJ,
  	oK: oK,
  	oL: oL,
  	oM: oM,
  	oN: oN,
  	oP: oP,
  	oQ: oQ,
  	oR: oR,
  	oS: oS,
  	oT: oT,
  	oW: oW,
  	oX: oX,
  	oY: oY,
  	of: of,
  	oq: oq,
  	ow: ow,
  	ox: ox,
  	oz: oz,
  	"o~": [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ],
  	"p\"": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	"p.": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	pA: pA,
  	pE: pE,
  	pI: pI,
  	pO: pO,
  	pR: pR,
  	pS: pS,
  	pU: pU,
  	pf: pf,
  	ph: ph,
  	pq: pq,
  	pt: pt,
  	pw: pw,
  	pz: pz,
  	"q ": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	"q)": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	"q.": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	"q;": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	qA: qA,
  	qB: qB,
  	qD: qD,
  	qE: qE,
  	qF: qF,
  	qG: qG,
  	qI: qI,
  	qM: qM,
  	qN: qN,
  	qO: qO,
  	qQ: qQ,
  	qR: qR,
  	qS: qS,
  	qU: qU,
  	qW: qW,
  	qX: qX,
  	qa: qa,
  	qb: qb,
  	qc: qc,
  	qd: qd,
  	qe: qe,
  	qf: qf,
  	qg: qg,
  	qh: qh,
  	qi: qi,
  	qj: qj,
  	qk: qk,
  	ql: ql,
  	qm: qm,
  	qn: qn,
  	qo: qo,
  	qp: qp,
  	qq: qq,
  	qr: qr,
  	qs: qs,
  	qt: qt,
  	qu: qu,
  	qv: qv,
  	qw: qw,
  	qx: qx,
  	qy: qy,
  	"r\"": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	"r)": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	"r.": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	rA: rA,
  	rB: rB,
  	rC: rC,
  	rD: rD,
  	rE: rE,
  	rG: rG,
  	rI: rI,
  	rJ: rJ,
  	rK: rK,
  	rN: rN,
  	rO: rO,
  	rR: rR,
  	rS: rS,
  	rT: rT,
  	rU: rU,
  	rW: rW,
  	rX: rX,
  	rd: rd,
  	rf: rf,
  	rq: rq,
  	rr: rr,
  	rs: rs,
  	rt: rt,
  	rw: rw,
  	rx: rx,
  	rz: rz,
  	"r~": [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ],
  	"s.": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	sA: sA,
  	sC: sC,
  	sE: sE,
  	sF: sF,
  	sI: sI,
  	sK: sK,
  	sO: sO,
  	sP: sP,
  	sQ: sQ,
  	sR: sR,
  	sT: sT,
  	sU: sU,
  	sW: sW,
  	sc: sc,
  	sf: sf,
  	sh: sh,
  	sl: sl,
  	sq: sq,
  	st: st,
  	sw: sw,
  	"t\"": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	"t.": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	tA: tA,
  	tC: tC,
  	tE: tE,
  	tF: tF,
  	tI: tI,
  	tK: tK,
  	tO: tO,
  	tP: tP,
  	tQ: tQ,
  	tR: tR,
  	tS: tS,
  	tT: tT,
  	tU: tU,
  	tc: tc,
  	tf: tf,
  	th: th,
  	tm: tm,
  	tn: tn,
  	tq: tq,
  	tw: tw,
  	"u\"": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	"u.": [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ],
  	uA: uA,
  	uB: uB,
  	uD: uD,
  	uF: uF,
  	uG: uG,
  	uH: uH,
  	uJ: uJ,
  	uK: uK,
  	uL: uL,
  	uM: uM,
  	uN: uN,
  	uP: uP,
  	uR: uR,
  	uS: uS,
  	uT: uT,
  	uW: uW,
  	uX: uX,
  	uY: uY,
  	ua: ua,
  	uf: uf,
  	uq: uq,
  	uu: uu,
  	uw: uw,
  	ux: ux,
  	uz: uz,
  	"u~": [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ],
  	vA: vA,
  	vE: vE,
  	vI: vI,
  	vN: vN,
  	vO: vO,
  	vR: vR,
  	vU: vU,
  	vf: vf,
  	vq: vq,
  	"w ": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	"w;": [
  	"IAST",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	wA: wA,
  	wC: wC,
  	wE: wE,
  	wF: wF,
  	wI: wI,
  	wK: wK,
  	wO: wO,
  	wP: wP,
  	wQ: wQ,
  	wS: wS,
  	wU: wU,
  	wW: wW,
  	wa: wa,
  	wc: wc,
  	we: we,
  	wf: wf,
  	wi: wi,
  	wk: wk,
  	wm: wm,
  	wn: wn,
  	wo: wo,
  	wp: wp,
  	wq: wq,
  	wr: wr,
  	ws: ws,
  	wt: wt,
  	wu: wu,
  	wv: wv,
  	ww: ww,
  	wy: wy,
  	wz: wz,
  	"x ": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	"x)": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	"x;": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	xA: xA,
  	xB: xB,
  	xE: xE,
  	xG: xG,
  	xI: xI,
  	xO: xO,
  	xU: xU,
  	xX: xX,
  	xa: xa,
  	xb: xb,
  	xe: xe,
  	xg: xg,
  	xi: xi,
  	xm: xm,
  	xn: xn,
  	xo: xo,
  	xp: xp,
  	xq: xq,
  	xr: xr,
  	xu: xu,
  	xv: xv,
  	xx: xx,
  	xy: xy,
  	"y.": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"WX"
  ],
  	yA: yA,
  	yE: yE,
  	yI: yI,
  	yO: yO,
  	yR: yR,
  	yU: yU,
  	yf: yf,
  	yq: yq,
  	"z ": [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	"z;": [
  	"IAST",
  	"SLP",
  	"ITRANS",
  	"VH",
  	"WX"
  ],
  	zA: zA,
  	zE: zE,
  	zI: zI,
  	zO: zO,
  	zP: zP,
  	zR: zR,
  	zU: zU,
  	zW: zW,
  	za: za,
  	zc: zc,
  	ze: ze,
  	zi: zi,
  	zk: zk,
  	zl: zl,
  	zm: zm,
  	zn: zn,
  	zo: zo,
  	zp: zp,
  	zr: zr,
  	zu: zu,
  	zv: zv,
  	zw: zw,
  	zy: zy,
  	"|t": [
  	"WX"
  ],
  	"|w": [
  	"IAST",
  	"SLP",
  	"HK",
  	"ITRANS",
  	"VH"
  ],
  	"~N": [
  	"IAST",
  	"SLP",
  	"HK",
  	"VH",
  	"WX"
  ],
  	"~n": [
  	"IAST",
  	"SLP",
  	"HK",
  	"WX"
  ]
  };

  // Scheme detection for Sanskrit text processing
  // Hybrid heuristic + statistical approach using MBH corpus vectors


  const auto_detect_synonyms = [
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

  class SchemeDetector {
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

  // Regex rules for avoiding virāma in Indic scripts

  // Set up regex components
  const vowels = SLP_vowels.join('');
  const unvoicedConsonants = SLP_unvoiced_consonants.join('');
  const unvoicedConsonantsSubset = ['k','K','t','T','p','P','s'].join('');
  const voicedConsonants = SLP_voiced_consonants.join('');

  /*
  The following regexes aim at avoiding virāma and space,
  especially in Indic scripts.

  All are replaced by '$1$2', thereby simply removing the space.

  This list is by no means fixed or exhaustive and is meant to be customized.
  */

  const replacements = [
    // these spaces generally disliked among modern scholars, never (?) seen in mss
    [`(y) ([${vowels}])`, '$1$2'],
    [`(v) ([${vowels}])`, '$1$2'],
    [`(r) ([${vowels}])`, '$1$2'],
    [`(r) ([${voicedConsonants}])`, '$1$2'],
    // these spaces may be used for clarity among modern scholars, rare in mss
    [`([kwp]) ([${unvoicedConsonants}])`, '$1$2'],
    ['(c) (c)', '$1$2'],
    [`([gqb]) ([${voicedConsonants}])`, '$1$2'],
    ['(j) (j)', '$1$2'],
    ['(Y) ([cCjJ])', '$1$2'],
    [`(d) ([${voicedConsonants}])`, '$1$2'],
    ['(l) (l)', '$1$2'],
    ['(S) ([cCS])', '$1$2'],
    ['(s) ([tTs])', '$1$2'],
    // these spaces are more common and very much depend on the scribe or editor
    [`([gqb]) ([${vowels}])`, '$1$2'],
    [`(d) ([${vowels}])`, '$1$2'],
    [`(t) ([${unvoicedConsonantsSubset}])`, '$1$2'], // because e.g. t + ś >> c ch
    [`(n) ([${vowels}])`, '$1$2'],
    [`(n) ([${voicedConsonants}])`, '$1$2'],
    [`(m) ([${vowels}])`, '$1$2'],
  ];

  // the following is just space for notes to cut-and-paste above or vice versa
  const replacementsMore = [
    // this space is sometimes removed by some modern scholars
    ["([Aeo]) (')", '$1$2'],
  ];

  // Function to apply virāma avoidance rules
  function avoidVirama(text, useMoreReplacements = false) {
    let result = text;
    
    const rulesToApply = useMoreReplacements ? 
      [...replacements, ...replacementsMore] : 
      replacements;
    
    for (const [pattern, replacement] of rulesToApply) {
      const regex = new RegExp(pattern, 'g');
      result = result.replace(regex, replacement);
    }
    
    return result;
  }

  // Configuration settings for skrutable-js
  const config = {
    "default_scheme_in": "IAST",
    "default_scheme_out": "IAST",
    "avoid_virama_indic_scripts": true,
    "avoid_virama_non_indic_scripts": false,
    "scansion_syllable_separator": " ",
    "additional_pAda_separators": ["\t", ";", ",", " / ", " | ", " । "],
    "default_resplit_option": "resplit_max",
    "default_resplit_keep_midpoint": false,
    "meter_scores": {
      "max score": 9,
      "anuṣṭup, full, both halves perfect": 9,
      "anuṣṭup, full, one half perfect, one imperfect": 7,
      "anuṣṭup, half, single half perfect": 9,
      "samavṛtta, perfect": 9,
      "samavṛtta, imperfect (3)": 6,
      "samavṛtta, imperfect (2)": 5,
      "samavṛtta, quarter, perfect": 8,
      "ardhasamavṛtta, perfect": 8,
      "ardhasamavṛtta, perfect, unknown": 6,
      "viṣamavṛtta, perfect": 9,
      "upajātiḥ, perfect": 7,
      "upajātiḥ, imperfect": 6,
      "upajātiḥ, non-triṣṭubh, perfect": 5,
      "upajātiḥ, triṣṭubh-jagatī-saṃkara, perfect": 4,
      "upajātiḥ, non-triṣṭubh, imperfect": 3,
      "jāti, perfect": 8,
      "jāti, imperfect": 3,
      "none found": 1
    },
    "preserve_punctuation_default": true,
    "preserve_compound_hyphens_default": true
  };

  // Main Transliterator class for Sanskrit text processing

  // Load config variables
  const DEFAULT_SCHEME_IN = config.default_scheme_in; // e.g. "IAST"
  const DEFAULT_SCHEME_OUT = config.default_scheme_out; // e.g. "IAST"
  const AVOID_VIRAMA_INDIC_SCRIPTS_DEFAULT = config.avoid_virama_indic_scripts; // e.g. true
  const AVOID_VIRAMA_NON_INDIC_SCRIPTS_DEFAULT = config.avoid_virama_non_indic_scripts; // e.g. false

  class Transliterator {
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

          if (currChar === charToIgnore) ; else if (!vowels_that_preempt_virAma.includes(currChar)) {
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

  // Sanskrit meter patterns and definitions

  // Traditional "gaṇa" trisyllable abbreviation scheme
  const gaRas_by_weights = {
    'lgg': 'y', // bacchius
    'ggg': 'm', // molossus
    'ggl': 't', // antibacchius
    'glg': 'r', // cretic / amphimacer
    'lgl': 'j', // amphibrach
    'gll': 'B', // dactyl
    'lll': 'n', // tribrach
    'llg': 's', // anapest / antidactylus
  };

  /*
  Sources:
    Apte, V.S. (1890). Practical Sanskrit-English Dictionary, "Appendix A: Sanskrit Prosody".
      PDF online @ https://archive.org/details/ldpd_7285627_000/page/n1195/mode/2up
    Hahn, M. (2014). "Brief introduction into the Indian metrical system (for the use of students)"
      PDF online @ https://uni-marburg.academia.edu/MichaelHahn
    Murthy, G.S.S. (2003). "Characterizing Classical Anuṣṭup: A Study in Sanskrit Prosody".
      https://www.jstor.org/stable/41694750
  */

  /*
  anuṣṭup

  Rules for structure of even pāda (more rigid):
  1. Syllables 1 and 8 ALWAYS anceps. ( .xxxxxx. )
  2. Syllables 2 and 3 NEVER both light. ( (?!.ll.)xxxx )
  3. Syllables 2-4 NEVER ra-gaRa (glg). ( (?!.glg)xxxx )
  4. Syllables 5-7 ALWAYS has ja-gaRa (lgl). ( xxxxlgl. )

  Rules for structure of odd pāda:
  1. Syllables 1 and 8 ALWAYS anceps. ( .xxxxxx. )
  2. Syllables 2 and 3 NEVER both light. ( (?!.ll.)xxxx )
  3. Multiple "extensions" (vipulā) to prescribed pattern (pathyā) possible.
  */
  const anuzwuB_pAda = {
    'even': '^(?!.ll.|.glg).{4}lgl.$',
    'odd': {
      '^(?!.ll.).{4}lgg.$': 'pathyā',
      '^.glgggg.$': 'ma-vipulā',
      '^.glggll.$': 'bha-vipulā',
      '^.ggggll.$': 'bha-vipulā (ma-gaṇa-pūrvikā!)',
      '^(?!.ll).{3}glll.$': 'na-vipulā',
      '^(?!.ll).{3}gglg.$': 'ra-vipulā',
    }
  };

  /*
  samavṛtta

  Final syllable always anceps (heavy always first in regex).
  */

  const samavftta_family_names = {
    0: "...", 1: "...", 2: "...", 3: "...", // never occur, just for bad input
    4: 'pratiṣṭhā', 5: 'supratiṣṭhā',
    6: 'gāyatrī', 7: 'uṣṇik',
    8: 'anuṣṭup', 9: 'bṛhatī',
    10: 'paṅktiḥ', 11: 'triṣṭubh',
    12: 'jagatī', 13: 'atijagatī',
    14: 'śakvarī', 15: 'atiśakvarī',
    16: 'aṣṭiḥ', 17: 'atyaṣṭiḥ',
    18: 'dhṛtiḥ', 19: 'atidhṛtiḥ',
    20: 'kṛtiḥ', 21: 'prakṛtiḥ', 22: 'ākṛtiḥ', 23: 'vikṛtiḥ',
    24: 'saṃkṛtiḥ', 25: 'atikṛtiḥ', 26: 'utkṛtiḥ',
    27: 'daṇḍakam', 28: 'daṇḍakam', 29: 'daṇḍakam', 30: 'daṇḍakam',
    31: 'daṇḍakam', 32: 'daṇḍakam', 33: 'daṇḍakam', 34: 'daṇḍakam',
    35: 'daṇḍakam', 36: 'daṇḍakam', 37: 'daṇḍakam', 38: 'daṇḍakam',
  };

  function choose_heavy_gaRa_pattern(gaRa_pattern) {
    /*
    e.g., "...(g|l)" > "...g",
    e.g., "...(r|B)" > "...r",
    etc.
    */
    return gaRa_pattern.slice(0, -5) + gaRa_pattern.slice(-4, -3);
  }

  const samavfttas_by_family_and_gaRa = {
    0: {}, 1: {}, 2: {}, 3: {},

    4: {
      'm(g|l)': 'kanyā', // also 'gm'
    },

    5: {
      'bg(g|l)': 'paṅktiḥ',
    },

    6: {
      't(y|j)': 'tanumadhyamā',
      'm(m|t)': 'vidyullekhā', // also 'vāṇī'
      'n(y|j)': 'śaśivadanā',
      'y(y|j)': 'somarājī',
    },

    7: {
      'js(g|l)': 'kumāralalitā',
      'ms(g|l)': 'madalekhā',
      'nn(g|l)': 'madhumatī',
    },

    8: {
      'nBl(g|l)': 'gajagatiḥ',
      'jrl(g|l)': 'pramāṇikā',
      'Btl(g|l)': 'māṇavakam',
      'mmg(g|l)': 'vidyumālā',
      // 'rjgl': 'samānikā', // also glrj... ends in light?
    },

    9: {
      'nn(m|t)': 'bhujagaśiṣubhṛtā',
      'sj(r|B)': 'bhujaṅgasaṅgatā',
      'Bm(s|n)': 'maṇimadhyam',
    },

    10: {
      'njn(g|l)': 'tvaritagatiḥ',
      'mBs(g|l)': 'mattā',
      'Bms(g|l)': 'rukmavatī',
    },

    11: {
      'ttjg(g|l)': 'indravajrā',
      'jtjg(g|l)': 'upendravajrā',
      'BBBg(g|l)': 'dodhakam',
      'mBnl(g|l)': 'bhramaravilasitam',
      'rnrl(g|l)': 'rathoddhatā',
      'mBtg(g|l)': 'vātormī',
      'mttg(g|l)': 'śālinī',
      'rnBg(g|l)': 'svāgatā',
    },

    12: {
      'ttj(r|B)': 'indravaṃśā',
      'rnB(s|n)': 'candravatmam',
      'mBs(m|t)': 'jaladharamālā',
      'jsj(s|n)': 'jaloddhatagatiḥ',
      'njj(y|j)': 'tāmarasam',
      'sss(s|n)': 'toṭakam',
      'nBB(r|B)': 'drutavilambitam',
      'nnr(r|B)': 'pramuditavadanā', // aka prabhā, mandākinī,
      'sjs(s|n)': 'pramitākṣarā',
      'yyy(y|j)': 'bhujaṅgaprayātam',
      'tyt(y|j)': 'maṇimālā',
      'njj(r|B)': 'mālatī',
      'jtj(r|B)': 'vaṃśastham',
      'mmy(y|j)': 'vaiśvadevī',
      'rrr(r|B)': 'sragviṇī',
    },

    13: {
      'sjss(g|l)': 'kalahaṃsam', // aka siṃhanāda, kuṭajā
      'nntt(g|l)': 'kṣamā', // aka candrikā, utpalinī
      'mnjr(g|l)': 'praharṣiṇī',
      'sjsj(g|l)': 'mañjubhāṣiṇī', // aka sunandinī, prabodhitā
      'mtys(g|l)': 'mattamayūram',
      'jBsj(g|l)': 'rucirā', // aka prabhāvatī
    },

    14: {
      'nnrsl(g|l)': 'aparājitā',
      'mtnsg(g|l)': 'asaṃbādhā',
      'sjsyl(g|l)': 'pathyā', // aka mañjarī
      'njBjl(g|l)': 'pramadā', // aka kurarīrutā
      'nnBnl(g|l)': 'praharaṇakalikā',
      'mBnyg(g|l)': 'madhyakṣāmā', // aka haṃsaśyenī, kuṭila
      'tBjjg(g|l)': 'vasantatilakā',
      'mtnmg(g|l)': 'vāsantī',
    },

    15: {
      'rjrj(r|B)': 'cārucāmaram', // aka tūṇaka
      'nnmy(y|j)': 'mālinī',
      'mmmm(m|t)': 'līlākhelam',
      'nnnn(s|n)': 'śaśikalā',
    },

    16: {
      'rjrjr(g|l)': 'citram',
      'jrjrj(g|l)': 'pañcacāmaram',
      'njBjr(g|l)': 'vāṇinī',
    },

    17: {
      'ssjBjg(g|l)': 'citralekhā', // aka atiśāyinī
      'njBjjl(g|l)': 'narkuṭaka', // aka nardaṭaka
      'jsjsyl(g|l)': 'pṛthvī',
      'mBnttg(g|l)': 'mandākrāntā',
      'BrnBnl(g|l)': 'vaṃśapatrapatitam',
      'ymnsBl(g|l)': 'śikhariṇī',
      'nsmrsl(g|l)': 'hariṇī',
    },

    18: {
      'mtnyy(y|j)': 'kusumitalatāvellitā',
      'mBnyy(y|j)': 'citralekhā',
      'njBjr(r|B)': 'nandanam',
      'nnrrr(r|B)': 'nārācam',
      'msjst(s|n)': 'śārdūlalalitam',
      'rsjjB(r|B)': 'mallikāmālā',
    },

    19: {
      'ymnsrr(g|l)': 'meghavisphūrjitā',
      'msjstt(g|l)': 'śārdūlavikrīḍitam',
      'mrBnmn(g|l)': 'sumadhurā',
      'mrBnyn(g|l)': 'surasā',
    },

    20: {
      'sjjBrsl(g|l)': 'gītikā',
      'mrBnyBl(g|l)': 'suvadanā',
    },

    21: {
      'njBjjj(r|B)': 'pañcakāvalī', // aka sarasī, dhṛtaśrī
      'mrBnyy(y|j)': 'sragdharā',
    },

    22: {
      'mmtnnns(g|l)': 'haṃsī', // also mmggnnnngg
      'tByjsrn(g|l)': 'aśvadhāṭī',
    },

    23: {
      'njBjBjBl(g|l)': 'adritanayā',
      'njjjjjjl(g|l)': 'śravaṇābharaṇam', // also virājitam
    },

    24: {
      'BtnsBBn(y|j)': 'tanvī',
    },

    25: {
      'BmsBnnnn(g|l)': 'krauñcapadā',
    },

    26: {
      'mmtnnnrsl(g|l)': 'bhujaṅgavijṛmbhitam',
      'jsnBjsnBl(g|l)': 'śivatāṇḍavam',
    },

    // rest "daṇḍaka"
    27: {}, 28: {}, 29: {}, 30: {},
    31: {}, 32: {}, 33: {}, 34: {}, 35: {}, 36: {}, 37: {}, 38: {}, 39: {}, 40: {},
    41: {}, 42: {}, 43: {}, 44: {}, 45: {}, 46: {}, 47: {}, 48: {}, 49: {}, 50: {},
    51: {}, 52: {}, 53: {}, 54: {}, 55: {}, 56: {}, 57: {}, 58: {}, 59: {}, 60: {},
    61: {}, 62: {}, 63: {}, 64: {}, 65: {}, 66: {}, 67: {}, 68: {}, 69: {}, 70: {},
  };

  const all_known_samavRttas = [];
  for (const k of Object.keys(samavfttas_by_family_and_gaRa)) {
    all_known_samavRttas.push(...Object.values(samavfttas_by_family_and_gaRa[k]));
  }

  const ardhasamavftta_by_odd_even_regex_tuple = {
    'nnrl(g|l),njj(r|B)': 'aparavaktra = [11: nnrlg] 1,3 + [12: njjr] 2,4', // aka vaitālīya
    'sssl(g|l),BBBg(g|l)': 'upacitra = [11: ssslg] 1,3 + [11: BBBgg] 2,4',
    'nnr(y|j),njjr(g|l)': 'puṣpitāgrā = [12: nnry] 1,3 + [12: njjrg] 2,4', // aka aupacchandasika
    'ssj(g|l),sBrl(g|l)': 'viyoginī = [10: ssjg] 1,3 + [11: sBrlg] 2,4', // aka vaitālīya, sundarī
    'sss(g|l),BBBg(g|l)': 'vegavatī = [10: sssg] 1,3 + [11: BBBgg] 2,4',
    'sssl(g|l),nBB(r|B)': 'hariṇaplutā = [11: ssjgg] 1,3 + [12: nBBr] 2,4',
    'ssjg(g|l),sBr(y|j)': 'aupacchandasika = [11: ssjgg] 1,3 + [12: sBry] 2,4', // aka mālābhāriṇī
  };

  const vizamavftta_by_4_tuple = {
    'sjsl,nsjg,Bnjlg,sjsjg': 'udgatā = [10: sjsl] + [10: nsjg] + [11: Bnjlg] + [13: sjsjg]',
    'sjsl,nsjg,BnBg,sjsjg': 'udgatā 2 = [10: sjsl] + [10: nsjg] + [10: BnBg] + [13: sjsjg]',
  };

  /*
  Lists of jātis by total mātrās in each pāda.
  Structure is: regex of flexible pattern, fixed pattern as list, name as string.
  */
  const jAtis_by_morae = [
    ['\\[(12|11),(18|17),(12|11),(15|14)\\]', [12, 18, 12, 15], 'āryā'],
    // see Andrew Ollett's work (e.g., @ prakrit.info) for extra rules on Prakrit gāhā...
    ['\\[(12|11),(18|17),(12|11),(18|17)\\]', [12, 18, 12, 18], 'gītiḥ'],
    ['\\[(12|11),(15|14),(12|11),(15|14)\\]', [12, 15, 12, 15], 'upagītiḥ'],
    ['\\[(12|11),(15|14),(12|11),(18|17)\\]', [12, 15, 12, 18], 'udgītiḥ'],
    ['\\[(12|11),(20|19),(12|11),(20|19)\\]', [12, 20, 12, 20], 'āryāgītiḥ'],
    // ['\\[(14|13), (16|15), (14|13), (16|15)\\]', [12, 18, 12, 18], 'vaitālīya'], // more rules...
    // ['\\[(16|15), (16|15), (16|15), (16|15)\\]', [16, 16, 16, 16], 'mātrāsamaka'], // more rules...
  ];

  const meter_melodies = {
    'anuṣṭup': ['Madhura Godbole', 'H.V. Nagaraja Rao', 'Shatavadhani Ganesh', 'Diwakar Acarya'],
    'aparavaktra': ['H.V. Nagaraja Rao', 'Shatavadhani Ganesh'],
    'aśvadhāṭī': ['Shatavadhani Ganesh'],
    'āryā': ['Madhura Godbole', 'Shatavadhani Ganesh', 'Sadananda Das', 'Diwakar Acarya'],
    'indravajrā': ['Sadananda Das', 'Diwakar Acarya'],
    'indravaṃśa': ['Shatavadhani Ganesh'],
    'udgatā': ['Shatavadhani Ganesh'],
    'upagītiḥ': ['Madhura Godbole'],
    'upajātiḥ': ['Madhura Godbole', 'Sadananda Das', 'Diwakar Acarya', 'H.V. Nagaraja Rao', 'Shatavadhani Ganesh'],
    'aupacchandasika': ['H.V. Nagaraja Rao', 'Shatavadhani Ganesh'],
    'kokilaka': ['H.V. Nagaraja Rao', 'Shatavadhani Ganesh'],
    'gīti': ['H.V. Nagaraja Rao'],
    'cārucāmara': ['Shatavadhani Ganesh'],
    'toṭaka': ['Shatavadhani Ganesh'],
    'drutavilambitam': ['Madhura Godbole', 'Diwakar Acarya', 'Shatavadhani Ganesh'],
    'pañcacāmara': ['Sadananda Das', 'Shatavadhani Ganesh'],
    'puṣpitāgrā': ['Shatavadhani Ganesh'],
    'pṛthvī': ['Sadananda Das', 'H.V. Nagaraja Rao', 'Shatavadhani Ganesh'],
    'pramuditavadanā': ['H.V. Nagaraja Rao'],
    'pramitākṣara': ['H.V. Nagaraja Rao'],
    'praharṣiṇī': ['H.V. Nagaraja Rao', 'Shatavadhani Ganesh'],
    'bhujaṅgaprayāta': ['Shatavadhani Ganesh'],
    'mañjubhāṣiṇī': ['H.V. Nagaraja Rao', 'Shatavadhani Ganesh'],
    'mattamayūra': ['H.V. Nagaraja Rao'],
    'mandākrāntā': ['H.V. Nagaraja Rao', 'Diwakar Acarya', 'Shatavadhani Ganesh'],
    'mallikāmālā': ['Shatavadhani Ganesh'],
    // 'mātrāsamaka': ['Sadananda Das'],
    'mālinī': ['Madhura Godbole', 'Sadananda Das', 'H.V. Nagaraja Rao', 'Shatavadhani Ganesh'],
    'rathoddhatā': ['Shatavadhani Ganesh'],
    'vaṃśastha': ['Shatavadhani Ganesh'],
    'vasantatilakā': ['Madhura Godbole', 'Sadananda Das', 'H.V. Nagaraja Rao', 'Shatavadhani Ganesh'],
    'viyoginī': ['Shatavadhani Ganesh'],
    'śārdūlavikrīḍita': ['Madhura Godbole', 'Sadananda Das', 'H.V. Nagaraja Rao', 'Diwakar Acarya', 'Shatavadhani Ganesh'],
    'śālinī': ['H.V. Nagaraja Rao', 'Shatavadhani Ganesh'],
    'śikhariṇī': ['Madhura Godbole', 'Sadananda Das', 'H.V. Nagaraja Rao', 'Diwakar Acarya', 'Shatavadhani Ganesh'],
    'śivatāṇḍava': ['Shatavadhani Ganesh'],
    'śravaṇābharaṇa': ['Sadananda Das'],
    'sragdharā': ['H.V. Nagaraja Rao', 'Shatavadhani Ganesh'],
    'sragviṇī': ['Sadananda Das', 'Shatavadhani Ganesh'],
    'svāgatā': ['Shatavadhani Ganesh'],
    'hariṇī': ['Shatavadhani Ganesh']
  };

  // Scanner class and Verse object for Sanskrit metrical analysis

  // Load config variables
  const scansion_syllable_separator$1 = config.scansion_syllable_separator; // e.g. " "
  const additional_pAda_separators = config.additional_pAda_separators; // e.g. ["\t", ";"]

  class Verse {
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

  class Scanner {
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
            if (lineSyllables.endsWith(scansion_syllable_separator$1)) {
              lineSyllables = lineSyllables.slice(0, -1);
            }
          }

          lineSyllables += letter;

          if ([...SLP_vowels, 'M', 'H'].includes(letter)) {
            lineSyllables += scansion_syllable_separator$1;
          }
        }

        try {
          // remove final scansion_syllable_separator before final consonant(s)
          if (lineSyllables.length > 0 && 
              SLP_consonants_for_scansion.includes(lineSyllables[lineSyllables.length - 1])) {
            
            // final separator is incorrect, remove
            const finalSeparatorIndex = lineSyllables.lastIndexOf(scansion_syllable_separator$1);
            if (finalSeparatorIndex >= 0) {
              lineSyllables = lineSyllables.slice(0, finalSeparatorIndex) + 
                             lineSyllables.slice(finalSeparatorIndex + 1);
            }
            lineSyllables += scansion_syllable_separator$1;
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
        let syllables = line.split(scansion_syllable_separator$1);

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

  // Sanskrit meter identification classes for metrical analysis

  // Load config variables
  const scansion_syllable_separator = config.scansion_syllable_separator; // e.g. " "
  const default_resplit_option = config.default_resplit_option; // e.g. "none"
  const default_resplit_keep_midpoint = config.default_resplit_keep_midpoint; // e.g. true
  const meter_scores = config.meter_scores; // dict

  class VerseTester {
    /**
     * Internal agent-style object.
     * 
     * Most methods take a populated scansion.Verse object as an argument;
     * test_as_anuzwuB_half() is an exception.
     * 
     * Primary method attempt_identification returns scansion.Verse object
     * with populated meter_label attribute if identification was successful.
     */

    constructor() {
      this.pAdasamatva_count = 0; // int
      this.resplit_option = default_resplit_option; // string
      this.resplit_keep_midpoint = default_resplit_keep_midpoint; // bool
      this.identification_attempt_count = 0;
    }

    combine_results(Vrs, new_label, new_score) {
      Vrs.meterLabel || '';
      const old_score = Vrs.identificationScore;

      // currently strict
      // another more lenient option would test: abs(new_score - old_score) <= 1

      if (new_score < old_score) {
        return;
      } else if (new_score > old_score) {
        // override previous
        Vrs.meterLabel = new_label;
        Vrs.identificationScore = new_score;
      } else if (new_score === old_score) {
        // tie, concatenate as old + new
        Vrs.meterLabel += " atha vā " + new_label;
        // do not change score
      }
    }

    test_as_anuzwuB_half(odd_pAda_weights, even_pAda_weights) {
      /**
       * Accepts two strings of syllable weights (e.g. 'llglgllg').
       * Tries to match to known odd-even 'anuṣṭup' foot pairings:
       *     pathya
       *     vipulā (4.5 subtypes: na, ra, ma, bha, and variant bha).
       * Returns string result if match found, null otherwise.
       */

      // check even pāda
      const evenRegex = new RegExp(anuzwuB_pAda['even']);
      if (!evenRegex.test(even_pAda_weights)) {
        return null;
      }

      // check odd pāda (both 'paTyA' and 'vipulA')
      for (const weights_pattern of Object.keys(anuzwuB_pAda['odd'])) {
        const regex = new RegExp(weights_pattern);
        if (regex.test(odd_pAda_weights)) {
          return anuzwuB_pAda['odd'][weights_pattern];
        }
      }

      return null;
    }

    test_as_anuzwuB(Vrs) {
      /**
       * Accepts Verse object.
       * Determines whether first four lines of Verse's syllable_weights is anuṣṭup.
       * Internally sets Verse parameters if identified as such.
       * Tests halves ab and cd independently, reports if either half found to be valid.
       * Returns 1 if anuṣṭup, or 0 if not.
       */

      const w_p = Vrs.syllableWeights.split('\n'); // weights by pāda

      // make sure full four pādas
      if (w_p.length < 4) return 0;

      // test each half
      const pAdas_ab = this.test_as_anuzwuB_half(w_p[0], w_p[1]);
      const pAdas_cd = this.test_as_anuzwuB_half(w_p[2], w_p[3]);

      // report results

      // both halves perfect
      if (pAdas_ab !== null && pAdas_cd !== null) {
        Vrs.meterLabel = `anuṣṭup (1,2: ${pAdas_ab}, 3,4: ${pAdas_cd})`;
        Vrs.identificationScore = meter_scores["anuṣṭup, full, both halves perfect"];
        return 1;
      }

      // one half imperfect
      else if (pAdas_ab === null && pAdas_cd !== null) {
        Vrs.meterLabel = `anuṣṭup (1,2: asamīcīna, 3,4: ${pAdas_cd})`;
        Vrs.identificationScore = meter_scores["anuṣṭup, full, one half perfect, one imperfect"];
        return 1;
      } else if (pAdas_ab !== null && pAdas_cd === null) {
        Vrs.meterLabel = `anuṣṭup (1,2: ${pAdas_ab}, 3,4: asamīcīna)`;
        Vrs.identificationScore = meter_scores["anuṣṭup, full, one half perfect, one imperfect"];
        return 1;
      }

      // currently cannot do both halves imperfect

      // also test whether just a single perfect half
      const pAdas_ab_combined = this.test_as_anuzwuB_half(w_p[0] + w_p[1], w_p[2] + w_p[3]);
      if (pAdas_ab_combined !== null) {
        Vrs.meterLabel = `anuṣṭup (ardham eva: ${pAdas_ab_combined})`;
        Vrs.identificationScore = meter_scores["anuṣṭup, half, single half perfect"];
        return 1;
      }

      // currently cannot do just a single imperfect half
      return 0;
    }

    count_pAdasamatva(Vrs) {
      /**
       * Accepts four-part (newline-separated) string of light/heavy (l/g) pattern.
       * Since testing for samavṛtta, ignores final anceps syllable in each part.
       * Returns integer 0,2,3,4 indicating size of best matching group.
       */

      this.pAdasamatva_count = 0;

      // prepare weights-by-pāda for samatva count: omit last anceps syllable
      let wbp = Vrs.syllableWeights.split('\n').map(true_wbp => true_wbp.slice(0, -1));

      // make sure full four pādas
      if (wbp.length < 4) return 0;

      // avoid false positive if completely empty string argument list
      if (wbp[0] === wbp[1] && wbp[1] === wbp[2] && wbp[2] === wbp[3] && wbp[3] === '') {
        return 0;
      }

      // discard any empty strings
      wbp = wbp.filter(item => item !== '');

      // calculate max number of matching pādas in verse
      const counts = wbp.map(item => wbp.filter(w => w === item).length);
      const max_match = Math.max(...counts);

      if ([2, 3, 4].includes(max_match)) { // exclude value of 1 (= no matches)
        this.pAdasamatva_count = max_match;
      }
    }

    evaluate_samavftta(Vrs) {
      // sufficient pAdasamatva already assured, now just evaluate

      const wbp = Vrs.syllableWeights.split('\n'); // weights by pāda

      // get index of most frequent pāda type
      const wbp_sans_final = wbp.map(w => w.slice(0, -1)); // omit final anceps from consideration
      const counts = {};
      wbp_sans_final.forEach(item => counts[item] = (counts[item] || 0) + 1);
      const most_freq_pAda = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
      const i = wbp_sans_final.indexOf(most_freq_pAda);

      const w_to_id = wbp[i]; // weights to id, including final anceps
      const g_to_id = Vrs.gaRaAbbreviations.split('\n')[i]; // gaRa abbreviation to id

      let meter_label;

      // look for match among regexes with same length
      const patterns = samavfttas_by_family_and_gaRa[w_to_id.length] || {};
      let found = false;

      for (const gaRa_pattern of Object.keys(patterns)) {
        const regex = new RegExp(gaRa_pattern);
        if (regex.test(g_to_id)) {
          meter_label = patterns[gaRa_pattern];
          meter_label += ` [${w_to_id.length}: ${choose_heavy_gaRa_pattern(gaRa_pattern)}]`;
          found = true;
          break;
        }
      }

      if (!found) {
        meter_label = "ajñātasamavṛtta"; // i.e., might need to add to meter_patterns
        meter_label += ` [${w_to_id.length}: ${g_to_id}]`;
      }

      let score = meter_scores["samavṛtta, perfect"];

      if (this.pAdasamatva_count === 3) {
        meter_label += " (? 3 eva pādāḥ yuktāḥ)";
        score = meter_scores["samavṛtta, imperfect (3)"];
      } else if (this.pAdasamatva_count === 2) {
        meter_label += " (? 2 eva pādāḥ yuktāḥ)";
        score = meter_scores["samavṛtta, imperfect (2)"];
      } else if (this.pAdasamatva_count === 0) {
        meter_label += " (1 eva pādaḥ)";
        score = meter_scores["samavṛtta, quarter, perfect"];
      }

      // experimental penalty, can later incorporate into config meter_scores
      if (meter_label === "ajñātasamavṛtta") {
        score -= 2;
      }

      // may tie with pre-existing result (e.g., upajātiḥ)
      this.combine_results(Vrs, meter_label, score);
    }

    evaluate_ardhasamavftta(Vrs) {
      // sufficient pAdasamatva already assured, now just evaluate
      Vrs.identificationScore = meter_scores["ardhasamavṛtta, perfect"];

      Vrs.syllableWeights.split('\n'); // weights by pāda

      const gs_to_id = Vrs.gaRaAbbreviations.split('\n'); // gaRa abbreviation to id
      const odd_g_to_id = gs_to_id[0];
      const even_g_to_id = gs_to_id[1];

      let meter_label;

      // look for match among regexes with same length
      const tuples = Object.keys(ardhasamavftta_by_odd_even_regex_tuple);
      let found = false;

      for (const tupleKey of tuples) {
        const [odd_gaRa_pattern, even_gaRa_pattern] = tupleKey.split(',');

        const regex_odd = new RegExp(odd_gaRa_pattern);
        const regex_even = new RegExp(even_gaRa_pattern);

        if (regex_odd.test(odd_g_to_id) && regex_even.test(even_g_to_id)) {
          meter_label = ardhasamavftta_by_odd_even_regex_tuple[tupleKey];
          found = true;
          break;
        }
      }

      if (!found) {
        meter_label = "ajñātārdhasamavṛtta"; // i.e., might need to add to meter_patterns
        meter_label += ` [${odd_g_to_id}, ${even_g_to_id}]`;
        Vrs.identificationScore = meter_scores["ardhasamavṛtta, perfect, unknown"];
      }

      Vrs.meterLabel = meter_label;
    }

    evaluate_upajAti(Vrs) {
      // sufficient length similarity already assured, now just evaluate

      let wbp = Vrs.syllableWeights.split('\n'); // weights by pāda
      let wbp_lens = wbp.map(line => line.length);
      let gs_to_id = Vrs.gaRaAbbreviations.split('\n');

      // special exception for triṣṭubh-jagatī mix
      // see Karashima 2016 "The Triṣṭubh-Jagatī Verses in the Saddharmapuṇḍarīka"
      const unique_sorted_lens = [...new Set(wbp_lens)].sort((a, b) => a - b);

      if (!(unique_sorted_lens.length === 2 && unique_sorted_lens[0] === 11 && unique_sorted_lens[1] === 12)) {
        // if imperfect, exclude all info for lines of non-majority lengths

        // find most frequent pAda length
        const lenCounts = {};
        wbp_lens.forEach(len => lenCounts[len] = (lenCounts[len] || 0) + 1);
        const most_freq_pAda_len = Object.keys(lenCounts).reduce((a, b) => lenCounts[a] > lenCounts[b] ? a : b);

        // exclude based on most frequent pAda length
        const to_exclude = [];
        for (let i = 0; i < wbp.length; i++) {
          if (wbp[i].length !== parseInt(most_freq_pAda_len)) {
            to_exclude.push(i);
          }
        }

        // delete in descending index order, avoid index errors
        for (let i = to_exclude.length - 1; i >= 0; i--) {
          const idx = to_exclude[i];
          wbp.splice(idx, 1);
          wbp_lens.splice(idx, 1);
          gs_to_id.splice(idx, 1);
        }
      }

      // calculate what result could possibly score based on analysis so far
      let potential_score = meter_scores["upajātiḥ, perfect"];

      if (!wbp_lens.includes(11)) { // no triṣṭubh (could be mixed with jagatī)
        potential_score -= 1;
      }
      if (wbp_lens.length !== 4 && !(unique_sorted_lens.length === 2 && unique_sorted_lens[0] === 11 && unique_sorted_lens[1] === 12)) {
        // not perfect, less than 4 being analyzed
        potential_score -= 2;
      }

      // possibly quit based on analysis so far
      if ((potential_score < Vrs.identificationScore) ||
        (potential_score < meter_scores["upajātiḥ, imperfect"])) {
        return;
      }

      // for however many pādas remain, produce labels as possible
      const meter_labels = [];
      for (let i = 0; i < gs_to_id.length; i++) {
        const g_to_id = gs_to_id[i];
        let meter_label;
        let found = false;

        const patterns = samavfttas_by_family_and_gaRa[wbp_lens[i]] || {};
        for (const gaRa_pattern of Object.keys(patterns)) {
          const regex = new RegExp(gaRa_pattern);
          if (regex.test(g_to_id)) {
            meter_label = patterns[gaRa_pattern];
            meter_label += ` [${wbp_lens[i]}: ${choose_heavy_gaRa_pattern(gaRa_pattern)}]`;
            found = true;
            break;
          }
        }

        if (!found) {
          meter_label = "ajñātam"; // i.e., might need to add to meter_patterns
          meter_label += ` [${wbp_lens[i]}: ${g_to_id}]`;
        }

        meter_labels.push(meter_label);
      }

      const unique_meter_labels = [...new Set(meter_labels)]; // de-dupe
      const combined_meter_labels = unique_meter_labels.join(', ');

      // assign scores and labels
      let family = samavftta_family_names[wbp_lens[0]];
      const unique_meter_labels_copy = [...unique_meter_labels].sort();

      if (family === "triṣṭubh" &&
        unique_meter_labels_copy.length === 2 &&
        unique_meter_labels_copy.includes('indravajrā [11: ttjgg]') &&
        unique_meter_labels_copy.includes('upendravajrā [11: jtjgg]')) {
        family = ''; // clearer not to specify in this case
      }

      let score;
      if (wbp_lens.length === 4 && unique_sorted_lens.length === 1 && unique_sorted_lens[0] === 11) { // triṣṭubh
        score = meter_scores["upajātiḥ, perfect"];
      } else if (unique_sorted_lens.length === 2 && unique_sorted_lens[0] === 11 && unique_sorted_lens[1] === 12) {
        score = meter_scores["upajātiḥ, triṣṭubh-jagatī-saṃkara, perfect"];
        family = "triṣṭubh-jagatī-saṃkara?"; // overwrite
      } else if (wbp_lens.length === 4 && !unique_sorted_lens.includes(11)) {
        score = meter_scores["upajātiḥ, non-triṣṭubh, perfect"];
      } else if ([2, 3].includes(wbp_lens.length) && wbp_lens.filter(len => len === 11).length === wbp_lens.length) { // triṣṭubh
        score = meter_scores["upajātiḥ, imperfect"];
      } else if ([2, 3].includes(wbp_lens.length) && !wbp_lens.includes(11)) {
        score = meter_scores["upajātiḥ, non-triṣṭubh, imperfect"];
      } else {
        score = meter_scores["none found"];
      }

      const overall_meter_label = `upajātiḥ ${family}: ${combined_meter_labels}`;

      let final_label = overall_meter_label;
      if (wbp_lens.length !== 4 && !(unique_sorted_lens.length === 2 && unique_sorted_lens[0] === 11 && unique_sorted_lens[1] === 12)) {
        // not perfect and also not triṣṭubh-jagatī-saṃkara
        final_label += ` (? ${wbp_lens.length} eva pādāḥ yuktāḥ)`;
      }

      this.combine_results(Vrs, final_label, score);
    }

    is_vizamavftta(Vrs) {
      const gs_to_id = Vrs.gaRaAbbreviations.split('\n');
      if (gs_to_id.length < 4) return false;

      for (const tupleKey of Object.keys(vizamavftta_by_4_tuple)) {
        const [a, b, c, d] = tupleKey.split(',');
        if (gs_to_id[0] === a && gs_to_id[1] === b && gs_to_id[2] === c && gs_to_id[3] === d) {
          Vrs.identificationScore = meter_scores["viṣamavṛtta, perfect"];
          Vrs.meterLabel = vizamavftta_by_4_tuple[tupleKey];
          return true;
        }
      }

      return false;
    }

    test_as_samavftta_etc(Vrs) {
      const wbp = Vrs.syllableWeights.split('\n'); // weights by pāda
      const wbp_lens = wbp.map(line => line.length);

      // make sure either full four pādas or one and single-pāda mode
      if (!(wbp.length >= 4 || (wbp.length === 1 && this.resplit_option === "single_pAda"))) {
        return 0;
      }

      this.count_pAdasamatva(Vrs); // [0,2,3,4]

      // test in following order to prioritize left-right presentation of ties
      // ties managed in this.combine_results()

      // test perfect samavṛtta
      if (this.pAdasamatva_count === 4) {
        // definitely checks out, id_score == 9
        this.evaluate_samavftta(Vrs);
        return 1; // max score already reached
      }

      // test perfect ardhasamavftta
      if (this.pAdasamatva_count === 2 &&
        wbp[0].slice(0, -1) === wbp[2].slice(0, -1) &&
        wbp[1].slice(0, -1) === wbp[3].slice(0, -1) && // exclude final anceps
        wbp_lens.filter(len => len === 11).length !== 4) { // bc triṣṭubh upajātiḥ so common
        // will give id_score == 8
        this.evaluate_ardhasamavftta(Vrs);
        // max score not necessarily yet reached, don't return
      }

      // test perfect single pāda of samavṛtta
      if (this.pAdasamatva_count === 0 && this.resplit_option === "single_pAda") {
        this.evaluate_samavftta(Vrs);
      }

      // test perfect viṣamavṛtta
      if (this.pAdasamatva_count === 0 && this.is_vizamavftta(Vrs)) {
        // will give id_score == 9
        // label and score already set in is_vizamavftta if test was successful
        return 1; // max score already reached
      }

      // test perfect upajātiḥ
      const unique_sorted_lens = [...new Set(wbp_lens)].sort((a, b) => a - b);
      if (unique_sorted_lens.length === 1) { // all same length
        // will give id_score in [8, 7], may tie with above
        this.evaluate_upajAti(Vrs);
        if (Vrs.identificationScore === 8) return 1; // best score compared to below
        // otherwise, max score not necessarily yet reached, don't return
      }

      // test imperfect samavftta
      if ([2, 3].includes(this.pAdasamatva_count)) {
        // will give id_score in [7, 6], may tie with above
        this.evaluate_samavftta(Vrs);
        // max score not necessarily yet reached, don't return
      }

      // test imperfect ardhasamavftta? seems hard
      // involves looking specifically for corresponding type...

      // test imperfect upajātiḥ
      if (unique_sorted_lens.length >= 2 && unique_sorted_lens.length <= 3 ||
        (unique_sorted_lens.length === 2 && unique_sorted_lens[0] === 11 && unique_sorted_lens[1] === 12)) {
        // either not all same length or triṣṭubh-jagatī mix
        // will give id_score in [6, 5, 4], may tie with above
        this.evaluate_upajAti(Vrs);
      }

      // return success
      if (Vrs.meterLabel !== null) {
        return 1;
      } else {
        return 0;
      }
    }

    test_as_jAti(Vrs) {
      /**
       * Accepts as arguments two lists, one of strings, the other of numbers.
       * First argument details light/heavy (l/g) patterns, second reports total morae.
       * Determines whether verse (first four lines) is of 'jāti' type.
       * Returns string detailing results if identified as such, or null if not.
       */
      const w_p = Vrs.syllableWeights.split('\n');
      // make sure full four pādas
      if (w_p.length < 4) return 0;

      const morae_by_pAda = Vrs.moraePerLine;

      // Note: morae_by_pAda is a list of numbers,
      // here manipulate as such but also as a single string
      const morae_by_pAda_string = JSON.stringify(morae_by_pAda);
      /**
       * Test whether morae match patterns, with allowance on last syllable:
       *   final light syllable of a jāti quarter CAN be counted as heavy,
       *   but ONLY if necessary to fill out the meter
       *   and NOT otherwise.
       */
      for (const [flex_pattern, std_pattern, jAti_name] of jAtis_by_morae) {
        const regex = new RegExp(flex_pattern);
        if (regex.test(morae_by_pAda_string)) {
          // for each of four pAdas
          let allValid = true;
          for (let i = 0; i < 4; i++) {
            if (morae_by_pAda[i] === std_pattern[i] ||
              // final syllable is light but needs to be heavy
              (morae_by_pAda[i] === std_pattern[i] - 1 && w_p[i].slice(-1) === 'l')) {
              continue;
            } else {
              allValid = false;
              break;
            }
          }

          if (allValid) { // if all four pAdas proven valid, i.e., if no breaks
            Vrs.meterLabel = `${jAti_name} (${std_pattern.join(', ')})`;
            Vrs.identificationScore = meter_scores["jāti, perfect"];

            // should be combining results in case of previous match
            return 1;
          }

          // soon: implement imperfect jāti, score == meter_scores["jāti, imperfect"]
        }
      }

      // if all patterns tested and nothing returned
      return 0;
    }

    attempt_identification(Vrs) {
      /**
       * Receives static, populated Verse object on which to attempt identification.
       * 
       * Runs through various possible meter types with respective identification_scores:
       *   zloka
       *     9 two zloka halves, both perfect
       *     8 two zloka halves, one perfect and one imperfect
       *     (not currently supported: two zloka halves, both imperfect)
       *     9 one zloka half, perfect
       *     (not currently supported: one zloka half, imperfect)
       *   samavftta, upajAti, vizamavftta, ardhasamavftta
       *     9 vizamavftta perfect (trivial, in progress)
       *     (currently not supported: 5 vizamavftta imperfect)
       *     (currently not supported but planned: 9 ardhasamavftta perfect)
       *     (currently not supported: 5 ardhasamavftta imperfect)
       *     9 samavftta perfect
       *     8 upajAti perfect trizwuB
       *     7 samavftta imperfect (2-3 lines match)
       *     7 upajAti perfect non-trizwuB
       *     6 upajAti imperfect trizwuB
       *     5 upajAti imperfect non-trizwuB
       *   jAti
       *     8 jAti perfect
       *     (currently not supported but planned: 5 jAti imperfect)
       * 
       * Embeds identification results as Verse.meter_label and Verse.identification_score.
       * Returns string corresponding to Verse.meter_label. - currently
       * Returns int result 1 if successful and 0 if not. - planned
       */

      this.identification_attempt_count += 1;

      // anuzwuB
      const success_anuzwuB = this.test_as_anuzwuB(Vrs); // 1 if successful, 0 if not
      if (success_anuzwuB && Vrs.identificationScore === meter_scores["max score"]) {
        return 1;
      }

      // samavftta, upajAti, vizamavftta, ardhasamavftta
      const success_samavftta_etc = this.test_as_samavftta_etc(Vrs);
      if (success_samavftta_etc && Vrs.identificationScore >= 8) return 1;
      // i.e., if upajātiḥ or anything imperfect, also continue on to check jāti

      // problem: how to change above handling for rare case
      // where ardhasamavftta is also jAti?

      // jāti
      const success_jAti = this.test_as_jAti(Vrs);

      if (success_anuzwuB || success_samavftta_etc || success_jAti) {
        return 1;
      } else {
        return 0;
      }
    }
  }

  class MeterIdentifier {
    /**
     * User-facing agent-style object.
     * 
     * Primary method identify_meter() accepts string.
     * 
     * Returns single Verse object, whose attribute meter_label
     * and method summarize() help in revealing identification results.
     */

    constructor() {
      this.Scanner = null;
      this.VerseTester = null;
      this.Verses_found = []; // list of Verse objects which passed VerseTester
    }

    wiggle_iterator(start_pos, part_len, resplit_option) {
      /**
       * E.g., if len(pāda)==10,
       * then from the breaks between each pāda,
       * wiggle as far as 6 in either direction,
       * first right, then left.
       */

      const iter_list = [start_pos];
      let distance_multiplier;
      if (resplit_option === 'resplit_max') {
        distance_multiplier = 0.50; // wiggle as far as 50% of part_len
      } else if (resplit_option === 'resplit_lite') {
        distance_multiplier = 0.35; // wiggle as far as 35% of part_len
      }

      const max_wiggle_distance = Math.floor(part_len * distance_multiplier) + 1;
      for (let i = 1; i < max_wiggle_distance; i++) {
        iter_list.push(start_pos + i);
        iter_list.push(start_pos - i);
      }
      return iter_list;
    }

    resplit_Verse(syllable_list, ab_pAda_br, bc_pAda_br, cd_pAda_br) {
      /**
       * Input does not have newlines
       */
      const sss = scansion_syllable_separator;
      return (syllable_list.slice(0, ab_pAda_br).join(sss) + '\n' +
        syllable_list.slice(ab_pAda_br, bc_pAda_br).join(sss) + '\n' +
        syllable_list.slice(bc_pAda_br, cd_pAda_br).join(sss) + '\n' +
        syllable_list.slice(cd_pAda_br).join(sss));
    }

    wiggle_identify(Vrs, syllable_list, VrsTster, pAda_brs, quarter_len) {
      /**Returns a list for MeterIdentifier.Verses_found*/

      const pos_iterators = {};
      for (const k of ['ab', 'bc', 'cd']) {
        if (k === 'bc' && VrsTster.resplit_keep_midpoint === true) {
          pos_iterators['bc'] = [pAda_brs['bc']]; // i.e., do not wiggle bc
        } else {
          pos_iterators[k] = this.wiggle_iterator(
            pAda_brs[k], quarter_len,
            VrsTster.resplit_option
          );
        }
      }

      const S = new Scanner();
      const Verses_found = [];

      for (const pos_ab of pos_iterators['ab']) {
        for (const pos_bc of pos_iterators['bc']) {
          for (const pos_cd of pos_iterators['cd']) {
            try {
              const new_text_syllabified = this.resplit_Verse(
                syllable_list, pos_ab, pos_bc, pos_cd);

              // Create a copy of the Verse object
              const temp_V = Object.assign(Object.create(Object.getPrototypeOf(Vrs)), Vrs);
              temp_V.textSyllabified = new_text_syllabified;

              temp_V.syllableWeights = S.scanSyllableWeights(temp_V.textSyllabified);
              temp_V.moraePerLine = S.countMorae(temp_V.syllableWeights);
              temp_V.gaRaAbbreviations = temp_V.syllableWeights.split('\n')
                .map(line => S.gaRaAbbreviate(line))
                .join('\n');

              const success = VrsTster.attempt_identification(temp_V);

              if (success) {
                Verses_found.push(temp_V);
              }

              if (temp_V.identificationScore === meter_scores["max score"]) {
                return Verses_found;
                // done when any perfect exemplar found
                // for greater speed and efficiency
                // disable for debugging:
                //   check whether finding multiple 9s
                //   check whether any temp_V breaks system
              }

            } catch (e) {
              // IndexError equivalent
              continue;
            }
          }
        }
      }

      return Verses_found;
    }

    find_meter(rw_str, from_scheme = null) {
      this.Scanner = new Scanner();
      const tmp_V = this.Scanner.scan(rw_str, from_scheme);
      const all_weights_one_line = tmp_V.syllableWeights.replace(/\n/g, '');
      const all_syllables_one_line = tmp_V.textSyllabified.replace(/\n/g, '');

      const pathyA_odd = Object.keys(anuzwuB_pAda['odd'])[0].slice(1, -1);
      const even = anuzwuB_pAda['even'].slice(1, -1);
      const overall_pattern = pathyA_odd + even;

      const regex = new RegExp(overall_pattern, 'g');
      const matches = [];
      let match;
      while ((match = regex.exec(all_weights_one_line)) !== null) {
        matches.push([match.index, match.index + match[0].length]);
      }

      const match_strings = [];
      const syllables = all_syllables_one_line.split(' ');
      for (const [start, end] of matches) {
        match_strings.push(syllables.slice(start, end).join(''));
      }

      const verses_found = [];
      for (const ms of match_strings) {
        const V = this.identify_meter(ms, 'resplit_max', default_resplit_keep_midpoint, 'SLP');
        verses_found.push(V);
      }

      return verses_found;
    }

    identify_meter(rw_str,
      resplit_option = default_resplit_option,
      resplit_keep_midpoint = default_resplit_keep_midpoint,
      from_scheme = null) {
      /**
       * User-facing method, manages overall identification procedure:
       *   accepts raw string
       *   sends string to Scanner.scan, receives back scansion.Verse object
       *   then, according to segmentation mode
       *     makes and passes series of Verse objects to internal VerseTester
       *     receives back tested Verses (as internally available dict)
       *   returns single Verse object with best identification result
       * 
       * four segmentation modes:
       *   1) none: uses three newlines exactly as provided in input
       *   2) resplit_max: discards input newlines, resplits based on overall length
       *   3) resplit_lite: initializes length-based resplit with input newlines
       *   4) single_pAda: evaluates input as single pAda (verse quarter)
       * 
       * order
       *   first: default or override
       *   if fails, then: try other modes in set order (1 2 3; depending on length 4)
       */

      this.Scanner = new Scanner();

      // gets back mostly populated Verse object
      let V = this.Scanner.scan(rw_str, from_scheme);
      this.VerseTester = new VerseTester();
      this.VerseTester.resplit_option = resplit_option;
      this.VerseTester.resplit_keep_midpoint = resplit_keep_midpoint;

      if (['none', 'single_pAda'].includes(resplit_option) || V.textCleaned === '') {
        this.VerseTester.attempt_identification(V);
        // label and score set internally

      } else if (['resplit_max', 'resplit_lite'].includes(resplit_option)) {

        // capture any user-provided pāda breaks (= all newlines after scansion cleaning)
        const newline_indices = [];
        let match;
        const newlineRegex = /\n/g;
        while ((match = newlineRegex.exec(V.textSyllabified)) !== null) {
          newline_indices.push(match.index);
        }

        // make pure list of only syllables
        let syllable_list = V.textSyllabified.replace(/\n/g, '').split(scansion_syllable_separator);

        // discard any final separator(s)
        try {
          while (syllable_list[syllable_list.length - 1] === '') {
            syllable_list.pop();
          }
        } catch (e) {
          // empty list...
        }

        // initialize length-based pāda breaks
        const pAda_brs = {};
        const total_syll_count = syllable_list.length;
        const quarter_len = Math.floor(total_syll_count / 4);
        pAda_brs['ab'] = quarter_len;
        pAda_brs['bc'] = quarter_len * 2;
        pAda_brs['cd'] = quarter_len * 3;

        if (newline_indices.length === 3) {
          if (resplit_option === 'resplit_lite') {
            // full three breaks provided (ab, bc, cd), override all length-based ones
            for (let i = 0; i < 3; i++) {
              const key = ['ab', 'bc', 'cd'][i];
              pAda_brs[key] = V.textSyllabified.slice(0, newline_indices[i])
                .split(scansion_syllable_separator).length - 1;
            }
          } else if (resplit_option === 'resplit_max' && this.VerseTester.resplit_keep_midpoint) {
            // full three breaks provided, override second (bc) only, keep other two
            pAda_brs['bc'] = V.textSyllabified.slice(0, newline_indices[1])
              .split(scansion_syllable_separator).length - 1;
          }
        } else if (newline_indices.length === 1) {
          if (resplit_option === 'resplit_lite' ||
            (resplit_option === 'resplit_max' && this.VerseTester.resplit_keep_midpoint)) {
            // only one break provided, assume bc, override that one, keep other two
            pAda_brs['bc'] = V.textSyllabified.slice(0, newline_indices[0])
              .split(scansion_syllable_separator).length - 1;
          }
        } else ;

        // use initial Verse to generate potentially large number of others Verses
        // store their respective results internally, collect overall list
        this.Verses_found = this.wiggle_identify(
          V, syllable_list, this.VerseTester,
          pAda_brs, quarter_len
        );

        // pick best match, i.e. resulting Verse with highest identification_score
        if (this.Verses_found.length > 0) {
          this.Verses_found.sort((a, b) => b.identificationScore - a.identificationScore);
          V = this.Verses_found[0]; // replace initial Verse object
        }
      }

      if (V.meterLabel === null) { // initial Verse label still not populated
        V.meterLabel = 'na kiṃcid adhyavasitam'; // do not return null
        V.identificationScore = meter_scores["none found"]; // did at least try
      }

      return V;
    }
  }

  // Splitter class for Sanskrit sandhi/compound splitting
  // Port of splitting.py — uses Dharmamitra and 2018 external APIs via fetch


  const PRESERVE_PUNCTUATION_DEFAULT = config.preserve_punctuation_default;
  const PRESERVE_COMPOUND_HYPHENS_DEFAULT = config.preserve_compound_hyphens_default;

  const SPLITTER_SERVER_URL = 'https://2018emnlp-sanskrit-splitter-server.duckdns.org/api/split/';
  const HEADERS = { 'Content-Type': 'application/json' };
  const RETRY_DELAY_MS = 5000;

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  class Splitter {
    constructor() {
      const sharedItems = String.raw`।॥\|/\\.,—;\?!\[(<\t\r\n"`;
      this.punctuationRegex = new RegExp(` *[${sharedItems}][${sharedItems}\\d\\])> ]*`, 'g');
      this.maxCharLimit = {
        'splitter_2018,no-hyphens':       128,
        'dharmamitra_2024_sept,no-hyphens': 350,
        'dharmamitra_2024_sept,hyphens':    150,
      };
      this.charLimitSplitRegexOptions = [
        /(?:[kgtdnpbmṃḥ]) /g,
        /(?:e[nṇ]a|asya|[ie]va|api) /g,
        / /g,
        /a/g,
      ];
      this.centerSplitRange = 0.8;
    }

    _getSentencesAndPunctuation(text) {
      /**
       * Extract and return lists of sentences and punctuation from text.
       * Also returns list of markers for proper interleaving on restoration.
       */
      const pRe = new RegExp(this.punctuationRegex.source, 'gm');
      const sentences = text.split(pRe).filter(s => s !== '');
      const punctuation = [...text.matchAll(pRe)].map(m => m[0]);

      const splitRe = new RegExp(`(${this.punctuationRegex.source})`, 'gm');
      const tokens = text.split(splitRe).filter(t => t !== '');
      const punctRe = new RegExp(`^${this.punctuationRegex.source}$`, 'm');
      const markers = tokens.map(t => punctRe.test(t) ? 'punctuation' : 'content');

      return { sentences, punctuation, markers };
    }

    _findMidpoint(text, splitRegex) {
      /**
       * Determine position of whitespace of centermost legal split of text.
       * Returns integer index.
       */
      const re = new RegExp(splitRegex.source, splitRegex.flags.replace('g', '') + 'g');
      const spaceIndices = [];
      let m;
      while ((m = re.exec(text)) !== null) {
        spaceIndices.push(m.index + m[0].length - 1);
      }
      if (spaceIndices.length === 0) return 0;
      const mid = text.length / 2;
      const distances = spaceIndices.map(i => Math.abs(i - mid));
      const minDist = Math.min(...distances);
      return spaceIndices[distances.indexOf(minDist)];
    }

    _splitSmartHalf(text, splitRegexOptions, maxLen) {
      /**
       * Recursively split text until all substrings conform to maxLen.
       * Returns array of resulting substrings.
       */
      text = text.replace(/^ *| *$/g, '');
      if (text.length <= maxLen) return [text];

      let midpoint = 0;
      for (const splitRegex of splitRegexOptions) {
        midpoint = this._findMidpoint(text, splitRegex);
        const lo = ((1.0 - this.centerSplitRange) / 2) * text.length;
        const hi = (1.0 - (1.0 - this.centerSplitRange) / 2) * text.length;
        if (midpoint > lo && midpoint < hi) break;
      }

      const partA = this._splitSmartHalf(text.slice(0, midpoint + 1), splitRegexOptions, maxLen);
      const partB = this._splitSmartHalf(text.slice(midpoint + 1), splitRegexOptions, maxLen);
      return [...partA, ...partB];
    }

    _enforceCharLimit(textLines, maxCharLimit = 128) {
      const sentenceCounts = [];
      const newTextLines = [];
      for (const line of textLines) {
        if (line.length <= maxCharLimit) {
          newTextLines.push(line);
          sentenceCounts.push(1);
        } else {
          const parts = this._splitSmartHalf(line, this.charLimitSplitRegexOptions, maxCharLimit);
          newTextLines.push(...parts);
          sentenceCounts.push(parts.length);
        }
      }
      return { newTextLines, sentenceCounts };
    }

    _parseDharmamitraSimpleResult(responseJson) {
      /**Parse response from /api-tagging/tagging/ (flat underscore-delimited strings). */
      return responseJson.results.map(s => s.replace(/_/g, ' ').trim());
    }

    _parseDharmamitraParsedResult(responseJson) {
      /**Parse response from /api-tagging/tagging-parsed/ (structured grammatical analysis). */
      return responseJson.map(sentenceObj => {
        let sentence = sentenceObj.grammatical_analysis
          .map(w => w.unsandhied)
          .join(' ');
        sentence = sentence.replace(/- /g, '-');
        return sentence;
      });
    }

    async _getDharmamitraSplit(textInput, preserveCompoundHyphens = true, batchSize = 2000, retries = 1) {
      /**
       * Two endpoints on the Dharmamitra tagging API:
       * - /api-tagging/tagging/           simple, no compound distinction
       * - /api-tagging/tagging-parsed/    rich, compounds marked with hyphens
       */
      const url = preserveCompoundHyphens
        ? 'https://dharmamitra.org/api-tagging/tagging-parsed/'
        : 'https://dharmamitra.org/api-tagging/tagging/';

      const sentences = textInput.split('\n');
      const results = [];

      for (let i = 0; i < sentences.length; i += batchSize) {
        const batch = sentences.slice(i, i + batchSize);
        const data = preserveCompoundHyphens
          ? { texts: batch, mode: 'unsandhied-lemma-morphosyntax', human_readable_tags: false, grammar_type: 'western' }
          : { texts: batch };
        for (let j = 0; j <= retries; j++) {
          const response = await fetch(url, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(data),
          });
          if (response.ok) {
            const json = await response.json();
            const batchResult = preserveCompoundHyphens
              ? this._parseDharmamitraParsedResult(json)
              : this._parseDharmamitraSimpleResult(json);
            results.push(...batchResult);
            break;
          } else if (j < retries) {
            console.warn(`retrying batch in ${RETRY_DELAY_MS / 1000} sec`);
            await sleep(RETRY_DELAY_MS);
          } else {
            throw new Error(`Dharmamitra batch failed (status ${response.status}): ${JSON.stringify(batch)}`);
          }
        }
      }

      return results;
    }

    async _postString2018(inputText, url = SPLITTER_SERVER_URL, batchSize = 10000, retries = 1) {
      const sentences = inputText.split('\n');
      const results = [];

      for (let i = 0; i < sentences.length; i += batchSize) {
        const batch = sentences.slice(i, i + batchSize);
        const batchText = batch.join('\n');
        const data = { input_text: batchText };

        for (let j = 0; j <= retries; j++) {
          const response = await fetch(url, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(data),
          });
          if (response.ok) {
            const json = await response.json();
            results.push(json.output_text);
            break;
          } else if (j < retries) {
            console.warn(`retrying batch in ${RETRY_DELAY_MS / 1000} sec`);
            await sleep(RETRY_DELAY_MS);
          } else {
            throw new Error(`2018 splitter batch failed (status ${response.status}): ${JSON.stringify(batch)}`);
          }
        }
      }

      return results.join('\n');
    }

    _cleanUp2018(splitSentencesStr, splitAppearance = ' ') {
      let s = splitSentencesStr;
      s = s.replace(/-\n/g, '\n');                         // remove line-final hyphens
      s = s.replace(/-/g, splitAppearance);                // modify appearance of splits
      s = s.replace(/=/g, '');                             // remove = chars
      s = s.replace(/(^\s*)|(\s*$)/g, '');                 // strip leading/trailing whitespace
      return s.split('\n');
    }

    _restoreSentences(sentences, sentenceCounts) {
      const restored = [];
      let i = 0;
      for (const count of sentenceCounts) {
        restored.push(sentences.slice(i, i + count).join(' '));
        i += count;
      }
      return restored;
    }

    _restorePunctuation(sentences, punctuation, markers) {
      const sentencesCopy = [...sentences];
      const punctuationCopy = [...punctuation];
      const result = [];
      for (const marker of markers) {
        if (marker === 'content') {
          result.push(sentencesCopy.shift());
        } else {
          result.push(punctuationCopy.shift());
        }
      }
      return result.join('');
    }

    async split(
      text,
      fromScheme = null,
      toScheme = null,
      splitterModel = 'dharmamitra_2024_sept',
      preserveCompoundHyphens = PRESERVE_COMPOUND_HYPHENS_DEFAULT,
      preservePunctuation = PRESERVE_PUNCTUATION_DEFAULT,
    ) {
      /**
       * Splits sandhi and compounds of multi-line Sanskrit string,
       * passing maximum of maxCharLimit characters to the splitter at a time,
       * and preserving original newlines and punctuation.
       *
       * fromScheme: input transliteration scheme (null = auto-detect).
       * toScheme:   output transliteration scheme (null = IAST, the hub scheme).
       * Processing always happens in IAST; transliteration wraps the call if needed.
       *
       * Returns a Promise<string>.
       */

      // transliterate input to IAST (auto-detects if fromScheme is null)
      const T = new Transliterator();
      text = T.transliterate(text, fromScheme, 'IAST');

      // save original punctuation
      const { sentences, punctuation, markers } = this._getSentencesAndPunctuation(text);
      if (punctuation.length - sentences.length > 1) {
        throw new Error('Punctuation and sentence count mismatch');
      }

      // split sentences that are too long for the splitter
      const hyphenKey = preserveCompoundHyphens ? 'hyphens' : 'no-hyphens';
      const limitKey = `${splitterModel},${hyphenKey}`;
      const charLimit = this.maxCharLimit[limitKey] || 128;

      const { newTextLines: safeSentences, sentenceCounts } = this._enforceCharLimit(sentences, charLimit);
      const sentencesStr = safeSentences.join('\n');

      let splitSentences;

      if (splitterModel === 'dharmamitra_2024_sept') {
        splitSentences = await this._getDharmamitraSplit(sentencesStr, preserveCompoundHyphens);
      } else if (splitterModel === 'splitter_2018') {
        const splitStr = await this._postString2018(sentencesStr);
        splitSentences = this._cleanUp2018(splitStr);
      } else {
        throw new Error(`Invalid splitter model: ${splitterModel}`);
      }

      // restore sentences split to enforce character limit
      const restoredSentences = this._restoreSentences(splitSentences, sentenceCounts);

      // restore punctuation
      let finalResults;
      if (preservePunctuation && punctuation.length > 0) {
        finalResults = this._restorePunctuation(restoredSentences, punctuation, markers);
      } else {
        finalResults = restoredSentences.join('\n').replace(/_/g, ' ');
      }

      // transliterate output from IAST if requested
      if (toScheme !== null && toScheme.toUpperCase() !== 'IAST') {
        finalResults = T.transliterate(finalResults, 'IAST', toScheme);
      }

      return finalResults;
    }
  }

  var version = "2.1.3";

  // Main entry point for the skrutable JavaScript library
  // Sanskrit text processing toolkit for transliteration, scansion, and meter identification

  // Convenience functions for common use cases
  class Skrutable {
    constructor() {
      this.transliterator = new Transliterator();
      this.scanner = new Scanner();
      this.meterIdentifier = new MeterIdentifier();
      this.splitter = new Splitter();
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
     * Split sandhi and compounds of Sanskrit text
     * @param {string} text - Sanskrit text to split
     * @param {string} fromScheme - Input scheme (optional, auto-detected if null)
     * @param {string} toScheme - Output scheme (optional, defaults to IAST)
     * @param {string} splitterModel - 'dharmamitra_2024_sept' or 'splitter_2018'
     * @param {boolean} preserveCompoundHyphens - Whether to mark compound boundaries with hyphens
     * @param {boolean} preservePunctuation - Whether to preserve original punctuation
     * @returns {Promise<string>} Split text
     */
    split(text, fromScheme = null, toScheme = null, splitterModel = 'dharmamitra_2024_sept', preserveCompoundHyphens = true, preservePunctuation = true) {
      return this.splitter.split(text, fromScheme, toScheme, splitterModel, preserveCompoundHyphens, preservePunctuation);
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

  exports.MeterIdentifier = MeterIdentifier;
  exports.Scanner = Scanner;
  exports.Skrutable = Skrutable;
  exports.Splitter = Splitter;
  exports.Transliterator = Transliterator;
  exports.Verse = Verse;
  exports.meter_melodies = meter_melodies;
  exports.version = version;

}));
