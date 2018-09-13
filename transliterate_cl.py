import transliteration
import tables
import sys

def prompt_for_choice(header, menu_choices):
	"""
		For demo use only.
		Given a introductory header and a list of strings to choose from,
			presents a numbered list and prompts for user choice.
		Choice can be either the number in the list or the exact string.
		Returns chosen string.
	"""

	print header

	possible_choices = []
	for n, mc in enumerate(menu_choices):
		print "%d) %s" % (n+1, mc)
		possible_choices.append(str(n+1))
		possible_choices.append(mc)

	valid_final_choice = None
	while not valid_final_choice:

		curr_choice = raw_input("(Choose by number or exact text) > ")

		for i, possible_choice in enumerate(possible_choices):
			if curr_choice == possible_choice:
				valid_final_choice = menu_choices[i // 2] # always returns the string, not the number
				break
		else:				
			print "Not a valid option. Try again."
			continue

	print valid_final_choice
	print

	return valid_final_choice

"""
	Demos basic use of objects.
	Takes input from file.
	Looks for command-line flags --reset and --destroy_spaces and adjusts settings.
	Outputs to screen and to file.
"""

# for demo
import demo_io
demo_io.clear_screen()
contents = demo_io.load() # see separate module for filenames
print
print "Input: \n%s" % (contents)
print

T = transliteration.Transliterator()
# previous default settings are loaded from file as available

# other constructor options
# 	T = Transliterator(default_from_scheme='IAST', default_to_scheme='SLP')
# 	T = Transliterator('DEV', 'IAST')
# 	T = Transliterator(default_to_scheme='SLP')
# 	T = Transliterator(default_destroy_spaces='True')
# 	T = Transliterator('DEV', 'IAST', default_destroy_spaces='True')

# all these settings given when invoking the constructor are saved
# whereas settings given when calling the transliterator are not saved (cp. below)

# for demo: command-line flags given and/or settings missing
if 	(
	len(sys.argv) > 1
	or T.settings.from_scheme == None or T.settings.to_scheme == None
	):

	# settings reset
	if (
		'--reset' in sys.argv
		or T.settings.from_scheme == None or T.settings.to_scheme == None
		):
		T.settings.from_scheme = prompt_for_choice('Input', tables.available_schemes)
		T.settings.to_scheme = prompt_for_choice('Output', tables.available_schemes)
		T.settings.destroy_spaces = False

	# destroy_spaces positive override
	if (
		'--destroy_spaces' in sys.argv
		or T.settings.destroy_spaces == True
		):
		T.settings.destroy_spaces = True
	elif T.settings.destroy_spaces in [False, None]:
		T.settings.destroy_spaces = False

	T.settings.save()

transliterated_contents = T.transliterate(contents)
# returned as string

# other method options
# 	T.transliterate(content, from_scheme='DEV', to_scheme='IAST')
# 	T.transliterate(content, 'DEV', 'IAST')
# 	T.transliterate(content, from_scheme='PROMPT', to_scheme='SLP')
# 	T.transliterate(content, to_scheme='SLP')
# 	T.transliterate(content, destroy_spaces=True)
# 	T.transliterate(content, 'DEV', 'IAST', destroy_spaces=True)
# similar to above, but these settings are NOT saved (cp. above)

# for demo
print "%s > %s..." % (T.settings.from_scheme, T.settings.to_scheme)
print "destroy_spaces = ", T.settings.destroy_spaces
print
print "Output: \n%s" % (transliterated_contents)
print
demo_io.save(transliterated_contents)