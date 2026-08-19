<script setup lang="ts">
import {
  ElRow, ElCol, ElCard, ElSkeleton,
  ElTable, ElTableColumn, ElTabs, ElTabPane,
  ElTag, ElButton, ElEmpty, ElMessage, ElMessageBox,
  ElPagination, ElSelect, ElOption, ElDatePicker,
  ElDropdown, ElDropdownMenu, ElDropdownItem
} from 'element-plus'
import { ref, computed, onBeforeMount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { CountTo } from '@/components/CountTo'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { forceLogoutUserApi, forceLogoutAllUsersApi, forceLogoutOtherSessionsApi } from '@/api/users'
import {
  getWorkplaceStatsApi,
  getActiveSessionsApi,
  getLoginAttemptsApi,
  getMutationsApi,
  getWorkplaceTrafficApi,
  type ActiveSession,
  type LoginAttempt,
  type MutationLog,
  type WorkplaceTraffic,
  type WorkplaceStats,
  type NewAccountsPeriod
} from '@/api/dashboard/workplace'
import { Icon } from '@iconify/vue'
import { SwitchButton } from '@element-plus/icons-vue'
import '@/plugins/echarts'
import VChart from 'vue-echarts'

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
  newAccountsCount: 0,
  newAccountsPeriod: 'week',
  scopeLabel: '',
  isNational: true,
  countyId: null,
  countyName: null
})

const newAccountsPeriod = ref<NewAccountsPeriod>('week')

const newAccountsPeriodLabel = computed(() => {
  switch (newAccountsPeriod.value) {
    case 'month':
      return 'This month'
    case 'year':
      return 'This year'
    default:
      return 'This week'
  }
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
    label: 'New Accounts',
    value: stats.value.newAccountsCount,
    icon: 'mdi:account-plus-outline',
    route: { name: 'NewAccounts' },
    periodSelect: true
  }
])

const handleCardClick = (card: { route: { name: string; query?: Record<string, string> } }) => {
  push(card.route)
}

const loadStats = async () => {
  loadingStats.value = true
  try {
    const res = await getWorkplaceStatsApi(newAccountsPeriod.value)
    if (res.data) {
      stats.value = {
        ...res.data,
        newAccountsCount: res.data.newAccountsCount ?? res.data.usersThisWeek ?? 0,
        newAccountsPeriod: res.data.newAccountsPeriod ?? newAccountsPeriod.value
      }
    }
  } catch {
    ElMessage.error('Failed to load user statistics')
  } finally {
    loadingStats.value = false
  }
}

const onNewAccountsPeriodChange = () => {
  loadStats()
}

const onNewAccountsPeriodSelect = (period: NewAccountsPeriod) => {
  if (newAccountsPeriod.value === period) return
  newAccountsPeriod.value = period
  onNewAccountsPeriodChange()
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

const sessionCount = computed(() => sessions.value.length)

const currentUserId = computed(() => Number(userInfo?.id ?? userInfo?.user?.id ?? NaN))

const loggingOutAll = ref(false)
const loggingOutOthers = ref(false)

const handleForceLogoutOthers = async (row: ActiveSession) => {
  const otherCount = Math.max(0, (row.activeSessionCount || 0) - 1)
  if (otherCount === 0) {
    ElMessage.info('You have no other active sessions.')
    return
  }
  try {
    await ElMessageBox.confirm(
      `Log out ${otherCount} other session(s) on other devices? This session will stay signed in.`,
      'Logout Other Sessions',
      { confirmButtonText: 'Logout', cancelButtonText: 'Cancel', type: 'warning' }
    )
    loggingOutOthers.value = true
    const res = await forceLogoutOtherSessionsApi()
    ElMessage.success(res.data?.message || 'Other sessions have been logged out')
    await loadSessions()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('Failed to log out other sessions')
  } finally {
    loggingOutOthers.value = false
  }
}

const handleForceLogoutAll = async (excludeSelf: boolean) => {
  const targetCount = excludeSelf ? otherSessionsCount.value : sessionCount.value
  if (targetCount === 0) {
    ElMessage.info(excludeSelf ? 'No other sessions to log out.' : 'No active sessions to log out.')
    return
  }
  try {
    await ElMessageBox.confirm(
      excludeSelf
        ? `Force logout all ${targetCount} other active session(s)? Your own session will stay signed in.`
        : `Force logout all ${targetCount} active session(s)? Everyone (including you) will need to sign in again.`,
      excludeSelf ? 'Logout Other Sessions' : 'Logout All Sessions',
      { confirmButtonText: 'Logout', cancelButtonText: 'Cancel', type: 'warning' }
    )
    loggingOutAll.value = true
    const res = await forceLogoutAllUsersApi(excludeSelf)
    ElMessage.success(res.data?.message || 'Sessions have been logged out')
    await loadSessions()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('Failed to log out sessions')
  } finally {
    loggingOutAll.value = false
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

    if (!loginAttempts.value.length && loginPage.value > 1 && loginTotal.value > 0) {
      loginPage.value = 1
      await loadLoginAttempts()
      return
    }
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

// Tab D: traffic analytics
const loadingTraffic = ref(false)
const trafficDays = ref(30)
const traffic = ref<WorkplaceTraffic>({
  days: 30,
  activeSessions: 0,
  activeUsers: 0,
  loginAttempts: 0,
  successfulLogins: 0,
  failedLogins: 0,
  uniqueUsers: 0,
  timeline: [],
  counties: []
})

const trafficCards = computed(() => [
  { label: 'Active Sessions', value: traffic.value.activeSessions, icon: 'mdi:access-point' },
  { label: 'Active Users', value: traffic.value.activeUsers, icon: 'mdi:account-check-outline' },
  { label: 'Login Attempts', value: traffic.value.loginAttempts, icon: 'mdi:login-variant' },
  { label: 'Unique Users', value: traffic.value.uniqueUsers, icon: 'mdi:account-multiple-outline' }
])

const trafficTimelineOptions = computed(() => ({
  tooltip: { trigger: 'axis' },
  toolbox: {
    show: true,
    right: 4,
    top: 0,
    feature: {
      saveAsImage: {
        show: true,
        title: 'Download chart',
        name: `workplace-login-traffic-${trafficDays.value}-days`,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      }
    }
  },
  legend: { data: ['Successful', 'Failed'], bottom: 0 },
  grid: { left: 42, right: 20, top: 24, bottom: 50, containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: traffic.value.timeline.map((item) =>
      trafficDays.value === 1
        ? new Date(item.date).toLocaleTimeString(undefined, { hour: 'numeric', hour12: true })
        : new Date(`${item.date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    )
  },
  yAxis: { type: 'value', minInterval: 1 },
  series: [
    { name: 'Successful', type: 'line', smooth: true, symbol: 'circle', data: traffic.value.timeline.map((item) => item.successful), color: '#67c23a', areaStyle: { opacity: 0.1 } },
    { name: 'Failed', type: 'line', smooth: true, symbol: 'circle', data: traffic.value.timeline.map((item) => item.failed), color: '#f56c6c', areaStyle: { opacity: 0.08 } }
  ]
}))

const trafficSourceOptions = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  toolbox: {
    show: true,
    right: 4,
    top: 0,
    feature: {
      saveAsImage: {
        show: true,
        title: 'Download chart',
        name: `workplace-traffic-by-county-${trafficDays.value}-days`,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      }
    }
  },
  legend: { type: 'scroll', orient: 'horizontal', bottom: 0 },
  series: [{
    name: 'County',
    type: 'pie',
    radius: ['42%', '68%'],
    center: ['50%', '44%'],
    avoidLabelOverlap: true,
    label: { formatter: '{b}\n{d}%' },
    data: traffic.value.counties
  }]
}))

const loadTraffic = async () => {
  loadingTraffic.value = true
  try {
    const res = await getWorkplaceTrafficApi(trafficDays.value)
    if (res.data) traffic.value = res.data
  } catch {
    ElMessage.error('Failed to load traffic analytics')
  } finally {
    loadingTraffic.value = false
  }
}

const onTabChange = (name: string | number) => {
  if (name === 'sessions' && !sessions.value.length) loadSessions()
  if (name === 'logins') loadLoginAttempts()
  if (name === 'mutations' && !mutations.value.length) loadMutations()
  if (name === 'traffic' && !traffic.value.timeline.length) loadTraffic()
}

const init = async () => {
  if (!isPlatformAdmin.value) return
  await loadStats()
  await loadSessions()
}

onBeforeMount(() => {
  if (!isPlatformAdmin.value) {
    push({ name: 'National', replace: true })
  }
})

onMounted(init)
</script>

<template>
  <div class="dashboard">

    <template v-if="isPlatformAdmin">
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
                <div class="stat-card-body">
                  <div>
                    <div class="stat-card-label-row">
                      <span>{{ card.label }}</span>
                      <el-dropdown
                        v-if="card.periodSelect"
                        trigger="click"
                        @command="onNewAccountsPeriodSelect"
                      >
                        <span class="stat-period-trigger" @click.stop>
                          {{ newAccountsPeriodLabel }}
                          <Icon icon="mdi:chevron-down" width="14" />
                        </span>
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item command="week">This week</el-dropdown-item>
                            <el-dropdown-item command="month">This month</el-dropdown-item>
                            <el-dropdown-item command="year">This year</el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                    </div>
                    <CountTo
                      class="font-bold stat-value-link"
                      :start-val="0"
                      :end-val="card.value"
                      :duration="1200"
                      role="link"
                      tabindex="0"
                      @click="handleCardClick(card)"
                      @keydown.enter="handleCardClick(card)"
                    />
                  </div>
                  <Icon :icon="card.icon" width="40" :color="CARD_ICON_COLOR" class="stat-card-icon" />
                </div>
              </template>
            </el-skeleton>
          </el-card>
        </el-col>
      </el-row>

      <!-- Tabs -->
      <el-card shadow="never">
        <el-tabs v-model="activeTab" @tab-change="onTabChange">
          <!-- A: Active auth sessions -->
          <el-tab-pane label="Active Sessions" name="sessions">
            <el-skeleton :loading="loadingSessions" animated :rows="6">
              <template #default>
                <div class="tab-toolbar sessions-toolbar">
                  <div class="sessions-count">
                    <Icon icon="ep:user" :color="CARD_ICON_COLOR" width="18" />
                    <span class="sessions-count-num">{{ sessionCount }}</span>
                    <span class="sessions-count-label">
                      {{ sessionCount === 1 ? 'user with active sessions' : 'users with active sessions' }}
                    </span>
                  </div>
                  <div class="sessions-actions">
                    <el-button
                      type="danger"
                      size="small"
                      plain
                      :icon="SwitchButton"
                      :loading="loggingOutAll"
                      :disabled="sessionCount === 0"
                      @click="handleForceLogoutAll(false)"
                    >
                      Logout all
                    </el-button>
                  </div>
                </div>
                <el-empty v-if="!sessions.length" description="No active sessions" :image-size="64" />
                <div v-else class="table-scroll">
                <el-table :data="sessions" size="small" style="width:100%">
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
                  <el-table-column label="Sessions" width="90" align="center">
                    <template #default="{ row }">
                      <el-tag
                        :type="(row.activeSessionCount || 0) > 1 ? 'warning' : 'info'"
                        size="small"
                        effect="plain"
                      >
                        {{ row.activeSessionCount || 0 }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="Status" width="90">
                    <template #default="{ row }">
                      <el-tag
                        :type="row.status === 'online' ? 'success' : 'info'"
                        size="small"
                        effect="light"
                      >
                        {{ row.status || 'active' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="source" label="Source" width="120" show-overflow-tooltip />
                  <el-table-column label="Actions" min-width="200" align="right" fixed="right">
                    <template #default="{ row }">
                      <el-button
                        v-if="Number(row.userId) === currentUserId"
                        type="warning"
                        size="small"
                        plain
                        :icon="SwitchButton"
                        class="force-logout-btn"
                        :loading="loggingOutOthers"
                        :disabled="(row.activeSessionCount || 0) <= 1"
                        @click="handleForceLogoutOthers(row)"
                      >
                        Logout other sessions
                      </el-button>
                      <el-button
                        v-else
                        type="danger"
                        size="small"
                        plain
                        :icon="SwitchButton"
                        class="force-logout-btn"
                        @click="handleForceLogout(row)"
                      >
                        Force logout
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
                </div>
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

          <el-tab-pane label="Traffic" name="traffic">
            <div class="tab-toolbar sessions-toolbar">
              <div class="traffic-description">Session and login activity for {{ stats.scopeLabel || 'your scope' }}</div>
              <el-select v-model="trafficDays" size="small" style="width:150px" @change="loadTraffic">
                <el-option label="Today" :value="1" />
                <el-option label="Last 7 days" :value="7" />
                <el-option label="Last 30 days" :value="30" />
                <el-option label="Last 90 days" :value="90" />
              </el-select>
            </div>
            <el-skeleton :loading="loadingTraffic" animated :rows="8">
              <template #default>
                <el-row :gutter="12" class="traffic-metrics">
                  <el-col v-for="card in trafficCards" :key="card.label" :lg="6" :sm="12" :xs="24">
                    <div class="traffic-metric">
                      <Icon :icon="card.icon" width="26" :color="CARD_ICON_COLOR" />
                      <div>
                        <div class="traffic-metric-value">{{ card.value.toLocaleString() }}</div>
                        <div class="traffic-metric-label">{{ card.label }}</div>
                      </div>
                    </div>
                  </el-col>
                </el-row>
                <el-row :gutter="16" class="traffic-charts">
                  <el-col :lg="16" :xs="24">
                    <div class="traffic-chart-panel">
                      <div class="traffic-chart-title">Login traffic over time</div>
                      <v-chart class="traffic-chart" :option="trafficTimelineOptions" autoresize />
                    </div>
                  </el-col>
                  <el-col :lg="8" :xs="24">
                    <div class="traffic-chart-panel">
                      <div class="traffic-chart-title">Traffic by county</div>
                      <el-empty v-if="!traffic.counties.length" description="No county data" :image-size="55" />
                      <v-chart v-else class="traffic-chart" :option="trafficSourceOptions" autoresize />
                    </div>
                  </el-col>
                </el-row>
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
.stat-card {
  width: 100%;
  height: 100%;
}
.stat-card :deep(.el-card__body) {
  padding: 18px 20px;
  height: 100%;
}
.stat-card-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 72px;
}
.stat-card-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 20px;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.stat-period-trigger {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  line-height: 1;
  color: var(--el-text-color-regular);
  cursor: pointer;
  white-space: nowrap;
}
.stat-period-trigger:hover {
  color: var(--el-color-primary);
}
.stat-card-icon {
  flex-shrink: 0;
  opacity: 0.75;
}
.mb-16px > :deep(.el-col) {
  display: flex;
}
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
.table-scroll {
  width: 100%;
  overflow-x: auto;
}
.force-logout-btn {
  white-space: nowrap;
}
.sessions-toolbar {
  justify-content: space-between;
}
.sessions-count {
  display: flex;
  align-items: center;
  gap: 6px;
}
.sessions-count-num {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}
.sessions-count-label {
  font-size: 13px;
  color: #909399;
}
.sessions-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.traffic-description { font-size: 13px; color: var(--el-text-color-secondary); }
.traffic-metrics { margin-bottom: 16px; }
.traffic-metric {
  display: flex; align-items: center; gap: 12px; padding: 16px;
  border: 1px solid var(--el-border-color-lighter); border-radius: 8px; margin-bottom: 10px;
}
.traffic-metric-value { font-size: 22px; line-height: 1.1; font-weight: 700; color: var(--el-text-color-primary); }
.traffic-metric-label { margin-top: 4px; font-size: 12px; color: var(--el-text-color-secondary); }
.traffic-chart-panel { border: 1px solid var(--el-border-color-lighter); border-radius: 8px; padding: 14px; margin-bottom: 12px; }
.traffic-chart-title { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
.traffic-chart { width: 100%; height: 340px; }
</style>
