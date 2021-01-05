from skrutable.scansion import Scanner
from skrutable.meter_identification import MeterIdentifier
from skrutable.meter_identification import VerseTester

def test_count_pAdasamatva():

	S = Scanner()
	input_string = """sampūrṇakumbho na karoti śabdam
ardho ghaṭo ghoṣamupaiti nūnam
vidvānkulīno na karoti garvaṃ
jalpanti mūḍhāstu guṇairvihīnāḥ"""
	V = S.scan(input_string, from_scheme='IAST')
	VT = VerseTester()
	import pdb; pdb.set_trace()
	VT.count_pAdasamatva(V)
	output = VT.pAdasamatva_count
	expected_output = 4

	assert expected_output == output

def test_test_as_upajAti():

	S = Scanner()
	input_string = """kolAhale kAkakulasya jAte
virAjate kokilakUjitaM kim
parasparaM saMvadatAM KalAnAM
mOnaM viDeyaM satataM suDIBiH"""
	V = S.scan(input_string, from_scheme='SLP')
	import pdb; pdb.set_trace()
	VT = VerseTester()
	output = VT.test_as_upajAti(V)
	print(output)
	assert output != None
