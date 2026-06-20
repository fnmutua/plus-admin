import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

import qs from 'qs'

import { config } from './config'

import { ElMessage, ElMessageBox } from 'element-plus'
import router from '@/router'

const { result_code, base_url } = config

const apiBasePath = (import.meta.env.VITE_API_BASEPATH || 'base') as keyof typeof base_url
export const PATH_URL = base_url[apiBasePath] ?? ''

// ── Session-expiry guard ─────────────────────────────────────────────────────
// Only one dialog, one redirect — however many requests fail simultaneously.
let isHandlingExpiry = false

function handleSessionExpired() {
  if (isHandlingExpiry) return
  isHandlingExpiry = true

  // Kill the token immediately so no further requests sneak through
  try {
    sessionStorage.clear()
    localStorage.clear()
  } catch { /* ignore storage errors */ }

  const currentPath = router.currentRoute.value.fullPath

  ElMessageBox.alert(
    'Your session has expired. Please log in again to continue.',
    'Session Expired',
    {
      confirmButtonText: 'Go to Login',
      type: 'warning',
      showClose: false,
      closeOnClickModal: false,
      closeOnPressEscape: false,
    }
  ).finally(() => {
    isHandlingExpiry = false
    router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`)
  })
}

// 创建axios实例
const service: AxiosInstance = axios.create({
  baseURL: PATH_URL, // api 的 base_url
  timeout: config.request_timeout // 请求超时时间
})

// request拦截器
service.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // If session expiry is already being handled, abort queued requests immediately
    if (isHandlingExpiry) {
      return Promise.reject(new axios.Cancel('Session expired'))
    }

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
      };
    }

    return config;
  },
  (error: AxiosError) => {
    console.log(error); // for debug
    return Promise.reject(error);
  }
);


// response 拦截器
service.interceptors.response.use(
  (response: AxiosResponse<any>) => {
    if (response.config.responseType === 'blob') {
      return response
    }
    else if (response.data.code === result_code) {
      if (response.data.message && !(response.config as any).silent) {
        ElMessage({
          message: response.data.message,
          type: 'success',
          duration: 5000,
        })
      }
      return response.data
    } else {
      console.log('xxxx', response)
      return response
    }
  },
  (error: AxiosError) => {
    console.log('the Error-0->', error)

    // Cancelled requests (e.g. aborted after session expiry) — no toast
    if (axios.isCancel(error)) return Promise.reject(error)

    const status = error?.response?.status
    const message = (error?.response?.data as any)?.message || ''

    // 401 = expired/invalid token, 403 = no token provided
    if (status === 401 || status === 403 || message === 'Unauthorized!') {
      handleSessionExpired()
      // Swallow the error — the dialog + redirect is the UX, not a toast
      return Promise.reject(error)
    }

    // All other errors: show toast (unless request marked silent)
    const errorMessage = message || error?.message || 'An error occurred'
    if (!(error?.config as any)?.silent) {
      ElMessage({
        message: errorMessage,
        type: 'error',
        duration: 5000,
      })
    }

    return Promise.reject(error)
  }
)

export { service }
