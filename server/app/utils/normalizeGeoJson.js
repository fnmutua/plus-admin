/**
 * Ensure a value is a Mapbox-safe FeatureCollection (features must be an array, never null).
 */
function normalizeFeatureCollection(raw) {
  if (!raw) {
    return { type: 'FeatureCollection', features: [] }
  }

  let value = raw
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return { type: 'FeatureCollection', features: [] }
    }
  }

  if (value && typeof value === 'object') {
    if (value.data?.type === 'FeatureCollection') value = value.data
    else if (value.results?.type === 'FeatureCollection') value = value.results
  }

  if (!value || value.type !== 'FeatureCollection') {
    return { type: 'FeatureCollection', features: [] }
  }

  return {
    type: 'FeatureCollection',
    features: Array.isArray(value.features) ? value.features : [],
  }
}

module.exports = { normalizeFeatureCollection }
