
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