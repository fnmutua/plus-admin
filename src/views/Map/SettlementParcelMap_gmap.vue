<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElCard, ElButton,ElTable,ElTableColumn,  ElMessage } from 'element-plus'
import { Back, Download } from '@element-plus/icons-vue'
 import { GoogleMap,Polygon ,InfoWindow, Marker,CustomMarker ,MarkerCluster,Polyline   } from 'vue3-google-map'
 import { centroid } from '@turf/turf';

import * as turf from '@turf/turf'
import { getOneGeo } from '@/api/settlements'
import { Icon } from '@iconify/vue'

const googleMapsApiKey = 'AIzaSyCrzbOkfG52zkAxYPkMvvRMlxE9qHK4uDk'

const route = useRoute()
const router = useRouter()
const mapRef = ref<any>(null)
const title = ref('')
const polygons = ref<any[]>([])
 
const isLoading = ref(false)

const legendItems = [
  { label: 'Settlement Boundary', color: '#FF0000' }
]

const features =ref([])

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

      console.log('paths', paths);

      // Append polygon to the polygons array
      polygons.value.push({
        id: properties?.id || index,
        paths,
        strokeColor: "#FF0000",
        strokeOpacity: 1,
        strokeWeight: 2,
        fillColor: "#FF0000",
        fillOpacity: 0,
        properties: { ...properties }, // Clone properties
      });
    });
  }
});





  // Fit the map to all features
  if (polygons.value.length  ) {
    mapRef.value?.map.fitBounds(bounds);
  }

  console.log({ polygons: polygons.value  });





 

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
  infowindow.value=false
 
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
                :options="polygon"
                @click="onPolygonClick(polygon)"
               />

               <InfoWindow v-if="infowindow" @closeclick="closePopup" :options="{ position: gmapCenter }">
              <div style="max-width: 400px; height:250px">
                <el-table :data="Object.entries(selectedFeature?.properties || {})" border style="width: 100%;">
                  <el-table-column prop="0" label="Property" width="150" />
                  <el-table-column prop="1" label="Value"  width="250"/>
                </el-table>
              </div>
            </InfoWindow>

      </GoogleMap>

      <div id="legend-panel">
        <div v comparing to v-for="item in legendItems" :key="item.label" class="legend-item">
          <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
          <div class="legend-label">{{ item.label }}</div>
        </div>
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

#legend-panel {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 10;
  max-width: 300px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.legend-color {
  width: 24px;
  height: 24px;
  margin-right: 12px;
  border-radius: 4px;
}

.legend-label {
  font-size: 14px;
  color: #333;
}
</style>