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
	# Devanagari ँ → SLP → Devanagari
	T = Transliterator()
	for (input, expected_preserve, expected_normalize) in [
		('अँ', 'अँ', 'अं'),
		('आँ', 'आँ', 'आं'),
		('इँ', 'इँ', 'इं'),
		('ईँ', 'ईँ', 'ईं'),
		('उँ', 'उँ', 'उं'),
		('ऊँ', 'ऊँ', 'ऊं'),
	]:
		out_preserve = T.transliterate(input, from_scheme='DEV', to_scheme='DEV', preserve_anunasika=True)
		assert expected_preserve == out_preserve, f"input={input!r} expected={expected_preserve!r} got={out_preserve!r}"
		out_normalize = T.transliterate(input, from_scheme='DEV', to_scheme='DEV', preserve_anunasika=False)
		assert expected_normalize == out_normalize, f"input={input!r} expected={expected_normalize!r} got={out_normalize!r}"

def test_anunasika_dev_to_slp_to_bengali():
	# Devanagari ँ → SLP → Bengali (cross-script)
	T = Transliterator()
	for (input, expected_preserve, expected_normalize) in [
		('अँ', 'অঁ', 'অং'),
		('आँ', 'আঁ', 'আং'),
		('इँ', 'ইঁ', 'ইং'),
		('ईँ', 'ঈঁ', 'ঈং'),
		('उँ', 'উঁ', 'উং'),
		('ऊँ', 'ঊঁ', 'ঊং'),
	]:
		out_preserve = T.transliterate(input, from_scheme='DEV', to_scheme='BENGALI', preserve_anunasika=True)
		assert expected_preserve == out_preserve, f"input={input!r} expected={expected_preserve!r} got={out_preserve!r}"
		out_normalize = T.transliterate(input, from_scheme='DEV', to_scheme='BENGALI', preserve_anunasika=False)
		assert expected_normalize == out_normalize, f"input={input!r} expected={expected_normalize!r} got={out_normalize!r}"

def test_anunasika_iast_to_slp_to_iast_preserve():
	# IAST ã / am̐ / a~ → SLP → IAST with preserve_anunasika=True (→ m̐)
	T = Transliterator()
	for (input, expected_output) in [
		('a\u0303', 'am\u0310'),
		('ā\u0303', 'ām\u0310'),
		('i\u0303', 'im\u0310'),
		('ī\u0303', 'īm\u0310'),
		('u\u0303', 'um\u0310'),
		('ū\u0303', 'ūm\u0310'),
		('ūm\u0310', 'ūm\u0310'),
		('ū~', 'ūm\u0310'),
		# nasalized semivowel: nasalization follows the l
		('jñānavāl~loke', 'jñānavālm\u0310loke'),
		('jñānavāl\u0303loke', 'jñānavālm\u0310loke'),
		('jñānavālm\u0310loke', 'jñānavālm\u0310loke'),
		# nasalized vowel: nasalization follows the ā
		('jñānavām\u0310lloke', 'jñānavām\u0310lloke'),
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
		('ūm\u0310', 'ūṃ'),
	]:
		output = T.transliterate(input, from_scheme='IAST', to_scheme='IAST', preserve_anunasika=False)
		assert expected_output == output, f"input={input!r} expected={expected_output!r} got={output!r}"

def test_iast_m_dot_above_is_anusvara():
	# ṁ (precomposed or m + U+0307) is simply a variant of ṃ, never anunāsika
	T = Transliterator()
	for input in ['saṁskṛta', 'sam\u0307skṛta']:
		for preserve in (True, False):
			output = T.transliterate(input, from_scheme='IAST', to_scheme='IAST', preserve_anunasika=preserve)
			assert 'saṃskṛta' == output, f"input={input!r} preserve={preserve} got={output!r}"
	output = T.transliterate('jñānavāṁlloke', from_scheme='IAST', to_scheme='IAST', preserve_anunasika=True)
	assert 'jñānavāṃlloke' == output, f"got={output!r}"

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
