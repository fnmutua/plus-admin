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
                      <ElRadio label="all">All (overwrite existing)</ElRadio>
                    </ElRadioGroup>
                  </div>
                </div>

                <ElButton
                  type="primary"
                  :loading="bulkRunning"
                  :disabled="bulkRunning"
                  @click="startBulkUpdate"
                >
                  {{ bulkRunning ? 'Updating...' : 'Start Bulk Update' }}
                </ElButton>
                <ElButton v-if="bulkRunning" type="danger" plain @click="bulkCancelled = true">Cancel</ElButton>
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
  ElOption
} from 'element-plus'
import { getSettlementListByCounty, updateOneRecord } from '@/api/settlements'
import { getListWithoutGeo } from '@/api/counties'

const activeTab = ref('bulk')

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

    for (const settlement of settlements) {
      if (bulkCancelled.value) break

      const geom = settlement.geom
      if (!geom) {
        bulkLog.value.push({ name: settlement.name || `ID ${settlement.id}`, status: 'skip', msg: 'No geometry' })
        bulkSkipped.value++
        bulkDone.value++
        await scrollLog()
        continue
      }

      try {
        const feature = { type: 'Feature', geometry: geom }
        const popRes = await fetch('https://kesmis.go.ke/estimate_population', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(feature)
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
        const population = Math.round(data.estimated_population)
        await updateOneRecord({ id: settlement.id, model: 'settlement', population } as any, { silent: true })

        bulkLog.value.push({
          name: settlement.name || `ID ${settlement.id}`,
          status: 'ok',
          msg: `${before.toLocaleString()} → ${population.toLocaleString()} (${data.buildings} buildings × ${Number(data.persons_per_building).toFixed(2)} ppb)`
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

.bulk-log {
  margin-top: 14px;
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
</style>
