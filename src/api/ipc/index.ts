import request from '@/config/axios'
import { apiOrigin } from '@/config/apiBase'

const prod = apiOrigin

export const uploadIpcDocuments = (data: FormData, silent = false): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/ipc/upload', data, silent })
}

export const downloadIpcDocument = (data: { filename?: string; doc_id?: number }): Promise<any> => {
  return request.post({ url: prod + '/api/v1/ipc/download', data, responseType: 'blob' })
}
