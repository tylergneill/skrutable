# !usr/bin/env python
# -*- coding: utf-8 -*-

def starting_quarter_split_points(quarter_length):
	return [ i * quarter_length for i in [1, 2, 3] ]

def wiggle_iterator(start_pos, quarter_length):
	iter_list = [start_pos]
	for i in range(1, quarter_length/2+1):
		iter_list.append(start_pos+i)
		iter_list.append(start_pos-i)
	return iter_list

from skrutable.scansion import *
from skrutable import transliteration as trnsl
import time

def split_and_identify(str, output_scheme='IAST'):

	T = trnsl.Transliterator()

	S1 = Scanner('IAST','IAST')
	Result = S1.scan(str.replace('\n',''))
	syllables = Result.syllabified_text.split(' ')

	total_syllable_count = len(syllables)

	quarter_length = total_syllable_count / 4

	ab_split_point, bc_split_point, cd_split_point = starting_quarter_split_points(quarter_length)

	ab_wiggle_iterator = wiggle_iterator(ab_split_point, quarter_length)
	bc_wiggle_iterator = wiggle_iterator(bc_split_point, quarter_length)
	cd_wiggle_iterator = wiggle_iterator(cd_split_point, quarter_length)

	S2 = Scanner('SLP','SLP')


	for pos_ab in ab_wiggle_iterator:
		for pos_bc in bc_wiggle_iterator:
			out_buffer = ''
			for pos_cd in cd_wiggle_iterator:
				curr_str = ''.join(syllables[:pos_ab]) + '\n' + ''.join(syllables[pos_ab:pos_bc]) + '\n' + ''.join(syllables[pos_bc:pos_cd]) + '\n' + ''.join(syllables[pos_cd:])
				out_buffer += T.transliterate(
					curr_str, from_scheme='SLP', to_scheme=output_scheme) + '\n\n'
				Result = S2.scan(curr_str)
				if Result.identify() != None:
# 					out_buffer += '\n\n' + Result.summary() + '\n\n'
					id = Result.identify()
					out_buffer += id
					print out_buffer
					return out_buffer
# 					time.sleep(1)
# 					if id[:12] != "unclassified":
# 						quit_yn = raw_input('\nFound? (y/n): ')
# 						if quit_yn == 'y': return
#
# 				else: time.sleep(0.005)

# verses_to_test = [
# "dhīraṃ vāridharasya vāri kirataḥ śrutvā niśīthe dhvaniṃ dīrghocchvāsamudaśruṇā virahiṇīṃ bālāṃ ciraṃ dhyāyatā | adhvanyena vimuktakaṇṭhamakhilāṃ rātriṃ tathā kranditaṃ grāmīṇairvrajato janasya vasatirgrāme niṣiddhā yathā ||"
# ]
#
# for str in verses_to_test:
# 	split_and_identify(str)
