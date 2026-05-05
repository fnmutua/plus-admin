import request from '@/config/axios'
import type { SettlementType } from '../settlements/types'
import { apiOrigin } from '@/config/apiBase'

const dev = apiOrigin + ':4000' // Add the port for local Dev
const prod = apiOrigin // remove the port for production

export const getAll = ({ params }: AxiosConfig) => {
  return request.get<{
    total: number
    list: SettlementType[]
  }>({ url: prod + '/api/v1/data/paginated', params })
}

export const getListByparent = (data: SettlementType): Promise<IResponse<SettlementType>> => {
   return request.post({ url: prod + '/api/v1/data/column/paginated', data })
}

