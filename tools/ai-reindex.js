#!/usr/bin/env node
'use strict'

// Build the AI index, either from documents recorded in the main database or
// from a folder of files on disk.
//
//   node tools/ai-reindex.js                        documents not yet indexed
//   node tools/ai-reindex.js --all                  re-index every database document
//   node tools/ai-reindex.js --id 12 --id 15        specific database documents
//
//   node tools/ai-reindex.js --dir ./docs           every supported file in a folder
//   node tools/ai-reindex.js --dir a --dir b        several folders
//   node tools/ai-reindex.js --dir ./docs --force   re-index even if unchanged
//   node tools/ai-reindex.js --dir ./docs --flat    do not descend into subfolders
//   node tools/ai-reindex.js --dir ./docs --dry-run list what would be indexed
//
//   node tools/ai-reindex.js --fill-embeddings      give vectors to chunks that
//                                                   have none, without re-reading
//                                                   any files (resumable)
//   node tools/ai-reindex.js --fill-embeddings --limit 5000 --batch 8
//
//   node tools/ai-reindex.js --ext zip --force      only documents with that
//                                                   extension (repeatable)
//
//   node tools/ai-reindex.js --refresh-vocabulary   rebuild the spelling
//                                                   vocabulary used to match
//                                                   misspelled search words
//
//   --concurrency N                                 default 2
//
// Folder mode is idempotent: each file is keyed by its absolute path, so a
// second run replaces a document rather than adding a duplicate, and skips
// files whose size and modified time are unchanged.

require('dotenv').config()

const path = require('path')
const fs = require('fs')
const os = require('os')

const ai = require('../server/app/services/ai')

/** Key a file by its real path so two files sharing a basename cannot collide. */
const keyFor = (absolutePath) => `path:${absolutePath}`
const FOLDER_PREFIX = 'path:'

/** Resolve a --dir argument, expanding a leading ~ the shell left alone because it was quoted. */
const resolveDir = (dir) => path.resolve(dir.replace(/^~(?=$|[\\/])/, os.homedir()))

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const seconds = (since) => `${((Date.now() - since) / 1000).toFixed(1)}s`

/**
 * Print each stage of one document as its own line. Workers run concurrently,
 * so every line carries the document's position and name to stay readable
 * when two documents interleave.
 */
function progressFor(position, label) {
  const started = Date.now()
  const line = (text) => console.log(`${position} ${label} — ${text}`)

  return {
    onProgress(event) {
      switch (event.stage) {
        case 'reading': line(`reading ${formatBytes(event.bytes)}`); break
        case 'chunked': line(`extracted ${event.chars.toLocaleString()} chars → ${event.chunks} chunks`); break
        case 'embedding': line(`embedding ${event.done}/${event.total}`); break
        case 'storing': line('storing'); break
      }
    },
    finish(result) {
      if (result.success) {
        line(`ok, ${result.chunks} chunks in ${seconds(started)}` + (result.warning ? ` (${result.warning})` : ''))
      } else {
        line(`skipped: ${result.message}`)
      }
    },
    fail(error) {
      console.error(`${position} ${label} — FAILED after ${seconds(started)}: ${error.message}`)
    }
  }
}

function parseArgs(argv) {
  const options = {
    all: false, ids: [], dirs: [], concurrency: 2, force: false, recursive: true, dryRun: false,
    fillEmbeddings: false, limit: Infinity, batch: null, refreshVocabulary: false, exts: []
  }

  for (let i = 0; i < argv.length; i += 1) {
    switch (argv[i]) {
      case '--all': options.all = true; break
      case '--force': options.force = true; break
      case '--flat': options.recursive = false; break
      case '--dry-run': options.dryRun = true; break
      case '--fill-embeddings': options.fillEmbeddings = true; break
      case '--refresh-vocabulary': options.refreshVocabulary = true; break
      case '--ext': {
        const ext = String(argv[++i] || '').trim().toLowerCase()
        if (ext) options.exts.push(ext.startsWith('.') ? ext : `.${ext}`)
        break
      }
      case '--limit': options.limit = Math.max(1, parseInt(argv[++i], 10) || Infinity); break
      case '--batch': options.batch = Math.max(1, parseInt(argv[++i], 10) || 0) || null; break
      case '--id': options.ids.push(argv[++i]); break
      case '--dir': options.dirs.push(resolveDir(argv[++i])); break
      case '--concurrency': options.concurrency = Math.max(1, parseInt(argv[++i], 10) || 2); break
      default:
        if (argv[i].startsWith('--')) {
          console.error(`Unknown option: ${argv[i]}`)
          process.exit(1)
        }
    }
  }

  return options
}

/** Every file under a directory, skipping dotfiles and not following symlinks. */
async function* walk(directory, recursive) {
  let entries
  try {
    entries = await fs.promises.readdir(directory, { withFileTypes: true })
  } catch (error) {
    // macOS denies Desktop, Documents and Downloads to a terminal that has not
    // been granted access, and reports it as EPERM rather than an empty folder.
    const hint = error.code === 'EPERM'
      ? ' (grant your terminal Full Disk Access in System Settings > Privacy & Security)'
      : ''
    console.error(`  cannot read ${directory}: ${error.message}${hint}`)
    return
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const full = path.join(directory, entry.name)

    // Symlinks are skipped rather than followed: a link back up the tree would
    // otherwise walk forever.
    if (entry.isSymbolicLink()) continue
    if (entry.isDirectory()) {
      if (recursive) yield* walk(full, recursive)
    } else if (entry.isFile()) {
      yield full
    }
  }
}

async function collectFiles(options) {
  const found = []

  for (const directory of options.dirs) {
    if (!fs.existsSync(directory)) {
      console.error(`  folder not found: ${directory}`)
      continue
    }
    for await (const file of walk(directory, options.recursive)) found.push(file)
  }

  return found
}

async function runFolders(options) {
  const files = await collectFiles(options)
  const supported = files.filter((file) => ai.isSupported(file))
  const skippedTypes = files.length - supported.length

  console.log(`${files.length} file(s) found, ${supported.length} of a supported type`
    + (skippedTypes ? `, ${skippedTypes} skipped` : ''))

  // Compare against what is already indexed so unchanged files cost nothing.
  const indexed = options.force ? new Map() : await ai.listFingerprints(FOLDER_PREFIX)
  const queue = []
  let unchanged = 0

  for (const file of supported) {
    const stats = await fs.promises.stat(file)
    const previous = indexed.get(keyFor(file))

    if (previous && previous.size === stats.size && previous.mtimeMs === stats.mtimeMs) {
      unchanged += 1
      continue
    }
    queue.push({ file, stats })
  }

  if (unchanged) console.log(`${unchanged} unchanged since last run — skipping (use --force to redo)`)
  console.log(`${queue.length} file(s) to index\n`)

  if (options.dryRun) {
    queue.forEach(({ file }) => console.log(`  would index  ${file}`))
    return { indexed: 0, failed: 0 }
  }
  if (!queue.length) return { indexed: 0, failed: 0 }

  let done = 0
  let failed = 0
  let cursor = 0

  const worker = async () => {
    while (cursor < queue.length) {
      const { file, stats } = queue[cursor++]
      const position = `[${cursor}/${queue.length}]`
      const progress = progressFor(position, path.relative(process.cwd(), file))

      try {
        const result = await ai.ingestFile({
          filePath: file,
          filename: path.basename(file),
          sourceKey: keyFor(file),
          metadata: { sourcePath: file, size: stats.size, mtimeMs: stats.mtimeMs },
          onProgress: progress.onProgress
        })

        if (result.success) done += 1
        else failed += 1
        progress.finish(result)
      } catch (error) {
        failed += 1
        progress.fail(error)
      }
    }
  }

  await Promise.all(Array.from({ length: options.concurrency }, worker))
  return { indexed: done, failed }
}

async function runDatabase(options) {
  const db = require('../server/app/models')
  const { Op } = require('sequelize')

  const where = {}
  if (options.ids.length) where.id = options.ids
  // "Not yet indexed" is both NULL and false; matching only NULL skips every
  // document the previous pipeline marked as failed.
  else if (!options.all) where.aiProcessed = { [Op.not]: true }

  // --ext narrows by filename, for re-reading one type after its support was
  // added: the 1,661 archives were all marked "Unsupported file type".
  if (options.exts.length) {
    where.name = { [Op.or]: options.exts.map((ext) => ({ [Op.iLike]: `%${ext}` })) }
  }

  const documents = await db.models.document.findAll({
    where,
    attributes: ['id', 'name', 'location', 'size']
  })

  console.log(`${documents.length} database document(s) to index\n`)
  if (!documents.length || options.dryRun) {
    if (options.dryRun) documents.forEach((d) => console.log(`  would index  ${d.name}`))
    return { indexed: 0, failed: 0 }
  }

  let indexed = 0
  let failed = 0
  let cursor = 0

  const worker = async () => {
    while (cursor < documents.length) {
      const document = documents[cursor++]
      const position = `[${cursor}/${documents.length}]`
      const progress = progressFor(position, document.name)

      try {
        const result = await ai.ingestFile({
          filePath: document.location,
          filename: document.name,
          sourceKey: `document:${document.id}`,
          onProgress: progress.onProgress
        })

        await db.models.document.update({
          aiProcessed: Boolean(result.success),
          aiProcessedAt: new Date(),
          aiChunks: result.chunks || 0,
          aiDocumentId: result.documentId || null,
          aiWarning: result.warning || (result.success ? null : result.message)
        }, { where: { id: document.id } })

        if (result.success) indexed += 1
        else failed += 1
        progress.finish(result)
      } catch (error) {
        failed += 1
        progress.fail(error)
      }
    }
  }

  await Promise.all(Array.from({ length: options.concurrency }, worker))
  return { indexed, failed }
}

/**
 * Fill in missing vectors. Nothing is re-extracted: the chunks are already in
 * the database, so this only makes the embedding calls that failed before.
 */
async function runFillEmbeddings(options) {
  let started = Date.now()
  let lastReport = 0

  const outcome = await ai.fillMissingEmbeddings({
    batchSize: options.batch,
    limit: options.limit,
    onProgress: (event) => {
      if (event.stage === 'start') {
        console.log(`${event.missing.toLocaleString()} chunk(s) without a vector for ${event.modelId}`)
        console.log(`embedding ${event.batchSize} at a time`
          + (options.limit === Infinity ? '' : `, stopping after ${options.limit.toLocaleString()}`) + '\n')
        started = Date.now()
      }
      if (event.stage === 'batch') {
        // One line every 2s: a long run should not scroll past unreadably.
        if (Date.now() - lastReport < 2000) return
        lastReport = Date.now()
        const rate = event.embedded / Math.max(1, (Date.now() - started) / 1000)
        const left = Math.min(event.missing, options.limit) - event.embedded - event.failed
        console.log(`  ${event.embedded.toLocaleString()} embedded`
          + (event.failed ? `, ${event.failed} failed` : '')
          + ` — ${rate.toFixed(1)}/s, ~${Math.round(left / Math.max(rate, 0.01) / 60)} min left`
          + ` (${event.filename})`)
      }
      if (event.stage === 'error') {
        console.error(`  batch failed: ${event.message}`)
      }
    }
  })

  return outcome
}

/**
 * Keep the spelling vocabulary in step after indexing. A failure here costs
 * typo tolerance on new words, not the indexing that just succeeded, so it is
 * reported and swallowed.
 */
async function refreshVocabularyQuietly() {
  try {
    const words = await ai.refreshVocabulary()
    console.log(`vocabulary: ${words.toLocaleString()} words`)
  } catch (error) {
    console.warn(`vocabulary not rebuilt (${error.message}); misspelled search words may not match`)
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (!(await ai.init())) {
    console.error('AI database is not reachable. Check AI_DB_* in your environment.')
    process.exit(1)
  }

  if (options.fillEmbeddings && options.dryRun) {
    const stats = await ai.stats()
    console.log(`${stats.chunks.toLocaleString()} chunks, ${stats.embeddings.toLocaleString()} with vectors`
      + ` — ${(stats.chunks - stats.embeddings).toLocaleString()} would be embedded`)
    return
  }

  const health = await ai.health()
  console.log(`embeddings: ${health.embeddings.provider}/${health.embeddings.model} `
    + `(${health.embeddings.dimensions}d) — ${health.embeddings.ok ? 'reachable' : `UNREACHABLE: ${health.embeddings.error}`}`)

  if (!health.embeddings.ok && !options.dryRun) {
    console.error('Refusing to run: documents would be indexed without vectors.')
    process.exit(1)
  }

  if (options.refreshVocabulary) {
    const words = await ai.refreshVocabulary()
    console.log(`vocabulary rebuilt: ${words.toLocaleString()} words`)
    return
  }

  if (options.fillEmbeddings) {
    const outcome = await runFillEmbeddings(options)
    await refreshVocabularyQuietly()
    const stats = await ai.stats()
    console.log(`\nembedded ${outcome.embedded}, failed ${outcome.failed}`
      + (outcome.error ? ` — last error: ${outcome.error}` : ''))
    console.log(`index now holds ${stats.documents} documents / ${stats.chunks} chunks / ${stats.embeddings} embeddings`)
    return
  }

  const result = options.dirs.length ? await runFolders(options) : await runDatabase(options)

  await refreshVocabularyQuietly()

  const stats = await ai.stats()
  console.log(`\nindexed ${result.indexed}, skipped/failed ${result.failed}`)
  console.log(`index now holds ${stats.documents} documents / ${stats.chunks} chunks / ${stats.embeddings} embeddings`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
