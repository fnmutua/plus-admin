/**
 * Cached national map payloads (settlements / project locations + counties + geo).
 */

const { invokeController } = require('../utils/invokeController')
const {
  setLandingMapBundle,
  setProjectMapBundle,
  TTL_SECONDS,
} = require('../utils/dashboardBundleRedis')
const tablesController = require('../controllers/tables.controller')
const { normalizeFeatureCollection } = require('../utils/normalizeGeoJson')

const buildInFlight = new Map()

async function buildLandingMapBundle() {
  const [settlementsRes, countiesRes, geoRes] = await Promise.all([
    invokeController(tablesController.getOptimizedSettlements, {}, {
      query: {
        model: 'settlement',
        includeCentroids: 'true',
        includePolygons: 'false',
      },
    }),
    invokeController(tablesController.getCountiesList, {}, {
      query: {
        model: 'county',
        cache_key: 'counties_list_optimized',
      },
    }),
    invokeController(tablesController.getBatchGeometries, {
      model: 'county',
      cache_key: 'county_geo_optimized',
    }),
  ])

  return {
    kind: 'landing',
    filterLevel: 'national',
    builtAt: new Date().toISOString(),
    ttlSeconds: TTL_SECONDS,
    settlements: normalizeFeatureCollection(settlementsRes?.data),
    counties: countiesRes?.data ?? [],
    countyGeo: normalizeFeatureCollection(geoRes?.data),
  }
}

async function buildProjectMapBundle() {
  const [projectsRes, countiesRes, geoRes] = await Promise.all([
    invokeController(tablesController.getOptimizedProjectLocations, {}, {
      query: {
        model: 'project_location',
        includeCentroids: 'true',
        includePolygons: 'false',
        bypassScope: 'true',
      },
    }),
    invokeController(tablesController.getCountiesList, {}, {
      query: {
        model: 'county',
        cache_key: 'counties_list_optimized',
      },
    }),
    invokeController(tablesController.getBatchGeometries, {
      model: 'county',
      cache_key: 'county_geo_optimized',
    }),
  ])

  return {
    kind: 'projects',
    filterLevel: 'national',
    builtAt: new Date().toISOString(),
    ttlSeconds: TTL_SECONDS,
    projectLocations: normalizeFeatureCollection(projectsRes?.data),
    counties: countiesRes?.data ?? [],
    countyGeo: normalizeFeatureCollection(geoRes?.data),
    featureCount: normalizeFeatureCollection(projectsRes?.data).features.length,
  }
}

async function refreshMapBundle(kind) {
  if (buildInFlight.has(kind)) return buildInFlight.get(kind)

  const promise = (async () => {
    const started = Date.now()
    console.log(`[map-bundle] building ${kind}…`)
    const bundle =
      kind === 'landing' ? await buildLandingMapBundle() : await buildProjectMapBundle()
    if (kind === 'landing') {
      await setLandingMapBundle(bundle)
    } else {
      await setProjectMapBundle(bundle)
    }
    console.log(
      `[map-bundle] cached ${kind} in ${Date.now() - started}ms` +
        (kind === 'projects' ? ` (${bundle.featureCount ?? 0} project locations)` : ''),
    )
    return bundle
  })()

  buildInFlight.set(kind, promise)
  try {
    return await promise
  } finally {
    buildInFlight.delete(kind)
  }
}

async function refreshLandingMapBundle() {
  return refreshMapBundle('landing')
}

async function refreshProjectMapBundle() {
  return refreshMapBundle('projects')
}

async function refreshAllMapBundles() {
  await Promise.all([refreshLandingMapBundle(), refreshProjectMapBundle()])
}

module.exports = {
  buildLandingMapBundle,
  buildProjectMapBundle,
  refreshLandingMapBundle,
  refreshProjectMapBundle,
  refreshAllMapBundles,
}
