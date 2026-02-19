<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { ElButton, ElTable, ElTableColumn, ElMessage, ElCollapse, ElCollapseItem, ElCheckbox, ElCheckboxGroup, ElDrawer, ElDescriptions, ElDescriptionsItem } from 'element-plus'
import { GoogleMap, Polygon, InfoWindow, Marker, Polyline, Circle } from 'vue3-google-map'
import * as turf from '@turf/turf'
import { getSettlementMapData, getNeighboringSettlements, getSettlementImageryLayers } from '@/api/settlements'
import { Icon } from '@iconify/vue'
import axios from 'axios'
import { useAppStore } from '@/store/modules/app'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

// Performance optimizations
const apiCache = ref(new Map())
const cacheTimeout = 5 * 60 * 1000 // 5 minutes
const processingQueue = ref<Promise<any>[]>([])
const isProcessing = ref(false)

// Type definitions
interface SettlementMapData {
  settlement?: any
  parcel?: any
  structure?: any
  road?: any
  streetlight?: any
  crime_hotspot?: any
  community_project?: any
  health_facility?: any
  education_facility?: any
  water_point?: any
  sewer?: any
  piped_water?: any
  powerline?: any
  community_hall?: any
  police_station?: any
  mast?: any
  dumping_site?: any
  hazard_zone?: any
}

interface ConsolidatedResponse {
  message: string
  code: string
  data: SettlementMapData
  errors?: string[]
}

// Optimized fetch function with caching
const fetchWithCache = async (key: string, fetchFn: () => Promise<any>) => {
  const cached = apiCache.value.get(key)
  if (cached && Date.now() - cached.timestamp < cacheTimeout) {
    console.log(`🔄 Using cached data for: ${key}`)
    return cached.data
  }
  
  console.log(`🔄 Fetching fresh data for: ${key}`)
  const data = await fetchFn()
  if (data) {
    apiCache.value.set(key, { data, timestamp: Date.now() })
  }
  return data
}

// Debounced function for performance
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

const props = withDefaults(
  defineProps<{
    settlementId: string
    initialMapData?: Record<string, any> | null
    /** Optional GeoJSON Point for assessment location marker: { type: 'Point', coordinates: [lng, lat] } */
    assessmentPoint?: { type: string; coordinates: [number, number] } | null
  }>(),
  { initialMapData: null, assessmentPoint: null }
)

const emit = defineEmits<{
  'layers-loaded': []
}>()

const appStore = useAppStore()
const googleMapsApiKey = 'AIzaSyCrzbOkfG52zkAxYPkMvvRMlxE9qHK4uDk'

const mapRef = ref<any>(null)
const title = ref('')
const mapReady = ref(false)
const drawingManager = ref(null)

// Geo data
const features = ref([])
const parcelGeoData = ref<any[]>([])
const roadGeoData = ref<any[]>([])
const structureGeoData = ref<any[]>([])
const otherPointsGeoData = ref<any>([])

// Paths
const polygons = ref<any[]>([])
const parcels = ref<any[]>([])
const parcelLabels = ref<any[]>([])
const roads = ref<any[]>([])
const schools = ref<any[]>([])
const water_points = ref<any[]>([])
const structures = ref<any[]>([])
const other_points = ref<any[]>([])
const neighboringSettlements = ref<any[]>([])
const neighboringSettlementLabels = ref<any[]>([])
const currentZoom = ref(8) // Default zoom level
const MIN_ZOOM_FOR_LABELS = 16 // Hide labels when zoom is below this level

const isLoading = ref(false)
const mapLoading = ref(true)
const dataLoading = ref(false)

// Progressive loading states
const loadingProgress = ref(0)
const loadingStatus = ref('')
const showProgressOverlay = ref(false)
const hasLoadedMapData = ref(false)

// Track feature counts
const layerFeatureCounts = ref({
  settlement: 0,
  parcels: 0,
  parcelLabels: 0,
  roads: 0,
  hospitals: 0,
  schools: 0,
  water_points: 0,
  structures: 0,
  other_points: 0,
  neighboringSettlements: 0,
})

const legendItems = [
  { label: 'Residential', color: '#8C675D', landuseId: 0, show: false },
  { label: 'Industrial', color: '#800080', landuseId: 1, show: false },
  { label: 'Education', color: '#F6C567', landuseId: 2, show: false },
  { label: 'Recreation', color: '#6FDC6E', landuseId: 3, show: false },
  { label: 'Public Purpose', color: '#FFFF00', landuseId: 4, show: false },
  { label: 'Commercial', color: '#FF1D1E', landuseId: 5, show: false },
  { label: 'Public Utility', color: '#73B2FF', landuseId: 6, show: false },
  { label: 'Transportation', color: '#DCDCDC', landuseId: 7, show: false },
  { label: 'Undeveloped', color: '#FDFD96', landuseId: 8, show: false },
  { label: 'Agricultural', color: '#FDFD96', landuseId: 9, show: false },
]

const PointLegendItems = ref([
  { layer: 'crime_hotspot', label: 'Crime Hotspot', icon: 'icons/theft.png', show: false },
  { layer: 'community_project', label: 'Community Project', icon: 'icons/country.png', show: false },
  { layer: 'community_hall', label: 'Community Hall', icon: 'icons/communitycentre.png', show: false },
  { layer: 'police_station', label: 'Police Station', icon: 'icons/police.png', show: false },
  { layer: 'dumping_site', label: 'Dumping Site', icon: 'icons/landfill.png', show: false },
  { layer: 'hazard_zone', label: 'Hazard Zone', icon: 'icons/caution.png', show: false },
  { layer: 'health_facility', label: 'Health Facility', icon: 'icons/hospital-2.png', show: false },
  { layer: 'education_facility', label: 'School', icon: 'icons/school.png', show: false },
  { layer: 'water_point', label: 'Water Point', icon: 'icons/waterdrop.png', show: false },
  { layer: 'streetlight', label: 'Streetlight', icon: 'icons/lighthouse-2.png', show: false },
  { layer: 'mast', label: 'Mast', icon: 'icons/tower.png', show: false },
])

const PolyLineItems = ref([
  {
    layer: 'road',
    label: 'Road',
    color: 'red',
    style: {
      borderTop: '3px solid red',
      width: '40px',
      height: '0',
    },
    show: false,
  },
  {
    layer: 'powerline',
    label: 'Powerline',
    color: 'green',
    style: {
      borderTop: '2px dotted green',
      width: '40px',
      height: '0',
    },
    show: false,
  },
  {
    layer: 'sewer',
    label: 'Sewer',
    color: '#4B0082',
    style: {
      borderTop: '3px dotted #4B0082',
      width: '40px',
      height: '0',
    },
    show: false,
  },
  {
    layer: 'piped_water',
    label: 'Piped Water',
    color: '#00BFFF',
    style: {
      borderTop: '3px dotted #00BFFF',
      width: '40px',
      height: '0',
    },
    show: false,
  },
])

// Helper function to update loading status
const updateLoadingStatus = (status: string, progress: number) => {
  loadingStatus.value = status
  loadingProgress.value = progress
  console.log(`📊 ${Math.round(progress)}% - ${status}`)
}

// Apply API response shape to internal state (shared by fetch and preloaded path)
const applyMapDataToState = (mapData: SettlementMapData) => {
  // Process settlement data
    if (mapData.settlement?.features?.length) {
      title.value = mapData.settlement.features[0].properties.name
      features.value = mapData.settlement.features
      console.log(`✅ Loaded settlement: ${title.value}`)
    }

    // Process parcel data
    if (mapData.parcel?.features?.length) {
      parcelGeoData.value = mapData.parcel
      const landuseIdsFound = new Set(
        mapData.parcel.features.map(f => f.properties?.landuse_id).filter(id => id !== null && id !== undefined)
      )
      legendItems.forEach(item => {
        item.show = landuseIdsFound.has(item.landuseId)
      })
      console.log(`✅ Loaded ${mapData.parcel.features.length} parcels`)
    }

    // Process structure data
    if (mapData.structure?.features?.length) {
      structureGeoData.value = mapData.structure
      console.log(`✅ Loaded ${mapData.structure.features.length} structures`)
    }

    // Process road data
    if (mapData.road?.features?.length) {
      roadGeoData.value = mapData.road
      console.log(`✅ Loaded ${mapData.road.features.length} roads`)
    }

    // Process point features
    const pointModels = ['streetlight', 'crime_hotspot', 'community_project', 'health_facility', 'education_facility', 'water_point', 'sewer', 'piped_water', 'powerline', 'community_hall', 'police_station', 'mast', 'dumping_site', 'hazard_zone']
    const allPointFeatures: any[] = []

    pointModels.forEach(model => {
      if (mapData[model]?.features?.length) {
        const features = mapData[model].features.map((feature: any) => ({
          ...feature,
          properties: {
            ...feature.properties,
            featureType: model
          }
        }))
        allPointFeatures.push(...features)
        
        // Update legend items
        const legendItem = PointLegendItems.value.find(item => item.layer === model)
      if (legendItem) {
        legendItem.show = true
      }
        
        const legendLineItem = PolyLineItems.value.find(item => item.layer === model)
      if (legendLineItem) {
        legendLineItem.show = true
      }
        
        console.log(`✅ Loaded ${features.length} ${model} features`)
      }
    })

    if (allPointFeatures.length > 0) {
      otherPointsGeoData.value = turf.featureCollection(allPointFeatures)
      console.log(`✅ Loaded ${allPointFeatures.length} total point features`)
    }

    // Update feature counts
    layerFeatureCounts.value = {
      settlement: mapData.settlement?.features?.length || 0,
      parcels: mapData.parcel?.features?.length || 0,
      parcelLabels: mapData.parcel?.features?.length || 0,
      roads: mapData.road?.features?.length || 0,
      hospitals: 0,
      schools: 0,
      water_points: 0,
      structures: mapData.structure?.features?.length || 0,
      other_points: allPointFeatures.length
    }
}

// Fetch functions - Consolidated approach (or use preloaded data when provided by parent)
const fetchAllSettlementData = async (preloadedMapData?: SettlementMapData | null): Promise<SettlementMapData | null> => {
  if (preloadedMapData) {
    applyMapDataToState(preloadedMapData)
    return preloadedMapData
  }
  isLoading.value = true
  try {
    console.log('🔄 Fetching consolidated settlement data...')
    const res = await getSettlementMapData({ settlementId: props.settlementId })
    const responseData = res as any
    if (!responseData?.data) {
      throw new Error('No settlement data received')
    }
    const mapData = responseData.data
    console.log('✅ Received consolidated data:', Object.keys(mapData))
    applyMapDataToState(mapData)
    return mapData
  } catch (error) {
    console.error('❌ Error fetching consolidated settlement data:', error)
    ElMessage({ message: 'Failed to load settlement data', type: 'error' })
    return null
  } finally {
    isLoading.value = false
  }
}

// Progressive loading with status updates but keeping layers together
const loadSelectedLayersWithProgress = async (layers: string[]) => {
  if (!mapReady.value || !window.google?.maps) {
    console.error('Google Maps API not ready')
    return
  }

  const bounds = new google.maps.LatLngBounds()
  console.log('🔄 Loading selected layers:', layers)

  // Clear all layer data
  polygons.value = []
  parcels.value = []
  parcelLabels.value = []
  roads.value = []
  water_points.value = []
  structures.value = []
  other_points.value = []
  neighboringSettlements.value = []
  neighboringSettlementLabels.value = []

  // Reset feature counts
  layerFeatureCounts.value = {
    settlement: 0,
    parcels: 0,
    parcelLabels: 0,
    roads: 0,
    hospitals: 0,
    schools: 0,
    water_points: 0,
    structures: 0,
    other_points: 0,
    neighboringSettlements: 0,
  }

  updateLoadingStatus(props.initialMapData ? 'Preparing map...' : 'Fetching settlement data...', 15)
  const allData = await fetchAllSettlementData(props.initialMapData ?? undefined)
  if (!allData) {
    console.error('❌ Failed to fetch settlement data')
    return
  }

  console.log('🔄 Processing consolidated data:', Object.keys(allData))
  
  // Process settlement data first
  if (allData.settlement?.features?.length && layers.includes('settlement')) {
    updateLoadingStatus('Loading settlement boundary...', 25)
    await processSettlementData(allData.settlement, bounds)
    layerFeatureCounts.value.settlement = allData.settlement.features.length
    console.log(`✅ Loaded settlement boundary: ${allData.settlement.features.length} features`)
  }

  // Process parcels with progress updates
  if (allData.parcel?.features?.length && layers.includes('parcels')) {
    const totalParcels = allData.parcel.features.length
    updateLoadingStatus(`Loading ${totalParcels} parcels...`, 30)
    console.log(`🔄 Processing ${totalParcels} parcels...`)
    
    await processFeaturesInChunks(allData.parcel.features, (feature: any, index: number) => {
      const { geometry, properties } = feature
      if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
        let coordinates = geometry.coordinates
        if (geometry.type === 'MultiPolygon') {
          coordinates = coordinates.flat()
        }
        coordinates.forEach((polygonCoordinates: number[][]) => {
          const paths = polygonCoordinates.map(([lng, lat]) => {
            const point = { lat, lng }
            bounds.extend(point)
            return point
          }).filter((path: { lng: number; lat: number }) => isFinite(path.lng) && isFinite(path.lat))
          const landuseId = properties.landuse_id ?? -1
          const fillColor = landuseId === 0 ? '#8C675D' :
            landuseId === 1 ? '#800080' :
            landuseId === 2 ? '#F6C567' :
            landuseId === 3 ? '#6FDC6E' :
            landuseId === 4 ? '#FFFF00' :
            landuseId === 5 ? '#FF1D1E' :
            landuseId === 6 ? '#73B2FF' :
            landuseId === 7 ? '#DCDCDC' :
            landuseId === 8 ? '#FDFD96' :
            landuseId === 9 ? '#FDFD96' : 'white'
          parcels.value.push({
            id: `parcel-${properties?.id || index}`,
            paths,
            strokeColor: 'white',
            strokeOpacity: 1,
            strokeWeight: 1,
            fillColor,
            fillOpacity: 0.8,
            properties: { ...properties }
          })
          const centroidPoint = turf.centroid(feature)
          const [lng, lat] = centroidPoint.geometry.coordinates
          parcelLabels.value.push({
            id: `label-${properties?.id || index}`,
            position: { lat, lng },
            label: properties.parcel_no || '',
            properties: { ...properties }
          })
        })
      }
    }, (progress) => {
      // Update progress during parcel processing
      const currentProgress = 30 + (progress * 0.25) // From 30% to 55%
      updateLoadingStatus(`Loading parcels... ${Math.round(progress)}%`, currentProgress)
    })
    
    layerFeatureCounts.value.parcels = allData.parcel.features.length
    layerFeatureCounts.value.parcelLabels = allData.parcel.features.length
    
    // Update legend
    const landuseIdsFound = new Set(
      allData.parcel.features.map(f => f.properties?.landuse_id).filter(id => id !== null && id !== undefined)
    )
    legendItems.forEach(item => {
      item.show = landuseIdsFound.has(item.landuseId)
    })
    console.log(`✅ Loaded ${allData.parcel.features.length} parcels`)
  }

  // Process structures
  if (layers.includes('structures') && allData.structure?.features?.length) {
    updateLoadingStatus(`Loading ${allData.structure.features.length} structures...`, 60)
    await processFeaturesInChunks(allData.structure.features, (feature: any, index: number) => {
      const { geometry, properties } = feature
      if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
        let coordinates = geometry.coordinates
        if (geometry.type === 'MultiPolygon') {
          coordinates = coordinates.flat()
        }
        coordinates.forEach((polygonCoordinates: number[][]) => {
          const paths = polygonCoordinates.map(([lng, lat]) => {
            const point = { lat, lng }
            bounds.extend(point)
            return point
          }).filter((path: { lng: number; lat: number }) => isFinite(path.lng) && isFinite(path.lat))
         
          const fillColor = 'black'  
          structures.value.push({
            id: `structure-${properties?.structure_id || index}`,
            paths,
            strokeColor: 'white',
            strokeOpacity: 1,
            strokeWeight: 0.5,
            fillColor,
            fillOpacity: 0.7,
            properties: { ...properties }
          })
        })
      }
    })
    layerFeatureCounts.value.structures = allData.structure.features.length
    console.log(`✅ Loaded ${allData.structure.features.length} structures`)
  }

  // Process facilities and roads with chunked rendering
  updateLoadingStatus('Processing facilities and infrastructure...', 70)
  const pointModels = ['streetlight', 'crime_hotspot', 'community_project', 'health_facility', 'education_facility', 'water_point', 'community_hall', 'police_station', 'mast', 'dumping_site', 'hazard_zone']
  const lineModels = ['road', 'powerline', 'sewer', 'piped_water']

  // Process point features with chunking for better performance
  for (const model of pointModels) {
    if (allData[model]?.features?.length) {
      const features = allData[model].features
      console.log(`🔄 Processing ${model} point features:`, features.length)
      
      const iconMap: Record<string, string> = {
        water_point: 'icons/waterdrop.png',
        mast: 'icons/tower.png',
        streetlight: 'icons/lighthouse-2.png',
        dumping_site: 'icons/landfill.png',
        hazard_zone: 'icons/caution.png',
        community_project: 'icons/country.png',
        community_hall: 'icons/communitycentre.png',
        police_station: 'icons/police.png',
        crime_hotspot: 'icons/theft.png',
        health_facility: 'icons/hospital-2.png',
        education_facility: 'icons/school.png',
      }

      const iconUrl = iconMap[model] || 'icons/amphitheater.png'

      // Process features in smaller chunks to prevent UI blocking
      const featureChunkSize = 25 // Smaller chunks for point features
      for (let i = 0; i < features.length; i += featureChunkSize) {
        const chunk = features.slice(i, i + featureChunkSize)
        
        chunk.forEach((feature: any, chunkIndex: number) => {
          const { geometry, properties } = feature
          const index = i + chunkIndex

          // Handle Point
          if (geometry.type === 'Point') {
            const [lng, lat] = geometry.coordinates
            const point = { lat, lng }
            bounds.extend(point)

            other_points.value.push({
              id: `op-${model}-${properties?.id || index}`,
              type: 'marker',
              position: point,
              icon: {
                url: iconUrl,
                scaledSize: new google.maps.Size(30, 30),
                anchor: new google.maps.Point(15, 15),
              },
              properties: { 
                ...properties,
                featureType: model
              },
            })
          }
        })
        
        if (i + featureChunkSize < features.length) {
          await new Promise(resolve => setTimeout(resolve, 0))
        }
      }

      // Update legend items
      const legendItem = PointLegendItems.value.find(item => item.layer === model)
      if (legendItem) {
        legendItem.show = true
      }
      
      console.log(`✅ Processed ${features.length} ${model} point features`)
    }
  }

  // Process linear features with chunking
  updateLoadingStatus('Processing roads and utilities...', 75)
  
  for (const model of lineModels) {
    if (allData[model]?.features?.length) {
      const features = allData[model].features
      console.log(`🔄 Processing ${model} linear features:`, features.length)

      // Define line styles for different feature types
      const lineStyles: Record<string, any> = {
        road: {
          strokeColor: "red",
          strokeOpacity: 1,
          strokeWeight: 3,
        },
        powerline: {
          strokeColor: "green",
          strokeOpacity: 1,
          strokeWeight: 3,  
          icons: [{
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 2,
              fillColor: 'green',
              fillOpacity: 1,
              strokeColor: 'green',
              strokeWeight: 1
            },
            offset: '0',
            repeat: '10px'
          }]
        },
        sewer: {
          strokeColor: "#4B0082", // Dark Indigo
          strokeOpacity: 1,
          strokeWeight: 3,
          icons: [{
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 2,
              fillColor: '#4B0082',
              fillOpacity: 1,
              strokeColor: '#4B0082',
              strokeWeight: 1
            },
            offset: '0',
            repeat: '10px'
          }]
        },
        piped_water: {
          strokeColor: "#00BFFF", // Light Sky Blue
          strokeOpacity: 1,
          strokeWeight: 3,
          icons: [{
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 2,
              fillColor: '#00BFFF',
              fillOpacity: 1,
              strokeColor: '#00BFFF',
              strokeWeight: 1
            },
            offset: '0',
            repeat: '10px'
          }]
        }
      }

      // Process linear features in chunks
      const linearChunkSize = 10 // Even smaller chunks for complex polylines
      for (let i = 0; i < features.length; i += linearChunkSize) {
        const chunk = features.slice(i, i + linearChunkSize)
        
        chunk.forEach((feature: any, chunkIndex: number) => {
          const { geometry, properties } = feature
          const index = i + chunkIndex

          // Handle LineString & MultiLineString
          if (geometry.type === 'LineString' || geometry.type === 'MultiLineString') {
            const lines = geometry.type === 'LineString' ? [geometry.coordinates] : geometry.coordinates

            lines.forEach((line, lineIndex) => {
              const path = line.map(([lng, lat]) => {
                const point = { lat, lng }
                bounds.extend(point)
                return point
              })

              // Get the appropriate style for this feature type
              const style = lineStyles[model] || {
                strokeColor: "#999999",
                strokeOpacity: 0.8,
                strokeWeight: 3,
              }

              // Add to roads array for roads, or other_points for other linear features
              if (model === 'road') {
                roads.value.push({
                  id: `road-${properties?.id || index}-${lineIndex}`,
                  path,
                  options: style,
                  properties: { 
                    ...properties,
                    featureType: model
                  },
                })
              } else {
                other_points.value.push({
                  id: `line-${model}-${properties?.id || index}-${lineIndex}`,
                  type: 'polyline',
                  path,
                  options: style,
                  properties: { 
                    ...properties,
                    featureType: model
                  },
                })
              }
            })
          }
        })
        
        if (i + linearChunkSize < features.length) {
          await new Promise(resolve => setTimeout(resolve, 0))
        }
      }

      // Update legend items
      const legendLineItem = PolyLineItems.value.find(item => item.layer === model)
      if (legendLineItem) {
        legendLineItem.show = true
      }
      
      console.log(`✅ Processed ${features.length} ${model} linear features`)
    }
  }

  console.log('other_points (all features) >>', other_points.value)
  layerFeatureCounts.value.other_points = other_points.value.length
  layerFeatureCounts.value.roads = roads.value.length

  updateLoadingStatus('Finalizing features...', 82)
  
  // Force Vue to update the DOM with new features
  await nextTick()
  
  updateLoadingStatus('Adjusting map view...', 88)
  // Fit the map to all features (map will animate bounds; don't block for it)
  if (polygons.value.length || parcels.value.length || roads.value.length || schools.value.length || water_points.value.length || structures.value.length || other_points.value.length) {
    mapRef.value?.map.fitBounds(bounds)
  }

  // After fitting to bounds, check if there's exactly one settlement
  if (polygons.value.length === 1 && polygons.value[0].type == 'point') {
    // Get the first settlement's coordinates (adjust this based on your feature structure)
    const settlement = polygons.value[0]; // Adjust this if your settlement data has a different structure
    const zoomLevel = 15; // Adjust zoom level as needed

    // Assuming your settlement has latitude and longitude properties:
    const latLng = { lat: settlement.lat, lng: settlement.lng };

    // Set the zoom and center the map on the settlement
    mapRef.value?.map.setZoom(zoomLevel);
    mapRef.value?.map.setCenter(latLng);
  }
}

// Keep original function for compatibility
const loadSelectedLayers = async (layers: string[]) => {
  if (!mapReady.value || !window.google?.maps) {
    console.error('Google Maps API not ready')
    return
  }

  const bounds = new google.maps.LatLngBounds()

  console.log('🔄 Loading selected layers:', layers)

  // Clear all layer data
  polygons.value = []
  parcels.value = []
  parcelLabels.value = []
  roads.value = []
   water_points.value = []
  structures.value = []
  other_points.value = []
  neighboringSettlements.value = []
  neighboringSettlementLabels.value = []

  // Reset feature counts
  layerFeatureCounts.value = {
    settlement: 0,
    parcels: 0,
    parcelLabels: 0,
    roads: 0,
    hospitals: 0,
    schools: 0,
     water_points: 0,
    structures: 0,
    other_points: 0,
    neighboringSettlements: 0,
  }

  // Fetch all data in one call
  const allData = await fetchAllSettlementData()
  if (!allData) {
    console.error('❌ Failed to fetch settlement data')
    return
  }

  console.log('🔄 Processing consolidated data:', Object.keys(allData))
  console.log('📊 Data summary:', {
    settlement: allData.settlement?.features?.length || 0,
    parcel: allData.parcel?.features?.length || 0,
    structure: allData.structure?.features?.length || 0,
    road: allData.road?.features?.length || 0,
    pointFeatures: Object.keys(allData).filter(key => 
      ['streetlight', 'crime_hotspot', 'community_project', 'health_facility', 'education_facility', 'water_point', 'sewer', 'piped_water', 'powerline', 'community_hall', 'police_station', 'mast', 'dumping_site', 'hazard_zone'].includes(key)
    ).map(key => ({ [key]: allData[key]?.features?.length || 0 }))
  })

  // Process settlement data
  if (allData.settlement?.features?.length && layers.includes('settlement')) {
    await processSettlementData(allData.settlement, bounds)
    layerFeatureCounts.value.settlement = allData.settlement.features.length
  }

  // Process parcels
  if (allData.parcel?.features?.length && layers.includes('parcels')) {
    const totalParcels = allData.parcel.features.length
    console.log(`🔄 Processing ${totalParcels} parcels...`)
    
    await processFeaturesInChunks(allData.parcel.features, (feature: any, index: number) => {
      const { geometry, properties } = feature
      if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
        let coordinates = geometry.coordinates
        if (geometry.type === 'MultiPolygon') {
          coordinates = coordinates.flat()
        }
        coordinates.forEach((polygonCoordinates: number[][]) => {
          const paths = polygonCoordinates.map(([lng, lat]) => {
            const point = { lat, lng }
            bounds.extend(point)
            return point
          }).filter((path: { lng: number; lat: number }) => isFinite(path.lng) && isFinite(path.lat))
          const landuseId = properties.landuse_id ?? -1
          const fillColor = landuseId === 0 ? '#8C675D' :
            landuseId === 1 ? '#800080' :
            landuseId === 2 ? '#F6C567' :
            landuseId === 3 ? '#6FDC6E' :
            landuseId === 4 ? '#FFFF00' :
            landuseId === 5 ? '#FF1D1E' :
            landuseId === 6 ? '#73B2FF' :
            landuseId === 7 ? '#DCDCDC' :
            landuseId === 8 ? '#FDFD96' :
            landuseId === 9 ? '#FDFD96' : 'white'
          parcels.value.push({
            id: `parcel-${properties?.id || index}`,
            paths,
            strokeColor: 'white',
            strokeOpacity: 1,
            strokeWeight: 1,
            fillColor,
            fillOpacity: 0.8,
            properties: { ...properties }
          })
          const centroidPoint = turf.centroid(feature)
          const [lng, lat] = centroidPoint.geometry.coordinates
          parcelLabels.value.push({
            id: `label-${properties?.id || index}`,
            position: { lat, lng },
            label: properties.parcel_no || '',
            properties: { ...properties }
          })
        })
      }
    })
    layerFeatureCounts.value.parcels = allData.parcel.features.length
    layerFeatureCounts.value.parcelLabels = allData.parcel.features.length
  }

  // Process structures
  if (layers.includes('structures') && allData.structure?.features?.length) {
    await processFeaturesInChunks(allData.structure.features, (feature: any, index: number) => {
      const { geometry, properties } = feature
      if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
        let coordinates = geometry.coordinates
        if (geometry.type === 'MultiPolygon') {
          coordinates = coordinates.flat()
        }
        coordinates.forEach((polygonCoordinates: number[][]) => {
          const paths = polygonCoordinates.map(([lng, lat]) => {
            const point = { lat, lng }
            bounds.extend(point)
            return point
          }).filter((path: { lng: number; lat: number }) => isFinite(path.lng) && isFinite(path.lat))
         
          const fillColor = 'black'  
          structures.value.push({
            id: `structure-${properties?.structure_id || index}`,
            paths,
            strokeColor: 'white',
            strokeOpacity: 1,
            strokeWeight: 0.5,
            fillColor,
            fillOpacity: 0.7,
            properties: { ...properties }
          })
        })
      }
    })
    layerFeatureCounts.value.structures = allData.structure.features.length
  }

  // Process facilities otherPoints
  const pointModels = ['streetlight', 'crime_hotspot', 'community_project', 'health_facility', 'education_facility', 'water_point', 'community_hall', 'police_station', 'mast', 'dumping_site', 'hazard_zone']
  const lineModels = ['road', 'powerline', 'sewer', 'piped_water']

  // Process point features
  pointModels.forEach(model => {
    if (allData[model]?.features?.length) {
      console.log(`🔄 Processing ${model} point features:`, allData[model].features.length)

      allData[model].features.forEach((feature: any, index: number) => {
    const { geometry, properties } = feature
        const featureType = model

    const iconMap: Record<string, string> = {
      water_point: 'icons/waterdrop.png',
      mast: 'icons/tower.png',
      streetlight: 'icons/lighthouse-2.png',
      dumping_site: 'icons/landfill.png',
      hazard_zone: 'icons/caution.png',
      community_project: 'icons/country.png',
      community_hall: 'icons/communitycentre.png',
      police_station: 'icons/police.png',
      crime_hotspot: 'icons/theft.png',
      health_facility: 'icons/hospital-2.png',
      education_facility: 'icons/school.png',
    }

    const iconUrl = iconMap[featureType] || 'icons/amphitheater.png'

        // Handle Point
        if (geometry.type === 'Point') {
          const [lng, lat] = geometry.coordinates
          const point = { lat, lng }
          bounds.extend(point)

          other_points.value.push({
            id: `op-${model}-${properties?.id || index}`,
            type: 'marker',
            position: point,
            icon: {
              url: iconUrl,
              scaledSize: new google.maps.Size(30, 30),
              anchor: new google.maps.Point(15, 15),
            },
            properties: { 
              ...properties,
              featureType: model
            },
          })
        }
      })

      // Update legend items
      const legendItem = PointLegendItems.value.find(item => item.layer === model)
      if (legendItem) {
        legendItem.show = true
      }
      
      console.log(`✅ Processed ${allData[model].features.length} ${model} point features`)
    }
  })

  // Process linear features
  lineModels.forEach(model => {
    if (allData[model]?.features?.length) {
      console.log(`🔄 Processing ${model} linear features:`, allData[model].features.length)

      allData[model].features.forEach((feature: any, index: number) => {
        const { geometry, properties } = feature
        const featureType = model

        // Handle LineString & MultiLineString
        if (geometry.type === 'LineString' || geometry.type === 'MultiLineString') {
          const lines = geometry.type === 'LineString' ? [geometry.coordinates] : geometry.coordinates

          lines.forEach((line, lineIndex) => {
            const path = line.map(([lng, lat]) => {
              const point = { lat, lng }
              bounds.extend(point)
              return point
            })

            // Define line styles for different feature types
    const lineStyles: Record<string, any> = {
      road: {
                strokeColor: "red",
        strokeOpacity: 1,
                strokeWeight: 3,
       },
      powerline: {
                strokeColor: "green",
            strokeOpacity: 1,
            strokeWeight: 3,  
                icons: [{
                  icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 2,
                    fillColor: 'green',
                    fillOpacity: 1,
                    strokeColor: 'green',
                    strokeWeight: 1
                  },
                  offset: '0',
                  repeat: '10px'
        }]
      },
      sewer: {
                strokeColor: "#4B0082", // Dark Indigo
                strokeOpacity: 1,
                strokeWeight: 3,
        icons: [{
          icon: {
                    path: google.maps.SymbolPath.CIRCLE,
            scale: 2,
                    fillColor: '#4B0082',
                    fillOpacity: 1,
                    strokeColor: '#4B0082',
                    strokeWeight: 1
                  },
                  offset: '0',
                  repeat: '10px'
        }]
      },
      piped_water: {
                strokeColor: "#00BFFF", // Light Sky Blue
            strokeOpacity: 1,
            strokeWeight: 3,
                icons: [{
                  icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 2,
                    fillColor: '#00BFFF',
                    fillOpacity: 1,
                    strokeColor: '#00BFFF',
                    strokeWeight: 1
                  },
                  offset: '0',
                  repeat: '10px'
                }]
              }
            }

            // Get the appropriate style for this feature type
            const style = lineStyles[featureType] || {
      strokeColor: "#999999",
      strokeOpacity: 0.8,
      strokeWeight: 3,
    }

            // Add to roads array for roads, or other_points for other linear features
            if (model === 'road') {
              roads.value.push({
                id: `road-${properties?.id || index}-${lineIndex}`,
                path,
                options: style,
                properties: { 
                  ...properties,
                  featureType: model
                },
              })
            } else {
        other_points.value.push({
                id: `line-${model}-${properties?.id || index}-${lineIndex}`,
          type: 'polyline',
          path,
          options: style,
                properties: { 
                  ...properties,
                  featureType: model
                },
              })
            }
          })
        }
      })

      // Update legend items
      const legendLineItem = PolyLineItems.value.find(item => item.layer === model)
      if (legendLineItem) {
        legendLineItem.show = true
      }
      
      console.log(`✅ Processed ${allData[model].features.length} ${model} linear features`)
    }
  })

  console.log('other_points (all features) >>', other_points.value)
  layerFeatureCounts.value.other_points = other_points.value.length
  layerFeatureCounts.value.roads = roads.value.length

  // Fit the map to all features
  if (polygons.value.length || parcels.value.length || roads.value.length  || schools.value.length || water_points.value.length || structures.value.length || other_points.value.length) {
    mapRef.value?.map.fitBounds(bounds)
  }

  // After fitting to bounds, check if there's exactly one settlement
if (polygons.value.length === 1 && polygons.value[0].type=='point') {
  // Get the first settlement's coordinates (adjust this based on your feature structure)
  const settlement = polygons.value[0]; // Adjust this if your settlement data has a different structure
  const zoomLevel = 15; // Adjust zoom level as needed

  // Assuming your settlement has latitude and longitude properties:
  const latLng = { lat: settlement.lat, lng: settlement.lng };

  // Set the zoom and center the map on the settlement
  mapRef.value?.map.setZoom(zoomLevel);
  mapRef.value?.map.setCenter(latLng);
  }
}

// Optimized chunked processing for smooth loading
const chunkSize = 50 // Smaller chunks for better responsiveness
const processFeaturesInChunks = async (features: any[], processor: (feature: any, index: number) => void, progressCallback?: (progress: number) => void) => {
  const chunks: any[][] = []
  for (let i = 0; i < features.length; i += chunkSize) {
    chunks.push(features.slice(i, i + chunkSize))
  }
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    chunk.forEach((feature, index) => {
      processor(feature, i * chunkSize + index)
    })
    
    // Update progress if callback provided
    if (progressCallback) {
      const progress = ((i + 1) / chunks.length) * 100
      progressCallback(progress)
    }
    
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

// Optimized data processing with chunks
const processSettlementData = async (featureCollection: any, bounds: google.maps.LatLngBounds) => {
  if (!featureCollection?.features?.length) return
  
  await processFeaturesInChunks(featureCollection.features, (feature: any, index: number) => {
    const { geometry, properties } = feature
    
    // Handle Polygon and MultiPolygon
    if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
      let coordinates = geometry.coordinates
      if (geometry.type === 'MultiPolygon') {
        coordinates = coordinates.flat()
      }
      coordinates.forEach((polygonCoordinates: number[][]) => {
        const paths = polygonCoordinates.map(([lng, lat]) => {
          const point = { lat, lng }
          bounds.extend(point)
          return point
        })
        polygons.value.push({
          id: properties?.id || index,
          paths,
          strokeColor: '#000000',
          strokeOpacity: 1,
          strokeWeight: 3,
          fillColor: '#FF0000',
          fillOpacity: 0,
          type: "poly",
          properties: { ...properties },
        })
      })
    }
    
    // Handle Point
    if (geometry.type === 'Point') {
      const [lng, lat] = geometry.coordinates
      const point = { lat, lng }
      bounds.extend(point)
      let iconUrl = 'https://maps.google.com/mapfiles/kml/paddle/grn-circle.png'
      
      polygons.value.push({
        id: `sett-${properties?.id || index}`,
        position: point,
        type: "point",
        icon: {
          url: iconUrl,
          scaledSize: new google.maps.Size(30, 30),
          anchor: new google.maps.Point(15, 15)
        },
        properties: { ...properties }
      })
    }
  })
}

// Computed properties and other logic
const availableLayers = computed(() => {
  // Always include all possible layers, even if count is 0
  return ['settlement', 'parcels', 'parcelLabels', 'roads', 'schools', 'water_points', 'structures', 'other_points', 'powerline', 'sewer', 'piped_water']
})

const infowindow = ref(false)
const PointInfowindow = ref(false)
const selectedFeature = ref<any>(null)
const gmapCenter = ref()

// Drawer state
const drawerVisible = ref(false)
const drawerTitle = ref('')
const drawerData = ref<any[]>([])

// Helper function to format numbers to 2 decimal places
const formatNumber = (value: any): any => {
  if (value === null || value === undefined || value === '') {
    return value
  }
  const num = Number(value)
  if (isNaN(num)) {
    return value
  }
  // Check if it's a whole number
  if (Number.isInteger(num)) {
    return num.toString()
  }
  // Round to 2 decimal places
  return num.toFixed(2)
}

const onPolygonClick = (feature) => {
  // Close any existing popups
  infowindow.value = false
  PointInfowindow.value = false
  
  // Prepare drawer data - exclude geom and geometry properties
  const filteredProperties = Object.fromEntries(
    Object.entries(feature.properties || {}).filter(([key, value]) => {
      // Exclude falsy values
      if (!value) return false
      // Exclude geom and geometry properties
      const lowerKey = key.toLowerCase()
      if (lowerKey === 'geom' || lowerKey === 'geometry' || lowerKey.includes('geometry')) {
        return false
      }
      // Exclude geometry objects (has type and coordinates)
      if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
        if ('type' in value && 'coordinates' in value) {
          return false
        }
      }
      return true
    })
  )
  
  drawerData.value = Object.entries(filteredProperties).map(([key, value]) => ({
    field: key,
    value: formatNumber(value)
  }))
  
  drawerTitle.value = 'Feature Details'
  drawerVisible.value = true
  
  selectedFeature.value = {
    ...feature,
    properties: filteredProperties
  }
  console.log('Polygon clicked:', selectedFeature.value)
}

const onPointClick = (feature) => {
  // Close any existing popups
  infowindow.value = false
  PointInfowindow.value = false
  
  // Prepare drawer data - exclude geom and geometry properties
  const filteredProperties = Object.fromEntries(
    Object.entries(feature.properties || {}).filter(([key, value]) => {
      // Exclude falsy values
      if (!value) return false
      // Exclude geom and geometry properties
      const lowerKey = key.toLowerCase()
      if (lowerKey === 'geom' || lowerKey === 'geometry' || lowerKey.includes('geometry')) {
        return false
      }
      // Exclude geometry objects (has type and coordinates)
      if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
        if ('type' in value && 'coordinates' in value) {
          return false
        }
      }
      return true
    })
  )
  
  drawerData.value = Object.entries(filteredProperties).map(([key, value]) => ({
    field: key,
    value: formatNumber(value)
  }))
  
  // Set appropriate title based on feature type
  const featureType = feature.properties?.featureType || 'Unknown Feature'
  drawerTitle.value = featureType.replace(/_/g, ' ').toUpperCase()
  drawerVisible.value = true
  
  selectedFeature.value = {
    ...feature,
    properties: filteredProperties
  }
  console.log('Point/Line clicked:', selectedFeature.value)
}

const closePopup = () => {
  infowindow.value = false
  PointInfowindow.value = false
}

const closeDrawer = () => {
  drawerVisible.value = false
  drawerData.value = []
  drawerTitle.value = ''
}

const filteredProperties = computed(() => {
  if (!selectedFeature.value?.properties) return []
  return Object.entries(selectedFeature.value.properties).filter(([_, value]) => 
    value !== null && value !== undefined && value !== ''
  )
})

// Window width for responsive design
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)

// Update window width on resize
const updateWindowWidth = () => {
  if (typeof window !== 'undefined') {
    windowWidth.value = window.innerWidth
  }
}

// Responsive drawer size for mobile optimization
const drawerSize = computed(() => {
  if (windowWidth.value < 768) return '90%'
  if (windowWidth.value < 1024) return '60%'
  return '40%'
})

// Responsive descriptions column count
const descriptionsColumn = computed(() => {
  return 1 // Always 1 column for better mobile readability
})

// Responsive label min width
const labelMinWidth = computed(() => {
  return windowWidth.value < 768 ? '100px' : '120px'
})

const parcelsVisible = ref(true)
const toggleParcels = (visible: boolean) => {
  parcelsVisible.value = visible
}

const parcelLabelsVisible = ref(false)
const toggleParcelLabels = (visible: boolean) => {
  parcelLabelsVisible.value = visible
}

const roadsVisible = ref(true)
const powerlineVisible = ref(true)
const sewerVisible = ref(true)
const pipedWaterVisible = ref(true)
const toggleRoads = (visible: boolean) => {
  roadsVisible.value = visible
}

const settVisibile = ref(true)
const toggleSettlement = (visible: boolean) => {
  settVisibile.value = visible
}

const StructureVisible = ref(true)
const toggleStructure = (visible: boolean) => {
  StructureVisible.value = visible
}

const OtherPointVisible = ref(true)
const toggleOtherPoint = (visible: boolean) => {
  OtherPointVisible.value = visible
}

const setupMapTypeControl = () => {
  if (!mapReady.value || !mapRef.value?.map) return
  const grayscaleStyle = [
    {
      stylers: [{ saturation: -100 }]
    }
  ]
  const darkModeStyle = [
    { elementType: 'geometry', stylers: [{ color: '#212121' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
    {
      featureType: 'administrative',
      elementType: 'geometry',
      stylers: [{ color: '#757575' }]
    },
    {
      featureType: 'administrative.country',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9e9e9e' }]
    },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#bdbdbd' }]
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#757575' }]
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#181818' }]
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#616161' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry.fill',
      stylers: [{ color: '#2c2c2c' }]
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#8a8a8a' }]
    },
    {
      featureType: 'road.arterial',
      elementType: 'geometry',
      stylers: [{ color: '#373737' }]
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#3c3c3c' }]
    },
    {
      featureType: 'road.highway.controlled_access',
      elementType: 'geometry',
      stylers: [{ color: '#4e4e4e' }]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#0e1626' }]
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#3d3d3d' }]
    }
  ]
  const grayscaleMapType = new google.maps.StyledMapType(grayscaleStyle, { name: 'Grayscale' })
  const darkModeMapType = new google.maps.StyledMapType(darkModeStyle, { name: 'Dark Mode' })
  mapRef.value.map.mapTypes.set('grayscale', grayscaleMapType)
  mapRef.value.map.mapTypes.set('dark', darkModeMapType)
  const controlDiv = document.createElement('div')
  const controlSelect = document.createElement('select')
  controlDiv.style.padding = '5px'
  controlDiv.style.backgroundColor = 'white'
  controlDiv.style.border = '1px solid #ccc'
  controlDiv.style.borderRadius = '2px'
  controlDiv.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3)'
  controlSelect.style.fontSize = '14px'
  controlSelect.style.padding = '2px'
  controlSelect.style.margin = '5px'
  const mapTypes = [
    { id: 'roadmap', label: 'Map' },
    { id: 'satellite', label: 'Satellite' },
    { id: 'hybrid', label: 'Hybrid' },
    { id: 'terrain', label: 'Terrain' },
    { id: 'grayscale', label: 'Grayscale' },
    { id: 'dark', label: 'Dark Mode' }
  ]
  mapTypes.forEach((type) => {
    const option = document.createElement('option')
    option.value = type.id
    option.text = type.label
    if (type.id === mapRef.value.map.getMapTypeId()) {
      option.selected = true
    }
    controlSelect.appendChild(option)
  })
  controlSelect.addEventListener('change', () => {
    mapRef.value.map.setMapTypeId(controlSelect.value)
  })
  controlDiv.appendChild(controlSelect)
  mapRef.value.map.controls[google.maps.ControlPosition.TOP_LEFT].push(controlDiv)
}

const getSettlementBbox = () => {
  if (!features.value || !Array.isArray(features.value) || features.value.length === 0) {
    console.log('⚠️ No settlement features available for bbox calculation')
    return null
  }
  
  try {
    const featureCollection = turf.featureCollection(features.value)
  const bbox = turf.bbox(featureCollection)
  return {
    minLng: bbox[0],
    minLat: bbox[1],
    maxLng: bbox[2],
    maxLat: bbox[3]
    }
  } catch (error) {
    console.error('❌ Error calculating bbox:', error)
    return null
  }
}

// Get bbox from current map viewport bounds
const getMapViewportBbox = (): { minLng: number; minLat: number; maxLng: number; maxLat: number } | null => {
  if (!mapRef.value?.map || !mapReady.value) {
    return null
  }

  try {
    const bounds = mapRef.value.map.getBounds()
    if (!bounds) return null

    const ne = bounds.getNorthEast()
    const sw = bounds.getSouthWest()

    return {
      minLng: sw.lng(),
      minLat: sw.lat(),
      maxLng: ne.lng(),
      maxLat: ne.lat()
    }
  } catch (error) {
    console.error('Error getting map viewport bbox:', error)
    return null
  }
}

// Fetch neighboring settlements based on bbox - using dedicated backend endpoint
// Returns the number of settlements loaded, or 0 if none/failed
// silent: if true, suppresses console logs (for dynamic updates)
const fetchNeighboringSettlements = async (customBbox?: { minLng: number; minLat: number; maxLng: number; maxLat: number }, silent = false): Promise<number> => {
  let bbox = customBbox || getSettlementBbox()
  
  // If no bbox provided and map is ready, use viewport bbox
  if (!bbox && mapReady.value && mapRef.value?.map) {
    bbox = getMapViewportBbox()
  }

  if (!bbox || !mapReady.value || !window.google?.maps) {
    if (!silent) {
      console.log('⚠️ No bbox available or map not ready for neighboring settlements')
    }
    return 0
  }

  try {
    if (!silent) {
      console.log('🔄 Fetching neighboring settlements from backend...')
    }
    
    const res = await getNeighboringSettlements({
      settlementId: props.settlementId,
      bbox: bbox,
      expansionFactor: 0.2 // 20% expansion
    })
    
    // Handle response structure - API returns { data: [...], code: '0000', message: '...' }
    const responseData = res as any
    const settlements = responseData?.data || responseData?.results || []
    
    if (!Array.isArray(settlements) || settlements.length === 0) {
      if (!silent) {
        console.log('ℹ️ No neighboring settlements found')
      }
      return 0
    }

    const neighboringSettlementsData: any[] = []
    const neighboringLabelsData: any[] = []

    for (const settlement of settlements) {
      // Check if settlement has geometry
      if (!settlement.geom) {
        continue
      }

      // Check if geometry is Polygon or MultiPolygon
      const geomType = settlement.geom.type
      if (geomType !== 'Polygon' && geomType !== 'MultiPolygon') {
        continue
      }

      // Process polygon geometry
      let coordinates = settlement.geom.coordinates
      if (geomType === 'MultiPolygon') {
        coordinates = coordinates.flat()
      }

      coordinates.forEach((polygonCoordinates: number[][]) => {
        const paths = polygonCoordinates.map(([lng, lat]) => {
          const point = { lat, lng }
          return point
        }).filter((path: { lng: number; lat: number }) => isFinite(path.lng) && isFinite(path.lat))

        if (paths.length > 0) {
          // Use polyline for dotted pink outline (close the path by adding first point at end)
          const closedPath = [...paths, paths[0]]
          neighboringSettlementsData.push({
            id: `neighbor-${settlement.id}`,
            path: closedPath,
            strokeColor: '#FF69B4',
            strokeOpacity: 0.5,
            strokeWeight: 1,
            type: 'polyline',
            // Create dotted pattern using icons - small dots with pink
            icons: [{
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 2,
                fillColor: '#FF69B4',
                fillOpacity: 0.5,
                strokeColor: '#FF69B4',
                strokeWeight: 0.3
              },
              offset: '0%',
              repeat: '8px'
            }],
            properties: {
              id: settlement.id,
              name: settlement.name || 'Unnamed Settlement'
            }
          })

          // Calculate centroid for label (only once per settlement, not per polygon)
          if (neighboringLabelsData.findIndex(l => l.properties?.id === settlement.id) === -1) {
            try {
              const centroidPoint = turf.centroid(settlement.geom)
              const [lng, lat] = centroidPoint.geometry.coordinates
              const settlementName = settlement.name || 'Unnamed'
              
              // Create text-only marker with HTML content for text wrapping
              // Split long names into multiple lines (max 20 chars per line)
              const maxCharsPerLine = 20
              const words = settlementName.split(' ')
              const lines: string[] = []
              let currentLine = ''
              
              words.forEach(word => {
                if ((currentLine + word).length <= maxCharsPerLine) {
                  currentLine = currentLine ? `${currentLine} ${word}` : word
                } else {
                  if (currentLine) lines.push(currentLine)
                  currentLine = word
                }
              })
              if (currentLine) lines.push(currentLine)
              
              const wrappedText = lines.join('\n')
              
              neighboringLabelsData.push({
                id: `neighbor-label-${settlement.id}`,
                position: { lat, lng },
                // Use transparent icon to hide default marker
                icon: {
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>
                  `),
                  scaledSize: new google.maps.Size(1, 1),
                  anchor: new google.maps.Point(0.5, 0.5)
                },
                // Label with wrapped text (newlines in label text)
                label: {
                  text: wrappedText,
                  color: '#FF69B4',
                  fontSize: '12px',
                  fontWeight: '500'
                },
                properties: {
                  id: settlement.id,
                  name: settlementName
                }
              })
            } catch (error) {
              console.warn(`Error calculating centroid for settlement ${settlement.id}:`, error)
            }
          }
        }
      })
    }

    neighboringSettlements.value = neighboringSettlementsData
    neighboringSettlementLabels.value = neighboringLabelsData
    layerFeatureCounts.value.neighboringSettlements = neighboringSettlementsData.length

    const count = neighboringSettlementsData.length
    if (!silent) {
      console.log(`✅ Loaded ${count} neighboring settlements`)
    }
    return count
  } catch (error: any) {
    // Handle case where backend endpoint doesn't exist yet (404) or other errors
    if (!silent) {
      if (error?.response?.status === 404) {
        console.log('ℹ️ Neighboring settlements endpoint not yet implemented on backend')
      } else if (error?.response?.data?.message) {
        console.error('❌ Error fetching neighboring settlements:', error.response.data.message)
      } else if (error?.message) {
        console.error('❌ Error fetching neighboring settlements:', error.message)
      } else {
        console.error('❌ Error fetching neighboring settlements:', error)
      }
    }
    return 0
  }
}

// Debounced function to fetch neighbors on map view changes
let neighborFetchTimeout: NodeJS.Timeout | null = null
const fetchNeighborsOnViewChange = () => {
  // Clear existing timeout
  if (neighborFetchTimeout) {
    clearTimeout(neighborFetchTimeout)
  }
  
  // Set new timeout
  neighborFetchTimeout = setTimeout(async () => {
    if (!mapReady.value || !mapRef.value?.map) return
    
    const viewportBbox = getMapViewportBbox()
    if (viewportBbox) {
      await fetchNeighboringSettlements(viewportBbox, true) // silent update
    }
  }, 500) // Wait 500ms after user stops panning/zooming
}

const geoserverUrl = 'https://kesmis.go.ke/geoserver'

// Cache for REST API layers to avoid repeated requests
const restLayersCache = ref<{ data: any[], timestamp: number } | null>(null)
const REST_CACHE_TIMEOUT = 10 * 60 * 1000 // 10 minutes

const getRestLayers = async (bbox: { minLng: number; minLat: number; maxLng: number; maxLat: number }) => {
  try {
    // Check cache first
    if (restLayersCache.value && 
        Date.now() - restLayersCache.value.timestamp < REST_CACHE_TIMEOUT) {
      console.log('🔄 Using cached REST API layers')
      return filterLayersByBbox(restLayersCache.value.data, bbox)
    }

    console.log('🔄 Fetching fresh layers from GeoServer REST API...')
    const restApiUrl = geoserverUrl + '/rest/layers.json'
    
    // Add timeout and authentication
    const response = await axios.get(restApiUrl, {
      timeout: 15000, // 15 second timeout
      headers: {
        'Accept': 'application/json, */*'
      },
      auth: {
        username: 'admin',
        password: '***REDACTED***'
      }
    })
    
    const jsonData = response.data
    
    if (!jsonData || typeof jsonData !== 'object') {
      throw new Error('Invalid JSON response from GeoServer REST API')
    }
    
    // Check if the structure exists before accessing it
    if (!jsonData.layers) {
      console.error('Missing layers in REST API response:', jsonData)
      throw new Error('Invalid REST API structure - missing layers')
    }
    
    let layers = jsonData.layers.layer
    
    // Handle case where there's only one layer (not an array)
    if (!Array.isArray(layers)) {
      layers = layers ? [layers] : []
    }
    
    console.log(`Found ${layers.length} raw layers to process`)
    
    if (layers.length === 0) {
      throw new Error('No layers found in REST API response')
    }
    
    // Process layers and fetch detailed information for each
    const glayers = []
    
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i]
      
      try {
        // Skip layers without name
        if (!layer.name) {
          console.warn(`Skipping layer at index ${i}: No name property`)
          continue
        }

        console.log(`Processing layer ${i + 1}/${layers.length}: ${layer.name}`)

        // Fetch detailed layer information
        const layerDetailsUrl = `${geoserverUrl}/rest/layers/kisip:${layer.name}.json`
        
        try {
          const layerResponse = await axios.get(layerDetailsUrl, {
            timeout: 10000,
            headers: { 'Accept': 'application/json, */*' },
            auth: { username: 'admin', password: '***REDACTED***' }
          });

          if (layerResponse.status === 200 && layerResponse.data.layer && layerResponse.data.layer.resource) {
            // Follow the resource href to get detailed information
            let resourceUrl = layerResponse.data.layer.resource.href;
            resourceUrl = resourceUrl.replace("http://", "https://");
            
            const resourceResponse = await axios.get(resourceUrl, {
              timeout: 10000,
              headers: { 'Accept': 'application/json, */*' },
              auth: { username: 'admin', password: '***REDACTED***' }
            });

            if (resourceResponse.status === 200) {
              const resourceData = resourceResponse.data;
              const dataSource = resourceData.coverage || resourceData.featureType;
              
              // Extract bounding box information
              let bbox = null;

              if (dataSource && dataSource.latLonBoundingBox) {
                const latLonBbox = dataSource.latLonBoundingBox;
                bbox = {
                  minx: latLonBbox.minx || -180,
                  miny: latLonBbox.miny || -90,
                  maxx: latLonBbox.maxx || 180,
                  maxy: latLonBbox.maxy || 90
                };
              } else if (dataSource && dataSource.nativeBoundingBox) {
                const nativeBbox = dataSource.nativeBoundingBox;
                bbox = {
                  minx: nativeBbox.minx || -180,
                  miny: nativeBbox.miny || -90,
                  maxx: nativeBbox.maxx || 180,
                  maxy: nativeBbox.maxy || 90
                };
              }

              if (bbox) {
                glayers.push({
                  name: layer.name,
                  title: layer.title || layer.name,
                  label: layer.name,
                  value: layer.name,
                  bbox: bbox,
                });

                console.log(`✓ Layer ${layer.name}: Bbox=[${bbox.minx}, ${bbox.miny}, ${bbox.maxx}, ${bbox.maxy}]`);
              }
            } else {
              console.warn(`Failed to fetch resource for layer ${layer.name}`);
            }
          } else {
            console.warn(`Failed to fetch details for layer ${layer.name}`);
          }
        } catch (error: any) {
          console.warn(`Error fetching details for layer ${layer.name}:`, error.message);
        }
      } catch (error: any) {
        console.warn(`Error processing layer at index ${i}:`, error.message, layer);
        continue;
      }
    }

    const skippedCount = layers.length - glayers.length;
    console.log(`Successfully processed: ${glayers.length}, Skipped: ${skippedCount}`)
    
    if (glayers.length === 0) {
      throw new Error('No valid layers could be processed')
    }
    
    // Cache the results
    restLayersCache.value = {
      data: glayers,
      timestamp: Date.now()
    }
    
    return filterLayersByBbox(glayers, bbox)
  } catch (error) {
    console.error('❌ Error fetching REST API layers:', error)
    // Return empty array instead of throwing to prevent map loading failure
    return []
  }
}

// Helper function to filter layers by bounding box
const filterLayersByBbox = (layers: any[], bbox: { minLng: number; minLat: number; maxLng: number; maxLat: number }) => {
  const imageUrls: string[] = []
  
  for (const layer of layers) {
    const { name, bbox: layerBbox } = layer
    if (!layerBbox) continue
    
    const intersects =
      bbox.minLng < layerBbox.maxx &&
      bbox.maxLng > layerBbox.minx &&
      bbox.minLat < layerBbox.maxy &&
      bbox.maxLat > layerBbox.miny
      
    if (intersects) {
      imageUrls.push('kisip:' + name)
    }
  }
  
  console.log(`✅ Found ${imageUrls.length} intersecting WMS layers`)
  return imageUrls
}

const availableImageryLayers = ref<string[]>([])
const selectedImageryLayers = ref<string[]>([])
const imageryLayerObjects = ref<Record<string, google.maps.ImageMapType>>({})

const addWmsLayer = async () => {
  const bbox = getSettlementBbox()
  if (!bbox || !props.settlementId) {
    console.log('⚠️ No bbox or settlementId available, skipping WMS layer')
    return
  }
  
  try {
    updateLoadingStatus('Loading satellite imagery...', 95)
    
    // Use backend endpoint to get intersecting imagery layers
    const response = await getSettlementImageryLayers({
      settlementId: props.settlementId,
      bbox
    })
    
    const layerList = response.data || response.results || []
    if (!layerList || layerList.length === 0 || !mapRef.value?.map) {
      console.log('⚠️ No imagery layers found for this settlement or map not ready')
      return
    }
    
    console.log(`🔄 Creating ${layerList.length} WMS layers...`)
    availableImageryLayers.value = layerList
    imageryLayerObjects.value = {}
    
    const wmsBaseUrl = geoserverUrl + '/kisip/wms'
    
    // Process layers in parallel for better performance
    const layerPromises = layerList.map(layerName => {
      return new Promise<void>((resolve) => {
        try {
          const wmsLayer = new google.maps.ImageMapType({
            getTileUrl(coord, zoom) {
              // Optimize tile URL generation
              const tileSize = 256
              const proj = mapRef.value!.map.getProjection()
              const scale = 1 << zoom
              
              // Use more efficient coordinate calculation
              const nwPoint = new google.maps.Point(
                coord.x * tileSize / scale, 
                coord.y * tileSize / scale
              )
              const sePoint = new google.maps.Point(
                (coord.x + 1) * tileSize / scale, 
                (coord.y + 1) * tileSize / scale
              )
              
              const nw = proj.fromPointToLatLng(nwPoint)
              const se = proj.fromPointToLatLng(sePoint)
              
              // Optimize bbox string creation
              const bboxStr = `${nw.lng()},${se.lat()},${se.lng()},${nw.lat()}`
              
              // Use optimized parameters
              const params = new URLSearchParams({
                service: 'WMS',
                version: '1.1.0',
                request: 'GetMap',
                layers: layerName,
                styles: '',
                bbox: bboxStr,
                width: '256',  // Reduced from 512 for faster loading
                height: '256', // Reduced from 512 for faster loading
                srs: 'EPSG:4326',
                format: 'image/png', // Use PNG for transparency support
                transparent: 'true' // Enable transparency so imagery overlays on base map
              })
              
              return `${wmsBaseUrl}?${params.toString()}`
            },
            tileSize: new google.maps.Size(256, 256),
            maxZoom: 20, // Reduced max zoom for better performance
            minZoom: 8,  // Set minimum zoom
            name: `Imagery: ${layerName.replace('kisip:', '')}`,
            opacity: 0.6 // Reduced opacity so base map shows through
          })
          
          imageryLayerObjects.value[layerName] = wmsLayer
          resolve()
        } catch (error) {
          console.error(`❌ Error creating layer ${layerName}:`, error)
          resolve() // Continue with other layers even if one fails
        }
      })
    })
    
    // Wait for all layers to be created
    await Promise.all(layerPromises)
    
    console.log(`✅ Created ${Object.keys(imageryLayerObjects.value).length} WMS layers`)
    
  } catch (error) {
    console.error('❌ Error adding WMS layer:', error)
    // Don't throw error to prevent map loading failure
  }
}

const toggleImagery = (layerName: string, visible: boolean) => {
  const map = mapRef.value?.map
  if (!map) return
  const layerObj = imageryLayerObjects.value[layerName]
  if (!layerObj) return
  const layers = map.overlayMapTypes
  const currentLayers = layers.getArray()
  const index = currentLayers.indexOf(layerObj)
  if (visible && index === -1) {
    layers.push(layerObj)
  } else if (!visible && index !== -1) {
    layers.removeAt(index)
  }
}

const toggleImageryGroup = (selected: string[]) => {
  availableImageryLayers.value.forEach(layer => {
    const isSelected = selected.includes(layer)
    toggleImagery(layer, isSelected)
  })
}

const userLocation = ref(null)

const locateMe = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const pos = { lat, lng }
        gmapCenter.value = pos
        userLocation.value = pos
        mapRef.value?.panTo(pos)
      },
      () => {
        ElMessage.error('Geolocation permission denied or unavailable.')
      }
    )
  } else {
    ElMessage.warning('Geolocation is not supported in this browser.')
  }
}

const userLocationMarker = computed(() => ({
  position: userLocation.value,
  icon: {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 8,
    fillColor: '#4285F4',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
  }
}))

/** Assessment location marker when assessmentPoint prop is provided (GeoJSON Point: [lng, lat]) */
const assessmentLocationMarker = computed(() => {
  const pt = props.assessmentPoint
  if (!pt || pt.type !== 'Point' || !Array.isArray(pt.coordinates) || pt.coordinates.length < 2) return null
  const g = typeof google !== 'undefined' ? google : (window as any).google
  if (!g?.maps?.SymbolPath) return null
  const [lng, lat] = pt.coordinates
  return {
    position: { lat, lng },
    title: 'Assessment location',
    icon: {
      path: g.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: '#E65100',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    }
  }
})

const circleOpacity = ref(0.5)
const circleRadius = ref(20)

const startBlinking = () => {
  let increasing = true
  const interval = setInterval(() => {
    if (increasing) {
      circleOpacity.value = Math.min(circleOpacity.value + 0.1, 0.8)
      circleRadius.value = Math.min(circleRadius.value + 2, 30)
    } else {
      circleOpacity.value = Math.max(circleOpacity.value - 0.1, 0.3)
      circleRadius.value = Math.max(circleRadius.value - 2, 20)
    }
    increasing = !increasing
  }, 500)
  setTimeout(() => {
    clearInterval(interval)
    circleOpacity.value = 0.5
    circleRadius.value = 20
  }, 10000)
}

watch(userLocation, (newLocation) => {
  if (newLocation) {
    startBlinking()
  }
})

onMounted(async () => {
  // Setup window resize listener for responsive drawer
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateWindowWidth)
    updateWindowWidth()
  }

  watch(
    () => mapRef.value?.ready,
    async (ready) => {
      if (ready) {
        mapReady.value = true
        await loadMapData()
        
        // Setup event listeners for pan and zoom to update neighboring settlements
        if (mapRef.value?.map) {
          // Update current zoom level
          currentZoom.value = mapRef.value.map.getZoom() || 8
          
          // Listen to bounds changes (pan and zoom)
          const boundsListener = mapRef.value.map.addListener('bounds_changed', () => {
            fetchNeighborsOnViewChange()
          })
          mapEventListeners.push(boundsListener)
          
          // Also listen to zoom changes for immediate updates
          const zoomListener = mapRef.value.map.addListener('zoom_changed', () => {
            // Update zoom level
            if (mapRef.value?.map) {
              currentZoom.value = mapRef.value.map.getZoom() || 8
            }
            fetchNeighborsOnViewChange()
          })
          mapEventListeners.push(zoomListener)
          
          // Listen to drag end for pan updates
          const dragListener = mapRef.value.map.addListener('dragend', () => {
            fetchNeighborsOnViewChange()
          })
          mapEventListeners.push(dragListener)
          // Single initial fetch for neighboring settlements (debounced 500ms)
          fetchNeighborsOnViewChange()
        }

        // Setup dark mode watcher
        const isDark = computed(() => appStore.getIsDark)
        watch(
          isDark,
          (isDarkValue) => {
            if (mapReady.value && mapRef.value?.map) {
              const newMapType = isDarkValue ? 'dark' : 'grayscale'
              mapRef.value.map.setMapTypeId(newMapType)
              const controlSelect = mapRef.value.map.controls[google.maps.ControlPosition.TOP_LEFT][0]?.querySelector('select')
              if (controlSelect) {
                controlSelect.value = newMapType
              }
            }
          }
        )
      }
    }
  )
})

// Store map event listeners for cleanup
const mapEventListeners: google.maps.MapsEventListener[] = []

// Cleanup resize listener and map event listeners on unmount
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateWindowWidth)
  }
  
  // Remove map event listeners
  if (mapRef.value?.map && mapEventListeners.length > 0) {
    mapEventListeners.forEach(listener => {
      google.maps.event.removeListener(listener)
    })
    mapEventListeners.length = 0
  }
  
  // Clear any pending neighbor fetch timeout
  if (neighborFetchTimeout) {
    clearTimeout(neighborFetchTimeout)
    neighborFetchTimeout = null
  }
})
 
 const downloadGeo = async () => {
  try {
    const zip = new JSZip()
    
    // Fetch all data in one call
    const allData = await fetchAllSettlementData()
    if (!allData) {
      throw new Error('Failed to fetch settlement data')
    }

    // Add settlement data
    if (allData.settlement?.features?.length) {
      const geojson = { type: 'FeatureCollection', features: allData.settlement.features }
      zip.file(`settlement_${props.settlementId}_settlement.geojson`, JSON.stringify(geojson, null, 2))
    }

    // Add parcel data
    if (allData.parcel?.features?.length) {
      const geojson = { type: 'FeatureCollection', features: allData.parcel.features }
      zip.file(`settlement_${props.settlementId}_parcels.geojson`, JSON.stringify(geojson, null, 2))
    }

    // Add structure data
    if (allData.structure?.features?.length) {
      const geojson = { type: 'FeatureCollection', features: allData.structure.features }
      zip.file(`settlement_${props.settlementId}_structures.geojson`, JSON.stringify(geojson, null, 2))
    }

    // Add road data
    if (allData.road?.features?.length) {
      const geojson = { type: 'FeatureCollection', features: allData.road.features }
      zip.file(`settlement_${props.settlementId}_roads.geojson`, JSON.stringify(geojson, null, 2))
    }

    // Add point features by type
    const pointModels = ['streetlight', 'crime_hotspot', 'community_project', 'health_facility', 'education_facility', 'water_point', 'sewer', 'piped_water', 'powerline', 'community_hall', 'police_station', 'mast', 'dumping_site', 'hazard_zone']
    
    pointModels.forEach(model => {
      if (allData[model]?.features?.length) {
        const geojson = { type: 'FeatureCollection', features: allData[model].features }
        const fileName = `${title.value}_${model}.geojson`
        zip.file(fileName, JSON.stringify(geojson, null, 2))
      }
    })

    // Generate and download zip
    const content = await zip.generateAsync({ type: 'blob' })
    saveAs(content, `${title.value}_layers.zip`)
    ElMessage.success('Download started successfully')
  } catch (error) {
    console.error('Error during download:', error)
    ElMessage.error('Failed to generate and download layers')
  }
}

// Add loading state management
const setLoading = (loading: boolean) => {
  dataLoading.value = loading
  isLoading.value = loading
}

// Optimized loading function with progressive feedback
const loadMapData = async () => {
  if (isProcessing.value || hasLoadedMapData.value) return
  hasLoadedMapData.value = true
  isProcessing.value = true
  setLoading(true)
  showProgressOverlay.value = true

  try {
    updateLoadingStatus('Initializing map...', 0)
    updateLoadingStatus('Fetching map data...', 10)
    await loadSelectedLayersWithProgress(['settlement', 'parcels', 'structures', 'other_points'])
    updateLoadingStatus('Setting up map controls...', 90)
    setupMapTypeControl()
    updateLoadingStatus('Map ready!', 100)

    // Neighboring settlements: one debounced fetch after listeners are attached (see onMounted)
    // Imagery: load in background without blocking
    setTimeout(async () => {
      try {
        await addWmsLayer()
        selectedImageryLayers.value = [...availableImageryLayers.value]
        toggleImageryGroup(selectedImageryLayers.value)
      } catch (error) {
        console.error('❌ Error loading satellite imagery:', error)
      }
    }, 50)
  } catch (error) {
    console.error('Error loading map data:', error)
    ElMessage.error('Failed to load map data')
    updateLoadingStatus('Loading failed', 0)
  } finally {
    setLoading(false)
    mapLoading.value = false
    isProcessing.value = false
    showProgressOverlay.value = false
    loadingStatus.value = ''
    loadingProgress.value = 0
    // Emit event when all layers are loaded
    emit('layers-loaded')
  }
}
</script>

 <template>
    <div class="map-container" >
      <!-- Progressive Loading Overlay -->
      <div v-if="showProgressOverlay" class="loading-overlay">
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <div class="loading-text">
            <h3>{{ loadingStatus || 'Loading Map...' }}</h3>
            <div v-if="loadingProgress > 0" class="progress-container">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: loadingProgress + '%' }"></div>
              </div>
              <div class="progress-text">{{ Math.round(loadingProgress) }}%</div>
            </div>
          </div>
        </div>
      </div>
      
      <GoogleMap
        ref="mapRef"
        :api-key="googleMapsApiKey"
      style="width: 100%; height: 100%"
        :center="gmapCenter"
        :zoom="8"
        map-type-id="grayscale"
        :map-type-control="false"
      >
        <!-- Map content (unchanged) -->
        <template v-if="OtherPointVisible">
          <template v-for="pnt in other_points" :key="pnt.id">
            <Marker v-if="pnt.type === 'marker'" :options="pnt" @click="onPointClick(pnt)" />
            <Polyline v-else-if="pnt.type === 'polyline'" :options="pnt" @click="onPointClick(pnt)" />
            <Polygon v-else-if="pnt.type === 'polygon'" :options="pnt" @click="onPointClick(pnt)" />
          </template>
        </template>

        <Circle
          v-if="userLocation"
          :options="{
            center: userLocation,
            radius: circleRadius,
            fillColor: '#4285F4',
            fillOpacity: circleOpacity,
            strokeColor: '#4285F4',
            strokeOpacity: 1,
            strokeWeight: 2,
          }"
        />

        <Marker v-if="userLocation" :options="userLocationMarker" />
        <Marker v-if="assessmentLocationMarker" :options="assessmentLocationMarker" />

        <div v-if="StructureVisible">
          <Polygon v-for="structure in structures" :key="structure.id" :options="structure" />
        </div>

        <div v-if="settVisibile">
          <Polygon v-for="polygon in polygons.filter(p => p.type !== 'point')" :key="polygon.id" :options="polygon" @click="onPolygonClick(polygon)" />
        </div>

        <!-- Neighboring Settlements (as dotted red polylines) -->
        <div>
          <Polyline 
            v-for="neighbor in neighboringSettlements" 
            :key="neighbor.id" 
            :options="neighbor" 
            @click="onPointClick(neighbor)" 
          />
        </div>

        <!-- Neighboring Settlement Labels (only show when zoomed in enough) -->
        <div v-if="currentZoom >= MIN_ZOOM_FOR_LABELS">
          <Marker 
            v-for="label in neighboringSettlementLabels" 
            :key="label.id" 
            :options="label" 
          />
        </div>

        <div v-if="parcelsVisible">
          <Polygon v-for="parcel in parcels" :key="parcel.id" :options="parcel" />
        </div>

        <div v-if="parcelLabelsVisible">
          <Marker v-for="label in parcelLabels" :key="label.id" :options="label" />
        </div>

      <div v-if="roadsVisible">
        <Polyline v-for="road in roads" :key="road.id" :options="road" @click="onPointClick(road)" />
      </div>

      <div v-if="powerlineVisible">
        <Polyline v-for="item in other_points.filter(p => p.properties?.featureType === 'powerline')" :key="item.id" :options="item" @click="onPointClick(item)" />
      </div>
      <div v-if="sewerVisible">
        <Polyline v-for="item in other_points.filter(p => p.properties?.featureType === 'sewer')" :key="item.id" :options="item" @click="onPointClick(item)" />
      </div>
      <div v-if="pipedWaterVisible">
        <Polyline v-for="item in other_points.filter(p => p.properties?.featureType === 'piped_water')" :key="item.id" :options="item" @click="onPointClick(item)" />
      </div>

        <!-- Keep InfoWindows for backward compatibility but hide them -->
        <InfoWindow v-if="false" @closeclick="closePopup" :options="{ position: gmapCenter }">
          <div style="max-width: 400px; height: 250px">
            <el-table :data="Object.entries(selectedFeature?.properties || {})" border style="width: 100;">
              <el-table-column prop="0" label="Property" width="150" />
              <el-table-column prop="1" label="Value" width="250" />
            </el-table>
          </div>
        </InfoWindow>

        <InfoWindow v-if="false" @closeclick="closePopup" :options="{ position: gmapCenter }">
          <div style="max-width: 400px; height: 250px">
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px; text-align: center; text-transform: uppercase;">
              {{ (selectedFeature?.properties?.featureType || 'Unknown Feature').replace(/_/g, ' ') }}
            </div>
            <el-table :data="filteredProperties" border style="width: 100;">
              <el-table-column prop="0" label="Field" width="150" />
              <el-table-column prop="1" label="Value" width="250" />
            </el-table>
          </div>
        </InfoWindow>
      </GoogleMap>

      <!-- Feature Details Drawer -->
      <ElDrawer
        v-model="drawerVisible"
        :title="drawerTitle"
        direction="rtl"
        :size="drawerSize"
        :before-close="closeDrawer"
        :close-on-click-modal="true"
        :close-on-press-escape="true"
        :z-index="10000"
        :modal="false"
        :append-to-body="true"
        class="feature-drawer"
      >
        <div v-if="drawerData.length > 0" class="drawer-content">
          <ElDescriptions :column="descriptionsColumn" border class="feature-descriptions">
            <ElDescriptionsItem 
              v-for="item in drawerData" 
              :key="item.field"
              :label="item.field"
              :label-style="{ fontWeight: 'bold', minWidth: labelMinWidth }"
            >
              <template #default>
                <span v-if="typeof item.value === 'object'" class="drawer-value">
                  {{ JSON.stringify(item.value) }}
                </span>
                <span v-else class="drawer-value">
                  {{ item.value }}
                </span>
              </template>
            </ElDescriptionsItem>
          </ElDescriptions>
        </div>
        <div v-else class="no-data">
          <p>No additional information available for this feature.</p>
        </div>
      </ElDrawer>

      <div id="floating-div">
      <div style="text-align: center; font-weight: bold; margin-bottom: 10px;">
        <h3 style="margin: 0; font-weight: bold; font-size: 16px; color: #333;">KEY</h3>
        </div>
        <ElCollapse accordion>
          <ElCollapseItem title="Parcels">
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <ElCheckbox v-model="parcelsVisible" @change="toggleParcels">
                Parcels ({{ layerFeatureCounts.parcels }})
              </ElCheckbox>
              <ElCheckbox v-model="parcelLabelsVisible" @change="toggleParcelLabels">
                Labels ({{ layerFeatureCounts.parcelLabels }})
              </ElCheckbox>
            </div>
            <div v-for="item in legendItems.filter(item => item.show)" :key="item.label" class="legend-item">
              <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
              <div class="legend-label">{{ item.label }}</div>
            </div>
          </ElCollapseItem>
          <ElCollapseItem title="Layers">
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <ElCheckbox v-model="OtherPointVisible" @change="toggleOtherPoint">
                Facilities ({{ layerFeatureCounts.other_points }})
              </ElCheckbox>
              <div v-for="item in PolyLineItems.filter(item => item.show)" :key="item.label" class="line-item">
                <div class="line-color" :style="{ backgroundColor: item.color }"></div>
                <div class="legend-label">{{ item.label }}</div>
              </div>
              <div v-for="item in PointLegendItems.filter(item => item.show)" :key="item.label" class="line-item">
                <img :src="item.icon" class="legend-icon" />
                <div class="legend-label">{{ item.label }}</div>
              </div>
              <ElCheckbox v-model="roadsVisible" @change="toggleRoads">
                Roads ({{ layerFeatureCounts.roads }})
              </ElCheckbox>
              <ElCheckbox v-model="StructureVisible" @change="toggleStructure">
                Structures ({{ layerFeatureCounts.structures }})
              </ElCheckbox>
            <ElCheckbox v-model="powerlineVisible">
              Powerline
            </ElCheckbox>
            <ElCheckbox v-model="sewerVisible">
              Sewer
            </ElCheckbox>
            <ElCheckbox v-model="pipedWaterVisible">
              Piped Water
            </ElCheckbox>
            </div>
          </ElCollapseItem>
          <ElCollapseItem v-if="availableImageryLayers.length > 0" title="Imagery">
            <ElCheckboxGroup v-model="selectedImageryLayers" @change="toggleImageryGroup">
              <div style="display: flex; flex-direction: column; gap: 2px;">
                <ElCheckbox v-for="layer in availableImageryLayers" :key="layer" :label="layer">
                  {{ layer.replace('kisip:', '') }}
                </ElCheckbox>
              </div>
            </ElCheckboxGroup>
          </ElCollapseItem>
          <ElCollapseItem title="Settlement">
            <ElCheckbox v-model="settVisibile" @change="toggleSettlement">
              Boundary ({{ layerFeatureCounts.settlement }})
            </ElCheckbox>
            <div v-if="layerFeatureCounts.neighboringSettlements > 0" style="margin-top: 8px; padding-left: 8px; font-size: 12px; color: #666;">
              Neighboring Settlements: {{ layerFeatureCounts.neighboringSettlements }}
            </div>
          </ElCollapseItem>
        </ElCollapse>
      </div>

      <ElButton circle title="Locate Me" class="geolocate-btn" plain @click="locateMe">
        <Icon icon="mage:location-fill" />
      </ElButton>
    <ElButton circle title="Download {{ title }} Data" class="download-btn" plain @click="downloadGeo">
      <Icon icon="mdi:download" />
      </ElButton>
    </div>
</template>

<style scoped>
/* (Unchanged from original) */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #333;
}

.map-container {
  position: relative;
  height: 100%;
  width: 100%;
}

#floating-div {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background-color: white;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  z-index: 10;
  height: fit-content;
  max-width: 500px;
}

#floating-div h3 {
  margin: 0;
  font-weight: bold;
  font-size: 16px;
  color: #333;
  text-align: center;
  line-height: 1.2;
  padding: 0;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.legend-color {
  width: 20px;
  height: 20px;
  margin-right: 10px;
}

.line-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.line-color {
  width: 20px;
  height: 5px;
  margin-right: 10px;
}

.point-legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.legend-icon {
  width: 30px;
  height: 30px;
  margin-right: 10px;
  object-fit: contain;
}

/* Dark mode styles */
.dark .card-header {
  color: #e0e0e0;
}

.dark #floating-div {
  background-color: #333;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.dark .legend-label {
  color: #e0e0e0;
}

.dark .el-collapse {
  background-color: #333;
  color: #e0e0e0;
}

.dark .el-collapse-item__header {
  background-color: #444;
  color: #e0e0e0;
}

.dark .el-collapse-item__content {
  background-color: #333;
  color: #e0e0e0;
}

.dark .el-checkbox__label {
  color: #e0e0e0;
}

.dark .el-table {
  background-color: #333;
  color: #e0e0e0;
}

.dark .el-table th {
  background-color: #444;
  color: #e0e0e0;
}

.dark .el-table td {
  background-color: #333;
  color: #e0e0e0;
}

.dark .el-table--border,
.dark .el-table--group {
  border-color: #555;
}

.dark .el-table th,
.dark .el-table td {
  border-color: #555;
}

.geolocate-btn {
  position: absolute;
  top: 15px;
  right: 70px;
  z-index: 1000;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.download-btn {
  position: absolute;
  top: 15px;
  right: 120px;
  z-index: 9999;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  background-color: white;
  border: 1px solid #dcdfe6;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  color: #606266;
  transition: all 0.3s;
  pointer-events: auto;
}

.download-btn:hover {
  background-color: #f5f7fa;
  border-color: #c0c4cc;
  color: #409eff;
}

/* Ensure button stays visible in fullscreen */
.map-container:fullscreen .download-btn,
.map-container:-webkit-full-screen .download-btn,
.map-container:-moz-full-screen .download-btn {
  z-index: 99999;
  position: fixed;
}

/* Progressive Loading Overlay */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(2px);
}

.loading-content {
  text-align: center;
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 350px;
  width: 90%;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.progress-container {
  margin: 15px 0;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background-color: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #67c23a);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

/* Dark mode styles for loading overlay */
.dark .loading-overlay {
  background: rgba(0, 0, 0, 0.95);
}

.dark .loading-content {
  background: #333;
  color: #e0e0e0;
}

.dark .loading-text h3 {
  color: #e0e0e0;
}

.dark .progress-text {
  color: #ccc;
}

.dark .progress-bar {
  background-color: #555;
}

/* Drawer styles */
.no-data {
  text-align: center;
  padding: 20px;
  color: #999;
  font-style: italic;
}

/* Ensure drawer appears above download button */
.el-drawer {
  z-index: 10000 !important;
}

.el-drawer__wrapper {
  z-index: 10000 !important;
}

/* Dark mode for drawer */
.dark .no-data {
  color: #ccc;
}

/* Mobile-optimized drawer styles */
.feature-drawer {
  transition: all 0.3s ease;
}

.drawer-content {
  padding: 0;
  overflow-y: auto;
  max-height: calc(100vh - 60px);
}

.feature-descriptions {
  width: 100%;
}

.feature-descriptions :deep(.el-descriptions__label) {
  font-size: 14px;
  word-break: break-word;
}

.feature-descriptions :deep(.el-descriptions__content) {
  font-size: 14px;
  word-break: break-word;
}

.drawer-value {
  word-break: break-word;
  overflow-wrap: break-word;
}

/* Mobile-specific styles */
@media (max-width: 768px) {
  .feature-drawer :deep(.el-drawer__body) {
    padding: 15px;
  }

  .feature-descriptions :deep(.el-descriptions__label) {
    font-size: 13px;
    min-width: 100px !important;
    padding: 8px 10px;
  }

  .feature-descriptions :deep(.el-descriptions__content) {
    font-size: 13px;
    padding: 8px 10px;
  }

  .feature-descriptions :deep(.el-descriptions__table) {
    font-size: 13px;
  }

  .feature-descriptions :deep(.el-descriptions__table th),
  .feature-descriptions :deep(.el-descriptions__table td) {
    padding: 8px 10px;
  }

  .drawer-content {
    max-height: calc(100vh - 80px);
  }

  .no-data {
    padding: 15px;
    font-size: 14px;
  }
}

/* Tablet-specific styles */
@media (min-width: 769px) and (max-width: 1024px) {
  .feature-drawer :deep(.el-drawer__body) {
    padding: 20px;
  }

  .feature-descriptions :deep(.el-descriptions__label) {
    font-size: 14px;
  }

  .feature-descriptions :deep(.el-descriptions__content) {
    font-size: 14px;
  }
}

/* Ensure drawer is touch-friendly on mobile */
@media (max-width: 768px) {
  .feature-drawer :deep(.el-drawer__header) {
    padding: 15px;
    margin-bottom: 10px;
  }

  .feature-drawer :deep(.el-drawer__title) {
    font-size: 16px;
    font-weight: 600;
  }

  .feature-drawer :deep(.el-drawer__close-btn) {
    font-size: 20px;
    width: 32px;
    height: 32px;
  }
}

/* Neighbor label text wrapping - Google Maps labels don't natively support wrapping,
   but this helps with styling if using custom overlays */
:deep(.neighbor-label-text) {
  white-space: normal !important;
  word-wrap: break-word !important;
  max-width: 150px !important;
  text-align: center !important;
}
</style>