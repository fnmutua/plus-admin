import request from '@/config/axios'
  


 const prod = import.meta.env.VITE_APP_HOST // remove the port for production

  

export const generateGRMCode= (): Promise<IResponse> => {
   return request.post({ url: prod + '/api/v1/grv/code' })
}
 

export const generateGrievance = (data: any): Promise<IResponse> => {
   return request.post({ url: prod + '/api/v1/grv/create', data })
}


export const getGrievances = (data: any): Promise<IResponse> => {
   return request.post({ url: prod + '/api/v1/grv/list', data })
}



export const getOneGrievance = (data: any): Promise<IResponse> => {
   return request.post({ url: prod + '/api/v1/grv/one', data })
}

export const uploadGrievanceDocuments = (data: any): Promise<IResponse> => {
   return request.post({ url: prod + '/api/v1/grv/upload', data })
}

export const logGrievanceAction = (data: any): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/grv/log', data })
}



export const getGrievanceStatus = (data: any): Promise<IResponse> => {
   return request.post({ url: prod + '/api/v1/grv/status', data })
 }
 


 export const updateGrievanceStatus = (data: any): Promise<IResponse> => {
   return request.post({ url: prod + '/api/v1/grv/status/update', data })
 }

 export const batchImportGrievances = (data: any): Promise<IResponse> => {
   return request.post({ url: prod + '/api/v1/grv/upsert', data })
 }

 
 export const getByKeyword = (data: any): Promise<IResponse> => {
   return request.post({ url: prod + '/api/v1/grv/keyword', data })
 }


 
export const getActionFile= (data: any) => {
   // console.log('filters....', data)
    return request.post({ url: prod + '/api/v1/grv/download',  data , responseType: 'blob' })
 }
 
  