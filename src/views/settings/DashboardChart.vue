<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
// @ts-nocheck
import { useI18n } from '@/hooks/web/useI18n'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { Plus, Download, Filter, Edit, CopyDocument, Back, Delete, InfoFilled } from '@element-plus/icons-vue'
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  ElPagination, ElTooltip, ElSelect, ElOption, ElSwitch, ElTable, ElTableColumn,
  ElRow, ElCol, ElForm, ElFormItem, ElInput, ElCheckbox, ElPopconfirm, ElCard,
  ElDrawer, ElMessageBox, ElMessage, ElButton, ElRadioGroup, ElRadioButton,
  ElDivider, FormRules,
} from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import type { FormInstance } from 'element-plus'
import { getModelSpecs } from '@/api/fields'
import { loadDashboardFilterFields } from '@/utils/dashboardFilterFields'
import { getUniqueFieldValues } from '@/api/households'
import { getChartTypeIconName } from '@/utils/chartTypeIcons'
import { Icon } from '@/components/Icon'
import DownloadAll from '@/views/Components/DownloadAll.vue'
import PermissionWrapper from '@/components/PermissionWrapper.vue'
import { isDashboardSettingsAdmin } from '@/utils/documentPermissions'
import {
  DEFAULT_DASHBOARD_DATA_CATEGORY,
  isInterventionCategory,
  isStatusCategory,
  normalizeDataCategory,
} from '@/utils/dashboardCategory'
import { getProgrammesList, getComponentsList } from '@/api/project-locations-optimized'
import { sortProgrammeRecordsByFamily, sortProgrammeSelectOptions } from '@/utils/programmeComponentTree'
import type { ProgrammeRecord } from '@/utils/programmeValidation'

// ─── Store / auth ─────────────────────────────────────────────────────────────
const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)
const router = useRouter()
const { t } = useI18n()
const isMobile = computed(() => appStore.getMobile)

// ─── Chart type definitions — single source of truth ─────────────────────────
// category: 'both' | 'status' | 'intervention'
const CHART_DEFS = [
  { id: 1,  label: 'Simple Bar',          icon: 'material-symbols:bar-chart',              desc: 'Count or sum per category (horizontal bars)',                              category: 'both',   householdsOnly: false },
  { id: 2,  label: 'Multiple Bar',        icon: 'material-symbols:grouped-bar-chart',      desc: 'Side-by-side bars — requires a series/breakdown',                          category: 'status', householdsOnly: false },
  { id: 3,  label: 'Pie',                 icon: 'material-symbols:pie-chart',              desc: 'Proportions of a whole as slices',                                         category: 'both',   householdsOnly: false },
  { id: 4,  label: 'Stacked Bar (100%)',  icon: 'material-symbols:full-stacked-bar-chart', desc: 'Percentage breakdown — requires a series/breakdown',                        category: 'status', householdsOnly: false },
  { id: 5,  label: 'Line Chart',          icon: 'material-symbols:show-chart',             desc: 'Trend over a date/time field',                                             category: 'both',   householdsOnly: false },
  { id: 7,  label: 'Map Chart',           icon: 'material-symbols:map',                    desc: 'Values shaded on a Kenya county map',                                      category: 'status', householdsOnly: false },
  { id: 8,  label: 'Population Pyramid',  icon: 'material-symbols:bar-chart',              desc: 'Male / female age distribution (fixed — Households)',                       category: 'status', householdsOnly: true  },
  { id: 9,  label: 'Stacked Bar (Abs)',   icon: 'material-symbols:stacked-bar-chart',      desc: 'Stacked absolute totals — requires a series',                              category: 'status', householdsOnly: false },
  { id: 10, label: 'Donut',               icon: 'material-symbols:donut-large',            desc: 'Pie chart with total shown in the centre',                                 category: 'both',   householdsOnly: false },
  { id: 11, label: 'Word Map',            icon: 'material-symbols:grid-view',              desc: 'Category sizes as proportional tiles',                                     category: 'both',   householdsOnly: false },
  { id: 12, label: 'Multi-variable Line', icon: 'material-symbols:multiline-chart',        desc: 'Multiple numeric metrics as lines over time',                              category: 'status', householdsOnly: false },
  { id: 13, label: 'Scatter Plot',        icon: 'material-symbols:scatter-plot',           desc: 'Each record as a dot — correlate two numeric fields',                      category: 'both',   householdsOnly: false },
  { id: 14, label: 'Heatmap',             icon: 'material-symbols:gradient',               desc: 'Matrix grid — X categories × series breakdown, colour = intensity',        category: 'status', householdsOnly: false },
  { id: 15, label: 'Gauge (Radial)',      icon: 'material-symbols:speed',                  desc: 'Percentage of total shown as a radial arc — use filters to set numerator', category: 'both',   householdsOnly: false },
]

/**
 * Per-chart-type axis configuration.
 * Drives exactly which fields appear in Step 2 of the form.
 *   xAxis:    show X axis (group-by) picker
 *   yAxis:    show Y axis (measure) picker
 *   series:   'none' | 'optional' | 'required'
 *   timeAxis: use time_field picker instead of X axis
 *   metrics:  use metric_fields multi-picker (type 12)
 *   fixed:    no config needed (type 8 pyramid)
 *   mapChart: X is fixed to county — no x picker
 */
const CHART_TYPE_CONFIG: Record<number, {
  xAxis: boolean; yAxis: boolean; yAxisField?: boolean; noAgg?: boolean; series: 'none'|'optional'|'required'
  timeAxis?: boolean; metrics?: boolean; fixed?: boolean; mapChart?: boolean
  xLabel?: string; yLabel?: string; xHint?: string; yHint?: string; seriesLabel?: string; seriesHint?: string
}> = {
  // Simple Bar — group by field, measure, optional series breakdown
  1:  { xAxis: true,  yAxis: true,  series: 'optional',
        xLabel: 'Group by (X axis)',       yLabel: 'Measure (Y axis)',
        xHint: 'Each unique value = one bar.',
        seriesLabel: 'Break down by (optional)',
        seriesHint: 'Optional: splits each bar into groups.' },
  // Multiple Bar — categories + required series (side-by-side bars)
  2:  { xAxis: true,  yAxis: true,  series: 'required',
        xLabel: 'X categories',            yLabel: 'Measure',
        xHint: 'Groups along the X axis.',
        seriesLabel: 'Bar groups — series (required)',
        seriesHint: 'Required: one bar group per unique value.' },
  // Pie — slice by field; aggregation only (field always = count of records)
  3:  { xAxis: true,  yAxis: true,  yAxisField: false, series: 'none',
        xLabel: 'Slice by',                yLabel: 'Slice size (how to measure)',
        xHint: 'Each unique value = one pie slice.' },
  // Stacked Bar 100% — categories + required series segments
  4:  { xAxis: true,  yAxis: true,  series: 'required',
        xLabel: 'X categories',            yLabel: 'Measure',
        xHint: 'Categories stacked to 100%.',
        seriesLabel: 'Stack segments (required)',
        seriesHint: 'Required: creates segments inside each stack.' },
  // Line Chart — time axis + measure + optional series (multiple lines)
  5:  { xAxis: false, yAxis: true,  series: 'optional', timeAxis: true,
        yLabel: 'Measure (Y axis)',
        xHint: 'Pick the date or year field for the time axis.',
        seriesLabel: 'Separate lines by (optional)',
        seriesHint: 'Optional: one line per unique value.' },
  // Map — county fixed as X; just pick the measure per county
  7:  { xAxis: false, yAxis: true,  series: 'none',     mapChart: true,
        yLabel: 'Value per county',
        yHint: 'What to count or sum for each county on the map.' },
  // Population Pyramid — completely fixed, no config
  8:  { xAxis: false, yAxis: false, series: 'none',     fixed: true },
  // Stacked Bar Abs — categories + required series segments
  9:  { xAxis: true,  yAxis: true,  series: 'required',
        xLabel: 'X categories',            yLabel: 'Measure',
        xHint: 'Categories stacked (absolute values).',
        seriesLabel: 'Stack segments (required)',
        seriesHint: 'Required: creates segments inside each stack.' },
  // Donut — identical to Pie: slice by field + aggregation only
  10: { xAxis: true,  yAxis: true,  yAxisField: false, series: 'none',
        xLabel: 'Slice by',                yLabel: 'Slice size (how to measure)',
        xHint: 'Each unique value = one donut slice.' },
  // Word Map — tile by field + aggregation only (same pattern as pie/donut)
  11: { xAxis: true,  yAxis: true,  yAxisField: false, series: 'none',
        xLabel: 'Tile by',                 yLabel: 'Tile size (how to measure)',
        xHint: 'Each unique value = one tile. Comma-separated values are split into independent tiles (e.g. "A, B" counts as A and B).' },
  // Multi-variable Line — time axis + multiple numeric metrics
  12: { xAxis: false, yAxis: false, series: 'none',     timeAxis: true, metrics: true,
        xHint: 'Date or year field for the time axis.' },
  // Scatter Plot — X numeric field, Y numeric field, optional series colour grouping
  13: { xAxis: true,  yAxis: true,  noAgg: true,  series: 'optional',
        xLabel: 'X axis (numeric field)',   yLabel: 'Y axis (numeric field)',
        xHint: 'Horizontal axis — pick a numeric field. Each row becomes one dot.',
        yHint: 'Vertical axis — pick a numeric field.',
        seriesLabel: 'Colour groups (optional)',
        seriesHint: 'Optional: dots coloured by each unique value of this field.' },
  // Heatmap — X categories + required series; colour intensity = measure
  14: { xAxis: true,  yAxis: true,  series: 'required',
        xLabel: 'X categories',            yLabel: 'Measure (colour intensity)',
        xHint: 'Each unique value = one column in the matrix.',
        seriesLabel: 'Row breakdown (required)',
        seriesHint: 'Required: one row per unique value — creates the matrix rows.' },
  // Gauge — measure only; filters define numerator; total is denominator
  15: { xAxis: false, yAxis: true,  series: 'none',
        yLabel: 'Measure (what to count / sum)',
        yHint: 'The total count/sum across all records is the denominator. Use chart filters to define the numerator subset.' },
}

const MODEL_OPTIONS = [
  { value: 'settlement',            label: 'Settlement' },
  { value: 'settlement_population', label: 'Settlement Population' },
  { value: 'grievance',             label: 'Grievances' },
  { value: 'households',            label: 'Household' },
  { value: 'project_location',      label: 'Projects' },
  { value: 'project_beneficiary',   label: 'Beneficiaries' },
  { value: 'education_facility',    label: 'Schools' },
  { value: 'health_facility',       label: 'Hospitals' },
  { value: 'road',                  label: 'Roads' },
]

const AGGREGATION_OPTIONS = [
  { value: 'sum',   label: 'Sum' },
  { value: 'count', label: 'Count' },
  { value: 'AVG',   label: 'Average' },
]

const EXCLUDE_FIELDS = new Set(['title', 'name', 'geom', 'code', 'createdBy', 'updatedAt', 'description', 'createdAt'])
/** Fields unsuitable as pie/donut/treemap slice axes — grouping by id creates one tile per row. */
const EXCLUDE_SLICE_AXES = new Set(['id'])

// ─── API constants ────────────────────────────────────────────────────────────
const API_MODEL = 'dashboard_section_chart'
const ASSOC_MODELS = ['dashboard_section', 'indicator']
const NESTED_MODELS = ['dashboard_section', 'dashboard']

// ─── Table / list state ───────────────────────────────────────────────────────
const loading = ref(true)
const tableDataList = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const pSize = ref(10)
const searchKey = ref('')

const charts_filtered = computed(() => {
  const q = searchKey.value.toLowerCase()
  return q ? tableDataList.value.filter(r => r.title?.toLowerCase().includes(q)) : tableDataList.value
})

const sortByDashboard = (a: any, b: any) => {
  const ta = (a?.dashboard_section?.dashboard?.title || '').toLowerCase()
  const tb = (b?.dashboard_section?.dashboard?.title || '').toLowerCase()
  return ta < tb ? -1 : ta > tb ? 1 : 0
}

const chartTypeLabel = (type: number) => CHART_DEFS.find(d => d.id === type)?.label || `Type ${type}`

const updatePSize = () => { pSize.value = window.innerWidth <= 768 ? 5 : 10 }

// ─── Toolbar filter dropdowns ─────────────────────────────────────────────────
const dashboardOptions = ref<any[]>([])
const allSectionOptions = ref<any[]>([])
const toolbarSectionOptions = ref<any[]>([])  // filtered for toolbar select
const selectedDashIds = ref<any[]>([])
const selectedSecIds = ref<any[]>([])

const getDefaultFilters = () =>
  isDashboardSettingsAdmin(userInfo)
    ? { filters: [] as string[], filterValues: [] as any[][] }
    : { filters: ['createdBy'], filterValues: [[userInfo.id]] }

const buildListFilters = () => {
  const { filters, filterValues } = getDefaultFilters()
  const dashIds = selectedDashIds.value
  let secIds = selectedSecIds.value

  if (dashIds.length) {
    const secForDash = allSectionOptions.value
      .filter(o => dashIds.includes(o.dashboard_id))
      .map(o => o.value)
    secIds = secIds.length ? secIds.filter(id => secForDash.includes(id)) : secForDash
  }
  if (secIds.length) {
    filters.push('dashboard_section_id')
    filterValues.push(secIds)
  }
  return { filters, filterValues }
}

const loadChartList = async ({ silent = false } = {}) => {
  if (!silent) loading.value = true
  try {
    const { filters, filterValues } = buildListFilters()
    const res = await getSettlementListByCounty({
      limit: pSize.value, page: currentPage.value, curUser: 1, model: API_MODEL,
      searchField: 'title', searchKeyword: '', assocModel: '',
      filters, filterValues,
      associated_multiple_models: ASSOC_MODELS, nested_models: NESTED_MODELS,
    })
    tableDataList.value = res.data || []
    total.value = res.total
  } finally {
    if (!silent) loading.value = false
  }
}

const loadLookups = async () => {
  const [dashRes, secRes] = await Promise.all([
    getCountyListApi({ params: { pageIndex: 1, limit: 100, curUser: 1, model: 'dashboard', searchField: 'title', searchKeyword: '', sort: 'ASC' } }),
    getCountyListApi({ params: { pageIndex: 1, limit: 100, curUser: 1, model: 'dashboard_section', searchField: 'title', searchKeyword: '', sort: 'ASC' } }),
  ])
  dashboardOptions.value = dashRes.data.map((d: any) => ({ value: d.id, label: d.title, type: d.type }))
  const secs = secRes.data.map((d: any) => ({ value: d.id, label: d.title, dashboard_id: d.dashboard_id }))
  allSectionOptions.value = secs
  toolbarSectionOptions.value = [...secs]
}

onMounted(async () => {
  window.addEventListener('resize', updatePSize)
  updatePSize()
  await loadLookups()
  await loadProgrammeComponentHierarchy()
  await loadChartList()
})
onUnmounted(() => window.removeEventListener('resize', updatePSize))

const handleDashboardFilter = async (ids: any[]) => {
  selectedDashIds.value = Array.isArray(ids) ? ids : ids ? [ids] : []
  toolbarSectionOptions.value = selectedDashIds.value.length
    ? allSectionOptions.value.filter(o => selectedDashIds.value.includes(o.dashboard_id))
    : [...allSectionOptions.value]
  const valid = new Set(toolbarSectionOptions.value.map(o => o.value))
  selectedSecIds.value = selectedSecIds.value.filter(id => valid.has(id))
  currentPage.value = 1
  await loadChartList()
}

const handleSectionFilter = async () => { currentPage.value = 1; await loadChartList() }

const handleClearFilters = async () => {
  selectedDashIds.value = []
  selectedSecIds.value = []
  toolbarSectionOptions.value = [...allSectionOptions.value]
  currentPage.value = 1
  await loadChartList()
}

const onPageChange = async (p: number) => { currentPage.value = p; await loadChartList() }
const onSizeChange = async (s: number) => { pSize.value = s; await loadChartList() }
const goBack = () => router.back()
const handleDownload = () => {
  exportFromJSON({ data: tableDataList.value, fileName: 'charts.csv', exportType: exportFromJSON.types.csv })
}

// ─── Drawer state ──────────────────────────────────────────────────────────────
const drawerVisible = ref(false)
const drawerLoading = ref(false)
const drawerLoadingText = ref('Please wait...')
const activeStep = ref(0)
const isEditing = ref(false)
const drawerTitle = computed(() => isEditing.value ? 'Edit Chart' : 'Add Chart')

// Section options scoped to the form's selected dashboard
const drawerSectionOptions = ref<any[]>([])

const handleFormDashboardChange = (dashId: string) => {
  drawerSectionOptions.value = allSectionOptions.value.filter(o => o.dashboard_id === dashId)
  ruleForm.dashboard_section_id = ''
}

// ─── Form ─────────────────────────────────────────────────────────────────────
const ruleFormRef = ref<FormInstance>()

const ruleForm = reactive({
  id:                   '',
  title:                '',
  dashboard_id:         '',
  dashboard_section_id: '',
  description:          '',
  iconColor:            '',
  icon:                 '',
  category:             DEFAULT_DASHBOARD_DATA_CATEGORY,
  type:                 null as number | null,
  card_model:           '',
  metric_fields:        [] as string[],
  time_field:           'createdAt',
  indicator_id:         null as number[] | null,
  ignore_empty:         true,
  filtered:             false,
  filters:              null as any[] | null,
  // ── Axis-based config ────────────────────────────────────────────────────────
  x_axis:               null as { field: string; label: string } | null,
  y_axis:               null as { field: string; aggregation: string; label: string } | null,
  series_field:         null as { field: string; label: string } | null,
})

const rules = reactive<FormRules>({
  title:                [{ required: true, message: 'Title is required', trigger: 'blur' }, { min: 3, message: 'Min 3 characters', trigger: 'blur' }],
  dashboard_id:         [{ required: true, message: 'Select a dashboard', trigger: 'change' }],
  dashboard_section_id: [{ required: true, message: 'Select a section', trigger: 'change' }],
  description:          [{ required: true, message: 'Description is required', trigger: 'blur' }],
  category:             [{ required: true, message: 'Select Status or Intervention', trigger: 'change' }],
  type:                 [{ required: true, message: 'Select a chart type', trigger: 'change' }],
})

// ─── Derived from form ─────────────────────────────────────────────────────────
const activeChartDef = computed(() => CHART_DEFS.find(d => d.id === ruleForm.type) ?? null)
const isStatus = computed(() => isStatusCategory(ruleForm.category))
const isIntervention = computed(() => isInterventionCategory(ruleForm.category))
const showChartFilters = computed(() => {
  if (!ruleForm.card_model) return false
  if (isStatus.value) return true
  return isIntervention.value && ruleForm.card_model === 'indicator_category_report'
})

const lastChartCategory = ref('')

const chartCategorySelection = computed({
  get() {
    const normalized = normalizeDataCategory(ruleForm.category)
    if (normalized === 'Status' || normalized === 'Intervention') return normalized
    return DEFAULT_DASHBOARD_DATA_CATEGORY
  },
  set(val: string) {
    void onChartDataSourceChange(val)
  },
})

const syncLastChartCategory = () => {
  lastChartCategory.value = normalizeDataCategory(ruleForm.category) || ruleForm.category || ''
}

const dataSourceHint = computed(() => {
  if (isInterventionCategory(ruleForm.category)) {
    return 'Visualises indicator report data — trends over time, breakdowns by county, or comparisons across indicator categories.'
  }
  if (isStatusCategory(ruleForm.category)) {
    return 'Charts counts or aggregates from a database table — e.g. projects by county, households by settlement, or beneficiaries by programme.'
  }
  return 'Choose whether this chart uses M&E indicator report data or entity table records.'
})

const availableChartTypes = computed(() => {
  if (!ruleForm.category) return CHART_DEFS
  const cat = ruleForm.category.toLowerCase()
  return CHART_DEFS.filter(d => {
    // Households-only types only appear when card_model is already set to households
    // (or show them always but lock the entity select)
    return d.category === 'both' || d.category === cat
  })
})

// Legacy compat — kept for the old axis-based computed below
const showFieldSelect   = computed(() => false) // replaced by showXAxis
const showMetricsSelect = computed(() => showMetrics.value)
const showTimeField     = computed(() => showTimeAxis.value)
const showCategorize    = computed(() => false) // replaced by showSeries

// ── Active chart type config ──────────────────────────────────────────────────
const typeConf = computed(() => ruleForm.type ? (CHART_TYPE_CONFIG[ruleForm.type] ?? null) : null)

const showXAxis    = computed(() => isStatus.value && !!typeConf.value?.xAxis)
const showYAxis    = computed(() => isStatus.value && typeConf.value && (typeConf.value.yAxis || typeConf.value.mapChart))
const showSeries   = computed(() => isStatus.value && typeConf.value?.series !== 'none' && typeConf.value?.series != null)
const seriesRequired = computed(() => typeConf.value?.series === 'required')
const showTimeAxis = computed(() => isStatus.value && !!typeConf.value?.timeAxis)
const showMetrics  = computed(() => isStatus.value && !!typeConf.value?.metrics)
const isFixed        = computed(() => !!typeConf.value?.fixed)
const isMapChart     = computed(() => !!typeConf.value?.mapChart)
// false for pie/donut/treemap (3,10,11) — they only need the aggregation, not a separate Y field picker
const showYAxisField = computed(() => showYAxis.value && typeConf.value?.yAxisField !== false)

// ── Aggregation options (filtered for non-numeric x fields; no count for indicators) ──
const aggregationOptions = computed(() => {
  const field = ruleForm.y_axis?.field
  let opts = AGGREGATION_OPTIONS
  if (!field || field === 'id') {
    opts = AGGREGATION_OPTIONS
  } else {
    const f = fieldSet.value.find(f => f.value === field)
    opts = f?.type === 'STRING' ? AGGREGATION_OPTIONS.filter(a => a.value === 'count') : AGGREGATION_OPTIONS
  }
  if (isIntervention.value) {
    opts = opts.filter(a => a.value !== 'count')
  }
  return opts
})

const allProgrammes = ref<any[]>([])
const allComponentsWithProgramme = ref<any[]>([])
const programmeHierarchyLoaded = ref(false)

const loadProgrammeComponentHierarchy = async () => {
  if (programmeHierarchyLoaded.value) return
  const progRes = await getProgrammesList({ params: {} })
  allProgrammes.value = progRes.data || []
  const allIds = allProgrammes.value.map((p: any) => p.id)
  if (allIds.length) {
    const compRes = await getComponentsList({ params: { programme_ids: allIds.join(',') } })
    allComponentsWithProgramme.value = compRes.data || []
  }
  programmeHierarchyLoaded.value = true
}

const programmeOptionGroupsForFilter = computed(() => {
  const roots = sortProgrammeRecordsByFamily(
    allProgrammes.value as ProgrammeRecord[],
    allProgrammes.value.filter((p: any) => p.parentId == null || p.parentId === '') as ProgrammeRecord[],
  )
  return roots.map((root: any) => ({
    id: root.id,
    label: root.title || root.acronym,
    rootLabel: `${root.title || root.acronym} (all)`,
    children: sortProgrammeSelectOptions(
      allProgrammes.value
        .filter((p: any) => String(p.parentId) === String(root.id))
        .map((p: any) => ({ value: p.id, label: p.title || p.acronym })),
      allProgrammes.value as ProgrammeRecord[],
    ),
  }))
})

const componentOptionGroupsForFilter = computed(() => {
  const programmeById = new Map(allProgrammes.value.map((p: any) => [p.id, p]))
  const groups = new Map<number, { label: string; children: any[] }>()
  for (const c of allComponentsWithProgramme.value) {
    const programme = programmeById.get(c.programme_id)
    if (!programme) continue
    const root = programme.parentId != null && programme.parentId !== ''
      ? programmeById.get(Number(programme.parentId))
      : null
    const label = root
      ? `${root.title || root.acronym} / ${programme.title || programme.acronym}`
      : (programme.title || programme.acronym)
    if (!groups.has(c.programme_id)) groups.set(c.programme_id, { label, children: [] })
    groups.get(c.programme_id)!.children.push({ value: c.id, label: c.title || c.acronym })
  }
  return sortProgrammeSelectOptions(
    Array.from(groups.entries()).map(([programmeId, group]) => ({
      value: programmeId,
      label: group.label,
      children: group.children,
    })),
    allProgrammes.value as ProgrammeRecord[],
  ).map(({ label, children }) => ({ label, children }))
})

// ── Preview sentence ──────────────────────────────────────────────────────────
const axisPreviewSentence = computed(() => {
  if (!isStatus.value || !ruleForm.type || !ruleForm.card_model) return ''
  if (isFixed.value) return 'Population Pyramid — fixed query on Households (age group × gender). No configuration needed.'
  if (isMapChart.value) {
    const agg = ruleForm.y_axis?.aggregation || 'count'
    const entity = MODEL_OPTIONS.find(o => o.value === ruleForm.card_model)?.label || ruleForm.card_model
    return `This map will show the ${agg} of ${entity} records per Kenya county.`
  }
  const entity = MODEL_OPTIONS.find(o => o.value === ruleForm.card_model)?.label || ruleForm.card_model
  const xField = showTimeAxis.value ? (ruleForm.time_field || 'date') : (ruleForm.x_axis?.field || '')
  const agg    = ruleForm.y_axis?.aggregation || 'count'
  const yField = ruleForm.y_axis?.field
  const sField = ruleForm.series_field?.field
  const aggVerb = agg === 'count' ? 'count' : `${agg} of`
  const xPart   = xField ? `grouped by ${xField}` : ''
  const yPart   = yField && yField !== 'id' ? ` [measuring ${aggVerb} ${yField}]` : ''
  const sPart   = sField ? `, split by ${sField}` : ''
  const commaPart = ruleForm.type === 11 && xField
    ? ' (comma-separated values become separate tiles)'
    : ''
  return `This chart will show ${entity} records ${xPart}${commaPart}${yPart}${sPart}.`.replace('  ', ' ')
})

// ── Axis change handlers ──────────────────────────────────────────────────────
const onXAxisChange = (field: string) => {
  ruleForm.x_axis = field ? { field, label: field } : null
}

const onYAxisFieldChange = (field: string) => {
  const agg = ruleForm.y_axis?.aggregation || 'count'
  ruleForm.y_axis = field ? { field, aggregation: agg, label: agg } : null
}

const onYAxisAggChange = (agg: string) => {
  const field = ruleForm.y_axis?.field || 'id'
  ruleForm.y_axis = { field, aggregation: agg, label: agg }
}

const onSeriesFieldChange = (field: string) => {
  ruleForm.series_field = field ? { field, label: field } : null
}

// (aggregationOptions computed is defined above in the axis config block)

// ─── Model field loading ───────────────────────────────────────────────────────
const fieldSet = ref<any[]>([])
const filterFieldSet = ref<any[]>([])
const fieldSetLoading = ref(false)

const loadModelFields = async (selModel: string) => {
  if (!selModel) {
    fieldSet.value = []
    filterFieldSet.value = []
    return
  }
  fieldSetLoading.value = true
  fieldSet.value = []
  filterFieldSet.value = []
  try {
    const [specsRes, filterFields] = await Promise.all([
      getModelSpecs({ model: selModel }),
      loadDashboardFilterFields(selModel),
    ])
    fieldSet.value = (specsRes.data || [])
      .filter((f: any) => !EXCLUDE_FIELDS.has(f.field))
      .map((f: any) => ({ value: f.field, label: f.field, type: f.type }))
    filterFieldSet.value = filterFields
    // Inject virtual county.name option whenever the model has a county_id FK
    if (fieldSet.value.some((f: any) => f.value === 'county_id')) {
      fieldSet.value.unshift({ value: 'county.name', label: 'County / Sub-county / Ward (auto)', type: 'STRING' })
    }
  } catch (e) {
    console.error('loadModelFields:', e)
    ElMessage.error('Could not load fields for this entity')
  } finally {
    fieldSetLoading.value = false
  }
}

const numericFields = computed(() => {
  const numTypes = new Set(['INTEGER', 'BIGINT', 'FLOAT', 'DOUBLE', 'DECIMAL'])
  return fieldSet.value.filter(f => numTypes.has(f.type))
})

/** Slice/tile axis options — exclude id (one tile per row hangs treemap). */
const xAxisFieldOptions = computed(() => {
  const sliceTypes = new Set([3, 10, 11])
  const exclude = sliceTypes.has(Number(ruleForm.type)) ? EXCLUDE_SLICE_AXES : new Set<string>()
  return fieldSet.value.filter(f => !exclude.has(f.value))
})

const timeFields = computed(() => {
  const timeTypes = new Set(['INTEGER', 'DATE', 'DATEONLY'])
  return [
    { value: 'createdAt', label: 'Created at (default)' },
    ...fieldSet.value.filter(f => timeTypes.has(f.type)),
  ]
})

const resetAxisForEntityChange = () => {
  ruleForm.metric_fields = []
  ruleForm.x_axis = null
  ruleForm.series_field = null
  const conf = ruleForm.type ? CHART_TYPE_CONFIG[ruleForm.type] : null
  if (conf?.yAxisField === false) {
    const agg = ruleForm.y_axis?.aggregation || 'count'
    ruleForm.y_axis = { field: 'id', aggregation: agg, label: agg }
  } else if (conf?.yAxis || conf?.mapChart) {
    ruleForm.y_axis = { field: 'id', aggregation: 'count', label: 'count' }
  } else {
    ruleForm.y_axis = null
  }
}

const handleSelectModel = async (selModel: string) => {
  resetAxisForEntityChange()
  await loadModelFields(selModel)
}

// ─── Indicator search — replaces limit:10000 preload ──────────────────────────
const indicatorOptions = ref<any[]>([])
const indicatorLoading = ref(false)
let indicatorTimer: ReturnType<typeof setTimeout> | null = null

const searchIndicators = async (query: string) => {
  if (indicatorTimer) clearTimeout(indicatorTimer)
  if (!query || query.length < 2) return
  indicatorLoading.value = true
  indicatorTimer = setTimeout(async () => {
    try {
      const res = await getSettlementListByCounty({
        limit: 50, page: 1, curUser: 1, model: 'indicator',
        searchField: 'name', searchKeyword: query,
        assocModel: '', filters: [], filterValues: [],
        associated_multiple_models: ['activity'],
      })
      const incoming = res.data
        .filter((i: any) => i.activity?.title)
        .map((i: any) => ({ value: i.id, label: `${i.name} | ${i.activity.title}` }))
      // merge: keep already-selected labels so they don't disappear
      const existingIds = new Set(indicatorOptions.value.map(o => o.value))
      for (const r of incoming) if (!existingIds.has(r.value)) indicatorOptions.value.push(r)
    } finally {
      indicatorLoading.value = false
    }
  }, 300)
}

// Load labels for already-selected indicators when editing
const loadIndicatorsByIds = async (ids: number[]) => {
  if (!ids?.length) return
  const res = await getSettlementListByCounty({
    limit: ids.length + 5, page: 1, curUser: 1, model: 'indicator',
    searchField: 'id', searchKeyword: '',
    assocModel: '', filters: ['id'], filterValues: [ids],
    associated_multiple_models: ['activity'],
  })
  indicatorOptions.value = res.data
    .filter((i: any) => i.activity?.title)
    .map((i: any) => ({ value: i.id, label: `${i.name} | ${i.activity.title}` }))
}

// ─── Filter rows (step 2) — values lazy-loaded per row ────────────────────────
type FilterRow = { field: string | null; operation: string | null; value: any[]; _opts: any[]; _loading: boolean }
const filterRows = ref<FilterRow[]>([])

const FUNC_OPTS_STRING = [
  { value: 'all',         label: 'All' },
  { value: 'eq',          label: 'Equal' },
  { value: 'neq',         label: 'Not Equal' },
  { value: 'contains',    label: 'Contains' },
  { value: 'not_contains',label: 'Does Not Contain' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with',   label: 'Ends With' },
  { value: 'in',          label: 'In' },
  { value: 'not_in',      label: 'Not In' },
  { value: 'is_null',     label: 'Is Empty' },
  { value: 'is_not_null', label: 'Is Not Empty' },
]
const FUNC_OPTS_NUM = [
  { value: 'all',         label: 'All' },
  { value: 'eq',          label: 'Equal' },
  { value: 'neq',         label: 'Not Equal' },
  { value: 'lt',          label: 'Less Than' },
  { value: 'lte',         label: 'Less Than or Equal To' },
  { value: 'gt',          label: 'Greater Than' },
  { value: 'gte',         label: 'Greater Than or Equal To' },
  { value: 'in',          label: 'In' },
  { value: 'not_in',      label: 'Not In' },
  { value: 'is_null',     label: 'Is Empty' },
  { value: 'is_not_null', label: 'Is Not Empty' },
]

const funcOptsForField = (fieldName: string | null) => {
  if (!fieldName) return FUNC_OPTS_NUM
  const def =
    filterFieldSet.value.find(f => f.value === fieldName) ||
    fieldSet.value.find(f => f.value === fieldName)
  if (def?.type === 'FK_COMPONENT' || def?.type === 'FK_PROGRAMME') {
    return [{ value: 'all', label: 'All' }, { value: 'eq', label: 'Equal' }]
  }
  return def?.type === 'STRING' ? FUNC_OPTS_STRING : FUNC_OPTS_NUM
}

const toOpts = (items: any[]) =>
  (items || []).map((v: any) =>
    v !== null && typeof v === 'object' && 'value' in v
      ? { value: v.value, label: v.label ?? String(v.value) }
      : { value: v, label: String(v) }
  )

const onFilterFieldChange = async (row: FilterRow, fieldName: string) => {
  row.field = fieldName
  row.operation = null
  row.value = []
  row._opts = []
  if (!fieldName || !ruleForm.card_model) return

  const def =
    filterFieldSet.value.find(f => f.value === fieldName) ||
    fieldSet.value.find(f => f.value === fieldName)
  if (def?.type === 'FK_COMPONENT' || def?.type === 'FK_PROGRAMME') {
    await loadProgrammeComponentHierarchy()
    return
  }

  row._loading = true
  try {
    const res = await getUniqueFieldValues({ model: ruleForm.card_model, selectedField: fieldName })
    row._opts = toOpts(res.data)
  } finally {
    row._loading = false
  }
}

const loadFilterRowOpts = async (row: FilterRow) => {
  if (!row.field || !ruleForm.card_model || row._opts.length) return
  row._loading = true
  try {
    const res = await getUniqueFieldValues({ model: ruleForm.card_model, selectedField: row.field })
    row._opts = toOpts(res.data)
  } finally {
    row._loading = false
  }
}

const addFilterRow = () =>
  filterRows.value.push({ field: null, operation: null, value: [], _opts: [], _loading: false })

const removeFilterRow = (i: number) => filterRows.value.splice(i, 1)

const NO_VALUE_OPS = new Set(['all', 'is_null', 'is_not_null'])

const saveFilters = () => {
  ruleForm.filters = filterRows.value
    .filter(r => r.field && r.operation && (NO_VALUE_OPS.has(r.operation!) || r.value.length > 0))
    .map(({ field, operation, value }) => ({ field, operation, value: NO_VALUE_OPS.has(operation!) ? [] : value }))
  ElMessage.success('Filters saved')
}

// ─── Form lifecycle ────────────────────────────────────────────────────────────
const EMPTY_FORM = () => ({
  id: '', title: '', dashboard_id: '', dashboard_section_id: '', description: '',
  iconColor: '', icon: '', category: DEFAULT_DASHBOARD_DATA_CATEGORY, type: null, card_model: '',
  metric_fields: [], time_field: 'createdAt',
  indicator_id: null, ignore_empty: true,
  filtered: false, filters: null,
  x_axis: null, y_axis: null, series_field: null,
})

const resetForm = ({ closeDrawer = true, preserveContext = null }: any = {}) => {
  Object.assign(ruleForm, EMPTY_FORM())
  if (preserveContext) Object.assign(ruleForm, preserveContext)
  isEditing.value = false
  activeStep.value = 0
  fieldSet.value = []
  filterFieldSet.value = []
  filterRows.value = []
  drawerSectionOptions.value = []
  lastChartCategory.value = normalizeDataCategory(ruleForm.category) || ruleForm.category || ''
  indicatorOptions.value = []
  drawerLoading.value = false
  ruleFormRef.value?.clearValidate()
  if (preserveContext?.card_model) loadModelFields(preserveContext.card_model)
  if (closeDrawer) drawerVisible.value = false
}

const initialFormJson = ref('')
const isFormDirty = computed(() => JSON.stringify(ruleForm) !== initialFormJson.value)
watch(drawerVisible, (visible) => {
  if (visible) {
    if (!isEditing.value && !ruleForm.id) {
      ruleForm.category = DEFAULT_DASHBOARD_DATA_CATEGORY
      lastChartCategory.value = DEFAULT_DASHBOARD_DATA_CATEGORY
    }
    initialFormJson.value = JSON.stringify(ruleForm)
  } else {
    resetForm({ closeDrawer: false })
  }
})

const handleBeforeClose = (done: () => void) => {
  if (!isFormDirty.value) { resetForm(); done(); return }
  ElMessageBox.confirm('You have unsaved changes. Discard and close?', 'Unsaved Changes', { type: 'warning' })
    .then(() => { resetForm(); done() })
    .catch(() => {})
}

const cancelDrawer = () => {
  handleBeforeClose(() => {
    drawerVisible.value = false
  })
}

const openAdd = () => {
  resetForm({ closeDrawer: false })
  drawerSectionOptions.value = []
  drawerVisible.value = true
}

// ─── Populate form for edit / clone ───────────────────────────────────────────
const populateForm = async (row: any) => {
  const normalizedCategory = normalizeDataCategory(row.category) || row.category

  Object.assign(ruleForm, {
    id:                   row.id,
    title:                row.title,
    dashboard_id:         row.dashboard_section?.dashboard?.id || '',
    dashboard_section_id: row.dashboard_section_id,
    description:          row.description,
    iconColor:            row.iconColor,
    icon:                 row.icon,
    category:             normalizedCategory,
    type:                 row.type,
    card_model:           row.card_model,
    metric_fields:        Array.isArray(row.metric_fields) ? row.metric_fields : [],
    time_field:           row.time_field || 'createdAt',
    indicator_id:         row.indicators?.map((i: any) => i.id) ?? null,
    ignore_empty:         row.ignore_empty,
    filtered:             row.filtered,
    filters:              row.filters,
    x_axis:               row.x_axis ?? null,
    y_axis:               row.y_axis ?? null,
    series_field:         row.series_field ?? null,
  })

  filterRows.value = Array.isArray(row.filters)
    ? JSON.parse(JSON.stringify(row.filters)).map((r: any) => ({ ...r, _opts: [], _loading: false }))
    : []

  if (isInterventionCategory(normalizedCategory)) {
    ruleForm.card_model = ruleForm.card_model || 'indicator_category_report'
    await loadModelFields('indicator_category_report')
  } else if (row.card_model) {
    await loadModelFields(row.card_model)
  }

  if (row.indicators?.length) await loadIndicatorsByIds(row.indicators.map((i: any) => i.id))

  syncLastChartCategory()

  drawerSectionOptions.value = row.dashboard_section?.dashboard?.id
    ? allSectionOptions.value.filter(o => o.dashboard_id === row.dashboard_section.dashboard.id)
    : [...allSectionOptions.value]
}

const editChart = async (scope: any) => {
  isEditing.value = true
  drawerLoading.value = true
  try {
    await populateForm(scope.row)
    drawerVisible.value = true
    initialFormJson.value = JSON.stringify(ruleForm)
  } finally {
    drawerLoading.value = false
  }
}

const cloneChart = async (scope: any) => {
  await populateForm(scope.row)
  ruleForm.id = ''
  isEditing.value = false
  drawerVisible.value = true
}

const deleteChart = async (scope: any) => {
  await DeleteRecord({ id: scope.row.id, model: API_MODEL })
  await loadChartList({ silent: true })
}

// ─── Step navigation (0=Basics, 1=Chart Type, 2=Data Config, 3=Filters+Submit) ─
const nextStep = async () => {
  if (activeStep.value === 0) {
    const ok = await ruleFormRef.value
      ?.validateField(['title', 'dashboard_id', 'dashboard_section_id', 'description'])
      .catch(() => false)
    if (ok === false) return
  }
  if (activeStep.value === 1) {
    const ok = await ruleFormRef.value
      ?.validateField(['category', 'type'])
      .catch(() => false)
    if (ok === false) return
  }
  if (activeStep.value < 3) {
    activeStep.value++
    if (activeStep.value === 3) {
      filterRows.value.forEach(row => loadFilterRowOpts(row))
    }
  }
}
const prevStep = () => { if (activeStep.value > 0) activeStep.value-- }

const selectChartType = (id: number) => {
  ruleForm.type = id
  // Clear axis state that doesn't carry over between chart types
  ruleForm.x_axis = null
  ruleForm.series_field = null
  const def = CHART_DEFS.find(d => d.id === id)
  if (def?.householdsOnly) ruleForm.card_model = 'households'
  const conf = CHART_TYPE_CONFIG[id]
  if (conf?.yAxisField === false) {
    ruleForm.y_axis = { field: 'id', aggregation: ruleForm.y_axis?.aggregation || 'count', label: ruleForm.y_axis?.aggregation || 'count' }
  } else if (conf && !conf.yAxis) {
    ruleForm.y_axis = null
  } else if (conf?.yAxis || conf?.mapChart) {
    const agg = ruleForm.y_axis?.aggregation || 'count'
    ruleForm.y_axis = { field: ruleForm.y_axis?.field || 'id', aggregation: agg, label: agg }
  }
}

const onChartDataSourceChange = async (category: string) => {
  const normalized = normalizeDataCategory(category) || category
  if (!normalized) return

  const previous = lastChartCategory.value
  ruleForm.category = normalized
  if (normalized === previous) return

  lastChartCategory.value = normalized

  ruleForm.type = null
  ruleForm.metric_fields = []
  ruleForm.indicator_id = null
  ruleForm.card_model = ''
  ruleForm.x_axis = null
  ruleForm.y_axis = null
  ruleForm.series_field = null
  ruleForm.filtered = false
  ruleForm.filters = null
  filterRows.value = []
  fieldSet.value = []
  filterFieldSet.value = []
  indicatorOptions.value = []

  drawerLoading.value = true
  try {
    if (isInterventionCategory(normalized)) {
      ruleForm.card_model = 'indicator_category_report'
      await loadModelFields('indicator_category_report')
    }
  } finally {
    drawerLoading.value = false
  }
}

// Legacy alias — step handlers may still reference this name
const handleCategoryChange = onChartDataSourceChange

// ─── Submit ────────────────────────────────────────────────────────────────────
const getPreservedContext = () => ({
  dashboard_id:         ruleForm.dashboard_id,
  dashboard_section_id: ruleForm.dashboard_section_id,
  category:             ruleForm.category,
  card_model:           ruleForm.card_model,
})

const submitForm = async (addAnother = false) => {
  const valid = await ruleFormRef.value?.validate().catch(() => false)
  if (!valid) return

  ruleForm.category = normalizeDataCategory(ruleForm.category) || ruleForm.category

  if (!isStatus.value) {
    ruleForm.card_model = 'indicator_category_report'
  } else {
    ruleForm.indicator_id = null
  }

  if (ruleForm.type === 12) {
    if (!Array.isArray(ruleForm.metric_fields) || ruleForm.metric_fields.length < 2) {
      ElMessage.error('Select at least two metrics for Multi-variable Line')
      return
    }
  }
  const conf = ruleForm.type ? CHART_TYPE_CONFIG[ruleForm.type] : null
  if (conf?.series === 'required' && !ruleForm.series_field?.field) {
    ElMessage.error('Select a series / breakdown field — it is required for this chart type')
    return
  }
  if (ruleForm.type === 11 && (!ruleForm.x_axis?.field || ruleForm.x_axis.field === 'id')) {
    ElMessage.error('Word Map needs a category tile field (e.g. county.name) — not id')
    return
  }
  if (!ruleForm.time_field) ruleForm.time_field = 'createdAt'

  drawerLoadingText.value = 'Saving...'
  drawerLoading.value = true
  try {
    const payload = { ...ruleForm, model: API_MODEL, code: ruleForm.id || uuid.v4() }
    if (isEditing.value) {
      await updateOneRecord(payload)
      ElMessage.success('Chart saved')
    } else {
      await CreateRecord(payload)
      ElMessage.success('Chart created')
    }
    await loadChartList({ silent: true })
    resetForm({
      closeDrawer: !addAnother,
      preserveContext: addAnother ? getPreservedContext() : null,
    })
  } catch (e) {
    console.error(e)
    ElMessage.error('Failed to save chart')
    drawerLoading.value = false
  }
}
</script>

<template>
  <!-- ── Chart list ──────────────────────────────────────────────────────────── -->
  <el-card>

    <!-- Toolbar -->
    <el-row type="flex" style="display:flex;flex-wrap:nowrap;align-items:center;gap:8px;margin-bottom:16px;">
      <el-button type="primary" plain :icon="Back" @click="goBack">Back</el-button>

      <el-select v-model="selectedDashIds" multiple clearable filterable collapse-tags
        placeholder="Filter by Dashboard" style="width:30%" @change="handleDashboardFilter">
        <el-option v-for="o in dashboardOptions" :key="o.value" :label="o.label" :value="o.value" />
      </el-select>

      <el-select v-model="selectedSecIds" multiple clearable filterable collapse-tags
        placeholder="Filter by Section" style="width:30%" @change="handleSectionFilter">
        <el-option v-for="o in toolbarSectionOptions" :key="o.value" :label="o.label" :value="o.value" />
      </el-select>

      <PermissionWrapper permissions="dashboard_section_chart:create">
        <el-tooltip content="Add Chart" placement="top">
          <el-button type="primary" :icon="Plus" @click="openAdd" />
        </el-tooltip>
      </PermissionWrapper>

      <el-tooltip content="Download CSV" placement="top">
        <el-button type="primary" :icon="Download" @click="handleDownload" />
      </el-tooltip>

      <el-tooltip content="Clear filters" placement="top">
        <el-button type="primary" :icon="Filter" @click="handleClearFilters" />
      </el-tooltip>

      <DownloadAll :model="API_MODEL" :associated_models="ASSOC_MODELS" />
    </el-row>

    <!-- Table -->
    <el-table v-loading="loading" :data="charts_filtered" stripe table-layout="auto" class="charts-table">
      <el-table-column label="Type" min-width="160">
        <template #default="{ row }">
          <div class="chart-type-cell">
            <Icon :icon="getChartTypeIconName(row.type)" :size="18" color="#475569" />
            <span>{{ chartTypeLabel(row.type) }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Dashboard" :sort-method="sortByDashboard" sortable min-width="160" show-overflow-tooltip>
        <template #default="{ row }">{{ row.dashboard_section?.dashboard?.title || '-' }}</template>
      </el-table-column>

      <el-table-column prop="title" label="Title" sortable min-width="160" show-overflow-tooltip />
      <el-table-column prop="description" label="Description" sortable min-width="200" show-overflow-tooltip />

      <el-table-column label="Operations" min-width="180" align="right">
        <template #header>
          <el-input v-model="searchKey" size="small" placeholder="Filter by title" />
        </template>
        <template #default="scope">
          <PermissionWrapper permissions="dashboard_section_chart:update">
            <el-tooltip content="Edit" placement="top">
              <el-button size="small" type="success" :icon="Edit" plain @click="editChart(scope)" />
            </el-tooltip>
          </PermissionWrapper>

          <el-tooltip content="Clone" placement="top">
            <el-button size="small" type="warning" :icon="CopyDocument" plain @click="cloneChart(scope)" />
          </el-tooltip>

          <PermissionWrapper permissions="dashboard_section_chart:delete">
            <el-popconfirm confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled"
              title="Delete this chart?" @confirm="deleteChart(scope)">
              <template #reference>
                <el-button size="small" type="danger" :icon="Delete" plain />
              </template>
            </el-popconfirm>
          </PermissionWrapper>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      :layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'"
      v-model:currentPage="currentPage" v-model:page-size="pSize"
      :page-sizes="[5, 10, 20, 50, 200]" :total="total" :background="true"
      :small="isMobile" :pager-count="isMobile ? 3 : 7"
      @size-change="onSizeChange" @current-change="onPageChange" class="mt-4" />
  </el-card>


  <!-- ── Add / Edit Drawer ───────────────────────────────────────────────────── -->
  <el-drawer v-model="drawerVisible" class="dashboard-chart-drawer" direction="rtl"
    :size="isMobile ? '100%' : '44%'" :with-header="false"
    :before-close="handleBeforeClose"
    v-loading="drawerLoading" :element-loading-text="drawerLoadingText">

    <div class="drawer-header-wrap">
      <div class="drawer-header">
        <span class="drawer-title">{{ drawerTitle }}</span>
      </div>
      <p class="step-indicator">Step {{ activeStep + 1 }} of 4</p>
    </div>

    <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-position="top" class="drawer-form">

      <!-- ── Step 0: Basics ────────────────────────────────────────────── -->
      <div v-if="activeStep === 0">
        <el-form-item label="Dashboard" prop="dashboard_id">
          <el-select v-model="ruleForm.dashboard_id" filterable placeholder="Select dashboard"
            style="width:100%" @change="handleFormDashboardChange">
            <el-option v-for="o in dashboardOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="Dashboard Section" prop="dashboard_section_id">
          <el-select v-model="ruleForm.dashboard_section_id" filterable placeholder="Select section" style="width:100%">
            <el-option v-for="o in drawerSectionOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="Title" prop="title">
          <el-input v-model="ruleForm.title" placeholder="Chart title" />
        </el-form-item>

        <el-form-item label="Description" prop="description">
          <el-input v-model="ruleForm.description" placeholder="What does this chart show?" />
        </el-form-item>

        <el-form-item label="Data source" prop="category">
          <el-radio-group v-model="chartCategorySelection" class="category-group">
            <el-radio-button value="Status">Entity chart</el-radio-button>
            <el-radio-button value="Intervention">M&amp;E indicator chart</el-radio-button>
          </el-radio-group>
          <div class="field-hint">{{ dataSourceHint }}</div>
        </el-form-item>
      </div>


      <!-- ── Step 1: Chart Type ───────────────────────────────────────── -->
      <div v-if="activeStep === 1">
        <el-form-item v-if="ruleForm.category" label="Chart Type" prop="type">
          <div class="chart-grid">
            <div v-for="def in availableChartTypes" :key="def.id"
              class="chart-card" :class="{ 'chart-card--selected': ruleForm.type === def.id }"
              @click="selectChartType(def.id)">
              <Icon :icon="def.icon" :size="26" :color="ruleForm.type === def.id ? '#409EFF' : '#64748b'" />
              <div class="chart-card-label">{{ def.label }}</div>
              <div class="chart-card-desc">{{ def.desc }}</div>
            </div>
          </div>
        </el-form-item>
      </div>


      <!-- ── Step 2: Data Config (per chart type) ──────────────────────── -->
      <div v-if="activeStep === 2">

        <!-- ── Status: entity + axis fields ─────────────────────────────── -->
        <template v-if="isStatus">

          <!-- Fixed chart types (type 8 pyramid) — no config needed -->
          <div v-if="isFixed" class="axis-preview" style="font-size:13px;color:#606266;font-style:normal;">
            <strong>{{ activeChartDef?.label }}</strong> — no configuration needed.<br />
            {{ axisPreviewSentence }}
          </div>

          <!-- All other status chart types need an entity -->
          <template v-else>
            <el-form-item label="Entity (data source)" prop="card_model">
              <el-select v-model="ruleForm.card_model" filterable clearable
                placeholder="Which entity do you want to summarise?" style="width:100%"
                :disabled="activeChartDef?.householdsOnly"
                @change="handleSelectModel">
                <el-option v-for="o in MODEL_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
              <div v-if="activeChartDef?.householdsOnly" class="field-hint">Population Pyramid is locked to Households</div>
            </el-form-item>

            <template v-if="ruleForm.card_model">
              <!-- Map chart: no x axis, just what to measure -->
              <div v-if="isMapChart" class="field-hint" style="margin-bottom:12px;">
                X axis is fixed to Kenya counties — choose what value to display per county.
              </div>

              <!-- X Axis (all bar/pie/treemap types) -->
              <el-form-item v-if="showXAxis" :label="typeConf?.xLabel || 'X Axis — Group by'" prop="x_axis">
                <el-select :model-value="ruleForm.x_axis?.field ?? null" filterable clearable
                  placeholder="Pick the field to group records by" style="width:100%"
                  :loading="fieldSetLoading" @change="onXAxisChange">
                  <el-option v-for="f in xAxisFieldOptions" :key="f.value" :label="f.label" :value="f.value" />
                </el-select>
                <div class="field-hint">{{ typeConf?.xHint }}</div>
              </el-form-item>

              <!-- Time axis (line / multi-line) -->
              <el-form-item v-if="showTimeAxis" label="Time axis (X)" prop="time_field">
                <el-select v-model="ruleForm.time_field" filterable clearable
                  placeholder="Date or year field for the X axis" style="width:100%">
                  <el-option v-for="f in timeFields" :key="f.value" :label="f.label" :value="f.value" />
                </el-select>
                <div class="field-hint">{{ typeConf?.xHint || 'Used as the X axis in the line chart.' }}</div>
              </el-form-item>

              <!-- Y Axis (all types with yAxis:true) -->
              <template v-if="showYAxis">
                <!-- Bar / Line / Map: field picker + aggregation side by side -->
                <el-row v-if="showYAxisField" :gutter="12">
                  <el-col :span="14">
                    <el-form-item
                      :label="typeConf?.yLabel || 'Measure (Y axis)'"
                      prop="aggregation">
                      <el-select
                        :model-value="ruleForm.y_axis?.field ?? null"
                        filterable
                        clearable
                        placeholder="Field to measure (or count all rows)"
                        style="width:100%"
                        :loading="fieldSetLoading"
                        @change="onYAxisFieldChange">
                        <el-option label="Count rows" value="id" />
                        <el-option v-for="f in fieldSet" :key="f.value" :label="f.label" :value="f.value" />
                      </el-select>
                      <div v-if="typeConf?.yHint" class="field-hint">{{ typeConf.yHint }}</div>
                    </el-form-item>
                  </el-col>
                  <el-col v-if="!typeConf?.noAgg" :span="10">
                    <el-form-item label="Aggregation">
                      <el-select
                        :model-value="ruleForm.y_axis?.aggregation ?? 'count'"
                        filterable
                        placeholder="How"
                        style="width:100%"
                        @change="onYAxisAggChange">
                        <el-option v-for="o in aggregationOptions" :key="o.value" :label="o.label" :value="o.value" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
                <!-- Pie / Donut / Word Map: aggregation only (field always = count of rows) -->
                <el-form-item
                  v-else
                  :label="typeConf?.yLabel || 'Measure'">
                  <el-select
                    :model-value="ruleForm.y_axis?.aggregation ?? 'count'"
                    filterable
                    placeholder="How to size each slice"
                    style="width:100%"
                    @change="onYAxisAggChange">
                    <el-option v-for="o in aggregationOptions" :key="o.value" :label="o.label" :value="o.value" />
                  </el-select>
                  <div class="field-hint">Count = number of records per slice. Sum = total of a numeric field.</div>
                </el-form-item>
              </template>

              <!-- Gauge center label (type 15 only) -->
              <el-form-item v-if="ruleForm.type === 15" label="Center label">
                <el-input
                  :model-value="ruleForm.y_axis?.label ?? ''"
                  placeholder="e.g. Approved, Connected, Vulnerable…"
                  clearable
                  @input="(v: string) => { if (ruleForm.y_axis) ruleForm.y_axis.label = v }"
                />
                <div class="field-hint">Text shown inside the radial arc. Defaults to the aggregation name if left blank.</div>
              </el-form-item>

              <!-- Series / breakdown (only for chart types that support it) -->
              <el-form-item v-if="showSeries"
                :label="typeConf?.seriesLabel || (seriesRequired ? 'Series — Break down by (required)' : 'Series — Break down by (optional)')">
                <el-select
                  :model-value="ruleForm.series_field?.field ?? null"
                  filterable
                  clearable
                  :placeholder="seriesRequired ? 'Required for this chart type' : 'Optional: splits into multiple series'"
                  style="width:100%"
                  :loading="fieldSetLoading"
                  @change="onSeriesFieldChange">
                  <el-option v-for="f in fieldSet" :key="f.value" :label="f.label" :value="f.value" />
                </el-select>
                <div class="field-hint">{{ typeConf?.seriesHint }}</div>
              </el-form-item>

              <!-- Metric fields (type 12 multi-variable line) -->
              <el-form-item v-if="showMetrics" label="Metric fields (select 2 or more)" prop="metric_fields">
                <el-select v-model="ruleForm.metric_fields" multiple filterable collapse-tags
                  placeholder="Pick numeric fields to compare" style="width:100%"
                  :loading="fieldSetLoading">
                  <el-option v-for="f in numericFields" :key="f.value" :label="f.label" :value="f.value" />
                </el-select>
                <div class="field-hint">Only numeric fields are listed. Select at least 2.</div>
              </el-form-item>

              <!-- Ignore empty -->
              <el-form-item>
                <el-checkbox v-model="ruleForm.ignore_empty">Ignore records where the measured field is empty</el-checkbox>
              </el-form-item>
            </template>
          </template>
        </template>

        <!-- ── Intervention: indicator picker ────────────────────────────── -->
        <template v-if="isIntervention">
          <el-form-item label="Indicators" prop="indicator_id">
            <el-select v-model="ruleForm.indicator_id" multiple filterable remote reserve-keyword
              :remote-method="searchIndicators" :loading="indicatorLoading"
              placeholder="Type at least 2 characters to search" collapse-tags style="width:100%">
              <el-option v-for="o in indicatorOptions" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
            <div class="field-hint">Search by indicator name. Select one or more.</div>
          </el-form-item>
        </template>

        <!-- Preview sentence -->
        <div v-if="axisPreviewSentence && !isFixed" class="axis-preview">{{ axisPreviewSentence }}</div>

      </div>


      <!-- ── Step 3: Filters ────────────────────────────────────────────── -->
      <div v-if="activeStep === 3">

        <div v-if="!showChartFilters" class="filter-hint">
          Choose a data category and entity in the previous steps to configure filters.
        </div>

        <template v-else>
          <el-form-item label="Apply data filters" prop="filtered">
            <el-switch v-model="ruleForm.filtered" active-text="Yes" inactive-text="No"
              style="--el-switch-on-color:#13ce66;--el-switch-off-color:#ff4949" />
            <span class="field-hint" style="margin-left:12px;">
              Filters let you restrict which records are included in this chart.
            </span>
          </el-form-item>

          <template v-if="ruleForm.filtered">
            <el-table :data="filterRows" style="width:100%" size="small" max-height="320">
              <el-table-column label="Field" min-width="140">
                <template #default="{ row }">
                  <el-select v-model="row.field" filterable placeholder="Field"
                    @change="(val) => onFilterFieldChange(row, val)">
                    <el-option v-for="f in filterFieldSet" :key="f.value" :label="f.label" :value="f.value" />
                  </el-select>
                </template>
              </el-table-column>

              <el-table-column label="Operation" min-width="130">
                <template #default="{ row }">
                  <el-select v-model="row.operation" placeholder="Operation">
                    <el-option v-for="o in funcOptsForField(row.field)" :key="o.value" :label="o.label" :value="o.value" />
                  </el-select>
                </template>
              </el-table-column>

              <el-table-column label="Value(s)" min-width="150">
                <template #default="{ row }">
                  <span v-if="['all', 'is_null', 'is_not_null'].includes(row.operation)" class="text-gray-400 text-xs">—</span>
                  <el-select
                    v-else-if="row.field === 'component_id'"
                    v-model="row.value"
                    multiple
                    filterable
                    collapse-tags
                    placeholder="Select Component(s)"
                    @update:model-value="saveFilters"
                  >
                    <el-option-group v-for="group in componentOptionGroupsForFilter" :key="group.label" :label="group.label">
                      <el-option v-for="item in group.children" :key="item.value" :label="item.label" :value="item.value" />
                    </el-option-group>
                  </el-select>
                  <el-select
                    v-else-if="row.field === 'programme_id'"
                    v-model="row.value"
                    multiple
                    filterable
                    collapse-tags
                    placeholder="Select Programme(s)"
                    @update:model-value="saveFilters"
                  >
                    <el-option-group v-for="group in programmeOptionGroupsForFilter" :key="group.id" :label="group.label">
                      <el-option :key="`root-${group.id}`" :label="group.rootLabel" :value="group.id" />
                      <el-option v-for="item in group.children" :key="item.value" :label="item.label" :value="item.value" />
                    </el-option-group>
                  </el-select>
                  <el-select v-else v-model="row.value" multiple filterable allow-create collapse-tags
                    placeholder="Select or type" :loading="row._loading"
                    @update:model-value="saveFilters">
                    <el-option v-for="o in row._opts" :key="String(o.value)" :label="String(o.label)" :value="o.value" />
                  </el-select>
                </template>
              </el-table-column>

              <el-table-column width="50" align="center">
                <template #default="{ $index }">
                  <el-button size="small" type="danger" :icon="Delete" @click="removeFilterRow($index)" />
                </template>
              </el-table-column>
            </el-table>

            <el-row class="mt-4" :gutter="8">
              <el-col :span="12">
                <el-button @click="addFilterRow" size="small" style="width:100%">+ Add Filter Row</el-button>
              </el-col>
              <el-col :span="12">
                <el-button @click="saveFilters" size="small" type="primary" style="width:100%">Save Filters</el-button>
              </el-col>
            </el-row>
          </template>
        </template>

      </div>

    </el-form>

    <!-- Drawer footer -->
    <template #footer>
      <div class="drawer-footer">
        <div class="drawer-footer-left">
          <el-button @click="cancelDrawer" :disabled="drawerLoading">Cancel</el-button>
          <el-button @click="prevStep" :disabled="activeStep === 0 || drawerLoading">Previous</el-button>
        </div>
        <div class="drawer-footer-right">
          <el-button v-if="activeStep < 3" type="primary" @click="nextStep" :disabled="drawerLoading">Next</el-button>
          <PermissionWrapper permissions="dashboard_section_chart:create">
            <el-button v-if="!isEditing && activeStep === 3" type="primary" :loading="drawerLoading" @click="submitForm(false)">Submit</el-button>
            <el-button v-if="!isEditing && activeStep === 3" :loading="drawerLoading" @click="submitForm(true)">Submit &amp; Add Another</el-button>
          </PermissionWrapper>
          <PermissionWrapper permissions="dashboard_section_chart:update">
            <el-button v-if="isEditing && activeStep === 3" type="primary" :loading="drawerLoading" @click="submitForm(false)">Save</el-button>
            <el-button v-if="isEditing && activeStep === 3" :loading="drawerLoading" @click="submitForm(true)">Save &amp; Add Another</el-button>
          </PermissionWrapper>
        </div>
      </div>
    </template>

  </el-drawer>
</template>

<style scoped>
/* ── Drawer chrome ──────────────────────────────────────────────────────────── */
.dashboard-chart-drawer :deep(.el-drawer__body) {
  padding-top: 0;
}
.drawer-header-wrap {
  width: 100%;
  position: sticky;
  top: 0;
  z-index: 10;
}
.drawer-header {
  padding: 5px 12px;
  background: linear-gradient(135deg, var(--el-color-primary-dark-2), var(--el-color-primary));
}
.drawer-title { font-size: 14px; font-weight: 600; line-height: 1.2; color: white; }

.step-indicator {
  margin: 0;
  padding: 4px 12px 5px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--el-text-color-secondary);
  border-bottom: 1px solid #ebeef5;
}

.drawer-form { padding: 8px 16px 16px; }

.drawer-footer {
  padding: 12px 20px;
  border-top: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.drawer-footer-left,
.drawer-footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.drawer-footer-right {
  margin-left: auto;
  justify-content: flex-end;
}

/* ── Category radio ─────────────────────────────────────────────────────────── */
.category-group { display: flex; width: 100%; }
.category-group :deep(.el-radio-button) { flex: 1; }
.category-group :deep(.el-radio-button__inner) {
  width: 100%;
  white-space: normal;
  line-height: 1.3;
  padding: 10px 12px;
}

/* ── Chart type grid ────────────────────────────────────────────────────────── */
.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  width: 100%;
}

.chart-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 12px 8px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.18s;
  background: #fff;
}
.chart-card:hover { border-color: #409EFF; background: #f0f7ff; }
.chart-card--selected { border-color: #409EFF; background: #ecf5ff; }

.chart-card-label { font-size: 12px; font-weight: 600; margin-top: 6px; color: #303133; }
.chart-card-desc  { font-size: 11px; color: #909399; margin-top: 3px; line-height: 1.3; }

/* ── Utility ────────────────────────────────────────────────────────────────── */
.field-hint { font-size: 11px; color: #909399; margin-top: 3px; }
.filter-hint { color: #909399; font-size: 13px; padding: 32px 0; text-align: center; }
.mt-4 { margin-top: 16px; }

/* ── Axis preview ───────────────────────────────────────────────────────────── */
.axis-preview {
  background: #f0f7ff;
  border: 1px solid #c6e0ff;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 12px;
  color: #409EFF;
  margin-bottom: 12px;
  font-style: italic;
}

/* ── Table ──────────────────────────────────────────────────────────────────── */
.charts-table { width: 100%; }
.chart-type-cell { display: flex; align-items: center; gap: 8px; }
</style>
