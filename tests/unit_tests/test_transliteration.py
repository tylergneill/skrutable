from skrutable.transliteration import Transliterator
from skrutable import scheme_maps

def test_mapping():

	input = "mAmakAH pARqavAS cEva kim akurvata saYjaya /\nDarmakzetre kurukzetre samavetA yuyutsavaH /"
	T = Transliterator()
	T.contents = input
	output = T.map_replace(from_scheme='SLP', to_scheme='DEV')
	output = T.contents
	expected_output = "मआमअकआः पआणडअवआश चऐवअ कइम अकउरवअतअ सअञजअयअ /\nधअरमअकषएतरए कउरउकषएतरए सअमअवएतआ यउयउतसअवअः /"

	assert expected_output == output
