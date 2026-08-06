/**
 * Cached admin-boundary geo for national dashboard choropleths (county / subcounty / ward).
 */

const db = require('../models')
const { setDashboardGeoBundle, TTL_SECONDS } = require('../utils/dashboardBundleRedis')
const { normalizeFeatureCollection } = require('../utils/normalizeGeoJson')

const buildInFlight = new Map()

const ADMIN_GEO_PROPS = {
  county: ['id', 'name'],
  subcounty: ['id', 'name', 'county_id'],
  ward: ['id', 'name', 'subcounty_id', 'county_id'],
}

// National choropleth — county overview can stay coarse; subcounty/ward charts
 // (especially county-scoped dashboards) need sharper boundaries.
 // Measured at 0.005deg (~550m): ward 4.48MB→0.60MB, subcounty 1.51MB→0.26MB,
 // county 0.81MB→0.11MB. PreserveTopology keeps shared borders from gapping.
 // Precision 5 (~1.1m) for county; 6 (~0.1m) for finer admin levels.
 const SIMPLIFY_TOLERANCE_BY_MODEL = {
   county: 0.005,
   subcounty: 0.001,
   ward: 0.0008,
 }
 const GEOJSON_PRECISION_BY_MODEL = {
   county: 5,
   subcounty: 6,
   ward: 6,
 }
 
 async function fetchAdminBoundaryGeo(model) {
   const props = ADMIN_GEO_PROPS[model]
   if (!props) {
     throw new Error(`Unsupported admin geo model: ${model}`)
   }
 
   const tolerance =
     SIMPLIFY_TOLERANCE_BY_MODEL[model] ?? SIMPLIFY_TOLERANCE_BY_MODEL.county
   const precision =
     GEOJSON_PRECISION_BY_MODEL[model] ?? GEOJSON_PRECISION_BY_MODEL.county
   const propsClause = `json_build_object(${props.map((p) => `'${p}', "${p}"`).join(', ')})`
 
   const qry = `
     SELECT row_to_json(fc) AS json_build_object
     FROM (
       SELECT 'FeatureCollection' AS type,
              array_to_json(array_agg(f)) AS features
       FROM (
         SELECT 'Feature' AS type,
                ST_AsGeoJSON(
                  ST_SimplifyPreserveTopology(geom, ${tolerance}),
                  ${precision}
                )::json AS geometry,
                ${propsClause} AS properties
         FROM ${model}
         WHERE geom IS NOT NULL AND ST_IsEmpty(geom) = false
       ) AS f
     ) AS fc
   `

  const rows = await db.sequelize.query(qry, {
    type: db.sequelize.QueryTypes.SELECT,
    mapToModel: false,
  })

  return normalizeFeatureCollection(
    rows[0]?.json_build_object || { type: 'FeatureCollection', features: [] },
  )
}

async function buildDashboardGeoBundle() {
  const [countyGeo, subcountyGeo, wardGeo] = await Promise.all([
    fetchAdminBoundaryGeo('county'),
    fetchAdminBoundaryGeo('subcounty'),
    fetchAdminBoundaryGeo('ward'),
  ])

  return {
    kind: 'dashboard-geo',
    filterLevel: 'national',
    builtAt: new Date().toISOString(),
    ttlSeconds: TTL_SECONDS,
    countyGeo,
    subcountyGeo,
    wardGeo,
    featureCounts: {
      county: countyGeo.features?.length ?? 0,
      subcounty: subcountyGeo.features?.length ?? 0,
      ward: wardGeo.features?.length ?? 0,
    },
  }
}

async function refreshDashboardGeoBundle() {
  if (buildInFlight.has('dashboard-geo')) return buildInFlight.get('dashboard-geo')

  const promise = (async () => {
    const started = Date.now()
    console.log('[dashboard-geo-bundle] building…')
    const bundle = await buildDashboardGeoBundle()
    await setDashboardGeoBundle(bundle)
    const counts = bundle.featureCounts
    console.log(
      `[dashboard-geo-bundle] cached in ${Date.now() - started}ms` +
        ` (county=${counts.county}, subcounty=${counts.subcounty}, ward=${counts.ward})`,
    )
    return bundle
  })()

  buildInFlight.set('dashboard-geo', promise)
  try {
    return await promise
  } finally {
    buildInFlight.delete('dashboard-geo')
  }
}

module.exports = {
  buildDashboardGeoBundle,
  refreshDashboardGeoBundle,
}
