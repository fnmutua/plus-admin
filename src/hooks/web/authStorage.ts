import WebStorageCache from 'web-storage-cache'
import { useAppStoreWithOut } from '@/store/modules/app'

const sessionAuthCache = new WebStorageCache({ storage: 'sessionStorage' })
const localAuthCache = new WebStorageCache({ storage: 'localStorage' })

const DEVICE_ID_KEY = 'kesmis_device_id'
/** Must match `userInfo` in src/config/app.ts — used before Pinia is ready. */
const USER_INFO_CACHE_KEY = 'userInfo'

function userInfoKey() {
  try {
    return useAppStoreWithOut().getUserInfo || USER_INFO_CACHE_KEY
  } catch {
    return USER_INFO_CACHE_KEY
  }
}

/** Restore session from localStorage after mobile tab discard / sessionStorage wipe. */
export function restoreAuthSessionFromLocalStorage() {
  const key = userInfoKey()
  const fromLocal = localAuthCache.get(key)
  if (fromLocal) {
    sessionAuthCache.set(key, fromLocal)
    return fromLocal
  }

  const fromSession = sessionAuthCache.get(key)
  if (fromSession) {
    localAuthCache.set(key, fromSession)
  }
  return fromSession
}

export function getAuthUserInfo<T = Record<string, unknown>>(): T | null {
  const key = userInfoKey()
  const fromSession = sessionAuthCache.get(key)
  if (fromSession) return fromSession as T

  const fromLocal = localAuthCache.get(key)
  if (fromLocal) {
    sessionAuthCache.set(key, fromLocal)
    return fromLocal as T
  }
  return null
}

export function setAuthUserInfo(value: unknown) {
  const key = userInfoKey()
  sessionAuthCache.set(key, value)
  localAuthCache.set(key, value)
}

export function clearAuthUserInfo() {
  const key = userInfoKey()
  sessionAuthCache.delete(key)
  localAuthCache.delete(key)
}

export function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY)
    if (!id) {
      id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
      localStorage.setItem(DEVICE_ID_KEY, id)
    }
    return id
  } catch {
    return 'unknown'
  }
}
