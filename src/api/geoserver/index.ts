import request from '@/config/axios'
 
interface RoleParams {
  roleName: string
}

const prod = import.meta.env.VITE_APP_HOST // remove the port for production
 
 
 


export const uploadToGeoServer = (data: any): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/geoserver/upload', data })
}

 


export const deleteLayer = (data: any): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/geoserver/delete', data })
}


export const EditLayerDetails = (data: any): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/geoserver/edit', data })
}
