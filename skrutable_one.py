from skrutable.scheme_detection import SchemeDetector
from skrutable.transliteration import Transliterator
from skrutable.scansion import Scanner
from skrutable.meter_identification import MeterIdentifier
from skrutable.config import load_config_dict_from_json_file
import sys, re

allowed_input_filetypes = ['.txt', '.md'] # set acceptable input file types

def get_input(input_fn):
	with open(input_fn, 'r') as input_file:
		return input_file.read()

def write_output(output_data, output_fn):
	with open(output_fn, 'w') as output_file:
		output_file.write(output_data)

SD = SchemeDetector()
T = Transliterator()
S = Scanner()
MI = MeterIdentifier()

# look for mandatory input file
for arg in sys.argv:
	if arg[arg.find('.'):] in allowed_input_filetypes:
		input_fn = arg
		input_data = get_input(input_fn)
		break
else:
	print("no input file found (allowable types: %s)"
	% (', '.join( [ft[1:] for ft in allowed_input_filetypes] ) ) )
	exit()

# look for option to also output to terminal
verbose = False
if '--verbose' in sys.argv or '-v' in sys.argv:
	verbose = True

# look for scheme info
f_s = t_s = None
for arg in sys.argv:
	if arg[:10] == 'to_scheme=':
		t_s = re.sub(r'["“”\'‘’]', '', arg[10:]) # exclude quotes
	elif arg[:12] == 'from_scheme=':
		f_s = re.sub(r'["“”\'‘’]', '', arg[12:])

if '--transliterate' in sys.argv or '-t' in sys.argv:
	output_data = T.transliterate(input_data, from_scheme=f_s, to_scheme=t_s)
	output_fn_suffix = '_transliterated'

elif '--detect_scheme' in sys.argv or '-d' in sys.argv:
	output_data = SD.detect_scheme(input_data, from_scheme=f_s)
	verbose = True # only output to Terminal

elif '--scan' in sys.argv or '-s' in sys.argv:
	object_result = S.scan(input_data, from_scheme=f_s)
	output_data = object_result.summarize()
	output_fn_suffix = '_scanned'

elif '--identify_meter' in sys.argv or '-i' in sys.argv:

	# look for resplit option
	r_o = None
	for arg in sys.argv:
		if arg[:15] == 'resplit_option=':
			r_o = re.sub(r'["“”\'‘’]', '', arg[15:]) # exclude quotes
			break
	else:
		config = load_config_dict_from_json_file()
		r_o = config["default_resplit_option"]  # e.g. "none", "resplit_hard"

	# look for whole-file option
	if '--whole_file' in sys.argv:

		verses = input_data.split('\n')
		output_data = ''
		for verse in verses:
			result = MI.identify_meter(verse, from_scheme=f_s, resplit_option=r_o)
			output_data += (result.text_raw + '\n' + result.summarize() + '\n')
	else:
		result = MI.identify_meter(input_data, from_scheme=f_s, resplit_option=r_o)
		output_data = result.text_raw + '\n' + result.summarize()

	output_fn_suffix = '_identified'

else:
	print("mode not specified")
	exit()

# output to file
p_i = input_fn.find('.') # index of period for filename extension
output_fn = input_fn[:p_i] + output_fn_suffix + input_fn[p_i:]
write_output(output_data, output_fn)

# optional: output to terminal
if verbose: print(output_data)
