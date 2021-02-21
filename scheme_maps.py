roman_schemes_1 = ['IAST', 'SLP', 'HK']
indic_schemes = ['DEV', 'BENGALI', 'GUJARATI']
roman_schemes_2 = ['VH', 'ITRANS', 'IASTREDUCED']
all_schemes = roman_schemes_1 + indic_schemes + roman_schemes_2

"""For reference, each scheme on its own:
IAST					SLP						HK
a ā i ī u ū				a A i I u U 			a A i I u U
ṛ ṝ ḷ ḹ e ai o au		f F x X e E o O 		R RR lR lRR e ai o au
k kh g gh ṅ				k K g G N 				k kh g gh G
c ch j jh ñ				c C j J Y 				c ch j jh J
ṭ ṭh ḍ ḍh ṇ				w W q Q R 				T Th D Dh N
t th d dh n				t T d D n 				t th d dh n
p ph b bh m				p P b B m 				p ph b bh m
y r l v					y r l v 				y r l v
ś ṣ s h ṃ ḥ '			S z s h M H '			z S s h M H '

(IASTREDUCED: a a i i u u ... jh n t th d dh n t ... s s s h m h ')

DEV
अ आ इ ई उ ऊ ( ा ि ी ु ू )
ऋ ॠ ऌ ॡ ए ऐ ओ औ ( ृ ॄ ॢ ॣ े ै ो ौ )
क ख ग घ ङ
च छ ज झ ञ
ट ठ ड ढ ण
त थ द ध न
प फ ब भ म
य र ल व
श ष स ह ं ः ऽ
१ २ ३ ४ ५ ६ ७ ८ ९ ०

BENGALI
অ আ ই ঈ উ ঊ ( া ি ী ু ূ )
ঋ ৠ ঌ ৡ এ ঐ ও ঔ ( ৃ ৄ ৢ ৣ ে ৈ ো ৌ )
ক খ গ ঘ ঙ
চ ছ জ ঝ ঞ
ট ঠ ড ঢ ণ
ত থ দ ধ ন
প ফ ব ভ ম
য র ল ব
শ ষ স হ ং ঃ ঽ
১ ২ ৩ ৪ ৫ ৬ ৭ ৮ ৯ ০

GUJARATI
અ આ ઇ ઈ ઉ ઊ ( ા િ ી ુ ૂ )
ઋ ૠ ઌ ૡ એ ઐ ઓ ઔ ( ૃ ૄ ૢ ૣ ે ૈ ો ૌ )
ક ખ ગ ઘ ઙ
ચ છ જ ઝ ઞ
ટ ઠ ડ ઢ ણ
ત થ દ ધ ન
પ ફ બ ભ મ
ય ર લ વ
શ ષ સ હ ં ઃ ઽ
૧ ૨ ૩ ૪ ૫ ૬ ૭ ૮ ૯ ૦

VH     					WX
a aa i ii u uu			a A i I u U
.r .R .l .L e ai o au	q Q L   e E o O
k K g G "n				k K g G f
c C j J ~n				c C j J F
.t .T .d .D .n			t T d D N
t T d D n				w W x X n
p P b B m				p P b B m
y r l v					y r l v
"s .s s h .m .h .a		S R s M H Z

ITRANS
a aa i ii u uu
Ri/RRi/R^i RI/RRI/R^I Li/LLi/L^i LI/LLI/L^I ee/E ai oo/O au
k kh g gh ~N
ch Ch j jh ~n
T Th D Dh N
t th d dh n
p ph b bh m
y r l w
sh Sh s .m .h .a

CSX						REE						OAST
...						...						...
"""

"""Available Mappings
to SLP   IAST_SLP, DEV_SLP, HK_SLP, VH_SLP, ITRANS_SLP
(SLP_SLP)
from SLP  SLP_IAST, SLP_DEV, SLP_HK, SLP_VH, SLP_ITRANS
"""
IAST_SLP = [
# Normalization 1: merge of combining diacritics to precomposed combinations
('ā','ā'),('Ā','ā'),('Ā','ā'), # case also lowered throughout
('ī','ī'),('Ī','ī'),('Ī','ī'),
('ï','ï'), # for Prakrit
('ū','ū'),('Ū','ū'),('Ū','ū'),
('ü','ü'), # for Prakrit
('ṛ','ṛ'),('Ṛ','ṛ'),('Ṛ','ṛ'),
('ṝ','ṝ'),          ('Ṝ','ṝ'), # r ̣ ̄ R ̣ ̄
('ṝ','ṝ'),          ('Ṝ','ṝ'), # r ̄ ̣ R ̄ ̣
('ṝ','ṝ'),          ('Ṝ','ṝ'), # ṛ ̄	Ṛ ̄
('ḷ','ḷ'),('Ḷ','ḷ'),('Ḷ','ḷ'),
('ḹ','ḹ'),          ('Ḹ','ḹ'), # l ̣ ̄ L ̣ ̄
('ḹ','ḹ'),          ('Ḹ','ḹ'), # l ̄ ̣ L ̄ ̣
('ḹ','ḹ'),          ('Ḹ','ḹ'), # ḷ ̄ Ḷ ̄
('ṅ','ṅ'),('Ṅ','ṅ'),('Ṅ','ṅ'),
('ñ','ñ'),('Ñ','ñ'),('Ñ','ñ'),
('ṭ','ṭ'),('Ṭ','ṭ'),('Ṭ','ṭ'),
('ḍ','ḍ'),('Ḍ','ḍ'),('Ḍ','ḍ'),
('ṇ','ṇ'),('Ṇ','ṇ'),('Ṇ','ṇ'),
('ś','ś'),('Ś','ś'),('Ś','ś'),
('ṣ','ṣ'),('Ṣ','ṣ'),('Ṣ','ṣ'),
('ḥ','ḥ'),('Ḥ','ḥ'),('Ḥ','ḥ'),
('ẖ','ẖ'),('H̱','h'),
('ḫ','ḫ'),('Ḫ','h'),('Ḫ','h'),
('ṃ','ṃ'),('Ṃ','ṃ'),('Ṃ','ṃ'),
# Normalization 2: change of ISO under-circles to under-dots, also ṁ's, ē's, ō's
('r̥','ṛ'),('R̥','ṛ'),
('r̥̄','ṝ'),('R̥̄','ṝ'),
('r̥̄','ṝ'),('R̥̄','ṝ'),
('l̥','ḷ'),('L̥','ḷ'),
('l̥̄','ḹ'),('L̥̄','ḹ'),
('l̥̄','ḹ'),('L̥̄','ḹ'),
('ṁ','ṃ'),('ṁ','ṃ'),
('ē','e'),('ē','e'),('ĕ','ĕ'),
('ō','o'),('ō','o'),('ŏ','ŏ'),
# Normalization 3: lowering of remaining uppercase
# Another option: Comment out to allow capitalization of proper names
('A','a'),('B','b'),('C','c'),('D','d'),('E','e'),
('F','f'),('G','g'),('H','h'),('I','i'),('J','j'),
('K','k'),('L','l'),('M','m'),('N','n'),('O','o'),
('P','p'),('Q','q'),('R','r'),('S','s'),('T','t'),
('U','u'),('V','v'),('W','w'),('X','x'),('Y','y'),('Z','z'),
# Transliteration 1: careful ordering to avoid bleeding/feeding
('ṭh','W'),
('ṭ','w'),
('ḍh','Q'),
('ḍ','q'),
# Transliteration 2: simpler remaining mappings
('ā','A'),
('ī','I'),
('ū','U'),
('ṛ','f'),
('ṝ','F'),
('ḷ','x'),
('ḹ','X'),
('ai','E'),
('au','O'),
('ï','i'), # for Prakrit
('ü','u'), # for Prakrit
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
('ṃ','M'),
('ḥ','H'),('ẖ','H'),('ḫ','H'), # ẖ ḫ (extended IAST) not supported by SLP1 single char
# Remain the same: a, i, u, k, g, c, j, t, d, p, b, s, h
]

HK_SLP = [
# Transliteration 1: careful ordering to avoid bleeding/feeding
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
# Transliteration 2: roundabout swap to avoid bleeding/feeding
('z','Z'), # Z not used in either scheme
('S','z'),
('Z','S'),
# Transliteration 3: simpler remaining mappings
('ai','E'),
('au','O'),
('kh','K'),
('ch','C'),
('ph','P'),
('bh','B'),
("’", "'"),
# Remain the same: ...
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

BENGALI_SLP = [
('অ', 'a'),
('আ', 'A'),
('ই', 'i'),
('ঈ', 'I'),
('উ', 'u'),
('ঊ', 'U'),
('ঋ', 'f'),
('ৠ', 'F'),
('ঌ', 'x'),
('ৡ', 'X'),
('এ', 'e'),
('ঐ', 'E'),
('ও', 'o'),
('ঔ', 'O'),
('ং', 'M'),
('ঃ', 'H'),
('ক', 'k'),
('খ', 'K'),
('গ', 'g'),
('ঘ', 'G'),
('ঙ', 'N'),
('চ', 'c'),
('ছ', 'C'),
('জ', 'j'),
('ঝ', 'J'),
('ঞ', 'Y'),
('ট', 'w'),
('ঠ', 'W'),
('ড', 'q'),
('ঢ', 'Q'),
('ণ', 'R'),
('ত', 't'),
('থ', 'T'),
('দ', 'd'),
('ধ', 'D'),
('ন', 'n'),
('প', 'p'),
('ফ', 'P'),
('ব', 'b'),
('ভ', 'B'),
('ম', 'm'),
('য', 'y'),
('র', 'r'),
('ল', 'l'),
('ব', 'v'),
('শ', 'S'),
('ষ', 'z'),
('স', 's'),
('হ', 'h'),
('ঽ', "'"),
('া', 'A'),
('ি', 'i'),
('ী', 'I'),
('ু', 'u'),
('ূ', 'U'),
('ৃ', 'f'),
('ৄ', 'F'),
('ৢ', 'x'),
('ৣ', 'X'),
('ে', 'e'),
('ৈ', 'E'),
('ো', 'o'),
('ৌ', 'O'),
('১', '1'),
('২', '2'),
('৩', '3'),
('৪', '4'),
('৫', '5'),
('৬', '6'),
('৭', '7'),
('৮', '8'),
('৯', '9'),
('০', '0'),
]

GUJARATI_SLP = [
('અ', 'a'),
('આ', 'A'),
('ઇ', 'i'),
('ઈ', 'I'),
('ઉ', 'u'),
('ઊ', 'U'),
('ઋ', 'f'),
('ૠ', 'F'),
('ઌ', 'x'),
('ૡ', 'X'),
('એ', 'e'),
('ઐ', 'E'),
('ઓ', 'o'),
('ઔ', 'O'),
('ં', 'M'),
('ઃ', 'H'),
('ક', 'k'),
('ખ', 'K'),
('ગ', 'g'),
('ઘ', 'G'),
('ઙ', 'N'),
('ચ', 'c'),
('છ', 'C'),
('જ', 'j'),
('ઝ', 'J'),
('ઞ', 'Y'),
('ટ', 'w'),
('ઠ', 'W'),
('ડ', 'q'),
('ઢ', 'Q'),
('ણ', 'R'),
('ત', 't'),
('થ', 'T'),
('દ', 'd'),
('ધ', 'D'),
('ન', 'n'),
('પ', 'p'),
('ફ', 'P'),
('બ', 'b'),
('ભ', 'B'),
('મ', 'm'),
('ય', 'y'),
('ર', 'r'),
('લ', 'l'),
('વ', 'v'),
('શ', 'S'),
('ષ', 'z'),
('સ', 's'),
('હ', 'h'),
('ઽ', "'"),
('ા', 'A'),
('િ', 'i'),
('ી', 'I'),
('ુ', 'u'),
('ૂ', 'U'),
('ૃ', 'f'),
('ૄ', 'F'),
('ૢ', 'x'),
('ૣ', 'X'),
('ે', 'e'),
('ૈ', 'E'),
('ો', 'o'),
('ૌ', 'O'),
('૧', '1'),
('૨', '2'),
('૩', '3'),
('૪', '4'),
('૫', '5'),
('૬', '6'),
('૭', '7'),
('૮', '8'),
('૯', '9'),
('૦', '0'),
]

VH_SLP = [
# Transliteration 1: careful ordering to avoid bleeding/feeding
('.a',"'"),
# Transliteration 2: simpler remaining mappings
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
("’", "'"),
# Remain the same: ...
]

WX_SLP = [
# Transliteration 1: very careful ordering to avoid bleeding/feeding
# start with what not used in WX: Y
('F','Y'), # ñ
# now progressively map to what is freed up
('Q','F'), # ṝ
('D','Q'), # ḍh
('X','D'), # dh
# again, start with what not used in WX: z
('R','z'), # ṣ
# now progressively map to what is freed up
('N','R'), # ṇ
('f','N'), # ṅ
('q','f'), # ṛ
('d','q'), # ḍ
('x','d'), # d
('L','x'), # ḷ
# Transliteration 2: roundabout swaps to avoid bleeding/feeding
# V not used in either scheme
('t','V'), # ṭ
('w','t'), # t
('V','w'), # ṭ
('T','V'), # ṭh
('W','T'), # th
('V','W'), # ṭh
# Transliteration 3: simpler remaining mapping
('Z',"'"),
]

ITRANS_SLP = [
# Transliteration 1: careful ordering to avoid bleeding/feeding
('w', 'v'),
('T', 'w'),
('Th', 'W'),
('D', 'q'),
('Dh', 'Q'),
('th', 'T'),
('dh', 'D'),
# Transliteration 2: roundabout swap to avoid bleeding/feeding
('~N', 'Z'), # Z not used in either scheme
('N', 'R'),
('Z', 'N'),
# Transliteration 3: simpler remaining mappings
('aa', 'A'),
('ii', 'I'),
('uu', 'U'),
('ee', 'e'),
('oo', 'o'),
('E', 'e'),
('ai', 'E'),
('O', 'o'),
('au', 'O'),
('RRi', 'f'),('Ri', 'f'),('R^i', 'f'),
('RRI', 'F'),('RI', 'F'),('R^I', 'F'),
('LLi', 'x'),('Li', 'x'),('L^i', 'x'),
('LLI', 'X'),('LI', 'X'),('L^I', 'X'),
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
('.m', 'M'),
('.h', 'H'),
('.a', "'"),
("’", "'"),
# Remain the same: ...
]

CSX_SLP = []

REE_SLP = []

OAST_SLP = [
# not yet fully worked out
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
# Remain the same: ...
]

SLP_SLP = [
# Normalization 1: avagraha
("’", "'"),
]

SLP_IAST = [
# Transliteration 1: all simple mappings
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
# Remain the same: ...
]

SLP_HK = [
# Transliteration 1: careful ordering to avoid bleeding/feeding
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
# Transliteration 2: roundabout swap to avoid feeding in direct swap
('S','Z'), # Z not used in either scheme
('z','S'),
('Z','z'),
# Transliteration 3: simpler remaining mappings
('E','ai'),
('O','au'),
('K','kh'),
('C','ch'),
('P','ph'),
('B','bh'),
]

SLP_DEV = [
# Transliteration 1: all simple mappings
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
('e', 'ए'),('ĕ', 'ए'),
('E', 'ऐ'),
('o', 'ओ'),('ŏ' 'ओ'),
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
('1', '१'),
('2', '२'),
('3', '३'),
('4', '४'),
('5', '५'),
('6', '६'),
('7', '७'),
('8', '८'),
('9', '९'),
('0', '०'),
]

SLP_BENGALI = [
# Transliteration 1: all simple mappings
('a', 'অ'),
('A', 'আ'),
('i', 'ই'),
('I', 'ঈ'),
('u', 'উ'),
('U', 'ঊ'),
('f', 'ঋ'),
('F', 'ৠ'),
('x', 'ঌ'),
('X', 'ৡ'),
('e', 'এ'),('ĕ', 'এ'),
('E', 'ঐ'),
('o', 'ও'),('ŏ' 'ও'),
('O', 'ঔ'),
('M', 'ং'),
('H', 'ঃ'),
('k', 'ক'),
('K', 'খ'),
('g', 'গ'),
('G', 'ঘ'),
('N', 'ঙ'),
('c', 'চ'),
('C', 'ছ'),
('j', 'জ'),
('J', 'ঝ'),
('Y', 'ঞ'),
('w', 'ট'),
('W', 'ঠ'),
('q', 'ড'),
('Q', 'ঢ'),
('R', 'ণ'),
('t', 'ত'),
('T', 'থ'),
('d', 'দ'),
('D', 'ধ'),
('n', 'ন'),
('p', 'প'),
('P', 'ফ'),
('b', 'ব'),
('B', 'ভ'),
('m', 'ম'),
('y', 'য'),
('r', 'র'),
('l', 'ল'),
('v', 'ব'),
('S', 'শ'),
('z', 'ষ'),
('s', 'স'),
('h', 'হ'),
("'", 'ঽ'),
('1', '১'),
('2', '২'),
('3', '৩'),
('4', '৪'),
('5', '৫'),
('6', '৬'),
('7', '৭'),
('8', '৮'),
('9', '৯'),
('0', '০'),
]

SLP_GUJARATI = [
# Transliteration 1: all simple mappings
('a', 'અ'),
('A', 'આ'),
('i', 'ઇ'),
('I', 'ઈ'),
('u', 'ઉ'),
('U', 'ઊ'),
('f', 'ઋ'),
('F', 'ૠ'),
('x', 'ઌ'),
('X', 'ૡ'),
('e', 'એ'),('ĕ', 'એ'),
('E', 'ઐ'),
('o', 'ઓ'),('ŏ' 'ઓ'),
('O', 'ઔ'),
('M', 'ં'),
('H', 'ઃ'),
('k', 'ક'),
('K', 'ખ'),
('g', 'ગ'),
('G', 'ઘ'),
('N', 'ઙ'),
('c', 'ચ'),
('C', 'છ'),
('j', 'જ'),
('J', 'ઝ'),
('Y', 'ઞ'),
('w', 'ટ'),
('W', 'ઠ'),
('q', 'ડ'),
('Q', 'ઢ'),
('R', 'ણ'),
('t', 'ત'),
('T', 'થ'),
('d', 'દ'),
('D', 'ધ'),
('n', 'ન'),
('p', 'પ'),
('P', 'ફ'),
('b', 'બ'),
('B', 'ભ'),
('m', 'મ'),
('y', 'ય'),
('r', 'ર'),
('l', 'લ'),
('v', 'વ'),
('S', 'શ'),
('z', 'ષ'),
('s', 'સ'),
('h', 'હ'),
("'", 'ઽ'),
('1', '૧'),
('2', '૨'),
('3', '૩'),
('4', '૪'),
('5', '૫'),
('6', '૬'),
('7', '૭'),
('8', '૮'),
('9', '૯'),
('0', '૦'),
]

SLP_VH = [
# Transliteration 1: all simple mappings
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

SLP_WX = [
# Transliteration 1: very careful ordering to avoid bleeding/feeding
# start with what not used in SLP: L
('x','L'), # ḷ
# now progressively map to what is freed up
('d','x'), # d
('q','d'), # ḍ
('f','q'), # ṛ
('N','f'), # ṅ
('R','N'), # ṇ
('z','R'), # ṣ
# WX does not seem to have ḹ, so make something up
('X','LL'),
# now progressively map to what is freed up
('D','X'), # dh
('Q','D'), # ḍh
('F','Q'), # ṝ
('Y','F'), # ñ
# Transliteration 2: roundabout swaps to avoid bleeding/feeding
# V not used in either scheme
('w','V'), # ṭ
('t','w'), # t
('V','t'), # ṭ
('W','V'), # ṭh
('T','W'), # th
('V','T'), # ṭh
# Transliteration 3: simpler remaining mapping
("'",'Z'),
]

SLP_ITRANS = [
# Transliteration 1: careful ordering to avoid bleeding/feeding
('N','~N'), # palatal nasal
('R','N'), # retroflex nasal
('T','th'),
('w','T'),
('W','Th'),
('v','w'),
('D','dh'),
('q','D'),
# Transliteration 2: simpler remaining mappings
('A','aa'),
('I','ii'),
('U','uu'),
('f','Ri'),
('F','RI'),
('x','Li'),
('X','LI'),
('e','ee'),
('o','oo'),
('E','ai'),
('O','au'),
('M','.m'),
('H','.h'),
('K','kh'),
('G','gh'),
('c','ch'),
('C','Ch'),
('J','jh'),
('Y','~n'),

('Q','Dh'),
('P','ph'),
('B','bh'),
('S','sh'),
('z','Sh'),
("'",'.a'),
]

SLP_CSX = []

SLP_REE = []

SLP_OAST = [
# OUT OF DATE, DON'T USE YET
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

SLP_IASTREDUCED = [
# Transliteration 1: all simple mappings
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

by_name = {
'IAST_SLP' : IAST_SLP, 'HK_SLP' : HK_SLP,
'DEV_SLP' : DEV_SLP, 'BENGALI_SLP' : BENGALI_SLP, 'GUJARATI_SLP' : GUJARATI_SLP,
'VH_SLP' : VH_SLP, 'WX_SLP' : WX_SLP,
'ITRANS_SLP': ITRANS_SLP,
'SLP_SLP' : SLP_SLP,
'SLP_IAST' : SLP_IAST, 'SLP_HK' : SLP_HK,
'SLP_DEV' : SLP_DEV, 'SLP_BENGALI' : SLP_BENGALI, 'SLP_GUJARATI' : SLP_GUJARATI,
'SLP_VH' : SLP_VH, 'SLP_WX' : SLP_WX, 'SLP_ITRANS' : SLP_ITRANS,
'SLP_IASTREDUCED' : SLP_IASTREDUCED,
}
