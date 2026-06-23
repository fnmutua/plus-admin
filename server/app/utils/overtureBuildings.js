const OVERTURE_SERVICE_URL = (
  process.env.OVERTURE_BUILDINGS_SERVICE_URL || 'http://127.0.0.1:8001'
).replace(/\/$/, '')

const TIMEOUT_MS = Number(process.env.OVERTURE_FETCH_TIMEOUT_MS || 120000)
const db = require('../models')

function toFiniteNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function dropZFromCoords(coords) {
  if (!Array.isArray(coords)) return coords
  if (
    coords.length >= 2 &&
    (typeof coords[0] === 'number' || typeof coords[0] === 'string') &&
    (typeof coords[1] === 'number' || typeof coords[1] === 'string')
  ) {
    const lng = toFiniteNumber(coords[0])
    const lat = toFiniteNumber(coords[1])
    if (lng === null || lat === null) {
      throw new Error('Invalid coordinate values in settlement geometry')
    }
    return [lng, lat]
  }
  return coords.map(dropZFromCoords)
}

function parseGeoJsonGeometry(geometry) {
  if (!geometry) return null
  if (typeof geometry === 'string') {
    try {
      return JSON.parse(geometry)
    } catch {
      throw new Error('Settlement geometry string is not valid JSON')
    }
  }
  return geometry
}

function normalizeGeometryForOverture(geometry) {
  const parsed = parseGeoJsonGeometry(geometry)
  if (!parsed?.type || !parsed.coordinates) {
    throw new Error('Valid GeoJSON geometry is required')
  }

  if (parsed.type !== 'Polygon' && parsed.type !== 'MultiPolygon') {
    throw new Error('Only Polygon or MultiPolygon geometry is supported')
  }

  return {
    type: parsed.type,
    coordinates: dropZFromCoords(parsed.coordinates),
  }
}

/**
 * Fetch Overture building footprints clipped to a settlement geometry.
 * Calls the standalone FastAPI service (overture_buildings_service.py).
 *
 * @param {object} geometry GeoJSON geometry (Polygon/MultiPolygon)
 * @returns {Promise<{ count: number, geojson: object }>}
 */
async function fetchOvertureBuildingsForGeometry(geometry) {
  if (!geometry || !geometry.type) {
    throw new Error('Valid GeoJSON geometry is required')
  }

  if (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon') {
    throw new Error('Only Polygon or MultiPolygon geometry is supported')
  }

  const url = `${OVERTURE_SERVICE_URL}/buildings_in_polygon`
  const body = geometry

  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }

  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    options.signal = AbortSignal.timeout(TIMEOUT_MS)
  }

  let res
  try {
    res = await fetch(url, options)
  } catch (err) {
    const hint =
      `Is the Overture service running? Start it with: ` +
      `python server/scripts/overture_buildings_service.py (${OVERTURE_SERVICE_URL})`
    throw new Error(`${err.message || 'Overture service unreachable'}. ${hint}`)
  }

  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    throw new Error(`Invalid JSON from Overture service: ${text.slice(0, 200)}`)
  }

  if (!res.ok) {
    const detail = data.detail || data.message || text || `HTTP ${res.status}`
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }

  return {
    count: Number(data.count) || 0,
    geojson: data.geojson || { type: 'FeatureCollection', features: [] },
  }
}

/**
 * Bulk-insert structure rows from Overture building footprints.
 * Codes are prefixed OVT-{settlementId}- so re-import can replace prior Overture rows.
 *
 * @param {number} settlementId
 * @param {object} geojson GeoJSON FeatureCollection
 * @param {number|null} userId
 * @param {{ replaceExisting?: boolean }} options
 * @returns {Promise<{ created: number, skipped: number, total: number }>}
 */
async function createStructuresFromOvertureGeojson(
  settlementId,
  geojson,
  userId,
  { replaceExisting = true, replaceAll = false } = {}
) {
  const features = geojson?.features || []
  if (!features.length) {
    return { created: 0, skipped: 0, total: 0 }
  }

  const codePrefix = `OVT-${settlementId}-`
  const t = await db.sequelize.transaction()

  try {
    if (replaceExisting) {
      if (replaceAll) {
        await db.sequelize.query(
          `DELETE FROM structure WHERE settlement_id = :settlementId`,
          {
            replacements: { settlementId },
            transaction: t,
          }
        )
      } else {
        await db.sequelize.query(
          `DELETE FROM structure WHERE settlement_id = :settlementId AND code LIKE :codePrefix`,
          {
            replacements: { settlementId, codePrefix: `${codePrefix}%` },
            transaction: t,
          }
        )
      }
    }

    let created = 0
    let skipped = 0

    for (let i = 0; i < features.length; i++) {
      const feature = features[i]
      const geom = feature?.geometry
      if (!geom || (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon')) {
        skipped++
        continue
      }

      const rawCode = feature.properties?.code ?? String(i)
      const code = `${codePrefix}${rawCode}`

      const [inserted] = await db.sequelize.query(
        `INSERT INTO structure (settlement_id, code, geom, "createdBy", "createdAt", "updatedAt")
         VALUES (
           :settlementId,
           :code,
           ST_SetSRID(ST_GeomFromGeoJSON(:geomJson), 4326),
           :createdBy,
           NOW(),
           NOW()
         )
         ON CONFLICT (code) DO NOTHING
         RETURNING structure_id`,
        {
          replacements: {
            settlementId,
            code,
            geomJson: JSON.stringify(geom),
            createdBy: userId ?? null,
          },
          transaction: t,
        }
      )

      if (Array.isArray(inserted) && inserted.length > 0) {
        created++
      } else {
        skipped++
      }
    }

    await t.commit()
    return { created, skipped, total: features.length }
  } catch (err) {
    await t.rollback()
    throw err
  }
}

async function importOvertureStructuresForSettlement(
  settlementId,
  userId,
  geojson = null,
  { replaceExisting = true, replaceAll = false } = {}
) {
  let effectiveGeojson = geojson

  if (!effectiveGeojson?.features?.length) {
    const geomRow = await db.sequelize.query(
      `SELECT ST_AsGeoJSON(geom)::json AS geom FROM settlement WHERE id = :settlementId AND geom IS NOT NULL`,
      {
        replacements: { settlementId },
        type: db.sequelize.QueryTypes.SELECT,
      }
    )
    const geom = geomRow?.[0]?.geom
    if (!geom) {
      console.log(`[Overture structures] settlement ${settlementId}: no geometry`)
      return { created: 0, skipped: 0, total: 0 }
    }

    const overture = await fetchOvertureBuildingsForGeometry(geom)
    effectiveGeojson = overture.geojson
  }

  if (!effectiveGeojson?.features?.length) {
    console.log(`[Overture structures] settlement ${settlementId}: no building footprints`)
    return { created: 0, skipped: 0, total: 0 }
  }

  const result = await createStructuresFromOvertureGeojson(
    settlementId,
    effectiveGeojson,
    userId,
    { replaceExisting, replaceAll }
  )
  console.log(
    `[Overture structures] settlement ${settlementId}: created ${result.created}, skipped ${result.skipped}, total ${result.total}`
  )
  return result
}

module.exports = {
  fetchOvertureBuildingsForGeometry,
  createStructuresFromOvertureGeojson,
  importOvertureStructuresForSettlement,
  normalizeGeometryForOverture,
  parseGeoJsonGeometry,
}
