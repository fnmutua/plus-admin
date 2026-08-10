/**
 * Landing portal content & route map.
 * Update copy and placeholders here — do not invent official figures.
 * Live stats come from GET /api/public/landing/stats (settlements, population, projects, counties).
 */

export const INSTITUTION = {
  systemName: 'KeSMIS',
  fullName: 'Kenya Slum Management Information System',
  descriptor: 'National information system for informal settlements',
  programme: 'Kenya Informal Settlements Improvement Project (KISIP)',
  ministry: 'State Department for Housing and Urban Development',
  government: 'Government of Kenya',
  email: 'kisip2info@gmail.com',
  helpline: '0800 724 349',
  helplineTel: '0800724349',
  address: 'Nairobi, Kenya',
  logoSrc: '/landing/kesmis-exact-logo.png',
  logoSrcWhite: '/landing/kesmis-exact-logo-light.png',
  /** Icon-only mark (no crest / no wordmark) — mobile header & compact UI */
  logoMarkSrc: '/landing/kesmis-mark.svg',
  logoMarkSrcWhite: '/landing/kesmis-mark-white.svg',
  logoMarkPng: '/landing/kesmis-mark.png',
  crestSrc: '/gok.png',
  crestSrcWhite: '/gok-white.png',
  /** Official KISIP programme site */
  kisipUrl: 'https://kisip.go.ke',
  /** KISIP 2 components page (tab anchors: #tab-er4jf-1 … #tab-er4jf-4) */
  kisip2Url: 'https://kisip.go.ke/kisip-2',
  /**
   * SUD / Kenya Slum Upgrading Programme public page under SDHUD
   * (housingandurban.go.ke — no separate SUD domain).
   */
  sudUrl: 'https://housingandurban.go.ke/kenya-slum-upgrading-programme-kensup/',
  /** Default / OG fallback */
  heroImage: '/landing/hero/hero-01-street.webp',
} as const

/** Rotating full-bleed hero backgrounds (compressed WebP, ~1600×900). */
export const HERO_IMAGES = [
  '/landing/hero/hero-01-street.webp',
  '/landing/hero/hero-03-aerial-roads.webp',
  '/landing/hero/hero-06-hillside-sky.webp',
  '/landing/hero/hero-02-hillside.webp',
  '/landing/hero/hero-07-rooftops.webp',
  '/landing/hero/hero-05-settlement-yard.webp',
  '/landing/hero/hero-04-aerial-loop.webp',
] as const

/** Primary nav — path, home section, or authenticated portal destination */
export type NavItem = {
  id: string
  label: string
  /** Router path (public app) */
  to?: string
  /** Scroll target on /landing */
  section?: string
  /**
   * Authenticated admin-app path (e.g. settlement/project explorer).
   * Logged-in users are switched to the full app; others go to login with redirect.
   */
  portalPath?: string
  /** Open in new tab */
  external?: boolean
}

/** Portal explorers (admin app, auth required) */
export const PORTAL_PATHS = {
  settlementExplorer: '/dashboard/map',
  projectExplorer: '/dashboard/prjmap',
  nationalDashboard: '/dashboard/national',
} as const

/** Public landing-app pages (no auth) */
export const PUBLIC_PAGES = {
  settlementExplorer: '/settlements',
  projectExplorer: '/projects',
} as const

export const MAIN_NAV: NavItem[] = [
  { id: 'home', label: 'Home', to: '/landing' },
  { id: 'settlements', label: 'Settlements', to: PUBLIC_PAGES.settlementExplorer },
  { id: 'projects', label: 'Projects', to: PUBLIC_PAGES.projectExplorer },
  { id: 'grievances', label: 'Grievances', to: '/grm' },
  { id: 'data-request', label: 'Data request', to: '/data-request' },
  { id: 'contact', label: 'Contact', to: '/contact' },
]

export const HERO = {
  headline: 'Transforming Informal Settlements and Slums Through Data, Planning and Inclusive Development',
  support:
    'Access settlement information, programme progress, maps, reports and digital services supporting sustainable urban development across Kenya.',
  primaryCta: { label: 'Sign in', action: 'route:/login' },
  secondaryCta: { label: 'Sign up', action: 'route:/register' },
  tertiaryCta: { label: 'File grievance', action: 'route:/grm' },
  searchPlaceholder: 'Search settlements or projects by name…',
  getStarted: 'Get started on KeSMIS today',
} as const

/** Icon row inside the hero panel — mirrors eCitizen quick-service arrangement */
export const HERO_QUICK_LINKS = [
  {
    id: 'settlements',
    label: 'Explore Settlements',
    icon: 'mdi:home-city-outline',
    action: `route:${PUBLIC_PAGES.settlementExplorer}`,
    /** Already in MAIN_NAV / mobile menu */
    hideOnMobile: true,
  },
  {
    id: 'projects',
    label: 'View Projects',
    icon: 'mdi:crane',
    action: `route:${PUBLIC_PAGES.projectExplorer}`,
    hideOnMobile: true,
  },
  {
    id: 'grm',
    label: 'File a Grievance',
    icon: 'mdi:message-alert-outline',
    action: 'route:/grm',
    hideOnMobile: true,
  },
  {
    id: 'data-request',
    label: 'Request Data',
    icon: 'mdi:database-outline',
    action: 'route:/data-request',
    hideOnMobile: true,
  },
  {
    id: 'about',
    label: 'About KeSMIS',
    icon: 'mdi:information-outline',
    action: 'route:/about',
    hideOnMobile: false,
  },
  {
    id: 'contact',
    label: 'Contact Us',
    icon: 'mdi:email-outline',
    action: 'route:/contact',
    hideOnMobile: true,
  },
  {
    id: 'portal',
    label: 'Management Portal',
    icon: 'mdi:monitor-dashboard',
    action: 'route:/login',
    hideOnMobile: true,
  },
  {
    id: 'docs',
    label: 'Documentation',
    icon: 'mdi:book-open-page-variant-outline',
    action: 'route:/docs',
    hideOnMobile: false,
  },
] as const

export type ServiceCard = {
  id: string
  title: string
  description: string
  icon: string
  /** Existing public route, or null if not yet configured */
  to: string | null
  /** Scroll section on landing when to is null but section exists */
  section?: string
  /** Authenticated admin explorer path */
  portalPath?: string
  /** Mark for later route configuration */
  pendingRoute?: boolean
}

export const SERVICE_CARDS: ServiceCard[] = [
  {
    id: 'settlements',
    title: 'Explore Settlements',
    description: 'Open the public settlement explorer map with clustered markers.',
    icon: 'mdi:home-city-outline',
    to: PUBLIC_PAGES.settlementExplorer,
  },
  {
    id: 'projects',
    title: 'View Projects',
    description: 'Open the public project explorer map with clustered markers.',
    icon: 'mdi:crane',
    to: PUBLIC_PAGES.projectExplorer,
  },
  {
    id: 'grm',
    title: 'Submit or Track a Grievance',
    description: 'Use the electronic Grievance Redress Mechanism.',
    icon: 'mdi:message-text-outline',
    to: '/grm',
  },
  {
    id: 'portal',
    title: 'Access the Management Portal',
    description: 'Sign in to dashboards, M&E and administration.',
    icon: 'mdi:monitor-dashboard',
    to: '/login',
    portalPath: PORTAL_PATHS.nationalDashboard,
  },
]

/**
 * Fallback / supplemental stats when API fields are unavailable.
 * Live API provides: settlements, population, projects, counties.
 * householdsReached remains a config placeholder until an endpoint exists.
 */
export const STATS_CONFIG = {
  countiesCovered: {
    label: 'Counties with interventions',
    /** Live via GET /api/public/landing/stats → counties (project_location) */
    value: null as number | null,
    note: 'LIVE_VIA_LANDING_STATS',
  },
  householdsReached: {
    label: 'Households reached',
    /** CONFIG PLACEHOLDER */
    value: null as number | null,
    note: 'CONFIG_PLACEHOLDER',
  },
  reportsAvailable: {
    label: 'Public resources',
    value: null as number | null,
    note: 'CONFIG_PLACEHOLDER',
  },
} as const

/** Two main programmes under SDHUD — featured equally on the landing page. */
export const PROGRAMMES = [
  {
    id: 'kisip',
    title: 'KISIP',
    fullTitle: 'Kenya Informal Settlements Improvement Project',
    category: 'Programme',
    description:
      'World Bank–supported upgrading of informal settlements — tenure security, infrastructure, socio-economic inclusion and institutional capacity under KISIP 2.',
    icon: 'mdi:city-variant-outline',
    to: null as string | null,
    href: INSTITUTION.kisip2Url as string | null,
    section: undefined as string | undefined,
    portalPath: undefined as string | undefined,
    ctaLabel: 'Learn more on KISIP',
  },
  {
    id: 'sud',
    title: 'SUD',
    fullTitle: 'Kenya Slum Upgrading Programme',
    category: 'Programme',
    description:
      'National slum upgrading under the State Department for Housing and Urban Development — secure tenure, housing, infrastructure and livelihood support (KENSUP / SUD).',
    icon: 'mdi:home-city-outline',
    to: null as string | null,
    href: INSTITUTION.sudUrl as string | null,
    section: undefined as string | undefined,
    portalPath: undefined as string | undefined,
    ctaLabel: 'Learn more on SDHUD',
  },
] as const

/** Secondary CTA under the two programme cards. */
export const PROJECT_EXPLORER_CTA = {
  id: 'project-explorer',
  title: 'Project explorer',
  description: 'Browse live intervention project locations across Kenya on an interactive clustered map.',
  ctaLabel: 'Open project explorer',
  to: PUBLIC_PAGES.projectExplorer,
  icon: 'mdi:map-marker-path',
} as const

/**
 * Publications — CONFIG PLACEHOLDER list until a public document API is exposed.
 * Prefer linking to existing /docs for help content.
 */
export const PUBLICATIONS = [
  {
    id: 'docs-help',
    title: 'KeSMIS user documentation',
    category: 'Guidelines',
    date: '2025-01-01',
    fileType: 'Web',
    to: '/docs',
  },
  {
    id: 'data-request',
    title: 'Request settlement or programme data',
    category: 'Data',
    date: '2025-01-01',
    fileType: 'Form',
    to: '/data-request',
  },
  {
    id: 'privacy',
    title: 'Privacy notice',
    category: 'Policy',
    date: '2025-01-01',
    fileType: 'Web',
    to: '/privacy',
  },
  {
    id: 'terms-of-data-use',
    title: 'Terms of data use',
    category: 'Policy',
    date: '2026-08-05',
    fileType: 'Web',
    to: '/terms-of-data-use',
  },
] as const

/**
 * News — CONFIG PLACEHOLDER until a public articles API exists.
 * Authenticated articles live at /media/articles (admin app).
 */
export const NEWS_UPDATES = [
  {
    id: 'n1',
    date: '2025-06-01',
    title: 'KeSMIS supports national settlement upgrading',
    summary:
      'The platform continues to provide settlement registers, maps and grievance services for programme partners and the public.',
    to: '/about',
    image: '/landing/img003.png',
  },
  {
    id: 'n2',
    date: '2025-03-15',
    title: 'Electronic Grievance Redress Mechanism',
    summary:
      'Citizens can submit and follow up grievances related to informal settlement programmes through e-GRM.',
    to: '/grm',
    image: null,
  },
  {
    id: 'n3',
    date: '2025-01-20',
    title: 'Public settlement register',
    summary:
      'Explore profiled informal settlements across Kenya using the public register and map.',
    to: null,
    section: 'settlements',
    image: '/landing/img007.png',
  },
] as const

export const ENGAGEMENT = {
  title: 'Have a concern, grievance, or settlement service issue?',
  body: 'Use the electronic Grievance Redress Mechanism for formal complaints, or report maintenance and service issues in your settlement. Track progress online with your reference code.',
  actions: [
    { label: 'Submit a grievance', to: '/grm', primary: true },
    { label: 'Report community issue', to: '/community-issue', primary: true },
    { label: 'Track community issue', to: '/community-issues', primary: false },
    { label: 'Contact the programme team', to: '/contact', primary: false },
  ],
} as const

export const FOOTER = {
  usefulLinks: [
    { label: 'About KeSMIS', to: '/about' },
    { label: 'FAQs', to: '/faqs' },
    { label: 'Contact', to: '/contact' },
    { label: 'Data request', to: '/data-request' },
  ],
  services: [
    { label: 'Settlement explorer', to: PUBLIC_PAGES.settlementExplorer as string | null, section: undefined as string | undefined, portalPath: undefined as string | undefined },
    { label: 'Project explorer', to: PUBLIC_PAGES.projectExplorer as string | null, section: undefined as string | undefined, portalPath: undefined as string | undefined },
    { label: 'e-GRM', to: '/grm' as string | null, section: undefined as string | undefined, portalPath: undefined as string | undefined },
    { label: 'Report community issue', to: '/community-issue' as string | null, section: undefined as string | undefined, portalPath: undefined as string | undefined },
    { label: 'Management portal', to: '/login' as string | null, section: undefined as string | undefined, portalPath: PORTAL_PATHS.nationalDashboard },
  ],
  publications: [] as { label: string; to: string }[],
  policies: [
    { label: 'Privacy', to: '/privacy' },
    { label: 'Terms of data use', to: '/terms-of-data-use' },
    { label: 'Help', to: '/docs' },
  ],
} as const

export const MAP_SECTION = {
  title: 'Settlements across Kenya',
  body: 'Open the settlement explorer to browse informal settlements on a clustered national map.',
  ctaLabel: 'Open settlement explorer',
  ctaSection: 'settlements',
  href: PUBLIC_PAGES.settlementExplorer,
} as const
