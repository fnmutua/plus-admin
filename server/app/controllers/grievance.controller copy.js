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


 var bcrypt = require('bcryptjs')
const crypto = require('crypto');


const op = Sequelize.Op 


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

 
async function sendNotificationSMS(sms_obj) {
  // Send OTP via Leopard (not implemented in this code snippet)

  console.log('------------',sms_obj)
  const url = "https://quicksms.advantasms.com/api/services/sendotp/";
  
  const requestData = {
    apikey: "***REDACTED***",
     partnerID: '12108',
    shortcode: "KISIP",
    message: sms_obj.grv_code + ":" +sms_obj.message,
    mobile: sms_obj.phone,
  };


  const notification ={}

  notification.grievance_id = sms_obj.grievance_id
  notification.recipient = sms_obj.phone
  notification.message =  sms_obj.grv_code + ": " + sms_obj.message
  notification.medium = 'SMS'
  notification.type = sms_obj.type?  sms_obj.type: 'Acknowledgement'
  notification.code = shortid.generate()
  notification.sender_id = sms_obj.sender_id
  notification.status = sms_obj.status

  console.log('notification ----------?>',notification)

  axios
    .post(url, requestData)
    .then((response) => {
     /// console.log("Response:", response.data.responses[0]['response-description']);
     // console.log("Response:", response.data.responses[0] );

      if( response.data.responses[0]['response-description'] == 'Success') {
        notification.status = 'Success'
        db.models.grievance_notification.create(notification);
      } else {
          //console.log("Response all:", response);
          notification.status = 'Fail. '+response.data.responses[0]['response-description']

          db.models.grievance_notification.create(notification);

      }
    
    })
    .catch((error) => {
      notification.status = 'Fail'
      db.models.grievance_notification.create(notification);

      console.error("Error:", error);
    });
}

async function sendCreateSMS(sms_obj,serverUrl) {
  // Send OTP via Leopard (not implemented in this code snippet)
  const url = "https://quicksms.advantasms.com/api/services/sendotp/";
 
     // Generate QR code as a data URI
     const status_url = serverUrl +'/#/status/'+sms_obj.id
     console.log(url)


  let msg =
    "Dear " +
    sms_obj.name +
    ", your grievance has been registered. Your reference is : " +
    sms_obj.code + ". You can monitor the status of your report here -> " + status_url
    

    //http://localhost:3000/status/6652e0486b49fb5075942951


  const requestData = {
    apikey: "***REDACTED***",
     partnerID: '12108',
    shortcode: "KISIP",
    message: msg,
    mobile: sms_obj.phone,
  };

  const notification ={}

  notification.grievance_id = sms_obj.id
  notification.recipient = sms_obj.phone
  notification.message = msg
  notification.medium = 'SMS'
  notification.type = 'Notification'
  notification.code = shortid.generate()
 // notification.sender_id = 0  /// remember to change
  


  axios
    .post(url, requestData)
    .then((response) => {
      //console.log("Response:", response.data);
      notification.status = 'Success'
       db.models.grievance_notification.create(notification);
    })
    .catch((error) => {
      console.error("Error:", error);
      notification.status = 'Fail'
      db.models.grievance_notification.create(notification);

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
    obj.name = Sequelize.fn('PGP_SYM_ENCRYPT', name, '***REDACTED***');
    obj.national_id = Sequelize.fn('PGP_SYM_ENCRYPT', national_id, '***REDACTED***');

    obj.code = generatedCode; // Assign the generated code

    console.log('Grievance record to be created:', obj);

    // Create the record
    const item = await db.models.grievance.create(obj);

    console.log('Created item:', item);

    // Decrypt the fields after creation
    const decryptedName = await db.sequelize.query(
      `SELECT PGP_SYM_DECRYPT(name::bytea, '***REDACTED***') AS name FROM grievance WHERE id = :id`,
      {
        replacements: { id: item.id },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    const decryptedNationalId = await db.sequelize.query(
      `SELECT PGP_SYM_DECRYPT(national_id::bytea, '***REDACTED***') AS national_id FROM grievance WHERE id = :id`,
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

            let msg = 'A new grievance has been reported. Please review for your action. Reference:' + generatedCode
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

      let encrytpedField = [Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.name'), 'bytea'),'***REDACTED***'),'name']
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
      obj.name = Sequelize.fn('PGP_SYM_ENCRYPT', grievance.name, '***REDACTED***');
       obj.national_id = Sequelize.fn('PGP_SYM_ENCRYPT', grievance.national_id, '***REDACTED***');
      //obj.national_id =   grievance.national_id;

      
      obj.code = generatedCode;

      // Create grievance record
      const item = await db.models.grievance.create(obj);
      
      // Decrypt fields (optional, if needed)
      const decryptedName = await db.sequelize.query(
        `SELECT PGP_SYM_DECRYPT(name::bytea, '***REDACTED***') AS name FROM grievance WHERE id = :id`,
        { replacements: { id: item.id }, type: Sequelize.QueryTypes.SELECT }
      );
      item.name = decryptedName[0].name;





      // Add the decrypted values to the response object
      item.name = decryptedName[0].name;
      item.national_id = obj.national_id;

      const serverUrl = `${req.protocol}://${req.get('host')}`;

      sendCreateSMS(item,serverUrl);



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
  
              let msg = 'A new grievance has been reported. Please review for your action. Reference:' + generatedCode
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
 
 

 
exports.xgetGrievances = async (req, res) => {
  console.log(req.thisUser);
  const user = req.thisUser;
  const currentUserRoles = await user.getRoles();

  const searchString = req.body.searchString;
  const userCounty = user.county_id;
  const filters = req.body.filters || []; // Array of filter fields
  const filterValues = req.body.filterValues || []; // Array of filter values corresponding to each filter field
  const filterFunctions = req.body.filterFunctions || []; // Array of filter functions (e.g., 'eq', 'ne', 'like', etc.)

  let limit = req.body.limit || 10; // Default limit if not provided
  let page = req.body.page || 1; // Default page if not provided

  console.log('Current >>>>User Roles, ', currentUserRoles);

  // Initialize findAndCountOptions with common properties
  const findAndCountOptions = {
    where: {}, // Initialize an empty where object
    limit: limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']], // Sort by most recent (assuming createdAt is the field tracking creation date)
  };

  var attributes = [];
  for (let key in db.models.grievance.rawAttributes) {
    attributes.push(key);
  }

  // Decrypt fields (name and national_id)
  // let encrypted_name = [Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.name'), 'bytea'), '***REDACTED***'), 'name'];
  // attributes.push(encrypted_name);


  // let encrypted_national_id = [Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.national_id'), 'bytea'), '***REDACTED***'), 'national_id'];
  // attributes.push(encrypted_national_id);

  findAndCountOptions.attributes = attributes;

  // Check if the current user has the 'super_admin' role
  const hasSuperAdminRole = currentUserRoles.some(role => role.name === 'super_admin');
  const hasGRMRole = currentUserRoles.some(role => role.name === 'grm' || role.name === 'gbv');


  // Decrypt the name field based on the user role
  let decryptedName;
  if (hasSuperAdminRole) {
    // If the user has the super_admin role, show the actual decrypted name
    decryptedName = [
      Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.name'), 'bytea'), '***REDACTED***'),
      'name'
    ];
  } else {
    // If the user does NOT have the super_admin role, redact the name if it's a GBV case
    decryptedName = [
      Sequelize.literal(`
        CASE 
          WHEN "grievance"."isgbv" = false THEN 
            PGP_SYM_DECRYPT(CAST("grievance"."name" AS BYTEA), '***REDACTED***')
          ELSE 
            '[REDACTED]'
        END
      `),
      'name'
    ];
  }
  attributes.push(decryptedName);




  if (!hasGRMRole && !hasSuperAdminRole) {
    // Return an empty response if the user does not have GRM roles or is not a super admin
    return res.status(200).send({
      data: [],
      total: 0,
      code: '9999',
      message: 'Unauthorized access to grievances denied',
    });
  }

  if (!hasSuperAdminRole) {
    // Check if the user has a 'national' or 'county_admin' role
    const hasNationalRole = currentUserRoles.some(role => role.user_roles.location_level === 'national');
    const hasCountyAdminRole = currentUserRoles.some(role => role.user_roles.location_level === 'county');

    const countyAdminRole = currentUserRoles.find(role => role.user_roles.location_level === 'county');
    let countyId
    if (countyAdminRole) {
      countyId = countyAdminRole.user_roles.county_id; // Access the county_id from the role
      console.log('County Admin Role detected. County ID:', countyId);
    }


    // Apply county filter if user has a 'county_admin' role and not 'national' role
    if (!hasNationalRole && hasCountyAdminRole) {
      findAndCountOptions.where.county_id = countyId;
      console.log('Applying county filter:', countyId);
    }
  } else {
    console.log('Super Admin detected. Bypassing location-level filtering.');
  }

  // Add the 'searchString' condition if provided
  if (searchString) {
    findAndCountOptions.where.name = {
      [op.iLike]: `%${searchString}%`, // Case-insensitive partial matching
    };
  }

  // Apply additional filters based on `filters`, `filterValues`, and `filterFunctions`
  filters.forEach((filter, index) => {
    const value = filterValues[index];
    const functionType = filterFunctions[index] || 'eq'; // Default to 'eq' if no function provided

    // Map functionType to Sequelize operators
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
      lte: op.lte
    };

    const operator = operatorMap[functionType] || op.eq; // Default to 'eq' if unrecognized functionType

    if (Array.isArray(value)) {
      findAndCountOptions.where[filter] = {
        [operator]: value,
      };
    } else {
      findAndCountOptions.where[filter] = {
        [operator]: value,
      };
    }
  });

  // Explicitly remove any county_id filter for super admins
  if (hasSuperAdminRole) {
    delete findAndCountOptions.where.county_id;
  }

  console.log(findAndCountOptions);

  // Handle associated models inclusion
  const associatedModels = req.body.associated_multiple_models || [];
  if (associatedModels.length > 0) {
    findAndCountOptions.include = associatedModels.map(model => ({ model: db.models[model] }));
  }

  console.log('findAndCountOptions',findAndCountOptions);

  // Execute the query
  Grievance.findAndCountAll(findAndCountOptions)
    .then(({ count, rows: grievances }) => {
      console.log('Total grievances 1:', count);

      res.status(200).send({
        data: grievances,
        total: count,
        code: '0000',
        message: 'Grievances retrieved successfully',
      });
    })
    .catch((error) => {
      console.error('Error fetching Grievances: 3', error);
      res.status(500).send({ message: 'Unable to retrieve Grievances. Please try again later.' });
    });
};

exports.xgetGrievances = async (req, res) => {
  //console.log(req.thisUser);
  const user = req.thisUser;
  const currentUserRoles = await user.getRoles();

  const searchString = req.body.searchString;
  const userCounty = user.county_id;
  const filters = req.body.filters || []; // Filter fields
  const filterValues = req.body.filterValues || []; // Corresponding values
  const filterFunctions = req.body.filterFunctions || []; // Filter operators
  const locationFilter = req.body.locationFilter || null; // Location filter if provided

  let limit = req.body.limit || 10; // Default limit
  let page = req.body.page || 1; // Default page

  console.log('filters:', filters);
  console.log('filterValues:', filterValues);
  console.log('filterFunctions:', filterFunctions);

  // Initialize findAndCountOptions
  const findAndCountOptions = {
    where: {}, // Base filtering
    limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']], // Sort by latest
  };

  // Define attributes
  const attributes = Object.keys(db.models.grievance.rawAttributes);

  // Check roles
  const hasSuperAdminRole = currentUserRoles.some(role => role.name === 'super_admin');
  const hasGRMRole = currentUserRoles.some(role => role.name === 'grm' || role.name === 'gbv');

  // Decrypt name handling
  const decryptedName = hasSuperAdminRole
    ? [Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.name'), 'bytea'), '***REDACTED***'), 'name']
    : [
        Sequelize.literal(`
          CASE 
            WHEN "grievance"."isgbv" = false THEN 
              PGP_SYM_DECRYPT(CAST("grievance"."name" AS BYTEA), '***REDACTED***')
            ELSE 
              '[REDACTED]'
          END
        `),
        'name'
      ];
  attributes.push(decryptedName);

  findAndCountOptions.attributes = attributes;

  // Restrict access if not a super admin or GRM role
  if (!hasGRMRole && !hasSuperAdminRole) {
    return res.status(200).send({
      data: [],
      total: 0,
      code: '9999',
      message: 'Unauthorized access to grievances denied',
    });
  }

  // Apply location-based filtering
  if (!hasSuperAdminRole) {
    const hasNationalRole = currentUserRoles.some(role => role.user_roles.location_level === 'national');
    const countyAdminRole = currentUserRoles.find(role => role.user_roles.location_level === 'county');

    if (!hasNationalRole && countyAdminRole) {
      const countyId = countyAdminRole.user_roles.county_id;
      findAndCountOptions.where.county_id = countyId;
      console.log('Applying county filter:', countyId);
    }
  }

  // Apply additional location filter if provided in request
  // if (locationFilter) {
  //   findAndCountOptions.where.county_id = locationFilter;
  //   console.log('Applying location filter from request:', locationFilter);
  // }

  // Apply search filter
  if (searchString) {
    findAndCountOptions.where.name = { [op.iLike]: `%${searchString}%` };
  }

  // Apply additional filters
  filters.forEach((filter, index) => {
    const value = filterValues[index];
    const functionType = filterFunctions[index] || 'eq'; // Default to 'eq'
    
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
      lte: op.lte
    };

    findAndCountOptions.where[filter] = { [operatorMap[functionType] || op.eq]: value };
  });

  // Super Admin bypasses location filtering
  // if (hasSuperAdminRole) {
  //   delete findAndCountOptions.where.county_id;
  // }

  console.log('findAndCountOptions:', findAndCountOptions);

  // Include associated models if requested
  const associatedModels = req.body.associated_multiple_models || [];
  if (associatedModels.length > 0) {
    findAndCountOptions.include = associatedModels.map(model => ({ model: db.models[model] }));
  }

  // Execute query
  Grievance.findAndCountAll(findAndCountOptions)
    .then(({ count, rows: grievances }) => {
      console.log('Total grievances 2:', count);
 
      res.status(200).send({
        data: grievances,
        total: count,
        code: '0000',
        message: 'Grievances retrieved successfully',
      });
    })
    .catch((error) => {
      console.error('Error fetching Grievances: 1', error);
      res.status(500).send({ message: 'Unable to retrieve Grievances. Please try again later.' });
    });
};

exports.getGrievances = async (req, res) => {
  const user = req.thisUser;
  const currentUserRoles = await user.getRoles();

  const searchString = req.body.searchString;
  const userCounty = user.county_id;
  const filters = req.body.filters || [];
  const filterValues = req.body.filterValues || [];
  const filterFunctions = req.body.filterFunctions || [];
  const locationFilter = req.body.locationFilter || null;

  let limit = req.body.limit || 10;
  let page = req.body.page || 1;

  console.log('filters:', filters);
  console.log('filterValues:', filterValues);
  console.log('filterFunctions:', filterFunctions);

  const findAndCountOptions = {
    where: {},
    limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']],
    distinct: true, // Ensure distinct count when including associations
  };

  const attributes = Object.keys(db.models.grievance.rawAttributes);

  // Role checks
  const hasSuperAdminRole = currentUserRoles.some(role => role.name === 'super_admin');
  const hasGRMRole = currentUserRoles.some(role => role.name === 'grm' || role.name === 'gbv');

  // Decrypt name
  const decryptedName = hasSuperAdminRole
    ? [Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.name'), 'bytea'), '***REDACTED***'), 'name']
    : [
        Sequelize.literal(`
          CASE 
            WHEN "grievance"."isgbv" = false THEN 
              PGP_SYM_DECRYPT(CAST("grievance"."name" AS BYTEA), '***REDACTED***')
            ELSE 
              '[REDACTED]'
          END
        `),
        'name'
      ];
  attributes.push(decryptedName);

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

  // Apply location filtering for non-super-admin users
  if (!hasSuperAdminRole) {
    const hasNationalRole = currentUserRoles.some(role => role.user_roles.location_level === 'national');
    const countyAdminRole = currentUserRoles.find(role => role.user_roles.location_level === 'county');

    if (!hasNationalRole && countyAdminRole) {
      const countyId = countyAdminRole.user_roles.county_id;
      findAndCountOptions.where.county_id = countyId;
      console.log('Applying county filter:', countyId);
    }
  }

  // Search filter
  if (searchString) {
    findAndCountOptions.where.name = { [op.iLike]: `%${searchString}%` };
  }

  // Additional filters
  filters.forEach((filter, index) => {
    const value = filterValues[index];
    const functionType = filterFunctions[index] || 'eq';

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
      lte: op.lte
    };

    findAndCountOptions.where[filter] = { [operatorMap[functionType] || op.eq]: value };
  });

  console.log('findAndCountOptions:', findAndCountOptions);

  // Include associated models if requested
  const associatedModels = req.body.associated_multiple_models || [];
  if (associatedModels.length > 0) {
    findAndCountOptions.include = associatedModels.map(model => ({ model: db.models[model] }));
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
    console.error('Error fetching Grievances: 2', error);
    res.status(500).send({ message: 'Unable to retrieve Grievances. Please try again later.' });
  }
};


const multer = require('multer');
 

const uploadDir = '/data/grievances';

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
    cb(null, '/data/grievances'); // Define the directory where uploaded files will be stored
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
                obj.action_id = req.body.action_id[i] ? req.body.action_id[i] : null
                obj.type = req.body.type[i] ? req.body.type[i] : 'Documentation'
                objs.push(obj)

              } else {
                obj.grievance_id =req.body.grievance_id 
                obj.action_id = req.body.action_id ?  req.body.action_id : null
                obj.format = req.body.format 
                obj.size = req.body.size 
                obj.protected_file = req.body.protected_file[i] 
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

    
    res.status(500).send({
    message: 'Upload failed. ' + error + ' errors',
    code: '0000'
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
    
        const currentUserRoles = await user.getRoles();
        console.log('Current User Roles:', currentUserRoles);
    
        // Initialize findOptions with common properties
        const findOptions = {
          where: { id: grievanceId }, // Filter by the specific grievance ID
        };
    
        // Check if the current user has the 'super_admin' role or 'grm/gbv' roles
        const hasSuperAdminRole = currentUserRoles.some(role => role.name === 'super_admin');
        const hasGRMRole = currentUserRoles.some(role => role.name === 'grm' || role.name === 'gbv');
    
        // Initialize attributes, including all fields from grievance and sensitive fields with conditional redaction
        let attributes = Object.keys(db.models.grievance.rawAttributes).filter(attr => attr !== 'password'); // Exclude sensitive fields like password if any
    
        // Redaction logic for both name and phone
        let redactedFields;
        if (hasSuperAdminRole) {
          // Show actual decrypted name and phone for super_admin role
          redactedFields = [
            // Decrypt the name field
            [
              Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.name'), 'bytea'), '***REDACTED***'),
              'name'
            ],
            [
              Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.national_id'), 'bytea'), '***REDACTED***'),
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
                    PGP_SYM_DECRYPT(CAST("grievance"."name" AS BYTEA), '***REDACTED***')
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
                    PGP_SYM_DECRYPT(CAST("grievance"."national_id" AS BYTEA), '***REDACTED***')
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
        //   Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.national_id'), 'bytea'), '***REDACTED***'),
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
                  attributes: ['id', 'name', 'username', 'email', 'phone'] 
                };
              }
              return { model: db.models[model] };
            } else if (typeof model === 'object' && model.name && model.nestedAssociations) {
              return {
                model: db.models[model.name],
                attributes: model.name === 'users' ? ['id', 'name', 'username', 'email', 'phone'] : undefined,
                include: model.nestedAssociations.map(nestedModel => ({
                  model: db.models[nestedModel],
                  attributes: nestedModel === 'users' ? ['id', 'name', 'username', 'email', 'phone'] : undefined,
                }))
              };
            }
          });
        }
    
        // Fetch the grievance
        const grievance = await Grievance.findOne(findOptions);
    
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

    const currentUserRoles = await user.getRoles();
    console.log('Current User Roles:', currentUserRoles);

    // Initialize findOptions with common properties
    const findOptions = {
      where: { phone: userPhone }, // Filter by the specific grievance ID
    };

    // Check if the current user has the 'super_admin' role or 'grm/gbv' roles
    const hasSuperAdminRole = currentUserRoles.some(role => role.name === 'super_admin');
    const hasGRMRole = currentUserRoles.some(role => role.name === 'grm' || role.name === 'gbv');

    // Initialize attributes, including all fields from grievance and sensitive fields with conditional redaction
    let attributes = Object.keys(db.models.grievance.rawAttributes).filter(attr => attr !== 'password'); // Exclude sensitive fields like password if any

    // Redaction logic for both name and phone
    let redactedFields;
    if (hasSuperAdminRole) {
      // Show actual decrypted name and phone for super_admin role
      redactedFields = [
        // Decrypt the name field
        [
          Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.name'), 'bytea'), '***REDACTED***'),
          'name'
        ],
        [
          Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.national_id'), 'bytea'), '***REDACTED***'),
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
                PGP_SYM_DECRYPT(CAST("grievance"."name" AS BYTEA), '***REDACTED***')
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
                PGP_SYM_DECRYPT(CAST("grievance"."national_id" AS BYTEA), '***REDACTED***')
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
              attributes: ['id', 'name', 'username', 'email', 'phone'] 
            };
          }
          return { model: db.models[model] };
        } else if (typeof model === 'object' && model.name && model.nestedAssociations) {
          return {
            model: db.models[model.name],
            attributes: model.name === 'users' ? ['id', 'name', 'username', 'email', 'phone'] : undefined,
            include: model.nestedAssociations.map(nestedModel => ({
              model: db.models[nestedModel],
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
          attributes: ['phone', 'code', 'date_reported', 'status'], // Fields to include
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


        // Format the response object
        const responseObject = {
          code: grievance.code,
          date_reported: grievance.date_reported,
          phone: grievance.phone,
          status: grievance.status,
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
     
      } catch (err) {
        console.log(err);
       }
    }


exports.modelImportGrievances = async (req, res) => {
      const reg_model = 'grievance';
      const data = req.body.data;
      const insertedDocuments = [];
      const errors = [];
    
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
        for (const item of data) {
          try {
            // Generate a new code by incrementing the last code
            const newCode = await generateNextGrievanceCode(lastCode);
            lastCode = newCode; // Update lastCode for the next item
    
            item.code = newCode;
    
            // Encrypt 'name' and 'national_id'
            item.name = Sequelize.fn('PGP_SYM_ENCRYPT', item.name, '***REDACTED***');
            item.national_id = Sequelize.fn('PGP_SYM_ENCRYPT', item.national_id, '***REDACTED***');
    
            // Use upsert to insert or update depending on conflicts
            const [insertedData, created] = await db.models[reg_model].upsert(item, {
              returning: true, // Get the inserted/updated data
            });
 
              // Decrypt the fields after creation
            const decryptedName = await db.sequelize.query(
              `SELECT PGP_SYM_DECRYPT(name::bytea, '***REDACTED***') AS name FROM grievance WHERE id = :id`,
              {
                replacements: { id: item.id },
                type: Sequelize.QueryTypes.SELECT
              }
            );

            const decryptedNationalId = await db.sequelize.query(
              `SELECT PGP_SYM_DECRYPT(national_id::bytea, '***REDACTED***') AS national_id FROM grievance WHERE id = :id`,
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
            


            console.log('Logged--------------->')
            // 1. Create a log for creation 
            let create_action ={}
            create_action.grievance_id = insertedData.id
            create_action.action_type = 'Reported'
            //create_action.action_by = 1  // Rememner to change 
            create_action.date_actioned = item.date_reported
            create_action.current_level = 'settlement'
            create_action.prev_status ='Open'
            create_action.new_status = 'Open'
            create_action.action_level= item.action_level
            logGrievanceAction (create_action)

            // 2. Create a log for Current status 
            let current_action ={}
            current_action.grievance_id = insertedData.id
            current_action.action_type = item.status
            //current_action.action_by = 1  // Rememner to change 
            current_action.date_actioned = item.date_actioned
            current_action.prev_status ='Sorting'
            current_action.new_status = item.status
            current_action.action = item.action
            current_action.action_level= item.action_level

            
            logGrievanceAction (current_action)

 

            if (created) {
              insertedDocuments.push(insertedData); // Add the inserted document to the array if it was created


          
            }
          } catch (err) {
            errors.push(err.original);
            console.log('Error while processing grievances:', err);
          }
        }
    
        // Check for errors and respond accordingly
        if (errors.length > 0) {
         // let errorCodes = [...new Set(errors.map((error) => error.code))];
          let errorMsg = 'Import/Update failed for ' + errors.length + ' Records.';
    
          // if (errorCodes.includes('42P10')) {
          //   errorMsg = 'There are one or more duplicate records';
          // }
    
          res.status(500).send({ message: errorMsg });
        } else {
          res.status(200).send({
            message: 'Import/Update Successful',
            code: '0000',
            insertedDocuments: insertedDocuments, // Add the inserted documents to the response
          });
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        res.status(500).send({ message: 'Internal Server Error', error: err.message });
      }
    };
    
    

 exports.updateGrievanceStatus = async (req, res) => {

      try {


        const user = req.thisUser;
        console.log(user)
    
        const currentUserRoles = await user.getRoles();
        const hasSuperAdminRole = currentUserRoles.some(role => role.name === 'super_admin');
        const hasGRMRole = currentUserRoles.some(role => role.name === 'grm' || role.name === 'gbv');
      
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
        
    
        // Update the grievance status
        grievance.status = newStatus;
        grievance.current_level = current_level;
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
 
        sendNotificationSMS(msg_obj)

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
        const currentUserRoles = await user.getRoles();
        const hasSuperAdminRole = currentUserRoles.some(role => role.name === 'super_admin');
        const hasGRMRole = currentUserRoles.some(role => role.name === 'grm' || role.name === 'gbv');
    
        if (!hasGRMRole && !hasSuperAdminRole) {
          return res.status(403).send({
            code: '9999',
            message: 'Unauthorized access to update grievances denied',
          });
        }
    
        const grievanceCode = req.body.code;
        const updatedData = req.body.updatedData;
    
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
    
        await sendNotificationSMS(msg_obj);
    
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


 exports.getGrievancesByKeyword = async (req, res) => {
      console.log('--------------------------------------------getGrievancesByKeyword');
      const user = req.thisUser;
    
      const currentUserRoles = await user.getRoles();
    
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
    const value = filterValues[index];
    const functionType = filterFunctions[index] || 'eq'; // Default to 'eq' if no function provided

    // Map functionType to Sequelize operators
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
      lte: op.lte
    };

    const operator = operatorMap[functionType] || op.eq; // Default to 'eq' if unrecognized functionType

    if (Array.isArray(value)) {
      findAndCountOptions.where[filter] = {
        [operator]: value,
      };
    } else {
      findAndCountOptions.where[filter] = {
        [operator]: value,
      };
    }
  });



    
      const attributes = Object.keys(db.models.grievance.rawAttributes);
      attributes.push(
        [Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.name'), 'bytea'), '***REDACTED***'), 'name'],
        [Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.national_id'), 'bytea'), '***REDACTED***'), 'national_id']
      );
    
      findAndCountOptions.attributes = attributes;
    
      const hasSuperAdminRole = currentUserRoles.some(role => role.name === 'super_admin');
      const hasGRMRole = currentUserRoles.some(role => role.name === 'grm' || role.name === 'gbv');
    
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
            Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.name'), 'bytea'), '***REDACTED***'),
            { [Op.iLike]: `%${searchString}%` }
          ),
          Sequelize.where(
            Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.national_id'), 'bytea'), '***REDACTED***'),
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
    
      filters.forEach((filter, index) => {
        const value = filterValues[index];
        if (Array.isArray(value)) {
          findAndCountOptions.where[filter] = { [Op.in]: value };
        } else {
          findAndCountOptions.where[filter] = value;
        }
      });
    
      if (hasSuperAdminRole) {
        delete findAndCountOptions.where.county_id;
      }
    
      console.log(findAndCountOptions);
    
      const associatedModels = req.body.associated_multiple_models || [];
      if (associatedModels.length > 0) {
        findAndCountOptions.include = associatedModels.map(model => ({ model: db.models[model] }));
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
          console.error('Error fetching grievances:', error);
          res.status(500).send({ message: 'Unable to retrieve grievances. Please try again later.' });
        });
    };
    

 exports.downloadFile = (req, res) => {
      console.log("Received files:", req.body);
    
      const uploadedFile = path.join('/data/grievances' , req.body.filename);
    
      console.log(uploadedFile);
    
      // Check if the file exists
      fs.access(uploadedFile, fs.constants.F_OK, (err) => {
        if (err) {
          console.log(err);
       
    
          db.models.document.destroy({ where: { name: req.body.filename } })
          .then(() => {
            console.log('succeed')
            res.status(500).send({
              message: 'File not found.',
              code: '0000'
            });
        }) 
    
          
        } else {
          // File exists, send it
        //  res.sendFile(path.resolve(filePath));
    
          res.sendFile(path.resolve(uploadedFile), function(err) {
            if (err) {
              console.log(err);
              res.status(500).send({
                message: 'Download failed. Error occurred.',
                code: '0000'
              });
            } else {
              // File sent successfully
              // Handle success logic here if needed
              // res.status(200).send({
              //   message: 'File Found. Downloading...',
              //   code: '0000'
              // });
            }
          });
        }
      });
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
          grievance_id:  change_type === 'Delete' ? null : grievance_id,
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
          const { model, id } = req.body;
      
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
      
          // Get all associations for the model
          const associations = Model.associations;
      
          // Delete all associated records iteratively
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
      
          // Delete the main record
          await record.destroy();
      
          updateGrievanceHistory(record.id, record, req.thisUser.id, 'Delete');
      
          res.status(200).send({
            message: `${model} record and associated records deleted successfully.`,
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