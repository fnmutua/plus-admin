<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">

declare global {
  interface Window {
    google: any
  }
}

import { getSettlementListByCounty, DeleteRecord, updateOneRecord, getOneGeo, deleteDocument, getAllGeo, getfilteredGeo, CreateRecord } from '@/api/settlements'
import { getCountyListApi, getListWithoutGeo } from '@/api/counties'
import { getFile, getSummarybyFieldFromMultipleIncludes } from '@/api/summary'
import {
  ElButton, ElSelect, MessageParamsWithType, UploadProps, ElDescriptions, ElDescriptionsItem, ElCol, ElRow, ElCard,
  ElOptionGroup, ElOption, FormInstance, ElMessage, ElCollapse, ElCollapseItem, ElInput, ElBadge, ElSegmented,
  ElPagination, ElTooltip, ElTabPane, ElTabs, ElTable, ElTableColumn, ElDialog, ElUpload, ElIcon,
  ElPopconfirm, ElDivider, ElDropdown, ElDropdownItem, ElDropdownMenu, ElForm, ElFormItem, ElEmpty, ElDrawer,
  ElInputNumber, ElSteps, ElStep
} from 'element-plus'
import { computed, ref, reactive, nextTick, defineAsyncComponent, type Ref } from 'vue'
import xlsx from "json-as-xlsx"

import {
  Position, TopRight, User, Plus, Edit, Delete, View, Download, Filter, InfoFilled, Back, Search,
  MessageBox, Apple, Cherry, Grape, Orange, Pear, Watermelon, CircleClose, Message, CircleCheck, StarFilled, Loading, Check
} from '@element-plus/icons-vue'



import { useRouter, useRoute } from 'vue-router'
import exportFromJSON from 'export-from-json'
  


import { Loader } from '@googlemaps/js-api-loader'
import bbox from '@turf/bbox'
import * as turf from '@turf/turf'
import { feature } from '@turf/turf'

import { countyOptions, subcountyOptions, settlementOptionsV2, LevelOptions, ownsershipOptions, regOptions, HCFTypeOptions, SchoolLevelOptions } from './../common/index'

import UploadComponent from '@/views/Components/UploadComponent.vue';
 
import TableActions from '@/views/Components/TableActions.vue';

import ListDocuments from '@/views/Components/ListDocuments.vue';
import DownloadAll from '@/views/Components/DownloadAll.vue';
import DownloadCustom from '@/views/Components/DownloadCustom.vue';


import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import PermissionWrapper from '@/components/PermissionWrapper.vue'



const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)

// For settlements, show 'viewOnMap' and 'addFacility' actions
const action_buttons = ref<string[]>(['viewOnMap', 'addFacility']);

// Google Maps API Key
const googleMapsApiKey = 'AIzaSyCrzbOkfG52zkAxYPkMvvRMlxE9qHK4uDk'

console.log('action_buttons', action_buttons.value);







console.log("userInfo--->", userInfo)
console.log("showAdminButtons--->", showAdminButtons.value)

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
    disabled: false
  },
  {
    label: 'Rejected',
    value: 'Rejected',
    icon: CircleClose,
    count: totalRejected,
    disabled: false
  },

  {
    label: 'Map',
    value: 'Map',
    icon: Position,
    count: total,
    disabled:false,

  },
])







const { push } = useRouter()



const countiesOptions = ref([])
const settlementOptions = ref([])
const settlements = ref([])
const page = ref(1)
const pSize = ref(6)
const selCounties = []
const loading = ref(true)
const pageSize = ref(6)
const currentPage = ref(1)

const tableDataList = ref([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
// var filters = []
// var filterValues = []

const filters = ref(['isApproved'])
const filterValues = ref([['Approved']])  // make sure the inner array is array

const associated_Model = ''
const associated_multiple_models = ['settlement', 'users', 'county', 'subcounty', 'ward']

const model = 'settlement'
const educationFacilityModel = 'education_facility'

// Store education facilities for each settlement
const settlementEducationFacilities = reactive<Record<number, any[]>>({})
const loadingFacilities = reactive<Record<number, boolean>>({})

// Drawer state for map
const mapDrawerVisible = ref(false)
const mapDrawerSettlement = ref<any>(null)
const mapDrawerContainer = ref<HTMLElement | null>(null)
const googleMap = ref<any>(null)
const settlementPolygon = ref<any>(null)
const educationFacilityMarkers = ref<any[]>([])
const settlementGeo = ref<any>(null)
const educationFacilitiesGeo = ref<any>(null)
// Store facility data with markers for editing
const facilityMarkerDataMap = ref<Map<any, any>>(new Map())

// Facility form drawer state
const facilityDrawerVisible = ref(false)
const facilityFormRef = ref<FormInstance>()
const editingFacilityId = ref<number | null>(null)
const isEditMode = ref(false)

// Facility form data - adapted from AddEducationNew.vue
const facilityForm = reactive({
  name: '',
  registration_number: '',
  settlement_id: '',
  county_id: '',
  subcounty_id: '',
  ward_id: '',
  education_category: [],
  registration_status: '',
  ownership_type: '',
  ownership_details: '',
  boarding_type: '',
  land_ownership_status: '',
  respondent_name: '',
  respondent_phone: '',
  enrolled_boys_count: null,
  enrolled_girls_count: null,
  student_source: '',
  male_teachers_count: null,
  female_teachers_count: null,
  classroom_count: null,
  classroom_condition: '',
  boys_toilets_count: null,
  girls_toilets_count: null,
  handwashing_stations_count: null,
  toilet_condition: '',
  fees_paid_by_students: '',
  term_1_fees_amount: null,
  term_2_fees_amount: null,
  term_3_fees_amount: null,
  dropout_count: null,
  dropout_reasons: '',
  retention_efforts: '',
  retention_efforts_reasons: '',
  sanitary_pads_provision: '',
  sanitary_pads_provider: '',
  sanitary_pads_bins: '',
  teaching_aids_available: '',
  boreholes_count: null,
  water_tanks_count: null,
  permanent_classrooms_count: null,
  bom_teachers_count: null,
  compound_fence_status: '',
  school_challenges: '',
  parcel_has_title: '',
  parcel_size_hectares: null,
  efforts_for_student_retention: '',
  additional_comments: '',
  distance_in_meters: null,
  geom: null
})

const facilityFormRules = reactive({
  name: [{ required: true, message: 'School name is required', trigger: 'blur' }],
  settlement_id: [{ required: true, message: 'Settlement is required', trigger: 'blur' }]
})

// Form options - using SchoolLevelOptions for education
const categoryOptionsLocal = [
  { label: 'Pre-Primary 1 and 2 (PP1 and PP2)', value: 'pre_primary' },
  { label: 'Lower Primary (Grade 1-3 )', value: 'lower_primary' },
  { label: 'Upper Primary (Grade 4-6)', value: 'upper_primary' },
  { label: 'Junior School (Grade 7-9 )', value: 'junior_school' },
  { label: 'Senior School(Grade 10-12)', value: 'senior_school' },
  { label: 'Technical Vocational Education and Training(TVET)', value: 'tvet' }
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

const boardingTypeOptions = [
  { label: 'Day', value: 'day' },
  { label: 'Boarding', value: 'boarding' },
  { label: 'Both', value: 'both' }
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

// Full legend items based on school categories
const allLegendItems = ref([
  {
    label: "Pre-Primary / ECD",
    color: "#a6cee3",
    key: "pre_primary"
  },
  {
    label: "Primary School",
    color: '#1f78b4',
    key: "primary"
  },
  {
    label: "Secondary School",
    color: '#b2df8a',
    key: "secondary"
  },
  {
    label: "Village Polytechnique",
    color: '#33a02c',
    key: "polytechnic"
  },
  {
    label: "Adult Education",
    color: '#fb9a99',
    key: "adult_school"
  },
  {
    label: "School for Disabled",
    color: '#e31a1c',
    key: "school_for_disabled"
  },
  {
    label: "School for Deaf",
    color: '#fdbf6f',
    key: "school_for_deaf"
  },
  {
    label: "School for Blind",
    color: "#ff7f00",
    key: "school_for_blind"
  },
  {
    label: "Others/Unknown",
    color: "#969696",
    key: "other"
  }
])

// Track which facility categories are present in the current map
const presentFacilityCategories = reactive<string[]>([])

// Computed property for dynamic legend - only show items that are present
const legendItems = computed(() => {
  if (presentFacilityCategories.length === 0) {
    return []
  }
  
  // Convert to Set for efficient lookup
  const categoriesSet = new Set(presentFacilityCategories)
  
  return allLegendItems.value.filter(item => {
    return categoriesSet.has(item.key)
  })
})
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



// Load education facilities for a specific settlement
const loadEducationFacilitiesForSettlement = async (settlementId: number) => {
  if (loadingFacilities[settlementId] || settlementEducationFacilities[settlementId]) {
    return settlementEducationFacilities[settlementId] || []
  }

  loadingFacilities[settlementId] = true
  try {
    const formData = {
      limit: 1000,
      page: 1,
      curUser: 1,
      model: educationFacilityModel,
      searchField: 'name',
      searchKeyword: '',
      filters: ['settlement_id'],
      filterValues: [[settlementId]],
      associated_multiple_models: ['settlement', 'county', 'subcounty', 'ward', 'users']
    }

    const res = await getSettlementListByCounty(formData)
    settlementEducationFacilities[settlementId] = res.data || []
    return res.data || []
  } catch (error) {
    console.error('Error loading education facilities:', error)
    ElMessage.error('Failed to load education facilities')
    return []
  } finally {
    loadingFacilities[settlementId] = false
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
  
  // Use nested_models to filter settlements that have education facilities with the specified approval status
  // This ensures backend filtering - only settlements with matching education facilities are returned
  const isApprovedIndex = selFilters.indexOf('isApproved')
  if (isApprovedIndex !== -1 && selfilterValues[isApprovedIndex] && selfilterValues[isApprovedIndex].length > 0) {
    formData.nested_models = [{
      model: educationFacilityModel,
      field: 'isApproved',
      values: selfilterValues[isApprovedIndex],
      requireMatch: true // Only return settlements that have education facilities matching the status
    }]
  }



  const res = await getSettlementListByCounty(formData)

  console.log('After Query - Settlements with Education Facilities (backend filtered):', res)

  // Backend should have already filtered to only settlements with education facilities
  // Now load education facilities counts for display
  if (res.data && res.data.length > 0) {
    await Promise.all(res.data.map(async (settlement: any) => {
      await loadEducationFacilitiesForSettlement(settlement.id)
    }))
  }

  console.log('activeSegment.value', activeSegment.value)
  if (activeSegment.value == 'Approved') {
    tableDataList.value = res.data || []
    total.value = res.total || 0
    removeReviewButton()

  } else if (activeSegment.value == 'New') {
    tableDataListNew.value = res.data || []
    totalNew.value = res.total || 0

    if (!action_buttons.value.includes('review')) {
      action_buttons.value.push('review');
    }

  }
  else if (activeSegment.value == 'Rejected') {
    tableDataListRejected.value = res.data || []
    totalRejected.value = res.total || 0
    removeReviewButton()

  }




}


const statuses = ref([])
const getSummaryStatus = async () => {
  // Get count of settlements that have education facilities with different approval statuses
  const formData = {}
  formData.model = educationFacilityModel
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
  // This function is kept for backward compatibility but is no longer used
  // for map rendering since we're using Google Maps in the drawer
  const formData = {}
  formData.model = model

  console.log(formData)
  const res = await getAllGeo(formData)

  if (res.data[0]?.json_build_object) {
    facilityGeo.value = res.data[0].json_build_object
    console.log('Geo Returns---', res.data[0].json_build_object)
  }
}


//getParentNames()
getCountyNames()

getModelOptions()
getInterventionsAll()
getGeo()

const onSegmentClick = async () => {
  console.log(activeSegment.value);
  if (activeSegment.value === "Map") {
    // Map functionality is now handled via the drawer in flyTo function
    // This segment click handler can be removed or repurposed if needed
  }

  if (activeSegment.value === "Approved") {

    var selectOption = 'isApproved'
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
          ['==', ['get', 'category'], 'ecd'],
          '#a6cee3',
          ['==', ['get', 'category'], 'primary'],
          '#1f78b4',
          ['==', ['get', 'category'], 'secondary'],
          '#b2df8a',
          ['==', ['get', 'category'], 'polytechnic'],
          '#33a02c',
          ['==', ['get', 'category'], 'adult_school'],
          '#fb9a99',
          ['==', ['get', 'category'], 'school_for_disabled'],
          '#e31a1c',
          ['==', ['get', 'category'], 'school_for_deaf'],
          '#fdbf6f',
          ['==', ['get', 'category'], 'school_for_blind'],
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
    // Map functionality is now handled via the drawer in flyTo function
    // This segment click handler can be removed or repurposed if needed
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


// Static legend items for Map tab (not the drawer)
const mapTabLegendItems = [
  {
    color: '#a6cee3',
    label: 'Nursery school / ECD'
  },
  {
    color: '#1f78b4',
    label: ' Primary school'
  }, {
    color: '#b2df8a',
    label: 'Secondary school'
  },
  {
    color: '#33a02c',
    label: 'Village Polytechnique'
  },
  {
    color: '#fb9a99',
    label: 'Adult Education School'
  },
  {
    color: '#e31a1c',
    label: 'School for physically challenged '
  },
  {
    color: '#fdbf6f',
    label: 'School for deaf'
  },

  {
    color: '#ff7f00',
    label: 'School for blind'
  },

  {
    color: 'gray',
    label: 'Other'
  }


]


const DeleteFacility = async (data: TableSlotDefault) => {
  console.log('----->', data)
  
  try {
    let formData = {}
    formData.id = data.id
    formData.model = model

    // Delete the record from backend
    await DeleteRecord(formData)

    // Delete documents only if there's any document to delete 
    if (data.documents && data.documents.length > 0) {
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
const reviewWindowWidth = ref('50%')

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


  formheader.value = "Review"

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
const mfield = 'education_facility_id'
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
  // Load education facilities for this settlement
  await loadEducationFacilitiesForSettlement(row.id)
  
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

    getFilteredData(filters.value, filterValues.value)

  }


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
      name: 'AddEducationNew',
      query: {
        county_id: data.county_id || data.county?.id || '',
        settlement_id: data.id || ''
      }
    })
  } else {
    // No data provided, just navigate to add page
    push({
      name: 'AddEducationNew'
    })
  }
}

const handleAddFacility = (row: any) => {
  AddFacility(row)
}

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
      await loadEducationFacilitiesOnMap(settlement.id)
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

// Load education facilities on map
const loadEducationFacilitiesOnMap = async (settlementId: number) => {
  try {
    // Clear existing markers and reset present categories
    educationFacilityMarkers.value.forEach(marker => marker.setMap(null))
    educationFacilityMarkers.value = []
    presentFacilityCategories.length = 0

    if (!googleMap.value) {
      console.error('Google map not initialized')
      return
    }

    console.log('Loading education facilities for settlement:', settlementId)

    // First, try to get facilities from already loaded data
    const facilities = await loadEducationFacilitiesForSettlement(settlementId)
    console.log('Loaded facilities:', facilities.length)

    // Get education facilities GeoJSON
    const formData: any = {
      model: educationFacilityModel,
      columnFilterField: 'settlement_id',
      selectedParents: settlementId,
      filtredGeoIds: [settlementId]
    }

    const res = await getfilteredGeo(formData)
    
    console.log('Education facilities Geo response:', res)
    
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
    }
    
    console.log('Extracted GeoJSON data:', geoJsonData)
    
    if (!geoJsonData) {
      console.log('No GeoJSON data found for education facilities')
      ElMessage.info('No education facilities with geometry data found for this settlement.')
      return
    }
    
    if (geoJsonData.features === null || (Array.isArray(geoJsonData.features) && geoJsonData.features.length === 0)) {
      console.log('GeoJSON features is null or empty')
      ElMessage.info('No education facilities with geometry data found for this settlement.')
      educationFacilitiesGeo.value = null
      return
    }
    
    educationFacilitiesGeo.value = geoJsonData
    const features = geoJsonData.features || []
    
    if (features.length === 0) {
      ElMessage.info('No education facilities found with geometry for this settlement.')
      educationFacilitiesGeo.value = null
      return
    }
    
    // Process features and create markers
    features.forEach((feature: any) => {
      if (feature.geometry && feature.geometry.type === 'Point') {
        const coords = feature.geometry.coordinates
        if (!coords || coords.length < 2) {
          return
        }
        
        const [lng, lat] = coords
        // Get category from properties - education facilities use 'category' or 'education_category'
        let category = (feature.properties?.category || feature.properties?.education_category || 'other').toLowerCase().trim()
        
        // Normalize category values
        if (!category || category === 'n/a' || category === 'na') {
          category = 'other'
        }
        
        // Track this facility category for dynamic legend
        if (!presentFacilityCategories.includes(category)) {
          presentFacilityCategories.push(category)
        }
        
        // Get color based on category
        const colorMap: Record<string, string> = {
          'pre_primary': '#a6cee3',
          'primary': '#1f78b4',
          'secondary': '#b2df8a',
          'polytechnic': '#33a02c',
          'adult_school': '#fb9a99',
          'school_for_disabled': '#e31a1c',
          'school_for_deaf': '#fdbf6f',
          'school_for_blind': '#ff7f00',
          'other': '#969696'
        }
        
        const color = colorMap[category] || colorMap['other']
        
        try {
          const marker = new window.google.maps.Marker({
            position: { lat, lng },
            map: googleMap.value,
            title: feature.properties?.name || 'Education Facility',
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: color,
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              strokeOpacity: 1
            }
          })

          const categoryLabel = allLegendItems.value.find(item => item.key === category)?.label || category
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${feature.properties?.name || 'Education Facility'}</h3>
                <p style="margin: 0 0 5px 0; font-size: 12px;"><strong>Category:</strong> ${categoryLabel}</p>
                ${feature.properties?.ownership_type ? `<p style="margin: 5px 0 0 0; font-size: 12px;"><strong>Ownership:</strong> ${feature.properties.ownership_type}</p>` : ''}
                ${feature.properties?.registration_status ? `<p style="margin: 5px 0 0 0; font-size: 12px;"><strong>Status:</strong> ${feature.properties.registration_status}</p>` : ''}
              </div>
            `
          })

          facilityMarkerDataMap.value.set(marker, feature.properties)
          
          marker.addListener('click', () => {
            openFacilityForm(feature.properties)
          })

          educationFacilityMarkers.value.push(marker)
        } catch (markerError) {
          console.error('Error creating marker:', markerError, feature)
        }
      }
    })
    
    if (educationFacilityMarkers.value.length === 0) {
      ElMessage.info('No education facilities with valid Point geometry found')
    } else {
      ElMessage.success(`Loaded ${educationFacilityMarkers.value.length} education facilities on map`)
    }
  } catch (error) {
    console.error("Error loading education facilities on map:", error)
    ElMessage.error("Failed to load education facilities on map: " + (error as Error).message)
  }
}

// Open facility form drawer for editing
const openFacilityForm = (facilityData: any) => {
  isEditMode.value = true
  editingFacilityId.value = facilityData.id || null
  
  // Populate form with facility data
  facilityForm.name = facilityData.name || ''
  facilityForm.registration_number = facilityData.registration_number || ''
  facilityForm.settlement_id = facilityData.settlement_id || mapDrawerSettlement.value?.id || ''
  facilityForm.county_id = facilityData.county_id || mapDrawerSettlement.value?.county_id || ''
  facilityForm.subcounty_id = facilityData.subcounty_id || mapDrawerSettlement.value?.subcounty_id || ''
  facilityForm.ward_id = facilityData.ward_id || mapDrawerSettlement.value?.ward_id || ''
  facilityForm.education_category = Array.isArray(facilityData.education_category) ? facilityData.education_category : (facilityData.category ? [facilityData.category] : [])
  facilityForm.registration_status = facilityData.registration_status || ''
  facilityForm.ownership_type = facilityData.ownership_type || ''
  facilityForm.ownership_details = facilityData.ownership_details || ''
  facilityForm.boarding_type = facilityData.boarding_type || ''
  facilityForm.land_ownership_status = facilityData.land_ownership_status || ''
  facilityForm.respondent_name = facilityData.respondent_name || ''
  facilityForm.respondent_phone = facilityData.respondent_phone || ''
  facilityForm.enrolled_boys_count = facilityData.enrolled_boys_count || null
  facilityForm.enrolled_girls_count = facilityData.enrolled_girls_count || null
  facilityForm.student_source = facilityData.student_source || ''
  facilityForm.male_teachers_count = facilityData.male_teachers_count || null
  facilityForm.female_teachers_count = facilityData.female_teachers_count || null
  facilityForm.classroom_count = facilityData.classroom_count || null
  facilityForm.classroom_condition = facilityData.classroom_condition || ''
  facilityForm.boys_toilets_count = facilityData.boys_toilets_count || null
  facilityForm.girls_toilets_count = facilityData.girls_toilets_count || null
  facilityForm.handwashing_stations_count = facilityData.handwashing_stations_count || null
  facilityForm.toilet_condition = facilityData.toilet_condition || ''
  facilityForm.fees_paid_by_students = facilityData.fees_paid_by_students || ''
  facilityForm.term_1_fees_amount = facilityData.term_1_fees_amount || null
  facilityForm.term_2_fees_amount = facilityData.term_2_fees_amount || null
  facilityForm.term_3_fees_amount = facilityData.term_3_fees_amount || null
  facilityForm.dropout_count = facilityData.dropout_count || null
  facilityForm.dropout_reasons = facilityData.dropout_reasons || ''
  facilityForm.retention_efforts = facilityData.retention_efforts || ''
  facilityForm.retention_efforts_reasons = facilityData.retention_efforts_reasons || ''
  facilityForm.sanitary_pads_provision = facilityData.sanitary_pads_provision || ''
  facilityForm.sanitary_pads_provider = facilityData.sanitary_pads_provider || ''
  facilityForm.sanitary_pads_bins = facilityData.sanitary_pads_bins || ''
  facilityForm.teaching_aids_available = facilityData.teaching_aids_available || ''
  facilityForm.boreholes_count = facilityData.boreholes_count || null
  facilityForm.water_tanks_count = facilityData.water_tanks_count || null
  facilityForm.permanent_classrooms_count = facilityData.permanent_classrooms_count || null
  facilityForm.bom_teachers_count = facilityData.bom_teachers_count || null
  facilityForm.compound_fence_status = facilityData.compound_fence_status || ''
  facilityForm.school_challenges = facilityData.school_challenges || ''
  facilityForm.parcel_has_title = facilityData.parcel_has_title || ''
  facilityForm.parcel_size_hectares = facilityData.parcel_size_hectares || null
  facilityForm.efforts_for_student_retention = facilityData.efforts_for_student_retention || ''
  facilityForm.additional_comments = facilityData.additional_comments || ''
  facilityForm.distance_in_meters = facilityData.distance_in_meters || null
  
  facilityDrawerVisible.value = true
}

// Submit facility form
const submitFacilityForm = async () => {
  if (!facilityFormRef.value) return
  
  await facilityFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        const formData: any = {
          ...facilityForm,
          model: educationFacilityModel
        }
        
        if (isEditMode.value && editingFacilityId.value) {
          formData.id = editingFacilityId.value
          const res = await updateOneRecord(formData)
          if (res.status === 'success') {
            ElMessage.success('Education facility updated successfully')
            // Reload facilities on map and in table
            if (mapDrawerSettlement.value) {
              await loadEducationFacilitiesOnMap(mapDrawerSettlement.value.id)
              await loadEducationFacilitiesForSettlement(mapDrawerSettlement.value.id)
            }
            await getFilteredData(filters.value, filterValues.value)
            closeFacilityDrawer()
          } else {
            ElMessage.error('Failed to update education facility')
          }
        } else {
          const res = await CreateRecord(formData)
          if (res.status === 'success') {
            ElMessage.success('Education facility created successfully')
            // Reload facilities on map and in table
            if (mapDrawerSettlement.value) {
              await loadEducationFacilitiesOnMap(mapDrawerSettlement.value.id)
              await loadEducationFacilitiesForSettlement(mapDrawerSettlement.value.id)
            }
            await getFilteredData(filters.value, filterValues.value)
            closeFacilityDrawer()
          } else {
            ElMessage.error('Failed to create education facility')
          }
        }
      } catch (error) {
        console.error('Error submitting facility form:', error)
        ElMessage.error('Failed to save education facility')
      }
    }
  })
}

// Reset facility form
const resetFacilityForm = () => {
  isEditMode.value = false
  editingFacilityId.value = null
  Object.keys(facilityForm).forEach(key => {
    if (Array.isArray(facilityForm[key])) {
      facilityForm[key] = []
    } else if (typeof facilityForm[key] === 'number') {
      facilityForm[key] = null
    } else {
      facilityForm[key] = ''
    }
  })
  facilityForm.geom = null
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
  educationFacilityMarkers.value.forEach(marker => marker.setMap(null))
  educationFacilityMarkers.value = []
  presentFacilityCategories.length = 0
  settlementPolygon.value = null
  googleMap.value = null
  mapDrawerSettlement.value = null
  settlementGeo.value = null
  educationFacilitiesGeo.value = null
  facilityMarkerDataMap.value.clear()
}

const editFacility = (data: TableSlotDefault) => {
  push({
    name: 'AddEducationX',
    query: { id: data.id }

  });


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
            <PermissionWrapper :permissions="'education_facility:create'">
              <el-button @click="AddFacility" type="primary" :icon="Plus" />
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
              <h3>Education Facilities in {{ props.row.name }}</h3>
              <div v-if="loadingFacilities[props.row.id]" style="text-align: center; padding: 20px;">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>Loading education facilities...</span>
              </div>
              <el-table 
                v-else
                :data="settlementEducationFacilities[props.row.id] || []" 
                style="width: 100%;" 
                border
                size="small"
              >
                <el-table-column label="Facility Name" prop="name" />
                <el-table-column label="Category" prop="category" />
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
                    <PermissionWrapper :permissions="['education_facility:update', 'education_facility:delete']">
                      <el-button size="small" type="primary" :icon="Edit" @click="editFacility(row)" />
                      <el-button size="small" type="danger" :icon="Delete" @click="DeleteFacility(row)" />
                    </PermissionWrapper>
                  </template>
                </el-table-column>
              </el-table>
              <div v-if="!loadingFacilities[props.row.id] && (!settlementEducationFacilities[props.row.id] || settlementEducationFacilities[props.row.id].length === 0)" style="text-align: center; padding: 20px;">
                <el-empty description="No education facilities found in this settlement" />
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
        <el-table-column label="Education Facilities Count" sortable>
          <template #default="scope">
            <el-badge :value="settlementEducationFacilities[scope.row.id]?.length || 0" class="item" />
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
        <el-empty description="No settlements with approved education facilities found" />
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
      <el-table :data="tableDataListNew" style="width: 100%; margin-top: 10px;" border @expand-change="handleExpand">
        <el-table-column type="expand">
          <template #default="props">
            <div style="padding: 20px;">
              <h3>Education Facilities in {{ props.row.name }}</h3>
              <div v-if="loadingFacilities[props.row.id]" style="text-align: center; padding: 20px;">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>Loading education facilities...</span>
              </div>
              <el-table 
                v-else
                :data="settlementEducationFacilities[props.row.id] || []" 
                style="width: 100%;" 
                border
                size="small"
              >
                <el-table-column label="Facility Name" prop="name" />
                <el-table-column label="Category" prop="category" />
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
                    <PermissionWrapper :permissions="['education_facility:update', 'education_facility:delete']">
                      <el-button size="small" type="primary" :icon="Edit" @click="editFacility(row)" />
                      <el-button size="small" type="danger" :icon="Delete" @click="DeleteFacility(row)" />
                    </PermissionWrapper>
                  </template>
                </el-table-column>
              </el-table>
              <div v-if="!loadingFacilities[props.row.id] && (!settlementEducationFacilities[props.row.id] || settlementEducationFacilities[props.row.id].length === 0)" style="text-align: center; padding: 20px;">
                <el-empty description="No education facilities found in this settlement" />
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
        <el-table-column label="Education Facilities Count" sortable>
          <template #default="scope">
            <el-badge :value="settlementEducationFacilities[scope.row.id]?.length || 0" class="item" />
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
        <el-empty description="No settlements with new education facilities found" />
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
        @expand-change="handleExpand">
        <el-table-column type="expand">
          <template #default="props">
            <div style="padding: 20px;">
              <h3>Education Facilities in {{ props.row.name }}</h3>
              <div v-if="loadingFacilities[props.row.id]" style="text-align: center; padding: 20px;">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>Loading education facilities...</span>
              </div>
              <el-table 
                v-else
                :data="settlementEducationFacilities[props.row.id] || []" 
                style="width: 100%;" 
                border
                size="small"
              >
                <el-table-column label="Facility Name" prop="name" />
                <el-table-column label="Category" prop="category" />
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
                    <PermissionWrapper :permissions="['education_facility:update', 'education_facility:delete']">
                      <el-button size="small" type="primary" :icon="Edit" @click="editFacility(row)" />
                      <el-button size="small" type="danger" :icon="Delete" @click="DeleteFacility(row)" />
                    </PermissionWrapper>
                  </template>
                </el-table-column>
              </el-table>
              <div v-if="!loadingFacilities[props.row.id] && (!settlementEducationFacilities[props.row.id] || settlementEducationFacilities[props.row.id].length === 0)" style="text-align: center; padding: 20px;">
                <el-empty description="No education facilities found in this settlement" />
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
        <el-table-column label="Education Facilities Count" sortable>
          <template #default="scope">
            <el-badge :value="settlementEducationFacilities[scope.row.id]?.length || 0" class="item" />
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
        <el-empty description="No settlements with rejected education facilities found" />
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
      <div id="mapContainer" class="basemap" style="width: 100%; margin-top: 10px;"></div>
      <div id="floating-div">
        <el-card>
          <el-collapse>
            <el-collapse-item title="LEGEND">
              <div class="legend">
                <div v-for="item in mapTabLegendItems" :key="item.label" class="legend-item">
                  <div class="circle-color" :style="{ backgroundColor: item.color }"></div>
                  <div class="legend-label">{{ item.label }}</div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-card>
      </div>

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



  <el-dialog v-model="ShowReviewDialog" @close="handleClose" :title="formheader" :width="reviewWindowWidth" draggable>
    <el-descriptions title="" direction="vertical" :column="2" size="small" border>
      <el-descriptions-item label="Name">{{ facility_raw.name }}</el-descriptions-item>
      <el-descriptions-item label="Status" :span="2">{{ facility_raw.reg_status }}</el-descriptions-item>
      <el-descriptions-item label="Type">{{ facility_raw.ownership_type }}</el-descriptions-item>
      <el-descriptions-item label="owner"> {{ facility_raw.owner }} </el-descriptions-item>
      <el-descriptions-item label="Submitted By"> {{ facility_raw.user }} </el-descriptions-item>
      <el-descriptions-item label="Date"> {{ facility_raw.date }} </el-descriptions-item>

    </el-descriptions>
    <template #footer>
      <span class="dialog-footer">
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
    title="Settlement Map with Education Facilities"
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
      
      <!-- Legend - Dynamically shows only facility categories present on map -->
      <div v-if="legendItems && legendItems.length > 0" class="map-legend">
        <h4 class="legend-title">Education Facility Categories</h4>
        <template v-for="item in legendItems" :key="item.key">
          <div class="legend-item">
            <div 
              class="legend-circle"
              :style="{ backgroundColor: item.color }"
            ></div>
            <span class="legend-label">{{ item.label }}</span>
          </div>
        </template>
      </div>
    </div>
  </el-drawer>

  <!-- Facility Form Drawer for Editing -->
  <el-drawer
    v-model="facilityDrawerVisible"
    :title="isEditMode ? 'Edit Education Facility' : 'Education Facility Details'"
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

      <el-form-item label="School Name" prop="name">
        <el-input v-model="facilityForm.name" placeholder="Enter school name" />
      </el-form-item>

      <el-form-item label="Registration Number">
        <el-input v-model="facilityForm.registration_number" placeholder="Enter registration number" />
      </el-form-item>

      <el-form-item label="Education Category">
        <el-select v-model="facilityForm.education_category" placeholder="Select category" filterable multiple style="width: 100%">
          <el-option
            v-for="item in categoryOptionsLocal"
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

      <el-form-item label="Boarding Type">
        <el-select v-model="facilityForm.boarding_type" placeholder="Select boarding type" filterable style="width: 100%">
          <el-option
            v-for="item in boardingTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-divider content-position="left">Enrollment</el-divider>

      <el-form-item label="Enrolled Boys">
        <el-input-number v-model="facilityForm.enrolled_boys_count" :min="0" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Enrolled Girls">
        <el-input-number v-model="facilityForm.enrolled_girls_count" :min="0" style="width: 100%" />
      </el-form-item>

      <el-divider content-position="left">Staff</el-divider>

      <el-form-item label="Male Teachers">
        <el-input-number v-model="facilityForm.male_teachers_count" :min="0" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Female Teachers">
        <el-input-number v-model="facilityForm.female_teachers_count" :min="0" style="width: 100%" />
      </el-form-item>

      <el-divider content-position="left">Infrastructure</el-divider>

      <el-form-item label="Classrooms">
        <el-input-number v-model="facilityForm.classroom_count" :min="0" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Classroom Condition">
        <el-select v-model="facilityForm.classroom_condition" placeholder="Select condition" filterable style="width: 100%">
          <el-option
            v-for="item in conditionFacilityOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Boys Toilets">
        <el-input-number v-model="facilityForm.boys_toilets_count" :min="0" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Girls Toilets">
        <el-input-number v-model="facilityForm.girls_toilets_count" :min="0" style="width: 100%" />
      </el-form-item>

      <el-divider content-position="left">Additional Information</el-divider>

      <el-form-item label="Respondent Name">
        <el-input v-model="facilityForm.respondent_name" placeholder="Enter respondent name" />
      </el-form-item>

      <el-form-item label="Respondent Phone">
        <el-input v-model="facilityForm.respondent_phone" placeholder="Enter respondent phone" />
      </el-form-item>

      <el-form-item label="School Challenges">
        <el-input v-model="facilityForm.school_challenges" type="textarea" :rows="3" placeholder="Enter challenges" />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="drawer-footer-mobile">
        <el-button @click="closeFacilityDrawer" class="footer-btn">Cancel</el-button>
        <el-button type="primary" @click="submitFacilityForm" :icon="Check" class="footer-btn">
          {{ isEditMode ? 'Update Education Facility' : 'Save Education Facility' }}
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