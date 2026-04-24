/* eslint-disable prettier/prettier */
const db = require('../models')
const moment = require('moment')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const shortid = require('shortid')
const nodemailer = require('nodemailer')

const generateDRCode = async () => {
  const prefix = 'DR'
  const year = moment().format('YYYY')

  const latest = await db.models.data_request.findOne({
    attributes: ['code'],
    order: [['createdAt', 'DESC']]
  })

  if (!latest) return `${prefix}-${year}-0001`

  const lastCode = latest.code
  const lastYear = lastCode.slice(3, 7)
  const lastSeq = parseInt(lastCode.slice(8), 10)

  if (lastYear === year) {
    return `${prefix}-${year}-${String(lastSeq + 1).padStart(4, '0')}`
  }
  return `${prefix}-${year}-0001`
}

exports.createPublicDataRequest = async (req, res) => {
  try {
    const {
      name, organization, position, work_area, mailing_address, email, phone,
      data_description, intended_use, data_classification, geographic_scope,
      how_data_used, data_shared, sharing_details, dissemination_plan,
      data_made_public, heard_about, declaration_name, declaration_date
    } = req.body

    // Basic required field validation
    const missing = []
    if (!name) missing.push('name')
    if (!organization) missing.push('organization')
    if (!position) missing.push('position')
    if (!email) missing.push('email')
    if (!phone) missing.push('phone')
    if (!data_description) missing.push('data_description')
    if (!intended_use) missing.push('intended_use')

    if (missing.length > 0) {
      return res.status(400).json({
        code: '4000',
        message: `Missing required fields: ${missing.join(', ')}`
      })
    }

    const code = await generateDRCode()

    const record = await db.models.data_request.create({
      code,
      name, organization, position, work_area, mailing_address, email, phone,
      data_description, intended_use, data_classification, geographic_scope,
      how_data_used, data_shared, sharing_details, dissemination_plan,
      data_made_public, heard_about, declaration_name,
      declaration_date: declaration_date || null,
      status: 'Pending'
    })

    return res.status(200).json({
      code: '0000',
      message: 'Data request submitted successfully.',
      results: { id: record.id, reference: code }
    })
  } catch (err) {
    console.error('[DataRequest] createPublicDataRequest error:', err)
    return res.status(500).json({
      code: '5000',
      message: err.message || 'An error occurred while submitting your request.'
    })
  }
}

exports.getDataRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const where = {}
    if (status) where.status = status

    const offset = (parseInt(page) - 1) * parseInt(limit)

    const { count, rows } = await db.models.data_request.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    })

    return res.status(200).json({
      code: '0000',
      message: 'OK',
      results: { total: count, data: rows }
    })
  } catch (err) {
    console.error('[DataRequest] getDataRequests error:', err)
    return res.status(500).json({ code: '5000', message: err.message })
  }
}

exports.getDataRequestById = async (req, res) => {
  try {
    const { id } = req.params
    const record = await db.models.data_request.findByPk(id)
    if (!record) return res.status(404).json({ code: '4004', message: 'Not found' })
    return res.status(200).json({ code: '0000', results: record })
  } catch (err) {
    console.error('[DataRequest] getDataRequestById error:', err)
    return res.status(500).json({ code: '5000', message: err.message })
  }
}

exports.updateDataRequestStatus = async (req, res) => {
  try {
    const { id } = req.params
    const {
      status,
      review_notes,
      dpo_recommendation,
      dpo_review_notes,
      coordinator_approval_status,
      coordinator_approval_notes
    } = req.body

    const record = await db.models.data_request.findByPk(id)
    if (!record) return res.status(404).json({ code: '4004', message: 'Not found' })

    const userId = req.thisUser?.id || null
    const now = new Date()
    const updates = {}

    // Backward-compatible payload support
    if (status !== undefined) updates.status = status
    if (review_notes !== undefined) updates.review_notes = review_notes

    // New workflow fields
    if (dpo_recommendation !== undefined) {
      updates.dpo_recommendation = dpo_recommendation
      updates.dpo_reviewed_by = userId
      updates.dpo_reviewed_at = now
    }
    if (dpo_review_notes !== undefined) updates.dpo_review_notes = dpo_review_notes

    if (coordinator_approval_status !== undefined) {
      updates.coordinator_approval_status = coordinator_approval_status
      updates.coordinator_approved_by = userId
      updates.coordinator_approved_at = now
    }
    if (coordinator_approval_notes !== undefined) updates.coordinator_approval_notes = coordinator_approval_notes

    // Canonical top-level status for list/search compatibility.
    // Coordinator decision is authoritative; otherwise keep pending.
    if (updates.coordinator_approval_status) {
      updates.status = updates.coordinator_approval_status
    } else if (!updates.status) {
      updates.status = 'Pending'
    }

    // Preserve legacy review fields as mirrors of the latest meaningful notes.
    if (!updates.review_notes) {
      updates.review_notes = updates.coordinator_approval_notes || updates.dpo_review_notes || record.review_notes
    }
    updates.reviewed_by = userId

    await record.update(updates)

    return res.status(200).json({ code: '0000', message: 'Updated', results: record })
  } catch (err) {
    console.error('[DataRequest] updateDataRequestStatus error:', err)
    return res.status(500).json({ code: '5000', message: err.message })
  }
}

// ── Document management ────────────────────────────────────────────────────────

const DR_UPLOAD_DIR = '/data/data-requests'
if (!fs.existsSync(DR_UPLOAD_DIR)) {
  try { fs.mkdirSync(DR_UPLOAD_DIR, { recursive: true }) } catch {}
}

const drStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, DR_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`
    const ext = path.extname(file.originalname)
    cb(null, `${path.basename(file.originalname, ext)}-${unique}${ext}`)
  }
})
const drUpload = multer({ storage: drStorage, limits: { fileSize: 200 * 1024 * 1024 } })

exports.getDataRequestDocuments = async (req, res) => {
  try {
    const { id } = req.params
    const docs = await db.models.data_request_document.findAll({
      where: { data_request_id: id },
      order: [['createdAt', 'ASC']]
    })
    return res.status(200).json({ code: '0000', results: docs })
  } catch (err) {
    console.error('[DataRequest] getDataRequestDocuments error:', err)
    return res.status(500).json({ code: '5000', message: err.message })
  }
}

exports.uploadDataRequestDocument = (req, res) => {
  drUpload.single('file')(req, res, async (err) => {
    if (err) return res.status(500).json({ code: '5000', message: 'Upload failed: ' + err.message })
    if (!req.file) return res.status(400).json({ code: '4000', message: 'No file provided' })

    const { id } = req.params
    const f = req.file
    const ext = path.extname(f.originalname).replace('.', '').toLowerCase()
    const sizeMB = parseFloat((f.size / (1024 * 1024)).toFixed(4))

    try {
      const doc = await db.models.data_request_document.create({
        data_request_id: parseInt(id),
        name: f.originalname,
        format: ext,
        size: sizeMB,
        location: f.path,
        auto_generated: false,
        code: shortid.generate(),
        createdBy: req.thisUser?.id || null
      })
      return res.status(200).json({ code: '0000', message: 'Uploaded', results: doc })
    } catch (e) {
      // clean up file if DB insert failed
      try { fs.unlinkSync(f.path) } catch {}
      console.error('[DataRequest] uploadDataRequestDocument error:', e)
      return res.status(500).json({ code: '5000', message: e.message })
    }
  })
}

exports.deleteDataRequestDocument = async (req, res) => {
  try {
    const { id, docId } = req.params
    const doc = await db.models.data_request_document.findOne({
      where: { id: docId, data_request_id: id }
    })
    if (!doc) return res.status(404).json({ code: '4004', message: 'Document not found' })
    if (doc.auto_generated) {
      return res.status(403).json({ code: '4003', message: 'Cannot delete auto-generated documents' })
    }
    try { if (doc.location && fs.existsSync(doc.location)) fs.unlinkSync(doc.location) } catch {}
    await doc.destroy()
    return res.status(200).json({ code: '0000', message: 'Deleted' })
  } catch (err) {
    console.error('[DataRequest] deleteDataRequestDocument error:', err)
    return res.status(500).json({ code: '5000', message: err.message })
  }
}

exports.downloadDataRequestDocument = async (req, res) => {
  try {
    const { id, docId } = req.params
    const doc = await db.models.data_request_document.findOne({
      where: { id: docId, data_request_id: id }
    })
    if (!doc) return res.status(404).json({ message: 'Not found' })
    if (!fs.existsSync(doc.location)) return res.status(404).json({ message: 'File missing on disk' })
    return res.download(doc.location, doc.name)
  } catch (err) {
    console.error('[DataRequest] downloadDataRequestDocument error:', err)
    return res.status(500).json({ code: '5000', message: err.message })
  }
}

// ── Sharing ────────────────────────────────────────────────────────────────────

const buildTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'kisip.mis@gmail.com',
      pass: process.env.EMAIL_PASS || 'ycoxaqavmfiqljjg'
    }
  })

exports.shareDataRequest = async (req, res) => {
  try {
    const { id } = req.params

    const request = await db.models.data_request.findByPk(id)
    if (!request) return res.status(404).json({ code: '4004', message: 'Request not found' })

    const docs = await db.models.data_request_document.findAll({ where: { data_request_id: id } })
    if (!docs.length) {
      return res.status(400).json({ code: '4000', message: 'No documents to share' })
    }

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await db.models.data_request_share.create({
      token,
      data_request_id: parseInt(id),
      email: request.email,
      expiresAt,
      isRevoked: false,
      createdBy: req.thisUser?.id || null
    })

    const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`.replace(/:\d+$/, '')
    const publicUrl = `${frontendUrl}/#/dr-share/${token}`

    // Send email to requester
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (emailRegex.test(request.email)) {
      const html = `
        <p>Dear ${request.name},</p>
        <p>Your data request <strong>${request.code}</strong> has been processed.</p>
        <p>Please use the link below to view and download your data:</p>
        <p><a href="${publicUrl}" style="font-size:16px">${publicUrl}</a></p>
        <p>This link is valid until ${expiresAt.toDateString()}.</p>
        <p>If you have any questions, please contact the KeSMIS support team.</p>
        <br/>
        <p>Kenya Slum Information Management System (KeSMIS)</p>
      `
      try {
        await buildTransporter().sendMail({
          from: process.env.EMAIL_FROM || 'kisip.mis@gmail.com',
          to: request.email,
          subject: `Data Request ${request.code} — Your Data is Ready`,
          text: `Dear ${request.name},\n\nYour data request ${request.code} has been processed.\nDownload link: ${publicUrl}\nValid until: ${expiresAt.toDateString()}`,
          html
        })
      } catch (emailErr) {
        console.error('[DataRequest] shareDataRequest email error:', emailErr)
        // Don't fail the whole request if email fails
      }
    }

    return res.status(200).json({
      code: '0000',
      message: 'Share link created and email sent',
      results: { token, url: publicUrl, expiresAt }
    })
  } catch (err) {
    console.error('[DataRequest] shareDataRequest error:', err)
    return res.status(500).json({ code: '5000', message: err.message })
  }
}

// ── Public share endpoints ─────────────────────────────────────────────────────

exports.getPublicDataRequestShare = async (req, res) => {
  try {
    const { token } = req.params
    const share = await db.models.data_request_share.findOne({ where: { token, isRevoked: false } })
    if (!share) return res.status(404).json({ code: '4004', message: 'Share not found' })
    if (share.expiresAt && new Date(share.expiresAt).getTime() < Date.now()) {
      return res.status(410).json({ code: '4010', message: 'Link expired' })
    }

    const docs = await db.models.data_request_document.findAll({
      where: { data_request_id: share.data_request_id },
      order: [['createdAt', 'ASC']]
    })

    return res.status(200).json({
      code: '0000',
      results: {
        documents: docs.map(d => ({
          id: d.id,
          name: d.name,
          format: d.format,
          size: d.size,
          createdAt: d.createdAt
        })),
        expiresAt: share.expiresAt
      }
    })
  } catch (err) {
    console.error('[DataRequest] getPublicDataRequestShare error:', err)
    return res.status(500).json({ code: '5000', message: err.message })
  }
}

exports.downloadPublicDataRequestDocument = async (req, res) => {
  try {
    const { token, docId } = req.params
    const share = await db.models.data_request_share.findOne({ where: { token, isRevoked: false } })
    if (!share) return res.status(404).json({ message: 'Share not found' })
    if (share.expiresAt && new Date(share.expiresAt).getTime() < Date.now()) {
      return res.status(410).json({ message: 'Link expired' })
    }

    const doc = await db.models.data_request_document.findOne({
      where: { id: docId, data_request_id: share.data_request_id }
    })
    if (!doc) return res.status(403).json({ message: 'Not allowed' })
    if (!fs.existsSync(doc.location)) return res.status(404).json({ message: 'File not found' })

    return res.download(doc.location, doc.name)
  } catch (err) {
    console.error('[DataRequest] downloadPublicDataRequestDocument error:', err)
    return res.status(500).json({ code: '5000', message: err.message })
  }
}
