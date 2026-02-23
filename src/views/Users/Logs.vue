<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Back } from '@element-plus/icons-vue'
import {
  ElCard,
  ElButton,
  ElInput,
  ElSelect,
  ElOption,
  ElTable,
  ElTableColumn,
  ElPagination
} from 'element-plus'
import { getAuditLogs } from '@/api/audit'

const router = useRouter()
const loading = ref(false)
const rows = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(25)
let filterDebounceTimer: ReturnType<typeof setTimeout> | null = null
let suppressLiveFilter = false

const actor = ref('')
const entityType = ref('')
const action = ref('')
const outcome = ref('')
const fromDate = ref('')
const toDate = ref('')

const outcomeOptions = [
  { value: '', label: 'All outcomes' },
  { value: 'success', label: 'Success' },
  { value: 'failure', label: 'Failure' }
]

const actionOptions = [
  { value: '', label: 'All actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'status_change', label: 'Status change' }
]

const entityOptions = [
  { value: '', label: 'All entities' },
  { value: 'users', label: 'Users' },
  { value: 'grievance', label: 'Grievance' },
  { value: 'document', label: 'Document' },
  { value: 'project', label: 'Project' },
  { value: 'project_task', label: 'Project task' }
]

const fmt = (ts: string | Date) => {
  if (!ts) return '—'
  const d = typeof ts === 'string' ? new Date(ts) : ts
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}

const pretty = (obj: unknown) => {
  if (!obj) return '—'
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}

const normalizeRows = (list: any) => {
  if (!Array.isArray(list)) return []
  return list.map((r) => ({
    ...r,
    actorDisplay: r.actorName || r.actorId || 'anonymous',
    outcomeDisplay: r.outcome || r.status || '—',
    resourceDisplay: r.resource || r.source || '—',
    changesDisplay: r.changes || r.metadata || null
  }))
}

const fetchData = async () => {
  loading.value = true
  try {
    const payload: Record<string, any> = {
      page: currentPage.value,
      limit: pageSize.value
    }

    if (actor.value.trim()) payload.actor = actor.value.trim()
    if (entityType.value) payload.entityType = entityType.value
    if (action.value) payload.action = action.value
    if (outcome.value) payload.outcome = outcome.value
    if (fromDate.value) payload.from = fromDate.value
    if (toDate.value) payload.to = toDate.value

    const res = await getAuditLogs(payload)
    const rawRows = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.results)
          ? res.results
          : []

    rows.value = normalizeRows(rawRows)
    total.value = Number(res?.total ?? res?.data?.total ?? rows.value.length ?? 0)
  } catch (error) {
    rows.value = []
    total.value = 0
    console.error('Failed to fetch audit logs:', error)
  } finally {
    loading.value = false
  }
}

const triggerLiveFilterFetch = (debounceMs = 0) => {
  if (suppressLiveFilter) return
  currentPage.value = 1

  if (filterDebounceTimer) {
    clearTimeout(filterDebounceTimer)
    filterDebounceTimer = null
  }

  if (debounceMs > 0) {
    filterDebounceTimer = setTimeout(() => {
      fetchData()
    }, debounceMs)
    return
  }

  fetchData()
}

const clearFilters = () => {
  suppressLiveFilter = true
  actor.value = ''
  entityType.value = ''
  action.value = ''
  outcome.value = ''
  fromDate.value = ''
  toDate.value = ''
  suppressLiveFilter = false

  if (filterDebounceTimer) {
    clearTimeout(filterDebounceTimer)
    filterDebounceTimer = null
  }

  currentPage.value = 1
  fetchData()
}

const onPageSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  fetchData()
}

const onPageChange = (page: number) => {
  currentPage.value = page
  fetchData()
}

const rowClass = (args?: { row?: any }) => {
  const row = args && args.row ? args.row : null
  const value = String((row && row.outcomeDisplay) || '').toLowerCase()
  if (value.includes('failure') || value.includes('fail')) return 'danger-row'
  if (value.includes('success')) return 'success-row'
  return ''
}

const outcomeWithCode = (row: any) => {
  const outcomeLabel = row?.outcomeDisplay ? String(row.outcomeDisplay) : '—'
  const code = row?.statusCode
  if (code == null || code === '') return outcomeLabel
  return `${outcomeLabel} (${code})`
}

onMounted(fetchData)

watch(actor, () => triggerLiveFilterFetch(350))
watch([entityType, action, outcome, fromDate, toDate], () => triggerLiveFilterFetch())
</script>

<template>
  <el-card>
    <div class="toolbar">
      <el-button type="primary" plain :icon="Back" @click="router.back()">
        Back
      </el-button>

      <el-input
        v-model="actor"
        placeholder="Search actor (name or id)"
        clearable
        class="filter-input"
      />

      <el-select v-model="entityType" placeholder="Entity" clearable class="filter-select">
        <el-option v-for="item in entityOptions" :key="item.value" :value="item.value" :label="item.label" />
      </el-select>

      <el-select v-model="action" placeholder="Action" clearable class="filter-select">
        <el-option v-for="item in actionOptions" :key="item.value" :value="item.value" :label="item.label" />
      </el-select>

      <el-select v-model="outcome" placeholder="Outcome" clearable class="filter-select">
        <el-option v-for="item in outcomeOptions" :key="item.value" :value="item.value" :label="item.label" />
      </el-select>

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
      :row-class-name="rowClass"
      empty-text="No audit logs found"
    >
      <el-table-column prop="id" label="ID" width="85" />
      <el-table-column label="Time" width="185">
        <template #default="scope">
          {{ fmt(scope?.row?.timestamp || scope?.row?.date) }}
        </template>
      </el-table-column>
      <el-table-column prop="action" label="Action" width="135" />
      <el-table-column prop="actorDisplay" label="Actor" min-width="170" />
      <el-table-column label="Entity" min-width="170">
        <template #default="scope">
          <span>{{ scope?.row?.entityType || '—' }}</span>
          <span v-if="scope?.row?.entityId" class="muted"> #{{ scope?.row?.entityId }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="resourceDisplay" label="Resource" min-width="230" show-overflow-tooltip />
      <el-table-column label="Outcome / Code" width="150">
        <template #default="scope">
          {{ outcomeWithCode(scope?.row) }}
        </template>
      </el-table-column>
      <el-table-column label="Changes" min-width="220" show-overflow-tooltip>
        <template #default="scope">
          {{ pretty(scope?.row?.changes) }}
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      class="mt-4"
      layout="sizes, prev, pager, next, total"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[10, 25, 50, 100, 200]"
      :total="total"
      :background="true"
      @size-change="onPageSizeChange"
      @current-change="onPageChange"
    />
  </el-card>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
  align-items: center;
}

.filter-input {
  width: 240px;
}

.filter-select {
  width: 160px;
}

.date-input {
  width: 160px;
}

.muted {
  color: #8a8f98;
  margin-left: 4px;
}

.table-meta {
  font-size: 12px;
  color: #7a8088;
  margin-bottom: 8px;
}

:deep(.danger-row) {
  --el-table-tr-bg-color: var(--el-color-danger-light-9);
}

:deep(.success-row) {
  --el-table-tr-bg-color: var(--el-color-success-light-9);
}
</style>

