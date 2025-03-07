<script setup lang="ts">
import { Descriptions } from '@/components/Descriptions'
import { useI18n } from '@/hooks/web/useI18n'
import { onMounted, defineAsyncComponent, ref, reactive, unref, computed } from 'vue'
import { Form } from '@/components/Form'
import {
  ElInput, ElButton, ElTabPane, ElTabs, ElCard, ElTable, ElTableColumn, ElMessage, ElSteps, ElInputNumber,
  ElIcon, ElPopconfirm, ElDialog, ElForm, ElFormItem, ElSelectV2, ElText, ElDatePicker, ElStep,
} from 'element-plus'
import { useValidator } from '@/hooks/web/useValidator'
import { useForm } from '@/hooks/web/useForm'
import { useRoute } from 'vue-router'
import {
  getOneGeo,
  getOneSettlement,
  getSettlementListByCounty,
  getfilteredGeo
} from '@/api/settlements'
import { Back, Upload, Search, View, Edit, More, RefreshLeft } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { getFile } from '@/api/summary'

// Locally
import '@dafcoe/vue-collapsible-panel/dist/vue-collapsible-panel.css'
import UploadComponent from '@/views/Components/UploadComponent.vue';
import type { UploadProps, UploadUserFile } from 'element-plus'
import type { FormInstance } from 'element-plus'


import { ElCollapseTransition, ElDescriptions, ElDescriptionsItem, ElTooltip } from 'element-plus'


import { useDesign } from '@/hooks/web/useDesign'
import { propTypes } from '@/utils/propTypes'


import "mapbox-layer-switcher/styles.css";
import * as turf from '@turf/turf'
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'


import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'


import { useCache } from '@/hooks/web/useCache'
import { useAppStoreWithOut } from '@/store/modules/app'
import { uuid } from 'vue-uuid'
import { CreateRecord, DeleteRecord, revertHistory } from '@/api/settlements'
const { push } = useRouter()




const { wsCache } = useCache()
const appStore = useAppStoreWithOut()


const MapBoxToken = 'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = MapBoxToken;



const route = useRoute()

const { t } = useI18n()

const housing = reactive({
  no_dwelling: '45',
  pop_density: '10',
  ave_hh_size: '6',
  ave_room_occupancy: '4',
  prop_permanent: '45%',
  prop_semi: '20%',
  prop_temp: '35%',
  avg_cost_perm: '2500',
  avg_cost_semi: '1500',
  avg_cost_temp: '1000'
})

const utilities = reactive({
  prop_avail_piped_water: '25%',
  prop_other_water: '75%',
  prop_conn_elec: '45%',
  prop_conn_other_elec: '55%',
  prop_lpg: '20%',
  prop_firewood: '25%',
  prop_kerosene: '45%',
  prop_biogas: '10%',
  prop_elec: '0%'
})

const schemaProfile = reactive<DescriptionsSchema[]>([
  {
    field: 'name',
    label: t('Name')
  },
  {
    field: 'type',
    label: t('Type')
  },
  {
    field: 'county',
    label: t('County')
  },
  {
    field: 'subcounty',
    label: t('SubCounty')
  },

  {
    field: 'population',
    label: t('Population')
  },
  {
    field: 'area_ha',
    label: t('Area(Ha.)')
  },

  {
    field: 'description',
    label: t('Description'),
    span: 40
  }
])

const schemaHousing = reactive<DescriptionsSchema[]>([
  {
    field: 'no_dwelling',
    label: t('Number of Dwellings')
  },

  {
    field: 'pop_density',
    label: t('Population Density')
  },

  {
    field: 'ave_hh_size',
    label: t('Average Household Size')
  },

  {
    field: 'ave_room_occupancy',
    label: t('Average Room Occupancy')
  },

  {
    field: 'prop_permanent',
    label: t('Proportion of Permanent Structures')
  },
  {
    field: 'prop_semi',
    label: t('Proportion of Semi-Permanent Structures')
  },
  {
    field: 'prop_temp',
    label: t('Proportion of Temporary Structures')
  },
  {
    field: 'avg_cost_perm',
    label: t('Average Monthly Rent for Permanent Structures')
  },

  {
    field: 'avg_cost_semi',
    label: t('Average Monthly Rent for Semi-Permanent Structures')
  },

  {
    field: 'avg_cost_temp',
    label: t('Average Monthly Rent for Temporary Structures')
  }
])

const schemaUtilities = reactive<DescriptionsSchema[]>([
  {
    field: 'prop_avail_piped_water',
    label: t('Proportion of Residents with access to Piped Water')
  },
  {
    field: 'prop_other_water',
    label: t('Proportion of Residents without access to Piped Water')
  },
  {
    field: 'prop_conn_elec',
    label: t('Proportion of Residents with access to Electricity')
  },

  {
    field: 'prop_conn_other_elec',
    label: t('Proportion of Residents without access to Electricity')
  },

  {
    field: 'prop_lpg',
    label: t('Proportion of Residents using LPG gas')
  },

  {
    field: 'prop_firewood',
    label: t('Proportion of Residents using Firewood')
  },

  {
    field: 'prop_biogas',
    label: t('Proportion of Residents using Biogas')
  },

  {
    field: 'prop_kerosene',
    label: t('Number of Dwellings')
  },

  {
    field: 'prop_elec',
    label: 'Proportion of Residents using Electricity(Cooking)'
  }
])


const page = ref(1)
const pSize = ref(5)
////Configurations //////////////

//// ------------------parameters -----------------------////
var filters = ['id']
const id = route.params.id
var intervenComponent = [id] // the Id of the settleemnt to filter with
var filterValues = [intervenComponent]

//const associated_Model = ''
const associated_multiple_models = ['settlement_status', 'county', 'subcounty', 'ward', 'document']
const model = 'settlement'

const nested_models = ['document', 'document_type'] // The mother, then followed by the child
const settGeom = ref()

//// ------------------parameters -----------------------////

const settlementDocuments = ref([])


let settlement = reactive({
  count: 0,
  name: 'unnwo',
  flag: false
})
////////////

const profile = reactive({
  name: '',
  county: '',
  subcounty: '',
  type: 'Slum',
  description:
    'Kibera (Kinubi: Forest or Jungle[1]) is a division of Nairobi Area, Kenya, and neighborhood of the city of Nairobi, 6.6 kilometres (4.1 mi) from the city centre.[2] Kibera is the largest slum in Nairobi, and the largest urban slum in Africa.[3][4][5] The 2009 Kenya Population and Housing Census reports Kiberas population as 170,070, contrary to previous estimates of one or two million people.[6] ',
  area_ha: '',
  population: ''
})

function flattenObject(obj, parentKey = '', separator = '.') {
  return Object.keys(obj).reduce((acc, key) => {
    const fullKey = parentKey ? `${parentKey}${separator}${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(acc, flattenObject(obj[key], fullKey, separator));
    } else {
      acc[fullKey] = obj[key];
    }
    return acc;
  }, {});
}


const editHistory = ref([])
const getFilteredData = async (selFilters, selfilterValues) => {
  const formData = {}
  formData.limit = pSize.value
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  //formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = selFilters
  formData.filterValues = selfilterValues
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = nested_models
  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  // set the settlement details ------------------------------------

  console.log('After Querry', res)

  // set the settlement profile  details ------------------------------------
  profile.id = res.data[0].id
  profile.name = res.data[0].name
  profile.county = res.data[0].county.name
  profile.subcounty = res.data[0].subcounty.name
  profile.area_ha = res.data[0].area
  profile.population = res.data[0].population
  profile.description = res.data[0].description
  settGeom.value = res.data[0].geom

  //

  //settlementDocuments.value = flattenObject(res.data.documents)

  // Assuming your array is res.data[0].documents
  const nestedArray = res.data[0].documents;

  // Edit History 

  //editHistory.value = res.data[0].settlement_histories


  // Flatten each object in the array
  settlementDocuments.value = nestedArray.map(doc => flattenObject(doc));

  console.log('settlementDocuments.value', settlementDocuments.value)
  // set the settlement hosuing  details ------------------------------------
  var latestReportIndex = res.data[0].settlement_statuses.length - 1 // We get the number of reports so that we can pick the most recent

  housing.no_dwelling = res.data[0].settlement_statuses[latestReportIndex].no_dwelling
  housing.pop_density = res.data[0].settlement_statuses[latestReportIndex].pop_density
  housing.ave_room_occupancy = res.data[0].settlement_statuses[latestReportIndex].ave_room_occupancy
  housing.ave_hh_size = res.data[0].settlement_statuses[latestReportIndex].ave_hh_size
  housing.prop_permanent = res.data[0].settlement_statuses[latestReportIndex].prop_permanent + '%'
  housing.prop_semi = res.data[0].settlement_statuses[latestReportIndex].prop_semi + '%'
  housing.prop_temp = res.data[0].settlement_statuses[latestReportIndex].prop_temp
  housing.avg_cost_perm = res.data[0].settlement_statuses[latestReportIndex].avg_cost_perm
  housing.avg_cost_semi = res.data[0].settlement_statuses[latestReportIndex].avg_cost_semi
  housing.avg_cost_temp = res.data[0].settlement_statuses[latestReportIndex].avg_cost_temp

  // set the utilities  details ------------------------------------
  utilities.prop_avail_piped_water =
    res.data[0].settlement_statuses[latestReportIndex].prop_other_water + '%'
  utilities.prop_other_water =
    res.data[0].settlement_statuses[latestReportIndex].prop_other_water + '%'
  utilities.prop_conn_elec = res.data[0].settlement_statuses[latestReportIndex].prop_conn_elec + '%'
  utilities.prop_lpg = res.data[0].settlement_statuses[latestReportIndex].prop_lpg + '%'
  utilities.prop_other_water =
    res.data[0].settlement_statuses[latestReportIndex].prop_other_water + '%'
  utilities.prop_conn_elec = res.data[0].settlement_statuses[latestReportIndex].prop_conn_elec + '%'
  utilities.prop_lpg = res.data[0].settlement_statuses[latestReportIndex].prop_lpg + '%'
  utilities.prop_firewood = res.data[0].settlement_statuses[latestReportIndex].prop_firewood + '%'
  utilities.prop_kerosene = res.data[0].settlement_statuses[latestReportIndex].prop_kerosene + '%'
  utilities.prop_biogas = res.data[0].settlement_statuses[latestReportIndex].prop_biogas + '%'
  utilities.prop_elec = res.data[0].settlement_statuses[latestReportIndex].prop_elec + '%'
}

onMounted(async () => {


  getFilteredData(filters, filterValues)
  await getIndicatorCategoryReports(route.params.id)
  await getSettlmentHistory(route.params.id)
  await getProjectLocations(route.params.id)
  console.log(settlement)
})

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

const activeName = ref('profile')

const viewLoading = ref(false)

const downloadFile = async (data) => {
  console.log(data);
  viewLoading.value = true;
  const formData = {};
  formData.filename = data.name;
  formData.doc_id = data.id;
  formData.responseType = 'blob';

  // Add a flag to track if the download has started


  // Attach a 'beforeunload' event listener to the window
  window.addEventListener('beforeunload', () => {
    if (viewLoading.value) {
      console.log('Download has started.');
      viewLoading.value = false;
    }
  });

  try {
    const response = await getFile(formData);
    console.log(response);

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', data.name);
    document.body.appendChild(link);
    link.click();
    viewLoading.value = false;
  } catch (error) {
    ElMessage.error('Failed');
    viewLoading.value = false;
  }
};





/// Uplaod docuemnts from a central component 
const addMoreDocuments = ref(false)
const currentRow = ref()
const mfield = 'settlement_id'
const ChildComponent = defineAsyncComponent(() => import('@/views/Components/UploadComponent.vue'));
const dynamicComponent = ref();
const componentProps = ref({
  message: 'Hello from parent',
  showDialog: addMoreDocuments,
  data: currentRow.value,
  umodel: model,
  field: mfield
});

function toggleComponent() {
  console.log('model data', model)
  console.log('Compnnent data', profile)

  componentProps.value.showDialog = true
  componentProps.value.data = profile


  dynamicComponent.value = null; // Unload the component
  addMoreDocuments.value = true; // Set any additional props

  setTimeout(() => {
    dynamicComponent.value = ChildComponent; // Load the component
  }, 100); // 0.1 seconds
}







const icon = ref(`<button>  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4.97883 9.68508C2.99294 8.89073 2 8.49355 2 8C2 7.50645 2.99294 7.10927 4.97883 6.31492L7.7873 5.19153C9.77318 4.39718 10.7661 4 12 4C13.2339 4 14.2268 4.39718 16.2127 5.19153L19.0212 6.31492C21.0071 7.10927 22 7.50645 22 8C22 8.49355 21.0071 8.89073 19.0212 9.68508L16.2127 10.8085C14.2268 11.6028 13.2339 12 12 12C10.7661 12 9.77318 11.6028 7.7873 10.8085L4.97883 9.68508Z" fill="#1C274C"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M2 8C2 8.49355 2.99294 8.89073 4.97883 9.68508L7.7873 10.8085C9.77318 11.6028 10.7661 12 12 12C13.2339 12 14.2268 11.6028 16.2127 10.8085L19.0212 9.68508C21.0071 8.89073 22 8.49355 22 8C22 7.50645 21.0071 7.10927 19.0212 6.31492L16.2127 5.19153C14.2268 4.39718 13.2339 4 12 4C10.7661 4 9.77318 4.39718 7.7873 5.19153L4.97883 6.31492C2.99294 7.10927 2 7.50645 2 8Z" fill="#1C274C"></path> <path opacity="0.7" d="M5.76613 10L4.97883 10.3149C2.99294 11.1093 2 11.5065 2 12C2 12.4935 2.99294 12.8907 4.97883 13.6851L7.7873 14.8085C9.77318 15.6028 10.7661 16 12 16C13.2339 16 14.2268 15.6028 16.2127 14.8085L19.0212 13.6851C21.0071 12.8907 22 12.4935 22 12C22 11.5065 21.0071 11.1093 19.0212 10.3149L18.2339 10L16.2127 10.8085C14.2268 11.6028 13.2339 12 12 12C10.7661 12 9.77318 11.6028 7.7873 10.8085L5.76613 10Z" fill="#1C274C"></path> <path opacity="0.4" d="M5.76613 14L4.97883 14.3149C2.99294 15.1093 2 15.5065 2 16C2 16.4935 2.99294 16.8907 4.97883 17.6851L7.7873 18.8085C9.77318 19.6028 10.7661 20 12 20C13.2339 20 14.2268 19.6028 16.2127 18.8085L19.0212 17.6851C21.0071 16.8907 22 16.4935 22 16C22 15.5065 21.0071 15.1093 19.0212 14.3149L18.2339 14L16.2127 14.8085C14.2268 15.6028 13.2339 16 12 16C10.7661 16 9.77318 15.6028 7.7873 14.8085L5.76613 14Z" fill="#1C274C"></path> </g></svg></button>`)

const showSatellite = ref(false)

const toggleFloatingDiv = async () => {
  showSatellite.value = !showSatellite.value;
  console.log('Show Satellite', showSatellite.value);

  // Get the map style
  let style = nmap.value.getStyle();

  // Get all layers
  let allLayers = style.layers;

  // Log all layers to the console
  console.log('before ', allLayers);



  if (!showSatellite.value) {
    console.log('Remove Satellte');
    if (nmap.value.getLayer('Satellite')) {
      nmap.value.removeLayer('Satellite');
      nmap.value.removeSource('Satellite');

    }


  } else {

    console.log('Add Satellte');



    if (nmap.value.getLayer('Satellite')) {
      nmap.value.removeLayer('Satellite');
      nmap.value.removeSource('Satellite');

    } else {

      icon.value = `<button>  <svg viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="si-glyph si-glyph-satellite" fill="#f20707"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>650</title> <defs> </defs> <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g fill="#fb0e0e"> <path d="M12.495,5.893 C12.832,6.231 14.184,4.877 13.847,4.541 L10.864,1.557 C10.526,1.219 9.174,2.573 9.51,2.909 L12.495,5.893 L12.495,5.893 Z" class="si-glyph-fill"> </path> <path d="M3.288,10.897 C3.072,10.68 2.597,10.802 2.23,11.168 C1.863,11.536 1.742,12.009 1.959,12.228 L3.233,13.501 C3.45,13.719 3.922,13.597 4.289,13.23 C4.658,12.864 4.779,12.388 4.562,12.172 L3.288,10.897 L3.288,10.897 Z" class="si-glyph-fill"> </path> <rect transform="translate(2.240100, 2.131300) rotate(-44.991897) translate(-2.240100, -2.131300) " x="-0.25987605" y="1.13130958" width="4.96295245" height="1.95398128" class="si-glyph-fill"> </rect> <path d="M12.088,8.374 L10.657,9.802 L9.918,9.063 L11.543,7.439 C11.814,7.168 11.81,6.723 11.531,6.447 L9.031,3.948 C8.757,3.673 8.314,3.67 8.043,3.939 L6.419,5.564 L5.684,4.829 L7.113,3.401 L5.718,2.007 L2.221,5.503 L3.614,6.897 L5.028,5.484 L5.763,6.219 L4.134,7.849 C3.864,8.12 3.866,8.564 4.141,8.838 L6.641,11.336 C6.917,11.612 7.363,11.617 7.632,11.346 L9.262,9.717 L10.001,10.456 L8.585,11.869 L9.967,13.25 L13.464,9.753 L12.088,8.374 L12.088,8.374 Z" class="si-glyph-fill"> </path> <rect transform="translate(13.426200, 12.673100) rotate(-45.056720) translate(-13.426200, -12.673100) " x="10.9262228" y="11.6731091" width="4.96795479" height="1.97998198" class="si-glyph-fill"> </rect> </g> </g> </g></svg> </button>`

      nmap.value.addLayer(
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
  style = nmap.value.getStyle();

  // Get all layers
  allLayers = style.layers;

  // Log all layers to the console
  console.log('after', allLayers);

}




const nmap = ref()

const loadMap = () => {
  if (nmap.value) {
    nmap.value.remove(); // Remove existing map instance if it exists
  }
  // Assuming settGeom is a GeoJSON Feature object with geometry type like Polygon or MultiPolygon
  const centroid = turf.centroid(settGeom.value);
  const mapCenter = centroid.geometry.coordinates;

  nmap.value = new mapboxgl.Map({
    container: "mapContainer",
    style: "mapbox://styles/mapbox/streets-v12",
    center: mapCenter, // starting position
    zoom: 15,
  });




  nmap.value.on("load", () => {



    nmap.value.addLayer({
      id: 'labels',
      type: 'symbol',
      source: {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: centroid.value, // Replace with initial coordinates
              },
              properties: {
                title: profile.area_ha + " Ha.", // Initialize with an empty string
              },
            },
          ],
        },
      },
      layout: {
        'text-field': ['get', 'title'],
        'text-size': 16,
        'text-anchor': 'top',
      },
      paint: {
        'text-color': '#FF0000', // Red text color
        'text-halo-color': '#FFFFFF', // White halo color
        'text-halo-width': 2, // Adjust the halo width as needed    
      },


    });



    nmap.value.addLayer({
      id: "Streets",
      source: { type: "raster", url: "mapbox://mapbox.streets", tileSize: 256 },
      type: "raster",
    });

    nmap.value.setLayoutProperty("Satellite", "visibility", "none");


    // Add point layer
    nmap.value.addLayer({
      id: 'point-layer',
      type: 'circle',
      source: {
        type: 'geojson',
        data: settGeom.value,
      },
      paint: {
        'circle-color': 'red',
        'circle-radius': 6,
      },
      filter: ['==', '$type', 'Point'],
    });



    // Add line layer
    nmap.value.addLayer({
      id: 'line-layer',
      type: 'line',
      source: {
        type: 'geojson',
        data: settGeom.value, // Make sure settGeom.value contains a LineString
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': 'blue', // Change color as needed
        'line-width': 2, // Adjust line width
      },
      filter: ['==', '$type', 'LineString'], // Filter for LineString type
    });

    // Add polygon layer with a dotted red line and no fill
    nmap.value.addLayer({
      id: 'poly-layer',
      type: 'line', // Use 'line' type for outlines
      source: {
        type: 'geojson',
        data: settGeom.value, // Ensure settGeom.value contains a Polygon
      },
      layout: {
        'line-cap': 'round',  // Rounded line ends
        'line-join': 'round', // Rounded corners
      },
      paint: {
        'line-color': 'red', // Line color is red
        'line-width': 2, // Line width
        'line-dasharray': [4, 2], // Create a dotted line pattern (4px dash, 2px gap)
      },
      filter: ['==', '$type', 'Polygon'], // Filter for Polygon type
    });




    // Center the map on the point
    nmap.value.setCenter(mapCenter); // Use the point coordinates directly

    //  nmap.value.addControl(new MapboxLayerSwitcherControl(layers));
    const nav = new mapboxgl.NavigationControl();
    nmap.value.addControl(nav, "top-right");
    nmap.value.resize();
  });



  function updateRuleform(feature) {
    // do something with the new marker feature
    var crs = { type: 'name', properties: { name: 'EPSG:4326' } }
    feature.geometry.crs = crs
    console.log('----feature', feature);

    const formData = {}

    formData.geom = feature.geometry
    console.log(formData)
    formData.land_size = calculateArea(feature.geometry)
    area_ha.value = calculateArea(feature.geometry)

    var centre = turf.centroid(feature.geometry);
    centroid.value = centre.geometry.coordinates

    console.log('centroid.value', centroid)

    nmap.value.getSource('labels').setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: centroid.value, // Update with the actual coordinates
          },
          properties: {
            title: area_ha.value + " Ha.", // Update with the desired label text (area)
          },
        },
      ],
    });

  }

  // listen for the draw.create event
  nmap.value.on('draw.create', function (e) {
    // check if the new feature is a marker
    // if (e.features[0].geometry.type === 'Polygon') {
    // trigger your function here
    updateRuleform(e.features[0]);

    //  }
  });



  function addInfo(map) {
    class LayerButton {
      onAdd() {
        const div = document.createElement("div");
        div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
        div.innerHTML = icon.value;
        div.addEventListener("contextmenu", (e) => e.preventDefault());
        div.addEventListener("click", () => toggleFloatingDiv());

        return div;
      }
    }
    const lryButton = new LayerButton();
    nmap.value.addControl(lryButton, "top-right");
  }
  addInfo(nmap)



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




const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('descriptions')


const collapsedSections = ref({}); // Track collapse state for each type

// Group documents by `document_type.type`
const groupedDocuments = computed(() => {
  return settlementDocuments.value.reduce((groups, doc) => {
    const type = doc["document_type.type"] || "Unknown";
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(doc);
    return groups;
  }, {});
});


const searchQuery = ref('')
// Filter and group documents by `document_type.type`
const filteredGroupedDocuments = computed(() => {
  const query = searchQuery.value.toLowerCase();

  // Filtered documents by search query across the 'name' property only
  const filteredDocs = Object.entries(groupedDocuments.value).reduce((acc, [category, docs]) => {
    const filteredDocsForCategory = docs.filter(doc =>
      doc.name && doc.name.toLowerCase().includes(query) // Check if 'name' includes the query
    );

    if (filteredDocsForCategory.length > 0) {
      acc[category] = filteredDocsForCategory;
    }

    return acc;
  }, {});

  return filteredDocs;
});





// Toggle collapse state for a specific type
const toggleCollapse = (type) => {
  collapsedSections.value[type] = !collapsedSections.value[type];
};

function makePlural(word) {
  // Check if the word is already plural
  if (isPlural(word)) {
    return word;  // If it's already plural, return the word as is
  }

  // Apply regular pluralization rules if it's not plural
  if (word.endsWith("y") && !/aeiou/.test(word[word.length - 2])) {
    // Change y to ies (e.g., city -> cities)
    return word.slice(0, -1) + "ies";
  } else if (word.endsWith("s") || word.endsWith("x") || word.endsWith("z") || word.endsWith("ch") || word.endsWith("sh")) {
    // Add es (e.g., box -> boxes)
    return word + "es";
  } else {
    // Add s for most cases (e.g., cat -> cats)
    return word + "s";
  }
}

function isPlural(word) {
  // Regular expression to check if a word ends with common plural endings
  const pluralPattern = /(s|es|ies)$/i;
  return pluralPattern.test(word);
}


function formatDate(dateString) {
  const dateObj = new Date(dateString);

  // Extract date components
  const year = dateObj.getUTCFullYear();
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getUTCDate()).padStart(2, '0');

  // Extract time components and convert to 12-hour format
  let hours = dateObj.getUTCHours()+3;
  const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert to 12-hour format (0 becomes 12)

  // Combine date and time
  return `${year}-${month}-${day} ${hours}:${minutes}  ${ampm}`;
}



const indicatorReports = ref([])

const getIndicatorCategoryReports = async (projectId) => {

  const model = 'indicator_category_report'
  const associated_multiple_models = ['document', 'project', 'county', 'subcounty', 'ward', 'users', 'indicator_category', 'document']
  //const nested_models = ['indicator_category', 'indicator'] // The mother, then followed by the child
  const nested_models = ['activity', 'project']  // The mother, then followed by the child 

  const formData = {}
  formData.model = model
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.excludeGeom = false
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = nested_models

  //--Single Filter -----------------------------------------


  // - multiple filters -------------------------------------
  formData.filters = ['settlement_id']
  formData.filterValues = [[route.params.id]]

  //formData.cache_key = 'SeacrchByKey_' + search_string.value

  //-------------------------
  console.log("formData", formData)
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('Reports collected........', projectId)
  indicatorReports.value = res.data



}


function getDifferences(before, after, parentKey = '') {
  const differences = [];

  for (const key in before) {
    const currentKey = parentKey ? `${parentKey}.${key}` : key;

    if (typeof before[key] === 'object' && before[key] !== null) {
      if (Array.isArray(before[key])) {
        // Compare arrays deeply
        if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
          differences.push({
            field: currentKey,
            before: before[key].join(', '),
            after: (after[key] || []).join(', '),
          });
        }
      } else {
        // Recursively compare nested objects
        differences.push(...getDifferences(before[key], after[key] || {}, currentKey));
      }
    } else {
      // Compare primitive values
      if (before[key] !== after[key]) {
        differences.push({
          field: currentKey,
          before: before[key] || '',
          after: after[key] || '',
        });
      }
    }
  }

  return differences;
}





const getSettlmentHistory = async (sett_id) => {

  const model = 'settlement_history'

  const formData = {}
  formData.model = model
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.excludeGeom = false
  formData.associated_multiple_models = ['users']

  //--Single Filter -----------------------------------------


  // - multiple filters -------------------------------------
  formData.filters = ['settlement_id']
  formData.filterValues = [[sett_id]]

  //formData.cache_key = 'SeacrchByKey_' + search_string.value

  //-------------------------
  console.log("formData", formData)
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('History collected........', res.data)
  const rawHistory = res.data;

  // Process the differences for nested properties
  editHistory.value = rawHistory.map((record) => {
    const changes = record.changes;
    const differences = getDifferences(changes.before, changes.after);
    return {
      ...record,
      differences,
    };
  });



}




const tableRowClassName = (data) => {

  if (data.row.status == 'Rejected') {
    return 'danger-row'
  }
  if (data.row.status == 'Approved') {
    return 'success-row'
  }

  return ''
}


const projectStatus = (data) => {

  if (data.row.status == 'Suspended') {
    return 'danger-row'
  }
  if (data.row.status == 'Planned') {
    return 'warning-row'
  }

  if (data.row.status == 'Complete') {
    return 'success-row'
  }

  return ''
}


const AddReport = () => {

  push({
    name: 'PastReports',

  })
}



const Review = (data: TableSlotDefault) => {

  // /add/27?id=85


  // push({
  //   name: 'AddInterventionProjectsV2',
  //   params: { domain: data.row.id }
  // })


  // push({
  //   path: '/interventions/add/:domain',
  //   name: 'AddInterventionProjectsV2',
  //   params: { domain: data.row.id }
  // })

  push({
    path: '/interventions/add/:domain',
    name: 'AddInterventionProjectsV2',
    query: { id: data.row.id },
    params: { id: data.row.id, domain: data.row.component_id }
  })


}







const projects = ref([])

const getProjectLocations = async (settlement_id) => {
  console.log('settlement_id', settlement_id);
  console.log("Get Projects  for  Location : ", settlement_id)

  // Get the project settlement ids
  const formData = {
    model: 'project_location',
    searchField: 'name',
    searchKeyword: '',
    filters: ['settlement_id'],
    filterValues: [[settlement_id]],
    associated_multiple_models: ['project'],
  };

  const res = await getSettlementListByCounty(formData);
  const project_ids = res.data.map(item => item.project); // Extract settlement_id
  console.log('project_ids', project_ids);

  projects.value = project_ids

  console.log("Get project_locations  for    : ", projects.value)


};

const RevertEdits = async (data: TableSlotDefault) => {
  console.log('Reverts.....', data.row)

  const formData = {
    model: 'settlement',
    history_id: data.row.id,
  };

  const res = await revertHistory(formData);
  console.log('Reverts success.....', res.data)


};


const editSettlement = () => {

  push({
    name: 'AddSettlementX',
    query: { id: route.params.id }

  });


}

</script>

<template>
  <el-card>


    <div v-if="dynamicComponent">
      <upload-component :is="dynamicComponent" v-bind="componentProps" />
    </div>


    <!-- Header Section -->
    <template #header>
      <div class="card-header" style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
            Back
          </el-button>
          {{ profile.name }} Settlement, {{ profile.subcounty }} Subcounty, {{ profile.county }} County
        </div>
        <el-button type="success" :icon="Edit" @click="editSettlement">
          Edit
        </el-button>
      </div>
    </template>



    <el-tabs v-model="activeName" class="demo-tabs" type="border-card" @tab-click="clickTab">
      <el-tab-pane label="Profile" name="profile">

        <Descriptions :title="t('Profile')" :message="t('Settlement Profile')" :data="profile"
          :schema="schemaProfile" />


        <Descriptions :title="t('Housing')" :message="t('Settlement Housing')" :data="housing"
          :schema="schemaHousing" />



        <Descriptions :title="t('Utilities')" :message="t('Access to Utilities')" :data="utilities"
          :schema="schemaUtilities" />



      </el-tab-pane>


      <el-tab-pane label="Location" name="map">
        <div id="mapContainer" class="basemap"></div>
      </el-tab-pane>



      <el-tab-pane label="Documents" name="documents">

        <div>
          <!-- Filter Input -->
          <el-input v-model="searchQuery" type="text" placeholder="Search documents..." style="width: 100%"
            :prefix-icon="Search" clearable />

          <div v-for="(docs, type) in filteredGroupedDocuments" :key="type"
            :class="[prefixCls, 'bg-[var(--el-color-white)] dark:(bg-[var(--el-bg-color)] border-[var(--el-border-color)] border-1px)']">
            <!-- Collapsible Header -->
            <div
              :class="[`${prefixCls}-header`, 'h-50px flex justify-between items-center mb-10px border-bottom-1 border-solid border-[var(--tags-view-border-color)] px-10px cursor-pointer dark:border-[var(--el-border-color)]']"
              @click="toggleCollapse(type)">
              <div :class="[`${prefixCls}-header__title`, 'relative font-12px font-bold ml-10px']">
                <div class="flex items-center">
                  {{ makePlural(type) }} ({{ docs.length }})
                </div>
              </div>
              <Icon :icon="collapsedSections[type] ? 'ep:arrow-down' : 'ep:arrow-up'" />
            </div>

            <!-- Collapsible Content -->
            <ElCollapseTransition>
              <div v-show="collapsedSections[type]" :class="[`${prefixCls}-content`, 'p-10px']">
                <el-table :data="docs" style="width: 100%">
                  <el-table-column type="index" width="50" />
                  <el-table-column prop="name" label="Name" />
                  <el-table-column prop="createdAt" label="Uploaded" />
                  <el-table-column fixed="right" label="">
                    <template #default="scope">
                      <el-button plain @click="downloadFile(scope.row)">
                        <Icon icon="fa-solid:download" style="  margin-right: 5px;" />
                        Download
                      </el-button>


                    </template>
                  </el-table-column>
                </el-table>

                <!-- <el-button @click="toggleComponent()" style="margin-top:10px">Upload</el-button> -->

                <el-button @click="toggleComponent()" style="margin-top:10px">
                  Upload<el-icon class="el-icon--right">
                    <Upload />
                  </el-icon>
                </el-button>



              </div>

            </ElCollapseTransition>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Projects" name="Projects">
        <el-card>
          <el-table :data="projects" border :row-class-name="projectStatus">
            <el-table-column type="index" width="50" />
            <el-table-column label="Code" prop="project_code" width="350" sortable />

            <el-table-column label="Project" width="750" sortable>
              <template #default="{ row }">
                <div> <span> {{ row.title }} </span> </div>
              </template>
            </el-table-column>
            <el-table-column label="Status" prop="status" sortable />


            <el-table-column fixed="right" label="Actions">
              <template #default="scope">

                <el-tooltip content="More Details" placement="top">
                  <el-button type="success" size="small" :icon="More" @click="Review(scope as TableSlotDefault)"
                    plain />
                </el-tooltip>



              </template>
            </el-table-column>


          </el-table>
        </el-card>

      </el-tab-pane>


      <el-tab-pane label="Indicators" name="Indicator">
        <el-card>

          <el-button :onClick="AddReport" style="margin-left :5px;margin-bottom :5px; " plain>
            <Icon icon="material-symbols:add" style=" color: green" /> File Report
          </el-button>

          <el-table :data="indicatorReports" border :row-class-name="tableRowClassName" ref="tableRef">


            <el-table-column label="#" width="80" prop="id" sortable>
              <template #default="scope">
                <div v-if="scope.row.documents.length > 0" style="display: inline-flex; align-items: center;">
                  <span>{{ scope.row.id }}</span>
                  <Icon icon="material-symbols:attachment" style="margin-left: 4px;" />
                </div>
              </template>
            </el-table-column>


            <el-table-column label="Indicator  " width="400" sortable>
              <template #default="{ row }">
                <div>
                  <span> {{ row.indicator_category.indicator_name }} {{ row.indicator_category.category_title }} </span>

                </div>
              </template>
            </el-table-column>
            <el-table-column label="Date" prop="date" sortable>
              <template #default="scope">
                {{ formatDate(scope.row.date) }}
              </template>
            </el-table-column>

            <el-table-column label="Amount" prop="amount" sortable />
            <el-table-column label="Amount (cumulative)" prop="cumAmount" sortable />
            <el-table-column label="Status" prop="status" sortable>
              <template #default="scope">
                <div v-if="scope.row.status === 'Rejected'">
                  <el-tooltip :content="'Reason for rejection: ' + scope.row.reject_msg" placement="top">
                    <span>{{ scope.row.status }}</span>
                  </el-tooltip>
                </div>
                <div v-else>
                  <span>{{ scope.row.status }}</span>
                </div>
              </template>
            </el-table-column>





          </el-table>
        </el-card>

      </el-tab-pane>


      <el-tab-pane label="History" name="History">


        <el-table :data="editHistory" border ref="tableEditRef" >


          <el-table-column label="" type="expand" >
            <template #default="{ row }">
              <el-table :data="row.differences" style="margin: 10px 0;" border >
                <el-table-column prop="field" label="Field"  />
                <el-table-column prop="before" label="Before"  class-name="italic-red" show-overflow-tooltip />
                <el-table-column prop="after" label="After"  class-name="italic-green" show-overflow-tooltip  />
              </el-table>
            </template>
          </el-table-column>

          <el-table-column label="Date Edited" prop="created_at" sortable class-name="td-bold">
            <template #default="scope">
              {{ formatDate(scope.row.created_at) }}
            </template>
          </el-table-column>

          <el-table-column label="Edited By" prop="user.name" sortable  class-name="td-bold"/>
          <el-table-column fixed="right" label="Actions" width="100">
            <template #default="scope">
              <el-tooltip content="Revert " placement="top">
                <el-button type="warning" :icon="RefreshLeft" @click="RevertEdits(scope as TableSlotDefault)" />
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="Settings" name="Settings">
        <el-popconfirm width="300" title="Are you sure to delete this project?"
          @confirm="DeleteProject(projectFullData.id)">
          <template #reference>
            <el-button style="color: red; border-color: red; margin-left: 5px; margin-bottom: 5px;" plain>
              <Icon icon="material-symbols:delete" style="color: red;" />
              Delete Settlement
            </el-button> </template>
        </el-popconfirm>

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
</style>