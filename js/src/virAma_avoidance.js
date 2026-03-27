// Regex rules for avoiding virāma in Indic scripts
import { SLP_vowels, SLP_unvoiced_consonants, SLP_voiced_consonants } from './phonemes.js';

// Set up regex components
const vowels = SLP_vowels.join('');
const unvoicedConsonants = SLP_unvoiced_consonants.join('');
const unvoicedConsonantsSubset = ['k','K','t','T','p','P','s'].join('');
const voicedConsonants = SLP_voiced_consonants.join('');

/*
The following regexes aim at avoiding virāma and space,
especially in Indic scripts.

All are replaced by '$1$2', thereby simply removing the space.

This list is by no means fixed or exhaustive and is meant to be customized.
*/

export const replacements = [
  // these spaces generally disliked among modern scholars, never (?) seen in mss
  [`(y) ([${vowels}])`, '$1$2'],
  [`(v) ([${vowels}])`, '$1$2'],
  [`(r) ([${vowels}])`, '$1$2'],
  [`(r) ([${voicedConsonants}])`, '$1$2'],
  // these spaces may be used for clarity among modern scholars, rare in mss
  [`([kwp]) ([${unvoicedConsonants}])`, '$1$2'],
  ['(c) (c)', '$1$2'],
  [`([gqb]) ([${voicedConsonants}])`, '$1$2'],
  ['(j) (j)', '$1$2'],
  ['(Y) ([cCjJ])', '$1$2'],
  [`(d) ([${voicedConsonants}])`, '$1$2'],
  ['(l) (l)', '$1$2'],
  ['(S) ([cCS])', '$1$2'],
  ['(s) ([tTs])', '$1$2'],
  // these spaces are more common and very much depend on the scribe or editor
  [`([gqb]) ([${vowels}])`, '$1$2'],
  [`(d) ([${vowels}])`, '$1$2'],
  [`(t) ([${unvoicedConsonantsSubset}])`, '$1$2'], // because e.g. t + ś >> c ch
  [`(n) ([${vowels}])`, '$1$2'],
  [`(n) ([${voicedConsonants}])`, '$1$2'],
  [`(m) ([${vowels}])`, '$1$2'],
];

// the following is just space for notes to cut-and-paste above or vice versa
export const replacementsMore = [
  // this space is sometimes removed by some modern scholars
  ["([Aeo]) (')", '$1$2'],
];

// Function to apply virāma avoidance rules
export function avoidVirama(text, useMoreReplacements = false) {
  let result = text;
  
  const rulesToApply = useMoreReplacements ? 
    [...replacements, ...replacementsMore] : 
    replacements;
  
  for (const [pattern, replacement] of rulesToApply) {
    const regex = new RegExp(pattern, 'g');
    result = result.replace(regex, replacement);
  }
  
  return result;
}