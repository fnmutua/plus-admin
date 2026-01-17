<template>
  <div class="floating-collapse">
    <el-select 
      multiple
      v-model="county"  
      placeholder="Filter by County"  
      @change="handleChangeCounty" 
      filterable 
      :clearable="!isCountyRestricted"
      :disabled="isCountyRestricted"
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
    >
      <el-option v-for="item in subCountyOptions" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
    <el-button @click="resetFilters"> Reset Filters</el-button>
  </div>

  <div v-loading="mapLoading" :element-loading-text="mapLoadingText" id="map" class="map"></div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, watch, onMounted, computed } from 'vue'
import { ElButton, ElSelect, ElOption, ElMessage } from 'element-plus'
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

const hasNationalAccess = computed(() => {
  return userInfo?.roles?.some((role: any) => 
    role.user_roles?.location_level === 'national'
  ) || false
})

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

    // Apply user restrictions
    if (isCountyRestricted.value && userCountyId.value) {
      params.filters = ['county_id']
      params.filterValues = [[userCountyId.value]]
    } else if (filters) {
      // Apply provided filters
      if (filters.countyIds && filters.countyIds.length > 0) {
        params.filters = ['county_id']
        params.filterValues = [filters.countyIds]
      }
      if (filters.subcountyIds && filters.subcountyIds.length > 0) {
        params.filters = params.filters ? [...params.filters, 'subcounty_id'] : ['subcounty_id']
        params.filterValues = params.filterValues 
          ? [...params.filterValues, filters.subcountyIds]
          : [filters.subcountyIds]
      }
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
        map.value.fitBounds(bounds as [number, number, number, number], { padding: 20 })
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

      // Update layers
      await addSettlementLayers()
      if (countyGeos) {
        addCountyLayer(countyGeos)
      }

      // Load subcounties for selected counties
      await loadSubcountiesForCounties(countyArray)

      mapLoading.value = false
    } catch (error: any) {
      console.error('Error changing county:', error)
      ElMessage.error('Failed to load county data')
      mapLoading.value = false
    }
  }
}, 300)

// Debounced subcounty change handler
const handleChangeSubcounty = debounce(async (subcountyIds: number | number[]) => {
  if (!map.value) return

  const subcountyArray = Array.isArray(subcountyIds) ? subcountyIds : (subcountyIds ? [subcountyIds] : [])

  if (subcountyArray.length > 0) {
    try {
      mapLoading.value = true
      mapLoadingText.value = 'Loading filtered settlements...'

      // Load settlements with subcounty filter
      await loadSettlements({ 
        countyIds: county.value,
        subcountyIds: subcountyArray 
      })

      // Load subcounty geometries
      const subcountyGeos = await loadSubcountyGeometries(subcountyArray)

      await addSettlementLayers()
      if (subcountyGeos) {
        addSubcountyLayer(subcountyGeos)
      }

      mapLoading.value = false
    } catch (error: any) {
      console.error('Error changing subcounty:', error)
      ElMessage.error('Failed to load subcounty data')
      mapLoading.value = false
    }
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
    const roundedArea = area !== 'N/A' ? parseFloat(area).toFixed(2) + 'm²' : 'N/A'
    const name = settlement.name
    const sett_id = settlement.id

    const geom = turf.centroid(settlement.geom)
    const popup = new mapboxgl.Popup({ closeButton: false })

    const popupContent = `
      <div style="
        background: ${isDarkMode.value ? '#444' : '#91c949'};
        color: ${isDarkMode.value ? '#fff' : '#000'};
        padding: 10px 12px;
        font-weight: 700;
        text-align: center;
        font-size: 15px;
      ">
        <u>Settlement Details</u>
      </div>
      <div style="
        padding: 10px 12px;
        font-family: 'Source Sans Pro', 'Helvetica Neue', sans-serif;
        font-size: 14px;
        color: ${isDarkMode.value ? '#f0f0f0' : '#333'};
        background: ${isDarkMode.value ? '#2c2c2c' : '#fff'};
      ">
        <div style="margin-bottom: 6px;">
          <span style="font-weight: bold;">Name:</span>
          <span>${name}</span>
        </div>
        <div style="margin-bottom: 6px;">
          <span style="font-weight: bold;">Area:</span>
          <span>${roundedArea}</span>
        </div>
        <div>
          <span style="font-weight: bold;">County:</span>
          <span>${countyName}</span>
        </div>
      </div>
    `

    popup.setLngLat(geom.geometry.coordinates as [number, number])
      .setHTML(popupContent)
      .addTo(map.value!)

    popup.getElement()?.addEventListener('click', () => {
      push(`/settlement/map/${sett_id}`)
    })
  } catch (error: any) {
    console.error('Error loading settlement:', error)
    ElMessage.error('Failed to load settlement details')
  }
}
</script>

<style scoped>
.floating-collapse {
  position: fixed;
  top: 110px;
  left: 255px;
  z-index: 1000;
  background-color: rgba(255, 255, 255, 0.95);
  color: #333;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dark .floating-collapse {
  background-color: rgba(30, 30, 30, 0.95);
  color: #f0f0f0;
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.05);
}

.floating-collapse .el-select,
.floating-collapse .el-button {
  width: 95%;
}

#map {
  height: 95vh;
}

@media (max-width: 600px) {
  .floating-collapse {
    display: none;
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
}
</style>
