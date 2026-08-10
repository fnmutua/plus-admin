const db = require('../models')
const Sequelize = require('sequelize')
const moment = require('moment')
const {
  ISSUE_TYPES,
  SEVERITIES,
  STATUSES,
  ISSUE_TYPE_VALUES,
  SEVERITY_VALUES,
  STATUS_VALUES,
  APPROVAL_STATUSES,
} = require('../config/communityIssue')
const { formatPhoneNumber } = require('../utils/sms')
const {
  notifyOnIssueCreated,
  notifyOnIssueStatusChanged,
  issueTypeLabel,
} = require('../services/communityIssueNotify.service')
const {
  applyCommunityIssueListScope,
  assertCommunityIssueAccess,
} = require('../utils/communityIssueScope')

const { Op } = Sequelize

function parsePositiveInt(value) {
  if (value == null || value === '') return null
  const parsed = parseInt(String(value), 10)
  return Number.isNaN(parsed) ? null : parsed
}

function normalizeGeomInput(geom) {
  if (!geom) return null
  if (typeof geom === 'string') {
    try {
      return JSON.parse(geom)
    } catch {
      return null
    }
  }
  if (geom.type && geom.coordinates) {
    return geom
  }
  return null
}

async function enrichLocationFromSettlement(record) {
  const settlementId = parsePositiveInt(record.settlement_id)
  if (!settlementId) return record

  const settlement = await db.models.settlement.findByPk(settlementId, {
    attributes: ['county_id', 'subcounty_id', 'ward_id'],
    raw: true,
  })
  if (!settlement) return record

  return {
    ...record,
    county_id: record.county_id ?? settlement.county_id ?? null,
    subcounty_id: record.subcounty_id ?? settlement.subcounty_id ?? null,
    ward_id: record.ward_id ?? settlement.ward_id ?? null,
  }
}

function validateIssuePayload(payload, { partial = false } = {}) {
  const errors = []

  if (!partial || payload.issue_type != null) {
    if (!payload.issue_type || !ISSUE_TYPE_VALUES.has(String(payload.issue_type))) {
      errors.push('Valid issue_type is required')
    }
  }

  if (!partial || payload.description != null) {
    const description = String(payload.description || '').trim()
    if (!description) {
      errors.push('description is required')
    } else if (description.length > 2000) {
      errors.push('description must be 2000 characters or fewer')
    }
  }

  if (payload.severity != null && payload.severity !== '' && !SEVERITY_VALUES.has(String(payload.severity))) {
    errors.push('Invalid severity')
  }

  if (payload.status != null && payload.status !== '' && !STATUS_VALUES.has(String(payload.status))) {
    errors.push('Invalid status')
  }

  if (
    payload.isApproved != null &&
    payload.isApproved !== '' &&
    !APPROVAL_STATUSES.includes(String(payload.isApproved))
  ) {
    errors.push('Invalid isApproved value')
  }

  if (!partial || payload.code != null) {
    if (!payload.code || !String(payload.code).trim()) {
      errors.push('code is required')
    }
  }

  return errors
}

function validatePublicIssuePayload(payload) {
  const errors = validateIssuePayload(payload)
  if (!parsePositiveInt(payload.settlement_id)) {
    errors.push('settlement is required')
  }
  return errors
}

async function buildIssueRecord(payload, userId) {
  const code = payload.code ? String(payload.code).trim() : await generateIssueCode()

  return enrichLocationFromSettlement({
    code,
    settlement_id: parsePositiveInt(payload.settlement_id),
    county_id: parsePositiveInt(payload.county_id),
    subcounty_id: parsePositiveInt(payload.subcounty_id),
    ward_id: parsePositiveInt(payload.ward_id),
    issue_type: String(payload.issue_type),
    description: String(payload.description).trim(),
    severity: payload.severity ? String(payload.severity) : 'medium',
    reporter_name: payload.reporter_name ? String(payload.reporter_name).trim() : null,
    reporter_phone: payload.reporter_phone ? String(payload.reporter_phone).trim() : null,
    geom: normalizeGeomInput(payload.geom),
    status: payload.status ? String(payload.status) : 'Submitted',
    isApproved: payload.isApproved ? String(payload.isApproved) : 'Pending',
    resolution_note: payload.resolution_note ? String(payload.resolution_note).trim() : null,
    project_id: parsePositiveInt(payload.project_id),
    photo: payload.photo ? String(payload.photo) : null,
    createdBy: userId || parsePositiveInt(payload.createdBy) || null,
  })
}

async function generateIssueCode() {
  const prefix = 'CI'
  const currentYear = moment().format('YYYY')
  const latest = await db.models.community_issue.findOne({
    attributes: ['code'],
    order: [['createdAt', 'DESC']],
  })

  let nextSeq = 1
  if (latest?.code) {
    const match = String(latest.code).match(new RegExp(`^${prefix}-${currentYear}-(\\d+)$`))
    if (match) {
      nextSeq = parseInt(match[1], 10) + 1
    }
  }

  return `${prefix}-${currentYear}-${String(nextSeq).padStart(4, '0')}`
}

function buildListWhere(body = {}) {
  const where = {}

  const settlementId = parsePositiveInt(body.settlement_id)
  const countyId = parsePositiveInt(body.county_id)
  const subcountyId = parsePositiveInt(body.subcounty_id)
  const wardId = parsePositiveInt(body.ward_id)
  const projectId = parsePositiveInt(body.project_id)
  const createdBy = parsePositiveInt(body.createdBy)

  if (settlementId) where.settlement_id = settlementId
  if (countyId) where.county_id = countyId
  if (subcountyId) where.subcounty_id = subcountyId
  if (wardId) where.ward_id = wardId
  if (projectId) where.project_id = projectId
  if (createdBy) where.createdBy = createdBy

  if (body.issue_type) where.issue_type = String(body.issue_type)
  if (body.severity) where.severity = String(body.severity)
  if (body.status) where.status = String(body.status)
  if (body.isApproved) where.isApproved = String(body.isApproved)

  if (body.search) {
    const term = `%${String(body.search).trim()}%`
    where[Op.or] = [
      { description: { [Op.iLike]: term } },
      { reporter_name: { [Op.iLike]: term } },
      { reporter_phone: { [Op.iLike]: term } },
      { code: { [Op.iLike]: term } },
    ]
  }

  return where
}

exports.getMetadata = async (req, res) => {
  return res.status(200).json({
    issueTypes: ISSUE_TYPES,
    severities: SEVERITIES,
    statuses: STATUSES,
    approvalStatuses: APPROVAL_STATUSES,
  })
}

exports.getPublicMetadata = async (_req, res) => {
  return res.status(200).json({
    code: '0000',
    issueTypes: ISSUE_TYPES,
    severities: SEVERITIES,
  })
}

exports.createPublicIssue = async (req, res) => {
  try {
    const payload = { ...(req.body || {}) }
    if (!payload.code) {
      payload.code = await generateIssueCode()
    }

    const errors = validatePublicIssuePayload(payload)
    if (errors.length) {
      return res.status(400).json({ code: '1001', message: errors.join('; ') })
    }

    const record = await buildIssueRecord(payload, null)
    const created = await db.models.community_issue.create(record)
    notifyOnIssueCreated(req, created).catch((err) => {
      console.error('[community_issue] public post-create notifications failed:', err?.message || err)
    })

    return res.status(201).json({
      code: '0000',
      data: { id: created.id, code: created.code },
      message: 'Community issue reported successfully',
    })
  } catch (error) {
    console.error('[community_issue] createPublicIssue failed:', error)
    if (error?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ code: '1002', message: 'An issue with this code already exists' })
    }
    return res.status(500).json({ code: '9999', message: error.message || 'Failed to report community issue' })
  }
}

exports.listIssues = async (req, res) => {
  try {
    const page = Math.max(parsePositiveInt(req.body?.page) || 1, 1)
    const limit = Math.min(Math.max(parsePositiveInt(req.body?.limit) || 25, 1), 200)
    const offset = (page - 1) * limit
    let where = buildListWhere(req.body || {})
    where = await applyCommunityIssueListScope(req, where)

    const { rows, count } = await db.models.community_issue.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: db.models.settlement,
          attributes: ['id', 'name', 'code'],
          required: false,
        },
        {
          model: db.models.users,
          as: 'reporterUser',
          attributes: ['id', 'name', 'email', 'phone'],
          required: false,
        },
        {
          model: db.models.users,
          as: 'resolver',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
    })

    return res.status(200).json({
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit) || 1,
      },
    })
  } catch (error) {
    console.error('[community_issue] listIssues failed:', error)
    return res.status(500).json({ message: error.message || 'Failed to list community issues' })
  }
}

exports.getIssueById = async (req, res) => {
  try {
    const id = parsePositiveInt(req.body?.id)
    const code = req.body?.code ? String(req.body.code).trim() : null
    if (!id && !code) {
      return res.status(400).json({ message: 'id or code is required' })
    }

    const issue = await db.models.community_issue.findOne({
      where: id ? { id } : { code },
      include: [
        { model: db.models.settlement, attributes: ['id', 'name', 'code'], required: false },
        { model: db.models.county, attributes: ['id', 'name'], required: false },
        { model: db.models.subcounty, attributes: ['id', 'name'], required: false },
        { model: db.models.ward, attributes: ['id', 'name'], required: false },
        {
          model: db.models.users,
          as: 'reporterUser',
          attributes: ['id', 'name', 'email', 'phone'],
          required: false,
        },
        {
          model: db.models.users,
          as: 'resolver',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
        {
          model: db.models.project,
          attributes: ['id', 'title', 'project_code', 'code'],
          required: false,
        },
      ],
    })

    if (!issue) {
      return res.status(404).json({ message: 'Community issue not found' })
    }

    if (!(await assertCommunityIssueAccess(req, issue))) {
      return res.status(403).json({ message: 'You do not have access to this community issue' })
    }

    return res.status(200).json({ data: issue })
  } catch (error) {
    console.error('[community_issue] getIssueById failed:', error)
    return res.status(500).json({ message: error.message || 'Failed to load community issue' })
  }
}

exports.createIssue = async (req, res) => {
  try {
    const payload = { ...(req.body || {}) }
    if (!payload.code) {
      payload.code = await generateIssueCode()
    }

    const errors = validateIssuePayload(payload)
    if (errors.length) {
      return res.status(400).json({ message: errors.join('; ') })
    }

    const record = await buildIssueRecord(payload, req.userId)

    const created = await db.models.community_issue.create(record)
    notifyOnIssueCreated(req, created).catch((err) => {
      console.error('[community_issue] post-create notifications failed:', err?.message || err)
    })
    return res.status(201).json({ data: created, message: 'Community issue created' })
  } catch (error) {
    console.error('[community_issue] createIssue failed:', error)
    if (error?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'An issue with this code already exists' })
    }
    return res.status(500).json({ message: error.message || 'Failed to create community issue' })
  }
}

exports.batchCreateIssues = async (req, res) => {
  try {
    const items = Array.isArray(req.body?.data) ? req.body.data : []
    if (!items.length) {
      return res.status(400).json({ message: 'data array is required' })
    }

    const created = []
    const errors = []

    for (const [index, item] of items.entries()) {
      const payload = { ...(item || {}) }
      if (!payload.code) {
        payload.code = await generateIssueCode()
      }

      const validationErrors = validateIssuePayload(payload)
      if (validationErrors.length) {
        errors.push({ index, code: payload.code, message: validationErrors.join('; ') })
        continue
      }

      try {
        let record = await enrichLocationFromSettlement({
          code: String(payload.code).trim(),
          settlement_id: parsePositiveInt(payload.settlement_id),
          county_id: parsePositiveInt(payload.county_id),
          subcounty_id: parsePositiveInt(payload.subcounty_id),
          ward_id: parsePositiveInt(payload.ward_id),
          issue_type: String(payload.issue_type),
          description: String(payload.description).trim(),
          severity: payload.severity ? String(payload.severity) : 'medium',
          reporter_name: payload.reporter_name ? String(payload.reporter_name).trim() : null,
          reporter_phone: payload.reporter_phone ? String(payload.reporter_phone).trim() : null,
          geom: normalizeGeomInput(payload.geom),
          status: payload.status ? String(payload.status) : 'Submitted',
          isApproved: payload.isApproved ? String(payload.isApproved) : 'Pending',
          resolution_note: payload.resolution_note ? String(payload.resolution_note).trim() : null,
          project_id: parsePositiveInt(payload.project_id),
          photo: payload.photo ? String(payload.photo) : null,
          createdBy: req.userId || parsePositiveInt(payload.createdBy),
        })

        const row = await db.models.community_issue.create(record)
        created.push(row)
        notifyOnIssueCreated(req, row).catch((err) => {
          console.error('[community_issue] batch post-create notifications failed:', err?.message || err)
        })
      } catch (error) {
        errors.push({ index, code: payload.code, message: error.message || 'Create failed' })
      }
    }

    return res.status(errors.length && !created.length ? 400 : 200).json({
      created,
      errors,
      message: `Created ${created.length} issue(s)${errors.length ? `, ${errors.length} failed` : ''}`,
    })
  } catch (error) {
    console.error('[community_issue] batchCreateIssues failed:', error)
    return res.status(500).json({ message: error.message || 'Failed to batch create community issues' })
  }
}

exports.updateIssue = async (req, res) => {
  try {
    const id = parsePositiveInt(req.body?.id)
    const code = req.body?.code ? String(req.body.code).trim() : null
    if (!id && !code) {
      return res.status(400).json({ message: 'id or code is required' })
    }

    const issue = await db.models.community_issue.findOne({
      where: id ? { id } : { code },
    })
    if (!issue) {
      return res.status(404).json({ message: 'Community issue not found' })
    }

    if (!(await assertCommunityIssueAccess(req, issue))) {
      return res.status(403).json({ message: 'You do not have access to this community issue' })
    }

    const payload = { ...(req.body || {}) }
    const errors = validateIssuePayload(payload, { partial: true })
    if (errors.length) {
      return res.status(400).json({ message: errors.join('; ') })
    }

    const updates = {}
    const assignString = (key) => {
      if (payload[key] != null) updates[key] = String(payload[key]).trim()
    }
    const assignInt = (key) => {
      if (payload[key] != null) updates[key] = parsePositiveInt(payload[key])
    }

    assignString('issue_type')
    if (payload.description != null) updates.description = String(payload.description).trim()
    assignString('severity')
    assignString('status')
    assignString('isApproved')
    assignString('reporter_name')
    assignString('reporter_phone')
    assignString('resolution_note')
    assignString('photo')
    assignInt('settlement_id')
    assignInt('county_id')
    assignInt('subcounty_id')
    assignInt('ward_id')
    assignInt('project_id')

    if (payload.geom != null) {
      updates.geom = normalizeGeomInput(payload.geom)
    }

    if (payload.resolved_at != null) {
      updates.resolved_at = payload.resolved_at ? new Date(payload.resolved_at) : null
    }
    if (payload.resolved_by != null) {
      updates.resolved_by = parsePositiveInt(payload.resolved_by)
    }

    const merged = await enrichLocationFromSettlement({ ...issue.toJSON(), ...updates })
    await issue.update({
      ...updates,
      county_id: merged.county_id,
      subcounty_id: merged.subcounty_id,
      ward_id: merged.ward_id,
    })

    return res.status(200).json({ data: issue, message: 'Community issue updated' })
  } catch (error) {
    console.error('[community_issue] updateIssue failed:', error)
    return res.status(500).json({ message: error.message || 'Failed to update community issue' })
  }
}

exports.updateIssueStatus = async (req, res) => {
  try {
    const id = parsePositiveInt(req.body?.id)
    const code = req.body?.code ? String(req.body.code).trim() : null
    const status = req.body?.status ? String(req.body.status) : null
    const resolutionNote = req.body?.resolution_note != null ? String(req.body.resolution_note).trim() : null

    if ((!id && !code) || !status) {
      return res.status(400).json({ message: 'id or code and status are required' })
    }
    if (!STATUS_VALUES.has(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }

    const issue = await db.models.community_issue.findOne({
      where: id ? { id } : { code },
    })
    if (!issue) {
      return res.status(404).json({ message: 'Community issue not found' })
    }

    if (!(await assertCommunityIssueAccess(req, issue))) {
      return res.status(403).json({ message: 'You do not have access to this community issue' })
    }

    const updates = { status }
    if (resolutionNote != null) {
      updates.resolution_note = resolutionNote
    }

    if (status === 'Resolved' || status === 'Closed') {
      updates.resolved_at = new Date()
      updates.resolved_by = req.userId || issue.resolved_by || null
      if (issue.isApproved === 'Pending') {
        updates.isApproved = 'Approved'
      }
    }

    if (req.body?.isApproved) {
      updates.isApproved = String(req.body.isApproved)
    }

    const oldStatus = issue.status
    await issue.update(updates)
    await issue.reload({
      include: [
        { model: db.models.settlement, attributes: ['id', 'name'], required: false },
        { model: db.models.county, attributes: ['id', 'name'], required: false },
      ],
    })

    notifyOnIssueStatusChanged(req, issue, {
      oldStatus,
      newStatus: status,
      resolutionNote: updates.resolution_note ?? issue.resolution_note,
    }).catch((err) => {
      console.error('[community_issue] post-status notifications failed:', err?.message || err)
    })

    return res.status(200).json({ data: issue, message: 'Issue status updated' })
  } catch (error) {
    console.error('[community_issue] updateIssueStatus failed:', error)
    return res.status(500).json({ message: error.message || 'Failed to update issue status' })
  }
}

function maskPhone(phone) {
  const value = String(phone || '').trim()
  if (!value || value.length < 5) return null
  return `${value.substring(0, 3)}*****${value.substring(value.length - 2)}`
}

function phonesMatch(storedPhone, submittedPhone) {
  const stored = formatPhoneNumber(storedPhone)
  const submitted = formatPhoneNumber(submittedPhone)
  if (!stored || !submitted) return false
  return stored === submitted || stored.endsWith(submitted.slice(-9)) || submitted.endsWith(stored.slice(-9))
}

function toPublicIssuePayload(issue) {
  const row = issue?.toJSON ? issue.toJSON() : issue
  if (!row) return null

  return {
    id: row.id,
    code: row.code,
    issue_type: row.issue_type,
    issue_type_label: issueTypeLabel(row.issue_type),
    description: row.description,
    severity: row.severity,
    status: row.status,
    resolution_note: row.resolution_note,
    reporter_name: row.reporter_name,
    reporter_phone_masked: maskPhone(row.reporter_phone),
    settlement: row.settlement ? { id: row.settlement.id, name: row.settlement.name } : null,
    county: row.county ? { id: row.county.id, name: row.county.name } : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    resolved_at: row.resolved_at,
  }
}

exports.getPublicIssue = async (req, res) => {
  try {
    const id = parsePositiveInt(req.body?.id)
    const code = req.body?.code ? String(req.body.code).trim() : null
    const phoneNumber = req.body?.phone_number ? String(req.body.phone_number).trim() : null

    if (!id && !code) {
      return res.status(400).json({ message: 'id or code is required' })
    }

    const include = [
      { model: db.models.settlement, attributes: ['id', 'name'], required: false },
      { model: db.models.county, attributes: ['id', 'name'], required: false },
    ]

    let issue
    if (id) {
      issue = await db.models.community_issue.findByPk(id, { include })
    } else {
      if (!phoneNumber) {
        return res.status(400).json({ message: 'phone_number is required when looking up by code' })
      }

      issue = await db.models.community_issue.findOne({
        where: { code: { [Op.iLike]: code } },
        include,
      })

      if (issue && !phonesMatch(issue.reporter_phone, phoneNumber)) {
        return res.status(404).json({ message: 'No issue found for the given code and phone number' })
      }
    }

    if (!issue) {
      return res.status(404).json({ code: '1002', message: 'Community issue not found' })
    }

    return res.status(200).json({ code: '0000', data: toPublicIssuePayload(issue) })
  } catch (error) {
    console.error('[community_issue] getPublicIssue failed:', error)
    return res.status(500).json({ code: '9999', message: error.message || 'Failed to load community issue' })
  }
}

exports.deleteIssue = async (req, res) => {
  try {
    const id = parsePositiveInt(req.body?.id)
    const code = req.body?.code ? String(req.body.code).trim() : null
    if (!id && !code) {
      return res.status(400).json({ message: 'id or code is required' })
    }

    const issue = await db.models.community_issue.findOne({
      where: id ? { id } : { code },
    })
    if (!issue) {
      return res.status(404).json({ message: 'Community issue not found' })
    }

    if (!(await assertCommunityIssueAccess(req, issue))) {
      return res.status(403).json({ message: 'You do not have access to this community issue' })
    }

    await issue.destroy()
    return res.status(200).json({ message: 'Community issue deleted' })
  } catch (error) {
    console.error('[community_issue] deleteIssue failed:', error)
    return res.status(500).json({ message: error.message || 'Failed to delete community issue' })
  }
}
