<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { ElButton, ElTable, ElTableColumn, ElMessage, ElCollapse, ElCollapseItem, ElCheckbox, ElCheckboxGroup } from 'element-plus'
import { GoogleMap, Polygon, InfoWindow, Marker, Polyline, Circle } from 'vue3-google-map'
import * as turf from '@turf/turf'
import { getSettlementMapData } from '@/api/settlements'
import { Icon } from '@iconify/vue'
import axios from 'axios'
import { XMLParser } from 'fast-xml-parser'
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

const props = defineProps<{
  settlementId: string
}>()

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

const isLoading = ref(false)
const mapLoading = ref(true)
const dataLoading = ref(false)

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

// Fetch functions - Consolidated approach
const fetchAllSettlementData = async (): Promise<SettlementMapData | null> => {
  isLoading.value = true
  try {
    console.log('🔄 Fetching consolidated settlement data...')
    const res = await getSettlementMapData({ settlementId: props.settlementId })
    
    console.log('🔍 API Response:', res)
    
    // Handle the actual response structure
    const responseData = res as any
    if (!responseData?.data) {
      throw new Error('No settlement data received')
    }

    const mapData = responseData.data
    console.log('✅ Received consolidated data:', Object.keys(mapData))

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
      hospitals: 0, // Will be calculated from point features
      schools: 0,   // Will be calculated from point features
      water_points: 0, // Will be calculated from point features
      structures: mapData.structure?.features?.length || 0,
      other_points: allPointFeatures.length
    }

    return mapData

  } catch (error) {
    console.error('❌ Error fetching consolidated settlement data:', error)
    ElMessage({ message: 'Failed to load settlement data', type: 'error' })
    return null
  } finally {
    isLoading.value = false
  }
}

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

// Add lazy loading and chunked processing
const chunkSize = 100 // Process features in chunks
const processFeaturesInChunks = async (features: any[], processor: (feature: any, index: number) => void) => {
  const chunks: any[][] = []
  for (let i = 0; i < features.length; i += chunkSize) {
    chunks.push(features.slice(i, i + chunkSize))
  }
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    chunk.forEach((feature, index) => {
      processor(feature, i * chunkSize + index)
    })
    
    // Yield control to prevent UI blocking
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 0))
    }
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

const onPolygonClick = (feature) => {
  infowindow.value = true
  // Better positioning logic for different feature types
  if (feature.paths && feature.paths.length > 0) {
    gmapCenter.value = feature.paths[0]
  } else if (feature.path && feature.path.length > 0) {
    gmapCenter.value = feature.path[Math.floor(feature.path.length / 2)]
  } else if (feature.position) {
    gmapCenter.value = feature.position
  } else {
    gmapCenter.value = { lat: 0, lng: 0 }
  }
  selectedFeature.value = {
    ...feature,
    properties: Object.fromEntries(
      Object.entries(feature.properties || {}).filter(([_, value]) => value)
    )
  }
  console.log('Polygon clicked:', selectedFeature.value)
}

const onPointClick = (feature) => {
  PointInfowindow.value = true
  // Better positioning logic for different feature types
  if (feature.paths && feature.paths.length > 0) {
    gmapCenter.value = feature.paths[0]
  } else if (feature.path && feature.path.length > 0) {
    gmapCenter.value = feature.path[Math.floor(feature.path.length / 2)]
  } else if (feature.position) {
    gmapCenter.value = feature.position
  } else {
    gmapCenter.value = { lat: 0, lng: 0 }
  }
  selectedFeature.value = {
    ...feature,
    properties: Object.fromEntries(
      Object.entries(feature.properties || {}).filter(([_, value]) => value)
    )
  }
  console.log('Point/Line clicked:', selectedFeature.value)
}

const closePopup = () => {
  infowindow.value = false
  PointInfowindow.value = false
}

const filteredProperties = computed(() => {
  if (!selectedFeature.value?.properties) return []
  return Object.entries(selectedFeature.value.properties).filter(([_, value]) => 
    value !== null && value !== undefined && value !== ''
  )
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

const geoserverUrl = 'https://kesmis.go.ke/geoserver'

const getWmsUrl = async (bbox: { minLng: number; minLat: number; maxLng: number; maxLat: number }) => {
  try {
    const capabilitiesUrl = geoserverUrl + '/kisip/ows?service=wms&request=GetCapabilities'
    const response = await axios.get(capabilitiesUrl)
    const xml = response.data
    const parser = new XMLParser()
    const json = parser.parse(xml)
    const glayers = json.WMS_Capabilities.Capability.Layer.Layer.map((layer: any) => ({
      name: layer.Name,
      title: layer.Title,
      label: layer.Name,
      value: layer.Name,
      bbox: {
        minx: parseFloat(layer.EX_GeographicBoundingBox.westBoundLongitude),
        miny: parseFloat(layer.EX_GeographicBoundingBox.southBoundLatitude),
        maxx: parseFloat(layer.EX_GeographicBoundingBox.eastBoundLongitude),
        maxy: parseFloat(layer.EX_GeographicBoundingBox.northBoundLatitude),
      }
    }))
    const imageUrls: string[] = []
    for (const layer of glayers) {
      const { name, bbox: layerBbox } = layer
      const intersects =
        bbox.minLng < layerBbox.maxx &&
        bbox.maxLng > layerBbox.minx &&
        bbox.minLat < layerBbox.maxy &&
        bbox.maxLat > layerBbox.miny
      if (intersects) {
        imageUrls.push('kisip:' + name)
      }
    }
    return imageUrls
  } catch (error) {
    console.error('Error occurred while fetching WMS URL:', error)
    return []
  }
}

const availableImageryLayers = ref<string[]>([])
const selectedImageryLayers = ref<string[]>([])
const imageryLayerObjects = ref<Record<string, google.maps.ImageMapType>>({})

const addWmsLayer = async () => {
  const bbox = getSettlementBbox()
  if (!bbox) {
    console.log('⚠️ No bbox available, skipping WMS layer')
    return
  }
  
  try {
  const layerList = await getWmsUrl(bbox)
  if (!layerList || !mapRef.value?.map) return
  availableImageryLayers.value = layerList
  imageryLayerObjects.value = {}
  const wmsBaseUrl = geoserverUrl + '/kisip/wms'
  layerList.forEach(layerName => {
    const wmsLayer = new google.maps.ImageMapType({
      getTileUrl(coord, zoom) {
        const tileSize = 256
        const proj = mapRef.value!.map.getProjection()
        const scale = 1 << zoom
        const nwPoint = new google.maps.Point(coord.x * tileSize / scale, coord.y * tileSize / scale)
        const sePoint = new google.maps.Point((coord.x + 1) * tileSize / scale, (coord.y + 1) * tileSize / scale)
        const nw = proj.fromPointToLatLng(nwPoint)
        const se = proj.fromPointToLatLng(sePoint)
        const bbox = [nw.lng(), se.lat(), se.lng(), nw.lat()].join(',')
        const params = new URLSearchParams({
          service: 'WMS',
          version: '1.1.0',
          request: 'GetMap',
          layers: layerName,
          styles: '',
          bbox,
          width: '512',
          height: '512',
          srs: 'EPSG:4326',
          format: 'image/png',
          transparent: 'true'
        })
        return `${wmsBaseUrl}?${params.toString()}`
      },
      tileSize: new google.maps.Size(256, 256),
      maxZoom: 22,
      minZoom: 0,
      name: `Drone: ${layerName}`,
      opacity: 0.8
    })
    imageryLayerObjects.value[layerName] = wmsLayer
  })
  } catch (error) {
    console.error('❌ Error adding WMS layer:', error)
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
  watch(
    () => mapRef.value?.ready,
    async (ready) => {
      if (ready) {
        mapReady.value = true
        await loadMapData()
        
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

// Optimized loading function
const loadMapData = async () => {
  if (isProcessing.value) return
  
  isProcessing.value = true
  setLoading(true)
  
  try {
    await loadSelectedLayers(['settlement', 'parcels', 'other_points', 'structures'])
    setupMapTypeControl()
    await addWmsLayer()
    selectedImageryLayers.value = [...availableImageryLayers.value]
    toggleImageryGroup(selectedImageryLayers.value)
  } catch (error) {
    console.error('Error loading map data:', error)
    ElMessage.error('Failed to load map data')
  } finally {
    setLoading(false)
    mapLoading.value = false
    isProcessing.value = false
    // Emit event when all layers are loaded
    emit('layers-loaded')
  }
}
</script>

 <template>
    <div class="map-container" >
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

        <div v-if="StructureVisible">
          <Polygon v-for="structure in structures" :key="structure.id" :options="structure" />
        </div>

        <div v-if="settVisibile">
          <Polygon v-for="polygon in polygons" :key="polygon.id" :options="polygon" @click="onPolygonClick(polygon)" />
        </div>

        <div v-if="settVisibile">
          <Marker v-for="polygon in polygons" :key="polygon.id" :options="polygon" @click="onPolygonClick(polygon)" />
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

        <InfoWindow v-if="infowindow" @closeclick="closePopup" :options="{ position: gmapCenter }">
          <div style="max-width: 400px; height: 250px">
            <el-table :data="Object.entries(selectedFeature?.properties || {})" border style="width: 100;">
              <el-table-column prop="0" label="Property" width="150" />
              <el-table-column prop="1" label="Value" width="250" />
            </el-table>
          </div>
        </InfoWindow>

        <InfoWindow v-if="PointInfowindow" @closeclick="closePopup" :options="{ position: gmapCenter }">
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
          <ElCollapseItem title="Imagery">
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
          </ElCollapseItem>
        </ElCollapse>
      </div>

      <ElButton circle title="Locate Me" class="geolocate-btn" plain @click="locateMe">
        <Icon icon="mage:location-fill" />
      </ElButton>
    <ElButton title="Download Geographic Data" class="download-btn" plain @click="downloadGeo">
      <Icon icon="solar:download-bold" />
      Download Data
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
</style>