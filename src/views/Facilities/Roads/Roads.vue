<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">

import { loadGoogleMapsApi } from '@/composables/useGoogleMapsLoader'
import { getSettlementListByCounty,getOneGeo, getfilteredGeo, CreateRecord } from '@/api/settlements'
import { DeleteRecord, updateOneRecord, deleteDocument } from '@/api/settlements'

import { getCountyListApi } from '@/api/counties'
import {
  ElButton, ElSelect, MessageParamsWithType, UploadProps, ElDescriptions, ElDescriptionsItem, ElCol, ElRow, ElCard,
  ElOptionGroup, ElOption, FormInstance,ElDrawer
} from 'element-plus'
import { ElMessage, ElCollapse, ElCollapseItem, ElInput, ElBadge, ElSegmented } from 'element-plus'
import { computed, watch } from 'vue'
import xlsx from "json-as-xlsx"
import { getFile } from '@/api/summary'
import {
  searchByKeyWord
} from '@/api/settlements'
import { getListWithoutGeo } from '@/api/counties'

import { getSummarybyFieldFromMultipleIncludes } from '@/api/summary'
import { GOOGLE_MAPS_API_KEY as googleMapsApiKey } from '@/config/googleMaps'


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
  ElPopconfirm, ElDivider, ElDropdown, ElDropdownItem, ElDropdownMenu, ElForm, ElFormItem, ElEmpty, ElInputNumber
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

import { countyOptions, subcountyOptions, settlementOptionsV2, LevelOptions, ownsershipOptions, regOptions, HCFTypeOptions, RdClassOptions } from './../common/index'

import UploadComponent from '@/views/Components/UploadComponent.vue';
import { defineAsyncComponent } from 'vue';

import TableActions from '@/views/Components/TableActions.vue';

import ListDocuments from '@/views/Components/ListDocuments.vue';
import DownloadAll from '@/views/Components/DownloadAll.vue';
import DownloadCustom from '@/views/Components/DownloadCustom.vue';


import { useAppStore } from '@/store/modules/app'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { userHasPrivilegedNationalLocation } from '@/utils/roleScope'
import PermissionWrapper from '@/components/PermissionWrapper.vue'

declare global {
  interface Window {
    google: any
  }
}

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)

const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)
const isMobile = computed(() => appStore.getMobile)

// User location-based filtering
const isSuperAdmin = computed(() => {
  return userInfo?.roles?.some((role: any) => 
    role.name === 'super_admin' || role.name === 'root_admin'
  ) || false
})

const hasNationalAccess = computed(() => userHasPrivilegedNationalLocation(userInfo?.roles))

const userCountyRole = computed(() => {
  return userInfo?.roles?.find((role: any) => 
    role.user_roles?.location_level === 'county'
  )
})

const userCountyId = computed(() => {
  return userCountyRole.value?.user_roles?.county_id || null
})

const userSettlementRole = computed(() => {
  return userInfo?.roles?.find((role: any) => 
    role.user_roles?.location_level === 'settlement'
  )
})

const userSettlementId = computed(() => {
  return userSettlementRole.value?.user_roles?.settlement_id || null
})

// Check if user should be restricted to their county
const isCountyRestricted = computed(() => {
  return !isSuperAdmin.value && !hasNationalAccess.value && !!userCountyId.value
})

// Row actions for roads
const action_buttons = ref<string[]>(['viewProfile', 'viewOnMap', 'delete']);

console.log('User location info:', {
  isSuperAdmin: isSuperAdmin.value,
  hasNationalAccess: hasNationalAccess.value,
  userCountyId: userCountyId.value,
  userSettlementId: userSettlementId.value,
  isCountyRestricted: isCountyRestricted.value
})

// Drawer state for map
const mapDrawerVisible = ref(false)
const mapDrawerSettlement = ref<any>(null)
const mapDrawerContainer = ref<HTMLElement | null>(null)
const googleMap = ref<any>(null)
const settlementPolygon = ref<any>(null)
const roadMarkers = ref<any[]>([])
const selectedRoadId = ref<number | string | null>(null)
const settlementGeo = ref<any>(null)
const roadsGeo = ref<any>(null)
const facilityMarkerDataMap = ref<Map<any, any>>(new Map())
const roadAssetMarkers = ref<any[]>([])



console.log('action_buttons', action_buttons.value);







console.log("userInfo--->", userInfo)
console.log("showAdminButtons--->", showAdminButtons.value)



const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = MapBoxToken;

const morefileList = ref<any[]>([])




const tableDataListNew = ref([])
const tableDataListRejected = ref([])
// Pagination totals (settlements count)
const totalRejected = ref(0)
const totalNew = ref(0)
const total = ref(0)

// Segment badge counts (roads count)
const badgeCountApproved = ref(0)
const badgeCountNew = ref(0)
const badgeCountRejected = ref(0)

const activeSegment = ref('Approved')

const options = ref([
  {
    label: 'Approved',
    value: 'Approved',
    icon: CircleCheck,
    disabled: false,
  },
  {
    label: 'New',
    value: 'New',
    icon: Message,
    disabled: !showAdminButtons.value
  },
  {
    label: 'Rejected',
    value: 'Rejected',
    icon: CircleClose,
    disabled: !showAdminButtons.value
  },
])







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
const pSize = ref(10)
const selCounties = []
const loading = ref(true)
const pageSize = ref(10)
const currentPage = ref(1)
const downloadLoading = ref(false)


const tableDataList = ref([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
// var filters = []
// var filterValues = []

const filters = ref(['isApproved'])
const filterValues = ref([['Approved']])  // make sure the inner array is array
const search_string = ref('')
const value4 = ref<any[]>([])
const value5 = ref<any[]>([])
const value6 = ref<any[]>([])
const enableSubcounty = ref(false)
const selectedCounty = ref<any[]>([])
const selectedSubCounty = ref<any[]>([])
const selectedWard = ref<any[]>([])
const enableward = ref(false)
const subcountiesOptions = ref([])


var tblData = []
const associated_Model = ''
const associated_multiple_models = ['settlement', 'users', 'county', 'subcounty', 'ward']

const model = 'settlement'
const roadFacilityModel = 'road'
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




const statuses = ref([])
const getSummaryStatus = async () => {
  // Get count of roads with different approval statuses (for badge counts)
  // Apply the same filters as getFilteredData to ensure badge counts match filtered data
  const formData: any = {}
  formData.model = roadFacilityModel
  formData.summaryFunction = 'count'
  formData.summaryField = 'isApproved'
  formData.groupFields = ['isApproved']
  
  // Build filters array similar to getFilteredData
  let summaryFilters: string[] = []
  let summaryFilterValues: any[] = []
  
  // FIRST: Apply location-based filtering based on user role (SERVER-SIDE FILTERING)
  if (isCountyRestricted.value && userCountyId.value) {
    // User is restricted to their county - ALWAYS apply this filter server-side
    summaryFilters.push('county_id')
    summaryFilterValues.push([userCountyId.value])
  } else if (userSettlementId.value && !isSuperAdmin.value && !hasNationalAccess.value) {
    // User is restricted to their settlement - ALWAYS apply this filter server-side
    summaryFilters.push('settlement_id')
    summaryFilterValues.push([userSettlementId.value])
  }
  
  // THEN: Add other filters from current filter selections (excluding isApproved)
  filters.value.forEach((filter: string, index: number) => {
    if (filter !== 'isApproved') {
      // For county-restricted users, preserve the county_id restriction and don't override it
      if (filter === 'county_id' && isCountyRestricted.value && userCountyId.value) {
        // Ensure county restriction is maintained - don't override with manual selection
        const countyIndex = summaryFilters.indexOf('county_id')
        if (countyIndex !== -1) {
          summaryFilterValues[countyIndex] = [userCountyId.value]
        }
        return
      }
      
      // Check if filter already exists (to avoid duplicates)
      const existingIndex = summaryFilters.indexOf(filter)
      if (existingIndex === -1) {
        summaryFilters.push(filter)
        summaryFilterValues.push(filterValues.value[index])
      } else {
        // If filter exists, merge values (for multi-select filters)
        const existingValues = summaryFilterValues[existingIndex]
        const newValues = filterValues.value[index]
        if (Array.isArray(existingValues) && Array.isArray(newValues)) {
          summaryFilterValues[existingIndex] = [...new Set([...existingValues, ...newValues])]
        } else {
          summaryFilterValues[existingIndex] = newValues
        }
      }
    }
  })
  
  // Final check: Ensure county restriction is always present for county-restricted users
  if (isCountyRestricted.value && userCountyId.value) {
    const countyIndex = summaryFilters.indexOf('county_id')
    if (countyIndex === -1) {
      summaryFilters.unshift('county_id')
      summaryFilterValues.unshift([userCountyId.value])
    } else {
      summaryFilterValues[countyIndex] = [userCountyId.value]
    }
  }
  
  // Apply filters to formData
  if (summaryFilters.length > 0) {
    formData.filters = summaryFilters
    formData.filterValues = summaryFilterValues
  }
  
  const response = await getSummarybyFieldFromMultipleIncludes(formData);
  
  // Initialize statuses object
  statuses.value = {};
  
  // Process response.Total array to build status counts
  if (response && response.Total && Array.isArray(response.Total)) {
    response.Total.forEach((item: any) => {
      if (item.isApproved && item.count !== undefined) {
        statuses.value[item.isApproved] = parseInt(item.count, 10) || 0;
      }
    });
  }
  
  console.log('Facilities count by status (for badges):', statuses.value)
  console.log('Response Total:', response?.Total)

  // Set segment badge counts (roads count) - ensure they're numbers
  badgeCountApproved.value = (statuses.value.Approved !== undefined && statuses.value.Approved !== null) ? Number(statuses.value.Approved) : 0;
  badgeCountNew.value = (statuses.value.Pending !== undefined && statuses.value.Pending !== null) ? Number(statuses.value.Pending) : 0;
  badgeCountRejected.value = (statuses.value.Rejected !== undefined && statuses.value.Rejected !== null) ? Number(statuses.value.Rejected) : 0;
  
  console.log('Badge counts - Approved:', badgeCountApproved.value, 'New:', badgeCountNew.value, 'Rejected:', badgeCountRejected.value)
  
  // NOTE: Pagination totals (total.value, totalNew.value, totalRejected.value) are set in getFilteredData()
  // and represent SETTLEMENTS count - these are NOT updated here
  // Badge counts show facilities count, pagination uses settlements count


}
getSummaryStatus()




const handleClear = async () => {
  console.log('cleared....', filters.value, filterValues.value)

  value4.value = []
  value5.value = []
  value6.value = []
  selectedCounty.value = []
  selectedSubCounty.value = []
  selectedWard.value = []
  search_string.value = ''

  // Reset and sync pagination
  pSize.value = 10
  pageSize.value = 10
  page.value = 1
  currentPage.value = 1
  // Retain only the first element in filters and filterValues
  filters.value = filters.value.slice(0, 1);
  filterValues.value = filterValues.value.slice(0, 1);
  getFilteredData(filters.value, filterValues.value)
}



const onPageChange = async (selPage: any) => {
  console.log('on change change: selected   ', selCounties)
  page.value = selPage
  currentPage.value = selPage
  getFilteredData(filters.value, filterValues.value)
}

const onPageSizeChange = async (size: any) => {
  pSize.value = size
  pageSize.value = size
  page.value = 1 // Reset to first page when page size changes
  currentPage.value = 1
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

// Store roads for each settlement
const settlementRoads = ref<Record<number, any[]>>({})
const loadingFacilities = ref<Record<number, boolean>>({})

// Load roads for a specific settlement
const loadRoadsForSettlement = async (settlementId: number) => {
  if (settlementRoads.value[settlementId]) {
    return settlementRoads.value[settlementId]
  }

  loadingFacilities.value[settlementId] = true
  try {
    // Build filters array
    const facilityFilters: string[] = ['settlement_id']
    const facilityFilterValues: any[] = [[settlementId]]
    
    // Apply county restriction if user is county-restricted
    if (isCountyRestricted.value && userCountyId.value) {
      facilityFilters.push('county_id')
      facilityFilterValues.push([userCountyId.value])
    }
    
    const formData = {
      limit: 1000,
      page: 1,
      curUser: 1,
      model: roadFacilityModel,
      // Use county_id as search field for county-restricted users
      searchField: 'name',
      searchKeyword: '',
      filters: facilityFilters,
      filterValues: facilityFilterValues,
      associated_multiple_models: ['settlement', 'county', 'subcounty', 'ward', 'users']
    }

    const res = await getSettlementListByCounty(formData)
    settlementRoads.value[settlementId] = res.data || []
    return res.data || []
  } catch (error) {
    console.error('Error loading roads:', error)
    ElMessage.error('Failed to load roads')
    return []
  } finally {
    loadingFacilities.value[settlementId] = false
  }
}



const getFilteredData = async (_selFilters, _selfilterValues) => {
  const formData: any = {}
  formData.limit = pSize.value
  formData.page = page.value
  formData.curUser = 1
  formData.model = roadFacilityModel
  formData.searchField = 'name'
  formData.searchKeyword = search_string.value || ''

  const filtersArr: string[] = []
  const filterValuesArr: any[] = []

  if (isCountyRestricted.value && userCountyId.value) {
    filtersArr.push('county_id')
    filterValuesArr.push([userCountyId.value])
  } else if (userSettlementId.value && !isSuperAdmin.value && !hasNationalAccess.value) {
    filtersArr.push('settlement_id')
    filterValuesArr.push([userSettlementId.value])
  }

  if (selectedCounty.value?.length) {
    filtersArr.push('county_id')
    filterValuesArr.push(selectedCounty.value)
  }
  if (selectedSubCounty.value?.length) {
    filtersArr.push('subcounty_id')
    filterValuesArr.push(selectedSubCounty.value)
  }
  if (selectedWard.value?.length) {
    filtersArr.push('ward_id')
    filterValuesArr.push(selectedWard.value)
  }

  formData.filters = filtersArr
  formData.filterValues = filterValuesArr
  formData.associated_multiple_models = ['settlement', 'county', 'subcounty', 'ward']

  const res = await getSettlementListByCounty(formData)

  tableDataList.value = res.data || []
  total.value = res.total || (tableDataList.value?.length || 0)
  currentPage.value = page.value
  pageSize.value = pSize.value
  loading.value = false
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
      model: 'settlement',
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

const roadAssetGeo = ref([])

const getAssetGeo = async () => {

  const formData = {}
  formData.model = 'road_asset'


  console.log(formData)
  const res = await getAllGeo(formData)



  if (res.data[0].json_build_object) {


    roadAssetGeo.value = res.data[0].json_build_object
    console.log('getAssetGeo Returns---', res.data[0].json_build_object.features[0].geometry.coordinates)
    console.log("getAssetGeo Geo", roadAssetGeo)


  }



}
//getParentNames()
getCountyNames()

getModelOptions()
// Initialize user county filter after options are loaded
const initializeUserCountyFilter = async () => {
  await nextTick()
  if (isCountyRestricted.value && userCountyId.value) {
    // Pre-select user's county
    value4.value = [userCountyId.value]
    // Trigger county filter to load subcounties
    await filterByCounty(userCountyId.value)
    console.log('Initialized county filter for user:', userCountyId.value)
    // Refresh summary status to get county-restricted totals
    await getSummaryStatus()
  } else if (userSettlementId.value && !isSuperAdmin.value && !hasNationalAccess.value) {
    // User restricted to settlement - filter will be applied in getFilteredData
    console.log('User restricted to settlement:', userSettlementId.value)
    // Refresh summary status to get settlement-restricted totals
    await getSummaryStatus()
  }
}

// Initialize user county filter after a short delay to ensure options are loaded
setTimeout(() => {
  initializeUserCountyFilter()
}, 500)

getInterventionsAll()
getGeo()
getAssetGeo()



const loadMap = (roadDetails) => {
  var centerPosition = [37.137343, 1.137451]
  var zoom = 6

  var nmap = new mapboxgl.Map({
    container: "mapContainer",
    style: "mapbox://styles/mapbox/streets-v12",
    center: centerPosition, // starting position
    zoom: zoom,

  })

  // When the map fails to load, hide the base map and show only the overlays
  //  nmap.on('error', function (e) {
  // console.log('Failed.....', e.error)
  // nmap.setStyle( './style.json');
  //       console.log("Failed to load base map. Showing only overlays.");
  //   });


  console.log("resizing....")

  const nav = new mapboxgl.NavigationControl();
  nmap.addControl(nav, "top-right");
  nmap.on('load', () => {

    nmap.resize()

    nmap.addSource('roads', {
      type: 'geojson',
      // Use a URL for the value for the `data` property.
      data: facilityGeo.value,
      // data: 'https://data.humdata.org/dataset/e66dbc70-17fe-4230-b9d6-855d192fc05c/resource/51939d78-35aa-4591-9831-11e61e555130/download/kenya.geojson'
    });



    nmap.addSource('structures', {
      type: 'geojson',
      // Use a URL for the value for the `data` property.
      data: roadAssetGeo.value,
      // data: 'https://data.humdata.org/dataset/e66dbc70-17fe-4230-b9d6-855d192fc05c/resource/51939d78-35aa-4591-9831-11e61e555130/download/kenya.geojson'
    });


    nmap.addLayer({
      'id': 'structures',
      "type": "circle",
      'source': 'structures',
      'paint': {
        'circle-radius': 4,
        'circle-stroke-width': 2,
        'circle-color': [
          'case',
          ['==', ['get', 'asset_type'], 'footpath'],
          '#a6cee3',
          ['==', ['get', 'asset_type'], 'cycling_lane'],
          '#1f78b4',
          ['==', ['get', 'asset_type'], 'health_center'],
          '#b2df8a',
          ['==', ['get', 'asset_type'], 'streetlight'],
          '#33a02c',
          ['==', ['get', 'asset_type'], 'culvert'],
          '#fb9a99',
          ['==', ['get', 'asset_type'], 'bridge'],
          '#e31a1c',
          ['==', ['get', 'asset_type'], 'drift'],
          '#fdbf6f',
          ['==', ['get', 'asset_type'], 'parking'],
          '#ff7f00', 'gray'],
        'circle-stroke-color': 'white'
      }
    });

    nmap.addLayer({
      'id': 'roads-layer',
      "type": "line",
      'source': 'roads',
      'paint': {
        'line-color': [
          'case',
          ['==', ['get', 'surfaceType'], 'asphalt'],
          'red',
          ['==', ['get', 'surfaceType'], 'surface_dressing'],
          'purple',
          ['==', ['get', 'surfaceType'], 'gravel'],
          '#b2df8a',
          ['==', ['get', 'surfaceType'], 'earth'],
          '#33a02c',
          ['==', ['get', 'surfaceType'], 'cabro'],
          '#fb9a99',
          ['==', ['get', 'surfaceType'], 'track'],
          '#ff7f00', 'red'],
        'line-width': 3 // Adjust the thickness as desired

      }
    });




    nmap.addLayer({
      id: 'Satellite',
      source: { "type": "raster", "url": "mapbox://mapbox.satellite", "tileSize": 256 },
      type: "raster"
    }, 'roads-layer');

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

      {
        id: "structures",
        title: "Structures",
        visibility: 'none',
        type: 'base'
      },

    ];
    nmap.addControl(new MapboxLayerSwitcherControl(layers));
    // Zoom to layers if not by clik on a list
    if (roadDetails.length === 0) {
      // Get the bounds of the line layer
      const bounds = turf.bbox(facilityGeo.value);
      // Fit the map to the bounds
      nmap.fitBounds(bounds, { padding: 20 });
    }


    else {
      console.log('Geo', roadDetails[0])
      const bounds = turf.bbox(roadDetails[0]);
      console.log('bounds', bounds)

      nmap.fitBounds(bounds, { padding: 20 });

      const description = roadDetails[1]
      //  const coordinates = [roadDetails[0].geometry.coordinates[0][1]]
      new mapboxgl.Popup({ offset: [0, -15] })
        .setHTML('<h3>' + description + '</h3>') // CHANGE THIS TO REFLECT THE PROPERTIES YOU WANT TO SHOW
        .addTo(nmap);
    }

    // Listen for click events on the line layer
    nmap.on('click', 'roads-layer', function (e) {
      // Get the coordinates of the clicked point
      var coordinates = e.lngLat;
      const description = e.features[0].properties.name;
      const type = e.features[0].properties.surfaceType;
      // Create a popup with the desired content
      var popup = new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML('<h3>' + description + '</h3><p>' + type + '</p>') // CHANGE THIS TO REFLECT THE PROPERTIES YOU WANT TO SHOW
        .addTo(nmap);
    });

    // Listen for click events on the line layer
    nmap.on('click', 'structures', function (e) {
      // Get the coordinates of the clicked point
      var coordinates = e.lngLat;
      const description = e.features[0].properties.asset_type;
      const type = e.features[0].properties.asset_condition;
      // Create a popup with the desired content
      var popup = new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML('<h3>' + description + '</h3><p>' + type + '</p>') // CHANGE THIS TO REFLECT THE PROPERTIES YOU WANT TO SHOW
        .addTo(nmap);
    });


  });


}



const onSegmentClick = async () => {
  console.log(activeSegment.value);
  // Map segment now shows empty state - no need to load map here
  // Map is only shown in drawer when clicking "View on Map"

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
    name: 'RoadsDetails',
    params: { id: data.id }
  })
}

// Open map drawer for settlement
const flyTo = async (data: TableSlotDefault) => {
  try {
    selectedRoadId.value = data?.id ?? null
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
  await loadGoogleMapsApi()

    if (!window.google || !window.google.maps) {
      throw new Error('Google Maps API not loaded properly')
    }

    // Get settlement geometry
    const settlementId = settlement?.settlement_id || settlement?.id

    const geoForm: any = {
      model: 'settlement',
      id: settlementId
    }

    const res = await getOneGeo(geoForm)
    const geoData = res?.data?.[0]?.json_build_object
    const features = geoData?.features
    
    // Check if features is null or empty
    if (!features || (Array.isArray(features) && features.length === 0)) {
      ElMessage.warning("No boundary geometry found for this settlement. Showing map with roads only.")
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
            fillOpacity: 0, // Transparent fill
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

    // Wait for map to be ready before loading roads and road assets
    const loadRoadsWhenReady = async () => {
      await loadRoadsOnMap(settlementId)
      await loadRoadAssetsOnMap(settlementId)
    }

    // Use idle event to ensure map is fully loaded
    googleMap.value.addListener('idle', loadRoadsWhenReady)
    
    // Also try loading immediately in case map is already idle
    setTimeout(loadRoadsWhenReady, 500)

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

// Load roads on map
const loadRoadsOnMap = async (settlementId: number) => {
  try {
    // Clear existing polylines
    roadMarkers.value.forEach(polyline => polyline.setMap(null))
    roadMarkers.value = []

    if (!googleMap.value) {
      console.error('Google map not initialized')
      return
    }

    console.log('Loading roads for settlement:', settlementId)

    // Get roads GeoJSON
    const formData: any = {
      model: roadFacilityModel,
      columnFilterField: 'settlement_id',
      selectedParents: settlementId,
      filtredGeoIds: [settlementId]
    }
    
    // Apply county restriction if user is county-restricted
    if (isCountyRestricted.value && userCountyId.value) {
      formData.columnFilterField = 'county_id'
      formData.selectedParents = userCountyId.value
      formData.filtredGeoIds = [userCountyId.value]
    }

    const res = await getfilteredGeo(formData)
    
    console.log('Roads Geo response:', res)
    
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
      console.log('No GeoJSON data found for roads')
      ElMessage.info('No roads with geometry data found for this settlement.')
      return
    }
    
    if (geoJsonData.features === null || (Array.isArray(geoJsonData.features) && geoJsonData.features.length === 0)) {
      console.log('GeoJSON features is null or empty')
      ElMessage.info('No roads with geometry data found for this settlement.')
      roadsGeo.value = null
      return
    }
    
    roadsGeo.value = geoJsonData
    const features = geoJsonData.features || []
    
    console.log('Roads features count:', features.length)
    
    if (features.length === 0) {
      ElMessage.info('No roads found with geometry for this settlement.')
      roadsGeo.value = null
      return
    }
    
    // Process features and create polylines
    features.forEach((feature: any) => {
      if (feature.geometry && (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString')) {
        const coords = feature.geometry.coordinates
        if (!coords || coords.length === 0) {
          console.warn('Invalid coordinates:', coords)
          return
        }
        
        const featureRoadId = feature.properties?.id ?? feature.properties?.road_id ?? null
        const isCurrentRoad = selectedRoadId.value !== null && String(featureRoadId) === String(selectedRoadId.value)
        const color = isCurrentRoad ? '#22c55e' : '#9ca3af'
        
        try {
          let path: any[] = []
          
          if (feature.geometry.type === 'LineString') {
            path = coords.map((coord: number[]) => ({
              lat: coord[1],
              lng: coord[0]
            }))
          } else if (feature.geometry.type === 'MultiLineString') {
            // Use first line string
            path = coords[0].map((coord: number[]) => ({
              lat: coord[1],
              lng: coord[0]
            }))
          }
          
          const polyline = new window.google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: color,
            strokeOpacity: isCurrentRoad ? 1 : 0.7,
            strokeWeight: isCurrentRoad ? 6 : 4,
            map: googleMap.value
          })
          
          // Store road data with polyline
          facilityMarkerDataMap.value.set(polyline, feature.properties)
          
          // Add click listener to open road form drawer
          polyline.addListener('click', async () => {
            const roadProperties = feature.properties || {}
            const roadId = roadProperties.id || roadProperties.road_id
            
            // Close map drawer if open to show road form drawer
            if (mapDrawerVisible.value) {
              // Don't close map drawer, just open road drawer on top
            }
            
            if (roadId) {
              // Fetch full road data to ensure we have all fields
              try {
                const formData: any = {
                  limit: 1,
                  page: 1,
                  curUser: 1,
                  model: roadFacilityModel,
                  searchField: 'id',
                  searchKeyword: roadId.toString(),
                  filters: ['id'],
                  filterValues: [[roadId]],
                  associated_multiple_models: ['settlement', 'county', 'subcounty', 'ward', 'users']
                }
                
                const roadRes = await getSettlementListByCounty(formData)
                
                if (roadRes.data && roadRes.data.length > 0) {
                  // Ensure settlement_id is set from map drawer if missing
                  const roadData = roadRes.data[0]
                  if (!roadData.settlement_id && mapDrawerSettlement.value?.id) {
                    roadData.settlement_id = mapDrawerSettlement.value.id
                  }
                  if (!roadData.county_id && mapDrawerSettlement.value?.county_id) {
                    roadData.county_id = mapDrawerSettlement.value.county_id
                  }
                  if (!roadData.subcounty_id && mapDrawerSettlement.value?.subcounty_id) {
                    roadData.subcounty_id = mapDrawerSettlement.value.subcounty_id
                  }
                  if (!roadData.ward_id && mapDrawerSettlement.value?.ward_id) {
                    roadData.ward_id = mapDrawerSettlement.value.ward_id
                  }
                  
                  // Open drawer with full road data
                  openRoadForm(roadData)
                } else {
                  // Fallback: use properties if full data not available
                  const fallbackData = {
                    ...roadProperties,
                    settlement_id: roadProperties.settlement_id || mapDrawerSettlement.value?.id || '',
                    county_id: roadProperties.county_id || mapDrawerSettlement.value?.county_id || '',
                    subcounty_id: roadProperties.subcounty_id || mapDrawerSettlement.value?.subcounty_id || '',
                    ward_id: roadProperties.ward_id || mapDrawerSettlement.value?.ward_id || ''
                  }
                  ElMessage.warning('Could not load full road data. Using available information.')
                  openRoadForm(fallbackData)
                }
              } catch (error) {
                console.error('Error fetching road data:', error)
                // Fallback: use properties directly with settlement context
                const fallbackData = {
                  ...roadProperties,
                  settlement_id: roadProperties.settlement_id || mapDrawerSettlement.value?.id || '',
                  county_id: roadProperties.county_id || mapDrawerSettlement.value?.county_id || '',
                  subcounty_id: roadProperties.subcounty_id || mapDrawerSettlement.value?.subcounty_id || '',
                  ward_id: roadProperties.ward_id || mapDrawerSettlement.value?.ward_id || ''
                }
                openRoadForm(fallbackData)
              }
            } else {
              // No ID available, use properties directly with settlement context
              const fallbackData = {
                ...roadProperties,
                settlement_id: roadProperties.settlement_id || mapDrawerSettlement.value?.id || '',
                county_id: roadProperties.county_id || mapDrawerSettlement.value?.county_id || '',
                subcounty_id: roadProperties.subcounty_id || mapDrawerSettlement.value?.subcounty_id || '',
                ward_id: roadProperties.ward_id || mapDrawerSettlement.value?.ward_id || ''
              }
              ElMessage.warning('Road ID not found. Some fields may be missing.')
              openRoadForm(fallbackData)
            }
          })
          
          roadMarkers.value.push(polyline)
        } catch (error) {
          console.error('Error creating polyline:', error, feature)
        }
      } else {
        console.warn('Feature is not a LineString:', feature.geometry?.type)
      }
    })
    
    console.log('Total polylines created:', roadMarkers.value.length)
    
    if (roadMarkers.value.length === 0) {
      ElMessage.info('No roads with valid LineString geometry found')
    } else {
      ElMessage.success(`Loaded ${roadMarkers.value.length} roads on map`)
    }
  } catch (error) {
    console.error("Error loading roads on map:", error)
    ElMessage.error("Failed to load roads on map: " + (error as Error).message)
  }
}

const getPointCoords = (geometry: any): number[] | null => {
  if (!geometry) return null
  if (geometry.type === 'Point') return geometry.coordinates
  if (geometry.type === 'MultiPoint') return geometry.coordinates?.[0] || null
  if (geometry.type === 'LineString') return geometry.coordinates?.[0] || null
  if (geometry.type === 'MultiLineString') return geometry.coordinates?.[0]?.[0] || null
  if (geometry.type === 'Polygon') return geometry.coordinates?.[0]?.[0] || null
  return null
}

const loadRoadAssetsOnMap = async (settlementId: number) => {
  roadAssetMarkers.value.forEach((m: any) => m.setMap(null))
  roadAssetMarkers.value = []

  try {
    // Get road assets filtered by settlement ID
    const assetGeoForm: any = {
      model: 'road_asset',
      columnFilterField: 'settlement_id',
      selectedParents: [settlementId],
      filtredGeoIds: [settlementId]
    }
    const res: any = await getfilteredGeo(assetGeoForm as any)
    const geoJsonData = res?.data?.[0]?.json_build_object || res?.data?.[0]?.[0]?.json_build_object || res?.[0]?.json_build_object
    const assetFeatures = geoJsonData?.features || []

    const roadAssetColorMap: Record<string, string> = {
      Bridge: '#e31a1c',
      Culvert: '#fb9a99',
      Bus_Stop: '#ff7f00',
      Boda_Shed: '#fdbf6f',
      Streetlights: '#33a02c'
    }

    assetFeatures.forEach((feature: any) => {
      const point = getPointCoords(feature?.geometry)
      if (!point) return
      const [lng, lat] = point
      const assetType = feature?.properties?.asset_type || ''
      const markerColor = roadAssetColorMap[assetType] || '#8b5cf6'
      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: googleMap.value,
        title: feature?.properties?.name || `Road Asset (${assetType})`,
        icon: {
          path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 5,
          fillColor: markerColor,
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          rotation: 0
        },
        zIndex: 550
      })

      marker.addListener('click', () => {
        const props = feature?.properties || {}
        const infoContent = `
          <div style="padding:6px;min-width:180px">
            <strong>${props.name || 'Road Asset'}</strong><br/>
            <span>Type: ${props.asset_type || 'N/A'}</span><br/>
            <span>Condition: ${props.asset_condition || props.condition || 'N/A'}</span>
          </div>
        `
        const infoWindow = new window.google.maps.InfoWindow({ content: infoContent })
        infoWindow.open(googleMap.value, marker)
      })

      roadAssetMarkers.value.push(marker)
    })
  } catch (e) {
    console.error('Failed to load road assets:', e)
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
  // Clean up polylines
  roadMarkers.value.forEach(polyline => polyline.setMap(null))
  roadMarkers.value = []
  // Clean up road asset markers
  roadAssetMarkers.value.forEach((m: any) => m.setMap(null))
  roadAssetMarkers.value = []
  facilityMarkerDataMap.value.clear()
  
  if (settlementPolygon.value) {
    settlementPolygon.value.setMap(null)
    settlementPolygon.value = null
  }
  googleMap.value = null
  mapDrawerSettlement.value = null
  selectedRoadId.value = null
}

// Road form drawer state
const roadDrawerVisible = ref(false)
const roadFormRef = ref<FormInstance>()
const editingRoadId = ref<number | null>(null)
const isEditMode = ref(false)

// Road form data - similar to AddRoadNew.vue
const roadForm = reactive({
  name: '',
  rdNum: '',
  rdClass: '',
  rdReserve: 0,
  surfaceType: '',
  surfaceCondition: '',
  traffic: '',
  direction: '',
  drainage: '',
  drainageCondition: '',
  width: 0,
  settlement_id: '',
  county_id: '',
  subcounty_id: '',
  ward_id: '',
  geom: null
})

// Surface type options from AddRoadNew.vue
const SurfaceTypeOtionsLocal = [
  { label: 'Asphalt', value: 'asphalt' },
  { label: 'Surface Dressing', value: 'surface_dressing' },
  { label: 'Gravel', value: 'gravel' },
  { label: 'Earth', value: 'earth' },
  { label: 'Jointed Concrete', value: 'concrete_jt' },
  { label: 'Concrete Blocks', value: 'concrete_bl' },
  { label: 'Reinforced Concrete', value: 'concrete_rein' },
  { label: 'Brick', value: 'brick' },
  { label: 'Cobble stone road', value: 'set_stone' },
  { label: 'Unimproved road with tyre tracks visible', value: 'track' },
  { label: 'Other(Rater to provide description and Photo)', value: 'other' }
]

// Condition options
const conditionOptionsLocal = [
  { label: 'Under construction ', value: 'Under construction ' },
  { label: 'Broken/not in use', value: 'Broken/not in use' },
  { label: 'Operational ', value: 'Operational ' },
  { label: 'Decomissioned', value: 'Decomissioned' }
]

// Drainage location options
const drainageTypeOtionsLocal = [
  { label: 'One Side', value: 'One Side' },
  { label: 'Both Sides', value: 'Both Sides' }
]

// Traffic options
const trafficOptions = [
  { label: 'Busy', value: 'busy' },
  { label: 'Used', value: 'used' },
  { label: 'Rare', value: 'rare' }
]

// Direction options
const directionOptions = [
  { label: 'One Way', value: 'One Way' },
  { label: 'Two Way', value: 'Two Way' }
]

// Road form validation rules
const roadFormRules = reactive({
  name: [{ required: true, message: 'Road name is required', trigger: 'blur' }],
  settlement_id: [{ required: true, message: 'Settlement is required', trigger: 'blur' }],
  width: [{ required: true, message: 'Road width is required', trigger: 'blur' }],
  surfaceType: [{ required: true, message: 'Surface type is required', trigger: 'change' }]
})

// Open road form drawer for editing
const openRoadForm = (roadData: any) => {
  isEditMode.value = true
  editingRoadId.value = roadData.id || null
  
  // Populate form with road data
  roadForm.name = roadData.name || ''
  roadForm.rdNum = roadData.rdNum || roadData.rd_num || ''
  roadForm.rdClass = roadData.rdClass || roadData.rd_class || ''
  roadForm.rdReserve = roadData.rdReserve || roadData.rd_reserve || 0
  roadForm.surfaceType = roadData.surfaceType || roadData.surface_type || ''
  roadForm.surfaceCondition = roadData.surfaceCondition || roadData.surface_condition || ''
  roadForm.traffic = roadData.traffic || ''
  roadForm.direction = roadData.direction || ''
  roadForm.drainage = roadData.drainage || ''
  roadForm.drainageCondition = roadData.drainageCondition || roadData.rd_drainage_condition || ''
  roadForm.width = roadData.width || 0
  roadForm.settlement_id = roadData.settlement_id || ''
  roadForm.county_id = roadData.county_id || ''
  roadForm.subcounty_id = roadData.subcounty_id || ''
  roadForm.ward_id = roadData.ward_id || ''
  roadForm.geom = roadData.geom || null
  
  roadDrawerVisible.value = true
}

// Submit road form
const submitRoadForm = async () => {
  if (!roadFormRef.value) return
  
  await roadFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const formDataToSubmit = {
          ...roadForm,
          model: roadFacilityModel
        }
        
        if (isEditMode.value && editingRoadId.value) {
          // Update existing road
          formDataToSubmit.id = editingRoadId.value
          
          const res = await updateOneRecord(formDataToSubmit)
          
          if (res.code === '0000') {
            ElMessage.success('Road updated successfully')
            
            // Refresh the data
            await getFilteredData(filters.value, filterValues.value)
            
            // Reload roads for the settlement if available
            if (roadForm.settlement_id) {
              await loadRoadsForSettlement(roadForm.settlement_id)
            }
            
            roadDrawerVisible.value = false
          } else {
            ElMessage.error('Failed to update road')
          }
        } else {
          ElMessage.error('Invalid edit mode')
        }
      } catch (error) {
        console.error('Error saving road:', error)
        ElMessage.error('Failed to save road')
      }
    }
  })
}

// Reset road form
const resetRoadForm = () => {
  isEditMode.value = false
  editingRoadId.value = null
  Object.keys(roadForm).forEach(key => {
    if (typeof roadForm[key as keyof typeof roadForm] === 'string') {
      roadForm[key as keyof typeof roadForm] = '' as any
    } else if (typeof roadForm[key as keyof typeof roadForm] === 'number') {
      roadForm[key as keyof typeof roadForm] = 0 as any
    } else {
      roadForm[key as keyof typeof roadForm] = null as any
    }
  })
}

// Close road drawer
const closeRoadDrawer = () => {
  roadDrawerVisible.value = false
  resetRoadForm()
}







 
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
  formData.model = roadFacilityModel
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
    color: 'red',
    label: 'Asphalt'
  },
  {
    color: '#1f78b4',
    label: ' Surface Dressing'
  },
  {
    color: '#b2df8a',
    label: ' Gravel'
  },
  {
    color: '#33a02c',
    label: ' Earth'
  },
  {
    color: '#fb9a99',
    label: ' Cabro'
  },
  {
    color: 'gray',
    label: 'Track'
  },
  {
    color: '#ff7f00',
    label: 'Other'
  }

]



const DeleteFacility = async (data: TableSlotDefault) => {
  console.log('-----> Deleting Facility:', data)
  
  try {
    const formData: Record<string, any> = {
      id: data.id,
      model: roadFacilityModel,
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
const mfield = 'road_id'
const ChildComponent = defineAsyncComponent(() => import('@/views/Components/UploadComponent.vue'));

const dynamicComponent = ref();
const componentProps = ref({
  message: 'Hello from parent',
  showDialog: addMoreDocuments,
  data: currentRow.value,
  umodel: roadFacilityModel,
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
  docmodel: roadFacilityModel,

});


const handleExpand = async (row: any) => {
  // Load roads for this settlement
  await loadRoadsForSettlement(row.id)
  
  // Handle documents (existing functionality)
  dynamicDocumentComponent.value = null; // Unload the component
  rowData.value = row
  DocumentComponentProps.value.data = row
  setTimeout(() => {
    dynamicDocumentComponent.value = documentComponent; // Load the component
  }, 100); // 0.1 seconds
}


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

const getFilteredBySearchData = async (searchKey) => {
  page.value = 1
  currentPage.value = 1
  searchLoading.value = true

  const formData: any = {}
  formData.limit = pSize.value
  formData.page = page.value
  formData.curUser = 1
  formData.model = roadFacilityModel
  formData.searchField = 'name'
  formData.searchKeyword = searchKey || ''

  const filtersArr: string[] = []
  const filterValuesArr: any[] = []

  if (isCountyRestricted.value && userCountyId.value) {
    filtersArr.push('county_id')
    filterValuesArr.push([userCountyId.value])
  } else if (userSettlementId.value && !isSuperAdmin.value && !hasNationalAccess.value) {
    filtersArr.push('settlement_id')
    filterValuesArr.push([userSettlementId.value])
  }

  if (selectedCounty.value?.length) {
    filtersArr.push('county_id')
    filterValuesArr.push(selectedCounty.value)
  }
  if (selectedSubCounty.value?.length) {
    filtersArr.push('subcounty_id')
    filterValuesArr.push(selectedSubCounty.value)
  }
  if (selectedWard.value?.length) {
    filtersArr.push('ward_id')
    filterValuesArr.push(selectedWard.value)
  }

  formData.filters = filtersArr
  formData.filterValues = filterValuesArr
  formData.associated_multiple_models = ['settlement', 'county', 'subcounty', 'ward']

  const res = await searchByKeyWord(formData)
  searchLoading.value = false

  tableDataList.value = res.data || []
  total.value = res.total || (tableDataList.value?.length || 0)
  currentPage.value = page.value
  pageSize.value = pSize.value
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

  value5.value = []; // Clear the subcounty properly
  value6.value = []; // Clear the ward properly

  // Reset pagination when filters change
  page.value = 1
  currentPage.value = 1

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

  // Reset pagination when filters change
  page.value = 1
  currentPage.value = 1

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

  // Reset pagination when filters change
  page.value = 1
  currentPage.value = 1

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

  // Reset pagination when search changes
  page.value = 1
  currentPage.value = 1

  if (search_string.value) {


    getFilteredBySearchData(search_string.value)

  }

}



const AddFacility = (data?: any) => {
  const queryParams: any = {}
  
  if (data) {
    // If settlement data is provided, use that county and settlement
    queryParams.county_id = data.county_id || data.county?.id || ''
    queryParams.settlement_id = data.id || ''
  } else if (isCountyRestricted.value && userCountyId.value) {
    // User is restricted to their county - pre-select it
    queryParams.county_id = userCountyId.value
    console.log('Pre-selecting user county for new facility:', userCountyId.value)
  } else if (userSettlementId.value && !isSuperAdmin.value && !hasNationalAccess.value) {
    // User is restricted to their settlement
    queryParams.settlement_id = userSettlementId.value
    // Also get county from settlement if possible
    if (userCountyId.value) {
      queryParams.county_id = userCountyId.value
    }
  }
  
  push({
    name: 'AddRoadX',
    query: queryParams
  })
}

const editFacility = (data: TableSlotDefault) => {
  // Open drawer with road form for editing
  openRoadForm(data)
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
          filterable collapse-tags placeholder="By County" style=" margin-right: 5px;"
          :disabled="isCountyRestricted">
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
            <el-button v-loading="searchLoading" :icon="Search" @click="searchByNewName" />
          </template>
        </el-input>
      </el-col>



      <el-col :xs="24" :sm="24" :md="12" :lg="4">

        <div style="display: flex; align-items: center; gap: 10px; margin-right: 10px;">

          <el-tooltip content="Add Facility" placement="top">
            <PermissionWrapper :permissions="'road:create'">
              <el-button @click="AddFacility" type="primary" :icon="Plus" />
            </PermissionWrapper>
          </el-tooltip>

          <el-tooltip content="Clear" placement="top">
            <el-button @click="handleClear" type="primary" :icon="Filter" />
          </el-tooltip>

          <DownloadCustom
v-if="showEditButtons" :data="tableDataList" :model="roadFacilityModel"
            :associated_models="associated_multiple_models"
                      :total="total"
                      :filters="filters"
                      :filter-values="filterValues"
/>
        </div>


      </el-col>



    </el-row>




    
    <el-table
      :data="tableDataList"
      style="width: 100%; margin-top: 10px;"
      border
      :size="isMobile ? 'small' : 'default'"
    >
      <el-table-column label="Road Name" prop="name" sortable :min-width="isMobile ? 160 : 220" show-overflow-tooltip />

      <el-table-column :label="isMobile ? 'Location' : 'Location (Settlement / Ward / Subcounty / County)'" :min-width="isMobile ? 220 : 260">
        <template #default="scope">
          {{ scope.row.settlement?.name || 'N/A' }},
          {{ scope.row.ward?.name || 'N/A' }} ward,
          {{ scope.row.subcounty?.name || 'N/A' }} subcounty,
          {{ scope.row.county?.name || 'N/A' }} County
        </template>
      </el-table-column>

      <el-table-column label="Road Class" prop="rd_class" :min-width="isMobile ? 110 : 140" show-overflow-tooltip />
      <el-table-column label="Surface" prop="surface_type" :min-width="isMobile ? 110 : 140" show-overflow-tooltip />

      <el-table-column label="Road Metrics" min-width="220">
        <template #default="scope">
          <div>
            <div><strong>Width:</strong> {{ scope.row.width || 'N/A' }}</div>
            <div style="margin-top:2px;"><strong>Traffic:</strong> {{ scope.row.traffic || 'N/A' }}</div>
            <div style="margin-top:2px;"><strong>Drainage:</strong> {{ scope.row.rd_drainage_condition || scope.row.drainageCondition || 'N/A' }}</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Actions" :min-width="isMobile ? 72 : 200" align="center" fixed="right">
        <template #default="{ row }">
          <TableActions
            :item="row"
            :buttons="action_buttons"
            @view-profile="viewProfile"
            @view-on-map="flyTo"
            @delete="DeleteFacility"
          />
        </template>
      </el-table-column>
    </el-table>

    <div v-if="!tableDataList || tableDataList.length === 0" class="no-data-message">
      <el-empty description="No roads found" />
    </div>

    <ElPagination
      v-if="tableDataList && tableDataList.length > 0"
      :layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'"
      v-model:currentPage="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[10, 25, 50, 100]"
      :total="total"
      :background="true"
      :small="isMobile"
      :pager-count="isMobile ? 3 : 7"
      @size-change="onPageSizeChange"
      @current-change="onPageChange"
      class="mt-4 facility-pagination"
    />
<div v-if="false" class="custom-style">

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

    <div v-if="false">
      <el-table :data="tableDataList" style="width: 100%; margin-top: 10px;" border @expand-change="handleExpand" row-key="id">
        <el-table-column type="expand">
          <template #default="props">
            <div style="padding: 20px;">
              <h3>Roads in {{ props.row.name }}</h3>
              <div v-if="loadingFacilities[props.row.id]" style="text-align: center; padding: 20px;">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>Loading roads...</span>
              </div>
              <el-table 
                v-else
                :data="settlementRoads[props.row.id] || []" 
                style="width: 100%;" 
                border
                size="small"
              >
                <el-table-column label="Road Name" prop="name">
                  <template #default="scope">
                    <el-button type="primary" link @click="openRoadForm(scope.row)">
                      {{ scope.row.name || 'N/A' }}
                    </el-button>
                  </template>
                </el-table-column>
                <el-table-column label="Surface Type" prop="surface_type" />
                <el-table-column label="Drainage Condition" prop="rd_drainage_condition" />
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
                    <PermissionWrapper :permissions="['road:update', 'road:delete']">
                      <el-button size="small" type="primary" :icon="Edit" @click="editFacility(row)" />
                      <el-button size="small" type="danger" :icon="Delete" @click="DeleteFacility(row)" />
                    </PermissionWrapper>
                  </template>
                </el-table-column>
              </el-table>
              <div v-if="!loadingFacilities[props.row.id] && (!settlementRoads[props.row.id] || settlementRoads[props.row.id].length === 0)" style="text-align: center; padding: 20px;">
                <el-empty description="No roads found in this settlement" />
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
        <el-table-column label="Roads Count" sortable>
          <template #default="scope">
            <el-badge :value="settlementRoads[scope.row.id]?.length || 0" class="item" />
          </template>
        </el-table-column>

        <el-table-column label="Actions" width="250">
          <template #default="{ row }">
              <TableActions
              :item="row" :buttons="action_buttons" @view-on-map="flyTo" @delete="DeleteFacility" />
          </template>
        </el-table-column>

      </el-table>

      <div v-if="!tableDataList || tableDataList.length === 0" class="no-data-message">
        <el-empty description="No settlements with approved roads found" />
      </div>

      <ElPagination
        v-if="tableDataList && tableDataList.length > 0"
        :layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'" 
        v-model:currentPage="currentPage"
        v-model:page-size="pageSize" 
        :page-sizes="[6, 20, 50, 200, 1000]" 
        :total="total" 
        :background="true"
        :small="isMobile"
        :pager-count="isMobile ? 3 : 7"
        @size-change="onPageSizeChange" 
        @current-change="onPageChange" 
        class="mt-4 facility-pagination" />

    </div>


    <div v-if="false">
      <el-table :data="tableDataListNew" style="width: 100%; margin-top: 10px;" border @expand-change="handleExpand" row-key="id">
        <el-table-column type="expand">
          <template #default="props">
            <div style="padding: 20px;">
              <h3>Roads in {{ props.row.name }}</h3>
              <div v-if="loadingFacilities[props.row.id]" style="text-align: center; padding: 20px;">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>Loading roads...</span>
              </div>
              <el-table 
                v-else
                :data="settlementRoads[props.row.id] || []" 
                style="width: 100%;" 
                border
                size="small"
              >
                <el-table-column label="Road Name" prop="name">
                  <template #default="scope">
                    <el-button type="primary" link @click="openRoadForm(scope.row)">
                      {{ scope.row.name || 'N/A' }}
                    </el-button>
                  </template>
                </el-table-column>
                <el-table-column label="Surface Type" prop="surface_type" />
                <el-table-column label="Drainage Condition" prop="rd_drainage_condition" />
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
                    <PermissionWrapper :permissions="['road:update', 'road:delete', 'road:review']">
                      <el-button size="small" type="primary" :icon="Edit" @click="editFacility(row)" />
                      <el-button size="small" type="danger" :icon="Delete" @click="DeleteFacility(row)" />
                      <el-button size="small" type="warning" @click="Review(row)" />
                    </PermissionWrapper>
                  </template>
                </el-table-column>
              </el-table>
              <div v-if="!loadingFacilities[props.row.id] && (!settlementRoads[props.row.id] || settlementRoads[props.row.id].length === 0)" style="text-align: center; padding: 20px;">
                <el-empty description="No roads found in this settlement" />
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
        <el-table-column label="Roads Count" sortable>
          <template #default="scope">
            <el-badge :value="settlementRoads[scope.row.id]?.length || 0" class="item" />
          </template>
        </el-table-column>

        <el-table-column label="Actions" width="250">
          <template #default="{ row }">
              <TableActions
              :item="row" :buttons="action_buttons" @view-on-map="flyTo" @delete="DeleteFacility" />
          </template>
        </el-table-column>

      </el-table>

      <div v-if="!tableDataListNew || tableDataListNew.length === 0" class="no-data-message">
        <el-empty description="No settlements with new roads found" />
      </div>

      <ElPagination
        v-if="tableDataListNew && tableDataListNew.length > 0"
        :layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'" 
        v-model:currentPage="currentPage"
        v-model:page-size="pageSize" 
        :page-sizes="[5, 10, 20, 50, 100]" 
        :total="totalNew" 
        :background="true"
        :small="isMobile"
        :pager-count="isMobile ? 3 : 7"
        @size-change="onPageSizeChange" 
        @current-change="onPageChange" 
        class="mt-4 facility-pagination" />
    </div>

    <div v-if="false">

      <el-table
        :data="tableDataListRejected" style="width: 100%; margin-top: 10px;" border
        @expand-change="handleExpand" row-key="id">
        <el-table-column type="expand">
          <template #default="props">
            <div style="padding: 20px;">
              <h3>Roads in {{ props.row.name }}</h3>
              <div v-if="loadingFacilities[props.row.id]" style="text-align: center; padding: 20px;">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>Loading roads...</span>
              </div>
              <el-table 
                v-else
                :data="settlementRoads[props.row.id] || []" 
                style="width: 100%;" 
                border
                size="small"
              >
                <el-table-column label="Road Name" prop="name">
                  <template #default="scope">
                    <el-button type="primary" link @click="openRoadForm(scope.row)">
                      {{ scope.row.name || 'N/A' }}
                    </el-button>
                  </template>
                </el-table-column>
                <el-table-column label="Surface Type" prop="surface_type" />
                <el-table-column label="Drainage Condition" prop="rd_drainage_condition" />
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
                    <PermissionWrapper :permissions="['road:update', 'road:delete']">
                      <el-button size="small" type="primary" :icon="Edit" @click="editFacility(row)" />
                      <el-button size="small" type="danger" :icon="Delete" @click="DeleteFacility(row)" />
                    </PermissionWrapper>
                  </template>
                </el-table-column>
              </el-table>
              <div v-if="!loadingFacilities[props.row.id] && (!settlementRoads[props.row.id] || settlementRoads[props.row.id].length === 0)" style="text-align: center; padding: 20px;">
                <el-empty description="No roads found in this settlement" />
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
        <el-table-column label="Roads Count" sortable>
          <template #default="scope">
            <el-badge :value="settlementRoads[scope.row.id]?.length || 0" class="item" />
          </template>
        </el-table-column>

        <el-table-column label="Actions" width="250">
          <template #default="{ row }">
              <TableActions
              :item="row" :buttons="action_buttons" @view-on-map="flyTo" @delete="DeleteFacility" />
          </template>
        </el-table-column>

      </el-table>

      <div v-if="!tableDataListRejected || tableDataListRejected.length === 0" class="no-data-message">
        <el-empty description="No rejected roads found" />
      </div>

      <ElPagination
        v-if="tableDataListRejected && tableDataListRejected.length > 0"
        :layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'" 
        v-model:currentPage="currentPage"
        v-model:page-size="pageSize" 
        :page-sizes="[5, 10, 20, 50, 100]" 
        :total="totalRejected" 
        :background="true"
        :small="isMobile"
        :pager-count="isMobile ? 3 : 7"
        @size-change="onPageSizeChange" 
        @current-change="onPageChange" 
        class="mt-4 facility-pagination" />

    </div>


  <!-- Map Drawer -->
  <el-drawer
    v-model="mapDrawerVisible"
    title="Settlement Map with Roads"
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
      <!-- Legend -->
      <div class="map-legend">
        <h4 class="legend-title">Map Legend</h4>
        <div class="legend-section">Roads</div>
        <div class="legend-item">
          <div class="legend-line" style="background-color: #22c55e;"></div>
          <span class="legend-label">Selected road</span>
        </div>
        <div class="legend-item">
          <div class="legend-line" style="background-color: #9ca3af; opacity: 0.7;"></div>
          <span class="legend-label">Other roads</span>
        </div>
        <div class="legend-section">Road Assets</div>
        <div class="legend-item">
          <span class="legend-arrow" style="color:#e31a1c;">&#9654;</span>
          <span class="legend-label">Bridge</span>
        </div>
        <div class="legend-item">
          <span class="legend-arrow" style="color:#fb9a99;">&#9654;</span>
          <span class="legend-label">Culvert</span>
        </div>
        <div class="legend-item">
          <span class="legend-arrow" style="color:#ff7f00;">&#9654;</span>
          <span class="legend-label">Bus Stop</span>
        </div>
        <div class="legend-item">
          <span class="legend-arrow" style="color:#fdbf6f;">&#9654;</span>
          <span class="legend-label">Boda Shed</span>
        </div>
        <div class="legend-item">
          <span class="legend-arrow" style="color:#33a02c;">&#9654;</span>
          <span class="legend-label">Streetlights</span>
        </div>
        <div class="legend-section">Boundary</div>
        <div class="legend-item">
          <div class="legend-line legend-line-dashed" style="background-color: transparent; border-bottom: 3px dashed #FF0000;"></div>
          <span class="legend-label">Settlement boundary</span>
        </div>
      </div>
    </div>
  </el-drawer>

  </el-card>

  <!-- Road Form Drawer for Editing -->
  <el-drawer
    v-model="roadDrawerVisible"
    :title="isEditMode ? 'Edit Road' : 'Road Details'"
    direction="rtl"
    :size="isMobile ? '100%' : '600px'"
    :before-close="closeRoadDrawer"
    class="road-form-drawer"
  >
    <el-form
      ref="roadFormRef"
      :model="roadForm"
      :rules="roadFormRules"
      :label-width="isMobile ? '0px' : '180px'"
      :label-position="isMobile ? 'top' : 'left'"
      class="road-form-mobile"
    >
      <el-divider content-position="left">Basic Information</el-divider>

      <el-form-item label="Road Name" prop="name">
        <el-input v-model="roadForm.name" placeholder="Enter road name" />
      </el-form-item>

      <el-form-item label="Road Number">
        <el-input v-model="roadForm.rdNum" placeholder="Enter road number" />
      </el-form-item>

      <el-form-item label="Road Class">
        <el-select v-model="roadForm.rdClass" placeholder="Select class" filterable style="width: 100%">
          <el-option
            v-for="item in RdClassOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Road Width (m)" prop="width">
        <el-input-number v-model="roadForm.width" :min="0" :precision="2" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Road Reserve (m)">
        <el-input-number v-model="roadForm.rdReserve" :min="0" :precision="2" style="width: 100%" />
      </el-form-item>

      <el-divider content-position="left">Surface & Condition</el-divider>

      <el-form-item label="Surface Type" prop="surfaceType">
        <el-select v-model="roadForm.surfaceType" placeholder="Select surface type" filterable style="width: 100%">
          <el-option
            v-for="item in SurfaceTypeOtionsLocal"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Surface Condition">
        <el-select v-model="roadForm.surfaceCondition" placeholder="Select condition" filterable style="width: 100%">
          <el-option
            v-for="item in conditionOptionsLocal"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-divider content-position="left">Drainage</el-divider>

      <el-form-item label="Drainage Location">
        <el-select v-model="roadForm.drainage" placeholder="Select drainage location" filterable style="width: 100%">
          <el-option
            v-for="item in drainageTypeOtionsLocal"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Drainage Condition">
        <el-select v-model="roadForm.drainageCondition" placeholder="Select condition" filterable style="width: 100%">
          <el-option
            v-for="item in conditionOptionsLocal"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-divider content-position="left">Traffic</el-divider>

      <el-form-item label="Traffic">
        <el-select v-model="roadForm.traffic" placeholder="Select traffic level" filterable style="width: 100%">
          <el-option
            v-for="item in trafficOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Direction">
        <el-select v-model="roadForm.direction" placeholder="Select direction" filterable style="width: 100%">
          <el-option
            v-for="item in directionOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="drawer-footer">
        <el-button @click="closeRoadDrawer" class="footer-btn">Cancel</el-button>
        <el-button type="primary" @click="submitRoadForm" :icon="Check" class="footer-btn">
          {{ isEditMode ? 'Update Road' : 'Save Road' }}
        </el-button>
      </div>
    </template>
  </el-drawer>


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


</template>

<style scoped>
.basemap {
  width: 100%;
  height: 65vh;
  /* Set the height to 75% of the viewport height */
}

.no-data-message {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  margin: 20px 0;
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

.map-legend {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.2);
  z-index: 1000;
  max-width: 280px;
}

.legend-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.legend-line {
  width: 30px;
  height: 4px;
  margin-right: 12px;
  border-radius: 2px;
  flex-shrink: 0;
}

.legend-line-dashed {
  height: 0;
}

.legend-label {
  font-size: 12px;
  color: #333;
  line-height: 1.4;
}

.legend-section {
  font-size: 11px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 8px 0 4px 0;
  padding-bottom: 2px;
  border-bottom: 1px solid #e5e7eb;
}

.legend-arrow {
  font-size: 14px;
  margin-right: 10px;
  line-height: 1;
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

  .map-legend {
    bottom: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
    padding: 12px;
  }

  .drawer-title {
    font-size: 14px;
  }

  .close-btn-mobile {
    padding: 6px 12px;
    font-size: 13px;
  }
}

.road-form-drawer :deep(.el-drawer__body) {
  padding: 20px;
  overflow-y: auto;
}

.road-form-mobile {
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
  .road-form-drawer :deep(.el-drawer__body) {
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
</style>



