import request from '@/config/axios'
import { apiOrigin } from '@/config/apiBase'
import type { IResponse, SettlementTypeItem, SettlementTypePayload } from './types'

const base = `${apiOrigin}/api/v1/settlement-types`

/**
 * The settlement types every picker is built from.
 * @param includeInactive management screens only; also returns usage counts.
 */
export const getSettlementTypes = (
  includeInactive = false
): Promise<IResponse<SettlementTypeItem[]>> =>
  request.get({ url: base, params: includeInactive ? { includeInactive: true } : {} })

export const createSettlementType = (
  data: SettlementTypePayload
): Promise<IResponse<SettlementTypeItem>> => request.post({ url: base, data })

/** Renaming the label also renames the type on every settlement using it. */
export const updateSettlementType = (
  id: number,
  data: Partial<SettlementTypePayload>
): Promise<IResponse<SettlementTypeItem>> => request.put({ url: `${base}/${id}`, data })

/** Refused by the server while settlements still use the type. */
export const deleteSettlementType = (id: number): Promise<IResponse<null>> =>
  request.delete({ url: `${base}/${id}` })
