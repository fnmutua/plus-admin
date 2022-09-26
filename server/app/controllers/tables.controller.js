const db = require('../models')
const config = require('../config/db.config.js')
///const config = require("../config/db.config.js");
const Sequelize = require('sequelize')
const { QueryTypes } = require('sequelize')
const op = Sequelize.Op
var jwt = require('jsonwebtoken')
var bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')

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
  console.log('Models:', db.models)
  // Find the right Model

  for (let key in db.models[reg_model].rawAttributes) {
    var myObject = {}

    myObject['field'] = key
    myObject['type'] = db.models[reg_model].rawAttributes[key].type.key
    fields.push(myObject)
  }

  // console.log(fields)
  res.status(200).send(fields)
}

exports.modelData = (req, res) => {
  var reg_model = req.query.model
  var pg_number = req.query.page
  var limit = req.query.limit
  var sort = req.query.sort
  console.log('Sort:order', req.query.sort)
  console.log('Model', reg_model)
  console.log('Limit', limit)

  var qry = {}
  if (reg_model === 'users') {
    console.log('Include for users......')
    ;(qry.offset = pg_number * limit),
      (qry.limit = limit),
      //  qry.include=[{ model:  db.role, required: true },],
      (qry.order = [['id', sort]])
  } else {
    ;(qry.offset = pg_number * limit), (qry.limit = limit), (qry.order = [['id', sort]])
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

  if (ass_model) {
    var includeQuerry = {
      include: [{ model: ass_model }]
    }
  } else {
    var includeQuerry = {}
  }

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

  ;(qry.where = {
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

exports.modelImportData = (req, res) => {
  var reg_model = req.query.model

  console.log('here ----', req.body)

  // insert

  db.models[reg_model]
    .bulkCreate(req.body, { returning: true })
    .then(function (item) {
      console.log(req.body.count)
      res.status(200).send({
        message: 'Import Successful',
        total: req.body.count,
        code: 20000
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

exports.modelCreateOneRecord = (req, res) => {
  var reg_model = req.query.model

  console.log('One record... ----', req.body)
  console.log('model... ----', req.query.model)

  // insert

  db.models[reg_model]
    .create(req.body)
    .then(function (item) {
      res.status(200).send({
        message: 'Import Successful',
        total: req.body.count,
        data: item,
        code: 20000
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
  var reg_model = req.query.model
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
    code: 20000
  })
}

exports.modelOneGeo = async (req, res) => {
  var reg_model = req.query.model
  var id = req.query.id
  var qry2 =
    " SELECT json_build_object( 'type', 'FeatureCollection', 'features', json_agg(ST_AsGeoJSON(t.*)::json) ) FROM " +
    reg_model +
    ' AS t where geom is not null and id=' +
    id
  const result_geo = await sequelize.query(qry2, {
    model: db.models[reg_model],
    mapToModel: false // pass true here if you have any mapped fields
  })

  res.status(200).send({
    data: result_geo,
    code: 20000
  })
}

exports.modelSelectGeo = async (req, res) => {
  var reg_model = req.body.model
  var columnFilterField = req.body.columnFilterField

  if (req.body.selectedParents.length > 0) {
    var arr = req.body.selectedParents //req.body // [80,64] }
  } else {
    var arr = [1] //req.body // [80,64] }
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

  // console.log("ID:----->", req.body.id)
  // get records based on ID
  db.models[reg_model]
    .findOne({
      where: {
        id: req.body.id
      }
    })
    .then((thisRecord) => {
      //    console.log(thisRecord.dataValues)
      res.status(200).send(thisRecord.dataValues)
    })
}

exports.modelEditOneRecord = (req, res) => {
  var reg_model = req.query.model
  // get this one  record and update it by replacing the whole docuemnt
  db.models[reg_model].findAll({ where: { id: req.body.id } }).then((result) => {
    if (result) {
      // Result is array because we have used findAll. We can use findOne as well if you want one row and update that.
      result[0].set(req.body)
      result[0].save() // This is a promise
      res.status(200).send({
        data: result,
        code: 20000
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
          user: 'nema.riparian@gmail.com',
          pass: 'rxrhspkvowovqacl'
        }
      }) // initialize create Transport service

      const mailOptions = {
        from: 'nema.riparian@gmail.com',
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
            code: 20000
          })
        }
      })
    }
  })
}

exports.modelDeleteOneRecord = (req, res) => {
  var reg_model = req.query.model
  // get this one  record and update it by replacing the whole docuemnt
  db.models[reg_model].destroy({ where: { id: req.body.id } }).then((result) => {
    if (result) {
      // res.status(200).send(result);
      res.status(200).send({
        data: 'delete successful',
        code: 20000
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
  var reg_model = req.query.model
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
        code: 20000
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
exports.xmodelSumFiltered = (req, res) => {
  var reg_model = req.query.model
  var sumField = req.body.sumField
  var filterField = req.body.filterField
  var criteria = req.body.criteria

  const obj = {}
  obj[filterField] = criteria
  console.log(obj)

  console.log('Querry:', req.query)
  // get this one  record and update it by replacing the whole docuemnt
  db.models[reg_model]
    .findAll(
      {
        attributes: [[sequelize.fn('sum', sequelize.col(sumField)), 'Sum']]
      },
      { where: obj }
    )
    .then((result) => {
      if (result) {
        // res.status(200).send(result);
        res.status(200).send({
          data: result,
          code: 20000
        })
      }
    })
}

exports.modelSumFiltered = (req, res) => {
  var reg_model = req.query.model
  var sumField = req.body.sumField
  var filterField = req.body.filterField
  var criteria = req.body.criteria

  const obj = {}
  obj[filterField] = criteria
  console.log(obj)

  console.log('Querry:', req.query)
  // get this one  record and update it by replacing the whole docuemnt
  db.models[reg_model].sum(sumField, { where: obj }).then((result) => {
    if (result) {
      // res.status(200).send(result);
      res.status(200).send({
        data: result,
        code: 20000
      })
    } else {
      res.status(200).send({
        data: 0,
        code: 20000
      })
    }
  })
}

exports.modelAllUsers = (req, res) => {
  var reg_model = req.query.model
  var pg_number = req.query.page
  var limit = req.query.limit
  var sort = req.query.sort
  var curUSer = req.query.curUser

  console.log('All Users ----- X --------X ')

  console.log('Sort:order', req.query.sort)
  console.log('Model', reg_model)
  console.log('Limit', limit)

  var qry = {}

  if (reg_model === 'users') {
    console.log('Include for users......')
    ;(qry.offset = (pg_number - 1) * limit),
      (qry.limit = limit),
      (qry.where = { id: { [op.ne]: curUSer } }) // Exclude the logged in user returing in the list
    qry.order = [['id', sort]]
  } else {
    ;(qry.offset = (pg_number - 1) * limit), (qry.limit = limit), (qry.order = [['id', sort]])
  }

  console.log('The Querry', qry)
  db.models[reg_model].findAndCountAll(qry).then((list) => {
    console.log(list.count)
    res.status(200).send({
      data: list.rows,
      total: list.count,
      code: '0000',
      message: 'Users fetched succesfully'
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
    ;(qry.offset = (pg_number - 1) * limit),
      (qry.limit = limit),
      (qry.where = { id: { [op.ne]: curUSer } }) // Exclude the logged in user returing in the list
    qry.order = [['id', sort]]
  } else {
    ;(qry.offset = (pg_number - 1) * limit), (qry.limit = limit), (qry.order = [['id', sort]])
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
  console.log('Req-body', req.body)
  var arr = [1, 13]
  var reg_model = req.body.model
  var field = req.body.columnFilterField
  var columnFilterValue = req.query.columnFilterValue

  //console.log("All Data----->")
  var ass_model = db.models[req.body.assocModel]

  var qry = {}

  if (ass_model) {
    var qry = {
      include: [{ model: ass_model, raw: true }]
    }
  } else {
    var qry = {}
  }

  qry.limit = req.body.limit
  qry.offset = (req.body.page - 1) * req.body.limit

  // qry.where = { [field]: { [op.in]: req.body.columnFilterValue } } // Exclude the logged in user returing in the list

  if (req.body.columnFilterValue.length > 0) {
    console.log('Filter by IDS', req.body.columnFilterValue.length)
    qry.where = { [field]: { [op.in]: req.body.columnFilterValue } } // Exclude the logged in user returing in the list
  }

  console.log('Req-include-body', qry)
  console.log('model', reg_model)

  db.models[reg_model].findAndCountAll(qry).then((list) => {
    console.log(list)
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
    ;(qry.limit = limit), (qry.where = { county_id: county, id: { [op.ne]: curUSer } }) // Exclude the logged in user returing in the list
    qry.order = [['id', sort]]
  } else {
    ;(qry.offset = pg_number * limit), (qry.limit = limit), (qry.order = [['id', sort]])
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

exports.modelUpload = (req, res) => {
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

    db.models.settlement_uploads
      .bulkCreate(objs)
      .then(function () {
        for (let i = 0; i < myFiles.length; i++) {
          //  var fname = settlement_name+"_"+myFiles[i].name
          myFiles[i].mv(`./public/${fname}`)
          //  myFiles[i].mv(`./public/${settlement_name}_${myFiles[i].name}`);
        }
        // return models.DiscoverySource.findAll();
        res.status(200).send({
          message: 'Saved succesfully',
          code: 20000
        })
        console.log('Users data have been saved')
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
          code: 20000
        })
      })
      .catch(function (error) {
        res.send(error.errors[0])
        console.log('Error during Post: ' + error)
      })
  }
}
