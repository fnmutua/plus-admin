import { GOOGLE_MAPS_API_KEY as googleMapsApiKey } from '@/config/googleMaps'

declare global {
  interface Window {
    google: any
  }
}

let loadPromise: Promise<void> | null = null

/** Load Google Maps JS API once (drawing, geometry, places). */
export function loadGoogleMapsApi(): Promise<void> {
  if (typeof window !== 'undefined' && window.google?.maps?.drawing) {
    return Promise.resolve()
  }

  if (!loadPromise) {
    loadPromise = (async () => {
      const { Loader } = await import('@googlemaps/js-api-loader')
      const loader = new Loader({
        apiKey: googleMapsApiKey,
        version: 'weekly',
        libraries: ['drawing', 'geometry', 'places'],
        region: 'KE',
        language: 'en'
      })
      await loader.load()
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
  return typeof window !== 'undefined' && !!window.google?.maps?.drawing
}
