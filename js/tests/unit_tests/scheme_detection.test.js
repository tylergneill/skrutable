// scheme_detection.test.js - JavaScript port of test_scheme_detection.py (small subset)

import { SchemeDetector } from '../../src/scheme_detection.js';
import { Transliterator } from '../../src/transliteration.js';

describe('Scheme Detection', () => {

    test('test_detect_iast_basic', () => {
        const SD = new SchemeDetector();
        // Clear IAST text with diacritics
        const detected = SD.detectScheme('dharmaḥ kṣetre kurukṣetre samavetā yuyutsavaḥ');
        expect(detected).toBe('IAST');
    });

    test('test_detect_devanagari_basic', () => {
        const SD = new SchemeDetector();
        const detected = SD.detectScheme('धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः');
        expect(detected).toBe('DEV');
    });

    test('test_detect_slp_basic', () => {
        const SD = new SchemeDetector();
        const detected = SD.detectScheme('DarmakzEtre kurukzetre samavetA yuyutsavaH');
        expect(detected).toBe('SLP');
    });

    test('test_detect_hk_basic', () => {
        const SD = new SchemeDetector();
        const detected = SD.detectScheme('dharmakSetre kurukSetre samavetA yuyutsavaH');
        expect(detected).toBe('HK');
    });

    test('test_detect_empty_returns_null', () => {
        const SD = new SchemeDetector();
        const detected = SD.detectScheme('');
        expect(detected).toBeNull();
    });

    test('test_detect_confidence_set', () => {
        const SD = new SchemeDetector();
        SD.detectScheme('dharmaḥ kṣetre kurukṣetre');
        expect(['high', 'low']).toContain(SD.confidence);
    });

    test('test_detect_empty_confidence_null', () => {
        const SD = new SchemeDetector();
        SD.detectScheme('');
        expect(SD.confidence).toBeNull();
    });

    test('test_auto_detect_synonyms_recognized', () => {
        // AUTO-detect triggers scheme detection inside Transliterator
        const T = new Transliterator('IAST', 'SLP');
        const result = T.transliterate('dharmaḥ', 'AUTO', 'SLP');
        expect(result).toBe('DarmaH');
    });

    test('test_round_trip_all_schemes', () => {
        // Each scheme should be detectable after transliteration from IAST
        const iast = 'dharmaḥ kṣetre kurukṣetre samavetā yuyutsavaḥ';
        const schemes = ['IAST', 'SLP', 'HK', 'DEV'];
        const T = new Transliterator();
        const SD = new SchemeDetector();
        for (const scheme of schemes) {
            const text = T.transliterate(iast, 'IAST', scheme);
            const detected = SD.detectScheme(text);
            expect(detected).toBe(scheme);
        }
    });

});
