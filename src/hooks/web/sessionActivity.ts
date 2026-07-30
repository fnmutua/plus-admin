import { getAuthUserInfo, setAuthUserInfo } from '@/hooks/web/authStorage'

export type SessionIdleConfig = {
  idleEnforcementEnabled: boolean
  idleLogoutMs: number
  idleWarningMs: number
  idleRenewalThresholdMs: number
}

const DEFAULT_IDLE_CONFIG: SessionIdleConfig = {
  idleEnforcementEnabled: true,
  idleLogoutMs: 30 * 60 * 1000,
  idleWarningMs: 5 * 60 * 1000,
  idleRenewalThresholdMs: 5 * 60 * 1000
}

export const SESSION_CHECK_INTERVAL_MS = 12_000

let idleConfig: SessionIdleConfig = { ...DEFAULT_IDLE_CONFIG }
let lastActivityAt = Date.now()
let renewalPaused = false
let warningOpen = false

export function applySessionIdleConfig(payload: Partial<SessionIdleConfig> | null | undefined) {
  if (!payload) return
  idleConfig = {
    idleEnforcementEnabled: payload.idleEnforcementEnabled ?? idleConfig.idleEnforcementEnabled,
    idleLogoutMs: payload.idleLogoutMs ?? idleConfig.idleLogoutMs,
    idleWarningMs: payload.idleWarningMs ?? idleConfig.idleWarningMs,
    idleRenewalThresholdMs: payload.idleRenewalThresholdMs ?? idleConfig.idleRenewalThresholdMs
  }
}

export function getSessionIdleConfig() {
  return { ...idleConfig }
}

export function isIdleEnforcementEnabled() {
  return idleConfig.idleEnforcementEnabled
}

export function markSessionActive() {
  lastActivityAt = Date.now()
  renewalPaused = false
}

export function getLastActivityAt() {
  return lastActivityAt
}

export function getIdleDurationMs() {
  return Date.now() - lastActivityAt
}

export function getMsUntilIdleLogout() {
  return idleConfig.idleLogoutMs - getIdleDurationMs()
}

export function isIdleBeyondRenewalThreshold() {
  if (!idleConfig.idleEnforcementEnabled) return false
  return getIdleDurationMs() >= idleConfig.idleRenewalThresholdMs
}

export function shouldRenewSession() {
  if (!idleConfig.idleEnforcementEnabled) return !renewalPaused
  return !renewalPaused && !isIdleBeyondRenewalThreshold()
}

export function shouldWarnBeforeIdleLogout() {
  if (!idleConfig.idleEnforcementEnabled) return false
  const msLeft = getMsUntilIdleLogout()
  return (
    !renewalPaused &&
    msLeft > 0 &&
    msLeft <= idleConfig.idleWarningMs &&
    isIdleBeyondRenewalThreshold()
  )
}

export function isIdleLogoutDue() {
  if (!idleConfig.idleEnforcementEnabled) return false
  return getIdleDurationMs() >= idleConfig.idleLogoutMs
}

export function pauseSessionRenewal() {
  renewalPaused = true
}

export function isSessionRenewalPaused() {
  return renewalPaused
}

export function setSessionWarningOpen(open: boolean) {
  warningOpen = open
}

export function isSessionWarningOpen() {
  return warningOpen
}

export function getAccessTokenFromCache(): string | null {
  try {
    const userInfo = getAuthUserInfo<{ data?: string }>()
    const token = userInfo?.data
    if (!token || typeof token !== 'string') return null
    const trimmed = token.trim()
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null
    return trimmed
  } catch {
    return null
  }
}

export function updateCachedAccessToken(token: string) {
  const userInfo = getAuthUserInfo<Record<string, unknown>>()
  if (!userInfo?.id) return
  setAuthUserInfo({ ...userInfo, data: token })
}
