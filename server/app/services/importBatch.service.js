'use strict'

// Import batch ledger: records what a bulk import inserted or changed so the
// import can be reviewed and undone without losing anyone's later work.
//
// Recording happens inside the same transaction as the row it describes (see
// importUpsert.service), so a row is never written without its ledger entry.
// Undo then follows three rules:
//   - an inserted row is deleted only if nobody has edited it since and no
//     other record refers to it;
//   - an updated row gets its old values back only if the fields still hold
//     what the import wrote;
//   - a record another, later import also touched waits for that import to be
//     undone first.
// Anything that fails a rule is reported as a conflict and left alone.

const crypto = require('crypto')

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// Changes on every save, so it says nothing about whether someone edited the
// record and is never restored.
const UNTRACKED_FIELDS = new Set(['updatedAt'])

// Fields shown as "geometry changed" instead of being sent to the review page.
const GEOMETRY_TYPES = new Set(['GEOMETRY', 'GEOGRAPHY'])

/** JSON round trip: Dates become ISO strings, geometry becomes plain GeoJSON. */
function normalize(value) {
  if (value === undefined) return null
  return JSON.parse(JSON.stringify(value))
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function sameValue(a, b) {
  return stableStringify(normalize(a)) === stableStringify(normalize(b))
}

function plainRecord(record) {
  if (!record) return null
  return typeof record.get === 'function' ? record.get({ plain: true }) : record
}

/** The named fields of a record, normalized for storage and comparison. */
function snapshot(record, fields) {
  const plain = plainRecord(record) || {}
  const out = {}
  fields.forEach((field) => {
    out[field] = normalize(plain[field])
  })
  return out
}

function trackedFields(item, Model) {
  const pk = Model.primaryKeyAttribute || 'id'
  return Object.keys(item).filter((field) => field !== pk && !UNTRACKED_FIELDS.has(field))
}

function primaryKeyOf(Model) {
  return Model.primaryKeyAttribute || 'id'
}

/**
 * Find or open the batch an upsert request belongs to.
 * A client sends the same importBatchId with every request of one import; a
 * request without one gets a batch of its own.
 */
async function resolveImportBatch(db, { batchId, modelName, currentUser, currentUserName, source, label, transaction }) {
  if (batchId != null && batchId !== '' && !UUID_RE.test(String(batchId))) {
    return { ok: false, status: 400, body: { message: 'importBatchId must be a UUID' } }
  }

  const id = batchId ? String(batchId).toLowerCase() : crypto.randomUUID()
  const [batch, created] = await db.importBatch.findOrCreate({
    where: { id },
    defaults: {
      id,
      model: modelName,
      source: source ? String(source).slice(0, 60) : null,
      label: label ? String(label).slice(0, 255) : null,
      createdBy: currentUser ?? null,
      createdByName: currentUserName ?? null
    },
    transaction
  })

  if (!created) {
    if (batch.model !== modelName || String(batch.createdBy ?? '') !== String(currentUser ?? '')) {
      return {
        ok: false,
        status: 409,
        body: { message: 'This importBatchId belongs to a different import. Start a new batch.' }
      }
    }
    if (batch.status !== 'active') {
      return {
        ok: false,
        status: 409,
        body: { message: 'This import has been undone. Start a new batch to import again.' }
      }
    }
  }

  return { ok: true, batch }
}

/**
 * Write the ledger entry for one inserted or updated record.
 * Reads the row back so "after" matches how the database returns it.
 * An update that changed nothing is not recorded: there is nothing to undo.
 */
async function recordBatchItem(db, { batch, Model, modelName, record, action, item, before, txOptions }) {
  const pk = primaryKeyOf(Model)
  const recordId = plainRecord(record)[pk]
  const fields = trackedFields(item, Model)
  const fresh = await Model.findByPk(recordId, txOptions)
  const after = snapshot(fresh || record, fields)

  let storedBefore = null
  let storedAfter = after
  if (action === 'update') {
    const changed = fields.filter((field) => !sameValue(before[field], after[field]))
    if (!changed.length) return null
    storedBefore = {}
    storedAfter = {}
    changed.forEach((field) => {
      storedBefore[field] = before[field]
      storedAfter[field] = after[field]
    })
  }

  return db.importBatchItem.create(
    {
      batch_id: batch.id,
      model: modelName,
      record_id: String(recordId),
      action,
      before: storedBefore,
      after: storedAfter
    },
    txOptions
  )
}

async function addBatchCounts(db, batchId, { inserted = 0, updated = 0, failed = 0 }) {
  if (!inserted && !updated && !failed) return
  await db.importBatch.increment(
    { insertedCount: inserted, updatedCount: updated, failedCount: failed },
    { where: { id: batchId } }
  )
}

// ---------------------------------------------------------------------------
// Review and undo
// ---------------------------------------------------------------------------

/**
 * Every (model, foreign key) pair that can point at a row of `Model`, taken
 * from the Sequelize associations. Used to refuse deleting an imported record
 * that something else now refers to (e.g. a beneficiary linked to a parcel).
 */
function referencesTo(db, Model) {
  const refs = new Map()
  const add = (source, foreignKey) => {
    if (!source || !foreignKey || !source.rawAttributes?.[foreignKey]) return
    refs.set(`${source.name}.${foreignKey}`, { model: source, foreignKey })
  }

  Object.values(db.models || {}).forEach((candidate) => {
    Object.values(candidate.associations || {}).forEach((assoc) => {
      if (assoc.associationType === 'BelongsTo' && assoc.target === Model) {
        add(assoc.source, assoc.foreignKey)
      }
      if ((assoc.associationType === 'HasMany' || assoc.associationType === 'HasOne') && assoc.source === Model) {
        add(assoc.target, assoc.foreignKey)
      }
      if (assoc.associationType === 'BelongsToMany' && assoc.source === Model) {
        add(assoc.through?.model, assoc.foreignKey)
      }
    })
  })

  return [...refs.values()]
}

/** Count rows referring to `recordId`. Inside an undo each count runs in a
 *  savepoint, so a bad table cannot abort the surrounding transaction. */
async function countReferences(db, refs, recordId, transaction) {
  const found = []
  for (const ref of refs) {
    try {
      const where = { [ref.foreignKey]: recordId }
      const count = transaction
        ? await db.sequelize.transaction({ transaction }, (sp) => ref.model.count({ where, transaction: sp }))
        : await ref.model.count({ where })
      if (count > 0) found.push({ model: ref.model.name, count })
    } catch (err) {
      found.push({ model: ref.model.name, count: null, error: err.message })
    }
  }
  return found
}

/** Ids of items whose record a later, not-undone batch also changed. */
async function itemsTouchedLater(db, batch, items, transaction) {
  if (!items.length) return new Map()
  const [rows] = await db.sequelize.query(
    `
      SELECT mine.id AS item_id, later.label, later."createdAt", later.id AS batch_id
        FROM import_batch_item mine
        JOIN import_batch_item other
          ON other.model = mine.model
         AND other.record_id = mine.record_id
         AND other.batch_id <> mine.batch_id
         AND other."revertedAt" IS NULL
        JOIN import_batch later
          ON later.id = other.batch_id
         AND later."createdAt" > :createdAt
       WHERE mine.batch_id = :batchId
         AND mine.id IN (:itemIds)
    `,
    {
      replacements: { batchId: batch.id, createdAt: batch.createdAt, itemIds: items.map((item) => item.id) },
      transaction
    }
  )
  const byItem = new Map()
  rows.forEach((row) => {
    if (!byItem.has(row.item_id)) byItem.set(row.item_id, row)
  })
  return byItem
}

/**
 * Decide, for each item, whether undo can safely apply.
 * state: revertable | conflict | missing (inserted row already gone) | reverted
 */
async function inspectItems(db, batch, items, { transaction, lock = false } = {}) {
  const pending = items.filter((item) => !item.revertedAt)
  const later = await itemsTouchedLater(db, batch, pending, transaction)
  const refsByModel = new Map()
  const results = []

  for (const item of items) {
    const result = { item, state: 'revertable', reason: null, current: null, references: [] }
    results.push(result)

    if (item.revertedAt) {
      result.state = 'reverted'
      continue
    }

    const Model = db.models[item.model]
    if (!Model) {
      result.state = 'conflict'
      result.reason = `The ${item.model} table no longer exists.`
      continue
    }

    const laterBatch = later.get(item.id)
    if (laterBatch) {
      result.state = 'conflict'
      result.reason = `A later import (${laterBatch.label || laterBatch.batch_id}) also changed this record. Undo that import first.`
      result.laterBatchId = laterBatch.batch_id
      continue
    }

    const current = await Model.findByPk(item.record_id, {
      transaction,
      ...(lock && transaction ? { lock: transaction.LOCK.UPDATE } : {})
    })
    result.current = current

    if (!current) {
      if (item.action === 'insert') {
        result.state = 'missing'
        result.reason = 'Already deleted.'
      } else {
        result.state = 'conflict'
        result.reason = 'The record was deleted after the import.'
      }
      continue
    }

    const fields = Object.keys(item.after || {})
    const now = snapshot(current, fields)
    const edited = fields.filter((field) => !sameValue(now[field], item.after[field]))
    if (edited.length) {
      result.state = 'conflict'
      result.reason = `Edited after the import: ${edited.join(', ')}.`
      result.editedFields = edited
      continue
    }

    if (item.action === 'insert') {
      if (!refsByModel.has(item.model)) refsByModel.set(item.model, referencesTo(db, Model))
      const refs = await countReferences(db, refsByModel.get(item.model), current.get(primaryKeyOf(Model)), transaction)
      if (refs.length) {
        result.state = 'conflict'
        result.references = refs
        result.reason = `Other records refer to it: ${refs
          .map((ref) => (ref.count == null ? `${ref.model} (could not check)` : `${ref.count} ${ref.model}`))
          .join(', ')}.`
      }
    }
  }

  return results
}

function summarize(results) {
  const counts = { revertable: 0, conflict: 0, missing: 0, reverted: 0 }
  const willDelete = results.filter((r) => r.state === 'revertable' && r.item.action === 'insert').length
  const willRestore = results.filter((r) => r.state === 'revertable' && r.item.action === 'update').length
  results.forEach((r) => {
    counts[r.state] = (counts[r.state] || 0) + 1
  })
  return { ...counts, willDelete, willRestore, total: results.length }
}

function geometryFields(Model) {
  if (!Model) return new Set()
  return new Set(
    Object.entries(Model.rawAttributes || {})
      .filter(([, attr]) => GEOMETRY_TYPES.has(attr?.type?.key))
      .map(([name]) => name)
  )
}

/** One item as the review page shows it: no geometry, just which fields changed. */
function describeItem(db, result) {
  const { item } = result
  const Model = db.models[item.model]
  const geom = geometryFields(Model)
  const after = item.after || {}
  const before = item.before || {}
  const label = after.code ?? after.name ?? after.parcel_no ?? plainRecord(result.current)?.code ?? item.record_id

  const changes = Object.keys(after)
    .filter((field) => item.action === 'update' || !geom.has(field))
    .map((field) =>
      geom.has(field)
        ? { field, geometry: true }
        : { field, before: item.action === 'update' ? before[field] : undefined, after: after[field] }
    )

  return {
    id: item.id,
    model: item.model,
    recordId: item.record_id,
    action: item.action,
    label: label == null ? item.record_id : String(label),
    state: result.state,
    reason: result.reason,
    references: result.references,
    editedFields: result.editedFields || [],
    laterBatchId: result.laterBatchId || null,
    revertedAt: item.revertedAt,
    changes: item.action === 'update' ? changes : changes.filter((c) => c.after != null)
  }
}

function describeBatch(batch) {
  const plain = plainRecord(batch)
  return {
    id: plain.id,
    model: plain.model,
    source: plain.source,
    label: plain.label,
    status: plain.status,
    insertedCount: plain.insertedCount,
    updatedCount: plain.updatedCount,
    failedCount: plain.failedCount,
    createdBy: plain.createdBy,
    createdByName: plain.createdByName,
    createdAt: plain.createdAt,
    revertedAt: plain.revertedAt,
    revertedBy: plain.revertedBy,
    revertedByName: plain.revertedByName
  }
}

async function listBatches(db, { model, status, createdBy, page = 1, limit = 25 } = {}) {
  const where = {}
  if (model) where.model = model
  if (status) where.status = status
  if (createdBy != null) where.createdBy = createdBy

  const size = Math.min(Math.max(Number(limit) || 25, 1), 100)
  const offset = (Math.max(Number(page) || 1, 1) - 1) * size

  const { rows, count } = await db.importBatch.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: size,
    offset
  })

  const ids = rows.map((row) => row.id)
  const tallies = new Map()
  if (ids.length) {
    const [tallyRows] = await db.sequelize.query(
      `
        SELECT batch_id,
               COUNT(*)::int AS items,
               COUNT(*) FILTER (WHERE "revertedAt" IS NOT NULL)::int AS reverted
          FROM import_batch_item
         WHERE batch_id IN (:ids)
         GROUP BY batch_id
      `,
      { replacements: { ids } }
    )
    tallyRows.forEach((row) => tallies.set(row.batch_id, row))
  }

  return {
    total: count,
    page: Math.max(Number(page) || 1, 1),
    limit: size,
    rows: rows.map((row) => ({
      ...describeBatch(row),
      items: tallies.get(row.id)?.items || 0,
      revertedItems: tallies.get(row.id)?.reverted || 0
    }))
  }
}

async function getBatchDetail(db, batchId) {
  const batch = await db.importBatch.findByPk(batchId)
  if (!batch) return null
  const items = await db.importBatchItem.findAll({ where: { batch_id: batch.id }, order: [['id', 'ASC']] })
  const results = await inspectItems(db, batch, items)
  return {
    batch: describeBatch(batch),
    summary: summarize(results),
    items: results.map((result) => describeItem(db, result))
  }
}

/** The geometries the import wrote, for the review map. */
async function getBatchFeatures(db, batchId) {
  const batch = await db.importBatch.findByPk(batchId)
  if (!batch) return null
  const items = await db.importBatchItem.findAll({ where: { batch_id: batch.id }, order: [['id', 'ASC']] })
  const geom = geometryFields(db.models[batch.model])
  const features = []
  items.forEach((item) => {
    const after = item.after || {}
    const field = [...geom].find((name) => after[name])
    if (!field) return
    const { crs, ...geometry } = after[field]
    features.push({
      type: 'Feature',
      geometry,
      properties: {
        itemId: item.id,
        recordId: item.record_id,
        action: item.action,
        reverted: Boolean(item.revertedAt),
        label: after.code ?? after.name ?? after.parcel_no ?? item.record_id
      }
    })
  })
  return { type: 'FeatureCollection', features }
}

/**
 * Undo a batch, or the chosen items of it, in one transaction.
 * With dryRun the same checks run and nothing is changed.
 * Conflicting items are skipped and reported; everything else is undone.
 */
async function revertBatch(db, batchId, { itemIds = null, dryRun = false, actorId = null, actorName = null, hooks = {} } = {}) {
  const transaction = await db.sequelize.transaction()
  const deleted = []
  const restored = []

  let results
  let batch
  try {
    batch = await db.importBatch.findByPk(batchId, { transaction, lock: transaction.LOCK.UPDATE })
    if (!batch) {
      await transaction.rollback()
      return { ok: false, status: 404, body: { message: 'Import not found' } }
    }

    const where = { batch_id: batch.id }
    if (Array.isArray(itemIds) && itemIds.length) where.id = itemIds.map(Number).filter(Number.isFinite)
    // Newest first, so a record touched twice by this batch unwinds in order.
    const items = await db.importBatchItem.findAll({ where, order: [['id', 'DESC']], transaction })
    results = await inspectItems(db, batch, items, { transaction, lock: true })

    if (dryRun) {
      await transaction.rollback()
      return {
        ok: true,
        status: 200,
        body: {
          dryRun: true,
          batch: describeBatch(batch),
          summary: summarize(results),
          items: results.map((result) => describeItem(db, result))
        }
      }
    }

    const now = new Date()
    for (const result of results) {
      const { item, current } = result
      if (result.state === 'revertable' && item.action === 'insert') {
        await current.destroy({ transaction })
        deleted.push({ model: item.model, id: item.record_id })
      } else if (result.state === 'revertable' && item.action === 'update') {
        await current.update(item.before || {}, { transaction })
        if (hooks.afterRestore) await hooks.afterRestore(item.model, current, item.before || {}, transaction)
        restored.push({ model: item.model, record: current })
      } else if (result.state !== 'missing') {
        continue
      }
      await item.update({ revertedAt: now }, { transaction })
      result.state = 'reverted'
    }

    const [[remaining]] = await db.sequelize.query(
      `SELECT COUNT(*)::int AS open FROM import_batch_item WHERE batch_id = :id AND "revertedAt" IS NULL`,
      { replacements: { id: batch.id }, transaction }
    )
    const anyUndone = deleted.length || restored.length || results.some((r) => r.state === 'reverted')
    if (anyUndone) {
      await batch.update(
        {
          status: remaining.open === 0 ? 'reverted' : 'partially_reverted',
          revertedAt: now,
          revertedBy: actorId,
          revertedByName: actorName
        },
        { transaction }
      )
    }

    await transaction.commit()
  } catch (err) {
    await transaction.rollback().catch(() => {})
    throw err
  }

  // Search index and similar side effects follow the committed data; a failure
  // here must not undo the undo.
  const quietly = async (fn) => {
    try {
      await fn()
    } catch (err) {
      console.error('[import-revert] follow-up step failed:', err.message)
    }
  }
  for (const entry of deleted) {
    if (hooks.afterDelete) await quietly(() => hooks.afterDelete(entry.model, entry.id))
  }
  for (const entry of restored) {
    if (hooks.afterCommitRestore) await quietly(() => hooks.afterCommitRestore(entry.model, entry.record))
  }

  return {
    ok: true,
    status: 200,
    body: {
      batch: describeBatch(batch),
      deleted: deleted.length,
      restored: restored.length,
      summary: summarize(results),
      items: results.map((result) => describeItem(db, result))
    }
  }
}

module.exports = {
  UUID_RE,
  normalize,
  sameValue,
  snapshot,
  trackedFields,
  resolveImportBatch,
  recordBatchItem,
  addBatchCounts,
  referencesTo,
  inspectItems,
  listBatches,
  getBatchDetail,
  getBatchFeatures,
  revertBatch
}
