import request from '@/config/axios'
import type { SettlementType } from '../settlements/types'

const dev = import.meta.env.VITE_APP_HOST + ':4000' // Add the port for local Dev
const prod = import.meta.env.VITE_APP_HOST // remove the port for production

export const getSettlementListApi = ({ params }: AxiosConfig) => {
  return request.get<{
    total: number
    list: SettlementType[]
  }>({ url: prod + '/api/v1/data/paginated', params })
}

export const getSettlementListByCounty = (
  data: SettlementType
): Promise<IResponse<SettlementType>> => {
//  console.log('getSettlementListByCounty....', data)
  return request.post({ url: prod + '/api/v1/data/column/paginated', data })
}


export const getHHsByCounty = (
  data: SettlementType
): Promise<IResponse<SettlementType>> => {
//  console.log('special housheolds....', data)
  return request.post({ url: prod + '/api/v1/hh/column/paginated', data })
}


export const getfilteredGeo = (data: SettlementType): Promise<IResponse<SettlementType>> => {
//  console.log('getGeo....', data)
  return request.post({ url: prod + '/api/v1/data/subset/geo', data })
}

export const getAllGeo = (data: SettlementType): Promise<IResponse<SettlementType>> => {
  console.log('getGeo....', data)
  return request.post({ url: prod + '/api/v1/data/all/geo', data })
}






export const getOneGeo = (data: SettlementType): Promise<IResponse<SettlementType>> => {
  //console.log('getGeo....', data)
  return request.post({ url: prod + '/api/v1/data/one/geo', data })
}

export const getCountFilter = (data: SettlementType): Promise<IResponse<SettlementType>> => {
  //console.log('Number of Settlements....', data)
  return request.post({ url: prod + '/api/v1/data/count/filter', data })
}

export const getSumFilter = (data: SettlementType): Promise<IResponse<SettlementType>> => {
  //console.log('Sums.....', data)
  return request.post({ url: prod + '/api/v1/data/sum/filter', data })
}

export const getOneSettlement = (data: SettlementType): Promise<IResponse<SettlementType>> => {
//  console.log('Number of Settlements....', data)
  return request.post({ url: prod + '/api/v1/data/one', data })
}

export const searchByKeyWord = (data: SettlementType): Promise<IResponse<SettlementType>> => {
 // console.log('....', data)
  return request.post({ url: prod + '/api/v1/data/paginated/filter', data })
}

export const uploadFiles = (data: SettlementType): Promise<IResponse<SettlementType>> => {
 // console.log('....', data)
  return request.post({ url: prod + '/api/v1/upload', data })
}

export const CreateRecord = (data: SettlementType): Promise<IResponse<SettlementType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/data/create', data })
}

export const BatchImport = (data: SettlementType): Promise<IResponse<SettlementType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/data/import', data })
}


export const BatchImportUpsert = (data: SettlementType): Promise<IResponse<SettlementType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/data/import/upsert', data })
}

export const getParentIds = (data: SettlementType): Promise<IResponse<SettlementType>> => {
  console.log('Getting parent....', data)
  return request.post({ url: prod + '/api/v1/data/parentids', data })
}


export const DeleteRecord = (data: SettlementType): Promise<IResponse<SettlementType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/data/delete', data })
}


export const updateOneRecord = (data: SettlementType): Promise<IResponse<SettlementType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/data/edit', data })
}


export const uploadDocuments = (data: SettlementType): Promise<IResponse<SettlementType>> => {
  // console.log('....', data)
  return request.post({ url: prod + '/api/v1/upload/documentation', data })
}


export const deleteDocument = (data: SettlementType): Promise<IResponse<SettlementType>> => {
  // console.log('....', data)
  return request.post({ url: prod + '/api/v1/upload/delete', data })
}
