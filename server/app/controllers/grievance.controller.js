const path = require('path')
const shortid = require('shortid')
const fs = require('fs');
const db = require('../models')
const Sequelize = require('sequelize')
 const moment = require('moment');
 const User = db.user
 const Grievance = db.models.grievance


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


    let name = req.body.name
    let national_id = req.body.national_id
    obj.name=Sequelize.fn('PGP_SYM_ENCRYPT',name, 'maluini')
    obj.national_id=Sequelize.fn('PGP_SYM_ENCRYPT',national_id, 'maluini')



    obj.code = generatedCode; // Assign the generated code

    console.log('Grievance record to be created:', obj);

    // Create the record
    const item = await db.models.grievance.create(obj);

    console.log('Created item:', item);

    res.status(200).send({
      data: item,
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
    let msg
    if (message=='Validation error') {
      msg="Duplicate Grievances are not allowed"
    }
    else {
      msg=message
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
                objs.push(obj)

              } else {
                obj.grievance_id =req.body.grievance_id 
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



exports.zgetGrievanceById = async (req, res) => {
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
        // Return an empty response if the user does not have GRM roles or is not a super admin
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
          // Apply the county filter only if the user does not have a 'national' role but has a 'county_admin' role
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
    
      // Include associated models if specified
      const associatedModels = req.body.associated_multiple_models || [];
      if (associatedModels.length > 0) {
        findOptions.include = associatedModels.map(model => ({ model: db.models[model] }));
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
    
    