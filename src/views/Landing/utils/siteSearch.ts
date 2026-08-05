import {
  ENGAGEMENT,
  FOOTER,
  INSTITUTION,
  MAIN_NAV,
  MAP_SECTION,
  NEWS_UPDATES,
  PROGRAMMES,
  PUBLICATIONS,
  PUBLIC_PAGES,
  SERVICE_CARDS,
} from '../config/landing.config'

export type SiteSearchHit = {
  id: string
  title: string
  blurb: string
  /** Route path when navigating to a page */
  to: string
  /** DOM id on /landing — matches Vue section `id` attributes */
  section?: string
  kind: string
}

function norm(s: string) {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

function pushUnique(
  list: SiteSearchHit[],
  seen: Set<string>,
  hit: SiteSearchHit
) {
  const key = `${hit.section || ''}|${hit.to}|${hit.title}`
  if (seen.has(key)) return
  seen.add(key)
  list.push(hit)
}

/**
 * Landing home sections — ids must match Vue templates:
 * NationalStatistics #stats, settlements CTA #settlements,
 * ProgrammeCards #interventions, CitizenEngagementCallout #grievances
 */
const LANDING_SECTIONS: SiteSearchHit[] = [
  {
    id: 'sec-stats',
    title: 'Programme figures at a glance',
    blurb: 'Key platform indicators drawn from live KeSMIS data.',
    to: '/landing',
    section: 'stats',
    kind: 'Section',
  },
  {
    id: 'sec-settlements',
    title: MAP_SECTION.title,
    blurb: MAP_SECTION.body,
    to: '/landing',
    section: 'settlements',
    kind: 'Section',
  },
  {
    id: 'sec-interventions',
    title: 'Projects and interventions',
    blurb: 'Key intervention areas and programme themes on the landing page.',
    to: '/landing',
    section: 'interventions',
    kind: 'Section',
  },
  {
    id: 'sec-grievances',
    title: 'Citizen engagement and grievances',
    blurb: ENGAGEMENT.body,
    to: '/landing',
    section: 'grievances',
    kind: 'Section',
  },
]

/** Static index of public landing portal pages, sections, and content. */
export function buildSiteSearchIndex(): SiteSearchHit[] {
  const hits: SiteSearchHit[] = []
  const seen = new Set<string>()

  pushUnique(hits, seen, {
    id: 'home',
    title: 'Home',
    blurb: `${INSTITUTION.fullName} — ${INSTITUTION.descriptor}`,
    to: '/landing',
    kind: 'Page',
  })

  for (const sec of LANDING_SECTIONS) {
    pushUnique(hits, seen, sec)
  }

  for (const item of MAIN_NAV) {
    if (!item.to || item.to === '/landing' || item.to === '/') continue
    // Prefer landing section when nav id matches a known section
    const sectionMatch = LANDING_SECTIONS.find((s) => s.section === item.id)
    if (sectionMatch) {
      pushUnique(hits, seen, {
        id: `nav-${item.id}`,
        title: item.label,
        blurb: sectionMatch.blurb,
        to: '/landing',
        section: sectionMatch.section,
        kind: 'Section',
      })
      continue
    }
    pushUnique(hits, seen, {
      id: `nav-${item.id}`,
      title: item.label,
      blurb: `Go to ${item.label}`,
      to: item.to,
      kind: 'Page',
    })
  }

  for (const card of SERVICE_CARDS) {
    if (card.section) {
      pushUnique(hits, seen, {
        id: `service-${card.id}`,
        title: card.title,
        blurb: card.description,
        to: '/landing',
        section: card.section,
        kind: 'Service',
      })
      continue
    }
    if (!card.to) continue
    pushUnique(hits, seen, {
      id: `service-${card.id}`,
      title: card.title,
      blurb: card.description,
      to: card.to,
      kind: 'Service',
    })
  }

  for (const p of PROGRAMMES) {
    if (p.section) {
      pushUnique(hits, seen, {
        id: `prog-${p.id}`,
        title: p.title,
        blurb: p.description,
        to: '/landing',
        section: p.section,
        kind: p.category,
      })
      continue
    }
    // Cards live under ProgrammeCards #interventions
    pushUnique(hits, seen, {
      id: `prog-${p.id}`,
      title: p.title,
      blurb: p.description,
      to: '/landing',
      section: 'interventions',
      kind: p.category,
    })
  }

  for (const pub of PUBLICATIONS) {
    pushUnique(hits, seen, {
      id: `pub-${pub.id}`,
      title: pub.title,
      blurb: pub.category,
      to: pub.to,
      kind: 'Resource',
    })
  }

  for (const n of NEWS_UPDATES) {
    if (n.section) {
      pushUnique(hits, seen, {
        id: `news-${n.id}`,
        title: n.title,
        blurb: n.summary,
        to: '/landing',
        section: n.section,
        kind: 'Update',
      })
      continue
    }
    if (!n.to) continue
    pushUnique(hits, seen, {
      id: `news-${n.id}`,
      title: n.title,
      blurb: n.summary,
      to: n.to,
      kind: 'Update',
    })
  }

  for (const link of [...FOOTER.usefulLinks, ...FOOTER.policies]) {
    pushUnique(hits, seen, {
      id: `footer-${link.label}`,
      title: link.label,
      blurb: 'Site page',
      to: link.to,
      kind: 'Page',
    })
  }

  for (const a of ENGAGEMENT.actions) {
    pushUnique(hits, seen, {
      id: `engage-${a.label}`,
      title: a.label,
      blurb: ENGAGEMENT.body,
      to: '/landing',
      section: 'grievances',
      kind: 'Service',
    })
  }

  pushUnique(hits, seen, {
    id: 'settlements-explorer',
    title: 'Settlement explorer',
    blurb: 'Browse informal settlements on the public map',
    to: PUBLIC_PAGES.settlementExplorer,
    kind: 'Map',
  })

  pushUnique(hits, seen, {
    id: 'projects-explorer',
    title: 'Project explorer',
    blurb: 'Browse intervention projects on the public map',
    to: PUBLIC_PAGES.projectExplorer,
    kind: 'Map',
  })

  pushUnique(hits, seen, {
    id: 'faqs',
    title: 'FAQs',
    blurb: 'Frequently asked questions about KeSMIS',
    to: '/faqs',
    kind: 'Page',
  })

  pushUnique(hits, seen, {
    id: 'docs',
    title: 'Help & documentation',
    blurb: 'KeSMIS user documentation',
    to: '/docs',
    kind: 'Resource',
  })

  pushUnique(hits, seen, {
    id: 'contact',
    title: 'Contact',
    blurb: `${INSTITUTION.email} · Helpline ${INSTITUTION.helpline}`,
    to: '/contact',
    kind: 'Page',
  })

  return hits
}

const INDEX = buildSiteSearchIndex()

export function searchLandingContent(query: string, limit = 8): SiteSearchHit[] {
  const q = norm(query)
  if (!q) return []

  const tokens = q.split(' ').filter(Boolean)
  const scored: { hit: SiteSearchHit; score: number }[] = []

  for (const hit of INDEX) {
    const hay = norm(`${hit.title} ${hit.blurb} ${hit.kind} ${hit.section || ''}`)
    if (!tokens.every((t) => hay.includes(t))) continue

    let score = 0
    const titleN = norm(hit.title)
    if (titleN === q) score += 100
    else if (titleN.startsWith(q)) score += 60
    else if (titleN.includes(q)) score += 40
    // Prefer landing sections over duplicate page links
    if (hit.section) score += 8
    for (const t of tokens) {
      if (titleN.includes(t)) score += 12
      else if (hay.includes(t)) score += 4
    }
    scored.push({ hit, score })
  }

  scored.sort((a, b) => b.score - a.score || a.hit.title.localeCompare(b.hit.title))
  return scored.slice(0, limit).map((s) => s.hit)
}
