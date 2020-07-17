# Skrutable

A small library of practical tools for Sanskrit text processing in Python, including transliteration and scansion. 

'Skrutable' like 'less inscrutible' but also like /saṃskrut/ in Maharashtrian pronunciation.

# About

These tools are meant to be robust enough for the use of Sanskrit scholars but also easy enough for amateurs to use as well. In particular, I have in mind serious Sanskrit students, who, if they know some Python, are invited to not only use these tools but also read through the code in order to learn more about the mechanical nature of operations like transliteration and scansion.

# Web App

Preview the functionality online [here](...).

# Installation

~~~
For the standalone desktop app, download this repo (easiest: green "Download" button), find the executable for your system (Mac: ..., Windows: ...), and run as you would any other program (e.g., double-click).
~~~

For the Python library:

1. Have Python 3 installed. (Homebrew recommended. Programmed in 3.7.)

2. Command line: `pip install skrutable`.
* You can also clone the repo, run Python interactively, and import locally.

3. Install Python libraries:
* Easiest: `pip install -r requirements.txt`
* (A virtual environment is recommended if you know how.)
* (You can also install the libraries in `requirements.txt` manually.)

# How to Use

1. Example commands for import and use of key library objects are provided in `demo.py`. After you get the hang of it, write you own code that imports and uses skrutable as you need it.

2. The schemes used are all referred to by simple strings, as follows (also with their full names and examples of each):

Roman Indic
IAST International Alphabet of Sanskrit Transliteration paṭhāmaḥ
SLP Sanskrit Library Protocol 1 paWAmaH
HK Harvard-Kyoto paThAmaH
DEV Devanagari Unicode पठामः
BENGALI Bengali Unicode ...
GUJARATI Gujarati Unicode ...
VH Velthuis pa.thaama.h
WX Scheme developed at IIT Kanpur ...
ITRANS Indian Languages Transliteration paThaamaH
CSX Classical Sanskrit eXtended paòâmaþ
REE Scheme used by Ronald E. Emmerick paèÃma÷
OAST (my own made-up name) Scheme used by Oliver Hellwig in older DCS data pa®åmaµ (incomplete)

For more detail, see [Terminological Note on 'Scheme' versus 'Encoding'](#Terminological-Note-on-Scheme-versus-Encoding) below.

3. The default behavior is to auto-detect the input transliteration scheme, but you can override this.

4. You can also issue simple requests on the command line, e.g., transliterating a whole file to Bengali script with `python skrutable.py --transliterate FILENAME.txt to_scheme=BENGALI`, or identify the meter of a verse with `python skrutable --identify_meter FILENAME.txt`.

5. Tweak user options in `config.py`:
* avoid virāma
* default scheme out
* preserve IAST jihvAmUlIya and upaDmAnIya

# Examples

## Transliteration

~~~
from skrutable import transliteration as tr
T = tr.Transliterator()
text = 'रामः'
result = T.transliterate(text, from_scheme='DEV', to_scheme='IAST')
print(result)
>> rāmaḥ
~~~

or

~~~
from skrutable.transliteration import Transliterator as Tr
T = Tr()
~~~

etc.

## Scansion

Command line: `python skrutable --identify_meter FILENAME.txt`.

Where FILENAME.txt contains:

~~~
सत्यात्मनि परसंज्ञा स्वपरविभागात् परिग्रहद्वेषौ अनयोः सम्प्रतिबद्धाः सर्वे दोषाः प्रजायन्ते
~~~

This creates FILENAME_out.txt in the same location, containing:

~~~
    ggllllgg   [12]
llllgglglggg   [18]
    llggllgg   [12]
    gggglggg   [15]

     sa    tyā    tma     ni     pa     ra     sa   ṃjñā       
      g      g      l      l      l      l      g      g
    sva     pa     ra     vi    bhā     gā    tpa     ri    gra     ha    dve    ṣau       
      l      l      l      l      g      g      l      g      l      g      g      g
      a     na     yo    ḥsa   mpra     ti     ba  ddhāḥ       
      l      l      g      g      l      l      g      g
     sa    rve     do     ṣā   ḥpra     jā     ya    nte       
      g      g      g      g      l      g      g      g

āryā
~~~

or in interactive mode (similarly when importing within other code):

~~~
from skrutable import scansion as sc
S = sc.Scanner()
text = "sampUrNakumbho na karoti zabdam\nardho ghaTo ghoSamupaiti nUnam |\nvidvAnkulIno na karoti garvaM\njalpanti mUDhAstu guNairvihInAH ||"
scanning_results = S.scan(text)

print scanning_results.summary()

>>>
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
>>>

print sc.identify(scanning_results)

>>> indravajrā (ttjgg)
~~~

# Terminology Note: 'Encoding', 'Script', 'Scheme'

'Encoding' is used in the sense of UTF-8 (of which ASCII is a subset) as opposed to UTF-16 (or an older one such as 'Western ISO Latin 1').

'Script' is used in the sense of alphabet or syllabary (actually abugida), meaning the set of characters as might be written out by hand (Sanskrit 'lipi'), e.g., Devanagari script, Bengali script, and the Roman (a.k.a. Latin) alphabet (often extended with technical diacritics).

'Scheme' (the main term used here) is meant in the sense of a specific standardized convention for representing Sanskrit on the computer, including Devanagari Unicode (here just 'Devanagari'), Bengali Unicode (or just 'Bengali'), and various Romanizations such as IAST, SLP1, Velthuis, and ITRANS.

Note therefore that simply speaking of "Roman" or "Unicode" is not specific enough to clearly indicate either a script or a scheme. "Roman" describes both SLP and IAST, whereas "Unicode" describes both IAST and Devanagari.

Note also that fonts are completely ignored here.

For more information, please refer to ["Transliteration of Devanagari" by D. Wujastyk](http://indology.info/email/members/wujastyk/) and ["Linguistic Issues in Encoding Sanskrit" by P. Scharf](http://sanskritlibrary.org/Sanskrit/pub/lies_sl.pdf).

# Whitespace and virāma

A handy bonus feature in `transliteration.py` is supplied by `virAma_avoidance.py`. Setting the corresponding option in `config.py` to `True` will get rid of unsightly virāmas and spaces that tend to result when transliterating from any schemes (typically Roman ones) that use more space between words to any schemes (typically Indic ones) that typically forego such explicit spaces in deference to the traditional ligature principle (not least, e.g., because of the extra virāmas that Indic scripts require to represent word-final consonants). Note that such a transformation actually results in a loss of valuable information which can be reversed only at great expense (for large texts, many hours of skilled human labor, even if assisted by a well-trained neural network).

# Going Further

Mixed-language input is not yet supported, so everything in the input must be Sanskrit. However, if your input is in carefully encoded XML, you can distinguish what is Sanskrit based on XML tags and their attributes and pass only that data to the transliterator.

If you need symbols beyond those used for Classical Sanskrit, such as those for Vedic or Pali, you'll need to add these yourself. A limited number of extensions are currently supported (e.g. jihvāmūlīya and upadhmānīya, used in some editions) through special options. You can also easily add more scripts/schemes (e.g., Gurmukhi, maybe Dravidian or other Brāhmī-based ones like Burmese) by modifying the modules `phonemes.py` and `scheme_maps` on the pattern of the other Roman or Indic scripts, as appropriate. This project is not designed for modern languages such as Hindi, whether with the additional code points in Devanagari Unicode or the additional elements in the ISO ... Romanization.