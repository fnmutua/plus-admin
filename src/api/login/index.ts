import request from '@/config/axios'
import type { UserType } from './../register/types'
interface RoleParams {
  roleName: string
}

export const loginApi = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('Login....', data)

  console.log('Port-Host.:', import.meta.env.VITE_APP_HOST) // 123
  const dev = import.meta.env.VITE_APP_HOST + ':4000'
  const prod = import.meta.env.VITE_APP_HOST

  return request.post({ url: prod + '/api/auth/signin', data })
}

export const loginOutApi = (): Promise<IResponse> => {
  return request.get({ url: '/user/loginOut' })
}

export const getUserListApi = ({ params }: AxiosConfig) => {
  return request.get<{
    total: number
    list: UserType[]
  }>({ url: '/user/list', params })
}

export const getAdminRoleApi = (
  params: RoleParams
): Promise<IResponse<AppCustomRouteRecordRaw[]>> => {
  return request.get({ url: '/role/list', params })
}

export const getTestRoleApi = (params: RoleParams): Promise<IResponse<string[]>> => {
  return request.get({ url: '/role/list', params })
}
