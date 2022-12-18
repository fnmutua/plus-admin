import request from '@/config/axios'
import type { UserType } from './types'

const dev = import.meta.env.VITE_APP_HOST + ':4000' // Add the port for local Dev
const prod = import.meta.env.VITE_APP_HOST // remove the port for production

export const registerApi = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('regs....', data)
  return request.post({ url: prod + '/api/auth/signup', data })
}
