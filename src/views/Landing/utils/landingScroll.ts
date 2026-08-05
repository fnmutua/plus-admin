/** Pending landing section scroll — used with hash-router scrollBehavior. */
let pendingSectionId: string | null = null

export function setPendingLandingSection(sectionId: string) {
  pendingSectionId = sectionId
}

export function consumePendingLandingSection(): string | null {
  const id = pendingSectionId
  pendingSectionId = null
  return id
}

export function scrollLandingSectionIntoView(sectionId: string, headerOffset = 112) {
  const el = document.getElementById(sectionId)
  if (!el) return false
  const top = el.getBoundingClientRect().top + window.pageYOffset - headerOffset
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
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
