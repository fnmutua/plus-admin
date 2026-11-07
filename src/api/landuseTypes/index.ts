import request from '@/config/axios'
import { apiOrigin } from '@/config/apiBase'
import type { IResponse, LanduseTypeItem, LanduseTypePayload } from './types'

const base = `${apiOrigin}/api/v1/landuse-types`

/**
 * Parcel land-use types for maps, legends, and QGIS import matching.
 * @param includeInactive management screens only; also returns parcel usage counts.
 */
export const getLanduseTypes = (
  includeInactive = false
): Promise<IResponse<LanduseTypeItem[]>> =>
  request.get({ url: base, params: includeInactive ? { includeInactive: true } : {} })

export const createLanduseType = (
  data: LanduseTypePayload
): Promise<IResponse<LanduseTypeItem>> => request.post({ url: base, data })

export const updateLanduseType = (
  id: number,
  data: Partial<LanduseTypePayload>
): Promise<IResponse<LanduseTypeItem>> => request.put({ url: `${base}/${id}`, data })

/** Refused by the server while parcels still use the type. */
export const deleteLanduseType = (id: number): Promise<IResponse<null>> =>
  request.delete({ url: `${base}/${id}` })
