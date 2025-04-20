<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElCard, ElButton, ElTable, ElTableColumn, ElMessage, ElCollapse, ElCollapseItem, ElCheckbox, ElCheckboxGroup } from 'element-plus'
import { Back, Download } from '@element-plus/icons-vue'
import { GoogleMap, Polygon, Polyline, Marker, InfoWindow } from 'vue3-google-map'
import * as turf from '@turf/turf'
import { getOneGeo, getfilteredParcelGeo, getfilteredGeo } from '@/api/settlements'
import { Icon } from '@iconify/vue'

const googleMapsApiKey = 'AIzaSyCrzbOkfG52zkAxYPkMvvRMlxE9qHK4uDk'

const route = useRoute()
const router = useRouter()
const mapRef = ref<any>(null)
const title = ref('')
const polygons = ref<any[]>([]) // Settlement boundaries
const parcels = ref<any[]>([]) // Parcel polygons
const parcelLabels = ref<any[]>([]) // Parcel label markers
const facilityPolygons = ref<any[]>([]) // Facility polygons
const facilityPolylines = ref<any[]>([]) // Facility lines
const facilityMarkers = ref<any[]>([]) // Facility points
const infowindow = ref(false)
const selectedFeature = ref(null)
const gmapCenter = ref({ lat: 1.137451, lng: 37.137343 })
const isMapReady = ref(false)
const isLoading = ref(false)
const features = ref([])
const facilityData = ref({})
const facilityLayers = ref<string[]>([])
const filteredLayers = ref<string[]>([])
const parcelsVisible = ref(true)
const parcelLabelsVisible = ref(true)

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
  { label: 'Agricultural', color: '#FDFD96' },
  { label: 'Settlement Boundary', color: '#FF0000' }
]

const parcelGeo = ref()

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
  } catch (error) {
    console.error('Error fetching settlement data:', error)
    ElMessage({ message: 'Failed to load settlement data', type: 'error' })
    features.value = []
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

const fetchFacilityData = async () => {
  try {
    const id = route.params.id
    const models = ['health_facility', 'education_facility', 'road', 'sewer', 'water_point', 'piped_water', 'other_facility']
    for (const model of models) {
      const formData = { model, columnFilterField: 'settlement_id', selectedParents: id, id }
      const res = await getfilteredGeo(formData)
      if (res.data[0]?.json_build_object?.features) {
        facilityData.value[model] = res.data[0].json_build_object
        facilityLayers.value.push(model)
        filteredLayers.value.push(model)
      }
    }
  } catch (error) {
    console.error('Error fetching facility data:', error)
    ElMessage({ message: 'Failed to load facility data', type: 'error' })
  }
}

const processFeatures = () => {
  const featureCollection = { type: 'FeatureCollection', features: features.value }
  const bounds = new google.maps.LatLngBounds()
  polygons.value = []

  // Process settlement boundaries
  featureCollection.features.forEach((feature, index) => {
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
        polygons.value.push({
          id: `settlement-${properties?.id || index}`,
          paths,
          strokeColor: '#FF0000',
          strokeOpacity: 1,
          strokeWeight: 2,
          fillColor: '#FF0000',
          fillOpacity: 0,
          properties: { ...properties }
        })
      })
    }
  })

  // Process parcels
  if (parcelGeo.value) {
    parcels.value = []
    parcelLabels.value = []
    parcelGeo.value.features.forEach((feature: any, index: number) => {
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
          // Add label marker
          const centroid = turf.centroid(feature)
          const [lng, lat] = centroid.geometry.coordinates
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

  // Process facility layers
  facilityPolygons.value = []
  facilityPolylines.value = []
  facilityMarkers.value = []
  for (const model in facilityData.value) {
    facilityData.value[model].features.forEach((feature: any, index: number) => {
      const { geometry, properties } = feature
      const id = `${model}-${properties?.id || index}`
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
          facilityPolygons.value.push({
            id,
            paths,
            strokeColor: 'white',
            strokeOpacity: 1,
            strokeWeight: 1,
            fillColor: 'gray',
            fillOpacity: 0.5,
            properties: { ...properties, layer: model }
          })
        })
      } else if (geometry.type === 'LineString' || geometry.type === 'MultiLineString') {
        let coordinates = geometry.type === 'MultiLineString' ? geometry.coordinates.flat() : geometry.coordinates
        const path = coordinates.map(([lng, lat]) => {
          const point = { lat, lng }
          bounds.extend(point)
          return point
        }).filter((path: { lng: number; lat: number }) => isFinite(path.lng) && isFinite(path.lat))
        facilityPolylines.value.push({
          id,
          path,
          strokeColor: model === 'piped_water' ? 'blue' : model === 'sewer' ? 'purple' : 'red',
          strokeOpacity: 1,
          strokeWeight: 2,
          properties: { ...properties, layer: model }
        })
      } else if (geometry.type === 'Point') {
        const [lng, lat] = geometry.coordinates
        const position = { lat, lng }
        bounds.extend(position)
        facilityMarkers.value.push({
          id,
          position,
          title: properties.name || properties.title || `${model} ${index}`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: model === 'health_facility' ? 'yellow' :
                       model === 'education_facility' ? 'green' :
                       model === 'road' ? 'red' :
                       model === 'sewer' ? 'purple' :
                       model === 'water_point' ? 'blue' :
                       model === 'piped_water' ? 'blue' : 'gray',
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 2
          },
          properties: { ...properties, layer: model }
        })
      }
    })
  }

  if (polygons.value.length || parcels.value.length || facilityPolygons.value.length || facilityPolylines.value.length || facilityMarkers.value.length) {
    mapRef.value?.map.fitBounds(bounds, { padding: 100 })
  }
  console.log('Processed Data:', { polygons, parcels, parcelLabels, facilityPolygons, facilityPolylines, facilityMarkers })
}

// Computed properties for filtered facility layers
const filteredFacilityPolygons = computed(() => {
  return facilityPolygons.value.filter(polygon => filteredLayers.value.includes(polygon.properties.layer))
})

const filteredFacilityPolylines = computed(() => {
  return facilityPolylines.value.filter(polyline => filteredLayers.value.includes(polyline.properties.layer))
})

const filteredFacilityMarkers = computed(() => {
  return facilityMarkers.value.filter(marker => filteredLayers.value.includes(marker.properties.layer))
})

const onFeatureClick = (feature: any) => {
  infowindow.value = true
  selectedFeature.value = {
    ...feature,
    properties: Object.fromEntries(
      Object.entries(feature.properties).filter(([_, value]) => value !== null && value !== undefined)
    )
  }
  gmapCenter.value = feature.paths ? feature.paths[0] :
                     feature.path ? feature.path[Math.floor(feature.path.length / 2)] :
                     feature.position || { lat: 0, lng: 0 }
}

const closePopup = () => {
  infowindow.value = false
}

const downloadGeoJSON = () => {
  ElMessage({ message: 'Downloading GeoJSON...', type: 'warning' })
  const allFeatures = [
    ...polygons.value.map(p => ({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [p.paths.map((p: { lat: number; lng: number }) => [p.lng, p.lat])] },
      properties: p.properties
    })),
    ...parcels.value.map(p => ({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [p.paths.map((p: { lat: number; lng: number }) => [p.lng, p.lat])] },
      properties: p.properties
    })),
    ...facilityPolygons.value.map(p => ({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [p.paths.map((p: { lat: number; lng: number }) => [p.lng, p.lat])] },
      properties: p.properties
    })),
    ...facilityPolylines.value.map(p => ({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: p.path.map((p: { lat: number; lng: number }) => [p.lng, p.lat]) },
      properties: p.properties
    })),
    ...facilityMarkers.value.map(m => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [m.position.lng, m.position.lat] },
      properties: m.properties
    }))
  ]
  const collection = turf.featureCollection(allFeatures)
  const jsonString = JSON.stringify(collection, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const link = document.createElement('a')
  link.download = `${title.value}.geojson`
  link.href = window.URL.createObjectURL(blob)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const toggleParcels = (visible: boolean) => {
  parcelsVisible.value = visible
}

const toggleParcelLabels = (visible: boolean) => {
  parcelLabelsVisible.value = visible
}

const toggleFacilityLayers = (selectedLayers: string[]) => {
  filteredLayers.value = selectedLayers
}

const goBack = () => router.back()

const editSettlement = () => {
  router.push({ name: 'AddSettlementX', query: { id: route.params.id } })
}

onMounted(async () => {
  await fetchSettlementData()
  const parcelData = await fetchParcels()
  parcelGeo.value = parcelData
  await fetchFacilityData()
  processFeatures()
})

watch(() => mapRef.value?.ready, (ready) => {
  if (ready) {
    isMapReady.value = true
    processFeatures()
  }
})

watch([features, parcelGeo, facilityData], () => {
  if (isMapReady.value) {
    processFeatures()
  }
}, { deep: true })
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
      <GoogleMap
        ref="mapRef"
        :api-key="googleMapsApiKey"
        style="width: 100%; height: 75vh"
        :center="gmapCenter"
        :zoom="8"
        map-type-id="roadmap"
      >
        <Polygon
          v-for="polygon in polygons"
          :key="polygon.id"
          :paths="polygon.paths"
          :options="{
            strokeColor: polygon.strokeColor,
            strokeOpacity: polygon.strokeOpacity,
            strokeWeight: polygon.strokeWeight,
            fillColor: polygon.fillColor,
            fillOpacity: polygon.fillOpacity
          }"
          @click="onFeatureClick(polygon)"
        />
        <template v-if="parcelsVisible">
          <Polygon
            v-for="parcel in parcels"
            :key="parcel.id"
            :paths="parcel.paths"
            :options="{
              strokeColor: parcel.strokeColor,
              strokeOpacity: parcel.strokeOpacity,
              strokeWeight: parcel.strokeWeight,
              fillColor: parcel.fillColor,
              fillOpacity: parcel.fillOpacity
            }"
            @click="onFeatureClick(parcel)"
          />
        </template>
        <template v-if="parcelLabelsVisible">
          <Marker
            v-for="label in parcelLabels"
            :key="label.id"
            :position="label.position"
            :label="{ text: label.label, color: 'white', fontSize: '14px' }"
            @click="onFeatureClick(label)"
          />
        </template>
        <Polygon
          v-for="polygon in filteredFacilityPolygons"
          :key="polygon.id"
          :paths="polygon.paths"
          :options="{
            strokeColor: polygon.strokeColor,
            strokeOpacity: polygon.strokeOpacity,
            strokeWeight: polygon.strokeWeight,
            fillColor: polygon.fillColor,
            fillOpacity: polygon.fillOpacity
          }"
          @click="onFeatureClick(polygon)"
        />
        <Polyline
          v-for="polyline in filteredFacilityPolylines"
          :key="polyline.id"
          :path="polyline.path"
          :options="{
            strokeColor: polyline.strokeColor,
            strokeOpacity: polyline.strokeOpacity,
            strokeWeight: polyline.strokeWeight
          }"
          @click="onFeatureClick(polyline)"
        />
        <Marker
          v-for="marker in filteredFacilityMarkers"
          :key="marker.id"
          :position="marker.position"
          :title="marker.title"
          :icon="marker.icon"
          @click="onFeatureClick(marker)"
        />
        <InfoWindow v-if="infowindow" @closeclick="closePopup" :options="{ position: gmapCenter }">
          <div style="max-width: 400px; height: 250px">
            <el-table :data="Object.entries(selectedFeature?.properties || {})" border style="width: 100%;">
              <el-table-column prop="0" label="Property" width="150" />
              <el-table-column prop="1" label="Value" width="250">
                <template #default="{ row }">
                  {{ row[1] ?? 'N/A' }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </InfoWindow>
      </GoogleMap>

      <div id="floating-div">
        <ElCollapse>
          <ElCollapseItem title="Parcels">
            <ElCheckbox v-model="parcelsVisible" @change="toggleParcels">Parcels</ElCheckbox>
            <div v-for="item in legendItems.slice(0, -1)" :key="item.label" class="legend-item">
              <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
              <div class="legend-label">{{ item.label }}</div>
            </div>
            <ElCheckbox v-model="parcelLabelsVisible" @change="toggleParcelLabels">Labels</ElCheckbox>
          </ElCollapseItem>
          <ElCollapseItem title="Overlays">
            <ElCheckboxGroup v-model="filteredLayers" @change="toggleFacilityLayers">
              <ElCheckbox v-for="item in facilityLayers" :key="item" :label="item">{{ item }}</ElCheckbox>
            </ElCheckboxGroup>
          </ElCollapseItem>
          <ElCollapseItem title="Settlement">
            <div class="legend-item">
              <div class="legend-color" :style="{ backgroundColor: '#FF0000' }"></div>
              <div class="legend-label">Settlement Boundary</div>
            </div>
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
  top: 10px;
  left: 10px;
  background-color: white;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  z-index: 10;
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

.legend-label {
  font-size: 14px;
}
</style>