/**
 * Public origin for absolute API URLs (`VITE_APP_HOST`, no trailing slash).
 * Empty string when unset so `origin + '/api/...'` never produces `/undefined/api/...`.
 */
export const apiOrigin: string = (import.meta.env.VITE_APP_HOST || '').replace(/\/+$/, '')

/** Hash-route URL for public requester pages, aligned with `VITE_APP_HOST`. */
export const publicAppHashUrl = (hashPath: string): string => {
  const base =
    apiOrigin ||
    (typeof window !== 'undefined' ? window.location.origin.replace(/\/+$/, '') : '')
  const path = hashPath.startsWith('/') ? hashPath : `/${hashPath}`
  return `${base}/#${path}`
}
