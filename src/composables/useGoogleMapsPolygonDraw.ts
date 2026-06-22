import { ref } from 'vue'

export type PolygonDrawCompleteHandler = (polygon: any) => void

const DEFAULT_POLYGON_OPTIONS = {
  fillColor: '#FF0000',
  fillOpacity: 0.2,
  strokeWeight: 2,
  strokeColor: '#FF0000',
  clickable: true,
  editable: true,
  draggable: false,
  zIndex: 1000000
}

/** Click-to-draw polygon replacement for deprecated DrawingManager (Maps JS API 3.65+). */
export function useGoogleMapsPolygonDraw() {
  const isDrawing = ref(false)
  const pointCount = ref(0)

  let mapInstance: any = null
  let completeHandler: PolygonDrawCompleteHandler | null = null
  let clickListener: any = null
  let dblClickListener: any = null
  let pendingClickTimer: ReturnType<typeof setTimeout> | null = null
  const path: any[] = []
  let previewLine: any = null

  function clearPreview() {
    if (previewLine) {
      previewLine.setMap(null)
      previewLine = null
    }
    path.length = 0
    pointCount.value = 0
  }

  function updatePreview() {
    if (!mapInstance || path.length === 0) return
    if (!previewLine) {
      previewLine = new window.google.maps.Polyline({
        path,
        strokeColor: '#FF0000',
        strokeWeight: 2,
        strokeOpacity: 0.9,
        map: mapInstance,
        zIndex: 1000001
      })
    } else {
      previewLine.setPath(path)
    }
    pointCount.value = path.length
  }

  function stopDrawing() {
    isDrawing.value = false
    if (pendingClickTimer) {
      clearTimeout(pendingClickTimer)
      pendingClickTimer = null
    }
    if (mapInstance) {
      mapInstance.setOptions({ draggableCursor: null, disableDoubleClickZoom: true })
    }
    if (clickListener) {
      window.google.maps.event.removeListener(clickListener)
      clickListener = null
    }
    if (dblClickListener) {
      window.google.maps.event.removeListener(dblClickListener)
      dblClickListener = null
    }
    clearPreview()
    completeHandler = null
  }

  function finishDrawing(): boolean {
    if (!mapInstance || !completeHandler) {
      stopDrawing()
      return false
    }
    if (path.length < 3) {
      return false
    }

    const polygon = new window.google.maps.Polygon({
      ...DEFAULT_POLYGON_OPTIONS,
      paths: [...path],
      map: mapInstance
    })

    const handler = completeHandler
    stopDrawing()
    handler(polygon)
    return true
  }

  function startDrawing(map: any, onComplete: PolygonDrawCompleteHandler): boolean {
    stopDrawing()
    if (!map || !window.google?.maps) return false

    mapInstance = map
    completeHandler = onComplete
    isDrawing.value = true
    map.setOptions({ draggableCursor: 'crosshair', disableDoubleClickZoom: true })

    // Defer single clicks so double-click can finish without adding stray points
    clickListener = map.addListener('click', (event: any) => {
      if (pendingClickTimer) clearTimeout(pendingClickTimer)
      pendingClickTimer = setTimeout(() => {
        path.push(event.latLng)
        updatePreview()
        pendingClickTimer = null
      }, 220)
    })

    dblClickListener = map.addListener('dblclick', (event: any) => {
      event.stop()
      if (pendingClickTimer) {
        clearTimeout(pendingClickTimer)
        pendingClickTimer = null
      }
      finishDrawing()
    })

    return true
  }

  return {
    isDrawing,
    pointCount,
    startDrawing,
    stopDrawing,
    finishDrawing
  }
}
