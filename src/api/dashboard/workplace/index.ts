import request from '@/config/axios'
import { apiOrigin as prod } from '@/config/apiBase'

export type NewAccountsPeriod = 'week' | 'month' | 'year'

export type WorkplaceStats = {
  totalUsers: number
  unapprovedUsers: number
  countyUsers: number
  newAccountsCount: number
  newAccountsPeriod: NewAccountsPeriod
  /** @deprecated use newAccountsCount */
  usersThisWeek?: number
  scopeLabel: string
  isNational: boolean
  countyId: number | null
  countyName: string | null
}

export type ActiveSession = {
  userId: number
  userName: string
  name: string
  email: string | null
  username: string
  county: string | null
  loginTime: string
  sessionDuration: number
  sessionDurationFormatted: string
  source: string
  status?: string
  lastSeen?: string
  activeSessionCount?: number
}

export type LoginAttempt = {
  id: number
  userId: string
  userName: string
  action: string
  status: string
  source: string
  date: string
  loginTime: string | null
}

export type MutationLog = {
  id: number
  timestamp: string
  action: string
  actorName: string | null
  actorId: string | null
  entityType: string
  entityId: string | null
  resource: string
  outcome: string
}

export type WorkplaceTraffic = {
  days: number
  activeSessions: number
  activeUsers: number
  loginAttempts: number
  successfulLogins: number
  failedLogins: number
  uniqueUsers: number
  timeline: Array<{ date: string; successful: number; failed: number }>
  counties: Array<{ name: string; value: number }>
}

export const getWorkplaceStatsApi = (
  period: NewAccountsPeriod = 'week'
): Promise<IResponse<WorkplaceStats>> => {
  return request.get({ url: prod + '/api/v1/workplace/stats', params: { period } })
}

export const getActiveSessionsApi = (hoursThreshold = 24): Promise<IResponse<{ count: number; sessions: ActiveSession[] }>> => {
  return request.get({ url: prod + '/api/v1/workplace/active-sessions', params: { hoursThreshold } })
}

export const getLoginAttemptsApi = (data: {
  page?: number
  limit?: number
  days?: number
  from?: string
  to?: string
}): Promise<IResponse<LoginAttempt[]>> => {
  return request.post({ url: prod + '/api/v1/workplace/login-attempts', data, silent: true })
}

export const getMutationsApi = (data: {
  page?: number
  limit?: number
  days?: number
  from?: string
  to?: string
}): Promise<IResponse<MutationLog[]>> => {
  return request.post({ url: prod + '/api/v1/workplace/mutations', data, silent: true })
}

export const getWorkplaceTrafficApi = (days = 30): Promise<IResponse<WorkplaceTraffic>> => {
  return request.get({ url: prod + '/api/v1/workplace/traffic', params: { days } })
}
