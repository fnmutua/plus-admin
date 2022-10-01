import request from '@/config/axios'
import type {
  AnalysisTotalTypes,
  UserAccessSource,
  WaterAccessSource,
  WeeklyUserActivity,
  MonthlySales
} from './types'

export const getCountApi = (): Promise<IResponse<AnalysisTotalTypes[]>> => {
  return request.get({ url: '/analysis/total' })
}

export const getUserAccessSourceApi = (): Promise<IResponse<UserAccessSource[]>> => {
  return request.get({ url: '/analysis/userAccessSource' })
}

export const getWeeklyUserActivityApi = (): Promise<IResponse<WeeklyUserActivity[]>> => {
  return request.get({ url: '/analysis/weeklyUserActivity' })
}

export const getMonthlySalesApi = (): Promise<IResponse<MonthlySales[]>> => {
  return request.get({ url: '/analysis/monthlySales' })
}

export const getWaterAccessApi = (): Promise<IResponse<WaterAccessSource[]>> => {
  return request.get({ url: '/analysis/water' })
}
