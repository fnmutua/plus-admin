import request from '@/config/axios'
import type { UserType } from '../register/types'


const dev = import.meta.env.VITE_APP_HOST + ':4000' // Add the port for local Dev
const prod = import.meta.env.VITE_APP_HOST // remove the port for production


export const createHousehold = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/hh/add', data })
}

export const updateHousehold = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/hh/update', data })
}

export const deleteHousehold = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/hh/delete', data })
}

export const getAllHouseholds = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/hh/viewAll', data })
}


export const getOneHousehold = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/hh/viewOne', data })
}


export const getFilteredHouseholdsByColumn = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/hh/filter/column', data })
}
 
export const getFilteredHouseholdsBykeyword = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/hh/filter/keyword', data })
}
 
export const postBatchHouseholds = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/hh/batch', data })
}
 