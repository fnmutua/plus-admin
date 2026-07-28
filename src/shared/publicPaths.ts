/** Paths served by the lean public bootstrap (no admin dashboard bundle). */
export const PUBLIC_PATH_PREFIXES = [
  '/landing',
  '/login',
  '/register',
  '/logoff',
  '/privacy',
  '/contact',
  '/faqs',
  '/about',
  '/grm',
  '/incidents',
  '/docs',
  '/delete',
  '/data-request',
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
  if (p.startsWith('/share/')) return true
  if (p.startsWith('/upload-share/')) return true
  if (p.startsWith('/dr-share/')) return true
  if (p.startsWith('/dr-clarify/')) return true
  return false
}

export function shouldUsePublicBootstrap(): boolean {
  if (typeof window === 'undefined') return true
  const hash = window.location.hash || '#/landing'
  const path = hash.startsWith('#') ? hash.slice(1) : hash
  return isPublicBootstrapPath(path)
}
