export type FilterId = string | number

export interface LocationFilterIds {
  countyIds: FilterId[]
  subcountyIds: FilterId[]
  wardIds: FilterId[]
}

export interface SettlementToolbarState {
  v: 2
  location: LocationFilterIds
  search: string
  /** ISO date pair when user explicitly applied a create-date filter; otherwise null. */
  dateRange: [string, string] | null
  dateFilterActive?: boolean
  page: number
  pageSize: number
  activeSegment: string
}

export interface LocationOptionSets {
  countyIds: Set<FilterId>
  subcountyIds: Set<FilterId>
  wardIds: Set<FilterId>
}

export const SETTLEMENT_TOOLBAR_STORAGE_KEY = 'settlementFilters'

export const emptyLocationFilters = (): LocationFilterIds => ({
  countyIds: [],
  subcountyIds: [],
  wardIds: [],
})

export const cloneLocationFilters = (location: LocationFilterIds): LocationFilterIds => ({
  countyIds: [...location.countyIds],
  subcountyIds: [...location.subcountyIds],
  wardIds: [...location.wardIds],
})

const isMeaningfulFilterId = (id: unknown): id is FilterId =>
  id !== null && id !== undefined && id !== ''

/** Normalize any stored / UI value into a clean id array. */
export const toIdArray = (value: unknown): FilterId[] => {
  if (Array.isArray(value)) return value.filter(isMeaningfulFilterId)
  if (isMeaningfulFilterId(value)) return [value]
  return []
}

/** Enforce hierarchy: no county → no subcounty/ward; no subcounty → no ward. */
export const normalizeLocationFilters = (
  location: LocationFilterIds,
  options?: { isCountyStaff?: boolean },
): void => {
  location.countyIds = toIdArray(location.countyIds)
  location.subcountyIds = toIdArray(location.subcountyIds)
  location.wardIds = toIdArray(location.wardIds)

  if (!options?.isCountyStaff && location.countyIds.length === 0) {
    location.subcountyIds = []
    location.wardIds = []
  }
  if (location.subcountyIds.length === 0) {
    location.wardIds = []
  }
}

export const resolveCountyIdsForStaff = (
  savedCountyIds: unknown,
  assignedCountyRoleIds: FilterId[],
): FilterId[] => {
  if (!assignedCountyRoleIds.length) return toIdArray(savedCountyIds)
  const valid = toIdArray(savedCountyIds).filter((id) => assignedCountyRoleIds.includes(id))
  return valid.length > 0 ? valid : [...assignedCountyRoleIds]
}

const sameIds = (a: FilterId[], b: FilterId[]) =>
  a.length === b.length && a.every((id, index) => id === b[index])

/** Remove ids that are not present in loaded option lists (stale localStorage). */
export const pruneLocationFilters = (
  location: LocationFilterIds,
  options: LocationOptionSets,
): boolean => {
  normalizeLocationFilters(location)

  let changed = false

  if (options.countyIds.size > 0) {
    const prunedCounty = location.countyIds.filter((id) => options.countyIds.has(id))
    if (!sameIds(prunedCounty, location.countyIds)) {
      location.countyIds = prunedCounty
      changed = true
    }
  }

  if (location.countyIds.length > 0 && options.subcountyIds.size > 0) {
    const prunedSub = location.subcountyIds.filter((id) => options.subcountyIds.has(id))
    if (!sameIds(prunedSub, location.subcountyIds)) {
      location.subcountyIds = prunedSub
      changed = true
    }
  }

  if (location.subcountyIds.length > 0 && options.wardIds.size > 0) {
    const prunedWard = location.wardIds.filter((id) => options.wardIds.has(id))
    if (!sameIds(prunedWard, location.wardIds)) {
      location.wardIds = prunedWard
      changed = true
    }
  }

  if (changed) {
    normalizeLocationFilters(location)
  }
  return changed
}

const upsertQueryFilter = (
  filters: string[],
  filterValues: unknown[][],
  field: string,
  value: FilterId[],
) => {
  const index = filters.indexOf(field)
  if (index === -1) {
    filters.push(field)
    filterValues.push(value)
    return
  }
  filterValues[index] = value
}

/** Apply toolbar location ids onto API filter arrays. */
export const applyLocationFiltersToQuery = (
  filters: string[],
  filterValues: unknown[][],
  location: LocationFilterIds,
) => {
  const countyIds = toIdArray(location.countyIds)
  const subcountyIds = toIdArray(location.subcountyIds)
  const wardIds = toIdArray(location.wardIds)

  if (countyIds.length > 0) upsertQueryFilter(filters, filterValues, 'county_id', countyIds)
  if (subcountyIds.length > 0) upsertQueryFilter(filters, filterValues, 'subcounty_id', subcountyIds)
  if (wardIds.length > 0) upsertQueryFilter(filters, filterValues, 'ward_id', wardIds)
}

/** Merge location ids into summary-style filter bundles. */
export const appendLocationFiltersToSummary = (
  filterFields: string[],
  filterValues: unknown[][],
  filterOperators: string[],
  location: LocationFilterIds,
) => {
  const entries: Array<[string, FilterId[]]> = [
    ['county_id', toIdArray(location.countyIds)],
    ['subcounty_id', toIdArray(location.subcountyIds)],
    ['ward_id', toIdArray(location.wardIds)],
  ]

  entries.forEach(([field, ids]) => {
    if (!ids.length) return
    const existingIndex = filterFields.indexOf(field)
    if (existingIndex === -1) {
      filterFields.push(field)
      filterValues.push(ids)
      filterOperators.push('in')
      return
    }
    const existingValue = filterValues[existingIndex]
    const merged = Array.isArray(existingValue)
      ? [...new Set([...existingValue, ...ids])]
      : ids
    filterValues[existingIndex] = merged
  })
}

const coerceLegacyLocation = (raw: Record<string, unknown>): LocationFilterIds => {
  const legacyLocation = raw.location as Partial<LocationFilterIds> | undefined
  return {
    countyIds: toIdArray(legacyLocation?.countyIds ?? raw.selectedCounty ?? raw.value4),
    subcountyIds: toIdArray(legacyLocation?.subcountyIds ?? raw.selectedSubCounty ?? raw.value5),
    wardIds: toIdArray(legacyLocation?.wardIds ?? raw.selectedWard ?? raw.value6),
  }
}

export const parseSettlementToolbarState = (
  raw: unknown,
): SettlementToolbarState | null => {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>

  const location = coerceLegacyLocation(record)
  const search = typeof record.search === 'string'
    ? record.search.trim()
    : typeof record.search_string === 'string'
      ? record.search_string.trim()
      : ''

  let dateRange: [string, string] | null = null
  let dateFilterActive = false
  if (typeof record.dateFilterActive === 'boolean') {
    dateFilterActive = record.dateFilterActive
    if (dateFilterActive && record.dateRange === null) {
      dateRange = null
    } else if (dateFilterActive && Array.isArray(record.dateRange) && record.dateRange.length === 2) {
      const start = record.dateRange[0]
      const end = record.dateRange[1]
      if (start && end) dateRange = [String(start), String(end)]
    }
  } else if (record.dateRange === null) {
    dateRange = null
  } else if (Array.isArray(record.dateRange) && record.dateRange.length === 2) {
    // Legacy saves may contain auto-applied default windows — ignore unless explicitly flagged.
    dateRange = null
    dateFilterActive = false
  } else if (!Object.prototype.hasOwnProperty.call(record, 'dateRange')) {
    dateRange = null
  }

  const page = typeof record.page === 'number' && record.page > 0 ? record.page : 1
  const pageSize = typeof record.pageSize === 'number' && record.pageSize > 0 ? record.pageSize : 10
  const activeSegment = typeof record.activeSegment === 'string' ? record.activeSegment : 'Approved'

  return {
    v: 2,
    location,
    search,
    dateRange,
    dateFilterActive,
    page,
    pageSize,
    activeSegment: activeSegment === 'Duplicates' ? 'Approved' : activeSegment,
  }
}

export const readSettlementToolbarState = (): SettlementToolbarState | null => {
  if (typeof localStorage === 'undefined') return null
  const saved = localStorage.getItem(SETTLEMENT_TOOLBAR_STORAGE_KEY)
  if (!saved) return null
  try {
    return parseSettlementToolbarState(JSON.parse(saved))
  } catch {
    localStorage.removeItem(SETTLEMENT_TOOLBAR_STORAGE_KEY)
    return null
  }
}

export const writeSettlementToolbarState = (state: SettlementToolbarState): void => {
  if (typeof localStorage === 'undefined') return
  const payload: SettlementToolbarState = {
    v: 2,
    location: {
      countyIds: toIdArray(state.location.countyIds),
      subcountyIds: toIdArray(state.location.subcountyIds),
      wardIds: toIdArray(state.location.wardIds),
    },
    search: (state.search || '').trim(),
    dateRange: state.dateRange,
    dateFilterActive: state.dateFilterActive ?? state.dateRange !== null,
    page: state.page,
    pageSize: state.pageSize,
    activeSegment: state.activeSegment,
  }
  localStorage.setItem(SETTLEMENT_TOOLBAR_STORAGE_KEY, JSON.stringify(payload))
}

export const clearSettlementToolbarStorage = (): void => {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(SETTLEMENT_TOOLBAR_STORAGE_KEY)
}

export const isLegacyToolbarPayload = (raw: Record<string, unknown>): boolean =>
  Object.prototype.hasOwnProperty.call(raw, 'filters') ||
  Object.prototype.hasOwnProperty.call(raw, 'filterValues') ||
  Object.prototype.hasOwnProperty.call(raw, 'selectedCounty') ||
  Object.prototype.hasOwnProperty.call(raw, 'value4')
