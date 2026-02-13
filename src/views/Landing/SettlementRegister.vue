<template>
  <section id="register" class="settlement-register-section">
    <div class="section-container section-container--header">
      <div class="section-header">
        <h2 class="section-title">Settlement Register</h2>
        <p class="section-subtitle">
          Search and explore informal settlements.
        </p>
      </div>
    </div>

    <el-card class="register-card" shadow="hover">
      <div class="section-container">
      <!-- Search and filters -->
      <div class="register-controls">
        <el-input
          v-model="searchKeyword"
          placeholder="Search by settlement name..."
          clearable
          class="search-input"
          @keyup.enter="searchSettlements"
        >
          <template #prefix>
            <Icon icon="mdi:magnify" width="18" />
          </template>
          <template #append>
            <el-button type="primary" :loading="listLoading" @click="searchSettlements">Search</el-button>
          </template>
        </el-input>
        <div class="filter-row">
          <el-select
            v-model="selectedCounty"
            placeholder="County"
            clearable
            filterable
            class="filter-select"
            @change="onCountyChange"
          >
            <el-option
              v-for="c in countyOptions"
              :key="c.value"
              :label="c.label"
              :value="c.value"
            />
          </el-select>
          <el-select
            v-model="selectedSubcounty"
            placeholder="Subcounty"
            clearable
            filterable
            class="filter-select"
            :disabled="!selectedCounty"
            @change="onSubcountyChange"
          >
            <el-option
              v-for="s in subcountyOptions"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
          <el-select
            v-model="selectedWard"
            placeholder="Ward"
            clearable
            filterable
            class="filter-select"
            :disabled="!selectedSubcounty"
          >
            <el-option
              v-for="w in wardOptions"
              :key="w.value"
              :label="w.label"
              :value="w.value"
            />
          </el-select>
          <el-button @click="resetFilters">Reset</el-button>
        </div>
      </div>

      <el-tabs v-model="activeRegisterTab" class="register-tabs" @tab-change="onRegisterTabChange">
        <el-tab-pane label="List" name="table">
          <div class="register-table-wrap">
            <div v-loading="listLoading" class="table-inner" :class="{ 'has-data': settlementList.length > 0 }">
              <div v-if="settlementList.length > 0" class="register-table-container">
                <el-table
                  :data="settlementList"
                  :key="'t-' + settlementList.length + '-' + currentPage"
                  stripe
                  class="register-table"
                  size="default"
                >
                  <el-table-column prop="name" label="Name" min-width="180" show-overflow-tooltip />
                  <el-table-column prop="population" label="Population" width="120" align="right">
                    <template #default="scope">
                      {{ scope?.row?.population != null ? Number(scope.row.population).toLocaleString() : '–' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="County" min-width="140">
                    <template #default="scope">{{ scope?.row?.county?.name || '–' }}</template>
                  </el-table-column>
                  <el-table-column label="Subcounty" min-width="140">
                    <template #default="scope">{{ scope?.row?.subcounty?.name || '–' }}</template>
                  </el-table-column>
                  <el-table-column label="Ward" min-width="120">
                    <template #default="scope">{{ scope?.row?.ward?.name || '–' }}</template>
                  </el-table-column>
                  <el-table-column prop="settlement_type" label="Type" min-width="120" show-overflow-tooltip>
                    <template #default="scope">{{ scope?.row?.settlement_type || '–' }}</template>
                  </el-table-column>
                  <el-table-column label="" width="120" align="center" fixed="right">
                    <template #default="scope">
                      <el-button
                        type="primary"
                        link
                        size="small"
                        @click.prevent="goToMapWithSettlement(scope?.row)"
                      >
                        <Icon icon="mdi:map-marker" class="action-icon" />
                        View on map
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
                <el-pagination
                  v-if="totalList > pageSize"
                  class="register-pagination"
                  :current-page="currentPage"
                  :page-size="pageSize"
                  :total="totalList"
                  layout="total, prev, pager, next"
                  @current-change="onPageChange"
                />
              </div>
              <p v-else-if="!listLoading" class="empty-text">No settlements found. Try adjusting search or filters.</p>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="Map" name="map">
          <div class="register-map-section">
            <div ref="mapContainerRef" class="register-map"></div>
            <div v-if="showMapOverlay" class="map-overlay">
              <div class="map-overlay-card">{{ mapOverlayText }}</div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
      </div>
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useAppStoreWithOut } from '@/store/modules/app'
import {
  ElMessage,
  ElInput,
  ElButton,
  ElSelect,
  ElOption,
  ElTable,
  ElTableColumn,
  ElPagination,
  ElTabs,
  ElTabPane,
  ElCard
} from 'element-plus'
import { Icon } from '@iconify/vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import {
  getPublicRegisterSettlements,
  getPublicRegisterSettlementsMap,
  getPublicRegisterSettlement,
  getPublicRegisterSettlementMap,
  getPublicRegisterCounties,
  getPublicRegisterSubcounties,
  getPublicRegisterWards
} from '@/api/register-public'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''

const mapContainerRef = ref<HTMLElement | null>(null)
const activeRegisterTab = ref<'table' | 'map'>('table')
const appStore = useAppStoreWithOut()
const isDark = computed(() => appStore.getIsDark)

const mapStyle = ref<'streets' | 'satellite'>('streets')
const currentSingleSettlementFeature = ref<any>(null)
let map: mapboxgl.Map | null = null
let currentPopup: mapboxgl.Popup | null = null

const MAP_STYLE_STREETS_LIGHT = 'mapbox://styles/mapbox/light-v11'
const MAP_STYLE_STREETS_DARK = 'mapbox://styles/mapbox/dark-v11'
const MAP_STYLE_SATELLITE = 'mapbox://styles/mapbox/satellite-streets-v12'

function getMapStyleUrl(): string {
  if (mapStyle.value === 'satellite') return MAP_STYLE_SATELLITE
  return isDark.value ? MAP_STYLE_STREETS_DARK : MAP_STYLE_STREETS_LIGHT
}

const searchKeyword = ref('')
const selectedCounty = ref<number | null>(null)
const selectedSubcounty = ref<number | null>(null)
const selectedWard = ref<number | null>(null)
const countyOptions = ref<Array<{ value: number; label: string }>>([])
const subcountyOptions = ref<Array<{ value: number; label: string }>>([])
const wardOptions = ref<Array<{ value: number; label: string }>>([])

const settlementList = ref<any[]>([])
const totalList = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const listLoading = ref(false)

const geojson = ref<any>({ type: 'FeatureCollection', features: [] })
const boundariesGeoJson = ref<any>({ type: 'FeatureCollection', features: [] })
const mapLoading = ref(false)
const mapLoadingText = ref('Load map by selecting a county or searching')

const showMapOverlay = computed(() => {
  if (mapLoading.value) return true
  const hasFilter = selectedCounty.value != null || (searchKeyword.value?.trim() || '').length > 0
  return !hasFilter
})
const mapOverlayText = computed(() => {
  if (mapLoading.value) return mapLoadingText.value
  return 'Search  by name or filter by county to see settlements on the map'
})

async function loadCounties() {
  try {
    const res = await getPublicRegisterCounties()
    const data = res?.data || []
    countyOptions.value = data.map((c: { id: number; name: string }) => ({ value: c.id, label: c.name }))
  } catch (e) {
    console.error('Load counties:', e)
  }
}

async function loadSubcounties() {
  if (!selectedCounty.value) {
    subcountyOptions.value = []
    return
  }
  try {
    const res = await getPublicRegisterSubcounties(selectedCounty.value)
    const data = res?.data || []
    subcountyOptions.value = data.map((s: { id: number; name: string }) => ({ value: s.id, label: s.name }))
    selectedSubcounty.value = null
    selectedWard.value = null
    wardOptions.value = []
  } catch (e) {
    console.error('Load subcounties:', e)
  }
}

async function loadWards() {
  if (!selectedSubcounty.value) {
    wardOptions.value = []
    return
  }
  try {
    const res = await getPublicRegisterWards(selectedSubcounty.value)
    const data = res?.data || []
    wardOptions.value = data.map((w: { id: number; name: string }) => ({ value: w.id, label: w.name }))
    selectedWard.value = null
  } catch (e) {
    console.error('Load wards:', e)
  }
}

async function loadList() {
  listLoading.value = true
  try {
    const res = await getPublicRegisterSettlements({
      page: currentPage.value,
      limit: pageSize.value,
      search: searchKeyword.value?.trim() || undefined,
      county_id: selectedCounty.value ?? undefined,
      subcounty_id: selectedSubcounty.value ?? undefined,
      ward_id: selectedWard.value ?? undefined
    })
    const raw = res?.data ?? res?.documents ?? res?.results
    const data = Array.isArray(raw) ? raw : (raw ? [raw] : [])
    const total = res?.total ?? data.length
    settlementList.value = [...data]
    totalList.value = total
    nextTick(() => fitMapToTableSettlements())
  } catch (e) {
    console.error('Load settlement list:', e)
    ElMessage.error('Failed to load settlements')
    settlementList.value = []
    totalList.value = 0
  } finally {
    listLoading.value = false
  }
}

async function loadMapData() {
  if (!map) return
  const searchTerm = searchKeyword.value?.trim() || ''
  const hasFilter = selectedCounty.value != null || searchTerm.length > 0
  if (!hasFilter) {
    geojson.value = { type: 'FeatureCollection', features: [] }
    boundariesGeoJson.value = { type: 'FeatureCollection', features: [] }
    if (map.getSource('settlements')) {
      (map.getSource('settlements') as mapboxgl.GeoJSONSource).setData(geojson.value)
    }
    removeBoundariesLayer()
    mapLoadingText.value = 'Select a county or search by name to load settlements on map'
    return
  }
  mapLoading.value = true
  mapLoadingText.value = 'Loading settlements on map...'
  try {
    const mapParams = {
      county_id: selectedCounty.value ?? undefined,
      subcounty_id: selectedSubcounty.value ?? undefined,
      ward_id: selectedWard.value ?? undefined,
      search: searchTerm || undefined,
      limit: searchTerm && !selectedCounty.value ? 500 : 2000
    }
    const polygonsParams = {
      ...mapParams,
      limit: searchTerm && !selectedCounty.value ? 200 : 400,
      polygons: true as const
    }
    const [pointsFc, polygonsFc] = await Promise.all([
      getPublicRegisterSettlementsMap(mapParams),
      getPublicRegisterSettlementsMap(polygonsParams)
    ])
    geojson.value = pointsFc?.type === 'FeatureCollection' ? pointsFc : { type: 'FeatureCollection', features: pointsFc?.features ?? [] }
    boundariesGeoJson.value = polygonsFc?.type === 'FeatureCollection' && Array.isArray(polygonsFc.features) && polygonsFc.features.length > 0
      ? polygonsFc
      : { type: 'FeatureCollection', features: [] }
    if (map.getSource('settlements')) {
      (map.getSource('settlements') as mapboxgl.GeoJSONSource).setData(geojson.value)
    }
    updateBoundariesLayer()
    mapLoadingText.value = `${geojson.value.features?.length || 0} settlements on map`
    nextTick(() => fitMapToTableSettlements())
  } catch (e) {
    console.error('Load map settlements:', e)
    geojson.value = { type: 'FeatureCollection', features: [] }
    boundariesGeoJson.value = { type: 'FeatureCollection', features: [] }
    if (map.getSource('settlements')) {
      (map.getSource('settlements') as mapboxgl.GeoJSONSource).setData(geojson.value)
    }
    removeBoundariesLayer()
    mapLoadingText.value = 'Failed to load map data'
  } finally {
    mapLoading.value = false
  }
}

function updateBoundariesLayer() {
  if (!map) return
  const fc = boundariesGeoJson.value
  if (!fc?.features?.length) {
    removeBoundariesLayer()
    return
  }
  if (!map.getSource('settlements-boundaries')) {
    map.addSource('settlements-boundaries', {
      type: 'geojson',
      data: fc
    })
    map.addLayer({
      id: 'settlements-fill',
      type: 'fill',
      source: 'settlements-boundaries',
      paint: {
        'fill-color': '#00DC82',
        'fill-opacity': 0.2
      }
    })
    map.addLayer({
      id: 'settlements-line',
      type: 'line',
      source: 'settlements-boundaries',
      paint: {
        'line-color': '#00DC82',
        'line-width': 1.5
      }
    })
    map.on('click', 'settlements-fill', (e: any) => onBoundaryClick(e))
    map.on('click', 'settlements-line', (e: any) => onBoundaryClick(e))
    map.on('mouseenter', 'settlements-fill', () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'settlements-fill', () => { map.getCanvas().style.cursor = '' })
    map.on('mouseenter', 'settlements-line', () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'settlements-line', () => { map.getCanvas().style.cursor = '' })
  } else {
    (map.getSource('settlements-boundaries') as mapboxgl.GeoJSONSource).setData(fc)
  }
}

function removeBoundariesLayer() {
  if (!map) return
  try {
    if (map.getLayer('settlements-fill')) map.removeLayer('settlements-fill')
    if (map.getLayer('settlements-line')) map.removeLayer('settlements-line')
    if (map.getSource('settlements-boundaries')) map.removeSource('settlements-boundaries')
  } catch (_) {}
}

/** Fit map zoom/bounds to show settlements currently in the table. */
function fitMapToTableSettlements() {
  if (!map || !geojson.value?.features?.length) return
  const ids = new Set((settlementList.value || []).map((s: any) => s?.id).filter((id: any) => id != null))
  if (ids.size === 0) return
  const coords: [number, number][] = []
  for (const f of geojson.value.features) {
    const id = f?.properties?.id
    if (id == null || !ids.has(id)) continue
    const geom = f?.geometry
    if (!geom) continue
    if (geom.type === 'Point' && Array.isArray(geom.coordinates) && geom.coordinates.length >= 2) {
      coords.push([geom.coordinates[0], geom.coordinates[1]])
    } else if (geom.type === 'Polygon' && Array.isArray(geom.coordinates?.[0])) {
      const ring = geom.coordinates[0]
      if (ring?.length) coords.push([ring[0][0], ring[0][1]])
    }
  }
  if (coords.length === 0) return
  if (coords.length === 1) {
    map.flyTo({ center: coords[0], zoom: 12, duration: 600 })
    return
  }
  const bounds = coords.reduce(
    (acc, [lng, lat]) => acc.extend([lng, lat]),
    new mapboxgl.LngLatBounds(coords[0], coords[0])
  )
  map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 600 })
}

async function onBoundaryClick(e: any) {
  const f = e.features?.[0]
  const id = f?.properties?.id
  if (!id) return
  await showPopupForSettlement(Number(id), e.lngLat)
}

/** Get [lng, lat] from a GeoJSON feature (Point or Polygon). */
function getCoordsFromFeature(f: any): [number, number] | null {
  if (!f?.geometry) return null
  let g = f.geometry
  if (typeof g === 'string') {
    try { g = JSON.parse(g) } catch { return null }
  }
  if (!g || typeof g !== 'object') return null
  if (g.type === 'Point' && Array.isArray(g.coordinates) && g.coordinates.length >= 2) {
    return [g.coordinates[0], g.coordinates[1]]
  }
  if (g.type === 'Polygon' && Array.isArray(g.coordinates?.[0])) {
    const ring = g.coordinates[0]
    if (ring?.[0]) return [ring[0][0], ring[0][1]]
  }
  if (g.type === 'MultiPolygon' && Array.isArray(g.coordinates?.[0]?.[0])) {
    const firstRing = g.coordinates[0][0]
    if (firstRing?.[0]) return [firstRing[0][0], firstRing[0][1]]
  }
  return null
}

/** Switch to Map tab and load this settlement (no page scroll). */
function goToMapWithSettlement(row: any) {
  if (row?.id == null || !map) return
  activeRegisterTab.value = 'map'
  nextTick(() => {
    map?.resize()
    viewSettlementOnMap(row)
  })
}

async function viewSettlementOnMap(row: any) {
  const id = row?.id
  if (id == null || !map) return
  const idNum = Number(id)
  try {
    const feature = await getPublicRegisterSettlementMap(idNum)
    const coords = getCoordsFromFeature(feature)
    if (!coords) {
      ElMessage.warning('This settlement has no location data.')
      return
    }
    ensureSingleSettlementLayer()
    currentSingleSettlementFeature.value = feature
    const source = map.getSource('single-settlement') as mapboxgl.GeoJSONSource
    if (source) {
      source.setData({ type: 'FeatureCollection', features: [feature] })
    }
    const geom = feature?.geometry
    if (geom?.type === 'Polygon' && geom?.coordinates?.[0]?.length) {
      const ring = geom.coordinates[0] as [number, number][]
      const bounds = new mapboxgl.LngLatBounds(ring[0], ring[0])
      ring.forEach((c) => bounds.extend(c))
      map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 700 })
    } else if (geom?.type === 'MultiPolygon' && geom?.coordinates?.[0]?.[0]?.length) {
      const ring = geom.coordinates[0][0] as [number, number][]
      const bounds = new mapboxgl.LngLatBounds(ring[0], ring[0])
      ring.forEach((c) => bounds.extend(c))
      map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 700 })
    } else {
      map.flyTo({ center: coords, zoom: 13, duration: 700 })
    }
  } catch (e: any) {
    if (e?.response?.status === 404 || e?.message === 'Not found') {
      ElMessage.warning('Settlement not found or has no location data.')
    } else {
      ElMessage.error('Could not load settlement on map.')
    }
  }
}

function ensureSingleSettlementLayer() {
  if (!map) return
  if (!map.getSource('single-settlement')) {
    map.addSource('single-settlement', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    })
    map.addLayer({
      id: 'single-settlement-fill',
      type: 'fill',
      source: 'single-settlement',
      paint: {
        'fill-color': '#E6A23C',
        'fill-opacity': 0.25
      }
    })
    map.addLayer({
      id: 'single-settlement-line-outline',
      type: 'line',
      source: 'single-settlement',
      paint: {
        'line-color': '#fff',
        'line-width': 4
      }
    })
    map.addLayer({
      id: 'single-settlement-line',
      type: 'line',
      source: 'single-settlement',
      paint: {
        'line-color': '#c45a00',
        'line-width': 2.5
      }
    })
    map.addLayer({
      id: 'single-settlement-point',
      type: 'circle',
      source: 'single-settlement',
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-color': '#E6A23C',
        'circle-radius': 10,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
      }
    })
    map.on('click', 'single-settlement-fill', (e: any) => onSingleSettlementClick(e))
    map.on('click', 'single-settlement-line', (e: any) => onSingleSettlementClick(e))
    map.on('click', 'single-settlement-line-outline', (e: any) => onSingleSettlementClick(e))
    map.on('click', 'single-settlement-point', (e: any) => onSingleSettlementClick(e))
    map.on('mouseenter', 'single-settlement-fill', () => { map!.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'single-settlement-fill', () => { map!.getCanvas().style.cursor = '' })
    map.on('mouseenter', 'single-settlement-line', () => { map!.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'single-settlement-line', () => { map!.getCanvas().style.cursor = '' })
    map.on('mouseenter', 'single-settlement-point', () => { map!.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'single-settlement-point', () => { map!.getCanvas().style.cursor = '' })
  }
}

async function onSingleSettlementClick(e: any) {
  const f = e.features?.[0]
  const id = f?.properties?.id
  if (!id) return
  const lngLat = e.lngLat
  await showPopupForSettlement(Number(id), { lng: lngLat.lng, lat: lngLat.lat })
}

async function showPopupForSettlement(id: number, lngLat: { lng: number; lat: number }) {
  if (currentPopup) {
    currentPopup.remove()
    currentPopup = null
  }
  try {
    const res = await getPublicRegisterSettlement(id)
    const s = res?.data ?? res?.results
    if (!s) return
    const name = s.name || 'Settlement'
    const pop = s.population != null ? Number(s.population).toLocaleString() : '–'
    const countyName = s.county?.name || '–'
    const subName = s.subcounty?.name || '–'
    const wardName = s.ward?.name || '–'
    const settlementType = s.settlement_type || '–'
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    currentPopup = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: false,
      className: isMobile ? 'register-map-popup register-map-popup--mobile' : 'register-map-popup',
      maxWidth: isMobile ? '260px' : '320px',
      anchor: isMobile ? 'right' : 'left',
      offset: isMobile ? 8 : 12
    })
      .setLngLat(lngLat)
      .setHTML(
        `<div class="register-popup">
          <header class="register-popup-header">
            <h3 class="register-popup-title">${escapeHtml(name)}</h3>
          </header>
          <div class="register-popup-body">
            <div class="register-popup-row"><span class="register-popup-label">Type</span><span class="register-popup-value">${escapeHtml(settlementType)}</span></div>
            <div class="register-popup-row"><span class="register-popup-label">Est. Population</span><span class="register-popup-value">${pop}</span></div>
            <div class="register-popup-row"><span class="register-popup-label">County</span><span class="register-popup-value">${escapeHtml(countyName)}</span></div>
            <div class="register-popup-row"><span class="register-popup-label">Subcounty</span><span class="register-popup-value">${escapeHtml(subName)}</span></div>
            <div class="register-popup-row"><span class="register-popup-label">Ward</span><span class="register-popup-value">${escapeHtml(wardName)}</span></div>
          </div>
        </div>`
      )
      .addTo(map!)
    currentPopup.on('close', () => { currentPopup = null })
  } catch (err) {
    console.error('Popup error:', err)
  }
}

function onRegisterTabChange(tabName: string) {
  if (tabName === 'map' && map) {
    nextTick(() => {
      map?.resize()
    })
  }
}

function searchSettlements() {
  currentPage.value = 1
  loadList()
  loadMapData()
}

function onCountyChange() {
  loadSubcounties()
  currentPage.value = 1
  loadList()
  loadMapData()
}

function onSubcountyChange() {
  loadWards()
  currentPage.value = 1
  loadList()
  loadMapData()
}

function onPageChange(p: number) {
  currentPage.value = p
  loadList()
}

const MAP_INITIAL_CENTER: [number, number] = [37.913, 0.1765]
const MAP_INITIAL_ZOOM = 5

function resetMapView() {
  if (!map) return
  if (currentPopup) {
    currentPopup.remove()
    currentPopup = null
  }
  map.flyTo({ center: MAP_INITIAL_CENTER, zoom: MAP_INITIAL_ZOOM, duration: 500 })
}

function resetFilters() {
  searchKeyword.value = ''
  selectedCounty.value = null
  selectedSubcounty.value = null
  selectedWard.value = null
  subcountyOptions.value = []
  wardOptions.value = []
  currentPage.value = 1
  loadList()
  loadMapData()
  nextTick(() => resetMapView())
}

watch([selectedWard], () => {
  currentPage.value = 1
  loadList()
  loadMapData()
})

watch(isDark, () => {
  if (!map || mapStyle.value !== 'streets') return
  map.setStyle(getMapStyleUrl())
  map.once('style.load', () => {
    addRegisterMapLayers()
  })
})

function addRegisterMapLayers() {
  if (!map) return
  if (!map.getSource('settlements')) {
    map.addSource('settlements', {
      type: 'geojson',
      data: geojson.value,
      cluster: true,
      clusterMaxZoom: 12,
      clusterRadius: 50
    })
    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'settlements',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': ['step', ['get', 'point_count'], '#00DC82', 10, '#409EFF', 30, '#E6A23C'],
        'circle-radius': ['step', ['get', 'point_count'], 18, 10, 22, 30, 26],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
      }
    })
    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'settlements',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      },
      paint: { 'text-color': '#fff' }
    })
    map.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'settlements',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#00DC82',
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
      }
    })
    map.on('click', 'unclustered-point', async (e: any) => {
      const id = e.features[0]?.properties?.id
      if (!id) return
      const coords = e.features[0].geometry?.coordinates
      await showPopupForSettlement(Number(id), { lng: coords[0], lat: coords[1] })
    })
    map.on('click', 'clusters', (e: any) => {
      const features = map!.queryRenderedFeatures(e.point, { layers: ['clusters'] })
      const clusterId = features[0]?.properties?.cluster_id
      if (clusterId == null) return
      const source = map!.getSource('settlements') as mapboxgl.GeoJSONSource
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return
        map!.easeTo({ center: (features[0].geometry as any).coordinates, zoom })
      })
    })
  } else {
    (map.getSource('settlements') as mapboxgl.GeoJSONSource).setData(geojson.value)
  }
  updateBoundariesLayer()
  ensureSingleSettlementLayer()
  if (currentSingleSettlementFeature.value) {
    const src = map.getSource('single-settlement') as mapboxgl.GeoJSONSource
    if (src) src.setData({ type: 'FeatureCollection', features: [currentSingleSettlementFeature.value] })
  }
}

const STYLE_SWITCHER_ICONS = {
  streets: 'https://api.iconify.design/mdi/satellite-variant.svg',
  satellite: 'https://api.iconify.design/mdi/map.svg'
} as const

function createStyleSwitcherControl() {
  const el = document.createElement('div')
  el.className = 'mapboxgl-ctrl mapboxgl-ctrl-group register-style-switcher'
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.setAttribute('aria-label', 'Toggle satellite / map view')
  const img = document.createElement('img')
  img.alt = ''
  img.width = 20
  img.height = 20
  img.src = STYLE_SWITCHER_ICONS[mapStyle.value]
  img.className = 'register-style-switcher-icon'
  btn.title = mapStyle.value === 'satellite' ? 'Map view' : 'Satellite view'
  btn.appendChild(img)
  function updateIcon() {
    img.src = STYLE_SWITCHER_ICONS[mapStyle.value]
    btn.title = mapStyle.value === 'satellite' ? 'Map view' : 'Satellite view'
  }
  btn.addEventListener('click', () => {
    mapStyle.value = mapStyle.value === 'satellite' ? 'streets' : 'satellite'
    updateIcon()
    if (!map) return
    map.setStyle(getMapStyleUrl())
    map.once('style.load', () => {
      addRegisterMapLayers()
    })
  })
  el.appendChild(btn)
  return { onAdd: () => el, onRemove: () => { el.parentNode?.removeChild(el) } }
}

function initMap() {
  if (!mapContainerRef.value) return
  map = new mapboxgl.Map({
    container: mapContainerRef.value,
    style: getMapStyleUrl(),
    center: MAP_INITIAL_CENTER,
    zoom: MAP_INITIAL_ZOOM
  })
  map.addControl(new mapboxgl.NavigationControl())
  map.addControl(createStyleSwitcherControl() as any, 'top-right')
  map.on('load', () => {
    addRegisterMapLayers()
  })
}

function escapeHtml(str: string) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

onMounted(async () => {
  await loadCounties()
  loadList()
  initMap()
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
.settlement-register-section {
  padding: 3rem 0;
  background: var(--bg-secondary, #f5f7fa);
}

.section-container--header {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
}

.register-card {
  max-width: 1280px;
  margin: 1rem auto 0;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  overflow: hidden;
}

.register-card :deep(.el-card__body) {
  padding: 1.5rem 2rem 2rem;
}

/* Content inside card */
.settlement-register-section .register-card .section-container {
  max-width: 100%;
  margin: 0;
  padding: 0;
}

/* Match landing index section typography */
.section-header {
  text-align: center;
  margin-bottom: 3rem;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 1rem;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.section-subtitle {
  font-size: 1.125rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* Map popup – card style and close button (Mapbox injects into map container) */
:deep(.register-map-popup.mapboxgl-popup) {
  filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.15));
}
:deep(.register-map-popup .mapboxgl-popup-content) {
  padding: 0;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  background: var(--el-bg-color, #fff);
  min-width: 240px;
  max-width: 320px;
  position: relative;
  z-index: 0;
}
:deep(.register-map-popup .mapboxgl-popup-close-button) {
  font-size: 26px;
  font-weight: 700;
  padding: 6px 12px;
  color: var(--text-secondary, #909399);
  right: 4px;
  top: 4px;
  z-index: 10;
  position: absolute;
  pointer-events: auto;
  transition: color 0.2s;
}
:deep(.register-map-popup .mapboxgl-popup-close-button:hover) {
  color: var(--text-primary, #303133);
  background: transparent;
}
:deep(.register-popup) {
  font-size: 14px;
  color: var(--text-primary, #303133);
}
:deep(.register-popup-header) {
  background: linear-gradient(135deg, #00DC82 0%, #00b368 100%);
  padding: 14px 36px 14px 16px;
}
:deep(.register-popup-title) {
  margin: 0;
  font-weight: 700;
  font-size: 1.05rem;
  line-height: 1.3;
  color: #fff;
  letter-spacing: -0.01em;
}
:deep(.register-popup-body) {
  padding: 12px 16px;
}
:deep(.register-popup-row) {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
}
:deep(.register-popup-row:last-child) {
  border-bottom: none;
  padding-bottom: 0;
}
:deep(.register-popup-label) {
  color: var(--text-secondary, #909399);
  font-size: 13px;
  flex-shrink: 0;
}
:deep(.register-popup-value) {
  font-weight: 500;
  text-align: right;
  word-break: break-word;
}

/* Compact popup on mobile */
:deep(.register-map-popup--mobile .mapboxgl-popup-content) {
  min-width: 0;
  max-width: 260px;
  border-radius: 8px;
}
:deep(.register-map-popup--mobile .register-popup-header) {
  padding: 8px 28px 8px 10px;
}
:deep(.register-map-popup--mobile .register-popup-title) {
  font-size: 0.9rem;
  line-height: 1.25;
}
:deep(.register-map-popup--mobile .register-popup-body) {
  padding: 8px 10px;
}
:deep(.register-map-popup--mobile .register-popup) {
  font-size: 12px;
}
:deep(.register-map-popup--mobile .register-popup-row) {
  padding: 4px 0;
  gap: 8px;
}
:deep(.register-map-popup--mobile .register-popup-label) {
  font-size: 11px;
}
:deep(.register-map-popup--mobile .mapboxgl-popup-close-button) {
  font-size: 20px;
  padding: 4px 8px;
  right: 2px;
  top: 2px;
}

.register-tabs {
  margin-top: 0.5rem;
}
.register-tabs :deep(.el-tabs__content) {
  padding: 0;
  min-height: 440px;
}
.register-tabs :deep(.el-tab-pane) {
  outline: none;
}
.register-tabs .register-map-section {
  min-height: 440px;
}

.register-controls {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 420px;
  min-width: 200px;
  flex-shrink: 0;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.filter-select {
  width: 160px;
}

.register-table-wrap {
  margin-bottom: 1.5rem;
  border-radius: 8px;
  overflow: visible;
  background: var(--el-bg-color, #fff);
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  border: 1px solid var(--el-border-color-light, #ebeef5);
}

.table-inner {
  min-height: 120px;
  padding: 16px;
}

.table-inner.has-data {
  min-height: 200px;
}

.register-table-container {
  width: 100%;
  overflow: visible;
}

.register-table {
  width: 100% !important;
}

.action-icon {
  margin-right: 4px;
  vertical-align: -0.2em;
}

.register-pagination {
  margin-top: 16px;
  justify-content: flex-start;
}

.empty-text {
  padding: 24px;
  text-align: center;
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
}

.register-map-section {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: var(--el-bg-color, #fff);
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

.register-map {
  width: 100%;
  height: 440px;
  min-height: 400px;
}

.register-map-section :deep(.register-style-switcher button) {
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.register-map-section :deep(.register-style-switcher-icon) {
  display: block;
  width: 20px;
  height: 20px;
  object-fit: contain;
}
.register-map-section :deep(.register-style-switcher button:hover .register-style-switcher-icon) {
  opacity: 0.9;
}

.map-hint {
  margin: 0 0 8px;
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.map-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.map-overlay-card {
  padding: 12px 20px;
  font-size: 0.9rem;
  color: var(--text-secondary, #606266);
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  max-width: 280px;
  text-align: center;
  line-height: 1.45;
}

@media (max-width: 768px) {
  .section-title {
    font-size: 1.75rem;
  }
  .section-subtitle {
    font-size: 1rem;
  }
  .section-container--header {
    padding: 0 1rem;
  }
  .settlement-register-section .register-card {
    margin-left: 0.5rem;
    margin-right: 0.5rem;
    max-width: none;
  }
  .register-card :deep(.el-card__body) {
    padding: 1rem;
  }
  .register-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-bottom: 1rem;
  }
  .search-input {
    width: 100%;
    min-width: 0;
  }
  .filter-row {
    flex: none;
    width: 100%;
  }
  .filter-select {
    flex: 1;
    min-width: 0;
    width: 100%;
  }
  .register-tabs :deep(.el-tabs__content) {
    min-height: 320px;
  }
  .register-tabs .register-map-section {
    min-height: 320px;
  }
  .register-map {
    height: 320px;
    min-height: 280px;
  }
  .register-table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .register-table {
    min-width: 600px;
  }
}

@media (max-width: 480px) {
  .filter-row {
    flex-direction: column;
  }
  .filter-select {
    width: 100%;
  }
}
</style>
