/**
 * One-time migration: convert existing dashboard_section_chart records
 * from the legacy config fields to the new axis-based config.
 *
 * Run from the project root:
 *   node server/scripts/migrate-charts-to-axis.js
 *
 * What it does per chart type:
 *   Bar / Stacked / Pie / Donut / Treemap (1,2,3,4,9,10,11)
 *     x_axis   ← card_model_field  (the group-by field)
 *     y_axis   ← { field: 'id', aggregation: aggregation||'count' }
 *     series_field ← null  (categorized=true had no explicit field stored — skip)
 *
 *   Line (5)
 *     x_axis   ← null (uses time_field instead)
 *     y_axis   ← { field: 'id', aggregation: aggregation||'count' }
 *     time_field already stored
 *
 *   Map (7)
 *     x_axis   ← null (county is implicit)
 *     y_axis   ← { field: 'id', aggregation: aggregation||'count' }
 *
 *   Pyramid (8)  — no axis config, skip
 *   Multi-line (12) — metric_fields already stored, skip axis
 *
 * Records that already have x_axis OR y_axis set are skipped.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })

const db = require('../app/models')

// Map old aggregation strings → normalised lowercase
const normAgg = (a) => (a || 'count').toLowerCase()

async function run() {
  await db.sequelize.authenticate()
  console.log('Connected to database.')

  const all = await db.models.dashboard_section_chart.findAll({ raw: true })
  console.log(`Found ${all.length} chart records.`)

  let updated = 0
  let skipped = 0
  let errors  = 0

  for (const chart of all) {
    // Skip if already migrated
    if (chart.x_axis || chart.y_axis) {
      console.log(`  [SKIP  already migrated] id=${chart.id} title="${chart.title}"`)
      skipped++
      continue
    }

    const type = Number(chart.type)

    // Types with no axis config
    if (type === 8) {
      console.log(`  [SKIP  pyramid fixed] id=${chart.id}`)
      skipped++
      continue
    }
    if (type === 12) {
      console.log(`  [SKIP  multi-line uses metric_fields] id=${chart.id}`)
      skipped++
      continue
    }

    const agg = normAgg(chart.aggregation)
    let x_axis      = null
    let y_axis      = { field: 'id', aggregation: agg, label: agg }
    let series_field = null

    if (type === 7) {
      // Map: no x_axis (county is implicit in the backend)
      // y_axis stays as count of model rows
    } else if (type === 5) {
      // Line: x axis is time_field, handled by backend; store y_axis only
      // x_axis stays null — the backend uses time_field from the record
    } else if (chart.card_model_field) {
      // Bar / Pie / Stacked / Donut / Treemap: x_axis = the group-by field
      x_axis = { field: chart.card_model_field, label: chart.card_model_field }
    } else {
      console.log(`  [SKIP  no card_model_field] id=${chart.id} type=${type} title="${chart.title}"`)
      skipped++
      continue
    }

    try {
      await db.models.dashboard_section_chart.update(
        { x_axis, y_axis, series_field },
        { where: { id: chart.id } }
      )
      console.log(`  [OK    migrated] id=${chart.id} type=${type} x=${x_axis?.field ?? 'none'} y=${agg} title="${chart.title}"`)
      updated++
    } catch (err) {
      console.error(`  [ERROR] id=${chart.id}: ${err.message}`)
      errors++
    }
  }

  console.log('\n─────────────────────────────────────')
  console.log(`Done. Updated: ${updated}  Skipped: ${skipped}  Errors: ${errors}`)
  console.log('─────────────────────────────────────')
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
