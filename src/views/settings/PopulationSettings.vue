<template>
  <div class="population-settings-container">
    <ElCard class="settings-card">
      <template #header>
        <div class="card-header">
          <h2 class="header-title">Population Settings</h2>
        </div>
      </template>

      <div class="settings-content">
        <ElTabs v-model="activeTab" type="card" class="population-tabs">

          <!-- 1. Bulk Population Update -->
          <ElTabPane label="Bulk Population Update" name="bulk">
            <div class="bulk-update-section">
              <p class="section-desc">
                Estimate population for settlements using the building-based population service.
                Each settlement's boundary is sent to the service to count buildings and estimate population.
              </p>

              <div class="bulk-options">
                <div class="bulk-options-row">
                  <div class="bulk-option-group">
                    <p class="option-label">County</p>
                    <ElSelect v-model="bulkCountyId" placeholder="All counties" clearable filterable style="width: 280px">
                      <ElOption label="All counties" :value="null" />
                      <ElOption v-for="c in countyOptions" :key="c.value" :label="c.label" :value="c.value" />
                    </ElSelect>
                  </div>

                  <div class="bulk-option-group">
                    <p class="option-label">Scope</p>
                    <ElRadioGroup v-model="bulkScope">
                      <ElRadio label="missing">Without population only</ElRadio>
                      <ElRadio label="all" :disabled="!isRootAdmin">All (overwrite existing)</ElRadio>
                    </ElRadioGroup>
                  </div>
                </div>

                <div class="bulk-actions-row">
                  <ElButton
                    type="primary"
                    :loading="bulkRunning"
                    :disabled="bulkRunning"
                    style="width: 50%"
                    @click="startBulkUpdate"
                  >
                    {{ bulkRunning ? 'Updating...' : 'Start Bulk Update' }}
                  </ElButton>
                  <ElButton
                    type="danger"
                    plain
                    :disabled="!bulkRunning"
                    style="width: 50%"
                    @click="bulkCancelled = true"
                  >
                    Cancel
                  </ElButton>
                </div>
              </div>

              <div v-if="bulkTotal > 0" class="bulk-progress">
                <div class="progress-header">
                  <span class="progress-label">
                    {{ bulkDone }} / {{ bulkTotal }} settlements — {{ bulkPercent }}%
                    <ElTag v-if="bulkSkipped > 0" type="info" size="small" style="margin-left:8px">{{ bulkSkipped }} skipped</ElTag>
                    <ElTag v-if="bulkErrors > 0" type="danger" size="small" style="margin-left:4px">{{ bulkErrors }} errors</ElTag>
                  </span>
                  <span v-if="!bulkRunning && bulkDone > 0" class="progress-done-label">Done</span>
                </div>
                <ElProgress :percentage="bulkPercent" :status="bulkProgressStatus" striped :striped-flow="bulkRunning" :duration="6" />
                <div class="log-toolbar">
                  <ElButton size="small" plain @click="copyLog" :disabled="bulkLog.length === 0">
                    {{ copied ? '✓ Copied' : 'Copy to clipboard' }}
                  </ElButton>
                </div>
                <div class="bulk-log" ref="bulkLogRef">
                  <div
                    v-for="(entry, i) in bulkLog"
                    :key="i"
                    :class="['log-entry', `log-${entry.status}`]"
                  >
                    <span class="log-icon">{{ entry.status === 'ok' ? '✓' : entry.status === 'skip' ? '–' : '✗' }}</span>
                    <span class="log-name">{{ entry.name }}</span>
                    <span class="log-msg">{{ entry.msg }}</span>
                  </div>
                </div>
              </div>
            </div>
          </ElTabPane>

          <!-- 2b. Household size from survey data -->
          <ElTabPane label="Household size (surveys)" name="hhavg">
            <div class="bulk-update-section">
              <p class="section-desc">
                Derive <strong>average household size</strong> from surveyed household records (<code>hh_size</code>) for a settlement.
                Survey lists are typically a <em>sample</em> — only <strong>average household size</strong> is written to the settlement; <strong>number of households</strong> is not changed.
              </p>

              <ElTabs v-model="hhSurveySubTab" class="hh-survey-subtabs">
                <ElTabPane label="Single settlement" name="single">
                  <div class="bulk-options">
                    <div class="bulk-options-row">
                      <div class="bulk-option-group hh-survey-settlement-field">
                        <p class="option-label">Settlement</p>
                        <ElSelect
                          v-model="hhSettlementId"
                          filterable
                          remote
                          clearable
                          reserve-keyword
                          placeholder="Type to search by name"
                          :remote-method="searchHhSettlement"
                          :loading="hhSettLoading"
                          style="width: 100%"
                          @change="onHhSettlementPicked"
                        >
                          <ElOption
                            v-for="s in hhSettOptions"
                            :key="s.id"
                            :label="formatHhSettlementLabel(s)"
                            :value="s.id"
                          />
                        </ElSelect>
                      </div>
                    </div>

                    <div v-if="hhSettMeta" class="hh-survey-meta">
                      <div><span class="meta-k">Name</span> {{ hhSettMeta.name || '—' }}</div>
                      <div>
                        <span class="meta-k">Stored avg. HH size</span>
                        {{ hhSettMeta.avg_household_size != null ? Number(hhSettMeta.avg_household_size).toFixed(2) : '—' }}
                      </div>
                      <div>
                        <span class="meta-k">Stored num. households</span>
                        {{ hhSettMeta.num_households != null ? hhSettMeta.num_households : '—' }}
                        <span class="muted"> (not updated from surveys)</span>
                      </div>
                    </div>

                    <div v-if="hhSurveyTotal != null" class="hh-survey-computed">
                      <div>
                        <span class="meta-k">Survey records (sample)</span> {{ hhSurveyTotal }}
                      </div>
                      <div>
                        <span class="meta-k">Computed AVG(hh_size)</span>
                        <strong v-if="hhComputedAvg != null">{{ hhComputedAvg.toFixed(2) }}</strong>
                        <span v-else class="muted">— (no numeric hh_size values)</span>
                      </div>
                    </div>

                    <div class="bulk-actions-row">
                      <ElButton
                        type="primary"
                        plain
                        :loading="hhComputing"
                        :disabled="!hhSettlementId || hhComputing"
                        style="flex: 1"
                        @click="computeHhAvgFromSurveys"
                      >
                        {{ hhComputing ? 'Computing…' : 'Compute from surveys' }}
                      </ElButton>
                      <ElButton
                        type="primary"
                        :loading="hhSaving"
                        :disabled="!hhSettlementId || hhComputedAvg == null || hhSaving"
                        style="flex: 1"
                        @click="applyHhAvgToSettlement"
                      >
                        {{ hhSaving ? 'Saving…' : 'Update settlement' }}
                      </ElButton>
                    </div>
                  </div>
                </ElTabPane>

                <ElTabPane label="Bulk — all settlements" name="bulk">
                  <p class="section-desc section-desc--tab">
                    Computes AVG(<code>hh_size</code>) per settlement and updates <strong>average household size</strong> only (same county / scope pattern as bulk population).
                  </p>
                  <div class="bulk-options">
                    <div class="bulk-options-row">
                      <div class="bulk-option-group">
                        <p class="option-label">County</p>
                        <ElSelect v-model="hhBulkCountyId" placeholder="All counties" clearable filterable style="width: 280px">
                          <ElOption label="All counties" :value="null" />
                          <ElOption v-for="c in countyOptions" :key="c.value" :label="c.label" :value="c.value" />
                        </ElSelect>
                      </div>
                      <div class="bulk-option-group">
                        <p class="option-label">Scope</p>
                        <ElRadioGroup v-model="hhBulkScope">
                          <ElRadio label="missing">Without avg. HH size only</ElRadio>
                          <ElRadio label="all" :disabled="!isRootAdmin">All (overwrite existing)</ElRadio>
                        </ElRadioGroup>
                      </div>
                    </div>
                    <div class="bulk-actions-row">
                      <ElButton
                        type="primary"
                        :loading="hhBulkRunning"
                        :disabled="hhBulkRunning"
                        style="width: 50%"
                        @click="startHhBulkAvgUpdate"
                      >
                        {{ hhBulkRunning ? 'Updating…' : 'Start bulk update' }}
                      </ElButton>
                      <ElButton
                        type="danger"
                        plain
                        :disabled="!hhBulkRunning"
                        style="width: 50%"
                        @click="hhBulkCancelled = true"
                      >
                        Cancel
                      </ElButton>
                    </div>
                  </div>

                  <div v-if="hhBulkTotal > 0" class="bulk-progress">
                    <div class="progress-header">
                      <span class="progress-label">
                        {{ hhBulkDone }} / {{ hhBulkTotal }} settlements — {{ hhBulkPercent }}%
                        <ElTag v-if="hhBulkSkipped > 0" type="info" size="small" style="margin-left: 8px">{{ hhBulkSkipped }} skipped</ElTag>
                        <ElTag v-if="hhBulkErrors > 0" type="danger" size="small" style="margin-left: 4px">{{ hhBulkErrors }} errors</ElTag>
                      </span>
                      <span v-if="!hhBulkRunning && hhBulkDone > 0" class="progress-done-label">Done</span>
                    </div>
                    <ElProgress
                      :percentage="hhBulkPercent"
                      :status="hhBulkProgressStatus"
                      striped
                      :striped-flow="hhBulkRunning"
                      :duration="6"
                    />
                    <div class="log-toolbar">
                      <ElButton
                        size="small"
                        plain
                        :disabled="hhBulkLog.length === 0"
                        @click="downloadHhBulkLogCsv"
                      >
                        Download CSV
                      </ElButton>
                    </div>
                    <div class="hh-bulk-table-wrap">
                      <ElTable
                        :data="hhBulkLog"
                        stripe
                        border
                        size="small"
                        class="hh-bulk-table"
                        empty-text="Run a bulk update to see results here"
                        max-height="360"
                      >
                        <ElTableColumn prop="settlement_id" label="ID" width="72" align="right" />
                        <ElTableColumn prop="settlement_name" label="Settlement" min-width="140" show-overflow-tooltip />
                        <ElTableColumn prop="county" label="County" min-width="110" show-overflow-tooltip />
                        <ElTableColumn label="Result" width="88" align="center">
                          <template #default="{ row }">
                            <ElTag
                              size="small"
                              :type="row.status === 'ok' ? 'success' : row.status === 'skip' ? 'info' : 'danger'"
                              effect="plain"
                            >
                              {{ row.status }}
                            </ElTag>
                          </template>
                        </ElTableColumn>
                        <ElTableColumn label="Survey sample" width="114" align="right">
                          <template #default="{ row }">
                            <span v-if="row.sample_records != null">{{ row.sample_records }}</span>
                            <span v-else class="muted-cell">—</span>
                          </template>
                        </ElTableColumn>
                        <ElTableColumn label="Avg before" width="96" align="right">
                          <template #default="{ row }">
                            <span v-if="row.avg_before">{{ row.avg_before }}</span>
                            <span v-else class="muted-cell">—</span>
                          </template>
                        </ElTableColumn>
                        <ElTableColumn label="Avg after" width="88" align="right">
                          <template #default="{ row }">
                            <span v-if="row.avg_after">{{ row.avg_after }}</span>
                            <span v-else class="muted-cell">—</span>
                          </template>
                        </ElTableColumn>
                        <ElTableColumn prop="detail" label="Notes" min-width="200" show-overflow-tooltip />
                      </ElTable>
                    </div>
                  </div>
                </ElTabPane>
              </ElTabs>
            </div>
          </ElTabPane>

          <!-- 2. Persons per Building -->
          <ElTabPane label="Persons per Building" name="ppb">
            <div class="ppb-section">
              <p class="section-desc">
                Configure the default persons-per-building factor used when the population service does not return a county-level value.
              </p>
              <ElEmpty description="Coming soon" />
            </div>
          </ElTabPane>

          <!-- 3. Density Typology -->
          <ElTabPane label="Density Typology" name="density">
            <div class="bulk-update-section">
              <p class="section-desc">
                Auto-populate each settlement's density-based slum typology by aggregating
                its child <strong>structures</strong>. The built-up area
                (sum of structure footprints) is divided by the total settlement area
                to produce a built-up ratio (%), which is mapped to a category per the
                <em>National Slum Upgrading and Prevention Strategy 2024 - 2034</em>.
              </p>

              <div class="density-thresholds">
                <ElTag type="success" effect="plain">Low Density &lt; {{ densityLowMax }}%</ElTag>
                <ElTag type="warning" effect="plain">Medium Density {{ densityLowMax }}% - {{ densityMediumMax }}%</ElTag>
                <ElTag type="danger" effect="plain">High Density &gt; {{ densityMediumMax }}%</ElTag>
              </div>

              <div class="bulk-options">
                <div class="bulk-options-row">
                  <div class="bulk-option-group">
                    <p class="option-label">County</p>
                    <ElSelect v-model="densityCountyId" placeholder="All counties" clearable filterable style="width: 280px">
                      <ElOption label="All counties" value="" />
                      <ElOption v-for="c in countyOptions" :key="c.value" :label="c.label" :value="c.value" />
                    </ElSelect>
                  </div>

                  <div class="bulk-option-group">
                    <p class="option-label">Scope</p>
                    <ElRadioGroup v-model="densityScope">
                      <ElRadio label="missing">Without typology only</ElRadio>
                      <ElRadio label="all" :disabled="!isRootAdmin">All (overwrite existing)</ElRadio>
                    </ElRadioGroup>
                  </div>

                  <div class="bulk-option-group">
                    <p class="option-label">Thresholds (%)</p>
                    <div class="threshold-inputs">
                      <ElInputNumber
                        v-model="densityLowMax"
                        :min="1"
                        :max="densityMediumMax - 1"
                        :step="1"
                        size="default"
                        controls-position="right"
                        style="width: 110px"
                      />
                      <span class="threshold-sep">-</span>
                      <ElInputNumber
                        v-model="densityMediumMax"
                        :min="densityLowMax + 1"
                        :max="99"
                        :step="1"
                        size="default"
                        controls-position="right"
                        style="width: 110px"
                      />
                    </div>
                  </div>
                </div>

                <div class="bulk-actions-row">
                  <ElButton
                    type="primary"
                    plain
                    :loading="densityComputing"
                    :disabled="densityComputing || densityRunning"
                    style="flex: 1"
                    @click="computeDensityPreview"
                  >
                    {{ densityComputing ? 'Computing...' : 'Compute Preview' }}
                  </ElButton>
                  <ElButton
                    type="primary"
                    :loading="densityRunning"
                    :disabled="densityRunning || densityComputing || (densitySummary?.will_change ?? 0) === 0"
                    style="flex: 1"
                    @click="applyDensityTypology"
                  >
                    {{ densityRunning ? 'Applying...' : 'Apply to Settlements' }}
                  </ElButton>
                </div>
              </div>

              <!-- Summary banner -->
              <div v-if="densitySummary" class="density-summary">
                <div class="density-summary__row">
                  <div class="density-summary__stat">
                    <span class="stat-num">{{ densitySummary.total_evaluated }}</span>
                    <span class="stat-label">evaluated</span>
                  </div>
                  <div class="density-summary__stat">
                    <span class="stat-num stat-num--primary">{{ densitySummary.will_change }}</span>
                    <span class="stat-label">{{ densitySummary.updated != null ? 'updated' : 'will update' }}</span>
                  </div>
                  <div class="density-summary__stat">
                    <span class="stat-num">{{ densitySummary.unchanged }}</span>
                    <span class="stat-label">already correct</span>
                  </div>
                  <div class="density-summary__stat">
                    <span class="stat-num">{{ densitySummary.no_structures }}</span>
                    <span class="stat-label">no structures</span>
                  </div>
                  <div class="density-summary__breakdown">
                    <ElTag size="small" type="success">{{ densityCounts.LOW }} Low</ElTag>
                    <ElTag size="small" type="warning">{{ densityCounts.MEDIUM }} Medium</ElTag>
                    <ElTag size="small" type="danger">{{ densityCounts.HIGH }} High</ElTag>
                  </div>
                </div>
                <div v-if="densityLastApplyAt" class="density-summary__footer">
                  Last applied {{ densityLastApplyAt.toLocaleString() }}
                </div>
              </div>

              <!-- Preview / result table -->
              <div v-if="densityPreview.length > 0" class="density-preview">
                <ElTable
                  :data="densityPreview"
                  size="small"
                  border
                  stripe
                  height="360"
                  class="density-table"
                >
                  <ElTableColumn prop="name" label="Settlement" min-width="160" show-overflow-tooltip />
                  <ElTableColumn label="Structures" prop="structure_count" width="110" align="right" />
                  <ElTableColumn label="Built-up (Ha.)" width="130" align="right">
                    <template #default="{ row }">
                      {{ row.built_up_area_ha?.toFixed(2) ?? '—' }}
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="Total (Ha.)" width="120" align="right">
                    <template #default="{ row }">
                      {{ row.settlement_area_ha?.toFixed(2) ?? '—' }}
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="Built-up Ratio" width="140" align="right">
                    <template #default="{ row }">
                      <span v-if="row.built_up_ratio == null" class="muted">—</span>
                      <span v-else>{{ row.built_up_ratio.toFixed(2) }}%</span>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="Current" width="140">
                    <template #default="{ row }">
                      <span v-if="!row.current_typology" class="muted">—</span>
                      <ElTag v-else size="small" :type="typologyTagType(row.current_typology)" effect="plain">
                        {{ typologyShortLabel(row.current_typology) }}
                      </ElTag>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="New" width="140">
                    <template #default="{ row }">
                      <span v-if="!row.new_typology" class="muted">—</span>
                      <ElTag v-else size="small" :type="typologyTagType(row.new_typology)" effect="dark">
                        {{ typologyShortLabel(row.new_typology) }}
                      </ElTag>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="Status" width="110">
                    <template #default="{ row }">
                      <ElTag v-if="row.new_typology === null" size="small" type="info">skip</ElTag>
                      <ElTag v-else-if="row.current_typology === row.new_typology" size="small" type="info" effect="plain">unchanged</ElTag>
                      <ElTag v-else size="small" type="primary" effect="plain">{{ densityLastApplyAt ? 'updated' : 'will update' }}</ElTag>
                    </template>
                  </ElTableColumn>
                </ElTable>
              </div>
            </div>
          </ElTabPane>

        </ElTabs>
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import {
  ElCard,
  ElTabs,
  ElTabPane,
  ElButton,
  ElTag,
  ElEmpty,
  ElMessage,
  ElProgress,
  ElRadioGroup,
  ElRadio,
  ElSelect,
  ElOption,
  ElInputNumber,
  ElTable,
  ElTableColumn
} from 'element-plus'
import {
  getSettlementListByCounty,
  updateOneRecord,
  applySettlementDensityTypology,
  searchByKeyWord,
  getOneSettlement,
  type DensityTypologyComputeRow,
  type DensityTypologySummary
} from '@/api/settlements'
import { getFilteredHouseholdsByColumn } from '@/api/households'
import { getListWithoutGeo } from '@/api/counties'
import { getSummarybyFieldFromMultipleIncludes } from '@/api/summary'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'

const activeTab = ref('bulk')
const hhSurveySubTab = ref<'single' | 'bulk'>('single')

// ── Auth ─────────────────────────────────────────────────────────────────────
const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)

const isRootAdmin = computed(() =>
  userInfo?.roles?.some((role: any) => role.name === 'root_admin') || false
)

// ── Counties ─────────────────────────────────────────────────────────────────

const countyOptions = ref<{ label: string; value: any }[]>([])
const bulkCountyId = ref<any>(null)

const loadCounties = async () => {
  const res = await getListWithoutGeo({
    params: { pageIndex: 1, limit: 100, curUser: 1, model: 'county', searchField: '', searchKeyword: '', sort: 'ASC' }
  })
  countyOptions.value = (res?.data || []).map((c: any) => ({ label: c.name, value: c.id }))
}

// ── Bulk Population Update ───────────────────────────────────────────────────

const bulkScope = ref<'missing' | 'all'>('missing')
const bulkRunning = ref(false)
const bulkCancelled = ref(false)
const bulkTotal = ref(0)
const bulkDone = ref(0)
const bulkSkipped = ref(0)
const bulkErrors = ref(0)
const bulkLog = ref<{ name: string; status: 'ok' | 'skip' | 'error'; msg: string }[]>([])
const bulkLogRef = ref<HTMLElement | null>(null)

const bulkPercent = computed(() =>
  bulkTotal.value > 0 ? Math.round((bulkDone.value / bulkTotal.value) * 100) : 0
)
const bulkProgressStatus = computed(() => {
  if (bulkRunning.value) return ''
  if (bulkErrors.value > 0) return 'warning'
  if (bulkDone.value === bulkTotal.value && bulkTotal.value > 0) return 'success'
  return ''
})

const startBulkUpdate = async () => {
  bulkRunning.value = true
  bulkCancelled.value = false
  bulkTotal.value = 0
  bulkDone.value = 0
  bulkSkipped.value = 0
  bulkErrors.value = 0
  bulkLog.value = []

  try {
    const formData: any = {
      model: 'settlement',
      curUser: 1,
      searchField: 'name',
      searchKeyword: '',
      returnAll: true,
      excludeGeom: false,
      filters: bulkCountyId.value ? ['county_id'] : [],
      filterValues: bulkCountyId.value ? [[bulkCountyId.value]] : []
    }

    const res = await getSettlementListByCounty(formData)
    const all: any[] = res?.data || []

    const settlements = bulkScope.value === 'missing'
      ? all.filter((s: any) => !s.population || s.population === 0)
      : all

    bulkTotal.value = settlements.length

    if (settlements.length === 0) {
      ElMessage.info('No settlements match the selected scope.')
      bulkRunning.value = false
      return
    }

    // Build a cached per-ward avg household size using the same summary pattern as National.vue
    const wardHhSizeMap = new Map<number, number | null>()
    const getWardAvgHhSize = async (wardId: number): Promise<number | null> => {
      if (wardHhSizeMap.has(wardId)) return wardHhSizeMap.get(wardId)!
      try {
        const res = await getSummarybyFieldFromMultipleIncludes({
          model: 'households',
          summaryField: 'households.hh_size',
          summaryFunction: 'AVG',
          assoc_models: [],
          groupFields: [],
          filterField: ['ward_id'],
          filterValue: [[wardId]],
          filterOperator: ['or']
        })
        const avg = res?.Total?.[0]?.AVG
        const val = avg != null ? parseFloat(avg) : null
        wardHhSizeMap.set(wardId, val)
        return val
      } catch {
        wardHhSizeMap.set(wardId, null)
        return null
      }
    }

    for (const settlement of settlements) {
      if (bulkCancelled.value) break

      let geom = settlement.geom
      if (!geom) {
        bulkLog.value.push({ name: settlement.name || `ID ${settlement.id}`, status: 'skip', msg: 'No geometry' })
        bulkSkipped.value++
        bulkDone.value++
        await scrollLog()
        continue
      }

      // geom may come back from the API as a JSON string — parse it
      if (typeof geom === 'string') {
        try { geom = JSON.parse(geom) } catch {
          bulkLog.value.push({ name: settlement.name || `ID ${settlement.id}`, status: 'skip', msg: 'Invalid geometry' })
          bulkSkipped.value++
          bulkDone.value++
          await scrollLog()
          continue
        }
      }

      try {
        // Service accepts plain geometry, Feature, or FeatureCollection
        const body = (geom.type === 'Feature' || geom.type === 'FeatureCollection')
          ? geom
          : { type: 'Feature', geometry: geom }
        const wardHhSize = settlement.ward_id ? await getWardAvgHhSize(settlement.ward_id) : null
        const url = new URL('https://kesmis.go.ke/estimate_population')
        if (wardHhSize != null) {
          url.searchParams.set('persons_per_building', String(wardHhSize))
        }
        const popRes = await fetch(url.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })

        if (!popRes.ok) throw new Error(`HTTP ${popRes.status}`)

        const data = await popRes.json()
        if (data?.estimated_population == null) throw new Error('No estimate returned')

        if (!data.buildings || data.buildings === 0) {
          bulkLog.value.push({ name: settlement.name || `ID ${settlement.id}`, status: 'skip', msg: '0 buildings detected — skipped' })
          bulkSkipped.value++
          bulkDone.value++
          await scrollLog()
          continue
        }

        const before = settlement.population || 0
        const population = Math.round(data.estimated_population / 100) * 100
        await updateOneRecord({ id: settlement.id, model: 'settlement', population } as any, { silent: true })

        bulkLog.value.push({
          name: settlement.name || `ID ${settlement.id}`,
          status: 'ok',
          msg: `${before.toLocaleString()} → ${population.toLocaleString()} (${data.buildings} buildings × ${Number(data.persons_per_building).toFixed(2)} avg HH size)`
        })
      } catch (e: any) {
        bulkLog.value.push({ name: settlement.name || `ID ${settlement.id}`, status: 'error', msg: e?.message || 'Failed' })
        bulkErrors.value++
      }

      bulkDone.value++
      await scrollLog()
    }

    if (!bulkCancelled.value) {
      ElMessage.success(`Bulk update complete: ${bulkDone.value - bulkErrors.value - bulkSkipped.value} updated, ${bulkSkipped.value} skipped, ${bulkErrors.value} errors.`)
    } else {
      ElMessage.warning('Bulk update cancelled.')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || 'Failed to load settlements')
  } finally {
    bulkRunning.value = false
  }
}

const scrollLog = async () => {
  await nextTick()
  if (bulkLogRef.value) bulkLogRef.value.scrollTop = bulkLogRef.value.scrollHeight
}

const copied = ref(false)
const copyLog = async () => {
  const text = bulkLog.value
    .map(e => `${e.status === 'ok' ? '✓' : e.status === 'skip' ? '–' : '✗'} ${e.name}  ${e.msg}`)
    .join('\n')
  await navigator.clipboard.writeText(text)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

// ── Household size from survey (per settlement) ─────────────────────────────

const hhSettlementId = ref<number | null>(null)
const hhSettOptions = ref<any[]>([])
const hhSettLoading = ref(false)
const hhSettMeta = ref<{ name?: string; avg_household_size?: number | null; num_households?: number | null } | null>(null)
const hhSurveyTotal = ref<number | null>(null)
const hhComputedAvg = ref<number | null>(null)
const hhComputing = ref(false)
const hhSaving = ref(false)

const hhBulkCountyId = ref<any>(null)
const hhBulkScope = ref<'missing' | 'all'>('missing')
const hhBulkRunning = ref(false)
const hhBulkCancelled = ref(false)
const hhBulkTotal = ref(0)
const hhBulkDone = ref(0)
const hhBulkSkipped = ref(0)
const hhBulkErrors = ref(0)
type HhBulkLogRow = {
  settlement_id: number
  settlement_name: string
  county: string
  status: 'ok' | 'skip' | 'error'
  sample_records: number | null
  avg_before: string
  avg_after: string
  detail: string
}

const hhBulkLog = ref<HhBulkLogRow[]>([])

function hhSettlementCountyLabel(s: any): string {
  const name = s?.county?.name
  if (name) return String(name)
  if (s?.county_id != null && s?.county_id !== '') return String(s.county_id)
  return ''
}

function formatStoredAvgForRow(v: any): string {
  if (v == null || v === '') return ''
  const n = Number(v)
  return Number.isFinite(n) ? n.toFixed(2) : ''
}

function escapeCsvCell(val: string | number | null | undefined): string {
  if (val == null || val === '') return ''
  const s = String(val)
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

const hhBulkPercent = computed(() =>
  hhBulkTotal.value > 0 ? Math.round((hhBulkDone.value / hhBulkTotal.value) * 100) : 0
)
const hhBulkProgressStatus = computed(() => {
  if (hhBulkRunning.value) return ''
  if (hhBulkErrors.value > 0) return 'warning'
  if (hhBulkDone.value === hhBulkTotal.value && hhBulkTotal.value > 0) return 'success'
  return ''
})

function settlementMissingAvgHhSize(s: any): boolean {
  const v = s.avg_household_size
  if (v == null || v === '') return true
  const n = Number(v)
  return !Number.isFinite(n) || n === 0
}

async function fetchSurveyHhAvgForSettlement(settlementId: number): Promise<{ total: number; avg: number | null }> {
  const countRes: any = await getFilteredHouseholdsByColumn({
    limit: 1,
    page: 1,
    curUser: 1,
    model: 'households',
    searchField: '',
    searchKeyword: '',
    filters: ['settlement_id'],
    filterValues: [[settlementId]],
    associated_multiple_models: []
  } as any)
  const total = typeof countRes?.total === 'number' ? countRes.total : 0
  if (total === 0) return { total: 0, avg: null }

  const avgRes: any = await getSummarybyFieldFromMultipleIncludes({
    model: 'households',
    summaryField: 'households.hh_size',
    summaryFunction: 'AVG',
    assoc_models: [],
    groupFields: [],
    filterField: ['settlement_id'],
    filterValue: [[settlementId]],
    filterOperator: ['or']
  })
  const raw = avgRes?.Total?.[0]?.AVG
  if (raw == null || Number.isNaN(parseFloat(raw))) return { total, avg: null }
  return { total, avg: Math.round(parseFloat(raw) * 100) / 100 }
}

const formatHhSettlementLabel = (s: any) => {
  const county = s.county?.name || s.county_id
  const w = s.ward?.name
  const bits = [s.name, county ? String(county) : null, w].filter(Boolean)
  return `${bits.join(' · ')} (ID ${s.id})`
}

const searchHhSettlement = async (keyword: string) => {
  const q = (keyword || '').trim()
  if (q.length < 2) {
    hhSettOptions.value = []
    return
  }
  hhSettLoading.value = true
  try {
    const res: any = await searchByKeyWord({
      curUser: 1,
      model: 'settlement',
      searchField: 'name',
      searchKeyword: q,
      excludeGeom: true,
      excludeGeomAssoc: true,
      associated_multiple_models: ['county', 'subcounty', 'ward']
    } as any)
    hhSettOptions.value = res?.data || []
  } catch {
    hhSettOptions.value = []
  } finally {
    hhSettLoading.value = false
  }
}

const loadHhSettlementMeta = async () => {
  if (!hhSettlementId.value) {
    hhSettMeta.value = null
    return
  }
  try {
    const res: any = await getOneSettlement({ model: 'settlement', id: String(hhSettlementId.value) } as any)
    const d = res?.data
    hhSettMeta.value = d
      ? {
          name: d.name,
          avg_household_size: d.avg_household_size,
          num_households: d.num_households
        }
      : null
  } catch {
    hhSettMeta.value = null
  }
}

const onHhSettlementPicked = async () => {
  hhSurveyTotal.value = null
  hhComputedAvg.value = null
  await loadHhSettlementMeta()
}

const computeHhAvgFromSurveys = async () => {
  if (!hhSettlementId.value) return
  hhComputing.value = true
  hhSurveyTotal.value = null
  hhComputedAvg.value = null
  try {
    const { total, avg } = await fetchSurveyHhAvgForSettlement(hhSettlementId.value)
    hhSurveyTotal.value = total
    if (total === 0) {
      ElMessage.info('No household survey records for this settlement.')
      return
    }
    if (avg == null) {
      hhComputedAvg.value = null
      ElMessage.warning('Could not compute average — check that hh_size is populated on household records.')
      return
    }
    hhComputedAvg.value = avg
    ElMessage.success(`Average household size: ${avg.toFixed(2)} (${total} sample records).`)
  } catch (e: any) {
    ElMessage.error(e?.message || 'Failed to compute household statistics')
  } finally {
    hhComputing.value = false
  }
}

const applyHhAvgToSettlement = async () => {
  if (!hhSettlementId.value || hhComputedAvg.value == null) return
  hhSaving.value = true
  try {
    await updateOneRecord(
      {
        id: hhSettlementId.value,
        model: 'settlement',
        avg_household_size: hhComputedAvg.value
      } as any,
      { silent: true }
    )
    ElMessage.success('Settlement updated with average household size (number of households unchanged).')
    await loadHhSettlementMeta()
  } catch (e: any) {
    ElMessage.error(e?.message || 'Failed to update settlement')
  } finally {
    hhSaving.value = false
  }
}

const downloadHhBulkLogCsv = () => {
  const header = [
    'settlement_id',
    'settlement_name',
    'county',
    'status',
    'survey_sample_count',
    'avg_before',
    'avg_after',
    'notes'
  ]
  const lines = [
    header.join(','),
    ...hhBulkLog.value.map(r =>
      [
        escapeCsvCell(r.settlement_id),
        escapeCsvCell(r.settlement_name),
        escapeCsvCell(r.county),
        escapeCsvCell(r.status),
        escapeCsvCell(r.sample_records),
        escapeCsvCell(r.avg_before),
        escapeCsvCell(r.avg_after),
        escapeCsvCell(r.detail)
      ].join(',')
    )
  ]
  const text = `\uFEFF${lines.join('\r\n')}`
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  a.download = `household-size-survey-bulk-${stamp}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const startHhBulkAvgUpdate = async () => {
  hhBulkRunning.value = true
  hhBulkCancelled.value = false
  hhBulkTotal.value = 0
  hhBulkDone.value = 0
  hhBulkSkipped.value = 0
  hhBulkErrors.value = 0
  hhBulkLog.value = []

  try {
    const formData: any = {
      model: 'settlement',
      curUser: 1,
      searchField: 'name',
      searchKeyword: '',
      returnAll: true,
      excludeGeom: true,
      filters: hhBulkCountyId.value ? ['county_id'] : [],
      filterValues: hhBulkCountyId.value ? [[hhBulkCountyId.value]] : []
    }

    const res = await getSettlementListByCounty(formData)
    const all: any[] = res?.data || []

    const settlements =
      hhBulkScope.value === 'missing'
        ? all.filter((s: any) => settlementMissingAvgHhSize(s))
        : all

    hhBulkTotal.value = settlements.length

    if (settlements.length === 0) {
      ElMessage.info('No settlements match the selected scope.')
      hhBulkRunning.value = false
      return
    }

    for (const settlement of settlements) {
      if (hhBulkCancelled.value) break

      const sid = settlement.id
      const label = settlement.name || `ID ${sid}`
      const county = hhSettlementCountyLabel(settlement)
      const beforeStored = formatStoredAvgForRow(settlement.avg_household_size)

      try {
        const { total, avg } = await fetchSurveyHhAvgForSettlement(sid)

        if (total === 0) {
          hhBulkLog.value.push({
            settlement_id: sid,
            settlement_name: label,
            county,
            status: 'skip',
            sample_records: 0,
            avg_before: beforeStored,
            avg_after: '',
            detail: 'No household survey records'
          })
          hhBulkSkipped.value++
        } else if (avg == null) {
          hhBulkLog.value.push({
            settlement_id: sid,
            settlement_name: label,
            county,
            status: 'skip',
            sample_records: total,
            avg_before: beforeStored,
            avg_after: '',
            detail: 'No usable hh_size values'
          })
          hhBulkSkipped.value++
        } else {
          await updateOneRecord(
            { id: sid, model: 'settlement', avg_household_size: avg } as any,
            { silent: true }
          )
          hhBulkLog.value.push({
            settlement_id: sid,
            settlement_name: label,
            county,
            status: 'ok',
            sample_records: total,
            avg_before: beforeStored,
            avg_after: avg.toFixed(2),
            detail: 'avg_household_size updated from survey sample (num_households unchanged)'
          })
        }
      } catch (e: any) {
        hhBulkLog.value.push({
          settlement_id: sid,
          settlement_name: label,
          county,
          status: 'error',
          sample_records: null,
          avg_before: beforeStored,
          avg_after: '',
          detail: e?.message || 'Failed'
        })
        hhBulkErrors.value++
      }

      hhBulkDone.value++
    }

    if (!hhBulkCancelled.value) {
      ElMessage.success(
        `Bulk complete: ${hhBulkDone.value - hhBulkErrors.value - hhBulkSkipped.value} updated, ${hhBulkSkipped.value} skipped, ${hhBulkErrors.value} errors.`
      )
    } else {
      ElMessage.warning('Bulk update cancelled.')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || 'Failed to load settlements')
  } finally {
    hhBulkRunning.value = false
  }
}

// ── Density Typology auto-populate ───────────────────────────────────────────
// All heavy lifting (PostGIS aggregate, ratio derivation, bulk UPDATE, bulk
// history insert) happens server-side in one transaction. The browser only
// makes a single round-trip per action.
//
// Categories per the National Slum Upgrading and Prevention Strategy 2024-2034:
//   built-up ratio < 60%      -> LOW DENSITY   (defaults editable)
//   built-up ratio 60% - 80%  -> MEDIUM DENSITY
//   built-up ratio > 80%      -> HIGH DENSITY

const densityCountyId = ref<any>(null)
const densityScope = ref<'missing' | 'all'>('missing')
const densityLowMax = ref<number>(60)
const densityMediumMax = ref<number>(80)

const densityComputing = ref(false)
const densityRunning = ref(false)
const densityPreview = ref<DensityTypologyComputeRow[]>([])
const densitySummary = ref<DensityTypologySummary | null>(null)
const densityLastApplyAt = ref<Date | null>(null)

const densityCounts = computed(
  () => densitySummary.value?.by_new_typology ?? { LOW: 0, MEDIUM: 0, HIGH: 0, NONE: 0 }
)

const typologyTagType = (typology: string | null | undefined): 'success' | 'warning' | 'danger' | 'info' => {
  if (typology === 'LOW DENSITY') return 'success'
  if (typology === 'MEDIUM DENSITY') return 'warning'
  if (typology === 'HIGH DENSITY') return 'danger'
  return 'info'
}

const typologyShortLabel = (typology: string | null | undefined): string => {
  if (typology === 'LOW DENSITY') return 'Low'
  if (typology === 'MEDIUM DENSITY') return 'Medium'
  if (typology === 'HIGH DENSITY') return 'High'
  return typology || '—'
}

// One round-trip: backend does the full pipeline (compute → bulk UPDATE →
// bulk history insert) in a single transaction. `dry_run` toggles preview
// vs. persist.
const callDensityTypologyApi = async (dryRun: boolean) => {
  const res = await applySettlementDensityTypology({
    county_id: densityCountyId.value || null,
    scope: densityScope.value,
    low_threshold: densityLowMax.value,
    medium_threshold: densityMediumMax.value,
    dry_run: dryRun
  })

  if (res.code !== '0000') {
    throw new Error(res.message || 'Density typology operation failed')
  }

  densityPreview.value = res.data || []
  densitySummary.value = res.summary || null
  return res
}

const computeDensityPreview = async () => {
  densityComputing.value = true
  densityPreview.value = []
  densitySummary.value = null

  try {
    const res = await callDensityTypologyApi(true)
    if (res.data.length === 0) {
      ElMessage.info('No settlements match the selected scope.')
    } else {
      ElMessage.success(`Computed typology for ${res.data.length} settlement(s).`)
    }
  } catch (e: any) {
    ElMessage.error(e?.message || 'Failed to compute density typology')
  } finally {
    densityComputing.value = false
  }
}

const applyDensityTypology = async () => {
  if (densityPreview.value.length === 0) {
    ElMessage.info('Run “Compute Preview” first.')
    return
  }
  if ((densitySummary.value?.will_change ?? 0) === 0) {
    ElMessage.info('Nothing to apply — every settlement already matches its computed typology.')
    return
  }

  densityRunning.value = true
  try {
    const res = await callDensityTypologyApi(false)
    densityLastApplyAt.value = new Date()
    const updated = res.summary?.updated ?? 0
    if (updated > 0) {
      ElMessage.success(`Density typology updated for ${updated} settlement(s).`)
    } else {
      ElMessage.info('No settlements needed updating.')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || 'Failed to apply density typology')
  } finally {
    densityRunning.value = false
  }
}

// ────────────────────────────────────────────────────────────────────────────

onMounted(() => {
  loadCounties()
})
</script>

<style scoped lang="less">
.population-settings-container {
  padding: 0;
}

.settings-card {
  width: 100%;
}

.card-header {
  .header-title {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: #303133;
  }
}

.settings-content {
  min-height: 200px;

  :deep(.population-tabs > .el-tabs__content) {
    padding: 24px 0 0 0;
  }
}

.section-desc {
  margin: 0 0 20px 0;
  color: #909399;
  font-size: 13px;
}

.section-desc--tab {
  margin-top: 0;
  margin-bottom: 16px;
}

.hh-survey-subtabs {
  :deep(.el-tabs__header) {
    margin-bottom: 12px;
  }
}

.hh-survey-settlement-field {
  flex: 1;
  min-width: 280px;
  max-width: 640px;
}

.bulk-update-section,
.ppb-section {
  width: 100%;
}

.bulk-options {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 28px;
}

.bulk-options-row {
  display: flex;
  align-items: flex-start;
  gap: 40px;
  flex-wrap: wrap;
}

.bulk-actions-row {
  display: flex;
  gap: 12px;
  width: 100%;
}

.bulk-option-group {
  .option-label {
    margin: 0 0 8px 0;
    font-size: 13px;
    font-weight: 600;
    color: #303133;
  }
}

.bulk-progress {
  margin-top: 4px;

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    .progress-label {
      font-size: 13px;
      color: #606266;
    }

    .progress-done-label {
      font-size: 13px;
      font-weight: 600;
      color: #67c23a;
    }
  }
}

.log-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.hh-bulk-table-wrap {
  margin-top: 8px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  background: var(--el-bg-color, #fff);
}

.hh-bulk-table {
  width: 100%;

  .muted-cell {
    color: #c0c4cc;
  }
}

.bulk-log {
  margin-top: 6px;
  height: 140px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fafafa;
  font-size: 12px;
  font-family: monospace;

  .log-entry {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 4px 10px;
    border-bottom: 1px solid #f0f0f0;

    &:last-child { border-bottom: none; }

    &.log-ok    { color: #67c23a; }
    &.log-skip  { color: #909399; }
    &.log-error { color: #f56c6c; }

    .log-icon  { width: 12px; flex-shrink: 0; }
    .log-name  { font-weight: 600; color: #303133; min-width: 180px; }
    .log-msg   { color: inherit; }
  }
}

.density-thresholds {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.threshold-inputs {
  display: flex;
  align-items: center;
  gap: 8px;

  .threshold-sep {
    color: #909399;
    font-size: 13px;
    user-select: none;
  }
}

.density-summary {
  margin-top: 8px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--el-fill-color-lighter, #f5f7fa);
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  border-radius: 8px;

  &__row {
    display: flex;
    align-items: center;
    gap: 28px;
    flex-wrap: wrap;
  }

  &__stat {
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    .stat-num {
      font-size: 22px;
      font-weight: 600;
      color: var(--el-text-color-primary, #303133);
      line-height: 1;

      &--primary { color: var(--el-color-primary, #409eff); }
    }

    .stat-label {
      margin-top: 4px;
      font-size: 12px;
      color: var(--el-text-color-secondary, #909399);
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
  }

  &__breakdown {
    display: flex;
    gap: 6px;
    margin-left: auto;
    flex-wrap: wrap;
  }

  &__footer {
    margin-top: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary, #909399);
  }
}

.density-preview {
  margin-top: 8px;
  margin-bottom: 20px;

  .density-table {
    width: 100%;

    .muted {
      color: #c0c4cc;
    }
  }
}

.hh-survey-meta,
.hh-survey-computed {
  margin: 16px 0;
  padding: 12px 16px;
  background: var(--el-fill-color-lighter, #f5f7fa);
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: #606266;

  .meta-k {
    display: inline-block;
    min-width: 160px;
    font-weight: 600;
    color: #303133;
  }
}

.hh-survey-computed .muted {
  color: #909399;
}
</style>
