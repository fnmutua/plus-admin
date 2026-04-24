/* eslint-disable prettier/prettier */
const db = require('../models')
const moment = require('moment')

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

exports.updateDataRequestStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status, review_notes } = req.body

    const record = await db.models.data_request.findByPk(id)
    if (!record) return res.status(404).json({ code: '4004', message: 'Not found' })

    await record.update({
      status,
      review_notes,
      reviewed_by: req.thisUser?.id || null
    })

    return res.status(200).json({ code: '0000', message: 'Updated', results: record })
  } catch (err) {
    console.error('[DataRequest] updateDataRequestStatus error:', err)
    return res.status(500).json({ code: '5000', message: err.message })
  }
}
