'use strict'

// Word comparison shared by the question routers.
//
// Questions arrive misspelled often enough that no router can trust a literal
// spelling: "umber of settleemnts in kenya" is a counting question about the
// register, and "give me a lst of counties" asks for an enumeration. Both the
// register and the catalogue match on near-spellings, so the test lives here
// rather than being duplicated with two different thresholds.

/** Levenshtein distance, bounded — only small distances matter here. */
function editDistance(a, b, max = 2) {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i]
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
    previous = current
  }

  return previous[b.length]
}

/**
 * Is any of `tokens` this word, or a near-miss of it?
 *
 * Longer words are allowed two edits, short ones one: at two edits a
 * five-letter word turns into a different word altogether.
 */
const matchesAny = (tokens, words) =>
  tokens.some((token) =>
    token.length >= 3
    && words.some((word) => editDistance(token, word) <= (word.length > 6 ? 2 : 1)))

/** Words of a question, lower-cased, punctuation dropped. */
const tokenise = (question) =>
  String(question).toLowerCase().split(/[^a-z]+/).filter(Boolean)

module.exports = { editDistance, matchesAny, tokenise }
