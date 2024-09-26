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

 const axios = require('axios') ;
 const Role = db.role
 const { Op, literal } = require('sequelize');


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
  const url = "https://quicksms.advantasms.com/api/services/sendotp/";
  
  const requestData = {
    apikey: "684f84e9aa485a0e72e6734c6b84d9b4",
    partnerID: "10322",
    shortcode: "AGS",
    message: sms_obj.msg,
    mobile: sms_obj.phone,
  };

  axios
    .post(url, requestData)
    .then((response) => {
      console.log("Response:", response.data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

async function sendSMS(sms_obj) {
  // Send OTP via Leopard (not implemented in this code snippet)
  const url = "https://quicksms.advantasms.com/api/services/sendotp/";
  let encrytped_name= [Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.name'), 'bytea'),'maluini'),'name']


  let msg =
    "Dear " +
    sms_obj.name +

    ", your grievance has been registered. Your reference is : " +
    sms_obj.code + ". You can monitor the status of your report here -> https://kesmis.go.ke/grv/status/"+sms_obj.id;
    

    //http://localhost:3000/status/6652e0486b49fb5075942951


  const requestData = {
    apikey: "684f84e9aa485a0e72e6734c6b84d9b4",
    partnerID: "10322",
    shortcode: "AGS",
    message: msg,
    mobile: sms_obj.phone,
  };

  axios
    .post(url, requestData)
    .then((response) => {
      console.log("Response:", response.data);
    })
    .catch((error) => {
      console.error("Error:", error);
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
    obj.name = Sequelize.fn('PGP_SYM_ENCRYPT', name, 'maluini');
    obj.national_id = Sequelize.fn('PGP_SYM_ENCRYPT', national_id, 'maluini');

    obj.code = generatedCode; // Assign the generated code

    console.log('Grievance record to be created:', obj);

    // Create the record
    const item = await db.models.grievance.create(obj);

    console.log('Created item:', item);

    // Decrypt the fields after creation
    const decryptedName = await db.sequelize.query(
      `SELECT PGP_SYM_DECRYPT(name::bytea, 'maluini') AS name FROM grievance WHERE id = :id`,
      {
        replacements: { id: item.id },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    const decryptedNationalId = await db.sequelize.query(
      `SELECT PGP_SYM_DECRYPT(national_id::bytea, 'maluini') AS national_id FROM grievance WHERE id = :id`,
      {
        replacements: { id: item.id },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    // Add the decrypted values to the response object
    item.name = decryptedName[0].name;
    item.national_id = decryptedNationalId[0].national_id;

    sendSMS(item);

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
                { settlement_id: obj.settlement_id.toString() }, // Settlement ID match
                {  county_id: obj.county_id.toString()},              // Super Admin role
                          
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
            let obj={} 
            obj.msg = msg 
            obj.phone=grm.phone

            // for each number send a notification SMS
            sendNotificationSMS(obj)


          }
        });
        
 
        console.log('grm_officials_names',grm_officials_names,grm_officials)

      }).catch(error => {
        // handle the error
        console.log('Fail:',error)
      });



 
      // Fetch the newly created item along with its associations
      const itemWithAssociations = await db.models.grievance.findOne({
        where: { id: item.id },
        include: [
          { model: db.models.county },
          { model: db.models.subcounty},
          { model: db.models.ward},
          { model: db.models.settlement},
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
 
 
exports.getGrievances =async (req, res) => {
  console.log(req.thisUser);
  const user = req.thisUser;

  const currentUserRoles = await user.getRoles(); 

  const searchString = req.body.searchString;
  const userCounty = user.county_id;
  const filters = req.body.filters || []; // Array of filter fields
  const filterValues = req.body.filterValues || []; // Array of filter values corresponding to each filter field

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

  var attributes = []
    for( let key in   db.models.grievance.rawAttributes ){
         attributes.push(key)
     }

     
     let encrytped_name= [Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.name'), 'bytea'),'maluini'),'name']
     attributes.push(encrytped_name)

     let encrytped_national_id= [Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.national_id'), 'bytea'),'maluini'),'national_id']

     attributes.push(encrytped_national_id)

    findAndCountOptions.attributes=attributes



  // Check if the current user has the 'super_admin' role
  const hasSuperAdminRole = currentUserRoles.some(role => role.name === 'super_admin');
  const hasGRMRole = currentUserRoles.some(role => role.name === 'grm');
 
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
    // Check if any of the current user's roles have location_level set to 'national'
    const hasNationalRole = currentUserRoles.some(role => role.user_roles.location_level === 'national');
    const hasCountyAdminRole = currentUserRoles.some(role => role.user_roles.location_level === 'county');

    // Apply the county filter only if the user does not have a 'national' role but has a 'county_admin' role
    if (!hasNationalRole && hasCountyAdminRole) {
      findAndCountOptions.where.county_id = userCounty;
      console.log('Applying county filter:', userCounty);
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

  // Apply additional filters based on `filters` and `filterValues`
  filters.forEach((filter, index) => {
    const value = filterValues[index];
    if (Array.isArray(value)) {
      // If the value is an array, use the Op.in operator to match any of the values
      findAndCountOptions.where[filter] = {
        [op.in]: value,
      };
    } else {
      // If the value is a single value, use the Op.eq operator for exact matching
      findAndCountOptions.where[filter] = value;
    }
  });

  // Explicitly remove any county_id filter from the where object
  if (hasSuperAdminRole) { 
    delete findAndCountOptions.where.county_id;

  }

  console.log(findAndCountOptions)
  const associatedModels = req.body.associated_multiple_models || [];
  if (associatedModels.length > 0) {
    findAndCountOptions.include = associatedModels.map(model => ({ model: db.models[model] }));
  }


  Grievance.findAndCountAll(findAndCountOptions)
    .then(({ count, rows: grievances }) => {
      console.log('Total grievances:', count);

      res.status(200).send({
        data: grievances,
        total: count,
        code: '0000',
        message: 'Grievances retrieved successfully',
      });
    })
    .catch((error) => {
      console.error('Error fetching Grievances:', error);
      res.status(500).send({ message: 'Unable to retrieve Grievances. Please try again later.' });
    });
};
 
 

const multer = require('multer');
const user_roles = require('../models/user_roles');
const settlement = require('../models/settlement');

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




    // Other form fields (if any) can be accessed using `req.body`
    //  console.log('other form fields:', req.body);

    // Process the files or respond to the client accordingly
    // res.json({ message: 'Form submission and file upload successful!' });
    });
    };


 
    
exports.getGrievanceById = async (req, res) => {
      const user = req.thisUser;
      const grievanceId = req.body.id; // Retrieve grievance ID from the request parameters
    
      const currentUserRoles = await user.getRoles();
    
      console.log('Current User Roles:', currentUserRoles);
    
      // Initialize findOptions with common properties
      const findOptions = {
        where: { id: grievanceId }, // Filter by the specific grievance ID
      };
    
      // Check if the current user has the 'super_admin' role
      const hasSuperAdminRole = currentUserRoles.some(role => role.name === 'super_admin');
      const hasGRMRole = currentUserRoles.some(role => role.name === 'grm');
    
      if (!hasGRMRole && !hasSuperAdminRole) {
        return res.status(200).send({
          data: null,
          code: '9999',
          message: 'Unauthorized access to grievance denied',
        });
      }
    
      if (!hasSuperAdminRole) {
        const hasNationalRole = currentUserRoles.some(role => role.user_roles.location_level === 'national');
        const hasCountyAdminRole = currentUserRoles.some(role => role.user_roles.location_level === 'county');
    
        if (!hasNationalRole && hasCountyAdminRole) {
          findOptions.where.county_id = user.county_id;
          console.log('Applying county filter:', user.county_id);
        }
      } else {
        console.log('Super Admin detected. Bypassing location-level filtering.');
      }
    
      // Apply decryption for sensitive fields (e.g., name, national_id)
      let attributes = [];
      for (let key in db.models.grievance.rawAttributes) {
        attributes.push(key);
      }
    
      let decryptedName = [Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.name'), 'bytea'), 'maluini'), 'name'];
      attributes.push(decryptedName);
    
      let decryptedNationalId = [Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.national_id'), 'bytea'), 'maluini'), 'national_id'];
      attributes.push(decryptedNationalId);
    
      findOptions.attributes = attributes;
    
      // Include associated models if specified, with one level of nested association
      const associatedModels = req.body.associated_multiple_models || [];
      if (associatedModels.length > 0) {
        findOptions.include = associatedModels.map(model => {
          if (typeof model === 'string') {
            // If the model is 'user', limit fields to id, name, and tel
            if (model === 'users') {
              return { 
                model: db.models[model], 
                attributes: ['id', 'name','username','email', 'phone'] 
              };
            }
            return { model: db.models[model] };
          } else if (typeof model === 'object' && model.name && model.nestedAssociations) {
            return {
              model: db.models[model.name],
              attributes: model.name === 'users' ? ['id', 'name','username','email', 'phone'] : undefined,
              include: model.nestedAssociations.map(nestedModel => ({
                model: db.models[nestedModel],
                attributes: nestedModel === 'users' ? ['id', 'name','username','email', 'phone'] : undefined,
              }))
            };
          }
        });
      }
    
      Grievance.findOne(findOptions)
        .then(grievance => {
          if (!grievance) {
            return res.status(404).send({
              data: null,
              code: '0001',
              message: 'Grievance not found',
            });
          }
    
          console.log('Grievance retrieved:', grievance);
    
          res.status(200).send({
            data: grievance,
            code: '0000',
            message: 'Grievance retrieved successfully',
          });
        })
        .catch(error => {
          console.error('Error fetching Grievance:', error);
          res.status(500).send({ message: 'Unable to retrieve Grievance. Please try again later.' });
        });
    };
    
    

 exports.getGrievanceStatus = async (req, res) => {
      try {
        const grievanceCode = req.body.grievanceCode;
        const phoneNumber = req.body.phoneNumber;
    
        if (!grievanceCode || !phoneNumber) {
          return res.status(400).send({
            code: '1001',
            message: 'Grievance code and phone number are required',
          });
        }
    
        // Initialize findOne options with decrypted phone number
        let attributes = [];
    
        
        attributes.push('phone','code','date_reported');
    
        // Grievance status field
        attributes.push('status');
    
        const findOptions = {
          where: {
            code: {
              [op.iLike]: `%${grievanceCode}%`, // Case-insensitive partial matching for grievance code
            },
            phone: {
              [op.iLike]: `%${phoneNumber}%`, // Case-insensitive partial matching for phone number
            },
          },
          attributes: attributes, // Include decrypted phone_number and status
        };
    
        console.log('Find options:', findOptions);
    
        // Fetch grievance by grievance_code and phone_number
        const grievance = await Grievance.findOne(findOptions);
    
        if (!grievance) {
          return res.status(404).send({
            code: '1002',
            message: 'No grievance found for the given code and phone number',
          });
        }
    
        // Return the grievance status
        return res.status(200).send({
          code: '0000',
          message: 'Grievance status retrieved successfully',
          data: {
            code: grievance.code,
            date_reported: grievance.date_reported,
            phone: phoneNumber,
            status: grievance.status, // The status of the grievance
          },
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
            item.name = Sequelize.fn('PGP_SYM_ENCRYPT', item.name, 'maluini');
            item.national_id = Sequelize.fn('PGP_SYM_ENCRYPT', item.national_id, 'maluini');
    
            // Use upsert to insert or update depending on conflicts
            const [insertedData, created] = await db.models[reg_model].upsert(item, {
              returning: true, // Get the inserted/updated data
            });

            console.log('Logged--------------->')
            // 1. Create a log for creation 
            let create_action ={}
            create_action.grievance_id = insertedData.id
            create_action.action_type = 'Reported'
            create_action.action_by = 1  // Rememner to change 
            create_action.date_actioned = item.date_reported
            create_action.prev_status ='Open'
            create_action.new_status = 'Open'
            create_action.action_level= item.action_level
            logGrievanceAction (create_action)

            // 2. Create a log for Current status 
            let current_action ={}
            current_action.grievance_id = insertedData.id
            current_action.action_type = item.status
            current_action.action_by = 1  // Rememner to change 
            current_action.date_actioned = item.date_actioned
            current_action.prev_status ='Open'
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
        const grievanceCode = req.body.code;
         const newStatus = req.body.new_status; // The new status to update
    
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
    
        console.log('Find options:', findOptions);
    
        // Fetch grievance by grievance code and phone number
        const grievance = await Grievance.findOne(findOptions);
    
        if (!grievance) {
          return res.status(404).send({
            code: '1002',
            message: 'No grievance found for the given code ',
          });
        }
    
        // Update the grievance status
        grievance.status = newStatus;
        await grievance.save(); // Save the updated grievance
    
        // Return success message
        return res.status(200).send({
          code: '0000',
          message: 'Grievance status updated successfully',
          data: {
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
    
 exports.getGrievancesByKeyword = async (req, res) => {
      console.log('--------------------------------------------getGrievancesByKeyword',);
      const user = req.thisUser;
    
      const currentUserRoles = await user.getRoles(); 
    
      const searchString = req.body.searchString;
      const userCounty = user.county_id;
      const filters = req.body.filters || [];
      const filterValues = req.body.filterValues || [];
      let limit = req.body.limit || 10;
      let page = req.body.page || 1;
    
      console.log('Current >>>> User Roles:', currentUserRoles);
    
      // Initialize findAndCountOptions with common properties
      const findAndCountOptions = {
        where: {},
        limit: limit,
        offset: (page - 1) * limit,
      };
    
      // Get attributes of the grievance model
      const attributes = Object.keys(db.models.grievance.rawAttributes);
      // Add decrypted fields
      attributes.push(
        [Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.name'), 'bytea'), 'maluini'), 'name'],
        [Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.national_id'), 'bytea'), 'maluini'), 'national_id']
      );
    
      findAndCountOptions.attributes = attributes;
    
      // Check user roles
      const hasSuperAdminRole = currentUserRoles.some(role => role.name === 'super_admin');
      const hasGRMRole = currentUserRoles.some(role => role.name === 'grm');
    
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
        if (hasCountyAdminRole) {
          findAndCountOptions.where.county_id = userCounty;
          console.log('Applying county filter:', userCounty);
        }
      } else {
        console.log('Super Admin detected. Bypassing location-level filtering.');
      }
    
 
     const searchableFields = ['code', 'description', 'phone', 'plea', 'nature']; // Fields that don't need decryption

              // Add the search condition for all fields if a search string is provided
              if (searchString) {


                const searchConditions = [
                  Sequelize.where(
                    Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.name'), 'bytea'), 'maluini'),
                    {
                      [Op.iLike]: `%${searchString}%`,
                    }
                  ),
                  Sequelize.where(
                    Sequelize.fn('PGP_SYM_DECRYPT', Sequelize.cast(Sequelize.col('grievance.national_id'), 'bytea'), 'maluini'),
                    {
                      [Op.iLike]: `%${searchString}%`,
                    }
                  ),
                  // Other fields can be added similarly
                ];

                 // Adding other searchable fields without decryption
                const searchableFields = ['code', 'description', 'phone', 'plea', 'nature' ];
                searchableFields.forEach(field => {
                  searchConditions.push({
                    [field]: {
                      [Op.iLike]: `%${searchString}%`,
                    },
                  });
                });
                 
   
                // Combine all search conditions
                findAndCountOptions.where[op.or] = searchConditions;
              }

          
    
      // Apply additional filters based on `filters` and `filterValues`
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
          console.log('Total grievances:', count);
          res.status(200).send({
            data: grievances,
            total: count,
            code: '0000',
            message: 'Grievances retrieved successfully',
          });
        })
        .catch((error) => {
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