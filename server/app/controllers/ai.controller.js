'use strict'

// HTTP layer for the document AI service. Deliberately thin: every handler
// validates input, calls server/app/services/ai and shapes the response.

const fs = require('fs')
const path = require('path')
const { Op } = require('sequelize')
const ai = require('../services/ai')
const jobs = require('../services/ai/jobs')
const { isSupported } = require('../services/ai/extract')
const { config } = require('../services/ai/config')
const db = require('../models')

const fail = (res, error, fallbackMessage) => {
  const status = error.status || 500

  // A provider that timed out or refused is an upstream condition with a
  // message worth showing; only genuine faults get a stack trace and a
  // generic message.
  const upstream = error.name === 'ProviderError'
  if (upstream) console.error(`[ai] ${error.message}`)
  else if (status >= 500) console.error(`[ai] ${fallbackMessage}:`, error)

  return res.status(upstream ? (error.status || 502) : status).json({
    success: false,
    code: String(status),
    message: upstream || status < 500 ? error.message : fallbackMessage
  })
}

exports.health = async (req, res) => {
  try {
    const result = await ai.health()
    return res.json({ success: true, code: '0000', data: result })
  } catch (error) {
    return fail(res, error, 'Failed to check AI health')
  }
}

/**
 * Providers a user may pick. Narrowed by the "Providers offered to users"
 * setting; the settings screen uses its own listing so an administrator can
 * still see credentials for every provider.
 */
exports.providers = (req, res) => {
  return res.json({
    success: true,
    code: '0000',
    data: ai.availableProviders().filter((provider) => provider.offered),
    active: { chat: config.chat.provider, model: config.chat.model, embeddings: config.embed.provider }
  })
}

// Only the current generation is worth putting in a picker: a key with access
// to the whole OpenAI catalogue lists ~90 chat models, which nobody can scan.
// The cap is enforced here rather than left to the caller, so no UI can ask
// for the full catalogue by accident.
const DEFAULT_MODEL_LIMIT = 10
const MAX_MODEL_LIMIT = 10

exports.models = async (req, res) => {
  try {
    const name = req.query.provider || config.chat.provider
    // A smaller limit is honoured; 0, a larger one or nonsense falls back to the cap.
    const requested = parseInt(req.query.limit, 10)
    const limit = Number.isFinite(requested) && requested > 0
      ? Math.min(requested, MAX_MODEL_LIMIT)
      : DEFAULT_MODEL_LIMIT

    const models = await ai.listModels(name, { limit })
    return res.json({ success: true, code: '0000', data: models, provider: name, limit })
  } catch (error) {
    // A provider that is down should not break the picker; the UI falls back
    // to the server default when the list comes back empty.
    console.warn("[ai] could not list models:", error.message)
    return res.json({
      success: true,
      code: '0000',
      data: [],
      provider: req.query.provider || config.chat.provider,
      error: error.message
    })
  }
}

exports.ask = async (req, res) => {
  // Stopping in the UI aborts the HTTP request. Propagating that to the model
  // frees the GPU immediately instead of generating an answer nobody waits for.
  const controller = new AbortController()
  req.on('close', () => {
    if (!res.writableEnded) controller.abort()
  })

  try {
    const { question, sessionId, provider, model } = req.body || {}
    const result = await ai.ask({
      signal: controller.signal,
      question,
      sessionId: sessionId || `user:${req.userid || 'anonymous'}`,
      userId: req.userid ? String(req.userid) : null,
      provider,
      model
    })
    // `code` and top-level answer/sources are kept for the existing client.
    return res.json({ success: true, code: '0000', ...result })
  } catch (error) {
    // The client is already gone; there is nobody to send a status to.
    if (error.cancelled || controller.signal.aborted) {
      console.log('[ai] question cancelled by the client')
      return res.writableEnded ? undefined : res.status(499).end()
    }
    return fail(res, error, 'Failed to get a response from the AI service')
  }
}

exports.clearSession = async (req, res) => {
  try {
    const sessionId = req.body?.sessionId || req.query?.sessionId
    if (!sessionId) {
      return res.status(400).json({ success: false, code: '400', message: 'sessionId is required' })
    }
    const removed = await ai.clearSession(sessionId)
    return res.json({ success: true, code: '0000', data: { removed } })
  } catch (error) {
    return fail(res, error, 'Failed to clear conversation history')
  }
}

exports.stats = async (req, res) => {
  try {
    const [index, documents, processed] = await Promise.all([
      ai.stats(),
      db.models.document.count(),
      db.models.document.count({ where: { aiProcessed: true } })
    ])
    return res.json({
      success: true,
      code: '0000',
      data: { ...index, sourceDocuments: documents, processedDocuments: processed }
    })
  } catch (error) {
    return fail(res, error, 'Failed to get AI statistics')
  }
}

exports.documents = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 10))
    const { documents, total } = await ai.listDocuments({
      page,
      pageSize,
      sort: req.query.sort,
      order: req.query.order
    })
    return res.json({ success: true, code: '0000', data: documents, total, page, pageSize })
  } catch (error) {
    return fail(res, error, 'Failed to list indexed documents')
  }
}

exports.documentStatus = async (req, res) => {
  try {
    const document = await db.models.document.findByPk(req.params.documentId)
    if (!document) {
      return res.status(404).json({ success: false, code: '404', message: 'Document not found' })
    }
    return res.json({
      success: true,
      code: '0000',
      data: {
        documentId: document.id,
        filename: document.name,
        processed: Boolean(document.aiProcessed),
        processedAt: document.aiProcessedAt,
        chunks: document.aiChunks || 0,
        warning: document.aiWarning || null
      }
    })
  } catch (error) {
    return fail(res, error, 'Failed to get document AI status')
  }
}

/**
 * Index existing documents. Runs in the background and returns immediately —
 * a synchronous loop over the corpus would exceed any sane request timeout.
 */
exports.reindex = async (req, res) => {
  try {
    const { documentIds, processAll, force = false } = req.body || {}

    const where = {}
    if (Array.isArray(documentIds) && documentIds.length) {
      where.id = documentIds
    } else if (!processAll) {
      return res.status(400).json({
        success: false,
        code: '400',
        message: 'Provide documentIds or set processAll to true'
      })
    }
    // Both NULL and false mean "not indexed"; only NULL would skip documents
    // the previous pipeline recorded as failed.
    if (!force) where.aiProcessed = { [Op.not]: true }

    const found = await db.models.document.findAll({
      where,
      attributes: ['id', 'name', 'location', 'size']
    })

    // A photo has no text to index, and the register holds 11,887 of them.
    // Attempting each one only produced a progress bar made of failures and a
    // warning written to every row.
    const documents = found.filter((doc) => isSupported(doc.name || ''))
    const skipped = found.length - documents.length

    if (!documents.length) {
      return res.json({
        success: true,
        code: '0000',
        message: skipped
          ? `Nothing to index — ${skipped} document(s) are file types the indexer cannot read`
          : 'Nothing to index',
        data: { queued: 0, skipped }
      })
    }

    const job = jobs.start({
      label: documentIds?.length ? `Re-indexing ${documents.length} selected document(s)`
        : force ? `Re-indexing all ${documents.length} uploads`
        : `Indexing ${documents.length} document(s) not yet indexed`,
      total: documents.length,
      source: 'reindex'
    })

    setImmediate(() => runReindex(documents, job))

    return res.status(202).json({
      success: true,
      code: '0000',
      message: `Indexing ${documents.length} document(s) in the background`
        + (skipped ? `, skipping ${skipped} unreadable file type(s)` : ''),
      // The id the page polls: a batch that says nothing for an hour is
      // indistinguishable from one that died.
      data: { queued: documents.length, skipped, jobId: job.id }
    })
  } catch (error) {
    return fail(res, error, 'Failed to start AI indexing')
  }
}

/** Index one main-database document and record the outcome on its row. */
async function indexUpload(document) {
  const result = await ai.ingestFile({
    filePath: document.location,
    filename: document.name,
    fileSize: document.size,
    sourceKey: `document:${document.id}`
  })

  await db.models.document.update({
    aiProcessed: Boolean(result.success),
    aiProcessedAt: new Date(),
    aiChunks: result.chunks || 0,
    aiDocumentId: result.documentId || null,
    aiWarning: result.warning || result.message || null
  }, { where: { id: document.id } })

  return result
}

async function runReindex(documents, job) {
  let indexed = 0
  let failed = 0

  for (const document of documents) {
    job?.begin(document.name)
    try {
      const result = await indexUpload(document)
      if (result.success) indexed += 1
      else failed += 1
      job?.advance({ filename: document.name, ok: Boolean(result.success), message: result.message })
    } catch (error) {
      failed += 1
      console.error(`[ai] reindex failed for document ${document.id}:`, error.message)
      job?.advance({ filename: document.name, ok: false, message: error.message })
    }
  }

  job?.finish()
  console.log(`[ai] reindex complete — ${indexed} indexed, ${failed} failed`)
}

/** Progress for every batch still running, and those recently finished. */
exports.jobs = async (req, res) => {
  try {
    return res.json({ success: true, code: '0000', data: await jobs.list() })
  } catch (error) {
    return fail(res, error, 'Failed to read indexing progress')
  }
}

/**
 * Re-index one entry of the AI index, identified by its index id rather than
 * a main-database id, so folder imports can be refreshed too. Runs inline: a
 * single document is quick enough, and the caller wants the new chunk count.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

exports.reindexOne = async (req, res) => {
  try {
    const entry = UUID.test(req.params.id) ? await ai.getDocument(req.params.id) : null
    if (!entry) {
      return res.status(404).json({ success: false, code: '404', message: 'Not in the AI index' })
    }

    const [kind, ...rest] = (entry.sourceKey || '').split(':')
    let result

    if (kind === 'document') {
      const document = await db.models.document.findByPk(rest.join(':'), {
        attributes: ['id', 'name', 'location', 'size']
      })
      if (!document) {
        return res.status(404).json({ success: false, code: '404', message: 'The source document no longer exists' })
      }
      result = await indexUpload(document)
    } else if (kind === 'path') {
      // Folder imports are read from the server's disk, keyed and fingerprinted
      // exactly as tools/ai-reindex.js does so the CLI still sees them as current.
      const filePath = rest.join(':')
      const stats = await fs.promises.stat(filePath).catch(() => null)
      if (!stats) {
        return res.status(404).json({ success: false, code: '404', message: `File not found on the server: ${filePath}` })
      }
      result = await ai.ingestFile({
        filePath,
        filename: path.basename(filePath),
        sourceKey: entry.sourceKey,
        metadata: { sourcePath: filePath, size: stats.size, mtimeMs: stats.mtimeMs }
      })
    } else {
      return res.status(400).json({
        success: false,
        code: '400',
        message: 'This entry is re-indexed automatically when its record is saved'
      })
    }

    if (!result.success) {
      return res.status(422).json({ success: false, code: '422', message: result.message })
    }
    return res.json({
      success: true,
      code: '0000',
      message: `Re-indexed ${entry.filename} — ${result.chunks} chunks`,
      data: { chunks: result.chunks, warning: result.warning || null }
    })
  } catch (error) {
    return fail(res, error, 'Failed to re-index document')
  }
}

exports.getSettings = async (req, res) => {
  try {
    const [settings, providers] = await Promise.all([ai.listSettings(), ai.availableProviders()])
    return res.json({
      success: true,
      code: '0000',
      data: {
        settings,
        providers,
        // Effective presence, which may come from a stored credential rather
        // than the environment. The keys themselves are never returned.
        credentials: Object.fromEntries(
          Object.entries(config.remotes).map(([id, remote]) => [id, Boolean(remote.apiKey)])
        )
      }
    })
  } catch (error) {
    return fail(res, error, 'Failed to load AI settings')
  }
}

exports.updateSettings = async (req, res) => {
  try {
    const settings = await ai.updateSettings(req.body?.settings, req.userid)
    const health = await ai.health()
    // Return health alongside: a settings change can break the connection, and
    // the administrator should see that immediately rather than on next use.
    return res.json({ success: true, code: '0000', data: { settings, health } })
  } catch (error) {
    return fail(res, error, 'Failed to update AI settings')
  }
}
