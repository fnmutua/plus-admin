const db = require('../models')
const { queryMergedAuditLogs } = require('../utils/auditLogQuery')

exports.getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      actor = '',
      action = '',
      entityType = '',
      entityId = '',
      outcome = '',
      from = '',
      to = ''
    } = req.body || {}

    const result = await queryMergedAuditLogs({
      page,
      limit,
      actor,
      action,
      entityType,
      entityId,
      outcome,
      from: from || null,
      to: to || null
    })

    return res.status(200).send({
      code: '0000',
      message: 'Audit logs retrieved successfully',
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit
    })
  } catch (error) {
    console.error('Error retrieving audit logs:', error)
    return res.status(500).send({
      code: '9999',
      message: 'Unable to retrieve audit logs',
      error: error.message
    })
  }
}
