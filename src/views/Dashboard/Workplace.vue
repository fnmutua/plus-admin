<script setup lang="ts">
import {
  ElRow, ElCol, ElCard, ElSkeleton, ElAlert,
  ElTable, ElTableColumn, ElTabs, ElTabPane,
  ElTag, ElButton, ElEmpty, ElMessage, ElMessageBox,
  ElPagination, ElSelect, ElOption, ElDatePicker
} from 'element-plus'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { CountTo } from '@/components/CountTo'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { forceLogoutUserApi } from '@/api/users'
import {
  getWorkplaceStatsApi,
  getActiveSessionsApi,
  getLoginAttemptsApi,
  getMutationsApi,
  type ActiveSession,
  type LoginAttempt,
  type MutationLog,
  type WorkplaceStats
} from '@/api/dashboard/workplace'
import { Icon } from '@iconify/vue'
import { SwitchButton } from '@element-plus/icons-vue'

const CARD_ICON_COLOR = '#409eff'
const { push } = useRouter()
const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)

// ── Access control: admin, root_admin, super_admin only ─────────────────────
const isPlatformAdmin = computed(() =>
  userInfo?.roles?.some((r: any) =>
    ['admin', 'root_admin', 'super_admin'].includes(r.name)
  ) ?? false
)

const isSuperOrRoot = computed(() =>
  userInfo?.roles?.some((r: any) =>
    ['super_admin', 'root_admin'].includes(r.name)
  ) ?? false
)

const isNationalAdmin = computed(() =>
  userInfo?.roles?.some((r: any) =>
    r.name === 'admin' && r.user_roles?.location_level === 'national'
  ) ?? false
)

const isCountyAdmin = computed(() =>
  userInfo?.roles?.some((r: any) =>
    r.name === 'admin' && r.user_roles?.location_level === 'county'
  ) ?? false
)

const roleLabel = computed(() => {
  if (isSuperOrRoot.value) return 'Super Admin'
  if (isNationalAdmin.value) return 'National Admin'
  if (isCountyAdmin.value) return 'County Admin'
  return 'Admin'
})

const roleTagType = computed((): 'danger' | 'warning' | 'success' => {
  if (isSuperOrRoot.value) return 'danger'
  if (isNationalAdmin.value) return 'warning'
  return 'success'
})

// ── Stats ─────────────────────────────────────────────────────────────────────
const loadingStats = ref(true)
const stats = ref<WorkplaceStats>({
  totalUsers: 0,
  unapprovedUsers: 0,
  countyUsers: 0,
  usersThisWeek: 0,
  scopeLabel: '',
  isNational: true,
  countyId: null,
  countyName: null
})

const statCards = computed(() => [
  {
    label: 'Total Users',
    value: stats.value.totalUsers,
    icon: 'mdi:account-group-outline',
    route: { name: 'staff' }
  },
  {
    label: 'Unapproved Users',
    value: stats.value.unapprovedUsers,
    icon: 'mdi:account-clock-outline',
    route: { name: 'NewAccounts' }
  },
  {
    label: stats.value.isNational ? 'County-level Users' : 'County Users',
    value: stats.value.countyUsers,
    icon: 'mdi:map-marker-account-outline',
    route: stats.value.isNational
      ? { name: 'AdminStaff', query: { tab: 'county' } }
      : { name: 'staff' }
  },
  {
    label: 'Users This Week',
    value: stats.value.usersThisWeek,
    icon: 'mdi:account-plus-outline',
    route: { name: 'staff' }
  }
])

const handleCardClick = (card: { route: { name: string; query?: Record<string, string> } }) => {
  push(card.route)
}

const loadStats = async () => {
  loadingStats.value = true
  try {
    const res = await getWorkplaceStatsApi()
    if (res.data) stats.value = res.data
  } catch {
    ElMessage.error('Failed to load user statistics')
  } finally {
    loadingStats.value = false
  }
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
const activeTab = ref('sessions')

// Tab A: active sessions
const loadingSessions = ref(true)
const sessions = ref<ActiveSession[]>([])

const loadSessions = async () => {
  loadingSessions.value = true
  try {
    const res = await getActiveSessionsApi(24)
    sessions.value = res.data?.sessions || []
  } catch {
    sessions.value = []
    ElMessage.error('Failed to load active sessions')
  } finally {
    loadingSessions.value = false
  }
}

const formatDateTime = (d: string | null) => {
  if (!d) return '—'
  return new Date(d).toLocaleString()
}

const handleForceLogout = async (row: ActiveSession) => {
  try {
    await ElMessageBox.confirm(
      `Force logout ${row.name || row.username}? They will need to sign in again.`,
      'Force Logout',
      { confirmButtonText: 'Logout', cancelButtonText: 'Cancel', type: 'warning' }
    )
    await forceLogoutUserApi(row.userId)
    ElMessage.success(`${row.username} has been logged out`)
    await loadSessions()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('Failed to force logout user')
  }
}

// Tab B: login attempts
const loadingLogins = ref(true)
const loginAttempts = ref<LoginAttempt[]>([])
const loginTotal = ref(0)
const loginPage = ref(1)
const loginPageSize = ref(25)
const loginDayFilter = ref('today')

const loginFilterOptions = [
  { label: 'Today', value: 'today', days: 1 },
  { label: 'Yesterday', value: 'yesterday', days: 2 },
  { label: 'Last 7 days', value: 'week', days: 7 },
  { label: 'Last 30 days', value: 'month', days: 30 }
]

const loginDateRange = ref<[Date, Date] | null>(null)

const loginStatusType = (status: string): 'success' | 'danger' | 'info' => {
  const s = (status || '').toLowerCase()
  if (s.includes('success')) return 'success'
  if (s.includes('fail')) return 'danger'
  return 'info'
}

const loadLoginAttempts = async () => {
  loadingLogins.value = true
  try {
    const payload: Record<string, any> = {
      page: loginPage.value,
      limit: loginPageSize.value
    }

    if (loginDayFilter.value === 'custom' && loginDateRange.value) {
      payload.from = loginDateRange.value[0].toISOString()
      payload.to = loginDateRange.value[1].toISOString()
    } else {
      const opt = loginFilterOptions.find(o => o.value === loginDayFilter.value)
      payload.days = loginDayFilter.value === 'yesterday' ? 2 : (opt?.days || 1)
      if (loginDayFilter.value === 'yesterday') {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        payload.from = yesterday.toISOString()
        payload.to = yesterday.toISOString()
      }
    }

    const res = await getLoginAttemptsApi(payload)
    loginAttempts.value = Array.isArray(res.data) ? res.data : []
    loginTotal.value = res.total ?? loginAttempts.value.length
  } catch {
    loginAttempts.value = []
    loginTotal.value = 0
  } finally {
    loadingLogins.value = false
  }
}

const onLoginFilterChange = () => {
  loginPage.value = 1
  loadLoginAttempts()
}

// Tab C: mutations (edits/deletes)
const loadingMutations = ref(true)
const mutations = ref<MutationLog[]>([])
const mutationTotal = ref(0)
const mutationPage = ref(1)
const mutationPageSize = ref(25)
const mutationDayFilter = ref(7)

const mutationFilterOptions = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 14 days', value: 14 },
  { label: 'Last 30 days', value: 30 }
]

const actionTagType = (action: string): 'success' | 'warning' | 'danger' | 'info' => {
  const a = (action || '').toLowerCase()
  if (a === 'create') return 'success'
  if (a === 'update') return 'warning'
  if (a === 'delete') return 'danger'
  return 'info'
}

const loadMutations = async () => {
  loadingMutations.value = true
  try {
    const res = await getMutationsApi({
      page: mutationPage.value,
      limit: mutationPageSize.value,
      days: mutationDayFilter.value
    })
    mutations.value = Array.isArray(res.data) ? res.data : []
    mutationTotal.value = res.total ?? mutations.value.length
  } catch {
    mutations.value = []
    mutationTotal.value = 0
  } finally {
    loadingMutations.value = false
  }
}

const onMutationFilterChange = () => {
  mutationPage.value = 1
  loadMutations()
}

const onTabChange = (name: string | number) => {
  if (name === 'sessions' && !sessions.value.length) loadSessions()
  if (name === 'logins') loadLoginAttempts()
  if (name === 'mutations' && !mutations.value.length) loadMutations()
}

const init = async () => {
  if (!isPlatformAdmin.value) return
  await loadStats()
  await loadSessions()
}

onMounted(init)
</script>

<template>
  <div class="dashboard">

    <!-- Access denied -->
    <el-alert
      v-if="!isPlatformAdmin"
      title="Access restricted"
      type="warning"
      show-icon
      :closable="false"
      description="This dashboard is available to administrators only (admin, root admin, and super admin roles)."
      class="mb-16px"
    />

    <template v-else>
      <!-- Header -->
      <el-card shadow="never" class="mb-16px">
        <div class="header-row">
          <div>
            <div class="header-title">
              Admin Workplace
              <el-tag :type="roleTagType" size="small" effect="light" class="ml-8px">{{ roleLabel }}</el-tag>
            </div>
            <div class="header-sub">
              User oversight for
              <strong>{{ stats.scopeLabel || '…' }}</strong>
            </div>
          </div>
          <el-button size="small" plain :loading="loadingStats" @click="loadStats(); loadSessions()">
            <Icon icon="mdi:refresh" width="14" class="mr-4px" />Refresh
          </el-button>
        </div>
      </el-card>

      <!-- Stat cards -->
      <el-row :gutter="16" class="mb-16px">
        <el-col
          v-for="card in statCards"
          :key="card.label"
          :xl="6" :lg="6" :md="12" :sm="12" :xs="24"
          class="mb-10px"
        >
          <el-card shadow="hover" class="stat-card">
            <el-skeleton :loading="loadingStats" animated :rows="1">
              <template #default>
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-13px text-gray-400 mb-8px">{{ card.label }}</div>
                    <CountTo
                      class="text-28px font-bold stat-value-link"
                      :start-val="0"
                      :end-val="card.value"
                      :duration="1200"
                      role="link"
                      tabindex="0"
                      @click="handleCardClick(card)"
                      @keydown.enter="handleCardClick(card)"
                    />
                    <div v-if="stats.scopeLabel" class="text-11px text-gray-400 mt-4px">{{ stats.scopeLabel }}</div>
                  </div>
                  <Icon :icon="card.icon" width="40" :color="CARD_ICON_COLOR" style="opacity:0.75" />
                </div>
              </template>
            </el-skeleton>
          </el-card>
        </el-col>
      </el-row>

      <!-- Tabs -->
      <el-card shadow="never">
        <el-tabs v-model="activeTab" @tab-change="onTabChange">
          <!-- A: Online users (same source as chat) -->
          <el-tab-pane label="Online Now" name="sessions">
            <el-skeleton :loading="loadingSessions" animated :rows="6">
              <template #default>
                <el-empty v-if="!sessions.length" description="No users online" :image-size="64" />
                <el-table v-else :data="sessions" size="small" style="width:100%">
                  <el-table-column type="index" width="42" />
                  <el-table-column label="User" min-width="160">
                    <template #default="{ row }">
                      <div class="font-medium">{{ row.name }}</div>
                      <div class="text-12px text-gray-400">{{ row.username }}</div>
                    </template>
                  </el-table-column>
                  <el-table-column prop="email" label="Email" min-width="180" show-overflow-tooltip />
                  <el-table-column prop="county" label="County" width="130">
                    <template #default="{ row }">{{ row.county || '—' }}</template>
                  </el-table-column>
                  <el-table-column label="Logged in" width="170">
                    <template #default="{ row }">{{ formatDateTime(row.loginTime) }}</template>
                  </el-table-column>
                  <el-table-column prop="sessionDurationFormatted" label="Duration" width="100" />
                  <el-table-column label="Status" width="90">
                    <template #default="{ row }">
                      <el-tag type="success" size="small" effect="light">{{ row.status || 'online' }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="source" label="Source" width="120" show-overflow-tooltip />
                  <el-table-column label="" width="120" align="right" fixed="right">
                    <template #default="{ row }">
                      <el-button
                        type="danger"
                        size="small"
                        plain
                        :icon="SwitchButton"
                        @click="handleForceLogout(row)"
                      >
                        Force logout
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </template>
            </el-skeleton>
          </el-tab-pane>

          <!-- B: Login attempts -->
          <el-tab-pane label="Login Attempts" name="logins">
            <div class="tab-toolbar">
              <el-select v-model="loginDayFilter" size="small" style="width:160px" @change="onLoginFilterChange">
                <el-option
                  v-for="opt in loginFilterOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
                <el-option label="Custom range" value="custom" />
              </el-select>
              <el-date-picker
                v-if="loginDayFilter === 'custom'"
                v-model="loginDateRange"
                type="daterange"
                size="small"
                start-placeholder="From"
                end-placeholder="To"
                style="width:260px"
                @change="onLoginFilterChange"
              />
            </div>
            <el-skeleton :loading="loadingLogins" animated :rows="6">
              <template #default>
                <el-empty v-if="!loginAttempts.length" description="No login attempts for this period" :image-size="64" />
                <el-table v-else :data="loginAttempts" size="small" style="width:100%">
                  <el-table-column type="index" width="42" />
                  <el-table-column prop="userName" label="Username" min-width="140" />
                  <el-table-column prop="action" label="Action" width="100" />
                  <el-table-column label="Status" width="120">
                    <template #default="{ row }">
                      <el-tag :type="loginStatusType(row.status || row.outcome)" size="small" effect="light">
                        {{ row.status || row.outcome }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="source" label="Source" width="140" show-overflow-tooltip />
                  <el-table-column label="Time" min-width="170">
                    <template #default="{ row }">{{ formatDateTime(row.date || row.timestamp || row.loginTime) }}</template>
                  </el-table-column>
                </el-table>
                <el-pagination
                  v-if="loginTotal > loginPageSize"
                  class="mt-12px"
                  small
                  layout="total, prev, pager, next"
                  :total="loginTotal"
                  :page-size="loginPageSize"
                  v-model:current-page="loginPage"
                  @current-change="loadLoginAttempts"
                />
              </template>
            </el-skeleton>
          </el-tab-pane>

          <!-- C: Edits & deletes -->
          <el-tab-pane label="Edits & Deletes" name="mutations">
            <div class="tab-toolbar">
              <el-select v-model="mutationDayFilter" size="small" style="width:160px" @change="onMutationFilterChange">
                <el-option
                  v-for="opt in mutationFilterOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </div>
            <el-skeleton :loading="loadingMutations" animated :rows="6">
              <template #default>
                <el-empty v-if="!mutations.length" description="No edits or deletes in this period" :image-size="64" />
                <el-table v-else :data="mutations" size="small" style="width:100%">
                  <el-table-column type="index" width="42" />
                  <el-table-column label="Time" width="170">
                    <template #default="{ row }">{{ formatDateTime(row.timestamp) }}</template>
                  </el-table-column>
                  <el-table-column label="Action" width="100">
                    <template #default="{ row }">
                      <el-tag :type="actionTagType(row.action)" size="small" effect="light" class="capitalize">
                        {{ row.action }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="actorName" label="User" min-width="130" />
                  <el-table-column prop="entityType" label="Entity" width="140" />
                  <el-table-column prop="entityId" label="ID" width="80" />
                  <el-table-column prop="resource" label="Resource" min-width="180" show-overflow-tooltip />
                  <el-table-column label="Outcome" width="100">
                    <template #default="{ row }">
                      <el-tag
                        :type="row.outcome === 'failure' ? 'danger' : 'success'"
                        size="small"
                        effect="plain"
                      >{{ row.outcome }}</el-tag>
                    </template>
                  </el-table-column>
                </el-table>
                <el-pagination
                  v-if="mutationTotal > mutationPageSize"
                  class="mt-12px"
                  small
                  layout="total, prev, pager, next"
                  :total="mutationTotal"
                  :page-size="mutationPageSize"
                  v-model:current-page="mutationPage"
                  @current-change="loadMutations"
                />
              </template>
            </el-skeleton>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </template>
  </div>
</template>

<style scoped>
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.header-title {
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
}
.header-sub {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
.stat-card :deep(.el-card__body) { padding: 18px 20px; }
.stat-value-link {
  cursor: pointer;
  color: var(--el-color-primary);
  transition: opacity 0.15s;
}
.stat-value-link:hover { opacity: 0.75; }
.tab-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
</style>
