import request from '@/config/axios'
import { apiOrigin as prod } from '@/config/apiBase'

export interface DashboardBundle {
  code: string
  fromCache: boolean
  dashboardId: number
  filterLevel: 'national'
  builtAt: string
  ttlSeconds: number
  cards: any[]
  sections: Array<{
    id: number
    title: string
    name?: string
    label?: string
    charts: any[]
  }>
}

export type NationalDashboardBundle = DashboardBundle

export interface LandingMapBundle {
  code: string
  fromCache: boolean
  kind: 'landing'
  filterLevel: 'national'
  builtAt: string
  ttlSeconds: number
  settlements: any
  counties: any[]
  countyGeo: any
}

export interface ProjectMapBundle {
  code: string
  fromCache: boolean
  kind: 'projects'
  filterLevel: 'national'
  builtAt: string
  ttlSeconds: number
  projectLocations: any
  counties: any[]
  countyGeo: any
}

export interface DashboardGeoBundle {
  code: string
  fromCache: boolean
  kind: 'dashboard-geo'
  filterLevel: 'national'
  builtAt: string
  ttlSeconds: number
  countyGeo: any
  subcountyGeo: any
  wardGeo: any
  featureCounts?: {
    county: number
    subcounty: number
    ward: number
  }
}

/** Single cached payload for National dashboard (cards + all chart data). */
export const getNationalDashboardBundle = (
  options?: { refresh?: boolean },
): Promise<NationalDashboardBundle> => {
  const params = options?.refresh ? { refresh: '1' } : undefined
  return request.get({
    url: `${prod}/api/v1/dashboard/national/bundle`,
    params,
  }) as Promise<NationalDashboardBundle>
}

/** Cached bundle for any dashboard (DynamicState / intervention dashboards). */
export const getDashboardBundle = (
  dashboardId: number | string,
  options?: { refresh?: boolean },
): Promise<DashboardBundle> => {
  const params = options?.refresh ? { refresh: '1' } : undefined
  return request.get({
    url: `${prod}/api/v1/dashboard/${dashboardId}/bundle`,
    params,
  }) as Promise<DashboardBundle>
}

/** Cached national landing map payload (settlements + counties + geo). */
export const getLandingMapBundle = (): Promise<LandingMapBundle> => {
  return request.get({ url: `${prod}/api/v1/dashboard/map/landing/bundle` }) as Promise<LandingMapBundle>
}

/** Cached national project map payload (locations + counties + geo). */
export const getProjectMapBundle = (): Promise<ProjectMapBundle> => {
  return request.get({ url: `${prod}/api/v1/dashboard/map/projects/bundle` }) as Promise<ProjectMapBundle>
}

/** Cached admin-boundary geo for dashboard choropleths (county / subcounty / ward). */
export const getDashboardGeoBundle = (): Promise<DashboardGeoBundle> => {
  return request.get({ url: `${prod}/api/v1/dashboard/geo/bundle` }) as Promise<DashboardGeoBundle>
}
