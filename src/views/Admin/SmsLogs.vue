<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, watch } from 'vue'
import {
  ElCard,
  ElButton,
  ElInput,
  ElSelect,
  ElOption,
  ElTable,
  ElTableColumn,
  ElPagination,
  ElTag,
  ElDrawer,
  ElDescriptions,
  ElDescriptionsItem
} from 'element-plus'
import { listSmsLogs, getSmsLog } from '@/api/smsLog'

const isMobile = ref(typeof window !== 'undefined' ? window.innerWidth <= 768 : false)
const loading = ref(false)
const rows = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(25)
const sourceModules = ref<Array<{ value: string; label: string }>>([])

const sourceModule = ref('')
const status = ref('')
const destination = ref('')
const search = ref('')
const fromDate = ref('')
const toDate = ref('')

const drawerOpen = ref(false)
const detailLoading = ref(false)
const detail = ref<any>(null)

let filterDebounceTimer: ReturnType<typeof setTimeout> | null = null

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
  { value: 'pending', label: 'Pending' },
  { value: 'disabled', label: 'Disabled' },
  { value: 'skipped', label: 'Skipped' }
]

const fmt = (ts: string | Date | null) => {
  if (!ts) return '—'
  const d = typeof ts === 'string' ? new Date(ts) : ts
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}

const statusTagType = (value: string) => {
  if (value === 'sent') return 'success'
  if (value === 'failed') return 'danger'
  if (value === 'pending') return 'warning'
  return 'info'
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: currentPage.value,
      limit: pageSize.value
    }
    if (sourceModule.value) params.source_module = sourceModule.value
    if (status.value) params.status = status.value
    if (destination.value.trim()) params.destination = destination.value.trim()
    if (search.value.trim()) params.q = search.value.trim()
    if (fromDate.value) params.from = fromDate.value
    if (toDate.value) params.to = toDate.value

    const res: any = await listSmsLogs(params)
    const results = res?.results || res?.data?.results || {}
    rows.value = Array.isArray(results.data) ? results.data : []
    total.value = Number(results.total) || 0
    if (Array.isArray(results.sourceModules) && results.sourceModules.length) {
      sourceModules.value = results.sourceModules
    }
  } catch (error) {
    rows.value = []
    total.value = 0
    console.error('[SMS Logs] fetch failed:', error)
  } finally {
    loading.value = false
  }
}

const openDetail = async (row: any) => {
  drawerOpen.value = true
  detailLoading.value = true
  detail.value = row
  try {
    const res: any = await getSmsLog(row.id)
    detail.value = res?.results || res?.data?.results || row
  } catch (error) {
    console.error('[SMS Logs] detail fetch failed:', error)
  } finally {
    detailLoading.value = false
  }
}

const clearFilters = () => {
  sourceModule.value = ''
  status.value = ''
  destination.value = ''
  search.value = ''
  fromDate.value = ''
  toDate.value = ''
  currentPage.value = 1
  fetchData()
}

const onPageChange = () => fetchData()
const onPageSizeChange = () => {
  currentPage.value = 1
  fetchData()
}

watch([sourceModule, status, destination, fromDate, toDate], () => {
  currentPage.value = 1
  fetchData()
})

watch(search, () => {
  if (filterDebounceTimer) clearTimeout(filterDebounceTimer)
  filterDebounceTimer = setTimeout(() => {
    currentPage.value = 1
    fetchData()
  }, 350)
})

onMounted(() => fetchData())
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="card-header">
        <span>SMS Log</span>
        <span class="card-subtitle">Track all outbound SMS — source, destination, and delivery status</span>
      </div>
    </template>

    <div class="toolbar">
      <el-select v-model="sourceModule" placeholder="Source module" clearable class="filter-select">
        <el-option value="" label="All sources" />
        <el-option
          v-for="item in sourceModules"
          :key="item.value"
          :value="item.value"
          :label="item.label"
        />
      </el-select>

      <el-select v-model="status" placeholder="Status" clearable class="filter-select">
        <el-option v-for="item in statusOptions" :key="item.value" :value="item.value" :label="item.label" />
      </el-select>

      <el-input v-model="destination" placeholder="Destination phone" clearable class="filter-input" />

      <el-input v-model="search" placeholder="Search message or provider response" clearable class="filter-input-wide" />

      <el-input v-model="fromDate" type="date" class="date-input" />
      <el-input v-model="toDate" type="date" class="date-input" />

      <el-button @click="clearFilters">Clear</el-button>
      <el-button @click="fetchData" :loading="loading">Refresh</el-button>
    </div>

    <el-table
      :data="rows"
      border
      v-loading="loading"
      style="width: 100%"
      empty-text="No SMS logs found"
      @row-click="openDetail"
      row-class-name="clickable-row"
    >
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="Sent" width="170">
        <template #default="scope">{{ fmt(scope.row.sent_at || scope.row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="Source" min-width="150">
        <template #default="scope">
          {{ scope.row.source_module_label || scope.row.source_module }}
          <span v-if="scope.row.source_type" class="muted"> · {{ scope.row.source_type }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="sender_shortcode" label="From" width="90" />
      <el-table-column prop="destination" label="Destination" width="130" />
      <el-table-column label="Status" width="100">
        <template #default="scope">
          <el-tag :type="statusTagType(scope.row.status)" size="small">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Provider" min-width="180" show-overflow-tooltip>
        <template #default="scope">
          <span v-if="scope.row.provider_code">{{ scope.row.provider_code }}</span>
          <span v-if="scope.row.provider_message" class="muted"> — {{ scope.row.provider_message }}</span>
          <span v-if="!scope.row.provider_code && !scope.row.provider_message">—</span>
        </template>
      </el-table-column>
      <el-table-column label="Message" min-width="220" show-overflow-tooltip prop="message" />
    </el-table>

    <el-pagination
      class="mt-4"
      :layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[10, 25, 50, 100]"
      :total="total"
      :background="true"
      @size-change="onPageSizeChange"
      @current-change="onPageChange"
      :small="isMobile"
      :pager-count="isMobile ? 3 : 7"
    />
  </el-card>

  <el-drawer v-model="drawerOpen" title="SMS Detail" size="480px">
    <div v-loading="detailLoading">
      <el-descriptions v-if="detail" :column="1" border>
        <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item label="Sent">{{ fmt(detail.sent_at || detail.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="Source">
          {{ detail.source_module_label || detail.source_module }}
          <span v-if="detail.source_type"> ({{ detail.source_type }})</span>
        </el-descriptions-item>
        <el-descriptions-item label="From">{{ detail.sender_shortcode || 'KISIP' }}</el-descriptions-item>
        <el-descriptions-item label="Destination">{{ detail.destination }}</el-descriptions-item>
        <el-descriptions-item label="Status">
          <el-tag :type="statusTagType(detail.status)" size="small">{{ detail.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Provider code">{{ detail.provider_code || '—' }}</el-descriptions-item>
        <el-descriptions-item label="Provider message">{{ detail.provider_message || '—' }}</el-descriptions-item>
        <el-descriptions-item label="Initiated by">
          {{ detail.initiator?.name || detail.initiator?.username || '—' }}
        </el-descriptions-item>
        <el-descriptions-item label="Message">
          <div class="message-block">{{ detail.message }}</div>
        </el-descriptions-item>
      </el-descriptions>
    </div>
  </el-drawer>
</template>

<style scoped>
.card-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-subtitle {
  font-size: 13px;
  color: #7a8088;
  font-weight: 400;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
  align-items: center;
}

.filter-input {
  width: 180px;
}

.filter-input-wide {
  width: 260px;
}

.filter-select {
  width: 180px;
}

.date-input {
  width: 160px;
}

.muted {
  color: #8a8f98;
}

.message-block {
  white-space: pre-wrap;
  word-break: break-word;
}

:deep(.clickable-row) {
  cursor: pointer;
}
</style>
