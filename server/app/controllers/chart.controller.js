/* eslint-disable prettier/prettier */
/**
 * Per-chart-type data controllers.
 * Each function runs the minimal SQL for that chart's needs and returns
 * { categories: string[], series: [{name, data}]|[{name, value}], code: '0000' }.
 *
 * POST /api/v1/chart/render — single dispatcher entry point.
 */

const db      = require('../models')
const config  = require('../config/db.config.js')
const Sequelize = require('sequelize')
const { QueryTypes, Op: op } = Sequelize

const sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
  host: config.HOST, port: config.PORT, dialect: config.dialect,
  operatorsAliases: false,
  pool: { max: config.pool.max, min: config.pool.min, acquire: config.pool.acquire, idle: config.pool.idle },
  logging: false,
})

// ─── Field safety ─────────────────────────────────────────────────────────────
// Only allow: word chars and a single dot (table.field)
const SAFE_FIELD = /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?$/

// Detect admin level from filters: subcounty_id → ward, county_id → subcounty, else county
// Handles both bare 'county_id' and qualified 'households.county_id' field names.
function resolveAdminLevel(filters) {
  if (!Array.isArray(filters)) return 'county'
  const has = (suffix) => filters.some(f => f.field === suffix || String(f.field || '').endsWith('.' + suffix))
  if (has('subcounty_id')) return 'ward'
  if (has('county_id'))    return 'subcounty'
  return 'county'
}

// Resolve a virtual field name like 'county.name' into a JOIN + SQL expression.
// When filters include county_id/subcounty_id, automatically drills down to subcounty/ward.
// Returns { joinSql, xExpr, xAlias } ready to drop into any SELECT.
function resolveVirtualField(field, tbl, filters) {
  if (field === 'county.name') {
    const level = resolveAdminLevel(filters)
    if (level === 'ward') {
      return {
        joinSql: `JOIN ward w ON w.id = "${tbl}".ward_id`,
        xExpr:   'w.name',
        xAlias:  'name',
      }
    }
    if (level === 'subcounty') {
      return {
        joinSql: `JOIN subcounty sc ON sc.id = "${tbl}".subcounty_id`,
        xExpr:   'sc.name',
        xAlias:  'name',
      }
    }
    return {
      joinSql: `JOIN county c ON c.id = "${tbl}".county_id`,
      xExpr:   'c.name',
      xAlias:  'name',
    }
  }
  return { joinSql: '', xExpr: safeCol(field), xAlias: field.split('.').pop() }
}

function safeCol(name) {
  if (!name || !SAFE_FIELD.test(String(name))) throw new Error(`Unsafe column name: ${name}`)
  return String(name).split('.').map(p => `"${p}"`).join('.')
}

function safeAgg(fn) {
  const allowed = ['count', 'sum', 'avg', 'min', 'max']
  const f = (fn || 'count').toLowerCase()
  if (!allowed.includes(f)) throw new Error(`Unknown aggregation: ${fn}`)
  return f.toUpperCase()
}

function safeModel(name) {
  if (!name || !db.models[name]) throw new Error(`Unknown model: ${name}`)
  return name
}

// ─── WHERE clause builder ─────────────────────────────────────────────────────
function buildWhere(filters, ignoreEmpty, yField) {
  const parts = []
  const bind  = {}
  let   idx   = 0

  if (ignoreEmpty && yField) {
    parts.push(`${safeCol(yField)} IS NOT NULL`)
  }

  const opSql = {
    eq:    '=',    ne:    '!=',
    gt:    '>',    gte:   '>=',
    lt:    '<',    lte:   '<=',
    like:  'LIKE', iLike: 'ILIKE',
  }

  if (Array.isArray(filters)) {
    for (const f of filters) {
      if (!f.field || !f.operation || f.operation === 'all') continue
      const col = safeCol(f.field)
      const vals = Array.isArray(f.value) ? f.value : [f.value]

      if (f.operation === 'in' || f.operation === 'notIn') {
        const keys = vals.map((v) => { const k = `f${++idx}`; bind[k] = v; return `:${k}` })
        parts.push(`${col} ${f.operation === 'in' ? 'IN' : 'NOT IN'} (${keys.join(',')})`)
      } else if (opSql[f.operation]) {
        const k = `f${++idx}`; bind[k] = vals[0]
        parts.push(`${col} ${opSql[f.operation]} :${k}`)
      }
    }
  }

  return {
    clause: parts.length ? `WHERE ${parts.join(' AND ')}` : '',
    bind,
  }
}

// ─── 1. BAR — types 1, 2, 4, 6, 9 ───────────────────────────────────────────
// GROUP BY x_axis [, series_field], AGG(y_axis)
// Returns: { categories, series: [{name, data}] }
async function barChart(body) {
  const { model, x_axis, y_axis, series_field, filters, ignore_empty } = body
  const tbl    = safeModel(model)
  const { joinSql, xExpr, xAlias } = resolveVirtualField(x_axis.field, tbl, filters)
  const yCol   = safeCol(y_axis.field === 'id' ? `${tbl}.id` : y_axis.field)
  const yAgg   = safeAgg(y_axis.aggregation)
  const sCol   = series_field?.field ? safeCol(series_field.field) : null
  const yLabel = y_axis.label || yAgg.toLowerCase()
  const yFieldForWhere = y_axis.field === 'id' ? `${tbl}.id` : y_axis.field

  const { clause, bind } = buildWhere(filters, ignore_empty !== false, yFieldForWhere)

  const groupCols = sCol ? `${xExpr}, ${sCol}` : xExpr
  const sql = `
    SELECT ${groupCols}, ${yAgg}(${yCol}) AS agg_value
    FROM   "${tbl}"
    ${joinSql}
    ${clause}
    GROUP  BY ${groupCols}
    ORDER  BY agg_value DESC
  `

  const rows = await sequelize.query(sql, { type: QueryTypes.SELECT, replacements: bind })

  const xField = xAlias
  const sField = series_field?.field?.split('.').pop()

  if (!sCol) {
    const categories = rows.map(r => r[xField] != null ? String(r[xField]) : '(empty)')
    const data       = rows.map(r => parseFloat(r.agg_value) || 0)
    return { categories, series: [{ name: yLabel, data }] }
  }

  // Pivot
  const catOrder = []
  const catSet   = new Map()
  const serMap   = new Map()

  for (const row of rows) {
    const xVal = row[xField] != null ? String(row[xField]) : '(empty)'
    const sVal = row[sField] != null ? String(row[sField]) : '(other)'
    const val  = parseFloat(row.agg_value) || 0
    if (!catSet.has(xVal)) { catSet.set(xVal, catOrder.length); catOrder.push(xVal) }
    if (!serMap.has(sVal)) serMap.set(sVal, new Map())
    serMap.get(sVal).set(xVal, (serMap.get(sVal).get(xVal) || 0) + val)
  }

  const series = [...serMap.entries()].map(([name, byX]) => ({
    name,
    data: catOrder.map(c => byX.get(c) || 0),
  }))

  return { categories: catOrder, series }
}

// ─── 2. PIE / DONUT / TREEMAP — types 3, 10, 11 ─────────────────────────────
// GROUP BY x_axis, AGG(y_axis)
// Returns: { categories, series: [{ name: 'value', data: [n] }] }
// The frontend for pie extracts series[0].data as the numeric values array.
async function pieChart(body) {
  const { model, x_axis, y_axis, filters, ignore_empty } = body
  const tbl  = safeModel(model)
  const { joinSql, xExpr, xAlias } = resolveVirtualField(x_axis.field, tbl, filters)
  const yCol = safeCol(y_axis.field === 'id' ? `${tbl}.id` : y_axis.field)
  const yAgg = safeAgg(y_axis.aggregation)
  const yFieldForWhere = y_axis.field === 'id' ? `${tbl}.id` : y_axis.field

  const { clause, bind } = buildWhere(filters, ignore_empty !== false, yFieldForWhere)

  const sql = `
    SELECT ${xExpr}, ${yAgg}(${yCol}) AS agg_value
    FROM   "${tbl}"
    ${joinSql}
    ${clause}
    GROUP  BY ${xExpr}
    ORDER  BY agg_value DESC
  `
  const rows = await sequelize.query(sql, { type: QueryTypes.SELECT, replacements: bind })
  const xField = xAlias

  const categories = rows.map(r => r[xField] != null ? String(r[xField]) : '(empty)')
  const data       = rows.map(r => parseFloat(r.agg_value) || 0)
  return { categories, series: [{ name: 'value', data }] }
}

// ─── 3. LINE — type 5 ─────────────────────────────────────────────────────────
// GROUP BY time_field [, series_field], AGG(y_axis) ORDER BY time_field
// Returns: { categories: [dates], series: [{name, data}] }
async function lineChart(body) {
  const { model, time_field, y_axis, series_field, filters, ignore_empty } = body
  const tbl      = safeModel(model)
  const timeCol  = safeCol(time_field || 'createdAt')
  const yCol     = safeCol(y_axis.field === 'id' ? `${tbl}.id` : y_axis.field)
  const yAgg     = safeAgg(y_axis.aggregation)
  const yLabel   = y_axis.label || yAgg.toLowerCase()
  const yFieldForWhere = y_axis.field === 'id' ? `${tbl}.id` : y_axis.field

  // series_field may be a virtual field like county.name
  const serResolved = series_field?.field ? resolveVirtualField(series_field.field, tbl, filters) : null
  const sCol        = serResolved?.xExpr || null
  const sJoinSql    = serResolved?.joinSql || ''
  const sField      = serResolved?.xAlias || null

  const timeExpr = `TO_CHAR(${timeCol} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`

  const { clause, bind } = buildWhere(filters, ignore_empty !== false, yFieldForWhere)

  const groupCols = sCol ? `${timeExpr}, ${sCol}` : timeExpr

  const sql = `
    SELECT ${groupCols}, ${yAgg}(${yCol}) AS agg_value
    FROM   "${tbl}"
    ${sJoinSql}
    ${clause}
    GROUP  BY ${groupCols}
    ORDER  BY 1
  `
  const rows = await sequelize.query(sql, { type: QueryTypes.SELECT, replacements: bind })

  if (!sCol) {
    const categories = rows.map(r => String(r.to_char || r[Object.keys(r)[0]] || ''))
    const data       = rows.map(r => parseFloat(r.agg_value) || 0)
    return { categories, series: [{ name: yLabel, data }] }
  }

  // Pivot by series
  const dateKey = 'to_char'
  const dates   = [...new Set(rows.map(r => String(r[dateKey] || '')))]
  const serMap  = new Map()

  for (const row of rows) {
    const d    = String(row[dateKey] || '')
    const sVal = row[sField] != null ? String(row[sField]) : '(other)'
    const val  = parseFloat(row.agg_value) || 0
    if (!serMap.has(sVal)) serMap.set(sVal, new Map())
    serMap.get(sVal).set(d, (serMap.get(sVal).get(d) || 0) + val)
  }

  const series = [...serMap.entries()].map(([name, byD]) => ({
    name,
    data: dates.map(d => byD.get(d) || 0),
  }))

  return { categories: dates, series }
}

// ─── 4. MAP — type 7 ──────────────────────────────────────────────────────────
// Joins county, GROUP BY county name. Returns min/max for color scale + data.
// categories = [min, max], series = [{name: countyName, value: n}]
async function mapChart(body) {
  const { model, y_axis, filters, ignore_empty } = body
  const tbl   = safeModel(model)
  const yCol  = safeCol(y_axis?.field === 'id' ? `${tbl}.id` : (y_axis?.field || `${tbl}.id`))
  const yAgg  = safeAgg(y_axis?.aggregation || 'count')

  const { clause, bind } = buildWhere(filters, ignore_empty !== false, y_axis?.field)

  // Try joining county if model has county_id
  let sql
  const hasCountyId = db.models[tbl]?.rawAttributes?.county_id ||
    await sequelize.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name='county_id' LIMIT 1`,
      { bind: [tbl], type: QueryTypes.SELECT }
    ).then(r => r.length > 0).catch(() => false)

  if (hasCountyId) {
    sql = `
      SELECT c.name, ${yAgg}(${yCol}) AS agg_value
      FROM   "${tbl}" t
      JOIN   county c ON c.id = t.county_id
      ${clause.replace('WHERE', 'WHERE t.')}
      GROUP  BY c.name
      ORDER  BY agg_value DESC
    `
  } else {
    // Fallback: just count by county_id
    sql = `
      SELECT county_id::text AS name, ${yAgg}(${yCol}) AS agg_value
      FROM   "${tbl}"
      ${clause}
      GROUP  BY county_id
      ORDER  BY agg_value DESC
    `
  }

  const rows = await sequelize.query(sql, { type: QueryTypes.SELECT, replacements: bind })
  const data = rows.map(r => ({ name: String(r.name || ''), value: parseFloat(r.agg_value) || 0 }))
  const vals = data.map(d => d.value)
  const min  = vals.length ? Math.min(...vals) : 0
  const max  = vals.length ? Math.max(...vals) : 0

  return { categories: [min, max], series: data }
}

// ─── 5. POPULATION PYRAMID — type 8 ──────────────────────────────────────────
// Fixed query on households — no user config.
// Returns categories = age groups, series = [{name:'Male', data}, {name:'Female', data}]
async function pyramidChart() {
  const sql = `
    SELECT
      COALESCE(age_group, 'Unknown') AS age_group,
      COALESCE(gender,    'Unknown') AS gender,
      COUNT(*)                       AS agg_value
    FROM   households
    WHERE  age_group IS NOT NULL AND gender IS NOT NULL
    GROUP  BY age_group, gender
    ORDER  BY age_group
  `
  const rows = await sequelize.query(sql, { type: QueryTypes.SELECT })

  const ageGroups = [...new Set(rows.map(r => r.age_group))]
  const maleData   = ageGroups.map(ag => {
    const r = rows.find(x => x.age_group === ag && /male|m/i.test(x.gender) && !/female/i.test(x.gender))
    return r ? -Math.abs(parseFloat(r.agg_value)) : 0
  })
  const femaleData = ageGroups.map(ag => {
    const r = rows.find(x => x.age_group === ag && /female|f/i.test(x.gender))
    return r ? parseFloat(r.agg_value) : 0
  })

  return {
    categories: ageGroups,
    series: [
      { name: 'Male',   data: maleData },
      { name: 'Female', data: femaleData },
    ],
  }
}

// ─── 6. MULTI-VARIABLE LINE — type 12 ────────────────────────────────────────
// Multiple numeric metrics over time.
// Returns categories = [dates], series = [{name: metric, data: [number]}]
async function multiLineChart(body) {
  const { model, time_field, metric_fields, filters, ignore_empty } = body
  const tbl     = safeModel(model)
  const metrics = (Array.isArray(metric_fields) ? metric_fields : []).filter(Boolean)
  if (!metrics.length) return { categories: [], series: [] }

  const timeCol = safeCol(time_field || 'createdAt')
  const timeExpr = `TO_CHAR(${timeCol} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`

  const metricSelects = metrics.map(m => `SUM(${safeCol(m)}) AS ${m.replace(/\./g, '_')}`).join(',\n    ')
  const { clause, bind } = buildWhere(filters, false)

  const sql = `
    SELECT ${timeExpr} AS period, ${metricSelects}
    FROM   "${tbl}"
    ${clause}
    GROUP  BY ${timeExpr}
    ORDER  BY 1
  `
  const rows = await sequelize.query(sql, { type: QueryTypes.SELECT, replacements: bind })
  const categories = rows.map(r => String(r.period || ''))

  const series = metrics.map(m => {
    const alias = m.replace(/\./g, '_')
    return {
      name: m.split('.').pop(),
      data: rows.map(r => parseFloat(r[alias]) || 0),
    }
  })

  return { categories, series }
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────
const BAR_TYPES   = new Set([1, 2, 4, 6, 9])
const PIE_TYPES   = new Set([3, 10, 11])
const LINE_TYPES  = new Set([5])
const MAP_TYPES   = new Set([7])
const PYR_TYPES   = new Set([8])
const MLINE_TYPES = new Set([12])

exports.renderChart = async (req, res) => {
  try {
    const body      = req.body
    const chartType = Number(body.chart_type)

    if (!chartType) return res.status(400).send({ message: 'chart_type is required', code: '4001' })

    let result
    if (BAR_TYPES.has(chartType))   result = await barChart(body)
    else if (PIE_TYPES.has(chartType))  result = await pieChart(body)
    else if (LINE_TYPES.has(chartType)) result = await lineChart(body)
    else if (MAP_TYPES.has(chartType))  result = await mapChart(body)
    else if (PYR_TYPES.has(chartType))  result = await pyramidChart()
    else if (MLINE_TYPES.has(chartType)) result = await multiLineChart(body)
    else result = await barChart(body) // safe fallback

    return res.status(200).send({ ...result, code: '0000' })
  } catch (err) {
    console.error('renderChart error:', err.message)
    return res.status(500).send({ message: err.message, code: '5000' })
  }
}
