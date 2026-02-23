const { runWithRequestContext } = require('../utils/requestContext')

function auditContext(req, _res, next) {
  const context = {
    req,
    startedAt: new Date()
  }

  runWithRequestContext(context, () => next())
}

module.exports = auditContext
