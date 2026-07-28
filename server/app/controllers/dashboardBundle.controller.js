const {
  getNationalBundle,
  getDashboardBundleById,
  getLandingMapBundle,
  getProjectMapBundle,
  TTL_SECONDS,
} = require('../utils/dashboardBundleRedis')
const {
  refreshNationalDashboardBundle,
  refreshDashboardBundle,
} = require('../services/nationalDashboardBundle')
const {
  refreshLandingMapBundle,
  refreshProjectMapBundle,
} = require('../services/mapBundleService')

exports.getNationalDashboardBundle = async (req, res) => {
  try {
    const force = req.query.refresh === '1' || req.body?.refresh === true

    if (!force) {
      const cached = await getNationalBundle()
      if (cached) {
        return res.status(200).send({
          code: '0000',
          fromCache: true,
          ...cached,
        })
      }
    }

    const bundle = await refreshNationalDashboardBundle()
    return res.status(200).send({
      code: '0000',
      fromCache: false,
      ...bundle,
    })
  } catch (err) {
    console.error('[dashboard-bundle] national GET failed:', err.message)
    return res.status(500).send({
      code: '5000',
      message: err.message || 'Failed to load national dashboard bundle',
    })
  }
}

exports.getDashboardBundle = async (req, res) => {
  try {
    const dashboardId = Number(req.params.id)
    if (!dashboardId) {
      return res.status(400).send({ code: '4000', message: 'Invalid dashboard id' })
    }

    const force = req.query.refresh === '1' || req.body?.refresh === true

    if (!force) {
      const cached = await getDashboardBundleById(dashboardId)
      if (cached) {
        return res.status(200).send({
          code: '0000',
          fromCache: true,
          ...cached,
        })
      }
    }

    const bundle = await refreshDashboardBundle(dashboardId)
    return res.status(200).send({
      code: '0000',
      fromCache: false,
      ...bundle,
    })
  } catch (err) {
    console.error('[dashboard-bundle] GET failed:', err.message)
    return res.status(500).send({
      code: '5000',
      message: err.message || 'Failed to load dashboard bundle',
    })
  }
}

exports.refreshNationalDashboardBundle = async (req, res) => {
  try {
    const bundle = await refreshNationalDashboardBundle()
    return res.status(200).send({
      code: '0000',
      fromCache: false,
      ttlSeconds: TTL_SECONDS,
      builtAt: bundle.builtAt,
      dashboardId: bundle.dashboardId,
      cardCount: bundle.cards.length,
      chartCount: bundle.sections.reduce((n, s) => n + s.charts.length, 0),
    })
  } catch (err) {
    console.error('[dashboard-bundle] national refresh failed:', err.message)
    return res.status(500).send({
      code: '5000',
      message: err.message || 'Failed to refresh national dashboard bundle',
    })
  }
}

exports.refreshDashboardBundle = async (req, res) => {
  try {
    const dashboardId = Number(req.params.id)
    if (!dashboardId) {
      return res.status(400).send({ code: '4000', message: 'Invalid dashboard id' })
    }
    const bundle = await refreshDashboardBundle(dashboardId)
    return res.status(200).send({
      code: '0000',
      fromCache: false,
      ttlSeconds: TTL_SECONDS,
      builtAt: bundle.builtAt,
      dashboardId: bundle.dashboardId,
      cardCount: bundle.cards.length,
      chartCount: bundle.sections.reduce((n, s) => n + s.charts.length, 0),
    })
  } catch (err) {
    console.error('[dashboard-bundle] refresh failed:', err.message)
    return res.status(500).send({
      code: '5000',
      message: err.message || 'Failed to refresh dashboard bundle',
    })
  }
}

async function getMapBundle(req, res, kind, getCached, refresh, opts = {}) {
  try {
    const force = req.query.refresh === '1' || req.body?.refresh === true

    if (!force) {
      const cached = await getCached()
      const cachedCount = opts.featureCount?.(cached) ?? null
      if (cached && (cachedCount == null || cachedCount > 0)) {
        return res.status(200).send({
          code: '0000',
          fromCache: true,
          ...cached,
        })
      }
      if (cached && cachedCount === 0) {
        console.warn(`[map-bundle] ${kind} cache empty — rebuilding`)
      }
    }

    const bundle = await refresh()
    return res.status(200).send({
      code: '0000',
      fromCache: false,
      ...bundle,
    })
  } catch (err) {
    console.error(`[map-bundle] ${kind} GET failed:`, err.message)
    return res.status(500).send({
      code: '5000',
      message: err.message || `Failed to load ${kind} map bundle`,
    })
  }
}

exports.getLandingMapBundle = (req, res) =>
  getMapBundle(req, res, 'landing', getLandingMapBundle, refreshLandingMapBundle)

exports.getProjectMapBundle = (req, res) =>
  getMapBundle(req, res, 'projects', getProjectMapBundle, refreshProjectMapBundle, {
    featureCount: (cached) =>
      cached?.projectLocations?.features?.length ??
      cached?.featureCount ??
      null,
  })
