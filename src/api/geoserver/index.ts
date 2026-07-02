import request from '@/config/axios'
import { apiOrigin as prod } from '@/config/apiBase'

export const getGeoServerLayers = (params?: {
  page?: number
  limit?: number
  countyId?: number | null
}): Promise<IResponse> => {
  return request.get({ url: prod + '/api/v1/geoserver/layers', params })
}

export const uploadToGeoServer = (data: any): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/geoserver/upload', data })
}

 


export const deleteLayer = (data: any): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/geoserver/delete', data })
}


export const EditLayerDetails = (data: any): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/geoserver/edit', data })
}
