/**
 * Public Settlement Register API – no authentication required.
 * Used by the landing page Settlement Register (search, table, map).
 *
 * Backend is expected to expose these routes without auth, e.g.:
 *   GET /api/public/register/settlements
 *   GET /api/public/register/settlements/map
 *   GET /api/public/register/settlements/:id
 *   GET /api/public/register/counties
 *   GET /api/public/register/subcounties
 *   GET /api/public/register/wards
 */
import axios, { type AxiosRequestConfig } from 'axios'

const prod = import.meta.env.VITE_APP_HOST || ''

function publicGet<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return axios
    .get(prod + url, {
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers
      }
    })
    .then((res) => res.data)
    .catch((err) => {
      if (err.response?.status === 404) throw new Error('Not found')
      throw err
    })
}

export interface PublicRegisterSettlement {
  id: number
  name: string
  population?: number | null
  settlement_type?: string | null
  county?: { id: number; name: string } | null
  subcounty?: { id: number; name: string } | null
  ward?: { id: number; name: string } | null
}

export interface PublicRegisterListResponse {
  data?: PublicRegisterSettlement[]
  documents?: PublicRegisterSettlement[]
  results?: PublicRegisterSettlement[]
  total?: number
  code?: string
  message?: string
}

/** List settlements (paginated). No auth. */
export function getPublicRegisterSettlements(params: {
  page?: number
  limit?: number
  search?: string
  county_id?: number | null
  subcounty_id?: number | null
  ward_id?: number | null
}): Promise<PublicRegisterListResponse> {
  const q = new URLSearchParams()
  if (params.page != null) q.set('page', String(params.page))
  if (params.limit != null) q.set('limit', String(params.limit))
  if (params.search) q.set('search', params.search)
  if (params.county_id != null) q.set('county_id', String(params.county_id))
  if (params.subcounty_id != null) q.set('subcounty_id', String(params.subcounty_id))
  if (params.ward_id != null) q.set('ward_id', String(params.ward_id))
  const query = q.toString()
  return publicGet<PublicRegisterListResponse>(`/api/public/register/settlements${query ? '?' + query : ''}`)
}

/** GeoJSON for map (centroids or polygons). No auth. Returns { type, features }. */
export function getPublicRegisterSettlementsMap(params?: {
  county_id?: number | null
  subcounty_id?: number | null
  ward_id?: number | null
  search?: string | null
  limit?: number
  polygons?: boolean
}): Promise<{ type: string; features: any[] }> {
  const q = new URLSearchParams()
  if (params?.county_id != null) q.set('county_id', String(params.county_id))
  if (params?.subcounty_id != null) q.set('subcounty_id', String(params.subcounty_id))
  if (params?.ward_id != null) q.set('ward_id', String(params.ward_id))
  if (params?.search) q.set('search', params.search)
  if (params?.limit != null) q.set('limit', String(params.limit))
  if (params?.polygons) q.set('polygons', '1')
  const query = q.toString()
  return publicGet(`/api/public/register/settlements/map${query ? '?' + query : ''}`).then((res: any) => {
    const fc = res?.data ?? res?.results ?? res
    return fc && typeof fc === 'object' && Array.isArray(fc.features)
      ? fc
      : { type: 'FeatureCollection', features: [] }
  })
}

/** Single settlement for popup. No auth. */
export function getPublicRegisterSettlement(id: number): Promise<{
  data?: PublicRegisterSettlement
  results?: PublicRegisterSettlement
}> {
  return publicGet(`/api/public/register/settlements/${id}`)
}

/** Single settlement as GeoJSON feature (polygon or point) for map. No auth. Returns one Feature or 404. */
export function getPublicRegisterSettlementMap(id: number): Promise<{ type: string; geometry: any; properties: any }> {
  return publicGet(`/api/public/register/settlements/${id}/map`).then((res: any) => {
    const feature = res?.data?.type === 'Feature' ? res.data : (res?.type === 'Feature' ? res : null)
    return feature || res
  })
}

/** Counties for dropdown. No auth. */
export function getPublicRegisterCounties(): Promise<{ data?: { id: number; name: string }[] }> {
  return publicGet('/api/public/register/counties')
}

/** Subcounties for dropdown. No auth. */
export function getPublicRegisterSubcounties(countyId: number): Promise<{ data?: { id: number; name: string }[] }> {
  return publicGet(`/api/public/register/subcounties?county_id=${countyId}`)
}

/** Wards for dropdown. No auth. */
export function getPublicRegisterWards(subcountyId: number): Promise<{ data?: { id: number; name: string }[] }> {
  return publicGet(`/api/public/register/wards?subcounty_id=${subcountyId}`)
}
