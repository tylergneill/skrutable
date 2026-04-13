# anuṣṭubh Identification & Diagnostics — Backend Enhancement Spec

## Background

`MeterIdentifier.test_as_anuzwuB_half()` in `meter_identification.py` tests an odd+even pāda pair and returns either a label string (pathyā, ma-vipulā, etc.) or `None`. When it returns `None`, the caller labels the half-verse "asamīcīna" — but passes no information about *why* the half failed.

The front end currently receives only the string `"asamīcīna"`. It cannot know whether to highlight syllables, and if so, which ones. This spec describes what the backend should return so the front end can display targeted, accurate highlighting.

## Current code path (simplified)

```python
# meter_identification.py
def test_as_anuzwuB_half(self, odd_pAda_weights, even_pAda_weights):
    # check even pāda
    if not re.match(meter_patterns.anuzwuB_pAda['even'], even_pAda_weights):
        return None                          # ← silent failure
    # check odd pāda
    for pattern, label in meter_patterns.anuzwuB_pAda['odd'].items():
        if re.match(pattern, odd_pAda_weights):
            return label                     # ← success: pathyā / vipulā name
    return None                              # ← silent failure
```

When `None` is returned, `test_as_anuzwuB` labels the half "asamīcīna" with no further detail.

## When asamīcīna is produced

asamīcīna is only labeled when **one half of a full four-pāda verse fails while the other half succeeds**. The succeeding half provides the context that licenses calling the failing half anuṣṭubh-but-imperfect rather than simply not anuṣṭubh. Specifically:

- Lines 108–115 of `test_as_anuzwuB`: one of `pAdas_ab` / `pAdas_cd` is `None`, the other is not.
- The ardham eva path (line 121) only fires when the *concatenated* pādas pass as a single perfect half — an imperfect lone half gets `return 0` (not identified as anuṣṭubh at all).
- Both halves failing → `return 0` (comment at line 117: "currently cannot do both halves imperfect").

This means: **the even pāda is always checked first within `test_as_anuzwuB_half`, and if it fails, odd-pāda analysis never runs.** A failure is always attributed to whichever pāda actually failed within a half that was contextually confirmed as anuṣṭubh by its partner half.

## Hahn's four general rules (applying to both pathyā and vipulā)

From Hahn (2014):

1. Syllables 1 and 8 are *anceps* — any value accepted, not a failure mode.
2. Syllables 2–3 must not both be light — applies to **all four** pādas.
3. Syllables 2–4 must not be ra-gaṇa (glg) — applies to **even** pādas only.
4. Syllables 5–7 must be ja-gaṇa (lgl) — applies to **even** pādas only.

## What the backend should return instead

Every half-verse test returns a `Diagnostic` dataclass describing the result — perfect or imperfect. The front end needs this to highlight safely — false-positive highlights are worse than no highlights.

### `Diagnostic` dataclass

```python
@dataclass
class Diagnostic:
    perfect_id_label: Optional[str]    # 'pathyā', 'ma-vipulā', etc.; None if imperfect
    imperfect_id_label: Optional[str]  # human-readable Piṅgala-style label; None if perfect
    failure_code: Optional[str]        # short internal code (see taxonomy); None if perfect
    problem_syllables: dict            # {'odd': [ints], 'even': [ints]}, 0-indexed positions

    def perfect(self) -> bool: ...
    def imperfect(self) -> bool: ...
```

### Failure code taxonomy

#### Even pāda failures

| `failure_code` | Rule | `imperfect_id_label` | Implicated positions (even pāda) |
|---|---|---|---|
| `'hahn_general_2'` | syllables 2–3 both light | `'asamīcīnā, na prathamāt snau'` | `[1, 2]` |
| `'hahn_general_3'` | syllables 2–4 are ra-gaṇa (glg) | `'asamīcīnā, [na] dvitīyacaturthayo raḥ'` | `[1, 2, 3]` |
| `'hahn_general_4'` | syllables 5–7 not ja-gaṇa (lgl) | `'[caturthāt] pathyā yujo j'` | `[4, 5, 6]` |

Rules checked in order; first firing wins.

#### Odd pāda failures

| `failure_code` | `imperfect_id_label` | Implicated positions (odd pāda) |
|---|---|---|
| `'hahn_general_2'` | `'asamīcīnā, na prathamāt snau'` | `[1, 2]` |
| `'hahn_vipulA_3'` | `'asamīcīnā, ma-vipulāyāḥ paścād raḥ syāt'` | `[1, 2, 3]` |
| `'hahn_vipulA_2'` | `'asamīcīnā, bha-vipulāyāḥ paścād raḥ syāt'` | `[1, 2, 3]` |
| `'hahn_vipulA_1'` | `'asamīcīnā, na-vipulāyāḥ paścād guruḥ syāt'` | `[3]` |
| `'hahn_vipulA_4'` | `'asamīcīnā, ra-vipulāyāḥ paścād guruḥ syāt'` | `[3]` |
| `'hahn_paTyA'` | `'[vipulāyām asatyām] ya[gaṇaḥ] [ayujo] caturthāt [syāt]'` | `[0..7]` |

hahn_general_2 is checked first; vipulā conditioning checks follow; hahn_paTyA is the final catch-all.

### Storage on `Verse`

`Vrs.diagnostic` is set on every anuṣṭubh identification:
- Single `Diagnostic` for ardham eva cases
- `{'ab': Diagnostic, 'cd': Diagnostic}` for full four-pāda cases

`Vrs.diagnostic` is `None` for non-anuṣṭubh identifications. This is a non-breaking addition.

## Extended identification goal

Currently `test_as_anuzwuB` only labels a half as asamīcīna when the *other* half of the same verse succeeds. This is not a principled exclusion — it is an incremental implementation that stopped short. The comments at lines 117 and 127 ("currently cannot do both halves imperfect", "currently cannot do just a single imperfect half") are TODOs, not design decisions.

There is no theoretical reason why a lone imperfect half, or a verse where both halves are imperfect, cannot be identified as anuṣṭubh-with-asamīcīna. The even pāda check and odd pāda pattern loop are sufficient to produce diagnostics regardless of what the other half does. The "context" of a passing partner half was simply the conservative path taken to avoid false positives.

### New goal

Extend `test_as_anuzwuB` to handle:

1. **Both halves imperfect, full verse**: label as `"anuṣṭubh (1,2: asamīcīna, 3,4: asamīcīna)"`, lower identification score. Store diagnostics for both halves.
2. **Lone imperfect half (ardham eva)**: if the ardham eva path is reached and the single half fails, label as `"anuṣṭubh (ardham eva: asamīcīna)"` rather than returning 0. Store diagnostics.

New score entries will be needed in the scoring system for these cases. The existing entries (`anuṣṭubh, full, both halves perfect)`, `anuṣṭubh, full, one half perfect, one imperfect)`, `anuṣṭubh, half, single half perfect)`) are the reference for calibrating the new ones.

`Vrs.failure_diagnostic` in the both-halves-imperfect case should store diagnostics for both halves, e.g. `{'ab': HalfVerseResult, 'cd': HalfVerseResult}`. In the single-half case a single `HalfVerseResult` suffices.

## Implementation notes (from design session)

- `wiggle_identify` always normalizes input to 4 pādas before `attempt_identification` is called. There is no separate 2-pāda input path. The ardham eva path inside `test_as_anuzwuB` concatenates pādas 1+2 and 3+4 into 16-char strings and re-runs `test_as_anuzwuB_half`. The "ardham eva: asamīcīna" case is simply: that concatenated test also returns `None`. No special input handling is needed.

- The "both halves imperfect" identification must be gated on syllable counts being plausibly anuṣṭubh. Proposed gate: at least 2 of 4 pādas exactly 8 syllables, and all pādas within ±2 (6–10 syllables). This mirrors the samavṛtta approach of using plurality (pādasamatva count ≥ 2) rather than requiring all pādas to match.

- Imperfect identification (both halves imperfect, ardham eva imperfect) must score low enough that correct samavṛtta or jāti beats it. Score 5 proposed for both new cases.

- Hypo/hypermetric pāda detection (pādas of 6, 7, 9, or 10 syllables that are "close" to valid anuṣṭubh) requires fuzzy/edit-distance matching. This is genuinely hard — no existing Sanskrit library handles it cleanly. It is deferred and should be implemented as a late-cascade check (after samavṛtta and jāti have already had their chance) to avoid slowing down the common case.

- The imperfect identification introduced here (without diagnostics) is a prerequisite for the `HalfVerseResult` diagnostic work. Do not implement `HalfVerseResult` until the identification logic is stable.

## Priority and sequencing note

This backend enhancement is a prerequisite for safe syllable-level highlighting of anuṣṭubh errors in the new batch correction mode front end. The samavṛtta case is simpler (positional diff against expected pattern is already feasible from existing data) and does not block front-end work. The anuṣṭubh diagnostic work described here should be completed first before implementing anuṣṭubh highlighting in the UI.

## References

- `skrutable/src/skrutable/meter_patterns.py` lines 24–48: anuṣṭubh rules and regex patterns
- `skrutable/src/skrutable/meter_identification.py` lines 54–129: `test_as_anuzwuB_half` and `test_as_anuzwuB`
- Sources cited in `meter_patterns.py`: Apte (1890), Hahn (2014), Murthy (2003)
- `skrutable_front_end/batch_correction_mode_spec.md`: front-end highlighting strategy
