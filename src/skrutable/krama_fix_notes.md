# kramasaṃyoga redesign: status and remaining work

## Branch
`poetic-license-bra-etc-2` off `main`

---

## Completed (committed)

### Infrastructure
- `Verse.get_word_initial_syllables()` in `scansion.py` — walks `text_SLP` words against `text_syllabified` syllables; handles consonant transport across word boundaries
- `KRAMA_LABEL_SKT` / `KRAMA_LABEL_ENG` constants in `meter_identification.py`
- `Diagnostic.notable_label` renamed to `notable_label_sanskrit` / `notable_label_english`
- `Diagnostic.krama_rescued()` — True when `perfect_id_label=None`, `imperfect_label_sanskrit=None`, `notable_syllables` is set (novel post-rescue state)
- `VerseTester.check_kramasaMyoga(Vrs, pada_num, pada_weights, expected_at_indices, bad_indices, line_num=None, syl_offset=0)` — core detection: g scanned where l expected, next syllable word-initial with pr/br/kr/hr/kṣ cluster. `line_num`/`syl_offset` kwargs handle anuṣṭubh's two-pāda-per-line layout.
- `VerseTester.set_problem_diagnostic(...)` — replaces bare `problem_syllables[p]=bad` for same-length pādas in samavṛtta; routes krama-explained ones to `krama_notable` dict instead
- 4 stale anuṣṭubh test expectations fixed (odd:/even: prefixes removed in PR #77 but tests not updated)

### Meter types wired
- **samavṛtta** — `set_problem_diagnostic` + `krama_notable` propagated through all three Diagnostic branches; score/label upgraded to perfect when krama brings samatva to 4
- **ardhasamavṛtta** — `tslp` added to stash tuple; krama rescue in both VerseTester inner imperfect pass and MeterIdentifier post-wiggle pass
- **viṣamavṛtta** — same pattern as ardhasamavṛtta
- **anuṣṭubh** — `_apply_krama_to_anuzwuB_half()` runs after the cached `test_as_anuzwuB_half()` call; filters hardcoded `problem_syllables=[4,5,6]` to positions actually wrong given real weights; `four_line` flag handles one-pāda-per-line vs two-pāda-per-line layouts; `test_as_anuzwuB` branch dispatch extended to treat `krama_rescued()` halves as perfect

### Tests
- `test_samavftta_kramasamyoga_diagnostic` — śārdūlavikrīḍita with hr-cluster rescue in pāda 1
- `test_ardhasamavftta_kramasamyoga_diagnostic` — puṣpitāgrā with pr-cluster rescue in pāda 2
- `test_anuzwuB_kramasamyoga_even_pada` — anuṣṭubh with br-cluster rescue in even pāda of ab ardha

---

## Remaining: upajāti and jāti

### upajāti (`evaluate_upajAti`)

Upajāti currently builds a diagnostic **only for excluded pādas** (wrong length). Same-length pādas that don't match any gaṇa pattern just fall to `ajñātam` — there is no `vikṛtavṛtta` diagnostic path for them. Krama rescue would be meaningful here (indravajrā/upendravajrā differ only in the first syllable of each pāda, easy to check), but **cannot be added until `evaluate_upajAti` gains a same-length wrong-pattern detection path first**. Leave for a follow-up; note that upajāti is missing `vikṛtavṛtta` diagnostics entirely.

### jāti (`test_as_jAti`)

Jāti **does** need krama wiring. When `err1`/`err2` fire, `_validate_jAti_gaNas` returns `(code, bad)` where `bad` is a list of syllable offsets within the ardha that break a gaṇa rule. A krama-eligible `g` at one of those offsets reduces that syllable's mora count from 2 to 1, which can fix the gaṇa (e.g. a 5-mora gaṇa becomes 4, satisfying `general_0_gana`; or a ja-gaṇa rule is met). The ardha mora gate already passed (since g→l changes morae, the gate would also need rechecking, but the gate passed before gaṇa validation so krama rescue is only relevant in the `err` path, not the `close` path).

**Implementation sketch:**
1. After `err1`/`err2` are obtained and `bad` offsets are known, for each bad offset check `check_kramasaMyoga` (with the ardha-level `pada_num` and appropriate `line_num`/`syl_offset`).
2. If krama candidates cover all `bad` offsets, re-run `_decompose_into_mAtragaNas` and `_validate_jAti_gaNas` on a weight string with those positions flipped to `l`.
3. If re-validation passes, record the result as perfect (or reduced-error) with `notable_syllables` and `KRAMA_LABEL_SKT/ENG` on the Diagnostic, instead of recording `prob` as `problem_syllables`.

**Complication:** `bad` offsets are ardha-level (concatenated pāda 1+2 or 3+4), but `check_kramasaMyoga` takes a pāda-level `pada_num`. Need to split ardha offsets back to pāda-level before calling — the same `ardha_syls_to_padas` split already exists in the code. Also `check_kramasaMyoga` needs `Vrs.text_syllabified` to be consistent with the ardha weights; if this is a resplit candidate, ensure `Vrs` (or a copy) has the right `text_syllabified`/`text_SLP`.

---

## Key implementation facts (reference)

- `pada_num` indexes into `Vrs.text_syllabified.split('\n')` (0-based: `pada_num - 1`) for samavṛtta/ardha/viṣama (one pāda per line). For anuṣṭubh (two pādas per line): use `line_num=(pada_num-1)//2`, `syl_offset=0 or 8` — but only when `len(wbp) < 4`; when `len(wbp) >= 4` each line has one pāda and `line_num=pada_num-1, syl_offset=0`.
- `get_word_initial_syllables()` works on flat `text_SLP` + flat `text_syllabified`; safe for any line structure
- krama only rescues g scanned where l expected, never the reverse
- `expected` at a bad index for samavṛtta/ardha/viṣama: `{j: canonical[j] for j in bad_indices}`
- For anuṣṭubh even pāda (ja-gaṇa): hardcoded expected `{4:'l', 5:'g', 6:'l'}`, but filter to positions actually wrong before calling `check_kramasaMyoga`
- `_KRAMA_CLUSTERS = {'pr', 'br', 'kr', 'hr', 'kz'}` (SLP1: kṣ = kz)
- ardha/viṣama stash tuples now carry `tslp` (text_SLP) so `check_kramasaMyoga` has word-boundary data
- `krama_rescued()` Diagnostic state: `perfect_id_label=None`, `imperfect_label_sanskrit=None`, `notable_syllables` set — used only by anuṣṭubh branch dispatch
