'use strict'

// Vector store: schema, writes and retrieval against the AI Postgres database.
//
// Retrieval differences from the previous implementation that matter:
//   - every search is bounded by LIMIT (there was none before)
//   - an ANN index exists, so search is not a sequential scan
//   - vectors are filtered by the model that produced them, so a model change
//     yields zero rows instead of meaningless neighbours
//   - the keyword fallback is Postgres full-text search, not LIKE '%word%'

const { Pool } = require('pg')
const { config } = require('./config')
const { describeError } = require('./describeError')

let pool = null
let ready = null
let connected = false
let vectorSearchEnabled = false
let lastError = null

function getPool() {
  if (pool) return pool
  if (!config.db.host || !config.db.database) {
    lastError = 'AI_DB_HOST / AI_DB_NAME are not set'
    console.error('[ai] ' + lastError)
    return null
  }
  pool = new Pool({ ...config.db, idleTimeoutMillis: 30000 })
  pool.on('error', (error) => console.error('[ai] idle pool client error:', describeError(error)))
  return pool
}

const toVector = (values) => `[${values.join(',')}]`

// file_size is BIGINT; a fractional or non-numeric value must not reach it.
const toBytes = (value) => Math.max(0, Math.floor(Number(value) || 0))

const target = () => `${config.db.user || '?'}@${config.db.host || '?'}:${config.db.port}/${config.db.database || '?'}`

/**
 * Create schema and indexes, then confirm the stored vector width matches the
 * configured embedding model. Runs once; the result is cached.
 */
function init() {
  if (ready) return ready

  ready = (async () => {
    const db = getPool()
    if (!db) return false

    try {
      await db.query('CREATE EXTENSION IF NOT EXISTS vector')
      await db.query('CREATE EXTENSION IF NOT EXISTS pg_trgm')
      // levenshtein(), for mapping a misspelled word to one that is indexed.
      await db.query('CREATE EXTENSION IF NOT EXISTS fuzzystrmatch')

      await db.query(`
        CREATE TABLE IF NOT EXISTS documents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          source_key TEXT,
          filename VARCHAR(255) NOT NULL,
          file_path VARCHAR(1000),
          file_type VARCHAR(50),
          file_size BIGINT DEFAULT 0,
          content TEXT,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
        )
      `)
      // Present for databases created by the previous implementation.
      await db.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS source_key TEXT`)
      await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS ux_documents_source_key ON documents(source_key) WHERE source_key IS NOT NULL`)

      await db.query(`
        CREATE TABLE IF NOT EXISTS document_chunks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          chunk_index INTEGER NOT NULL,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT now()
        )
      `)
      await db.query(`CREATE INDEX IF NOT EXISTS ix_chunks_document ON document_chunks(document_id)`)
      await db.query(`
        CREATE INDEX IF NOT EXISTS ix_chunks_fts
        ON document_chunks USING GIN (to_tsvector('english', content))
      `)

      await db.query(`
        CREATE TABLE IF NOT EXISTS embeddings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          chunk_id UUID REFERENCES document_chunks(id) ON DELETE CASCADE,
          embedding_vector vector(${config.embed.dimensions}),
          model_name VARCHAR(120) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT now()
        )
      `)
      await db.query(`CREATE INDEX IF NOT EXISTS ix_embeddings_chunk ON embeddings(chunk_id)`)
      await db.query(`CREATE INDEX IF NOT EXISTS ix_embeddings_model ON embeddings(model_name)`)

      await db.query(`
        CREATE TABLE IF NOT EXISTS ai_conversations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id VARCHAR(190) NOT NULL,
          user_id VARCHAR(190),
          question TEXT NOT NULL,
          answer TEXT NOT NULL,
          provider VARCHAR(60),
          model VARCHAR(120),
          tokens INTEGER DEFAULT 0,
          sources JSONB DEFAULT '[]',
          created_at TIMESTAMPTZ DEFAULT now()
        )
      `)
      await db.query(`CREATE INDEX IF NOT EXISTS ix_conversations_session ON ai_conversations(session_id, created_at DESC)`)

      // Indexing batches, so progress outlives both the page and the process.
      await db.query(`
        CREATE TABLE IF NOT EXISTS index_jobs (
          id UUID PRIMARY KEY,
          label TEXT NOT NULL,
          source VARCHAR(60),
          status VARCHAR(20) NOT NULL,
          total INTEGER NOT NULL DEFAULT 0,
          done INTEGER NOT NULL DEFAULT 0,
          indexed INTEGER NOT NULL DEFAULT 0,
          failed INTEGER NOT NULL DEFAULT 0,
          current_file TEXT,
          last_error TEXT,
          started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          finished_at TIMESTAMPTZ,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `)
      await db.query(`CREATE INDEX IF NOT EXISTS ix_index_jobs_started ON index_jobs(started_at DESC)`)

      vectorSearchEnabled = await verifyDimensions(db)
      if (vectorSearchEnabled) await ensureAnnIndex(db)

      connected = true
      lastError = vectorSearchEnabled ? null : lastError
      return true
    } catch (error) {
      // Name the target: the usual cause is the wrong host/port or a database
      // that is not running, and the raw error alone does not say which.
      lastError = `cannot use AI database ${target()}: ${describeError(error)}`
      console.error(`[ai] ${lastError}`)
      return false
    }
  })()

  return ready
}

// A column of the wrong width would make every query throw. Detect it once
// and degrade to keyword search with an actionable message instead.
async function verifyDimensions(db) {
  const { rows } = await db.query(`
    SELECT a.atttypmod AS dimensions
    FROM pg_attribute a
    WHERE a.attrelid = 'embeddings'::regclass AND a.attname = 'embedding_vector'
  `)
  const stored = rows[0]?.dimensions

  if (stored === config.embed.dimensions) return true

  if (stored === -1) {
    lastError = 'embeddings.embedding_vector has no declared dimension; '
      + 'vector search is disabled until the column is rebuilt as '
      + `vector(${config.embed.dimensions}) and documents are reindexed`
  } else {
    lastError = `embeddings.embedding_vector is vector(${stored}) but `
      + `AI_EMBED_DIMENSIONS is ${config.embed.dimensions}; `
      + 'reindex with tools/ai-reindex.js after aligning the two'
  }
  console.error(`[ai] ${lastError}`)
  return false
}

async function ensureAnnIndex(db) {
  try {
    await db.query(`
      CREATE INDEX IF NOT EXISTS ix_embeddings_ann
      ON embeddings USING hnsw (embedding_vector vector_cosine_ops)
    `)
  } catch (hnswError) {
    try {
      await db.query(`
        CREATE INDEX IF NOT EXISTS ix_embeddings_ann
        ON embeddings USING ivfflat (embedding_vector vector_cosine_ops) WITH (lists = 100)
      `)
    } catch (ivfflatError) {
      console.warn('[ai] no ANN index (searches will scan):', ivfflatError.message)
    }
  }
}

/**
 * Write a document and its chunks, replacing any previous version with the
 * same source key. Idempotent: re-ingesting a file does not duplicate it.
 */
async function replaceDocument({ sourceKey, filename, filePath, fileType, fileSize, content, metadata, chunks, vectors, modelId }) {
  const db = getPool()
  const client = await db.connect()

  try {
    await client.query('BEGIN')

    if (sourceKey) {
      await client.query('DELETE FROM documents WHERE source_key = $1', [sourceKey])
    }

    const { rows } = await client.query(`
      INSERT INTO documents (source_key, filename, file_path, file_type, file_size, content, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [sourceKey || null, filename, filePath || null, fileType || null, toBytes(fileSize), content || null, metadata || {}])

    const documentId = rows[0].id

    for (let index = 0; index < chunks.length; index += 1) {
      const { rows: chunkRows } = await client.query(`
        INSERT INTO document_chunks (document_id, content, chunk_index)
        VALUES ($1, $2, $3) RETURNING id
      `, [documentId, chunks[index], index])

      if (vectors && vectors[index]) {
        await client.query(`
          INSERT INTO embeddings (chunk_id, embedding_vector, model_name)
          VALUES ($1, $2::vector, $3)
        `, [chunkRows[0].id, toVector(vectors[index]), modelId])
      }
    }

    await client.query('COMMIT')
    return { documentId, chunks: chunks.length, embedded: vectors ? vectors.length : 0 }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/** Nearest neighbours by cosine distance, restricted to one embedding model. */
async function searchByVector(vector, modelId, topK, minSimilarity) {
  if (!vectorSearchEnabled) return []

  const { rows } = await getPool().query(`
    SELECT d.filename, d.file_type, d.file_size, c.content, c.chunk_index,
           1 - (e.embedding_vector <=> $1::vector) AS similarity
    FROM embeddings e
    JOIN document_chunks c ON c.id = e.chunk_id
    JOIN documents d ON d.id = c.document_id
    WHERE e.model_name = $2
    ORDER BY e.embedding_vector <=> $1::vector
    LIMIT $3
  `, [toVector(vector), modelId, topK])

  return rows
    .filter((row) => row.similarity >= minSimilarity)
    .map((row) => ({ ...row, similarity: Number(row.similarity), retrieval: 'vector' }))
}

/**
 * Chunks belonging to the most recently indexed document, in reading order.
 * Serves questions about "the latest document", which similarity search
 * cannot answer because no chunk describes its own recency.
 */
async function latestDocumentChunks(limit) {
  const { rows } = await getPool().query(`
    WITH latest AS (
      SELECT id, filename, file_type, file_size
      FROM documents
      ORDER BY created_at DESC
      LIMIT 1
    )
    SELECT l.filename, l.file_type, l.file_size, c.content, c.chunk_index
    FROM latest l
    JOIN document_chunks c ON c.document_id = l.id
    ORDER BY c.chunk_index
    LIMIT $1
  `, [limit])

  return rows.map((row) => ({ ...row, similarity: 1, retrieval: 'recent' }))
}

/** Full-text fallback for when embeddings are unavailable or return nothing. */
async function searchByKeyword(question, topK) {
  const { rows } = await getPool().query(`
    SELECT d.filename, d.file_type, d.file_size, c.content, c.chunk_index,
           ts_rank(to_tsvector('english', c.content), query) AS similarity
    FROM document_chunks c
    JOIN documents d ON d.id = c.document_id,
         websearch_to_tsquery('english', $1) AS query
    WHERE to_tsvector('english', c.content) @@ query
    ORDER BY similarity DESC
    LIMIT $2
  `, [question, topK])

  return rows.map((row) => ({ ...row, similarity: Number(row.similarity), retrieval: 'keyword' }))
}

/**
 * Chunks matching the question's distinctive words, ranked so that rare words
 * count for more than common ones.
 *
 * websearch_to_tsquery ANDs every term, so "socio-economic aspects of Kicheko"
 * matches nothing even though five chunks name Kicheko. Vector search is no
 * help either: it scores "Kicheko" close to Kipkaren, Kemeloi and Katorongot,
 * because an embedding captures "Kenyan settlement planning report", not which
 * place a document is about.
 *
 * Counting matches equally does not work either — thousands of chunks contain
 * "socio" and "economic", so they bury the five that matter. Each term is
 * therefore weighted by how rare it is, which is what makes a place name
 * decisive. Everything here goes through the full-text index.
 *
 * @param {string[]} terms Distinctive words, already filtered by the caller.
 */
/**
 * Vocabulary of indexed words, with a trigram index for fuzzy lookup.
 *
 * A misspelled place name finds nothing: "kichecko" is not in any chunk, and
 * an embedding puts it next to Kipkaren rather than Kicheko. Keeping the
 * corpus's own words in one small table lets a typo be mapped to the word that
 * was actually indexed, which is cheaper than a trigram index over every
 * chunk's full text.
 */
async function ensureVocabulary() {
  const db = getPool()
  await db.query(`
    CREATE TABLE IF NOT EXISTS chunk_terms (
      term TEXT PRIMARY KEY,
      df INTEGER NOT NULL DEFAULT 0
    )
  `)
  await db.query(`CREATE INDEX IF NOT EXISTS ix_chunk_terms_trgm ON chunk_terms USING GIN (term gin_trgm_ops)`)
}

/**
 * Rebuild the vocabulary from the indexed chunks. Scans every chunk, so it is
 * a maintenance step (after indexing), not something a question triggers.
 *
 * Words are taken as they are written, not as ts_stat's lexemes: those are
 * stemmed, so "informal" is stored only as "inform" and a typo can never be
 * matched against the word a user actually typed. Search stems the corrected
 * word anyway, so the surface form is the useful one to keep.
 */
async function refreshVocabulary() {
  await ensureVocabulary()
  const db = getPool()
  const client = await db.connect()

  try {
    await client.query('BEGIN')
    await client.query('TRUNCATE chunk_terms')
    const { rowCount } = await client.query(`
      INSERT INTO chunk_terms (term, df)
      SELECT word, count(*)::int AS df
        FROM (
          SELECT DISTINCT c.id, w.word
            FROM document_chunks c,
                 LATERAL regexp_split_to_table(lower(c.content), $$[^a-z']+$$) AS w(word)
           WHERE length(w.word) BETWEEN 3 AND 40
             AND w.word ~ $$^[a-z][a-z']*$$
        ) AS per_chunk
       GROUP BY word
    `)
    await client.query('COMMIT')
    await db.query('ANALYZE chunk_terms')
    return rowCount
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * Map each term to the closest word in the vocabulary, so a misspelling
 * searches for what is actually indexed.
 *
 * A term already in the vocabulary is returned untouched. One that is not is
 * replaced only when a close trigram match exists — a genuinely unknown word
 * stays as it is rather than being bent into an unrelated one.
 *
 * @returns {Promise<Array<{term: string, corrected: string, df: number}>>}
 */
async function resolveTerms(terms, { maxEdits = 2 } = {}) {
  if (!terms.length) return []
  const db = getPool()

  const { rows: known } = await db.query(
    'SELECT term, df FROM chunk_terms WHERE term = ANY($1::text[])',
    [terms]
  )
  const byTerm = new Map(known.map((row) => [row.term, row.df]))
  const resolved = []

  // A word in only a handful of chunks is still checked against the vocabulary:
  // misspellings exist inside the documents too ("settlments" in 11 chunks),
  // and the term search weights rarity, so a corpus typo would otherwise cast
  // the deciding vote for any question that repeats it.
  const RARE = 25

  for (const term of terms) {
    const known = byTerm.get(term)
    if (known !== undefined && known > RARE) {
      resolved.push({ term, corrected: term, df: known })
      continue
    }

    // Trigram narrows the field using the index; edit distance then decides,
    // because trigrams mishandle transpositions — "infromal" scores higher
    // against the junk word "infrom" (one chunk) than against "informal".
    // Among equal distances the commoner word wins, which keeps a real word
    // from losing to a typo that happens to sit in the corpus.
    // Candidates come from two cheap, indexed lookups: trigram similarity, and
    // a shared three-letter prefix. Trigrams miss transpositions — "mavkoo"
    // scores 0.14 against "mavoko" — while the prefix catches them, and the
    // prefix misses a wrong first letter, which trigrams catch.
    const { rows } = await db.query(`
      SELECT term, df, levenshtein($1, term) AS edits
        FROM chunk_terms
       WHERE (term % $1 OR term LIKE left($1, 3) || '%')
         AND abs(length(term) - length($1)) <= $2
       ORDER BY edits ASC, df DESC
       LIMIT 60
    `, [term, maxEdits])

    const viable = rows.filter((row) => Number(row.edits) <= maxEdits && row.term !== term)
    // A known word keeps itself as the baseline; an unknown one has none.
    let best = known !== undefined ? { term, df: known, edits: 0 } : viable[0]

    // A far commoner word one edit further away is the better bet: "infromal"
    // is a typo of "informal" (tens of thousands of chunks), not of "infomal",
    // which is itself a typo sitting in two. The ratio has to be large so a
    // rare place name is not swapped for an everyday word.
    if (best) {
      // The window is the full edit budget, not best.edits + 1: a typo that
      // happens to sit in the corpus once ("coutny") has distance 0 from
      // itself, which would stop "county" — two edits away and in thousands of
      // chunks — from ever being considered.
      const commoner = viable.find(
        (row) => Number(row.edits) <= maxEdits && Number(row.df) >= Math.max(Number(best.df) * 100, 50)
      )
      if (commoner) best = commoner
    }

    // Correcting an unknown word into one that is itself near-junk makes
    // things worse: "spefici" became "speci" (2 chunks), and the term search
    // weights rarity, so those two chunks would outvote everything. Leaving it
    // uncorrected is better — a term no document contains is simply dropped.
    const junk = known === undefined && best && best.term !== term && Number(best.df) < 5

    if (best && !junk) {
      resolved.push({ term, corrected: best.term, df: Number(best.df) })
    } else {
      resolved.push({ term, corrected: term, df: known ?? 0 })
    }
  }

  return resolved
}

/**
 * Documents whose name or text matches the given terms, as a catalogue rather
 * than as excerpts.
 *
 * "List all the county strategies that are indexed" is a question about the
 * index, not about any passage in it: retrieval returns twelve excerpts, which
 * cannot enumerate seventeen documents however well it ranks them.
 */
async function searchDocuments(terms, limit) {
  if (!terms.length) return []
  const db = getPool()

  // Filenames are matched through the English dictionary, not with ILIKE:
  // "strategies" has to find "...County Slum Upgrading and Prevention
  // Strategy 2025-2035.pdf", and a literal match never will. Underscores and
  // dashes become spaces first so "Machakos_Kicheko_Settlement" tokenises.
  const tsv = `to_tsvector('english', regexp_replace(d.filename, '[_\\-.]+', ' ', 'g'))`

  const frequencies = await Promise.all(terms.map(async (term) => {
    const { rows } = await db.query(
      `SELECT count(*)::int AS df FROM documents d WHERE ${tsv} @@ plainto_tsquery('english', $1)`,
      [term]
    )
    return { term, df: rows[0].df }
  }))

  const { rows: [sizeRow] } = await db.query('SELECT count(*)::int AS total FROM documents')
  const total = sizeRow.total || 1

  // Rarity decides again: nearly every filename holds "county", so a document
  // matching "strategy" as well must rank above one matching "county" alone.
  const weighted = frequencies
    .filter((entry) => entry.df > 0)
    .map((entry) => ({ ...entry, weight: Math.log(1 + total / entry.df) }))

  if (!weighted.length) return []

  const params = weighted.map((entry) => entry.term)
  const score = weighted
    .map((entry, i) => `(CASE WHEN ${tsv} @@ plainto_tsquery('english', $${i + 1}) THEN ${entry.weight.toFixed(6)} ELSE 0 END)`)
    .join(' + ')
  const anyTerm = weighted.map((_, i) => `plainto_tsquery('english', $${i + 1})`).join(' || ')

  const { rows } = await db.query(`
    SELECT d.filename, d.file_type, (${score}) AS score,
           (SELECT count(*) FROM document_chunks c WHERE c.document_id = d.id) AS chunks
      FROM documents d
     WHERE ${tsv} @@ (${anyTerm})
     ORDER BY score DESC, d.filename ASC
     LIMIT $${weighted.length + 1}
  `, [...params, limit])

  return rows.map((row) => ({
    filename: row.filename,
    fileType: row.file_type,
    chunks: Number(row.chunks),
    score: Number(row.score)
  }))
}

async function searchByTerms(terms, limit) {
  if (!terms.length) return []
  const db = getPool()

  // Every predicate below is spelled exactly as ix_chunks_fts is defined —
  // to_tsvector('english', content) — so the GIN index is used. Wrapping the
  // expression in a subquery instead costs a full scan: 24s versus 60ms.
  const tsv = `to_tsvector('english', c.content)`

  // Corpus size from the planner's estimate: exact enough for a weighting, and
  // free, where count(*) over every chunk is not.
  const { rows: [estimate] } = await db.query(
    `SELECT GREATEST(reltuples, 1)::bigint AS total FROM pg_class WHERE relname = 'document_chunks'`
  )
  const total = Number(estimate?.total) || 1

  const frequencies = await Promise.all(terms.map(async (term) => {
    const { rows } = await db.query(
      `SELECT count(*)::int AS df FROM document_chunks c WHERE ${tsv} @@ plainto_tsquery('english', $1)`,
      [term]
    )
    return { term, df: rows[0].df }
  }))

  // Inverse document frequency: a term in 5 of 127,431 chunks outweighs one in
  // 40,000 by an order of magnitude, which is what makes a place name decisive.
  const weighted = frequencies
    .filter((entry) => entry.df > 0)
    .map((entry) => ({ ...entry, weight: Math.log(1 + total / entry.df) }))

  if (!weighted.length) return []

  const params = weighted.map((entry) => entry.term)
  const score = weighted
    .map((entry, i) => `(CASE WHEN ${tsv} @@ plainto_tsquery('english', $${i + 1}) THEN ${entry.weight.toFixed(6)} ELSE 0 END)`)
    .join(' + ')
  const anyTerm = weighted.map((_, i) => `plainto_tsquery('english', $${i + 1})`).join(' || ')
  const maxScore = weighted.reduce((sum, entry) => sum + entry.weight, 0)

  // Candidates are capped per term rather than scoring everything that matches
  // any term: a common word like "economic" matches tens of thousands of
  // chunks, and ordering all of them took seconds. A rare term returns fewer
  // rows than the cap, so the words that decide the ranking are still exact.
  const perTerm = Math.max(limit * 10, 200)
  const candidates = weighted
    .map((_, i) => `(SELECT id FROM document_chunks WHERE to_tsvector('english', content) @@ plainto_tsquery('english', $${i + 1}) LIMIT ${perTerm})`)
    .join(' UNION ')

  const { rows } = await db.query(`
    WITH candidates AS (${candidates})
    SELECT d.filename, d.file_type, d.file_size, c.content, c.chunk_index,
           (${score}) / ${maxScore.toFixed(6)} AS similarity
      FROM document_chunks c
      JOIN candidates ON candidates.id = c.id
      JOIN documents d ON d.id = c.document_id
     ORDER BY similarity DESC, length(c.content) ASC
     LIMIT $${weighted.length + 1}
  `, [...params, limit])

  return rows.map((row) => ({ ...row, similarity: Number(row.similarity), retrieval: 'terms' }))
}

/**
 * source_key -> stored metadata for every document under a key prefix.
 * Lets a folder scan skip files that have not changed since last indexed.
 */
async function listFingerprints(prefix) {
  const { rows } = await getPool().query(
    'SELECT source_key, metadata FROM documents WHERE source_key LIKE $1',
    [`${prefix}%`]
  )
  return new Map(rows.map((row) => [row.source_key, row.metadata || {}]))
}

/** Remove one indexed document; chunks and embeddings go with it. */
async function deleteDocument(sourceKey) {
  const { rowCount } = await getPool().query('DELETE FROM documents WHERE source_key = $1', [sourceKey])
  return rowCount
}

async function recentTurns(sessionId, limit) {
  if (!sessionId || limit <= 0) return []
  const { rows } = await getPool().query(`
    SELECT question, answer FROM ai_conversations
    WHERE session_id = $1 ORDER BY created_at DESC LIMIT $2
  `, [sessionId, limit])
  return rows.reverse()
}

async function saveTurn({ sessionId, userId, question, answer, provider, model, tokens, sources }) {
  await getPool().query(`
    INSERT INTO ai_conversations (session_id, user_id, question, answer, provider, model, tokens, sources)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [sessionId, userId || null, question, answer, provider, model, tokens || 0, JSON.stringify(sources || [])])
}

async function clearSession(sessionId) {
  const { rowCount } = await getPool().query('DELETE FROM ai_conversations WHERE session_id = $1', [sessionId])
  return rowCount
}

async function stats() {
  const { rows } = await getPool().query(`
    SELECT
      (SELECT COUNT(*) FROM documents) AS documents,
      (SELECT COUNT(*) FROM document_chunks) AS chunks,
      (SELECT COUNT(*) FROM embeddings) AS embeddings,
      (SELECT COUNT(DISTINCT model_name) FROM embeddings) AS embedding_models,
      (SELECT COUNT(DISTINCT session_id) FROM ai_conversations) AS sessions
  `)
  const row = rows[0]
  return {
    documents: Number(row.documents),
    chunks: Number(row.chunks),
    embeddings: Number(row.embeddings),
    embeddingModels: Number(row.embedding_models),
    sessions: Number(row.sessions)
  }
}

// Document columns only. Sorting by chunk count is separate: it needs one
// grouped count, and it must not pull the embeddings table in with it.
const DOCUMENT_SORTS = {
  filename: 'd.filename',
  fileType: 'd.file_type',
  fileSize: 'd.file_size',
  updatedAt: 'd.updated_at',
  createdAt: 'd.created_at'
}

/**
 * One page of indexed documents, newest first unless another sort is asked for.
 *
 * Chunk and embedding counts run only for the rows on the page. Counting them
 * for the whole corpus, once per document, is what made this request time out.
 */
async function listDocuments({ page = 1, pageSize = 10, sort = 'updatedAt', order = 'DESC' } = {}) {
  const db = getPool()
  const limit = Math.min(100, Math.max(1, Number(pageSize) || 10))
  const pageNumber = Math.max(1, Number(page) || 1)
  const offset = (pageNumber - 1) * limit
  const requested = String(order || '').toLowerCase()
  const direction = requested === 'asc' || requested === 'ascending' ? 'ASC' : 'DESC'
  const byChunks = sort === 'chunks'

  const { rows: [countRow] } = await db.query('SELECT COUNT(*)::int AS total FROM documents')
  const total = countRow.total

  const { rows } = byChunks
    ? await db.query(`
        SELECT d.id, d.source_key, d.filename, d.file_path, d.file_type, d.file_size,
               d.created_at, d.updated_at
          FROM documents d
          LEFT JOIN (
            SELECT document_id, COUNT(*) AS chunks
              FROM document_chunks
             GROUP BY document_id
          ) ch ON ch.document_id = d.id
         ORDER BY COALESCE(ch.chunks, 0) ${direction}, d.id ASC
         LIMIT $1 OFFSET $2
      `, [limit, offset])
    : await db.query(`
        SELECT d.id, d.source_key, d.filename, d.file_path, d.file_type, d.file_size,
               d.created_at, d.updated_at
          FROM documents d
         ORDER BY ${DOCUMENT_SORTS[sort] || DOCUMENT_SORTS.updatedAt} ${direction}, d.id ASC
         LIMIT $1 OFFSET $2
      `, [limit, offset])

  const counts = new Map()
  if (rows.length) {
    const { rows: countRows } = await db.query(`
      SELECT c.document_id,
             COUNT(*)::int AS chunks,
             COUNT(e.id)::int AS embeddings
        FROM document_chunks c
        LEFT JOIN embeddings e ON e.chunk_id = c.id
       WHERE c.document_id = ANY($1::uuid[])
       GROUP BY c.document_id
    `, [rows.map((row) => row.id)])
    for (const row of countRows) counts.set(row.document_id, row)
  }

  return {
    total,
    documents: rows.map((row) => {
      const count = counts.get(row.id) || { chunks: 0, embeddings: 0 }
      return {
        id: row.id,
        sourceKey: row.source_key,
        filename: row.filename,
        filePath: row.file_path,
        fileType: row.file_type,
        fileSize: Number(row.file_size) || 0,
        chunks: Number(count.chunks),
        embeddings: Number(count.embeddings),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    })
  }
}

/**
 * Chunks that have no vector for the given model, oldest first.
 *
 * Text extraction and chunking are the expensive, file-dependent part of
 * indexing; embedding is not. When embeddings fail — a slow host, a timeout —
 * the chunks are still stored, so the gap can be closed from the database
 * alone, without the original files being present.
 */
async function chunksMissingEmbeddings(modelId, limit) {
  const { rows } = await getPool().query(`
    SELECT c.id, c.content, d.filename
      FROM document_chunks c
      JOIN documents d ON d.id = c.document_id
     WHERE NOT EXISTS (
       SELECT 1 FROM embeddings e WHERE e.chunk_id = c.id AND e.model_name = $1
     )
     ORDER BY c.document_id, c.chunk_index
     LIMIT $2
  `, [modelId, limit])
  return rows
}

/** How many chunks still lack a vector for this model. */
async function countMissingEmbeddings(modelId) {
  const { rows } = await getPool().query(`
    SELECT count(*)::int AS missing
      FROM document_chunks c
     WHERE NOT EXISTS (
       SELECT 1 FROM embeddings e WHERE e.chunk_id = c.id AND e.model_name = $1
     )
  `, [modelId])
  return rows[0].missing
}

/** Store vectors for chunks that already exist. */
async function saveEmbeddings(rows, modelId) {
  if (!rows.length) return 0
  const db = getPool()
  const client = await db.connect()

  try {
    await client.query('BEGIN')
    for (const { chunkId, vector } of rows) {
      await client.query(`
        INSERT INTO embeddings (chunk_id, embedding_vector, model_name)
        VALUES ($1, $2::vector, $3)
      `, [chunkId, toVector(vector), modelId])
    }
    await client.query('COMMIT')
    return rows.length
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/** One indexed document's identity, without its content. */
async function getDocument(id) {
  const { rows } = await getPool().query(
    'SELECT id, source_key, filename, file_path, metadata FROM documents WHERE id = $1',
    [id]
  )
  const row = rows[0]
  return row
    ? { id: row.id, sourceKey: row.source_key, filename: row.filename, filePath: row.file_path, metadata: row.metadata || {} }
    : null
}

const status = () => ({ connected, vectorSearchEnabled, error: lastError })

/**
 * Drop the cached init so the next call re-creates the schema and re-checks
 * the vector width. Needed when the embedding model or dimensions change.
 */
function reset() {
  ready = null
  connected = false
  vectorSearchEnabled = false
  lastError = null
}

/**
 * Write a batch's progress, so leaving the page — or restarting the server —
 * does not lose it.
 *
 * Called on start, on finish, and sparingly in between: a row written per
 * document would be thousands of writes for one batch.
 */
async function saveJob(job) {
  // The table is created by init(); a batch can be the first AI work this
  // process has done, so make sure that has happened before writing.
  await init()
  const db = getPool()
  if (!db) return
  await db.query(
    `INSERT INTO index_jobs
       (id, label, source, status, total, done, indexed, failed, current_file, last_error, started_at, finished_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, now())
     ON CONFLICT (id) DO UPDATE SET
       status = EXCLUDED.status, done = EXCLUDED.done, indexed = EXCLUDED.indexed,
       failed = EXCLUDED.failed, current_file = EXCLUDED.current_file,
       last_error = EXCLUDED.last_error, finished_at = EXCLUDED.finished_at, updated_at = now()`,
    [
      job.id, job.label, job.source, job.status, job.total, job.done, job.indexed,
      job.failed, job.current, job.lastError,
      new Date(job.startedAt), job.finishedAt ? new Date(job.finishedAt) : null
    ]
  ).catch((error) => console.warn('[ai] could not record job progress:', error.message))
}

/**
 * Recent batches, newest first.
 *
 * A job left "running" by a restart is reported as interrupted rather than
 * as still working, which is the lie the in-memory version could not tell
 * apart from the truth.
 */
async function listJobs(limit = 20) {
  await init()
  const db = getPool()
  if (!db) return []

  const { rows } = await db.query(
    `SELECT id, label, source, status, total, done, indexed, failed,
            current_file, last_error, started_at, finished_at, updated_at,
            (status = 'running' AND updated_at < now() - interval '5 minutes') AS stale
       FROM index_jobs
      WHERE started_at > now() - interval '7 days'
      ORDER BY started_at DESC
      LIMIT $1`,
    [limit]
  )

  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    source: row.source,
    status: row.stale ? 'interrupted' : row.status,
    total: row.total,
    done: row.done,
    indexed: row.indexed,
    failed: row.failed,
    current: row.stale ? null : row.current_file,
    lastError: row.last_error,
    startedAt: row.started_at,
    finishedAt: row.finished_at
  }))
}

module.exports = {
  saveJob,
  listJobs,
  init,
  reset,
  replaceDocument,
  searchByVector,
  searchByKeyword,
  searchByTerms,
  searchDocuments,
  ensureVocabulary,
  refreshVocabulary,
  resolveTerms,
  latestDocumentChunks,
  listFingerprints,
  deleteDocument,
  recentTurns,
  saveTurn,
  clearSession,
  stats,
  listDocuments,
  getDocument,
  chunksMissingEmbeddings,
  countMissingEmbeddings,
  saveEmbeddings,
  status
}
