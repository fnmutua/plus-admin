<template>
  <div class="community-issue-location-picker">
    <p v-if="!readonly" class="picker-hint">Click inside the settlement outline to mark where the issue is.</p>

    <div class="map-shell" :style="{ height: `${props.mapHeight}px` }">
      <div ref="mapContainer" class="map-container"></div>
      <div v-if="mapLoading" class="map-overlay">Loading map…</div>
      <div v-else-if="mapLoadError" class="map-overlay map-overlay--error">{{ mapLoadError }}</div>
    </div>

    <p v-if="boundaryLoadFailed && !mapLoadError" class="boundary-warning">
      Settlement boundary could not be loaded. You can still place a marker on the map.
    </p>
    <div v-if="latitude && longitude && showCoordinates" class="coords-row">
      <span>Lat: {{ latitude }}</span>
      <span>Lng: {{ longitude }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as turf from '@turf/turf'
import { ElMessage } from 'element-plus'
import { getOneGeo } from '@/api/settlements'
import { loadGoogleMapsApi } from '@/composables/useGoogleMapsLoader'
import { GOOGLE_MAPS_API_KEY } from '@/config/googleMaps'

declare global {
  interface Window {
    google: any
  }
}

const props = withDefaults(
  defineProps<{
    visible?: boolean
    latitude?: string
    longitude?: string
    settlementId?: number
    readonly?: boolean
    showCoordinates?: boolean
    mapHeight?: number
  }>(),
  {
    visible: false,
    latitude: '',
    longitude: '',
    settlementId: undefined,
    readonly: false,
    showCoordinates: false,
    mapHeight: 260,
  }
)

const emit = defineEmits<{
  'update:latitude': [value: string]
  'update:longitude': [value: string]
}>()

const mapContainer = ref<HTMLElement | null>(null)
const boundaryLoadFailed = ref(false)
const mapLoading = ref(false)
const mapLoadError = ref('')

let map: any = null
let marker: any = null
let settlementPolygon: any = null
let mapClickListener: any = null
let settlementFeatureCollection: GeoJSON.FeatureCollection | null = null
let boundaryRequestId = 0
let activating = false

function parseCoord(value?: string) {
  const num = Number(String(value || '').trim())
  return Number.isFinite(num) ? num : null
}

function emitCoords(lng: number, lat: number) {
  emit('update:latitude', lat.toFixed(6))
  emit('update:longitude', lng.toFixed(6))
}

function normalizeGeometry(geometry: any) {
  if (!geometry) return null
  let parsed = geometry
  if (typeof geometry === 'string') {
    try {
      parsed = JSON.parse(geometry)
    } catch {
      return null
    }
  }
  if (!parsed?.type || !parsed?.coordinates) return null
  return parsed
}

function normalizeFeatureCollection(input: any): GeoJSON.FeatureCollection | null {
  if (!input) return null

  let fc = input
  if (input.type === 'Feature') {
    fc = { type: 'FeatureCollection', features: [input] }
  }

  if (fc.type !== 'FeatureCollection' || !Array.isArray(fc.features)) {
    return null
  }

  const features = fc.features
    .map((feature: any) => {
      const geometry = normalizeGeometry(feature?.geometry)
      if (!geometry) return null
      if (!['Polygon', 'MultiPolygon'].includes(geometry.type)) return null
      return {
        type: 'Feature',
        geometry,
        properties: feature?.properties || {},
      } as GeoJSON.Feature
    })
    .filter(Boolean) as GeoJSON.Feature[]

  if (!features.length) return null
  return { type: 'FeatureCollection', features }
}

function parseSettlementGeo(res: any): GeoJSON.FeatureCollection | null {
  const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
  const fromRow = normalizeFeatureCollection(rows[0]?.json_build_object)
  if (fromRow) return fromRow

  const payload = res?.data && !Array.isArray(res.data) ? res.data : res
  const geom = payload?.geom || payload?.geometry
  return normalizeFeatureCollection(
    geom
      ? {
          type: 'FeatureCollection',
          features: [{ type: 'Feature', geometry: geom, properties: {} }],
        }
      : null
  )
}

function pathsFromGeometry(geometry: GeoJSON.Geometry): Array<{ lat: number; lng: number }> {
  if (geometry.type === 'Polygon') {
    return geometry.coordinates[0].map(([lng, lat]) => ({ lat, lng }))
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates[0][0].map(([lng, lat]) => ({ lat, lng }))
  }
  return []
}

function isInsideSettlement(lng: number, lat: number) {
  if (!settlementFeatureCollection?.features?.length) return true

  const point = turf.point([lng, lat])
  return settlementFeatureCollection.features.some((feature) => {
    if (!feature.geometry) return false
    try {
      return turf.booleanPointInPolygon(point, feature as any)
    } catch {
      return false
    }
  })
}

function isInsideSettlementGoogle(latLng: any) {
  if (!settlementPolygon || !window.google?.maps?.geometry?.poly?.containsLocation) {
    return isInsideSettlement(latLng.lng(), latLng.lat())
  }
  return window.google.maps.geometry.poly.containsLocation(latLng, settlementPolygon)
}

function clearSettlementBoundary() {
  if (settlementPolygon) {
    settlementPolygon.setMap(null)
    settlementPolygon = null
  }
  settlementFeatureCollection = null
}

function drawSettlementBoundary(fc: GeoJSON.FeatureCollection) {
  if (!map || !window.google?.maps) return

  clearSettlementBoundary()
  settlementFeatureCollection = fc
  boundaryLoadFailed.value = false

  const feature = fc.features[0]
  const geometry = feature?.geometry
  if (!geometry || !['Polygon', 'MultiPolygon'].includes(geometry.type)) {
    boundaryLoadFailed.value = true
    return
  }

  const paths = pathsFromGeometry(geometry)
  if (!paths.length) {
    boundaryLoadFailed.value = true
    return
  }

  settlementPolygon = new window.google.maps.Polygon({
    paths,
    strokeColor: '#000000',
    strokeOpacity: 1,
    strokeWeight: 2,
    fillColor: '#000000',
    fillOpacity: 0.05,
    map,
    clickable: false,
    draggable: false,
  })

  const bounds = new window.google.maps.LatLngBounds()
  paths.forEach((path) => bounds.extend(path))
  map.fitBounds(bounds)
  resizeMapSoon()
}

function placeMarker(lat: number, lng: number) {
  if (!map || !window.google?.maps) return

  const position = { lat, lng }

  if (!marker) {
    marker = new window.google.maps.Marker({
      position,
      map,
      draggable: !props.readonly,
      icon: {
        url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
        scaledSize: new window.google.maps.Size(36, 36),
      },
      zIndex: 1000,
    })

    if (!props.readonly) {
      marker.addListener('dragend', (event: any) => {
        const latLng = event.latLng
        if (!isInsideSettlementGoogle(latLng)) {
          ElMessage.warning('Marker must stay inside the settlement boundary')
          const latPrev = parseCoord(props.latitude)
          const lngPrev = parseCoord(props.longitude)
          if (latPrev != null && lngPrev != null) {
            marker.setPosition({ lat: latPrev, lng: lngPrev })
          } else {
            marker.setMap(null)
            marker = null
          }
          return
        }
        emitCoords(latLng.lng(), latLng.lat())
      })
    }
  } else {
    marker.setPosition(position)
    marker.setMap(map)
  }
}

function tryPlaceMarker(lat: number, lng: number) {
  if (!isInsideSettlement(lng, lat)) {
    ElMessage.warning('Please place the marker inside the settlement boundary')
    return
  }
  placeMarker(lat, lng)
  emitCoords(lng, lat)
}

function syncMarkerFromProps() {
  const lat = parseCoord(props.latitude)
  const lng = parseCoord(props.longitude)
  if (lat == null || lng == null) return
  if (isInsideSettlement(lng, lat)) {
    placeMarker(lat, lng)
  }
}

function bindMapClick() {
  if (!map || props.readonly || mapClickListener) return
  mapClickListener = map.addListener('click', (event: any) => {
    tryPlaceMarker(event.latLng.lat(), event.latLng.lng())
  })
}

function unbindMapClick() {
  if (mapClickListener) {
    window.google?.maps?.event?.removeListener(mapClickListener)
    mapClickListener = null
  }
}

function resizeMapSoon() {
  requestAnimationFrame(() => {
    if (map && window.google?.maps?.event) {
      window.google.maps.event.trigger(map, 'resize')
    }
    requestAnimationFrame(() => {
      if (map && window.google?.maps?.event) {
        window.google.maps.event.trigger(map, 'resize')
      }
    })
  })
}

async function loadSettlementBoundary(settlementId?: number) {
  const requestId = ++boundaryRequestId
  boundaryLoadFailed.value = false

  if (!settlementId || !map) {
    clearSettlementBoundary()
    return
  }

  try {
    const res: any = await getOneGeo({ model: 'settlement', id: settlementId } as any)
    if (requestId !== boundaryRequestId || !map) return

    const fc = parseSettlementGeo(res)
    if (!fc) {
      clearSettlementBoundary()
      boundaryLoadFailed.value = true
      return
    }

    drawSettlementBoundary(fc)
  } catch (error) {
    console.warn('[CommunityIssueLocationPicker] settlement geo load failed', error)
    if (requestId === boundaryRequestId) {
      clearSettlementBoundary()
      boundaryLoadFailed.value = true
    }
  }
}

function destroyMap() {
  boundaryRequestId++
  unbindMapClick()
  clearSettlementBoundary()
  if (marker) {
    marker.setMap(null)
    marker = null
  }
  map = null
  if (mapContainer.value) {
    mapContainer.value.innerHTML = ''
  }
}

async function initGoogleMap() {
  if (!mapContainer.value) {
    throw new Error('Map container is not available')
  }

  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key is not configured (VITE_GOOGLE_MAPS_API_KEY)')
  }

  await loadGoogleMapsApi()
  if (!window.google?.maps) {
    throw new Error('Google Maps failed to load')
  }

  if (map) {
    resizeMapSoon()
    return
  }

  const defaultCenter = { lat: -1.2921, lng: 36.8219 }
  map = new window.google.maps.Map(mapContainer.value, {
    center: defaultCenter,
    zoom: 6,
    mapTypeId: window.google.maps.MapTypeId.ROADMAP,
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: true,
    disableDoubleClickZoom: true,
  })

  bindMapClick()

  await new Promise<void>((resolve) => {
    window.google.maps.event.addListenerOnce(map, 'idle', () => resolve())
  })

  resizeMapSoon()
}

async function activateMap() {
  if (!props.visible || activating) return
  activating = true
  mapLoadError.value = ''
  mapLoading.value = true
  boundaryLoadFailed.value = false

  try {
    await nextTick()
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 150))

    if (!props.visible) return

    await initGoogleMap()
    await loadSettlementBoundary(props.settlementId)
    syncMarkerFromProps()
  } catch (error: any) {
    console.error('[CommunityIssueLocationPicker] map init failed', error)
    mapLoadError.value =
      error?.message?.includes('API key')
        ? 'Google Maps API key is missing. Set VITE_GOOGLE_MAPS_API_KEY in .env.'
        : 'Could not load Google Maps. Check your connection and try again.'
    destroyMap()
  } finally {
    mapLoading.value = false
    activating = false
  }
}

function deactivateMap() {
  destroyMap()
  mapLoadError.value = ''
  boundaryLoadFailed.value = false
  mapLoading.value = false
  activating = false
}

function handleVisibleChange(visible: boolean) {
  if (visible) {
    void activateMap()
  } else {
    deactivateMap()
  }
}

watch(() => props.visible, handleVisibleChange, { immediate: true })

watch(
  () => props.settlementId,
  (settlementId) => {
    if (props.visible && map) {
      loadSettlementBoundary(settlementId)
    }
  }
)

watch(
  () => [props.latitude, props.longitude],
  () => {
    if (props.visible && map) {
      syncMarkerFromProps()
    }
  }
)

onMounted(() => {
  if (props.visible) {
    void activateMap()
  }
})

onBeforeUnmount(() => {
  deactivateMap()
})
</script>

<style scoped>
.community-issue-location-picker {
  width: 100%;
}

.picker-hint {
  margin: 0 0 8px;
  color: var(--el-text-color-secondary);
  font-size: 0.875rem;
}

.boundary-warning {
  margin: 8px 0 0;
  color: var(--el-color-warning);
  font-size: 0.8125rem;
}

.map-shell {
  position: relative;
  width: 100%;
}

.map-container {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color);
}

.map-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 0.875rem;
  text-align: center;
  padding: 12px;
}

.map-overlay--error {
  color: var(--el-color-danger);
  border: 1px solid var(--el-border-color);
}

.coords-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  color: var(--el-text-color-secondary);
  font-size: 0.8125rem;
}
</style>
