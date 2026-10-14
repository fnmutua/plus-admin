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
 * Entities this question counts.
 *
 * Both the counting word and the entity are matched on near-spellings, and
 * against the corrected words retrieval resolved as well as what was typed:
 * "umber of settleemnts in kenya" is a question about the register, and
 * checking the literal spelling sent it to the documents, which answered that
 * they do not state Kenya's total.
 *
 * @param {string} question
 * @param {string[]} [terms] Words already corrected against the index.
 */
function wanted(question, terms = []) {
  const tokens = [...tokenise(question), ...terms]
  if (!COUNT_QUESTION.test(question) && !matchesAny(tokens, COUNT_WORDS)) return []

  return ENTITIES.filter((entity) =>
    entity.match.test(question) || matchesAny(tokens, entity.words))
}

const asksForCount = (question, terms = []) => wanted(question, terms).length > 0

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
 * @returns {Promise<string|null>} A text block for the context, or null when
 *          nothing matched or the database could not be read.
 */
async function counts(question, terms = []) {
  const entities = wanted(question, terms)
  if (!entities.length) return null

  let db
  try {
    db = require('../../models')
  } catch (error) {
    console.warn('[ai] register counts unavailable:', error.message)
    return null
  }

  const parts = []

  for (const entity of entities) {
    const model = db.models[entity.model]
    if (!model) continue

    try {
      const total = await model.count()
      const lines = [`${entity.label}: ${total.toLocaleString()} in total`]

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

  return 'Current counts from the KeSMIS database (authoritative, not from any document):\n'
    + parts.join('\n')
}

module.exports = { counts, asksForCount }
