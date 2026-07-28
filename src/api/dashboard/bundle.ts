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

/** Single cached payload for National dashboard (cards + all chart data). */
export const getNationalDashboardBundle = (): Promise<NationalDashboardBundle> => {
  return request.get({ url: `${prod}/api/v1/dashboard/national/bundle` }) as Promise<NationalDashboardBundle>
}

/** Cached bundle for any dashboard (DynamicState / intervention dashboards). */
export const getDashboardBundle = (dashboardId: number | string): Promise<DashboardBundle> => {
  return request.get({ url: `${prod}/api/v1/dashboard/${dashboardId}/bundle` }) as Promise<DashboardBundle>
}

/** Cached national landing map payload (settlements + counties + geo). */
export const getLandingMapBundle = (): Promise<LandingMapBundle> => {
  return request.get({ url: `${prod}/api/v1/dashboard/map/landing/bundle` }) as Promise<LandingMapBundle>
}

/** Cached national project map payload (locations + counties + geo). */
export const getProjectMapBundle = (): Promise<ProjectMapBundle> => {
  return request.get({ url: `${prod}/api/v1/dashboard/map/projects/bundle` }) as Promise<ProjectMapBundle>
}
