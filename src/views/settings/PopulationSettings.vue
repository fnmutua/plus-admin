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
                    :disabled="densityRunning || densityComputing || densityPreview.length === 0"
                    style="flex: 1"
                    @click="applyDensityTypology"
                  >
                    {{ densityRunning ? 'Applying...' : 'Apply to Settlements' }}
                  </ElButton>
                  <ElButton
                    type="danger"
                    plain
                    :disabled="!densityRunning"
                    style="flex: 1"
                    @click="densityCancelled = true"
                  >
                    Cancel
                  </ElButton>
                </div>
              </div>

              <!-- Preview table -->
              <div v-if="densityPreview.length > 0" class="density-preview">
                <div class="preview-header">
                  <span class="preview-summary">
                    {{ densityPreview.length }} settlement{{ densityPreview.length === 1 ? '' : 's' }} —
                    <ElTag size="small" type="success">{{ densityCounts.LOW }} Low</ElTag>
                    <ElTag size="small" type="warning" style="margin-left:4px">{{ densityCounts.MEDIUM }} Medium</ElTag>
                    <ElTag size="small" type="danger" style="margin-left:4px">{{ densityCounts.HIGH }} High</ElTag>
                    <ElTag size="small" type="info" style="margin-left:4px">{{ densityCounts.NONE }} no structures</ElTag>
                  </span>
                </div>

                <ElTable
                  :data="densityPreview"
                  size="small"
                  border
                  stripe
                  height="320"
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
                  <ElTableColumn label="Status" width="100">
                    <template #default="{ row }">
                      <ElTag v-if="row.new_typology === null" size="small" type="info">skip</ElTag>
                      <ElTag v-else-if="row.current_typology === row.new_typology" size="small" type="info" effect="plain">unchanged</ElTag>
                      <ElTag v-else size="small" type="primary" effect="plain">will update</ElTag>
                    </template>
                  </ElTableColumn>
                </ElTable>
              </div>

              <!-- Progress + log (apply phase) -->
              <div v-if="densityTotal > 0" class="bulk-progress">
                <div class="progress-header">
                  <span class="progress-label">
                    {{ densityDone }} / {{ densityTotal }} settlements — {{ densityPercent }}%
                    <ElTag v-if="densitySkipped > 0" type="info" size="small" style="margin-left:8px">{{ densitySkipped }} skipped</ElTag>
                    <ElTag v-if="densityErrors > 0" type="danger" size="small" style="margin-left:4px">{{ densityErrors }} errors</ElTag>
                  </span>
                  <span v-if="!densityRunning && densityDone > 0" class="progress-done-label">Done</span>
                </div>
                <ElProgress :percentage="densityPercent" :status="densityProgressStatus" striped :striped-flow="densityRunning" :duration="6" />
                <div class="log-toolbar">
                  <ElButton size="small" plain @click="copyDensityLog" :disabled="densityLog.length === 0">
                    {{ densityCopied ? '✓ Copied' : 'Copy to clipboard' }}
                  </ElButton>
                </div>
                <div class="bulk-log" ref="densityLogRef">
                  <div
                    v-for="(entry, i) in densityLog"
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
  computeSettlementDensityTypology,
  type DensityTypologyComputeRow
} from '@/api/settlements'
import { getListWithoutGeo } from '@/api/counties'
import { getSummarybyFieldFromMultipleIncludes } from '@/api/summary'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'

const activeTab = ref('bulk')

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

// ── Density Typology auto-populate ───────────────────────────────────────────
// Aggregates each settlement's child structures (built-up area) and divides
// by the settlement polygon area to derive a built-up ratio. The ratio is
// mapped to LOW / MEDIUM / HIGH DENSITY per the National Slum Upgrading and
// Prevention Strategy 2024 - 2034 (default thresholds 60% and 80%).

const densityCountyId = ref<any>(null)
const densityScope = ref<'missing' | 'all'>('missing')
const densityLowMax = ref<number>(60)
const densityMediumMax = ref<number>(80)

const densityComputing = ref(false)
const densityRunning = ref(false)
const densityCancelled = ref(false)
const densityPreview = ref<DensityTypologyComputeRow[]>([])

const densityTotal = ref(0)
const densityDone = ref(0)
const densitySkipped = ref(0)
const densityErrors = ref(0)
const densityLog = ref<{ name: string; status: 'ok' | 'skip' | 'error'; msg: string }[]>([])
const densityLogRef = ref<HTMLElement | null>(null)
const densityCopied = ref(false)

const densityPercent = computed(() =>
  densityTotal.value > 0 ? Math.round((densityDone.value / densityTotal.value) * 100) : 0
)
const densityProgressStatus = computed(() => {
  if (densityRunning.value) return ''
  if (densityErrors.value > 0) return 'warning'
  if (densityDone.value === densityTotal.value && densityTotal.value > 0) return 'success'
  return ''
})

const densityCounts = computed(() => {
  const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, NONE: 0 }
  for (const row of densityPreview.value) {
    if (row.new_typology === 'LOW DENSITY') counts.LOW++
    else if (row.new_typology === 'MEDIUM DENSITY') counts.MEDIUM++
    else if (row.new_typology === 'HIGH DENSITY') counts.HIGH++
    else counts.NONE++
  }
  return counts
})

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

const computeDensityPreview = async () => {
  densityComputing.value = true
  densityPreview.value = []
  densityTotal.value = 0
  densityDone.value = 0
  densitySkipped.value = 0
  densityErrors.value = 0
  densityLog.value = []

  try {
    const res = await computeSettlementDensityTypology({
      county_id: densityCountyId.value || null,
      scope: densityScope.value,
      low_threshold: densityLowMax.value,
      medium_threshold: densityMediumMax.value
    })

    if (res.code !== '0000') {
      ElMessage.error(res.message || 'Failed to compute density typology')
      return
    }

    densityPreview.value = res.data || []

    if (densityPreview.value.length === 0) {
      ElMessage.info('No settlements match the selected scope.')
    } else {
      ElMessage.success(`Computed typology for ${densityPreview.value.length} settlement(s).`)
    }
  } catch (e: any) {
    ElMessage.error(e?.message || 'Failed to compute density typology')
  } finally {
    densityComputing.value = false
  }
}

const applyDensityTypology = async () => {
  // Only persist rows that meaningfully change the field.
  const changes = densityPreview.value.filter(
    (row) => row.new_typology !== null && row.current_typology !== row.new_typology
  )
  const noopCount = densityPreview.value.length - changes.length

  if (changes.length === 0) {
    ElMessage.info('Nothing to apply — every settlement already matches its computed typology.')
    return
  }

  densityRunning.value = true
  densityCancelled.value = false
  densityTotal.value = changes.length
  densityDone.value = 0
  densitySkipped.value = noopCount
  densityErrors.value = 0
  densityLog.value = []

  try {
    for (const row of changes) {
      if (densityCancelled.value) break

      try {
        await updateOneRecord(
          { id: row.id, model: 'settlement', density_typology: row.new_typology } as any,
          { silent: true }
        )

        densityLog.value.push({
          name: row.name || `ID ${row.id}`,
          status: 'ok',
          msg:
            `${row.current_typology ? typologyShortLabel(row.current_typology) : '—'}` +
            ` → ${typologyShortLabel(row.new_typology)}` +
            ` (${row.built_up_ratio?.toFixed(2)}% from ${row.structure_count} structures)`
        })

        // Reflect the saved value in the preview without re-running compute.
        row.current_typology = row.new_typology
      } catch (e: any) {
        densityLog.value.push({
          name: row.name || `ID ${row.id}`,
          status: 'error',
          msg: e?.message || 'Failed to update'
        })
        densityErrors.value++
      }

      densityDone.value++
      await scrollDensityLog()
    }

    if (!densityCancelled.value) {
      ElMessage.success(
        `Density typology applied: ${densityDone.value - densityErrors.value} updated, ${densityErrors.value} errors.`
      )
    } else {
      ElMessage.warning('Apply cancelled.')
    }
  } finally {
    densityRunning.value = false
  }
}

const scrollDensityLog = async () => {
  await nextTick()
  if (densityLogRef.value) densityLogRef.value.scrollTop = densityLogRef.value.scrollHeight
}

const copyDensityLog = async () => {
  const text = densityLog.value
    .map((e) => `${e.status === 'ok' ? '✓' : e.status === 'skip' ? '–' : '✗'} ${e.name}  ${e.msg}`)
    .join('\n')
  await navigator.clipboard.writeText(text)
  densityCopied.value = true
  setTimeout(() => { densityCopied.value = false }, 2000)
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

.density-preview {
  margin-top: 8px;
  margin-bottom: 20px;

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    .preview-summary {
      font-size: 13px;
      color: #606266;
    }
  }

  .density-table {
    width: 100%;

    .muted {
      color: #c0c4cc;
    }
  }
}
</style>
