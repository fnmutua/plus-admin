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
    obj.name=sequelize.fn('PGP_SYM_ENCRYPT',name, process.env.AES_KEY)
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
    obj.name=sequelize.fn('PGP_SYM_ENCRYPT',name, process.env.AES_KEY)
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
    // Build attributes list excluding sensitive identifiers
    const attributes = []
    for (const key in db.models.households.rawAttributes) {
      if (!['name', 'phone', 'national_id', 'respondents_name', 'telephone'].includes(key)) {
        attributes.push(key)
      }
    }
    // Do NOT add decrypted name/phone/national_id back – keep them server-side only
    qry.attributes = attributes
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
    var associated_multiple_models = Array.isArray(req.body.associated_multiple_models)
      ? req.body.associated_multiple_models
      : []
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
  
    const includeSettlementAssoc = associated_multiple_models.includes('settlement')
    const includeCountyAssoc = associated_multiple_models.includes('county')

    // loop through the include models
    for (let i = 0; i < associated_multiple_models.length; i++) {
      const assocName = associated_multiple_models[i]
      // Skip settlement/county SQL joins; enrich after row fetch for speed.
      if (assocName === 'settlement' || assocName === 'county') continue
      var modelIncl = {}
      modelIncl.model = db.models[assocName]
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
  
    if (Array.isArray(req.body.filters) && req.body.filters.length > 0 && Array.isArray(req.body.filterValues) && req.body.filterValues.length > 0) {
      for (let i = 0; i < req.body.filters.length; i++) {
        const filterKey = req.body.filters[i]
        const rawVals = Array.isArray(req.body.filterValues[i]) ? req.body.filterValues[i] : [req.body.filterValues[i]]
        const lstValues = rawVals.filter((v) => v !== null && v !== undefined && v !== '')
        if (!filterKey || lstValues.length === 0) continue
        lstQuerries.push({ [filterKey]: lstValues })
      }
      if (lstQuerries.length > 0) {
        console.log('Final-001-object------------>', lstQuerries)
        qry.where = lstQuerries
      }
    }
    console.log('Final---03--object------------>', qry)
  
    console.log('getting households---33->')

    // Build attributes list excluding sensitive identifiers.
    const allAttrs = Object.keys(db.models.households.rawAttributes)
    const blockedAttrs = ['name', 'phone', 'national_id', 'respondents_name', 'telephone', 'geom']
    const allowedAttrs = allAttrs.filter((k) => !blockedAttrs.includes(k))
    const defaultListAttrs = [
      'id', 'county_id', 'subcounty_id', 'ward_id', 'settlement_id',
      'code', 'age', 'gender', 'hh_size', 'createdAt', 'updatedAt'
    ].filter((k) => allowedAttrs.includes(k))

    const reqFields = Array.isArray(req.body.fields) ? req.body.fields : []
    const selectedAttrs = reqFields.length
      ? reqFields.filter((k) => allowedAttrs.includes(k))
      : defaultListAttrs

    qry.attributes = selectedAttrs.length ? selectedAttrs : allowedAttrs
  qry.order = [['id', 'DESC']]

  const hasNoFilters = !req.body.filters || req.body.filters.length === 0

  const rowsQuery = {
    ...qry,
    distinct: undefined // not needed for row fetch
  }

  const countQuery = {
    where: qry.where || {},
    include: qry.include || [],
    distinct: true,
    col: 'id'
  }

  // For unfiltered listing on large tables, use PostgreSQL planner estimate for fast pagination metadata.
  const estimatedCountPromise = db.sequelize
    .query("SELECT reltuples::bigint AS estimate FROM pg_class WHERE oid = 'public.households'::regclass", {
      type: Sequelize.QueryTypes.SELECT
    })
    .then((rows) => Number(rows?.[0]?.estimate || 0))
    .catch(() => 0)

  Promise.all([
    db.models.households.findAll(rowsQuery),
    hasNoFilters ? estimatedCountPromise : db.models.households.count(countQuery)
  ])
    .then(async ([rows, total]) => {
      const dataRows = rows.map((r) => (r.toJSON ? r.toJSON() : r))
      if (includeSettlementAssoc) {
        const settlementIds = [...new Set(dataRows.map((r) => r.settlement_id).filter(Boolean))]
        if (settlementIds.length) {
          const settlements = await db.models.settlement.findAll({
            where: { id: settlementIds },
            attributes: ['id', 'name'],
            raw: true
          })
          const sm = new Map(settlements.map((s) => [Number(s.id), { id: s.id, name: s.name }]))
          dataRows.forEach((r) => { r.settlement = sm.get(Number(r.settlement_id)) || null })
        } else {
          dataRows.forEach((r) => { r.settlement = null })
        }
      }
      if (includeCountyAssoc) {
        const countyIds = [...new Set(dataRows.map((r) => r.county_id).filter(Boolean))]
        if (countyIds.length) {
          const counties = await db.models.county.findAll({
            where: { id: countyIds },
            attributes: ['id', 'name'],
            raw: true
          })
          const cm = new Map(counties.map((c) => [Number(c.id), { id: c.id, name: c.name }]))
          dataRows.forEach((r) => { r.county = cm.get(Number(r.county_id)) || null })
        } else {
          dataRows.forEach((r) => { r.county = null })
        }
      }
      res.status(200).send({
        data: dataRows,
        total,
        code: '0000'
      })
    })
    .catch((err) => {
      console.log('Households filter/column error:', err)
      res.status(500).send({
        code: '5000',
        message: err?.message || 'Failed to fetch households'
      })
    })
  }
  
exports.getHouseholdsfilterBykeyWord = (req, res) => {
  
    var reg_model = 'households'
    var searchKeyword = req.body.searchKeyword
    // Associated Models
    var associated_multiple_models = Array.isArray(req.body.associated_multiple_models)
      ? req.body.associated_multiple_models
      : []
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
    const includeSettlementAssoc = associated_multiple_models.includes('settlement')
    const includeCountyAssoc = associated_multiple_models.includes('county')

    // loop through the include models
    for (let i = 0; i < associated_multiple_models.length; i++) {
      const assocName = associated_multiple_models[i]
      if (assocName === 'settlement' || assocName === 'county') continue
      var modelIncl = {}
      modelIncl.model = db.models[assocName]
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
    // Keep search payload small too; allow optional field projection from client.
    const allAttrs = Object.keys(db.models.households.rawAttributes)
    const blockedAttrs = ['name', 'phone', 'national_id', 'respondents_name', 'telephone', 'geom']
    const allowedAttrs = allAttrs.filter((k) => !blockedAttrs.includes(k))
    const defaultListAttrs = [
      'id', 'county_id', 'subcounty_id', 'ward_id', 'settlement_id',
      'code', 'age', 'gender', 'hh_size', 'createdAt', 'updatedAt'
    ].filter((k) => allowedAttrs.includes(k))
    const reqFields = Array.isArray(req.body.fields) ? req.body.fields : []
    const selectedAttrs = reqFields.length
      ? reqFields.filter((k) => allowedAttrs.includes(k))
      : defaultListAttrs
    qry.attributes = selectedAttrs.length ? selectedAttrs : allowedAttrs
      
    qry.order = [['id', 'DESC']]

// if key word is r
    if (req.body.searchKeyword) {
        qry.where = {
            [op.and]: [
                Sequelize.where(Sequelize.fn('PGP_SYM_DECRYPT', sequelize.cast(sequelize.col('households.name'), 'bytea'), process.env.AES_KEY), {
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
 
    db.models[reg_model].findAndCountAll(qry).then(async (list) => {
      const dataRows = list.rows.map((r) => (r.toJSON ? r.toJSON() : r))
      if (includeSettlementAssoc) {
        const settlementIds = [...new Set(dataRows.map((r) => r.settlement_id).filter(Boolean))]
        if (settlementIds.length) {
          const settlements = await db.models.settlement.findAll({
            where: { id: settlementIds },
            attributes: ['id', 'name'],
            raw: true
          })
          const sm = new Map(settlements.map((s) => [Number(s.id), { id: s.id, name: s.name }]))
          dataRows.forEach((r) => { r.settlement = sm.get(Number(r.settlement_id)) || null })
        } else {
          dataRows.forEach((r) => { r.settlement = null })
        }
      }
      if (includeCountyAssoc) {
        const countyIds = [...new Set(dataRows.map((r) => r.county_id).filter(Boolean))]
        if (countyIds.length) {
          const counties = await db.models.county.findAll({
            where: { id: countyIds },
            attributes: ['id', 'name'],
            raw: true
          })
          const cm = new Map(counties.map((c) => [Number(c.id), { id: c.id, name: c.name }]))
          dataRows.forEach((r) => { r.county = cm.get(Number(r.county_id)) || null })
        } else {
          dataRows.forEach((r) => { r.county = null })
        }
      }
      res.status(200).send({
        data: dataRows,
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
    // Build attributes list excluding sensitive identifiers
    const attributes = []
    for (const key in db.models.households.rawAttributes) {
      if (!['name', 'phone', 'national_id', 'respondents_name', 'telephone'].includes(key)) {
        attributes.push(key)
      }
    }
    // Do NOT expose decrypted identifiers on single-record fetch either
    qry.attributes = attributes

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
      obj.name=sequelize.fn('PGP_SYM_ENCRYPT',name, process.env.AES_KEY)
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

      obj.name=sequelize.fn('PGP_SYM_ENCRYPT',name, process.env.AES_KEY)

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
 
      obj.name=sequelize.fn('PGP_SYM_ENCRYPT',name, process.env.AES_KEY)

  
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
  