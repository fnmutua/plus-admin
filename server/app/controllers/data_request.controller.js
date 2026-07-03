/* eslint-disable prettier/prettier */
const db = require('../models')
const moment = require('moment')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const shortid = require('shortid')
const nodemailer = require('nodemailer')
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib')
const QRCode = require('qrcode')
const { getFrontendBaseUrl } = require('../utils/frontend-url')
const { sendSMS, formatPhoneNumber } = require('../utils/sms')
const { isDataRequestSMSEnabled } = require('../utils/smsSettings')
const notificationService = require('../services/notification.service')

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

const normalizeDate = (d) => (d ? new Date(d).toLocaleDateString('en-KE') : '')
const yesNoText = (v) => (v === true ? 'Yes' : v === false ? 'No' : '')

const setTextFieldIfExists = (form, names = [], value = '') => {
  const v = value == null ? '' : String(value)
  names.forEach((name) => {
    try {
      const f = form.getTextField(name)
      f.setText(v)
    } catch (_) {}
  })
}

const setCheckboxIfExists = (form, names = [], checked = false) => {
  names.forEach((name) => {
    try {
      const c = form.getCheckBox(name)
      if (checked) c.check()
      else c.uncheck()
    } catch (_) {}
  })
}

const setRadioGroupIfExists = (form, name, value) => {
  try {
    const rg = form.getRadioGroup(name)
    if (value == null || value === '') return
    rg.select(String(value))
  } catch (_) {}
}

const setApprovalRadio = (form, name, status) => {
  try {
    const rg = form.getRadioGroup(name)
    const options = rg.getOptions()
    if (status === 'Approved') {
      const approveOpt = options.find((o) => /^app/i.test(String(o)))
      if (approveOpt) rg.select(String(approveOpt))
      return
    }
    if (status === 'Rejected') {
      const rejectOpt = options.find((o) => /^rej/i.test(String(o)))
      if (rejectOpt) rg.select(String(rejectOpt))
    }
  } catch (_) {}
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const internalFormNameRegex = /data[\s\-_]?request[\s\-_]?form/i

const isRequesterVisibleDocument = (doc) => {
  const name = String(doc?.name || '')
  // Hide internal workflow forms (auto-generated and signed re-uploads) from requester shares.
  if (doc?.auto_generated) return false
  if (internalFormNameRegex.test(name)) return false
  return true
}

/** Public frontend origin — aligned with VITE_APP_HOST / FRONTEND_URL (see utils/frontend-url). */
const publicFrontendBaseUrl = (req) => getFrontendBaseUrl(req)

/** Public clarify page — matches admin UI: `origin + '/#/dr-clarify/' + token` */
const buildDrClarifyPublicUrl = (token, req) => {
  const base = publicFrontendBaseUrl(req)
  if (!base || !token) return ''
  return `${base}/#/dr-clarify/${token}`
}

const CLARIFICATION_TOKEN_DAYS = 90

const ensureClarificationToken = async (record) => {
  const updates = {}
  if (!record.clarification_token) {
    updates.clarification_token = crypto.randomUUID()
    updates.clarification_token_expires_at = new Date(
      Date.now() + CLARIFICATION_TOKEN_DAYS * 24 * 60 * 60 * 1000
    )
  } else if (
    record.clarification_token_expires_at &&
    new Date(record.clarification_token_expires_at).getTime() < Date.now()
  ) {
    updates.clarification_token = crypto.randomUUID()
    updates.clarification_token_expires_at = new Date(
      Date.now() + CLARIFICATION_TOKEN_DAYS * 24 * 60 * 60 * 1000
    )
  }
  if (Object.keys(updates).length) {
    await record.update(updates)
  }
  return record.clarification_token
}

const findDataRequestByClarificationToken = async (token) => {
  if (!token) return null
  const record = await db.models.data_request.findOne({ where: { clarification_token: token } })
  if (!record) return null
  if (
    record.clarification_token_expires_at &&
    new Date(record.clarification_token_expires_at).getTime() < Date.now()
  ) {
    return { expired: true, record }
  }
  return { expired: false, record }
}

const sendClarificationQuestionEmail = async (req, record, messageBody) => {
  const to = String(record?.email || '').trim()
  if (!to || !emailRegex.test(to)) return

  const clarifyUrl = buildDrClarifyPublicUrl(record.clarification_token, req)
  if (!clarifyUrl) return

  const subject = `Clarification needed — Data request ${record.code}`
  const html = `
    <p>Dear ${record.name || 'Applicant'},</p>
    <p>The KeSMIS team needs additional information regarding your data request <strong>${record.code}</strong>.</p>
    <blockquote style="margin:12px 0;padding:12px 16px;border-left:4px solid #409eff;background:#f5f7fa;">
      ${String(messageBody || '').replace(/\n/g, '<br/>')}
    </blockquote>
    <p>Please use the link below to view the full conversation and submit your response:</p>
    <p><a href="${clarifyUrl}" style="font-size:16px">${clarifyUrl}</a></p>
    <p>This link is valid until ${record.clarification_token_expires_at ? new Date(record.clarification_token_expires_at).toDateString() : 'expiry'}.</p>
    <br/><p>Kenya Slum Information Management System (KeSMIS)</p>
  `
  const text = [
    `Dear ${record.name || 'Applicant'},`,
    '',
    `We need clarification on your data request ${record.code}:`,
    '',
    messageBody,
    '',
    `Respond here: ${clarifyUrl}`,
    '',
    'KeSMIS'
  ].join('\n')

  await buildTransporter().sendMail({
    from: process.env.EMAIL_FROM || 'kisip.mis@gmail.com',
    to,
    subject,
    text,
    html
  })
}

const notifySupportClarificationReply = async (req, record, messageBody) => {
  const supportUsers = await getSupportUsers()

  const recipients = supportUsers
    .filter((u) => u?.isactive && emailRegex.test(u?.email || ''))
    .map((u) => ({ name: u.name || 'Support', email: u.email }))

  const frontendUrl = publicFrontendBaseUrl(req)
  const adminUrl = `${frontendUrl}/#/admin/data-requests/${record.id}`
  const subject = `Clarification reply — ${record.code}`
  const html = `
    <p>Hello Support Team,</p>
    <p><strong>${record.name}</strong> replied to a clarification request on data request <strong>${record.code}</strong>.</p>
    <blockquote style="margin:12px 0;padding:12px 16px;border-left:4px solid #67c23a;background:#f5f7fa;">
      ${String(messageBody || '').replace(/\n/g, '<br/>')}
    </blockquote>
    <p><a href="${adminUrl}">Open request in admin</a></p>
    <p>KeSMIS</p>
  `

  if (recipients.length) {
    const transporter = buildTransporter()
    await Promise.all(recipients.map((r) =>
      transporter.sendMail({
        from: process.env.EMAIL_FROM || 'kisip.mis@gmail.com',
        to: r.email,
        subject,
        text: `${record.name} replied on ${record.code}:\n\n${messageBody}\n\nOpen: ${adminUrl}`,
        html
      })
    ))
  }

  const smsMessage = `KeSMIS: ${record.name} replied on data request ${record.code}. Please review in admin.`
  await notifySupportUsersBySms(supportUsers, smsMessage)
}

const getSupportUsers = async () =>
  db.user.findAll({
    attributes: ['id', 'name', 'email', 'phone', 'isactive'],
    include: [{
      model: db.role,
      attributes: ['name'],
      where: { name: 'support' },
      through: { attributes: [] }
    }]
  })

const notifySupportUsersBySms = async (supportUsers, message) => {
  const smsEnabled = await isDataRequestSMSEnabled()
  if (!smsEnabled) {
    console.log('[DataRequest] SMS disabled for data request module — skipping officer SMS')
    return
  }

  const recipients = (supportUsers || []).filter(
    (u) => u?.isactive && formatPhoneNumber(u?.phone)
  )
  if (!recipients.length) {
    console.log('[DataRequest] No support officers with valid phone numbers for SMS')
    return
  }

  await Promise.allSettled(recipients.map(async (u) => {
    try {
      await sendSMS(u.phone, message)
      console.log(`[DataRequest] SMS sent to ${u.name} (${u.phone})`)
      await notificationService.recordDelivery({
        userId: u.id,
        channel: 'sms',
        body: message,
        sourceModule: 'data_request',
        sourceType: 'officer_alert',
        status: 'sent',
        address: u.phone,
        sentAt: new Date()
      })
    } catch (err) {
      console.error(`[DataRequest] SMS failed for ${u.name} (${u.phone}):`, err.message || err)
      await notificationService.recordDelivery({
        userId: u.id,
        channel: 'sms',
        body: message,
        sourceModule: 'data_request',
        sourceType: 'officer_alert',
        status: 'failed',
        providerMessage: err.message || String(err),
        address: u.phone,
        sentAt: new Date()
      })
    }
  }))
}

/** Public download page — matches `DataRequestDetail.vue`: `origin + '/#/dr-share/' + token` */
const buildDrSharePublicUrl = (token, req) => {
  const base = publicFrontendBaseUrl(req)
  if (!base || !token) return ''
  return `${base}/#/dr-share/${token}`
}

/** Latest non-revoked, non-expired share link for this request (if any). */
const findActiveDrShareUrl = async (record, req) => {
  if (!record?.id) return ''
  try {
    const share = await db.models.data_request_share.findOne({
      where: { data_request_id: record.id, isRevoked: false },
      order: [['createdAt', 'DESC']]
    })
    if (!share?.token) return ''
    if (share.expiresAt && new Date(share.expiresAt).getTime() < Date.now()) return ''
    return buildDrSharePublicUrl(share.token, req)
  } catch (_) {
    return ''
  }
}

const generateDataRequestFormPdf = async (record, req = null) => {
  const formPath = path.join(__dirname, '../../../public/forms/Data-Request-Form-fill.pdf')
  if (!fs.existsSync(formPath)) {
    throw new Error(`Template not found: ${formPath}`)
  }

  let requestedCountyText = ''
  let requestedSubcountyText = ''
  if (record.requested_county != null && record.requested_county !== '') {
    try {
      const c = await db.models.county.findByPk(record.requested_county, { attributes: ['name'] })
      requestedCountyText = c?.name ? String(c.name) : String(record.requested_county)
    } catch (_) {
      requestedCountyText = String(record.requested_county)
    }
  }
  if (record.requested_subcounty != null && record.requested_subcounty !== '') {
    try {
      const s = await db.models.subcounty.findByPk(record.requested_subcounty, { attributes: ['name'] })
      requestedSubcountyText = s?.name ? String(s.name) : String(record.requested_subcounty)
    } catch (_) {
      requestedSubcountyText = String(record.requested_subcounty)
    }
  }

  const formBytes = fs.readFileSync(formPath)
  const pdfDoc = await PDFDocument.load(formBytes)
  const form = pdfDoc.getForm()

  // Exact template field names from Data-Request-Form-fill.pdf
  setTextFieldIfExists(form, ['name'], record.name)
  setTextFieldIfExists(form, ['organization'], record.organization)
  setTextFieldIfExists(form, ['position'], record.position)
  setTextFieldIfExists(form, ['work_area'], record.work_area)
  setTextFieldIfExists(form, ['mailing_address'], record.mailing_address)
  setTextFieldIfExists(form, ['email'], record.email)
  setTextFieldIfExists(form, ['phone'], record.phone)

  setTextFieldIfExists(form, ['data_description'], record.data_description)
  setTextFieldIfExists(form, ['intended_use'], record.intended_use)
  setTextFieldIfExists(form, ['geographic_scope'], record.geographic_scope)
  // New PDF fields: resolved admin-unit names (IDs stored on data_request)
  setTextFieldIfExists(
    form,
    ['requested_county', 'requested_county_name', 'County requested'],
    requestedCountyText
  )
  setTextFieldIfExists(
    form,
    ['requested_subcounty', 'requested_subcounty_name', 'Subcounty requested'],
    requestedSubcountyText
  )
  setTextFieldIfExists(form, ['how_data_used'], record.how_data_used)
  setTextFieldIfExists(form, ['sharing_details'], record.sharing_details)
  setTextFieldIfExists(form, ['dissemination_plan'], record.dissemination_plan)
  setTextFieldIfExists(form, ['data_made_public'], record.data_made_public)
  setTextFieldIfExists(form, ['heard_about'], record.heard_about)
  setRadioGroupIfExists(form, 'data_shared', yesNoText(record.data_shared))

  const cls = new Set(record.data_classification || [])
  setCheckboxIfExists(form, ['Aggregated'], cls.has('Aggregated'))
  setCheckboxIfExists(form, ['Anonymized'], cls.has('Anonymized'))
  setCheckboxIfExists(form, ['Personal Data'], cls.has('Personal Data'))
  setCheckboxIfExists(form, ['SensitiveHighly Sensitive'], cls.has('Sensitive/Highly Sensitive'))

  setTextFieldIfExists(form, ['declaration_name'], record.declaration_name || record.name)
  setTextFieldIfExists(form, ['declaration_date'], normalizeDate(record.declaration_date))

  setTextFieldIfExists(form, ['reviewed_by'], record.reviewed_by || '')
  setTextFieldIfExists(form, ['dpo_reviewed_at'], normalizeDate(record.dpo_reviewed_at))
  setTextFieldIfExists(form, ['dpo_review_notes'], record.dpo_review_notes || '')
  setApprovalRadio(form, 'dpo_recommendation', record.dpo_recommendation)
  setTextFieldIfExists(form, ['coordinator_approved_at'], normalizeDate(record.coordinator_approved_at))
  setTextFieldIfExists(form, ['coordinator_approval_notes'], record.coordinator_approval_notes || '')
  setApprovalRadio(form, 'coordinator_approval_status', record.coordinator_approval_status)

  // Match grievance PDF fill content rendering font
  const contentFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  form.updateFieldAppearances(contentFont)

  form.flatten()

  // QR at bottom: same public link as admin "Email Download Link" (dr-share), when a share exists.
  const shareUrl = await findActiveDrShareUrl(record, req)
  if (shareUrl) {
    try {
      const qrCodeDataUri = await QRCode.toDataURL(shareUrl)
      const qrImage = await pdfDoc.embedPng(qrCodeDataUri)
      const pages = pdfDoc.getPages()
      const page = pages[pages.length - 1]
      const { width: pw } = page.getSize()
      const qrSize = 72
      const qrX = (pw - qrSize) / 2
      const qrY = 52
      page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize })
      const caption = 'Scan to open requester download link'
      const captionSize = 8
      const tw = contentFont.widthOfTextAtSize(caption, captionSize)
      page.drawText(caption, {
        x: (pw - tw) / 2,
        y: qrY + qrSize + 10,
        size: captionSize,
        font: contentFont,
        color: rgb(0.35, 0.35, 0.35)
      })
    } catch (e) {
      console.error('[DataRequest] PDF QR embed failed:', e)
    }
  }

  return pdfDoc.save()
}

exports.createPublicDataRequest = async (req, res) => {
  try {
    const {
      name, organization, position, work_area, mailing_address, email, phone,
      data_description, intended_use, data_classification, geographic_scope,
      requested_county, requested_subcounty,
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
      requested_county: requested_county || null,
      requested_subcounty: requested_subcounty || null,
      how_data_used, data_shared, sharing_details, dissemination_plan,
      data_made_public, heard_about, declaration_name,
      declaration_date: declaration_date || null,
      status: 'Pending'
    })

    // Auto-generate request form PDF and attach to this request for DPO workflow.
    try {
      await ensureDataRequestFormDocument(record, null, false, req)
    } catch (pdfErr) {
      // Submission should still succeed even if PDF generation fails.
      console.error('[DataRequest] auto PDF generation failed:', pdfErr)
    }

    try {
      await notifySupportUsersNewDataRequest(req, record)
    } catch (notifyErr) {
      // Submission should still succeed even if support alerts fail.
      console.error('[DataRequest] support alert failed:', notifyErr)
    }

    try {
      await sendRequesterAcknowledgmentEmail(req, record)
    } catch (ackErr) {
      console.error('[DataRequest] requester acknowledgment email failed:', ackErr)
    }

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
    const results = await enrichDataRequestRecord(record)
    return res.status(200).json({ code: '0000', results })
  } catch (err) {
    console.error('[DataRequest] getDataRequestById error:', err)
    return res.status(500).json({ code: '5000', message: err.message })
  }
}

const enrichDataRequestRecord = async (record) => {
  const plain = record.toJSON ? record.toJSON() : { ...record }
  const reviewerIds = [plain.dpo_reviewed_by, plain.coordinator_approved_by].filter(Boolean)
  if (reviewerIds.length) {
    const reviewers = await db.user.findAll({
      where: { id: reviewerIds },
      attributes: ['id', 'name']
    })
    const byId = Object.fromEntries(reviewers.map((u) => [u.id, u.name]))
    plain.dpo_reviewer_name = plain.dpo_reviewed_by ? (byId[plain.dpo_reviewed_by] || null) : null
    plain.coordinator_reviewer_name = plain.coordinator_approved_by
      ? (byId[plain.coordinator_approved_by] || null)
      : null
  }
  return plain
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
    const previousCoordinatorStatus = record.coordinator_approval_status

    if (status !== undefined) updates.status = status
    if (review_notes !== undefined) updates.review_notes = review_notes

    if (dpo_recommendation !== undefined) {
      updates.dpo_recommendation = dpo_recommendation
      if (dpo_recommendation !== record.dpo_recommendation && dpo_recommendation !== 'Pending') {
        updates.dpo_reviewed_by = userId
        updates.dpo_reviewed_at = now
      }
    }
    if (dpo_review_notes !== undefined) updates.dpo_review_notes = dpo_review_notes

    const effectiveDpo = updates.dpo_recommendation ?? record.dpo_recommendation

    if (coordinator_approval_status !== undefined) {
      if (coordinator_approval_status === 'Approved' && effectiveDpo !== 'Approved') {
        return res.status(400).json({
          code: '4000',
          message: effectiveDpo === 'Rejected'
            ? 'Coordinator cannot approve: the DPO has rejected this request.'
            : 'Coordinator cannot approve until the DPO recommendation is Approved.'
        })
      }

      updates.coordinator_approval_status = coordinator_approval_status
      if (
        coordinator_approval_status !== record.coordinator_approval_status &&
        coordinator_approval_status !== 'Pending'
      ) {
        updates.coordinator_approved_by = userId
        updates.coordinator_approved_at = now
      }
    }
    if (coordinator_approval_notes !== undefined) {
      updates.coordinator_approval_notes = coordinator_approval_notes
    }

    if (updates.coordinator_approval_status) {
      updates.status = updates.coordinator_approval_status
    } else if (!updates.status) {
      updates.status = record.status || 'Pending'
    }

    if (review_notes !== undefined) {
      updates.review_notes = review_notes
    } else if (updates.coordinator_approval_notes !== undefined || updates.dpo_review_notes !== undefined) {
      updates.review_notes =
        updates.coordinator_approval_notes ??
        updates.dpo_review_notes ??
        record.coordinator_approval_notes ??
        record.dpo_review_notes ??
        record.review_notes
    }

    if (
      updates.dpo_recommendation !== undefined ||
      updates.coordinator_approval_status !== undefined
    ) {
      updates.reviewed_by = userId
    }

    await record.update(updates)
    await record.reload()

    const becameRejected =
      updates.coordinator_approval_status === 'Rejected' &&
      previousCoordinatorStatus !== 'Rejected'

    if (becameRejected) {
      try {
        await sendRequesterRejectionEmail(req, record)
      } catch (emailErr) {
        console.error('[DataRequest] requester rejection email failed:', emailErr)
      }
    }

    const results = await enrichDataRequestRecord(record)
    return res.status(200).json({ code: '0000', message: 'Updated', results })
  } catch (err) {
    console.error('[DataRequest] updateDataRequestStatus error:', err)
    return res.status(500).json({ code: '5000', message: err.message })
  }
}

// ── Document management ────────────────────────────────────────────────────────

const { DATA_REQUEST_UPLOAD_DIR, ensureDir } = require('../config/paths.config')

const DR_UPLOAD_DIR = DATA_REQUEST_UPLOAD_DIR
if (!fs.existsSync(DR_UPLOAD_DIR)) {
  try { ensureDir(DR_UPLOAD_DIR) } catch {}
}

const ensureDataRequestFormDocument = async (record, createdBy = null, force = false, req = null) => {
  const existing = await db.models.data_request_document.findOne({
    where: { data_request_id: record.id, auto_generated: true },
    order: [['createdAt', 'ASC']]
  })
  if (existing && !force) return existing
  if (existing && force) {
    try { if (existing.location && fs.existsSync(existing.location)) fs.unlinkSync(existing.location) } catch {}
    await existing.destroy()
  }

  const pdfBytes = await generateDataRequestFormPdf(record, req)
  const fileName = `${record.code}-Data-Request-Form.pdf`
  const filePath = path.join(DR_UPLOAD_DIR, fileName)
  fs.writeFileSync(filePath, pdfBytes)
  const sizeMB = parseFloat((Buffer.byteLength(pdfBytes) / (1024 * 1024)).toFixed(4))

  return db.models.data_request_document.create({
    data_request_id: record.id,
    name: fileName,
    format: 'pdf',
    size: sizeMB,
    location: filePath,
    auto_generated: true,
    code: shortid.generate(),
    createdBy
  })
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

exports.generateDataRequestFormDocument = async (req, res) => {
  try {
    const { id } = req.params
    const record = await db.models.data_request.findByPk(id)
    if (!record) return res.status(404).json({ code: '4004', message: 'Request not found' })

    const force = req.body?.force === true || req.body?.force === 'true'
    const doc = await ensureDataRequestFormDocument(record, req.thisUser?.id || null, force, req)
    return res.status(200).json({ code: '0000', message: 'Form ready', results: doc })
  } catch (err) {
    console.error('[DataRequest] generateDataRequestFormDocument error:', err)
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

/** Acknowledgment to the requester after a successful public submission (non-blocking). */
const sendRequesterAcknowledgmentEmail = async (req, requestRecord) => {
  const to = String(requestRecord?.email || '').trim()
  if (!to || !emailRegex.test(to)) return

  const code = requestRecord.code || ''
  const displayName = requestRecord.name || 'Applicant'
  const landingBase = publicFrontendBaseUrl(req)
  const landingLink = landingBase ? `${landingBase}/#/landing` : ''

  const subject = `Data request received — ${code}`
  const textLines = [
    `Dear ${displayName},`,
    '',
    'Thank you for submitting a data access request to KeSMIS.',
    '',
    `Your reference: ${code}`,
    '',
    'We have received your application. The programme team will review it under the applicable data-protection and data-sharing procedures.',
    '',
    'When your request is approved and materials are ready, you may receive a separate email with a secure link to download your data.',
    landingLink ? `KeSMIS: ${landingLink}` : '',
    '',
    'Kenya Slum Information Management System (KeSMIS)'
  ]
  const html = `
    <p>Dear ${displayName},</p>
    <p>Thank you for submitting a <strong>data access request</strong> to the Kenya Slum Information Management System (KeSMIS).</p>
    <p><strong>Your reference:</strong> ${code}</p>
    <p>We have received your application. The programme team will review it under the applicable data-protection and data-sharing procedures.</p>
    <p>When your request is approved and materials are ready, you may receive a <strong>separate email</strong> with a secure link to download your data.</p>
    ${landingLink ? `<p>For general information, visit <a href="${landingLink}">${landingLink}</a>.</p>` : ''}
    <br/><p>Kenya Slum Information Management System (KeSMIS)</p>
  `

  const transporter = buildTransporter()
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'kisip.mis@gmail.com',
    to,
    subject,
    text: textLines.join('\n'),
    html
  })
}

/** Notify requester when coordinator rejects their data request. */
const sendRequesterRejectionEmail = async (req, requestRecord) => {
  const to = String(requestRecord?.email || '').trim()
  if (!to || !emailRegex.test(to)) return

  const code = requestRecord.code || ''
  const displayName = requestRecord.name || 'Applicant'
  const notes = String(
    requestRecord.coordinator_approval_notes ||
    requestRecord.dpo_review_notes ||
    ''
  ).trim()
  const landingBase = publicFrontendBaseUrl(req)
  const landingLink = landingBase ? `${landingBase}/#/landing` : ''

  const subject = `Data request update — ${code}`
  const html = `
    <p>Dear ${displayName},</p>
    <p>Thank you for your data access request to KeSMIS (<strong>${code}</strong>).</p>
    <p>After review, we are unable to approve your request at this time.</p>
    ${notes ? `<p><strong>Notes from the review team:</strong><br/>${notes.replace(/\n/g, '<br/>')}</p>` : ''}
    <p>If you believe this decision was made in error or you have additional information, please contact the KeSMIS support team.</p>
    ${landingLink ? `<p>For general information, visit <a href="${landingLink}">${landingLink}</a>.</p>` : ''}
    <br/><p>Kenya Slum Information Management System (KeSMIS)</p>
  `
  const text = [
    `Dear ${displayName},`,
    '',
    `Your data request ${code} was not approved after review.`,
    notes ? `\nNotes: ${notes}` : '',
    '',
    'Contact the KeSMIS support team if you need further assistance.',
    '',
    'KeSMIS'
  ].join('\n')

  await buildTransporter().sendMail({
    from: process.env.EMAIL_FROM || 'kisip.mis@gmail.com',
    to,
    subject,
    text,
    html
  })
}

const notifySupportUsersNewDataRequest = async (req, requestRecord) => {
  const supportUsers = await getSupportUsers()

  const recipients = supportUsers
    .filter((u) => u?.isactive && emailRegex.test(u?.email || ''))
    .map((u) => ({ name: u.name || 'Support', email: u.email }))

  const frontendUrl = publicFrontendBaseUrl(req)
  const adminUrl = `${frontendUrl}/#/admin/data-requests/${requestRecord.id}`
  const submittedOn = new Date(requestRecord.createdAt).toLocaleString('en-KE')
  const subject = `New Data Request Submitted: ${requestRecord.code}`
  const html = `
    <p>Hello Support Team,</p>
    <p>A new data request has been submitted and needs attention.</p>
    <ul>
      <li><strong>Reference:</strong> ${requestRecord.code}</li>
      <li><strong>Requester:</strong> ${requestRecord.name}</li>
      <li><strong>Email:</strong> ${requestRecord.email}</li>
      <li><strong>Submitted On:</strong> ${submittedOn}</li>
    </ul>
    <p>Open request: <a href="${adminUrl}">${adminUrl}</a></p>
    <p>Kenya Slum Information Management System (KeSMIS)</p>
  `

  if (recipients.length) {
    const transporter = buildTransporter()
    await Promise.all(recipients.map((r) =>
      transporter.sendMail({
        from: process.env.EMAIL_FROM || 'kisip.mis@gmail.com',
        to: r.email,
        subject,
        text: `Hello ${r.name},\n\nA new data request (${requestRecord.code}) has been submitted by ${requestRecord.name} (${requestRecord.email}).\nOpen request: ${adminUrl}\n\nKeSMIS`,
        html
      })
    ))
  }

  const smsMessage = `KeSMIS: New data request ${requestRecord.code} from ${requestRecord.name}. Please review in admin.`
  await notifySupportUsersBySms(supportUsers, smsMessage)
}

exports.shareDataRequest = async (req, res) => {
  try {
    const { id } = req.params

    const request = await db.models.data_request.findByPk(id)
    if (!request) return res.status(404).json({ code: '4004', message: 'Request not found' })

    if (request.coordinator_approval_status !== 'Approved') {
      return res.status(400).json({
        code: '4000',
        message: 'Coordinator approval is required before emailing the download link'
      })
    }

    if (request.dpo_recommendation !== 'Approved') {
      return res.status(400).json({
        code: '4000',
        message: 'DPO approval is required before sharing data with the requester'
      })
    }

    if (request.clarification_status === 'awaiting_requester') {
      return res.status(400).json({
        code: '4000',
        message: 'Resolve clarifications with the requester before sharing data'
      })
    }

    const docs = await db.models.data_request_document.findAll({ where: { data_request_id: id } })
    const shareableDocs = docs.filter(isRequesterVisibleDocument)
    if (!shareableDocs.length) {
      return res.status(400).json({ code: '4000', message: 'No requester-downloadable documents to share' })
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

    const publicUrl = buildDrSharePublicUrl(token, req)

    // Refresh auto-generated request form PDF so it includes a QR for this dr-share link (same URL as admin UI).
    try {
      await ensureDataRequestFormDocument(request, req.thisUser?.id || null, true, req)
    } catch (pdfErr) {
      console.error('[DataRequest] Regenerate form PDF after share failed:', pdfErr)
    }

    // Send email only when we have a real share URL and requester-visible docs (shareableDocs already enforced above).
    if (publicUrl && emailRegex.test(request.email)) {
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
    const visibleDocs = docs.filter(isRequesterVisibleDocument)

    return res.status(200).json({
      code: '0000',
      results: {
        documents: visibleDocs.map(d => ({
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
    if (!isRequesterVisibleDocument(doc)) {
      return res.status(403).json({ message: 'Not allowed' })
    }
    if (!fs.existsSync(doc.location)) return res.status(404).json({ message: 'File not found' })

    return res.download(doc.location, doc.name)
  } catch (err) {
    console.error('[DataRequest] downloadPublicDataRequestDocument error:', err)
    return res.status(500).json({ code: '5000', message: err.message })
  }
}

// ── Clarifications ─────────────────────────────────────────────────────────────

const formatMessage = (m) => ({
  id: m.id,
  data_request_id: m.data_request_id,
  author_type: m.author_type,
  author_user_id: m.author_user_id,
  author_name: m.author_name,
  body: m.body,
  createdAt: m.createdAt,
  updatedAt: m.updatedAt
})

exports.getDataRequestMessages = async (req, res) => {
  try {
    const { id } = req.params
    const record = await db.models.data_request.findByPk(id)
    if (!record) return res.status(404).json({ code: '4004', message: 'Not found' })

    const messages = await db.models.data_request_message.findAll({
      where: { data_request_id: id },
      order: [['createdAt', 'ASC']]
    })

    const clarifyUrl = record.clarification_token
      ? buildDrClarifyPublicUrl(record.clarification_token, req)
      : ''

    return res.status(200).json({
      code: '0000',
      results: {
        messages: messages.map(formatMessage),
        clarification_status: record.clarification_status || 'none',
        clarify_url: clarifyUrl,
        clarification_token_expires_at: record.clarification_token_expires_at
      }
    })
  } catch (err) {
    console.error('[DataRequest] getDataRequestMessages error:', err)
    return res.status(500).json({ code: '5000', message: err.message })
  }
}

exports.postDataRequestMessage = async (req, res) => {
  try {
    const { id } = req.params
    const { body } = req.body
    const text = String(body || '').trim()
    if (!text) {
      return res.status(400).json({ code: '4000', message: 'Message body is required' })
    }

    const record = await db.models.data_request.findByPk(id)
    if (!record) return res.status(404).json({ code: '4004', message: 'Not found' })

    const userId = req.thisUser?.id || null
    const authorName = req.thisUser?.name || req.thisUser?.username || 'Reviewer'

    await ensureClarificationToken(record)
    await record.reload()

    const message = await db.models.data_request_message.create({
      data_request_id: parseInt(id, 10),
      author_type: 'reviewer',
      author_user_id: userId,
      author_name: authorName,
      body: text
    })

    await record.update({ clarification_status: 'awaiting_requester' })

    try {
      await sendClarificationQuestionEmail(req, record, text)
    } catch (emailErr) {
      console.error('[DataRequest] clarification question email failed:', emailErr)
    }

    return res.status(200).json({
      code: '0000',
      message: 'Clarification sent',
      results: {
        message: formatMessage(message),
        clarification_status: 'awaiting_requester',
        clarify_url: buildDrClarifyPublicUrl(record.clarification_token, req)
      }
    })
  } catch (err) {
    console.error('[DataRequest] postDataRequestMessage error:', err)
    return res.status(500).json({ code: '5000', message: err.message })
  }
}

exports.updateClarificationStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { clarification_status } = req.body
    const allowed = ['none', 'awaiting_requester', 'awaiting_reviewer', 'resolved']
    if (!allowed.includes(clarification_status)) {
      return res.status(400).json({ code: '4000', message: 'Invalid clarification status' })
    }

    const record = await db.models.data_request.findByPk(id)
    if (!record) return res.status(404).json({ code: '4004', message: 'Not found' })

    await record.update({ clarification_status })

    return res.status(200).json({
      code: '0000',
      message: 'Updated',
      results: { clarification_status: record.clarification_status }
    })
  } catch (err) {
    console.error('[DataRequest] updateClarificationStatus error:', err)
    return res.status(500).json({ code: '5000', message: err.message })
  }
}

exports.getPublicDataRequestClarify = async (req, res) => {
  try {
    const { token } = req.params
    const found = await findDataRequestByClarificationToken(token)
    if (!found) return res.status(404).json({ code: '4004', message: 'Link not found' })
    if (found.expired) {
      return res.status(410).json({ code: '4010', message: 'Link expired' })
    }

    const { record } = found
    const messages = await db.models.data_request_message.findAll({
      where: { data_request_id: record.id },
      order: [['createdAt', 'ASC']]
    })

    return res.status(200).json({
      code: '0000',
      results: {
        code: record.code,
        name: record.name,
        clarification_status: record.clarification_status || 'none',
        expires_at: record.clarification_token_expires_at,
        messages: messages.map(formatMessage)
      }
    })
  } catch (err) {
    console.error('[DataRequest] getPublicDataRequestClarify error:', err)
    return res.status(500).json({ code: '5000', message: err.message })
  }
}

exports.postPublicDataRequestClarifyReply = async (req, res) => {
  try {
    const { token } = req.params
    const { body } = req.body
    const text = String(body || '').trim()
    if (!text) {
      return res.status(400).json({ code: '4000', message: 'Reply is required' })
    }

    const found = await findDataRequestByClarificationToken(token)
    if (!found) return res.status(404).json({ code: '4004', message: 'Link not found' })
    if (found.expired) {
      return res.status(410).json({ code: '4010', message: 'Link expired' })
    }

    const { record } = found

    const message = await db.models.data_request_message.create({
      data_request_id: record.id,
      author_type: 'requester',
      author_user_id: null,
      author_name: record.name,
      body: text
    })

    await record.update({ clarification_status: 'awaiting_reviewer' })

    try {
      await notifySupportClarificationReply(req, record, text)
    } catch (emailErr) {
      console.error('[DataRequest] clarification reply notify failed:', emailErr)
    }

    return res.status(200).json({
      code: '0000',
      message: 'Reply submitted',
      results: { message: formatMessage(message), clarification_status: 'awaiting_reviewer' }
    })
  } catch (err) {
    console.error('[DataRequest] postPublicDataRequestClarifyReply error:', err)
    return res.status(500).json({ code: '5000', message: err.message })
  }
}
