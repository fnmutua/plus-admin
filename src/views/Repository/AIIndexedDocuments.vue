<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  ElCard, ElTable, ElTableColumn, ElTag, ElAlert, ElButton, ElDropdown, ElDropdownMenu,
  ElDropdownItem, ElMessageBox, ElPagination, ElSelect, ElOption
} from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getAIIndexedDocuments, reindexAIIndexEntry, reindexDocuments } from '@/api/ai'
import type { AIIndexedDocument } from '@/api/ai/types'

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
  } catch {
    // Already shown by the interceptor.
  } finally {
    bulkRunning.value = false
  }
}

onMounted(() => {
  pageSize.value = responsivePageSize()
  load()
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
