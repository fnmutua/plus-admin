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

/** Extensions we can turn into text. Anything else is skipped, not failed. */
const SUPPORTED = new Set(['.pdf', '.docx', '.csv', '.tsv', ...TEXT_EXTENSIONS])

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

  return null
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

module.exports = { extractText, recordToText, chunkText, isSupported, SUPPORTED }
