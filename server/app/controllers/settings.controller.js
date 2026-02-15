const db = require('../models')
const Sequelize = require('sequelize')
const { Op } = Sequelize
const { computeSettlementVulnerability } = require('../utils/vulnerability')

/**
 * Get all module settings
 */
exports.getAllSettings = async (req, res) => {
  try {
    const settings = await db.models.module_settings.findAll({
      order: [['module', 'ASC']]
    })
    
    res.status(200).send({
      code: '0000',
      data: settings,
      message: 'Settings retrieved successfully'
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    res.status(500).send({
      code: '9999',
      message: 'Failed to retrieve settings',
      error: error.message
    })
  }
}

/**
 * Get a specific module setting
 */
exports.getSetting = async (req, res) => {
  try {
    const { module } = req.body
    
    if (!module) {
      return res.status(400).send({
        code: '1001',
        message: 'Module name is required'
      })
    }
    
    let setting = await db.models.module_settings.findOne({
      where: { module }
    })
    
    // If setting doesn't exist, create it with default value (enabled)
    if (!setting) {
      setting = await db.models.module_settings.create({
        module,
        enabled: true,
        description: `Settings for ${module} module`,
        created_by: req.thisUser?.id || null
      })
    }
    
    res.status(200).send({
      code: '0000',
      data: setting,
      message: 'Setting retrieved successfully'
    })
  } catch (error) {
    console.error('Error fetching setting:', error)
    res.status(500).send({
      code: '9999',
      message: 'Failed to retrieve setting',
      error: error.message
    })
  }
}

/**
 * Check if a module is enabled
 */
exports.isModuleEnabled = async (module) => {
  try {
    const setting = await db.models.module_settings.findOne({
      where: { module }
    })
    
    // If setting doesn't exist, default to enabled
    if (!setting) {
      return true
    }
    
    return setting.enabled === true
  } catch (error) {
    console.error(`Error checking module ${module}:`, error)
    // Default to enabled on error
    return true
  }
}

/**
 * Update a module setting
 */
exports.updateSetting = async (req, res) => {
  try {
    const { id, module, enabled, description } = req.body
    
    if (!id && !module) {
      return res.status(400).send({
        code: '1001',
        message: 'Either id or module is required'
      })
    }
    
    const whereClause = id ? { id } : { module }
    
    let setting = await db.models.module_settings.findOne({
      where: whereClause
    })
    
    if (!setting) {
      // Create new setting if it doesn't exist
      setting = await db.models.module_settings.create({
        module: module || `module_${Date.now()}`,
        enabled: enabled !== undefined ? enabled : true,
        description: description || `Settings for ${module || 'module'} module`,
        created_by: req.thisUser?.id || null
      })
    } else {
      // Update existing setting
      const updateData = {
        updated_by: req.thisUser?.id || null
      }
      
      if (enabled !== undefined) {
        updateData.enabled = enabled
      }
      
      if (description !== undefined) {
        updateData.description = description
      }
      
      if (module && module !== setting.module) {
        updateData.module = module
      }
      
      await setting.update(updateData)
    }
    
    res.status(200).send({
      code: '0000',
      data: setting,
      message: 'Setting updated successfully'
    })
  } catch (error) {
    console.error('Error updating setting:', error)
    res.status(500).send({
      code: '9999',
      message: 'Failed to update setting',
      error: error.message
    })
  }
}

/**
 * Bulk update settings
 */
exports.bulkUpdateSettings = async (req, res) => {
  try {
    const { settings } = req.body
    
    if (!Array.isArray(settings) || settings.length === 0) {
      return res.status(400).send({
        code: '1001',
        message: 'Settings array is required'
      })
    }
    
    const results = []
    
    for (const settingData of settings) {
      const { module, enabled, description } = settingData
      
      if (!module) {
        results.push({
          module: null,
          success: false,
          error: 'Module name is required'
        })
        continue
      }
      
      try {
        let setting = await db.models.module_settings.findOne({
          where: { module }
        })
        
        if (!setting) {
          setting = await db.models.module_settings.create({
            module,
            enabled: enabled !== undefined ? enabled : true,
            description: description || `Settings for ${module} module`,
            created_by: req.thisUser?.id || null
          })
        } else {
          const updateData = {
            updated_by: req.thisUser?.id || null
          }
          
          if (enabled !== undefined) {
            updateData.enabled = enabled
          }
          
          if (description !== undefined) {
            updateData.description = description
          }
          
          await setting.update(updateData)
        }
        
        results.push({
          module,
          success: true,
          data: setting
        })
      } catch (error) {
        results.push({
          module,
          success: false,
          error: error.message
        })
      }
    }
    
    res.status(200).send({
      code: '0000',
      data: results,
      message: 'Settings updated successfully'
    })
  } catch (error) {
    console.error('Error bulk updating settings:', error)
    res.status(500).send({
      code: '9999',
      message: 'Failed to update settings',
      error: error.message
    })
  }
}

/**
 * Get vulnerability weight matrix
 */
exports.getVulnerabilityMatrix = async (req, res) => {
  try {
    const rows = await db.models.vulnerability_matrix.findAll({
      order: [['attribute_type', 'ASC'], ['sort_order', 'ASC']]
    })
    res.status(200).send({
      code: '0000',
      data: rows,
      message: 'Vulnerability matrix retrieved successfully'
    })
  } catch (error) {
    console.error('Error fetching vulnerability matrix:', error)
    res.status(500).send({
      code: '9999',
      message: 'Failed to retrieve vulnerability matrix',
      error: error.message
    })
  }
}

/**
 * Bulk update vulnerability weight matrix
 */
exports.bulkUpdateVulnerabilityMatrix = async (req, res) => {
  try {
    const { rows } = req.body
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).send({
        code: '1001',
        message: 'Rows array is required'
      })
    }
    for (const row of rows) {
      const { id, score_temperature, score_rainfall, score_drought, score_soil_erosion,
        score_land_slide, score_food_insecurity, score_pollution, score_moisture_content,
        score_flash_floods, score_flooding } = row
      if (!id) continue
      const updateData = {}
      const scoreFields = ['score_temperature', 'score_rainfall', 'score_drought', 'score_soil_erosion',
        'score_land_slide', 'score_food_insecurity', 'score_pollution', 'score_moisture_content',
        'score_flash_floods', 'score_flooding']
      for (const f of scoreFields) {
        if (row[f] !== undefined && row[f] !== null) updateData[f] = row[f]
      }
      if (Object.keys(updateData).length) {
        await db.models.vulnerability_matrix.update(updateData, { where: { id } })
      }
    }
    res.status(200).send({
      code: '0000',
      data: { updated: rows.length },
      message: 'Vulnerability matrix updated successfully'
    })
  } catch (error) {
    console.error('Error updating vulnerability matrix:', error)
    res.status(500).send({
      code: '9999',
      message: 'Failed to update vulnerability matrix',
      error: error.message
    })
  }
}

/**
 * Get vulnerability rating thresholds
 */
exports.getVulnerabilityRatingThresholds = async (req, res) => {
  try {
    const rows = await db.models.vulnerability_rating_threshold.findAll({
      order: [['sort_order', 'ASC']]
    })
    res.status(200).send({
      code: '0000',
      data: rows,
      message: 'Rating thresholds retrieved successfully'
    })
  } catch (error) {
    console.error('Error fetching rating thresholds:', error)
    res.status(500).send({
      code: '9999',
      message: 'Failed to retrieve rating thresholds',
      error: error.message
    })
  }
}

/**
 * Bulk update vulnerability rating thresholds
 */
exports.bulkUpdateVulnerabilityRatingThresholds = async (req, res) => {
  try {
    const { rows } = req.body
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).send({
        code: '1001',
        message: 'Rows array is required'
      })
    }
    for (const row of rows) {
      const { id, min_score, max_score } = row
      if (!id) continue
      const updateData = {}
      if (min_score !== undefined && min_score !== null) updateData.min_score = min_score
      if (max_score !== undefined) updateData.max_score = max_score === '' || max_score === null ? null : max_score
      if (Object.keys(updateData).length) {
        await db.models.vulnerability_rating_threshold.update(updateData, { where: { id } })
      }
    }
    res.status(200).send({
      code: '0000',
      data: { updated: rows.length },
      message: 'Rating thresholds updated successfully'
    })
  } catch (error) {
    console.error('Error updating rating thresholds:', error)
    res.status(500).send({
      code: '9999',
      message: 'Failed to update rating thresholds',
      error: error.message
    })
  }
}

/**
 * Compute vulnerability score from attribute values (for preview)
 */
exports.computeVulnerabilityScore = async (req, res) => {
  try {
    const { climate_region, soil_type, land_cover, altitude_range, proximity_to_river, proximity_to_flood_plain } = req.body
    const { total_score, rating } = await computeSettlementVulnerability(db, {
      climate_region,
      soil_type,
      land_cover,
      altitude_range,
      proximity_to_river,
      proximity_to_flood_plain
    })
    res.status(200).send({
      code: '0000',
      data: { total_score, rating },
      message: 'Score computed successfully'
    })
  } catch (error) {
    console.error('Error computing vulnerability score:', error)
    res.status(500).send({
      code: '9999',
      message: 'Failed to compute score',
      error: error.message
    })
  }
}

/**
 * Initialize default SMS module settings
 */
exports.initializeDefaultSettings = async () => {
  try {
    const defaultSettings = [
      {
        module: 'sms_grievance_county',
        enabled: true,
        description: 'Enable/disable SMS notifications for grievances at county level'
      },
      {
        module: 'sms_grievance_national',
        enabled: true,
        description: 'Enable/disable SMS notifications for grievances at national level'
      },
      {
        module: 'sms_incident_county',
        enabled: true,
        description: 'Enable/disable SMS notifications for incidents at county level'
      },
      {
        module: 'sms_incident_national',
        enabled: true,
        description: 'Enable/disable SMS notifications for incidents at national level'
      },
      {
        module: 'sms_auth',
        enabled: true,
        description: 'Enable/disable SMS notifications for authentication (OTP, registration, etc.)'
      },
      {
        module: 'sms_user',
        enabled: true,
        description: 'Enable/disable SMS notifications for user management (activation, deactivation)'
      },
      {
        module: 'sms_feedback',
        enabled: true,
        description: 'Enable/disable SMS notifications for feedback module'
      }
    ]
    
    for (const settingData of defaultSettings) {
      const existing = await db.models.module_settings.findOne({
        where: { module: settingData.module }
      })
      
      if (!existing) {
        await db.models.module_settings.create(settingData)
        console.log(`Initialized default setting for ${settingData.module}`)
      }
    }
    
    console.log('Default SMS module settings initialized')
  } catch (error) {
    console.error('Error initializing default settings:', error)
  }
}

