const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models");
const User = db.user;

verifyToken = (req, res, next) => {
 // console.log("headers----->", req.headers)
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
 //    User.findByPk(decoded.id).then(function(user){
      // Do something with the user
      User.findByPk(decoded.id).then(user => {

       user.getRoles().then(roles => {
         req.userid = decoded.id;
         req.thisUser = user;
         //req.roles = roles;
         //var chests = roles[].toJSON(); //same as chestsSeq.get({});
     //    console.log('roles>>', roles[0])
         let userRoles = []
         for (let i = 0; i < roles.length; i++) {
            userRoles.push(roles[i].id)
         }
         console.log(userRoles)
         req.roles = userRoles;
         next();
       })
 

     });
    
    

  });
};


// isAdmin = (req, res, next) => {
//   User.findByPk(req.userid).then(user => {
//     user.getRoles().then(roles => {
//       for (let i = 0; i < roles.length; i++) {
//         if (roles[i].name === "admin") {
//           next();
//           return;
//         }
//       }
//       res.status(403).send({
//         message: "This resource requires an Admin Role!"
//       });
//       return;
//     });
//   });
// };

 isAdmin = (req, res, next) => {
  User.findByPk(req.userid).then(user => {
    user.getRoles().then(roles => {
      const acceptedRoles = ["admin", "super_admin", "staff"];

      for (let i = 0; i < roles.length; i++) {
        if (acceptedRoles.includes(roles[i].name)) {
          next();
          return;
        }
      }

      res.status(403).send({
        message: "This resource requires an elevated role!"
      });
    });
  }).catch(err => {
    res.status(500).send({
      message: "Unable to validate role!",
      error: err.message
    });
  });
};


isSuperAdmin = (req, res, next) => {
  User.findByPk(req.userid).then(user => {
    user.getRoles().then(roles => {
      for (let i = 0; i < roles.length; i++) {
        if (roles[i].name === "super_admin") {
          next();
          return;
        }
      }
      res.status(403).send({
        message: "This resource requires an Super Admin Role!"
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

isStaffOrAdmin = (req, res, next) => {
 // console.log("Requrest,",req.userid)
  User.findByPk(req.userid).then(user => {
  //  console.log(user)
    user.getRoles({raw:true}).then(roles => {
      for (let i = 0; i < roles.length; i++) {
          console.log(roles[i].name)
        if (roles[i].name === "staff") {
          next();
          return;
        }
        if (roles[i].name === "super_admin") {
          next();
          return;
        }   
        if (roles[i].name === "county_admin") {
          next();
          return;
        }   
        
        if (roles[i].name === "admin") {
          next();
          return;
        }
      }
      res.status(403).send({
        message: "You require a Staff or Admin Role to perform this function"
      });
    });
  });
};


isAdminOrCountyAdmin = (req, res, next) => {
  // console.log("Requrest,",req.userid)
   User.findByPk(req.userid).then(user => {
   //  console.log(user)
     user.getRoles().then(roles => {
       for (let i = 0; i < roles.length; i++) {
           console.log(roles[i].name)
         if (roles[i].name === "county_admin") {
           next();
           return;
         }
         if (roles[i].name === "staff") {
          next();
          return;
         }  
             
         if (roles[i].name === "super_admin") {
          next();
          return;
        }
         if (roles[i].name === "admin") {
           next();
           return;
         }
       }
       res.status(403).send({
         message: "You require a Staff or Admin Role to perform this function"
       });
     });
   });
 };

 isSomeAdmin = (req, res, next) => {
  // console.log("Requrest,",req.userid)
   User.findByPk(req.userid).then(user => {
   //  console.log(user)
     user.getRoles().then(roles => {
       for (let i = 0; i < roles.length; i++) {
           console.log(roles[i].name)
         if (roles[i].name === "super_admin") {
           next();
           return;
         }
         if (roles[i].name === "admin") {
          next();
          return;
         }  
             
         if (roles[i].name === "county_admin") {
          next();
          return;
        }
        
       }
       res.status(403).send({
         message: "You require  Admin Role to perform this function"
       });
     });
   });
 };
 
 isGrmOfficerNational = (req, res, next) => {
  // console.log("Requrest,",req.userid)
   User.findByPk(req.userid).then(user => {
  console.log('-----------------------isGrmOfficerNational',user)
     user.getRoles().then(roles => {
       for (let i = 0; i < roles.length; i++) {
           console.log(roles[i].name)
         if (roles[i].name === "super_admin") {
           next();
           return;
         }
         if (roles[i].name === "admin") {
          next();
          return;
         }  
             
         if (roles[i].name === "county_admin") {
          next();
          return;
        }
        
       }
       res.status(403).send({
         message: "You require  Admin Role to perform this function"
       });
     });
   });
 };
 
const authJwt = {
  verifyToken: verifyToken,
  isAdmin: isAdmin,
  isModerator: isModerator,
  isModeratorOrAdmin: isModeratorOrAdmin,
  isStaffOrAdmin: isStaffOrAdmin,
  isAdminOrCountyAdmin: isAdminOrCountyAdmin,
  isSuperAdmin: isSuperAdmin,
  isSomeAdmin:isSomeAdmin,
  isGrmOfficerNational:isGrmOfficerNational

};
module.exports = authJwt;