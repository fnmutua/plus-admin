const db = require('../models')
const config = require('../config/db.config.js')
const User = db.user
const Users = db.models.users
const Role = db.role
const OTP = db.models.otp
const axios = require('axios');

const Sequelize = require('sequelize')
 const op = Sequelize.Op
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

 
 
exports.modelAllUsers = (req, res) => {
  console.log('Current User', req.body.currrentUser)

  console.log('This User roles',req.roles)
   var currentUserRoles = req.roles

  // control the levels of users the loogend in user can see
  if (currentUserRoles.includes(0)) {
    var RoleFilters = [1,5,6,7,8,9,10,11,12,13,14,15,16] // all staff except national admins
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

 
exports.modelPaginatedUsersfilterBykeyWord = (req, res) => {
 
  console.log('This User roles',req.roles)
   var currentUserRoles = req.roles
  // control the levels of users the loogend in user can see
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

 
 
let page = 1; // Set the desired page number
let limit = 5; // Set the number of items per page

 
 



 
const { Op } = require('sequelize');




exports.modelCountyUsers = async (req, res) => {
  try {
    console.log('Request Body:', req.body);
    const { currentUser, filters = [], filterValues = [], limit = 10, page = 1 } = req.body;
    const { roles: currentUserRoles = [], county_id: userCounty } = currentUser;

    console.log('Current User Roles:', currentUserRoles);

    // Extract unique subordinate role IDs from the current user roles
    const uniqueSubordinates = [
      ...new Set(
        currentUserRoles.flatMap(role => role.subordinates || [])
      )
    ];

    // Define query options
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
            roleid: { [Op.ne]: 0 } // Exclude super_admin roles from the results
          }
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

    console.log('Final Query Options:', JSON.stringify(findAndCountOptions, null, 2));

    // Query users and include their roles with user_roles details
    const { count, rows: usersWithSubordinates } = await Users.findAndCountAll(findAndCountOptions);


    
    // Convert photo binary data to base64 URL
    const usersWithPhotos = usersWithSubordinates.map(user => {
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
      message: 'All Users retrieved successfully',
    });
  } catch (error) {
    console.error('Error:', error);
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

    // Define query options specific to GRM users
    // const findAndCountOptions = {
    //   include: [
    //     {
    //       model: Role,
    //       as: 'roles', // Alias as defined in your User model associations
    //       through: {
    //         model: db.models.user_roles,
    //         as: 'user_roles', // Alias for the user_roles join table
    //         attributes: ['roleid', 'location_level', 'location_id', 'county_id', 'settlement_id'],
    //       },
    //       required: true,
    //       where: {
    //         id: uniqueSubordinates,
    //         name: 'grm' // Only include roles with the name 'grm'
    //       }
    //     }
    //   ],
    //   where: {},
    //   limit,
    //   offset: (page - 1) * limit,
    //   order: [['id', 'DESC']] // Add this line to sort by ID in descending order
    // };


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
            roleid: 4 // GRM
          }
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
    const currentUserRoles = user.roles;
    const searchString = req.body.searchString;
   // const userCounty = user.county_id;
    const filters = req.body.filters || []; // Array of filter fields
    const filterValues = req.body.filterValues || []; // Array of filter values corresponding to each filter field

    let limit = req.body.limit || 10; // Default limit if not provided
    let page = req.body.page || 1; // Default page if not provided

  //  console.log('Current User Roles:', currentUserRoles);

    // Extract unique subordinates from the user's roles
    const uniqueSubordinates = [
      ...new Set(currentUserRoles.flatMap(role => role.subordinates || []))
    ];

    console.log('Subordinate Roles for this user:', uniqueSubordinates);
 

    const findAndCountOptions = {
      include: [
        {
          model: db.models.user_roles,
         
          required: true,
          where: {
            roleid: uniqueSubordinates,
         //   roleid: 1 // ADMIN
         userid: { [Op.ne]: req.body.currentUser.id }, // Exclude current user
         roleid: { [Op.ne]: 0 } // Exclude SuperAdmins
        }
        }
      ],
      where: {},
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'DESC']] // Add this line to sort by ID in descending order

    };


    // Check if the current user has the 'super_admin' role
    const hasSuperAdminRole = currentUserRoles.some(role => role.name === 'super_admin');

    if (!hasSuperAdminRole) {
      // Apply the county filter if the user has a 'county_admin' role but not a 'national' role
      const hasCountyAdminRole = currentUserRoles.some(role => role.user_roles.location_level === 'county');
      const hasNationalRole = currentUserRoles.some(role => role.user_roles.location_level === 'national');
      const countyAdminRole = currentUserRoles.find(role => role.user_roles.location_level === 'county');
      let countyId
      if (countyAdminRole) {
        countyId = countyAdminRole.user_roles.county_id; // Access the county_id from the role
        console.log('County Admin Role detected. County ID:', countyId);
      }


      if (!hasNationalRole && hasCountyAdminRole) {
        findAndCountOptions.where.county_id = countyId;
        console.log('Applying county filter:', countyId);
      }
    } else {
      console.log('Super Admin detected. Bypassing location-level filtering.');
    }

    // Add the searchString condition if provided
    if (searchString) {
      findAndCountOptions.where.name = {
        [Op.iLike]: `%${searchString}%`
      };
    }

    // Apply additional filters
    filters.forEach((filter, index) => {
      const value = filterValues[index];
      if (Array.isArray(value)) {
        findAndCountOptions.where[filter] = {
          [Op.in]: value
        };
      } else {
        findAndCountOptions.where[filter] = value;
      }
    });

    // Explicitly remove county_id filter if the user has a 'super_admin' role
    if (hasSuperAdminRole) {
      delete findAndCountOptions.where.county_id;
    }

    // Fetch users and count
    const { count, rows: usersWithSubordinates } = await Users.findAndCountAll(findAndCountOptions);

    console.log('Total Users with Subordinate Roles in userCounty:', count);


      // Convert photo binary data to base64 URL
      const usersWithPhotos = usersWithSubordinates.map(user => {
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
      message: 'Users retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send({ message: 'Unable to retrieve users. Please try again later.' });
  }
};

exports.modelUserByName = async (req, res) => {
  try {
    console.log('---------------------------------');
    console.log(req.body.searchString);
    const user = req.body.currentUser;
    const currentUserRoles = user.roles;
    const searchString = req.body.searchString;
    const filters = req.body.filters || []; // Array of filter fields
    const filterValues = req.body.filterValues || []; // Array of filter values corresponding to each filter field

    let limit = req.body.limit || 10; // Default limit if not provided
    let page = req.body.page || 1; // Default page if not provided

    const excludedRoleIds = req.body.excludedRoleIds || []; // Array of role IDs to exclude

    const uniqueSubordinates = [
      ...new Set(currentUserRoles.flatMap(role => role.subordinates || []))
    ];

    console.log('Subordinate Roles for this user:', uniqueSubordinates);

    const findAndCountOptions = {
      include: [
        {
          model: db.models.user_roles,
          required: true,
          where: {
            roleid: {
              [Op.in]: uniqueSubordinates,
             },
          }
        }
      ],
      where: {
        id: { [Op.ne]: req.body.currentUser.id } // Exclude current user
      },
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'DESC']] // Sort by ID in descending order
    };

    // Check if the current user has the 'super_admin' role
    const hasSuperAdminRole = currentUserRoles.some(role => role.name === 'super_admin');

    if (!hasSuperAdminRole) {
      const hasCountyAdminRole = currentUserRoles.some(role => role.user_roles.location_level === 'county');
      const hasNationalRole = currentUserRoles.some(role => role.user_roles.location_level === 'national');
      const countyAdminRole = currentUserRoles.find(role => role.user_roles.location_level === 'county');

      if (!hasNationalRole && hasCountyAdminRole) {
        findAndCountOptions.where.county_id = countyAdminRole.user_roles.county_id;
        console.log('Applying county filter:', countyAdminRole.user_roles.county_id);
      }
    } else {
      console.log('Super Admin detected. Bypassing location-level filtering.');
    }

    if (searchString) {
      findAndCountOptions.where.name = {
        [Op.iLike]: `%${searchString}%`
      };
    }

    filters.forEach((filter, index) => {
      const value = filterValues[index];
      if (Array.isArray(value)) {
        findAndCountOptions.where[filter] = {
          [Op.in]: value
        };
      } else {
        findAndCountOptions.where[filter] = value;
      }
    });

    if (hasSuperAdminRole) {
      delete findAndCountOptions.where.county_id;
    }

    const { count, rows: usersWithSubordinates } = await Users.findAndCountAll(findAndCountOptions);

    console.log('Total Users with Subordinate Roles:', count);
 

    const usersWithPhotos = usersWithSubordinates
        .filter(user => user.user_roles.every(role => role.roleid !== 0)) // Exclude users if any role has roleid === 0
        .map(user => {
          if (user.photo) {
            user.photo = 'data:image/png;base64,' + user.photo.toString('base64');
          } else {
            user.photo = ''; // Assign empty string if no photo
          }
          return user;
        });

  console.log(JSON.stringify(usersWithPhotos[0], null, 2)); // Beautified JSON string
  
    res.status(200).send({
      data: usersWithPhotos,
      total: count,
      code: '0000',
      message: 'Users retrieved successfully'
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

 