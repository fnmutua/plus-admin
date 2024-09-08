const db = require('../models')
const config = require('../config/db.config.js')
const User = db.user
const Role = db.role

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
          model: Role,
          as: 'roles', // Alias as defined in your User model associations
          through: {
            model: db.models.user_roles,
            as: 'user_roles', // Alias for the user_roles join table
            attributes: ['roleid', 'location_level', 'location_id', 'county_id', 'settlement_id'], // Select specific fields from user_roles
          },
          required: true,
          where: {
            id: uniqueSubordinates,
            name: { [Op.ne]: 'super_admin' } // Exclude super_admin roles from the results
          }
        }
      ],
      where: {},
      limit,
      offset: (page - 1) * limit
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

    console.log('Final Query Options:', findAndCountOptions);

    // Query users and include their roles with user_roles details
    const { count, rows: usersWithSubordinates } = await User.findAndCountAll(findAndCountOptions);


    
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
      message: 'Users retrieved successfully',
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: 'Unable to retrieve users. Please try again later.' });
  }
};

 
 
exports.xmodelCountyUsers = async (req, res) => {
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
          model: db.models.Role,
          as: 'roles', // Alias as defined in your User model associations
          through: {
            model: db.models.user_roles,
            as: 'user_roles', // Alias for the user_roles join table
            attributes: ['roleid', 'location_level', 'location_id', 'county_id', 'settlement_id'], // Select specific fields from user_roles
          },
          required: true,
          where: {
            id: uniqueSubordinates,
            name: { [Op.ne]: 'super_admin' } // Exclude super_admin roles from the results
          }
        }
      ],
      where: {},
      limit,
      offset: (page - 1) * limit
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

    console.log('Final Query Options:', findAndCountOptions);

    // Query users and include their roles with user_roles details
    const { count, rows: usersWithSubordinates } = await db.models.User.findAndCountAll(findAndCountOptions);

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
      message: 'Users retrieved successfully',
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: 'Unable to retrieve users. Please try again later.' });
  }
};


 
exports.xmodelUserByName = (req, res) => {
  console.log(req.body.currentUser);
  const user = req.body.currentUser;
  const currentUserRoles = user.roles;
  const searchString = req.body.searchString;
  const userCounty = user.county_id;
  const filters = req.body.filters || []; // Array of filter fields
  const filterValues = req.body.filterValues || []; // Array of filter values corresponding to each filter field

  let limit = req.body.limit || 10; // Default limit if not provided
  let page = req.body.page || 1; // Default page if not provided

  console.log('Current >>>>User Roles, ', currentUserRoles);

  // Extract subordinates from the user's roles
  const allSubordinates = currentUserRoles.reduce((subordinates, role) => {
    if (role.subordinates && role.subordinates.length > 0) {
      subordinates.push(...role.subordinates);
    }
    return subordinates;
  }, []);

  // Remove duplicates from allSubordinates using Set
  const uniqueSubordinates = [...new Set(allSubordinates)];

  console.log('Subordinate Roles for this user:', uniqueSubordinates);

  // Initialize findAndCountOptions with common properties
  const findAndCountOptions = {
    include: {
      model: Role,
      through: 'user_roles', // Name of the middle table
      where: { id: uniqueSubordinates }, // Matching role IDs
    },
    where: {}, // Initialize an empty where object
    limit: limit,
    offset: (page - 1) * limit,
  };

  // Check if the current user has the 'super_admin' role
  const hasSuperAdminRole = currentUserRoles.some(role => role.name === 'super_admin');

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

  User.findAndCountAll(findAndCountOptions)
    .then(({ count, rows: usersWithSubordinates }) => {
      console.log('Total Users with Subordinate Roles in userCounty:', count);

      res.status(200).send({
        data: usersWithSubordinates,
        total: count,
        code: '0000',
        message: 'Users retrieved successfully',
      });
    })
    .catch((error) => {
      console.error('Error fetching users:', error);
      res.status(500).send({ message: 'Unable to retrieve users. Please try again later.' });
    });
};


 
exports.modelUserByName = async (req, res) => {
  try {
    console.log(req.body.currentUser);
    const user = req.body.currentUser;
    const currentUserRoles = user.roles;
    const searchString = req.body.searchString;
    const userCounty = user.county_id;
    const filters = req.body.filters || []; // Array of filter fields
    const filterValues = req.body.filterValues || []; // Array of filter values corresponding to each filter field

    let limit = req.body.limit || 10; // Default limit if not provided
    let page = req.body.page || 1; // Default page if not provided

    console.log('Current User Roles:', currentUserRoles);

    // Extract unique subordinates from the user's roles
    const uniqueSubordinates = [
      ...new Set(currentUserRoles.flatMap(role => role.subordinates || []))
    ];

    console.log('Subordinate Roles for this user:', uniqueSubordinates);

    // Initialize findAndCountOptions with common properties
    const findAndCountOptions = {
      include: {
        model: Role,
        through: {
          model: db.models.user_roles,
          as: 'user_roles'
        },
        where: {
          id: uniqueSubordinates
        }
      },
      where: {},
      limit,
      offset: (page - 1) * limit
    };

    // Check if the current user has the 'super_admin' role
    const hasSuperAdminRole = currentUserRoles.some(role => role.name === 'super_admin');

    if (!hasSuperAdminRole) {
      // Apply the county filter if the user has a 'county_admin' role but not a 'national' role
      const hasCountyAdminRole = currentUserRoles.some(role => role.user_roles.location_level === 'county');
      const hasNationalRole = currentUserRoles.some(role => role.user_roles.location_level === 'national');

      if (!hasNationalRole && hasCountyAdminRole) {
        findAndCountOptions.where.county_id = userCounty;
        console.log('Applying county filter:', userCounty);
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
    const { count, rows: usersWithSubordinates } = await User.findAndCountAll(findAndCountOptions);

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