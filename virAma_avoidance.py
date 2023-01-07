# set up regex components
from skrutable import phonemes

vowels = ''.join(phonemes.SLP_vowels)
unvoiced_consonants = ''.join(phonemes.SLP_unvoiced_consonants)
unvoiced_consonants_subset = ['k','K','t','T','p','P','s']
voiced_consonants = ''.join(phonemes.SLP_voiced_consonants)

"""The following regexes aim at avoiding virāma and space,
especially in Indic scripts.

All are replaced by '\1\2', thereby simply removing the space.

This list is by no means fixed or exhaustive and is meant to be customized.
"""

replacements = [
# these spaces generally disliked among modern scholars, never (?) seen in mss
'(y) ([%s])' % vowels,
'(v) ([%s])' % vowels,
'(r) ([%s])' % vowels,
'(r) ([%s])' % voiced_consonants,
# these spaces may be used for clarity among modern scholars, rare in mss
'([kwp]) ([%s])' % unvoiced_consonants,
'(c) (c)',
'([gqb]) ([%s])' % voiced_consonants,
'(j) (j)',
'(Y) ([cCjJ])',
'(d) ([%s])' % voiced_consonants,
'(l) (l)',
'(S) ([cCS])',
'(s) ([tTs])',
# these spaces are more common and very much depend on the scribe or editor
'([gqb]) ([%s])' % vowels,
'(d) ([%s])' % vowels,
'(t) ([%s])' % unvoiced_consonants_subset, # because e.g. t + ś >> c ch
'(n) ([%s])' % vowels,
'(n) ([%s])' % voiced_consonants,
'(m) ([%s])' % vowels,
]

# the following is just space for notes to cut-and-paste above or vice versa
replacements_more = [
# this space is sometimes removed by some modern scholars
"([Aeo]) (')",
]
