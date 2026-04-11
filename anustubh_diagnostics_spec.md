# anuṣṭubh Diagnostics — Backend Enhancement Spec

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

## What the backend should return instead

Rather than `None`, a failed half should return a structured object (or at minimum a dict) describing *which rule failed* and *which syllable positions are implicated*. The front end needs this to highlight safely — false-positive highlights are worse than no highlights.

### Failure taxonomy

There are four distinct categories of asamīcīna failure:

#### 1. Even-pāda rule violation (Piṅgala's rules)

The even pāda regex is `^(?!.ll.|.glg).{4}lgl.$`, encoding:
- **Piṅgala rule 1**: syllables 2–3 must not both be light (`(?!.ll.)`) → positions 1–2 (0-indexed)
- **Piṅgala rule 2**: syllables 2–4 must not be ra-gaṇa / glg (`(?!.glg)`) → positions 1–3
- **Piṅgala rule 3**: syllables 5–7 must be ja-gaṇa / lgl (`lgl` at positions 4–6)

When the even pāda fails, the backend should identify *which* sub-rule(s) failed and return the implicated positions:

| Sub-rule | Implicated positions (0-indexed) |
|----------|----------------------------------|
| syllables 2–3 both light | 1, 2 |
| syllables 2–4 are ra-gaṇa (glg) | 1, 2, 3 |
| syllables 5–7 not ja-gaṇa (lgl) | 4, 5, 6 |
| syllable count ≠ 8 | whole pāda |

#### 2. Odd-pāda rule violation (Piṅgala / Hahn rules)

The odd pāda passes if it matches any of the known patterns (pathyā, ma/bha/na/ra-vipulā). When all patterns fail, the backend should check which sub-rules are violated:

- **Piṅgala rule**: syllables 2–3 not both light (`(?!.ll.)`) → positions 1, 2
- **Pathyā core**: positions 4–7 must be `lgg.` — if not, positions 4–7 implicated
- **Vipulā rules** (Hahn): each vipulā has a distinct signature at positions 1–7; if the pattern almost matches one, the diverging position(s) can be noted — but this is optional/aspirational

When none of the patterns match and no specific sub-rule violation is identifiable, return the whole odd pāda as implicated (positions 0–7).

#### 3. Syllable count mismatch

If either pāda has ≠ 8 syllables, no positional comparison is meaningful. Return a count-mismatch signal with the actual count, implicating the whole pāda.

#### 4. Both halves failing (`test_as_anuzwuB` currently bails out)

Currently `test_as_anuzwuB` cannot handle both halves imperfect and returns 0 (not anuṣṭubh at all). If both halves fail but each has 8 syllables per pāda, it may still be worth returning a partial result with diagnostics for both halves. This is lower priority.

## Proposed return structure

Replace the `str | None` return type of `test_as_anuzwuB_half` with a dataclass or named tuple:

```python
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class AnuzwuBHalfResult:
    label: Optional[str]          # 'pathyā', 'ma-vipulā', etc., or None if imperfect
    is_asamicina: bool             # True when label is None
    failure_reason: Optional[str]  # 'even_pingala_1', 'even_pingala_2',
                                   # 'even_jagana', 'odd_pingala', 'odd_pattern',
                                   # 'syllable_count', or None if perfect
    odd_implicated: list[int]      # 0-indexed positions in odd pāda (may be empty)
    even_implicated: list[int]     # 0-indexed positions in even pāda (may be empty)
    odd_count: int                 # actual syllable count of odd pāda
    even_count: int                # actual syllable count of even pāda
```

The `Verse` object (or a new `AnuzwuBDiagnostics` attribute on it) should carry this information through to whatever is returned by `do_identify_meter()` in `flask_app.py` and included in the JSON payload for the new batch results page.

## Priority and sequencing note

This backend enhancement is a prerequisite for safe syllable-level highlighting of anuṣṭubh errors in the new batch correction mode front end. The samavṛtta case is simpler (positional diff against expected pattern is already feasible from existing data) and does not block front-end work. The anuṣṭubh diagnostic work described here should be completed first before implementing anuṣṭubh highlighting in the UI.

## References

- `skrutable/src/skrutable/meter_patterns.py` lines 24–48: anuṣṭubh rules and regex patterns
- `skrutable/src/skrutable/meter_identification.py` lines 54–129: `test_as_anuzwuB_half` and `test_as_anuzwuB`
- Sources cited in `meter_patterns.py`: Apte (1890), Hahn (2014), Murthy (2003)
