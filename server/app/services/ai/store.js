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

/** Every indexed document with its chunk and embedding counts, newest first. */
async function listDocuments() {
  const { rows } = await getPool().query(`
    SELECT d.id, d.source_key, d.filename, d.file_path, d.file_type, d.file_size,
           d.created_at, d.updated_at,
           (SELECT COUNT(*) FROM document_chunks c WHERE c.document_id = d.id) AS chunks,
           (SELECT COUNT(*) FROM embeddings e
              JOIN document_chunks c ON c.id = e.chunk_id
             WHERE c.document_id = d.id) AS embeddings
    FROM documents d
    ORDER BY d.updated_at DESC
  `)
  return rows.map((row) => ({
    id: row.id,
    sourceKey: row.source_key,
    filename: row.filename,
    filePath: row.file_path,
    fileType: row.file_type,
    fileSize: Number(row.file_size) || 0,
    chunks: Number(row.chunks),
    embeddings: Number(row.embeddings),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }))
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

module.exports = {
  init,
  reset,
  replaceDocument,
  searchByVector,
  searchByKeyword,
  latestDocumentChunks,
  listFingerprints,
  recentTurns,
  saveTurn,
  clearSession,
  stats,
  listDocuments,
  getDocument,
  status
}
