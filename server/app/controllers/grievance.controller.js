const path = require('path')
const shortid = require('shortid')
const fs = require('fs');
const db = require('../models')
const Sequelize = require('sequelize')
 const moment = require('moment');
 const User = db.user
 const Grievance = db.models.grievance
 const UserRoles = db.models.user_roles
 const Users = db.models.users
 const Settlement = db.models.settlement

 const axios = require('axios') ;
 const Role = db.role
 const { Op, literal } = require('sequelize');
 const cron = require('node-cron'); // Scheduler
 const { isGrievanceSMSEnabled, getGrievanceSMSStatus } = require('../utils/smsSettings')
 const { getActiveRolesGetOptions } = require('../utils/userRoleExpiry')

const SMS_ERROR_CODES = {
  200:  'Successful',
  1001: 'Invalid sender ID',
  1002: 'Network not allowed',
  1003: 'Invalid mobile number',
  1004: 'Low bulk credits',
  1005: 'Failed – system error',
  1006: 'Invalid credentials',
  1007: 'Failed – system error',
  1008: 'No delivery report',
  1009: 'Unsupported data type',
  1010: 'Unsupported request type',
  4090: 'Internal error – try again after 5 minutes',
  4091: 'No Partner ID set',
  4092: 'No API key provided',
  4093: 'Details not found',
}

function parseSmsResponse(response) {
  const resp = response?.data?.responses?.[0]
  if (!resp) return { success: false, statusText: 'Fail – no response from SMS gateway' }
  const code = Number(resp['response-code'])
  const description = resp['response-description'] || ''
  if (code === 200 || description === 'Success') return { success: true, statusText: 'Success' }
  const mapped = SMS_ERROR_CODES[code]
  const reason = mapped ? `${mapped} (code ${code})` : (description || `Unknown error (code ${code})`)
  return { success: false, statusText: `Fail – ${reason}` }
}

function parseSmsAxiosError(error) {
  const status = error?.response?.status
  const data = error?.response?.data
  if (status) return `Fail – HTTP ${status}: ${JSON.stringify(data) || 'SMS gateway error'}`
  if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') return 'Fail – SMS gateway unreachable'
  if (error?.code === 'ETIMEDOUT') return 'Fail – SMS gateway timeout'
  return `Fail – ${error?.message || 'Unknown network error'}`
}


 var bcrypt = require('bcryptjs')
const crypto = require('crypto');


const op = Sequelize.Op 

const GRIEVANCE_ATTRIBUTE_EXCLUDE = new Set([
  'latitude',
  'longitude',
  'coordinates',
  'geom',
  'subcounty',
  'ward',
  'users'
])

const getSanitizedGrievanceAttributes = () =>
  Object.keys(db.models.grievance.rawAttributes).filter(
    (attr) => !GRIEVANCE_ATTRIBUTE_EXCLUDE.has(attr.toLowerCase())
  )

const userHasRole = async (userInstance, roleName) => {
  if (!userInstance || typeof userInstance.getRoles !== 'function') {
    return false
  }
  const roles = await userInstance.getRoles(getActiveRolesGetOptions())
  return roles.some(role => role.name === roleName)
}

const isRootAdminUser = async (userInstance) => userHasRole(userInstance, 'root_admin')


exports.generateGRMCode = async (req, res) => {
  try {
    // Define the prefix and get the current year
    const prefix = 'GRM';
    const currentYear = moment().format('YYYY');

    // Fetch the latest feedback code from the database
    const latestGrievance= await db.models.grievance.findOne({
      attributes: ['code'],
      order: [['createdAt', 'DESC']]
    });

    let newCode = `${prefix}-${currentYear}-0001`; // Default code if no previous code found

    if (latestGrievance) {
      const lastCode = latestGrievance.code;
      const lastYear = lastCode.substring(4, 8);
      const lastSequence = parseInt(lastCode.substring(9), 10);

      // Check if the last code is from the current year
      if (lastYear === currentYear) {
        // Increment the sequence number
        const newSequence = lastSequence + 1;
        newCode = `${prefix}-${currentYear}-${String(newSequence).padStart(4, '0')}`;
      }
    }

    // Send the generated code
    res.status(200).send({
      data: newCode,
     // code: '0000',
      message: 'Code generated successfully.'
    });
  } catch (error) {
    console.error('Error generating grievance code:', error);
    res.status(500).send({
      code: '9999',
      message: 'An error occurred while generating the grievance code.'
    });
  }
};

 
// Helper function to determine grievance level
function getGrievanceLevel(grievance) {
  // Check if location_level is explicitly set
  if (grievance.location_level === 'national') {
    return 'national'
  }
  // If it has county_id or settlement_id, it's county level
  if (grievance.county_id || grievance.settlement_id) {
    return 'county'
  }
  // Default to county for backward compatibility
  return 'county'
}

async function sendNotificationSMS(sms_obj) {
  // Determine the level from the grievance data
  // If sms_obj has grievance data, use it; otherwise fetch it
  let level = 'county' // default
  let grievanceExists = false
  if (sms_obj.grievance_id) {
    try {
      const grievance = await db.models.grievance.findByPk(sms_obj.grievance_id, {
        attributes: ['location_level', 'county_id', 'settlement_id']
      })
      if (grievance) {
        grievanceExists = true
        level = getGrievanceLevel(grievance)
        console.log(`[SMS] Grievance ${sms_obj.grievance_id} level determined: ${level}`, {
          location_level: grievance.location_level,
          county_id: grievance.county_id,
          settlement_id: grievance.settlement_id
        })
      } else {
        console.log(`[SMS] Grievance ${sms_obj.grievance_id} not found, using default level: county`)
      }
    } catch (error) {
      console.error('Error determining grievance level:', error)
      // Default to county on error
    }
  } else if (sms_obj.location_level || sms_obj.county_id || sms_obj.settlement_id) {
    // If level info is directly in sms_obj
    level = getGrievanceLevel(sms_obj)
    console.log(`[SMS] Level determined from sms_obj: ${level}`, {
      location_level: sms_obj.location_level,
      county_id: sms_obj.county_id,
      settlement_id: sms_obj.settlement_id
    })
  } else {
    console.log(`[SMS] No level info found, using default: county`)
  }
  
  // Check if SMS is enabled for grievance module at the determined level
  const smsStatus = await getGrievanceSMSStatus(level)
  console.log(`[SMS] Grievance SMS status for ${level} level:`, { enabled: smsStatus.enabled, module: level === 'national' ? 'sms_grievance_national' : 'sms_grievance_county' })
  
  const notification ={}
  notification.grievance_id = sms_obj.grievance_id
  notification.recipient = sms_obj.phone
  notification.message =  sms_obj.grv_code + ": " + sms_obj.message
  notification.medium = 'SMS'
  notification.type = sms_obj.type?  sms_obj.type: 'Acknowledgement'
  notification.code = shortid.generate()
  notification.sender_id = sms_obj.sender_id
  notification.status = sms_obj.status

  const persistNotification = async () => {
    try {
      await db.models.grievance_notification.create(notification)
    } catch (err) {
      // If grievance was deleted between lookup and insert, retry without grievance_id
      const fkViolation = err && err.original && err.original.code === '23503'
      if (fkViolation && notification.grievance_id) {
        notification.grievance_id = null
        await db.models.grievance_notification.create(notification)
        return
      }
      throw err
    }
  }

  if (!smsStatus.enabled) {
    console.log('SMS sending is disabled for grievance module. Logging notification as disabled.')
    const disabledByUser = smsStatus.disabledBy
    const disabledByName = disabledByUser?.name || disabledByUser?.username || 'system administrator'
    notification.status = `Disabled. Message sending was disabled by ${disabledByName}`
    await persistNotification()
    return
  }

  // Send OTP via Leopard (not implemented in this code snippet)

  console.log('------------',sms_obj)
  const url = "https://quicksms.advantasms.com/api/services/sendotp/";
  
  const requestData = {
    apikey: process.env.SMS_API_KEY,
    partnerID: process.env.SMS_PARTNER_ID || '12108',
    shortcode: process.env.SMS_SHORTCODE || 'KISIP',
    message: sms_obj.grv_code + ":" +sms_obj.message,
    mobile: sms_obj.phone,
  };

  console.log('notification ----------?>',notification)

  axios
    .post(url, requestData)
    .then((response) => {
      const { success, statusText } = parseSmsResponse(response)
      console.log('[SMS] sendNotificationSMS response:', response.data?.responses?.[0])
      notification.status = statusText
      persistNotification().catch((error) => console.error('Failed to save grievance notification:', error))
    })
    .catch((error) => {
      notification.status = parseSmsAxiosError(error)
      console.error('[SMS] sendNotificationSMS error:', error?.code || error?.message)
      persistNotification().catch((saveError) => console.error('Failed to save grievance notification:', saveError))
    });
}

async function sendCreateSMS(sms_obj,serverUrl) {
  // Determine the level from the grievance data
  const level = getGrievanceLevel(sms_obj)
  console.log(`[SMS] Create SMS - Grievance level determined: ${level}`, {
    location_level: sms_obj.location_level,
    county_id: sms_obj.county_id,
    settlement_id: sms_obj.settlement_id,
    grievance_id: sms_obj.id
  })
  
  // Check if SMS is enabled for grievance module at the determined level
  const smsStatus = await getGrievanceSMSStatus(level)
  console.log(`[SMS] Create SMS - Grievance SMS status for ${level} level:`, { enabled: smsStatus.enabled, module: level === 'national' ? 'sms_grievance_national' : 'sms_grievance_county' })
  
  // Generate QR code as a data URI
  const status_url = serverUrl +'/#/status/'+sms_obj.id
  console.log('Status URL:', status_url)

  let msg =
    "Dear " +
    sms_obj.name +
    ", your grievance has been registered. Your reference is : " +
    sms_obj.code + ". You can monitor the status of your report here -> " + status_url

  const notification ={}
  notification.grievance_id = sms_obj.id
  notification.recipient = sms_obj.phone
  notification.message = msg
  notification.medium = 'SMS'
  notification.type = 'Notification'
  notification.code = shortid.generate()
 // notification.sender_id = 0  /// remember to change
  
  if (!smsStatus.enabled) {
    console.log('SMS sending is disabled for grievance module. Logging notification as disabled.')
    const disabledByUser = smsStatus.disabledBy
    const disabledByName = disabledByUser?.name || disabledByUser?.username || 'system administrator'
    notification.status = `Disabled. Message sending was disabled by ${disabledByName}`
    await db.models.grievance_notification.create(notification)
    return
  }

  // Send OTP via Leopard (not implemented in this code snippet)
  const url = "https://quicksms.advantasms.com/api/services/sendotp/";

  const requestData = {
    apikey: process.env.SMS_API_KEY,
    partnerID: process.env.SMS_PARTNER_ID || '12108',
    shortcode: process.env.SMS_SHORTCODE || 'KISIP',
    message: msg,
    mobile: sms_obj.phone,
  };

  axios
    .post(url, requestData)
    .then((response) => {
      const { success, statusText } = parseSmsResponse(response)
      console.log('[SMS] sendCreateSMS response:', response.data?.responses?.[0])
      notification.status = statusText
      db.models.grievance_notification.create(notification).catch((err) => console.error('Failed to save create notification:', err));
    })
    .catch((error) => {
      notification.status = parseSmsAxiosError(error)
      console.error('[SMS] sendCreateSMS error:', error?.code || error?.message)
      db.models.grievance_notification.create(notification).catch((err) => console.error('Failed to save create notification:', err));
    });
}



const generateGRMCode = async () => {
  const prefix = 'GRM';
  const currentYear = moment().format('YYYY');

  // Fetch the latest grievance code from the database
  const latestGrievance = await db.models.grievance.findOne({
    attributes: ['code'],
    order: [['createdAt', 'DESC']]
  });

  let newCode = `${prefix}-${currentYear}-0001`; // Default code if no previous code found

  if (latestGrievance) {
    const lastCode = latestGrievance.code;
    const lastYear = lastCode.substring(4, 8);
    const lastSequence = parseInt(lastCode.substring(9), 10);

    // Check if the last code is from the current year
    if (lastYear === currentYear) {
      // Increment the sequence number
      const newSequence = lastSequence + 1;
      newCode = `${prefix}-${currentYear}-${String(newSequence).padStart(4, '0')}`;
    }
  }

  return newCode;
};


exports.createGrievanceRecord = async (req, res) => {
  try {
    // Generate the GRM code before creating the record
    const generatedCode = await generateGRMCode();

    // Prepare the object for creation
    let obj = req.body;

    let name = req.body.name;
    let national_id = req.body.national_id;
    
    // Encrypt the fields
    obj.name = Sequelize.fn('PGP_SYM_ENCRYPT', name, process.env.AES_KEY);
    obj.national_id = Sequelize.fn('PGP_SYM_ENCRYPT', national_id, process.env.AES_KEY);

    obj.code = generatedCode; // Assign the generated code

    console.log('Grievance record to be created:', obj);

    // Create the record
    const item = await db.models.grievance.create(obj);

    console.log('Created item:', item);

    // Decrypt the fields after creation
    const decryptedName = await db.sequelize.query(
      `SELECT PGP_SYM_DECRYPT(name::bytea, '${process.env.AES_KEY}') AS name FROM grievance WHERE id = :id`,
      {
        replacements: { id: item.id },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    const decryptedNationalId = await db.sequelize.query(
      `SELECT PGP_SYM_DECRYPT(national_id::bytea, '${process.env.AES_KEY}') AS national_id FROM grievance WHERE id = :id`,
      {
        replacements: { id: item.id },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    // Add the decrypted values to the response object
    item.name = decryptedName[0].name;
    item.national_id = decryptedNationalId[0].national_id;

    const serverUrl = `${req.protocol}://${req.get('host')}`;

    sendCreateSMS(item,serverUrl);

    // Log creation is handled elsewhere - do not create duplicate log here
    let reportedLogId = null;

    let grm_officials=[]
    let grm_officials_names=[]
    
    // query for all users  with 
      await Users.findAll({
        include: [
          {
            model: UserRoles,
             // here get the Super Admin Roles only 
            where: {
              roleid: 4,  // GRM
              [op.or]: [
                { settlement_id: obj.settlement_id.toString() },     // Settlement ID match
                {  county_id: obj.county_id.toString()},              // Super Admin role
                {  location_level: 'national'},              // Super Admin role

              ]
            }

          }
        ]
      }).then(grms => {
        // handle the results
        grms.forEach(grm => {
          if (grm.name) { // Push only if name is not null or undefined
            grm_officials_names.push(grm.name);
          }
        
          if (grm.phone) { // Push only if phone is not null or undefined
            const statusUrl = `${serverUrl}/#/status/${item.id}`;
            let msg = 'A new grievance has been reported. Please review for your action. Reference: ' + generatedCode + '. Track status here -> ' + statusUrl
           // grm_officials.push(grm.phone);
            let msg_obj={} 
            msg_obj.message = msg 
            msg_obj.phone=grm.phone
            msg_obj.grievance_id = item.id
            msg_obj.grv_code = item.code 
            msg_obj.status = item.status 


            // for each number send a notification SMS
            sendNotificationSMS(msg_obj)


          }
        });
        
 
        console.log('grm_officials_names',grm_officials_names,grm_officials)

      }).catch(error => {
        // handle the error
        console.log('Fail:',error)
      });


 

 

      /// Select attribites ti include 
      var attributes = []

      for( let key in   db.models.grievance.rawAttributes ){
        attributes.push(key)
      }

      var index = attributes.indexOf('name');
      if (index !== -1) {
          attributes.splice(index, 1);
      }

      let encrytpedField = [Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.name'), 'bytea'),process.env.AES_KEY),'name']
        attributes.push(encrytpedField)



  // Fetch the newly created item along with its associations and decrypted name
  const itemWithAssociations = await db.models.grievance.findOne({
    where: { id: item.id },
    attributes: attributes,
    include: [
      { model: db.models.county },
      { model: db.models.subcounty },
      { model: db.models.ward },
      { model: db.models.settlement },
      // Include any other associations here
    ],
  });


    res.status(200).send({
      data: itemWithAssociations,
      log_id: reportedLogId, // Include the log ID for frontend use
      code: '0000',
      message: 'Grievance reported successfully.'
    });

  } catch (err) {
    // Handle specific duplicate key error
    if (err.code === '23505') {
      console.log('Duplicate key error:', err.detail);

      // Return a custom message for the duplicate key error
      return res.status(400).send({
        code: '23505',
        message: 'A grievance with the same name, ward, sub-county, and county already exists. Please use a different name or location.'
      });
    }

    // Handle other errors
    console.log('Error:', err);
    const message = err.message || 'An error occurred';
    let msg;
    if (message == 'Validation error') {
      msg = "Duplicate Grievances are not allowed";
    } else {
      msg = message;
    }
    res.status(500).send({ message: msg });
  }
};


exports.createGrievanceBatchRecords = async (req, res) => {
  try {
    const grievances = req.body.data;
    const grievancePromises = grievances.map(async (grievance) => {
      const generatedCode = await generateGRMCode();
      
      // Prepare and encrypt fields
      let obj = grievance;
      obj.name = Sequelize.fn('PGP_SYM_ENCRYPT', grievance.name, process.env.AES_KEY);
       obj.national_id = Sequelize.fn('PGP_SYM_ENCRYPT', grievance.national_id, process.env.AES_KEY);
      //obj.national_id =   grievance.national_id;

      
      obj.code = generatedCode;

      // Create grievance record
      const item = await db.models.grievance.create(obj);
      
      // Decrypt fields (optional, if needed)
      const decryptedName = await db.sequelize.query(
        `SELECT PGP_SYM_DECRYPT(name::bytea, '${process.env.AES_KEY}') AS name FROM grievance WHERE id = :id`,
        { replacements: { id: item.id }, type: Sequelize.QueryTypes.SELECT }
      );
      item.name = decryptedName[0].name;





      // Add the decrypted values to the response object
      item.name = decryptedName[0].name;
      item.national_id = obj.national_id;

      const serverUrl = `${req.protocol}://${req.get('host')}`;

      sendCreateSMS(item,serverUrl);

      // Create a log entry for the reported grievance
      try {
        const description = grievance.description || item.description || '';
        const actionMessage = description 
          ? `Grievance reported: ${description.length > 100 ? description.substring(0, 100) + '...' : description}` 
          : `New grievance registered with code ${generatedCode}`;
        
        const reportedLog = {
          grievance_id: item.id,
          action_type: 'Reported',
          action_by: req.thisUser ? req.thisUser.id : null,
          date_actioned: item.date_reported || new Date(),
          current_level: 'settlement',
          prev_status: 'Open',
          new_status: item.status || 'Open',
          action: actionMessage,
          action_level: 'settlement',
        };
        await logGrievanceAction(reportedLog);
      } catch (logErr) {
        console.log('Warning: Failed to create reported log for grievance ID:', item.id, logErr.message);
      }

      let grm_officials=[]
      let grm_officials_names=[]
      
      // query for all users  with 
        await Users.findAll({
          include: [
            {
              model: UserRoles,
               // here get the Super Admin Roles only 
              where: {
                roleid: 4,  // GRM
                [op.or]: [
                  { settlement_id: obj.settlement_id.toString() },     // Settlement ID match
                  {  county_id: obj.county_id.toString()},              // Super Admin role
                  {  location_level: 'national'},              // Super Admin role
  
                ]
              }
  
            }
          ]
        }).then(grms => {
          // handle the results
          grms.forEach(grm => {
            if (grm.name) { // Push only if name is not null or undefined
              grm_officials_names.push(grm.name);
            }
          
            if (grm.phone) { // Push only if phone is not null or undefined
  
              const statusUrl = `${serverUrl}/#/status/${item.id}`;
              let msg = 'A new grievance has been reported. Please review for your action. Reference: ' + generatedCode + '. Track status here -> ' + statusUrl
             // grm_officials.push(grm.phone);
              let msg_obj={} 
              msg_obj.message = msg 
              msg_obj.phone=grm.phone
              msg_obj.grievance_id = item.id
              msg_obj.grv_code = item.code 
              msg_obj.status = item.status 
  
  
              // for each number send a notification SMS
              sendNotificationSMS(msg_obj)
  
  
            }
          });
          
   
          console.log('grm_officials_names',grm_officials_names,grm_officials)
  
        }).catch(error => {
          // handle the error
          console.log('Fail:',error)
        });
  
  
   












      return item;
    });

    // Wait for all grievance records to be created
    const createdItems = await Promise.all(grievancePromises);

    res.status(200).send({
      data: createdItems,
      code: '0000',
      message: 'Grievances reported successfully.'
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send({ message: err.message || 'An error occurred' });
  }
};


exports.logGrievanceAction = async (req, res) => {
  try {
  
    // Prepare the object for creation
    let obj = req.body;

    console.log('Log>>', obj)

    // Ensure action field is set - if missing, provide a default based on action_type
    if (!obj.action || obj.action === null || obj.action === '') {
      const actionType = obj.action_type || 'Action';
      if (actionType === 'Reported') {
        // For Reported actions, try to get description from grievance if available
        if (obj.grievance_id) {
          try {
            const grievance = await db.models.grievance.findByPk(obj.grievance_id);
            if (grievance && grievance.description) {
              const description = grievance.description.length > 100 
                ? grievance.description.substring(0, 100) + '...' 
                : grievance.description;
              obj.action = `Grievance reported: ${description}`;
            } else {
              obj.action = `New grievance registered with code ${grievance?.code || ''}`;
            }
          } catch (grievanceErr) {
            obj.action = `Grievance reported`;
          }
        } else {
          obj.action = `Grievance reported`;
        }
      } else {
        obj.action = `${actionType} action performed`;
      }
    }

       // Create the record
    const item = await db.models.grievance_log.create(obj);

    console.log('Created log:', item);

    res.status(200).send({
      data: item,
      code: '0000',
      message: 'Action Logged successfully.'
    });

  } catch (err) {
   
    console.log(err)
    res.status(500).send({ message: 'Logging action failed' });
  }
};
 
 


 exports.bulkLogGrievanceActions = async (req, res) => {
  try {
    let logs = req.body.logs;

    // If logs is not an array, convert it to an array
    if (!Array.isArray(logs)) {
      logs = [logs];
    }

    // Check if logs array is empty
    if (logs.length === 0) {
      return res.status(400).send({
        code: '1001',
        message: 'An array of grievance action logs is required',
      });
    }

    console.log('Logs to insert >>', logs);

    const createdLogs = await db.models.grievance_log.bulkCreate(logs, {
      validate: true,
      returning: true,
    });

    console.log('Created logs:', createdLogs);

    res.status(200).send({
      data: createdLogs,
      code: '0000',
      message: `${createdLogs.length} grievance action(s) logged successfully.`,
    });

  } catch (err) {
    console.error('Error logging grievance actions:', err);
    res.status(500).send({
      code: '9999',
      message: 'Bulk logging failed. Please try again.',
    });
  }
};


 


exports.getGrievances = async (req, res) => {
  const user = req.thisUser;
  const currentUserRoles = await user.getRoles(getActiveRolesGetOptions());

  const searchString = req.body.searchString;
  const selectedCounty = req.body.selectedCounty;
  const filters = req.body.filters || [];
  const filterValues = req.body.filterValues || [];
  const filterFunctions = req.body.filterFunctions || [];
  const locationFilter = req.body.locationFilter || null;

  let limit = req.body.limit || 10;
  let page = req.body.page || 1;

  console.log('filters  start:', filters);
  console.log('filterValues:', filterValues);
  console.log('filterFunctions:', filterFunctions);

  const findAndCountOptions = {
    where: {},
    limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']],
    distinct: true,
  };

  const baseAttributes = getSanitizedGrievanceAttributes();
  const attributes = [...baseAttributes];

  // Role checks
  const hasSuperAdminRole = currentUserRoles.some(role => ['super_admin', 'root_admin'].includes(role.name));
  const hasGRMRole = currentUserRoles.some(role => role.name === 'grm' || role.name === 'gbv' || role.name === 'admin' || role.name === 'staff');
  const hasNationalRole = currentUserRoles.some(role => role.user_roles.location_level === 'national');
  const countyRoleIds = [...new Set(
    currentUserRoles
      .filter(role => role.user_roles.location_level === 'county' && role.user_roles.county_id !== null && role.user_roles.county_id !== undefined)
      .map(role => role.user_roles.county_id)
  )];
  const settlementGCRRole = currentUserRoles.find(role => role.user_roles.location_level === 'settlement');

  // Decrypt name and national_id
  const decryptedName = hasSuperAdminRole
    ? [Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.name'), 'bytea'), process.env.AES_KEY), 'name']
    : [
        Sequelize.literal(`
          CASE 
            WHEN "grievance"."isgbv" = false AND "grievance"."name" IS NOT NULL THEN 
              PGP_SYM_DECRYPT(CAST("grievance"."name" AS bytea), '${process.env.AES_KEY}')
            ELSE 
              '[REDACTED]'
          END
        `),
        'name'
      ];

  const decryptedNationalId = hasSuperAdminRole
    ? [Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.national_id'), 'bytea'), process.env.AES_KEY), 'national_id']
    : [
        Sequelize.literal(`
          CASE 
            WHEN "grievance"."isgbv" = false AND "grievance"."national_id" IS NOT NULL THEN 
              PGP_SYM_DECRYPT(CAST("grievance"."national_id" AS bytea), '${process.env.AES_KEY}')
            ELSE 
              '[REDACTED]'
          END
        `),
        'national_id'
      ];

  attributes.push(decryptedName, decryptedNationalId);
  findAndCountOptions.attributes = attributes;

  // Unauthorized users
  if (!hasGRMRole && !hasSuperAdminRole) {
    return res.status(200).send({
      data: [],
      total: 0,
      code: '9999',
      message: 'Unauthorized access to grievances denied',
    });
  }

  const normalizeToArray = (rawValue) => {
    if (Array.isArray(rawValue)) return rawValue.filter(v => v !== null && v !== undefined && v !== '');
    if (rawValue === null || rawValue === undefined || rawValue === '') return [];
    return [rawValue];
  };

  // Role-based filtering if not super admin or national (supports users assigned to multiple counties)
  if (!hasSuperAdminRole && !hasNationalRole && countyRoleIds.length > 0) {
    findAndCountOptions.where.county_id = { [op.in]: countyRoleIds };
    console.log('Applying county filters from role:', countyRoleIds);
  }

  // Apply selectedCounty if defined; keep it within role-assigned counties when applicable.
  if (selectedCounty && !settlementGCRRole) {
    const selectedCountyValues = normalizeToArray(selectedCounty);
    if (selectedCountyValues.length > 0) {
      if (!hasSuperAdminRole && !hasNationalRole && countyRoleIds.length > 0) {
        const allowedSelected = selectedCountyValues.filter(v => countyRoleIds.includes(v));
        if (allowedSelected.length > 0) {
          findAndCountOptions.where.county_id = { [op.in]: allowedSelected };
          console.log('Applying selectedCounty within role scope:', allowedSelected);
        } else {
          // Keep role scope filter if selected county is outside allowed scope.
          findAndCountOptions.where.county_id = { [op.in]: countyRoleIds };
        }
      } else {
        findAndCountOptions.where.county_id =
          selectedCountyValues.length > 1 ? { [op.in]: selectedCountyValues } : selectedCountyValues[0];
        console.log('Applying selectedCounty filter:', selectedCountyValues);
      }
    }
  }

  // Search filter
  if (searchString) {
    findAndCountOptions.where.name = { [op.iLike]: `%${searchString}%` };
  }

  // Additional filters
  filters.forEach((filter, index) => {
    const normalizedFilter = typeof filter === 'string' ? filter.trim() : filter;
    if (!normalizedFilter) return;

    let value = filterValues[index];
    let functionType = filterFunctions[index] || 'eq';

    const operatorMap = {
      eq: op.eq,
      ne: op.ne,
      like: op.like,
      iLike: op.iLike,
      in: op.in,
      notIn: op.notIn,
      gt: op.gt,
      lt: op.lt,
      gte: op.gte,
      lte: op.lte,
      between: op.between,
    };

    // Normalize array values to avoid "varchar = text[]" errors.
    // - If function is 'eq' and value is a single-element array, unwrap it.
    // - If function is 'eq' or 'ne' and value is a multi-element array,
    //   switch to 'in' / 'notIn' accordingly so Sequelize generates an IN clause.
    if (functionType === 'between') {
      if (!Array.isArray(value) || value.length !== 2) {
        return;
      }
      const a = value[0] instanceof Date ? value[0] : new Date(value[0])
      const b = value[1] instanceof Date ? value[1] : new Date(value[1])
      if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
        return
      }
      value = [a, b]
    } else if (Array.isArray(value)) {
      if (functionType === 'eq') {
        if (value.length === 1) {
          value = value[0];
        } else {
          functionType = 'in';
        }
      } else if (functionType === 'ne') {
        if (value.length === 1) {
          value = value[0];
        } else {
          functionType = 'notIn';
        }
      }
    }

    // Backend guard: county-scoped users can only query their assigned counties, including multi-county users.
    if (normalizedFilter === 'county_id' && !hasSuperAdminRole && !hasNationalRole && countyRoleIds.length > 0) {
      const incomingCountyValues = normalizeToArray(value);
      const allowedCountyValues =
        incomingCountyValues.length > 0
          ? incomingCountyValues.filter(v => countyRoleIds.includes(v))
          : countyRoleIds;

      value = allowedCountyValues.length > 0 ? allowedCountyValues : countyRoleIds;
      functionType = 'in';
    }

    // Handle nested field filters (e.g., $users.name$)
    if (normalizedFilter.includes('$') && normalizedFilter.includes('.')) {
      // Extract the association name and field from the filter
      const match = normalizedFilter.match(/\$([^.]+)\.([^$]+)\$/);
      if (match) {
        const [, associationName, fieldName] = match;
        
        // Ensure the association is included
        if (!findAndCountOptions.include) {
          findAndCountOptions.include = [];
        }
        
        // Check if association is already included
        const existingInclude = findAndCountOptions.include.find(inc => 
          inc.model === db.models[associationName] || inc.as === associationName
        );
        
        if (!existingInclude) {
          let includeModel;
          if (associationName === 'users') {
            includeModel = { 
              model: db.models[associationName],
              as: 'users',
              required: false
            };
          } else {
            includeModel = { model: db.models[associationName] };
          }
          
          if (db.models[associationName] && db.models[associationName].rawAttributes && db.models[associationName].rawAttributes.geom) {
            includeModel.attributes = { exclude: ['geom'] };
          }
          
          findAndCountOptions.include.push(includeModel);
        }
        
        // Apply the filter using the nested field syntax
        findAndCountOptions.where[normalizedFilter] = { [operatorMap[functionType] || op.eq]: value };
      }
    } else {
      // Regular field filter
      findAndCountOptions.where[normalizedFilter] = { [operatorMap[functionType] || op.eq]: value };
    }
  });

  console.log('findAndCountOptions:', findAndCountOptions);

  // Include associated models and exclude geometry fields
  const associatedModels = req.body.associated_multiple_models || [];
  if (associatedModels.length > 0) {
    // Initialize includes array if not already set by filters
    if (!findAndCountOptions.include) {
      findAndCountOptions.include = [];
    }
    
    associatedModels.forEach(model => {
      // Check if this model is already included (e.g., by nested filters)
      const existingInclude = findAndCountOptions.include.find(inc => 
        inc.model === db.models[model] || inc.as === model
      );
      
      if (!existingInclude) {
        let includeModel;
        
        if (model === 'users') {
          // Special handling for users association with referred officer
          includeModel = { 
            model: db.models[model],
            as: 'users',
            required: false // Left join to include grievances without referred officers
          };
        } else {
          includeModel = { model: db.models[model] };
        }
        
        if (db.models[model] && db.models[model].rawAttributes && db.models[model].rawAttributes.geom) {
          includeModel.attributes = { exclude: ['geom'] };
        }

        findAndCountOptions.include.push(includeModel);
      }
    });
  }

  // Execute query
  try {
    const { count, rows: grievances } = await Grievance.findAndCountAll(findAndCountOptions);
    
    console.log('Total grievances:', count);

    res.status(200).send({
      data: grievances,
      total: count,
      code: '0000',
      message: 'Grievances retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching Grievances:', error);
    res.status(500).send({ message: 'Unable to retrieve Grievances. Please try again later.' });
  }
};



const multer = require('multer');
 

// Production layout: same root as pdf.controller (`/data/grievances`), not under repo cwd (e.g. `/data/plus-admin/data/grievances`).
const uploadDir = process.env.GRIEVANCE_UPLOAD_DIR || '/data/grievances';
/** Previous default when cwd was the app folder — used only as a download fallback for unmigrated files. */
const grievanceUploadDirLegacy = path.resolve(process.cwd(), 'data', 'grievances');

// Ensure the directory exists
if (!fs.existsSync(uploadDir)) {
  console.log('Create Folder if not esists ')
  fs.mkdirSync(uploadDir, { recursive: true });
} else {
  console.log('Grievances Folder exists. Skipping ')
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Use configurable upload directory
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

exports.uploadGrievanceDocument = (req, res) => {
        // The uploaded files can be accessed using `req.files`
      // Use `upload.array('files')` middleware to handle multiple file uploads
      // 'files' should match the name attribute of the file input(s) in your form
      upload.array('files')(req, res, async (err) => {
      if (err) {
        console.log(err);
        // Handle multer errors, if any
      // return res.status(400).json({ error: 'File upload failed.' });
      return res.status(500).send({
          message: 'Upload failed.',
          code: '0000'
        })
      }


      var reg_model = 'grievance_document'
      let myFiles = req.files
      let objs = []
      if (!Array.isArray(myFiles)) {
        myFiles = [myFiles]; // Convert to an array with one element
      }


      for (let i = 0; i < myFiles.length; i++) {
        
        console.log('doc#',i, myFiles[i], req.body )
        
        var obj = {}
        
              if (myFiles.length >1) {
                obj.grievance_id =req.body.grievance_id[i] 
                obj.format = req.body.format[i]
                obj.size = req.body.size[i]
                obj.protected_file = req.body.protected_file[i] 
                obj.name = myFiles[i].originalname
                obj.location = myFiles[i].path
                obj.code = shortid.generate()
                obj.action_id = (req.body.action_id && Array.isArray(req.body.action_id))
                  ? (req.body.action_id[i] || null)
                  : (req.body.action_id || null)
                obj.type = (req.body.type && Array.isArray(req.body.type)) ? (req.body.type[i] || 'Documentation') : (req.body.type || 'Documentation')
                objs.push(obj)

              } else {
                obj.grievance_id =req.body.grievance_id 
                obj.action_id = req.body.action_id ?  req.body.action_id : null
                obj.format = req.body.format 
                obj.size = req.body.size 
                obj.protected_file = req.body.protected_file
                obj.name = myFiles[i].originalname
                obj.location = myFiles[i].path
                obj.code =shortid.generate()
                obj.format = req.body.format 
                //obj.type = req.body.type 

                obj.type = req.body.type ? req.body.type : 'Documentation'

                objs.push(obj)

        }

      }

      console.log('objs#',  objs ) 
      try {
        //await db.models[reg_model].create(obj)
      for (const nobj of objs) {
        console.log('inserting....., ', nobj)
        await db.models[reg_model].create(nobj); 
      }

      res.status(200).send({
        message: 'Batch Upload Successful',
        code: '0000'
      })

}
     
    catch (error) {
    console.log(error)
    const isDuplicateDoc =
      error &&
      (error.name === 'SequelizeUniqueConstraintError' ||
        error.parent?.code === '23505' ||
        error.original?.code === '23505') &&
      (error.parent?.constraint === 'grievance_document_name_grievance_id' ||
        error.original?.constraint === 'grievance_document_name_grievance_id')

    if (isDuplicateDoc) {
      const duplicateName = error.fields?.name || 'this file'
      return res.status(409).send({
        message: `Upload failed: ${duplicateName} already exists for this grievance. Rename the file or remove the existing one first.`,
        code: 'DUPLICATE_GRIEVANCE_DOCUMENT'
      })
    }

    const backendMessage = error?.message || 'Unknown upload error'
    res.status(500).send({
      message: `Upload failed: ${backendMessage}`,
      code: 'UPLOAD_FAILED'
    })
    }



 
    });
    };


exports.batchDocumentsUploadByGrievanceCode = async (req, res) => {

      upload.array('files')(req, res, async (err) => {
        if (err) {
          console.log(err);
            return res.status(500).send({
            message: 'Upload failed.',
            code: '0000'
          })
        } 
        if (!req.files) {
          return res.status(500).send({ msg: 'file is not found :batchDocumentsUploadByParentCode' })
        }
    
        var myFiles =req.files
      
    
        console.log('files to upload',myFiles )
        console.log('Properties Document',req.body )
     
        var errors = []
        var objs =[]
    
        for (let i = 0; i < myFiles.length; i++) {
          // Sin
      
            var obj = {} 
          
            obj.format = req.body.format 
            obj.size = req.body.size 
            obj.protected_file = req.body.protected_file 
            obj.name = myFiles[i].originalname
            obj.location = myFiles[i].path 
            obj.code = shortid.generate()
            obj.action_id = req.body.action_id  ? req.body.action_id  : null
            obj.type = req.body.type  ? req.body.type  : 'Documentation'
           
            
              
            
            try {
              const record = await db.models.grievance.findOne({
                where: {
                  code: {
                    [Op.eq]: req.body.pcode
                  }
                }
              });
            
             // console.log('assocaited grievance', record)
              if (record) {
                obj.grievance_id = record.id; // Assign the found record's ID
              } 
            
              objs.push(obj);
            
            } catch (error) {
              // Handle the error here
              console.error("An error occurred:", error);
            }
            
            
         
    
        //  }
      
        }
    
        // Send message
    
        
        var reg_model = 'grievance_document'
        // console.log("insert Objects", objs)
    
    
         try {
           for (const eobj of objs) {
              console.log(eobj)
             await db.models[reg_model].create(eobj)
               .then(function () {
                 console.log('-----')
               });
           }
         }  
         
    
             
         catch (error) {
           // handle error;
           console.log(error)
           errors.push('Failed to upload attachments.')
    
         }
    
    
    
        if (errors.length === 0) {
          res.status(200).send({
            message: 'Upload via App Successful',
            code: '0000'
          })
      
    
        } else {
    
          res.status(500).send({
            message: 'Upload failed. ' + errors + ' errors',
            code: '0000'
          })
        }
      })
    }
 
    
 
    
    
 exports.getGrievanceById = async (req, res) => {
      try {
        const user = req.thisUser;
        const grievanceId = req.body.id; // Retrieve grievance ID from the request body
    
        if (!grievanceId) {
          return res.status(400).send({
            data: null,
            code: '9998',
            message: 'Grievance ID is required',
          });
        }
    
        const currentUserRoles = await user.getRoles(getActiveRolesGetOptions());
        console.log('Current User Roles:', currentUserRoles);
    
        // Initialize findOptions with common properties
        const findOptions = {
          where: { id: grievanceId }, // Filter by the specific grievance ID
        };
    
        // Check if the current user has the 'super_admin' role or 'grm/gbv' roles
       //  const hasSuperAdminRole = currentUserRoles.some(role => role.name === 'super_admin');
        const hasSuperAdminRole = currentUserRoles.some(role => 
          role.name === 'super_admin' || role.name === 'root_admin'
        );

        
        const hasGRMRole = currentUserRoles.some(role => role.name === 'grm' || role.name === 'gbv' || role.name === 'staff' || role.name === 'admin');
    
        // Initialize attributes, including all fields from grievance and sensitive fields with conditional redaction
        let attributes = Object.keys(db.models.grievance.rawAttributes).filter(attr => attr !== 'password'); // Exclude sensitive fields like password if any
    
        // Redaction logic for both name and phone
        let redactedFields;
        if (hasSuperAdminRole) {
          // Show actual decrypted name and phone for super_admin role
          redactedFields = [
            // Decrypt the name field
            [
              Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.name'), 'bytea'), process.env.AES_KEY),
              'name'
            ],
            [
              Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.national_id'), 'bytea'), process.env.AES_KEY),
              'national_id'
            ],
             
          ];
        } else {
          // Redact name and phone if it's a GBV case for non-super-admin users
          redactedFields = [
            // Redact name if the case is GBV
            [
              Sequelize.literal(`
                CASE 
                  WHEN "grievance"."isgbv" = false THEN 
                    PGP_SYM_DECRYPT(CAST("grievance"."name" AS bytea), '${process.env.AES_KEY}')
                  ELSE 
                    '[REDACTED]'
                END
              `),
              'name'
            ],
            [
              Sequelize.literal(`
                CASE 
                  WHEN "grievance"."isgbv" = false THEN 
                    PGP_SYM_DECRYPT(CAST("grievance"."national_id" AS bytea), '${process.env.AES_KEY}')
                  ELSE 
                    '[REDACTED]'
                END
              `),
              'national_id'
            ],

            // Redact phone if the case is GBV
            [
              Sequelize.literal(`
                CASE 
                  WHEN "grievance"."isgbv" = false THEN "grievance"."phone"
                  ELSE '[REDACTED]'
                END
              `),
              'phone'
            ]
          ];
        }
    
        // Add redacted fields (name and phone) to attributes
        attributes.push(...redactedFields);
    
        if (!hasGRMRole && !hasSuperAdminRole) {
          return res.status(403).send({
            data: null,
            code: '9999',
            message: 'Unauthorized access to grievance',
          });
        }
    
        // Apply location-based filtering for non-super-admin users
        if (!hasSuperAdminRole) {
          const hasNationalRole = currentUserRoles.some(role => role.user_roles.location_level === 'national');
          const countyAdminRole = currentUserRoles.find(role => role.user_roles.location_level === 'county');
          let countyId;
    
          if (countyAdminRole) {
            countyId = countyAdminRole.user_roles.county_id; // Access the county_id from the role
            console.log('County Admin Role detected. County ID:', countyId);
          }
    
          if (!hasNationalRole && countyId) {
            findOptions.where.county_id = countyId; // Apply county filter if not a national role
            console.log('Applying county filter:', countyId);
          }
        } else {
          console.log('Super Admin detected. Bypassing location-level filtering.');
        }
    
        // Include the national_id field decrypted
        // let decryptedNationalId = [
        //   Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.national_id'), 'bytea'), process.env.AES_KEY),
        //   'national_id'
        // ];
        // attributes.push(decryptedNationalId);
    
        findOptions.attributes = attributes;
    
        // Include associated models if specified, with one level of nested association
        const associatedModels = req.body.associated_multiple_models || [];
        if (associatedModels.length > 0) {
          findOptions.include = associatedModels.map(model => {
            if (typeof model === 'string') {
              // Limit fields for 'users' model
              if (model === 'users') {
                return { 
                  model: db.models[model], 
                as: 'users',
                  attributes: ['id', 'name', 'username', 'email', 'phone'] 
                };
              }
              return { model: db.models[model] };
            } else if (typeof model === 'object' && model.name && model.nestedAssociations) {
              return {
                model: db.models[model.name],
                as: model.name === 'users' ? 'users' : undefined,
                attributes: model.name === 'users' ? ['id', 'name', 'username', 'email', 'phone'] : undefined,
                include: model.nestedAssociations.map(nestedModel => ({
                  model: db.models[nestedModel],
                  as: nestedModel === 'users' ? 'user' : undefined,
                  attributes: nestedModel === 'users' ? ['id', 'name', 'username', 'email', 'phone'] : undefined,
                }))
              };
            }
          });
        }
        
        // Fetch the grievance
        const grievance = await Grievance.findOne(findOptions);
        
        // Fetch confirmed_by_user separately if confirmed_by_user_id exists
        if (grievance && grievance.confirmed_by_user_id) {
          const confirmedByUser = await db.models.users.findOne({
            where: { id: grievance.confirmed_by_user_id },
            attributes: ['id', 'name', 'username', 'email', 'phone']
          });
          if (confirmedByUser) {
            grievance.dataValues.confirmed_by_user = confirmedByUser;
          }
        }
    
        console.log('The Grievance', grievance);
    
        if (!grievance) {
          return res.status(404).send({
            data: null,
            code: '0001',
            message: 'Grievance not found',
          });
        }
    
        // Send the grievance data
        res.status(200).send({
          data: grievance,
          code: '0000',
          message: 'Grievance retrieved successfully',
        });
        
      } catch (error) {
        console.error('Error fetching Grievance:', error);
        res.status(500).send({ 
          data: null,
          message: 'Unable to retrieve Grievance. Please try again later.',
        });
      }
 };


exports.getGrievanceByPublicId = async (req, res) => {
  try {
    const grievanceId = req.body.id; // Retrieve grievance ID from the request body

    if (!grievanceId) {
      return res.status(400).send({
        data: null,
        message: 'Grievance ID is required',
      });
    }

    let redactedFields;

    redactedFields = [
      // Redact name if the case is GBV
      [
        Sequelize.literal(`
          CASE 
            WHEN "grievance"."isgbv" = false THEN 
              PGP_SYM_DECRYPT(CAST("grievance"."name" AS bytea), '${process.env.AES_KEY}')
            ELSE 
              '[REDACTED]'
          END
        `),
        'name'
      ],
      [
        Sequelize.literal(`
          CASE 
            WHEN "grievance"."isgbv" = false THEN 
              PGP_SYM_DECRYPT(CAST("grievance"."national_id" AS bytea), '${process.env.AES_KEY}')
            ELSE 
              '[REDACTED]'
          END
        `),
        'national_id'
      ],

      // Redact phone if the case is GBV
      [
        Sequelize.literal(`
          CASE 
            WHEN "grievance"."isgbv" = false THEN "grievance"."phone"
            ELSE '[REDACTED]'
          END
        `),
        'phone'
      ]
    ];
    let attributes = Object.keys(db.models.grievance.rawAttributes).filter(attr => attr !== 'password'); // Exclude sensitive fields like password if any


    attributes.push(...redactedFields);
    // Initialize findOptions with required attributes
    const xfindOptions = {
      where: { id: grievanceId },
      attributes: [
        'code',
        // Redact name if GBV
        [
          Sequelize.literal(`
            CASE 
              WHEN "grievance"."isgbv" = false THEN "grievance"."name"
              ELSE '[REDACTED]'
            END
          `),
          'name'
        ],
        // Redact phone if GBV
        [
          Sequelize.literal(`
            CASE 
              WHEN "grievance"."isgbv" = false THEN "grievance"."phone"
              ELSE '[REDACTED]'
            END
          `),
          'phone'
        ],
        'nature',
        'isgbv',
        'description',
        'status',
        'plea',
        'date_reported',
        'county_id',
        'settlement_id'
      ],
    };

    // Initialize findOptions with common properties
    const findOptions = {
      where: { id: grievanceId }, // Filter by the specific grievance ID
    };

    findOptions.attributes = attributes;
    
    // Include associated models if specified
    const associatedModels = req.body.associated_multiple_models || [];
    if (associatedModels.length > 0) {
      findOptions.include = associatedModels.map(model => {
        if (typeof model === 'string') {
          if (model === 'county' || model === 'settlement') {
            return { model: db.models[model], attributes: ['name'] };
          }
          if (model === 'grievance_document') {
            return {
              model: db.models.grievance_document,
              attributes: ['id', 'name', 'type', 'format', 'size', 'grievance_id'],
            };
          }
          return null; // Exclude other unused models
        } else if (typeof model === 'object' && model.name === 'grievance_log' && model.nestedAssociations) {
          return {
            model: db.models[model.name],
            attributes: ['action_type', 'date_actioned'],
            include: model.nestedAssociations
              .filter(nestedModel => nestedModel === 'users')
              .map(() => ({
                model: db.models.users,
                as: 'user',
                attributes: ['name']
              }))
          };
        }
        return null;
      }).filter(model => model !== null); // Remove null entries
    }

    // Fetch the grievance
    const grievance = await db.models.grievance.findOne(findOptions);

    if (!grievance) {
      return res.status(404).send({
        data: null,
        message: 'Grievance not found',
      });
    }

    // Send the grievance data
        res.status(200).send({
          data: grievance,
          code: '0000',
          message: 'Grievance retrieved successfully',
        });

  } catch (error) {
    console.error('Error fetching Grievance:', error);
    res.status(500).send({
      data: null,
      message: 'Unable to retrieve Grievance. Please try again later.',
    });
  }
};

 exports.getGrievanceByUserPhone = async (req, res) => {
  try {
    const user = req.thisUser;
    const userPhone = req.body.phone; // Retrieve grievance ID from the request body

    if (!userPhone) {
      return res.status(400).send({
        data: null,
        code: '9998',
        message: 'User Phone is required',
      });
    }

    const currentUserRoles = await user.getRoles(getActiveRolesGetOptions());
    console.log('Current User Roles:', currentUserRoles);

    // Initialize findOptions with common properties
    const findOptions = {
      where: { phone: userPhone }, // Filter by the specific grievance ID
    };

    // Check if the current user has the 'super_admin' role or 'grm/gbv' roles
    const hasSuperAdminRole = currentUserRoles.some(role => role.name === 'super_admin');
    //const hasGRMRole = currentUserRoles.some(role => role.name === 'grm' || role.name === 'gbv');
    const hasGRMRole = currentUserRoles.some(role => role.name === 'grm' || role.name === 'gbv' || role.name === 'staff' || role.name === 'admin');

    // Initialize attributes, including all fields from grievance and sensitive fields with conditional redaction
    let attributes = Object.keys(db.models.grievance.rawAttributes).filter(attr => attr !== 'password'); // Exclude sensitive fields like password if any

    // Redaction logic for both name and phone
    let redactedFields;
    if (hasSuperAdminRole) {
      // Show actual decrypted name and phone for super_admin role
      redactedFields = [
        // Decrypt the name field
        [
          Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.name'), 'bytea'), process.env.AES_KEY),
          'name'
        ],
        [
          Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.national_id'), 'bytea'), process.env.AES_KEY),
          'name'
        ],
         
      ];
    } else {
      // Redact name and phone if it's a GBV case for non-super-admin users
      redactedFields = [
        // Redact name if the case is GBV
        [
          Sequelize.literal(`
            CASE 
              WHEN "grievance"."isgbv" = false THEN 
                PGP_SYM_DECRYPT(CAST("grievance"."name" AS bytea), '${process.env.AES_KEY}')
              ELSE 
                '[REDACTED]'
            END
          `),
          'name'
        ],
        [
          Sequelize.literal(`
            CASE 
              WHEN "grievance"."isgbv" = false THEN 
                PGP_SYM_DECRYPT(CAST("grievance"."national_id" AS bytea), '${process.env.AES_KEY}')
              ELSE 
                '[REDACTED]'
            END
          `),
          'national_id'
        ],

        // Redact phone if the case is GBV
        [
          Sequelize.literal(`
            CASE 
              WHEN "grievance"."isgbv" = false THEN "grievance"."phone"
              ELSE '[REDACTED]'
            END
          `),
          'phone'
        ]
      ];
    }

    // Add redacted fields (name and phone) to attributes
    attributes.push(...redactedFields);

    if (!hasGRMRole && !hasSuperAdminRole) {
      return res.status(403).send({
        data: null,
        code: '9999',
        message: 'Unauthorized access to grievance',
      });
    }

    // Apply location-based filtering for non-super-admin users
    if (!hasSuperAdminRole) {
      const hasNationalRole = currentUserRoles.some(role => role.user_roles.location_level === 'national');
      const countyAdminRole = currentUserRoles.find(role => role.user_roles.location_level === 'county');
      let countyId;

      if (countyAdminRole) {
        countyId = countyAdminRole.user_roles.county_id; // Access the county_id from the role
        console.log('County Admin Role detected. County ID:', countyId);
      }

      if (!hasNationalRole && countyId) {
        findOptions.where.county_id = countyId; // Apply county filter if not a national role
        console.log('Applying county filter:', countyId);
      }
    } else {
      console.log('Super Admin detected. Bypassing location-level filtering.');
    }

    

    findOptions.attributes = attributes;

    // Include associated models if specified, with one level of nested association
    const associatedModels = req.body.associated_multiple_models || [];
    if (associatedModels.length > 0) {
      findOptions.include = associatedModels.map(model => {
        if (typeof model === 'string') {
          // Limit fields for 'users' model
          if (model === 'users') {
            return { 
              model: db.models[model], 
              as: 'users',
              attributes: ['id', 'name', 'username', 'email', 'phone'] 
            };
          }
          return { model: db.models[model] };
        } else if (typeof model === 'object' && model.name && model.nestedAssociations) {
          return {
            model: db.models[model.name],
            as: model.name === 'users' ? 'users' : undefined,
            attributes: model.name === 'users' ? ['id', 'name', 'username', 'email', 'phone'] : undefined,
            include: model.nestedAssociations.map(nestedModel => ({
              model: db.models[nestedModel],
              as: nestedModel === 'users' ? 'user' : undefined,
              attributes: nestedModel === 'users' ? ['id', 'name', 'username', 'email', 'phone'] : undefined,
            }))
          };
        }
      });
    }

    // Fetch the grievance
    const grievance = await Grievance.findAll(findOptions);

    console.log('The Grievance', grievance);

    if (!grievance) {
      return res.status(404).send({
        data: null,
        code: '0001',
        message: 'Grievance not found',
      });
    }

    // Send the grievance data
    res.status(200).send({
      data: grievance,
      code: '0000',
      message: 'Grievance retrieved successfully',
    });
    
  } catch (error) {
    console.error('Error fetching Grievance:', error);
    res.status(500).send({ 
      data: null,
      message: 'Unable to retrieve Grievance. Please try again later.',
    });
  }
};
 
    
exports.getGrievanceStatus = async (req, res) => {
      try {
        const grievanceCode = req.body.grievanceCode;
        const phoneNumber = req.body.phoneNumber;
        const grievanceId = req.body.id; // Get the grievance ID from the request body
    
        // The array of associated models to be included, if provided
        const associatedModels = req.body.associated_multiple_models || null;
    
        // If both grievanceCode and phoneNumber are missing, but ID is also not provided, return error
        if (!grievanceId && (!grievanceCode || !phoneNumber)) {
          return res.status(400).send({
            code: '1001',
            message: 'Grievance code and phone number are required',
          });
        }
    
        // Initialize findOne options
        let findOptions = {
          attributes: ['id', 'phone', 'code', 'date_reported', 'status','status_expiry_date','current_level'], // Fields to include
        };
    
        // If associated models are provided, build the include options dynamically
        if (associatedModels && Array.isArray(associatedModels)) {
          findOptions.include = associatedModels.map((modelName) => {
            // Map each model name to an include object
            return {
              model: db.models[modelName], // Reference the model dynamically by name
              attributes: ['id', 'name','type'], // You can specify attributes as needed for each model
            };
          });
        }
    
        // If grievanceId is provided, use it to find the grievance
        if (grievanceId) {
          findOptions.where = { id: grievanceId };
        } else {
          // If ID is not provided, check by grievance code and phone number
          findOptions.where = {
            code: { [op.iLike]: `%${grievanceCode}%` }, // Case-insensitive partial matching for grievance code
            phone: { [op.iLike]: `%${phoneNumber}%` }, // Case-insensitive partial matching for phone number
          };
        }
    
        console.log('Find options:', findOptions);
    
        // Fetch grievance by ID or by grievance code and phone number
        const grievance = await Grievance.findOne(findOptions);
    
        if (!grievance) {
          return res.status(404).send({
            code: '1002',
            message: 'No grievance found for the given criteria',
          });
        }
    
        console.log('grievance',grievance)



        function daysToExpiry(status_expiry_date) {
          const expiryDate = new Date(status_expiry_date);
          const today = new Date();
          
          // Calculate the difference in milliseconds
          const diffTime = expiryDate - today;
          
          // Convert milliseconds to days
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
          return diffDays;
      }
        // Function to determine escalate label
        function getEscalateLabel(level) {
          if (level === 'settlement') {
            return 'Escalate to County';
          } else if (level === 'county') {
            return 'Escalate to National Office';
          }
          return 'Escalate'; // Default fallback
        }

        // Format the response object
        const responseObject = {
          id: grievance.id,
          code: grievance.code,
          date_reported: grievance.date_reported,
          phone: grievance.phone,
          status: grievance.status,
          status_expiry_date: grievance.status_expiry_date,
          daysToExpiryDate: daysToExpiry(grievance.status_expiry_date),
          current_level:grievance.current_level,
          escalateLabel: getEscalateLabel(grievance.current_level), // Added escalateLabel

        };
    

                // If associated models are included, add their data to the response object
            if (associatedModels && Array.isArray(associatedModels)) {
              associatedModels.forEach((modelName) => {
                // Convert model name to its plural form (e.g., 'county' -> 'counties')
                const pluralModelName = `${modelName}s`;

                // Check if the grievance record has the plural form of the model
                if (grievance[pluralModelName]) {
                  // Add the pluralized model data to the response object
                  responseObject[pluralModelName] = grievance[pluralModelName];
                }
              });
            }

        console.log('responseObject',responseObject)
        // Return the grievance status along with any included associations
        return res.status(200).send({
          code: '0000',
          message: 'Grievance status retrieved successfully',
          data: responseObject,
        });
      } catch (error) {
        console.error('Error fetching grievance status:', error);
        return res.status(500).send({
          code: '9999',
          message: 'Unable to retrieve grievance status. Please try again later.',
        });
      }
    };

    
const generateNextGrievanceCode = async (lastCode) => {
      const prefix = 'GRM';
      const year = new Date().getFullYear();
      const codeLength = 4;  // Number of digits in the numeric part
      
      let lastNumber = 0;
    
      if (lastCode && lastCode.startsWith(`${prefix}-${year}`)) {
        // Extract the numeric part if it's in the current year format
        lastNumber = parseInt(lastCode.split('-')[2]);
      }
    
      // Increment the numeric part
      const nextNumber = lastNumber + 1;
    
      // Pad the numeric part with leading zeros and format the final code
      const nextCode = `${prefix}-${year}-${nextNumber.toString().padStart(codeLength, '0')}`;
    
      return nextCode;
    };
  


 async function logGrievanceAction(action) {
      try {
        // Prepare the object for creation
        const obj = action;
    
        console.log('Logging....>>', obj);
    
        // Simulate async database call
       //const item = await createGrievanceLog(obj);
        const item = await db.models.grievance_log.create(obj);

        console.log('Created log:', item);
        return item; // Return the created log so we can get the ID
     
      } catch (err) {
        console.log(err);
        return null;
       }
    }


exports.modelImportGrievances = async (req, res) => {
      const reg_model = 'grievance';
      const data = req.body.data;
      const insertedDocuments = [];
      const failedRecords = [];
    
      console.log('req.body.data', req.thisUser);
    
      try {
        // Fetch the latest grievance code from the database
        const lastGrievance = await db.models[reg_model].findOne({
          order: [['createdAt', 'DESC']], // Get the latest created grievance
          attributes: ['code'],
        });
    
        console.log(lastGrievance)
        let lastCode = lastGrievance ? lastGrievance.code : await generateGRMCode();
    
        // Sequentially process grievances
        console.log(`Starting import of ${data.length} records...`);
        for (let index = 0; index < data.length; index++) {
          const item = data[index];
          // Store original item data for error reporting
          const originalItem = { ...item };
          console.log(`Processing record ${index + 1}/${data.length}...`);
          try {
            // Validate required fields before processing
            const requiredFields = ['county_id', 'nature', 'status', 'current_status_date', 'status_expiry_date', 'current_level'];
            const missingFields = requiredFields.filter(field => item[field] == null || item[field] === undefined || item[field] === '');
            
            if (missingFields.length > 0) {
              throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            // Generate a new code by incrementing the last code
            const newCode = await generateNextGrievanceCode(lastCode);
            lastCode = newCode; // Update lastCode for the next item
    
            item.code = newCode;
    
            // Encrypt 'name' and 'national_id' - ensure they are strings before encryption
            if (item.name != null && item.name !== undefined) {
              item.name = Sequelize.fn('PGP_SYM_ENCRYPT', Sequelize.cast(item.name, 'TEXT'), process.env.AES_KEY);
            }
            if (item.national_id != null && item.national_id !== undefined) {
              item.national_id = Sequelize.fn('PGP_SYM_ENCRYPT', Sequelize.cast(item.national_id, 'TEXT'), process.env.AES_KEY);
            }
    
            // Use upsert to insert or update depending on conflicts
            const [insertedData, created] = await db.models[reg_model].upsert(item, {
              returning: true, // Get the inserted/updated data
            });
            
            // Ensure item.id is set from insertedData for use in subsequent queries
            if (!insertedData || !insertedData.id) {
              throw new Error('Failed to create/update grievance: No ID returned');
            }
            
            item.id = insertedData.id;
 
            // Decrypt the fields after creation (only if they were encrypted)
            try {
              const decryptedName = await db.sequelize.query(
                `SELECT PGP_SYM_DECRYPT(name::bytea, '${process.env.AES_KEY}') AS name FROM grievance WHERE id = :id`,
                {
                  replacements: { id: item.id },
                  type: Sequelize.QueryTypes.SELECT
                }
              );

              if (decryptedName && decryptedName[0] && decryptedName[0].name) {
                item.name = decryptedName[0].name;
              }

              const decryptedNationalId = await db.sequelize.query(
                `SELECT PGP_SYM_DECRYPT(national_id::bytea, '${process.env.AES_KEY}') AS national_id FROM grievance WHERE id = :id`,
                {
                  replacements: { id: item.id },
                  type: Sequelize.QueryTypes.SELECT
                }
              );

              if (decryptedNationalId && decryptedNationalId[0] && decryptedNationalId[0].national_id) {
                item.national_id = decryptedNationalId[0].national_id;
              }
            } catch (decryptErr) {
              console.log('Warning: Failed to decrypt fields for grievance ID:', item.id, decryptErr.message);
              // Continue processing even if decryption fails
            }
                
            const serverUrl = `${req.protocol}://${req.get('host')}`;
            sendCreateSMS(item,serverUrl);
            


            console.log('Logged--------------->')
            // 1. Create a log for creation 
            let create_action = {}
            create_action.grievance_id = insertedData.id
            create_action.action_type = 'Reported'
            //create_action.action_by = 1  // Remember to change 
            create_action.date_actioned = item.date_reported || new Date()
            create_action.current_level = 'settlement'
            create_action.prev_status = 'Open'
            create_action.new_status = 'Open'
            create_action.action_level = item.action_level || null
            const description = item.description || '';
            create_action.action = description 
              ? `Grievance reported: ${description.length > 100 ? description.substring(0, 100) + '...' : description}` 
              : `New grievance registered with code ${newCode}`
            // Await log creation and catch errors silently to not block import
            try {
              await logGrievanceAction(create_action);
            } catch (logErr) {
              console.log('Warning: Failed to create initial log for grievance ID:', insertedData.id, logErr.message);
            }

            // 2. Create a log for Current status (only if status is different from 'Open' or if there's a meaningful action)
            // Skip this log if status is 'Open' to avoid duplicate with 'Reported' log
            const currentStatus = item.status || 'Open';
            if (currentStatus !== 'Open' || item.action) {
              let current_action = {}
              current_action.grievance_id = insertedData.id
              current_action.action_type = currentStatus
              //current_action.action_by = 1  // Remember to change 
              // Use date_actioned from Excel, or fall back to date_reported, or current date
              current_action.date_actioned = item.date_actioned || item.date_reported || new Date()
              // Set current_level - use from Excel if available, or default to 'settlement'
              current_action.current_level = item.current_level || 'settlement'
              current_action.prev_status = 'Sorting'
              current_action.new_status = currentStatus
              // Ensure action field is set - use item.action if available, otherwise provide a default message
              current_action.action = item.action || `Grievance status set to ${currentStatus}`
              current_action.action_level = item.action_level || null

              // Await log creation and catch errors silently to not block import
              try {
                await logGrievanceAction(current_action);
              } catch (logErr) {
                console.log('Warning: Failed to create status log for grievance ID:', insertedData.id, logErr.message);
              }
            }

 

            // Add to insertedDocuments regardless of whether it was created or updated
            insertedDocuments.push(insertedData);
            console.log(`Successfully processed record ${index + 1}/${data.length} - Grievance ID: ${insertedData.id}, Code: ${insertedData.code}`);
          } catch (err) {
            // Store the failed record with error details
            const failedRecord = {
              record: originalItem,
              error: {
                message: err.message || 'Unknown error',
                code: err.code || err.original?.code || null,
                detail: err.original?.detail || err.detail || null,
                constraint: err.original?.constraint || err.constraint || null,
              }
            };
            failedRecords.push(failedRecord);
            console.log(`Error processing record ${index + 1}/${data.length}:`, err.message);
            console.log('Failed record data:', JSON.stringify(originalItem, null, 2));
          }
        }
    
        // Check for errors and respond accordingly
        if (failedRecords.length > 0) {
          let errorMsg = 'Import/Update failed for ' + failedRecords.length + ' Record(s).';
    
          // Return both success and failure information
          const response = {
            message: errorMsg,
            code: '1001',
            totalRecords: data.length,
            successfulRecords: insertedDocuments.length,
            failedRecords: failedRecords.length,
            insertedDocuments: insertedDocuments,
            failedRecords: failedRecords, // Array of failed records with error details
          };
    
          // If some records succeeded, return 207 (Multi-Status), otherwise 500
          if (insertedDocuments.length > 0) {
            res.status(207).send(response);
          } else {
            res.status(500).send(response);
          }
        } else {
          res.status(200).send({
            message: 'Import/Update Successful',
            code: '0000',
            totalRecords: data.length,
            successfulRecords: insertedDocuments.length,
            failedRecords: 0,
            insertedDocuments: insertedDocuments, // Add the inserted documents to the response
            failedRecords: [], // Empty array when no failures
          });
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        res.status(500).send({ 
          message: 'Internal Server Error', 
          error: err.message,
          code: '9999',
          failedRecords: data.map(item => ({
            record: item,
            error: {
              message: err.message || 'Unexpected error during import',
              code: null,
              detail: null,
              constraint: null,
            }
          }))
        });
      }
    };
    
    

 exports.updateGrievanceStatus = async (req, res) => {

      try {


        const user = req.thisUser;
        console.log(user)
    
        const currentUserRoles = await user.getRoles(getActiveRolesGetOptions());
      //  const hasSuperAdminRole = currentUserRoles.some(role => role.name === 'super_admin');
        const hasSuperAdminRole = currentUserRoles.some(role => ['super_admin', 'root_admin','admin','staff'].includes(role.name));

        const hasGRMRole = currentUserRoles.some(role => role.name === 'grm' || role.name === 'gbv' || role.name === 'admin' || role.name === 'staff');
      
        let settlement_id;
        let county_id;

        if (!hasGRMRole && !hasSuperAdminRole) {
          return res.status(200).send({
            data: [],
            total: 0,
            code: '9999',
            message: 'Unauthorized access to grievances denied',
          });
        }
      
        if (!hasSuperAdminRole) {
          const hasCountyAdminRole = currentUserRoles.some(role => role.user_roles.location_level === 'county');
          const countyAdminRole = currentUserRoles.find(role => role.user_roles.location_level === 'county');
          const settlementGRCRole = currentUserRoles.find(role => role.user_roles.location_level === 'settlement');
          if (hasCountyAdminRole) {
            county_id = countyAdminRole?.user_roles?.county_id;
          }

          if (settlementGRCRole) {
            settlement_id = settlementGRCRole?.user_roles?.settlement_id;
            
          }

        }

        
        const grievanceCode = req.body.code;
        const newStatus = req.body.new_status; // The new status to update
        const action = req.body.action; // The new status to update
        const current_level = req.body.current_level; // The new status to update

        console.log('Updating status..... newStatus',newStatus)
        console.log('Updating status..... newStatus',current_level)
    
        if (!grievanceCode ||  !newStatus) {
          return res.status(400).send({
            code: '1001',
            message: 'Grievance code and new status are required',
          });
        }
    
        // Find grievance by grievance code and phone number
        const findOptions = {
          where: {
            code: {
              [op.iLike]: `%${grievanceCode}%`, // Case-insensitive partial matching for grievance code
            } 
          },
        };
    
        //console.log('Find options:', findOptions);
    
        // Fetch grievance by grievance code and phone number
        const grievance = await Grievance.findOne(findOptions);
    
        if (!grievance) {
          return res.status(404).send({
            code: '1002',
            message: 'No grievance found for the given code ',
          });
        }


        // -------- Escalated -------- //

        if(newStatus =='Escalated') {
        

          const grm_officials = [];
          const grm_officials_names = [];
          
          try {
            const whereConditions = {
              roleid: 4, // GRM Role
            };
            
            const orConditions = [];
            
            // Add conditions only if values exist
            if (settlement_id) {
              orConditions.push({ settlement_id: settlement_id.toString() });
            }
            if (county_id) {
              orConditions.push({ county_id: county_id.toString() });
            }
            
            // Always include national level match
            orConditions.push({ location_level: 'national' });
            
            if (orConditions.length > 0) {
              whereConditions[Op.or] = orConditions;
            }
            
            const grms = await Users.findAll({
              include: [
                {
                  model: UserRoles,
                  where: whereConditions,
                },
              ],
            });
            
          
            for (const grm of grms) {
              if (grm.name) {
                grm_officials_names.push(grm.name);
              }
          
              if (grm.phone) {
                const msg = `A grievance has been escalated/referred for your action. Please review and act accordingly.`;
                
                const msg_obj = {
                  message: msg,
                  phone: grm.phone,
                  grievance_id: grievance.id,
                  grv_code: grievance.code,
                  status: grievance.status
                };
          
                // Send SMS notification
                await sendNotificationSMS(msg_obj);
              }
            }
          
            console.log('GRM Officials:', grm_officials_names, grm_officials);
          
          } catch (error) {
            console.error('Failed to retrieve GRM officials:', error);
          }
          



        }

        if (newStatus == 'Returned') {
          const grm_officials = [];
          const grm_officials_names = [];
        
          try {
            let targetSettlementId = null;
            let targetCountyId = null;
        
            // Determine the target level
            if (current_level === 'settlement') {
              // If the user is at county level, return to settlement level
              targetSettlementId = grievance.settlement_id;
            } else if (current_level === 'county') {
              // If the user is at national level, return to county level
              targetCountyId = grievance.county_id;
            }
        
            console.log('targetSettlementId',  targetSettlementId)
            console.log('targetCountyId',  targetSettlementId)
            if (!targetSettlementId && !targetCountyId) {
              console.warn('No valid target level found for returning grievance.');
              return;
            }
        
           
            const whereConditions = {
              roleid: 4, // GRM Role
            };
            
            const orConditions = [];
            
            // Add conditions only if values exist
            if (targetSettlementId) {
              orConditions.push({ settlement_id: targetSettlementId.toString() });
            }
            if (targetCountyId) {
              orConditions.push({ county_id: targetCountyId.toString() });
            }
            // Always include national level match
             
            if (orConditions.length > 0) {
              whereConditions[Op.or] = orConditions;
            }

            console.log('orConditions',orConditions)
            
            const grms = await Users.findAll({
              include: [
                {
                  model: UserRoles,
                  where: whereConditions,
                },
              ],
            });
            
          
            for (const grm of grms) {
              if (grm.name) {
                grm_officials_names.push(grm.name);
              }

              console.log('grm_officials_names',grm_officials_names)
          
              if (grm.phone) {
                const msg = `A grievance has been returned to your level for review and  action. Please address accordingly.`;
                
                const msg_obj = {
                  message: msg,
                  phone: grm.phone,
                  grievance_id: grievance.id,
                  grv_code: grievance.code,
                  status: grievance.status
                };
          
                // Send SMS notification
                await sendNotificationSMS(msg_obj);
              }
            }
        
            console.log('GRM Officials:', grm_officials_names, grm_officials);
        
          } catch (error) {
            console.error('Failed to return grievance:', error);
          }
        }
        
    
        if (newStatus == 'Referred') {
          const grm_officials = [];
          const grm_officials_names = [];
        
          try {
            

            const whereConditions = {
              userid: req.body.reffered_to_officer, // GRM Role
            };
            
            const grms = await Users.findAll({
              include: [
                {
                  model: UserRoles,
                  where: whereConditions,
                },
              ],
            });
            
            console.log('grms',grms)

            for (const grm of grms) {
              if (grm.name) {
                grm_officials_names.push(grm.name);
              }

              console.log('grm_officials_names',grm_officials_names)
          
              if (grm.phone) {
                const msg = ` Has been referred to you  level for review and  action. Please address accordingly.`;
                
                const msg_obj = {
                  message: action,
                  phone: grm.phone,
                  grievance_id: grievance.id,
                  grv_code: grievance.code,
                  status: grievance.status
                };
          
                // Send SMS notification
                await sendNotificationSMS(msg_obj);
              }
            }
        
            console.log('GRM Officials:', grm_officials_names, grm_officials);
        
          } catch (error) {
            console.error('Failed to return grievance:', error);
          }
        }
        // Update the grievance status
        grievance.status = newStatus;
        grievance.current_level = current_level;
        grievance.reffered_to_officer = req.body.reffered_to_officer;

        // Auto-populate date fields when status changes to Resolved or Closed
        if (newStatus === 'Resolved' ) {
          grievance.date_resolved = new Date();
          // Save the resolution (action taken) when grievance is resolved
          if (req.body.resolution) {
            grievance.resolution = req.body.resolution;
          } else if (action) {
            // Fallback to action if resolution is not provided
            grievance.resolution = action;
          }
        } else if (newStatus === 'Closed' ) {
          grievance.date_closed = new Date();
        }

        await grievance.save(); // Save the updated grievance

        let msg_obj = {}
        msg_obj.message =  action;
        msg_obj.type = 'Notification'
        msg_obj.phone = grievance.phone
        msg_obj.grv_code = grievance.code
        msg_obj.status = grievance.newStatus
        msg_obj.grievance_id = grievance.id
        msg_obj.sender_id = req.body.action_by
        msg_obj.status = newStatus

        console.log('Grievance ---->',msg_obj)
 
        if (newStatus != 'Referred') {
      // Dont infrom the complainant that the grevance has been referred to an offcer
          sendNotificationSMS(msg_obj)
         }
      

        // Return success message
        return res.status(200).send({
          code: '0000',
          message: 'Grievance status updated successfully',
          data: {
            grievance: grievance,
            code: grievance.code,
            date_reported: grievance.date_reported,
            status: grievance.status, // The updated status of the grievance
          },
        });
      } catch (error) {
        console.error('Error updating grievance status:', error);

      


        return res.status(500).send({
          code: '9999',
          message: 'Unable to update grievance status. Please try again later.',
        });
      }
    };
 
 

 
    exports.updateGrievance = async (req, res) => {
      try {
        const user = req.thisUser;
        const currentUserRoles = await user.getRoles(getActiveRolesGetOptions());
        const hasSuperAdminRole = currentUserRoles.some(role => role.name === 'super_admin');
        const hasGRMRole = currentUserRoles.some(role => role.name === 'grm' || role.name === 'gbv' || role.name === 'admin' || role.name === 'staff');
    
        if (!hasGRMRole && !hasSuperAdminRole) {
          return res.status(403).send({
            code: '9999',
            message: 'Unauthorized access to update grievances denied',
          });
        }
    
        const grievanceCode = req.body.code;
        let updatedData = req.body.updatedData;
    
        if (!grievanceCode || !updatedData) {
          return res.status(400).send({
            code: '1001',
            message: 'Grievance code and update data are required',
          });
        }
    
        const grievance = await Grievance.findOne({
          where: {
            code: {
              [Op.iLike]: `%${grievanceCode}%`,
            },
          },
        });
    
        if (!grievance) {
          return res.status(404).send({
            code: '1002',
            message: 'No grievance found for the given code',
          });
        }
    
        // Encrypt sensitive fields if provided in updatedData
        if (updatedData.name) {
          //updatedData.name = encryptData(updatedData.name);

          updatedData.name = Sequelize.fn('PGP_SYM_ENCRYPT', updatedData.name, process.env.AES_KEY);

        }
        if (updatedData.national_id) {
       //   updatedData.national_id = encryptData(updatedData.national_id);
          updatedData.national_id = Sequelize.fn('PGP_SYM_ENCRYPT', updatedData.national_id, process.env.AES_KEY);

        }
    
        updateGrievanceHistory(grievance.id, updatedData, req.thisUser.id, 'Edit');

        
        Object.assign(grievance, updatedData);
        await grievance.save();
    
        const msg_obj = {
          message: 'Your grievance has been updated. Please check for details.',
          type: 'Notification',
          phone: grievance.phone,
          grv_code: grievance.code,
          status: grievance.status,
          grievance_id: grievance.id,
          sender_id: req.body.action_by,
        };
    
       // await sendNotificationSMS(msg_obj);
    



        return res.status(200).send({
          code: '0000',
          message: 'Grievance updated successfully',
          data: grievance,
        });
      } catch (error) {
        console.error('Error updating grievance:', error);
        return res.status(500).send({
          code: '9999',
          message: 'Unable to update grievance. Please try again later.',
        });
      }
    };
    

 exports.xbulkUpdateReferredToOfficer = async (req, res) => {
      try {
        const user = req.thisUser;
        const currentUserRoles = await user.getRoles(getActiveRolesGetOptions());
        const hasSuperAdminRole = currentUserRoles.some(role => role.name === 'super_admin');
        const hasGRMRole = currentUserRoles.some(role => role.name === 'grm' || role.name === 'gbv' || role.name === 'admin' || role.name === 'staff');
    
        if (!hasGRMRole && !hasSuperAdminRole) {
          return res.status(403).send({
            code: '9999',
            message: 'Unauthorized access denied for updating grievances',
          });
        }
    
        const { updates } = req.body;
    
        if (!Array.isArray(updates) || updates.length === 0) {
          return res.status(400).send({
            code: '1001',
            message: 'An array of updates is required',
          });
        }
    
        const updatedGrievances = [];
    
        for (const update of updates) {
          const { grievance_id, reffered_to_officer,new_status } = update;
    
          if (!grievance_id || !reffered_to_officer) continue;
    
          let grievance = await Grievance.findByPk(grievance_id);
          if (!grievance) continue;
    
          grievance.reffered_to_officer = reffered_to_officer;
          grievance.status = new_status;
          await grievance.save();
    
          const fullGrievance = await Grievance.findByPk(grievance_id);
    
          await updateGrievanceHistory(grievance_id, fullGrievance.toJSON(), user.id, 'Referred');
    
          updatedGrievances.push(fullGrievance);
        }
    
        return res.status(200).send({
          code: '0000',
          message: `${updatedGrievances.length} grievance(s) referred successfully`,
          data: updatedGrievances,
        });
    
      } catch (error) {
        console.error('Bulk referral error:', error);
        return res.status(500).send({
          code: '9999',
          message: 'An error occurred while updating referrals',
        });
      }
    };

exports._bulkUpdateReferredToOfficer = async (req, res) => {
      try {
        const user = req.thisUser;
        const currentUserRoles = await user.getRoles(getActiveRolesGetOptions());
        const hasSuperAdminRole = currentUserRoles.some(role => role.name === 'super_admin');
        const hasGRMRole = currentUserRoles.some(role => role.name === 'grm' || role.name === 'gbv' || role.name === 'admin' || role.name === 'staff');
    
        if (!hasGRMRole && !hasSuperAdminRole) {
          return res.status(403).send({
            code: '9999',
            message: 'Unauthorized access denied for updating grievances',
          });
        }
    
        const { updates } = req.body;
    
        if (!Array.isArray(updates) || updates.length === 0) {
          return res.status(400).send({
            code: '1001',
            message: 'An array of updates is required',
          });
        }
    
        const updatedGrievances = [];
        const grievanceCodes = [];
        let officerId = null;
    
        for (const update of updates) {
          const { grievance_id, reffered_to_officer,reffered_to_support_staff, new_status } = update;
    
          if (!grievance_id || !reffered_to_officer) continue;
    
          let grievance = await Grievance.findByPk(grievance_id);
          if (!grievance) continue;
    
          grievance.reffered_to_officer = reffered_to_officer;
          grievance.reffered_to_support_staff = reffered_to_support_staff;
          grievance.status = new_status;
          await grievance.save();
    
          const fullGrievance = await Grievance.findByPk(grievance_id);
          await updateGrievanceHistory(grievance_id, fullGrievance.toJSON(), user.id, 'Referred');
    
          updatedGrievances.push(fullGrievance);
          grievanceCodes.push(fullGrievance.code);
    
          if (!officerId) officerId = reffered_to_officer;
        }
    
        //Send Notii
        if (officerId && grievanceCodes.length > 0) {
          const officer = await Users.findByPk(officerId);
          if (officer && officer.phone) {
            // Build links for each grievance
            const baseUrl = 'https://kesmis.go.ke/#/status';
            const grievanceLinks = updatedGrievances.map(grv =>
              `${grv.code}: ${baseUrl}/${grv.id}`
            ).join('\n');
        
            const message = `You have been referred these grievance(s) for review and action:\n${grievanceLinks}`;
        
            // Send SMS
            sendNotificationSMS({
              grievance_id: updatedGrievances[0].id,
              phone: officer.phone,
              grv_code: grievanceCodes.join(', '),
              message,
              sender_id: user.id,
              type: 'Referral',
              status: 'Pending',
            });
          }
        }
        
    
        return res.status(200).send({
          code: '0000',
          message: `${updatedGrievances.length} grievance(s) referred successfully`,
          data: updatedGrievances,
        });
    
      } catch (error) {
        console.error('Bulk referral error:', error);
        return res.status(500).send({
          code: '9999',
          message: 'An error occurred while updating referrals',
        });
      }
    };
    
    exports.bulkUpdateReferredToOfficer = async (req, res) => {
      try {
        const user = req.thisUser;
        const currentUserRoles = await user.getRoles(getActiveRolesGetOptions());
        const hasSuperAdminRole = currentUserRoles.some(r => r.name === 'super_admin');
        const hasGRMRole = currentUserRoles.some(r =>
          ['grm', 'gbv', 'admin', 'staff'].includes(r.name)
        );
        if (!hasGRMRole && !hasSuperAdminRole) {
          return res.status(403).send({
            code: '9999',
            message: 'Unauthorized access denied for updating grievances',
          });
        }
    
        const { updates } = req.body;
        if (!Array.isArray(updates) || updates.length === 0) {
          return res.status(400).send({
            code: '1001',
            message: 'An array of updates is required',
          });
        }
    
        const updatedGrievances = [];
        const grievanceCodes      = [];
        const officerIds          = new Set();
        const supportStaffIds     = new Set();
    
        // 1) Apply all updates
        for (const u of updates) {
          const {
            grievance_id,
            reffered_to_officer,
            reffered_to_support_staff,
            new_status
          } = u;
    
          if (!grievance_id || !reffered_to_officer) continue;
    
          const grv = await Grievance.findByPk(grievance_id);
          if (!grv) continue;
    
          grv.reffered_to_officer         = reffered_to_officer;
          grv.reffered_to_support_staff   = reffered_to_support_staff;
          grv.status                      = new_status;
          await grv.save();
    
          const full = await Grievance.findByPk(grievance_id);
          await updateGrievanceHistory(
            grievance_id,
            full.toJSON(),
            user.id,
            'Referred'
          );
    
          updatedGrievances.push(full);
          grievanceCodes.push(full.code);
    
          officerIds.add(reffered_to_officer);
    
          // — flatten support-staff array if needed —
          if (Array.isArray(reffered_to_support_staff)) {
            reffered_to_support_staff.forEach(id => supportStaffIds.add(id));
          } else if (reffered_to_support_staff) {
            supportStaffIds.add(reffered_to_support_staff);
          }
        }
    
        // 2) Build common message
        if (grievanceCodes.length > 0) {
          const baseUrl = 'https://kesmis.go.ke/#/status';
          const links   = updatedGrievances
            .map(g => `${g.code}: ${baseUrl}/${g.id}`)
            .join('\n');
    
          const commonMessage = 
            `You have been referred these grievance(s) for review and action:\n${links}`;
    
          // 3) Send to each main officer
          let mainofficerName
          for (let oid of officerIds) {
            const off = await Users.findByPk(oid);
            mainofficerName=off.name
            if (off?.phone) {
              await sendNotificationSMS({
                grievance_id: updatedGrievances[0].id,
                phone       : off.phone,
                grv_code    : grievanceCodes.join(', '),
                message     : commonMessage,
                sender_id   : user.id,
                type        : 'Referral',
                status      : 'Pending',
              });
            }
          }
    
          // 4) Send to each support staff by ID
          for (let sid of supportStaffIds) {
            const staff = await Users.findByPk(sid);
            if (staff?.phone) {
              const supportMessage =
                `Hello ${staff.name},\n` +
                `You are requested to support  ${mainofficerName}  in resolution these grievance(s):\n${links}`;
    
              await sendNotificationSMS({
                grievance_id: updatedGrievances[0].id,
                phone       : staff.phone,
                grv_code    : grievanceCodes.join(', '),
                message     : supportMessage,
                sender_id   : user.id,
                type        : 'Support Referral',
                status      : 'Pending',
              });
            }
          }
        }
    
        return res.status(200).send({
          code   : '0000',
          message: `${updatedGrievances.length} grievance(s) referred successfully`,
          data   : updatedGrievances,
        });
    
      } catch (error) {
        console.error('Bulk referral error:', error);
        return res.status(500).send({
          code   : '9999',
          message: 'An error occurred while updating referrals',
        });
      }
    };
    
    
 exports.getGrievancesByKeyword = async (req, res) => {
      console.log('--------------------------------------------getGrievancesByKeyword');
      const user = req.thisUser;
    
      const currentUserRoles = await user.getRoles(getActiveRolesGetOptions());
    
      const searchString = req.body.searchString;
      const userCounty = user.county_id;
      const filters = req.body.filters || [];
      const filterValues = req.body.filterValues || [];
      const filterFunctions = req.body.filterFunctions || [];
      let limit = req.body.limit || 10;
      let page = req.body.page || 1;
    
      console.log('Current >>>> User Roles:', currentUserRoles);
    
      // Initialize findAndCountOptions with common properties
      const findAndCountOptions = {
        where: {
          isgbv: { [Op.not]: true }, // Exclude grievances where isGBV is true

        },
        limit: limit,
        offset: (page - 1) * limit,
      };



       filters.forEach((filter, index) => {
    let value = filterValues[index];
    let functionType = filterFunctions[index] || 'eq';

    const operatorMap = {
      eq: op.eq,
      ne: op.ne,
      like: op.like,
      iLike: op.iLike,
      in: op.in,
      notIn: op.notIn,
      gt: op.gt,
      lt: op.lt,
      gte: op.gte,
      lte: op.lte,
      between: op.between,
    };

    if (functionType === 'between') {
      if (!Array.isArray(value) || value.length !== 2) {
        return;
      }
      const a = value[0] instanceof Date ? value[0] : new Date(value[0])
      const b = value[1] instanceof Date ? value[1] : new Date(value[1])
      if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
        return
      }
      findAndCountOptions.where[filter] = { [op.between]: [a, b] };
      return;
    }

    if (Array.isArray(value)) {
      if (functionType === 'eq') {
        if (value.length === 1) {
          value = value[0];
        } else {
          functionType = 'in';
        }
      } else if (functionType === 'ne') {
        if (value.length === 1) {
          value = value[0];
        } else {
          functionType = 'notIn';
        }
      }
    }

    const operator = operatorMap[functionType] || op.eq;

    if (functionType === 'in' && Array.isArray(value)) {
      findAndCountOptions.where[filter] = { [op.in]: value };
    } else if (functionType === 'notIn' && Array.isArray(value)) {
      findAndCountOptions.where[filter] = { [op.notIn]: value };
    } else if (Array.isArray(value)) {
      findAndCountOptions.where[filter] = { [operator]: value };
    } else {
      findAndCountOptions.where[filter] = { [operator]: value };
    }
  });



    
  const attributes = getSanitizedGrievanceAttributes();
      attributes.push(
        [Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.name'), 'bytea'), process.env.AES_KEY), 'name'],
        [Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.national_id'), 'bytea'), process.env.AES_KEY), 'national_id']
      );
    
      findAndCountOptions.attributes = attributes;
    
     // const hasSuperAdminRole = currentUserRoles.some(role => role.name === 'super_admin');
      const hasSuperAdminRole = currentUserRoles.some(role => ['super_admin', 'root_admin','admin','staff'].includes(role.name));

      //const hasGRMRole = currentUserRoles.some(role => role.name === 'grm' || role.name === 'gbv');
      const hasGRMRole = currentUserRoles.some(role => role.name === 'grm' || role.name === 'gbv' || role.name === 'staff' || role.name === 'admin');

      if (!hasGRMRole && !hasSuperAdminRole) {
        return res.status(200).send({
          data: [],
          total: 0,
          code: '9999',
          message: 'Unauthorized access to grievances denied',
        });
      }
    
      if (!hasSuperAdminRole) {
        const hasCountyAdminRole = currentUserRoles.some(role => role.user_roles.location_level === 'county');
        const countyAdminRole = currentUserRoles.find(role => role.user_roles.location_level === 'county');
        if (hasCountyAdminRole) {
          const countyId = countyAdminRole?.user_roles?.county_id;
          if (countyId) {
            findAndCountOptions.where.county_id = countyId;
            console.log('Applying county filter:', countyId);
          }
        }
      }
    
      if (searchString) {
        const searchConditions = [
          Sequelize.where(
            Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.name'), 'bytea'), process.env.AES_KEY),
            { [Op.iLike]: `%${searchString}%` }
          ),
          Sequelize.where(
            Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.national_id'), 'bytea'), process.env.AES_KEY),
            { [Op.iLike]: `%${searchString}%` }
          ),
        ];
    
        ['code', 'description', 'phone', 'plea', 'nature'].forEach(field => {
          searchConditions.push({
            [field]: { [Op.iLike]: `%${searchString}%` },
          });
        });
    
        findAndCountOptions.where[Op.or] = searchConditions;
      }
    
      if (hasSuperAdminRole) {
        delete findAndCountOptions.where.county_id;
      }
    
      console.log(findAndCountOptions);
    
      const associatedModels = req.body.associated_multiple_models || [];
      if (associatedModels.length > 0) {
        findAndCountOptions.include = associatedModels.map(model => {
          if (model === 'users') {
            // Special handling for users association with alias
            return { 
              model: db.models[model],
              as: 'users',
              required: false // Left join to include grievances without referred officers
            };
          } else {
            return { model: db.models[model] };
          }
        });
      }
    
      Grievance.findAndCountAll(findAndCountOptions)
        .then(({ count, rows: grievances }) => {
          console.log('Total grievances 3:', count);
          res.status(200).send({
            data: grievances,
            total: count,
            code: '0000',
            message: 'Grievances retrieved successfully',
          });
        })
        .catch(error => {
          console.error('Error fetching grievances 1:', error);
          res.status(500).send({ message: 'Unable to retrieve grievances. Please try again later.' });
        });
    };
    

 exports.downloadFile = async (req, res) => {
      console.log("Received files:", req.body);

      let filename = req.body.filename;
      if (req.body.doc_id != null && req.body.doc_id !== '') {
        try {
          const gd = await db.models.grievance_document.findByPk(Number(req.body.doc_id));
          if (gd && gd.name) filename = gd.name;
        } catch (e) {
          console.error('grievance_document lookup in downloadFile', e);
        }
      }

      if (!filename || String(filename).trim() === '') {
        return res.status(500).send({
          message: 'File not found.',
          code: '0000'
        });
      }

      const safeName = path.basename(String(filename));
      const primaryPath = path.join(uploadDir, safeName);
      const legacyPath = path.join(grievanceUploadDirLegacy, safeName);
      const pathsToTry =
        path.normalize(primaryPath) === path.normalize(legacyPath)
          ? [primaryPath]
          : [primaryPath, legacyPath];

      const trySendFrom = (i) => {
        if (i >= pathsToTry.length) {
          db.models.document.destroy({ where: { name: req.body.filename } }).then(() => {
            console.log('succeed');
            res.status(500).send({
              message: 'File not found.',
              code: '0000',
            });
          });
          return;
        }
        const uploadedFile = pathsToTry[i];
        console.log(uploadedFile);
        fs.access(uploadedFile, fs.constants.F_OK, (err) => {
          if (err) {
            console.log(err);
            trySendFrom(i + 1);
            return;
          }
          res.sendFile(path.resolve(uploadedFile), function (sendErr) {
            if (sendErr) {
              console.log(sendErr);
              res.status(500).send({
                message: 'Download failed. Error occurred.',
                code: '0000',
              });
            }
          });
        });
      };

      trySendFrom(0);
    };






    ////========================================================================Triggers ============================================================
    ////=============================================================================================================================================
    ////=============================================================================================================================================
    ////=============================================================================================================================================

 function getDaysToExpiry(expiryDate) {

     console.log('expiryDate >>>',expiryDate)
      const now = new Date(); // Current date and time
      const expiry = new Date(expiryDate); // Convert expiryDate string to a Date object
    
      // Calculate the difference in milliseconds
      const diffTime = expiry - now;
    
      // Convert milliseconds to days
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // 1 day = 24 hours * 60 minutes * 60 seconds * 1000 ms
    
      return diffDays;
    }


    async function getSettlementDetails(settlement_id) {
      try {
        // Find the user with the given grievance level and location ID
        const sett = await Settlement.findOne({
          where: {
            id: settlement_id,   // Grievance level
          },
          include: [
            {
              model: db.models.county, // Assuming 'User' is the name of your user model
              attributes: ['id', 'name' ] // Adjust based on the attributes of your User model
            },
            
          ], 
          raw: true,
          nest : true
        });
    
        if (!sett) {
          return null; // No user found
        }
    
        return sett; // Return the user role record with user data
    
      } catch (error) {
        console.error("Error finding sett:", error.message);
        throw error;
      }
    
    }

  async function findUserByGrievanceLevelAndLocation(grievanceLevel, locationId) {
      try {
        // Find the user with the given grievance level and location ID
        const userRole = await UserRoles.findAll({
          where: {
            location_level: grievanceLevel,   // Grievance level
            location_id: locationId,           // Location ID
            roleid: 4           // GRM=4
          },
          include: [
            {
              model: User, // Assuming 'User' is the name of your user model
              attributes: ['id', 'name', 'email','phone'] // Adjust based on the attributes of your User model
            },
            
          ], 
          raw: true,
          nest : true
        });
    
        if (!userRole) {
          return null; // No user found
        }
    
        return userRole; // Return the user role record with user data
    
      } catch (error) {
        console.error("Error finding user:", error.message);
        throw error;
      }
    }



    const nodemailer = require('nodemailer')

      // Configure the transporter
      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'kisip.mis@gmail.com',
          pass: 'ycoxaqavmfiqljjg'
        }
      }) // initialize create Transport service


      // Asynchronous function to send emails
      async function sendEmail(emails, message) {
        try {
          // Validate email recipients


           // Email validation regex
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            // Filter out invalid email addresses
            const validEmails = emails.filter(email => email && typeof email === 'string' && emailRegex.test(email));


           // Filter out invalid email addresses
         //   const validEmails = emails.filter(email => email && typeof email === 'string');

            // Validate email recipients
            if (validEmails.length === 0) {
              console.log("No valid email recipients provided. Skipping email.");
              return; // Exit the function if no valid email addresses remain
            }

          if (!emails || emails.length === 0) {
            console.log("No email recipients provided. Skipping email.");
            return; // Exit the function if the email list is empty
          }
      
          // Log the inputs
          console.log("Sending emails to:", emails);
          console.log("Message content:", message);
      
          // Prepare the email options
          const mailOptions = {
            from: 'kisip.mis@gmail.com', // Sender address
            to: emails.join(","), // Comma-separated list of recipients
            subject: message.subject || "Notification", // Email subject
            text: message.text || "", // Plain text content
            html: message.html || "", // HTML content (optional)
          };
      
          // Send the email
          const info = await transporter.sendMail(mailOptions);
          console.log("Email sent successfully:", info.messageId);
        } catch (error) {
          console.error("Error sending email:", error);
        }
      }
      


    // Function to check grievances and send notifications
    async function checkGrievances() {
      try {
        // Query grievances with non-null status_expiry_date
        const grievances = await Grievance.findAndCountAll({
          where: {
            status_expiry_date: { [Op.ne]: null },
          },
        });
    
        // Loop through grievances and process notifications
        for (const grievance of grievances.rows) {
              const {
                id,
                code,
                current_status_date,
                current_level,
                settlement_id,
                county_id,
                status_expiry_date,
              } = grievance;
        
              // Calculate days to expiry
              const expiryDate = status_expiry_date;
              const daysToExpiry = getDaysToExpiry(expiryDate);
        
              console.log(
                'Processing grievance:',
                `ID: ${id}, Days to Expiry: ${daysToExpiry}, Settlement ID: ${settlement_id}`
              );
        
              // Get grievance settlement details
              const settlement = await getSettlementDetails(settlement_id);
        
              // Check if grievance has expired
              if (daysToExpiry < 0) {
                console.log(
                  'Expired grievance:',
                  `ID: ${grievance.id}, Days to Expiry: ${daysToExpiry}, Settlement: ${settlement.id}, Name: ${settlement.name} , Level: ${current_level}`
                );
              }
          
          
              // Fetch officers based on grievance level and location
              let user;
              if (current_level === 'settlement') {
                user = await findUserByGrievanceLevelAndLocation(
                  current_level,
                  settlement_id.toString()
                );
              } else if (current_level === 'county') {
                user = await findUserByGrievanceLevelAndLocation(
                  current_level,
                  county_id.toString()
                );
              } 

 
               // Process officer details if users are found
              let officer_emails = [];
              let officer_phones = [];
              let officer_names = [];

              if (user?.length > 0) {
                officer_emails = user.map((role) => role.user.email);
                officer_phones = user.map((role) => role.user.phone);
                officer_names = user.map((role) => role.user.name);

                console.log('Officers:', officer_emails, officer_phones, officer_names);
              }



              // Fetch superior officers based on grievance level
              let superior_emails = [];
              let superior_phones = [];
              let superior_names = [];

              if (current_level === 'settlement') {
                user = await findUserByGrievanceLevelAndLocation(
                  'county',
                  county_id.toString()
                );
              } else if (current_level === 'county') {
                user = await findUserByGrievanceLevelAndLocation('national', null);
              }

              if (user?.length > 0) {
                superior_emails = user.map((role) => role.user.email);
                superior_phones = user.map((role) => role.user.phone);
                superior_names = user.map((role) => role.user.name);

                console.log(
                  'Superiors:',
                  superior_emails,
                  superior_phones,
                  superior_names
                );
              }



                  // Notify officers based on the days to expiry
                  if (daysToExpiry > 0 && daysToExpiry < 8) {
                    console.log(`Grievance will expire in ${daysToExpiry} days.`);

                    const msg = {
                      subject: 'Grievance Processing Time Alert',
                      html: `
                        <p>This is a system-generated notification to inform you that the grievance assigned to your desk (Ref: <strong>${code}</strong>, in <strong>${settlement.name}</strong>, <strong>${settlement.county.name} County</strong>) is nearing the allowed processing time limit (${daysToExpiry} days remaining).</p>
                        <p>Kindly take the necessary steps to address this matter promptly.</p>
                        <p>Best regards,<br>System Administrator</p>
                      `,
                    };

                    console.log('Grievance Processing Time Alert',officer_emails)
                    if (officer_emails.length > 0) {
                      sendEmail(officer_emails, msg);
                    }
                  } else if (daysToExpiry === 0) {
                    console.log('Grievance expires today.');
                  } else if (daysToExpiry === 1) {
                    const message_grc = `Alert: Grievance Ref: ${code} is nearing the expiry of allowed duration. Please review it immediately.`;
                    console.log(message_grc);
                  } else if (daysToExpiry < 0) {
                    console.log(`Grievance expired ${Math.abs(daysToExpiry)} days ago.`);

                    const msg = {
                      subject: 'Urgent: Grievance Escalation for Immediate Action',
                      html: `
                        <p>This is a system-generated notification to inform you that the grievance assigned to your desk (Ref: <strong>${code}</strong>, in <strong>${settlement.name}</strong>, <strong>${settlement.county.name} County</strong>) has exceeded the allowed processing time limit.</p>
                        <p>Kindly take the necessary steps to address this matter promptly.</p>
                        <p>Best regards,<br>System Administrator</p>
                      `,
                    };

                    if (officer_emails.length > 0) {
                    sendEmail(officer_emails, msg); 

                    }


                    if (officer_phones.length > 0) {
                      // Loop through the officer_phones array
                      officer_phones.forEach(phone => {

                        let msg_obj = {}
                        msg_obj.message = `This is a system-generated notification to inform you that the grievance assigned to your desk (Ref:${code}, in ${settlement.name}, ${settlement.county.name} County) has exceeded the allowed processing time limit. Kindly take the necessary steps to address this matter promptly.Best regards. System Administrator`;
                        msg_obj.type = 'Reminder'
                        msg_obj.phone = phone
                        msg_obj.grv_code = grievance.code
                        msg_obj.status = grievance.status
                        msg_obj.grievance_id = grievance.id
                       // msg_obj.sender_id = req.body.action_by
                        msg_obj.status = grievance.status
                
                        console.log('Grievance ---->',msg_obj)
                          // Send SMS to each phone number - Remember to Switch on Later
                          //  sendNotificationSMS(msg_obj);
                      });
                  }
                  
                  
                 

                    const escalate_msg = {
                      subject: 'Urgent: Grievance Escalation for Immediate Action',
                      html: `
                        <p>This is a system-generated notification to inform you that the grievance assigned to <strong>${officer_names}</strong> (Ref: <strong>${code}</strong>, located in <strong>${settlement.name}</strong>, <strong>${settlement.county.name} County</strong>) has exceeded the allowed processing time.</p>
                        <p>As this grievance has overstayed at the assigned desk, your immediate attention and action are required to address this matter promptly.</p>
                        <p>Best regards,<br>System Administrator</p>
                      `,
                    };

                    if (superior_emails.length > 0) {
                       sendEmail(superior_emails, escalate_msg);
                    }


                    
                    if (superior_phones.length > 0) {
                      // Loop through the superior_phones array
                      superior_phones.forEach(phone => {

                        let msg_obj = {}
                        msg_obj.message = `This is a system-generated notification to inform you that the grievance assigned to ${officer_names} (Ref: ${code}, located in ${settlement.name},${settlement.county.name} county) has exceeded the allowed processing time. As this grievance has overstayed at the assigned desk, your immediate attention and action are required to address this matter promptly.Best regards,System Administrator`;
                        msg_obj.type = 'Escalation'
                        msg_obj.phone = phone
                        msg_obj.grv_code = grievance.code
                        msg_obj.status = grievance.status
                        msg_obj.grievance_id = grievance.id
                       // msg_obj.sender_id = req.body.action_by
                        msg_obj.status = grievance.status
                
                        console.log('Grievance ---->',msg_obj)
                          // Send SMS to each phone number - Remember to Switch on Later
                          //  sendNotificationSMS(msg_obj);
                      });
                  }
                  

                  }



        
               
            }
        
            console.log('All notifications processed successfully.');
          } catch (error) {
            console.error('Error checking grievances:', error.message);
          }
        }
         


    // Schedule the function to run every day at 8:00 AM
    // cron.schedule('0 8 * * *', () => {
    //   console.log('Running grievance check...');
    //   checkGrievances();
    // });

    // Schedule the function to run every  30 mins
  //   cron.schedule('*/1 * * * *', () => {
  //     console.log('Running grievance check... - Every 30 minutes');
  //     checkGrievances();
  // });
  
    
    // Schedule the function to run every  4 hours sec

    // cron.schedule('0 */4 * * *', () => {
    //   console.log('Running grievance check... - Every 4 Hours');
    //   checkGrievances();
    // });

        
      // Function to schedule the job
      const scheduleWeeklyJob = () => {
        // Generate a random day of the week (0 = Sunday, 6 = Saturday)
        const randomDay = Math.floor(Math.random() * 7);

        // Define the cron schedule for 9:00 AM on the random day
        const schedule = `0 9 * * ${randomDay}`;
        console.log(`Scheduling job for 9:00 AM on day ${randomDay} (0=Sunday, 6=Saturday)`);

        // Schedule the job
        cron.schedule(schedule, () => {
          console.log(`Running grievance check... - 9:00 AM on day ${randomDay}`);
          checkGrievances();

          // Reschedule for the next week after the job runs
          rescheduleJob();
        });
      };

      // Function to reschedule the job
      const rescheduleJob = () => {
        // Cancel all scheduled tasks
        cron.getTasks().forEach(task => task.destroy());

        // Schedule a new job
        scheduleWeeklyJob();
      };

      // Initial scheduling
      scheduleWeeklyJob();


 async function updateGrievanceHistory(grievance_id, updatedData, userId, change_type) {
        let originalData;
      
        if (change_type === 'Delete') {
          // Use updatedData as both "before" and "after" since the grievance won't be found
          originalData = updatedData;
        } else {
          const grievance = await db.models.grievance.findByPk(grievance_id);
          if (!grievance) {
            throw new Error('grievance not found');
          }
          originalData = grievance.toJSON();
        }
      
        
        // Save changes in history
        await db.models.grievance_history.create({
          //grievance_id:  change_type === 'Delete' ? null : grievance_id,
          grievance_id:  grievance_id,
          changed_by: userId,
          change_type: change_type,
          changes: {
            before: originalData,
            after: change_type === 'Delete' ? originalData : updatedData,
          },
        });
      
        // Update the grievance record if not a delete operation
        if (change_type !== 'Delete') {
          return await db.models.grievance.update(updatedData, { where: { id: grievance_id } });
        }
      }

 

      
  

      exports.deleteCascadeGrievance = async (req, res) => {
        try {
            const { model, id, permanentDelete } = req.body;
    
            console.log("Deleting", model, "with ID", id);
    
            // Validate input
            if (!model || !id) {
                return res.status(400).send({
                    message: "Model name and record ID are required.",
                });
            }
    
            // Get the model dynamically
            const Model = db.models[model];
    
            if (!Model) {
                return res.status(404).send({
                    message: "Invalid model name.",
                });
            }
    
            // Find the record by ID
            const record = await Model.findByPk(id);
    
            if (!record) {
                return res.status(404).send({
                    message: `${model} record not found.`,
                });
            }
    
            const deleteAssociatedRecords = async () => {
              const associations = Model.associations;

              for (const assocName in associations) {
                const association = associations[assocName];

                if (association.target) {
                  const relatedModel = association.target;

                  switch (association.associationType) {
                    case "HasMany":
                    case "HasOne":
                      await relatedModel.destroy({
                        where: { [association.foreignKey]: id },
                      });
                      break;
                    case "BelongsToMany":
                      const throughTable = association.throughModel || association.through;
                      await throughTable.destroy({
                        where: { [association.foreignKey]: id },
                      });
                      break;
                    case "BelongsTo":
                      await relatedModel.update(
                        { [association.foreignKey]: null },
                        { where: { [association.foreignKey]: id } }
                      );
                      break;
                    default:
                      console.log(`Unhandled association type: ${association.associationType}`);
                  }
                }
              }
            }

            let allowPermanentGrievanceDelete = false
            if (permanentDelete) {
              const currentUser = req.thisUser || (req.userid ? await User.findByPk(req.userid) : null)
              allowPermanentGrievanceDelete = await isRootAdminUser(currentUser)

              if (!allowPermanentGrievanceDelete) {
                return res.status(403).send({
                  message: "Only root admins can permanently delete grievances."
                })
              }

              if (model !== 'grievance') {
                return res.status(400).send({
                  message: "Permanent delete is only supported for grievances."
                })
              }

              if (record.status !== 'Deleted') {
                return res.status(400).send({
                  message: "Grievance must be in Deleted status before permanent removal."
                })
              }
            }

            const shouldHardDeleteGrievance = model === 'grievance' && permanentDelete && allowPermanentGrievanceDelete

            // For grievance model, implement soft delete instead of hard delete
            if (model === 'grievance') {
              if (shouldHardDeleteGrievance) {
                console.log('Performing permanent delete for grievance...')
                await deleteAssociatedRecords()
                await record.destroy()
                console.log('Grievance permanently deleted')
              } else {
                console.log('Performing soft delete for grievance...');
                
                // Log the deletion action before updating the record
                // Convert record to JSON to ensure proper serialization
                await updateGrievanceHistory(record.id, record.toJSON(), req.thisUser.id, "Delete");
                
                // Update the grievance record to mark it as deleted
                await record.update({
                  status: 'Deleted',
                  current_status_date: new Date(),
                  status_expiry_date: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)) // 30 days from now
                });
                
                console.log('Grievance marked as deleted (soft delete)');
                
                // Note: All related records are preserved for audit purposes
                // grievance_histories, grievance_logs, grievance_documents, etc. remain intact
              }
            } else {
              // For other models, use the association-based approach
              await deleteAssociatedRecords()
            }

            // For non-grievance models, perform hard delete
            if (model !== 'grievance') {
              await record.destroy();
            }
    

            // Get GRM officials based on grievance location
            const grmOfficials = await Users.findAll({
              include: [
                {
                  model: UserRoles,
                  where: {
                    roleid: 4,
                    [Op.or]: [
                      { location_level: "national" },
                    ],
                  },
                },
              ],
            });

          // Send SMS notifications to GRM officials
          for (const grm of grmOfficials) {
            if (grm.phone) {
              const msg_obj = {
                message: 'The greivance has been deleted',
                phone: grm.phone,
                grievance_id: record.id,
                grv_code: record.code,
                status: record.status,
              };
              await sendNotificationSMS(msg_obj);
            }
          }

            const responseMessage =
              model === 'grievance'
                ? shouldHardDeleteGrievance
                  ? `${model} record permanently deleted successfully.`
                  : `${model} record soft deleted successfully.`
                : `${model} record deleted successfully.`

            res.status(200).send({
                message: responseMessage,
                data: record,
                code: "0000",
            });
        } catch (error) {
            console.error("Error deleting record:", error);
            res.status(500).send({
                message: "An error occurred while deleting the record.",
                error: error.message,
            });
        }
    };
    
      exports._revertEdits = async (req, res) => {
        const { history_id } = req.body;
    
        try {
            // Find the history record by primary key
            const history = await db.models.grievance_history.findByPk(history_id);
            if (!history) {
                return res.status(404).send({
                    message: 'History record not found',
                    code: '1001',
                });
            }
    
            const { grievance_id, changes } = history;
    
            // Ensure `changes.before` is properly formatted
            const beforeData = typeof changes.before === 'string' ? JSON.parse(changes.before) : changes.before;
    
            if (!beforeData) {
                return res.status(400).send({
                    message: 'Invalid history data',
                    code: '1002',
                });
            }
    
            // Check if the grievance exists
            let grievance = await db.models.grievance.findByPk(grievance_id);
            if (!grievance) {
                // If deleted, recreate it
                grievance = await db.models.grievance.create({
                    id: grievance_id, // Preserve original ID if necessary
                    ...beforeData,
                });
    
                await history.update({ status: 'Reverted' });
    
                return res.status(200).send({
                    message: 'Deleted grievance restored successfully.',
                    code: '0000',
                });
            }
    
            // If exists, update to its previous state
            await grievance.update(beforeData);
            await history.update({ status: 'Reverted' });
    
            res.status(200).send({
                message: 'Changes reverted successfully.',
                code: '0000',
            });
        } catch (error) {
            res.status(500).send({
                message: 'An error occurred while reverting edits: ' + error.message,
                code: '0004',
            });
        }
    };



    exports.revertEdits = async (req, res) => {
      const { history_id } = req.body;
  
      try {
          // Find the history record by primary key
          const history = await db.models.grievance_history.findByPk(history_id);
          if (!history) {
              return res.status(404).send({
                  message: 'History record not found',
                  code: '1001',
              });
          }
  
          let { grievance_id, changes } = history;
  
          // Ensure `changes.before` is properly formatted
          const beforeData = typeof changes.before === 'string' ? JSON.parse(changes.before) : changes.before;
  
          if (!beforeData || typeof beforeData !== 'object') {
              return res.status(400).send({
                  message: 'Invalid history data',
                  code: '1002',
              });
          }
  
          // Function to find `grievance_id` within the `before` JSONB object
          const extractGrievanceId = (obj) => {
              if (!obj || typeof obj !== 'object') return null;
  
              if (obj.id) return obj.id; // Direct match
              for (const key in obj) {
                  if (typeof obj[key] === 'object') {
                      const foundId = extractGrievanceId(obj[key]);
                      if (foundId) return foundId;
                  }
              }
              return null;
          };
  
          // If `grievance_id` is not valid, extract it from `beforeData`
          if (!grievance_id) {
              grievance_id = extractGrievanceId(beforeData);
          }
  
          if (!grievance_id) {
              return res.status(400).send({
                  message: 'Grievance ID not found in history record',
                  code: '1003',
              });
          }
  
          // Check if the grievance exists
          let grievance = await db.models.grievance.findByPk(grievance_id);
          if (!grievance) {
              // If deleted, recreate it
              grievance = await db.models.grievance.create({
                  id: grievance_id, // Preserve original ID
                  ...beforeData,
              });
  
              await history.update({ status: 'Reverted' });
  
              return res.status(200).send({
                  message: 'Deleted grievance restored successfully.',
                  code: '0000',
              });
          }
  
          // If exists, update to its previous state
          await grievance.update(beforeData);
          await history.update({ status: 'Reverted' });
  
          res.status(200).send({
              message: 'Changes reverted successfully.',
              code: '0000',
          });
      } catch (error) {
          console.error("Error reverting edits:", error);
          res.status(500).send({
              message: 'An error occurred while reverting edits: ' + error.message,
              code: '0004',
          });
      }
  };
  

 


exports.getGrievanceHistoryByGrievanceId = async (req, res) => {
  try {
      const { grievance_id, associated_multiple_models } = req.body;

      if (!grievance_id) {
          return res.status(400).send({
              message: "Grievance ID is required.",
              code: "1001",
          });
      }

      // Dynamically include associated models if provided
      let includeModels = [];
      if (associated_multiple_models && Array.isArray(associated_multiple_models)) {
          includeModels = associated_multiple_models.map(modelName => {
              if (db.models[modelName]) {
                  return { model: db.models[modelName] }; // Include only valid models
              }
              console.warn(`Warning: Model ${modelName} not found in database.`);
              return null;
          }).filter(Boolean); // Remove invalid models
      }

      // Fetch records where grievance_id matches directly
      let historyRecords = await db.models.grievance_history.findAll({
          where: { grievance_id: grievance_id },
          include: includeModels,
      });

      // Fetch additional records where grievance_id is NULL but might contain the ID in changes.before/after
      let additionalRecords = await db.models.grievance_history.findAll({
          where: { grievance_id: null },
          include: includeModels,
      });

      // Function to check if grievance_id exists in a nested JSON object
      const containsGrievanceId = (obj, grievance_id) => {
          if (!obj || typeof obj !== 'object') return false;

          return Object.values(obj).some(value => {
              if (typeof value === 'object' && value !== null) {
                  return containsGrievanceId(value, grievance_id); // Recursively check nested objects
              }
              return value?.toString() === grievance_id.toString(); // Compare ID values
          });
      };

      // Filter records where grievance_id appears in "before" or "after" fields
      additionalRecords = additionalRecords.filter(record => {
          const { changes } = record;
          return (
              containsGrievanceId(changes.before, grievance_id) ||
              containsGrievanceId(changes.after, grievance_id)
          );
      });

      // Combine results from both queries
      const allRecords = [...historyRecords, ...additionalRecords];

      if (allRecords.length === 0) {
          return res.status(404).send({
              message: "No grievance history found for the provided ID.",
              code: "1002",
          });
      }

      res.status(200).send({
          message: "Grievance history records retrieved successfully.",
          data: allRecords,
          code: "0000",
      });
  } catch (error) {
      console.error("Error retrieving grievance history:", error);
      res.status(500).send({
          message: "An error occurred while fetching grievance history.",
          error: error.message,
          code: "0004",
      });
  }
};



exports.updateGrievanceStatusByComplainant = async (req, res) => {
  try {
    const grievanceCode = req.body.code;
    const newStatus = req.body.new_status;
    const action = req.body.action;
    const current_level = req.body.current_level;
    const status_expiry_date = req.body.status_expiry_date;
    const current_status_date = req.body.current_status_date;

    console.log('Updating status..... newStatus', newStatus);
    console.log('Updating status..... current_level', current_level);

    if (!grievanceCode || !newStatus) {
      return res.status(400).send({
        code: '1001',
        message: 'Grievance code and new status are required',
      });
    }

    const findOptions = {
      where: {
        code: {
          [op.iLike]: `%${grievanceCode}%`,
        },
      },
    };

    const grievance = await Grievance.findOne(findOptions);

    if (!grievance) {
      return res.status(404).send({
        code: '1002',
        message: 'No grievance found for the given code',
      });
    }

    grievance.status = newStatus;
    grievance.current_level = current_level;
    grievance.status_expiry_date = status_expiry_date;
    grievance.current_status_date = current_status_date;


    await grievance.save();

    let msg_obj = {
      message: 'Your grievance has been successfully been escalated to the ' +current_level + ' team for action.' ,
      type: 'Notification',
      phone: grievance.phone,
      grv_code: grievance.code,
      status: newStatus,
      grievance_id: grievance.id,
      sender_id: req.body.action_by,
    };

    console.log('Grievance ---->', msg_obj);

    sendNotificationSMS(msg_obj);


    // ge the GRMS for ecalation 

    const grm_officials = [];
    const grm_officials_names = [];
    
    try {
      const whereConditions = {
        roleid: 4, // GRM Role
      };
      
      const orConditions = [];
      
      // Add conditions only if values exist
      if (current_level=='county') {
        orConditions.push({ county_id: grievance.county_id.toString() });
      }  
      else {
        // Always include national level match
        orConditions.push({ location_level: 'national' });
      
      }
  
    
      if (orConditions.length > 0) {
        whereConditions[Op.or] = orConditions;
      }
      
      const grms = await Users.findAll({
        include: [
          {
            model: UserRoles,
            where: whereConditions,
          },
        ],
      });
      
    
      for (const grm of grms) {
        if (grm.name) {
          grm_officials_names.push(grm.name);
        }
    
        if (grm.phone) {
          const msg = `A grievance has been escalated/referred for your action. Please review and act accordingly.`;
          
          const msg_obj = {
            message: msg,
            phone: grm.phone,
            grievance_id: grievance.id,
            grv_code: grievance.code,
            status: grievance.status
          };
    
          // Send SMS notification
          await sendNotificationSMS(msg_obj);
        }
      }
    
      console.log('GRM Officials:', grm_officials_names, grm_officials);
    
    } catch (error) {
      console.error('Failed to retrieve GRM officials:', error);
    }
    

    return res.status(200).send({
      code: '0000',
      message: 'Grievance has been escalated successfully',
      data: {
        grievance: grievance,
        code: grievance.code,
        date_reported: grievance.date_reported,
        status: grievance.status,
      },
    });
  } catch (error) {
    console.error('Error updating grievance status:', error);
    return res.status(500).send({
      code: '9999',
      message: 'Unable to update grievance status. Please try again later.',
    });
  }
};

// Export function
 


exports.xsendReminder = async (req, res) => {
  try {
  
    // Prepare the object for creation
    let obj = req.body;

    console.log("Here to Remind..")

    console.log('Log>>', obj)

       // Create the record
    const item = await db.models.grievance_log.create(obj);

    console.log('Created log:', item);

    res.status(200).send({
      data: item,
      code: '0000',
      message: 'Action Logged successfully.'
    });

  } catch (err) {
   
    console.log(err)
    res.status(500).send({ message: 'Logging action failed' });
  }
};

 


exports.sendReminder = async (req, res) => {
  try {
    const user = req.thisUser;
    const currentUserRoles = await user.getRoles(getActiveRolesGetOptions());
    const hasSuperAdminRole = currentUserRoles.some((role) => role.name === "super_admin");
   // const hasGRMRole = currentUserRoles.some((role) => role.name === "grm" || role.name === "gbv");
    const hasGRMRole = currentUserRoles.some(role => role.name === 'grm' || role.name === 'gbv' || role.name === 'staff' || role.name === 'admin');

    if (!hasGRMRole && !hasSuperAdminRole) {
      return res.status(403).send({ code: "9999", message: "Unauthorized access to grievances denied" });
    }

    const { grievance_id: grievance_id, new_status: new_status, action  } = req.body;
    if (!grievance_id || !new_status) {
      return res.status(400).send({ code: "1001", message: "Grievance ID and new status are required" });
    }

    const grievance = await Grievance.findOne({ 
      where: { id: grievance_id } 
    });

    if (!grievance) {
      return res.status(404).send({ code: "1002", message: "No grievance found for the given ID" });
    }

    // Get GRM officials based on grievance location
    const grmOfficials = await Users.findAll({
      include: [
        {
          model: UserRoles,
          where: {
            roleid: 4,
            [Op.or]: [
              { settlement_id: grievance.settlement_id ? grievance.settlement_id.toString() : null },
              { county_id: grievance.county_id ? grievance.county_id.toString() : null },
              { location_level: "national" },
            ],
          },
        },
      ],
    });


     // Prepare the object for creation
     let obj = req.body;

     console.log("Here to Remind..")
 
     console.log('Log>>', obj)
 
        // Create the record
     const item = await db.models.grievance_log.create(obj);


    if (item){
          // Send SMS notifications to GRM officials
          for (const grm of grmOfficials) {
            if (grm.phone) {
              const msg_obj = {
                message: action,
                phone: grm.phone,
                grievance_id: grievance.id,
                grv_code: grievance.code,
                status: grievance.status,
              };
              await sendNotificationSMS(msg_obj);
            }
          }
    }
  

   
    return res.status(200).send({
      code: "0000",
      message: "Grievance Reminder sent successfully",
      data: { grievance, code: grievance.code, date_reported: grievance.date_reported, status: grievance.status },
    });
  } catch (error) {
    console.error("Error updating grievance status:", error);
    return res.status(500).send({ code: "9999", message: "Unable to update grievance status. Please try again later." });
  }
};

// Confirm grievance resolution by national GRM
exports.confirmGrievanceResolution = async (req, res) => {
  try {
    const user = req.thisUser;
    const currentUserRoles = await user.getRoles(getActiveRolesGetOptions());
    const hasSuperAdminRole = currentUserRoles.some(role => role.name === 'super_admin');
    const isNationalGRM = currentUserRoles.some(role => 
      (role.name === 'grm' || role.name === 'admin' || role.name === 'staff') && 
      (role.user_roles?.location_level === 'national' || role.user_roles?.location_level === null)
    );

    if (!hasSuperAdminRole && !isNationalGRM) {
      return res.status(403).send({
        code: '9999',
        message: 'Only national GRM staff can confirm grievance resolutions',
      });
    }

    const { grievance_id, confirmation_level, confirmation_notes } = req.body;

    if (!grievance_id) {
      return res.status(400).send({
        code: '1001',
        message: 'Grievance ID is required',
      });
    }

    if (!confirmation_level || !['settlement', 'county'].includes(confirmation_level)) {
      return res.status(400).send({
        code: '1001',
        message: 'Confirmation level must be either "settlement" or "county"',
      });
    }

    const grievance = await Grievance.findOne({
      where: { id: grievance_id }
    });

    if (!grievance) {
      return res.status(404).send({
        code: '1002',
        message: 'Grievance not found',
      });
    }

    // Validate that grievance is resolved and at the correct level
    if (grievance.status !== 'Resolved') {
      return res.status(400).send({
        code: '1003',
        message: 'Only resolved grievances can be confirmed',
      });
    }

    if (!['settlement', 'county'].includes(grievance.current_level)) {
      return res.status(400).send({
        code: '1004',
        message: 'Only grievances resolved at settlement or county level can be confirmed',
      });
    }

    if (grievance.current_level !== confirmation_level) {
      return res.status(400).send({
        code: '1005',
        message: `Confirmation level must match the grievance current level (${grievance.current_level})`,
      });
    }

    // Update confirmation fields
    grievance.confirmed_by_national_grm = true;
    grievance.confirmed_by_user_id = user.id;
    grievance.date_confirmed_by_national_grm = new Date();
    grievance.confirmation_level = confirmation_level;
    if (confirmation_notes) {
      grievance.confirmation_notes = confirmation_notes;
    }

    // Close the grievance after confirmation
    grievance.status = 'Closed';
    grievance.date_closed = new Date();

    await grievance.save();

    // Log the confirmation action
    try {
      const logData = {
        grievance_id: grievance.id,
        action_type: 'Updated',
        action_by: user.id,
        action: `Resolution confirmed by national GRM at ${confirmation_level} level`,
        action_level: 'national',
        current_level: grievance.current_level,
        date_actioned: new Date(),
        prev_status: 'Resolved',
        new_status: 'Closed',
      };
      await db.models.grievance_log.create(logData);
    } catch (logError) {
      console.error('Error logging confirmation action:', logError);
      // Don't fail the request if logging fails
    }

    // Send SMS to complainant about closure
    try {
      const closureMessage = `Your grievance has been confirmed and closed by KISIP National Team. ${grievance.resolution || ''}`;
      const msg_obj = {
        message: closureMessage,
        type: 'Notification',
        phone: grievance.phone,
        grv_code: grievance.code,
        status: 'Closed',
        grievance_id: grievance.id,
        sender_id: user.id,
      };
      sendNotificationSMS(msg_obj);
    } catch (smsError) {
      console.error('Error sending closure SMS:', smsError);
      // Don't fail the request if SMS fails
    }

    return res.status(200).send({
      code: '0000',
      message: 'Grievance resolution confirmed and closed successfully',
      data: {
        grievance: grievance,
        code: grievance.code,
        confirmed_by: user.name || user.email,
        confirmation_date: grievance.date_confirmed_by_national_grm,
      },
    });
  } catch (error) {
    console.error('Error confirming grievance resolution:', error);
    return res.status(500).send({
      code: '9999',
      message: 'Unable to confirm grievance resolution. Please try again later.',
    });
  }
};