import transkrit, tables
import io
import sys, os

"""
	ALPHASKRIT  (< 'alphabetize Sanskrit')
	
	Alphabetizes newline-separated lists in any transliteration format
		according to Devanagari alphabetical order
		by transliterating to and from Devanagari
		and by taking advantage of Python's in-built sort() function
		which sorts everything (including Devanagari) according to Unicode values.
	Requries use of TRANSKRIT.Transliterable object.
	NOTE: Doesn't yet handle leading F (long vocalic r) or x/X (vocalic l's) correctly,
		since Unicode ordering of these characters is itself incorrect.
"""

def sort_skrit(list_to_sort):
	"""
		Requires TRANSKRIT.Transliteratable object as argument,
			with list to be alphabetized as its 'text' attribute.
		Returns simple text of alphabetized list.
	"""	

# 
# 	# remember final format
# 	final_format = transliteratable_text.to_format
# 
# 	# transliterate to devanAgarI if necessary
# 	if transliteratable_text.from_format != 'DEV':
# 		transliteratable_text.to_format = 'DEV'
# 		transliteratable_text.transliterate()
# 
# 	devanAgarI_text = transliteratable_text.text
# 
# 	# alphabetize devanAgarI according to Unicode values
# 	list_rows = devanAgarI_text.split('\n')
# 	list_rows.sort()
# 	sorted_devanAgarI_text = '\n'.join(list_rows)
# 
# 	# store sorted DEV result
# 	transliteratable_text.text = sorted_devanAgarI_text
# 	transliteratable_text.from_format = 'DEV'
# 
# 	# transliterate result back to original target format
# 	transliteratable_text.to_format = final_format
# 	transliterated_text = transliteratable_text.transliterate()
# 
# 	return transliterated_text

	T = transkrit.Transliterator()
	list_in_DEV = T.transliterate(list_to_sort, 'IAST', 'DEV')

 	list_rows = list_in_DEV.split('\n')
 	list_rows.sort()
 	sorted_list_in_DEV = '\n'.join(list_rows)
	sorted_list_in_IAST = T.transliterate(sorted_list_in_DEV, 'DEV', 'IAST')
	return sorted_list_in_IAST

if __name__ == '__main__':
	"""
		Furnishes basic user experience when ALPHASKRIT run from command line.
	"""

# 	io.clear_screen()
	
# 	doc = io.activate_document()
# 	print "Input text:", '\n', doc, '\n'
# 
# 	from_format, to_format, should_destroy_spaces, which_spaces_destroyed = io.activate_settings()
# 
# 	text = TRANSKRIT.Transliteratable(doc, from_format, to_format, should_destroy_spaces, which_spaces_destroyed)
# 
# 	print "Transliterating %s > %s..." % (text.from_format, text.to_format), '\n'
# 	print "Destroy spaces: %s" % text.should_destroy_spaces, '\n'
# 
# 	transliterated_text = text.transliterate()
# 
# 	print "Alphabetizing...", '\n'
# 	alphabetized_text = alphaskritize(text)
# 
# 	io.save_results(alphabetized_text)
# 	print "Output text:", '\n', alphabetized_text, '\n'

	io.clear_screen()
	contents = io.load()

	sorted = sort_skrit(contents)

	io.save(sorted)