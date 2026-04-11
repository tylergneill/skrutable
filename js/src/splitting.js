// Splitter class for Sanskrit sandhi/compound splitting
// Port of splitting.py — uses Dharmamitra and 2018 external APIs via fetch

import { Transliterator } from './transliteration.js';
import { config } from './config.js';

const PRESERVE_PUNCTUATION_DEFAULT = config.preserve_punctuation_default;
const PRESERVE_COMPOUND_HYPHENS_DEFAULT = config.preserve_compound_hyphens_default;

const SPLITTER_SERVER_URL = 'https://2018emnlp-sanskrit-splitter-server.duckdns.org/api/split/';
const HEADERS = { 'Content-Type': 'application/json' };
const RETRY_DELAY_MS = 5000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class Splitter {
  constructor() {
    const sharedItems = String.raw`।॥\|/\\.,—;\?!\[(<\t\r\n"`;
    this.punctuationRegex = new RegExp(` *[${sharedItems}][${sharedItems}\\d\\])> ]*`, 'g');
    this.maxCharLimit = {
      'splitter_2018,no-hyphens':       128,
      'dharmamitra_2024_sept,no-hyphens': 350,
      'dharmamitra_2024_sept,hyphens':    150,
    };
    this.charLimitSplitRegexOptions = [
      /(?:[kgtdnpbmṃḥ]) /g,
      /(?:e[nṇ]a|asya|[ie]va|api) /g,
      / /g,
      /a/g,
    ];
    this.centerSplitRange = 0.8;
  }

  _getSentencesAndPunctuation(text) {
    /**
     * Extract and return lists of sentences and punctuation from text.
     * Also returns list of markers for proper interleaving on restoration.
     */
    const pRe = new RegExp(this.punctuationRegex.source, 'gm');
    const sentences = text.split(pRe).filter(s => s !== '');
    const punctuation = [...text.matchAll(pRe)].map(m => m[0]);

    const splitRe = new RegExp(`(${this.punctuationRegex.source})`, 'gm');
    const tokens = text.split(splitRe).filter(t => t !== '');
    const punctRe = new RegExp(`^${this.punctuationRegex.source}$`, 'm');
    const markers = tokens.map(t => punctRe.test(t) ? 'punctuation' : 'content');

    return { sentences, punctuation, markers };
  }

  _findMidpoint(text, splitRegex) {
    /**
     * Determine position of whitespace of centermost legal split of text.
     * Returns integer index.
     */
    const re = new RegExp(splitRegex.source, splitRegex.flags.replace('g', '') + 'g');
    const spaceIndices = [];
    let m;
    while ((m = re.exec(text)) !== null) {
      spaceIndices.push(m.index + m[0].length - 1);
    }
    if (spaceIndices.length === 0) return 0;
    const mid = text.length / 2;
    const distances = spaceIndices.map(i => Math.abs(i - mid));
    const minDist = Math.min(...distances);
    return spaceIndices[distances.indexOf(minDist)];
  }

  _splitSmartHalf(text, splitRegexOptions, maxLen) {
    /**
     * Recursively split text until all substrings conform to maxLen.
     * Returns array of resulting substrings.
     */
    text = text.replace(/^ *| *$/g, '');
    if (text.length <= maxLen) return [text];

    let midpoint = 0;
    for (const splitRegex of splitRegexOptions) {
      midpoint = this._findMidpoint(text, splitRegex);
      const lo = ((1.0 - this.centerSplitRange) / 2) * text.length;
      const hi = (1.0 - (1.0 - this.centerSplitRange) / 2) * text.length;
      if (midpoint > lo && midpoint < hi) break;
    }

    const partA = this._splitSmartHalf(text.slice(0, midpoint + 1), splitRegexOptions, maxLen);
    const partB = this._splitSmartHalf(text.slice(midpoint + 1), splitRegexOptions, maxLen);
    return [...partA, ...partB];
  }

  _enforceCharLimit(textLines, maxCharLimit = 128) {
    const sentenceCounts = [];
    const newTextLines = [];
    for (const line of textLines) {
      if (line.length <= maxCharLimit) {
        newTextLines.push(line);
        sentenceCounts.push(1);
      } else {
        const parts = this._splitSmartHalf(line, this.charLimitSplitRegexOptions, maxCharLimit);
        newTextLines.push(...parts);
        sentenceCounts.push(parts.length);
      }
    }
    return { newTextLines, sentenceCounts };
  }

  _parseDharmamitraSimpleResult(responseJson) {
    /**Parse response from /api-tagging/tagging/ (flat underscore-delimited strings). */
    return responseJson.results.map(s => s.replace(/_/g, ' ').trim());
  }

  _parseDharmamitraParsedResult(responseJson) {
    /**Parse response from /api-tagging/tagging-parsed/ (structured grammatical analysis). */
    return responseJson.map(sentenceObj => {
      let sentence = sentenceObj.grammatical_analysis
        .map(w => w.unsandhied)
        .join(' ');
      sentence = sentence.replace(/- /g, '-');
      return sentence;
    });
  }

  async _getDharmamitraSplit(textInput, preserveCompoundHyphens = true, batchSize = 2000, retries = 1) {
    /**
     * Two endpoints on the Dharmamitra tagging API:
     * - /api-tagging/tagging/           simple, no compound distinction
     * - /api-tagging/tagging-parsed/    rich, compounds marked with hyphens
     */
    const url = preserveCompoundHyphens
      ? 'https://dharmamitra.org/api-tagging/tagging-parsed/'
      : 'https://dharmamitra.org/api-tagging/tagging/';

    const sentences = textInput.split('\n');
    const results = [];

    for (let i = 0; i < sentences.length; i += batchSize) {
      const batch = sentences.slice(i, i + batchSize);
      const data = preserveCompoundHyphens
        ? { texts: batch, mode: 'unsandhied-lemma-morphosyntax', human_readable_tags: false, grammar_type: 'western' }
        : { texts: batch };

      let success = false;
      for (let j = 0; j <= retries; j++) {
        const response = await fetch(url, {
          method: 'POST',
          headers: HEADERS,
          body: JSON.stringify(data),
        });
        if (response.ok) {
          const json = await response.json();
          const batchResult = preserveCompoundHyphens
            ? this._parseDharmamitraParsedResult(json)
            : this._parseDharmamitraSimpleResult(json);
          results.push(...batchResult);
          success = true;
          break;
        } else if (j < retries) {
          console.warn(`retrying batch in ${RETRY_DELAY_MS / 1000} sec`);
          await sleep(RETRY_DELAY_MS);
        } else {
          throw new Error(`Dharmamitra batch failed (status ${response.status}): ${JSON.stringify(batch)}`);
        }
      }
    }

    return results;
  }

  async _postString2018(inputText, url = SPLITTER_SERVER_URL, batchSize = 10000, retries = 1) {
    const sentences = inputText.split('\n');
    const results = [];

    for (let i = 0; i < sentences.length; i += batchSize) {
      const batch = sentences.slice(i, i + batchSize);
      const batchText = batch.join('\n');
      const data = { input_text: batchText };

      for (let j = 0; j <= retries; j++) {
        const response = await fetch(url, {
          method: 'POST',
          headers: HEADERS,
          body: JSON.stringify(data),
        });
        if (response.ok) {
          const json = await response.json();
          results.push(json.output_text);
          break;
        } else if (j < retries) {
          console.warn(`retrying batch in ${RETRY_DELAY_MS / 1000} sec`);
          await sleep(RETRY_DELAY_MS);
        } else {
          throw new Error(`2018 splitter batch failed (status ${response.status}): ${JSON.stringify(batch)}`);
        }
      }
    }

    return results.join('\n');
  }

  _cleanUp2018(splitSentencesStr, splitAppearance = ' ') {
    let s = splitSentencesStr;
    s = s.replace(/-\n/g, '\n');                         // remove line-final hyphens
    s = s.replace(/-/g, splitAppearance);                // modify appearance of splits
    s = s.replace(/=/g, '');                             // remove = chars
    s = s.replace(/(^\s*)|(\s*$)/g, '');                 // strip leading/trailing whitespace
    return s.split('\n');
  }

  _restoreSentences(sentences, sentenceCounts) {
    const restored = [];
    let i = 0;
    for (const count of sentenceCounts) {
      restored.push(sentences.slice(i, i + count).join(' '));
      i += count;
    }
    return restored;
  }

  _restorePunctuation(sentences, punctuation, markers) {
    const sentencesCopy = [...sentences];
    const punctuationCopy = [...punctuation];
    const result = [];
    for (const marker of markers) {
      if (marker === 'content') {
        result.push(sentencesCopy.shift());
      } else {
        result.push(punctuationCopy.shift());
      }
    }
    return result.join('');
  }

  async split(
    text,
    fromScheme = null,
    toScheme = null,
    splitterModel = 'dharmamitra_2024_sept',
    preserveCompoundHyphens = PRESERVE_COMPOUND_HYPHENS_DEFAULT,
    preservePunctuation = PRESERVE_PUNCTUATION_DEFAULT,
  ) {
    /**
     * Splits sandhi and compounds of multi-line Sanskrit string,
     * passing maximum of maxCharLimit characters to the splitter at a time,
     * and preserving original newlines and punctuation.
     *
     * fromScheme: input transliteration scheme (null = auto-detect).
     * toScheme:   output transliteration scheme (null = IAST, the hub scheme).
     * Processing always happens in IAST; transliteration wraps the call if needed.
     *
     * Returns a Promise<string>.
     */

    // transliterate input to IAST (auto-detects if fromScheme is null)
    const T = new Transliterator();
    text = T.transliterate(text, fromScheme, 'IAST');

    // save original punctuation
    const { sentences, punctuation, markers } = this._getSentencesAndPunctuation(text);
    if (punctuation.length - sentences.length > 1) {
      throw new Error('Punctuation and sentence count mismatch');
    }

    // split sentences that are too long for the splitter
    const hyphenKey = preserveCompoundHyphens ? 'hyphens' : 'no-hyphens';
    const limitKey = `${splitterModel},${hyphenKey}`;
    const charLimit = this.maxCharLimit[limitKey] || 128;

    const { newTextLines: safeSentences, sentenceCounts } = this._enforceCharLimit(sentences, charLimit);
    const sentencesStr = safeSentences.join('\n');

    let splitSentences;

    if (splitterModel === 'dharmamitra_2024_sept') {
      splitSentences = await this._getDharmamitraSplit(sentencesStr, preserveCompoundHyphens);
    } else if (splitterModel === 'splitter_2018') {
      const splitStr = await this._postString2018(sentencesStr);
      splitSentences = this._cleanUp2018(splitStr);
    } else {
      throw new Error(`Invalid splitter model: ${splitterModel}`);
    }

    // restore sentences split to enforce character limit
    const restoredSentences = this._restoreSentences(splitSentences, sentenceCounts);

    // restore punctuation
    let finalResults;
    if (preservePunctuation && punctuation.length > 0) {
      finalResults = this._restorePunctuation(restoredSentences, punctuation, markers);
    } else {
      finalResults = restoredSentences.join('\n').replace(/_/g, ' ');
    }

    // transliterate output from IAST if requested
    if (toScheme !== null && toScheme.toUpperCase() !== 'IAST') {
      finalResults = T.transliterate(finalResults, 'IAST', toScheme);
    }

    return finalResults;
  }
}
