import request from '@/config/axios'
import state from '@/config/axios'
import type { SettlementType } from '../settlements/types'
import axios, { AxiosResponse } from 'axios';

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

export const xstreamAllGeo = (data: SettlementType): Promise<IResponse<SettlementType>> => {
  console.log('streamAllGeo....', data)
  return request.post({ url: prod + '/api/v1/data/stream/geo', data })
}


export const streamAllGeo = (data: SettlementType): Promise<IResponse<SettlementType>> => {
  console.log('streamAllGeo....', data)
  return request.get({ url: prod + '/api/v1/data/stream/geo', data ,responseType: 'stream'})
}
export const _streamAllGeo = (data: SettlementType): Promise<AxiosResponse<SettlementType>> => {
  return axios.post<SettlementType>(prod + '/api/v1/data/stream/geo', data, {    responseType: 'stream',  });
};



 
 
export const streamGeo = async ({ params }: AxiosConfig): Promise<AxiosResponse<NodeJS.ReadableStream>> => {
  try {
    const response = await axios.get<NodeJS.ReadableStream>(
      prod + '/api/v1/data/stream/geo',
      {
        params,
        responseType: 'stream', // Set the responseType to 'stream'
      }
    );

    return response;
  } catch (error) {
    throw new Error(`Error streaming data `);
  }
};





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


export const uploadFilesBatch = (data: SettlementType): Promise<IResponse<SettlementType>> => {
  console.log('1Upload uploadFilesBatch:', state.uploadPercentage);

  return request.post({
    url: prod + '/api/v1/upload/batch',
    data    
  });
  

};





// const response = await service.post('/upload', formData, {
//   uploadProgressCallback: (uploadPercentage: number) => {
//     console.log('Upload Percentage:', uploadPercentage);
//    },
// });







export const deleteDocument = (data: SettlementType): Promise<IResponse<SettlementType>> => {
  // console.log('....', data)
  return request.post({ url: prod + '/api/v1/upload/delete', data })
}

export const getRoutesList = (
  data: SettlementType
): Promise<IResponse<SettlementType>> => {
  return request.post({ url: prod + '/api/v1/routes', data })
}



export const getListManyToMany = (
  data: SettlementType
): Promise<IResponse<SettlementType>> => {
  return request.post({ url: prod + '/api/v1/data/column/mm', data })
}


export const getDocumentsBySearch = (
  data: SettlementType
): Promise<IResponse<SettlementType>> => {
  return request.post({ url: prod + '/api/v1/docs/search', data })
}


 
export const getRawFiles = (data: SettlementType): Promise<IResponse<SettlementType>> => {

  return request.post({ url: prod + '/api/v1/documents/raw' , data})
}


export const deleteRawFiles = (data: SettlementType): Promise<IResponse<SettlementType>> => {
  // console.log('....', data)
  return request.post({ url: prod + '/api/v1/documents/raw/delete', data })
}