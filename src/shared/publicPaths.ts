/** Paths served by the lean public bootstrap (no admin dashboard bundle). */
export const PUBLIC_PATH_PREFIXES = [
  '/landing',
  '/login',
  '/register',
  '/logoff',
  '/privacy',
  '/terms-of-data-use',
  '/contact',
  '/faqs',
  '/about',
  '/settlements',
  '/projects',
  '/grm',
  '/incidents',
  '/docs',
  '/delete',
  '/data-request',
  '/regional-report',
  '/api-docs',
  '/404',
] as const

export function normalizePublicPath(path: string): string {
  const raw = (path || '/landing').split('?')[0].split('#')[0]
  if (!raw || raw === '/') return '/landing'
  return raw.startsWith('/') ? raw : `/${raw}`
}

export function isPublicBootstrapPath(path: string): boolean {
  const p = normalizePublicPath(path)
  if (PUBLIC_PATH_PREFIXES.includes(p as (typeof PUBLIC_PATH_PREFIXES)[number])) return true
  if (p.startsWith('/reset')) return true
  if (p.startsWith('/status')) return true
  if (p.startsWith('/incidents/')) return true
  if (p.startsWith('/community-issues')) return true
  if (p === '/community-issue' || p.startsWith('/community-issue/')) return true
  if (p.startsWith('/share/')) return true
  if (p.startsWith('/upload-share/')) return true
  if (p.startsWith('/dr-share/')) return true
  if (p.startsWith('/dr-clarify/')) return true
  return false
}

export function getCurrentRoutePath(): string {
  if (typeof window === 'undefined') return '/landing'
  const hash = window.location.hash || '#/landing'
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  return normalizePublicPath(raw)
}

export function shouldUsePublicBootstrap(): boolean {
  if (typeof window === 'undefined') return true
  return isPublicBootstrapPath(getCurrentRoutePath())
}

/** Skip login/session enforcement on anonymous public pages (even if stale auth exists in storage). */
export function isAnonymousPublicPage(path?: string): boolean {
  return isPublicBootstrapPath(path ?? getCurrentRoutePath())
}
