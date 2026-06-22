import request from '@/config/axios'
import { apiOrigin as prod } from '@/config/apiBase'

/**
 * Get optimized project locations with server-side filtering and pre-computed centroids
 */
export const getOptimizedProjectLocations = async ({ params }: AxiosConfig): Promise<IResponse<any>> => {
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
      url: prod + '/api/v1/data/optimized/project-locations',
      params: queryParams
    })

    // Handle response structure
    const responseData = (response as any).data || (response as any).results || response
    
    return {
      data: responseData.data || responseData,
      results: responseData.data || responseData,
      code: responseData.code || (response as any).code || '0000',
      message: 'Success'
    } as any
  } catch (error: any) {
    console.error('Error fetching optimized project locations:', error)
    throw new Error(`Error fetching project locations: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Get programmes list (programmex table)
 */
export const getProgrammesList = async ({ params }: AxiosConfig): Promise<IResponse<any>> => {
  const response = await request.get<{ data: any[]; code: string }>({
    url: prod + '/api/v1/data/optimized/programmes',
    params
  })
  const body = response as any
  return {
    data: Array.isArray(body?.data) ? body.data : [],
    code: body?.code || '0000',
    message: body?.message || 'Success'
  } as any
}

/**
 * Get implementers list (programme_implementation)
 */
export const getImplementersList = ({ params }: AxiosConfig): Promise<IResponse<any>> => {
  return request.get({ 
    url: prod + '/api/v1/data/optimized/implementers',
    params
  })
}

/**
 * Get components list for selected programme(s) — cascade filter
 */
export const getComponentsList = async ({ params }: AxiosConfig): Promise<IResponse<any>> => {
  const response = await request.get<{ data: any[]; code: string }>({
    url: prod + '/api/v1/data/optimized/components',
    params
  })
  const body = response as any
  return {
    data: Array.isArray(body?.data) ? body.data : [],
    code: body?.code || '0000',
    message: body?.message || 'Success'
  } as any
}

// Re-export batch geometries and other utilities from settlements-optimized
export { getBatchGeometries, getCountiesList, getSubcountiesList } from '@/api/settlements-optimized'
