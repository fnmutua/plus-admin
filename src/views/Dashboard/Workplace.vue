<script setup lang="ts">
import {
  ElRow, ElCol, ElCard, ElSkeleton, ElAlert,
  ElTable, ElTableColumn, ElTabs, ElTabPane,
  ElTimeline, ElTimelineItem, ElTag, ElButton,
  ElAvatar, ElEmpty, ElTooltip, ElDivider, ElMessage
} from 'element-plus'
import { ref, computed } from 'vue'
import { CountTo } from '@/components/CountTo'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { getMyProfile } from '@/api/users'
import { getSummarybyFieldSimple } from '@/api/summary'
import { getSettlementListByCounty } from '@/api/settlements'
import { getAuditLogs } from '@/api/audit'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)
const { push } = useRouter()

// ── Permission helper ─────────────────────────────────────────────────────────
const userPermissions = (userInfo?.permissions || []) as string[]
const can = (perm: string) =>
  userPermissions.includes('*.*.*') || userPermissions.includes(perm)

// ── Role detection ────────────────────────────────────────────────────────────
const isSuperAdmin = computed(() =>
  userInfo?.roles?.some((r: any) => r.name === 'super_admin' || r.name === 'root_admin') || false
)
const hasNationalAccess = computed(() =>
  userInfo?.roles?.some((r: any) => r.user_roles?.location_level === 'national') || false
)
const countyRole = computed(() =>
  userInfo?.roles?.find((r: any) => r.user_roles?.location_level === 'county')
)

const userRoleLabel = computed(() => {
  if (isSuperAdmin.value)      return 'Super Admin'
  if (hasNationalAccess.value) return 'National'
  if (countyRole.value)        return 'County'
  return 'User'
})

const userRoleTagType = computed((): 'danger' | 'warning' | 'success' | 'info' => {
  if (isSuperAdmin.value)      return 'danger'
  if (hasNationalAccess.value) return 'warning'
  if (countyRole.value)        return 'success'
  return 'info'
})

// ── Loading states (per section) ──────────────────────────────────────────────
const loadingProfile     = ref(true)
const loadingStats       = ref(true)
const loadingSettlements = ref(true)
const loadingActivity    = ref(true)

// ── Greeting ──────────────────────────────────────────────────────────────────
const greeting = ref('Good Morning')
const getTimeGreeting = () => {
  const h = new Date().getHours()
  if (h >= 5 && h < 12)       greeting.value = 'Good Morning'
  else if (h >= 12 && h < 17) greeting.value = 'Good Afternoon'
  else if (h >= 17 && h < 21) greeting.value = 'Good Evening'
  else                         greeting.value = 'Good Night'
}

// ── Profile ───────────────────────────────────────────────────────────────────
const profile = ref({ id: '', name: '', email: '', username: '', photo: null as string | null, date: '' })
const initials = ref('')

const formatDate = (d: string) => {
  const date = new Date(d)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const loadProfile = async () => {
  try {
    const res = await getMyProfile({ model: 'users', id: userInfo.id })
    const d = res.data
    profile.value = { id: d.id, name: d.name, email: d.email, username: d.username, photo: d.photo, date: formatDate(d.createdAt) }
    initials.value = d.name.split(' ').map((w: string) => w[0]?.toUpperCase() || '').join('')
  } catch { /* silent */ } finally {
    loadingProfile.value = false
  }
}

// ── Stats ─────────────────────────────────────────────────────────────────────
const stats = ref({ settlements: 0, projects: 0, documents: 0 })

const getCountFor = async (model: string): Promise<number> => {
  try {
    const res = await getSummarybyFieldSimple({ model, summaryFunction: 'count', summaryField: 'createdBy', summaryFieldValue: userInfo.id })
    return Number(res.Total?.[0]?.count || 0)
  } catch { return 0 }
}

const loadStats = async () => {
  const [s, p, d] = await Promise.all([getCountFor('settlement'), getCountFor('project'), getCountFor('document')])
  stats.value = { settlements: s, projects: p, documents: d }
  loadingStats.value = false
}

// ── My Settlements (primary content) ─────────────────────────────────────────
const settlementsList   = ref<any[]>([])
const missingBoundary   = computed(() => settlementsList.value.filter(s => !s.geom))
const projectsList      = ref<any[]>([])
const activeRecordsTab  = ref('projects')

const loadSettlements = async () => {
  try {
    const res = await getSettlementListByCounty({
      limit: 10, page: 1, curUser: userInfo.id, model: 'settlement',
      searchField: 'name', searchKeyword: '',
      associated_multiple_models: ['county', 'subcounty', 'ward'],
      sort: 'DESC', sortField: 'createdAt'
    })
    settlementsList.value = res.data || []
  } catch { /* silent */ } finally {
    loadingSettlements.value = false
  }
}

const loadProjects = async () => {
  try {
    const res = await getSettlementListByCounty({
      limit: 10, page: 1, curUser: userInfo.id, model: 'project',
      searchField: 'title', searchKeyword: '',
      associated_multiple_models: [],
      sort: 'DESC', sortField: 'createdAt'
    })
    projectsList.value = res.data || []
  } catch { /* silent */ }
}

// ── Recent documents (supporting settlements) ─────────────────────────────────

// ── Activity ──────────────────────────────────────────────────────────────────
const recentActivities = ref<any[]>([])

const timeSince = (date: string) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  for (const [label, secs] of [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60]] as [string, number][]) {
    const n = Math.floor(seconds / secs)
    if (n >= 1) return `${n} ${label}${n !== 1 ? 's' : ''} ago`
  }
  return 'just now'
}

const ENTITY_LABELS: Record<string, string> = {
  settlement: 'Settlement', households: 'Household', document: 'Document',
  project: 'Project', project_task: 'Project Task', auth: 'Authentication',
  users: 'User', grievance: 'Grievance', community: 'Community',
  education_facility: 'Education Facility', health_facility: 'Health Facility',
  water_point: 'Water Point', road: 'Road', intervention: 'Intervention',
  indicator: 'Indicator', indicator_category_report: 'Indicator Report',
  logs: 'System', unknown: 'Other'
}

const ACTION_ICONS: Record<string, { icon: string; color: string }> = {
  login:         { icon: 'mdi:login-variant',       color: '#409eff' },
  logout:        { icon: 'mdi:logout-variant',       color: '#909399' },
  create:        { icon: 'mdi:plus-circle-outline',  color: '#67c23a' },
  update:        { icon: 'mdi:pencil-outline',        color: '#e6a23c' },
  delete:        { icon: 'mdi:delete-outline',        color: '#f56c6c' },
  status_change: { icon: 'mdi:swap-horizontal',       color: '#9c27b0' },
}

const lastLogin = ref('')

const loadLastLogin = async (username: string) => {
  try {
    const res = await getAuditLogs({ page: 1, limit: 2, actor: username, action: 'login', silent: true })
    const rows: any[] = Array.isArray(res?.data) ? res.data : []
    // skip index 0 — that's the current session; use index 1 as the previous login
    const entry = rows[1] ?? rows[0]
    if (entry) lastLogin.value = timeSince(entry.timestamp || entry.createdAt || entry.date)
  } catch { /* silent */ }
}

const loadActivity = async (username: string) => {
  try {
    const res = await getAuditLogs({ page: 1, limit: 5, actor: username })
    const rows: any[] = Array.isArray(res?.data) ? res.data : []
    recentActivities.value = rows.map((r: any) => {
      const action  = (r.action  || '').toLowerCase()
      const outcome = (r.outcome || r.status || '').toLowerCase()
      const meta    = ACTION_ICONS[action] ?? { icon: 'mdi:information-outline', color: '#909399' }
      return {
        action,
        entityLabel: ENTITY_LABELS[r.entityType] || r.entityType || 'System',
        outcome,
        timestamp:   timeSince(r.timestamp || r.createdAt || r.date),
        icon:        meta.icon,
        dotColor:    outcome === 'failure' ? '#f56c6c' : meta.color
      }
    })
  } catch { recentActivities.value = [] } finally {
    loadingActivity.value = false
  }
}

// ── Map navigation ────────────────────────────────────────────────────────────
const viewOnMap = (row: any) => {
  if (row.geom) {
    push({ path: '/settlement/map/:id', name: 'SettlementMap', params: { id: row.id } })
  } else {
    ElMessage.warning('This settlement does not have a boundary defined.')
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
const init = async () => {
  getTimeGreeting()
  await loadProfile()
  // Settlements load first — docs depend on their IDs
  await Promise.all([loadStats(), loadSettlements(), loadProjects(), loadActivity(profile.value.username), loadLastLogin(profile.value.username)])
}

init()
</script>

<template>
  <div class="dashboard">

    <!-- ── Profile header ────────────────────────────────────────────────── -->
    <el-card shadow="never" class="mb-16px">
      <el-skeleton :loading="loadingProfile" animated :rows="2">
        <template #default>
          <div class="profile-header">

            <!-- Avatar + name block -->
            <div class="profile-identity">
              <el-avatar
                :src="profile.photo || undefined"
                :size="52"
                class="cursor-pointer flex-shrink-0 text-18px font-bold"
                @click="push({ name: 'userProfile' })"
              >{{ initials }}</el-avatar>
              <div class="profile-text">
                <div class="profile-name-row">
                  <span class="profile-name">{{ greeting }}, {{ profile.name }}</span>
                  <el-tag :type="userRoleTagType" size="small" effect="light">{{ userRoleLabel }}</el-tag>
                </div>
                <div class="profile-meta">
                  <span>{{ profile.email }}</span>
                  <span class="meta-sep">·</span>
                  <span>Since {{ profile.date }}</span>
                  <template v-if="lastLogin">
                    <span class="meta-sep">·</span>
                    <span>Last login {{ lastLogin }}</span>
                  </template>
                </div>
              </div>
            </div>

            <!-- Quick actions -->
            <div class="profile-actions">
              <el-button
                v-if="can('settlement:create')"
                type="primary" size="small"
                @click="push({ name: 'AddSettlementNew' })"
              >
                <Icon icon="mdi:home-plus-outline" width="14" class="mr-4px" />Add Settlement
              </el-button>
              <el-button
                v-if="can('settlement:read')"
                size="small" plain
                @click="push({ name: 'Settlements' })"
              >
                <Icon icon="mdi:home-city-outline" width="14" class="mr-4px" />Settlements
              </el-button>
              <el-button
                size="small" plain
                @click="push({ name: 'LandingMap' })"
              >
                <Icon icon="mdi:map-outline" width="14" class="mr-4px" />Map
              </el-button>
            </div>

          </div>
        </template>
      </el-skeleton>
    </el-card>

    <!-- ── Onboarding (shown when user has no data yet) ─────────────────── -->
    <el-card
      v-if="!loadingStats && !stats.settlements && !stats.projects && !stats.documents"
      shadow="never" class="mb-16px onboarding-card"
    >
      <div class="onboarding-inner">
        <Icon icon="mdi:rocket-launch-outline" width="48" color="#409eff" />
        <div class="mt-12px mb-6px text-20px font-bold">Welcome to KeSMIS, {{ profile.name.split(' ')[0] }}!</div>
        <div class="text-14px text-gray-400 mb-24px">You don't have any data yet. Here's where to begin.</div>
        <el-row :gutter="16" justify="center">
          <el-col v-if="can('settlement:create')" :xl="6" :lg="6" :md="8" :sm="12" :xs="24" class="mb-10px">
            <el-card shadow="hover" class="action-tile" @click="push({ name: 'AddSettlementNew' })">
              <Icon icon="mdi:home-plus-outline" width="32" color="#409eff" />
              <div class="mt-8px font-medium">Add a Settlement</div>
              <div class="text-12px text-gray-400 mt-4px">Register a new informal settlement</div>
            </el-card>
          </el-col>
          <el-col v-if="can('document:create')" :xl="6" :lg="6" :md="8" :sm="12" :xs="24" class="mb-10px">
            <el-card shadow="hover" class="action-tile" @click="push({ name: 'ImportDocument' })">
              <Icon icon="mdi:file-upload-outline" width="32" color="#e6a23c" />
              <div class="mt-8px font-medium">Upload Documents</div>
              <div class="text-12px text-gray-400 mt-4px">Attach files to settlements or projects</div>
            </el-card>
          </el-col>
          <el-col :xl="6" :lg="6" :md="8" :sm="12" :xs="24" class="mb-10px">
            <el-card shadow="hover" class="action-tile" @click="push({ name: 'LandingMap' })">
              <Icon icon="mdi:map-outline" width="32" color="#67c23a" />
              <div class="mt-8px font-medium">Explore the Map</div>
              <div class="text-12px text-gray-400 mt-4px">View settlements across the country</div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- ── Stat cards ────────────────────────────────────────────────────── -->
    <el-row :gutter="16" class="mb-16px">
      <el-col
        v-for="stat in [
          { label: 'My Settlements', value: stats.settlements, icon: 'mdi:home-city-outline',     color: '#409eff', route: 'Settlement'       },
          { label: 'My Documents',   value: stats.documents,   icon: 'mdi:file-document-outline', color: '#e6a23c', route: 'RepositoryTagged' },
          { label: 'My Projects',    value: stats.projects,    icon: 'mdi:briefcase-outline',      color: '#67c23a', route: 'Project'          }
        ]"
        :key="stat.label"
        :xl="8" :lg="8" :md="8" :sm="24" :xs="24"
        class="mb-10px"
      >
        <el-card shadow="hover" class="stat-card cursor-pointer" @click="push({ name: stat.route })">
          <el-skeleton :loading="loadingStats" animated :rows="1">
            <template #default>
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-13px text-gray-400 mb-8px">{{ stat.label }}</div>
                  <CountTo class="text-28px font-bold" :start-val="0" :end-val="stat.value" :duration="1600" />
                </div>
                <Icon :icon="stat.icon" width="44" :color="stat.color" style="opacity:0.7" />
              </div>
            </template>
          </el-skeleton>
        </el-card>
      </el-col>
    </el-row>

    <!-- ── My Settlements — primary content ─────────────────────────────── -->
    <el-card v-if="loadingSettlements || settlementsList.length" shadow="never" class="mb-16px">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-10px">
            <span class="font-semibold text-16px">Recent Settlements</span>
            <el-tag v-if="missingBoundary.length" type="warning" size="small" effect="light">
              <Icon icon="mdi:alert-outline" width="12" class="mr-4px" />
              {{ missingBoundary.length }} missing boundary
            </el-tag>
          </div>
          <el-button type="primary" link @click="push({ name: 'Settlement' })">View all →</el-button>
        </div>
      </template>

      <el-skeleton :loading="loadingSettlements" animated :rows="5">
        <template #default>
          <!-- Attention banner -->
          <el-alert
            v-if="missingBoundary.length"
            :title="`${missingBoundary.length} settlement${missingBoundary.length > 1 ? 's' : ''} have no boundary defined — they won't appear on the map.`"
            type="warning" show-icon :closable="false" class="mb-12px"
          />

          <el-table :data="settlementsList" style="width:100%" size="small">
            <el-table-column type="index" width="42" />
            <el-table-column label="Name" min-width="160">
              <template #default="{ row }">
                <span class="font-medium">{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Location" min-width="180">
              <template #default="{ row }">
                <span class="text-13px text-gray-600">
                  {{ [row.county?.name, row.subcounty?.name, row.ward?.name].filter(Boolean).join(', ') || '—' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="Area (Ha)" width="100" align="right">
              <template #default="{ row }">
                <span class="text-13px">{{ row.area ? Number(row.area).toLocaleString() : '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Population" width="110" align="right">
              <template #default="{ row }">
                <span class="text-13px">{{ row.population ? Number(row.population).toLocaleString() : '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Climate Vulnerability" width="180" align="center">
              <template #default="{ row }">
                <el-tag
                  v-if="row.vulnerability_rating"
                  :type="row.vulnerability_rating?.toUpperCase() === 'HIGH' ? 'danger' : row.vulnerability_rating?.toUpperCase() === 'MEDIUM' ? 'warning' : 'success'"
                  size="small" effect="light"
                >{{ row.vulnerability_rating.toUpperCase() }}</el-tag>
                <span v-else class="text-gray-400 text-13px">—</span>
              </template>
            </el-table-column>
            <el-table-column label="Map" width="70" align="center">
              <template #default="{ row }">
                <el-tooltip :content="row.geom ? 'View on map' : 'No boundary defined'" placement="top">
                  <el-button type="primary" link size="small" :disabled="!row.geom" @click="viewOnMap(row)">
                    <Icon icon="mdi:map-marker-outline" width="16" />
                  </el-button>
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </el-skeleton>
    </el-card>

    <!-- ── Documents + Activity ──────────────────────────────────────────── -->
    <el-row :gutter="16">

      <!-- Left column -->
      <el-col :xl="16" :lg="16" :md="24" :sm="24" :xs="24" class="mb-16px">

        <!-- Projects -->
        <el-card v-if="loadingSettlements || projectsList.length" shadow="never">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-semibold">Recent Projects</span>
              <el-button type="primary" link @click="push({ name: 'Project' })">View all →</el-button>
            </div>
          </template>
          <el-skeleton :loading="loadingSettlements" animated :rows="3">
            <template #default>
              <el-table :data="projectsList" style="width:100%" size="small">
                <el-table-column type="index" width="42" />
                <el-table-column prop="project_code" label="Code"  width="130" />
                <el-table-column prop="title"        label="Title" min-width="180" />
                <el-table-column label="Status" width="120">
                  <template #default="{ row }">
                    <el-tag
                      v-if="row.status"
                      :type="row.status === 'active' ? 'success' : row.status === 'completed' ? 'info' : ''"
                      size="small"
                      effect="light"
                    >{{ row.status }}</el-tag>
                    <span v-else class="text-gray-400">—</span>
                  </template>
                </el-table-column>
              </el-table>
            </template>
          </el-skeleton>
        </el-card>
      </el-col>

      <!-- Activity + Attention sidebar -->
      <el-col :xl="8" :lg="8" :md="24" :sm="24" :xs="24" class="mb-16px right-col">

        <!-- Attention items -->
        <el-card v-if="missingBoundary.length" shadow="never" class="mb-16px attention-card">
          <template #header>
            <div class="flex items-center gap-8px">
              <Icon icon="mdi:bell-badge-outline" width="16" color="#e6a23c" />
              <span class="font-semibold">Needs Attention</span>
            </div>
          </template>
          <div class="attention-list">
            <div v-if="missingBoundary.length" class="attention-item" @click="push({ name: 'Settlement' })">
              <Icon icon="mdi:map-marker-off-outline" width="18" color="#e6a23c" />
              <div>
                <div class="font-medium text-14px">{{ missingBoundary.length }} settlement{{ missingBoundary.length > 1 ? 's' : '' }} missing boundary</div>
                <div class="text-12px text-gray-400">These won't appear on the map</div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- Activity timeline -->
        <el-card shadow="never" class="activity-card">
          <template #header>
            <span class="font-semibold">My Recent Activity</span>
          </template>
          <el-skeleton :loading="loadingActivity" animated :rows="6">
            <template #default>
              <el-empty v-if="!recentActivities.length" description="No recent activity" :image-size="60" />
              <div v-else class="activity-scroll">
                <el-timeline style="padding-left:4px">
                  <el-timeline-item
                    v-for="(a, i) in recentActivities"
                    :key="i"
                    :color="a.dotColor"
                    :timestamp="a.timestamp"
                    placement="top"
                    size="large"
                  >
                    <div class="flex items-center gap-8px flex-wrap">
                      <Icon :icon="a.icon" width="15" :color="a.dotColor" style="flex-shrink:0" />
                      <span class="text-13px font-medium capitalize">{{ a.action.replace('_', ' ') }}</span>
                      <el-tag size="small" effect="plain">{{ a.entityLabel }}</el-tag>
                      <el-tag size="small" :type="a.outcome === 'failure' ? 'danger' : 'success'" effect="light">
                        {{ a.outcome === 'failure' ? 'Failed' : 'Success' }}
                      </el-tag>
                    </div>
                  </el-timeline-item>
                </el-timeline>
              </div>
            </template>
          </el-skeleton>
        </el-card>

      </el-col>
    </el-row>

  </div>
</template>

<style scoped>
/* ── Profile header ── */
.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.profile-identity {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.profile-text {
  min-width: 0;
}
.profile-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}
.profile-name {
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.profile-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}
.meta-sep { opacity: 0.4; }
.profile-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .profile-header { flex-direction: column; align-items: flex-start; }
  .profile-name   { font-size: 16px; }
  .profile-actions { width: 100%; }
  .profile-actions .el-button { flex: 1; justify-content: center; }
}

.stat-card :deep(.el-card__body) { padding: 18px 20px; }

.attention-card :deep(.el-card__body) { padding: 12px 16px; }
.attention-list { display: flex; flex-direction: column; gap: 4px; }
.attention-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 10px 8px; border-radius: 6px; cursor: pointer;
  transition: background 0.15s;
}
.attention-item:hover { background: #fdf6ec; }

.right-col {
  display: flex;
  flex-direction: column;
}
.activity-card {
  flex: 1;
}
.activity-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  height: calc(100% - 55px);
}
.onboarding-card :deep(.el-card__body) { padding: 40px 24px; }
.onboarding-inner { display: flex; flex-direction: column; align-items: center; text-align: center; }
.action-tile {
  cursor: pointer; text-align: center;
  padding: 8px 4px;
  transition: transform 0.15s;
}
.action-tile:hover { transform: translateY(-3px); }

.activity-scroll {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}
</style>
