'use strict'

// Counts from the operational database, for questions the documents cannot
// answer.
//
// "How many settlements are in the register?" is a question about the
// register, not about any document in it. Asked of the index alone, the
// assistant answered "60 indexed document entries" against a true 1,049 —
// confidently wrong, because documents are all it can see. These counts come
// from the tables themselves.

const { matchesAny, tokenise } = require('./words')

const ENTITIES = [
  {
    key: 'settlements',
    label: 'Settlements',
    match: /\bsettlements?\b/i,
    words: ['settlement', 'settlements'],
    model: 'settlement',
    // Breakdowns worth volunteering: a bare total hides that 37 are
    // decommissioned and 8 still pending review.
    groupBy: [
      { column: 'isApproved', label: 'by status' },
      { column: 'settlement_type', label: 'by type' }
    ]
  },
  {
    key: 'documents',
    label: 'Documents',
    match: /\b(documents?|files?|uploads?)\b/i,
    words: ['document', 'documents', 'uploads'],
    model: 'document',
    groupBy: [{ column: 'aiProcessed', label: 'indexed for search' }]
  },
  {
    key: 'projects',
    label: 'Projects',
    match: /\bprojects?\b/i,
    words: ['project', 'projects'],
    model: 'project',
    groupBy: []
  },
  {
    key: 'grievances',
    label: 'Grievances',
    match: /\bgrievances?\b/i,
    words: ['grievance', 'grievances'],
    model: 'grievance',
    groupBy: [{ column: 'status', label: 'by status' }]
  },
  {
    key: 'incidents',
    label: 'Incidents',
    match: /\bincidents?\b/i,
    words: ['incident', 'incidents'],
    model: 'incident',
    groupBy: [{ column: 'status', label: 'by status' }]
  }
]

/**
 * A counting question about the register rather than about document text.
 *
 * Deliberately narrow: "how many settlements", "total number of projects",
 * "count of grievances". A question about what a document *says* is left to
 * retrieval.
 */
const COUNT_QUESTION = /\b(how many|number of|count of|total (number|count)?)\b/i

/** The same ask, allowing for typos: "umber of", "hwo mnay", "toatl". */
const COUNT_WORDS = ['number', 'numbers', 'count', 'total', 'many', 'tally']

/**
 * Is this a counting question at all?
 *
 * Matched on near-spellings, and against the corrected words retrieval
 * resolved as well as what was typed: "umber of settleemnts in kenya" is a
 * question about the register, and checking the literal spelling sent it to
 * the documents, which answered that they do not state Kenya's total.
 *
 * @param {string} question
 * @param {string[]} [terms] Words already corrected against the index.
 */
const asksForCount = (question, terms = []) =>
  COUNT_QUESTION.test(question) || matchesAny([...tokenise(question), ...terms], COUNT_WORDS)

// Words that name the register itself rather than anything to look up in a
// document: "how many slums are in kenya" is answered in full by the counts,
// and the excerpts sent beside them only invited a table of every source with
// a count of 0 against each.
const SCOPE_WORDS = [
  'kenya', 'kenyan', 'country', 'countrywide', 'nationwide', 'national',
  'register', 'registered', 'recorded', 'records', 'system', 'kesmis',
  'database', 'total', 'there', 'altogether', 'overall'
]

/** The entities a counting question names outright. */
const wanted = (question, tokens) =>
  ENTITIES.filter((entity) => entity.match.test(question) || matchesAny(tokens, entity.words))

const SETTLEMENTS = ENTITIES.find((entity) => entity.key === 'settlements')

// Settlement types are a managed list now, so the words that name one are not
// known here: "how many slums in Kenya" names a type, not the entity, and
// matched nothing — the answer was "the excerpts contain no register count for
// slums". The list is read from the table and cached, since it is tiny, rarely
// edited, and consulted on every counting question.
const TYPE_CACHE_MS = 5 * 60 * 1000
let typeCache = { at: 0, labels: [] }

/** Words that distinguish one type from another: "Informal Settlement" → informal. */
const SHARED_TYPE_WORDS = new Set(['settlement', 'settlements', 'area', 'areas', 'type', 'types'])
const typeWords = (label) =>
  tokenise(label).filter((word) => word.length >= 4 && !SHARED_TYPE_WORDS.has(word))

async function settlementTypeLabels(db) {
  if (Date.now() - typeCache.at < TYPE_CACHE_MS) return typeCache.labels

  const model = db.models.settlement_type
  if (!model) return []

  const rows = await model.findAll({ attributes: ['type'], raw: true })
  const labels = rows.map((row) => String(row.type || '').trim()).filter(Boolean)
  typeCache = { at: Date.now(), labels }
  return labels
}

/**
 * Counts for the settlement types this question names, if any.
 *
 * A plural is one edit away from its singular, so "slums" finds "Slum"
 * without the list having to spell both.
 */
async function typeCounts(db, tokens) {
  const labels = await settlementTypeLabels(db)
  const named = labels.filter((label) => {
    const words = typeWords(label)
    return words.length && words.some((word) => matchesAny(tokens, [word]))
  })
  if (!named.length) return []

  const rows = await groupCounts(db, 'settlement', 'settlement_type')
  const byLabel = new Map(
    rows.map((row) => [String(row.value ?? '').trim().toLowerCase(), row.total])
  )

  return named.map((label) => ({ label, total: byLabel.get(label.toLowerCase()) || 0 }))
}

/** Count rows per value of a column, largest group first. */
async function groupCounts(db, modelName, column) {
  const model = db.models[modelName]
  if (!model || !model.rawAttributes[column]) return []

  const rows = await model.findAll({
    attributes: [column, [db.sequelize.fn('count', db.sequelize.col('*')), 'total']],
    group: [column],
    order: [[db.sequelize.literal('total'), 'DESC']],
    raw: true
  })

  return rows
    .map((row) => ({ value: row[column], total: Number(row.total) }))
    .filter((row) => row.total > 0)
}

/**
 * Counts for whichever entities the question names.
 *
 * @param {string} question
 * @param {string[]} [terms] Corrected question words, from retrieval.
 * @returns {Promise<{text: string, exhaustive: boolean, leftover: string[]}|null>}
 *          A block for the context, with whether it answers the question on
 *          its own; null when nothing matched or the database was unreadable.
 */
async function counts(question, terms = []) {
  if (!asksForCount(question, terms)) return null

  let db
  try {
    db = require('../../models')
  } catch (error) {
    console.warn('[ai] register counts unavailable:', error.message)
    return null
  }

  const tokens = [...tokenise(question), ...terms]
  const types = await typeCounts(db, tokens).catch((error) => {
    console.warn('[ai] could not count settlement types:', error.message)
    return []
  })

  const entities = wanted(question, tokens)
  // Naming a type is asking about settlements, whether or not the word
  // "settlement" appears: "how many slums are there" is the same question.
  if (types.length && SETTLEMENTS && !entities.includes(SETTLEMENTS)) entities.unshift(SETTLEMENTS)
  if (!entities.length) return null

  const parts = []

  for (const entity of entities) {
    const model = db.models[entity.model]
    if (!model) continue

    try {
      const total = await model.count()
      const lines = [`${entity.label}: ${total.toLocaleString()} in total`]

      // The type the question asked about, stated plainly before the
      // breakdowns, so it is not left to be read out of a list.
      if (entity === SETTLEMENTS) {
        for (const type of types) {
          lines.push(`  of type "${type.label}": ${type.total.toLocaleString()}`)
        }
      }

      for (const group of entity.groupBy) {
        const rows = await groupCounts(db, entity.model, group.column)
        if (!rows.length) continue
        const summary = rows
          .slice(0, 8)
          .map((row) => `${row.value === null ? 'not set' : row.value} ${row.total.toLocaleString()}`)
          .join(', ')
        lines.push(`  ${group.label}: ${summary}`)
      }

      parts.push(lines.join('\n'))
    } catch (error) {
      // One unreadable table should not deny the other counts.
      console.warn(`[ai] could not count ${entity.model}:`, error.message)
    }
  }

  if (!parts.length) return null

  // Anything in the question the register did not account for — a place name,
  // a year — still has to be looked up in the documents. Nothing left over
  // means the counts are the whole answer.
  const accounted = [
    ...COUNT_WORDS,
    ...SCOPE_WORDS,
    ...entities.flatMap((entity) => entity.words),
    ...types.flatMap((type) => typeWords(type.label))
  ]
  const leftover = terms.filter((term) => !matchesAny([term], accounted))

  const text = 'Current counts from the KeSMIS database (authoritative, not from any document).'
    + ' These are register-wide totals, not filtered by place or date:\n'
    + parts.join('\n')

  return { text, exhaustive: leftover.length === 0, leftover }
}

module.exports = { counts, asksForCount }
