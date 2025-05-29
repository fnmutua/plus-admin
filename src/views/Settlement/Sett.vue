<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { getSettlementListByCounty, getDuplicates, mergeDuplicates } from '@/api/settlements'
import { getListWithoutGeo } from '@/api/counties'
import {
  ElButton, ElSelect, FormInstance, ElTabs, ElTabPane, ElDialog, ElInputNumber,
  ElInput, ElBadge, ElForm, ElDescriptions, ElDescriptionsItem, ElFormItem, ElUpload, ElCard, ElPopconfirm, ElTable, ElCol, ElRow,
  ElTableColumn, UploadUserFile, ElDropdown, ElDropdownMenu, ElDropdownItem, ElStep, ElSteps, ElCheckbox, ElIcon, ElDatePicker,
} from 'element-plus'
import { ElMessage, ElSegmented } from 'element-plus'
import { Position, Plus, Delete, Edit, Filter, InfoFilled, CopyDocument, Clock, Search, Setting, Back, Loading, CircleCheck, Message, CircleClose, Warning, View, RefreshLeft } from '@element-plus/icons-vue'
import { ArrowLeft, ArrowRight, UploadFilled, Postcard, TopRight, Lock, Guide, TakeawayBox } from '@element-plus/icons-vue'
import { ref, reactive, computed } from 'vue'
import { ElPagination, ElTooltip, ElOption } from 'element-plus'
import { useRouter } from 'vue-router'
import { DeleteRecord, updateOneRecord, revertHistory, deleteDocument } from '@/api/settlements'
import { useAppStore } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { defineAsyncComponent, onMounted, nextTick } from 'vue';
import xlsx from "json-as-xlsx"
import { searchByKeyWord } from '@/api/settlements'
import readShapefileAndConvertToGeoJSON from '@/utils/readShapefile'
import filterDataByKeys from '@/utils/filterArrays'
import { getSummarybyField } from '@/api/summary'
import * as turf from '@turf/turf'
import '@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css';
import { Icon } from '@iconify/vue';
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'
import { UserType } from '@/api/register/types'
import proj4 from 'proj4';
import UploadComponent from '@/views/Components/UploadComponent.vue';
import ListDocuments from '@/views/Components/ListDocuments.vue';
import DownloadCustom from '@/views/Components/DownloadCustom.vue';
import TableActions from '@/views/Components/TableActions.vue';



import { getSummarybyFieldFromMultipleIncludes } from '@/api/summary'

const MapBoxToken = 'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = MapBoxToken;

// Filter variables
const filters = ref([  'isActive'])
const filterValues = ref([  ['Approved'], ['true']])
const selectedCounty = ref([])
const selectedSubCounty = ref([])
const selectedWard = ref([])
const search_string = ref('')
const value4 = ref([]) // County select
const value5 = ref([]) // Subcounty select
const value6 = ref([]) // Ward select

const loadingGetData = ref(false)
const loadingGetDataMsg = ref('Loading the data.. Please wait.......')

const DateDialogVisible = ref(false)
const dateRange = ref()

// Save filters to localStorage
const saveFiltersToStorage = () => {
  const filterState = {
    selectedCounty: selectedCounty.value,
    selectedSubCounty: selectedSubCounty.value,
    selectedWard: selectedWard.value,
    search_string: search_string.value,
    filters: filters.value,
    filterValues: filterValues.value,
    value4: value4.value,
    value5: value5.value,
    value6: value6.value,
  }
  localStorage.setItem('settlementFilters', JSON.stringify(filterState))
}

// Load filters from localStorage
const loadFiltersFromStorage = () => {
  const savedFilters = localStorage.getItem('settlementFilters')
  if (savedFilters) {
    const filterState = JSON.parse(savedFilters)
    selectedCounty.value = filterState.selectedCounty || []
    selectedSubCounty.value = filterState.selectedSubCounty || []
    selectedWard.value = filterState.selectedWard || []
    search_string.value = filterState.search_string || ''
    filters.value = filterState.filters || [ 'isApproved', 'isActive']
    filterValues.value = filterState.filterValues || [  ['Approved'], ['true']]
    value4.value = filterState.value4 || []
    value5.value = filterState.value5 || []
    value6.value = filterState.value6 || []
  }
}

// User and role setup
const { wsCache } = useCache()
const appStore = useAppStore()
const userInfo = wsCache.get(appStore.getUserInfo)
const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)
const isSuperAdmin = ref(
  userInfo.roles.some(role => role.name === "super_admin" || role.name === "root_admin")
);
const thisHistory = ref()

const action_buttons = computed(() => {
  let buttons = [];
  if (showAdminButtons.value) {
    buttons = ['edit', 'viewOnMap', 'delete'];
  } else if (showEditButtons.value) {
    buttons = ['edit', 'viewOnMap'];
  } else {
    buttons = ['viewOnMap'];
  }
  if (activeSegment.value === 'New' || activeSegment.value === 'Rejected') {
    buttons.push('review');
  }
  return buttons;
});

// Process user roles
const processedRoles = userInfo.roles.map(role => {
  let field = null;
  let fieldvalue = null;
  if (role.user_roles.location_level === "county") {
    field = "county_id";
    fieldvalue = role.user_roles.county_id;
  } else if (role.user_roles.location_level === "settlement") {
    field = "settlement_id";
    fieldvalue = role.user_roles.settlement_id;
  } else if (role.user_roles.location_level === "national" || role.user_roles.location_level === null) {
    return {
      role: role.name,
      model: "national",
      field: null,
      fieldvalue: null
    };
  } else {
    field = "location_id";
    fieldvalue = role.user_roles.location_id;
  }
  return {
    role: role.name,
    model: role.user_roles.location_level,
    field: field,
    fieldvalue: fieldvalue
  };
}).filter(role => role !== null);

let roles_filters = [];
let userType;
if (isSuperAdmin.value) {
  roles_filters = [];
  userType = "superadmin";
  showAdminButtons.value = true
} else if (processedRoles.some(role => role.role === "admin")) {
  userType = "admin";
  showAdminButtons.value = true
} else if (processedRoles.some(role => role.role === "staff")) {
  userType = "staff";
  showAdminButtons.value = true
} else {
  const applicableRoles = processedRoles.filter(role => role.model !== "national");
  roles_filters = applicableRoles.map(role => ({
    role: role.role,
    field: role.field === 'settlement_id' ? 'id' : role.field,
    value: role.fieldvalue
  }));
  showAdminButtons.value = false
}

const pushRoleFilters = () => {
  if (roles_filters.length > 0) {
    const filterMap = {};
    roles_filters.forEach(roleFilter => {
      const { field, value } = roleFilter;
      if (filterMap[field]) {
        if (!filterMap[field].includes(value)) {
          filterMap[field].push(value);
        }
      } else {
        filterMap[field] = [value];
      }
    });
    Object.keys(filterMap).forEach(field => {
      filters.value.push(field);
      filterValues.value.push(filterMap[field]);
    });
  }
  saveFiltersToStorage(); // Save after updating filters
};

// Form setup
const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  name: '',
  county_id: '',
  subcounty_id: '',
  ward_id: '',
  settlement_type: '',
  population: '',
  area: '',
  description: null,
  geom: null,
  id: '',
  dist_trunk: null,
  dist_town: null,
  parcel_no: null,
  parcel_owner: null,
  rim_no: null,
  isApproved: 'Pending',
  isActive: true,
  code: ''
})

// Pagination and table setup
const mobileBreakpoint = 768;
const defaultPageSize = 10;
const mobilePageSize = 5;
const pageSize = ref(defaultPageSize);

const updatePageSize = () => {
  if (window.innerWidth <= mobileBreakpoint) {
    pageSize.value = mobilePageSize;
  } else {
    pageSize.value = defaultPageSize;
  }
};

const getCounts = async () => {
  const formData = {}
  formData.model = 'settlement'
  formData.summaryField = 'isApproved'
  formData.summaryFunction = 'count'
  formData.groupFields = ['isApproved']
  if (roles_filters.length > 0) {
    formData.filterField = [filters.value[1]]
    formData.filterValue = [[filterValues.value[1]]]
    formData.filterOperator = ['eq']
  }
  try {
    const response = await getSummarybyFieldFromMultipleIncludes(formData);
    const amount = response.Total;
    Statuses.value.forEach((status) => {
      let keyToCompare = status.value;
      if (status.value === 'New') {
        keyToCompare = 'Pending';
      }
      const match = amount.find((item) => item.isApproved === keyToCompare);
      if (match) {
        status.count = parseInt(match.count, 10);
      }
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

 
onMounted(async () => {
  window.addEventListener('resize', updatePageSize);
  updatePageSize();
  await loadFiltersFromStorage(); // Restore filters
  getCounts();
  getSettlmentHistory();

  // Check if any filters were restored from storage
  const hasRestoredFilters =
    selectedCounty.value.length > 0 ||
    selectedSubCounty.value.length > 0 ||
    selectedWard.value.length > 0 ||
    search_string.value ||
    filters.value.length > 0;

  // Apply restored filters if they exist
  if (hasRestoredFilters) {
    if (selectedCounty.value.length > 0) {
      await getSubCountyNames();
      if (selectedSubCounty.value.length > 0) {
        await getWardNames();
      }
    }
    // Fetch data based on restored filters
    await getNewOrRejectedSettlements(activeSegment.value);
  } else {
    // No filters restored, fetch initial settlements
    await getAllSetllementsInitially(activeSegment.value);
  }
});



const { push } = useRouter()
const page = ref(1)
const loading = ref(true)
const currentPage = ref(1)
const enableSubcounty = ref(false)
const total = ref(0)
const totalRejected = ref(0)
const totalApproved = ref(0)
const totalPending = ref(0)
const showEditSaveButton = ref(false)
const showAddSaveButton = ref(true)
const formheader = ref('Edit Settlement')
const duplicateRecords = ref([])
const duplicateTotal = ref(0)
const deletedSettlements = ref([])
const deletedSettlementsCount = ref(0)
const decommSettlements = ref([])
const decommSettlementsCount = ref(0)
const tableDataList = ref([])
const tableDataListNew = ref<UserType[]>([])
const tableDataListRejected = ref<UserType[]>([])
const associated_Model = ''
const associated_multiple_models = ['county', 'subcounty', 'ward', 'users']
const nested_models = ['document', 'document_type']
const model = 'settlement'
const fileUploadList = ref<UploadUserFile[]>([])
const { t } = useI18n()
const isMobile = computed(() => appStore.getMobile)
const reviewWindowWidth = ref(isMobile.value ? "100%" : "40%")

const handleClear = async () => {
  enableSubcounty.value = false
  search_string.value = ''
  selectedCounty.value = []
  selectedSubCounty.value = []
  selectedWard.value = []
  filterValues.value = []
  filters.value = []
  value4.value = []
  value5.value = []
  value6.value = []
  dateRange.value = []
  currentPage.value = 1
  localStorage.removeItem('settlementFilters'); // Clear stored filters
  await getAllSetllementsInitially(activeSegment.value)
}

const currentRow = ref()
const addMoreDocuments = ref(false)

const onPageChange = async (selPage: any) => {
  page.value = selPage
  if (activeSegment.value == 'Approved') {
    filters.value = [  'isApproved', 'isActive']
    filterValues.value = [ ['Approved'], ['true']]
  } else if (activeSegment.value == 'New') {
    filters.value = [  'isApproved', 'isActive']
    filterValues.value = [ ['Pending'], ['true']]
  } else if (activeSegment.value == 'Rejected') {
    filters.value = [  'isApproved', 'isActive']
    filterValues.value = [ ['Rejected'], ['true']]
  }
  saveFiltersToStorage();
  if (search_string.value) {
    getFilteredBySearchData(activeSegment.value, search_string.value)
  } else {
    getNewOrRejectedSettlements(activeSegment.value)
  }
}

const onPageSizeChange = async (size: any) => {
  pageSize.value = size
  if (activeSegment.value === 'Approved') {
    filters.value = [  'isApproved', 'isActive']
    filterValues.value = [ ['Approved'], ['true']]
  } else if (activeSegment.value === 'New') {
    filters.value = [  'isApproved', 'isActive']
    filterValues.value = [ ['Pending'], ['true']]
  } else if (activeSegment.value === 'Rejected') {
    filters.value = [  'isApproved', 'isActive']
    filterValues.value = [ ['Rejected'], ['true']]
  }
  saveFiltersToStorage();
  if (search_string.value) {
    getFilteredBySearchData(activeSegment.value, search_string.value)
  } else {
    getNewOrRejectedSettlements(activeSegment.value)
  }
}

const getAllSetllementsInitially = async (tab) => {
  await getNewOrRejectedSettlements(tab)
  getSettlementCount()
}

const getSettlementCount = async () => {
  const formData = {}
  formData.model = 'settlement'
  formData.summaryField = 'isApproved'
  formData.summaryFunction = 'count'
  formData.groupField = ['isApproved']
  formData.filterColumn = 'isActive'
  formData.filterValue = 'true'
  const newSettCount = await getSummarybyField(formData)
  let pending = await filterDataByKeys(newSettCount.Total, ['isApproved'], ['Pending']);
  let approved = await filterDataByKeys(newSettCount.Total, ['isApproved'], ['Approved']);
  let rejected = await filterDataByKeys(newSettCount.Total, ['isApproved'], ['Rejected']);
  totalPending.value = pending.length > 0 ? parseInt(pending[0].count) : 0
  totalApproved.value = approved.length > 0 ? parseInt(approved[0].count) : 0
  totalRejected.value = rejected.length > 0 ? parseInt(rejected[0].count) : 0
}

const getNewOrRejectedSettlements = async (tab) => {
  loadingGetData.value = true
  if (tab === 'New') {
    filters.value = ['isApproved', 'isActive']
    filterValues.value = [['Pending'], ['true']]
  } else if (tab === 'Rejected') {
    filters.value = ['isApproved', 'isActive']
    filterValues.value = [['Rejected'], ['true']]
  } else if (tab === 'Decommissioned') {
    filters.value = ['isApproved', 'isActive']
    filterValues.value = [['Decommissioned'], ['true']]
  } else {
    filters.value = ['isApproved', 'isActive']
    filterValues.value = [['Approved'], ['true']]
  }
  if (selectedCounty.value.length > 0) {
    var selectOption = 'county_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    var index = filters.value.indexOf(selectOption)
    if (filterValues[index]) {
      filterValues.value.splice(index, 1)
    }
    if (!filterValues.value.includes(selectedCounty.value)) {
      filterValues.value.splice(index, 0, selectedCounty.value)
    }
    if (selectedCounty.value.length === 0) {
      filters.value.splice(index, 1)
    }
  }
  if (selectedSubCounty.value.length > 0) {
    var selectOption = 'subcounty_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    var index = filters.value.indexOf(selectOption)
    if (filterValues[index]) {
      filterValues.value.splice(index, 1)
    }
    if (!filterValues.value.includes(selectedSubCounty.value)) {
      filterValues.value.splice(index, 0, selectedSubCounty.value)
    }
    if (selectedSubCounty.value.length === 0) {
      filters.value.splice(index, 1)
    }
  }
  if (selectedWard.value.length > 0) {
    var selectOption = 'ward_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    var index = filters.value.indexOf(selectOption)
    if (filterValues[index]) {
      filterValues.value.splice(index, 1)
    }
    if (!filterValues.value.includes(selectedWard.value)) {
      filterValues.value.splice(index, 0, selectedWard.value)
    }
    if (selectedWard.value.length === 0) {
      filters.value.splice(index, 1)
    }
  }
  pushRoleFilters()
  const formData = {}
  formData.limit = pageSize.value
  formData.page = page.value
  formData.curUser = 1
  formData.model = model
  formData.searchField = 'name'
  formData.searchKeyword = ''
  formData.assocModel = associated_Model
  formData.filters = filters.value
  formData.filterValues = filterValues.value
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = nested_models
  formData.nested_models = nested_models
  formData.dateRange = dateRange.value
  


  const res = await getSettlementListByCounty(formData)
  loadingGetData.value = false
  total.value = res.total
  if (tab == 'New') {
    tableDataListNew.value = res.data
    totalPending.value = res.total
  } else if (tab == 'Rejected') {
    tableDataListRejected.value = res.data
    totalRejected.value = res.total
  } else if (tab == 'Decommissioned') {
    decommSettlements.value = res.data
    decommSettlementsCount.value = res.total
  } else {
    tableDataList.value = res.data
    totalApproved.value = res.total
    res.data.forEach(function (arrayItem) {
      var dd = flattenJSON(arrayItem)
      flattenedData.value.push(dd)
    })
    var obj = flattenJSON(res.data[0])
    model_fields.value = Object.keys(obj);
  }
}

const getPotentialDuplicates = async () => {
  loadingGetData.value = true
  loadingGetDataMsg.value = 'Checking for duplicate data.. Please wait.......'
  if (selectedCounty.value.length > 0) {
    var selectOption = 'county_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    var index = filters.value.indexOf(selectOption)
    if (filterValues[index]) {
      filterValues.value.splice(index, 1)
    }
    if (!filterValues.value.includes(selectedCounty.value)) {
      filterValues.value.splice(index, 0, selectedCounty.value)
    }
    if (selectedCounty.value.length === 0) {
      filters.value.splice(index, 1)
    }
  }
  if (selectedSubCounty.value.length > 0) {
    var selectOption = 'subcounty_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    var index = filters.value.indexOf(selectOption)
    if (filterValues[index]) {
      filterValues.value.splice(index, 1)
    }
    if (!filterValues.value.includes(selectedSubCounty.value)) {
      filterValues.value.splice(index, 0, selectedSubCounty.value)
    }
    if (selectedSubCounty.value.length === 0) {
      filters.value.splice(index, 1)
    }
  }
  if (selectedWard.value.length > 0) {
    var selectOption = 'ward_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    var index = filters.value.indexOf(selectOption)
    if (filterValues[index]) {
      filterValues.value.splice(index, 1)
    }
    if (!filterValues.value.includes(selectedWard.value)) {
      filterValues.value.splice(index, 0, selectedWard.value)
    }
    if (selectedWard.value.length === 0) {
      filters.value.splice(index, 1)
    }
  }
  pushRoleFilters()
  const formData = {}
  formData.limit = pageSize.value
  formData.page = page.value
  formData.curUser = 1
  formData.model = model
  formData.searchField = 'name'
  formData.searchKeyword = ''
  formData.assocModel = associated_Model
  formData.fields = ['name', 'county_id']
  formData.associated_multiple_models = associated_multiple_models
  formData.filters = filters.value
  formData.filterValues = filterValues.value
  formData.associated_model = "county"
  formData.foreignKey = "county_id"
  formData.displayField = "name"
  const res = await getDuplicates(formData)
  duplicateRecords.value = res.data
  duplicateTotal.value = res.data.length
  total.value = res.data.length
  loadingGetData.value = false
  loadingGetDataMsg.value = 'Loading the data.. Please wait.......'
}

const flattenJSON = (obj = {}, res = {}, extraKey = '') => {
  for (let key in obj) {
    if (key !== 'geom' && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'email' && key !== 'phone' && key !== 'isApproved' && key !== 'createdBy' && key !== 'isActive' && key !== 'documents' && key !== 'user') {
      if ((typeof obj[key] !== 'object' || obj[key] === null) && key !== 'id') {
        res[extraKey + key] = obj[key];
      } else if (Array.isArray(obj[key])) {
        obj[key].forEach((item, index) => {
          flattenJSON(item, res, `${extraKey}${key}.${index}.`);
        });
      } else {
        flattenJSON(obj[key], res, `${extraKey}${key}_`);
      }
    }
  }
  return res;
};

const model_fields = ref([])
const flattenedData = ref([])

function getLatLonFromGeom(geom) {
  if (!geom || !geom.type || !geom.coordinates) {
    return { latitude: null, longitude: null };
  }
  switch (geom.type) {
    case 'Point':
      return {
        latitude: geom.coordinates[1].toFixed(5),
        longitude: geom.coordinates[0].toFixed(5)
      };
    case 'MultiPoint':
      if (geom.coordinates.length > 0) {
        return {
          latitude: geom.coordinates[0][1].toFixed(5),
          longitude: geom.coordinates[0][0].toFixed(5)
        };
      }
      return { latitude: null, longitude: null };
    case 'Polygon':
    case 'MultiPolygon':
      const polygonCentroid = turf.centroid(geom);
      return {
        latitude: polygonCentroid.geometry.coordinates[1].toFixed(5),
        longitude: polygonCentroid.geometry.coordinates[0].toFixed(5)
      };
    case 'LineString':
    case 'MultiLineString':
      const lineCentroid = turf.centroid(geom);
      return {
        latitude: lineCentroid.geometry.coordinates[1].toFixed(5),
        longitude: lineCentroid.geometry.coordinates[0].toFixed(5)
      };
    default:
      return { latitude: null, longitude: null };
  }
}

const getFilteredData = async (selFilters, selfilterValues) => {
  loadingGetData.value = true
  pushRoleFilters()
  const formData = {}
  formData.limit = pageSize.value
  formData.page = page.value
  formData.curUser = 1
  formData.model = model
  formData.searchField = 'name'
  formData.searchKeyword = ''
  formData.assocModel = associated_Model
  formData.filters = selFilters
  formData.filterValues = selfilterValues
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = nested_models
  formData.dateRange = dateRange.value


  const res = await getSettlementListByCounty(formData)
  tableDataList.value = res.data
  total.value = res.total
  loadingGetData.value = false
}

const ShowReviewDialog = ref(false)
const RejectDialog = ref(false)
const settlement_raw = ref({})

const Review = (data: TableSlotDefault) => {
  ShowReviewDialog.value = true
  settlement_raw.value.name = data.name
  settlement_raw.value.area = data.area
  settlement_raw.value.population = data.population
  settlement_raw.value.description = data.description
  settlement_raw.value.user = data.user.name + ' | ' + data.user.email
  settlement_raw.value.date = data.createdAt
  ruleForm.id = data.id
  ruleForm.name = data.name
  ruleForm.county_id = data.county_id
  ruleForm.subcounty_id = data.subcounty_id
  ruleForm.ward_id = data.ward_id
  ruleForm.settlement_type = data.settlement_type
  ruleForm.population = data.population
  ruleForm.area = data.area
  ruleForm.description = data.description
  ruleForm.code = data.code
  ruleForm.geom = data.geom
  fileUploadList.value = data.documents
  formHeader.value = "Review Settlement"
}

const DeleteReview = async (data: TableSlotDefault) => {
  ShowReviewDialog.value = true
  await getThisHistory(data.history_id)
  settlement_raw.value.name = data.name
  settlement_raw.value.area = data.area
  settlement_raw.value.population = data.population
  settlement_raw.value.description = data.description
  settlement_raw.value.date = data.createdAt
  settlement_raw.value.user = thisHistory.value[0].user.name
  settlement_raw.value.delete_date = thisHistory.value[0].createdAt
  ruleForm.id = data.id
  ruleForm.name = data.name
  ruleForm.county_id = data.county_id
  ruleForm.subcounty_id = data.subcounty_id
  ruleForm.ward_id = data.ward_id
  ruleForm.settlement_type = data.settlement_type
  ruleForm.population = data.population
  ruleForm.area = data.area
  ruleForm.description = data.description
  ruleForm.code = data.code
  ruleForm.geom = data.geom
  fileUploadList.value = data.documents
  formHeader.value = "Review Deleted Settlement"
}

const approve = async () => {
  ruleForm.isApproved = 'Approved'
  ruleForm.reviewerId = userInfo.id
  ruleForm.model = 'settlement'
  await updateOneRecord(ruleForm).then(() => { })
  ShowReviewDialog.value = false
  getFilteredData(filters, filterValues)
}

const reject = async () => {
  RejectDialog.value = true
}

const rejectReason = ref('')
const confirmReject = async () => {
  ruleForm.reject_msg = rejectReason.value
  ruleForm.isApproved = 'Rejected'
  ruleForm.model = 'settlement'
  ruleForm.reviewerId = userInfo.id
  await updateOneRecord(ruleForm).then(() => { })
  RejectDialog.value = false
  ShowReviewDialog.value = false
  getFilteredData(filters, filterValues)
}

const viewOnMap = (data: TableSlotDefault) => {
  if (data.row.geom) {
    push({
      path: '/settlement/map/:id',
      name: 'SettlementMap',
      params: { id: data.row.id }
    })
  } else {
    ElMessage({
      message: 'This Settlement does not have the boundary defined in the database!',
      type: 'warning',
    })
  }
}

const handleViewOnMap = (data) => {
  console.log(data)
  if (data.geom || data.hasGeom) {
    push({
      path: '/settlement/map/:id',
      name: 'SettlementMap',
      params: { id: data.id }
    })
  } else {
    ElMessage({
      message: 'This Settlement does not have the boundary defined in the database!',
      type: 'warning',
    })
  }
}

const showPagination = ref(true)

const getFilteredBySearchData = async (tab, searchKey) => {
  if (selectedCounty.value.length > 0) {
    var selectOption = 'county_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    var index = filters.value.indexOf(selectOption)
    if (filterValues[index]) {
      filterValues.value.splice(index, 1)
    }
    if (!filterValues.value.includes(selectedCounty.value)) {
      filterValues.value.splice(index, 0, selectedCounty.value)
    }
    if (selectedCounty.value.length === 0) {
      filters.value.splice(index, 1)
    }
  }
  if (selectedSubCounty.value.length > 0) {
    var selectOption = 'subcounty_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    var index = filters.value.indexOf(selectOption)
    if (filterValues[index]) {
      filterValues.value.splice(index, 1)
    }
    if (!filterValues.value.includes(selectedSubCounty.value)) {
      filterValues.value.splice(index, 0, selectedSubCounty.value)
    }
    if (selectedSubCounty.value.length === 0) {
      filters.value.splice(index, 1)
    }
  }
  pushRoleFilters()
  const formData = {}
  formData.limit = pageSize.value
  formData.page = page.value
  formData.curUser = 1
  formData.model = model
  formData.searchField = 'name'
  formData.searchKeyword = searchKey
  formData.returnAll = true
  formData.filters = filters.value
  formData.filterValues = filterValues.value
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = nested_models
  const res = await searchByKeyWord(formData)
  searchLoading.value = false
  if (tab === 'Approved') {
    tableDataList.value = res.data
    totalApproved.value = res.Total
  } else if (tab === 'New') {
    tableDataListNew.value = res.data
    totalPending.value = res.Total
  } else if (tab === 'Decommissioned') {
    decommSettlements.value = res.data
    decommSettlementsCount.value = res.Total
  } else {
    tableDataListRejected.value = res.data
    totalRejected.value = res.Total
  }
  total.value = res.total
  loading.value = false
}

const searchLoading = ref(false)

const searchByNewName = async () => {
  const query = search_string.value?.trim();

  if (!query || query.length < 4) {
    ElMessage.warning("Please enter at least 4 characters to search.");
    return;
  }

  filters.value.push('isActive');
  filterValues.value.push(['true']);
  searchLoading.value = true;

  await getFilteredBySearchData(activeSegment.value, query);

  saveFiltersToStorage();
}; 


const countiesOptions = ref([])

const getCountyNames = async () => {
  const res = await getListWithoutGeo({
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
      var countyOpt = {}
      countyOpt.value = arrayItem.id
      countyOpt.label = arrayItem.name
      countiesOptions.value.push(countyOpt)
    })
  })
}

getCountyNames()

const wardOptions = ref([])
const subcountiesOptions = ref([])

const getSubCountyNames = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1,
      model: 'subcounty',
      searchField: 'county_id',
      searchKeyword: selectedCounty.value,
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    var ret = response.data
    subcountiesOptions.value = []
    loading.value = false
    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var subcountyOpt = {}
      subcountyOpt.value = arrayItem.id
      subcountyOpt.county_id = arrayItem.county_id
      subcountyOpt.label = arrayItem.name
      subcountiesOptions.value.push(subcountyOpt)
    })
  })
}

const getWardNames = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1,
      model: 'ward',
      searchField: 'subcounty_id',
      searchKeyword: selectedSubCounty.value,
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    var ret = response.data
    wardOptions.value = []
    loading.value = false
    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var opt = {}
      opt.value = arrayItem.id
      opt.label = arrayItem.name
      wardOptions.value.push(opt)
    })
  })
}

const filterByCounty = async (county_id: any) => {
  if (county_id) {
    enableSubcounty.value = true
    selectedCounty.value = county_id
    value4.value = county_id
    await getSubCountyNames()
  } else {
    selectedCounty.value = []
    value4.value = []
  }
  value5.value = []
  value6.value = []
  saveFiltersToStorage();
  if (search_string.value) {
    await getFilteredBySearchData(activeSegment.value, search_string.value)
  } else {
    await getNewOrRejectedSettlements(activeSegment.value)
  }
}

const filterBySubCounty = async (subcounty_id: any) => {
  if (subcounty_id) {
    selectedSubCounty.value = subcounty_id
    value5.value = subcounty_id
    await getWardNames()
  } else {
    selectedSubCounty.value = []
    value5.value = []
  }
  value6.value = []
  saveFiltersToStorage();
  if (search_string.value) {
    await getFilteredBySearchData(activeSegment.value, search_string.value)
  } else {
    await getNewOrRejectedSettlements(activeSegment.value)
  }
}

const filterByWard = async (ward_id: any) => {
  if (ward_id) {
    selectedWard.value = ward_id
    value6.value = ward_id
  } else {
    selectedWard.value = []
    value6.value = []
  }
  saveFiltersToStorage();
  if (search_string.value) {
    await getFilteredBySearchData(activeSegment.value, search_string.value)
  } else {
    await getNewOrRejectedSettlements(activeSegment.value)
  }
}

getAllSetllementsInitially('Approved')

const typeOptions = [
  { value: 1, label: 'Slum' },
  { value: 2, label: 'Informal Settlement' },
]

const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ruleForm.model = model
      const result = await updateOneRecord(ruleForm)
      var updatedObject = result.data
      if (activeSegment.value === 'Approved') {
        const index = tableDataList.value.findIndex(obj => obj.id === updatedObject.id);
        const updatedKeys = Object.keys(updatedObject);
        for (const key of updatedKeys) {
          tableDataList.value[index][key] = updatedObject[key];
        }
      } else if (activeSegment.value === 'New') {
        const index = tableDataListNew.value.findIndex(obj => obj.id === updatedObject.id);
        const updatedKeys = Object.keys(updatedObject);
        for (const key of updatedKeys) {
          tableDataListNew.value[index][key] = updatedObject[key];
        }
      } else if (activeSegment.value === 'Rejected') {
        const index = tableDataListRejected.value.findIndex(obj => obj.id === updatedObject.id);
        const updatedKeys = Object.keys(updatedObject);
        for (const key of updatedKeys) {
          tableDataListRejected.value[index][key] = updatedObject[key];
        }
      }
    } else {
      console.log('error in editing!', fields)
    }
  })
}

const handleClose = () => {
  showAddSaveButton.value = true
  showEditSaveButton.value = false
  ruleForm.name = null
  ruleForm.county_id = null
  ruleForm.population = null
  ruleForm.area = null
  ruleForm.description = null
  formheader.value = 'Add Settlement'
  AddDialogVisible.value = false
}

const AddSettlement = () => {
  push({ name: 'AddSettlementX' })
}

const AddDialogVisible = ref(false)
const formHeader = ref('Edit Settlement')

const editSettlement = (data: TableSlotDefault) => {
  push({
    name: 'AddSettlementX',
    query: { id: data.row.id }
  });
  showEditSaveButton.value = true
  ruleForm.id = data.row.id
  ruleForm.name = data.row.name
  ruleForm.county_id = data.row.county_id
  ruleForm.settlement_type = data.row.settlement_type
  ruleForm.population = data.row.population
  ruleForm.area = data.row.area
  ruleForm.description = data.row.description
  ruleForm.code = data.row.code
  ruleForm.dist_town = data.row.dist_town
  ruleForm.dist_trunk = data.row.dist_trunk
  ruleForm.parcel_no = data.row.parcel_no
  ruleForm.parcel_owner = data.row.parcel_owner
  ruleForm.rim_no = data.row.rim_no
  ruleForm.isApproved = data.row.isApproved
  ruleForm.subcounty_id = data.row.subcounty_id
  ruleForm.ward_id = data.row.ward_id
  ruleForm.geom = data.row.geom
  fileUploadList.value = data.row.documents
  selectedCounty.value = data.row.county_id
  selectedSubCounty.value = data.row.subcounty_id
  selectedWard.value = data.row.ward_id
  value4.value = data.row.county_id
  value5.value = data.row.subcounty_id
  value6.value = data.row.ward_id
  saveFiltersToStorage();
  getSubCountyNames()
  getWardNames()
}

const handleEdit = (data) => {
  push({
    name: 'AddSettlementX',
    query: { id: data.id }
  });
  showEditSaveButton.value = true
  ruleForm.id = data.id
  ruleForm.name = data.name
  ruleForm.county_id = data.county_id
  ruleForm.settlement_type = data.settlement_type
  ruleForm.population = data.population
  ruleForm.area = data.area
  ruleForm.description = data.description
  ruleForm.code = data.code
  ruleForm.dist_town = data.dist_town
  ruleForm.dist_trunk = data.dist_trunk
  ruleForm.parcel_no = data.parcel_no
  ruleForm.parcel_owner = data.parcel_owner
  ruleForm.rim_no = data.rim_no
  ruleForm.isApproved = data.isApproved
  ruleForm.subcounty_id = data.subcounty_id
  ruleForm.ward_id = data.ward_id
  ruleForm.geom = data.geom
  fileUploadList.value = data.documents
  selectedCounty.value = data.county_id
  selectedSubCounty.value = data.subcounty_id
  selectedWard.value = data.ward_id
  value4.value = data.county_id
  value5.value = data.subcounty_id
  value6.value = data.ward_id
  saveFiltersToStorage();
  getSubCountyNames()
  getWardNames()
}

const DeleteSettlement = (data: TableSlotDefault) => {
  let formData = {}
  formData.id = data.id
  formData.model = model
  DeleteRecord(formData).then(response => {
    let index = tableDataList.value.indexOf(data);
    if (index !== -1) {
      tableDataList.value.splice(index, 1);
    }
  }).catch(error => {
    console.log(error)
  });
  if (data.documents.length > 0) {
    formData.filesToDelete = data.documents
    deleteDocument(formData)
  }
}

const handleDelete = (data: TableSlotDefault) => {
  let formData = {}
  formData.id = data.id
  formData.model = model
  DeleteRecord(formData).then(response => {
    let index = tableDataList.value.indexOf(data);
    if (index !== -1) {
      tableDataList.value.splice(index, 1);
    }
  }).catch(error => {
    console.log(error)
  });
  if (data.documents.length > 0) {
    formData.filesToDelete = data.documents
    deleteDocument(formData)
  }
}

const showSelectFields = ref(false)
const selectedFields = ref([])

const getFilteredDownloadData = async (selFilters, selfilterValues) => {
  const formData = {}
  formData.model = model
  formData.searchField = 'name'
  formData.searchKeyword = ''
  formData.assocModel = associated_Model
  formData.filters = selFilters
  formData.filterValues = selfilterValues
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = nested_models
  formData.dateRange = dateRange.value


  const res = await getSettlementListByCounty(formData)
  return res.data
}

const handleDownloadSelectFields = async () => {
  if (selectedFields.value.length < 1) {
    ElMessage.warning('Specify the fields you want on the exported file')
    return
  }
  let dataToDownload = []
  if (filters.value.length > 2 && filterValues.value.length > 1) {
    const downData = await getFilteredDownloadData(filters.value, filterValues.value)
    downData.forEach(function (arrayItem) {
      var dd = flattenJSON(arrayItem)
      dataToDownload.push(dd)
    })
  } else {
    dataToDownload.push(...flattenedData.value)
  }
  let fields = []
  for (let i = 0; i < selectedFields.value.length; i++) {
    var fld = {}
    fld.label = selectedFields.value[i]
    fld.value = selectedFields.value[i]
    fields.push(fld)
  }
  var dataObj = {}
  dataObj.sheet = 'data'
  dataObj.columns = fields
  let dataHolder = []
  for (let i = 0; i < dataToDownload.length; i++) {
    let thisRecord = {}
    thisRecord.index = i + 1
    for (let j = 0; j < fields.length; j++) {
      var fld = fields[j].label
      thisRecord[fld] = dataToDownload[i][fld]
    }
    dataHolder.push(thisRecord)
  }
  dataObj.content = dataHolder
  let settings = {
    fileName: model,
    writeMode: "writeFile",
    writeOptions: {},
  }
  xlsx([dataObj], settings)
}

const dialogWidth = ref(isMobile.value ? "90%" : "25%")
const actionColumnWidth = ref(isMobile.value ? "80px" : "200px")

const getDocumentTypes = async () => {}
getDocumentTypes()

const readShp = async (file) => {
  readShapefileAndConvertToGeoJSON(file)
    .then((geojson) => {
      if (geojson.length != 1) {
        ElMessage.warning('Please upload a file with only one feature. This one has ' + geojson.length + ' features')
      } else {
        let geom = {
          type: geojson[0].geometry.type,
          coordinates: geojson[0].geometry.coordinates
        }
        ruleForm.geom = geom
      }
    })
    .catch((error) => {
      console.error(error)
      ElMessage.error('Invalid shapefiles. Check your zipped file')
    })
}

const readJson = (event) => {
  let str = event.target.result
  let json = JSON.parse(str)
  const targetProj = "+proj=longlat +datum=WGS84 +no_defs"
  let sourceProj
  let epsgCode
  let crsProp = json.crs ? json.crs.properties.name : null;
  if (crsProp && crsProp.includes('EPSG')) {
    epsgCode = crsProp.match(/EPSG::(\d+)/)[1]
  } else {
    epsgCode = 4326
  }
  if (epsgCode == 21037) {
    sourceProj = "+proj=utm + zone=37 + south + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs";
  } else if (epsgCode == 21097) {
    sourceProj = "+proj=utm + zone=37 + north + a=6378249.145 + rf=293.465 + towgs84=-157,-2,-299,0,0,0,0 + units=m + no_defs";
  } else if (epsgCode == 21036) {
    sourceProj = "+proj=utm + zone=36 + south + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs";
  } else if (epsgCode == 21096) {
    sourceProj = "+proj=utm + zone=36 + north + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs";
  } else {
    sourceProj = "+proj=longlat +datum=WGS84 +no_defs"
  }
  proj4.defs("SOURCE_CRS", sourceProj);
  proj4.defs("WGS84", targetProj);
  if (json.features.length != 1) {
    ElMessage.warning('Please upload a file with only one feature. This one has ' + json.features.length + ' features')
  } else {
    const geometry = json.features[0].geometry;
    if (geometry.type === "Polygon") {
      geometry.coordinates[0] = geometry.coordinates[0].map(coordinate => {
        return proj4("SOURCE_CRS", "WGS84", coordinate);
      });
    } else if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach(polygon => {
        polygon[0] = polygon[0].map(coordinate => {
          return proj4("SOURCE_CRS", "WGS84", coordinate);
        });
      });
    }
    let geom = {
      type: json.features[0].geometry.type,
      coordinates: geometry.coordinates
    }
    ruleForm.geom = geom
  }
}

const handleUploadGeo = async (uploadFile) => {
  var fileType = uploadFile.name.split('.').pop()
  var rfile = uploadFile.raw
  let reader = new FileReader()
  if (fileType === 'geojson' || fileType === 'json') {
    reader.onload = readJson
    reader.readAsText(rfile)
  } else if (fileType === 'zip') {
    readShp(rfile)
  } else {
    ElMessage.error('Only geojson or zipped shapefiles are supported at the moment')
  }
}

const tableRowClassName = (data) => {
  if (data.row.documents.length > 0) {
    return 'warning-row'
  }
  return ''
}

const activeStep = ref(0)
const next = () => {
  if (activeStep.value++ > 2) activeStep.value = 0
}

const copyToClipboard = (code) => {
  navigator.clipboard.writeText(code)
    .then(() => {
      ElMessage({
        message: 'Code copied to clipboard!',
        type: 'success'
      });
    })
    .catch((error) => {
      console.error(error);
      ElMessage.error('Failed to copy code to clipboard');
    });
}

const hoveredRow = ref()
const showCopyIcon = (row) => {
  hoveredRow.value = row;
}
const hideCopyIcon = (row) => {
  if (hoveredRow.value === row) {
    hoveredRow.value = null;
  }
}

const isCopyIconVisible = (row) => {
  return hoveredRow.value === row;
}

const handleSelectCounty = async (county_id: any) => {
  selectedCounty.value = county_id
  ruleForm.subcounty_id = ''
  ruleForm.ward_id = ''
  await getSubCountyNames()
  saveFiltersToStorage();
}

const handleSelectSubCounty = async (subcounty_id: any) => {
  selectedSubCounty.value = subcounty_id
  ruleForm.ward_id = ''
  await getWardNames()
  saveFiltersToStorage();
}

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

function toggleComponent(row) {
  componentProps.value.data = row
  dynamicComponent.value = null;
  addMoreDocuments.value = true;
  setTimeout(() => {
    dynamicComponent.value = ChildComponent;
  }, 100);
}

const rowData = ref()
const documentComponent = defineAsyncComponent(() => import('@/views/Components/ListDocuments.vue'));
const dynamicDocumentComponent = ref();
const DocumentComponentProps = ref({
  message: 'documents',
  data: rowData.value,
  docmodel: model,
});

const expandedRowKeys = ref([])

function handleExpand(row, expandedRows) {
  dynamicDocumentComponent.value = null;
  rowData.value = row
  DocumentComponentProps.value.data = row
  setTimeout(() => {
    dynamicDocumentComponent.value = documentComponent;
  }, 100);
  if (expandedRows.includes(row)) {
    expandedRowKeys.value = [row.id]
  } else {
    expandedRowKeys.value = []
  }
}

const router = useRouter()

const goBack = () => {
  if (router) {
    router.back()
  } else {
    console.warn('Router instance not available.')
  }
}

function formatDate(row, column, cellValue) {
  if (!cellValue) return '';
  const date = new Date(cellValue);
  return date.toLocaleDateString();
}

const duplicateDialogShow = ref(false)
const selectedDuplicate = ref(null);
const map = ref();
const mapContainer = ref(null);

const showDuplicateMap = (duplicate) => {
  selectedDuplicate.value = duplicate.row;
  duplicateDialogShow.value = true;
  nextTick(() => {
    if (!map.value) {
      mapboxgl.accessToken = 'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg';
      map.value = new mapboxgl.Map({
        container: mapContainer.value,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [37.9062, -0.0236],
        zoom: 12,
      });
      map.value.on('load', () => {
        addDuplicatesToMap(duplicate.row.duplicates);
        map.value.addSource('satellite', {
          type: 'raster',
          url: 'mapbox://mapbox.satellite',
          tileSize: 256
        });
        map.value.addLayer({
          id: 'satellite-layer',
          type: 'raster',
          source: 'satellite',
          layout: {
            visibility: 'none',
          },
        });
      });
    }
  });
};

const toggleLayer = () => {
  const streetsLayerVisibility = map.value.getLayoutProperty('satellite-layer', 'visibility');
  if (streetsLayerVisibility === 'none') {
    map.value.setLayoutProperty('satellite-layer', 'visibility', 'visible');
    map.value.setStyle('mapbox://styles/mapbox/satellite-streets-v11');
  } else {
    map.value.setLayoutProperty('satellite-layer', 'visibility', 'none');
    map.value.setStyle('mapbox://styles/mapbox/streets-v11');
  }
};

const addDuplicatesToMap = (duplicates) => {
  const bounds = new mapboxgl.LngLatBounds();
  duplicates.forEach(duplicate => {
    if (duplicate.geom) {
      const geometryType = duplicate.geom.type;
      if (geometryType === 'Point') {
        bounds.extend(duplicate.geom.coordinates);
      } else if (geometryType === 'Polygon') {
        const polygon = turf.polygon(duplicate.geom.coordinates);
        const centroid = turf.centroid(polygon);
        map.value.addSource(`duplicate-${duplicate.id}`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: duplicate.geom,
          },
        });
        map.value.addLayer({
          id: `duplicate-layer-${duplicate.id}`,
          type: 'fill',
          source: `duplicate-${duplicate.id}`,
          layout: {},
          paint: {
            'fill-color': '#888888',
            'fill-opacity': 0.5,
          },
        });
        if (duplicate.geom.coordinates) {
          duplicate.geom.coordinates.forEach(ring => {
            ring.forEach(coord => {
              bounds.extend(coord);
            });
          });
        }
        bounds.extend(centroid.geometry.coordinates);
      }
    }
  });
  if (!bounds.isEmpty()) {
    map.value.fitBounds(bounds, {
      padding: { top: 50, bottom: 50, left: 50, right: 50 }
    });
  }
};

const resetDialogData = () => {
  mapContainer.value = null
  map.value = null
  selectedDuplicate.value = null
  duplicateDialogShow.value = false
}

const primaryRecord = ref()
const selectedRecords = ref([])
const toMergeRecords = ref([])
const primaryOptions = ref([]);

const mergeRecords = async () => {
  const formData = {}
  formData.model = 'settlement'
  formData.primaryId = primaryRecord.value
  formData.duplicateIds = toMergeRecords.value
  const res = await mergeDuplicates(formData)
  if (res.code == '0000') {
    const rowIndex = duplicateRecords.value.indexOf(expandedRow.value);
    if (rowIndex !== -1) {
      duplicateRecords.value.splice(rowIndex, 1);
    }
  }
  primaryRecord.value = null;
  selectedRecords.value = [];
  primaryOptions.value = [];
}

const handleSelectPrimary = () => {
  toMergeRecords.value = selectedRecords.value.map((record) => record.id).filter((id) => id !== primaryRecord.value);
}

const handleSelection = (selection) => {
  if (selection.length > 0) {
    selectedRecords.value = selection;
    primaryOptions.value = selection.map((record) => ({
      label: record.name + `( Id:${record.id})`,
      value: record.id
    }));
  } else {
    primaryRecord.value = null;
    selectedRecords.value = [];
    primaryOptions.value = [];
  }
};

const expandedRow = ref()
const onExpand = (row, expandedRows) => {
  if (expandedRows.includes(row)) {
    expandedRow.value = row
  }
}

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return duplicateRecords.value.slice(start, end);
});

function handlePageChange(page) {
  currentPage.value = page;
}

const handleRowDblClick = (row) => {
  push({
    name: 'SettlementDetails',
    params: { id: row.id }
  })
}

const activeSegment = ref('Approved')

const Statuses = ref([
  {
    label: 'Approved',
    value: 'Approved',
    icon: CircleCheck,
    count: totalApproved,
    hidden: false,
  },
  {
    label: 'New',
    value: 'New',
    icon: Message,
    count: totalPending,
    hidden: !showAdminButtons.value
  },
  {
    label: 'Rejected',
    value: 'Rejected',
    icon: CircleClose,
    count: totalRejected,
    hidden: !showAdminButtons.value
  },
  {
    label: 'Duplicates',
    value: 'Duplicates',
    icon: Warning,
    count: duplicateTotal,
    hidden: !showAdminButtons.value
  },
  {
    label: 'Decommissioned',
    value: 'Decommissioned',
    icon: Delete,
    count: decommSettlementsCount,
    hidden: !isSuperAdmin.value
  },
  {
    label: 'Deleted',
    value: 'Deleted',
    icon: Delete,
    count: deletedSettlementsCount,
    hidden: !isSuperAdmin.value
  },
])

const filteredSegments = computed(() => {
  return Statuses.value.filter(option => !option.hidden);
});

const getThisHistory = async (sett_id) => {
  try {
    const model = 'settlement_history';
    const formData = {
      model,
      searchField: 'name',
      excludeGeom: false,
      associated_multiple_models: ['users'],
      filters: ['id'],
      filterValues: [[sett_id]]
    };
    const res = await getSettlementListByCounty(formData);
    if (res && res.data) {
      thisHistory.value = res.data
    } else {
      thisHistory.value = [];
    }
  } catch (error) {
    console.error("Error fetching history:", error.message);
    throw new Error("Failed to fetch history. Please try again later.");
  }
};

const onSegmentClick = async () => {
  if (activeSegment.value === "Approved") {
    var selectOption = 'isApproved'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    var index = filters.value.indexOf(selectOption)
    if (filterValues.value[index]) {
      filterValues.value.splice(index, 1)
    }
    if (!filterValues.value.includes('Approved')) {
      filterValues.value.splice(index, 0, 'Approved')
    }
  } else if (activeSegment.value === "New") {
    var selectOption = 'isApproved'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    var index = filters.value.indexOf(selectOption)
    if (filterValues.value[index]) {
      filterValues.value.splice(index, 1)
    }
    if (!filterValues.value.includes('Pending')) {
      filterValues.value.splice(index, 0, 'Pending')
    }
  } else if (activeSegment.value === "Rejected") {
    var selectOption = 'isApproved'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    var index = filters.value.indexOf(selectOption)
    if (filterValues.value[index]) {
      filterValues.value.splice(index, 1)
    }
    if (!filterValues.value.includes('Rejected')) {
      filterValues.value.splice(index, 0, 'Rejected')
    }
  } else if (activeSegment.value === "Decommissioned") {
    var selectOption = 'isApproved'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    var index = filters.value.indexOf(selectOption)
    if (filterValues.value[index]) {
      filterValues.value.splice(index, 1)
    }
    if (!filterValues.value.includes('Decommissioned')) {
      filterValues.value.splice(index, 0, 'Decommissioned')
    }
  }
  saveFiltersToStorage();
  if (activeSegment.value != "Duplicates" && activeSegment.value != "Deleted") {
    showPagination.value = true
    await getNewOrRejectedSettlements(activeSegment.value)
  }
  if (activeSegment.value === "Duplicates") {
    showPagination.value = false
    await getPotentialDuplicates()
  }
  if (activeSegment.value === "Deleted") {
    showPagination.value = false
    await getSettlmentHistory()
  }
};

const getSettlmentHistory = async () => {
  deletedSettlements.value = []
  const model = 'settlement_history'
  const formData = {}
  formData.model = model
  formData.searchField = 'name'
  formData.excludeGeom = false
  formData.associated_multiple_models = ['users']
  formData.filters = ['change_type', 'status']
  formData.filterValues = [['Delete'], ['Open']]
  const res = await getSettlementListByCounty(formData)
  res.data.forEach((item) => {
    const beforeObject = item.changes?.before;
    if (beforeObject) {
      beforeObject.history_id = item.id;
      deletedSettlements.value.push(beforeObject);
    }
  });
  deletedSettlementsCount.value = deletedSettlements.value.length;
}

const RevertEdits = async (data: TableSlotDefault) => {
  const formData = {
    model: 'settlement',
    history_id: data.history_id,
  };
  const res = await revertHistory(formData);
};


const handleDateChange = async () => {
  // Add date range filtering logic if needed
  console.log(dateRange.value)
  if (activeSegment.value === 'Approved') {
    filters.value = [  'isApproved', 'isActive']
    filterValues.value = [ ['Approved'], ['true']]
  } else if (activeSegment.value === 'New') {
    filters.value = [  'isApproved', 'isActive']
    filterValues.value = [ ['Pending'], ['true']]
  } else if (activeSegment.value === 'Rejected') {
    filters.value = [ 'isApproved', 'isActive']
    filterValues.value = [ ['Rejected'], ['true']]
  }
  saveFiltersToStorage();
  if (search_string.value) {
    getFilteredBySearchData(activeSegment.value, search_string.value)
  } else {
    getNewOrRejectedSettlements(activeSegment.value)
  }
  
  saveFiltersToStorage();
  DateDialogVisible.value=false

};





</script>

<template>
  <el-card v-loading="loadingGetData" :element-loading-text="loadingGetDataMsg">
 
    <div v-if="dynamicComponent">
      <upload-component :is="dynamicComponent" v-bind="componentProps" />
    </div>




    <el-row :gutter="5" style=" margin-bottom:10px;">
      <el-col :xs="24" :sm="24" :md="2" :lg="2" class="max-w-200px">

        <div class="max-w-200px">
          <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
            Back
          </el-button>
        </div>
      </el-col>

      <el-col :xs="24" :sm="24" :md="12" :lg="4">
        <el-select
size="default" v-model="value4" :onChange="filterByCounty" :onClear="handleClear" multiple clearable
          filterable collapse-tags placeholder="By County" style=" margin-right: 5px;">
          <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-col>

      <el-col :xs="24" :sm="24" :md="12" :lg="4">
        <el-select
:disabled="!value5" size="default" v-model="value5" :onChange="filterBySubCounty" multiple
          clearable filterable collapse-tags placeholder="By Subcounty" style=" margin-right: 5px;">
          <el-option v-for="item in subcountiesOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-col>

      <el-col :xs="24" :sm="24" :md="12" :lg="4">
        <el-select
:disabled="!value6" size="default" v-model="value6" :onChange="filterByWard" multiple
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

        <div style="display: flex; align-items: left; gap: 5px;  ">

          <el-tooltip content="Filter By Date" placement="top">
            <el-button @click="DateDialogVisible = true">
            <Icon
              :icon="(dateRange && dateRange.length > 0)
                ? 'ph:calendar-fill'
                : 'solar:calendar-bold'"
              width="24"
              height="24"
              style="margin-left: 4px;"
            />
          </el-button>



        </el-tooltip>



          <el-tooltip content="Add Settlement" placement="top">
            <el-button v-if="showAdminButtons" :onClick="AddSettlement" type="primary" :icon="Plus" />
          </el-tooltip>
          
          <el-tooltip content="Clear" placement="top">
            <el-button @click="handleClear" type="primary">
              <Icon icon="mdi:filter-remove" />
            </el-button>
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
      <el-table
table-layout="auto" 
:data="tableDataList" @row-dblclick="handleRowDblClick" :show-overflow-tooltip="true" fit 
        style="width: 100%; margin-top: 10px;" border :row-class-name="tableRowClassName" @expand-change="handleExpand" row-key="id"   :expand-row-keys="expandedRowKeys">

        <el-table-column type="expand">
          <template #default="props">

            <div>
              <list-documents
:is="dynamicDocumentComponent" v-bind="DocumentComponentProps"
                @open-dialog="toggleComponent(props.row)" />
            </div>

          </template>
        </el-table-column>

        <el-table-column label="Id" width="80" prop="id" sortable>
          <template #default="scope">
            <div v-if="scope.row.documents.length > 0" style="display: inline-flex; align-items: center;">
              <span>{{ scope.row.id }}</span>
              <Icon icon="material-symbols:attachment" style="margin-left: 4px;" />
            </div>
          </template>
        </el-table-column>


        <el-table-column label="Name" prop="name" sortable>
          <template #default="{ row }">
            <div style="position: relative;" @mouseenter="showCopyIcon(row)" @mouseleave="hideCopyIcon(row)">
              <span>{{ row.name }}</span>

              <el-tooltip class="item" effect="dark" content="History" placement="top">
                <el-button
type="primary" v-show="isCopyIconVisible(row)" size="small" :icon="Clock" circle
                  style="position: absolute; top: 55%; right: 0; transform: translateY(-50%); margin-left: 5px;"
                  @click="handleRowDblClick(row)" />

              </el-tooltip>

            </div>


          </template>
        </el-table-column>

        <el-table-column label="Location" sortable width="400">
          <template #default="scope">
            <span>{{ scope.row.ward.name }} ward, {{ scope.row.subcounty.name }} subcounty, {{ scope.row.county.name
              }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Population" prop="population" sortable />
        <el-table-column label="Area(HA)" prop="area" sortable :formatter="row => Number(row.area).toFixed(2)" />
        <el-table-column label="Created" prop="createdAt" sortable :formatter="formatDate" />
        <el-table-column label="Code" prop="code" sortable>
          <template #default="{ row }">
            <div style="position: relative;" @mouseenter="showCopyIcon(row)" @mouseleave="hideCopyIcon(row)">
              <span>{{ row.code }}</span>
              <el-tooltip class="item" effect="dark" content="Copy" placement="top">
                <el-button
v-show="isCopyIconVisible(row)" type="information" size="small" :icon="CopyDocument" circle
                  plain
                  style="position: absolute; left: 50%;  top: 50%;  transform: translateY(-50%); margin-right: 5px;"
                  @click="copyToClipboard(row.code)" />
              </el-tooltip>

            </div>

          </template>
        </el-table-column>

        <el-table-column label="Actions" width="250">
          <template #default="{ row }">
            <!-- Example 1: Only Edit and Delete buttons -->
            <TableActions
:item="row" :buttons="action_buttons" @view-on-map="handleViewOnMap" @edit="handleEdit"
              @review="Review" @delete="handleDelete" />

          </template>
        </el-table-column>

      </el-table>

      <ElPagination
layout="sizes, prev, pager, next, total" v-model:currentPage="page"
      v-model:page-size="pageSize" :page-sizes="[5, 10, 15, 20, 50, 100]" :total="totalApproved" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />

    </div>


    <div v-if="activeSegment === 'New'">
      <el-table
:data="tableDataListNew" :show-overflow-tooltip="true" style="width: 100% ; margin-top: 10px;" border
        :row-class-name="tableRowClassName" @expand-change="handleExpand" row-key="id"   :expand-row-keys="expandedRowKeys">
        <el-table-column type="expand">
          <template #default="props">

            <div> <list-documents
:is="dynamicDocumentComponent" v-bind="DocumentComponentProps"
                @open-dialog="toggleComponent(props.row)" />
            </div>

          </template>
        </el-table-column>

        <el-table-column label="Id" width="80" prop="id" sortable>
          <template #default="scope">
            <div v-if="scope.row.documents.length > 0" style="display: inline-flex; align-items: center;">
              <span>{{ scope.row.id }}</span>
              <Icon icon="material-symbols:attachment" style="margin-left: 4px;" />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Name" width="200" prop="name" sortable />

        <el-table-column label="Location" sortable width="400">
          <template #default="scope">
            <span>{{ scope.row.ward.name }} ward, {{ scope.row.subcounty.name }} subcounty, {{ scope.row.county.name
              }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Population" prop="population" sortable />
        <el-table-column label="Area(HA)" prop="area" sortable :formatter="row => Number(row.area).toFixed(2)" />
        <el-table-column label="Created" prop="createdAt" sortable :formatter="formatDate" />

        <el-table-column label="Code" prop="code" sortable>
          <template #default="{ row }">
            <div style="position: relative;" @mouseenter="showCopyIcon(row)" @mouseleave="hideCopyIcon(row)">
              <span>{{ row.code }}</span>
              <el-tooltip class="item" effect="dark" content="Copy" placement="top">
                <el-button
v-show="isCopyIconVisible(row)" type="information" size="small" :icon="CopyDocument" circle
                  plain style="position: absolute; top: 50%; right: 0; transform: translateY(-50%); margin-right: 5px;"
                  @click="copyToClipboard(row.code)" />

              </el-tooltip>
            </div>
          </template>
        </el-table-column>


        <el-table-column label="Actions" width="300">
          <template #default="{ row }">
            <!-- Example 1: Only Edit and Delete buttons -->
            <TableActions
:item="row" :buttons="action_buttons" @edit="handleEdit" @review="Review"
              @delete="handleDelete" @view-on-map="handleViewOnMap" />

          </template>
        </el-table-column>

      </el-table>
      <ElPagination
layout="sizes, prev, pager, next, total" v-model:currentPage="page"
      v-model:page-size="pageSize" :page-sizes="[5, 10, 15, 20, 50, 100]" :total="totalPending" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
    </div>

    <div v-if="activeSegment === 'Rejected'">

      <el-table
:data="tableDataListRejected" :show-overflow-tooltip="true" style="width: 100% ; margin-top: 10px;"
        border :row-class-name="tableRowClassName" @expand-change="handleExpand" row-key="id"   :expand-row-keys="expandedRowKeys">
        <el-table-column type="expand">
          <template #default="props">
            <div m="4">
              <h3>Documents</h3>
              <div>
                <list-documents :is="dynamicDocumentComponent" v-bind="DocumentComponentProps" />
              </div>
              <el-button
style="margin-left: 10px; margin-top: 5px" size="small" v-if="showAdminButtons" type="success"
                :icon="Plus" circle @click="toggleComponent(props.row)" />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Id" width="80" prop="id" sortable>
          <template #default="scope">
            <div v-if="scope.row.documents.length > 0" style="display: inline-flex; align-items: center;">
              <span>{{ scope.row.id }}</span>
              <Icon icon="material-symbols:attachment" style="margin-left: 4px;" />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Name" width="200" prop="name" sortable />

        <el-table-column label="Location" sortable width="400">
          <template #default="scope">
            <span>{{ scope.row.ward.name }} ward, {{ scope.row.subcounty.name }} subcounty, {{ scope.row.county.name
              }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Population" prop="population" sortable />
        <el-table-column label="Area(HA)" prop="area" sortable :formatter="row => Number(row.area).toFixed(2)" />
        <el-table-column label="Created" prop="createdAt" sortable :formatter="formatDate" />

        <el-table-column label="Code" prop="code" sortable>
          <template #default="{ row }">
            <div style="position: relative;" @mouseenter="showCopyIcon(row)" @mouseleave="hideCopyIcon(row)">
              <span>{{ row.code }}</span>
              <el-tooltip class="item" effect="dark" content="Copy" placement="top">
                <el-button
v-show="isCopyIconVisible(row)" type="information" size="small" :icon="Clock" circle plain
                  style="position: absolute; top: 50%; right: 0; transform: translateY(-50%); margin-right: 5px;"
                  @click="copyToClipboard(row.code)" />
              </el-tooltip>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Actions" width="300">
          <template #default="{ row }">
            <!-- Example 1: Only Edit and Delete buttons -->
            <TableActions
:item="row" :buttons="action_buttons" @edit="handleEdit" @review="Review"
              @delete="handleDelete" @view-on-map="handleViewOnMap" />

          </template>
        </el-table-column>

      </el-table>


      <ElPagination
layout="sizes, prev, pager, next, total" v-model:currentPage="page"
      v-model:page-size="pageSize" :page-sizes="[5, 10, 15, 20, 50, 100]" :total="totalRejected" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
    </div>


    <div v-if="activeSegment === 'Decommissioned'">

        <el-table
:data="decommSettlements" :show-overflow-tooltip="true" style="width: 100% ; margin-top: 10px;"
          border :row-class-name="tableRowClassName" @expand-change="handleExpand" row-key="id"  :expand-row-keys="expandedRowKeys">
          <el-table-column type="expand">
            <template #default="props">
              <div m="4">
                <h3>Documents</h3>
                <div>
                  <list-documents :is="dynamicDocumentComponent" v-bind="DocumentComponentProps" />
                </div>
                <el-button
style="margin-left: 10px; margin-top: 5px" size="small" v-if="showAdminButtons" type="success"
                  :icon="Plus" circle @click="toggleComponent(props.row)" />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Id" width="80" prop="id" sortable>
            <template #default="scope">
              <div v-if="scope.row.documents.length > 0" style="display: inline-flex; align-items: center;">
                <span>{{ scope.row.id }}</span>
                <Icon icon="material-symbols:attachment" style="margin-left: 4px;" />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Name" width="200" prop="name" sortable />

          <el-table-column label="Location" sortable width="400">
            <template #default="scope">
              <span>{{ scope.row.ward.name }} ward, {{ scope.row.subcounty.name }} subcounty, {{ scope.row.county.name
                }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Population" prop="population" sortable />
          <el-table-column label="Area(HA)" prop="area" sortable :formatter="row => Number(row.area).toFixed(2)" />
          <el-table-column label="Created" prop="createdAt" sortable :formatter="formatDate" />

          <el-table-column label="Code" prop="code" sortable>
            <template #default="{ row }">
              <div style="position: relative;" @mouseenter="showCopyIcon(row)" @mouseleave="hideCopyIcon(row)">
                <span>{{ row.code }}</span>
                <el-tooltip class="item" effect="dark" content="Copy" placement="top">
                  <el-button
v-show="isCopyIconVisible(row)" type="information" size="small" :icon="Clock" circle plain
                    style="position: absolute; top: 50%; right: 0; transform: translateY(-50%); margin-right: 5px;"
                    @click="copyToClipboard(row.code)" />
                </el-tooltip>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Actions" width="300">
            <template #default="{ row }">
              <!-- Example 1: Only Edit and Delete buttons -->
              <TableActions
:item="row" :buttons="action_buttons" @edit="handleEdit" @review="Review"
                @delete="handleDelete" @view-on-map="handleViewOnMap" />

            </template>
          </el-table-column>

        </el-table>


        <ElPagination
layout="sizes, prev, pager, next, total" v-model:currentPage="page"
        v-model:page-size="pageSize" :page-sizes="[5, 10, 15, 20, 50, 100]" :total="decommSettlementsCount" :background="true"
        @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
    </div>




    <div v-if="activeSegment === 'Deleted'">
      <el-table table-layout="auto"  :data="deletedSettlements" :show-overflow-tooltip="true" style="width: 100% ; margin-top: 10px;"  border  >
        <el-table-column type="index" width="50" />
        <el-table-column label="Name" width="200" prop="name" sortable />     
        <el-table-column label="Population" prop="population" sortable />
        <el-table-column label="Area(HA)" prop="area" sortable :formatter="row => Number(row.area).toFixed(2)" />
        <el-table-column label="Created" prop="createdAt" sortable :formatter="formatDate" />
        <el-table-column label="Code" prop="code" sortable>
          <template #default="{ row }">
            <div style="position: relative;" @mouseenter="showCopyIcon(row)" @mouseleave="hideCopyIcon(row)">
              <span>{{ row.code }}</span>
              <el-tooltip class="item" effect="dark" content="Copy" placement="top">
                <el-button
v-show="isCopyIconVisible(row)" type="information" size="small" :icon="Clock" circle plain
                  style="position: absolute; top: 50%; right: 0; transform: translateY(-50%); margin-right: 5px;"
                  @click="copyToClipboard(row.code)" />
              </el-tooltip>
            </div>
          </template>
        </el-table-column>

        <el-table-column fixed="right" label="Operations" min-width="120">
          <template  #default="{ row }">
            <el-tooltip content="Review" placement="top">
              <el-button
type="primary" size="small" :icon="View" @click="DeleteReview(row)"
                plain />
            </el-tooltip> 
            <el-tooltip content="Restore" placement="top">
            <el-button type="warning"  size="small" :icon="RefreshLeft" @click="RevertEdits(row)" />
          </el-tooltip> 
          </template>
    </el-table-column>

      </el-table>

     

    </div>

 

    <div v-if="activeSegment === 'Duplicates'">
      <!-- Table with pagination -->
      <el-table table-layout="auto"  :data="paginatedData" @expand-change="onExpand" style="width: 100% ; margin-top: 10px;">
        <el-table-column type="expand">
          <template #default="props">
            <div m="4" style="margin-left:20px">
              <div class="mb-4 d-flex align-items-center">
                <div v-if="selectedRecords.length > 0">
                  <el-button plain @click="showDuplicateMap(props as TableSlotDefault)" :icon="Position">
                    Compare Location
                  </el-button>
                  <el-select
v-model="primaryRecord" placeholder="Select record to merge to"
                    :onChange="handleSelectPrimary" style="width: 290px; margin-left: 10px;">
                    <el-option
v-for="option in primaryOptions" :key="option.value" :label="option.label"
                      :value="option.value" />
                  </el-select>
                  <el-button
plain @click="mergeRecords" v-if="props.row.duplicates.length > 1"
                    style="margin-left: 10px;">
                    <Icon icon="flowbite:merge-cells-outline" style="margin-left: 4px;" /> Merge
                  </el-button>
                </div>
              </div>

              <el-table  table-layout="auto" :data="props.row.duplicates" @selection-change="handleSelection" border>
                <el-table-column type="selection" />
                <el-table-column label="Id" prop="id" />
                <el-table-column label="Name" prop="name" sortable />
                <el-table-column label="Population" prop="population" />
                <el-table-column label="Area(HA)" prop="area" sortable :formatter="row => Number(row.area).toFixed(2)" />
                <el-table-column label="Code" prop="code" />
                <el-table-column label="Created" prop="createdAt" sortable :formatter="formatDate" />
                <el-table-column fixed="right" label="Actions" :width="actionColumnWidth">
                  <template #default="scope">
                    <el-dropdown v-if="isMobile">
                      <span class="el-dropdown-link">
                        <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
                      </span>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item
v-if="showAdminButtons" @click="editSettlement(scope as TableSlotDefault)"
                            :icon="Edit">Edit</el-dropdown-item>
                          <el-dropdown-item
@click="viewOnMap(scope as TableSlotDefault)"
                            :icon="Position">Map</el-dropdown-item>
                          <el-dropdown-item
v-if="showAdminButtons"
                            @click="DeleteSettlement(scope.row as TableSlotDefault)" :icon="Delete"
                            color="red">Delete</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                    <div v-else>
                      <el-tooltip content="View on Map" placement="top">
                        <el-button
type="warning" size="small" :icon="Position"
                          @click="viewOnMap(scope as TableSlotDefault)" circle :disabled="!scope.row.geom" />
                      </el-tooltip>
                      <el-tooltip content="Delete" placement="top">
                        <el-popconfirm
width="300" confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled"
                          icon-color="#626AEF" title="Are you sure to delete this settlement?"
                          @confirm="DeleteSettlement(scope.row as TableSlotDefault)">
                          <template #reference>
                            <el-button v-if="showAdminButtons" type="danger" size="small" :icon="Delete" circle />
                          </template>
                        </el-popconfirm>
                      </el-tooltip>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="County" prop="parent" sortable />
      </el-table>

      <!-- Pagination -->
      <el-pagination
background class="mt-4" layout="prev, pager, next, jumper" :total="duplicateRecords.length"
        :page-size="pageSize" @current-change="handlePageChange" />





    </div>
 








    <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formheader" :width="dialogWidth" draggable>
      <el-steps :active="activeStep" finish-button-center simple style="margin-bottom: 10px;">
        <el-step description="Basic Info" :icon="Loading" />
        <el-step description="Details" :icon="Setting" />
        <el-step description="Geometry" :icon="Position" />

      </el-steps>




      <el-row :gutter="10">
        <el-col v-show="activeStep === 0" :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
          <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-position="left">
            <el-form-item label="County" prop="county_id">
              <el-select
v-model="ruleForm.county_id" filterable placeholder="Select County"
                :onChange="handleSelectCounty">
                <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>

            <el-form-item label="Sub County" prop="subcounty_id">
              <el-select
v-model="ruleForm.subcounty_id" filterable placeholder="Select Subcounty"
                :onChange="handleSelectSubCounty">
                <el-option
v-for="item in subcountiesOptions" :key="item.value" :label="item.label"
                  :value="item.value" />
              </el-select>
            </el-form-item>

            <el-form-item label="Ward" prop="ward_id">
              <el-select v-model="ruleForm.ward_id" filterable placeholder="Select ward">
                <el-option v-for="item in wardOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>


            <el-form-item label="Name">
              <el-input v-model="ruleForm.name" />
            </el-form-item>
            <el-form-item label="Type" prop="settlement_type">
              <el-select v-model="ruleForm.settlement_type" filterable placeholder="Select type">
                <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Population">
              <el-input-number v-model="ruleForm.population" />
            </el-form-item>
            <el-form-item label="Area(ha)">
              <el-input-number v-model="ruleForm.area" />
            </el-form-item>
          </el-form>
        </el-col>

        <el-col v-show="activeStep === 1" :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
          <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-position="left">
            <el-form-item label="Dist. to Nearest Urban Center(Km.)" prop="dist_town" label-width="240px">
              <el-input-number v-model="ruleForm.dist_town" />
            </el-form-item>
            <el-form-item label="Dist.to Nearest Trunk Road(Km.)" prop="dist_trunk" label-width="240px">
              <el-input-number v-model="ruleForm.dist_trunk" />
            </el-form-item>


            <el-form-item label="Parcel Number" prop="parcel_no">
              <el-input v-model="ruleForm.parcel_no" />
            </el-form-item>

            <el-form-item label="Parcel owner" prop="parcel_owner">
              <el-input v-model="ruleForm.parcel_owner" />
            </el-form-item>

            <el-form-item label="RIM Ref." prop="rim_no">
              <el-input v-model="ruleForm.rim_no" />
            </el-form-item>
            <el-form-item label="Description">
              <el-input maxlength="200" type="textarea" v-model="ruleForm.description" />
            </el-form-item>
          </el-form>

        </el-col>




        <el-col v-show="activeStep === 2" :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
          <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-position="left">
            <el-form-item label="Geometry">
              <el-upload :on-change="handleUploadGeo" multiple :limit="3" :auto-upload="false">
                <el-button type="primary">Click to upload</el-button>
                <template #tip>
                  <div class="el-upload__tip">
                    geojson or zipped shapefile
                  </div>
                </template>
              </el-upload>
            </el-form-item>
          </el-form>
        </el-col>
      </el-row>
      <template #footer>
        <span class="dialog-footer space-between">
          <el-row :gutter="10">

            <el-col :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
              <el-button @click="next">Next</el-button>

              <el-button @click="AddDialogVisible = false">Cancel</el-button>
              <el-button v-if="showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>
            </el-col>
          </el-row>
        </span>
      </template>
    </el-dialog>



    <el-dialog v-model="showSelectFields" title="Select Fields" width="50%">
      <el-row>
        <el-col :span="6" v-for="(field, index) in model_fields" :key="index">
          <el-checkbox v-model="selectedFields" :label="field">{{ field }}</el-checkbox>
        </el-col>
      </el-row>
      <el-button type="success" @click="handleDownloadSelectFields()">Download</el-button>
    </el-dialog>



    <el-dialog v-model="ShowReviewDialog" @close="handleClose" :title="formHeader" :width="reviewWindowWidth" draggable>
      <el-descriptions title="" direction="vertical" :column="2" size="small" border>
        <el-descriptions-item label="Name">{{ settlement_raw.name }}</el-descriptions-item>
        <el-descriptions-item label="Area(Ha)" :span="2">{{ settlement_raw.area }}</el-descriptions-item>
        <el-descriptions-item label="Population">{{ settlement_raw.population }}</el-descriptions-item>
        <el-descriptions-item label="Description"> {{ settlement_raw.description }} </el-descriptions-item>
        <el-descriptions-item label="Submitted By"> {{ settlement_raw.user }} </el-descriptions-item>
        <el-descriptions-item label="Date"> {{ settlement_raw.date }} </el-descriptions-item>

        <el-descriptions-item   v-if="activeSegment === 'Deleted'"  label="Deleted By"> {{ settlement_raw.user }} </el-descriptions-item>
        <el-descriptions-item   v-if="activeSegment === 'Deleted'"  label="Date Deleted"> {{ settlement_raw.delete_date }} </el-descriptions-item>
 

      </el-descriptions>
      <template #footer>
        <span v-if="showAdminButtons &&  activeSegment != 'Deleted'" class="dialog-footer">
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

  </el-card>




  <!-- Dialog for displaying the map -->
  <el-dialog v-model="duplicateDialogShow" @close="resetDialogData" title="Potential Duplicate Locations">
    <div ref="mapContainer" class="map-container"></div>
    <el-button @click="toggleLayer" style="margin-top: 10px;">
      Toggle Satellite View
    </el-button>
  </el-dialog>

  <el-dialog
        title="Filter by Create Date"
        v-model="DateDialogVisible"
        width="30%" >
        <el-form   ref="dateFormRef">
          <el-form-item label="Date Range">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              unlink-panels
              range-separator="To"
              start-placeholder="Start date"
              end-placeholder="End date"
              size="default"
              style="width: 100%;"
              @change="handleDateChange"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="DateDialogVisible=false">Cancel</el-button>
            <el-button type="primary" @click="handleDateChange">Confirm</el-button>
          </span>
        </template>
    </el-dialog>

</template>



<style scoped>
.basemap {
  width: 100%;
  height: 75vh;
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

.item {
  margin-top: 10px;
  margin-right: 40px;
}


.demo-tabs>.el-tabs__content {
  padding: 32px;
  color: #6b778c;
  font-size: 32px;
  font-weight: 600;
}

.demo-tabs .custom-tabs-label .el-icon {
  vertical-align: middle;
}

.demo-tabs .custom-tabs-label span {
  vertical-align: middle;
  margin-left: 4px;
}

.custom-tab.is-active {
  color: red;
}
</style>


<style>
.el-col {
  border-radius: 4px;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
}


.map-container {
  width: 100%;
  height: 650px;
  /* Set the height of the map container */
}
</style>

<style scoped>
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
</style>