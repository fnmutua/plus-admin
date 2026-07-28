import * as turf from '@turf/turf'
import { getDashboardGeoBundle, type DashboardGeoBundle } from '@/api/dashboard/bundle'
import { geoCache } from './dashboardCache'

let geoBundleLoadPromise: Promise<boolean> | null = null

export function filterGeoByField(
  fullGeo: { features?: any[] },
  filterField: string,
  filterValues: Array<string | number>,
) {
  const ids = new Set(filterValues.map((v) => Number(v)))
  const features = (fullGeo.features || []).filter((feature) =>
    ids.has(Number(feature.properties?.[filterField])),
  )
  return turf.featureCollection(features)
}

export function hydrateGeoCacheFromBundle(bundle: DashboardGeoBundle) {
  if (bundle.countyGeo?.features?.length) {
    geoCache.set('county', bundle.countyGeo)
  }
  if (bundle.subcountyGeo?.features?.length) {
    geoCache.set('subcounty:full', bundle.subcountyGeo)
  }
  if (bundle.wardGeo?.features?.length) {
    geoCache.set('ward:full', bundle.wardGeo)
  }
}

/** Load Redis-warmed county / subcounty / ward geo into the session cache. */
export async function ensureDashboardGeoBundleLoaded(): Promise<boolean> {
  if (geoCache.has('county') && geoCache.has('subcounty:full')) {
    return true
  }

  if (!geoBundleLoadPromise) {
    geoBundleLoadPromise = getDashboardGeoBundle()
      .then((bundle) => {
        if (bundle.code !== '0000') return false
        hydrateGeoCacheFromBundle(bundle)
        return geoCache.has('county')
      })
      .catch(() => false)
  }

  return geoBundleLoadPromise
}

/** Derive a filtered subset from the full cached layer (no API round-trip). */
export function subsetGeoFromCache(
  model: string,
  filterFields: string[],
  filterValues: Array<string | number>,
): any | null {
  const geoCacheKey = `${model}:${filterFields.join(',')}:${JSON.stringify(filterValues)}`
  if (geoCache.has(geoCacheKey)) {
    return geoCache.get(geoCacheKey)
  }

  const fullKey =
    model === 'subcounty' ? 'subcounty:full' : model === 'ward' ? 'ward:full' : null
  if (!fullKey || !geoCache.has(fullKey)) return null

  const field = filterFields[0]
  if (!field) return null

  const collection = filterGeoByField(geoCache.get(fullKey), field, filterValues)
  geoCache.set(geoCacheKey, collection)
  return collection
}

export function applyGeoAspect(collection: { features?: any[] }): number {
  const bbox = turf.bbox(collection)
  const yCoord = (bbox[1] + bbox[3]) / 2
  return Math.cos((yCoord * Math.PI) / 180)
}
