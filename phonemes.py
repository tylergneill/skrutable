SLP_short_vowels = ['a','i','u','f','x']
SLP_long_vowels = ['A','I','U','F','X','e','E','o','O']
SLP_vowels = SLP_short_vowels + SLP_long_vowels

SLP_vowels_with_mAtrAs = SLP_vowels[1:] # exclude 'a'

# the below line up with SLP above: first short vowels, then long vowels
DEV_vowel_mAtrAs = ['ि', 'ु', 'ृ', 'ॢ', 'ा', 'ी', 'ू', 'ॄ', 'ॣ', 'े', 'ै', 'ो', 'ौ']
BENGALI_vowel_mAtrAs = ['ি', 'ু', 'ৃ', 'ৢ', 'া', 'ী', 'ূ', 'ৄ', 'ৣ', 'ে', 'ৈ', 'ো', 'ৌ']
GUJARATI_vowel_mAtrAs = ['િ', 'ુ', 'ૃ', 'ૢ', 'ા', 'ી', 'ૂ', 'ૄ',  'ૣ',  'ે',  'ૈ',  'ો',  'ૌ']

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

SLP_consonants_for_scansion = SLP_consonants + ['M','H']
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

# use like e.g. SLP_and_indic_consonants_lookup['BENGALI']
SLP_and_indic_consonants =   (  SLP_consonants + DEV_consonants +
                                BENGALI_consonants + GUJARATI_consonants )
