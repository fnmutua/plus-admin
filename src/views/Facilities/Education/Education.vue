<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">

import { loadGoogleMapsApi } from '@/composables/useGoogleMapsLoader'
declare global {
  interface Window {
    google: any
  }
}

import { getSettlementListByCounty, DeleteRecord, updateOneRecord, getOneGeo, deleteDocument, getAllGeo, getfilteredGeo, CreateRecord, searchByKeyWord } from '@/api/settlements'
import { getCountyListApi, getListWithoutGeo } from '@/api/counties'
import { getSummarybyFieldFromMultipleIncludes } from '@/api/summary'
import { GOOGLE_MAPS_API_KEY as googleMapsApiKey } from '@/config/googleMaps'
import {
  ElButton, ElSelect, MessageParamsWithType, ElDescriptions, ElDescriptionsItem, ElCol, ElRow, ElCard,
  ElOption, FormInstance, ElMessage, ElInput, ElBadge, ElSegmented,
  ElPagination, ElTooltip, ElTable, ElTableColumn, ElDialog, ElIcon,
  ElDivider, ElDropdown, ElDropdownItem, ElDropdownMenu, ElForm, ElFormItem, ElEmpty, ElDrawer,
  ElInputNumber} from 'element-plus'
import { computed, ref, reactive, nextTick, defineAsyncComponent } from 'vue'

import {
  Plus, Edit, Delete, Filter, Back, Search, ArrowDown,
  Loading, Check
} from '@element-plus/icons-vue'



import { useRouter, useRoute } from 'vue-router'
  


import * as turf from '@turf/turf'

import { countyOptions, subcountyOptions, settlementOptionsV2, LevelOptions, ownsershipOptions, HCFTypeOptions } from './../common/index'

import UploadComponent from '@/views/Components/UploadComponent.vue';
 
import TableActions from '@/views/Components/TableActions.vue';

import DownloadCustom from '@/views/Components/DownloadCustom.vue';


import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { userHasPrivilegedNationalLocation } from '@/utils/roleScope'
import PermissionWrapper from '@/components/PermissionWrapper.vue'



const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)

// For settlements and schools, show core actions (no inline "Add Facility" here)
const action_buttons = ref<string[]>(['viewProfile', 'viewOnMap', 'delete']);

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

console.log('action_buttons', action_buttons.value);
console.log('User location info:', {
  isSuperAdmin: isSuperAdmin.value,
  hasNationalAccess: hasNationalAccess.value,
  userCountyId: userCountyId.value,
  userSettlementId: userSettlementId.value,
  isCountyRestricted: isCountyRestricted.value
})







console.log("userInfo--->", userInfo)
console.log("showAdminButtons--->", showAdminButtons.value)

const tableDataListNew = ref([])
const tableDataListRejected = ref([])
// Pagination totals (settlements count)
const totalRejected = ref(0)
const totalNew = ref(0)
const total = ref(0)

// We previously tracked segment counts for Approved/New/Rejected; now we use a single unified list,
// but we keep these refs (and a simple activeSegment flag) for compatibility with existing logic.
const badgeCountApproved = ref(0)
const badgeCountNew = ref(0)
const badgeCountRejected = ref(0)
const activeSegment = ref('Approved')







const { push } = useRouter()



const countiesOptions = ref([])
const settlementOptions = ref([])
const settlements = ref([])
const page = ref(1)
const pSize = ref(10)
const selCounties = []
const loading = ref(true)
const pageSize = ref(10)
const currentPage = ref(1)

const tableDataList = ref([])
//// ------------------parameters -----------------------////
// Global search term and location filters for schools list
const search_string = ref<string>('')
const enableSubcounty = ref(false)
const selectedCounty = ref<any[]>([])
const selectedSettlement = ref<any[]>([])
// We now show a single unified list of settlements (no status segments)
// Filters can still be applied for location, but not by isApproved here.
const filters = ref<string[]>([])
const filterValues = ref<any[][]>([])  // make sure the inner array is array

const associated_Model = ''
const associated_multiple_models = ['settlement', 'users', 'county', 'subcounty', 'ward']

const model = 'settlement'
const educationFacilityModel = 'education_facility'

// Store education facilities for each settlement
const settlementEducationFacilities = ref<Record<number, any[]>>({})
const loadingFacilities = ref<Record<number, boolean>>({})

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
const mapDrawerActiveSchool = ref<any>(null)
const mapDrawerActiveSchoolId = ref<number | null>(null)
const activeSchoolHasGeometry = ref(false)
const isPlacingSchoolMarker = ref(false)
const mapPlacementMarker = ref<any>(null)
const mapPlacementClickListener = ref<any>(null)

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

// Track which facility categories are present in the current map
const presentFacilityCategories = reactive<string[]>([])
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
  value7.value = null
  search_string.value = ''
  selectedCounty.value = []
  selectedSettlement.value = []

  // Reset and sync pagination
  pSize.value = 5
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



// Load education facilities for a specific settlement
const loadEducationFacilitiesForSettlement = async (settlementId: number) => {
  if (settlementEducationFacilities.value[settlementId]) {
    return settlementEducationFacilities.value[settlementId]
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
      model: educationFacilityModel,
      searchField: 'name',
      searchKeyword: '',
      filters: facilityFilters,
      filterValues: facilityFilterValues,
      associated_multiple_models: ['settlement', 'county', 'subcounty', 'ward', 'users']
    }

    const res = await getSettlementListByCounty(formData)
    settlementEducationFacilities.value[settlementId] = res.data || []
    return res.data || []
  } catch (error) {
    console.error('Error loading education facilities:', error)
    ElMessage.error('Failed to load education facilities')
    return []
  } finally {
    loadingFacilities.value[settlementId] = false
  }
}

const getFilteredData = async (_selFilters?: any, _selfilterValues?: any) => {
  const formData: any = {}
  formData.limit = pSize.value
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = educationFacilityModel // Fetch schools directly
  formData.searchField = 'name'
  formData.searchKeyword = search_string.value || ''

  const filtersArr: string[] = []
  const filterValuesArr: any[] = []
  
  // User location restriction (always enforced)
  if (isCountyRestricted.value && userCountyId.value) {
    filtersArr.push('county_id')
    filterValuesArr.push([userCountyId.value])
  } else if (userSettlementId.value && !isSuperAdmin.value && !hasNationalAccess.value) {
    filtersArr.push('settlement_id')
    filterValuesArr.push([userSettlementId.value])
  }
  
  // UI-selected location filters
  if (selectedCounty.value && selectedCounty.value.length) {
    filtersArr.push('county_id')
    filterValuesArr.push(selectedCounty.value)
  }
  if (selectedSettlement.value && selectedSettlement.value.length) {
    filtersArr.push('settlement_id')
    filterValuesArr.push(selectedSettlement.value)
  }

  // Approval status filter if present in filters.value
  const isApprovedIndex = filters.value.indexOf('isApproved')
  if (isApprovedIndex !== -1 && filterValues.value[isApprovedIndex]?.length) {
    filtersArr.push('isApproved')
    filterValuesArr.push(filterValues.value[isApprovedIndex])
  }

  formData.filters = filtersArr
  formData.filterValues = filterValuesArr
  formData.associated_multiple_models = ['settlement', 'county', 'subcounty', 'ward']

  const res = await getSettlementListByCounty(formData)

  console.log('After Query - Education facilities (school-centric):', res)

  tableDataList.value = res.data || []
  total.value = res.total || (tableDataList.value?.length || 0)

  // Sync pagination variables after fetching
  currentPage.value = page.value
  pageSize.value = pSize.value
}


const statuses = ref([])
const getSummaryStatus = async () => {
  // Get count of settlements that have education facilities with different approval statuses
  const formData: any = {}
  formData.model = educationFacilityModel
  formData.summaryFunction = 'count'
  formData.summaryField = 'isApproved'
  formData.groupFields = ['isApproved']
  
  // Apply county restriction if user is county-restricted - using filters/filterValues only
  if (isCountyRestricted.value && userCountyId.value) {
    formData.filters = ['county_id']
    formData.filterValues = [[userCountyId.value]]
  } else if (userSettlementId.value && !isSuperAdmin.value && !hasNationalAccess.value) {
    formData.filters = ['settlement_id']
    formData.filterValues = [[userSettlementId.value]]
  }
  
  const response = await getSummarybyFieldFromMultipleIncludes(formData);
  statuses.value = response.Total.reduce((acc, item) => {
    acc[item.isApproved] = parseInt(item.count, 10); // Convert count to a number
    return acc;
  }, {});
  console.log('Facilities count by status (for badges):', statuses.value)

  // Set segment badge counts (education facilities count)
  badgeCountApproved.value = statuses.value.Approved !== undefined ? statuses.value.Approved : 0;
  badgeCountNew.value = statuses.value.Pending !== undefined ? statuses.value.Pending : 0;
  badgeCountRejected.value = statuses.value.Rejected !== undefined ? statuses.value.Rejected : 0;
  
  // NOTE: Pagination totals (total.value, totalNew.value, totalRejected.value) are set in getFilteredData()
  // and represent SETTLEMENTS count - these are NOT updated here
  // Badge counts show facilities count, pagination uses settlements count


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

// Rebuild settlementOptions based on selected county (for the top filter bar)
const getSettlementNames = async () => {
  // Ensure we have the base settlements list
  if (!settlements.value || !settlements.value.length) {
    await getModelOptions()
  }

  // If no county filter, show all settlements
  let filteredList = settlements.value

  if (selectedCounty.value && (Array.isArray(selectedCounty.value) ? selectedCounty.value.length : true)) {
    const countyIds = Array.isArray(selectedCounty.value)
      ? selectedCounty.value
      : [selectedCounty.value]

    filteredList = settlements.value.filter((s: any) => countyIds.includes(s.county_id))
  }

  // Wrap in a ref-like object to reuse makeSettlementOptions helper
  const wrapped = { value: filteredList }
  makeSettlementOptions(wrapped)
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
 



const onSegmentClick = async () => {
  console.log(activeSegment.value);

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



const viewProfile = (data: any) => {
  push({ name: 'EducationFacilityDetails', params: { id: data.id } })
}

const activeTab = ref('list')


// Open map drawer for a school or settlement
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
  console.log('DeleteFacility ----->', data)
  
  try {
    const formData: any = {}
    formData.id = data.id

    // Decide which model to delete from based on the row shape:
    // - School rows have a registration_number / education_category and use educationFacilityModel
    // - Fallback to settlement model for legacy settlement rows
    const isSchoolRow = !!(data as any).registration_number || !!(data as any).education_category
    formData.model = isSchoolRow ? educationFacilityModel : model

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
const value7 = ref()

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

// Search helper: simply re-run the main fetch with current search_string and filters
const getFilteredBySearchData = async () => {
  const query = search_string.value?.trim()

  // If search is cleared, just reload with normal filters
  if (!query || query.length === 0) {
    page.value = 1
    await getFilteredData(filters.value, filterValues.value)
    return
  }

  searchLoading.value = true

  // Build a search payload similar to Sett.vue but for education facilities
  const formData: any = {}
  formData.limit = pSize.value
  formData.page = page.value
  formData.curUser = 1
  formData.model = educationFacilityModel
  formData.searchField = 'name'
  formData.searchKeyword = query
  formData.filters = filters.value || []
  formData.filterValues = filterValues.value || []
  formData.associated_multiple_models = ['settlement', 'county', 'subcounty', 'ward']

  try {
    const res: any = await searchByKeyWord(formData)
    console.log('Education search result:', res)
    tableDataList.value = res.data || []
    const totalCount = res.total !== undefined
      ? res.total
      : (res.Total !== undefined ? res.Total : (res.data ? res.data.length : 0))
    total.value = totalCount
  } finally {
    searchLoading.value = false
  }
}




// We no longer use subcounty/ward filters in this view; settlement filter replaces them.
const filterByCounty = async (county_id: any) => {

  if (county_id) {
    selectedCounty.value = county_id
    // Refresh settlements list based on selected county
    await getSettlementNames()
  }

  // Clear settlement selection when county changes
  value7.value = null
  selectedSettlement.value = []

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


// Settlement-level filter (replaces subcounty/ward filters)
const filterBySettlement = async (settlement_ids: any) => {

  if (settlement_ids) {
    selectedSettlement.value = settlement_ids
  }

  // Reset pagination when filters change
  page.value = 1
  currentPage.value = 1

  if (search_string.value) {
    getFilteredBySearchData(search_string.value)
  } else {
    const selectOption = 'settlement_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    const index = filters.value.indexOf(selectOption)

    // clear previously selected
    if (filterValues.value[index]) {
      filterValues.value.splice(index, 1)
    }

    if (!filterValues.value.includes(selectedSettlement.value) && selectedSettlement.value.length > 0) {
      filterValues.value.splice(index, 0, selectedSettlement.value)
    }

    // expunge the filter if the filter values are null
    if (selectedSettlement.value.length === 0) {
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

  // Always re-query; getFilteredData uses search_string internally
  await getFilteredBySearchData()
}



const AddFacility = (data?: TableSlotDefault) => {
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
    name: 'AddFacility',
    query: queryParams
  })
}

const handleAddFacility = (row: any) => {
  AddFacility(row)
}

// Initialize Google Maps in drawer
// Accepts either a settlement row or a school (education_facility) row.
// If a school row is passed, we derive the settlementId from school.settlement_id
// and remember the current school id for special highlighting.
const initializeMapDrawer = async (item: any) => {
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

    // Determine settlement id:
    // - If a school row is passed, use item.settlement_id
    // - Otherwise, fall back to item.id (for direct settlement rows)
    const settlementId = item?.settlement_id || item?.id

    // Track current school (if provided) so we can highlight it on the map
    const currentSchoolId = item?.settlement_id ? item.id : null
    mapDrawerActiveSchool.value = currentSchoolId ? item : null
    mapDrawerActiveSchoolId.value = currentSchoolId ? Number(currentSchoolId) : null
    activeSchoolHasGeometry.value = false
    isPlacingSchoolMarker.value = false

    // Get settlement geometry
    const geoForm: any = {
      model: 'settlement',
      id: settlementId
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
            clickable: false, // Allow map click events for marker placement
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
      await loadEducationFacilitiesOnMap(settlementId, currentSchoolId)
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
// Optionally highlight a "current" school by id with a colored icon; others are gray
const loadEducationFacilitiesOnMap = async (settlementId: number, currentSchoolId: number | null = null) => {
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
    
    // Apply county restriction if user is county-restricted
    if (isCountyRestricted.value && userCountyId.value) {
      formData.columnFilterField = 'county_id'
      formData.selectedParents = userCountyId.value
      formData.filtredGeoIds = [userCountyId.value]
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
    const renderedSchoolIds = new Set<number | string>()
    
    if (features.length === 0) {
      ElMessage.info('No education facilities found with geometry for this settlement.')
      educationFacilitiesGeo.value = null
      return
    }
    
    const getPointCoords = (geometry: any): [number, number] | null => {
      if (!geometry) return null
      if (geometry.type === 'Point' && Array.isArray(geometry.coordinates) && geometry.coordinates.length >= 2) {
        return [Number(geometry.coordinates[0]), Number(geometry.coordinates[1])]
      }
      if (geometry.type === 'MultiPoint' && Array.isArray(geometry.coordinates) && geometry.coordinates[0]?.length >= 2) {
        return [Number(geometry.coordinates[0][0]), Number(geometry.coordinates[0][1])]
      }
      return null
    }

    const addSchoolMarker = (lat: number, lng: number, props: any, category: string) => {
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
      try {
        const isCurrentSchool = !!currentSchoolId && Number(props?.id) === Number(currentSchoolId)
        if (isCurrentSchool) {
          activeSchoolHasGeometry.value = true
        }

        const icon = {
          url: 'icons/school.png',
          scaledSize: new window.google.maps.Size(30, 30),
          anchor: new window.google.maps.Point(15, 15)
        }

          const marker = new window.google.maps.Marker({
            position: { lat, lng },
            map: googleMap.value,
          title: props?.name || 'Education Facility',
          icon,
          draggable: isCurrentSchool,
          opacity: isCurrentSchool ? 1 : 0.2,
          zIndex: isCurrentSchool ? 600 : 500
        })

        if (isCurrentSchool) {
          marker.addListener('dragend', (event: any) => {
            const newPos = event.latLng?.toJSON?.() || { lat, lng }
            const updatedProps = {
              ...props,
              latitude: newPos.lat,
              longitude: newPos.lng,
              geom: {
                type: 'Point',
                coordinates: [newPos.lng, newPos.lat]
              }
            }
            facilityMarkerDataMap.value.set(marker, updatedProps)
            console.log('Updated school marker position:', updatedProps)
            openFacilityForm(updatedProps)
          })
        }

        const categoryLabel = category
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${props?.name || 'Education Facility'}</h3>
                <p style="margin: 0 0 5px 0; font-size: 12px;"><strong>Category:</strong> ${categoryLabel}</p>
                ${props?.ownership_type ? `<p style="margin: 5px 0 0 0; font-size: 12px;"><strong>Ownership:</strong> ${props.ownership_type}</p>` : ''}
                ${props?.registration_status ? `<p style="margin: 5px 0 0 0; font-size: 12px;"><strong>Status:</strong> ${props.registration_status}</p>` : ''}
              </div>
            `
          })

        facilityMarkerDataMap.value.set(marker, props)
          marker.addListener('click', () => {
          openFacilityForm(props)
          })
          educationFacilityMarkers.value.push(marker)
        } catch (markerError) {
        console.error('Error creating marker:', markerError, props)
      }
    }

    // Process features from geo endpoint
    features.forEach((feature: any) => {
      if (!feature.geometry) return
      const coords = getPointCoords(feature.geometry)
      if (!coords) return

      const [lng, lat] = coords
      let category = (feature.properties?.category || feature.properties?.education_category || 'other').toLowerCase().trim()
      if (!category || category === 'n/a' || category === 'na') {
        category = 'other'
      }
      if (!presentFacilityCategories.includes(category)) {
        presentFacilityCategories.push(category)
      }
      if (feature.properties?.id !== undefined && feature.properties?.id !== null) {
        renderedSchoolIds.add(feature.properties.id)
      }
      addSchoolMarker(lat, lng, feature.properties || {}, category)
    })

    // Fallback for facilities missing in geo endpoint response: read from facility.geom
    facilities.forEach((facility: any) => {
      if (renderedSchoolIds.has(facility?.id)) return
      const coords = getPointCoords(facility?.geom)
      if (!coords) return
      const [lng, lat] = coords
      let category = (facility?.category || facility?.education_category || 'other').toLowerCase().trim()
      if (!category || category === 'n/a' || category === 'na') {
        category = 'other'
      }
      if (!presentFacilityCategories.includes(category)) {
        presentFacilityCategories.push(category)
      }
      addSchoolMarker(lat, lng, facility, category)
      renderedSchoolIds.add(facility?.id)
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

const clearMapPlacementListener = () => {
  if (mapPlacementClickListener.value && window.google?.maps?.event) {
    window.google.maps.event.removeListener(mapPlacementClickListener.value)
  }
  mapPlacementClickListener.value = null
}

const startPlacingSchoolMarker = () => {
  if (!googleMap.value || !mapDrawerActiveSchool.value || !mapDrawerActiveSchoolId.value) {
    ElMessage.warning('Select a school first before adding a marker')
    return
  }

  clearMapPlacementListener()
  isPlacingSchoolMarker.value = true
  ElMessage.info('Click on the map to place the school marker')

  mapPlacementClickListener.value = googleMap.value.addListener('click', (event: any) => {
    const point = event?.latLng?.toJSON?.()
    if (!point) return

    const icon = {
      url: 'icons/school.png',
      scaledSize: new window.google.maps.Size(30, 30),
      anchor: new window.google.maps.Point(15, 15)
    }

    if (mapPlacementMarker.value) {
      mapPlacementMarker.value.setPosition(point)
    } else {
      mapPlacementMarker.value = new window.google.maps.Marker({
        position: point,
        map: googleMap.value,
        title: mapDrawerActiveSchool.value?.name || 'Education Facility',
        icon,
        draggable: true,
        opacity: 1,
        zIndex: 700
      })
    }

    const updatedProps = {
      ...mapDrawerActiveSchool.value,
      latitude: point.lat,
      longitude: point.lng,
      geom: {
        type: 'Point',
        coordinates: [point.lng, point.lat]
      }
    }

    activeSchoolHasGeometry.value = true
    isPlacingSchoolMarker.value = false
    clearMapPlacementListener()
    openFacilityForm(updatedProps)
  })
}

// Open facility form drawer for editing
const openFacilityForm = (facilityData: any) => {
  isEditMode.value = true
  editingFacilityId.value = facilityData.id || null
  
  // Populate form with facility data
  facilityForm.name = facilityData.name || ''
  facilityForm.registration_number = facilityData.registration_number || ''
  facilityForm.settlement_id = facilityData.settlement_id || mapDrawerSettlement.value?.id || ''
  
  // Enforce county restriction when editing
  if (isCountyRestricted.value && userCountyId.value) {
    facilityForm.county_id = userCountyId.value
  } else {
    facilityForm.county_id = facilityData.county_id || mapDrawerSettlement.value?.county_id || ''
  }
  
  // Enforce settlement restriction when editing
  if (userSettlementId.value && !isSuperAdmin.value && !hasNationalAccess.value) {
    facilityForm.settlement_id = userSettlementId.value
    if (userCountyId.value) {
      facilityForm.county_id = userCountyId.value
    }
  }
  
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
  // Geometry: use geom from facility data if present (including updated position from draggable marker)
  facilityForm.geom = facilityData.geom || null
  
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
        
        // Enforce county restriction for non-admin users
        if (isCountyRestricted.value && userCountyId.value) {
          if (formData.county_id && formData.county_id !== userCountyId.value) {
            ElMessage.error('You can only create facilities in your assigned county')
            return
          }
          // Force county_id to user's county
          formData.county_id = userCountyId.value
        }
        
        // Enforce settlement restriction for settlement-level users
        if (userSettlementId.value && !isSuperAdmin.value && !hasNationalAccess.value) {
          if (formData.settlement_id && formData.settlement_id !== userSettlementId.value) {
            ElMessage.error('You can only create facilities in your assigned settlement')
            return
          }
          // Force settlement_id to user's settlement
          formData.settlement_id = userSettlementId.value
          // Also ensure county matches
          if (userCountyId.value) {
            formData.county_id = userCountyId.value
          }
        }
        
        // Convert education_category array to comma-separated string
        if (Array.isArray(formData.education_category)) {
          formData.education_category = formData.education_category.join(',')
        } else if (formData.education_category && typeof formData.education_category === 'object') {
          formData.education_category = Object.values(formData.education_category).join(',')
        } else if (!formData.education_category) {
          formData.education_category = ''
        }
        
        if (isEditMode.value && editingFacilityId.value) {
          formData.id = editingFacilityId.value
          const res = await updateOneRecord(formData)
          if (res.status === 'success') {
            ElMessage.success('Education facility updated successfully')
            // After update, reset pagination so the updated record (usually sorted to top) is visible
            page.value = 1
            currentPage.value = 1
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
            // After create, reset pagination so the new record is visible
            page.value = 1
            currentPage.value = 1
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
  clearMapPlacementListener()
  isPlacingSchoolMarker.value = false
  activeSchoolHasGeometry.value = false
  mapDrawerActiveSchool.value = null
  mapDrawerActiveSchoolId.value = null
  if (mapPlacementMarker.value) {
    mapPlacementMarker.value.setMap(null)
    mapPlacementMarker.value = null
  }
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

const editFacility = async (data: TableSlotDefault) => {
  try {
    // Build filters array
    const facilityFilters: string[] = ['id']
    const facilityFilterValues: any[] = [[data.id]]
    
    // Apply county restriction if user is county-restricted
    if (isCountyRestricted.value && userCountyId.value) {
      facilityFilters.push('county_id')
      facilityFilterValues.push([userCountyId.value])
    }
    
    // Fetch full facility data with all associations
    const formData = {
      limit: 1,
      page: 1,
      curUser: 1,
      model: educationFacilityModel,
      searchField: 'id',
      searchKeyword: data.id.toString(),
      filters: facilityFilters,
      filterValues: facilityFilterValues,
      associated_multiple_models: ['settlement', 'county', 'subcounty', 'ward', 'users']
    }
    
    try {
      const res = await getSettlementListByCounty(formData)
      const facilityData = res?.data?.[0]
      
      if (facilityData) {
        openFacilityForm(facilityData)
      } else {
        // Fallback to using data from table if fetch fails
        openFacilityForm(data)
      }
    } catch (error) {
      console.error('Error fetching facility data:', error)
      // Fallback to using data from table
      openFacilityForm(data)
    }
  } catch (error) {
    console.error('Error opening facility form:', error)
    ElMessage.error('Failed to open facility form')
  }
}


// No segmented control anymore; keep this noop computed for backwards compatibility in template if needed.
const filteredSegments = computed(() => []);



</script>

<template>


  <el-card>

    <div v-if="dynamicComponent">
      <upload-component :is="dynamicComponent" v-bind="componentProps" />
    </div>


    <el-row :gutter="10" style="margin-bottom: 10px;">
      <el-col :xs="24" :sm="24" :md="4" :lg="2" class="max-w-200px">
        <div class="max-w-200px" style="margin-bottom: 8px;">
          <el-button
            type="primary"
            plain
            :icon="Back"
            @click="goBack"
            style="margin-right: 10px; width: 100%;"
          >
            Back
          </el-button>
        </div>
      </el-col>

      <el-col :xs="24" :sm="24" :md="8" :lg="5" style="margin-bottom: 8px;">
        <el-select
          size="default"
          v-model="value4"
          :onChange="filterByCounty"
          :onClear="handleClear"
          multiple
          clearable
          filterable
          collapse-tags
          placeholder="By County"
          style="margin-right: 5px;"
          :disabled="isCountyRestricted"
        >
          <el-option
            v-for="item in countiesOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-col>

      <!-- Settlement filter replaces subcounty/ward filters -->
      <el-col :xs="24" :sm="24" :md="8" :lg="4" style="margin-bottom: 8px;">
        <el-select
          size="default"
          v-model="value7"
          :onChange="filterBySettlement"
          :disabled="!selectedCounty || !selectedCounty.length"
          multiple
          clearable
          filterable
          collapse-tags
          placeholder="By Settlement"
          style="margin-right: 5px;"
        >
          <el-option
            v-for="item in settlementOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-col>

      <el-col :xs="24" :sm="24" :md="8" :lg="5" style="margin-bottom: 8px;">
        <el-input
          v-model="search_string"
          clearable
          @clear="handleClear"
          placeholder="Search by name (or part of it).."
          @change="searchByNewName"
          class="input-with-select"
          style="margin-right: 5px;"
        >
          <template #append>
            <el-button
              v-loading="searchLoading"
              :icon="Search"
              @click="searchByNewName"
            />
          </template>
        </el-input>
      </el-col>



      <el-col :xs="24" :sm="24" :md="12" :lg="4" style="margin-bottom: 8px;">
        <div
          style="display: flex; align-items: center; gap: 10px; justify-content: flex-end; width: 100%;"
        >
          <!-- Desktop / tablet: show separate buttons -->
          <template v-if="!isMobile">
          <el-tooltip content="Add Facility" placement="top">
            <PermissionWrapper :permissions="'education_facility:create'">
              <el-button @click="AddFacility" type="primary" :icon="Plus" />
            </PermissionWrapper>
          </el-tooltip>

          <el-tooltip content="Clear" placement="top">
              <el-button @click="handleClear" type="primary" :icon="Filter" />
          </el-tooltip>

          <DownloadCustom
              v-if="showEditButtons"
              :data="tableDataList"
              :model="educationFacilityModel"
              :associated_models="['settlement', 'county', 'subcounty', 'ward']"
                      :total="total"
                      :filters="filters"
                      :filter-values="filterValues"
/>
          </template>

          <!-- Mobile: collapse actions into dropdown + compact download button -->
          <template v-else>
            <el-dropdown trigger="click">
              <el-button type="primary">
                Actions
                <el-icon style="margin-left: 4px;">
                  <ArrowDown />
                </el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="AddFacility">
                    <el-icon><Plus /></el-icon>
                    <span style="margin-left: 8px;">Add Facility</span>
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleClear">
                    <el-icon><Filter /></el-icon>
                    <span style="margin-left: 8px;">Clear Filters</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

            <DownloadCustom
              v-if="showEditButtons"
              :data="tableDataList"
              :model="educationFacilityModel"
              :associated_models="['settlement', 'county', 'subcounty', 'ward']"
                      :total="total"
                      :filters="filters"
                      :filter-values="filterValues"
/>
          </template>
        </div>
      </el-col>



    </el-row>




    <!-- Legacy segmented view (Approved/New/Rejected) is no longer needed for school-centric UI -->
    <div v-if="false" class="custom-style">
      <el-segmented v-model="activeSegment" :options="filteredSegments" block :onChange="onSegmentClick">
        <template #default="{ item }">
          <div class="flex flex-col items-center gap-2 p-2">
            <el-icon size="18">
              <component :is="item.icon" />
            </el-icon>
            <div class="segment-label">
              {{ item.label }} ({{ item.displayCount }})
            </div>
          </div>
        </template>
      </el-segmented>
    </div>

    <div v-if="false">
      <!-- <div class="table-meta" v-if="tableDataList && tableDataList.length">
        Showing {{ tableDataList.length }} of {{ total }} settlements with approved education facilities
      </div> -->
      <el-table :data="tableDataList" style="width: 100%; margin-top: 10px;" border @expand-change="handleExpand">
        <el-table-column type="expand">
          <template #default="props">
            <div style="padding: 20px;">
              <h3>Education Facilities in {{ props.row.name }}</h3>
              <p class="settlement-context">
                {{ props.row.ward?.name || 'N/A' }} ward,
                {{ props.row.subcounty?.name || 'N/A' }} subcounty,
                {{ props.row.county?.name || 'N/A' }} County
              </p>
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
        <el-empty description="No settlements with approved education facilities found" />
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
        class="mt-4 facility-pagination" />

    </div>


    <div v-if="false">
      <div class="table-meta" v-if="tableDataListNew && tableDataListNew.length">
        Showing {{ tableDataListNew.length }} of {{ totalNew }} settlements with new education facilities
      </div>
      <el-table :data="tableDataListNew" style="width: 100%; margin-top: 10px;" border @expand-change="handleExpand">
        <el-table-column type="expand">
          <template #default="props">
            <div style="padding: 20px;">
              <h3>Education Facilities in {{ props.row.name }}</h3>
              <p class="settlement-context">
                {{ props.row.ward?.name || 'N/A' }} ward,
                {{ props.row.subcounty?.name || 'N/A' }} subcounty,
                {{ props.row.county?.name || 'N/A' }} County
              </p>
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
              :item="row"
              :buttons="action_buttons"
              @view-profile="viewProfile"
              @view-on-map="flyTo"
              @delete="DeleteFacility"
            />
          </template>
        </el-table-column>

      </el-table>

      <div v-if="!tableDataListNew || tableDataListNew.length === 0" class="no-data-message">
        <el-empty description="No settlements with new education facilities found" />
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
      <div class="table-meta" v-if="tableDataListRejected && tableDataListRejected.length">
        Showing {{ tableDataListRejected.length }} of {{ totalRejected }} settlements with rejected education facilities
      </div>
      <el-table
:data="tableDataListRejected" style="width: 100%; margin-top: 10px;" border
        @expand-change="handleExpand">
        <el-table-column type="expand">
          <template #default="props">
            <div style="padding: 20px;">
              <h3>Education Facilities in {{ props.row.name }}</h3>
              <p class="settlement-context">
                {{ props.row.ward?.name || 'N/A' }} ward,
                {{ props.row.subcounty?.name || 'N/A' }} subcounty,
                {{ props.row.county?.name || 'N/A' }} County
              </p>
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
              :item="row"
              :buttons="action_buttons"
              @view-profile="viewProfile"
              @view-on-map="flyTo"
            />
          </template>
        </el-table-column>



      </el-table>

      <div v-if="!tableDataListRejected || tableDataListRejected.length === 0" class="no-data-message">
        <el-empty description="No settlements with rejected education facilities found" />
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

    <!-- Simple school-centric table -->
    <!-- <div class="table-meta" v-if="tableDataList && tableDataList.length">
      Showing {{ tableDataList.length }} schools (page) of {{ total }}
    </div> -->

    <el-table
      :data="tableDataList"
      style="width: 100%; margin-top: 10px;"
      border
      :size="isMobile ? 'small' : 'default'"
    >
      <!-- Name -->
      <el-table-column
        label="School Name"
        prop="name"
        sortable
        :min-width="isMobile ? 160 : 220"
        show-overflow-tooltip
      />

      <!-- Location -->
      <el-table-column :label="isMobile ? 'Location' : 'Location (Settlement / Ward / Subcounty / County)'" :min-width="isMobile ? 220 : 260">
        <template #default="scope">
          {{ scope.row.settlement?.name || 'N/A' }},
          {{ scope.row.ward?.name || 'N/A' }} ward,
          {{ scope.row.subcounty?.name || 'N/A' }} subcounty,
          {{ scope.row.county?.name || 'N/A' }} County
        </template>
      </el-table-column>

      <!-- Category -->
      <el-table-column
        label="Category"
        prop="education_category"
        :min-width="isMobile ? 110 : 140"
        show-overflow-tooltip
      />

      <!-- Enrolment (total + teachers) -->
      <el-table-column label="Enrolment" min-width="200">
        <template #default="scope">
          <div>
            <div>
              <strong>Total learners:</strong>
              {{
                (scope.row.enrolled_boys_count || 0) +
                (scope.row.enrolled_girls_count || 0)
              }}
            </div>
            <div style="margin-top: 2px;">
              <strong>Teachers:</strong>
              {{
                (scope.row.male_teachers_count || 0) +
                (scope.row.female_teachers_count || 0)
              }}
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column
        label="Actions"
        :min-width="isMobile ? 72 : 200"
        align="center"
        fixed="right"
      >
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
      <el-empty description="No education facilities found" />
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
      <div
        v-if="mapDrawerActiveSchoolId && !activeSchoolHasGeometry"
        class="map-action-button"
      >
        <el-button type="primary" @click="startPlacingSchoolMarker">
          {{ isPlacingSchoolMarker ? 'Click map to place marker...' : 'Add Marker' }}
        </el-button>
      </div>
      
      <!-- Legend -->
      <div v-if="presentFacilityCategories.length > 0" class="map-legend">
        <h4 class="legend-title">Map Legend</h4>
          <div class="legend-item">
          <img src="/icons/school.png" style="width:22px;height:22px;margin-right:10px;opacity:1;" />
          <span class="legend-label">Selected school</span>
          </div>
        <div class="legend-item">
          <img src="/icons/school.png" style="width:22px;height:22px;margin-right:10px;opacity:0.2;" />
          <span class="legend-label">Other schools</span>
        </div>
        <div class="legend-item">
          <div class="legend-line legend-line-dashed" style="background-color: transparent; border-bottom: 3px dashed #FF0000;"></div>
          <span class="legend-label">Settlement boundary</span>
        </div>
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

.map-action-button {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1001;
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

  .map-action-button {
    top: 10px;
    right: 10px;
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

.table-meta {
  font-size: 13px;
  color: #7a8088;
  margin: 8px 0 4px;
}

.settlement-context {
  font-size: 13px;
  color: #606266;
  margin: 4px 0 12px;
}
</style>