# Frontend changes required: Diagnostic field rename/restructure

## What changed in the backend API

The `Diagnostic` dataclass returned by meter identification has been restructured. Two fields were renamed and their responsibilities clarified:

| Old field | New field | Content |
|-----------|-----------|---------|
| `imperfect_id_label` | `imperfect_label_sanskrit` | Sanskrit-only labels |
| `failure_code` | `imperfect_label_english` | English-only labels |

Both fields are now populated in **every imperfect case**, enabling a Sanskrit/English toggle. Both remain dicts keyed by pāda number (1–4) or `'odd'`/`'even'` for anuṣṭubh halves. Both are `None` on perfect identification.

## Complete label inventory

### Anuṣṭubh — length errors

| `imperfect_label_sanskrit` | `imperfect_label_english` |
|---------------------------|--------------------------|
| `adhikākṣarā` | `hypermetric` |
| `ūnākṣarā` | `hypometric` |

### Anuṣṭubh — pattern violations (from `meter_patterns.anuzwuB_pAda_asamIcIna`)

| `imperfect_label_sanskrit` | `imperfect_label_english` |
|---------------------------|--------------------------|
| `asamīcīnā, na prathamāt snau` | `Syllables 2–3 in odd pāda cannot both be light (Piṅgala; Hahn anuṣṭubh general rule 2)` |
| `asamīcīnā, na prathamāt snau` | `Syllables 2–3 in even pāda cannot both be light (Piṅgala; Hahn anuṣṭubh general rule 2)` |
| `asamīcīnā, [na] dvitīyacaturthayo raḥ` | `Syllables 2–4 in even pāda cannot be ra-gaṇa (Piṅgala; Hahn anuṣṭubh general rule 3)` |
| `asamīcīnā, ma-vipulāyāḥ paścād raḥ syāt` | `Syllables 5–7 in odd pāda must end in ra after ma-vipulā (Hahn anuṣṭubh vipulā rule 3)` |
| `asamīcīnā, bha-vipulāyāḥ paścād raḥ syāt` | `Syllables 5–7 in odd pāda must end in ra after bha-vipulā (Hahn anuṣṭubh vipulā rule 2)` |
| `asamīcīnā, na-vipulāyāḥ paścād guruḥ syāt` | `Syllable 4 in odd pāda must be heavy after na-vipulā (Hahn anuṣṭubh vipulā rule 1)` |
| `asamīcīnā, ra-vipulāyāḥ paścād guruḥ syāt` | `Syllable 4 in odd pāda must be heavy after ra-vipulā (Hahn anuṣṭubh vipulā rule 4)` |

### Anuṣṭubh — fallback (no specific pattern matched)

| `imperfect_label_sanskrit` | `imperfect_label_english` |
|---------------------------|--------------------------|
| `asamīcīnā, [caturthāt] pathyā yujo j` | `Syllables 5–7 in even pāda must match pathyā (Piṅgala; Hahn anuṣṭubh general rule 4)` |
| `asamīcīnā, [vipulāyām asatyām] ya[gaṇaḥ ayujaḥ] caturthāt [syāt]` | `Syllables 5–7 in odd pāda must match pathyā when no vipulā applies (Piṅgala; Hahn anuṣṭubh pathyā)` |

### Samavṛtta — per-pāda errors

| `imperfect_label_sanskrit` | `imperfect_label_english` |
|---------------------------|--------------------------|
| `adhikākṣarā` | `hypermetric` |
| `ūnākṣarā` | `hypometric` |
| `vikṛtavṛtta` | `does not match expected gaṇa pattern {XYZ}` where XYZ is the canonical gaṇa abbreviation string (e.g. `ttjg`) drawn from `meter_patterns.py` at identification time |

### Upajāti — excluded pādas

| `imperfect_label_sanskrit` | `imperfect_label_english` |
|---------------------------|--------------------------|
| `adhikākṣarā` | `hypermetric` |
| `ūnākṣarā` | `hypometric` |

### Jāti (Hahn) — gaṇa-rule violations

| `imperfect_label_sanskrit` | `imperfect_label_english` |
|---------------------------|--------------------------|
| `asamīcīnā, gaṇasaṃkhyā na aṣṭau` | `Ardha does not contain exactly 8 mātrā-gaṇas (Hahn jāti)` |
| `asamīcīnā, jaḥ ayuggaṇe` | `No j-gaṇa permitted in odd gaṇa position (Hahn jāti general rule 1)` |
| `asamīcīnā, ṣaṣṭhagaṇo na jaḥ/khaḥ` | `The 6th gaṇa must be ja or kha in this meter (Hahn jāti special rule 2)` |
| `asamīcīnā, ṣaṣṭhagaṇo na laḥ` | `The 6th gaṇa must be la in this meter (Hahn jāti special rule 2)` |

Note: "special rule 2" covers both the ja/kha and la cases — they are the same rule applied to different meters. The Hahn rule numbering in the parentheticals should be verified against the screenshot reference once available.

### Jāti — incorrect quarter split

| `imperfect_label_sanskrit` | `imperfect_label_english` |
|---------------------------|--------------------------|
| `adhikākṣarā` | `incorrect quarter split (hypermetric)` |
| `ūnākṣarā` | `incorrect quarter split (hypometric)` |

## Key semantic changes from previous version

### `imperfect_label_sanskrit` (was `imperfect_id_label`)
- Now populated in **every** imperfect case — length errors, pattern violations, and quarter-split errors all set it.
- Length errors use `adhikākṣarā` / `ūnākṣarā` uniformly across all meter types.
- Samavṛtta pattern violations changed: `asamīcīnā` → `vikṛtavṛtta`.
- Jāti odd-position ja-gaṇa rule generalized: was `asamīcīnā, jaḥ {prathama/tṛtīya/...}gaṇe` → now `asamīcīnā, jaḥ ayuggaṇe` (covers all odd positions without enumerating).
- The **`{0: "... pādāḥ yuktāḥ"}` pattern is gone**. Partial-verse notes (e.g. `? 3 eva pādāḥ yuktāḥ`) are only in `meter_label`, not in `imperfect_label_sanskrit`. Parse `meter_label` for card header display.
- `asamīcīnaṃ` (neuter) corrected to `asamīcīnā` (feminine) throughout.
- The pathyā fallback Sanskrit label: `ya[gaṇaḥ] [ayujo]` → `ya[gaṇaḥ ayujaḥ]`.

### `imperfect_label_english` (was `failure_code`)
- All values are now human-readable strings, not internal slugs.
- Anuṣṭubh pattern violations: full sentences with source attribution, e.g. `Syllables 2–3 in odd pāda cannot both be light (Piṅgala; Hahn anuṣṭubh general rule 2)`.
- Jāti gaṇa violations: full sentences with Hahn rule references.
- Samavṛtta pattern violations: `pādasamatva violation` → `does not match expected gaṇa pattern {XYZ}` (includes the actual canonical pattern string).
- `hypermetric` / `hypometric` remain short terms (not prose sentences); in jāti quarter-split these are wrapped: `incorrect quarter split (hypermetric)`.

### `imperfect()` and `length_error()` method semantics
- `length_error()` returns True when `imperfect_label_english` contains `hypermetric` or `hypometric` as a value.
- `imperfect()` returns True when `imperfect_label_sanskrit` is set **and** it is not a length error — i.e., a named rule violation. These two states are mutually exclusive.

## What the frontend should update

1. **Any reads of `.failure_code` or `diagnostic["failure_code"]`** → rename to `imperfect_label_english`.

2. **Any reads of `.imperfect_id_label` or `diagnostic["imperfect_id_label"]`** → rename to `imperfect_label_sanskrit`.

3. **Any logic checking for key `0` in `imperfect_id_label`**: remove it; use `meter_label` for partial-verse display.

4. **Display logic for `pādasamatva violation`**: now in `imperfect_label_english` as `does not match expected gaṇa pattern {XYZ}`; corresponding `imperfect_label_sanskrit` is `vikṛtavṛtta`.

5. **Sanskrit/English toggle**: both fields are now populated for all imperfect cases across all meter types. The toggle is fully symmetric — no special-casing needed for any meter type.
