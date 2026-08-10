'use strict'

const settlementPopulationGeo = require('./settlementPopulationGeo')
const { enrichIndicatorCategoryReportRecords } = require('./monitoringReportImport')

const ID_FIELDS = ['project_id', 'county_id', 'subcounty_id', 'ward_id', 'settlement_id', 'implementer']

function parseDryRunFlag(value) {
  return value === true || value === 'true' || value === 1 || value === '1'
}

function preValidateRecords(data, attributes) {
  const errors = []
  const validRecords = []

  data.forEach((origItem, index) => {
    if (!origItem || typeof origItem !== 'object') {
      errors.push({
        item: origItem,
        error: 'Invalid record format',
        detail: `Record at index ${index} is not an object.`
      })
      return
    }

    const item = {}
    Object.keys(origItem).forEach((key) => {
      if (attributes[key]) item[key] = origItem[key]
    })

    ID_FIELDS.forEach((field) => {
      if (item[field] && typeof item[field] === 'string' && !Number.isNaN(parseInt(item[field], 10))) {
        item[field] = parseInt(item[field], 10)
      }
    })

    Object.entries(attributes).forEach(([key, attrDef]) => {
      if (!(key in item)) return
      const val = item[key]
      if (val == null) return
      const expType = attrDef.type.key
      let mismatch = false
      switch (expType) {
        case 'INTEGER':
        case 'BIGINT':
        case 'FLOAT':
        case 'DOUBLE':
        case 'DECIMAL':
          if (typeof val !== 'number') mismatch = true
          break
        case 'DATE':
          if (Number.isNaN(Date.parse(val))) mismatch = true
          break
        case 'JSON':
          if (typeof val !== 'object') mismatch = true
          break
        default:
          return
      }
      if (mismatch) {
        errors.push({
          item,
          field: key,
          error: 'Type mismatch',
          detail: `Expected ${expType} for '${key}', got ${typeof val}`
        })
      }
    })

    if (!errors.some((e) => e.item === origItem || e.item === item)) {
      validRecords.push(item)
    }
  })

  return { errors, validRecords }
}

function prepareImportRecords(validRecords, modelName, currentUser) {
  const timestamp = new Date()
  let validData = validRecords.map((item) => {
    const record = {
      ...item,
      createdBy: currentUser,
      updatedAt: timestamp,
      createdAt: item.createdAt || timestamp,
    }

    if (modelName === 'community_issue') {
      record.isApproved = item.isApproved || 'Pending'
      record.status = item.status || 'Submitted'
      record.severity = item.severity || 'medium'
    } else {
      record.isApproved = 'Approved'
    }

    if (modelName === 'households') {
      let name = record.respondents_name || ''
      name = name.trim()
      record.respondents_name = name.length > 0 ? name : 'unspecified'
    }

    return record
  })

  return validData
}

function hasLocationName(value) {
  return typeof value === 'string' && value.trim() !== ''
}

async function enrichProjectLocationRecords(db, records) {
  const toInt = (value) => {
    if (value == null || value === '') return null
    const parsed = parseInt(value, 10)
    return Number.isNaN(parsed) ? null : parsed
  }

  for (const record of records) {
    if (!toInt(record.county_id)) {
      if (toInt(record.settlement_id)) {
        const settlement = await db.models.settlement.findByPk(toInt(record.settlement_id), {
          attributes: ['name', 'county_id', 'subcounty_id', 'ward_id'],
          raw: true
        })
        if (settlement) {
          record.county_id = record.county_id || settlement.county_id
          record.subcounty_id = record.subcounty_id || settlement.subcounty_id
          record.ward_id = record.ward_id || settlement.ward_id
          if (!hasLocationName(record.location_name) && settlement.name) {
            record.location_name = settlement.name
          }
        }
      } else if (toInt(record.ward_id)) {
        const ward = await db.models.ward.findByPk(toInt(record.ward_id), {
          attributes: ['name', 'county_id', 'subcounty_id'],
          raw: true
        })
        if (ward) {
          record.county_id = record.county_id || ward.county_id
          record.subcounty_id = record.subcounty_id || ward.subcounty_id
          if (!hasLocationName(record.location_name) && ward.name) {
            record.location_name = ward.name
          }
        }
      } else if (toInt(record.subcounty_id)) {
        const subcounty = await db.models.subcounty.findByPk(toInt(record.subcounty_id), {
          attributes: ['name', 'county_id'],
          raw: true
        })
        if (subcounty) {
          record.county_id = record.county_id || subcounty.county_id
          if (!hasLocationName(record.location_name) && subcounty.name) {
            record.location_name = subcounty.name
          }
        }
      }
    }

    if (!hasLocationName(record.location_name) && toInt(record.settlement_id)) {
      const settlement = await db.models.settlement.findByPk(toInt(record.settlement_id), {
        attributes: ['name'],
        raw: true
      })
      if (settlement?.name) {
        record.location_name = settlement.name
      }
    }

    if (!hasLocationName(record.location_name) && toInt(record.ward_id)) {
      const ward = await db.models.ward.findByPk(toInt(record.ward_id), {
        attributes: ['name'],
        raw: true
      })
      if (ward?.name) {
        record.location_name = ward.name
      }
    }

    if (!hasLocationName(record.location_name) && toInt(record.subcounty_id)) {
      const subcounty = await db.models.subcounty.findByPk(toInt(record.subcounty_id), {
        attributes: ['name'],
        raw: true
      })
      if (subcounty?.name) {
        record.location_name = subcounty.name
      }
    }

    if (!hasLocationName(record.location_name) && toInt(record.county_id)) {
      const county = await db.models.county.findByPk(toInt(record.county_id), {
        attributes: ['name'],
        raw: true
      })
      if (county?.name) {
        record.location_name = county.name
      }
    }
  }

  return records
}

function pushFieldLengthErrors(item, attributes, errors) {
  const tooLongFields = []
  Object.entries(attributes).forEach(([key, attrDef]) => {
    if (!(key in item)) return
    const val = item[key]
    if (val == null) return
    const typeKey = attrDef?.type?.key
    if (typeof val === 'string' && (typeKey === 'STRING' || typeKey === 'CHAR')) {
      const configuredLen = attrDef?.type?.options?.length ? Number(attrDef.type.options.length) : undefined
      const maxLen = configuredLen || 255
      if (val.length > maxLen) {
        tooLongFields.push({ field: key, max: maxLen, length: val.length })
      }
    }
  })

  tooLongFields.forEach((f) => {
    errors.push({
      item,
      field: f.field,
      error: 'too_long',
      detail: `Field '${f.field}' length ${f.length} exceeds maximum ${f.max}`
    })
  })

  return tooLongFields.length > 0
}

function pushSequelizeError(item, err, attributes, errors) {
  if (Array.isArray(err?.errors) && err.errors.length) {
    err.errors.forEach((e) => {
      const fieldName = e?.path || e?.column || 'unknown'
      errors.push({
        item,
        field: fieldName,
        error: e?.type || (err.name || 'UpsertError'),
        detail: `Field '${fieldName}': ${e?.message || err.message}`
      })
    })
    return
  }

  if (err?.fields && Object.keys(err.fields).length) {
    Object.keys(err.fields).forEach((fieldName) => {
      errors.push({
        item,
        field: fieldName,
        error: err.name || 'UpsertError',
        detail: `Field '${fieldName}': ${err.message}`
      })
    })
    return
  }

  if (/value too long for type character varying\((\d+)\)/i.test(String(err?.message || ''))) {
    Object.entries(item).forEach(([k, v]) => {
      const attr = attributes[k]
      const typeKey = attr?.type?.key
      const configuredLen = attr?.type?.options?.length ? Number(attr.type.options.length) : undefined
      const maxLen = configuredLen || 255
      if (typeof v === 'string' && (typeKey === 'STRING' || typeKey === 'CHAR') && v.length > maxLen) {
        errors.push({
          item,
          field: k,
          error: 'too_long',
          detail: `Field '${k}' length ${v.length} exceeds maximum ${maxLen}`
        })
      }
    })
    if (!errors.some((e) => e.item === item)) {
      errors.push({ item, error: err.name || 'UpsertError', detail: err.message })
    }
    return
  }

  errors.push({ item, error: err.name || 'UpsertError', detail: err.message })
}

async function findExistingRecord(Model, item, attributes, forceInsert, txOptions) {
  if (forceInsert) return null

  if (item.code) {
    const existingByCode = await Model.findOne({ where: { code: item.code }, ...txOptions })
    if (existingByCode) return existingByCode
  }

  const uniqueFields = Object.keys(attributes).filter(
    (attr) => attributes[attr].unique || (attributes[attr].primaryKey && attr !== 'id')
  )
  const where = {}
  uniqueFields.forEach((f) => {
    if (item[f] != null) where[f] = item[f]
  })

  if (!Object.keys(where).length) return null
  return Model.findOne({ where, ...txOptions })
}

async function applyUpdate({
  db,
  Model,
  modelName,
  existing,
  item,
  dryRun,
  txOptions,
  updated,
  aiProcessed,
  processRecordForAI
}) {
  const updateData = { ...item }
  if (item.code) delete updateData.code

  const shouldSyncPopulationGeo =
    !dryRun &&
    modelName === 'settlement' &&
    settlementPopulationGeo.settlementGeoChanged(existing, updateData)

  await existing.update(updateData, txOptions)

  if (shouldSyncPopulationGeo) {
    await settlementPopulationGeo.syncSettlementPopulationGeoFromSettlement(db, existing.id, {
      county_id: existing.county_id,
      subcounty_id: existing.subcounty_id,
      ward_id: existing.ward_id
    })
  }

  updated.push(item.code || existing.id)

  if (!dryRun && processRecordForAI) {
    try {
      const aiResult = await processRecordForAI(existing, modelName)
      aiProcessed.push({ recordId: existing.id, action: 'updated', aiResult })
    } catch (aiError) {
      aiProcessed.push({
        recordId: existing.id,
        action: 'updated',
        aiResult: { success: false, error: aiError.message }
      })
    }
  }
}

async function applyInsert({
  db,
  Model,
  modelName,
  item,
  attributes,
  forceInsert,
  dryRun,
  txOptions,
  inserted,
  updated,
  errors,
  aiProcessed,
  processRecordForAI
}) {
  try {
    const rec = await Model.create(item, txOptions)
    inserted.push(rec.id)

    if (!dryRun && processRecordForAI) {
      try {
        const aiResult = await processRecordForAI(rec, modelName)
        aiProcessed.push({ recordId: rec.id, action: 'inserted', aiResult })
      } catch (aiError) {
        aiProcessed.push({
          recordId: rec.id,
          action: 'inserted',
          aiResult: { success: false, error: aiError.message }
        })
      }
    }
  } catch (createErr) {
    if (createErr.name !== 'SequelizeUniqueConstraintError') throw createErr

    const vioWhere = {}
    Object.keys(createErr.fields || {}).forEach((f) => {
      vioWhere[f] = item[f]
    })
    const rec = await Model.findOne({ where: vioWhere, ...txOptions })

    if (!rec) {
      errors.push({ item, error: createErr.name, detail: createErr.message })
      return
    }

    await applyUpdate({
      db,
      Model,
      modelName,
      existing: rec,
      item,
      dryRun,
      txOptions,
      updated,
      aiProcessed,
      processRecordForAI
    })
  }
}

async function runUpsertLoop({
  db,
  Model,
  modelName,
  validData,
  attributes,
  forceInsert,
  dryRun,
  transaction,
  processRecordForAI
}) {
  const inserted = []
  const updated = []
  const errors = []
  const aiProcessed = []
  const txOptions = dryRun && transaction ? { transaction } : {}

  for (const item of validData) {
    try {
      if (pushFieldLengthErrors(item, attributes, errors)) continue

      const existing = await findExistingRecord(Model, item, attributes, forceInsert, txOptions)

      if (existing) {
        await applyUpdate({
          db,
          Model,
          modelName,
          existing,
          item,
          dryRun,
          txOptions,
          updated,
          aiProcessed,
          processRecordForAI
        })
      } else {
        await applyInsert({
          db,
          Model,
          modelName,
          item,
          attributes,
          forceInsert,
          dryRun,
          txOptions,
          inserted,
          updated,
          errors,
          aiProcessed,
          processRecordForAI
        })
      }
    } catch (err) {
      pushSequelizeError(item, err, attributes, errors)
    }
  }

  if (modelName === 'households' && !dryRun) {
    await db.sequelize.query(
      `UPDATE "households"
         SET monthly_income = CASE
           WHEN monthly_income::int <= 5000 THEN '0_5000'
           WHEN monthly_income::int BETWEEN 5001 AND 10000 THEN '5001_10000'
           WHEN monthly_income::int BETWEEN 10001 AND 15000 THEN '10001_15000'
           WHEN monthly_income::int BETWEEN 15001 AND 20000 THEN '15001_20000'
           WHEN monthly_income::int BETWEEN 20001 AND 30000 THEN '20001_30000'
           WHEN monthly_income::int BETWEEN 30001 AND 50000 THEN '30001_50000'
           WHEN monthly_income::int > 50000 THEN 'above_50000'
         END
         WHERE monthly_income ~ '^[0-9]+$';`,
      txOptions.transaction ? { transaction: txOptions.transaction } : undefined
    )
  }

  return { inserted, updated, errors, aiProcessed }
}

async function executeImportUpsert({
  db,
  modelName,
  rawData,
  forceInsert = false,
  dryRun = false,
  currentUser = null,
  processRecordForAI = null
}) {
  const Model = db.models[modelName]
  if (!Model) {
    return {
      ok: false,
      status: 400,
      body: { message: `Model "${modelName}" not found` }
    }
  }

  const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData
  if (!Array.isArray(data)) {
    return {
      ok: false,
      status: 400,
      body: { message: 'Data must be an array' }
    }
  }

  const attributes = Model.rawAttributes
  const { errors, validRecords } = preValidateRecords(data, attributes)

  if (!validRecords.length) {
    return {
      ok: false,
      status: 400,
      body: {
        message: 'No valid records to process',
        failedCount: errors.length,
        errors,
        dryRun: dryRun || undefined
      }
    }
  }

  let validData = prepareImportRecords(validRecords, modelName, currentUser)

  if (modelName === 'settlement_population') {
    validData = await settlementPopulationGeo.enrichSettlementPopulationRecords(db, validData)
  }

  if (modelName === 'project_location') {
    validData = await enrichProjectLocationRecords(db, validData)
  }

  if (modelName === 'indicator_category_report') {
    validData = await enrichIndicatorCategoryReportRecords(db, validData)
  }

  let transaction = null
  if (dryRun) {
    transaction = await db.sequelize.transaction()
  }

  try {
    const result = await runUpsertLoop({
      db,
      Model,
      modelName,
      validData,
      attributes,
      forceInsert,
      dryRun,
      transaction,
      processRecordForAI
    })

    if (dryRun && transaction) {
      await transaction.rollback()
    }

    const hasErrors = result.errors.length > 0
    const successfulAIProcessing = result.aiProcessed.filter((p) => p.aiResult?.success).length
    const failedAIProcessing = result.aiProcessed.filter((p) => p.aiResult && !p.aiResult.success).length

    return {
      ok: true,
      status: hasErrors ? 207 : 200,
      body: {
        message: dryRun
          ? (hasErrors ? 'Dry run completed with validation errors' : 'Dry run completed successfully')
          : (hasErrors ? 'Import completed with some errors' : 'Import process completed successfully'),
        insertedCount: result.inserted.length,
        updatedCount: result.updated.length,
        failedCount: result.errors.length,
        aiProcessing: {
          totalProcessed: result.aiProcessed.length,
          successful: successfulAIProcessing,
          failed: failedAIProcessing,
          details: result.aiProcessed
        },
        errors: result.errors,
        code: hasErrors ? '0001' : '0000',
        dryRun: dryRun || undefined
      }
    }
  } catch (err) {
    if (transaction) {
      try {
        await transaction.rollback()
      } catch (rollbackErr) {
        console.error('[importUpsert] dry-run rollback failed:', rollbackErr)
      }
    }
    throw err
  }
}

module.exports = {
  parseDryRunFlag,
  preValidateRecords,
  executeImportUpsert
}
