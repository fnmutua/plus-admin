'use strict'

// Parcel land-use types: the managed list behind map legends, parcel colouring,
// and the QGIS import land-use match dialog.

const db = require('../models')
const { Op } = require('sequelize')

const LanduseType = () => db.models.landuse_type
const Parcel = () => db.models.parcel

const DEFAULT_COLOR = '#CCCCCC'

const fail = (res, error, message) => {
  console.error(`[landuse-types] ${message}:`, error)
  return res.status(500).json({ success: false, code: '500', message })
}

const bad = (res, message) => res.status(400).json({ success: false, code: '400', message })

const shape = (row, usage = {}) => ({
  id: row.id,
  label: row.use,
  color: row.color || DEFAULT_COLOR,
  aliases: row.aliases || '',
  description: row.description || null,
  active: row.active !== false,
  sortOrder: row.sort_order ?? row.id ?? 0,
  parcels: usage[String(row.id)] || 0,
})

async function usageById() {
  const [rows] = await db.sequelize.query(
    `SELECT landuse_id AS id, COUNT(*)::int AS total
       FROM parcel
      WHERE landuse_id IS NOT NULL
      GROUP BY 1`
  )
  return Object.fromEntries(rows.map((row) => [String(row.id), row.total]))
}

exports.list = async (req, res) => {
  try {
    const includeInactive = String(req.query.includeInactive) === 'true'
    const rows = await LanduseType().findAll({
      where: includeInactive ? {} : { active: true },
      order: [['sort_order', 'ASC'], ['id', 'ASC']],
    })
    const usage = includeInactive ? await usageById() : {}
    return res.json({
      success: true,
      code: '0000',
      data: rows.map((row) => shape(row, usage)),
    })
  } catch (error) {
    return fail(res, error, 'Failed to list land-use types')
  }
}

exports.create = async (req, res) => {
  try {
    const label = String(req.body.label || '').trim()
    if (!label) return bad(res, 'A label is required')
    if (label.length > 100) return bad(res, 'The label is too long')

    const clash = await LanduseType().findOne({
      where: db.sequelize.where(
        db.sequelize.fn('lower', db.sequelize.fn('trim', db.sequelize.col('use'))),
        label.toLowerCase()
      ),
    })
    if (clash) return bad(res, `"${label}" already exists`)

    const maxSort = await LanduseType().max('sort_order')
    const row = await LanduseType().create({
      use: label,
      color: String(req.body.color || DEFAULT_COLOR).trim() || DEFAULT_COLOR,
      aliases: String(req.body.aliases || '').trim() || null,
      description: req.body.description || null,
      active: req.body.active !== false,
      sort_order: Number.isFinite(Number(req.body.sortOrder))
        ? Number(req.body.sortOrder)
        : (Number.isFinite(Number(maxSort)) ? Number(maxSort) + 1 : 0),
    })

    return res.status(201).json({
      success: true,
      code: '0000',
      message: `${label} added`,
      data: shape(row),
    })
  } catch (error) {
    return fail(res, error, 'Failed to add the land-use type')
  }
}

exports.update = async (req, res) => {
  try {
    const row = await LanduseType().findByPk(req.params.id)
    if (!row) {
      return res.status(404).json({ success: false, code: '404', message: 'Land-use type not found' })
    }

    const label = req.body.label === undefined ? row.use : String(req.body.label).trim()
    if (!label) return bad(res, 'A label is required')

    if (label.toLowerCase() !== String(row.use).toLowerCase()) {
      const clash = await LanduseType().findOne({
        where: {
          id: { [Op.ne]: row.id },
          [Op.and]: db.sequelize.where(
            db.sequelize.fn('lower', db.sequelize.fn('trim', db.sequelize.col('use'))),
            label.toLowerCase()
          ),
        },
      })
      if (clash) return bad(res, `"${label}" already exists`)
    }

    row.use = label
    if (req.body.color !== undefined) {
      row.color = String(req.body.color || '').trim() || DEFAULT_COLOR
    }
    if (req.body.aliases !== undefined) {
      row.aliases = String(req.body.aliases || '').trim() || null
    }
    if (req.body.description !== undefined) {
      row.description = req.body.description || null
    }
    if (req.body.active !== undefined) {
      row.active = Boolean(req.body.active)
    }
    if (req.body.sortOrder !== undefined && Number.isFinite(Number(req.body.sortOrder))) {
      row.sort_order = Number(req.body.sortOrder)
    }
    await row.save()

    const usage = await usageById()
    return res.json({
      success: true,
      code: '0000',
      message: `${label} updated`,
      data: shape(row, usage),
    })
  } catch (error) {
    return fail(res, error, 'Failed to update the land-use type')
  }
}

exports.remove = async (req, res) => {
  try {
    const row = await LanduseType().findByPk(req.params.id)
    if (!row) {
      return res.status(404).json({ success: false, code: '404', message: 'Land-use type not found' })
    }

    const used = await Parcel().count({ where: { landuse_id: row.id } })
    if (used > 0) {
      return res.status(409).json({
        success: false,
        code: '409',
        message: `"${row.use}" is used by ${used} parcel(s). Deactivate it instead.`,
      })
    }

    await row.destroy()
    return res.json({ success: true, code: '0000', message: `${row.use} removed`, data: null })
  } catch (error) {
    return fail(res, error, 'Failed to remove the land-use type')
  }
}
