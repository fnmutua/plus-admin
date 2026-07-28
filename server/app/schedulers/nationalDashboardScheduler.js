const cron = require('node-cron')
const {
  refreshNationalDashboardBundle,
  refreshAllDashboardBundles,
} = require('../services/nationalDashboardBundle')
const { refreshAllMapBundles } = require('../services/mapBundleService')
const { refreshDashboardGeoBundle } = require('../services/dashboardGeoBundleService')

let scheduledTask = null

/** Every 10 minutes — keep dashboard + map Redis bundles warm. */
const SCHEDULE = process.env.NATIONAL_DASHBOARD_CRON || '*/10 * * * *'

function warmAllBundles() {
  refreshAllDashboardBundles().catch((err) => {
    console.error('[dashboard-bundle] scheduled warm failed:', err.message)
  })
  refreshAllMapBundles().catch((err) => {
    console.error('[map-bundle] scheduled warm failed:', err.message)
  })
  refreshDashboardGeoBundle().catch((err) => {
    console.error('[dashboard-geo-bundle] scheduled warm failed:', err.message)
  })
}

function startNationalDashboardScheduler() {
  if (scheduledTask) return scheduledTask

  if (!cron.validate(SCHEDULE)) {
    console.error(`[dashboard-bundle] Invalid cron: ${SCHEDULE}`)
    return null
  }

  scheduledTask = cron.schedule(SCHEDULE, () => {
    warmAllBundles()
  })

  console.log(`[dashboard-bundle] Scheduled refresh: "${SCHEDULE}" (every 10 min)`)

  warmAllBundles()

  return scheduledTask
}

module.exports = { startNationalDashboardScheduler, refreshNationalDashboardBundle }
