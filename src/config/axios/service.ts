import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { useRouter,Router} from 'vue-router'
 
import qs from 'qs'

import { config } from './config'

import { ElMessage } from 'element-plus'
import router from '@/router'

const { result_code, base_url } = config
 
export const PATH_URL = base_url[import.meta.env.VITE_API_BASEPATH]


// 创建axios实例
const service: AxiosInstance = axios.create({
  baseURL: PATH_URL, // api 的 base_url
  timeout: config.request_timeout // 请求超时时间
})

// request拦截器
service.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    if (
      config.method === 'post' &&
      (config.headers as any)['Content-Type'] === 'application/x-www-form-urlencoded'
    ) {
      console.log('config.headers-->', config.headers);
      config.data = qs.stringify(config.data);
    }
    // get参数编码
    if (config.method === 'get' && config.params) {
      let url = config.url as string;
      url += '?';
      const keys = Object.keys(config.params);
      for (const key of keys) {
        if (config.params[key] !== void 0 && config.params[key] !== null) {
          url += `${key}=${encodeURIComponent(config.params[key])}&`;
        }
      }
      url = url.substring(0, url.length - 1);
      config.params = {};
      config.url = url;
    }

    // Add onUploadProgress to the request config
    if (config.method === 'post' && config.onUploadProgress) {
      config.onUploadProgress = function (progressEvent) {
        const uploadPercentage = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        console.log('Upload Progress:', uploadPercentage);
        // You can handle the upload progress here, e.g., update a progress bar
      };
    }

    return config;
  },
  (error: AxiosError) => {
    // Do something with request error
    console.log(error); // for debug
    return Promise.reject(error);
  }
);


// response 拦截器
service.interceptors.response.use(
  (response: AxiosResponse<any>) => {
    if (response.config.responseType === 'blob') {
      // 如果是文件流，直接过
      return response
    } else if (response.data.code === result_code) {

      if ( response.data.message) {
        ElMessage({
          message: response.data.message,
          type: 'success',
          duration:5000,
        })    // felix - show message on success request 

      }

      return response.data
    } else {
      console.log('xxxx', response)
     // ElMessage.error(response.data.message)
     
    }
  },
  (error) => {
    console.log('the Error-0->', error    ); // Log the error message to the console for debugging
    //console.log(error.response.data.message); // Log any specific message from the response (if available)
  
    // if (error.response.data.message && error.response.data.message == 'Unauthorized!') {
      
    //   console.log("Unauth-Redirecting...")
    //   router.push({
    //     path: '/login',
    //     name: 'Login',
    //    })
    // }

    
     //ElMessage.error(error.response.data.message )   /// Revist Felix 
     ElMessage({
      message: error.response.data.message,
      type: 'error',
      duration:5000,
    })    // felix - show message on success request 

    return Promise.reject(error)
  }
)

export { service }
