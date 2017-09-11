file_encoding = 'utf-8' # change to match input if necessary (e.g., mac-roman)

# filename_extension = ".txt"
# input_filename_sans_extension = "input"
# input_filename = input_filename_sans_extension + filename_extension
# output_filename = input_filename_sans_extension + '_done' + filename_extension
input_filename = 'input.txt'
output_filename = 'output.txt'


def clear_screen(): print '\n' * 60

def load():
	input_file = open(input_filename, 'r')
	contents = input_file.read()
	input_file.close()

	# file encoding must be marked manually above, UTF-8 by default
	# if marked as different, attempt is made here to re-encode contents as UTF-8
	if file_encoding != 'utf-8':
		contents = contents.decode(file_encoding).encode('utf-8')

	return contents


def save(contents):
	"""
		Argument and output are simple text.
	"""
	output_file = open(output_filename, 'w')
	output_file.write(contents)
	output_file.close()


