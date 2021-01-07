from skrutable.scansion import Scanner
from skrutable.meter_identification import MeterIdentifier
from skrutable.meter_identification import VerseTester

def test_test_as_anuzwuB():
	S = Scanner()
	input_string = """yadA yadA hi Darmasya
glAnirBavati BArata
aByutTAnamaDarmasya
tadAtmAnaM sfjAmyaham"""
	V = S.scan(input_string, from_scheme='SLP')
	VT = VerseTester()
	VT.test_as_anuzwuB(V)
	output = V.meter_label
	print("\n\n test_test_as_anuzwuB OUTPUT: " + output + '\n\n')
	expected_output = "anuṣṭubh (ab: pathyā, cd: pathyā)"
	assert output == expected_output

def test_identify_anuzwuB_split():
	MI = MeterIdentifier()
	input_string = """yadA yadA hi Darmasya
glAnirBavati BArata
aByutTAnamaDarmasya
tadAtmAnaM sfjAmyaham"""
	object_result = MI.identify_meter(input_string, from_scheme='SLP', resplit_option='resplit_hard')
	output = object_result.meter_label
	output = output[:8]
	print("\n\n test_identify_anuzwuB_split OUTPUT: " + output + '\n\n')
	expected_output = "anuṣṭubh"
	assert output == expected_output

def test_count_pAdasamatva():
	S = Scanner()
	input_string = """sampūrṇakumbho na karoti śabdam
ardho ghaṭo ghoṣamupaiti nūnam
vidvānkulīno na karoti garvaṃ
jalpanti mūḍhāstu guṇairvihīnāḥ"""
	V = S.scan(input_string, from_scheme='IAST')
	VT = VerseTester()
	VT.count_pAdasamatva(V)
	output = VT.pAdasamatva_count # int
	print("\n\n test_count_pAdasamatva OUTPUT: " + str(output) + '\n\n')
	expected_output = 4
	assert output == expected_output

def test_test_as_upajAti():
	S = Scanner()
	input_string = """kolAhale kAkakulasya jAte
virAjate kokilakUjitaM kim
parasparaM saMvadatAM KalAnAM
mOnaM viDeyaM satataM suDIBiH"""
	V = S.scan(input_string, from_scheme='SLP')
	VT = VerseTester()
	output = VT.test_as_upajAti(V)
	print("\n\n test_test_as_upajAti OUTPUT: " + output + '\n\n')
	expected_output = "upajāti"
	assert output[:7] == expected_output
