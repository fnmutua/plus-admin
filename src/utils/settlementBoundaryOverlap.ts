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
  overlapAreaHa: number | null
}

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

function intersectAreaHa(
  drawn: Feature<Polygon | MultiPolygon>,
  neighbor: Feature<Polygon | MultiPolygon>
): number | null {
  try {
    const collection: FeatureCollection<Polygon | MultiPolygon> = {
      type: 'FeatureCollection',
      features: [drawn, neighbor],
    }
    const intersection = turf.intersect(collection)
    if (!intersection) return null
    return turf.area(intersection) / 10000
  } catch {
    return null
  }
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

    try {
      if (!turf.booleanIntersects(repairedDrawn, repairedNeighbor)) continue
    } catch {
      continue
    }

    overlaps.push({
      id: neighbor.id,
      name: neighbor.name || 'Unnamed settlement',
      overlapAreaHa: intersectAreaHa(repairedDrawn, repairedNeighbor),
    })
  }

  return overlaps.sort((a, b) => (b.overlapAreaHa ?? 0) - (a.overlapAreaHa ?? 0))
}

export function formatOverlapSummary(overlaps: SettlementBoundaryOverlap[]): string {
  if (!overlaps.length) return ''

  const lines = overlaps.map((overlap) => {
    const area =
      overlap.overlapAreaHa != null ? ` (~${overlap.overlapAreaHa.toFixed(2)} ha)` : ''
    return `• ${overlap.name}${area}`
  })

  const noun = overlaps.length === 1 ? 'settlement' : 'settlements'
  return `Boundary overlaps with ${overlaps.length} nearby ${noun}:\n${lines.join('\n')}`
}

export const BOUNDARY_OVERLAP_BLOCK_HINT =
  'Adjust the boundary to remove the overlap before saving.'

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

    try {
      const intersection = turf.intersect({
        type: 'FeatureCollection',
        features: [repairedDrawn, repairFeature(neighborFeature)],
      })
      if (intersection?.geometry) {
        features.push(intersection as Feature<Polygon | MultiPolygon>)
      }
    } catch {
      // skip invalid intersection geometry
    }
  }

  return features
}
