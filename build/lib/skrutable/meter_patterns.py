
# traditional "gaṇa" trisyllable abbreviation scheme
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

"""
	Sources:
		Apte, V.S. (1890). Practical Sanskrit-English Dictionary, "Appendix A: Sanskrit Prosody".
			PDF online @ https://archive.org/details/ldpd_7285627_000/page/n1195/mode/2up
		Hahn, M. (2014). "Brief introduction into the Indian metrical system (for the use of students)"
			PDF online @ https://uni-marburg.academia.edu/MichaelHahn
		Murthy, G.S.S. (2003). "Characterizing Classical Anuṣṭup: A Study in Sanskrit Prosody".
			https://www.jstor.org/stable/41694750
"""

"""
	anuṣṭubh

	Rules for structure of even pāda (more rigid):
	1. Syllables 1 and 8 ALWAYS anceps. ( .xxxxxx. )
	2. Syllables 2 and 3 NEVER both light. ( (?!.ll.)xxxx )
	3. Syllables 2-4 NEVER ra-gaRa (glg). ( (?!.glg)xxxx )
	4. Syllables 5-7 ALWAYS has ja-gaRa (lgl). ( xxxxlgl. )

	Rules for structure of odd pāda:
	1. Syllables 1 and 8 ALWAYS anceps. ( .xxxxxx. )
	2. Syllables 2 and 3 NEVER both light. ( (?!.ll.)xxxx )
	3. Multiple "extensions" (vipulā) to prescribed pattern (pathyā) possible.
"""
anuzwuB_pAda = {
'even' : '^(?!.ll.|.glg).{4}lgl.$',
'odd' : {
	'^(?!.ll.).{4}lgg.$' : 'pathyā',
	'^.glgggg.$' : 'ma-vipulā',
	'^.glggll.$' : 'bha-vipulā',
	'^.ggggll.$' : 'bha-vipulā (ma-gaṇa-pūrvikā!)',
	'^(?!.ll).{3}glll.$' : 'na-vipulā',
	'^(?!.ll).{3}gglg.$' : 'ra-vipulā',
	}
}

"""
	samavṛtta

	Final syllable always anceps (heavy always first in regex).
"""


samavftta_family_names = {
0: "...", 1: "...", 2: "...", 3: "...", # never occur, just for bad input
4: 'pratiṣṭhā',	5: 'supratiṣṭhā',
6: 'gāyatrī',	7: 'uṣṇik',
8: 'anuṣṭubh',	9: 'bṛhatī',
10: 'paṅkti',	11: 'triṣṭubh',
12: 'jagatī',	13: 'atijagatī',
14: 'śakvarī',	15: 'atiśakvarī',
16: 'aṣṭi', 	17: 'atyaṣṭi',
18: 'dhṛti', 	19: 'atidhṛti',
20: 'kṛti',		21: 'prakṛti', 	22: 'ākṛti',	23: 'vikṛti',
24: 'saṃkṛti',	25: 'atikṛti', 	26: 'utkṛti',
27: 'daṇḍaka',	28: 'daṇḍaka', 	29: 'daṇḍaka', 	30: 'daṇḍaka',
31: 'daṇḍaka',	32: 'daṇḍaka',	33: 'daṇḍaka',	34: 'daṇḍaka',
35: 'daṇḍaka',	36: 'daṇḍaka',	37: 'daṇḍaka',	38: 'daṇḍaka',
}

# to delete...
# samavfttas_by_gaRas = {
#
# # 8-syllable
# 'jrl(g|l)' : 'pramāṇikā',
#
# # 11-syllable triṣṭubh
# 'ttjg(g|l)' : 'indravajrā',
# 'jtjg(g|l)' : 'upendravajrā',
# 'mttg(g|l)' : 'śālinī',
# 'rnrl(g|l)' : 'rathoddhatā',
# 'sssl(g|l)' : 'upacitra',
#
# # 12-syllable jagatī
# 'sss(s|n)' : 'toṭakam',
# 'nBB(r|B)' : 'drutavilambitam',
# 'yyy(y|j)' : 'bhujaṅgaprayātam',
# 'jtj(r|B)' : 'vaṃśastha',
# 'ttj(r|B)' : 'indravaṃśā',
# 'rrr(r|B)' : 'sragviṇī',
# 'sjs(s|n)' : 'pramitākṣarā',
# 'mmy(y|j)' : 'vaiśvadevī',
# # drutavilambita
#
# # 13-syllable
# 'mnjr(g|l)' : 'praharṣiṇī',
# 'jBsj(g|l)' : 'rucirā',
# 'sjsj(g|l)' : 'mañjubhāṣiṇī',
#
# # 14-syllable
# 'tBjjg(g|l)' : 'vasantatilakā',
#
# #15-syllable
# 'nnmy(y|j)' : 'mālinī',
#
# # 16-syllable
# 'jrjrj(g|l)' : 'pañcacāmara',
#
# # 17-syllable
# 'mBnttg(g|l)' : 'mandākrāntā',
# 'ymnsBl(g|l)' : 'śikhariṇī',
# 'nsmrsl(g|l)' : 'hariṇī',
# 'jsjsyl(g|l)' : 'pṛthvī',
# 'njBjjl(g|l)' : 'kokilaka', # aka narkuṭaka
#
# # 18-syllable
#
# # 19-syllable
# 'msjstt(g|l)' : 'śārdūlavikrīḍita',
#
# # 20
#
# # 21-syllable
# 'mrBnyy(y|j)' : 'sragdharā',
#
# # 22
#
# # 23-syllable
# 'njjjjjjl(g|l)' : 'śravaṇābharaṇam', # also virājitam
#
# # 24
#
# # 25
#
# }

def choose_heavy_gaRa_pattern(gaRa_pattern):
	"""
		e.g., "...(g|l)" > "...g",
		e.g., "...(r|B)" > "...r",
		etc.
	"""
	return gaRa_pattern[:-5] + gaRa_pattern[-4]

samavfttas_by_family_and_gaRa = {

0: { }, 1: { }, 2: { }, 3: { },

4: 	{
	'm(g|l)' : 'kanyā', # also 'gm'
	},

5: 	{
	'bg(g|l)' : 'paṅkti',
	},

6: 	{
	't(y|j)' : 'tanumadhyamā',
	'm(m|t)' : 'vidyullekhā', # also 'vāṇī'
	'n(y|j)' : 'śaśivadanā',
	'y(y|j)' : 'somarājī',
	},

7: 	{
	'js(g|l)' : 'kumāralalitā',
	'ms(g|l)' : 'madalekhā',
	'nn(g|l)' : 'madhumatī',
	},

8: 	{
	'nBl(g|l)' : 'gajagati',
	'jrl(g|l)' : 'pramāṇikā',
	'Btl(g|l)' : 'māṇavaka',
	'mmg(g|l)' : 'vidyumālā',
	# 'rjgl' : 'samānikā', # also glrj... ends in light?
	},

9:	{
	'nn(m|t)' : 'bhujagaśiṣubhṛtā',
	'sj(r|B)' : 'bhujaṅgasaṅgatā',
	'Bm(s|n)' : 'maṇimadhya',
	},

10: {
	'njn(g|l)' : 'tvaritagati',
	'mBs(g|l)' : 'mattā',
	'Bms(g|l)' : 'rukmavatī',
	},

11:	{
	'ttjg(g|l)' : 'indravajrā',
	'jtjg(g|l)' : 'upendravajrā',
	'BBBg(g|l)' : 'dodhaka',
	'mBnl(g|l)' : 'bhramaravilasita',
	'rnrl(g|l)' : 'rathoddhatā',
	'mBtg(g|l)' : 'vātormī',
	'mttg(g|l)' : 'śālinī',
	'rnBg(g|l)' : 'svāgatā',
	},

12: {
	'ttj(r|B)' : 'indravaṃśā',
	'rnB(s|n)' : 'candravatma',
	'mBs(m|t)' : 'jaladharamālā',
	'jsj(s|n)' : 'jaloddhatagati',
	'njj(y|j)' : 'tāmarasa',
	'sss(s|n)' : 'toṭaka',
	'nBB(r|B)' : 'drutavilambita',
	'nnr(r|B)' : 'pramuditavadanā', # aka prabhā, mandākinī,
	'sjs(s|n)' : 'pramitākṣarā',
	'yyy(y|j)' : 'bhujaṅgaprayāta',
	'tyt(y|j)' : 'maṇimālā',
	'njj(r|B)' : 'mālatī',
	'jtj(r|B)' : 'vaṃśastha',
	'mmy(y|j)' : 'vaiśvadevī',
	'rrr(r|B)' : 'sragviṇī',

	},

13: {
	'sjss(g|l)' : 'kalahaṃsa', # aka siṃhanāda, kuṭajā
	'nntt(g|l)' : 'kṣamā', # aka candrikā, utpalinī
	'mnjr(g|l)' : 'praharṣiṇī',
	'sjsj(g|l)' : 'mañjubhāṣiṇī', # aka sunandinī, prabodhitā
	'mtys(g|l)' : 'mattamayūra',
	'jBsj(g|l)' : 'rucirā', # aka prabhāvatī
	},

14: {
	'nnrsl(g|l)' : 'aparājitā',
	'mtnsg(g|l)' : 'asaṃbādhā',
	'sjsyl(g|l)' : 'pathyā', # aka mañjarī
	'njBjl(g|l)' : 'pramadā', # aka kurarīrutā
	'nnBnl(g|l)' : 'praharaṇakalikā',
	'mBnyg(g|l)' : 'madhyakṣāmā', # aka haṃsaśyenī, kuṭila
	'tBjjg(g|l)' : 'vasantatilakā',
	'mtnmg(g|l)' : 'vāsantī',
	},

15: {
	'rjrj(r|B)' : 'cārucāmara', # aka tūṇaka
	'nnmy(y|j)' : 'mālinī',
	'mmmm(m|t)' : 'līlākhela',
	'nnnn(s|n)' : 'śaśikalā',
	},

16: {
	'rjrjr(g|l)' : 'citra',
	'jrjrj(g|l)' : 'pañcacāmara',
	'njBjr(g|l)' : 'vāṇinī',
	},

17: {
	'ssjBjg(g|l)' : 'citralekhā', # aka atiśāyinī
	'njBjjl(g|l)' : 'narkuṭaka', # aka nardaṭaka
	'jsjsyl(g|l)' : 'pṛthvī',
	'mBnttg(g|l)' : 'mandākrāntā',
	'BrnBnl(g|l)' : 'vaṃśapatrapatita',
	'ymnsBl(g|l)' : 'śikhariṇī',
	'nsmrsl(g|l)' : 'hariṇī',
	},

18: {
	'mtnyy(y|j)' : 'kusumitalatāvellitā',
	'mBnyy(y|j)' : 'citralekhā',
	'njBjr(r|B)' : 'nandana',
	'nnrrr(r|B)' : 'nārāca',
	'msjst(s|n)' : 'śārdūlalalita',
	'rsjjB(r|B)' : 'mallikāmālā',
	},

19: {
	'ymnsrr(g|l)' : 'meghavispūrjitā',
	'msjstt(g|l)' : 'śārdūlavikrīḍita',
	'mrBnmn(g|l)' : 'sumadhurā',
	'mrBnyn(g|l)' : 'surasā',
	},

20: {
	'sjjBrsl(g|l)' : 'gītikā',
	'mrBnyBl(g|l)' : 'suvadanā',
	},

21: {
	'njBjjj(r|B)' : 'pañcakāvalī', # aka sarasī, dhṛtaśrī
	'mrBnyy(y|j)' : 'sragdharā',
	},

22: {
	'mmtnnns(g|l)' : 'haṃsī', # also mmggnnnngg
	'tByjsrn(g|l)' : 'aśvadhāṭī',
	},

23: {
	'njBjBjBl(g|l)' : 'adritanayā',
	'njjjjjjl(g|l)' : 'śravaṇābharaṇam', # also virājitam
	},

24: {
	'BtnsBBn(y|j)' : 'tanvī',
	},

25: {
	'BmsBnnnn(g|l)' : 'krauñcapadā',
	},

26: {
	'mmtnnnrsl(g|l)' : 'bhujaṅgavijṛmbhita',
	'jsnBjsnBl(g|l)' : 'śivatāṇḍava',
	},

# rest "daṇḍaka"
27: { }, 28: { }, 29: { }, 30: { },

31: { }, 32: { }, 33: { }, 34: { }, 35: { }, 36: { }, 37: { }, 38: {}, 39: {}, 40: {},
41: { }, 42: { }, 43: { }, 44: { }, 45: { }, 46: { }, 47: { }, 48: {}, 49: {}, 50: {},
51: { }, 52: { }, 53: { }, 54: { }, 55: { }, 56: { }, 57: { }, 58: {}, 59: {}, 60: {},
61: { }, 62: { }, 63: { }, 64: { }, 65: { }, 66: { }, 67: { }, 68: {}, 69: {}, 70: {},
}

all_known_samavRttas = []
for k in samavfttas_by_family_and_gaRa.keys(): # for each family
	all_known_samavRttas = all_known_samavRttas + list(samavfttas_by_family_and_gaRa[k].values())

ardhasamavftta_by_odd_even_regex_tuple = {
('nnrl(g|l)', 'njj(r|B)') : 'aparavaktra = [11: nnrlg] 1,3 + [12: njjr] 2,4', # aka vaitālīya
('sssl(g|l)', 'BBBg(g|l)') : 'upacitra = [11: ssslg] 1,3 + [11: BBBgg] 2,4',
('nnr(y|j)', 'njjr(g|l)') : 'puṣpitāgrā = [12: nnry] 1,3 + [12: njjrg] 2,4', # aka aupacchandasika
('ssj(g|l)', 'sBrl(g|l)') : 'viyoginī = [10: ssjg] 1,3 + [11: sBrlg] 2,4', # aka vaitālīya, sundarī
('sss(g|l)', 'BBBg(g|l)') : 'vegavatī = [10: sssg] 1,3 + [11: BBBgg] 2,4',
('sssl(g|l)', 'nBB(r|B)') : 'hariṇaplutā = [11: ssjgg] 1,3 + [12: nBBr] 2,4',
('ssjg(g|l)', 'sBr(y|j)') : 'aupacchandasika = [11: ssjgg] 1,3 + [12: sBry] 2,4', # aka mālābhāriṇī
}

vizamavftta_by_4_tuple = {
	('sjsl', 'nsjg', 'Bnjlg', 'sjsjg') : 'udgatā = [10: sjsl] + [10: nsjg] + [11: Bnjlg] + [13: sjsjg]',
	('sjsl', 'nsjg', 'BnBg', 'sjsjg') : 'udgatā 2 = [10: sjsl] + [10: nsjg] + [10: BnBg] + [13: sjsjg]',
}


"""
	Lists of jātis by total mātrās in each pāda.
	Structure is: regex of flexible pattern, fixed pattern as list, name as string.
"""
jAtis_by_morae = [
['\[(12|11), (18|17), (12|11), (15|14)\]', [12, 18, 12, 15], 'āryā'],
# see Andrew Ollett's work (e.g., @ prakrit.info) for extra rules on Prakrit gāhā...
['\[(12|11), (18|17), (12|11), (18|17)\]', [12, 18, 12, 18], 'gīti'],
['\[(12|11), (15|14), (12|11), (15|14)\]', [12, 15, 12, 15], 'upagīti'],
['\[(12|11), (15|14), (12|11), (18|17)\]', [12, 15, 12, 18], 'udgīti'],
['\[(12|11), (20|19), (12|11), (20|19)\]', [12, 20, 12, 20], 'āryāgīti'],
# ['\[(14|13), (16|15), (14|13), (16|15)\]', [12, 18, 12, 18], 'vaitālīya'], # more rules...
# ['\[(16|15), (16|15), (16|15), (16|15)\]', [16, 16, 16, 16], 'mātrāsamaka'], # more rules...
]

meter_melodies = {
	'anuṣṭubh' : ['Madhura Godbole', 'H.V. Nagaraja Rao', 'Shatavadhani Ganesh',  'Diwakar Acarya'],
	'aparavaktra' : ['H.V. Nagaraja Rao', 'Shatavadhani Ganesh'],
	'aśvadhāṭī' : ['Shatavadhani Ganesh'],
	'āryā' : ['Madhura Godbole', 'Shatavadhani Ganesh', 'Sadananda Das', 'Diwakar Acarya'],
	'indravajrā' : ['Sadananda Das', 'Diwakar Acarya'],
	'indravaṃśa' : ['Shatavadhani Ganesh'],
	'udgatā' : ['Shatavadhani Ganesh'],
	'upagīti' : ['Madhura Godbole'],
	'upajāti' : ['Madhura Godbole', 'Sadananda Das', 'Diwakar Acarya', 'H.V. Nagaraja Rao', 'Shatavadhani Ganesh'],
	'aupacchandasika' : ['H.V. Nagaraja Rao', 'Shatavadhani Ganesh'],
	'kokilaka' : ['H.V. Nagaraja Rao', 'Shatavadhani Ganesh'],
	'gīti' : ['H.V. Nagaraja Rao'],
	'cārucāmara' : ['Shatavadhani Ganesh'],
	'toṭaka' : ['Shatavadhani Ganesh'],
	'drutavilambita' : ['Madhura Godbole', 'Diwakar Acarya', 'Shatavadhani Ganesh'],
	'pañcacāmara' : ['Sadananda Das', 'Shatavadhani Ganesh'],
	'puṣpitāgrā' : ['Shatavadhani Ganesh'],
	'pṛthvī' : ['Sadananda Das', 'H.V. Nagaraja Rao', 'Shatavadhani Ganesh'],
	'pramuditavadanā' : ['H.V. Nagaraja Rao'],
	'pramitākṣara' : ['H.V. Nagaraja Rao'],
	'praharṣiṇī' : ['H.V. Nagaraja Rao', 'Shatavadhani Ganesh'],
	'bhujaṅgaprayāta' : ['Shatavadhani Ganesh'],
	'mañjubhāṣiṇī' : ['H.V. Nagaraja Rao', 'Shatavadhani Ganesh'],
	'mattamayūra' : ['H.V. Nagaraja Rao'],
	'mandākrāntā' : ['H.V. Nagaraja Rao', 'Diwakar Acarya', 'Shatavadhani Ganesh'],
	'mallikāmālā' : ['Shatavadhani Ganesh'],
	# 'mātrāsamaka' : ['Sadananda Das'],
	'mālinī' : ['Madhura Godbole', 'Sadananda Das', 'H.V. Nagaraja Rao', 'Shatavadhani Ganesh'],
	'rathoddhatā' : ['Shatavadhani Ganesh'],
	'vaṃśastha' : ['Shatavadhani Ganesh'],
	'vasantatilakā' : ['Madhura Godbole', 'Sadananda Das', 'H.V. Nagaraja Rao', 'Shatavadhani Ganesh'],
	'viyoginī' : ['Shatavadhani Ganesh'],
	'śārdūlavikrīḍita' : ['Madhura Godbole', 'Sadananda Das', 'H.V. Nagaraja Rao', 'Diwakar Acarya', 'Shatavadhani Ganesh'],
	'śālinī' : ['H.V. Nagaraja Rao', 'Shatavadhani Ganesh'],
	'śikhariṇī' : ['Madhura Godbole', 'Sadananda Das', 'H.V. Nagaraja Rao', 'Diwakar Acarya', 'Shatavadhani Ganesh'],
	'śivatāṇḍava' : ['Shatavadhani Ganesh'],
	'śravaṇābharaṇa' : ['Sadananda Das'],
	'sragdharā' : ['H.V. Nagaraja Rao', 'Shatavadhani Ganesh'],
	'sragviṇī' : ['Sadananda Das', 'Shatavadhani Ganesh'],
	'svāgatā' : ['Shatavadhani Ganesh'],
	'hariṇī' : ['Shatavadhani Ganesh']
}
