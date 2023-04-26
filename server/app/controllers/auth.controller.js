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
const turf = require('@turf/turf');



exports.signup = (req, res) => {
  console.log('Inside REgistration', req.body)
  const emails = []
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
        Role.findAll({
          where: {
            name: {
              [Op.in]: req.body.role
            }
          }
        }).then((roles) => {
          user.setRoles(roles).then(async () => {
            var token = jwt.sign({ id: user.id }, config.secret, {
              expiresIn: 86400 // 24 hours
            })

        // Send email to admin about the new Regitstration
        
            // query for all users with a role_id of 1
                await User.findAll({
                  include: [
                    {
                      model: Role,
                      where: { id: 1 }
                    }
                  ]
                }).then(admins => {
                  // handle the results
 
                  admins.forEach(admin => {
                    emails.push(admin.email);
                  });
                  console.log(emails); // an array of email addresses

                }).catch(error => {
                  // handle the error
                  console.log('Fail:',error)
                });
            
        var transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'kisip.mis@gmail.com',
            pass: 'ycoxaqavmfiqljjg'
          }
        }) // initialize create Transport service


        const xCLIENT_URL = 'http://' + req.headers.host
        const CLIENT_URL = req.headers.referer
        console.log('Reset-URL', CLIENT_URL)
        console.log('Admin Emails >>', emails); // an array of email addresses

        const mailOptions = {
          from: 'kisip.mis@gmail.com',
          to: emails,
          subject: 'New KISIP MIS user account',
          text:
            'A new user account (' +  req.body.email + ')has been created. Please review and approve appropriately via this link:\n\n' +
            CLIENT_URL+'#/users/new'  
        }

        console.log('sending mail')

        transporter.sendMail(mailOptions, (err, response) => {
          if (err) {
            console.error('there was an error: ', err)
          } else {
            console.log('here is the res: ', response)
            
          }
        })
            console.log(roles)
            res.send({
              message: 'User registered successfully! Please wait for the account to be activated',
              code: '0000',
              roles: roles[0].name,
              data: token,
              user: user
            })
          })
        })
    
    })
    .catch((err) => {
      console.log(err)
      res.status(500).send({ message: err.message })
    })
}

exports.xsignup = (req, res) => {
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
      if (req.body.role) {
        Role.findAll({
          where: {
            name: {
              [Op.or]: req.body.role
            }
          }
        }).then((roles) => {
          user.setRoles(roles).then(() => {
            var token = jwt.sign({ id: user.id }, config.secret, {
              expiresIn: 86400 // 24 hours
            })

        // Send email to admin about the new reighstration

        var transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'kisip.mis@gmail.com',
            pass: 'ycoxaqavmfiqljjg'
          }
        }) // initialize create Transport service


        const xCLIENT_URL = 'http://' + req.headers.host
        const CLIENT_URL = req.headers.referer
        console.log('Reset-URL', CLIENT_URL)

        const mailOptions = {
          from: 'kisip.mis@gmail.com',
          to: 'felix.mutua@gmail.com',
          subject: 'New KISIP MIS user account',
          text:
            'A new user account (' +  req.body.email + ')has been created. Please review and approve appropriately via this link:\n\n' +
            CLIENT_URL+'#/users/new/'  
        }

        console.log('sending mail')

        transporter.sendMail(mailOptions, (err, response) => {
          if (err) {
            console.error('there was an error: ', err)
          } else {
            console.log('here is the res: ', response)
            
          }
        })
            console.log(roles)
            res.send({
              message: 'User registered successfully! Please wait for the account to be activated',
              code: '0000',
              roles: roles[0].name,
              data: token,
              user: user
            })
          })
        })
      } else {
        // public user role = 14
        user.setRoles([14]).then(() => {
          res.send({
            message: 'User was registered successfully! Please wait for the account to be activated',
            code: '0000',
            data: 'successful'
          })
        })
      }
    })
    .catch((err) => {
      console.log(err)
      res.status(500).send({ message: err.message })
    })
}
exports.updateUser = (req, res) => {
  console.log('Update user....')
 
  console.log('Request:----->', req.body)
  

  // get this one  record and update it by replacing the whole docuemnt
  User.findAll({ where: { id: req.body.id } }).then((result) => {
    if (result) {
      // Result is array because we have used findAll. We can use findOne as well if you want one row and update that.
      result[0].set(req.body)
      result[0].save()

      // Now insert the roles
      console.log("Roles Leng",req.body.roles.length )
      if (req.body.roles.length>0) {
        Role.findAll({
          where: {
            id: {
              [Op.or]: req.body.roles
            }
          }
        }).then((roles) => {

          console.log('Edit Roles found:----->', roles)
          result[0].setRoles(roles).then(() => {
            var token = jwt.sign({ id: result[0].id }, config.secret, {
              expiresIn: 86400 // 24 hours
            })

            //console.log(roles)
            res.send({
              message: 'User and roles updated successfully!',
              code: "0000",
              roles: roles[0].name,
              data: token,
              user: result[0]
            })
          })
        })
      } else {
        // return success
        res.status(400).send({
          data: result,
          message: 'A user requires at least one role on this system'
        })
      }
    }
  })
}

exports.reset = (req, res) => {
  console.log('Reset password....', req.headers)
  console.log(req.body)
  if (req.body.email === '') {
    res.status(400).send('email required')
  }
  /* console.error(req.body.email); */
  User.findOne({ where: { email: req.body.email } })
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
            { where: { email: req.body.email } }
          )
          console.log(result)
        } catch (err) {
          console.log(err)
        }

        console.log('rESET-tOKEN', req)
        //   console.log(user)

        var transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'kisip.mis@gmail.com',
            pass: 'ycoxaqavmfiqljjg'
          }
        }) // initialize create Transport service


        const CLIENT_URL = 'https://' + req.headers.host
        const xCLIENT_URL = req.headers.referer
        //const CLIENT_URL = req.host;
        console.log(req.originalUrl)
        console.log(req.hostname)

        console.log('Reset-URL', CLIENT_URL)

        const mailOptions = {
          from: 'kisip.mis@gmail.com',
          to: `${req.body.email}`,
          subject: 'Link To Reset Password',
          text:
            'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process within one hour of receiving it:\n\n' +
            CLIENT_URL+'#/reset/'+token+'\n\n' +
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
              code: "0000"
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

exports.signin = async (req, res) => {
  const  instlog = {}
  instlog.table='auth'
  instlog.action='Login'
  instlog.date = new Date();
  let ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
  console.log(ip)
  instlog.source = ip

  console.log('Logging in:', req.body.username)
  User.findOne({
    where: {
      username: req.body.username
    }
  })
    .then(async (user) => {
    
      if (!user) {
         instlog.userId = 0
        instlog.userName = req.body.username
        instlog.status = 'Fail. User not found'
        console.log(instlog)
        await db.models.logs.create(instlog);
        return res.status(404).send({ message: 'User Not found.' })
      }
      var passwordIsValid = bcrypt.compareSync(req.body.password, user.password)
      if (!passwordIsValid) {
 
        instlog.userId = 0
        instlog.userName = req.body.username
        instlog.status = 'Fail.  Invalid Password'
        console.log(instlog)
        await db.models.logs.create(instlog);


        return res.status(401).send({
          accessToken: null,
          message: 'Invalid Password!'
        })
      }

      if (!user.isactive) {
             instlog.userId = 0
        instlog.userName = req.body.username
        instlog.status = 'Fail.  Inactive account'
        console.log(instlog)
        await db.models.logs.create(instlog);

        return res.status(401).send({
          accessToken: null,
          message: 'Your account has not been activated yet. Please contact the admin'
        })
      }

          // Log the user details 
          instlog.userId = user.id
          instlog.userName = user.name
          instlog.status = 'Successful'
          console.log(instlog)
          await db.models.logs.create(instlog);

 

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
      console.log('User found in db', userInfo)
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
            code: "0000",
            message: 'Password Succesfully Updated'
          })
        })
    } else {
      res.status(401).send({
        accessToken: null,
        message: 'Invalid/Expired Link'
      })
    }
  })
}



exports.countyController = (req, res) => {
  var reg_model = 'county'
   db.models[reg_model]
    .findAll({attributes: { exclude: ['geom' ] }})
    .then((list) => {
      //console.log(list.rows)
      res.status(200).send(list)
    })
}


exports.countyByLocationController = (req, res) => {
  var reg_model = 'county'
  var point = req.body.MyLocation
  console.log(point)
  //  db.models[reg_model]
  //   .findAll({attributes: { exclude: ['geom' ] }})
  //   .then((list) => {
  //     //console.log(list.rows)
  //     res.status(200).send(loc)
  //   })
  
  
    
// Find the intersecting polygon
db.models[reg_model].findAll().then(features => {
  var intersectingPolygon = null;
  for (let feature of features) {
  // console.log(feature)
    if (turf.booleanPointInPolygon(point, feature.geom)) {
      intersectingPolygon = feature;
      delete intersectingPolygon.geom
      break;
    }
  }
  if (intersectingPolygon) {
 
   let county = { id: intersectingPolygon.id, name: intersectingPolygon.name,code: intersectingPolygon.code } // Pick only the properties we need to store on the deivce
    res.status(200).send([county])
  } else {
    // Route for handling requests when there is no intersecting polygon
 
    console.log('No intersecting polygon found');
  
    res.status(500).send({ message: 'Unable to determine your county based on your location' })


  }
});

}




exports.countyPostController = async (req, res) => {
  console.log('getting counties......')
  var reg_model = 'county'
    await db.models[reg_model].findAll({
    }).then((list) => {
      res.status(200).send({
        data: list,
        code: "0000"
      })
    })
}

 


exports.xsettlementController = (req, res) => {
  var reg_model = 'settlement'
   db.models[reg_model]
    .findAll({attributes: { exclude: ['geom' ] }})
    .then((list) => {
      //console.log(list.rows)
      res.status(200).send(list)
    })
}



exports.settlementController = (req, res) => {
  var reg_model = 'settlement'
  console.log('county', req.body.county)
  var county = req.body.county
  if (county) {
 
    db.models[reg_model]
      .findAndCountAll({
        where: {
          county_id: {
            [Op.eq]: county
          }
        },
        attributes: { exclude: ['geom'] }
      })
    .then((list) => {
      //console.log(list.rows)
      res.status(200).send(list.rows)
    })

  } else {

    db.models[reg_model]
    .findAndCountAll({attributes: { exclude: ['geom' ] }})
    .then((list) => {
      //console.log(list.rows)
      res.status(200).send(list.rows)
    })
  }

}


exports.subCountyController = (req, res) => {
  var reg_model = 'subcounty'

  console.log('county', req.body.county)
  var county = req.body.county
  if (county) {
 
    db.models[reg_model]
      .findAndCountAll({
        where: {
          county_id: {
            [Op.eq]: county
          }
        },
        attributes: { exclude: ['geom'] }
      })
    .then((list) => {
      //console.log(list.rows)
      res.status(200).send(list.rows)
    })

  } else {

    db.models[reg_model]
    .findAndCountAll({attributes: { exclude: ['geom' ] }})
    .then((list) => {
      //console.log(list.rows)
      res.status(200).send(list.rows)
    })
  }

}


 
exports.myProfile = (req, res) => {
  console.log('Update user....')
 
  console.log('Request:----->', req.body)
  var qry = {}
  qry.where =  {
    id: req.body.id 
  }
  qry.attributes = { exclude: ['password', 'resetPasswordExpires', 'isactive',  'resetPasswordToken'] } // will be applciable to users only 

  // get this one  record and update it by replacing the whole docuemnt
  User.findAll(qry).then((result) => {
    if (result) {
      res.status(200).send({
        data: result,
         code: '0000'
      })
    
    } else {
      res.status(500).send({ message: 'Retriveing your profile failed' })


    }
  })
}
