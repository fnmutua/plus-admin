import request from '@/config/axios'
import { apiOrigin as prod } from '@/config/apiBase'

export type OvertureBuildingsResponse = {
  code: string
  count: number
  geojson: GeoJSON.FeatureCollection
  message?: string
}

/** Fetch Overture building footprints clipped to settlement geometry. */
export const fetchOvertureBuildings = async (
  geometry: GeoJSON.Geometry
): Promise<OvertureBuildingsResponse> => {
  const response = await request.post<OvertureBuildingsResponse>({
    url: `${prod}/api/v1/data/settlements/overture-buildings`,
    data: { geometry },
    silent: true,
  })
  const payload = (response as any)?.data ?? response
  if (payload?.geojson || payload?.count != null) return payload as OvertureBuildingsResponse
  if (payload?.data?.geojson || payload?.data?.count != null) {
    return payload.data as OvertureBuildingsResponse
  }
  return payload as OvertureBuildingsResponse
}

export type OvertureStructuresResponse = {
  code: string
  message?: string
  created: number
  skipped: number
  total: number
}

/** Persist Overture building footprints as structure records for a settlement. */
export const createOvertureStructures = async (
  settlementId: number,
  geojson?: GeoJSON.FeatureCollection | null,
  options?: { replaceAll?: boolean }
): Promise<OvertureStructuresResponse> => {
  const response = await request.post<OvertureStructuresResponse>({
    url: `${prod}/api/v1/data/settlements/${settlementId}/overture-structures`,
    data: {
      ...(geojson?.features?.length ? { geojson } : {}),
      replaceExisting: true,
      replaceAll: options?.replaceAll === true,
    },
    silent: true,
    timeout: 180000,
  })
  return response as OvertureStructuresResponse
}
