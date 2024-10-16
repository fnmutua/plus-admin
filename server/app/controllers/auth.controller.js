const db = require('../models')
//const db = require('../models').default;

const config = require('../config/auth.config')
//const User = db.user;
const Role = db.role
const User = db.user
//db.models[reg_model]
const Op = db.Sequelize.Op
var jwt = require('jsonwebtoken')
var bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')

exports.signup = (req, res) => {
  console.log('Inside REgistration', req.body)
  // Save User to Database
  User.create({
    username: req.body.username,
    name: req.body.name,
    email: req.body.email,
    avatar: req.body.avatar,
    county_id: req.body.county_id,
    password: bcrypt.hashSync(req.body.password, 8)
  })
    .then((user) => {
      if (req.body.roles) {
        Role.findAll({
          where: {
            name: {
              [Op.or]: req.body.roles
            }
          }
        }).then((roles) => {
          user.setRoles(roles).then(() => {
            var token = jwt.sign({ id: user.id }, config.secret, {
              expiresIn: 86400 // 24 hours
            })

            console.log(roles)
            res.send({
              message: 'Roles Were registered successfully!',
              code: '0000',
              roles: roles[0].name,
              data: token,
              user: user
            })
          })
        })
      } else {
        // user role = 1
        user.setRoles([1]).then(() => {
          res.send({
            message: 'User was registered successfully!',
            code: '0000',
            data: 'successful'
          })
        })
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err.message })
    })
}

exports.updateUser = (req, res) => {
  console.log('Update user....')
  var reg_model = req.query.model

  console.log('Request:----->', req.body)

  // get this one  record and update it by replacing the whole docuemnt
  User.findAll({ where: { id: req.body.id } }).then((result) => {
    if (result) {
      // Result is array because we have used findAll. We can use findOne as well if you want one row and update that.
      result[0].set(req.body)
      result[0].save()

      // Now insert the roles
      if (req.body.role) {
        Role.findAll({
          where: {
            id: {
              [Op.or]: req.body.role
            }
          }
        }).then((roles) => {
          result[0].setRoles(roles).then(() => {
            var token = jwt.sign({ id: result[0].id }, config.secret, {
              expiresIn: 86400 // 24 hours
            })

            console.log(roles)
            res.send({
              message: 'Roles Were registered successfully!',
              code: 20000,
              roles: roles[0].name,
              data: token,
              user: result[0]
            })
          })
        })
      } else {
        // return success
        res.status(200).send({
          data: result,
          code: 20000
        })
      }
    }
  })
}

exports.reset = (req, res) => {
  console.log('Reset password....', req.body.username)
  console.log(req.body)
  if (req.body.username === '') {
    res.status(400).send('email required')
  }
  /* console.error(req.body.email); */
  User.findOne({ where: { username: req.body.username } })
    .then((user) => {
      //      console.log("Reset fr:", user)
      if (user === null) {
        console.error('email not in database')
        // res.status(403).send('email not in db');
        return res.status(404).send({ message: 'User Not found.' })
      } else {
        var token = jwt.sign({ id: user.id }, config.secret, {
          expiresIn: 86400 // 24 hours
        })

        try {
          const result = User.update(
            { resetPasswordToken: token, resetPasswordExpires: Date.now() + 86400000 },
            { where: { username: req.body.username } }
          )
          console.log(result)
        } catch (err) {
          console.log(err)
        }

        console.log('rESET-tOKEN', token)
        //   console.log(user)

        var transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'nema.riparian@gmail.com',
            pass: 'rxrhspkvowovqacl'
          }
        }) // initialize create Transport service

        console.log('rESET-tOKEN', transporter)

        const CLIENT_URL = 'http://' + req.headers.host
        const mailOptions = {
          from: 'nema.riparian@gmail.com',
          to: `${req.body.username}`,
          subject: 'Link To Reset Password',
          text:
            'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process within one hour of receiving it:\n\n' +
            `http://localhost:8080/set?resetPasswordToken=${token}\n\n` +
            //   + `${CLIENT_URL}/reset/${token}\n\n`
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        }

        console.log('sending mail')

        transporter.sendMail(mailOptions, (err, response) => {
          if (err) {
            console.error('there was an error: ', err)
          } else {
            console.log('here is the res: ', response)
            //  res.status(200).json('recovery email sent');
            res.status(200).send({
              message: 'Recovery Email Sent',
              code: 20000
            })
          }
        })
      }
    })
    .catch((error) => {
      if (error.response) {
        console.log(error.response.data) // => the response payload
      }
    })
}

exports.signin = (req, res) => {
  console.log('Logging in:', req.body.username)
  User.findOne({
    where: {
      username: req.body.username
    }
  })
    .then((user) => {
      console.log('Logged in Successfully', user)

      if (!user) {
        return res.status(404).send({ message: 'User Not found.' })
      }
      var passwordIsValid = bcrypt.compareSync(req.body.password, user.password)
      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: 'Invalid Password!'
        })
      }

      if (!user.isactive) {
        return res.status(401).send({
          accessToken: null,
          message: 'Your account has not been activated yet. Please contact the admin'
        })
      }

      var token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: 86400 // 24 hours
      })
      var authorities = []
      user.getRoles().then((roles) => {
        for (let i = 0; i < roles.length; i++) {
          authorities.push(roles[i].name)
        }
        res.status(200).send({
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          roles: authorities,
          phone: user.username,
          county_id: user.county_id,
          accessToken: token,
          code: '0000',
          user: user,
          avatar: user.avatar,
          data: token,
          message: 'Login Successful'
        })
      })
    })
    .catch((err) => {
      res.status(500).send({ message: err.message })
    })
}

exports.updatePassword = (req, res) => {
  console.log('Update user password....')

  console.log('Request:----->', req.body)

  console.log('Now saving the password....')
  const NOW = new Date()

  //User.findOne({"resetPasswordToken": req.body.token, "resetPasswordExpires": { $gt: (new Date())}})
  User.findOne({
    where: {
      resetPasswordToken: req.body.token,
      resetPasswordExpires: { [Op.gt]: NOW }
    }
  }).then((userInfo) => {
    if (userInfo != null) {
      console.log('user found in db', userInfo)
      bcrypt
        .hash(req.body.password, 8)
        .then((hashedPassword) => {
          userInfo.password = hashedPassword
          userInfo.resetPasswordToken = ''
          userInfo.resetPasswordExpires = null
          userInfo.save()
        })
        .then(() => {
          console.log('password updated')

          res.status(200).send({
            code: 20000,
            message: 'Password Succesfully Updated'
          })
        })
    } else {
      //console.error('no user exists in db to update');
      //res.status(404).json('no user exists in db to update');
      res.status(401).send({
        accessToken: null,
        message: 'Invalid/Expired Link'
      })
    }
  })
}
