/**
 * Audit dashboard_section_chart axis config — find records that will hang or return no data.
 *
 *   node server/scripts/audit-charts-axis.js
 *   node server/scripts/audit-charts-axis.js --json
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })

const db = require('../app/models')
const AS_JSON = process.argv.includes('--json')

const SLICE_TYPES = new Set([3, 10, 11])
const BAR_TYPES = new Set([1, 2, 4, 9])
const LINE_MAP = new Set([5, 7])

function isProblem(chart) {
  const type = Number(chart.type)
  const issues = []

  if (chart.category === 'Intervention') {
    return issues
  }
  if (type === 8) {
    return issues
  }
  if (type === 12) {
    if (!chart.metric_fields?.length) issues.push('multi-line missing metric_fields')
    return issues
  }

  const x = chart.x_axis
  const y = chart.y_axis
  const hasAxis = x || y || chart.series_field

  if (!hasAxis) {
    issues.push('missing axis config (x_axis / y_axis)')
    return issues
  }

  if (SLICE_TYPES.has(type)) {
    const xField = x?.field
    const xBare = String(xField || '').split('.').pop()
    if (!xField) issues.push('slice/treemap missing x_axis.field')
    if (type === 11 && xBare === 'id') issues.push('treemap grouped by id — will hang browser')
  }

  if (BAR_TYPES.has(type)) {
    if (!x?.field) issues.push('bar missing x_axis.field')
    if (!y?.field) issues.push('bar missing y_axis.field')
  }

  if (LINE_MAP.has(type)) {
    if (!y?.field) issues.push('line/map missing y_axis.field')
    if (type === 5 && !chart.time_field) issues.push('line missing time_field')
  }

  if (type === 2 && !chart.series_field?.field) {
    issues.push('grouped bar missing series_field')
  }

  return issues
}

async function run() {
  await db.sequelize.authenticate()

  const legacyCols = ['aggregation', 'card_model_field', 'categorized']
  const legacyPresent = {}
  for (const col of legacyCols) {
    const [row] = await db.sequelize.query(
      `SELECT EXISTS (
         SELECT FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'dashboard_section_chart' AND column_name = $1
       ) AS exists`,
      { bind: [col], type: db.Sequelize.QueryTypes.SELECT }
    )
    legacyPresent[col] = !!row?.exists
  }

  const rows = await db.sequelize.query(
    `SELECT id, type, category, title, model, x_axis, y_axis, series_field, filters, time_field, metric_fields
     FROM dashboard_section_chart ORDER BY id`,
    { type: db.Sequelize.QueryTypes.SELECT }
  )

  const problems = []
  for (const chart of rows) {
    const issues = isProblem(chart)
    if (issues.length) {
      problems.push({
        id: chart.id,
        type: chart.type,
        category: chart.category,
        title: chart.title,
        model: chart.model,
        x_axis: chart.x_axis,
        y_axis: chart.y_axis,
        series_field: chart.series_field,
        time_field: chart.time_field,
        metric_fields: chart.metric_fields,
        issues,
      })
    }
  }

  if (AS_JSON) {
    console.log(JSON.stringify({ total: rows.length, problems: problems.length, legacyPresent, charts: problems }, null, 2))
  } else {
    console.log(`Charts: ${rows.length}  Problems: ${problems.length}`)
    console.log('Legacy columns present:', legacyPresent)
    console.log('')
    for (const p of problems) {
      console.log(`id=${p.id} type=${p.type} cat=${p.category} model=${p.model}`)
      console.log(`  title: ${p.title}`)
      console.log(`  x_axis: ${JSON.stringify(p.x_axis)}`)
      console.log(`  y_axis: ${JSON.stringify(p.y_axis)}`)
      console.log(`  issues: ${p.issues.join('; ')}`)
      console.log('')
    }
  }

  process.exit(problems.length ? 1 : 0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
