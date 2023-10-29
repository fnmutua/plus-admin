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




exports.xmodelCountyUsers = (req, res) => {
 
  console.log(req.body.currentUser)
  var user = req.body.currentUser
  var currentUserRoles = user.roles

  console.log('Current User xRoles, ', currentUserRoles)
  
  var filters = req.body.filters
  var filterValues = req.body.filterValues

  var userCounty = user.county_id
  
  if (req.body.limit ) {
    limit = req.body.limit 
  }
  if (req.body.page ) {
   page =  req.body.page 
  }
   

  // Use the findAll() method to retrieve all roles from the database
  Role.findAll()
  .then(async (roles) => {
          // roles will contain an array of role objects retrieved from the database
          // Filter roles based on currentUserRoles
          const filteredRoles = roles.filter((role) => currentUserRoles.includes(role.name));

          // Extract the 'subordinates' column and merge into one array
          const allSubordinates = filteredRoles.reduce((subordinates, role) => {
            if (role.subordinates && role.subordinates.length > 0) {
              subordinates.push(...role.subordinates);
            }
            return subordinates;
          }, []);

          // Remove duplicates from allSubordinates using Set
          const uniqueSubordinates = [...new Set(allSubordinates)];

             // Get users with associated roles that match the 'subordinates' array and are from userCounty
            const findAndCountOptions = {
              include: {
                model: Role,
                through: 'user_roles', // Name of the middle table
                where: { id: uniqueSubordinates },
              },
           where: {  }, // Filter users based on the county_id
              limit: limit,
              offset: (page - 1) * limit,
                 };
    


               // Add conditions based on filters and filterValues arrays
               if (filters && filterValues && filters.length === filterValues.length) {
                const filterConditions = filters.map((filter, index) => ({
                  [filter]: {
                    [op.eq]: filterValues[index], // You can use different operators like 'Op.eq' for equal, 'Op.gt' for greater than, etc.
                  },
                }));

                // Use 'Op.or' to combine multiple filter conditions with OR
                findAndCountOptions.where[op.or] = filterConditions;
              }
                
                // If the user has the 'county_admin' role, apply the county filter
                if (currentUserRoles.includes('county_admin')) {
                  console.log('county_admin ....',  userCounty, findAndCountOptions )

                  findAndCountOptions.where.county_id = userCounty;
                  }
    
              /// Super admin overide 
                
                if (currentUserRoles.includes('super_admin')) {
                  console.log('here....', userCounty, findAndCountOptions)
                  findAndCountOptions.include = {
                    model: Role,
                    through: 'user_roles',
                  }
                  findAndCountOptions.limit=limit
                  findAndCountOptions.where={}
                  findAndCountOptions.offset=(page - 1) * limit
              
                  
                }
     
            console.log(' Subordinate Roles sss for this 123 user:', uniqueSubordinates);
 
            User.findAndCountAll(findAndCountOptions)
              .then(({ count, rows: usersWithSubordinates }) => {
                 console.log('Total Users with Subordinate Roles in userCounty:', count);
                              
              res.status(200).send({
                data: usersWithSubordinates,
                total: count,
                code: '0000',
                message: 'Users retrieved Successfully'
              })

                
              })
              .catch((error) => {
                console.error('Error fetching users:', error);
                return res.status(500).send({ message: 'Unable to retrieve users. Please try again later.' })

              });
      
     
                })
              .catch((error) => {
                console.error('Error fetching roles:', error);
                return res.status(500).send({ message: 'Unable to retrieve  users. Please try again later.' })

              });
            


       


 
}

 
exports.modelCountyUsers = async (req, res) => {
  try {
    console.log(req.body.currentUser);
    const user = req.body.currentUser;
    const currentUserRoles = user.roles;

    console.log('Current User Roles:', currentUserRoles);

    const filters = req.body.filters || [];
    const filterValues = req.body.filterValues || [];

    const userCounty = user.county_id;

    const limit = req.body.limit || 10;
    const page = req.body.page || 1;

    // Use the findAll() method to retrieve all roles from the database
    const roles = await Role.findAll();

    // Filter roles based on currentUserRoles
    const filteredRoles = roles.filter((role) => currentUserRoles.includes(role.name));

    // Extract the 'subordinates' column and merge into one array
    const allSubordinates = filteredRoles.reduce((subordinates, role) => {
      if (role.subordinates && role.subordinates.length > 0) {
        subordinates.push(...role.subordinates);
      }
      return subordinates;
    }, []);

    // Remove duplicates from allSubordinates using Set
    const uniqueSubordinates = [...new Set(allSubordinates)];

    // Define the findAndCountOptions for querying users
    const findAndCountOptions = {
      include: {
        model: Role,
        through: 'user_roles', // Name of the middle table
        where: { id: uniqueSubordinates },
      },
      where: {
        county_id: userCounty, // Filter users based on the county_id
      },
      limit,
      offset: (page - 1) * limit,
    };

    // Add conditions based on filters and filterValues arrays
    if (filters.length === filterValues.length) {
      const filterConditions = filters.map((filter, index) => ({
        [filter]: {
          [op.eq]: filterValues[index], // You can use different operators like 'Op.eq' for equal, 'Op.gt' for greater than, etc.
        },
      }));

      // Use 'Op.or' to combine multiple filter conditions with OR
      findAndCountOptions.where[op.or] = filterConditions;
    }

    // If the user has the 'county_admin' role, apply the county filter
    if (currentUserRoles.includes('county_admin')) {
      console.log('County Admin Filter:', userCounty, findAndCountOptions);
    }

    // Super admin override
   
    if (currentUserRoles.includes('super_admin')) {
      console.log('Super Admin Override:', userCounty, findAndCountOptions);
      findAndCountOptions.include = {
        model: Role,
        through: 'user_roles',
      };
      findAndCountOptions.limit = limit;
      findAndCountOptions.where = {};
      
      // Check if 'isactive' is part of the filters array
      if (filters.includes('isactive')) {
        // Add 'isactive' filter condition when specified
        // Replace 'filterValueForIsactive' with the actual value for 'isactive' filter
        findAndCountOptions.where.isactive = {
          [op.eq]: false,
        };
      }
      
      findAndCountOptions.offset = (page - 1) * limit;
    }
    
    



    console.log('Subordinate Roles for this user:', findAndCountOptions);

    const { count, rows: usersWithSubordinates } = await User.findAndCountAll(findAndCountOptions);

    console.log('Total Users with Subordinate Roles in userCounty:', count);

    res.status(200).send({
      data: usersWithSubordinates,
      total: count,
      code: '0000',
      message: 'Users retrieved Successfully',
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: 'Unable to retrieve users. Please try again later.' });
  }
};



exports.modelUserByName = (req, res) => {
 
  console.log(req.body.currentUser)
  var user = req.body.currentUser
  var currentUserRoles = user.roles
  var searchString = req.body.searchString

  console.log('Current User Roles, ', currentUserRoles)
  

  var userCounty = user.county_id
  
  if (req.body.limit ) {
    limit = req.body.limit 
  }
  if (req.body.page ) {
   page =  req.body.page 
  }
   

  // Use the findAll() method to retrieve all roles from the database
  Role.findAll()
  .then(async (roles) => {
          // roles will contain an array of role objects retrieved from the database
          // Filter roles based on currentUserRoles
          const filteredRoles = roles.filter((role) => currentUserRoles.includes(role.name));

          // Extract the 'subordinates' column and merge into one array
          const allSubordinates = filteredRoles.reduce((subordinates, role) => {
            if (role.subordinates && role.subordinates.length > 0) {
              subordinates.push(...role.subordinates);
            }
            return subordinates;
          }, []);

          // Remove duplicates from allSubordinates using Set
          const uniqueSubordinates = [...new Set(allSubordinates)];

             // Get users with associated roles that match the 'subordinates' array and are from userCounty
            const findAndCountOptions = {
              include: {
                model: Role,
                through: 'user_roles', // Name of the middle table
                where: { id: uniqueSubordinates },
              },
                  where: {  }, // Filter users based on the county_id
              limit: limit,
              offset: (page - 1) * limit,
                };
                
                // If the user has the 'county_admin' role, apply the county filter
                if (currentUserRoles.includes('county_admin')) {
                  console.log('here....',  userCounty, findAndCountOptions )
                  findAndCountOptions.where.county_id = userCounty;
                } 
                
                  // Add the 'searchString' condition
              if (searchString) {
                findAndCountOptions.where.name = {
                  [op.iLike]: `%${searchString}%`, // Use 'Op.like' for case-insensitive partial matching
                };
                  }
    

            console.log(' Subordinate Roles for this user:', uniqueSubordinates);


            User.findAndCountAll(findAndCountOptions)
              .then(({ count, rows: usersWithSubordinates }) => {
                 console.log('Total Users with Subordinate Roles in userCounty:', count);

                              
              res.status(200).send({
                data: usersWithSubordinates,
                total: count,
                code: '0000',
                message: ' Users retrieved Successfully'
              })

                
              })
              .catch((error) => {
                console.error('Error fetching users:', error);
                return res.status(500).send({ message: 'Unable to retrieve  users. Please try again later.' })

              });
     

            
    
     
                })
              .catch((error) => {
                console.error('Error fetching roles:', error);
                return res.status(500).send({ message: 'Unable to retrieve  users. Please try again later.' })

              });
            





 
}
 
 
 

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