import mapboxgl from 'mapbox-gl'

const DEFAULT_WEBGL_MESSAGE =
  'Unable to load the map because WebGL is not available. Enable hardware acceleration in your browser, or try Chrome or Edge on a device with GPU support.'

const ZERO_SIZE_MESSAGE =
  'The map area is not visible yet. Try resizing the window or click Retry.'

/** Check whether Mapbox GL can run in this browser/environment. */
export function getMapboxSupportMessage(options?: { failIfMajorPerformanceCaveat?: boolean }): string | null {
  try {
    const result = mapboxgl.supported({
      failIfMajorPerformanceCaveat: options?.failIfMajorPerformanceCaveat ?? false,
    })
    if (result) return null
  } catch {
    /* fall through to manual probe */
  }

  if (typeof document === 'undefined') return DEFAULT_WEBGL_MESSAGE

  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    if (gl) return null
  } catch {
    /* ignore */
  }

  return DEFAULT_WEBGL_MESSAGE
}

export function isMapboxSupported(): boolean {
  return getMapboxSupportMessage() === null
}

/** Wait until an element has non-zero layout dimensions (needed before Mapbox init). */
export async function waitForElementLayout(
  element: HTMLElement,
  maxAttempts = 40
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { width, height } = element.getBoundingClientRect()
    if (width > 0 && height > 0) return true
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  return false
}

export function getMapContainerLayoutMessage(element: HTMLElement | null | undefined): string | null {
  if (!element) return 'Map container not found.'
  const { width, height } = element.getBoundingClientRect()
  if (width > 0 && height > 0) return null
  return ZERO_SIZE_MESSAGE
}

export type CreateMapboxMapOptions = Omit<ConstructorParameters<typeof mapboxgl.Map>[0], 'container'> & {
  failIfMajorPerformanceCaveat?: boolean
}

/** Create a Mapbox map after validating support and container layout. */
export async function createMapboxMap(
  container: HTMLElement,
  options: CreateMapboxMapOptions
): Promise<mapboxgl.Map> {
  const supportMessage = getMapboxSupportMessage({
    failIfMajorPerformanceCaveat: options.failIfMajorPerformanceCaveat ?? false,
  })
  if (supportMessage) {
    throw new Error(supportMessage)
  }

  const hasLayout = await waitForElementLayout(container)
  if (!hasLayout) {
    throw new Error(ZERO_SIZE_MESSAGE)
  }

  const map = new mapboxgl.Map({
    antialias: false,
    failIfMajorPerformanceCaveat: false,
    ...options,
    container,
  })

  map.resize()
  return map
}
