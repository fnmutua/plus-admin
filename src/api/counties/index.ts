import request from '@/config/axios'
import type { CountyType } from '../register/types'

interface RoleParams {
  roleName: string
}

const dev = import.meta.env.VITE_APP_HOST + ':4000' // Add the port for local Dev
const prod = import.meta.env.VITE_APP_HOST // remove the port for production

export const getCountyListApi = ({ params }: AxiosConfig) => {
  return request.get<{
then(arg0: (response: { data: any }) => void): unknown
    total: number
    list: CountyType[]
  }>({ url: prod + '/api/v1/data/all', params })
}
 
 
export const getListWithoutGeo = ({ params }: AxiosConfig) => {
  return request.get<{
then(arg0: (response: { data: any }) => void): unknown
    total: number
    list: CountyType[]
  }>({ url: prod + '/api/v1/data/all/nogeo', params })
}

 
 
export const getEntitiesByCode = ({ params }: AxiosConfig) => {
  return request.get<{
then(arg0: (response: { data: any }) => void): unknown
    total: number
    list: CountyType[]
  }>({ url: prod + '/api/v1/data/code', params })
}

 
