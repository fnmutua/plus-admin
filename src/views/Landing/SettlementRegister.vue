<template>
  <section id="register" class="settlement-register-section">
    <div class="section-container section-container--header">
      <div class="section-header">
        <h2 class="section-title">Settlement Register</h2>
        <p class="section-subtitle">
          Search and explore
          <el-popover placement="top" trigger="hover" :width="320" popper-class="register-help-popover">
            <template #reference>
              <span class="definition-trigger">slums</span>
            </template>
            <div class="register-help-definition">Densely populated settlements characterized by complete lack of secure tenure, overcrowding, substandard housing, inadequate infrastructure and services, high poverty levels, and exposure to environmental and social risks.</div>
          </el-popover>
          and
          <el-popover placement="top" trigger="hover" :width="320" popper-class="register-help-popover">
            <template #reference>
              <span class="definition-trigger">informal settlements</span>
            </template>
            <div class="register-help-definition">Residential areas developed outside approved planning and regulatory frameworks, typically with partially secure or insecure tenure, unapproved layouts, and limited access to basic services exhibiting slum-like conditions.</div>
          </el-popover>.
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
          <el-button type="primary" plain @click="router.push('/data-request')">
            <Icon icon="mdi:database-arrow-right" style="margin-right:4px" />
            Request Data
          </el-button>
          <el-button type="info" plain @click="helpDialogVisible = true">
            <Icon icon="mdi:help-circle-outline" class="help-icon" />
            Help
          </el-button>
        </div>
      </div>

      <el-dialog
        v-model="helpDialogVisible"
        title="How to use the Settlements register"
        width="480px"
        class="register-help-dialog"
        :show-close="false"
        :close-on-click-modal="true"
      >
        <template #header>
          <div class="register-help-dialog-header">
            <Icon icon="mdi:help-circle" class="register-help-dialog-header-icon" />
            <span>How to use the Settlements register</span>
          </div>
        </template>
        <div class="register-help-content">
          <p class="register-help-intro">
            Use the list and map to explore
            <el-popover placement="top" trigger="hover" :width="320" popper-class="register-help-popover">
              <template #reference>
                <span class="definition-trigger">slums</span>
              </template>
              <div class="register-help-definition">Densely populated settlements characterized by complete lack of secure tenure, overcrowding, substandard housing, inadequate infrastructure and services, high poverty levels, and exposure to environmental and social risks.</div>
            </el-popover>
            and
            <el-popover placement="top" trigger="hover" :width="320" popper-class="register-help-popover">
              <template #reference>
                <span class="definition-trigger">informal settlements</span>
              </template>
              <div class="register-help-definition">Residential areas developed outside approved planning and regulatory frameworks, typically with partially secure or insecure tenure, unapproved layouts, and limited access to basic services exhibiting slum-like conditions.</div>
            </el-popover>.
          </p>
          <h4><Icon icon="mdi:format-list-bulleted" class="register-help-heading-icon" /> List (table)</h4>
          <ul>
            <li>
              <Icon icon="mdi:magnify" class="register-help-li-icon" />
              Search by settlement name using the search box, or filter by County, Subcounty, and Ward.
            </li>
            <li>
              <Icon icon="mdi:reload" class="register-help-li-icon" />
              Click <strong>Search</strong> to update results. Use <strong>Reset</strong> to clear filters.
            </li>
            <li>
              <Icon icon="mdi:map-marker" class="register-help-li-icon" />
              Click <strong>View on map</strong> to open the Map tab at that settlement.
            </li>
          </ul>
          <h4><Icon icon="mdi:map" class="register-help-heading-icon" /> Map</h4>
          <ul>
            <li>
              <Icon icon="mdi:map-marker-radius" class="register-help-li-icon" />
              Select a county (or search by name) to load settlements on the map.
            </li>
            <li>
              <Icon icon="mdi:cursor-default-click" class="register-help-li-icon" />
              Click a point or boundary to see basic details in a popup.
            </li>
            <li>
              <Icon icon="mdi:satellite-variant" class="register-help-li-icon" />
              Switch between Streets and Satellite using the map control.
            </li>
          </ul>
          <h4><Icon icon="mdi:weather-tornado" class="register-help-heading-icon" /> Vulnerability</h4>
          <p class="register-help-note">
            Vulnerability scoring based on KISIP Tool A. Indicates a settlement's exposure to climate-related risks (e.g. floods, droughts) based on environmental and spatial factors. Ratings (LOW, MEDIUM, HIGH) help prioritise resilience planning. Learn more: <a :href="toolAUrl" target="_blank" rel="noopener noreferrer" class="register-help-register-link">KISIP Tool A</a>.
          </p>
          <p class="register-help-register">
            For more detailed data and full access to the platform, please
            <RouterLink :to="{ name: 'Register' }" class="register-help-register-link" @click="helpDialogVisible = false">
              register an account
            </RouterLink>.
          </p>
        </div>
        <template #footer>
          <div class="register-help-dialog-footer">
            <el-button class="close" @click="helpDialogVisible = false">Close</el-button>
          </div>
        </template>
      </el-dialog>

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
                  <el-table-column prop="name" min-width="180" show-overflow-tooltip>
                    <template #header>
                      <el-popover placement="top" trigger="hover" :width="280" popper-class="register-help-popover">
                        <template #reference>
                          <span class="table-header-trigger">Name</span>
                        </template>
                        <div class="register-help-definition">Official or commonly used name of the settlement.</div>
                      </el-popover>
                    </template>
                    <template #default="scope">{{ scope?.row?.name || '–' }}</template>
                  </el-table-column>
                  <el-table-column prop="population" width="120" align="right">
                    <template #header>
                      <el-popover placement="top" trigger="hover" :width="280" popper-class="register-help-popover">
                        <template #reference>
                          <span class="table-header-trigger">Population</span>
                        </template>
                        <div class="register-help-definition">Estimated number of residents in the settlement.</div>
                      </el-popover>
                    </template>
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
                  <el-table-column prop="settlement_type" min-width="120" show-overflow-tooltip>
                    <template #header>
                      <el-popover placement="top" trigger="hover" :width="320" popper-class="register-help-popover">
                        <template #reference>
                          <span class="table-header-trigger">Type</span>
                        </template>
                        <div class="register-help-definition">
                          <strong>Slum:</strong> Densely populated settlements characterized by complete lack of secure tenure, overcrowding, substandard housing, inadequate infrastructure and services, high poverty levels, and exposure to environmental and social risks.<br /><br />
                          <strong>Informal settlement:</strong> Residential areas developed outside approved planning and regulatory frameworks, typically with partially secure or insecure tenure, unapproved layouts, and limited access to basic services exhibiting slum-like conditions.
                        </div>
                      </el-popover>
                    </template>
                    <template #default="scope">{{ scope?.row?.settlement_type || '–' }}</template>
                  </el-table-column>
                  <el-table-column width="130">
                    <template #header>
                      <el-popover placement="top" trigger="hover" :width="320" popper-class="register-help-popover">
                        <template #reference>
                          <span class="table-header-trigger">Vulnerability</span>
                        </template>
                        <div class="register-help-definition">Vulnerability scoring based on KISIP Tool A. A settlement's exposure to climate-related risks (e.g. floods, droughts) based on environmental and spatial factors such as soil type, proximity to rivers and flood plains, and land cover. Ratings (LOW, MEDIUM, HIGH) help prioritise resilience planning and adaptation. Learn more: <a :href="toolAUrl" target="_blank" rel="noopener noreferrer" class="register-help-link">KISIP Tool A</a>.</div>
                      </el-popover>
                    </template>
                    <template #default="scope">
                      <el-tag v-if="scope?.row?.vulnerability_rating" :type="vulnerabilityRatingTagType(scope.row.vulnerability_rating)" size="small">
                        {{ scope.row.vulnerability_rating }}{{ scope?.row?.vulnerability_total_score != null ? ` (${scope.row.vulnerability_total_score})` : '' }}
                      </el-tag>
                      <span v-else>–</span>
                    </template>
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
            <GoogleMap
              v-if="mapInitialized"
              ref="mapRef"
              :api-key="GOOGLE_MAPS_API_KEY"
              class="register-map"
              :center="mapCenter"
              :zoom="mapZoom"
              :map-type-id="googleMapTypeId"
              :street-view-control="false"
              :fullscreen-control="true"
              :map-type-control="false"
              @click="closePopup"
            >
              <MarkerCluster v-if="settlementMarkers.length">
                <Marker
                  v-for="marker in settlementMarkers"
                  :key="marker.id"
                  :options="{ position: marker.position }"
                  @click.stop="onSettlementMarkerClick(marker)"
                />
              </MarkerCluster>
              <Polygon
                v-for="polygon in boundaryPolygons"
                :key="'boundary-' + polygon.id"
                :options="polygon.options"
                @click.stop="onBoundaryPolygonClick(polygon.id, $event)"
              />
              <template v-for="overlay in singleSettlementOverlays" :key="overlay.key">
                <Marker
                  v-if="overlay.type === 'marker'"
                  :options="{ position: overlay.position, icon: singleSettlementMarkerIcon }"
                  @click.stop="onSingleSettlementClick(overlay.settlementId, overlay.position)"
                />
                <Polygon
                  v-else
                  :options="overlay.options"
                  @click.stop="onSingleSettlementClick(overlay.settlementId, overlay.position)"
                />
              </template>
              <InfoWindow
                v-if="popupPosition && (popupSettlement || popupLoading)"
                :options="{ position: popupPosition, pixelOffset: popupPixelOffset }"
                @closeclick="closePopup"
              >
                <div
                  class="register-map-popup"
                  :class="{ 'register-map-popup--mobile': isMobileViewport }"
                >
                  <div v-if="popupLoading" class="register-popup register-popup--loading">Loading…</div>
                  <div v-else-if="popupSettlement" class="register-popup">
                    <header class="register-popup-header">
                      <h3 class="register-popup-title">{{ popupSettlement.name || 'Settlement' }}</h3>
                      <button type="button" class="register-popup-close" aria-label="Close" @click="closePopup">&times;</button>
                    </header>
                    <div class="register-popup-body">
                      <div class="register-popup-row">
                        <span class="register-popup-label">Type</span>
                        <span class="register-popup-value">{{ popupSettlement.settlement_type || '–' }}</span>
                      </div>
                      <div class="register-popup-row">
                        <span class="register-popup-label">Vulnerability</span>
                        <span class="register-popup-value">{{ popupVulnerabilityDisplay }}</span>
                      </div>
                      <div class="register-popup-row">
                        <span class="register-popup-label">Est. Population</span>
                        <span class="register-popup-value">{{ popupPopulationDisplay }}</span>
                      </div>
                      <div class="register-popup-row">
                        <span class="register-popup-label">County</span>
                        <span class="register-popup-value">{{ popupSettlement.county?.name || '–' }}</span>
                      </div>
                      <div class="register-popup-row">
                        <span class="register-popup-label">Subcounty</span>
                        <span class="register-popup-value">{{ popupSettlement.subcounty?.name || '–' }}</span>
                      </div>
                      <div class="register-popup-row">
                        <span class="register-popup-label">Ward</span>
                        <span class="register-popup-value">{{ popupSettlement.ward?.name || '–' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </InfoWindow>
            </GoogleMap>
            <button
              v-if="mapInitialized"
              type="button"
              class="register-style-switcher"
              :title="mapStyle === 'satellite' ? 'Map view' : 'Satellite view'"
              :aria-label="mapStyle === 'satellite' ? 'Switch to map view' : 'Switch to satellite view'"
              @click="toggleMapStyle"
            >
              <img
                class="register-style-switcher-icon"
                :src="mapStyle === 'satellite' ? STYLE_SWITCHER_ICONS.streets : STYLE_SWITCHER_ICONS.satellite"
                alt=""
                width="20"
                height="20"
              />
            </button>
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
import { useRouter } from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'
import {
  ElMessage,
  ElInput,
  ElButton,
  ElSelect,
  ElOption,
  ElTable,
  ElTableColumn,
  ElTag,
  ElPagination,
  ElTabs,
  ElTabPane,
  ElCard,
  ElDialog,
  ElPopover
} from 'element-plus'
import { Icon } from '@iconify/vue'
import { GoogleMap, Marker, MarkerCluster, Polygon, InfoWindow } from 'vue3-google-map'
import { GOOGLE_MAPS_API_KEY } from '@/config/googleMaps'
import { loadGoogleMapsApi } from '@/composables/useGoogleMapsLoader'
import {
  getPublicRegisterSettlements,
  getPublicRegisterSettlementsMap,
  getPublicRegisterSettlement,
  getPublicRegisterSettlementMap,
  getPublicRegisterCounties,
  getPublicRegisterSubcounties,
  getPublicRegisterWards
} from '@/api/register-public'

const toolAUrl = (import.meta.env.VITE_APP_HOST || '') + '/api/public/tool-a'

const mapRef = ref<{ map?: google.maps.Map } | null>(null)
const activeRegisterTab = ref<'table' | 'map'>('table')
const mapInitialized = ref(false)
const router = useRouter()
const appStore = useAppStoreWithOut()
const isDark = computed(() => appStore.getIsDark)
const isMobileViewport = computed(() => typeof window !== 'undefined' && window.innerWidth < 768)

const mapStyle = ref<'streets' | 'satellite'>('streets')
const currentSingleSettlementFeature = ref<any>(null)
const popupSettlement = ref<any>(null)
const popupPosition = ref<{ lat: number; lng: number } | null>(null)
const popupLoading = ref(false)
let popupRequestId = 0

const MAP_INITIAL_CENTER = { lat: 0.1765, lng: 37.913 }
const MAP_INITIAL_ZOOM = 5
const mapCenter = ref({ ...MAP_INITIAL_CENTER })
const mapZoom = ref(MAP_INITIAL_ZOOM)

const googleMapTypeId = computed(() => (mapStyle.value === 'satellite' ? 'hybrid' : 'roadmap'))

const STYLE_SWITCHER_ICONS = {
  streets: 'https://api.iconify.design/mdi/satellite-variant.svg',
  satellite: 'https://api.iconify.design/mdi/map.svg'
} as const

const singleSettlementMarkerIcon = computed(() => {
  if (!window.google?.maps?.SymbolPath) return undefined
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 10,
    fillColor: '#E6A23C',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2
  }
})

const popupPixelOffset = computed(() => {
  if (!window.google?.maps) return undefined
  return isMobileViewport.value
    ? new google.maps.Size(8, 0)
    : new google.maps.Size(12, 0)
})

const popupPopulationDisplay = computed(() =>
  popupSettlement.value?.population != null
    ? Number(popupSettlement.value.population).toLocaleString()
    : '–'
)

const popupVulnerabilityDisplay = computed(() => {
  const rating = popupSettlement.value?.vulnerability_rating
  const score = popupSettlement.value?.vulnerability_total_score
  if (!rating) return '–'
  return score != null ? `${rating} (${score})` : rating
})

function ringToLatLng(ring: number[][]): google.maps.LatLngLiteral[] {
  return ring.map((c) => ({ lat: c[1], lng: c[0] }))
}

function geoFeatureToPaths(geometry: any): google.maps.LatLngLiteral[][] {
  if (!geometry) return []
  if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates?.[0])) {
    return [ringToLatLng(geometry.coordinates[0])]
  }
  if (geometry.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)) {
    return geometry.coordinates
      .map((poly: number[][][]) => (Array.isArray(poly?.[0]) ? ringToLatLng(poly[0]) : []))
      .filter((path: google.maps.LatLngLiteral[]) => path.length > 0)
  }
  return []
}

const settlementMarkers = computed(() => {
  const features = geojson.value?.features ?? []
  return features
    .filter((f: any) => f?.geometry?.type === 'Point' && Array.isArray(f.geometry.coordinates))
    .map((f: any) => ({
      id: Number(f.properties?.id),
      position: { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] } as google.maps.LatLngLiteral
    }))
    .filter((m) => Number.isFinite(m.id))
})

const boundaryPolygons = computed(() => {
  const features = boundariesGeoJson.value?.features ?? []
  return features.flatMap((f: any) => {
    const id = f?.properties?.id
    if (id == null) return []
    const paths = geoFeatureToPaths(f.geometry)
    if (!paths.length) return []
    return [{
      id: Number(id),
      options: {
        paths,
        fillColor: '#00DC82',
        fillOpacity: 0.12,
        strokeColor: '#00a366',
        strokeOpacity: 0.7,
        strokeWeight: 1.2,
        clickable: true
      }
    }]
  })
})

const singleSettlementOverlays = computed(() => {
  const feature = currentSingleSettlementFeature.value
  if (!feature?.geometry) return []
  const settlementId = Number(feature.properties?.id)
  const geom = feature.geometry
  if (geom.type === 'Point' && Array.isArray(geom.coordinates)) {
    return [{
      type: 'marker' as const,
      key: `single-point-${settlementId}`,
      settlementId,
      position: { lat: geom.coordinates[1], lng: geom.coordinates[0] } as google.maps.LatLngLiteral
    }]
  }
  const paths = geoFeatureToPaths(geom)
  return paths.map((path, index) => ({
    type: 'polygon' as const,
    key: `single-polygon-${settlementId}-${index}`,
    settlementId,
    position: path[0],
    options: {
      paths: path,
      fillColor: '#E6A23C',
      fillOpacity: 0.25,
      strokeColor: '#c45a00',
      strokeWeight: 2.5,
      clickable: true,
      zIndex: 2
    }
  }))
})

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
const helpDialogVisible = ref(false)

const showMapOverlay = computed(() => {
  if (mapLoading.value) return true
  if (currentSingleSettlementFeature.value) return false
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
  const searchTerm = searchKeyword.value?.trim() || ''
  const hasFilter = selectedCounty.value != null || searchTerm.length > 0
  if (!hasFilter) {
    geojson.value = { type: 'FeatureCollection', features: [] }
    boundariesGeoJson.value = { type: 'FeatureCollection', features: [] }
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
    mapLoadingText.value = `${geojson.value.features?.length || 0} settlements on map`
    nextTick(() => fitMapToTableSettlements())
  } catch (e) {
    console.error('Load map settlements:', e)
    geojson.value = { type: 'FeatureCollection', features: [] }
    boundariesGeoJson.value = { type: 'FeatureCollection', features: [] }
    mapLoadingText.value = 'Failed to load map data'
  } finally {
    mapLoading.value = false
  }
}

function getGoogleMap(): google.maps.Map | null {
  return mapRef.value?.map ?? null
}

function triggerMapResize() {
  const map = getGoogleMap()
  if (map && window.google?.maps) {
    google.maps.event.trigger(map, 'resize')
  }
}

function applyMapColorScheme() {
  const map = getGoogleMap()
  if (!map || !window.google?.maps?.ColorScheme || mapStyle.value !== 'streets') return
  map.setOptions({
    colorScheme: isDark.value ? google.maps.ColorScheme.DARK : google.maps.ColorScheme.LIGHT
  })
}

function fitBoundsToCoords(coords: Array<{ lat: number; lng: number }>, maxZoom = 14) {
  const map = getGoogleMap()
  if (!map || !window.google?.maps || coords.length === 0) return
  if (coords.length === 1) {
    map.panTo(coords[0])
    map.setZoom(12)
    return
  }
  const bounds = new google.maps.LatLngBounds()
  coords.forEach((coord) => bounds.extend(coord))
  map.fitBounds(bounds, 48)
  const listener = google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
    if ((map.getZoom() ?? 0) > maxZoom) map.setZoom(maxZoom)
  })
  return listener
}

/** Fit map zoom/bounds to show settlements currently in the table. */
function fitMapToTableSettlements() {
  if (!getGoogleMap() || !geojson.value?.features?.length) return
  const ids = new Set((settlementList.value || []).map((s: any) => s?.id).filter((id: any) => id != null))
  if (ids.size === 0) return
  const coords: Array<{ lat: number; lng: number }> = []
  for (const f of geojson.value.features) {
    const id = f?.properties?.id
    if (id == null || !ids.has(id)) continue
    const geom = f?.geometry
    if (!geom) continue
    if (geom.type === 'Point' && Array.isArray(geom.coordinates) && geom.coordinates.length >= 2) {
      coords.push({ lat: geom.coordinates[1], lng: geom.coordinates[0] })
    } else if (geom.type === 'Polygon' && Array.isArray(geom.coordinates?.[0])) {
      const ring = geom.coordinates[0]
      if (ring?.length) coords.push({ lat: ring[0][1], lng: ring[0][0] })
    }
  }
  fitBoundsToCoords(coords)
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

function closePopup() {
  popupSettlement.value = null
  popupPosition.value = null
  popupLoading.value = false
}

async function showPopupForSettlement(id: number, position: { lat: number; lng: number }) {
  const myRequestId = ++popupRequestId
  popupLoading.value = true
  popupSettlement.value = null
  popupPosition.value = position
  try {
    const res = await getPublicRegisterSettlement(id)
    if (myRequestId !== popupRequestId) return
    popupSettlement.value = res?.data ?? res?.results ?? null
  } catch (err) {
    console.error('Popup error:', err)
    if (myRequestId === popupRequestId) closePopup()
  } finally {
    if (myRequestId === popupRequestId) popupLoading.value = false
  }
}

function onSettlementMarkerClick(marker: { id: number; position: google.maps.LatLngLiteral }) {
  showPopupForSettlement(marker.id, marker.position)
}

function onBoundaryPolygonClick(id: number, event: google.maps.MapMouseEvent) {
  const latLng = event.latLng?.toJSON()
  if (!latLng) return
  showPopupForSettlement(id, latLng)
}

function onSingleSettlementClick(settlementId: number, position: google.maps.LatLngLiteral) {
  showPopupForSettlement(settlementId, position)
}

/** Switch to Map tab and load this settlement (no page scroll). */
function goToMapWithSettlement(row: any) {
  if (row?.id == null) return
  activeRegisterTab.value = 'map'
  nextTick(async () => {
    await ensureMapInitialized()
    await nextTick()
    triggerMapResize()
    viewSettlementOnMap(row)
  })
}

async function viewSettlementOnMap(row: any) {
  const id = row?.id
  if (id == null) return
  if (!getGoogleMap()) {
    await nextTick()
  }
  if (!getGoogleMap()) return
  const idNum = Number(id)
  try {
    const feature = await getPublicRegisterSettlementMap(idNum)
    const coords = getCoordsFromFeature(feature)
    if (!coords) {
      ElMessage.warning('This settlement has no location data.')
      return
    }
    currentSingleSettlementFeature.value = feature
    const geom = feature?.geometry
    if (geom?.type === 'Polygon' && geom?.coordinates?.[0]?.length) {
      const ring = geom.coordinates[0] as [number, number][]
      fitBoundsToCoords(ring.map((c) => ({ lat: c[1], lng: c[0] })), 15)
    } else if (geom?.type === 'MultiPolygon' && geom?.coordinates?.[0]?.[0]?.length) {
      const ring = geom.coordinates[0][0] as [number, number][]
      fitBoundsToCoords(ring.map((c) => ({ lat: c[1], lng: c[0] })), 15)
    } else {
      const map = getGoogleMap()
      map?.panTo({ lat: coords[1], lng: coords[0] })
      map?.setZoom(13)
    }
  } catch (e: any) {
    if (e?.response?.status === 404 || e?.message === 'Not found') {
      ElMessage.warning('Settlement not found or has no location data.')
    } else {
      ElMessage.error('Could not load settlement on map.')
    }
  }
}

function onRegisterTabChange(tabName: string) {
  if (tabName === 'map') {
    nextTick(async () => {
      await ensureMapInitialized()
      triggerMapResize()
      loadMapData()
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

function resetMapView() {
  closePopup()
  currentSingleSettlementFeature.value = null
  mapCenter.value = { ...MAP_INITIAL_CENTER }
  mapZoom.value = MAP_INITIAL_ZOOM
  const map = getGoogleMap()
  map?.panTo(MAP_INITIAL_CENTER)
  map?.setZoom(MAP_INITIAL_ZOOM)
}

function resetFilters() {
  currentSingleSettlementFeature.value = null
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

function toggleMapStyle() {
  mapStyle.value = mapStyle.value === 'satellite' ? 'streets' : 'satellite'
  nextTick(() => applyMapColorScheme())
}

watch([selectedWard], () => {
  currentPage.value = 1
  loadList()
  loadMapData()
})

watch(isDark, () => {
  applyMapColorScheme()
})

watch(mapInitialized, (ready) => {
  if (ready) {
    nextTick(() => {
      applyMapColorScheme()
      triggerMapResize()
      loadMapData()
    })
  }
})

async function ensureMapInitialized() {
  if (mapInitialized.value) return
  await loadGoogleMapsApi()
  mapInitialized.value = true
}

function vulnerabilityRatingTagType(rating: string | null | undefined): 'success' | 'warning' | 'danger' | 'info' {
  const r = rating?.toUpperCase()
  if (r === 'HIGH') return 'danger'
  if (r === 'MEDIUM') return 'warning'
  if (r === 'LOW') return 'success'
  return 'info'
}

onMounted(async () => {
  await loadCounties()
  loadList()
})

onUnmounted(() => {
  closePopup()
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

.definition-trigger {
  cursor: help;
  border-bottom: 1px dotted currentColor;
}
.definition-trigger:hover {
  color: #00b368;
}
.table-header-trigger {
  cursor: help;
  border-bottom: 1px dotted currentColor;
}
.table-header-trigger:hover {
  color: #00b368;
}

/* Map popup card */
.register-map-popup {
  min-width: 240px;
  max-width: 320px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  background: var(--el-bg-color, #fff);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}
.register-popup {
  font-size: 14px;
  color: var(--text-primary, #303133);
}
:deep(.register-popup-header) {
  position: relative;
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
:deep(.register-popup-close) {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.25);
  color: #fff;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  pointer-events: auto;
  z-index: 5;
}
:deep(.register-popup-close:hover) {
  background: rgba(0, 0, 0, 0.4);
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
.register-map-popup--mobile {
  min-width: 0;
  max-width: 260px;
  border-radius: 8px;
}
.register-map-popup--mobile .register-popup-header {
  padding: 8px 28px 8px 10px;
}
.register-map-popup--mobile .register-popup-close {
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  font-size: 18px;
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
.register-map-popup--mobile .register-popup-label {
  font-size: 11px;
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
  flex-wrap: nowrap;
  align-items: center;
  gap: 12px;
  overflow-x: auto;
}

.search-input {
  width: 420px;
  min-width: 200px;
  flex-shrink: 0;
}

.filter-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 10px;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.filter-select {
  width: 160px;
}

.help-icon {
  margin-right: 4px;
  vertical-align: -0.2em;
}

/* Help dialog – green header wraps title + close */
.register-help-dialog :deep(.el-dialog__header) {
  padding: 0;
  margin: 0;
  background: linear-gradient(135deg, #00DC82 0%, #00b368 100%) !important;
  border-radius: 4px 4px 0 0;
  position: relative;
}
.register-help-dialog-header {
  background: linear-gradient(135deg, #00DC82 0%, #00b368 100%);
  color: #fff;
  padding: 14px 16px;
  font-size: 0.95rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
  border-radius: 4px 4px 0 0;
}
.register-help-dialog-header-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  opacity: 0.95;
}
.register-help-dialog :deep(.el-dialog__body) {
  padding: 12px 16px 12px;
}
.register-help-dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
}
.register-help-dialog-footer .close {
  min-width: 80px;
}
.register-help-content {
  font-size: 13px;
  line-height: 1.55;
  color: var(--el-text-color-primary, #303133);
}
.register-help-intro {
  margin: 0 0 0.75rem;
  font-size: 0.8125rem;
}
.register-help-content h4 {
  margin: 0.75rem 0 0.4rem;
  font-size: 0.875rem;
  color: var(--el-text-color-primary, #303133);
  display: flex;
  align-items: center;
  gap: 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--el-border-color, #dcdfe6);
  text-decoration: none;
}
.register-help-heading-icon {
  font-size: 1rem;
  color: #00DC82;
  flex-shrink: 0;
}
.register-help-content ul {
  margin: 0;
  padding-left: 1.25rem;
  list-style: none;
}
.register-help-content li {
  margin-bottom: 0.4rem;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 0.8125rem;
  padding-left: 0.25rem;
}
.register-help-li-icon {
  font-size: 1rem;
  color: #00DC82;
  flex-shrink: 0;
  margin-top: 1px;
}
.register-help-note {
  margin: 0 0 0.5rem;
  font-size: 0.8125rem;
  color: var(--el-text-color-secondary, #606266);
  line-height: 1.5;
}
.register-help-register {
  margin: 1rem 0 0;
  padding: 0.6rem 0.85rem;
  background: var(--el-fill-color-light, #f5f7fa);
  border-radius: 8px;
  font-size: 0.8125rem;
}
.register-help-register-link {
  color: #00b368;
  font-weight: 600;
  text-decoration: none;
}
.register-help-register-link:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .register-help-dialog :deep(.el-dialog) {
    width: 95% !important;
    max-width: 95%;
    margin: 10px auto;
  }
  .register-help-dialog-header {
    padding: 12px 16px;
    font-size: 0.875rem;
  }
  .register-help-dialog-header-icon {
    font-size: 1.1rem;
  }
  .register-help-dialog :deep(.el-dialog__body) {
    padding: 10px 12px 14px;
  }
  .register-help-content,
  .register-help-content li {
    font-size: 0.8125rem;
  }
  .register-help-intro {
    font-size: 0.75rem;
  }
  .register-help-content h4 {
    font-size: 0.8125rem;
    margin-top: 0.6rem;
  }
  .register-help-heading-icon,
  .register-help-li-icon {
    font-size: 0.95rem;
  }
  .register-help-register {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }
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

.register-map-section .register-style-switcher {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: #fff;
  box-shadow: rgba(0, 0, 0, 0.3) 0 1px 4px -1px;
  cursor: pointer;
}
.register-map-section .register-style-switcher-icon {
  display: block;
  width: 20px;
  height: 20px;
  object-fit: contain;
}
.register-map-section .register-style-switcher:hover .register-style-switcher-icon {
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

<style>
/* Popover is portaled to body – unscoped for .register-help-popover */
.register-help-popover .register-help-definition {
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-primary, #303133);
  margin: 0;
}
.register-help-popover .register-help-link {
  color: #00b368;
  font-weight: 600;
  text-decoration: none;
}
.register-help-popover .register-help-link:hover {
  text-decoration: underline;
}
</style>
