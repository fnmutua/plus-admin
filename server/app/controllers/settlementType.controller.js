'use strict'

// Settlement types: the managed list behind every settlement type picker.
//
// Settlements store the type's label text, not its id, so this controller owns
// two responsibilities that have to stay together: keeping the list tidy, and
// keeping settlement.settlement_type in step when a label changes.

const db = require('../models')
const { Op } = require('sequelize')

const SettlementType = () => db.models.settlement_type
const Settlement = () => db.models.settlement

const fail = (res, error, message) => {
  console.error(`[settlement-types] ${message}:`, error)
  return res.status(500).json({ success: false, code: '500', message })
}

const bad = (res, message) => res.status(400).json({ success: false, code: '400', message })

/** Slug used by code that must recognise a type whatever it is called. */
const toCode = (label) =>
  String(label).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

const shape = (row, usage = {}) => ({
  id: row.id,
  label: row.type,
  code: row.code || toCode(row.type),
  description: row.description || null,
  active: row.active !== false,
  sortOrder: row.sort_order ?? 0,
  // How many settlements carry this type. Drives the delete guard and tells an
  // administrator what a rename would touch.
  settlements: usage[String(row.type).trim().toLowerCase()] || 0
})

/** Settlement counts per type label, lower-cased so casing drift still matches. */
async function usageByLabel() {
  const [rows] = await db.sequelize.query(
    `SELECT lower(trim(settlement_type)) AS label, COUNT(*)::int AS total
       FROM settlement
      WHERE settlement_type IS NOT NULL AND trim(settlement_type) <> ''
      GROUP BY 1`
  )
  return Object.fromEntries(rows.map((row) => [row.label, row.total]))
}

/**
 * List types. Pickers ask for the active ones; the management screen asks for
 * everything with `includeInactive=true`.
 */
exports.list = async (req, res) => {
  try {
    const includeInactive = String(req.query.includeInactive) === 'true'
    const rows = await SettlementType().findAll({
      where: includeInactive ? {} : { active: true },
      order: [['sort_order', 'ASC'], ['id', 'ASC']]
    })

    // Usage counts cost one grouped query, so they are only fetched for the
    // management screen rather than on every picker load.
    const usage = includeInactive ? await usageByLabel() : {}
    return res.json({ success: true, code: '0000', data: rows.map((row) => shape(row, usage)) })
  } catch (error) {
    return fail(res, error, 'Failed to list settlement types')
  }
}

exports.create = async (req, res) => {
  try {
    const label = String(req.body.label || '').trim()
    if (!label) return bad(res, 'A label is required')
    if (label.length > 100) return bad(res, 'The label is too long')

    const clash = await SettlementType().findOne({
      where: db.sequelize.where(
        db.sequelize.fn('lower', db.sequelize.fn('trim', db.sequelize.col('type'))),
        label.toLowerCase()
      )
    })
    if (clash) return bad(res, `"${label}" already exists`)

    const max = await SettlementType().max('sort_order')
    const row = await SettlementType().create({
      type: label,
      code: toCode(req.body.code || label),
      description: req.body.description || null,
      active: req.body.active !== false,
      sort_order: Number.isFinite(Number(max)) ? Number(max) + 1 : 1
    })

    return res.status(201).json({ success: true, code: '0000', message: `${label} added`, data: shape(row) })
  } catch (error) {
    return fail(res, error, 'Failed to add the settlement type')
  }
}

/**
 * Update a type. Renaming the label rewrites every settlement carrying the old
 * one, in the same transaction, because the label *is* the stored value.
 */
exports.update = async (req, res) => {
  try {
    const row = await SettlementType().findByPk(req.params.id)
    if (!row) return res.status(404).json({ success: false, code: '404', message: 'Settlement type not found' })

    const label = req.body.label === undefined ? row.type : String(req.body.label).trim()
    if (!label) return bad(res, 'A label is required')

    if (label.toLowerCase() !== String(row.type).toLowerCase()) {
      const clash = await SettlementType().findOne({
        where: {
          id: { [Op.ne]: row.id },
          [Op.and]: db.sequelize.where(
            db.sequelize.fn('lower', db.sequelize.fn('trim', db.sequelize.col('type'))),
            label.toLowerCase()
          )
        }
      })
      if (clash) return bad(res, `"${label}" already exists`)
    }

    const renamed = label !== row.type
    let moved = 0

    await db.sequelize.transaction(async (transaction) => {
      if (renamed) {
        // Postgres returns [affectedCount] here, not [count, rows].
        const [affected] = await Settlement().update(
          { settlement_type: label },
          { where: { settlement_type: row.type }, transaction }
        )
        moved = Number(affected) || 0
      }

      await row.update({
        type: label,
        code: req.body.code === undefined ? row.code : toCode(req.body.code),
        description: req.body.description === undefined ? row.description : (req.body.description || null),
        active: req.body.active === undefined ? row.active : req.body.active !== false,
        sort_order: req.body.sortOrder === undefined ? row.sort_order : Number(req.body.sortOrder) || 0
      }, { transaction })
    })

    return res.json({
      success: true,
      code: '0000',
      message: renamed && moved
        ? `${label} updated — ${moved} settlement(s) renamed`
        : `${label} updated`,
      data: shape(row, renamed ? { [label.toLowerCase()]: moved } : {})
    })
  } catch (error) {
    return fail(res, error, 'Failed to update the settlement type')
  }
}

/**
 * Delete a type. Refused while settlements still use it: clearing their type
 * is not something to do as a side effect of tidying a list, and the column is
 * NOT NULL in any case. Deactivating is the way to retire a type in use.
 */
exports.remove = async (req, res) => {
  try {
    const row = await SettlementType().findByPk(req.params.id)
    if (!row) return res.status(404).json({ success: false, code: '404', message: 'Settlement type not found' })

    const inUse = await Settlement().count({
      where: db.sequelize.where(
        db.sequelize.fn('lower', db.sequelize.fn('trim', db.sequelize.col('settlement_type'))),
        String(row.type).trim().toLowerCase()
      )
    })

    if (inUse) {
      return res.status(409).json({
        success: false,
        code: '409',
        message: `${row.type} is used by ${inUse} settlement(s). Deactivate it instead, or move those settlements to another type first.`
      })
    }

    const label = row.type
    await row.destroy()
    return res.json({ success: true, code: '0000', message: `${label} removed` })
  } catch (error) {
    return fail(res, error, 'Failed to remove the settlement type')
  }
}
