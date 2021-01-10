"""
	anuṣṭubh

	Rules for structure of odd pāda:
	1. Syllables 1 and 8 ALWAYS anceps. ['.xxxxxx.']
	2. Syllables 2 and 3 NEVER both light at same time. ['^(?!.ll.)xxxx']
	3. Multiple "extensions" (vipulā) to prescribed pattern (pathyā) possible.
"""
anuzwuB_pAda = {
'even' : '^(?!.ll.|.glg).{4}lgl.$',
'odd' : {
	'^(?!.ll.).{4}lgg.$' : 'pathyā',
	'^.glgggg.$' : 'ma-vipulā',
	'^.glggll.$' : 'bha-vipulā',
	'^.ggggll.$' : 'bha-vipulā (rare variant preceded by ma-gaṇa)',
	'^(?!.ll).{3}glll.$' : 'na-vipulā',
	'^(?!.ll).{3}gglg.$' : 'ra-vipulā',
	}
}

# will be deleted
anuzwuB_odd_pAda_types_by_weights = {
'^(?!.ll.).{4}lgg.$' : 'pathyā',
'^.glgggg.$' : 'ma-vipulā',
'^.glggll.$' : 'bha-vipulā',
'^.ggggll.$' : 'bha-vipulā (rare variant preceded by ma-gaṇa)',
'^(?!.ll).{3}glll.$' : 'na-vipulā',
'^(?!.ll).{3}gglg.$' : 'ra-vipulā',
}

"""
	samavṛtta

	11-syllable triṣṭubhs included as first
	# Note: Regex allows anceps final syllable for samavftta. Other code requires that heavy be given first.

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

samavfttas_by_gaRas = {

# 8-syllable
'jrl(g|l)' : 'pramāṇikā',

# 11-syllable triṣṭubh
'ttjg(g|l)' : 'indravajrā',
'jtjg(g|l)' : 'upendravajrā',
'mttg(g|l)' : 'śālinī',
'rnrl(g|l)' : 'rathoddhatā',
'sssl(g|l)' : 'upacitra',

# 12-syllable jagatī
'sss(s|n)' : 'toṭakam',
'nBB(r|B)' : 'drūtavilambitam',
'yyy(y|j)' : 'bhujaṅgaprayātam',
'jtj(r|B)' : 'vaṃśastha',
'ttj(r|B)' : 'indravaṃśā',
'rrr(r|B)' : 'sragviṇī',
'sjs(s|n)' : 'pramitākṣarā',
'mmy(y|j)' : 'vaiśvadevī',
# drutavilambita

# 13-syllable
'mnjr(g|l)' : 'praharṣiṇī',
'jBsj(g|l)' : 'rucirā',
'sjsj(g|l)' : 'mañjubhāṣiṇī',

# 14-syllable
'tBjjg(g|l)' : 'vasantatilaka',

#15-syllable
'nnmy(y|j)' : 'mālinī',

# 16-syllable
'jrjrj(g|l)' : 'pañcacāmaram',

# 17-syllable
'mBnttg(g|l)' : 'mandākrāntā',
'ymnsBl(g|l)' : 'śikhariṇī',
'nsmrsl(g|l)' : 'hariṇī',
'jsjsyl(g|l)' : 'pṛthvī',
'njBjjl(g|l)' : 'narkuṭaka',

# 18-syllable

# 19-syllable
'msjstt(g|l)' : 'śārdūlavikrīḍitā',

# 20

# 21-syllable
'mrBnyy(y|j)' : 'sragdharā',

# 22

# 23-syllable
'njjjjjjl(g|l)' : 'śravaṇābharaṇam', # also virājitam

}

def choose_heavy_gaRa_pattern(gaRa_pattern):
	"""e.g. "...(g|l)" > "...g", "...(r|B)" > "...r", etc."""
	return gaRa_pattern[:-5] + gaRa_pattern[-4]

samavfttas_by_family_and_gaRa = {

1: { }, 2: { }, 3: { }, 4: { }, 5: { }, 6: { }, 7: { },

8: 	{
	'jrl(g|l)' : 'pramāṇikā',
	},

9:	{ }, 10: { },

11:	{
	'ttjg(g|l)' : 'indravajrā',
	'jtjg(g|l)' : 'upendravajrā',
	'mttg(g|l)' : 'śālinī',
	'rnrl(g|l)' : 'rathoddhatā',
	'sssl(g|l)' : 'upacitra',
	},

12: {
	'sss(s|n)' : 'toṭakam',
	'nBB(r|B)' : 'drūtavilambitam',
	'yyy(y|j)' : 'bhujaṅgaprayātam',
	'jtj(r|B)' : 'vaṃśastha',
	'ttj(r|B)' : 'indravaṃśā',
	'rrr(r|B)' : 'sragviṇī',
	'sjs(s|n)' : 'pramitākṣarā',
	'mmy(y|j)' : 'vaiśvadevī',
	# drutavilambita
	},

13: {
	'mnjr(g|l)' : 'praharṣiṇī',
	'jBsj(g|l)' : 'rucirā',
	'sjsj(g|l)' : 'mañjubhāṣiṇī',
	},

14: {
	'tBjjg(g|l)' : 'vasantatilaka',
	},

15: {
	'nnmy(y|j)' : 'mālinī',
	},

16: {
	'jrjrj(g|l)' : 'pañcacāmaram',
	},

17: {
	'mBnttg(g|l)' : 'mandākrāntā',
	'ymnsBl(g|l)' : 'śikhariṇī',
	'nsmrsl(g|l)' : 'hariṇī',
	'jsjsyl(g|l)' : 'pṛthvī',
	'njBjjl(g|l)' : 'narkuṭaka',
	},

18: { },

19: {
	'msjstt(g|l)' : 'śārdūlavikrīḍitā',
	},

20: { },

21: {
	'mrBnyy(y|j)' : 'sragdharā',
	},

22: { },

23: {
	'njjjjjjl(g|l)' : 'śravaṇābharaṇam', # also virājitam
	},

24: { }, 25: { }, 26: { },
}


# Note: Not used yet.
ardhasamavfttas_by_gaRas = {
# from "Peter's meters"
'nnrl(g|l)' : 'aparavaktra (ac 11)',
'njj(r|B)' : 'aparavaktra (bd 12)',
'ssjg(g|l)' : 'aupacchandasika (ac 11)',
'sBr(y|j)' : 'aupacchandasika (bd 12)',
'nnr(y|j)' : 'puṣpitāgrā (ac 12)',
'njjr(g|l)' : 'puṣpitāgrā (bd 13)',
'ssj(g|l)' : 'viyoginī (ac 10)',
'sBrl(g|l)' : 'viyoginī (bd 11)',

# more from Hahn 2014
'ssjg(g|l)' : 'mālābhāriṇī (ac 11)',
'sBr(y|j)' : 'mālābhāriṇī (bd 12)',
}


"""
	Lists of jātis by total mātrās in each pāda.
	Structure is: regex of flexible pattern, fixed pattern as list, name as string.
"""
jAtis_by_morae = [
['\[(12|11), (18|17), (12|11), (15|14)\]', [12, 18, 12, 15], 'āryā'],
['\[(12|11), (18|17), (12|11), (18|17)\]', [12, 18, 12, 18], 'gīti'],
['\[(12|11), (15|14), (12|11), (18|17)\]', [12, 15, 12, 18], 'udgīti'],
['\[(12|11), (15|14), (12|11), (15|14)\]', [12, 15, 12, 15], 'upagīti'],
['\[(16|15), (16|15), (16|15), (16|15)\]', [16, 16, 16, 16], 'mātrāsamaka'],
]
