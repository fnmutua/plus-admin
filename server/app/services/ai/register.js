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
// Asking for the answer in a particular shape says nothing about what to look
// up, so these must not make a question look unanswered: "list the top ten
// slums by population" was fully answered, yet "list" left over and pulled in
// twelve document excerpts beside the table.
const ASKING_WORDS = [
  'list', 'listing', 'show', 'give', 'name', 'names', 'tell',
  'rank', 'ranked', 'ranking', 'order', 'ordered', 'sorted', 'which'
]

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

/**
 * Ranking questions: "top ten slums by population", "largest settlements".
 *
 * A count cannot answer these and no document holds the register's own
 * figures, so asked for the top ten by population the assistant could only
 * say the excerpts do not provide them and ask the user for the data it is
 * sitting on.
 */
// "top" and "most" are matched exactly: at one edit a three-letter word turns
// into half the dictionary ("stop", "two").
const RANK_EXACT = ['top', 'most', 'best']
const RANK_WORDS = ['largest', 'biggest', 'highest', 'leading', 'ranked', 'ranking', 'greatest']
const SMALLEST_WORDS = ['smallest', 'lowest', 'fewest', 'least']

/** Columns a settlement can be ranked by, and the words that ask for each. */
const MEASURES = [
  {
    column: 'population',
    label: 'population',
    words: ['population', 'populations', 'people', 'residents', 'inhabitants', 'populous']
  },
  { column: 'num_households', label: 'households', words: ['households', 'household'] },
  { column: 'pop_density', label: 'population density', words: ['density'] },
  { column: 'area', label: 'area', words: ['area', 'acreage', 'hectares'] }
]

const NUMBER_WORDS = {
  three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  twelve: 12, fifteen: 15, twenty: 20, thirty: 30, fifty: 50
}

const asksForRanking = (question, terms = []) => {
  const tokens = [...tokenise(question), ...terms]
  return (tokens.some((token) => RANK_EXACT.includes(token))
    || matchesAny(tokens, [...RANK_WORDS, ...SMALLEST_WORDS]))
    && MEASURES.some((measure) => matchesAny(tokens, measure.words))
}

/**
 * How many rows to return. Years are not list lengths, so only 1-3 digits.
 *
 * Number words are matched exactly: allowed one edit, "sit top ten slums"
 * matched "six" before it reached "ten", and returned six rows.
 */
function rankLimit(question, tokens) {
  const digits = String(question).match(/\b(\d{1,3})\b/)
  if (digits) return Math.min(Math.max(Number(digits[1]), 1), 50)

  for (const [word, value] of Object.entries(NUMBER_WORDS)) {
    if (tokens.includes(word)) return value
  }
  return 10
}

/**
 * The ranked settlements a question asks for, or null when it asks for none.
 *
 * Approved settlements only, and said so in the block: a decommissioned
 * settlement in a league table is a wrong answer, and silently dropping it
 * without saying so is a different wrong answer.
 */
async function ranking(db, question, tokens, types) {
  if (!asksForRanking(question, tokens)) return null

  const measure = MEASURES.find((entry) => matchesAny(tokens, entry.words))
  if (!measure) return null

  const ascending = matchesAny(tokens, SMALLEST_WORDS)
  const limit = rankLimit(question, tokens)
  const labels = types.map((type) => type.label.toLowerCase())

  const conditions = [
    `s."${measure.column}" IS NOT NULL`,
    `s."${measure.column}" > 0`,
    `s."isApproved" = 'Approved'`
  ]
  const bind = []
  if (labels.length) {
    conditions.push(`lower(trim(s.settlement_type)) IN (${labels.map((_, i) => `$${i + 1}`).join(', ')})`)
    bind.push(...labels)
  }

  // The column and the limit come from the whitelist above, never from the
  // question; the type labels are bound.
  const [rows] = await db.sequelize.query(
    `SELECT s.name, c.name AS county, s."${measure.column}"::numeric AS value
       FROM settlement s
       LEFT JOIN county c ON c.id = s.county_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY s."${measure.column}" ${ascending ? 'ASC' : 'DESC'}, s.name ASC
      LIMIT ${limit}`,
    { bind }
  )

  if (!rows.length) return null

  const scope = labels.length ? ` of type ${types.map((type) => `"${type.label}"`).join(' or ')}` : ''
  const heading = `${ascending ? 'Lowest' : 'Top'} ${rows.length} settlements${scope} by `
    + `${measure.label}, from the KeSMIS database (approved settlements only):`
  const lines = rows.map((row, index) =>
    `${index + 1}. ${row.name} (${row.county || 'county not recorded'}) — `
    + `${measure.label} ${Number(row.value).toLocaleString()}`)

  return { measure, text: [heading, ...lines].join('\n') }
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
async function lookup(question, terms = []) {
  const counting = asksForCount(question, terms)
  if (!counting && !asksForRanking(question, terms)) return null

  let db
  try {
    db = require('../../models')
  } catch (error) {
    console.warn('[ai] register lookup unavailable:', error.message)
    return null
  }

  const tokens = [...tokenise(question), ...terms]
  const types = await typeCounts(db, tokens).catch((error) => {
    console.warn('[ai] could not count settlement types:', error.message)
    return []
  })

  const ranked = await ranking(db, question, tokens, types).catch((error) => {
    console.warn('[ai] could not rank settlements:', error.message)
    return null
  })

  // A ranking question is not a counting question, so the counts are only
  // built when one was actually asked for.
  const named = wanted(question, tokens)
  const entities = counting ? [...named] : []
  // Naming a type is asking about settlements, whether or not the word
  // "settlement" appears: "how many slums are there" is the same question.
  if (counting && types.length && SETTLEMENTS && !entities.includes(SETTLEMENTS)) {
    entities.unshift(SETTLEMENTS)
  }
  if (!entities.length && !ranked) return null

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

  if (!parts.length && !ranked) return null

  // Anything in the question the register did not account for — a place name,
  // a year — still has to be looked up in the documents. Nothing left over
  // means the register's own figures are the whole answer.
  const accounted = [
    ...COUNT_WORDS,
    ...SCOPE_WORDS,
    ...RANK_EXACT,
    ...RANK_WORDS,
    ...SMALLEST_WORDS,
    ...Object.keys(NUMBER_WORDS),
    ...ASKING_WORDS,
    ...MEASURES.flatMap((measure) => measure.words),
    // Every entity the question names, counted or merely ranked.
    ...named.flatMap((entity) => entity.words),
    ...types.flatMap((type) => typeWords(type.label))
  ]
  const leftover = terms.filter((term) => !matchesAny([term], accounted))

  const blocks = []
  if (ranked) blocks.push(ranked.text)
  if (parts.length) {
    blocks.push('Current counts from the KeSMIS database (authoritative, not from any document).'
      + ' These are register-wide totals, not filtered by place or date:\n'
      + parts.join('\n'))
  }

  return { text: blocks.join('\n\n'), exhaustive: leftover.length === 0, leftover }
}

module.exports = { lookup, asksForCount, asksForRanking }
