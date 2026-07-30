<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { getSettlementListByCounty, uploadFilesBatch } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { ElButton, ElMessageBox, ElSelect, ElSelectV2, ElTreeSelect, ElStep, ElSteps, FormInstance, ElCard, ElTour, ElTourStep, ElText,ElSwitch } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Plus,
  Edit,
  Delete, CircleCloseFilled,
  UploadFilled,
  Position, Back,
  InfoFilled,
  Filter,
  Download,
  Files,
  View,
  Search
} from '@element-plus/icons-vue'

import { ref, reactive, onMounted, computed } from 'vue'
import {
  ElPagination, ElInputNumber, ElTable,
  ElTableColumn, ElDropdown, ElDropdownItem, ElDropdownMenu,
  ElDatePicker, ElTooltip, ElOption, ElDialog, ElDrawer, ElForm, ElFormItem, ElUpload, ElInput, FormRules, ElPopconfirm, ElCol, ElRow, ElDescriptions, ElDescriptionsItem, ElBadge
} from 'element-plus'

import { useRouter } from 'vue-router'
import { useCache } from '@/hooks/web/useCache'
import { userHasPrivilegedNationalLocation } from '@/utils/roleScope'
import { CreateRecord, DeleteRecord, updateOneRecord, deleteDocument, searchByKeyWord } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import type { UploadProps, UploadUserFile } from 'element-plus'
import readXlsxFile from 'read-excel-file'
import xlsx from "json-as-xlsx"
import { getModelSpecs } from '@/api/fields'
import { BatchImportUpsert } from '@/api/settlements'
import { UserType } from '@/api/register/types'
import { Icon } from '@iconify/vue';
import { getOneGeo } from '@/api/settlements'


import UploadComponent from '@/views/Components/UploadComponent.vue';
import { defineAsyncComponent } from 'vue';
import ListDocuments from '@/views/Components/ListDocuments.vue';
import DocumentDrawer from '@/views/Components/DocumentDrawer.vue';

import DownloadCustom from '@/views/Components/DownloadCustom.vue';
import TableActions from '@/views/Components/TableActions.vue';
import DownloadAll from '@/views/Components/DownloadAll.vue';


//import downloadForOfflineRounded from '@iconify-icons/material-symbols/download-for-offline-rounded';

import { MapboxLayerSwitcherControl } from "mapbox-layer-switcher";
import "mapbox-layer-switcher/styles.css";
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import * as turf from '@turf/turf'
import { useAppStore } from '@/store/modules/app'
import PermissionWrapper from '@/components/PermissionWrapper.vue';
import AdjustableTableColumnPicker from '@/components/Users/AdjustableTableColumnPicker.vue'
import { Icon as AppIcon } from '@/components/Icon'
import { useAdjustableTableColumns, type AdjustableColumnSetting } from '@/composables/useAdjustableTableColumns'
import { getProgrammesList, getComponentsList } from '@/api/project-locations-optimized'


const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = MapBoxToken;




const { wsCache } = useCache()
const appStore = useAppStore()
const userInfo = wsCache.get(appStore.getUserInfo)

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

// Check if user should be restricted to their county
const isCountyRestricted = computed(() => {
  return !isSuperAdmin.value && !hasNationalAccess.value && !!userCountyId.value
})

console.log('indicator_category_report.vue - User location info:', {
  isSuperAdmin: isSuperAdmin.value,
  hasNationalAccess: hasNationalAccess.value,
  userCountyId: userCountyId.value,
  isCountyRestricted: isCountyRestricted.value
})

const getProjectLocationOptionLabel = (item: Record<string, any>) => {
  const primary =
    item.settlement?.name ??
    item.settlementName ??
    item.location_name
  if (primary) return primary
  if (item.ward?.name && item.county?.name) return `${item.ward.name}, ${item.county.name}`
  if (item.county?.name) return item.county.name
  return item.id ? `Location #${item.id}` : 'Unknown location'
}

const getProjectLocationOptionSubLabel = (item: Record<string, any>) => {
  const ward = item.ward?.name ?? item.settlement?.ward?.name ?? ''
  const subcounty = item.subcounty?.name ?? item.settlement?.subcounty?.name ?? ''
  const county = item.county?.name ?? item.settlement?.county?.name ?? ''
  return [ward, subcounty, county].filter(Boolean).join(', ')
}

// Label the location with the level it was reported at, e.g. "Kibera Settlement",
// "Langata Subcounty" — the most specific level present wins.
const getRowSettlementLabel = (row: Record<string, any>) => {
  const settlement = row.settlement?.name ?? row.project_location?.settlement?.name
  if (settlement) return `${settlement} Settlement`

  const ward = row.ward?.name ?? row.project_location?.ward?.name
  if (ward) return `${ward} Ward`

  const subcounty = row.subcounty?.name ?? row.project_location?.subcounty?.name
  if (subcounty) return `${subcounty} Subcounty`

  const county = row.county?.name ?? row.project_location?.county?.name
  if (county) return `${county} County`

  if (row.project_location?.location_name) return row.project_location.location_name
  if (row.settlement_id) return `Settlement #${row.settlement_id}`
  return 'National'
}

const applyProjectLocationFields = (selected: Record<string, any> | undefined | null) => {
  if (!selected) return
  // project_location only carries its own county/subcounty/ward FKs when location_type
  // matches that level; for a settlement-level location, fall back to the settlement's
  // own hierarchy (nested by the backend alongside project_location).
  ruleForm.county_id = selected.county_id ?? selected.county?.id ?? selected.settlement?.county?.id ?? null
  ruleForm.subcounty_id = selected.subcounty_id ?? selected.subcounty?.id ?? selected.settlement?.subcounty?.id ?? null
  ruleForm.ward_id = selected.ward_id ?? selected.ward?.id ?? selected.settlement?.ward?.id ?? null
  ruleForm.settlement_id = selected.settlement_id ?? selected.settlement?.id ?? null
  ruleForm.geom = selected.geom ?? null
}

const ensureLocationFieldsFromSelection = () => {
  if (!ruleForm.project_location_id || isNationalProject.value) return
  const selected = project_locations.value.find((item) => item.id === ruleForm.project_location_id)
  applyProjectLocationFields(selected)
}

const isReportNew = (row: Record<string, any>) => (row.status || 'New') === 'New'

const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)
const downloadLoading = ref(false)

 
console.log("userInfo--->", userInfo)

console.log("showAdminButtons--->", showAdminButtons.value)


const action_buttons = ref([])
if (showAdminButtons.value) {
  action_buttons.value = ['edit', 'delete', 'viewOnMap', 'review']
} else if (showEditButtons.value) {

  action_buttons.value = ['edit', 'viewOnMap', 'review']
}
else {
  action_buttons.value = ['viewOnMap']

}






const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])


const categories = ref([])
const filteredIndicators = ref([])
const page = ref(1)

const selCounties = []
const currentPage = ref(1)
const total = ref(0)


const mobileBreakpoint = 768;
const defaultPageSize = 5;
const mobilePageSize = 5;
const pageSize = ref(defaultPageSize);

// Function to update pageSize based on window width
const updatePageSize = () => {
  if (window.innerWidth <= mobileBreakpoint) {
    pageSize.value = mobilePageSize;
  } else {
    pageSize.value = defaultPageSize;
  }
};

onMounted(async () => {


  window.addEventListener('resize', updatePageSize);
  updatePageSize(); // Initial check


})






// Function to empty all fields in ruleForm
function emptyRuleForm() {
  for (const key in ruleForm) {
    ruleForm[key] = null;
  }
}

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  indicator_category_id: [],
  indicators: [],
  baseline: 0,
  target: 0,
  project_id: null,
  project_location_id: null,
  activity_id: null,
  programme_implementation_id: null,
  settlement_id: null,
  subcounty_id: null,
  ward_id: null,
  county_id: null,
  period: getQuarter,
  date: new Date(),
  progress: 0,
  amount: 0,
  files: '',
  project_status: '',
  disbursement: 0,
  userId: userInfo.id,
  code: '',
  cumDisbursement: 0,
  cumProgress: 0,
  prevAmount: 0,
  cumAmount: 0,
  comments: '',
  units: 'Quantity',
  qualitative:'',
  cumUnits: 'Cumulative(qty)',
  status: '',
  reject_msg: '',
})

const rules = reactive<FormRules>({
  project_id: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],

  project_location_id: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],


  activity_id: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],

  indicator_category_id: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],




  amount: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],

  date: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],


  // comments: [
  //   { required: true, message: 'Required', trigger: 'blur' },
  // ],



})




const AddDialogVisible = ref(false)
const ImportDialogVisible = ref(false)
const ReviewDialog = ref(false)
const RejectDialog = ref(false)
const rejectReason = ref('')
const formHeader = ref('Add M&E Report')
const showSubmitBtn = ref(false)
const showProcessBtn = ref(true)
const addMoreDocuments = ref(false)




let tableDataList = ref<UserType[]>([])

// One "filing" = one bulk submission; all its per-indicator reports share a code.
// Older/imported rows without a shared code fall back to standalone one-report filings.
const filingGroups = computed(() => {
  const groups = new Map<string, { code: string; first: Record<string, any>; reports: any[] }>()
  for (const row of tableDataList.value as any[]) {
    const key = row.code || `report-${row.id}`
    let group = groups.get(key)
    if (!group) {
      group = { code: key, first: row, reports: [] }
      groups.set(key, group)
    }
    group.reports.push(row)
  }
  return [...groups.values()]
})

const filingStatusCounts = (group: { reports: any[] }) => {
  const counts: Record<string, number> = {}
  for (const r of group.reports) {
    const s = r.status || 'New'
    counts[s] = (counts[s] || 0) + 1
  }
  return counts
}

const statusTagType = (status: string) =>
  status === 'Approved' ? 'success' : status === 'Rejected' ? 'danger' : 'warning'

// Filing row color: any rejection needs attention first, then fully-approved,
// otherwise the filing still has pending reports.
const filingRowClassName = ({ row }: { row: { reports: any[] } }) => {
  const statuses = row.reports.map((r) => r.status || 'New')
  if (statuses.some((s) => s === 'Rejected')) return 'danger-row'
  if (statuses.every((s) => s === 'Approved')) return 'success-row'
  return ''
}
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var filterValues = []  // remember to change here!
var tblData = []
const associated_Model = ''
const model = 'indicator_category_report'
const associated_multiple_models = ['document', 'settlement', 'county', 'ward', 'subcounty', 'users', 'indicator_category', 'activity', 'project', 'project_location']
//const nested_models = ['indicator_category', 'indicator', 'category']  // The mother, then followed by the child
const nested_models = ['activity', 'project']  // The mother, then followed by the child

//// ------------------parameters -----------------------////

const fileUploadList = ref<UploadUserFile[]>([])


const fieldSet = ref([])
const show = ref(false)


const { t } = useI18n()



const handleClear = async () => {
  console.log('cleared....')

  // clear all the fileters -------
  filterValues = []
  filters = []
  value1.value = ''
  value2.value = ''
  value3.value = ''
  locationLevel.value = null
  filterProgrammeId.value = null
  reportSearchText.value = ''
  pageSize.value = 5
  currentPage.value = 1
  tblData = []
  //----run the get data--------
  getInterventionsAll()
}

const DownloadXlsx = async () => {
  console.log(tableDataList.value)

  // Define the fields for the Excel export
  let fields = [
    { label: "S/No", value: "index" },
    { label: "Indicator", value: "indicator_name" },
    { label: "Category", value: "category_title" },
    { label: "Quantity", value: "quantity" },
    { label: "Cumulative", value: "cumulative" },
    { label: "Baseline", value: "baseline" },
    { label: "Target", value: "target" },
    { label: "Progress", value: "progress" },
    { label: "Date", value: "date" },
    { label: "Comments", value: "comments" },
    { label: "Status", value: "status" }
  ]

  // Prepare the data object 
  var dataObj = {}
  dataObj.sheet = 'Indicator Category Reports'
  dataObj.columns = fields

  let dataHolder = []
  tableDataList.value.forEach((item, index) => {
    let row = {
      index: index + 1,
      indicator_name: item.indicator_category?.indicator_name || 'N/A',
      category_title: item.indicator_category?.category_title || 'N/A',
      quantity: item.quantity || 0,
      cumulative: item.cumulative || 0,
      baseline: item.baseline || 0,
      target: item.target || 0,
      progress: item.progress || 0,
      date: item.date || 'N/A',
      comments: item.comments || '',
      status: item.status || 'New'
    }
    dataHolder.push(row)
  })

  dataObj.content = dataHolder

  // Download the file
  xlsx([dataObj], { fileName: "Indicator_Category_Reports.xlsx" })
}

const handleSelectIndicatorCategory = async (indicator: any) => {
  var selectOption = 'indicator_category_id'
  if (!filters.includes(selectOption)) {
    filters.push(selectOption)
  }
  var index = filters.indexOf(selectOption) // 1
  console.log('county : index--->', index)

  // clear previously selected
  if (filterValues[index]) {
    // filterValues[index].length = 0
    filterValues.splice(index, 1)
  }

  if (!filterValues.includes(indicator) && indicator.length > 0) {
    filterValues.splice(index, 0, indicator) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
  }

  // expunge the filter if the filter values are null
  if (indicator.length === 0) {
    filters.splice(index, 1)
  }

  console.log('FilterValues:', filterValues)
  // here we filter the list of settlements based on the selected county
  filteredIndicators.value = categories.value.filter(
    (category) => category.indicator == indicator
  )
  console.log('filyterested  ------>', filteredIndicators)
  //makeprojectOptions(filteredIndicators)

  getFilteredData(filters, filterValues)
}


const onPageChange = async (selPage: any) => {
  console.log('on change change: selected counties ', selCounties)
  page.value = selPage
  getFilteredData(filters, filterValues)
}

const onPageSizeChange = async (size: any) => {
  pageSize.value = size
  getFilteredData(filters, filterValues)
}

const getInterventionsAll = async () => {
  getFilteredData(filters, filterValues)
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


const getModeldefinition = async (selModel) => {

  console.log(selModel)
  var formData = {}
  formData.model = selModel
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


}

const loading = ref(false)
const getFilteredData = async (selFilters, selfilterValues) => {

  loading.value = true
  const formData = {}
  formData.limit = pageSize.value
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = selFilters
  formData.filterValues = selfilterValues
  
  // Apply county restriction if user is county-restricted (unless super admin or national admin)
  if (isCountyRestricted.value && userCountyId.value) {
    const countyIndex = formData.filters.indexOf('county_id')
    if (countyIndex !== -1) {
      // Update existing county_id filter
      formData.filterValues[countyIndex] = [userCountyId.value]
    } else {
      // Add new county_id filter
      formData.filters.push('county_id')
      formData.filterValues.push([userCountyId.value])
    }
    console.log('Applying county restriction filter for indicator reports, county_id:', userCountyId.value)
  }
  
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = nested_models
  // Page by filing (shared code), not by individual report row
  formData.groupByCode = true

  if (filterProgrammeId.value != null) {
    formData.programmeId = filterProgrammeId.value
  }

  // Free-text search across indicator name/category and project title
  if (reportSearchText.value?.trim()) {
    formData.reportSearch = reportSearchText.value.trim()
  }

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('Reports collected........', res)
  console.log('First report item structure:', res.data?.[0])

  // tableDataList.value = res.data.filter(item => item.indicator_category.indicator_level === 'activity');

  tableDataList.value = res.data
  loading.value = false

  //tableDataList.value = res.data
  total.value = res.total


}

const projectOptions = ref([])
const projectOptionsAll = ref([])
const indicatorsOptions = ref([])
const indicatorsOptionsFiltered = ref([])

const selectedProgrammeId = ref<number | null>(null)
const selectedComponentId = ref<number | null>(null)
const programmeList = ref<Array<{ id: number; title: string; acronym: string; parentId: number | string | null }>>([])
const componentFilterOptions = ref<Array<{ value: number; label: string; programmeId: number }>>([])

const programmeTreeData = computed(() => {
  const roots = programmeList.value.filter((p) => p.parentId == null || p.parentId === '')
  return roots.map((root) => ({
    value: root.id,
    label: root.title || root.acronym,
    children: programmeList.value
      .filter((p) => String(p.parentId) === String(root.id))
      .map((p) => ({
        value: p.id,
        label: p.title || p.acronym,
      })),
  }))
})

const loadProgrammeOptions = async () => {
  try {
    const res = await getProgrammesList({})
    programmeList.value = Array.isArray(res?.data) ? res.data : []
  } catch (error) {
    console.error('Failed to load programme options:', error)
    programmeList.value = []
  }
}

const loadComponentFilterOptions = async () => {
  if (selectedProgrammeId.value == null) {
    componentFilterOptions.value = []
    return
  }
  try {
    const res = await getComponentsList({
      params: { programme_ids: String(selectedProgrammeId.value) },
    })
    const rows = Array.isArray(res?.data) ? res.data : []
    componentFilterOptions.value = rows.map((c: any) => ({
      value: c.id,
      label: c.title || c.acronym,
      programmeId: c.programme_id,
    }))
  } catch (error) {
    console.error('Failed to load component options:', error)
    componentFilterOptions.value = []
  }
}

const projectMatchesProgrammeComponent = (project: Record<string, any>) => {
  if (selectedComponentId.value != null) {
    return project.component_id === selectedComponentId.value
  }
  if (selectedProgrammeId.value != null) {
    const allowedIds = componentFilterOptions.value.map((c) => c.value)
    if (!allowedIds.length) return false
    return project.component_id != null && allowedIds.includes(project.component_id)
  }
  return true
}

const onProgrammeFilterChange = async () => {
  selectedComponentId.value = null
  prj_obj.value = null
  ruleForm.project_id = null
  ruleForm.project_location_id = null
  project_locations.value = []
  await loadComponentFilterOptions()
  projectOptions.value = getFilteredProjects('')
}

const onComponentFilterChange = () => {
  prj_obj.value = null
  ruleForm.project_id = null
  ruleForm.project_location_id = null
  project_locations.value = []
  projectOptions.value = getFilteredProjects('')
}

// Filter options and selections
const allProjectLocations = ref([])

// Location level filter: which administrative level the report was filed at.
// null scalar filters as IS NULL, '__not_null__' as IS NOT NULL (backend sentinel).
const locationLevel = ref<string | null>(null)
const reportSearchText = ref('')

// Programme filter — resolved server-side through project -> component -> programme;
// picking a parent programme includes its sub-programmes.
const filterProgrammeId = ref<number | null>(null)

const onProgrammeFilter = () => {
  page.value = 1
  currentPage.value = 1
  getFilteredData(filters, filterValues)
}

// Map needs geometry; review only applies to reports still awaiting a decision.
const rowActionButtons = (row: Record<string, any>) =>
  action_buttons.value.filter((b) => {
    if (b === 'viewOnMap') return !!row.geom
    if (b === 'review') return isReportNew(row)
    return true
  })

// Clicking anywhere on a filing row expands/collapses it, except on the row's own
// controls (e.g. the Documents button), which keep their own behaviour.
// Accordion: expand-row-keys is the single source of truth, so opening one filing
// closes any other.
const expandedFilingKeys = ref<string[]>([])

const setExpandedFiling = (code: string | null) => {
  expandedFilingKeys.value = code ? [code] : []
}

const onFilingRowClick = (row: any, _column: any, event: MouseEvent) => {
  const target = event?.target as HTMLElement | null
  if (target?.closest('button, a, input, .el-tag')) return
  setExpandedFiling(expandedFilingKeys.value.includes(row.code) ? null : row.code)
}

// Fires for the expand arrow too, keeping it in step with row clicks
const onFilingExpandChange = (row: any, expanded: boolean) => {
  setExpandedFiling(expanded ? row.code : null)
}

const locationLevelFields = ['county_id', 'subcounty_id', 'ward_id', 'settlement_id']
const levelFilterSpecs: Record<string, Record<string, any>> = {
  national: { county_id: null },
  county: { county_id: '__not_null__', subcounty_id: null, ward_id: null, settlement_id: null },
  subcounty: { subcounty_id: '__not_null__', ward_id: null, settlement_id: null },
  ward: { ward_id: '__not_null__', settlement_id: null },
  settlement: { settlement_id: '__not_null__' },
}

const hasActiveFilters = computed(
  () =>
    locationLevel.value != null ||
    filterProgrammeId.value != null ||
    reportSearchText.value.trim() !== '' ||
    filters.length > 0
)

const clearLocationFilters = () => {
  for (const field of locationLevelFields) {
    const idx = filters.indexOf(field)
    if (idx !== -1) {
      filters.splice(idx, 1)
      filterValues.splice(idx, 1)
    }
  }
}

const onLocationLevelChange = (level: string | null) => {
  clearLocationFilters()

  const spec = level ? levelFilterSpecs[level] : null
  if (spec) {
    for (const [field, value] of Object.entries(spec)) {
      filters.push(field)
      filterValues.push(value)
    }
  }

  page.value = 1
  currentPage.value = 1
  getFilteredData(filters, filterValues)
}

let searchDebounce: ReturnType<typeof setTimeout> | null = null
const onReportSearch = () => {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    page.value = 1
    currentPage.value = 1
    getFilteredData(filters, filterValues)
  }, 350)
}


const getIndicatorNames = async () => {
  console.log('getIndicatorNames >>>>>>>>>>>>>>>>>>>>>>>>>>>>');

  const formData = {
    curUser: 1,
    model: 'indicator_category',
    searchField: 'name',
    searchKeyword: '',
    assocModel: '',
    filters: [],
    filterValues: [],
    associated_multiple_models: ['category', 'activity', 'indicator'],
    nested_models: [],
  };

  const res = await getSettlementListByCounty(formData);
  console.log('indicator_category Response:', res);

  res.data.forEach((arrayItem) => {
    const opt = {
      value: arrayItem.id,
      label: `${arrayItem.indicator_name} | ${arrayItem.category.category}`,
      title: arrayItem.category.title,
      activity_id: arrayItem.activity ? arrayItem.activity.id : null,
      unit: arrayItem.indicator.unit,
    };

    indicatorsOptions.value.push(opt);
    indicatorsOptionsFiltered.value.push(opt);
  });

};

// Load every project with its project_locations bundled in one request — the backend
// nests settlement/ward/subcounty/county (and settlement's own hierarchy for
// settlement-level locations) on each project_location, so selecting a project for
// reporting needs no follow-up location fetch or client-side matching.
const loadProjectsWithLocations = async () => {
  const formData = {
    model: 'project',
    searchField: 'title',
    searchKeyword: '',
    filters: [],
    filterValues: [],
    associated_multiple_models: ['project_location'],
    returnAll: true,
  };

  const res = await getSettlementListByCounty(formData);

  projectOptionsAll.value = (res.data || []).map((project) => ({
    value: project.id,
    label: project.title,
    implementation_scope: project.implementation_scope,
    programme_implementation_id: project.implementation_id,
    component_id: project.component_id ?? null,
    project_locations: project.project_locations ?? [],
  }));
  projectOptions.value = getFilteredProjects('');
};






// Editing a filed report only changes its reported values — project, location and
// indicator are fixed at filing time, so this uses a small dedicated drawer instead
// of the multi-step add wizard.
const EditReportVisible = ref(false)
const editRow = ref<Record<string, any> | null>(null)
const editSaving = ref(false)
const editModel = reactive({
  amount: 0,
  qualitative: 'No',
  date: null as any,
  comments: '',
})

// Unit lives on `indicator`; indicatorsOptions maps indicator_category id -> unit.
const unitForIndicatorCategory = (id: number) =>
  indicatorsOptions.value.find((o: any) => o.value === id)?.unit ?? ''

const isQualitativeReport = (row: Record<string, any>) =>
  unitForIndicatorCategory(row.indicator_category_id) === 'Yes/No' ||
  ['yes', 'no', 'true', 'false'].includes(String(row.qualitative ?? '').toLowerCase())

const reportAmountDisplay = (row: Record<string, any>) => {
  if (!isQualitativeReport(row)) return row.amount ?? 0
  return ['yes', 'true', '1'].includes(String(row.qualitative ?? '').toLowerCase())
    ? 'True'
    : 'False'
}

const editIsQualitative = computed(
  () => unitForIndicatorCategory(editRow.value?.indicator_category_id) === 'Yes/No'
)

const editReport = (data: Record<string, any>) => {
  editRow.value = data
  editModel.amount = Number(data.amount ?? 0)
  editModel.qualitative = data.qualitative ?? 'No'
  editModel.date = data.date ?? new Date()
  editModel.comments = data.comments ?? ''
  EditReportVisible.value = true
}

const saveEditedReport = async () => {
  const row = editRow.value
  if (!row) return

  editSaving.value = true
  try {
    // The row's stored cumAmount already includes its own amount, so removing it
    // gives the cumulative base carried in from earlier reports.
    const base = Number(row.cumAmount ?? 0) - Number(row.amount ?? 0)
    const amount = editIsQualitative.value ? 0 : Number(editModel.amount ?? 0)
    const cumAmount = base + amount
    const target = Number(row.target ?? 0)
    const progress = target > 0 ? ((cumAmount / target) * 100).toFixed(2) : '0.00'

    await updateOneRecord({
      model,
      id: row.id,
      amount,
      qualitative: editIsQualitative.value ? editModel.qualitative : row.qualitative,
      date: editModel.date,
      comments: editModel.comments,
      cumAmount,
      cumProgress: progress,
      progress,
    })

    ElMessage.success('Report updated')
    EditReportVisible.value = false
    await getFilteredData(filters, filterValues)
    syncDrawerRow()
  } catch (error: any) {
    console.error('Failed to update report:', error)
    ElMessage.error(error.response?.data?.message || 'Failed to update report')
  } finally {
    editSaving.value = false
  }
}


const DeleteReport = (data: TableSlotDefault) => {
  console.log('----->', data)
  let formData = {}
  formData.id = data.id
  formData.model = 'indicator_category_report'


  DeleteRecord(formData)
  console.log("Docs to de;ete", data.documents.length)

  // Delete docuemnts only if there's any docuemnt to delete 
  if (data.documents.length > 0) {
    formData.filesToDelete = data.documents
    deleteDocument(formData)

    // remove the deleted object from array list 
    let index = tableDataList.value.documents.indexOf(data);
    if (index !== -1) {
      tableDataList.value.documents.value.splice(index, 1);
    }
  }


  console.log(tableDataList.value)

  // remove the deleted object from array list 
  let index = tableDataList.value.indexOf(data);
  if (index !== -1) {
    tableDataList.value.splice(index, 1);
  }

}


const currentRow = ref()

const handleClose = () => {
  showSubmitBtn.value = true
  activeStep.value = 0
  ruleForm.indicator_category_id = null
  ruleForm.date = null
  ruleForm.amount = null
  ruleForm.ward_id = null
  ruleForm.location = []
  ruleForm.indicators = []

  formHeader.value = 'Add M&E Report'
  AddDialogVisible.value = false
}


const project_locations = ref([])
const getProjectLocations = async (project_id) => {
  console.log("Get Locations for project:", project_id)

  // Locations arrive bundled with the projects (loadProjectsWithLocations), fully
  // resolved by the backend — just pick them off the selected project option.
  const bundled = projectOptionsAll.value.find((p) => p.value === project_id)
  if (bundled?.project_locations?.length) {
    project_locations.value = bundled.project_locations
    return
  }

  // Fallback (e.g. options not loaded yet): fetch this one project with its locations.
  const formData = {
    model: 'project',
    searchField: 'name',
    searchKeyword: '',
    filters: ['id'],
    filterValues: [[project_id]],
    associated_multiple_models: ['project_location']
  };

  const res = await getSettlementListByCounty(formData);

  project_locations.value = res.data?.[0]?.project_locations ?? [];
};



const getProjectActivityIndicators = async (activity_ids) => {
  const formData = {}

  formData.model = 'indicator_category'
  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------


  // - multiple filters -------------------------------------


  formData.filters = ['activity_id']
  formData.filterValues = [activity_ids]


  formData.associated_multiple_models = ['indicator']

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('This Project  Idnicator configs', res.data)
  return res.data
}

const getProjectProjectOutcomeIndicators = async () => {
  const formData = {}

  formData.model = 'indicator_category'
  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------


  // - multiple filters -------------------------------------


  formData.filters = ['indicator_level']
  formData.filterValues = ['project']


  formData.associated_multiple_models = ['indicator']

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('This Project  level  indicaors', res.data)
  return res.data
}

const getProjectActivities = async (project_id) => {
  const formData = {
    model: 'project_activity',
    searchField: 'title',
    searchKeyword: '',
    filters: ['project_id'],
    filterValues: [[project_id]],
    associated_multiple_models: [],
  };

  const res = await getSettlementListByCounty(formData);

  console.log('This Project Activiies...:', res.data);

  // Return an array of ids
  const activityIds = res.data.map(activity => activity.activity_id);

  return activityIds;
};



const disableIndicator = ref(false)
const isNationalProject = ref(false)
const prj_obj=ref()

const changeProject = async (project: any) => {

  ruleForm.project_location_id = null
  ruleForm.project_id = project.value

  let project_activities = []
  let sel_indicators = []
  let outcome_indicators = []

  console.log('changeProject', project)
  console.log('projectOptionsAll', projectOptionsAll)



  const thisProject = projectOptionsAll.value.filter(prj =>
    prj.value == project.value
  );
  console.log('thisProject', thisProject)
  if (thisProject && thisProject[0].implementation_scope == 'National') {
    isNationalProject.value = true
    console.log('isNationalProject', isNationalProject.value)


  } else {
    isNationalProject.value = false
    project_activities = await getProjectActivities(project.value)
    sel_indicators = await getProjectActivityIndicators(project_activities)

    console.log('project_activities', project_activities)

  }


  outcome_indicators = await getProjectProjectOutcomeIndicators()

  console.log('outcome_indicators', outcome_indicators)


  console.log('sel_indicators', sel_indicators)


  console.log('outcome_indicators', outcome_indicators)


  // Merging the two arrays
  // An indicator_category can be reached from both sources (activity-level and
  // project-level), so drop repeats — a duplicated option lets the same indicator be
  // picked twice, which files two reports for it.
  const merged_indicators = [...sel_indicators, ...outcome_indicators].filter(
    (item, i, arr) => arr.findIndex((other) => other.id === item.id) === i
  );

  console.log('merged_indicators', merged_indicators)

  const transformedArray = merged_indicators.map(item => {
    console.log(item)
    return {
      label: item.indicator.name + ' ' + item.category_title,
      value: item.id,
      project_id: item.project_id,
      unit: item.indicator.unit,
      activity_id: item.activity_id
    };
  });

  indicatorsOptionsFiltered.value = transformedArray

  console.log('transformedArray', transformedArray)


  const filteredOpts = projectOptionsAll.value.filter(item => item.value == project.value);

  console.log('filteredOpts', filteredOpts[0].programme_implementation_id)

  ruleForm.programme_implementation_id = filteredOpts[0].programme_implementation_id

  console.log(ruleForm)



  ruleForm.indicator_category_id = []
  ruleForm.activity_id = null



  getProjectLocations(project.value)



}




const changeLocation = async (location: any) => {
  const selected_location = project_locations.value.find(
    (item) => item.id === location
  );

  if (!selected_location) return

  // Bundled locations arrive without geom (stripped for payload size) — fetch it once
  // and cache it on the location so re-applies (e.g. on submit) keep it.
  if (!selected_location.geom) {
    try {
      const res = await getOneGeo({ model: 'project_location', id: selected_location.id })
      selected_location.geom = res.data?.[0]?.json_build_object?.features?.[0]?.geometry ?? null
    } catch (error) {
      console.error('Failed to fetch project location geometry:', error)
    }
  }

  applyProjectLocationFields(selected_location)
}



const changeIndicator = async (indicator_category_id: any) => {
  //ruleForm.indicator_category_id = indicator_category_id

  console.log('Filtre indicatorsOptionsFiltered', indicatorsOptionsFiltered)

  var filtredOptions = indicatorsOptionsFiltered.value.filter(function (el) {
    return el.value == indicator_category_id
  });


 
  ruleForm.activity_id = filtredOptions[0].activity_id



  console.log("Filtered Indicators", filtredOptions[0])
  ruleForm.units = "Quantity(" + filtredOptions[0].unit + ")"
  ruleForm.cumUnits = "Cumulative(" + filtredOptions[0].unit + ")"

  ruleForm.baseline = filtredOptions[0].baseline
  //ruleForm.target = filtredOptions[0].target

  //ruleForm.indicator_category_title = filtredOptions[0].category_title

  getCumulativeProgress(indicator_category_id)
}



function getQuarter(date = new Date()) {
  return Math.floor(date.getMonth() / 3 + 1);
}



const AddReport = () => {
  activeStep.value = 0
  AddDialogVisible.value = true
  showSubmitBtn.value = true
}

 


const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;

  await formEl.validate(async (valid, fields) => {
    if (!valid) {
      console.log('Form validation failed:', fields);
      return;
    }

    ensureLocationFieldsFromSelection()

    const submittedReportIds = [];
    // One filing = one submission; every indicator report in it shares this code.
    const filingCode = uuid.v4();

    for (const indicator of ruleForm.indicators) {
      // Calculate new cumulative amount
      const updatedCumAmount = (indicator.cumAmount || 0) + (indicator.amount || 0);

      // Calculate progress = 100 * (cumAmount / target)
      const progress = isFinite(updatedCumAmount / (indicator.target || 1))
        ? ((updatedCumAmount / indicator.target) * 100).toFixed(2)
        : '0.00';

      const reportPayload = {
        model: 'indicator_category_report',
        period: getQuarter(),
        code: filingCode,
        userId: userInfo.id,
        project_id: prj_obj.value.value,
        project_location_id: ruleForm.project_location_id,
        indicator_category_id: indicator.value,
        amount: indicator.amount || 0,
        baseline: indicator.baseline || 0,
        target: indicator.target || 0,
        date: indicator.date || new Date(),
        cumAmount: updatedCumAmount,
        cumProgress: progress,
        progress:progress,
        comments: ruleForm.comments,
        programme_implementation_id: ruleForm.programme_implementation_id,
        settlement_id: ruleForm.settlement_id,
        county_id: ruleForm.county_id,
        subcounty_id: ruleForm.subcounty_id,
        ward_id: ruleForm.ward_id,
        activity_id: indicator.activity_id,
        qualitative: indicator.qualitative,

        geom: ruleForm.geom,

 
      };

 

      // Submit individual indicator report
      const report = await CreateRecord(reportPayload);
      console.log(`Report created for indicator ${indicator.label}: ID ${report.data.id}`);

      submittedReportIds.push(report.data.id);
    }

    // Upload files for each created report
    if (submittedReportIds.length && fileUploadList.value.length) {
      let totalSkipped = 0
      for (const reportId of submittedReportIds) {
        const formData = new FormData();

        fileUploadList.value.forEach((file) => {
          formData.append('files', file.raw);
          formData.append('format', file.name.split('.').pop());
          formData.append('field_id', 'report_id');
          formData.append('category', 56);
          formData.append('report_id', parseInt(reportId));
          formData.append('size', (file.raw.size / 1024 / 1024).toFixed(2));
          formData.append('createdBy', userInfo.id);
          formData.append('protected', false);
        });

        formData.append('code', uuid.v4());

        const uploaded = await uploadFilesBatch(formData);
        totalSkipped += uploaded?.stats?.skipped ?? 0
        console.log(`Files uploaded for report ID ${reportId}:`, uploaded.data);
      }
      if (totalSkipped > 0) {
        ElMessage.warning(`${totalSkipped} duplicate document(s) skipped — already attached`)
      }
    }

    emptyRuleForm();
    page.value = 1
    currentPage.value = 1
    await getFilteredData(filters, filterValues)
    AddDialogVisible.value = false;
    handleClose();
  });
};


 
const batchData = ref([])
const submitBatchImport = async () => {
  console.log('upload--->', uploadedData.value)
  for (let i = 0; i < uploadedData.value.length; i++) {

    let feature = uploadedData.value[i]
    let conv_feature = {}
    for (var prop in feature) {
      var matched_field = fieldSet.value.filter((obj) => {
        // console.log('+++++', obj)
        return obj.match === prop
      })
      //  console.log(i, matched_field)
      if (matched_field.length > 0) {
        conv_feature[matched_field[0].field] = feature[prop]  // Assign Field Vlue 
      }

      //console.log(conv_feature)
    }
    batchData.value.push(conv_feature)
  }
  console.log('processed:', batchData)

  // ************** prepare data to server ***************** //

  var formData = {}
  formData.model = model
  formData.data = batchData.value


  console.log("importData--->", formData)


  // ************** Send data to server ***************** //
  await BatchImportUpsert(formData)
    .catch((error) => {
      console.log('Error------>', error.response.data.message)
      ElMessage.error(error.response.data.message)
    })



}



const firstReport = ref(true)

const getCumulativeProgress = async () => {

  var filters = ['userId', 'indicator_category_id', 'county_id', 'subcounty_id', 'ward_id', 'project_id', 'programme_implementation_id',
  ]

  var filterValues = [[userInfo.id], [ruleForm.indicator_category_id], [ruleForm.county_id], [ruleForm.subcounty_id], [ruleForm.ward_id],
  [ruleForm.project_id], [ruleForm.programme_implementation_id]]  // remember to change here!

  console.log(ruleForm.value)

  if (ruleForm.settlement_id) {
    filters.push('settlement_id')
    filterValues.push([ruleForm.settlement_id])
  }

  if (ruleForm.project_location_id) {
    filters.push('project_location_id')
    filterValues.push([ruleForm.project_location_id])
  }


  console.log('filters', filters)
  console.log('filterValues', filterValues)
  const formData = {}
  formData.limit = pageSize.value
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  formData.assocModel = []

  // - multiple filters -------------------------------------
  formData.filters = filters
  formData.filterValues = filterValues
  formData.associated_multiple_models = []
  formData.nested_models = nested_models

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)


  console.log('yaay. Got last reports', res.data)
  if (res.data.length == 0) {
    firstReport.value = true
  } else {
    firstReport.value = false
  }

  function getLatestReport(dataList) {
    if (dataList.length === 0) {
      return null;
    }

    // Find the latest ID using reduce function
    const latestID = dataList.reduce((prevObj, currentObj) => (currentObj.id > prevObj.id ? currentObj : prevObj)).id;

    // Find the object with the latest ID
    const objectWithLatestID = dataList.find((obj) => obj.id === latestID);

    // Return the object with the latest ID
    return objectWithLatestID;
  }


  // Get the object with the latest date
  const objectWithLatestDate = getLatestReport(res.data);
  console.log('objectWithLatestDate', objectWithLatestDate);

  // ruleForm.cumProgress = parseInt(objectWithLatestDate.cumProgress)
  // ruleForm.cumDisbursement = parseInt(objectWithLatestDate.cumDisbursement)
  ruleForm.cumAmount = parseInt(objectWithLatestDate.cumAmount)
  ruleForm.cumProgress = parseInt(objectWithLatestDate.cumProgress)
  ruleForm.prevAmount = parseInt(objectWithLatestDate.amount)

  ruleForm.target = parseInt(objectWithLatestDate.target)

  console.log('cumProgress ats tart', ruleForm);

}


/// Import multiple reports - ----------------
// ----------------------------------------------
//const parentModels = ['county']
const parentModels = ['county', 'settlement', 'indicator_category']
const parentCodes = ['countyCode', 'settlementCode', 'indicator_categoryCode']
//const parentCodes = ['countyCode', 'settlementCode', 'indicator_categoryCode']
//const parentCodes = ['countyCode']


const uploadedData = ref([])

const parentData = ref([]);
const getParentOptions = async (parent) => {

  await getCountyListApi({
    params: {
      curUser: 1, // Id for logged in user
      model: parent,
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    //tableDataList.value = response.data
    const ret = response.data
    //  console.log('Received response:', parent, ret)
    parentData.value.push(ret)





  })
}

const fileList = ref<UploadUserFile[]>([])

const handleRemove: UploadProps['onRemove'] = (file, uploadFiles) => {
  console.log(file, uploadFiles)
  show.value = false
  uploadedData.value = []
  batchData.value = []
  fieldSet.value = []

}

const handlePreview: UploadProps['onPreview'] = (uploadFile) => {
  console.log(uploadFile)
}

const handleExceed: UploadProps['onExceed'] = (files, uploadFiles) => {
  ElMessage.warning(
    `The limit is 1, you selected ${files.length} files this time, add up to ${files.length + uploadFiles.length
    } totally`
  )
}

const beforeRemove: UploadProps['beforeRemove'] = (uploadFile) => {
  return ElMessageBox.confirm(`Cancel the uploading of  ${uploadFile.name} ?`).then(
    () => true,
    () => false
  )
}


const matchOptions = ref([])
const makeOptions = (list) => {
  matchOptions.value = []
  for (let i = 0; i < list.length; i++) {
    var opt = {}
    opt.value = list[i]
    opt.label = list[i]
    matchOptions.value.push(opt)
  }
}

const file = ref()
const readXLSX = async (event) => {
  console.log('on file change.......', event)
  //file.value = event.target.files ? event.target.files[0] : null;   // Direct upload 
  file.value = event   // called from the uplaod funtion 

  console.log('The file---->', file)

  await readXlsxFile(file.value).then((rows) => {
    const fields = Object.values(rows[0]) //  get all proterit4s of the first feature
    console.log("fields-->", fields)


    for (let j = 1; j < rows.length; j++) {
      var record = {}
      for (let i = 0; i < fields.length; i++) {
        var f = fields[i]
        var v = rows[j][i]
        record[f] = v
        //  console.log(record)
      }

      console.log("record", record) // Push to the temporary holder
      uploadedData.value.push(record)

    }  // remove header row

  })





  console.log('Parent data', parentData.value)



  for (let k = 0; k < parentData.value.length; k++) {
    console.log('processing parent', k)
    var pcode = parentCodes[k]
    let editedArrray = []
    console.log('processing code', pcode)

    //  console.log(uploadedData.value[1][pcode])

    for (let i = 0; i < uploadedData.value.length; i++) {


      var parentMatch = parentData.value[k].filter(function (el) {
        return el.code === uploadedData.value[i][pcode]
      });


      if (parentMatch.length > 0) {
        let pkey = parentModels[k] + '_id'
        console.log('parentMatch', pkey, parentMatch)

        parentMatch[0][pkey] = parentMatch[0]['id'];
        console.log(parentMatch[0])


        const keys_to_keep = [pkey];
        const result = parentMatch.map(e => {
          const obj = {};
          keys_to_keep.forEach(k => obj[k] = e[k])
          return obj;
        });

        //  console.log(result);


        const match = { ...uploadedData.value[i], ...result[0] };
        editedArrray.push(match)
      }

    }



    console.log('Proceeed............')
    // proceed
    if (editedArrray.length > 0) {
      uploadedData.value = editedArrray.slice(0);
    }

  }

  const mergedfields = (Object.getOwnPropertyNames(uploadedData.value[0]));  // get properties from first row

  console.log('mergedfields', mergedfields)

  makeOptions(mergedfields)
  show.value = true
  showSubmitBtn.value = true
  showProcessBtn.value = false
}

const submitFiles = async () => {
  console.log('on Submit....', fileList.value.length)


  if (fileList.value.length == 0) {
    ElMessage.error('Select a  File first!')
  } else {
    var rfile = fileList.value[0].raw

    console.log("File type", rfile.name.split('.').pop())
    let reader = new FileReader()
    let ftype = rfile.name.split('.').pop()
    if (ftype == 'xlsx') {

      // Get the parents 

      for (let parent in parentModels) {

        await getParentOptions(parentModels[parent], parent)


      }
      console.log('parent data ---->', parentData.value)
      reader.onload = readXLSX(rfile)
    }
    else {
      console.log("Wrong File Format")
      ElMessage.error('Wrong File Format!. Select XLSX files only!')

    }

  }
}

getModeldefinition(model)

getIndicatorNames()
loadProjectsWithLocations()
loadProgrammeOptions()

//getCategoryOptions()
getInterventionsAll()






const tableRowClassName = (data) => {

  if (data.row.status == 'Rejected') {
    return 'danger-row'
  }
  if (data.row.status == 'Approved') {
    return 'success-row'
  }

  // New / not-yet-reviewed reports stay unstyled
  return ''
}







const DocTypes = ref([])
const getDocumentTypes = async () => {
}
getDocumentTypes()



const isMobile = computed(() => appStore.getMobile)

console.log('IsMobile', isMobile)

const dialogWidth = ref()
const actionColumnWidth = ref()
const reviewWindowWidth = ref('40%')

if (isMobile.value) {
  dialogWidth.value = "90%"
  actionColumnWidth.value = "75px"
  reviewWindowWidth.value = "100%"
} else {
  dialogWidth.value = "45%"
  actionColumnWidth.value = "160px"
  reviewWindowWidth.value = "40%"
}

const reportColumnDefaults = (): AdjustableColumnSetting[] => [
  { key: 'indicator', label: 'Indicator', width: undefined as any, minWidth: 160, visible: true, hideable: true },
  { key: 'category', label: 'Category', width: undefined as any, minWidth: 140, visible: true, hideable: true },
  { key: 'amount', label: 'Amount', width: undefined as any, minWidth: 100, visible: true, hideable: true },
]

const {
  showColumnPicker,
  isColumnVisible,
  columnWidth,
  columnMinWidth,
  hideableColumns,
  visibleColumnKeys,
  onHeaderDragend,
  resetColumns,
} = useAdjustableTableColumns('indicatorCategoryReportTableColumnsV1', reportColumnDefaults)

const equalDataColumnsVisible = computed(
  () => isColumnVisible('indicator') && isColumnVisible('category')
)

const flexColumnMinWidth = (key: 'indicator' | 'category' | 'amount') => {
  const min = columnMinWidth(key) ?? 120
  const w = columnWidth(key)
  if (typeof w === 'number' && w > 40) {
    if (equalDataColumnsVisible.value && ['indicator', 'category'].includes(key)) {
      const saved = (['indicator', 'category'] as const)
        .map((k) => columnWidth(k))
        .filter((n): n is number => typeof n === 'number' && n > 40)
      if (saved.length) return Math.max(min, ...saved)
    }
    return Math.max(min, w)
  }
  return min
}




/// Uplaod docuemnts from a central component 
const mfield = 'report_id'
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
  console.log('toggleComponent called with:', row)
  componentProps.value.data = row
  dynamicComponent.value = null; // Unload the component
  addMoreDocuments.value = true; // Set any additional props
  console.log('addMoreDocuments set to:', addMoreDocuments.value)

  setTimeout(() => {
    console.log('Loading ChildComponent...')
    dynamicComponent.value = ChildComponent; // Load the component
    console.log('dynamicComponent set to:', dynamicComponent.value)
  }, 100); // 0.1 seconds
}


function disabledFutureDates(date) {
  const today = new Date();
  return date.getTime() > today.getTime(); // Disable dates after today
}

const report = ref({})

const review = (data: TableSlotDefault) => {
  report.value = {
    project: data.project?.title || 'N/A',
    location: getRowSettlementLabel(data),
    indicator: data.indicator_category?.indicator_name || 'N/A',
    category: data.indicator_category?.category_title || 'N/A',
    amount: data.amount || 0,
    progress: data.progress || 0,
    date: formatDate(data.date),
    user: data.user?.name || 'N/A',
    phone: data.user?.phone || 'N/A',
    comments: data.comments || 'N/A',
    documents: data.documents || [],
  }

  ruleForm.id = data.id
  ruleForm.status = data.status || 'New'
  ruleForm.reject_msg = data.reject_msg || ''

  ReviewDialog.value = true
}

const approve = async () => {
  const approvalPayload = {
    id: ruleForm.id,
    status: 'Approved',
    model: 'indicator_category_report',
    userId: userInfo.id,
  }

  try {
    await updateOneRecord(approvalPayload)
    ReviewDialog.value = false
    await getFilteredData(filters, filterValues)
    ElMessage.success('Report approved successfully')
  } catch (error) {
    console.error('Error approving report:', error)
    ElMessage.error('Failed to approve report')
  }
}

const reject = () => {
  RejectDialog.value = true
}

const confirmReject = async () => {
  const rejectionPayload = {
    id: ruleForm.id,
    status: 'Rejected',
    reject_msg: rejectReason.value,
    model: 'indicator_category_report',
    userId: userInfo.id,
  }

  try {
    await updateOneRecord(rejectionPayload)
    RejectDialog.value = false
    ReviewDialog.value = false
    rejectReason.value = ''
    await getFilteredData(filters, filterValues)
    ElMessage.success('Report rejected')
  } catch (error) {
    console.error('Error rejecting report:', error)
    ElMessage.error('Failed to reject report')
  }
}



// Document drawer state
const documentDrawerVisible = ref(false)
const selectedRowData = ref(null)

// Open document drawer
const openDocumentDrawer = (row) => {
  console.log('Opening document drawer for row:', row);
  console.log('Row documents:', row.documents);
  
  selectedRowData.value = row
  documentDrawerVisible.value = true
}

// Close document drawer
const closeDocumentDrawer = () => {
  documentDrawerVisible.value = false
  selectedRowData.value = null
}

// After a refetch, re-point the open drawer at the fresh row — otherwise it keeps
// showing the stale row object and new/removed documents never appear.
const syncDrawerRow = () => {
  if (!selectedRowData.value?.id) return
  const updated = tableDataList.value.find((r: any) => r.id === selectedRowData.value.id)
  if (updated) selectedRowData.value = updated
}

// Handle document drawer events
const handleDocumentRefresh = async () => {
  // Refresh the table data when documents are modified
  await getFilteredData(filters, filterValues)
  syncDrawerRow()
}

// Handle upload completion
const handleUploadComplete = async (response) => {
  console.log('Upload completed:', response)
  // Refresh the table data to show new documents
  await getFilteredData(filters, filterValues)
  syncDrawerRow()
  // Close the upload dialog
  addMoreDocuments.value = false
}

const handleOpenDialog = () => {
  // Handle opening upload dialog
  console.log('handleOpenDialog called!')
  console.log('Opening upload dialog for row:', selectedRowData.value)
  if (selectedRowData.value) {
    console.log('Calling toggleComponent with:', selectedRowData.value)
    toggleComponent(selectedRowData.value)
  } else {
    console.log('No selectedRowData available!')
  }
}

 


const dialogMap = ref(false)

const reportGeom = ref([])
const projectGeom = ref([])

const reportDetails = ref();
const locationStatus = ref('')
const projectLocationColor = ref('red')

// getOneGeo returns a FeatureCollection whose `features` is null when the record has
// no geometry — turf.centroid() crashes on that, so resolve it safely here.
const fetchCentroid = async (model, id) => {
  if (id == null) return null
  try {
    const res = await getOneGeo({ model, id })
    const fc = res.data?.[0]?.json_build_object
    if (!fc?.features?.length) return null
    return turf.centroid(fc)
  } catch (error) {
    console.error(`Failed to load geometry for ${model} ${id}:`, error)
    return null
  }
}

const showMap = async (row) => {
  reportDetails.value = row

  const centroid = await fetchCentroid('indicator_category_report', row.id)
  if (!centroid) {
    ElMessage.warning('This report has no location geometry to display on the map')
    return
  }
  reportGeom.value = centroid

  const proj_centroid = await fetchCentroid('project_location', row.project_location_id)
  // Without a project location the map still shows the report point; the project
  // layers below all read projectGeom, so fall back to the report's own centroid.
  projectGeom.value = proj_centroid || centroid

  dialogMap.value = true

  if (proj_centroid) {
    const distance = turf.distance(proj_centroid, centroid, { units: 'kilometers' })
    projectLocationColor.value = distance < 1 ? 'green' : 'red'
    locationStatus.value =
      'The report is ' + distance.toFixed(2) + ' kilometers from the center of the project'
  } else {
    projectLocationColor.value = 'red'
    locationStatus.value = 'Project location geometry is not available for comparison'
  }

  // The map is built on the drawer's @opened event, once the container has its size.
}



const closeMap = () => {

  dialogMap.value = false
}

// Held so the drawer can dispose the map on close — re-opening otherwise leaks a
// WebGL context per view, and browsers cap how many can be live at once.
const mapInstance = ref(null)

const destroyMap = () => {
  if (mapInstance.value) {
    mapInstance.value.remove()
    mapInstance.value = null
  }
}

const loadMap = () => {
  destroyMap()

  var mapCenter = reportGeom.value.geometry.coordinates;

  var nmap = new mapboxgl.Map({
    container: "mapContainer",
    style: "mapbox://styles/mapbox/streets-v12",
    center: mapCenter, // starting position
    zoom: 15,
  });



  nmap.on("load", () => {
    nmap.addLayer({
      id: "Satellite",
      source: { type: "raster", url: "mapbox://mapbox.satellite", tileSize: 256 },
      type: "raster",
    });

    nmap.addLayer({
      id: "Streets",
      source: { type: "raster", url: "mapbox://mapbox.streets", tileSize: 256 },
      type: "raster",
    });

    nmap.setLayoutProperty("Satellite", "visibility", "none");

    const layers = [
      {
        id: "Satellite",
        title: "Satellite",
        visibility: "none",
        type: "base",
      },
      {
        id: "Streets",
        title: "Streets",
        visibility: "none",
        type: "base",
      },
    ];

    //     Add point layer
    nmap.addLayer({
      id: 'point-layer',
      type: 'circle',
      source: {
        type: 'geojson',
        data: projectGeom.value,
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
        data: projectGeom.value,
      },
      paint: {
        'line-color': projectLocationColor.value,
        'line-width': 2,
      },
      filter: ['==', '$type', 'LineString'],
    });

    // Add polygon layer as outline
    nmap.addLayer({
      id: 'polygon-layer',
      type: 'line', // Change to 'line' to display the outline
      source: {
        type: 'geojson',
        data: projectGeom.value,
      },
      paint: {
        'line-color': projectLocationColor.value, // Outline color (replace 'green' with your desired color)
        'line-width': 2, // Outline width in pixels (adjust as needed)
      },
      filter: ['in', '$type', 'Polygon'], // Include both Polygon and MultiPolygon types
    });



    //     Add Project Location layer
    nmap.addLayer({
      id: 'project-layer',
      type: 'circle',
      source: {
        type: 'geojson',
        data: projectGeom.value,
      },
      paint: {
        'circle-color': 'red',
        'circle-radius': 6,
      },
      filter: ['==', '$type', 'Point'],
    });


    // Add marker to the map
    // Create a new marker and set its position
    const proj_marker = new mapboxgl.Marker()
      .setLngLat(projectGeom.value.geometry.coordinates) // Set the marker position using the GeoJSON coordinates
      .addTo(nmap); // Add the marker to the map

    // Create a new popup
    const project_popup = new mapboxgl.Popup({ offset: 25 }) // Optionally add an offset
      .setHTML('<h3>Project Location</h3><p>Coordinates: ' + projectGeom.value.geometry.coordinates[1] + ', ' + projectGeom.value.geometry.coordinates[0] + '</p>'); // Set the HTML content of the popup

    // Attach the popup to the marker
    proj_marker.setPopup(project_popup).togglePopup(); // Automatically open the popup when the marker is added to the map



    const lineString = {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "LineString",
        "coordinates": [
          projectGeom.value.geometry.coordinates, // First point coordinates
          reportGeom.value.geometry.coordinates  // Second point coordinates
        ]
      }
    };

    nmap.addLayer({
      id: 'distance-layer',
      type: 'line', // Change to 'line' to display the outline
      source: {
        type: 'geojson',
        data: lineString
      },
      'paint': {
        'line-color': 'red',
        'line-width': 1,
        'line-dasharray': [10, 10],


      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      }
    });


    const bounds = turf.bbox((lineString))
    console.log("From geo", bounds)
    // maxZoom keeps the view readable when the report sits on (or very near) the
    // project location — a near-empty bbox would otherwise fit to max zoom.
    nmap.fitBounds(bounds, { padding: 100, maxZoom: 15 })





    console.log(nmap)

    nmap.addControl(new MapboxLayerSwitcherControl(layers));

    const nav = new mapboxgl.NavigationControl();
    nmap.addControl(nav, "top-left");

    // Add a marker at the geom.value position

    function formatDateToYYYYMMDD(dateString) {
      const dateObj = new Date(dateString);
      const year = dateObj.getUTCFullYear();
      const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    // Add a marker at the geom.value position
    var marker = new mapboxgl.Marker().setLngLat(mapCenter).addTo(nmap);
    // Create the marker and specify the color
    var marker = new mapboxgl.Marker({
      color: projectLocationColor.value,
    }).setLngLat(mapCenter)
      .addTo(nmap);
    // Create a simple popup with user information displayed using line breaks
    var popupContent = document.createElement('div');

    // Sample user information (replace these with actual data)
    var userName = reportDetails.value.user.name;
    var phoneNumber = reportDetails.value.user.phone;
    var date = formatDateToYYYYMMDD(reportDetails.value.date);

    var userInfo = `
        <div style="text-align: center;">
          <strong>Submitted By:</strong>
          <hr style="margin: 5px 0;">

        </div>
        <strong>Name:</strong> ${userName}<br>
          <strong>Phone Number:</strong> ${phoneNumber}<br>
          <strong>Date:</strong> ${date}
        `;

    popupContent.innerHTML = userInfo;

    var popup = new mapboxgl.Popup({ anchor: 'right', offset: [-20, 0] }).setDOMContent(popupContent);

    // Attach the popup to the marker
    marker.setPopup(popup);
    nmap.resize();
  });

  mapInstance.value = nmap;
};


function isGeomNull(geom) {
  console.log('---geom-----', geom)
  return geom === null;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

const getSummaries = (param) => {
  const { columns, data } = param;
  const sums = [];

  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = 'Summary';
      return;
    }

    // Calculate total for Amount column
    if (column.property === 'amount') {
      const total = data.reduce((sum, row) => {
        const value = Number(row[column.property]);
        return isNaN(value) ? sum : sum + value;
      }, 0);
      sums[index] = total.toLocaleString();
    } 
    // Calculate average for Progress column
    else if (column.label === 'Progress %') {
      const validProgressValues = data.filter(row => {
        const progress = Number(row.progress || 0);
        return !isNaN(progress) && isFinite(progress);
      });
      
      if (validProgressValues.length > 0) {
        const averageProgress = validProgressValues.reduce((sum, row) => {
          return sum + Number(row.progress || 0);
        }, 0) / validProgressValues.length;
        
        sums[index] = `Avg: ${averageProgress.toFixed(1)}%`;
      } else {
        sums[index] = 'Avg: 0.0%';
      }
    }
    // For other columns, show empty
    else {
      sums[index] = '';
    }
  });

  return sums;
};

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

const openHelp = ref(false)


const activeStep = ref(0)

const step0Fields = computed(() => {
  const fields: string[] = ['project_id']
  if (!isNationalProject.value) fields.push('project_location_id')
  return fields
})

const validateCurrentStep = async () => {
  if (!ruleFormRef.value) return false
  if (activeStep.value === 2 || activeStep.value === 3) return true
  const fields = activeStep.value === 0 ? step0Fields.value : ['indicator_category_id']
  try {
    await ruleFormRef.value.validateField(fields)
    return true
  } catch {
    return false
  }
}

const nextStep = async () => {
  const valid = await validateCurrentStep()
  if (valid && activeStep.value === 0) {
    ensureLocationFieldsFromSelection()
  }
  if (valid && activeStep.value < 3) {
    activeStep.value++
  }
}



const prevStep = () => {
  if (activeStep.value > 0) {
    activeStep.value--;
  }
}

const tableRef = ref(null);

const handleCancel = () => {
  disableIndicator.value = false
  activeStep.value = 0
  AddDialogVisible.value = false
}

const _getFilteredProjects = (query) => {
  const filteredProjects = projectOptionsAll.value.filter(project =>
    project.label.toLowerCase().includes(query.toLowerCase())
  );

  // Create a new Set to store unique project labels
  const uniqueProjects = new Map();

  filteredProjects.forEach(project => {
    if (!uniqueProjects.has(project.label)) {
      uniqueProjects.set(project.label, project);
    }
  });

  // Return the unique values as an array
  return Array.from(uniqueProjects.values());
};


const getFilteredProjects = (query) => {
  let filteredProjects = projectOptionsAll.value.filter(projectMatchesProgrammeComponent);

  if (!query) {
    filteredProjects = filteredProjects.slice(0, 10);
  } else {
    const q = query.toLowerCase()
    filteredProjects = filteredProjects.filter(project =>
      project.label.toLowerCase().includes(q)
    );
  }

  const uniqueProjects = new Map();

  filteredProjects.forEach(project => {
    if (!uniqueProjects.has(project.value)) {
      uniqueProjects.set(project.value, project);
    }
  });

  return Array.from(uniqueProjects.values());
};


 
const searchProject = (query) => {
  console.log('touched')
  loading.value=true
  if (query !== '') {
    // Simulate API call
    setTimeout(() => {
      projectOptions.value = getFilteredProjects(query); // Replace with API call
      console.log('projectOptions.value1 ', projectOptions.value )

      loading.value=false
    }, 500);
  } else {
    loading.value=false
    projectOptions.value = getFilteredProjects(''); // Replace with API call

    console.log('projectOptions.value2 ', projectOptions.value )

    //projectOptions.value = [];
    

  }
};


 


function handleIndicatorsChange(selectedIds) {
  // One row per indicator_category, even if the option list or the selection repeats it
  const seen = new Set()
  const selectedIndicators = indicatorsOptionsFiltered.value.filter((opt) => {
    if (!selectedIds.includes(opt.value) || seen.has(opt.value)) return false
    seen.add(opt.value)
    return true
  });

 console.log('selectedIds',selectedIds)

  ruleForm.indicators = selectedIndicators.map(ind => ({
    ...ind,
    amount: null,
    baseline: null,
    target: null,
    date: new Date(),
    cumProgress: null
  }));


  console.log(ruleForm.indicators,ruleForm.indicators)
}


</script>

<template>
  <el-card class="indicator-category-report-page-card">
    <div
      class="sett-toolbar-row"
      :class="isMobile ? 'sett-toolbar-row--compact' : 'sett-toolbar-row--wide'"
    >
      <div class="sett-toolbar-col sett-toolbar-col--back">
        <el-button type="primary" plain :icon="Back" @click="goBack" size="small">
          Back
        </el-button>
      </div>

      <div class="sett-toolbar-col sett-toolbar-col--search report-toolbar-filters">
        <el-tree-select
          v-model="filterProgrammeId"
          :data="programmeTreeData"
          clearable
          filterable
          check-strictly
          default-expand-all
          node-key="value"
          value-key="value"
          :props="{ label: 'label', children: 'children', value: 'value' }"
          placeholder="All programmes"
          class="programme-filter-select"
          @change="onProgrammeFilter"
        />

        <el-select
          v-model="locationLevel"
          clearable
          placeholder="Location level"
          class="location-level-select"
          @change="onLocationLevelChange"
        >
          <el-option label="National" value="national" />
          <el-option label="County" value="county" />
          <el-option label="Subcounty" value="subcounty" />
          <el-option label="Ward" value="ward" />
          <el-option label="Settlement" value="settlement" />
        </el-select>

        <el-input
          v-model="reportSearchText"
          clearable
          placeholder="Search by indicator, category, project or location"
          :prefix-icon="Search"
          class="report-search-input"
          @input="onReportSearch"
          @clear="onReportSearch"
        />
      </div>

      <div class="sett-toolbar-col sett-toolbar-col--actions">
        <div class="sett-toolbar-actions" :class="{ 'sett-toolbar-actions--desktop': !isMobile }">
          <PermissionWrapper :permissions="['indicator_category_report:create']">
            <el-tooltip content="Add Indicator Category Report" placement="top">
              <el-button @click="AddReport" type="primary" :icon="Plus" />
            </el-tooltip>
          </PermissionWrapper>

          <el-tooltip v-if="hasActiveFilters" content="Clear all filters" placement="top">
            <el-button type="primary" @click="handleClear">
              <AppIcon icon="mdi:filter-remove" width="22" height="22" />
            </el-button>
          </el-tooltip>

          <AdjustableTableColumnPicker
            v-model:show-column-picker="showColumnPicker"
            v-model:visible-column-keys="visibleColumnKeys"
            :hideable-columns="hideableColumns"
            @reset="resetColumns"
          />

          <PermissionWrapper :permissions="['indicator_category_report:read']">
            <DownloadCustom
              :data="tableDataList"
              :model="model"
              :associated_models="associated_multiple_models"
              :loading="downloadLoading"
              :total="total"
              :filters="filters"
              :filter-values="filterValues"
              @download-start="downloadLoading = true"
              @download-end="downloadLoading = false"
            />
          </PermissionWrapper>
        </div>
      </div>
    </div>
    <div class="indicator-category-report-table-wrap">
      <el-table
        fit
        table-layout="fixed"
        :data="filingGroups"
        :loading="loading"
        border
        :row-class-name="filingRowClassName"
        :expand-row-keys="expandedFilingKeys"
        class="indicator-category-report-table filing-table-clickable"
        style="width: 100%; margin-top: 10px;"
        row-key="code"
        @row-click="onFilingRowClick"
        @expand-change="onFilingExpandChange"
      >
        <el-table-column type="expand" width="40">
          <template #default="{ row: filing }">
            <div class="filing-nested-table" style="padding: 8px 12px 8px 48px">
              <div class="filing-meta-row">
                <span class="filing-meta-item">
                  <AppIcon icon="mdi:account-outline" width="14" height="14" />
                  {{ filing.first.user?.name || 'Unknown' }}
                </span>
                <span class="filing-meta-sep">|</span>
                <span class="filing-meta-item">
                  <AppIcon icon="mdi:calendar-outline" width="14" height="14" />
                  {{ formatDate(filing.first.date) }}
                </span>
                <span class="filing-meta-sep">|</span>
                <el-tag
                  v-for="(count, status) in filingStatusCounts(filing)"
                  :key="status"
                  :type="statusTagType(String(status))"
                  size="small"
                  class="filing-status-tag"
                >
                  {{ status }}<template v-if="filing.reports.length > 1"> ×{{ count }}</template>
                </el-tag>
              </div>

              <el-table
                fit
                table-layout="fixed"
                :data="filing.reports"
                border
                show-summary
                :summary-method="getSummaries"
                :show-overflow-tooltip="true"
                :row-class-name="tableRowClassName"
                style="width: 100%"
                row-key="id"
                @header-dragend="onHeaderDragend"
              >
        <el-table-column
          v-if="isColumnVisible('indicator')"
          column-key="indicator"
          label="Indicator"
          class-name="report-col-equal"
          :min-width="flexColumnMinWidth('indicator')"
          sortable
          resizable
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.indicator_category?.indicator_name || 'N/A' }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="isColumnVisible('category')"
          column-key="category"
          label="Category"
          class-name="report-col-equal"
          :min-width="flexColumnMinWidth('category')"
          sortable
          resizable
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.indicator_category?.category_title || 'N/A' }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="isColumnVisible('amount')"
          column-key="amount"
          label="Amount"
          prop="amount"
          :min-width="flexColumnMinWidth('amount')"
          sortable
          resizable
        >
          <template #default="{ row }">
            {{ reportAmountDisplay(row) }}
          </template>
        </el-table-column>
        <el-table-column label="Actions" :width="actionColumnWidth">
          <template #default="{ row }">
            <PermissionWrapper :permissions="['indicator_category_report:update', 'indicator_category_report:delete']">
              <TableActions
                :item="row"
                :buttons="rowActionButtons(row)"
                @edit="editReport"
                @delete="DeleteReport"
                @view-on-map="showMap"
                @review="review"
              />
            </PermissionWrapper>
          </template>
        </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Date" min-width="110" sortable :sort-method="(a, b) => String(a.first.date || '').localeCompare(String(b.first.date || ''))">
          <template #default="{ row }">
            <el-badge is-dot :hidden="!row.reports.some(isReportNew)" class="report-new-badge">
              {{ formatDate(row.first.date) }}
            </el-badge>
          </template>
        </el-table-column>
        <el-table-column label="Project" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.first.project?.title || row.first.activity?.project?.title || '—' }}
          </template>
        </el-table-column>
        <el-table-column label="Location" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            {{ getRowSettlementLabel(row.first) }}
          </template>
        </el-table-column>
        <el-table-column label="Indicators" width="110" align="center">
          <template #default="{ row }">
            {{ row.reports.length }}
          </template>
        </el-table-column>
        <el-table-column label="Status" min-width="160">
          <template #default="{ row }">
            <el-tag
              v-for="(count, status) in filingStatusCounts(row)"
              :key="status"
              :type="statusTagType(String(status))"
              class="filing-status-tag"
              size="small"
            >
              {{ status }}<template v-if="row.reports.length > 1"> ×{{ count }}</template>
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Documents" width="110" align="center">
          <template #default="{ row }">
            <div class="documents-cell">
              <el-button
                type="primary"
                size="small"
                :icon="Files"
                @click="openDocumentDrawer(row.first)"
                class="documents-button"
              >
                {{ row.first.documents?.length || 0 }}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <ElPagination
      :layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'"
      v-model:currentPage="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 50, 200, 10000]"
      :total="total"
      :background="true"
      @size-change="onPageSizeChange"
      @current-change="onPageChange"
      class="mt-4"
      :small="isMobile"
      :pager-count="isMobile ? 3 : 7"
    />
  </el-card>

  <el-drawer
    v-model="AddDialogVisible"
    direction="rtl"
    :size="dialogWidth"
    :title="formHeader"
    @close="handleClose"
  >
    <el-steps :active="activeStep" align-center finish-status="success" class="indicator-category-report-drawer-steps">
      <el-step title="Project Details" />
      <el-step title="Indicator Selection" />
      <el-step title="Input Values" />
      <el-step title="Submit" />
    </el-steps>

  <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-position="top">
    <!-- Step 0 -->
    <el-row v-if="activeStep === 0" :gutter="20">
      <el-col :span="24">
        <el-row :gutter="12">
          <el-col :xs="24" :sm="12">
            <el-form-item label="Programme">
              <el-tree-select
                v-model="selectedProgrammeId"
                :data="programmeTreeData"
                clearable
                filterable
                check-strictly
                default-expand-all
                node-key="value"
                value-key="value"
                :props="{ label: 'label', children: 'children', value: 'value' }"
                placeholder="All programmes"
                style="width: 100%"
                @change="onProgrammeFilterChange"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="Component">
              <el-select
                v-model="selectedComponentId"
                clearable
                filterable
                placeholder="All components"
                :disabled="selectedProgrammeId == null"
                style="width: 100%"
                @change="onComponentFilterChange"
              >
                <el-option
                  v-for="item in componentFilterOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Project" prop="project_id">
        
          <el-select
              id="location-select"
              v-model="prj_obj"
              filterable
              remote
              reserve-keyword
              :loading="loading"
              placeholder="Search by Project title, county, settlement"
              :remote-method="searchProject"
              style="width: 100%"
              @change="changeProject"
            >
              <el-option
                v-for="item in projectOptions"
                :key="item.value"
                :label="item.label"
                :value="item"
              >
                <div style="display: flex; align-items: center;">
                  <span style="flex: 1; text-align: left;">{{ item.label }}</span>
                 
                </div>
              </el-option>
            </el-select>

 


          <el-text v-if="disableIndicator" class="mx-1" type="danger">No output indicators are configured for this project</el-text>
        </el-form-item>

        <el-form-item v-if="!isNationalProject" label="Location" prop="project_location_id">
          <el-select :disabled="disableIndicator" v-model="ruleForm.project_location_id" value-key="id" placeholder="Select" @change="changeLocation" style="width: 100%;">
            <el-option v-for="item in project_locations" :key="item.id" :label="getProjectLocationOptionLabel(item)" :value="item.id">
              <div style="display: flex; align-items: center;">
                <span style="flex: 1; text-align: left;">{{ getProjectLocationOptionLabel(item) }}</span>
                <span style="flex: 2; color: var(--el-text-color-secondary); font-size: 12px; text-align: right;">
                  {{ getProjectLocationOptionSubLabel(item) }}
                </span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <!-- Step 1 -->
    <el-row v-if="activeStep === 1" :gutter="20">
      <el-col :span="24">
        <el-form-item label="Indicators" prop="indicator_category_id">
          <el-select-v2
            v-model="ruleForm.indicator_category_id"
            multiple
            filterable
            :options="indicatorsOptionsFiltered"
            placeholder="Select one or more indicators"
            style="width: 100%;"
            @change="handleIndicatorsChange"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <!-- Step 2 -->
    <el-row v-if="activeStep === 2" :gutter="20">
      <el-col :span="24">
        <el-table :data="ruleForm.indicators" style="width: 100%;" border>
          <el-table-column label="Indicator" prop="label" />
          <!-- <el-table-column label="Amount">
            <template #default="{ row }">
              <el-input-number min="0"  v-model="row.amount" style="width: 100%;" />
            </template>
          </el-table-column> -->
         
          <el-table-column>
            <template #header>
              <span v-if="ruleForm.indicators.some(i => i.unit === 'Yes/No')">Status</span>
              <span v-else>Amount</span>
            </template>
            <template #default="{ row }">
              <template v-if="row.unit === 'Yes/No'">
                <el-switch
                  v-model="row.qualitative"
                  active-value="Yes"
                  inactive-value="No"
                />
              </template>
              <template v-else>
                <el-input-number
                  min="0"
                  v-model="row.amount"
                  style="width: 100%;"
                />
              </template>
            </template>
          </el-table-column>


          <el-table-column label="Date">
            <template #default="{ row }">
              <el-date-picker  v-model="row.date" type="date" placeholder="Pick a day" style="width: 100%;" :disabled-date="disabledFutureDates" />
            </template>
          </el-table-column>
       
        </el-table>
      </el-col>
    </el-row>

    <!-- Step 3 -->
    <el-row v-if="activeStep === 3" :gutter="20">
      <el-col :span="24">
        <el-form-item label="Comments" prop="comments">
          <el-input v-model="ruleForm.comments" type="textarea" placeholder="Do you have any comments?" />
        </el-form-item>

        <el-upload
          v-model:file-list="fileUploadList"
          class="upload-demo"
          action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
          multiple
          :on-preview="handlePreview"
          :on-remove="handleRemove"
          :before-remove="beforeRemove"
          :limit="3"
          :auto-upload="false"
          :on-exceed="handleExceed"
        >
          <el-button type="primary" :icon="UploadFilled"> Documentation</el-button>
        </el-upload>
      </el-col>
    </el-row>
  </el-form>

  <!-- Footer -->
  <template #footer>
    <div class="drawer-footer-bar">
      <el-button @click="prevStep" :disabled="activeStep === 0">Previous</el-button>
      <el-button :disabled="disableIndicator" @click="nextStep" v-if="activeStep < 3">Next</el-button>
      <el-button @click="handleCancel">Cancel</el-button>
      <el-button v-if="showSubmitBtn && activeStep === 3" type="primary" @click="submitForm(ruleFormRef)">Submit</el-button>
    </div>
  </template>
</el-drawer>







  <el-dialog
v-model="ImportDialogVisible" @close="handleClose" title="Import multiple reports" :width="dialogWidth"
    draggable>
    <el-upload
class="upload-demo" drag action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" multiple
      v-model:file-list="fileList" :on-preview="handlePreview" :on-remove="handleRemove" :before-remove="beforeRemove"
      :limit="5" :on-exceed="handleExceed" :auto-upload="false">
      <div class="el-upload__text"> Drop .xlsx file here or <em>click to upload</em> </div>
    </el-upload>

    <el-table size="small" v-if="show" :data="fieldSet" stripe="stripe">
      <el-table-column prop="column" label="Field">
        <template #default="scope">
          <el-input v-model="scope.row.field" controls-position="left" disabled />
        </template>
      </el-table-column>
      <el-table-column prop="match" label="Match">
        <template #default="scope">
          <el-select v-model="scope.row.match" filterable placeholder="Select">
            <el-option v-for="item in matchOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>

      <span class="dialog-footer">
        <el-button @click="ImportDialogVisible = false">Cancel</el-button>
        <el-button v-if="showProcessBtn" type="secondary" @click="submitFiles()">Process</el-button>
        <el-button v-if="showSubmitBtn" type="primary" @click="submitBatchImport()">Submit</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- Minimal edit: only the reported values are changeable -->
  <el-drawer
    v-model="EditReportVisible"
    direction="rtl"
    :size="isMobile ? '100%' : '420px'"
    title="Edit Report"
  >
    <div v-if="editRow" class="edit-report-body">
      <div class="edit-report-context">
        <div class="edit-context-item">
          <span class="edit-context-label">Indicator</span>
          <span class="edit-context-value">{{ editRow.indicator_category?.indicator_name || 'N/A' }}</span>
        </div>
        <div class="edit-context-item">
          <span class="edit-context-label">Category</span>
          <span class="edit-context-value">{{ editRow.indicator_category?.category_title || 'N/A' }}</span>
        </div>
        <div class="edit-context-item">
          <span class="edit-context-label">Project</span>
          <span class="edit-context-value">{{ editRow.project?.title || 'N/A' }}</span>
        </div>
        <div class="edit-context-item">
          <span class="edit-context-label">Location</span>
          <span class="edit-context-value">{{ getRowSettlementLabel(editRow) }}</span>
        </div>
      </div>

      <el-form label-position="top" class="edit-report-form">
        <el-form-item :label="editIsQualitative ? 'Implementation Status' : 'Amount'">
          <el-switch
            v-if="editIsQualitative"
            v-model="editModel.qualitative"
            active-value="Yes"
            inactive-value="No"
          />
          <el-input-number v-else v-model="editModel.amount" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Date">
          <el-date-picker
            v-model="editModel.date"
            type="date"
            placeholder="Pick a day"
            style="width: 100%"
            :disabled-date="disabledFutureDates"
          />
        </el-form-item>

        <el-form-item label="Comments">
          <el-input v-model="editModel.comments" type="textarea" :rows="3" placeholder="Any comments?" />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="drawer-footer-bar">
        <el-button @click="EditReportVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="editSaving" @click="saveEditedReport">Save</el-button>
      </div>
    </template>
  </el-drawer>

  <el-drawer
    v-model="dialogMap"
    direction="rtl"
    :size="isMobile ? '100%' : '45%'"
    :with-header="false"
    class="report-map-drawer"
    @opened="loadMap"
    @closed="destroyMap"
  >
    <div class="report-map-header">
      <div class="report-map-header-text">
        <h4 class="report-map-title">Reporting Location</h4>
        <span class="report-map-status" :style="`color: ${projectLocationColor}`">{{ locationStatus }}</span>
      </div>
      <el-button text circle class="report-map-close" @click="closeMap">
        <AppIcon icon="mdi:close" width="20" height="20" />
      </el-button>
    </div>
    <div id="mapContainer" class="report-map-canvas"></div>
  </el-drawer>

  <el-dialog v-model="ReviewDialog" title="Review Report" :width="reviewWindowWidth" draggable>
    <el-descriptions title="" direction="vertical" :column="2" size="small" border>
      <el-descriptions-item label="Project">{{ report.project }}</el-descriptions-item>
      <el-descriptions-item label="Location">{{ report.location }}</el-descriptions-item>
      <el-descriptions-item label="Indicator" :span="2">{{ report.indicator }}</el-descriptions-item>
      <el-descriptions-item label="Category" :span="2">{{ report.category }}</el-descriptions-item>
      <el-descriptions-item label="Amount">{{ report.amount }}</el-descriptions-item>
      <el-descriptions-item label="Date">{{ report.date }}</el-descriptions-item>
      <el-descriptions-item label="Submitted By">{{ report.user }}</el-descriptions-item>
      <el-descriptions-item label="Telephone">{{ report.phone }}</el-descriptions-item>
      <el-descriptions-item label="Comments" :span="2">{{ report.comments }}</el-descriptions-item>
      <el-descriptions-item label="Documentation" v-if="report.documents && report.documents.length" :span="2">
        <div v-for="(doc, index) in report.documents" :key="index">
          <span>{{ doc.name }}</span>
        </div>
      </el-descriptions-item>
    </el-descriptions>
    <template #footer>
      <span v-if="showAdminButtons && isReportNew({ status: ruleForm.status })" class="dialog-footer">
        <el-button @click="ReviewDialog = false">Close</el-button>
        <el-button type="success" @click="approve">Approve</el-button>
        <el-button type="danger" @click="reject">Reject</el-button>
      </span>
      <span v-else class="dialog-footer">
        <el-button @click="ReviewDialog = false">Close</el-button>
      </span>
    </template>
  </el-dialog>

  <el-dialog v-model="RejectDialog" title="Reason for rejection" width="420px">
    <el-input v-model="rejectReason" type="textarea" placeholder="Enter rejection reason" />
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="RejectDialog = false">Cancel</el-button>
        <el-button type="primary" @click="confirmReject">Confirm</el-button>
      </span>
    </template>
  </el-dialog>

  <el-tour v-model="openHelp" z-index="100000">
    <el-tour-step target="#btn1" title="Project" description="Select the project you want to set up" />
    <el-tour-step
target="#btn2" title="Location"
      description="Select the location where this project is implemented. Repeat this for every settlement the project is being implemented" />
    <el-tour-step
target="#btn3" title="Activity"
      description="Select the  specific activity you wish to configure monitoring for" />
    <el-tour-step
target="#btn4" title="Indicator"
      description="Select the  indicator associated with that activity. If not configured, use the + button to create a new indicator" />

    <el-tour-step
target="#btn5" title="Quantity"
      description="Specify the amount/value/quantity for this reporting period.  " />

    <el-tour-step target="#btn6" title="Cumulative" description=" Shows the cumulative achievements todate" />



    <el-tour-step target="#btn8" title="Baseline" description="Shows the value at the start of the activity" />


    <el-tour-step target="#btn9" title="Target" description="Targeted quantity/amount/value" />


    <el-tour-step target="#btn10" title="Date" description="Specify reporting date." />

    <el-tour-step
target="#btn11" title="Progress"
      description="Progress of achievements. How much of the quantity has been achieved todate?" />


    <el-tour-step
target="#btn12" title="Comments"
      description="Provide any commentary or additional information related to this submission" />

    <el-tour-step
target="#btn13" title="Documentation"
      description="Upload any documentation that is required. It includes photos, reports of data" />




  </el-tour>

  <!-- Document Drawer -->
  <DocumentDrawer
    v-model:visible="documentDrawerVisible"
    :data="selectedRowData"
    :docmodel="model"
    :permissions="['indicator_category_report:delete', 'document:delete']"
    @refresh="handleDocumentRefresh"
    @open-dialog="handleOpenDialog"
  />

  <!-- Upload Dialog -->
  <component 
    v-if="dynamicComponent" 
    :is="dynamicComponent" 
    v-bind="componentProps"
    @close="addMoreDocuments = false"
    @upload-complete="handleUploadComplete"
  />

</template>



<style scoped>
.report-new-badge {
  max-width: 100%;
}

.filing-table-clickable :deep(.el-table__body-wrapper .el-table__row) {
  cursor: pointer;
}

/* The expanded panel is a row too — don't imply it's clickable */
.filing-table-clickable :deep(.el-table__expanded-cell) {
  cursor: default;
}

.edit-report-context {
  background: var(--el-fill-color-light);
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 18px;
}

.edit-context-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 3px 0;
  font-size: 13px;
}

.edit-context-label {
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.edit-context-value {
  color: var(--el-text-color-primary);
  font-weight: 500;
  text-align: right;
  min-width: 0;
}

.programme-filter-select {
  width: 190px;
  flex-shrink: 0;
}

.location-level-select {
  width: 150px;
  flex-shrink: 0;
}

.report-search-input {
  flex: 1 1 auto;
  min-width: 0;
  width: 100%;
}

/* ---- Map drawer ---- */
.report-map-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.report-map-header-text {
  min-width: 0;
}

.report-map-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.report-map-status {
  display: block;
  margin-top: 3px;
  font-size: 13px;
  font-style: italic;
}

.report-map-close {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
}

/* Fills the remaining drawer height. min-height:0 lets it shrink inside the flex
   column; without it the flex item keeps its content height and Mapbox overflows. */
.report-map-canvas {
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
  margin-top: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
}

@media (max-width: 768px) {
  .report-map-header {
    padding-bottom: 10px;
  }

  .report-map-title {
    font-size: 15px;
  }

  .report-map-status {
    font-size: 12px;
  }

  .report-map-canvas {
    margin-top: 8px;
    border-radius: 6px;
  }
}

/* ---- Nested per-indicator table ---- */
.filing-nested-table :deep(.el-table) {
  font-size: 12px;
}

.filing-nested-table :deep(.el-table th),
.filing-nested-table :deep(.el-table td) {
  padding: 4px 0;
}

.filing-nested-table :deep(.el-table .cell) {
  line-height: 1.4;
}

/* Summary row reads as a note, not data */
.filing-nested-table :deep(.el-table__footer .cell) {
  font-style: italic;
  text-align: right;
  color: var(--el-text-color-secondary);
}

.filing-meta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 4px 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.filing-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.filing-meta-sep {
  color: var(--el-border-color);
}

.report-new-badge :deep(.el-badge__content.is-dot) {
  right: -2px;
  top: 2px;
}

.filing-status-tag {
  margin-right: 4px;
}

.sett-toolbar-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  min-width: 0;
}

.sett-toolbar-row--compact {
  flex-wrap: nowrap;
}

.sett-toolbar-row--wide {
  flex-wrap: nowrap;
}

.sett-toolbar-col {
  min-width: 0;
}

.sett-toolbar-col--back {
  flex: 0 0 auto;
}

/* Filters take all space up to the action buttons, which keep their natural width */
.sett-toolbar-row--wide .sett-toolbar-col--search {
  flex: 1 1 auto;
  min-width: 160px;
}

.sett-toolbar-row--wide .sett-toolbar-col--actions {
  flex: 0 0 auto;
  min-width: 0;
  margin-left: auto;
}

.sett-toolbar-row--compact .sett-toolbar-col--search {
  flex: 1 1 120px;
}

.sett-toolbar-row--compact .sett-toolbar-col--actions {
  flex: 0 0 auto;
}

.sett-toolbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
  flex-wrap: nowrap;
  width: 100%;
}

.sett-toolbar-actions--desktop {
  flex-wrap: wrap;
}

.report-toolbar-filters {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

@media (min-width: 900px) {
  .report-toolbar-filters {
    flex-direction: row;
  }
}

.indicator-category-report-page-card {
  width: 100%;
}

.indicator-category-report-page-card :deep(.el-card__body) {
  width: 100%;
}

.indicator-category-report-table-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.indicator-category-report-table-wrap :deep(.indicator-category-report-table),
.indicator-category-report-table-wrap :deep(.el-table__inner-wrapper),
.indicator-category-report-table-wrap :deep(.el-table__header-wrapper),
.indicator-category-report-table-wrap :deep(.el-table__body-wrapper) {
  width: 100% !important;
}

.indicator-category-report-table-wrap :deep(.el-table__header colgroup col),
.indicator-category-report-table-wrap :deep(.el-table__body colgroup col) {
  min-width: 0;
}

.indicator-category-report-table-wrap :deep(.el-table__header table),
.indicator-category-report-table-wrap :deep(.el-table__body table) {
  width: 100% !important;
  table-layout: fixed;
}

.indicator-category-report-table-wrap :deep(.el-table__empty-block) {
  width: 100% !important;
}

.drawer-footer-bar {
  padding: 12px 20px;
  border-top: 1px solid var(--el-border-color);
  text-align: right;
}

.indicator-category-report-drawer-steps {
  margin-bottom: 20px;
}
</style>

<style scoped>
.my-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
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

.item {
  margin-top: 10px;
  margin-right: 40px;
}

.documents-cell {
  display: flex;
  justify-content: center;
  align-items: center;
}

.documents-button {
  min-width: 60px;
  font-weight: 600;
}

.no-documents {
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0.5;
}

/* Map drawer: body is a column so the map canvas can fill the remaining height */
.report-map-drawer .el-drawer__body {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 768px) {
  .report-map-drawer .el-drawer__body {
    padding: 12px;
  }
}
</style>
