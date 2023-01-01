const db = require("../models");
const ROLES = db.role;
const User = db.user;
checkDuplicateUsernameOrEmail = (req, res, next) => {
  // Username
  User.findOne({
    where: {
      username: req.body.username
    }
  }).then(user => {
    if (user) {
      res.status(400).send({
        message: "Failed! Username is already in use!"
      });
      return;
    }
    // Email
    User.findOne({
      where: {
        email: req.body.email
      }
    }).then(user => {
      if (user) {
        res.status(400).send({
          message: "Failed! Email is already in use!"
        });
        return;
      }
      next();
    });
  });
};



checkRolesExisted = (req, res, next) => {
  console.log("ROLES:", ROLES)
  if (req.body.roles) {
    for (let i = 0; i < req.body.roles.length; i++) {
      const SelectRole =  ROLES.findOne({
        where: { name: req.body.roles[i] },
      });
      console.log(SelectRole)
      
      //if (!ROLES.includes(req.body.roles[i])) {
      if (!SelectRole)  {
        res.status(400).send({
          message: "Failed! Role does not exist = " + req.body.roles[i]
        });
        return;
       }
    }
  }
  
  next();
};
const verifySignUp = {
  checkDuplicateUsernameOrEmail: checkDuplicateUsernameOrEmail,
  checkRolesExisted: checkRolesExisted
};
module.exports = verifySignUp;