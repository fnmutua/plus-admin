/**
 * Repair live dashboard_section_chart axis config from a legacy CSV export.
 *
 * Export CSV from restored backup DB (kesmis_tmp):
 *   sudo -u postgres psql -d kesmis_tmp -c "\copy (
 *     SELECT id, title, type, category, card_model, card_model_field,
 *            aggregation, categorized, time_field, metric_fields
 *     FROM dashboard_section_chart ORDER BY id
 *   ) TO '/tmp/dashboard_section_chart_legacy.csv' WITH CSV HEADER"
 *
 * Apply to live DB:
 *   node server/scripts/repair-charts-from-csv.js /tmp/dashboard_section_chart_legacy.csv
 *   node server/scripts/repair-charts-from-csv.js /tmp/dashboard_section_chart_legacy.csv --dry-run
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })

const fs = require('fs')
const path = require('path')
const db = require('../app/models')
const { buildAxisFromLegacyRow } = require('./chart-axis-lib')

const DRY_RUN = process.argv.includes('--dry-run')
const csvArg = process.argv.find((a) => !a.startsWith('--') && a.endsWith('.csv'))

function parseCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean)
  if (!lines.length) return []

  const headers = splitCsvLine(lines[0]).map((h) => h.trim())
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i])
    const row = {}
    headers.forEach((h, idx) => {
      row[h] = cols[idx] != null ? cols[idx].trim() : ''
    })
    rows.push(row)
  }
  return rows
}

function splitCsvLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out
}

async function run() {
  if (!csvArg) {
    console.error('Usage: node server/scripts/repair-charts-from-csv.js <legacy.csv> [--dry-run]')
    process.exit(1)
  }

  const csvPath = path.resolve(csvArg)
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath}`)
    process.exit(1)
  }

  const legacyRows = parseCsv(fs.readFileSync(csvPath, 'utf8'))
  console.log(`Loaded ${legacyRows.length} rows from ${csvPath}`)
  console.log(`Target DB: ${process.env.VUE_APP_DB} @ ${process.env.VUE_APP_DB_HOST}`)
  console.log(`dry-run=${DRY_RUN}\n`)

  await db.sequelize.authenticate()

  const live = await db.sequelize.query(
    `SELECT id, title, type, category, card_model, x_axis, y_axis, series_field
     FROM dashboard_section_chart ORDER BY id`,
    { type: db.Sequelize.QueryTypes.SELECT }
  )
  const liveById = new Map(live.map((r) => [Number(r.id), r]))

  let updated = 0
  let skipped = 0
  let missing = 0
  let errors = 0

  for (const row of legacyRows) {
    const id = Number(row.id)
    const liveRow = liveById.get(id)
    if (!liveRow) {
      console.log(`  [MISS  not in live] id=${id} title="${row.title}"`)
      missing++
      continue
    }

    const axis = buildAxisFromLegacyRow(row)
    if (!axis) {
      console.log(`  [SKIP  no mapping] id=${id} type=${row.type} title="${row.title}"`)
      skipped++
      continue
    }

    const changed =
      JSON.stringify(liveRow.x_axis) !== JSON.stringify(axis.x_axis) ||
      JSON.stringify(liveRow.y_axis) !== JSON.stringify(axis.y_axis) ||
      JSON.stringify(liveRow.series_field) !== JSON.stringify(axis.series_field)

    if (!changed) {
      skipped++
      continue
    }

    try {
      if (!DRY_RUN) {
        await db.sequelize.query(
          `UPDATE dashboard_section_chart
           SET x_axis = :x_axis::jsonb, y_axis = :y_axis::jsonb, series_field = :series_field::jsonb
           WHERE id = :id`,
          {
            replacements: {
              id,
              x_axis: JSON.stringify(axis.x_axis),
              y_axis: JSON.stringify(axis.y_axis),
              series_field: JSON.stringify(axis.series_field),
            },
          }
        )
      }
      const xLabel = axis.x_axis?.field ?? 'none'
      const yLabel = axis.y_axis?.field ?? axis.y_axis?.aggregation ?? 'none'
      console.log(`  [OK    ${DRY_RUN ? 'would fix' : 'fixed'}] id=${id} type=${row.type} x=${xLabel} y=${yLabel} title="${row.title}"`)
      updated++
    } catch (err) {
      console.error(`  [ERROR] id=${id}: ${err.message}`)
      errors++
    }
  }

  console.log('\n─────────────────────────────────────')
  console.log(`Done. Updated: ${updated}  Skipped: ${skipped}  Missing: ${missing}  Errors: ${errors}`)
  if (DRY_RUN) console.log('(dry-run — no writes performed)')
  console.log('─────────────────────────────────────')
  console.log('\nNext: node server/scripts/audit-charts-axis.js')
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Repair failed:', err)
    process.exit(1)
  })
