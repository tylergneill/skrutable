"""
	Transliterates Sanskrit text.
	Supports the following Sanskrit transliteration schemes:
		ASCII: SLP, HK, VH, "OAST" (Oliver's, for DCS);
		Unicode: IAST, DEV(anagari).
	Uses one-phoneme-one-character SLP under-the-hood.
	Manages schemes and other data with help of internal "tables" module.
	Handles issue of Devanagari 'inherent vowel' with linear pre-processing.
		(= limiting factor on speed)
"""

import os.path
import sys
import pickle
import re
import tables

settings_filename = 'last_used.p'
settings_file_path = os.path.join(os.getcwd(), settings_filename)
# make sure settings file will be co-located with modules
# abs_dir = os.path.split(os.path.abspath(__file__))[0] # absolute dir of transliteration.py
# settings_file_path = os.path.join(abs_dir, settings_filename) # same absolute dir

class TransliterationSettings(object):

	def __init__(self, set_from_scheme=None, set_to_scheme=None, set_destroy_spaces=None):

		self.from_scheme = self.to_scheme = None
		self.destroy_spaces = False

		# load whatever previous settings available from file
		if os.path.isfile(settings_file_path): self.load()

# 		if	(
# 			(set_from_scheme == None or set_to_scheme == None or set_destroy_spaces==None) and
# 			os.path.isfile(settings_file_path)
# 			):
# 			self.load()

		# but then also override with any newly specified choices
		if set_from_scheme != None: self.from_scheme = set_from_scheme
		if set_to_scheme != None: self.to_scheme = set_to_scheme
		if set_destroy_spaces != None: self.destroy_spaces = set_destroy_spaces

		self.save()


	def load(self):
		settings_file = open(settings_file_path, 'r')		
		self.from_scheme, self.to_scheme, self.destroy_spaces = pickle.load(settings_file)
# 		self.from_scheme = temp_S.from_scheme
# 		self.to_scheme = temp_S.to_scheme
# 		self.destroy_spaces = temp_S.destroy_spaces
		settings_file.close()


	def save(self):
		settings_file = open(settings_file_path, 'w')
		P = pickle.Pickler(settings_file)
		P.dump((self.from_scheme, self.to_scheme, self.destroy_spaces))
		settings_file.close()


class Transliterator():

	def __init__(self, set_from_scheme=None, set_to_scheme=None, set_destroy_spaces=None):
		"""
			Settings passed in to constructor are saved for future use.
		"""

		self.contents = None
		self.settings = TransliterationSettings(set_from_scheme, set_to_scheme, set_destroy_spaces)

	def linear_preprocessing(self, from_scheme, to_scheme):
		""" 
			Internal method.
			Purpose: Prepares for transliteration both to Devanagari (SLP_DEV) and from it (DEV_SLP)
				with special treatment of issues related to "inherent vowel".
			Encoding: Argument comes in as encoded UTF-8 text,
				is decoded to Unicode objects for easier identification of multi-byte characters,
				and is again re-encoded as UTF-8 before returned.
			Symmetrical IGNORE/ADD algorithm:
				When transliterating from DEV > SLP, after consonants, 
					IGNORE virAmas
					and ADD an explicit short 'a' vowel if no vowel (mAtrA) follows.
				When transliterating from SLP > DEV, after consonants, 
					IGNORE explicit short 'a' vowels
					and ADD a virAma if no vowel follows.
					(Also replace other vowels following consonants with their mAtrA forms).
			Returns results by updating object's internal .contents attribute
				which then contain a temporary, unnatural mix of Devanagari and Roman.
		"""

		if (from_scheme, to_scheme) == ('DEV', 'SLP'):
			char_to_ignore = tables.virAma_unicode; char_to_add = 'a'
		elif (from_scheme, to_scheme) == ('SLP', 'DEV'):
			char_to_add = tables.virAma_unicode; char_to_ignore = 'a'
		else: return

		text_unicode = self.contents.decode('utf-8') # from UTF-8-encoded hex strings > Unicode objects

		# buffers
		prev_char = ''
		hybrid_text_unicode_all_lines = [] # builds "temporary, unnatural mix"

		# have your newlines and eat them too
		text_unicode = text_unicode.replace('\n', '\n\r')
		text_unicode = text_unicode.replace('\r\r', '\r') # in case of Windows CRLF
		text_unicode_lines = text_unicode.split('\r')

		total_length = len(text_unicode_lines)

		for i, line in enumerate(text_unicode_lines):

#			# if desired, replace following with tqdm
# 			if total_length > 10000:
# 				# for large jobs, visually display progress at this, the slowest point
# 				progress = (i*1.0/total_length)*10000//1/100
# 				sys.stdout.write("\rprogress: %d%%" % progress)
# 				sys.stdout.flush()

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


	def map_replace(self, from_scheme, to_scheme):
		"""
			Internal method.		
			Performs global replacement according to simple mapping.
			Returns results by updating object's internal .contents attribute.
		"""
		map = tables.maps_by_name[from_scheme + '_' + to_scheme]
		for (char_in, char_out) in map:
			self.contents = self.contents.replace(char_in, char_out)

	def destroy_spaces(self):
		"""
			Internal method.		
			Performs global replacement according to simple mapping.
			Returns results by updating object's internal .contents attribute.
		"""
		for pattern in tables.which_spaces_destroyed:
			self.contents = re.sub(pattern, r'\1\2', self.contents)

	def transliterate(self, cntnts, from_scheme=None, to_scheme=None, destroy_spaces=None):
		"""
			Settings passed in here are temporary overrides, i.e., NOT saved for future use.
			Method manages overall processing routine.
			Calls internal methods that update object's internal .contents attribute.
			Return resulting text as a string.
		"""
		self.contents = cntnts

		initial_from_scheme = self.settings.from_scheme
		final_to_scheme = self.settings.to_scheme
		yes_destroy_spaces = self.settings.destroy_spaces

		if from_scheme != None: initial_from_scheme = from_scheme
		if to_scheme != None: final_to_scheme = to_scheme
		if destroy_spaces != None: yes_destroy_spaces = destroy_spaces

# 		if from_scheme != None: initial_from_scheme = from_scheme
# 		else: initial_from_scheme = self.settings.from_scheme
# 		if to_scheme != None: final_to_scheme = to_scheme
# 		else: final_to_scheme = self.settings.to_scheme

		if initial_from_scheme == None or final_to_scheme == None:
			print "transliterate() did not find expected scheme parameters"
			exit()
		
		# transliterate first to SLP
		self.linear_preprocessing(from_scheme = initial_from_scheme, to_scheme = 'SLP')
		self.map_replace(from_scheme = initial_from_scheme, to_scheme = 'SLP')

		# destroy spaces here
		if yes_destroy_spaces == True:
			self.destroy_spaces()

		# then transliterate to final desired scheme
		self.linear_preprocessing(from_scheme = 'SLP', to_scheme = final_to_scheme)
		self.map_replace(from_scheme = 'SLP', to_scheme = final_to_scheme)

		return self.contents