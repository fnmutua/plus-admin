const db = require('../models')
const config = require('../config/db.config.js')
///const config = require("../config/db.config.js");
const Sequelize = require('sequelize')
 const op = Sequelize.Op
var jwt = require('jsonwebtoken')
var bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')
const { authJwt } = require("../middleware");

const sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
  host: config.HOST,
  port: config.PORT,
  dialect: config.dialect,
  operatorsAliases: false,
  pool: {
    max: config.pool.max,
    min: config.pool.min,
    acquire: config.pool.acquire,
    idle: config.pool.idle
  }
})
exports.allAccess = (req, res) => {
  res.status(200).send('Public Content.')
}

exports.modelBoard = (req, res) => {
  var fields = []
  var reg_model = req.body.model
  console.log('----->Models:', reg_model)
  // Find the right Model

  for (let key in db.models[reg_model].rawAttributes) {
    var myObject = {}

    myObject['field'] = key
    myObject['type'] = db.models[reg_model].rawAttributes[key].type.key
    myObject['match']='' 
    fields.push(myObject)
  }

  // console.log(fields)
 
  res.status(200).send({
     data: fields,
     code: '0000'
  })
}

exports.modelData = (req, res) => {
  console.log('Include for users......')

  var reg_model = req.query.model
  var pg_number = req.query.page
  var limit = req.query.limit
  var sort = req.query.sort
  console.log('Sort:order', req.query.sort)
  console.log('Model', reg_model)
  console.log('Limit', limit)

  var qry = {}
  if (reg_model === 'users') {
    ; (qry.offset = pg_number * limit),
      (qry.limit = limit),
      //  qry.include=[{ model:  db.role, required: true },],
      (qry.order = [['id', sort]])
  } else {
    ; (qry.offset = pg_number * limit), (qry.limit = limit), (qry.order = [['id', sort]])
  }

  console.log('The Querry', qry)
  db.models[reg_model].findAndCountAll({ qry }).then((list) => {
    // console.log(list.rows)
    res.status(200).send({
      data: list.rows,
      total: list.count,
      code: 20000
    })
  })
}

exports.modelAllData = (req, res) => {
  var reg_model = req.query.model
  // var ass_model = req.query.assocModel
  // console.log("All Data----->")
  var ass_model = db.models[req.query.assocModel]

  //console.log('All Model Data-----> 30/10', req)

  if (ass_model) {
    var includeQuerry = {
      include: [{ model: ass_model }]
    }
  } else {
    var includeQuerry = {}
    console.log('No Associated Model')
  }
  console.log('the Querry', includeQuerry)

  db.models[reg_model].findAndCountAll(includeQuerry).then((list) => {
    //db.models[reg_model].findAndCountAll({}).then(list => {

    //console.log(list.rows)
    res.status(200).send({
      data: list.rows,
      total: list.count,
      code: '0000'
    })
  })
}

exports.xmodelAllDatafilter = (req, res) => {
  var reg_model = req.query.model
  var field = req.query.searchField
  var searchKeyword = req.query.searchKeyword
  db.models[reg_model]
    .findAndCountAll({
      where: {
        [field]: {
          [op.iLike]: '%' + searchKeyword + '%' // like = case sensitive, iLike=case insensitve
        }
      }
    })
    .then((list) => {
      //console.log(list.rows)
      res.status(200).send({
        data: list.rows,
        total: list.count,
        code: 20000
      })
    })
}

exports.modelAllDatafilter = (req, res) => {
  var reg_model = req.query.model
  var field = req.query.searchField
  var searchKeyword = req.query.searchKeyword

  console.log('modelPaginatedData Data----->')
  var ass_model = db.models[req.query.assocModel]

  if (ass_model) {
    var qry = {
      include: [{ model: ass_model }]
    }
  } else {
    var qry = {}
  }

  ; (qry.where = {
    [field]: { [op.iLike]: '%' + searchKeyword + '%' }
  }),
    db.models[reg_model].findAndCountAll(qry).then((list) => {
      //console.log(list.rows)
      res.status(200).send({
        data: list.rows,
        total: list.count,
        code: 20000
      })
    })
}

exports.xmodelImportData = (req, res) => {
  var reg_model = req.body.model

  console.log('here ----', req.body.data)

  // insert


  db.models[reg_model]
    .bulkCreate(req.body.data, { returning: true })
    .then(function (item) {
      console.log(req.body.count)
      res.status(200).send({
        message: 'Import Successful',
        total: req.body.count,
        code: '0000'
      })
    })
    .catch(function (err) {
      // handle error;
      console.log('error0---------->', err)

      if (err.name == 'SequelizeUniqueConstraintError') {
        var msg = 'One or more table constraints are violated. Check your unique columns'
      } else {
        var msg = 'The uploaded file does not match the required fields'
      }
      return res.status(500).send({ message: msg })

    })
}

exports.modelImportData = async (req, res) => {
  var reg_model = req.body.model
  let data = req.body.data

  //console.log('Model upsert----', data)
  let errors = []
  for (let i = 0; i < data.length; i++) {

    await db.models[reg_model].upsert(
      req.body.data[i]
    )
      .then(data => console.log(data))
      .catch(err => errors.push(err.original));
  }

  console.log("Errors ---->", errors)
  if (errors.length > 0) {
    res.status(500).send({ message: 'Import/Update failed' })
  } else {
    res.status(200).send({
      message: 'Import/Updated Successful',
      code: '0000'
    })
  }


}

exports.modelImportDataUpsert = async (req, res) => {
  var reg_model = req.body.model
  let data = req.body.data

  //console.log('Model upsert----', data)
  let errors = []
  for (let i = 0; i < data.length; i++) {

    await db.models[reg_model].upsert(
      req.body.data[i]
    )
      .then(data => console.log(data))
     .catch(err => errors.push(err.original));
      //.catch(err => console.log(err.original));
  }

  console.log("Upsert Errors ---->", errors[0])
  if (errors.length > 0) {
    let errorCodes = [...new Set(errors)];
    if (errorCodes.includes("42P10")) {
      var errorMsg = 'There are one or more duplicate records'
    }

    res.status(500).send({ message: 'Import/Update failed:'+errorMsg})
  } else {
    res.status(200).send({
      message: 'Import/Updated Successful',
      code: '0000'
    })
  }


}



exports.modelCreateOneRecord = (req, res) => {
  console.log('creating......')
  var reg_model = req.body.model

  console.log('model... ----', req.body.model)
  var obj = req.body
  delete obj.model // or delete person["age"];

  console.log('One record... ----', obj)

  // insert
  db.models[reg_model]
    .create(obj)
    .then(function (item) {
      res.status(200).send({
        message: 'Import Successful',
        total: req.body.count,
        data: item,
        code: '0000'
      })
    })
    .catch(function (err) {
      // handle error;
      console.log('error0---------->', err)

      if (err.name == 'SequelizeUniqueConstraintError') {
        var message = 'One or more table constraints are violated. Check your id columns'
      } else {
        var message = 'The uploaded file does not match the required fields'
      }
      return res.status(500).send({ message: message })
    })
}

exports.modelAllGeo = async (req, res) => {
  var reg_model = req.body.model
  var qry2 =
    " SELECT json_build_object( 'type', 'FeatureCollection', 'features', json_agg(ST_AsGeoJSON(t.*)::json) ) FROM " +
    reg_model +
    ' AS t where geom is not null'
  const result_geo = await sequelize.query(qry2, {
    model: db.models[reg_model],
    mapToModel: false // pass true here if you have any mapped fields
  })

  res.status(200).send({
    data: result_geo,
    code: '0000'
  })
}

exports.modelOneGeo = async (req, res) => {
  var reg_model = req.body.model
  var id = req.body.id
  var msg = ''
  var qry2 =
    " SELECT json_build_object( 'type', 'FeatureCollection', 'features', json_agg(ST_AsGeoJSON(t.*)::json) ) FROM " +
    reg_model +
    ' AS t where geom is not null and id=' +
    id
  const result_geo = await sequelize.query(qry2, {
    model: db.models[reg_model],
    mapToModel: false // pass true here if you have any mapped fields
  })

  const json = JSON.stringify(result_geo) // [1,2,3]

   console.log('GEo----->', result_geo[0])
  if (result_geo) {
    msg = 'Shapes found. Loading shortly...'
    console.log(msg)
    res.status(200).send({
      data: result_geo,
      code: '0000',
      message: 'Shapes found. Loading...'
    })
    // console.log('Found ...', json[0].json_build_object)
  } 
}

exports.modelSelectGeo = async (req, res) => {
  var reg_model = req.body.model
  var columnFilterField = req.body.columnFilterField

  if (req.body.selectedParents.length > 0) {
    var arr = req.body.selectedParents //req.body // [80,64] }
  } else {
    var arr = [req.body.id] //req.body // [80,64] }
  }
  var qry2 =
    " SELECT json_build_object( 'type', 'FeatureCollection', 'features', json_agg(ST_AsGeoJSON(t.*)::json) ) FROM " +
    reg_model +
    ' AS t where geom is not null and ' +
    columnFilterField +
    ' IN (' +
    arr +
    ')'
  console.log('QRY', qry2)

  const result_geo = await sequelize.query(qry2, {
    model: db.models[reg_model],
    mapToModel: false // pass true here if you have any mapped fields
  })

  res.status(200).send({
    data: result_geo,
    code: '0000'
  })
}

exports.modelOneRecord = (req, res) => {
  var reg_model = req.body.model

  var ass_model = db.models[req.body.assocModel]

  if (ass_model) {
    var qry = {
      include: [{ model: ass_model }]
    }
  } else {
    var qry = {}
  }
  qry.where = { id: { [op.eq]: req.body.id } } // Exclude the logged in user returing in the list

  // console.log("ID:----->", req.body.id)
  // get records based on ID
  db.models[reg_model].findOne(qry).then((thisRecord) => {
    //    console.log(thisRecord.dataValues)
    //res.status(200).send(thisRecord.dataValues)

    res.status(200).send({
      data: thisRecord,
      code: '0000'
    })
  })
}

exports.modelEditOneRecord = (req, res) => {
  var reg_model = req.body.model
  // get this one  record and update it by replacing the whole docuemnt
  db.models[reg_model].findAll({ where: { id: req.body.id } }).then((result) => {
    if (result) {
      // Result is array because we have used findAll. We can use findOne as well if you want one row and update that.
      result[0].set(req.body)
      result[0].save() // This is a promise
      res.status(200).send({
        message: "Update successful",
        code: "0000"
      })
    }
  })
}

exports.modelActivateUser = (req, res) => {
  var reg_model = req.query.model

  console.log('Request:----->', req.body)

  // get this one  record and update it by replacing the whole docuemnt
  db.models[reg_model].findAll({ where: { id: req.body.id } }).then((result) => {
    if (result) {
      // Result is array because we have used findAll. We can use findOne as well if you want one row and update that.
      result[0].set(req.body)
      result[0].save() // This is a promise
      // res.status(200).send(result);

      if (req.body.isactive) {
        var msg =
          'Your account has been activated. Please login using the credentials you signed up with.'
      } else {
        var msg =
          'Your account has been deactivated. Please reach out to the systems administrator should you require to use the system again.'
      }

      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'kisip.mis@gmail.com',
          pass: 'ycoxaqavmfiqljjg'
        }
      }) // initialize create Transport service

      const mailOptions = {
        from: 'kisip.mis@gmail.com',
        to: `${req.body.username}`,
        subject: 'Account Status',
        text: 'Dear ' + `${req.body.name}` + '. \n\n' + msg + '\n\n' + 'Systems Administrator.'
      }

      console.log('sending mail')

      transporter.sendMail(mailOptions, (err, response) => {
        if (err) {
          console.error('there was an error: ', err)
        } else {
          console.log('here is the res: ', response)
          //  res.status(200).json('recovery email sent');
          res.status(200).send({
            message: 'Activation Email Sent',
            data: result,
            code: "0000"
          })
        }
      })
    }
  })
}

exports.modelDeleteOneRecord = (req, res) => {
  var reg_model = req.body.model
  // get this one  record and update it by replacing the whole docuemnt
  db.models[reg_model].destroy({ where: { id: req.body.id } }).then((result) => {
    if (result) {
      // res.status(200).send(result);
      res.status(200).send({
        message: 'Delete successful',
        code: '0000'
      })
    }
  })
}

// count all
exports.modelCountAll = (req, res) => {
  var reg_model = req.query.model
  console.log('Querry:', req.query)
  // get this one  record and update it by replacing the whole docuemnt
  db.models[reg_model].count().then((result) => {
    if (result) {
      // res.status(200).send(result);
      res.status(200).send({
        count: result,
        code: 20000
      })
    }
  })
}

// count DISTICNT
exports.modelCountDistinct = (req, res) => {
  var reg_model = req.query.model
  var countField = req.query.countField
  console.log('Querry:', req.query)
  // get this one  record and update it by replacing the whole docuemnt
  db.models[reg_model].count({ distinct: true, col: countField }).then((result) => {
    if (result) {
      // res.status(200).send(result);
      res.status(200).send({
        count: result,
        code: 20000
      })
    }
  })
}

// count with creteria

exports.modelCountFilter = (req, res) => {
  var reg_model = req.body.model
  var filterField = req.body.filterField
  var criteria = req.body.criteria
  // here we creat an object for the query  comprising the field and value to querry
  const obj = {}
  obj[filterField] = criteria
  console.log(obj)
  db.models[reg_model].count({ where: obj }).then((result) => {
    if (result) {
      // res.status(200).send(result);
      res.status(200).send({
        count: result,
        code: '0000'
      })
    }
  })
}

// Sum  all
exports.modelSumAll = (req, res) => {
  var reg_model = req.query.model
  var sumField = req.body.sumField
  console.log('Querry:', req.query)
  // get this one  record and update it by replacing the whole docuemnt
  db.models[reg_model]
    .findAll({
      attributes: [[sequelize.fn('sum', sequelize.col(sumField)), 'Sum']]
    })
    .then((result) => {
      if (result) {
        // res.status(200).send(result);
        res.status(200).send({
          Total: result,
          code: 20000
        })
      }
    })
}

// Sum  filtred

exports.modelSumFiltered = (req, res) => {
  var reg_model = req.body.model
  var sumField = req.body.sumField
  var filterField = req.body.filterField
  var criteria = req.body.criteria

  const obj = {}
  obj[filterField] = criteria
  console.log(obj)

  console.log('Querry:', req.body)
  // get this one  record and update it by replacing the whole docuemnt
  db.models[reg_model].sum(sumField, { where: obj }).then((result) => {
    if (result) {
      // res.status(200).send(result);
      res.status(200).send({
        data: result,
        code: '0000'
      })
    } else {
      res.status(200).send({
        data: 0,
        code: '0000'
      })
    }
  })
}

exports.modelAllUsers = (req, res) => {
  var reg_model = req.body.model
  var pg_number = req.body.page
  var limit = req.body.limit
  var sort = req.body.sort
  var curUSer = req.body.curUser

  console.log('All Users ----- X --------X ')

  console.log('Sort:order', req.body.sort)
  console.log('Model', reg_model)
  console.log('Limit', limit)

  var qry = {}

  /*  if (reg_model === 'users') {
     console.log('Include for users......')
       ; (qry.offset = (pg_number - 1) * limit),
         (qry.limit = limit),
         (qry.where = { id: { [op.ne]: curUSer } }) // Exclude the logged in user returing in the list
     qry.order = [['id', sort]]
   } else {
     ; (qry.offset = (pg_number - 1) * limit), (qry.limit = limit), (qry.order = [['id', sort]])
   } */

  console.log('The Querry', qry)
  db.models[reg_model].findAndCountAll(qry).then((list) => {
    console.log(list.count)
    res.status(200).send({
      data: list.rows,
      total: list.count,
      code: '0000',
      message: 'Users xfetched succesfully'
    })
  })
}

exports.modelPaginatedData = (req, res) => {
  var reg_model = req.query.model
  var pg_number = req.query.page
  var limit = req.query.limit
  var sort = req.query.sort
  var curUSer = req.query.curUser

  console.log('modelPaginatedData Data----->')
  var ass_model = db.models[req.query.assocModel]

  if (ass_model) {
    var qry = {
      include: [{ model: ass_model }]
    }
  } else {
    var qry = {}
  }

  //db.models[reg_model].findAndCountAll(includeQuerry).then(list => {

  console.log('Sort:order', req.query.sort)
  console.log('Model', reg_model)
  console.log('Limit', limit)

  if (reg_model === 'users') {
    //   console.log("Include for users......")
    ; (qry.offset = (pg_number - 1) * limit),
      (qry.limit = limit),
      (qry.where = { id: { [op.ne]: curUSer } }) // Exclude the logged in user returing in the list
    qry.order = [['id', sort]]
  } else {
    ; (qry.offset = (pg_number - 1) * limit), (qry.limit = limit), (qry.order = [['id', sort]])
  }

  console.log('The Querry', qry)
  console.log('The reg_model', reg_model)

  db.models[reg_model].findAndCountAll(qry).then((list) => {
    // console.log(list.rows)
    res.status(200).send({
      data: list.rows,
      total: list.count,
      code: '0000'
    })
  })
}

exports.modelPaginatedDatafilterByColumn = (req, res) => {
  // console.log('Req-body', req.body)
  // console.log('nested filters....>', req.body.nested_filter[0])

  var reg_model = req.body.model

  // Associated Models
  var associated_multiple_models = req.body.associated_multiple_models
  console.log('associated_multiple_models', associated_multiple_models.length)

  // nested Models
  // here me limit to two nesting levels only
  var nested_models = req.body.nested_models
  if (req.body.nested_models) {
    var child_model = db.models[req.body.nested_models[0]]
    var grand_child_model = db.models[req.body.nested_models[1]]
    var nestedQuery = {}

    // create the criterial for the grandchild 
    if (req.body.nested_filter) {
      nestedQuery[req.body.nested_filter[0]] = req.body.nested_filter[1]
    }

  }

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

  console.log(includeModels)
  if (associated_multiple_models) {
    if (nested_models) {
      if (req.body.nested_filter) {
        var nestedModels = { model: child_model, include: [{ model: grand_child_model, where: nestedQuery }], raw: true, nested: true }
      } else {
        var nestedModels = { model: child_model, include: grand_child_model, raw: true, nested: true }
      }

      includeModels.push(nestedModels)
      var qry = {
        include: includeModels
      }
    } else {
      console.log('---no---')
      var qry = {
        include: includeModels
      }
    }
  } else {
    var qry = {}
  }

  console.log('The Querry----->', qry)
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

  qry.attributes = { exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken'] } // will be applciable to users only 
  db.models[reg_model].findAndCountAll(qry).then((list) => {
    res.status(200).send({
      data: list.rows,
      total: list.count,
      code: '0000'
    })
  })
}

exports.modelPaginatedDatafilterBykeyWord = (req, res) => {
  console.log('/api/v1/data/paginated/filter --- Keyword', req.body)

  var reg_model = req.body.model
  var field = req.body.searchField
  var searchKeyword = req.body.searchKeyword
  // Associated Models
  var associated_multiple_models = req.body.associated_multiple_models
  console.log('associated_multiple_models', associated_multiple_models.length)

  // nested Models
  // here me limit to two nesting levels only
  var nested_models = req.body.nested_models
  if (req.body.nested_models) {
    var child_model = db.models[req.body.nested_models[0]]
    var grand_child_model = db.models[req.body.nested_models[1]]
  }

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

  if (associated_multiple_models) {
    if (nested_models) {
      var nestedModels = { model: child_model, include: grand_child_model, raw: true, nested: true }
      includeModels.push(nestedModels)
      var qry = {
        include: includeModels
      }
    } else {
      console.log('---no---')
      var qry = {
        include: includeModels
      }
    }
  } else {
    var qry = {}
  }

  console.log('The xQuerry----->', qry)

  qry.limit = req.body.limit
  qry.offset = (req.body.page - 1) * req.body.limit

  /// use the multpiple filters
  var queryCondition = {}
  if (req.body.filters) {
    if (req.body.filters.length > 0 && req.body.filterValues.length > 0) {
      for (let i = 0; i < req.body.filters.length; i++) {
        queryCondition[req.body.filters[i]] = req.body.filterValues[i]
      }
      console.log('Final-Condition------------>', queryCondition)

      var searchCond = { [field]: { [op.iLike]: '%' + searchKeyword + '%' } }
      const mergedObject = {
        ...queryCondition,
        ...searchCond
      }

      console.log('--------------search Condition-----------', mergedObject)

      qry.where = searchCond
    }
  }

  db.models[reg_model].findAndCountAll(qry).then((list) => {
    res.status(200).send({
      data: list.rows,
      total: list.count,
      code: '0000'
    })
  })
}

exports.modelCountyUsers = (req, res) => {
  var reg_model = req.query.model
  var pg_number = req.query.page
  var limit = req.query.limit
  var sort = req.query.sort
  var county = req.query.county_id
  var curUSer = req.query.curUser

  console.log('modelCountyUsers ------->', req.query)

  console.log('Sort:order', req.query.sort)
  console.log('Model', reg_model)
  console.log('Limit', limit)

  var qry = {}

  if (reg_model === 'users') {
    //   console.log("Include for users......")
    qry.offset = (req.query.page - 1) * req.query.limit
      ; (qry.limit = limit), (qry.where = { county_id: county, id: { [op.ne]: curUSer } }) // Exclude the logged in user returing in the list
    qry.order = [['id', sort]]
  } else {
    ; (qry.offset = pg_number * limit), (qry.limit = limit), (qry.order = [['id', sort]])
  }

  console.log('The Querry', qry)
  db.models[reg_model].findAndCountAll(qry).then((list) => {
    console.log(list.count)
    res.status(200).send({
      data: list.rows,
      total: list.count,
      code: 20000
    })
  })
}


exports.modelGetParentIDS = (req, res) => {
  var reg_model = req.body.parent
 
  db.models[reg_model].findAll({
    attributes: ['id', 'code']
  }).then((list) => {
    res.status(200).send({
      data: list,
      code: "0000"
    })
  })
}

exports.modelUpload = (req, res) => {
  console.log(req.files)
  if (!req.files) {
    return res.status(500).send({ msg: 'file is not found' })
  }
  console.log('In upload express.....', req.body.DocTypes)
  // accessing the file
  var arr = req.body.DocTypes
  let ftypes = arr.split(',')

  const myFiles = req.files.file
  const settlement_name = req.body.settlement_name

  console.log('myFiles', myFiles.length)

  // Run for more than one document

  if (myFiles.length > 0) {
    var objs = []

    for (let i = 0; i < myFiles.length; i++) {
      //  mv() method places the file inside public directory
      console.log('Myfiles', i, myFiles[i].name)
      var fname = settlement_name + '_' + myFiles[i].name.replace(/\s/g, '_')
      var doctype = ftypes[i]
      console.log(ftypes[i])

      if (
        doctype == 'socio_economic' ||
        doctype == 'stakeholder_report' ||
        doctype == 'planning_report' ||
        doctype == 'basemap_report' ||
        doctype == 'esia_report'
      ) {
        var group = 'Report'
      }

      if (doctype == 'ldpdp' || doctype == 'pdp') {
        var group = 'Development Plan'
      }

      if (doctype == 'survey_plan' || doctype == 'rim') {
        var group = 'Map'
      }

      if (doctype == 'design' || doctype == 'built') {
        var group = 'Drawing'
      }

      var thisFile = {
        type: doctype,
        name: fname,
        file_path: `./public/${fname}`,
        settlement_id: req.body.settlement_id,
        group: group
      }
      objs.push(thisFile)
    }

    console.log('Multiple Files:', objs)

    db.models.settlement_uploads
      .bulkCreate(objs)
      .then(function () {
        for (let i = 0; i < myFiles.length; i++) {
          // var fname = settlement_name + '_' + myFiles[i].name
          var fname = settlement_name + '_' + myFiles[i].name.replace(/\s/g, '_')

          myFiles[i].mv(`./public/${fname}`)
          //  myFiles[i].mv(`./public/${settlement_name}_${myFiles[i].name}`);
          console.log(myFiles[i])
        }

        // return models.DiscoverySource.findAll();
        res.status(200).send({
          message: 'Saved succesfully',
          code: '0000'
        })
        console.log('upload data have been saved')
      })
      .catch(function (error) {
        res.send(error.errors)
        console.log('Error during Post: ' + error)
      })
  } else {
    // Sin
    var objs = []
    var fname = settlement_name + '_' + myFiles.name.replace(/\s/g, '_')
    var doctype = ftypes
    console.log('ftypes:', ftypes[0])

    if (
      doctype == 'socio_economic' ||
      doctype == 'stakeholder_report' ||
      doctype == 'planning_report' ||
      doctype == 'basemap_report' ||
      doctype == 'esia_report'
    ) {
      var group = 'Report'
    }

    if (doctype == 'ldpdp' || doctype == 'pdp') {
      var group = 'Development Plan'
    }

    if (doctype == 'survey_plan' || doctype == 'rim') {
      var group = 'Map'
    }

    if (doctype == 'design' || doctype == 'built') {
      var group = 'Drawing'
    }

    var thisFile = {
      type: ftypes[0],
      name: fname,
      file_path: `./public/${fname}`,
      settlement_id: req.body.settlement_id,
      group: group
    }
    objs.push(thisFile)

    console.log('Thisfile', thisFile)

    db.models.settlement_uploads
      .bulkCreate(objs)
      .then(function () {
        // var fname = settlement_name+"_"+myFiles.name
        myFiles.mv(`./public/${fname}`)

        // return models.DiscoverySource.findAll();
        res.status(200).send({
          message: 'One File Saved succesfully',
          code: '0000'
        })
      })
      .catch(function (error) {
        res.send(error.errors[0])
        console.log('Error during Post: ' + error)
      })
  }
}
