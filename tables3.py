IAST_SLP = [
# Group 1: highest priority to avoid bleeding/feeding
('ṭh','W'),
('ṭ','w'),
('ḍh','Q'),
('ḍ','q'),
# Group 2: remaining precomposed characters
('ā','A'),
('ī','I'),
('ū','U'),
('ṛ','f'),
('ṝ','F'),
('ḷ','x'),
('ḹ','X'),
('ai','E'),
('au','O'),
('ṃ','M'),
('ḥ','H'),
('kh','K'),
('gh','G'),
('ṅ','N'),
('ch','C'),
('jh','J'),
('ñ','Y'),
('ṇ','R'),
('th','T'),
('dh','D'),
('ph','P'),
('bh','B'),
('ś','S'),
('ṣ','z'),
# Group x: same for these schemes: a, i, u, k, g, c, j, t, d, p, b, s, h
# Group y: not supported by second scheme: ẖ, ḫ
]

SLP_SLP = []

SLP_DEV = [
('a', 'अ'),
('A', 'आ'),
('i', 'इ'),
('I', 'ई'),
('u', 'उ'),
('U', 'ऊ'),
('f', 'ऋ'),
('F', 'ॠ'),
('x', 'ऌ'),
('X', 'ॡ'),
('e', 'ए'),
('E', 'ऐ'),
('o', 'ओ'),
('O', 'औ'),
('M', 'ं'),
('H', 'ः'),
('k', 'क'),
('K', 'ख'),
('g', 'ग'),
('G', 'घ'),
('N', 'ङ'),
('c', 'च'),
('C', 'छ'),
('j', 'ज'),
('J', 'झ'),
('Y', 'ञ'),
('w', 'ट'),
('W', 'ठ'),
('q', 'ड'),
('Q', 'ढ'),
('R', 'ण'),
('t', 'त'),
('T', 'थ'),
('d', 'द'),
('D', 'ध'),
('n', 'न'),
('p', 'प'),
('P', 'फ'),
('b', 'ब'),
('B', 'भ'),
('m', 'म'),
('y', 'य'),
('r', 'र'),
('l', 'ल'),
('v', 'व'),
('S', 'श'),
('z', 'ष'),
('s', 'स'),
('h', 'ह'),
("'", 'ऽ'),
("’", 'ऽ'), # points to possible usefulness of general "standardizing" step
]

DEV_SLP = [
('अ', 'a'),
('आ', 'A'),
('इ', 'i'),
('ई', 'I'),
('उ', 'u'),
('ऊ', 'U'),
('ऋ', 'f'),
('ॠ', 'F'),
('ऌ', 'x'),
('ॡ', 'X'),
('ए', 'e'),
('ऐ', 'E'),
('ओ', 'o'),
('औ', 'O'),
('ं', 'M'),
('ः', 'H'),
('क', 'k'),
('ख', 'K'),
('ग', 'g'),
('घ', 'G'),
('ङ', 'N'),
('च', 'c'),
('छ', 'C'),
('ज', 'j'),
('झ', 'J'),
('ञ', 'Y'),
('ट', 'w'),
('ठ', 'W'),
('ड', 'q'),
('ढ', 'Q'),
('ण', 'R'),
('त', 't'),
('थ', 'T'),
('द', 'd'),
('ध', 'D'),
('न', 'n'),
('प', 'p'),
('फ', 'P'),
('ब', 'b'),
('भ', 'B'),
('म', 'm'),
('य', 'y'),
('र', 'r'),
('ल', 'l'),
('व', 'v'),
('श', 'S'),
('ष', 'z'),
('स', 's'),
('ह', 'h'),
('ऽ', "'"),
('ा', 'A'),
('ि', 'i'),
('ी', 'I'),
('ु', 'u'),
('ू', 'U'),
('ृ', 'f'),
('ॄ', 'F'),
('ॢ', 'x'),
('ॣ', 'X'),
('े', 'e'),
('ै', 'E'),
('ो', 'o'),
('ौ', 'O'),
# numbers too
('१', '1'),
('२', '2'),
('३', '3'),
('४', '4'),
('५', '5'),
('६', '6'),
('७', '7'),
('८', '8'),
('९', '9'),
('०', '0'),
]

SLP_IAST = [
# precomposed IAST only, under-dots instead of under-circles
('A','ā'),
('I','ī'),
('U','ū'),
('f','ṛ'),
('F','ṝ'),
('x','ḷ'),
('X','ḹ'),
('E','ai'),
('O','au'),
('M','ṃ'),
('H','ḥ'),
('K','kh'),
('G','gh'),
('N','ṅ'),
('C','ch'),
('J','jh'),
('Y','ñ'),
('w','ṭ'),
('W','ṭh'),
('q','ḍ'),
('Q','ḍh'),
('R','ṇ'),
('T','th'),
('D','dh'),
('P','ph'),
('B','bh'),
('S','ś'),
('z','ṣ'),
]

maps_by_name = {
'IAST_SLP' : IAST_SLP,
'SLP_SLP' : SLP_SLP,
'SLP_DEV' : SLP_DEV,
'DEV_SLP' : DEV_SLP,
'SLP_IAST' : SLP_IAST,
}

SLP_short_vowels = ['a','i','u','f','x']
SLP_long_vowels = ['A','I','U','F','X','e','E','o','O']
SLP_vowels = SLP_short_vowels + SLP_long_vowels # len == 14

SLP_vowels_with_mAtrAs = SLP_vowels[1:] # exclude 'a'
DEV_vowel_mAtrAs = ['ि', 'ु', 'ृ', 'ॢ', 'ा', 'ी', 'ू', 'ॄ', 'ॣ', 'े', 'ै', 'ो', 'ौ']
# both len == 13
SLP_vowels_to_DEV_vowel_mAtrAs = dict(zip(SLP_vowels_with_mAtrAs, DEV_vowel_mAtrAs))
vowels_that_preempt_virAma = SLP_vowels + DEV_vowel_mAtrAs

SLP_unvoiced_consonants = ['k','K','c','C','w','W','t','T','p','P','z','S','s']
SLP_voiced_consonants = ['g','G','N','j','J','Y','q','Q','R','d','D','n','b','B','m','y','r','l','v','h']
SLP_consonants = SLP_unvoiced_consonants + SLP_voiced_consonants

SLP_consonants_for_syllabification = SLP_consonants + ['M','H']
"""
	for purpose of transliterating: 'consonant' = 'needs to be followed by virAma if not followed by vowel'
		this excludes anusvAra M and visarga H
	for purpose of syllabifying, esp. across marked lines: consonant = 'contributes to heaviness by position'
		this includes anusvAra M and visarga H
		these are currently added to the set at the time of syllabification
"""

DEV_consonants = [
'क', 'ख', 'ग', 'घ', 'ङ',
'च', 'छ', 'ज', 'झ', 'ञ',
'ट', 'ठ', 'ड', 'ढ', 'ण',
'त', 'थ', 'द', 'ध', 'न',
'प', 'फ', 'ब', 'भ', 'म',
'य', 'र', 'ल', 'व',
'श', 'ष', 'स',
'ह',
]

SLP_and_DEV_consonants = SLP_consonants + DEV_consonants
