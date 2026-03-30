input_string = "tava karakamalasthāṃ sphāṭikīmakṣamālāṃ , nakhakiraṇavibhinnāṃ dāḍimībījabuddhyā | pratikalamanukarṣanyena kīro niṣiddhaḥ , sa bhavatu mama bhūtyai vāṇi te mandahāsaḥ ||"

print("=" * 60)
print("Example 1: Transliterator.transliterate()")
print("=" * 60)

from skrutable.transliteration import Transliterator

print("\n-- Pattern A: both schemes as constructor defaults --")
T = Transliterator(from_scheme='IAST', to_scheme='DEV')
result = T.transliterate(input_string)
print(result)

print("\n-- Pattern B: to_scheme only at constructor; from_scheme auto-detected --")
T = Transliterator(to_scheme='DEV')
result = T.transliterate(input_string)
print("auto-detected -> DEV:", result)
result = T.transliterate(input_string, to_scheme='BENGALI')
print("override to BENGALI:", result)
result = T.transliterate(input_string, avoid_virama_indic_scripts=False)
print("avoid_virama_indic_scripts=False:", result)

print("\n-- Pattern C: fixed from_scheme at constructor, override to auto for one call --")
T = Transliterator(from_scheme='DEV', to_scheme='IAST')
result = T.transliterate(input_string, from_scheme='auto')
print("from_scheme='auto':", result)

print()
print("=" * 60)
print("Example 2: SchemeDetector.detect_scheme()")
print("=" * 60)

from skrutable.scheme_detection import SchemeDetector
SD = SchemeDetector()
detected_scheme = SD.detect_scheme(input_string)
print(f"detected_scheme: {detected_scheme}")
print(f"confidence: {SD.confidence}")

print()
print("=" * 60)
print("Example 3: Scanner.scan()")
print("=" * 60)

from skrutable.scansion import Scanner
S = Scanner()
verse = S.scan(input_string)
print("summarize(show_label=False):")
print(verse.summarize(show_label=False))
print("summarize(show_alignment=False, show_label=False):")
print(verse.summarize(show_alignment=False, show_label=False))

T_dev = Transliterator(from_scheme='IAST', to_scheme='DEV')
dev_input = T_dev.transliterate(input_string)
print(f"\nDEV input: {dev_input}")
verse = S.scan(dev_input, from_scheme='DEV')
print("scan with from_scheme='DEV':")
print(verse.summarize(show_label=False))

print()
print("=" * 60)
print("Example 4: MeterIdentifier.identify_meter()")
print("=" * 60)

from skrutable.meter_identification import MeterIdentifier
MI = MeterIdentifier()
verse = MI.identify_meter(input_string)
print(f"meter_label: {verse.meter_label}")
print("summarize():")
print(verse.summarize())

verse = MI.identify_meter(input_string, resplit_option='none')
print(f"resplit_option='none' -> meter_label: {verse.meter_label}")

verse = MI.identify_meter(dev_input, from_scheme='DEV', resplit_option='resplit_lite')
print(f"from_scheme='DEV', resplit_lite -> meter_label: {verse.meter_label}")

print()
print("=" * 60)
print("Example 5: Splitter.split()")
print("=" * 60)

from skrutable.splitting import Splitter
Spl = Splitter()
result = Spl.split(input_string)
print("auto-detected -> IAST:", result)
result = Spl.split(input_string, to_scheme='DEV')
print("to_scheme='DEV':", result)
result = Spl.split(input_string, from_scheme='IAST', to_scheme='HK')
print("from_scheme='IAST', to_scheme='HK':", result)
result = Spl.split(input_string, preserve_punctuation=False)
print("preserve_punctuation=False:", result)
result = Spl.split(input_string, preserve_compound_hyphens=False)
print("preserve_compound_hyphens=False:", result)
result = Spl.split(input_string, splitter_model='splitter_2018')
print("splitter_model='splitter_2018':", result)
