const { authJwt } = require('../middleware')
const { hasPermission } = require('../middleware/permission')
const controller = require('../controllers/media.controller')

module.exports = function (app) {
  app.get(
    '/api/v1/media/youtube-videos',
    [authJwt.verifyToken, hasPermission('article:read')],
    controller.getYoutubeVideos
  )
}
