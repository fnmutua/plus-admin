/* eslint-disable prettier/prettier */
const axios = require('axios')

const GEO_USERNAME = process.env.GEOSERVER_USERNAME || process.env.VITE_GEOSERVER_USERNAME || 'admin'
const GEO_PASSWORD = process.env.GEOSERVER_PASSWORD || process.env.VITE_GEOSERVER_PASSWORD || 'Admin@2011'
const GEO_SERVER_URL = process.env.GEOSERVER_URL || 'https://kesmis.go.ke/geoserver'
const WORKSPACE = 'kisip'
const CACHE_TTL_MS = Number(process.env.GEOSERVER_LAYER_CACHE_TTL_MS) || 10 * 60 * 1000

const geoAuth = () => ({ username: GEO_USERNAME, password: GEO_PASSWORD })

let catalogCache = {
  fetchedAt: 0,
  layers: [],
}

/** GeoServer WMS capabilities contain malformed XML; split blocks by queryable layer tags. */
function parseCapabilitiesLayers(xml) {
  const layers = []
  const openRe = /<Layer queryable="1"[^>]*>/g
  const openings = []
  let match

  while ((match = openRe.exec(xml)) !== null) {
    openings.push(match.index)
  }

  for (let i = 0; i < openings.length; i += 1) {
    const start = openings[i]
    const end = i + 1 < openings.length ? openings[i + 1] : xml.length
    const block = xml.slice(start, end)
    const nameMatch = block.match(/<Name>([^<]+)<\/Name>/)
    const titleMatch = block.match(/<Title>([^<]*)<\/Title>/)
    const bboxMatch = block.match(
      /<LatLonBoundingBox minx="([^"]*)" miny="([^"]*)" maxx="([^"]*)" maxy="([^"]*)"/,
    )
    const srsMatch = block.match(/<SRS>([^<]+)<\/SRS>/)

    if (!nameMatch || !bboxMatch) continue

    const minx = parseFloat(bboxMatch[1])
    const miny = parseFloat(bboxMatch[2])
    const maxx = parseFloat(bboxMatch[3])
    const maxy = parseFloat(bboxMatch[4])
    if ([minx, miny, maxx, maxy].some((v) => Number.isNaN(v))) continue

    layers.push({
      name: nameMatch[1],
      title: titleMatch?.[1] || nameMatch[1],
      crs: srsMatch?.[1] ? [srsMatch[1]] : ['EPSG:4326'],
      bbox: {
        westBoundLongitude: minx,
        southBoundLatitude: miny,
        eastBoundLongitude: maxx,
        northBoundLatitude: maxy,
      },
    })
  }

  return layers
}

function parseRestLayerNames(data) {
  let layers = data?.layers?.layer || []
  if (!Array.isArray(layers)) {
    layers = layers ? [layers] : []
  }
  return layers.map((layer) => layer?.name).filter(Boolean)
}

function mergeCatalog(capLayers, restNames) {
  const capMap = new Map(capLayers.map((layer) => [layer.name, layer]))
  const merged = []
  const seen = new Set()

  for (const name of restNames) {
    if (seen.has(name)) continue
    seen.add(name)
    merged.push(
      capMap.get(name) || {
        name,
        title: name,
        crs: ['EPSG:4326'],
        bbox: null,
      },
    )
  }

  for (const layer of capLayers) {
    if (seen.has(layer.name)) continue
    merged.push(layer)
  }

  return merged
}

async function fetchLayerCatalogFromCapabilities(forceRefresh = false) {
  const now = Date.now()
  if (!forceRefresh && catalogCache.layers.length && now - catalogCache.fetchedAt < CACHE_TTL_MS) {
    return catalogCache.layers
  }

  const [capResponse, restResponse] = await Promise.all([
    axios.get(`${GEO_SERVER_URL}/${WORKSPACE}/wms`, {
      auth: geoAuth(),
      timeout: 60000,
      responseType: 'text',
      params: {
        service: 'WMS',
        version: '1.1.1',
        request: 'GetCapabilities',
      },
    }),
    axios.get(`${GEO_SERVER_URL}/rest/layers.json`, {
      auth: geoAuth(),
      timeout: 60000,
      headers: { Accept: 'application/json' },
    }),
  ])

  const capLayers = parseCapabilitiesLayers(String(capResponse.data))
  const restNames = parseRestLayerNames(restResponse.data)
  const layers = mergeCatalog(capLayers, restNames)

  catalogCache = {
    fetchedAt: now,
    layers,
  }

  return layers
}

function layerBboxIntersectsCounty(layerBbox, countyBbox) {
  if (!layerBbox || !countyBbox) return true
  return (
    layerBbox.westBoundLongitude < countyBbox.maxx &&
    layerBbox.eastBoundLongitude > countyBbox.minx &&
    layerBbox.southBoundLatitude < countyBbox.maxy &&
    layerBbox.northBoundLatitude > countyBbox.miny
  )
}

async function getCountyBbox(countyId) {
  const db = require('../models')
  const { QueryTypes } = require('sequelize')
  const rows = await db.sequelize.query(
    `SELECT
      ST_XMin(ST_Extent(geom)) AS minx,
      ST_YMin(ST_Extent(geom)) AS miny,
      ST_XMax(ST_Extent(geom)) AS maxx,
      ST_YMax(ST_Extent(geom)) AS maxy
     FROM county
     WHERE id = :countyId
     GROUP BY id`,
    {
      replacements: { countyId: Number(countyId) },
      type: QueryTypes.SELECT,
    },
  )
  const row = rows?.[0]
  if (!row || row.minx == null) return null
  return {
    minx: Number(row.minx),
    miny: Number(row.miny),
    maxx: Number(row.maxx),
    maxy: Number(row.maxy),
  }
}

function toLayerOptions(layers) {
  return layers.map((layer) => ({
    value: layer.name,
    label: layer.title || layer.name,
  }))
}

async function getPaginatedLayerCatalog({ page, limit, countyId, forceRefresh = false }) {
  const allLayers = await fetchLayerCatalogFromCapabilities(forceRefresh)

  let filtered = allLayers
  if (countyId) {
    const countyBbox = await getCountyBbox(countyId)
    if (countyBbox) {
      filtered = allLayers.filter((layer) => layerBboxIntersectsCounty(layer.bbox, countyBbox))
    }
  }

  const total = filtered.length
  const start = (page - 1) * limit
  const data = filtered.slice(start, start + limit)

  return {
    data,
    total,
    options: toLayerOptions(allLayers),
    cachedAt: catalogCache.fetchedAt,
  }
}

function warmLayerCatalogCache() {
  fetchLayerCatalogFromCapabilities()
    .then((layers) => console.log(`GeoServer layer catalog warmed (${layers.length} layers)`))
    .catch((err) => console.warn('GeoServer layer catalog warmup failed:', err.message))
}

module.exports = {
  fetchLayerCatalogFromCapabilities,
  getPaginatedLayerCatalog,
  warmLayerCatalogCache,
  clearLayerCatalogCache: () => {
    catalogCache = { fetchedAt: 0, layers: [] }
  },
}
