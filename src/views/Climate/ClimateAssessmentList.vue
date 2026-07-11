<template>
  <div class="climate-assessment-list">
    <ElCard v-loading="loading">
      <ElRow :gutter="16" class="sett-toolbar-row" style="margin-bottom: 10px">
        <ElCol :xs="24" :sm="24" :md="24" :lg="4" class="sett-toolbar-col">
          <span class="page-title">Climate Assessments (KISIP Tool B)</span>
        </ElCol>

        <ElCol v-if="!isCompactToolbar && canShowCountyFilter" :xs="24" :sm="12" :md="8" :lg="3" class="sett-toolbar-col">
          <ElSelect
            v-model="filterCountyIds"
            placeholder="By County"
            multiple
            clearable
            filterable
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="1"
            style="width: 100%"
            @change="onCountyFilterChange"
          >
            <ElOption
              v-for="c in countyFilterOptions"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            />
          </ElSelect>
        </ElCol>

        <ElCol v-if="!isCompactToolbar" :xs="24" :sm="12" :md="8" :lg="3" class="sett-toolbar-col">
          <ElSelect
            v-model="filterStatus"
            placeholder="By Status"
            multiple
            clearable
            filterable
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="1"
            style="width: 100%"
            @change="onToolbarFilterChange"
          >
            <ElOption label="Draft" value="draft" />
            <ElOption label="Completed" value="completed" />
          </ElSelect>
        </ElCol>

        <ElCol v-if="!isCompactToolbar" :xs="24" :sm="12" :md="8" :lg="3" class="sett-toolbar-col">
          <ElSelect
            v-model="filterVulnerability"
            placeholder="By Vulnerability"
            multiple
            clearable
            filterable
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="1"
            style="width: 100%"
            @change="onToolbarFilterChange"
          >
            <ElOption v-for="r in ratingFilterOptions" :key="'v-' + r" :label="r" :value="r" />
          </ElSelect>
        </ElCol>

        <ElCol v-if="!isCompactToolbar" :xs="24" :sm="12" :md="8" :lg="3" class="sett-toolbar-col">
          <ElSelect
            v-model="filterRisk"
            placeholder="By Risk"
            multiple
            clearable
            filterable
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="1"
            style="width: 100%"
            @change="onToolbarFilterChange"
          >
            <ElOption v-for="r in ratingFilterOptions" :key="'r-' + r" :label="r" :value="r" />
          </ElSelect>
        </ElCol>

        <ElCol :xs="24" :sm="24" :md="12" :lg="4" class="sett-toolbar-col">
          <ElInput
            v-model="searchString"
            clearable
            placeholder="Search settlement, assessor, ID…"
            style="width: 100%"
            @clear="onSearchClear"
            @keyup.enter="applySearch"
          >
            <template #append>
              <ElButton :icon="Search" @click="applySearch" />
            </template>
          </ElInput>
        </ElCol>

        <ElCol :xs="24" :sm="24" :md="24" :lg="isCompactToolbar ? 8 : (canShowCountyFilter ? 4 : 7)" class="sett-toolbar-col">
          <div class="sett-toolbar-actions sett-toolbar-actions--desktop">
            <ElTooltip v-if="isCompactToolbar" content="Filters" placement="top">
              <ElBadge :hidden="!hasActiveFilters" is-dot class="filter-action-badge">
                <ElButton type="primary" @click="filtersDrawerOpen = true">
                  <Icon icon="mdi:filter-variant" width="20" height="20" />
                </ElButton>
              </ElBadge>
            </ElTooltip>

            <ElTooltip v-if="hasActiveFilters && !isCompactToolbar" content="Clear all filters" placement="top">
              <ElButton type="primary" @click="clearToolbarFilters">
                <Icon icon="mdi:filter-remove" width="22" height="22" />
              </ElButton>
            </ElTooltip>

            <PermissionWrapper :permissions="'climate_assessment:create'">
              <ElTooltip content="Start KISIP Tool B Questionnaire" placement="top">
                <ElButton type="primary" :icon="Plus" @click="launchDialogVisible = true" />
              </ElTooltip>
            </PermissionWrapper>

            <PermissionWrapper :permissions="'climate_assessment:read'">
              <DownloadCustom
                :data="filteredAssessments"
                model="climate_assessment"
                :associated_models="[]"
                :loading="downloadLoading"
                :total="filteredAssessments.length"
              />
            </PermissionWrapper>
          </div>
        </ElCol>
      </ElRow>

      <ElDrawer
        v-if="isCompactToolbar"
        v-model="filtersDrawerOpen"
        title="Filters"
        direction="rtl"
        :size="drawerSize"
        append-to-body
        destroy-on-close
      >
        <div class="filters-drawer">
          <ElSelect
            v-if="canShowCountyFilter"
            v-model="filterCountyIds"
            placeholder="By County"
            multiple
            clearable
            filterable
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="1"
            style="width: 100%"
            @change="onCountyFilterChange"
          >
            <ElOption
              v-for="c in countyFilterOptions"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            />
          </ElSelect>

          <ElSelect
            v-model="filterStatus"
            placeholder="By Status"
            multiple
            clearable
            filterable
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="1"
            style="width: 100%"
            @change="onToolbarFilterChange"
          >
            <ElOption label="Draft" value="draft" />
            <ElOption label="Completed" value="completed" />
          </ElSelect>

          <ElSelect
            v-model="filterVulnerability"
            placeholder="By Vulnerability"
            multiple
            clearable
            filterable
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="1"
            style="width: 100%"
            @change="onToolbarFilterChange"
          >
            <ElOption v-for="r in ratingFilterOptions" :key="'dv-' + r" :label="r" :value="r" />
          </ElSelect>

          <ElSelect
            v-model="filterRisk"
            placeholder="By Risk"
            multiple
            clearable
            filterable
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="1"
            style="width: 100%"
            @change="onToolbarFilterChange"
          >
            <ElOption v-for="r in ratingFilterOptions" :key="'dr-' + r" :label="r" :value="r" />
          </ElSelect>

          <div class="filters-drawer__actions">
            <ElButton v-if="hasActiveFilters" @click="clearToolbarFilters">Clear all</ElButton>
            <ElButton type="primary" @click="filtersDrawerOpen = false">Done</ElButton>
          </div>
        </div>
      </ElDrawer>

      <ElTable
        v-loading="loading"
        :data="paginatedAssessments"
        table-layout="fixed"
        border
        stripe
        fit
        :show-overflow-tooltip="true"
        style="width: 100%; margin-top: 10px"
        row-key="id"
        :default-sort="{ prop: 'assessed_at', order: 'descending' }"
        @row-dblclick="(row: ClimateAssessment) => openAssessment(row)"
      >
        <ElTableColumn prop="id" label="ID" width="70" sortable />

        <ElTableColumn label="Settlement" min-width="160" sortable :sort-method="sortBySettlement">
          <template #default="{ row }">
            {{ row.settlement?.name ?? '—' }}
          </template>
        </ElTableColumn>

        <ElTableColumn label="County" width="140" sortable :sort-method="sortByCounty">
          <template #default="{ row }">
            {{ row.county?.name ?? '—' }}
          </template>
        </ElTableColumn>

        <ElTableColumn prop="status" label="Status" width="110" sortable>
          <template #default="{ row }">
            <ElTag :type="statusTagType(row.status)" size="small">{{ row.status }}</ElTag>
          </template>
        </ElTableColumn>

        <ElTableColumn label="Vulnerability" width="150" sortable :sort-method="sortByVulnerabilityScore">
          <template #default="{ row }">
            <ElTag v-if="row.vulnerability_rating" :type="ratingTagType(row.vulnerability_rating)" size="small">
              {{ row.vulnerability_rating }}{{ row.vulnerability_score != null ? ` (${Number(row.vulnerability_score).toFixed(2)})` : '' }}
            </ElTag>
            <span v-else class="muted">—</span>
          </template>
        </ElTableColumn>

        <ElTableColumn label="Risk" width="150" sortable :sort-method="sortByRiskScore">
          <template #default="{ row }">
            <ElTag v-if="row.risk_rating" :type="ratingTagType(row.risk_rating)" size="small">
              {{ row.risk_rating }}{{ row.risk_score != null ? ` (${Number(row.risk_score).toFixed(2)})` : '' }}
            </ElTag>
            <span v-else class="muted">—</span>
          </template>
        </ElTableColumn>

        <ElTableColumn prop="assessed_at" label="Assessed" width="120" sortable :formatter="formatDateColumn" />

        <ElTableColumn label="Assessor" width="160" sortable :sort-method="sortByAssessor">
          <template #default="{ row }">
            {{ row.assessor?.name ?? row.assessor?.username ?? row.assessor?.email ?? (row.assessor ? `User #${row.assessor.id}` : '—') }}
          </template>
        </ElTableColumn>

        <ElTableColumn label="Actions" width="100" fixed="right">
          <template #default="{ row }">
            <TableActions
              v-if="getAssessmentActionButtons(row).length"
              :item="row"
              :buttons="getAssessmentActionButtons(row)"
              @preview="openAssessment"
              @delete="handleDeleteAssessment"
            />
          </template>
        </ElTableColumn>
      </ElTable>

      <ElPagination
        :layout="settlementPaginationLayout"
        v-model:currentPage="page"
        v-model:page-size="pageSize"
        :total="filteredAssessments.length"
        :background="true"
        :small="isMobile"
        :pager-count="isMobile ? 3 : 7"
        @size-change="onPageSizeChange"
        @current-change="onPageChange"
        class="mt-4 settlement-pagination"
      >
        <ElSelect
          v-model="pageSize"
          size="small"
          class="settlement-page-size-select"
          @change="onPageSizeChange"
        >
          <ElOption
            v-for="opt in getPageSizeOptions(filteredAssessments.length)"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElPagination>

      <ElEmpty v-if="!loading && filteredAssessments.length === 0" description="No climate assessments match your filters" />
    </ElCard>

    <ElDialog
      v-model="launchDialogVisible"
      title="Start KISIP Tool B Questionnaire"
      width="420px"
      :close-on-click-modal="false"
      @closed="onLaunchDialogClosed"
    >
      <ElForm label-position="top">
        <ElFormItem label="County">
          <ElSelect
            v-model="launchCountyId"
            placeholder="Select county"
            filterable
            style="width: 100%"
            @change="onLaunchCountyChange"
          >
            <ElOption
              v-for="c in countyFilterOptions"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="Settlement">
          <ElSelect
            v-model="launchSettlementId"
            placeholder="Select settlement"
            filterable
            style="width: 100%"
            :loading="launchSettlementsLoading"
            :disabled="!launchCountyId"
          >
            <ElOption
              v-for="s in launchSettlementOptions"
              :key="s.id"
              :label="s.label"
              :value="s.id"
            />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="launchDialogVisible = false">Cancel</ElButton>
        <ElButton
          type="primary"
          :disabled="!launchSettlementId"
          :loading="launching"
          @click="launchTool"
        >
          Open questionnaire
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCache } from '@/hooks/web/useCache'
import { useAppStoreWithOut } from '@/store/modules/app'
import {
  ElCard,
  ElTable,
  ElTableColumn,
  ElButton,
  ElSelect,
  ElOption,
  ElTag,
  ElEmpty,
  ElDialog,
  ElForm,
  ElFormItem,
  ElMessage,
  ElRow,
  ElCol,
  ElInput,
  ElTooltip,
  ElPagination,
  ElDrawer,
  ElBadge,
} from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { Icon } from '@iconify/vue'
import { listAssessments, deleteAssessment } from '@/api/climate-assessment'
import type { ClimateAssessment } from '@/api/climate-assessment'
import DownloadCustom from '@/views/Components/DownloadCustom.vue'
import TableActions from '@/views/Components/TableActions.vue'
import PermissionWrapper from '@/components/PermissionWrapper.vue'
import { getListWithoutGeo } from '@/api/counties'
import { getSettlementListByCounty } from '@/api/settlements'
import { userHasPrivilegedNationalLocation } from '@/utils/roleScope'

const router = useRouter()
const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo) || {}

const COMPACT_TOOLBAR_BREAKPOINT = 1200
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : COMPACT_TOOLBAR_BREAKPOINT)
const filtersDrawerOpen = ref(false)
const isCompactToolbar = computed(() => appStore.getMobile || windowWidth.value < COMPACT_TOOLBAR_BREAKPOINT)
const drawerSize = computed(() => (appStore.getMobile ? '100%' : '360px'))
const isMobile = computed(() => appStore.getMobile)
const settlementPaginationLayout = computed(() =>
  isMobile.value ? 'prev, pager, next, total' : 'slot, prev, pager, next, total'
)

const defaultPageSize = 10
const basePageSizes = [5, 10, 15, 20, 50, 100]

const getPageSizeOptions = (totalCount: number): { value: number; label: string }[] => {
  const opts = basePageSizes.map((s) => ({ value: s, label: `${s}/page` }))
  if (typeof totalCount !== 'number' || totalCount <= 0) return opts

  const allLabel = `All (${totalCount})`
  const existingIdx = opts.findIndex((o) => o.value === totalCount)
  if (existingIdx >= 0) {
    opts[existingIdx] = { value: totalCount, label: allLabel }
  } else {
    opts.push({ value: totalCount, label: allLabel })
  }
  return opts
}
const userPermissions = computed(() => {
  const info = userInfo
  return (info?.permissions ?? []) as string[]
})
const hasAllPermissions = computed(() =>
  userPermissions.value.length > 0 && userPermissions.value[0] === '*.*.*'
)

const loading = ref(false)
const downloadLoading = ref(false)
const assessmentsRaw = ref<ClimateAssessment[]>([])
const countyOptions = ref<Array<{ id: number; name: string }>>([])
const filterCountyIds = ref<number[]>([])
const filterStatus = ref<string[]>([])
const filterVulnerability = ref<string[]>([])
const filterRisk = ref<string[]>([])
const searchString = ref('')
const page = ref(1)
const pageSize = ref(defaultPageSize)

const ratingFilterOptions = ['Low', 'Medium', 'High']

const assignedCountyRoleIds = computed<number[]>(() => {
  const roles = Array.isArray(userInfo?.roles) ? userInfo.roles : []
  const countyIds = roles
    .filter((role: any) => role?.user_roles?.location_level === 'county' && role?.user_roles?.county_id != null)
    .map((role: any) => Number(role.user_roles.county_id))
    .filter((id: number) => !Number.isNaN(id))
  return [...new Set(countyIds)]
})

const hasNationalRole = computed<boolean>(() => userHasPrivilegedNationalLocation(userInfo?.roles))

const isPrivilegedUser = computed<boolean>(() => {
  const roles = Array.isArray(userInfo?.roles) ? userInfo.roles : []
  return roles.some((role: any) => ['super_admin', 'root_admin'].includes(role?.name))
})

const isCountyStaff = computed<boolean>(() => !isPrivilegedUser.value && !hasNationalRole.value && assignedCountyRoleIds.value.length > 0)
const canShowCountyFilter = computed<boolean>(() => !isCountyStaff.value || assignedCountyRoleIds.value.length > 1)
const countyFilterOptions = computed<Array<{ id: number; name: string }>>(() => {
  if (isCountyStaff.value) {
    const allowed = new Set(assignedCountyRoleIds.value)
    return countyOptions.value.filter((c) => allowed.has(Number(c.id)))
  }
  return countyOptions.value
})

const hasActiveFilters = computed(() => {
  if (searchString.value.trim()) return true
  if (filterStatus.value.length) return true
  if (filterVulnerability.value.length) return true
  if (filterRisk.value.length) return true
  if (!isCountyStaff.value && filterCountyIds.value.length > 0) return true
  if (isCountyStaff.value && assignedCountyRoleIds.value.length > 1 && filterCountyIds.value.length > 0) {
    const selected = [...filterCountyIds.value].map(Number).sort((a, b) => a - b).join(',')
    const assigned = [...assignedCountyRoleIds.value].map(Number).sort((a, b) => a - b).join(',')
    if (selected !== assigned) return true
  }
  return false
})

const filteredAssessments = computed(() => {
  let rows = [...assessmentsRaw.value]

  if (filterStatus.value.length) {
    const allowed = new Set(filterStatus.value)
    rows = rows.filter((r) => allowed.has(r.status))
  }

  if (filterVulnerability.value.length) {
    const allowed = new Set(filterVulnerability.value.map((v) => v.toLowerCase()))
    rows = rows.filter((r) => r.vulnerability_rating && allowed.has(String(r.vulnerability_rating).toLowerCase()))
  }

  if (filterRisk.value.length) {
    const allowed = new Set(filterRisk.value.map((v) => v.toLowerCase()))
    rows = rows.filter((r) => r.risk_rating && allowed.has(String(r.risk_rating).toLowerCase()))
  }

  const q = searchString.value.trim().toLowerCase()
  if (q) {
    rows = rows.filter((r) => {
      const settlement = (r.settlement?.name ?? '').toLowerCase()
      const county = (r.county?.name ?? '').toLowerCase()
      const assessor = (
        r.assessor?.name ??
        r.assessor?.username ??
        r.assessor?.email ??
        ''
      ).toLowerCase()
      return (
        settlement.includes(q) ||
        county.includes(q) ||
        assessor.includes(q) ||
        String(r.id).includes(q) ||
        (r.status ?? '').toLowerCase().includes(q)
      )
    })
  }

  return rows
})

const paginatedAssessments = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredAssessments.value.slice(start, start + pageSize.value)
})

watch(filteredAssessments, () => {
  page.value = 1
})

const launchDialogVisible = ref(false)
const launchCountyId = ref<number | undefined>(undefined)
const launchSettlementId = ref<number | undefined>(undefined)
const launchSettlementOptions = ref<Array<{ id: number; label: string }>>([])
const launchSettlementsLoading = ref(false)
const launching = ref(false)

function onLaunchCountyChange() {
  launchSettlementId.value = undefined
  launchSettlementOptions.value = []
  if (launchCountyId.value !== undefined && launchCountyId.value !== null) {
    fetchLaunchSettlements(launchCountyId.value)
  }
}

async function fetchLaunchSettlements(countyId: number) {
  launchSettlementsLoading.value = true
  try {
    const formData = {
      limit: 2000,
      page: 1,
      curUser: 1,
      model: 'settlement',
      filters: ['county_id'],
      filterValues: [[countyId]],
    }
    const res = await getSettlementListByCounty(formData as any)
    const data = (res as any)?.data ?? []
    launchSettlementOptions.value = (Array.isArray(data) ? data : []).map((s: any) => ({
      id: s.id,
      label: s.name || String(s.id),
    }))
  } catch {
    launchSettlementOptions.value = []
  } finally {
    launchSettlementsLoading.value = false
  }
}

function onLaunchDialogClosed() {
  launchCountyId.value = undefined
  launchSettlementId.value = undefined
  launchSettlementOptions.value = []
}

function launchTool() {
  const sid = launchSettlementId.value
  if (sid === undefined || sid === null) return
  launching.value = true
  launchDialogVisible.value = false
  router.push({ name: 'ClimateAssessmentSettlement', params: { id: String(sid) } })
  launching.value = false
}

function onCountyFilterChange() {
  page.value = 1
  fetchAssessments()
}

function onToolbarFilterChange() {
  page.value = 1
}

function onPageChange(selPage: number) {
  page.value = selPage
}

function onPageSizeChange(size: number) {
  pageSize.value = size
  page.value = 1
}

function applySearch() {
  page.value = 1
}

function onSearchClear() {
  searchString.value = ''
  page.value = 1
}

function clearToolbarFilters() {
  searchString.value = ''
  filterStatus.value = []
  filterVulnerability.value = []
  filterRisk.value = []
  if (isCountyStaff.value) {
    filterCountyIds.value = [...assignedCountyRoleIds.value]
  } else {
    filterCountyIds.value = []
  }
  page.value = 1
  fetchAssessments()
}

function updateWindowWidth() {
  windowWidth.value = window.innerWidth
}

async function fetchCounties() {
  try {
    const res = await getListWithoutGeo({
      params: {
        pageIndex: 1,
        limit: 1000,
        curUser: 1,
        model: 'county',
        searchField: 'name',
        searchKeyword: '',
        sort: 'ASC',
      },
    })
    const raw = (res as any)?.data ?? res
    const list = Array.isArray(raw) ? raw : (raw?.list ?? [])
    countyOptions.value = list.map((c: any) => ({ id: c.id, name: c.name || c.name_en || String(c.id) }))
  } catch {
    countyOptions.value = []
  }
}

async function fetchAssessments() {
  loading.value = true
  try {
    const params: { county_id?: string } = {}
    if (isCountyStaff.value) {
      const requestedCountyIds = (filterCountyIds.value?.length ? filterCountyIds.value : assignedCountyRoleIds.value)
        .filter((id) => assignedCountyRoleIds.value.includes(Number(id)))
      const scopedCountyIds = requestedCountyIds.length ? requestedCountyIds : assignedCountyRoleIds.value
      if (scopedCountyIds.length) params.county_id = scopedCountyIds.join(',')
    } else if (filterCountyIds.value?.length) {
      params.county_id = filterCountyIds.value.join(',')
    }
    const res = await listAssessments(params)
    if (res?.code === '0000' && Array.isArray(res.data)) {
      assessmentsRaw.value = res.data
    } else {
      assessmentsRaw.value = []
    }
  } catch {
    assessmentsRaw.value = []
  } finally {
    loading.value = false
  }
}

function getAssessmentActionButtons(_row: ClimateAssessment): string[] {
  const perms = userPermissions.value
  const buttons: string[] = []
  if (hasAllPermissions.value || perms.includes('climate_assessment:read') || perms.includes('climate_assessment:update')) {
    buttons.push('preview')
  }
  if (hasAllPermissions.value || perms.includes('climate_assessment:delete')) {
    buttons.push('delete')
  }
  return buttons
}

function openAssessment(row: ClimateAssessment) {
  const sid = row.settlement_id ?? row.settlement?.id
  if (sid) {
    router.push({ name: 'ClimateAssessmentSettlement', params: { id: String(sid) } })
  }
}

async function handleDeleteAssessment(row: ClimateAssessment) {
  if (!row?.id) return
  try {
    await deleteAssessment(row.id)
    await fetchAssessments()
    ElMessage.success('Assessment deleted')
  } catch (e: any) {
    ElMessage.error(e?.message ?? 'Failed to delete assessment')
  }
}

function ratingTagType(rating: string | null | undefined): 'success' | 'warning' | 'danger' | 'info' {
  const r = rating?.toUpperCase()
  if (r === 'HIGH') return 'danger'
  if (r === 'MEDIUM') return 'warning'
  if (r === 'LOW') return 'success'
  return 'info'
}

function statusTagType(status: string): 'success' | 'info' | 'warning' | 'primary' | 'danger' {
  if (status === 'completed') return 'success'
  if (status === 'draft') return 'info'
  return 'info'
}

function formatDate(val: string | null | undefined) {
  if (!val) return '—'
  try {
    const d = new Date(val)
    return isNaN(d.getTime()) ? val : d.toLocaleDateString()
  } catch {
    return val
  }
}

function formatDateColumn(row: ClimateAssessment) {
  return formatDate(row.assessed_at)
}

function sortBySettlement(a: ClimateAssessment, b: ClimateAssessment) {
  return (a.settlement?.name ?? '').localeCompare(b.settlement?.name ?? '', undefined, { sensitivity: 'base' })
}

function sortByCounty(a: ClimateAssessment, b: ClimateAssessment) {
  return (a.county?.name ?? '').localeCompare(b.county?.name ?? '', undefined, { sensitivity: 'base' })
}

function sortByAssessor(a: ClimateAssessment, b: ClimateAssessment) {
  const nameA = a.assessor?.name ?? a.assessor?.username ?? a.assessor?.email ?? ''
  const nameB = b.assessor?.name ?? b.assessor?.username ?? b.assessor?.email ?? ''
  return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' })
}

function sortByVulnerabilityScore(a: ClimateAssessment, b: ClimateAssessment) {
  const scoreA = a.vulnerability_score ?? -Infinity
  const scoreB = b.vulnerability_score ?? -Infinity
  return Number(scoreA) - Number(scoreB)
}

function sortByRiskScore(a: ClimateAssessment, b: ClimateAssessment) {
  const scoreA = a.risk_score ?? -Infinity
  const scoreB = b.risk_score ?? -Infinity
  return Number(scoreA) - Number(scoreB)
}

onMounted(() => {
  window.addEventListener('resize', updateWindowWidth)
  fetchCounties()
  if (isCountyStaff.value) {
    filterCountyIds.value = [...assignedCountyRoleIds.value]
  }
  fetchAssessments()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth)
})
</script>

<style scoped>
.climate-assessment-list {
  padding: 0;
}

.page-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--el-text-color-primary);
  letter-spacing: -0.02em;
  line-height: 32px;
}

.muted {
  color: var(--el-text-color-placeholder);
}

.sett-toolbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  flex-wrap: nowrap;
  width: 100%;
}

.sett-toolbar-actions--desktop {
  flex-wrap: wrap;
}

.sett-toolbar-row :deep(.sett-toolbar-col) {
  margin-bottom: 12px;
}

.sett-toolbar-row :deep(.sett-toolbar-col:last-child) {
  margin-bottom: 0;
}

@media (min-width: 992px) {
  .sett-toolbar-row :deep(.sett-toolbar-col) {
    margin-bottom: 0;
  }
}

.settlement-pagination {
  display: flex;
  flex-wrap: wrap;
  row-gap: 8px;
}

@media (max-width: 768px) {
  :deep(.settlement-pagination) {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
    row-gap: 8px;
  }
}

.settlement-page-size-select {
  width: 130px;
  margin-right: 8px;
}

@media (max-width: 768px) {
  .settlement-page-size-select {
    width: 110px;
    margin-right: 4px;
  }
}

.filter-action-badge :deep(.el-badge__content.is-dot) {
  top: 4px;
  right: 8px;
}

.filters-drawer {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filters-drawer__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
</style>
