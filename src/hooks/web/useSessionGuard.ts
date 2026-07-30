import { onMounted, onUnmounted } from 'vue'
import request from '@/config/axios'
import { apiOrigin as prod } from '@/config/apiBase'
import {
  SESSION_CHECK_INTERVAL_MS,
  applySessionIdleConfig,
  shouldRenewSession,
  updateCachedAccessToken
} from '@/hooks/web/sessionActivity'
import { getAuthUserInfo } from '@/hooks/web/authStorage'

/** Poll session validity; extend sliding sessions only while the user is active. */
export function useSessionGuard() {
  let timer: ReturnType<typeof setInterval> | null = null

  const tick = async () => {
    const userInfo = getAuthUserInfo()
    if (!userInfo?.id) return
    if (!shouldRenewSession()) return

    try {
      const res: any = await request.get({ url: prod + '/api/v1/auth/session-check', silent: true })
      if (res?.sessionConfig) {
        applySessionIdleConfig(res.sessionConfig)
      }
      if (res?.accessToken) {
        updateCachedAccessToken(res.accessToken)
      }
    } catch {
      // axios interceptor handles logout UI
    }
  }

  const onVisible = () => {
    if (document.visibilityState === 'visible') {
      tick()
    }
  }

  onMounted(() => {
    tick()
    timer = setInterval(tick, SESSION_CHECK_INTERVAL_MS)
    document.addEventListener('visibilitychange', onVisible)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
    document.removeEventListener('visibilitychange', onVisible)
  })
}
