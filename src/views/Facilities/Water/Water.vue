<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">

import { getSettlementListByCounty, getOneGeo, getfilteredGeo } from '@/api/settlements'
import { DeleteRecord, updateOneRecord, deleteDocument } from '@/api/settlements'

import { getCountyListApi } from '@/api/counties'
import {
  ElButton, ElSelect, MessageParamsWithType, UploadProps, ElDescriptions, ElDescriptionsItem, ElCol, ElRow, ElCard,
  ElOptionGroup, ElOption, FormInstance, ElDrawer, ElInputNumber
} from 'element-plus'
import { ElMessage, ElCollapse, ElCollapseItem, ElInput, ElBadge, ElSegmented } from 'element-plus'
import { computed, onMounted, watch } from 'vue'
import xlsx from "json-as-xlsx"
import { getFile } from '@/api/summary'
import {
  searchByKeyWord
} from '@/api/settlements'
import { getListWithoutGeo } from '@/api/counties'
import { getSummarybyFieldFromMultipleIncludes } from '@/api/summary'



import {
  Position,
  TopRight,
  User,
  Plus,
  Edit,
  Delete,
  View,
  Download,
  Filter,
  InfoFilled, Back, Search,
  MessageBox
} from '@element-plus/icons-vue'

import {
  Apple,
  Cherry,
  Grape,
  Orange,
  Pear,
  Watermelon, CircleClose, Message, CircleCheck, Loading, Check
} from '@element-plus/icons-vue'


import { ref, reactive, nextTick } from 'vue'
import {
  ElPagination, ElTooltip, ElTabPane, ElTabs, ElTable, ElTableColumn, ElDialog, ElUpload, ElIcon,
  ElPopconfirm, ElDivider, ElDropdown, ElDropdownItem, ElDropdownMenu, ElForm, ElFormItem, ElEmpty
} from 'element-plus'

import { useRouter, useRoute } from 'vue-router'
import exportFromJSON from 'export-from-json'



import { featureGroup } from 'leaflet'

import { getAllGeo } from '@/api/settlements'

import { StarFilled } from '@element-plus/icons-vue'
//import { MapboxMap, MapboxNavigationControl, MapboxMarker, MapboxGeolocateControl, MapboxGeocoder } from '@studiometa/vue-mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';



import '@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css';
import * as turf from '@turf/turf'
import { uuid } from 'vue-uuid'

import FontawesomeMarker from "mapbox-gl-fontawesome-markers";


import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'
import { feature } from '@turf/turf'

import { Icon } from '@iconify/vue';
import * as Iconify from '@iconify/iconify';
import IconifyIcon from '@iconify/vue';

import { MapboxLayerSwitcherControl, MapboxLayerDefinition } from "mapbox-layer-switcher";

import "mapbox-layer-switcher/styles.css";

import { countyOptions, subcountyOptions, settlementOptionsV2, LevelOptions, ownsershipOptions, regOptions, HCFTypeOptions } from './../common/index'

import UploadComponent from '@/views/Components/UploadComponent.vue';
import { defineAsyncComponent } from 'vue';

import TableActions from '@/views/Components/TableActions.vue';

import ListDocuments from '@/views/Components/ListDocuments.vue';
import DownloadAll from '@/views/Components/DownloadAll.vue';
import DownloadCustom from '@/views/Components/DownloadCustom.vue';


import { useAppStore } from '@/store/modules/app'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import PermissionWrapper from '@/components/PermissionWrapper.vue'



const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)


// For settlements, show 'viewOnMap' and 'addFacility' actions
const action_buttons = ref<string[]>(['viewOnMap', 'addFacility'])



console.log('action_buttons', action_buttons.value);







console.log("userInfo--->", userInfo)
console.log("showAdminButtons--->", showAdminButtons.value)



const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = MapBoxToken;

const morefileList = ref<any[]>([])




const tableDataListNew = ref([])
const tableDataListRejected = ref([])
const totalRejected = ref(0)
const totalNew = ref(0)
const total = ref(0)



const activeSegment = ref('Approved')

const options = ref([
  {
    label: 'Approved',
    value: 'Approved',
    icon: CircleCheck,
    count: total,
    disabled: false,
  },
  {
    label: 'New',
    value: 'New',
    icon: Message,
    count: totalNew,
    disabled: !showAdminButtons.value
  },
  {
    label: 'Rejected',
    value: 'Rejected',
    icon: CircleClose,
    count: totalRejected,
    disabled: !showAdminButtons.value
  },

  {
    label: 'Map',
    value: 'Map',
    icon: Position,
    count: total,
    disabled: false,

  },
])





const statuses = ref([])
const getSummaryStatus = async () => {
  // Get count of settlements that have water facilities with different approval statuses
  const formData: Record<string, any> = {}
  formData.model = waterFacilityModel
  formData.summaryFunction = 'count'
  formData.summaryField = 'isApproved'
  formData.groupFields = ['isApproved']
  const response = await getSummarybyFieldFromMultipleIncludes(formData)
  statuses.value = response.Total.reduce((acc: any, item: any) => {
    acc[item.isApproved] = parseInt(item.count, 10) // Convert count to a number
    return acc
  }, {})
  console.log('Data xcounty', statuses.value)

  totalRejected.value = statuses.value.Rejected !== undefined ? statuses.value.Rejected : 0
  totalNew.value = statuses.value.Pending !== undefined ? statuses.value.Pending : 0
  total.value = statuses.value.Approved !== undefined ? statuses.value.Approved : 0
}
getSummaryStatus()


// Map 
const polygons = ref([]) as Ref<[number, number][][]>
const shp = []
const geoLoaded = ref(false)

const markerLatlon = ref([])
const markerProperties = ref([])

const markers = ref()

const { push } = useRouter()



const countiesOptions = ref([])
const settlementOptions = ref([])
const settlements = ref([])
const filteredSettlements = ref([])
const page = ref(1)
const pSize = ref(6)
const selCounties = []
const loading = ref(true)
const pageSize = ref(6)
const currentPage = ref(1)
const downloadLoading = ref(false)


const tableDataList = ref([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
// var filters = []
// var filterValues = []

const filters = ref(['isApproved'])
const filterValues = ref([['Approved']])  // make sure the inner array is array


var tblData = []
const associated_Model = ''
const associated_multiple_models = ['settlement', 'users', 'county', 'subcounty', 'ward']

const model = 'settlement'
const waterFacilityModel = 'water_point'
const model_parent_key = 'settlement_id'
//// ------------------parameters -----------------------////

const currentRoute = useRoute(); // Access current route using useRoute




const mapHeight = '450px'
const countries = 'ke'
const facilityGeo = ref([])



//// ------------------Map -----------------------////


const subcountyfilteredOptions = ref([])
const settlementfilteredOptions = ref([])



const handleSelectCounty = async (county_id: any) => {
  console.log(county_id)
  showSubcountyOpts.value = true
  var subset = [];
  for (let i = 0; i < subcountyOptions.value.length; i++) {
    if (subcountyOptions.value[i].county_id == county_id) {
      subset.push(subcountyOptions.value[i]);
    }
  }
  console.log(subset)
  subcountyfilteredOptions.value = subset

  // filter settleemnts 
  var subset_settlements = [];
  for (let i = 0; i < settlementOptionsV2.value.length; i++) {
    if (settlementOptionsV2.value[i].county_id == county_id) {
      subset_settlements.push(settlementOptionsV2.value[i]);
    }
  }
  console.log("Subset Setts", subset_settlements)
  settlementfilteredOptions.value = subset_settlements


  // Get the select subcoites GEO
}








const handleClear = async () => {
  console.log('cleared....', filters.value, filterValues.value)

  value4.value = null
  value5.value = null
  value6.value = null

  pSize.value = 5
  currentPage.value = 1
  // Retain only the first element in filters and filterValues
  filters.value = filters.value.slice(0, 1);
  filterValues.value = filterValues.value.slice(0, 1);
  getFilteredData(filters.value, filterValues.value)
}



const onPageChange = async (selPage: any) => {
  console.log('on change change: selected   ', selCounties)
  page.value = selPage
  getFilteredData(filters.value, filterValues.value)
}

const onPageSizeChange = async (size: any) => {
  pSize.value = size
  getFilteredData(filters.value, filterValues.value)
}

const getInterventionsAll = async () => {
  getFilteredData(filters.value, filterValues.value)
}

const flattenJSON = (obj = {}, res = {}, extraKey = '') => {
  for (let key in obj) {
    if (key != 'geom') {

      if (typeof obj[key] !== 'object') {
        res[extraKey + key] = obj[key];
      } else {
        flattenJSON(obj[key], res, `${extraKey}${key}.`);
      };
    };
  }
  return res;
};


const removeReviewButton = () => {
  const reviewIndex = action_buttons.value.indexOf('review');
  if (reviewIndex !== -1) {
    action_buttons.value.splice(reviewIndex, 1);
  }
  console.log('action_buttons after removing review:', action_buttons.value);
};

// Store water facilities for each settlement
const settlementWaterFacilities = ref<Record<number, any[]>>({})
const loadingFacilities = ref<Record<number, boolean>>({})

// Load water facilities for a specific settlement
const loadWaterFacilitiesForSettlement = async (settlementId: number) => {
  if (settlementWaterFacilities.value[settlementId]) {
    return settlementWaterFacilities.value[settlementId]
  }

  loadingFacilities.value[settlementId] = true
  try {
    const formData = {
      limit: 1000,
      page: 1,
      curUser: 1,
      model: waterFacilityModel,
      searchField: 'name',
      searchKeyword: '',
      filters: ['settlement_id'],
      filterValues: [[settlementId]],
      associated_multiple_models: ['settlement', 'county', 'subcounty', 'ward', 'users']
    }

    const res = await getSettlementListByCounty(formData)
    settlementWaterFacilities.value[settlementId] = res.data || []
    return res.data || []
  } catch (error) {
    console.error('Error loading water facilities:', error)
    ElMessage.error('Failed to load water facilities')
    return []
  } finally {
    loadingFacilities.value[settlementId] = false
  }
}



const getFilteredData = async (selFilters, selfilterValues) => {
  const formData = {}
  formData.limit = pSize.value
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model // Now using 'settlement'
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  // Remove isApproved from settlement filters since we'll filter by nested model
  const settlementFilters = selFilters.filter((f: string) => f !== 'isApproved')
  const settlementFilterValues = selfilterValues.filter((_: any, index: number) => selFilters[index] !== 'isApproved')
  
  // Set settlement-level filters (county, subcounty, ward, etc.)
  formData.filters = settlementFilters.length > 0 ? settlementFilters : []
  formData.filterValues = settlementFilterValues.length > 0 ? settlementFilterValues : []
  formData.associated_multiple_models = ['county', 'subcounty', 'ward']
  
  // Use nested_models to filter settlements that have water facilities with the specified approval status
  // This ensures backend filtering - only settlements with matching water facilities are returned
  const isApprovedIndex = selFilters.indexOf('isApproved')
  if (isApprovedIndex !== -1 && selfilterValues[isApprovedIndex] && selfilterValues[isApprovedIndex].length > 0) {
    formData.nested_models = [{
      model: waterFacilityModel,
      field: 'isApproved',
      values: selfilterValues[isApprovedIndex],
      requireMatch: true // Only return settlements that have water facilities matching the status
    }]
  }

  const res = await getSettlementListByCounty(formData)

  console.log('After Query - Settlements with Water Facilities (backend filtered):', res)

  // Backend should have already filtered to only settlements with water facilities
  // Now load water facilities counts for display
  if (res.data && res.data.length > 0) {
    await Promise.all(res.data.map(async (settlement: any) => {
      const facilities = await loadWaterFacilitiesForSettlement(settlement.id)
      console.log(`Loaded ${facilities.length} facilities for settlement ${settlement.id} (${settlement.name})`)
    }))
    console.log('All facilities loaded. settlementWaterFacilities:', settlementWaterFacilities.value)
  }

  console.log('activeSegment.value', activeSegment.value)
  if (activeSegment.value == 'Approved') {
    tableDataList.value = res.data || []
    total.value = res.total || 0
    removeReviewButton()

  } else if (activeSegment.value == 'New' && showAdminButtons.value) {
    tableDataListNew.value = res.data || []
    totalNew.value = res.total || 0

    if (!action_buttons.value.includes('review')) {
      action_buttons.value.push('review');
    }

  }
  else if (activeSegment.value == 'Rejected' && showAdminButtons.value) {
    tableDataListRejected.value = res.data || []
    totalRejected.value = res.total || 0
    removeReviewButton()

  }




}


const getCountyNames = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'county',
      searchField: '',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received countiess:', response)
    var ret = response.data

    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var countyOpt = {}
      countyOpt.value = arrayItem.id
      countyOpt.label = arrayItem.name
      //  console.log(countyOpt)
      countiesOptions.value.push(countyOpt)
    })
  })
}


getCountyNames()


const getParentNames = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: associated_multiple_models[0],
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)
    var ret = response.data

    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var countyOpt = {}
      countyOpt.value = arrayItem.id
      countyOpt.label = arrayItem.name  
      //  console.log(countyOpt)
      countiesOptions.value.push(countyOpt)
    })
  })
}

const getModelOptions = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: model,
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)
    var ret = response.data

    loading.value = false
    // pass result to the makeoptions

    settlements.value = ret
    makeSettlementOptions(settlements)
  })
}

const open = (msg: MessageParamsWithType) => {
  ElMessage.error(msg)
}

const makeSettlementOptions = (list) => {
  console.log('making the options..............', list)
  settlementOptions.value = []
  list.value.forEach(function (arrayItem: { id: string; type: string }) {
    var countyOpt = {}
    countyOpt.value = arrayItem.id
    countyOpt.label = arrayItem.name  
    //  console.log(countyOpt)
    settlementOptions.value.push(countyOpt)
  })
}









const getGeo = async () => {

  const formData = {}
  formData.model = model


  console.log(formData)
  const res = await getAllGeo(formData)



  if (res.data[0].json_build_object) {


    facilityGeo.value = res.data[0].json_build_object
    console.log('Geo Returns---', res.data[0].json_build_object.features[0].geometry.coordinates)
    console.log("Facility Geo", facilityGeo)



    //markerLatlon.value = res.data[0].json_build_object.features[0].geometry.coordinates
    geoLoaded.value = true


    for (let i in res.data[0].json_build_object.features) {

      console.log(res.data[0].json_build_object.features[i].geometry.coordinates)
      markerLatlon.value.push(res.data[0].json_build_object.features[i].geometry.coordinates)

      var markProp = {}
      markProp.name = res.data[0].json_build_object.features[i].properties.name
      markerProperties.value.push(markProp)


    }
    console.log(markerProperties)

  }



}


//getParentNames()
getCountyNames()

getModelOptions()
getInterventionsAll()
getGeo()


const loadMap = (mapCenter) => {

  if (mapCenter.length === 0) {
    var centerPosition = [37.137343, 1.137451]
    var zoom = 6
  } else {
    var centerPosition = mapCenter
    var zoom = 12
  }
  var nmap = new mapboxgl.Map({
    container: "mapContainer",
    style: "mapbox://styles/mapbox/streets-v12",
    center: centerPosition, // starting position
    zoom: zoom,

  })



  console.log("resizing....")

  const nav = new mapboxgl.NavigationControl();
  nmap.addControl(nav, "top-right");
  nmap.on('load', () => {

    nmap.resize()

    nmap.addSource('hcf', {
      type: 'geojson',
      // Use a URL for the value for the `data` property.
      data: facilityGeo.value,
      // data: 'https://data.humdata.org/dataset/e66dbc70-17fe-4230-b9d6-855d192fc05c/resource/51939d78-35aa-4591-9831-11e61e555130/download/kenya.geojson'
    });


    nmap.addLayer({
      'id': 'pontLayer',
      "type": "circle",
      'source': 'hcf',
      'paint': {
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-color': [
          'case',
          ['==', ['get', 'type'], 'borehole'],
          '#a6cee3',
          ['==', ['get', 'type'], 'public_stand'],
          '#1f78b4',
          ['==', ['get', 'type'], 'kiosk'],
          '#b2df8a',
          ['==', ['get', 'type'], 'well'],
          '#33a02c',
          ['==', ['get', 'type'], 'tank'],
          '#ff7f00', 'gray'],
        'circle-stroke-color': 'white'
      }
    });




    nmap.addLayer({
      id: 'Satellite',
      source: { "type": "raster", "url": "mapbox://mapbox.satellite", "tileSize": 256 },
      type: "raster"
    }, 'pontLayer');

    nmap.addLayer({
      id: 'Streets',
      source: { "type": "raster", "url": "mapbox://mapbox.streets", "tileSize": 256 },
      type: "raster"
    }, 'Satellite');

    // switch it off until the user selects to
    nmap.setLayoutProperty('Satellite', 'visibility', 'none')


    const layers: MapboxLayerDefinition[] = [

      {
        id: "Satellite",
        title: "Satellite",
        visibility: 'none',
        type: 'base'
      },

      {
        id: "Streets",
        title: "Streets",
        visibility: 'none',
        type: 'base'
      },

    ];
    nmap.addControl(new MapboxLayerSwitcherControl(layers));




    // Zoom to layers if not by clik on a list
    if (mapCenter.length === 0) {
      console.log(markerLatlon.value)
      const bounds = new mapboxgl.LngLatBounds(
        markerLatlon.value[0],
        markerLatlon.value[0]
      );
      for (const coord of markerLatlon.value) {
        bounds.extend(coord);
      }

      nmap.fitBounds(bounds, {
        padding: 20
      });
    }


    else {

      const description = mapCenter[2]
      const coordinates = [mapCenter[0], mapCenter[1]]
      new mapboxgl.Popup({ offset: [0, -15] })
        .setLngLat(coordinates)
        .setHTML('<h3>' + description + '</h3>') // CHANGE THIS TO REFLECT THE PROPERTIES YOU WANT TO SHOW
        .addTo(nmap);
    }















    nmap.on('click', 'pontLayer', (e) => {
      console.log("Onclikc..........")
      // Copy coordinates array.
      const coordinates = e.features[0].geometry.coordinates.slice();
      const description = e.features[0].properties.name;
      const level = e.features[0].properties.level;

      // Ensure that if the map is zoomed out such that multiple
      // copies of the feature are visible, the popup appears
      // over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }



      new mapboxgl.Popup({ offset: [0, -15] })
        .setLngLat(coordinates)
        .setHTML('<h3>' + description + '</h3><p>' + level + '</p>') // CHANGE THIS TO REFLECT THE PROPERTIES YOU WANT TO SHOW
        .addTo(nmap);


    });

    // Change the cursor to a pointer when the mouse is over the places layer.
    nmap.on('mouseenter', 'pontLayer', () => {
      nmap.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    nmap.on('mouseleave', 'pontLayer', () => {
      nmap.getCanvas().style.cursor = '';
    });





  });


}



const onSegmentClick = async () => {
  console.log(activeSegment.value);
  if (activeSegment.value === "Map") {
    // Wait for the DOM to update
    await nextTick();

    // Optionally delay further to ensure complete rendering
    setTimeout(() => {
      loadMap([]);
    }, 100); // Adjust delay time as needed
  }

  if (activeSegment.value === "Approved") {

    var selectOption = 'isApproved'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }

    var index = filters.value.indexOf(selectOption) // 1

    // clear previously selected
    if (filterValues.value[index]) {
      // filterValues[index].length = 0
      filterValues.value.splice(index, 1)
    }

    if (!filterValues.value.includes('Approved')) {
      filterValues.value.splice(index, 0, 'Approved') //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
    }

  }


  if (activeSegment.value === "New") {

    var selectOption = 'isApproved'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }

    var index = filters.value.indexOf(selectOption) // 1

    // clear previously selected
    if (filterValues.value[index]) {
      // filterValues[index].length = 0
      filterValues.value.splice(index, 1)
    }

    if (!filterValues.value.includes('Pending')) {
      filterValues.value.splice(index, 0, 'Pending') //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
    }

  }


  if (activeSegment.value === "Rejected") {

    var selectOption = 'isApproved'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }

    var index = filters.value.indexOf(selectOption) // 1

    // clear previously selected
    if (filterValues.value[index]) {
      // filterValues[index].length = 0
      filterValues.value.splice(index, 1)
    }

    if (!filterValues.value.includes('Rejected')) {
      filterValues.value.splice(index, 0, 'Rejected') //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
    }

  }

  console.log('filterValues---filters.value->', filterValues.value, filters.value)

  getFilteredData(filters.value, filterValues.value)

};



const viewProfile = (data: TableSlotDefault) => {
  console.log('On Click.....', data.id)

  push({
    path: '/facilities/health/details/:id',
    name: 'HealthFacilityDetails',
    params: { data: data.id, id: data.id }
  })
}

const activeTab = ref('list')

// Google Maps API Key
const googleMapsApiKey = 'AIzaSyCrzbOkfG52zkAxYPkMvvRMlxE9qHK4uDk'

// Drawer state for map
const mapDrawerVisible = ref(false)
const mapDrawerSettlement = ref<any>(null)
const mapDrawerContainer = ref<HTMLElement | null>(null)
const googleMap = ref<any>(null)
const settlementPolygon = ref<any>(null)
const facilityMarkers = ref<any[]>([])
const settlementGeo = ref<any>(null)
const facilitiesGeo = ref<any>(null)
const facilityMarkerDataMap = ref<Map<any, any>>(new Map())

declare global {
  interface Window {
    google: any
  }
}

// Open map drawer for settlement
const flyTo = async (data: TableSlotDefault) => {
  try {
    mapDrawerSettlement.value = data
    mapDrawerVisible.value = true
    
    await nextTick()
    await initializeMapDrawer(data)
  } catch (error) {
    console.error("Error opening map drawer:", error);
    ElMessage.error("Failed to open map. Please try again.");
  }
};

// Initialize Google Maps in drawer
const initializeMapDrawer = async (settlement: any) => {
  if (!mapDrawerContainer.value) {
    await nextTick()
  }
  
  if (!mapDrawerContainer.value) {
    ElMessage.error("Map container not found")
    return
  }

  try {
    // Load Google Maps API
    const { Loader } = await import('@googlemaps/js-api-loader')
    
    const loader = new Loader({
      apiKey: googleMapsApiKey,
      version: 'weekly',
      libraries: ['drawing', 'geometry', 'places'],
      region: 'KE',
      language: 'en'
    })

    await loader.load()

    if (!window.google || !window.google.maps) {
      throw new Error('Google Maps API not loaded properly')
    }

    // Get settlement geometry
    const geoForm: any = {
      model: 'settlement',
      id: settlement.id
    }

    const res = await getOneGeo(geoForm)
    const geoData = res?.data?.[0]?.json_build_object
    const features = geoData?.features
    
    // Check if features is null or empty
    if (!features || (Array.isArray(features) && features.length === 0)) {
      ElMessage.warning("No boundary geometry found for this settlement. Showing map with facilities only.")
      settlementGeo.value = null
    } else {
      settlementGeo.value = geoData
    }

    // Get center and bounds
    let center = { lat: 1.137451, lng: 37.137343 }
    let zoom = 8

    if (settlementGeo.value && settlementGeo.value.features && settlementGeo.value.features.length > 0) {
      try {
        const bboxResult = turf.bbox(settlementGeo.value)
        center = {
          lat: (bboxResult[1] + bboxResult[3]) / 2,
          lng: (bboxResult[0] + bboxResult[2]) / 2
        }
        zoom = 13
      } catch (error) {
        console.warn('Error calculating bbox, using default center:', error)
      }
    }

    // Initialize map
    googleMap.value = new window.google.maps.Map(mapDrawerContainer.value, {
      center: center,
      zoom: zoom,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true
    })

    // Add settlement boundary only if features exist
    if (settlementGeo.value && settlementGeo.value.features && settlementGeo.value.features.length > 0) {
      const feature = settlementGeo.value.features[0]
      if (feature && feature.geometry && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
        try {
          const paths = feature.geometry.type === 'Polygon'
            ? feature.geometry.coordinates[0].map((coord: number[]) => ({
                lat: coord[1],
                lng: coord[0]
              }))
            : feature.geometry.coordinates[0][0].map((coord: number[]) => ({
                lat: coord[1],
                lng: coord[0]
              }))

          settlementPolygon.value = new window.google.maps.Polygon({
            paths: paths,
            strokeColor: '#FF0000',
            strokeOpacity: 0.6,
            strokeWeight: 2,
            fillColor: '#FF0000',
            fillOpacity: 0,
            map: googleMap.value
          })

          // Fit bounds to settlement
          const pathBounds = new window.google.maps.LatLngBounds()
          paths.forEach((path: any) => {
            pathBounds.extend(path)
          })
          googleMap.value.fitBounds(pathBounds)
        } catch (error) {
          console.error('Error drawing settlement boundary:', error)
          ElMessage.warning('Could not draw settlement boundary, but map is still available')
        }
      }
    }

    // Wait for map to be ready before loading facilities
    const loadFacilitiesWhenReady = async () => {
      await loadFacilitiesOnMap(settlement.id)
    }

    // Use idle event to ensure map is fully loaded
    googleMap.value.addListener('idle', loadFacilitiesWhenReady)
    
    // Also try loading immediately in case map is already idle
    setTimeout(loadFacilitiesWhenReady, 500)

    // Trigger map resize after drawer animation completes
    setTimeout(() => {
      if (googleMap.value) {
        window.google.maps.event.trigger(googleMap.value, 'resize')
        // Re-center and fit bounds after resize
        if (settlementPolygon.value) {
          const pathBounds = new window.google.maps.LatLngBounds()
          const feature = settlementGeo.value.features[0]
          if (feature && feature.geometry) {
            const paths = feature.geometry.type === 'Polygon'
              ? feature.geometry.coordinates[0].map((coord: number[]) => ({
                  lat: coord[1],
                  lng: coord[0]
                }))
              : feature.geometry.coordinates[0][0].map((coord: number[]) => ({
                  lat: coord[1],
                  lng: coord[0]
                }))
            paths.forEach((path: any) => {
              pathBounds.extend(path)
            })
            googleMap.value.fitBounds(pathBounds)
          }
        }
      }
    }, 300)

  } catch (error) {
    console.error("Error initializing map:", error)
    ElMessage.error("Failed to initialize map. Please try again.")
  }
}

// Load facilities on map
const loadFacilitiesOnMap = async (settlementId: number) => {
  try {
    // Clear existing markers
    facilityMarkers.value.forEach(marker => marker.setMap(null))
    facilityMarkers.value = []

    if (!googleMap.value) {
      console.error('Google map not initialized')
      return
    }

    console.log('Loading water point facilities for settlement:', settlementId)

    // Get facilities GeoJSON
    const formData: any = {
      model: waterFacilityModel,
      columnFilterField: 'settlement_id',
      selectedParents: settlementId,
      filtredGeoIds: [settlementId]
    }

    const res = await getfilteredGeo(formData)
    
    console.log('Facilities Geo response:', res)
    
    // Handle different response structures
    let geoJsonData = null
    
    if (res && res.data) {
      if (Array.isArray(res.data) && res.data.length > 0) {
        const firstItem = res.data[0]
        
        if (Array.isArray(firstItem) && firstItem.length > 0) {
          if (firstItem[0] && firstItem[0].json_build_object) {
            geoJsonData = firstItem[0].json_build_object
          }
        } else if (firstItem && firstItem.json_build_object) {
          geoJsonData = firstItem.json_build_object
        } else if (firstItem && firstItem.type === 'FeatureCollection') {
          geoJsonData = firstItem
        }
      }
    } else if (Array.isArray(res) && res.length > 0) {
      const firstItem = res[0]
      if (Array.isArray(firstItem) && firstItem.length > 0 && firstItem[0].json_build_object) {
        geoJsonData = firstItem[0].json_build_object
      } else if (firstItem && firstItem.json_build_object) {
        geoJsonData = firstItem.json_build_object
      } else if (firstItem && firstItem.type === 'FeatureCollection') {
        geoJsonData = firstItem
      }
    }
    
    console.log('Extracted GeoJSON data:', geoJsonData)
    
    if (!geoJsonData) {
      console.log('No GeoJSON data found for facilities')
      ElMessage.info('No facilities with geometry data found for this settlement.')
      return
    }
    
    if (geoJsonData.features === null || (Array.isArray(geoJsonData.features) && geoJsonData.features.length === 0)) {
      console.log('GeoJSON features is null or empty')
      ElMessage.info('No facilities with geometry data found for this settlement.')
      facilitiesGeo.value = null
      return
    }
    
    facilitiesGeo.value = geoJsonData
    const features = geoJsonData.features || []
    
    console.log('Facilities features count:', features.length)
    
    if (features.length === 0) {
      ElMessage.info('No facilities found with geometry for this settlement.')
      facilitiesGeo.value = null
      return
    }
    
    // Process features and create markers (water points are Point geometry)
    features.forEach((feature: any) => {
      if (feature.geometry && (feature.geometry.type === 'Point' || feature.geometry.type === 'MultiPoint')) {
        const coords = feature.geometry.coordinates
        if (!coords || coords.length < 2) {
          console.warn('Invalid coordinates:', coords)
          return
        }
        
        try {
          const position = {
            lat: coords[1],
            lng: coords[0]
          }
          
          const marker = new window.google.maps.Marker({
            position: position,
            map: googleMap.value,
            title: feature.properties?.name || 'Water Point',
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#0066ff',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2
            }
          })
          
          // Store facility data with marker
          facilityMarkerDataMap.value.set(marker, feature.properties)
          
          // Add click listener to open facility form drawer
          marker.addListener('click', async () => {
            const facilityProperties = feature.properties || {}
            const facilityId = facilityProperties.id || facilityProperties.water_point_id
            
            if (facilityId) {
              // Fetch full facility data to ensure we have all fields
              try {
                const formData: any = {
                  limit: 1,
                  page: 1,
                  curUser: 1,
                  model: waterFacilityModel,
                  searchField: 'id',
                  searchKeyword: facilityId.toString(),
                  filters: ['id'],
                  filterValues: [[facilityId]],
                  associated_multiple_models: ['settlement', 'county', 'subcounty', 'ward', 'users']
                }
                
                const facilityRes = await getSettlementListByCounty(formData)
                
                if (facilityRes.data && facilityRes.data.length > 0) {
                  // Ensure settlement_id is set from map drawer if missing
                  const facilityData = facilityRes.data[0]
                  if (!facilityData.settlement_id && mapDrawerSettlement.value?.id) {
                    facilityData.settlement_id = mapDrawerSettlement.value.id
                  }
                  if (!facilityData.county_id && mapDrawerSettlement.value?.county_id) {
                    facilityData.county_id = mapDrawerSettlement.value.county_id
                  }
                  if (!facilityData.subcounty_id && mapDrawerSettlement.value?.subcounty_id) {
                    facilityData.subcounty_id = mapDrawerSettlement.value.subcounty_id
                  }
                  if (!facilityData.ward_id && mapDrawerSettlement.value?.ward_id) {
                    facilityData.ward_id = mapDrawerSettlement.value.ward_id
                  }
                  
                  // Open drawer with full facility data
                  openWaterForm(facilityData)
                } else {
                  // Fallback: use properties if full data not available
                  const fallbackData = {
                    ...facilityProperties,
                    settlement_id: facilityProperties.settlement_id || mapDrawerSettlement.value?.id || '',
                    county_id: facilityProperties.county_id || mapDrawerSettlement.value?.county_id || '',
                    subcounty_id: facilityProperties.subcounty_id || mapDrawerSettlement.value?.subcounty_id || '',
                    ward_id: facilityProperties.ward_id || mapDrawerSettlement.value?.ward_id || ''
                  }
                  ElMessage.warning('Could not load full facility data. Using available information.')
                  openWaterForm(fallbackData)
                }
              } catch (error) {
                console.error('Error fetching facility data:', error)
                // Fallback: use properties directly with settlement context
                const fallbackData = {
                  ...facilityProperties,
                  settlement_id: facilityProperties.settlement_id || mapDrawerSettlement.value?.id || '',
                  county_id: facilityProperties.county_id || mapDrawerSettlement.value?.county_id || '',
                  subcounty_id: facilityProperties.subcounty_id || mapDrawerSettlement.value?.subcounty_id || '',
                  ward_id: facilityProperties.ward_id || mapDrawerSettlement.value?.ward_id || ''
                }
                openWaterForm(fallbackData)
              }
            } else {
              // No ID available, use properties directly with settlement context
              const fallbackData = {
                ...facilityProperties,
                settlement_id: facilityProperties.settlement_id || mapDrawerSettlement.value?.id || '',
                county_id: facilityProperties.county_id || mapDrawerSettlement.value?.county_id || '',
                subcounty_id: facilityProperties.subcounty_id || mapDrawerSettlement.value?.subcounty_id || '',
                ward_id: facilityProperties.ward_id || mapDrawerSettlement.value?.ward_id || ''
              }
              ElMessage.warning('Facility ID not found. Some fields may be missing.')
              openWaterForm(fallbackData)
            }
          })
          
          facilityMarkers.value.push(marker)
        } catch (error) {
          console.error('Error creating marker:', error, feature)
        }
      } else {
        console.warn('Feature is not a Point:', feature.geometry?.type)
      }
    })
    
    console.log('Total markers created:', facilityMarkers.value.length)
    
    if (facilityMarkers.value.length === 0) {
      ElMessage.info('No facilities with valid Point geometry found')
    } else {
      ElMessage.success(`Loaded ${facilityMarkers.value.length} facilities on map`)
    }
  } catch (error) {
    console.error("Error loading facilities on map:", error)
    ElMessage.error("Failed to load facilities on map: " + (error as Error).message)
  }
}

// Watch for drawer visibility changes to trigger map resize
watch(mapDrawerVisible, (newVal) => {
  if (newVal && googleMap.value) {
    // Wait for drawer animation to complete before resizing
    setTimeout(() => {
      if (googleMap.value) {
        window.google.maps.event.trigger(googleMap.value, 'resize')
        // Re-center map after resize
        if (settlementPolygon.value && settlementGeo.value && settlementGeo.value.features && settlementGeo.value.features.length > 0) {
          const feature = settlementGeo.value.features[0]
          if (feature && feature.geometry) {
            const pathBounds = new window.google.maps.LatLngBounds()
            const paths = feature.geometry.type === 'Polygon'
              ? feature.geometry.coordinates[0].map((coord: number[]) => ({
                  lat: coord[1],
                  lng: coord[0]
                }))
              : feature.geometry.coordinates[0][0].map((coord: number[]) => ({
                  lat: coord[1],
                  lng: coord[0]
                }))
            paths.forEach((path: any) => {
              pathBounds.extend(path)
            })
            googleMap.value.fitBounds(pathBounds)
          }
        }
      }
    }, 350)
  }
})

// Close drawer handler
const handleMapDrawerClose = () => {
  mapDrawerVisible.value = false
  // Clean up markers
  facilityMarkers.value.forEach(marker => marker.setMap(null))
  facilityMarkers.value = []
  facilityMarkerDataMap.value.clear()
  
  if (settlementPolygon.value) {
    settlementPolygon.value.setMap(null)
    settlementPolygon.value = null
  }
  googleMap.value = null
  mapDrawerSettlement.value = null
}








const isMobile = computed(() => appStore.getMobile)

console.log('IsMobile', isMobile)

const dialogWidth = ref()
const actionColumnWidth = ref()

if (isMobile.value) {
  dialogWidth.value = "90%"
  actionColumnWidth.value = "75px"
} else {
  dialogWidth.value = "25%"
  actionColumnWidth.value = "160px"

}






const removeDocument = (data: TableSlotDefault) => {
  console.log('----->', data)
  let formData = {}
  formData.id = data.id
  formData.model = model
  formData.filesToDelete = [data.name]
  deleteDocument(formData)
}

const currentRow = ref()
const addMoreDocuments = ref()
const addMoreDocs = (data: TableSlotDefault) => {

  currentRow.value = data

  addMoreDocuments.value = true

  console.log('currentRow', currentRow.value)

}



const DocTypes = ref([])
const getDocumentTypes = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'document_type',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Document Typest:', response)
    var ret = response.data


    const nestedData = ret.reduce((acc, cur) => {
      const group = cur.group;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(cur);
      return acc;
    }, {});

    console.log(nestedData.Map)
    for (let property in nestedData) {
      let opts = nestedData[property];
      var doc = {}
      doc.label = property
      doc.options = []

      opts.forEach(function (arrayItem) {
        let opt = {}
        opt.value = arrayItem.id
        opt.label = arrayItem.type
        doc.options.push(opt)

      })
      DocTypes.value.push(doc)

    }
    console.log(DocTypes)

  })
}
getDocumentTypes()


const legendItems = [
  {
    "label": "Borehole",
    "color": "#a6cee3"
  },
  {
    "label": "Public Stand",
    "color": '#1f78b4'
  },
  {
    "label": "Kiosk",
    "color": '#b2df8a'
  },
  {
    "label": "Well",
    "color": '#33a02c'
  },
  {
    "label": "Tank",
    "color": '#e31a1c'
  },

  {
    "label": "Others",
    "color": "gray"
  }





]



const DeleteFacility = async (data: TableSlotDefault) => {
  console.log('-----> Deleting Facility:', data)
  
  try {
    const formData: Record<string, any> = {
      id: data.id,
      model: model,
    }

    // Delete the record from backend
    await DeleteRecord(formData)

    // Delete documents if any
    if (Array.isArray(data.documents) && data.documents.length > 0) {
      formData.filesToDelete = data.documents
      await deleteDocument(formData)
    }

    // Refresh the data after successful deletion
    await getFilteredData(filters.value, filterValues.value)
    
    ElMessage.success('Record deleted successfully')
  } catch (error) {
    console.error('Error deleting record:', error)
    ElMessage.error('Failed to delete record')
  }
}



const handleDeleteConfirmation = (data) => {
  console.log('--handleDeleteConfirmation--->', data)



}
const formheader = ref('Edit Facility')

//*****************************Create**************************** */

///----------------------------------------------------------------------------------
const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  id: '',
  name: '',
  settlement_id: '',
  county_id: '',
  subcounty_id: '',
  facility_type: '',
  facility_number: '',
  reg_status: '',
  level: '',
  owner: '',
  ownership_type: '',
  number_beds: '',
  geom: null,
})


const showEditSaveButton = ref(false)
const showAddSaveButton = ref(true)

const AddDialogVisible = ref(false)





const handleClose = () => {
  console.log("Closing the dialoig")
  showAddSaveButton.value = true
  showEditSaveButton.value = false
  ruleForm.name = null
  ruleForm.county_id = null
  ruleForm.population = null
  ruleForm.area = null
  ruleForm.description = null
  formheader.value = 'Add Settlement'
  AddDialogVisible.value = false
  showSubcountyOpts.value = false
}

console.log('------> countyOptions', countyOptions)


const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return

  ruleForm.model = model
  await updateOneRecord(ruleForm).then(() => { })


}

const ShowReviewDialog = ref(false)
const RejectDialog = ref(false)
const facility_raw = ref({})


const Review = (data: TableSlotDefault) => {
  console.log('On Click.....', data.id)
  ShowReviewDialog.value = true

  // make the descriptions dataset 
  facility_raw.value.name = data.name
  facility_raw.value.reg_status = data.reg_status
  facility_raw.value.ownership_type = data.ownership_type
  facility_raw.value.owner = data.owner
  facility_raw.value.user = data.user.name + ' | ' + data.user.email
  facility_raw.value.date = data.createdAt

  //

  ruleForm.id = data.id
  ruleForm.name = data.name
  ruleForm.county_id = data.county_id
  ruleForm.settlement_id = data.settlement_id
  ruleForm.subcounty_id = data.subcounty_id
  ruleForm.facility_type = data.facility_type
  ruleForm.reg_status = data.reg_status
  ruleForm.level = data.level
  ruleForm.ownership_type = data.ownership_type
  ruleForm.number_beds = data.number_beds
  ruleForm.geom = data.geom


  formHeader.value = "Review"

}

const approve = async () => {
  console.log("Appprove")
  ruleForm.isApproved = 'Approved'
  ruleForm.reviewerId = userInfo.id

  console.log(ruleForm)
  ruleForm.model = model
  console.log(ruleForm)
  await updateOneRecord(ruleForm).then(() => { })
  ShowReviewDialog.value = false
  getFilteredData(filters.value, filterValues.value)
}


const reject = async () => {
  RejectDialog.value = true
}

const rejectReason = ref('')
const confirmReject = async () => {
  console.log('Reject Msg', rejectReason.value)
  ruleForm.reject_msg = rejectReason.value
  ruleForm.isApproved = 'Rejected'

  console.log(ruleForm)
  ruleForm.model = model
  ruleForm.reviewerId = userInfo.id
  console.log(ruleForm)
  await updateOneRecord(ruleForm).then(() => { })
  RejectDialog.value = false
  ShowReviewDialog.value = false

  getFilteredData(filters.value, filterValues.value)

}


const showSubcountyOpts = ref(false)


/// Uplaod docuemnts from a central component 
const mfield = 'water_point_id'
const ChildComponent = defineAsyncComponent(() => import('@/views/Components/UploadComponent.vue'));

const dynamicComponent = ref();
const componentProps = ref({
  message: 'Hello from parent',
  showDialog: addMoreDocuments,
  data: currentRow.value,
  umodel: model,
  field: mfield
});



function toggleComponent(row) {
  console.log('Compnnent data', row)
  componentProps.value.data = row
  dynamicComponent.value = null; // Unload the component
  addMoreDocuments.value = true; // Set any additional props

  setTimeout(() => {
    dynamicComponent.value = ChildComponent; // Load the component
  }, 100); // 0.1 seconds


}



// component for docuemnts 
const rowData = ref()
const documentComponent = defineAsyncComponent(() => import('@/views/Components/ListDocuments.vue'));
const dynamicDocumentComponent = ref();
const DocumentComponentProps = ref({
  message: 'documents',
  data: rowData.value,
  docmodel: model,

});


const handleExpand = async (row: any) => {
  // Load water facilities for this settlement
  await loadWaterFacilitiesForSettlement(row.id)
  
  // Handle documents (existing functionality)
  dynamicDocumentComponent.value = null; // Unload the component
  rowData.value = row
  DocumentComponentProps.value.data = row
  setTimeout(() => {
    dynamicDocumentComponent.value = documentComponent; // Load the component
  }, 100); // 0.1 seconds
}


const router = useRouter()

const value4 = ref()
const value5 = ref()
const value6 = ref()
const search_string = ref()

const enableSubcounty = ref(false)
const selectedCounty = ref()
const selectedSubCounty = ref()

const selectedWard = ref()
const enableward = ref(false)

const subcountiesOptions = ref([])



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

const getFilteredBySearchData = async (searchKey) => {

  if (selectedCounty.value) {
    var selectOption = 'county_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    var index = filters.value.indexOf(selectOption) // 1

    // clear previously selected
    if (filterValues[index]) {
      // filterValues[index].length = 0
      filterValues.value.splice(index, 1)
    }

    if (!filterValues.value.includes(selectedCounty.value) && selectedCounty.value.length > 0) {
      filterValues.value.splice(index, 0, selectedCounty.value) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
    }

    // expunge the filter if the filter values are null
    if (selectedCounty.value.length === 0) {
      filters.value.splice(index, 1)
    }

  }

  // Filter by subcounty  
  if (selectedSubCounty.value) {
    var selectOption = 'subcounty_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    var index = filters.value.indexOf(selectOption) // 1

    // clear previously selected
    if (filterValues[index]) {
      // filterValues[index].length = 0
      filterValues.value.splice(index, 1)
    }

    if (!filterValues.value.includes(selectedSubCounty.value) && selectedSubCounty.value.length > 0) {
      filterValues.value.splice(index, 0, selectedSubCounty.value) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
    }

    // expunge the filter if the filter values are null
    if (selectedSubCounty.value.length === 0) {
      filters.value.splice(index, 1)
    }

  }



  searchLoading.value = true
  const formData = {}
  formData.limit = pageSize.value
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model

  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = searchKey
  //--Single Filter -----------------------------------------

  //formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = filters.value
  formData.filterValues = filterValues.value
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = []
  //formData.cache_key = 'SeacrchByKey_' + search_string.value

  //-------------------------


  const res = await searchByKeyWord(formData)
  searchLoading.value = false

  console.log('activeSegment.value', activeSegment.value)
  if (activeSegment.value == 'Approved') {
    tableDataList.value = res.data

  } else if (activeSegment.value == 'New') {
    tableDataListNew.value = res.data

  }
  else {
    tableDataListRejected.value = res.data

  }




  loading.value = false


}




const getSubCountyNames = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'subcounty',
      searchField: 'county_id',
      searchKeyword: selectedCounty.value,
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received subcounties response:', response)
    var ret = response.data
    subcountiesOptions.value = []
    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var subcountyOpt = {}
      subcountyOpt.value = arrayItem.id
      subcountyOpt.county_id = arrayItem.county_id
      subcountyOpt.label = arrayItem.name
      //  console.log(countyOpt)
      subcountiesOptions.value.push(subcountyOpt)
    })
  })
}

const wardOptions = ref([])

const getWardNames = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'ward',
      searchField: 'subcounty_id',
      searchKeyword: selectedSubCounty.value,
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received wards response:', response)
    var ret = response.data
    wardOptions.value = []
    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var opt = {}
      opt.value = arrayItem.id
      opt.subcounty_id = arrayItem.subcounty_id
      opt.label = arrayItem.name
      //  console.log(countyOpt)
      wardOptions.value.push(opt)
    })
  })
}



const filterByCounty = async (county_id: any) => {

  if (county_id) {
    enableSubcounty.value = true   // allow selection of subcounty 
    selectedCounty.value = county_id
    getSubCountyNames()
  }

  value5.value = null; // Clear the subcounty properly
  value6.value = null; // Clear the ward properly


  if (search_string.value) {
    getFilteredBySearchData(search_string.value)
  }

  else {



    var selectOption = 'county_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    var index = filters.value.indexOf(selectOption) // 1

    // clear previously selected
    if (filterValues.value[index]) {
      // filterValues[index].length = 0
      filterValues.value.splice(index, 1)
    }

    if (!filterValues.value.includes(selectedCounty.value) && selectedCounty.value.length > 0) {
      filterValues.value.splice(index, 0, selectedCounty.value) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
    }

    // expunge the filter if the filter values are null
    if (selectedCounty.value.length === 0) {
      filters.value.splice(index, 1)
    }


    console.log('----x----', filters.value, filterValues.value)


    getFilteredData(filters.value, filterValues.value)

  }


}


const filterBySubCounty = async (subcounty_id: any) => {

  if (subcounty_id) {
    enableSubcounty.value = true   // allow selection of subcounty 
    selectedSubCounty.value = subcounty_id
    getWardNames()
  }

  // value6.value = null   // clear the ward sr 

  if (search_string.value) {
    getFilteredBySearchData(search_string.value)
  }

  else {
    var selectOption = 'subcounty_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    var index = filters.value.indexOf(selectOption) // 1

    // clear previously selected
    if (filterValues.value[index]) {
      // filterValues[index].length = 0
      filterValues.value.splice(index, 1)
    }

    if (!filterValues.value.includes(selectedSubCounty.value) && selectedSubCounty.value.length > 0) {
      filterValues.value.splice(index, 0, selectedSubCounty.value) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
    }

    // expunge the filter if the filter values are null
    if (selectedSubCounty.value.length === 0) {
      filters.value.splice(index, 1)
    }

    getFilteredData(filters.value, filterValues.value)

  }


}

const filterByWard = async (ward_id: any) => {

  if (ward_id) {
    selectedWard.value = ward_id

  }



  if (search_string.value) {
    getFilteredBySearchData(search_string.value)
  }

  else {
    var selectOption = 'ward_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    var index = filters.value.indexOf(selectOption) // 1

    // clear previously selected
    if (filterValues.value[index]) {
      // filterValues[index].length = 0
      filterValues.value.splice(index, 1)
    }

    if (!filterValues.value.includes(selectedWard.value) && selectedWard.value.length > 0) {
      filterValues.value.splice(index, 0, selectedWard.value) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
    }

    // expunge the filter if the filter values are null
    if (selectedWard.value.length === 0) {
      filters.value.splice(index, 1)
    }

    getFilteredData(filters.value, filterValues.value)

  }


}


const searchLoading = ref(false)
const searchByNewName = async () => {

  console.log('filterString', search_string.value)
  //value3.value = filterString
  //search_string.value = filterString


  if (search_string.value) {


    getFilteredBySearchData(search_string.value)

  }

}



const AddFacility = () => {
  push({
    name: 'AddWaterNew'
  })
}

const handleAddFacility = (item: any) => {
  push({
    name: 'AddWaterNew',
    query: {
      county_id: item.county_id,
      settlement_id: item.id
    }
  })
}


// Water form drawer state
const waterDrawerVisible = ref(false)
const waterFormRef = ref<FormInstance>()
const editingWaterId = ref<number | null>(null)
const isEditMode = ref(false)

// Water form data
const waterForm = reactive({
  name: '',
  type: '',
  capacity: '',
  depth: null,
  ownership_type: '',
  owner: '',
  catchment: '',
  price: null,
  condition: '',
  availability: '',
  name_of_provider: '',
  cost_of_20_litre_jerrican: null,
  settlement_id: '',
  county_id: '',
  subcounty_id: '',
  ward_id: '',
  geom: null
})

// Water point type options
const waterPointTypeOptions = [
  { value: 'kiosk', label: 'Water Kiosk' },
  { value: 'public_tap', label: 'Public Tap' },
  { value: 'borehole', label: 'Borehole' },
  { value: 'spring', label: 'Spring' },
  { value: 'well', label: 'Dug Well' }
]

// Condition options
const conditionOptions = [
  { value: 'Under construction ', label: 'Under construction ' },
  { value: 'Broken/not in use', label: 'Broken/not in use' },
  { value: 'Operational ', label: 'Operational ' },
  { value: 'Decomissioned', label: 'Decomissioned' }
]

// Availability options
const availabilityOptions = [
  { value: 'Daily', label: 'Daily' },
  { value: 'Twice_a_week', label: 'Twice a week' },
  { value: 'Once_a_week', label: 'Once a week' },
  { value: 'Rarely', label: 'Rarely' }
]

// Ownership options
const ownershipOptions = [
  { value: 'government', label: 'Government' },
  { value: 'ngo', label: 'CBO/NGO' },
  { value: 'individual', label: 'Individual' },
  { value: 'community', label: 'Community' }
]

// Water form validation rules
const waterFormRules = reactive({
  name: [{ required: true, message: 'Water point name is required', trigger: 'blur' }],
  settlement_id: [{ required: true, message: 'Settlement is required', trigger: 'blur' }]
})

// Open water form drawer for editing
const openWaterForm = (facilityData: any) => {
  isEditMode.value = true
  editingWaterId.value = facilityData.id || null
  
  // Populate form with facility data
  waterForm.name = facilityData.name || ''
  waterForm.type = facilityData.type || ''
  waterForm.capacity = facilityData.capacity || ''
  waterForm.depth = facilityData.depth || null
  waterForm.ownership_type = facilityData.ownership_type || ''
  waterForm.owner = facilityData.owner || ''
  waterForm.catchment = facilityData.catchment || ''
  waterForm.price = facilityData.price || null
  waterForm.condition = facilityData.condition || ''
  waterForm.availability = facilityData.availability || ''
  waterForm.name_of_provider = facilityData.name_of_provider || ''
  waterForm.cost_of_20_litre_jerrican = facilityData.cost_of_20_litre_jerrican || null
  waterForm.settlement_id = facilityData.settlement_id || ''
  waterForm.county_id = facilityData.county_id || ''
  waterForm.subcounty_id = facilityData.subcounty_id || ''
  waterForm.ward_id = facilityData.ward_id || ''
  waterForm.geom = facilityData.geom || null
  
  waterDrawerVisible.value = true
}

// Submit water form
const submitWaterForm = async () => {
  if (!waterFormRef.value) return
  
  await waterFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const formDataToSubmit = {
          ...waterForm,
          model: waterFacilityModel
        }
        
        if (isEditMode.value && editingWaterId.value) {
          // Update existing facility
          formDataToSubmit.id = editingWaterId.value
          
          const res = await updateOneRecord(formDataToSubmit)
          
          if (res.code === '0000') {
            ElMessage.success('Water point updated successfully')
            
            // Refresh the data
            await getFilteredData(filters.value, filterValues.value)
            
            // Reload facilities for the settlement if available
            if (waterForm.settlement_id) {
              await loadWaterFacilitiesForSettlement(waterForm.settlement_id)
            }
            
            waterDrawerVisible.value = false
          } else {
            ElMessage.error('Failed to update water point')
          }
        } else {
          ElMessage.error('Invalid edit mode')
        }
      } catch (error) {
        console.error('Error saving water point:', error)
        ElMessage.error('Failed to save water point')
      }
    }
  })
}

// Reset water form
const resetWaterForm = () => {
  isEditMode.value = false
  editingWaterId.value = null
  Object.keys(waterForm).forEach(key => {
    if (typeof waterForm[key as keyof typeof waterForm] === 'string') {
      waterForm[key as keyof typeof waterForm] = '' as any
    } else if (typeof waterForm[key as keyof typeof waterForm] === 'number') {
      waterForm[key as keyof typeof waterForm] = null as any
    } else {
      waterForm[key as keyof typeof waterForm] = null as any
    }
  })
}

// Close water drawer
const closeWaterDrawer = () => {
  waterDrawerVisible.value = false
  resetWaterForm()
}

const editFacility = (data: TableSlotDefault) => {
  // Open drawer with water form for editing
  openWaterForm(data)
}



const filteredSegments = computed(() => {
  return options.value.filter(option => !option.disabled);
});





</script>

<template>


  <el-card>

    <div v-if="dynamicComponent">
      <upload-component :is="dynamicComponent" v-bind="componentProps" />
    </div>


    <el-row :gutter="10" style=" margin-bottom:10px;">
      <el-col :xs="24" :sm="24" :md="2" :lg="2" class="max-w-200px">

        <div class="max-w-200px">
          <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
            Back
          </el-button>
        </div>
      </el-col>

      <el-col :xs="24" :sm="24" :md="12" :lg="5">
        <el-select
size="default" v-model="value4" :onChange="filterByCounty" :onClear="handleClear" multiple clearable
          filterable collapse-tags placeholder="By County" style=" margin-right: 5px;">
          <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>

      </el-col>

      <el-col :xs="24" :sm="24" :md="12" :lg="4">
        <el-select
:disabled="!enableSubcounty" size="default" v-model="value5" :onChange="filterBySubCounty" multiple
          clearable filterable collapse-tags placeholder="By Subcounty" style=" margin-right: 5px;"
          :empty-values="[null, undefined]">
          <el-option v-for="item in subcountiesOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-col>

      <el-col :xs="24" :sm="24" :md="12" :lg="4">
        <el-select
:disabled="!enableSubcounty" size="default" v-model="value6" :onChange="filterByWard" multiple
          clearable filterable collapse-tags placeholder="By Ward" style=" margin-right: 5px;">
          <el-option v-for="item in wardOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-col>

      <el-col :xs="24" :sm="24" :md="12" :lg="5">

        <el-input
v-model="search_string" clearable :onClear="handleClear"
          placeholder="Search by name (or part of it).." @change="searchByNewName" class="input-with-select"
          style=" margin-right: 5px;">
          <template #append>
            <el-button v-loading="searchLoading" :icon="Search" :onClick="searchByNewName" />
          </template>
        </el-input>
      </el-col>



      <el-col :xs="24" :sm="24" :md="12" :lg="4">

        <div style="display: flex; align-items: center; gap: 10px; margin-right: 10px;">

          <el-tooltip content="Add Facility" placement="top">
            <PermissionWrapper :permissions="'water_point:create'">
              <el-button :onClick="AddFacility" type="primary" :icon="Plus" />
            </PermissionWrapper>
          </el-tooltip>

          <el-tooltip content="Clear" placement="top">
            <el-button :onClick="handleClear" type="primary" :icon="Filter" />
          </el-tooltip>

          <DownloadCustom
v-if="showEditButtons" :data="tableDataList" :model="model"
            :associated_models="associated_multiple_models" />
        </div>


      </el-col>



    </el-row>




    <div class="custom-style">

      <el-segmented v-model="activeSegment" :options="filteredSegments" block :onChange="onSegmentClick">
        <template #default="{ item }">
          <div class="flex flex-col items-center gap-2 p-2">
            <el-icon size="18">
              <component :is="item.icon" />
            </el-icon>
            <div>{{ item.label }} ({{ item.count }}) </div>
          </div>
        </template>
      </el-segmented>

    </div>

    <div v-if="activeSegment === 'Approved'">
      <el-table :data="tableDataList" style="width: 100%; margin-top: 10px;" border @expand-change="handleExpand" row-key="id">
        <el-table-column type="expand">
          <template #default="props">
            <div style="padding: 20px;">
              <h3>Water Facilities in {{ props.row.name }}</h3>
              <div v-if="loadingFacilities[props.row.id]" style="text-align: center; padding: 20px;">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>Loading water facilities...</span>
              </div>
              <el-table 
                v-else
                :data="settlementWaterFacilities[props.row.id] || []" 
                style="width: 100%;" 
                border
                size="small"
              >
                <el-table-column label="Facility Name" prop="name">
                  <template #default="scope">
                    <el-button type="primary" link @click="openWaterForm(scope.row)">
                      {{ scope.row.name || 'N/A' }}
                    </el-button>
                  </template>
                </el-table-column>
                <el-table-column label="Type" prop="facility_type" />
                <el-table-column label="Status" prop="isApproved">
                  <template #default="scope">
                    <el-tag 
                      :type="scope.row.isApproved === 'Approved' ? 'success' : scope.row.isApproved === 'Rejected' ? 'danger' : 'warning'"
                    >
                      {{ scope.row.isApproved }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="Actions" width="200">
                  <template #default="{ row }">
                    <PermissionWrapper :permissions="['water_point:update', 'water_point:delete']">
                      <el-button size="small" type="primary" :icon="Edit" @click="editFacility(row)" />
                      <el-button size="small" type="danger" :icon="Delete" @click="DeleteFacility(row)" />
                    </PermissionWrapper>
                  </template>
                </el-table-column>
              </el-table>
              <div v-if="!loadingFacilities[props.row.id] && (!settlementWaterFacilities[props.row.id] || settlementWaterFacilities[props.row.id].length === 0)" style="text-align: center; padding: 20px;">
                <el-empty description="No water facilities found in this settlement" />
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Settlement Name" prop="name" sortable />
        <el-table-column label="Location" sortable>
          <template #default="scope">
            <span>{{ scope.row.ward?.name || 'N/A' }} ward, {{ scope.row.subcounty?.name || 'N/A' }} subcounty, {{ scope.row.county?.name || 'N/A'
              }} County</span>
          </template>
        </el-table-column>
        <el-table-column label="Water Facilities Count" sortable>
          <template #default="scope">
            <el-badge :value="settlementWaterFacilities[scope.row.id]?.length || 0" class="item" />
          </template>
        </el-table-column>

        <el-table-column label="Actions" width="250">
          <template #default="{ row }">
              <TableActions
              :item="row" :buttons="action_buttons" @view-on-map="flyTo" @add-facility="handleAddFacility" />
          </template>
        </el-table-column>

      </el-table>

      <div v-if="!tableDataList || tableDataList.length === 0" class="no-data-message">
        <el-empty description="No settlements with approved water facilities found" />
      </div>

      <ElPagination
        v-if="tableDataList && tableDataList.length > 0"
        layout="sizes, prev, pager, next, total" 
        v-model:currentPage="currentPage"
        v-model:page-size="pageSize" 
        :page-sizes="[6, 20, 50, 200, 1000]" 
        :total="total" 
        :background="true"
        @size-change="onPageSizeChange" 
        @current-change="onPageChange" 
        class="mt-4" />

    </div>


    <div v-if="activeSegment === 'New'">
      <el-table :data="tableDataListNew" style="width: 100%; margin-top: 10px;" border @expand-change="handleExpand" row-key="id">
        <el-table-column type="expand">
          <template #default="props">
            <div style="padding: 20px;">
              <h3>Water Facilities in {{ props.row.name }}</h3>
              <div v-if="loadingFacilities[props.row.id]" style="text-align: center; padding: 20px;">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>Loading water facilities...</span>
              </div>
              <el-table 
                v-else
                :data="settlementWaterFacilities[props.row.id] || []" 
                style="width: 100%;" 
                border
                size="small"
              >
                <el-table-column label="Facility Name" prop="name">
                  <template #default="scope">
                    <el-button type="primary" link @click="openWaterForm(scope.row)">
                      {{ scope.row.name || 'N/A' }}
                    </el-button>
                  </template>
                </el-table-column>
                <el-table-column label="Type" prop="facility_type" />
                <el-table-column label="Status" prop="isApproved">
                  <template #default="scope">
                    <el-tag 
                      :type="scope.row.isApproved === 'Approved' ? 'success' : scope.row.isApproved === 'Rejected' ? 'danger' : 'warning'"
                    >
                      {{ scope.row.isApproved }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="Actions" width="200">
                  <template #default="{ row }">
                    <PermissionWrapper :permissions="['water_point:update', 'water_point:delete', 'water_point:review']">
                      <el-button size="small" type="primary" :icon="Edit" @click="editFacility(row)" />
                      <el-button size="small" type="danger" :icon="Delete" @click="DeleteFacility(row)" />
                      <el-button size="small" type="warning" @click="Review(row)" />
                    </PermissionWrapper>
                  </template>
                </el-table-column>
              </el-table>
              <div v-if="!loadingFacilities[props.row.id] && (!settlementWaterFacilities[props.row.id] || settlementWaterFacilities[props.row.id].length === 0)" style="text-align: center; padding: 20px;">
                <el-empty description="No water facilities found in this settlement" />
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Settlement Name" prop="name" sortable />
        <el-table-column label="Location" sortable>
          <template #default="scope">
            <span>{{ scope.row.ward?.name || 'N/A' }} ward, {{ scope.row.subcounty?.name || 'N/A' }} subcounty, {{ scope.row.county?.name || 'N/A'
              }} County</span>
          </template>
        </el-table-column>
        <el-table-column label="Water Facilities Count" sortable>
          <template #default="scope">
            <el-badge :value="settlementWaterFacilities[scope.row.id]?.length || 0" class="item" />
          </template>
        </el-table-column>

        <el-table-column label="Actions" width="250">
          <template #default="{ row }">
              <TableActions
              :item="row" :buttons="action_buttons" @view-on-map="flyTo" @add-facility="handleAddFacility" />
          </template>
        </el-table-column>

      </el-table>

      <div v-if="!tableDataListNew || tableDataListNew.length === 0" class="no-data-message">
        <el-empty description="No settlements with new water facilities found" />
      </div>

      <ElPagination
        v-if="tableDataListNew && tableDataListNew.length > 0"
        layout="sizes, prev, pager, next, total" 
        v-model:currentPage="currentPage"
        v-model:page-size="pageSize" 
        :page-sizes="[5, 10, 20, 50, 100]" 
        :total="totalNew" 
        :background="true"
        @size-change="onPageSizeChange" 
        @current-change="onPageChange" 
        class="mt-4" />
    </div>

    <div v-if="activeSegment === 'Rejected'">

      <el-table
        :data="tableDataListRejected" style="width: 100%; margin-top: 10px;" border
        @expand-change="handleExpand" row-key="id">
        <el-table-column type="expand">
          <template #default="props">
            <div style="padding: 20px;">
              <h3>Water Facilities in {{ props.row.name }}</h3>
              <div v-if="loadingFacilities[props.row.id]" style="text-align: center; padding: 20px;">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>Loading water facilities...</span>
              </div>
              <el-table 
                v-else
                :data="settlementWaterFacilities[props.row.id] || []" 
                style="width: 100%;" 
                border
                size="small"
              >
                <el-table-column label="Facility Name" prop="name">
                  <template #default="scope">
                    <el-button type="primary" link @click="openWaterForm(scope.row)">
                      {{ scope.row.name || 'N/A' }}
                    </el-button>
                  </template>
                </el-table-column>
                <el-table-column label="Type" prop="facility_type" />
                <el-table-column label="Status" prop="isApproved">
                  <template #default="scope">
                    <el-tag 
                      :type="scope.row.isApproved === 'Approved' ? 'success' : scope.row.isApproved === 'Rejected' ? 'danger' : 'warning'"
                    >
                      {{ scope.row.isApproved }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="Actions" width="200">
                  <template #default="{ row }">
                    <PermissionWrapper :permissions="['water_point:update', 'water_point:delete']">
                      <el-button size="small" type="primary" :icon="Edit" @click="editFacility(row)" />
                      <el-button size="small" type="danger" :icon="Delete" @click="DeleteFacility(row)" />
                    </PermissionWrapper>
                  </template>
                </el-table-column>
              </el-table>
              <div v-if="!loadingFacilities[props.row.id] && (!settlementWaterFacilities[props.row.id] || settlementWaterFacilities[props.row.id].length === 0)" style="text-align: center; padding: 20px;">
                <el-empty description="No water facilities found in this settlement" />
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Settlement Name" prop="name" sortable />
        <el-table-column label="Location" sortable>
          <template #default="scope">
            <span>{{ scope.row.ward?.name || 'N/A' }} ward, {{ scope.row.subcounty?.name || 'N/A' }} subcounty, {{ scope.row.county?.name || 'N/A'
              }} County</span>
          </template>
        </el-table-column>
        <el-table-column label="Water Facilities Count" sortable>
          <template #default="scope">
            <el-badge :value="settlementWaterFacilities[scope.row.id]?.length || 0" class="item" />
          </template>
        </el-table-column>

        <el-table-column label="Actions" width="250">
          <template #default="{ row }">
              <TableActions
              :item="row" :buttons="action_buttons" @view-on-map="flyTo" @add-facility="handleAddFacility" />
          </template>
        </el-table-column>

      </el-table>

      <div v-if="!tableDataListRejected || tableDataListRejected.length === 0" class="no-data-message">
        <el-empty description="No rejected water points found" />
      </div>

      <ElPagination
        v-if="tableDataListRejected && tableDataListRejected.length > 0"
        layout="sizes, prev, pager, next, total" 
        v-model:currentPage="currentPage"
        v-model:page-size="pageSize" 
        :page-sizes="[5, 10, 20, 50, 100]" 
        :total="totalRejected" 
        :background="true"
        @size-change="onPageSizeChange" 
        @current-change="onPageChange" 
        class="mt-4" />

    </div>


    <div v-if="activeSegment === 'Map'">
      <el-empty description="Click 'View on Map' on a settlement to see its map with facilities" />
    </div>

  </el-card>

  <!-- Map Drawer -->
  <el-drawer
    v-model="mapDrawerVisible"
    title="Settlement Map with Water Points"
    direction="rtl"
    :size="isMobile ? '100%' : '60%'"
    :before-close="handleMapDrawerClose"
    class="map-drawer"
  >
    <template #header>
      <div class="drawer-header-mobile">
        <span class="drawer-title">{{ mapDrawerSettlement?.name || 'Settlement Map' }}</span>
        <el-button type="danger" size="default" @click="handleMapDrawerClose" class="close-btn-mobile">Close</el-button>
      </div>
    </template>
    
    <div v-if="mapDrawerSettlement" class="map-container-wrapper">
      <div ref="mapDrawerContainer" class="map-container"></div>
    </div>
  </el-drawer>

  <div v-if="activeSegment === 'Map' && false" style="display: none;">
      <div id="mapContainer" class="basemap" style="width: 100%; margin-top: 10px;"></div>
      <div id="floating-div">
        <el-card>
          <el-collapse>
            <el-collapse-item title="LEGEND">
              <div class="legend">
                <div v-for="item in legendItems" :key="item.label" class="legend-item">
                  <div class="circle-color" :style="{ backgroundColor: item.color }"></div>
                  <div class="legend-label">{{ item.label }}</div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-card>
      </div>
  </div>

  <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formheader" width="400px" draggable>
    <el-row :gutter="10">

      <el-col :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
        <el-form ref="ruleFormRef" :rules="rules" :model="ruleForm" label-position="left">
          <el-form-item label="Name" prop="name">
            <el-input v-model="ruleForm.name" placeholder="Please input" />
          </el-form-item>

          <el-form-item label="Level" prop="level">
            <el-select v-model="ruleForm.level" filterable placeholder="Level">
              <el-option v-for="item in LevelOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>

          <el-form-item label="Type" prop="facility_type">
            <el-select v-model="ruleForm.facility_type" filterable placeholder="Type">
              <el-option v-for="item in HCFTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>

          <el-form-item label="Ownership" prop="ownership">
            <el-select v-model="ruleForm.ownership_type" filterable placeholder="Ownership">
              <el-option v-for="item in ownsershipOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="County" prop="county_id">
            <el-select v-model="ruleForm.county_id" filterable placeholder="County" :onChange="handleSelectCounty">
              <el-option v-for="item in countyOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>

          <el-form-item v-if="showSubcountyOpts" label="Subcounty" prop="subcounty_id">
            <el-select v-model="ruleForm.subcounty_id" filterable placeholder="Select subcounty">
              <el-option
v-for="item in subcountyfilteredOptions" :key="item.value" :label="item.label"
                :value="item.value" />
            </el-select>
          </el-form-item>

          <el-form-item label="Settlement" prop="settlement_id">
            <el-select v-model="ruleForm.settlement_id" filterable placeholder="Settlement">
              <el-option
v-for="item in settlementfilteredOptions" :key="item.value" :label="item.label"
                :value="item.value" />
            </el-select>
          </el-form-item>


        </el-form>
      </el-col>

    </el-row>

    <template #footer>
      <span class="dialog-footer space-between">
        <el-row :gutter="10">

          <el-col :xl="24" :lg="24" :md="24" :sm="24" :xs="24">

            <el-button @click="AddDialogVisible = false">Cancel</el-button>
            <el-button v-if="showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>


          </el-col>


        </el-row>
      </span>
    </template>


  </el-dialog>



  <el-dialog v-model="ShowReviewDialog" @close="handleClose" :title="formHeader" :width="reviewWindowWidth" draggable>
    <el-descriptions title="" direction="vertical" :column="2" size="small" border>
      <el-descriptions-item label="Name">{{ facility_raw.name }}</el-descriptions-item>
      <el-descriptions-item label="Status" :span="2">{{ facility_raw.reg_status }}</el-descriptions-item>
      <el-descriptions-item label="Type">{{ facility_raw.ownership_type }}</el-descriptions-item>
      <el-descriptions-item label="owner"> {{ facility_raw.owner }} </el-descriptions-item>
      <el-descriptions-item label="Submitted By"> {{ facility_raw.user }} </el-descriptions-item>
      <el-descriptions-item label="Date"> {{ facility_raw.date }} </el-descriptions-item>

    </el-descriptions>
    <template #footer>
      <span v-if="showAdminButtons" class="dialog-footer">
        <el-button type="success" @click="approve">Approve</el-button>
        <el-button type="danger" @click="reject">Reject</el-button>
      </span>
    </template>
  </el-dialog>
  <el-dialog v-model="RejectDialog" title="Reason for rejection" width="20%">
    <el-input v-model="rejectReason" placeholder="" />
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="RejectDialog = false">Cancel</el-button>
        <el-button type="primary" @click="confirmReject">
          Confirm
        </el-button>
      </span>
    </template>
  </el-dialog>

  <!-- Water Form Drawer for Editing -->
  <el-drawer
    v-model="waterDrawerVisible"
    :title="isEditMode ? 'Edit Water Point' : 'Water Point Details'"
    direction="rtl"
    :size="isMobile ? '100%' : '600px'"
    :before-close="closeWaterDrawer"
    class="water-form-drawer"
  >
    <el-form
      ref="waterFormRef"
      :model="waterForm"
      :rules="waterFormRules"
      :label-width="isMobile ? '0px' : '180px'"
      :label-position="isMobile ? 'top' : 'left'"
      class="water-form-mobile"
    >
      <el-divider content-position="left">Basic Information</el-divider>

      <el-form-item label="Water Point Name" prop="name">
        <el-input v-model="waterForm.name" placeholder="Enter water point name" />
      </el-form-item>

      <el-form-item label="Type">
        <el-select v-model="waterForm.type" placeholder="Select water point type" filterable style="width: 100%">
          <el-option
            v-for="item in waterPointTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Capacity">
        <el-input v-model="waterForm.capacity" placeholder="Enter capacity" />
      </el-form-item>

      <el-form-item label="Depth (Meters)" v-if="waterForm.type === 'borehole' || waterForm.type === 'well'">
        <el-input-number v-model="waterForm.depth" :min="0" :precision="2" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Ownership Type">
        <el-select v-model="waterForm.ownership_type" placeholder="Select ownership type" filterable style="width: 100%">
          <el-option
            v-for="item in ownershipOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Owner">
        <el-input v-model="waterForm.owner" placeholder="Enter owner" />
      </el-form-item>

      <el-form-item label="Catchment">
        <el-input v-model="waterForm.catchment" placeholder="Enter catchment" />
      </el-form-item>

      <el-form-item label="Price">
        <el-input-number v-model="waterForm.price" :min="0" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Condition">
        <el-select v-model="waterForm.condition" placeholder="Select condition" filterable style="width: 100%">
          <el-option
            v-for="item in conditionOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Availability">
        <el-select v-model="waterForm.availability" placeholder="Select availability" filterable style="width: 100%">
          <el-option
            v-for="item in availabilityOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Name of Provider">
        <el-input v-model="waterForm.name_of_provider" placeholder="Enter name of provider" />
      </el-form-item>

      <el-form-item label="Cost of 20 Litre Jerrican">
        <el-input-number v-model="waterForm.cost_of_20_litre_jerrican" :min="0" :precision="2" style="width: 100%" />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="drawer-footer">
        <el-button @click="closeWaterDrawer" class="footer-btn">Cancel</el-button>
        <el-button type="primary" @click="submitWaterForm" :icon="Check" class="footer-btn">
          {{ isEditMode ? 'Update Water Point' : 'Save Water Point' }}
        </el-button>
      </div>
    </template>
  </el-drawer>

</template>

<style scoped>
.basemap {
  width: 100%;
  height: 65vh;
  /* Set the height to 75% of the viewport height */
}
</style>



<style>
.el-table .warning-row {
  --el-table-tr-bg-color: var(--el-color-warning-light-9);
}

.el-table .success-row {
  --el-table-tr-bg-color: var(--el-color-success-light-9);
}
</style>





<style>
.el-row {
  margin-bottom: 20px;
}

.el-row:last-child {
  margin-bottom: 0;
}

.el-col {
  border-radius: 4px;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
}



.legend {
  padding: 10px;
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


.circle-color {
  height: 20px;
  width: 20px;
  margin-right: 10px;
  border-radius: 50%;
  display: inline-block;

}

.legend-label {
  font-size: 12px;
}

#layer-control {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1;
  background-color: white;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}


#floating-div {
  position: absolute;
  top: 200px;
  left: 50px;
  z-index: 1;
  background-color: white;
  padding: 5px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}


.item {
  margin-top: 10px;
  margin-right: 40px;
}

.water-form-drawer :deep(.el-drawer__body) {
  padding: 20px;
  overflow-y: auto;
}

.water-form-mobile {
  padding: 0;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.footer-btn {
  min-width: 100px;
}

@media (max-width: 768px) {
  .water-form-drawer :deep(.el-drawer__body) {
    padding: 15px;
  }

  .drawer-footer {
    padding: 15px;
    flex-direction: column;
  }

  .footer-btn {
    width: 100%;
  }
}

.map-container-wrapper {
  position: relative;
  width: 100%;
  height: calc(100vh - 120px);
}

.map-container {
  width: 100%;
  height: 100%;
  border-radius: 4px;
}

.map-drawer :deep(.el-drawer__body) {
  padding: 0;
}

.drawer-header-mobile {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.drawer-title {
  font-size: 16px;
  font-weight: 600;
}

.close-btn-mobile {
  padding: 8px 16px;
}

@media (max-width: 768px) {
  .map-container-wrapper {
    height: calc(100vh - 100px);
  }

  .drawer-title {
    font-size: 14px;
  }

  .close-btn-mobile {
    padding: 6px 12px;
    font-size: 13px;
  }
}
</style>


<style scoped>
.custom-style .el-segmented {
  --el-border-radius-base: 5px;
}

.segment-label {
  white-space: nowrap;
  /* Prevent text from wrapping */
  overflow: hidden;
  /* Hide overflowing text */
  text-overflow: ellipsis;
  /* Add ellipsis for truncated text */
}

.no-data-message {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  margin: 20px 0;
}

@media (max-width: 600px) {
  .custom-style .el-segmented {
    font-size: 10px;
    /* Adjust font size on mobile */
    padding: 5px;
    /* Adjust padding for smaller screens */
  }

  .segment-label {
    font-size: 12px;
    /* Smaller font size for labels */
    text-align: center;
    /* Center align text */
    padding: 0 5px;
    /* Add some padding for spacing */
    white-space: normal;
    /* Allow wrapping on smaller screens */
    overflow: visible;
    /* Allow the text to flow properly */
  }
}
</style>