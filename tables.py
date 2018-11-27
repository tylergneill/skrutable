#!/usr/bin/env python
# -*- coding: utf-8 -*-


"""
	TRANSLITERATION MAPPINGS
"""


# summary of available transliteration schemes as presented to user
available_schemes = ['IAST', 'SLP', 'HK', 'VH', 'DEV', 'ITRANS', 'IASTreduced']
# held out: 'OAST'

"""
	Character mappings, as ordered lists of tuples, for use with string.replace().
	Note: DEV, IAST, HK, VH all routed via SLP.
	Not yet supported: ITRANS, REE, CSX.
"""

IAST_SLP = [
# first clean IAST of: lowercase back-combining, uppercase precomposed, uppercase back-combining
('ā','ā'),('Ā','ā'),('Ā','ā'),
('ī','ī'),('Ī','ī'),('Ī','ī'),
('ū','ū'),('Ū','ū'),('Ū','ū'),
('ṛ','ṛ'),('Ṛ','ṛ'),('Ṛ','ṛ'),
('ṝ','ṝ'),			('Ṝ','ṝ'), # r ̣ ̄  R ̣ ̄   (might be reduced to ṛ ̄  Ṛ ̄  in the wild)
('ṝ','ṝ'),			('Ṝ','ṝ'), # r ̄ ̣  R ̄ ̣	
('ṝ','ṝ'),			('Ṝ','ṝ'), # ṛ ̄	Ṛ ̄
('ḷ','ḷ'),('Ḷ','ḷ'),('Ḷ','ḷ'),
('ḹ','ḹ'),			('Ḹ','ḹ'), # l ̣ ̄  L ̣ ̄	(might be reduced to ḷ ̄  Ḷ ̄  in the wild)
('ḹ','ḹ'),			('Ḹ','ḹ'), # l ̄ ̣  L ̄ ̣
('ḹ','ḹ'),	 		('Ḹ','ḹ'), # ḷ ̄	Ḷ ̄
('ṅ','ṅ'),('Ṅ','ṅ'),('Ṅ','ṅ'),
('ñ','ñ'),('Ñ','ñ'),('Ñ','ñ'),
('ṭ','ṭ'),('Ṭ','ṭ'),('Ṭ','ṭ'),
('ḍ','ḍ'),('Ḍ','ḍ'),('Ḍ','ḍ'),
('ṇ','ṇ'),('Ṇ','ṇ'),('Ṇ','ṇ'),
('ś','ś'),('Ś','ś'),('Ś','ś'),
('ṣ','ṣ'),('Ṣ','ṣ'),('Ṣ','ṣ'),
('ḥ','ḥ'),('Ḥ','ḥ'),('Ḥ','ḥ'),
('ṃ','ṃ'),('Ṃ','ṃ'),('Ṃ','ṃ'),
# then clean of: theoretically preferred under-circles
('r̥','ṛ'),('R̥','ṛ'),
('r̥̄','ṝ'),('R̥̄','ṝ'),
('r̥̄','ṝ'),('R̥̄','ṝ'),
('l̥','ḷ'),('L̥','ḷ'),
('l̥̄','ḹ'),('L̥̄','ḹ'),
('l̥̄','ḹ'),('L̥̄','ḹ'),
# then clean of: remaining uppercase
('A','a'),('B','b'),('C','c'),('D','d'),('E','e'),
('F','f'),('G','g'),('H','h'),('I','i'),('J','j'),
('K','k'),('L','l'),('M','m'),('N','n'),('O','o'),
('P','p'),('Q','q'),('R','r'),('S','s'),('T','t'),
('U','u'),('V','v'),('W','w'),('X','x'),('Y','y'),('Z','z'),
# Group 1: ordered mappings to avoid bleeding/feeding
('ṭh','W'),
('ṭ','w'),
('ḍh','Q'),
('ḍ','q'),
# Group 2: remaining mappings of standard precomposed 
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
]

SLP_SLP = []

HK_SLP = [
# Group 1: ordered mappings to avoid bleeding/feeding
('lRR','X'), 
('RR','F'),
('lR','x'),
('R','f'),
('N','R'),
('G','N'),
('gh','G'),
('Th','W'),
('T','w'),
('Dh','Q'),
('D','q'),
('th','T'),
('dh','D'),
('J','Y'),
('jh','J'),
# Group 2: "Duke of York gambit" to avoid feeding in direct swap
('z','Z'), # Z not used in either scheme
('S','z'), 
('Z','S'),
# Group 3: simpler remaining mappings
('ai','E'), 
('au','O'),
('kh','K'),
('ch','C'),
('ph','P'),
('bh','B'),
]

VH_SLP = [
# First avoid latter 'a' part of avagraha being confused for prior 'a' part of diphthongs
('.a',"'"),
# Rest: simpler remaining mappings
('aa','A'),
('ii','I'),
('uu','U'),
('.r','f'),
('.R','F'),
('.l','x'),
('.L','X'),
('ai','E'),
('au','O'),
('.m','M'),
('.h','H'),
('"n','N'),
('~n','Y'),
('.t','w'),
('.T','W'),
('.d','q'),
('.D','Q'),
('.n','R'),
('"s','S'),
('.s','z'),
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

OAST_SLP = [
('å','A'),
('å','A'), # separable
('Å','A'), # uppercase
('ï','I'),
('ï','I'), # separable
('÷','U'),
('ø','U'), # not sure why another one...
('ü','U'), # uppercase ??? just educated guess for now...
('Ÿ','f'),
(chr(127),'f'), # uppercase
('ÿ','f'), # separable
('&','E'),
('(','O'),
('§','K'),
('³','G'),
('¼','N'),
('+','C'),
('ñ','Y'), # separable
#	jh...
('¶','w'),
('–','w'), # uppercase
('—','w'), # alternate uppercase?
('·','q'),
('®','W'),
#	ḍh...
('¾', 'R'),
('½','R'), # not sure why another one...
#	th...
#	dh...
('ö','P'),
('ä','B'),
('¸','S'),
('˜','S'), # uppercase
('¹','z'),
('º','M'),
('µ','H'),
]

ITRANS_SLP = [
('aa', 'A'),
('ii', 'I'),
('uu', 'U'),
('ee', 'e'),
('oo', 'o'),
('E', 'e'),
('ai', 'E'),
('O', 'o'),
('au', 'O'),

('RRi', 'f'),
('RRI', 'F'),
('LLi', 'x'),
('LLI', 'X'),
('Ri', 'f'),
('R^i', 'f'),
('RI', 'F'),
('R^I', 'F'),
('Li', 'x'),
('L^i', 'x'),
('LI', 'X'),
('L^I', 'X'),

('w', 'v'),
('T', 'w'),
('Th', 'W'),
('D', 'q'),
('Dh', 'Q'),
('th', 'T'),
('dh', 'D'),

('N', 'R'),
('~N', 'N'),

('.m', 'M'),
('kh', 'K'),
('gh', 'G'),
('ch', 'c'),
('Ch', 'C'),
('jh', 'J'),
('~n', 'Y'),
('ph', 'P'),
('bh', 'B'),
('sh', 'S'),
('Sh', 'z'),
('.h', ''),
('.a', "'"),
]

# eventually also REE, CSX, etc.

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

SLP_HK = [
# Group 1: ordered mappings to avoid bleeding/feeding
('G','gh'),
('N','G'),
('R','N'),
('f','R'),
('F','RR'),
('x','lR'),
('X','lRR'),
('T','th'),
('D','dh'),
('w','T'),
('W','Th'),
('q','D'),
('Q','Dh'),
('J','jh'),
('Y','J'),
# Group 2: "Duke of York gambit" to avoid feeding in direct swap
('S','Z'), # Z not used in either scheme
('z','S'),
('Z','z'),
# Group 3: simpler remaining mappings
('E','ai'),
('O','au'),
('K','kh'),
('C','ch'),
('P','ph'),
('B','bh'),
]

SLP_VH = [
('A','aa'),
('I','ii'),
('U','uu'),
('f','.r'),
('F','.R'),
('x','.l'),
('X','.L'),
('E','ai'),
('O','au'),
('M','.m'),
('H','.h'),
('N','"n'),
('Y','~n'),
('w','.t'),
('W','.T'),
('q','.d'),
('Q','.D'),
('R','.n'),
('S','"s'),
('z','.s'),
("'",'.a'),
]

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

SLP_OAST = [ # OUT OF DATE, DON'T USE YET
('A','å'),
('I','ï'),
('U','÷'),
('f','Ÿ'),
('E','&'),
('O','('),
('K','§'),
('G','³'),
('N','¼'),
('C','+'),
#	jh...
('w','¶'),
('q','·'),
('W','®'),
#	ḍh...
('R','½'),
('T','Å'),
('D','ü'),
('P','ö'),
('B','ä'),
('S','¸'),
('z','¹'),
('M','º'),
('H','µ'),
]

SLP_IASTreduced = [
('A','a'),
('I','i'),
('U','u'),
('f','r'),
('F','r'),
('x','l'),
('X','l'),
('E','ai'),
('O','au'),
('M','m'),
('H','h'),
('K','kh'),
('G','gh'),
('N','n'),
('C','ch'),
('J','jh'),
('Y','n'),
('w','t'),
('W','th'),
('q','d'),
('Q','dh'),
('R','n'),
('T','th'),
('D','dh'),
('P','ph'),
('B','bh'),
('S','s'),
('z','s'),
]

# dictionary facilitating easy use of above mapping lists via text strings
maps_by_name = {
'SLP_DEV' : SLP_DEV,
'DEV_SLP' : DEV_SLP,
'IAST_SLP' : IAST_SLP,
'SLP_IAST' : SLP_IAST,
'HK_SLP' : HK_SLP,
'SLP_HK' : SLP_HK,
'VH_SLP' : VH_SLP,
'SLP_VH' : SLP_VH,
'SLP_SLP' : SLP_SLP,
'ITRANS_SLP' : ITRANS_SLP,
'OAST_SLP' : OAST_SLP,
'SLP_IASTreduced' : SLP_IASTreduced,
}


"""
	PHONETIC AND PRACTICAL GROUPINGS
	FOR TRANSLITERATION AND SCANSION
"""

short_vowels_SLP = ['a','i','u','f','x']
long_vowels_SLP = ['A','I','U','F','X','e','E','o','O']
DEV_vowel_mAtrAs = ['ि', 'ु', 'ृ', 'ॢ', 'ा', 'ी', 'ू', 'ॄ', 'ॣ', 'े', 'ै', 'ो', 'ौ'] # shorts, longs

all_vowels_SLP = short_vowels_SLP + long_vowels_SLP
all_vowels_SLP_unicode = [v.decode('utf-8') for v in all_vowels_SLP]

SLP_vowels_that_have_mAtrAs_unicode = all_vowels_SLP_unicode[1:]
DEV_vowel_mAtrAs_unicode = [v.decode('utf-8') for v in DEV_vowel_mAtrAs]

SLP_vowels_to_DEV_mAtrAs_unicode = {}
for i, k in enumerate(SLP_vowels_that_have_mAtrAs_unicode):
	SLP_vowels_to_DEV_mAtrAs_unicode[k] = DEV_vowel_mAtrAs_unicode[i]

virAma_cancelling_vowels_unicode = all_vowels_SLP_unicode + DEV_vowel_mAtrAs_unicode

unvoiced_consonants_SLP = ['k','K','c','C','w','W','t','T','p','P','z','S','s']
voiced_consonants_SLP = ['g','G','N','j','J','Y','q','Q','R','d','D','n','b','B','m','y','r','l','v','h']

all_consonants_SLP = unvoiced_consonants_SLP + voiced_consonants_SLP
"""
	for purpose of transliterating: 'consonant' = 'needs to be followed by virAma if not followed by vowel'
		this excludes anusvAra M and visarga H
	for purpose of syllabifying, esp. across marked lines: consonant = 'contributes to heaviness by position'
		this includes anusvAra M and visarga H
		these are currently added to the set at the time of syllabification
"""

all_consonants_DEV = [
'क', 'ख', 'ग', 'घ', 'ङ',
'च', 'छ', 'ज', 'झ', 'ञ',
'ट', 'ठ', 'ड', 'ढ', 'ण',
'त', 'थ', 'द', 'ध', 'न',
'प', 'फ', 'ब', 'भ', 'म',
'य', 'र', 'ल', 'व',
'श', 'ष', 'स',
'ह',
] 

all_consonants_BOTH = all_consonants_SLP + all_consonants_DEV
all_consonants_BOTH_unicode = [c.decode('utf-8') for c in all_consonants_BOTH]

virAma_unicode = '्'.decode('utf-8')


"""
	DESTROYING SPACES
"""

regx_vowels = ''.join(all_vowels_SLP)
regx_unvoiced_consonants = ''.join(unvoiced_consonants_SLP)
regx_voiced_consonants = ''.join(voiced_consonants_SLP)

which_spaces_destroyed = [
# basically impossible in mss, much disliked among modern scholars
'(y) ([%s])' % regx_vowels,
'(v) ([%s])' % regx_vowels,
'(r) ([%s])' % regx_vowels,
'(r) ([%s])' % regx_voiced_consonants,
# rare in mss, sometimes used for clarity among modern scholars
'(Y) ([cCjJ])',
'([kwp]) ([%s])' % regx_unvoiced_consonants,
'([gqb]) ([%s])' % regx_voiced_consonants,
'(d) ([%s])' % regx_voiced_consonants,
'(l) (l)',
'(S) ([cCS])',
'(s) ([tTs])',
# optional in mss, use very  much depends on scribe/editor
'(d) ([%s])' % regx_vowels,
'(m) ([%s])' % regx_vowels,
'(n) ([%s])' % regx_vowels,
'([gqb]) ([%s])' % regx_vowels,
'(n) ([%s])' % regx_voiced_consonants,
'(t) ([%s])' % regx_unvoiced_consonants, # beware! this is wrong bc e.g. n+s ok but n+ś not
]


"""
	SCANSION
"""

# traditional trisyllable abbreviation scheme
gaRas_by_weights = {
'lgg' : 'y', # bacchius
'ggg' : 'm', # molossus
'ggl' : 't', # antibacchius
'glg' : 'r', # cretic / amphimacer
'lgl' : 'j', # amphibrach
'gll' : 'B', # dactyl
'lll' : 'n', # tribrach
'llg' : 's', # anapest / antidactylus
}


# Note: Regex allows anceps final syllable for samavftta. Other code requires that heavy be given first.

samavfttas_by_gaRas = {
# most frequent, taking small personal collection as proxy
'ttjg(g|l)' : 'indravajrā',
'jtjg(g|l)' : 'upendravajrā',
# '(t|j)tjg(g|l)' : 'upajāti', # how to detect when so flexible?
'sss(s|n)' : 'toṭakam',
'nBB(r|B)' : 'drūtavilambitam',
'mnjr(g|l)' : 'praharṣiṇī',
'yyy(y|j)' : 'bhujaṅgaprayātam',
'mBnttg(g|l)' : 'mandākrāntā',
'nnmy(y|j)' : 'mālinī',
'jtj(r|B)' : 'vaṃśastha',
'tBjjg(g|l)' : 'vasantatilaka',
'msjstt(g|l)' : 'śārdūlavikrīḍitā',
'mttg(g|l)' : 'śālinī',
'ymnsBl(g|l)' : 'śikhariṇī',
'njjjjjjl(g|l)' : 'śravaṇābharaṇam', # also virājitam
'nsmrsl(g|l)' : 'hariṇī',

# more from "Peter's meters"
'jsjsyl(g|l)' : 'pṛthvī',
'sjs(s|n)' : 'pramitākṣarā',
'rnrl(g|l)' : 'rathoddhatā',
'jBsj(g|l)' : 'rucirā',
'mrBnyy(y|j)' : 'sragdharā',

# more from Hahn 2014
'njBjjl(g|l)' : 'narkuṭaka',
'sjsj(g|l)' : 'mañjubhāṣiṇī',

# more from Apte (added as found in the wild)
'ttj(r|B)' : 'indravaṃśā',
'sssl(g|l)' : 'upacitra',

# more from Sadananda
'jrl(g|l)' : 'pramāṇikā',
'jrjrj(g|l)' : 'pañcacāmaram',
'rrr(r|B)' : 'sragviṇī',
}


# Note: Not used yet.
ardhasamavfttas_by_gaRas = {
# from "Peter's meters"
'nnrl(g|l)' : 'aparavaktra (11)',
'njj(r|B)' : 'aparavaktra (12)',
'ssjg(g|l)' : 'aupacchandasika (11)',
'sBr(y|j)' : 'aupacchandasika (12)',
'nnr(y|j)' : 'puṣpitāgrā (ac 12)',
'njjr(g|l)' : 'puṣpitāgrā (bd 13)',
'ssj(g|l)' : 'viyoginī (10 ac)',
'sBrl(g|l)' : 'viyoginī (11 bd)',

# more from Hahn 2014
'ssjg(g|l)' : 'mālābhāriṇī (11 ac)',
'sBr(y|j)' : 'mālābhāriṇī (12 bd)',
}


"""
	Lists of jātis by total mātrās in each pāda.
	Structure is: regex of flexible pattern, fixed pattern as list, name as string.
"""
jAtis_by_morae = [
['\[(12|11), (18|17), (12|11), (15|14)\]', [12, 18, 12, 15], 'āryā (=gāhā)'],
['\[(12|11), (18|17), (12|11), (18|17)\]', [12, 18, 12, 18], 'gīti'],
['\[(12|11), (15|14), (12|11), (18|17)\]', [12, 15, 12, 18], 'udgīti'],
['\[(12|11), (15|14), (12|11), (15|14)\]', [12, 15, 12, 15], 'upagīti'],
['\[(16|15), (16|15), (16|15), (16|15)\]', [16, 16, 16, 16], 'mātrāsamaka'],
]


"""
	Rules for structure of anuṣṭubh odd pāda:
	1. Syllables 1 and 8 ALWAYS anceps. ['.xxxxxx.']
	2. Syllables 2 and 3 NEVER both light at same time. ['^(?!.ll.).{4}xxxx']
	3. Multiple "extensions" (vipulā) to prescribed pattern (pathyā) possible.
	(NB: More rigid pattern for even pāda hard-coded in scansion.py, q.v.)
"""
anuzwuB_odd_pAda_types_by_weights = {
'^(?!.ll.).{4}lgg.$' : 'pathyā',
'^.glgggg.$' : 'ma-vipulā',
'^.glggll.$' : 'bha-vipulā',
'^.ggggll.$' : 'bha-vipulā (rare variant preceded by ma-gaṇa)',
'^(?!.ll).{3}glll.$' : 'na-vipulā',
'^(?!.ll).{3}gglg.$' : 'ra-vipulā',
}
