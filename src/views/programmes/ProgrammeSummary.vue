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
  ElDrawer,
} from 'element-plus'
import { Icon } from '@/components/Icon'
import { Close, Download } from '@element-plus/icons-vue'
import { useAppStoreWithOut } from '@/store/modules/app'
import {
  getProgrammesList,
  getComponentsList,
  getOptimizedProjectLocations,
} from '@/api/project-locations-optimized'
import { getCountiesList, getSubcountiesList, getWardsList } from '@/api/settlements-optimized'
import { getSettlementListByCounty, getAllGeo } from '@/api/settlements'
import { getProgrammeDescendantIds, type ProgrammeRecord } from '@/utils/programmeValidation'
import { buildProgrammeTreeSelectData } from '@/utils/programmeComponentTree'
import { CANONICAL_REGION_ORDER } from '@/constants/projectRegions'
// `v-chart` is registered globally in plugins/setupCharts.ts
import { registerMap } from 'echarts/core'
import { ensureDashboardGeoBundleLoaded, subsetGeoFromCache, applyGeoAspect } from '@/utils/dashboardGeo'
import { geoCache } from '@/utils/dashboardCache'
// Browser-safe writer (same one DownloadCustom.vue uses); json-as-xlsx routes
// through Node's fs and throws once bundled for the browser.
import writeXlsxFile from 'write-excel-file'
import { saveAs } from 'file-saver'
import {
  buildRegionalTrackerWorkbook,
  buildTrackerExportFileName,
  buildTrackerExportUi,
  classifyTrackerProgrammeFamily,
  filterProjectsForRegionalTracker,
  getMonitoringFiscalYear,
  summaryColumnWidths,
  trackerColumnWidths,
} from '@/utils/sudRegionalTrackerExport'
import { fixXlsxWorkbookSheetNames } from '@/utils/xlsxWorkbookFix'

const appStore = useAppStoreWithOut()
const isMobile = computed(() => appStore.getMobile)

const loading = ref(true)
const downloading = ref(false)
const chartFiltersOpen = ref(false)
const chartFullscreenOpen = ref(false)
const trackerExportDialogVisible = ref(false)
const trackerExportProgrammeId = ref<number | null>(null)
const trackerExportRegions = ref<string[]>([])

const trackerRegionOptions = CANONICAL_REGION_ORDER.map((region) => ({
  label: region,
  value: region,
}))

const trackerExportComponentIds = computed<Set<number> | null>(() => {
  if (trackerExportProgrammeId.value == null) return null
  const scope = new Set<number>([trackerExportProgrammeId.value])
  getProgrammeDescendantIds(trackerExportProgrammeId.value, programmes.value).forEach((id) =>
    scope.add(id),
  )
  return new Set(
    components.value
      .filter((component) => scope.has(Number(component.programme_id)))
      .map((component) => Number(component.id)),
  )
})

const trackerExportProjects = computed(() =>
  filterProjectsForRegionalTracker(projects.value, projectLocations.value, counties.value, {
    componentIds: trackerExportComponentIds.value,
    regions: trackerExportRegions.value.length ? trackerExportRegions.value : null,
  }),
)

const trackerExportHasFilters = computed(
  () => trackerExportProgrammeId.value != null || trackerExportRegions.value.length > 0,
)

const trackerExportProgrammeRecord = computed(() => {
  if (trackerExportProgrammeId.value == null) return null
  return (
    programmes.value.find((programme) => Number(programme.id) === trackerExportProgrammeId.value) ||
    null
  )
})

const trackerExportProgrammeFamily = computed(() =>
  classifyTrackerProgrammeFamily(trackerExportProgrammeId.value, programmes.value),
)

const trackerExportUi = computed(() =>
  buildTrackerExportUi(trackerExportProgrammeFamily.value, trackerExportProgrammeRecord.value),
)

const trackerExportFileName = computed(() =>
  buildTrackerExportFileName(trackerExportProgrammeFamily.value, {
    filtered: trackerExportHasFilters.value,
    programmeAcronym: trackerExportProgrammeRecord.value?.acronym || null,
  }),
)

const openTrackerExportDialog = () => {
  trackerExportProgrammeId.value = selectedProgramme.value
  trackerExportRegions.value = []
  trackerExportDialogVisible.value = true
}

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

const programmeTreeData = computed(() => buildProgrammeTreeSelectData(programmes.value))

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
        'region',
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
  () =>
    selectedCounty.value != null ||
    selectedSubcounty.value != null ||
    selectedWard.value != null ||
    selectedProgramme.value != null,
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

// Display labels only. The keys stay 'subcounty' because they address the backend
// column (subcounty_id) and model name — this renames the wording, not the data.
const AXIS_LABEL: Record<string, string> = {
  county: 'County',
  subcounty: 'Constituency',
  ward: 'Ward',
}

// Locations that carry no id at the current axis level still hold projects, so
// they get an explicit bucket instead of being dropped.
const axisBucketFor = (loc: any) => {
  switch (axisLevel.value) {
    case 'subcounty':
      return loc.subcounty_id
        ? subcountyNameById.value.get(Number(loc.subcounty_id)) ||
          `Constituency ${loc.subcounty_id}`
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

const MOBILE_CHART_TOP_N = 10

const displayChartModel = computed(() => {
  const { countyNames, series, total, foldedCount } = chartModel.value
  if (!isMobile.value || countyNames.length <= MOBILE_CHART_TOP_N) {
    return { countyNames, series, total, foldedCount }
  }

  return {
    countyNames: countyNames.slice(0, MOBILE_CHART_TOP_N),
    series: series.map((s) => ({
      name: s.name,
      data: s.data.slice(0, MOBILE_CHART_TOP_N),
    })),
    total,
    foldedCount,
  }
})

const mobileChartTruncated = computed(
  () => isMobile.value && chartModel.value.countyNames.length > MOBILE_CHART_TOP_N,
)

const chartHeight = computed(() => {
  const buckets = displayChartModel.value.countyNames.length
  if (!isMobile.value) return 420
  return Math.min(Math.max(280, buckets * 34 + 96), 720)
})

const fullscreenChartHeight = computed(() => {
  const buckets = chartModel.value.countyNames.length
  return Math.min(Math.max(360, buckets * 34 + 120), 2400)
})

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
const seriesColorsFor = (series: Array<{ name: string }>) => {
  const palette = isDark.value ? PALETTE_DARK : PALETTE_LIGHT
  const other = isDark.value ? OTHER_DARK : OTHER_LIGHT
  return series.map((s, i) => (s.name === 'Other' ? other : palette[i % palette.length]))
}

const seriesColors = computed(() => seriesColorsFor(chartModel.value.series))

// Derived from the label, not the key, so filenames use the displayed wording
const exportBaseName = computed(
  () => `projects-by-${AXIS_LABEL[axisLevel.value].toLowerCase()}`
)

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

type MapRankRow = {
  name: string
  value: number
  pct: number
  barPct: number
}

const mapRankingColumns = computed(() => {
  const rows = mapRanking.value
  const split = axisLevel.value === 'county' && rows.length > 10
  if (!split) return { split: false as const, left: rows, right: [] as MapRankRow[] }
  const mid = Math.ceil(rows.length / 2)
  return { split: true as const, left: rows.slice(0, mid), right: rows.slice(mid) }
})

const mapRankRowCount = computed(() => {
  const cols = mapRankingColumns.value
  return cols.split ? Math.max(cols.left.length, cols.right.length) : mapRanking.value.length
})

const mapRankSplitLayout = computed(() => {
  if (!mapRankingColumns.value.split) return null
  const mobile = isMobile.value
  if (mobile) {
    return {
      leftGrid: { left: '4%', right: '58%', top: '60%', bottom: 48, containLabel: true },
      rightGrid: { left: '58%', right: '4%', top: '60%', bottom: 48, containLabel: true },
      dividerLeft: '50%',
    }
  }
  const rankTop = showDots.value ? 78 : 58
  return {
    leftGrid: { left: '52%', right: '34%', top: rankTop, bottom: 56, containLabel: true },
    rightGrid: { left: '80%', right: '2%', top: rankTop, bottom: 56, containLabel: true },
    dividerLeft: '73%',
  }
})

const mapRankDividerStyle = computed(() => {
  const layout = mapRankSplitLayout.value
  if (!layout) return {}
  const rankTop = showDots.value ? 78 : 58
  const mobile = isMobile.value
  return {
    left: layout.dividerLeft,
    top: mobile ? '60%' : `${rankTop}px`,
    bottom: mobile ? '48px' : '56px',
    backgroundColor: isDark.value ? '#7a7a76' : '#8a8a86',
  }
})

const mapChartHeight = computed(() => {
  const rows = mapRankRowCount.value
  const split = mapRankingColumns.value.split
  const headerSpace = showDots.value ? 92 : 72
  const rowHeight = isMobile.value ? 15 : 14
  if (split && isMobile.value) {
    return Math.max(460, 250 + headerSpace + rows * rowHeight + 72)
  }
  if (split) {
    return Math.max(400, headerSpace + rows * rowHeight + 100)
  }
  const minHeight = isMobile.value ? 620 : 520
  return Math.max(minHeight, headerSpace + rows * rowHeight + 120)
})

const mapRankBarColor = computed(() => (isDark.value ? '#3987e5' : '#256abf'))

const mapGeoLayout = computed(() => {
  const mobile = isMobile.value
  const split = mapRankingColumns.value.split
  const rankTop = showDots.value ? 78 : 58
  const chartH = mapChartHeight.value

  if (mobile) {
    const mapBottomPct = split ? 0.58 : 0.46
    const mapBottomPx = chartH * mapBottomPct
    const mapHeight = Math.max(mapBottomPx - rankTop, 120)
    const centerY = rankTop + mapHeight / 2
    return {
      bounds: { left: 12, right: 12, top: rankTop, bottom: `${mapBottomPct * 100}%` },
      layoutCenter: ['50%', `${(centerY / chartH) * 100}%`] as [string, string],
      layoutSize: `${Math.min(100, (mapHeight / chartH) * 100 * 1.08)}%`,
    }
  }

  const mapHeight = Math.max(chartH - rankTop - 56, 160)
  const centerY = rankTop + mapHeight / 2
  const layoutSizePct = Math.min(split ? 68 : 72, (mapHeight / chartH) * 100 * 1.06)
  const mapRight = split ? '50%' : '36%'
  const centerX = split ? '25%' : '32%'

  return {
    bounds: { left: 12, right: mapRight, top: rankTop, bottom: 56 },
    layoutCenter: [centerX, `${(centerY / chartH) * 100}%`] as [string, string],
    layoutSize: `${layoutSizePct}%`,
  }
})

function buildRankBarData(rows: MapRankRow[], textSecondary: string, showLabels: boolean) {
  return rows.map((row) => ({
    name: row.name,
    value: row.value,
    pct: row.pct,
    label: {
      show: showLabels,
      position: 'right' as const,
      formatter: `${row.value} (${row.pct}%)`,
      color: textSecondary,
      fontSize: 10,
    },
  }))
}

function buildRankBarSeries(
  rows: MapRankRow[],
  seriesName: string,
  textSecondary: string,
  barColor: string,
  xAxisIndex: number,
  yAxisIndex: number,
  showLabels: boolean,
) {
  return {
    type: 'bar' as const,
    name: seriesName,
    xAxisIndex,
    yAxisIndex,
    data: buildRankBarData(rows, textSecondary, showLabels),
    barMaxWidth: 12,
    itemStyle: {
      color: barColor,
      borderRadius: [0, 3, 3, 0],
    },
    z: 2,
  }
}

// Sequential ramp: one hue, light→dark (verified monotonic in lightness)
const SEQUENTIAL_RAMP = ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b']

const mapOptions = computed(() => {
  const dark = isDark.value
  const mobile = isMobile.value
  const textPrimary = dark ? '#ffffff' : '#0b0b0b'
  const textSecondary = dark ? '#c3c2b7' : '#52514e'
  const surface = dark ? '#1a1a19' : '#fcfcfb'
  const rankColumns = mapRankingColumns.value
  const splitRank = rankColumns.split
  const rankTop = showDots.value ? 78 : 58
  const axisLabel = AXIS_LABEL[axisLevel.value]
  const geoLayout = mapGeoLayout.value
  const rankLabelWidth = mobile ? (splitRank ? 80 : 56) : splitRank ? 96 : 96

  const splitLayout = mapRankSplitLayout.value
  const rankGrid = splitRank
    ? splitLayout
      ? [splitLayout.leftGrid, splitLayout.rightGrid]
      : []
    : mobile
      ? { left: 56, right: 16, top: '58%', bottom: 52 }
      : { left: '66%', right: 16, top: rankTop, bottom: 56 }

  const rankAxisMax = Math.max(1, mapTotals.value.max)

  const rankGraphicTop = mobile ? (splitRank ? '56%' : '54%') : rankTop - 6
  const rankGraphicLeft = splitRank ? (mobile ? '4%' : '52%') : (rankGrid as { left: string | number }).left

  const axisLabelStyle = {
    color: textSecondary,
    fontSize: mobile ? 9 : 10,
    width: rankLabelWidth,
    overflow: 'truncate' as const,
  }

  const valueAxis = (gridIndex?: number) => {
    const showXLabels = splitRank ? gridIndex === 0 : true
    return {
      type: 'value' as const,
      ...(gridIndex != null ? { gridIndex } : {}),
      min: 0,
      ...(splitRank ? { max: rankAxisMax } : {}),
      splitNumber: mobile ? (splitRank ? 3 : 4) : splitRank ? 4 : 5,
      axisLabel: {
        show: showXLabels,
        color: textSecondary,
        fontSize: mobile ? 9 : splitRank ? 9 : 10,
        hideOverlap: true,
        margin: mobile ? 4 : 6,
      },
      splitLine: {
        show: gridIndex !== 1,
        lineStyle: { color: dark ? '#3a3a38' : '#e6e6e2' },
      },
    }
  }

  const showRankLabelsLeft = splitRank ? false : true
  const showRankLabelsRight = splitRank ? rankColumns.right.length <= 14 : true

  const rankBarSeries = splitRank
    ? [
        buildRankBarSeries(
          rankColumns.left,
          `${axisLabel} ranking`,
          textSecondary,
          mapRankBarColor.value,
          0,
          0,
          showRankLabelsLeft,
        ),
        buildRankBarSeries(
          rankColumns.right,
          `${axisLabel} ranking (cont.)`,
          textSecondary,
          mapRankBarColor.value,
          1,
          1,
          showRankLabelsRight,
        ),
      ]
    : [
        buildRankBarSeries(
          rankColumns.left,
          `${axisLabel} ranking`,
          textSecondary,
          mapRankBarColor.value,
          0,
          0,
          true,
        ),
      ]

  return {
    title: {
      text: chartTitle.value,
      subtext: chartSubtitle.value,
      left: 12,
      top: 4,
      textStyle: { color: textPrimary, fontSize: 14, fontWeight: 600 },
      subtextStyle: { color: textSecondary, fontSize: 11 },
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.seriesType === 'bar') {
          const pct = params.data?.pct
          const value = params.value
          const name = params.name || params.data?.name
          if (name == null || value == null) return ''
          return `${name}<br/><strong>${value}</strong> project${value === 1 ? '' : 's'}${
            pct != null ? ` (${pct}%)` : ''
          }`
        }
        if (params.seriesType === 'scatter') {
          return `${params.name}<br/><span style="opacity:.7">${params.data?.status || ''}</span>`
        }
        const value = params.value
        if (value == null || Number.isNaN(value)) return `${params.name}<br/>No projects`
        return `${params.name}<br/><strong>${value}</strong> project${value === 1 ? '' : 's'}`
      },
    },
    legend: showDots.value
      ? {
          show: true,
          top: 46,
          left: 12,
          data: dotSeriesByCategory.value.map((s) => s.name),
          itemWidth: 10,
          itemHeight: 10,
          icon: 'circle',
          textStyle: { color: textPrimary, fontSize: 11 },
        }
      : { show: false },
    toolbox: {
      show: true,
      right: 12,
      top: 0,
      iconStyle: { borderColor: dark ? '#c3c2b7' : '#52514e' },
      emphasis: { iconStyle: { borderColor: '#3987e5' } },
      feature: {
        saveAsImage: {
          title: 'Download map & ranking',
          name: exportBaseName.value,
          pixelRatio: 8,
          backgroundColor: surface,
        },
      },
    },
    graphic: [
      {
        type: 'text',
        left: rankGraphicLeft,
        top: rankGraphicTop,
        style: {
          text: `${axisLabel} ranking · ${chartModel.value.total} projects`,
          fill: textPrimary,
          fontSize: 12,
          fontWeight: 600,
        },
      },
    ],
    visualMap: {
      seriesIndex: 0,
      min: 0,
      max: Math.max(1, mapTotals.value.max),
      left: 'left',
      bottom: mobile ? (splitRank ? '42%' : '48%') : 20,
      text: ['High', 'Low'],
      calculable: true,
      inRange: { color: SEQUENTIAL_RAMP },
      textStyle: { color: textPrimary },
    },
    geo: {
      map: registeredMapName.value,
      roam: true,
      ...geoLayout.bounds,
      layoutCenter: geoLayout.layoutCenter,
      layoutSize: geoLayout.layoutSize,
      aspectScale: mapAspect.value,
      itemStyle: { borderColor: surface, borderWidth: 1, areaColor: dark ? '#2a2a28' : '#f0f0ec' },
      emphasis: {
        label: { show: true, color: textPrimary },
        itemStyle: { areaColor: dark ? '#3a3a38' : '#e6e6e2' },
      },
      select: { disabled: true },
    },
    grid: splitRank ? rankGrid : [rankGrid as Record<string, unknown>],
    xAxis: splitRank ? [valueAxis(0), valueAxis(1)] : valueAxis(0),
    yAxis: splitRank
      ? [
          {
            type: 'category',
            gridIndex: 0,
            data: rankColumns.left.map((row) => row.name),
            inverse: true,
            axisLabel: axisLabelStyle,
            axisTick: { show: false },
            axisLine: { show: false },
          },
          {
            type: 'category',
            gridIndex: 1,
            data: rankColumns.right.map((row) => row.name),
            inverse: true,
            axisLabel: axisLabelStyle,
            axisTick: { show: false },
            axisLine: { show: false },
          },
        ]
      : {
          type: 'category',
          gridIndex: 0,
          data: rankColumns.left.map((row) => row.name),
          inverse: true,
          axisLabel: axisLabelStyle,
          axisTick: { show: false },
          axisLine: { show: false },
        },
    series: [
      {
        type: 'map',
        geoIndex: 0,
        name: axisLabel,
        data: mapTotals.value.data,
      },
      ...rankBarSeries,
      ...dotSeriesByCategory.value.map((s, i) => ({
        type: 'scatter',
        coordinateSystem: 'geo',
        geoIndex: 0,
        name: s.name,
        symbolSize: 8,
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

type ChartRenderModel = {
  countyNames: string[]
  series: Array<{ name: string; data: number[] }>
}

function buildChartOptions(
  model: ChartRenderModel,
  height: number,
  mobile: boolean,
  withHeader: boolean,
) {
  const dark = isDark.value
  const textPrimary = dark ? '#ffffff' : '#0b0b0b'
  const textSecondary = dark ? '#c3c2b7' : '#52514e'
  const gridBorder = dark ? '#3a3a38' : '#e6e6e2'
  const bucketCount = model.countyNames.length

  const options: Record<string, unknown> = {
    chart: {
      type: 'bar',
      stacked: true,
      height,
      fontFamily: 'inherit',
      background: dark ? '#1a1a19' : '#fcfcfb',
      animations: { enabled: true, speed: 250 },
      toolbar: mobile
        ? { show: false }
        : {
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
    colors: seriesColorsFor(model.series),
    plotOptions: {
      bar: {
        horizontal: mobile,
        columnWidth: bucketCount > 20 ? '80%' : mobile ? '70%' : '55%',
        ...(mobile ? { barHeight: '72%' } : {}),
        borderRadius: 3,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'last',
      },
    },
    stroke: { show: true, width: 2, colors: [dark ? '#1a1a19' : '#fcfcfb'] },
    dataLabels: { enabled: false },
    xaxis: mobile
      ? {
          categories: model.countyNames,
          labels: {
            style: {
              colors: textSecondary,
              fontSize: bucketCount > 10 ? '9px' : '11px',
            },
            maxHeight: bucketCount > 14 ? 88 : 120,
            trim: true,
          },
          axisBorder: { color: gridBorder },
          axisTicks: { color: gridBorder },
        }
      : {
          categories: model.countyNames,
          labels: {
            rotate: bucketCount > 12 ? -55 : -45,
            rotateAlways: bucketCount > 8,
            trim: true,
            hideOverlappingLabels: bucketCount > 16,
            style: {
              colors: textSecondary,
              fontSize: bucketCount > 18 ? '9px' : '11px',
            },
          },
          axisBorder: { color: gridBorder },
          axisTicks: { color: gridBorder },
        },
    yaxis: mobile
      ? {
          title: { text: 'Projects', style: { color: textSecondary, fontWeight: 500 } },
          labels: { style: { colors: textSecondary, fontSize: '10px' } },
          forceNiceScale: true,
        }
      : {
          title: { text: 'Projects', style: { color: textSecondary, fontWeight: 500 } },
          labels: { style: { colors: textSecondary, fontSize: '11px' } },
          forceNiceScale: true,
        },
    grid: {
      borderColor: gridBorder,
      strokeDashArray: 3,
      ...(mobile ? { padding: { left: 8, right: 12 } } : {}),
    },
    legend: {
      position: mobile ? 'bottom' : 'top',
      horizontalAlign: mobile ? 'center' : 'left',
      markers: { radius: 3 },
      labels: { colors: textPrimary },
      fontSize: mobile ? '11px' : '12px',
    },
    tooltip: {
      theme: dark ? 'dark' : 'light',
      shared: true,
      intersect: false,
      y: { formatter: (val: number) => `${val} project${val === 1 ? '' : 's'}` },
    },
    noData: { text: 'No projects match this filter' },
  }

  if (withHeader) {
    options.title = {
      text: chartTitle.value,
      align: 'left',
      margin: 4,
      style: { fontSize: '14px', fontWeight: 600, color: textPrimary },
    }
    options.subtitle = {
      text: chartSubtitle.value,
      align: 'left',
      offsetY: 22,
      style: { fontSize: '11px', color: textSecondary },
    }
  }

  return options
}

const inlineChartOptions = computed(() =>
  buildChartOptions(
    displayChartModel.value,
    chartHeight.value,
    isMobile.value,
    !isMobile.value,
  ),
)

const fullscreenChartOptions = computed(() =>
  buildChartOptions(chartModel.value, fullscreenChartHeight.value, true, false),
)

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
  if (!trackerExportProjects.value.length) {
    ElMessage.warning('No projects match the selected programme and region filters')
    return
  }

  downloading.value = true
  try {
    const exportIds = new Set(trackerExportProjects.value.map((p) => Number(p.id)))

    const [projRes, locRes, reportRes, targetRes] = await Promise.all([
      getSettlementListByCounty({
        model: 'project',
        searchField: 'title',
        searchKeyword: '',
        filters: [],
        filterValues: [],
        associated_multiple_models: ['activity', 'project_contractor', 'disbursement'],
        returnAll: true,
        excludeGeom: true,
        fields: [
          'id',
          'title',
          'project_code',
          'status',
          'description',
          'start_date',
          'end_date',
          'cost',
          'region',
          'updatedAt',
        ],
      } as any),
      getSettlementListByCounty({
        model: 'project_location',
        searchField: 'location_name',
        searchKeyword: '',
        filters: [],
        filterValues: [],
        associated_multiple_models: ['county', 'subcounty', 'ward', 'settlement'],
        returnAll: true,
        excludeGeom: true,
        excludeGeomAssoc: true,
      } as any),
      getSettlementListByCounty({
        model: 'indicator_category_report',
        searchField: 'comments',
        searchKeyword: '',
        filters: ['project_id'],
        filterValues: [[...exportIds]],
        returnAll: true,
        excludeGeom: true,
        fields: [
          'id',
          'project_id',
          'project_location_id',
          'indicator_category_id',
          'cumProgress',
          'progress',
          'status',
          'date',
        ],
      } as any),
      getSettlementListByCounty({
        model: 'indicator_target',
        searchField: 'notes',
        searchKeyword: '',
        filters: ['project_id', 'fiscal_year'],
        filterValues: [[...exportIds], [getMonitoringFiscalYear()]],
        associated_multiple_models: ['indicator_category'],
        returnAll: true,
        fields: [
          'id',
          'project_id',
          'project_location_id',
          'indicator_category_id',
          'fiscal_year',
          'scope_type',
          'target_value',
          'target_kind',
        ],
      } as any),
    ])

    const allProjects = Array.isArray((projRes as any)?.data) ? (projRes as any).data : []
    const scopedProjects = allProjects.filter((p: any) => exportIds.has(Number(p.id)))
    const allLocations = Array.isArray((locRes as any)?.data) ? (locRes as any).data : []
    const scopedLocations = allLocations.filter((loc: any) =>
      exportIds.has(Number(loc.project_id ?? loc.project?.id)),
    )
    const allReports = Array.isArray((reportRes as any)?.data) ? (reportRes as any).data : []
    const scopedReports = allReports.filter((report: any) =>
      exportIds.has(Number(report.project_id ?? report.project?.id)),
    )
    const allTargets = Array.isArray((targetRes as any)?.data) ? (targetRes as any).data : []
    const scopedTargets = allTargets.filter((target: any) =>
      exportIds.has(Number(target.project_id)),
    )

    const workbook = buildRegionalTrackerWorkbook(
      scopedProjects,
      scopedLocations,
      counties.value,
      scopedReports,
      scopedTargets,
    )
    if (!workbook.sheetNames.length) {
      ElMessage.warning('No regional projects match the current filter')
      return
    }

    const projectCount = workbook.projectCount
    const fileName = trackerExportFileName.value

    const blob = await writeXlsxFile(workbook.sheets as any, {
      sheets: workbook.sheetNames,
      columns: workbook.sheetNames.map((name) =>
        name === 'SUMMARY' ? summaryColumnWidths() : trackerColumnWidths(),
      ),
    } as any)

    const fixedBlob = await fixXlsxWorkbookSheetNames(blob as Blob)
    saveAs(fixedBlob, fileName)

    ElMessage.success(
      `Downloading ${trackerExportUi.value.shortLabel} tracker — ${projectCount} project(s) across ${workbook.sheetNames.length - 1} region sheet(s) + summary`,
    )
    trackerExportDialogVisible.value = false
  } catch (error) {
    console.error('Failed to build regional tracker export:', error)
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
          <template v-if="isMobile">
            <el-select v-model="stackDimension" size="small" class="chart-mobile-select">
              <el-option label="Programme" value="programme" />
              <el-option label="Component" value="component" />
              <el-option label="Status" value="status" />
              <el-option label="Scope" value="scope" />
            </el-select>
            <el-select v-model="viewMode" size="small" class="chart-mobile-select">
              <el-option label="Chart" value="chart" />
              <el-option label="Table" value="table" />
              <el-option label="Map" value="map" />
            </el-select>
          </template>
          <template v-else>
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
          </template>

          <el-tooltip :content="trackerExportUi.tooltip" placement="top">
            <el-button
              size="small"
              type="primary"
              :icon="Download"
              :loading="downloading"
              :disabled="!projects.length"
              @click="openTrackerExportDialog"
            />
          </el-tooltip>
        </div>
      </div>

      <div v-if="!isMobile" class="chart-filter-row">
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
          placeholder="All constituencies"
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

      <div v-else class="chart-filter-row chart-filter-row--mobile">
        <el-button size="small" @click="chartFiltersOpen = true">
          <Icon icon="mdi:filter-variant" :size="16" class="chart-filter-btn-icon" />
          Filters
          <span v-if="hasActiveFilters" class="chart-filter-dot"></span>
        </el-button>

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

      <el-drawer
        v-model="chartFiltersOpen"
        title="Chart filters"
        :size="isMobile ? '95%' : '420px'"
        class="chart-filters-drawer"
        destroy-on-close
      >
        <div class="chart-filters-body">
          <div class="chart-filters-field">
            <label class="chart-filters-label">County</label>
            <el-select
              v-model="selectedCounty"
              clearable
              filterable
              placeholder="All counties"
              class="chart-filters-control"
            >
              <el-option v-for="c in counties" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
          </div>

          <div class="chart-filters-field">
            <label class="chart-filters-label">Constituency</label>
            <el-select
              v-model="selectedSubcounty"
              clearable
              filterable
              placeholder="All constituencies"
              class="chart-filters-control"
              :disabled="selectedCounty == null"
            >
              <el-option v-for="s in subcounties" :key="s.id" :label="s.name" :value="s.id" />
            </el-select>
          </div>

          <div class="chart-filters-field">
            <label class="chart-filters-label">Ward</label>
            <el-select
              v-model="selectedWard"
              clearable
              filterable
              placeholder="All wards"
              class="chart-filters-control"
              :disabled="selectedSubcounty == null"
            >
              <el-option v-for="w in wards" :key="w.id" :label="w.name" :value="w.id" />
            </el-select>
          </div>

          <div class="chart-filters-field">
            <label class="chart-filters-label">Programme</label>
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
              class="chart-filters-control"
            />
          </div>
        </div>

        <div class="chart-filters-actions">
          <el-button v-if="hasActiveFilters" text @click="resetFilters">Clear</el-button>
          <el-button type="primary" @click="chartFiltersOpen = false">Done</el-button>
        </div>
      </el-drawer>

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
          <div class="map-view">
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

            <div class="map-chart-wrap">
              <v-chart
                :key="registeredMapName"
                class="summary-map"
                :option="mapOptions"
                :style="{ height: `${mapChartHeight}px` }"
                autoresize
              />
              <div
                v-if="mapRankingColumns.split"
                class="map-rank-divider"
                :style="mapRankDividerStyle"
                aria-hidden="true"
              ></div>
            </div>

            <p v-if="mapTotals.unmapped.length" class="map-note">
              No boundary to shade:
              {{ mapTotals.unmapped.map((u) => `${u.name} (${u.value})`).join(', ') }}
            </p>

            <p v-if="chartModel.foldedCount" class="map-note">
              Smallest {{ chartModel.foldedCount }}
              {{ DIMENSION_LABEL[stackDimension].toLowerCase() }} grouped as “Other”.
            </p>

            <p class="map-note">
              Use the chart toolbar to download the map and ranking together.
              <template v-if="showDots">
                Dot colour is {{ DIMENSION_LABEL[stackDimension].toLowerCase() }}.
              </template>
            </p>
          </div>
        </template>
      </template>

      <div v-else class="chart-canvas-wrap">
        <apexchart
          type="bar"
          :height="chartHeight"
          width="100%"
          :options="inlineChartOptions"
          :series="displayChartModel.series"
        />
        <div v-if="mobileChartTruncated" class="chart-mobile-expand">
          <p class="chart-mobile-expand-note">
            Top {{ MOBILE_CHART_TOP_N }} of {{ chartModel.countyNames.length }}
            {{ AXIS_LABEL[axisLevel].toLowerCase() }}s by project count
          </p>
          <el-button size="small" type="primary" plain @click="chartFullscreenOpen = true">
            <Icon icon="mdi:fullscreen" :size="16" class="chart-filter-btn-icon" />
            View all
          </el-button>
        </div>
      </div>
    </el-card>

    <el-drawer
      v-model="chartFullscreenOpen"
      :title="chartTitle"
      direction="btt"
      size="100%"
      class="chart-fullscreen-drawer"
      destroy-on-close
    >
      <div class="chart-fullscreen-body">
        <p class="chart-fullscreen-subtitle">{{ chartSubtitle }}</p>
        <div class="chart-fullscreen-scroll">
          <apexchart
            type="bar"
            :height="fullscreenChartHeight"
            width="100%"
            :options="fullscreenChartOptions"
            :series="chartModel.series"
          />
        </div>
        <div class="chart-fullscreen-actions">
          <el-button type="primary" @click="chartFullscreenOpen = false">Close</el-button>
        </div>
      </div>
    </el-drawer>

    <el-drawer
      v-model="trackerExportDialogVisible"
      :title="trackerExportUi.dialogTitle"
      :size="isMobile ? '95%' : '480px'"
      :close-on-click-modal="!downloading"
      class="tracker-export-drawer"
      destroy-on-close
    >
      <div class="tracker-export-body">
        <p class="tracker-export-intro">
          {{ trackerExportUi.intro }}
        </p>

        <div class="tracker-export-field">
          <label class="tracker-export-label">Programme</label>
          <el-tree-select
            v-model="trackerExportProgrammeId"
            :data="programmeTreeData"
            clearable
            filterable
            check-strictly
            default-expand-all
            node-key="value"
            value-key="value"
            :props="{ label: 'label', children: 'children', value: 'value' }"
            placeholder="All programmes (SUD & KISIP)"
            class="tracker-export-control"
          />
        </div>

        <div class="tracker-export-field">
          <label class="tracker-export-label">Regions</label>
          <el-select
            v-model="trackerExportRegions"
            multiple
            clearable
            filterable
            collapse-tags
            collapse-tags-tooltip
            placeholder="All regions"
            class="tracker-export-control"
          >
            <el-option
              v-for="option in trackerRegionOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>

        <p class="tracker-export-summary">
          <strong>{{ trackerExportProjects.length }}</strong>
          project(s) will be exported
          <span v-if="trackerExportProgrammeFamily">
            as <strong>{{ trackerExportProgrammeFamily }}</strong> regional tracker
          </span>
          <span v-if="!trackerExportProjects.length"> — adjust the filters above</span>
          <br />
          <span class="tracker-export-filename">File: {{ trackerExportFileName }}</span>
        </p>
      </div>

      <div class="tracker-export-actions">
        <el-button :icon="Close" @click="trackerExportDialogVisible = false" :disabled="downloading">
          Cancel
        </el-button>
        <el-button
          type="primary"
          :icon="Download"
          :loading="downloading"
          :disabled="!trackerExportProjects.length"
          @click="downloadProjectList"
        >
          {{ trackerExportUi.downloadLabel }}
        </el-button>
      </div>
    </el-drawer>
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

.chart-filter-row--mobile {
  justify-content: space-between;
}

.chart-filter-btn-icon {
  margin-right: 4px;
}

.chart-filter-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-left: 6px;
  border-radius: 50%;
  background: var(--el-color-primary);
  vertical-align: middle;
}

.chart-mobile-select {
  width: 118px;
  flex-shrink: 0;
}

.chart-canvas-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.chart-mobile-expand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.chart-mobile-expand-note {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.chart-fullscreen-drawer :deep(.el-drawer__body) {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding-top: 0;
}

.chart-fullscreen-body {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.chart-fullscreen-subtitle {
  margin: 0 0 10px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.chart-fullscreen-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.chart-fullscreen-actions {
  flex-shrink: 0;
  padding-top: 12px;
  margin-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.chart-fullscreen-actions :deep(.el-button) {
  width: 100%;
}

.chart-filters-drawer :deep(.el-drawer__body) {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding-top: 0;
}

.chart-filters-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.chart-filters-field {
  margin-bottom: 16px;
}

.chart-filters-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.chart-filters-control {
  width: 100%;
}

.chart-filters-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  flex-shrink: 0;
  padding-top: 12px;
  margin-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.chart-filters-actions :deep(.el-button) {
  width: 100%;
  margin-left: 0;
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

/* Compound map + ranking chart (single ECharts canvas for export). */
.map-view {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.map-chart-wrap {
  position: relative;
}

.map-rank-divider {
  position: absolute;
  z-index: 10;
  width: 2px;
  pointer-events: none;
  transform: translateX(-50%);
}

.summary-map {
  width: 100%;
  min-height: 340px;
}

.map-dots-toggle {
  display: block;
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

.map-note {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.tracker-export-intro {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.tracker-export-drawer :deep(.el-drawer__body) {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding-top: 0;
}

.tracker-export-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.tracker-export-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
  flex-shrink: 0;
  padding-top: 12px;
  margin-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.tracker-export-field {
  margin-bottom: 16px;
}

.tracker-export-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.tracker-export-control {
  width: 100%;
}

.tracker-export-summary {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.tracker-export-filename {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 768px) {
  .tracker-export-body {
    padding-right: 0;
  }

  .tracker-export-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tracker-export-actions :deep(.el-button) {
    width: 100%;
    margin-left: 0;
  }
}
</style>

<!-- Poppers are teleported to <body>, so they can't be reached from a scoped block -->
<style>
.count-hint-popper.el-popper {
  max-width: 240px;
  line-height: 1.45;
}
</style>
