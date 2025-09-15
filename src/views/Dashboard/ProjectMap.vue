<template>
  <div class="floating-collapse">
    <el-select clearable filterable v-model="implementer" placeholder="Filter by Implementer" @change="handleChangeImplementer" :onClear="ResetFilters">
      <el-option v-for="item in implementerOptions" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>

    <el-select v-model="county" placeholder="Filter by County" @change="handleChangeCounty" filterable clearable :onClear="ResetFilters">
        <el-option v-for="item in countyOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    
    <el-select clearable filterable v-model="subcounty" placeholder="Filter by Subcounty" @change="handleChangeSubcounty" :onClear="ResetFilters">
      <el-option v-for="item in subCountyOptions" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>



    <el-button @click="ResetFilters"> Reset Filters</el-button>
  </div>

  <div v-loading="mapLoading" :element-loading-text="mapLoadingText" id="map" class="map"></div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { ElButton, ElSelect, ElOption, ElMessage } from 'element-plus'
import mapboxgl from "mapbox-gl"
import 'mapbox-gl/dist/mapbox-gl.css'
import * as turf from '@turf/turf'
import { useAppStore } from '@/store/modules/app'
import { computed } from 'vue'
import { getOneGeo, streamGeo, getAllGeo } from '@/api/settlements'
import { getListWithoutGeo } from '@/api/counties'
import { getOneSettlement } from '@/api/settlements'

// User and role setup
const appStore = useAppStore()
 
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
  const data = {
    model: 'project_location',
    // associatedModels: 'project',
    // excludeGeoFromAssociations: 'true'
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
    allProjectsGeo.value = JSON.parse(JSON.stringify(geojson.value))
    
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
  
  // Remove existing county layer if it exists
  if (map.value.getLayer('county')) {
    map.value.removeLayer('county')
  }
  if (map.value.getSource('County')) {
    map.value.removeSource('County')
  }
  
  // Add county source and layer
  map.value.addSource('County', {
    type: 'geojson',
    data: countyGeo.value
  })
  
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
  
  // Add project locations source (all converted to points/centroids)
  map.value.addSource('projectLocations', {
    type: 'geojson',
    data: geojson.value
  })

  // Add project location points (all features are now points/centroids)
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

  // Add project location labels
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

  // Fit map to bounds
  if (geojson.value.features.length > 0) {
    const bounds = turf.bbox(geojson.value)
    const cameraOptions = map.value.cameraForBounds(bounds, { padding: 5 })
    
    if (cameraOptions) {
      cameraOptions.zoom = cameraOptions.zoom - 1
      map.value.easeTo(cameraOptions)
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
  const res = await getListWithoutGeo({
    params: {
        curUser: 1,
      model: 'county',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC',
        cache_key: 'new_list_no_geo'
    }
    })

    const ret = res.data
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

      // Add the selected county to map
      map.value.addSource('County', {
        type: 'geojson',
        data: selectedCountyGeo
      })

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

      // Fit map to selected county bounds
      const bounds = turf.bbox(selectedCountyGeo)
      map.value.fitBounds(bounds, { padding: 20 })

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
const handleChangeSubcounty = async (subcountyId) => {
  const field = 'subcounty_id'
  const value = [subcountyId]

  const index = filterFields.value.indexOf(field)
  if (index !== -1) {
    filterValues.value.splice(index, 1, value)
  } else {
    filterFields.value.push(field)
    filterValues.value.push(value)
  }

  if (subcountyId) {
    mapLoading.value = true
    mapLoadingText.value = 'Loading subcounty data...'
    
    try {
      await getSubsetGeo(filterFields.value, filterValues.value)
      
      // Load and display the selected subcounty geometry
      await loadSubcountyGeometries([subcountyId])
      
      await removeSettlementLayers()
      await addSettlementLayers()
    } catch (error) {
      console.error('Error loading subcounty data:', error)
      ElMessage.error('Failed to load subcounty data')
    } finally {
      mapLoading.value = false
    }
  }
}

// Handle implementer change
const handleChangeImplementer = async (implementerId) => {
  const field = 'implementer'
  const value = [implementerId]

  const index = filterFields.value.indexOf(field)
  if (index !== -1) {
    const existingValue = filterValues.value[index]
    const isSame = JSON.stringify(existingValue) === JSON.stringify(value)

    if (!isSame) {
      filterValues.value.splice(index, 1, value) // update value if changed
    }
    // else do nothing (already filtered)
  } else {
    filterFields.value.push(field)
    filterValues.value.push(value)
  }

  // If no implementer selected, restore all county options and reset filters
  if (!implementerId) {
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

    // Add combined county layer to map
    map.value.addSource('County', {
      type: 'geojson',
      data: combinedCountyGeo
    })

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

    // Fit map to show all relevant counties
    const bounds = turf.bbox(combinedCountyGeo)
    map.value.fitBounds(bounds, { padding: 20 })

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

    // Create popup content
    const popupContent = `
      <div style="
        background: ${isDarkMode ? '#444' : '#91c949'};
        color: ${isDarkMode ? '#fff' : '#000'};
        padding: 10px 12px;
        font-weight: 700;
        text-align: center;
        font-size: 15px;
        border-radius: 8px 8px 0 0;
      ">
        <u>Project Location Details</u>
      </div>
      <div style="
        padding: 10px 12px;
        font-family: 'Source Sans Pro', 'Helvetica Neue', sans-serif;
        font-size: 14px;
        color: ${isDarkMode ? '#f0f0f0' : '#333'};
        background: ${isDarkMode ? '#2c2c2c' : '#fff'};
        border-radius: 0 0 8px 8px;
      ">
        <div style="margin-bottom: 6px;">
          <span style="font-weight: bold;">Project:</span>
          <span>${projectTitle}</span>
        </div>
        <div style="margin-bottom: 6px;">
          <span style="font-weight: bold;">Contract:</span>
          <span>${projectCode}</span>
        </div>
        <div style="margin-bottom: 6px;">
          <span style="font-weight: bold;">Location:</span>
          <span>${locationName} ${locationType}</span>
        </div>
        <div style="margin-bottom: 6px;">
          <span style="font-weight: bold;">Implementer:</span>
          <span>${implementerName}</span>
        </div>
        <div style="margin-bottom: 6px;">
          <span style="font-weight: bold;">Location ID:</span>
          <span>${projectLocationId}</span>
        </div>
      </div>
    `

    // Create and show popup
    const popup = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: false
    })

    popup.setLngLat(lngLat)
      .setHTML(popupContent)
      .addTo(map.value)

  } catch (error) {
    console.error('Error fetching project location details:', error)
    ElMessage.error('Failed to load project location details')
  }
}

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

    // Remove existing subcounty layers
    if (map.value.getLayer('Subcounty')) {
      map.value.removeLayer('Subcounty')
    }
    if (map.value.getSource('Subcounty')) {
      map.value.removeSource('Subcounty')
    }

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
      return
    }

    // Combine all subcounty geometries into one feature collection
    const combinedSubcountyGeo = {
      type: 'FeatureCollection',
      features: subcountyGeometries.flatMap(geo => geo.features || [geo])
    }

    // Add combined subcounty layer to map
    map.value.addSource('Subcounty', {
      type: 'geojson',
      data: combinedSubcountyGeo
    })

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

  } catch (error) {
    console.error('Error loading subcounty geometries:', error)
  }
}

// Get subset geo based on filters
const getSubsetGeo = async (filterFields, filterValues) => {
  const filteredFeatures = allProjectsGeo.value.features.filter(feature =>
    filterFields.every((field, index) => {
      const expectedValue = filterValues[index]
      return feature.properties[field] == expectedValue
    })
  )

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
    ElMessage.warning('No data for the selected filters. Resetting...')
    geojson.value = allProjectsGeo.value
  }
}

// Reset filters
const ResetFilters = async () => {
  county.value = null
  subcounty.value = null
  subCountyOptions.value = []
  implementer.value = null
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
