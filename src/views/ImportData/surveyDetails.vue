<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, computed, h } from 'vue'
import {
  
ElButton, ElTabPane, ElTabs, ElCard, ElTable, ElTableColumn, ElSelect,ElOption,ElPagination,ElRow,ElCol,ElTableV2,ElMessage,ElEmpty,
} from 'element-plus'

import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'
import { getModelSpecs, getModelRelatives } from '@/api/fields'

// Locally
import '@dafcoe/vue-collapsible-panel/dist/vue-collapsible-panel.css'
import { useAppStore } from '@/store/modules/app'
import DownloadCustom from '@/views/Components/DownloadCustomFields.vue';
import PermissionWrapper from '@/components/PermissionWrapper.vue';

import '@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css';
import * as turf from '@turf/turf'
  
import {
  getAllSubmissions,
  getSubmissionAttachments,
  downloadSubmissionAttachments,
  downloadSubmissionsAttachmentsZip,
  countSubmissionsAttachments
} from '@/api/collector'


import "mapbox-layer-switcher/styles.css";
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'


import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'
import { Back,Upload } from '@element-plus/icons-vue'


 
import { useCache } from '@/hooks/web/useCache'

import '@/plugins/echarts'
import VChart from 'vue-echarts';

import { GoogleMap,Polygon ,InfoWindow, Marker,CustomMarker ,MarkerCluster,Polyline,Circle   } from 'vue3-google-map'
import { GOOGLE_MAPS_API_KEY } from '@/config/googleMaps'
import { GOOGLE_MAP_DECLUTTER_STYLES } from '@/utils/googleMapStyles'


const isMobile = ref(typeof window !== 'undefined' ? window.innerWidth <= 768 : false)

const tableWidth = ref(window.innerWidth * 0.9); // 90% of window width


const updateWidth = () => {
  tableWidth.value = window.innerWidth * 0.9;
};

onMounted(() => {
  window.addEventListener("resize", updateWidth);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateWidth);
});





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

 


const tableData =ref([]) // Table data extracted from GeoJSON
const tableHeaders =ref([]) // The first five properties
const allProperties =ref([]) // The first five properties
const selectedFields = ref([]); // Ensure it's reactive
const selectedFieldOptions = ref([]); // Ensure it's reactive
const features =ref([])
const originalFeatures =ref([])
const  totalItems=ref()
const  disableMap=ref(false)


 // Store the original table data
// Deep clone the original table data
const deepClone = (data) => JSON.parse(JSON.stringify(data));
const originalTableData =ref()


const createSelectFieldOptions = async () => { 
 // Generate value:label array for each selected field
 selectedFieldOptions.value = selectedFields.value.map((field) => {
              // Get unique values for the field across all features
              console.log(field)
              // Return the field with the unique values in value:label format
              return {
                label: String(field), 
                value: String(field)
                 
              };
            });

        console.log("Value:Label Array:",   selectedFieldOptions.value);

}

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
 
      // Parse GeoJSON data or handle non-GeoJSON results
      if (response.data.features && response.data.features.length > 0) {
        disableMap.value=false

        // If the result is GeoJSON
        features.value = response.data.features;
        originalFeatures.value = response.data.features;
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

          // Add attachments column
          row.attachments = properties._uuid ? getAttachments(properties._uuid) : [];
          
          return row;
        });


        createSelectFieldOptions()
       



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




      // Store the original table data
      originalTableData.value = deepClone(tableData.value); // Proper deep clone 
      console.log('originalTableData', originalTableData.value)


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
  // udpate the Field filter as well
  createSelectFieldOptions()
    // Ensure features is updated
    console.log('listening selectedFields',selectedFields.value)


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

  originalTableData.value = deepClone(tableData.value)
  
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


// Watch paginatedData to detect changes
watch(paginatedData, (newValue) => {
  console.log("Paginated data changed:", newValue);
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

  if (tab.props.name === 'gmap') {
    // Delay the loadMap function
    setTimeout(() => {
      loadGoogleMap(); // Load map after a brief delay
    }, 500); // Delay in milliseconds (500 ms = 0.5 seconds)
  }

  
  if (tab.props.name === 'chart') {
    generateReport()
    setTimeout(() => {
      renderChart();
    }, 500);
  }


};



let nmap; // Declare the map variable outside the function for scope

 

 

const icon = ref(`<button title="Switch Baselayer">  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4.97883 9.68508C2.99294 8.89073 2 8.49355 2 8C2 7.50645 2.99294 7.10927 4.97883 6.31492L7.7873 5.19153C9.77318 4.39718 10.7661 4 12 4C13.2339 4 14.2268 4.39718 16.2127 5.19153L19.0212 6.31492C21.0071 7.10927 22 7.50645 22 8C22 8.49355 21.0071 8.89073 19.0212 9.68508L16.2127 10.8085C14.2268 11.6028 13.2339 12 12 12C10.7661 12 9.77318 11.6028 7.7873 10.8085L4.97883 9.68508Z" fill="#1C274C"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M2 8C2 8.49355 2.99294 8.89073 4.97883 9.68508L7.7873 10.8085C9.77318 11.6028 10.7661 12 12 12C13.2339 12 14.2268 11.6028 16.2127 10.8085L19.0212 9.68508C21.0071 8.89073 22 8.49355 22 8C22 7.50645 21.0071 7.10927 19.0212 6.31492L16.2127 5.19153C14.2268 4.39718 13.2339 4 12 4C10.7661 4 9.77318 4.39718 7.7873 5.19153L4.97883 6.31492C2.99294 7.10927 2 7.50645 2 8Z" fill="#1C274C"></path> <path opacity="0.7" d="M5.76613 10L4.97883 10.3149C2.99294 11.1093 2 11.5065 2 12C2 12.4935 2.99294 12.8907 4.97883 13.6851L7.7873 14.8085C9.77318 15.6028 10.7661 16 12 16C13.2339 16 14.2268 15.6028 16.2127 14.8085L19.0212 13.6851C21.0071 12.8907 22 12.4935 22 12C22 11.5065 21.0071 11.1093 19.0212 10.3149L18.2339 10L16.2127 10.8085C14.2268 11.6028 13.2339 12 12 12C10.7661 12 9.77318 11.6028 7.7873 10.8085L5.76613 10Z" fill="#1C274C"></path> <path opacity="0.4" d="M5.76613 14L4.97883 14.3149C2.99294 15.1093 2 15.5065 2 16C2 16.4935 2.99294 16.8907 4.97883 17.6851L7.7873 18.8085C9.77318 19.6028 10.7661 20 12 20C13.2339 20 14.2268 19.6028 16.2127 18.8085L19.0212 17.6851C21.0071 16.8907 22 16.4935 22 16C22 15.5065 21.0071 15.1093 19.0212 14.3149L18.2339 14L16.2127 14.8085C14.2268 15.6028 13.2339 16 12 16C10.7661 16 9.77318 15.6028 7.7873 14.8085L5.76613 14Z" fill="#1C274C"></path> </g></svg></button>`)

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

    console.log('Add Satellite');



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


 


const downloadGeo = () => {
  ElMessage({
    message: 'Downloading in GeoJson format.....',
    type: 'warning',
  })

  const featureCollection = {
    type: 'FeatureCollection',
    features: features.value
  };
  // facilityGeoPoints

  //download(JSON.stringify(collection), title.value +".geojson", "text/plain");
  downloadJSON(featureCollection, form_name + ".geojson")


}

function downloadJSON(jsonObj, fileName) {

  console.log('downloading......')
  // Convert the JSON object to a JSON string
  const jsonString = JSON.stringify(jsonObj, null, 2);

  // Create a Blob with the JSON string
  const blob = new Blob([jsonString], { type: 'application/json' });

  // Create a link element
  const link = document.createElement('a');

  // Set the download attribute and file name
  link.download = fileName || 'download.json';

  // Create a URL for the Blob and set it as the href attribute of the link
  link.href = window.URL.createObjectURL(blob);

  // Append the link to the document
  document.body.appendChild(link);

  // Trigger a click on the link to start the download
  link.click();

  // Remove the link from the document
  document.body.removeChild(link);
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
        'fill-color': 'rgba(0, 0, 255, 0)', // Fully transparent fill
      },
      filter: ['==', '$type', 'Polygon'],
    });


    // Add polygon outline layer (thicker red line)
    nmap.addLayer({
      id: 'poly-outline-layer',
      type: 'line',
      source: {
        type: 'geojson',
        data: featureCollection,
      },
      layout: {},
      paint: {
        'line-color': 'red', // Outline color
        'line-width': 3, // Adjust thickness
            'line-dasharray': [3, 2], // Dotted pattern [dash length, gap length]

      },
      filter: ['==', '$type', 'Polygon'],
    });



// Extract vertices from polygon boundaries
const vertices = {
  type: 'FeatureCollection',
  features: featureCollection.features.flatMap(feature => {
    if (feature.geometry.type === 'Polygon') {
      return feature.geometry.coordinates[0].map(coord => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: coord,
        },
        properties: {},
      }));
    }
    return [];
  }),
};

// Add a new source for vertices
nmap.addSource('polygon-vertices', {
  type: 'geojson',
  data: vertices,
});

// Add layer for vertices (small red circles)
nmap.addLayer({
  id: 'polygon-vertices-layer',
  type: 'circle',
  source: 'polygon-vertices',
  paint: {
    'circle-radius': 4, // Size of the vertex points
    'circle-color': 'green', // Color of vertices
    'circle-stroke-width': 1,
    'circle-stroke-color': 'white', // Outline for better visibility
  },
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
            `<button title="Zoom To Full Extent">
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



    function addDownloadButton(map) {
      class HomeButton {
        onAdd(map) {
          const div = document.createElement("div");
          div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
          div.innerHTML =
        `<button title="Download GeoJSON">
         <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12ZM12 6.25C12.4142 6.25 12.75 6.58579 12.75 7V12.1893L14.4697 10.4697C14.7626 10.1768 15.2374 10.1768 15.5303 10.4697C15.8232 10.7626 15.8232 11.2374 15.5303 11.5303L12.5303 14.5303C12.3897 14.671 12.1989 14.75 12 14.75C11.8011 14.75 11.6103 14.671 11.4697 14.5303L8.46967 11.5303C8.17678 11.2374 8.17678 10.7626 8.46967 10.4697C8.76256 10.1768 9.23744 10.1768 9.53033 10.4697L11.25 12.1893V7C11.25 6.58579 11.5858 6.25 12 6.25ZM8 16.25C7.58579 16.25 7.25 16.5858 7.25 17C7.25 17.4142 7.58579 17.75 8 17.75H16C16.4142 17.75 16.75 17.4142 16.75 17C16.75 16.5858 16.4142 16.25 16 16.25H8Z" fill="#1C274C"></path> </g></svg> 
          </button>`;
          div.addEventListener("contextmenu", (e) => e.preventDefault());
          div.addEventListener("click", () => downloadGeo());

          return div;
        }
      }
      const homeButton = new HomeButton();
      nmap.addControl(homeButton, "top-right");
    }
    addDownloadButton(nmap)



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

const gmapCenter=ref()
const polygonPaths=ref([])
// Polygon options
const polygonOptions = ref({
  strokeColor: "#FF0000",
  paths:[
  {
      lat: 0.453788,
      lng: 34.2507607
  },
  {
      lat: 0.4537883,
      lng: 34.2507568
  },
  {
      lat: 0.4537031,
      lng: 34.2504258
  },
  {
      lat: 0.4536948,
      lng: 34.2503084
  },
  {
      lat: 0.4537166,
      lng: 34.2501766
  },
  {
      lat: 0.4536393,
      lng: 34.2499947
  },
  {
      lat: 0.4537482,
      lng: 34.2499094
  },
  {
      lat: 0.4538849,
      lng: 34.2498233
  },
  {
      lat: 0.4540451,
      lng: 34.2497777
  },
  {
      lat: 0.453973,
      lng: 34.2496435
  },
  {
      lat: 0.4539437,
      lng: 34.2495795
  },
  {
      lat: 0.4538936,
      lng: 34.2495014
  },
  {
      lat: 0.4538466,
      lng: 34.249291
  },
  {
      lat: 0.4538575,
      lng: 34.2491741
  },
  {
      lat: 0.4537422,
      lng: 34.2490622
  },
  {
      lat: 0.4535976,
      lng: 34.2489529
  },
  {
      lat: 0.4534326,
      lng: 34.2489258
  },
  {
      lat: 0.4532708,
      lng: 34.2489848
  },
  {
      lat: 0.4531767,
      lng: 34.2490616
  },
  {
      lat: 0.4530565,
      lng: 34.2491812
  },
  {
      lat: 0.4529584,
      lng: 34.2491468
  },
  {
      lat: 0.452865,
      lng: 34.2491316
  },
  {
      lat: 0.4527666,
      lng: 34.2492502
  },
  {
      lat: 0.452705,
      lng: 34.2494031
  },
  {
      lat: 0.4526438,
      lng: 34.2494797
  },
  {
      lat: 0.4525058,
      lng: 34.2495212
  },
  {
      lat: 0.4523661,
      lng: 34.2494911
  },
  {
      lat: 0.4522096,
      lng: 34.2495128
  },
  {
      lat: 0.4521251,
      lng: 34.2495607
  },
  {
      lat: 0.4519988,
      lng: 34.2495362
  },
  {
      lat: 0.4518462,
      lng: 34.2494963
  },
  {
      lat: 0.4517404,
      lng: 34.2493802
  },
  {
      lat: 0.4516359,
      lng: 34.2492809
  },
  {
      lat: 0.4515101,
      lng: 34.2493944
  },
  {
      lat: 0.4513556,
      lng: 34.2494381
  },
  {
      lat: 0.4512199,
      lng: 34.2494674
  },
  {
      lat: 0.4511,
      lng: 34.2494848
  },
  {
      lat: 0.4509762,
      lng: 34.2495557
  },
  {
      lat: 0.4508875,
      lng: 34.2496526
  },
  {
      lat: 0.4507363,
      lng: 34.2495977
  },
  {
      lat: 0.4505939,
      lng: 34.2495377
  },
  {
      lat: 0.450398,
      lng: 34.249587
  },
  {
      lat: 0.450381,
      lng: 34.2497183
  },
  {
      lat: 0.4503239,
      lng: 34.2498896
  },
  {
      lat: 0.4503013,
      lng: 34.2500309
  },
  {
      lat: 0.4502306,
      lng: 34.2501484
  },
  {
      lat: 0.4501738,
      lng: 34.2502708
  },
  {
      lat: 0.4501196,
      lng: 34.2503727
  },
  {
      lat: 0.4498127,
      lng: 34.2503517
  },
  {
      lat: 0.4498033,
      lng: 34.2503861
  },
  {
      lat: 0.4496947,
      lng: 34.2505276
  },
  {
      lat: 0.4495585,
      lng: 34.2505615
  },
  {
      lat: 0.4494307,
      lng: 34.2505853
  },
  {
      lat: 0.4493377,
      lng: 34.2504938
  },
  {
      lat: 0.44925,
      lng: 34.2503687
  },
  {
      lat: 0.4491286,
      lng: 34.2503199
  },
  {
      lat: 0.4489332,
      lng: 34.2500986
  },
  {
      lat: 0.4489338,
      lng: 34.2499918
  },
  {
      lat: 0.4488123,
      lng: 34.2499657
  },
  {
      lat: 0.4486165,
      lng: 34.2499347
  },
  {
      lat: 0.4485774,
      lng: 34.2499176
  },
  {
      lat: 0.4485276,
      lng: 34.2499649
  },
  {
      lat: 0.4483706,
      lng: 34.2506031
  },
  {
      lat: 0.4484642,
      lng: 34.2513153
  },
  {
      lat: 0.448509,
      lng: 34.2520298
  },
  {
      lat: 0.4486563,
      lng: 34.2532993
  },
  {
      lat: 0.4486771,
      lng: 34.2539959
  },
  {
      lat: 0.4487467,
      lng: 34.2543549
  },
  {
      lat: 0.4488886,
      lng: 34.2544769
  },
  {
      lat: 0.4489543,
      lng: 34.2544894
  },
  {
      lat: 0.4491892,
      lng: 34.2544303
  },
  {
      lat: 0.4494672,
      lng: 34.2544003
  },
  {
      lat: 0.4496477,
      lng: 34.2544022
  },
  {
      lat: 0.4501365,
      lng: 34.2543372
  },
  {
      lat: 0.4508665,
      lng: 34.254164
  },
  {
      lat: 0.4514805,
      lng: 34.2539161
  },
  {
      lat: 0.4521776,
      lng: 34.2536955
  },
  {
      lat: 0.4529142,
      lng: 34.2535593
  },
  {
      lat: 0.4534664,
      lng: 34.2534857
  },
  {
      lat: 0.4535101,
      lng: 34.2535355
  },
  {
      lat: 0.453964,
      lng: 34.2533462
  },
  {
      lat: 0.4538957,
      lng: 34.2526147
  },
  {
      lat: 0.4538865,
      lng: 34.2517986
  },
  {
      lat: 0.453788,
      lng: 34.2507607
  }
],
  strokeOpacity: 0.8,
  strokeWeight: 2,
  fillColor: "#FF0000",
  fillOpacity: 0.35,
});



const BerMcenter = { lat: 24.886, lng: -70.268 }

const polygons=ref([])
const polylines=ref([])
const markers=ref([])
const vertices=ref([])
 


const gmap = ref(null); // Reference to the Google Map

const loadGoogleMap = () => {
  console.log("Google <Map>");

  // Create a FeatureCollection from the array of features
  const featureCollection = {
    type: "FeatureCollection",
    features: features.value,
  };

  // Clear the arrays
  polygons.value = [];
  polylines.value = [];
  markers.value = [];
  vertices.value = [];

  // Initialize bounds
  const bounds = new google.maps.LatLngBounds();

  // Loop through each feature and extract geometry
  featureCollection.features.forEach((feature, index) => {
    const { geometry, properties } = feature;

    if (geometry.type === "Polygon") {
      // Convert GeoJSON coordinates to Google Maps format
      const paths = geometry.coordinates[0].map(([lng, lat]) => {
        const point = { lat, lng };
        bounds.extend(point); // Add to bounds
        return point;
      });

      // Append polygon
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

    } else if (geometry.type === "LineString") {
      // Convert GeoJSON coordinates to Google Maps format
      const path = geometry.coordinates.map(([lng, lat]) => {
        const point = { lat, lng };
        bounds.extend(point); // Add to bounds
        return point;
      });

      // Append polyline
      polylines.value.push({
        id: properties?.id || index,
        path,
        strokeColor: "black", // Blue color for lines
        strokeOpacity: 1,
        strokeWeight: 2,
        properties: { ...properties },
      });

    } else if (geometry.type === "Point") {
      const [lng, lat] = geometry.coordinates;
      const position = { lat, lng };
      bounds.extend(position);

      // Append marker
      markers.value.push({
        id: properties?.id || index,
        position,
        title: properties?.name || `Point ${index}`,
        properties: { ...properties },
      });
    }
  });




  // Fit the map to all features
  if (polygons.value.length > 0 || polylines.value.length > 0 || markers.value.length > 0) {
    gmap.value?.map.fitBounds(bounds);
  }

  console.log({ polygons: polygons.value, polylines: polylines.value, markers: markers.value });





 

};






// Add a new ref for the chart instance
const chartInstance = ref(null);

// Add a new ref for the selected chart fields
const selectedChartFields = ref([]);

// Add a new ref for the chart data
const chartData = ref([]);

// Function to update chart data based on selected fields
const updateChartData = () => {
  if (selectedChartFields.value.length > 0) {
    chartData.value = tableData.value.map((item) => {
      const row = {};
      selectedChartFields.value.forEach((key) => {
        row[key] = item[key] || 0; // Set 0 if the key is missing or undefined
      });
      return row;
    });
  } else {
    chartData.value = [];
  }
};

// Function to render the chart
const renderChart = () => {
  if (chartInstance.value) {
    chartInstance.value.dispose();
  }

  const chartDom = document.getElementById('chartContainer');
  if (chartDom) {
    chartInstance.value = echarts.init(chartDom);

    const option = {
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: selectedChartFields.value,
      },
      xAxis: {
        type: 'category',
        data: chartData.value.map((_, index) => `Record ${index + 1}`),
      },
      yAxis: {
        type: 'value',
      },
      series: selectedChartFields.value.map((field) => ({
        name: field,
        type: 'line',
        data: chartData.value.map((item) => item[field]),
      })),
    };

    chartInstance.value.setOption(option);
  }
};

// Watch for changes in selected chart fields and update chart data
watch(selectedChartFields, () => {
  updateChartData();
 // renderChart();
}, { deep: true });



const computationMethod = ref('count')


const typeChart = ref('pie')

const computationOptions = [
    {
        value: 'count',
        label: 'Count',
    },
    // {
    //     value: 'sum',
    //     label: 'Sum',
    // },
    // {
    //     value: 'ave',
    //     label: 'Average',
    // },

    {
        value: 'proportion',
        label: 'Proportion (%)',
    }



]


const generatePropertyFrequencies = async (arr, properties) => {
    // Create an empty object to store the frequencies.
    const frequencies = {};

    // Iterate through the properties array and initialize a frequency object for each property.
    properties.forEach((property) => {
        frequencies[property] = {};
    });

    // Iterate through the array of objects.
    arr.forEach((item) => {
        properties.forEach((property) => {
            // Get the value of the current property.
            const propertyValue = item[property];

            // Exclude null or empty values.
            if (propertyValue !== null && propertyValue !== undefined && propertyValue !== "") {
                // Initialize the property value count to 0 if it doesn't exist.
                if (!frequencies[property].hasOwnProperty(propertyValue)) {
                    frequencies[property][propertyValue] = 0;
                }

                // Increment the count for the current property value.
                frequencies[property][propertyValue]++;
            }
        });
    });

    return frequencies;
};



const generatePropertyProportions = async (arr, properties) => {
    // Create an empty object to store the proportions.
    const proportions = {};

    // Calculate the total count of items in the array.
    const totalCount = arr.length;

    // Iterate through the properties array and initialize a proportion object for each property.
    properties.forEach((property) => {
        proportions[property] = {};
    });

    // Iterate through the array of objects.
    arr.forEach((item) => {
        properties.forEach((property) => {
            // Get the value of the current property.
            const propertyValue = item[property];

            // Initialize the property value count to 0 if it doesn't exist.
            if (!proportions[property].hasOwnProperty(propertyValue)) {
                proportions[property][propertyValue] = 0;
            }

            // Increment the count for the current property value.
            proportions[property][propertyValue]++;
        });
    });

    // Calculate proportions as percentages with two decimal places.
    properties.forEach((property) => {
        for (const value in proportions[property]) {
            proportions[property][value] = ((proportions[property][value] / totalCount) * 100).toFixed(2);
        }
    });

    return proportions;
};

const generatePropertySummation = (arr, properties) => {
    // Create an empty object to store the summations.
    const summations = {};

    // Iterate through the properties array and initialize a summation object for each property.
    properties.forEach((property) => {
        summations[property] = 0;
    });

    // Iterate through the array of objects.
    arr.forEach((item) => {
        properties.forEach((property) => {
            // Get the value of the current property.
            const propertyValue = item[property];

            // Add the property value to the current summation.
            summations[property] += propertyValue;
        });
    });

    return summations;
};


const generatePropertyAverage = (arr, properties) => {
    // Create an empty object to store the averages.
    const averages = {};

    // Create an empty object to store the count of values for each property.
    const counts = {};

    // Iterate through the properties array and initialize an average object for each property.
    properties.forEach((property) => {
        averages[property] = 0;
        counts[property] = 0;
    });

    // Iterate through the array of objects.
    arr.forEach((item) => {
        properties.forEach((property) => {
            // Get the value of the current property.
            const propertyValue = item[property];

            // Add the property value to the current average.
            averages[property] += propertyValue;

            // Increment the count for the current property.
            counts[property]++;
        });
    });

    // Calculate the average for each property.
    properties.forEach((property) => {
        if (counts[property] > 0) {
            averages[property] = (averages[property] / counts[property]).toFixed(2);
        }
    });

    return averages;
};




let thisChart = {}



const chartOptions = [
    {
        value: 'pie',
        label: 'Pie Chart',
    },
    {
        value: 'bar',
        label: 'Bar Chart',
    },
    {
        value: 'multi_bar',
        label: 'Multiple Variable Bar Chart',
    },
    {
        value: 'stacked_bar',
        label: 'Stacked Bar Chart',
    }

  ]

  

const showCharts = ref(false)
const customCharts = ref([])


const PieOptions= {
  title: {
    text: 'Sample Chart',
    left: 'center',
  },
 

  tooltip: {
    trigger: 'item',
  },
  legend: {
    orient: 'vertical',
    left: 'left',
  },
  series: [
    {
      name: 'Sample Data',
      type: 'pie',
      radius: '50%',
      data: [
        { value: 1048, name: 'Search Engine' },
        { value: 735, name: 'Direct' },
        { value: 580, name: 'Email' },
        { value: 484, name: 'Union Ads' },
        { value: 300, name: 'Video Ads' },
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
    },
  ],
  toolbox: {
    show: true,
    feature: {
      mark: { show: true },
      dataView: { show: true, readOnly: false },
      restore: { show: true },
      saveAsImage: { show: true }
    }
  },
};

const BarOptions= {
  xAxis: {
    type: 'category',
    data: []
  },
  yAxis: {
    type: 'value'
  },
  toolbox: {
    show: true,
    feature: {
      saveAsImage: {}
    }
  },
  legend: {
    data: [ ]
  },
  
  series: [
    {
      data: [],
      type: 'bar'
    }
  ]
};

const MultiBarOptions = {
  toolbox: {
    show: true,
    feature: {
      saveAsImage: {}
    }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  legend: {},
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'value',
    boundaryGap: [0, 0.01]
  },
  yAxis: {
    type: 'category',
    data: []
  },
  series: []
};

 

const StackedBarOption = {
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      // Use axis to trigger tooltip
      type: 'shadow' // 'shadow' as default; can also be 'line' or 'shadow'
    }
  },
  toolbox: {
    show: true,
    feature: {
      saveAsImage: {}
    }
  },
  legend: {},
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'value'
  },
  yAxis: {
    type: 'category',
    data: []
  },
  textStyle: {
      fontSize: 12,
      overflow: "breakAll"
    },
  series: [
   
  ]
};
const handleChangeFields = async () => {
  // Delay for 500ms (adjust the delay time as needed)
  await new Promise((resolve) => setTimeout(resolve, 500));
  generateReport();
};


const generateReport = async () => {
    showCharts.value = true
    // clear the charts first 
    customCharts.value = []
    console.log("reports........", selectedFields.value, computationMethod.value)
    console.log("tableData.value........", tableData.value)

    var frequencies
    if (computationMethod.value == 'count') {
        frequencies = await generatePropertyFrequencies(tableData.value, selectedFields.value);
        console.log('frequencies:count',frequencies)

    } 
    
    else if (computationMethod.value == 'sum') {
        frequencies = await generatePropertySummation(tableData.value, selectedFields.value);
        console.log('frequencies:sum',frequencies)
    }   
    
  
    else if (computationMethod.value == 'ave') {
        frequencies = await generatePropertyAverage(tableData.value, selectedFields.value);

    }   
    else {
        frequencies = await generatePropertyProportions(tableData.value, selectedFields.value);
        console.log("Proportions", frequencies)

    }

 
    let chart = {};
      if (typeChart.value == 'pie') {
          for (const key in frequencies) {
              if (frequencies.hasOwnProperty(key)) {
                  const nestedData = frequencies[key];
                  console.log('nestedData', nestedData);
                  let keys = Object.keys(nestedData);
                  let data = Object.values(nestedData);
                  let series = [];

                  for (let i = 0; i < keys.length; i++) {
                      series.push({ value: data[i], name: keys[i] });
                  }

                  chart[key] = {
                      data: series,
                      key: key.toUpperCase(),
                  };
              }
          }
          console.log('Pie-chart', chart);
       } 
      else if (typeChart.value == 'multi_bar') {
          // Initialize categories and series
          let categories = [];
          let seriesData = {};

          // Loop through the frequencies to populate categories and series
          for (const key in frequencies) {
              if (frequencies.hasOwnProperty(key)) {
                  const nestedData = frequencies[key];
                  let keys = Object.keys(nestedData);

                  // Add unique categories to the list
                  categories = [...new Set([...categories, ...keys])];

                  // Populate series data for each key
                  for (const category of keys) {
                      if (!seriesData[key]) {
                          seriesData[key] = [];
                      }
                      seriesData[key].push({ category, value: nestedData[category] });
                  }
              }
          }

          // Transform the seriesData into chart series format
          let series = [];
          for (const seriesName in seriesData) {
              if (seriesData.hasOwnProperty(seriesName)) {
                  series.push({
                      name: seriesName.toUpperCase(),
                      type: 'bar',
                      data: seriesData[seriesName].map((item) => item.value || 0), // Fill missing categories with 0
                  });
              }
          }

          chart = {
              categories: categories,
              series: series,
          };

          console.log('Multivariate Bar Chart', chart);
      }
      
      else if (typeChart.value == 'stacked_bar') {
            for (const chartKey in frequencies) {

             
              if (frequencies.hasOwnProperty(chartKey)) {
                const nestedFrequencies = frequencies[chartKey];

                // Initialize categories as the keys of the nested frequency object (e.g., '26_35', '18_25', '_70', etc.)
                let categories = Object.keys(nestedFrequencies);

                // Initialize an empty array for the series data
                let series = [];

                // Loop through the subcategories (keys in the nested frequency object)
                categories.forEach((subCategory) => {
                  // Prepare the data for each subcategory (since the data is flat, each category is its own series)
                  const data = categories.map((category) => {
                    // The value for each subcategory in the categories, in this case it's just the number itself
                    return nestedFrequencies[category] || 0;
                  });

                  // Push the series for each subcategory
                  series.push({
                    name: subCategory.toUpperCase(), // Name of the subcategory
                    type: 'bar',
                    stack: 'total', // Stack the bars
                    data: data, // Data for the subcategory
                  });
                });

                // Create the chart object for the current chartKey (e.g., 'age', 'gender', etc.)
                
                  chart[chartKey] = {
                  title: chartKey.toUpperCase(), // Chart title: 'Age', 'Gender', 'Educational Level'
                  categories: categories, // Categories (e.g., '26_35', '18_25', etc.)
                  series: series, // Series data (stacked bars for each subcategory)
                };
                console.log('chartKey',chartKey)
                // Debug: Log the chart object for verification
              console.log(`Stacked Bar 1Chart for ${chartKey}`, chart);

                // Add the chart to the customCharts array for rendering
              //  customCharts.value.push(chart);
              }
            }
          }


 
      else {
          for (const key in frequencies) {
              if (frequencies.hasOwnProperty(key)) {
                  const nestedData = frequencies[key];
                  chart[key] = {
                      category: Object.keys(nestedData),
                      data: Object.values(nestedData),
                      key: key.toUpperCase(),
                  };
              }
          }
      }



     // // loop through the extratced data and generated chart options
  for (const key in chart) {
    let updatedOptions;

    if (typeChart.value == 'pie') {
      updatedOptions = {
        ...PieOptions,
        title: {
          ...PieOptions.title,
          text: computationMethod.value === 'count' ? chart[key].key : chart[key].key + '(%)',
        },
        series: {
          ...PieOptions.series[0],
          data: chart[key].data,
          name: chart[key].key,
        },
      };
    } else if (typeChart.value == 'bar') {
      updatedOptions = {
        ...BarOptions,
        title: {
          ...BarOptions.title,
          text: computationMethod.value === 'count' ? chart[key].key : chart[key].key + ' (%)',
        },
        xAxis: {
          type: 'category',
          data: chart[key].category,
        },
        series: [
          {
            ...BarOptions.series[0],
            data: chart[key].data,
            name: chart[key].key,
          },
        ],
      };
    } else if (typeChart.value == 'multi_bar') {
      updatedOptions = {
        ...MultiBarOptions,

        xAxis: {
          type: 'category',
          data: chart.categories, // Set categories for the x-axis
        },
        series: chart.series.map((seriesItem) => ({
          ...MultiBarOptions.series[0], // Spread default series options
          data: seriesItem.data,  // Set the data for the series
          name: seriesItem.name,  // Set the name for the series
          type: 'bar',            // Ensure it's a bar type
        })),
      };
    }
    else if (typeChart.value == 'stacked_bar') {
    // Iterate over each chart key (e.g., 'age', 'gender', 'educational_level_highest')
              // Create the updated chart options
              console.log( 'stacked_bar',key)
              let thisChart=chart[key]
            updatedOptions = {
                ...StackedBarOption,
                title: {
                    ...StackedBarOption.title,
                    text: key.toUpperCase(), // Set chart title
                },
                xAxis: {
                    ...StackedBarOption.xAxis,
                    data: thisChart.categories, // Set categories for X-axis
                },
                series: thisChart.series, // Set series data
            };

            // Push the updated options to the customCharts array
            customCharts.value.push(updatedOptions);
           // console.log(`Stacked Bar 2Chart for ${chartKey}`, updatedOptions);
     
}





    console.log('updatedOptions:', updatedOptions);
    // Check if the options are already in customCharts.value
    const isAlreadyPresent = customCharts.value.some(
      (chartOption) => JSON.stringify(chartOption) === JSON.stringify(updatedOptions)
    );

    if (!isAlreadyPresent) {
      customCharts.value.push(updatedOptions);
    }
  }

    console.log("charts,", customCharts.value)
}

// Render charts after the DOM is mounted


 // Computed property for dynamic columns
const tableColumns = computed(() =>
  selectedFields.value.map((field) => ({
    key: field,
    dataKey: field,
    title: field.replace(/_/g, " ").toUpperCase(),
    width: 150,
    align: "left",
  }))
);


const filterField=ref()
const filterOptions=ref([])
const filterValues=ref([])


const handleSelectFilterField = async () => {
  if (!filterField.value || !Array.isArray(tableData.value)) return;

  let uniqueValuesSet = new Set(
    tableData.value.map(item => item[filterField.value]).filter(Boolean)
  );

  // Convert Set to array and map it to value-label objects
  filterOptions.value = [...uniqueValuesSet].map(value => ({
    value,
    label: String(value)
  }));

  console.log("Filter Options:", filterOptions.value);
};



const uploadOptions = [
 
      {
        value: 'settlement',
        label: 'Settlements'
      },
      {
        value: 'households',
        label: 'Households'
      },
      {
        value: 'health_facility',
        label: 'Health Facilities'
      },
      {
        value: 'road',
        label: 'Roads'
      },
      {
        value: 'path',
        label: 'Paths'
      }
   
   
]



watch(filterValues, () => {
  console.log('originalTableData.value', originalTableData.value);
  console.log('originalFeatures.value', originalFeatures.value);

  if (!filterField.value || !Array.isArray(originalTableData.value)) {
    return; // Exit if no valid field or original data
  }

  if (filterValues.value.length === 0) {
    // Restore original data when filter is cleared
    tableData.value = [...originalTableData.value];
    features.value = deepClone(originalFeatures.value);
  } else {
    // Filter `tableData`
    tableData.value = originalTableData.value.filter(item =>
      filterValues.value.includes(item[filterField.value])
    );

    // Filter `features.value` based on `filterValues`
    features.value = originalFeatures.value.filter(feature =>
      filterValues.value.includes(feature.properties[filterField.value])
    );
  }
}, { immediate: true, deep: true });



//-----*-----------------Import data ------------------------//

const uploadModel=ref()
const fieldSet = ref([])
const parentOptions = ref([])
function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}

const getModeldefinition = async () => {
    console.log(uploadModel.value)
    var formData = {}
    formData.model = uploadModel.value
    console.log("gettign fields")


    await getModelSpecs(formData).then((response) => {

      var data = response.data

      var fields = data.filter(function (obj) {
        return (obj.field !== 'id');
      });

      var fields2 = fields.filter(function (obj) {
        return (obj.field !== 'geom');
      });

      console.log("fields:", fields2)
      //health_facility_fields.value = response.data
      fieldSet.value = fields2
    })

    await getModelRelatives(formData).then((response) => {
      console.log(response)
      response.models.forEach(function (relative) {
        var parentOpt = {}
        parentOpt.value = relative.model
        parentOpt.label = toTitleCase(relative.model)
        parentOpt.key = relative.key

        parentOptions.value.push(parentOpt)
      })

      //parentKeys.value.push(response.keys)

      // console.log("keys---->", parentKeys.value)
})

}


 
const infowindow = ref(false); // Will be open when mounted
const selectedFeature = ref(null);

 // Function to handle polygon click
 const xonPolygonClick = (feature) => {
  console.log('onPolygonClick', feature);
  vertices.value=[]
  infowindow.value = true;

  // Set the InfoWindow position based on feature type
  gmapCenter.value = feature.paths
    ? feature.paths[0] // If Polygon, use the first coordinate
    : feature.path
    ? feature.path[Math.floor(feature.path.length / 2)] // If LineString, use midpoint
    : feature.position || { lat: 0, lng: 0 }; // If Point, use its position, fallback to default

    console.log('feature', feature )



 selectedFeature.value = feature;

 selectedFeature.value = { 
  ...feature, 
  properties: Object.fromEntries(
    Object.entries(feature.properties).filter(([_, value]) => value)
  ) 
};

  // Clear previous vertices
  vertices.value = [];

  // Extract vertices from the clicked polygon's paths
  if (feature.paths) {
    feature.paths.forEach(coord => {
      vertices.value.push({
        lat: coord.lat,
        lng: coord.lng
      });
    });
  }
};


 
const closePopup = () => { 
  console.log('close popup')
  infowindow.value=false
  vertices.value = [];

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


// Add refs for animation
const circleOpacity = ref(0.5); // Initial opacity
const circleRadius = ref(20); // Initial radius

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

// Download single attachment via backend (avoids CORS)
const downloadAttachment = async (submissionId, attachmentName) => {
  const token = localStorage.getItem('collectorToken');
  if (!token) {
    ElMessage.warning('Collector token required. Please log in to Collector.');
    return;
  }
  try {
    const response = await downloadSubmissionAttachments({
      project: projectId,
      form: formId,
      token,
      submissionID: submissionId,
      attachmentName,
      responseType: 'blob'
    });
    const blob = response?.data instanceof Blob ? response.data : new Blob([response?.data ?? []]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachmentName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading attachment:', error);
    ElMessage.error('Failed to download attachment');
  }
};

// Bulk download attachments for the currently listed (paginated) records as a single ZIP
const downloadingAttachments = ref(false);
const downloadAttachmentsForList = async () => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  const submissionIds = features.value.slice(start, end).map((f) => {
    const p = f.properties ?? f;
    return p._uuid ?? p.__id;
  }).filter(Boolean);
  if (submissionIds.length === 0) {
    ElMessage.warning('No records with submission IDs on this page');
    return;
  }
  const token = localStorage.getItem('collectorToken');
  if (!token) {
    ElMessage.warning('Collector token required. Please log in to Collector.');
    return;
  }

  // Show loading immediately (covers counting + download)
  downloadingAttachments.value = true;

  // Ask backend for total attachment count for these submissions; backend will
  // return 400 with a helpful message if over the limit (> 100)
  try {
    await countSubmissionsAttachments({
      project: projectId,
      form: formId,
      token,
      submissionIds
    });
  } catch (err) {
    console.error('Error counting attachments:', err);
    // Global axios error handler already showed the backend message
    downloadingAttachments.value = false;
    return;
  }

  try {
    const response = await downloadSubmissionsAttachmentsZip({
      project: projectId,
      form: formId,
      token,
      submissionIds
    });
    const blob = response?.data instanceof Blob ? response.data : new Blob([response?.data ?? []]);
    if (blob.size === 0) {
      ElMessage.warning('No attachments found for this page');
      return;
    }
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attachments_${formId}_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    ElMessage.success('Attachments downloaded as ZIP');
  } catch (e) {
    console.error('Error downloading attachments zip:', e);
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    ElMessage.error(msg || 'Failed to download attachments');
  } finally {
    downloadingAttachments.value = false;
  }
};

 

// Add loading state for attachments
const loadingAttachments = ref({});

// Fetch attachments list via backend (avoids CORS)
const getAttachments = async (submissionId) => {
  if (loadingAttachments.value[submissionId]) {
    return loadingAttachments.value[submissionId];
  }
  const token = localStorage.getItem('collectorToken');
  loadingAttachments.value[submissionId] = [];
  if (!token) {
    return [];
  }
  try {
    const res = await getSubmissionAttachments({
      project: projectId,
      form: formId,
      token,
      submissionID: submissionId
    });
    const list = (res?.attachments && Array.isArray(res.attachments)) ? res.attachments : [];
    loadingAttachments.value[submissionId] = list;
    return list;
  } catch (err: unknown) {
    // 404 = no attachments, other errors = log and return []
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status !== 404) {
      console.error('Error fetching attachments:', err);
    }
    loadingAttachments.value[submissionId] = [];
    return [];
  }
};

// Add interface for table row
interface TableRow {
  [key: string]: any;
  attachments: Array<{ name: string; exists: boolean }>;
}

// Modify the table data mapping with proper typing
tableData.value = features.value.map((feature) => {
  const properties = feature.properties ? feature.properties : feature;
  const row: TableRow = {
    attachments: []
  };
  
  // Loop through the selected fields and assign values from properties
  selectedFields.value.forEach((key) => {
    row[key] = properties[key] || "-";
  });

  // Add attachments column with loading state
  if (properties._uuid) {
    row.attachments = loadingAttachments.value[properties._uuid] || [];
    // Fetch attachments if not already loaded
    if (!loadingAttachments.value[properties._uuid]) {
      getAttachments(properties._uuid);
    }
  }
  
  return row;
});
// Handle polygon click event
const onPolygonClick = async (feature) => {
  console.log('handlePolygonClick', feature);
  vertices.value = [];
  infowindow.value = true;

  gmapCenter.value = feature.paths
    ? feature.paths[0]
    : feature.path
    ? feature.path[Math.floor(feature.path.length / 2)]
    : feature.position || { lat: 0, lng: 0 };

  selectedFeature.value = feature;
  selectedFeature.value = { 
    ...feature, 
    properties: Object.fromEntries(
      Object.entries(feature.properties).filter(([_, value]) => value)
    ) 
  };

  // Load attachments if available
  if (selectedFeature.value.properties.__id) {
    selectedFeature.value.properties.attachments = await getAttachments( selectedFeature.value.properties.__id);
  }

  console.log('selectedFeature.value,',selectedFeature.value)
  // Clear previous vertices

  vertices.value = [];

  if (feature.paths) {
    feature.paths.forEach(coord => {
      vertices.value.push({
        lat: coord.lat,
        lng: coord.lng
      });
    });
  }
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
v-model="selectedFields" multiple  filterable clearable placeholder="Select properties to display"
              :collapse-tags="true" style="margin-bottom: 10px; width: 25%; margin-right: 10px;" class="select-properties">
              <el-option v-for="(value, key) in allProperties" :key="key" :label="key" :value="key" />
            </el-select>

            <el-select
v-model="filterField" filterable  clearable placeholder="Filter By" :onChange="handleSelectFilterField"
              :collapse-tags="true" style="margin-bottom: 10px;  margin-right: 10px; width: 15%;" class="select-properties">
              <el-option v-for="(item, key) in selectedFieldOptions" :key="key" :label="item.value" :value="item.value" />
            </el-select>

            <el-select
v-model="filterValues" filterable multiple clearable placeholder="Filter Values"
                  :collapse-tags="true" style="margin-bottom: 10px; margin-right: 10px; width: 15%;" 
                  class="select-properties">
                <el-option
v-for="(option, index) in filterOptions" 
                          :key="index" 
                          :label="option.label" 
                          :value="option.value" />
              </el-select>

              <el-select
v-model="uploadModel" filterable multiple clearable placeholder="Import to"
                  :collapse-tags="true" style="margin-bottom: 10px; margin-right: 14px; width: 15%;" 
                  class="select-properties">
                <el-option
v-for="(option, index) in uploadOptions" 
                          :key="index" 
                          :label="option.label" 
                          :value="option.value" />
              </el-select>

              <el-tooltip content="Add Project" placement="top">
                <PermissionWrapper :permissions="'survey:import'">
                  <el-button v-if="uploadModel" @click="getModeldefinition" type="success" :icon="Upload" style="margin-right: 14px;" />
                </PermissionWrapper>
              </el-tooltip>
             <PermissionWrapper :permissions="'survey:export'">
               <DownloadCustom :data="paginatedData" :all="tableData" style="margin-bottom: 10px; margin-right: 14px; width: 15%;"  />
               <ElButton
                 type="primary"
                 :loading="downloadingAttachments"
                 style="margin-bottom: 10px; margin-right: 14px; margin-left: 4px;"
                 @click="downloadAttachmentsForList"
               >
                 Download attachments
               </ElButton>
             </PermissionWrapper>



          </el-row>
     
        
            <el-table-v2
              v-if="paginatedData.length > 0"
              :columns="[...tableColumns, {
                key: 'attachments',
                dataKey: 'attachments',
                title: 'Attachments',
                width: 150,
                align: 'left',
                cellRenderer: ({ rowData }) => {
                  if (rowData.attachments && rowData.attachments.length > 0) {
                    return h('div', [
                      h(PermissionWrapper, { permissions: 'survey:export' }, () => 
                        h('el-button', {
                          type: 'primary',
                          size: 'small',
                          onClick: () => {
                            rowData.attachments.forEach(attachment => {
                              downloadAttachment(rowData.__id, attachment.name);
                            });
                          }
                        }, 'Download All')
                      )
                    ]);
                  }
                  return '-';
                }
              }]"
              :data="paginatedData"
              :width="tableWidth"            
              :height=400
              :fixed="true"
              :bordered="true"
              :stripe="true"
            />

            <!-- Show message when no data -->
            <div v-else class="no-data-message">
              <el-empty description="No survey data available" />
            </div>
      
       
    

          <div style="margin-top: 20px;" v-if="paginatedData.length > 0">
            <!-- Pagination component -->
            <el-pagination
:layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'" v-model:currentPage="currentPage"
              v-model:page-size="pageSize" :page-sizes="[5, 10, 15, 20, 50, 100, 500]" :total="totalItems" :background="true"
              @size-change="handlePageSizeChange" @current-change="handlePageChange" class="mt-4"
      :small="isMobile"
      :pager-count="isMobile ? 3 : 7" />
          </div>
        </el-card>
      </el-tab-pane>
      <!-- <el-tab-pane label="Map" name="map" :disabled="disableMap">
        <div id="mapContainer" class="basemap"></div>
        
      </el-tab-pane> -->

      <el-tab-pane label="Map" name="gmap" :disabled="disableMap">
        <div id="GooglemapContainer" class="basemap">
 
 
          <GoogleMap
              :styles="GOOGLE_MAP_DECLUTTER_STYLES"
              :api-key="GOOGLE_MAPS_API_KEY"
              style="width: 100%; height: 100%"
              :center="gmapCenter"
              :zoom="10"
              ref="gmap"
            >
              <Polygon
                v-for="polygon in polygons"
                :key="polygon.id"
                :options="polygon"
                @click="onPolygonClick(polygon)"
              />
              
              <Polyline
                v-for="line in polylines"
                :key="line.id"
                :options="line"
                @click="onPolygonClick(line)"
              />
              

              <CustomMarker  
                v-for="(vertex, index) in vertices" 
                :key="index" 
                :options="{ position: vertex, anchorPoint: 'BOTTOM_CENTER' }"
              >
                <div 
                  style="
                    width: 10px; 
                    height: 10px; 
                    background-color: red; 
                    border-radius: 50%;
                    border: 2px solid white;
                  "
                ></div>
              </CustomMarker>


              <MarkerCluster>
              <Marker
                v-for="(location, i) in markers"
                :key="i"
                :options="{ position: location.position }"
                @click="onPolygonClick(location)"
              />
            </MarkerCluster>

            <Circle
                v-if="userLocation"
                :options="{
                  center: userLocation,
                  radius: 1,
                  fillColor: '#4285F4',
                  fillOpacity: 0.5,
                  strokeColor: '#4285F4',
                  strokeOpacity: 1,
                  strokeWeight: 2
                }"
              />

        <Marker v-if="userLocation" :options="userLocationMarker" />

              <InfoWindow v-if="infowindow" @closeclick="closePopup" :options="{ position: gmapCenter }">
              <div style="max-width: 400px; height:250px">
                <el-table :data="Object.entries(selectedFeature?.properties || {})" border style="width: 100%;">
                  <el-table-column prop="0" label="Property" width="120" />
                  <el-table-column prop="1" label="Value"  width="250"/>
                </el-table>
                
                <!-- Add attachments section -->
                <div   style="margin-top: 10px;">
                  <h4>Attachments</h4>
                  <PermissionWrapper :permissions="'survey:export'">
                    <div v-for="attachment in selectedFeature.properties.attachments" :key="attachment.name" style="margin: 5px 0;">
                      <el-button 
                        type="primary" 
                        size="small" 
                        @click="downloadAttachment(selectedFeature.properties.__id, attachment.name)"
                      >
                        Download {{ attachment.name }}
                      </el-button>
                    </div>
                  </PermissionWrapper>
                </div>
              </div>
            </InfoWindow>


            </GoogleMap>
        
            <ElButton  circle  title="Locate Me"   class="geolocate-btn" plain  @click="locateMe">
            <Icon   icon= "mage:location-fill"/>
          </ElButton>

        </div>
      </el-tab-pane>

      <!-- New Cart Tab -->
      <el-tab-pane label="Charts" name="chart">
        <el-card v-loading="loading">
          <el-row type="flex" justify="start" gutter="10">
            
            <el-select
v-model="selectedFields" :onChange="handleChangeFields"  multiple clearable placeholder="Select Fields"
              :collapse-tags="true" style="margin-right: 10px; width: 25%;" class="select-properties">
              <el-option v-for="(value, key) in allProperties" :key="key" :label="key" :value="key" />
            </el-select>

            <el-select  :onChange="generateReport" v-model="typeChart" clearable placeholder="Type of Chart" style="margin-bottom: 10px; margin-right: 10px;  width: 25%;">
                <el-option v-for="item in chartOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>

            <el-select
v-model="computationMethod"   placeholder="Computation Method"
              :collapse-tags="true" style="margin-bottom: 10px; margin-right: 10px;  width: 25%;"
              class="select-properties" :onChange="generateReport">
              <el-option v-for="item in computationOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>

          </el-row>
          <el-row :gutter="20">
              <el-col 
                v-for="(chart, index) in customCharts" 
                :key="index" 
                :span="12" 
                :xl="12" 
                :lg="12" 
                :md="12" 
                :sm="24" 
                :xs="24"
              >
                <div>
                  <el-card style="margin:5px">
                    <v-chart 
                      class="chart" 
                      :option="chart" 
                      style="width: 100%; height: 400px;" 
                      autoresize 
                    />
                  </el-card>
                </div>
              </el-col>
            </el-row>


        </el-card>
      </el-tab-pane>
    </el-tabs>
  </el-card>

</template>


<style scoped>
.chart {
  height: 40vh;
}

.no-data-message {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  margin: 20px 0;
}
</style >


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

.geolocate-btn {
  position: absolute;
  top: 30px;
  right: 70px;
  z-index: 1000;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
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

<style scoped>
.chart-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 2 columns */
  gap: 20px; /* Space between charts */
  padding: 20px;
}

.chart-item {
  width: 100%;
  height: 400px; /* Adjust height as needed */
}

.chart {
  width: 100%;
  height: 100%;
}
</style>