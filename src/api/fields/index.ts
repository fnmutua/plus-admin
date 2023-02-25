import request from '@/config/axios'
 


const dev = import.meta.env.VITE_APP_HOST + ':4000' // Add the port for local Dev
const prod = import.meta.env.VITE_APP_HOST // remove the port for production



export const getModelSpecs = (data: any): Promise<IResponse> => {
 // console.log('filters....', data)
  return request.post({ url: prod + '/api/v1/model/fields', data })
}



export const getModelRelatives = (data: any): Promise<IResponse> => {
  // console.log('filters....', data)
   return request.post({ url: prod + '/api/v1/model/relatives', data })
 }
 
 