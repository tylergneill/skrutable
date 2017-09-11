import os.path
import sys
import pickle
import tables

settings_filename = 'settings.p'

def prompt_for_choice(menu_choices):
	"""
		Given a list of strings to choose from,
			presents a numbered list and prompts for user choice.
		Choice can be either the number in the list or the exact string.
		Returns chosen string.
	"""

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
	return valid_final_choice


class Settings(object):

	def __init__(self):
		
		self.initial_format = None
		self.final_format = None
		self.should_destroy_spaces = False

		self.update(initializing=True)


	def load(self):

		settings_file = open(settings_filename, 'r')

		temp_S = pickle.load(settings_file) # settings.Settings() object
		self.initial_format = temp_S.initial_format
		self.final_format = temp_S.final_format
		self.should_destroy_spaces = temp_S.should_destroy_spaces

		settings_file.close()


	def save(self):

		settings_file = open(settings_filename, 'w')
		P = pickle.Pickler(settings_file)
		P.dump(self)


	def update(self, initializing=False, init_frmt=None, fin_frmt=None):
		"""
			Either loads transliteration settings from file
				or prompts user for same
				and saves choices to file as defaults for next time.
			Returns transliteration settings as four separate variables.
		"""

		if initializing and os.path.isfile(settings_filename):

			# load previous choices from file
			self.load()

		else:

			if init_frmt == None:
				print "Input is in:"
				self.initial_format = prompt_for_choice(tables.available_formats)
				print

			if fin_frmt == None:
				print "Output to:"
				self.final_format = prompt_for_choice(tables.available_formats)
				print

			# save new choices
			self.save()


	def destroy_spaces(self, decision=True):

		if decision in [True, False]: self.should_destroy_spaces = decision
		# by default: the maximum conventional number of spaces are removed
		# could here give option to instead specify exactly which ones to remove
		# easiest: use prompt_for_choice() to suggest common configurations
		# 	final configuration option (most comprehensive): y/n on every possible option
		# advanced users: can modify tables.py