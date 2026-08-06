/**
 * Shared Google Maps style helpers used across the app.
 * Soft declutter: hide transit + business POIs; keep roads and locality labels.
 */

export const GOOGLE_MAP_DECLUTTER_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels',
    stylers: [{ visibility: 'on' }],
  },
]

/** Dark roadmap palette (portal dark mode). */
export const GOOGLE_MAP_DARK_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1a2228' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#a7b0ac' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#12181c' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#2c363c' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#bdbdbd' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#152028' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#2c363c' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8a968e' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#373f44' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3c444a' }],
  },
  {
    featureType: 'road.highway.controlled_access',
    elementType: 'geometry',
    stylers: [{ color: '#4e565c' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0e1626' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3d3d3d' }],
  },
]

/** Merge app declutter styles after any caller-provided styles. */
export function mergeGoogleMapStyles(
  styles?: google.maps.MapTypeStyle[] | null
): google.maps.MapTypeStyle[] {
  const base = Array.isArray(styles) ? styles : []
  return [...base, ...GOOGLE_MAP_DECLUTTER_STYLES]
}

/** Roadmap styles: declutter always; optional dark palette. */
export function googleRoadmapStyles(isDark = false): google.maps.MapTypeStyle[] {
  return isDark
    ? [...GOOGLE_MAP_DARK_STYLES, ...GOOGLE_MAP_DECLUTTER_STYLES]
    : [...GOOGLE_MAP_DECLUTTER_STYLES]
}

/**
 * Patch google.maps.Map so every map instance gets declutter styles by default
 * (including vue3-google-map and imperative `new google.maps.Map(...)`).
 */
export function patchGoogleMapsDeclutterDefaults(): void {
  const maps = (window as any)?.google?.maps
  if (!maps?.Map || maps.Map.__kesmisDeclutterPatched) return

  const OriginalMap = maps.Map as any

  class KesmisMap extends OriginalMap {
    constructor(el: HTMLElement, opts: google.maps.MapOptions = {}) {
      super(el, {
        ...opts,
        styles: mergeGoogleMapStyles(opts?.styles as google.maps.MapTypeStyle[] | undefined),
      })
    }
  }

  const originalSetOptions = OriginalMap.prototype.setOptions
  OriginalMap.prototype.setOptions = function setOptionsWithDeclutter(
    this: google.maps.Map,
    options?: google.maps.MapOptions
  ) {
    if (!options || !('styles' in options)) {
      return originalSetOptions.call(this, options)
    }
    return originalSetOptions.call(this, {
      ...options,
      styles: mergeGoogleMapStyles(options.styles as google.maps.MapTypeStyle[] | undefined),
    })
  }

  ;(KesmisMap as any).__kesmisDeclutterPatched = true
  maps.Map = KesmisMap
}

/** Watch for Maps API loaded outside our loader (e.g. vue3-google-map api-key). */
export function watchAndPatchGoogleMapsDeclutter(): void {
  if (typeof window === 'undefined') return
  patchGoogleMapsDeclutterDefaults()
  if ((window as any).google?.maps?.Map?.__kesmisDeclutterPatched) return

  const started = Date.now()
  const timer = window.setInterval(() => {
    patchGoogleMapsDeclutterDefaults()
    if (
      (window as any).google?.maps?.Map?.__kesmisDeclutterPatched ||
      Date.now() - started > 45000
    ) {
      window.clearInterval(timer)
    }
  }, 150)
}
