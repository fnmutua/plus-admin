const { authJwt } = require("../middleware");
const controller = require("../controllers/pdf.controller");
module.exports = function(app) {

  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });
  
    //app.post('/api/v1/user/all',  [authJwt.verifyToken],controller.modelAllUsers) // retrired 


  app.post("/api/v1/pdf", controller.generatePDF);
 
 


};