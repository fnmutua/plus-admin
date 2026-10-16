'use strict'

// Index an uploaded document, from wherever it was uploaded.
//
// Six handlers create rows in `document`; only the repository's batch upload
// ever asked the AI service to read one. Everything uploaded from the mobile
// app, through a share link, as a cover, or as report documentation went into
// the register and never into the index — 1,561 PDFs among them, which is why
// the assistant could not answer from documents people had plainly uploaded.
//
// The ingestion itself is deliberately detached: a reader waiting on an
// embedding provider is a slow upload, and a provider having a bad day should
// not fail the upload at all. The outcome is recorded on the document row.

const ai = require('./index')

/** One at a time per upload batch: embedding is the bottleneck, not us. */
const CONCURRENCY = 2

/**
 * Index one saved document row and record the outcome on it.
 *
 * @param {object} db      the models index
 * @param {object} saved   the created document row (needs id, name, location)
 * @returns {Promise<boolean>} whether it was indexed
 */
async function indexOne(db, saved) {
  const id = saved.id ?? saved.get?.('id')
  const name = saved.name ?? saved.get?.('name')
  const location = saved.location ?? saved.get?.('location')

  if (!id || !location) return false

  try {
    const result = await ai.ingestFile({
      filePath: location,
      filename: name,
      fileSize: saved.size ?? saved.get?.('size') ?? null,
      sourceKey: `document:${id}`
    })

    if (!result.success) {
      console.log(`[ai] not indexed: ${name} — ${result.message}`)
    }

    await db.models.document.update({
      aiProcessed: Boolean(result.success),
      aiProcessedAt: new Date(),
      aiChunks: result.chunks || 0,
      aiDocumentId: result.documentId || null,
      aiWarning: result.warning || (result.success ? null : result.message)
    }, { where: { id } })

    return Boolean(result.success)
  } catch (error) {
    console.log(`[ai] indexing error for ${name}:`, error.message)
    // Record the failure, so the gap is visible in the register rather than
    // only in a log nobody reads.
    await db.models.document.update({
      aiProcessed: false,
      aiProcessedAt: new Date(),
      aiWarning: error.message
    }, { where: { id } }).catch(() => {})
    return false
  }
}

/**
 * Index saved documents in the background.
 *
 * Returns immediately: callers answer the upload while this runs. A document
 * that carried its AI fields over from an identical file already indexed is
 * skipped, which is what the repository upload already did.
 *
 * @param {object} db
 * @param {Array}  saved documents just created
 * @param {string} source a label for the log, e.g. 'app upload'
 */
function indexDocuments(db, saved, source = 'upload') {
  const pending = (Array.isArray(saved) ? saved : [saved]).filter((doc) => {
    if (!doc) return false
    const already = doc.aiProcessed ?? doc.get?.('aiProcessed')
    return already !== true
  })

  if (!pending.length) return

  console.log(`[ai] indexing ${pending.length} document(s) from ${source}`)

  const queue = [...pending]
  const worker = async () => {
    while (queue.length) {
      const doc = queue.shift()
      await indexOne(db, doc)
    }
  }

  // Detached on purpose: the upload response does not wait for embeddings.
  Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker))
    .then(() => console.log(`[ai] finished indexing ${pending.length} document(s) from ${source}`))
    .catch((error) => console.log('[ai] indexing batch failed:', error.message))
}

module.exports = { indexDocuments, indexOne }
