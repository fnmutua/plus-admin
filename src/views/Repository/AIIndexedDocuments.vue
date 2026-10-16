<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, reactive, ref } from 'vue'
import {
  ElCard, ElTable, ElTableColumn, ElTag, ElAlert, ElButton, ElDropdown, ElDropdownMenu,
  ElDropdownItem, ElMessageBox, ElPagination, ElSelect, ElOption, ElProgress
} from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import {
  getAIIndexedDocuments, getAIIndexJobs, reindexAIIndexEntry, reindexDocuments
} from '@/api/ai'
import type { AIIndexedDocument, AIIndexJob } from '@/api/ai/types'

const loading = ref(false)
const documents = ref<AIIndexedDocument[]>([])
const error = ref<string | null>(null)

const formatDate = (value: string) =>
  value
    ? new Intl.DateTimeFormat('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }).format(new Date(value))
    : '—'

const formatSize = (bytes: number) => {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** Where the document came from, read off its source key prefix. */
const SOURCES: Record<string, { label: string; type: 'primary' | 'success' | 'info' }> = {
  document: { label: 'Upload', type: 'primary' },
  path: { label: 'Folder', type: 'success' },
  record: { label: 'Record', type: 'info' }
}
const sourceOf = (row: AIIndexedDocument) =>
  SOURCES[(row.sourceKey || '').split(':')[0]] || { label: 'Other', type: 'info' as const }

const load = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await getAIIndexedDocuments()
    documents.value = response.data || []
    // Stay on the current page after a refresh unless the list got shorter.
    const lastPage = Math.max(1, Math.ceil(documents.value.length / pageSize.value))
    if (currentPage.value > lastPage) currentPage.value = lastPage
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || 'Could not load the AI index'
  } finally {
    loading.value = false
  }
}

// Paged in the browser: the whole index arrives in one small request, and
// sorting has to cover every page, not just the one on screen.
const currentPage = ref(1)
const pageSize = ref(10)
const sort = ref<{ prop: string | null; order: 'ascending' | 'descending' | null }>({
  prop: 'updatedAt',
  order: 'descending'
})

/** Same screen-height page sizes as the Documents list. */
const responsivePageSize = () => {
  const height = window.innerHeight
  if (height < 768) return 5
  if (height < 1024) return 10
  return 15
}

const sorted = computed(() => {
  const { prop, order } = sort.value
  if (!prop || !order) return documents.value
  const direction = order === 'ascending' ? 1 : -1
  return [...documents.value].sort((a, b) => {
    const x = (a as any)[prop] ?? ''
    const y = (b as any)[prop] ?? ''
    if (typeof x === 'number' && typeof y === 'number') return (x - y) * direction
    return String(x).localeCompare(String(y), undefined, { numeric: true }) * direction
  })
})

const pageRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sorted.value.slice(start, start + pageSize.value)
})

/** Row numbers continue across pages rather than restarting at 1. */
const rowNumber = (index: number) => (currentPage.value - 1) * pageSize.value + index + 1

const handleSortChange = ({ prop, order }: { prop: string | null; order: 'ascending' | 'descending' | null }) => {
  sort.value = { prop, order }
  currentPage.value = 1
}

const handlePageChange = (page: number) => {
  currentPage.value = page
}

const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

/** Index ids currently being re-indexed, so each row shows its own spinner. */
const busy = reactive<Record<string, boolean>>({})

const reindexRow = async (row: AIIndexedDocument) => {
  busy[row.id] = true
  try {
    // The shared axios interceptor toasts the server's message either way.
    const response = await reindexAIIndexEntry(row.id)
    if (response.success) await load()
  } catch {
    // Already shown by the interceptor.
  } finally {
    busy[row.id] = false
  }
}

const bulkRunning = ref(false)

// ── Progress ────────────────────────────────────────────────────────────────
// Indexing runs in the background, and "indexing 1,661 document(s)" followed
// by silence is indistinguishable from a job that died. The server reports
// every batch; this polls while one is running and stops when none is.

const jobs = ref<AIIndexJob[]>([])
const runningJobs = computed(() => jobs.value.filter((job) => job.status === 'running'))
const recentJob = computed(() => jobs.value.find((job) => job.status !== 'running') || null)

let poll: ReturnType<typeof setTimeout> | null = null
let wasRunning = false

/** Seconds and minutes, for a duration a person is watching tick by. */
const formatDuration = (ms: number | null) => {
  if (ms == null) return '—'
  const seconds = Math.round(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

const readJobs = async () => {
  try {
    const response = await getAIIndexJobs()
    jobs.value = response.data || []
  } catch {
    // A failed poll is not worth a toast; the next one will tell the story.
  }

  const running = runningJobs.value.length > 0
  // The list only changes when a batch finishes, so that is when to reload it.
  if (wasRunning && !running) load()
  wasRunning = running

  // Fast while something is happening, slow enough to be free when not.
  poll = setTimeout(readJobs, running ? 2000 : 15000)
}

/**
 * Queue uploaded documents for background indexing. Folder imports live on
 * disk rather than in the document table, so they are re-indexed per row or
 * with tools/ai-reindex.js.
 */
const reindexUploads = async (force: boolean) => {
  if (force) {
    try {
      await ElMessageBox.confirm(
        'Every uploaded document will be read and embedded again. This runs in the background and can take a while.',
        'Re-index all uploads?',
        { type: 'warning', confirmButtonText: 'Re-index all' }
      )
    } catch {
      return
    }
  }

  bulkRunning.value = true
  try {
    // "Indexing N document(s) in the background" is toasted by the interceptor.
    await reindexDocuments({ processAll: true, force })
    // Show the batch immediately rather than at the next poll.
    await readJobs()
  } catch {
    // Already shown by the interceptor.
  } finally {
    bulkRunning.value = false
  }
}

onMounted(() => {
  pageSize.value = responsivePageSize()
  load()
  readJobs()
})

onBeforeUnmount(() => {
  if (poll) clearTimeout(poll)
})
</script>

<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 style="margin: 0">AI Indexed Documents ({{ documents.length }})</h3>
        <div class="flex items-center gap-2">
          <el-button :icon="Refresh" :loading="loading" @click="load">Refresh</el-button>
          <el-dropdown split-button type="primary" :disabled="bulkRunning" @click="reindexUploads(false)">
            Index new uploads
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="reindexUploads(true)">Re-index all uploads</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </template>

    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon class="mb-3" />

    <!-- What the background is doing, while it is doing it. -->
    <div v-for="job in runningJobs" :key="job.id" class="job">
      <div class="job-head">
        <span class="job-label">{{ job.label }}</span>
        <span class="job-counts">
          {{ job.done }} / {{ job.total }}
          <span v-if="job.failed" class="job-failed">· {{ job.failed }} failed</span>
        </span>
      </div>
      <el-progress :percentage="job.percent" :stroke-width="10" striped striped-flow />
      <div class="job-foot">
        <span class="job-current">{{ job.current || 'Starting…' }}</span>
        <span>
          {{ formatDuration(job.elapsedMs) }} elapsed<template v-if="job.etaMs !== null">
            · about {{ formatDuration(job.etaMs) }} left</template>
        </span>
      </div>
    </div>

    <el-alert
      v-if="!runningJobs.length && recentJob"
      :type="recentJob.failed ? 'warning' : 'success'"
      :closable="false"
      show-icon
      class="mb-3"
      :title="`${recentJob.label} — ${recentJob.indexed} indexed`
        + (recentJob.failed ? `, ${recentJob.failed} failed` : '')
        + ` in ${formatDuration(recentJob.elapsedMs)}`"
    >
      <template v-if="recentJob.lastError" #default>
        <span class="job-error">Last error: {{ recentJob.lastError }}</span>
      </template>
    </el-alert>

    <el-table
      :data="pageRows"
      stripe
      border
      :default-sort="{ prop: 'updatedAt', order: 'descending' }"
      @sort-change="handleSortChange"
    >
      <el-table-column type="index" :index="rowNumber" label="#" width="60" />
      <el-table-column prop="filename" label="Document" min-width="240" sortable="custom" show-overflow-tooltip />
      <el-table-column label="Source" width="100">
        <template #default="{ row }">
          <el-tag :type="sourceOf(row).type" size="small">{{ sourceOf(row).label }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="fileType" label="Type" width="90" sortable="custom" />
      <el-table-column prop="fileSize" label="Size" width="100" sortable="custom">
        <template #default="{ row }">{{ formatSize(row.fileSize) }}</template>
      </el-table-column>
      <el-table-column prop="chunks" label="Chunks" width="100" sortable="custom" />
      <el-table-column prop="updatedAt" label="Indexed" width="190" sortable="custom">
        <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
      </el-table-column>
      <el-table-column label="" width="120" align="center">
        <template #default="{ row }">
          <el-button
            v-if="sourceOf(row).label !== 'Record'"
            size="small"
            :loading="busy[row.id]"
            @click="reindexRow(row)"
          >
            Reindex
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper" v-if="documents.length > 0">
      <div class="pagination-controls">
        <div class="page-size-selector">
          <span class="page-size-label">Show:</span>
          <el-select
            v-model="pageSize"
            size="small"
            style="width: 80px; margin-left: 8px"
            @change="handlePageSizeChange"
          >
            <el-option label="5" :value="5" />
            <el-option label="8" :value="8" />
            <el-option label="10" :value="10" />
            <el-option label="25" :value="25" />
            <el-option label="50" :value="50" />
            <el-option label="100" :value="100" />
          </el-select>
          <span class="page-size-label" style="margin-left: 8px">per page</span>
        </div>

        <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          background
          small
          layout="total, prev, pager, next, jumper"
          :total="documents.length"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.job {
  margin-bottom: 14px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

.job-head,
.job-foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
}

.job-label {
  font-weight: 600;
  font-size: 14px;
}

.job-counts {
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.job-failed {
  color: var(--el-color-warning);
}

.job-foot {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* The filename can be long; the elapsed time beside it must not be pushed out. */
.job-current {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 60%;
}

.job-error {
  font-size: 12px;
  color: var(--el-color-warning);
}

.pagination-wrapper {
  margin-top: 20px;
}

.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.page-size-selector {
  display: flex;
  align-items: center;
}

.page-size-label {
  font-size: 14px;
  color: #606266;
}
</style>
