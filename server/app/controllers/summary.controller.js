const db = require('../models')
const config = require('../config/db.config.js')
///const config = require("../config/db.config.js");
const Sequelize = require('sequelize')
const { QueryTypes } = require('sequelize')
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
 

exports.SimpleSumModelByColumn= (req, res) => {
  var reg_model = req.body.model
  var summaryField = req.body.summaryField
  var summaryFunction = req.body.summaryFunction
 
  console.log('Summarizing:', reg_model, ' by ', summaryField)
  
    var qry = {
      attributes: [[sequelize.fn(summaryFunction, sequelize.col(summaryField)), summaryFunction]],
      raw: true
    }
    db.models[reg_model]
    .findAll(qry)
    .then((result) => {
      if (result) {
        // res.status(200).send(result);
        res.status(200).send({
          Total: result,
          code: '0000'
        })
      }
    })
}

exports.nestedSumModelByColumn= (req, res) => {
  var reg_model = req.body.model
  var summaryField = req.body.summaryField
  var summaryFunction = req.body.summaryFunction
  var assoc_model = db.models[req.body.assoc_model[0]]
  
  var groupField = req.body.groupField[0]

  var nestedModels = { model: assoc_model,attributes: [] }

     var qry = {
       attributes: [groupField, [sequelize.fn(summaryFunction, sequelize.col(summaryField)), summaryFunction]],
       include: nestedModels,
       group:[groupField],
      raw: true
  }
  console.log("--groupField-----", qry)
  
  console.log("-------", qry)


    db.models[reg_model]
    .findAll(qry)
    .then((result) => {
      if (result) {
        console.log(result)
        // res.status(200).send(result);
        res.status(200).send({
          Total: result,
          code: '0000'
        })
      }
    })
}




exports.sumModelByColumn= (req, res) => {
  var reg_model = req.body.model
  var summaryField = req.body.summaryField
  var summaryFunction = req.body.summaryFunction
 // var groupField = req.body.groupField[0]


  console.log('Summarizing Model by Column:', reg_model, ' by ', summaryField)
   let groupfields  = []
  if (req.body.groupField.length > 0) {
    
    for (let i = 0; i < req.body.groupField.length; i++) {
      let field = req.body.groupField[i]
      groupfields.push(field)
    }
    
    console.log("groupfields, ",groupfields)

    var qry = {
      attributes: [...groupfields, [sequelize.fn(summaryFunction, sequelize.col(summaryField)), summaryFunction]],
      group: [...groupfields],
      raw: true
    }
  } else {
    var qry = {
      attributes: [[sequelize.fn(summaryFunction, sequelize.col(summaryField)), summaryFunction]],
      raw: true
    }

  }

    db.models[reg_model]
    .findAll(qry)
    .then((result) => {
      if (result) {
        console.log(result)
        // res.status(200).send(result);
        res.status(200).send({
          Total: result,
          code: '0000'
        })
      }
    })


}



exports.sumModelByColumnAssociated = (req, res) => {
  
 
  var reg_model = req.body.model
  var assoc_model1 = db.models[req.body.assoc_model[0]]
  var assoc_model2 = db.models[req.body.assoc_model[1]]
  var groupField = req.body.groupField[0]
  var childGroupField = req.body.childGroupField
  //var childGroupField2 = req.body.childGroupField2

  var summaryField = req.body.summaryField
  var summaryFunction = req.body.summaryFunction

  console.log('Summarizing:',reg_model, ' by ', summaryField)

 
  var nestedModels = { model: assoc_model1,   raw: true}


    db.models[reg_model]
    .findAll({
      attributes: [ childGroupField,groupField, [Sequelize.fn(summaryFunction, Sequelize.col(childGroupField)), summaryFunction]], 
      include: [{model: assoc_model1,attributes:['name'],nested: true} ],
     group : [childGroupField, groupField],
     order: [['count', 'DESC']],
      raw: true
        })

    .then((result) => {
      if (result) {
        // res.status(200).send(result);
        res.status(200).send({
          Total: result,
          code: '0000'
        })
      }
    })

 
}

	

exports.sumModelAssociatedMultipleModels = (req, res) => {
  
  console.log('xxxxsumModelByColumnAssociated.........')

 
  var reg_model = req.body.model
  var summaryField = req.body.summaryField
  var summaryFunction = req.body.summaryFunction





  let groupfields = []
  
  if (req.body.groupFields) {
    for (let i = 0; i < req.body.groupFields.length; i++) {
      let field = req.body.groupFields[i]
      groupfields.push(field)
    }



    
    console.log("groupfields, ",groupfields)
    console.log("summaryFunction, ",summaryFunction)

    var qry = {
      attributes: [...groupfields,[sequelize.fn(summaryFunction, sequelize.col(summaryField)), summaryFunction]],
      group: [...groupfields],
      raw: true
    }
  } else {
    var qry = {
      attributes: [...groupfields,[sequelize.fn(summaryFunction, sequelize.col(summaryField)), summaryFunction]],
      raw: true
    }

  }

  
 
  if (req.body.assoc_models.length >1) {
    var nestedModels = { model: db.models[req.body.assoc_models[0]], attributes: [],include: [{ model: db.models[req.body.assoc_models[1]], attributes: [] }] }
 
  } else {
    var nestedModels = { model: db.models[req.body.assoc_models[0]], attributes: []   } 
 

 }


  qry.include=nestedModels
 
  
  if (req.body.filterField) {
    let filterCol = req.body.filterField
    let filterValue = req.body.filterValue
    qry.where = { [filterCol]: { [op.eq]: filterValue } } // Exclude the logged in user returing in the list

  }


  console.log("202020 - the ", qry)


  db.models[reg_model]
  .findAll(qry)
  .then((result) => {
    if (result) {
      console.log(result)
      // res.status(200).send(result);
      res.status(200).send({
        Total: result,
        code: '0000'
      })
    }
  })
}