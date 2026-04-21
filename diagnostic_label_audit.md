# Diagnostic label audit

## Anuṣṭubh — length error

| `imperfect_label_sanskrit` | `imperfect_label_english` |
|---------------------------|--------------------------|
| `adhikākṣarā` | `hypermetric` |
| `ūnākṣarā` | `hypometric` |

## Anuṣṭubh — pattern violations (odd pāda)

| `imperfect_label_sanskrit` | `imperfect_label_english` |
|---------------------------|--------------------------|
| `asamīcīnā, na prathamāt snau` | `Syllables 2–3 in any pāda cannot both be light (Piṅgala; Hahn anuṣṭubh general rule 2)` |
| `asamīcīnā, ma-vipulāyāḥ pūrvaṃ raḥ syāt` | `ma-vipulā requires immediately preceding ra-gaṇa (Hahn anuṣṭubh vipulā rule 3)` |
| `asamīcīnā, bha-vipulāyāḥ pūrvaṃ raḥ syāt` | `bha-vipulā requires immediately preceding ra-gaṇa (Hahn anuṣṭubh vipulā rule 2)` |
| `asamīcīnā, na-vipulāyāḥ pūrvaṃ guruḥ syāt` | `na-vipulā requires immediately preceding heavy syllable (Hahn anuṣṭubh vipulā rule 1)` |
| `asamīcīnā, ra-vipulāyāḥ pūrvaṃ guruḥ syāt` | `ra-vipulā requires immediately preceding heavy syllable (Hahn anuṣṭubh vipulā rule 4)` |

Note: `bha-vipulā (ma-gaṇa-pūrvikā!)` is a recognized **perfect** sub-variant (not in the asamīcīna table), so it carries no imperfect labels.

## Anuṣṭubh — pattern violations (even pāda)

| `imperfect_label_sanskrit` | `imperfect_label_english` |
|---------------------------|--------------------------|
| `asamīcīnā, na prathamāt snau` | `Syllables 2–3 in any pāda cannot both be light (Piṅgala; Hahn anuṣṭubh general rule 2)` |
| `asamīcīnā, [na] dvitīyacaturthayo raḥ` | `Syllables 5–7 in even pāda must be ja-gaṇa (Piṅgala; Hahn anuṣṭubh general rule 3)` |

## Anuṣṭubh — fallback (no pattern matched)

| `imperfect_label_sanskrit` | `imperfect_label_english` |
|---------------------------|--------------------------|
| `asamīcīnā, [caturthāt] pathyā yujo j` | `Syllables 5–7 in even pāda must be ja-gaṇa (Piṅgala; Hahn anuṣṭubh general rule 4)` |
| `asamīcīnā, [vipulāyām asatyām] ya[gaṇaḥ ayujaḥ] caturthāt [syāt]` | `Syllables 5–7 in odd pāda must be ya-gaṇa when no vipulā applies (Piṅgala; Hahn anuṣṭubh pathyā)` |

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
| `asamīcīnā, gaṇasaṃkhyā na aṣṭau` | `Ardha does not contain exactly 8 mātrā-gaṇas (Hahn jāti)` |
| `asamīcīnā, jaḥ ayuggaṇe` | `No j-gaṇa permitted in odd gaṇa position (Hahn jāti general rule 1)` |
| `asamīcīnā, ṣaṣṭhagaṇo na jaḥ/khaḥ` | `The 6th gaṇa must be ja or kha in this meter (Hahn jāti special rule 2)` |
| `asamīcīnā, ṣaṣṭhagaṇo na laḥ` | `The 6th gaṇa must be la in this meter (Hahn jāti special rule 2)` |

## Jāti — incorrect quarter split

| `imperfect_label_sanskrit` | `imperfect_label_english` |
|---------------------------|--------------------------|
| `adhikākṣarā` | `pāda split doesn't match expected pattern [a,b,c,d]` (e.g. `[12,18,12,15]`) |
| `ūnākṣarā` | `pāda split doesn't match expected pattern [a,b,c,d]` (e.g. `[12,18,12,15]`) |
