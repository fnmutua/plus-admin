<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  ElCard,
  ElButton,
  ElSkeleton,
  ElMessage,
  ElRadioGroup,
  ElRadioButton,
  ElSelect,
  ElOption,
  ElTable,
  ElTableColumn,
  ElTooltip,
  ElPagination,
  ElTreeSelect,
  ElCheckbox,
} from 'element-plus'
import { Icon } from '@/components/Icon'
import { useAppStoreWithOut } from '@/store/modules/app'
import {
  getProgrammesList,
  getComponentsList,
  getOptimizedProjectLocations,
} from '@/api/project-locations-optimized'
import { getCountiesList, getSubcountiesList, getWardsList } from '@/api/settlements-optimized'
import { getSettlementListByCounty, getAllGeo } from '@/api/settlements'
import { getProgrammeDescendantIds, type ProgrammeRecord } from '@/utils/programmeValidation'
// `v-chart` is registered globally in plugins/setupCharts.ts
import { registerMap } from 'echarts/core'
import { ensureDashboardGeoBundleLoaded, subsetGeoFromCache, applyGeoAspect } from '@/utils/dashboardGeo'
import { geoCache } from '@/utils/dashboardCache'
// Browser-safe writer (same one DownloadCustom.vue uses); json-as-xlsx routes
// through Node's fs and throws once bundled for the browser.
import writeXlsxFile from 'write-excel-file'

const appStore = useAppStoreWithOut()
const isMobile = computed(() => appStore.getMobile)

const loading = ref(true)
const downloading = ref(false)

const programmes = ref<ProgrammeRecord[]>([])
const components = ref<any[]>([])
const projects = ref<any[]>([])
const projectLocations = ref<any[]>([])

// ---- Chart: stack dimension + cascading location filter ----
const stackDimension = ref<'programme' | 'component' | 'status' | 'scope'>('programme')
const viewMode = ref<'chart' | 'table' | 'map'>('chart')
const showChartTable = computed(() => viewMode.value === 'table')

// Programme filter — a parent programme includes its sub-programmes
const selectedProgramme = ref<number | null>(null)

const programmeTreeData = computed(() => {
  const roots = programmes.value.filter((p) => p.parentId == null || p.parentId === '')
  const childrenOf = (parentId: number) =>
    programmes.value
      .filter((p) => String(p.parentId) === String(parentId))
      .map((p) => ({
        value: Number(p.id),
        label: String(p.title || p.acronym || p.id),
      }))

  return roots.map((root) => ({
    value: Number(root.id),
    label: String(root.title || root.acronym || root.id),
    children: childrenOf(Number(root.id)),
  }))
})

// Component ids belonging to the selected programme (or any of its descendants)
const allowedComponentIds = computed<Set<number> | null>(() => {
  if (selectedProgramme.value == null) return null
  const scope = new Set<number>([selectedProgramme.value])
  getProgrammeDescendantIds(selectedProgramme.value, programmes.value).forEach((id) =>
    scope.add(id)
  )
  return new Set(
    components.value
      .filter((c) => scope.has(Number(c.programme_id)))
      .map((c) => Number(c.id))
  )
})

const counties = ref<any[]>([])
const subcounties = ref<any[]>([])
const wards = ref<any[]>([])
const selectedCounty = ref<number | null>(null)
const selectedSubcounty = ref<number | null>(null)
const selectedWard = ref<number | null>(null)

const loadData = async () => {
  loading.value = true
  try {
    const progRes = await getProgrammesList({ params: {} } as any)
    programmes.value = Array.isArray((progRes as any)?.data) ? (progRes as any).data : []

    const programmeIds = programmes.value
      .map((p) => p.id)
      .filter((id) => id != null)
      .join(',')
    const compRes = programmeIds
      ? await getComponentsList({ params: { programme_ids: programmeIds } } as any)
      : ({ data: [] } as any)
    components.value = Array.isArray((compRes as any)?.data) ? (compRes as any).data : []

    // Projects carry their activities (belongsToMany through project_activity), so
    // one request feeds both the counts and the export.
    const projRes = await getSettlementListByCounty({
      model: 'project',
      searchField: 'title',
      searchKeyword: '',
      filters: [],
      filterValues: [],
      associated_multiple_models: ['activity'],
      returnAll: true,
      fields: [
        'id',
        'title',
        'project_code',
        'component_id',
        'status',
        'implementation_scope',
        'start_date',
        'end_date',
        'cost',
      ],
      excludeGeom: true,
    } as any)
    projects.value = Array.isArray((projRes as any)?.data) ? (projRes as any).data : []

    // One row per project location, with the owning project's component/status —
    // feeds the chart for every stack dimension without refetching on switch.
    const locRes = await getSettlementListByCounty({
      model: 'project_location',
      searchField: 'location_name',
      searchKeyword: '',
      filters: [],
      filterValues: [],
      associated_multiple_models: ['project'],
      returnAll: true,
      excludeGeom: true,
      excludeGeomAssoc: true,
      fields: ['id', 'project_id', 'county_id', 'subcounty_id', 'ward_id', 'settlement_id', 'location_type'],
    } as any)
    projectLocations.value = Array.isArray((locRes as any)?.data) ? (locRes as any).data : []

    const countyRes = await getCountiesList({ params: {} } as any)
    counties.value = Array.isArray((countyRes as any)?.data) ? (countyRes as any).data : []
  } catch (error) {
    console.error('Failed to load programme summary data:', error)
    ElMessage.error('Failed to load programme summary')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

const componentsById = computed(() => {
  const map = new Map<number, any>()
  components.value.forEach((c) => map.set(Number(c.id), c))
  return map
})

const totals = computed(() => ({
  programmeCount: programmes.value.length,
  componentCount: components.value.length,
  projectCount: projects.value.length,
  ongoingCount: projects.value.filter((p) => p.status === 'Ongoing').length,
  activityCount: projects.value.reduce((sum, p) => sum + (p.activities || []).length, 0),
}))

// ---- Cascading county → subcounty → ward filter ----
watch(selectedCounty, async (countyId) => {
  selectedSubcounty.value = null
  selectedWard.value = null
  subcounties.value = []
  wards.value = []
  if (countyId == null) return
  try {
    const res = await getSubcountiesList({ params: { county_id: countyId } } as any)
    subcounties.value = Array.isArray((res as any)?.data) ? (res as any).data : []
  } catch (error) {
    console.error('Failed to load subcounties:', error)
  }
})

watch(selectedSubcounty, async (subcountyId) => {
  selectedWard.value = null
  wards.value = []
  if (subcountyId == null || selectedCounty.value == null) return
  try {
    const res = await getWardsList({ params: { county_id: selectedCounty.value } } as any)
    const all = Array.isArray((res as any)?.data) ? (res as any).data : []
    wards.value = all.filter((w: any) => Number(w.subcounty_id) === Number(subcountyId))
  } catch (error) {
    console.error('Failed to load wards:', error)
  }
})

const resetFilters = () => {
  selectedCounty.value = null
  selectedProgramme.value = null
}

const hasActiveFilters = computed(
  () => selectedCounty.value != null || selectedProgramme.value != null
)

// A project is counted once per county it appears in (a project spanning two
// counties is genuinely present in both), so dedupe on project+county.
const rootProgrammeTitle = (programmeId: number) => {
  const byId = new Map<number, ProgrammeRecord>()
  programmes.value.forEach((p) => {
    const id = Number(p.id)
    if (!Number.isNaN(id)) byId.set(id, p)
  })
  const seen = new Set<number>()
  let current = byId.get(Number(programmeId))
  while (current) {
    const id = Number(current.id)
    if (seen.has(id)) break
    seen.add(id)
    const parentId = current.parentId
    if (parentId == null || parentId === '') {
      return String(current.title || current.acronym || id)
    }
    current = byId.get(Number(parentId))
  }
  return 'Unassigned'
}

const DIMENSION_LABEL: Record<string, string> = {
  programme: 'Programme',
  component: 'Component',
  status: 'Status',
  scope: 'Scope',
}

const categoryForLocation = (loc: any) => {
  const project = loc.project
  if (!project) return 'Unassigned'
  const component = componentsById.value.get(Number(project.component_id))

  switch (stackDimension.value) {
    case 'component':
      return component?.title ? String(component.title) : 'Unassigned'
    case 'status':
      return project.status ? String(project.status) : 'Unspecified'
    case 'scope':
      return project.implementation_scope ? String(project.implementation_scope) : 'Unspecified'
    case 'programme':
    default:
      return component?.programme_id != null
        ? rootProgrammeTitle(Number(component.programme_id))
        : 'Unassigned'
  }
}

const countyNameById = computed(() => {
  const map = new Map<number, string>()
  counties.value.forEach((c) => map.set(Number(c.id), String(c.name)))
  return map
})

const subcountyNameById = computed(() => {
  const map = new Map<number, string>()
  subcounties.value.forEach((s) => map.set(Number(s.id), String(s.name)))
  return map
})

const wardNameById = computed(() => {
  const map = new Map<number, string>()
  wards.value.forEach((w) => map.set(Number(w.id), String(w.name)))
  return map
})

// The x-axis drills in with the filter: counties → subcounties of the chosen
// county → wards of the chosen subcounty. There is no settlement level because
// project_location.location_name is empty for every row.
const axisLevel = computed<'county' | 'subcounty' | 'ward'>(() => {
  if (selectedSubcounty.value != null) return 'ward'
  if (selectedCounty.value != null) return 'subcounty'
  return 'county'
})

const AXIS_LABEL: Record<string, string> = {
  county: 'County',
  subcounty: 'Subcounty',
  ward: 'Ward',
}

// Locations that carry no id at the current axis level still hold projects, so
// they get an explicit bucket instead of being dropped.
const axisBucketFor = (loc: any) => {
  switch (axisLevel.value) {
    case 'subcounty':
      return loc.subcounty_id
        ? subcountyNameById.value.get(Number(loc.subcounty_id)) || `Subcounty ${loc.subcounty_id}`
        : 'County-wide'
    case 'ward':
      return loc.ward_id
        ? wardNameById.value.get(Number(loc.ward_id)) || `Ward ${loc.ward_id}`
        : 'No ward recorded'
    case 'county':
    default:
      return countyNameById.value.get(Number(loc.county_id)) || `County ${loc.county_id}`
  }
}

// Locations surviving the cascade filter. Note: only settlement/ward-type rows
// carry ward_id, so filtering to a ward necessarily drops county-only records.
const filteredLocations = computed(() =>
  projectLocations.value.filter((loc) => {
    if (!loc.county_id || !loc.project) return false
    if (selectedCounty.value != null && Number(loc.county_id) !== selectedCounty.value) return false
    if (selectedSubcounty.value != null && Number(loc.subcounty_id) !== selectedSubcounty.value)
      return false
    if (selectedWard.value != null && Number(loc.ward_id) !== selectedWard.value) return false
    if (allowedComponentIds.value) {
      const componentId = loc.project.component_id
      if (componentId == null || !allowedComponentIds.value.has(Number(componentId))) return false
    }
    return true
  })
)

// The 8-slot categorical palette is the hard cap; a 9th series folds into "Other"
// rather than getting a generated hue.
const MAX_SERIES = 8

const chartModel = computed(() => {
  const counts = new Map<string, Map<string, number>>()
  const categoryTotals = new Map<string, number>()
  const seen = new Set<string>()

  filteredLocations.value.forEach((loc) => {
    const bucket = axisBucketFor(loc)
    const projectId = Number(loc.project.id)
    // A project spanning two buckets counts once in each, but never twice in one
    const key = `${projectId}-${bucket}`
    if (seen.has(key)) return
    seen.add(key)

    const category = categoryForLocation(loc)

    if (!counts.has(bucket)) counts.set(bucket, new Map())
    const row = counts.get(bucket)!
    row.set(category, (row.get(category) || 0) + 1)
    categoryTotals.set(category, (categoryTotals.get(category) || 0) + 1)
  })

  // Busiest buckets first so the chart reads left-to-right
  const countyNames = [...counts.keys()].sort((a, b) => {
    const totalA = [...counts.get(a)!.values()].reduce((s, n) => s + n, 0)
    const totalB = [...counts.get(b)!.values()].reduce((s, n) => s + n, 0)
    return totalB - totalA || a.localeCompare(b)
  })

  const ranked = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  const keptCategories = ranked.slice(0, MAX_SERIES).map(([name]) => name)
  const foldedCount = ranked.length - keptCategories.length
  const categories = foldedCount > 0 ? [...keptCategories, 'Other'] : keptCategories
  const kept = new Set(keptCategories)

  const series = categories.map((category) => ({
    name: category,
    data: countyNames.map((countyName) => {
      const row = counts.get(countyName)!
      if (category === 'Other') {
        let sum = 0
        row.forEach((value, name) => {
          if (!kept.has(name)) sum += value
        })
        return sum
      }
      return row.get(category) || 0
    }),
  }))

  const total = [...categoryTotals.values()].reduce((s, n) => s + n, 0)

  return { countyNames, series, total, foldedCount }
})

const chartHasData = computed(() => chartModel.value.countyNames.length > 0)

// Projects with no project_location can never appear on a county chart — state
// that rather than letting the chart total silently disagree with the tile.
const projectsWithoutLocation = computed(() => {
  const located = new Set(
    projectLocations.value.filter((l) => l.county_id).map((l) => Number(l.project_id))
  )
  return projects.value.filter((p) => !located.has(Number(p.id))).length
})

// Validated categorical palette (light / dark steps of the same eight hues)
const PALETTE_LIGHT = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948']
const PALETTE_DARK = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767']

// "Other" is a leftover bucket, not a 9th category, so it takes a recessive neutral
// rather than cycling back onto slot 1's hue (both clear 3:1 on their surface).
const OTHER_LIGHT = '#7d7d75'
const OTHER_DARK = '#9b9b93'

const isDark = computed(() => appStore.getIsDark)

// One colour per chart series, shared by the bars and the map dots so a category
// looks the same in either view.
const seriesColors = computed(() => {
  const palette = isDark.value ? PALETTE_DARK : PALETTE_LIGHT
  const other = isDark.value ? OTHER_DARK : OTHER_LIGHT
  return chartModel.value.series.map((s, i) =>
    s.name === 'Other' ? other : palette[i % palette.length]
  )
})

const exportBaseName = computed(() => `projects-by-${axisLevel.value}`)

// ---- Dynamic titles ----
const selectedCountyName = computed(() =>
  selectedCounty.value == null ? '' : countyNameById.value.get(selectedCounty.value) || ''
)
const selectedSubcountyName = computed(() =>
  selectedSubcounty.value == null ? '' : subcountyNameById.value.get(selectedSubcounty.value) || ''
)
const selectedWardName = computed(() =>
  selectedWard.value == null ? '' : wardNameById.value.get(selectedWard.value) || ''
)
const selectedProgrammeName = computed(() => {
  if (selectedProgramme.value == null) return ''
  const match = programmes.value.find((p) => Number(p.id) === selectedProgramme.value)
  return match ? String(match.title || match.acronym || '') : ''
})

// "Projects by subcounty in Nairobi" — the deepest place named, since a ward
// already implies its subcounty and county.
const chartTitle = computed(() => {
  const level = AXIS_LABEL[axisLevel.value].toLowerCase()
  const place =
    selectedWardName.value ||
    selectedSubcountyName.value ||
    selectedCountyName.value ||
    ''
  const scope = selectedProgrammeName.value
  let title = `Projects by ${level}`
  if (place) title += ` in ${place}`
  if (scope) title += ` · ${scope}`
  return title
})

// Kept to the essentials — the caveats (unlocated projects, folded categories)
// live in the map panel rather than the header.
const chartSubtitle = computed(
  () =>
    `Coloured by ${DIMENSION_LABEL[stackDimension.value].toLowerCase()} · ` +
    `${chartModel.value.total} of ${totals.value.projectCount} projects`
)

// The two numbers rarely match, for two opposite reasons: projects with no
// location drop out, while a project spanning several places is counted in each.
// Spell that out on hover rather than leaving it to be second-guessed.
const countExplanation = computed(() => {
  const shown = chartModel.value.total
  const all = totals.value.projectCount
  if (shown === all) return `All ${all} projects appear here.`

  const reasons: string[] = []
  if (projectsWithoutLocation.value) {
    reasons.push(
      `${projectsWithoutLocation.value} project(s) have no recorded location, so they cannot be placed on a ${AXIS_LABEL[axisLevel.value].toLowerCase()}`
    )
  }
  if (hasActiveFilters.value) {
    reasons.push('the active filters exclude some projects')
  }
  if (multiPlaceProjects.value) {
    reasons.push(
      `${multiPlaceProjects.value} project(s) span more than one ${AXIS_LABEL[axisLevel.value].toLowerCase()} and are counted once in each`
    )
  }

  const why = reasons.length
    ? reasons.join('; ')
    : 'some projects fall outside the current view'
  return `${shown} counted of ${all} total — ${why}.`
})

// Projects appearing in more than one bucket at the current level
const multiPlaceProjects = computed(() => {
  const buckets = new Map<number, Set<string>>()
  filteredLocations.value.forEach((loc) => {
    const id = Number(loc.project.id)
    if (!buckets.has(id)) buckets.set(id, new Set())
    buckets.get(id)!.add(axisBucketFor(loc))
  })
  let n = 0
  buckets.forEach((set) => {
    if (set.size > 1) n += 1
  })
  return n
})

// ---- Map (choropleth) ----
// ApexCharts has no map type, so the map view uses ECharts.
//
// Geometry source differs by level on purpose. The Redis bundle simplifies at
// 0.005deg (~550m), which is tuned for a whole-country choropleth — fine for the
// 47 counties, but it destroys urban subcounties (Nairobi's Mathare is 4.5x1.5km
// and survives as ~10 vertices). Once drilled into one parent the subset is small
// (~48KB for Nairobi's 17 subcounties), so those levels fetch full precision.
const geoLoading = ref(false)
const activeGeo = ref<any>(null)
const registeredMapName = ref('')

const mapName = computed(() => {
  if (axisLevel.value === 'subcounty') return `PS_sub_${selectedCounty.value}`
  if (axisLevel.value === 'ward') return `PS_ward_${selectedSubcounty.value}`
  return 'PS_county'
})

const loadGeoForLevel = async () => {
  geoLoading.value = true
  try {
    if (axisLevel.value === 'county') {
      const ok = await ensureDashboardGeoBundleLoaded()
      activeGeo.value = ok && geoCache.has('county') ? geoCache.get('county') : null
      if (!activeGeo.value) ElMessage.error('Could not load map boundaries')
      return
    }

    const model = axisLevel.value === 'subcounty' ? 'subcounty' : 'ward'
    const field = axisLevel.value === 'subcounty' ? 'county_id' : 'subcounty_id'
    const parentId =
      axisLevel.value === 'subcounty' ? selectedCounty.value : selectedSubcounty.value
    if (parentId == null) {
      activeGeo.value = null
      return
    }

    const cacheKey = `detail:${model}:${parentId}`
    if (geoCache.has(cacheKey)) {
      activeGeo.value = geoCache.get(cacheKey)
      return
    }

    const res = await getAllGeo({ model, filters: [field], filterValues: [[parentId]] } as any)
    const fc = (res as any)?.data?.[0]?.json_build_object
    if (!fc?.features?.length) {
      // Fall back to the simplified bundle rather than showing nothing
      const ok = await ensureDashboardGeoBundleLoaded()
      activeGeo.value = ok
        ? subsetGeoFromCache(model, [field], [parentId])
        : null
      return
    }

    // row_to_json repeats the full geometry inside properties.geom — drop it so
    // the cache doesn't hold two copies of every polygon.
    const clean = {
      type: 'FeatureCollection',
      features: fc.features.map((f: any) => ({
        type: 'Feature',
        geometry: f.geometry,
        properties: { id: f.properties?.id, name: f.properties?.name },
      })),
    }
    geoCache.set(cacheKey, clean)
    activeGeo.value = clean
  } catch (error) {
    console.error('Failed to load map boundaries:', error)
    activeGeo.value = null
  } finally {
    geoLoading.value = false
  }
}

watch(
  [viewMode, axisLevel, selectedCounty, selectedSubcounty],
  () => {
    if (viewMode.value === 'map') loadGeoForLevel()
  },
  { immediate: true }
)

// Register lazily; ECharts keys maps by name so each level/parent gets its own.
watch(
  [activeGeo, mapName],
  ([geo, name]) => {
    if (!geo?.features?.length || !name) return
    registerMap(name as string, geo as any)
    registeredMapName.value = name as string
  },
  { immediate: true }
)

// Totals per bucket, and which buckets have no boundary to shade
const mapTotals = computed(() => {
  const rows = chartTableRows.value.map((r) => ({ name: r.county, value: r.__total }))
  const geoNames = new Set(
    ((activeGeo.value?.features || []) as any[]).map((f) => String(f.properties?.name ?? ''))
  )
  return {
    data: rows.filter((r) => geoNames.has(r.name)),
    unmapped: rows.filter((r) => !geoNames.has(r.name)),
    max: rows.reduce((m, r) => Math.max(m, r.value), 0),
  }
})

// ---- Project location dots ----
// Centroids are computed server-side (ST_Centroid) by the optimized endpoint, so
// no polygon geometry is shipped just to place a marker.
const showDots = ref(true)
const locationPoints = ref<Map<number, [number, number]>>(new Map())
const pointsLoaded = ref(false)

const loadLocationPoints = async () => {
  if (pointsLoaded.value) return
  try {
    const res = await getOptimizedProjectLocations({
      params: { model: 'project_location', includeCentroids: true },
    } as any)
    const fc = (res as any)?.data
    const features = fc?.features || []
    const map = new Map<number, [number, number]>()
    features.forEach((f: any) => {
      const id = Number(f.properties?.id)
      const c = f.geometry?.coordinates
      if (!Number.isNaN(id) && Array.isArray(c) && c.length >= 2) {
        map.set(id, [Number(c[0]), Number(c[1])])
      }
    })
    locationPoints.value = map
    pointsLoaded.value = true
  } catch (error) {
    console.error('Failed to load project location points:', error)
  }
}

watch(
  [viewMode, showDots],
  () => {
    if (viewMode.value === 'map' && showDots.value) loadLocationPoints()
  },
  { immediate: true }
)

// One dot per filtered location that has a centroid
const dotData = computed(() => {
  if (!showDots.value || !locationPoints.value.size) return []
  return filteredLocations.value
    .map((loc) => {
      const point = locationPoints.value.get(Number(loc.id))
      if (!point) return null
      return {
        name: loc.project?.title || 'Project',
        value: [point[0], point[1]],
        status: loc.project?.status || 'Unspecified',
        category: dotCategoryFor(loc),
      }
    })
    .filter(Boolean) as any[]
})

// Dots are grouped by the same dimension (and same folding) the bar chart uses, so
// a category keeps its colour whichever view you're in.
const chartCategoryNames = computed(() => new Set(chartModel.value.series.map((s) => s.name)))

const dotCategoryFor = (loc: any) => {
  const category = categoryForLocation(loc)
  return chartCategoryNames.value.has(category) ? category : 'Other'
}

// One scatter series per category — gives each its own palette slot and a legend
// entry, which a single series with per-point colours would not.
const dotSeriesByCategory = computed(() => {
  if (!showDots.value) return []
  const byCategory = new Map<string, any[]>()
  chartModel.value.series.forEach((s) => byCategory.set(s.name, []))
  dotData.value.forEach((dot) => {
    if (!byCategory.has(dot.category)) byCategory.set(dot.category, [])
    byCategory.get(dot.category)!.push(dot)
  })
  return [...byCategory.entries()].map(([name, data]) => ({ name, data }))
})

const mapAspect = computed(() => {
  const geo = activeGeo.value
  if (!geo?.features?.length) return 1
  try {
    return applyGeoAspect(geo)
  } catch {
    return 1
  }
})

// Side panel: every bucket ranked, with its share of the filtered total
const mapRanking = computed(() => {
  const rows = [...chartTableRows.value].sort((a, b) => b.__total - a.__total)
  const max = rows.reduce((m, r) => Math.max(m, r.__total), 0)
  const total = rows.reduce((s, r) => s + r.__total, 0)
  return rows.map((r) => ({
    name: r.county,
    value: r.__total,
    pct: total ? Math.round((r.__total / total) * 100) : 0,
    barPct: max ? Math.round((r.__total / max) * 100) : 0,
  }))
})

// Sequential ramp: one hue, light→dark (verified monotonic in lightness)
const SEQUENTIAL_RAMP = ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b']

const mapOptions = computed(() => {
  const dark = isDark.value
  const textPrimary = dark ? '#ffffff' : '#0b0b0b'
  const surface = dark ? '#1a1a19' : '#fcfcfb'

  return {
    // Rendered into the canvas so a saved PNG carries its own context
    title: {
      text: chartTitle.value,
      subtext: chartSubtitle.value,
      left: 12,
      top: 4,
      textStyle: { color: textPrimary, fontSize: 14, fontWeight: 600 },
      subtextStyle: { color: dark ? '#c3c2b7' : '#52514e', fontSize: 11 },
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.seriesType === 'scatter') {
          return `${params.name}<br/><span style="opacity:.7">${params.data?.status || ''}</span>`
        }
        const value = params.value
        if (value == null || Number.isNaN(value)) return `${params.name}<br/>No projects`
        return `${params.name}<br/><strong>${value}</strong> project${value === 1 ? '' : 's'}`
      },
    },
    // Names the dot colours; the choropleth series is excluded since visualMap
    // already carries its own scale.
    legend: showDots.value
      ? {
          show: true,
          // Below the title block, not overlapping it
          top: 46,
          left: 12,
          data: dotSeriesByCategory.value.map((s) => s.name),
          itemWidth: 10,
          itemHeight: 10,
          icon: 'circle',
          textStyle: { color: textPrimary, fontSize: 11 },
        }
      : { show: false },
    // Save-image only; roam already handles pan/zoom and a reset would fight it
    toolbox: {
      show: true,
      right: 12,
      top: 0,
      iconStyle: { borderColor: dark ? '#c3c2b7' : '#52514e' },
      emphasis: { iconStyle: { borderColor: '#3987e5' } },
      feature: {
        saveAsImage: {
          title: 'Download map',
          name: exportBaseName.value,
          // 8 matches the app's other ECharts exports (Dashboard/Interventions)
          pixelRatio: 8,
          backgroundColor: surface,
        },
      },
    },
    visualMap: {
      // Choropleth only — without this the ramp would also recolour the dots
      seriesIndex: 0,
      min: 0,
      max: Math.max(1, mapTotals.value.max),
      left: 'left',
      bottom: 20,
      text: ['High', 'Low'],
      calculable: true,
      inRange: { color: SEQUENTIAL_RAMP },
      textStyle: { color: textPrimary },
    },
    // A shared geo component gives the choropleth and the dots one projection, so
    // markers stay pinned to their region while roaming.
    geo: {
      map: registeredMapName.value,
      roam: true,
      // Clear the title/legend above and the visualMap below
      top: showDots.value ? 78 : 56,
      bottom: 56,
      // Longitude degrees shrink by cos(latitude); without this the shapes stretch
      aspectScale: mapAspect.value,
      itemStyle: { borderColor: surface, borderWidth: 1, areaColor: dark ? '#2a2a28' : '#f0f0ec' },
      emphasis: {
        label: { show: true, color: textPrimary },
        itemStyle: { areaColor: dark ? '#3a3a38' : '#e6e6e2' },
      },
      select: { disabled: true },
    },
    series: [
      {
        type: 'map',
        geoIndex: 0,
        name: AXIS_LABEL[axisLevel.value],
        data: mapTotals.value.data,
      },
      ...dotSeriesByCategory.value.map((s, i) => ({
        type: 'scatter',
        coordinateSystem: 'geo',
        geoIndex: 0,
        name: s.name,
        symbolSize: 8,
        // Same palette slot as this category's bar, so colours agree across views.
        // The surface ring keeps overlapping dots countable.
        itemStyle: {
          color: seriesColors.value[i],
          borderColor: surface,
          borderWidth: 2,
        },
        emphasis: { scale: 1.4 },
        z: 5,
        data: s.data,
      })),
    ],
  }
})

const chartOptions = computed(() => {
  const dark = isDark.value
  const textPrimary = dark ? '#ffffff' : '#0b0b0b'
  const textSecondary = dark ? '#c3c2b7' : '#52514e'
  const gridBorder = dark ? '#3a3a38' : '#e6e6e2'

  return {
    chart: {
      type: 'bar',
      stacked: true,
      height: 420,
      fontFamily: 'inherit',
      // Apex paints the exported PNG with chart.background — 'transparent' produced
      // a see-through image that's unreadable on white or dark. Matches the card.
      background: dark ? '#1a1a19' : '#fcfcfb',
      animations: { enabled: true, speed: 250 },
      // Built-in export menu (SVG / PNG / CSV of the plotted series)
      toolbar: {
        show: true,
        offsetY: -4,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false,
        },
        // scale/width match the app's other Apex exports (National, DynamicState);
        // `background` because the chart itself is transparent and a PNG without it
        // is unreadable pasted onto white or dark.
        export: {
          scale: 3,
          width: 1800,
          csv: { filename: exportBaseName.value, headerCategory: AXIS_LABEL[axisLevel.value] },
          svg: { filename: exportBaseName.value },
          png: { filename: exportBaseName.value },
        },
      },
    },
    theme: { mode: dark ? 'dark' : 'light' },
    colors: seriesColors.value,
    // In the chart itself, so exported PNG/SVG carries its own context
    title: {
      text: chartTitle.value,
      align: 'left',
      margin: 4,
      style: { fontSize: '14px', fontWeight: 600, color: textPrimary },
    },
    subtitle: {
      text: chartSubtitle.value,
      align: 'left',
      offsetY: 22,
      style: { fontSize: '11px', color: textSecondary },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: chartModel.value.countyNames.length > 20 ? '80%' : '55%',
        borderRadius: 3,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'last',
      },
    },
    // 2px surface gap between stacked segments
    stroke: { show: true, width: 2, colors: [dark ? '#1a1a19' : '#fcfcfb'] },
    dataLabels: { enabled: false },
    xaxis: {
      categories: chartModel.value.countyNames,
      labels: {
        rotate: -45,
        rotateAlways: chartModel.value.countyNames.length > 8,
        trim: true,
        hideOverlappingLabels: false,
        style: { colors: textSecondary, fontSize: '11px' },
      },
      axisBorder: { color: gridBorder },
      axisTicks: { color: gridBorder },
    },
    yaxis: {
      title: { text: 'Projects', style: { color: textSecondary, fontWeight: 500 } },
      labels: { style: { colors: textSecondary, fontSize: '11px' } },
      forceNiceScale: true,
    },
    grid: { borderColor: gridBorder, strokeDashArray: 3 },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      markers: { radius: 3 },
      labels: { colors: textPrimary },
      fontSize: '12px',
    },
    tooltip: {
      theme: dark ? 'dark' : 'light',
      shared: true,
      intersect: false,
      y: { formatter: (val: number) => `${val} project${val === 1 ? '' : 's'}` },
    },
    noData: { text: 'No projects match this filter' },
  }
})

// Table view — the relief for the light-mode contrast warning on some slots
const chartTableRows = computed(() =>
  chartModel.value.countyNames.map((countyName, index) => {
    const row: Record<string, any> = { county: countyName }
    let total = 0
    chartModel.value.series.forEach((s) => {
      row[s.name] = s.data[index]
      total += s.data[index]
    })
    row.__total = total
    return row
  })
)

const tablePage = ref(1)
const tablePageSize = ref(5)

const pagedChartTableRows = computed(() => {
  const start = (tablePage.value - 1) * tablePageSize.value
  return chartTableRows.value.slice(start, start + tablePageSize.value)
})

// Changing dimension or location filter reshapes the table — a stale page number
// would leave it looking empty.
watch([stackDimension, selectedCounty, selectedSubcounty, selectedWard, selectedProgramme], () => {
  tablePage.value = 1
})

// Programme path for a component, e.g. "KISIP2 > Infrastructure" — export only.
const programmePathFor = (componentId: number) => {
  const component = componentsById.value.get(Number(componentId))
  if (!component) return 'Unassigned'

  const byId = new Map<number, ProgrammeRecord>()
  programmes.value.forEach((p) => {
    const id = Number(p.id)
    if (!Number.isNaN(id)) byId.set(id, p)
  })

  const labels: string[] = []
  const seen = new Set<number>()
  let current = byId.get(Number(component.programme_id))
  while (current) {
    const id = Number(current.id)
    if (seen.has(id)) break
    seen.add(id)
    labels.unshift(String(current.title || current.acronym || id))
    const parentId = current.parentId
    current = parentId == null || parentId === '' ? undefined : byId.get(Number(parentId))
  }

  return labels.length ? labels.join(' > ') : 'Unassigned'
}

const formatDate = (value: any) => {
  if (!value) return ''
  const d = new Date(value)
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
}

// The export mirrors the chart's filters. With nothing filtered it covers every
// project — including those with no location, which the chart can't show.
const exportProjects = computed(() => {
  if (!hasActiveFilters.value) return projects.value
  const ids = new Set(filteredLocations.value.map((loc) => Number(loc.project.id)))
  return projects.value.filter((p) => ids.has(Number(p.id)))
})

const buildProjectRows = () =>
  exportProjects.value.map((p, index) => ({
    index: index + 1,
    programme: programmePathFor(p.component_id),
    component: componentsById.value.get(Number(p.component_id))?.title || 'Unassigned',
    title: p.title || '',
    project_code: p.project_code || '',
    status: p.status || '',
    scope: p.implementation_scope || '',
    start_date: formatDate(p.start_date),
    end_date: formatDate(p.end_date),
    cost: Number(p.cost || 0),
    activity_count: (p.activities || []).length,
    activities: (p.activities || []).map((a: any) => a.title).join('; '),
  }))

// One row per project-activity link
const buildActivityRows = () => {
  const rows: any[] = []
  exportProjects.value.forEach((p) => {
    ;(p.activities || []).forEach((a: any) => {
      rows.push({
        index: rows.length + 1,
        programme: programmePathFor(p.component_id),
        component: componentsById.value.get(Number(p.component_id))?.title || 'Unassigned',
        project: p.title || '',
        project_code: p.project_code || '',
        project_status: p.status || '',
        activity: a.title || '',
        activity_short: a.shortTitle || '',
        activity_code: a.code || '',
      })
    })
  })
  return rows
}

const PROJECT_COLUMNS: { label: string; key: string; numeric?: boolean }[] = [
  { label: 'S/No', key: 'index', numeric: true },
  { label: 'Programme', key: 'programme' },
  { label: 'Component', key: 'component' },
  { label: 'Project', key: 'title' },
  { label: 'Project Code', key: 'project_code' },
  { label: 'Status', key: 'status' },
  { label: 'Scope', key: 'scope' },
  { label: 'Start Date', key: 'start_date' },
  { label: 'End Date', key: 'end_date' },
  { label: 'Cost', key: 'cost', numeric: true },
  { label: 'Activities', key: 'activity_count', numeric: true },
]

const ACTIVITY_COLUMNS: { label: string; key: string; numeric?: boolean }[] = [
  { label: 'S/No', key: 'index', numeric: true },
  { label: 'Programme', key: 'programme' },
  { label: 'Component', key: 'component' },
  { label: 'Project', key: 'project' },
  { label: 'Project Code', key: 'project_code' },
  { label: 'Project Status', key: 'project_status' },
  { label: 'Activity', key: 'activity' },
  { label: 'Short Title', key: 'activity_short' },
  { label: 'Activity Code', key: 'activity_code' },
]

// write-excel-file's schema-less form: row 1 is the bold header, then one array
// of cells per record.
const toSheetData = (
  rows: Record<string, any>[],
  columns: { label: string; key: string; numeric?: boolean }[]
) => [
  columns.map((c) => ({ value: c.label, fontWeight: 'bold' as const })),
  ...rows.map((row) =>
    columns.map((c) => {
      const raw = row[c.key]
      if (c.numeric) {
        const n = Number(raw)
        return { type: Number, value: Number.isFinite(n) ? n : 0 }
      }
      return { type: String, value: raw == null ? '' : String(raw) }
    })
  ),
]

const columnWidths = (
  rows: Record<string, any>[],
  columns: { label: string; key: string }[]
) =>
  columns.map((c) => {
    const longest = rows.reduce((max, row) => {
      const len = row[c.key] == null ? 0 : String(row[c.key]).length
      return Math.max(max, len)
    }, c.label.length)
    return { width: Math.min(longest + 4, 60) }
  })

const downloadProjectList = async () => {
  if (!exportProjects.value.length) {
    ElMessage.warning('No projects to download')
    return
  }

  downloading.value = true
  try {
    // Projects and activities always go to their own sheets
    const projectRows = buildProjectRows()
    const activityRows = buildActivityRows()

    await writeXlsxFile(
      [toSheetData(projectRows, PROJECT_COLUMNS), toSheetData(activityRows, ACTIVITY_COLUMNS)] as any,
      {
        fileName: hasActiveFilters.value
          ? 'Programme_Projects_filtered.xlsx'
          : 'Programme_Projects.xlsx',
        sheets: ['Projects', 'Activities'],
        columns: [
          columnWidths(projectRows, PROJECT_COLUMNS),
          columnWidths(activityRows, ACTIVITY_COLUMNS),
        ],
      } as any
    )

    ElMessage.success(`Downloading ${projectRows.length} project(s)`)
  } catch (error) {
    console.error('Failed to build project export:', error)
    ElMessage.error('Failed to build download')
  } finally {
    downloading.value = false
  }
}

// The summary table as its own sheet: exactly the rows/columns on screen
// (current axis level, stack dimension and filters), not the raw project list.
const downloadingSummary = ref(false)

const downloadSummaryTable = async () => {
  if (!chartTableRows.value.length) {
    ElMessage.warning('Nothing to download')
    return
  }

  downloadingSummary.value = true
  try {
    const columns = [
      { label: AXIS_LABEL[axisLevel.value], key: 'county' },
      ...chartModel.value.series.map((s) => ({ label: s.name, key: s.name, numeric: true })),
      { label: 'Total', key: '__total', numeric: true },
    ]
    const rows = chartTableRows.value

    // Single sheet: `columns` must be a flat array here — passing `sheets` puts the
    // writer in multi-sheet mode, where it expects one column array per sheet.
    await writeXlsxFile(toSheetData(rows, columns) as any, {
      fileName: `${exportBaseName.value}-summary.xlsx`,
      sheet: `By ${AXIS_LABEL[axisLevel.value]}`,
      columns: columnWidths(rows, columns),
    } as any)

    ElMessage.success(`Downloading ${rows.length} row(s)`)
  } catch (error) {
    console.error('Failed to build summary export:', error)
    ElMessage.error('Failed to build download')
  } finally {
    downloadingSummary.value = false
  }
}
</script>

<template>
  <div :class="['programme-summary', { 'is-mobile': isMobile }]">
    <el-skeleton v-if="loading" :rows="3" animated class="summary-skeleton" />

    <el-card v-if="!loading" class="summary-chart-card">
      <div class="chart-toolbar">
        <div class="chart-toolbar-text">
          <h3 class="chart-title">{{ chartTitle }}</h3>
          <p class="chart-subtitle">
            Coloured by {{ DIMENSION_LABEL[stackDimension].toLowerCase() }} ·
            <el-tooltip
              :content="countExplanation"
              placement="bottom"
              :show-after="150"
              popper-class="count-hint-popper"
            >
              <span class="chart-count-hint">
                {{ chartModel.total }} of {{ totals.projectCount }} projects
                <Icon icon="mdi:information-outline" :size="13" class="chart-count-icon" />
              </span>
            </el-tooltip>
          </p>
        </div>

        <div class="chart-toolbar-controls">
          <el-radio-group v-model="stackDimension" size="small">
            <el-radio-button label="programme">Programme</el-radio-button>
            <el-radio-button label="component">Component</el-radio-button>
            <el-radio-button label="status">Status</el-radio-button>
            <el-radio-button label="scope">Scope</el-radio-button>
          </el-radio-group>

          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button label="chart">Chart</el-radio-button>
            <el-radio-button label="table">Table</el-radio-button>
            <el-radio-button label="map">Map</el-radio-button>
          </el-radio-group>

          <el-tooltip
            :content="
              hasActiveFilters
                ? 'Download filtered projects & activities (XLSX)'
                : 'Download all projects & activities (XLSX)'
            "
            placement="top"
          >
            <el-button
              size="small"
              type="primary"
              :loading="downloading"
              :disabled="!exportProjects.length"
              @click="downloadProjectList"
            >
              <Icon v-if="!downloading" icon="mdi:file-excel-outline" :size="16" />
            </el-button>
          </el-tooltip>
        </div>
      </div>

      <div class="chart-filter-row">
        <el-select
          v-model="selectedCounty"
          clearable
          filterable
          placeholder="All counties"
          size="small"
          class="chart-filter-select"
        >
          <el-option v-for="c in counties" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>

        <el-select
          v-model="selectedSubcounty"
          clearable
          filterable
          placeholder="All subcounties"
          size="small"
          class="chart-filter-select"
          :disabled="selectedCounty == null"
        >
          <el-option v-for="s in subcounties" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>

        <el-select
          v-model="selectedWard"
          clearable
          filterable
          placeholder="All wards"
          size="small"
          class="chart-filter-select"
          :disabled="selectedSubcounty == null"
        >
          <el-option v-for="w in wards" :key="w.id" :label="w.name" :value="w.id" />
        </el-select>

        <span class="chart-filter-divider"></span>

        <el-tree-select
          v-model="selectedProgramme"
          :data="programmeTreeData"
          clearable
          filterable
          check-strictly
          default-expand-all
          node-key="value"
          value-key="value"
          :props="{ label: 'label', children: 'children', value: 'value' }"
          placeholder="All programmes"
          size="small"
          class="chart-filter-select"
        />

        <el-button
          v-if="hasActiveFilters"
          size="small"
          text
          @click="resetFilters"
        >
          Clear
        </el-button>

        <!-- Pushed to the far right; only meaningful while the table is showing -->
        <el-tooltip
          v-if="showChartTable && chartHasData"
          :content="`Download this table — ${AXIS_LABEL[axisLevel].toLowerCase()} × ${DIMENSION_LABEL[stackDimension].toLowerCase()} (XLSX)`"
          placement="top"
        >
          <el-button
            size="small"
            class="chart-filter-trailing"
            :loading="downloadingSummary"
            @click="downloadSummaryTable"
          >
            <Icon v-if="!downloadingSummary" icon="mdi:table-arrow-down" :size="16" />
          </el-button>
        </el-tooltip>
      </div>

      <div v-if="!chartHasData" class="chart-empty">No projects match this filter</div>

      <div v-else-if="showChartTable">
        <div class="chart-table-wrap">
          <el-table :data="pagedChartTableRows" size="small" border style="width: 100%">
            <el-table-column
              prop="county"
              :label="AXIS_LABEL[axisLevel]"
              min-width="140"
              fixed
              sortable
            />
            <el-table-column
              v-for="s in chartModel.series"
              :key="s.name"
              :prop="s.name"
              :label="s.name"
              min-width="110"
              align="right"
              sortable
            />
            <el-table-column prop="__total" label="Total" min-width="90" align="right" sortable />
          </el-table>
        </div>

        <el-pagination
          v-model:current-page="tablePage"
          v-model:page-size="tablePageSize"
          :page-sizes="[5, 10, 20, 50, 100]"
          :total="chartTableRows.length"
          :layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'"
          :small="isMobile"
          :pager-count="isMobile ? 3 : 7"
          background
          class="chart-table-pagination"
        />
      </div>

      <template v-else-if="viewMode === 'map'">
        <el-skeleton v-if="geoLoading" :rows="6" animated />
        <div v-else-if="!registeredMapName" class="chart-empty">Map boundaries unavailable</div>
        <template v-else>
          <div class="map-layout">
            <v-chart class="summary-map" :option="mapOptions" autoresize />

            <aside class="map-panel">
              <div class="map-panel-head">
                <span class="map-panel-title">By {{ AXIS_LABEL[axisLevel].toLowerCase() }}</span>
                <span class="map-panel-total">{{ chartModel.total }} projects</span>
              </div>

              <label class="map-dots-toggle">
                <el-checkbox v-model="showDots" size="small">
                  <span class="map-dots-label">
                    Location dots
                    <span v-if="showDots" class="map-dots-count">
                      ({{ dotData.length }}, by {{ DIMENSION_LABEL[stackDimension].toLowerCase() }})
                    </span>
                  </span>
                </el-checkbox>
              </label>

              <ul class="map-rank-list">
                <li v-for="row in mapRanking" :key="row.name" class="map-rank-item">
                  <span class="map-rank-name" :title="row.name">{{ row.name }}</span>
                  <span class="map-rank-bar">
                    <span class="map-rank-bar-fill" :style="{ width: `${row.barPct}%` }"></span>
                  </span>
                  <span class="map-rank-value">{{ row.value }}</span>
                  <span class="map-rank-pct">{{ row.pct }}%</span>
                </li>
              </ul>

              <p v-if="mapTotals.unmapped.length" class="map-note">
                No boundary to shade:
                {{ mapTotals.unmapped.map((u) => `${u.name} (${u.value})`).join(', ') }}
              </p>

              <p v-if="chartModel.foldedCount" class="map-note">
                Smallest {{ chartModel.foldedCount }}
                {{ DIMENSION_LABEL[stackDimension].toLowerCase() }} grouped as “Other”.
              </p>

              <p class="map-note">
                Shading is total projects per {{ AXIS_LABEL[axisLevel].toLowerCase() }};
                <template v-if="showDots">
                  dot colour is {{ DIMENSION_LABEL[stackDimension].toLowerCase() }}.
                </template>
                <template v-else>
                  turn on dots to see the
                  {{ DIMENSION_LABEL[stackDimension].toLowerCase() }} split.
                </template>
              </p>
            </aside>
          </div>
        </template>
      </template>

      <apexchart
        v-else
        type="bar"
        height="420"
        width="100%"
        :options="chartOptions"
        :series="chartModel.series"
      />
    </el-card>
  </div>
</template>

<style scoped>
.programme-summary {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px;
}

.summary-skeleton {
  padding: 8px 4px;
}

/* ---- Chart ---- */
.summary-chart-card {
  width: 100%;
}

.chart-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.chart-title {
  margin: 0 0 5px;
  font-size: 18px;
  font-weight: 700;
}

.chart-subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.chart-count-hint {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  cursor: help;
  border-bottom: 1px dotted var(--el-border-color-dark);
}

.chart-count-icon {
  color: var(--el-text-color-placeholder);
}

.chart-toolbar-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

/* The segmented control stays on one row — a wrapped segment reads as two controls */
.chart-toolbar-controls :deep(.el-radio-group) {
  flex-wrap: nowrap;
}

.chart-toolbar-controls :deep(.el-radio-button__inner) {
  white-space: nowrap;
}

/* Narrow screens: scroll the control strip rather than breaking the segments */
.is-mobile .chart-toolbar-controls {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  max-width: 100%;
}

.chart-filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.chart-filter-select {
  width: 180px;
}

.chart-filter-trailing {
  margin-left: auto;
}

/* Separates the admin-area cascade from the programme filter */
.chart-filter-divider {
  width: 1px;
  align-self: stretch;
  min-height: 22px;
  background: var(--el-border-color-lighter);
  margin: 0 2px;
}

.is-mobile .chart-filter-divider {
  display: none;
}

.is-mobile .chart-filter-select {
  width: 100%;
}

.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.chart-table-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.chart-table-pagination {
  margin-top: 12px;
  justify-content: flex-end;
}

/* A roughly-square country in a full-width box letterboxes badly; the panel takes
   the space the map can't use instead of leaving it blank. */
.map-layout {
  display: flex;
  align-items: stretch;
  gap: 16px;
}

.is-mobile .map-layout {
  flex-direction: column;
}

.summary-map {
  flex: 1 1 auto;
  min-width: 0;
  height: 520px;
}

.is-mobile .summary-map {
  height: 340px;
}

.map-panel {
  flex: 0 0 300px;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-left: 1px solid var(--el-border-color-lighter);
  padding-left: 14px;
}

.is-mobile .map-panel {
  flex: 1 1 auto;
  border-left: none;
  border-top: 1px solid var(--el-border-color-lighter);
  padding-left: 0;
  padding-top: 12px;
}

.map-panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 8px;
  margin-bottom: 6px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.map-panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.map-panel-total {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.map-dots-toggle {
  display: block;
  margin-bottom: 6px;
}

.map-dots-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.map-dots-count {
  color: var(--el-text-color-secondary);
}

.map-rank-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  max-height: 420px;
}

.is-mobile .map-rank-list {
  max-height: 240px;
}

.map-rank-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 56px 28px 34px;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
  font-size: 12px;
}

.map-rank-name {
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.map-rank-bar {
  height: 6px;
  border-radius: 3px;
  background: var(--el-fill-color);
  overflow: hidden;
}

.map-rank-bar-fill {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: #3987e5;
}

.map-rank-value {
  text-align: right;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.map-rank-pct {
  text-align: right;
  color: var(--el-text-color-secondary);
}

.map-note {
  margin: 6px 2px 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>

<!-- Poppers are teleported to <body>, so they can't be reached from a scoped block -->
<style>
.count-hint-popper.el-popper {
  max-width: 240px;
  line-height: 1.45;
}
</style>
