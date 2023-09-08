const db = require('../models')
const config = require('../config/db.config.js')
///const config = require("../config/db.config.js");
const Sequelize = require('sequelize')
 const op = Sequelize.Op
var jwt = require('jsonwebtoken')
var bcrypt = require('bcryptjs')
const crypto = require('crypto');

 
const nodemailer = require('nodemailer')
const { authJwt } = require("../middleware");
var fs = require('fs');

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

  
exports.createHousehold = (req, res) => {
    console.log('creating......')
    var obj = req.body
    let name = req.body.name
    obj.name=sequelize.fn('PGP_SYM_ENCRYPT',name, 'maluini')
    delete obj.model // or delete person["age"];
  
    console.log('One record... ----', obj)
  
    // insert
    db.models.households
      .create(obj)
      .then(function (item) {
        res.status(200).send({
          message: 'Household created successfully',
          data: item,
          code: '0000'
        })
      })
      .catch(function (err) {
        // handle error;
        console.log('error0---------->', err)
  
        if (err.name == 'SequelizeUniqueConstraintError') {
          var message = 'xOne or more table constraints are violated. Check your id columns'
        } else {
          var message = 'The uploaded file does not match the required fields'
        }
        return res.status(500).send({ message: message })
      })
}
  
 
exports.updateHousehold = (req, res) => {
    console.log('creating......')
    var obj = req.body
    let name = req.body.name
    obj.name=sequelize.fn('PGP_SYM_ENCRYPT',name, 'maluini')
    delete obj.model // or delete person["age"];
  
    console.log('One record... ----', obj)

    db.models.households.update(
      obj,
        {
            where: {id:  req.body.id}
        })
        res.status(200).send({
            message: "Update successful",
            code: "0000"
          })

    // get this one  record and update it by replacing the whole docuemnt
    // db.models.households.findAll({ where: { id: req.body.id } }).then((result) => {
  
    //   console.log("Edit", result)
    //   if (result) {
    //     // Result is array because we have used findAll. We can use findOne as well if you want one row and update that.
    //     result[0].set(delete obj.id)
    //     result[0].save() // This is a promise
    //     res.status(200).send({
    //       message: "Update successful",
    //       code: "0000"
    //     })
    //   }
    // })
  }



exports.getAllHouseholds = (req, res) => {
    var reg_model = 'households'
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
     console.log('Limit', limit)
  
  
  

    console.log('getting households---->')
    var attributes = []
    for( let key in   db.models.households.rawAttributes ){
         attributes.push(key)
     }
  //   console.log('attributes',attributes)
     var index = attributes.indexOf('name');
     if (index !== -1) {
        attributes.splice(index, 1);
     }

    let encrytpedField = [sequelize.fn('PGP_SYM_DECRYPT', sequelize.cast(sequelize.col('households.name'), 'bytea'),'maluini'),'name']

    attributes.push(encrytpedField)
    qry.attributes=attributes
    qry.order = [['id', 'DESC']]



    db.models.households.findAndCountAll(qry).then((list) => {
      // console.log(list.rows)
      res.status(200).send({
        data: list.rows,
        total: list.count,
        code: '0000'
      })
    })
  }

  
  
exports.getHouseholdsfilterByColumn = (req, res) => {
    // console.log('Req-body', req.body)
    // console.log('nested filters....>', req.body.nested_filter[0])
  
  
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
  
    //console.log(includeModels)
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
  
    var lstQuerries = []
  
    if (req.body.filters) {
      if (req.body.filters.length > 0 && req.body.filterValues.length > 0) {
  
        for (let i = 0; i < req.body.filters.length; i++) {
          var queryFields = {}
          //queryFields[req.body.filters[i]] = req.body.filterValues[i][j]
          lstQuerries.push(queryFields)
          var lstValues  = []
          for (let j = 0; j < req.body.filterValues[i].length; j++) {
            lstValues.push(req.body.filterValues[i][j])
          }
          queryFields[req.body.filters[i]] = lstValues
          lstQuerries.push(queryFields)
  
        }
      }
      console.log('Final-001-object------------>', lstQuerries)
   
      qry.where = lstQuerries
    }
    console.log('Final---03--object------------>', qry)
  
    console.log('getting households---33->')


    var attributes = []
    for( let key in db.models.households.rawAttributes ){
         attributes.push(key)
    }
    
  //   console.log('attributes',attributes)
     var index = attributes.indexOf('name');
     if (index !== -1) {
        attributes.splice(index, 1);
     }
    let encrytpedField = [sequelize.fn('PGP_SYM_DECRYPT', sequelize.cast(sequelize.col('households.name'), 'bytea'),'maluini'),'name']
    attributes.push(encrytpedField)
  qry.attributes = attributes
  qry.order = [['id', 'DESC']]

  db.models.households.findAndCountAll(qry).then((list) => {
    console.log(list.rows)
      res.status(200).send({
        data: list.rows,
        total: list.count,
        code: '0000'
      })
    })
  }
  
exports.getHouseholdsfilterBykeyWord = (req, res) => {
  
    var reg_model = 'households'
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

    qry.limit = req.body.limit
    qry.offset = (req.body.page - 1) * req.body.limit
  
    /// use the multpiple filters
    var queryCondition = {}
    if (req.body.filters) {
      if (req.body.filters.length > 0 && req.body.filterValues.length > 0) {
        for (let i = 0; i < req.body.filters.length; i++) {
          queryCondition[req.body.filters[i]] = req.body.filterValues[i]
        }
       }
    }
  
    console.log('getting households---->')
    var attributes = []
    for( let key in db.models.households.rawAttributes ){
         attributes.push(key)
    }
    
  //   console.log('attributes',attributes)
     var index = attributes.indexOf('name');
     if (index !== -1) {
        attributes.splice(index, 1);
     }
    let encrytpedField = [sequelize.fn('PGP_SYM_DECRYPT', sequelize.cast(sequelize.col('households.name'), 'bytea'),'maluini'),'name']
    attributes.push(encrytpedField)
    qry.attributes=attributes
      
    qry.order = [['id', 'DESC']]

// if key word is r
    if (req.body.searchKeyword) {
        qry.where = {
            [op.and]: [
                Sequelize.where(Sequelize.fn('PGP_SYM_DECRYPT', sequelize.cast(sequelize.col('households.name'), 'bytea'), 'maluini'), {
                    [op.iLike]: `%${searchKeyword}%`,
                }),
                queryCondition
            ]
        }
    }
    else {
        qry.where = queryCondition

 }
   
  //  console.log(fqry)
    console.log('--------------search Condition-----------', qry)
 
    db.models[reg_model].findAndCountAll(qry).then((list) => {
      res.status(200).send({
        data: list.rows,
        total: list.count,
        code: '0000'
      })
    })
}
  

exports.deleteOneHousehold = (req, res) => {
    var reg_model = req.body.model

    // get this one  record and update it by replacing the whole docuemnt
    db.models.households.destroy({ where: { id: req.body.id } }).then((result) => {
      if (result) {
        // res.status(200).send(result);
        res.status(200).send({
          message: 'Delete successful',
          code: '0000'
        })
      }
    })
}
  

exports.getOneHousehold = (req, res) => {
    var ass_model = db.models[req.body.assocModel] 
    if (ass_model) {
      var qry = {
        include: [{ model: ass_model }]
      }
    } else {
      var qry = {}
    }
    qry.where = { id: { [op.eq]: req.body.id } } // Exclude the logged in user returing in the list
    console.log('Descryptiing ')
    var attributes = []
    for( let key in db.models.households.rawAttributes ){
         attributes.push(key)
     }
  //   console.log('attributes',attributes)
     var index = attributes.indexOf('name');
     if (index !== -1) {
        attributes.splice(index, 1);
     }
    let encrytpedField = [sequelize.fn('PGP_SYM_DECRYPT', sequelize.cast(sequelize.col('households.name'), 'bytea'),'maluini'),'name']

    attributes.push(encrytpedField)
    qry.attributes=attributes

    db.models.households.findOne(qry).then((thisRecord) => {
      res.status(200).send({
        data: thisRecord,
        code: '0000'
      })
    })
  }
  


  
  exports.xbatchHouseholdImport = async (req, res) => {
    let data = req.body.data;
    let errors = [];
    let objectsToUpsert=[]
    console.log(req.body.data)
    for (let i = 0; i < data.length; i++) {
      var obj = data[i];
      let name = data[i].name;
      console.log("---------------->>>>---------------------->>", name)
      obj.name=sequelize.fn('PGP_SYM_ENCRYPT',name, 'maluini')
      //obj.name=name
      delete obj.model;
      //console.log(obj)
     
    // Add the modified object to the array
    objectsToUpsert.push(obj);
  console.log(objectsToUpsert)

      await db.models.households
        .upsert(obj, { 
          returning: false, 
          plain: false, 
          onDuplicate: 'update',
        })
        .then(([row, created]) => {
          console.log(created ? 'Created' : 'Updated', row.toJSON());
        })
        .catch((err) => {
           console.log(err)
          errors.push(err.original);
        });
    }
  
    if (errors.length > 0) {

      console.log('HH import errors', errors)

      

      res.status(500).send({ message: 'Import/Update failed:' + errors[0] });
      
    } else {
      res.status(200).send({
        message: 'HH import Successful',
        code: '0000',
      });
    }
  };
  
  exports.xxbatchHouseholdImport = async (req, res) => {
    let data = req.body.data;
    let errors = [];
    let newRecords = 0;
    let updatedRecords = 0;
    let unchangedRecords = 0;
  
    for (let i = 0; i < data.length; i++) {
      const obj = data[i];
      const national_id = obj.national_id;
      const name = obj.name;

      obj.name=sequelize.fn('PGP_SYM_ENCRYPT',name, 'maluini')

      // Check if a record with the same unique key constraint exists
      const existingRecord = await db.models.households.findOne({
        where: { national_id: national_id }, // Replace 'name' with your unique key field
      });
  
      if (existingRecord) {
        // Compare the existing record with the submitted data
        const isDifferent = !isEqual(existingRecord.toJSON(), obj);
  
        if (isDifferent) {
          // Update the record if the submitted data is different
          try {
            await db.models.households.update(obj, {
              where: { national_id: national_id }, // Replace 'name' with your unique key field
            });
            updatedRecords++;
          } catch (err) {
            console.error(err);
            errors.push(err);
          }
        } else {
          unchangedRecords++;
        }
      } else {
        // If no existing record, create a new one
        try {
          await db.models.households.create(obj);
          newRecords++;
        } catch (err) {
          console.error(err);
          errors.push(err);
        }
      }
    }
  
    if (errors.length > 0) {
      console.error('HH import errors', errors);
      res.status(500).send({ message: 'Import/Update failed:' + errors[0] });
    } else {
      res.status(200).send({
        message: 'HH import Successful',
        code: '0000',
        summary: {
          newRecords,
          updatedRecords,
          unchangedRecords,
        },
      });
    }
  };
  

  exports.batchHouseholdImport = async (req, res) => {
    let data = req.body.data;
    let errors = [];
    let newRecords = 0;
    let updatedRecords = 0;
  
    for (let i = 0; i < data.length; i++) {
      const obj = data[i];
      const name = obj.name;

      const national_id = obj.national_id;
 
      obj.name=sequelize.fn('PGP_SYM_ENCRYPT',name, 'maluini')

  
      try {
        // Update the record if it exists or create a new one if it doesn't
       // Try to find an existing record
      const [record, created] = await db.models.households.findOrCreate({
        where: { national_id: national_id }, // Replace 'name' with your unique key field
        defaults: obj, // Set the default values to obj
      });

      if (!created) {
        // Record already existed, and we didn't update it
        updatedRecords++;
      } else {
        // New record was created
        newRecords++;
      }
      } catch (err) {
        console.error(err);
        errors.push(err);
      }
    }
  
    if (errors.length > 0) {
      console.error('HH import errors', errors);
      res.status(500).send({ message: 'Import/Update failed:' + errors[0] });
    } else {
      res.status(200).send({
        message: 'HH import Successful. New:' +newRecords+ ', Updated:'+updatedRecords,
        code: '0000',
        summary: {
          newRecords,
          updatedRecords,
        },
      });
    }
  };
  