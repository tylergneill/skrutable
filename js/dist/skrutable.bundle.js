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
    ...Roman_lower
  ];

  const IAST_chars = [
    ...Roman_lower.filter(c => !['f','q','w','x','z'].includes(c)),
    ...'ñāīśūḍḥḷḹṃṅṇṛṝṣṭẖḫïüĕŏ'.split(''),
    ...'̣̥̱̮̱̄́̇ṁēō'.split('') // also accept ISO etc. alternates
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
    'ा', 'ि', 'ी', 'ु', 'ू', 'ृ', 'ॄ', 'ॢ', 'ॣ', 'े', 'ै', 'ो', 'ौ', 'ं', 'ः'
  ];

  const BENGALI_chars = [
    virAmas['BENGALI'],
    // Add common Bengali characters
    'অ', 'আ', 'ই', 'ঈ', 'উ', 'ঊ', 'ঋ', 'ৠ', 'ঌ', 'ৡ', 'এ', 'ঐ', 'ও', 'ঔ',
    'ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ', 'ট', 'ঠ', 'ড', 'ঢ', 'ণ',
    'ত', 'থ', 'দ', 'ধ', 'ন', 'প', 'ফ', 'ব', 'ভ', 'ম', 'য', 'র', 'ল', 'ব', 'শ', 'ষ', 'স', 'হ', 'ঽ',
    'া', 'ি', 'ী', 'ু', 'ূ', 'ৃ', 'ৄ', 'ৢ', 'ৣ', 'ে', 'ৈ', 'ো', 'ৌ', 'ং', 'ঃ'
  ];

  const GUJARATI_chars = [
    virAmas['GUJARATI'],
    // Add common Gujarati characters
    'અ', 'આ', 'ઇ', 'ઈ', 'ઉ', 'ઊ', 'ઋ', 'ૠ', 'ઌ', 'ૡ', 'એ', 'ઐ', 'ઓ', 'ઔ',
    'ક', 'ખ', 'ગ', 'ઘ', 'ઙ', 'ચ', 'છ', 'જ', 'ઝ', 'ઞ', 'ટ', 'ઠ', 'ડ', 'ઢ', 'ણ',
    'ત', 'થ', 'દ', 'ધ', 'ન', 'પ', 'ફ', 'બ', 'ભ', 'મ', 'ય', 'ર', 'લ', 'વ', 'શ', 'ષ', 'સ', 'હ', 'ઽ',
    'ા', 'િ', 'ી', 'ુ', 'ૂ', 'ૃ', 'ૄ', 'ૢ', 'ૣ', 'ે', 'ૈ', 'ો', 'ૌ', 'ં', 'ઃ'
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
      // Normalization 1: merge of combining diacritics to precomposed combinations
      ['ā','ā'],['Ā','ā'],['Ā','ā'], // case also lowered throughout
      ['ī','ī'],['Ī','ī'],['Ī','ī'],
      ['ï','ï'], // for Prakrit
      ['ū','ū'],['Ū','ū'],['Ū','ū'],
      ['ü','ü'], // for Prakrit
      ['ṛ','ṛ'],['Ṛ','ṛ'],['Ṛ','ṛ'],
      ['ṝ','ṝ'],          ['Ṝ','ṝ'], // r ̣ ̄ R ̣ ̄
      ['ṝ','ṝ'],          ['Ṝ','ṝ'], // r ̄ ̣ R ̄ ̣
      ['ṝ','ṝ'],          ['Ṝ','ṝ'], // ṛ ̄	Ṛ ̄
      ['ḷ','ḷ'],['Ḷ','ḷ'],['Ḷ','ḷ'],
      ['ḹ','ḹ'],          ['Ḹ','ḹ'], // l ̣ ̄ L ̣ ̄
      ['ḹ','ḹ'],          ['Ḹ','ḹ'], // l ̄ ̣ L ̄ ̣
      ['ḹ','ḹ'],          ['Ḹ','ḹ'], // ḷ ̄ Ḷ ̄
      ['ṅ','ṅ'],['Ṅ','ṅ'],['Ṅ','ṅ'],
      ['ñ','ñ'],['Ñ','ñ'],['Ñ','ñ'],
      ['ṭ','ṭ'],['Ṭ','ṭ'],['Ṭ','ṭ'],
      ['ḍ','ḍ'],['Ḍ','ḍ'],['Ḍ','ḍ'],
      ['ṇ','ṇ'],['Ṇ','ṇ'],['Ṇ','ṇ'],
      ['ś','ś'],['Ś','ś'],['Ś','ś'],
      ['ṣ','ṣ'],['Ṣ','ṣ'],['Ṣ','ṣ'],
      ['ḥ','ḥ'],['Ḥ','ḥ'],['Ḥ','ḥ'],
      ['ẖ','ẖ'],['H̱','h'],
      ['ḫ','ḫ'],['Ḫ','h'],['Ḫ','h'],
      ['ṃ','ṃ'],['Ṃ','ṃ'],['Ṃ','ṃ'],
      // Normalization 2: change of ISO under-circles to under-dots, also ṁ's, ē's, ō's
      ['r̥','ṛ'],['R̥','ṛ'],
      ['r̥̄','ṝ'],['R̥̄','ṝ'],
      ['r̥̄','ṝ'],['R̥̄','ṝ'],
      ['l̥','ḷ'],['L̥','ḷ'],
      ['l̥̄','ḹ'],['L̥̄','ḹ'],
      ['l̥̄','ḹ'],['L̥̄','ḹ'],
      ['ṁ','ṃ'],['ṁ','ṃ'],
      ['ē','e'],['ē','e'],['ĕ','ĕ'],
      ['ō','o'],['ō','o'],['ŏ','ŏ'],
      // Normalization 3: lowering of remaining uppercase
      ['A','a'],['B','b'],['C','c'],['D','d'],['E','e'],
      ['F','f'],['G','g'],['H','h'],['I','i'],['J','j'],
      ['K','k'],['L','l'],['M','m'],['N','n'],['O','o'],
      ['P','p'],['Q','q'],['R','r'],['S','s'],['T','t'],
      ['U','u'],['V','v'],['W','w'],['X','x'],['Y','y'],['Z','z'],
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
      ['w', 'v'],
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
      ['ee', 'e'],
      ['oo', 'o'],
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
      ['.h', 'H'],
      ['.a', "'"],
      ["'", "'"]
  ];

  // SLP to SLP (identity with normalization)
  const SLP_SLP = [
      // Normalization 1: avagraha
      ["'", "'"]
  ];

  // SLP to IAST mappings
  const SLP_IAST = [
      // Transliteration 1: all simple mappings
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
      ['v','w'],
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
      ['e','ee'],
      ['o','oo'],
      ['E','ai'],
      ['O','au'],
      ['M','.m'],
      ['H','.h'],
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

  // Scheme detection for Sanskrit text processing
  // Simplified implementation without full Mahabharata vectors

  const auto_detect_synonyms = [
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

  class SchemeDetector {
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
    }};

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

    transliterate(
      cntnts,
      fromScheme = null,
      toScheme = null,
      avoidViramaIndicScripts = AVOID_VIRAMA_INDIC_SCRIPTS_DEFAULT,
      avoidViramaNonIndicScripts = AVOID_VIRAMA_NON_INDIC_SCRIPTS_DEFAULT
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

  // Main entry point for the skrutable JavaScript library
  // Sanskrit text processing toolkit for transliteration, scansion, and meter identification

  // Convenience functions for common use cases
  class Skrutable {
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

  exports.Skrutable = Skrutable;

}));
