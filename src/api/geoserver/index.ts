import request from '@/config/axios'
import { apiOrigin as prod } from '@/config/apiBase'

export const getGeoServerLayers = (params?: {
  page?: number
  limit?: number
  countyId?: number | null
  settlementId?: number | null
  search?: string
}): Promise<IResponse> => {
  return request.get({ url: prod + '/api/v1/geoserver/layers', params })
}

export const syncGeoServerLayers = (): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/geoserver/sync' })
}

// Streams the original imagery file (ECW/TIFF) from GeoServer's data_dir.
// silent: errors are toasted by the caller with a friendly message
export const downloadGeoServerLayerFile = (layerName: string): Promise<any> => {
  return request.get({
    url: prod + `/api/v1/geoserver/layers/${encodeURIComponent(layerName)}/download`,
    responseType: 'blob',
    timeout: 0,
    silent: true,
  })
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
