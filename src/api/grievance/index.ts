import request from '@/config/axios'
  


 const prod = import.meta.env.VITE_APP_HOST // remove the port for production

  

export const generateGRMCode= (): Promise<IResponse> => {
  // console.log('filters....', data)
   return request.post({ url: prod + '/api/v1/grv/code' })
}
 

export const generateGrievance = (data: any): Promise<IResponse> => {
 
  return request.post({ url: prod + '/api/v1/grv/create', data })
}


export const getGrievances = (data: any): Promise<IResponse> => {
 
  return request.post({ url: prod + '/api/v1/grv/list', data })
}