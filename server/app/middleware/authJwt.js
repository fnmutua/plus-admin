const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models");
const User = db.user;

verifyToken = (req, res, next) => {
  console.log("headers----->", req.headers)
  let token = req.headers["x-access-token"];
  if (!token) {
    return res.status(403).send({
      message: "No token provided!"
    });
  }
  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized!"
      });
    }
    // console.log("----x-----", decoded.id)
    thisUser = User.findOne({
      where: {
        id: decoded.id
      }
    })
     // Fetch the user by id 
     User.findByPk(decoded.id).then(function(user){
      // Do something with the user
      req.userid = decoded.id;
      req.thisUser = user;
      next();
     // console.log("----xd-----", user)

      // res.status(200).send({
      //   code: 20000,
      //   data: user,
      //   thisUser: req.thisUser,
      //   userid: req.userid
      // })
    //  return res.send(200);

  });

  });
};



isAdmin = (req, res, next) => {
  User.findByPk(req.userid).then(user => {
    user.getRoles().then(roles => {
      for (let i = 0; i < roles.length; i++) {
        if (roles[i].name === "admin") {
          next();
          return;
        }
      }
      res.status(403).send({
        message: "Require Admin Role!"
      });
      return;
    });
  });
};
isModerator = (req, res, next) => {
  User.findByPk(req.userid).then(user => {
    user.getRoles().then(roles => {
      for (let i = 0; i < roles.length; i++) {
        if (roles[i].name === "moderator") {
          next();
          return;
        }
      }
      res.status(403).send({
        message: "Require Moderator Role!"
      });
    });
  });
};
isModeratorOrAdmin = (req, res, next) => {
  User.findByPk(req.userId).then(user => {
    user.getRoles().then(roles => {
      for (let i = 0; i < roles.length; i++) {
        if (roles[i].name === "moderator") {
          next();
          return;
        }
        if (roles[i].name === "admin") {
          next();
          return;
        }
      }
      res.status(403).send({
        message: "Require Moderator or Admin Role!"
      });
    });
  });
};
const authJwt = {
  verifyToken: verifyToken,
  isAdmin: isAdmin,
  isModerator: isModerator,
  isModeratorOrAdmin: isModeratorOrAdmin
};
module.exports = authJwt;