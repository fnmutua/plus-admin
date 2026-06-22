require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const db = require('../../server/app/models')

async function run() {
  await db.sequelize.authenticate()
  const charts = await db.sequelize.query(
    `SELECT c.id, c.title, c.type, c.card_model, c.x_axis, c.y_axis, c.series_field
     FROM dashboard_section_chart c
     JOIN dashboard_section s ON s.id = c.dashboard_section_id
     JOIN dashboard d ON d.id = s.dashboard_id
     WHERE d.title ILIKE '%status%'
     ORDER BY c.id`,
    { type: db.Sequelize.QueryTypes.SELECT }
  )
  console.log(JSON.stringify(charts, null, 2))

  const cards = await db.sequelize.query(
    `SELECT dc.id, dc.title, dc.card_model, dc.card_model_field, dc.aggregation
     FROM dashboard_card dc
     JOIN dashboard d ON d.id = dc.dashboard_id
     WHERE d.title ILIKE '%status%'`,
    { type: db.Sequelize.QueryTypes.SELECT }
  )
  console.log('\nCARDS:', JSON.stringify(cards, null, 2))
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
