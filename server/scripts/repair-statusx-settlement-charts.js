/**
 * Fix Statusx settlement charts with missing axis config (were grouping by id → ~71k rows).
 *
 *   node server/scripts/repair-statusx-settlement-charts.js --dry-run
 *   node server/scripts/repair-statusx-settlement-charts.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../tools/.env') })

const db = require('../app/models')

const DRY_RUN = process.argv.includes('--dry-run')

/** id → axis patch (only charts that had null x_axis / y_axis) */
const FIXES = {
  153: {
    title: 'Availability of Electricity Infrastructure',
    x_axis: { field: 'electricity_availability', label: 'electricity_availability' },
    y_axis: { field: 'id', aggregation: 'count', label: 'count' },
    series_field: null,
  },
  154: {
    title: 'Availability of Piped Water',
    x_axis: { field: 'piped_water_availability', label: 'piped_water_availability' },
    y_axis: { field: 'id', aggregation: 'count', label: 'count' },
    series_field: null,
  },
  161: {
    title: 'Vulnerable Settlements',
    x_axis: { field: 'vulnerability_rating', label: 'vulnerability_rating' },
    y_axis: { field: 'id', aggregation: 'count', label: 'count' },
    series_field: null,
  },
  164: {
    title: 'Population Within Slums/Informal Settlements',
    x_axis: { field: 'county.name', label: 'County' },
    y_axis: { field: 'population', aggregation: 'sum', label: 'sum' },
    series_field: null,
  },
  165: {
    title: 'Settlement Tenure',
    x_axis: { field: 'land_status', label: 'land_status' },
    y_axis: { field: 'id', aggregation: 'count', label: 'count' },
    series_field: null,
  },
  166: {
    title: 'Distribution of Settlements',
    x_axis: { field: 'county.name', label: 'County' },
    y_axis: { field: 'id', aggregation: 'count', label: 'count' },
    series_field: { field: 'density_typology', label: 'density_typology' },
  },
  167: {
    title: 'Typology of Settlements',
    x_axis: { field: 'density_typology', label: 'density_typology' },
    y_axis: { field: 'id', aggregation: 'count', label: 'count' },
    series_field: null,
  },
  169: {
    title: 'Typology of settlements(density)',
    x_axis: { field: 'density_typology', label: 'density_typology' },
    y_axis: { field: 'id', aggregation: 'count', label: 'count' },
    series_field: null,
  },
}

async function run() {
  console.log(`DB: ${process.env.VUE_APP_DB} @ ${process.env.VUE_APP_DB_HOST}`)
  console.log(`dry-run=${DRY_RUN}\n`)

  await db.sequelize.authenticate()

  const ids = Object.keys(FIXES).map(Number)
  const rows = await db.sequelize.query(
    `SELECT c.id, c.title, c.type, c.card_model, c.x_axis, c.y_axis, c.series_field,
            d.title AS dashboard_title
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
      console.log(`[MISS] id=${id} "${patch.title}" — not found in DB`)
      missing++
      continue
    }

    const xBare = row.x_axis?.field ? String(row.x_axis.field).split('.').pop() : null
    const needsFix = !row.x_axis?.field || xBare === 'id' || !row.y_axis?.field

    if (!needsFix) {
      console.log(`[SKIP] id=${id} "${row.title}" — axis already set`)
      console.log(`       x=${JSON.stringify(row.x_axis)} y=${JSON.stringify(row.y_axis)}`)
      skipped++
      continue
    }

    console.log(`[FIX ] id=${id} type=${row.type} dashboard=${row.dashboard_title}`)
    console.log(`       title: ${row.title}`)
    console.log(`       was  x=${JSON.stringify(row.x_axis)} y=${JSON.stringify(row.y_axis)}`)
    console.log(`       now  x=${JSON.stringify(patch.x_axis)} y=${JSON.stringify(patch.y_axis)}`)
    if (patch.series_field) {
      console.log(`       series=${JSON.stringify(patch.series_field)}`)
    }

    if (!DRY_RUN) {
      await db.sequelize.query(
        `UPDATE dashboard_section_chart
         SET x_axis = :x_axis::jsonb,
             y_axis = :y_axis::jsonb,
             series_field = :series_field::jsonb
         WHERE id = :id`,
        {
          replacements: {
            id,
            x_axis: JSON.stringify(patch.x_axis),
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
