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
      console.log('Final-object------------>', queryFields)
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
      console.log('Final-object------------>', queryFields)
      qry.where = queryFields
    }
  }


  
  if (req.body.searchField) {

    var searchCond = { [field]: { [op.iLike]: '%' + searchKeyword + '%' } }
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

 


 
exports.modelCountyUsers = (req, res) => {
 
  console.log('This User roles',req.roles)
   var currentUserRoles = req.roles
  // control the levels of users the loogend in user can see
  if (currentUserRoles.includes(0)) {
    var RoleFilters = [1,5,6,7,8,9,10,11,12,13,14,15,16] // all staff except national admins
  }
  // control the levels of users the loogend in user can see
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
      console.log('Final-object------------>', queryFields)
      qry.where = queryFields
    }
  }
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