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
	# Devanagari ँ → SLP → HK: HK has no anunāsika, so SLP ~ passes through unless flattening
	T = Transliterator()
	for (input, expected_preserve, expected_normalize) in [
		('अँ', 'a~', 'aM'),
		('आँ', 'A~', 'AM'),
		('इँ', 'i~', 'iM'),
		('ईँ', 'I~', 'IM'),
		('उँ', 'u~', 'uM'),
		('ऊँ', 'U~', 'UM'),
		('वाल्ँलोके', 'vAl~loke', 'vAMlloke'),
	]:
		out_preserve = T.transliterate(input, from_scheme='DEV', to_scheme='HK')
		assert expected_preserve == out_preserve, f"input={input!r} expected={expected_preserve!r} got={out_preserve!r}"
		out_normalize = T.transliterate(input, from_scheme='DEV', to_scheme='HK', preserve_anunasika=False)
		assert expected_normalize == out_normalize, f"input={input!r} expected={expected_normalize!r} got={out_normalize!r}"

def test_anunasika_semivowel():
	# nasalized semivowel (y, l, v): preserved as m̐ after it, or flattened to ṃ before it
	T = Transliterator()
	for (input, from_scheme, expected_preserve, expected_normalize) in [
		('jñānavālm\u0310loke', 'IAST', 'jñānavālm\u0310loke', 'jñānavāṃlloke'),
		('jñānavāl~loke', 'IAST', 'jñānavālm\u0310loke', 'jñānavāṃlloke'),
		('jñānavāl\u0303loke', 'IAST', 'jñānavālm\u0310loke', 'jñānavāṃlloke'),
		('jñānavālṃloke', 'IAST', 'jñānavālm\u0310loke', 'jñānavāṃlloke'),
		('ज्ञानवाल्ँलोके', 'DEV', 'jñānavālm\u0310loke', 'jñānavāṃlloke'),
		('ज्ञानवाल्ंलोके', 'DEV', 'jñānavālm\u0310loke', 'jñānavāṃlloke'),
		('saym\u0310yantā', 'IAST', 'saym\u0310yantā', 'saṃyyantā'),
		('savm\u0310vatsaraḥ', 'IAST', 'savm\u0310vatsaraḥ', 'saṃvvatsaraḥ'),
		# nasalized vowel before l is unaffected
		('jñānavām\u0310lloke', 'IAST', 'jñānavām\u0310lloke', 'jñānavāṃlloke'),
	]:
		out_preserve = T.transliterate(input, from_scheme=from_scheme, to_scheme='IAST')
		assert expected_preserve == out_preserve, f"input={input!r} expected={expected_preserve!r} got={out_preserve!r}"
		out_normalize = T.transliterate(input, from_scheme=from_scheme, to_scheme='IAST', preserve_anunasika=False)
		assert expected_normalize == out_normalize, f"input={input!r} expected={expected_normalize!r} got={out_normalize!r}"

def test_anunasika_iastreduced_always_flattens():
	T = Transliterator()
	output = T.transliterate('jñānavālm\u0310loke', from_scheme='IAST', to_scheme='IASTREDUCED')
	assert 'l' + 'm' + 'l' not in output, f"got={output!r}"
	assert output == T.transliterate('jñānavāṃlloke', from_scheme='IAST', to_scheme='IASTREDUCED')

# def ():
# 	assert expected_output == output
