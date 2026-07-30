const db = require('../models')
const config = require('../config/db.config.js')
const User = db.user
const Users = db.models.users
const Role = db.role
const OTP = db.models.otp
const axios = require('axios');
const UserRoles = db.models.user_roles
const { isUserSMSEnabled, isFeedbackSMSEnabled } = require('../utils/smsSettings')

const Sequelize = require('sequelize')
 const op = Sequelize.Op
 
 
const { Op } = require('sequelize');
const { getActiveRolesGetOptions } = require('../utils/userRoleExpiry')
const {
  buildUserListWhere,
  userListIncludes,
} = require('../utils/userListScope')

//const User = db.user;
//const Role = db.role;

//const Ownership = db.models.ownership_type;

exports.allAccess = (req, res) => {
  res.status(200).send('Public Content.')
}

exports.userBoard = (req, res) => {
  const authorities = []

  User.findByPk(req.thisUser.id).then((user) => {
    user.getRoles(getActiveRolesGetOptions()).then((roles) => {
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

 
  

 

exports.modelAllUsers = async (req, res) => {
  try {
    const viewerId = req.thisUser?.id ?? req.body.currentUser?.id;
    const reg_model = req.body.model || 'users';
    const filters = req.body.filters || [];
    const filterValues = req.body.filterValues || [];
    const searchString = req.body.searchString;
    const limit = req.body.limit || 10;
    const page = req.body.page || 1;

    const where = await buildUserListWhere(viewerId, {
      searchString,
      filters,
      filterValues,
    });

    const findAndCountOptions = {
      include: userListIncludes(),
      where,
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'DESC']],
      distinct: true,
      attributes: { exclude: ['photo', 'password', 'resetPasswordExpires', 'resetPasswordToken'] },
    };

    const { count, rows: users } = await db.models[reg_model].findAndCountAll(findAndCountOptions);

    const usersForPage = users.map((row) => ({
      ...row.toJSON(),
      country_name: row.country_name || 'Not specified',
    }));

    res.status(200).send({
      data: usersForPage,
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
    const viewerId = req.thisUser?.id ?? req.body.currentUser?.id;
    const {
      filters = [],
      filterValues = [],
      limit = 10,
      page = 1,
      searchString,
    } = req.body;

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

    const where = await buildUserListWhere(viewerId, {
      searchString,
      filters,
      filterValues,
      normalizeFilter: (_filter, value) => normalizeAndCastFilter(_filter, value),
    });

    const findAndCountOptions = {
      include: userListIncludes(),
      where,
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'DESC']],
      attributes: { exclude: ['photo', 'password', 'resetPasswordExpires', 'resetPasswordToken'] },
      distinct: true,
    };

    const { count, rows: users } = await db.models.users.findAndCountAll(findAndCountOptions);

    const usersForPage = users.map((user) => ({
      ...user.toJSON(),
      country_name: user.country_name || 'KE',
    }));

    res.status(200).send({
      data: usersForPage,
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
    const {
      currentUser,
      filters = [],
      filterValues = [],
      limit = 10,
      page = 1,
      searchString,
      locationLevel,
    } = req.body;
    const validLocationLevels = ['national', 'county', 'settlement'];
    const requestedLocationLevel = validLocationLevels.includes(locationLevel) ? locationLevel : null;
    const parsedLimit = Number.parseInt(limit, 10);
    const parsedPage = Number.parseInt(page, 10);
    const safeLimit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 10;
    const safePage = Number.isFinite(parsedPage) ? Math.max(parsedPage, 1) : 1;

    console.log('=== modelGRMUsers called ===');
    console.log('Request params:', { 
      currentUserId: currentUser?.id, 
      filters, 
      filterValues, 
      limit, 
      page, 
      searchString 
    });

    // Find GRM role by name
    const grmRole = await db.models.roles.findOne({
      where: { name: 'grm' }
    });

    console.log('GRM role found:', grmRole ? { id: grmRole.id, name: grmRole.name } : 'NOT FOUND');

    if (!grmRole) {
      return res.status(404).send({
        message: 'GRM role not found',
        code: 'ROLE_NOT_FOUND'
      });
    }

    // Build where clause
    const whereClause = {
      id: { [Op.ne]: currentUser.id } // Exclude current user
    };

    // Add search condition if provided
    if (searchString) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${searchString}%` } },
        { username: { [Op.iLike]: `%${searchString}%` } },
        { email: { [Op.iLike]: `%${searchString}%` } },
        { phone: { [Op.iLike]: `%${searchString}%` } }
      ];
    }

    // Add filter conditions if provided
    if (filters.length === filterValues.length && filters.length > 0) {
      const filterConditions = filters.map((filter, index) => {
        let value = filterValues[index];
        // Cast boolean strings
        if (value === 'true' || value === 'false') {
          value = value === 'true';
        }
        // Cast numeric strings
        else if (!isNaN(value)) {
          value = Number(value);
        }
        return { [filter]: { [Op.eq]: value } };
      });
      // Combine with existing conditions
      if (whereClause[Op.or]) {
        whereClause[Op.and] = [
          { [Op.or]: whereClause[Op.or] },
          ...filterConditions
        ];
        delete whereClause[Op.or];
      } else {
        whereClause[Op.and] = filterConditions;
      }
    }

    console.log('Where clause:', JSON.stringify(whereClause, null, 2));

    const grmRoleWhere = { roleid: grmRole.id };
    if (requestedLocationLevel) grmRoleWhere.location_level = requestedLocationLevel;

    const requesterRoles = Array.isArray(currentUser?.roles) ? currentUser.roles : [];
    const requesterHasNationalAccess = requesterRoles.some((role) =>
      ['super_admin', 'root_admin'].includes(role.name) ||
      (role.name === 'admin' && role.user_roles?.location_level === 'national')
    );
    const requesterCountyRole = requesterRoles.find((role) =>
      ['admin', 'staff'].includes(role.name) &&
      role.user_roles?.location_level === 'county' &&
      role.user_roles?.county_id
    );
    if (!requesterHasNationalAccess && requesterCountyRole?.user_roles?.county_id) {
      grmRoleWhere.county_id = requesterCountyRole.user_roles.county_id;
    }

    // Query only the active location-level tab and requested page.
    const { count, rows: grmUsers } = await Users.findAndCountAll({
      include: [
        {
          model: db.models.user_roles,
          required: true,
          where: grmRoleWhere,
          include: [
            {
              model: db.models.roles,
              required: false
            }
          ]
        },
        {
          model: db.models.county,
          attributes: ['id', 'name', 'code'],
          required: false
        }
      ],
      where: whereClause,
      limit: safeLimit,
      offset: (safePage - 1) * safeLimit,
      order: [['id', 'DESC']],
      distinct: true,
      attributes: { exclude: ['photo', 'password', 'resetPasswordExpires', 'resetPasswordToken'] }
    });

    // Log sample user roles to see what's being returned
    const sampleUserRoles = grmUsers[0] ? grmUsers[0].user_roles?.map(ur => ({
      roleid: ur.roleid,
      location_level: ur.location_level,
      role_name: ur.role?.name,
      isGrm: ur.roleid === grmRole.id
    })) || [] : [];
    
    // Check if any users have settlement level roles
    const usersWithSettlementRoles = grmUsers.filter(user => {
      const userObj = user.toJSON ? user.toJSON() : user;
      return userObj.user_roles?.some(ur => ur.location_level === 'settlement');
    });

    console.log('Query results:', { 
      totalCount: count, 
      returnedUsers: grmUsers.length,
      usersWithSettlementRoles: usersWithSettlementRoles.length,
      sampleUser: grmUsers[0] ? {
        id: grmUsers[0].id,
        name: grmUsers[0].name,
        username: grmUsers[0].username,
        user_roles_count: grmUsers[0].user_roles?.length || 0,
        user_roles: sampleUserRoles
      } : null
    });
    
    if (usersWithSettlementRoles.length > 0) {
      console.log('WARNING: Found users with settlement roles in response:', usersWithSettlementRoles.map(u => ({
        id: u.id,
        name: u.name,
        settlementRoles: u.user_roles?.filter(ur => ur.location_level === 'settlement').map(ur => ({
          roleid: ur.roleid,
          role_name: ur.role?.name,
          isGrm: ur.roleid === grmRole.id
        }))
      })));
    }

    const usersForPage = grmUsers.map(user => {
      const userObj = user.toJSON ? user.toJSON() : user;
      if (userObj.user_roles && Array.isArray(userObj.user_roles)) {
        userObj.user_roles = userObj.user_roles.filter(ur => ur.roleid === grmRole.id);
      }
      return userObj;
    });

    console.log('Final response:', {
      dataCount: usersForPage.length,
      total: count,
      locationLevel: requestedLocationLevel,
    });

    res.status(200).send({
      data: usersForPage,
      total: count,
      code: '0000',
      message: 'GRM users retrieved successfully',
    });
  } catch (error) {
    console.error('Error in modelGRMUsers:', error);
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
    let { currentUser, county_id, settlement_id, filters = [], filterValues = [], limit = 10000, page = 1, include_national = false } = req.body;
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

    const locationConditions = [];

    if (settlement_id?.length) {
      locationConditions.push({ settlement_id: { [Op.in]: settlement_id } });
    }

    if (!settlement_id?.length && county_id?.length) {
      locationConditions.push({ county_id: { [Op.in]: county_id } });
    }

    if (include_national) {
      locationConditions.push({ location_level: 'national' });
    }

    if (!locationConditions.length) {
      return res.status(400).send({
        message: 'Unable to determine location filter for GRM users.'
      });
    }

    const findAndCountOptions = {
      include: [
        {
          model: db.models.user_roles,
          required: true,
          where: {
            [Op.and]: [
              { roleid: 4 },
              { [Op.or]: locationConditions }
            ]
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

/**
 * New, clearer GRM endpoints by level
 * -----------------------------------------------------------------------------
 * - getSettlementGRMUsers: GRM Officers linked to a specific settlement_id
 * - getCountyGRMUsers:     GRM Officers linked to a specific county_id
 * - getNationalGRMUsers:   GRM Officers with location_level = 'national'
 */

// Settlement-level GRM officers (requires settlement_id)
exports.getSettlementGRMUsers = async (req, res) => {
  try {
    const { settlement_id, limit = 10000, page = 1 } = req.body;

    if (!settlement_id) {
      return res.status(400).send({
        message: 'settlement_id is required to fetch settlement GRM users.',
      });
    }

    const findAndCountOptions = {
      include: [
        {
          model: db.models.user_roles,
          required: true,
          where: {
            roleid: 4,
            settlement_id,
          },
        },
        {
          model: db.models.county,
          attributes: ['id', 'name', 'code'],
          required: false,
        },
      ],
      where: {},
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'DESC']],
    };

    const { count, rows: grmUsers } = await Users.findAndCountAll(findAndCountOptions);

    const usersWithPhotos = grmUsers.map((user) => {
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
      message: 'Settlement GRM users retrieved successfully',
    });
  } catch (error) {
    console.error('Error in getSettlementGRMUsers:', error);
    res.status(500).send({ message: 'Unable to retrieve settlement GRM users. Please try again later.' });
  }
};

// County-level GRM officers (requires county_id)
exports.getCountyGRMUsers = async (req, res) => {
  try {
    const { county_id, limit = 10000, page = 1 } = req.body;

    if (!county_id) {
      return res.status(400).send({
        message: 'county_id is required to fetch county GRM users.',
      });
    }

    const findAndCountOptions = {
      include: [
        {
          model: db.models.user_roles,
          required: true,
          where: {
            roleid: 4,
            county_id,
          },
        },
        {
          model: db.models.county,
          attributes: ['id', 'name', 'code'],
          required: false,
        },
      ],
      where: {},
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'DESC']],
    };

    const { count, rows: grmUsers } = await Users.findAndCountAll(findAndCountOptions);

    const usersWithPhotos = grmUsers.map((user) => {
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
      message: 'County GRM users retrieved successfully',
    });
  } catch (error) {
    console.error('Error in getCountyGRMUsers:', error);
    res.status(500).send({ message: 'Unable to retrieve county GRM users. Please try again later.' });
  }
};

// National-level GRM officers (no county/settlement id required)
exports.getNationalGRMUsers = async (req, res) => {
  try {
    const { limit = 10000, page = 1 } = req.body;

    const findAndCountOptions = {
      include: [
        {
          model: db.models.user_roles,
          required: true,
          where: {
            roleid: 4,
            location_level: 'national',
          },
        },
        {
          model: db.models.county,
          attributes: ['id', 'name', 'code'],
          required: false,
        },
      ],
      where: {},
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'DESC']],
    };

    const { count, rows: grmUsers } = await Users.findAndCountAll(findAndCountOptions);

    const usersWithPhotos = grmUsers.map((user) => {
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
      message: 'National GRM users retrieved successfully',
    });
  } catch (error) {
    console.error('Error in getNationalGRMUsers:', error);
    res.status(500).send({ message: 'Unable to retrieve national GRM users. Please try again later.' });
  }
};



exports.modelAdminUsers = async (req, res) => {
  try {
    const {
      currentUser,
      filters = [],
      filterValues = [],
      limit = 10,
      page = 1,
      searchString,
      locationLevel,
    } = req.body;

    const validLocationLevels = ['national', 'county', 'settlement'];
    const requestedLocationLevel = validLocationLevels.includes(locationLevel)
      ? locationLevel
      : null;
    const parsedLimit = Number.parseInt(limit, 10);
    const parsedPage = Number.parseInt(page, 10);
    const safeLimit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 10;
    const safePage = Number.isFinite(parsedPage) ? Math.max(parsedPage, 1) : 1;

    console.log('=== modelAdminUsers called ===');
    console.log('Request params:', { 
      currentUserId: currentUser?.id, 
      filters, 
      filterValues, 
      limit, 
      page, 
      searchString 
    });

    // Find admin role by name
    const adminRole = await db.models.roles.findOne({
      where: { name: 'admin' }
    });

    console.log('Admin role found:', adminRole ? { id: adminRole.id, name: adminRole.name } : 'NOT FOUND');

    if (!adminRole) {
      return res.status(404).send({
        message: 'Admin role not found',
        code: 'ROLE_NOT_FOUND'
      });
    }

    // Build where clause
    const whereClause = {
      id: { [Op.ne]: currentUser.id } // Exclude current user
    };

    // Add search condition if provided
    if (searchString) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${searchString}%` } },
        { username: { [Op.iLike]: `%${searchString}%` } },
        { email: { [Op.iLike]: `%${searchString}%` } },
        { phone: { [Op.iLike]: `%${searchString}%` } }
      ];
    }

    // Add filter conditions if provided
    if (filters.length === filterValues.length && filters.length > 0) {
      const filterConditions = filters.map((filter, index) => {
        let value = filterValues[index];
        // Cast boolean strings
        if (value === 'true' || value === 'false') {
          value = value === 'true';
        }
        // Cast numeric strings
        else if (!isNaN(value)) {
          value = Number(value);
        }
        return { [filter]: { [Op.eq]: value } };
      });
      // Combine with existing conditions
      if (whereClause[Op.or]) {
        whereClause[Op.and] = [
          { [Op.or]: whereClause[Op.or] },
          ...filterConditions
        ];
        delete whereClause[Op.or];
      } else {
        whereClause[Op.and] = filterConditions;
      }
    }

    console.log('Where clause:', JSON.stringify(whereClause, null, 2));

    const adminRoleWhere = { roleid: adminRole.id };
    if (requestedLocationLevel) {
      adminRoleWhere.location_level = requestedLocationLevel;
    }

    // County administrators may only list administrators assigned within their county.
    const requesterRoles = Array.isArray(currentUser?.roles) ? currentUser.roles : [];
    const requesterHasNationalAccess = requesterRoles.some((role) =>
      ['super_admin', 'root_admin'].includes(role.name) ||
      (role.name === 'admin' && role.user_roles?.location_level === 'national')
    );
    const requesterCountyRole = requesterRoles.find((role) =>
      ['admin', 'staff'].includes(role.name) &&
      role.user_roles?.location_level === 'county' &&
      role.user_roles?.county_id
    );
    if (!requesterHasNationalAccess && requesterCountyRole?.user_roles?.county_id) {
      adminRoleWhere.county_id = requesterCountyRole.user_roles.county_id;
    }

    // Query only the requested tab/page. The photo blob is intentionally excluded:
    // this administration table does not render avatars and converting thousands of
    // blobs to Base64 was the main production payload/CPU bottleneck.
    const { count, rows: adminUsers } = await Users.findAndCountAll({
      include: [
        {
          model: db.models.user_roles,
          required: true,
          where: adminRoleWhere,
          include: [
            {
              model: db.models.roles,
              required: false
            }
          ]
        },
        {
          model: db.models.county,
          attributes: ['id', 'name', 'code'],
          required: false
        }
      ],
      where: whereClause,
      limit: safeLimit,
      offset: (safePage - 1) * safeLimit,
      order: [['id', 'DESC']],
      distinct: true,
      attributes: { exclude: ['photo', 'password', 'resetPasswordExpires', 'resetPasswordToken'] }
    });

    // Log sample user roles to see what's being returned
    const sampleUserRoles = adminUsers[0] ? adminUsers[0].user_roles?.map(ur => ({
      roleid: ur.roleid,
      location_level: ur.location_level,
      role_name: ur.role?.name,
      isAdmin: ur.roleid === adminRole.id
    })) || [] : [];
    
    // Check if any users have settlement level roles
    const usersWithSettlementRoles = adminUsers.filter(user => {
      const userObj = user.toJSON ? user.toJSON() : user;
      return userObj.user_roles?.some(ur => ur.location_level === 'settlement');
    });

    console.log('Query results:', { 
      totalCount: count, 
      returnedUsers: adminUsers.length,
      usersWithSettlementRoles: usersWithSettlementRoles.length,
      sampleUser: adminUsers[0] ? {
        id: adminUsers[0].id,
        name: adminUsers[0].name,
        username: adminUsers[0].username,
        user_roles_count: adminUsers[0].user_roles?.length || 0,
        user_roles: sampleUserRoles
      } : null
    });
    
    if (usersWithSettlementRoles.length > 0) {
      console.log('WARNING: Found users with settlement roles in response:', usersWithSettlementRoles.map(u => ({
        id: u.id,
        name: u.name,
        settlementRoles: u.user_roles?.filter(ur => ur.location_level === 'settlement').map(ur => ({
          roleid: ur.roleid,
          role_name: ur.role?.name,
          isAdmin: ur.roleid === adminRole.id
        }))
      })));
    }

    const usersForPage = adminUsers.map(user => {
      const userObj = user.toJSON ? user.toJSON() : user;
      // Ensure only admin roles are included in user_roles (safety filter)
      if (userObj.user_roles && Array.isArray(userObj.user_roles)) {
        userObj.user_roles = userObj.user_roles.filter(ur => ur.roleid === adminRole.id);
      }
      
      return userObj;
    });
    
    // Log settlement roles after filtering
    const settlementRolesAfterFilter = usersForPage.filter(user =>
      user.user_roles?.some(ur => ur.location_level === 'settlement')
    );
    
    if (settlementRolesAfterFilter.length > 0) {
      console.log('After filtering - Users with settlement admin roles:', settlementRolesAfterFilter.length);
      console.log('Settlement admin users:', settlementRolesAfterFilter.map(u => ({
        id: u.id,
        name: u.name,
        settlementRoles: u.user_roles?.filter(ur => ur.location_level === 'settlement')
      })));
    } else {
      console.log('After filtering - No users with settlement admin roles found');
    }

    console.log('Final response:', {
      dataCount: usersForPage.length,
      total: count,
      locationLevel: requestedLocationLevel,
      firstUser: usersForPage[0] ? {
        id: usersForPage[0].id,
        name: usersForPage[0].name,
        user_roles_count: usersForPage[0].user_roles?.length || 0
      } : null
    });

    res.status(200).send({
      data: usersForPage,
      total: count,
      code: '0000',
      message: 'Admin users retrieved successfully',
    });
  } catch (error) {
    console.error('Error in modelAdminUsers:', error);
    res.status(500).send({ message: 'Unable to retrieve admin users. Please try again later.' });
  }
};
 

 
 
exports.modelSuperAdminUsers = async (req, res) => {
  try {
    const {
      currentUser,
      filters = [],
      filterValues = [],
      limit = 10,
      page = 1,
      searchString,
    } = req.body;

    const superAdminRole = await db.models.roles.findOne({
      where: { name: 'super_admin' },
    });

    if (!superAdminRole) {
      return res.status(404).send({
        message: 'Super admin role not found',
        code: 'ROLE_NOT_FOUND',
      });
    }

    const whereClause = {};

    if (searchString) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${searchString}%` } },
        { username: { [Op.iLike]: `%${searchString}%` } },
        { email: { [Op.iLike]: `%${searchString}%` } },
        { phone: { [Op.iLike]: `%${searchString}%` } },
      ];
    }

    if (filters.length === filterValues.length && filters.length > 0) {
      const filterConditions = filters.map((filter, index) => {
        let value = filterValues[index];
        if (value === 'true' || value === 'false') {
          value = value === 'true';
        } else if (!isNaN(value)) {
          value = Number(value);
        }
        return { [filter]: { [Op.eq]: value } };
      });
      if (whereClause[Op.or]) {
        whereClause[Op.and] = [{ [Op.or]: whereClause[Op.or] }, ...filterConditions];
        delete whereClause[Op.or];
      } else {
        whereClause[Op.and] = filterConditions;
      }
    }

    whereClause.id = {
      [Op.and]: [
        { [Op.ne]: currentUser.id },
        {
          [Op.in]: db.sequelize.literal(
            `(SELECT userid FROM user_roles WHERE roleid = ${Number(superAdminRole.id)})`
          ),
        },
      ],
    };

    const { count, rows: superAdminUsers } = await Users.findAndCountAll({
      include: [
        {
          model: db.models.user_roles,
          required: false,
          include: [{ model: db.models.roles, required: false }],
        },
        {
          model: db.models.county,
          attributes: ['id', 'name', 'code'],
          required: false,
        },
      ],
      where: whereClause,
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'DESC']],
      attributes: { exclude: ['photo', 'password', 'resetPasswordExpires', 'resetPasswordToken'] },
      distinct: true,
    });

    const usersForPage = superAdminUsers.map((user) => user.toJSON ? user.toJSON() : user);

    res.status(200).send({
      data: usersForPage,
      total: count,
      code: '0000',
      message: 'Super admin users retrieved successfully',
    });
  } catch (error) {
    console.error('Error in modelSuperAdminUsers:', error);
    res.status(500).send({
      message: 'Unable to retrieve super admin users. Please try again later.',
    });
  }
};

exports.modelUserByName = async (req, res) => {
  try {
    const viewerId = req.thisUser?.id ?? req.body.currentUser?.id;
    const searchString = req.body.searchString;
    const filters = req.body.filters || [];
    const filterValues = req.body.filterValues || [];
    const limit = req.body.limit || 10;
    const page = req.body.page || 1;

    const where = await buildUserListWhere(viewerId, {
      searchString,
      filters,
      filterValues,
    });

    const findAndCountOptions = {
      include: userListIncludes(),
      where,
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'DESC']],
      distinct: true,
      attributes: { exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken'] },
    };

    const { count, rows: usersWithSubordinates } = await Users.findAndCountAll(findAndCountOptions);

    const usersWithPhotos = usersWithSubordinates.map((user) => ({
      ...user.toJSON(),
      photo: user.photo
        ? `data:image/png;base64,${user.photo.toString('base64')}`
        : '',
    }));

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
      apikey: process.env.SMS_API_KEY,
      partnerID: process.env.SMS_PARTNER_ID || '12108',
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

 

// Get user session statistics
exports.getUserSessionStats = async (req, res) => {
  try {
    const userId = req.params.userId || req.body.userId;
    const { limit = 10, fromDate, toDate } = req.query;
    
    if (!userId) {
      return res.status(400).send({
        message: 'User ID is required'
      });
    }

    const sessionTracker = require('../utils/sessionTracker');
    
    const options = {
      limit: parseInt(limit),
      fromDate: fromDate ? new Date(fromDate) : null,
      toDate: toDate ? new Date(toDate) : null
    };

    const stats = await sessionTracker.getUserSessionStats(userId, options);
    
    res.status(200).send({
      message: 'Session statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Error getting user session stats:', error);
    res.status(500).send({
      message: 'Error retrieving session statistics',
      error: error.message
    });
  }
};

// Get active sessions
exports.getActiveSessions = async (req, res) => {
  try {
    const { hoursThreshold = 24 } = req.query;
    
    const sessionTracker = require('../utils/sessionTracker');
    
    const activeSessions = await sessionTracker.getActiveSessions({
      hoursThreshold: parseInt(hoursThreshold)
    });
    
    res.status(200).send({
      message: 'Active sessions retrieved successfully',
      data: {
        count: activeSessions.length,
        sessions: activeSessions
      }
    });
  } catch (error) {
    console.error('Error getting active sessions:', error);
    res.status(500).send({
      message: 'Error retrieving active sessions',
      error: error.message
    });
  }
};

// Get session logs with duration information
exports.getSessionLogs = async (req, res) => {
  try {
    const { userId, action = 'Logout', limit = 50, offset = 0 } = req.query;
    
    let whereClause = {
      action: action,
      status: 'Successful'
    };
    
    if (userId) {
      whereClause.userId = userId;
    }
    
    // Only get logs that have session duration data
    if (action === 'Logout') {
      whereClause.sessionDuration = { [db.Sequelize.Op.ne]: null };
    }

    const logs = await db.models.logs.findAndCountAll({
      where: whereClause,
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: [
        'id',
        'userId',
        'userName',
        'action',
        'date',
        'source',
        'loginTime',
        'logoutTime',
        'sessionDuration',
        'sessionDurationFormatted'
      ]
    });

    res.status(200).send({
      message: 'Session logs retrieved successfully',
      data: {
        logs: logs.rows,
        total: logs.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error getting session logs:', error);
    res.status(500).send({
      message: 'Error retrieving session logs',
      error: error.message
    });
  }
};

// Get last login for multiple users (batch)
exports.getUsersLastLogin = async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).send({
        message: 'userIds array is required'
      });
    }

    const sessionTracker = require('../utils/sessionTracker');
    const lastLoginMap = {};

    // Fetch last login for all users in parallel
    await Promise.all(userIds.map(async (userId) => {
      try {
        const lastLoginLog = await sessionTracker.getLastLoginLog(userId);
        if (lastLoginLog && lastLoginLog.loginTime) {
          lastLoginMap[userId] = lastLoginLog.loginTime;
        } else if (lastLoginLog && lastLoginLog.date) {
          lastLoginMap[userId] = lastLoginLog.date;
        } else {
          lastLoginMap[userId] = null;
        }
      } catch (error) {
        console.error(`Error getting last login for user ${userId}:`, error);
        lastLoginMap[userId] = null;
      }
    }));

    res.status(200).send({
      data: lastLoginMap,
      code: '0000',
      message: 'Last login data retrieved successfully',
    });
  } catch (error) {
    console.error('Error getting users last login:', error);
    res.status(500).send({
      message: 'Unable to retrieve last login data',
      error: error.message
    });
  }
};

exports.rolesController = async (req, res) => {
  try {
    const currentUserRoles = Array.isArray(req.roles) ? req.roles : []
    const isRootAdmin = currentUserRoles.some((roleName) => roleName === 'root_admin')

    // Root admin can manage super_admin role assignments/removals.
    // Non-root users should not see protected top-level roles.
    const excludedRoleNames = isRootAdmin
      ? ['root_admin']
      : ['root_admin', 'super_admin']

    const qry = {
      where: {
        name: {
          [op.notIn]: excludedRoleNames
        }
      }
    }

    const list = await Role.findAndCountAll(qry)
    res.status(200).send({
      data: list.rows,
      total: list.count,
      code: '0000'
    })
  } catch (error) {
    console.error('rolesController error:', error)
    res.status(500).send({
      message: 'Failed to load roles',
      error: error.message
    })
  }
}


// Add SMS utility functions at the top of the file after the imports
function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return null;
  
  // Remove all non-digit characters
  let formattedNumber = phoneNumber.replace(/\D/g, '');
  
  // If it starts with 0, replace with 254
  if (formattedNumber.startsWith('0')) {
    return '254' + formattedNumber.slice(1);
  }
  
  // If it starts with 254, return as is
  if (formattedNumber.startsWith('254')) {
    return formattedNumber;
  }
  
  // If it starts with any other digit, prepend '254'
  return '254' + formattedNumber;
}

async function sendNotificationSMS(phone_number, message) {
  // Check if SMS is enabled for user module
  const smsEnabled = await isUserSMSEnabled()
  if (!smsEnabled) {
    console.log('SMS sending is disabled for user module. Skipping SMS notification.')
    return
  }

  const url = "https://quicksms.advantasms.com/api/services/sendotp/";
  
  if (!phone_number || !message) {
    console.warn("Invalid input: phone_number or message is missing.");
    return;
  }

  const requestData = {
    apikey: process.env.SMS_API_KEY,
    partnerID: process.env.SMS_PARTNER_ID || '12108',
    shortcode: "KISIP",
    message: message,
    mobile: formatPhoneNumber(phone_number),
  };

  try {
    const response = await axios.post(url, requestData);
    console.log(`SMS sent to ${phone_number}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error sending SMS to ${phone_number}:`, error);
    throw error;
  }
}


async function getUsersByRoles(roleNames, locationLevel = null, locationId = null) {
  try {
    const users = await Users.findAll({
      include: [
        {
          model: UserRoles,
          where: {
            roleid: { [Op.in]: [ -99,0,9] }  // Root, suprt Admin, and support
          }
        }
      ],
      attributes: ['id', 'name', 'phone', 'email', 'username']
    });

    return users;
  } catch (error) {
    console.error('Error fetching users by roles:', error);
    return [];
  }
}

exports.sendFeedback = async (req, res) => {
  console.log('feedback received')
  var obj = req.body
  console.log(obj)
  
  try {
    const feedbackPayload = {
      name: obj.name,
      email: obj.email,
      message: obj.message,
      // feedback.code is NOT NULL in DB model, so always provide one.
      code: obj.code || `FB-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
    }

    // Insert feedback into database
    const feedbackItem = await db.models.feedback.create(feedbackPayload);
    
    // Prepare SMS message for offices
    const smsMessage = `New feedback received from ${feedbackPayload.name} (${feedbackPayload.email}): ${feedbackPayload.message.substring(0, 100)}${feedbackPayload.message.length > 100 ? '...' : ''}`;
    
    // Get users with Support, Admin, and other roles (roleid: 0, 1, 9)
    const grmUsers = await getUsersByRoles();
    
    // Send SMS to each GRM user (only if feedback SMS is enabled)
    const smsEnabled = await isFeedbackSMSEnabled()
    if (smsEnabled) {
      const smsPromises = grmUsers.map(async (user) => {
        if (user.phone) {
          try {
            console.log(user)
           // await sendNotificationSMS(user.phone, smsMessage);
            console.log(`SMS notification sent to ${user.name} (${user.phone})`);
          } catch (error) {
            console.error(`Failed to send SMS to ${user.name}:`, error.message);
          }
        }
      });
    
      // Wait for all SMS to be sent (but don't fail if some fail)
      await Promise.allSettled(smsPromises);
    }
    
    res.status(200).send({
      message: 'We have received your feedback. We will revert.',
      code: '0000',
      smsSent: true,
      usersNotified: grmUsers.length
    });
    
  } catch (error) {
    console.error('Error processing feedback:', error);
    return res.status(500).send({ 
      message: 'We are unable to receive your feedback at this moment. Please try again later.',
      error: error.message
    });
  }
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

    const { getProjectProgrammeScope } = require('../utils/projectListScope');
    const programmeScope = await getProjectProgrammeScope(userId);

    res.status(200).json({
      message: 'User permissions retrieved successfully',
      data: uniquePermissions,
      programmeScope,
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
 
exports.modelSupportUsers = async (req, res) => {
  try {
    console.log('Getting Support Users', req.body);
    const { currentUser, filters = [], filterValues = [], limit = 10, page = 1 } = req.body;

    const findAndCountOptions = {
      include: [
        {
          model: db.models.user_roles,
          required: true,
          where: {
            roleid: 9 // Support role
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

    console.log('Final Query Options for Support Users:', findAndCountOptions);

    // Query users and include their roles with user_roles details
    const { count, rows: supportUsers } = await Users.findAndCountAll(findAndCountOptions);

    // Convert photo binary data to base64 URL
    const usersWithPhotos = supportUsers.map(user => {
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
      message: 'Support users retrieved successfully',
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: 'Unable to retrieve Support users. Please try again later.' });
  }
};
 
exports.forceLogout = async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    if (isNaN(targetUserId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    const user = await Users.findByPk(targetUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { forceLogoutUser } = require('../utils/forceLogoutUser');
    const source = req.headers['x-forwarded-for']?.split(',')[0]
      || req.headers['x-real-ip']
      || req.connection?.remoteAddress
      || 'Admin force logout';

    await forceLogoutUser(targetUserId, {
      source,
      userName: user.username
    });

    res.status(200).json({ code: '0000', message: `User ${user.username} has been forcefully logged out.` });
  } catch (error) {
    console.error('Force logout error:', error);
    res.status(500).json({ message: 'Unable to force logout user.' });
  }
};

exports.forceLogoutOthers = async (req, res) => {
  try {
    const userId = req.userid;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    const userSessionManager = require('../utils/userSessionManager');
    const revokedCount = await userSessionManager.revokeOtherSessionsForUser(
      userId,
      req.sessionId || null
    );

    if (revokedCount === 0) {
      return res.status(200).json({
        code: '0000',
        message: 'No other active sessions to log out.',
        revokedCount: 0
      });
    }

    res.status(200).json({
      code: '0000',
      message: `Logged out ${revokedCount} other session(s). Your current session is still active.`,
      revokedCount
    });
  } catch (error) {
    console.error('Force logout others error:', error);
    res.status(500).json({ message: 'Unable to log out other sessions.' });
  }
};

exports.forceLogoutAll = async (req, res) => {
  try {
    const excludeSelf = String(req.query.excludeSelf ?? req.body?.excludeSelf ?? 'false') === 'true';
    const currentUserId = req.userid;

    const sessionTracker = require('../utils/sessionTracker');
    const userSessionManager = require('../utils/userSessionManager');
    const { notifyChatForceLogout } = require('../utils/forceLogoutNotify');

    const source = req.headers['x-forwarded-for']?.split(',')[0]
      || req.headers['x-real-ip']
      || req.connection?.remoteAddress
      || 'Admin force logout';

    const activeRows = await db.sequelize.query(
      `
        SELECT DISTINCT user_id
        FROM user_auth_sessions
        WHERE revoked_at IS NULL
          AND expires_at >= NOW()
      `,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    let targetUserIds = activeRows
      .map((row) => Number(row.user_id))
      .filter((id) => !isNaN(id));

    if (excludeSelf && currentUserId != null) {
      targetUserIds = targetUserIds.filter((id) => Number(id) !== Number(currentUserId));
    }

    if (targetUserIds.length === 0) {
      return res.status(200).json({
        code: '0000',
        message: 'No other active sessions to log out.',
        loggedOutCount: 0
      });
    }

    const forceLogoutAt = new Date();

    await db.user.update(
      { force_logout_at: forceLogoutAt },
      { where: { id: targetUserIds } }
    );

    await db.userStatus.update(
      { is_online: false, status: 'offline', last_seen: forceLogoutAt },
      { where: { user_id: targetUserIds } }
    );

    await Promise.all(
      targetUserIds.map(async (targetUserId) => {
        try {
          await userSessionManager.revokeAllSessionsForUser(targetUserId);
          const user = await Users.findByPk(targetUserId, { attributes: ['username'] });
          await sessionTracker.createLogoutLog({
            userId: targetUserId,
            userName: user?.username || `user_${targetUserId}`,
            source
          });
          await notifyChatForceLogout(targetUserId);
        } catch (innerError) {
          console.error(`Force logout failed for user ${targetUserId}:`, innerError.message);
        }
      })
    );

    res.status(200).json({
      code: '0000',
      message: excludeSelf
        ? `Logged out ${targetUserIds.length} other active session(s).`
        : `Logged out ${targetUserIds.length} active session(s).`,
      loggedOutCount: targetUserIds.length
    });
  } catch (error) {
    console.error('Force logout all error:', error);
    res.status(500).json({ message: 'Unable to force logout users.' });
  }
};
