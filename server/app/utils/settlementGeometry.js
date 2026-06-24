const ALLOWED_SETTLEMENT_GEOMETRY_TYPES = new Set(['Point', 'Polygon', 'MultiPolygon'])

/**
 * Normalize GeoJSON before persisting settlement.geom.
 * Accepts raw geometry, Feature, or FeatureCollection payloads from the map UI.
 */
function normalizeSettlementGeom(geom) {
  if (geom == null) return geom

  let parsed = geom
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed)
    } catch {
      throw new Error('Invalid settlement geometry JSON')
    }
  }

  if (parsed.type === 'Feature' && parsed.geometry) {
    parsed = parsed.geometry
  } else if (parsed.type === 'FeatureCollection' && parsed.features?.[0]?.geometry) {
    parsed = parsed.features[0].geometry
  }

  if (!parsed?.type || !parsed.coordinates) {
    throw new Error('Settlement geometry must be a GeoJSON geometry object')
  }

  if (!ALLOWED_SETTLEMENT_GEOMETRY_TYPES.has(parsed.type)) {
    throw new Error(`Unsupported settlement geometry type: ${parsed.type}`)
  }

  return {
    type: parsed.type,
    coordinates: parsed.coordinates,
  }
}

module.exports = {
  normalizeSettlementGeom,
  ALLOWED_SETTLEMENT_GEOMETRY_TYPES,
}
