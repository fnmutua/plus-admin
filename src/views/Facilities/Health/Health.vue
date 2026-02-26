<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">

declare global {
  interface Window {
    google: any
  }
}

import { getSettlementListByCounty, DeleteRecord, updateOneRecord, getOneGeo, deleteDocument, getAllGeo, getfilteredGeo, CreateRecord, searchByKeyWord } from '@/api/settlements'
import { getCountyListApi, getListWithoutGeo } from '@/api/counties'
import { getSummarybyFieldFromMultipleIncludes } from '@/api/summary'
import {
  ElButton, ElSelect, ElDescriptions, ElDescriptionsItem, ElCol, ElRow, ElCard,
  ElOption, FormInstance, ElMessage, ElInput, 
  ElPagination, ElTooltip, ElTable, ElTableColumn, ElDialog, ElIcon,
  ElDivider, ElDropdown, ElDropdownItem, ElDropdownMenu, ElForm, ElFormItem, ElEmpty, ElDrawer,
  ElInputNumber} from 'element-plus'
import { computed, ref, reactive, nextTick, defineAsyncComponent } from 'vue'

import {
  Plus, Filter, Back, Search, ArrowDown,
  Check
} from '@element-plus/icons-vue'

import { useRouter, useRoute } from 'vue-router'

import { Loader } from '@googlemaps/js-api-loader'
import * as turf from '@turf/turf'

import { subcountyOptions, settlementOptionsV2, HCFTypeOptions } from './../common/index'

import UploadComponent from '@/views/Components/UploadComponent.vue'
import TableActions from '@/views/Components/TableActions.vue'
import DownloadCustom from '@/views/Components/DownloadCustom.vue'

import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import PermissionWrapper from '@/components/PermissionWrapper.vue'

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)

const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)

// Actions for each row
const action_buttons = ref<string[]>(['viewOnMap', 'delete'])

// Google Maps API Key
const googleMapsApiKey = 'AIzaSyCrzbOkfG52zkAxYPkMvvRMlxE9qHK4uDk'

// User location-based filtering
const isSuperAdmin = computed(() => {
  return userInfo?.roles?.some((role: any) => 
    role.name === 'super_admin' || role.name === 'root_admin'
  ) || false
})

const hasNationalAccess = computed(() => {
  return userInfo?.roles?.some((role: any) => 
    role.user_roles?.location_level === 'national'
  ) || false
})

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

const isCountyRestricted = computed(() => {
  return !isSuperAdmin.value && !hasNationalAccess.value && !!userCountyId.value
})

const isMobile = computed(() => appStore.getMobile)

console.log('User location info:', {
  isSuperAdmin: isSuperAdmin.value,
  hasNationalAccess: hasNationalAccess.value,
  userCountyId: userCountyId.value,
  userSettlementId: userSettlementId.value,
  isCountyRestricted: isCountyRestricted.value
})

const tableDataListNew = ref([])
const tableDataListRejected = ref([])
const totalRejected = ref(0)
const totalNew = ref(0)
const total = ref(0)

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

// Global search and location filters
const search_string = ref<string>('')
const selectedCounty = ref<any[]>([])
const selectedSettlement = ref<any[]>([])

const filters = ref<string[]>([])
const filterValues = ref<any[][]>([])

const associated_Model = ''
const associated_multiple_models = ['settlement', 'users', 'county', 'subcounty', 'ward']

const model = 'settlement'
const healthFacilityModel = 'health_facility'

// Store health facilities per settlement (used for map loading)
const settlementHealthFacilities = ref<Record<number, any[]>>({})
const loadingFacilities = ref<Record<number, boolean>>({})

// Drawer state for map
const mapDrawerVisible = ref(false)
const mapDrawerSettlement = ref<any>(null)
const mapDrawerContainer = ref<HTMLElement | null>(null)
const googleMap = ref<any>(null)
const settlementPolygon = ref<any>(null)
const healthFacilityMarkers = ref<any[]>([])
const settlementGeo = ref<any>(null)
const healthFacilitiesGeo = ref<any>(null)
const facilityMarkerDataMap = ref<Map<any, any>>(new Map())
const mapDrawerActiveFacility = ref<any>(null)
const mapDrawerActiveFacilityId = ref<number | null>(null)
const activeFacilityHasGeometry = ref(false)
const isPlacingFacilityMarker = ref(false)
const mapPlacementMarker = ref<any>(null)
const mapPlacementClickListener = ref<any>(null)

// Facility form drawer state
const facilityDrawerVisible = ref(false)
const facilityFormRef = ref<FormInstance>()
const editingFacilityId = ref<number | null>(null)
const isEditMode = ref(false)

// Health facility form fields
const facilityForm = reactive({
  name: '',
  settlement_id: '',
  county_id: '',
  subcounty_id: '',
  ward_id: '',
  level: '',          // facility type (clinic, dispensary, hospital, etc.)
  reg_status: '',
  ownership_type: '',
  owner: '',
  catchment: '',
  services: [],
  common_ailments: [],
  inpatient: '',
  patients_per_day: null,
  number_beds: null,
  occupancy: null,
  number_doctors: null,
  number_clinical_officers: null,
  number_pharm: null,
  number_nurses: null,
  referrals: '',
  challenges: '',
  parcel_tenure: '',
  respondent_name: '',
  respondent_phone: '',
  geom: null
})

const facilityFormRules = reactive({
  name: [{ required: true, message: 'Facility name is required', trigger: 'blur' }],
  settlement_id: [{ required: true, message: 'Settlement is required', trigger: 'blur' }]
})

// Form option lists (health-specific)
const catchmentOptions = [
  { label: 'Within this settlement', value: 'within_settlement' },
  { label: 'Outside this settlement', value: 'outside_settlement' },
  { label: 'Within and Outside this settlement', value: 'within_and_outside_settlement' }
]

const servicesOptions = [
  { label: 'Out-patient', value: 'Out-patient' },
  { label: 'In-patient', value: 'In-patient' },
  { label: 'Pharmacy', value: 'Pharmacy' },
  { label: 'Laboratory', value: 'Laboratory' },
  { label: 'Other', value: 'Other' }
]

const commonAilmentsOptions = [
  { label: 'Malaria', value: 'Malaria' },
  { label: 'TB', value: 'TB' },
  { label: 'Diarrhoea', value: 'Diarrhoea' },
  { label: 'Pneumonia', value: 'Pneumonia' },
  { label: 'STD', value: 'STD' },
  { label: 'Common cold', value: 'Common cold' },
  { label: 'Amoeba/Typhoid', value: 'Amoeba/Typhoid' },
  { label: 'Hypertension', value: 'Hypertension' },
  { label: 'Diabetes', value: 'Diabetes' },
  { label: 'Other', value: 'Other' }
]

const ownershipOptions = [
  { label: 'Public', value: 'Public' },
  { label: 'Private', value: 'Private' },
  { label: 'Communal', value: 'Community' },
  { label: 'Mission', value: 'Mission' },
  { label: 'Other', value: 'Other' }
]

const regStatusOptions = [
  { label: 'Registered', value: 'Registered' },
  { label: 'Awaiting registration', value: 'Awaiting registration' },
  { label: 'Not registered', value: 'Not registered' }
]

const parcelTenureOptions = [
  { label: 'Public', value: 'Public' },
  { label: 'Private', value: 'Private' },
  { label: 'Riparian', value: 'Riparian' },
  { label: 'Unknown', value: 'Unknown' }
]

const yesNoOptions = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' }
]

// Track categories for map legend
const presentFacilityCategories = reactive<string[]>([])

const currentRoute = useRoute()

const mapHeight = '450px'
const countries = 'ke'
const facilityGeo = ref([])

const subcountyfilteredOptions = ref([])
const settlementfilteredOptions = ref([])

const handleSelectCounty = async (county_id: any) => {
  showSubcountyOpts.value = true
  var subset = []
  for (let i = 0; i < subcountyOptions.value.length; i++) {
    if (subcountyOptions.value[i].county_id == county_id) {
      subset.push(subcountyOptions.value[i])
    }
  }
  subcountyfilteredOptions.value = subset

  var subset_settlements = []
  for (let i = 0; i < settlementOptionsV2.value.length; i++) {
    if (settlementOptionsV2.value[i].county_id == county_id) {
      subset_settlements.push(settlementOptionsV2.value[i])
    }
  }
  settlementfilteredOptions.value = subset_settlements
}

const handleClear = async () => {
  value4.value = null
  value7.value = null
  search_string.value = ''
  selectedCounty.value = []
  selectedSettlement.value = []

  pSize.value = 10
  pageSize.value = 10
  page.value = 1
  currentPage.value = 1
  filters.value = filters.value.slice(0, 1)
  filterValues.value = filterValues.value.slice(0, 1)
  getFilteredData(filters.value, filterValues.value)
}

const onPageChange = async (selPage: any) => {
  page.value = selPage
  currentPage.value = selPage
  getFilteredData(filters.value, filterValues.value)
}

const onPageSizeChange = async (size: any) => {
  pSize.value = size
  pageSize.value = size
  page.value = 1
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
        res[extraKey + key] = obj[key]
      } else {
        flattenJSON(obj[key], res, `${extraKey}${key}.`)
      }
    }
  }
  return res
}

// Normalize backend payload to a flat list of health facilities.
// Some endpoints may return settlement rows with nested health_facilities.
const normalizeHealthFacilityRows = (rows: any[] = []) => {
  const normalized: any[] = []

  rows.forEach((row: any) => {
    const nestedFacilities = row?.health_facilities
    if (Array.isArray(nestedFacilities) && nestedFacilities.length > 0) {
      nestedFacilities.forEach((facility: any) => {
        normalized.push({
          ...facility,
          settlement_id: facility?.settlement_id || row?.id || null,
          settlement: facility?.settlement || row?.settlement || { id: row?.id, name: row?.name },
          county: facility?.county || row?.county,
          subcounty: facility?.subcounty || row?.subcounty,
          ward: facility?.ward || row?.ward
        })
      })
      return
    }

    normalized.push(row)
  })

  return normalized.filter((row: any) => {
    if (!row || typeof row !== 'object') return false
    const hasSettlementLink = !!(row.settlement_id || row.settlement?.id)
    const hasHealthHints = (
      'level' in row ||
      'facility_type' in row ||
      'reg_status' in row ||
      'number_beds' in row ||
      'services' in row ||
      'common_ailments' in row ||
      'inpatient' in row ||
      'patients_per_day' in row ||
      'number_doctors' in row ||
      'number_nurses' in row
    )
    return hasSettlementLink || hasHealthHints
  })
}

// Load health facilities for a settlement (for map)
const loadHealthFacilitiesForSettlement = async (settlementId: number) => {
  if (settlementHealthFacilities.value[settlementId]) {
    return settlementHealthFacilities.value[settlementId]
  }
  loadingFacilities.value[settlementId] = true
  try {
    const facilityFilters: string[] = ['settlement_id']
    const facilityFilterValues: any[] = [[settlementId]]
    if (isCountyRestricted.value && userCountyId.value) {
      facilityFilters.push('county_id')
      facilityFilterValues.push([userCountyId.value])
    }
    const formData = {
      limit: 1000,
      page: 1,
      curUser: 1,
      model: healthFacilityModel,
      searchField: 'name',
      searchKeyword: '',
      filters: facilityFilters,
      filterValues: facilityFilterValues,
      associated_multiple_models: ['settlement', 'county', 'subcounty', 'ward', 'users']
    }
    const res = await getSettlementListByCounty(formData)
    const facilities = normalizeHealthFacilityRows(res.data || [])
    settlementHealthFacilities.value[settlementId] = facilities
    return facilities
  } catch (error) {
    console.error('Error loading health facilities:', error)
    ElMessage.error('Failed to load health facilities')
    return []
  } finally {
    loadingFacilities.value[settlementId] = false
  }
}

const getFilteredData = async (_selFilters?: any, _selfilterValues?: any) => {
  const formData: any = {}
  formData.limit = pSize.value
  formData.page = page.value
  formData.curUser = 1
  formData.model = healthFacilityModel
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

  if (selectedCounty.value && selectedCounty.value.length) {
    filtersArr.push('county_id')
    filterValuesArr.push(selectedCounty.value)
  }
  if (selectedSettlement.value && selectedSettlement.value.length) {
    filtersArr.push('settlement_id')
    filterValuesArr.push(selectedSettlement.value)
  }

  const isApprovedIndex = filters.value.indexOf('isApproved')
  if (isApprovedIndex !== -1 && filterValues.value[isApprovedIndex]?.length) {
    filtersArr.push('isApproved')
    filterValuesArr.push(filterValues.value[isApprovedIndex])
  }

  formData.filters = filtersArr
  formData.filterValues = filterValuesArr
  formData.associated_multiple_models = ['settlement', 'county', 'subcounty', 'ward']

  const res = await getSettlementListByCounty(formData)

  console.log('After Query - Health facilities:', res)
  tableDataList.value = normalizeHealthFacilityRows(res.data || [])
  const totalCount = (res as any)?.total !== undefined
    ? (res as any).total
    : ((res as any)?.Total !== undefined ? (res as any).Total : tableDataList.value.length)
  total.value = totalCount

  currentPage.value = page.value
  pageSize.value = pSize.value
}

const statuses = ref([])
const getSummaryStatus = async () => {
  const formData: any = {}
  formData.model = healthFacilityModel
  formData.summaryFunction = 'count'
  formData.summaryField = 'isApproved'
  formData.groupFields = ['isApproved']

  if (isCountyRestricted.value && userCountyId.value) {
    formData.filters = ['county_id']
    formData.filterValues = [[userCountyId.value]]
  } else if (userSettlementId.value && !isSuperAdmin.value && !hasNationalAccess.value) {
    formData.filters = ['settlement_id']
    formData.filterValues = [[userSettlementId.value]]
  }

  const response = await getSummarybyFieldFromMultipleIncludes(formData)
  statuses.value = response.Total.reduce((acc, item) => {
    acc[item.isApproved] = parseInt(item.count, 10)
    return acc
  }, {})

  badgeCountApproved.value = statuses.value.Approved !== undefined ? statuses.value.Approved : 0
  badgeCountNew.value = statuses.value.Pending !== undefined ? statuses.value.Pending : 0
  badgeCountRejected.value = statuses.value.Rejected !== undefined ? statuses.value.Rejected : 0
}
getSummaryStatus()

const getCountyNames = async () => {
  await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1,
      model: 'county',
      searchField: '',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    var ret = response.data
    loading.value = false
    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var countyOpt: any = {}
      countyOpt.value = arrayItem.id
      countyOpt.label = arrayItem.name
      countiesOptions.value.push(countyOpt)
    })
  })
}

const getModelOptions = async () => {
  await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1,
      model: model,
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    var ret = response.data
    loading.value = false
    settlements.value = ret
    makeSettlementOptions(settlements)
  })
}

const getSettlementNames = async () => {
  if (!settlements.value || !settlements.value.length) {
    await getModelOptions()
  }
  let filteredList = settlements.value
  if (selectedCounty.value && (Array.isArray(selectedCounty.value) ? selectedCounty.value.length : true)) {
    const countyIds = Array.isArray(selectedCounty.value)
      ? selectedCounty.value
      : [selectedCounty.value]
    filteredList = settlements.value.filter((s: any) => countyIds.includes(s.county_id))
  }
  const wrapped = { value: filteredList }
  makeSettlementOptions(wrapped)
}

const makeSettlementOptions = (list) => {
  settlementOptions.value = []
  list.value.forEach(function (arrayItem: { id: string; type: string }) {
    var countyOpt: any = {}
    countyOpt.value = arrayItem.id
    countyOpt.label = arrayItem.name  
    settlementOptions.value.push(countyOpt)
  })
}

const getGeo = async () => {
  const formData: any = {}
  formData.model = model
  const res = await getAllGeo(formData)
  if (res.data[0]?.json_build_object) {
    facilityGeo.value = res.data[0].json_build_object
  }
}

getCountyNames()
getModelOptions()

const initializeUserCountyFilter = async () => {
  await nextTick()
  if (isCountyRestricted.value && userCountyId.value) {
    value4.value = [userCountyId.value]
    await filterByCounty(userCountyId.value)
    await getSummaryStatus()
  } else if (userSettlementId.value && !isSuperAdmin.value && !hasNationalAccess.value) {
    await getSummaryStatus()
  }
}

setTimeout(() => {
  initializeUserCountyFilter()
}, 500)

getInterventionsAll()
getGeo()

const viewProfile = (data) => {
  push({
    path: '/facilities/health/details/:id',
    name: 'HealthFacilityDetails',
    params: { data: data.id, id: data.id }
  })
}

const flyTo = async (data) => {
  try {
    mapDrawerSettlement.value = data
    mapDrawerVisible.value = true
    await nextTick()
    await initializeMapDrawer(data)
  } catch (error) {
    console.error("Error opening map drawer:", error)
    ElMessage.error("Failed to open map. Please try again.")
  }
}

const dialogWidth = ref()
const actionColumnWidth = ref()
if (isMobile.value) {
  dialogWidth.value = "90%"
  actionColumnWidth.value = "75px"
  } else {
  dialogWidth.value = "25%"
  actionColumnWidth.value = "160px"
}

const currentRow = ref()
const addMoreDocuments = ref()

const DocTypes = ref([])
const getDocumentTypes = async () => {
  await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1,
      model: 'document_type',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    var ret = response.data
    const nestedData = ret.reduce((acc, cur) => {
      const group = cur.group
      if (!acc[group]) acc[group] = []
      acc[group].push(cur)
      return acc
    }, {})
    for (let property in nestedData) {
      let opts = nestedData[property]
      var doc: any = {}
      doc.label = property
      doc.options = []
      opts.forEach(function (arrayItem) {
        let opt: any = {}
        opt.value = arrayItem.id
        opt.label = arrayItem.type
        doc.options.push(opt)
      })
      DocTypes.value.push(doc)
    }
  })
}
getDocumentTypes()

const DeleteFacility = async (data) => {
  try {
    const formData: any = {}
    formData.id = data.id
    // Table rows in this module are health facilities; never fallback to settlement delete.
    formData.model = healthFacilityModel

    await DeleteRecord(formData)

    if (data.documents && data.documents.length > 0) {
      formData.filesToDelete = data.documents
      await deleteDocument(formData)
    }

    await getFilteredData(filters.value, filterValues.value)
    ElMessage.success('Record deleted successfully')
  } catch (error) {
    console.error('Error deleting record:', error)
    ElMessage.error('Failed to delete record')
  }
}

const formheader = ref('Edit Facility')
const reviewWindowWidth = ref('50%')

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  id: '',
  name: '',
  settlement_id: '',
  county_id: '',
  subcounty_id: '',
  facility_type: '',
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
  showAddSaveButton.value = true
  showEditSaveButton.value = false
  ruleForm.name = null
  ruleForm.county_id = null
  formheader.value = 'Add Facility'
  AddDialogVisible.value = false
  showSubcountyOpts.value = false
}

const ShowReviewDialog = ref(false)
const RejectDialog = ref(false)
const facility_raw = ref({})

const approve = async () => {
  ruleForm.isApproved = 'Approved'
  ruleForm.reviewerId = userInfo.id
  ruleForm.model = healthFacilityModel
  await updateOneRecord(ruleForm).then(() => {})
  ShowReviewDialog.value = false
  getFilteredData(filters.value, filterValues.value)
}

const reject = async () => {
  RejectDialog.value = true
}

const rejectReason = ref('')
const confirmReject = async () => {
  ruleForm.reject_msg = rejectReason.value
  ruleForm.isApproved = 'Rejected'
  ruleForm.model = healthFacilityModel
  ruleForm.reviewerId = userInfo.id
  await updateOneRecord(ruleForm).then(() => {})
  RejectDialog.value = false
  ShowReviewDialog.value = false
  getFilteredData(filters.value, filterValues.value)
}

const showSubcountyOpts = ref(false)

const mfield = 'health_facility_id'
const ChildComponent = defineAsyncComponent(() => import('@/views/Components/UploadComponent.vue'))
const dynamicComponent = ref()
const componentProps = ref({
  message: 'Hello from parent',
  showDialog: addMoreDocuments,
  data: currentRow.value,
  umodel: model,
  field: mfield
})

const rowData = ref()
const documentComponent = defineAsyncComponent(() => import('@/views/Components/ListDocuments.vue'))
const dynamicDocumentComponent = ref()
const DocumentComponentProps = ref({
  message: 'documents',
  data: rowData.value,
  docmodel: model,
})

const handleExpand = async (row: any) => {
  await loadHealthFacilitiesForSettlement(row.id)
  dynamicDocumentComponent.value = null
  rowData.value = row
  DocumentComponentProps.value.data = row
  setTimeout(() => {
    dynamicDocumentComponent.value = documentComponent
  }, 100)
}

const router = useRouter()

const value4 = ref()
const value7 = ref()

const goBack = () => {
  if (router) {
    router.back()
  }
}

// Search
const searchLoading = ref(false)

const getFilteredBySearchData = async () => {
  const query = search_string.value?.trim()

  if (!query || query.length === 0) {
    page.value = 1
    await getFilteredData(filters.value, filterValues.value)
    return
  }

  searchLoading.value = true
  const formData: any = {}
  formData.limit = pSize.value
  formData.page = page.value
  formData.curUser = 1
  formData.model = healthFacilityModel
  formData.searchField = 'name'
  formData.searchKeyword = query
  formData.filters = filters.value || []
  formData.filterValues = filterValues.value || []
  formData.associated_multiple_models = ['settlement', 'county', 'subcounty', 'ward']

  try {
    const res: any = await searchByKeyWord(formData)
    console.log('Health facility search result:', res)
    tableDataList.value = normalizeHealthFacilityRows(res.data || [])
    const totalCount = res.total !== undefined
      ? res.total
      : (res.Total !== undefined ? res.Total : tableDataList.value.length)
    total.value = totalCount
  } finally {
    searchLoading.value = false
  }
}

const filterByCounty = async (county_id: any) => {
  if (county_id) {
    selectedCounty.value = county_id
    await getSettlementNames()
  }
  value7.value = null
  selectedSettlement.value = []
  page.value = 1
  currentPage.value = 1

  if (search_string.value) {
    getFilteredBySearchData()
  } else {
    var selectOption = 'county_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    var index = filters.value.indexOf(selectOption)
    if (filterValues.value[index]) {
      filterValues.value.splice(index, 1)
    }
    if (!filterValues.value.includes(selectedCounty.value) && selectedCounty.value.length > 0) {
      filterValues.value.splice(index, 0, selectedCounty.value)
    }
    if (selectedCounty.value.length === 0) {
      filters.value.splice(index, 1)
    }
    getFilteredData(filters.value, filterValues.value)
  }
}

const filterBySettlement = async (settlement_ids: any) => {
  if (settlement_ids) {
    selectedSettlement.value = settlement_ids
  }
  page.value = 1
  currentPage.value = 1

  if (search_string.value) {
    getFilteredBySearchData()
  } else {
    const selectOption = 'settlement_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    const index = filters.value.indexOf(selectOption)
    if (filterValues.value[index]) {
      filterValues.value.splice(index, 1)
    }
    if (!filterValues.value.includes(selectedSettlement.value) && selectedSettlement.value.length > 0) {
      filterValues.value.splice(index, 0, selectedSettlement.value)
    }
    if (selectedSettlement.value.length === 0) {
      filters.value.splice(index, 1)
  }
  getFilteredData(filters.value, filterValues.value)
  }
}

const searchByNewName = async () => {
  page.value = 1
  currentPage.value = 1
  await getFilteredBySearchData()
}

const AddFacility = (data?: any) => {
  const queryParams: any = {}
  if (data) {
    queryParams.county_id = data.county_id || data.county?.id || ''
    queryParams.settlement_id = data.id || ''
  } else if (isCountyRestricted.value && userCountyId.value) {
    queryParams.county_id = userCountyId.value
  } else if (userSettlementId.value && !isSuperAdmin.value && !hasNationalAccess.value) {
    queryParams.settlement_id = userSettlementId.value
    if (userCountyId.value) {
      queryParams.county_id = userCountyId.value
    }
  }
  push({ name: 'AddFacility', query: queryParams })
}

// â”€â”€â”€ Map drawer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const hasPointLikeGeometry = (geom: any) => {
  if (!geom || typeof geom !== 'object') return false
  if (geom.type === 'Point' && Array.isArray(geom.coordinates) && geom.coordinates.length >= 2) return true
  if (geom.type === 'MultiPoint' && Array.isArray(geom.coordinates) && geom.coordinates[0]?.length >= 2) return true
  return false
}

const initializeMapDrawer = async (item: any) => {
  if (!mapDrawerContainer.value) {
    await nextTick()
  }
  if (!mapDrawerContainer.value) {
    ElMessage.error("Map container not found")
    return
  }

  try {
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

    const settlementId = item?.settlement_id || item?.id
    // If opened from a facility row, settlement_id is present.
    const currentFacilityId = item?.settlement_id ? item.id : null
    mapDrawerActiveFacility.value = currentFacilityId ? item : null
    mapDrawerActiveFacilityId.value = currentFacilityId ? Number(currentFacilityId) : null
    activeFacilityHasGeometry.value = hasPointLikeGeometry(item?.geom)
    isPlacingFacilityMarker.value = false

    const geoForm: any = { model: 'settlement', id: settlementId }
    const res = await getOneGeo(geoForm)
    const geoData = res?.data?.[0]?.json_build_object
    const feats = geoData?.features
    
    if (!feats || (Array.isArray(feats) && feats.length === 0)) {
      ElMessage.warning("No boundary geometry found for this settlement. Showing map with facilities only.")
      settlementGeo.value = null
    } else {
      settlementGeo.value = geoData
    }

    let center = { lat: 1.137451, lng: 37.137343 }
    let zoom = 8

    if (settlementGeo.value?.features?.length > 0) {
      try {
        const bboxResult = turf.bbox(settlementGeo.value)
        center = {
          lat: (bboxResult[1] + bboxResult[3]) / 2,
          lng: (bboxResult[0] + bboxResult[2]) / 2
        }
        zoom = 13
      } catch (e) {
        console.warn('Error calculating bbox, using default center:', e)
      }
    }

    googleMap.value = new window.google.maps.Map(mapDrawerContainer.value, {
      center, zoom,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true
    })

    if (settlementGeo.value?.features?.length > 0) {
      const feat = settlementGeo.value.features[0]
      if (feat?.geometry && (feat.geometry.type === 'Polygon' || feat.geometry.type === 'MultiPolygon')) {
        try {
          const paths = feat.geometry.type === 'Polygon'
            ? feat.geometry.coordinates[0].map((coord: number[]) => ({ lat: coord[1], lng: coord[0] }))
            : feat.geometry.coordinates[0][0].map((coord: number[]) => ({ lat: coord[1], lng: coord[0] }))

          settlementPolygon.value = new window.google.maps.Polygon({
            paths, map: googleMap.value,
            strokeColor: '#FF0000', strokeOpacity: 0.6, strokeWeight: 2,
            fillColor: '#FF0000', fillOpacity: 0,
            clickable: false
          })

          const pathBounds = new window.google.maps.LatLngBounds()
          paths.forEach((p: any) => pathBounds.extend(p))
          googleMap.value.fitBounds(pathBounds)
        } catch (e) {
          console.error('Error drawing settlement boundary:', e)
        }
      }
    }

    const loadFacilitiesWhenReady = async () => {
      await loadHealthFacilitiesOnMap(settlementId, currentFacilityId)
    }
    googleMap.value.addListener('idle', loadFacilitiesWhenReady)
    setTimeout(loadFacilitiesWhenReady, 500)

  } catch (error) {
    console.error("Error initializing map:", error)
    ElMessage.error("Failed to initialize map. Please try again.")
  }
}

const loadHealthFacilitiesOnMap = async (settlementId: number, currentFacilityId: number | null = null) => {
  try {
    healthFacilityMarkers.value.forEach(marker => marker.setMap(null))
    healthFacilityMarkers.value = []
    presentFacilityCategories.length = 0

    if (!googleMap.value) {
      console.error('Google map not initialized')
      return
    }

    const facilities = await loadHealthFacilitiesForSettlement(settlementId)

    const formData: any = {
      model: healthFacilityModel,
      columnFilterField: 'settlement_id',
      selectedParents: settlementId,
      filtredGeoIds: [settlementId]
    }
    
    if (isCountyRestricted.value && userCountyId.value) {
      formData.columnFilterField = 'county_id'
      formData.selectedParents = userCountyId.value
      formData.filtredGeoIds = [userCountyId.value]
    }

    const res = await getfilteredGeo(formData)
    let geoJsonData = null
    
    if (res && res.data) {
      if (Array.isArray(res.data) && res.data.length > 0) {
        const firstItem = res.data[0]
        if (Array.isArray(firstItem) && firstItem.length > 0) {
          if (firstItem[0]?.json_build_object) geoJsonData = firstItem[0].json_build_object
        } else if (firstItem?.json_build_object) {
          geoJsonData = firstItem.json_build_object
        } else if (firstItem?.type === 'FeatureCollection') {
          geoJsonData = firstItem
        }
      }
    }

    if (!geoJsonData) {
      ElMessage.info('No health facilities with geometry data found for this settlement.')
      return
    }
    
    if (geoJsonData.features === null || (Array.isArray(geoJsonData.features) && geoJsonData.features.length === 0)) {
      ElMessage.info('No health facilities with geometry data found for this settlement.')
      healthFacilitiesGeo.value = null
      return
    }
    
    healthFacilitiesGeo.value = geoJsonData
    const features = geoJsonData.features || []
    const renderedFacilityIds = new Set<number | string>()
    
    if (features.length === 0) {
      ElMessage.info('No health facilities found with geometry for this settlement.')
      return
    }
    
    const addFacilityMarker = (lat: number, lng: number, props: any, category: string) => {
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
      try {
        const isCurrentFacility = !!currentFacilityId && Number(props?.id) === Number(currentFacilityId)
        if (isCurrentFacility) {
          activeFacilityHasGeometry.value = true
        }
        const icon = {
          url: 'icons/ambulance.png',
          scaledSize: new window.google.maps.Size(30, 30),
          anchor: new window.google.maps.Point(15, 15)
        }
            
            const marker = new window.google.maps.Marker({
              position: { lat, lng },
              map: googleMap.value,
          title: props?.name || 'Health Facility',
          icon,
          draggable: isCurrentFacility,
          opacity: isCurrentFacility ? 1 : 0.25,
          zIndex: isCurrentFacility ? 600 : 500
        })

        if (isCurrentFacility) {
          marker.addListener('dragend', (event: any) => {
            const newPos = event.latLng?.toJSON?.() || { lat, lng }
            const updatedProps = {
              ...props,
              latitude: newPos.lat,
              longitude: newPos.lng,
              geom: { type: 'Point', coordinates: [newPos.lng, newPos.lat] }
            }
            facilityMarkerDataMap.value.set(marker, updatedProps)
            openFacilityForm(updatedProps)
          })
        }

            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="padding: 8px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${props?.name || 'Health Facility'}</h3>
                <p style="margin: 0 0 5px 0; font-size: 12px;"><strong>Type:</strong> ${category}</p>
                ${props?.ownership_type ? `<p style="margin: 5px 0 0 0; font-size: 12px;"><strong>Ownership:</strong> ${props.ownership_type}</p>` : ''}
                </div>
              `
            })

        facilityMarkerDataMap.value.set(marker, props)
            marker.addListener('click', () => {
          openFacilityForm(props)
            })
            healthFacilityMarkers.value.push(marker)
          } catch (markerError) {
        console.error('Error creating marker:', markerError, props)
      }
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

    features.forEach((feature: any) => {
      if (feature.geometry) {
        const coords = getPointCoords(feature.geometry)
        if (!coords) return
        const [lng, lat] = coords
        let category = (feature.properties?.level || feature.properties?.facility_type || 'other').toLowerCase().trim()
        if (!category || category === 'n/a' || category === 'na') category = 'other'

        if (!presentFacilityCategories.includes(category)) {
          presentFacilityCategories.push(category)
        }
        if (feature.properties?.id !== undefined && feature.properties?.id !== null) {
          renderedFacilityIds.add(feature.properties.id)
        }
        addFacilityMarker(lat, lng, feature.properties || {}, category)
      }
    })

    // Fallback: if geo endpoint misses some facilities, use facility.geom directly.
    facilities.forEach((facility: any) => {
      if (renderedFacilityIds.has(facility?.id)) return
      const coords = getPointCoords(facility?.geom)
      if (!coords) return
      const [lng, lat] = coords
      let category = (facility?.level || facility?.facility_type || 'other').toLowerCase().trim()
      if (!category || category === 'n/a' || category === 'na') category = 'other'
      if (!presentFacilityCategories.includes(category)) {
        presentFacilityCategories.push(category)
      }
      addFacilityMarker(lat, lng, facility, category)
      renderedFacilityIds.add(facility?.id)
    })
      
      if (healthFacilityMarkers.value.length === 0) {
        ElMessage.info('No health facilities with valid Point geometry found')
      } else {
        ElMessage.success(`Loaded ${healthFacilityMarkers.value.length} health facilities on map`)
    }
  } catch (error) {
    console.error("Error loading health facilities on map:", error)
    ElMessage.error("Failed to load health facilities on map: " + (error as Error).message)
  }
}

const clearMapPlacementListener = () => {
  if (mapPlacementClickListener.value && window.google?.maps?.event) {
    window.google.maps.event.removeListener(mapPlacementClickListener.value)
  }
  mapPlacementClickListener.value = null
}

const startPlacingFacilityMarker = () => {
  if (!googleMap.value || !mapDrawerActiveFacility.value || !mapDrawerActiveFacilityId.value) {
    ElMessage.warning('Select a facility first before adding a marker')
    return
  }

  clearMapPlacementListener()
  isPlacingFacilityMarker.value = true
  ElMessage.info('Click on the map to place the facility marker')

  mapPlacementClickListener.value = googleMap.value.addListener('click', (event: any) => {
    const point = event?.latLng?.toJSON?.()
    if (!point) return

    const icon = {
      url: 'icons/ambulance.png',
      scaledSize: new window.google.maps.Size(30, 30),
      anchor: new window.google.maps.Point(15, 15)
    }

    if (mapPlacementMarker.value) {
      mapPlacementMarker.value.setPosition(point)
    } else {
      mapPlacementMarker.value = new window.google.maps.Marker({
        position: point,
        map: googleMap.value,
        title: mapDrawerActiveFacility.value?.name || 'Health Facility',
        icon,
        draggable: true,
        opacity: 1,
        zIndex: 700
      })
    }

    const updatedProps = {
      ...mapDrawerActiveFacility.value,
      latitude: point.lat,
      longitude: point.lng,
      geom: {
        type: 'Point',
        coordinates: [point.lng, point.lat]
      }
    }

    activeFacilityHasGeometry.value = true
    isPlacingFacilityMarker.value = false
    clearMapPlacementListener()
    openFacilityForm(updatedProps)
  })
}

// â”€â”€â”€ Facility form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const openFacilityForm = (facilityData: any) => {
  isEditMode.value = true
  editingFacilityId.value = facilityData.id || null
  
  facilityForm.name = facilityData.name || ''
  facilityForm.settlement_id = facilityData.settlement_id || mapDrawerSettlement.value?.id || ''

  if (isCountyRestricted.value && userCountyId.value) {
    facilityForm.county_id = userCountyId.value
  } else {
  facilityForm.county_id = facilityData.county_id || mapDrawerSettlement.value?.county_id || ''
  }

  if (userSettlementId.value && !isSuperAdmin.value && !hasNationalAccess.value) {
    facilityForm.settlement_id = userSettlementId.value
    if (userCountyId.value) facilityForm.county_id = userCountyId.value
  }

  facilityForm.subcounty_id = facilityData.subcounty_id || mapDrawerSettlement.value?.subcounty_id || ''
  facilityForm.ward_id = facilityData.ward_id || mapDrawerSettlement.value?.ward_id || ''
  facilityForm.level = facilityData.level || ''
  facilityForm.reg_status = facilityData.reg_status || ''
  facilityForm.ownership_type = facilityData.ownership_type || ''
  facilityForm.owner = facilityData.owner || ''
  facilityForm.catchment = facilityData.catchment || ''
  facilityForm.services = Array.isArray(facilityData.services)
    ? facilityData.services
    : (facilityData.services ? facilityData.services.split(',') : [])
  facilityForm.common_ailments = Array.isArray(facilityData.common_ailments)
    ? facilityData.common_ailments
    : (facilityData.common_ailments ? facilityData.common_ailments.split(',') : [])
  facilityForm.inpatient = facilityData.inpatient || ''
  facilityForm.patients_per_day = facilityData.patients_per_day || null
  facilityForm.number_beds = facilityData.number_beds || null
  facilityForm.occupancy = facilityData.occupancy || null
  facilityForm.number_doctors = facilityData.number_doctors || null
  facilityForm.number_clinical_officers = facilityData.number_clinical_officers || null
  facilityForm.number_pharm = facilityData.number_pharm || null
  facilityForm.number_nurses = facilityData.number_nurses || null
  facilityForm.referrals = facilityData.referrals || ''
  facilityForm.challenges = facilityData.challenges || ''
  facilityForm.parcel_tenure = facilityData.parcel_tenure || ''
  facilityForm.respondent_name = facilityData.respondent_name || ''
  facilityForm.respondent_phone = facilityData.respondent_phone || ''
  facilityForm.geom = facilityData.geom || null
  
  facilityDrawerVisible.value = true
}

const submitFacilityForm = async () => {
  if (!facilityFormRef.value) return
  
  await facilityFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        const formData: any = { ...facilityForm, model: healthFacilityModel }

        if (isCountyRestricted.value && userCountyId.value) {
          if (formData.county_id && formData.county_id !== userCountyId.value) {
            ElMessage.error('You can only create facilities in your assigned county')
            return
          }
          formData.county_id = userCountyId.value
        }

        if (userSettlementId.value && !isSuperAdmin.value && !hasNationalAccess.value) {
          if (formData.settlement_id && formData.settlement_id !== userSettlementId.value) {
            ElMessage.error('You can only create facilities in your assigned settlement')
            return
          }
          formData.settlement_id = userSettlementId.value
          if (userCountyId.value) formData.county_id = userCountyId.value
        }

        // Convert array fields to comma-separated strings
        if (Array.isArray(formData.services)) formData.services = formData.services.join(',')
        if (Array.isArray(formData.common_ailments)) formData.common_ailments = formData.common_ailments.join(',')

        if (isEditMode.value && editingFacilityId.value) {
          formData.id = editingFacilityId.value
          const res = await updateOneRecord(formData)
          if (res.status === 'success') {
            ElMessage.success('Health facility updated successfully')
            page.value = 1
            currentPage.value = 1
            if (mapDrawerSettlement.value) {
              await loadHealthFacilitiesOnMap(mapDrawerSettlement.value.id)
              await loadHealthFacilitiesForSettlement(mapDrawerSettlement.value.id)
            }
            await getFilteredData(filters.value, filterValues.value)
            closeFacilityDrawer()
          } else {
            ElMessage.error('Failed to update health facility')
          }
        } else {
          const res = await CreateRecord(formData)
          if (res.status === 'success') {
            ElMessage.success('Health facility created successfully')
            page.value = 1
            currentPage.value = 1
            if (mapDrawerSettlement.value) {
              await loadHealthFacilitiesOnMap(mapDrawerSettlement.value.id)
              await loadHealthFacilitiesForSettlement(mapDrawerSettlement.value.id)
            }
            await getFilteredData(filters.value, filterValues.value)
            closeFacilityDrawer()
          } else {
            ElMessage.error('Failed to create health facility')
          }
        }
      } catch (error) {
        console.error('Error submitting facility form:', error)
        ElMessage.error('Failed to save health facility')
      }
    }
  })
}

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

const closeFacilityDrawer = () => {
  facilityDrawerVisible.value = false
  resetFacilityForm()
}

const handleMapDrawerClose = () => {
  mapDrawerVisible.value = false
  facilityDrawerVisible.value = false
  clearMapPlacementListener()
  isPlacingFacilityMarker.value = false
  activeFacilityHasGeometry.value = false
  mapDrawerActiveFacility.value = null
  mapDrawerActiveFacilityId.value = null
  if (mapPlacementMarker.value) {
    mapPlacementMarker.value.setMap(null)
    mapPlacementMarker.value = null
  }
  healthFacilityMarkers.value.forEach(marker => marker.setMap(null))
  healthFacilityMarkers.value = []
  presentFacilityCategories.length = 0
    settlementPolygon.value = null
  googleMap.value = null
  mapDrawerSettlement.value = null
  settlementGeo.value = null
  healthFacilitiesGeo.value = null
  facilityMarkerDataMap.value.clear()
}

const editFacility = async (data: any) => {
  try {
    const facilityFilters: string[] = ['id']
    const facilityFilterValues: any[] = [[data.id]]
    if (isCountyRestricted.value && userCountyId.value) {
      facilityFilters.push('county_id')
      facilityFilterValues.push([userCountyId.value])
    }
    const formData = {
      limit: 1,
      page: 1,
      curUser: 1,
      model: healthFacilityModel,
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
        openFacilityForm(data)
      }
    } catch (error) {
      openFacilityForm(data)
    }
  } catch (error) {
    console.error('Error opening facility form:', error)
    ElMessage.error('Failed to open facility form')
  }
}

const filteredSegments = computed(() => [])

</script>

<template>
  <el-card>
    <div v-if="dynamicComponent">
      <upload-component :is="dynamicComponent" v-bind="componentProps" />
    </div>

    <!-- Filter toolbar -->
    <el-row :gutter="10" style="margin-bottom: 10px;">
      <!-- Back -->
      <el-col :xs="24" :sm="24" :md="4" :lg="2" class="max-w-200px">
        <div style="margin-bottom: 8px;">
          <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right:10px;width:100%;">
            Back
          </el-button>
        </div>
      </el-col>

      <!-- County filter -->
      <el-col :xs="24" :sm="24" :md="8" :lg="5" style="margin-bottom: 8px;">
        <el-select
          size="default"
          v-model="value4"
          :onChange="filterByCounty"
          :onClear="handleClear"
          multiple clearable filterable collapse-tags
          placeholder="By County"
          style="margin-right:5px;"
          :disabled="isCountyRestricted"
        >
          <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-col>

      <!-- Settlement filter -->
      <el-col :xs="24" :sm="24" :md="8" :lg="4" style="margin-bottom: 8px;">
        <el-select
          size="default"
          v-model="value7"
          :onChange="filterBySettlement"
          :disabled="!selectedCounty || !selectedCounty.length"
          multiple clearable filterable collapse-tags
          placeholder="By Settlement"
          style="margin-right:5px;"
        >
          <el-option v-for="item in settlementOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-col>

      <!-- Search -->
      <el-col :xs="24" :sm="24" :md="8" :lg="5" style="margin-bottom: 8px;">
        <el-input
          v-model="search_string"
          clearable
          @clear="handleClear"
          placeholder="Search by name..."
          @change="searchByNewName"
          class="input-with-select"
          style="margin-right:5px;"
        >
          <template #append>
            <el-button v-loading="searchLoading" :icon="Search" @click="searchByNewName" />
          </template>
        </el-input>
      </el-col>

      <!-- Action buttons -->
      <el-col :xs="24" :sm="24" :md="12" :lg="4" style="margin-bottom: 8px;">
        <div style="display:flex;align-items:center;gap:10px;justify-content:flex-end;width:100%;">
          <!-- Desktop -->
          <template v-if="!isMobile">
          <el-tooltip content="Add Facility" placement="top">
            <PermissionWrapper :permissions="'health_facility:create'">
                <el-button @click="AddFacility()" type="primary" :icon="Plus" />
            </PermissionWrapper>
          </el-tooltip>
          <el-tooltip content="Clear" placement="top">
              <el-button @click="handleClear" type="primary" :icon="Filter" />
          </el-tooltip>
          <DownloadCustom
              v-if="showEditButtons"
              :data="tableDataList"
              :model="healthFacilityModel"
              :associated_models="['settlement', 'county', 'subcounty', 'ward']"
            />
        </template>

          <!-- Mobile -->
          <template v-else>
            <el-dropdown trigger="click">
              <el-button type="primary">
                Actions
                <el-icon style="margin-left:4px;"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="AddFacility()">
                    <el-icon><Plus /></el-icon>
                    <span style="margin-left:8px;">Add Facility</span>
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleClear">
                    <el-icon><Filter /></el-icon>
                    <span style="margin-left:8px;">Clear Filters</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
                  </template>
            </el-dropdown>
            <DownloadCustom
              v-if="showEditButtons"
              :data="tableDataList"
              :model="healthFacilityModel"
              :associated_models="['settlement', 'county', 'subcounty', 'ward']"
            />
                  </template>
              </div>
      </el-col>
    </el-row>

    <!-- Main table -->
    <el-table
      :data="tableDataList"
      style="width:100%;margin-top:10px;"
      border
      :size="isMobile ? 'small' : 'default'"
    >
      <!-- Name -->
      <el-table-column
        label="Facility Name"
        prop="name"
        sortable
        :min-width="isMobile ? 160 : 220"
        show-overflow-tooltip
      />

      <!-- Location -->
      <el-table-column
        :label="isMobile ? 'Location' : 'Location (Settlement / Ward / Subcounty / County)'"
        :min-width="isMobile ? 220 : 260"
      >
                <template #default="scope">
          {{ scope.row.settlement?.name || 'N/A' }},
            {{ scope.row.ward?.name || 'N/A' }} ward,
            {{ scope.row.subcounty?.name || 'N/A' }} subcounty,
            {{ scope.row.county?.name || 'N/A' }} County
        </template>
      </el-table-column>

      <!-- Type / Level -->
      <el-table-column
        label="Type"
        prop="level"
        :min-width="isMobile ? 110 : 140"
        show-overflow-tooltip
      />

      <!-- Beds / Staff -->
      <el-table-column label="Capacity / Staff" min-width="200">
        <template #default="scope">
          <div>
            <div><strong>Beds:</strong> {{ scope.row.number_beds || 'N/A' }}</div>
            <div style="margin-top:2px;"><strong>Doctors:</strong> {{ scope.row.number_doctors || 'N/A' }}</div>
            <div style="margin-top:2px;"><strong>Nurses:</strong> {{ scope.row.number_nurses || 'N/A' }}</div>
          </div>
        </template>
      </el-table-column>

      <!-- Actions -->
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
                @view-on-map="flyTo"
                @delete="DeleteFacility"
              />
        </template>
      </el-table-column>
    </el-table>

    <div v-if="!tableDataList || tableDataList.length === 0" class="no-data-message">
      <el-empty description="No health facilities found" />
    </div>

    <ElPagination
      v-if="tableDataList && tableDataList.length > 0"
      layout="sizes, prev, pager, next, total"
      v-model:currentPage="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[10, 25, 50, 100]"
      :total="total"
      :background="true"
      @size-change="onPageSizeChange"
      @current-change="onPageChange"
      class="mt-4"
    />
        </el-card>


  <!-- Approve / Review dialogs (kept for admin use) -->
  <el-dialog v-model="ShowReviewDialog" @close="handleClose" :title="formheader" :width="reviewWindowWidth" draggable>
    <el-descriptions title="" direction="vertical" :column="2" size="small" border>
      <el-descriptions-item label="Name">{{ facility_raw.name }}</el-descriptions-item>
      <el-descriptions-item label="Status" :span="2">{{ facility_raw.reg_status }}</el-descriptions-item>
      <el-descriptions-item label="Ownership">{{ facility_raw.ownership_type }}</el-descriptions-item>
      <el-descriptions-item label="Owner">{{ facility_raw.owner }}</el-descriptions-item>
      <el-descriptions-item label="Submitted By">{{ facility_raw.user }}</el-descriptions-item>
      <el-descriptions-item label="Date">{{ facility_raw.date }}</el-descriptions-item>
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
        <el-button type="primary" @click="confirmReject">Confirm</el-button>
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
      <div
        v-if="mapDrawerActiveFacilityId && !activeFacilityHasGeometry"
        class="map-action-button"
      >
        <el-button type="primary" @click="startPlacingFacilityMarker">
          {{ isPlacingFacilityMarker ? 'Click map to place marker...' : 'Add Marker' }}
        </el-button>
      </div>

      <!-- Legend -->
      <div v-if="presentFacilityCategories.length > 0" class="map-legend">
        <h4 class="legend-title">Map Legend</h4>
        <div class="legend-item">
          <img src="/icons/ambulance.png" style="width:22px;height:22px;margin-right:10px;opacity:1;" />
          <span class="legend-label">Selected facility</span>
        </div>
        <div class="legend-item">
          <img src="/icons/ambulance.png" style="width:22px;height:22px;margin-right:10px;opacity:0.2;" />
          <span class="legend-label">Other facilities</span>
        </div>
      </div>
    </div>
  </el-drawer>

  <!-- Facility Form Drawer -->
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
      :label-width="isMobile ? '0px' : '200px'"
      :label-position="isMobile ? 'top' : 'left'"
      class="facility-form-mobile"
    >
      <el-divider content-position="left">Basic Information</el-divider>

      <el-form-item label="Facility Name" prop="name">
        <el-input v-model="facilityForm.name" placeholder="Enter facility name" />
      </el-form-item>

      <el-form-item label="Facility Type">
        <el-select v-model="facilityForm.level" placeholder="Select type" filterable style="width:100%">
          <el-option v-for="item in HCFTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="Registration Status">
        <el-select v-model="facilityForm.reg_status" placeholder="Select status" filterable style="width:100%">
          <el-option v-for="item in regStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="Ownership Type">
        <el-select v-model="facilityForm.ownership_type" placeholder="Select ownership" filterable style="width:100%">
          <el-option v-for="item in ownershipOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="Owner">
        <el-input v-model="facilityForm.owner" placeholder="Enter owner name" />
      </el-form-item>

      <el-form-item label="Catchment Area">
        <el-select v-model="facilityForm.catchment" placeholder="Select catchment" filterable style="width:100%">
          <el-option v-for="item in catchmentOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <el-divider content-position="left">Services</el-divider>

      <el-form-item label="Services Offered">
        <el-select v-model="facilityForm.services" placeholder="Select services" filterable multiple style="width:100%">
          <el-option v-for="item in servicesOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="Common Ailments">
        <el-select v-model="facilityForm.common_ailments" placeholder="Select ailments" filterable multiple style="width:100%">
          <el-option v-for="item in commonAilmentsOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="Has Inpatient">
        <el-select v-model="facilityForm.inpatient" placeholder="Select" style="width:100%">
          <el-option v-for="item in yesNoOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <el-divider content-position="left">Capacity</el-divider>

      <el-form-item label="Avg. Patients / Day">
        <el-input-number v-model="facilityForm.patients_per_day" :min="0" style="width:100%" />
      </el-form-item>

      <el-form-item label="Bed Capacity">
        <el-input-number v-model="facilityForm.number_beds" :min="0" style="width:100%" />
      </el-form-item>

      <el-form-item label="Occupancy Rate (%)">
        <el-input-number v-model="facilityForm.occupancy" :min="0" :max="100" style="width:100%" />
      </el-form-item>

      <el-divider content-position="left">Staff</el-divider>

      <el-form-item label="Doctors">
        <el-input-number v-model="facilityForm.number_doctors" :min="0" style="width:100%" />
      </el-form-item>

      <el-form-item label="Clinical Officers">
        <el-input-number v-model="facilityForm.number_clinical_officers" :min="0" style="width:100%" />
      </el-form-item>

      <el-form-item label="Pharmacists">
        <el-input-number v-model="facilityForm.number_pharm" :min="0" style="width:100%" />
      </el-form-item>

      <el-form-item label="Nurses">
        <el-input-number v-model="facilityForm.number_nurses" :min="0" style="width:100%" />
      </el-form-item>

      <el-divider content-position="left">Additional Information</el-divider>

      <el-form-item label="Referrals To">
        <el-input v-model="facilityForm.referrals" placeholder="Enter referral facility" />
      </el-form-item>

      <el-form-item label="Parcel Tenure">
        <el-select v-model="facilityForm.parcel_tenure" placeholder="Select tenure" filterable style="width:100%">
          <el-option v-for="item in parcelTenureOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="Respondent Name">
        <el-input v-model="facilityForm.respondent_name" placeholder="Enter respondent name" />
      </el-form-item>

      <el-form-item label="Respondent Phone">
        <el-input v-model="facilityForm.respondent_phone" placeholder="Enter respondent phone" />
      </el-form-item>

      <el-form-item label="Challenges / Issues">
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

.no-data-message {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  margin: 20px 0;
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

  .drawer-title { font-size: 14px; }
  .close-btn-mobile { padding: 6px 12px; font-size: 13px; }

  .facility-form-mobile :deep(.el-form-item) { margin-bottom: 18px; }
  .facility-form-mobile :deep(.el-form-item__label) { font-size: 13px; margin-bottom: 6px; padding-bottom: 0; }
  .facility-form-mobile :deep(.el-input),
  .facility-form-mobile :deep(.el-select),
  .facility-form-mobile :deep(.el-input-number) { font-size: 16px; }
  .facility-form-mobile :deep(.el-button) { width: 100%; margin-top: 10px; padding: 12px; font-size: 15px; }
  .facility-form-mobile :deep(.el-divider) { margin: 20px 0; }
  .facility-form-mobile :deep(.el-divider__text) { font-size: 14px; }

  .drawer-footer-mobile { flex-direction: column; padding: 15px; gap: 10px; }
  .footer-btn { width: 100%; margin: 0; }
}

/* Ensure drawers are scrollable on mobile */
:deep(.el-drawer__body) {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Improve touch targets */
@media (max-width: 768px) {
  :deep(.el-button) { min-height: 44px; }
  :deep(.el-select), :deep(.el-input) { min-height: 44px; }
  :deep(.el-input__inner), :deep(.el-input__wrapper) { min-height: 44px; }
}
</style>

<style>
.el-table .warning-row { --el-table-tr-bg-color: var(--el-color-warning-light-9); }
.el-table .success-row { --el-table-tr-bg-color: var(--el-color-success-light-9); }
</style>
 
