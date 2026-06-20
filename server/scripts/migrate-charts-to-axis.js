/**
 * Finalize dashboard_section_chart axis migration and drop legacy columns.
 *
 * Run from project root:
 *   node server/scripts/migrate-charts-to-axis.js
 *   node server/scripts/migrate-charts-to-axis.js --force     # re-derive axis from legacy fields
 *   node server/scripts/migrate-charts-to-axis.js --dry-run   # preview only
 *
 * Per chart type (Status category):
 *   Pie / Donut / Treemap (3, 10, 11)
 *     x_axis       ← card_model_field (slice / tile field)
 *     y_axis       ← { field: 'id', aggregation }
 *
 *   Bar / Stacked (1, 2, 4, 9)
 *     categorized=true  → x_axis ← card_model_field, y_axis ← count of id
 *     categorized=false → x_axis ← county.name, y_axis ← { field: card_model_field, aggregation }
 *
 *   Line (5)   → x_axis null, y_axis ← { field: card_model_field || 'id', aggregation }
 *   Map (7)    → x_axis null, y_axis ← { field: card_model_field || 'id', aggregation }
 *   Pyramid (8) → skip (fixed query)
 *   Multi-line (12) → skip (uses metric_fields + time_field)
 *
 * Intervention charts: clear axis config (indicator path does not use /chart/render).
 *
 * After migrating, drops legacy columns:
 *   aggregation, card_model_field, categorized,
 *   filter_field, filter_function, filter_value, filter_option
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })

const db = require('../app/models')

const FORCE   = process.argv.includes('--force')
const DRY_RUN = process.argv.includes('--dry-run')

const GEO_X = { field: 'county.name', label: 'County / Sub-county / Ward (auto)' }

const SLICE_TYPES = new Set([3, 10, 11])
const BAR_TYPES   = new Set([1, 2, 4, 9])

const normAgg = (a) => (a || 'count').toLowerCase()

const labelFor = (field) => field

/** Infer axis config from legacy flat fields (correct semantics). */
function deriveAxisFromLegacy(chart) {
  const type = Number(chart.type)
  const agg  = normAgg(chart.aggregation)
  const field = chart.card_model_field || null
  const categorized = !!chart.categorized

  if (type === 8) return null
  if (type === 12) return { x_axis: null, y_axis: null, series_field: null }

  if (chart.category === 'Intervention') {
    return { x_axis: null, y_axis: null, series_field: null }
  }

  let x_axis = null
  let y_axis = null
  let series_field = null

  if (type === 7 || type === 5) {
    const yField = field && field !== 'id' ? field : 'id'
    y_axis = { field: yField, aggregation: agg, label: agg }
    return { x_axis: null, y_axis, series_field: null }
  }

  if (SLICE_TYPES.has(type)) {
    if (!field) return null
    x_axis = { field, label: labelFor(field) }
    y_axis = { field: 'id', aggregation: agg, label: agg }
    return { x_axis, y_axis, series_field: null }
  }

  if (BAR_TYPES.has(type)) {
    if (categorized && field) {
      x_axis = { field, label: labelFor(field) }
      y_axis = { field: 'id', aggregation: agg, label: agg }
    } else if (field) {
      x_axis = { ...GEO_X }
      y_axis = { field, aggregation: agg, label: agg }
    } else {
      return null
    }
    return { x_axis, y_axis, series_field: null }
  }

  return null
}

/** Fix already-migrated records that used the old wrong mapping (field → x always). */
function fixKnownBadAxis(chart, axis) {
  const type = Number(chart.type)
  const field = chart.card_model_field
  const agg = normAgg(chart.aggregation || axis.y_axis?.aggregation)
  const categorized = chart.categorized != null ? !!chart.categorized : null

  if (!axis || chart.category === 'Intervention' || type === 8 || type === 12) {
    if (chart.category === 'Intervention') {
      return { x_axis: null, y_axis: null, series_field: null }
    }
    return axis
  }

  // Treemap grouped by id → county.name
  if (type === 11 && axis.x_axis?.field === 'id') {
    axis.x_axis = { ...GEO_X }
  }

  // Legacy-aware: uncategorized bar had measure on x_axis
  if (BAR_TYPES.has(type) && categorized === false && field && axis.x_axis?.field === field) {
    axis.x_axis = { ...GEO_X }
    axis.y_axis = { field, aggregation: agg, label: agg }
  }

  // Heuristic (legacy columns already dropped): y counts id but x is a measure field
  if (
    BAR_TYPES.has(type) &&
    axis.x_axis?.field &&
    axis.x_axis.field !== 'county.name' &&
    axis.x_axis.field !== 'id' &&
    axis.y_axis?.field === 'id'
  ) {
    const measure = axis.x_axis.field
    axis.x_axis = { ...GEO_X }
    axis.y_axis = { field: measure, aggregation: agg, label: agg }
  }

  // Uncategorized bar with x=id
  if (BAR_TYPES.has(type) && (categorized === false || categorized === null) && axis.x_axis?.field === 'id') {
    axis.x_axis = { ...GEO_X }
    axis.y_axis = { field: 'id', aggregation: agg, label: agg }
  }

  // Line/map: y should use measure when x was wrongly on y=id only
  if ((type === 5 || type === 7) && field && field !== 'id' && axis.y_axis?.field === 'id') {
    axis.y_axis = { field, aggregation: agg, label: agg }
  }

  return axis
}

function needsUpdate(chart, axis) {
  if (!axis) return false
  const cur = {
    x: chart.x_axis,
    y: chart.y_axis,
    s: chart.series_field,
  }
  return (
    JSON.stringify(cur.x) !== JSON.stringify(axis.x_axis) ||
    JSON.stringify(cur.y) !== JSON.stringify(axis.y_axis) ||
    JSON.stringify(cur.s) !== JSON.stringify(axis.series_field)
  )
}

const LEGACY_COLUMNS = [
  'aggregation',
  'card_model_field',
  'categorized',
  'filter_field',
  'filter_function',
  'filter_value',
  'filter_option',
]

async function columnExists(name) {
  const [row] = await db.sequelize.query(
    `SELECT EXISTS (
       SELECT FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'dashboard_section_chart'
         AND column_name = $1
     ) AS exists`,
    { bind: [name], type: db.Sequelize.QueryTypes.SELECT }
  )
  return !!row?.exists
}

async function dropLegacyColumns() {
  for (const col of LEGACY_COLUMNS) {
    if (!(await columnExists(col))) {
      console.log(`  [SKIP  column gone] ${col}`)
      continue
    }
    if (DRY_RUN) {
      console.log(`  [DRY   would drop] ${col}`)
      continue
    }
    await db.sequelize.query(`ALTER TABLE dashboard_section_chart DROP COLUMN IF EXISTS "${col}"`)
    console.log(`  [DROP  column] ${col}`)
  }
}

async function run() {
  await db.sequelize.authenticate()
  console.log(`Connected. force=${FORCE} dry-run=${DRY_RUN}\n`)

  const all = await db.sequelize.query(
    `SELECT * FROM dashboard_section_chart ORDER BY id`,
    { type: db.Sequelize.QueryTypes.SELECT }
  )
  console.log(`Found ${all.length} chart records.\n`)

  let updated = 0
  let skipped = 0
  let errors  = 0

  for (const chart of all) {
    const type = Number(chart.type)
    const hasAxis = chart.x_axis || chart.y_axis || chart.series_field

    if (hasAxis && !FORCE) {
      const fixed = fixKnownBadAxis(chart, {
        x_axis: chart.x_axis,
        y_axis: chart.y_axis,
        series_field: chart.series_field,
      })
      if (needsUpdate(chart, fixed)) {
        try {
          if (!DRY_RUN) {
            await db.models.dashboard_section_chart.update(
              { x_axis: fixed.x_axis, y_axis: fixed.y_axis, series_field: fixed.series_field },
              { where: { id: chart.id } }
            )
          }
          console.log(`  [FIX   bad axis] id=${chart.id} type=${type} title="${chart.title}"`)
          updated++
        } catch (err) {
          console.error(`  [ERROR] id=${chart.id}: ${err.message}`)
          errors++
        }
      } else {
        skipped++
      }
      continue
    }

    let axis = deriveAxisFromLegacy(chart)
    if (!axis && hasAxis && FORCE) {
      axis = fixKnownBadAxis(chart, {
        x_axis: chart.x_axis,
        y_axis: chart.y_axis,
        series_field: chart.series_field,
      })
    }
    if (!axis) {
      console.log(`  [SKIP  no mapping] id=${chart.id} type=${type} cat=${chart.category} title="${chart.title}"`)
      skipped++
      continue
    }

    axis = fixKnownBadAxis(chart, axis)

    try {
      if (!DRY_RUN) {
        await db.sequelize.query(
          `UPDATE dashboard_section_chart
           SET x_axis = :x_axis::jsonb, y_axis = :y_axis::jsonb, series_field = :series_field::jsonb
           WHERE id = :id`,
          {
            replacements: {
              id: chart.id,
              x_axis: JSON.stringify(axis.x_axis),
              y_axis: JSON.stringify(axis.y_axis),
              series_field: JSON.stringify(axis.series_field),
            },
          }
        )
      }
      const xLabel = axis.x_axis?.field ?? 'none'
      const yLabel = axis.y_axis?.aggregation ?? 'none'
      console.log(`  [OK    migrated] id=${chart.id} type=${type} x=${xLabel} y=${yLabel} title="${chart.title}"`)
      updated++
    } catch (err) {
      console.error(`  [ERROR] id=${chart.id}: ${err.message}`)
      errors++
    }
  }

  console.log('\n── Dropping legacy columns ──')
  await dropLegacyColumns()

  console.log('\n─────────────────────────────────────')
  console.log(`Done. Updated: ${updated}  Skipped: ${skipped}  Errors: ${errors}`)
  if (DRY_RUN) console.log('(dry-run — no writes performed)')
  console.log('─────────────────────────────────────')
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
