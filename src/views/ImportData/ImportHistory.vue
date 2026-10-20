<script setup lang="ts">
// @ts-nocheck
// Review bulk imports (QGIS connector, Excel, GeoJSON) and undo them.
// The server decides what is safe to undo; this page shows its verdict per
// record and only ever asks it to act on what it marked as revertable.
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import {
  ElCard,
  ElButton,
  ElSelect,
  ElOption,
  ElTable,
  ElTableColumn,
  ElPagination,
  ElTag,
  ElDrawer,
  ElAlert,
  ElTabs,
  ElTabPane,
  ElEmpty,
  ElMessage,
  ElMessageBox
} from 'element-plus'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  listImportBatches,
  getImportBatch,
  getImportBatchFeatures,
  revertImportBatch
} from '@/api/importBatch'

const isMobile = ref(typeof window !== 'undefined' ? window.innerWidth <= 768 : false)
const loading = ref(false)
const rows = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(25)
const canRevert = ref(false)
const model = ref('')
const status = ref('')

const drawerOpen = ref(false)
const detailLoading = ref(false)
const detail = ref<any>(null)
const selected = ref<any[]>([])
const stateFilter = ref('')
const working = ref(false)

const activeTab = ref('records')
const mapEl = ref<HTMLElement | null>(null)
const features = ref<any>(null)
const featuresLoading = ref(false)
let map: L.Map | null = null

const statusOptions = [
  { value: '', label: 'All imports' },
  { value: 'active', label: 'Active' },
  { value: 'partially_reverted', label: 'Partly undone' },
  { value: 'reverted', label: 'Undone' }
]

const STATUS_LABEL = { active: 'Active', partially_reverted: 'Partly undone', reverted: 'Undone' }
const STATUS_TAG = { active: 'success', partially_reverted: 'warning', reverted: 'info' }
const STATE_LABEL = { revertable: 'Can undo', conflict: 'Conflict', missing: 'Already gone', reverted: 'Undone' }
const STATE_TAG = { revertable: 'success', conflict: 'warning', missing: 'info', reverted: 'info' }
const STATE_COLOR = { revertable: '#2f7d4f', conflict: '#c2410c', missing: '#8a8f98', reverted: '#8a8f98' }

const fmt = (ts: string | null) => {
  if (!ts) return '—'
  const d = new Date(ts)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString()
}

const show = (value: any) => {
  if (value == null || value === '') return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const models = computed(() => [...new Set(rows.value.map((r) => r.model))].sort())

const recordsTable = ref<any>(null)
const RECORDS_PAGE_SIZE = 5
const recordsPage = ref(1)

const featureCount = computed(() => features.value?.features?.length || 0)

const toggleState = (state: string) => {
  stateFilter.value = stateFilter.value === state ? '' : state
  activeTab.value = 'records'
}

const visibleItems = computed(() => {
  const items = detail.value?.items || []
  return stateFilter.value ? items.filter((i) => i.state === stateFilter.value) : items
})

const pagedItems = computed(() => {
  const start = (recordsPage.value - 1) * RECORDS_PAGE_SIZE
  return visibleItems.value.slice(start, start + RECORDS_PAGE_SIZE)
})

// Back to the first page whenever the list underneath changes.
watch(visibleItems, () => {
  recordsPage.value = 1
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await listImportBatches({
      page: currentPage.value,
      limit: pageSize.value,
      ...(model.value ? { model: model.value } : {}),
      ...(status.value ? { status: status.value } : {})
    })
    rows.value = res?.rows || []
    total.value = Number(res?.total) || 0
    canRevert.value = Boolean(res?.canRevert)
  } catch (error) {
    rows.value = []
    total.value = 0
    console.error('[Import history] fetch failed:', error)
  } finally {
    loading.value = false
  }
}

const clearMap = () => {
  if (map) {
    map.remove()
    map = null
  }
}

const loadFeatures = async (id: string) => {
  featuresLoading.value = true
  try {
    features.value = await getImportBatchFeatures(id)
  } catch (error) {
    features.value = null
    console.error('[Import history] features failed:', error)
  } finally {
    featuresLoading.value = false
  }
}

// Drawn only while the Map tab is showing: Leaflet measures its container
// when it starts, and a hidden tab has no size.
const drawMap = async () => {
  clearMap()
  if (activeTab.value !== 'map' || !featureCount.value) return
  await nextTick()
  if (!mapEl.value) return
  const stateByItem = new Map((detail.value?.items || []).map((i) => [i.id, i.state]))
  map = L.map(mapEl.value, { zoomControl: true })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)
  const layer = L.geoJSON(features.value, {
    style: (f) => {
      const color = STATE_COLOR[stateByItem.get(f.properties.itemId)] || '#2f6fb0'
      return { color, weight: 1.5, fillOpacity: 0.25 }
    },
    pointToLayer: (f, latlng) =>
      L.circleMarker(latlng, { radius: 5, color: STATE_COLOR[stateByItem.get(f.properties.itemId)] || '#2f6fb0' }),
    onEachFeature: (f, l) => {
      const state = stateByItem.get(f.properties.itemId)
      l.bindTooltip(`${f.properties.label} · ${STATE_LABEL[state] || ''}`)
    }
  }).addTo(map)
  const bounds = layer.getBounds()
  if (bounds.isValid()) map.fitBounds(bounds, { padding: [16, 16] })
}

const loadDetail = async (id: string) => {
  detailLoading.value = true
  try {
    const [loaded] = await Promise.all([getImportBatch(id), loadFeatures(id)])
    detail.value = loaded
    selected.value = []
    // The table keeps ticks across pages, so clear them along with the list.
    recordsTable.value?.clearSelection()
    drawMap()
  } catch (error) {
    console.error('[Import history] detail failed:', error)
  } finally {
    detailLoading.value = false
  }
}

const openDetail = (row: any) => {
  drawerOpen.value = true
  stateFilter.value = ''
  activeTab.value = 'records'
  features.value = null
  detail.value = { batch: row, items: [], summary: null }
  loadDetail(row.id)
}

const undo = async (onlySelected: boolean) => {
  const batch = detail.value?.batch
  if (!batch) return
  const itemIds = onlySelected ? selected.value.map((i) => i.id) : undefined
  working.value = true
  try {
    // Ask the server first: the record states may have changed since the page loaded.
    const preview = await revertImportBatch(batch.id, { dryRun: true, itemIds })
    const s = preview.summary
    if (!s.willDelete && !s.willRestore && !s.missing) {
      ElMessage.warning('Nothing here can be undone right now. See the conflicts for why.')
      detail.value = { ...detail.value, items: preview.items, summary: preview.summary }
      return
    }
    const lines = [
      s.willDelete ? `Delete ${s.willDelete} record(s) this import created.` : '',
      s.willRestore ? `Put back the previous values on ${s.willRestore} record(s) it changed.` : '',
      s.conflict ? `Leave ${s.conflict} record(s) alone: they were edited or are in use since.` : ''
    ].filter(Boolean)
    await ElMessageBox.confirm(lines.join('<br>'), `Undo “${batch.label || batch.model}”?`, {
      confirmButtonText: 'Undo',
      cancelButtonText: 'Cancel',
      type: 'warning',
      dangerouslyUseHTMLString: true
    })
    const result = await revertImportBatch(batch.id, { itemIds })
    ElMessage.success(`Undone: ${result.deleted || 0} deleted, ${result.restored || 0} restored.`)
    await loadDetail(batch.id)
    fetchData()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') console.error('[Import history] undo failed:', error)
  } finally {
    working.value = false
  }
}

const onPageChange = () => fetchData()
const onPageSizeChange = () => {
  currentPage.value = 1
  fetchData()
}

watch([model, status], () => {
  currentPage.value = 1
  fetchData()
})

watch(drawerOpen, (open) => {
  if (!open) clearMap()
})

watch(activeTab, () => drawMap())

onBeforeUnmount(() => map && map.remove())
onMounted(() => fetchData())
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="card-header">
        <span>Import History</span>
        <span class="card-subtitle">
          Every bulk import, what it created or changed, and undo for imports that went wrong
        </span>
      </div>
    </template>

    <div class="toolbar">
      <el-select v-model="model" placeholder="Data type" clearable class="filter-select">
        <el-option value="" label="All data types" />
        <el-option v-for="m in models" :key="m" :value="m" :label="m" />
      </el-select>
      <el-select v-model="status" class="filter-select">
        <el-option v-for="item in statusOptions" :key="item.value" :value="item.value" :label="item.label" />
      </el-select>
      <el-button @click="fetchData" :loading="loading">Refresh</el-button>
    </div>

    <el-table
      :data="rows"
      border
      v-loading="loading"
      style="width: 100%"
      empty-text="No imports recorded yet"
      @row-click="openDetail"
      row-class-name="clickable-row"
    >
      <el-table-column label="Imported" width="170">
        <template #default="scope">{{ fmt(scope.row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="By" prop="createdByName" min-width="120" />
      <el-table-column label="Data type" prop="model" min-width="120" />
      <el-table-column label="Layer / file" min-width="160" show-overflow-tooltip>
        <template #default="scope">
          {{ scope.row.label || '—' }}
          <span v-if="scope.row.source" class="muted"> · {{ scope.row.source }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Created" prop="insertedCount" width="90" align="right" />
      <el-table-column label="Updated" prop="updatedCount" width="90" align="right" />
      <el-table-column label="Failed" prop="failedCount" width="80" align="right" />
      <el-table-column label="Status" width="130">
        <template #default="scope">
          <el-tag :type="STATUS_TAG[scope.row.status]" size="small">{{ STATUS_LABEL[scope.row.status] }}</el-tag>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      class="mt-4"
      :layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[10, 25, 50, 100]"
      :total="total"
      :background="true"
      @size-change="onPageSizeChange"
      @current-change="onPageChange"
      :small="isMobile"
      :pager-count="isMobile ? 3 : 7"
    />
  </el-card>

  <el-drawer
    v-model="drawerOpen"
    :size="isMobile ? '100%' : '72%'"
    :with-header="false"
    class="import-drawer"
  >
    <div v-loading="detailLoading" v-if="detail" class="drawer-body">
      <header class="detail-head">
        <div class="detail-title">
          <div class="title-row">
            <h3>{{ detail.batch.label || detail.batch.model }}</h3>
            <el-tag :type="STATUS_TAG[detail.batch.status]" size="small" effect="dark" round>
              {{ STATUS_LABEL[detail.batch.status] }}
            </el-tag>
          </div>
          <div class="meta">
            <span>{{ detail.batch.model }}</span>
            <span v-if="detail.batch.source">{{ detail.batch.source }}</span>
            <span>{{ detail.batch.createdByName || 'Unknown user' }}</span>
            <span>{{ fmt(detail.batch.createdAt) }}</span>
          </div>
          <div v-if="detail.batch.revertedAt" class="meta">
            Undone by {{ detail.batch.revertedByName || '—' }} · {{ fmt(detail.batch.revertedAt) }}
          </div>
        </div>
        <el-button text circle class="close" aria-label="Close" @click="drawerOpen = false">✕</el-button>
      </header>

      <div class="stats">
        <div class="stat">
          <span class="stat-value">{{ detail.batch.insertedCount }}</span>
          <span class="stat-label">Created</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ detail.batch.updatedCount }}</span>
          <span class="stat-label">Updated</span>
        </div>
        <button
          v-if="detail.summary"
          type="button"
          class="stat stat-button ok"
          :class="{ active: stateFilter === 'revertable' }"
          @click="toggleState('revertable')"
        >
          <span class="stat-value">{{ detail.summary.revertable }}</span>
          <span class="stat-label">Can be undone</span>
        </button>
        <button
          v-if="detail.summary"
          type="button"
          class="stat stat-button warn"
          :class="{ active: stateFilter === 'conflict' }"
          @click="toggleState('conflict')"
        >
          <span class="stat-value">{{ detail.summary.conflict }}</span>
          <span class="stat-label">Conflicts</span>
        </button>
        <button
          v-if="detail.summary"
          type="button"
          class="stat stat-button"
          :class="{ active: stateFilter === 'reverted' }"
          @click="toggleState('reverted')"
        >
          <span class="stat-value">{{ detail.summary.reverted }}</span>
          <span class="stat-label">Already undone</span>
        </button>
      </div>

      <div v-if="canRevert && detail.summary" class="actions">
        <el-button
          type="danger"
          :loading="working"
          :disabled="!detail.summary.revertable && !detail.summary.missing"
          @click="undo(false)"
        >
          Undo this import
        </el-button>
        <el-button :loading="working" :disabled="!selected.length" @click="undo(true)">
          Undo {{ selected.length || '' }} selected
        </el-button>
      </div>

      <el-tabs v-model="activeTab" class="detail-tabs">
        <el-tab-pane name="records">
          <template #label>
            Records <span class="tab-count">{{ detail.items.length }}</span>
          </template>

          <el-alert
            v-if="detail.summary && detail.summary.conflict"
            type="warning"
            :closable="false"
            show-icon
            class="mb-3"
            title="Records in conflict are never undone"
            description="They were edited after the import, are used by other records, or were changed again by a later import. Undo the later import first, or fix them by hand."
          />

          <div v-if="stateFilter" class="filter-note">
            Showing {{ STATE_LABEL[stateFilter].toLowerCase() }} only ·
            <el-button link type="primary" @click="stateFilter = ''">show all</el-button>
          </div>

          <el-table
            ref="recordsTable"
            :data="pagedItems"
            size="small"
            style="width: 100%"
            row-key="id"
            empty-text="This import did not create or change any records"
            @selection-change="(rows) => (selected = rows)"
          >
            <el-table-column
              v-if="canRevert"
              type="selection"
              width="40"
              reserve-selection
              :selectable="(row) => row.state === 'revertable'"
            />
            <el-table-column type="expand">
              <template #default="scope">
                <table class="diff">
                  <thead>
                    <tr><th>Field</th><th v-if="scope.row.action === 'update'">Before</th><th>Imported</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="c in scope.row.changes" :key="c.field">
                      <td class="field">{{ c.field }}</td>
                      <template v-if="c.geometry">
                        <td :colspan="scope.row.action === 'update' ? 2 : 1" class="muted">geometry changed (see Map)</td>
                      </template>
                      <template v-else>
                        <td v-if="scope.row.action === 'update'" class="before">{{ show(c.before) }}</td>
                        <td>{{ show(c.after) }}</td>
                      </template>
                    </tr>
                  </tbody>
                </table>
              </template>
            </el-table-column>
            <el-table-column label="Record" prop="label" min-width="140" show-overflow-tooltip />
            <el-table-column label="Import" width="100">
              <template #default="scope">{{ scope.row.action === 'insert' ? 'Created' : 'Updated' }}</template>
            </el-table-column>
            <el-table-column label="Undo" width="120">
              <template #default="scope">
                <el-tag :type="STATE_TAG[scope.row.state]" size="small">{{ STATE_LABEL[scope.row.state] }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="Why" prop="reason" min-width="240" show-overflow-tooltip />
          </el-table>

          <el-pagination
            v-if="visibleItems.length > RECORDS_PAGE_SIZE"
            v-model:current-page="recordsPage"
            class="records-pager"
            layout="prev, pager, next, total"
            :page-size="RECORDS_PAGE_SIZE"
            :total="visibleItems.length"
            :pager-count="isMobile ? 3 : 7"
            small
            background
          />
        </el-tab-pane>

        <el-tab-pane name="map">
          <template #label>
            Map <span class="tab-count">{{ featureCount }}</span>
          </template>

          <div v-loading="featuresLoading" class="map-wrap">
            <template v-if="featureCount">
              <div ref="mapEl" class="map"></div>
              <div class="legend">
                <span v-for="state in ['revertable', 'conflict', 'reverted']" :key="state">
                  <i :style="{ background: STATE_COLOR[state] }"></i>{{ STATE_LABEL[state] }}
                </span>
              </div>
            </template>
            <el-empty v-else-if="!featuresLoading" description="This import has no geometry to show" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-drawer>
</template>

<style scoped>
.card-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-subtitle {
  font-size: 13px;
  color: #7a8088;
  font-weight: 400;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
  align-items: center;
}

.filter-select {
  width: 180px;
}

.muted {
  color: #8a8f98;
}

.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
}

.detail-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.title-row h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  word-break: break-word;
}

.meta {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
}

.close {
  font-size: 16px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  text-align: left;
  font: inherit;
  color: inherit;
}

.stat-value {
  font-size: 22px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.stat-button {
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.stat-button:hover,
.stat-button.active {
  border-color: var(--el-color-primary);
}

.stat-button.ok .stat-value {
  color: var(--el-color-success);
}

.stat-button.warn .stat-value {
  color: var(--el-color-warning);
}

.stat-button.active {
  background: var(--el-color-primary-light-9);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-tabs {
  flex: 1;
}

.tab-count {
  margin-left: 6px;
  padding: 0 7px;
  border-radius: 10px;
  font-size: 12px;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
}

.records-pager {
  margin-top: 12px;
  justify-content: flex-end;
}

.filter-note {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.map-wrap {
  position: relative;
  min-height: 200px;
}

.map {
  height: max(360px, calc(100vh - 380px));
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.legend i {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 6px;
  border-radius: 3px;
  vertical-align: -2px;
  opacity: 0.8;
}

.diff {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.diff th,
.diff td {
  text-align: left;
  padding: 4px 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  word-break: break-word;
}

.diff th {
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.diff .field {
  font-family: var(--el-font-family-monospace, monospace);
}

.diff .before {
  color: var(--el-text-color-secondary);
  text-decoration: line-through;
}

.mb-3 {
  margin-bottom: 12px;
}

:deep(.clickable-row) {
  cursor: pointer;
}
</style>
