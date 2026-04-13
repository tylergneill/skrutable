# Sanskrit Naming Consistency Audit

## Summary

The codebase uses three schemes for Sanskrit names in Python identifiers:

| Scheme | Examples | Where used |
|--------|----------|------------|
| **SLP1** | `anuzwuB`, `pAda`, `gaRa`, `virAma`, `upajAti` | Internal variables, function names, method names, dict keys, config keys, filenames |
| **IAST** (diacritics) | `anuṣṭubh`, `pathyā`, `vipulā`, meter name strings | User-facing string values (meter labels, meter_melodies dict values) |
| **IAST-reduced** | `asamicina` | One string literal in meter_identification.py (the asamīcīna label) |

The pattern is consistent in intent: **SLP1 for code identifiers, IAST for human-readable output strings**. The one anomaly is `asamīcīna` appearing as an IAST string literal in code that otherwise uses SLP1 identifiers.

---

## SLP1 identifiers (internal)

These appear as variable names, method names, dict keys, config.json keys, and filenames:

- `anuzwuB`, `anuzwuB_pAda` — meter_patterns.py, meter_identification.py
- `pAda`, `pAdasamatva_count`, `additional_pAda_separators` — scansion.py, meter_identification.py, config.json
- `gaRa`, `gaRas_by_weights`, `samavfttas_by_family_and_gaRa` — meter_patterns.py
- `upajAti`, `disable_non_trizwuB_upajAti` — meter_identification.py, config.json
- `virAma`, `virAmas`, `avoid_virAmas`, `virAma_avoidance.py` — transliteration.py, phonemes.py
- `mAtrA`, `mAtrAs`, `vowel_mAtrA_lookup` — phonemes.py
- `vipulA`, `pathyA` — meter_patterns.py (pattern dict keys, comments)
- `zloka` — meter_identification.py (comment only)
- `anunasika`, `normalize_anunasika` — transliteration.py
- `jAtis_by_morae` — meter_patterns.py

## IAST string values (user-facing output)

These are string values returned to users, not Python identifiers:

- Meter labels: `"anuṣṭubh"`, `"pathyā"`, `"vipulā"`, `"upajāti"`, `"samavṛtta"`, etc.
- All entries in `meter_melodies` dict (meter_patterns.py lines ~359–401)
- `"asamīcīna"` — the one IAST-reduced outlier (see below)

## IAST-reduced outlier

`"asamīcīna"` appears as a string literal in meter_identification.py lines 109 and 113:
```python
Vrs.meter_label = "anuṣṭubh (1,2: asamīcīna, 3,4: " + pAdas_cd + ")"
```
This is a user-facing output string, so it should use IAST (with diacritics) — i.e. `"asamīcīna"` is correct IAST. The "IAST-reduced" characterization is wrong: it does have the proper diacritics. This is not an inconsistency.

---

## Risk assessment

### No breaking changes: renaming SLP1 internal identifiers

All SLP1 identifiers are **internal to the library**. The public API surface is:
- `Scanner.scan()` → returns `Verse` object
- `MeterIdentifier.identify_meter()` → returns `Verse` object  
- `Verse` attributes: `meter_label`, `identification_score`, `syllable_weights`, `gaRa_abbreviations` (this last one is SLP1 — see below)
- `config.json` keys

**True public-facing SLP1 identifiers** (renaming these would be a breaking change):
- `Verse.gaRa_abbreviations` — returned to callers who read Verse objects
- `config.json` keys: `additional_pAda_separators`, `disable_non_trizwuB_upajAti` — read by users who customize config

**Safe to rename** (internal only, not exported):
- Method names: `test_as_anuzwuB`, `test_as_anuzwuB_half`, `count_pAdasamatva`, `evaluate_upajAti`, etc. — internal to `MeterIdentifier`
- Local variables: `pAda`, `w_p`, etc.
- Module-level dict names: `anuzwuB_pAda`, `gaRas_by_weights`, `jAtis_by_morae` — internal to meter_patterns.py
- `virAma_avoidance.py` filename and its contents — internal import only

### Recommendation

The SLP1-for-identifiers convention is reasonable and deliberate. The two genuinely public SLP1 names (`Verse.gaRa_abbreviations`, config keys) would require a deprecation cycle to rename. 

**Suggested approach for this task**: introduce all new identifiers using IAST-reduced (ASCII, no diacritics) for the new dataclass and attribute names (e.g. `HalfVerseResult`, `failure_diagnostic`), since these will be new public-facing Verse attributes. Do not rename existing SLP1 identifiers now. Schedule a separate cleanup pass for `Verse.gaRa_abbreviations` and the config keys with a deprecation warning.
