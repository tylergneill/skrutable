import io

unbalanced_contents = io.load()

unbalanced_contents_one_line = unbalanced_contents.replace('\n','')
overall_length = len(unbalanced_contents_one_line)
quarter_length = overall_length / 4

# need not length of string but rather sequence of syllables by weight

# general offset range idea = quarter_length +/- ...