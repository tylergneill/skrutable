text1 = ...

import skrutable.schemes as sch
S_I = sch.Identifer()
scheme1 = S_I.identify_scheme(text1) # sch.IAST

import skrutable.transliteration as tr
T = tr.Transliterator()
text2 = T.transliterate(text1, scheme1, sch.HK)

import skrutable.scansion as sc
S = sc.Scanner()
pattern1 = S.scan() # [sc.light, sc.light, sc.heavy, sc.light...]

import skrutable.meterIdentification as m_id
M_I = m_id.Identifer()
meter1 = M_I.identify_meter(pattern1)