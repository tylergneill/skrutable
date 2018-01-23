# Skrutable

A small library of practical, integrated tools for working with Sanskrit text.

# About

These tools are meant to promote both amateur and scholarly exploration of the Sanskrit language through easier processing of machine-readable text. In particular, I hope that the scansion tool will be both of practical use to working scholars and of pedagogical use to students.

'Skrutable', both so as to make these processes less inscrutable, and as a nod to Maharashtrian pronunciation.

Feedback welcome! And please share and share-alike: licensed under a [Creative Commons Attribution-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-sa/4.0/).

# Getting Started

Currently Python 2.7 only.

1. Clone or download repository.
2. Create file 'input.txt' with some input and place in same directory.
3. Run transliteration.py from the command line and follow directions. Look at output.txt.
4. Then try using the same as a library. For example:
~~~~
from Skrutable import transliteration as tr
T = tr.Transliterator()
text = 'रामः'
result = T.transliterate(text, from_scheme='DEV', to_scheme='IAST')
print result
~~~~
5. Settings passed to the transliterate() method will not be saved. Experiment with saving them by passing them instead to the Transliterator() constructor or by specifying the `--prompt` flag at the command line to enter them manually.
6. Now try out the scansion. Put some versified material in 'input.txt'. Run scansion.py from the command line. At the moment, if you want the meter to be identified, then you must make sure that the four pādas (verse quarters) are each on their own separate lines. If you're not sure where the pāda breaks are, use the on-screen feedback to adjust your input until the lines are symmetrical and/or the meter is recognized. Settings are passed in as above.
7. Now try using the same as a library. For example:
~~~~
from Skrutable import scansion as sc
S = sc.Scanner()
text = 'sampūrṇakumbho na karoti śabdam\nardho ghaṭo ghoṣam upaiti nūnam\nvidvān kulīno na karoti garvaṃ\njalpanti mūḍhās tu guṇair vihīnāḥ'
ScansionResult = S.scan(text)
print ScansionResult.summary()
print ScansionResult.identify()
~~~~
8. Read the code to understand more options (e.g., destroy_spaces).
9. Send feedback!

# Vocabulary

By 'transliteration' is meant the movement between one or another character scheme used to represent Sanskrit sounds, such as can also be done by hand with pencil and paper. Included in these tools are one Indian script (Devanagari) and numerous Romanizations:

* International Alphabet of Sanskrit Transliteration (IAST), paṭhāmaḥ
* Devanagari Unicode (DEV), पठामः
* Sanskrit Library Protocol 1 (SLP), paWAmaH
* Harvard-Kyoto (HK), paThAmaH
* Velthuis (VH), pa.thaama.h
* Scheme used by Oliver Hellwig ("OAST"), pa®åmaµ (incomplete)

Also still in use in the academic community but not yet supported here are:

* Indian languages Transliteration (ITRANS), paThaamaH
* Scheme used by Ronald E. Emmerick (REE), paèÃma÷
* Classical Sanskrit eXtended, (CSX), paòâmaþ

Within the code, I speak of all of these as as 'schemes'.

Separate from this is the technical 'encoding' of the text data itself on the computer. Some transliteration schemes, such as Harvard-Kyoto and SLP, by design use only very simple characters falling within the first 127 codepoints (i.e., ASCII characters), namely, the upper- and lowercase Roman letters. Other schemes, however, use other, more complex characters and thus require use of higher Unicode codepoints. For example, IAST uses combining diacritics, whereas a non-Roman script like Devanagari constitutes an entirely new set of characters. In this way, Iused the word 'encoding' here exclusively to refer to the specification (in particular, UTF-8) according to which textual data is stored and manipulated by the computer.

Finally, fonts, the most superficial level of text representation at software run-time, are ignored here.

For more information, please refer to "Transliteration of Devanagari" by D. Wujastyk and "Linguistic Issues in Encoding Sanskrit" by P. Scharf.

# Guidelines

The modules are designed primarily for importing as libraries, but they can themselves also be run at the command-line for demonstration purposes. The "\_\_main\_\_" section serves as a readable tutorial.

Mixed-language input is not yet supported, so everything in the input must be Sanskrit. It must also be either in ASCII or UTF-8 encoding. (If input is encoded in any other scheme (e.g., 'mac-roman'), you can make a manual adjustment for this in the file "demo\_io.py" with the variable "text\_file\_encoding", at least for demonstration purposes, but best is simply to re-save the input file with UTF-8 encoding.)

Note also that only basic symbols important for Classical Sanskrit are used. If you need Vedic symbols or something similar, you can add this yourself.

The last used scheme settings are remembered and loaded on subsequent runs. To override this from the command line, use the --prompt flag to get a user-friend menu. Otherwise, simply pass the proper parameters to the given constructor or method.

A handy bonus feature in transliteration.py is "destroy spaces", but it can only be activated by changing the source code. Set this to True to destroy spaces added in Romanization, i.e., those typically omitted in Devanagari in favor of ligatures. Details can be controlled in tables.py.

For more detailed info on how all the parts work, see the extensive internal documentation.