<template>
  <div class="floating-collapse">
    <el-select 
      multiple 
      clearable 
      filterable 
      v-model="implementer" 
      placeholder="Filter by Programme" 
      @change="handleChangeImplementer" 
    >
      <el-option v-for="item in implementerOptions" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>

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

  <!-- Project Details Drawer -->
  <el-drawer
    v-model="drawerVisible"
    title="Project Location Details"
    direction="rtl"
    size="400px"
    :before-close="handleDrawerClose"
  >
    <div v-if="projectDetails.projectTitle" class="project-details">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="Project Title">
          {{ projectDetails.projectTitle }}
        </el-descriptions-item>
        <el-descriptions-item label="Contract Code">
          {{ projectDetails.projectCode }}
        </el-descriptions-item>
        <el-descriptions-item label="Location">
          {{ projectDetails.locationName }}
        </el-descriptions-item>
        <el-descriptions-item label="Implementer">
          {{ projectDetails.implementerName }}
        </el-descriptions-item>
        <el-descriptions-item label="Location ID">
          {{ projectDetails.projectLocationId }}
        </el-descriptions-item>
      </el-descriptions>

      <div v-if="projectDetails.project" class="additional-details">
        <h4 style="margin-top: 20px; margin-bottom: 10px;">Additional Project Information</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item v-if="projectDetails.project.description" label="Description">
            {{ projectDetails.project.description }}
          </el-descriptions-item>
          <el-descriptions-item v-if="projectDetails.project.start_date" label="Start Date">
            {{ projectDetails.project.start_date }}
          </el-descriptions-item>
          <el-descriptions-item v-if="projectDetails.project.end_date" label="End Date">
            {{ projectDetails.project.end_date }}
          </el-descriptions-item>
          <el-descriptions-item v-if="projectDetails.project.status" label="Status">
            {{ projectDetails.project.status }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <div v-if="isSettlement" class="settlement-actions" style="margin-top: 20px;">
        <el-button 
          type="primary" 
          @click="goToSettlementDetails"
          style="width: 100%;"
        >
          View Settlement Details
        </el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { ElButton, ElSelect, ElOption, ElMessage, ElDrawer, ElDescriptions, ElDescriptionsItem } from 'element-plus'
import mapboxgl from "mapbox-gl"
import 'mapbox-gl/dist/mapbox-gl.css'
import * as turf from '@turf/turf'
import { useAppStore, useAppStoreWithOut } from '@/store/modules/app'
import { 
  getOptimizedProjectLocations,
  getBatchGeometries,
  getCountiesList,
  getSubcountiesList,
  getImplementersList
} from '@/api/project-locations-optimized'
import { getOneSettlement } from '@/api/settlements'
import { useRouter } from 'vue-router'
import { useCache } from '@/hooks/web/useCache'
import { debounce } from '@/utils/debounce'

// User and role setup
const appStore = useAppStore()
const router = useRouter()
const { wsCache } = useCache()
const appStoreWithOut = useAppStoreWithOut()
const userInfo = wsCache.get(appStoreWithOut.getUserInfo)

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

// Map and data refs
const map = ref<mapboxgl.Map | null>(null)
const mapLoading = ref(false)
const mapLoadingText = ref('Loading map....')
const isDarkMode = computed(() => appStore.getIsDark)

// Filter refs
const county = ref<number[]>([])
const subcounty = ref<number[]>([])
const implementer = ref<number[]>([])

// Drawer state
const drawerVisible = ref(false)
const projectDetails = ref({
  projectTitle: '',
  projectCode: '',
  locationName: '',
  implementerName: '',
  projectLocationId: '',
  project: {
    description: '',
    start_date: '',
    end_date: '',
    status: ''
  },
  settlementId: null,
  locationType: ''
})

// Data refs
const geojson = ref<any>({ type: 'FeatureCollection', features: [] })
const countyGeo = ref<any>(null)
// const subcountyGeo = ref<any>(null) // Reserved for future use

// Options refs
const countyOptions = ref<Array<{value: number, label: string}>>([])
const subCountyOptions = ref<Array<{value: number, label: string}>>([])
const implementerOptions = ref<Array<{value: number, label: string, title: string}>>([])

// Mapbox token
const MapBoxToken = 'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = MapBoxToken

// Initialize map
onMounted(() => {
  initializeMap()
})

const initializeMap = () => {
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
  map.value.addControl(new mapboxgl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserHeading: true
  }))

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
        await addProjectLayers()
      })
    }
  )

  map.value.on('load', async () => {
    await initializeMapData()
  })

  // Add click event for project locations
  map.value.on('click', 'projectLocations', async (e: any) => {
    const feature = e.features[0]
    if (feature && feature.properties) {
      await getClickedProjectLocation(feature.properties.id)
    }
  })

  // Change cursor on hover
  map.value.on('mouseenter', 'projectLocations', () => {
    if (map.value) {
      map.value.getCanvas().style.cursor = 'pointer'
    }
  })

  map.value.on('mouseleave', 'projectLocations', () => {
    if (map.value) {
      map.value.getCanvas().style.cursor = ''
    }
  })
}

// Initialize map data
const initializeMapData = async () => {
  try {
    mapLoading.value = true
    mapLoadingText.value = 'Loading data...'

    // Parallelize all initial data loading
    const [, , , countyGeoData] = await Promise.all([
      loadProjectLocations(),
      loadCounties(),
      loadImplementers(),
      loadCountyGeo()
    ])

    // Auto-set county for restricted users
    if (isCountyRestricted.value && userCountyId.value) {
      county.value = [userCountyId.value]
      await handleChangeCounty([userCountyId.value])
    } else {
      await addProjectLayers()
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

// Load project locations with server-side filtering
const loadProjectLocations = async (filters?: { 
  countyIds?: number[], 
  subcountyIds?: number[], 
  implementerIds?: number[] 
}) => {
  try {
    const params: any = {
      model: 'project_location',
      includeCentroids: true,
      includePolygons: false
    }

    // Apply user restrictions
    if (isCountyRestricted.value && userCountyId.value) {
      params.filters = ['county_id']
      params.filterValues = [[userCountyId.value]]
    } else if (filters) {
      // Apply provided filters
      const filterFields: string[] = []
      const filterValues: any[] = []

      if (filters.countyIds && filters.countyIds.length > 0) {
        filterFields.push('county_id')
        filterValues.push(filters.countyIds)
      }
      if (filters.subcountyIds && filters.subcountyIds.length > 0) {
        filterFields.push('subcounty_id')
        filterValues.push(filters.subcountyIds)
      }
      if (filters.implementerIds && filters.implementerIds.length > 0) {
        filterFields.push('implementer')
        filterValues.push(filters.implementerIds)
      }

      if (filterFields.length > 0) {
        params.filters = filterFields
        params.filterValues = filterValues
      }
    }

    const response = await getOptimizedProjectLocations({ params })
    geojson.value = (response as any).results || (response as any).data || { type: 'FeatureCollection', features: [] }
    
    return geojson.value
  } catch (error: any) {
    console.error('Error loading project locations:', error)
    ElMessage.error('Failed to load project locations')
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
    countyOptions.value = ((response as any).data || []).map((item: any) => ({
      value: item.id,
      label: item.name
    }))
    
    return countyOptions.value
  } catch (error: any) {
    console.error('Error loading counties:', error)
    return []
  }
}

// Load implementers
const loadImplementers = async () => {
  try {
    const response = await getImplementersList({ params: {} })
    implementerOptions.value = ((response as any).data || []).map((item: any) => ({
      value: item.id,
      label: item.acronym || item.title,
      title: item.title
    }))
    return implementerOptions.value
  } catch (error: any) {
    console.error('Error loading implementers:', error)
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
    countyGeo.value = (res as any).data || { type: 'FeatureCollection', features: [] }
    return countyGeo.value
  } catch (error: any) {
    console.error('Error loading county geo:', error)
    return null
  }
}

// Add project layers to map
const addProjectLayers = async () => {
  if (!map.value) return

  // Update or add source
  if (map.value.getSource('projectLocations')) {
    (map.value.getSource('projectLocations') as mapboxgl.GeoJSONSource).setData(geojson.value)
  } else {
    map.value.addSource('projectLocations', {
      type: 'geojson',
      data: geojson.value
    })
  }

  // Add project location points
  if (!map.value.getLayer('projectLocations')) {
    map.value.addLayer({
      id: 'projectLocations',
      type: 'circle',
      source: 'projectLocations',
      paint: {
        'circle-color': 'green',
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': 'white'
      }
    })
  }

  // Add labels
  if (!map.value.getLayer('projectLabels')) {
    map.value.addLayer({
      id: 'projectLabels',
      type: 'symbol',
      source: 'projectLocations',
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

    const beforeId = map.value.getLayer('projectLabels') ? 'projectLabels' : undefined
    map.value.addLayer({
      id: 'county',
      type: 'line',
      source: 'County',
      paint: {
        'line-color': 'red',
        'line-opacity': 1,
        'line-width': 2
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
      mapLoadingText.value = 'Loading filtered project locations...'

      // Parallelize: load projects and county geometries
      const [, countyGeos] = await Promise.all([
        loadProjectLocations({ 
          countyIds: countyArray,
          implementerIds: implementer.value 
        }),
        loadCountyGeometries(countyArray)
      ])

      await addProjectLayers()
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
      mapLoadingText.value = 'Loading filtered project locations...'

      await loadProjectLocations({ 
        countyIds: county.value,
        subcountyIds: subcountyArray,
        implementerIds: implementer.value
      })

      const subcountyGeos = await loadSubcountyGeometries(subcountyArray)
      await addProjectLayers()
      
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

// Debounced implementer change handler
const handleChangeImplementer = debounce(async (implementerIds: number | number[]) => {
  if (!map.value) return

  const implementerArray = Array.isArray(implementerIds) ? implementerIds : (implementerIds ? [implementerIds] : [])

  try {
    mapLoading.value = true
    mapLoadingText.value = 'Loading filtered project locations...'

    await loadProjectLocations({ 
      countyIds: county.value,
      subcountyIds: subcounty.value,
      implementerIds: implementerArray
    })

    // Filter county options based on implementer's project locations
    await filterCountyOptionsByImplementer()

    // Load counties from filtered projects
    await loadCountiesFromFilteredProjects()

    await addProjectLayers()

    mapLoading.value = false
  } catch (error: any) {
    console.error('Error changing implementer:', error)
    ElMessage.error('Failed to load implementer data')
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
    return (response as any).data || { type: 'FeatureCollection', features: [] }
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
    return (response as any).data || { type: 'FeatureCollection', features: [] }
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
      if ((res as any).data) {
        allSubcounties.push(...(res as any).data)
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

    const beforeId = map.value.getLayer('projectLabels') ? 'projectLabels' : undefined
    map.value.addLayer({
      id: 'Subcounty',
      type: 'line',
      source: 'Subcounty',
      paint: {
        'line-color': 'blue',
        'line-opacity': 1,
        'line-width': 1,
        'line-dasharray': [2, 2]
      }
    }, beforeId)
  }
}

// Filter county options based on implementer's project locations
const filterCountyOptionsByImplementer = async () => {
  try {
    // Extract unique county IDs from filtered projects
    const countyIdSet = new Set<number>()
    geojson.value.features.forEach((feature: any) => {
      const id = feature.properties?.county_id
      if (id !== null && id !== undefined && typeof id === 'number') {
        countyIdSet.add(id)
      }
    })
    const countyIds: number[] = Array.from(countyIdSet)
    
    if (countyIds.length === 0) {
      countyOptions.value = []
      return
    }

    // Reload all counties first
    await loadCounties()

    // Filter to only show counties that have projects from this implementer
    const allCountyOptions = [...countyOptions.value]
    countyOptions.value = allCountyOptions.filter(option => 
      countyIds.includes(option.value)
    )
  } catch (error: any) {
    console.error('Error filtering county options by implementer:', error)
  }
}

// Load counties from filtered projects
const loadCountiesFromFilteredProjects = async () => {
  try {
    const countyIdSet = new Set<number>()
    geojson.value.features.forEach((feature: any) => {
      const id = feature.properties?.county_id
      if (id !== null && id !== undefined && typeof id === 'number') {
        countyIdSet.add(id)
      }
    })
    const countyIds: number[] = Array.from(countyIdSet)
    
    if (countyIds.length === 0) {
      return
    }

    const countyGeos = await loadCountyGeometries(countyIds)
    if (countyGeos) {
      addCountyLayer(countyGeos)
      
      // Fit bounds
      try {
        const bounds = turf.bbox(countyGeos)
        if (bounds && bounds.length === 4 &&
            isFinite(bounds[0]) && isFinite(bounds[1]) &&
            isFinite(bounds[2]) && isFinite(bounds[3])) {
          map.value?.fitBounds(bounds as [number, number, number, number], { padding: 20 })
        }
      } catch (error) {
        console.warn('Error fitting bounds:', error)
      }
    }
  } catch (error: any) {
    console.error('Error loading counties from filtered projects:', error)
  }
}

// Reset filters
const resetFilters = async () => {
  if (isCountyRestricted.value && userCountyId.value) {
    subcounty.value = []
    implementer.value = []
    subCountyOptions.value = []
    await handleChangeCounty([userCountyId.value])
    return
  }

  county.value = []
  subcounty.value = []
  subCountyOptions.value = []
  implementer.value = []

  mapLoading.value = true
  mapLoadingText.value = 'Resetting filters...'

  // Remove subcounty layer
  if (map.value?.getLayer('Subcounty')) {
    map.value.removeLayer('Subcounty')
  }
  if (map.value?.getSource('Subcounty')) {
    map.value.removeSource('Subcounty')
  }

  // Reload all project locations
  await loadProjectLocations()
  await addProjectLayers()

  // Restore county layer
  if (countyGeo.value) {
    addCountyLayer(countyGeo.value)
  }

  mapLoading.value = false
}

// Get clicked project location details
const getClickedProjectLocation = async (projectLocationId: number) => {
  try {
    const form: any = {
      model: 'project_location',
      id: projectLocationId,
      assocModel: 'project'
    }

    const res = await getOneSettlement(form)
    const projectLocation = (res as any).data || res.results

    const project = projectLocation.project || {}
    const locationName = projectLocation.location_name || 'Unknown Location'
    const locationType = projectLocation.location_type || ''
    const projectCode = project.project_code || 'N/A'
    const projectTitle = project.title || 'Unknown Project'
    
    const implementerOption = implementerOptions.value.find(opt => opt.value === projectLocation.implementer)
    const implementerName = implementerOption?.title || 'Unknown'

    projectDetails.value = {
      projectTitle,
      projectCode,
      locationName: `${locationName} ${locationType}`.trim(),
      implementerName,
      projectLocationId: projectLocationId.toString(),
      project: project,
      settlementId: projectLocation.settlement_id,
      locationType: projectLocation.location_type
    }

    drawerVisible.value = true
  } catch (error: any) {
    console.error('Error fetching project location details:', error)
    ElMessage.error('Failed to load project location details')
  }
}

// Handle drawer close
const handleDrawerClose = (done: () => void) => {
  drawerVisible.value = false
  projectDetails.value = {
    projectTitle: '',
    projectCode: '',
    locationName: '',
    implementerName: '',
    projectLocationId: '',
    project: {
      description: '',
      start_date: '',
      end_date: '',
      status: ''
    },
    settlementId: null,
    locationType: ''
  }
  done()
}

// Navigate to settlement details
const goToSettlementDetails = () => {
  if (projectDetails.value.settlementId) {
    router.push({
      name: 'SettlementDetails',
      params: { id: projectDetails.value.settlementId }
    })
  }
}

// Check if project location is a settlement
const isSettlement = computed(() => {
  return projectDetails.value.settlementId || projectDetails.value.locationType === 'settlement'
})
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

.project-details {
  padding: 20px;
}

.additional-details {
  margin-top: 20px;
}

.additional-details h4 {
  color: #409eff;
  font-weight: 600;
  border-bottom: 2px solid #409eff;
  padding-bottom: 8px;
}

@media (max-width: 600px) {
  .floating-collapse {
    display: none;
  }
}
</style>

<style>
.el-loading-mask {
  opacity: 0.7;
}

.el-loading-text {
  color: green;
}

.element-loading-text {
  color: green;
}
</style>
