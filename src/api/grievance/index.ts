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

export const getOnePublicGrievance = (data: any): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/grv/public', data })
}


export const uploadGrievanceDocuments = (data: any, silent = false): Promise<IResponse> => {
   return request.post({ url: prod + '/api/v1/grv/upload', data, silent })
}

export const logGrievanceAction = (data: any, silent = false): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/grv/log', data, silent })
}


export const logGrievanceActionBulk = (data: any): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/grv/log/bulk', data })
}

export const getGrievanceStatus = (data: any): Promise<IResponse> => {
   return request.post({ url: prod + '/api/v1/grv/status', data })
 }
 


 export const updateGrievanceStatus = (data: any, silent = false): Promise<IResponse> => {
   return request.post({ url: prod + '/api/v1/grv/status/update', data, silent })
 }



 export const updateGrievance  = (data: any, silent = false): Promise<IResponse> => {
   return request.post({ url: prod + '/api/v1/grv/update', data, silent })
 }


 export const updateBulkGrievance  = (data: any): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/grv/update/bulk', data })
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
 
  

  
export const sendAcknowledgement= (data: any) => {
   // console.log('filters....', data)
    return request.post({ url: prod + '/api/v1/pdf',  data })
 }

export const generateResolutionForm= (data: any) => {
   // Generate resolution form with blob response
    return request.post({ url: prod + '/api/v1/pdf',  data, responseType: 'blob' })
 }
 
 export const deleteCascade= (data: any) => {
   // console.log('filters....', data)
    return request.post({ url: prod + '/api/v1/grv/delete',  data })
 }

 export const revertGrievanceHistory = (data: any): Promise<IResponse<any>> => {
   // console.log('....', data)
   return request.post({ url: prod + '/api/v1/grv/revert', data })
 }

 export const getGrievanceHistoryByGrievanceId = (data: any): Promise<IResponse<any>> => {
   // console.log('....', data)
   return request.post({ url: prod + '/api/v1/grv/history', data })
 }
 

 export const selfEscalate = (data: any): Promise<IResponse<any>> => {
  // console.log('....', data)
  return request.post({ url: prod + '/api/v1/grv/self/escalate', data })
}


export const sendOverdueReminder = (data: any): Promise<IResponse<any>> => {
  // console.log('....', data)
  return request.post({ url: prod + '/api/v1/grv/reminder', data })
}

export const confirmGrievanceResolution = (data: any): Promise<IResponse<any>> => {
  return request.post({ url: prod + '/api/v1/grv/confirm', data })
}




export const getTimelineReport = (data: any) => {
  return request.post({
    url: prod + '/api/v1/pdf/timeline',
    data,
    responseType: 'blob', // 👈 necessary for PDF
  });
};
