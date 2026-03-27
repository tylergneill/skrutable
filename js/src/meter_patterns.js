// Sanskrit meter patterns and definitions

// Traditional "gaṇa" trisyllable abbreviation scheme
export const gaRas_by_weights = {
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
export const anuzwuB_pAda = {
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

export const samavftta_family_names = {
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

export function choose_heavy_gaRa_pattern(gaRa_pattern) {
  /*
  e.g., "...(g|l)" > "...g",
  e.g., "...(r|B)" > "...r",
  etc.
  */
  return gaRa_pattern.slice(0, -5) + gaRa_pattern.slice(-4, -3);
}

export const samavfttas_by_family_and_gaRa = {
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

export const all_known_samavRttas = [];
for (const k of Object.keys(samavfttas_by_family_and_gaRa)) {
  all_known_samavRttas.push(...Object.values(samavfttas_by_family_and_gaRa[k]));
}

export const ardhasamavftta_by_odd_even_regex_tuple = {
  'nnrl(g|l),njj(r|B)': 'aparavaktra = [11: nnrlg] 1,3 + [12: njjr] 2,4', // aka vaitālīya
  'sssl(g|l),BBBg(g|l)': 'upacitra = [11: ssslg] 1,3 + [11: BBBgg] 2,4',
  'nnr(y|j),njjr(g|l)': 'puṣpitāgrā = [12: nnry] 1,3 + [12: njjrg] 2,4', // aka aupacchandasika
  'ssj(g|l),sBrl(g|l)': 'viyoginī = [10: ssjg] 1,3 + [11: sBrlg] 2,4', // aka vaitālīya, sundarī
  'sss(g|l),BBBg(g|l)': 'vegavatī = [10: sssg] 1,3 + [11: BBBgg] 2,4',
  'sssl(g|l),nBB(r|B)': 'hariṇaplutā = [11: ssjgg] 1,3 + [12: nBBr] 2,4',
  'ssjg(g|l),sBr(y|j)': 'aupacchandasika = [11: ssjgg] 1,3 + [12: sBry] 2,4', // aka mālābhāriṇī
};

export const vizamavftta_by_4_tuple = {
  'sjsl,nsjg,Bnjlg,sjsjg': 'udgatā = [10: sjsl] + [10: nsjg] + [11: Bnjlg] + [13: sjsjg]',
  'sjsl,nsjg,BnBg,sjsjg': 'udgatā 2 = [10: sjsl] + [10: nsjg] + [10: BnBg] + [13: sjsjg]',
};

/*
Lists of jātis by total mātrās in each pāda.
Structure is: regex of flexible pattern, fixed pattern as list, name as string.
*/
export const jAtis_by_morae = [
  ['\\[(12|11),(18|17),(12|11),(15|14)\\]', [12, 18, 12, 15], 'āryā'],
  // see Andrew Ollett's work (e.g., @ prakrit.info) for extra rules on Prakrit gāhā...
  ['\\[(12|11),(18|17),(12|11),(18|17)\\]', [12, 18, 12, 18], 'gītiḥ'],
  ['\\[(12|11),(15|14),(12|11),(15|14)\\]', [12, 15, 12, 15], 'upagītiḥ'],
  ['\\[(12|11),(15|14),(12|11),(18|17)\\]', [12, 15, 12, 18], 'udgītiḥ'],
  ['\\[(12|11),(20|19),(12|11),(20|19)\\]', [12, 20, 12, 20], 'āryāgītiḥ'],
  // ['\\[(14|13), (16|15), (14|13), (16|15)\\]', [12, 18, 12, 18], 'vaitālīya'], // more rules...
  // ['\\[(16|15), (16|15), (16|15), (16|15)\\]', [16, 16, 16, 16], 'mātrāsamaka'], // more rules...
];

export const meter_melodies = {
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