const config = require('../config/db.config.js')
const Sequelize = require('sequelize')
const sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
  host: config.HOST,
  port: config.PORT,
  dialect: config.dialect,
  operatorsAliases: false,
  pool: {
    max: config.pool.max,
    min: config.pool.min,
    acquire: config.pool.acquire,
    idle: config.pool.idle
  },
  define: {
    timestamps: false
  }
})
const db = {}
db.Sequelize = Sequelize
db.sequelize = sequelize
db.user = require('../models/users.js')(sequelize, Sequelize)
db.role = require('../models/role.js')(sequelize, Sequelize)

var initModels = require('../models/init-models.js')
db.models = initModels(sequelize)

db.role.belongsToMany(db.user, {
  through: 'user_roles',
  foreignKey: 'roleid',
  otherKey: 'userid'
})
db.user.belongsToMany(db.role, {
  through: 'user_roles',
  foreignKey: 'userid',
  otherKey: 'roleid'
})

// A county can have many users, while a user can only have one county.W
//db.user.belongsTo(db.models.county);

db.models.county.hasMany(db.models.users, {
  foreignKey: 'county_id'
})

db.models.users.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})

// County and settlements associations
db.models.county.hasMany(db.models.settlement, {
  foreignKey: 'county_id'
})

db.models.settlement.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})

// Parcels and settlements associations
db.models.settlement.hasMany(db.models.parcel, {
  foreignKey: 'settlement_id'
})

db.models.parcel.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})

// beneficiraires and settlements associations
db.models.settlement.hasMany(db.models.beneficiary, {
  foreignKey: 'settlement_id'
})

db.models.beneficiary.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})

// households and settlements associations
db.models.settlement.hasMany(db.models.households, {
  foreignKey: 'settlement_id'
})

db.models.households.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})

// Docuemnts and settlements associations
db.models.settlement.hasMany(db.models.settlement_uploads, {
  foreignKey: 'settlement_id'
})

db.models.settlement_uploads.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})

// Docuemnts and settlements associations
db.models.settlement.hasMany(db.models.intervention, {
  foreignKey: 'settlement_id'
})

// Clusters
db.models.clusters.belongsTo(db.models.lots, {
  foreignKey: 'lot_id'
})

db.models.beneficiary_parcel.belongsTo(db.models.beneficiary, {
  foreignKey: 'beneficiary_id'
})

db.models.beneficiary_parcel.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})

db.models.beneficiary_parcel.belongsTo(db.models.parcel, {
  foreignKey: 'parcel_id'
})

// // Interventions
db.models.intervention.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})

db.models.intervention.belongsTo(db.models.clusters, {
  foreignKey: 'cluster_id'
})

db.models.intervention_type.hasMany(db.models.intervention, {
  foreignKey: 'intervention_type_id'
})

db.models.intervention.belongsTo(db.models.intervention_type, {
  foreignKey: 'intervention_type_id'
})

db.models.beneficiary.belongsTo(db.models.intervention, {
  foreignKey: 'intervention_id'
})

db.models.beneficiary.belongsTo(db.models.benefit_type, {
  foreignKey: 'benefit_type_id'
})

db.models.beneficiary.belongsTo(db.models.households, {
  foreignKey: 'hh_id'
})

db.models.settlement_status.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})

db.models.settlement.hasMany(db.models.settlement_status, {
  foreignKey: 'settlement_id'
})

//db.ROLES = ["user", "admin", "editor",  "moderator"];
module.exports = db
