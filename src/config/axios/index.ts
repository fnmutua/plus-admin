import { service } from './service'

import { config } from './config'

import { useAppStoreWithOut, useAppStore } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { ref } from 'vue'

const { wsCache } = useCache()
const appStore = useAppStore()
const token = ref(null)

const { default_headers } = config

const request = (option: any) => {
  const { url, method, params, data, headersType, responseType, headers } = option

  // get local storage variable for the logged in user, else pass empty token
  if (wsCache.storage.userInfo) {
    const loggedInUser = JSON.parse(wsCache.storage.userInfo)
    token.value = JSON.parse(loggedInUser.v).data
  } else {
    token.value = null
  }

  const isForm = typeof FormData !== 'undefined' && data instanceof FormData
  const isBlob = typeof Blob !== 'undefined' && data instanceof Blob

  // Only set Content-Type when we have to; let the browser set boundary for FormData and Blob.
  const contentType = headersType || (isForm || isBlob ? undefined : default_headers || 'multipart/form-data')

  const finalHeaders: Record<string, string> = {
    'x-access-token': `${token.value}`,
    ...(headers || {})
  }
  if (contentType) {
    finalHeaders['Content-Type'] = contentType
  }

  return service({
    url,
    method,
    params,
    data,
    responseType,
    headers: finalHeaders
  })
}

export default {
  get: <T = any>(option: any) => {
    return request({ method: 'get', ...option }) as unknown as T
  },
  post: <T = any>(option: any) => {
    return request({ method: 'post', ...option }) as unknown as T
  },
  delete: <T = any>(option: any) => {
    return request({ method: 'delete', ...option }) as unknown as T
  },
  put: <T = any>(option: any) => {
    return request({ method: 'put', ...option }) as unknown as T
  }
}
