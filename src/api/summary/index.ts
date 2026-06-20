import request from '@/config/axios'
import { apiOrigin as prod } from '@/config/apiBase'

// Simple hash for cache keys — deterministic string from any object
function _hashData(obj: any): string {
  const str = JSON.stringify(obj, Object.keys(obj).sort())
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0
  }
  return Math.abs(h).toString(36)
}

// In-flight deduplication: identical concurrent requests share one promise
const _summaryInflight = new Map<string, Promise<any>>()



export const getSummarybyField = (data: any): Promise<IResponse> => {
  //console.log('filters....', data)
  return request.post({ url: prod + '/api/v1/summary/byfield', data })
}



export const getSummarybyFieldNested = (data: any): Promise<IResponse> => {
 // console.log('filters....', data)
  return request.post({ url: prod + '/api/v1/summary/byfield/nested', data })
}

export const getSummarybyFieldSimple= (data: any): Promise<IResponse> => {
  // console.log('filters....', data)
   return request.post({ url: prod + '/api/v1/summary/byfield/simple', data })
}
 

export const getSummarybyFieldFromInclude= (data: any): Promise<IResponse> => {
  // console.log('filters....', data)
   return request.post({ url: prod + '/api/v1/summary/byfield/include', data })
}

export const getSummarybyFieldFromMultipleIncludes = (data: any): Promise<IResponse> => {
  // Auto-inject cache_key so the backend Redis layer can cache repeat queries
  const payload = { ...data, cache_key: data.cache_key || _hashData(data) }
  const key = payload.cache_key

  // Return existing in-flight promise for identical concurrent requests
  if (_summaryInflight.has(key)) return _summaryInflight.get(key)!

  const promise = request
    .post({ url: prod + '/api/v1/summary/byfield/multiple', data: payload })
    .finally(() => _summaryInflight.delete(key))

  _summaryInflight.set(key, promise)
  return promise
}

/** One HTTP round-trip for many dashboard chart summaries (same payload shape as getSummarybyFieldFromMultipleIncludes per item). */
export const getSummaryBatchByFieldFromMultipleIncludes = (data: {
  items: { id: string; payload: any }[]
}): Promise<{ code: string; results: { id: string; ok: boolean; data?: any; error?: string; code?: string }[] }> => {
  const items = data.items.map((item) => ({
    id: item.id,
    payload: {
      ...item.payload,
      cache_key: item.payload.cache_key || _hashData(item.payload),
    },
  }))
  return request.post({
    url: prod + '/api/v1/summary/byfield/multiple/batch',
    data: { items },
  }) as Promise<any>
}


export const getSummaryGroupByMultipleFields= (data: any): Promise<IResponse> => {
  // console.log('filters....', data)
   return request.post({ url: prod + '/api/v1/summary/group/multiple', data })
}

export const getFile= (data: any) => {
  // console.log('filters....', data)
   return request.post({ url: prod + '/api/v1/download',  data , responseType: 'blob' })
}

export const getPhoto = (data: any) => {
  // Get photo/image for display (not download)
  return request.post({ url: prod + '/api/v1/photo', data, responseType: 'blob' })
}

/**
 * Axis-based chart data — returns { categories, series } directly from axis config.
 * @deprecated Use renderChart() which dispatches per-type optimised SQL.
 */
export const getChartData = (data: {
  model: string
  x_axis: { field: string; label?: string }
  y_axis: { field: string; aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max'; label?: string }
  series_field?: { field: string; label?: string } | null
  filters?: { field: string; operation: string; value: any }[]
  ignore_empty?: boolean
}): Promise<{ categories: string[]; series: { name: string; data: number[] }[]; code: string }> => {
  return request.post({ url: prod + '/api/v1/chart/data', data }) as Promise<any>
}

/**
 * Per-chart-type optimised data endpoint.
 * Dispatches to the lightest SQL for each chart type server-side.
 */
export const renderChart = (data: {
  chart_type: number
  model?: string
  x_axis?: { field: string; label?: string }
  y_axis?: { field: string; aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max'; label?: string }
  series_field?: { field: string; label?: string } | null
  time_field?: string
  metric_fields?: string[]
  filters?: { field: string; operation: string; value: any }[]
  ignore_empty?: boolean
}): Promise<{ categories: any[]; series: any[]; code: string }> => {
  return request.post({ url: prod + '/api/v1/chart/render', data, silent: true }) as Promise<any>
}

 