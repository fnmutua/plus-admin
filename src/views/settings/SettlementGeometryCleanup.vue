<template>
  <div class="settlement-geom-cleanup">
    <ElAlert type="info" :closable="false" show-icon class="intro-alert">
      Find settlements missing boundary geometry, stored as points, or with invalid PostGIS geometries.
      Open a settlement to fix its geometry in the settlement editor.
    </ElAlert>

    <div class="summary-row">
      <div
        v-for="card in summaryCards"
        :key="card.key"
        class="summary-card"
        :class="{ 'summary-card--active': issueFilter === card.key }"
        @click="setIssueFilter(card.key)"
      >
        <span class="summary-count">{{ card.count }}</span>
        <span class="summary-label">{{ card.label }}</span>
      </div>
    </div>

    <div class="toolbar">
      <ElInput
        v-model="search"
        clearable
        placeholder="Search settlement name…"
        style="width: 220px"
        @input="onSearch"
      />
      <ElSelect
        v-model="countyFilter"
        clearable
        filterable
        placeholder="All counties"
        style="width: 200px"
        @change="reload"
      >
        <ElOption
          v-for="c in countyOptions"
          :key="c.value"
          :label="c.label"
          :value="c.value"
        />
      </ElSelect>
      <ElButton :icon="Refresh" :loading="loading" @click="reload">Refresh</ElButton>
    </div>

    <ElTable v-loading="loading" :data="rows" stripe border style="width: 100%">
      <ElTableColumn prop="id" label="ID" width="72" />
      <ElTableColumn prop="name" label="Settlement" min-width="180" show-overflow-tooltip />
      <ElTableColumn prop="county_name" label="County" min-width="120" show-overflow-tooltip />
      <ElTableColumn label="Issue" width="140">
        <template #default="{ row }">
          <ElTag :type="issueTagType(row.issue)" size="small">{{ issueLabel(row.issue) }}</ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="geometry_type" label="Geom type" width="130">
        <template #default="{ row }">{{ row.geometry_type || '—' }}</template>
      </ElTableColumn>
      <ElTableColumn label="" width="100" fixed="right">
        <template #default="{ row }">
          <ElButton type="primary" link size="small" @click="openSettlement(row.id)">
            Open
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <div class="pagination-bar">
      <ElPagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[25, 50, 100, 200]"
        layout="total, sizes, prev, pager, next"
        background
        @change="loadRows"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh } from '@element-plus/icons-vue'
import {
  ElAlert,
  ElButton,
  ElInput,
  ElOption,
  ElPagination,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
  ElMessage
} from 'element-plus'
import { getSettlementGeometryCleanup, type SettlementGeometryIssueRow } from '@/api/settings'
import { getCountyListApi } from '@/api/counties'

type IssueFilter = 'all' | 'no_boundary' | 'point' | 'invalid'

const router = useRouter()

const loading = ref(false)
const rows = ref<SettlementGeometryIssueRow[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(50)
const issueFilter = ref<IssueFilter>('all')
const search = ref('')
const countyFilter = ref<number | undefined>()

const summary = ref({
  total_settlements: 0,
  no_boundary: 0,
  point: 0,
  invalid: 0
})

const countyOptions = ref<{ value: number; label: string }[]>([])

const summaryCards = computed(() => [
  { key: 'all' as IssueFilter, label: 'All issues', count: issueTotal.value },
  { key: 'no_boundary' as IssueFilter, label: 'No boundary', count: summary.value.no_boundary },
  { key: 'point' as IssueFilter, label: 'Point geometry', count: summary.value.point },
  { key: 'invalid' as IssueFilter, label: 'Invalid geometry', count: summary.value.invalid }
])

const issueTotal = computed(
  () => summary.value.no_boundary + summary.value.point + summary.value.invalid
)

let searchTimer: ReturnType<typeof setTimeout>

const issueLabel = (issue: string) => {
  const map: Record<string, string> = {
    no_boundary: 'No boundary',
    point: 'Point',
    invalid: 'Invalid'
  }
  return map[issue] || issue
}

const issueTagType = (issue: string) => {
  if (issue === 'invalid') return 'danger'
  if (issue === 'point') return 'warning'
  return 'info'
}

const setIssueFilter = (key: IssueFilter) => {
  issueFilter.value = key
  page.value = 1
  void loadRows()
}

const onSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    void loadRows()
  }, 320)
}

const loadCounties = async () => {
  try {
    const res: any = await getCountyListApi({
      params: {
        pageIndex: 1,
        limit: 200,
        curUser: 1,
        model: 'county',
        searchField: 'name',
        searchKeyword: '',
        sort: 'ASC'
      }
    })
    const list = res?.data || []
    countyOptions.value = list
      .map((c: any) => ({ value: Number(c.id), label: String(c.name) }))
      .sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label))
  } catch {
    countyOptions.value = []
  }
}

const loadRows = async () => {
  loading.value = true
  try {
    const res = await getSettlementGeometryCleanup({
      issue: issueFilter.value,
      page: page.value,
      limit: pageSize.value,
      county_id: countyFilter.value ?? undefined,
      search: search.value.trim() || undefined
    })
    if (res.code === '0000') {
      summary.value = res.data.summary
      rows.value = res.data.rows || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.message || 'Failed to load settlement geometry issues')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || 'Failed to load settlement geometry issues')
  } finally {
    loading.value = false
  }
}

const reload = () => {
  page.value = 1
  void loadRows()
}

const openSettlement = (id: number) => {
  router.push(`/data/settlement/${id}`)
}

onMounted(() => {
  void loadCounties()
  void loadRows()
})
</script>

<style scoped>
.settlement-geom-cleanup {
  max-width: 960px;
}

.intro-alert {
  margin-bottom: 16px;
}

.summary-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .summary-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.summary-card {
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.summary-card:hover {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-fill-color-light);
}

.summary-card--active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.summary-count {
  display: block;
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.2;
}

.summary-label {
  font-size: 0.78rem;
  color: var(--el-text-color-secondary);
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.pagination-bar {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
