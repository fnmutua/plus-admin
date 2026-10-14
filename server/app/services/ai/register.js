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
const COUNT_QUESTION = /\b(how many|number of|count of|total (number|count)?|no\.)\b/i

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
  'database', 'total', 'there', 'altogether', 'overall',
  'county', 'counties', 'countyid',
  'subcounty', 'subcounties', 'subcountyid',
  'ward', 'wards', 'wardid'
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
let placeCache = { at: 0, maps: null }

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

const PLACE_COLUMN = { county: 'county_id', subcounty: 'subcounty_id', ward: 'ward_id' }

const PLACE_IDS = [
  { kind: 'ward', labels: ['wardid', 'ward'] },
  { kind: 'subcounty', labels: ['subcountyid', 'subcounty'] },
  { kind: 'county', labels: ['countyid', 'county'] }
]

async function placeMaps(db) {
  if (placeCache.maps && Date.now() - placeCache.at < TYPE_CACHE_MS) return placeCache.maps

  const read = async (modelName, fields) => {
    const model = db.models[modelName]
    if (!model) return []
    const rows = await model.findAll({ attributes: fields, raw: true })
    return rows
      .map((row) => ({
        id: Number(row.id),
        name: String(row.name || '').trim(),
        county_id: row.county_id == null ? null : Number(row.county_id),
        subcounty_id: row.subcounty_id == null ? null : Number(row.subcounty_id)
      }))
      .filter((row) => row.id && row.name)
  }

  const [counties, subs, wards] = await Promise.all([
    read('county', ['id', 'name']),
    read('subcounty', ['id', 'name', 'county_id']),
    read('ward', ['id', 'name', 'county_id', 'subcounty_id'])
  ])

  placeCache = {
    at: Date.now(),
    maps: {
      counties,
      subs,
      wards,
      countyById: new Map(counties.map((row) => [row.id, row])),
      subById: new Map(subs.map((row) => [row.id, row]))
    }
  }
  return placeCache.maps
}

/**
 * A typed word is this label, or a misspelling of about the same length.
 *
 * "county" is three edits from "subcounty". Allowed as a match, the word
 * "county" was read as a subcounty question, the subcounty was not found,
 * and the county itself was then skipped — "settlements in Machakos county"
 * came back as the national total.
 */
function closeLabel(token, words) {
  return words.some((word) => {
    if (token === word) return true
    if (token.length + 2 < word.length) return false
    return matchesAny([token], [word])
  })
}

const mentions = (tokens, words) => tokens.some((token) => closeLabel(token, words))

/** "county id 16", "subcountyid 80", "ward id 394". The number itself is exact. */
function idsInQuestion(question) {
  const parts = String(question).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  const found = {}

  for (let i = 0; i < parts.length; i += 1) {
    // "sub county id 80" is a subcounty, not county 80.
    if (matchesAny([parts[i]], ['sub']) && matchesAny([parts[i + 1] || ''], ['county'])) {
      const number = ['id', 'no', 'number'].includes(parts[i + 2]) ? parts[i + 3] : parts[i + 2]
      if (/^\d{1,4}$/.test(number || '')) found.subcounty = Number(number)
    }

    for (const spec of PLACE_IDS) {
      const glued = parts[i].match(/^([a-z]+)(\d{1,4})$/)
      if (glued && closeLabel(glued[1], spec.labels)) {
        found[spec.kind] = Number(glued[2])
        continue
      }
      if (closeLabel(parts[i], [spec.labels[0]]) && /^\d{1,4}$/.test(parts[i + 1] || '')) {
        found[spec.kind] = Number(parts[i + 1])
        continue
      }
      if (
        closeLabel(parts[i], [spec.labels[1]])
        && ['id', 'no', 'number'].includes(parts[i + 1])
        && /^\d{1,4}$/.test(parts[i + 2] || '')
        && !(spec.kind === 'county' && i > 0 && matchesAny([parts[i - 1]], ['sub']))
      ) found[spec.kind] = Number(parts[i + 2])
    }
  }

  return found
}

// Ordinary question words are not place names. One edit turned "are" into the
// ward "Lare", and "number" into "Ndumberi", so a national question came back
// as a single ward. Built on first use: the rank and measure lists are
// declared further down.
let notAPlace = null
function reservedPlaceTokens() {
  if (notAPlace) return notAPlace
  notAPlace = new Set([
    ...COUNT_WORDS,
    ...SCOPE_WORDS,
    ...ASKING_WORDS,
    ...RANK_EXACT,
    ...RANK_WORDS,
    ...SMALLEST_WORDS,
    ...Object.keys(NUMBER_WORDS),
    ...MEASURES.flatMap((measure) => measure.words),
    ...ENTITIES.flatMap((entity) => entity.words),
    'how', 'are', 'the', 'for', 'and', 'with', 'from', 'that', 'this',
    'what', 'which', 'where', 'when', 'into', 'per'
  ])
  return notAPlace
}

/** A name word matches a question word exactly, or loosely when both are long. */
function nameWordMatches(word, tokens) {
  const reserved = reservedPlaceTokens()
  return tokens.some((token) => {
    if (token === word) return true
    if (word.length < 6 || token.length < 6 || reserved.has(token)) return false
    return matchesAny([token], [word])
  })
}

/**
 * Places whose whole name appears in the question, longest name first.
 *
 * A shorter name that is only the start of a longer one is dropped: "Athi"
 * is not a second match once "Athi River" has matched.
 */
function namedRows(rows, tokens) {
  const hits = rows.filter((row) => {
    const words = tokenise(row.name).filter((word) => word.length >= 3)
    return words.length > 0 && words.every((word) => nameWordMatches(word, tokens))
  })
  const kept = hits.filter((hit) => {
    const words = tokenise(hit.name)
    return !hits.some((other) => {
      if (other === hit) return false
      const longer = tokenise(other.name)
      return longer.length > words.length && words.every((word) => longer.includes(word))
    })
  })
  // "Kiambu" must not also select "Kiambaa" once the exact name is present.
  const exact = kept.filter((row) => {
    const words = tokenise(row.name).filter((word) => word.length >= 3)
    return words.every((word) => tokens.includes(word))
  })
  const chosen = exact.length ? exact : kept
  chosen.sort((a, b) => tokenise(b.name).length - tokenise(a.name).length || b.name.length - a.name.length)
  return chosen
}

function describePlace(row, kind, maps) {
  const county = row.county_id ? maps.countyById.get(row.county_id) : null
  const sub = row.subcounty_id ? maps.subById.get(row.subcounty_id) : null
  return {
    kind,
    id: row.id,
    name: row.name,
    countyName: county ? county.name : null,
    subcountyName: sub ? sub.name : null
  }
}

function oneOrAmbiguous(hits, kind, maps) {
  if (hits.length === 1) return describePlace(hits[0], kind, maps)
  if (hits.length > 1) {
    return { ambiguous: true, kind, options: hits.map((row) => describePlace(row, kind, maps)) }
  }
  return null
}

/**
 * The place this question is about, or null.
 *
 * A ward id, then a subcounty id, then a county id. Failing an id, the name.
 * The most specific named place wins: "Machakos Town" is the subcounty, not
 * the county Machakos. A ward name shared by several wards is not guessed.
 */
async function placeInQuestion(db, question, tokens) {
  const maps = await placeMaps(db)
  const written = idsInQuestion(question)

  if (written.ward) {
    const row = maps.wards.find((item) => item.id === written.ward)
    if (row) return describePlace(row, 'ward', maps)
  }
  if (written.subcounty) {
    const row = maps.subs.find((item) => item.id === written.subcounty)
    if (row) return describePlace(row, 'subcounty', maps)
  }
  if (written.county) {
    const row = maps.counties.find((item) => item.id === written.county)
    if (row) return describePlace(row, 'county', maps)
  }

  const exactName = (row) => {
    const words = tokenise(row.name).filter((word) => word.length >= 3)
    return words.length > 0 && words.every((word) => tokens.includes(word))
  }

  const asksWard = mentions(tokens, ['ward', 'wards', 'wardid'])
  const asksSub = mentions(tokens, ['subcounty', 'subcounties', 'subcountyid'])
    || tokens.some((token, index) => matchesAny([token], ['sub']) && matchesAny([tokens[index + 1] || ''], ['county']))
  const asksCounty = !asksSub && mentions(tokens, ['county', 'counties', 'countyid'])

  const countyHits = namedRows(maps.counties, tokens)
  const county = countyHits[0] || null
  let subHits = namedRows(maps.subs, tokens)
  let wardHits = namedRows(maps.wards, tokens)
  if (county) {
    subHits = subHits.filter((row) => row.county_id === county.id)
    wardHits = wardHits.filter((row) => row.county_id === county.id)
  }
  if (subHits.length === 1) {
    wardHits = wardHits.filter((row) => row.subcounty_id === subHits[0].id)
  }

  // "Kiambu" is the county, even though a subcounty has the same name.
  // A longer exact name, such as "Machakos Town", is left in place.
  if (county && exactName(county) && !asksSub && !asksWard) {
    const countyName = tokenise(county.name).join(' ')
    subHits = subHits.filter((row) => exactName(row) && tokenise(row.name).join(' ') !== countyName)
    wardHits = wardHits.filter(exactName)
  }

  // "in Machakos county" is the county, not a ward whose name is a near miss.
  if (asksCounty && county && exactName(county) && !asksWard) {
    return describePlace(county, 'county', maps)
  }

  // "Ward" selects a ward. Otherwise a subcounty of that name wins, including
  // when a ward shares it. A ward name alone still matches when no subcounty does.
  if (asksWard) {
    const ward = oneOrAmbiguous(wardHits, 'ward', maps)
    if (ward) return ward
  } else if (subHits.length) {
    // "Kiambu" said on its own is the county when a subcounty has the same
    // name. "Machakos Town" is longer than the county, so it stays a subcounty.
    const countyName = county ? tokenise(county.name).join(' ') : ''
    const distinct = asksSub || !countyName
      ? subHits
      : subHits.filter((row) => tokenise(row.name).join(' ') !== countyName)
    const sub = oneOrAmbiguous(distinct, 'subcounty', maps)
    if (sub) return sub
  } else {
    const ward = oneOrAmbiguous(wardHits, 'ward', maps)
    if (ward) return ward
  }

  if (county && !asksWard && !asksSub) return describePlace(county, 'county', maps)
  return null
}

function placeLabel(place) {
  if (place.kind === 'ward') {
    const parents = [place.subcountyName, place.countyName].filter(Boolean).join(', ')
    return `${place.name} ward${parents ? ` (${parents})` : ''} (ward ID ${place.id})`
  }
  if (place.kind === 'subcounty') {
    const county = place.countyName ? `, ${place.countyName}` : ''
    return `${place.name} subcounty${county} (subcounty ID ${place.id})`
  }
  return `${place.name} (county ID ${place.id})`
}

function ambiguousPlaceText(place) {
  const options = place.options.slice(0, 8)
    .map((option) => `  ${placeLabel(option)}`)
    .join('\n')
  const more = place.options.length > 8 ? `\n  …and ${place.options.length - 8} more` : ''
  return `More than one ${place.kind} has that name, so there is no single count. `
    + `Ask again with one of these:\n${options}${more}`
}

/**
 * Counts for the settlement types this question names, if any.
 *
 * A plural is one edit away from its singular, so "slums" finds "Slum"
 * without the list having to spell both.
 */
async function typeCounts(db, tokens, where) {
  const labels = await settlementTypeLabels(db)
  const named = labels.filter((label) => {
    const words = typeWords(label)
    return words.length && words.some((word) => matchesAny(tokens, [word]))
  })
  if (!named.length) return []

  const rows = await groupCounts(db, 'settlement', 'settlement_type', where)
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
async function ranking(db, question, tokens, types, place) {
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
  if (place && PLACE_COLUMN[place.kind]) {
    conditions.push(`s.${PLACE_COLUMN[place.kind]} = $${bind.length + 1}`)
    bind.push(place.id)
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
  const where = place ? ` in ${placeLabel(place)}` : ''
  const heading = `${ascending ? 'Lowest' : 'Top'} ${rows.length} settlements${scope}${where} by `
    + `${measure.label}, from the KeSMIS database (approved settlements only):`
  const lines = rows.map((row, index) =>
    `${index + 1}. ${row.name} (${row.county || 'county not recorded'}) — `
    + `${measure.label} ${Number(row.value).toLocaleString()}`)

  return { measure, text: [heading, ...lines].join('\n') }
}

/** Count rows per value of a column, largest group first. */
async function groupCounts(db, modelName, column, where) {
  const model = db.models[modelName]
  if (!model || !model.rawAttributes[column]) return []

  const rows = await model.findAll({
    attributes: [column, [db.sequelize.fn('count', db.sequelize.col('*')), 'total']],
    where: where || undefined,
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
  let counting = asksForCount(question, terms)
  const rankingAsked = asksForRanking(question, terms)
  // "settlements in Mavoko" names a place and nothing else to look up.
  // It never says "how many", so it used to miss the register and the
  // answer was that the excerpts do not state the total.
  const tokensPreview = [...tokenise(question), ...terms]
  const namesSettlements = matchesAny(tokensPreview, SETTLEMENTS.words)
  if (!counting && !rankingAsked && !namesSettlements) return null

  let db
  try {
    db = require('../../models')
  } catch (error) {
    console.warn('[ai] register lookup unavailable:', error.message)
    return null
  }

  const tokens = [...tokenise(question), ...terms]
  const place = await placeInQuestion(db, question, tokens).catch((error) => {
    console.warn('[ai] could not resolve place:', error.message)
    return null
  })

  const named = wanted(question, tokens)
  if (!counting && !rankingAsked && place && namesSettlements) counting = true
  if (!counting && !rankingAsked) return null

  const placeNames = (place && place.ambiguous ? place.options : [place].filter(Boolean))
    .flatMap((item) => [
      ...tokenise(item.name),
      ...tokenise(item.countyName || ''),
      ...tokenise(item.subcountyName || '')
    ])
  const accounted = [
    ...COUNT_WORDS,
    ...SCOPE_WORDS,
    ...RANK_EXACT,
    ...RANK_WORDS,
    ...SMALLEST_WORDS,
    ...Object.keys(NUMBER_WORDS),
    ...ASKING_WORDS,
    ...MEASURES.flatMap((measure) => measure.words),
    ...named.flatMap((entity) => entity.words),
    ...placeNames
  ]

  if (place && place.ambiguous) {
    const leftover = terms.filter((term) => !matchesAny([term], accounted))
    return { text: ambiguousPlaceText(place), exhaustive: leftover.length === 0, leftover }
  }

  const where = place ? { [PLACE_COLUMN[place.kind]]: place.id } : undefined

  const types = await typeCounts(db, tokens, where).catch((error) => {
    console.warn('[ai] could not count settlement types:', error.message)
    return []
  })
  accounted.push(...types.flatMap((type) => typeWords(type.label)))

  const ranked = await ranking(db, question, tokens, types, place).catch((error) => {
    console.warn('[ai] could not rank settlements:', error.message)
    return null
  })

  // A ranking question is not a counting question, so the counts are only
  // built when one was actually asked for.
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
      // A place question must not be answered with the national total.
      // Documents and projects are not stored against a county, subcounty, or ward.
      const column = place && PLACE_COLUMN[place.kind]
      if (column && !model.rawAttributes[column]) {
        parts.push(`${entity.label}: not stored against a ${place.kind}, so there is no ${placeLabel(place)} total.`)
        continue
      }

      const total = await model.count(where ? { where } : {})
      const lines = [`${entity.label}: ${total.toLocaleString()} in ${place ? placeLabel(place) : 'total'}`]

      // The type the question asked about, stated plainly before the
      // breakdowns, so it is not left to be read out of a list.
      if (entity === SETTLEMENTS) {
        for (const type of types) {
          lines.push(`  of type "${type.label}": ${type.total.toLocaleString()}`)
        }
      }

      for (const group of entity.groupBy) {
        const column = place && PLACE_COLUMN[place.kind]
        const rows = await groupCounts(
          db,
          entity.model,
          group.column,
          column && model.rawAttributes[column] ? where : undefined
        )
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
  const leftover = terms.filter((term) => !matchesAny([term], accounted))

  const blocks = []
  if (ranked) blocks.push(ranked.text)
  if (parts.length) {
    const scope = place
      ? `Counts for ${placeLabel(place)} from the KeSMIS database (authoritative, not from any document). `
        + 'These figures are for that place only, and are not filtered by date:'
      : 'Current counts from the KeSMIS database (authoritative, not from any document). '
        + 'These are register-wide totals, not filtered by place or date:'
    blocks.push(`${scope}\n${parts.join('\n')}`)
  }

  return { text: blocks.join('\n\n'), exhaustive: leftover.length === 0, leftover }
}

module.exports = { lookup, asksForCount, asksForRanking }
