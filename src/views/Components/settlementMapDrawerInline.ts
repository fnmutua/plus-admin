import type { FeatureKind } from './settlementMapDrawer'
import { settlementDetailsMutationAccessForRole, type ProcessedSettlementRole } from '@/utils/roleScope'
import {
  buildFacilitySelectOptions,
  getFacilityMultiselectFields,
  getFacilitySelectFields,
} from './facilityInlineEditConfig'
import {
  buildVulnerabilitySelectFallback,
  CLIMATE_VULN_ATTR_FIELDS,
  coerceSettlementValueForApi,
  formatBoolLabel,
  inlineMultiselectFields,
  inlineNumberFields,
  inlineSelectOptionsBase,
  inlineTextareaFields,
  settlementBooleanFields,
  settlementSelectFields,
  VULNERABILITY_FALLBACK,
} from '@/views/Settlement/settlementInlineEditConfig'

export { buildFacilitySelectOptions, getFacilityMultiselectFields, getFacilitySelectFields }

export { settlementSelectFields }

export type DrawerRecordMeta = {
  id: string | number | null
  county_id: number | null
  featureId?: string
}

export { CLIMATE_VULN_ATTR_FIELDS, buildVulnerabilitySelectFallback, VULNERABILITY_FALLBACK }

export const SETTLEMENT_INLINE_SELECT_OPTIONS = inlineSelectOptionsBase

const READONLY_BY_SECTION: Record<string, Record<string, string[]>> = {
  settlement: {
    Location: ['county', 'subcounty', 'ward'],
    Summary: ['id', 'code', 'pop_density', 'area', 'avg_household_size', 'geom_label'],
    Vulnerability: ['vulnerability_total_score_display', 'vulnerability_rating'],
    Status: ['isApproved', 'isActive', 'createdBy', 'createdAt', 'updatedAt'],
  },
  facility: {
    Location: ['county_name', 'settlement_name', 'settlement_code'],
    Status: ['isApproved'],
    General: ['id'],
  },
  parcel: {
    Parcel: ['id', 'landuse_id'],
  },
}

const DRAWER_GLOBAL_READONLY = ['id', 'code']

const FACILITY_GLOBAL_READONLY = [
  ...DRAWER_GLOBAL_READONLY,
  'isApproved',
  'county_name',
  'settlement_name',
  'settlement_code',
]

export function getDrawerReadonlyFields(
  kind: FeatureKind,
  sectionTitle: string
): string[] {
  const sectionReadonly = READONLY_BY_SECTION[kind]?.[sectionTitle] || []
  if (kind === 'facility') {
    return [...new Set([...sectionReadonly, ...FACILITY_GLOBAL_READONLY])]
  }
  if (kind === 'settlement' || kind === 'parcel' || kind === 'generic') {
    return [...new Set([...sectionReadonly, ...DRAWER_GLOBAL_READONLY])]
  }
  return sectionReadonly
}

export function mergeDrawerFieldTypes(
  kind: FeatureKind,
  featureType: string | undefined,
  collected: { numberFields: string[]; booleanFields: string[]; textareaFields: string[] }
): {
  numberFields: string[]
  booleanFields: string[]
  textareaFields: string[]
  multiselectFields: string[]
} {
  if (kind === 'settlement') {
    const selectFieldSet = new Set<string>(settlementSelectFields)
    const multiselectSet = new Set(inlineMultiselectFields)
    const isSelectField = (field: string) => selectFieldSet.has(field)

    return {
      numberFields: [
        ...new Set([
          ...collected.numberFields,
          ...inlineNumberFields,
        ]),
      ].filter((field) => !isSelectField(field)),
      booleanFields: [
        ...new Set([...collected.booleanFields, ...settlementBooleanFields]),
      ].filter((field) => !isSelectField(field)),
      textareaFields: [
        ...new Set([
          ...collected.textareaFields.filter((field) => !multiselectSet.has(field)),
          ...inlineTextareaFields,
        ]),
      ].filter((field) => !isSelectField(field)),
      multiselectFields: inlineMultiselectFields,
    }
  }

  if (kind === 'facility' && featureType) {
    const selectFieldSet = new Set(getFacilitySelectFields(featureType))
    const multiselectFields = getFacilityMultiselectFields(featureType)
    const multiselectSet = new Set(multiselectFields)
    const isSelectField = (field: string) => selectFieldSet.has(field)

    return {
      numberFields: collected.numberFields.filter((field) => !isSelectField(field)),
      booleanFields: collected.booleanFields.filter((field) => !isSelectField(field)),
      textareaFields: collected.textareaFields.filter(
        (field) => !multiselectSet.has(field) && !isSelectField(field)
      ),
      multiselectFields,
    }
  }

  return {
    ...collected,
    multiselectFields: [],
  }
}

export function hasFacilityUpdatePermission(
  featureType: string,
  permissions: string[] = []
): boolean {
  if (permissions.includes('*.*.*')) return true
  return permissions.includes(`${featureType}:update`)
}

export function canEditDrawerRecord(
  kind: FeatureKind,
  featureType: string,
  meta: DrawerRecordMeta,
  options: {
    isSuperAdmin: boolean
    permissions: string[]
    processedRoles: ProcessedSettlementRole[]
  }
): boolean {
  if (kind === 'neighbor' || kind === 'generic') return false
  if (kind === 'parcel') return false

  if (kind === 'settlement') {
    if (options.isSuperAdmin) return true
    const settlement = { id: meta.id, county_id: meta.county_id }
    return options.processedRoles.some((role) =>
      settlementDetailsMutationAccessForRole(settlement, role)
    )
  }

  if (kind === 'facility' && featureType) {
    return hasFacilityUpdatePermission(featureType, options.permissions)
  }

  return false
}

const SETTLEMENT_BOOLEAN_FIELD_SET = new Set(settlementBooleanFields)

export function coerceDrawerValueForApi(
  kind: FeatureKind,
  field: string,
  value: unknown
): unknown {
  if (kind === 'settlement') {
    return coerceSettlementValueForApi(field, value)
  }

  if (typeof value === 'boolean') return value
  if (value === 'Yes' || value === 'true' || value === 1 || value === '1') return true
  if (value === 'No' || value === 'false' || value === 0 || value === '0') return false
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  const num = Number(String(value).replace(/,/g, '').trim())
  const looksNumeric =
    field.endsWith('_count') ||
    field.includes('distance') ||
    field.includes('length') ||
    field.includes('size') ||
    field.includes('fees') ||
    field.includes('beds') ||
    field.includes('visits') ||
    field.includes('referral') ||
    field === 'area' ||
    field === 'area_ha' ||
    field === 'population' ||
    field === 'pop_male' ||
    field === 'pop_female' ||
    field === 'num_households'
  if (Number.isFinite(num) && looksNumeric) {
    return num
  }

  if (value === '\u2014') return null
  if (value === '') return null
  return value
}

export function parseNumberish(value: unknown): number | null {
  if (value === null || value === undefined || value === '' || value === '\u2014') return null
  const n =
    typeof value === 'number'
      ? value
      : Number(String(value).replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : null
}

export function computePopulationDensity(population: unknown, areaHa: unknown): number | null {
  const pop = parseNumberish(population)
  const area = parseNumberish(areaHa)
  if (pop === null || area === null || area <= 0) return null
  const areaSqKm = area / 100
  const density = pop / areaSqKm
  return Number.isFinite(density) ? Math.round(density) : null
}

export function computeAvgHouseholdSize(
  population: unknown,
  numHouseholds: unknown
): number | null {
  const pop = parseNumberish(population)
  const hh = parseNumberish(numHouseholds)
  if (pop === null || hh === null || hh <= 0) return null
  const size = pop / hh
  return Number.isFinite(size) ? Math.round(size * 10) / 10 : null
}

export function displayValueAfterSave(field: string, apiValue: unknown, kind: FeatureKind): unknown {
  if (kind === 'settlement' && SETTLEMENT_BOOLEAN_FIELD_SET.has(field)) {
    return formatBoolLabel(apiValue)
  }
  if (apiValue === null || apiValue === undefined || apiValue === '') return '\u2014'
  return apiValue
}

function formatVulnerabilityRatingDisplay(rating: unknown): string {
  if (rating == null || rating === '' || rating === '\u2014') return '\u2014'
  return String(rating).toUpperCase()
}

/** Align drawer settlement record with SettlementDetails derived + vulnerability display fields. */
export function enrichSettlementDrawerRecordData(
  data: Record<string, unknown>,
  properties: Record<string, unknown> = {}
): Record<string, unknown> {
  const population = data.population ?? properties.population
  const area = data.area ?? properties.area
  const numHouseholds = data.num_households ?? properties.num_households

  const computedDensity = computePopulationDensity(population, area)
  if (computedDensity != null) {
    data.pop_density = String(computedDensity)
  } else if (data.pop_density == null || data.pop_density === '') {
    const stored = properties.pop_density
    data.pop_density = stored == null || stored === '' ? '\u2014' : String(stored)
  }

  const computedAvgHh = computeAvgHouseholdSize(population, numHouseholds)
  if (computedAvgHh != null) {
    data.avg_household_size = String(computedAvgHh)
  } else if (data.avg_household_size == null || data.avg_household_size === '') {
    const stored = properties.avg_household_size
    data.avg_household_size = stored == null || stored === '' ? '\u2014' : String(stored)
  }

  const vulnScore =
    properties.vulnerability_total_score ??
    (data.vulnerability_total_score_display != null &&
    data.vulnerability_total_score_display !== '\u2014'
      ? data.vulnerability_total_score_display
      : null)
  data.vulnerability_total_score_display =
    vulnScore != null && vulnScore !== '' ? String(vulnScore) : '\u2014'

  const vulnRating = properties.vulnerability_rating ?? data.vulnerability_rating
  data.vulnerability_rating = formatVulnerabilityRatingDisplay(vulnRating)

  return data
}

function vulnerabilityRatingTone(rating: unknown): 'danger' | 'warning' | 'success' {
  const r = String(rating ?? '').toUpperCase()
  if (r === 'HIGH') return 'danger'
  if (r === 'MEDIUM') return 'warning'
  return 'success'
}

/** Climate score/rating tone classes (matches SettlementDetails Profile tab). */
export function getDrawerClimateVulnCellTextClass(
  field: string,
  data: Record<string, unknown>
): string {
  if (field !== 'vulnerability_rating' && field !== 'vulnerability_total_score_display') {
    return ''
  }
  const r = data.vulnerability_rating
  if (r == null || r === '' || r === '\u2014') return 'inline-cell__text--climate-neutral'
  const tone = vulnerabilityRatingTone(r)
  if (tone === 'danger') return 'inline-cell__text--climate-high'
  if (tone === 'warning') return 'inline-cell__text--climate-medium'
  return 'inline-cell__text--climate-low'
}
