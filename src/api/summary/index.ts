import request from '@/config/axios'
import AxiosResponse from '@/config/axios'
 


const dev = import.meta.env.VITE_APP_HOST + ':4000' // Add the port for local Dev
const prod = import.meta.env.VITE_APP_HOST // remove the port for production



export const getSummarybyField = (data: any): Promise<IResponse> => {
  //console.log('filters....', data)
  return request.post({ url: prod + '/api/v1/summary/byfield', data })
}



export const getSummarybyFieldNested = (data: any): Promise<IResponse> => {
 // console.log('filters....', data)
  return request.post({ url: prod + '/api/v1/summary/byfield/nested', data })
}

export const getSummarybyFieldSimple= (data: any): Promise<IResponse> => {
  // console.log('filters....', data)
   return request.post({ url: prod + '/api/v1/summary/byfield/simple', data })
}
 

export const getSummarybyFieldFromInclude= (data: any): Promise<IResponse> => {
  // console.log('filters....', data)
   return request.post({ url: prod + '/api/v1/summary/byfield/include', data })
}

export const getSummarybyFieldFromMultipleIncludes= (data: any): Promise<IResponse> => {
  // console.log('filters....', data)
   return request.post({ url: prod + '/api/v1/summary/byfield/multiple', data })
}


export const getSummaryGroupByMultipleFields= (data: any): Promise<IResponse> => {
  // console.log('filters....', data)
   return request.post({ url: prod + '/api/v1/summary/group/multiple', data })
}

{ responseType: 'blob'}  


export const getFile= (data: any) => {
  // console.log('filters....', data)
   return request.post({ url: prod + '/api/v1/download',  data , responseType: 'blob' })
}

 