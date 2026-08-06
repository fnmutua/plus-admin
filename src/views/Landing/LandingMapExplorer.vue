<template>
  <BaseLayout>
    <div class="map-explorer" :class="{ 'map-explorer--sidebar-open': sidebarOpen }">
      <aside class="map-explorer__sidebar" :aria-label="`${modeLabel} filters`">
        <div class="map-explorer__sidebar-head">
          <div
            class="map-explorer__tabs"
            role="tablist"
            aria-label="Explorer type"
          >
            <router-link
              class="map-explorer__tab"
              :class="{ 'is-active': !isProjects }"
              :to="PUBLIC_PAGES.settlementExplorer"
              role="tab"
              :aria-selected="!isProjects"
            >
              Settlements
            </router-link>
            <router-link
              class="map-explorer__tab"
              :class="{ 'is-active': isProjects }"
              :to="PUBLIC_PAGES.projectExplorer"
              role="tab"
              :aria-selected="isProjects"
            >
              Projects
            </router-link>
          </div>
          <div class="map-explorer__sidebar-titles">
            <p class="map-explorer__blurb">{{ modeBlurb }}</p>
          </div>
          <div class="map-explorer__toolbar" role="group" aria-label="Map navigation">
            <router-link class="map-explorer__back-btn" to="/landing" aria-label="Back to home">
              <Icon icon="mdi:chevron-left" width="20" height="20" aria-hidden="true" />
              <span>Back</span>
            </router-link>
            <button
              type="button"
              class="map-explorer__toggle"
              :aria-expanded="sidebarOpen"
              aria-controls="map-explorer-panel"
              @click="sidebarOpen = !sidebarOpen"
            >
              <Icon :icon="sidebarOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'" width="20" height="20" />
              <span>{{ sidebarOpen ? 'Hide filters' : 'Show filters' }}</span>
            </button>
          </div>
        </div>

        <div
          id="map-explorer-panel"
          class="map-explorer__panel"
          :class="{ 'is-collapsed': isCompact && !sidebarOpen }"
        >
          <form class="map-explorer__filters" @submit.prevent="applyFilters">
            <label class="field">
              <span>Search</span>
              <el-input
                v-model="searchKeyword"
                clearable
                :placeholder="isProjects ? 'Project or location name…' : 'Settlement name…'"
                @keyup.enter="applyFilters"
              >
                <template #prefix>
                  <Icon icon="mdi:magnify" width="16" />
                </template>
              </el-input>
            </label>

            <label class="field">
              <span>County</span>
              <el-select
                v-model="selectedCounty"
                clearable
                filterable
                placeholder="All counties"
                @change="onCountyChange"
              >
                <el-option
                  v-for="c in countyOptions"
                  :key="c.value"
                  :label="c.label"
                  :value="c.value"
                />
              </el-select>
            </label>

            <label class="field">
              <span>Subcounty</span>
              <el-select
                v-model="selectedSubcounty"
                clearable
                filterable
                placeholder="All subcounties"
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
            </label>

            <label class="field">
              <span>Ward</span>
              <el-select
                v-model="selectedWard"
                clearable
                filterable
                placeholder="All wards"
                :disabled="!selectedSubcounty"
              >
                <el-option
                  v-for="w in wardOptions"
                  :key="w.value"
                  :label="w.label"
                  :value="w.value"
                />
              </el-select>
            </label>

            <div class="map-explorer__actions">
              <el-button type="primary" :loading="mapLoading" @click="applyFilters">
                Update map
              </el-button>
              <el-button @click="resetFilters">Reset</el-button>
            </div>
          </form>

          <p class="map-explorer__status" role="status">{{ statusText }}</p>

          <router-link class="map-explorer__back" to="/landing">← Back to home</router-link>
        </div>
      </aside>

      <div class="map-explorer__map-wrap">
        <div v-if="!mapInitialized || mapLoading" class="map-explorer__overlay">
          <span>{{ overlayText }}</span>
        </div>

        <div v-if="mapInitialized" class="map-explorer__controls" aria-label="Map controls">
          <div class="map-explorer__basemap" role="group" aria-label="Base map">
            <button
              type="button"
              class="map-explorer__ctrl-btn"
              :class="{ 'is-active': mapTypeId === 'roadmap' }"
              @click="setMapType('roadmap')"
            >
              Road
            </button>
            <button
              type="button"
              class="map-explorer__ctrl-btn"
              :class="{ 'is-active': mapTypeId === 'hybrid' }"
              @click="setMapType('hybrid')"
            >
              Satellite
            </button>
          </div>
          <div class="map-explorer__zoom" role="group" aria-label="Zoom">
            <button type="button" class="map-explorer__ctrl-btn map-explorer__ctrl-btn--icon" aria-label="Zoom in" @click="zoomBy(1)">
              +
            </button>
            <button type="button" class="map-explorer__ctrl-btn map-explorer__ctrl-btn--icon" aria-label="Zoom out" @click="zoomBy(-1)">
              −
            </button>
          </div>
          <div class="map-explorer__locate" role="group" aria-label="Location">
            <button
              type="button"
              class="map-explorer__ctrl-btn map-explorer__ctrl-btn--icon"
              aria-label="Locate me"
              title="Locate me"
              :disabled="locatingMe"
              @click="locateMe"
            >
              <Icon icon="mdi:crosshairs-gps" width="18" height="18" />
            </button>
          </div>
        </div>

        <GoogleMap
          v-if="mapInitialized"
          ref="mapRef"
          :api-promise="mapsApiPromise"
          class="map-explorer__map"
          :center="mapCenter"
          :zoom="mapZoom"
          :styles="mapStyles"
          :map-type-id="mapTypeId"
          :street-view-control="false"
          :fullscreen-control="true"
          :map-type-control="false"
          :zoom-control="false"
          @idle="onMapIdle"
          @click="closePopup"
        >
          <template #default="{ ready }">
            <InfoWindow
              v-if="ready && popupPosition && (popupDetail || popupLoading || popupTitleHint)"
              :options="popupWindowOptions"
              @closeclick="closePopup"
            >
              <div class="kesmis-map-popup">
                <p class="kesmis-map-popup__eyebrow">{{ isProjects ? 'Project' : 'Settlement' }}</p>
                <h2 class="kesmis-map-popup__title">{{ popupHeading }}</h2>
                <div v-if="popupLoading" class="kesmis-map-popup__loading">Loading details…</div>
                <template v-else-if="popupDetail && isProjects">
                  <p v-if="popupDetail.location_name" class="kesmis-map-popup__subtitle">
                    {{ popupDetail.location_name }}
                  </p>
                  <p class="kesmis-map-popup__meta">
                    <span
                      v-if="popupDetail.project?.status"
                      class="kesmis-map-popup__badge"
                    >{{ popupDetail.project.status }}</span>
                    <span
                      v-if="popupDetail.project?.status && popupDetail.physical_progress_pct != null"
                      class="kesmis-map-popup__dot"
                      aria-hidden="true"
                    >·</span>
                    <span v-if="popupDetail.physical_progress_pct != null">
                      {{ Number(popupDetail.physical_progress_pct) }}% complete
                    </span>
                  </p>
                  <p v-if="popupPlaceLine" class="kesmis-map-popup__place">{{ popupPlaceLine }}</p>
                </template>
                <template v-else-if="popupDetail">
                  <p class="kesmis-map-popup__meta">
                    <span v-if="popupDetail.settlement_type">{{ popupDetail.settlement_type }}</span>
                    <span
                      v-if="popupDetail.settlement_type && popupDetail.population != null"
                      class="kesmis-map-popup__dot"
                      aria-hidden="true"
                    >·</span>
                    <span v-if="popupDetail.population != null">
                      Pop. {{ Number(popupDetail.population).toLocaleString() }}
                    </span>
                    <span
                      v-if="!popupDetail.settlement_type && popupDetail.population == null"
                    >Details unavailable</span>
                  </p>
                  <p v-if="popupPlaceLine" class="kesmis-map-popup__place">{{ popupPlaceLine }}</p>
                </template>
              </div>
            </InfoWindow>
          </template>
        </GoogleMap>
      </div>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useHead } from '@unhead/vue'
import { ElButton, ElInput, ElMessage, ElOption, ElSelect } from 'element-plus'
import { Icon } from '@iconify/vue'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import { GoogleMap, InfoWindow } from 'vue3-google-map'
import BaseLayout from './BaseLayout.vue'
import { loadGoogleMapsApi } from '@/composables/useGoogleMapsLoader'
import { useAppStoreWithOut } from '@/store/modules/app'
import {
  getPublicProjectLocation,
  getPublicProjectsMap,
  getPublicRegisterCounties,
  getPublicRegisterSettlement,
  getPublicRegisterSettlementsMap,
  getPublicRegisterSubcounties,
  getPublicRegisterWards,
} from '@/api/register-public'
import { INSTITUTION, PUBLIC_PAGES } from './config/landing.config'
import { landingRoadmapStyles } from './utils/mapStyles'

type ExplorerMode = 'settlements' | 'projects'
type MapMarker = {
  id: number
  title: string
  locationName?: string
  position: google.maps.LatLngLiteral
}

const route = useRoute()
const appStore = useAppStoreWithOut()
const isDark = computed(() => appStore.getIsDark)
const mapStyles = computed(() =>
  mapTypeId.value === 'roadmap' ? landingRoadmapStyles(isDark.value) : null
)

const MAP_INITIAL_CENTER = { lat: 0.1765, lng: 37.913 }
const MAP_INITIAL_ZOOM = 6

const mode = computed<ExplorerMode>(() =>
  route.path.startsWith('/projects') ? 'projects' : 'settlements'
)
const isProjects = computed(() => mode.value === 'projects')
const modeLabel = computed(() => (isProjects.value ? 'Project' : 'Settlement'))
const modeBlurb = computed(() =>
  isProjects.value
    ? 'Browse projects on the map. Click a marker for details.'
    : 'Browse settlements on the map. Zoom in for boundaries.'
)

const isCompact = ref(false)
/** Filters panel open — always true on desktop; collapsed by default on mobile. */
const sidebarOpen = ref(true)

const syncCompact = () => {
  const compact = window.innerWidth <= 900
  const wasCompact = isCompact.value
  isCompact.value = compact
  if (compact && !wasCompact) sidebarOpen.value = false
  if (!compact) sidebarOpen.value = true
}

useHead({
  title: computed(() => `${modeLabel.value} explorer | ${INSTITUTION.systemName}`),
  meta: [
    {
      name: 'description',
      content: computed(() =>
        isProjects.value
          ? 'Explore intervention project locations across Kenya on an interactive clustered map.'
          : 'Explore informal settlements across Kenya on an interactive clustered map.'
      ),
    },
  ],
})

const mapsApiPromise = loadGoogleMapsApi().then(() => (window as any).google)
const mapRef = ref<{ map?: google.maps.Map } | null>(null)
const mapInitialized = ref(false)
const mapReady = ref(false)
const mapLoading = ref(false)
const mapCenter = ref({ ...MAP_INITIAL_CENTER })
const mapZoom = ref(MAP_INITIAL_ZOOM)
const mapTypeId = ref<'roadmap' | 'hybrid'>('roadmap')
const geojson = ref<{ type: string; features: any[] }>({ type: 'FeatureCollection', features: [] })

const searchKeyword = ref('')
const selectedCounty = ref<number | null>(null)
const selectedSubcounty = ref<number | null>(null)
const selectedWard = ref<number | null>(null)
const countyOptions = ref<Array<{ value: number; label: string }>>([])
const subcountyOptions = ref<Array<{ value: number; label: string }>>([])
const wardOptions = ref<Array<{ value: number; label: string }>>([])

const popupDetail = ref<any>(null)
const popupPosition = ref<{ lat: number; lng: number } | null>(null)
const popupLoading = ref(false)
const popupTitleHint = ref('')
let popupRequestId = 0
let loadSeq = 0

let clusterer: MarkerClusterer | null = null
let gMarkers: google.maps.Marker[] = []
let gPolygons: Array<google.maps.Polygon | google.maps.Polyline> = []
let polygonLoadSeq = 0
let polygonFetchTimer: ReturnType<typeof setTimeout> | null = null
let userLocationMarker: google.maps.Marker | null = null
const locatingMe = ref(false)
const LOCATE_ZOOM = 14

/** Show settlement boundary polygons at this zoom and above */
const MIN_ZOOM_FOR_POLYGONS = 12

function ringToPath(ring: number[][]): google.maps.LatLngLiteral[] {
  return ring
    .filter((c) => Array.isArray(c) && c.length >= 2)
    .map(([lng, lat]) => ({ lat: Number(lat), lng: Number(lng) }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
}

function geometryToPolygonPaths(geometry: any): google.maps.LatLngLiteral[][] {
  if (!geometry?.type || !geometry?.coordinates) return []
  if (geometry.type === 'Polygon') {
    const outer = geometry.coordinates?.[0]
    return Array.isArray(outer) ? [ringToPath(outer)] : []
  }
  if (geometry.type === 'MultiPolygon') {
    return (geometry.coordinates || [])
      .map((poly: number[][][]) => (Array.isArray(poly?.[0]) ? ringToPath(poly[0]) : []))
      .filter((path: google.maps.LatLngLiteral[]) => path.length >= 3)
  }
  return []
}

function clearSettlementPolygons() {
  gPolygons.forEach((poly) => {
    try {
      google.maps.event.clearInstanceListeners(poly)
      poly.setMap(null)
    } catch {
      /* ignore */
    }
  })
  gPolygons = []
}

function getViewportBbox(): { west: number; south: number; east: number; north: number } | null {
  const map = getGoogleMap()
  const bounds = map?.getBounds?.()
  if (!bounds) return null
  const ne = bounds.getNorthEast()
  const sw = bounds.getSouthWest()
  return {
    west: sw.lng(),
    south: sw.lat(),
    east: ne.lng(),
    north: ne.lat(),
  }
}

function drawSettlementPolygons(features: any[]) {
  const map = getGoogleMap()
  if (!map || !window.google?.maps) return
  clearSettlementPolygons()

  const stroke = '#c62828'
  const dashIcon: google.maps.IconSequence = {
    icon: {
      path: 'M 0,-1 0,1',
      strokeOpacity: 1,
      strokeColor: stroke,
      scale: 2.2,
    },
    offset: '0',
    repeat: '8px',
  }

  for (const feature of features) {
    const paths = geometryToPolygonPaths(feature?.geometry)
    if (!paths.length) continue
    const id = Number(feature?.properties?.id)
    const name = String(feature?.properties?.name || '')
    // Transparent fill polygon for hit-testing / clicks
    const poly = new google.maps.Polygon({
      paths,
      map,
      strokeColor: stroke,
      strokeOpacity: 0,
      strokeWeight: 0,
      fillColor: stroke,
      fillOpacity: 0,
      clickable: true,
      zIndex: 2,
    })
    // Red dotted outline (Google Maps Polygon has no dash style; use Polyline icons)
    for (const ring of paths) {
      const line = new google.maps.Polyline({
        path: ring,
        map,
        clickable: false,
        strokeOpacity: 0,
        strokeWeight: 2,
        zIndex: 3,
        icons: [dashIcon],
      })
      gPolygons.push(line)
    }
    if (Number.isFinite(id)) {
      poly.addListener('click', (e: google.maps.MapMouseEvent) => {
        const latLng = e.latLng
        if (!latLng) return
        onMarkerClick({
          id,
          title: name,
          locationName: '',
          position: { lat: latLng.lat(), lng: latLng.lng() },
        })
      })
    }
    gPolygons.push(poly)
  }
}

async function loadSettlementPolygonsForView() {
  if (isProjects.value) {
    clearSettlementPolygons()
    return
  }
  const map = getGoogleMap()
  if (!map || !mapReady.value) return

  const zoom = map.getZoom() ?? mapZoom.value
  mapZoom.value = zoom
  if (zoom < MIN_ZOOM_FOR_POLYGONS) {
    clearSettlementPolygons()
    return
  }

  const bbox = getViewportBbox()
  if (!bbox) return

  const seq = ++polygonLoadSeq
  try {
    const searchTerm = searchKeyword.value?.trim() || ''
    const fc = await getPublicRegisterSettlementsMap({
      county_id: selectedCounty.value ?? undefined,
      subcounty_id: selectedSubcounty.value ?? undefined,
      ward_id: selectedWard.value ?? undefined,
      search: searchTerm || undefined,
      polygons: true,
      limit: 300,
      ...bbox,
    })
    if (seq !== polygonLoadSeq) return
    const features = (fc?.features || []).filter(
      (f: any) => f?.geometry?.type === 'Polygon' || f?.geometry?.type === 'MultiPolygon'
    )
    drawSettlementPolygons(features)
  } catch (e) {
    if (seq !== polygonLoadSeq) return
    console.warn('Settlement polygons load failed', e)
  }
}

function schedulePolygonLoad() {
  if (polygonFetchTimer) clearTimeout(polygonFetchTimer)
  polygonFetchTimer = setTimeout(() => {
    polygonFetchTimer = null
    loadSettlementPolygonsForView()
  }, 400)
}

const markers = computed<MapMarker[]>(() => {
  const features = geojson.value?.features ?? []
  return features
    .filter((f: any) => f?.geometry?.type === 'Point' && Array.isArray(f.geometry.coordinates))
    .map((f: any) => {
      const props = f.properties || {}
      return {
        id: Number(props.id),
        title: String(
          isProjects.value
            ? props.title || props.location_name || ''
            : props.name || ''
        ),
        locationName: String(props.location_name || ''),
        position: {
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
        } as google.maps.LatLngLiteral,
      }
    })
    .filter((m) => Number.isFinite(m.id))
})

const popupHeading = computed(() => {
  if (isProjects.value) {
    return (
      popupDetail.value?.project?.title
      || popupDetail.value?.location_name
      || popupDetail.value?.name
      || popupTitleHint.value
      || 'Project location'
    )
  }
  return popupDetail.value?.name || popupTitleHint.value || 'Settlement'
})

const popupPlaceLine = computed(() => {
  const s = popupDetail.value
  if (!s) return ''
  if (isProjects.value) {
    return [s.county?.name, s.settlement?.name || s.subcounty?.name].filter(Boolean).join(' · ')
  }
  return [s.county?.name, s.subcounty?.name, s.ward?.name].filter(Boolean).join(' · ')
})

const popupWindowOptions = computed(() => ({
  position: popupPosition.value || undefined,
  maxWidth: 300,
  headerDisabled: true,
}))

const statusText = computed(() => {
  if (mapLoading.value) return isProjects.value ? 'Loading projects…' : 'Loading settlements…'
  const n = markers.value.length
  if (!n) {
    return isProjects.value
      ? 'No project locations match the current filters.'
      : 'No settlements match the current filters.'
  }
  return isProjects.value
    ? `${n.toLocaleString()} project location${n === 1 ? '' : 's'} on the map`
    : `${n.toLocaleString()} settlement${n === 1 ? '' : 's'} on the map`
})

const overlayText = computed(() => {
  if (!mapInitialized.value) return 'Preparing map…'
  return isProjects.value ? 'Loading projects…' : 'Loading settlements…'
})

function getGoogleMap(): google.maps.Map | null {
  return mapRef.value?.map ?? null
}

function clearMapMarkers() {
  try {
    clusterer?.clearMarkers()
    clusterer?.setMap(null)
  } catch {
    /* ignore */
  }
  clusterer = null
  gMarkers.forEach((m) => {
    try {
      google.maps.event.clearInstanceListeners(m)
      m.setMap(null)
    } catch {
      /* ignore */
    }
  })
  gMarkers = []
}

function fitToMarkers() {
  const map = getGoogleMap()
  const list = markers.value
  if (!map || !window.google?.maps || !list.length) return
  try {
    if (!map.getBounds()) return
    if (list.length === 1) {
      map.setCenter(list[0].position)
      map.setZoom(12)
      mapCenter.value = { ...list[0].position }
      mapZoom.value = 12
      return
    }
    const bounds = new google.maps.LatLngBounds()
    list.forEach((m) => bounds.extend(m.position))
    map.fitBounds(bounds, 48)
    // Keep Vue bindings in sync after fit settles
    google.maps.event.addListenerOnce(map, 'idle', () => {
      const c = map.getCenter()
      const z = map.getZoom()
      if (c) mapCenter.value = { lat: c.lat(), lng: c.lng() }
      if (typeof z === 'number') mapZoom.value = z
    })
  } catch (e) {
    console.warn('fitToMarkers skipped', e)
  }
}

function syncMarkersToMap(opts: { fit?: boolean } = {}) {
  const map = getGoogleMap()
  if (!map || !window.google?.maps || !mapReady.value) return

  clearMapMarkers()
  const list = markers.value
  gMarkers = list.map((item) => {
    const marker = new google.maps.Marker({
      position: item.position,
      title: item.title || undefined,
    })
    marker.addListener('click', () => onMarkerClick(item))
    return marker
  })
  clusterer = new MarkerClusterer({ map, markers: gMarkers })
  if (opts.fit !== false) fitToMarkers()
}

function captureMapViewport() {
  const map = getGoogleMap()
  if (!map) return
  try {
    const c = map.getCenter()
    const z = map.getZoom()
    if (c) mapCenter.value = { lat: c.lat(), lng: c.lng() }
    if (typeof z === 'number') mapZoom.value = z
  } catch {
    /* ignore */
  }
}

function applyMapTheme() {
  const map = getGoogleMap()
  if (!map) return
  try {
    map.setOptions({
      styles: mapTypeId.value === 'roadmap' ? landingRoadmapStyles(isDark.value) : [],
    })
  } catch (e) {
    console.warn('applyMapTheme skipped', e)
  }
}

function setMapType(type: 'roadmap' | 'hybrid') {
  mapTypeId.value = type
  const map = getGoogleMap()
  if (!map) return
  try {
    map.setMapTypeId(type)
    applyMapTheme()
  } catch (e) {
    console.warn('setMapType skipped', e)
  }
}

function zoomBy(delta: number) {
  const map = getGoogleMap()
  if (!map) return
  try {
    const current = map.getZoom()
    if (typeof current !== 'number') return
    const next = Math.min(20, Math.max(2, current + delta))
    map.setZoom(next)
    mapZoom.value = next
  } catch (e) {
    console.warn('zoomBy skipped', e)
  }
}

function clearUserLocationMarker() {
  if (!userLocationMarker) return
  try {
    userLocationMarker.setMap(null)
  } catch {
    /* ignore */
  }
  userLocationMarker = null
}

function showUserLocationMarker(pos: google.maps.LatLngLiteral) {
  const map = getGoogleMap()
  if (!map || !window.google?.maps) return
  if (userLocationMarker) {
    userLocationMarker.setPosition(pos)
    userLocationMarker.setMap(map)
    return
  }
  userLocationMarker = new google.maps.Marker({
    map,
    position: pos,
    clickable: false,
    zIndex: 10,
    title: 'Your location',
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: '#4285F4',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    },
  })
}

function locateMe() {
  if (!navigator.geolocation) {
    ElMessage.warning('Geolocation is not supported in this browser.')
    return
  }
  const map = getGoogleMap()
  if (!map) return
  locatingMe.value = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      locatingMe.value = false
      const pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }
      mapCenter.value = pos
      mapZoom.value = LOCATE_ZOOM
      try {
        map.panTo(pos)
        map.setZoom(LOCATE_ZOOM)
      } catch (e) {
        console.warn('locateMe pan skipped', e)
      }
      showUserLocationMarker(pos)
      schedulePolygonLoad()
    },
    (err) => {
      locatingMe.value = false
      if (err.code === err.PERMISSION_DENIED) {
        ElMessage.error('Location permission denied. Allow location access to use Locate me.')
      } else {
        ElMessage.error('Could not get your location. Try again.')
      }
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
  )
}

function onMapIdle() {
  const map = getGoogleMap()
  if (!map) return
  try {
    google.maps.event.trigger(map, 'resize')
  } catch {
    /* ignore */
  }
  applyMapTheme()
  captureMapViewport()
  if (!mapReady.value) {
    mapReady.value = true
    syncMarkersToMap({ fit: true })
    schedulePolygonLoad()
    return
  }
  if (!gMarkers.length && markers.value.length) {
    syncMarkersToMap({ fit: false })
  }
  schedulePolygonLoad()
}

async function loadCounties() {
  try {
    const res = await getPublicRegisterCounties()
    const data = res?.data || []
    countyOptions.value = data.map((c: { id: number; name: string }) => ({
      value: c.id,
      label: c.name,
    }))
  } catch (e) {
    console.error(e)
  }
}

async function onCountyChange() {
  selectedSubcounty.value = null
  selectedWard.value = null
  subcountyOptions.value = []
  wardOptions.value = []
  if (!selectedCounty.value) return
  try {
    const res = await getPublicRegisterSubcounties(selectedCounty.value)
    const data = res?.data || []
    subcountyOptions.value = data.map((s: { id: number; name: string }) => ({
      value: s.id,
      label: s.name,
    }))
  } catch (e) {
    console.error(e)
  }
}

async function onSubcountyChange() {
  selectedWard.value = null
  wardOptions.value = []
  if (!selectedSubcounty.value) return
  try {
    const res = await getPublicRegisterWards(selectedSubcounty.value)
    const data = res?.data || []
    wardOptions.value = data.map((w: { id: number; name: string }) => ({
      value: w.id,
      label: w.name,
    }))
  } catch (e) {
    console.error(e)
  }
}

async function loadMapData(opts: { fit?: boolean; quiet?: boolean } = {}) {
  const seq = ++loadSeq
  const quiet = opts.quiet === true
  const shouldFit = opts.fit !== false
  if (!quiet) mapLoading.value = true
  try {
    const searchTerm = searchKeyword.value?.trim() || ''
    const params = {
      county_id: selectedCounty.value ?? undefined,
      subcounty_id: selectedSubcounty.value ?? undefined,
      ward_id: selectedWard.value ?? undefined,
      search: searchTerm || undefined,
      limit: 2000,
    }
    const fc = isProjects.value
      ? await getPublicProjectsMap(params)
      : await getPublicRegisterSettlementsMap(params)
    if (seq !== loadSeq) return
    geojson.value =
      fc?.type === 'FeatureCollection'
        ? fc
        : { type: 'FeatureCollection', features: fc?.features ?? [] }
    await nextTick()
    syncMarkersToMap({ fit: shouldFit })
    if (!shouldFit) {
      // Re-assert preserved viewport so Vue Map props don't drift
      const map = getGoogleMap()
      if (map) {
        try {
          map.setCenter(mapCenter.value)
          map.setZoom(mapZoom.value)
        } catch {
          /* ignore */
        }
      }
    }
  } catch (e) {
    if (seq !== loadSeq) return
    console.error(e)
    geojson.value = { type: 'FeatureCollection', features: [] }
    clearMapMarkers()
    ElMessage.error(
      isProjects.value
        ? 'Failed to load projects on the map'
        : 'Failed to load settlements on the map'
    )
  } finally {
    if (seq === loadSeq && !quiet) mapLoading.value = false
  }
}

function applyFilters() {
  loadMapData({ fit: true })
  schedulePolygonLoad()
}

function resetFilters() {
  searchKeyword.value = ''
  selectedCounty.value = null
  selectedSubcounty.value = null
  selectedWard.value = null
  subcountyOptions.value = []
  wardOptions.value = []
  mapCenter.value = { ...MAP_INITIAL_CENTER }
  mapZoom.value = MAP_INITIAL_ZOOM
  closePopup()
  clearSettlementPolygons()
  const map = getGoogleMap()
  if (map) {
    try {
      map.setCenter(MAP_INITIAL_CENTER)
      map.setZoom(MAP_INITIAL_ZOOM)
    } catch {
      /* ignore */
    }
  }
  loadMapData({ fit: false })
}

function closePopup() {
  popupDetail.value = null
  popupPosition.value = null
  popupLoading.value = false
  popupTitleHint.value = ''
}

async function onMarkerClick(marker: MapMarker) {
  popupPosition.value = marker.position
  popupLoading.value = true
  popupDetail.value = null
  popupTitleHint.value = marker.title || marker.locationName || ''
  const requestId = ++popupRequestId
  try {
    const res = isProjects.value
      ? await getPublicProjectLocation(marker.id)
      : await getPublicRegisterSettlement(marker.id)
    if (requestId !== popupRequestId) return
    popupDetail.value = res?.data || res?.results || null
  } catch (e) {
    console.error(e)
    if (requestId === popupRequestId) {
      popupDetail.value = isProjects.value
        ? {
            name: marker.title || `Project location #${marker.id}`,
            location_name: marker.locationName || null,
          }
        : { name: marker.title || `Settlement #${marker.id}` }
    }
  } finally {
    if (requestId === popupRequestId) popupLoading.value = false
  }
}

function hydrateSearchFromRoute() {
  const q = typeof route.query.q === 'string' ? route.query.q : ''
  if (q) {
    searchKeyword.value = q
    return
  }
  const stored = sessionStorage.getItem('kesmis_landing_search')
  if (stored) {
    searchKeyword.value = stored
    sessionStorage.removeItem('kesmis_landing_search')
  }
}

watch(mode, () => {
  closePopup()
  selectedCounty.value = null
  selectedSubcounty.value = null
  selectedWard.value = null
  subcountyOptions.value = []
  wardOptions.value = []
  searchKeyword.value = ''
  clearSettlementPolygons()
  // Keep the same camera so Settlements ↔ Projects doesn't jump/flicker
  captureMapViewport()
  hydrateSearchFromRoute()
  loadMapData({ fit: false, quiet: true })
  schedulePolygonLoad()
})

watch(isDark, () => {
  applyMapTheme()
  if (gPolygons.length) schedulePolygonLoad()
})

onMounted(async () => {
  syncCompact()
  window.addEventListener('resize', syncCompact)
  hydrateSearchFromRoute()
  await loadCounties()
  try {
    await loadGoogleMapsApi()
    mapInitialized.value = true
    await loadMapData()
  } catch (e) {
    console.error(e)
    ElMessage.error('Google Maps failed to load')
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', syncCompact)
  if (polygonFetchTimer) clearTimeout(polygonFetchTimer)
  clearSettlementPolygons()
  clearMapMarkers()
  clearUserLocationMarker()
})
</script>

<style scoped>
.map-explorer {
  display: grid;
  grid-template-columns: minmax(260px, 320px) 1fr;
  min-height: calc(100vh - 120px);
  background: var(--gok-grey, #f7f8f8);
}

.map-explorer__sidebar {
  background: var(--gok-white, #fff);
  border-right: 1px solid var(--gok-border, #e2e6e4);
  padding: 1.25rem 1.15rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: auto;
}

.map-explorer__sidebar-head {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.map-explorer__tabs {
  display: flex;
  width: 100%;
  padding: 0.2rem;
  gap: 0.2rem;
  border-radius: 10px;
  background: var(--gok-grey, #f5f7f6);
  border: 1px solid var(--gok-border, #e2e6e4);
}

.map-explorer__tab {
  flex: 1 1 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.55rem 0.65rem;
  border-radius: 8px;
  text-decoration: none;
  color: var(--gok-muted, #5f6b66);
  font-size: 0.88rem;
  font-weight: 700;
  line-height: 1.2;
  transition: background 0.15s ease, color 0.15s ease;
}

.map-explorer__tab:hover {
  color: var(--gok-charcoal, #1f2933);
}

.map-explorer__tab.is-active {
  background: var(--gok-green, #00843d);
  color: #fff;
}

.map-explorer__sidebar-titles h1 {
  margin: 0 0 0.35rem;
  font-size: 1.25rem;
  color: var(--gok-charcoal, #1f2933);
}

.map-explorer__blurb {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.45;
  color: var(--gok-muted, #5f6b66);
}

.map-explorer__toggle {
  display: none;
  appearance: none;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  width: 100%;
  margin-top: 0.55rem;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--gok-border, #e2e6e4);
  border-radius: 8px;
  background: var(--gok-grey, #f5f7f6);
  color: var(--gok-charcoal, #1f2933);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 650;
  cursor: pointer;
}

.map-explorer__toolbar {
  display: none;
}

.map-explorer__back-btn {
  display: none;
}

.map-explorer__toggle:hover {
  border-color: var(--gok-green, #00843d);
  color: var(--gok-green, #00843d);
}

.map-explorer__panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
}

.map-explorer__filters {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.82rem;
  font-weight: 650;
  color: var(--gok-muted, #5f6b66);
}

.field :deep(.el-select),
.field :deep(.el-input) {
  width: 100%;
}

.map-explorer__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.map-explorer__status {
  margin: 0;
  font-size: 0.85rem;
  color: var(--gok-muted, #5f6b66);
}

.map-explorer__back {
  margin-top: auto;
  color: var(--gok-green, #1a6b2c);
  font-weight: 650;
  text-decoration: none;
  font-size: 0.9rem;
}

.map-explorer__back:hover {
  text-decoration: underline;
}

.map-explorer__map-wrap {
  position: relative;
  min-height: 480px;
}

.map-explorer__controls {
  position: absolute;
  top: 0.85rem;
  left: 0.85rem;
  right: auto;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  pointer-events: none;
}

.map-explorer__basemap,
.map-explorer__zoom,
.map-explorer__locate {
  display: flex;
  pointer-events: auto;
  overflow: hidden;
  border-radius: 8px;
  background: var(--gok-panel, #fff);
  border: 1px solid var(--gok-border, #e2e6e4);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.14);
}

.map-explorer__zoom {
  flex-direction: column;
}

.map-explorer__ctrl-btn {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--gok-charcoal, #1f2933);
  font: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  line-height: 1;
  transition: background 0.15s ease, color 0.15s ease;
}

.map-explorer__ctrl-btn + .map-explorer__ctrl-btn {
  border-left: 1px solid var(--gok-border, #e2e6e4);
}

.map-explorer__zoom .map-explorer__ctrl-btn + .map-explorer__ctrl-btn {
  border-left: 0;
  border-top: 1px solid var(--gok-border, #e2e6e4);
}

.map-explorer__ctrl-btn--icon {
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  font-size: 1.15rem;
  font-weight: 600;
}

.map-explorer__ctrl-btn:hover {
  background: var(--gok-grey, #f5f7f6);
}

.map-explorer__ctrl-btn.is-active {
  background: var(--gok-green, #00843d);
  color: #fff;
}

.map-explorer__ctrl-btn:disabled {
  opacity: 0.65;
  cursor: wait;
}

.map-explorer__locate .map-explorer__ctrl-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.map-explorer__map {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 120px);
}

.map-explorer__overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(247, 248, 248, 0.72);
  color: var(--gok-charcoal, #1f2933);
  font-weight: 600;
  pointer-events: none;
}

@media (max-width: 900px) {
  .map-explorer {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .map-explorer__sidebar {
    border-right: 0;
    border-bottom: 1px solid var(--gok-border, #e2e6e4);
    padding: 0.85rem 1rem;
    gap: 0.65rem;
    overflow: visible;
  }

  .map-explorer__sidebar-head {
    flex-direction: column;
    gap: 0.15rem;
  }

  .map-explorer__sidebar-titles h1 {
    font-size: 1.1rem;
    margin-bottom: 0.15rem;
  }

  .map-explorer__blurb {
    font-size: 0.85rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .map-explorer__toolbar {
    display: flex;
    align-items: stretch;
    gap: 0.5rem;
    width: 100%;
    margin-top: 0.45rem;
  }

  .map-explorer__back-btn,
  .map-explorer__toggle {
    display: inline-flex;
    appearance: none;
    align-items: center;
    justify-content: center;
    gap: 0.2rem;
    margin-top: 0;
    padding: 0.55rem 0.5rem;
    border: 1px solid var(--gok-border, #e2e6e4);
    border-radius: 8px;
    background: var(--gok-grey, #f5f7f6);
    color: var(--gok-charcoal, #1f2933);
    font: inherit;
    font-size: 0.82rem;
    font-weight: 650;
    text-decoration: none;
    line-height: 1.1;
    cursor: pointer;
    box-sizing: border-box;
  }

  .map-explorer__back-btn {
    flex: 1 1 33.333%;
    min-width: 0;
  }

  .map-explorer__toggle {
    flex: 2 1 66.666%;
    min-width: 0;
    width: auto;
  }

  .map-explorer__back-btn:hover,
  .map-explorer__toggle:hover {
    border-color: var(--gok-green, #00843d);
    color: var(--gok-green, #00843d);
  }

  .map-explorer__panel .map-explorer__back {
    display: none;
  }

  .map-explorer__panel {
    overflow: hidden;
    transition: max-height 0.25s ease, opacity 0.2s ease, margin 0.2s ease;
    max-height: 70vh;
    opacity: 1;
  }

  .map-explorer__panel.is-collapsed {
    max-height: 0;
    opacity: 0;
    margin: 0;
    pointer-events: none;
  }

  .map-explorer__map {
    min-height: 70vh;
  }

  .map-explorer--sidebar-open .map-explorer__map {
    min-height: 55vh;
  }
}
</style>
