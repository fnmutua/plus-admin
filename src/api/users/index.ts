import request from '@/config/axios'
import type { UserType } from '../register/types'

interface RoleParams {
  roleName: string
}

const dev = import.meta.env.VITE_APP_HOST + ':4000' // Add the port for local Dev
const prod = import.meta.env.VITE_APP_HOST // remove the port for production

/* export const xgetUserListApi = ({ params }: AxiosConfig) => {
  return request.get<{
    total: number
    list: UserType[]
  }>({ url: prod + '/api/v1/user/xall', params })
}
 */


export const getUserListApi = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/user/all', data })
}




export const activateUserApi = (data: UserType, params): Promise<IResponse<UserType>> => {
  console.log('To Activate user....', data)
  return request.post({ url: prod + '/api/v1/user/activate', data, params: params })
}


export const updateUserApi = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('To Activate user....', data)
  return request.post({ url: prod + '/api/auth/update', data })
}

export const resetUserPassword = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('Reset user password....', data)
  return request.post({ url: prod + '/api/auth/reset', data })
}


export const updateUserPass = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('Reset user password....', data)
  return request.post({ url: prod + '/api/auth/set', data })
}

