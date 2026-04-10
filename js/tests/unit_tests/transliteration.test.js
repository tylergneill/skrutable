// transliteration.test.js - JavaScript port of test_transliteration.py

import { Transliterator } from '../../src/transliteration.js';

describe('Transliteration', () => {

    test('test_mapping_mAmakAH', () => {
        const input = "mAmakAH pARqavAS cEva kim akurvata saYjaya /\nDarmakzetre kurukzetre samavetA yuyutsavaH /";
        const T = new Transliterator();
        T.contents = input;
        T.mapReplace('SLP', 'DEV');
        const output = T.contents;
        const expected_output = "मआमअकआः पआणडअवआश चऐवअ कइम अकउरवअतअ सअञजअयअ /\nधअरमअकषएतरए कउरउकषएतरए सअमअवएतआ यउयउतसअवअः /";
        expect(output).toBe(expected_output);
    });

    test('test_linear_preprocessing_cAtura', () => {
        const input = "चातुर";
        const T = new Transliterator();
        T.contents = input;
        T.linearPreprocessing('DEV', 'SLP');
        const output = T.contents;
        const expected_output = "चातुरa";
        expect(output).toBe(expected_output);
    });

    // anunāsika (candrabindu) round-trip tests

    test('test_anunasika_dev_to_slp_to_dev', () => {
        // Devanagari ँ → SLP → Devanagari (identity with preserve, normalize without)
        const T = new Transliterator();
        const cases = [
            ['अँ', 'अँ', 'अं'],
            ['आँ', 'आँ', 'आं'],
            ['इँ', 'इँ', 'इं'],
            ['ईँ', 'ईँ', 'ईं'],
            ['उँ', 'उँ', 'उं'],
            ['ऊँ', 'ऊँ', 'ऊं'],
        ];
        for (const [input, expectedPreserve, expectedNormalize] of cases) {
            const outPreserve = T.transliterate(input, 'DEV', 'DEV', undefined, undefined, true);
            expect(outPreserve).toBe(expectedPreserve);
            const outNormalize = T.transliterate(input, 'DEV', 'DEV', undefined, undefined, false);
            expect(outNormalize).toBe(expectedNormalize);
        }
    });

    test('test_anunasika_dev_to_slp_to_bengali', () => {
        // Devanagari ँ → SLP → Bengali (cross-script)
        const T = new Transliterator();
        const cases = [
            ['अँ', 'অঁ', 'অং'],
            ['आँ', 'আঁ', 'আং'],
            ['इँ', 'ইঁ', 'ইং'],
            ['ईँ', 'ঈঁ', 'ঈং'],
            ['उँ', 'উঁ', 'উং'],
            ['ऊँ', 'ঊঁ', 'ঊং'],
        ];
        for (const [input, expectedPreserve, expectedNormalize] of cases) {
            const outPreserve = T.transliterate(input, 'DEV', 'BENGALI', undefined, undefined, true);
            expect(outPreserve).toBe(expectedPreserve);
            const outNormalize = T.transliterate(input, 'DEV', 'BENGALI', undefined, undefined, false);
            expect(outNormalize).toBe(expectedNormalize);
        }
    });

    test('test_anunasika_iast_to_slp_to_iast_preserve', () => {
        // IAST ã → SLP → IAST with preserveAnunasika=true (identity)
        const T = new Transliterator();
        const cases = [
            ['a\u0303', 'a\u0303'],
            ['ā\u0303', 'ā\u0303'],
            ['i\u0303', 'i\u0303'],
            ['ī\u0303', 'ī\u0303'],
            ['u\u0303', 'u\u0303'],
            ['ū\u0303', 'ū\u0303'],
        ];
        for (const [input, expectedOutput] of cases) {
            const output = T.transliterate(input, 'IAST', 'IAST', undefined, undefined, true);
            expect(output).toBe(expectedOutput);
        }
    });

    test('test_anunasika_iast_to_slp_to_iast_normalize', () => {
        // IAST ã → SLP → IAST with preserveAnunasika=false (→ anusvāra)
        const T = new Transliterator();
        const cases = [
            ['a\u0303', 'aṃ'],
            ['ā\u0303', 'āṃ'],
            ['i\u0303', 'iṃ'],
            ['ī\u0303', 'īṃ'],
            ['u\u0303', 'uṃ'],
            ['ū\u0303', 'ūṃ'],
        ];
        for (const [input, expectedOutput] of cases) {
            const output = T.transliterate(input, 'IAST', 'IAST', undefined, undefined, false);
            expect(output).toBe(expectedOutput);
        }
    });

    test('test_anunasika_dev_to_slp_to_hk', () => {
        // Devanagari ँ → SLP → HK (mandatory normalization to anusvāra)
        const T = new Transliterator();
        const cases = [
            ['अँ', 'aM'],
            ['आँ', 'AM'],
            ['इँ', 'iM'],
            ['ईँ', 'IM'],
            ['उँ', 'uM'],
            ['ऊँ', 'UM'],
        ];
        for (const [input, expectedOutput] of cases) {
            const output = T.transliterate(input, 'DEV', 'HK');
            expect(output).toBe(expectedOutput);
        }
    });

});
