from skrutable.scansion import Scanner
from skrutable.meter_identification import MeterIdentifier
from skrutable.meter_identification import VerseTester

def test_test_pAdasamatva():

	S = Scanner()
	input_string = """sampūrṇakumbho na karoti śabdam
ardho ghaṭo ghoṣamupaiti nūnam
vidvānkulīno na karoti garvaṃ
jalpanti mūḍhāstu guṇairvihīnāḥ"""
	V = S.scan(input_string, from_scheme='IAST')
	VT = VerseTester()
	output = VT.test_pAdasamatva(V)
	expected_output = 4

	assert expected_output == output
