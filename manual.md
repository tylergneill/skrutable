# about

See [http://skrutable.pythonanywhere.com/about](http://skrutable.pythonanywhere.com/about)


# how to use

The online web app [http://skrutable.pythonanywhere.com/](http://skrutable.pythonanywhere.com/)
will let you do both casual one-off tasks and (with some limits) whole-file processing.

![screenshot](img/web_app.png)

See [http://skrutable.pythonanywhere.com/tutorial](http://skrutable.pythonanywhere.com/tutorial) for more instructions.

If you need more functionality, you can also download and use the Python code, either as a library or (with limits) as a command-line script. See [using the code](#using-the-code) below for more.


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
            <td rowspan=8>Roman</td>
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
            <td>ITRANS</td>
            <td>Indian Languages Transliteration</td>
            <td>sa.mskRita.m paThaama.h</td>
        </tr>

        <tr>
            <td>SLP</td>
            <td>Sanskrit Library Protocol 1</td>
            <td>saMskftaM paWAmaH</td>
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
            <td>পঠামঃ</td>
        </tr>
        <tr>
            <td>GUJARATI</td>
            <td>Gujarati Unicode</td>
            <td>પઠામઃ</td>
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

    </tbody>
</table>

There is also an IASTreduced (“samskrtam pathamah”) that loses a lot of information but sometimes comes in handy. Other schemes not featured include CSX (Classical Sanskrit eXtended, “saüskçtaü paòâmaþ”), REE (devised by Ronald E. Emmerick, “saæsk­taæ paèÃma÷”), and that internal to the [DCS](http://www.sanskrit-linguistics.org/dcs/index.php) (devised by Oliver Hellwig, “saºskŸtaº paÅåmaµ”). 

Other schemes that can be used for Sanskrit (especially those corresponding to different Indic scripts) can also easily be added. For other tools with better Indic support, including for other languages, see [related projects](#related-projects) below.

Note that I use “encoding” here in the sense of UTF-8 and “script” in the sense of a distinct character set like either the Roman or Devanagari alphabets (latter actually an abugida), and so I don't use either “Roman” or “Unicode” to refer to any of the individual schemes. For more on such terminology, see [here](http://indology.info/email/members/wujastyk/) and [here](http://sanskritlibrary.org/Sanskrit/pub/lies_sl.pdf).)


# encoding normalization

Some schemes have internal options. For example, at the level of encoding, IAST is sometimes represented in UTF-8 with combining diacritics, sometimes with precomposed combinations. Alternatively, at the level of the scheme itself, ITRANS writes vocalic r (ṛ, ऋ) as 'Ri', 'RRi', or 'R^i.

Because `skrutable` transliterates by way of SLP, and because it must output a single option, you can use round-trip transliteration (e.g. IAST-IAST) to normalize such variation. For example:

~~~
"rāmaḥ" == 'r' + 'a' + '¯' (U+0304) + 'm' + 'a' + 'h' + '.' (U+0323)
>>
"rāmaḥ" == 'r' + 'ā' (U+0101) + 'm' + 'a' + 'ḥ' (U+1E25)
~~~

That is, `skrutable` currently favors precomposed characters for IAST. In the code, these and other scheme-internal defaults can be viewed and changed in `scheme_maps.py`.


# virāma avoidance

For the purpose of printing Indic scripts, it's often aesthetically (albeit not scientifically) preferable to remove certain inter-word spaces and their corresponding virāmas, and to instead use ligatures. For example:

~~~
“asty eva” >> (“अस्त्य् एव”) >> “अस्त्येव”
~~~

This is the default behavior for transliterating to Indic scripts in `skrutable`. In the code, the regular expressions governing this can be found in `virAma_avoidance.py`, and the overall setting can be toggled in `config.py`.


# related projects

There are numerous related projects which some users may find preferable to `skrutable` in certain respects (e.g., more script support, easier to install, nicer looking, etc.) Here are my recommended highlights.

Scheme Detection | Transliteration | Scansion & Meter Identification | Main Author
-------- | ---------- | --------- | --------
([“detect.py” module](https://github.com/sanskrit/detect.py)) | **[Sanscript](http://learnsanskrit.org/tools/sanscript)** (also via PyPi [here](https://github.com/sanskrit-coders/indic_transliteration)) | (n/a) | Arun Prasad
(n/a) | **[Aksharamukha](http://aksharamukha.appspot.com/converter)** | (n/a) | Vinodh Rajan
([“detect.py” module](https://github.com/shreevatsa/sanskrit/blob/master/transliteration/detect.py)) | ([“transliteration” subpackage](https://github.com/shreevatsa/sanskrit/tree/master/transliteration)) | **[Metre Identifier](http://sanskritmetres.appspot.com/)** | Shreevatsa R.
(n/a) | (n/a) | **[Meter Identifying Tool](http://sanskritlibrary.org:8080/MeterIdentification/)** | Keshav Melnad
(n/a) | **[Transliteration Tool](https://www.ashtangayoga.info/philosophy/sanskrit-and-devanagari/transliteration-tool/)** | (n/a) | AshtangaYoga.info
(n/a) | **[Sanscription](http://www.tyfen.com/sanscription/)** | (n/a) | Marc Tiefenauer


# scheme auto-detection

(*Currently under development*)

`skrutable`'s scheme auto-detection is primarily frequency-based for robustness. Only where this fails (e.g., for very short inputs) does it rely on singly-occurring distinctive characters. In the code, the default behavior can be toggled in `config.py`.


# sandhi and compound splitting

Currently under development is a wrapper for the pre-trained model of the powerful neural-network tool, [Sanskrit Sandhi and Compound Splitter](https://github.com/OliverHellwig/sanskrit/tree/master/papers/2018emnlp) by Hellwig and Nehrdich, which produces good, usable splitting results (examples: [here](https://github.com/tylergneill/pramana-nlp/tree/master/3_text_doc_and_word_segmented) and [here](https://github.com/sebastian-nehrdich/gretil-quotations)) but which has so far not yet been easily available (command-line only, `Python 3.5.9`, `TensorFlow`). This is to be presented as a fourth functionality after transliteration, scansion, and meter identification.


# using the code

## installation

1. Have Python 3 installed. (`Homebrew` recommended)

2. Install `skrutable`.

* (Eventually: Installation via `pip`. For now...)

3. Click the green “Code” button on [GitHub main page](https://github.com/tylergneill/skrutable) or just click [here](https://github.com/tylergneill/skrutable/archive/master.zip) to download the repo.

4. Put the `skrutable` folder where your other Python libraries are.
	* Using `virtualenv`? You can put it directly in the relevant `lib/python3.x/site-packages` folder.
	* Not? Then you can put it where your other packages normally install to (e.g. with `pip`).
		* (Hint: command line `python -c "import sys; print(sys.path)"` to see where.)

5. Get the other necessary Python libraries: 
	* currently only `numpy`. (`pip` recommended)
	* (should already be natively pre-installed: `collections`, `copy`, `json`, `operator`, `os`, `re`)

## how to use

### keywords

For transliteration:
* from_scheme, to_scheme
* IAST, HK, SLP, ITRANS, VH, WX, IASTreduced


### command-line script

Make a copy of `skrutable_one.py` and put it the same location as your desired input file. Then just run `skrutable_one.py` at the command line (e.g., Terminal) for quick and powerful access to the main methods for each of the four main modules. Examples:

1. transliterate to Bengali script:
~~~
python skrutable_one.py --transliterate FILENAME.txt to_scheme=BENGALI
~~~

2. identify the meter of a single verse:
~~~
python skrutable_one.py --identify_meter FILENAME.txt
~~~



To use, simply put `skrutable_one.py` (or a copy thereof) and 


 in the same place (wherever you'd like), open the Terminal/Command Line at that place, and run the command.







1. 

Import modules/constructors, instantiate respective objects, and use those objects' primary methods.

(Note for coding purposes: lowercase for “skrutable” and all modules, camelcase for objects.)

1. Scheme Detection
~~~
from skrutable.scheme_detection import SchemeDetector
SD = SchemeDetector()
string_result = SD.detect_scheme( input_string )
~~~

2. Transliteration
~~~
from skrutable.transliteration import Transliterator
T = Transliterator()
string_result_1 = T.transliterate( input_string ) # using default settings
string_result_2 = T.transliterate( input_string, to_scheme='BENGALI' )
string_result_3 = T.transliterate( input_string, from_scheme='BENGALI', to_scheme='HK' )
string_result_4 = T.transliterate( input_string, from_scheme='auto', to_scheme='ITRANS' )

~~~

3. Scansion
~~~
from skrutable.scansion import Scanner
S = Scanner()
object_result = S.scan( input_string )
print( object_result.summarize() )
~~~

4. Meter Identification
~~~
from skrutable.meter_identification import MeterIdentifier
MI = MeterIdentifier()
object_result = MI.identify_meter( input_string ) # default resplit_option
print( object_result.summarize() )
another_object_result = MI.identify_meter(input_string, resplit_option='resplit_hard')
print( another_object_result.meter_label() )
~~~

For more examples, see `demo.py` (coming soon).

