/** Pending landing section scroll — used with hash-router scrollBehavior. */
let pendingSectionId: string | null = null
/** When true, afterEach must not force scroll-to-top (section jump in progress). */
let suppressNextTopScroll = false

export function setPendingLandingSection(sectionId: string) {
  pendingSectionId = sectionId
  suppressNextTopScroll = true
}

export function peekPendingLandingSection(): string | null {
  return pendingSectionId
}

export function consumePendingLandingSection(): string | null {
  const id = pendingSectionId
  pendingSectionId = null
  return id
}

export function shouldSuppressLandingTopScroll(): boolean {
  if (!suppressNextTopScroll) return false
  suppressNextTopScroll = false
  return true
}

/** Force the public landing scroll root(s) to the top. */
export function scrollLandingPageToTop(behavior: ScrollBehavior = 'auto') {
  const opts: ScrollToOptions = { top: 0, left: 0, behavior }
  try {
    window.scrollTo(opts)
  } catch {
    window.scrollTo(0, 0)
  }
  const root = document.scrollingElement as HTMLElement | null
  if (root) root.scrollTop = 0
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

export function scrollLandingSectionIntoView(sectionId: string, headerOffset = 112) {
  const el = document.getElementById(sectionId)
  if (!el) return false
  const top =
    el.getBoundingClientRect().top +
    (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0) -
    headerOffset
  const y = Math.max(0, top)
  try {
    window.scrollTo({ top: y, behavior: 'smooth' })
  } catch {
    window.scrollTo(0, y)
  }
  const root = document.scrollingElement as HTMLElement | null
  if (root) root.scrollTop = y
  document.documentElement.scrollTop = y
  document.body.scrollTop = y
  return true
}

/** Retry until the section mounts (e.g. after route change). */
export function scrollLandingSectionWhenReady(
  sectionId: string,
  headerOffset = 112,
  attempts = 30
): Promise<boolean> {
  return new Promise((resolve) => {
    const tryScroll = (left: number) => {
      if (scrollLandingSectionIntoView(sectionId, headerOffset)) {
        resolve(true)
        return
      }
      if (left <= 0) {
        resolve(false)
        return
      }
      setTimeout(() => tryScroll(left - 1), 40)
    }
    requestAnimationFrame(() => tryScroll(attempts))
  })
}
