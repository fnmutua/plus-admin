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

    console.log('Checking duplicates for:', { username, email, phone });

    // Check username
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      console.log('Duplicate username found:', username);
      return res.status(400).send({ message: "Failed! Username is already in use!" });
    }

    // Check email if provided
    if (email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        console.log('Duplicate email found:', email);
        return res.status(400).send({ message: "Failed! Email is already in use!" });
      }
    }

    // Check phone if provided
    if (phone) {
      const normalizedPhone = normalizePhone(phone);
      console.log('Normalized phone for checking:', normalizedPhone);

      // Fetch all users and check phone match
      const usersWithPhone = await User.findAll({ attributes: ['phone'] });

      const isPhoneTaken = usersWithPhone.some(u => {
        const userPhone = normalizePhone(u.phone);
        return userPhone && normalizedPhone === userPhone;
      });

      if (isPhoneTaken) {
        console.log('Duplicate phone found:', phone, 'normalized:', normalizedPhone);
        return res.status(400).send({ message: "Failed! Phone number is already in use!" });
      }
    }

    console.log('No duplicates found, proceeding...');
    next();
  } catch (err) {
    console.error('Error in checkDuplicateUsernameOrEmail:', err);
    console.error('Stack trace:', err.stack);
    
    // More specific error messages based on error type
    if (err.name === 'SequelizeConnectionError') {
      return res.status(500).send({ message: "Database connection error. Please try again later." });
    } else if (err.name === 'SequelizeValidationError') {
      return res.status(400).send({ message: "Invalid data format. Please check your input." });
    } else if (err.name === 'SequelizeDatabaseError') {
      return res.status(500).send({ message: "Database query error. Please contact support." });
    } else {
      return res.status(500).send({ 
        message: "Server error while checking duplicates.", 
        error: process.env.NODE_ENV === 'development' ? err.message : undefined 
      });
    }
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