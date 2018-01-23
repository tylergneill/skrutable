# SkritHub:

a small library of practical, integrated tools for working with Sanskrit text.


# About:

These tools are meant to promote both amateur and scholarly exploration of the Sanskrit language through easier processing of machine-readable text. They are designed to be easy both to use and understand. Hopefully a substantively new contribution is the transparent presentation of how mechanical scansion is, in order to enable students to also do it by hand.

Written in and for use with Python 2.7.

Feedback welcome! And please share and share-alike:

This work is licensed under a <a rel="license" href="https://creativecommons.org/licenses/by-sa/4.0/">Creative Commons Attribution-ShareAlike 4.0 International License</a>.

# Vocabulary:

By 'transliteration' is meant the movement between one or another character scheme used to represent Sanskrit sounds, such as can also be done by hand with pencil and paper. Included in these tools are one Indian script (Devanagari) and numerous Romanizations:

International Alphabet of Sanskrit Transliteration (IAST), paṭhāmaḥ
Devanagari Unicode (DEV), पठामः
Sanskrit Library Protocol 1 (SLP), paWAmaH
Harvard-Kyoto (HK), paThAmaH
Velthuis (VH), pa.thaama.h
Scheme used by Oliver Hellwig ("OAST"), p____

Also still in use in the academic community but not yet supported here are:

Indian languages Transliteration (ITRANS), paThaamaH
Scheme used by Ronald E. Emmerick (REE), paèÃma÷
Classical Sanskrit eXtended, (CSX), paòâmaþ

Within my code, I speak of all of these as as 'schemes'.

Separate from this is the technical 'encoding' of the text data itself on the computer. Some transliteration schemes, such as Harvard-Kyoto and SLP, by design use only very simple characters falling within the first 127 codepoints (i.e., ASCII characters), namely, the upper- and lowercase Roman letters. Other schemes, however, use other, more complex characters and thus require use of higher Unicode codepoints. For example, IAST uses combining diacritics, whereas a non-Roman script like Devanagari constitutes an entirely new set of characters. In this way, Iused the word 'encoding' here exclusively to refer to the specification (in particular, UTF-8) according to which textual data is stored and manipulated by the computer.

Finally, fonts, the most superficial level of text representation at software run-time, are ignored here.

For more information, please refer to "Transliteration of Devanagari" by D. Wujastyk and "Linguistic Issues in Encoding Sanskrit" by P. Scharf.

# Guidelines:

The modules are designed primarily for importing as libraries, but they can themselves also be run at the command-line for demonstration purposes. The "__main__" section serves as a readable tutorial.

Mixed-language input is not yet supported, so everything in the input must be Sanskrit. It must also be either in ASCII or UTF-8 encoding. (If input is encoded in any other scheme (e.g., 'mac-roman'), you can make a manual adjustment for this in the file demo_io.py with the variable "text_file_encoding", at least for demonstration purposes, but best is simply to re-save the input file with UTF-8 encoding.)

Note also that only basic symbols important for Classical Sanskrit are used. If you need Vedic symbols or something similar, you can add this yourself.

The last used scheme settings are remembered and loaded on subsequent runs. To override this from the command line, use the --prompt flag to get a user-friend menu. Otherwise, simply pass the proper parameters to the given constructor or method.

For more detailed info on how all the parts work, see the extensive internal documentation.