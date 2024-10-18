const db = require('../models')
//const db = require('../models').default;

const config = require('../config/auth.config')
//const User = db.user;
const Role = db.role
const User = db.user
const OTP = db.models.otp

 //db.models[reg_model]
const Op = db.Sequelize.Op
var jwt = require('jsonwebtoken')
var bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')
const turf = require('@turf/turf');

const fs = require('fs');
const path = require('path');
const requestIp = require('request-ip');
const axios = require('axios');
 
 

 
function formatPhoneNumber(phoneNumber) {
  // Convert phone number to a string in case it's not already
  console.log(phoneNumber)
  let formattedNumber = phoneNumber.toString();

  // Check if the phone number starts with '254'
  if (formattedNumber.startsWith('254')) {
    return formattedNumber; // Phone number is already in the correct format
  }

  // Check if the phone number starts with '0'
  if (formattedNumber.startsWith('0')) {
    // Replace the '0' with '254'
    return '254' + formattedNumber.slice(1);
  }

  // If it starts with any other digit, prepend '254'
  return '254' + formattedNumber;
}

async function sendSMS(sms_obj, admins_phones) {
  // URL for the SMS service
  const url = "https://quicksms.advantasms.com/api/services/sendotp/";

  // Message to be sent to the admins
  let adminMessage = 
    "Dear Admin, a new account has been registered for your review. " +
    "The user's name is " + sms_obj.name + "(" + sms_obj.phone+ "). "+
    "Please review the account at the following link: " +
    "https://kesmis.go.ke/users/new";

   
// Send SMS to each admin in the `admins` list
for (const phone of admins_phones) {
  // Check if phone number exists and is valid (not null or undefined)
  if (phone) {
    const requestData = {
      apikey: "684f84e9aa485a0e72e6734c6b84d9b4", // Replace with your actual API key
      partnerID: "10322", // Replace with your actual partner ID
      shortcode: "AGS",
      message: adminMessage,
      mobile: formatPhoneNumber(phone), // Send the message to the admin's phone number
    };

    try {
      const response = await axios.post(url, requestData);
      console.log(`Message sent to admin (${phone}):`, response.data);
    } catch (error) {
      console.error(`Error sending message to admin (${phone}):`, error);
    }
  } else {
    console.warn(`Admin ${phone} does not have a valid phone number.`);
  }
}


  
 
}




exports.signup = (req, res) => {

  const emails = []
  const admin_phones = []
  // Save User to Database
  console.log(req.body)
  User.create({
    username: req.body.username.trim().toLowerCase(),
    name: req.body.name,
    phone: req.body.phone,
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
 

            const userRoles = await user.getRoles();

            const userRoleWithLocationPromises = roles.map((role, index) => {
              const location_level = req.body.location_level;
              const location_id = req.body.location_id;
              const location_field = req.body.location_field;
        

              console.log('check Fields, ',location_level,location_id,location_field)
              // Check if all required fields are present
              if (location_level && location_id && location_field) {
                return db.models.user_roles.update(
                  {
                    location_level: location_level,
                    [location_field]: location_id,
                  },
                  { where: { userid: user.id, roleid: role.id } }
                );
              } else {
                console.log(`Skipping role update for role ${role.name} due to missing fields.`);
                return db.models.user_roles.update(
                  {
                    location_level: 'national',
                    [location_field]: null,
                  },
                  { where: { userid: user.id, roleid: role.id } }
                );
              }
            });

            await Promise.all(userRoleWithLocationPromises);



        // Send email to admin about the new Regitstration
        
            // query for all users with a role_id of 1
                await User.findAll({
                  include: [
                    {
                      model: Role,
                      where: { id: 0 }  // here get the Super Admin Roles only 
                    }
                  ]
                }).then(admins => {
                  // handle the results
 
                  admins.forEach(admin => {
                    emails.push(admin.email);
                    admin_phones.push(admin.phone)
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


        //const xCLIENT_URL = 'http://' + req.headers.host
        //const CLIENT_URL = req.headers.referer
        const CLIENT_URL = req.protocol + '://' + req.get('host') 
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


        sendSMS(user,admin_phones)
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
 
 

 
 

exports.updateUser = (req, res) => {
  console.log('Update user....');
  console.log('Request:----->', req.body.id);

  // Find the user by ID and update their information
  User.findOne({ where: { id: req.body.id } }).then((user) => {
    if (user) {
      user.set(req.body);
      user.save().then(() => {
        console.log('Roles Length:', req.body.roles);

        if (req.body.roles && req.body.roles.length > 0) {
          // Step 1: Get current roles of the user from the database
          db.models.user_roles.findAll({ where: { userid: user.id } }).then(existingRoles => {
            const existingRoleIds = existingRoles.map(role => role.roleid);

            // Step 2: Extract role IDs from the incoming request
            const newRoleIds = req.body.roles.map(role => role.roleid);

            // Step 3: Identify roles to delete (those in existingRoles but not in newRoles)
            const rolesToDelete = existingRoles.filter(role => !newRoleIds.includes(role.roleid));

            // Step 4: Delete roles that are not in the updated roles list
            const deleteRolePromises = rolesToDelete.map(role => 
              db.models.user_roles.destroy({ where: { roleid: role.roleid, userid: user.id } })
            );

            // Step 5: Upsert the new or updated roles
            const upsertRolePromises = req.body.roles.map(role => {

              console.log('role >>>>>>>>>>,',role)
              if (!role.location_level) {
                return Promise.reject(new Error('Role object is missing required properties'));
              }

              const location_id = role.location_level === 'national'
                ? null
                : role.location_level === 'county'
                ? role.county_id || null
                : role.location_level === 'settlement'
                ? role.settlement_id || null
                : null;

              return db.models.user_roles.upsert({
                roleid: role.roleid,
                userid: user.id,
                location_level: role.location_level,
                location_id: location_id,
                county_id: role.county_id || null,
                settlement_id: role.settlement_id || null
              }, {
                where: {
                  roleid: role.roleid,
                  userid: role.userid
                }
              });
            });

            // Execute all delete and upsert operations
            Promise.all([...deleteRolePromises, ...upsertRolePromises])
              .then(() => {
                var token = jwt.sign({ id: user.id }, config.secret, {
                  expiresIn: 86400 // 24 hours
                });

                res.send({
                  message: 'User and roles updated successfully!',
                  code: "0000",
                  data: token,
                  user: user
                });
              })
              .catch(err => {
                console.log(err);
                res.status(500).send({
                  message: 'Error updating user roles',
                  error: err
                });
              });
          }).catch(err => {
            res.status(500).send({
              message: 'Error retrieving existing user roles',
              error: err
            });
          });
        } else {
          res.status(400).send({
            data: user,
            message: 'A user requires at least one role on this system'
          });
        }
      }).catch(err => {
        res.status(500).send({
          message: 'Error saving user information',
          error: err
        });
      });
    } else {
      res.status(404).send({
        message: 'User not found'
      });
    }
  }).catch(err => {
    res.status(500).send({
      message: 'Error finding user',
      error: err
    });
  });
};



const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/data/uploads'); // Define the directory where uploaded files will be stored
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Keep the original file name
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit (adjust as needed)
  },
});

exports.updateByUser = (req, res) => {
     

  upload.array('profilePhoto')(req, res, async (err) => {
    if (err) {
      console.log(err);
      // Handle multer errors, if any
      // return res.status(400).json({ error: 'File upload failed.' });
      return res.status(500).send({
        message: 'Profile Update failed.',
        code: '0000'
      })
    }
 
    // The uploaded files can be accessed using `req.files`
    console.log('profilePhoto:', req.files[0]);
    
    var profilePhoto = req.files[0]
    var profilePhotoPath = profilePhoto?profilePhoto.path:''

    User.findAll({ where: { id: req.body.id } }).then((result) => {
      if (result && result.length > 0) {
        const user = result[0];
    
        // Check if a file was uploaded and update the profile photo path in the database
        if (req.files) {
          //const profilePhoto = req.files[0];
         // const filePath = path.join('/data/uploads', req.files.profilePhoto[0].originalname);
    
        // Read the file data as a buffer
            fs.readFile(profilePhotoPath, (err, data) => {
              if (err) {
                console.error('Error reading profile photo:', err);
                // Handle the error
                // return res.status(500).json({ error: 'Error reading profile photo' });
              } else {
                // Set the avatar_data field to the file data buffer only if reading is successful
                user.photo = data;
              }
       

            user.name = req.body.name;
            user.email = req.body.email;
            user.phone = req.body.phone;

            console.log('user', user)
    
            // Save the updated user record
            user
              .save()
              .then((updatedUser) => {
                // Remove the temporary file (optional, you can skip this if you don't need to keep the file)
                // fs.unlinkSync(profilePhoto.tempFilePath);
    
                // Send the response after successful update
                res.send({
                  message: 'User profile updated successfully!',
                  code: '0000',
                  user: updatedUser,
                });
              })
              .catch((error) => {
                console.error('Error saving user profile:', error);
                // Handle the error
                res.status(500).json({ error: 'Error saving user profile' });
              });
          });
        } else {
          // If no file was uploaded, just save the user without changing the avatar_data
          user
            .save()
            .then(() => {
              // Send the response after successful update
              res.send({
                message: 'User profile updated successfully!',
                code: '0000',
                user: user,
              });
            })
            .catch((error) => {
              console.error('Error saving user profile:', error);
              // Handle the error
              res.status(500).json({ error: 'Error saving user profile' });
            });
        }
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    });
  })

  };



exports.reset = (req, res) => {
  let username
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
        username=user.username
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
            'You are receiving this because you (or someone else) have requested the reset of the password for your account: ' + username + ' \n\n' +
            'Please click on the following link, or paste this into your browser to complete the process within one hour of receiving it:\n\n' +
            CLIENT_URL + '#/reset/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        };
        

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


function encodePhoto(photoPath) {
  try {
    const data = fs.readFileSync(photoPath);
    return data.toString('base64');
  } catch (error) {
    console.error('Error reading photo file:', error);
    return null; // Return null or any default value if the photo cannot be read or converted
  }
}

exports.signin = async (req, res) => {
  const  instlog = {}
  instlog.table='auth'
  instlog.action='Login'
  instlog.date = new Date();
  // let ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
  console.log(req)
  const clientIp = req.connection.remoteAddress; // This will give you the remote IP address of the client
  console.log(clientIp);
  instlog.source = clientIp;

  console.log('Logging in:', req.body.username,req.body.email)
 // const username = req.body.username.trim();
 

 let whereClause = [];

        if(req.body.username) {
          whereClause.push({
            username: {
              [Op.iLike]: req.body.username.trim().toLowerCase()
            }
          });
        }

        if(req.body.username) {
          whereClause.push({
            email: {
              [Op.iLike]: req.body.username.trim().toLowerCase()
            }
          });
        }

        if(req.body.username) {
          whereClause.push({
            phone: {
              [Op.iLike]: req.body.username.trim().toLowerCase()
            }
          });
        }


        if(req.body.phone) {
          whereClause.push({
            phone: {
              [Op.iLike]: req.body.phone.trim().toLowerCase()
            }
          });
        }


        console.log('Logging in whereClause:', whereClause)


 
    User.findOne({
  
      where:{ [Op.or]:
              whereClause
            }
    })
    .then(async (user) => {
    
      console.log(user)
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
          instlog.userName = req.body.username
          instlog.status = 'Successful'
          console.log(instlog)

          if(user.id!=1){
            await db.models.logs.create(instlog);
          }
          

 

      var token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: 86400 // 24 hours
      })
      var authorities = []
      user.getRoles().then((roles) => {
        for (let i = 0; i < roles.length; i++) {
          //authorities.push(roles[i].name)
          authorities.push(roles[i])
        }

        console.log('Logged User:', user)
        res.status(200).send({
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          roles: authorities,
          phone: user.phone,
          county_id: user.county_id,
          accessToken: token,
          code: '0000',
          user: user,
          photo: user.avatar,
          //avatar: user.avatar,
          avatar : user.photo ? 'data:image/png;base64,' + user.photo.toString('base64') : user.avatar, 
          //avatar : user.avatar, 
          data: token,
          message: 'Login Successful'
        })
      })
    })
    .catch((err) => {
      console.log(err)
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
 
  db.models[reg_model].findAll().then((features) => {
    let intersectingPolygon = null;
    for (let feature of features) {
      if (turf.booleanPointInPolygon(point, feature.geom)) {
        intersectingPolygon = feature;
        break;
      }
    }
    if (intersectingPolygon) {
      const bbox = turf.bbox(intersectingPolygon.geom);
  
      let county = {
        id: intersectingPolygon.id,
        name: intersectingPolygon.name,
        code: intersectingPolygon.code,
        bbox: bbox,
      };
  
      res.status(200).send([county]);
    } else {
      // Route for handling requests when there is no intersecting polygon
      console.log('No intersecting polygon found');
      res.status(500).send({ message: 'Unable to determine your county based on your location' });
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
      //  attributes: { exclude: ['geom'] }
      })
    .then((list) => {
      //console.log(list.rows)
      res.status(200).send(list.rows)
    })

  } else {

    db.models[reg_model]
   // .findAndCountAll({attributes: { exclude: ['geom' ] }})
    .findAndCountAll()
    .then((list) => {
      //console.log(list.rows)
      res.status(200).send(list.rows)
    })
  }

}



exports.wardController = (req, res) => {
  var reg_model = 'ward'
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
  console.log('Update user....');
 
  console.log('Request:----->', req.body);
  var qry = {};
  qry.where =  {
    id: req.body.id 
  };
  qry.attributes = { exclude: ['password', 'resetPasswordExpires', 'isactive', 'resetPasswordToken'] }; // will be applciable to users only

  // get this one  record and update it by replacing the whole docuemnt
  User.findAll(qry).then((result) => {
    if (result && result.length > 0) {
      const user = result[0]; // Convert the Sequelize instance to a plain object

      // Convert the avatar_data (binary) to a base64-encoded URL for the photo
      if (user.photo) {
       // const avatarURL = 'data:image/png;base64,' + user.photo.toString('base64');
        const avatarURL =  user.photo ? 'data:image/png;base64,' + user.photo.toString('base64') : ''

        user.photo = avatarURL;
        delete user.photo; // Remove the binary data from the result object
      } 

      res.status(200).send({
        data: user,
        code: '0000' 
      });
    } else {
      res.status(500).send({ message: 'Retrieving your profile failed' });
    }
  });
};




exports.subCountyAllController = (req, res) => {
  var reg_model = 'subcounty'
     db.models[reg_model]
    .findAndCountAll({attributes: { exclude: ['geom' ] }})
    .then((list) => {
      //console.log(list.rows)
      res.status(200).send(list.rows)
    })
  }

   
exports.wardAllController = (req, res) => {
  var reg_model = 'ward'
     db.models[reg_model]
    .findAndCountAll({attributes: { exclude: ['geom' ] }})
    .then((list) => {
      //console.log(list.rows)
      res.status(200).send(list.rows)
    })
  }

  exports.settlementAllController = (req, res) => {
    var reg_model = 'settlement'
       db.models[reg_model]
      .findAndCountAll({attributes: { exclude: ['geom' ] }})
      .then((list) => {
        //console.log(list.rows)
        res.status(200).send(list.rows)
      })
}
    
    exports.countyAllController = (req, res) => {
      var reg_model = 'county'
         db.models[reg_model]
        .findAndCountAll({attributes: { exclude: ['geom' ] }})
        .then((list) => {
          //console.log(list.rows)
          res.status(200).send(list.rows)
        })
      }
    

 exports.getOneCountyController = (req, res) => {
        var reg_model = 'county'
        console.log('county', req.body.county)
        var county = req.body.county
        if (county) {
       
          db.models[reg_model]
            .findAndCountAll({
              where: {
                id: {
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


exports.settlementByCountyController = (req, res) => {


  console.log('settlementByCountyController',req.body.county_id)
  const reg_model = 'settlement';
  const countyId = req.body.county_id; // Extract county_id from query parameters

  // Initialize the query options
  const queryOptions = {
    attributes: { exclude: ['geom'] },
  };

  // Apply filter by county_id if provided
  if (countyId) {
    queryOptions.where = {
      county_id: countyId,
    };
  }

  // Execute the query
  db.models[reg_model]
    .findAndCountAll(queryOptions)
    .then((list) => {
      // Send the response with the filtered or unfiltered list
      //res.status(200).send(list.rows);

      res.status(200).send({
        data: list.rows,
        code: '0000' 
      });


    })
    .catch((error) => {
      // Handle any errors
      console.error('Error fetching settlements:', error);
      res.status(500).send({ message: 'Unable to retrieve settlements. Please try again later.' });
    });
};


 
exports.signupViaApp = async (req, res) => {
  console.log("App signup.....");
  console.log(req.body);

  try {
    // Save User to Database
    const { phone, name, password } = req.body;

    // Ensure password is not null or undefined, otherwise provide a default value or handle as needed
    const hashedPassword = password ? bcrypt.hashSync(password, 8) : null;

    const user = await User.create({
      username: phone,
      name: name,
      phone: phone,
      password: hashedPassword // Set to null if password is null
    });

    // Find roles based on request body
    const roles = await Role.findAll({
      where: {
        name: {
          [Op.in]: req.body.role,
        },
      },
    });

    // Set roles for the user
    await user.setRoles(roles);

    // Add location property to user_role
    const userRoles = await user.getRoles();
    const userRoleWithLocationPromises = userRoles.map((role, index) => {
      const location_level = req.body.location_level;
      const location_id = req.body.location_id;
      const location_field = req.body.location_field;

      // Check if all required fields are present
      if (location_level && location_id && location_field) {
        return db.models.user_roles.update(
          {
            location_level: location_level,
            [location_field]: location_id,
          },
          { where: { userid: user.id, roleid: role.id } }
        );
      } else {
        console.log(`Skipping role update for role ${role.name} due to missing fields.`);
        return db.models.user_roles.update(
          {
            location_level: null,
            [location_field]: null,
          },
          { where: { userid: user.id, roleid: role.id } }
        );
      }
    });

    // Execute all location updates
    await Promise.all(userRoleWithLocationPromises);

    // Generate a 4-digit OTP
    const otpCode = Math.floor(1000 + Math.random() * 9000);

    // Save the OTP to the database
    const otp = await OTP.create({
      user_id: user.id,
      otp: otpCode,
      status: 'Valid',
    });

    console.log("OTP saved:", otp);

    // Send OTP via external service (Leopard)
    const url = "https://quicksms.advantasms.com/api/services/sendotp/";
    const requestData = {
      apikey: 'your-api-key',
      partnerID: '10322',
      shortcode: 'AGS',
      message: 'Your registration code is: ' + otpCode + '.',
      mobile: req.body.phone,
    };

    axios.post(url, requestData)
      .then(response => {
        console.log('Response:', response.data);
      })
      .catch(error => {
        console.error('Error:', error);
      });

    // Send response to client
    res.send({
      message: 'User registered successfully!',
      code: '0000',
      data: otpCode,
    });

  } catch (error) {
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      // Handle duplicate phone number or username
      res.status(400).send({
        message: 'User already exists!',
        code: 'DUPLICATE_USER',
      });
    } else {
      console.error('Error during user registration:', error);
      res.status(500).send({ message: error.message });
    }
  }
};

 
function convertPhoneNumber(number) {
  // Remove leading plus sign (+) and any spaces
  number = number.replace(/\+/g, '').trim();

  // Check if the number starts with "254" or "+254"
  if (number.startsWith('254')) {
      // Replace "254" with "0"
      number = '0' + number.substring(3);
  }

  return number;
}


exports.signinViaApp = async (req, res) => {
  const  instlog = {}
  instlog.table='auth'
  instlog.action='Login'
  instlog.date = new Date();
  // let ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
  //console.log(req)
  const clientIp = req.connection.remoteAddress; // This will give you the remote IP address of the client
  console.log(clientIp);
  instlog.source = clientIp;

  console.log('Logging in:', req.body.phone)
 // const username = req.body.username.trim();
 let user_phone = convertPhoneNumber(req.body.phone)

 console.log(user_phone)
 
    User.findOne({
      where: {
        [Op.or]: [
          {
            username: {  // chek user input against username 
              [Op.iLike]: user_phone 
            }
          },
          {
            phone: {  // chek user input against username 
              [Op.iLike]: user_phone
            }
          },
        ]
      }
    })
    .then(async (user) => {
      if (!user) {
         instlog.userId = 0
        instlog.userName =user_phone
        instlog.status = 'Fail. User not found'
        console.log(instlog)
        await db.models.logs.create(instlog);
        return res.status(404).send({ message: 'No account is associated with this number' })
      }
  
      if (!user.isactive) {
        instlog.userId = 0
        instlog.userName = user_phone
        instlog.status = 'Fail.  Inactive account'
        console.log(instlog)
        await db.models.logs.create(instlog);

        return res.status(401).send({
          accessToken: null,
          message: 'Your account has deactivated. Please contact the admin'
        })
      }

      //  if all is good
       // Generate a 4-digit OTP
      const otpCode = Math.floor(1000 + Math.random() * 9000);

      console.log(otpCode)

      // Save the OTP to the database
      const otp = await OTP.create({
        user_id: user.id,
        otp: otpCode,
        status:'Valid'
      });

      console.log("OTP saved:", otp);

      // Send OTP via Leopard (not implemented in this code snippet)
       const url = "https://quicksms.advantasms.com/api/services/sendotp/";
       const requestData = {
          apikey: '684f84e9aa485a0e72e6734c6b84d9b4',
          partnerID: '10322',
          shortcode: 'AGS',
          message: 'Your KeSMIS Login code is: ' + otpCode + '.',
          //message: 'Your UAFSD Login code is: ' + otpCode + '. \n gyQbWWWRcc5',
          mobile:   user_phone 
          
        };
 
        axios.post(url, requestData)
        .then(response => {
          console.log('Response:', response.data);
          res.send({
            message: 'Check your phone for login verification SMS! ',
            code: '0000',
            data: otpCode,
          });

        })
        .catch(error => {
          console.error('Error:', error);
          let msg = error.response && error.response.data && error.response.data.message ? error.response.data.message : "Our SMS service provider is down. Please try again later";
          res.status(500).send({ message:msg})
        });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message })
    })
  

}



exports.verifyCode = async (req, res) => {
  try {
    const otp = await OTP.findOne({
      where: {
        otp: req.body.otp,
        status: 'Valid', // Check if the OTP status is 'valid'
      }
    });

    if (!otp) {
      return res.status(404).send({ message: 'Invalid Code.' });
    }

    if (otp.expires < new Date()) {
      return res.status(401).send({ message: 'Fail. Expired code' });
    }

    // Update the OTP status to invalid
    await otp.update({ status: 'Invalid' });

    console.log("otp.user_id",otp.user_id )

    // Get the associated user using user_id from the OTP
    const user = await User.findOne({
      where: {
        id: otp.user_id // Assuming user_id is the field representing user's id in the OTP table
      },
      attributes: {
        exclude: ['photo'] // Exclude the 'photo' field from the result
      }
    });

    if (!user) {
      return res.status(404).send({ message: 'User not found.' });
    }

    var token = jwt.sign({ id: user.id }, config.secret, {
      expiresIn: 86400 // 24 hours
    })
    
    const expiryDate = new Date();
    // Add 24 hours to the current date
    expiryDate.setHours(expiryDate.getHours() + 24);


    var authorities = []
    user.getRoles().then((roles) => {
      for (let i = 0; i < roles.length; i++) {
        authorities.push(roles[i].name)
      }

      const expiryDate = new Date();
      // Add 24 hours to the current date
      expiryDate.setHours(expiryDate.getHours() + 24);

      console.log('Logged User:', user)
      res.status(200).send({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        roles: authorities,
        phone: user.phone,
        county_id: user.county_id,
        accessToken: token,
        tokenExpiryDate:expiryDate,
        code: '0000',
        user: user,
        photo: user.photo,
        //avatar: user.avatar,
        avatar : user.photo ? 'data:image/png;base64,' + user.photo.toString('base64') : user.avatar, 
        //avatar : user.avatar, 
        data: token,
        message: 'Login Successful'
      })
    })



    // res.send({
    //   message: 'Login Successful',
    //   code: '0000',
    //   accessToken: token,
    //   tokenExpiryDate:expiryDate,
    //   user: user // You can include the user data in the response if needed
    // });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};


 