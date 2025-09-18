
import request from '@/config/axios'
  

 const prod = import.meta.env.VITE_APP_HOST // remove the port for production

 export const createIncident = (data: any): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/inc/create', data })
}

export const getIncidents = (data: any): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/inc/list', data })
}

export const getOneIncident = (data: any): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/inc/one', data })
}

export const generateIncidentCode = (): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/inc/code' })
}

export const uploadIncidentDocuments = (data: any): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/inc/upload', data })
}

export const getIncidentDocuments = (data: any): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/inc/documents', data })
}

export const downloadIncidentFile = (data: any): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/inc/download', data, responseType: 'blob', headersType: 'application/json' })
}

export const updateIncident = (data: any): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/inc/update', data })
}

export const deleteIncident = (data: any): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/inc/delete', data })
}

export const updateIncidentStatus = (data: any): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/inc/status', data })
}

export const getIncidentHistory = (data: any): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/inc/history', data })
}

export const getIncidentHistoryByAction = (data: any): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/inc/history/action', data })
}

export const sendIncidentEmail = (data: { to: string | string[]; subject?: string; text?: string; html?: string }): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/inc/email/send', data })
}