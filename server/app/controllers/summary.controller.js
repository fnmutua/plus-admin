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
 

exports.sumModelByColumn= (req, res) => {

  var reg_model = req.body.model
  var summaryField = req.body.summaryField
  var summaryFunction = req.body.summaryFunction
  var groupField = req.body.groupField

  console.log('Summarizing:', reg_model, ' by ', summaryField)
  if (req.body.groupField) {
    var qry = {
      attributes: [groupField, [sequelize.fn(summaryFunction, sequelize.col(summaryField)), summaryFunction]],
      group: [groupField],
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
        // res.status(200).send(result);
        res.status(200).send({
          Total: result,
          code: '0000'
        })
      }
    })

 
}



exports.sumModelByColumnAssociated= (req, res) => {

  var reg_model = req.body.model
  var assoc_model1 = db.models[req.body.assoc_model[0]]
  var assoc_model2 = db.models[req.body.assoc_model[1]]
  var groupField = req.body.groupField
  var childGroupField = req.body.childGroupField
  //var childGroupField2 = req.body.childGroupField2

  var summaryField = req.body.summaryField
  var summaryFunction = req.body.summaryFunction

  console.log('Summarizing:',reg_model, ' by ', summaryField)


  // models.user.find({where: { id: 1 }, 
  //   group:['user.id'], 
  //   attributes: [[Sequelize.fn('SUM', Sequelize.col('histories.amount')), 'total']], 
  //   include: [{model: models.history,attributes:[]}],
  //   raw:true
  // }).then(function(user) {
  //     console.log(user);
  // }).catch(function(error) { console.log(error) });

  //var nestedModels = { model: assoc_model1, include:assoc_model2, raw: true,nested: true  }
  var nestedModels = { model: assoc_model1,   raw: true}


    db.models[reg_model]
    .findAll({
     //attributes: ['county_id', [sequelize.fn(summaryFunction, sequelize.col(summaryField)), summaryFunction]],
      attributes: [ childGroupField,groupField, [Sequelize.fn(summaryFunction, Sequelize.col(childGroupField)), summaryFunction]], 
     // include: [nestedModels],
      include: [{model: assoc_model1,attributes:['name']}],
     group : [childGroupField, groupField],

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

	
