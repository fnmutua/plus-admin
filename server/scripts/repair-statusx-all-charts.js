/**
 * Fix Statusx dashboard charts with missing axis config (group by id → huge row sets).
 *
 *   node server/scripts/repair-statusx-all-charts.js --dry-run
 *   node server/scripts/repair-statusx-all-charts.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../tools/.env') })

const db = require('../app/models')

const DRY_RUN = process.argv.includes('--dry-run')

const COUNT_Y = { field: 'id', aggregation: 'count', label: 'count' }

/** id → axis patch */
const FIXES = {
  126: {
    title: 'Average Househod Size',
    x_axis: { field: 'county.name', label: 'County' },
    y_axis: { field: 'hh_size', aggregation: 'avg', label: 'avg' },
    series_field: null,
  },
  127: {
    title: 'Education',
    x_axis: { field: 'educational_level_highest', label: 'Education' },
    y_axis: COUNT_Y,
    series_field: null,
  },
  128: {
    title: 'Average monthly Income per Household',
    x_axis: { field: 'monthly_income', label: 'Monthly income' },
    y_axis: COUNT_Y,
    series_field: null,
  },
  129: {
    title: 'Structures',
    x_axis: { field: 'structure_use', label: 'Structure use' },
    y_axis: COUNT_Y,
    series_field: null,
  },
  130: {
    title: 'Plot Ownership Documentation',
    x_axis: { field: 'proof_ownership', label: 'Proof of ownership' },
    y_axis: COUNT_Y,
    series_field: null,
  },
  131: {
    title: 'Plot Ownership Type',
    x_axis: { field: 'ownership_type', label: 'Ownership type' },
    y_axis: COUNT_Y,
    series_field: null,
  },
  132: {
    title: 'Household Connection to Electricity',
    x_axis: { field: 'electricity_use', label: 'Electricity' },
    y_axis: COUNT_Y,
    series_field: null,
  },
  133: {
    title: 'Source of Lighting',
    x_axis: { field: 'lighting_energy_source', label: 'Lighting source' },
    y_axis: COUNT_Y,
    series_field: null,
  },
  134: {
    title: 'Live within Settlement',
    x_axis: { field: 'live_within_settlement', label: 'Live within settlement' },
    y_axis: COUNT_Y,
    series_field: null,
  },
  135: {
    title: 'Place of Work',
    x_axis: { field: 'place_of_work', label: 'Place of work' },
    y_axis: COUNT_Y,
    series_field: null,
  },
  136: {
    title: 'Households with PWDs',
    x_axis: { field: 'disability', label: 'Disability' },
    y_axis: COUNT_Y,
    series_field: null,
  },
  138: {
    title: 'Households Profiled',
    x_axis: { field: 'county.name', label: 'County' },
    y_axis: COUNT_Y,
    series_field: null,
  },
  149: {
    title: 'Marital Status',
    x_axis: { field: 'marital_status', label: 'Marital status' },
    y_axis: COUNT_Y,
    series_field: null,
  },
  150: {
    title: 'Residency',
    x_axis: { field: 'born_in_settlement', label: 'Born in settlement' },
    y_axis: COUNT_Y,
    series_field: null,
  },
  151: {
    title: 'Access to Toilets',
    x_axis: { field: 'access_to_toilet', label: 'Access to toilet' },
    y_axis: COUNT_Y,
    series_field: null,
  },
  152: {
    title: 'Mobile Phone Ownership',
    x_axis: { field: 'own_mobile_phone', label: 'Mobile phone' },
    y_axis: COUNT_Y,
    series_field: null,
  },
  160: {
    title: 'Distribution of Slums and Informal Settlements',
    x_axis: null,
    y_axis: COUNT_Y,
    series_field: null,
  },
  162: {
    title: 'Distribution of  Highly Vulnerable Settlements',
    x_axis: null,
    y_axis: COUNT_Y,
    series_field: null,
  },
  168: {
    title: 'Access to Health Care facilities',
    x_axis: { field: 'perception_med_facility', label: 'Health facility perception' },
    y_axis: COUNT_Y,
    series_field: null,
  },
  170: {
    title: 'Place of Work',
    x_axis: { field: 'place_of_work', label: 'Place of work' },
    y_axis: COUNT_Y,
    series_field: null,
  },
  171: {
    title: 'Daytime Security Perceptions',
    x_axis: { field: 'safety_perception_day', label: 'Daytime safety' },
    y_axis: COUNT_Y,
    series_field: null,
  },
  172: {
    title: 'Plot Ownership',
    x_axis: { field: 'ownership_type', label: 'Ownership type' },
    y_axis: COUNT_Y,
    series_field: null,
  },
  174: {
    title: 'Population in Slums (projections)',
    x_axis: null,
    y_axis: { field: 'population', aggregation: 'sum', label: 'sum' },
    series_field: null,
  },
  175: {
    title: 'Population in Slums By Gender (projections)',
    x_axis: null,
    y_axis: { field: 'population', aggregation: 'sum', label: 'sum' },
    series_field: null,
  },
  176: {
    title: 'Distribution of  Households within slums/Settlements',
    x_axis: null,
    y_axis: { field: 'num_households', aggregation: 'sum', label: 'sum' },
    series_field: null,
  },
}

function needsFix(row, patch) {
  const xBare = row.x_axis?.field ? String(row.x_axis.field).split('.').pop() : null
  const yBare = row.y_axis?.field ? String(row.y_axis.field).split('.').pop() : null
  const chartType = Number(row.type)

  if (patch.x_axis?.field && (!row.x_axis?.field || xBare === 'id')) return true
  if (patch.y_axis?.field && !row.y_axis?.field) return true
  // Map charts (type 7) only need y_axis
  if (chartType === 7 && patch.y_axis && !row.y_axis?.field) return true
  // Pie/donut without x
  if ((chartType === 3 || chartType === 10) && !row.x_axis?.field) return true
  return false
}

async function run() {
  console.log(`DB: ${process.env.VUE_APP_DB} @ ${process.env.VUE_APP_DB_HOST}`)
  console.log(`dry-run=${DRY_RUN}\n`)

  await db.sequelize.authenticate()

  const ids = Object.keys(FIXES).map(Number)
  const rows = await db.sequelize.query(
    `SELECT c.id, c.title, c.type, c.card_model, c.x_axis, c.y_axis, c.series_field
     FROM dashboard_section_chart c
     LEFT JOIN dashboard_section s ON s.id = c.dashboard_section_id
     LEFT JOIN dashboard d ON d.id = s.dashboard_id
     WHERE c.id IN (:ids)
     ORDER BY c.id`,
    { replacements: { ids }, type: db.Sequelize.QueryTypes.SELECT }
  )

  let updated = 0
  let skipped = 0
  let missing = 0

  for (const id of ids) {
    const patch = FIXES[id]
    const row = rows.find((r) => Number(r.id) === id)

    if (!row) {
      console.log(`[MISS] id=${id} "${patch.title}" — not found`)
      missing++
      continue
    }

    if (!needsFix(row, patch)) {
      console.log(`[SKIP] id=${id} "${row.title}"`)
      skipped++
      continue
    }

    console.log(`[FIX ] id=${id} type=${row.type} model=${row.card_model}`)
    console.log(`       was  x=${JSON.stringify(row.x_axis)} y=${JSON.stringify(row.y_axis)}`)
    console.log(`       now  x=${JSON.stringify(patch.x_axis)} y=${JSON.stringify(patch.y_axis)}`)

    if (!DRY_RUN) {
      await db.sequelize.query(
        `UPDATE dashboard_section_chart
         SET x_axis = :x_axis::jsonb,
             y_axis = :y_axis::jsonb,
             series_field = COALESCE(:series_field::jsonb, series_field)
         WHERE id = :id`,
        {
          replacements: {
            id,
            x_axis: patch.x_axis ? JSON.stringify(patch.x_axis) : null,
            y_axis: JSON.stringify(patch.y_axis),
            series_field: patch.series_field ? JSON.stringify(patch.series_field) : null,
          },
        }
      )
    }
    updated++
  }

  console.log(`\nDone. updated=${updated} skipped=${skipped} missing=${missing}`)
  process.exit(missing > 0 ? 1 : 0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
