const authJwt = require('../middleware/authJwt');
const controller = require('../controllers/docsPdf.controller');

module.exports = function (app) {
  app.post('/api/v1/docs/pdf', [authJwt.verifyToken], controller.downloadDocsPdf);
};
