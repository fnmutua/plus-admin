const { authJwt } = require("../middleware");
const controller = require("../controllers/collector.controller");
const { hasPermission } = require('../middleware/permission');

module.exports = function(app) {

  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });
  
 

  // Collector access is permission-based (so consultant etc. can use it)
  app.get("/api/v1/collector/project", [authJwt.verifyToken, hasPermission('collector:read')], controller.modelGetProjects);
  app.post("/api/v1/collector", [authJwt.verifyToken, hasPermission('collector:read')], controller.modelLoginCollector);
 
  app.post("/api/v1/collector/project/data", [authJwt.verifyToken, hasPermission('collector:read')], controller.modelDataCollector);
  app.post("/api/v1/collector/project/csv", [authJwt.verifyToken, hasPermission('collector:read')], controller.modelDataCollectorCSV);
  app.post("/api/v1/collector/project/flat", [authJwt.verifyToken, hasPermission('collector:read')], controller.modelDataCollectorGetFlattened);
  
  app.post("/api/v1/collector/project/submitter", [authJwt.verifyToken, hasPermission('collector:read')], controller.modelGetSubmitters);
  app.post("/api/v1/collector/settlements", [authJwt.verifyToken, hasPermission('collector:read')], controller.modelGetSettlements);
 
 

  app.post("/api/v1/collector/project/geo", [authJwt.verifyToken, hasPermission('collector:read')], controller.modelDataCollectorGetGeoJSON);
  app.post("/api/v1/collector/project/media", [authJwt.verifyToken, hasPermission('collector:read')], controller.modelDataCollectorCSVWithMedia);

  app.post("/api/v1/collector/submissions", [authJwt.verifyToken, hasPermission('collector:read')], controller.modelGetSubmissions);
  app.post("/api/v1/collector/submissions/all", [authJwt.verifyToken, hasPermission('collector:read')], controller.modelGetAllSubmissions);
  app.post("/api/v1/collector/submissions/create", [authJwt.verifyToken, hasPermission('collector:submit')], controller.modelCreateSubmission);
  app.post("/api/v1/collector/submissions/delete", [authJwt.verifyToken, hasPermission('collector:delete')], controller.modelDeleteSubmission);
  app.post("/api/v1/collector/submissions/edit", [authJwt.verifyToken, hasPermission('collector:submit')], controller.modelEditSubmission);
  app.post("/api/v1/collector/submissions/xml", [authJwt.verifyToken, hasPermission('collector:read')], controller.modelGetSubmissionXml);
  app.post("/api/v1/collector/submissions/update", [authJwt.verifyToken, hasPermission('collector:submit')], controller.modelUpdateSubmissionXml);
  app.post("/api/v1/collector/submissions/docs", [authJwt.verifyToken, hasPermission('collector:read')], controller.getSubmissionAttachments);
  app.post("/api/v1/collector/submissions/download", [authJwt.verifyToken, hasPermission('collector:read')], controller.downloadSubmissionAttachment);
  app.post("/api/v1/collector/submissions/attachments/count", [authJwt.verifyToken, hasPermission('collector:read')], controller.countSubmissionsAttachments);
  app.post("/api/v1/collector/submissions/attachments/zip", [authJwt.verifyToken, hasPermission('collector:read')], controller.downloadSubmissionsAttachmentsZip);
  app.post("/api/v1/collector/submissions/attachments/upload", [authJwt.verifyToken, hasPermission('collector:submit')], controller.uploadSubmissionAttachment);


    app.post("/api/v1/collector/submissions/csv", [authJwt.verifyToken, hasPermission('collector:read')], controller.modelGetCsvSubmissions);
    app.post("/api/v1/collector/submissions/geo", [authJwt.verifyToken, hasPermission('collector:read')], controller.modelGetGeoJsonSubmissions);
    app.post("/api/v1/collector/project/users", [authJwt.verifyToken, hasPermission('collector:read')], controller.modelGetProjectUsers);

  
};