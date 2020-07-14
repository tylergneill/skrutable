iast_phonemes = [
# vowels 1 (complex)
'ai','au','e','o','ā','ī','ū','ṛ','ṝ','ḷ','ḹ',
# vowels 2 (simple)
'a','i','u',
# anusvāra and visarga (incl. jihvāmūlīya and upadhmānīya)
'ṃ','ḥ','ẖ','ḫ',
# aspirates
'kh','gh','ch','jh','ṭh','ḍh','th','dh','ph','bh',
# unaspirated stops
'k','g','c','j','ṭ','ḍ','t','d','p','b',
# nasals
'ṅ','ñ','ṇ','n','m',
# semivowels
'y','r','l','v',
# sibliants and h
'ś','ṣ','s','h',
]

slp1_phonemes = [
# vowels 1 (complex)
'E','O','e','o','A','I','U','f','F','x','X',
# vowels 2 (simple)
'a','i','u',
# anusvāra and visarga
'M','H',
# aspirates
'K','G','C','J','W','Q','T','D','P','B',
# unaspirated stops
'k','g','c','j','w','q','t','d','p','b',
# nasals
'N','Y','R','n','m',
# semivowels
'y','r','l','v',
# sibliants and h
'S','z','s','h',
]

all_phoneme_lists_by_string = {
'iast_phonemes': iast_phonemes, 
'slp1_phonemes': slp1_phonemes,
}

test1 = "rāmaḥ vanam gacchati gacchati gacchati"

def identify_scheme(text_input):

	scores = {scheme_name : 0 for scheme_name in all_phoneme_lists_by_string.keys()}
	
	for curr_scheme in all_phoneme_lists_by_string.keys():
		
		temp_text_input = text_input
		
		for phoneme in all_phoneme_lists_by_string[curr_scheme]:
		
			if temp_text_input.count(phoneme) > 0:
				print("found ", temp_text_input.count(phoneme), " instances of ", phoneme, " in ", curr_scheme)
				print("remaining in test string: ", temp_text_input.replace(phoneme,''))
			scores[curr_scheme] += temp_text_input.count(phoneme)
			temp_text_input = temp_text_input.replace(phoneme,'')
		
		print(curr_scheme, " score: ", scores[curr_scheme])
		print("remaining stuff: ", temp_text_input)
	