from skrutable.scheme_detection import SchemeDetector
from skrutable.transliteration import Transliterator
from skrutable.scansion import Scanner
from skrutable.meter_identification import MeterIdentifier

def get_input(input_fn):
	input_data = open(input_fn, 'r').read()
	input_file.close()
	return input_data

def write_output(output_data, output_fn):
	output_file = open(output_fn, 'w')
	output_file.write(output_data)
	output_file.close()

SD = SchemeDetector()
T = Transliterator()
S = Scanner()
MI = MeterIdentifier()

import sys, re
if '--transliterate' in sys.argv:
	for arg in sys.argv:
		if arg[:10] == 'to_scheme=':
			t_s = arg[10:]
		elif arg[:12] == 'from_scheme=':
			f_s = arg[12:]
		elif arg[-4:] in ['.txt']: # can extend to more input types
			input_fn = arg
	input_data = get_input(input_fn)
	output_data = T.transliterate(input_data, from_scheme=f_s, to_scheme=t_s)
	p_i = input_fn[input_fn.find('.')] # period index
	output_fn = input_fn[:p_i] + '_transliterated' + input_fn[p_i:]
	write_output(output_data, output_fn)

elif '--scan' in sys.argv:
	pass

elif '--identify_meter' in sys.argv:
	pass

# string_result = SD.detect_scheme( input_string )
#
# string_result = T.transliterate( input_string ) # using defaults
# another_string_result = T.transliterate( input_string)
#
# object_result = S.scan( input_string )
# print( object_result.summarize() )
#
# object_result = MI.identify_meter( input_string ) # default resplit_option
# print( object_result.summarize() )
# another_object_result = MI.identify_meter(input_string, resplit_option='resplit_hard')
# print( another_object_result.meter_label() )
