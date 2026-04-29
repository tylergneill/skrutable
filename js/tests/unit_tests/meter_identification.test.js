// meter_identification.test.js - JavaScript port of test_meter_identification.py

import { Scanner } from '../../src/scansion.js';
import { MeterIdentifier, VerseTester } from '../../src/meter_identification.js';
import { loadConfigDictFromJsonFile } from '../../src/config.js';

const config = loadConfigDictFromJsonFile();
const disable_non_trizwuB_upajAti = config["disable_non_trizwuB_upajAti"];
const meter_scores = config["meter_scores"]; // dict

describe('Meter Identification', () => {
    test('test_test_as_anuzwuB', () => {
        const S = new Scanner();
        const input_string = `yadA yadA hi Darmasya
glAnirBavati BArata
aByutTAnamaDarmasya
tadAtmAnaM sfjAmyaham`;
        const V = S.scan(input_string, 'SLP');
        const VT = new VerseTester();
        VT.test_as_anuzwuB(V);
        const output = V.meterLabel;
        const expected_output = "anuṣṭup (1,2: pathyā, 3,4: pathyā)";
        expect(output).toBe(expected_output);
    });

    test('test_identify_anuzwuB_split', () => {
        const MI = new MeterIdentifier();
        const input_string = `yadA yadA hi Darmasya
glAnirBavati BArata
aByutTAnamaDarmasya
tadAtmAnaM sfjAmyaham`;
        const object_result = MI.identify_meter(input_string, 'resplit_max', false, 'SLP');
        const output = object_result.meterLabel.substring(0, 7);
        const expected_output = "anuṣṭup";
        expect(output).toBe(expected_output);
    });

    test('test_count_pAdasamatva', () => {
        const S = new Scanner();
        const input_string = `sampūrṇakumbho na karoti śabdam
ardho ghaṭo ghoṣamupaiti nūnam
vidvānkulīno na karoti garvaṃ
jalpanti mūḍhāstu guṇairvihīnāḥ`;
        const V = S.scan(input_string, 'IAST');
        const VT = new VerseTester();
        VT.count_pAdasamatva(V);
        const output = VT.pAdasamatva_count;
        const expected_output = 4;
        expect(output).toBe(expected_output);
    });

    test('test_count_pAdasamatva_zero', () => {
        const S = new Scanner();
        const input_string = "sampūrṇakumbho na karoti śabdam";
        const V = S.scan(input_string, 'IAST');
        const VT = new VerseTester();
        VT.resplit_option = 'single_pAda';
        VT.count_pAdasamatva(V);
        const output = VT.pAdasamatva_count;
        const expected_output = 0;

        expect(output).toBe(expected_output);
    });

    test('test_identify_meter_upajAti', () => {
        const MI = new MeterIdentifier();
        const input_string = `kolAhale kAkakulasya jAte
virAjate kokilakUjitaM kim
parasparaM saMvadatAM KalAnAM
mOnaM viDeyaM satataM suDIBiH`;
        const object_result = MI.identify_meter(input_string, 'resplit_max', false, 'SLP');
        const output = object_result.meterLabel.substring(0, 7);
        const expected_output = "upajāti";
        expect(output).toBe(expected_output);
    });

    test('test_identify_meter_Darmakzetre', () => {
        const MI = new MeterIdentifier();
        const input_string = `dharmakṣetre kurukṣetre samavetā yuyutsavaḥ /
māmakāḥ pāṇḍavāś caiva kim akurvata sañjaya //`;
        const object_result = MI.identify_meter(input_string, 'resplit_max', false, 'IAST');
        const output = object_result.summarize();
        const truncated_output = object_result.meterLabel.substring(0, 7);
        const expected_output = "anuṣṭup";

        expect(truncated_output).toBe(expected_output);
    });

    test('test_evaluate_samavftta_sampUrRakumBo', () => {
        const S = new Scanner();
        const input_string = `sampūrṇakumbho na karoti śabdam
ardho ghaṭo ghoṣamupaiti nūnam
vidvānkulīno na karoti garvaṃ
jalpanti mūḍhāstu guṇairvihīnāḥ`;
        const V = S.scan(input_string, 'IAST');
        const VT = new VerseTester();
        VT.count_pAdasamatva(V);
        VT.evaluate_samavftta(V);
        const output = V.meterLabel.substring(0, 10);
        const expected_output = "indravajrā";

        expect(output).toBe(expected_output);
    });

    test('test_evaluate_samavftta_sampUrRakumBo_1', () => {
        const S = new Scanner();
        const input_string = "sampūrṇakumbho na karoti śabdam";
        const V = S.scan(input_string, 'IAST');
        const VT = new VerseTester();
        VT.resplit_option = "single_pAda";
        VT.count_pAdasamatva(V);
        VT.evaluate_samavftta(V);
        expect(V.meterLabel).toContain("1 eva pādaḥ");
        const basic_meter_label_output = V.meterLabel.substring(0, 10);
        const expected_output = "indravajrā";
        expect(basic_meter_label_output).toBe(expected_output);
    });

    test('test_evaluate_samavftta_sampUrRakumBo_3', () => {
        const S = new Scanner();
        const input_string = `sampūrṇakumbha na karoti śabdam
ardho ghaṭo ghoṣamupaiti nūnam
vidvānkulīno na karoti garvaṃ
jalpanti mūḍhāstu guṇairvihīnāḥ`;
        const V = S.scan(input_string, 'IAST');
        const VT = new VerseTester();
        VT.count_pAdasamatva(V);
        VT.evaluate_samavftta(V);
        const output = V.identificationScore;
        const expected_output = meter_scores["samavṛtta, imperfect (3)"];
        expect(output).toBe(expected_output);
    });

    test('test_evaluate_upajAti_kolAhale', () => {
        const S = new Scanner();
        const input_string = `kolAhale kAkakulasya jAte
virAjate kokilakUjitaM kim
parasparaM saMvadatAM KalAnAM
mOnaM viDeyaM satataM suDIBiH`;
        const V = S.scan(input_string, 'SLP');
        const VT = new VerseTester();
        VT.evaluate_upajAti(V);
        const output = V.identificationScore;
        const expected_output = meter_scores["upajātiḥ, perfect"];
        expect(output).toBe(expected_output);
    });

    test('test_evaluate_upajAti_kolAhala', () => {
        const S = new Scanner();
        const input_string = `kolAhala kAkakulasya jAte
virAjate kokilakUjitaM kim
parasparaM saMvadatAM KalAnAM
mOnaM viDeyaM satataM suDIBiH`;
        const V = S.scan(input_string, 'SLP');
        const VT = new VerseTester();
        VT.count_pAdasamatva(V);
        VT.evaluate_upajAti(V);
        const output = V.identificationScore;
        const expected_output = meter_scores["upajātiḥ, perfect"];
        expect(output).toBe(expected_output);
    });

    test('test_evaluate_upajAti_kolAha', () => {
        const S = new Scanner();
        const input_string = `kolAha kAkakulasya jAte
virAjate kokilakUjitaM kim
parasparaM saMvadatAM KalAnAM
mOnaM viDeyaM satataM suDIBiH`;
        const V = S.scan(input_string, 'SLP');
        const VT = new VerseTester();
        VT.count_pAdasamatva(V);
        VT.evaluate_upajAti(V);
        const output = V.identificationScore;
        const expected_output = meter_scores["upajātiḥ, imperfect"];
        if (!disable_non_trizwuB_upajAti) {
            expect(output).toBe(expected_output);
        }
    });

    test('test_test_as_samavftta_etc_kolAhale', () => {
        const S = new Scanner();
        const input_string = `kolAhale kAkakulasya jAte
virAjate kokilakUjitaM kim
parasparaM saMvadatAM KalAnAM
mOnaM viDeyaM satataM suDIBiH`;
        const V = S.scan(input_string, 'SLP');
        const VT = new VerseTester();
        VT.test_as_samavftta_etc(V);
        const output = V.identificationScore;
        const expected_output = meter_scores["upajātiḥ, perfect"];
        expect(output).toBe(expected_output);
    });

    test('test_test_as_samavftta_etc_sampUrRakumBo_3', () => {
        const S = new Scanner();
        const input_string = `sampūrṇakumbha na karoti śabdam
ardho ghaṭo ghoṣamupaiti nūnam
vidvānkulīno na karoti garvaṃ
jalpanti mūḍhāstu guṇairvihīnāḥ`;
        const V = S.scan(input_string, 'IAST');
        const VT = new VerseTester();
        VT.test_as_samavftta_etc(V);
        const output = V.identificationScore;
        const expected_output = meter_scores["upajātiḥ, perfect"];
        expect(output).toBe(expected_output);
    });

    test('test_test_as_samavftta_etc_kudeSam_3', () => {
        const S = new Scanner();
        const input_string = `kudeSamAsAdyA kuto 'rTasaYcayaH
kuputramAsAdya kuto jalAYjaliH
kugehinIM prApya kuto gfhe suKam
kuSizyamaDyApayataH kuto yaSaH`;
        const V = S.scan(input_string, 'SLP');
        const VT = new VerseTester();
        VT.test_as_samavftta_etc(V);
        const output = V.identificationScore;
        const expected_output = meter_scores["samavṛtta, imperfect (3)"];
        expect(output).toBe(expected_output);
    });

    test('test_combine_results_kolAhale', () => {
        const S = new Scanner();
        const input_string = `kolAhale kAkakulasya jAte
virAjate kokilakUjitaM kim
parasparaM saMvadatAM KalAnAM
mOnaM viDeyaM satataM suDIBiH`; // id_score == 8
        const V = S.scan(input_string, 'SLP');
        const VT = new VerseTester();
        // VT.count_pAdasamatva(V);
        VT.evaluate_upajAti(V);
        VT.combine_results(V, 'something better', 9);
        const output = V.identificationScore;
        const expected_output = 9; // the "better" one
        expect(output).toBe(expected_output);
    });

    test('test_identify_meter_SArdUlavikrIqitA', () => {
        const MI = new MeterIdentifier();
        const input_string = `sA ramyA nagarI mahAn sa nfpatiH sAmantacakraM ca tat
pArSve tasya ca sA vidagDaparizat tAScandrabimbAnanAH
udriktaH sa ca rAjaputranivahaste bandinastAH kaTAH
sarvaM yasya vaSAdagAt smftipaTaM kAlAya tasmE namaH`;
        const object_result = MI.identify_meter(input_string, 'none', false, 'SLP');
        const output = object_result.meterLabel;
        const truncated_output = output.substring(0, 16);
        const expected_output = "śārdūlavikrīḍita";
        expect(truncated_output).toBe(expected_output);
    });

    test('test_identify_meter_SArdUlavikrIqitA_1', () => {
        const S = new Scanner();
        const input_string = "sA ramyA nagarI mahAn sa nfpatiH sAmantacakraM ca tat";
        const V = S.scan(input_string, 'SLP');
        const VT = new VerseTester();
        VT.resplit_option = "single_pAda";
        VT.count_pAdasamatva(V);
        VT.evaluate_samavftta(V);
        expect(V.meterLabel).toContain("1 eva pādaḥ");
        const basic_meter_label_output = V.meterLabel.split(' ')[0];
        const expected_output = "śārdūlavikrīḍitam";
        expect(basic_meter_label_output).toBe(expected_output);
    });

    test('test_identify_meter_trizwuB_jagatI_saMkara', () => {
        const MI = new MeterIdentifier();
        const input_string = `na caitad vidmaḥ kataran no garīyo;
yad vā jayema yadi vā no jayeyuḥ /
yān eva hatvā na jijīviṣāmas;
te 'vasthitāḥ pramukhe dhārtarāṣṭrāḥ //`;
        const object_result = MI.identify_meter(input_string, 'resplit_max', false, 'IAST');
        const output = object_result.meterLabel;
        expect(output).not.toBeNull();
    });

    test('test_find_meter', () => {
        const MI = new MeterIdentifier();
        const input_string = `tadA yadA yadA hi Darmasya
glAnirBavati BArata
aByutTAnamaDarmasya
tadAtmAnaM sfjAmyaham tadA blA blA blA
yasya kasya taror mUlaM yena kenApi miSritam |
yasmE kasmE pradAtavyaM yad vA tad vA Bavizyati ||`;
        const object_result_list = MI.find_meter(input_string, 'SLP');
        const output = object_result_list.length;
        const expected_output = 4;
        // expect(output).toBe(expected_output); // commented out in Python version
    });

    test('test_test_as_jAti', () => {
        const S = new Scanner();
        const input_string = `karabadarasadfSamaKilaM
BuvanatalaM yatprasAdataH kavayaH
paSyanti sUkzmamatayaH
sA jayati sarasvatI devI`;
        const V = S.scan(input_string, 'SLP');
        const VT = new VerseTester();
        VT.test_as_jAti(V);
        const output = V.identificationScore;
        const expected_output = meter_scores["jāti, perfect"];
        expect(output).toBe(expected_output);
    });

    test('test_identify_meter_jAti', () => {
        const MI = new MeterIdentifier();
        const input_string = `karabadarasadfSamaKilaM
BuvanatalaM yatprasAdataH kavayaH
paSyanti sUkzmamatayaH
sA jayati sarasvatI devI`;
        const object_result = MI.identify_meter(input_string, 'none', false, 'SLP');
        const output = object_result.identificationScore;
        const expected_output = meter_scores["jāti, perfect"];
        expect(output).toBe(expected_output);
    });

    test('test_evaluate_ardhasamavftta', () => {
        const S = new Scanner();
        const input_string = `iti vilapati pārthive pranaṣṭe
karuṇataraṃ dviguṇaṃ ca rāmahetoḥ /
vacanam anuniśamya tasya devī
bhayam agamat punar eva rāmamātā //`;
        const V = S.scan(input_string, 'IAST');
        const VT = new VerseTester();
        VT.count_pAdasamatva(V);
        VT.evaluate_ardhasamavftta(V);
        const output = V.identificationScore;
        const expected_output = meter_scores["ardhasamavṛtta, perfect"];
        expect(output).toBe(expected_output);
    });

    test('test_identify_meter_vaMSasTa', () => {
        // after enabling ardhasamavftta
        const MI = new MeterIdentifier();
        const input_string = `purā śaratsūryamarīcisaṃnibhān
navāgrapuṅkhān sudṛḍhān nṛpātmajaḥ /
sṛjaty amoghān viśikhān vadhāya te
pradīyatāṃ dāśarathāya maithilī  //`;
        const object_result = MI.identify_meter(input_string, 'resplit_max', false, 'IAST');
        const output = object_result.identificationScore;
        const expected_output = meter_scores["samavṛtta, perfect"];
        expect(output).toBe(expected_output);
    });

    test('test_identify_meter_vaMSasTa_1', () => {
        const S = new Scanner();
        const input_string = "purā śaratsūryamarīcisaṃnibhān";
        const V = S.scan(input_string, 'IAST');
        const VT = new VerseTester();
        VT.resplit_option = "single_pAda";
        VT.count_pAdasamatva(V);
        VT.evaluate_samavftta(V);
        expect(V.meterLabel).toContain("1 eva pādaḥ");
        const basic_meter_label_output = V.meterLabel.split(' ')[0];
        const expected_output = "vaṃśastham";
        expect(basic_meter_label_output).toBe(expected_output);
    });

    test('test_identify_meter_no_split_additional_newline_chrs_Darmakzetre', () => {
        const MI = new MeterIdentifier();
        const input_string = `dharmakṣetre kurukṣetre\t samavetā yuyutsavaḥ /
māmakāḥ pāṇḍavāś caiva; kim akurvata sañjaya //`;
        const object_result = MI.identify_meter(input_string, 'none', false, 'IAST');
        const output = object_result.summarize();
        const truncated_output = object_result.meterLabel.substring(0, 7);
        const expected_output = "anuṣṭup";
        expect(truncated_output).toBe(expected_output);
    });

    test('test_identify_meter_no_split_additional_newline_chrs_upajAti_kolAhale', () => {
        console.log("test_identify_meter_no_split_additional_newline_chrs_upajAti_kolAhale")
        const MI = new MeterIdentifier();
        const input_string = `kolAhale kAkakulasya jAte ; virAjate kokilakUjitaM kim
parasparaM saMvadatAM KalAnAM / mOnaM viDeyaM satataM suDIBiH`;
        const object_result = MI.identify_meter(input_string, 'none', false, 'SLP');
        const output = object_result.summarize();
        const truncated_output = object_result.meterLabel.substring(0, 7);
        const expected_output = "upajāti";
        expect(truncated_output).toBe(expected_output);
    });

    test('test_resplit_lite_samavftta', () => {
        const MI = new MeterIdentifier();
        const input_string = `sampūrṇakumbho na karoti śabdam ; ardho ghaṭo ghoṣamupaiti nūnam
vidvānkulīno na karoti garvaṃ / jalpanti mūḍhāstu guṇairvihīnāḥ`;
        const object_result = MI.identify_meter(input_string, 'resplit_lite', false, 'IAST');
        const output = object_result.summarize();
        const truncated_output = object_result.meterLabel.substring(0, 10);
        const expected_output = "indravajrā";
        expect(truncated_output).toBe(expected_output);
    });

    test('test_resplit_lite_jAti', () => {
        const MI = new MeterIdentifier();
        const input_string = `karabadarasadfSamaKilaM
BuvanatalaM yatprasAdataH kavayaH
paSyanti sUkzmamatayaH
sA jayati sarasvatI devI`;
        const object_result = MI.identify_meter(input_string, 'resplit_lite', false, 'SLP');
        const output = object_result.summarize();
        const truncated_output = object_result.meterLabel.substring(0, 4);
        const expected_output = "āryā";
        expect(truncated_output).toBe(expected_output);
    });

    test('test_resplit_lite_anuzwuB', () => {
        const MI = new MeterIdentifier();
        const input_string = `yadA yadA hi Darmasya
glAnirBavati BArata
aByutTAnamaDarmasya
tadAtmAnaM sfjAmyaham`;
        const object_result = MI.identify_meter(input_string, 'resplit_lite', false, 'SLP');
        const output = object_result.summarize();
        const truncated_output = object_result.meterLabel.substring(0, 7);
        const expected_output = "anuṣṭup";
        expect(truncated_output).toBe(expected_output);
    });

    test('test_vaMSasTa_imperfect_not_upajAti', () => {
        const MI = new MeterIdentifier();
        const input_string = `tatas tu nīlo vijayī mahābalaḥ; praśasyamānaḥ svakṛtena karmaṇā / sametya rāmeṇa salakṣmaṇena; prahṛṣṭarūpas tu babhūva yūthapaḥ // 6.046.051`; // R
        const object_result = MI.identify_meter(input_string, 'resplit_max', false, 'IAST');
        const output = object_result.summarize();
        const truncated_output = object_result.meterLabel.substring(0, 10);
        const expected_output = "vaṃśastham";
        expect(truncated_output).toBe(expected_output);
    });

    test('test_identify_meter_jAti_resplit_lite', () => {
        const MI = new MeterIdentifier();
        const input_string = `स्वः स्वर्गः सुरसद्म त्रिदशावासस्त्रिविष्टपं त्रिदिवम्
द्यौर्गौरमर्त्यभुवनं नाकः स्यादूर्ध्वलोकश्च`;
        const object_result = MI.identify_meter(input_string, 'resplit_lite', false, 'DEV');
        const output = object_result.summarize();
        const truncated_output = object_result.meterLabel.substring(0, 6);
        const expected_output = "udgīti";
        expect(truncated_output).toBe(expected_output);
    });

    test('test_identify_meter_jAti_resplit_max_keep_midpoint', () => {
        const MI = new MeterIdentifier();
        const input_string = `स्वः स्वर्गः सुरसद्म त्रिदशावासस्त्रिविष्टपं त्रिदिवम्
द्यौर्गौरमर्त्यभुवनं नाकः स्यादूर्ध्वलोकश्च`;
        const object_result = MI.identify_meter(input_string, 'resplit_max', true, 'DEV');
        const output = object_result.summarize();
        const truncated_output = object_result.meterLabel.substring(0, 4);
        const expected_output = "āryā";
        expect(truncated_output).toBe(expected_output);
    });

    test('test_identify_meter_samavftta_imperfect_resplit_lite_keep_mid', () => {
        const MI = new MeterIdentifier();
        const input_string = `guṇāpekṣāśūnyaṃ kathamidamupakrāntamatha vā
kutopatyasnehaḥ kuṭilanayāniṣṇātamanasām ।
idaṃ tvaidaṃparyaṃ yaduta nṛpaternarmasacivaḥ
sutādānānmitraṃ bhavatu sa hi no nandana iti ॥`;
        const object_result = MI.identify_meter(input_string, 'resplit_lite', true, 'IAST');
        const output = object_result.meterLabel;
        const truncated_output = output.substring(0, 9);
        const expected_output = "śikhariṇī";
        expect(truncated_output).toBe(expected_output);
    });

    test('test_identify_meter_vizamavftta_perfect', () => {
        const MI = new MeterIdentifier();
        const input_string = `bibharāṃbabhūvur apavṛtta
jaṭharaśapharīkulākulāḥ /
paṅkaviṣamitataṭāḥ saritaḥ
karirugṇacandanarasāruṇaṃ payaḥ // 12.49`;
        const object_result = MI.identify_meter(input_string, 'resplit_lite', true, 'IAST');
        const output = object_result.meterLabel;
        const truncated_output = output.substring(0, output.indexOf(' '));
        const expected_output = "udgatā";
        expect(truncated_output).toBe(expected_output);
    });

    test('test_identify_meter_mandakranta', () => {
        const MI = new MeterIdentifier();
        const input_string = `tasya sTitvA kaTamapi puraH kOtukADAnahetorantarbAzpaSciramanucaro rAjarAjasya daDyO meGAloke Bavati suKino 'pyanyaTAvftti cetaH kaRWASlezapraRayini jane kiM punardUrasaMsTe`;
        const object_result = MI.identify_meter(input_string, 'resplit_max', true, 'SLP');
        const output = object_result.meterLabel.split(' ')[0];
        const expected_output = "mandākrāntā";
        expect(output).toBe(expected_output);
    });

    test('test_identify_meter_prthvi', () => {
        const MI = new MeterIdentifier();
        const input_string = `laBeta sikatAsu tElamapi yatnataH pIqayanpibecca mfga-tfzRikAsu salilaM pipAsArditaH । kadAcidapi paryavan SaSavizARamAsAdayennatu pratinivizwa-mUrKa-jana-cittamArADayet ॥`;
        const object_result = MI.identify_meter(input_string, 'resplit_max', true, 'SLP');
        const output = object_result.meterLabel.split(' ')[0];
        const expected_output = "pṛthvī";
        expect(output).toBe(expected_output);
    });

    test('test_identify_meter_shardulvikridit', () => {
        const MI = new MeterIdentifier();
        const input_string = `vyAlaM bAlamfRAlatantuBirasO rodDuM samujjfmBate CettuM vajramaRiM SirIzakusumaprAntena sannahyati ।
mADuryaM maDubindunA racayituM kzArAmuDerIhate netuM vAYCanti yaH KalAnpaTi satAM sUktEH suDAsyandiBiH ॥`;
        const object_result = MI.identify_meter(input_string, 'resplit_max', true, 'SLP');
        const output = object_result.meterLabel.split(' ')[0];
        const expected_output = "śārdūlavikrīḍitam";
        expect(output).toBe(expected_output);
    });

    test('test_identify_meter_shikharini', () => {
        const MI = new MeterIdentifier();
        const input_string = `yadA kiYcij-jYo'haM dvipa iva madAnDaH samaBavaM tadA sarvajYo'smItyaBavadavaliptaM mama manaH ।
yadA kiYcitkiYcidbuDajana-sakASAdavagataM tadA mUrKo'smIti jvara iva mado me vyapagataH ॥`;
        const object_result = MI.identify_meter(input_string, 'resplit_max', true, 'SLP');
        const output = object_result.meterLabel.split(' ')[0];
        const expected_output = "śikhariṇī";
        expect(output).toBe(expected_output);
    });

    test('test_resplit_keep_midpoint_pins_bc_break', () => {
        // Artificially miscut anuṣṭup: the user-supplied newline falls after pāda 1 only,
        // putting three pādas on line 2. keep_mid=true honours that bad bc break and
        // fails to identify the meter; keep_mid=false ignores it and finds anuṣṭup.
        const MI = new MeterIdentifier();
        const input_string = `dharmakṣetre kurukṣetre samavetā /\nyuyutsavaḥ māmakāḥ pāṇḍavāś caiva kim akurvata sañjaya //`;
        const result_keep = MI.identify_meter(input_string, 'resplit_max', true, 'IAST');
        const result_free = MI.identify_meter(input_string, 'resplit_max', false, 'IAST');
        expect(result_keep.meterLabel).toBe("na kiṃcid adhyavasitam");
        expect(result_free.meterLabel.substring(0, 7)).toBe("anuṣṭup");
    });
});
