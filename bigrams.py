import io

def find_ngrams(input_list, n):
	return zip(*[input_list[i:] for i in range(n)])

print "filename", io.input_filename

contents = io.load()

input_list = [contents[i] for i in range(len(contents))]
results = find_ngrams(input_list, 2)
ngram_strings = [t[0]+t[1] for t in results]

freq = {}
for n in ngram_strings:
	if n not in freq: freq[n] = 1
	elif n in freq: freq[n] += 1
print len(freq)

# do this for a number of texts in various formats

io.input_filename = "another.txt"

print "filename", io.input_filename

contents = io.load()

input_list = [contents[i] for i in range(len(contents))]
results = find_ngrams(input_list, 2)
ngram_strings = [t[0]+t[1] for t in results]

freq = {}
for n in ngram_strings:
	if n not in freq: freq[n] = 1
	elif n in freq: freq[n] += 1
print repr(freq)