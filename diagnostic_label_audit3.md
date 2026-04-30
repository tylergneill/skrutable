# Diagnostic label audit

## Anuṣṭubh — length error

| `imperfect_label_sanskrit` | `imperfect_label_english` |
|---------------------------|--------------------------|
| `adhikākṣarā` | `hypermetric` |
| `ūnākṣarā` | `hypometric` |

## Anuṣṭubh — pattern violations (odd pāda)

| `imperfect_label_sanskrit` | `imperfect_label_english` |
|---------------------------|--------------------------|
| `asamīcīnā, na prathamāt snau` | `Syllables 2–3 in any pāda cannot both be light (Piṅgala; Hahn 2014 anuṣṭubh general rule 2)` |
| `asamīcīnā, ma-vipulāyāḥ pūrvaṃ raḥ syāt` | `ma-vipulā must be preceded by ra-gaṇa (Hahn 2014 anuṣṭubh vipulā rule 3)` |
| `asamīcīnā, bha-vipulāyāḥ pūrvaṃ raḥ syāt` | `bha-vipulā must be preceded by ra-gaṇa (Hahn 2014 anuṣṭubh vipulā rule 2)` |
| `asamīcīnā, na-vipulāyāḥ pūrvaṃ guruḥ syāt` | `na-vipulā must be preceded by heavy syllable (Hahn 2014 anuṣṭubh vipulā rule 1)` |
| `asamīcīnā, ra-vipulāyāḥ pūrvaṃ guruḥ syāt` | `ra-vipulā must be preceded by heavy syllable (Hahn 2014 anuṣṭubh vipulā rule 4)` |

Note: `bha-vipulā (ma-gaṇa-pūrvikā!)` is a recognized **perfect** sub-variant (not in the asamīcīna table), so it carries no imperfect labels.

## Anuṣṭubh — pattern violations (even pāda)

| `imperfect_label_sanskrit` | `imperfect_label_english` |
|------------------------------------------------------|--------------------------|
| `asamīcīnā, na prathamāt snau` | `Syllables 2–3 in any pāda cannot both be light (Piṅgala; Hahn 2014 anuṣṭubh general rule 2)` |
| `asamīcīnā, [na ca prathamāt] dvitīyacaturthayo raḥ` | `Syllables 2–3 in even pāda cannot be ra-gaṇa (Piṅgala; Hahn 2014 anuṣṭubh general rule 3)` |

## Anuṣṭubh — fallback (no pattern matched)

| `imperfect_label_sanskrit` | `imperfect_label_english` |
|--------------------------------------------------------------------|--------------------------|
| `asamīcīnā, [caturthāt ...] yujo j` | `Syllables 5–7 in even pāda must be ja-gaṇa (Piṅgala; Hahn 2014 anuṣṭubh general rule 4)` |
| `asamīcīnā, [vipulāyām asatyām] ya[gaṇaḥ ayujaḥ] caturthāt [syāt]` | `Syllables 5–7 in odd pāda must be ya-gaṇa when no vipulā applies (Piṅgala; Hahn 2014 anuṣṭubh pathyā)` |

## Samavṛtta — per-pāda errors

| `imperfect_label_sanskrit` | `imperfect_label_english` |
|---------------------------|--------------------------|
| `adhikākṣarā` | `hypermetric` |
| `ūnākṣarā` | `hypometric` |
| `vikṛtavṛtta` | `does not match expected gaṇa pattern {XYZ}` (e.g. `does not match expected gaṇa pattern ttjg`) |

## Upajāti — excluded pādas

| `imperfect_label_sanskrit` | `imperfect_label_english` |
|---------------------------|--------------------------|
| `adhikākṣarā` | `hypermetric` |
| `ūnākṣarā` | `hypometric` |

## Jāti — gaṇa-rule violations

| `imperfect_label_sanskrit` | `imperfect_label_english` |
|---------------------------|--------------------------|
| `asamīcīnā, gaṇasaṃkhyā na aṣṭau` | `Ardha does not contain exactly 8 mātrā-gaṇas (Hahn general, definition)` |
| `asamīcīnā, jaḥ ayuggaṇe` | `Odd gaṇa positions (1, 3, 5, 7) must never be ja-gaṇa (Hahn general rule 1)` |
| `asamīcīnā, ṣaṣṭhagaṇo na jaḥ/khaḥ` | `The 6th gaṇa must be ja or kha in this meter (Hahn general rule 2)*` |
| `asamīcīnā, ṣaṣṭhagaṇo na laḥ` | `The 6th gaṇa must be a single laghu in this meter (Hahn special rule 2)` |
| `asamīcīnā, aṣṭamagaṇo na ekākṣaraḥ` | `The last gaṇa of both ardhas must be a single anceps syllable (Hahn general, 8th gaṇa)*` |
| `asamīcīnā, aṣṭamagaṇo na caturmātro (akha)` | `The last gaṇa of both ardhas must be 4 moras long and not kha-gaṇa in āryāgīti (Hahn special rule 4)*` |

`*` = Hahn's rule as stated requires correction; Skrutable applies the corrected interpretation.

## Jāti — incorrect quarter split

| `imperfect_label_sanskrit` | `imperfect_label_english` |
|---------------------------|--------------------------|
| `adhikākṣarā` | `pāda split doesn't match expected pattern [a,b,c,d]` (e.g. `pāda split doesn't match expected pattern [12, 18, 12, 15]`) |
| `ūnākṣarā` | `pāda split doesn't match expected pattern [a,b,c,d]` (e.g. `pāda split doesn't match expected pattern [12, 18, 12, 15]`) |
