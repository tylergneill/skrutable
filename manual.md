# Skrutable

The Skrutable library is meant to make Sanskrit text processing less "inscrutible", both for interested laypeople and for serious students and scholars, especially those who know a bit of Python and are curious to peek under the hood.

# Features

* Four main functionalities
	* scheme detection (robust and vector-based)
	* transliteration (extensible)
	* scansion (with aligned, monospace output)
	* meter identification (with resplitting options)

* Modular Python subpackages, with consistent, object-based syntax, written in readable code.

* A simple desktop GUI for quick and easy access to main functionalities.

![screenshot](img/gui_dark.png)

* A consolidated config file (`config.json`) for controlling important user options, including
	* default scheme choices (incl. auto-detection)
	* virāma avoidance (esp. for transliteration to Indic schemes)
	* default resplit option for meter identification

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
	* If the included Mac desktop GUI executable works for you, then you're all set and can start using all of Skrutable.
	* If not (e.g., you're a Windows user), and if you want to use the GUI by e.g. double-clicking on an icon, then for now, you'll need to make your own executable for your machine. See [here](https://py2app.readthedocs.io/en/latest/tutorial.html) for instructions on how to use py2app to do so.

# Use Options:

1. Desktop GUI
	* If your desktop GUI executable is working, you can just use that for simple individual operations.
	* If not, and if you want to use the GUI, your other option is to run the `gui.py` file at the command line, e.g., by navigating to the file and running `python gui.py`. The result is exactly the same, or even more flexible if you want to change the code yourself.

2. Python Library

Import modules, instantiate their respective objects, and use those objects' primary methods.

* Scheme Detection
	* `from skrutable.scheme_detection import SchemeDetector`
	* `SD = SchemeDetector()`
	* `string_result = SD.detect_scheme(input_string)`
* Transliteration
	* `from skrutable.transliteration import Transliterator`
	* `T = Transliterator()`
	* `string_result = T.transliterate(input_string) # using defaults`
	* `another_string_result = T.transliterate(input_string, to_scheme='BENGALI')`
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
	* Transliterating a file to Bengali script: `python skrutable.py --transliterate FILENAME.txt to_scheme=BENGALI`
	* Identifying the meter of a verse: `python skrutable.py --identify_meter FILENAME.txt`

For more, see `skrutable.py`.

# Schemes

(Note: “Encoding” here means basically UTF-8, and “script” means a distinct character set (e.g. Roman alphabet, Devanagari alphabet/syllabary/abugida). Thus, neither "Roman" nor "Unicode" are used here to refer to the “schemes” between which, e.g., one can transliterate in Sanskrit computing. For more on such terminology, see [here](http://indology.info/email/members/wujastyk/) and [here](http://sanskritlibrary.org/Sanskrit/pub/lies_sl.pdf).)

The schemes used in Skrutable are all referred internally to by simple strings, namely, the abbreviations in the following table:

<table>
    <thead>
        <tr>
            <th>Scheme Type</th>
            <th>Scheme Abbreviation</th>
            <th>Scheme Full Name</th>
            <th>Example</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td rowspan=8>Roman</td>
            <td>IAST</td>
            <td>International Alphabet of Sanskrit Transliteration</td>
            <td>paṭhāmaḥ</td>
        </tr>
        <tr>
            <td>SLP</td>
            <td>Sanskrit Library Protocol 1</td>
            <td>paWAmaH</td>
        </tr>
        <tr>
            <td>HK</td>
            <td>Harvard-Kyoto</td>
            <td>paThAmaH</td>
        </tr>
        <tr>
            <td>VH</td>
            <td>Velthuis</td>
            <td>pa.thaama.h</td>
        </tr>
        <tr>
            <td>WX</td>
            <td>Scheme developed at IIT Kanpur</td>
            <td>...</td>
        </tr>
        <tr>
            <td>ITRANS</td>
            <td>Indian Languages Transliteration</td>
            <td>paThaamaH</td>
        </tr>
        <tr>
            <td>CSX</td>
            <td>Classical Sanskrit eXtended</td>
            <td>paòâmaþ</td>
        </tr>
        <tr>
            <td>REE</td>
            <td>Scheme used by Ronald E. Emmerick</td>
            <td>paèÃma÷</td>
        </tr>
        <tr>
            <td rowspan=3>Indic</td>
            <td>DEV</td>
            <td>Devanagari Unicode</td>
            <td>पठामः</td>
        </tr>
        <tr>
            <td>BENGALI</td>
            <td>Bengali Unicode</td>
            <td>পঠামঃ</td>
        </tr>
        <tr>
            <td>GUJARATI</td>
            <td>Gujarati Unicode</td>
            <td>પઠામઃ</td>
        </tr>
    </tbody>
</table>

Skrutable can be extended to include more such simple Roman or Brāhmi-based schemes for Classical Sanskrit and perhaps even related classical languages like Vedic or Prakrits (specifically, by modifying the modules `phonemes.py` and `scheme_maps.py`). On the other hand, it is not designed for modern languages with phonologies that differ significantly from Sanskrit (such as Hindi, Tamil, and so on). For such languages, 

Note also that scheme auto-detection can be useful whenever manually specifying the input scheme might be inconvenient, but it should be used with caution, as it works based on input character frequencies, and so results will deteriorate the shorter and/or messier the input string becomes.

# Virāma (and Whitespace) Avoidance

Sometimes, usually for aesthetic purposes (i.e., only rarely for scientific ones), it is best to suppress extra virāmas and spaces between words, such as where Indic scripts would instead feature ligatures. In these cases, Skrutable's transliteration includes a simple but handy virāma avoidance feature, based on straightforward regular expressions and string replacements, which eliminates spaces (and with them virāmas) between certain specified combinations of characters. This can be controlled in `config.py` and `virAma_avoidance.py`.

# Sandhi and Compound Segmentation

For automated sandhi and compound segmentation, Oliver Hellwig's and Sebastian Nehrdich's pre-trained neural-network tool, [Sanskrit Sandhi and Compound Splitter](https://github.com/OliverHellwig/sanskrit/tree/master/papers/2018emnlp), produces good results and is recommended. It requires tensorflow.

# Related Sanskrit Transliteration and Scansion Projects

Numerous other projects exist which some users may find preferable to Skrutable in certain respects (e.g., available script support, installability, availability online). Here are my recommended highlights.

Scheme Detection | Transliteration | Scansion & Meter Identification | Main Author
-------- | ---------- | --------- | --------
([detect.py](https://github.com/sanskrit/detect.py)) | **[Sanscript](http://learnsanskrit.org/tools/sanscript)** (also via PyPi [here](https://github.com/sanskrit-coders/indic_transliteration)]) | (n/a) | Arun Prasad
(n/a) | **[Aksharamukha](http://aksharamukha.appspot.com/converter)** | (n/a) | Vinodh Rajan
([detect.py](https://github.com/shreevatsa/sanskrit/blob/master/transliteration/detect.py)) | ([transliteration](https://github.com/shreevatsa/sanskrit/tree/master/transliteration)) | [Metre identifier](http://sanskritmetres.appspot.com/) | Shreevatsa R.
(n/a) | (n/a) | **[Meter Identifying Tool](http://sanskritlibrary.org:8080/MeterIdentification/)** | Keshav Melnad
(n/a) | **[Transliteration Tool](https://www.ashtangayoga.info/philosophy/sanskrit-and-devanagari/transliteration-tool/)** | (n/a) | AshtangaYoga.info
(n/a) | [Sanscription](http://www.tyfen.com/sanscription/) | (n/a) | Marc Tiefenauer

# Feedback

Find me online (Tyler G. Neill) and get in touch by email with questions, comments, or suggestions.