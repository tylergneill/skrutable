text1 = "na svato nāpi parato"
# text1 = """na svato nāpi parato na dvābhyāṃ nāpy ahetutaḥ / utpannā jātu vidyante bhāvāḥ kva cana ke cana //
# catvāraḥ pratyayā hetur ārambaṇam anantaram / tathaivādhipateyaṃ ca pratyayo nāsti pañcamaḥ //
# na hi svabhāvo bhāvānāṃ pratyayādiṣu vidyate / avidyamāne svabhāve parabhāvo na vidyate //
# kriyā na pratyayavatī nāpratyayavatī kriyā / pratyayā nākriyāvantaḥ kriyāvantaś ca santy uta //"""
# text1 = """na svato nApi parato na dvAbhyAM nApy ahetutaH / utpannA jAtu vidyante bhAvAH kva cana ke cana //
# catvAraH pratyayA hetur ArambaNam anantaram / tathaivAdhipateyaM ca pratyayo nAsti paJcamaH //
# na hi svabhAvo bhAvAnAM pratyayAdiSu vidyate / avidyamAne svabhAve parabhAvo na vidyate //
# kriyA na pratyayavatI nApratyayavatI kriyA / pratyayA nAkriyAvantaH kriyAvantaz ca santy uta //"""

# import binascii
# b = bytes(text1, "utf-8")

import schemes3 as sch
print(sch.slp)

# S_I = sch.Identifer()
# scheme1 = S_I.identify_scheme(text1) # sch.IAST
# 
# import transliteration as tr
# T = tr.Transliterator()
# text2 = T.transliterate(text1, scheme1, sch.HK)
# 
# import scansion as sc
# S = sc.Scanner()
# pattern1 = S.scan() # [sc.light, sc.light, sc.heavy, sc.light...]
# 
# import meterIdentification as m_id
# M_I = m_id.Identifer()
# meter1 = M_I.identify_meter(pattern1)