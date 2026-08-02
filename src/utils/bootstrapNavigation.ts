import { shouldUsePublicBootstrap } from '@/shared/publicPaths'

export function hardReloadToAppPath(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`
  window.location.replace(`${window.location.pathname}${window.location.search}#${normalized}`)
  window.location.reload()
}

/** After login on the public bootstrap, switch to the full admin app shell. */
export function finishLoginNavigation(path: string): boolean {
  if (!shouldUsePublicBootstrap()) return false
  hardReloadToAppPath(path || '/dashboard/national')
  return true
}
