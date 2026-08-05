<template>
  <BaseLayout>
    <div class="map-explorer">
      <aside class="map-explorer__sidebar" :aria-label="`${modeLabel} filters`">
        <div class="map-explorer__sidebar-head">
          <h1>{{ modeLabel }} explorer</h1>
          <p>{{ modeBlurb }}</p>
        </div>

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
      </aside>

      <div class="map-explorer__map-wrap">
        <div v-if="!mapInitialized || mapLoading" class="map-explorer__overlay">
          <span>{{ overlayText }}</span>
        </div>

        <GoogleMap
          v-if="mapInitialized"
          ref="mapRef"
          :api-promise="mapsApiPromise"
          class="map-explorer__map"
          :center="mapCenter"
          :zoom="mapZoom"
          :styles="mapStyles"
          map-type-id="roadmap"
          :street-view-control="false"
          :fullscreen-control="true"
          :map-type-control="false"
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
import { INSTITUTION } from './config/landing.config'
import { LANDING_DARK_MAP_STYLES } from './utils/mapStyles'

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
const mapStyles = computed(() => (isDark.value ? LANDING_DARK_MAP_STYLES : null))

const MAP_INITIAL_CENTER = { lat: 0.1765, lng: 37.913 }
const MAP_INITIAL_ZOOM = 6

const mode = computed<ExplorerMode>(() =>
  route.path.startsWith('/projects') ? 'projects' : 'settlements'
)
const isProjects = computed(() => mode.value === 'projects')
const modeLabel = computed(() => (isProjects.value ? 'Project' : 'Settlement'))
const modeBlurb = computed(() =>
  isProjects.value
    ? 'Browse intervention project locations on the map. Click a cluster to zoom in, or a marker for details.'
    : 'Browse informal settlements on the map. Click a cluster to zoom in, or a marker for details.'
)

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
      return
    }
    const bounds = new google.maps.LatLngBounds()
    list.forEach((m) => bounds.extend(m.position))
    map.fitBounds(bounds, 48)
  } catch (e) {
    console.warn('fitToMarkers skipped', e)
  }
}

function syncMarkersToMap() {
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
  fitToMarkers()
}

function applyMapTheme() {
  const map = getGoogleMap()
  if (!map) return
  try {
    map.setOptions({ styles: isDark.value ? LANDING_DARK_MAP_STYLES : [] })
  } catch (e) {
    console.warn('applyMapTheme skipped', e)
  }
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
  if (!mapReady.value) {
    mapReady.value = true
    syncMarkersToMap()
    return
  }
  if (!gMarkers.length && markers.value.length) {
    syncMarkersToMap()
  }
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

async function loadMapData() {
  const seq = ++loadSeq
  mapLoading.value = true
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
    syncMarkersToMap()
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
    if (seq === loadSeq) mapLoading.value = false
  }
}

function applyFilters() {
  loadMapData()
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
  loadMapData()
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
  hydrateSearchFromRoute()
  loadMapData()
})

watch(isDark, () => {
  applyMapTheme()
})

onMounted(async () => {
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
  clearMapMarkers()
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

.map-explorer__sidebar-head h1 {
  margin: 0 0 0.4rem;
  font-size: 1.25rem;
  color: var(--gok-charcoal, #1f2933);
}

.map-explorer__sidebar-head p {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.45;
  color: var(--gok-muted, #5f6b66);
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

  .map-explorer__map {
    min-height: 65vh;
  }
}
</style>
