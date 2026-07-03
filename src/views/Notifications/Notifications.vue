<script setup lang="ts">
import {
  ElCard, ElTable, ElTableColumn, ElTag, ElButton, ElInput, ElSelect, ElOption,
  ElPagination, ElDrawer, ElTabs, ElTabPane, ElEmpty, ElMessage
} from 'element-plus'
import { ref, computed, onMounted, watch } from 'vue'
import { Icon } from '@iconify/vue'
import {
  getMyNotificationsApi,
  getMyNotificationByIdApi,
  markAllNotificationsReadApi,
  type UserNotification
} from '@/api/notifications'

const loading = ref(false)
const detailLoading = ref(false)
const notifications = ref<UserNotification[]>([])
const selected = ref<UserNotification | null>(null)
const detailVisible = ref(false)
const activeTab = ref('all')
const searchTerm = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const totalItems = ref(0)

const channelFilter = computed(() => {
  if (activeTab.value === 'sms') return 'sms'
  if (activeTab.value === 'email') return 'email'
  return ''
})

const statusTagType = (status: string) => {
  if (status === 'sent') return 'success'
  if (status === 'failed') return 'danger'
  return 'warning'
}

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

const loadNotifications = async () => {
  loading.value = true
  try {
    const res: any = await getMyNotificationsApi({
      page: currentPage.value,
      limit: pageSize.value,
      channel: channelFilter.value || undefined,
      status: statusFilter.value || undefined,
      q: searchTerm.value.trim() || undefined
    })
    const payload = res?.data || res
    notifications.value = payload?.notifications || []
    totalItems.value = payload?.pagination?.totalItems || 0
  } catch (error: any) {
    ElMessage.error(error?.message || 'Failed to load notifications')
    notifications.value = []
    totalItems.value = 0
  } finally {
    loading.value = false
  }
}

const openDetail = async (row: UserNotification) => {
  detailVisible.value = true
  detailLoading.value = true
  try {
    const res: any = await getMyNotificationByIdApi(row.id)
    selected.value = res?.data || res
    await loadNotifications()
  } catch (error: any) {
    ElMessage.error(error?.message || 'Failed to load notification detail')
  } finally {
    detailLoading.value = false
  }
}

const markAllRead = async () => {
  try {
    await markAllNotificationsReadApi()
    ElMessage.success('All notifications marked as read')
    await loadNotifications()
  } catch (error: any) {
    ElMessage.error(error?.message || 'Failed to mark notifications as read')
  }
}

const handleSearch = async () => {
  currentPage.value = 1
  await loadNotifications()
}

const handlePageChange = async (page: number) => {
  currentPage.value = page
  await loadNotifications()
}

const handlePageSizeChange = async (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  await loadNotifications()
}

watch(activeTab, async () => {
  currentPage.value = 1
  await loadNotifications()
})

onMounted(loadNotifications)
</script>

<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="notifications-header">
        <div class="notifications-title">
          <Icon icon="mdi:bell-outline" width="22" />
          <span>My Notifications</span>
        </div>
        <div class="notifications-actions">
          <el-input
            v-model="searchTerm"
            placeholder="Search message, subject, or address..."
            clearable
            style="width: 280px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
          <el-select v-model="statusFilter" clearable placeholder="Status" style="width: 130px" @change="handleSearch">
            <el-option label="Sent" value="sent" />
            <el-option label="Failed" value="failed" />
            <el-option label="Pending" value="pending" />
          </el-select>
          <el-button type="primary" plain @click="handleSearch">Search</el-button>
          <el-button @click="markAllRead">Mark all read</el-button>
        </div>
      </div>
    </template>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="All" name="all" />
      <el-tab-pane label="SMS" name="sms" />
      <el-tab-pane label="Email" name="email" />
    </el-tabs>

    <el-empty v-if="!loading && notifications.length === 0" description="No notifications found" />

    <el-table v-else :data="notifications" size="small" border @row-click="openDetail">
      <el-table-column label="#" width="50">
        <template #default="{ $index }">
          {{ ($index + 1) + ((currentPage - 1) * pageSize) }}
        </template>
      </el-table-column>
      <el-table-column label="Date" width="170">
        <template #default="{ row }">
          {{ formatDate(row.sent_at || row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="Source" width="180" prop="source_label" show-overflow-tooltip />
      <el-table-column label="Channel" width="90">
        <template #default="{ row }">
          <el-tag size="small" :type="row.channel === 'email' ? 'primary' : 'info'">
            {{ String(row.channel || '').toUpperCase() }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Message" min-width="280" show-overflow-tooltip>
        <template #default="{ row }">
          <span :class="{ 'unread-text': !row.is_read && !row.read_at }">{{ row.body }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Status" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="statusTagType(row.status)">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Address" width="180" prop="address" show-overflow-tooltip />
    </el-table>

    <div v-if="totalItems > 0" class="pagination-wrap">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="totalItems"
        background
        layout="total, sizes, prev, pager, next"
        :page-sizes="[10, 20, 50, 100]"
        @current-change="handlePageChange"
        @size-change="handlePageSizeChange"
      />
    </div>

    <el-drawer v-model="detailVisible" title="Notification detail" size="40%" direction="rtl">
      <div v-loading="detailLoading">
        <template v-if="selected">
          <p><strong>Source:</strong> {{ selected.source_label || selected.source_module }}</p>
          <p><strong>Channel:</strong> {{ selected.channel }}</p>
          <p><strong>Status:</strong> {{ selected.status }}</p>
          <p><strong>Sent:</strong> {{ formatDate(selected.sent_at) }}</p>
          <p><strong>Address:</strong> {{ selected.address || '—' }}</p>
          <p v-if="selected.subject"><strong>Subject:</strong> {{ selected.subject }}</p>
          <p><strong>Message</strong></p>
          <div class="detail-body">{{ selected.body }}</div>
          <p v-if="selected.provider_code"><strong>Provider code:</strong> {{ selected.provider_code }}</p>
          <p v-if="selected.provider_message"><strong>Provider message:</strong> {{ selected.provider_message }}</p>
        </template>
      </div>
    </el-drawer>
  </el-card>
</template>

<style scoped>
.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.notifications-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
}

.notifications-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.unread-text {
  font-weight: 600;
}

.detail-body {
  white-space: pre-wrap;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  padding: 12px;
}
</style>
