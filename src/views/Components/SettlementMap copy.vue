<!-- SettlementMap.vue -->
<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElCard, ElButton, ElTable, ElTableColumn, ElMessage, ElCollapse, ElCollapseItem, ElCheckbox, ElCheckboxGroup } from 'element-plus'
import { Back, Download } from '@element-plus/icons-vue'
import { GoogleMap, Polygon, InfoWindow, Marker, Polyline, Circle } from 'vue3-google-map'
import * as turf from '@turf/turf'
import { getOneGeo, getfilteredParcelGeo, getfilteredGeo } from '@/api/settlements'

import { Icon } from '@iconify/vue'
import axios from 'axios'
import { XMLParser } from 'fast-xml-parser'
import { useAppStore } from '@/store/modules/app'

// Props
defineProps<{
  settlementId: string // ID of the settlement to display
}>()

// Emits
const emit = defineEmits<{
  (e: 'go-back'): void
  (e: 'edit-settlement', id: string): void
}>()

const appStore = useAppStore()
const googleMapsApiKey = 'AIzaSyCrzbOkfG52zkAxYPkMvvRMlxE9qHK4uDk'

const route = useRoute()
const router = useRouter()
const mapRef = ref<any>(null)
const title = ref('')
const mapReady = ref(false)

// Geo data
const features = ref([])
const parcelGeoData = ref<any[]>([])
const roadGeoData = ref<any[]>([])
const wpGeoData = ref<any[]>([])
const structureGeoData = ref<any[]>([])
const otherPointsGeoData = ref<any[]>([])

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
      borderTop: '4px solid #A9A9A9',
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
      borderTop: '2px dashed green',
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
      borderTop: '2px dotted #4B0082',
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
      borderTop: '2px dotted #00BFFF',
      width: '40px',
      height: '0',
    },
    show: false,
  },
])

// Fetch functions (unchanged from original)
const fetchSettlementData = async () => {
  isLoading.value = true
  try {
    const formData = { model: 'settlement', id: props.settlementId }
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

// ... (Include other fetch functions: fetchParcels, fetchRoads, fetchStructures, fetchPointGeoFeatures)
// Note: Replace `route.params.id` with `props.settlementId` in these functions

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
  const features = polygons.value.map((polygon) => ({
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [polygon.paths.map((p: { lat: number; lng: number }) => [p.lng, p.lat])],
    },
    properties: polygon.properties,
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

const goBack = () => {
  emit('go-back')
}

const editSettlement = () => {
  emit('edit-settlement', props.settlementId)
}

// ... (Include remaining logic: loadSelectedLayers, setupMapTypeControl, getSettlementBbox, getWmsUrl, addWmsLayer, toggleImagery, toggleImageryGroup, locateMe, etc.)

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
            strokeWeight: 0.5,
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
        strokeColor: "#FF0000", // Asphalt gray
        strokeOpacity: 1,
        strokeWeight: 4,
       },
      powerline: {
        strokeOpacity: 0,
        icons: [{
          icon: {
            path: "M 0,-1 0,1",
            strokeOpacity: 1,
            scale: 1,
            strokeWeight: 3,  
            strokeColor: "green", // Yellow
          },
          offset: "0",
          repeat: "10px"
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
            scale: 1,
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
          strokeWeight: 1,
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


// Note: Ensure all functions referencing `route.params.id` use `props.settlementId` instead
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
        ref="mapRef"
        :api-key="googleMapsApiKey"
        style="width: 100%; height: 75vh"
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
          <ElCollapseItem v-if="selectedImageryLayers.length > 0" title="Imagery">
            <ElCheckboxGroup v-model="selectedImageryLayers" @change="toggleImageryGroup">
              <div style="display: flex; flex-direction: column; gap: 2px;">
                <ElCheckbox v-for="layer in availableImageryLayers" :key="layer" :label="layer">
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

      <ElButton circle title="Locate Me" class="geolocate-btn" plain @click="locateMe">
        <Icon icon="mage:location-fill" />
      </ElButton>
    </div>
  </ElCard>
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
</style>