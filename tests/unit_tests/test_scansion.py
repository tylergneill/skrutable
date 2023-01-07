from skrutable.scansion import Scanner


# def test_Verse_summarize_Darmakzetre_IAST():
# 	input = """dharmakṣetre kurukṣetre samavetā yuyutsavaḥ /
# māmakāḥ pāṇḍavāś caiva kim akurvata sañjaya //"""
# 	S = Scanner()
# 	V = S.scan(input, from_scheme='IAST')
# 	output = V.summarize()
# 	print("\n\n test_Verse_summarize_Darmakzetre_IAST OUTPUT: " + output + '\n\n')
# 	expected_output = """gggglgggllgglglg   [27]
# glgglgglllgllgll   [23]
#
#    dha   rma   kṣe   tre    ku    ru   kṣe   tre    sa    ma    ve    tā    yu    yu   tsa   vaḥ
#      g     g     g     g     l     g     g     g     l     l     g     g     l     g     l     g
#     mā    ma    kā   ḥpā   ṇḍa    vā  ścai    va    ki    ma    ku   rva    ta    sa   ñja    ya
#      g     l     g     g     l     g     g     l     l     l     g     l     l     g     l     l
#
# (vṛttam ajñātam...)"""
# 	print("\n\n test_Verse_summarize_Darmakzetre_IAST EXPECTED OUTPUT: " + expected_output + '\n\n')
# 	assert expected_output == output

def test_Verse_summarize2_Darmakzetre_IAST():
	input = """dharmakṣetre kurukṣetre
samavetā yuyutsavaḥ /
māmakāḥ pāṇḍavāś caiva
kim akurvata sañjaya //"""
	S = Scanner()
	V = S.scan(input, from_scheme='IAST')
	output = V.summarize(
	show_weights=False, show_morae=False, show_gaRas=False, # part_A
	show_alignment=False, # part_B
	show_label=False  # part_C
	)
	print("\n\ntest_Verse_summarize_Darmakzetre_IAST OUTPUT:\n" + output + '\n\n')
	expected_output = ''
	assert expected_output == output

# def ():
# 	assert expected_output == output
