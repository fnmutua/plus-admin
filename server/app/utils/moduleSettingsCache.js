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
    return
  }
  cache.clear()
}

module.exports = {
  isSettingEnabled,
  invalidateModuleSettingsCache,
}
