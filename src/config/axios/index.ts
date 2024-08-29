import { service } from './service'

import { config } from './config'

import { useAppStoreWithOut,useAppStore } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { reactive, ref, unref, watch } from 'vue'

const { wsCache } = useCache()
const appStore = useAppStore()
const userToken = wsCache.get(appStore.getUserInfo)
const token =ref(null)



const { default_headers } = config

const request = (option: any) => {
  const { url, method, params, data, headersType, responseType } = option
 // console.log('responseType>>',responseType)
 
  //console.log("userToken token--->",(wsCache.storage.userInfo) )
  // get local storage variable for the logged in user, else pass empty token
  if (wsCache.storage.userInfo) {
    const loggedInUser = JSON.parse(wsCache.storage.userInfo);
   // console.log("userToken token--->",JSON.parse(loggedInUser.v).data)
  
    token.value = JSON.parse(loggedInUser.v).data
      
  } else {
    token.value =null 

  }



  return service({
    url: url,
    method,
    params,
    data,
    responseType: responseType,
    headers: {
      'Content-Type': headersType || default_headers || 'multipart/form-data',
      'x-access-token': `${token.value}`
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

  /// just for login to get 




}
