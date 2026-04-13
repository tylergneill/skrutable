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

Rather than `None`, a failed half should return a `HalfVerseResult` dataclass describing *which rule failed* and *which syllable positions are implicated*. The front end needs this to highlight safely — false-positive highlights are worse than no highlights.

### `HalfVerseResult` dataclass

```python
@dataclass
class HalfVerseResult:
    label: Optional[str]           # 'pathyā', 'ma-vipulā', etc., or None if imperfect
    failure_reason: Optional[str]  # see taxonomy below; None if perfect
    problem_syllables: dict        # {'odd': [ints], 'even': [ints]}, 0-indexed positions
                                   # both lists empty if perfect
```

### Failure reason taxonomy

#### Even pāda failures (checked sequentially after the combined regex fails)

| `failure_reason` | Rule                                      | Implicated positions (0-indexed, even pāda) |
|---|-------------------------------------------|---|
| `'hahn_2'` | any pāda's syllables 2–3 both light  | `[1, 2]` |
| `'hahn_3'` | even pāda syllables 2–4 are ra-gaṇa (glg) | `[1, 2, 3]` |
| `'hahn_4'` | even pāda syllables 5–7 not ja-gaṇa (lgl) | `[4, 5, 6]` |
| `'hypermetric'` | even pāda has > 8 syllables               | all positions |
| `'hypometric'` | even pāda has < 8 syllables               | all positions |

Rules 2, 3, 4 are checked in order; the first firing wins. Count is checked first before any sub-rule.

#### Odd pāda failures (checked after even pāda passes and pattern loop exhausts)

The odd pāda loop tests each known pattern in full. If all fail, we then check whether any known characteristic tail (positions 4–7) is present but its conditioning (positions 1–3) is not:

| `failure_reason` | Characteristic tail at 4–7 | Conditioning violated | Implicated positions (odd pāda) |
|---|---|---|---|
| `'na_vipula'` | `lll.` | `(?!.ll)` at 1–2 | `[1, 2]` |
| `'ra_vipula'` | `glg.` | `(?!.ll)` at 1–2 | `[1, 2]` |
| `'ma_vipula'` | `ggg.` | position 1 not `g` | `[1]` |
| `'bha_vipula'` | `gll.` | position 1 not `g` | `[1]` |
| `'hahn_2'` | any / none | syllables 2–3 both light (no tail matched) | `[1, 2]` |
| `'hypermetric'` | — | odd pāda has > 8 syllables | all positions |
| `'hypometric'` | — | odd pāda has < 8 syllables | all positions |
| `'odd_unrecognized'` | none matched | no specific rule identified | `[0..7]` |

Characteristic tail checks are done first; `hahn_2` on the odd pāda is the fallback when no tail matches but rule 2 is clearly violated; `odd_unrecognized` is the final catch-all.

### Storage on `Verse`

The diagnostic result is stored as `Vrs.failure_diagnostic` (a `HalfVerseResult`, or `None` if no asamīcīna half). This is a non-breaking addition — existing code that doesn't read the attribute is unaffected.

`failure_diagnostic` is only set when asamīcīna is produced (one half fails, one succeeds). It is not set for perfect verses, for verses not identified as anuṣṭubh, or for the both-halves-failing case (which currently returns 0).

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
