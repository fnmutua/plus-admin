<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">

import { getSettlementListByCounty, DeleteRecord, updateOneRecord, getOneGeo, deleteDocument, searchByKeyWord, getAllGeo, getfilteredGeo, CreateRecord } from '@/api/settlements'
import { getCountyListApi, getListWithoutGeo } from '@/api/counties'
import { getFile, getSummarybyFieldFromMultipleIncludes } from '@/api/summary'

import {
  ElButton, ElSelect, MessageParamsWithType, UploadProps, ElDescriptions, ElDescriptionsItem, ElCol, ElRow, ElCard,
  ElOptionGroup, ElOption, FormInstance, ElMessage, ElCollapse, ElCollapseItem, ElInput, ElBadge, ElSegmented,
  ElPagination, ElTooltip, ElTabPane, ElTabs, ElTable, ElTableColumn, ElDialog, ElUpload, ElIcon,
  ElPopconfirm, ElDivider, ElDropdown, ElDropdownItem, ElDropdownMenu, ElForm, ElFormItem, ElEmpty, ElDrawer,
  ElInputNumber, ElSteps, ElStep
} from 'element-plus'

import {
  Position, TopRight, User, Plus, Edit, Delete, View, Download, Filter, InfoFilled, Back, Search,
  MessageBox, Apple, Cherry, Grape, Orange, Pear, Watermelon, CircleClose, Message, CircleCheck, StarFilled, Loading, Check
} from '@element-plus/icons-vue'

import { computed, onMounted, onUnmounted, ref, reactive, nextTick, defineAsyncComponent } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import xlsx from "json-as-xlsx"
import exportFromJSON from 'export-from-json'
import bbox from '@turf/bbox'
import * as turf from '@turf/turf'
import { feature } from '@turf/turf'

import { countyOptions, subcountyOptions, settlementOptionsV2, LevelOptions, ownsershipOptions, regOptions, HCFTypeOptions } from './../common/index'

import UploadComponent from '@/views/Components/UploadComponent.vue'
import TableActions from '@/views/Components/TableActions.vue'
import ListDocuments from '@/views/Components/ListDocuments.vue'
import DownloadAll from '@/views/Components/DownloadAll.vue'
import DownloadCustom from '@/views/Components/DownloadCustom.vue'

import { useAppStore, useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import PermissionWrapper from '@/components/PermissionWrapper.vue'


const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)

const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)
const isMobile = computed(() => appStore.getMobile)

// For settlements, show 'viewOnMap' and 'addFacility' actions
const action_buttons = ref<string[]>(['viewOnMap', 'addFacility']);

console.log('action_buttons', action_buttons.value);

console.log("userInfo--->", userInfo)
console.log("showAdminButtons--->", showAdminButtons.value)

// Google Maps API Key
const googleMapsApiKey = 'AIzaSyCrzbOkfG52zkAxYPkMvvRMlxE9qHK4uDk'

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
    disabled:false,
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
    disabled:false,

  },
])

const polygons = ref<[number, number][][]>([])
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
const filters = ref(['isApproved'])
const filterValues = ref([['Approved']])  // make sure the inner array is array

var tblData = []
const associated_Model = ''
const associated_multiple_models = ['settlement', 'users', 'county', 'subcounty', 'ward']

const model = 'settlement' // Changed to settlement for listing
const healthFacilityModel = 'health_facility'
const model_parent_key = 'settlement_id'

const currentRoute = useRoute(); // Access current route using useRoute

const mapHeight = '450px'
const countries = 'ke'
const facilityGeo = ref([])

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
  // Get count of settlements that have health facilities with different approval statuses
  const formData = {}
  formData.model = healthFacilityModel
  formData.summaryFunction = 'count'
  formData.summaryField = 'isApproved'
  formData.groupFields = ['isApproved']
  const response = await getSummarybyFieldFromMultipleIncludes(formData);
  statuses.value = response.Total.reduce((acc, item) => {
    acc[item.isApproved] = parseInt(item.count, 10); // Convert count to a number
    return acc;
  }, {});
  console.log('Data xcounty', statuses.value)

  totalRejected.value = statuses.value.Rejected !== undefined ? statuses.value.Rejected : 0;
  totalNew.value = statuses.value.Pending !== undefined ? statuses.value.Pending : 0;
  total.value = statuses.value.Approved !== undefined ? statuses.value.Approved : 0;

}
getSummaryStatus()

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

// Store health facilities for each settlement
const settlementHealthFacilities = ref<Record<number, any[]>>({})
const loadingFacilities = ref<Record<number, boolean>>({})

// Load health facilities for a settlement
const loadHealthFacilitiesForSettlement = async (settlementId: number) => {
  if (settlementHealthFacilities.value[settlementId]) {
    return settlementHealthFacilities.value[settlementId]
  }

  loadingFacilities.value[settlementId] = true
  try {
    const formData = {
      limit: 1000,
      page: 1,
      curUser: 1,
      model: healthFacilityModel,
      searchField: 'name',
      searchKeyword: '',
      filters: ['settlement_id'],
      filterValues: [[settlementId]],
      associated_multiple_models: ['settlement', 'county', 'subcounty', 'ward', 'users']
    }

    const res = await getSettlementListByCounty(formData)
    settlementHealthFacilities.value[settlementId] = res.data || []
    return res.data || []
  } catch (error) {
    console.error('Error loading health facilities:', error)
    ElMessage.error('Failed to load health facilities')
    return []
  } finally {
    loadingFacilities.value[settlementId] = false
  }
}

const getFilteredData = async (selFilters, selfilterValues) => {
  const formData: any = {}
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
  
  // Use nested_models to filter settlements that have health facilities with the specified approval status
  // This ensures backend filtering - only settlements with matching health facilities are returned
  const isApprovedIndex = selFilters.indexOf('isApproved')
  const approvalStatus = isApprovedIndex !== -1 ? selfilterValues[isApprovedIndex] : null
  
  formData.nested_models = [{
    model: healthFacilityModel,
    foreignKey: 'settlement_id',
    localKey: 'id',
    filters: approvalStatus ? ['isApproved'] : [],
    filterValues: approvalStatus ? [approvalStatus] : [],
    requireMatch: true // Ensure settlement must have at least one matching health facility
  }]

  const res = await getSettlementListByCounty(formData)

  console.log('After Query - Settlements with Health Facilities (backend filtered):', res)

  // Backend should have already filtered to only settlements with health facilities
  // Now load health facilities counts for display
  if (res.data && res.data.length > 0) {
    await Promise.all(res.data.map(async (settlement: any) => {
      await loadHealthFacilitiesForSettlement(settlement.id)
    }))
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
     // data: facilityGeo.value, 
      data: selectedRows.value.length > 0 ? filteredGeo.value : facilityGeo.value,
     
     });

     console.log('facilityGeo.value',facilityGeo.value)

    nmap.addLayer({
      'id': 'pontLayer',
      "type": "circle",
      'source': 'hcf',
      'paint': {
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-color': [
          'case',
          ['==', ['get', 'level'], 'dispensary'],
          '#a6cee3',
          ['==', ['get', 'level'], 'clinic'],
          '#1f78b4',
          ['==', ['get', 'level'], 'health_center'],
          '#b2df8a',
          ['==', ['get', 'level'], 'hospital'],
          '#33a02c',
          ['==', ['get', 'level'], 'dispensary'],
          '#fb9a99',
          ['==', ['get', 'level'], 'laboratory'],
          '#e31a1c',
          ['==', ['get', 'level'], 'maternity'],
          '#fdbf6f',
          ['==', ['get', 'level'], 'chemist'],
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
   // Assume this is your current GeoJSON source (either bulk or full)
        const geojsonToFit = selectedRows.value.length > 0 ? filteredGeo.value : facilityGeo.value;

        if (mapCenter.length === 0 && geojsonToFit && geojsonToFit.features.length > 0) {
          const bounds = bbox(geojsonToFit); // [minX, minY, maxX, maxY]

          nmap.fitBounds(
            [
              [bounds[0], bounds[1]], // Southwest coordinates
              [bounds[2], bounds[3]], // Northeast coordinates
            ],
            {
              padding: 50,
              duration: 1000
            }
          );
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
    // Map view is now handled through the drawer when clicking "View on Map"
    // This segment can show a general overview if needed
    ElMessage.info("Click 'View on Map' on a settlement to see its map")
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

// Mobile detection
//const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// Drawer state for map
const mapDrawerVisible = ref(false)
const mapDrawerSettlement = ref<any>(null)
const mapDrawerContainer = ref<HTMLElement | null>(null)
const googleMap = ref<any>(null)
const settlementPolygon = ref<any>(null)
const healthFacilityMarkers = ref<any[]>([])
const settlementGeo = ref<any>(null)
const healthFacilitiesGeo = ref<any>(null)
// Store facility data with markers for editing
const facilityMarkerDataMap = ref<Map<any, any>>(new Map())

// Marker placement for adding new facilities

// Facility form drawer state
const facilityDrawerVisible = ref(false)
const facilityFormRef = ref<FormInstance>()
const editingFacilityId = ref<number | null>(null)
const isEditMode = ref(false)

// Facility form data - similar to AddHealthNew.vue
const facilityForm = reactive({
  name: '',
  facility_number: '',
  settlement_id: '',
  county_id: '',
  subcounty_id: '',
  ward_id: '',
  level: '',
  registration_status: '',
  ownership_type: '',
  owner: '',
  land_ownership: '',
  land_title_available: '',
  land_parcel_size: null,
  condition: '',
  num_inpatient: null,
  outpatient_visits_per_day: null,
  maternity_deliveries_per_day: null,
  antenatal_immunizations_per_day: null,
  general_beds: null,
  maternity_beds: null,
  pediatric_beds: null,
  total_beds: null,
  occupancy_rate: null,
  number_doctors: null,
  number_clinical_officers: null,
  number_pharmacists: null,
  number_nurses: null,
  number_midwives: null,
  number_other_staff: null,
  services_offered: '',
  referral_destinations: '',
  referral_distance_km: null,
  referrals_per_day: null,
  has_ambulance: '',
  source_of_drugs: '',
  common_ailments: '',
  source_of_patients: '',
  challenges: '',
  respondent_name: '',
  respondent_phone: '',
  distance_meters: null,
  geom: null
})

const facilityFormRules = reactive({
  name: [{ required: true, message: 'Facility name is required', trigger: 'blur' }],
  settlement_id: [{ required: true, message: 'Settlement is required', trigger: 'blur' }]
})

// Form options from AddHealthNew.vue
const LevelOptionsLocal = [
  { label: 'LEVEL 1 – Community Facilities', value: 'level_1' },
  { label: 'LEVEL 2 – Health Dispensaries', value: 'level_2' },
  { label: 'LEVEL 3 – Health Centres', value: 'level_3' },
  { label: 'LEVEL 4 – County Hospitals', value: 'level_4' },
  { label: 'LEVEL 5 – County Referral Hospitals', value: 'level_5' },
  { label: 'LEVEL 6 – National Referral Hospitals', value: 'level_6' }
]

const regOptionsLocal = [
  { label: 'Unregistered', value: 'unregistred' },
  { label: 'Registered', value: 'registered' },
  { label: 'Awaiting Registration', value: 'awaiting_registration' }
]

const generalOwnershipLocal = [
  { label: 'Government', value: 'government' },
  { label: 'CBO/NGO', value: 'ngo' },
  { label: 'Individual', value: 'individual' },
  { label: 'Community', value: 'community' }
]

const tenancyOptionsLocal = [
  { label: 'Rented', value: 'rented' },
  { label: 'Owned', value: 'owned' }
]

const yesNoOptions = [
  { label: 'Yes', value: 'Yes' },
  { label: 'No', value: 'No' },
  { label: "I don't know", value: 'unknown' }
]

const yesNoPlainOptions = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' }
]

const conditionFacilityOptions = [
  { label: 'Good', value: 'Good' },
  { label: 'Fair', value: 'Fair' },
  { label: 'Poor', value: 'Poor' },
  { label: 'Critical', value: 'Critical' }
]

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

    // Wait for map to be ready before loading facilities
    const loadFacilitiesWhenReady = async () => {
      await loadHealthFacilitiesOnMap(settlement.id)
    }

    // Use idle event to ensure map is fully loaded
    googleMap.value.addListener('idle', loadFacilitiesWhenReady)
    
    // Also try loading immediately in case map is already idle
    setTimeout(loadFacilitiesWhenReady, 500)

  } catch (error) {
    console.error("Error initializing map:", error)
    ElMessage.error("Failed to initialize map. Please try again.")
  }
}

// Load health facilities on map
const loadHealthFacilitiesOnMap = async (settlementId: number) => {
  try {
    // Clear existing markers and reset present levels
    healthFacilityMarkers.value.forEach(marker => marker.setMap(null))
    healthFacilityMarkers.value = []
    presentFacilityLevels.length = 0

    if (!googleMap.value) {
      console.error('Google map not initialized')
      return
    }

    console.log('Loading health facilities for settlement:', settlementId)

    // First, try to get facilities from already loaded data
    const facilities = await loadHealthFacilitiesForSettlement(settlementId)
    console.log('Loaded facilities:', facilities.length)

    // Get health facilities GeoJSON
    const formData: any = {
      model: healthFacilityModel,
      columnFilterField: 'settlement_id',
      selectedParents: settlementId,
      filtredGeoIds: [settlementId]
    }

    const res = await getfilteredGeo(formData)
    
    console.log('Health facilities Geo response:', res)
    console.log('Response data:', res?.data)
    console.log('Response data[0]:', res?.data?.[0])
    console.log('Response data[0][0]:', res?.data?.[0]?.[0])
    
    // Handle different response structures
    let geoJsonData = null
    
    // Check if response is wrapped in data property
    if (res && res.data) {
      // Check if it's an array of arrays (nested structure like [[{json_build_object}], {...}])
      if (Array.isArray(res.data) && res.data.length > 0) {
        const firstItem = res.data[0]
        console.log('First item:', firstItem, 'Is array:', Array.isArray(firstItem))
        
        // Check if first item is an array (nested structure)
        if (Array.isArray(firstItem) && firstItem.length > 0) {
          console.log('First item[0]:', firstItem[0])
          if (firstItem[0] && firstItem[0].json_build_object) {
            geoJsonData = firstItem[0].json_build_object
            console.log('Found GeoJSON in nested array structure')
          }
        } 
        // Check if first item has json_build_object directly
        else if (firstItem && firstItem.json_build_object) {
          geoJsonData = firstItem.json_build_object
          console.log('Found GeoJSON in first item')
        }
        // Check if first item itself is the GeoJSON object
        else if (firstItem && firstItem.type === 'FeatureCollection') {
          geoJsonData = firstItem
          console.log('Found GeoJSON as FeatureCollection directly')
        }
      }
    }
    // Check if response is directly an array
    else if (Array.isArray(res) && res.length > 0) {
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
    console.log('GeoJSON features:', geoJsonData?.features)
    
    // Check if we have valid GeoJSON data
    if (!geoJsonData) {
      console.log('No GeoJSON data found for health facilities')
      ElMessage.info('No health facilities with geometry data found for this settlement.')
      return
    }
    
    // Check if features is null or empty - this means no facilities have geometry
    if (geoJsonData.features === null || (Array.isArray(geoJsonData.features) && geoJsonData.features.length === 0)) {
      console.log('GeoJSON features is null or empty - no facilities with geometry')
      ElMessage.info('No health facilities with geometry data found for this settlement.')
      healthFacilitiesGeo.value = null
      return
    }
    
    // We have valid features, proceed with processing
    healthFacilitiesGeo.value = geoJsonData
    
    const features = geoJsonData.features || []
    
    console.log('Health facilities features count:', features.length)
    console.log('Health facilities features:', features)
    
    if (features.length === 0) {
      console.log('No features found in GeoJSON array')
      ElMessage.info('No health facilities found with geometry for this settlement.')
      healthFacilitiesGeo.value = null
      return
    }
    
    // Process features and create markers
    if (features && features.length > 0) {
      
      if (features.length === 0) {
        console.warn('No features found in GeoJSON')
        ElMessage.info('No health facilities found with geometry for this settlement. You can still add new facilities.')
        healthFacilitiesGeo.value = null
        return
      }
      
      features.forEach((feature: any, index: number) => {
        console.log(`Processing feature ${index}:`, feature)
        
        if (feature.geometry && feature.geometry.type === 'Point') {
          const coords = feature.geometry.coordinates
          if (!coords || coords.length < 2) {
            console.warn('Invalid coordinates:', coords)
            return
          }
          
          const [lng, lat] = coords
          // Normalize level from properties - use level field which should be level_1 through level_6
          let level = (feature.properties?.level || feature.properties?.facility_level || 'unknown').toLowerCase().trim()
          
          // Handle various formats and normalize to level_X format
          if (level === 'n/a' || level === 'na' || level === '' || !level) {
            level = 'unknown'
          } else if (!level.startsWith('level_')) {
            // Try to map old format to new format
            const levelMapping: Record<string, string> = {
              'dispensary': 'level_2',
              'clinic': 'level_1',
              'health_center': 'level_3',
              'health centre': 'level_3',
              'hospital': 'level_4',
              'laboratory': 'unknown',
              'maternity': 'unknown',
              'chemist': 'unknown',
              'pharmacy': 'unknown'
            }
            level = levelMapping[level] || 'unknown'
          }
          
          // Track this facility level for dynamic legend
          if (!presentFacilityLevels.includes(level)) {
            presentFacilityLevels.push(level)
            console.log('Added facility level to legend:', level, 'Total levels:', presentFacilityLevels.length)
          }
          
          console.log(`Creating marker at [${lat}, ${lng}] for ${feature.properties?.name || 'Unknown'} (${level})`)
          
          // Get color based on level - using distinct colors for each level from JSON
          const colorMap: Record<string, string> = {
            'level_1': '#a6cee3',      // Light blue - Community Facilities
            'level_2': '#1f78b4',      // Blue - Health Dispensaries
            'level_3': '#b2df8a',      // Light green - Health Centres
            'level_4': '#33a02c',      // Green - County Hospitals
            'level_5': '#fb9a99',      // Pink - County Referral Hospitals
            'level_6': '#e31a1c',      // Red - National Referral Hospitals
            'unknown': '#969696'       // Gray - Unknown/Other
          }
          
          const color = colorMap[level] || colorMap['unknown']
          
          try {
            // Determine marker size based on level (higher levels = larger markers)
            const sizeMap: Record<string, number> = {
              'level_1': 10,
              'level_2': 11,
              'level_3': 12,
              'level_4': 14,
              'level_5': 16,
              'level_6': 18,
              'unknown': 10
            }
            const markerSize = sizeMap[level] || sizeMap['unknown']
            
            const marker = new window.google.maps.Marker({
              position: { lat, lng },
              map: googleMap.value,
              title: feature.properties?.name || 'Health Facility',
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: markerSize,
                fillColor: color,
                fillOpacity: 0.9,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                strokeOpacity: 1
              }
            })

            // Add info window with formatted level name
            const levelLabel = allLegendItems.value.find(item => item.key === level)?.label || level
            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="padding: 8px; min-width: 200px;">
                  <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${feature.properties?.name || 'Health Facility'}</h3>
                  <p style="margin: 0 0 5px 0; font-size: 12px;"><strong>Level:</strong> ${levelLabel}</p>
                  ${feature.properties?.ownership_type ? `<p style="margin: 5px 0 0 0; font-size: 12px;"><strong>Ownership:</strong> ${feature.properties.ownership_type}</p>` : ''}
                  ${feature.properties?.registration_status ? `<p style="margin: 5px 0 0 0; font-size: 12px;"><strong>Status:</strong> ${feature.properties.registration_status}</p>` : ''}
                </div>
              `
            })

            // Store facility data with marker
            facilityMarkerDataMap.value.set(marker, feature.properties)
            
            marker.addListener('click', () => {
              // Open form drawer for editing
              openFacilityForm(feature.properties)
            })

            healthFacilityMarkers.value.push(marker)
            console.log(`Marker created successfully for ${feature.properties?.name}`)
          } catch (markerError) {
            console.error('Error creating marker:', markerError, feature)
          }
        } else {
          console.warn('Feature is not a Point:', feature.geometry?.type)
        }
      })
      
      console.log('Total markers created:', healthFacilityMarkers.value.length)
      console.log('Present facility levels:', presentFacilityLevels)
      console.log('Legend items computed:', legendItems.value)
      
      if (healthFacilityMarkers.value.length === 0) {
        ElMessage.info('No health facilities with valid Point geometry found')
      } else {
        ElMessage.success(`Loaded ${healthFacilityMarkers.value.length} health facilities on map`)
      }
    }
  } catch (error) {
    console.error("Error loading health facilities on map:", error)
    ElMessage.error("Failed to load health facilities on map: " + (error as Error).message)
  }
}


// Open facility form drawer for editing
const openFacilityForm = (facilityData: any) => {
  isEditMode.value = true
  editingFacilityId.value = facilityData.id || null
  
  // Populate form with facility data
  facilityForm.name = facilityData.name || ''
  facilityForm.facility_number = facilityData.facility_number || ''
  facilityForm.settlement_id = facilityData.settlement_id || mapDrawerSettlement.value?.id || ''
  facilityForm.county_id = facilityData.county_id || mapDrawerSettlement.value?.county_id || ''
  facilityForm.subcounty_id = facilityData.subcounty_id || mapDrawerSettlement.value?.subcounty_id || ''
  facilityForm.ward_id = facilityData.ward_id || mapDrawerSettlement.value?.ward_id || ''
  facilityForm.level = facilityData.level || ''
  facilityForm.registration_status = facilityData.registration_status || ''
  facilityForm.ownership_type = facilityData.ownership_type || ''
  facilityForm.owner = facilityData.owner || ''
  facilityForm.land_ownership = facilityData.land_ownership || ''
  facilityForm.land_title_available = facilityData.land_title_available || ''
  facilityForm.land_parcel_size = facilityData.land_parcel_size || null
  facilityForm.condition = facilityData.condition || ''
  facilityForm.num_inpatient = facilityData.num_inpatient || null
  facilityForm.outpatient_visits_per_day = facilityData.outpatient_visits_per_day || null
  facilityForm.maternity_deliveries_per_day = facilityData.maternity_deliveries_per_day || null
  facilityForm.antenatal_immunizations_per_day = facilityData.antenatal_immunizations_per_day || null
  facilityForm.general_beds = facilityData.general_beds || null
  facilityForm.maternity_beds = facilityData.maternity_beds || null
  facilityForm.pediatric_beds = facilityData.pediatric_beds || null
  facilityForm.total_beds = facilityData.total_beds || null
  facilityForm.occupancy_rate = facilityData.occupancy_rate || null
  facilityForm.number_doctors = facilityData.number_doctors || null
  facilityForm.number_clinical_officers = facilityData.number_clinical_officers || null
  facilityForm.number_pharmacists = facilityData.number_pharmacists || null
  facilityForm.number_nurses = facilityData.number_nurses || null
  facilityForm.number_midwives = facilityData.number_midwives || null
  facilityForm.number_other_staff = facilityData.number_other_staff || null
  facilityForm.services_offered = facilityData.services_offered || ''
  facilityForm.referral_destinations = facilityData.referral_destinations || ''
  facilityForm.referral_distance_km = facilityData.referral_distance_km || null
  facilityForm.referrals_per_day = facilityData.referrals_per_day || null
  facilityForm.has_ambulance = facilityData.has_ambulance || ''
  facilityForm.source_of_drugs = facilityData.source_of_drugs || ''
  facilityForm.common_ailments = facilityData.common_ailments || ''
  facilityForm.source_of_patients = facilityData.source_of_patients || ''
  facilityForm.challenges = facilityData.challenges || ''
  facilityForm.respondent_name = facilityData.respondent_name || ''
  facilityForm.respondent_phone = facilityData.respondent_phone || ''
  facilityForm.distance_meters = facilityData.distance_meters || null
  facilityForm.geom = facilityData.geom || null
  
  facilityDrawerVisible.value = true
}

// Submit facility form
const submitFacilityForm = async () => {
  if (!facilityFormRef.value) return
  
  await facilityFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const formDataToSubmit = {
          ...facilityForm,
          model: 'health_facility'
        }
        
        if (isEditMode.value && editingFacilityId.value) {
          // Update existing facility
          const formData = {
            ...formDataToSubmit,
            id: editingFacilityId.value
          }
          
          const res = await updateOneRecord(formData)
          
          if (res.code === '0000') {
            ElMessage.success('Health facility updated successfully')
            // Reload facilities on map
            if (mapDrawerSettlement.value) {
              await loadHealthFacilitiesOnMap(mapDrawerSettlement.value.id)
            }
            // Reload facilities list if expanded
            if (facilityForm.settlement_id) {
              await loadHealthFacilitiesForSettlement(facilityForm.settlement_id)
            }
            resetFacilityForm()
            facilityDrawerVisible.value = false
          } else {
            ElMessage.error('Failed to update health facility')
          }
        } else {
          // Create new facility
          const { uuid } = await import('vue-uuid')
          
          const formData = {
            ...formDataToSubmit,
            code: uuid.v4(),
            isApproved: 'Pending',
            created_by: userInfo.id
          }
          
          const res = await CreateRecord(formData as any)
          
          if (res.code === '0000') {
            ElMessage.success('Health facility created successfully')
            // Reload facilities on map
            if (mapDrawerSettlement.value) {
              await loadHealthFacilitiesOnMap(mapDrawerSettlement.value.id)
            }
            // Reload facilities list if expanded
            if (facilityForm.settlement_id) {
              await loadHealthFacilitiesForSettlement(facilityForm.settlement_id)
            }
            resetFacilityForm()
            facilityDrawerVisible.value = false
          } else {
            ElMessage.error('Failed to create health facility')
          }
        }
      } catch (error) {
        console.error('Error saving health facility:', error)
        ElMessage.error('Failed to save health facility')
      }
    }
  })
}

// Reset facility form
const resetFacilityForm = () => {
  isEditMode.value = false
  editingFacilityId.value = null
  
  // Reset form fields
  Object.keys(facilityForm).forEach(key => {
    if (typeof facilityForm[key as keyof typeof facilityForm] === 'string') {
      facilityForm[key as keyof typeof facilityForm] = '' as any
    } else if (typeof facilityForm[key as keyof typeof facilityForm] === 'number') {
      facilityForm[key as keyof typeof facilityForm] = null as any
    } else {
      facilityForm[key as keyof typeof facilityForm] = null as any
    }
  })
}

// Close facility drawer
const closeFacilityDrawer = () => {
  facilityDrawerVisible.value = false
  resetFacilityForm()
}

// Close drawer handler
const handleMapDrawerClose = () => {
  mapDrawerVisible.value = false
  facilityDrawerVisible.value = false
  // Clean up markers
  healthFacilityMarkers.value.forEach(marker => marker.setMap(null))
  healthFacilityMarkers.value = []
  facilityMarkerDataMap.value.clear()
  presentFacilityLevels.length = 0 // Clear present levels when closing
  
  if (settlementPolygon.value) {
    settlementPolygon.value.setMap(null)
    settlementPolygon.value = null
  }
  googleMap.value = null
  mapDrawerSettlement.value = null
  resetFacilityForm()
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





// Full legend items based on JSON facility levels (hcf_levels)
const allLegendItems = ref([
  {
    label: "LEVEL 1 – Community Facilities",
    color: "#a6cee3",
    key: "level_1"
  },
  {
    label: "LEVEL 2 – Health Dispensaries",
    color: '#1f78b4',
    key: "level_2"
  },
  {
    label: "LEVEL 3 – Health Centres",
    color: '#b2df8a',
    key: "level_3"
  },
  {
    label: "LEVEL 4 – County Hospitals",
    color: '#33a02c',
    key: "level_4"
  },
  {
    label: "LEVEL 5 – County Referral Hospitals",
    color: '#fb9a99',
    key: "level_5"
  },
  {
    label: "LEVEL 6 – National Referral Hospitals",
    color: '#e31a1c',
    key: "level_6"
  },
  {
    label: "Others/Unknown",
    color: "#969696",
    key: "unknown"
  }





])

// Track which facility levels are present in the current map
// Using reactive for better Vue reactivity
const presentFacilityLevels = reactive<string[]>([])

// Computed property for dynamic legend - only show items that are present
const legendItems = computed(() => {
  if (presentFacilityLevels.length === 0) {
    return []
  }
  
  // Convert to Set for efficient lookup
  const levelsSet = new Set(presentFacilityLevels)
  
  return allLegendItems.value.filter(item => {
    // Check if this legend item's key matches any present facility level
    return levelsSet.has(item.key)
  })
})

const DeleteFacility = async (data: TableSlotDefault) => {
  console.log('-----> Deleting Facility:', data);

  try {
    const formData: Record<string, any> = {
      id: data.id,
      model: model,
    };

    // Delete the record from backend
    await DeleteRecord(formData);

    // Delete documents if any
    if (Array.isArray(data.documents) && data.documents.length > 0) {
      formData.filesToDelete = data.documents;
      await deleteDocument(formData);
    }

    // Refresh the data after successful deletion
    await getFilteredData(filters.value, filterValues.value);
    
    ElMessage.success('Record deleted successfully');
  } catch (error) {
    console.error('Error deleting record:', error);
    ElMessage.error('Failed to delete record');
  }
};




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
const editFacility = (data: TableSlotDefault) => {


  push({
    name: 'AddHealthNew',
    query: { id: data.id }

  });

  // handleSelectCounty(data.county_id)

  // showEditSaveButton.value = true

  // console.log(data)

  // currentRow.value = data.id

  // ruleForm.id = data.id
  // ruleForm.name = data.name
  // ruleForm.county_id = data.county_id
  // ruleForm.settlement_id = data.settlement_id
  // ruleForm.subcounty_id = data.subcounty_id
  // ruleForm.facility_type = data.facility_type
  // ruleForm.reg_status = data.reg_status
  // ruleForm.level = data.level
  // ruleForm.ownership_type = data.ownership_type
  // ruleForm.number_beds = data.number_beds
  // ruleForm.geom = data.geom

  // morefileList.value = data.documents
  // AddDialogVisible.value = true
}





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
const health_facility_raw = ref({})


const Review = (data: TableSlotDefault) => {
  console.log('On Click.....', data.id)
  ShowReviewDialog.value = true

  // make the descriptions dataset 
  health_facility_raw.value.name = data.name
  health_facility_raw.value.reg_status = data.reg_status
  health_facility_raw.value.ownership_type = data.ownership_type
  health_facility_raw.value.owner = data.owner
  health_facility_raw.value.user = data.user.name + ' | ' + data.user.email
  health_facility_raw.value.date = data.createdAt

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
const mfield = 'health_facility_id'
const ChildComponent = defineAsyncComponent(() => import('@/views/Components/UploadComponent.vue'));
const selectedRow = ref([])
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


// Handle expand for settlement row - show health facilities
const expandedSettlements = ref<Set<number>>(new Set())
const handleExpand = async (row: any, expanded: boolean) => {
  if (expanded) {
    expandedSettlements.value.add(row.id)
    // Load health facilities for this settlement
    await loadHealthFacilitiesForSettlement(row.id)
  } else {
    expandedSettlements.value.delete(row.id)
  }
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



const AddFacility = (data?: TableSlotDefault) => {
  if (data) {
    // If settlement data is provided, preload county and settlement
    push({
      name: 'AddHealthNew',
      query: {
        county_id: data.county_id || data.county?.id || '',
        settlement_id: data.id || ''
      }
    })
  } else {
    // No data provided, just navigate to add page
    push({
      name: 'AddHealthNew'
    })
  }
}

// Handler for add facility action from table
const handleAddFacility = (row: any) => {
  AddFacility(row)
}


const filteredSegments = computed(() => {
  return options.value.filter(option => !option.disabled);
});


const selectedRows = ref([]);

// Triggered when selection changes
const handleSelectionChange = (rows: any[]) => {
  selectedRows.value = rows;
};


 

const bulkDelete = async () => {
  console.log('Deleting:', selectedRows.value);

  await Promise.all(selectedRows.value.map(row => DeleteFacility(row)));

  // Remove deleted items from tableDataListNew
  const deletedIds = selectedRows.value.map(row => row.id);
  tableDataListNew.value = tableDataListNew.value.filter(item => !deletedIds.includes(item.id));

  selectedRows.value = [];
};


 
const filteredGeo=ref()
 
const bulkMap = () => {
  console.log('Mapping:', selectedRows.value);

 
  const features = selectedRows.value.map(row => {
    return {
      type: 'Feature',
      geometry: row.geom, // assumes `row.geometry` is already in GeoJSON format
      properties: {
        ...row,
        geometry: undefined, // avoid duplicating geometry in properties
      },
    };
  });

  const featureCollection = {
    type: 'FeatureCollection',
    features,
  };

  console.log('FeatureCollection:', featureCollection);
  filteredGeo.value=featureCollection

  activeSegment.value='Map'

  onSegmentClick()
  // Optional: emit, store or pass to map
  // emit('show-on-map', featureCollection)
};


const bulkReview = () => {
  console.log('Mapping:', selectedRows.value);
  // Add your logic here
};
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
            <PermissionWrapper :permissions="'health_facility:create'">
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
      <el-table :data="tableDataList" style="width: 100%; margin-top: 10px;" border @expand-change="handleExpand">
        <el-table-column type="expand">
          <template #default="props">
            <div style="padding: 20px;">
              <h3>Health Facilities in {{ props.row.name }}</h3>
              <div v-if="loadingFacilities[props.row.id]" style="text-align: center; padding: 20px;">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>Loading health facilities...</span>
              </div>
              <el-table 
                v-else
                :data="settlementHealthFacilities[props.row.id] || []" 
                style="width: 100%;" 
                border
                size="small"
              >
                <el-table-column label="Facility Name" prop="name" />
                <el-table-column label="Level" prop="level" />
                <el-table-column label="Type" prop="facility_type" />
                <el-table-column label="Ownership" prop="ownership_type" />
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
                    <PermissionWrapper :permissions="['health_facility:update', 'health_facility:delete']">
                      <el-button size="small" type="primary" :icon="Edit" @click="editFacility(row)" />
                      <el-button size="small" type="danger" :icon="Delete" @click="DeleteFacility(row)" />
                    </PermissionWrapper>
                  </template>
                </el-table-column>
              </el-table>
              <div v-if="!loadingFacilities[props.row.id] && (!settlementHealthFacilities[props.row.id] || settlementHealthFacilities[props.row.id].length === 0)" style="text-align: center; padding: 20px;">
                <el-empty description="No health facilities found in this settlement" />
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
        <el-table-column label="Health Facilities Count" sortable>
          <template #default="scope">
            <el-badge :value="settlementHealthFacilities[scope.row.id]?.length || 0" class="item" />
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
        <el-empty description="No settlements with approved health facilities found" />
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
    <!-- Bulk action buttons shown only if something is selected -->
  

    <el-table
      :data="tableDataListNew"
      style="width: 100%; margin-top: 10px;"
      border
      @expand-change="handleExpand"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="50" />

      <el-table-column type="expand">
        <template #default="props">
          <div style="padding: 20px;">
            <h3>Health Facilities in {{ props.row.name }}</h3>
            <div v-if="loadingFacilities[props.row.id]" style="text-align: center; padding: 20px;">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>Loading health facilities...</span>
            </div>
            <el-table 
              v-else
              :data="settlementHealthFacilities[props.row.id] || []" 
              style="width: 100%;" 
              border
              size="small"
            >
              <el-table-column label="Facility Name" prop="name" />
              <el-table-column label="Level" prop="level" />
              <el-table-column label="Type" prop="facility_type" />
              <el-table-column label="Ownership" prop="ownership_type" />
              <el-table-column label="Status" prop="isApproved">
                <template #default="scope">
                  <el-tag 
                    :type="scope.row.isApproved === 'Approved' ? 'success' : scope.row.isApproved === 'Rejected' ? 'danger' : 'warning'"
                  >
                    {{ scope.row.isApproved }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="Actions" width="250">
                <template #default="{ row }">
                  <PermissionWrapper :permissions="['health_facility:update', 'health_facility:delete']">
                    <el-button size="small" type="primary" :icon="Edit" @click="editFacility(row)" />
                    <el-button size="small" type="warning" :icon="View" @click="Review(row)" />
                    <el-button size="small" type="danger" :icon="Delete" @click="DeleteFacility(row)" />
                  </PermissionWrapper>
                </template>
              </el-table-column>
            </el-table>
            <div v-if="!loadingFacilities[props.row.id] && (!settlementHealthFacilities[props.row.id] || settlementHealthFacilities[props.row.id].length === 0)" style="text-align: center; padding: 20px;">
              <el-empty description="No health facilities found in this settlement" />
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Settlement Name" prop="name" sortable />
      <el-table-column label="Location" sortable>
        <template #default="scope">
          <span>
            {{ scope.row.ward?.name || 'N/A' }} ward,
            {{ scope.row.subcounty?.name || 'N/A' }} subcounty,
            {{ scope.row.county?.name || 'N/A' }} County
          </span>
        </template>
      </el-table-column>
      <el-table-column label="Health Facilities Count" sortable>
        <template #default="scope">
          <el-badge :value="settlementHealthFacilities[scope.row.id]?.length || 0" class="item" />
        </template>
      </el-table-column>

      <el-table-column :label="selectedRows.length > 0 ? '' : 'Actions'" width="350">
        <template #header>
          <div v-if="selectedRows.length > 0" class="flex gap-2">
            <el-tooltip content="View on Map" placement="top">
              <el-button type="warning" size="small" :icon="Position" plain @click="bulkMap" />
            </el-tooltip>

            <el-tooltip content="Review Selected" placement="top">
              <el-button type="primary" size="small" :icon="View" plain @click="bulkReview" />
            </el-tooltip>
 
            <el-tooltip content="Bulk Delete Selected" placement="top">
              <el-popconfirm
                title="Are you sure you want to delete the selected records?"
                confirm-button-text="Yes"
                cancel-button-text="No"
                width="289"
                @confirm="bulkDelete"
              >
                <template #reference>
                  <el-button
                    type="danger"
                    size="small"
                    :icon="Delete"
                    plain
                  >
                    Delete
                  </el-button>
                </template>
              </el-popconfirm>
            </el-tooltip>
 
          </div>
          <span v-else>Actions</span>
        </template>

        <template #default="{ row }">
          <div v-if="selectedRows.length === 0">
            <PermissionWrapper :permissions="['health_facility:update', 'health_facility:delete']">
              <TableActions
                :item="row"
                :buttons="action_buttons"
                @view-on-map="flyTo"
                @add-facility="handleAddFacility"
                @edit="editFacility"
                @review="Review"
                @delete="DeleteFacility"
              />
            </PermissionWrapper>
          </div>
        </template>
      </el-table-column>

    </el-table>

    <ElPagination
      layout="sizes, prev, pager, next, total"
      v-model:currentPage="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 50, 100]"
      :total="totalNew"
      :background="true"
      @size-change="onPageSizeChange"
      @current-change="onPageChange"
      class="mt-4"
    />
  </div>


    <div v-if="activeSegment === 'Rejected'">

      <el-table
:data="tableDataListRejected" style="width: 100%; margin-top: 10px;" border
        @expand-change="handleExpand">
        <el-table-column type="expand">
          <template #default="props">
            <div style="padding: 20px;">
              <h3>Health Facilities in {{ props.row.name }}</h3>
              <div v-if="loadingFacilities[props.row.id]" style="text-align: center; padding: 20px;">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>Loading health facilities...</span>
              </div>
              <el-table 
                v-else
                :data="settlementHealthFacilities[props.row.id] || []" 
                style="width: 100%;" 
                border
                size="small"
              >
                <el-table-column label="Facility Name" prop="name" />
                <el-table-column label="Level" prop="level" />
                <el-table-column label="Type" prop="facility_type" />
                <el-table-column label="Ownership" prop="ownership_type" />
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
                    <PermissionWrapper :permissions="['health_facility:update', 'health_facility:delete']">
                      <el-button size="small" type="primary" :icon="Edit" @click="editFacility(row)" />
                      <el-button size="small" type="danger" :icon="Delete" @click="DeleteFacility(row)" />
                    </PermissionWrapper>
                  </template>
                </el-table-column>
              </el-table>
              <div v-if="!loadingFacilities[props.row.id] && (!settlementHealthFacilities[props.row.id] || settlementHealthFacilities[props.row.id].length === 0)" style="text-align: center; padding: 20px;">
                <el-empty description="No health facilities found in this settlement" />
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
        <el-table-column label="Health Facilities Count" sortable>
          <template #default="scope">
            <el-badge :value="settlementHealthFacilities[scope.row.id]?.length || 0" class="item" />
          </template>
        </el-table-column>

        <el-table-column label="Actions" width="250">
          <template #default="{ row }">
              <TableActions
              :item="row" :buttons="action_buttons" @view-on-map="flyTo" @add-facility="handleAddFacility" />
          </template>
        </el-table-column>



      </el-table>

      <ElPagination
layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
        v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 100]" :total="totalRejected" :background="true"
        @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />

    </div>


    <div v-if="activeSegment === 'Map'">
      <el-empty description="Click 'View on Map' on a settlement to see its map with health facilities" />
      </div>


        </el-card>


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
      <el-descriptions-item label="Name">{{ health_facility_raw.name }}</el-descriptions-item>
      <el-descriptions-item label="Status" :span="2">{{ health_facility_raw.reg_status }}</el-descriptions-item>
      <el-descriptions-item label="Type">{{ health_facility_raw.ownership_type }}</el-descriptions-item>
      <el-descriptions-item label="owner"> {{ health_facility_raw.owner }} </el-descriptions-item>
      <el-descriptions-item label="Submitted By"> {{ health_facility_raw.user }} </el-descriptions-item>
      <el-descriptions-item label="Date"> {{ health_facility_raw.date }} </el-descriptions-item>

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

  <!-- Map Drawer -->
  <el-drawer
    v-model="mapDrawerVisible"
    title="Settlement Map with Health Facilities"
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
      
      <!-- Legend - Dynamically shows only facility types present on map -->
      <div v-if="legendItems && legendItems.length > 0" class="map-legend">
        <h4 class="legend-title">Facility Levels</h4>
        <div v-for="item in legendItems" :key="item.key" class="legend-item">
          <div 
            class="legend-circle"
            :style="{ backgroundColor: item.color }"
          ></div>
          <span class="legend-label">{{ item.label }}</span>
        </div>
      </div>
    </div>
  </el-drawer>

  <!-- Facility Form Drawer for Editing -->
  <el-drawer
    v-model="facilityDrawerVisible"
    :title="isEditMode ? 'Edit Health Facility' : 'Health Facility Details'"
    direction="rtl"
    :size="isMobile ? '100%' : '600px'"
    :before-close="closeFacilityDrawer"
    class="facility-form-drawer"
  >
    <el-form
      ref="facilityFormRef"
      :model="facilityForm"
      :rules="facilityFormRules"
      :label-width="isMobile ? '0px' : '180px'"
      :label-position="isMobile ? 'top' : 'left'"
      class="facility-form-mobile"
    >
      <el-divider content-position="left">Basic Information</el-divider>

      <el-form-item label="Facility Name" prop="name">
        <el-input v-model="facilityForm.name" placeholder="Enter facility name" />
      </el-form-item>

      <el-form-item label="Facility Number">
        <el-input v-model="facilityForm.facility_number" placeholder="Enter facility number" />
      </el-form-item>

      <el-form-item label="Level">
        <el-select v-model="facilityForm.level" placeholder="Select level" filterable style="width: 100%">
          <el-option
            v-for="item in LevelOptionsLocal"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Registration Status">
        <el-select v-model="facilityForm.registration_status" placeholder="Select registration status" filterable style="width: 100%">
          <el-option
            v-for="item in regOptionsLocal"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Ownership Type">
        <el-select v-model="facilityForm.ownership_type" placeholder="Select ownership type" filterable style="width: 100%">
          <el-option
            v-for="item in generalOwnershipLocal"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Owner">
        <el-input v-model="facilityForm.owner" placeholder="Enter owner" />
      </el-form-item>

      <el-form-item label="Land Ownership">
        <el-select v-model="facilityForm.land_ownership" placeholder="Select land ownership" filterable style="width: 100%">
          <el-option
            v-for="item in tenancyOptionsLocal"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Land Title Available">
        <el-select v-model="facilityForm.land_title_available" placeholder="Select land title available" filterable style="width: 100%">
          <el-option
            v-for="item in yesNoOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Land Parcel Size">
        <el-input-number v-model="facilityForm.land_parcel_size" :min="0" :precision="2" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Condition">
        <el-select v-model="facilityForm.condition" placeholder="Select condition" filterable style="width: 100%">
          <el-option
            v-for="item in conditionFacilityOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-divider content-position="left">Capacity</el-divider>

      <el-form-item label="Number of Inpatients">
        <el-input-number v-model="facilityForm.num_inpatient" :min="0" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Outpatient Visits/Day">
        <el-input-number v-model="facilityForm.outpatient_visits_per_day" :min="0" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Maternity Deliveries/Day">
        <el-input-number v-model="facilityForm.maternity_deliveries_per_day" :min="0" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Immunizations/Day">
        <el-input-number v-model="facilityForm.antenatal_immunizations_per_day" :min="0" style="width: 100%" />
      </el-form-item>

      <el-divider content-position="left">Beds</el-divider>

      <el-form-item label="General Beds">
        <el-input-number v-model="facilityForm.general_beds" :min="0" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Maternity Beds">
        <el-input-number v-model="facilityForm.maternity_beds" :min="0" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Pediatric Beds">
        <el-input-number v-model="facilityForm.pediatric_beds" :min="0" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Total Beds">
        <el-input-number v-model="facilityForm.total_beds" :min="0" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Occupancy Rate">
        <el-input-number v-model="facilityForm.occupancy_rate" :min="0" :max="100" :precision="2" style="width: 100%" />
      </el-form-item>

      <el-divider content-position="left">Staff</el-divider>

      <el-form-item label="Number of Doctors">
        <el-input-number v-model="facilityForm.number_doctors" :min="0" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Number of Clinical Officers">
        <el-input-number v-model="facilityForm.number_clinical_officers" :min="0" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Number of Pharmacists">
        <el-input-number v-model="facilityForm.number_pharmacists" :min="0" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Number of Nurses">
        <el-input-number v-model="facilityForm.number_nurses" :min="0" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Number of Midwives">
        <el-input-number v-model="facilityForm.number_midwives" :min="0" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Number of Other Staff">
        <el-input-number v-model="facilityForm.number_other_staff" :min="0" style="width: 100%" />
      </el-form-item>

      <el-divider content-position="left">Services & Referrals</el-divider>

      <el-form-item label="Services Offered">
        <el-input v-model="facilityForm.services_offered" type="textarea" :rows="3" placeholder="Enter services offered" />
      </el-form-item>

      <el-form-item label="Referral Destinations">
        <el-input v-model="facilityForm.referral_destinations" type="textarea" :rows="2" placeholder="Enter referral destinations" />
      </el-form-item>

      <el-form-item label="Referral Distance (km)">
        <el-input-number v-model="facilityForm.referral_distance_km" :min="0" :precision="2" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Referrals per Day">
        <el-input-number v-model="facilityForm.referrals_per_day" :min="0" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Has Ambulance">
        <el-select v-model="facilityForm.has_ambulance" placeholder="Select has ambulance" filterable style="width: 100%">
          <el-option
            v-for="item in yesNoPlainOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Source of Drugs">
        <el-input v-model="facilityForm.source_of_drugs" placeholder="Enter source of drugs" />
      </el-form-item>

      <el-form-item label="Common Ailments">
        <el-input v-model="facilityForm.common_ailments" type="textarea" :rows="2" placeholder="Enter common ailments" />
      </el-form-item>

      <el-form-item label="Source of Patients">
        <el-input v-model="facilityForm.source_of_patients" placeholder="Enter source of patients" />
      </el-form-item>

      <el-divider content-position="left">Additional Information</el-divider>

      <el-form-item label="Respondent Name">
        <el-input v-model="facilityForm.respondent_name" placeholder="Enter respondent name" />
      </el-form-item>

      <el-form-item label="Respondent Phone">
        <el-input v-model="facilityForm.respondent_phone" placeholder="Enter respondent phone" />
      </el-form-item>

      <el-form-item label="Distance (Meters)">
        <el-input-number v-model="facilityForm.distance_meters" :min="0" :precision="2" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Challenges">
        <el-input v-model="facilityForm.challenges" type="textarea" :rows="3" placeholder="Enter challenges" />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="drawer-footer-mobile">
        <el-button @click="closeFacilityDrawer" class="footer-btn">Cancel</el-button>
        <el-button type="primary" @click="submitFacilityForm" :icon="Check" class="footer-btn">
          {{ isEditMode ? 'Update Health Facility' : 'Save Health Facility' }}
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

/* Mobile-optimized drawer styles */
.drawer-header-mobile {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 8px;
}

.drawer-title {
  font-size: 16px;
  font-weight: 600;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 12px;
}

.close-btn-mobile {
  min-width: 60px;
  padding: 8px 16px;
}

.map-container-wrapper {
  height: calc(100vh - 120px);
  position: relative;
  width: 100%;
}

.map-container {
  width: 100%;
  height: 100%;
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

.legend-circle {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  margin-right: 12px;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  flex-shrink: 0;
}

.legend-label {
  font-size: 12px;
  color: #333;
  line-height: 1.4;
}

.facility-form-mobile {
  padding-bottom: 20px;
}

.drawer-footer-mobile {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.footer-btn {
  min-width: 100px;
}

/* Mobile-specific styles */
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
    max-height: 40vh;
    overflow-y: auto;
  }

  .legend-title {
    font-size: 13px;
    margin-bottom: 10px;
  }

  .legend-item {
    margin-bottom: 8px;
  }

  .legend-circle {
    width: 16px;
    height: 16px;
    margin-right: 10px;
  }

  .legend-label {
    font-size: 11px;
  }

  .drawer-title {
    font-size: 14px;
  }

  .close-btn-mobile {
    padding: 6px 12px;
    font-size: 13px;
  }

  .facility-form-mobile :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  .facility-form-mobile :deep(.el-form-item__label) {
    font-size: 13px;
    margin-bottom: 6px;
    padding-bottom: 0;
  }

  .facility-form-mobile :deep(.el-input),
  .facility-form-mobile :deep(.el-select),
  .facility-form-mobile :deep(.el-input-number) {
    font-size: 16px; /* Prevents zoom on iOS */
  }

  .facility-form-mobile :deep(.el-button) {
    width: 100%;
    margin-top: 10px;
    padding: 12px;
    font-size: 15px;
  }

  .facility-form-mobile :deep(.el-divider) {
    margin: 20px 0;
  }

  .facility-form-mobile :deep(.el-divider__text) {
    font-size: 14px;
  }

  .drawer-footer-mobile {
    flex-direction: column;
    padding: 15px;
    gap: 10px;
  }

  .footer-btn {
    width: 100%;
    margin: 0;
  }
}

/* Tablet styles */
@media (min-width: 769px) and (max-width: 1024px) {
  .map-legend {
    max-width: 240px;
    padding: 12px;
  }

  .legend-label {
    font-size: 11px;
  }
}

/* Ensure drawers are scrollable on mobile */
:deep(.el-drawer__body) {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Improve touch targets */
@media (max-width: 768px) {
  :deep(.el-button) {
    min-height: 44px; /* iOS recommended touch target */
  }

  :deep(.el-select),
  :deep(.el-input) {
    min-height: 44px;
  }

  :deep(.el-input__inner),
  :deep(.el-input__wrapper) {
    min-height: 44px;
  }
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
 
 