import { onMounted, onUnmounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import request from '@/config/axios'
import { apiOrigin as prod } from '@/config/apiBase'
import { handleSessionExpired } from '@/config/axios/service'
import {
  SESSION_CHECK_INTERVAL_MS,
  getMsUntilIdleLogout,
  isIdleLogoutDue,
  isSessionRenewalPaused,
  isSessionWarningOpen,
  markSessionActive,
  pauseSessionRenewal,
  setSessionWarningOpen,
  shouldWarnBeforeIdleLogout,
  updateCachedAccessToken,
  applySessionIdleConfig
} from '@/hooks/web/sessionActivity'
import { getAuthUserInfo } from '@/hooks/web/authStorage'
import { isAnonymousPublicPage } from '@/shared/publicPaths'
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'touchmove', 'scroll', 'click'] as const

function formatMinutesLeft(ms: number) {
  const minutes = Math.max(1, Math.ceil(ms / 60_000))
  return `${minutes} minute${minutes === 1 ? '' : 's'}`
}

async function refreshSessionNow() {
  const res: any = await request.get({ url: prod + '/api/v1/auth/session-check', silent: true })
  if (res?.sessionConfig) {
    applySessionIdleConfig(res.sessionConfig)
  }
  if (res?.accessToken) {
    updateCachedAccessToken(res.accessToken)
  }
  markSessionActive()
}

export function useIdleSessionWarning() {
  let timer: ReturnType<typeof setInterval> | null = null
  let logoutTimer: ReturnType<typeof setTimeout> | null = null

  const clearLogoutTimer = () => {
    if (logoutTimer) {
      clearTimeout(logoutTimer)
      logoutTimer = null
    }
  }

  const scheduleIdleLogout = (msUntilLogout: number) => {
    clearLogoutTimer()
    if (msUntilLogout <= 0) {
      handleSessionExpired('Your session has expired due to inactivity.')
      return
    }
    logoutTimer = setTimeout(() => {
      if (isIdleLogoutDue()) {
        handleSessionExpired('Your session has expired due to inactivity.')
      }
    }, msUntilLogout)
  }

  const onStayLoggedIn = async () => {
    try {
      await refreshSessionNow()
      setSessionWarningOpen(false)
      clearLogoutTimer()
    } catch {
      handleSessionExpired()
    }
  }

  const onDeclineStayOnline = () => {
    pauseSessionRenewal()
    setSessionWarningOpen(false)
    scheduleIdleLogout(getMsUntilIdleLogout())
  }

  const showIdleWarning = async (msUntilLogout: number) => {
    if (isSessionWarningOpen()) return
    setSessionWarningOpen(true)

    try {
      await ElMessageBox.confirm(
        `You have been inactive. You will be logged out in ${formatMinutesLeft(msUntilLogout)} unless you stay signed in.`,
        'Session expiring',
        {
          confirmButtonText: 'Stay logged in',
          cancelButtonText: 'Log out now',
          type: 'warning',
          closeOnClickModal: false,
          closeOnPressEscape: false,
          distinguishCancelAndClose: true
        }
      )
      await onStayLoggedIn()
    } catch (action) {
      if (action === 'cancel') {
        handleSessionExpired('You have been logged out.')
        return
      }
      onDeclineStayOnline()
    }
  }

  const evaluateSession = async () => {
    if (isAnonymousPublicPage()) return

    const userInfo = getAuthUserInfo()
    if (!userInfo?.id) return

    if (isIdleLogoutDue()) {
      handleSessionExpired('Your session has expired due to inactivity.')
      return
    }

    if (isSessionRenewalPaused()) {
      if (!isSessionWarningOpen()) {
        scheduleIdleLogout(getMsUntilIdleLogout())
      }
      return
    }

    if (shouldWarnBeforeIdleLogout()) {
      await showIdleWarning(getMsUntilIdleLogout())
    }
  }

  const onActivity = () => {
    if (isAnonymousPublicPage()) return
    if (!getAuthUserInfo()?.id) return
    markSessionActive()
    if (!isSessionRenewalPaused()) {
      clearLogoutTimer()
    }
  }

  onMounted(() => {
    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, onActivity, { passive: true })
    })
    evaluateSession()
    timer = setInterval(evaluateSession, SESSION_CHECK_INTERVAL_MS)
  })

  onUnmounted(() => {
    ACTIVITY_EVENTS.forEach((eventName) => {
      window.removeEventListener(eventName, onActivity)
    })
    if (timer) clearInterval(timer)
    clearLogoutTimer()
    setSessionWarningOpen(false)
  })
}
