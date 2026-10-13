'use strict'

// File text extraction and chunking.
//
// Replaces LangChain's PDFLoader / DocxLoader / CSVLoader / TextLoader and
// RecursiveCharacterTextSplitter with direct calls to libraries this project
// already depends on.

const fs = require('fs')
const path = require('path')
const { config } = require('./config')

const TEXT_EXTENSIONS = new Set(['.txt', '.md', '.markdown', '.json', '.log', '.xml', '.html', '.htm'])

/** Types we can read out of an archive. Archives inside archives are not followed. */
const ARCHIVE_MEMBER_TYPES = new Set(['.pdf', '.docx', '.csv', '.tsv', ...TEXT_EXTENSIONS])

/** Extensions we can turn into text. Anything else is skipped, not failed. */
const SUPPORTED = new Set(['.pdf', '.docx', '.csv', '.tsv', '.zip', ...TEXT_EXTENSIONS])

// Guards for archives. A zip is attacker-shaped input even when it is only a
// consultant's report bundle: 1,661 of them are in the register, and one bad
// file should cost a skipped document rather than the indexing run.
const ARCHIVE_LIMITS = {
  members: 60,          // files read per archive
  memberBytes: 40 * 1024 * 1024,   // uncompressed size of any one member
  totalBytes: 200 * 1024 * 1024    // uncompressed total per archive
}

function isSupported(filename) {
  return SUPPORTED.has(path.extname(filename).toLowerCase())
}

/**
 * Extract plain text from a file.
 * @returns {Promise<string|null>} null when the type is unsupported.
 */
async function extractText(filePath, filename = filePath) {
  const ext = path.extname(filename).toLowerCase()

  if (ext === '.pdf') {
    const pdfParse = require('pdf-parse')
    const buffer = await fs.promises.readFile(filePath)
    const { text } = await pdfParse(buffer)
    return text
  }

  if (ext === '.docx') {
    const mammoth = require('mammoth')
    const { value } = await mammoth.extractRawText({ path: filePath })
    return value
  }

  if (ext === '.csv' || ext === '.tsv') {
    const Papa = require('papaparse')
    const raw = await fs.promises.readFile(filePath, 'utf8')
    const { data } = Papa.parse(raw, {
      header: true,
      skipEmptyLines: true,
      delimiter: ext === '.tsv' ? '\t' : ''
    })
    // Emit each row with its column names so a chunk taken from the middle of
    // the file still carries the header context.
    return data
      .map((row) => Object.entries(row)
        .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
        .map(([key, value]) => `${key}: ${value}`)
        .join(' | '))
      .filter(Boolean)
      .join('\n')
  }

  if (TEXT_EXTENSIONS.has(ext)) {
    return fs.promises.readFile(filePath, 'utf8')
  }

  if (ext === '.zip') {
    return extractArchive(filePath, filename)
  }

  return null
}

/**
 * Read the supported files out of a zip and return them as one text, each
 * member introduced by its path.
 *
 * Archives hold the bundled reports — plans, surveys, design packages — so
 * skipping them left the richest documents unread. Members are extracted to
 * temporary files because pdf-parse and mammoth want a path or a whole buffer,
 * and the temporary file is always removed.
 *
 * Nested archives are not followed, and the limits above bound the work: a
 * malformed or hostile zip costs this one document, not the run.
 */
async function extractArchive(filePath, filename) {
  const JSZip = require('jszip')
  const os = require('os')

  const archive = await JSZip.loadAsync(await fs.promises.readFile(filePath))
  const members = Object.values(archive.files)
    .filter((entry) => !entry.dir)
    .filter((entry) => ARCHIVE_MEMBER_TYPES.has(path.extname(entry.name).toLowerCase()))
    // Largest first: if the limits cut the archive short, keep the substance.
    .sort((a, b) => (b._data?.uncompressedSize || 0) - (a._data?.uncompressedSize || 0))

  if (!members.length) return null

  const parts = []
  const read = []
  let totalBytes = 0

  for (const entry of members) {
    if (read.length >= ARCHIVE_LIMITS.members) break
    if (totalBytes >= ARCHIVE_LIMITS.totalBytes) break

    const size = entry._data?.uncompressedSize || 0
    if (size > ARCHIVE_LIMITS.memberBytes) {
      console.warn(`[ai] ${filename}: skipping ${entry.name} (${Math.round(size / 1024 / 1024)}MB)`)
      continue
    }

    const temp = path.join(
      await fs.promises.mkdtemp(path.join(os.tmpdir(), 'ai-zip-')),
      path.basename(entry.name)
    )

    try {
      await fs.promises.writeFile(temp, await entry.async('nodebuffer'))
      const text = await extractText(temp, entry.name)
      if (text && text.trim()) {
        parts.push(`<<< file: ${entry.name} >>>\n${text.trim()}`)
        read.push(entry.name)
        totalBytes += size
      }
    } catch (error) {
      // One unreadable member does not spoil the archive.
      console.warn(`[ai] ${filename}: could not read ${entry.name} — ${error.message}`)
    } finally {
      await fs.promises.rm(path.dirname(temp), { recursive: true, force: true }).catch(() => {})
    }
  }

  if (!parts.length) return null

  const skipped = members.length - read.length
  console.log(`[ai] ${filename}: read ${read.length} of ${members.length} archived file(s)`
    + (skipped ? `, ${skipped} skipped` : ''))

  return parts.join('\n\n')
}

/**
 * Flatten a database row into text for indexing, skipping identifiers,
 * bookkeeping columns and geometry blobs.
 */
function recordToText(record, modelName) {
  const data = typeof record?.toJSON === 'function' ? record.toJSON() : record
  const skip = new Set(['id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'geom', 'geometry', 'password'])

  const lines = [`Record type: ${modelName}`]
  for (const [key, value] of Object.entries(data)) {
    if (skip.has(key) || value === null || value === undefined || value === '') continue
    lines.push(`${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
  }
  return lines.join('\n')
}

// Tried in order: split on the largest structural boundary that produces
// pieces small enough to work with, falling back to a hard cut.
const SEPARATORS = ['\n\n', '\n', '. ', ' ', '']

function splitRecursively(text, maxSize, separators) {
  if (text.length <= maxSize) return text ? [text] : []

  const [separator, ...rest] = separators

  if (separator === undefined || separator === '') {
    const pieces = []
    for (let i = 0; i < text.length; i += maxSize) pieces.push(text.slice(i, i + maxSize))
    return pieces
  }

  const parts = text.split(separator)
  const pieces = []
  parts.forEach((part, index) => {
    // Re-attach the separator so the concatenated chunks reproduce the source.
    const piece = index < parts.length - 1 ? part + separator : part
    if (!piece) return
    if (piece.length <= maxSize) pieces.push(piece)
    else pieces.push(...splitRecursively(piece, maxSize, rest))
  })
  return pieces
}

/**
 * Split text into overlapping chunks.
 * @returns {string[]}
 */
function chunkText(text, { size = config.chunk.size, overlap = config.chunk.overlap, max = config.chunk.maxPerDocument } = {}) {
  const normalised = String(text || '').replace(/\r\n/g, '\n').trim()
  if (!normalised) return []

  const pieces = splitRecursively(normalised, size, SEPARATORS)
  const chunks = []
  let buffer = ''

  for (const piece of pieces) {
    if (buffer && buffer.length + piece.length > size) {
      chunks.push(buffer)
      buffer = overlap > 0 ? buffer.slice(-overlap) : ''
    }
    buffer += piece
  }
  if (buffer.trim()) chunks.push(buffer)

  return chunks
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .slice(0, max)
}

module.exports = { extractText, recordToText, chunkText, isSupported, SUPPORTED, ARCHIVE_LIMITS }
