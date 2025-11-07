const db = require('../models')
const Sequelize = require('sequelize')
const { Op } = Sequelize

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
 * Initialize default SMS module settings
 */
exports.initializeDefaultSettings = async () => {
  try {
    const defaultSettings = [
      {
        module: 'sms_grievance',
        enabled: true,
        description: 'Enable/disable SMS notifications for grievance module'
      },
      {
        module: 'sms_incident',
        enabled: true,
        description: 'Enable/disable SMS notifications for incident module'
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

