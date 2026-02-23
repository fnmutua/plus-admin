import request from '@/config/axios'

const prod = import.meta.env.VITE_APP_HOST

export const getAuditLogs = (data: Record<string, any>): Promise<any> => {
  return request.post({ url: prod + '/api/v1/audit/all', data })
}
