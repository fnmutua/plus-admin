<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElCard, ElButton, ElTable, ElTableColumn, ElMessage, ElCollapse, ElCollapseItem, ElCheckbox, ElCheckboxGroup } from 'element-plus'
import { Back, Download } from '@element-plus/icons-vue'
import { GoogleMap, Polygon, InfoWindow, Marker, CustomMarker, MarkerCluster, Polyline } from 'vue3-google-map'
 
import * as turf from '@turf/turf'
import { getOneGeo, getfilteredParcelGeo, getfilteredGeo } from '@/api/settlements'
import { Icon } from '@iconify/vue'
import axios from 'axios';

import { XMLParser } from 'fast-xml-parser';



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
const hospitalGeoData = ref<any[]>([])
const schoolGeoData = ref<any[]>([])
const wpGeoData = ref<any[]>([])
const structureGeoData = ref<any[]>([])
const otherPointsGeoData = ref<any[]>([])

// to hold paths
const polygons = ref<any[]>([])
const parcels = ref<any[]>([])
const parcelLabels = ref<any[]>([])
const roads = ref<any[]>([])
const hospitals = ref<any[]>([])
const schools = ref<any[]>([])
const water_points = ref<any[]>([])
const structures = ref<any[]>([])
const other_points = ref<any[]>([])

const isLoading = ref(false)

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
  { label: 'Residential', color: '#8C675D' },
  { label: 'Industrial', color: '#800080' },
  { label: 'Education', color: '#F6C567' },
  { label: 'Recreation', color: '#6FDC6E' },
  { label: 'Public Purpose', color: '#FFFF00' },
  { label: 'Commercial', color: '#FF1D1E' },
  { label: 'Public Utility', color: '#73B2FF' },
  { label: 'Transportation', color: '#DCDCDC' },
  { label: 'Undeveloped', color: '#FDFD96' },
  { label: 'Agricultural', color: '#FDFD96' }
]

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
    const formData = { model: 'parcel', columnFilterField: 'settlement_id', selectedParents: id, filtredGeoIds: [id] }
    const res = await getfilteredParcelGeo(formData)
    if (res.data[0]?.json_build_object?.features) {
      return turf.featureCollection(res.data[0].json_build_object.features)
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
    const formData = { model: 'road', columnFilterField: 'settlement_id', selectedParents: id, filtredGeoIds: [id] }
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

const fetchHospitals = async () => {
  try {
    const id = route.params.id
    const formData = { model: 'health_facility', columnFilterField: 'settlement_id', selectedParents: id, filtredGeoIds: [id] }
    const res = await getfilteredParcelGeo(formData)
    if (res.data[0]?.json_build_object?.features) {
      return turf.featureCollection(res.data[0].json_build_object.features)
    }
    return null
  } catch (error) {
    console.error('Error fetching hospital data:', error)
    ElMessage({ message: 'Failed to load hospital data', type: 'error' })
    return null
  }
}

const fetchSchools = async () => {
  try {
    const id = route.params.id
    const formData = { model: 'education_facility', columnFilterField: 'settlement_id', selectedParents: id, filtredGeoIds: [id] }
    const res = await getfilteredParcelGeo(formData)
    if (res.data[0]?.json_build_object?.features) {
      return turf.featureCollection(res.data[0].json_build_object.features)
    }
    return null
  } catch (error) {
    console.error('Error fetching school data:', error)
    ElMessage({ message: 'Failed to load school data', type: 'error' })
    return null
  }
}

const fetchWaterpoints = async () => {
  try {
    const id = route.params.id
    const formData = { model: 'water_point', columnFilterField: 'settlement_id', selectedParents: id, filtredGeoIds: [id] }
    const res = await getfilteredParcelGeo(formData)
    console.log('WPS.....')
    if (res.data[0]?.json_build_object?.features) {
      return turf.featureCollection(res.data[0].json_build_object.features)
    }
    return null
  } catch (error) {
    console.error('Error fetching water_point data:', error)
    ElMessage({ message: 'Failed to load water_point data', type: 'error' })
    return null
  }
}


const fetchStructures = async () => {
  try {
    const id = route.params.id
    const formData = { model: 'structure', columnFilterField: 'settlement_id', selectedParents: id, filtredGeoIds: [id] }
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
  const models = ['streetlight', 'crime_hotspot','community_project', 'sewer','piped_water', 'powerline', 'community_hall', 'police_station', 'mast','dumping_site','hazard_zone','road',] // Add more models as needed
  const allFeatures = []

  try {
    for (const model of models) {
      const formData = {
        model,
        columnFilterField: 'settlement_id',
        selectedParents: id
      }

      const res = await getfilteredGeo(formData)

      console.log('fetch data.....', model, res.data)

      const features =
        res?.data?.[0]?.json_build_object?.features ??
        res?.data?.[0]?.[0]?.json_build_object?.features ??
        []

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
      coordinates: [polygon.paths[0].map((p: { lat: number; lng: number }) => [p.lng, p.lat])]
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
  hospitals.value = []
  schools.value = []
  water_points.value = []
  structures.value = []
  other_points.value=[]
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
    other_points:0,
  }

  // Map layer names to their fetch functions and data refs
  const layerConfig = {
    settlement: { fetch: fetchSettlementData, dataRef: features },
    parcels: { fetch: fetchParcels, dataRef: parcelGeoData },
    roads: { fetch: fetchRoads, dataRef: roadGeoData },
    hospitals: { fetch: fetchHospitals, dataRef: hospitalGeoData },
    schools: { fetch: fetchSchools, dataRef: schoolGeoData },
    water_points: { fetch: fetchWaterpoints, dataRef: wpGeoData },
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

  // Process roads
  if (layerConfig.roads.dataRef.value?.features?.length) {
    layerConfig.roads.dataRef.value.features.forEach((feature: any, index: number) => {
      const { geometry, properties } = feature
      if (geometry.type === 'LineString' || geometry.type === 'MultiLineString') {
        let coordinates: number[][] = geometry.coordinates
        if (geometry.type === 'MultiLineString') {
          coordinates = coordinates.flat()
        }
        const path = coordinates.map(([lng, lat]) => {
          const point = { lat, lng }
          bounds.extend(point)
          return point
        }).filter((path: { lng: number; lat: number }) => isFinite(path.lng) && isFinite(path.lat))
        const surfaceType = properties.surface_type ?? ''
        const strokeColor = surfaceType === 'earth' ? '#A0522D' :
          surfaceType === 'Asphalt' ? 'red' :
          surfaceType === 'gravel' ? '#B87333' :
          surfaceType === 'track' ? '#B87333' :
          surfaceType === 'concrete' ? '#A9A9A9' : 'black'
        roads.value.push({
          id: `road-${properties?.id || index}`,
          path,
          strokeColor,
          strokeOpacity: 1,
          strokeWeight: 2,
          properties: { ...properties }
        })
      }
    })
  }

  // Process hospitals
  if (layerConfig.hospitals.dataRef.value?.features?.length) {
    layerConfig.hospitals.dataRef.value.features.forEach((feature: any, index: number) => {
      const { geometry, properties } = feature
      if (geometry.type === 'Point') {
        const [lng, lat] = geometry.coordinates
        const point = { lat, lng }
        bounds.extend(point)
        const category = (properties.registration_status || '').toLowerCase()
        let iconUrl = 'https://maps.google.com/mapfiles/kml/shapes/hospitals.png'
        if (category.includes('1')) {
          iconUrl = 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
        } else if (category.includes('2')) {
          iconUrl = 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png'
        } else if (category.includes('3')) {
          iconUrl = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
        } else if (category.includes('4')) {
          iconUrl = 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png'
        } else if (category.includes('5')) {
          iconUrl = 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
        } else if (category.includes('mission')) {
          iconUrl = 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        } else if (category.includes('private')) {
          iconUrl = 'https://maps.google.com/mapfiles/ms/icons/pink-dot.png'
        }
        hospitals.value.push({
          id: `hospital-${properties?.id || index}`,
          position: point,
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

  // Process schools
  if (layerConfig.schools.dataRef.value?.features?.length) {
    layerConfig.schools.dataRef.value.features.forEach((feature: any, index: number) => {
      const { geometry, properties } = feature
      if (geometry.type === 'Point') {
        const [lng, lat] = geometry.coordinates
        const point = { lat, lng }
        bounds.extend(point)
        const category = (properties.education_category || '').toLowerCase()
        let iconUrl ='public/icons/school.png' 
        if (category.includes('primary')) {
          iconUrl = 'public/icons/school.png' 
        } else if (category.includes('secondary') || category.includes('high')) {
          iconUrl = 'public/icons/school.png' 
        } else if (category.includes('university') || category.includes('college')) {
          iconUrl = 'public/icons/university.png' 
        } else if (category.includes('private')) {
          iconUrl ='public/icons/school.png' 
        } else if (category.includes('special')) {
          iconUrl = 'public/icons/disability.png' 
        }
        schools.value.push({
          id: `school-${properties?.id || index}`,
          position: point,
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

  // Process Water Points
  if (layerConfig.water_points.dataRef.value?.features?.length) {
    layerConfig.water_points.dataRef.value.features.forEach((feature: any, index: number) => {
      const { geometry, properties } = feature
      console.log(feature)
      if (geometry.type === 'Point') {
        const [lng, lat] = geometry.coordinates
        const point = { lat, lng }
        bounds.extend(point)
        const category = (properties.type || '').toLowerCase()
        let iconUrl = 'public/icons/waterdrop.png'
        if (category.includes('public_tap')) {
          iconUrl = 'public/icons/waterwellpump.png'
        } else if (category.includes('borehole')) {
          iconUrl = 'public/icons/watertower.png'
        } else if (category.includes('spring')) {
          iconUrl = 'public/icons/watermill-2.png'
        } else if (category.includes('well')) {
          iconUrl = 'public/icons/waterwell.png'
        }


        


        water_points.value.push({
          id: `wp-${properties?.id || index}`,
          position: point,
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
         
          const fillColor = 'red'  
          structures.value.push({
            id: `parcel-${properties?.structure_id || index}`,
            paths,
            strokeColor: 'white',
            strokeOpacity: 1,
            strokeWeight: 1,
            fillColor,
            fillOpacity: 0.8,
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

    console.log('featureType',featureType)
    const iconMap: Record<string, string> = {
      water_point: 'icons/water.png',
      mast: 'icons/lighthouse-2.png',
      streetlight: 'icons/lighthouse-2.png',
      dumping_site: 'icons/waste-basket.png',
      hazard_zone: 'icons/caution.png',
      police_station: 'icons/caution.png',
    }

    const iconUrl = iconMap[featureType] || 'icons/amphitheater.png'

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

      const lineColorMap = {
          'road': '#007BFF',
          'powerline': '#28a745',
          'sewer': '#dc3545',
          'piped_water': '#ffc107'
        }


      lines.forEach((line, lineIndex) => {
        const path = line.map(([lng, lat]) => {
          const point = { lat, lng }
          bounds.extend(point)
          return point
        })

        other_points.value.push({
          id: `line-${properties?.id || index}-${lineIndex}`,
          type: 'polyline',
          path,
          options: {
            strokeColor:  lineColorMap[featureType] || '#999999', // fallback color
            strokeOpacity: 0.8,
            strokeWeight: 3,
          },
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
  if (polygons.value.length || parcels.value.length || roads.value.length || hospitals.value.length || schools.value.length || water_points.value.length || structures.value.length || other_points.value.length) {
    mapRef.value?.map.fitBounds(bounds)
  }
}

onMounted(async () => {
  // Wait for the GoogleMap component to be ready
  watch(
    () => mapRef.value?.ready,
    async (ready) => {
      if (ready) {
        mapReady.value = true
        await loadSelectedLayers(['settlement', 'parcels', 'roads', 'hospitals', 'schools','other_points',   'water_points', 'structures'])
          setupMapTypeControl()
        await addWmsLayer()
         // Optional: preload everything on first load
          selectedImageryLayers.value = [...availableImageryLayers.value];
          toggleImageryGroup(selectedImageryLayers.value);

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
  if (layerFeatureCounts.value.hospitals > 0) layers.push('hospitals')
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

const closePopup = () => {
  console.log('close popup')
  infowindow.value = false
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

const hospitalVisible = ref(true)
const toggleHospital = (visible: boolean) => {
  hospitalVisible.value = visible
}

const schoolVisible = ref(true)
const toggleSchool = (visible: boolean) => {
  schoolVisible.value = visible
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

  // Create grayscale StyledMapType
  const grayscaleMapType = new google.maps.StyledMapType(grayscaleStyle, {
    name: 'Grayscale'
  });

  // Register grayscale map type
  mapRef.value.map.mapTypes.set('grayscale', grayscaleMapType);



  // Create the select element
  const controlDiv = document.createElement('div');
  const controlSelect = document.createElement('select');

  // Style the select element (similar to Google example)
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
    { id: 'grayscale', label: 'Grayscale' }
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

  // Add control to map (TOP_RIGHT position)
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

const getWmsUrl = async (bbox: {
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

    <div class="map-container">
      <GoogleMap ref="mapRef" :api-key="googleMapsApiKey" style="width: 100%; height: 75vh" :center="gmapCenter"
        :zoom="8" map-type-id="grayscale"  :map-type-control="false">


        
      


        <template v-if="OtherPointVisible">
          <template v-for="pnt in other_points" :key="pnt.id">
            <Marker v-if="pnt.type === 'marker'" :options="pnt"  />
            <Polyline v-else-if="pnt.type === 'polyline'" :options="pnt" />
            <Polygon v-else-if="pnt.type === 'polygon'" :options="pnt" />
          </template>
        </template>


 

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
          <Polyline v-for="road in roads" :key="road.id" :options="road" />
        </div>

        <div v-if="hospitalVisible">
          <Marker v-for="hospital in hospitals" :key="hospital.id" :options="hospital" />
        </div>

        <div v-if="schoolVisible">
          <Marker v-for="school in schools" :key="school.id" :options="school" />
        </div>

        <div v-if="WPVisible">
          <Marker v-for="wp in water_points" :key="wp.id" :options="wp" />
        </div>




        <InfoWindow v-if="infowindow" @closeclick="closePopup" :options="{ position: gmapCenter }">
          <div style="max-width: 400px; height:250px">
            <el-table :data="Object.entries(selectedFeature?.properties || {})" border style="width: 100;">
              <el-table-column prop="0" label="Property" width="150" />
              <el-table-column prop="1" label="Value" width="250" />
            </el-table>
          </div>
        </InfoWindow>
      </GoogleMap>

      <div id="floating-div">
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
            <div v-for="item in legendItems" :key="item.label" class="legend-item">
              <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
              <div class="legend-label">{{ item.label }}</div>
            </div>
          </ElCollapseItem>
          <ElCollapseItem title="Layers">
            <div style="display: flex; flex-direction: column; gap: 2px;">

              <ElCheckbox v-if="availableLayers.includes('other_points')" v-model="OtherPointVisible" @change="toggleOtherPoint">
                Other ({{ layerFeatureCounts.other_points }})
              </ElCheckbox>
              
              
              <ElCheckbox v-if="availableLayers.includes('roads')" v-model="roadsVisible" @change="toggleRoads">
                Roads ({{ layerFeatureCounts.roads }})
              </ElCheckbox>
              <ElCheckbox v-if="availableLayers.includes('hospitals')" v-model="hospitalVisible" @change="toggleHospital">
                Hospitals ({{ layerFeatureCounts.hospitals }})
              </ElCheckbox>
              <ElCheckbox v-if="availableLayers.includes('schools')" v-model="schoolVisible" @change="toggleSchool">
                Schools ({{ layerFeatureCounts.schools }})
              </ElCheckbox>
              <ElCheckbox v-if="availableLayers.includes('water_points')" v-model="WPVisible" @change="toggleWP">
                Water Points ({{ layerFeatureCounts.water_points }})
              </ElCheckbox>

              <ElCheckbox v-if="availableLayers.includes('structures')" v-model="StructureVisible" @change="toggleStructure">
                Structures ({{ layerFeatureCounts.structures }})
              </ElCheckbox>
              
                      
        




            </div>
          </ElCollapseItem>

          <ElCollapseItem title="Imagery" >
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
    </div>
  </ElCard>
</template>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.map-container {
  position: relative;
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
  max-width: 500vw;
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
</style>