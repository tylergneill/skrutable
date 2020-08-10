# Skrutable

The Skrutable library is meant to make Sanskrit text processing less "inscrutible", both for interested laypeople and for serious students and scholars, especially those who know a bit of Python and are curious to peek under the hood.

# Features

* Modular subpackages for transliteration, scheme detection, scansion, and meter identification, with consistent, object-based syntax.
* A simple desktop GUI for quick overview access to main functions.
* A consolidated config file (`config.json`) for controlling important user options, including
	* scheme defaults (incl. auto-detection)
	* preserving IAST jihvāmūlīya and upadhmānīya
	* virāma and extra space avoidance for Indic schemes
	* default segmentation behavior for meter identification
* Readable code

# Example of Scansion and Meter Identification and Output

Input

~~~
सम्पूर्णकुम्भो न करोति शब्दम् अर्धो घटो घोषमुपैति नूनम् /
विद्वान्कुलीनो न करोति गर्वं जल्पन्ति मूढास्तु गुणैर्विहीनाः //
~~~

Output

~~~
gglggllglgg   [18]
gglggllglgg   [18]
gglggllglgg   [18]
gglggllglgg   [18]

  sa   mpū   rṇa    ku  mbho    na    ka    ro    ti    śa  bdam      
   g     g     l     g     g     l     l     g     l     g     g
   a  rdho   gha    ṭo   gho    ṣa    mu   pai    ti    nū   nam      
   g     g     l     g     g     l     l     g     l     g     g
  vi   dvā   nku    lī    no    na    ka    ro    ti    ga  rvaṃ      
   g     g     l     g     g     l     l     g     l     g     g
  ja   lpa   nti    mū   ḍhā   stu    gu   ṇai   rvi    hī   nāḥ      
   g     g     l     g     g     l     l     g     l     g     g

indravajrā (ttjgg)
~~~

# Getting Started

## Requirements:

1. Have Python 3 installed. (Homebrew recommended)

2. Have the wxpython and py2app libraries installed. (pip and virtualenv recommended)
* (Also needed are numpy and setuptools, but these come along with wxpython.)
* (Other imports natively pre-installed: collections, copy, json, operator, os, re)

## Installation:

* (Eventually: Installation via pip. For now...)

1. Download this repo. (Easiest: green "Download" button)

2. Put the Skrutable folder where your other Python libraries are.
* (Using virtualenv? Put it directly in the `lib/python3.x/site-packages` folder.)
* (Not? Put it where your other packages are.)
	* (Hint: command line `python -c "import sys; print(sys.path)"`)

3. Within the folder, look for and try the desktop GUI file in the dist folder.
* If the included Mac executable works for you, then you're all set and ready to use Skrutable.
* If not (e.g., you're a Windows user), and if you want to use the GUI, you may need to make a new executable for your machine. See [py2app instructions](https://py2app.readthedocs.io/en/latest/tutorial.html) for more details.

# Use Options:

1. Desktop GUI
* If the desktop GUI executable is working, you can just use that for simple individual operations.
* If not, and if you want to use the GUI, you can run the `gui.py` file to start it instead.

2. Python Library
* Import modules, instantiate their respective objects, and use those objects' primary methods.
	* Transliteration
		* `from skrutable.transliteration import Transliterator`
		* `T = Transliterator()`
		* `string_result = T.transliterate(input_string) # using defaults`
		* `another_string_result = T.transliterate(input_string, to_scheme='BENGALI')`
	* Scheme Detection
		* `from skrutable.scheme_detection import SchemeDetector`
		* `SD = SchemeDetector()`
		* `string_result = SD.detect_scheme(input_string)`
	* Scansion
		* `from skrutable.scansion import Scanner`
		* `S = Scanner()`
		* `object_result = S.scan(input_string)`
		* `print( object_result.summarize() )`
	* Meter Identification
		* `from skrutable.meter_identification import MeterIdentifier`
		* `MI = MeterIdentifier()`
		* `object_result = MI.identify_meter(input_string) # default seg_mode`
		* `print( object_result.summarize() )`
		* `another_object_result = MI.identify_meter(input_string, seg_mode='resplit_hard')`
		* `print( another_object_result.meter_label() )`

For more examples, see `demo.py`.

3. Command Line

You can also issue certain simple requests on the command line. Examples:
* Transliterating a whole file to Bengali script with `python skrutable.py --transliterate FILENAME.txt to_scheme=BENGALI`
* Identifying the meter of a verse with `python skrutable.py --identify_meter FILENAME.txt`

For more, see `skrutable.py`.

# Schemes

(Note: “Encoding” here means, e.g., UTF-8, and “script” here means a distinct character set (e.g. Roman alphabet, Devanagari alphabet/syllabary/abugida). Thus, neither "Roman" nor "Unicode" are used here to refer to the schemes between which, e.g., one can transliterate in Sanskrit computing. For more, see [here](http://indology.info/email/members/wujastyk/) and [here](http://sanskritlibrary.org/Sanskrit/pub/lies_sl.pdf).)

The schemes used in Skrutable are all referred to by simple strings, as follows (also with their full names and examples of each):

Data Source | 1\_text\_original | 2.1\_text\_metadata | 2.4\_text\_cleaned | 3\_text\_doc\_and\_word\_segmented |
------------ | ------------------- | ------------------------------- | ------------------------------ | ------------------------------------ |
[GRETIL](http://gretil.sub.uni-goettingen.de/gretil.html) | y | y | y | y |
[SARIT](http://sarit.indology.info/) | y | y | y | y |
private collections  | NO | y | NO | y |


Roman schemes
----- | -------- | -------
IAST | International Alphabet of Sanskrit Transliteration | paṭhāmaḥ |
SLP | Sanskrit Library Protocol 1 | paWAmaH |
HK | Harvard-Kyoto | paThAmaH |
VH | Velthuis | pa.thaama.h |
WX | Scheme developed at IIT Kanpur ... |
ITRANS | Indian Languages Transliteration | paThaamaH |
CSX | Classical Sanskrit eXtended | paòâmaþ |
REE | Scheme used by Ronald E. Emmerick | paèÃma÷ |
OAST (my own made-up name) | Scheme used by Oliver Hellwig in older DCS data (incomplete) | pa®åmaµ |

Indic schemes
----- | -------- | -------
DEV | Devanagari Unicode | पठामः |
BENGALI | Bengali Unicode | পঠামঃ |
GUJARATI | Gujarati Unicode | પઠામઃ |

Skrutable is general enough to accept more such simple schemes, whether Roman or Indic (e.g., Gurmukhi, maybe Dravidian or other Brāhmī-based ones like Burmese). In theory, symbols beyond those used for standard Classical Sanskrit, such as those used for representing Vedic or Prakrits, may also work, but different schemes have different virtues, and there may be limits. For example, one's primary Indic data may contain jihvāmūlīya and upadhmānīya, and IAST can be easily extended to accomodate this, but other Roman schemes may not be so easily extended. On the other hand, this project is not designed for modern languages such as Hindi, and such extensions may run into greater difficulties. Nevertheless, users are welcome to make the own attempts at extension by modifying the modules `phonemes.py` and `scheme_maps` on the pattern of the other Roman or Indic scripts, as appropriate. If you do it, let me know how it goes, or also let me know if you'd like me to try.

Note finally that schemes can be auto-detected based on input character frequencies, but results deteriorate the shorter and/or messier the input string becomes. Set options for default input/output scheme behavior in the config file.

# Whitespace and virāma

A last bonus feature in `transliteration.py` is supplied by `virAma_avoidance.py`. Setting the corresponding option in `config.py` to `True` will get rid of unsightly virāmas and spaces that tend to result when transliterating from any schemes (typically Roman ones) that use more space between words to any schemes (typically Indic ones) that typically forego such explicit spaces in deference to the traditional ligature principle (not least, e.g., because of the extra virāmas that Indic scripts require to represent word-final consonants). Note that such a transformation actually results in a loss of valuable information which can be reversed only at great expense (for large texts, many hours of skilled human labor, even if assisted by a well-trained neural network).

# Sandhi and Compound Segmentation

For automated sandhi and compound segmentation, Oliver Hellwig's and Sebastian Nehrdich's [Sanskrit Sandhi and Compound Splitter](https://github.com/OliverHellwig/sanskrit/tree/master/papers/2018emnlp) is recommended. It requires tensorflow.