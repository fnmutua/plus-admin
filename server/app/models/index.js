const config = require('../config/db.config.js')
const Sequelize = require('sequelize')
const sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
  host: config.HOST,
  port: config.PORT,
  dialect: config.dialect,
  pool: {
    max: config.pool.max,
    min: config.pool.min,
    acquire: config.pool.acquire,
    idle: config.pool.idle
  },
  define: {
    timestamps: false
  },
  logging: false, // Felix - Disable logging

})
const db = {}
db.Sequelize = Sequelize
db.sequelize = sequelize
db.user = require('../models/user.js')(sequelize, Sequelize)
db.role = require('../models/role.js')(sequelize, Sequelize)
db.permission = require('../models/permission.js')(sequelize, Sequelize)
db.role_permission = require('../models/role_permissions.js')(sequelize, Sequelize)

// Chat models
db.chatMessage = require('../models/chat_message.js')(sequelize)
db.chatMessageStatus = require('../models/chat_message_status.js')(sequelize)
db.userStatus = require('../models/user_status.js')(sequelize)

// Video streaming models
db.videoStream = require('../models/videoStream.js')(sequelize, Sequelize)
db.auditLog = require('../models/audit_log.js')(sequelize, Sequelize)

var initModels = require('../models/init-models.js')
db.models = initModels(sequelize)

function registerAuditHooks() {
  const excludedModels = new Set(['audit_log', 'page_visit', 'user_roles'])
  const modelEntries = Object.entries(db.models || {})

  modelEntries.forEach(([modelName, model]) => {
    if (!model || typeof model.addHook !== 'function') return
    if (excludedModels.has(modelName)) return
    if (model.__auditHooksRegistered) return
    model.__auditHooksRegistered = true

    model.addHook('afterCreate', async (instance) => {
      const { logAuditForModelEvent } = require('../utils/auditTrail')
      await logAuditForModelEvent({
        modelName,
        action: 'create',
        instance,
        after: instance && instance.dataValues ? instance.dataValues : null
      })
    })

    model.addHook('afterUpdate', async (instance) => {
      const { logAuditForModelEvent } = require('../utils/auditTrail')
      const changedFields = typeof instance.changed === 'function' ? instance.changed() || [] : []
      const before = {}
      changedFields.forEach((field) => {
        before[field] = instance._previousDataValues ? instance._previousDataValues[field] : undefined
      })

      const after = {}
      changedFields.forEach((field) => {
        after[field] = instance.dataValues ? instance.dataValues[field] : undefined
      })

      await logAuditForModelEvent({
        modelName,
        action: 'update',
        instance,
        before,
        after
      })
    })

    model.addHook('afterDestroy', async (instance) => {
      const { logAuditForModelEvent } = require('../utils/auditTrail')
      await logAuditForModelEvent({
        modelName,
        action: 'delete',
        instance,
        before: instance && instance.dataValues ? instance.dataValues : null
      })
    })

    model.addHook('afterBulkUpdate', async (options) => {
      const { logAuditForModelEvent } = require('../utils/auditTrail')
      await logAuditForModelEvent({
        modelName,
        action: 'update',
        instance: null,
        metadata: {
          bulk: true,
          where: options && options.where ? options.where : null,
          fields: options && options.fields ? options.fields : null
        }
      })
    })

    model.addHook('afterBulkDestroy', async (options) => {
      const { logAuditForModelEvent } = require('../utils/auditTrail')
      await logAuditForModelEvent({
        modelName,
        action: 'delete',
        instance: null,
        metadata: {
          bulk: true,
          where: options && options.where ? options.where : null
        }
      })
    })
  })
}

registerAuditHooks()

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

// Chat model associations
db.user.hasMany(db.chatMessage, { foreignKey: 'sender_id', as: 'sentMessages' })
db.user.hasMany(db.chatMessage, { foreignKey: 'receiver_id', as: 'receivedMessages' })
db.chatMessage.belongsTo(db.user, { foreignKey: 'sender_id', as: 'sender' })
db.chatMessage.belongsTo(db.user, { foreignKey: 'receiver_id', as: 'receiver' })

db.chatMessage.hasMany(db.chatMessageStatus, { foreignKey: 'message_id', as: 'statusUpdates' })
db.chatMessageStatus.belongsTo(db.chatMessage, { foreignKey: 'message_id', as: 'message' })
db.chatMessageStatus.belongsTo(db.user, { foreignKey: 'user_id', as: 'user' })

db.user.hasOne(db.userStatus, { foreignKey: 'user_id', as: 'status' })
db.userStatus.belongsTo(db.user, { foreignKey: 'user_id', as: 'user' })

// Video streaming model associations
db.user.hasMany(db.videoStream, { foreignKey: 'user_id', as: 'streams' })
db.videoStream.belongsTo(db.user, { foreignKey: 'user_id', as: 'streamer' })

// Role <-> Permission (many-to-many)
db.role.belongsToMany(db.permission, {
  through: 'role_permissions',
  foreignKey: 'roleid',
  otherKey: 'permissionid'
})
db.permission.belongsToMany(db.role, {
  through: 'role_permissions',
  foreignKey: 'permissionid',
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

// Incident History associations
db.models.incident_history.belongsTo(db.models.users, {
  foreignKey: 'changed_by',
  as: 'user'
})

db.models.users.hasMany(db.models.incident_history, {
  foreignKey: 'changed_by',
  as: 'incidentHistories'
})

db.models.incident_history.belongsTo(db.models.incident, {
  foreignKey: 'incident_id',
  as: 'incident'
})

db.models.incident.hasMany(db.models.incident_history, {
  foreignKey: 'incident_id',
  as: 'histories'
})
 




db.models.user_roles.belongsTo(db.user, {
  foreignKey: 'userid'
})

db.user.hasMany(db.models.user_roles, {
  foreignKey: 'userid'
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




db.models.county.hasMany(db.models.ward, {
  foreignKey: 'county_id'
})

db.models.ward.belongsTo(db.models.county, {
  foreignKey: 'county_id'
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



// project Lcoation  -project 

 




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

// Climate assessment (KISIP Tool B)
db.models.settlement.hasMany(db.models.climate_assessment, {
  foreignKey: 'settlement_id'
})
db.models.climate_assessment.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})
db.models.county.hasMany(db.models.climate_assessment, {
  foreignKey: 'county_id'
})
db.models.climate_assessment.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})
db.models.climate_assessment.belongsTo(db.models.users, {
  foreignKey: 'assessor_id',
  as: 'assessor'
})
db.models.users.hasMany(db.models.climate_assessment, {
  foreignKey: 'assessor_id',
  as: 'climateAssessments'
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


db.models.sewer.belongsTo(db.models.ward, {
  foreignKey: 'ward_id'
})

db.models.ward.hasMany(db.models.sewer, {
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

 

db.models.piped_water.belongsTo(db.models.ward, {
  foreignKey: 'ward_id'
})

db.models.ward.hasMany(db.models.piped_water, {
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

db.models.road_asset.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})

db.models.settlement.hasMany(db.models.road_asset, {
  foreignKey: 'settlement_id'
})


/// Powerline Assets
db.models.powerline_asset.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})

db.models.settlement.hasMany(db.models.powerline_asset, {
  foreignKey: 'settlement_id'
})


/// Railway Assets
db.models.railway_asset.belongsTo(db.models.railway, {
  foreignKey: 'railway_id'
})

db.models.railway.hasMany(db.models.railway_asset, {
  foreignKey: 'railway_id'
})

db.models.railway_asset.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})

db.models.settlement.hasMany(db.models.railway_asset, {
  foreignKey: 'settlement_id'
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


db.models.other_facility.belongsTo(db.models.ward, {
  foreignKey: 'ward_id'
})

db.models.ward.hasMany(db.models.other_facility, {
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



db.models.project_contractor.belongsTo(db.models.project, {
  foreignKey: 'project_id'
})

db.models.project.hasMany(db.models.project_contractor, {
  foreignKey: 'project_id'
})

// Project Clock-in associations
db.models.project_clockin.belongsTo(db.models.project_location, {
  foreignKey: 'project_location_id',
  as: 'projectLocation'
})

db.models.project_clockin.belongsTo(db.models.project_team, {
  foreignKey: 'team_member_id',
  as: 'teamMember'
})

db.models.project_location.hasMany(db.models.project_clockin, {
  foreignKey: 'project_location_id',
  as: 'clockIns'
})

db.models.project_team.hasMany(db.models.project_clockin, {
  foreignKey: 'team_member_id',
  as: 'clockIns'
})


db.models.project.hasMany(db.models.project_clockin, {
  foreignKey: 'project_id',
  as: 'clockInsProjects'
})

db.models.project_clockin.belongsTo(db.models.project, {
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



// Activcty  - indicator_category_report
db.models.indicator_category_report.belongsTo(db.models.activity, {
  foreignKey: 'activity_id'
})

db.models.activity.hasMany(db.models.indicator_category_report, {
  foreignKey: 'activity_id'
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



  // programme - self reference (parent-child relationship)
db.models.programme.belongsTo(db.models.programme, {
  as: 'parent',
  foreignKey: 'parentId',
  onUpdate: 'CASCADE',
  onDelete: 'SET NULL',
});

db.models.programme.hasMany(db.models.programme, {
  as: 'children',
  foreignKey: 'parentId',
  onUpdate: 'CASCADE',
  onDelete: 'SET NULL',
});




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

// Document share associations
if (db.models.document_share && db.models.document_share_item) {
  db.models.document_share.belongsTo(db.models.users, { foreignKey: 'createdBy', as: 'creator' })
  db.models.users.hasMany(db.models.document_share, { foreignKey: 'createdBy', as: 'documentShares' })

  db.models.document_share_item.belongsTo(db.models.document_share, { foreignKey: 'share_id', as: 'share' })
  db.models.document_share.hasMany(db.models.document_share_item, { foreignKey: 'share_id', as: 'items' })

  db.models.document_share_item.belongsTo(db.models.document, { foreignKey: 'document_id', as: 'document' })
  db.models.document.hasMany(db.models.document_share_item, { foreignKey: 'document_id', as: 'shares' })
}



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
db.models.dashboard_card.belongsTo(db.models.indicator_category, {
  foreignKey: 'indicator_category_id',
 
})

db.models.indicator_category.hasMany(db.models.dashboard_card, {
  foreignKey: 'indicator_category_id',
 
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


//Greivances  - Admin 
db.models.grievance.belongsTo(db.models.county, {
  foreignKey: 'county_id',
})

db.models.county.hasMany(db.models.grievance, {
  foreignKey: 'county_id'
})

db.models.grievance.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id',
})

db.models.subcounty.hasMany(db.models.grievance, {
  foreignKey: 'subcounty_id'
})


db.models.grievance.belongsTo(db.models.ward, {
  foreignKey: 'ward_id',
})

db.models.ward.hasMany(db.models.grievance, {
  foreignKey: 'ward_id'
})



db.models.grievance.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id',
})

db.models.settlement.hasMany(db.models.grievance, {
  foreignKey: 'settlement_id'
})

// Incidents - Geographic relationships (same as grievances)
db.models.incident.belongsTo(db.models.county, {
  foreignKey: 'county_id',
})

db.models.county.hasMany(db.models.incident, {
  foreignKey: 'county_id'
})

db.models.incident.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id',
})

db.models.subcounty.hasMany(db.models.incident, {
  foreignKey: 'subcounty_id'
})

db.models.incident.belongsTo(db.models.ward, {
  foreignKey: 'ward_id',
})

db.models.ward.hasMany(db.models.incident, {
  foreignKey: 'ward_id'
})

db.models.incident.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id',
})

db.models.settlement.hasMany(db.models.incident, {
  foreignKey: 'settlement_id'
})





db.models.grievance.belongsTo(db.models.users, {
  foreignKey: 'reffered_to_officer',
  as: 'users'
})

db.models.users.hasMany(db.models.grievance, {
  foreignKey: 'reffered_to_officer',
  as: 'grievances'
})








 
// Grievance Actions belongs to Grievance
db.models.grievance_log.belongsTo(db.models.grievance, {
  foreignKey: 'grievance_id',
  onDelete: 'CASCADE' // Cascade delete
});

// Grievance has many Grievance Actions
db.models.grievance.hasMany(db.models.grievance_log, {
  foreignKey: 'grievance_id',
  onDelete: 'CASCADE' // Cascade delete
});

// grievance_document  - grievance
db.models.grievance_document.belongsTo(db.models.grievance, {
  foreignKey: 'grievance_id'
})

db.models.grievance.hasMany(db.models.grievance_document, {
  foreignKey: 'grievance_id'
})




// Define associations
db.models.grievance_notification.belongsTo(db.models.grievance, {
  foreignKey: 'grievance_id',
  onDelete: 'SET NULL',  // Ensures foreign key is set to NULL on deletion
});

db.models.grievance.hasMany(db.models.grievance_notification, {
  foreignKey: 'grievance_id',
  onDelete: 'SET NULL',  // Ensures dependent records' foreign key is set to NULL
});






// grievance_document  - grievance
db.models.grievance_document.belongsTo(db.models.grievance_log, {
  foreignKey: 'action_id'
})

db.models.grievance_log.hasMany(db.models.grievance_document, {
  foreignKey: 'action_id'
})

// grievance  - grievance_resolution_level
// db.models.grievance.belongsTo(db.models.grievance_resolution_level, {
//   foreignKey: 'current_level'
// })

// db.models.grievance_resolution_level.hasMany(db.models.grievance, {
//   foreignKey: 'current_level'
// })




// Grievance -Escalation
db.models.grievance_escalation.belongsTo(db.models.grievance, {
  foreignKey: 'grievance_id'
})

db.models.grievance.hasMany(db.models.grievance_escalation, {
  foreignKey: 'grievance_id'
})

 
// Grievance - Resolution
db.models.grievance_resolution.belongsTo(db.models.grievance, {
  foreignKey: 'grievance_id'
})

db.models.grievance.hasMany(db.models.grievance_resolution, {
  foreignKey: 'grievance_id'
})
 

// Grievance Escalation  - Users
db.models.grievance_escalation.belongsTo(db.models.users, {
  foreignKey: 'escalated_by'
})

db.models.users.hasMany(db.models.grievance_escalation, {
  foreignKey: 'escalated_by'
})
 
db.models.grievance_escalation.belongsTo(db.models.users, {
  foreignKey: 'escalated_to'
})

db.models.users.hasMany(db.models.grievance_escalation, {
  foreignKey: 'escalated_to'
})
 
// Grievance Resolution  - Users
 db.models.grievance_resolution.belongsTo(db.models.users, {
  foreignKey: 'resolved_by'
})

db.models.users.hasMany(db.models.grievance_resolution, {
  foreignKey: 'resolved_by'
})


 
// Grievance Resolution  - Level
db.models.grievance_resolution.belongsTo(db.models.grievance_resolution_level, {
  foreignKey: 'resolution_level'
})

db.models.grievance_resolution_level.hasMany(db.models.grievance_resolution, {
  foreignKey: 'resolution_level'
})



// Grievance Actions belongs to Grievance
db.models.grievance_log.belongsTo(db.models.users, {
  foreignKey: 'action_by',
  as: 'user'
 });

// Grievance has many Grievance Actions
db.models.users.hasMany(db.models.grievance_log, {
  foreignKey: 'action_by',
 });


 
// user  - indicator_category_report
db.models.otp.belongsTo(db.models.users, {
  foreignKey: 'user_id'
})

db.models.users.hasMany(db.models.otp, {
  foreignKey: 'user_id'
})



db.models.structure.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})

db.models.settlement.hasMany(db.models.structure, {
  foreignKey: 'settlement_id'
})



db.models.document.belongsTo(db.models.article, {
  foreignKey: 'article_id',
})

db.models.article.hasMany(db.models.document, {
  foreignKey: 'article_id'
})

// document_link associations
db.models.document_link.belongsTo(db.models.document, { foreignKey: 'document_id', as: 'linked_document' })
db.models.document.hasMany(db.models.document_link, { foreignKey: 'document_id', as: 'entity_links' })

db.models.settlement_history.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id',
  onDelete: 'SET NULL', // Ensures the foreign key is set to NULL when the parent is deleted

})

db.models.settlement.hasMany(db.models.settlement_history, {
  foreignKey: 'settlement_id'
})

db.models.settlement_population.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id',
  onDelete: 'CASCADE',
})

db.models.settlement.hasMany(db.models.settlement_population, {
  foreignKey: 'settlement_id',
})

db.models.county_population_growth_rate.belongsTo(db.models.county, {
  foreignKey: 'county_id',
  onDelete: 'CASCADE',
})

db.models.county.hasMany(db.models.county_population_growth_rate, {
  foreignKey: 'county_id',
})

db.models.settlement_history.belongsTo(db.models.users, {
  foreignKey: 'changed_by',
  onDelete: 'SET NULL', // Ensures the foreign key is set to NULL when the parent is deleted

})

db.models.users.hasMany(db.models.settlement_history, {
  foreignKey: 'changed_by'
})



// Grievance History

db.models.grievance_history.belongsTo(db.models.grievance, {
  foreignKey: 'grievance_id',
 // onDelete: 'SET NULL', // Ensures the foreign key is set to NULL when the parent is deleted

})

db.models.grievance.hasMany(db.models.grievance_history, {
  foreignKey: 'grievance_id'
})


db.models.grievance_history.belongsTo(db.models.users, {
  foreignKey: 'changed_by',
 // onDelete: 'SET NULL', // Ensures the foreign key is set to NULL when the parent is deleted

})

db.models.users.hasMany(db.models.grievance_history, {
  foreignKey: 'changed_by'
})



db.models.disbursement.belongsTo(db.models.project, {
  foreignKey: 'project_id',
})

db.models.project.hasMany(db.models.disbursement, {
  foreignKey: 'project_id'
})












/// Powerline   
db.models.powerline.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})

db.models.settlement.hasMany(db.models.powerline, {
  foreignKey: 'settlement_id'
})

db.models.powerline.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})

db.models.county.hasMany(db.models.powerline, {
  foreignKey: 'county_id'
})


db.models.powerline.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id'
})

db.models.subcounty.hasMany(db.models.powerline, {
  foreignKey: 'subcounty_id'
})


db.models.powerline.belongsTo(db.models.ward, {
  foreignKey: 'ward_id'
})

db.models.ward.hasMany(db.models.powerline, {
  foreignKey: 'ward_id'
})




/// Railway   
db.models.railway.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})
db.models.settlement.hasMany(db.models.railway, {
  foreignKey: 'settlement_id'
})
db.models.railway.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})
db.models.county.hasMany(db.models.railway, {
  foreignKey: 'county_id'
})
db.models.railway.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id'
})
db.models.subcounty.hasMany(db.models.railway, {
  foreignKey: 'subcounty_id'
})
db.models.railway.belongsTo(db.models.ward, {
  foreignKey: 'ward_id'
})
db.models.ward.hasMany(db.models.railway, {
  foreignKey: 'ward_id'
})


/// police   
db.models.police_station.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})
db.models.settlement.hasMany(db.models.police_station, {
  foreignKey: 'settlement_id'
})
db.models.police_station.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})
db.models.county.hasMany(db.models.police_station, {
  foreignKey: 'county_id'
})
db.models.police_station.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id'
})
db.models.subcounty.hasMany(db.models.police_station, {
  foreignKey: 'subcounty_id'
})
db.models.police_station.belongsTo(db.models.ward, {
  foreignKey: 'ward_id'
})
db.models.ward.hasMany(db.models.police_station, {
  foreignKey: 'ward_id'
})

 

/// floodlight   
db.models.floodlight.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})
db.models.settlement.hasMany(db.models.floodlight, {
  foreignKey: 'settlement_id'
})
db.models.floodlight.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})
db.models.county.hasMany(db.models.floodlight, {
  foreignKey: 'county_id'
})
db.models.floodlight.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id'
})
db.models.subcounty.hasMany(db.models.floodlight, {
  foreignKey: 'subcounty_id'
})
db.models.floodlight.belongsTo(db.models.ward, {
  foreignKey: 'ward_id'
})
db.models.ward.hasMany(db.models.floodlight, {
  foreignKey: 'ward_id'
})



/// crime_hotspot   
db.models.crime_hotspot.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})
db.models.settlement.hasMany(db.models.crime_hotspot, {
  foreignKey: 'settlement_id'
})
db.models.crime_hotspot.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})
db.models.county.hasMany(db.models.crime_hotspot, {
  foreignKey: 'county_id'
})
db.models.crime_hotspot.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id'
})
db.models.subcounty.hasMany(db.models.crime_hotspot, {
  foreignKey: 'subcounty_id'
})
db.models.crime_hotspot.belongsTo(db.models.ward, {
  foreignKey: 'ward_id'
})
db.models.ward.hasMany(db.models.crime_hotspot, {
  foreignKey: 'ward_id'
})


/// hazard_zone   
db.models.hazard_zone.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})
db.models.settlement.hasMany(db.models.hazard_zone, {
  foreignKey: 'settlement_id'
})
db.models.hazard_zone.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})
db.models.county.hasMany(db.models.hazard_zone, {
  foreignKey: 'county_id'
})
db.models.hazard_zone.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id'
})
db.models.subcounty.hasMany(db.models.hazard_zone, {
  foreignKey: 'subcounty_id'
})
db.models.hazard_zone.belongsTo(db.models.ward, {
  foreignKey: 'ward_id'
})
db.models.ward.hasMany(db.models.hazard_zone, {
  foreignKey: 'ward_id'
})


/// community_hall   
db.models.community_hall.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})
db.models.settlement.hasMany(db.models.community_hall, {
  foreignKey: 'settlement_id'
})
db.models.community_hall.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})
db.models.county.hasMany(db.models.community_hall, {
  foreignKey: 'county_id'
})
db.models.community_hall.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id'
})
db.models.subcounty.hasMany(db.models.community_hall, {
  foreignKey: 'subcounty_id'
})
db.models.community_hall.belongsTo(db.models.ward, {
  foreignKey: 'ward_id'
})
db.models.ward.hasMany(db.models.community_hall, {
  foreignKey: 'ward_id'
})




/// community_project   
db.models.community_project.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})
db.models.settlement.hasMany(db.models.community_project, {
  foreignKey: 'settlement_id'
})
db.models.community_project.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})
db.models.county.hasMany(db.models.community_project, {
  foreignKey: 'county_id'
})
db.models.community_project.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id'
})
db.models.subcounty.hasMany(db.models.community_project, {
  foreignKey: 'subcounty_id'
})
db.models.community_project.belongsTo(db.models.ward, {
  foreignKey: 'ward_id'
})
db.models.ward.hasMany(db.models.community_project, {
  foreignKey: 'ward_id'
})

/// mast   
db.models.mast.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})
db.models.settlement.hasMany(db.models.mast, {
  foreignKey: 'settlement_id'
})
db.models.mast.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})
db.models.county.hasMany(db.models.mast, {
  foreignKey: 'county_id'
})
db.models.mast.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id'
})
db.models.subcounty.hasMany(db.models.mast, {
  foreignKey: 'subcounty_id'
})
db.models.mast.belongsTo(db.models.ward, {
  foreignKey: 'ward_id'
})
db.models.ward.hasMany(db.models.mast, {
  foreignKey: 'ward_id'
})






/// street_light   
db.models.street_light.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})
db.models.settlement.hasMany(db.models.street_light, {
  foreignKey: 'settlement_id'
})
db.models.street_light.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})
db.models.county.hasMany(db.models.street_light, {
  foreignKey: 'county_id'
})
db.models.street_light.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id'
})
db.models.subcounty.hasMany(db.models.street_light, {
  foreignKey: 'subcounty_id'
})
db.models.street_light.belongsTo(db.models.ward, {
  foreignKey: 'ward_id'
})
db.models.ward.hasMany(db.models.street_light, {
  foreignKey: 'ward_id'
})



/// dumping_site   
db.models.dumping_site.belongsTo(db.models.settlement, {
  foreignKey: 'settlement_id'
})
db.models.settlement.hasMany(db.models.dumping_site, {
  foreignKey: 'settlement_id'
})
db.models.dumping_site.belongsTo(db.models.county, {
  foreignKey: 'county_id'
})
db.models.county.hasMany(db.models.dumping_site, {
  foreignKey: 'county_id'
})
db.models.dumping_site.belongsTo(db.models.subcounty, {
  foreignKey: 'subcounty_id'
})
db.models.subcounty.hasMany(db.models.dumping_site, {
  foreignKey: 'subcounty_id'
})
db.models.dumping_site.belongsTo(db.models.ward, {
  foreignKey: 'ward_id'
})
db.models.ward.hasMany(db.models.dumping_site, {
  foreignKey: 'ward_id'
})





//db.ROLES = ["user", "admin", "editor",  "moderator"];
module.exports = db
