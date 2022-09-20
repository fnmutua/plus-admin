import request from '@/config/axios'
import type { UserType } from './types'

export const registerApi = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('Login....', data)
  return request.post({ url: '/api/auth/signup', data })
}
