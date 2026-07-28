/** Ensure Mapbox-safe FeatureCollection (features array, never null). */
export function normalizeFeatureCollection(raw: unknown): GeoJSON.FeatureCollection {
  if (!raw) {
    return { type: 'FeatureCollection', features: [] }
  }

  let value: any = raw
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

export function isValidFeatureCollection(raw: unknown): raw is GeoJSON.FeatureCollection {
  const fc = raw as GeoJSON.FeatureCollection | null | undefined
  return !!fc && fc.type === 'FeatureCollection' && Array.isArray(fc.features)
}
