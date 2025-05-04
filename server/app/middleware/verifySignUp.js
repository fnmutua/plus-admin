const db = require("../models");
const ROLES = db.role;
const User = db.user;
xcheckDuplicateUsernameOrEmail = (req, res, next) => {
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



const normalizePhone = (phone) => {
  if (!phone) return null;
  // Remove non-digits
  phone = phone.replace(/\D/g, '');
  // Normalize to 254 format
  if (phone.startsWith('0')) {
    return '254' + phone.substring(1);
  } else if (phone.startsWith('254')) {
    return phone;
  } else if (phone.startsWith('7') || phone.startsWith('1') || phone.startsWith('0')) {
    return '254' + phone;
  }
  return phone;
};

checkDuplicateUsernameOrEmail = async (req, res, next) => {
  try {
    const { username, email, phone } = req.body;

    console.log( username, email, phone )

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).send({ message: "Failed! Username is already in use!" });
    }

    if (email) {
      const existingEmail = await User.findOne({ where: { email } });
        if(existingEmail) {
          return res.status(400).send({ message: "Failed! Email is already in use!" });

        }
    }

    const normalizedPhone = normalizePhone(phone);

    // Fetch all users and check phone match
    const usersWithPhone = await User.findAll({ attributes: ['phone'] });

    const isPhoneTaken = usersWithPhone.some(u => {
      const userPhone = normalizePhone(u.phone);
      return userPhone && normalizedPhone === userPhone;
    });

    if (isPhoneTaken) {
      return res.status(400).send({ message: "Failed! Phone number is already in use!" });
    }

    next();
  } catch (err) {
    res.status(500).send({ message: "Server error while checking duplicates." });
  }
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


checkDuplicatePhone = (req, res, next) => {
  // Username
  User.findOne({
    where: {
      username: req.body.username
    }
  }).then(user => {
    if (user) {
      res.status(400).send({
        message: "Failed! Phone number is already in use!"
      });
      return;
    }
    next();
  });
};


const verifySignUp = {
  checkDuplicateUsernameOrEmail: checkDuplicateUsernameOrEmail,checkDuplicatePhone:checkDuplicatePhone,
  checkRolesExisted: checkRolesExisted
};
module.exports = verifySignUp;