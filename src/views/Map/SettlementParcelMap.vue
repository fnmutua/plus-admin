<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElCard, ElButton, ElTable, ElTableColumn, ElMessage, ElCollapse, ElCollapseItem, ElCheckbox, ElCheckboxGroup } from 'element-plus'
import { Back, Download,Position } from '@element-plus/icons-vue'
import { GoogleMap, Polygon, InfoWindow, Marker, CustomMarker, Circle , Polyline } from 'vue3-google-map'
 
import * as turf from '@turf/turf'
import { getOneGeo, getfilteredParcelGeo, getfilteredGeo } from '@/api/settlements'
import { Icon } from '@iconify/vue'
import axios from 'axios';

import { XMLParser } from 'fast-xml-parser';

import { useAppStore } from '@/store/modules/app'
const appStore = useAppStore()
const googleMapsApiKey = 'AIzaSyCrzbOkfG52zkAxYPkMvvRMlxE9qHK4uDk'

const route = useRoute()
const router = useRouter()
const mapRef = ref<any>(null)
const title = ref('')
const mapReady = ref(false)

// the geodata 
const features = ref([])
const parcelGeoData = ref<any[]>([])
const roadGeoData = ref<any[]>([])
 const wpGeoData = ref<any[]>([])
const structureGeoData = ref<any[]>([])
const otherPointsGeoData = ref<any[]>([])

// to hold paths
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

// Track feature counts for each layer
const layerFeatureCounts = ref({
  settlement: 0,
  parcels: 0,
  parcelLabels: 0,
  roads: 0,
  hospitals: 0,
  schools: 0,
  water_points: 0,
  structures :0,
  other_points :0,
})

const legendItems = [
  { label: 'Residential', color: '#8C675D',landuseId: 0, show: false },
  { label: 'Industrial', color: '#800080', landuseId: 1, show: false },
  { label: 'Education', color: '#F6C567', landuseId: 2, show: false },
  { label: 'Recreation', color: '#6FDC6E', landuseId: 3, show: false },
  { label: 'Public Purpose', color: '#FFFF00', landuseId: 4, show: false },
  { label: 'Commercial', color: '#FF1D1E', landuseId: 5, show: false },
  { label: 'Public Utility', color: '#73B2FF', landuseId: 6, show: false },
  { label: 'Transportation', color: '#DCDCDC', landuseId: 7, show: false },
  { label: 'Undeveloped', color: '#FDFD96', landuseId: 8, show: false },
  { label: 'Agricultural', color: '#FDFD96', landuseId: 9, show: false }
]



// Modify PointLegendItems to include show flag
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
    color: 'red', // Asphalt gray
    style: {
      borderTop: '4px solid #A9A9A9', // Solid for road
      width: '40px',
      height: '0',
    },
    show: false
  },
  { 
    layer: 'powerline', 
    label: 'Powerline', 
    color: '#FFD700', // Gold
    style: {
      borderTop: '2px dashed #FFD700', // Dashed for powerline
      width: '40px',
      height: '0',
    },
    show: false
  },
  { 
    layer: 'sewer', 
    label: 'Sewer', 
    color: '#4B0082', // Dark Indigo
    style: {
      borderTop: '2px dotted #4B0082', // Dotted for sewer
      width: '40px',
      height: '0',
    },
    show: false
  },
  { 
    layer: 'piped_water', 
    label: 'Piped Water', 
    color: '#00BFFF', // Light Sky Blue
    style: {
      borderTop: '2px dotted #00BFFF', // Dotted for piped water
      width: '40px',
      height: '0',
    },
    show: false
  },
])




 


const fetchSettlementData = async () => {
  isLoading.value = true
  try {
    const id = route.params.id
    const formData = { model: 'settlement', id }
    const res = await getOneGeo(formData)
    if (!res.data?.[0]?.json_build_object?.features?.length) {
      throw new Error('No settlement features found')
    }
    title.value = res.data[0].json_build_object.features[0].properties.name
    features.value = res.data[0].json_build_object.features
    return turf.featureCollection(res.data[0].json_build_object.features)
  } catch (error) {
    console.error('Error fetching settlement data:', error)
    ElMessage({ message: 'Failed to load settlement data', type: 'error' })
    return null
  } finally {
    isLoading.value = false
  }
}

const fetchParcels = async () => {
  try {
    const id = route.params.id
    const formData = {
      model: 'parcel',
      columnFilterField: 'settlement_id',
      selectedParents: [id],
      filtredGeoIds: [id]
    }
    const res = await getfilteredParcelGeo(formData)

    if (res.data[0]?.json_build_object?.features) {
      const features = res.data[0].json_build_object.features
      const featureCollection = turf.featureCollection(features)

      console.log('featureCollection',featureCollection)

      // Extract all unique landuseId from features
      const landuseIdsFound = new Set(
        features.map(f => f.properties?.landuse_id).filter(id => id !== null && id !== undefined)
      )

      // Update legendItems based on found landuseIds
      legendItems.forEach(item => {
        item.show = landuseIdsFound.has(item.landuseId)
      })

      console.log('landuseIdsFound',landuseIdsFound)

      return featureCollection
    }
    return null
  } catch (error) {
    console.error('Error fetching parcel data:', error)
    ElMessage({ message: 'Failed to load parcel data', type: 'error' })
    return null
  }
}


const fetchRoads = async () => {
  try {
    const id = route.params.id
    const formData = { model: 'road', columnFilterField: 'settlement_id', selectedParents: [id], filtredGeoIds: [id] }
    const res = await getfilteredParcelGeo(formData)
    if (res.data[0]?.json_build_object?.features) {
      return turf.featureCollection(res.data[0].json_build_object.features)
    }
    return null
  } catch (error) {
    console.error('Error fetching road data:', error)
    ElMessage({ message: 'Failed to load road data', type: 'error' })
    return null
  }
}

 

 
 


const fetchStructures = async () => {
  try {
    const id = route.params.id
    const formData = { model: 'structure', columnFilterField: 'settlement_id', selectedParents: [id], filtredGeoIds: [id] }
    const res = await getfilteredParcelGeo(formData)
   
    if (res.data[0]?.json_build_object?.features) {
      return turf.featureCollection(res.data[0].json_build_object.features)
    }
    return null
  } catch (error) {
    console.error('Error fetching structure data:', error)
    ElMessage({ message: 'Failed to load structure data', type: 'error' })
    return null
  }
}



const fetchPointGeoFeatures = async () => {
  const id = route.params.id
  const models = ['streetlight', 'crime_hotspot','community_project', 'health_facility', 'education_facility', 'water_point',  'sewer','piped_water', 'powerline', 'community_hall', 'police_station', 'mast','dumping_site','hazard_zone','road',] // Add more models as needed
  const allFeatures = []

  try {
    for (const model of models) {
      const formData = {
        model,
        columnFilterField: 'settlement_id',
        selectedParents: [id]
      }

      const res = await getfilteredGeo(formData)

      console.log('fetch data.....', model, res.data)

      const features =
        res?.data?.[0]?.json_build_object?.features ??
        res?.data?.[0]?.[0]?.json_build_object?.features ??
        []


        const legendItem = PointLegendItems.value.find(item => item.layer == model && features.length>0 );
            if (legendItem) {
            legendItem.show = true;
            }


            const legendLineItem = PolyLineItems.value.find(item => item.layer == model && features.length>0 );
            if (legendLineItem) {
              legendLineItem.show = true;
            }



         console.log('fetch features.....', model, features)

      const taggedFeatures = features.map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          featureType: model
        }
      }))

      allFeatures.push(...taggedFeatures)
    }

    console.log('allFeatures:', allFeatures)

    return turf.featureCollection(allFeatures)
  } catch (error) {
    console.error('Error fetching geo data:', error)
    ElMessage({ message: 'Failed to load geo features', type: 'error' })
    return null
  }
}






const downloadGeoJSON = () => {
  ElMessage({ message: 'Downloading GeoJSON...', type: 'warning' })
  console.log(polygons.value)
  const features = polygons.value.map((polygon) => ({
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [polygon.paths.map((p: { lat: number; lng: number }) => [p.lng, p.lat])]
    },
    properties: polygon.properties
  }))
  const collection = turf.featureCollection(features)
  const jsonString = JSON.stringify(collection, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const link = document.createElement('a')
  link.download = `${title.value}.geojson`
  link.href = window.URL.createObjectURL(blob)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const goBack = () => router.back()

const editSettlement = () => {
  router.push({ name: 'AddSettlementX', query: { id: route.params.id } })
}

const loadSelectedLayers = async (layers: string[]) => {
  if (!mapReady.value || !window.google?.maps) {
    console.error('Google Maps API not ready')
    return
  }

  const bounds = new google.maps.LatLngBounds()

  console.log('bounds',bounds)

  // Clear all layer data
  polygons.value = []
  parcels.value = []
  parcelLabels.value = []
  roads.value = []
   water_points.value = []
  structures.value = []
  other_points.value=[]
  // Reset feature counts
  layerFeatureCounts.value = {
    settlement: 0,
    parcels: 0,
    parcelLabels: 0,
    roads: 0,
     water_points: 0,
    structures: 0,
    other_points:0,
  }

  // Map layer names to their fetch functions and data refs
  const layerConfig = {
    settlement: { fetch: fetchSettlementData, dataRef: features },
    parcels: { fetch: fetchParcels, dataRef: parcelGeoData },
    roads: { fetch: fetchRoads, dataRef: roadGeoData },
     structures: { fetch: fetchStructures, dataRef: structureGeoData },
    other_points: { fetch: fetchPointGeoFeatures, dataRef: otherPointsGeoData },
  }

  // Fetch data for each specified layer
  for (const layer of layers) {
    if (layerConfig[layer]) {
      const { fetch, dataRef } = layerConfig[layer]
      const data = await fetch()
      if (data?.features?.length) {
        dataRef.value = data
        layerFeatureCounts.value[layer] = data.features.length
 
      } else {
        console.log(`No data for layer: ${layer}`)


        dataRef.value = null
        layerFeatureCounts.value[layer] = 0
      }
    }
  }

  // Set parcelLabels count (same as parcels)
  if (layerFeatureCounts.value.parcels > 0) {
    layerFeatureCounts.value.parcelLabels = layerFeatureCounts.value.parcels
  }

  // Process settlement data
  if (layerConfig.settlement.dataRef.value?.features?.length) {
  const featureCollection = layerConfig.settlement.dataRef.value;
  featureCollection.features.forEach((feature: any, index: number) => {
    const { geometry, properties } = feature;
    
    // Handle Polygon and MultiPolygon
    if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
      let coordinates = geometry.coordinates;
      if (geometry.type === 'MultiPolygon') {
        coordinates = coordinates.flat();
      }
      coordinates.forEach((polygonCoordinates: number[][]) => {
        const paths = polygonCoordinates.map(([lng, lat]) => {
          const point = { lat, lng };
          bounds.extend(point);
          return point;
        });
        polygons.value.push({
          id: properties?.id || index,
          paths,
          strokeColor: 'purple',
          strokeOpacity: 1,
          strokeWeight: 2,
          fillColor: '#FF0000',
          fillOpacity: 0,
          type:"poly",
          properties: { ...properties },
        });
      });
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
        type:"point",
        icon: {
          url: iconUrl,
          scaledSize: new google.maps.Size(30, 30),
          anchor: new google.maps.Point(15, 15)
        },
        properties: { ...properties }
      })
    }

    console.log('polygons.value', polygons.value)
  });
}


  // Process parcels
  if (layerConfig.parcels.dataRef.value?.features?.length) {
    layerConfig.parcels.dataRef.value.features.forEach((feature: any, index: number) => {
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
  }


 
  

 
 


   // Process structures
   if (layerConfig.structures.dataRef.value?.features?.length) {
    layerConfig.structures.dataRef.value.features.forEach((feature: any, index: number) => {
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
            id: `parcel-${properties?.structure_id || index}`,
            paths,
            strokeColor: 'white',
            strokeOpacity: 1,
            strokeWeight: 1,
            fillColor,
            fillOpacity: 0.7,
            properties: { ...properties }
          })
        
        })
      }
    })
  }



// Process facilities otherPoints
if (layerConfig.other_points.dataRef.value?.features?.length) {
  layerConfig.other_points.dataRef.value.features.forEach((feature: any, index: number) => {
    const { geometry, properties } = feature
    const featureType = (properties.featureType || '').toLowerCase()

    console.log('featureType', featureType)

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

    // Symbol styles
    const lineStyles: Record<string, any> = {
      road: {
        strokeColor: "red", // Asphalt gray
        strokeOpacity: 1,
        strokeWeight: 4,
       },
      powerline: {
        strokeOpacity: 0,
        icons: [{
          icon: {
            path: "M 0,-1 0,1",
            strokeOpacity: 1,
            scale: 2,
            strokeWeight: 4,  
            strokeColor: "yellow", // Yellow
          },
          offset: "0",
          repeat: "20px"
        }]
      },
      sewer: {
        strokeOpacity: 0,
        icons: [{
          icon: {
            path: "M 0,-1 0,1",
            strokeOpacity: 1,
            scale: 2,
            strokeWeight: 3,
            strokeColor: "#4B0082", // Dark Indigo
          },
          offset: "0",
          repeat: "15px"
        }]
      },
      piped_water: {
        strokeOpacity: 0,
        icons: [{
          icon: {
            path: "M 0,-1 0,1",
            strokeOpacity: 1,
            scale: 2,
            strokeWeight: 3,
            strokeColor: "#00BFFF", // Light Sky Blue
          },
          offset: "0",
          repeat: "15px"
        }]
      }
    }

    // Default fallback for unknown lines
    const defaultLineStyle = {
      strokeColor: "#999999",
      strokeOpacity: 0.8,
      strokeWeight: 3,
    }

    // Handle Point
    if (geometry.type === 'Point') {
      const [lng, lat] = geometry.coordinates
      const point = { lat, lng }
      bounds.extend(point)

      other_points.value.push({
        id: `op-${properties?.id || index}`,
        type: 'marker',
        position: point,
        icon: {
          url: iconUrl,
          scaledSize: new google.maps.Size(30, 30),
          anchor: new google.maps.Point(15, 15),
        },
        properties: { ...properties },
      })
    }

    // Handle LineString & MultiLineString
    else if (geometry.type === 'LineString' || geometry.type === 'MultiLineString') {
      const lines = geometry.type === 'LineString' ? [geometry.coordinates] : geometry.coordinates

      lines.forEach((line, lineIndex) => {
        const path = line.map(([lng, lat]) => {
          const point = { lat, lng }
          bounds.extend(point)
          return point
        })

        const style = lineStyles[featureType] || defaultLineStyle

        other_points.value.push({
          id: `line-${properties?.id || index}-${lineIndex}`,
          type: 'polyline',
          path,
          options: style,
          properties: { ...properties },
        })
      })
    }

    // Handle Polygon
    else if (geometry.type === 'Polygon') {
      const paths = geometry.coordinates.map((ring) =>
        ring.map(([lng, lat]) => {
          const point = { lat, lng }
          bounds.extend(point)
          return point
        })
      )

      other_points.value.push({
        id: `poly-${properties?.id || index}`,
        type: 'polygon',
        paths,
        options: {
          strokeColor: '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#FF0000',
          fillOpacity: 0.35,
        },
        properties: { ...properties },
      })
    }
  })

  console.log('other_points (all features) >>', other_points.value)
}






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

onMounted(async () => {
  // Wait for the GoogleMap component to be ready
  watch(
    () => mapRef.value?.ready,
    async (ready) => {
      if (ready) {
        mapReady.value = true
        
        await loadSelectedLayers(['settlement', 'parcels'    ,'other_points',  'structures'])
          setupMapTypeControl()
          
        await addWmsLayer()
        
         // Optional: preload everything on first load
          selectedImageryLayers.value = [...availableImageryLayers.value];
          toggleImageryGroup(selectedImageryLayers.value);

          const isDark = computed(() => appStore.getIsDark)
            // Watch for changes in isDarkMode
            watch(
              isDark,
              (isDarkValue) => {
                if (mapReady.value && mapRef.value?.map) {
                  const newMapType = isDarkValue ? 'dark' : 'grayscale'
                  mapRef.value.map.setMapTypeId(newMapType)
                  // Sync dropdown
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






// Computed property to determine available layers
const availableLayers = computed(() => {
  const layers = []
  if (layerFeatureCounts.value.settlement > 0) layers.push('settlement')
  if (layerFeatureCounts.value.parcels > 0) layers.push('parcels')
  if (layerFeatureCounts.value.parcelLabels > 0) layers.push('parcelLabels')
  if (layerFeatureCounts.value.roads > 0) layers.push('roads')
   if (layerFeatureCounts.value.schools > 0) layers.push('schools')
  if (layerFeatureCounts.value.water_points > 0) layers.push('water_points')
  if (layerFeatureCounts.value.structures > 0) layers.push('structures')
  if (layerFeatureCounts.value.other_points > 0) layers.push('other_points')

  
  return layers
})


const infowindow = ref(false)
const selectedFeature = ref(null)
const gmapCenter = ref()

const onPolygonClick = (feature) => {
  console.log('onPolygonClick', feature)
  infowindow.value = true
  gmapCenter.value = feature.paths
    ? feature.paths[0]
    : feature.path
      ? feature.path[Math.floor(feature.path.length / 2)]
      : feature.position || { lat: 0, lng: 0 }
  selectedFeature.value = {
    ...feature,
    properties: Object.fromEntries(
      Object.entries(feature.properties).filter(([_, value]) => value)
    )
  }
}



const PointInfowindow = ref(false)


const filteredProperties = computed(() => {
  // Filter out properties where the value is an object
  return Object.entries(selectedFeature.value?.properties || {}).filter(([key, value]) => {
    return typeof value !== 'object' || value === null // Exclude objects (also handles null values)
  })
})


const onPointClick = (feature) => {
  console.log('onPointClick', feature)
  PointInfowindow.value = true
  gmapCenter.value = feature.paths
    ? feature.paths[0]
    : feature.path
      ? feature.path[Math.floor(feature.path.length / 2)]
      : feature.position || { lat: 0, lng: 0 }
  selectedFeature.value = {
    ...feature,
    properties: Object.fromEntries(
      Object.entries(feature.properties).filter(([_, value]) => value)
    )
  }
}


const closePopup = () => {
  console.log('close popup')
  infowindow.value = false
  PointInfowindow.value = false
}

const parcelsVisible = ref(true)
const toggleParcels = (visible: boolean) => {
  parcelsVisible.value = visible
}

const parcelLabelsVisible = ref(false)
const toggleParcelLabels = (visible: boolean) => {
  parcelLabelsVisible.value = visible
}

const roadsVisible = ref(true)
const toggleRoads = (visible: boolean) => {
  roadsVisible.value = visible
}

const settVisibile = ref(true)
const toggleSettlement = (visible: boolean) => {
  settVisibile.value = visible
}

 

 

const WPVisible = ref(true)
const toggleWP = (visible: boolean) => {
  WPVisible.value = visible
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
  if (!mapReady.value || !mapRef.value?.map) return;

  // Define grayscale map style
  const grayscaleStyle = [
    {
      stylers: [{ saturation: -100 }]
    }
  ];

  // Define dark mode map style
  const darkModeStyle = [
    { elementType: 'geometry', stylers: [{ color: '#212121' }] }, // Dark background
    { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] }, // Light gray labels
    { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] }, // Dark stroke for contrast
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
  ];

  // Create grayscale StyledMapType
  const grayscaleMapType = new google.maps.StyledMapType(grayscaleStyle, {
    name: 'Grayscale'
  });

  // Create dark mode StyledMapType
  const darkModeMapType = new google.maps.StyledMapType(darkModeStyle, {
    name: 'Dark Mode'
  });

  // Register map types
  mapRef.value.map.mapTypes.set('grayscale', grayscaleMapType);
  mapRef.value.map.mapTypes.set('dark', darkModeMapType);

  // Create the select element
  const controlDiv = document.createElement('div');
  const controlSelect = document.createElement('select');

  // Style the select element
  controlDiv.style.padding = '5px';
  controlDiv.style.backgroundColor = 'white';
  controlDiv.style.border = '1px solid #ccc';
  controlDiv.style.borderRadius = '2px';
  controlDiv.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3)';
  controlSelect.style.fontSize = '14px';
  controlSelect.style.padding = '2px';
  controlSelect.style.margin = '5px';

  // Define map type options
  const mapTypes = [
    { id: 'roadmap', label: 'Map' },
    { id: 'satellite', label: 'Satellite' },
    { id: 'hybrid', label: 'Hybrid' },
    { id: 'terrain', label: 'Terrain' },
    { id: 'grayscale', label: 'Grayscale' },
    { id: 'dark', label: 'Dark Mode' }
  ];

  // Add options to the select element
  mapTypes.forEach((type) => {
    const option = document.createElement('option');
    option.value = type.id;
    option.text = type.label;
    if (type.id === mapRef.value.map.getMapTypeId()) {
      option.selected = true;
    }
    controlSelect.appendChild(option);
  });

  // Event listener to change map type
  controlSelect.addEventListener('change', () => {
    mapRef.value.map.setMapTypeId(controlSelect.value);
  });

  // Append select to div
  controlDiv.appendChild(controlSelect);

  // Add control to map (TOP_LEFT position)
  mapRef.value.map.controls[google.maps.ControlPosition.TOP_LEFT].push(controlDiv);
}




 
 
const getSettlementBbox = () => {

  console.log(features.value)
  if (!features.value?.features?.length) return null;

  const featureCollection = turf.featureCollection(features.value.features);
  const bbox = turf.bbox(featureCollection);

  console.log('bbox',bbox)

  return {
    minLng: bbox[0],
    minLat: bbox[1],
    maxLng: bbox[2],
    maxLat: bbox[3]
  };
};


  


//const xgeoserverUrl = 'http://localhost:8080/geoserver'
const geoserverUrl = 'https://kesmis.go.ke/geoserver'

const xgetWmsUrl = async (bbox: {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}) => {
  console.log('inside getWmsUrl');

  
  const capabilitiesUrl = geoserverUrl + '/kisip/ows?service=wms&request=GetCapabilities';

  // Fetch WMS capabilities
  const response = await axios.get(capabilitiesUrl);
  const xml = response.data;

  const parser = new XMLParser();
  const json = parser.parse(xml);

  // Extract layer info
  console.log(json.WMS_Capabilities.Capability)
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
  }));

  console.log('Parsed layers:', glayers);

  const imageUrls: string[] = [];

  for (const layer of glayers) {
    const { name, bbox: layerBbox } = layer;

    // Check if layer intersects with given bbox
    const intersects =
      bbox.minLng < layerBbox.maxx &&
      bbox.maxLng > layerBbox.minx &&
      bbox.minLat < layerBbox.maxy &&
      bbox.maxLat > layerBbox.miny;

    if (intersects) {
      const params = new URLSearchParams({
        service: 'WMS',
        version: '1.1.0',
        request: 'GetMap',
        layers: name,
        styles: '',
        bbox: `${bbox.minLng},${bbox.minLat},${bbox.maxLng},${bbox.maxLat}`,
        width: '1024',
        height: '1024',
        srs: 'EPSG:4326',
        format: 'image/png',
        transparent: 'true'
      });

      imageUrls.push( 'kisip:'+name);
    }
  }

  return imageUrls;
};


const getWmsUrl = async (bbox: {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}) => {
  console.log('inside getWmsUrl');

  try {
    const capabilitiesUrl = geoserverUrl + '/kisip/ows?service=wms&request=GetCapabilities';

    // Fetch WMS capabilities
    const response = await axios.get(capabilitiesUrl);
    const xml = response.data;

    const parser = new XMLParser();
    const json = parser.parse(xml);

    // Extract layer info
    console.log(json.WMS_Capabilities.Capability);
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
    }));

    console.log('Parsed layers:', glayers);

    const imageUrls: string[] = [];

    for (const layer of glayers) {
      const { name, bbox: layerBbox } = layer;

      // Check if layer intersects with given bbox
      const intersects =
        bbox.minLng < layerBbox.maxx &&
        bbox.maxLng > layerBbox.minx &&
        bbox.minLat < layerBbox.maxy &&
        bbox.maxLat > layerBbox.miny;

      if (intersects) {
        const params = new URLSearchParams({
          service: 'WMS',
          version: '1.1.0',
          request: 'GetMap',
          layers: name,
          styles: '',
          bbox: `${bbox.minLng},${bbox.minLat},${bbox.maxLng},${bbox.maxLat}`,
          width: '1024',
          height: '1024',
          srs: 'EPSG:4326',
          format: 'image/png',
          transparent: 'true'
        });

        imageUrls.push('kisip:' + name);
      }
    }

    return imageUrls;

  } catch (error) {
    // Log the error to the console
    console.error('Error occurred while fetching WMS URL:', error);
    return []; // Return an empty array in case of error
  }
};

 

 
// Layer handling
const availableImageryLayers = ref<string[]>([]);
const selectedImageryLayers = ref<string[]>([]);
const imageryLayerObjects = ref<Record<string, google.maps.ImageMapType>>({});

// Add WMS layers (but don't add them to map yet)
const addWmsLayer = async () => {
  const bbox = getSettlementBbox();
  const layerList = await getWmsUrl(bbox);

  if (!layerList || !mapRef.value?.map) return;

  availableImageryLayers.value = layerList;
  imageryLayerObjects.value = {};

  const wmsBaseUrl = geoserverUrl + '/kisip/wms';

  layerList.forEach(layerName => {
    const wmsLayer = new google.maps.ImageMapType({
      getTileUrl(coord, zoom) {
        const tileSize = 256;
        const proj = mapRef.value!.map.getProjection();
        const scale = 1 << zoom;

        const nwPoint = new google.maps.Point(coord.x * tileSize / scale, coord.y * tileSize / scale);
        const sePoint = new google.maps.Point((coord.x + 1) * tileSize / scale, (coord.y + 1) * tileSize / scale);

        const nw = proj.fromPointToLatLng(nwPoint);
        const se = proj.fromPointToLatLng(sePoint);

        const bbox = [nw.lng(), se.lat(), se.lng(), nw.lat()].join(',');

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
        });

        return `${wmsBaseUrl}?${params.toString()}`;
      },
      tileSize: new google.maps.Size(256, 256),
      maxZoom: 22,
      minZoom: 0,
      name: `Drone: ${layerName}`,
      opacity: 0.8
    });

    imageryLayerObjects.value[layerName] = wmsLayer;
  });

  mapLoading.value=false
  
};

// Toggle visibility of a single layer
const toggleImagery = (layerName: string, visible: boolean) => {
  const map = mapRef.value?.map;
  if (!map) return;

  const layerObj = imageryLayerObjects.value[layerName];
  if (!layerObj) return;

  const layers = map.overlayMapTypes;
  const currentLayers = layers.getArray();
  const index = currentLayers.indexOf(layerObj);

  if (visible && index === -1) {
    layers.push(layerObj);
  } else if (!visible && index !== -1) {
    layers.removeAt(index);
  }
};

// Toggle all visible layers from checkbox group
const toggleImageryGroup = (selected: string[]) => {
  availableImageryLayers.value.forEach(layer => {
    const isSelected = selected.includes(layer);
    toggleImagery(layer, isSelected);
  });
};


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


// Add refs for animation
const circleOpacity = ref(0.5); // Initial opacity
const circleRadius = ref(4); // Initial radius

// Function to start the blinking animation
const startBlinking = () => {
  let increasing = true;
  const interval = setInterval(() => {
    if (increasing) {
      circleOpacity.value = Math.min(circleOpacity.value + 0.1, 0.8); // Increase opacity
      circleRadius.value = Math.min(circleRadius.value + 2, 30); // Slightly increase radius
    } else {
      circleOpacity.value = Math.max(circleOpacity.value - 0.1, 0.3); // Decrease opacity
      circleRadius.value = Math.max(circleRadius.value - 2, 20); // Decrease radius
    }
    increasing = !increasing;
  }, 500); // Adjust timing (500ms for each phase)

  // Optional: Stop after 10 seconds
  setTimeout(() => {
    clearInterval(interval);
    circleOpacity.value = 0.5; // Reset to default
    circleRadius.value = 20; // Reset to default
  }, 10000); // Stop after 10 seconds
};

// Start blinking when user location is set
watch(userLocation, (newLocation) => {
  if (newLocation) {
    startBlinking();
  }
});

</script>

<template>
  <ElCard class="box-card">
    <template #header>
      <div class="card-header">
        <ElButton type="primary" plain :icon="Back" @click="goBack">Back</ElButton>
        <h1>{{ title.replace('_', ' ') }} Settlement</h1>
        <div>
          <ElButton type="success" @click="editSettlement">
            <Icon :size="24" icon="uil:edit" />
          </ElButton>
          <ElButton type="primary" @click="downloadGeoJSON">
            <Icon :size="24" icon="ic:sharp-file-download" />
          </ElButton>
        </div>
      </div>
    </template>

    <div class="map-container" v-loading="mapLoading">
      <GoogleMap
ref="mapRef" :api-key="googleMapsApiKey" style="width: 100%; height: 75vh" :center="gmapCenter"
        :zoom="8" map-type-id="grayscale"  :map-type-control="false">
         <template v-if="OtherPointVisible">
          <template v-for="pnt in other_points" :key="pnt.id">
            <Marker v-if="pnt.type === 'marker'" :options="pnt"  @click="onPointClick(pnt)"  />
            <Polyline v-else-if="pnt.type === 'polyline'" :options="pnt" @click="onPointClick(pnt)" />
            <Polygon v-else-if="pnt.type === 'polygon'" :options="pnt"  @click="onPointClick(pnt)"/>
          </template>
        </template>

        <Circle
          v-if="userLocation"
          :options="{
            center: userLocation,
            radius: 4,
            fillColor: '#4285F4',
            fillOpacity: 0.5,
            strokeColor: '#4285F4',
            strokeOpacity: 1,
            strokeWeight: 2
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
 
 
 

        <InfoWindow v-if="infowindow" @closeclick="closePopup" :options="{ position: gmapCenter }">
          <div style="max-width: 400px; height:250px">
            <el-table :data="Object.entries(selectedFeature?.properties || {})" border style="width: 100;">
              <el-table-column prop="0" label="Property" width="150" />
              <el-table-column prop="1" label="Value" width="250" />
            </el-table>
          </div>
        </InfoWindow>


        <InfoWindow v-if="PointInfowindow" @closeclick="closePopup" :options="{ position: gmapCenter }">
            <div style="max-width: 400px; height:250px">
              <!-- Centered and Uppercased Header -->
              <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px; text-align: center; text-transform: uppercase;">
                {{ (selectedFeature?.properties?.featureType || 'Unknown Feature').replace(/_/g, ' ') }}
              </div>


              <!-- Table displaying the properties -->
              <el-table :data="filteredProperties" border style="width: 100%;">
                <el-table-column prop="0" label="Field" width="150" />
                <el-table-column prop="1" label="Value" width="250" />
              </el-table>
            </div>
          </InfoWindow>


        




      </GoogleMap>

      <div id="floating-div">
        <div style="text-align: center; font-weight: bold;">
          <h1 style="margin: 0; font-weight: bold;">KEY</h1>
        </div>
          <ElCollapse accordion>
          <ElCollapseItem title="Parcels" v-if="availableLayers.includes('parcels') || availableLayers.includes('parcelLabels')">
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <ElCheckbox v-if="availableLayers.includes('parcels')" v-model="parcelsVisible" @change="toggleParcels">
                Parcels ({{ layerFeatureCounts.parcels }})
              </ElCheckbox>
              <ElCheckbox v-if="availableLayers.includes('parcelLabels')" v-model="parcelLabelsVisible" @change="toggleParcelLabels">
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

              <ElCheckbox v-if="availableLayers.includes('other_points')" v-model="OtherPointVisible" @change="toggleOtherPoint">
                Facilities ({{ layerFeatureCounts.other_points }})
              </ElCheckbox>

              <div v-for="item in PolyLineItems.filter(item => item.show)" :key="item.label" class="line-item">
                <div class="line-color" :style="{ backgroundColor: item.color }"></div>
                <div class="legend-label">{{ item.label }}</div>
            </div>
              
            <!-- Point Features Legend -->
            <div v-for="item in PointLegendItems.filter(item => item.show)" :key="item.label" class="line-item">
               <img :src="item.icon" class="legend-icon" />
              <div class="legend-label">{{ item.label }}</div>
            </div>


              <ElCheckbox v-if="availableLayers.includes('roads')" v-model="roadsVisible" @change="toggleRoads">
                Roads ({{ layerFeatureCounts.roads }})
              </ElCheckbox>
           
             

              <ElCheckbox v-if="availableLayers.includes('structures')" v-model="StructureVisible" @change="toggleStructure">
                Structures ({{ layerFeatureCounts.structures }})
              </ElCheckbox>
              
                      
        




            </div>
          </ElCollapseItem>

          <ElCollapseItem  v-if="selectedImageryLayers.length>0"  title="Imagery" >
            <ElCheckboxGroup v-model="selectedImageryLayers" @change="toggleImageryGroup">
                <div style="display: flex; flex-direction: column; gap: 2px;">
                    <ElCheckbox
                      v-for="layer in availableImageryLayers"
                      :key="layer"
                      :label="layer"
                    >
                      {{ layer.replace('kisip:', '') }}
                    </ElCheckbox>
                  </div>
            </ElCheckboxGroup>
          </ElCollapseItem>


          <ElCollapseItem title="Settlement" v-if="availableLayers.includes('settlement')">
            <ElCheckbox v-model="settVisibile" @change="toggleSettlement">
              Boundary ({{ layerFeatureCounts.settlement }})
            </ElCheckbox>
          </ElCollapseItem>
        </ElCollapse>
      </div>
    <!-- Add this inside <div class="map-container">, after <GoogleMap> -->
      
      <ElButton  circle  title="Locate Me"   class="geolocate-btn" plain  @click="locateMe">
            <Icon   icon= "mage:location-fill"/>
          </ElButton>

    </div>



  </ElCard>
</template>

<style scoped>
/* Light mode styles */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #333;
}

.map-container {
  position: relative;
  height: 75vh;

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

.dark .el-table--border, .dark .el-table--group {
  border-color: #555;
}

.dark .el-table th, .dark .el-table td {
  border-color: #555;
}


.geolocate-btn {
  position: absolute;
  top: 15px;
  right: 70px;
  z-index: 1000;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

</style>

