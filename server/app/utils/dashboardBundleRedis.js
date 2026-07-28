const redis = require('redis')

const NATIONAL_BUNDLE_KEY = 'dashboard:bundle:national'
const LANDING_MAP_BUNDLE_KEY = 'map:bundle:landing:national'
const PROJECT_MAP_BUNDLE_KEY = 'map:bundle:projects:national'
const DASHBOARD_GEO_BUNDLE_KEY = 'dashboard:geo:bundle:national'
const TTL_SECONDS = Number(process.env.DASHBOARD_BUNDLE_TTL_SECONDS || 600)

let client
let connectPromise

async function getClient() {
  if (client?.isOpen) return client
  if (!connectPromise) {
    const url = process.env.REDIS_URL || 'redis://localhost:6379'
    client = redis.createClient({ url })
    client.on('error', (err) => console.error('[dashboard-bundle redis]', err.message))
    connectPromise = client.connect()
  }
  await connectPromise
  return client
}

function dashboardBundleKey(dashboardId) {
  if (dashboardId === 'national' || dashboardId === 'main') return NATIONAL_BUNDLE_KEY
  return `dashboard:bundle:${dashboardId}:national`
}

async function getCachedBundle(key) {
  try {
    const redisClient = await getClient()
    const raw = await redisClient.get(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (err) {
    console.error('[dashboard-bundle] redis get failed:', err.message)
    return null
  }
}

async function setCachedBundle(key, payload) {
  const redisClient = await getClient()
  await redisClient.set(key, JSON.stringify(payload), { EX: TTL_SECONDS })
}

async function getNationalBundle() {
  return getCachedBundle(NATIONAL_BUNDLE_KEY)
}

async function setNationalBundle(payload) {
  return setCachedBundle(NATIONAL_BUNDLE_KEY, payload)
}

async function getDashboardBundleById(dashboardId) {
  return getCachedBundle(dashboardBundleKey(dashboardId))
}

async function setDashboardBundleById(dashboardId, payload) {
  return setCachedBundle(dashboardBundleKey(dashboardId), payload)
}

async function getLandingMapBundle() {
  return getCachedBundle(LANDING_MAP_BUNDLE_KEY)
}

async function setLandingMapBundle(payload) {
  return setCachedBundle(LANDING_MAP_BUNDLE_KEY, payload)
}

async function getProjectMapBundle() {
  return getCachedBundle(PROJECT_MAP_BUNDLE_KEY)
}

async function setProjectMapBundle(payload) {
  return setCachedBundle(PROJECT_MAP_BUNDLE_KEY, payload)
}

async function getDashboardGeoBundle() {
  return getCachedBundle(DASHBOARD_GEO_BUNDLE_KEY)
}

async function setDashboardGeoBundle(payload) {
  return setCachedBundle(DASHBOARD_GEO_BUNDLE_KEY, payload)
}

module.exports = {
  NATIONAL_BUNDLE_KEY,
  LANDING_MAP_BUNDLE_KEY,
  PROJECT_MAP_BUNDLE_KEY,
  DASHBOARD_GEO_BUNDLE_KEY,
  TTL_SECONDS,
  dashboardBundleKey,
  getCachedBundle,
  setCachedBundle,
  getNationalBundle,
  setNationalBundle,
  getDashboardBundleById,
  setDashboardBundleById,
  getLandingMapBundle,
  setLandingMapBundle,
  getProjectMapBundle,
  setProjectMapBundle,
  getDashboardGeoBundle,
  setDashboardGeoBundle,
}
