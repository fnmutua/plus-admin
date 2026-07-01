<template>
  <el-card v-loading="loading">

    <!-- Toolbar -->
    <el-row :gutter="12" style="margin-bottom:12px" align="middle">

      <el-col :xs="24" :sm="6" :md="4" :lg="3">
        <el-select
          v-model="statusFilter"
          placeholder="All statuses"
          clearable
          style="width:100%"
          @change="() => { page = 1; loadRequests() }"
        >
          <el-option label="Pending" value="Pending" />
          <el-option label="Approved" value="Approved" />
          <el-option label="Rejected" value="Rejected" />
        </el-select>
      </el-col>

      <el-col :xs="24" :sm="10" :md="7" :lg="5">
        <el-input
          v-model="search"
          placeholder="Search name, org, ref, email…"
          clearable
          @input="onSearch"
        >
          <template #append>
            <el-button :icon="Search" @click="loadRequests" />
          </template>
        </el-input>
      </el-col>

      <el-col :xs="24" :sm="8" :md="13" :lg="16">
        <div class="toolbar-right">
          <el-tag v-if="pendingCount" type="warning" effect="plain" size="large">
            {{ pendingCount }} Pending
          </el-tag>
          <el-tag v-if="total" type="info" effect="plain" size="large">
            {{ total }} Total
          </el-tag>
          <el-button :icon="Refresh" @click="loadRequests" :loading="loading" circle plain />
        </div>
      </el-col>

    </el-row>

    <!-- Table -->
    <el-table
      :data="filtered"
      stripe
      border
      style="width:100%"
      row-key="id"
      :row-class-name="() => 'clickable-row'"
      @row-click="openDetail"
    >
      <el-table-column prop="code" label="Reference" width="150" sortable />
      <el-table-column prop="name" label="Name" min-width="140" sortable />
      <el-table-column prop="organization" label="Organization" min-width="150" show-overflow-tooltip sortable />
      <el-table-column prop="email" label="Email" min-width="180" show-overflow-tooltip />
      <el-table-column prop="geographic_scope" label="Scope" width="120" />
      <el-table-column label="Status" width="180" sortable :sort-method="(a, b) => a.status.localeCompare(b.status)">
        <template #default="{ row }">
          <div class="status-cell">
            <el-tag :type="statusTag(row.status)" size="small">{{ row.status }}</el-tag>
            <el-tag
              v-if="clarificationLabel(row.clarification_status)"
              size="small"
              effect="plain"
              :type="clarificationTag(row.clarification_status)"
            >
              {{ clarificationLabel(row.clarification_status) }}
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Submitted" width="130" sortable :sort-method="(a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="" width="48" fixed="right">
        <template #default>
          <Icon icon="mdi:chevron-right" width="20" style="color:var(--el-text-color-placeholder); display:block; margin:auto" />
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <div class="pagination-bar">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        background
        @change="loadRequests"
      />
    </div>

  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh, Search } from '@element-plus/icons-vue'
import {
  ElCard, ElTable, ElTableColumn, ElTag, ElSelect, ElOption,
  ElButton, ElPagination, ElInput, ElRow, ElCol, ElMessage
} from 'element-plus'
import { Icon } from '@iconify/vue'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import axios from 'axios'

const router = useRouter()
const appStore = useAppStoreWithOut()
const { wsCache } = useCache()
const base = import.meta.env.VITE_APP_HOST || ''

const getToken = () => wsCache.get(appStore.getUserInfo)?.data || ''
const authHeaders = () => ({ 'x-access-token': getToken(), 'Content-Type': 'application/json' })

const loading = ref(false)
const requests = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const statusFilter = ref('')
const search = ref('')

const pendingCount = computed(() => requests.value.filter(r => r.status === 'Pending').length)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return requests.value
  return requests.value.filter(r =>
    (r.name || '').toLowerCase().includes(q) ||
    (r.organization || '').toLowerCase().includes(q) ||
    (r.code || '').toLowerCase().includes(q) ||
    (r.email || '').toLowerCase().includes(q)
  )
})

let searchTimer: ReturnType<typeof setTimeout>
const onSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; loadRequests() }, 320)
}

const loadRequests = async () => {
  loading.value = true
  try {
    const params: any = { page: page.value, limit: pageSize.value }
    if (statusFilter.value) params.status = statusFilter.value
    const res = await axios.get(`${base}/api/v1/data-requests`, { headers: authHeaders(), params })
    requests.value = res.data.results?.data || []
    total.value = res.data.results?.total || 0
  } catch {
    ElMessage.error('Failed to load data requests')
  } finally {
    loading.value = false
  }
}

const openDetail = (row: any) => router.push(`/admin/data-requests/${row.id}`)

const statusTag = (s: string) =>
  s === 'Approved' ? 'success' : s === 'Rejected' ? 'danger' : 'warning'

const clarificationLabel = (s: string | undefined) => {
  const map: Record<string, string> = {
    awaiting_requester: 'Awaiting requester',
    awaiting_reviewer: 'Needs review',
    resolved: 'Clarified'
  }
  return s && map[s] ? map[s] : ''
}

const clarificationTag = (s: string) =>
  s === 'awaiting_reviewer' ? 'danger' : s === 'awaiting_requester' ? 'warning' : 'info'

const formatDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

onMounted(loadRequests)
</script>

<style scoped>
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.pagination-bar {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

:deep(.clickable-row) {
  cursor: pointer;
}
:deep(.clickable-row:hover > td) {
  background: var(--el-fill-color-light) !important;
}

.status-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}
</style>
