// scansion.test.js - checks for Scanner.scan() in the JavaScript port

import { Scanner } from '../../src/scansion.js';

describe('Scansion', () => {

    // Guards the auto-detection path in scan(): with fromScheme left as null,
    // scan() must detect the scheme from the input text itself. This broke
    // once when the text wasn't loaded into the Transliterator before detection.
    test('test_scan_devanagari_auto_detect', () => {
        const S = new Scanner();
        const input_string = `धर्मक्षेत्रे कुरुक्षेत्रे
समवेता युयुत्सवः`;
        const V = S.scan(input_string); // fromScheme defaults to null
        expect(V.originalScheme).toBe('DEV');
        expect(V.textSLP).toBe(`Darmakzetre kurukzetre
samavetA yuyutsavaH`);
    });

});
