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
db.user = require('../models/user.js')(sequelize, Sequelize)
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
 

db.models.user_roles.belongsTo(db.models.users, {
  foreignKey: 'userid'
})

db.models.users.hasMany(db.models.user_roles, {
  foreignKey: 'userid'
})

db.models.user_roles.belongsTo(db.models.roles, {
  foreignKey: 'roleid'
})

db.models.roles.hasMany(db.models.user_roles, {
  foreignKey: 'roleid'
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

db.models.subcounty.hasMany(db.models.settlement, {
  foreignKey: 'subcounty_id'
})

db.models.settlement.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id'
})


// Parcels and settlements associations
db.models.settlement.hasMany(db.models.parcel, {
  foreignKey: 'settlement_id'
})

db.models.parcel.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})
 

// households and settlements associations
db.models.settlement.hasMany(db.models.households, {
  foreignKey: 'settlement_id'
})

db.models.households.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})

db.models.county.hasMany(db.models.households, {
  foreignKey: 'county_id'
})

db.models.households.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})

db.models.subcounty.hasMany(db.models.households, {
  foreignKey: 'subcounty_id'
})

db.models.households.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id'
})











// Docuemnts and settlements associations
db.models.settlement.hasMany(db.models.settlement_uploads, {
  foreignKey: 'settlement_id'
})

db.models.settlement_uploads.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})

// intervention and settlements associations
db.models.settlement.hasMany(db.models.intervention, {
  foreignKey: 'settlement_id'
})

db.models.intervention.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})

db.models.county.hasMany(db.models.intervention, {
  foreignKey: 'county_id'
})

db.models.intervention.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})


db.models.subcounty.hasMany(db.models.intervention, {
  foreignKey: 'subcounty_id'
})

db.models.intervention.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id'
})



// Clusters
db.models.cluster.belongsTo(db.models.lots, {
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



db.models.intervention.belongsTo(db.models.cluster, {
  foreignKey: 'cluster_id'
})

db.models.intervention_type.hasMany(db.models.intervention, {
  foreignKey: 'intervention_type_id'
})

db.models.intervention.belongsTo(db.models.intervention_type, {
  foreignKey: 'intervention_type_id'
})



db.models.beneficiary.belongsTo(db.models.benefit_type, {
  foreignKey: 'benefit_type_id'
})



//Beneficiriaes r
db.models.beneficiary.belongsTo(db.models.households, {
  foreignKey: 'hh_id'
})

db.models.households.hasMany(db.models.beneficiary, {
  foreignKey: 'hh_id'
})


db.models.beneficiary.belongsTo(db.models.project, {
  foreignKey: 'project_id'
})

db.models.project.hasMany(db.models.beneficiary, {
  foreignKey: 'project_id'
})

 



db.models.settlement_status.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})

db.models.settlement.hasMany(db.models.settlement_status, {
  foreignKey: 'settlement_id'
})

/// Health Facilities 

db.models.health_facility.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})

db.models.settlement.hasMany(db.models.health_facility, {
  foreignKey: 'settlement_id'
})

db.models.health_facility.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})

db.models.county.hasMany(db.models.health_facility, {
  foreignKey: 'county_id'
})
db.models.health_facility.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id'
})

db.models.subcounty.hasMany(db.models.health_facility, {
  foreignKey: 'subcounty_id'
})





/// Education Facilities 

db.models.education_facility.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})

db.models.settlement.hasMany(db.models.education_facility, {
  foreignKey: 'settlement_id'
})

db.models.education_facility.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})

db.models.county.hasMany(db.models.education_facility, {
  foreignKey: 'county_id'
})

db.models.education_facility.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id'
})

db.models.subcounty.hasMany(db.models.education_facility, {
  foreignKey: 'subcounty_id'
})



/// Roads
db.models.road.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})

db.models.settlement.hasMany(db.models.road, {
  foreignKey: 'settlement_id'
})




/// water points
db.models.water_point.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})

db.models.settlement.hasMany(db.models.water_point, {
  foreignKey: 'settlement_id'
})


db.models.water_point.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})

db.models.county.hasMany(db.models.water_point, {
  foreignKey: 'county_id'
})


db.models.water_point.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id'
})

db.models.subcounty.hasMany(db.models.water_point, {
  foreignKey: 'subcounty_id'
})






/// sewer  
db.models.sewer.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})

db.models.settlement.hasMany(db.models.sewer, {
  foreignKey: 'settlement_id'
})

db.models.sewer.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})

db.models.county.hasMany(db.models.sewer, {
  foreignKey: 'county_id'
})


db.models.sewer.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id'
})

db.models.subcounty.hasMany(db.models.sewer, {
  foreignKey: 'subcounty_id'
})



















/// Road Assets  
db.models.road_asset.belongsTo(db.models.road, {
  foreignKey: 'road_id'
})

db.models.road.hasMany(db.models.road_asset, {
  foreignKey: 'road_id'
})



/// Other Facilities  
db.models.other_facility.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})

db.models.settlement.hasMany(db.models.other_facility, {
  foreignKey: 'settlement_id'
})

db.models.other_facility.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})

db.models.county.hasMany(db.models.other_facility, {
  foreignKey: 'county_id'
})

db.models.other_facility.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id'
})

db.models.subcounty.hasMany(db.models.other_facility, {
  foreignKey: 'subcounty_id'
})







/// indicator-category - category  
db.models.indicator_category.belongsTo(db.models.category, {
  foreignKey: 'category_id'
})

db.models.category.hasMany(db.models.indicator_category, {
  foreignKey: 'category_id'
})

//indicator - indciator:category
db.models.indicator_category.belongsTo(db.models.indicator, {
  foreignKey: 'indicator_id'
})

db.models.indicator.hasMany(db.models.indicator_category, {
  foreignKey: 'indicator_id'
})

//reports - indciator:category
db.models.indicator_category_report.belongsTo(db.models.indicator_category, {
  foreignKey: 'indicator_category_id'
})

db.models.indicator_category.hasMany(db.models.indicator_category_report, {
  foreignKey: 'indicator_category_id'
})


// county  - indicator_category_report
db.models.indicator_category_report.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})

db.models.county.hasMany(db.models.indicator_category_report, {
  foreignKey: 'county_id'
})

// county  - indicator_category_report
db.models.indicator_category_report.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})

db.models.settlement.hasMany(db.models.indicator_category_report, {
  foreignKey: 'settlement_id'
})


// user  - indicator_category_report
db.models.indicator_category_report.belongsTo(db.models.users, {
  foreignKey: 'userId'
})

db.models.users.hasMany(db.models.indicator_category_report, {
  foreignKey: 'userId'
})

// Proejct   - settleemnt
db.models.project.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})

db.models.settlement.hasMany(db.models.project, {
  foreignKey: 'settlement_id'
})


 
db.models.project.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})

db.models.county.hasMany(db.models.project, {
  foreignKey: 'county_id'
})

db.models.project.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id'
})

db.models.subcounty.hasMany(db.models.project, {
  foreignKey: 'subcounty_id'
})



// Public Facility   - settleemnt/county/subc
db.models.public_facility.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})

db.models.settlement.hasMany(db.models.public_facility, {
  foreignKey: 'settlement_id'
})


 
db.models.public_facility.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})

db.models.county.hasMany(db.models.public_facility, {
  foreignKey: 'county_id'
})

db.models.public_facility.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id'
})

db.models.subcounty.hasMany(db.models.public_facility, {
  foreignKey: 'subcounty_id'
})





// Project   - programme
db.models.project.belongsTo(db.models.programme, {
  foreignKey: 'programme_id'
})

db.models.programme.hasMany(db.models.project, {
  foreignKey: 'programme_id'
})

// Project   - component 
db.models.project.belongsTo(db.models.component, {
  foreignKey: 'component_id'
})

db.models.component.hasMany(db.models.project, {
  foreignKey: 'component_id'
})

// Project   - Domain 
db.models.project.belongsTo(db.models.domain, {
  foreignKey: 'domain_id'
})

db.models.domain.hasMany(db.models.project, {
  foreignKey: 'domain_id'
})

// Project category  - Component  
db.models.project_category.belongsTo(db.models.component, {
  foreignKey: 'component_id'
})

db.models.component.hasMany(db.models.project_category, {
  foreignKey: 'component_id'
})

// Project menu  - Project Categrory   
db.models.project.belongsTo(db.models.project_category, {
  foreignKey: 'category_id'
})

db.models.project_category.hasMany(db.models.project, {
  foreignKey: 'category_id'
})
 
// component    - focus 

db.models.component.belongsTo(db.models.domain, {
  foreignKey: 'domain_id'
})

db.models.domain.hasMany(db.models.component, {
  foreignKey: 'domain_id'
})


// Component    - Programment
db.models.component.belongsTo(db.models.programme, {
  foreignKey: 'programme_id'
})

db.models.programme.hasMany(db.models.component, {
  foreignKey: 'programme_id'
})


// Docuemntation  - indicator_category_report
db.models.document.belongsTo(db.models.indicator_category_report, {
  foreignKey: 'report_id',
})

db.models.indicator_category_report.hasMany(db.models.document, {
  foreignKey: 'report_id'
})

db.models.document.belongsTo(db.models.project, {
  foreignKey: 'project_id',
})

db.models.project.hasMany(db.models.document, {
  foreignKey: 'project_id'
})


db.models.document.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id',
})

db.models.settlement.hasMany(db.models.document, {
  foreignKey: 'settlement_id'
})


db.models.subcounty.belongsTo(db.models.county, {
  foreignKey: 'county_id',
})

db.models.county.hasMany(db.models.subcounty, {
  foreignKey: 'county_id'
})


// db.models.document.belongsTo(db.models.indicator_category_report, {
//   foreignKey: 'parent_code',
//   targetKey:'code'
// })

// db.models.indicator_category_report.hasMany(db.models.document, {
//   foreignKey: 'parent_code'
// })


// db.models.document.belongsTo(db.models.project, {
//   foreignKey: 'project_code',
// })

// db.models.project.hasMany(db.models.document, {
//   foreignKey: 'project_code'
// })

 



//db.ROLES = ["user", "admin", "editor",  "moderator"];
module.exports = db
