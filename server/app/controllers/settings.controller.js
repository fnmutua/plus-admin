const db = require('../models')
const Sequelize = require('sequelize')
const { Op } = Sequelize
const { computeSettlementVulnerability } = require('../utils/vulnerability')
const { invalidateModuleSettingsCache } = require('../utils/moduleSettingsCache')

const SYSTEM_SETTING_PREFIX = 'rate_limit_'
const AUTH_SETTING_PREFIX = 'auth_'

const isSystemSettingModule = (module) =>
  typeof module === 'string'
  && (module.startsWith(SYSTEM_SETTING_PREFIX) || module.startsWith(AUTH_SETTING_PREFIX))

const userIsRootAdmin = async (req) => {
  if (!req.userid) return false
  const user = await db.user.findByPk(req.userid, {
    include: [{ model: db.role }],
  })
  return user?.roles?.some((role) => role.name === 'root_admin') ?? false
}

const assertRootAdminForSystemSettings = async (req, res) => {
  if (await userIsRootAdmin(req)) return true
  res.status(403).send({
    code: '9999',
    message: 'Forbidden: root administrator access required for system settings',
  })
  return false
}

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

/** Read config_value for a module (used by auth session limits, etc.) */
exports.getModuleConfigValue = async (module) => {
  try {
    const setting = await db.models.module_settings.findOne({
      where: { module },
    })
    if (!setting) return null
    if (setting.enabled === false) return null
    return setting.config_value
  } catch (error) {
    console.error(`Error reading config for module ${module}:`, error)
    return null
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

    if (isSystemSettingModule(module) || isSystemSettingModule(setting?.module)) {
      const allowed = await assertRootAdminForSystemSettings(req, res)
      if (!allowed) return
    }
    
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

    invalidateModuleSettingsCache(setting.module)
    
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

    if (settings.some((setting) => isSystemSettingModule(setting?.module))) {
      const allowed = await assertRootAdminForSystemSettings(req, res)
      if (!allowed) return
    }
    
    const results = []
    
    for (const settingData of settings) {
      const { module, enabled, description, config_value } = settingData
      
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
            config_value: config_value !== undefined ? String(config_value) : null,
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

          if (config_value !== undefined) {
            updateData.config_value = config_value == null ? null : String(config_value)
          }
          
          await setting.update(updateData)
        }

        invalidateModuleSettingsCache(module)
        
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

    const shouldRescheduleBalanceAlert = settings.some((s) => s?.module === 'sms_balance_alert')
    if (shouldRescheduleBalanceAlert) {
      try {
        const { rescheduleSmsBalanceScheduler } = require('../schedulers/smsBalanceScheduler')
        await rescheduleSmsBalanceScheduler()
      } catch (scheduleError) {
        console.error('[SMS Balance Alert] Failed to reschedule after settings save:', scheduleError.message || scheduleError)
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
 * Get system settings (root admin only) — rate limits and other system-wide toggles
 */
exports.getSystemSettings = async (req, res) => {
  try {
    const settings = await db.models.module_settings.findAll({
      where: {
        [Op.or]: [
          { module: { [Op.like]: `${SYSTEM_SETTING_PREFIX}%` } },
          { module: { [Op.like]: `${AUTH_SETTING_PREFIX}%` } },
        ],
      },
      order: [['module', 'ASC']],
    })

    res.status(200).send({
      code: '0000',
      data: settings,
      message: 'System settings retrieved successfully',
    })
  } catch (error) {
    console.error('Error fetching system settings:', error)
    res.status(500).send({
      code: '9999',
      message: 'Failed to retrieve system settings',
      error: error.message,
    })
  }
}

/**
 * Bulk update system settings (root admin only)
 */
exports.bulkUpdateSystemSettings = async (req, res) => {
  try {
    const { settings } = req.body

    if (!Array.isArray(settings) || settings.length === 0) {
      return res.status(400).send({
        code: '1001',
        message: 'Settings array is required',
      })
    }

    const invalid = settings.filter((setting) => !isSystemSettingModule(setting?.module))
    if (invalid.length > 0) {
      return res.status(400).send({
        code: '1001',
        message: 'Only system settings modules can be updated through this endpoint',
      })
    }

    req.body.settings = settings
    return exports.bulkUpdateSettings(req, res)
  } catch (error) {
    console.error('Error bulk updating system settings:', error)
    res.status(500).send({
      code: '9999',
      message: 'Failed to update system settings',
      error: error.message,
    })
  }
}

/**
 * Get climate assessment question config
 * - If `req.query.version` is provided: fetch that specific version.
 * - Otherwise: fetch active version.
 */
exports.getClimateQuestionConfig = async (req, res) => {
  try {
    const rawVersion = req.query?.version
    const requestedVersion = rawVersion !== undefined && rawVersion !== null
      ? parseInt(String(rawVersion), 10)
      : null

    if (requestedVersion != null && Number.isNaN(requestedVersion)) {
      return res.status(400).send({
        code: '1001',
        message: 'Invalid "version" query parameter',
      })
    }

    const whereClause = requestedVersion != null
      ? 'version = :version'
      : 'is_active = TRUE'

    const params = requestedVersion != null ? { version: requestedVersion } : {}

    const [row] = await db.sequelize.query(
      `
      SELECT id, version, config, is_active, "createdAt", "updatedAt"
      FROM climate_assessment_question_config
      WHERE ${whereClause}
      ORDER BY version DESC, id DESC
      LIMIT 1
      `,
      {
        type: db.Sequelize.QueryTypes.SELECT,
        replacements: params,
      }
    )

    if (!row) {
      return res.status(404).send({
        code: '1004',
        message: requestedVersion != null
          ? 'No climate assessment question config found for the requested version'
          : 'No active climate assessment question config found',
      })
    }

    return res.status(200).send({
      code: '0000',
      data: row,
      message: 'Climate assessment question config retrieved successfully',
    })
  } catch (error) {
    console.error('Error fetching climate assessment question config:', error)
    return res.status(500).send({
      code: '9999',
      message: 'Failed to retrieve climate assessment question config',
      error: error.message,
    })
  }
}

/**
 * List saved versions of the climate assessment question config.
 */
exports.listClimateQuestionConfigVersions = async (req, res) => {
  try {
    const rows = await db.sequelize.query(
      `
      SELECT DISTINCT ON (version)
        id,
        version,
        is_active,
        "createdAt",
        "updatedAt"
      FROM climate_assessment_question_config
      ORDER BY version DESC, id DESC
      `,
      { type: db.Sequelize.QueryTypes.SELECT }
    )

    return res.status(200).send({
      code: '0000',
      data: rows,
      message: 'Climate question config versions retrieved successfully',
    })
  } catch (error) {
    console.error('Error listing climate assessment question config versions:', error)
    return res.status(500).send({
      code: '9999',
      message: 'Failed to list climate assessment question config versions',
      error: error.message,
    })
  }
}

/**
 * Create a new active climate assessment question config version
 */
exports.updateClimateQuestionConfig = async (req, res) => {
  const tx = await db.sequelize.transaction()
  try {
    const { config } = req.body || {}
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      await tx.rollback()
      return res.status(400).send({
        code: '1001',
        message: 'A valid config object is required',
      })
    }

    const requiredDimensions = ['hazard', 'exposure', 'sensitivity', 'adaptive_capacity']
    for (const dimension of requiredDimensions) {
      if (!config[dimension] || !Array.isArray(config[dimension].categories)) {
        await tx.rollback()
        return res.status(400).send({
          code: '1001',
          message: `Invalid config: "${dimension}.categories" is required`,
        })
      }
    }

    const [latest] = await db.sequelize.query(
      `
      SELECT version
      FROM climate_assessment_question_config
      ORDER BY version DESC, id DESC
      LIMIT 1
      `,
      { type: db.Sequelize.QueryTypes.SELECT, transaction: tx }
    )

    const nextVersion = (latest?.version || 0) + 1
    const actorId = req.thisUser?.id || req.userid || null

    await db.sequelize.query(
      `UPDATE climate_assessment_question_config SET is_active = FALSE WHERE is_active = TRUE`,
      { type: db.Sequelize.QueryTypes.UPDATE, transaction: tx }
    )

    const [inserted] = await db.sequelize.query(
      `
      INSERT INTO climate_assessment_question_config
        (version, config, is_active, created_by, updated_by, "createdAt", "updatedAt")
      VALUES
        (:version, :config::jsonb, TRUE, :actorId, :actorId, NOW(), NOW())
      RETURNING id, version, config, is_active, "createdAt", "updatedAt"
      `,
      {
        replacements: {
          version: nextVersion,
          config: JSON.stringify(config),
          actorId,
        },
        type: db.Sequelize.QueryTypes.INSERT,
        transaction: tx,
      }
    )
    const insertedRow = Array.isArray(inserted) ? inserted[0] : inserted

    await tx.commit()
    return res.status(200).send({
      code: '0000',
      data: insertedRow || null,
      message: 'Climate assessment question config updated successfully',
    })
  } catch (error) {
    await tx.rollback()
    console.error('Error updating climate assessment question config:', error)
    return res.status(500).send({
      code: '9999',
      message: 'Failed to update climate assessment question config',
      error: error.message,
    })
  }
}

/**
 * Overwrite an existing climate assessment question config version and activate it.
 * (No new version row is created.)
 */
exports.updateClimateQuestionConfigCurrentVersion = async (req, res) => {
  const tx = await db.sequelize.transaction()
  try {
    const { version, config } = req.body || {}
    const targetVersion = parseInt(String(version), 10)

    if (!Number.isFinite(targetVersion) || Number.isNaN(targetVersion)) {
      await tx.rollback()
      return res.status(400).send({
        code: '1001',
        message: 'A valid "version" number is required',
      })
    }

    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      await tx.rollback()
      return res.status(400).send({
        code: '1001',
        message: 'A valid config object is required',
      })
    }

    const requiredDimensions = ['hazard', 'exposure', 'sensitivity', 'adaptive_capacity']
    for (const dimension of requiredDimensions) {
      if (!config[dimension] || !Array.isArray(config[dimension].categories)) {
        await tx.rollback()
        return res.status(400).send({
          code: '1001',
          message: `Invalid config: "${dimension}.categories" is required`,
        })
      }
    }

    const actorId = req.thisUser?.id || req.userid || null

    // Pick the latest row for the requested version.
    const [existing] = await db.sequelize.query(
      `
      SELECT id
      FROM climate_assessment_question_config
      WHERE version = :version
      ORDER BY id DESC
      LIMIT 1
      `,
      { type: db.Sequelize.QueryTypes.SELECT, replacements: { version: targetVersion }, transaction: tx }
    )

    if (!existing?.id) {
      await tx.rollback()
      return res.status(404).send({
        code: 'NOT_FOUND',
        message: `No climate assessment question config found for version ${targetVersion}`,
      })
    }

    // Deactivate any currently-active config, then activate the overwritten one.
    await db.sequelize.query(
      `UPDATE climate_assessment_question_config SET is_active = FALSE WHERE is_active = TRUE`,
      { type: db.Sequelize.QueryTypes.UPDATE, transaction: tx }
    )

    await db.sequelize.query(
      `
      UPDATE climate_assessment_question_config
      SET
        config = :config::jsonb,
        is_active = TRUE,
        updated_by = :actorId,
        "updatedAt" = NOW()
      WHERE id = :id
      `,
      {
        replacements: { id: existing.id, config: JSON.stringify(config), actorId },
        type: db.Sequelize.QueryTypes.UPDATE,
        transaction: tx,
      }
    )

    const [updatedRow] = await db.sequelize.query(
      `
      SELECT id, version, config, is_active, "createdAt", "updatedAt"
      FROM climate_assessment_question_config
      WHERE id = :id
      `,
      { type: db.Sequelize.QueryTypes.SELECT, replacements: { id: existing.id }, transaction: tx }
    )

    await tx.commit()
    return res.status(200).send({
      code: '0000',
      data: updatedRow || null,
      message: 'Climate question config updated for the selected version and activated',
    })
  } catch (error) {
    await tx.rollback()
    console.error('Error updating climate assessment question config current version:', error)
    return res.status(500).send({
      code: '9999',
      message: 'Failed to update climate assessment question config for the selected version',
      error: error.message,
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
      },
      {
        module: 'sms_data_request',
        enabled: true,
        description: 'Enable/disable SMS notifications to support officers for new data requests'
      },
      {
        module: 'sms_balance_alert',
        enabled: true,
        description: 'Daily low bulk SMS balance check — notifies support users when credits fall below threshold',
        config_value: JSON.stringify({
          threshold: 500,
          hour: 8,
          minute: 0,
          timezone: 'Africa/Nairobi',
        }),
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

/** Read-only Advanta SMS credit balance (for SMS Settings UI). */
exports.getSmsBalance = async (req, res) => {
  try {
    const { getAccountBalance } = require('../utils/sms')
    const { getSmsBalanceAlertSettings } = require('../utils/smsBalanceAlertSettings')
    const alertConfig = await getSmsBalanceAlertSettings()
    const result = await getAccountBalance()

    if (!result.ok) {
      return res.status(502).send({
        code: '9999',
        message: result.error || 'Failed to fetch SMS balance',
        data: {
          threshold: alertConfig.threshold,
          alertEnabled: alertConfig.enabled,
          sendTime: `${String(alertConfig.hour).padStart(2, '0')}:${String(alertConfig.minute).padStart(2, '0')}`,
          timezone: alertConfig.timezone,
          error: result.error,
          code: result.code ?? null,
        },
      })
    }

    return res.status(200).send({
      code: '0000',
      message: 'SMS balance retrieved',
      data: {
        balance: result.balance,
        threshold: alertConfig.threshold,
        low: result.balance <= alertConfig.threshold,
        alertEnabled: alertConfig.enabled,
        sendTime: `${String(alertConfig.hour).padStart(2, '0')}:${String(alertConfig.minute).padStart(2, '0')}`,
        timezone: alertConfig.timezone,
      },
    })
  } catch (error) {
    console.error('[SMS Balance] Fetch failed:', error)
    return res.status(500).send({
      code: '9999',
      message: error.message || 'Failed to fetch SMS balance',
    })
  }
}

// ── Data cleanup (normalize text field values) ───────────────────────────────

const CLEANUP_EXCLUDED_MODELS = new Set([
  'users',
  'user',
  'roles',
  'role',
  'user_roles',
  'permissions',
  'permission',
  'role_permissions',
  'audit_log',
  'page_visit',
  'otp',
])

const CLEANUP_EXCLUDED_FIELDS = new Set([
  'id',
  'password',
  'resetPasswordToken',
  'token',
  'accessToken',
  'geom',
  'geometry',
  'createdAt',
  'updatedAt',
  'created_at',
  'updated_at',
  'created_by',
  'updated_by',
  'deletedAt',
  'deleted_at',
])

const CLEANUP_TEXT_TYPES = new Set(['STRING', 'TEXT', 'CHAR', 'CITEXT', 'ENUM'])

function getCleanupModelOrError(modelName, res) {
  if (!modelName || typeof modelName !== 'string') {
    res.status(400).send({ code: '1001', message: 'A valid "model" is required' })
    return null
  }
  if (CLEANUP_EXCLUDED_MODELS.has(modelName)) {
    res.status(403).send({ code: '1003', message: `Model "${modelName}" is not allowed for data cleanup` })
    return null
  }
  const Model = db.models?.[modelName]
  if (!Model) {
    res.status(404).send({ code: '1004', message: `Model "${modelName}" not found` })
    return null
  }
  return Model
}

function getAttrTypeKey(attr) {
  if (!attr?.type) return ''
  if (typeof attr.type.key === 'string') return attr.type.key
  if (typeof attr.type.toString === 'function') {
    const s = String(attr.type.toString()).toUpperCase()
    if (s.includes('TEXT')) return 'TEXT'
    if (s.includes('CHAR') || s.includes('VARCHAR') || s.includes('STRING')) return 'STRING'
    if (s.includes('ENUM')) return 'ENUM'
  }
  return String(attr.type?.constructor?.key || attr.type?.constructor?.name || '').toUpperCase()
}

function isCleanupTextField(Model, fieldName) {
  if (!fieldName || CLEANUP_EXCLUDED_FIELDS.has(fieldName)) return false
  const attr = Model.rawAttributes?.[fieldName]
  if (!attr) return false
  if (attr.primaryKey) return false
  return CLEANUP_TEXT_TYPES.has(getAttrTypeKey(attr))
}

/** List models available for data cleanup (excludes users/roles/auth). */
exports.listCleanupModels = async (_req, res) => {
  try {
    const models = Object.keys(db.models || {})
      .filter((name) => !CLEANUP_EXCLUDED_MODELS.has(name))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({
        model: name,
        table: db.models[name]?.tableName || name,
      }))

    return res.status(200).send({
      code: '0000',
      message: 'Cleanup models fetched successfully',
      data: models,
    })
  } catch (error) {
    console.error('[Data Cleanup] listCleanupModels failed:', error)
    return res.status(500).send({
      code: '9999',
      message: error.message || 'Failed to list cleanup models',
    })
  }
}

/** List text fields for a cleanup model. */
exports.listCleanupFields = async (req, res) => {
  try {
    const modelName = req.query.model || req.body?.model
    const Model = getCleanupModelOrError(modelName, res)
    if (!Model) return

    const fields = Object.keys(Model.rawAttributes || {})
      .filter((name) => isCleanupTextField(Model, name))
      .map((name) => ({
        field: name,
        type: getAttrTypeKey(Model.rawAttributes[name]),
      }))
      .sort((a, b) => a.field.localeCompare(b.field))

    return res.status(200).send({
      code: '0000',
      message: 'Cleanup fields fetched successfully',
      data: fields,
    })
  } catch (error) {
    console.error('[Data Cleanup] listCleanupFields failed:', error)
    return res.status(500).send({
      code: '9999',
      message: error.message || 'Failed to list cleanup fields',
    })
  }
}

/** Distinct values (+ counts) for a text field. */
exports.listCleanupFieldValues = async (req, res) => {
  try {
    const modelName = req.body?.model
    const field = req.body?.field || req.body?.selectedField
    const Model = getCleanupModelOrError(modelName, res)
    if (!Model) return

    if (!isCleanupTextField(Model, field)) {
      return res.status(400).send({
        code: '1001',
        message: `Field "${field}" is not a text field available for cleanup`,
      })
    }

    const quotedField = `"${String(field).replace(/"/g, '')}"`
    const table = Model.tableName
    const rows = await db.sequelize.query(
      `
      SELECT ${quotedField} AS value, COUNT(*)::int AS count
      FROM "${table}"
      WHERE ${quotedField} IS NOT NULL
        AND TRIM(CAST(${quotedField} AS TEXT)) <> ''
      GROUP BY ${quotedField}
      ORDER BY ${quotedField} ASC
      `,
      { type: db.Sequelize.QueryTypes.SELECT }
    )

    const data = (rows || []).map((row) => ({
      value: row.value,
      label: String(row.value),
      count: Number(row.count) || 0,
    }))

    return res.status(200).send({
      code: '0000',
      message: 'Cleanup field values fetched successfully',
      data,
    })
  } catch (error) {
    console.error('[Data Cleanup] listCleanupFieldValues failed:', error)
    return res.status(500).send({
      code: '9999',
      message: error.message || 'Failed to list cleanup field values',
    })
  }
}

/**
 * Replace all rows where field IN fromValues with toValue.
 * Body: { model, field, fromValue | fromValues, toValue, dryRun? }
 */
exports.replaceCleanupFieldValue = async (req, res) => {
  try {
    const { model: modelName, field, fromValue, fromValues, toValue } = req.body || {}
    const dryRun = req.body?.dryRun === true || String(req.body?.dryRun || '') === 'true'

    const Model = getCleanupModelOrError(modelName, res)
    if (!Model) return

    if (!isCleanupTextField(Model, field)) {
      return res.status(400).send({
        code: '1001',
        message: `Field "${field}" is not a text field available for cleanup`,
      })
    }

    const sourceValues = Array.isArray(fromValues)
      ? fromValues
      : fromValue != null
        ? [fromValue]
        : []

    const normalizedFrom = [...new Set(
      sourceValues
        .map((v) => (v == null ? '' : String(v)))
        .filter((v) => v !== '')
    )]

    if (!normalizedFrom.length) {
      return res.status(400).send({
        code: '1001',
        message: '"fromValues" (or "fromValue") is required',
      })
    }
    if (toValue == null || String(toValue).trim() === '') {
      return res.status(400).send({ code: '1001', message: '"toValue" is required' })
    }

    const toValueStr = String(toValue).trim()
    if (normalizedFrom.includes(toValueStr)) {
      return res.status(400).send({
        code: '1001',
        message: '"toValue" must not be one of the selected current values',
      })
    }

    const where = { [field]: { [Op.in]: normalizedFrom } }
    const matched = await Model.count({ where })

    if (dryRun) {
      return res.status(200).send({
        code: '0000',
        message: 'Dry run — no rows updated',
        data: {
          dryRun: true,
          model: modelName,
          field,
          fromValues: normalizedFrom,
          fromValue: normalizedFrom.length === 1 ? normalizedFrom[0] : normalizedFrom,
          toValue: toValueStr,
          matched,
          updated: 0,
        },
      })
    }

    const [updated] = await Model.update(
      { [field]: toValueStr },
      { where }
    )

    try {
      const { logAudit } = require('../utils/auditTrail')
      await logAudit({
        req,
        action: 'data_cleanup_replace',
        actorId: req.userid != null ? String(req.userid) : null,
        actorName: req.thisUser?.username || null,
        entityType: modelName,
        entityId: null,
        outcome: 'success',
        statusCode: 200,
        changes: {
          field,
          fromValues: normalizedFrom,
          toValue: toValueStr,
          updated,
        },
        metadata: { source: 'settings/data-cleanup' },
      })
    } catch (_) {
      /* audit is best-effort */
    }

    return res.status(200).send({
      code: '0000',
      message: `Updated ${updated} row(s)`,
      data: {
        dryRun: false,
        model: modelName,
        field,
        fromValues: normalizedFrom,
        fromValue: normalizedFrom.length === 1 ? normalizedFrom[0] : normalizedFrom,
        toValue: toValueStr,
        matched,
        updated,
      },
    })
  } catch (error) {
    console.error('[Data Cleanup] replaceCleanupFieldValue failed:', error)
    return res.status(500).send({
      code: '9999',
      message: error.message || 'Failed to replace field value',
    })
  }
}

/** Manual trigger for Advanta SMS balance check (scheduled job also runs daily at 8am). */
exports.runSmsBalanceAlertTest = async (req, res) => {
  try {
    if (!(await userIsRootAdmin(req))) {
      return res.status(403).send({
        code: '9999',
        message: 'Forbidden: root administrator access required',
      })
    }

    const dryRun = String(req.query.dryRun ?? req.body?.dryRun ?? 'false') === 'true'
    const { getAccountBalance } = require('../utils/sms')
    const { getSmsBalanceAlertSettings } = require('../utils/smsBalanceAlertSettings')
    const { runSmsBalanceAlertJob } = require('../jobs/smsBalanceAlertJob')
    const alertConfig = await getSmsBalanceAlertSettings()
    const threshold = alertConfig.threshold

    if (dryRun) {
      const balanceResult = await getAccountBalance()
      return res.status(200).send({
        code: '0000',
        message: 'SMS balance check completed (dry run — no alerts sent)',
        data: {
          dryRun: true,
          threshold,
          alertEnabled: alertConfig.enabled,
          sendTime: `${String(alertConfig.hour).padStart(2, '0')}:${String(alertConfig.minute).padStart(2, '0')}`,
          timezone: alertConfig.timezone,
          ...balanceResult,
          wouldAlert: balanceResult.ok && balanceResult.balance <= threshold,
        },
      })
    }

    const result = await runSmsBalanceAlertJob()
    return res.status(200).send({
      code: '0000',
      message: result.alerted
        ? 'Low balance detected — support users notified'
        : result.skipped
          ? 'SMS balance alert job is disabled'
          : result.ok
            ? 'Balance is above threshold — no alert sent'
            : 'Balance check failed',
      data: { threshold, alertEnabled: alertConfig.enabled, ...result },
    })
  } catch (error) {
    console.error('[SMS Balance Alert] Manual test failed:', error)
    return res.status(500).send({
      code: '9999',
      message: error.message || 'SMS balance check failed',
    })
  }
}

