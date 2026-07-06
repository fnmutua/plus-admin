import { GOOGLE_MAPS_API_KEY as googleMapsApiKey } from '@/config/googleMaps'

declare global {
  interface Window {
    google: any
  }
}

let loadPromise: Promise<void> | null = null
let optionsSet = false

/**
 * Load the Google Maps JS API once using the v2 functional API
 * (`setOptions()` + `importLibrary()`). The v2 loader removed the old
 * `Loader` class. We import the core libraries used across the app so
 * `window.google.maps` is fully populated for legacy callers.
 */
export function loadGoogleMapsApi(): Promise<void> {
  if (typeof window !== 'undefined' && window.google?.maps) {
    return Promise.resolve()
  }

  if (!loadPromise) {
    loadPromise = (async () => {
      const { setOptions, importLibrary } = await import('@googlemaps/js-api-loader')

      if (!optionsSet) {
        setOptions({
          key: googleMapsApiKey,
          v: 'weekly',
          region: 'KE',
          language: 'en'
        })
        optionsSet = true
      }

      const coreLibraries = ['maps', 'marker', 'geometry', 'places'] as const
      const results = await Promise.allSettled([
        ...coreLibraries.map((name) => importLibrary(name)),
        importLibrary('drawing')
      ])

      const failedCore = results
        .slice(0, coreLibraries.length)
        .find((r) => r.status === 'rejected')
      if (failedCore) {
        throw (failedCore as PromiseRejectedResult).reason
      }

      if (!window.google?.maps) {
        throw new Error('Google Maps API failed to load')
      }
    })().catch((err) => {
      loadPromise = null
      throw err
    })
  }

  return loadPromise
}

export function isGoogleMapsReady(): boolean {
  return typeof window !== 'undefined' && !!window.google?.maps
}
