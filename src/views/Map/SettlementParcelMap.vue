<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElCard, ElButton, ElCheckboxGroup, ElCheckbox, ElCollapse, ElCollapseItem, ElMessage } from 'element-plus'
import { Back, Download } from '@element-plus/icons-vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import * as turf from '@turf/turf'
import { getOneGeo, getfilteredParcelGeo, getfilteredGeo } from '@/api/settlements' // Adjust API import path
import { Icon } from '@iconify/vue'

mapboxgl.accessToken = 'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'

const route = useRoute()
const router = useRouter()
const map = ref<mapboxgl.Map | null>(null)
const title = ref('')
const facilityData = ref({})
const facilityGeoPolygons = ref([])
const parcelGeo = ref()
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
  { label: 'Agricultural', color: '#FDFD96' }
]

// Fetch settlement data
const fetchSettlementData = async () => {
  const id = route.params.id
  const formData = { model: 'settlement', id }
  const res = await getOneGeo(formData)
  title.value = res.data[0].json_build_object.features[0].properties.name
  facilityGeoPolygons.value = res.data[0].json_build_object.features.filter(
    (f: any) => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'
  )
}

// Fetch parcel data
const fetchParcels = async () => {
  const id = route.params.id
  const formData = { model: 'parcel', columnFilterField: 'settlement_id', selectedParents: id, filtredGeoIds: [id] }
  const res = await getfilteredParcelGeo(formData)
  parcelGeo.value = turf.featureCollection(res.data[0].json_build_object.features)
}

// Fetch facility data
const fetchFacilityData = async () => {
  const id = route.params.id
  const models = ['health_facility', 'education_facility', 'road', 'sewer', 'water_point', 'piped_water', 'other_facility']
  for (const model of models) {
    const formData = { model, columnFilterField: 'settlement_id', selectedParents: id, id }
    const res = await getfilteredGeo(formData)
    if (res.data[0].json_build_object.features) {
      facilityData.value[model] = res.data[0].json_build_object
      facilityLayers.value.push(model)
      filteredLayers.value.push(model)
    }
  }
}

// Initialize map
const initMap = () => {
  map.value = new mapboxgl.Map({
    container: 'mapContainer',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [37.137343, 1.137451],
    zoom: 6
  })

  map.value.on('load', () => {
    // Add polygon source and layer
    map.value!.addSource('polygons', { type: 'geojson', data: turf.featureCollection(facilityGeoPolygons.value) })
    map.value!.addLayer({
      id: 'Boundary',
      type: 'line',
      source: 'polygons',
      paint: { 'line-color': 'red', 'line-width': 2, 'line-dasharray': [2, 4] }
    })

    // Add parcel source and layer
    map.value!.addSource('parcels', { type: 'geojson', data: parcelGeo.value })
    map.value!.addLayer({
      id: 'Parcels',
      type: 'fill',
      source: 'parcels',
      paint: {
        'fill-color': [
          'case',
          ['==', ['get', 'landuse_id'], 0], '#8C675D',
          ['==', ['get', 'landuse_id'], 1], '#800080',
          ['==', ['get', 'landuse_id'], 2], '#F6C567',
          ['==', ['get', 'landuse_id'], 3], '#6FDC6E',
          ['==', ['get', 'landuse_id'], 4], '#FFFF00',
          ['==', ['get', 'landuse_id'], 5], '#FF1D1E',
          ['==', ['get', 'landuse_id'], 6], '#73B2FF',
          ['==', ['get', 'landuse_id'], 7], '#DCDCDC',
          ['==', ['get', 'landuse_id'], 8], '#FDFD96',
          ['==', ['get', 'landuse_id'], 9], '#FDFD96',
          'white'
        ],
        'fill-opacity': 0.8,
        'fill-outline-color': 'white'
      }
    })
    map.value!.addLayer({
      id: 'Labels',
      type: 'symbol',
      source: 'parcels',
      layout: { 'text-field': ['get', 'parcel_no'], 'text-size': 14, 'text-offset': [0, 1] },
      paint: { 'text-color': 'white' }
    })

    // Add facility layers
    for (const prop in facilityData.value) {
      map.value!.addSource(prop, { type: 'geojson', data: facilityData.value[prop] })
      const geometryType = facilityData.value[prop].features[0].geometry.type
      if (geometryType === 'Point') {
        map.value!.addLayer({
          id: prop,
          type: 'circle',
          source: prop,
          paint: {
            'circle-radius': 8,
            'circle-stroke-width': 2,
            'circle-color': prop === 'health_facility' ? 'yellow' :
                            prop === 'education_facility' ? 'green' :
                            prop === 'road' ? 'red' :
                            prop === 'sewer' ? 'purple' :
                            prop === 'water_point' ? 'blue' :
                            prop === 'piped_water' ? 'blue' : 'gray',
            'circle-stroke-color': 'white'
          }
        })
      } else if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
        map.value!.addLayer({
          id: prop,
          type: 'line',
          source: prop,
          paint: {
            'line-color': prop === 'piped_water' ? 'blue' : prop === 'sewer' ? 'purple' : 'red',
            'line-width': 2
          }
        })
      } else {
        map.value!.addLayer({
          id: prop,
          type: 'fill',
          source: prop,
          paint: { 'fill-color': 'gray', 'fill-opacity': 0.5, 'fill-outline-color': 'white' }
        })
      }

      // Add click popup for facilities
      map.value!.on('click', prop, (e) => {
        const name = e.features[0].properties.name || e.features[0].properties.title
        new mapboxgl.Popup({ offset: [0, 0] })
          .setLngLat(e.lngLat)
          .setHTML(`<h3>${prop}</h3><p>Name: ${name}</p>`)
          .addTo(map.value!)
      })
    }

    // Add parcel click popup
    map.value!.on('click', 'Parcels', (e) => {
      const parcel_no = e.features[0].properties.parcel_no
      const area = e.features[0].properties.area_ha
      const centroid = turf.centroid(e.features[0])
      new mapboxgl.Popup({ offset: [0, 0] })
        .setLngLat(centroid.geometry.coordinates)
        .setHTML(`<h3>Parcel</h3><p>Number: ${parcel_no}</p><p>Area: ${area.toFixed(4)} Ha</p>`)
        .addTo(map.value!)
    })

    // Fit map to bounds
    const bounds = turf.bbox(turf.featureCollection(facilityGeoPolygons.value))
    map.value!.fitBounds(bounds, { padding: 20, maxZoom: 15 })

    // Add navigation control
    map.value!.addControl(new mapboxgl.NavigationControl(), 'top-right')
  })
}

// Download GeoJSON
const downloadGeoJSON = () => {
  ElMessage({ message: 'Downloading GeoJSON...', type: 'warning' })
  const collection = turf.featureCollection(facilityGeoPolygons.value)
  const jsonString = JSON.stringify(collection, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const link = document.createElement('a')
  link.download = `${title.value}.geojson`
  link.href = window.URL.createObjectURL(blob)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Toggle layer visibility
const toggleLayers = (selectedLayers: string[]) => {
  facilityLayers.value.forEach(layer => {
    map.value!.setLayoutProperty(layer, 'visibility', selectedLayers.includes(layer) ? 'visible' : 'none')
  })
}

// Toggle parcels
const toggleParcels = (visible: boolean) => {
  map.value!.setLayoutProperty('Parcels', 'visibility', visible ? 'visible' : 'none')
}

// Toggle parcel labels
const toggleParcelLabels = (visible: boolean) => {
  map.value!.setLayoutProperty('Labels', 'visibility', visible ? 'visible' : 'none')
}

// Navigate back
const goBack = () => router.back()

// Edit settlement
const editSettlement = () => {
  router.push({ name: 'AddSettlementX', query: { id: route.params.id } })
}

// Initialize on mount
onMounted(async () => {
  await fetchSettlementData()
  await fetchParcels()
  await fetchFacilityData()
  initMap()
})
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
      <div id="mapContainer" class="basemap"></div>
      <div id="floating-div">
        <ElCollapse>
          <ElCollapseItem title="Parcels">
            <ElCheckbox v-model="parcelsVisible" @change="toggleParcels">Parcels</ElCheckbox>
            <div v-for="item in legendItems" :key="item.label" class="legend-item">
              <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
              <div class="legend-label">{{ item.label }}</div>
            </div>
            <ElCheckbox v-model="parcelLabelsVisible" @change="toggleParcelLabels">Labels</ElCheckbox>
          </ElCollapseItem>
          <ElCollapseItem title="Overlays">
            <ElCheckboxGroup v-model="filteredLayers" @change="toggleLayers">
              <ElCheckbox v-for="item in facilityLayers" :key="item" :label="item">{{ item }}</ElCheckbox>
            </ElCheckboxGroup>
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

.basemap {
  width: 100%;
  height: 75vh;
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