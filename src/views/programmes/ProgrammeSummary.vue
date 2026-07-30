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
} from 'element-plus'
import { Icon } from '@/components/Icon'
import { useAppStoreWithOut } from '@/store/modules/app'
import { getProgrammesList, getComponentsList } from '@/api/project-locations-optimized'
import { getCountiesList, getSubcountiesList, getWardsList } from '@/api/settlements-optimized'
import { getSettlementListByCounty } from '@/api/settlements'
import { getProgrammeDescendantIds, type ProgrammeRecord } from '@/utils/programmeValidation'
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
const showChartTable = ref(false)

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

const isDark = computed(() => appStore.getIsDark)

const exportBaseName = computed(() => `projects-by-${axisLevel.value}`)

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
      background: 'transparent',
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
        export: {
          csv: { filename: exportBaseName.value, headerCategory: AXIS_LABEL[axisLevel.value] },
          svg: { filename: exportBaseName.value },
          png: { filename: exportBaseName.value },
        },
      },
    },
    theme: { mode: dark ? 'dark' : 'light' },
    colors: dark ? PALETTE_DARK : PALETTE_LIGHT,
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
          <h3 class="chart-title">Projects by {{ AXIS_LABEL[axisLevel].toLowerCase() }}</h3>
          <p class="chart-subtitle">
            Stacked by {{ DIMENSION_LABEL[stackDimension].toLowerCase() }} ·
            {{ chartModel.total }} of {{ totals.projectCount }} projects shown
            <template v-if="projectsWithoutLocation">
              ({{ projectsWithoutLocation }} have no location)
            </template>
            <template v-if="chartModel.foldedCount">
              · smallest {{ chartModel.foldedCount }} grouped as “Other”
            </template>
          </p>
        </div>

        <div class="chart-toolbar-controls">
          <el-radio-group v-model="stackDimension" size="small">
            <el-radio-button label="programme">Programme</el-radio-button>
            <el-radio-button label="component">Component</el-radio-button>
            <el-radio-button label="status">Status</el-radio-button>
            <el-radio-button label="scope">Scope</el-radio-button>
          </el-radio-group>

          <el-button
            size="small"
            :type="showChartTable ? 'primary' : 'default'"
            @click="showChartTable = !showChartTable"
          >
            {{ showChartTable ? 'Chart' : 'Table' }}
          </el-button>

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
</style>
