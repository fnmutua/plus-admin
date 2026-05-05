/**
 * Public origin for absolute API URLs (`VITE_APP_HOST`, no trailing slash).
 * Empty string when unset so `origin + '/api/...'` never produces `/undefined/api/...`.
 */
export const apiOrigin: string = (import.meta.env.VITE_APP_HOST || '').replace(/\/+$/, '')
