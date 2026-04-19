# anuṣṭubh Identification & Diagnostics — Backend Enhancement Spec

## Status

**Implemented and tested** (branch `improve-imperfect-anustubh-detection`):
- `Diagnostic` dataclass with `perfect()`, `imperfect()`, `length_error()` predicates
- Full failure-code taxonomy wired in `test_as_anuzwuB_half`
- All imperfect/length_error combinations handled in `test_as_anuzwuB`
- `Vrs.diagnostic` attached to every anuṣṭubh identification
- 39 passing tests including 4 new length_error cases

**Not yet implemented** (blocking merge/deploy):
- Detection of a hypo/hypermetric half as anuṣṭubh from scratch (see below)

---

## Background

`test_as_anuzwuB_half()` tests an odd+even pāda pair and returns a `Diagnostic` dataclass. `test_as_anuzwuB()` combines two half-results into a full identification with label and score. Results are stored on `Vrs.diagnostic` for use by the front end (syllable-level highlighting).

---

## `Diagnostic` dataclass

```python
@dataclass
class Diagnostic:
    perfect_id_label: Optional[str] = None     # 'pathyā', 'ma-vipulā', etc.; None if not perfect
    imperfect_id_label: Optional[str] = None   # Piṅgala-style label; None if not imperfect
    failure_code: Optional[str] = None          # short internal code; None if perfect
    problem_syllables: dict = field(default_factory=lambda: {'odd': [], 'even': []})

    def perfect(self): return self.perfect_id_label is not None
    def imperfect(self): return self.imperfect_id_label is not None
    def length_error(self): return self.failure_code in ('hypermetric', 'hypometric')
```

`perfect()`, `imperfect()`, and `length_error()` are mutually exclusive.

---

## Failure code taxonomy

### Length errors (checked first, before any regex)

Both pādas are length-checked before any regex runs. If either is not exactly 8 syllables:

| `failure_code` | Condition | `problem_syllables` |
|---|---|---|
| `'hypermetric'` | pāda has > 8 syllables | all positions in that pāda |
| `'hypometric'` | pāda has < 8 syllables | all positions in that pāda |

Even pāda is checked first; if it passes, odd pāda is checked. A `length_error()` Diagnostic has no `imperfect_id_label` — it is not `imperfect()`.

### Even pāda rule failures

| `failure_code` | Rule | `imperfect_id_label` | Positions |
|---|---|---|---|
| `'hahn_general_2'` | syllables 2–3 both light | `'asamīcīnā, na prathamāt snau'` | `[1, 2]` |
| `'hahn_general_3'` | syllables 2–4 are ra-gaṇa (glg) | `'asamīcīnā, [na] dvitīyacaturthayo raḥ'` | `[1, 2, 3]` |
| `'hahn_general_4'` | syllables 5–7 not ja-gaṇa (lgl) | `'[caturthāt] pathyā yujo j'` | `[4, 5, 6]` |

### Odd pāda rule failures

| `failure_code` | `imperfect_id_label` | Positions |
|---|---|---|
| `'hahn_general_2'` | `'asamīcīnā, na prathamāt snau'` | `[1, 2]` |
| `'hahn_vipulA_3'` | `'asamīcīnā, ma-vipulāyāḥ paścād raḥ syāt'` | `[1, 2, 3]` |
| `'hahn_vipulA_2'` | `'asamīcīnā, bha-vipulāyāḥ paścād raḥ syāt'` | `[1, 2, 3]` |
| `'hahn_vipulA_1'` | `'asamīcīnā, na-vipulāyāḥ paścād guruḥ syāt'` | `[3]` |
| `'hahn_vipulA_4'` | `'asamīcīnā, ra-vipulāyāḥ paścād guruḥ syāt'` | `[3]` |
| `'hahn_paTyA'` | `'[vipulāyām asatyām] ya[gaṇaḥ] [ayujo] caturthāt [syāt]'` | `[0..7]` |

---

## Identification branches in `test_as_anuzwuB`

| ab result | cd result | score | label pattern |
|---|---|---|---|
| perfect | perfect | 9 | `anuṣṭubh (1,2: <perfect>; 3,4: <perfect>)` |
| imperfect | perfect | 7 | `anuṣṭubh (1,2: <imperfect>; 3,4: <perfect>)` |
| perfect | imperfect | 7 | `anuṣṭubh (1,2: <perfect>; 3,4: <imperfect>)` |
| length_error | perfect | 6 | `anuṣṭubh (1,2: ?? <code>; 3,4: <perfect>)` |
| perfect | length_error | 6 | `anuṣṭubh (1,2: <perfect>; 3,4: ?? <code>)` |
| imperfect | imperfect | 5 | `anuṣṭubh (1,2: <imperfect>; 3,4: <imperfect>)` ¹ |
| length_error | imperfect | 4 | `anuṣṭubh (1,2: ?? <code>; 3,4: <imperfect>)` |
| imperfect | length_error | 4 | `anuṣṭubh (1,2: <imperfect>; 3,4: ?? <code>)` |
| length_error | length_error | — | suppressed (return None) |
| ardham eva perfect | — | 9 | `anuṣṭubh (ardham eva: <perfect>)` |
| ardham eva imperfect | — | 5 | `anuṣṭubh (ardham eva: <imperfect>)` |
| ardham eva length_error | — | — | suppressed (return None) |

¹ Gated: at least 2 of 4 pādas exactly 8 syllables, all within 6–10. Prevents false positives from ardham eva duplicated-pāda inputs.

---

## Storage on `Verse`

`Vrs.diagnostic` is set on every anuṣṭubh identification:
- Single `Diagnostic` for ardham eva cases
- `{'ab': Diagnostic, 'cd': Diagnostic}` for full four-pāda cases

`Vrs.diagnostic` is `None` for non-anuṣṭubh identifications.

---

## Next: hypo/hypermetric half detection

### The problem

Currently a half verse with a wrong-length pāda is identified as `length_error` only when the *other* half is already perfect or imperfect — i.e., it borrows context from its partner. A verse where *both* halves have wrong-length pādas, or a lone two-pāda input where the single half has wrong length, gets suppressed entirely (`return None`).

This means genuinely anuṣṭubh-like verses with one extra or missing syllable somewhere are not identified as anuṣṭubh at all, which is the wrong outcome.

### Why it's hard

The current approach matches 8-character weight strings against fixed regexes. A 9-syllable pāda has 9 characters — no existing regex matches it. Correct identification requires knowing *which* syllable is extra (or missing) and whether the remainder is anuṣṭubh-valid. This is a fuzzy/edit-distance problem.

The ambuda/vidyut-chanda system fails here for the same structural reason: it's also a fixed-pattern matcher with no edit-distance capability.

### Proposed approach (deferred)

Implement as a **late-cascade check** inside `test_as_anuzwuB`, after all exact-match branches have been tried and returned None. For each wrong-length pāda (6–10 syllables), try deleting or inserting one syllable at each position and test the resulting 8-character string against the normal even/odd patterns. If any deletion/insertion produces a valid or imperfect match, record that as a length_error with the implicated position identified.

This must be gated tightly to avoid false positives:
- Only attempt when syllable count is 6–10 (no wilder lengths)
- Only fire after samavṛtta and jāti have already had their chance
- Score must be low enough (≤ 4) that any exact samavṛtta or jāti match beats it

This is the primary remaining blocker before merging this branch.

---

## References

- `src/skrutable/meter_patterns.py` lines 24–48: anuṣṭubh rules and regex patterns
- `src/skrutable/meter_identification.py`: `Diagnostic` dataclass, `test_as_anuzwuB_half`, `test_as_anuzwuB`
- Sources cited in `meter_patterns.py`: Apte (1890), Hahn (2014), Murthy (2003)
- `skrutable_front_end/batch_correction_mode_spec.md`: front-end highlighting strategy
