require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const db = require('../../server/app/models')
db.sequelize.query(
  `SELECT id,title,type,card_model,x_axis,y_axis,time_field,metric_fields,filters,category
   FROM dashboard_section_chart WHERE id IN (137,160,162,174,175,176)`,
  { type: db.Sequelize.QueryTypes.SELECT }
).then((r) => { console.log(JSON.stringify(r, null, 2)); process.exit(0) })
