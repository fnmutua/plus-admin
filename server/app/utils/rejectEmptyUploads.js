'use strict'

// Refuse uploads that contain an empty (0-byte) file.
//
// An empty file is never what anyone meant to send. It usually comes from a
// cloud-storage placeholder (Dropbox, OneDrive, iCloud "online-only" files),
// which the browser happily sends as 0 bytes. Stored, it looks like a real
// document but cannot be opened, downloaded or read by the AI index.
//
// Wrap a multer instance once where it is created:
//   const upload = rejectEmptyUploads(multer({ ... }))
// and every .single() / .array() / .fields() / .any() it hands out answers
// 400 for a request carrying an empty file, after removing anything multer
// already wrote to disk for that request. The route handler never runs.

const fs = require('fs')

function uploadedFiles(req) {
  if (req.file) return [req.file]
  if (Array.isArray(req.files)) return req.files
  if (req.files && typeof req.files === 'object') return Object.values(req.files).flat()
  return []
}

function emptyFileMessage(names) {
  const list = names.join(', ')
  return (
    `${names.length === 1 ? 'This file is' : 'These files are'} empty (0 bytes): ${list}. ` +
    'Nothing was uploaded. If the file is in Dropbox, OneDrive or iCloud, make it available offline and try again.'
  )
}

function guard(middleware) {
  return (req, res, next) =>
    middleware(req, res, (err) => {
      if (err) return next(err)

      const files = uploadedFiles(req)
      const empty = files.filter((file) => Number(file.size) === 0)
      if (!empty.length) return next()

      files.forEach((file) => {
        if (file.path) fs.unlink(file.path, () => {})
      })

      const names = empty.map((file) => file.originalname || file.fieldname)
      return res.status(400).json({
        success: false,
        code: 'EMPTY_FILE',
        message: emptyFileMessage(names),
        files: names
      })
    })
}

function rejectEmptyUploads(upload) {
  return {
    single: (...args) => guard(upload.single(...args)),
    array: (...args) => guard(upload.array(...args)),
    fields: (...args) => guard(upload.fields(...args)),
    any: (...args) => guard(upload.any(...args)),
    none: (...args) => upload.none(...args)
  }
}

module.exports = { rejectEmptyUploads, emptyFileMessage }
