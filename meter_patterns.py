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

anuzwuB_odd_pAda_types_by_weights = {
'^(?!.ll.).{4}lgg.$' : 'pathyā',
'^.glgggg.$' : 'ma-vipulā',
'^.glggll.$' : 'bha-vipulā',
'^.ggggll.$' : 'bha-vipulā (rare variant preceded by ma-gaṇa)',
'^(?!.ll).{3}glll.$' : 'na-vipulā',
'^(?!.ll).{3}gglg.$' : 'ra-vipulā',
}
