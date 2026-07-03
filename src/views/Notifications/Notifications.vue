<script setup lang="ts">
import {
  ElCard, ElTable, ElTableColumn, ElTag, ElButton, ElInput, ElSelect, ElOption,
  ElPagination, ElDrawer, ElTabs, ElTabPane, ElEmpty, ElMessage
} from 'element-plus'
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useAppStoreWithOut } from '@/store/modules/app'
import {
  getMyNotificationsApi,
  getMyNotificationByIdApi,
  markAllNotificationsReadApi,
  type UserNotification
} from '@/api/notifications'
import {
  getNotificationRouteTarget,
  type NotificationRouteTarget
} from '@/utils/notificationNavigation'
import {
  decreaseNotificationUnreadCount,
  clearNotificationUnreadCount,
  refreshNotificationUnreadCount
} from '@/hooks/web/useNotificationUnread'

const router = useRouter()
const appStore = useAppStoreWithOut()
const isMobile = computed(() => appStore.getMobile)
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
  const date = new Date(value)
  if (isMobile.value) {
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  return date.toLocaleString()
}

const shortGoToLabel = (row: UserNotification): string => {
  const shortcuts: Record<string, string> = {
    grievance: 'Grievance',
    incident: 'Incident',
    data_request: 'Request',
    communication: 'Broadcast',
    auth: 'Account',
    feedback: 'Feedback'
  }
  return shortcuts[String(row.source_module || '').toLowerCase()] || 'Open'
}

const routeTargetFor = (row: UserNotification): NotificationRouteTarget | null =>
  getNotificationRouteTarget(row)

const navigateToSource = async (row: UserNotification) => {
  const target = routeTargetFor(row)
  if (!target) {
    ElMessage.info('This notification is not linked to a specific record')
    return
  }

  detailVisible.value = false
  await router.push({
    name: target.name,
    params: target.params,
    query: target.query
  })
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
  const wasUnread = !row.is_read && !row.read_at
  detailVisible.value = true
  detailLoading.value = true
  try {
    const res: any = await getMyNotificationByIdApi(row.id)
    selected.value = res?.data || res
    if (wasUnread) {
      decreaseNotificationUnreadCount(1)
    }
    await loadNotifications()
    void refreshNotificationUnreadCount()
  } catch (error: any) {
    ElMessage.error(error?.message || 'Failed to load notification detail')
  } finally {
    detailLoading.value = false
  }
}

const markAllRead = async () => {
  try {
    await markAllNotificationsReadApi()
    clearNotificationUnreadCount()
    ElMessage.success('All notifications marked as read')
    await loadNotifications()
    void refreshNotificationUnreadCount()
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

onMounted(async () => {
  await loadNotifications()
  void refreshNotificationUnreadCount()
})
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
            class="notifications-search"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
          <el-select
            v-model="statusFilter"
            clearable
            placeholder="Status"
            class="notifications-status"
            @change="handleSearch"
          >
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

    <el-table
      v-else
      :data="notifications"
      :size="isMobile ? 'small' : 'default'"
      border
      class="notifications-table"
      @row-click="openDetail"
    >
      <el-table-column v-if="!isMobile" label="#" width="50">
        <template #default="{ $index }">
          {{ ($index + 1) + ((currentPage - 1) * pageSize) }}
        </template>
      </el-table-column>
      <el-table-column label="Date" :width="isMobile ? 108 : 170">
        <template #default="{ row }">
          {{ formatDate(row.sent_at || row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column
        label="Source"
        :width="isMobile ? 100 : 180"
        prop="source_label"
        show-overflow-tooltip
      />
      <el-table-column v-if="!isMobile" label="Channel" width="90">
        <template #default="{ row }">
          <el-tag size="small" :type="row.channel === 'email' ? 'primary' : 'info'">
            {{ String(row.channel || '').toUpperCase() }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Message" :min-width="isMobile ? 140 : 280" show-overflow-tooltip>
        <template #default="{ row }">
          <span :class="{ 'unread-text': !row.is_read && !row.read_at }">{{ row.body }}</span>
        </template>
      </el-table-column>
      <el-table-column v-if="!isMobile" label="Status" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="statusTagType(row.status)">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="!isMobile" label="Address" width="180" prop="address" show-overflow-tooltip />
      <el-table-column
        :label="isMobile ? '' : 'Go to'"
        :width="isMobile ? 52 : 120"
        :min-width="isMobile ? 52 : 120"
        align="center"
        fixed="right"
        class-name="go-to-column"
      >
        <template #header>
          <span v-if="!isMobile">Go to</span>
          <Icon v-else icon="mdi:open-in-new" width="16" class="go-to-header-icon" />
        </template>
        <template #default="{ row }">
          <el-tooltip
            v-if="routeTargetFor(row)"
            :content="routeTargetFor(row)!.label"
            placement="top"
            :disabled="!isMobile"
          >
            <el-button
              size="small"
              type="primary"
              :circle="isMobile"
              :link="!isMobile"
              class="go-to-btn"
              :aria-label="routeTargetFor(row)!.label"
              @click.stop="navigateToSource(row)"
            >
              <Icon icon="mdi:open-in-new" :width="isMobile ? 18 : 16" />
              <span v-if="!isMobile" class="go-to-btn__label">{{ shortGoToLabel(row) }}</span>
            </el-button>
          </el-tooltip>
          <span v-else class="no-link">—</span>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="totalItems > 0" class="pagination-wrap">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="totalItems"
        background
        :layout="isMobile ? 'prev, pager, next, total' : 'total, sizes, prev, pager, next'"
        :page-sizes="[10, 20, 50, 100]"
        :small="isMobile"
        :pager-count="isMobile ? 3 : 7"
        @current-change="handlePageChange"
        @size-change="handlePageSizeChange"
      />
    </div>

    <el-drawer
      v-model="detailVisible"
      title="Notification detail"
      :size="isMobile ? '100%' : '40%'"
      direction="rtl"
    >
      <div v-loading="detailLoading">
        <template v-if="selected">
          <div v-if="routeTargetFor(selected)" class="detail-actions">
            <el-button type="primary" @click="navigateToSource(selected)">
              {{ routeTargetFor(selected)?.label }}
            </el-button>
          </div>
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

.notifications-search {
  width: 280px;
}

.notifications-status {
  width: 130px;
}

.notifications-table {
  width: 100%;
}

.go-to-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
}

.go-to-btn__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.go-to-header-icon {
  color: var(--el-text-color-secondary);
}

:deep(.go-to-column .cell) {
  padding-left: 4px;
  padding-right: 4px;
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

.detail-actions {
  margin-bottom: 16px;
}

.no-link {
  color: var(--el-text-color-secondary);
}

@media (max-width: 768px) {
  .notifications-search,
  .notifications-status {
    width: 100%;
  }

  .notifications-actions {
    width: 100%;
  }

  .notifications-actions .el-button {
    flex: 1;
    min-width: 0;
  }

  .pagination-wrap {
    justify-content: center;
  }
}
</style>
