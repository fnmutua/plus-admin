const rateLimit = require('express-rate-limit')
const settingsController = require('../controllers/settings.controller')
const { isSettingEnabled } = require('../utils/moduleSettingsCache')

function createConditionalRateLimit(options, moduleKey) {
  const limiter = rateLimit(options)

  return async (req, res, next) => {
    try {
      const enabled = await isSettingEnabled(moduleKey, settingsController.isModuleEnabled)
      if (!enabled) {
        return next()
      }
    } catch (error) {
      console.error(`Rate limit setting check failed for ${moduleKey}:`, error)
      // Fail secure: keep limiting if settings lookup fails
    }

    return limiter(req, res, next)
  }
}

module.exports = {
  createConditionalRateLimit,
}
