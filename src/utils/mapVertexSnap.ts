import * as turf from '@turf/turf'
import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson'

export type MapSnapPoint = {
  lat: number
  lng: number
}

export type MapSnapSegment = {
  start: MapSnapPoint
  end: MapSnapPoint
}

export type BoundarySnapTargets = {
  points: MapSnapPoint[]
  segments: MapSnapSegment[]
}

export type BoundarySnapResult = {
  lat: number
  lng: number
  snapped: boolean
  kind?: 'vertex' | 'edge'
}

export const DEFAULT_VERTEX_SNAP_RADIUS_METERS = 18

function coordToPoint(coord: number[]): MapSnapPoint | null {
  if (!Array.isArray(coord) || coord.length < 2) return null
  const lng = Number(coord[0])
  const lat = Number(coord[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

function pushRingVertices(ring: number[][], points: MapSnapPoint[]) {
  for (const coord of ring) {
    const point = coordToPoint(coord)
    if (point) points.push(point)
  }
}

function pushRingSegments(ring: number[][], segments: MapSnapSegment[]) {
  if (!ring || ring.length < 2) return

  for (let i = 0; i < ring.length - 1; i++) {
    const start = coordToPoint(ring[i])
    const end = coordToPoint(ring[i + 1])
    if (!start || !end) continue
    if (start.lat === end.lat && start.lng === end.lng) continue
    segments.push({ start, end })
  }
}

export function extractVerticesFromGeometry(geom: Polygon | MultiPolygon | null | undefined): MapSnapPoint[] {
  if (!geom) return []

  const points: MapSnapPoint[] = []
  if (geom.type === 'Polygon') {
    pushRingVertices(geom.coordinates[0] || [], points)
  } else if (geom.type === 'MultiPolygon') {
    for (const polygon of geom.coordinates) {
      pushRingVertices(polygon[0] || [], points)
    }
  }
  return points
}

export function extractSegmentsFromGeometry(geom: Polygon | MultiPolygon | null | undefined): MapSnapSegment[] {
  if (!geom) return []

  const segments: MapSnapSegment[] = []
  if (geom.type === 'Polygon') {
    pushRingSegments(geom.coordinates[0] || [], segments)
  } else if (geom.type === 'MultiPolygon') {
    for (const polygon of geom.coordinates) {
      pushRingSegments(polygon[0] || [], segments)
    }
  }
  return segments
}

export function extractVerticesFromFeatureCollection(
  collection: FeatureCollection | { features?: Array<{ geometry?: Polygon | MultiPolygon | null }> } | null | undefined
): MapSnapPoint[] {
  if (!collection?.features?.length) return []

  const points: MapSnapPoint[] = []
  for (const feature of collection.features) {
    const geom = feature?.geometry
    if (!geom || (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon')) continue
    points.push(...extractVerticesFromGeometry(geom))
  }
  return points
}

export function extractSegmentsFromFeatureCollection(
  collection: FeatureCollection | { features?: Array<{ geometry?: Polygon | MultiPolygon | null }> } | null | undefined
): MapSnapSegment[] {
  if (!collection?.features?.length) return []

  const segments: MapSnapSegment[] = []
  for (const feature of collection.features) {
    const geom = feature?.geometry
    if (!geom || (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon')) continue
    segments.push(...extractSegmentsFromGeometry(geom))
  }
  return segments
}

export function dedupeSnapPoints(points: MapSnapPoint[]): MapSnapPoint[] {
  const seen = new Set<string>()
  const unique: MapSnapPoint[] = []

  for (const point of points) {
    const key = `${point.lat.toFixed(6)}:${point.lng.toFixed(6)}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(point)
  }

  return unique
}

function snapToNearestVertexWithinRadius(
  lat: number,
  lng: number,
  snapPoints: MapSnapPoint[],
  radiusMeters: number,
  maps: any
): BoundarySnapResult | null {
  if (!snapPoints.length || !maps?.geometry?.spherical?.computeDistanceBetween) {
    return null
  }

  const clicked = new maps.LatLng(lat, lng)
  let best: MapSnapPoint | null = null
  let bestDistance = radiusMeters

  for (const point of snapPoints) {
    const candidate = new maps.LatLng(point.lat, point.lng)
    const distance = maps.geometry.spherical.computeDistanceBetween(clicked, candidate)
    if (distance < bestDistance) {
      bestDistance = distance
      best = point
    }
  }

  if (!best) return null
  return { lat: best.lat, lng: best.lng, snapped: true, kind: 'vertex' }
}

function snapToNearestEdgeWithinRadius(
  lat: number,
  lng: number,
  segments: MapSnapSegment[],
  radiusMeters: number
): BoundarySnapResult | null {
  if (!segments.length || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  const target = turf.point([lng, lat])
  let best: BoundarySnapResult | null = null
  let bestDistance = radiusMeters

  for (const segment of segments) {
    const line = turf.lineString([
      [segment.start.lng, segment.start.lat],
      [segment.end.lng, segment.end.lat],
    ])

    let nearest
    try {
      nearest = turf.nearestPointOnLine(line, target, { units: 'meters' })
    } catch {
      continue
    }

    const distance = Number(nearest.properties?.dist)
    if (!Number.isFinite(distance) || distance >= bestDistance) continue

    const [snapLng, snapLat] = nearest.geometry.coordinates
    if (!Number.isFinite(snapLat) || !Number.isFinite(snapLng)) continue

    bestDistance = distance
    best = { lat: snapLat, lng: snapLng, snapped: true, kind: 'edge' }
  }

  return best
}

/** Snap to the nearest boundary vertex or edge segment within radius. */
export function snapToNearestBoundary(
  lat: number,
  lng: number,
  points: MapSnapPoint[],
  segments: MapSnapSegment[],
  radiusMeters: number,
  maps?: any
): BoundarySnapResult {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { lat, lng, snapped: false }
  }

  const vertexSnap =
    maps != null ? snapToNearestVertexWithinRadius(lat, lng, points, radiusMeters, maps) : null

  const edgeSnap = snapToNearestEdgeWithinRadius(lat, lng, segments, radiusMeters)

  if (!vertexSnap && !edgeSnap) {
    return { lat, lng, snapped: false }
  }

  if (vertexSnap && !edgeSnap) return vertexSnap
  if (edgeSnap && !vertexSnap) return edgeSnap

  const target = turf.point([lng, lat])
  const vertexDistance = turf.distance(target, turf.point([vertexSnap!.lng, vertexSnap!.lat]), {
    units: 'meters',
  })
  const edgeDistance = turf.distance(target, turf.point([edgeSnap!.lng, edgeSnap!.lat]), {
    units: 'meters',
  })

  return vertexDistance <= edgeDistance ? vertexSnap! : edgeSnap!
}

/** Boundary corners within snap radius of the cursor (for preview markers). */
export function getNearbySnapVertices(
  lat: number,
  lng: number,
  points: MapSnapPoint[],
  radiusMeters: number,
  maps: any
): MapSnapPoint[] {
  if (!points.length || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return []
  }
  if (!maps?.geometry?.spherical?.computeDistanceBetween) {
    return []
  }

  const cursor = new maps.LatLng(lat, lng)
  const nearby: Array<MapSnapPoint & { distance: number }> = []

  for (const point of points) {
    const candidate = new maps.LatLng(point.lat, point.lng)
    const distance = maps.geometry.spherical.computeDistanceBetween(cursor, candidate)
    if (distance < radiusMeters) {
      nearby.push({ ...point, distance })
    }
  }

  return nearby.sort((a, b) => a.distance - b.distance).map(({ lat: pLat, lng: pLng }) => ({
    lat: pLat,
    lng: pLng,
  }))
}

/** @deprecated Use snapToNearestBoundary */
export function snapToNearestVertex(
  lat: number,
  lng: number,
  snapPoints: MapSnapPoint[],
  radiusMeters: number,
  maps: any
): { lat: number; lng: number; snapped: boolean } {
  const result = snapToNearestBoundary(lat, lng, snapPoints, [], radiusMeters, maps)
  return { lat: result.lat, lng: result.lng, snapped: result.snapped }
}

export function buildBoundarySnapTargets(
  geometries: Array<Polygon | MultiPolygon | null | undefined>,
  featureCollections: Array<
    FeatureCollection | { features?: Array<{ geometry?: Polygon | MultiPolygon | null }> } | null | undefined
  >
): BoundarySnapTargets {
  const points: MapSnapPoint[] = []
  const segments: MapSnapSegment[] = []

  for (const geom of geometries) {
    points.push(...extractVerticesFromGeometry(geom))
    segments.push(...extractSegmentsFromGeometry(geom))
  }

  for (const collection of featureCollections) {
    points.push(...extractVerticesFromFeatureCollection(collection))
    segments.push(...extractSegmentsFromFeatureCollection(collection))
  }

  return {
    points: dedupeSnapPoints(points),
    segments,
  }
}

export function snapPointsForEditableVertex(
  boundaryTargets: BoundarySnapTargets,
  polygonVertices: MapSnapPoint[],
  vertexIndex: number
): MapSnapPoint[] {
  const points = [...boundaryTargets.points]
  if (polygonVertices.length > 0 && vertexIndex !== 0) {
    points.push(polygonVertices[0])
  }
  return dedupeSnapPoints(points)
}

/** Snap a vertex while editing an existing polygon path. */
export function snapEditableVertex(
  lat: number,
  lng: number,
  boundaryTargets: BoundarySnapTargets,
  polygonVertices: MapSnapPoint[],
  vertexIndex: number,
  radiusMeters: number = DEFAULT_VERTEX_SNAP_RADIUS_METERS,
  maps?: any
): BoundarySnapResult {
  const points = snapPointsForEditableVertex(boundaryTargets, polygonVertices, vertexIndex)
  return snapToNearestBoundary(lat, lng, points, boundaryTargets.segments, radiusMeters, maps)
}
