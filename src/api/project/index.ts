import request from '@/config/axios'
  


const dev = import.meta.env.VITE_APP_HOST + ':4000' // Add the port for local Dev
const prod = import.meta.env.VITE_APP_HOST // remove the port for production



export const addTask = (data: any): Promise<IResponse> => {
  //console.log('filters....', data)
  return request.post({ url: prod + '/api/v1/project/task/add', data })
}
 
export const deleteTask = (data: any): Promise<IResponse> => {
  //console.log('filters....', data)
  return request.post({ url: prod + '/api/v1/project/task/del', data })
}
 
export const getTasks = (data: any): Promise<IResponse> => {
  //console.log('filters....', data)
  return request.post({ url: prod + '/api/v1/project/task/get', data })
}
export const getNestedTasks = (data: any): Promise<IResponse> => {
  //console.log('filters....', data)
  return request.post({ url: prod + '/api/v1/project/task/get/nested', data })
}
 
export const batchImport = (data: any): Promise<IResponse> => {
  //console.log('filters....', data)
  return request.post({ url: prod + '/api/v1/project/task/import', data })
}

// Clock-in API functions
export const clockInTeamMember = (data: any): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/project/clock-in', data })
}

export const clockOutTeamMember = (data: any): Promise<IResponse> => {
  return request.post({ url: prod + '/api/v1/project/clock-out', data })
}

export const getClockInHistory = (params: any): Promise<IResponse> => {
  return request.get({ url: prod + '/api/v1/project/clock-history', params })
}

export const getActiveClockIns = (params: any): Promise<IResponse> => {
  return request.get({ url: prod + '/api/v1/project/active-clockins', params })
}
 
