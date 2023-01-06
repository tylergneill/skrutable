from skrutable.transliteration import Transliterator
from skrutable import scheme_maps

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

# def ():
# 	assert expected_output == output
