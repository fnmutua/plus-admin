const CACHE_TTL_MS = 30 * 1000
const cache = new Map()

async function isSettingEnabled(moduleKey, fetchFn) {
  const cached = cache.get(moduleKey)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.value
  }

  const value = await fetchFn(moduleKey)
  cache.set(moduleKey, { value, at: Date.now() })
  return value
}

function invalidateModuleSettingsCache(moduleKey) {
  if (moduleKey) {
    cache.delete(moduleKey)
    cache.delete(`${moduleKey}:config`)
    return
  }
  cache.clear()
}

async function getSettingConfigValue(moduleKey, fetchFn, defaultValue = null) {
  const cacheKey = `${moduleKey}:config`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.value
  }

  const value = await fetchFn(moduleKey)
  cache.set(cacheKey, { value, at: Date.now() })
  return value ?? defaultValue
}

module.exports = {
  isSettingEnabled,
  getSettingConfigValue,
  invalidateModuleSettingsCache,
}
