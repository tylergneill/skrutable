import time
from skrutable.meter_identification import MeterIdentifier

input_file = 'Ram_input_cleaned.txt'

with open(input_file, 'r') as f:
    verses = f.readlines()

MI = MeterIdentifier()

start = time.time()
for verse in verses:
    MI.identify_meter(verse.strip(), resplit_option='resplit_lite', resplit_keep_midpoint=True, from_scheme='IAST')
elapsed = time.time() - start

import skrutable
print(f"skrutable {skrutable.__version__}: {len(verses)} verses in {elapsed:.2f}s ({elapsed/len(verses)*1000:.2f}ms/verse)")
