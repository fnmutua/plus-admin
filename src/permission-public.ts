import router from './router/public'
import { trackPageVisit } from '@/api/register-public'
import { useTitle } from '@/hooks/web/useTitle'
import { isPublicBootstrapPath } from '@/shared/publicPaths'

router.beforeEach((to, _from, next) => {
  if (!isPublicBootstrapPath(to.path)) {
    const target = `${window.location.pathname}${window.location.search}#${to.fullPath}`
    window.location.replace(target)
    window.location.reload()
    return
  }
  next()
})

router.afterEach((to) => {
  useTitle(to?.meta?.title as string)

  const schedule =
    typeof window !== 'undefined' && 'requestIdleCallback' in window
      ? (cb: () => void) => window.requestIdleCallback(cb, { timeout: 3000 })
      : (cb: () => void) => window.setTimeout(cb, 1200)

  schedule(() => {
    const path = to.path || '/'
    const pageName = (to.meta?.title as string) || path
    let sessionId = ''
    try {
      sessionId = sessionStorage.getItem('visit_session_id') || ''
      if (!sessionId) {
        sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
        sessionStorage.setItem('visit_session_id', sessionId)
      }
    } catch {
      sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    }
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
    const deviceType = /Mobile|Android|iPhone|iPad/i.test(ua)
      ? /iPad|Tablet/i.test(ua)
        ? 'tablet'
        : 'mobile'
      : 'desktop'
    trackPageVisit({
      path,
      page_name: pageName,
      referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
      user_agent: ua || undefined,
      device_type: deviceType,
      query_string: to.fullPath?.includes('?') ? to.fullPath.split('?')[1] : undefined,
      session_id: sessionId,
    }).catch(() => {})
  })
})
