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



 
 
export const streamGeo = async ({ params }: AxiosConfig): Promise<IResponse<any>> => {
  try {
    // Serialize filters and filterValues as JSON strings for query params
    const queryParams: any = { ...params };
    
    if (queryParams.filters && Array.isArray(queryParams.filters)) {
      queryParams.filters = JSON.stringify(queryParams.filters);
    }
    
    if (queryParams.filterValues && Array.isArray(queryParams.filterValues)) {
      queryParams.filterValues = JSON.stringify(queryParams.filterValues);
    }

    const response = await axios.get<{ data: any; code: string }>(
      prod + '/api/v1/data/stream/geo',
      {
        params: queryParams,
        responseType: 'json', // Changed to json for better performance
      }
    );

    // Transform response to match IResponse format
    // Backend returns { data: geojson, code: '0000' }
    // IResponse uses 'results' property
    return {
      results: response.data.data,
      code: response.data.code || '0000',
      message: 'Success',
    } as IResponse<any>;
  } catch (error: any) {
    console.error('Error streaming geo data:', error);
    throw new Error(`Error streaming data: ${error.message || 'Unknown error'}`);
  }
};





export const getOneGeo = (data: SettlementType): Promise<IResponse<SettlementType>> => {
  //console.log('getGeo....', data)
  return request.post({ url: prod + '/api/v1/data/one/geo', data })
}

export const getAdminUnitsFromCoordinates = (
  data: { lat: number; lon: number }
): Promise<IResponse<any>> => {
  return request.post({ url: prod + '/api/v1/data/admin-units-from-coords', data })
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

export const updateOneRecord = (data: SettlementType, options?: { silent?: boolean }): Promise<IResponse<SettlementType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/data/edit', data, ...(options?.silent ? { silent: true } : {}) })
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

  const fetchByDocumentIds =
    (Array.isArray(requestData.documentIds) && requestData.documentIds.length > 0) ||
    requestData.documentId != null

  // Fetching explicit ids (e.g. link dialog) must not apply default non-image format exclusion
  if (fetchByDocumentIds) {
    requestData.excludePhotos = false
    delete requestData.excludeFormats
  } else if (data.includeFormats || data.formatFilter) {
    // If includeFormats or formatFilter is provided, include only those formats (for photos)
    requestData.includeFormats = data.includeFormats || data.formatFilter
    requestData.excludePhotos = false
    // Remove excludeFormats when including specific formats
    delete requestData.excludeFormats
  } else if (!fetchByDocumentIds) {
    // Default behavior: exclude photos (must match frontend imageFormats so list count matches pagination)
    requestData.excludePhotos = true
    requestData.excludeFormats = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'tiff', 'tif']
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
      console.log('[getPublicSharedDocuments] raw HTTP response.data:', response.data)
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

/** Zip multiple documents from a public share (no auth). */
export const downloadSharedDocumentsZip = (token: string, documentIds: number[]): Promise<Blob> => {
  return axios
    .post(
      prod + `/api/public/share/${token}/download-zip`,
      { documentIds },
      { responseType: 'blob', headers: { 'Content-Type': 'application/json' } }
    )
    .then((response) => response.data)
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


 
// Link an existing document to an additional entity (e.g. a second settlement)
export const linkDocument = (data: { document_id: number; entity_type: string; entity_id: number }): Promise<IResponse<any>> => {
  return request.post({ url: prod + '/api/v1/docs/link', data })
}

// Remove a document→entity link without deleting the document
export const unlinkDocument = (
  data: { document_id: number; entity_type: string; entity_id: number },
  options?: { silent?: boolean }
): Promise<IResponse<any>> => {
  return request.post({
    url: prod + '/api/v1/docs/unlink',
    data,
    ...(options?.silent ? { silent: true } : {})
  })
}

// Get all documents linked to a specific entity via document_link
export const getLinkedDocuments = (data: { entity_type: string; entity_id: number }): Promise<IResponse<any>> => {
  return request.post({ url: prod + '/api/v1/docs/linked', data })
}

/** Primary FKs + document_link rows for one document (link dialog, etc.) */
export const getDocumentAssociationSnapshot = (
  data: { document_id: number },
  options?: { silent?: boolean }
): Promise<IResponse<any>> => {
  return request.post({
    url: prod + '/api/v1/docs/association-snapshot',
    data,
    ...(options?.silent ? { silent: true } : {})
  })
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

export const revertMerge = (data: SettlementType): Promise<IResponse<SettlementType>> => {
  return request.post({ url: prod + '/api/v1/edit/revertMerge', data })
}

export const getSettlementMapData = (data: { settlementId: string }): Promise<IResponse<any>> => {
  return request.post({ url: prod + '/api/v1/data/geo/multiple', data })
}

export const getSettlementsWithBoundaryGeometry = (data: { county_id?: number; settlement_ids?: number[] }): Promise<IResponse<number[]>> => {
  return request.post({ url: prod + '/api/v1/data/settlements/with-boundary-geometry', data })
}

// Get neighboring settlements - returns only id, name, and boundary geometry for fast loading
export const getNeighboringSettlements = (data: { 
  settlementId: string | number
  bbox?: { minLng: number; minLat: number; maxLng: number; maxLat: number }
  expansionFactor?: number
}): Promise<IResponse<Array<{ id: number; name: string; geom: any }>>> => {
  return request.post({ url: prod + '/api/v1/data/settlements/neighbors', data })
}

// Get imagery layers for a settlement - returns layer names that intersect with settlement bbox
export const getSettlementImageryLayers = (data: {
  settlementId: string | number
  bbox?: { minLng: number; minLat: number; maxLng: number; maxLat: number }
}): Promise<IResponse<string[]>> => {
  return request.post({ url: prod + '/api/v1/data/settlements/imagery', data })
}

// Download geospatial data for multiple settlements as zip
export const downloadSettlementsGeoData = (data: { settlementIds: number[], filters?: any[], filterValues?: any[] }): Promise<{ blob: Blob, shareLink: string | null, documentId: number | null }> => {
  return request.post({ 
    url: prod + '/api/v1/data/download/geo/zip', 
    data,
    responseType: 'blob'
  }).then((response: any) => {
    // Debug: log response to see headers
    console.log('Download response:', response);
    console.log('Response headers:', response.headers);
    
    // Try different ways to access the header (headers are usually lowercase in axios)
    const shareLink = 
      response.headers?.['x-share-link'] || 
      response.headers?.['X-Share-Link'] || 
      response.headers?.get?.('x-share-link') ||
      response.headers?.get?.('X-Share-Link') ||
      null;
    
    // Get document ID from header
    const documentId = 
      response.headers?.['x-document-id'] || 
      response.headers?.['X-Document-Id'] || 
      response.headers?.get?.('x-document-id') ||
      response.headers?.get?.('X-Document-Id') ||
      null;
    
    console.log('Extracted share link:', shareLink);
    console.log('Extracted document ID:', documentId);
    return { 
      blob: response.data, 
      shareLink: shareLink ? decodeURIComponent(shareLink) : null,
      documentId: documentId ? parseInt(documentId) : null
    };
  })
}