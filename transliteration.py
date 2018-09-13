"""
	Transliterates Sanskrit text.
	Supports the following Sanskrit transliteration schemes:
		ASCII: SLP, HK, VH, "OAST" (Oliver's, for DCS);
		Unicode: IAST, DEV(anagari).
	Manages schemes with "tables" module.
	Uses SLP under-the-hood.
	Handles issue of Devanagari 'inherent vowel' with linear pre-processing (slow).
"""

import os.path
import sys
import pickle
import re
import tables
import demo_io

settings_filename = 'last_used.p'
# make sure settings file will be co-located with modules
abs_dir = os.path.split(os.path.abspath(__file__))[0] # absolute dir of transliteration.py
settings_file_path = os.path.join(abs_dir, settings_filename) # same absolute dir

destroy_spaces = False

class TransliterationSettings(object):

	def __init__(self, default_initial=None, default_final=None):

		self.initial_scheme = self.final_scheme = None

		# load whatever previous settings available from file
		if	(
			(default_initial == None or default_final == None) and
			os.path.isfile(settings_file_path)
			):
			self.load()

		# but then also override with any newly specified choices
		if default_initial != None: self.initial_scheme = default_initial
		if default_final != None: self.final_scheme = default_final

		self.save()


	def load(self):

		settings_file = open(settings_file_path, 'r')
		temp_S = pickle.load(settings_file) # TransliterationSettings() object

		self.initial_scheme = temp_S.initial_scheme
		self.final_scheme = temp_S.final_scheme

		settings_file.close()


	def save(self):

		settings_file = open(settings_file_path, 'w')
		P = pickle.Pickler(settings_file)
		P.dump(self)
		settings_file.close()


class Transliterator():

	def __init__(self, default_from=None, default_to=None):

		self.contents = None
		self.settings = TransliterationSettings(default_from, default_to)

	def linear_preprocessing(self, from_scheme, to_scheme):
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
					(Also replace other vowels following consonants with their mAtrA forms).
			Returns results by updating object's internal .contents attribute
				which here will contain a temporary, unnatural mix of Devanagari and Roman.
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

			if total_length > 10000:
				# visually display progress at this, the slowest point
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

	def transliterate(self, cntnts, from_scheme=None, to_scheme=None):
		"""
			Primary method to be called on Transliteration object, needs no arguments.
			Purpose: routes processing via SLP, leaves open option of destroying spaces.
			Calls other methods that update object's internal .contents attribute.
			Return resulting text as a string.
		"""
		self.contents = cntnts

		if from_scheme != None: init_f = from_scheme
		else: init_f = self.settings.initial_scheme
		if to_scheme != None: fin_f = to_scheme
		else: fin_f = self.settings.final_scheme
		
		# transliterate first to SLP
		self.linear_preprocessing(from_scheme = init_f, to_scheme = 'SLP')
		self.map_replace(from_scheme = init_f, to_scheme = 'SLP')

		# destroy spaces here
		if destroy_spaces:
			self.destroy_spaces()

		# then transliterate to final desired scheme
		self.linear_preprocessing(from_scheme = 'SLP', to_scheme = fin_f)
		self.map_replace(from_scheme = 'SLP', to_scheme = fin_f)

		return self.contents