import * as turf from '@turf/turf'
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'

export type NeighborSettlementGeometry = {
  id: number | string
  name: string
  geom: Polygon | MultiPolygon
}

export type SettlementBoundaryOverlap = {
  id: number | string
  name: string
  overlapAreaHa: number
}

/**
 * Shrink polygons slightly before overlap test so shared snapped edges
 * (touch-only contact) do not count as interior overlap.
 */
export const OVERLAP_TEST_SHRINK_METERS = 0.75

/** Minimum interior overlap before save is blocked (~30 m²). */
export const MIN_BLOCKING_OVERLAP_AREA_SQ_M = 30

function toFeature(geom: Polygon | MultiPolygon): Feature<Polygon | MultiPolygon> | null {
  try {
    return turf.feature(geom)
  } catch {
    return null
  }
}

function repairFeature(feature: Feature<Polygon | MultiPolygon>): Feature<Polygon | MultiPolygon> {
  try {
    const repaired = turf.buffer(feature, 0, { units: 'meters' })
    if (repaired?.geometry) {
      return repaired as Feature<Polygon | MultiPolygon>
    }
  } catch {
    // fall through to original feature
  }
  return feature
}

function isPolygonalGeometry(type: string): boolean {
  return type === 'Polygon' || type === 'MultiPolygon'
}

function intersectFeature(
  drawn: Feature<Polygon | MultiPolygon>,
  neighbor: Feature<Polygon | MultiPolygon>
): Feature | null {
  try {
    const collection: FeatureCollection<Polygon | MultiPolygon> = {
      type: 'FeatureCollection',
      features: [drawn, neighbor],
    }
    return turf.intersect(collection)
  } catch {
    return null
  }
}

function shrinkForOverlapTest(
  feature: Feature<Polygon | MultiPolygon>
): Feature<Polygon | MultiPolygon> | null {
  try {
    const shrunk = turf.buffer(feature, -OVERLAP_TEST_SHRINK_METERS, { units: 'meters' })
    if (!shrunk?.geometry || !isPolygonalGeometry(shrunk.geometry.type)) {
      return null
    }
    const areaSqM = turf.area(shrunk)
    if (!Number.isFinite(areaSqM) || areaSqM <= 0) {
      return null
    }
    return shrunk as Feature<Polygon | MultiPolygon>
  } catch {
    return null
  }
}

/**
 * Detect meaningful interior overlap (not shared-boundary touch from snapping).
 */
function measurePolygonalOverlapSqM(
  drawn: Feature<Polygon | MultiPolygon>,
  neighbor: Feature<Polygon | MultiPolygon>
): number | null {
  const shrunkDrawn = shrinkForOverlapTest(drawn)
  const shrunkNeighbor = shrinkForOverlapTest(neighbor)
  if (!shrunkDrawn || !shrunkNeighbor) {
    return null
  }

  const intersection = intersectFeature(shrunkDrawn, shrunkNeighbor)
  if (!intersection?.geometry || !isPolygonalGeometry(intersection.geometry.type)) {
    return null
  }

  const areaSqM = turf.area(intersection)
  if (!Number.isFinite(areaSqM) || areaSqM < MIN_BLOCKING_OVERLAP_AREA_SQ_M) {
    return null
  }

  return areaSqM
}

export function findSettlementBoundaryOverlaps(
  drawnGeom: Polygon | MultiPolygon,
  neighbors: NeighborSettlementGeometry[],
  excludeSettlementId?: number | string | null
): SettlementBoundaryOverlap[] {
  const drawnFeature = toFeature(drawnGeom)
  if (!drawnFeature) return []

  const repairedDrawn = repairFeature(drawnFeature)
  const overlaps: SettlementBoundaryOverlap[] = []

  for (const neighbor of neighbors) {
    if (excludeSettlementId != null && Number(neighbor.id) === Number(excludeSettlementId)) {
      continue
    }
    if (!neighbor.geom || (neighbor.geom.type !== 'Polygon' && neighbor.geom.type !== 'MultiPolygon')) {
      continue
    }

    const neighborFeature = toFeature(neighbor.geom)
    if (!neighborFeature) continue

    const repairedNeighbor = repairFeature(neighborFeature)
    const areaSqM = measurePolygonalOverlapSqM(repairedDrawn, repairedNeighbor)
    if (areaSqM == null) {
      continue
    }

    overlaps.push({
      id: neighbor.id,
      name: neighbor.name || 'Unnamed settlement',
      overlapAreaHa: areaSqM / 10000,
    })
  }

  return overlaps.sort((a, b) => b.overlapAreaHa - a.overlapAreaHa)
}

function formatOverlapArea(overlapAreaHa: number): string {
  const sqM = overlapAreaHa * 10000
  if (overlapAreaHa < 0.01) {
    return `~${Math.round(sqM)} m²`
  }
  return `~${overlapAreaHa.toFixed(2)} ha`
}

export function formatOverlapSummary(overlaps: SettlementBoundaryOverlap[]): string {
  if (!overlaps.length) return ''

  const lines = overlaps.map((overlap) => {
    return `• ${overlap.name} (${formatOverlapArea(overlap.overlapAreaHa)})`
  })

  const noun = overlaps.length === 1 ? 'settlement' : 'settlements'
  return `Boundary overlaps with ${overlaps.length} nearby ${noun}:\n${lines.join('\n')}`
}

export const BOUNDARY_OVERLAP_BLOCK_HINT =
  'Adjust the boundary to remove the overlap before saving. Shared edges with neighbors are allowed.'

export function formatOverlapBlockedMessage(overlaps: SettlementBoundaryOverlap[]): string {
  const summary = formatOverlapSummary(overlaps)
  return summary ? `${summary}\n\n${BOUNDARY_OVERLAP_BLOCK_HINT}` : BOUNDARY_OVERLAP_BLOCK_HINT
}

export function getOverlapIntersectionFeatures(
  drawnGeom: Polygon | MultiPolygon,
  neighbors: NeighborSettlementGeometry[],
  overlaps: SettlementBoundaryOverlap[]
): Feature<Polygon | MultiPolygon>[] {
  const drawnFeature = toFeature(drawnGeom)
  if (!drawnFeature) return []

  const repairedDrawn = repairFeature(drawnFeature)
  const features: Feature<Polygon | MultiPolygon>[] = []

  for (const overlap of overlaps) {
    const neighbor = neighbors.find((n) => String(n.id) === String(overlap.id))
    if (!neighbor?.geom) continue

    const neighborFeature = toFeature(neighbor.geom)
    if (!neighborFeature) continue

    const repairedNeighbor = repairFeature(neighborFeature)
    const shrunkDrawn = shrinkForOverlapTest(repairedDrawn)
    const shrunkNeighbor = shrinkForOverlapTest(repairedNeighbor)
    if (!shrunkDrawn || !shrunkNeighbor) continue

    const intersection = intersectFeature(shrunkDrawn, shrunkNeighbor)
    if (!intersection?.geometry || !isPolygonalGeometry(intersection.geometry.type)) {
      continue
    }

    const areaSqM = turf.area(intersection)
    if (!Number.isFinite(areaSqM) || areaSqM < MIN_BLOCKING_OVERLAP_AREA_SQ_M) {
      continue
    }

    features.push(intersection as Feature<Polygon | MultiPolygon>)
  }

  return features
}
