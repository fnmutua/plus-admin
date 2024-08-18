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


// subcounty  and ward associations
db.models.subcounty.hasMany(db.models.ward, {
  foreignKey: 'subcounty_id'
})

db.models.ward.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id'
})


// Ward  and settlemnt associations
db.models.ward.hasMany(db.models.settlement, {
  foreignKey: 'ward_id'
})

db.models.settlement.belongsTo(db.models.ward, {
  foreignKey: 'ward_id'
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


db.models.ward.hasMany(db.models.households, {
  foreignKey: 'ward_id'
})

db.models.households.belongsTo(db.models.ward, {
  foreignKey: 'ward_id'
})


// Beneficiaries - Cooutny 
db.models.county.hasMany(db.models.project_beneficiary, {
  foreignKey: 'county_id'
})

db.models.project_beneficiary.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})
// Beneficiaries -Ward 
db.models.subcounty.hasMany(db.models.project_beneficiary, {
  foreignKey: 'subcounty_id'
})

db.models.project_beneficiary.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id'
})


// Beneficiaries -Ward 
db.models.ward.hasMany(db.models.project_beneficiary, {
  foreignKey: 'ward_id'
})

db.models.project_beneficiary.belongsTo(db.models.ward, {
  foreignKey: 'ward_id'
})

// Beneficiaries -Ward 
db.models.settlement.hasMany(db.models.project_beneficiary, {
  foreignKey: 'settlement_id'
})

db.models.project_beneficiary.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
}) 
// Beneficiaries -Ward 

db.models.county.hasMany(db.models.project_location, {
  foreignKey: 'county_id'
})

db.models.project_location.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})







// Beneficiaries - Cooutny 
db.models.county.hasMany(db.models.project_location, {
  foreignKey: 'county_id'
})

db.models.project_location.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})
// Beneficiaries -Ward 
db.models.subcounty.hasMany(db.models.project_location, {
  foreignKey: 'subcounty_id'
})

db.models.project_location.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id'
})


// Beneficiaries -Ward 
db.models.ward.hasMany(db.models.project_location, {
  foreignKey: 'ward_id'
})

db.models.project_location.belongsTo(db.models.ward, {
  foreignKey: 'ward_id'
})

// Beneficiaries -Ward 
db.models.settlement.hasMany(db.models.project_location, {
  foreignKey: 'settlement_id'
})

db.models.project_location.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
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

 



//Beneficiriaes 
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
 




db.models.beneficiary.belongsTo(db.models.component, {
  foreignKey: 'component_id'
})

db.models.component.hasMany(db.models.beneficiary, {
  foreignKey: 'component_id'
})


db.models.beneficiary.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})

db.models.settlement.hasMany(db.models.beneficiary, {
  foreignKey: 'settlement_id'
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


db.models.health_facility.belongsTo(db.models.ward, {
  foreignKey: 'ward_id'
})

db.models.ward.hasMany(db.models.health_facility, {
  foreignKey: 'ward_id'
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


db.models.education_facility.belongsTo(db.models.ward, {
  foreignKey: 'ward_id'
})

db.models.ward.hasMany(db.models.education_facility, {
  foreignKey: 'ward_id'
})





/// Roads
db.models.road.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})

db.models.settlement.hasMany(db.models.road, {
  foreignKey: 'settlement_id'
})


db.models.road.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})

db.models.county.hasMany(db.models.road, {
  foreignKey: 'county_id'
})


db.models.road.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id'
})

db.models.subcounty.hasMany(db.models.road, {
  foreignKey: 'subcounty_id'
})


db.models.road.belongsTo(db.models.ward, {
  foreignKey: 'ward_id'
})

db.models.ward.hasMany(db.models.road, {
  foreignKey: 'ward_id'
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



db.models.water_point.belongsTo(db.models.ward, {
  foreignKey: 'ward_id'
})

db.models.ward.hasMany(db.models.water_point, {
  foreignKey: 'ward_id'
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


db.models.water_point.belongsTo(db.models.sewer, {
  foreignKey: 'ward_id'
})

db.models.sewer.hasMany(db.models.water_point, {
  foreignKey: 'ward_id'
})



/// Piped Water  
db.models.piped_water.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})

db.models.settlement.hasMany(db.models.piped_water, {
  foreignKey: 'settlement_id'
})

db.models.piped_water.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})

db.models.county.hasMany(db.models.piped_water, {
  foreignKey: 'county_id'
})


db.models.piped_water.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id'
})

db.models.subcounty.hasMany(db.models.piped_water, {
  foreignKey: 'subcounty_id'
})

 

db.models.water_point.belongsTo(db.models.piped_water, {
  foreignKey: 'ward_id'
})

db.models.piped_water.hasMany(db.models.water_point, {
  foreignKey: 'ward_id'
})




db.models.document.belongsTo(db.models.piped_water, {
  foreignKey: 'piped_water_id',
})

db.models.piped_water.hasMany(db.models.document, {
  foreignKey: 'piped_water_id'
})



db.models.document.belongsTo(db.models.road_asset, {
  foreignKey: 'road_asset_id',
})

db.models.road_asset.hasMany(db.models.document, {
  foreignKey: 'road_asset_id'
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


db.models.water_point.belongsTo(db.models.other_facility, {
  foreignKey: 'ward_id'
})

db.models.other_facility.hasMany(db.models.water_point, {
  foreignKey: 'ward_id'
})






/// indicator-category - category  
db.models.indicator_category.belongsTo(db.models.category, {
  foreignKey: 'category_id'
})

db.models.category.hasMany(db.models.indicator_category, {
  foreignKey: 'category_id'
})


/// indicator-category - category  
db.models.indicator_category.belongsTo(db.models.project_location, {
  foreignKey: 'project_location_id'
})

db.models.project_location.hasMany(db.models.indicator_category, {
  foreignKey: 'project_location_id'
})




/// Project locaation - Project   
db.models.project_location.belongsTo(db.models.project, {
  foreignKey: 'project_id'
})

db.models.project.hasMany(db.models.project_location, {
  foreignKey: 'project_id'
})



/// indicator-project_beneficiary - project_location_id  
db.models.project_beneficiary.belongsTo(db.models.project_location, {
  foreignKey: 'project_location_id'
})

db.models.project_location.hasMany(db.models.project_beneficiary, {
  foreignKey: 'project_location_id'
})

/// indicator-project_beneficiary - Project Location  
db.models.project_beneficiary.belongsTo(db.models.project , {
  foreignKey: 'project_id'
})

db.models.project.hasMany(db.models.project_beneficiary, {
  foreignKey: 'project_id'
})


// document  - contractor
db.models.document.belongsTo(db.models.project_beneficiary, {
  foreignKey: 'beneficiary_report_id'
})

db.models.project_beneficiary.hasMany(db.models.document, {
  foreignKey: 'beneficiary_report_id'
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
  foreignKey: 'indicator_category_id',
 
})

db.models.indicator_category.hasMany(db.models.indicator_category_report, {
  foreignKey: 'indicator_category_id',
 
})


// county  - indicator_category_report
db.models.indicator_category_report.belongsTo(db.models.project, {
  foreignKey: 'project_id'
})

db.models.project.hasMany(db.models.indicator_category_report, {
  foreignKey: 'project_id'
})

// project  - contractor
db.models.project.belongsTo(db.models.contractor, {
  foreignKey: 'contractor_id'
})

db.models.contractor.hasMany(db.models.project, {
  foreignKey: 'contractor_id'
})

// document  - contractor
db.models.document.belongsTo(db.models.contractor, {
  foreignKey: 'contractor_id'
})

db.models.contractor.hasMany(db.models.document, {
  foreignKey: 'contractor_id'
})





// indicator_category_report  - programme_implementation
db.models.indicator_category_report.belongsTo(db.models.programme_implementation, {
  foreignKey: 'programme_implementation_id'
})

db.models.programme_implementation.hasMany(db.models.indicator_category_report, {
  foreignKey: 'programme_implementation_id'
})


// indicator_category_report  - programme_implementation
db.models.indicator_category_report.belongsTo(db.models.users, {
  foreignKey: 'userId'
})

db.models.users.hasMany(db.models.indicator_category_report, {
  foreignKey: 'userId'
})

// indicator_category_report  - programme_implementation
db.models.evaluation.belongsTo(db.models.users, {
  foreignKey: 'createdBy'
})

db.models.users.hasMany(db.models.evaluation, {
  foreignKey: 'createdBy'
})




// subcounty  - indicator_category_report
db.models.indicator_category_report.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id'
})

db.models.subcounty.hasMany(db.models.indicator_category_report, {
  foreignKey: 'subcounty_id'
})



// subcounty  - indicator_category_report
db.models.indicator_category_report.belongsTo(db.models.ward, {
  foreignKey: 'ward_id'
})

db.models.ward.hasMany(db.models.indicator_category_report, {
  foreignKey: 'ward_id'
})



// settlement  - indicator_category_report
db.models.indicator_category_report.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})

// settlement  - indicator_category_report
db.models.indicator_category_report.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})



// user  - indicator_category_report
db.models.feedback.belongsTo(db.models.users, {
  foreignKey: 'actionedBy'
})

db.models.users.hasMany(db.models.feedback, {
  foreignKey: 'actionedBy'
})







// user  - indicator_category_report
db.models.indicator_category_report.belongsTo(db.models.users, {
  foreignKey: 'userId'
})

db.models.users.hasMany(db.models.indicator_category_report, {
  foreignKey: 'userId'
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




// Project   - component 
db.models.project.belongsTo(db.models.component, {
  foreignKey: 'component_id'
})

db.models.component.hasMany(db.models.project, {
  foreignKey: 'component_id'
})


// Project category  - Component  
db.models.project_category.belongsTo(db.models.component, {
  foreignKey: 'component_id'
})

db.models.component.hasMany(db.models.project_category, {
  foreignKey: 'component_id'
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


// Docuemntation  - indicator_category_report
db.models.document_type.belongsTo(db.models.document_category, {
  foreignKey: 'category_id',
})

db.models.document_category.hasMany(db.models.document_type, {
  foreignKey: 'category_id'
})










// activity  - indicator_categor 
db.models.indicator_category.belongsTo(db.models.activity, {
  foreignKey: 'activity_id',
})

db.models.activity.hasMany(db.models.indicator_category, {
  foreignKey: 'activity_id'
})   

  

// project  - indicator_category 
db.models.indicator_category.belongsTo(db.models.project, {
  foreignKey: 'project_id',
 
})

db.models.project.hasMany(db.models.indicator_category, {
  foreignKey: 'project_id',
 
})   











db.models.document.belongsTo(db.models.project, {
  foreignKey: 'project_id',
})

db.models.project.hasMany(db.models.document, {
  foreignKey: 'project_id'
})


db.models.document.belongsTo(db.models.health_facility, {
  foreignKey: 'health_facility_id',
})

db.models.health_facility.hasMany(db.models.document, {
  foreignKey: 'health_facility_id'
})

db.models.document.belongsTo(db.models.education_facility, {
  foreignKey: 'education_facility_id',
})

db.models.education_facility.hasMany(db.models.document, {
  foreignKey: 'education_facility_id'
})


db.models.document.belongsTo(db.models.road, {
  foreignKey: 'road_id',
})

db.models.road.hasMany(db.models.document, {
  foreignKey: 'road_id'
})


db.models.document.belongsTo(db.models.road_asset, {
  foreignKey: 'road_asset_id',
})

db.models.road_asset.hasMany(db.models.document, {
  foreignKey: 'road_asset_id'
})


db.models.document.belongsTo(db.models.water_point, {
  foreignKey: 'water_point_id',
})

db.models.water_point.hasMany(db.models.document, {
  foreignKey: 'water_point_id'
})




db.models.document.belongsTo(db.models.sewer, {
  foreignKey: 'sewer_id',
})

db.models.sewer.hasMany(db.models.document, {
  foreignKey: 'sewer_id'
})


db.models.document.belongsTo(db.models.other_facility, {
  foreignKey: 'other_facility_id',
})

db.models.other_facility.hasMany(db.models.document, {
  foreignKey: 'other_facility_id'
})






db.models.document.belongsTo(db.models.households, {
  foreignKey: 'hh_id',
})

db.models.households.hasMany(db.models.document, {
  foreignKey: 'hh_id'
})

 
db.models.document.belongsTo(db.models.document_type, {
  foreignKey: 'category',
})

db.models.document_type.hasMany(db.models.document, {
  foreignKey: 'category'
})




db.models.document.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id',
})

db.models.settlement.hasMany(db.models.document, {
  foreignKey: 'settlement_id'
})


// Docuemnt by User

db.models.document.belongsTo(db.models.users, {
  foreignKey: 'createdBy',
})

db.models.users.hasMany(db.models.document, {
  foreignKey: 'createdBy'
})



db.models.subcounty.belongsTo(db.models.county, {
  foreignKey: 'county_id',
})

db.models.county.hasMany(db.models.subcounty, {
  foreignKey: 'county_id'
})


//Project    - Activty 
db.models.project.belongsToMany(db.models.activity, {
  through: 'project_activity',
  foreignKey: 'project_id',
  otherKey: 'activity_id'
})
db.models.activity.belongsToMany(db.models.project, {
  through: 'project_activity',
  foreignKey: 'activity_id',
  otherKey: 'project_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
})

 
//Activty - INDICATOR

db.models.indicator.belongsTo(db.models.activity, {
  foreignKey: 'activity_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
})

db.models.activity.hasMany(db.models.indicator, {
  foreignKey: 'activity_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
})


// Evaluation - Evaluation Types
db.models.evaluation.belongsTo(db.models.evaluation_type, {
  foreignKey: 'evaluation_type_id',
})

db.models.evaluation_type.hasMany(db.models.evaluation, {
  foreignKey: 'evaluation_type_id'
})



db.models.document.belongsTo(db.models.evaluation, {
  foreignKey: 'evaluation_id',
})

db.models.evaluation.hasMany(db.models.document, {
  foreignKey: 'evaluation_id'
})



db.models.evaluation.belongsTo(db.models.project, {
  foreignKey: 'project_id',
})

db.models.project.hasMany(db.models.evaluation, {
  foreignKey: 'project_id'
})



// Programme_implementation - Proejct 
db.models.project.belongsTo(db.models.programme_implementation, {
  foreignKey: 'implementation_id',
})

db.models.programme_implementation.hasMany(db.models.project, {
  foreignKey: 'implementation_id'
})

 

// Link owners with data 
// settleemnts creaters

db.models.settlement.belongsTo(db.models.users, {
  foreignKey: 'createdBy',
  attributes: { exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken'] }

})

db.models.users.hasMany(db.models.settlement, {
  foreignKey: 'createdBy',
  attributes: { exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken'] }

})

// health_facility creaters
db.models.health_facility.belongsTo(db.models.users, {
  foreignKey: 'createdBy',
  attributes: { exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken'] }

})

db.models.users.hasMany(db.models.health_facility, {
  foreignKey: 'createdBy',
  attributes: { exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken'] }

})



// education_facility creaters
db.models.education_facility.belongsTo(db.models.users, {
  foreignKey: 'createdBy',
  attributes: { exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken'] }

})

db.models.users.hasMany(db.models.education_facility, {
  foreignKey: 'createdBy',
  attributes: { exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken'] }

})


// other_facility creaters
db.models.other_facility.belongsTo(db.models.users, {
  foreignKey: 'createdBy',
  attributes: { exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken'] }

})

db.models.users.hasMany(db.models.other_facility, {
  foreignKey: 'createdBy',
  attributes: { exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken'] }

})



// other_facility creaters
db.models.piped_water.belongsTo(db.models.users, {
  foreignKey: 'createdBy',
  attributes: { exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken'] }

})

db.models.users.hasMany(db.models.piped_water, {
  foreignKey: 'createdBy',
  attributes: { exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken'] }

})



// other_facility creaters
db.models.water_point.belongsTo(db.models.users, {
  foreignKey: 'createdBy',
  attributes: { exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken'] }

})

db.models.users.hasMany(db.models.water_point, {
  foreignKey: 'createdBy',
  attributes: { exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken'] }

})



// SEWER creaters
db.models.sewer.belongsTo(db.models.users, {
  foreignKey: 'createdBy',
  attributes: { exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken'] }

})

db.models.users.hasMany(db.models.sewer, {
  foreignKey: 'createdBy',
  attributes: { exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken'] }

})


// Roads creaters
db.models.road.belongsTo(db.models.users, {
  foreignKey: 'createdBy',
  attributes: { exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken'] }

})

db.models.users.hasMany(db.models.road, {
  foreignKey: 'createdBy',
  attributes: { exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken'] }

})


// Dashbaord - Cardss
db.models.dashboard_card.belongsTo(db.models.dashboard, {
  foreignKey: 'dashboard_id',
 
})

db.models.dashboard.hasMany(db.models.dashboard_card, {
  foreignKey: 'dashboard_id',
 
})


// Dashbaord - Cardss
db.models.dashboard_card.belongsTo(db.models.indicator, {
  foreignKey: 'indicator_id',
 
})

db.models.indicator.hasMany(db.models.dashboard_card, {
  foreignKey: 'indicator_id',
 
})



// Dashbaord - Sections
db.models.dashboard_section.belongsTo(db.models.dashboard, {
  foreignKey: 'dashboard_id',
 
})

db.models.dashboard.hasMany(db.models.dashboard_section, {
  foreignKey: 'dashboard_id',
 
})



// section  - Programmes
db.models.dashboard_section.belongsTo(db.models.programme, {
  foreignKey: 'programme_id',
 
})

db.models.programme.hasMany(db.models.dashboard_section, {
  foreignKey: 'programme_id',
 
})


// section  - Chart
db.models.dashboard_section_chart.belongsTo(db.models.dashboard_section, {
  foreignKey: 'dashboard_section_id',
 
})

db.models.dashboard_section.hasMany(db.models.dashboard_section_chart, {
  foreignKey: 'dashboard_section_id',
 
})



//dashboard_section_chart    - indicator_category 
db.models.dashboard_section_chart.belongsToMany(db.models.indicator, {
  through: 'chart_indicator',
  foreignKey: 'dashboard_section_chart_id',
  otherKey: 'indicator_id'
})
db.models.indicator.belongsToMany(db.models.dashboard_section_chart, {
  through: 'chart_indicator',
  foreignKey: 'indicator_id',
  otherKey: 'dashboard_section_chart_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
})





//db.ROLES = ["user", "admin", "editor",  "moderator"];
module.exports = db
