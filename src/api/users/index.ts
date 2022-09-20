import request from '@/config/axios'
import type { UserType } from '../register/types'

interface RoleParams {
  roleName: string
}

export const getUserListApi = ({ params }: AxiosConfig) => {
  return request.get<{
    total: number
    list: UserType[]
  }>({ url: '/api/v1/user/all', params })
}

export const activateUserApi = (data: UserType, params): Promise<IResponse<UserType>> => {
  console.log('To Activate user....', data)

  return request.post({ url: '/api/v1/user/activate', data, params: params })
}
