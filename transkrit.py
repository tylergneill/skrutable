# -*- coding: utf-8 -*-

import os.path
import sys
import pickle
import re
import tables
import io

"""
	TRANSKRIT  (< 'transliterate Sanskrit')

	The following Sanskrit transliteration/encoding formats are supported:
		IAST (Unicode), SLP, HK, VH, DEV(anāgarī Unicode), "OAST" (Oliver Hellwig's, incomplete)
	All formats (including new additions) can be managed in "tables" module.
	Utilizes SLP under-the-hood for convenience of one-sign-per-phoneme.
	Handles issue of Devanāgarī 'inherent vowel' with linear pre-processing (relatively slow).
"""

settings_filename = 'settings.p'

def prompt_for_choice(header, menu_choices):
	"""
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


class TransliterationSettings(object):

	def __init__(self, reset_flag=False):
		
		self.initial_format = None
		self.final_format = None

		if reset_flag == False and os.path.isfile(settings_filename):
			# no signal NOT to look for previous settings, so load from file
			self.load()

# 		self.should_destroy_spaces = False
# 
# 		self.update(initializing=True)


	def load(self):

		settings_file = open(settings_filename, 'r')

		temp_S = pickle.load(settings_file) # TransliterationSettings() object
		self.initial_format = temp_S.initial_format
		self.final_format = temp_S.final_format
#		self.should_destroy_spaces = temp_S.should_destroy_spaces

		settings_file.close()


	def save(self):

		settings_file = open(settings_filename, 'w')
		P = pickle.Pickler(settings_file)
		P.dump(self)


	def update(self):

		if self.initial_format == None:
			self.initial_format = prompt_for_choice("Input", tables.available_formats)

		if self.final_format == None:
			self.final_format = prompt_for_choice("Output", tables.available_formats)

# 	def update(self, initializing=False, init_frmt=None, fin_frmt=None):
# 		"""
# 			Either loads transliteration settings from file
# 				or prompts user for same
# 				and saves choices to file as defaults for next time.
# 			Returns transliteration settings as four separate variables.
# 		"""
# 
# 		if initializing and os.path.isfile(settings_filename):
# 
# 			# load previous choices from file
# 			self.load()
# 
# 		else:
# 
# 			if init_frmt == None:
# 				self.initial_format = prompt_for_choice("Input", tables.available_formats)
# 
# 			if fin_frmt == None:
# 				self.final_format = prompt_for_choice("Output", tables.available_formats)
# 
# 			# save new choices
#			self.save()
# 
# 
# 	def destroy_spaces(self, decision=True):
# 
# 		if decision in [True, False]: self.should_destroy_spaces = decision
# 		# by default: the maximum conventional number of spaces are removed
# 		# could here give option to instead specify exactly which ones to remove
# 		# easiest: use prompt_for_choice() to suggest common configurations
# 		# 	final configuration option (most comprehensive): y/n on every possible option
# 		# advanced users: can modify tables.py


class Transliterator():

	def __init__(self, reset_flag=False):

		self.contents = None
		self.contents_original = None
		self.settings = TransliterationSettings(reset_flag)


	def linear_preprocessing(self, from_format, to_format):
		""" 
			Internal method.
			Purpose: Prepares for transliteration both to Devanagari (SLP_DEV) and from it (DEV_SLP)
				with special treatment of issues related to suppression of "inherent vowel".
			Encoding: Argument comes in as encoded UTF-8 text,
				is decoded to Unicode objects for easier identification of multi-byte characters,
				and is again re-encoded as UTF-8 before returned.
			Symmetrical IGNORE/ADD algorithm:
				When transliterating from DEV > SLP, after consonants, 
					one must IGNORE virAmas
					and ADD an explicit short 'a' vowel if no vowel (mAtrA) follows.
				When transliterating from SLP > DEV, after consonants, 
					one must IGNORE explicit short 'a' vowels
					and ADD a virAma if no vowel follows.
					(and also, other vowels following consonants are replaced with their mAtrA forms).
			Returns results by updating object's internal .contents attribute
				which here will contain a temporary, unnatural mix of Devanāgarī and Roman.
		"""

		if (from_format, to_format) == ('DEV', 'SLP') :		char_to_ignore = tables.virAma_unicode; char_to_add = 'a'
		elif (from_format, to_format) == ('SLP', 'DEV') :	char_to_ignore = 'a'; char_to_add = tables.virAma_unicode
		else: return

		text_unicode = self.contents.decode('utf-8') # from UTF-8-encoded hex strings > Unicode objects

		# buffers
		prev_char = ''
		hybrid_text_unicode_all_lines = [] # will build "temporary, unnatural mix of Devanāgarī and Roman"

		text_unicode = text_unicode.replace('\n', '\n\r')
		text_unicode_lines = text_unicode.split('\r')

		total_length = len(text_unicode_lines)

		for i, line in enumerate(text_unicode_lines):

			if total_length > 10000:
				# display progress at this, the slowest point
				progress = (i*1.0/total_length)*10000//1/100
				sys.stdout.write("\rprogress: %d%%" % progress)
				sys.stdout.flush()

			hybrid_text_unicode_line = ''

			for curr_char in line:

				if prev_char in tables.all_consonants_BOTH_unicode:

					if curr_char == char_to_ignore:
						pass

					elif curr_char not in tables.virAma_cancelling_vowels_unicode: # only for SLP>DEV
						hybrid_text_unicode_line += char_to_add + curr_char

					elif curr_char in tables.SLP_vowels_that_have_mAtrAs_unicode:
						hybrid_text_unicode_line += tables.SLP_vowels_to_DEV_mAtrAs_unicode[curr_char]

					else:
						hybrid_text_unicode_line += curr_char 

				else:
					hybrid_text_unicode_line += curr_char 

				prev_char = curr_char

			hybrid_text_unicode_all_lines.append(hybrid_text_unicode_line)

		hybrid_text_unicode	= ''.join(hybrid_text_unicode_all_lines)

		self.contents = hybrid_text_unicode.encode('utf-8') # Unicode objects > UTF-8-encoded hex strings


	def map_replace(self, from_format, to_format):
		"""
			Internal method.		
			Performs global replacement according to simple mapping.
			Returns results by updating object's internal .contents attribute.
		"""
		map = tables.maps_by_name[from_format + '_' + to_format]
		for (char_in, char_out) in map:
			self.contents = self.contents.replace(char_in, char_out)


# 	def destroy_spaces(self):
# 		"""
# 			Internal method.
# 			Transliteration format: SLP only.
# 			Purpose: Maximizes legal and preferred combination of akṣaras.
# 			Caveat: Assumes proper sandhi application,
# 			takes no responsibility for any non-trivial inconsistencies already present in data itself,
# 			(e.g. -n j- being written as such and not changed to -ñ j-).
# 			Returns results by updating object's internal .contents attribute.
# 		"""
# 		for	pattern in tables.which_spaces_destroyed:
# 			regex = re.compile(pattern) # of form "([X]) ([Y])", notice space excluded from parentheses
# 			self.contents = regex.sub("\\1\\2", self.contents)


	def transliterate(self, cntnts, initial_override=None, final_override=None):
		"""
			Primary method to be called on Transliteration object, needs no arguments.
			Purpose: routes processing via SLP, with option of destroying spaces.
			Calls other methods that update object's internal .contents attribute.
			Return resulting text as a string.
		"""
		self.contents = cntnts
		self.contents_original = cntnts

		# arbitrate among three potential sources for settings
		
		initial_format = final_format = ''

		if not (initial_override == final_override == None):

			# temporary overrides, not stored for later

			initial_format = initial_override
			final_format = final_override

		else: 

			# ensure that not empty, fetch from file if necessary
			self.settings.update()

			# store settings for later; can disable saving of settings by removing this line
			self.settings.save()

			initial_format = self.settings.initial_format
			final_format = self.settings.final_format


		# transliterate to SLP temporarily for further processing
		self.linear_preprocessing(from_format = initial_format, to_format = 'SLP')
		self.map_replace(from_format = initial_format, to_format = 'SLP')

# 
# 		# destroy space information as desired
# 		if self.settings.should_destroy_spaces: self.destroy_spaces()

		# transliterate to final desired format
		self.linear_preprocessing(from_format = 'SLP', to_format = final_format)
		self.map_replace(from_format = 'SLP', to_format = final_format)

		return self.contents


if __name__ == '__main__':
	"""
		Demonstrate basic use of objects.
	"""

	# just for demo run, grab from file, status update
	io.clear_screen()
	contents = io.load()
	print '\n' + "Input: \n%s" % (contents) + '\n'

# 	S = Settings()

	# optional
	# also accepts decision=False; or can just modify S.should_destroy_spaces directly
#	S.destroy_spaces()

# 	
# 	# just for demo run, convenient to be able to pass command-line argument
# 	if len(sys.argv) > 1 and '--reset' in sys.argv:
# 		S.update()	# also can use to override at any point
	reset_flag = False
	if len(sys.argv) > 1 and '--reset' in sys.argv:
		reset_flag = True

	T = Transliterator(reset_flag)
#	T = Transliterator()	# or just this, if no attention paid to resetting


# # 	if S.should_destroy_spaces == True:
# # 		print "Destroy spaces: %s" % S.should_destroy_spaces
# # 	print


 
 	transliterated_contents = T.transliterate(contents)

	# just for demo run, status update, save to file
 	print "Transliterating %s > %s..." % (T.settings.initial_format, T.settings.final_format)
 	print
	print "Output: \n%s" % (transliterated_contents)
	print
	

	io.save(transliterated_contents)

# 	
# 	# demo second run
# 	
# 	new_initial_format = T.settings.initial_format
# 	new_final_format = 'DEV'
#  	transliterated_contents = T.transliterate(contents, new_initial_format, new_final_format)
# 
# 	# just for demo run, status update, save to file
#  	print "Transliterating %s > %s..." % (new_initial_format, new_final_format)
#  	print
# 	print "Output: \n%s" % (transliterated_contents)
# 	print