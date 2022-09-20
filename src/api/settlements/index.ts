import request from '@/config/axios'
import type { SettlementType } from '../settlements/types'

export const getSettlementListApi = ({ params }: AxiosConfig) => {
  return request.get<{
    total: number
    list: SettlementType[]
  }>({ url: '/api/v1/data/paginated', params })
}
