/** SUD Regional Tracker regions (SUMMARY sheet + common sheet tab aliases). */

export type ProjectRegionOption = { label: string; value: string }

/** Primary region order used on the SUMMARY sheet. */
export const CANONICAL_REGION_ORDER = [
  'Central',
  'Coast & North Eastern',
  'Eastern',
  'Metropolitan',
  'Nairobi',
  'Nyanza',
  'Rift Valley - North',
  'Rift Valley - South',
  'West Rift Valley',
  'Western',
] as const

export type CanonicalRegion = (typeof CANONICAL_REGION_ORDER)[number]

export const PROJECT_REGION_OPTIONS: ProjectRegionOption[] = [
  { label: 'Central', value: 'Central' },
  { label: 'Coast & North Eastern', value: 'Coast & North Eastern' },
  { label: 'Eastern', value: 'Eastern' },
  { label: 'Metropolitan', value: 'Metropolitan' },
  { label: 'Nairobi', value: 'Nairobi' },
  { label: 'Nyanza', value: 'Nyanza' },
  { label: 'Rift Valley - North', value: 'Rift Valley - North' },
  { label: 'Rift Valley - South', value: 'Rift Valley - South' },
  { label: 'West Rift Valley', value: 'West Rift Valley' },
  { label: 'Western', value: 'Western' },
  { label: 'S.RIFT (South Rift)', value: 'S.RIFT' },
  { label: 'N.RIFT (North Rift)', value: 'N.RIFT' },
  { label: 'NAIROBI METRO', value: 'NAIROBI METRO' },
  { label: 'COAST & N.EASTERN', value: 'COAST & N.EASTERN' },
  { label: 'WEST RIFT', value: 'WEST RIFT' },
]

const REGION_ALIAS_TO_CANONICAL: Record<string, CanonicalRegion | string> = {
  central: 'Central',
  'coast and north eastern': 'Coast & North Eastern',
  'coast and n eastern': 'Coast & North Eastern',
  eastern: 'Eastern',
  metropolitan: 'Metropolitan',
  'nairobi metro': 'Metropolitan',
  nairobi: 'Nairobi',
  nyanza: 'Nyanza',
  'rift valley north': 'Rift Valley - North',
  'rift valley - north': 'Rift Valley - North',
  'n rift': 'Rift Valley - North',
  nrift: 'Rift Valley - North',
  'rift valley south': 'Rift Valley - South',
  'rift valley - south': 'Rift Valley - South',
  's rift': 'Rift Valley - South',
  srift: 'Rift Valley - South',
  'south rift': 'Rift Valley - South',
  'south rift region': 'Rift Valley - South',
  'west rift valley': 'West Rift Valley',
  'west rift': 'West Rift Valley',
  western: 'Western',
}

const COUNTY_TO_REGION: Record<string, CanonicalRegion> = {
  laikipia: 'Central',
  muranga: 'Central',
  nyandarua: 'Central',
  nyeri: 'Central',
  kirinyaga: 'Central',
  garissa: 'Coast & North Eastern',
  kilifi: 'Coast & North Eastern',
  kwale: 'Coast & North Eastern',
  lamu: 'Coast & North Eastern',
  mandera: 'Coast & North Eastern',
  marsabit: 'Coast & North Eastern',
  mombasa: 'Coast & North Eastern',
  'taita taveta': 'Coast & North Eastern',
  'tana river': 'Coast & North Eastern',
  wajir: 'Coast & North Eastern',
  embu: 'Eastern',
  isiolo: 'Eastern',
  kitui: 'Eastern',
  makueni: 'Eastern',
  meru: 'Eastern',
  'tharaka nithi': 'Eastern',
  kajiado: 'Metropolitan',
  machakos: 'Metropolitan',
  kiambu: 'Metropolitan',
  nairobi: 'Nairobi',
  'homa bay': 'Nyanza',
  homabay: 'Nyanza',
  kisumu: 'Nyanza',
  migori: 'Nyanza',
  siaya: 'Nyanza',
  'elgeyo marakwet': 'Rift Valley - North',
  nandi: 'Rift Valley - North',
  'trans nzoia': 'Rift Valley - North',
  'uasin gishu': 'Rift Valley - North',
  turkana: 'Rift Valley - North',
  'west pokot': 'Rift Valley - North',
  samburu: 'Rift Valley - North',
  baringo: 'Rift Valley - South',
  bomet: 'Rift Valley - South',
  kericho: 'Rift Valley - South',
  nakuru: 'Rift Valley - South',
  narok: 'Rift Valley - South',
  kisii: 'West Rift Valley',
  nyamira: 'West Rift Valley',
  bungoma: 'Western',
  busia: 'Western',
  kakamega: 'Western',
  vihiga: 'Western',
}

export const REGION_SHEET_NAMES: Record<string, string> = {
  Central: 'CENTRAL',
  'Coast & North Eastern': 'COAST & N.EASTERN',
  Eastern: 'EASTERN',
  Metropolitan: 'NAIROBI METRO',
  Nairobi: 'NAIROBI',
  Nyanza: 'NYANZA',
  'Rift Valley - North': 'N.RIFT',
  'Rift Valley - South': 'S.RIFT',
  'West Rift Valley': 'WEST RIFT',
  Western: 'WESTERN',
}

export const S_RIFT_COUNTY_NAMES = ['Baringo', 'Bomet', 'Kericho', 'Nakuru', 'Narok'] as const

const S_RIFT_COUNTY_KEYS = new Set(
  S_RIFT_COUNTY_NAMES.map((n) => normalizeCountyKey(n)),
)

function normalizeCountyKey(name: unknown): string {
  return String(name || '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isSouthRiftCounty(name: unknown): boolean {
  return S_RIFT_COUNTY_KEYS.has(normalizeCountyKey(name))
}

export function inferRegionFromCounty(countyName: unknown): CanonicalRegion | null {
  const region = COUNTY_TO_REGION[normalizeCountyKey(countyName)]
  return region || null
}

export function normalizeRegionKey(value: unknown): string {
  return String(value || '')
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/&/g, 'and')
    .replace(/['’`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function resolveCanonicalRegion(value: unknown): string | null {
  const raw = String(value || '').trim()
  if (!raw) return null

  const key = normalizeRegionKey(raw)
  const alias = REGION_ALIAS_TO_CANONICAL[key]
  if (alias) return alias

  for (const region of CANONICAL_REGION_ORDER) {
    if (normalizeRegionKey(region) === key) return region
  }

  return raw
}

export function isSouthRiftRegion(value: unknown): boolean {
  return resolveCanonicalRegion(value) === 'Rift Valley - South'
}

export function regionToSheetName(region: string): string {
  const canonical = resolveCanonicalRegion(region) || region
  if (REGION_SHEET_NAMES[canonical]) return REGION_SHEET_NAMES[canonical]
  return canonical.slice(0, 31).replace(/[\\/*?:\[\]]/g, ' ')
}

export function regionToSheetTitle(region: string): string {
  const canonical = resolveCanonicalRegion(region) || region
  if (canonical === 'Rift Valley - South') return 'SOUTH RIFT REGION'
  if (canonical === 'Rift Valley - North') return 'NORTH RIFT REGION'
  return `${canonical.toUpperCase()} REGION`
}

/** @deprecated use regionToSheetTitle */
export function resolveRegionSheetTitle(value: unknown): string {
  const region = resolveCanonicalRegion(value)
  if (!region) return ''
  return regionToSheetTitle(region)
}
