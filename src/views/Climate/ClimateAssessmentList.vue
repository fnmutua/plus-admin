<template>
  <div class="climate-assessment-list">
    <ElCard>
      <template #header>
        <div class="card-header">
          <span class="title">Climate Assessments (KISIP Tool B)</span>
          <div class="actions">
            <PermissionWrapper :permissions="'climate_assessment:create'">
              <ElButton type="primary" @click="launchDialogVisible = true">
                Start KISIP Tool B Questionnaire
              </ElButton>
            </PermissionWrapper>
            <ElSelect
              v-model="filterCountyIds"
              placeholder="All counties"
              clearable
              filterable
              multiple
              collapse-tags
              collapse-tags-tooltip
              class="county-filter"
              style="width: 280px"
              @change="fetchAssessments"
            >
              <ElOption
                v-for="c in countyOptions"
                :key="c.id"
                :label="c.name"
                :value="c.id"
              />
            </ElSelect>
            <PermissionWrapper :permissions="'climate_assessment:read'">
              <DownloadCustom
                :data="assessments"
                model="climate_assessment"
                :associated_models="[]"
                :loading="downloadLoading"
              />
            </PermissionWrapper>
            <ElButton :icon="RefreshRight" @click="fetchAssessments">Refresh</ElButton>
          </div>
        </div>
      </template>

      <ElTable
        v-loading="loading"
        :data="assessments"
        stripe
        style="width: 100%"
        :default-sort="{ prop: 'assessed_at', order: 'descending' }"
      >
        <ElTableColumn prop="id" label="ID" width="70" />
        <ElTableColumn label="Settlement" min-width="160">
          <template #default="{ row }">
            {{ row.settlement?.name ?? '—' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="County" width="140">
          <template #default="{ row }">
            {{ row.county?.name ?? '—' }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="status" label="Status" width="100">
          <template #default="{ row }">
            <ElTag :type="statusTagType(row.status)" size="small">{{ row.status }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="Overall" width="160">
          <template #default="{ row }">
            <ElTag v-if="row.vulnerability_rating || overallScoreForRow(row) != null" :type="ratingTagType(row.vulnerability_rating)" size="small">
              {{ row.vulnerability_rating || '—' }}{{ overallScoreForRow(row) != null ? ` (${overallScoreForRow(row)})` : '' }}
            </ElTag>
            <span v-else class="muted">—</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="Assessed" width="120">
          <template #default="{ row }">
            {{ formatDate(row.assessed_at) }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="assessor" label="Assessor" width="160">
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

      <ElEmpty v-if="!loading && assessments.length === 0" description="No climate assessments" />
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
              v-for="c in countyOptions"
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
import { ref, computed, onMounted } from 'vue'
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
} from 'element-plus'
import { RefreshRight } from '@element-plus/icons-vue'
import { listAssessments, deleteAssessment } from '@/api/climate-assessment'
import type { ClimateAssessment } from '@/api/climate-assessment'
import DownloadCustom from '@/views/Components/DownloadCustom.vue'
import TableActions from '@/views/Components/TableActions.vue'
import PermissionWrapper from '@/components/PermissionWrapper.vue'
import { getListWithoutGeo } from '@/api/counties'
import { getSettlementListByCounty } from '@/api/settlements'

const router = useRouter()
const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userPermissions = computed(() => {
  const info = wsCache.get(appStore.getUserInfo)
  return (info?.permissions ?? []) as string[]
})
const hasAllPermissions = computed(() =>
  userPermissions.value.length > 0 && userPermissions.value[0] === '*.*.*'
)
const loading = ref(false)
const downloadLoading = ref(false)
const assessments = ref<ClimateAssessment[]>([])
const countyOptions = ref<Array<{ id: number; name: string }>>([])
const filterCountyIds = ref<number[]>([])

// Dialog to pick settlement, then open ClimateAssessment.vue (same route as SettlementDetails)
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
    if (filterCountyIds.value?.length) params.county_id = filterCountyIds.value.join(',')
    const res = await listAssessments(params)
    if (res?.code === '0000' && Array.isArray(res.data)) {
      assessments.value = res.data
    } else {
      assessments.value = []
    }
  } catch {
    assessments.value = []
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

function overallScoreForRow(row: ClimateAssessment): number | null {
  const raw = [
    row.hazard_score,
    row.exposure_score,
    row.sensitivity_score,
    row.adaptive_capacity_score,
  ]
  const valid: number[] = []
  for (const s of raw) {
    const n = typeof s === 'number' ? s : (s != null && s !== '' ? Number(s) : NaN)
    if (typeof n === 'number' && !Number.isNaN(n)) valid.push(n)
  }
  if (valid.length === 0) return null
  const avg = valid.reduce((sum, s) => sum + s, 0) / valid.length
  return Math.round(avg * 100) / 100
}

function ratingTagType(rating: string | null | undefined): 'success' | 'warning' | 'danger' | 'info' {
  const r = rating?.toUpperCase()
  if (r === 'HIGH') return 'danger'
  if (r === 'MEDIUM') return 'warning'
  if (r === 'LOW') return 'success'
  return 'info' // no rating yet
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

onMounted(() => {
  fetchCounties()
  fetchAssessments()
})
</script>

<style scoped>
.climate-assessment-list {
  padding: 0;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.card-header .title {
  font-weight: 600;
  font-size: 1.1rem;
}
.card-header .actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.muted {
  color: var(--el-text-color-placeholder);
}
</style>
