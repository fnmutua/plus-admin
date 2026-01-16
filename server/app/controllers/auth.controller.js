const db = require('../models')
//const db = require('../models').default;

const config = require('../config/auth.config')
//const User = db.user;
const Role = db.role
const User = db.user
const Users = db.models.users
const OTP = db.models.otp
const { isAuthSMSEnabled } = require('../utils/smsSettings')

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
const UserRoles = db.models.user_roles

 

 
function formatPhoneNumber(phoneNumber) {
  // Convert phone number to a string in case it's not already
  console.log(phoneNumber)
  let formattedNumber = phoneNumber.toString();

  // Remove any '+' prefix if present
  if (formattedNumber.startsWith('+')) {
    formattedNumber = formattedNumber.substring(1);
  }

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
  // Check if SMS is enabled for auth module
  const smsEnabled = await isAuthSMSEnabled()
  if (!smsEnabled) {
    console.log('[SMS Registration] SMS sending is disabled for auth module. Skipping SMS notification.')
    return
  }

  // URL for the SMS service
  const url = "https://quicksms.advantasms.com/api/services/sendotp/";

  // Message to be sent to the admins
  let adminMessage = 
    "Dear Admin, a new account has been registered for your review. " +
    "The user's name is " + sms_obj.name + "(" + sms_obj.phone+ "). "+
    "Please review the account at the following link: " +
    "https://kesmis.go.ke/users/new";

  console.log(`[SMS Registration] Attempting to send registration SMS to ${admins_phones.length} admin(s) for user ${sms_obj.name} (${sms_obj.phone})`);
   
  // Send SMS to each admin in the `admins` list
  for (const phone of admins_phones) {
    // Check if phone number exists and is valid (not null or undefined)
    if (phone && typeof phone === 'string' && phone.trim() !== '') {
      let formattedPhone;
      try {
        formattedPhone = formatPhoneNumber(phone);
      } catch (error) {
        console.error(`[SMS Registration] Error formatting admin phone number ${phone}:`, error);
        continue;
      }

      const requestData = {
        apikey: "***REDACTED***", // Replace with your actual API key
        partnerID: '12108', // Replace with your actual partner ID
        shortcode: "KISIP",
        message: adminMessage,
        mobile: formattedPhone, // Send the message to the admin's phone number
      };

      try {
        const response = await axios.post(url, requestData);
        console.log(`[SMS Registration] Message sent successfully to admin (${phone}):`, response.data);
      } catch (error) {
        console.error(`[SMS Registration] Error sending message to admin (${phone}):`, error.message || error);
      }
    } else {
      console.warn(`[SMS Registration] Admin phone number is invalid: ${phone}`);
    }
  }
}


async function sendNotification(phone_number, message) {
  // Check if SMS is enabled for auth module
  const smsEnabled = await isAuthSMSEnabled()
  if (!smsEnabled) {
    console.log('[SMS] SMS sending is disabled for auth module. Skipping SMS notification.')
    return
  }

  // URL for the SMS service
  const url = "https://quicksms.advantasms.com/api/services/sendotp/";

  // Check if phone number and message are valid
  if (!phone_number || !message) {
    console.warn("[SMS] Invalid input: phone_number or message is missing.", { phone_number: !!phone_number, message: !!message });
    return;
  }

  // Validate phone number is not empty string
  if (typeof phone_number === 'string' && phone_number.trim() === '') {
    console.warn("[SMS] Phone number is empty string.");
    return;
  }

  let formattedPhone;
  try {
    formattedPhone = formatPhoneNumber(phone_number);
  } catch (error) {
    console.error(`[SMS] Error formatting phone number ${phone_number}:`, error);
    return;
  }

  const requestData = {
    apikey: "***REDACTED***", // Replace with your actual API key
    partnerID: "12108", // Replace with your actual partner ID
    shortcode: "KISIP",
    message: message,
    mobile: formattedPhone, // Format the phone number
  };

  try {
    console.log(`[SMS] Attempting to send SMS to ${formattedPhone} (original: ${phone_number})`);
    const response = await axios.post(url, requestData);
    console.log(`[SMS] Message sent successfully to ${phone_number}:`, response.data);
    return response.data; // Return response for further handling if needed
  } catch (error) {
    console.error(`[SMS] Error sending message to ${phone_number}:`, error.message || error);
    throw error; // Rethrow error for caller to handle
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
    country_name: req.body.country_name,
    organization_name: req.body.organization_name,
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
                      where: { name: 'support' }  // here get the Support  Roles only 
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
          subject: 'New KeSMIS user account',
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
        
        // Send acknowledgement email to the user
        sendAcknowledgementEmail(user.email, user.name, user.username)
        
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
 
exports.updateUser = async (req, res) => {
  console.log("Update user....");
  console.log("Request:----->", req.body.id);

  try {
    // Find the user and include user_roles
    let user = await Users.findOne({
      where: { id: req.body.id },
      include: [{ model: db.models.user_roles }],
    });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Prepare update data - only include fields that are explicitly provided
    // This prevents overwriting fields with undefined/null values
    const updateData = {};
    const allowedFields = ['name', 'email', 'phone', 'avatar', 'username', 'organization_name', 'county_id', 'settlement_id', 'location_level', 'location_id'];
    
    allowedFields.forEach(field => {
      // Only include field if it's explicitly provided (hasOwnProperty check)
      // For phone: preserve existing value if undefined/null, but allow empty string to clear it
      if (field === 'phone') {
        if (req.body.hasOwnProperty('phone') && req.body.phone !== undefined && req.body.phone !== null) {
          updateData[field] = req.body[field];
        }
        // If phone is undefined/null, don't include it in updateData (preserves existing value)
      } else {
        if (req.body.hasOwnProperty(field) && req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }
    });

    // Update user data with only the fields we want to update
    if (Object.keys(updateData).length > 0) {
      await user.update(updateData);
    }

    console.log("Roles Length:", req.body.roles);

    if (req.body.roles && req.body.roles.length > 0) {
      // Step 1: Delete existing user roles except roleid == 0
      await db.models.user_roles.destroy({
        where: { userid: user.id, roleid: { [Op.ne]: 0 } },
      });

      console.log("Existing roles deleted, excluding roleid == 0.");

      // Step 2: Insert new roles
      const rolesToInsert = req.body.roles.map((role) => ({
        roleid: role.roleid,
        userid: user.id,
        location_level: role.location_level,
        location_id:
          role.location_level === "county"
            ? role.county_id || null
            : role.location_level === "settlement"
            ? role.settlement_id || null
            : null,
        county_id: role.county_id || null,
        settlement_id: role.settlement_id || null,
      }));

      await db.models.user_roles.bulkCreate(rolesToInsert);

      console.log("Roles inserted successfully.");
    } else {
      return res.status(400).send({
        data: user,
        message: "A user requires at least one role on this system",
      });
    }

    // Fetch the updated user with new roles
    user = await Users.findOne({
      where: { id: req.body.id },
      include: [{ model: db.models.user_roles }],
    });

    // Generate a token
    const token = jwt.sign({ id: user.id }, config.secret, {
      expiresIn: 86400, // 24 hours
    });

    res.send({
      message: "User and roles updated successfully!",
      code: "0000",
      data: token,
      user: user, // Updated user with new roles
    });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).send({ message: "Error updating user", error: err });
  }
};

exports.modelActivateUser = async (req, res) => {
  try {
    const { model } = req.query;
    const { id, isactive, phone } = req.body;

    console.log(`[User Activation] Starting activation/deactivation process for user ${id}, isactive: ${isactive}, model: ${model}`);
    console.log(`[User Activation] Request body phone: ${phone || 'N/A'}`);

    // Find the user by ID
    const user = await db.models[model].findOne({ where: { id } });

    if (!user) {
      console.error(`[User Activation] User not found with ID ${id}`);
      return res.status(404).send({
        message: 'User not found',
        code: '0001'
      });
    }

    console.log(`[User Activation] User found: ${user.name} (ID: ${user.id}), current isactive: ${user.isactive}, phone: ${user.phone || 'N/A'}`);

    // Update the status field
    user.isactive = isactive;

    // Save the updated record
    await user.save();
    console.log(`[User Activation] User status saved: isactive = ${isactive}`);

    // Reload user to ensure we have the latest data
    await user.reload();
    console.log(`[User Activation] User reloaded, phone after reload: ${user.phone || 'N/A'}`);

    // Use phone from database, or fallback to request body, or use user object phone
    const phoneNumber = user.phone || phone || (req.body.phone ? req.body.phone : null);
    console.log(`[User Activation] Phone number to use: ${phoneNumber || 'N/A'} (from: ${user.phone ? 'database' : phone ? 'request body' : 'none'})`);

    // Send SMS notification to the user's phone number
    const hasPhone = phoneNumber && typeof phoneNumber === 'string' && phoneNumber.trim() !== '';
    console.log(`[User Activation] Phone check - hasPhone: ${hasPhone}, phone value: ${phoneNumber}, type: ${typeof phoneNumber}, isactive: ${isactive}`);
    
    if (hasPhone) {
      const statusText = isactive ? 'activated' : 'deactivated';
      const message = `Dear ${user.name || 'User'}, your KeSMIS account has been ${statusText}.`;
      try {
        console.log(`[User Activation] Attempting to send SMS to user ${user.id} (${user.name}) at ${phoneNumber}, isactive: ${isactive}, statusText: ${statusText}`);
        await sendNotification(phoneNumber, message);
        console.log(`[User Activation] SMS sent successfully to user ${user.id} (${statusText})`);
      } catch (error) {
        // Log SMS error but don't affect the response
        console.error(`[User Activation] Failed to send SMS to ${phoneNumber} for user ${user.id}:`, error.message || error);
      }
    } else {
      console.warn(`[User Activation] No valid phone number found for user ID ${user.id} (phone from DB: ${user.phone}, phone from body: ${phone}, isactive: ${isactive})`);
    }

    const requestBaseUrl = `${req.protocol}://${req.get('host')}`;
    const frontendBaseUrl = getFrontendBaseUrl(requestBaseUrl);

    // Send email notification to the user
    if (user.email) {
      try {
        if (isactive) {
          await sendActivationEmail(
            user.email,
            user.name || 'User',
            user.username || user.email,
            frontendBaseUrl
          );
        } else {
          await sendDeactivationEmail(user.email, user.name || 'User', user.username || user.email);
        }
      } catch (emailError) {
        // Log email error but don't affect the response
        console.error(`Failed to send email to ${user.email}:`, emailError.message);
      }
    } else {
      console.warn(`No email address found for user ID ${user.id}`);
    }

    res.status(200).send({
      message: 'User status updated successfully',
      data: user,
      code: '0000'
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).send({
      message: 'Unable to update user status. Please try again later.',
      code: '9999'
    });
  }
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
            user: process.env.EMAIL_USER || 'kisip.mis@gmail.com',
            pass: process.env.EMAIL_PASS || 'ycoxaqavmfiqljjg'
          }
        }) // initialize create Transport service


        const CLIENT_URL = req.protocol + '://' + req.get('host')
        const resetLink = CLIENT_URL + '/#/reset/' + token
        
        console.log('Reset-URL', CLIENT_URL)
        console.log('Reset-Link', resetLink)
        
        const mailOptions = {
          from: process.env.EMAIL_FROM || 'kisip.mis@gmail.com',
          to: `${req.body.email}`,
          subject: 'Reset Your Password - KeSMIS',
          html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Reset Your Password</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px;">
                <tr>
                  <td align="center">
                    <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">
                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #00DC82 0%, #00B86B 100%); padding: 40px 30px; text-align: center;">
                          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                            Reset Your Password
                          </h1>
                        </td>
                      </tr>
                      
                      <!-- Content -->
                      <tr>
                        <td style="padding: 40px 30px;">
                          <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                            Hello <strong>${username}</strong>,
                          </p>
                          
                          <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                            You are receiving this email because you (or someone else) have requested to reset the password for your KeSMIS account.
                          </p>
                          
                          <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                            Please click the button below to reset your password. This link will expire in <strong>24 hours</strong>.
                          </p>
                          
                          <!-- Reset Button -->
                          <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                            <tr>
                              <td align="center">
                                <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #00DC82 0%, #00B86B 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(0, 220, 130, 0.3);">
                                  Reset Password
                                </a>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Alternative Link -->
                          <p style="margin: 30px 0 20px 0; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
                            Or copy and paste this link into your browser:
                          </p>
                          <p style="margin: 0 0 30px 0; font-size: 13px; line-height: 1.6; color: #00DC82; word-break: break-all; text-align: center; padding: 12px; background-color: #f8f9fa; border-radius: 6px;">
                            ${resetLink}
                          </p>
                          
                          <!-- Warning Box -->
                          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; border-radius: 6px; margin: 30px 0;">
                            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #856404;">
                              <strong>⚠️ Important:</strong> If you did not request this password reset, please ignore this email. Your password will remain unchanged and no changes will be made to your account.
                            </p>
                          </div>
                          
                          <p style="margin: 30px 0 0 0; font-size: 14px; line-height: 1.6; color: #666666;">
                            For security reasons, this link will expire in 24 hours. If you need to reset your password after that, please request a new reset link.
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                          <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666;">
                            If you have any questions or need assistance, please contact our support team.
                          </p>
                          <p style="margin: 0; font-size: 14px; color: #666666;">
                            Best regards,<br>
                            <strong style="color: #00DC82;">KeSMIS Team</strong>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `,
          // Plain text fallback
          text: `Reset Your Password - KeSMIS\n\nHello ${username},\n\nYou are receiving this because you (or someone else) have requested the reset of the password for your account.\n\nPlease click on the following link, or paste this into your browser to complete the process within 24 hours:\n\n${resetLink}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n\nBest regards,\nKeSMIS Team`
        };
        

        console.log('sending mail')

        transporter.sendMail(mailOptions, async (err, response) => {
          if (err) {
            console.error('Error sending reset password email: ', err)
            return res.status(500).send({
              message: 'Failed to send reset password email. Please try again later.',
              code: "1001"
            })
          } else {
            console.log('Reset password email sent successfully: ', response)
            
            // Send SMS notification to user's phone if available
            if (user.phone) {
              try {
                const smsMessage = `KeSMIS Password Reset\n\nHello ${username},\n\nYou requested to reset your password. Click this link to reset (expires in 24 hours):\n${resetLink}\n\nIf you didn't request this, please ignore this message.\n\nKeSMIS Team`
                await sendNotification(user.phone, smsMessage)
                console.log('Password reset SMS sent successfully to:', user.phone)
              } catch (smsError) {
                console.error('Error sending password reset SMS:', smsError)
                // Don't fail the request if SMS fails, email was already sent
              }
            } else {
              console.log('User does not have a phone number, skipping SMS notification')
            }
            
            res.status(200).send({
              message: 'Password reset instructions have been sent to your email address' + (user.phone ? ' and phone number' : '') + '.',
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

// Utility function to format session duration
function formatSessionDuration(seconds) {
  if (!seconds || seconds < 0) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

exports.signin = async (req, res) => {
  const instlog = {}
  instlog.table = 'auth'
  instlog.action = 'Login'
  instlog.date = new Date();
  instlog.loginTime = new Date(); // Store login time for session duration calculation

  // Debug: Log all relevant headers
  console.log('Request Headers:', {
    'x-forwarded-for': req.headers['x-forwarded-for'],
    'x-real-ip': req.headers['x-real-ip'],
    'cf-connecting-ip': req.headers['cf-connecting-ip'],
    'true-client-ip': req.headers['true-client-ip'],
    'x-client-ip': req.headers['x-client-ip'],
    'x-cluster-client-ip': req.headers['x-cluster-client-ip']
  });

  // Get client IP address considering various headers and proxy scenarios
  let clientIp = req.headers['x-forwarded-for']?.split(',')[0] || 
                req.headers['x-real-ip'] || 
                req.headers['cf-connecting-ip'] ||
                req.headers['true-client-ip'] ||
                req.headers['x-client-ip'] ||
                req.headers['x-cluster-client-ip'] ||
                req.connection.remoteAddress || 
                req.socket.remoteAddress || 
                req.connection.socket?.remoteAddress;

  // If we got an IPv6 localhost address, try to get the real IP
  if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
    // Try to get the real IP from other headers
    const alternativeIp = req.headers['x-forwarded-for']?.split(',')[0] ||
                         req.headers['x-real-ip'] ||
                         req.headers['cf-connecting-ip'] ||
                         req.headers['true-client-ip'];
    
    if (alternativeIp) {
      clientIp = alternativeIp;
    }
  }

  // Remove IPv6 wrapper if present
  if (clientIp && clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.substring(7);
  }

  console.log('Client IP:', clientIp);
  instlog.source = clientIp;

  console.log('Logging in:', req.body.username, req.body.email)
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
            },
            include: [
              {
                model: UserRoles,
              }
            ]
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
          message: 'Invalid Password! '
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

          // Log all successful logins (including user ID 1 for testing)
          await db.models.logs.create(instlog);
          

 

      var token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: 86400 // 24 hours
      })

      // Fetch all user_roles with location and role name
      const userRoles = await db.models.user_roles.findAll({
        where: { userid: user.id },
        include: [{ model: db.role, attributes: ['name'] }]
      });
      const formattedUserRoles = userRoles.map(ur => ({
        role: ur.role ? ur.role.name : null,
        county_id: ur.county_id,
        subcounty_id: ur.subcounty_id,
        ward_id: ur.ward_id,
        settlement_id: ur.settlement_id
      }));

      // Get authorities as before
      user.getRoles().then((roles) => {
        let authorities = [];
        for (let i = 0; i < roles.length; i++) {
          authorities.push(roles[i]);
        }
        res.status(200).send({
          id: user.id,
          username: user.username,
          phone: user.phone,
          name: user.name,
          email: user.email,
          roles: authorities,
          user_roles: formattedUserRoles,
          county_id: user.county_id,
          country_name: user.country_name || '-Not specified',
          accessToken: token,
          code: '0000',
          user: user,
          photo: user.avatar,
          avatar : user.photo ? 'data:image/png;base64,' + user.photo.toString('base64') : user.avatar,
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

exports.WardByLocationController = (req, res) => {
  var reg_model = 'ward'
  var point = req.body.MyLocation
  console.log('WardByLocationController - point:', point)
  
  // Validate MyLocation point
  if (!point || !Array.isArray(point) || point.length !== 2) {
    return res.status(400).send({ 
      message: 'MyLocation is required and must be an array with [longitude, latitude]',
      code: 'INVALID_LOCATION'
    });
  }

  const [lon, lat] = point;
  
  // Validate coordinates are numbers
  if (typeof lon !== 'number' || typeof lat !== 'number' || isNaN(lon) || isNaN(lat)) {
    return res.status(400).send({ 
      message: 'MyLocation coordinates must be valid numbers',
      code: 'INVALID_COORDINATES'
    });
  }

  // Validate coordinate ranges
  if (lat < -90 || lat > 90) {
    return res.status(400).send({ 
      message: 'Latitude must be between -90 and 90 degrees',
      code: 'INVALID_LATITUDE'
    });
  }

  if (lon < -180 || lon > 180) {
    return res.status(400).send({ 
      message: 'Longitude must be between -180 and 180 degrees',
      code: 'INVALID_LONGITUDE'
    });
  }
 
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
  
      let ward = {
        id: intersectingPolygon.id,
        name: intersectingPolygon.name,
        subcounty_id: intersectingPolygon.subcounty_id,
        county_id: intersectingPolygon.county_id,
        code: intersectingPolygon.code,
        bbox: bbox,
      };
  
      res.status(200).send([ward]);
    } else {
      // Route for handling requests when there is no intersecting polygon
      console.log('No intersecting polygon found');
      res.status(500).send({ message: 'Unable to determine your ward based on your location' });
    }
  }).catch((error) => {
    console.error('Error in WardByLocationController:', error);
    res.status(500).send({ 
      message: 'Internal server error while processing location request',
      code: 'INTERNAL_ERROR'
    });
  });
}

exports.getWardWithLocationDetails = async (req, res) => {
  try {
    const { lat, lon } = req.body;
    
    // Enhanced validation for lat/lon
    if (lat === undefined || lat === null || lat === '' || 
        lon === undefined || lon === null || lon === '') {
      return res.status(400).send({ 
        message: 'Latitude and longitude are required and cannot be empty',
        code: 'MISSING_COORDINATES'
      });
    }

    // Convert to numbers and validate they are valid numbers
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).send({ 
        message: 'Latitude and longitude must be valid numbers',
        code: 'INVALID_COORDINATES'
      });
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      return res.status(400).send({ 
        message: 'Latitude must be between -90 and 90 degrees',
        code: 'INVALID_LATITUDE'
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).send({ 
        message: 'Longitude must be between -180 and 180 degrees',
        code: 'INVALID_LONGITUDE'
      });
    }

    console.log('Searching for ward at coordinates:', latitude, longitude);

    // Use PostGIS spatial query to find the ward containing the point
    // This is much faster than looping through all wards
    const query = `
      SELECT 
        w.id as ward_id,
        w.name as ward_name,
        sc.id as subcounty_id,
        sc.name as subcounty_name,
        c.id as county_id,
        c.name as county_name
      FROM ward w
      LEFT JOIN subcounty sc ON w.subcounty_id = sc.id
      LEFT JOIN county c ON w.county_id = c.id
      WHERE ST_Contains(w.geom, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326))
      LIMIT 1
    `;

    const result = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT
    });

    if (!result || result.length === 0) {
      return res.status(404).send({ 
        message: 'No ward found for the provided coordinates',
        code: 'WARD_NOT_FOUND'
      });
    }

    const wardData = result[0];

    // Format the response
    const response = {
      ward: {
        id: wardData.ward_id,
        name: wardData.ward_name
      },
      subcounty: {
        id: wardData.subcounty_id,
        name: wardData.subcounty_name
      },
      county: {
        id: wardData.county_id,
        name: wardData.county_name
      }
    };

    res.status(200).send({
      data: response,
      code: '0000',
      message: 'Ward location details retrieved successfully'
    });

  } catch (error) {
    console.error('Error in getWardWithLocationDetails:', error);
    res.status(500).send({ 
      message: 'Internal server error while processing location request',
      code: 'INTERNAL_ERROR'
    });
  }
};

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
  console.log('settlementByCountyController', req.body);
  const reg_model = 'settlement';
  const countyId = req.body.county_id || req.body.countyId; // accept either key
  const page = parseInt(req.body.page, 10) || 1;
  const limit = parseInt(req.body.limit, 10) || 100;
  const offset = (page - 1) * limit;

  const queryOptions = {
    attributes: { exclude: ['geom'] },
    limit,
    offset,
    order: [['id', 'ASC']],
    where: {}
  };

  if (countyId) {
    queryOptions.where.county_id = countyId;
  }

  db.models[reg_model]
    .findAndCountAll(queryOptions)
    .then((list) => {
      res.status(200).send({
        data: list.rows,
        total: list.count,
        page,
        limit,
        code: '0000'
      });
    })
    .catch((error) => {
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
      organization_name: req.body.organization_name,
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
    const smsEnabled = await isAuthSMSEnabled()
    if (smsEnabled) {
      if (!req.body.phone || req.body.phone.trim() === '') {
        console.warn('[SMS Registration] No phone number provided for user registration');
      } else {
        const url = "https://quicksms.advantasms.com/api/services/sendotp/";
        let formattedPhone;
        try {
          formattedPhone = formatPhoneNumber(req.body.phone);
        } catch (error) {
          console.error(`[SMS Registration] Error formatting phone number ${req.body.phone}:`, error);
          formattedPhone = req.body.phone; // Fallback to original
        }

        const requestData = {
          apikey: '***REDACTED***',
          partnerID: '12108',
          shortcode: 'KISIP',
          message: 'Your registration code is: ' + otpCode + '.',
          mobile: formattedPhone,
        };

        console.log(`[SMS Registration] Attempting to send OTP SMS to ${formattedPhone} (original: ${req.body.phone})`);
        axios.post(url, requestData)
        .then(response => {
          console.log('[SMS Registration] OTP SMS sent successfully:', response.data);
        })
        .catch(error => {
          console.error('[SMS Registration] Error sending OTP SMS:', error.message || error);
        });
      }
    } else {
      console.log('[SMS Registration] SMS sending is disabled for auth module. Skipping OTP SMS.');
    }

    // Send response to client
    
    // Send acknowledgement email to the user
    if (user && user.email) {
      sendAcknowledgementEmail(user.email, user.name, user.username)
    }
    
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

exports.signupGRC = async (req, res) => {
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
      isactive:true,
      country_name: 'KE',
      organization_name: req.body.organization_name,
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

      

              // Check if all required fields are present or if it's a national level
        if (location_level === 'national') {
          return db.models.user_roles.update(
            {
              location_level: 'national',
              [location_field]: null, // Explicitly set to null for national level
            },
            { where: { userid: user.id, roleid: role.id } }
          );
        } else if (location_level && location_id && location_field) {
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
    const smsEnabled = await isAuthSMSEnabled()
    if (smsEnabled) {
      if (!req.body.phone || req.body.phone.trim() === '') {
        console.warn('[SMS Registration GRC] No phone number provided for user registration');
      } else {
        const url = "https://quicksms.advantasms.com/api/services/sendotp/";
        let formattedPhone;
        try {
          formattedPhone = formatPhoneNumber(req.body.phone);
        } catch (error) {
          console.error(`[SMS Registration GRC] Error formatting phone number ${req.body.phone}:`, error);
          formattedPhone = req.body.phone; // Fallback to original
        }

        const requestData = {
          apikey: '***REDACTED***',
          partnerID: '12108',
          shortcode: 'KISIP',
          //message: 'Your registration code is: ' + otpCode + '.',
         // message: 'An account has been set up for you to manage Grievances from your settlement. Please download the Slum Mapper app from the Play Store(Android or IOS) and log in using the given OTP: ' + otpCode + '.',
          message: `Hi ${name}, an account has been set up for you to manage grievances from your settlement. Please download the Slum Mapper app from the Play Store - https://play.google.com/store/apps/details?id=co.ke.ags.slum.mapper  and log in using your phone as username: ${phone} and password:${password}. A version for IOS is  available for Iphone users.`,
          mobile: formattedPhone,
        };

        console.log(`[SMS Registration GRC] Attempting to send registration SMS to ${formattedPhone} (original: ${req.body.phone})`);
        axios.post(url, requestData)
        .then(response => {
          console.log('[SMS Registration GRC] Registration SMS sent successfully:', response.data);
        })
        .catch(error => {
          console.error('[SMS Registration GRC] Error sending registration SMS:', error.message || error);
        });
      }
    } else {
      console.log('[SMS Registration GRC] SMS sending is disabled for auth module. Skipping registration SMS.');
    }

    // Send response to client
    
    // Send acknowledgement email to the user
    if (user && user.email) {
      sendAcknowledgementEmail(user.email, user.name, user.username)
    }
    
    res.send({
      message: 'User registered successfully!',
      code: '0000',
      data: otpCode,
      user:user
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
 
exports.signupGRM = async (req, res) => {
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
      isactive:true,
      country_name: 'KE',
      organization_name: req.body.organization_name,
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

      

              // Check if all required fields are present or if it's a national level
        if (location_level === 'national') {
          return db.models.user_roles.update(
            {
              location_level: 'national',
              [location_field]: null, // Explicitly set to null for national level
            },
            { where: { userid: user.id, roleid: role.id } }
          );
        } else if (location_level && location_id && location_field) {
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
    const smsEnabled = await isAuthSMSEnabled()
    if (smsEnabled) {
      if (!req.body.phone || req.body.phone.trim() === '') {
        console.warn('[SMS Registration GRM] No phone number provided for user registration');
      } else {
        const url = "https://quicksms.advantasms.com/api/services/sendotp/";
        let formattedPhone;
        try {
          formattedPhone = formatPhoneNumber(req.body.phone);
        } catch (error) {
          console.error(`[SMS Registration GRM] Error formatting phone number ${req.body.phone}:`, error);
          formattedPhone = req.body.phone; // Fallback to original
        }

        const requestData = {
          apikey: '***REDACTED***',
          partnerID: '12108',
          shortcode: 'KISIP',
          //message: 'Your registration code is: ' + otpCode + '.',
         // message: 'An account has been set up for you to manage Grievances from your settlement. Please download the Slum Mapper app from the Play Store(Android or IOS) and log in using the given OTP: ' + otpCode + '.',
          message: `Hi ${name}, an account has been set up for you to manage grievances from your component/county/settlement. Please log in  on https://kesmis.go.ke using your phone as username: ${phone} and password:${password}.`,
          mobile: formattedPhone,
        };

        console.log(`[SMS Registration GRM] Attempting to send registration SMS to ${formattedPhone} (original: ${req.body.phone})`);
        axios.post(url, requestData)
        .then(response => {
          console.log('[SMS Registration GRM] Registration SMS sent successfully:', response.data);
        })
        .catch(error => {
          console.error('[SMS Registration GRM] Error sending registration SMS:', error.message || error);
        });
      }
    } else {
      console.log('[SMS Registration GRM] SMS sending is disabled for auth module. Skipping registration SMS.');
    }

    // Send response to client
    
    // Send acknowledgement email to the user
    if (user && user.email) {
      sendAcknowledgementEmail(user.email, user.name, user.username)
    }
    
    res.send({
      message: 'User registered successfully!',
      code: '0000',
      data: otpCode,
      user:user
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
  instlog.loginTime = new Date(); // Store login time for session duration calculation
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
      const smsEnabled = await isAuthSMSEnabled()
      if (smsEnabled) {
        const url = "https://quicksms.advantasms.com/api/services/sendotp/";
        const requestData = {
          apikey: '***REDACTED***',
          partnerID: '12108',
          shortcode: 'KISIP',
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
            //data: otpCode,
          });

        })
        .catch(error => {
          console.error('Error:', error);
          let msg = error.response && error.response.data && error.response.data.message ? error.response.data.message : "Our SMS service provider is down. Please try again later";
          res.status(500).send({ message:msg})
        });
      } else {
        // SMS is disabled, still return OTP code but inform user
        res.send({
          message: 'SMS notifications are currently disabled. Please login using username and password.',
          code: '9999',
          //data: otpCode,
        });
      }
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
      include: [
        {
          model: UserRoles,
        }
      ],
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
    
    // Create login log for successful OTP verification
    const loginLog = {
      table: 'auth',
      action: 'Login',
      date: new Date(),
      userId: user.id,
      userName: user.username,
      status: 'Successful',
      source: req.headers['x-forwarded-for']?.split(',')[0] || 
              req.headers['x-real-ip'] || 
              req.connection.remoteAddress || 
              'Unknown',
      loginTime: new Date()
    };
    
    await db.models.logs.create(loginLog);
    console.log(`User ${user.username} (ID: ${user.id}) logged in via OTP`);
    
    const expiryDate = new Date();
    // Add 24 hours to the current date
    expiryDate.setHours(expiryDate.getHours() + 24);


    // Fetch all user_roles with location and role name (same as web signin)
    const userRoles = await db.models.user_roles.findAll({
      where: { userid: user.id },
      include: [{ model: db.role, attributes: ['name'] }]
    });
    const formattedUserRoles = userRoles.map(ur => ({
      role: ur.role ? ur.role.name : null,
      county_id: ur.county_id,
      subcounty_id: ur.subcounty_id,
      ward_id: ur.ward_id,
      settlement_id: ur.settlement_id
    }));

    // Get authorities as before (same as web signin)
    user.getRoles().then((roles) => {
      let authorities = [];
      for (let i = 0; i < roles.length; i++) {
        authorities.push(roles[i]);
      }

      const expiryDate = new Date();
      // Add 24 hours to the current date
      expiryDate.setHours(expiryDate.getHours() + 24);

      console.log('Logged User:', user)
      res.status(200).send({
        id: user.id,
        username: user.username,
        phone: user.phone,
        name: user.name,
        email: user.email,
        roles: authorities,
        user_roles: formattedUserRoles,
        county_id: user.county_id,
        country_name: user.country_name || 'Kenya',
        accessToken: token,
        tokenExpiryDate: expiryDate,
        code: '0000',
        user: user,
        photo: user.avatar,
        avatar : user.photo ? 'data:image/png;base64,' + user.photo.toString('base64') : user.avatar,
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


// Function to send acknowledgement email to user after successful registration
async function sendAcknowledgementEmail(userEmail, userName, username) {
  try {
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'kisip.mis@gmail.com',
        pass: 'ycoxaqavmfiqljjg'
      }
    });

    const mailOptions = {
      from: 'kisip.mis@gmail.com',
      to: userEmail,
      subject: 'Welcome to KeSMIS - Registration Successful',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <h2 style="color: #28a745; margin-bottom: 20px;">🎉 Registration Successful!</h2>
            <p style="font-size: 16px; color: #333; margin-bottom: 15px;">
              Dear <strong>${userName}</strong>,
            </p>
            <p style="font-size: 16px; color: #333; margin-bottom: 15px;">
              Thank you for registering with KeSMIS. Your account has been created successfully with the username: <strong>${username}</strong>
            </p>
            <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #495057;">
                <strong>Important:</strong> Your account is currently pending approval. You will receive a notification once your account is activated by an administrator.
              </p>
            </div>
            <p style="font-size: 16px; color: #333; margin-bottom: 15px;">
              If you have any questions or need assistance, please contact our support team.
            </p>
            <p style="font-size: 16px; color: #333; margin-bottom: 15px;">
              Best regards,<br>
              <strong>KeSMIS Team</strong>
            </p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Acknowledgement email sent successfully to:', userEmail);
    return result;
  } catch (error) {
    console.error('Error sending acknowledgement email to:', userEmail, error);
    // Don't throw error - we don't want to fail registration if email fails
    return null;
  }
}

function getFrontendBaseUrl(preferredUrl) {
  const base =
    process.env.FRONTEND_URL ||
    process.env.APP_HOST ||
    process.env.VITE_APP_HOST ||
    preferredUrl ||
    'https://kesmis.go.ke';

  return base.endsWith('/') ? base.slice(0, -1) : base;
}

// Function to send activation email to user
async function sendActivationEmail(userEmail, userName, username, baseUrl) {
  try {
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'kisip.mis@gmail.com',
        pass: 'ycoxaqavmfiqljjg'
      }
    });

    const mailOptions = {
      from: 'kisip.mis@gmail.com',
      to: userEmail,
      subject: 'Account Activated - Welcome to KeSMIS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #c3e6cb;">
            <h2 style="color: #155724; margin: 0 0 20px 0;">🎉 Account Activated Successfully!</h2>
            <p style="color: #155724; font-size: 16px; margin: 0;">
              Dear <strong>${userName}</strong>, your KeSMIS account has been activated!
            </p>
          </div>
          
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin-top: 20px; border: 1px solid #dee2e6;">
            <h3 style="color: #333; margin-top: 0;">Account Details:</h3>
            <ul style="color: #555; line-height: 1.6;">
              <li><strong>Username:</strong> ${username}</li>
              <li><strong>Status:</strong> Active</li>
              <li><strong>Access:</strong> Full system access granted</li>
            </ul>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-top: 20px;">
              <p style="color: #6c757d; margin: 0; font-size: 14px;">
                <strong>Next Steps:</strong><br>
                • You can now log in to your account<br>
                • Access all available features and modules<br>
                • Contact support if you need assistance
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 25px;">
              <a href="${getFrontendBaseUrl(baseUrl)}/login" 
                 style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Login to Your Account
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>If you have any questions, please contact the system administrator.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Activation email sent successfully to:', userEmail);
    return info;
  } catch (error) {
    console.error('Error sending activation email to', userEmail, ':', error);
    throw error;
  }
}

// Function to send deactivation email to user
async function sendDeactivationEmail(userEmail, userName, username) {
  try {
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'kisip.mis@gmail.com',
        pass: 'ycoxaqavmfiqljjg'
      }
    });

    const mailOptions = {
      from: 'kisip.mis@gmail.com',
      to: userEmail,
      subject: 'Account Deactivated - KeSMIS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #f5c6cb;">
            <h2 style="color: #721c24; margin: 0 0 20px 0;">⚠️ Account Deactivated</h2>
            <p style="color: #721c24; font-size: 16px; margin: 0;">
              Dear <strong>${userName}</strong>, your KeSMIS account has been deactivated.
            </p>
          </div>
          
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin-top: 20px; border: 1px solid #dee2e6;">
            <h3 style="color: #333; margin-top: 0;">Account Status:</h3>
            <ul style="color: #555; line-height: 1.6;">
              <li><strong>Username:</strong> ${username}</li>
              <li><strong>Status:</strong> Inactive</li>
              <li><strong>Access:</strong> System access temporarily suspended</li>
            </ul>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; margin-top: 20px;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>What this means:</strong><br>
                • You cannot log in to your account<br>
                • All system access is temporarily suspended<br>
                • Your data remains secure and intact
              </p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-top: 20px;">
              <p style="color: #6c757d; margin: 0; font-size: 14px;">
                <strong>To reactivate your account:</strong><br>
                • Contact your system administrator<br>
                • Provide a valid reason for reactivation<br>
                • Wait for approval and reactivation
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>If you believe this was done in error, please contact the system administrator immediately.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Deactivation email sent successfully to:', userEmail);
    return info;
  } catch (error) {
    console.error('Error sending deactivation email to', userEmail, ':', error);
    throw error;
  }
}




exports.Logout = async (req, res) => {
  console.log('logging off >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
  
  try {
    // Get user ID from token (set by authJwt.verifyToken middleware)
    const userId = req.body.userId;
    console.log('Logout - User ID from token:', userId);
    
    if (userId) {
      const sessionTracker = require('../utils/sessionTracker');
      
      // Get user info from database
      const user = await db.models.users.findByPk(userId);
      const userName = user ? user.username : 'Unknown';
      console.log('Logout - User info:', { userId, userName });
      
      const source = req.headers['x-forwarded-for']?.split(',')[0] || 
                    req.headers['x-real-ip'] || 
                    req.connection.remoteAddress || 
                    'Unknown';
      
      console.log('Logout - Creating logout log...');
      const result = await sessionTracker.createLogoutLog({
        userId: userId,
        userName: userName,
        source: source
      });
      
      if (result) {
        console.log(`User ${userName} (ID: ${userId}) logged out successfully with session tracking`);
      } else {
        console.log(`User ${userName} (ID: ${userId}) logged out but session tracking failed`);
      }
    } else {
      console.log('No user ID found in request - logout without session tracking');
    }
  } catch (error) {
    console.error('Error logging logout:', error);
    console.error('Error stack:', error.stack);
    // Don't fail the logout if logging fails
  }

  res.status(200).send({
    code: '0000',
    status: 'Logged out'
  })
}




module.exports = exports;
 