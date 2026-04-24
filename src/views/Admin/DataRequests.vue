<template>
  <div class="dr-admin-page">
    <div class="page-header">
      <h2>Data Requests</h2>
      <el-tag :type="statusTagType(summary.Pending)" effect="light">
        {{ summary.Pending || 0 }} Pending
      </el-tag>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <el-select v-model="statusFilter" placeholder="Filter by status" clearable style="width:180px" @change="loadRequests">
        <el-option label="Pending" value="Pending" />
        <el-option label="Approved" value="Approved" />
        <el-option label="Rejected" value="Rejected" />
      </el-select>
      <el-button :icon="Refresh" @click="loadRequests" :loading="loading">Refresh</el-button>
    </div>

    <!-- Table -->
    <el-table
      v-loading="loading"
      :data="requests"
      stripe
      border
      style="width:100%"
      row-key="id"
    >
      <el-table-column prop="code" label="Ref" width="140" />
      <el-table-column prop="name" label="Name" min-width="140" />
      <el-table-column prop="organization" label="Organization" min-width="140" show-overflow-tooltip />
      <el-table-column prop="email" label="Email" min-width="160" show-overflow-tooltip />
      <el-table-column prop="geographic_scope" label="Scope" width="100" />
      <el-table-column label="Status" width="110">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Submitted" width="120">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="100" fixed="right">
        <template #default="{ row }">
          <el-button size="small" text :icon="View" @click="openDetail(row)" />
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
        @change="loadRequests"
      />
    </div>

    <!-- Detail drawer -->
    <el-drawer v-model="drawerVisible" title="Data Request Details" size="520px" direction="rtl">
      <div v-if="selected" class="dr-detail">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="Reference">{{ selected.code }}</el-descriptions-item>
          <el-descriptions-item label="Name">{{ selected.name }}</el-descriptions-item>
          <el-descriptions-item label="Organization">{{ selected.organization }}</el-descriptions-item>
          <el-descriptions-item label="Position">{{ selected.position }}</el-descriptions-item>
          <el-descriptions-item label="Email">{{ selected.email }}</el-descriptions-item>
          <el-descriptions-item label="Phone">{{ selected.phone }}</el-descriptions-item>
          <el-descriptions-item v-if="selected.mailing_address" label="Address">{{ selected.mailing_address }}</el-descriptions-item>
          <el-descriptions-item label="Data Description">{{ selected.data_description }}</el-descriptions-item>
          <el-descriptions-item label="Intended Use">{{ selected.intended_use }}</el-descriptions-item>
          <el-descriptions-item v-if="selected.data_classification?.length" label="Classification">
            {{ selected.data_classification.join(', ') }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selected.geographic_scope" label="Geographic Scope">{{ selected.geographic_scope }}</el-descriptions-item>
          <el-descriptions-item v-if="selected.how_data_used" label="How Used">{{ selected.how_data_used }}</el-descriptions-item>
          <el-descriptions-item label="Shared Further">{{ selected.data_shared ? 'Yes' : 'No' }}</el-descriptions-item>
          <el-descriptions-item v-if="selected.sharing_details" label="Sharing Details">{{ selected.sharing_details }}</el-descriptions-item>
          <el-descriptions-item v-if="selected.dissemination_plan" label="Dissemination Plan">{{ selected.dissemination_plan }}</el-descriptions-item>
          <el-descriptions-item v-if="selected.data_made_public" label="Made Public">{{ selected.data_made_public }}</el-descriptions-item>
          <el-descriptions-item v-if="selected.heard_about" label="Heard About">{{ selected.heard_about }}</el-descriptions-item>
          <el-descriptions-item label="Declaration Name">{{ selected.declaration_name }}</el-descriptions-item>
          <el-descriptions-item label="Submitted">{{ formatDate(selected.createdAt) }}</el-descriptions-item>
        </el-descriptions>

        <!-- Review action -->
        <el-divider>Review Decision</el-divider>
        <el-form label-position="top" size="small">
          <el-form-item label="Status">
            <el-radio-group v-model="reviewStatus">
              <el-radio-button value="Approved">Approve</el-radio-button>
              <el-radio-button value="Rejected">Reject</el-radio-button>
              <el-radio-button value="Pending">Reset to Pending</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="Notes">
            <el-input v-model="reviewNotes" type="textarea" :rows="3" placeholder="Optional review notes" />
          </el-form-item>
          <el-button type="primary" :loading="saving" @click="saveReview" style="width:100%">
            Save Decision
          </el-button>
        </el-form>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Refresh, View } from '@element-plus/icons-vue'
import {
  ElTable, ElTableColumn, ElTag, ElSelect, ElOption, ElButton,
  ElPagination, ElDrawer, ElDescriptions, ElDescriptionsItem,
  ElDivider, ElForm, ElFormItem, ElRadioGroup, ElRadioButton,
  ElInput, ElMessage
} from 'element-plus'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import axios from 'axios'

const appStore = useAppStoreWithOut()
const { wsCache } = useCache()
const base = import.meta.env.VITE_APP_HOST || ''

const getToken = () => {
  const info = wsCache.get(appStore.getUserInfo)
  return info?.data || ''
}

const authHeaders = () => ({
  'x-access-token': getToken(),
  'Content-Type': 'application/json'
})

// State
const loading = ref(false)
const saving = ref(false)
const requests = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const statusFilter = ref('')
const summary = ref<Record<string, number>>({})

const drawerVisible = ref(false)
const selected = ref<any>(null)
const reviewStatus = ref('Pending')
const reviewNotes = ref('')

const loadRequests = async () => {
  loading.value = true
  try {
    const params: any = { page: page.value, limit: pageSize.value }
    if (statusFilter.value) params.status = statusFilter.value

    const res = await axios.get(`${base}/api/v1/data-requests`, {
      headers: authHeaders(),
      params
    })
    requests.value = res.data.results?.data || []
    total.value = res.data.results?.total || 0

    // Build summary counts from current page (rough indicator)
    const counts: Record<string, number> = {}
    requests.value.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1
    })
    summary.value = counts
  } catch (e: any) {
    ElMessage.error('Failed to load data requests')
  } finally {
    loading.value = false
  }
}

const openDetail = (row: any) => {
  selected.value = row
  reviewStatus.value = row.status
  reviewNotes.value = row.review_notes || ''
  drawerVisible.value = true
}

const saveReview = async () => {
  if (!selected.value) return
  saving.value = true
  try {
    await axios.put(
      `${base}/api/v1/data-requests/${selected.value.id}/status`,
      { status: reviewStatus.value, review_notes: reviewNotes.value },
      { headers: authHeaders() }
    )
    ElMessage.success('Decision saved')
    selected.value.status = reviewStatus.value
    selected.value.review_notes = reviewNotes.value
    drawerVisible.value = false
    loadRequests()
  } catch (e: any) {
    ElMessage.error('Failed to save decision')
  } finally {
    saving.value = false
  }
}

const statusTag = (s: string) =>
  s === 'Approved' ? 'success' : s === 'Rejected' ? 'danger' : 'warning'

const statusTagType = (count: number) => (count > 0 ? 'warning' : 'success')

const formatDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

onMounted(loadRequests)
</script>

<style scoped>
.dr-admin-page {
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.page-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.filters-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.pagination-bar {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.dr-detail {
  padding: 4px 0;
}
</style>
