const controller = require('../controllers/community.controller')
const { authJwt } = require('../middleware')
const { hasPermission } = require('../middleware/permission')

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept')
    next()
  })

  // Metadata (issue types, severities, statuses)
  app.get('/api/v1/community/metadata', [authJwt.verifyToken, hasPermission('community_issue:read')], controller.getMetadata)

  // Issue CRUD
  app.post('/api/v1/community/issues/list', [authJwt.verifyToken, hasPermission('community_issue:read')], controller.listIssues)
  app.post('/api/v1/community/issues/one', [authJwt.verifyToken, hasPermission('community_issue:read')], controller.getIssueById)
  app.post('/api/v1/community/issues/create', [authJwt.verifyToken, hasPermission('community_issue:create')], controller.createIssue)
  app.post('/api/v1/community/issues/batch', [authJwt.verifyToken, hasPermission('community_issue:create')], controller.batchCreateIssues)
  app.post('/api/v1/community/issues/update', [authJwt.verifyToken, hasPermission('community_issue:update')], controller.updateIssue)
  app.post('/api/v1/community/issues/status', [authJwt.verifyToken, hasPermission('community_issue:update')], controller.updateIssueStatus)
  app.post('/api/v1/community/issues/delete', [authJwt.verifyToken, hasPermission('community_issue:delete')], controller.deleteIssue)

  // Public (no auth)
  app.get('/api/v1/community/public/metadata', controller.getPublicMetadata)
  app.post('/api/v1/community/issues/public', controller.getPublicIssue)
  app.post('/api/v1/community/issues/public/create', controller.createPublicIssue)
}
