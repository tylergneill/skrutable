name: skrootable

Desired use:

input_content
	get string of text from wherever
		(using io is a temporary measure)
	most likely a string managed manually by the user

settings
	from skrootable.io (or whatever) import SettingsManager
	s = SettingsManager()
		s.input_format = ''
		s.output_format = ''
		s.space_destruction = False
		s.guess_input_format() (optional)
		s.save_current()
		s.load_previous()
		s.prompt_user()

transliteration
	from skrootable.transkrit import Transliterator
	t = Transliterator()
		t.transliterate(input_content, from_format = s.input_format, to_format = s.output_format, sp_d = s.space_destruction)
			return output_string

scansion
	from skrootable.scanskrit import Scanner
	s = Scanner()
		s.scan(input_content, from_format = s.input_format, to_format = 'iast', sp_d = False)
			return output_object
				list_of_syllables
				string_of_weights
				meter_guess