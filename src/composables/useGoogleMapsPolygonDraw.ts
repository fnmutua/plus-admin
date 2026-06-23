import { ref } from 'vue'
import {
  DEFAULT_VERTEX_SNAP_RADIUS_METERS,
  snapToNearestBoundary,
  type BoundarySnapTargets,
  type MapSnapPoint,
  type MapSnapSegment,
} from '@/utils/mapVertexSnap'

export type PolygonDrawCompleteHandler = (polygon: any) => void

export type PolygonDrawOptions = {
  snapPoints?: MapSnapPoint[]
  snapSegments?: MapSnapSegment[]
  snapTargets?: BoundarySnapTargets
  snapRadiusMeters?: number
}

const DEFAULT_POLYGON_OPTIONS = {
  fillColor: '#FF0000',
  fillOpacity: 0.2,
  strokeWeight: 2,
  strokeColor: '#FF0000',
  clickable: true,
  editable: true,
  draggable: false,
  zIndex: 1000000,
}

/** Click-to-draw polygon replacement for deprecated DrawingManager (Maps JS API 3.65+). */
export function useGoogleMapsPolygonDraw() {
  const isDrawing = ref(false)
  const pointCount = ref(0)
  const snapPreviewActive = ref(false)

  let mapInstance: any = null
  let completeHandler: PolygonDrawCompleteHandler | null = null
  let clickListener: any = null
  let dblClickListener: any = null
  let mouseMoveListener: any = null
  let pendingClickTimer: ReturnType<typeof setTimeout> | null = null
  let pendingLatLng: any = null
  const path: any[] = []
  let previewLine: any = null
  let snapMarker: any = null
  let snapPoints: MapSnapPoint[] = []
  let snapSegments: MapSnapSegment[] = []
  let snapRadiusMeters = DEFAULT_VERTEX_SNAP_RADIUS_METERS

  function clearSnapMarker() {
    if (snapMarker) {
      snapMarker.setMap(null)
      snapMarker = null
    }
    snapPreviewActive.value = false
  }

  function getSnapCandidates(includeAllPathVertices = false): MapSnapPoint[] {
    const pathPoints = path.map((latLng) => ({
      lat: latLng.lat(),
      lng: latLng.lng(),
    }))

    if (includeAllPathVertices) {
      return [...snapPoints, ...pathPoints]
    }

    // Allow closing snap to the first vertex only — not to recently placed points.
    const closingPoint = pathPoints.length > 0 ? [pathPoints[0]] : []
    return [...snapPoints, ...closingPoint]
  }

  function snapLatLng(latLng: any) {
    const snapped = snapToNearestBoundary(
      latLng.lat(),
      latLng.lng(),
      getSnapCandidates(),
      snapSegments,
      snapRadiusMeters,
      window.google.maps
    )
    return new window.google.maps.LatLng(snapped.lat, snapped.lng)
  }

  function updateSnapPreview(latLng: any) {
    if (!mapInstance || !window.google?.maps) return

    const snapped = snapToNearestBoundary(
      latLng.lat(),
      latLng.lng(),
      getSnapCandidates(),
      snapSegments,
      snapRadiusMeters,
      window.google.maps
    )

    if (!snapped.snapped) {
      clearSnapMarker()
      return
    }

    if (!snapMarker) {
      snapMarker = new window.google.maps.Marker({
        map: mapInstance,
        clickable: false,
        zIndex: 1000002,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: '#FFD600',
          fillOpacity: 1,
          strokeColor: '#F57F17',
          strokeWeight: 2,
        },
      })
    }

    snapMarker.setPosition({ lat: snapped.lat, lng: snapped.lng })
    snapPreviewActive.value = true
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
        zIndex: 1000001,
      })
    } else {
      previewLine.setPath(path)
    }
    pointCount.value = path.length
  }

  function commitLatLng(latLng: any) {
    if (!latLng) return
    try {
      path.push(snapLatLng(latLng))
    } catch {
      path.push(latLng)
    }
    updatePreview()
  }

  function flushPendingClick() {
    if (pendingClickTimer) {
      clearTimeout(pendingClickTimer)
      pendingClickTimer = null
    }
    if (pendingLatLng) {
      commitLatLng(pendingLatLng)
      pendingLatLng = null
    }
  }

  function clearPreview() {
    if (previewLine) {
      previewLine.setMap(null)
      previewLine = null
    }
    path.length = 0
    pointCount.value = 0
    clearSnapMarker()
  }

  function stopDrawing() {
    isDrawing.value = false
    if (pendingClickTimer) {
      clearTimeout(pendingClickTimer)
      pendingClickTimer = null
    }
    pendingLatLng = null
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
    if (mouseMoveListener) {
      window.google.maps.event.removeListener(mouseMoveListener)
      mouseMoveListener = null
    }
    clearPreview()
    completeHandler = null
    snapPoints = []
    snapSegments = []
    snapRadiusMeters = DEFAULT_VERTEX_SNAP_RADIUS_METERS
  }

  function finishDrawing(): boolean {
    if (!mapInstance || !completeHandler) {
      stopDrawing()
      return false
    }

    // Commit the click still waiting in the debounce window (e.g. last vertex or first half of double-click).
    flushPendingClick()

    if (path.length < 3) {
      return false
    }

    const polygon = new window.google.maps.Polygon({
      ...DEFAULT_POLYGON_OPTIONS,
      paths: [...path],
      map: mapInstance,
    })

    const handler = completeHandler
    stopDrawing()
    handler(polygon)
    return true
  }

  function startDrawing(
    map: any,
    onComplete: PolygonDrawCompleteHandler,
    options: PolygonDrawOptions = {}
  ): boolean {
    stopDrawing()
    if (!map || !window.google?.maps) return false

    mapInstance = map
    completeHandler = onComplete
    if (options.snapTargets) {
      snapPoints = options.snapTargets.points
      snapSegments = options.snapTargets.segments
    } else {
      snapPoints = options.snapPoints || []
      snapSegments = options.snapSegments || []
    }
    snapRadiusMeters = options.snapRadiusMeters ?? DEFAULT_VERTEX_SNAP_RADIUS_METERS
    isDrawing.value = true
    map.setOptions({ draggableCursor: 'crosshair', disableDoubleClickZoom: true })

    // Defer single clicks so double-click can finish without adding a duplicate stray point.
    clickListener = map.addListener('click', (event: any) => {
      if (pendingClickTimer) clearTimeout(pendingClickTimer)
      pendingLatLng = event.latLng
      pendingClickTimer = setTimeout(() => {
        commitLatLng(pendingLatLng)
        pendingLatLng = null
        pendingClickTimer = null
      }, 220)
    })

    mouseMoveListener = map.addListener('mousemove', (event: any) => {
      updateSnapPreview(event.latLng)
    })

    dblClickListener = map.addListener('dblclick', (event: any) => {
      event.stop()
      if (!pendingLatLng) {
        pendingLatLng = event.latLng
      }
      finishDrawing()
    })

    return true
  }

  return {
    isDrawing,
    pointCount,
    snapPreviewActive,
    startDrawing,
    stopDrawing,
    finishDrawing,
  }
}
