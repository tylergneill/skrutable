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
		# sign written on the semivowel: moved onto the preceding vowel
		('jñānavāl~loke', 'jñānavām\u0310lloke'),
		('jñānavāl\u0303loke', 'jñānavām\u0310lloke'),
		('jñānavālm\u0310loke', 'jñānavām\u0310lloke'),
		# sign written on the vowel (the usual form): unchanged
		('jñānavām\u0310lloke', 'jñānavām\u0310lloke'),
		('devām\u0310l loke', 'devām\u0310l loke'),
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
		('वाल्ँलोके', 'vA~lloke', 'vAMlloke'),
		('वाँल्लोके', 'vA~lloke', 'vAMlloke'),
	]:
		out_preserve = T.transliterate(input, from_scheme='DEV', to_scheme='HK')
		assert expected_preserve == out_preserve, f"input={input!r} expected={expected_preserve!r} got={out_preserve!r}"
		out_normalize = T.transliterate(input, from_scheme='DEV', to_scheme='HK', preserve_anunasika=False)
		assert expected_normalize == out_normalize, f"input={input!r} expected={expected_normalize!r} got={out_normalize!r}"

def test_anunasika_semivowel():
	# nasalized semivowel (y, l, v): the sign is always parked on the preceding vowel,
	# as m̐ when preserved or ṃ when flattened, wherever the input had it
	T = Transliterator()
	for (input, from_scheme, expected_preserve, expected_normalize) in [
		('jñānavālm\u0310loke', 'IAST', 'jñānavām\u0310lloke', 'jñānavāṃlloke'),
		('jñānavāl~loke', 'IAST', 'jñānavām\u0310lloke', 'jñānavāṃlloke'),
		('jñānavāl\u0303loke', 'IAST', 'jñānavām\u0310lloke', 'jñānavāṃlloke'),
		('jñānavālṃloke', 'IAST', 'jñānavām\u0310lloke', 'jñānavāṃlloke'),
		('ज्ञानवाल्ँलोके', 'DEV', 'jñānavām\u0310lloke', 'jñānavāṃlloke'),
		('ज्ञानवाल्ंलोके', 'DEV', 'jñānavām\u0310lloke', 'jñānavāṃlloke'),
		('saym\u0310yantā', 'IAST', 'sam\u0310yyantā', 'saṃyyantā'),
		('savm\u0310vatsaraḥ', 'IAST', 'sam\u0310vvatsaraḥ', 'saṃvvatsaraḥ'),
		# strict SLP input, with the sign on the semivowel
		('jYAnavAl~loke', 'SLP', 'jñānavām\u0310lloke', 'jñānavāṃlloke'),
		('jYAnavAl~ loke', 'SLP', 'jñānavām\u0310l loke', 'jñānavāṃl loke'),
		# sign already on the vowel: unchanged
		('jñānavām\u0310lloke', 'IAST', 'jñānavām\u0310lloke', 'jñānavāṃlloke'),
		('ज्ञानवाँल्लोके', 'DEV', 'jñānavām\u0310lloke', 'jñānavāṃlloke'),
		('सँय्यन्ता', 'DEV', 'sam\u0310yyantā', 'saṃyyantā'),
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

def test_anunasika_parked_form_round_trips():
	# the form used in practice, with the sign on the vowel, survives every direction
	T = Transliterator()
	iast, dev, slp = 'devām\u0310lloke', 'देवाँल्लोके', 'devA~lloke'
	assert slp == T.transliterate(iast, from_scheme='IAST', to_scheme='SLP')
	assert slp == T.transliterate(dev, from_scheme='DEV', to_scheme='SLP')
	assert dev == T.transliterate(iast, from_scheme='IAST', to_scheme='DEV')
	assert iast == T.transliterate(dev, from_scheme='DEV', to_scheme='IAST')
	assert iast == T.transliterate(slp, from_scheme='SLP', to_scheme='IAST')
	assert dev == T.transliterate(slp, from_scheme='SLP', to_scheme='DEV')
	# the same sandhi written with a space joins up in Devanagari
	assert dev == T.transliterate('devām\u0310l loke', from_scheme='IAST', to_scheme='DEV')
	# strict SLP (sign on the semivowel) comes out in the parked form too
	assert dev == T.transliterate('devAl~loke', from_scheme='SLP', to_scheme='DEV')
	assert dev == T.transliterate('devAl~ loke', from_scheme='SLP', to_scheme='DEV')
	assert slp == T.transliterate('devAl~loke', from_scheme='SLP', to_scheme='SLP')
	# no half-consonant + candrabindu sequence is ever produced
	assert '\u094d\u0901' not in T.transliterate('devAl~loke', from_scheme='SLP', to_scheme='DEV')

def test_anunasika_iast_input_variants():
	# m̐ is two codepoints, m (U+006D) + combining candrabindu (U+0310);
	# letter + tilde is also accepted, combining (U+0303) or precomposed
	T = Transliterator()
	for (input, expected_slp) in [
		('am\u0310', 'a~'),
		('AM\u0310', 'a~'),
		('a\u0303', 'a~'),             # a + combining tilde
		('\u00e3', 'a~'),              # precomposed a-tilde
		('\u0129', 'i~'),              # precomposed i-tilde
		('\u0169', 'u~'),              # precomposed u-tilde
		('a\u0304\u0303', 'A~'),       # a + macron + tilde
		('a\u0303\u0304', 'A~'),       # a + tilde + macron
		('\u0101\u0303', 'A~'),        # precomposed a-macron + tilde
		('\u00e3\u0304', 'A~'),        # precomposed a-tilde + macron
		('\u016b\u0303', 'U~'),
		('dev\u0101l\u0303loke', 'devA~lloke'),       # l + combining tilde
		('sa\u1ef9yant\u0101', 'sa~yyantA'),          # precomposed y-tilde
		('sa\u1e7dvatsara\u1e25', 'sa~vvatsaraH'),    # precomposed v-tilde
	]:
		output = T.transliterate(input, from_scheme='IAST', to_scheme='SLP')
		assert expected_slp == output, f"input={input!r} expected={expected_slp!r} got={output!r}"

def test_iast_decomposed_n_tilde_is_palatal_nasal():
	# n + combining tilde (U+0303) is just ñ, never a nasalized n
	T = Transliterator()
	for input in ['j\u00f1\u0101na', 'jn\u0303\u0101na', 'jn\u0303a\u0304na', 'JN\u0303\u0100NA']:
		assert 'jYAna' == T.transliterate(input, from_scheme='IAST', to_scheme='SLP'), f"input={input!r}"
		assert 'j\u00f1\u0101na' == T.transliterate(input, from_scheme='IAST', to_scheme='IAST'), f"input={input!r}"

# def ():
# 	assert expected_output == output
