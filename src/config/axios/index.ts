import { service } from './service'

import { config } from './config'

import { markSessionActive, getAccessTokenFromCache } from '@/hooks/web/sessionActivity'
import { getOrCreateDeviceId } from '@/hooks/web/authStorage'

const { default_headers } = config

const request = (option: any) => {
  const { url, method, params, data, headersType, responseType, headers, silent, timeout } = option

  const token = getAccessTokenFromCache()

  const isForm = typeof FormData !== 'undefined' && data instanceof FormData
  const isBlob = typeof Blob !== 'undefined' && data instanceof Blob

  // Only set Content-Type when we have to; let the browser set boundary for FormData and Blob.
  const contentType = headersType || (isForm || isBlob ? undefined : default_headers || 'multipart/form-data')

  const finalHeaders: Record<string, string> = {
    ...(headers || {})
  }
  if (token) {
    finalHeaders['x-access-token'] = token
    markSessionActive()
  }
  finalHeaders['x-device-id'] = getOrCreateDeviceId()
  if (contentType) {
    finalHeaders['Content-Type'] = contentType
  }

  return service({
    url,
    method,
    params,
    data,
    responseType,
    headers: finalHeaders,
    ...(timeout !== undefined ? { timeout } : {}),
    ...(silent ? { silent: true } : {})
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
