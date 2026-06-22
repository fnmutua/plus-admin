require('dotenv').config({ path: require('path').resolve(__dirname, '../../tools/.env') })
const db = require('../../server/app/models')

function xBare(x) {
  const f = x?.field
  return f ? String(f).split('.').pop() : null
}

async function run() {
  await db.sequelize.authenticate()

  const charts = await db.sequelize.query(
    `SELECT c.id, c.type, c.category, c.title, c.card_model, c.x_axis, c.y_axis, c.series_field,
            d.title AS dashboard_title, s.title AS section_title
     FROM dashboard_section_chart c
     LEFT JOIN dashboard_section s ON s.id = c.dashboard_section_id
     LEFT JOIN dashboard d ON d.id = s.dashboard_id
     ORDER BY c.id`,
    { type: db.Sequelize.QueryTypes.SELECT }
  )

  const cards = await db.sequelize.query(
    `SELECT c.id, c.title, c.card_model, c.card_model_field, c.category, c.aggregation,
            d.title AS dashboard_title
     FROM dashboard_card c
     LEFT JOIN dashboard d ON d.id = c.dashboard_id
     WHERE c.card_model = 'settlement'
     ORDER BY c.id`,
    { type: db.Sequelize.QueryTypes.SELECT }
  )

  console.log('=== CHARTS WITH PROBLEMS ===')
  for (const c of charts) {
    const type = Number(c.type)
    const issues = []
    const x = c.x_axis
    const y = c.y_axis
    const xField = x?.field || null
    const bare = xBare(x)

    if (bare === 'id') issues.push('x_axis is id')
    if ([3, 10, 11, 1, 2, 4, 9].includes(type) && !xField) issues.push('missing x_axis')
    if ([3, 10, 11, 1, 2, 4, 9, 5, 7, 12].includes(type) && !y?.field && type !== 12) issues.push('missing y_axis')
    if (type === 2 && !c.series_field?.field) issues.push('grouped bar missing series')
    if (type === 9 && !c.series_field?.field) issues.push('stacked bar missing series')
    if (type === 7 && y?.field === 'id' && !xField) issues.push('map chart may scalar-count only (check)')

    if (issues.length) {
      console.log(`id=${c.id} type=${type} model=${c.card_model} dashboard=${c.dashboard_title}`)
      console.log(`  ${c.title}`)
      console.log(`  x=${JSON.stringify(x)} y=${JSON.stringify(y)} series=${JSON.stringify(c.series_field)}`)
      console.log(`  issues: ${issues.join('; ')}`)
      console.log('')
    }
  }

  console.log('=== SETTLEMENT CARDS (card_model_field=id groups badly if used as chart) ===')
  for (const c of cards) {
    if (c.card_model_field === 'id' || !c.card_model_field) {
      console.log(`card id=${c.id} dashboard=${c.dashboard_title} field=${c.card_model_field} agg=${c.aggregation} — ${c.title}`)
    }
  }

  process.exit(0)
}

run().catch((e) => { console.error(e); process.exit(1) })
