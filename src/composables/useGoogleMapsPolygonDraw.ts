import { ref } from 'vue'
import {
  DEFAULT_VERTEX_SNAP_RADIUS_METERS,
  getNearbySnapVertices,
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
  let snapCandidateMarkers: any[] = []
  let snapPoints: MapSnapPoint[] = []
  let snapSegments: MapSnapSegment[] = []
  let snapRadiusMeters = DEFAULT_VERTEX_SNAP_RADIUS_METERS

  function clearSnapCandidateMarkers() {
    snapCandidateMarkers.forEach((marker) => {
      if (marker) marker.setMap(null)
    })
    snapCandidateMarkers = []
  }

  function clearSnapMarker() {
    if (snapMarker) {
      snapMarker.setMap(null)
      snapMarker = null
    }
    snapPreviewActive.value = false
  }

  function clearSnapPreview() {
    clearSnapCandidateMarkers()
    clearSnapMarker()
  }

  function isSameSnapPoint(
    a: { lat: number; lng: number },
    b: { lat: number; lng: number }
  ) {
    return Math.abs(a.lat - b.lat) < 1e-7 && Math.abs(a.lng - b.lng) < 1e-7
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

    const lat = latLng.lat()
    const lng = latLng.lng()
    const snapPointTargets = getSnapCandidates()

    clearSnapCandidateMarkers()

    const nearbyVertices = getNearbySnapVertices(
      lat,
      lng,
      snapPoints,
      snapRadiusMeters,
      window.google.maps
    )

    for (const candidate of nearbyVertices) {
      const marker = new window.google.maps.Marker({
        position: { lat: candidate.lat, lng: candidate.lng },
        map: mapInstance,
        clickable: false,
        zIndex: 1000001,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 5,
          fillColor: '#FFFFFF',
          fillOpacity: 0.95,
          strokeColor: '#F57F17',
          strokeWeight: 2,
        },
      })
      snapCandidateMarkers.push(marker)
    }

    const snapped = snapToNearestBoundary(
      lat,
      lng,
      snapPointTargets,
      snapSegments,
      snapRadiusMeters,
      window.google.maps
    )

    if (!snapped.snapped) {
      if (snapMarker) {
        snapMarker.setMap(null)
        snapMarker = null
      }
      snapPreviewActive.value = nearbyVertices.length > 0
      return
    }

    if (snapMarker) {
      snapMarker.setMap(null)
      snapMarker = null
    }

    const isDuplicateCandidate = nearbyVertices.some((candidate) =>
      isSameSnapPoint(candidate, snapped)
    )

    if (!isDuplicateCandidate || snapped.kind === 'edge') {
      snapMarker = new window.google.maps.Marker({
        position: { lat: snapped.lat, lng: snapped.lng },
        map: mapInstance,
        clickable: false,
        zIndex: 1000003,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: snapped.kind === 'edge' ? 8 : 7,
          fillColor: snapped.kind === 'edge' ? '#00BCD4' : '#FFD600',
          fillOpacity: 1,
          strokeColor: snapped.kind === 'edge' ? '#00838F' : '#F57F17',
          strokeWeight: 2,
        },
      })
    }

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
    clearSnapPreview()
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
