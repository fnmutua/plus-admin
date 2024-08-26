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


 
 
exports.xgetGrievances = async (req, res) => {
  console.log('Req-body 002', req.body);
 // console.log('Req-body 002',  req.thisUser);

  
    // Retrieve the current user
    const user = await User.findByPk(req.thisUser.id);

    if (!user) {
      return res.status(404).send({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Get roles for the user
    const roles = await user.getRoles();
    console.log("roles", roles);

    // Determine the user role and county
    const userRole = roles.find(role => role.name === 'county') ? 'county' : 'national'; // Adjust role checking as needed
    const userCounty = user.county || null; // Assuming grievances are filtered by county for county-level users


 
  var reg_model = 'grievance'; // Assuming the model for grievances is 'Grievance'

  // Base count query
  var baseCountQuery = {
    where: {}
  };

  // Handle filters
  if (req.body.filters && req.body.filters.length > 0 && req.body.filterValues.length > 0 && req.body.filterValues.length === req.body.filters.length) {
    var lstQueries = [];
    for (let i = 0; i < req.body.filters.length; i++) {
      var lstValues = req.body.filterValues[i];
      lstQueries.push({ [req.body.filters[i]]: lstValues });
    }
    baseCountQuery.where = { [op.and]: lstQueries };
  }

  // Adjust query based on user role
  if (userRole === 'county') {
    // County level users receive grievances filtered by their county
    baseCountQuery.where = { ...baseCountQuery.where, county: userCounty }; // Assuming grievances have a county field
  }
  // National level users see all grievances subject to filtering
  // No additional filtering needed for national level users

  // Count records without nested models and includes
  let count = await db.models[reg_model].count(baseCountQuery);
  console.log('Base count:', count);

  // Associated Models
  var associated_multiple_models = req.body.associated_multiple_models || [];
  console.log('associated_multiple_models', associated_multiple_models.length);

  // Nested Models
  var nested_models = req.body.nested_models;
  var nestedQuery = {};

  if (req.body.nested_models) {
    var child_model = db.models[req.body.nested_models[0]];
    var grand_child_model = db.models[req.body.nested_models[1]];

    if (req.body.nested_filter) {
      nestedQuery[req.body.nested_filter[0]] = req.body.nested_filter[1];
    }
  }

  var qry = {};
  var includeModels = [];

  // Loop through the include models
  for (let i = 0; i < associated_multiple_models.length; i++) {
    var modelIncl = { model: db.models[associated_multiple_models[i]] };

    if (associated_multiple_models[i] === 'users') {
      modelIncl.raw = true;
      modelIncl.nested = true;
      modelIncl.attributes = ['name', 'email', 'phone'];
    }

    includeModels.push(modelIncl);
  }

  if (associated_multiple_models) {
    if (nested_models) {
      var nestedModels;
      if (req.body.nested_filter) {
        nestedModels = { model: child_model, include: [{ model: grand_child_model, where: nestedQuery }], raw: true, nested: true };
      } else {
        nestedModels = { model: child_model, include: [grand_child_model], raw: true, nested: true };
      }
      includeModels.push(nestedModels);
      qry.include = includeModels;
    } else {
      qry.include = includeModels;
    }
  }

  // Pagination and sorting
  if (req.body.limit) {
    qry.limit = req.body.limit;
  }
  if (req.body.page) {
    qry.offset = (req.body.page - 1) * req.body.limit;
  }

  // Applying base filters and role-based adjustments
  qry.where = baseCountQuery.where;

  // Order by createdAt in descending order
  qry.order = [['createdAt', 'DESC']];

  console.log('Final Query:', qry);

  // Cache handling
  if (req.body.cache_key && req.body.cache_key !== '') {
    const cache_key = req.body.cache_key;
    const cacheDuration = 3600; // Cache duration in seconds

    // Get last time it was modified
    const lastRow = await db.models[reg_model].findOne({
      attributes: ['updatedAt'],
      order: [['updatedAt', 'DESC']]
    });

    const lastModified = lastRow ? lastRow.updatedAt : Date.now();

    try {
      const cacheResults = await redisClient.get(cache_key);
      if (cacheResults) {
        const result = JSON.parse(cacheResults);
        if (lastModified && lastModified > result.lastModified) {
          // If the database was updated after the cached data was generated, update the cache
          const response = await db.models[reg_model].findAndCountAll(qry);
          await redisClient.set(cache_key, JSON.stringify({
            data: response.rows,
            total: count,
            lastModified: Date.now()
          }), {
            EX: cacheDuration,
            NX: true,
          });
          res.status(200).send({
            fromCache: false,
            cache_key: cache_key,
            data: response.rows,
            total: count,
            code: '0000'
          });
        } else {
          // If the cached data is still valid, return it from the cache
          res.status(200).send({
            fromCache: true,
            cache_key: cache_key,
            data: result.data,
            total: count,
            code: '0000'
          });
        }
      } else {
        // If no cache data exists, generate new data and store it in the cache
        const response = await db.models[reg_model].findAndCountAll(qry);
        await redisClient.set(cache_key, JSON.stringify({
          data: response.rows,
          total: count,
          lastModified: Date.now()
        }), {
          EX: cacheDuration,
          NX: true,
        });
        res.status(200).send({
          fromCache: false,
          cache_key: cache_key,
          data: response.rows,
          total: count,
          code: '0000'
        });
      }
    } catch (error) {
      res.status(500).send({
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  } else {
    // No cache
    try {
      const response = await db.models[reg_model].findAndCountAll(qry);
      res.status(200).send({
        fromCache: false,
        data: response.rows,
        total: count,
        code: '0000'
      });
    } catch (error) {
      res.status(500).send({
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
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
 