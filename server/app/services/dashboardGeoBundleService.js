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

// National choropleth — this is a whole-country fill-color view, not a
// navigation map, so boundary precision matters far less than payload size.
// ~0.005deg (~550m at the equator) cuts total geometry size ~86% (measured:
// ward 4.48MB→0.60MB, subcounty 1.51MB→0.26MB, county 0.81MB→0.11MB) with
// zero polygons collapsing to empty even up to 3x this tolerance. Chosen to
// stay under the smallest ward's own characteristic size (~1.8km at the 5th
// percentile, ~520m at the minimum) so only a handful of the tiniest urban
// wards lose meaningful shape. PreserveTopology keeps shared borders between
// adjacent polygons from gapping/overlapping. Precision 5 (~1.1m) matches
// the tolerance instead of wasting bytes on sub-meter digits the
// simplification already discarded.
const SIMPLIFY_TOLERANCE_DEGREES = 0.005
const GEOJSON_PRECISION = 5

async function fetchAdminBoundaryGeo(model) {
  const props = ADMIN_GEO_PROPS[model]
  if (!props) {
    throw new Error(`Unsupported admin geo model: ${model}`)
  }

  const propsClause = `json_build_object(${props.map((p) => `'${p}', "${p}"`).join(', ')})`

  const qry = `
    SELECT row_to_json(fc) AS json_build_object
    FROM (
      SELECT 'FeatureCollection' AS type,
             array_to_json(array_agg(f)) AS features
      FROM (
        SELECT 'Feature' AS type,
               ST_AsGeoJSON(
                 ST_SimplifyPreserveTopology(geom, ${SIMPLIFY_TOLERANCE_DEGREES}),
                 ${GEOJSON_PRECISION}
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
