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

// Integer period columns (year, etc.) — cannot use AT TIME ZONE / TO_CHAR timestamp ops
const INTEGER_TIME_FIELDS = new Set(['year', 'month', 'quarter', 'period'])

function timeFieldBare(name) {
  return String(name || 'createdAt').split('.').pop()
}

/** SQL expression + result alias for a chart time axis column. */
function buildTimeAxis(timeFieldName) {
  const bare = timeFieldBare(timeFieldName)
  const col  = safeCol(timeFieldName || 'createdAt')
  if (INTEGER_TIME_FIELDS.has(bare)) {
    return { expr: `CAST(${col} AS TEXT)`, alias: bare }
  }
  return { expr: `TO_CHAR(${col} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`, alias: 'to_char' }
}

function rowTimeValue(row, alias) {
  if (!row) return ''
  if (row[alias] != null) return String(row[alias])
  if (row.to_char != null) return String(row.to_char)
  return String(row[Object.keys(row).find(k => k !== 'agg_value') || ''] || '')
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
    eq:    '=',    ne:    '!=',    neq:   '!=',
    gt:    '>',    gte:   '>=',
    lt:    '<',    lte:   '<=',
    like:  'LIKE', iLike: 'ILIKE',
  }

  if (Array.isArray(filters)) {
    // Group eq/neq filters by field so that multiple eq rows on the same field
    // become IN (...) instead of field='A' AND field='B' (always false).
    const eqGroups  = new Map() // field → [non-null values]
    const neqGroups = new Map() // field → true (IS NOT NULL already covers all neq-null rows)

    for (const f of filters) {
      if (!f.field || !f.operation || f.operation === 'all') continue
      const col  = safeCol(f.field)
      const vals = (Array.isArray(f.value) ? f.value : [f.value]).filter(v => v !== undefined)

      if (f.operation === 'is_null') {
        parts.push(`${col} IS NULL`)
      } else if (f.operation === 'is_not_null') {
        parts.push(`${col} IS NOT NULL`)
      } else if (f.operation === 'in' || f.operation === 'not_in') {
        if (!vals.length) continue
        const keys = vals.map((v) => { const k = `f${++idx}`; bind[k] = v; return `:${k}` })
        parts.push(`${col} ${f.operation === 'in' ? 'IN' : 'NOT IN'} (${keys.join(',')})`)
      } else if (f.operation === 'contains' || f.operation === 'not_contains' ||
                 f.operation === 'starts_with' || f.operation === 'ends_with') {
        const raw = vals[0]
        if (raw === null || raw === undefined || raw === '') continue
        const k = `f${++idx}`
        if (f.operation === 'contains')          { bind[k] = `%${raw}%`; parts.push(`${col} ILIKE :${k}`) }
        else if (f.operation === 'not_contains') { bind[k] = `%${raw}%`; parts.push(`${col} NOT ILIKE :${k}`) }
        else if (f.operation === 'starts_with')  { bind[k] = `${raw}%`;  parts.push(`${col} ILIKE :${k}`) }
        else if (f.operation === 'ends_with')    { bind[k] = `%${raw}`;  parts.push(`${col} ILIKE :${k}`) }
      } else if (f.operation === 'eq') {
        const val = vals[0]
        if (val === null || val === undefined || val === '') {
          parts.push(`${col} IS NULL`)
        } else {
          if (!eqGroups.has(f.field)) eqGroups.set(f.field, [])
          eqGroups.get(f.field).push(val)
        }
      } else if (f.operation === 'neq' || f.operation === 'ne') {
        const val = vals[0]
        if (val === null || val === undefined || val === '') {
          // neq null → IS NOT NULL; deduplicate per field
          if (!neqGroups.has(f.field)) { neqGroups.set(f.field, true); parts.push(`${col} IS NOT NULL`) }
        } else {
          const k = `f${++idx}`; bind[k] = val
          parts.push(`${col} != :${k}`)
        }
      } else if (opSql[f.operation]) {
        const val = vals[0]
        if (val !== null && val !== undefined && val !== '') {
          const k = `f${++idx}`; bind[k] = val
          parts.push(`${col} ${opSql[f.operation]} :${k}`)
        }
      }
    }

    // Emit grouped eq conditions: 1 value → =, multiple → IN (OR semantics)
    for (const [field, values] of eqGroups) {
      const col = safeCol(field)
      if (values.length === 1) {
        const k = `f${++idx}`; bind[k] = values[0]
        parts.push(`${col} = :${k}`)
      } else {
        const keys = values.map(v => { const k = `f${++idx}`; bind[k] = v; return `:${k}` })
        parts.push(`${col} IN (${keys.join(',')})`)
      }
    }
  }

  return { clause: parts.length ? `WHERE ${parts.join(' AND ')}` : '', bind }
}

/** Rewrite WHERE clause table qualifier to a SQL alias (e.g. "settlement" → t). */
function qualifyClauseForAlias(clause, tbl, alias = 't') {
  if (!clause) return ''
  return clause.replace(new RegExp(`"${tbl}"`, 'g'), alias)
}

/** Y-axis column with table alias. */
function yColAliased(field, tbl, alias = 't') {
  if (!field || field === 'id') return `${alias}.id`
  const bare = String(field).split('.').pop()
  return `${alias}."${bare}"`
}

async function modelHasColumn(tbl, col) {
  if (db.models[tbl]?.rawAttributes?.[col]) return true
  const r = await sequelize.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2 LIMIT 1`,
    { bind: [tbl, col], type: QueryTypes.SELECT },
  ).catch(() => [])
  return r.length > 0
}

/** Pick map geo aggregation level from active filters + model columns. */
async function resolveMapGeoLevel(filters, tbl) {
  const admin = resolveAdminLevel(filters)
  if (admin === 'ward' && await modelHasColumn(tbl, 'ward_id')) return 'ward'
  if (admin === 'subcounty' && await modelHasColumn(tbl, 'subcounty_id')) return 'subcounty'
  if (admin === 'ward' && await modelHasColumn(tbl, 'subcounty_id')) return 'subcounty'
  return 'county'
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
// Treemap (11) capped to TREEMAP_SLICE_LIMIT tiles — large GROUP BY sets hang the browser.
const TREEMAP_SLICE_LIMIT = 40
const PIE_SLICE_LIMIT     = 100

async function pieChart(body) {
  const { model, x_axis, y_axis, filters, ignore_empty, chart_type } = body
  const chartType = Number(chart_type)
  const tbl  = safeModel(model)
  const xBare = String(x_axis?.field || '').split('.').pop()

  if (chartType === 11 && (!x_axis?.field || xBare === 'id')) {
    throw new Error('Word Map requires a category field (not id) — e.g. county.name, gender')
  }

  const { joinSql, xExpr, xAlias } = resolveVirtualField(x_axis.field, tbl, filters)
  const yCol = safeCol(y_axis.field === 'id' ? `${tbl}.id` : y_axis.field)
  const yAgg = safeAgg(y_axis.aggregation)
  const yFieldForWhere = y_axis.field === 'id' ? `${tbl}.id` : y_axis.field

  const { clause, bind } = buildWhere(filters, ignore_empty !== false, yFieldForWhere)

  const sqlLimit = chartType === 11 ? TREEMAP_SLICE_LIMIT : (chartType === 3 || chartType === 10 ? PIE_SLICE_LIMIT : null)
  const limitSql = sqlLimit ? ` LIMIT ${sqlLimit}` : ''

  const sql = `
    SELECT ${xExpr}, ${yAgg}(${yCol}) AS agg_value
    FROM   "${tbl}"
    ${joinSql}
    ${clause}
    GROUP  BY ${xExpr}
    ORDER  BY agg_value DESC
    ${limitSql}
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
  const { expr: timeExpr, alias: timeAlias } = buildTimeAxis(time_field || 'createdAt')
  const yCol     = safeCol(y_axis.field === 'id' ? `${tbl}.id` : y_axis.field)
  const yAgg     = safeAgg(y_axis.aggregation)
  const yLabel   = y_axis.label || yAgg.toLowerCase()
  const yFieldForWhere = y_axis.field === 'id' ? `${tbl}.id` : y_axis.field

  // series_field may be a virtual field like county.name
  const serResolved = series_field?.field ? resolveVirtualField(series_field.field, tbl, filters) : null
  const sCol        = serResolved?.xExpr || null
  const sJoinSql    = serResolved?.joinSql || ''
  const sField      = serResolved?.xAlias || null

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
    const categories = rows.map(r => rowTimeValue(r, timeAlias))
    const data       = rows.map(r => parseFloat(r.agg_value) || 0)
    return { categories, series: [{ name: yLabel, data }] }
  }

  // Pivot by series
  const dates   = [...new Set(rows.map(r => rowTimeValue(r, timeAlias)))]
  const serMap  = new Map()

  for (const row of rows) {
    const d    = rowTimeValue(row, timeAlias)
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
// Groups by county / subcounty / ward name depending on active geo filters.
// categories = [min, max], series = [{name, value}]
async function mapChart(body) {
  const { model, y_axis, filters, ignore_empty } = body
  const tbl   = safeModel(model)
  const yField = y_axis?.field || 'id'
  const yAgg  = safeAgg(y_axis?.aggregation || 'count')
  const yFieldForWhere = yField === 'id' ? `${tbl}.id` : yField

  const { clause, bind } = buildWhere(filters, ignore_empty !== false, yFieldForWhere)
  const geoLevel = await resolveMapGeoLevel(filters, tbl)

  let joinSql, groupExpr
  if (geoLevel === 'ward') {
    joinSql   = `JOIN ward w ON w.id = t.ward_id`
    groupExpr = 'w.name'
  } else if (geoLevel === 'subcounty') {
    joinSql   = `JOIN subcounty sc ON sc.id = t.subcounty_id`
    groupExpr = 'sc.name'
  } else if (await modelHasColumn(tbl, 'county_id')) {
    joinSql   = `JOIN county c ON c.id = t.county_id`
    groupExpr = 'c.name'
  } else {
    joinSql   = ''
    groupExpr = 't.county_id::text'
  }

  const whereSql = qualifyClauseForAlias(clause, tbl, 't')
  const yCol     = yColAliased(yField, tbl, 't')

  const sql = `
    SELECT ${groupExpr} AS name, ${yAgg}(${yCol}) AS agg_value
    FROM   "${tbl}" t
    ${joinSql}
    ${whereSql}
    GROUP  BY ${groupExpr}
    ORDER  BY agg_value DESC
  `

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

  const { expr: timeExpr, alias: periodAlias } = buildTimeAxis(time_field || 'createdAt')

  const metricSelects = metrics.map(m => `SUM(${safeCol(m)}) AS ${m.replace(/\./g, '_')}`).join(',\n    ')
  const { clause, bind } = buildWhere(filters, false)

  const sql = `
    SELECT ${timeExpr} AS ${periodAlias}, ${metricSelects}
    FROM   "${tbl}"
    ${clause}
    GROUP  BY ${timeExpr}
    ORDER  BY 1
  `
  const rows = await sequelize.query(sql, { type: QueryTypes.SELECT, replacements: bind })
  const categories = rows.map(r => rowTimeValue(r, periodAlias))

  const series = metrics.map(m => {
    const alias = m.replace(/\./g, '_')
    return {
      name: m.split('.').pop(),
      data: rows.map(r => parseFloat(r[alias]) || 0),
    }
  })

  return { categories, series }
}

// ─── 7. SCATTER — type 13 ────────────────────────────────────────────────────
// Returns raw (x, y) pairs per record. Optional series field splits into colour groups.
// series = [{name, data: [{x, y}]}]
async function scatterChart(body) {
  const { model, x_axis, y_axis, series_field, filters, ignore_empty } = body
  const tbl  = safeModel(model)
  const xCol = safeCol(x_axis?.field || 'id')
  const yCol = safeCol(y_axis?.field || 'id')

  const { clause, bind } = buildWhere(filters, ignore_empty !== false)
  const nullCheck   = `${xCol} IS NOT NULL AND ${yCol} IS NOT NULL`
  const whereClause = clause ? `${clause} AND ${nullCheck}` : `WHERE ${nullCheck}`

  if (series_field?.field) {
    const sCol = safeCol(series_field.field)
    const sql = `
      SELECT ${xCol} AS x_val, ${yCol} AS y_val, ${sCol}::text AS series_val
      FROM   "${tbl}"
      ${whereClause}
      ORDER  BY series_val, x_val
      LIMIT  3000
    `
    const rows = await sequelize.query(sql, { type: QueryTypes.SELECT, replacements: bind })
    const groups = new Map()
    for (const row of rows) {
      const s = row.series_val ?? 'Other'
      if (!groups.has(s)) groups.set(s, [])
      groups.get(s).push({ x: Number(row.x_val), y: Number(row.y_val) })
    }
    return { categories: [], series: [...groups.entries()].map(([name, data]) => ({ name, data })) }
  }

  const sql = `
    SELECT ${xCol} AS x_val, ${yCol} AS y_val
    FROM   "${tbl}"
    ${whereClause}
    ORDER  BY x_val
    LIMIT  3000
  `
  const rows = await sequelize.query(sql, { type: QueryTypes.SELECT, replacements: bind })
  const label = y_axis?.label || String(y_axis?.field || 'value')
  return {
    categories: [],
    series: [{ name: label, data: rows.map(r => ({ x: Number(r.x_val), y: Number(r.y_val) })) }],
  }
}

// ─── 8. GAUGE — type 15 ──────────────────────────────────────────────────────
// Returns the filtered count/sum as a percentage of the unfiltered total.
// categories = [label], series = [percentage 0-100], meta = { value, total }
async function gaugeChart(body) {
  const { model, y_axis, filters, ignore_empty } = body
  const tbl   = safeModel(model)
  const yField = y_axis?.field || 'id'
  const yAgg  = safeAgg(y_axis?.aggregation || 'count')
  const yCol  = yField === 'id' ? `"${tbl}".id` : safeCol(yField)
  const label = y_axis?.label || yAgg

  const { clause, bind } = buildWhere(filters, ignore_empty !== false, yField === 'id' ? `${tbl}.id` : yField)

  const filteredSql = `SELECT ${yAgg}(${yCol}) AS agg_value FROM "${tbl}" ${clause}`
  const totalSql    = `SELECT ${yAgg}(${yCol}) AS agg_value FROM "${tbl}"`

  const [filteredRows, totalRows] = await Promise.all([
    sequelize.query(filteredSql, { type: QueryTypes.SELECT, replacements: bind }),
    sequelize.query(totalSql,    { type: QueryTypes.SELECT }),
  ])

  const value   = parseFloat(filteredRows[0]?.agg_value) || 0
  const total   = parseFloat(totalRows[0]?.agg_value)    || 1
  const pct     = Math.min(100, Math.round((value / total) * 100))

  return { categories: [label], series: [pct], meta: { value, total } }
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────
const BAR_TYPES     = new Set([1, 2, 4, 6, 9, 14])
const PIE_TYPES     = new Set([3, 10, 11])
const LINE_TYPES    = new Set([5])
const MAP_TYPES     = new Set([7])
const PYR_TYPES     = new Set([8])
const MLINE_TYPES   = new Set([12])
const SCATTER_TYPES = new Set([13])
const GAUGE_TYPES   = new Set([15])

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
    else if (SCATTER_TYPES.has(chartType)) result = await scatterChart(body)
    else if (GAUGE_TYPES.has(chartType)) result = await gaugeChart(body)
    else result = await barChart(body) // safe fallback

    return res.status(200).send({ ...result, code: '0000' })
  } catch (err) {
    console.error('renderChart error:', err.message)
    return res.status(500).send({ message: err.message, code: '5000' })
  }
}
