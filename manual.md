# Skrutable

A small library of practical, integrated tools for working with Sanskrit text.

# About

These tools are meant to promote both amateur and scholarly exploration of the Sanskrit language through easier processing of machine-readable text. In particular, I hope that the scansion tool will be both of practical use to working scholars and of pedagogical use to students.

'Skrutable', both so as to make these processes less inscrutable, and as a nod to Maharashtrian pronunciation.

Feedback welcome! And please share and share-alike: licensed under a [Creative Commons Attribution-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-sa/4.0/).

# Getting Started

Currently Python 2.7 only.

1. Clone or download repository.
2. Create file `input.txt` with some input and place in same directory.
3. Run `transliteration.py` from the command line and follow the instructions. The result can be found in `output.txt`.
4. Then try using it as a library. For example:
~~~~
from Skrutable import transliteration as tr
T = tr.Transliterator()
text = 'रामः'
result = T.transliterate(text, from_scheme='DEV', to_scheme='IAST')
print result
~~~~
5. Settings passed to the `transliterate()` method will not be saved. Experiment with saving by passing them instead to the `Transliterator()` constructor, or by specifying the `--prompt` flag at the command line and entering them at run-time.
6. Now try out the scansion. Put some versified material in `input.txt`. Run `scansion.py` from the command line and follow the instructions as with transliteration. (NB: At the moment, if you want the meter to be identified, then you must make sure that the four pādas, i.e., verse quarters, are each on their own separate lines. If you're not sure where the pāda breaks are, use the on-screen feedback to adjust your input until the lines are symmetrical and/or the meter is recognized.) Settings are passed in as above.
7. Now try using this one as a library too. For example:
~~~~
from Skrutable import scansion as sc
S = sc.Scanner()
text = 'sampūrṇakumbho na karoti śabdam\nardho ghaṭo ghoṣam upaiti nūnam\nvidvān kulīno na karoti garvaṃ\njalpanti mūḍhās tu guṇair vihīnāḥ'
ScansionResult = S.scan(text)
print ScansionResult.summary()
print ScansionResult.identify()
~~~~
8. Read the code to learn about further options (e.g., `destroy_spaces`). Recommended starting places are the `__main__` sections and the class definitions (e.g. `Transliterator`).

# Terminology

By 'transliteration' is meant the movement between different character schemes used to represent Sanskrit sounds, such as can also be done by hand with pencil and paper. Included in these tools are one Indian script (Devanagari) and numerous Romanizations:
* International Alphabet of Sanskrit Transliteration (IAST), paṭhāmaḥ
* Devanagari Unicode (DEV), पठामः
* Sanskrit Library Protocol 1 (SLP), paWAmaH
* Harvard-Kyoto (HK), paThAmaH
* Velthuis (VH), pa.thaama.h
* Scheme used by Oliver Hellwig ("OAST"), pa®åmaµ (incomplete)

Also still in use in the academic community but not yet supported here are:
* Indian Languages Transliteration (ITRANS), paThaamaH
* Scheme used by Ronald E. Emmerick (REE), paèÃma÷
* Classical Sanskrit eXtended, (CSX), paòâmaþ

Within the code, I speak of all of these as as 'schemes'.

Separate from this is the technical 'encoding' of the text data itself on the computer. To explain: Some transliteration schemes, such as Harvard-Kyoto and SLP, use by design only very simple characters falling within the primordial 127 code-points (i.e., ASCII characters), namely, the upper- and lowercase Roman letters, punctuation, and certain other symbols. Other schemes, however, use other, more complex characters in order to acheive a more elegant appearance and thus require use of higher Unicode code-points. For example, IAST uses combining diacritics, whereas a non-Roman script like Devanagari constitutes an entirely new set of characters. In this way, I use the word 'encoding' here exclusively to refer to the specification (in particular, UTF-8) according to which textual data is stored and processed by the computer, as opposed to the human-reader-oriented 'schemes' discussed above.

Finally, fonts, the most superficial level of text representation at software run-time, are ignored here.

For more information, please refer to ["Transliteration of Devanagari" by D. Wujastyk](http://indology.info/email/members/wujastyk/) and ["Linguistic Issues in Encoding Sanskrit" by P. Scharf](sanskritlibrary.org/Sanskrit/pub/lies_sl.pdf).

# Further Tips

Mixed-language input is not yet supported, so everything in the input must be Sanskrit. It must also be either in ASCII or UTF-8 encoding. If input is encoded in any other scheme (e.g., 'mac-roman'), you can make a manual adjustment for this in the file `demo_io.py` with the variable `text_file_encoding`, at least for demonstration purposes, but best is simply to re-save the input file with UTF-8 encoding.

Note also that only basic symbols important for Classical Sanskrit are used. If you need Vedic symbols or something similar, you can add this yourself.

A handy bonus feature in `transliteration.py` is `destroy_spaces`, but it can only be activated by changing the source code. Set this to `True` to get rid of spaces added in Romanization, i.e., those typically omitted in Devanagari in favor of ligatures. Details can be viewed and controlled in `tables.py`.

For more detailed info on how all the parts work, see internal documentation.