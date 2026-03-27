// Sanskrit meter identification classes for metrical analysis
import { Scanner } from './scansion.js';
import { Verse } from './scansion.js';
import {
  anuzwuB_pAda, samavfttas_by_family_and_gaRa, choose_heavy_gaRa_pattern,
  ardhasamavftta_by_odd_even_regex_tuple, vizamavftta_by_4_tuple,
  jAtis_by_morae, samavftta_family_names
} from './meter_patterns.js';
import { config } from './config.js';

// Load config variables
const scansion_syllable_separator = config.scansion_syllable_separator; // e.g. " "
const default_resplit_option = config.default_resplit_option; // e.g. "none"
const default_resplit_keep_midpoint = config.default_resplit_keep_midpoint; // e.g. true
const disable_non_trizwuB_upajAti = config.disable_non_trizwuB_upajAti; // e.g. true
const meter_scores = config.meter_scores; // dict

export class VerseTester {
  /**
   * Internal agent-style object.
   * 
   * Most methods take a populated scansion.Verse object as an argument;
   * test_as_anuzwuB_half() is an exception.
   * 
   * Primary method attempt_identification returns scansion.Verse object
   * with populated meter_label attribute if identification was successful.
   */

  constructor() {
    this.pAdasamatva_count = 0; // int
    this.resplit_option = default_resplit_option; // string
    this.resplit_keep_midpoint = default_resplit_keep_midpoint; // bool
    this.identification_attempt_count = 0;
  }

  combine_results(Vrs, new_label, new_score) {
    const old_label = Vrs.meterLabel || '';
    const old_score = Vrs.identificationScore;

    // currently strict
    // another more lenient option would test: abs(new_score - old_score) <= 1

    if (new_score < old_score) {
      return;
    } else if (new_score > old_score) {
      // override previous
      Vrs.meterLabel = new_label;
      Vrs.identificationScore = new_score;
    } else if (new_score === old_score) {
      // tie, concatenate as old + new
      Vrs.meterLabel += " atha vā " + new_label;
      // do not change score
    }
  }

  test_as_anuzwuB_half(odd_pAda_weights, even_pAda_weights) {
    /**
     * Accepts two strings of syllable weights (e.g. 'llglgllg').
     * Tries to match to known odd-even 'anuṣṭup' foot pairings:
     *     pathya
     *     vipulā (4.5 subtypes: na, ra, ma, bha, and variant bha).
     * Returns string result if match found, null otherwise.
     */

    // check even pāda
    const evenRegex = new RegExp(anuzwuB_pAda['even']);
    if (!evenRegex.test(even_pAda_weights)) {
      return null;
    }

    // check odd pāda (both 'paTyA' and 'vipulA')
    for (const weights_pattern of Object.keys(anuzwuB_pAda['odd'])) {
      const regex = new RegExp(weights_pattern);
      if (regex.test(odd_pAda_weights)) {
        return anuzwuB_pAda['odd'][weights_pattern];
      }
    }

    return null;
  }

  test_as_anuzwuB(Vrs) {
    /**
     * Accepts Verse object.
     * Determines whether first four lines of Verse's syllable_weights is anuṣṭup.
     * Internally sets Verse parameters if identified as such.
     * Tests halves ab and cd independently, reports if either half found to be valid.
     * Returns 1 if anuṣṭup, or 0 if not.
     */

    const w_p = Vrs.syllableWeights.split('\n'); // weights by pāda

    // make sure full four pādas
    if (w_p.length < 4) return 0;

    // test each half
    const pAdas_ab = this.test_as_anuzwuB_half(w_p[0], w_p[1]);
    const pAdas_cd = this.test_as_anuzwuB_half(w_p[2], w_p[3]);

    // report results

    // both halves perfect
    if (pAdas_ab !== null && pAdas_cd !== null) {
      Vrs.meterLabel = `anuṣṭup (1,2: ${pAdas_ab}, 3,4: ${pAdas_cd})`;
      Vrs.identificationScore = meter_scores["anuṣṭup, full, both halves perfect"];
      return 1;
    }

    // one half imperfect
    else if (pAdas_ab === null && pAdas_cd !== null) {
      Vrs.meterLabel = `anuṣṭup (1,2: asamīcīna, 3,4: ${pAdas_cd})`;
      Vrs.identificationScore = meter_scores["anuṣṭup, full, one half perfect, one imperfect"];
      return 1;
    } else if (pAdas_ab !== null && pAdas_cd === null) {
      Vrs.meterLabel = `anuṣṭup (1,2: ${pAdas_ab}, 3,4: asamīcīna)`;
      Vrs.identificationScore = meter_scores["anuṣṭup, full, one half perfect, one imperfect"];
      return 1;
    }

    // currently cannot do both halves imperfect

    // also test whether just a single perfect half
    const pAdas_ab_combined = this.test_as_anuzwuB_half(w_p[0] + w_p[1], w_p[2] + w_p[3]);
    if (pAdas_ab_combined !== null) {
      Vrs.meterLabel = `anuṣṭup (ardham eva: ${pAdas_ab_combined})`;
      Vrs.identificationScore = meter_scores["anuṣṭup, half, single half perfect"];
      return 1;
    }

    // currently cannot do just a single imperfect half
    return 0;
  }

  count_pAdasamatva(Vrs) {
    /**
     * Accepts four-part (newline-separated) string of light/heavy (l/g) pattern.
     * Since testing for samavṛtta, ignores final anceps syllable in each part.
     * Returns integer 0,2,3,4 indicating size of best matching group.
     */

    this.pAdasamatva_count = 0;

    // prepare weights-by-pāda for samatva count: omit last anceps syllable
    let wbp = Vrs.syllableWeights.split('\n').map(true_wbp => true_wbp.slice(0, -1));

    // make sure full four pādas
    if (wbp.length < 4) return 0;

    // avoid false positive if completely empty string argument list
    if (wbp[0] === wbp[1] && wbp[1] === wbp[2] && wbp[2] === wbp[3] && wbp[3] === '') {
      return 0;
    }

    // discard any empty strings
    wbp = wbp.filter(item => item !== '');

    // calculate max number of matching pādas in verse
    const counts = wbp.map(item => wbp.filter(w => w === item).length);
    const max_match = Math.max(...counts);

    if ([2, 3, 4].includes(max_match)) { // exclude value of 1 (= no matches)
      this.pAdasamatva_count = max_match;
    }
  }

  evaluate_samavftta(Vrs) {
    // sufficient pAdasamatva already assured, now just evaluate

    const wbp = Vrs.syllableWeights.split('\n'); // weights by pāda

    // get index of most frequent pāda type
    const wbp_sans_final = wbp.map(w => w.slice(0, -1)); // omit final anceps from consideration
    const counts = {};
    wbp_sans_final.forEach(item => counts[item] = (counts[item] || 0) + 1);
    const most_freq_pAda = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    const i = wbp_sans_final.indexOf(most_freq_pAda);

    const w_to_id = wbp[i]; // weights to id, including final anceps
    const g_to_id = Vrs.gaRaAbbreviations.split('\n')[i]; // gaRa abbreviation to id

    let meter_label;

    // look for match among regexes with same length
    const patterns = samavfttas_by_family_and_gaRa[w_to_id.length] || {};
    let found = false;

    for (const gaRa_pattern of Object.keys(patterns)) {
      const regex = new RegExp(gaRa_pattern);
      if (regex.test(g_to_id)) {
        meter_label = patterns[gaRa_pattern];
        meter_label += ` [${w_to_id.length}: ${choose_heavy_gaRa_pattern(gaRa_pattern)}]`;
        found = true;
        break;
      }
    }

    if (!found) {
      meter_label = "ajñātasamavṛtta"; // i.e., might need to add to meter_patterns
      meter_label += ` [${w_to_id.length}: ${g_to_id}]`;
    }

    let score = meter_scores["samavṛtta, perfect"];

    if (this.pAdasamatva_count === 3) {
      meter_label += " (? 3 eva pādāḥ yuktāḥ)";
      score = meter_scores["samavṛtta, imperfect (3)"];
    } else if (this.pAdasamatva_count === 2) {
      meter_label += " (? 2 eva pādāḥ yuktāḥ)";
      score = meter_scores["samavṛtta, imperfect (2)"];
    } else if (this.pAdasamatva_count === 0) {
      meter_label += " (1 eva pādaḥ)";
      score = meter_scores["samavṛtta, quarter, perfect"];
    }

    // experimental penalty, can later incorporate into config meter_scores
    if (meter_label === "ajñātasamavṛtta") {
      score -= 2;
    }

    // may tie with pre-existing result (e.g., upajātiḥ)
    this.combine_results(Vrs, meter_label, score);
  }

  evaluate_ardhasamavftta(Vrs) {
    // sufficient pAdasamatva already assured, now just evaluate
    Vrs.identificationScore = meter_scores["ardhasamavṛtta, perfect"];

    const wbp = Vrs.syllableWeights.split('\n'); // weights by pāda

    const gs_to_id = Vrs.gaRaAbbreviations.split('\n'); // gaRa abbreviation to id
    const odd_g_to_id = gs_to_id[0];
    const even_g_to_id = gs_to_id[1];

    let meter_label;

    // look for match among regexes with same length
    const tuples = Object.keys(ardhasamavftta_by_odd_even_regex_tuple);
    let found = false;

    for (const tupleKey of tuples) {
      const [odd_gaRa_pattern, even_gaRa_pattern] = tupleKey.split(',');

      const regex_odd = new RegExp(odd_gaRa_pattern);
      const regex_even = new RegExp(even_gaRa_pattern);

      if (regex_odd.test(odd_g_to_id) && regex_even.test(even_g_to_id)) {
        meter_label = ardhasamavftta_by_odd_even_regex_tuple[tupleKey];
        found = true;
        break;
      }
    }

    if (!found) {
      meter_label = "ajñātārdhasamavṛtta"; // i.e., might need to add to meter_patterns
      meter_label += ` [${odd_g_to_id}, ${even_g_to_id}]`;
      Vrs.identificationScore = meter_scores["ardhasamavṛtta, perfect, unknown"];
    }

    Vrs.meterLabel = meter_label;
  }

  evaluate_upajAti(Vrs) {
    // sufficient length similarity already assured, now just evaluate

    let wbp = Vrs.syllableWeights.split('\n'); // weights by pāda
    let wbp_lens = wbp.map(line => line.length);
    let gs_to_id = Vrs.gaRaAbbreviations.split('\n');

    // special exception for triṣṭubh-jagatī mix
    // see Karashima 2016 "The Triṣṭubh-Jagatī Verses in the Saddharmapuṇḍarīka"
    const unique_sorted_lens = [...new Set(wbp_lens)].sort((a, b) => a - b);

    if (!(unique_sorted_lens.length === 2 && unique_sorted_lens[0] === 11 && unique_sorted_lens[1] === 12)) {
      // if imperfect, exclude all info for lines of non-majority lengths

      // find most frequent pAda length
      const lenCounts = {};
      wbp_lens.forEach(len => lenCounts[len] = (lenCounts[len] || 0) + 1);
      const most_freq_pAda_len = Object.keys(lenCounts).reduce((a, b) => lenCounts[a] > lenCounts[b] ? a : b);

      // exclude based on most frequent pAda length
      const to_exclude = [];
      for (let i = 0; i < wbp.length; i++) {
        if (wbp[i].length !== parseInt(most_freq_pAda_len)) {
          to_exclude.push(i);
        }
      }

      // delete in descending index order, avoid index errors
      for (let i = to_exclude.length - 1; i >= 0; i--) {
        const idx = to_exclude[i];
        wbp.splice(idx, 1);
        wbp_lens.splice(idx, 1);
        gs_to_id.splice(idx, 1);
      }
    }

    // calculate what result could possibly score based on analysis so far
    let potential_score = meter_scores["upajātiḥ, perfect"];

    if (!wbp_lens.includes(11)) { // no triṣṭubh (could be mixed with jagatī)
      potential_score -= 1;
    }
    if (wbp_lens.length !== 4 && !(unique_sorted_lens.length === 2 && unique_sorted_lens[0] === 11 && unique_sorted_lens[1] === 12)) {
      // not perfect, less than 4 being analyzed
      potential_score -= 2;
    }

    // possibly quit based on analysis so far
    if ((potential_score < Vrs.identificationScore) ||
      (disable_non_trizwuB_upajAti && potential_score < meter_scores["upajātiḥ, imperfect"])) {
      return;
    }

    // for however many pādas remain, produce labels as possible
    const meter_labels = [];
    for (let i = 0; i < gs_to_id.length; i++) {
      const g_to_id = gs_to_id[i];
      let meter_label;
      let found = false;

      const patterns = samavfttas_by_family_and_gaRa[wbp_lens[i]] || {};
      for (const gaRa_pattern of Object.keys(patterns)) {
        const regex = new RegExp(gaRa_pattern);
        if (regex.test(g_to_id)) {
          meter_label = patterns[gaRa_pattern];
          meter_label += ` [${wbp_lens[i]}: ${choose_heavy_gaRa_pattern(gaRa_pattern)}]`;
          found = true;
          break;
        }
      }

      if (!found) {
        meter_label = "ajñātam"; // i.e., might need to add to meter_patterns
        meter_label += ` [${wbp_lens[i]}: ${g_to_id}]`;
      }

      meter_labels.push(meter_label);
    }

    const unique_meter_labels = [...new Set(meter_labels)]; // de-dupe
    const combined_meter_labels = unique_meter_labels.join(', ');

    // assign scores and labels
    let family = samavftta_family_names[wbp_lens[0]];
    const unique_meter_labels_copy = [...unique_meter_labels].sort();

    if (family === "triṣṭubh" &&
      unique_meter_labels_copy.length === 2 &&
      unique_meter_labels_copy.includes('indravajrā [11: ttjgg]') &&
      unique_meter_labels_copy.includes('upendravajrā [11: jtjgg]')) {
      family = ''; // clearer not to specify in this case
    }

    let score;
    if (wbp_lens.length === 4 && unique_sorted_lens.length === 1 && unique_sorted_lens[0] === 11) { // triṣṭubh
      score = meter_scores["upajātiḥ, perfect"];
    } else if (unique_sorted_lens.length === 2 && unique_sorted_lens[0] === 11 && unique_sorted_lens[1] === 12) {
      score = meter_scores["upajātiḥ, triṣṭubh-jagatī-saṃkara, perfect"];
      family = "triṣṭubh-jagatī-saṃkara?"; // overwrite
    } else if (wbp_lens.length === 4 && !unique_sorted_lens.includes(11)) {
      score = meter_scores["upajātiḥ, non-triṣṭubh, perfect"];
    } else if ([2, 3].includes(wbp_lens.length) && wbp_lens.filter(len => len === 11).length === wbp_lens.length) { // triṣṭubh
      score = meter_scores["upajātiḥ, imperfect"];
    } else if ([2, 3].includes(wbp_lens.length) && !wbp_lens.includes(11)) {
      score = meter_scores["upajātiḥ, non-triṣṭubh, imperfect"];
    } else {
      score = meter_scores["none found"];
    }

    const overall_meter_label = `upajātiḥ ${family}: ${combined_meter_labels}`;

    let final_label = overall_meter_label;
    if (wbp_lens.length !== 4 && !(unique_sorted_lens.length === 2 && unique_sorted_lens[0] === 11 && unique_sorted_lens[1] === 12)) {
      // not perfect and also not triṣṭubh-jagatī-saṃkara
      final_label += ` (? ${wbp_lens.length} eva pādāḥ yuktāḥ)`;
    }

    this.combine_results(Vrs, final_label, score);
  }

  is_vizamavftta(Vrs) {
    const gs_to_id = Vrs.gaRaAbbreviations.split('\n');
    if (gs_to_id.length < 4) return false;

    for (const tupleKey of Object.keys(vizamavftta_by_4_tuple)) {
      const [a, b, c, d] = tupleKey.split(',');
      if (gs_to_id[0] === a && gs_to_id[1] === b && gs_to_id[2] === c && gs_to_id[3] === d) {
        Vrs.identificationScore = meter_scores["viṣamavṛtta, perfect"];
        Vrs.meterLabel = vizamavftta_by_4_tuple[tupleKey];
        return true;
      }
    }

    return false;
  }

  test_as_samavftta_etc(Vrs) {
    const wbp = Vrs.syllableWeights.split('\n'); // weights by pāda
    const wbp_lens = wbp.map(line => line.length);

    // make sure either full four pādas or one and single-pāda mode
    if (!(wbp.length >= 4 || (wbp.length === 1 && this.resplit_option === "single_pAda"))) {
      return 0;
    }

    this.count_pAdasamatva(Vrs); // [0,2,3,4]

    // test in following order to prioritize left-right presentation of ties
    // ties managed in this.combine_results()

    // test perfect samavṛtta
    if (this.pAdasamatva_count === 4) {
      // definitely checks out, id_score == 9
      this.evaluate_samavftta(Vrs);
      return 1; // max score already reached
    }

    // test perfect ardhasamavftta
    if (this.pAdasamatva_count === 2 &&
      wbp[0].slice(0, -1) === wbp[2].slice(0, -1) &&
      wbp[1].slice(0, -1) === wbp[3].slice(0, -1) && // exclude final anceps
      wbp_lens.filter(len => len === 11).length !== 4) { // bc triṣṭubh upajātiḥ so common
      // will give id_score == 8
      this.evaluate_ardhasamavftta(Vrs);
      // max score not necessarily yet reached, don't return
    }

    // test perfect single pāda of samavṛtta
    if (this.pAdasamatva_count === 0 && this.resplit_option === "single_pAda") {
      this.evaluate_samavftta(Vrs);
    }

    // test perfect viṣamavṛtta
    if (this.pAdasamatva_count === 0 && this.is_vizamavftta(Vrs)) {
      // will give id_score == 9
      // label and score already set in is_vizamavftta if test was successful
      return 1; // max score already reached
    }

    // test perfect upajātiḥ
    const unique_sorted_lens = [...new Set(wbp_lens)].sort((a, b) => a - b);
    if (unique_sorted_lens.length === 1) { // all same length
      // will give id_score in [8, 7], may tie with above
      this.evaluate_upajAti(Vrs);
      if (Vrs.identificationScore === 8) return 1; // best score compared to below
      // otherwise, max score not necessarily yet reached, don't return
    }

    // test imperfect samavftta
    if ([2, 3].includes(this.pAdasamatva_count)) {
      // will give id_score in [7, 6], may tie with above
      this.evaluate_samavftta(Vrs);
      // max score not necessarily yet reached, don't return
    }

    // test imperfect ardhasamavftta? seems hard
    // involves looking specifically for corresponding type...

    // test imperfect upajātiḥ
    if (unique_sorted_lens.length >= 2 && unique_sorted_lens.length <= 3 ||
      (unique_sorted_lens.length === 2 && unique_sorted_lens[0] === 11 && unique_sorted_lens[1] === 12)) {
      // either not all same length or triṣṭubh-jagatī mix
      // will give id_score in [6, 5, 4], may tie with above
      this.evaluate_upajAti(Vrs);
    }

    // return success
    if (Vrs.meterLabel !== null) {
      return 1;
    } else {
      return 0;
    }
  }

  test_as_jAti(Vrs) {
    /**
     * Accepts as arguments two lists, one of strings, the other of numbers.
     * First argument details light/heavy (l/g) patterns, second reports total morae.
     * Determines whether verse (first four lines) is of 'jāti' type.
     * Returns string detailing results if identified as such, or null if not.
     */
    const w_p = Vrs.syllableWeights.split('\n');
    // make sure full four pādas
    if (w_p.length < 4) return 0;

    const morae_by_pAda = Vrs.moraePerLine;

    // Note: morae_by_pAda is a list of numbers,
    // here manipulate as such but also as a single string
    const morae_by_pAda_string = JSON.stringify(morae_by_pAda);
    /**
     * Test whether morae match patterns, with allowance on last syllable:
     *   final light syllable of a jāti quarter CAN be counted as heavy,
     *   but ONLY if necessary to fill out the meter
     *   and NOT otherwise.
     */
    for (const [flex_pattern, std_pattern, jAti_name] of jAtis_by_morae) {
      const regex = new RegExp(flex_pattern);
      if (regex.test(morae_by_pAda_string)) {
        // for each of four pAdas
        let allValid = true;
        for (let i = 0; i < 4; i++) {
          if (morae_by_pAda[i] === std_pattern[i] ||
            // final syllable is light but needs to be heavy
            (morae_by_pAda[i] === std_pattern[i] - 1 && w_p[i].slice(-1) === 'l')) {
            continue;
          } else {
            allValid = false;
            break;
          }
        }

        if (allValid) { // if all four pAdas proven valid, i.e., if no breaks
          Vrs.meterLabel = `${jAti_name} (${std_pattern.join(', ')})`;
          Vrs.identificationScore = meter_scores["jāti, perfect"];

          // should be combining results in case of previous match
          return 1;
        }

        // soon: implement imperfect jāti, score == meter_scores["jāti, imperfect"]
      }
    }

    // if all patterns tested and nothing returned
    return 0;
  }

  attempt_identification(Vrs) {
    /**
     * Receives static, populated Verse object on which to attempt identification.
     * 
     * Runs through various possible meter types with respective identification_scores:
     *   zloka
     *     9 two zloka halves, both perfect
     *     8 two zloka halves, one perfect and one imperfect
     *     (not currently supported: two zloka halves, both imperfect)
     *     9 one zloka half, perfect
     *     (not currently supported: one zloka half, imperfect)
     *   samavftta, upajAti, vizamavftta, ardhasamavftta
     *     9 vizamavftta perfect (trivial, in progress)
     *     (currently not supported: 5 vizamavftta imperfect)
     *     (currently not supported but planned: 9 ardhasamavftta perfect)
     *     (currently not supported: 5 ardhasamavftta imperfect)
     *     9 samavftta perfect
     *     8 upajAti perfect trizwuB
     *     7 samavftta imperfect (2-3 lines match)
     *     7 upajAti perfect non-trizwuB
     *     6 upajAti imperfect trizwuB
     *     5 upajAti imperfect non-trizwuB
     *   jAti
     *     8 jAti perfect
     *     (currently not supported but planned: 5 jAti imperfect)
     * 
     * Embeds identification results as Verse.meter_label and Verse.identification_score.
     * Returns string corresponding to Verse.meter_label. - currently
     * Returns int result 1 if successful and 0 if not. - planned
     */

    this.identification_attempt_count += 1;

    // anuzwuB
    const success_anuzwuB = this.test_as_anuzwuB(Vrs); // 1 if successful, 0 if not
    if (success_anuzwuB && Vrs.identificationScore === meter_scores["max score"]) {
      return 1;
    }

    // samavftta, upajAti, vizamavftta, ardhasamavftta
    const success_samavftta_etc = this.test_as_samavftta_etc(Vrs);
    if (success_samavftta_etc && Vrs.identificationScore >= 8) return 1;
    // i.e., if upajātiḥ or anything imperfect, also continue on to check jāti

    // problem: how to change above handling for rare case
    // where ardhasamavftta is also jAti?

    // jāti
    const success_jAti = this.test_as_jAti(Vrs);

    if (success_anuzwuB || success_samavftta_etc || success_jAti) {
      return 1;
    } else {
      return 0;
    }
  }
}

export class MeterIdentifier {
  /**
   * User-facing agent-style object.
   * 
   * Primary method identify_meter() accepts string.
   * 
   * Returns single Verse object, whose attribute meter_label
   * and method summarize() help in revealing identification results.
   */

  constructor() {
    this.Scanner = null;
    this.VerseTester = null;
    this.Verses_found = []; // list of Verse objects which passed VerseTester
  }

  wiggle_iterator(start_pos, part_len, resplit_option) {
    /**
     * E.g., if len(pāda)==10,
     * then from the breaks between each pāda,
     * wiggle as far as 6 in either direction,
     * first right, then left.
     */

    const iter_list = [start_pos];
    let distance_multiplier;
    if (resplit_option === 'resplit_max') {
      distance_multiplier = 0.50; // wiggle as far as 50% of part_len
    } else if (resplit_option === 'resplit_lite') {
      distance_multiplier = 0.35; // wiggle as far as 35% of part_len
    }

    const max_wiggle_distance = Math.floor(part_len * distance_multiplier) + 1;
    for (let i = 1; i < max_wiggle_distance; i++) {
      iter_list.push(start_pos + i);
      iter_list.push(start_pos - i);
    }
    return iter_list;
  }

  resplit_Verse(syllable_list, ab_pAda_br, bc_pAda_br, cd_pAda_br) {
    /**
     * Input does not have newlines
     */
    const sss = scansion_syllable_separator;
    return (syllable_list.slice(0, ab_pAda_br).join(sss) + '\n' +
      syllable_list.slice(ab_pAda_br, bc_pAda_br).join(sss) + '\n' +
      syllable_list.slice(bc_pAda_br, cd_pAda_br).join(sss) + '\n' +
      syllable_list.slice(cd_pAda_br).join(sss));
  }

  wiggle_identify(Vrs, syllable_list, VrsTster, pAda_brs, quarter_len) {
    /**Returns a list for MeterIdentifier.Verses_found*/

    const pos_iterators = {};
    for (const k of ['ab', 'bc', 'cd']) {
      if (k === 'bc' && VrsTster.resplit_keep_midpoint === true) {
        pos_iterators['bc'] = [pAda_brs['bc']]; // i.e., do not wiggle bc
      } else {
        pos_iterators[k] = this.wiggle_iterator(
          pAda_brs[k], quarter_len,
          VrsTster.resplit_option
        );
      }
    }

    const S = new Scanner();
    const Verses_found = [];

    for (const pos_ab of pos_iterators['ab']) {
      for (const pos_bc of pos_iterators['bc']) {
        for (const pos_cd of pos_iterators['cd']) {
          try {
            const new_text_syllabified = this.resplit_Verse(
              syllable_list, pos_ab, pos_bc, pos_cd);

            // Create a copy of the Verse object
            const temp_V = Object.assign(Object.create(Object.getPrototypeOf(Vrs)), Vrs);
            temp_V.textSyllabified = new_text_syllabified;

            temp_V.syllableWeights = S.scanSyllableWeights(temp_V.textSyllabified);
            temp_V.moraePerLine = S.countMorae(temp_V.syllableWeights);
            temp_V.gaRaAbbreviations = temp_V.syllableWeights.split('\n')
              .map(line => S.gaRaAbbreviate(line))
              .join('\n');

            const success = VrsTster.attempt_identification(temp_V);

            if (success) {
              Verses_found.push(temp_V);
            }

            if (temp_V.identificationScore === meter_scores["max score"]) {
              return Verses_found;
              // done when any perfect exemplar found
              // for greater speed and efficiency
              // disable for debugging:
              //   check whether finding multiple 9s
              //   check whether any temp_V breaks system
            }

          } catch (e) {
            // IndexError equivalent
            continue;
          }
        }
      }
    }

    return Verses_found;
  }

  find_meter(rw_str, from_scheme = null) {
    this.Scanner = new Scanner();
    const tmp_V = this.Scanner.scan(rw_str, from_scheme);
    const all_weights_one_line = tmp_V.syllableWeights.replace(/\n/g, '');
    const all_syllables_one_line = tmp_V.textSyllabified.replace(/\n/g, '');

    const pathyA_odd = Object.keys(anuzwuB_pAda['odd'])[0].slice(1, -1);
    const even = anuzwuB_pAda['even'].slice(1, -1);
    const overall_pattern = pathyA_odd + even;

    const regex = new RegExp(overall_pattern, 'g');
    const matches = [];
    let match;
    while ((match = regex.exec(all_weights_one_line)) !== null) {
      matches.push([match.index, match.index + match[0].length]);
    }

    const match_strings = [];
    const syllables = all_syllables_one_line.split(' ');
    for (const [start, end] of matches) {
      match_strings.push(syllables.slice(start, end).join(''));
    }

    const verses_found = [];
    for (const ms of match_strings) {
      const V = this.identify_meter(ms, 'resplit_max', default_resplit_keep_midpoint, 'SLP');
      verses_found.push(V);
    }

    return verses_found;
  }

  identify_meter(rw_str,
    resplit_option = default_resplit_option,
    resplit_keep_midpoint = default_resplit_keep_midpoint,
    from_scheme = null) {
    /**
     * User-facing method, manages overall identification procedure:
     *   accepts raw string
     *   sends string to Scanner.scan, receives back scansion.Verse object
     *   then, according to segmentation mode
     *     makes and passes series of Verse objects to internal VerseTester
     *     receives back tested Verses (as internally available dict)
     *   returns single Verse object with best identification result
     * 
     * four segmentation modes:
     *   1) none: uses three newlines exactly as provided in input
     *   2) resplit_max: discards input newlines, resplits based on overall length
     *   3) resplit_lite: initializes length-based resplit with input newlines
     *   4) single_pAda: evaluates input as single pAda (verse quarter)
     * 
     * order
     *   first: default or override
     *   if fails, then: try other modes in set order (1 2 3; depending on length 4)
     */

    this.Scanner = new Scanner();

    // gets back mostly populated Verse object
    let V = this.Scanner.scan(rw_str, from_scheme);
    this.VerseTester = new VerseTester();
    this.VerseTester.resplit_option = resplit_option;
    this.VerseTester.resplit_keep_midpoint = resplit_keep_midpoint;

    if (['none', 'single_pAda'].includes(resplit_option) || V.textCleaned === '') {
      const success = this.VerseTester.attempt_identification(V);
      // label and score set internally

    } else if (['resplit_max', 'resplit_lite'].includes(resplit_option)) {

      // capture any user-provided pāda breaks (= all newlines after scansion cleaning)
      const newline_indices = [];
      let match;
      const newlineRegex = /\n/g;
      while ((match = newlineRegex.exec(V.textSyllabified)) !== null) {
        newline_indices.push(match.index);
      }

      // make pure list of only syllables
      let syllable_list = V.textSyllabified.replace(/\n/g, '').split(scansion_syllable_separator);

      // discard any final separator(s)
      try {
        while (syllable_list[syllable_list.length - 1] === '') {
          syllable_list.pop();
        }
      } catch (e) {
        // empty list...
      }

      // initialize length-based pāda breaks
      const pAda_brs = {};
      const total_syll_count = syllable_list.length;
      const quarter_len = Math.floor(total_syll_count / 4);
      pAda_brs['ab'] = quarter_len;
      pAda_brs['bc'] = quarter_len * 2;
      pAda_brs['cd'] = quarter_len * 3;

      if (newline_indices.length === 3) {
        if (resplit_option === 'resplit_lite') {
          // full three breaks provided (ab, bc, cd), override all length-based ones
          for (let i = 0; i < 3; i++) {
            const key = ['ab', 'bc', 'cd'][i];
            pAda_brs[key] = V.textSyllabified.slice(0, newline_indices[i])
              .split(scansion_syllable_separator).length - 1;
          }
        } else if (resplit_option === 'resplit_max' && this.VerseTester.resplit_keep_midpoint) {
          // full three breaks provided, override second (bc) only, keep other two
          pAda_brs['bc'] = V.textSyllabified.slice(0, newline_indices[1])
            .split(scansion_syllable_separator).length - 1;
        }
      } else if (newline_indices.length === 1) {
        if (resplit_option === 'resplit_lite' ||
          (resplit_option === 'resplit_max' && this.VerseTester.resplit_keep_midpoint)) {
          // only one break provided, assume bc, override that one, keep other two
          pAda_brs['bc'] = V.textSyllabified.slice(0, newline_indices[0])
            .split(scansion_syllable_separator).length - 1;
        }
      } else {
        // unusable number of user-provided pāda breaks
        // do nothing, use length-based ones
        // could give user some feedback...
      }

      // use initial Verse to generate potentially large number of others Verses
      // store their respective results internally, collect overall list
      this.Verses_found = this.wiggle_identify(
        V, syllable_list, this.VerseTester,
        pAda_brs, quarter_len
      );

      // pick best match, i.e. resulting Verse with highest identification_score
      if (this.Verses_found.length > 0) {
        this.Verses_found.sort((a, b) => b.identificationScore - a.identificationScore);
        V = this.Verses_found[0]; // replace initial Verse object
      }
    }

    if (V.meterLabel === null) { // initial Verse label still not populated
      V.meterLabel = 'na kiṃcid adhyavasitam'; // do not return null
      V.identificationScore = meter_scores["none found"]; // did at least try
    }

    return V;
  }
}