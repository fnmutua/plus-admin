/** Simulate scalar card query (settlement count, empty groupFields). */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const db = require('../../server/app/models')
const { Sequelize } = require('sequelize')

async function run() {
  await db.sequelize.authenticate()
  const qry = {
    attributes: [[Sequelize.fn('count', Sequelize.col('id')), 'count']],
    include: [],
    where: {},
    raw: true,
  }
  const list = await db.models.settlement.findAll(qry)
  console.log('scalar count rows:', list.length, 'value:', list[0]?.count)
  process.exit(list.length === 1 ? 0 : 1)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
