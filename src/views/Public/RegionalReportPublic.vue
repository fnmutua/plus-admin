<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import {
  ElButton,
  ElCard,
  ElDialog,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTreeSelect,
  ElUpload,
} from 'element-plus'
import type { UploadFile, UploadRawFile } from 'element-plus'
import { Icon } from '@iconify/vue'
import {
  getRegionalReportMeta,
  getRegionalReportProgrammes,
  getRegionalReportProjectHistory,
  getRegionalReportProjectIndicators,
  getRegionalReportProjects,
  submitRegionalReport,
  uploadRegionalReportDocuments,
  type RegionalReportComponent,
  type RegionalReportHistoryEntry,
  type RegionalReportMeta,
  type RegionalReportProgramme,
  type RegionalReportProject,
  type RegionalReportProjectIndicator,
} from '@/api/regional-report-public'
import { getProgrammeDescendantIds, type ProgrammeRecord } from '@/utils/programmeValidation'
import { buildProgrammeTreeSelectData } from '@/utils/programmeComponentTree'

type SavedIndicator = {
  indicatorCategoryId: number
  label: string
  unit: string
  cumAmount: number
  minCumAmount: number
  target: number | null
  targetKind: string
  qualitative: string | null
  isQualitative: boolean
}

type ProjectReportEntry = {
  projectId: number
  title: string
  county: string
  projectCode: string
  minCompletionPct: number
  completionPct?: number
  remarks: string
  workersOnSite: string
  indicators: SavedIndicator[]
}

type IndicatorDraftRow = RegionalReportProjectIndicator & {
  cumAmount: number | null
  qualitative: string | null
}

const loadingMeta = ref(true)
const loadingProjects = ref(false)
const submitting = ref(false)
const done = ref(false)
const filingCode = ref('')

const meta = ref<RegionalReportMeta>({
  regions: [],
  defaultFiscalYear: '',
  defaultPeriod: 1,
})

const form = reactive({
  region: '',
  fiscalYear: '',
  period: 1,
  submitterName: '',
})

const availableProjects = ref<RegionalReportProject[]>([])
const projectReports = ref<ProjectReportEntry[]>([])
type ReportStep = 'selection' | 'progress' | 'indicators' | 'details' | 'documents' | 'submit'
const activeSection = ref<ReportStep>('selection')
const loadedProjectsRegion = ref<string | null>(null)
let projectsRequestId = 0
const historyDialogOpen = ref(false)
const historyEntries = ref<RegionalReportHistoryEntry[]>([])
const loadingHistory = ref(false)
const historyProjectId = ref<number | null>(null)
let historyRequestId = 0
// The indicator table needs ~570px of columns; below that it becomes stacked cards.
const isMobile = ref(typeof window !== 'undefined' ? window.innerWidth <= 768 : false)
const pickerProjectId = ref<number | null>(null)
// Programme filter — a parent programme includes its sub-programmes
const selectedProgramme = ref<number | null>(null)
const programmes = ref<RegionalReportProgramme[]>([])
const components = ref<RegionalReportComponent[]>([])

const draft = reactive({
  completionPct: null as number | null,
  remarks: '',
  workersOnSite: '',
})

const indicatorDraft = reactive({
  rows: [] as IndicatorDraftRow[],
})

const loadingIndicators = ref(false)

const MAX_DOCUMENTS = 5
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024
const ALLOWED_DOCUMENT_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
])
const documentFiles = ref<UploadFile[]>([])

function showStep(step: ReportStep) {
  activeSection.value = step
  if (typeof window !== 'undefined') {
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  }
}

function todayReportDate() {
  return new Date().toISOString().slice(0, 10)
}

const fiscalYearOptions = computed(() => {
  const current = meta.value.defaultFiscalYear || '2025/2026'
  const start = Number(current.split('/')[0] || 2025)
  return [0, 1].map((offset) => {
    const y = start - offset
    return `${y}/${y + 1}`
  })
})

const selectedPickerProject = computed(
  () => availableProjects.value.find((project) => project.id === pickerProjectId.value) || null,
)

const minCompletionPct = computed(() => projectBaseline(pickerProjectId.value))

function baselineProgress(project: RegionalReportProject | null | undefined): number {
  if (!project || project.currentProgress == null) return 0
  const value = Number(project.currentProgress)
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.round(value * 100) / 100
}

function projectBaseline(projectId: number | null | undefined): number {
  if (!projectId) return 0
  const project = availableProjects.value.find((row) => row.id === projectId)
  return baselineProgress(project)
}

const canSubmit = computed(
  () =>
    !submitting.value &&
    form.region &&
    form.submitterName.trim().length >= 2 &&
    projectReports.value.some(
      (entry) => entry.completionPct != null || entry.indicators.length > 0,
    ),
)

const submitSummary = computed(() => {
  const count = projectReports.value.length
  return count ? `${count} project(s) in this report` : 'No updates yet'
})

const canLeaveSelection = computed(
  () =>
    Boolean(form.region) &&
    loadedProjectsRegion.value === form.region &&
    selectedProgramme.value != null &&
    pickerProjectId.value != null,
)

const canLeaveOtherDetails = computed(
  () =>
    Boolean(form.fiscalYear) &&
    Number(form.period) >= 1 &&
    Number(form.period) <= 4 &&
    form.submitterName.trim().length >= 2,
)

async function goToProgress() {
  if (form.region && loadedProjectsRegion.value !== form.region && !loadingProjects.value) {
    await loadProjects()
  }
  if (!canLeaveSelection.value) {
    ElMessage.warning('Select a region, programme, and project first')
    return
  }
  showStep('progress')
}

function collectIndicatorRows(): SavedIndicator[] {
  return indicatorDraft.rows
    .map((row) => {
      if (row.isQualitative) {
        if (row.qualitative !== 'Yes' && row.qualitative !== 'No') return null
        const baseline = row.currentQualitative || 'No'
        if (row.qualitative === baseline) return null
        return {
          indicatorCategoryId: row.indicatorCategoryId,
          label: row.label,
          unit: row.unit,
          cumAmount: row.qualitative === 'Yes' ? 1 : 0,
          minCumAmount: row.minCumAmount,
          target: row.target,
          targetKind: row.targetKind,
          qualitative: row.qualitative,
          isQualitative: true,
        }
      }

      const cumAmount = Number(row.cumAmount)
      if (!Number.isFinite(cumAmount) || cumAmount + 1e-6 < row.minCumAmount) return null
      if (Math.abs(cumAmount - row.minCumAmount) < 1e-6) return null

      return {
        indicatorCategoryId: row.indicatorCategoryId,
        label: row.label,
        unit: row.unit,
        cumAmount,
        minCumAmount: row.minCumAmount,
        target: row.target,
        targetKind: row.targetKind,
        qualitative: null,
        isQualitative: false,
      }
    })
    .filter(Boolean) as SavedIndicator[]
}

function upsertProjectReport(partial: Partial<ProjectReportEntry>) {
  const project = selectedPickerProject.value
  if (!project) return

  const idx = projectReports.value.findIndex((entry) => entry.projectId === project.id)
  const base: ProjectReportEntry = {
    projectId: project.id,
    title: project.title,
    county: project.county,
    projectCode: project.projectCode,
    minCompletionPct: projectBaseline(project.id),
    // Default to the project's current progress so every reported project files an
    // implementation-status reading. Without it an indicators-only entry submits
    // completionPct: null and no ic-47 report is created on approval.
    completionPct: projectBaseline(project.id),
    remarks: '',
    workersOnSite: '',
    indicators: [],
  }

  if (idx >= 0) {
    projectReports.value[idx] = { ...projectReports.value[idx], ...partial }
  } else {
    projectReports.value.push({ ...base, ...partial })
  }
}

function hydrateDraftFromSaved(projectId: number) {
  const saved = projectReports.value.find((entry) => entry.projectId === projectId)
  draft.completionPct =
    saved?.completionPct != null
      ? Math.max(Number(saved.completionPct), projectBaseline(projectId))
      : projectBaseline(projectId)
  draft.remarks = saved?.remarks || ''
  draft.workersOnSite = saved?.workersOnSite || ''

  if (!saved?.indicators.length) return

  const savedById = new Map(
    saved.indicators.map((row) => [row.indicatorCategoryId, row]),
  )
  indicatorDraft.rows = indicatorDraft.rows.map((row) => {
    const savedRow = savedById.get(row.indicatorCategoryId)
    if (!savedRow) return row
    return {
      ...row,
      cumAmount: savedRow.cumAmount,
      qualitative: savedRow.qualitative,
      // Restore an edited target too, otherwise revisiting the project silently
      // reverts it to the value the API returned (usually null).
      target: savedRow.target ?? row.target,
      targetKind: savedRow.targetKind || row.targetKind,
    }
  })
}

function projectLabel(project: RegionalReportProject) {
  const county = project.county ? `${project.county} · ` : ''
  const title = String(project.title || '').replace(/\s+/g, ' ').trim()
  return `${county}${title.slice(0, 72)}${title.length > 72 ? '…' : ''}`
}

function resetPickerDraft() {
  pickerProjectId.value = null
  draft.completionPct = null
  draft.remarks = ''
  draft.workersOnSite = ''
  indicatorDraft.rows = []
}

function resetProjectState() {
  projectsRequestId += 1
  loadingProjects.value = false
  loadedProjectsRegion.value = null
  availableProjects.value = []
  projectReports.value = []
  selectedProgramme.value = null
  resetPickerDraft()
  historyDialogOpen.value = false
  documentFiles.value = []
}

const programmeTreeData = computed(() =>
  buildProgrammeTreeSelectData(programmes.value as ProgrammeRecord[]),
)

// Component ids belonging to the selected programme (or any of its descendants)
const allowedComponentIds = computed<Set<number> | null>(() => {
  if (selectedProgramme.value == null) return null
  const scope = new Set<number>([selectedProgramme.value])
  getProgrammeDescendantIds(selectedProgramme.value, programmes.value as ProgrammeRecord[]).forEach(
    (id) => scope.add(id)
  )
  return new Set(
    components.value
      .filter((c) => scope.has(Number(c.programme_id)))
      .map((c) => Number(c.id))
  )
})

const programmeFilteredProjects = computed(() =>
  availableProjects.value.filter((project) => {
    if (allowedComponentIds.value) {
      const componentId = project.componentId
      if (componentId == null || !allowedComponentIds.value.has(Number(componentId))) return false
    }
    return true
  })
)

const projectSelectOptions = computed(() =>
  programmeFilteredProjects.value.map((project) => {
    const pct = baselineProgress(project)
    const progressSuffix = pct > 0 ? ` · ${pct}%` : ''
    const inReport = projectReports.value.some((entry) => entry.projectId === project.id)
    const reportSuffix = inReport ? ' · in report' : ''
    return {
      value: project.id,
      label: `${projectLabel(project)}${progressSuffix}${reportSuffix}`,
    }
  }),
)

watch(selectedProgramme, () => {
  if (pickerProjectId.value == null) return
  const stillVisible = programmeFilteredProjects.value.some(
    (project) => project.id === pickerProjectId.value,
  )
  if (!stillVisible) pickerProjectId.value = null
})

function formatHistoryDate(value: string) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : d.toISOString().slice(0, 10)
}

/**
 * Same rule the M&E report page uses: a percentage needs a target to mean anything, so
 * zero-progress-with-no-target reads as "not measurable" rather than "no progress".
 */
function formatHistoryProgress(row: RegionalReportHistoryEntry) {
  if (row.progress == null) return '—'
  if (row.progress === 0 && !row.qualitative && !(row.target && row.target > 0)) return '—'
  return `${row.progress}%`
}

/** Loaded lazily when the History button is opened for a project. */
async function loadProjectHistory() {
  const projectId = pickerProjectId.value
  const region = form.region
  if (!projectId || !region) return
  if (historyProjectId.value === projectId) return

  const requestId = ++historyRequestId
  loadingHistory.value = true
  try {
    const res = await getRegionalReportProjectHistory({ region, projectId })
    if (
      requestId !== historyRequestId ||
      pickerProjectId.value !== projectId ||
      form.region !== region
    ) return

    historyEntries.value = res.entries
    historyProjectId.value = projectId
  } catch {
    if (requestId !== historyRequestId) return
    historyEntries.value = []
  } finally {
    if (requestId === historyRequestId) loadingHistory.value = false
  }
}

function openHistory() {
  historyDialogOpen.value = true
  void loadProjectHistory()
}

watch(
  () => pickerProjectId.value,
  async (projectId) => {
    historyRequestId += 1
    loadingHistory.value = false
    historyEntries.value = []
    historyProjectId.value = null

    if (!projectId) {
      draft.completionPct = null
      draft.remarks = ''
      draft.workersOnSite = ''
      indicatorDraft.rows = []
      return
    }

    hydrateDraftFromSaved(projectId)

    indicatorDraft.rows = []
    if (!form.region) return

    loadingIndicators.value = true
    try {
      const res = await getRegionalReportProjectIndicators({
        region: form.region,
        projectId,
        fiscalYear: form.fiscalYear,
      })
      indicatorDraft.rows = res.indicators.map((row) => ({
        ...row,
        cumAmount: row.minCumAmount,
        qualitative: row.isQualitative ? row.currentQualitative || 'No' : null,
      }))
      hydrateDraftFromSaved(projectId)
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.message || 'Could not load project indicators')
    } finally {
      loadingIndicators.value = false
    }
  },
)

watch(
  () => draft.completionPct,
  (value) => {
    if (value == null) return
    const min = minCompletionPct.value
    if (Number(value) < min) {
      draft.completionPct = min
    }
  },
)

watch(minCompletionPct, (min) => {
  if (draft.completionPct == null) {
    draft.completionPct = min
    return
  }
  if (Number(draft.completionPct) < min) {
    draft.completionPct = min
  }
})

async function loadMeta() {
  loadingMeta.value = true
  try {
    meta.value = await getRegionalReportMeta()
    form.fiscalYear = meta.value.defaultFiscalYear
    form.period = meta.value.defaultPeriod
  } catch {
    ElMessage.error('Could not load form settings')
  } finally {
    loadingMeta.value = false
  }
}

async function loadProgrammes() {
  try {
    const res = await getRegionalReportProgrammes()
    programmes.value = res.programmes
    components.value = res.components
  } catch {
    // Non-critical: the project select still works without the programme filter.
  }
}

async function loadProjects() {
  const region = form.region
  if (!region) return

  const requestId = ++projectsRequestId
  loadingProjects.value = true
  try {
    const res = await getRegionalReportProjects(region)
    if (requestId !== projectsRequestId || form.region !== region) return

    availableProjects.value = res.projects
    loadedProjectsRegion.value = region
    if (!availableProjects.value.length) {
      ElMessage.warning('No projects found for this region')
    }
  } catch (error: any) {
    if (requestId !== projectsRequestId || form.region !== region) return

    ElMessage.error(error?.response?.data?.message || 'Could not load projects')
    availableProjects.value = []
    loadedProjectsRegion.value = null
  } finally {
    if (requestId === projectsRequestId) loadingProjects.value = false
  }
}

watch(
  () => form.region,
  (region, previousRegion) => {
    if (region === previousRegion) return
    resetProjectState()
    if (region) void loadProjects()
  },
)

/**
 * There are no per-project save buttons — everything is committed on Submit — so edits
 * flow into the report as they are typed. A project only joins the report once something
 * is actually entered, otherwise merely browsing projects would file empty updates.
 */
function syncDraftToReport() {
  const project = selectedPickerProject.value
  if (!project) return

  const baseline = projectBaseline(project.id)
  const drafted = Number(draft.completionPct)
  const completionPct = Number.isFinite(drafted) ? Math.max(drafted, baseline) : baseline
  const remarks = draft.remarks.trim()
  const workersOnSite = draft.workersOnSite.trim()
  const indicators = collectIndicatorRows()

  const touched =
    completionPct > baseline || remarks !== '' || workersOnSite !== '' || indicators.length > 0

  const idx = projectReports.value.findIndex((entry) => entry.projectId === project.id)
  if (!touched) {
    if (idx >= 0) projectReports.value.splice(idx, 1)
    return
  }

  upsertProjectReport({
    completionPct,
    minCompletionPct: baseline,
    remarks,
    workersOnSite,
    indicators,
  })
}

watch(
  [
    () => draft.completionPct,
    () => draft.remarks,
    () => draft.workersOnSite,
    () => indicatorDraft.rows,
  ],
  syncDraftToReport,
  { deep: true },
)

function removeProjectReport(projectId: number) {
  projectReports.value = projectReports.value.filter((entry) => entry.projectId !== projectId)
  if (pickerProjectId.value === projectId) {
    draft.completionPct = projectBaseline(projectId)
    draft.remarks = ''
    draft.workersOnSite = ''
    indicatorDraft.rows = indicatorDraft.rows.map((row) => ({
      ...row,
      cumAmount: row.minCumAmount,
      qualitative: row.isQualitative ? row.currentQualitative || 'No' : null,
    }))
  }
}

function buildSubmitProjects() {
  return projectReports.value
    .filter((entry) => entry.completionPct != null || entry.indicators.length > 0)
    .map((entry) => ({
      projectId: entry.projectId,
      completionPct: entry.completionPct != null ? Number(entry.completionPct) : undefined,
      remarks: entry.remarks.trim() || undefined,
      workersOnSite: entry.workersOnSite.trim() || undefined,
      indicators: entry.indicators.map((row) => ({
        indicatorCategoryId: row.indicatorCategoryId,
        cumAmount: row.cumAmount,
        qualitative: row.qualitative,
        // A target entered here is only a proposal — an already-configured FY target
        // still wins server-side; this fills the gap where none exists yet.
        target: row.target != null ? Number(row.target) : undefined,
        targetKind: row.targetKind || undefined,
      })),
    }))
}

async function handleSubmit(showSuccess = true) {
  if (!canSubmit.value) return false

  for (const row of projectReports.value) {
    if (row.completionPct == null) continue
    const minPct = projectBaseline(row.projectId)
    if (Number(row.completionPct) + 1e-6 < minPct) {
      ElMessage.error(`Progress for "${row.title}" cannot be below the current ${minPct}%`)
      return false
    }
  }

  const payloadProjects = buildSubmitProjects()

  submitting.value = true
  try {
    const res = await submitRegionalReport({
      region: form.region,
      fiscalYear: form.fiscalYear,
      period: Number(form.period),
      reportDate: todayReportDate(),
      submitterName: form.submitterName.trim(),
      metadata: {
        formVersion: 5,
      },
      projects: payloadProjects,
    })

    const uploadResult = await uploadSelectedDocuments(res.filingCode)
    filingCode.value = res.filingCode

    if (!uploadResult.ok) {
      ElMessage.warning(
        `Report ${res.filingCode} was submitted, but document upload failed: ${uploadResult.message}`,
      )
      return false
    }

    done.value = true
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
    }
    if (showSuccess) {
      ElMessage.success(
        documentFiles.value.length
          ? 'Regional report and documents submitted'
          : 'Regional report submitted',
      )
    }
    return true
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || 'Submission failed')
    return false
  } finally {
    submitting.value = false
  }
}

function backToSelection() {
  showStep('selection')
  if (form.region && loadedProjectsRegion.value !== form.region && !loadingProjects.value) {
    void loadProjects()
  }
}

function editProject(projectId: number) {
  pickerProjectId.value = projectId
  showStep('progress')
}

function goToIndicators() {
  showStep('indicators')
}

function backToProgress() {
  showStep('progress')
}

function goToOtherDetails() {
  showStep('details')
}

function backToIndicators() {
  showStep('indicators')
}

function goToSubmit() {
  if (!canLeaveOtherDetails.value) {
    ElMessage.warning('Select the year and quarter, then enter your name')
    return
  }
  showStep('documents')
}

function backToOtherDetails() {
  showStep('details')
}

function goToReview() {
  showStep('submit')
}

function backToDocuments() {
  showStep('documents')
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function documentExtension(name: string) {
  const idx = name.lastIndexOf('.')
  return idx >= 0 ? name.slice(idx).toLowerCase() : ''
}

function validateDocumentFile(file: UploadRawFile, currentCount = documentFiles.value.length) {
  const ext = documentExtension(file.name)
  if (!ALLOWED_DOCUMENT_EXTENSIONS.has(ext)) {
    ElMessage.error('Only PDF, Word, Excel, and image files are allowed')
    return false
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    ElMessage.error('Each file must be 10 MB or smaller')
    return false
  }
  if (currentCount >= MAX_DOCUMENTS) {
    ElMessage.warning(`You can attach up to ${MAX_DOCUMENTS} documents`)
    return false
  }
  return true
}

function onDocumentChange(_file: UploadFile, files: UploadFile[]) {
  const accepted: UploadFile[] = []
  for (const entry of files) {
    const raw = entry.raw
    if (!raw) continue
    if (!validateDocumentFile(raw, accepted.length)) continue
    accepted.push(entry)
  }
  documentFiles.value = accepted.slice(0, MAX_DOCUMENTS)
}

function onDocumentRemove(_file: UploadFile, files: UploadFile[]) {
  documentFiles.value = files
}

function removeDocument(uid: number) {
  documentFiles.value = documentFiles.value.filter((file) => file.uid !== uid)
}

async function uploadSelectedDocuments(filingCode: string) {
  const files = documentFiles.value
    .map((entry) => entry.raw)
    .filter((file): file is UploadRawFile => Boolean(file))

  if (!files.length) return { ok: true as const }

  try {
    await uploadRegionalReportDocuments(filingCode, files)
    return { ok: true as const }
  } catch (error: any) {
    return {
      ok: false as const,
      message: error?.response?.data?.message || 'Could not upload supporting documents',
    }
  }
}

function startAnother() {
  done.value = false
  filingCode.value = ''
  form.submitterName = ''
  showStep('selection')
  resetProjectState()
  if (form.region) void loadProjects()
}

async function submitAndStartAnother() {
  if (!(await handleSubmit(false))) return

  const submittedCode = filingCode.value
  startAnother()
  ElMessage.success(`Report ${submittedCode} submitted. You can start another.`)
}

function syncViewport() {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  loadMeta()
  loadProgrammes()
  window.addEventListener('resize', syncViewport)
})

onBeforeUnmount(() => window.removeEventListener('resize', syncViewport))
</script>

<template>
  <div class="regional-report-page">
    <div class="regional-report-container">
      <el-card v-loading="loadingMeta" class="regional-report-card">
        <template #header>
          <div class="regional-report-header">
            <img src="/gok.png" alt="Logo" class="regional-report-logo" />
            <div>
              <h1 class="regional-report-title">Regional Progress Report</h1>
              <p class="regional-report-subtitle">
                Submit quarterly project progress for your region. No login required.
              </p>
            </div>
          </div>
        </template>

        <div v-if="done" class="regional-report-success">
          <Icon icon="mdi:check-circle-outline" class="success-icon" />
          <h2>Report submitted</h2>
          <p>
            Reference code:
            <strong>{{ filingCode }}</strong>
          </p>
          <p class="success-note">
            National M&amp;E will review your submission. Keep this reference code for follow-up.
          </p>
          <el-button type="primary" @click="startAnother">Submit another report</el-button>
        </div>

        <template v-else>
          <div class="step-body">
            <section v-show="activeSection === 'selection'" class="form-section form-section--nested">
                <h2>1. Select project</h2>
                <div class="form-grid step-selection-fields">
                  <label class="field">
                    <span>Region *</span>
                    <el-select
                      v-model="form.region"
                      filterable
                      placeholder="Select your region"
                      class="field-control"
                    >
                      <el-option v-for="region in meta.regions" :key="region" :label="region" :value="region" />
                    </el-select>
                  </label>
                </div>

                <section v-loading="loadingProjects" class="project-picker">
                  <template v-if="availableProjects.length">
                    <div class="form-grid step-selection-fields">
                      <div class="field">
                        <span class="field-label">Programme *</span>
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
                          placeholder="Select programme"
                          class="field-control"
                        />
                      </div>

                      <div class="field">
                        <span class="field-label">Select project *</span>
                        <el-select
                          v-model="pickerProjectId"
                          filterable
                          clearable
                          placeholder="Search by county or project name"
                          class="field-control"
                        >
                          <el-option
                            v-for="option in projectSelectOptions"
                            :key="option.value"
                            :label="option.label"
                            :value="option.value"
                          />
                        </el-select>
                      </div>
                    </div>

                    <p v-if="selectedPickerProject" class="selected-project-title">
                      {{ selectedPickerProject.title }}
                    </p>
                  </template>

                  <p v-else-if="!form.region" class="projects-empty">
                    Select a region to load its projects.
                  </p>
                  <p v-else-if="loadingProjects" class="projects-empty">
                    Loading projects…
                  </p>
                  <div
                    v-else-if="loadedProjectsRegion !== form.region && !loadingProjects"
                    class="projects-empty"
                  >
                    <p>Projects could not be loaded.</p>
                    <el-button type="primary" link @click="loadProjects">Retry</el-button>
                  </div>
                  <p v-else-if="!loadingProjects" class="projects-empty">
                    No projects found for this region.
                  </p>
                </section>

                <div class="step-nav">
                  <el-button
                    type="primary"
                    :disabled="!canLeaveSelection || loadingProjects"
                    @click="goToProgress"
                  >
                    Next: progress
                  </el-button>
                </div>
              </section>

            <div
              v-show="activeSection === 'progress'"
              class="projects-panel"
            >
                <template v-if="selectedPickerProject">
                  <div class="project-step-heading">
                    <h2>2. Project progress</h2>
                    <p>{{ selectedPickerProject.title }}</p>
                  </div>

                  <div class="project-detail-card">
                        <div class="form-grid project-detail-grid">
                          <label class="field">
                            <span>Completion % *</span>
                            <el-input-number
                              v-model="draft.completionPct"
                              :min="minCompletionPct"
                              :max="100"
                              :step="1"
                              controls-position="right"
                              class="field-control"
                            />
                            <span class="field-hint">Min {{ minCompletionPct }}% (current)</span>
                          </label>

                          <label class="field">
                            <span>Workers on site</span>
                            <el-input v-model="draft.workersOnSite" placeholder="Optional" />
                          </label>

                          <label class="field field-wide">
                            <span>Remarks</span>
                            <el-input
                              v-model="draft.remarks"
                              type="textarea"
                              :rows="2"
                              placeholder="Optional project notes"
                            />
                          </label>
                        </div>
                  </div>

                  <div class="step-nav step-nav--project">
                    <el-button @click="backToSelection">Back</el-button>
                    <el-button @click="openHistory">View history</el-button>
                    <el-button type="primary" @click="goToIndicators">
                      Next: indicators
                    </el-button>
                  </div>
                </template>

                <div v-else class="projects-empty">
                  <p>Select a project on Step 1 before entering progress.</p>
                  <el-button type="primary" link @click="backToSelection">Return to Step 1</el-button>
                </div>
              </div>

            <div
              v-show="activeSection === 'indicators'"
              class="projects-panel"
            >
                <template v-if="selectedPickerProject">
                  <div class="project-step-heading">
                    <h2>3. Project indicators</h2>
                    <p>{{ selectedPickerProject.title }}</p>
                  </div>

                      <p class="tab-intro">
                        Optional. Cumulative values cannot go below the current total.
                      </p>

                      <div
                        v-if="selectedPickerProject"
                        v-loading="loadingIndicators"
                        class="project-detail-card"
                      >
                        <!-- Phones: stacked cards. The table needs ~570px of columns, which
                             forces horizontal scrolling around two number inputs. -->
                        <div v-if="indicatorDraft.rows.length && isMobile" class="indicator-cards">
                          <div
                            v-for="row in indicatorDraft.rows"
                            :key="row.indicatorCategoryId"
                            class="indicator-card"
                          >
                            <div class="indicator-card__head">
                              <span class="indicator-card__label">{{ row.label }}</span>
                              <span v-if="row.unit" class="indicator-card__unit">{{ row.unit }}</span>
                            </div>

                            <p class="indicator-card__current">
                              Current:
                              <strong v-if="row.isQualitative">{{ row.currentQualitative || 'No' }}</strong>
                              <strong v-else>{{ row.minCumAmount }}</strong>
                            </p>

                            <div class="indicator-card__fields">
                              <label class="indicator-card__field">
                                <span>Target</span>
                                <span v-if="row.isQualitative" class="target-static">
                                  {{ row.target != null ? row.target : '—' }}
                                </span>
                                <el-input-number
                                  v-else
                                  v-model="row.target"
                                  :min="0"
                                  :max="row.targetKind === 'percent' ? 100 : undefined"
                                  :controls="false"
                                  size="small"
                                  placeholder="Set target"
                                  class="field-control"
                                />
                              </label>

                              <label class="indicator-card__field">
                                <span>New cumulative</span>
                                <el-select
                                  v-if="row.isQualitative"
                                  v-model="row.qualitative"
                                  placeholder="Select"
                                  size="small"
                                  class="field-control"
                                >
                                  <el-option label="No" value="No" />
                                  <el-option label="Yes" value="Yes" />
                                </el-select>
                                <el-input-number
                                  v-else
                                  v-model="row.cumAmount"
                                  :min="row.minCumAmount"
                                  :step="1"
                                  :controls="false"
                                  size="small"
                                  class="field-control"
                                />
                              </label>
                            </div>
                          </div>
                        </div>

                        <div v-else-if="indicatorDraft.rows.length" class="indicator-table-wrap">
                          <el-table :data="indicatorDraft.rows" stripe size="small" class="indicator-table">
                            <el-table-column label="Indicator" min-width="180" show-overflow-tooltip>
                              <template #default="{ row }">{{ row.label }}</template>
                            </el-table-column>
                            <el-table-column label="Current cum." width="110" align="right">
                              <template #default="{ row }">
                                <span v-if="row.isQualitative">{{ row.currentQualitative || 'No' }}</span>
                                <span v-else>{{ row.minCumAmount }}{{ row.unit ? ` ${row.unit}` : '' }}</span>
                              </template>
                            </el-table-column>
                            <el-table-column label="Target" width="132">
                              <template #default="{ row }">
                                <!-- Yes/No indicators carry an implicit target, so only
                                     quantitative ones are editable here. -->
                                <span v-if="row.isQualitative" class="target-static">
                                  {{ row.target != null ? row.target : '—' }}
                                </span>
                                <el-input-number
                                  v-else
                                  v-model="row.target"
                                  :min="0"
                                  :max="row.targetKind === 'percent' ? 100 : undefined"
                                  :controls="false"
                                  size="small"
                                  placeholder="Set target"
                                  class="target-input"
                                />
                              </template>
                            </el-table-column>
                            <el-table-column label="New cumulative" min-width="150">
                              <template #default="{ row }">
                                <el-select
                                  v-if="row.isQualitative"
                                  v-model="row.qualitative"
                                  placeholder="Select"
                                  size="small"
                                  class="field-control"
                                >
                                  <el-option label="No" value="No" />
                                  <el-option label="Yes" value="Yes" />
                                </el-select>
                                <el-input-number
                                  v-else
                                  v-model="row.cumAmount"
                                  :min="row.minCumAmount"
                                  :step="1"
                                  controls-position="right"
                                  size="small"
                                  class="field-control"
                                />
                              </template>
                            </el-table-column>
                          </el-table>
                        </div>

                        <p v-else-if="!loadingIndicators" class="projects-empty">
                          No indicators configured for this project.
                        </p>
                      </div>

                  <div class="step-nav step-nav--project">
                    <el-button @click="backToProgress">Back</el-button>
                    <el-button @click="openHistory">View history</el-button>
                    <el-button type="primary" @click="goToOtherDetails">
                      Next: other details
                    </el-button>
                  </div>
                </template>

                <div v-else class="projects-empty">
                  <p>Select a project on Step 1 before entering updates.</p>
                  <el-button type="primary" link @click="backToProgress">Return to progress</el-button>
                </div>
              </div>

            <section v-show="activeSection === 'details'" class="form-section form-section--nested">
              <h2>4. Other details</h2>
              <div class="form-grid">
                <label class="field">
                  <span>Fiscal year *</span>
                  <el-select v-model="form.fiscalYear" class="field-control">
                    <el-option v-for="year in fiscalYearOptions" :key="year" :label="year" :value="year" />
                  </el-select>
                </label>

                <label class="field">
                  <span>Quarter *</span>
                  <el-select v-model="form.period" class="field-control">
                    <el-option label="Q1 (Jul–Sep)" :value="1" />
                    <el-option label="Q2 (Oct–Dec)" :value="2" />
                    <el-option label="Q3 (Jan–Mar)" :value="3" />
                    <el-option label="Q4 (Apr–Jun)" :value="4" />
                  </el-select>
                </label>

                <label class="field field-wide">
                  <span>Your name *</span>
                  <el-input v-model="form.submitterName" placeholder="Full name" />
                </label>
              </div>

              <div class="step-nav step-nav--project">
                <el-button @click="backToIndicators">Back</el-button>
                <el-button type="primary" :disabled="!canLeaveOtherDetails" @click="goToSubmit">
                  Next: documents
                </el-button>
              </div>
            </section>

            <section v-show="activeSection === 'documents'" class="form-section form-section--nested">
              <h2>5. Supporting documents</h2>
              <p class="tab-intro">
                Optional. Attach up to {{ MAX_DOCUMENTS }} files (PDF, Word, Excel, or images), 10 MB each.
              </p>

              <el-upload
                class="document-upload"
                drag
                multiple
                :auto-upload="false"
                :limit="MAX_DOCUMENTS"
                :file-list="documentFiles"
                :on-change="onDocumentChange"
                :on-remove="onDocumentRemove"
                :on-exceed="() => ElMessage.warning(`You can attach up to ${MAX_DOCUMENTS} documents`)"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/*"
              >
                <Icon icon="mdi:cloud-upload-outline" class="document-upload__icon" />
                <div class="document-upload__text">Drop files here or click to browse</div>
              </el-upload>

              <div v-if="documentFiles.length && isMobile" class="document-cards">
                <div v-for="file in documentFiles" :key="file.uid" class="document-card">
                  <div class="document-card__head">
                    <span class="document-card__name">{{ file.name }}</span>
                    <el-button link type="danger" @click="removeDocument(file.uid)">Remove</el-button>
                  </div>
                  <p class="document-card__meta">{{ formatFileSize(file.size || 0) }}</p>
                </div>
              </div>

              <div class="step-nav step-nav--project">
                <el-button @click="backToOtherDetails">Back</el-button>
                <el-button type="primary" @click="goToReview">
                  Next: review
                </el-button>
              </div>
            </section>

            <section v-show="activeSection === 'submit'" class="form-section form-section--nested">
              <h2>6. Review and submit</h2>

              <div class="review-summary">
                <span><strong>Region:</strong> {{ form.region }}</span>
                <span><strong>Project:</strong> {{ selectedPickerProject?.title }}</span>
                <span><strong>Period:</strong> {{ form.fiscalYear }} · Q{{ form.period }}</span>
                <span><strong>Submitted by:</strong> {{ form.submitterName }}</span>
                <span>
                  <strong>Documents:</strong>
                  {{ documentFiles.length ? `${documentFiles.length} file(s)` : 'None' }}
                </span>
              </div>

              <section v-if="projectReports.length" class="added-projects">
                <h3>{{ submitSummary }}</h3>
                <div class="added-projects-scroll">
                  <el-table :data="projectReports" stripe class="added-projects-table">
                    <el-table-column label="Project" min-width="180">
                      <template #default="{ row }">
                        <div class="project-title">{{ row.title }}</div>
                        <div class="project-meta">{{ row.county }}</div>
                      </template>
                    </el-table-column>
                    <el-table-column label="Progress" width="100" align="center">
                      <template #default="{ row }">
                        {{ row.completionPct != null ? `${row.completionPct}%` : '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="Indicators" min-width="220">
                      <template #default="{ row }">
                        <template v-if="row.indicators.length">
                          <div
                            v-for="ind in row.indicators"
                            :key="ind.indicatorCategoryId"
                            class="indicator-summary-row"
                          >
                            <span class="indicator-summary-label">{{ ind.label }}</span>
                            <span class="indicator-summary-value">
                              <template v-if="ind.isQualitative">{{ ind.qualitative }}</template>
                              <template v-else>{{ ind.cumAmount }}{{ ind.unit ? ` ${ind.unit}` : '' }}</template>
                            </span>
                          </div>
                        </template>
                        <span v-else>—</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="" width="70" align="right" fixed="right">
                      <template #default="{ row }">
                        <el-button link type="primary" @click="editProject(row.projectId)">Edit</el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </section>

              <p v-else class="projects-empty">
                Enter a progress or indicator update before submitting.
              </p>

              <div class="step-nav step-nav--project">
                <el-button @click="backToDocuments">Back</el-button>
                <el-button
                  :disabled="!canSubmit"
                  :loading="submitting"
                  @click="submitAndStartAnother"
                >
                  Submit &amp; add another report
                </el-button>
                <el-button
                  type="primary"
                  :disabled="!canSubmit"
                  :loading="submitting"
                  @click="handleSubmit()"
                >
                  Submit regional report
                </el-button>
              </div>
            </section>
            </div>

        </template>

        <el-dialog
          v-model="historyDialogOpen"
          :title="selectedPickerProject ? `History · ${selectedPickerProject.title}` : 'Project history'"
          :width="isMobile ? '95%' : '760px'"
          append-to-body
        >
          <div v-loading="loadingHistory">
            <p class="tab-intro">Previously filed updates for this project, newest first.</p>

            <template v-if="historyEntries.length">
              <div v-if="isMobile" class="history-cards">
                <div v-for="entry in historyEntries" :key="entry.id" class="history-card">
                  <div class="history-card__head">
                    <span class="history-card__label">{{ entry.label }}</span>
                    <span class="history-card__date">{{ formatHistoryDate(entry.date) }}</span>
                  </div>
                  <p class="history-card__meta">{{ entry.code }} · Q{{ entry.period }}</p>
                  <p class="history-card__values">
                    <span v-if="entry.qualitative">{{ entry.qualitative }}</span>
                    <span v-else>Cumulative <strong>{{ entry.cumAmount }}</strong></span>
                    <span v-if="entry.progress != null"> · {{ entry.progress }}%</span>
                  </p>
                </div>
              </div>

              <el-table
                v-else
                :data="historyEntries"
                stripe
                size="small"
                max-height="420"
              >
                <el-table-column label="Date" width="100">
                  <template #default="{ row }">{{ formatHistoryDate(row.date) }}</template>
                </el-table-column>
                <el-table-column label="Qtr" width="60" align="center">
                  <template #default="{ row }">Q{{ row.period }}</template>
                </el-table-column>
                <el-table-column label="Indicator" min-width="170" show-overflow-tooltip>
                  <template #default="{ row }">{{ row.label }}</template>
                </el-table-column>
                <el-table-column label="Cumulative" width="110" align="right">
                  <template #default="{ row }">
                    <span v-if="row.qualitative">{{ row.qualitative }}</span>
                    <span v-else>{{ row.cumAmount }}{{ row.unit ? ` ${row.unit}` : '' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Progress" width="90" align="right">
                  <template #default="{ row }">{{ formatHistoryProgress(row) }}</template>
                </el-table-column>
                <el-table-column label="Filing" width="130" show-overflow-tooltip>
                  <template #default="{ row }">{{ row.code }}</template>
                </el-table-column>
              </el-table>
            </template>

            <p v-else-if="!loadingHistory" class="projects-empty">
              No previous updates filed for this project.
            </p>
          </div>

          <template #footer>
            <el-button @click="historyDialogOpen = false">Close</el-button>
          </template>
        </el-dialog>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.regional-report-page {
  min-height: 100vh;
  background: var(--el-bg-color-page);
  padding: 16px;
}

.regional-report-container {
  max-width: 900px;
  margin: 0 auto;
}

.regional-report-card {
  border-radius: 12px;
}

.regional-report-header {
  display: flex;
  gap: 12px;
  align-items: center;
}

.regional-report-logo {
  width: 40px;
  height: 40px;
}

.regional-report-title {
  margin: 0;
  font-size: 1.25rem;
}

.regional-report-subtitle {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 0.92rem;
}

.form-section {
  margin-bottom: 24px;
}

.form-section--nested {
  margin-bottom: 16px;
}

.form-section--nested:last-child {
  margin-bottom: 0;
}

.form-section h2,
.form-section h3,
.added-projects h3 {
  margin: 0 0 12px;
  font-size: 1rem;
}

/* Two-step flow: Details, then Projects — navigated by the Next/Back buttons. */
.step-nav {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.step-nav > .submit-hint {
  margin-right: auto;
  align-self: center;
}

.project-picker {
  margin: 18px 0 14px;
  padding-top: 14px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.project-step-heading {
  margin-bottom: 14px;
}

.project-step-heading h2 {
  margin: 0;
  font-size: 1rem;
}

.project-step-heading p {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 0.88rem;
  line-height: 1.4;
}

.tab-intro {
  margin: 0 0 8px;
  color: var(--el-text-color-secondary);
  font-size: 0.9rem;
}

.indicator-table-wrap {
  margin-bottom: 8px;
}

.history-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-card {
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}

.history-card__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.history-card__label {
  font-weight: 600;
  font-size: 0.88rem;
  line-height: 1.3;
  min-width: 0;
}

.history-card__date {
  flex-shrink: 0;
  font-size: 0.75rem;
  color: var(--el-text-color-secondary);
}

.history-card__meta {
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: var(--el-text-color-secondary);
}

.history-card__values {
  margin: 4px 0 0;
  font-size: 0.85rem;
}

/* Mobile: one card per indicator, so nothing scrolls sideways and both inputs
   get a full-width touch target. */
.indicator-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.indicator-card {
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}

.indicator-card__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.indicator-card__label {
  font-weight: 600;
  font-size: 0.92rem;
  line-height: 1.3;
}

.indicator-card__unit {
  flex-shrink: 0;
  font-size: 0.75rem;
  color: var(--el-text-color-secondary);
}

.indicator-card__current {
  margin: 4px 0 8px;
  font-size: 0.82rem;
  color: var(--el-text-color-secondary);
}

.indicator-card__fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.indicator-card__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.indicator-card__field > span {
  font-size: 0.75rem;
  color: var(--el-text-color-secondary);
}

/* el-input-number is inline-block at a fixed width by default */
.indicator-card__field :deep(.el-input-number),
.indicator-card__field :deep(.el-select) {
  width: 100%;
}

.target-input {
  width: 100%;
}

/* el-input-number centres its value; left-align so it reads like the other cells */
.target-input :deep(.el-input__inner) {
  text-align: left;
}

.target-static {
  color: var(--el-text-color-secondary);
}

.indicator-summary-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.88rem;
  padding: 2px 0;
}

.indicator-summary-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.indicator-summary-value {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
}

.project-detail-card {
  margin-top: 8px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  background: var(--el-fill-color-blank);
}

.selected-project-title {
  margin: 6px 0 0;
  font-size: 0.82rem;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.project-detail-grid {
  margin-bottom: 8px;
}

.added-projects {
  margin-top: 8px;
}

.added-projects-scroll {
  max-height: min(40vh, 320px);
  overflow: auto;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
}

.added-projects-table {
  width: 100%;
}

.projects-empty {
  margin: 0;
  padding: 24px 12px;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 0.92rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.step-selection-fields {
  grid-template-columns: 1fr;
}

.review-summary {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-light);
  font-size: 0.9rem;
  line-height: 1.45;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
}

.field-wide {
  grid-column: 1 / -1;
}

.field-control {
  width: 100%;
}

.field-hint {
  font-size: 0.78rem;
  color: var(--el-text-color-secondary);
}

.project-title {
  font-weight: 500;
  line-height: 1.35;
}

.project-meta {
  margin-top: 4px;
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
}

.submit-hint {
  color: var(--el-text-color-secondary);
  font-size: 0.9rem;
}

.regional-report-success {
  text-align: center;
  padding: 24px 12px;
}

.success-icon {
  font-size: 48px;
  color: var(--el-color-success);
}

.success-note {
  color: var(--el-text-color-secondary);
}

.document-upload {
  margin-bottom: 14px;
}

.document-upload :deep(.el-upload),
.document-upload :deep(.el-upload-dragger) {
  width: 100%;
}

.document-upload__icon {
  font-size: 2rem;
  color: var(--el-color-primary);
}

.document-upload__text {
  margin-top: 8px;
  color: var(--el-text-color-secondary);
  font-size: 0.9rem;
}

.document-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.document-card {
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}

.document-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.document-card__name {
  min-width: 0;
  font-weight: 600;
  font-size: 0.9rem;
  line-height: 1.35;
  word-break: break-word;
}

.document-card__meta {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 0.78rem;
}

@media (max-width: 600px) {
  .document-upload :deep(.el-upload-list) {
    display: none;
  }
  .step-nav--project {
    display: grid;
    grid-template-columns: 1fr;
  }

  .step-nav--project :deep(.el-button) {
    width: 100%;
    margin-left: 0;
  }
}
</style>
