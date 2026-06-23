import { onMounted, onUnmounted } from 'vue'
import request from '@/config/axios'
import { apiOrigin as prod } from '@/config/apiBase'
import { useCache } from '@/hooks/web/useCache'
import { useAppStoreWithOut } from '@/store/modules/app'

const INTERVAL_MS = 12_000

/** Poll session validity so admin force-logout takes effect without waiting for user action. */
export function useSessionGuard() {
  let timer: ReturnType<typeof setInterval> | null = null
  const { wsCache } = useCache()
  const appStore = useAppStoreWithOut()

  const tick = async () => {
    const userInfo = wsCache.get(appStore.getUserInfo)
    if (!userInfo?.id) return
    try {
      const res: any = await request.get({ url: prod + '/api/v1/auth/session-check', silent: true })
      if (res?.accessToken) {
        wsCache.set(appStore.getUserInfo, { ...userInfo, data: res.accessToken })
      }
    } catch {
      // axios interceptor handles logout UI
    }
  }

  onMounted(() => {
    tick()
    timer = setInterval(tick, INTERVAL_MS)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })
}
