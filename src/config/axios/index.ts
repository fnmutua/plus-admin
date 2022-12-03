import { service } from './service'

import { config } from './config'

import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { reactive, ref, unref, watch } from 'vue'

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userToken = wsCache.get(appStore.getUserInfo)
const token =ref('')

if(userToken){
  token.value= userToken.data
} 
console.log("userToken token--->",wsCache.get(appStore.getUserInfo) )

  

const { default_headers } = config

const request = (option: any) => {
  const { url, method, params, data, headersType, responseType } = option
  return service({
    url: url,
    method,
    params,
    data,
    responseType: responseType,
    headers: {
      'Content-Type': headersType || default_headers,
      'x-access-token': `${token.value}`    // felix - add auth token 
    }
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
