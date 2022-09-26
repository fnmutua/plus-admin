import request from '@/config/axios'
import type { SettlementType } from '../settlements/types'

const dev = import.meta.env.VITE_APP_HOST + ':4000' // Add the port for local Dev
const prod = import.meta.env.VITE_APP_HOST // remove the port for production

export const getAll = ({ params }: AxiosConfig) => {
  return request.get<{
    total: number
    list: SettlementType[]
  }>({ url: prod + '/api/v1/data/paginated', params })
}

export const getListByparent = (data: SettlementType): Promise<IResponse<SettlementType>> => {
  console.log('getSettlementListByCounty....', data)
  return request.post({ url: prod + '/api/v1/data/column/paginated', data })
}
