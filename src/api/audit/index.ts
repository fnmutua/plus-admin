import request from '@/config/axios'
import { apiOrigin as prod } from '@/config/apiBase'

export const getAuditLogs = (data: Record<string, any>): Promise<any> => {
  return request.post({ url: prod + '/api/v1/audit/all', data, silent: true })
}
