import request from '@/config/axios'
import { apiOrigin as prod } from '@/config/apiBase'

export type SmsLogStatus = 'pending' | 'sent' | 'failed' | 'disabled' | 'skipped'

export interface SmsLogRow {
  id: number
  source_module: string
  source_module_label: string
  source_type: string | null
  source_id: number | null
  sender_shortcode: string | null
  destination: string
  message: string
  status: SmsLogStatus
  provider_code: string | null
  provider_message: string | null
  initiated_by_user_id: number | null
  initiator?: { id: number; name: string; username: string; email: string | null } | null
  sent_at: string | null
  createdAt: string
  updatedAt: string
}

export interface ListSmsLogsParams {
  page?: number
  limit?: number
  source_module?: string
  status?: SmsLogStatus
  destination?: string
  q?: string
  from?: string
  to?: string
}

export interface ApiResult<T> {
  code: string
  message: string
  results: T
}

export const listSmsLogs = (
  params: ListSmsLogsParams = {}
): Promise<ApiResult<{ total: number; page: number; limit: number; data: SmsLogRow[]; sourceModules: Array<{ value: string; label: string }> }>> => {
  return request.get({ url: prod + '/api/v1/sms-logs', params })
}

export const getSmsLog = (id: number): Promise<ApiResult<SmsLogRow>> => {
  return request.get({ url: prod + `/api/v1/sms-logs/${id}` })
}
