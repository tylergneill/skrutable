# about

For whys and where-tos, see [skrutable.pythonanywhere.com/about](http://skrutable.pythonanywhere.com/about)


# how to use

The online web app at [skrutable.pythonanywhere.com](http://skrutable.pythonanywhere.com)
provides easy access to both casual one-off and also whole-file processing.

![screenshot](img/web_app.png)

See [skrutable.pythonanywhere.com/tutorial](http://skrutable.pythonanywhere.com/tutorial) for more instructions.

If you need to, you can also download and use the Python code, either as a library, as a local web app, or as a command-line script. See [below](#using-the-code) for more.


# transliteration schemes

Sanskrit can be written in many ways. The schemes featured in `skrutable` are:

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
            <td rowspan=6>Roman</td>
            <td>IAST</td>
            <td>International Alphabet of Sanskrit Transliteration</td>
            <td>saṃskṛtaṃ paṭhāmaḥ</td>
        </tr>
        <tr>
            <td>HK</td>
            <td>Harvard-Kyoto</td>
            <td>saMskRtaM paThAmaH</td>
        </tr>
        <tr>
            <td>SLP</td>
            <td>Sanskrit Library Protocol 1</td>
            <td>saMskftaM paWAmaH</td>
        </tr>
        <tr>
            <td>ITRANS</td>
            <td>Indian Languages Transliteration</td>
            <td>sa.mskRita.m paThaama.h</td>
        </tr>
        <tr>
            <td>VH</td>
            <td>Velthuis</td>
            <td>sa.msk.rta.m pa.Taama.h</td>
        </tr>
        <tr>
            <td>WX</td>
            <td>Scheme developed at IIT Kanpur</td>
            <td>saMskqwaM paTAmaH</td>
        </tr>
        <tr>
            <td rowspan=3>Indic</td>
            <td>DEV</td>
            <td>Devanagari Unicode</td>
            <td>संस्कृतं पठामः</td>
        </tr>
        <tr>
            <td>BENGALI</td>
            <td>Bengali Unicode</td>
            <td>সংস্কৃতং পঠামঃ</td>
        </tr>
        <tr>
            <td>GUJARATI</td>
            <td>Gujarati Unicode</td>
            <td>સંસ્કૃતં પઠામઃ</td>
        </tr>
    </tbody>
</table>

There is also a very lossy “IASTreduced” (e.g., “samskrtam pathamah”) output option which I find sometimes comes in handy. Additional academic schemes not currently featured include CSX (Classical Sanskrit eXtended, e.g. “saüskçtaü paòâmaþ”), REE (by Ronald E. Emmerick, e.g. “saæsk­taæ paèÃma÷”), and the scheme internal to the [DCS](http://www.sanskrit-linguistics.org/dcs/index.php) (by Oliver Hellwig, e.g. “saºskŸtaº paÅåmaµ”). 

More schemes for writing Sanskrit, especially those corresponding to additional Indic scripts, can easily be added to `skrutable` by modifying the code in `phonemes.py` and `scheme_maps.py`. I'm happy to help with this. Alternatively, for other tools more focused on wider character support, including for other South Asian languages, see [related projects](#related-projects) below.

Note that I use “encoding” here in the sense of UTF-8 (most often as in over and above ASCII) and “script” in the sense of a distinct character set like either the Roman or Devanagari alphabets (latter actually an abugida), and so I don't use either “Roman” or “Unicode” to refer to any of the individual schemes. For more thoughts on such terminology, see [here](http://indology.info/email/members/wujastyk/) and [here](http://sanskritlibrary.org/Sanskrit/pub/lies_sl.pdf).


# scansion and meter identification

For the concepts and traditional conventions in Sanskrit prosody which this part of `skrutable` is based on, see above all the appendix of V.S. Apte's *Practical Sanskrit-English dictionary*, 1890, pp. 1179ff. ([on Archive](https://archive.org/details/ldpd_7285627_000/page/n1195/mode/2up))

The most important terms in short:
* laghu (l) / guru (g): metrically light / heavy syllable
* mora: value of 1 for each light syllable and 2 for each heavy syllable
* gaṇa: [traditional abbreviation](https://en.wikipedia.org/wiki/Sanskrit_prosody#Ga%E1%B9%87a) — ya ma ta ra ja bha na sa la ga — for each [trisyllable group](https://en.wikipedia.org/wiki/Foot_(prosody))
* anuṣṭubh (also śloka): a verse type consisting of 8 syllables (or *akṣaras*) per quarter (or *pāda*) in a partly constrained, partly fluid laghu-guru pattern
* samavṛtta: a verse type containing four quarters with the same number of syllables in each and generally a rigid pattern of laghus and gurus
* jāti: a verse type containing four quarters with set patterns of total moraic length


# related projects

There are numerous related projects which users may find preferable to `skrutable` in certain respects (e.g., more script support, easier to install (e.g. with `pip`), different opinions on edge cases, etc.) Here are my recommended highlights.

Scheme Detection | Transliteration | Scansion & Meter Identification | Main Author
-------- | ---------- | --------- | --------
([“detect.py” module](https://github.com/sanskrit/detect.py)) | **[Sanscript](http://learnsanskrit.org/tools/sanscript)** (also via PyPi [here](https://github.com/sanskrit-coders/indic_transliteration)) | (n/a) | Arun Prasad
(n/a) | **[Aksharamukha](http://aksharamukha.appspot.com/converter)** | (n/a) | Vinodh Rajan
([“detect.py” module](https://github.com/shreevatsa/sanskrit/blob/master/transliteration/detect.py)) | ([“transliteration” subpackage](https://github.com/shreevatsa/sanskrit/tree/master/transliteration)) | **[Metre Identifier](http://sanskritmetres.appspot.com/)** | Shreevatsa R.
(n/a) | (n/a) | **[Meter Identifying Tool](http://sanskritlibrary.org:8080/MeterIdentification/)** | Keshav Melnad
(n/a) | **[Transliteration Tool](https://www.ashtangayoga.info/philosophy/sanskrit-and-devanagari/transliteration-tool/)** | (n/a) | AshtangaYoga.info
(n/a) | **[Sanscription](http://www.tyfen.com/sanscription/)** | (n/a) | Marc Tiefenauer



# encoding normalization

Some schemes have internal options. For example, at the level of encoding, IAST is sometimes represented in UTF-8 with combining diacritics, sometimes with precomposed combinations. Alternatively, at the level of the scheme itself, ITRANS writes vocalic r (ṛ, ऋ) as 'Ri', 'RRi', or 'R^i. Because `skrutable` transliterates by way of SLP, and because it must output a single option, you can use round-trip transliteration (e.g., IAST-IAST) to normalize such variation. For example:

~~~
"rāmaḥ" == 'r' + 'a' + '¯' (U+0304) + 'm' + 'a' + 'h' + '.' (U+0323)
>>
"rāmaḥ" == 'r' + 'ā' (U+0101) + 'm' + 'a' + 'ḥ' (U+1E25)
~~~

That is, `skrutable` currently favors precomposed characters for IAST. In the code, these and other scheme-internal defaults can be inspected and changed in `scheme_maps.py`.


# virāma avoidance

For the purpose of printing Indic scripts, it's often aesthetically (if not always scientifically) preferable to remove certain inter-word spaces and their corresponding virāmas, and to instead use ligatures. For example:

~~~
asty eva >> ( अस्त्य् एव ) >> अस्त्येव
~~~

This is the default behavior for transliterating to Indic scripts in `skrutable`. In the code, the regular expressions governing this can be found in `virAma_avoidance.py`, and the overall setting can be toggled in `config.py`.


# sandhi and compound splitting

For splitting Sanskrit text into its individual words, both breaking compounds and dissolving sandhi, the powerful neural-network tool of Hellwig and Nehrdich, [Sanskrit Sandhi and Compound Splitter](https://github.com/OliverHellwig/sanskrit/tree/master/papers/2018emnlp), has been producing good and usable results since its 2018 release, even without re-training the model (examples: [here](https://github.com/tylergneill/pramana-nlp/tree/master/3_text_doc_and_word_segmented) and [here](https://github.com/sebastian-nehrdich/gretil-quotations)), but it has not been accessible for most users (being command-line only and requiring setup of `Python 3.5` and `TensorFlow 1.x`). Now, however, `skrutable` provides a wrapper, accessible through its online interface, for easily applying the pre-trained model while also preserving original sentence length and punctuation.


# using the code


## installation for offline use

1. Have Python 3 installed. (`Homebrew` recommended)

2. Install `skrutable` as follows:

* (Eventually: Installation via `pip`. For now...)

* Click the green “Code” button on [repo main page](https://github.com/tylergneill/skrutable) or just click [here](https://github.com/tylergneill/skrutable/archive/master.zip) to download the repo.

* Put the `skrutable` folder where your other Python libraries are.
	* Using `virtualenv`? You can put it directly in the relevant `lib/python3.x/site-packages` folder.
	* Not? Then you can put it where your other packages normally install to (e.g. with `pip`).
		* (Hint: command line `python -c "import sys; print(sys.path)"` to see where.)

* Get the other necessary Python libraries (`pip` recommended):
	* (for scheme-detection *currently under repair*) `numpy`
	* (should already be natively pre-installed: `collections`, `copy`, `json`, `operator`, `os`, `re`)
	* (for front-end) `flask`
	* (for splitter.wrapper) `Python 3.5` (`penv` recommended) and `tensorflow 1.x`


## using as local web app

For doing more data-heavy processing that is still user-friendly, you may wish to run the front-end web app locally on your own machine. If so, you'll also need to download the [separate front-end repo](https://github.com/tylergneill/skrutable_front_end). This package relies on importing `skrutable` as a library (see hint on `sys.path` above). With both of these in place (and don't forget to also `pip install flask`), go to the folder with the front-end Flask app and run the commands in `launch.sh`. You can then access `skrutable` in your browser at `http://127.0.0.1:5000`.

See [here](https://flask.palletsprojects.com/en/1.1.x/quickstart/) for more instructions on Flask, or [ask me](#feedback).


## using as library

From each respective module (`transliteration.py`, `scansion.py`, `meter_identification.py`, `splitter.wrapper.py`), import the respective object constructor (`Transliterator`, `Scanner`, `MeterIdentifier`, `Splitter`), instantiate the object, and call its primary methods (`transliterate()`, `scan()`, `identify_meter()`, `split()`). Transliteration and sandhi/compound splitting returns a string, whereas scansion and meter identification return `Scansion.Verse` objects, which contain (among other things) a `meter_label` attribute and a `summarize()` method.

The following are the important function parameters:

* transliteration: `from_scheme` and `to_scheme` (`IAST`, `HK`, `SLP`, `ITRANS`, `VH`, `WX`, `IASTreduced`, `DEV`, `BENGALI`, `GUJARATI`), 
* scansion: `show_weights`, `show_morae`, `show_gaRas`, `show_alignment` (`True`, `False`)
* meter identification: `resplit_option` (`none`, `resplit_lite`, `resplit_max`), `keep_mid` (`True`, `False`)
* sandhi/compound splitting: `prsrv_punc` (`True`, `False`)

Examples:

1. `skrutable.transliteration`, `transliteration.Transliterator`, `Transliterator.transliterate()`
~~~
from skrutable.transliteration import Transliterator
T = Transliterator()
string_result_1 = T.transliterate( input_string ) # default from_scheme, to_scheme
string_result_2 = T.transliterate( input_string, to_scheme='BENGALI' ) # default from_scheme
string_result_3 = T.transliterate( input_string, from_scheme='HK', to_scheme='BENGALI')
~~~

2. `skrutable.scansion`, `scansion.Scanner`, `Scanner.scan()`
~~~
from skrutable.scansion import Scanner
S = Scanner()
Verse_result_1 = S.scan( input_string ) # default from_scheme, show options
print( Verse_result_1.summarize() )
Verse_result_2 = S.scan( input_string, from_scheme='DEV') 
print( Verse_result_2.summarize() ) # default 'show' options
Verse_result_3 = S.scan( input_string, from_scheme='DEV') 
print( Verse_result_3.summarize(show_alignment=False) ) # default further 'show' options
~~~

3. `skrutable.meter_identification`, `meter_identification.MeterIdentifier`, `MeterIdentifier.identify_meter()`
~~~
from skrutable.meter_identification import MeterIdentifier
MI = MeterIdentifier()
Verse_result_1 = MI.identify_meter(input_string) # default from_scheme, resplit_option
print( Verse_result_1.meter_label() )
Verse_result_2 = MI.identify_meter(input_string, resplit_option='none') # default from_scheme
print( Verse_result_2.summarize() ) # default 'show' options
Verse_result_3 = MI.identify_meter(input_string, from_scheme='IAST', resplit_option='resplit_lite')
print( Verse_result_3.summarize(show_morae=False) ) # default further 'show' options
~~~

4. `skrutable.splitter.wrapper`, `splitter.wrapper.Splitter`, `Splitter.split()`
~~~
from skrutable.splitter.wrapper import Splitter
Spl = Splitter()
string_result_1 = Spl.split( input_string_1 ) # default prsrv_punc
string_result_2 = Spl.split( input_string_2, prsrv_punc=False )
~~~

Note that use of the Splitter wrapper in this way requires further setup: In `splitter/wrapper_config.json`, set the value for `python_3_5_bin_path` to the absolute path to `Python 3.5` on your own machine, and make sure that `tensorflow 1.x` (e.g., 1.15) is installed for that particular version of Python (e.g., `pip3.5 install tensorflow==1.15.0`). Good luck and/or [ask me](#feedback) for help!

More examples of how to use the library can be found in the repo's `tests` folder (for use with `pytest`) and in the `jupyter_notebooks` folder.


## using as command-line script

Another way to run the code is the little command-line script `skrutable_one.py`. To use it, make a copy of `skrutable_one.py` and put it the same location as your desired input file. (Note: The main library must be located somewhere where imports from anywhere will work, otherwise bring your input to the library location instead.) Then just run `skrutable_one.py` at the command line (e.g., Terminal) with the proper arguments. Examples:

1. transliterate to Bengali script:
~~~
python skrutable_one.py --transliterate FILENAME.txt from_scheme=IAST to_scheme=BENGALI
~~~

2. identify meter for a single verse:
~~~
python skrutable_one.py --identify_meter FILENAME.txt resplit_option=none from_scheme=IAST
~~~

3. identify meter for a whole file (one verse per line):
~~~
python skrutable_one.py --identify_meter --whole_file FILENAME.txt resplit_option=resplit_lite from_scheme=IAST
~~~


# feedback

For any questions, comments, or requests, find [me on Academia](https://uni-leipzig1.academia.edu/TylerNeill) and send me an email.