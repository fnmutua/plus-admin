import { finishLoginNavigation } from '@/utils/bootstrapNavigation'

/**
 * Navigate to an authenticated admin-app path from the public landing shell.
 * Logged-in users hard-reload into the full app; others go to login with redirect.
 */
export function goToPortalPath(
  portalPath: string,
  opts: {
    isLoggedIn: boolean
    push: (loc: string | { path: string; query?: Record<string, string> }) => unknown
  },
) {
  const path = portalPath.startsWith('/') ? portalPath : `/${portalPath}`
  if (opts.isLoggedIn) {
    if (finishLoginNavigation(path)) return
    opts.push(path)
    return
  }
  opts.push({ path: '/login', query: { redirect: path } })
}
