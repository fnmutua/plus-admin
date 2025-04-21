<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElCard, ElButton, ElTable, ElTableColumn, ElMessage, ElCollapse, ElCollapseItem, ElCheckbox, ElCheckboxGroup } from 'element-plus'
import { Back, Download } from '@element-plus/icons-vue'
import { GoogleMap, Polygon, InfoWindow, Marker, CustomMarker, MarkerCluster, Polyline } from 'vue3-google-map'
import { centroid } from '@turf/turf';

import * as turf from '@turf/turf'
import { getOneGeo, getfilteredParcelGeo, getfilteredGeo } from '@/api/settlements'

import { Icon } from '@iconify/vue'

const googleMapsApiKey = 'AIzaSyCrzbOkfG52zkAxYPkMvvRMlxE9qHK4uDk'

const route = useRoute()
const router = useRouter()
const mapRef = ref<any>(null)
const title = ref('')


// the gedata 
const features = ref([])
const parcelGeoData = ref<any[]>([])
const roadGeoData = ref<any[]>([])
 const hospitalGeoData  = ref<any[]>([])
 const schoolGeoData  = ref<any[]>([])

// to hold paths
const polygons = ref<any[]>([])
const parcels = ref<any[]>([])
const parcelLabels = ref<any[]>([])
const roads = ref<any[]>([])
  const hospitals = ref<any[]>([])
    const schools = ref<any[]>([])

const isLoading = ref(false)

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




  } catch (error) {
    console.error('Error fetching settlement data:', error)
    ElMessage({ message: 'Failed to load settlement data', type: 'error' })
    polygons.value = []
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
    console.error('Error fetching road data:', error)
    ElMessage({ message: 'Failed to load road data', type: 'error' })
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
    console.error('Error fetching road data:', error)
    ElMessage({ message: 'Failed to load road data', type: 'error' })
    return null
  }
}


const downloadGeoJSON = () => {
  ElMessage({ message: 'Downloading GeoJSON...', type: 'warning' })
  // Reconstruct GeoJSON features from polygons
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


onMounted(async () => {
  await fetchSettlementData()

  parcelGeoData.value = await fetchParcels()
  roadGeoData.value = await fetchRoads()
  hospitalGeoData.value = await fetchHospitals()
  schoolGeoData.value = await fetchSchools()
  
  console.log( 'schoolGeoData.value ', schoolGeoData.value )
  setTimeout(() => {
    loadGoogleMap(); // Load map after a brief delay
  }, 500); // Delay in milliseconds (500 ms = 0.5 seconds)

})



const loadGoogleMap = () => {
  console.log("Google <Map>");

  // Create a FeatureCollection from the array of features
  const featureCollection = {
    type: "FeatureCollection",
    features: features.value,
  };

  // Clear the arrays
  polygons.value = [];


  // Initialize bounds
  const bounds = new google.maps.LatLngBounds();

  // Loop through each feature and extract geometry
  featureCollection.features.forEach((feature, index) => {
    const { geometry, properties } = feature;
    console.log('feature', feature);

    if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
      let coordinates = geometry.coordinates;

      // If it's a MultiPolygon, iterate over each polygon inside the MultiPolygon
      if (geometry.type === "MultiPolygon") {
        coordinates = coordinates.flat(); // Flatten the array to process each polygon
      }

      coordinates.forEach((polygonCoordinates) => {
        // Convert GeoJSON coordinates to Google Maps format
        const paths = polygonCoordinates.map(([lng, lat]) => {
          const point = { lat, lng };
          bounds.extend(point); // Add to bounds
          return point;
        });

        //console.log('paths', paths);

        // Append polygon to the polygons array
        polygons.value.push({
          id: properties?.id || index,
          paths,
          strokeColor: "purple",
          strokeOpacity: 1,
          strokeWeight: 2,
          fillColor: "#FF0000",
          fillOpacity: 0,
          properties: { ...properties }, // Clone properties
        });
      });
    }
  });



  // Process parcels
  if (parcelGeoData.value) {
    parcels.value = []
    parcelLabels.value = []
    parcelGeoData.value.features.forEach((feature: any, index: number) => {
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

          console.log('parcelLabels.value',parcelLabels.value)
        })
      }
    })
  }


  // Process parcels
  if (roadGeoData.value) {

    console.log('roadGeoData.value', roadGeoData.value)
    roads.value = []

    roadGeoData.value.features.forEach((feature: any, index: number) => {
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
        const strokeColor = surfaceType == 'earth' ? '#A0522D' :
          surfaceType == 'Asphalt' ? 'red' :
            surfaceType == 'gravel' ? '#B87333' :
              surfaceType == 'track' ? '#B87333' :
                surfaceType == 'concrete' ? '#A9A9A9' :
                  'black' // default blue



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


   // Process Hospiltas
  if (hospitalGeoData.value) {
  hospitalGeoData.value.features.forEach((feature: any, index: number) => {
    const { geometry, properties } = feature;

    if (geometry.type === 'Point') {
      const [lng, lat] = geometry.coordinates;
      const point = { lat, lng };
      bounds.extend(point);

      // Simple category detection
      const category = (properties.registration_status || '').toLowerCase();

      let iconUrl = 'https://maps.google.com/mapfiles/kml/shapes/hospitals.png'; // default

      if (category.includes('1')) {
        iconUrl = 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';
      } else if (category.includes('2')) {
        iconUrl = 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png';
      } else if (category.includes('3')) {
        iconUrl = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
      } else if (category.includes('4')) {
        iconUrl = 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png';
      } else if (category.includes('5')) {
        iconUrl = 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
      } else if (category.includes('mission')) {
        iconUrl = 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
      } else if (category.includes('private')) {
        iconUrl = 'https://maps.google.com/mapfiles/ms/icons/pink-dot.png';
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
      });


      console.log( 'hospitals.value', hospitals.value)
    }
  });
}



if (schoolGeoData.value) {
  schoolGeoData.value.features.forEach((feature: any, index: number) => {
    const { geometry, properties } = feature;

    if (geometry.type === 'Point') {
      const [lng, lat] = geometry.coordinates;
      const point = { lat, lng };
      bounds.extend(point);

      // Simple category detection based on school level/type
      const category = (properties.education_category  ).toLowerCase();

      let iconUrl = 'https://maps.google.com/mapfiles/kml/shapes/schools.png'; // default school icon

      if (category.includes('primary')) {
        iconUrl = 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
      } else if (category.includes('secondary') || category.includes('high')) {
        iconUrl = 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';
      } else if (category.includes('university') || category.includes('college')) {
        iconUrl = 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png';
      } else if (category.includes('private')) {
        iconUrl = 'https://maps.google.com/mapfiles/ms/icons/pink-dot.png';
      } else if (category.includes('special')) {
        iconUrl = 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
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
      });

      console.log('schools.value', schools.value);
    }
  });
}



  // Fit the map to all features
  if (polygons.value.length) {
    mapRef.value?.map.fitBounds(bounds);
  }

  console.log({ polygons: polygons.value });







};



const infowindow = ref(false); // Will be open when mounted
const selectedFeature = ref(null);
const gmapCenter = ref();

// Function to handle polygon click
const onPolygonClick = (feature) => {
  console.log('onPolygonClick', feature);

  infowindow.value = true;

  // Set the InfoWindow position based on feature type
  gmapCenter.value = feature.paths
    ? feature.paths[0] // If Polygon, use the first coordinate
    : feature.path
      ? feature.path[Math.floor(feature.path.length / 2)] // If LineString, use midpoint
      : feature.position || { lat: 0, lng: 0 }; // If Point, use its position, fallback to default






  selectedFeature.value = feature;

  selectedFeature.value = {
    ...feature,
    properties: Object.fromEntries(
      Object.entries(feature.properties).filter(([_, value]) => value)
    )
  };



};



const closePopup = () => {
  console.log('close popup')
  infowindow.value = false

}

const parcelsVisible = ref(true)
const toggleParcels = (visible: boolean) => {
  parcelsVisible.value = visible
}

const parcelLabelsVisible = ref(true)
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
const toggleSchool= (visible: boolean) => {
  schoolVisible.value = visible
}


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
        :zoom="8" map-type-id="roadmap">

        <div v-if="settVisibile">
          <Polygon v-for="polygon in polygons" :key="polygon.id" :options="polygon" @click="onPolygonClick(polygon)" />
        </div>
        <div v-if="parcelsVisible">
          <Polygon v-for="parcel in parcels" :key="parcel.id" :options="parcel" />
        </div>

        <div v-if="parcelLabelsVisible">
          <Polygon v-for="label in parcelLabels" :key="label.id" :options="label" />
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


        <InfoWindow v-if="infowindow" @closeclick="closePopup" :options="{ position: gmapCenter }">
          <div style="max-width: 400px; height:250px">
            <el-table :data="Object.entries(selectedFeature?.properties || {})" border style="width: 100%;">
              <el-table-column prop="0" label="Property" width="150" />
              <el-table-column prop="1" label="Value" width="250" />
            </el-table>
          </div>
        </InfoWindow>

      </GoogleMap>

      <div id="floating-div">
        <ElCollapse  accordion>
          <ElCollapseItem title="Parcels">
            <div style="display: flex; flex-direction: column; gap: 2px;">
            <ElCheckbox v-model="parcelsVisible" @change="toggleParcels">Parcels</ElCheckbox>
            <ElCheckbox v-model="parcelLabelsVisible" @change="toggleParcelLabels">Labels</ElCheckbox>   
          </div>      
            <div v-for="item in legendItems" :key="item.label" class="legend-item">
              <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
              <div class="legend-label">{{ item.label }}</div>
            </div>
          </ElCollapseItem>
          <ElCollapseItem title="Layers">
            <div style="display: flex; flex-direction: column; gap: 2px;">
                    <ElCheckbox v-model="roadsVisible" @change="toggleRoads">Roads</ElCheckbox>
                    <ElCheckbox v-model="hospitalVisible" @change="toggleHospital">Hospitals</ElCheckbox>
                    <ElCheckbox v-model="schoolVisible" @change="toggleSchool">Schools</ElCheckbox>
                  </div>
           </ElCollapseItem>

          <ElCollapseItem title="Settlement">
            <ElCheckbox v-model="settVisibile" @change="toggleSettlement">Boundary</ElCheckbox>

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