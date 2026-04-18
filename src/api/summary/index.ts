import request from '@/config/axios'

const prod = import.meta.env.VITE_APP_HOST // remove the port for production

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

 