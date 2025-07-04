const db = require('../models')
const config = require('../config/db.config.js')
const User = db.user
const Users = db.models.users
const Role = db.role
const OTP = db.models.otp
const axios = require('axios');

const Sequelize = require('sequelize')
 const op = Sequelize.Op
 
 
const { Op } = require('sequelize');

//const User = db.user;
//const Role = db.role;

//const Ownership = db.models.ownership_type;

exports.allAccess = (req, res) => {
  res.status(200).send('Public Content.')
}

exports.userBoard = (req, res) => {
  const authorities = []

  User.findByPk(req.thisUser.id).then((user) => {
    user.getRoles().then((roles) => {
      for (let i = 0; i < roles.length; i++) {
        authorities.push(roles[i].name)
      }
      const user = {
        roles: authorities,
        introduction: req.thisUser.name,
        avatar: req.thisUser.avatar,
        name: req.thisUser.name,
        county_id: req.thisUser.county_id,
        phone: req.thisUser.phone,
        id: req.thisUser.id
      }
      res.status(200).send({
        code: 20000,
        data: user,
        thisUser: req.thisUser,
        userid: req.userid
      })
    })
  })
}

exports.adminBoard = (req, res) => {
  res.status(200).send('Admin Content.')
}
exports.moderatorBoard = (req, res) => {
  res.status(200).send('Moderator Content.')
}

exports.modelBoard = (req, res) => {
  var fields = []

  var reg_model = req.body.model

  console.log('Models:', db.models)
  // Find the right Model

  function getModel(type) {
    // We create a const that receives an object and each of its properties.
    // will be the values corresponding to our types
    const theModel = {
      //  User: User,
      //   Role: Role,
      reg_model: db.models[reg_model]
      //   default: Role
    }
    return db.models[reg_model]
    //return theModel[type] || theModel.default
  }

  //console.log(getModel('User') ) // "This User is Admin!"

  //console.log(Object.keys(User.rawAttributes))
  //console.log(Object.keys(User))
  //console.log(Object.keys(User.tableAttributes))

  for (let key in getModel(reg_model).rawAttributes) {
    // console.log('Field: ', key); // this is name of the field
    var myObject = {}

    // console.log('Type: ', User.rawAttributes[key].type); // Sequelize type of field

    myObject['field'] = key
    myObject['type'] = getModel(reg_model).rawAttributes[key].type.key

    fields.push(myObject)
  }

  console.log(fields)
  res.status(200).send(fields)
}

exports.Logout = (req, res) => {
  console.log('logging off')
  res.status(200).send({
    code: '0000',
    status: 'Logged out'
  })
}

 
 
exports.__modelAllUsers = (req, res) => {
  console.log('Current User', req.body.currrentUser)

  console.log('This User roles',req.roles)
   var currentUserRoles = req.roles

  // control the levels of users the loogend in user can see
  if (currentUserRoles.includes(0)) {
    var RoleFilters = [1,5,6,7,8,9,10,11,12,13,14,15,16] // all staff except national admins
  }
  if (currentUserRoles.includes(-99)) {
    var RoleFilters = [0,1,5,6,7,8,9,10,11,12,13,14,15,16] // all staff except national admins
  }

  else if (currentUserRoles.includes(1)) {
    var RoleFilters = [5,6,7,8,9,10,11,12,13,14,15,16] // all staff except national admins
  }

  else if (currentUserRoles.includes(11) || currentUserRoles.includes(10))  {   // SUD/KSIP staff
    var RoleFilters = [9,12,13,14] //   
  }
  
  else if (currentUserRoles.includes(16)) {   // 16 National M&E
    var RoleFilters = [6] // county M&E 
  }
  
  else if (currentUserRoles.includes(5)) {   // 5 County Admin
    var RoleFilters = [7] // county staff
  }
  
  var reg_model = req.body.model 

  // Associated Models
  var associated_multiple_models = req.body.associated_multiple_models
 
 
    var child_model = db.models.user_roles
    var grand_child_model = db.models.roles
    var nestedQuery = {}
    nestedQuery[req.body.nested_filter[0]] = RoleFilters

 

  var qry = {}
  var includeModels = []

  // loop through the include models
  for (let i = 0; i < req.body.associated_multiple_models.length; i++) {
    var modelIncl = {}
    modelIncl.model = db.models[req.body.associated_multiple_models[i]]
    modelIncl.raw = true
    modelIncl.nested = true
    includeModels.push(modelIncl)


  }

  //console.log(includeModels)
  if (associated_multiple_models) {
         var nestedModels = { model: child_model, include: [{ model: grand_child_model, where: nestedQuery }], raw: true, nested: true }
          includeModels.push(nestedModels)
      var qry = {
        include: includeModels
      }
     
  } else {
    var qry = {}
  }

  console.log('The Querry XXX',  qry)
  if (req.body.limit ) {
    qry.limit = req.body.limit 
  }
  if (req.body.page ) {
    qry.offset = (req.body.page - 1) * req.body.limit
  }


  /// use the multpiple filters
  var queryFields = {}
  if (req.body.filters) {
    if (req.body.filters.length > 0 && req.body.filterValues.length > 0) {
      for (let i = 0; i < req.body.filters.length; i++) {
        queryFields[req.body.filters[i]] = req.body.filterValues[i]
      }
      console.log('Final-4-object------------>', queryFields)
      qry.where = queryFields
    }
  }
  qry.distinct=true
  qry.where =  {
    id: { [op.notIn]: [req.body.currrentUser] }
  }
  qry.attributes = { exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken'] } // will be applciable to users only 
  db.models[reg_model].findAndCountAll(qry).then((list) => {
    console.log(list)
    res.status(200).send({
      data: list.rows,
      total: list.count,
      code: '0000',
      message: 'Users retrieved successfully'
    })
  })
}


 

exports.modelAllUsers = async (req, res) => {
  try {
    console.log('---------------------------------');
    console.log('Current User:', req.body.currentUser);

    const user = req.body.currentUser;
    const reg_model = req.body.model;
    const filters = req.body.filters || [];
    const filterValues = req.body.filterValues || [];
    const searchString = req.body.searchString;
    const associated_multiple_models = req.body.associated_multiple_models || [];

    let limit = req.body.limit || 10;
    let page = req.body.page || 1;

    // Define role hierarchy
    const roleHierarchy = ['root_admin', 'super_admin', 'admin', 'grm', 'gbv', 'support', 'monitoring'];

    // Determine the highest role of the current user
    let highestRole = null;
    for (const role of roleHierarchy) {
      if (user.roles.some(r => r.name === role)) {
        highestRole = role;
        break; // Stop at the highest role
      }
    }
    console.log(`Highest role of current user: ${highestRole}`);

    // Extract subordinate roles (only from the highest role)
    const highestRoleIndex = roleHierarchy.indexOf(highestRole);
    const allowedRoles = roleHierarchy.slice(highestRoleIndex + 1); // Get only lower roles

    console.log('Allowed Roles:', allowedRoles);

    // Define query options
    const findAndCountOptions = {
      include: [],
      where: {
        id: { [Op.ne]: user.id }, // Exclude current user
      },
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'DESC']],
      distinct: true,
      attributes: { exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken'] },
    };

    // Exclude users with higher or equal roles
    findAndCountOptions.where.id = {
      [Op.notIn]: Sequelize.literal(`
        (SELECT user_roles.userid FROM user_roles
        JOIN roles ON user_roles.roleid = roles.id
        WHERE roles.name IN ('${roleHierarchy.slice(0, highestRoleIndex + 1).join("', '")}')
        )`),
    };

    // Apply search condition
    if (searchString) {
      findAndCountOptions.where.name = {
        [Op.iLike]: `%${searchString}%`,
      };
    }

    // Apply additional filters
    filters.forEach((filter, index) => {
      const value = filterValues[index];
      if (Array.isArray(value)) {
        findAndCountOptions.where[filter] = { [Op.in]: value };
      } else {
        findAndCountOptions.where[filter] = value;
      }
    });

    // Include related models
    associated_multiple_models.forEach(modelName => {
      findAndCountOptions.include.push({ model: db.models[modelName], raw: true, nested: true });
    });

    // Always include county information
    findAndCountOptions.include.push({
      model: db.models.county,
      attributes: ['id', 'name', 'code'],
      required: false
    });

    // Include role-based filtering
    findAndCountOptions.include.push({
      model: db.models.user_roles,
      required: true,
      include: [{ model: db.models.roles, where: { name: allowedRoles } }],
    });

    // Fetch users
    const { count, rows: users } = await db.models[reg_model].findAndCountAll(findAndCountOptions);

    console.log('Total Users Retrieved:', count);

    res.status(200).send({
      data: users,
      total: count,
      code: '0000',
      message: 'Users retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send({ message: 'Unable to retrieve users. Please try again later.' });
  }
};



 
exports.modelPaginatedUsersfilterBykeyWord = (req, res) => {
 
  console.log('This User roles',req.roles)
   var currentUserRoles = req.roles
  // control the levels of users the loogend in user can see

  if (currentUserRoles.includes(-99)) {
    var RoleFilters = [0,1,5,6,7,8,9,10,11,12,13,14,15,16] // all staff except national admins
  }


  if (currentUserRoles.includes(0)) {
    var RoleFilters = [1,5,6,7,8,9,10,11,12,13,14,15,16] // all staff except national admins
  }
  // control the levels of users the loogend in user can see
 else  if (currentUserRoles.includes(1)) {
    var RoleFilters = [5,6,7,8,9,10,11,12,13,14,15,16] // all staff except national admins
  }
  else if (currentUserRoles.includes(11) || currentUserRoles.includes(10))  {   // SUD/KSIP staff
    var RoleFilters = [9,12,13,14] //   
  }
  
  else if (currentUserRoles.includes(16)) {   // 16 National M&E
    var RoleFilters = [6] // county M&E 
  }
  
  else if (currentUserRoles.includes(5)) {   // 5 County Admin
    var RoleFilters = [7] // county staff
  }
  
  var reg_model = req.body.model 
  var field = req.body.searchField
  var searchKeyword = req.body.searchKeyword

  // Associated Models
  var associated_multiple_models = req.body.associated_multiple_models
 
 
    var child_model = db.models.user_roles
    var grand_child_model = db.models.roles
    var nestedQuery = {}
    nestedQuery[req.body.nested_filter[0]] = RoleFilters

 

  var qry = {}
  var includeModels = []

  // loop through the include models
  for (let i = 0; i < req.body.associated_multiple_models.length; i++) {
    var modelIncl = {}
    modelIncl.model = db.models[req.body.associated_multiple_models[i]]
    modelIncl.raw = true
    modelIncl.nested = true
    includeModels.push(modelIncl)


  }

  //console.log(includeModels)
  if (associated_multiple_models) {
         var nestedModels = { model: child_model, include: [{ model: grand_child_model, where: nestedQuery }], raw: true, nested: true }
          includeModels.push(nestedModels)
      var qry = {
        include: includeModels
      }
     
  } else {
    var qry = {}
  }

  console.log('The Querry XXX',  qry)
  if (req.body.limit ) {
    qry.limit = req.body.limit 
  }
  if (req.body.page ) {
    qry.offset = (req.body.page - 1) * req.body.limit
  }


  /// use the multpiple filters
  var queryFields = {}
  if (req.body.filters) {
    if (req.body.filters.length > 0 && req.body.filterValues.length > 0) {
      for (let i = 0; i < req.body.filters.length; i++) {
        queryFields[req.body.filters[i]] = req.body.filterValues[i]
      }
      console.log('Final-6-object------------>', queryFields)
      qry.where = queryFields
    }
  }


  
  if (req.body.searchField) {

   // var searchCond = { [field]: { [op.iLike]: '%' + searchKeyword + '%' } }

    const searchCond = { [field]: { [op.iLike]: `%${searchKeyword.toLowerCase()}%` } }; // use iLike with lowercase search term

    const mergedObject = {
      ...queryFields,
      ...searchCond
    }
  
    console.log('--------------search Condition-----------', mergedObject)
  
    qry.where = mergedObject
  } else {

    qry.where = queryFields
  }


 console.log('--------------Final Querry-----------', qry)



  qry.distinct=true

  qry.attributes = { exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken'] } // will be applciable to users only 
  db.models[reg_model].findAndCountAll(qry).then((list) => {
    console.log(list)
    res.status(200).send({
      data: list.rows,
      total: list.count,
      code: '0000',
      message: 'Users retrived successfully'
    })
  })
}






 

 
exports.modelCountyUsers = async (req, res) => {
  try {
  //  console.log('Request Body:', req.body);

    const { 
      currentUser, 
      filters = [], 
      filterValues = [], 
      limit = 10, 
      page = 1 
    } = req.body;

    const { roles: currentUserRoles = [], county_id: userCounty } = currentUser;

    console.log('Current User Roles:', currentUserRoles);

    // Extract unique subordinate role IDs from the current user roles
    const uniqueSubordinates = [
      ...new Set(currentUserRoles.flatMap(role => role.subordinates || []))
    ];

    console.log('Allowed Role IDs:', uniqueSubordinates);

    // Query options
    const findAndCountOptions = {
      include: [
        {
          model: db.models.user_roles,
          required: true,
          where: {
            roleid: { [Op.in]: uniqueSubordinates } // No more exclusion of roleid = 0
          }
        },
        {
          model: db.models.county,
          attributes: ['id', 'name', 'code'],
          required: false
        }
      ],
      where: {
        id: { [Op.ne]: currentUser.id }, // Exclude the current user
      },
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'DESC']], // Sort by latest users first
      attributes: { exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken'] }, // Hide sensitive fields
      distinct: true
    };

    // Normalize and cast filter values based on data type
    const normalizeAndCastFilter = (filter, value) => {
      if (typeof value === 'string') {
        if (value === 'true' || value === 'false') {
          return Sequelize.cast(value === 'true', 'BOOLEAN');
        }
        if (!isNaN(value)) {
          return Sequelize.cast(value, 'INTEGER');
        }
      }
      return value;
    };

    // Apply additional filters if provided
    if (filters.length === filterValues.length) {
      findAndCountOptions.where[Op.and] = filters.map((filter, index) => ({
        [filter]: { [Op.eq]: normalizeAndCastFilter(filter, filterValues[index]) }
      }));
    }

    console.log('Final Query Options:', JSON.stringify(findAndCountOptions, null, 2));

    // Fetch users and count
    const { count, rows: users } = await db.models.users.findAndCountAll(findAndCountOptions);

    // Convert photo binary data to base64 URL
    const usersWithPhotos = users.map(user => ({
      ...user.toJSON(),
      photo: user.photo 
        ? `data:image/png;base64,${user.photo.toString('base64')}` 
        : ''
    }));

    res.status(200).send({
      data: usersWithPhotos,
      total: count,
      code: '0000',
      message: 'County Users retrieved successfully',
    });

  } catch (error) {
    console.error('Error retrieving county users:', error);
    res.status(500).send({ message: 'Unable to retrieve users. Please try again later.' });
  }
};



exports.modelGRMUsers = async (req, res) => {
  try {
    console.log('Getting GRMS', req.body);
    const { currentUser, filters = [], filterValues = [], limit = 10, page = 1 } = req.body;
    const { roles: currentUserRoles = [], county_id: userCounty } = currentUser;

    console.log('Current User Roles:', currentUserRoles);

    // Extract unique subordinate role IDs from the current user roles
    const uniqueSubordinates = [
      ...new Set(
        currentUserRoles.flatMap(role => role.subordinates || [])
      )
    ];

     

    const findAndCountOptions = {
      include: [
        {
          model: db.models.user_roles,
          required: true,
          where: {
            roleid: uniqueSubordinates,
            roleid: 4 // GRM
          }
        },
        {
          model: db.models.county,
          attributes: ['id', 'name', 'code'],
          required: false
        }
      ],
      where: {},
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'DESC']] // Add this line to sort by ID in descending order

    };


    // Normalize and cast filter values based on the column type
    const normalizeAndCastFilter = (filter, value) => {
      if (typeof value === 'string') {
        // Cast value for boolean columns
        if (value === 'true' || value === 'false') {
          return Sequelize.cast(value === 'true', 'BOOLEAN');
        }
        // Cast value for integer columns
        if (!isNaN(value)) {
          return Sequelize.cast(value, 'INTEGER');
        }
      }
      return value; // Default case
    };

    // Add filter conditions if filters and values are provided
    if (filters.length === filterValues.length) {
      findAndCountOptions.where[Op.and] = filters.map((filter, index) => ({
        [filter]: { [Op.eq]: normalizeAndCastFilter(filter, filterValues[index]) }
      }));
    }

    console.log('Final Query Options for GRM Users:', findAndCountOptions);

    // Query users and include their roles with user_roles details
    const { count, rows: grmUsers } = await Users.findAndCountAll(findAndCountOptions);

    // Convert photo binary data to base64 URL
    const usersWithPhotos = grmUsers.map(user => {
      if (user.photo) {
        user.photo = 'data:image/png;base64,' + user.photo.toString('base64');
      } else {
        user.photo = ''; // Assign empty string if no photo
      }
      return user;
    });

    res.status(200).send({
      data: usersWithPhotos,
      total: count,
      code: '0000',
      message: 'GRM users retrieved successfully',
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: 'Unable to retrieve GRM users. Please try again later.' });
  }
};


exports.xgetGRMUsersByLocation = async (req, res) => {
  try {
    console.log('Getting GRM Users by Location (Including National)', req.body);
    const { currentUser, county_id, settlement_id, filters = [], filterValues = [], limit = 10000, page = 1 } = req.body;
    const { county_id: userCounty } = currentUser;

    console.log('Requested County ID:', county_id);
    console.log('Requested Settlement ID:', settlement_id);

    const findAndCountOptions = {
      include: [
        {
          model: db.models.user_roles,
          required: true,
          where: {
            roleid: 4, // GRM role
            [Op.or]: [
              // Match county_id if provided
              county_id ? { county_id: county_id } : null,
              // Match settlement_id if provided
              settlement_id ? { settlement_id: settlement_id } : null,
              // Always include national-level users
              { location_level: 'national' }
            ].filter(Boolean) // Remove null conditions
          }
        }
      ],
      where: {},
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'DESC']] // Sort by ID in descending order
    };

    // Validate input: at least one of county_id or settlement_id must be provided
    if (!county_id && !settlement_id) {
      return res.status(400).send({
        message: 'At least one of county_id or settlement_id must be provided.'
      });
    }

    // Normalize and cast filter values based on the column type
    const normalizeAndCastFilter = (filter, value) => {
      if (typeof value === 'string') {
        // Cast value for boolean columns
        if (value === 'true' || value === 'false') {
          return Sequelize.cast(value === 'true', 'BOOLEAN');
        }
        // Cast value for integer columns
        if (!isNaN(value)) {
          return Sequelize.cast(value, 'INTEGER');
        }
      }
      return value; // Default case
    };

    // Add filter conditions if filters and values are provided
    if (filters.length === filterValues.length) {
      findAndCountOptions.where[Op.and] = filters.map((filter, index) => ({
        [filter]: { [Op.eq]: normalizeAndCastFilter(filter, filterValues[index]) }
      }));
    }

    console.log('Final Query Options for GRM Users by Location:', findAndCountOptions);

    // Query users and include their roles with user_roles details
    const { count, rows: grmUsers } = await Users.findAndCountAll(findAndCountOptions);

    // Convert photo binary data to base64 URL
    const usersWithPhotos = grmUsers.map(user => {
      if (user.photo) {
        user.photo = 'data:image/png;base64,' + user.photo.toString('base64');
      } else {
        user.photo = ''; // Assign empty string if no photo
      }
      return user;
    });

    res.status(200).send({
      data: usersWithPhotos,
      total: count,
      code: '0000',
      message: 'GRM users by location (including national) retrieved successfully',
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: 'Unable to retrieve GRM users by location. Please try again later.' });
  }
};


exports._getGRMUsersByLocation = async (req, res) => {
  try {
    console.log('Getting GRM Users by Location (Including National)', req.body);
    const { currentUser, county_id, settlement_id, filters = [], filterValues = [], limit = 10000, page = 1 } = req.body;
    const { county_id: userCounty } = currentUser;

    console.log('Requested County ID:', county_id);
    console.log('Requested Settlement ID:', settlement_id);

    const findAndCountOptions = {
      include: [
        {
          model: db.models.user_roles,
          required: true,
          where: {
         //   roleid: 4, // GRM role
            [Op.or]: [
              // Match county_id if provided and no settlement_id
              (!settlement_id && county_id) ? { county_id: county_id } : null,
              // Match settlement_id if provided
              settlement_id ? { settlement_id: settlement_id } : null,
              // Always include national-level users
              { location_level: 'national' },
           //   { roleid: 1 }, // Include rleid: 1 Admin
           //   { roleid: 2 }, // Include rleid: 2 Staff
             // { roleid: 8 }, // Include rleid: 8 GBV
              { roleid: 4 }, // Include rleid: 8 GBV

            ].filter(Boolean) // Remove null conditions
          }
        },
        {
          model: db.models.county,
          attributes: ['id', 'name', 'code'],
          required: false
        }
      ],
      where: {},
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'DESC']] // Sort by ID in descending order
    };

    // Validate input: at least one of county_id or settlement_id must be provided
    if (!county_id && !settlement_id) {
      return res.status(400).send({
        message: 'At least one of county_id or settlement_id must be provided.'
      });
    }

    // Normalize and cast filter values based on the column type
    const normalizeAndCastFilter = (filter, value) => {
      if (typeof value === 'string') {
        // Cast value for boolean columns
        if (value === 'true' || value === 'false') {
          return Sequelize.cast(value === 'true', 'BOOLEAN');
        }
        // Cast value for integer columns
        if (!isNaN(value)) {
          return Sequelize.cast(value, 'INTEGER');
        }
      }
      return value; // Default case
    };

    // Add filter conditions if filters and values are provided
    if (filters.length === filterValues.length) {
      // Remove county_id from filters when settlement_id is provided
      let adjustedFilters = filters;
      let adjustedFilterValues = filterValues;
      
      if (settlement_id) {
        const countyFilterIndex = filters.indexOf('county_id');
        if (countyFilterIndex !== -1) {
          adjustedFilters = filters.filter((_, index) => index !== countyFilterIndex);
          adjustedFilterValues = filterValues.filter((_, index) => index !== countyFilterIndex);
        }
      }

      findAndCountOptions.where[Op.and] = adjustedFilters.map((filter, index) => ({
        [filter]: { [Op.eq]: normalizeAndCastFilter(filter, adjustedFilterValues[index]) }
      }));
    }

    console.log('Final Query Options for GRM Users by Location:', findAndCountOptions);

    // Query users and include their roles with user_roles details
    const { count, rows: grmUsers } = await Users.findAndCountAll(findAndCountOptions);

    // Convert photo binary data to base64 URL
    const usersWithPhotos = grmUsers.map(user => {
      if (user.photo) {
        user.photo = 'data:image/png;base64,' + user.photo.toString('base64');
      } else {
        user.photo = ''; // Assign empty string if no photo
      }
      return user;
    });

    res.status(200).send({
      data: usersWithPhotos,
      total: count,
      code: '0000',
      message: 'GRM users by location (including national) retrieved successfully',
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: 'Unable to retrieve GRM users by location. Please try again later.' });
  }
};



exports.getGRMUsersByLocation = async (req, res) => {
  try {
    console.log('Getting GRM Users by Location (Including National)', req.body);
    let { currentUser, county_id, settlement_id, filters = [], filterValues = [], limit = 10000, page = 1 } = req.body;
    const { county_id: userCounty } = currentUser;

    // Normalize county_id and settlement_id to arrays
    if (county_id && !Array.isArray(county_id)) county_id = [county_id];
    if (settlement_id && !Array.isArray(settlement_id)) settlement_id = [settlement_id];

    console.log('Requested County IDs:', county_id);
    console.log('Requested Settlement IDs:', settlement_id);

    // Validation
    if ((!county_id || county_id.length === 0) && (!settlement_id || settlement_id.length === 0)) {
      return res.status(400).send({
        message: 'At least one of county_id or settlement_id must be provided.'
      });
    }

    const findAndCountOptions = {
      include: [
        {
          model: db.models.user_roles,
          required: true,
          where: {
            [Op.or]: [
              // Match any county_id if provided and no settlement_id
              (!settlement_id?.length && county_id?.length) ? { county_id: { [Op.in]: county_id } } : null,
              // Match any settlement_id if provided
              settlement_id?.length ? { settlement_id: { [Op.in]: settlement_id } } : null,
              // Always include national-level users
              { location_level: 'national' },
              // Only include GRM role (roleid: 4)
              { roleid: 4 },
            ].filter(Boolean)
          }
        },
        {
          model: db.models.county,
          attributes: ['id', 'name', 'code'],
          required: false
        }
      ],
      where: {},
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'DESC']]
    };

    // Normalize and cast filter values based on the column type
    const normalizeAndCastFilter = (filter, value) => {
      if (typeof value === 'string') {
        if (value === 'true' || value === 'false') {
          return Sequelize.cast(value === 'true', 'BOOLEAN');
        }
        if (!isNaN(value)) {
          return Sequelize.cast(value, 'INTEGER');
        }
      }
      return value;
    };

    // Add filters
    if (filters.length === filterValues.length) {
      let adjustedFilters = filters;
      let adjustedFilterValues = filterValues;

      if (settlement_id?.length) {
        const countyFilterIndex = filters.indexOf('county_id');
        if (countyFilterIndex !== -1) {
          adjustedFilters = filters.filter((_, index) => index !== countyFilterIndex);
          adjustedFilterValues = filterValues.filter((_, index) => index !== countyFilterIndex);
        }
      }

      findAndCountOptions.where[Op.and] = adjustedFilters.map((filter, index) => ({
        [filter]: { [Op.eq]: normalizeAndCastFilter(filter, adjustedFilterValues[index]) }
      }));
    }

    console.log('Final Query Options for GRM Users by Location:', findAndCountOptions);

    const { count, rows: grmUsers } = await Users.findAndCountAll(findAndCountOptions);

    const usersWithPhotos = grmUsers.map(user => {
      if (user.photo) {
        user.photo = 'data:image/png;base64,' + user.photo.toString('base64');
      } else {
        user.photo = '';
      }
      return user;
    });

    res.status(200).send({
      data: usersWithPhotos,
      total: count,
      code: '0000',
      message: 'GRM users by location (including national) retrieved successfully',
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: 'Unable to retrieve GRM users by location. Please try again later.' });
  }
};



exports.modelAdminUsers = async (req, res) => {
  try {
    console.log('Getting GRMS', req.body);
    const { currentUser, filters = [], filterValues = [], limit = 10, page = 1 } = req.body;
    const { roles: currentUserRoles = [], county_id: userCounty } = currentUser;

    console.log('Current User Roles:', currentUserRoles);

    // Extract unique subordinate role IDs from the current user roles
    const uniqueSubordinates = [
      ...new Set(
        currentUserRoles.flatMap(role => role.subordinates || [])
      )
    ];

 

    const findAndCountOptions = {
      include: [
        {
          model: db.models.user_roles,
          // as: 'roles', // Alias as defined in your User model associations
          // through: {
          //   model: db.models.user_roles,
          //   as: 'user_roles', // Alias for the user_roles join table
          //   attributes: ['roleid', 'location_level', 'location_id', 'county_id', 'settlement_id'], // Select specific fields from user_roles
          // },
          required: true,
          where: {
            roleid: uniqueSubordinates,
            roleid: 1 // ADMIN
          }
        },
        {
          model: db.models.county,
          attributes: ['id', 'name', 'code'],
          required: false
        }
      ],
      where: {
        id: { [Op.ne]: currentUser.id } // Exclude current user
      },
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'DESC']] // Add this line to sort by ID in descending order

    };

    // Normalize and cast filter values based on the column type
    const normalizeAndCastFilter = (filter, value) => {
      if (typeof value === 'string') {
        // Cast value for boolean columns
        if (value === 'true' || value === 'false') {
          return Sequelize.cast(value === 'true', 'BOOLEAN');
        }
        // Cast value for integer columns
        if (!isNaN(value)) {
          return Sequelize.cast(value, 'INTEGER');
        }
      }
      return value; // Default case
    };

    // Add filter conditions if filters and values are provided
    if (filters.length === filterValues.length) {
      findAndCountOptions.where[Op.and] = filters.map((filter, index) => ({
        [filter]: { [Op.eq]: normalizeAndCastFilter(filter, filterValues[index]) }
      }));
    }

    console.log('Final Query Options for GRM Users:', findAndCountOptions);

    // Query users and include their roles with user_roles details
    const { count, rows: grmUsers } = await Users.findAndCountAll(findAndCountOptions);

    // Convert photo binary data to base64 URL
    const usersWithPhotos = grmUsers.map(user => {
      if (user.photo) {
        user.photo = 'data:image/png;base64,' + user.photo.toString('base64');
      } else {
        user.photo = ''; // Assign empty string if no photo
      }
      return user;
    });

    res.status(200).send({
      data: usersWithPhotos,
      total: count,
      code: '0000',
      message: 'GRM users retrieved successfully',
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: 'Unable to retrieve GRM users. Please try again later.' });
  }
};
 

 
 
exports.modelUserByName = async (req, res) => {
  try {
    console.log('---------------------------------');
    console.log(req.body.searchString);

    const user = req.body.currentUser;
    const searchString = req.body.searchString;
    const filters = req.body.filters || [];
    const filterValues = req.body.filterValues || [];

    let limit = req.body.limit || 10;
    let page = req.body.page || 1;

    // Define role hierarchy
    const roleHierarchy = ['root_admin', 'super_admin', 'admin','grm', 'gbv', 'support', 'monitoring' ];

    // Determine the highest role of the current user
    let highestRole = null;
    for (const role of roleHierarchy) {
      if (user.roles.some(r => r.name === role)) {
        highestRole = role;
        break; // Stop at the highest role
      }
    }
    console.log(`Highest role of current user: ${highestRole}`);

    // Extract subordinate roles (only from the highest role)
    const highestRoleIndex = roleHierarchy.indexOf(highestRole);
    const allowedRoles = roleHierarchy.slice(highestRoleIndex + 1); // Get only lower roles

    console.log('Allowed Roles:', allowedRoles);

    // Find all users but exclude those with:
    // - A higher or same level role
    const findAndCountOptions = {
      include: [
        {
          model: db.models.user_roles,
          required: true,
          where: {
            userid: { [Op.ne]: user.id }, // Exclude current user
          },
        },
        {
          model: db.models.county,
          attributes: ['id', 'name', 'code'],
          required: false
        }
      ],
      where: {
        id: {
          [Op.notIn]: Sequelize.literal(`
            (SELECT user_roles.userid FROM user_roles
            JOIN roles ON user_roles.roleid = roles.id
            WHERE roles.name IN ('${roleHierarchy.slice(0, highestRoleIndex + 1).join("', '")}')
            )`),
        },
      },
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'DESC']],
    };

    console.log('Users with higher or same level roles are excluded');

    // Apply search string condition
    if (searchString) {
      findAndCountOptions.where[Op.or] = [
        { name: { [Op.iLike]: `%${searchString}%` } },
        { username: { [Op.iLike]: `%${searchString}%` } },
        { email: { [Op.iLike]: `%${searchString}%` } },
        { phone: { [Op.iLike]: `%${searchString}%` } }
      ];
    }

    // Apply additional filters
    filters.forEach((filter, index) => {
      const value = filterValues[index];
      if (Array.isArray(value)) {
        findAndCountOptions.where[filter] = {
          [Op.in]: value,
        };
      } else {
        findAndCountOptions.where[filter] = value;
      }
    });

    // Fetch users
    const { count, rows: usersWithSubordinates } = await Users.findAndCountAll(findAndCountOptions);

    console.log('Total Users with Subordinate Roles:', count);

    // Convert photo binary data to base64 URL
    const usersWithPhotos = usersWithSubordinates.map(user => {
      user.photo = user.photo
        ? 'data:image/png;base64,' + user.photo.toString('base64')
        : '';
      return user;
    });

    res.status(200).send({
      data: usersWithPhotos,
      total: count,
      code: '0000',
      message: 'Users retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send({ message: 'Unable to retrieve users. Please try again later.' });
  }
};



 

exports.checkUser = async (req, res) => {
  const { username, phone } = req.body;

  // Validate input
  if (!username || !phone) {
    return res.status(400).json({ message: "Username and phone number are required." });
  }

  try {
    // Query the database to find the user
    const user = await User.findOne({
      where: {
        username,
        phone,
      },
    });

    if (user) {

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
      apikey: '***REDACTED***',
      partnerID: '12108',
      shortcode: 'KISIP',
      message: 'Your verification code is: ' + otpCode + '.',
      mobile: req.body.phone,
    };

     axios.post(url, requestData)
          .then(response => {
            console.log('Response:', response.data);
          })
          .catch(error => {
            console.error('Error:', error);
          });


      // If user is found
      res.status(200).send({
        message: "User found.",
        user: {
          id: user.id,
          username: user.username,
          phone: user.phone,
        },
        code: '0000',
       });

      
    } else {
      // If no user is found
      return res.status(404).json({ message: "User account not found." });
    }
  } catch (error) {
    console.error("Error checking user:", error);
    return res.status(500).json({ message: "An error occurred while checking the user." });
  }
};

 

exports._deleteUserCascade = async (req, res) => {
  try {
    const { user_id, otp } = req.body;

    console.log( 'user_id, otp', user_id, otp)

    // Validate input
    if (!user_id || !otp) {
      return res.status(400).send({
        message: "OTP code required.",
      });
    }

    // Verify OTP (assuming you store OTPs in a database or cache)
    const storedOTP = await db.models.otp.findOne({
      where: {
        otp:otp,
        status: 'Valid', // Ensure the OTP's status is 'valid'
      },
    });
    

    if (!storedOTP ) {
      return res.status(401).send({
        message: "Invalid or expired OTP.",
      });
    }

    // Find the user by ID
    const user = await db.models.users.findByPk(user_id);

    if (!user) {
      return res.status(404).send({
        message: "User not found.",
      });
    }

    // Delete the user (Cascade happens automatically if the DB is set up correctly)
    await user.destroy();

    // Optionally, delete the OTP record after successful deletion
    await storedOTP.destroy();

    res.status(200).send({
      message: "User account and associated records deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).send({
      message: "An error occurred while deleting the user.",
      error: error.message,
    });
  }
};


exports.deleteUserCascade = async (req, res) => {
  try {
    const { user_id, otp } = req.body;

    console.log('user_id, otp', user_id, otp);

    // Validate input
    if (!user_id || !otp) {
      return res.status(400).send({
        message: "User ID and OTP code are required.",
      });
    }

    // Verify OTP
    const storedOTP = await db.models.otp.findOne({
      where: {
        otp: otp,
        status: 'Valid',
      },
    });

    if (!storedOTP) {
      return res.status(401).send({
        message: "Invalid or expired OTP.",
      });
    }

    // Find the user by ID
    const user = await db.models.users.findByPk(user_id);

    if (!user) {
      return res.status(404).send({
        message: "User not found.",
      });
    }

    // Get all associations for the user model
    const associations = db.models.users.associations;

    // Delete all associated records iteratively
    for (const assocName in associations) {
      const association = associations[assocName];

      if (association.target) {
        // Get related model
        const relatedModel = association.target;

        // Handle different association types
        switch (association.associationType) {
          case 'HasMany':
          case 'HasOne':
            await relatedModel.destroy({
              where: { [association.foreignKey]: user_id },
            });
            break;
          case 'BelongsToMany':
            // Handle junction table deletion for many-to-many relationships
            const throughTable = association.throughModel || association.through;
            await throughTable.destroy({
              where: { [association.foreignKey]: user_id },
            });
            break;
          case 'BelongsTo':
            // Update foreign key to NULL in the related table
            await relatedModel.update(
              { [association.foreignKey]: null },
              { where: { [association.foreignKey]: user_id } }
            );
            break;
          default:
            console.log(`Unhandled association type: ${association.associationType}`);
        }
      }
    }

    // Delete the user
    await user.destroy();

    // Optionally, delete the OTP record after successful deletion
    await storedOTP.destroy();

    // res.status(200).send({
    //   message: "User account and associated records deleted successfully.",
    // });

    res.status(200).send({
      message: "User account and associated records deleted successfully.",
      data:user,
      code: '0000',
     });

  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).send({
      message: "An error occurred while deleting the user.",
      error: error.message,
    });
  }
};

 

exports.rolesController = (req, res) => {
 
  var qry = {}
  //qry['id'] != 0
  //qry.where = [['id'] != 0]

  // remove super admin from the roles querry 
  qry.where =  {
    id: { [op.notIn]: [0] }
  }


 
   Role
    .findAndCountAll(qry)
    .then((list) => {
       res.status(200).send({
        data: list.rows,
        total: list.count,
        code: '0000'
      })
    })
}


exports.sendFeedback = (req, res) => {
 
 console.log('feedback received')
 var obj = req.body
  console.log(obj)
 // insert
 db.models.feedback
 .create(obj)
 .then(async function (item) {
   // Special for projects where we store the project-activty relation 
      res.status(200).send({
       message: 'We have received your feedback. We will revert.',
        code: '0000'
   })
 })
 .catch(function (err) {
    console.log(err)
   return res.status(500).send({ message: 'We are unable to receive your feedback at this moment. Please try again later.' })
 })
}

exports.getFeedback = (req, res) => {
 
  console.log('feedback in system')

  db.models.feedback.findAndCountAll(qry).then((list) => {
    console.log(list)
    res.status(200).send({
      data: list.rows,
      total: list.count,
      code: '0000',
      message: 'Feedback received.'
    })
  })


 }



  exports.checkUsers =async (req, res) => {
  const { usernames } = req.body;

  if (!Array.isArray(usernames) || usernames.length === 0) {
    return res.status(400).json({ message: "Usernames must be a non-empty array." });
  }

  try {
    const users = await User.findAll({
      where: {
        username: usernames,
      },
      attributes: ["username"],
    });

    const foundUsernames = users.map(user => user.username);

    const result = usernames.map(username => ({
      username,
      exists: foundUsernames.includes(username),
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("Error checking users:", error);
    res.status(500).json({ message: "An error occurred while checking users." });
  }
};

// Add function to get user permissions
exports.getUserPermissions = async (req, res) => {
  try {
    const userId = req.body.userId;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Find user with roles and permissions
    const user = await User.findByPk(userId, {
      include: [{
        model: Role,
        include: [db.permission]
      }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Flatten all permissions from all roles
    const userPermissions = user.roles.flatMap(role => 
      role.permissions.map(p => p.name)
    );

    // Remove duplicates
    const uniquePermissions = [...new Set(userPermissions)];

    res.status(200).json({
      message: 'User permissions retrieved successfully',
      data: uniquePermissions,
      code: '0000'
    });
  } catch (err) {
    console.error('Error fetching user permissions:', err);
    res.status(500).json({ 
      message: 'Error fetching user permissions', 
      error: err.message,
      code: '0001'
    });
  }
};

// Get users by IDs and fields
exports.getUsersByIds = async (req, res) => {
  try {
    const { userIds, fields } = req.body;

    // Validate input
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ 
        message: 'User IDs must be a non-empty array',
        code: '0001'
      });
    }

    // Default fields if none provided
    const selectedFields = fields && Array.isArray(fields) && fields.length > 0 
      ? fields 
      : ['id', 'name', 'phone', 'email', 'username'];

    // Build query
    const query = {
      where: {
        id: { [Op.in]: userIds }
      },
      attributes: selectedFields,
      raw: true
    };

    // Execute query
    const users = await User.findAll(query);

    res.status(200).json({
      message: 'Users retrieved successfully',
      data: users,
      total: users.length,
      code: '0000'
    });

  } catch (err) {
    console.error('Error fetching users by IDs:', err);
    res.status(500).json({ 
      message: 'Error fetching users by IDs', 
      error: err.message,
      code: '0001'
    });
  }
};
 