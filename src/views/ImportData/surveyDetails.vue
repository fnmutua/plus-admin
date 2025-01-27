<script setup lang="ts">
import { onMounted, ref, watch ,computed} from 'vue'
import {
  ElButton, ElTabPane, ElTabs, ElCard, ElTable, ElTableColumn, ElSelect,ElOption,ElPagination,ElRow,
} from 'element-plus'
import { useRoute } from 'vue-router'
import { Back } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

// Locally
import '@dafcoe/vue-collapsible-panel/dist/vue-collapsible-panel.css'
import { useAppStore } from '@/store/modules/app'
import DownloadCustom from '@/views/Components/DownloadCustomFields.vue';

import '@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css';
import * as turf from '@turf/turf'
import MapboxDraw from '@mapbox/mapbox-gl-draw';

 
 


import {
  
  getAllSubmissions
} from '@/api/collector'


import "mapbox-layer-switcher/styles.css";
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'


import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'

import { MapboxLayerSwitcherControl, MapboxLayerDefinition } from "mapbox-layer-switcher";
 

 



import { useCache } from '@/hooks/web/useCache'
const { push } = useRouter()




const { wsCache } = useCache()
 
const appStore = useAppStore()

const MapBoxToken = 'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = MapBoxToken;



const route = useRoute()
const loading = ref(true)

 

 


////Configurations //////////////

//// ------------------parameters -----------------------////
 

//// ------------------parameters -----------------------////
 
const projectId = route.params.projectId
const formId = route.params.xmlFormId
const form_name = route.params.form_name

onMounted(async () => {


 
  console.log('')
})


const tableData =ref([]) // Table data extracted from GeoJSON
const tableHeaders =ref([]) // The first five properties
const allProperties =ref([]) // The first five properties
const selectedFields = ref([]); // Ensure it's reactive
const features =ref([])
const  totalItems=ref()
const  disableMap=ref(false)


const getFormData = async () => {
  // Define the formData object with necessary fields
  const formData = {
    project: projectId,
    form: formId,
    token: localStorage.getItem('collectorToken')
  };

  // Set loading state
  /// loading.value = true;

  try {
    // Await the response from getSubmissions
    const response = await getAllSubmissions(formData);

    console.log('Submissions:', response);
 


    // // Parse GeoJSON data
    //   features.value = response.data.features || [];
    // if (features.value.length > 0) {
    //       // Extract the first feature's properties
    //       allProperties.value = features.value[0].properties;
    //       tableHeaders.value = Object.keys(allProperties.value).slice(0, 7); // Use first 10 fields initially

    //       // Initialize selectedFields with the default fields to show
    //       selectedFields.value = tableHeaders.value;

    //       // Map data for the table
    //       tableData.value = features.value.map((feature) => {
    //         const properties = feature.properties;
    //         const row = {};

    //         // Loop through the selected fields and assign values from properties
    //         selectedFields.value.forEach((key) => {
    //           row[key] = properties[key] || "-"; // Set "-" if the property is missing or undefined
    //         });

    //         return row;
    //       });
    //     }

      // Parse GeoJSON data or handle non-GeoJSON results
      if (response.data.features && response.data.features.length > 0) {
        disableMap.value=false

        // If the result is GeoJSON
        features.value = response.data.features;

        // Extract the first feature's properties
        allProperties.value = features.value[0].properties;
        tableHeaders.value = Object.keys(allProperties.value).slice(0, 7); // Use first 7 fields initially

        // Initialize selectedFields with the default fields to show
        selectedFields.value = tableHeaders.value;

        // Map data for the table
        tableData.value = features.value.map((feature) => {
          const properties = feature.properties;
          const row = {};

          // Loop through the selected fields and assign values from properties
          selectedFields.value.forEach((key) => {
            row[key] = properties[key] || "-"; // Set "-" if the property is missing or undefined
          });

          return row;
        });
      } 
      else {
              // If the result is an array of JavaScript objects
              disableMap.value = true;
              features.value = response.data || []; // Assume the data is an array of JavaScript objects

              if (features.value.length > 0) {
                // Extract properties dynamically from the first object
                allProperties.value = features.value[0]; // The first object's properties
                tableHeaders.value = Object.keys(allProperties.value).slice(0, 7); // Use the first 7 properties as headers

                // Initialize selectedFields with the default fields to show
                selectedFields.value = tableHeaders.value;

                // Map data for the table
                tableData.value = features.value.map((item) => {
                  const row = {};
                  selectedFields.value.forEach((key) => {
                    row[key] = item[key] || "-"; // Set "-" if the key is missing or undefined
                  });
                  return row;
                });
              } 
            }





        console.log('tableHeaders',tableHeaders.value)
        loading.value=false

  } catch (error) {
    // Handle errors here
    console.error('Error:', error);
  } finally {
    // Reset loading state
    console.log('test')
  }
};



getFormData()




const router = useRouter()


const goBack = () => {
  // Add your logic to handle the back action
  // For example, you can use Vue Router to navigate back
  if (router) {
    // Use router.back() to navigate back
    router.back()
  } else {
    console.warn('Router instance not available.')
  }


}

const activeName = ref('data')

 

 
 
// Watch for changes in the selected fields and update table data accordingly
watch([selectedFields, features], () => {
  // Ensure features is updated
  console.log('selectedFields',selectedFields.value)
  if (features.value.length > 0) {
    tableData.value = features.value.map((feature) => {
      const properties = feature.properties ? feature.properties:feature;
      const row = {};
      
      // Loop through the selected fields and assign values from properties
      selectedFields.value.forEach((key) => {
        row[key] = properties[key] || "-"; // Set "-" if the property is missing or undefined
      });
      
      return row;
    });
  }
}, { deep: true });




const mobileBreakpoint = 768;
const defaultPageSize = 20;
const mobilePageSize = 5;
const pageSize = ref(10);
const currentPage = ref(1);
const width = ref(1080);


// Computed property for paginated data based on filtered results
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return tableData.value.slice(start, end);
});

// Watch the filtered data to update totalItems and reset the pagination
watch(tableData, (newValue) => {
  totalItems.value = newValue.length; // Update total based on filtered data
 
});




const handlePageChange = (page) => {
  currentPage.value = page;
};


const handlePageSizeChange = (newSize) => {
  pageSize.value = newSize;
  currentPage.value = 1; // Reset to first page when changing page size
};

 







const clickTab = (tab) => {
  console.log('Tab clicked:', tab.props);
  localStorage.setItem('activeTab', tab.props.name);

  if (tab.props.name === 'map') {
    // Delay the loadMap function
    setTimeout(() => {
      loadMap(); // Load map after a brief delay
    }, 500); // Delay in milliseconds (500 ms = 0.5 seconds)
  }


};



let nmap; // Declare the map variable outside the function for scope

 




const draw = new MapboxDraw({
  displayControlsDefault: false,
  controls: {
    point: true,
    line_string: false,
    polygon: true,
    trash: true
  },

})
 

const centroid = ref()



const icon = ref(`<button>  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4.97883 9.68508C2.99294 8.89073 2 8.49355 2 8C2 7.50645 2.99294 7.10927 4.97883 6.31492L7.7873 5.19153C9.77318 4.39718 10.7661 4 12 4C13.2339 4 14.2268 4.39718 16.2127 5.19153L19.0212 6.31492C21.0071 7.10927 22 7.50645 22 8C22 8.49355 21.0071 8.89073 19.0212 9.68508L16.2127 10.8085C14.2268 11.6028 13.2339 12 12 12C10.7661 12 9.77318 11.6028 7.7873 10.8085L4.97883 9.68508Z" fill="#1C274C"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M2 8C2 8.49355 2.99294 8.89073 4.97883 9.68508L7.7873 10.8085C9.77318 11.6028 10.7661 12 12 12C13.2339 12 14.2268 11.6028 16.2127 10.8085L19.0212 9.68508C21.0071 8.89073 22 8.49355 22 8C22 7.50645 21.0071 7.10927 19.0212 6.31492L16.2127 5.19153C14.2268 4.39718 13.2339 4 12 4C10.7661 4 9.77318 4.39718 7.7873 5.19153L4.97883 6.31492C2.99294 7.10927 2 7.50645 2 8Z" fill="#1C274C"></path> <path opacity="0.7" d="M5.76613 10L4.97883 10.3149C2.99294 11.1093 2 11.5065 2 12C2 12.4935 2.99294 12.8907 4.97883 13.6851L7.7873 14.8085C9.77318 15.6028 10.7661 16 12 16C13.2339 16 14.2268 15.6028 16.2127 14.8085L19.0212 13.6851C21.0071 12.8907 22 12.4935 22 12C22 11.5065 21.0071 11.1093 19.0212 10.3149L18.2339 10L16.2127 10.8085C14.2268 11.6028 13.2339 12 12 12C10.7661 12 9.77318 11.6028 7.7873 10.8085L5.76613 10Z" fill="#1C274C"></path> <path opacity="0.4" d="M5.76613 14L4.97883 14.3149C2.99294 15.1093 2 15.5065 2 16C2 16.4935 2.99294 16.8907 4.97883 17.6851L7.7873 18.8085C9.77318 19.6028 10.7661 20 12 20C13.2339 20 14.2268 19.6028 16.2127 18.8085L19.0212 17.6851C21.0071 16.8907 22 16.4935 22 16C22 15.5065 21.0071 15.1093 19.0212 14.3149L18.2339 14L16.2127 14.8085C14.2268 15.6028 13.2339 16 12 16C10.7661 16 9.77318 15.6028 7.7873 14.8085L5.76613 14Z" fill="#1C274C"></path> </g></svg></button>`)

const showSatellite = ref(false)

const toggleFloatingDiv = async () => {
  showSatellite.value = !showSatellite.value;
  console.log('Show Satellite', showSatellite.value);

  // Get the map style
  let style = nmap.getStyle();

  // Get all layers
  let allLayers = style.layers;

  // Log all layers to the console
  console.log('before ', allLayers);



  if (!showSatellite.value) {
    console.log('Remove Satellte');





    if (nmap.getLayer('Satellite')) {
      nmap.removeLayer('Satellite');
      nmap.removeSource('Satellite');

    }


  } else {

    console.log('Add Satellte');



    if (nmap.getLayer('Satellite')) {
      nmap.removeLayer('Satellite');
      nmap.removeSource('Satellite');

    } else {

      icon.value = `<button>  <svg viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="si-glyph si-glyph-satellite" fill="#f20707"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>650</title> <defs> </defs> <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g fill="#fb0e0e"> <path d="M12.495,5.893 C12.832,6.231 14.184,4.877 13.847,4.541 L10.864,1.557 C10.526,1.219 9.174,2.573 9.51,2.909 L12.495,5.893 L12.495,5.893 Z" class="si-glyph-fill"> </path> <path d="M3.288,10.897 C3.072,10.68 2.597,10.802 2.23,11.168 C1.863,11.536 1.742,12.009 1.959,12.228 L3.233,13.501 C3.45,13.719 3.922,13.597 4.289,13.23 C4.658,12.864 4.779,12.388 4.562,12.172 L3.288,10.897 L3.288,10.897 Z" class="si-glyph-fill"> </path> <rect transform="translate(2.240100, 2.131300) rotate(-44.991897) translate(-2.240100, -2.131300) " x="-0.25987605" y="1.13130958" width="4.96295245" height="1.95398128" class="si-glyph-fill"> </rect> <path d="M12.088,8.374 L10.657,9.802 L9.918,9.063 L11.543,7.439 C11.814,7.168 11.81,6.723 11.531,6.447 L9.031,3.948 C8.757,3.673 8.314,3.67 8.043,3.939 L6.419,5.564 L5.684,4.829 L7.113,3.401 L5.718,2.007 L2.221,5.503 L3.614,6.897 L5.028,5.484 L5.763,6.219 L4.134,7.849 C3.864,8.12 3.866,8.564 4.141,8.838 L6.641,11.336 C6.917,11.612 7.363,11.617 7.632,11.346 L9.262,9.717 L10.001,10.456 L8.585,11.869 L9.967,13.25 L13.464,9.753 L12.088,8.374 L12.088,8.374 Z" class="si-glyph-fill"> </path> <rect transform="translate(13.426200, 12.673100) rotate(-45.056720) translate(-13.426200, -12.673100) " x="10.9262228" y="11.6731091" width="4.96795479" height="1.97998198" class="si-glyph-fill"> </rect> </g> </g> </g></svg> </button>`

      nmap.addLayer(
        {
          id: 'Satellite',
          source: { "type": "raster", "url": "mapbox://mapbox.satellite", "tileSize": 256 },
          type: "raster"
        },
        'country-label'
      );
    }



  }

  // Get the map style
  style = nmap.getStyle();

  // Get all layers
  allLayers = style.layers;

  // Log all layers to the console
  console.log('after', allLayers);

}



 
const zoomHome = async () => {
  console.log('clear filters')
//  handleChangeCounty(1)
const featureCollection = {
    type: 'FeatureCollection',
    features: features.value
  };

  var bounds = turf.bbox(featureCollection);
  nmap.fitBounds(bounds, { padding: 20 });
 

}


 


 
 // Define the closePopup function outside of loadMap, so it's globally accessible
let popup; // Declare a popup variable globally

 

const loadMap = () => {
  if (nmap) {
    nmap.remove(); // Remove existing map instance if it exists
  }

  console.log('features.value', features.value);

  // Create a FeatureCollection from the array of features
  const featureCollection = {
    type: 'FeatureCollection',
    features: features.value
  };

  const centroid = turf.centroid(featureCollection);
  const mapCenter = centroid.geometry.coordinates;

  nmap = new mapboxgl.Map({
    container: "mapContainer",
    style: "mapbox://styles/mapbox/streets-v12",
    center: mapCenter, // starting position
    zoom: 15,
  });

  //nmap.addControl(draw, 'top-left');

  // Define the popup variable here
  popup = new mapboxgl.Popup({ closeButton: true, closeOnClick: true });

  nmap.on("load", () => {
    // Add layers only once the map has loaded
    // Add point layer
    nmap.addLayer({
      id: 'point-layer',
      type: 'circle',
      source: {
        type: 'geojson',
        data: featureCollection,
      },
      paint: {
        'circle-color': 'red',
        'circle-radius': 6,
      },
      filter: ['==', '$type', 'Point'],
    });

    // Add line layer
    nmap.addLayer({
      id: 'line-layer',
      type: 'line',
      source: {
        type: 'geojson',
        data: featureCollection, // Make sure features.value contains a LineString
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': 'black',
        'line-width': 2,
      },
      filter: ['==', '$type', 'LineString'],
    });

    // Add polygon layer
    nmap.addLayer({
      id: 'poly-layer',
      type: 'fill',
      source: {
        type: 'geojson',
        data: featureCollection,
      },
      layout: {},
      paint: {
        'fill-color': 'rgba(0, 0, 255, 0.05)',
        'fill-outline-color': 'red',
      },
      filter: ['==', '$type', 'Polygon'],
    });

    // Center the map on the point
    nmap.setCenter(mapCenter);

    const bounds = turf.bbox(featureCollection); // Get the bounding box
    nmap.fitBounds(bounds, {
      padding: { top: 10, bottom: 10, left: 10, right: 10 },
    });

    const nav = new mapboxgl.NavigationControl();
    nmap.addControl(nav, "top-right");
    nmap.resize();


    function addInfo(map) {
    class LayerButton {
      onAdd(map) {
        const div = document.createElement("div");
        div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
        div.innerHTML = icon.value;
        div.addEventListener("contextmenu", (e) => e.preventDefault());
        div.addEventListener("click", () => toggleFloatingDiv());

        return div;
      }
    }
    const lryButton = new LayerButton();
    nmap.addControl(lryButton, "top-right");
  }
  addInfo(nmap)


  function addHomeButton(map) {
      class HomeButton {
        onAdd(map) {
          const div = document.createElement("div");
          div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
          div.innerHTML =
            `<button>
               <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4 15V18C4 19.1046 4.89543 20 6 20H9M15.2173 20H18C19.1046 20 20 19.1046 20 18V15M20 9V6C20 4.89543 19.1046 4 18 4H15M4 9V6C4 4.89543 4.89543 4 6 4H9" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>    </button>`;
          div.addEventListener("contextmenu", (e) => e.preventDefault());
          div.addEventListener("click", () => zoomHome());

          return div;
        }
      }
      const homeButton = new HomeButton();
      nmap.addControl(homeButton, "top-right");
    }
    addHomeButton(nmap)




  });

  // Event listeners for layer clicks
  nmap.on('click', 'point-layer', (e) => {
    const coordinates = e.lngLat;
    const properties = e.features[0].properties;

    // Create HTML content for the popup with a styled header and close button
    let popupContent = `
      <div class="popup-header">
        <strong>Properties</strong>
       </div>
      <ul>
    `;

    for (const prop in properties) {
      popupContent += `<li><strong>${prop}:</strong> ${properties[prop]}</li>`;
    }
    popupContent += '</ul>';

    // Set the popup content and position
    popup.setLngLat(coordinates)
      .setHTML(popupContent)
      .addTo(nmap);
  });

  nmap.on('click', 'line-layer', (e) => {
    const coordinates = e.lngLat;
    const properties = e.features[0].properties;

    // Create HTML content for the popup with a styled header and close button
    let popupContent = `
      <div class="popup-header">
        <strong>Properties</strong>
      </div>
      <ul>
    `;

    for (const prop in properties) {
      popupContent += `<li><strong>${prop}:</strong> ${properties[prop]}</li>`;
    }
    popupContent += '</ul>';

    popup.setLngLat(coordinates)
      .setHTML(popupContent)
      .addTo(nmap);
  });

  nmap.on('click', 'poly-layer', (e) => {
    const coordinates = e.lngLat;
    const properties = e.features[0].properties;

    // Create HTML content for the popup with a styled header and close button
    let popupContent = `
      <div class="popup-header">
        <strong>Properties</strong>
       </div>
      <ul>
    `;

    for (const prop in properties) {
      popupContent += `<li><strong>${prop}:</strong> ${properties[prop]}</li>`;
    }
    popupContent += '</ul>';

    popup.setLngLat(coordinates)
      .setHTML(popupContent)
      .addTo(nmap);
  });
};



</script>

<template>
  <el-card>

 

    <!-- Header Section -->
    <template #header>
      <div class="card-header" style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
            Back
          </el-button>
            {{ form_name }}
        </div>
       
      </div>
    </template>



    <el-tabs v-model="activeName" class="demo-tabs" type="border-card" @tab-click="clickTab">
     
      <el-tab-pane label="Data" name="data">
        <el-card v-loading="loading">
        
          
          <el-row type="flex" justify="start" gutter="10">
            
            <el-select
            v-model="selectedFields"
            multiple
            placeholder="Select properties to display"
            :collapse-tags="true"
            style="margin-bottom: 10px; width: 95%;"
            class="select-properties"
          >
            <el-option
              v-for="(value, key) in allProperties"
              :key="key"
              :label="key"
              :value="key"
            /> 
          </el-select>


          <DownloadCustom :data="paginatedData" :all="tableData" />

          </el-row>
     







          <el-table :data="paginatedData" style="width: 100%" border stripe>
            <el-table-column
              v-for="(key, index) in selectedFields"
              :key="index"
              :label="key"
              :prop="key"
            />
          </el-table>
          
    <div style="margin-top: 20px;">
      <!-- Pagination component -->

      <el-pagination
layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
        v-model:page-size="pageSize" :page-sizes="[5, 10, 15, 20, 50, 100]" :total="totalItems" :background="true"
        @size-change="handlePageSizeChange" @current-change="handlePageChange" class="mt-4" />

    </div>

        </el-card>

      </el-tab-pane>


      <el-tab-pane label="Map" name="map" :disabled="disableMap">
        <div id="mapContainer" class="basemap"></div>
      </el-tab-pane>


 

     
 
 
     
    </el-tabs>






  </el-card>

</template>

<style lang="less" scoped>
.is-required--item {
  position: relative;

  &::before {
    margin-right: 4px;
    color: var(--el-color-danger);
    content: '*';
  }
}


.card-header {
  display: flex;


  font-weight: bold;
  font-size: 1.2rem;
  color: #333;
}


.basemap {
  width: 100%;
  height: 65vh;
}
</style>


<style lang="less" scoped>
@prefix-cls: ~'@{namespace}-descriptions';

.@{prefix-cls}-header {
  &__title {
    &::after {
      position: absolute;
      top: 3px;
      left: -10px;
      width: 4px;
      height: 70%;
      background: var(--el-color-primary);
      content: '';
    }
  }
}

.@{prefix-cls}-content {
  :deep(.@{elNamespace}-descriptions__cell) {
    width: 0;
  }
}
</style>



<style scoped>
.action-col {
  padding: 10px;
}

.action-header {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1px;
  color: #333;
}

.documents-header {
  font-size: 0.95rem;
  font-weight: bold;
  margin-bottom: 1px;
  color: #837f7f;
}

.action-body {
  font-size: 1rem;
  font-weight: 200;
  color: #666;
}

.action-footer {
  font-size: 1rem;
  font-weight: 300;
  color: #2e0dc2;
}

.success-background {
  background-color: rgba(226, 248, 231, 0.4);
  /* Light green with 80% opacity */
  color: #1bd847;
  /* Dark green text */
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #c3e6cb;
  /* Border color */

}

.warning-background {
  background-color: rgba(255, 243, 205, 0.4);
  /* Light yellow with 80% opacity */
  color: #856404;
  /* Dark yellow text */
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ffeeba;
  /* Border color */
}

.closed-background {
  background-color: rgba(255, 0, 0, 0.14);
  /* Red with 80% opacity */
  color: #fa0707;
  /* Darker text for contrast */
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #fb050552;
  /* Lighter red border */
}

.referred-background {
  background-color: rgba(247, 155, 7, 0.2);
  /* Pink with 20% opacity */
  color: rgb(255, 192, 254);
  /* Same text color */
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #d6d6d6;
  /* Lighter pink border */
}




.info-background {
  background-color: rgba(204, 229, 255, 0.4);
  /* Light blue with 80% opacity */
  color: #004085;
  /* Dark blue text */
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #b8daff;
  /* Border color */
}


.custom-card {
  padding: 5px;
  /* Reduce padding */
  margin: 5px 0;
  /* Adjust margin as needed */
  min-height: 10px;
  /* Set a minimum height if needed */
}

.timestamp-class {
  font-weight: bold;
  /* Example: Make it bold */
  color: #6c757d;
  /* Example: Set color */
  font-size: 14px;
  /* Example: Adjust font size */
  /* Add any additional styles as needed */
}
</style>



<style>
.el-table .danger-row {
  --el-table-tr-bg-color: var(--el-color-danger-light-9);
  --el-table-tr-text-color: var(--el-color-danger);
  color: var(--el-table-tr-text-color);
}

.el-table .success-row {
  --el-table-tr-bg-color: var(--el-color-success-light-9);
  --el-table-tr-text-color: var(--el-color-success);
  color: var(--el-table-tr-text-color);
}



.el-table .warning-row {
  --el-table-tr-bg-color: var(--el-color-warning-light-9);
  --el-table-tr-text-color: var(--el-color-warning);
  color: var(--el-table-tr-text-color);
}

.item {
  margin-top: 10px;
  margin-right: 40px;
}


.custom-table .el-table__cell {
  color: rgb(243, 112, 112);
  /* Light gray text color */
  font-style: italic;
  font-size: small;
  /* Italicized text */
}


.italic-green {
  color: rgb(48, 77, 6);
  font-style: italic; /* Italicized text */
}

.italic-red {
  color: rgb(243, 11, 11); /* Light gray text color */
  font-style: italic; /* Italicized text */
}

.td-bold {
   font-weight: bold; /* Italicized text */
}


/* Style for the Mapbox Popup */
.mapboxgl-popup-content {
  max-height: 300px;  /* Adjust this height as needed */
  overflow-y: auto;   /* Enables vertical scrolling */
}

.mapboxgl-popup-content ul {
  padding: 0;
  margin: 0;
  list-style-type: none;
}

.mapboxgl-popup-content li {
  margin: 5px 0;
}

/* Style for the Mapbox Popup Header */
.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #333;
  color: white;
  padding: 5px 10px;
  font-size: 16px;
  font-weight: bold;
  border-radius: 5px 5px 0 0;
}

/* Style for the Close Button */
.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  padding: 5px;
  transition: background-color 0.3s;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* Style for the Popup Content */
.mapboxgl-popup-content {
  max-height: 300px;
  overflow-y: auto;
}

/* Style for the List inside Popup */
.mapboxgl-popup-content ul {
  padding: 10px;
  margin: 0;
  list-style-type: none;
}

.mapboxgl-popup-content li {
  margin: 5px 0;
}



</style>

