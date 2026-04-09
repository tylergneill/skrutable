from skrutable.transliteration import Transliterator


def test_mapping_mAmakAH():
	input = "mAmakAH pARqavAS cEva kim akurvata saYjaya /\nDarmakzetre kurukzetre samavetA yuyutsavaH /"
	T = Transliterator()
	T.contents = input
	T.map_replace(from_scheme='SLP', to_scheme='DEV')
	output = T.contents
	print("\n\n test_mapping_mAmakAH OUTPUT: " + output + '\n\n')
	expected_output = "मआमअकआः पआणडअवआश चऐवअ कइम अकउरवअतअ सअञजअयअ /\nधअरमअकषएतरए कउरउकषएतरए सअमअवएतआ यउयउतसअवअः /"
	assert expected_output == output

def test_linear_preprocessing_cAtura():
	input = "चातुर"
	T = Transliterator()
	T.contents = input
	T.linear_preprocessing(from_scheme='DEV', to_scheme='SLP')
	output = T.contents
	print("\n\n test_linear_preprocessing_cAtura OUTPUT: " + output + '\n\n')
	expected_output = "चातुरa"
	assert expected_output == output

# anunāsika (candrabindu) round-trip tests

def test_anunasika_dev_to_slp_to_dev():
	# Devanagari ँ → SLP → Devanagari (identity)
	T = Transliterator()
	for (input, expected_output) in [
		('अँ', 'अँ'),
		('आँ', 'आँ'),
		('इँ', 'इँ'),
		('ईँ', 'ईँ'),
		('उँ', 'उँ'),
		('ऊँ', 'ऊँ'),
	]:
		output = T.transliterate(input, from_scheme='DEV', to_scheme='DEV')
		assert expected_output == output, f"input={input!r} expected={expected_output!r} got={output!r}"

def test_anunasika_dev_to_slp_to_bengali():
	# Devanagari ँ → SLP → Bengali (cross-script)
	T = Transliterator()
	for (input, expected_output) in [
		('अँ', 'অঁ'),
		('आँ', 'আঁ'),
		('इँ', 'ইঁ'),
		('ईँ', 'ঈঁ'),
		('उँ', 'উঁ'),
		('ऊँ', 'ঊঁ'),
	]:
		output = T.transliterate(input, from_scheme='DEV', to_scheme='BENGALI')
		assert expected_output == output, f"input={input!r} expected={expected_output!r} got={output!r}"

def test_anunasika_iast_to_slp_to_iast_preserve():
	# IAST ã → SLP → IAST with preserve_anunasika=True (identity)
	T = Transliterator()
	for (input, expected_output) in [
		('a\u0303', 'a\u0303'),
		('ā\u0303', 'ā\u0303'),
		('i\u0303', 'i\u0303'),
		('ī\u0303', 'ī\u0303'),
		('u\u0303', 'u\u0303'),
		('ū\u0303', 'ū\u0303'),
	]:
		output = T.transliterate(input, from_scheme='IAST', to_scheme='IAST', preserve_anunasika=True)
		assert expected_output == output, f"input={input!r} expected={expected_output!r} got={output!r}"

def test_anunasika_iast_to_slp_to_iast_normalize():
	# IAST ã → SLP → IAST with preserve_anunasika=False (→ anusvāra)
	T = Transliterator()
	for (input, expected_output) in [
		('a\u0303', 'aṃ'),
		('ā\u0303', 'āṃ'),
		('i\u0303', 'iṃ'),
		('ī\u0303', 'īṃ'),
		('u\u0303', 'uṃ'),
		('ū\u0303', 'ūṃ'),
	]:
		output = T.transliterate(input, from_scheme='IAST', to_scheme='IAST', preserve_anunasika=False)
		assert expected_output == output, f"input={input!r} expected={expected_output!r} got={output!r}"

def test_anunasika_dev_to_slp_to_hk():
	# Devanagari ँ → SLP → HK (mandatory normalization to anusvāra)
	T = Transliterator()
	for (input, expected_output) in [
		('अँ', 'aM'),
		('आँ', 'AM'),
		('इँ', 'iM'),
		('ईँ', 'IM'),
		('उँ', 'uM'),
		('ऊँ', 'UM'),
	]:
		output = T.transliterate(input, from_scheme='DEV', to_scheme='HK')
		assert expected_output == output, f"input={input!r} expected={expected_output!r} got={output!r}"

# def ():
# 	assert expected_output == output
