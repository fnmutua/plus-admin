'use strict'

// Import batches: review what a bulk import (QGIS connector, Excel, GeoJSON)
// wrote, and undo it. The rules that keep undo safe live in
// services/importBatch.service.js; this file handles access and side effects.

const db = require('../models')
const importBatches = require('../services/importBatch.service')
const settlementPopulationGeo = require('../services/settlementPopulationGeo')
const aiService = require('../services/ai')
const { loadUserWithPermissions } = require('../middleware/permission')
const { logAudit } = require('../utils/auditTrail')

const fail = (res, error, message) => {
  console.error(`[import-batches] ${message}:`, error)
  return res.status(500).json({ success: false, code: '500', message })
}

/** Reviewers see every import; everyone else sees only their own. */
async function canReviewAll(req) {
  const loaded = await loadUserWithPermissions(req.userid)
  if (!loaded) return false
  const { roleNames, permissions } = loaded
  return (
    roleNames.includes('super_admin') ||
    roleNames.includes('root_admin') ||
    permissions.includes('import:revert')
  )
}

async function loadVisibleBatch(req, res) {
  if (!importBatches.UUID_RE.test(String(req.params.id))) {
    res.status(404).json({ success: false, message: 'Import not found' })
    return null
  }
  const batch = await db.importBatch.findByPk(req.params.id)
  const visible = batch && (String(batch.createdBy) === String(req.userid) || (await canReviewAll(req)))
  if (!visible) {
    res.status(404).json({ success: false, message: 'Import not found' })
    return null
  }
  return batch
}

const revertHooks = {
  // Settlement population rows copy the settlement's county/subcounty/ward.
  async afterRestore(modelName, record, restored, transaction) {
    if (modelName !== 'settlement') return
    if (!['county_id', 'subcounty_id', 'ward_id'].some((field) => field in restored)) return
    await settlementPopulationGeo.syncSettlementPopulationGeoFromSettlement(db, record.id, null, { transaction })
  },
  afterDelete: (modelName, recordId) => aiService.removeRecord(modelName, recordId),
  afterCommitRestore: (modelName, record) => aiService.ingestRecord(record, modelName)
}

exports.list = async (req, res) => {
  try {
    const all = await canReviewAll(req)
    const result = await importBatches.listBatches(db, {
      model: req.query.model || undefined,
      status: req.query.status || undefined,
      createdBy: all ? undefined : req.userid,
      page: req.query.page,
      limit: req.query.limit
    })
    return res.json({ success: true, canRevert: all, ...result })
  } catch (error) {
    return fail(res, error, 'Could not list imports')
  }
}

exports.detail = async (req, res) => {
  try {
    const batch = await loadVisibleBatch(req, res)
    if (!batch) return
    const detail = await importBatches.getBatchDetail(db, batch.id)
    return res.json({ success: true, ...detail })
  } catch (error) {
    return fail(res, error, 'Could not load the import')
  }
}

exports.features = async (req, res) => {
  try {
    const batch = await loadVisibleBatch(req, res)
    if (!batch) return
    return res.json(await importBatches.getBatchFeatures(db, batch.id))
  } catch (error) {
    return fail(res, error, 'Could not load the import geometry')
  }
}

exports.revert = async (req, res) => {
  try {
    const batch = await loadVisibleBatch(req, res)
    if (!batch) return

    const dryRun = req.body?.dryRun === true || req.body?.dryRun === 'true'
    const itemIds = Array.isArray(req.body?.itemIds) ? req.body.itemIds : null

    const result = await importBatches.revertBatch(db, batch.id, {
      itemIds,
      dryRun,
      actorId: req.thisUser?.id ?? req.userid ?? null,
      actorName: req.thisUser?.username ?? null,
      hooks: revertHooks
    })

    if (result.ok && !dryRun) {
      await logAudit({
        req,
        action: 'import_revert',
        entityType: 'import_batch',
        entityId: batch.id,
        metadata: {
          model: batch.model,
          label: batch.label,
          deleted: result.body.deleted,
          restored: result.body.restored,
          conflicts: result.body.summary.conflict
        }
      })
    }

    return res.status(result.status).json({ success: result.ok, ...result.body })
  } catch (error) {
    return fail(res, error, 'Could not undo the import')
  }
}
