import request from '@/config/axios'
import { apiOrigin as prod } from '@/config/apiBase'

/**
 * Get optimized settlements with server-side filtering and pre-computed centroids
 */
export const getOptimizedSettlements = async ({ params }: AxiosConfig): Promise<IResponse<any>> => {
  try {
    const queryParams: any = { ...params }
    
    // Serialize arrays for query params
    if (queryParams.filters && Array.isArray(queryParams.filters)) {
      queryParams.filters = JSON.stringify(queryParams.filters)
    }
    
    if (queryParams.filterValues && Array.isArray(queryParams.filterValues)) {
      queryParams.filterValues = JSON.stringify(queryParams.filterValues)
    }

    // Use request helper to include auth headers automatically
    const response = await request.get<{ data: any; code: string }>({
      url: prod + '/api/v1/data/optimized/settlements',
      params: queryParams
    })

    // Handle response structure - check both data and results properties
    const responseData = (response as any).data || (response as any).results || response
    
    return {
      data: responseData.data || responseData,
      results: responseData.data || responseData,
      code: responseData.code || (response as any).code || '0000',
      message: 'Success'
    } as any
  } catch (error: any) {
    console.error('Error fetching optimized settlements:', error)
    throw new Error(`Error fetching settlements: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Get batch geometries for multiple IDs (counties, subcounties, etc.)
 */
export const getBatchGeometries = ({ data }: AxiosConfig): Promise<IResponse<any>> => {
  return request.post({ 
    url: prod + '/api/v1/data/optimized/batch-geo', 
    data 
  })
}

/**
 * Get counties list (optimized, no geometry)
 */
export const getCountiesList = ({ params }: AxiosConfig): Promise<IResponse<any>> => {
  return request.get({ 
    url: prod + '/api/v1/data/optimized/counties',
    params
  })
}

/**
 * Get subcounties list for a county (optimized, no geometry)
 */
export const getSubcountiesList = ({ params }: AxiosConfig): Promise<IResponse<any>> => {
  return request.get({ 
    url: prod + '/api/v1/data/optimized/subcounties',
    params
  })
}

/**
 * Get wards list for a county (optimized, no geometry)
 */
export const getWardsList = ({ params }: AxiosConfig): Promise<IResponse<any>> => {
  return request.get({
    url: prod + '/api/v1/data/optimized/wards',
    params
  })
}
