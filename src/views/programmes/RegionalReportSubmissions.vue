<template>
  <div class="regional-report-submissions">
    <el-card v-loading="loading">
      <div class="page-header">
        <div>
          <h2 class="page-title">Regional report submissions</h2>
          <p class="page-subtitle">
            Quarterly progress reports submitted via the public regional form. Approving a submission
            creates the linked M&amp;E indicator reports and updates project progress.
          </p>
        </div>
      </div>

      <el-row :gutter="12" class="toolbar" align="middle">
        <el-col :xs="24" :sm="8" :md="5" :lg="4">
          <el-select
            v-model="regionFilter"
            placeholder="All regions"
            clearable
            filterable
            style="width: 100%"
            @change="() => { page = 1; loadSubmissions() }"
          >
            <el-option v-for="region in CANONICAL_REGION_ORDER" :key="region" :label="region" :value="region" />
          </el-select>
        </el-col>

        <el-col :xs="24" :sm="8" :md="4" :lg="3">
          <el-select
            v-model="fiscalYearFilter"
            placeholder="All years"
            clearable
            style="width: 100%"
            @change="() => { page = 1; loadSubmissions() }"
          >
            <el-option v-for="year in fiscalYearOptions" :key="year" :label="year" :value="year" />
          </el-select>
        </el-col>

        <el-col :xs="24" :sm="8" :md="4" :lg="3">
          <el-select
            v-model="periodFilter"
            placeholder="All quarters"
            clearable
            style="width: 100%"
            @change="() => { page = 1; loadSubmissions() }"
          >
            <el-option v-for="(label, value) in periodLabels" :key="value" :label="label" :value="Number(value)" />
          </el-select>
        </el-col>

        <el-col :xs="24" :sm="12" :md="7" :lg="6">
          <el-input
            v-model="search"
            placeholder="Search filing code or submitter…"
            clearable
            @input="onSearchInput"
            @clear="() => { page = 1; loadSubmissions() }"
          >
            <template #append>
              <el-button :icon="Search" @click="loadSubmissions" />
            </template>
          </el-input>
        </el-col>

        <el-col :xs="24" :sm="12" :md="4" :lg="8">
          <div class="toolbar-right">
            <el-tag v-if="total" type="info" effect="plain">{{ total }} total</el-tag>
            <el-button :icon="DocumentCopy" plain @click="copyPublicLink">Copy form link</el-button>
            <el-button plain @click="resetFilters">Reset</el-button>
            <el-button :icon="Refresh" circle plain :loading="loading" @click="loadSubmissions" />
          </div>
        </el-col>
      </el-row>

      <el-table
        :data="submissions"
        stripe
        border
        row-key="id"
        class="submissions-table"
        :row-class-name="() => 'clickable-row'"
        @row-click="openDetail"
      >
        <el-table-column prop="filingCode" label="Filing code" min-width="220" show-overflow-tooltip />
        <el-table-column prop="region" label="Region" min-width="160" />
        <el-table-column label="Period" min-width="150">
          <template #default="{ row }">
            {{ row.fiscalYear }} · {{ periodLabel(row.period) }}
          </template>
        </el-table-column>
        <el-table-column label="Report date" width="120">
          <template #default="{ row }">{{ formatDate(row.reportDate) }}</template>
        </el-table-column>
        <el-table-column prop="submitterName" label="Submitted by" min-width="150" show-overflow-tooltip />
        <el-table-column prop="projectCount" label="Projects" width="90" align="center" />
        <el-table-column label="Received" width="130">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="Status" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="submissionStatusTag(row.status)">{{ formatSubmissionStatus(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="" width="48" fixed="right">
          <template #default>
            <Icon icon="mdi:chevron-right" :size="20" class="row-chevron" />
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        :layout="paginationLayout"
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :background="true"
        class="mt-4 settlement-pagination"
        :small="isMobile"
        :pager-count="isMobile ? 3 : 7"
        @size-change="onPageSizeChange"
        @current-change="loadSubmissions"
      >
        <el-select
          v-model="pageSize"
          size="small"
          class="settlement-page-size-select"
          @change="onPageSizeChange"
        >
          <el-option
            v-for="opt in getPageSizeOptions(total)"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-pagination>
    </el-card>

    <el-drawer
      v-model="drawerOpen"
      :title="selected?.filingCode || 'Submission details'"
      size="720px"
      destroy-on-close
    >
      <div v-loading="detailLoading" class="detail-scroll">
        <template v-if="selected">
          <div class="detail-grid">
            <div>
              <span class="detail-label">Region</span>
              <div>{{ selected.region }}</div>
            </div>
            <div>
              <span class="detail-label">Period</span>
              <div>{{ selected.fiscalYear }} · {{ periodLabel(selected.period) }}</div>
            </div>
            <div>
              <span class="detail-label">Report date</span>
              <div>{{ formatDate(selected.reportDate) }}</div>
            </div>
            <div>
              <span class="detail-label">Status</span>
              <div>
                <el-tag size="small" :type="submissionStatusTag(selected.status)">
                  {{ formatSubmissionStatus(selected.status) }}
                </el-tag>
              </div>
            </div>
            <div>
              <span class="detail-label">Received</span>
              <div>{{ formatDateTime(selected.createdAt) }}</div>
            </div>
            <div v-if="selected.reviewedAt">
              <span class="detail-label">Reviewed</span>
              <div>{{ formatDateTime(selected.reviewedAt) }}<span v-if="selected.reviewedBy"> · {{ selected.reviewedBy }}</span></div>
            </div>
            <div>
              <span class="detail-label">Submitted by</span>
              <div>
                {{ selected.submitterName }}
                <span v-if="selected.submitterTitle"> · {{ selected.submitterTitle }}</span>
              </div>
            </div>
            <div v-if="selected.coSubmitters">
              <span class="detail-label">Co-submitters</span>
              <div>{{ selected.coSubmitters }}</div>
            </div>
          </div>

          <p v-if="selected.notes" class="detail-notes">
            <span class="detail-label">Submitter notes</span>
            {{ selected.notes }}
          </p>

          <p v-if="selected.rejectReason" class="detail-notes detail-notes--reject">
            <span class="detail-label">Rejection reason</span>
            {{ selected.rejectReason }}
          </p>

          <div v-if="canReview && isPending" class="review-notes-field">
            <span class="detail-label">Reviewer notes (optional)</span>
            <el-input
              v-model="reviewNotes"
              type="textarea"
              :rows="2"
              placeholder="Notes for the approval record"
            />
          </div>

          <h3 class="detail-section-title">Projects ({{ editableProjects.length }})</h3>
          <el-table :data="editableProjects" border stripe size="small" row-key="projectId">
            <el-table-column type="expand">
              <template #default="{ row }">
                <div v-if="row.indicators?.length" class="indicator-expand">
                  <div class="indicator-expand__title">Indicator updates</div>
                  <el-table :data="row.indicators" size="small" border>
                    <el-table-column prop="label" label="Indicator" min-width="180" show-overflow-tooltip />
                    <el-table-column label="Cumulative" width="140" align="right">
                      <template #default="{ row: ind }">
                        <template v-if="ind.qualitative">{{ ind.qualitative }}</template>
                        <template v-else>
                          {{ ind.cumAmount }}{{ ind.unit ? ` ${ind.unit}` : '' }}
                          <span v-if="ind.minCumAmount != null" class="indicator-min">
                            (min {{ ind.minCumAmount }})
                          </span>
                        </template>
                      </template>
                    </el-table-column>
                    <el-table-column label="Target" width="90" align="right">
                      <template #default="{ row: ind }">{{ ind.target ?? '—' }}</template>
                    </el-table-column>
                    <el-table-column v-if="!isPending" label="M&E" width="90" align="center">
                      <template #default="{ row: ind }">
                        <el-tag v-if="ind.indicatorStatus" size="small" :type="indicatorStatusTag(ind.indicatorStatus)">
                          {{ ind.indicatorStatus }}
                        </el-tag>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
                <p v-else class="indicator-expand indicator-expand--empty">No optional indicator updates for this project.</p>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="Project" min-width="200" show-overflow-tooltip />
            <el-table-column prop="projectCode" label="Code" width="110" show-overflow-tooltip />
            <el-table-column label="Completion" width="130" align="center">
              <template #default="{ row }">
                <el-input-number
                  v-if="canReview && isPending && row.completionPct != null"
                  v-model="row.completionPct"
                  :min="row.minCompletionPct ?? 0"
                  :max="100"
                  :step="1"
                  size="small"
                  controls-position="right"
                  class="completion-input"
                />
                <span v-else-if="row.completionPct != null">{{ row.completionPct }}%</span>
                <span v-else>—</span>
              </template>
            </el-table-column>
            <el-table-column label="Workers" width="100">
              <template #default="{ row }">
                <el-input
                  v-if="canReview && isPending"
                  v-model="row.workersOnSite"
                  size="small"
                  placeholder="—"
                />
                <span v-else>{{ row.workersOnSite || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Remarks" min-width="160">
              <template #default="{ row }">
                <el-input
                  v-if="canReview && isPending"
                  v-model="row.remarks"
                  size="small"
                  placeholder="—"
                />
                <span v-else>{{ row.remarks || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column v-if="!isPending" label="M&E" width="90" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.indicatorStatus" size="small" :type="indicatorStatusTag(row.indicatorStatus)">
                  {{ row.indicatorStatus }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>

          <p v-if="isPending" class="detail-hint">
            Approve to create M&amp;E indicator reports (Implementation status and any optional indicators)
            and update each project's progress where completion % was submitted. Reject closes the submission
            without changing project data.
          </p>
          <p v-else class="detail-hint">
            This submission was {{ formatSubmissionStatus(selected.status).toLowerCase() }}
            <span v-if="selected.reviewedBy"> by {{ selected.reviewedBy }}</span>.
          </p>
        </template>
      </div>

      <div v-if="selected && canReview && isPending" class="drawer-actions">
        <el-button @click="drawerOpen = false">Close</el-button>
        <el-button :loading="reviewLoading" @click="submitReview('save')">Save changes</el-button>
        <el-button type="danger" plain :loading="reviewLoading" @click="openRejectDialog">Reject</el-button>
        <el-button type="primary" :loading="reviewLoading" @click="submitReview('approve')">Approve</el-button>
      </div>
    </el-drawer>

    <el-dialog v-model="rejectDialogOpen" title="Reject regional report" width="480px">
      <p class="reject-dialog-text">
        Rejecting will close this submission without creating M&amp;E indicator reports or changing project progress.
      </p>
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="3"
        placeholder="Reason for rejection (required)"
      />
      <template #footer>
        <el-button @click="rejectDialogOpen = false">Cancel</el-button>
        <el-button type="danger" :loading="reviewLoading" @click="confirmReject">Reject report</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  ElButton,
  ElCard,
  ElCol,
  ElDialog,
  ElDrawer,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElPagination,
  ElRow,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus'
import { DocumentCopy, Refresh, Search } from '@element-plus/icons-vue'
import { Icon } from '@/components/Icon'
import axios from 'axios'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { getAuthUserInfo } from '@/hooks/web/authStorage'
import { CANONICAL_REGION_ORDER } from '@/constants/projectRegions'

type SubmissionSummary = {
  id: number
  filingCode: string
  region: string
  fiscalYear: string
  period: number
  reportDate: string
  submitterName: string
  submitterTitle: string | null
  coSubmitters: string | null
  notes: string | null
  status: string
  projectCount: number
  createdAt: string
}

type SubmissionIndicator = {
  indicatorCategoryId: number
  label: string | null
  unit: string | null
  cumAmount: number
  minCumAmount?: number | null
  target?: number | null
  targetKind?: string | null
  qualitative?: string | null
  indicatorReportId?: number | null
  indicatorStatus?: string | null
}

type SubmissionProject = {
  projectId: number
  title: string
  projectCode: string
  region: string
  completionPct: number | null
  minCompletionPct?: number
  remarks: string | null
  workersOnSite: string | null
  indicatorReportId?: number | null
  indicatorStatus?: string | null
  indicators?: SubmissionIndicator[]
}

type SubmissionDetail = SubmissionSummary & {
  projects: SubmissionProject[]
  reviewNotes?: string | null
  rejectReason?: string | null
  reviewedAt?: string | null
  reviewedBy?: string | null
}

const appStore = useAppStoreWithOut()
const { wsCache } = useCache()
const base = import.meta.env.VITE_APP_HOST || ''

const getToken = () => wsCache.get(appStore.getUserInfo)?.data || ''
const authHeaders = () => ({ 'x-access-token': getToken(), 'Content-Type': 'application/json' })

const loading = ref(false)
const detailLoading = ref(false)
const submissions = ref<SubmissionSummary[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const isMobile = ref(typeof window !== 'undefined' ? window.innerWidth <= 768 : false)

// Pagination mirrors Sett.vue: the page-size select rides in the leading `slot` so the
// whole control reads left-to-right, and the size list gains an "All (n)" entry.
const paginationLayout = computed(() =>
  isMobile.value ? 'prev, pager, next, total' : 'slot, prev, pager, next, total'
)

const basePageSizes = [5, 10, 15, 20, 50, 100]

const getPageSizeOptions = (totalCount: number): { value: number; label: string }[] => {
  const opts = basePageSizes.map((s) => ({ value: s, label: `${s}/page` }))
  if (typeof totalCount !== 'number' || totalCount <= 0) return opts

  const allLabel = `All (${totalCount})`
  const existingIdx = opts.findIndex((o) => o.value === totalCount)
  if (existingIdx >= 0) {
    opts[existingIdx] = { value: totalCount, label: allLabel }
  } else {
    opts.push({ value: totalCount, label: allLabel })
  }
  return opts
}

const regionFilter = ref('')
const fiscalYearFilter = ref('')
const periodFilter = ref<number | ''>('')
const search = ref('')

const drawerOpen = ref(false)
const selected = ref<SubmissionDetail | null>(null)
const editableProjects = ref<SubmissionProject[]>([])
const reviewNotes = ref('')
const rejectReason = ref('')
const rejectDialogOpen = ref(false)
const reviewLoading = ref(false)

const userInfo = wsCache.get(appStore.getUserInfo)

const canReview = computed(() => {
  const info = getAuthUserInfo<{ permissions?: string[] }>() || userInfo
  const perms = Array.isArray(info?.permissions) ? info.permissions : []
  return perms.includes('regional_report_submission:review')
})

const isPending = computed(() => {
  const status = String(selected.value?.status || 'submitted').toLowerCase()
  return status === 'submitted'
})

const periodLabels: Record<number, string> = {
  1: 'Q1 (Jul-Sep)',
  2: 'Q2 (Oct-Dec)',
  3: 'Q3 (Jan-Mar)',
  4: 'Q4 (Apr-Jun)',
}

const fiscalYearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const start = currentYear >= 7 ? currentYear : currentYear - 1
  return [0, 1, 2].map((offset) => {
    const y = start - offset
    return `${y}/${y + 1}`
  })
})

function periodLabel(period: number) {
  return periodLabels[period] || `Q${period}`
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatSubmissionStatus(status: string | null | undefined) {
  const value = String(status || 'submitted').toLowerCase()
  if (value === 'approved') return 'Approved'
  if (value === 'rejected') return 'Rejected'
  return 'Pending review'
}

function submissionStatusTag(status: string | null | undefined) {
  const value = String(status || 'submitted').toLowerCase()
  if (value === 'approved') return 'success'
  if (value === 'rejected') return 'danger'
  return 'warning'
}

function indicatorStatusTag(status: string | null | undefined) {
  const value = String(status || '').toLowerCase()
  if (value === 'approved') return 'success'
  if (value === 'rejected') return 'danger'
  return 'warning'
}

function buildReviewPayload() {
  return editableProjects.value.map((row) => ({
    projectId: row.projectId,
    completionPct: row.completionPct != null ? Number(row.completionPct) : undefined,
    remarks: row.remarks?.trim() || null,
    workersOnSite: row.workersOnSite?.trim() || null,
    indicators: (row.indicators || []).map((ind) => ({
      indicatorCategoryId: ind.indicatorCategoryId,
      cumAmount: Number(ind.cumAmount),
      qualitative: ind.qualitative ?? null,
      label: ind.label ?? null,
      unit: ind.unit ?? null,
      target: ind.target ?? null,
      targetKind: ind.targetKind ?? null,
      minCumAmount: ind.minCumAmount ?? null,
    })),
  }))
}

async function submitReview(action: 'save' | 'approve' | 'reject') {
  if (!selected.value) return

  if (action === 'approve') {
    try {
      await ElMessageBox.confirm(
        'Approve this regional report and create M&E indicator reports for each project?',
        'Approve report',
        { type: 'warning', confirmButtonText: 'Approve', cancelButtonText: 'Cancel' },
      )
    } catch {
      return
    }
  }

  reviewLoading.value = true
  try {
    const res = await axios.put(
      `${base}/api/v1/regional-report-submissions/${selected.value.id}/review`,
      {
        action,
        projects: buildReviewPayload(),
        reviewNotes: reviewNotes.value.trim() || undefined,
        rejectReason: action === 'reject' ? rejectReason.value.trim() : undefined,
      },
      { headers: authHeaders() },
    )
    selected.value = res.data?.results || selected.value
    editableProjects.value = (selected.value?.projects || []).map((row) => ({ ...row }))
    reviewNotes.value = selected.value?.reviewNotes || ''
    rejectDialogOpen.value = false
    rejectReason.value = ''
    await loadSubmissions()
    ElMessage.success(res.data?.message || 'Updated')
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || 'Could not update submission')
  } finally {
    reviewLoading.value = false
  }
}

function openRejectDialog() {
  rejectReason.value = ''
  rejectDialogOpen.value = true
}

async function confirmReject() {
  if (!rejectReason.value.trim()) {
    ElMessage.error('Enter a rejection reason')
    return
  }
  await submitReview('reject')
}

async function loadSubmissions() {
  loading.value = true
  try {
    const params: Record<string, string | number> = {
      page: page.value,
      limit: pageSize.value,
    }
    if (regionFilter.value) params.region = regionFilter.value
    if (fiscalYearFilter.value) params.fiscalYear = fiscalYearFilter.value
    if (periodFilter.value) params.period = periodFilter.value
    if (search.value.trim()) params.search = search.value.trim()

    const res = await axios.get(`${base}/api/v1/regional-report-submissions`, {
      headers: authHeaders(),
      params,
    })
    submissions.value = res.data?.results?.data || []
    total.value = res.data?.results?.total || 0
  } catch {
    ElMessage.error('Failed to load regional report submissions')
  } finally {
    loading.value = false
  }
}

async function openDetail(row: SubmissionSummary) {
  drawerOpen.value = true
  detailLoading.value = true
  selected.value = null
  editableProjects.value = []
  reviewNotes.value = ''
  rejectReason.value = ''
  try {
    const res = await axios.get(`${base}/api/v1/regional-report-submissions/${row.id}`, {
      headers: authHeaders(),
    })
    selected.value = res.data?.results || null
    editableProjects.value = (selected.value?.projects || []).map((project) => ({ ...project }))
    reviewNotes.value = selected.value?.reviewNotes || ''
  } catch {
    ElMessage.error('Could not load submission details')
    drawerOpen.value = false
  } finally {
    detailLoading.value = false
  }
}

/** Public form link. Router uses hash history, hence the `/#/`. */
const publicFormUrl = computed(() => `${window.location.origin}/#/regional-report`)

async function copyPublicLink() {
  const url = publicFormUrl.value
  try {
    // navigator.clipboard is undefined on insecure origins, so keep a fallback for
    // deployments served over plain http on the LAN.
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url)
    } else {
      const el = document.createElement('textarea')
      el.value = url
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    ElMessage.success('Public form link copied')
  } catch {
    ElMessageBox.alert(url, 'Copy this link', { confirmButtonText: 'Close' })
  }
}

/** A bigger page size can leave the current page past the end, so go back to page 1. */
function onPageSizeChange() {
  page.value = 1
  loadSubmissions()
}

function resetFilters() {
  regionFilter.value = ''
  fiscalYearFilter.value = ''
  periodFilter.value = ''
  search.value = ''
  page.value = 1
  loadSubmissions()
}

let searchTimer: ReturnType<typeof setTimeout>
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    loadSubmissions()
  }, 320)
}

onMounted(loadSubmissions)
</script>

<style scoped>
.regional-report-submissions {
  padding: 4px 0 16px;
}

.page-header {
  margin-bottom: 16px;
}

.page-title {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 600;
}

.page-subtitle {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 1.5;
}

.toolbar {
  margin-bottom: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.submissions-table {
  width: 100%;
}

/* Left-aligned, matching Sett.vue — no justify-content on desktop. */
@media (max-width: 768px) {
  :deep(.settlement-pagination) {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
    row-gap: 8px;
  }
}

/* Page-size selector living in the el-pagination "slot" position, replacing the
   built-in `sizes` so the total-count option can be labelled "All (n)". */
.settlement-page-size-select {
  width: 130px;
  margin-right: 8px;
}

@media (max-width: 768px) {
  .settlement-page-size-select {
    width: 110px;
    margin-right: 4px;
  }
}

.row-chevron {
  color: var(--el-text-color-placeholder);
  display: block;
  margin: auto;
}

:deep(.clickable-row) {
  cursor: pointer;
}

.detail-scroll {
  height: 75vh;
  overflow-y: auto;
  padding-right: 4px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 20px;
  margin-bottom: 16px;
}

.detail-label {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.detail-notes {
  margin: 0 0 16px;
  line-height: 1.5;
}

.detail-section-title {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 600;
}

.detail-hint {
  margin: 16px 0 0;
  padding: 12px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.detail-notes--reject {
  color: var(--el-color-danger);
}

.review-notes-field {
  margin-bottom: 16px;
}

.completion-input {
  width: 100%;
}

.indicator-expand {
  padding: 8px 4px 12px;
}

.indicator-expand__title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}

.indicator-expand--empty {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.indicator-min {
  display: block;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.drawer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 16px;
  margin-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.reject-dialog-text {
  margin: 0 0 12px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
