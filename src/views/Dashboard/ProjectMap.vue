<template>
  <div class="floating-collapse">
    <el-select 
      multiple 
      clearable 
      filterable 
      v-model="implementer" 
      placeholder="Filter by Programme" 
      @change="handleChangeImplementer" 
      :onClear="ResetFilters"
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
      :onClear="ResetFilters"
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
      :onClear="ResetFilters"
    >
      <el-option v-for="item in subCountyOptions" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>


 
    <el-button @click="ResetFilters"> Reset Filters</el-button>
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

      <!-- Additional Project Details -->
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

      <!-- Settlement Details Button -->
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
import { ref, reactive, watch, onMounted } from 'vue'
import { ElButton, ElSelect, ElOption, ElMessage, ElDrawer, ElDescriptions, ElDescriptionsItem } from 'element-plus'
import mapboxgl from "mapbox-gl"
import 'mapbox-gl/dist/mapbox-gl.css'
import * as turf from '@turf/turf'
import { useAppStore, useAppStoreWithOut } from '@/store/modules/app'
import { computed } from 'vue'
import { getOneGeo, streamGeo, getAllGeo } from '@/api/settlements'
import { getListWithoutGeo } from '@/api/counties'
import { getOneSettlement } from '@/api/settlements'
import { useRouter } from 'vue-router'
import { useCache } from '@/hooks/web/useCache'
import { userHasPrivilegedNationalLocation } from '@/utils/roleScope'

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

const hasNationalAccess = computed(() => userHasPrivilegedNationalLocation(userInfo?.roles))

const userCountyRole = computed(() => {
  return userInfo?.roles?.find((role: any) => 
    role.user_roles?.location_level === 'county'
  )
})

const userCountyId = computed(() => {
  return userCountyRole.value?.user_roles?.county_id || null
})

// Check if user should be restricted to their county
const isCountyRestricted = computed(() => {
  return !isSuperAdmin.value && !hasNationalAccess.value && !!userCountyId.value
})

console.log('ProjectMap.vue - User location info:', {
  isSuperAdmin: isSuperAdmin.value,
  hasNationalAccess: hasNationalAccess.value,
  userCountyId: userCountyId.value,
  isCountyRestricted: isCountyRestricted.value
})
 
// Map and data refs
const map = ref()
const mapLoading = ref(false)
const mapLoadingText = ref('Loading map....')

// Filter refs
const county = ref()
const subcounty = ref()
const implementer = ref()
const filterFields = ref([])
const filterValues = ref([])

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
const geojson = ref([])
const allProjectsGeo = ref([])
const countyGeo = ref()
const subcountyGeo = ref([])
const polyFarms = ref()

// Options refs
const countyOptions = ref([])
const subCountyOptions = ref([])
const implementerOptions = ref([])

// Mapbox token
const MapBoxToken = 'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = MapBoxToken

const isMobile = computed(() => appStore.getMobile)
const isDarkMode = appStore.getIsDark

// Step 1: Get project_locations with geo
const getProjectLocations = async () => {
  const data: any = {
    model: 'project_location',
    // associatedModels: 'project',
    // excludeGeoFromAssociations: 'true'
  }

  // Apply county restriction if user is county-restricted (unless super admin or national admin)
  if (isCountyRestricted.value && userCountyId.value) {
    data.filters = ['county_id']
    data.filterValues = [[userCountyId.value]]
    console.log('Applying county restriction filter for project locations, county_id:', userCountyId.value)
  }

  try {
    mapLoadingText.value = 'Getting Project Locations...'
    const response = await getAllGeo(data)
    console.log('Project locations response:', response)
    
    // Check if response and data exist
    if (!response || !response.data) {
      throw new Error('Invalid response from server')
    }
    
    // The data is nested under json_build_object
    const geoData = response.data[0]?.json_build_object || response.data
    
    // Check if geoData has features array
    if (!geoData.features || !Array.isArray(geoData.features)) {
      console.warn('No features found in response data:', geoData)
      geojson.value = { type: 'FeatureCollection', features: [] }
      allProjectsGeo.value = { type: 'FeatureCollection', features: [] }
      return
    }
    
    geojson.value = await computeCentroids(geoData)
    
    // Deep copy using JSON method (structuredClone may fail with complex GeoJSON objects)
    try {
      allProjectsGeo.value = JSON.parse(JSON.stringify(geojson.value))
    } catch (error) {
      console.warn('[getProjectLocations] Error copying geojson, using shallow copy:', error)
      // Fallback to shallow copy if JSON serialization fails
      allProjectsGeo.value = {
        type: geojson.value.type,
        features: [...geojson.value.features]
      }
    }
    
    // Add project locations to map immediately
    await addSettlementLayers()
    
  } catch (error) {
    console.error('Error fetching project locations:', error.message)
    ElMessage.error('Failed to load project locations')
    
    // Set empty geojson to prevent further errors
    geojson.value = { type: 'FeatureCollection', features: [] }
    allProjectsGeo.value = { type: 'FeatureCollection', features: [] }
  }
}

// Step 2: Extract county IDs from locations and get county geo
const getCountyGeoFromLocations = async () => {
  try {
    // Extract unique county IDs from project locations
    const countyIds = [...new Set(geojson.value.features.map(feature => feature.properties.county_id).filter(id => id))]
    console.log('Extracted county IDs:', countyIds)
    
    if (countyIds.length === 0) {
      console.warn('No county IDs found in project locations')
      return
    }
    
    mapLoadingText.value = 'Getting County Boundaries...'
    
    // Get county geo for each county ID
    const countyGeoPromises = countyIds.map(async (countyId) => {
      const geoForm = { model: 'county', id: countyId }
      const res = await getOneGeo(geoForm)
      return res.data[0].json_build_object
    })
    
    const countyGeos = await Promise.all(countyGeoPromises)
    
    // Combine all county geometries into one feature collection
    const allCountyFeatures = countyGeos.flatMap(geo => geo.features)
    countyGeo.value = {
      type: 'FeatureCollection',
      features: allCountyFeatures
    }
    
    console.log('County geo loaded:', countyGeo.value)
    
    // Add county layer to map
    addCountyLayer()
    
  } catch (error) {
    console.error('Error fetching county geo:', error.message)
    ElMessage.error('Failed to load county boundaries')
  }
}

// Add county layer to map
const addCountyLayer = () => {
  if (!map.value || !countyGeo.value) return
  
  // Check if source exists before adding
  if (map.value.getSource('County')) {
    // Update existing source
    (map.value.getSource('County') as any).setData(countyGeo.value)
  } else {
    // Add new source
    map.value.addSource('County', {
      type: 'geojson',
      data: countyGeo.value
    })
  }
  
  // Check if layer exists before adding
  if (!map.value.getLayer('county')) {
    map.value.addLayer({
      id: 'county',
      type: 'line',
      source: 'County',
      paint: {
        'line-color': 'red',
        'line-opacity': 1,
        'line-width': 2
      }
    })
  }
}

// Compute centroids for non-point features
const computeCentroids = async (featureCollection) => {
  const resultFeatures = []
  const polyFeatures = []

  // Check if featureCollection and features exist
  if (!featureCollection || !featureCollection.features || !Array.isArray(featureCollection.features)) {
    console.warn('Invalid feature collection provided to computeCentroids')
    return {
      type: 'FeatureCollection',
      features: []
    }
  }

  featureCollection.features.forEach((feature) => {
    if (!feature || !feature.geometry || !feature.geometry.type) {
      return
    }

    if (feature.geometry.type === 'Point') {
      resultFeatures.push(feature)
    } else {
      try {
        const centroid = turf.centroid(feature)
        centroid.properties = feature.properties
        resultFeatures.push(centroid)
        polyFeatures.push(feature)
      } catch (error) {
        console.error('Error computing centroid:', error)
      }
    }
  })

  polyFarms.value = {
    type: 'FeatureCollection',
    features: polyFeatures
  }

  return {
    type: 'FeatureCollection',
    features: resultFeatures
  }
}

// Add project location layers to map (all as points/centroids)
const addSettlementLayers = async () => {
  if (!map.value) return
  
  // Check if we have valid data
  if (!geojson.value || !geojson.value.features) {
    console.warn('No geojson data available for project locations')
    return
  }
  
  // Check if source exists before adding
  if (map.value.getSource('projectLocations')) {
    // Update existing source
    (map.value.getSource('projectLocations') as any).setData(geojson.value)
  } else {
    // Add new source
    map.value.addSource('projectLocations', {
      type: 'geojson',
      data: geojson.value
    })
  }

  // Add project location points (all features are now points/centroids)
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

  // Add project location labels
  if (!map.value.getLayer('projectLabels')) {
    map.value.addLayer({
      id: 'projectLabels',
      type: 'symbol',
      source: 'projectLocations',
      layout: {
        'text-field': ['concat', ['to-string', ['get', 'name']]],
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

  // Fit map to bounds with validation
  if (geojson.value.features.length > 0) {
    try {
      const bounds = turf.bbox(geojson.value)
      // Validate bounds before fitting
      if (bounds && bounds.length === 4 &&
          isFinite(bounds[0]) && isFinite(bounds[1]) &&
          isFinite(bounds[2]) && isFinite(bounds[3]) &&
          bounds[0] >= -180 && bounds[0] <= 180 &&
          bounds[2] >= -180 && bounds[2] <= 180 &&
          bounds[1] >= -90 && bounds[1] <= 90 &&
          bounds[3] >= -90 && bounds[3] <= 90) {
        const cameraOptions = map.value.cameraForBounds(bounds, { padding: 5 })
        if (cameraOptions) {
          cameraOptions.zoom = cameraOptions.zoom - 1
          map.value.easeTo(cameraOptions)
        }
      } else {
        console.warn('[addSettlementLayers] Invalid bounds, skipping fitBounds')
      }
    } catch (error) {
      console.warn('[addSettlementLayers] Error calculating bounds:', error)
    }
  }
}

// Remove project location layers
const removeSettlementLayers = async () => {
  if (!map.value) return
  
  const layers = ['projectLocations', 'projectLabels']
  const sources = ['projectLocations']
  
  layers.forEach(layer => {
    if (map.value.getLayer(layer)) {
      map.value.removeLayer(layer)
    }
  })
  
  sources.forEach(source => {
    if (map.value.getSource(source)) {
      map.value.removeSource(source)
    }
  })
}

// Get county list
const getCounty = async () => {
  try {
    const params: any = {
      curUser: 1,
      model: 'county',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC',
      cache_key: 'new_list_no_geo'
    }

    // Apply county restriction if user is county-restricted
    if (isCountyRestricted.value && userCountyId.value) {
      params.filters = ['id']
      params.filterValues = [[userCountyId.value]]
      console.log('Applying county restriction filter for county list, county_id:', userCountyId.value)
    }

    const res = await getListWithoutGeo({ params })

    const ret = res.data
    countyOptions.value = [] // Clear existing options
    ret.forEach((data) => {
      const option = {
        value: data.id,
        label: data.name
      }
      countyOptions.value.push(option)
    })
  } catch (error) {
    console.error('Error fetching counties:', error)
  }
}

// Get implementers
const getImplementers = async () => {
  try {
    const res = await getListWithoutGeo({
    params: {
        curUser: 1,
        model: 'programme_implementation',
        searchField: 'title',
        searchKeyword: '',
      sort: 'ASC'
    }
    })

    const ret = res.data
    ret.forEach((data) => {
      const option = {
        value: data.id,
        title: data.title,
        label: data.acronym
      }
      implementerOptions.value.push(option)
    })
  //  implementer.value=3
  } catch (error) {
    console.error('Error fetching implementers:', error)
  }
}

// Get implementer label
const getImplementerLabel = (id) => {
  const found = implementerOptions.value.find(item => item.value === id)
  return found ? found.title : 'Unknown'
}

// Handle county change
const handleChangeCounty = async (countyId) => {
  subcounty.value = undefined
  subCountyOptions.value = []

  const field = 'county_id'
  const value = [countyId]

  const index = filterFields.value.indexOf(field)
  if (index !== -1) {
    filterValues.value.splice(index, 1, value)
  } else {
    filterFields.value.push(field)
    filterValues.value.push(value)
  }

  if (countyId) {
    mapLoading.value = true
    mapLoadingText.value = 'Loading county data...'
    
    try {
      // Load counties list if not already loaded
      if (countyOptions.value.length === 0) {
        await getCounty()
      }

      // Step 2: Load counties from project locations (if not already done)
      if (!countyGeo.value) {
        await getCountyGeoFromLocations()
      }

      // Remove all existing county layers
    if (map.value.getLayer('county')) {
        map.value.removeLayer('county')
      }
      if (map.value.getSource('County')) {
        map.value.removeSource('County')
      }

      // Get and add only the selected county
      const geoForm = { model: 'county', id: countyId }
      const res = await getOneGeo(geoForm)
      const selectedCountyGeo = res.data[0].json_build_object

      // Check if source exists before adding
      if (map.value.getSource('County')) {
        // Update existing source
        (map.value.getSource('County') as any).setData(selectedCountyGeo)
      } else {
        // Add new source
        map.value.addSource('County', {
          type: 'geojson',
          data: selectedCountyGeo
        })
      }

      // Check if layer exists before adding
      if (!map.value.getLayer('county')) {
        map.value.addLayer({
          id: 'county',
          type: 'line',
          source: 'County',
          paint: {
            'line-color': 'red',
            'line-opacity': 1,
            'line-width': 2
          }
        })
      }

      // Fit map to selected county bounds with validation
      try {
        if (selectedCountyGeo && selectedCountyGeo.features && selectedCountyGeo.features.length > 0) {
          const bounds = turf.bbox(selectedCountyGeo)
          // Validate bounds before fitting
          if (bounds && bounds.length === 4 &&
              isFinite(bounds[0]) && isFinite(bounds[1]) &&
              isFinite(bounds[2]) && isFinite(bounds[3]) &&
              bounds[0] >= -180 && bounds[0] <= 180 &&
              bounds[2] >= -180 && bounds[2] <= 180 &&
              bounds[1] >= -90 && bounds[1] <= 90 &&
              bounds[3] >= -90 && bounds[3] <= 90) {
            map.value.fitBounds(bounds, { padding: 20 })
          } else {
            console.warn('[handleChangeCounty] Invalid bounds, skipping fitBounds')
          }
        }
      } catch (error) {
        console.warn('[handleChangeCounty] Error calculating bounds:', error)
      }

      // Filter project locations for selected county
      await getSubsetGeo(filterFields.value, filterValues.value)
      
      // Get subcounties for selected county
      await getSubcountiesForCounty(countyId)
      
    } catch (error) {
      console.error('Error loading selected county:', error)
      ElMessage.error('Failed to load county data')
    } finally {
      mapLoading.value = false
    }
  } else {
    // If no county selected, remove county layer
    if (map.value.getLayer('county')) {
      map.value.removeLayer('county')
    }
    if (map.value.getSource('County')) {
      map.value.removeSource('County')
    }
  }
}

// Handle subcounty change
const handleChangeSubcounty = async (subcountyIds) => {
  const field = 'subcounty_id'
  const value = Array.isArray(subcountyIds) ? subcountyIds : (subcountyIds ? [subcountyIds] : [])

  const index = filterFields.value.indexOf(field)
  if (index !== -1) {
    if (value.length > 0) {
      filterValues.value.splice(index, 1, value)
    } else {
      // Remove filter if no subcounties selected
      filterFields.value.splice(index, 1)
      filterValues.value.splice(index, 1)
    }
  } else {
    if (value.length > 0) {
      filterFields.value.push(field)
      filterValues.value.push(value)
    }
  }

  if (value.length > 0) {
    mapLoading.value = true
    mapLoadingText.value = 'Loading subcounty data...'
    
    try {
      await getSubsetGeo(filterFields.value, filterValues.value)
      
      // Load and display the selected subcounty geometries
      await loadSubcountyGeometries(value)
      
      await removeSettlementLayers()
      await addSettlementLayers()
    } catch (error) {
      console.error('Error loading subcounty data:', error)
      ElMessage.error('Failed to load subcounty data')
    } finally {
      mapLoading.value = false
    }
  } else {
    // If no subcounties selected, reset filters
    await getSubsetGeo(filterFields.value, filterValues.value)
  }
}

// Handle implementer change
const handleChangeImplementer = async (implementerIds) => {
  const field = 'implementer'
  const value = Array.isArray(implementerIds) ? implementerIds : (implementerIds ? [implementerIds] : [])

  const index = filterFields.value.indexOf(field)
  if (index !== -1) {
    if (value.length > 0) {
      filterValues.value.splice(index, 1, value)
    } else {
      // Remove filter if no implementers selected
      filterFields.value.splice(index, 1)
      filterValues.value.splice(index, 1)
    }
  } else {
    if (value.length > 0) {
      filterFields.value.push(field)
      filterValues.value.push(value)
    }
  }

  // If no implementer selected, restore all county options and reset filters
  if (value.length === 0) {
    // Restore all county options
    await getCounty()
    
    // Reset project locations to show all
    geojson.value = allProjectsGeo.value
    await removeSettlementLayers()
    await addSettlementLayers()
    
    // Remove county layer
    if (map.value.getLayer('county')) {
      map.value.removeLayer('county')
    }
    if (map.value.getSource('County')) {
      map.value.removeSource('County')
    }
    
    return
  }

  mapLoading.value = true
  mapLoadingText.value = 'Loading implementer data...'
  
  try {
    // Load counties list if not already loaded
    if (countyOptions.value.length === 0) {
      await getCounty()
    }

    // Step 2: Load counties from project locations (if not already done)
    if (!countyGeo.value) {
      await getCountyGeoFromLocations()
    }

    await getSubsetGeo(filterFields.value, filterValues.value)

    // Filter county options based on implementer's project locations
    await filterCountyOptionsByImplementer()

    // Extract county IDs from filtered projects and load those counties
    await loadCountiesFromFilteredProjects()

    await removeSettlementLayers()
    await addSettlementLayers()
  } catch (error) {
    console.error('Error loading implementer data:', error)
    ElMessage.error('Failed to load implementer data')
  } finally {
    mapLoading.value = false
  }
}

// Load counties from filtered projects
const loadCountiesFromFilteredProjects = async () => {
  try {
    // Extract unique county IDs from filtered projects
    const countyIds = [...new Set(geojson.value.features.map(feature => feature.properties.county_id).filter(id => id))]
    
    if (countyIds.length === 0) {
      console.log('No county IDs found in filtered projects')
      return
    }

    console.log('Loading counties for implementer:', countyIds)

    // Remove existing county layers
    if (map.value.getLayer('county')) {
      map.value.removeLayer('county')
    }
    if (map.value.getSource('County')) {
      map.value.removeSource('County')
    }

    // Get county geometries for all relevant counties
    const countyPromises = countyIds.map(async (countyId) => {
      try {
        const geoForm = { model: 'county', id: countyId }
  const res = await getOneGeo(geoForm)
        return res.data[0].json_build_object
      } catch (error) {
        console.error(`Error loading county ${countyId}:`, error)
        return null
      }
    })

    const countyGeometries = (await Promise.all(countyPromises)).filter(geo => geo !== null)

    if (countyGeometries.length === 0) {
      console.log('No county geometries loaded')
      return
    }

    // Combine all county geometries into one feature collection
    const combinedCountyGeo = {
      type: 'FeatureCollection',
      features: countyGeometries.flatMap(geo => geo.features || [geo])
    }

    // Check if source exists before adding
    if (map.value.getSource('County')) {
      // Update existing source
      (map.value.getSource('County') as any).setData(combinedCountyGeo)
    } else {
      // Add new source
      map.value.addSource('County', {
        type: 'geojson',
        data: combinedCountyGeo
      })
    }

    // Check if layer exists before adding
    if (!map.value.getLayer('county')) {
      map.value.addLayer({
        id: 'county',
        type: 'line',
        source: 'County',
        paint: {
          'line-color': 'red',
          'line-opacity': 1,
          'line-width': 2
        }
      })
    }

    // Fit map to show all relevant counties with validation
    try {
      if (combinedCountyGeo && combinedCountyGeo.features && combinedCountyGeo.features.length > 0) {
        const bounds = turf.bbox(combinedCountyGeo)
        // Validate bounds before fitting
        if (bounds && bounds.length === 4 &&
            isFinite(bounds[0]) && isFinite(bounds[1]) &&
            isFinite(bounds[2]) && isFinite(bounds[3]) &&
            bounds[0] >= -180 && bounds[0] <= 180 &&
            bounds[2] >= -180 && bounds[2] <= 180 &&
            bounds[1] >= -90 && bounds[1] <= 90 &&
            bounds[3] >= -90 && bounds[3] <= 90) {
          map.value.fitBounds(bounds, { padding: 20 })
        } else {
          console.warn('[loadCountiesFromFilteredProjects] Invalid bounds, skipping fitBounds')
        }
      }
    } catch (error) {
      console.warn('[loadCountiesFromFilteredProjects] Error calculating bounds:', error)
    }

  } catch (error) {
    console.error('Error loading counties from filtered projects:', error)
  }
}

// Filter county options based on implementer's project locations
const filterCountyOptionsByImplementer = async () => {
  try {
    // Get all county options first (if not already loaded)
    if (countyOptions.value.length === 0) {
      await getCounty()
    }

    // Extract unique county IDs from filtered projects
    const countyIds = [...new Set(geojson.value.features.map(feature => feature.properties.county_id).filter(id => id))]
    
    if (countyIds.length === 0) {
      console.log('No county IDs found in filtered projects')
      // Clear county options if no projects found
      countyOptions.value = []
      return
    }

    console.log('Filtering county options for implementer:', countyIds)

    // Filter county options to only show counties that have projects from this implementer
    const allCountyOptions = [...countyOptions.value] // Keep original list
    countyOptions.value = allCountyOptions.filter(option => 
      countyIds.includes(option.value)
    )

    console.log(`Filtered county options from ${allCountyOptions.length} to ${countyOptions.value.length}`)

  } catch (error) {
    console.error('Error filtering county options by implementer:', error)
  }
}

// Get clicked project location details
const getClickedProjectLocation = async (projectLocationId, lngLat) => {
  try {
    const form = {
      model: 'project_location',
      id: projectLocationId,
      assocModel: 'project'
    }

    const res = await getOneSettlement(form)
    const projectLocation = res.data

    console.log('Clicked project location:', projectLocation)

    // Extract project details
    const project = projectLocation.project || {}
    const locationName = projectLocation.location_name || 'Unknown Location'
    const locationType = projectLocation.location_type || ''
    const projectCode = project.project_code || 'N/A'
    const projectTitle = project.title || 'Unknown Project'
    const implementerName = getImplementerLabel(projectLocation.implementer)

    // Set project details for drawer
    projectDetails.value = {
      projectTitle,
      projectCode,
      locationName: `${locationName} ${locationType}`.trim(),
      implementerName,
      projectLocationId,
      project: project,
      settlementId: projectLocation.settlement_id,
      locationType: projectLocation.location_type
    }

    // Show drawer
    drawerVisible.value = true

  } catch (error) {
    console.error('Error fetching project location details:', error)
    ElMessage.error('Failed to load project location details')
  }
}

// Handle drawer close
const handleDrawerClose = (done) => {
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

// Get subcounties for county
const getSubcountiesForCounty = async (countyId) => {
  try {
    const res = await getListWithoutGeo({
      params: {
        curUser: 1,
        model: 'subcounty',
        assocModel: 'county',
        searchField: 'county_id',
        searchKeyword: countyId,
        sort: 'ASC'
      }
    })
    
    const ret = res.data
    const coptions = []
    ret.forEach((data) => {
      const option = {
        value: data.id,
        label: data.name
      }
      coptions.push(option)
    })
    
    coptions.sort((a, b) => a.value - b.value)
    subCountyOptions.value = coptions

    // Load subcounty geometries and display them
    await loadSubcountyGeometries(ret.map(item => item.id))
  } catch (error) {
    console.error('Error fetching subcounties:', error)
  }
}

// Load subcounty geometries and display them on map
const loadSubcountyGeometries = async (subcountyIds) => {
  try {
    if (subcountyIds.length === 0) {
      console.log('No subcounty IDs to load')
      return
    }

    console.log('Loading subcounty geometries:', subcountyIds)

    // Get subcounty geometries for all subcounties
    const subcountyPromises = subcountyIds.map(async (subcountyId) => {
      try {
        const geoForm = { model: 'subcounty', id: subcountyId }
        const res = await getOneGeo(geoForm)
        return res.data[0].json_build_object
      } catch (error) {
        console.error(`Error loading subcounty ${subcountyId}:`, error)
        return null
      }
    })

    const subcountyGeometries = (await Promise.all(subcountyPromises)).filter(geo => geo !== null)

    if (subcountyGeometries.length === 0) {
      console.log('No subcounty geometries loaded')
      // Remove existing layers if no data
      if (map.value.getLayer('Subcounty')) {
        map.value.removeLayer('Subcounty')
      }
      if (map.value.getSource('Subcounty')) {
        map.value.removeSource('Subcounty')
      }
      return
    }

    // Combine all subcounty geometries into one feature collection
    const combinedSubcountyGeo = {
      type: 'FeatureCollection',
      features: subcountyGeometries.flatMap(geo => geo.features || [geo])
    }

    // Check if source exists before adding
    if (map.value.getSource('Subcounty')) {
      // Update existing source
      (map.value.getSource('Subcounty') as any).setData(combinedSubcountyGeo)
    } else {
      // Add new source
      map.value.addSource('Subcounty', {
        type: 'geojson',
        data: combinedSubcountyGeo
      })
    }

    // Check if layer exists before adding
    if (!map.value.getLayer('Subcounty')) {
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
      })
    }

  } catch (error) {
    console.error('Error loading subcounty geometries:', error)
  }
}

// Get subset geo based on filters
const getSubsetGeo = async (filterFields, filterValues) => {
  // If no filters, return all data
  if (!filterFields || filterFields.length === 0) {
    geojson.value = await computeCentroids(allProjectsGeo.value)
    await removeSettlementLayers()
    await addSettlementLayers()
    return
  }

  // Check if we have valid data
  if (!allProjectsGeo.value || !allProjectsGeo.value.features || allProjectsGeo.value.features.length === 0) {
    console.warn('No project data available')
    return
  }

  const filteredFeatures = allProjectsGeo.value.features.filter(feature => {
    return filterFields.every((field, index) => {
      const expectedValue = filterValues[index]
      const featureValue = feature.properties[field]
      
      // Skip if filter value is empty or null
      if (!expectedValue || (Array.isArray(expectedValue) && expectedValue.length === 0)) {
        return true // Include this feature (no filter applied for this field)
      }
      
      // Handle array values (multiple selections)
      if (Array.isArray(expectedValue)) {
        // Convert both to strings for comparison to handle type mismatches
        const featureValueStr = String(featureValue)
        return expectedValue.some(val => String(val) === featureValueStr)
      }
      
      // Handle single value (backward compatibility)
      // Use loose equality to handle type mismatches (string vs number)
      return String(featureValue) == String(expectedValue)
    })
  })

  const filteredGeoJson = {
    type: "FeatureCollection",
    features: filteredFeatures.map(feature => ({
      type: feature.type,
      geometry: feature.geometry,
      properties: { ...feature.properties }
    }))
  }

  if (filteredGeoJson.features.length > 0) {
    geojson.value = await computeCentroids(filteredGeoJson)
    await removeSettlementLayers()
    await addSettlementLayers()
  } else {
    // Only show warning if we actually have filters applied
    const hasActiveFilters = filterFields.some((field, index) => {
      const value = filterValues[index]
      return value && (Array.isArray(value) ? value.length > 0 : true)
    })
    
    if (hasActiveFilters) {
      ElMessage.warning('No data for the selected filters. Resetting...')
    }
    geojson.value = await computeCentroids(allProjectsGeo.value)
    await removeSettlementLayers()
    await addSettlementLayers()
  }
}

// Reset filters
const ResetFilters = async () => {
  // For county-restricted users, preserve the county filter
  if (isCountyRestricted.value && userCountyId.value) {
    // Only reset subcounty and implementer, keep county
    subcounty.value = []
    implementer.value = []
    
    // Reset filter fields but keep county_id
    const countyIndex = filterFields.value.indexOf('county_id')
    if (countyIndex !== -1) {
      // Keep county_id filter, remove others
      filterFields.value = ['county_id']
      filterValues.value = [[userCountyId.value]]
    }
    
    // Reload subcounties for the county
    await getSubcountiesForCounty(userCountyId.value)
    
    // Re-apply county filter
    await handleChangeCounty([userCountyId.value])
  } else {
    // For non-restricted users, reset everything
    county.value = []
    subcounty.value = []
    subCountyOptions.value = []
    implementer.value = []
    filterFields.value = []
    filterValues.value = []

    // Remove county layer
    if (map.value.getLayer('county')) {
      map.value.removeLayer('county')
    }
    if (map.value.getSource('County')) {
      map.value.removeSource('County')
    }

    mapLoading.value = true
    mapLoadingText.value = 'Refreshing Project Locations...'
    geojson.value = allProjectsGeo.value
    mapLoading.value = false

    await removeSettlementLayers()
    await addSettlementLayers()
  }
}

// Initialize map
const initializeMap = () => {
  const mapStyle = isDarkMode ? 'mapbox://styles/agspatial/clqcfzcoa00bt01nwhmf465f7' : 'mapbox://styles/mapbox/light-v11'
  
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

  map.value.on('load', async () => {
    mapLoading.value = true
    await getProjectLocations()
    await getImplementers()
    
    // For county-restricted users, automatically set county and load subcounties
    if (isCountyRestricted.value && userCountyId.value) {
      console.log('County-restricted user detected, auto-setting county:', userCountyId.value)
      // Set county value as array
      county.value = [userCountyId.value]
      // Load counties list first if not already loaded
      if (countyOptions.value.length === 0) {
        await getCounty()
      }
      // Automatically trigger county change handler to load subcounties
      await handleChangeCounty([userCountyId.value])
    } else {
      // For non-restricted users, just load counties list
      await getCounty()
    }
    
    mapLoading.value = false
  })

  // Add click event for project locations
  map.value.on('click', 'projectLocations', async (e) => {
    const feature = e.features[0]
    if (feature && feature.properties) {
      await getClickedProjectLocation(feature.properties.id, e.lngLat)
    }
  })

  // Change cursor on hover
  map.value.on('mouseenter', 'projectLocations', () => {
    map.value.getCanvas().style.cursor = 'pointer'
  })

  map.value.on('mouseleave', 'projectLocations', () => {
    map.value.getCanvas().style.cursor = ''
  })

  // Watch for dark mode changes
  watch(() => appStore.getIsDark, async (newVal) => {
    const mapStyle = newVal ? 'mapbox://styles/agspatial/clqcfzcoa00bt01nwhmf465f7' : 'mapbox://styles/mapbox/light-v11'
    if (map.value) {
      map.value.setStyle(mapStyle)
      map.value.once('styledata', async () => {
        await addSettlementLayers()
      })
    }
  }, { immediate: true })
}

// Mount component
onMounted(() => {
  initializeMap()
})
</script>

<style>
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
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
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

/* Project Details Drawer Styles */
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
