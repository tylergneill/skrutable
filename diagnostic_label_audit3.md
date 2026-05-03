# Diagnostic label audit

## Anuṣṭubh — length error

Triggers when exactly one pāda in a half is not 8 syllables. Keyed by `'odd'` or `'even'`. If both pādas in the half are wrong, the result is `None` (bad split, not reported).

| `imperfect_label_sanskrit` | `imperfect_label_english` |
|---------------------------|--------------------------|
| `adhikākṣarā` | `hypermetric` |
| `ūnākṣarā` | `hypometric` |

## Anuṣṭubh — pattern violations (even pāda)

Triggers when the even pāda fails its general pattern. Keyed by `'even'`. Checked in this order: known asamīcīna patterns, then fallback (see below).

| `imperfect_label_sanskrit` | `imperfect_label_english` |
|------------------------------------------------------|--------------------------|
| `asamīcīnā, na prathamāt snau` | `Syllables 2–3 in any pāda cannot both be light (Piṅgala; Hahn 2014 anuṣṭubh general rule 2)` |
| `asamīcīnā, [na ca prathamāt] dvitīyacaturthayo raḥ` | `Syllables 2–3 in even pāda cannot be ra-gaṇa (Piṅgala; Hahn 2014 anuṣṭubh general rule 3)` |

## Anuṣṭubh — pattern violations (odd pāda)

Triggers when the even pāda passes but the odd pāda matches no pathyā or vipulā pattern. Keyed by `'odd'`. Checked in this order: known asamīcīna patterns, then fallback (see below).

| `imperfect_label_sanskrit`                  | `imperfect_label_english` |
|---------------------------------------------|--------------------------|
| `asamīcīnā, na prathamāt snau`              | `Syllables 2–3 in any pāda cannot both be light (Piṅgala; Hahn 2014 anuṣṭubh general rule 2)` |
| `asamīcīnā, ma-vipulāyāḥ pūrvam raḥ syāt`   | `ma-vipulā must be preceded by ra-gaṇa (Hahn 2014 anuṣṭubh vipulā rule 3)` |
| `asamīcīnā, bha-vipulāyāḥ pūrvam raḥ syāt`  | `bha-vipulā must be preceded by ra-gaṇa (Hahn 2014 anuṣṭubh vipulā rule 2)` |
| `asamīcīnā, na-vipulāyāḥ pūrvam guruḥ syāt` | `na-vipulā must be preceded by heavy syllable (Hahn 2014 anuṣṭubh vipulā rule 1)` |
| `asamīcīnā, ra-vipulāyāḥ pūrvam guruḥ syāt` | `ra-vipulā must be preceded by heavy syllable (Hahn 2014 anuṣṭubh vipulā rule 4)` |

Note: `bha-vipulā (ma-gaṇa-pūrvikā!)` is a recognized **perfect** sub-variant (not in the asamīcīna table), so it carries no imperfect labels.

## Anuṣṭubh — fallback (no pattern matched)

Applies when no known asamīcīna pattern matches. One of these two is always the label of last resort for a half that passes the length check.

| `imperfect_label_sanskrit` | `imperfect_label_english` |
|--------------------------------------------------------------------|--------------------------|
| `asamīcīnā, [caturthāt ...] yujo j` | `Syllables 5–7 in even pāda must be ja-gaṇa (Piṅgala; Hahn 2014 anuṣṭubh general rule 4)` |
| `asamīcīnā, [vipulāyām asatyām] ya[gaṇaḥ ayujaḥ] caturthāt [syāt]` | `Syllables 5–7 in odd pāda must be ya-gaṇa when no vipulā applies (Piṅgala; Hahn 2014 anuṣṭubh pathyā)` |

## Samavṛtta — per-pāda errors

Keyed by pāda number (1–4). Length errors and pattern errors can co-occur across pādas. `meter_label` appends `(? N eva pādāḥ yuktāḥ)` when fewer than 4 pādas match.

| `imperfect_label_sanskrit` | `imperfect_label_english` |
|---------------------------|--------------------------|
| `adhikākṣarā` | `hypermetric` |
| `ūnākṣarā` | `hypometric` |
| `vikṛtavṛtta` | `does not match expected gaṇa pattern {XYZ}` (e.g. `does not match expected gaṇa pattern ttjg`) |

## Upajāti — excluded pādas

Keyed by pāda number (1–4). Pādas of non-majority length are excluded from identification and flagged here. `meter_label` appends `(? N eva pādāḥ yuktāḥ)` when fewer than 4 pādas are included.

| `imperfect_label_sanskrit` | `imperfect_label_english` |
|---------------------------|--------------------------|
| `adhikākṣarā` | `hypermetric` |
| `ūnākṣarā` | `hypometric` |

## Ardhasamavṛtta — per-pāda errors

*Placeholder — not yet implemented. Currently only perfect identification is supported.*

## Viṣamavṛtta — per-pāda errors

*Placeholder — not yet implemented. Currently only perfect identification is supported.*

## Jāti — ardha morae off by 1 ("close" guess)

Triggers when ardha morae fail the exact gate but are within 1 of expected on both ardhas (after adjusting for anceps: a light final credits +1 only when the ardha is hypometric; a light final neither hurts nor helps a hypermetric ardha). `meter_label` appends `(adhikamātrā)` or `(ūnamātrā)` when both ardhas err in the same direction, or `(ardha 1: X; ardha 2: Y)` when they differ. The diagnostic label is attached to the ardha-final (even) pāda.

| `imperfect_label_sanskrit` | `imperfect_label_english` |
|---------------------------|--------------------------|
| `adhikamātrā` | `ardha mora count off from expected N` |
| `ūnamātrā` | `ardha mora count off from expected N` |

## Jāti — gaṇa-rule violations

Triggers when ardha morae pass but gaṇa structure is invalid. `meter_label` appends `(<pada#>: <error>)`, or `(<pada#>: <err1>; <pada#>: <err2>)` if both ardhas fail.

| `imperfect_label_sanskrit` | `imperfect_label_english` |
|---------------------------|--------------------------|
| `asamīcīnā, gaṇasaṃkhyā na aṣṭau` | `Ardha does not contain exactly 8 mātrā-gaṇas (Hahn general, definition)` |
| `asamīcīnā, <ordinal>gaṇaḥ na caturmātraḥ` | `Gaṇa <N> does not have exactly 4 morae (Hahn general, definition)` |
| `asamīcīnā, jaḥ ayuggaṇe` | `Odd gaṇa positions (1, 3, 5, 7) must never be ja-gaṇa (Hahn general rule 1)` |
| `asamīcīnā, ṣaṣṭhagaṇaḥ na jaḥ/khaḥ` | `The 6th gaṇa must be ja or kha in this meter (Hahn general rule 2)*` |
| `asamīcīnā, ṣaṣṭhagaṇaḥ na laḥ` | `The 6th gaṇa must be a single laghu in this meter (Hahn special rule 2)` |
| `asamīcīnā, aṣṭamagaṇaḥ na ekākṣaraḥ` | `The last gaṇa of both ardhas must be a single anceps syllable (Hahn general, 8th gaṇa)*` |
| `asamīcīnā, aṣṭamagaṇaḥ na caturmātraḥ (akha)` | `The last gaṇa of both ardhas must be 4 moras long and not kha-gaṇa in āryāgīti (Hahn special rule 4)*` |

`*` = Hahn's rule as stated requires correction; Skrutable applies the corrected interpretation.

## Jāti — incorrect quarter split (pāda-level morae wrong despite ardha morae correct)

Triggers when ardha morae pass and gaṇa rules pass, but per-pāda morae don't match. `meter_label` appends `(asamīcīnā, adhikamātrā)` or `(asamīcīnā, ūnamātrā)` when all offending pādas err in the same direction, or `(asamīcīnā, pāda N: X; pāda M: Y)` when they differ.

| `imperfect_label_sanskrit` | `imperfect_label_english` |
|---------------------------|--------------------------|
| `adhikamātrā` | `pāda mora count doesn't match expected pattern [a,b,c,d]` (e.g. `pāda mora count doesn't match expected pattern [12, 18, 12, 15]`) |
| `ūnamātrā` | `pāda mora count doesn't match expected pattern [a,b,c,d]` (e.g. `pāda mora count doesn't match expected pattern [12, 18, 12, 15]`) |

## Jāti — not yet covered

- **Mātrāsamaka**: not implemented anywhere (commented out of both `jAtis_by_ardha_morae` and `meter_melodies` in `meter_patterns.py`).