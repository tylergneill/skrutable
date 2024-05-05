from skrutable import scheme_maps

SLP_short_vowels = ['a','i','u','f','x','ĕ','ŏ'] # latter two exceptions for one-char principle
SLP_long_vowels = ['A','I','U','F','X','e','E','o','O']
SLP_vowels = SLP_short_vowels + SLP_long_vowels

SLP_vowels_with_mAtrAs = SLP_vowels[1:] # exclude 'a'

# the below line up with SLP above: first short vowels, then long vowels
DEV_vowel_mAtrAs = ['ि', 'ु', 'ृ', 'ॢ', 'े', 'ो', 'ा', 'ी', 'ू', 'ॄ', 'ॣ', 'े', 'ै', 'ो', 'ौ']
BENGALI_vowel_mAtrAs = ['ি', 'ু', 'ৃ', 'ৢ', 'ে', 'ো', 'া', 'ী', 'ূ', 'ৄ', 'ৣ', 'ে', 'ৈ', 'ো', 'ৌ']
GUJARATI_vowel_mAtrAs = ['િ', 'ુ', 'ૃ', 'ૢ',  'ે',  'ો', 'ા', 'ી', 'ૂ', 'ૄ',  'ૣ',  'ે',  'ૈ',  'ો',  'ૌ']

# dict of dicts
# use like e.g. vowel_mAtrA_lookup['DEV']['o'] or vowel_mAtrA_lookup['BENGALI']['u']
vowel_mAtrA_lookup = {
'DEV': dict(zip(SLP_vowels_with_mAtrAs, DEV_vowel_mAtrAs)),
'BENGALI': dict(zip(SLP_vowels_with_mAtrAs, BENGALI_vowel_mAtrAs)),
'GUJARATI': dict(zip(SLP_vowels_with_mAtrAs, GUJARATI_vowel_mAtrAs)),
}

vowels_that_preempt_virAma =  ( SLP_vowels + DEV_vowel_mAtrAs +
                                BENGALI_vowel_mAtrAs + GUJARATI_vowel_mAtrAs )

SLP_unvoiced_consonants = ['k','K','c','C','w','W','t','T','p','P','z','S','s']
SLP_voiced_consonants = ['g','G','N','j','J','Y','q','Q','R','d','D','n','b','B','m','y','r','l','v','h']

SLP_consonants = SLP_unvoiced_consonants + SLP_voiced_consonants
"""Voice distinguished for sake of destroy_spaces functionality.
For transliteration, 'consonant' means 'needs virāma if non-vowel follows' (no M H)
"""

SLP_consonants_for_scansion = SLP_consonants
"""For scansion, 'consonant' means 'contributes to heaviness of previous vowel' (yes M H)"""

DEV_consonants = ['क', 'ख', 'ग', 'घ', 'ङ','च', 'छ', 'ज', 'झ', 'ञ',
'ट', 'ठ', 'ड', 'ढ', 'ण','त', 'थ', 'द', 'ध', 'न','प', 'फ', 'ब', 'भ', 'म',
'य', 'र', 'ल', 'व','श', 'ष', 'स', 'ह']

BENGALI_consonants = ['ক', 'খ', 'গ', 'ঘ', 'ঙ','চ', 'ছ', 'জ', 'ঝ', 'ঞ',
'ট', 'ঠ', 'ড', 'ঢ', 'ণ','ত', 'থ', 'দ', 'ধ', 'ন','প', 'ফ', 'ব', 'ভ', 'ম',
'য', 'র', 'ল', 'ব','শ', 'ষ', 'স', 'হ']

GUJARATI_consonants = ['ક', 'ખ', 'ગ', 'ઘ', 'ઙ','ચ', 'છ', 'જ', 'ઝ', 'ઞ',
'ટ', 'ઠ', 'ડ', 'ઢ', 'ણ','ત', 'થ', 'દ', 'ધ', 'ન','પ', 'ફ', 'બ', 'ભ', 'મ',
'ય', 'ર', 'લ', 'વ','શ', 'ષ', 'સ', 'હ']

# lookup table to use like e.g. SLP_and_indic_consonants['BENGALI']
SLP_and_indic_consonants =   (  SLP_consonants + DEV_consonants +
                                BENGALI_consonants + GUJARATI_consonants )

# build character sets for use in cleaning for scansion

Roman_upper = [chr(n) for n in range(65,91)]
Roman_lower = [chr(n) for n in range(97,123)]

SLP_chars = ( [ c for c in Roman_upper if c not in ['L','V','Z'] ]
        + Roman_lower )

IAST_chars = ( [c for c in Roman_lower if c not in ['f','q','w','x','z'] ]
        + ['ñ','ā','ī','ś','ū','ḍ','ḥ','ḷ','ḹ','ṃ','ṅ','ṇ','ṛ','ṝ','ṣ','ṭ','ẖ','ḫ','ï','ü','ĕ','ŏ']
		+ ['̄', '́', '̇', '̣', '̥', '̱', '̮', '̱', 'ṁ', 'ē', 'ō'] ) # also accept ISO etc. alternates
		# need to add more in case of capital letters, etc.; see scheme_maps.IAST_SLP

HK_chars = ( ['A','D','G','H','I','J','M','N','R','S','T','U']
        + [c for c in Roman_lower if c not in ['f','q','w','x'] ] )

VH_chars = ( ['B','C','D','G','J','K','L','P','R','T'] + ['"','.','~']
    + [ c for c in Roman_lower if c not in ['f','q','w','x','z'] ] )

ITRANS_chars = ( ['C','D','E','I','L','N','O','R','S','T'] + ['.','^','~']
+ [c for c in Roman_lower if c not in ['f','q','v','x','z'] ] )

# build Indic sets from respective scheme maps, but exclude numbers

virAmas = {
'DEV' : '्',
'BENGALI' : '্',
'GUJARATI' : '્',
}

DEV_nums =          ['१','२','३','४','५','६','७','८','९','०']
BENGALI_nums =      ['১','২','৩','৪','৫','৬','৭','৮','৯','০']
GUJARATI_nums =     ['૧','૨','૩','૪','૫','૬','૭','૮','૯','૦']

DEV_chars = ([ virAmas['DEV'] ]
             + [tup[0] for tup in scheme_maps.DEV_SLP if tup[0] not in DEV_nums])

BENGALI_chars = ([ virAmas['BENGALI'] ]
                 + [tup[0] for tup in scheme_maps.BENGALI_SLP if tup[0] not in BENGALI_nums])

GUJARATI_chars = ([ virAmas['GUJARATI'] ]
                  + [tup[0] for tup in scheme_maps.GUJARATI_SLP if tup[0] not in GUJARATI_nums])

# lookup table to use like e.g. character_set['HK']
character_set = {
'SLP': SLP_chars,
'IAST': IAST_chars,
'HK': HK_chars,
'DEV': DEV_chars,
'BENGALI': BENGALI_chars,
'GUJARATI': GUJARATI_chars,
'VH': VH_chars,
'ITRANS': ITRANS_chars
}
# add standard whitespace to all scansion character sets
to_add = [' ', '\t', '\n']
for k in character_set.keys():
	for c in to_add:
		character_set[k].append(c)
