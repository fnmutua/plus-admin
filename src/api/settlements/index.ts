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


export const duplicatePreCheck = (
  data: SettlementType
): Promise<IResponse<SettlementType>> => {
  return request.post({ url: prod + '/api/v1/data/create/check', data })
}


export const getDuplicates = (
  data: SettlementType
): Promise<IResponse<SettlementType>> => {
  return request.post({ url: prod + '/api/v1/data/column/duplicate', data })
}



export const mergeDuplicates = (
  data: SettlementType
): Promise<IResponse<SettlementType>> => {
  return request.post({ url: prod + '/api/v1/data/merge', data })
}


export const getAllForDownload = (
  data: SettlementType
): Promise<IResponse<SettlementType>> => {
  return request.post({ url: prod + '/api/v1/data/download/all', data })
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

export const getfilteredParcelGeo = (data: SettlementType): Promise<IResponse<SettlementType>> => {
  //  console.log('getGeo....', data)
    return request.post({ url: prod + '/api/v1/data/subset/geo/parcel', data })
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



export const getOneByCode = (data: SettlementType): Promise<IResponse<SettlementType>> => {
  //  console.log('Number of Settlements....', data)
    return request.post({ url: prod + '/api/v1/data/one/code', data })
  }
  





export const searchByKeyWord = (data: SettlementType): Promise<IResponse<SettlementType>> => {
 // console.log('....', data)
  return request.post({ url: prod + '/api/v1/data/paginated/filter', data })
}

export const getLookups = (data: SettlementType): Promise<IResponse<SettlementType>> => {
  // console.log('....', data)
   return request.post({ url: prod + '/api/v1/data/lookup', data })
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



export const DeleteRecordByCriteria = (data: SettlementType): Promise<IResponse<SettlementType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/data/delete/keys', data })
}



export const DeleteMultipleRecord = (data: SettlementType): Promise<IResponse<SettlementType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/data/delete/many', data })
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

// Define interfaces for type safety
interface DocumentCheck {
  name: string;
 }

interface DocumentCheckResult {
  name: string | null;
  exists: boolean;
  message: string;
}

interface IResponse<T> {
  message: string;
  code: string;
  results: T;
}

 

export const checkFilesExist = (data: SettlementType): Promise<IResponse<SettlementType>> => {
 
  return request.post({
    url: prod + '/api/v1/upload/check',
    data    
  });
  

};


export const uploadCoverPhoto = (data: SettlementType): Promise<IResponse<SettlementType>> => {
 
  return request.post({
    url: prod + '/api/v1/upload/cover',
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

export const getDocumentRepository = (
  data: any
): Promise<IResponse<any>> => {
  // Handle photo filtering based on request
  const requestData = { ...data }
  
  if (data.formatFilter) {
    // If formatFilter is provided, include only those formats (for photos)
    requestData.includeFormats = data.formatFilter
    requestData.excludePhotos = false
  } else {
    // Default behavior: exclude photos
    requestData.excludePhotos = true
    requestData.excludeFormats = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'tiff', 'tif']
  }
  
  console.log('getDocumentRepository API - sending requestData:', requestData)
  console.log('getDocumentRepository API - excludePhotos:', requestData.excludePhotos)
  console.log('getDocumentRepository API - includeFormats:', requestData.includeFormats)
  return request.post({ url: prod + '/api/v1/docs/repository', data: requestData })
}

export const getDocumentUploaders = (): Promise<IResponse<any>> => {
  return request.get({ url: prod + '/api/v1/docs/uploaders' })
}


// Create a public share link for one or more documents
export const shareDocuments = (data: {
  documentIds: number[]
  to?: string[] | string
  message?: string
  expiresInHours?: number
}): Promise<IResponse<any>> => {
  return request.post({ url: prod + '/api/v1/documents/share', data })
}

// Get shared documents by token (public endpoint, no auth required)
export const getPublicSharedDocuments = (token: string): Promise<IResponse<any>> => {
  // Use direct axios for public endpoint (no auth token)
  return axios.get(prod + `/api/public/share/${token}`)
    .then(response => {
      if (response.data.code === '0000') {
        const payload = response.data.data
        // Support both old (array) and new ({ documents, expiresAt }) structures
        const documents = Array.isArray(payload) ? payload : (payload?.documents || [])
        const expiresAt = Array.isArray(payload) ? (payload?.[0]?.expiresAt || null) : (payload?.expiresAt || null)
        return {
          data: { documents, expiresAt },
          code: response.data.code,
          message: response.data.message || 'Success',
          results: { documents, expiresAt }
        }
      }
      throw new Error(response.data.message || 'Failed to fetch shared documents')
    })
    .catch(error => {
      if (error.response?.status === 404) {
        throw new Error('Share link not found')
      } else if (error.response?.status === 410) {
        throw new Error('Share link has expired')
      }
      throw error
    })
}

// Download a shared document (public endpoint)
export const downloadSharedDocument = (token: string, documentId: number): Promise<Blob> => {
  return axios.get(prod + `/api/public/share/${token}/download/${documentId}`, {
    responseType: 'blob'
  }).then(response => response.data)
}

// Get all document shares
export const getDocumentShares = (): Promise<IResponse<any>> => {
  return request.get({ url: prod + '/api/v1/documents/shares' })
}

// Revoke a document share
export const revokeDocumentShare = (shareId: number): Promise<IResponse<any>> => {
  return request.post({ url: prod + '/api/v1/documents/share/revoke', data: { shareId } })
}

// Unrevoke a document share
export const unrevokeDocumentShare = (shareId: number): Promise<IResponse<any>> => {
  return request.post({ url: prod + '/api/v1/documents/share/unrevoke', data: { shareId } })
}


 
export const getRawFiles = (data: SettlementType): Promise<IResponse<SettlementType>> => {

  return request.post({ url: prod + '/api/v1/documents/raw' , data})
}


export const deleteRawFiles = (data: SettlementType): Promise<IResponse<SettlementType>> => {
  // console.log('....', data)
  return request.post({ url: prod + '/api/v1/documents/raw/delete', data })
}

export const revertHistory = (data: SettlementType): Promise<IResponse<SettlementType>> => {
  // console.log('....', data)
  return request.post({ url: prod + '/api/v1/edit/revert', data })
}

export const getSettlementMapData = (data: { settlementId: string }): Promise<IResponse<any>> => {
  return request.post({ url: prod + '/api/v1/data/geo/multiple', data })
}

// Download geospatial data for multiple settlements as zip
export const downloadSettlementsGeoData = (data: { settlementIds: number[], filters?: any[], filterValues?: any[] }): Promise<Blob> => {
  return request.post({ 
    url: prod + '/api/v1/data/download/geo/zip', 
    data,
    responseType: 'blob'
  }).then((response: any) => response.data)
}