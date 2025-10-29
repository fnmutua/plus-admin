import request from '@/config/axios'

const prod = import.meta.env.VITE_APP_HOST

export interface County {
  id: number
  name: string
  code: string
  area_km2?: number
  settlements_count?: number
}

export interface Subcounty {
  id: number
  name: string
  code: string
  county_id: number
  county_name?: string
  area_km2?: number
  settlements_count?: number
}

export interface Ward {
  id: number
  name: string
  code: string
  county_id: number
  subcounty_id: number
  county_name?: string
  subcounty_name?: string
  area_km2?: number
  settlements_count?: number
}

// County APIs
export const getCountiesApi = (): Promise<IResponse<County[]>> => {
  return request.get({ url: prod + '/api/v1/adminunits/counties' })
}

export const getCountyByIdApi = (id: number): Promise<IResponse<County>> => {
  return request.get({ url: prod + `/api/v1/adminunits/counties/${id}` })
}

export const createCountyApi = (data: Partial<County & { geom?: any }>): Promise<IResponse<County>> => {
  return request.post({ url: prod + '/api/v1/adminunits/counties', data })
}

export const updateCountyApi = (id: number, data: Partial<County & { geom?: any }>): Promise<IResponse<County>> => {
  return request.put({ url: prod + `/api/v1/adminunits/counties/${id}`, data })
}

// Subcounty APIs
export const getSubcountiesApi = (countyId?: number): Promise<IResponse<Subcounty[]>> => {
  const params = countyId ? { county_id: countyId } : {}
  return request.get({ url: prod + '/api/v1/adminunits/subcounties', params })
}

export const getSubcountyByIdApi = (id: number): Promise<IResponse<Subcounty>> => {
  return request.get({ url: prod + `/api/v1/adminunits/subcounties/${id}` })
}

export const createSubcountyApi = (data: Partial<Subcounty & { geom?: any }>): Promise<IResponse<Subcounty>> => {
  return request.post({ url: prod + '/api/v1/adminunits/subcounties', data })
}

export const updateSubcountyApi = (id: number, data: Partial<Subcounty & { geom?: any }>): Promise<IResponse<Subcounty>> => {
  return request.put({ url: prod + `/api/v1/adminunits/subcounties/${id}`, data })
}

// Ward APIs
export const getWardsApi = (countyId?: number, subcountyId?: number): Promise<IResponse<Ward[]>> => {
  const params: any = {}
  if (countyId) params.county_id = countyId
  if (subcountyId) params.subcounty_id = subcountyId
  return request.get({ url: prod + '/api/v1/adminunits/wards', params })
}

export const getWardByIdApi = (id: number): Promise<IResponse<Ward>> => {
  return request.get({ url: prod + `/api/v1/adminunits/wards/${id}` })
}

export const createWardApi = (data: Partial<Ward & { geom?: any }>): Promise<IResponse<Ward>> => {
  return request.post({ url: prod + '/api/v1/adminunits/wards', data })
}

export const updateWardApi = (id: number, data: Partial<Ward & { geom?: any }>): Promise<IResponse<Ward>> => {
  return request.put({ url: prod + `/api/v1/adminunits/wards/${id}`, data })
}

