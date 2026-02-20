import request from '@/config/axios'

export interface PageVisitStat {
  path: string
  page_name: string
  count: number
}

export type PageVisitPeriod = 'total' | 'daily' | 'weekly' | 'monthly' | 'annual'

export interface PageVisitStatsResponse {
  data: PageVisitStat[]
  total: number
  period?: string
  code?: string
}

export const getPageVisitStatsApi = (period?: PageVisitPeriod): Promise<PageVisitStatsResponse> => {
  const params = period ? { period } : {}
  return request.get({ url: '/api/v1/page-visits/stats', params })
}
