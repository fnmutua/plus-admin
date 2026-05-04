const db = require('../models')
const config = require('../config/db.config.js')
///const config = require("../config/db.config.js");
const Sequelize = require('sequelize')
 const op = Sequelize.Op
var jwt = require('jsonwebtoken')
var bcrypt = require('bcryptjs')
const crypto = require('crypto');
const path = require('path')
const os = require('os')

 
const nodemailer = require('nodemailer')
const { authJwt } = require("../middleware");
var fs = require('fs');

const householdExportJobs = new Map()
const HOUSEHOLD_EXPORT_JOB_TTL_MS = 1000 * 60 * 30

const csvEscape = (value) => {
  if (value === null || value === undefined) return ''
  const text = String(value)
  if (text.includes('"') || text.includes(',') || text.includes('\n') || text.includes('\r')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

const cleanupExpiredHouseholdExportJobs = () => {
  const now = Date.now()
  for (const [jobId, job] of householdExportJobs.entries()) {
    if (now - job.createdAt > HOUSEHOLD_EXPORT_JOB_TTL_MS) {
      if (job.filePath && fs.existsSync(job.filePath)) {
        try {
          fs.unlinkSync(job.filePath)
        } catch (_err) {}
      }
      householdExportJobs.delete(jobId)
    }
  }
}

const buildHouseholdsExportCsv = async ({ anonymizeLocation = true } = {}) => {
  const excludedFields = ['name', 'national_id', 'phone', 'telephone', 'respondents_name', 'geom']
  const allAttributes = Object.keys(db.models.households.rawAttributes)
  const safeFields = allAttributes.filter((field) => !excludedFields.includes(field))
  console.log('[HH Export] Preparing CSV columns:', safeFields.length)
  console.log('[HH Export] Anonymize location:', anonymizeLocation)

  const selectCols = safeFields.map((field) => `h."${field}" AS "${field}"`).join(', ')
  const anonymizeEnabledSql = anonymizeLocation ? 'TRUE' : 'FALSE'
  const anonSeedSalt = process.env.EXPORT_ANON_SALT || process.env.AES_KEY || 'plus-admin-export-salt'
  const sql = `
    WITH base AS (
      SELECT
        ${selectCols},
        CASE
          WHEN ${anonymizeEnabledSql} AND s."geom" IS NOT NULL THEN
            ST_ClosestPoint(
              s."geom"::geometry,
              ST_SetSRID(
                ST_MakePoint(
                  ST_XMin(s."geom"::geometry)
                    + (((abs(hashtextextended(h."id"::text || :anonSeedSalt || '_x', 0))::bigint % 1000000)::double precision / 1000000.0)
                    * (ST_XMax(s."geom"::geometry) - ST_XMin(s."geom"::geometry))),
                  ST_YMin(s."geom"::geometry)
                    + (((abs(hashtextextended(h."id"::text || :anonSeedSalt || '_y', 0))::bigint % 1000000)::double precision / 1000000.0)
                    * (ST_YMax(s."geom"::geometry) - ST_YMin(s."geom"::geometry)))
                ),
                ST_SRID(s."geom"::geometry)
              )
            )
          ELSE
            CASE WHEN h."geom" IS NOT NULL THEN h."geom"::geometry ELSE NULL END
        END AS "export_geom",
        s."name" AS "settlement_name",
        c."name" AS "county_name"
      FROM "households" h
      LEFT JOIN "settlement" s ON s."id" = h."settlement_id"
      LEFT JOIN "county" c ON c."id" = COALESCE(h."county_id", s."county_id")
    ),
    ben_by_hh AS (
      SELECT
        b."hh_id" AS "hh_id",
        array_to_string(array_remove(array_agg(DISTINCT p."id"::text), NULL), ' | ') AS "ben_project_ids",
        array_to_string(array_remove(array_agg(DISTINCT p."title"), NULL), ' | ') AS "ben_project_titles",
        array_to_string(array_remove(array_agg(DISTINCT p."code"), NULL), ' | ') AS "ben_project_internal_codes",
        array_to_string(array_remove(array_agg(DISTINCT p."project_code"), NULL), ' | ') AS "ben_project_codes",
        array_to_string(array_remove(array_agg(DISTINCT p."status"), NULL), ' | ') AS "ben_project_statuses",
        array_to_string(array_remove(array_agg(DISTINCT p."implementation_scope"), NULL), ' | ') AS "ben_project_implementation_scopes",
        array_to_string(array_remove(array_agg(DISTINCT p."start_date"::text), NULL), ' | ') AS "ben_project_start_dates",
        array_to_string(array_remove(array_agg(DISTINCT p."end_date"::text), NULL), ' | ') AS "ben_project_end_dates",
        array_to_string(array_remove(array_agg(DISTINCT comp."id"::text), NULL), ' | ') AS "ben_component_ids",
        array_to_string(array_remove(array_agg(DISTINCT comp."title"), NULL), ' | ') AS "ben_component_titles",
        array_to_string(array_remove(array_agg(DISTINCT comp."code"), NULL), ' | ') AS "ben_component_codes",
        array_to_string(array_remove(array_agg(DISTINCT comp."acronym"), NULL), ' | ') AS "ben_component_acronyms"
      FROM "beneficiary" b
      INNER JOIN "project" p ON p."id" = b."project_id"
      LEFT JOIN "component" comp ON comp."id" = COALESCE(b."component_id", p."component_id")
      WHERE b."hh_id" IS NOT NULL
      GROUP BY b."hh_id"
    ),
    loc_by_hh AS (
      SELECT
        h."id" AS "hh_id",
        array_to_string(array_remove(array_agg(DISTINCT pl."id"::text), NULL), ' | ') AS "pl_ids",
        array_to_string(array_remove(array_agg(DISTINCT pl."settlement_id"::text), NULL), ' | ') AS "pl_settlement_ids",
        array_to_string(array_remove(array_agg(DISTINCT pl."location_name"), NULL), ' | ') AS "pl_location_names",
        array_to_string(array_remove(array_agg(DISTINCT pl."location_type"), NULL), ' | ') AS "pl_location_types",
        array_to_string(array_remove(array_agg(DISTINCT pr."id"::text), NULL), ' | ') AS "pl_project_ids",
        array_to_string(array_remove(array_agg(DISTINCT pr."title"), NULL), ' | ') AS "pl_project_titles",
        array_to_string(array_remove(array_agg(DISTINCT pr."code"), NULL), ' | ') AS "pl_project_internal_codes",
        array_to_string(array_remove(array_agg(DISTINCT pr."project_code"), NULL), ' | ') AS "pl_project_codes",
        array_to_string(array_remove(array_agg(DISTINCT pr."status"), NULL), ' | ') AS "pl_project_statuses",
        array_to_string(array_remove(array_agg(DISTINCT pr."implementation_scope"), NULL), ' | ') AS "pl_project_implementation_scopes",
        array_to_string(array_remove(array_agg(DISTINCT pr."start_date"::text), NULL), ' | ') AS "pl_project_start_dates",
        array_to_string(array_remove(array_agg(DISTINCT pr."end_date"::text), NULL), ' | ') AS "pl_project_end_dates",
        array_to_string(array_remove(array_agg(DISTINCT comp_pl."id"::text), NULL), ' | ') AS "pl_component_ids",
        array_to_string(array_remove(array_agg(DISTINCT comp_pl."title"), NULL), ' | ') AS "pl_component_titles",
        array_to_string(array_remove(array_agg(DISTINCT comp_pl."code"), NULL), ' | ') AS "pl_component_codes",
        array_to_string(array_remove(array_agg(DISTINCT comp_pl."acronym"), NULL), ' | ') AS "pl_component_acronyms"
      FROM "households" h
      LEFT JOIN "project_location" pl ON pl."settlement_id" IS NOT NULL AND pl."settlement_id" = h."settlement_id"
      LEFT JOIN "project" pr ON pr."id" = pl."project_id"
      LEFT JOIN "component" comp_pl ON comp_pl."id" = pr."component_id"
      GROUP BY h."id"
    )
    SELECT
      ${safeFields.map((field) => `bx."${field}"`).join(', ')},
      CASE WHEN bx."export_geom" IS NOT NULL THEN ST_Y(bx."export_geom"::geometry) ELSE NULL END AS "latitude",
      CASE WHEN bx."export_geom" IS NOT NULL THEN ST_X(bx."export_geom"::geometry) ELSE NULL END AS "longitude",
      bx."settlement_name",
      bx."county_name",
      ben."ben_project_ids",
      ben."ben_project_titles",
      ben."ben_project_internal_codes",
      ben."ben_project_codes",
      ben."ben_project_statuses",
      ben."ben_project_implementation_scopes",
      ben."ben_project_start_dates",
      ben."ben_project_end_dates",
      ben."ben_component_ids",
      ben."ben_component_titles",
      ben."ben_component_codes",
      ben."ben_component_acronyms",
      loc."pl_ids",
      loc."pl_settlement_ids",
      loc."pl_location_names",
      loc."pl_location_types",
      loc."pl_project_ids",
      loc."pl_project_titles",
      loc."pl_project_internal_codes",
      loc."pl_project_codes",
      loc."pl_project_statuses",
      loc."pl_project_implementation_scopes",
      loc."pl_project_start_dates",
      loc."pl_project_end_dates",
      loc."pl_component_ids",
      loc."pl_component_titles",
      loc."pl_component_codes",
      loc."pl_component_acronyms"
    FROM base bx
    LEFT JOIN ben_by_hh ben ON ben."hh_id" = bx."id"
    LEFT JOIN loc_by_hh loc ON loc."hh_id" = bx."id"
    ORDER BY bx."id" DESC
  `
  console.log('[HH Export] Running export query...')
  console.log('[HH Export] SQL:', sql.replace(/\s+/g, ' ').trim())

  const rows = await db.sequelize.query(sql, {
    type: Sequelize.QueryTypes.SELECT,
    replacements: { anonSeedSalt }
  })
  console.log('[HH Export] Query rows fetched:', rows.length)
  const projectComponentExportColumns = [
    'ben_project_ids',
    'ben_project_titles',
    'ben_project_internal_codes',
    'ben_project_codes',
    'ben_project_statuses',
    'ben_project_implementation_scopes',
    'ben_project_start_dates',
    'ben_project_end_dates',
    'ben_component_ids',
    'ben_component_titles',
    'ben_component_codes',
    'ben_component_acronyms',
    'pl_ids',
    'pl_settlement_ids',
    'pl_location_names',
    'pl_location_types',
    'pl_project_ids',
    'pl_project_titles',
    'pl_project_internal_codes',
    'pl_project_codes',
    'pl_project_statuses',
    'pl_project_implementation_scopes',
    'pl_project_start_dates',
    'pl_project_end_dates',
    'pl_component_ids',
    'pl_component_titles',
    'pl_component_codes',
    'pl_component_acronyms'
  ]
  const columns = [...safeFields, 'latitude', 'longitude', 'settlement_name', 'county_name', ...projectComponentExportColumns]
  const header = columns.join(',')
  const body = rows
    .map((row) => columns.map((col) => csvEscape(row[col])).join(','))
    .join('\n')
  console.log('[HH Export] CSV prepared. Columns:', columns.length, 'Body chars:', body.length)

  return `${header}\n${body}`
}

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
      const shouldResolveSettlement = includeSettlementAssoc || includeCountyAssoc
      const settlementIds = shouldResolveSettlement
        ? [...new Set(dataRows.map((r) => r.settlement_id).filter(Boolean))]
        : []
      const settlements = settlementIds.length
        ? await db.models.settlement.findAll({
            where: { id: settlementIds },
            attributes: ['id', 'name', 'county_id'],
            raw: true
          })
        : []
      const sm = new Map(settlements.map((s) => [Number(s.id), s]))

      if (includeSettlementAssoc) {
        dataRows.forEach((r) => {
          const settlement = sm.get(Number(r.settlement_id))
          r.settlement = settlement ? { id: settlement.id, name: settlement.name } : null
        })
      }

      if (includeCountyAssoc) {
        const countyIds = [
          ...new Set(
            dataRows
              .map((r) => r.county_id || sm.get(Number(r.settlement_id))?.county_id)
              .filter(Boolean)
          )
        ]
        if (countyIds.length) {
          const counties = await db.models.county.findAll({
            where: { id: countyIds },
            attributes: ['id', 'name'],
            raw: true
          })
          const cm = new Map(counties.map((c) => [Number(c.id), { id: c.id, name: c.name }]))
          dataRows.forEach((r) => {
            const resolvedCountyId = r.county_id || sm.get(Number(r.settlement_id))?.county_id
            r.county = resolvedCountyId ? (cm.get(Number(resolvedCountyId)) || null) : null
          })
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
      const shouldResolveSettlement = includeSettlementAssoc || includeCountyAssoc
      const settlementIds = shouldResolveSettlement
        ? [...new Set(dataRows.map((r) => r.settlement_id).filter(Boolean))]
        : []
      const settlements = settlementIds.length
        ? await db.models.settlement.findAll({
            where: { id: settlementIds },
            attributes: ['id', 'name', 'county_id'],
            raw: true
          })
        : []
      const sm = new Map(settlements.map((s) => [Number(s.id), s]))

      if (includeSettlementAssoc) {
        dataRows.forEach((r) => {
          const settlement = sm.get(Number(r.settlement_id))
          r.settlement = settlement ? { id: settlement.id, name: settlement.name } : null
        })
      }
      if (includeCountyAssoc) {
        const countyIds = [
          ...new Set(
            dataRows
              .map((r) => r.county_id || sm.get(Number(r.settlement_id))?.county_id)
              .filter(Boolean)
          )
        ]
        if (countyIds.length) {
          const counties = await db.models.county.findAll({
            where: { id: countyIds },
            attributes: ['id', 'name'],
            raw: true
          })
          const cm = new Map(counties.map((c) => [Number(c.id), { id: c.id, name: c.name }]))
          dataRows.forEach((r) => {
            const resolvedCountyId = r.county_id || sm.get(Number(r.settlement_id))?.county_id
            r.county = resolvedCountyId ? (cm.get(Number(resolvedCountyId)) || null) : null
          })
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

exports.createHouseholdExportJob = async (_req, res) => {
  cleanupExpiredHouseholdExportJobs()
  const anonymizeLocation = _req?.body?.anonymize_location !== false
  const jobId = crypto.randomUUID()
  const filename = `households_${new Date().toISOString().slice(0, 10)}_${jobId.slice(0, 8)}.csv`
  const filePath = path.join(os.tmpdir(), filename)
  console.log(`[HH Export] Job created: ${jobId}`)
  console.log('[HH Export] Target file:', filePath)

  householdExportJobs.set(jobId, {
    id: jobId,
    status: 'processing',
    createdAt: Date.now(),
    filePath: null,
    filename,
    anonymizeLocation
  })

  setImmediate(async () => {
    try {
      console.log(`[HH Export] Job ${jobId} started`)
      const csv = await buildHouseholdsExportCsv({ anonymizeLocation })
      fs.writeFileSync(filePath, csv, 'utf8')
      const job = householdExportJobs.get(jobId)
      if (!job) return
      job.status = 'completed'
      job.filePath = filePath
      job.completedAt = Date.now()
      console.log(`[HH Export] Job ${jobId} completed. File size bytes:`, Buffer.byteLength(csv, 'utf8'))
    } catch (err) {
      const job = householdExportJobs.get(jobId)
      if (!job) return
      job.status = 'failed'
      job.error = err?.message || 'Failed to export households'
      console.log(`[HH Export] Job ${jobId} failed:`, job.error)
    }
  })

  return res.status(200).send({
    code: '0000',
    data: {
      job_id: jobId,
      status: 'processing'
    }
  })
}

exports.getHouseholdExportJobStatus = async (req, res) => {
  cleanupExpiredHouseholdExportJobs()
  const jobId = req.body?.job_id
  if (!jobId) {
    return res.status(400).send({ code: '4000', message: 'job_id is required' })
  }
  const job = householdExportJobs.get(jobId)
  if (!job) {
    return res.status(404).send({ code: '4040', message: 'Export job not found or expired' })
  }
  console.log(`[HH Export] Status check for ${jobId}:`, job.status)

  return res.status(200).send({
    code: '0000',
    data: {
      job_id: job.id,
      status: job.status,
      error: job.error || null
    }
  })
}

exports.downloadHouseholdExportJob = async (req, res) => {
  cleanupExpiredHouseholdExportJobs()
  const jobId = req.body?.job_id
  if (!jobId) {
    return res.status(400).send({ code: '4000', message: 'job_id is required' })
  }
  const job = householdExportJobs.get(jobId)
  if (!job) {
    return res.status(404).send({ code: '4040', message: 'Export job not found or expired' })
  }
  if (job.status !== 'completed' || !job.filePath || !fs.existsSync(job.filePath)) {
    console.log(`[HH Export] Download requested but not ready for ${jobId}. Status:`, job.status)
    return res.status(409).send({ code: '4090', message: 'Export job not ready for download' })
  }
  console.log(`[HH Export] Sending file for ${jobId}:`, job.filePath)

  return res.download(job.filePath, job.filename)
}
  