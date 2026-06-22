import { ref } from 'vue'
import { getListWithoutGeo } from '@/api/counties'
import { getSubcountiesList, getWardsList } from '@/api/settlements-optimized'

export type LocationOption = {
  value: number | string
  label: string
  county_id?: number | string
  subcounty_id?: number | string
  avg_household_size?: number | null
}

export type CountyRecord = {
  id: number | string
  name: string
  pop_male?: number
  pop_female?: number
  pop_total?: number
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const FETCH_TIMEOUT_MS = 15000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out — please retry`)), ms)
    })
  ])
}

function readCache<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.ts || Date.now() - parsed.ts > CACHE_TTL_MS) {
      sessionStorage.removeItem(key)
      return null
    }
    return parsed.data as T
  } catch {
    return null
  }
}

function writeCache(key: string, data: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }))
  } catch {
    // ignore quota errors
  }
}

function normalizeCountyId(countyId: number | string): number | string {
  const parsed = parseInt(String(countyId), 10)
  return Number.isFinite(parsed) ? parsed : countyId
}

function wardCacheKey(countyId: number | string): string {
  return `settlement-locations:wards:${normalizeCountyId(countyId)}`
}

function mapWardRows(rows: any[]): LocationOption[] {
  return (rows || []).map((item: any) => ({
    value: item.id,
    label: item.name,
    county_id: item.county_id,
    subcounty_id: item.subcounty_id,
    avg_household_size: item.avg_household_size ?? null
  }))
}

function extractRows(res: any): any[] {
  if (Array.isArray(res?.data)) return res.data
  if (Array.isArray(res)) return res
  return []
}

export function useSettlementLocation() {
  const countyOptions = ref<LocationOption[]>([])
  const countyRefList = ref<CountyRecord[]>([])
  const subcountyOptions = ref<LocationOption[]>([])

  const countiesLoading = ref(false)
  const countiesError = ref<string | null>(null)
  const wardsLoading = ref(false)
  const wardsError = ref<string | null>(null)

  let activeWardLoadId = 0

  async function loadCounties(force = false) {
    if (!force && countyOptions.value.length) return

    const cacheKey = 'settlement-locations:counties'
    if (!force) {
      const cached = readCache<{ counties: LocationOption[]; records: CountyRecord[] }>(cacheKey)
      if (cached) {
        countyOptions.value = cached.counties
        countyRefList.value = cached.records
        return
      }
    }

    countiesLoading.value = true
    countiesError.value = null
    try {
      const res = await withTimeout(
        getListWithoutGeo({
          params: {
            pageIndex: 1,
            limit: 100,
            curUser: 1,
            model: 'county',
            searchField: 'name',
            searchKeyword: '',
            sort: 'ASC'
          }
        }),
        FETCH_TIMEOUT_MS,
        'County list'
      )

      const ret = res.data || []
      countyRefList.value = ret
      countyOptions.value = ret.map((item: CountyRecord) => ({
        value: item.id,
        label: item.name
      }))
      writeCache(cacheKey, { counties: countyOptions.value, records: countyRefList.value })
    } catch (err: any) {
      countiesError.value = err?.message || 'Failed to load counties'
      throw err
    } finally {
      countiesLoading.value = false
    }
  }

  async function loadSubcounties(force = false) {
    if (!force && subcountyOptions.value.length) return

    const cacheKey = 'settlement-locations:subcounties'
    if (!force) {
      const cached = readCache<LocationOption[]>(cacheKey)
      if (cached) {
        subcountyOptions.value = cached
        return
      }
    }

    try {
      const res = await withTimeout(
        getListWithoutGeo({
          params: {
            pageIndex: 1,
            limit: 500,
            curUser: 1,
            model: 'subcounty',
            searchField: 'name',
            searchKeyword: '',
            sort: 'ASC'
          }
        }),
        FETCH_TIMEOUT_MS,
        'Subcounty list'
      )

      const ret = res.data || []
      subcountyOptions.value = ret.map((item: any) => ({
        value: item.id,
        label: item.name,
        county_id: item.county_id
      }))
      writeCache(cacheKey, subcountyOptions.value)
    } catch {
      // non-blocking — subcounty name is optional in UI
    }
  }

  function peekWardsCache(countyId: number | string): LocationOption[] {
    if (!countyId) return []
    return readCache<LocationOption[]>(wardCacheKey(countyId)) || []
  }

  async function fetchWardsFromApi(countyId: number | string): Promise<LocationOption[]> {
    const res = await withTimeout(
      getWardsList({
        params: { county_id: normalizeCountyId(countyId) },
        silent: true
      } as any),
      FETCH_TIMEOUT_MS,
      'Ward list'
    )
    return mapWardRows(extractRows(res))
  }

  async function loadWardsForCounty(countyId: number | string, force = false): Promise<LocationOption[]> {
    if (!countyId) return []

    const loadId = ++activeWardLoadId
    const cacheKey = wardCacheKey(countyId)

    if (!force) {
      const cached = readCache<LocationOption[]>(cacheKey)
      if (cached?.length) {
        void (async () => {
          try {
            const fresh = await fetchWardsFromApi(countyId)
            writeCache(cacheKey, fresh)
          } catch {
            // keep cached wards
          }
        })()
        return cached
      }
    }

    wardsLoading.value = true
    wardsError.value = null
    try {
      const wards = await fetchWardsFromApi(countyId)
      if (loadId !== activeWardLoadId) {
        return wards
      }
      writeCache(cacheKey, wards)
      return wards
    } catch (err: any) {
      if (loadId === activeWardLoadId) {
        wardsError.value = err?.message || 'Failed to load wards'
      }
      throw err
    } finally {
      if (loadId === activeWardLoadId) {
        wardsLoading.value = false
      }
    }
  }

  async function loadSubcountiesForCounty(countyId: number | string) {
    if (!countyId) return
    try {
      const res = await withTimeout(
        getSubcountiesList({ params: { county_id: normalizeCountyId(countyId) } }),
        FETCH_TIMEOUT_MS,
        'Subcounty list'
      )
      const rows = extractRows(res).map((item: any) => ({
        value: item.id,
        label: item.name,
        county_id: item.county_id
      }))
      if (rows.length) {
        const merged = new Map(subcountyOptions.value.map((s) => [String(s.value), s]))
        rows.forEach((row) => merged.set(String(row.value), row))
        subcountyOptions.value = Array.from(merged.values())
      }
    } catch {
      // optional enrichment
    }
  }

  return {
    countyOptions,
    countyRefList,
    subcountyOptions,
    countiesLoading,
    countiesError,
    wardsLoading,
    wardsError,
    loadCounties,
    loadSubcounties,
    loadWardsForCounty,
    peekWardsCache,
    loadSubcountiesForCounty
  }
}
