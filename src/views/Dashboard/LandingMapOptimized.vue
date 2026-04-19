<template>

  <!-- Mobile overlay -->
  <div 
    v-if="isMobile && filtersVisible" 
    class="mobile-overlay"
    @click="filtersVisible = false"
  ></div>

  <!-- Filters panel -->
  <div 
    v-if="filtersVisible"
    class="floating-collapse" 
    :class="{ 'mobile-open': filtersVisible && isMobile, 'mobile-closed': !filtersVisible && isMobile }"
  >
    <el-collapse v-model="activeCollapse">
      <el-collapse-item name="filters">
        <template #title>
          <div class="filter-header">
            <Icon icon="mdi:filter-variant" width="20" class="filter-icon" />
            <span>Filters</span>
          </div>
        </template>
        <div class="filters-wrapper">
          <div class="filters-container">
            <el-select 
              multiple
              v-model="county"  
              placeholder="Filter by County"  
              @change="handleChangeCounty" 
              filterable 
              :clearable="!isCountyRestricted"
              :disabled="isCountyRestricted"
              class="filter-select compact-select"
              teleported
              popper-class="filter-select-dropdown"
            >
              <el-option v-for="item in countyOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-select
              multiple
              clearable 
              filterable 
              v-model="subcounty"  
              placeholder="Filter by Subcounty"  
              @change="handleChangeSubcounty"
              class="filter-select compact-select"
              teleported
              popper-class="filter-select-dropdown"
            >
              <el-option v-for="item in subCountyOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-button @click="resetFilters" class="reset-button compact-button">Reset Filters</el-button>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>

  <div v-loading="mapLoading" :element-loading-text="mapLoadingText" id="map" class="map"></div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, watch, onMounted, onUnmounted, computed, type Ref } from 'vue'
import { ElButton, ElSelect, ElOption, ElMessage, ElCollapse, ElCollapseItem } from 'element-plus'
import { Icon } from '@iconify/vue'
import mapboxgl from "mapbox-gl"
import 'mapbox-gl/dist/mapbox-gl.css'
import * as turf from '@turf/turf'
import { useAppStoreWithOut } from '@/store/modules/app'
import { 
  getOptimizedSettlements, 
  getBatchGeometries,
  getCountiesList,
  getSubcountiesList 
} from '@/api/settlements-optimized'
import { getOneSettlement } from '@/api/settlements'
import { useCache } from '@/hooks/web/useCache'
import { userHasPrivilegedNationalLocation } from '@/utils/roleScope'
import { debounce } from '@/utils/debounce'

const { push } = useRouter()
const appStore = useAppStoreWithOut()
const { wsCache } = useCache()
const userInfo = wsCache.get(appStore.getUserInfo)

// User location-based filtering
const isSuperAdmin = computed(() => {
  return userInfo?.roles?.some((role: any) => 
    role.name === 'super_admin' || role.name === 'root_admin'
  ) || false
})

const hasNationalAccess = computed(() => userHasPrivilegedNationalLocation(userInfo?.roles))

const userCountyRole = computed(() => {
  return userInfo?.roles?.find((role: any) => 
    role.user_roles?.location_level === 'county'
  )
})

const userCountyId = computed(() => {
  return userCountyRole.value?.user_roles?.county_id || null
})

const isCountyRestricted = computed(() => {
  return !isSuperAdmin.value && !hasNationalAccess.value && !!userCountyId.value
})

// Map state
const map = ref<mapboxgl.Map | null>(null)
const mapLoading = ref(false)
const mapLoadingText = ref('Loading map....')
const isDarkMode = computed(() => appStore.getIsDark)

// Collapse state - closed by default on all screen sizes
const activeCollapse = ref<string[]>([])

// Mobile filter visibility
const filtersVisible = ref(false)
const isMobile = ref(window.innerWidth <= 768)


// Store filter control reference
const filterControlRef = ref<mapboxgl.IControl | null>(null)

// Update mobile state on resize
const updateMobileState = () => {
  isMobile.value = window.innerWidth <= 768
  // Keep control on both desktop and mobile, just adjust filter panel behavior
  if (!isMobile.value && filtersVisible.value) {
    // On desktop, filters panel stays visible (floating), no need to close
  }
}

// Toggle filters (works for both desktop and mobile)
const toggleFilters = () => {
  filtersVisible.value = !filtersVisible.value
  if (filtersVisible.value) {
    activeCollapse.value = ['filters'] // Auto-expand when opened
  } else if (!isMobile.value) {
    // On desktop, when closing, also collapse the panel
    activeCollapse.value = []
  }
}

const outsideClickHandler = (e: MouseEvent) => {
  if (isMobile.value && filtersVisible.value) {
    const target = e.target as HTMLElement
    const filtersPanel = document.querySelector('.floating-collapse')
    const filterControl = document.querySelector('.filter-control')
    if (filtersPanel && filterControl &&
        !filtersPanel.contains(target) &&
        !filterControl.contains(target)) {
      filtersVisible.value = false
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('resize', updateMobileState)
  document.addEventListener('click', outsideClickHandler)
}

onUnmounted(() => {
  window.removeEventListener('resize', updateMobileState)
  document.removeEventListener('click', outsideClickHandler)
  map.value?.remove()
})

// Data state
const county = ref<number[]>([])
const subcounty = ref<number[]>([])
const countyOptions = ref<Array<{value: number, label: string}>>([])
const subCountyOptions = ref<Array<{value: number, label: string}>>([])
const geojson = ref<any>({ type: 'FeatureCollection', features: [] })
const countyGeo = ref<any>(null)
// const subcountyGeo = ref<any>(null) // Reserved for future use

// Mapbox token
const MapBoxToken = 'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = MapBoxToken

// Create custom filter control for Mapbox
const createFilterControl = (onClick: () => void, isVisible: Ref<boolean>) => {
  class FilterControl implements mapboxgl.IControl {
    private _container: HTMLElement
    private _button: HTMLButtonElement

    constructor() {
      this._container = document.createElement('div')
      this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group filter-control'
      
      this._button = document.createElement('button')
      this._button.className = 'mapboxgl-ctrl-icon filter-control-button'
      this._button.type = 'button'
      this._button.setAttribute('aria-label', 'Toggle Filters')
      this._button.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
        </svg>
      `
      
      this._button.addEventListener('click', onClick)
      
      // Watch for visibility changes to update icon
      watch(isVisible, (visible) => {
        if (visible) {
          this._button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          `
          this._button.classList.add('active')
        } else {
          this._button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
            </svg>
          `
          this._button.classList.remove('active')
        }
      }, { immediate: true })
      
      this._container.appendChild(this._button)
    }

    onAdd(_map: mapboxgl.Map): HTMLElement {
      return this._container
    }

    onRemove(): void {
      this._container.parentNode?.removeChild(this._container)
    }

    getDefaultPosition(): string {
      return 'top-right'
    }
  }

  return new FilterControl()
}

// Initialize map
onMounted(async () => {
  const mapStyle = isDarkMode.value 
    ? 'mapbox://styles/agspatial/clqcfzcoa00bt01nwhmf465f7' 
    : 'mapbox://styles/mapbox/light-v11'

  map.value = new mapboxgl.Map({
    container: 'map',
    style: mapStyle,
    center: [36.799473, -1.264257],
    zoom: 14
  })

  map.value.addControl(new mapboxgl.NavigationControl())
  map.value.addControl(
    new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true
    })
  )

  // Add custom filter control (works for both desktop and mobile)
  const filterControl = createFilterControl(toggleFilters, filtersVisible)
  map.value.addControl(filterControl, 'top-right')
  filterControlRef.value = filterControl

  // Watch for dark mode changes
  watch(
    () => appStore.getIsDark,
    async (newVal) => {
      if (!map.value) return
      const newStyle = newVal
        ? 'mapbox://styles/agspatial/clqcfzcoa00bt01nwhmf465f7'
        : 'mapbox://styles/mapbox/light-v11'
      
      map.value.setStyle(newStyle)
      map.value.once('styledata', async () => {
        await addSettlementLayers()
      })
    }
  )

  map.value.on('load', async () => {
    await initializeMap()
  })

  map.value.on('click', 'unclustered-point', (e: any) => {
    const feature = e.features[0]
    getClickedSettlement(feature.properties.id)
  })

  map.value.on('click', 'clusters', (e: any) => {
    const features = map.value!.queryRenderedFeatures(e.point, {
      layers: ['clusters']
    })
    const clusterId = features[0].properties.cluster_id
    const source = map.value!.getSource('settlements') as mapboxgl.GeoJSONSource
    source.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return
      map.value!.easeTo({
        center: features[0].geometry.coordinates as [number, number],
        zoom: zoom
      })
    })
  })
})

// Initialize map data
const initializeMap = async () => {
  try {
    mapLoading.value = true
    mapLoadingText.value = 'Loading data...'

    // Parallelize all initial data loading
    const [, , countyGeoData] = await Promise.all([
      loadSettlements(),
      loadCounties(),
      loadCountyGeo()
    ])

    // Auto-set county for restricted users
    if (isCountyRestricted.value && userCountyId.value) {
      county.value = [userCountyId.value]
      await handleChangeCounty([userCountyId.value])
    } else {
      await addSettlementLayers()
      if (countyGeoData) {
        addCountyLayer(countyGeoData)
      }
    }

    mapLoading.value = false
  } catch (error: any) {
    console.error('Error initializing map:', error)
    ElMessage.error('Failed to load map data')
    mapLoading.value = false
  }
}

// Load settlements with server-side filtering
const loadSettlements = async (filters?: { countyIds?: number[], subcountyIds?: number[] }) => {
  try {
    const params: any = {
      model: 'settlement',
      includeCentroids: true, // Request centroids from backend
      includePolygons: false  // Don't need full polygons for map view
    }

    // Build filter arrays
    const filterFields: string[] = []
    const filterValues: any[] = []

    // Apply user restrictions first (for county-restricted users)
    if (isCountyRestricted.value && userCountyId.value) {
      filterFields.push('county_id')
      filterValues.push([userCountyId.value])
    } else if (filters?.countyIds && filters.countyIds.length > 0) {
      // Apply county filter for non-restricted users
      filterFields.push('county_id')
      filterValues.push(filters.countyIds)
    }

    // Apply subcounty filter (works for both restricted and non-restricted users)
    if (filters?.subcountyIds && filters.subcountyIds.length > 0) {
      filterFields.push('subcounty_id')
      filterValues.push(filters.subcountyIds)
    }

    // Set filters if any were added
    if (filterFields.length > 0) {
      params.filters = filterFields
      params.filterValues = filterValues
    }

    const response = await getOptimizedSettlements({ params })
    geojson.value = (response as any).results || response.data || { type: 'FeatureCollection', features: [] }
    
    return geojson.value
  } catch (error: any) {
    console.error('Error loading settlements:', error)
    ElMessage.error('Failed to load settlements')
    geojson.value = { type: 'FeatureCollection', features: [] }
    return geojson.value
  }
}

// Load counties list
const loadCounties = async () => {
  try {
    const params: any = {
      model: 'county',
      cache_key: 'counties_list_optimized'
    }

    if (isCountyRestricted.value && userCountyId.value) {
      params.filters = ['id']
      params.filterValues = [[userCountyId.value]]
    }

    const response = await getCountiesList({ params })
    countyOptions.value = (response.data || []).map((item: any) => ({
      value: item.id,
      label: item.name
    }))
    
    return countyOptions.value
  } catch (error: any) {
    console.error('Error loading counties:', error)
    return []
  }
}

// Load county geometries
const loadCountyGeo = async () => {
  try {
    const formData: any = {
      model: 'county',
      cache_key: 'county_geo_optimized'
    }
    
    const res = await getBatchGeometries({ data: formData })
    countyGeo.value = res.data || { type: 'FeatureCollection', features: [] }
    return countyGeo.value
  } catch (error: any) {
    console.error('Error loading county geo:', error)
    return null
  }
}

// Add settlement layers to map
const addSettlementLayers = async () => {
  if (!map.value) return

  // Update or add source
  if (map.value.getSource('settlements')) {
    (map.value.getSource('settlements') as mapboxgl.GeoJSONSource).setData(geojson.value)
  } else {
    map.value.addSource('settlements', {
      type: 'geojson',
      data: geojson.value,
      cluster: true,
      clusterMaxZoom: 12, // Reduced from 14 for better performance
      clusterRadius: 60    // Increased from 50 for better clustering
    })
  }

  // Add cluster layer
  if (!map.value.getLayer('clusters')) {
    map.value.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'settlements',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          'rgba(81, 187, 214, 0.47)',
          5,
          'rgba(241, 240, 117, 0.47)',
          10,
          'rgba(242, 140, 177, 0.47)'
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,
          5,
          30,
          10,
          40
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': 'white'
      }
    })
  }

  // Add cluster count labels
  if (!map.value.getLayer('cluster-count')) {
    map.value.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'settlements',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      }
    })
  }

  // Add unclustered points
  if (!map.value.getLayer('unclustered-point')) {
    map.value.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'settlements',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': 'green',
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': 'white'
      }
    })
  }

  // Add labels
  if (!map.value.getLayer('settlementLabel')) {
    map.value.addLayer({
      id: 'settlementLabel',
      type: 'symbol',
      source: 'settlements',
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 12,
        'text-offset': [0, 1]
      },
      paint: {
        'text-color': 'red',
        'text-halo-color': 'white',
        'text-halo-width': 1
      }
    })
  }

  // Fit bounds if we have features
  if (geojson.value?.features?.length > 0) {
    try {
      const bounds = turf.bbox(geojson.value)
      if (bounds && bounds.length === 4 &&
          isFinite(bounds[0]) && isFinite(bounds[1]) &&
          isFinite(bounds[2]) && isFinite(bounds[3])) {
        // Responsive padding based on screen size
        const isMobile = window.innerWidth <= 768
        const padding = isMobile ? 50 : 20
        map.value.fitBounds(bounds as [number, number, number, number], { padding })
      }
    } catch (error) {
      console.warn('Error fitting bounds:', error)
    }
  }
}

// Add county layer
const addCountyLayer = (geoData: any) => {
  if (!map.value) return

  if (map.value.getSource('County')) {
    (map.value.getSource('County') as mapboxgl.GeoJSONSource).setData(geoData)
  } else {
    map.value.addSource('County', {
      type: 'geojson',
      data: geoData
    })

    const beforeId = map.value.getLayer('settlementLabel') ? 'settlementLabel' : undefined
    map.value.addLayer({
      id: 'county',
      type: 'line',
      source: 'County',
      paint: {
        'line-color': 'red',
        'line-opacity': 1,
        'line-width': 0.5
      }
    }, beforeId)
  }
}

// Fit map to given GeoJSON data bounds
const fitToGeoData = (geoData: any) => {
  if (!map.value || !geoData?.features?.length) return
  try {
    const bounds = turf.bbox(geoData)
    if (bounds && bounds.length === 4 &&
        isFinite(bounds[0]) && isFinite(bounds[1]) &&
        isFinite(bounds[2]) && isFinite(bounds[3])) {
      const padding = window.innerWidth <= 768 ? 50 : 20
      map.value.fitBounds(bounds as [number, number, number, number], { padding })
    }
  } catch (error) {
    console.warn('Error fitting bounds:', error)
  }
}

// Debounced county change handler
const handleChangeCounty = debounce(async (countyIds: number | number[]) => {
  if (!map.value) return

  const countyArray = Array.isArray(countyIds) ? countyIds : (countyIds ? [countyIds] : [])

  // Clear subcounty selection
  subcounty.value = []
  subCountyOptions.value = []

  if (countyArray.length > 0) {
    try {
      mapLoading.value = true
      mapLoadingText.value = 'Loading filtered settlements...'

      // Parallelize: load settlements and county geometries
      const [, countyGeos] = await Promise.all([
        loadSettlements({ countyIds: countyArray }),
        loadCountyGeometries(countyArray)
      ])

      await addSettlementLayers()
      if (countyGeos) {
        addCountyLayer(countyGeos)
        fitToGeoData(countyGeos)
      }

      // Subcounties are independent of layer rendering — run in parallel
      await loadSubcountiesForCounties(countyArray)

      mapLoading.value = false
    } catch (error: any) {
      console.error('Error changing county:', error)
      ElMessage.error('Failed to load county data')
      mapLoading.value = false
    }
  } else {
    // County cleared — reload all data and zoom to full extent
    try {
      mapLoading.value = true
      mapLoadingText.value = 'Loading all settlements...'

      await loadSettlements()
      await addSettlementLayers()

      if (countyGeo.value) {
        addCountyLayer(countyGeo.value)
        fitToGeoData(countyGeo.value)
      }

      mapLoading.value = false
    } catch (error: any) {
      console.error('Error reloading after county clear:', error)
      ElMessage.error('Failed to reload data')
      mapLoading.value = false
    }
  }
}, 300)

// Debounced subcounty change handler
const handleChangeSubcounty = debounce(async (subcountyIds: number | number[]) => {
  if (!map.value) return

  const subcountyArray = Array.isArray(subcountyIds) ? subcountyIds : (subcountyIds ? [subcountyIds] : [])

  try {
    mapLoading.value = true
    mapLoadingText.value = 'Loading filtered settlements...'

    // Remove subcounty layer if subcounty is cleared
    if (subcountyArray.length === 0) {
      if (map.value.getLayer('Subcounty')) {
        map.value.removeLayer('Subcounty')
      }
      if (map.value.getSource('Subcounty')) {
        map.value.removeSource('Subcounty')
      }
    }

    // Load settlements with filters (county and/or subcounty)
    // For county-restricted users, county restriction is handled in loadSettlements
    await loadSettlements({ 
      countyIds: (!isCountyRestricted.value && county.value.length > 0) ? county.value : undefined,
      subcountyIds: subcountyArray.length > 0 ? subcountyArray : undefined
    })

    if (subcountyArray.length > 0) {
      // Geo fetch and layer update both depend only on loadSettlements — run in parallel
      const [subcountyGeos] = await Promise.all([
        loadSubcountyGeometries(subcountyArray),
        addSettlementLayers()
      ])
      if (subcountyGeos) {
        addSubcountyLayer(subcountyGeos)
      }
    } else {
      // Subcounty cleared — restore county layer and zoom to county extent
      await addSettlementLayers()
      if (county.value.length > 0) {
        const countyGeos = await loadCountyGeometries(county.value)
        if (countyGeos) {
          addCountyLayer(countyGeos)
          fitToGeoData(countyGeos)
        }
      } else if (countyGeo.value) {
        addCountyLayer(countyGeo.value)
        fitToGeoData(countyGeo.value)
      }
    }

    mapLoading.value = false
  } catch (error: any) {
    console.error('Error changing subcounty:', error)
    ElMessage.error('Failed to load subcounty data')
    mapLoading.value = false
  }
}, 300)

// Load county geometries in batch
const loadCountyGeometries = async (countyIds: number[]) => {
  try {
    const response = await getBatchGeometries({
      data: {
        model: 'county',
        ids: countyIds
      }
    })
    return response.data || { type: 'FeatureCollection', features: [] }
  } catch (error: any) {
    console.error('Error loading county geometries:', error)
    return null
  }
}

// Load subcounty geometries in batch
const loadSubcountyGeometries = async (subcountyIds: number[]) => {
  try {
    const response = await getBatchGeometries({
      data: {
        model: 'subcounty',
        ids: subcountyIds
      }
    })
    return response.data || { type: 'FeatureCollection', features: [] }
  } catch (error: any) {
    console.error('Error loading subcounty geometries:', error)
    return null
  }
}

// Load subcounties for counties
const loadSubcountiesForCounties = async (countyIds: number[]) => {
  try {
    const promises = countyIds.map(countyId => 
      getSubcountiesList({
        params: {
          model: 'subcounty',
          county_id: countyId
        }
      })
    )

    const responses = await Promise.all(promises)
    const allSubcounties: any[] = []
    
    responses.forEach(res => {
      if (res.data) {
        allSubcounties.push(...res.data)
      }
    })

    // Remove duplicates
    const uniqueSubcounties = Array.from(
      new Map(allSubcounties.map(item => [item.id, item])).values()
    )

    subCountyOptions.value = uniqueSubcounties
      .sort((a, b) => a.id - b.id)
      .map(item => ({
        value: item.id,
        label: item.name
      }))

    return subCountyOptions.value
  } catch (error: any) {
    console.error('Error loading subcounties:', error)
    return []
  }
}

// Add subcounty layer
const addSubcountyLayer = (geoData: any) => {
  if (!map.value) return

  if (map.value.getSource('Subcounty')) {
    (map.value.getSource('Subcounty') as mapboxgl.GeoJSONSource).setData(geoData)
  } else {
    map.value.addSource('Subcounty', {
      type: 'geojson',
      data: geoData
    })

    const beforeId = map.value.getLayer('settlementLabel') ? 'settlementLabel' : undefined
    map.value.addLayer({
      id: 'Subcounty',
      type: 'line',
      source: 'Subcounty',
      paint: {
        'line-color': 'purple',
        'line-opacity': 1,
        'line-width': 0.5
      }
    }, beforeId)
  }
}

// Reset filters
const resetFilters = async () => {
  if (isCountyRestricted.value && userCountyId.value) {
    subcounty.value = []
    subCountyOptions.value = []
    await handleChangeCounty([userCountyId.value])
    return
  }

  county.value = []
  subcounty.value = []
  subCountyOptions.value = []

  mapLoading.value = true
  mapLoadingText.value = 'Resetting filters...'

  // Remove subcounty layer
  if (map.value?.getLayer('Subcounty')) {
    map.value.removeLayer('Subcounty')
  }
  if (map.value?.getSource('Subcounty')) {
    map.value.removeSource('Subcounty')
  }

  // Reload all settlements
  await loadSettlements()
  await addSettlementLayers()

  // Restore county layer
  if (countyGeo.value) {
    addCountyLayer(countyGeo.value)
  }

  mapLoading.value = false
}

// Get clicked settlement details
const getClickedSettlement = async (id: number) => {
  try {
    const form: any = {
      model: 'settlement',
      id: id,
      assocModel: 'county'
    }

    const res = await getOneSettlement(form)
    const settlement = (res as any).data || res.results

    const area = settlement.area || 'N/A'
    const countyName = settlement.county?.name || 'N/A'
    const roundedArea = area !== 'N/A' ? parseFloat(area).toFixed(2) + 'Ha.' : 'N/A'
    const name = settlement.name
    const sett_id = settlement.id

    const geom = turf.centroid(settlement.geom)
    const popup = new mapboxgl.Popup({ closeButton: false })

    const popupContent = `
      <div style="
        background: ${isDarkMode.value ? '#444' : '#91c949'};
        color: ${isDarkMode.value ? '#fff' : '#000'};
        padding: 8px 10px;
        font-weight: 700;
        text-align: center;
        font-size: clamp(13px, 2.5vw, 15px);
      ">
        <u>Settlement Details</u>
      </div>
      <div style="
        padding: 8px 10px;
        font-family: 'Source Sans Pro', 'Helvetica Neue', sans-serif;
        font-size: clamp(12px, 2.5vw, 14px);
        color: ${isDarkMode.value ? '#f0f0f0' : '#333'};
        background: ${isDarkMode.value ? '#2c2c2c' : '#fff'};
      ">
        <div style="margin-bottom: 5px; word-wrap: break-word;">
          <span style="font-weight: bold;">Name:</span>
          <span> ${name}</span>
        </div>
        <div style="margin-bottom: 5px;">
          <span style="font-weight: bold;">Area:</span>
          <span> ${roundedArea}</span>
        </div>
        <div style="word-wrap: break-word;">
          <span style="font-weight: bold;">County:</span>
          <span> ${countyName}</span>
        </div>
      </div>
    `

    popup.setLngLat(geom.geometry.coordinates as [number, number])
      .setHTML(popupContent)
      .addTo(map.value!)

    popup.getElement()?.addEventListener('click', () => {
      push(`/data/settlement/map/${sett_id}`)


    })
  } catch (error: any) {
    console.error('Error loading settlement:', error)
    ElMessage.error('Failed to load settlement details')
  }
}
</script>

<style scoped>
.floating-collapse {
  position: fixed !important;
  top: 110px;
  left: 255px;
  z-index: 10000 !important;
  background-color: rgba(255, 255, 255, 0.95);
  color: #333;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: calc(100vh - 130px);
  overflow-y: auto;
  overflow-x: visible;
  pointer-events: auto;
  transform: translateZ(0);
}

.dark .floating-collapse {
  background-color: rgba(30, 30, 30, 0.95);
  color: #f0f0f0;
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.05);
}

:deep(.el-collapse) {
  border: none;
  margin: 0;
}

:deep(.el-collapse-item__header) {
  border-radius: 8px;
  padding: 0 16px;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  height: 48px;
  line-height: 48px;
  background-color: transparent;
}

:deep(.el-collapse-item__wrap) {
  border: none;
}

:deep(.el-collapse-item__content) {
  padding: 0;
  margin-top: 12px;
}

.filter-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-icon {
  color: #606266;
}

.filters-wrapper {
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  background: var(--el-bg-color);
}

.filters-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-select {
  width: 100% !important;
  position: relative;
  z-index: auto;
}

.compact-select :deep(.el-input__wrapper) {
  padding-top: 4px;
  padding-bottom: 4px;
  min-height: 32px;
}

.compact-select :deep(.el-input__inner) {
  height: 24px;
  line-height: 24px;
  font-size: 13px;
}

.reset-button {
  width: 100%;
}

.compact-button {
  padding: 6px 12px;
  font-size: 13px;
}

/* Ensure select dropdowns appear on top - use global styles for poppers */

.reset-button {
  width: 100%;
  margin-top: 8px;
}

#map {
  height: 95vh;
  width: 100%;
  position: relative;
  z-index: 1;
}

/* Tablet styles */
@media (max-width: 1024px) {
  .floating-collapse {
    left: 20px;
    top: 80px;
    width: 260px;
    max-width: calc(100vw - 40px);
  }
}

/* Mobile filter toggle button */
/* Custom filter control styles */
.filter-control {
  margin-top: 10px;
}

.dark .mobile-filter-toggle {
  background: #2c2c2c;
  border-color: #4c4c4c;
  color: #f0f0f0;
}

/* Mobile styles */
@media (max-width: 768px) {
  .floating-collapse {
    position: fixed !important;
    left: 0;
    top: 0;
    width: 280px;
    max-width: 85vw;
    height: 100vh;
    max-height: 100vh;
    padding: 16px;
    gap: 0;
    z-index: 10001 !important;
    background-color: rgba(255, 255, 255, 0.98);
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15);
    transform: translateX(-100%);
    transition: transform 0.3s ease-in-out;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .dark .floating-collapse {
    background-color: rgba(30, 30, 30, 0.98);
  }

  .floating-collapse.mobile-open {
    transform: translateX(0);
  }

  .floating-collapse.mobile-closed {
    transform: translateX(-100%);
  }

  /* Mobile overlay */
  .mobile-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 10000 !important;
    animation: fadeIn 0.3s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .filters-wrapper {
    padding: 12px;
  }

  .filters-container {
    gap: 12px;
  }

  #map {
    height: calc(100vh - 60px);
    min-height: 400px;
  }
}

/* Small mobile styles */
@media (max-width: 480px) {
  .filter-control-button {
    width: 27px;
    height: 27px;
  }

  .floating-collapse {
    width: 260px;
    max-width: 90vw;
    padding: 12px;
  }

  #map {
    height: calc(100vh - 50px);
  }
}
</style>

<style>
.mapboxgl-popup-close-button {
  display: none;
}

.mapboxgl-popup-content {
  font: 400 15px/22px 'Source Sans Pro', 'Helvetica Neue', sans-serif;
  padding: 0;
  width: 180px;
  max-width: calc(100vw - 40px);
}

/* Global styles for select dropdowns to appear on top */
.el-select-dropdown,
.el-popper,
.el-select__popper {
  z-index: 10001 !important;
}

.filter-select-dropdown {
  z-index: 10001 !important;
}

.filter-control-button {
  width: 29px;
  height: 29px;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer;
  transition: background-color 0.2s;
  color: #333333 !important;
  padding: 0 !important;
}

.filter-control-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.filter-control-button.active {
  background-color: #409eff;
  color: white !important;
}

.dark .filter-control-button {
  color: #333333 !important;
}

.dark .filter-control-button.active {
  color: white !important;
}

/* Mobile popup adjustments */
@media (max-width: 768px) {
  .mapboxgl-popup-content {
    width: 160px;
    font-size: 14px;
    line-height: 20px;
  }
}

@media (max-width: 480px) {
  .mapboxgl-popup-content {
    width: 140px;
    font-size: 13px;
    line-height: 18px;
  }
}
</style>
