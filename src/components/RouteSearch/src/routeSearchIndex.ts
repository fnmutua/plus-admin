import type { RouteMeta } from 'vue-router'
import { isUrl } from '@/utils/is'
import { pathResolve } from '@/utils/routerHelper'

export interface RouteSearchItem {
  /** Absolute path to navigate to. */
  path: string
  /** Translated menu title. */
  title: string
  /** Ancestor titles, outermost first. */
  trail: string[]
  icon?: string
  /** Pre-lowercased haystack, built once at index time. */
  haystack: string
}

/**
 * Flatten the routes this user actually received into navigable search entries.
 *
 * The permission store only ever contains routes the user's roles generated, so no
 * extra permission filtering is needed here — we only drop what the menu also hides.
 */
export function buildRouteSearchIndex(
  routers: AppRouteRecordRaw[] = [],
  translate: (key: string) => string,
  parentPath = '/',
  trail: string[] = []
): RouteSearchItem[] {
  const items: RouteSearchItem[] = []

  for (const route of routers) {
    const meta = (route.meta ?? {}) as RouteMeta
    if (meta.hidden) continue
    // External links can't be pushed onto the router.
    if (isUrl(route.path)) continue

    const fullPath = pathResolve(parentPath, route.path)
    const title = meta.title ? translate(meta.title as string) : ''
    const nextTrail = title ? [...trail, title] : trail
    const visibleChildren = (route.children ?? []).filter((child) => !child.meta?.hidden)

    if (visibleChildren.length) {
      items.push(...buildRouteSearchIndex(visibleChildren, translate, fullPath, nextTrail))
      continue
    }

    // Routes needing params can't be opened from a search box.
    if (!title || fullPath.includes(':')) continue

    items.push({
      path: fullPath,
      title,
      trail,
      icon: meta.icon as string | undefined,
      haystack: `${title} ${trail.join(' ')} ${fullPath}`.toLowerCase(),
    })
  }

  return items
}

/** Characters in order but not necessarily adjacent, e.g. "stl" → "settlements". */
function isSubsequence(needle: string, haystack: string): boolean {
  let i = 0
  for (let j = 0; j < haystack.length && i < needle.length; j++) {
    if (haystack[j] === needle[i]) i++
  }
  return i === needle.length
}

function scoreToken(item: RouteSearchItem, token: string): number {
  const title = item.title.toLowerCase()
  if (title === token) return 100
  if (title.startsWith(token)) return 80
  if (title.includes(token)) return 60

  const trail = item.trail.join(' ').toLowerCase()
  if (trail.includes(token)) return 40

  if (item.path.toLowerCase().includes(token)) return 30
  if (isSubsequence(token, title)) return 20
  if (isSubsequence(token, item.haystack)) return 10

  return 0
}

/**
 * Rank entries against a query. Every whitespace-separated token must match
 * something, so "set map" narrows rather than widens the result set.
 */
export function searchRoutes(
  items: RouteSearchItem[],
  query: string,
  limit = 8
): RouteSearchItem[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!tokens.length) return []

  const scored: { item: RouteSearchItem; score: number }[] = []

  for (const item of items) {
    let total = 0
    let matchedAll = true

    for (const token of tokens) {
      const score = scoreToken(item, token)
      if (!score) {
        matchedAll = false
        break
      }
      total += score
    }

    if (matchedAll) scored.push({ item, score: total })
  }

  return scored
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .slice(0, limit)
    .map((entry) => entry.item)
}
