<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
// @ts-nocheck
import { useI18n } from '@/hooks/web/useI18n'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { ElButton, ElSelect } from 'element-plus'
import {
  Plus,
  Download,
  Filter,
  Edit,
  InfoFilled,
  CopyDocument, Back,
  Delete
} from '@element-plus/icons-vue'

import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  ElPagination, ElTooltip, ElOption, ElDivider, ElSwitch, ElTable, ElTableColumn, ElRow, ElCol, ElTour, ElTourStep,
  ElDialog, ElForm, ElFormItem, ElInput, FormRules, ElCheckbox, ElPopconfirm, ElCard, ElStep, ElSteps, ElDrawer, ElMessageBox, ElMessage,
} from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import type { FormInstance } from 'element-plus'
import { getModelSpecs } from '@/api/fields'

import { getListWithoutGeo } from '@/api/counties'
import { getUniqueFieldValues } from '@/api/households'

import { resolveChartTypeIcon } from '@/utils/chartTypeIcons'
import DownloadAll from '@/views/Components/DownloadAll.vue';
import PermissionWrapper from '@/components/PermissionWrapper.vue';
import { isDashboardSettingsAdmin } from '@/utils/documentPermissions';


const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)

 
console.log("userInfo--->", userInfo)






const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
const value3 = ref([])
const value4 = ref([])
const value5 = ref([])

const componentOptions = ref([])
const categories = ref([])
const filteredIndicators = ref([])
const page = ref(1)

const selCounties = []
const loading = ref(true)
const drawerLoading = ref(false)
const drawerLoadingText = ref('Please wait...')
const currentPage = ref(1)
const total = ref(0)
const downloadLoading = ref(false)


const mobileBreakpoint = 768;
const defaultpSize = 10;
const mobilepSize = 5;
const pSize = ref(defaultpSize);

// Function to update pSize based on window width
const updatepSize = () => {
  if (window.innerWidth <= mobileBreakpoint) {
    pSize.value = mobilepSize;
  } else {
    pSize.value = defaultpSize;
  }
};

const getDefaultFilters = () => {
  if (isDashboardSettingsAdmin(userInfo)) {
    return { filters: [] as string[], filterValues: [] as any[][] }
  }
  return { filters: ['createdBy'], filterValues: [[userInfo.id]] }
}

const getSectionIdsForDashboards = (dashboardIds: any[]) => {
  if (!dashboardIds.length) return []
  return DashBoardSectionOptions.value
    .filter((opt: any) => dashboardIds.includes(opt.dashboard_id))
    .map((opt: any) => opt.value)
}

const buildChartListFilters = () => {
  const { filters: apiFilters, filterValues: apiFilterValues } = getDefaultFilters()
  const dashboardIds = normalizeDashboardIds(value5.value)
  const sectionIds = normalizeDashboardIds(value3.value)

  let effectiveSectionIds = sectionIds
  if (dashboardIds.length > 0) {
    const sectionsForDashboard = getSectionIdsForDashboards(dashboardIds)
    effectiveSectionIds = sectionIds.length > 0
      ? sectionIds.filter((id) => sectionsForDashboard.includes(id))
      : sectionsForDashboard
  }

  if (effectiveSectionIds.length > 0) {
    apiFilters.push('dashboard_section_id')
    apiFilterValues.push(effectiveSectionIds)
  }

  return { filters: apiFilters, filterValues: apiFilterValues }
}

const refreshChartList = async ({ silent = false } = {}) => {
  const { filters: apiFilters, filterValues: apiFilterValues } = buildChartListFilters()
  filters = apiFilters
  filterValues = apiFilterValues
  await getFilteredData(apiFilters, apiFilterValues, { silent })
}

// Set up event listener on mount and load chart list after filter options are ready
onMounted(async () => {
  window.addEventListener('resize', updatepSize)
  updatepSize()
  loading.value = true
  await Promise.all([getdashboardOptions(), getDashSectionOptions()])
  await refreshChartList()
})




let filters: string[] = []
let filterValues: any[][] = []

//const showAdminButtons =  ref(appStore.getAdminButtons)
const showAdminButtons = true
//const showEditButtons =  ref(appStore.getEditButtons)
const showEditButtons = true



// filter Charts only admins can see all 
if (isDashboardSettingsAdmin(userInfo)) {
  filters = []
  filterValues = []
}
else {

  filters = ['createdBy']
  filterValues = [[userInfo.id]]
}




var tblData = []


console.log("Show Buttons -->", showAdminButtons)



const showStatusExtras = ref(false)
const ModelOptions = [
  {
    value: 'settlement',
    label: 'Settlement'
  },
  {
    value: 'settlement_population',
    label: 'Settlement Population'
  },
  {
    value: 'grievance',
    label: 'Grievances'
  },
  {
    value: 'households',
    label: 'Household'
  },
  {
    value: 'project',
    label: 'Project'
  },
  {
    value: 'education_facility',
    label: 'Schools'
  },
  {
    value: 'health_facility',
    label: 'Hospitals'
  },
  {
    value: 'road',
    label: 'Roads'
  },


]


const aggregationOptionsFiltered = ref([])

const aggregationOptions = [
  {
    value: 'sum',
    label: 'Sum'
  },
  {
    value: 'count',
    label: 'Count'
  },
  {
    value: 'AVG',
    label: 'Average'
  }
]

aggregationOptionsFiltered.value = aggregationOptions




let tableDataList = ref<any[]>([])
// keep track of currently selected dashboard ids for optional client-side filtering
const selectedDashboardIds = ref<any[]>([])

const sortByDashboard = (a: any, b: any) => {
  const titleA = (a?.dashboard_section?.dashboard?.title || '').toString().toLowerCase()
  const titleB = (b?.dashboard_section?.dashboard?.title || '').toString().toLowerCase()
  if (titleA < titleB) return -1
  if (titleA > titleB) return 1
  return 0
}
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']

const associated_Model = ''
const associated_multiple_models = ['dashboard_section', 'indicator']
const nested = ['dashboard_section', 'dashboard']

const model = 'dashboard_section_chart'
//// ------------------parameters -----------------------////

const { t } = useI18n()
const AddDialogVisible = ref(false)
const formHeader = ref('Add Chart')
const showSubmitBtn = ref(true)
const showEditSaveButton = ref(false)



const columns: TableColumn[] = [
  {
    field: 'id',
    label: t('Id'),

  },

  {
    field: 'title',
    label: t('Title')
  },



  {
    field: 'description',
    label: t('Description')
  },
  {
    field: 'action',
    label: t('Actions')
  }

]
const handleClear = async () => {
  value1.value = []
  value2.value = []
  value3.value = []
  value4.value = []
  value5.value = []
  selectedDashboardIds.value = []
  currentPage.value = 1
  page.value = 1
  tblData = []
  DashBoardSectionFilterdOptions.value = [...DashBoardSectionOptions.value]
  await refreshChartList()
}


// Normalize dashboard id(s) to an array of ids
const normalizeDashboardIds = (dashboard_id: any) => {
  if (Array.isArray(dashboard_id)) {
    return dashboard_id
  }
  if (dashboard_id === null || dashboard_id === undefined || dashboard_id === '') {
    return []
  }
  return [dashboard_id]
}



const handleSelectDashboardSection = async () => {
  await refreshChartList()
}

const onPageChange = async (selPage: any) => {
  page.value = selPage
  await refreshChartList()
}

const onpSizeChange = async (size: any) => {
  pSize.value = size
  await refreshChartList()
}




const getFilteredData = async (selFilters, selfilterValues, { silent = false } = {}) => {
  if (!silent) loading.value = true
  try {
    const formData = {}
    formData.limit = pSize.value
    formData.page = page.value
    formData.curUser = 1 // Id for logged in user
    formData.model = model
    formData.searchField = 'title'
    formData.searchKeyword = ''
    formData.assocModel = associated_Model
    formData.filters = selFilters
    formData.filterValues = selfilterValues
    formData.associated_multiple_models = associated_multiple_models
    formData.nested_models = nested

    const res = await getSettlementListByCounty(formData)
    tableDataList.value = res.data || []
    total.value = res.total
    tblData = []
  } finally {
    if (!silent) loading.value = false
  }
}



const getIndicatorOptions = async () => {
  const res = await getCountyListApi({
    params: {
      //   pageIndex: 1,
      //   limit: 100,
      curUser: 1, // Id for logged in user
      model: 'dashboard_card',
      searchField: 'title',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    var ret = response.data

    // pass result to the makeoptions

    categories.value = ret
    makeOptions(categories)
  })
}



const makeOptions = (list) => {
  console.log('making the options..............', list)
  componentOptions.value = []
  list.value.forEach(function (arrayItem: { id: string; type: string }) {
    var countyOpt = {}
    countyOpt.value = arrayItem.id
    countyOpt.label = arrayItem.title  
    //  console.log(countyOpt)
    componentOptions.value.push(countyOpt)
  })
}

const handleDownload = () => {
  downloadLoading.value = true
  const data = tblData
  const fileName = 'cards.xlsx'
  const exportType = exportFromJSON.types.csv
  if (data) exportFromJSON({ data, fileName, exportType })
}


const dashboardOptions = ref([])

const getdashboardOptions = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'dashboard',
      searchField: 'title',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received dashboardOptions:', response)
    //tableDataList.value = response.data
    var ret = response.data

    // loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var opt = {}
      opt.value = arrayItem.id
      opt.label = arrayItem.title 
      //  console.log(countyOpt)
      opt.type = arrayItem.type

      dashboardOptions.value.push(opt)
    })
  })
}

const DashBoardSectionOptions = ref([])
const DashBoardSectionFilterdOptions = ref([])

const getDashSectionOptions = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'dashboard_section',
      searchField: 'title',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    var ret = response.data

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var opt = {}
      opt.value = arrayItem.id
      opt.label = arrayItem.title  
      opt.dashboard_id = arrayItem.dashboard_id

      //  console.log(countyOpt)
      DashBoardSectionOptions.value.push(opt)
      DashBoardSectionFilterdOptions.value.push(opt)

    })
  })
}



const editIndicator = (data: TableSlotDefault) => {
  showSubmitBtn.value = false
  showEditSaveButton.value = true
  console.log('Editing', data.row)


  ruleForm.id = data.row.id
  ruleForm.title = data.row.title
  ruleForm.dashboard_section_id = data.row.dashboard_section_id
  ruleForm.dashboard_id = data.row.dashboard_section.dashboard_id
  ruleForm.description = data.row.description
  ruleForm.iconColor = data.row.iconColor
  ruleForm.icon = data.row.icon
  ruleForm.aggregation = data.row.aggregation
  ruleForm.type = data.row.type

  // ruleForm.filter_field = data.row.filter_field
  ruleForm.filtered = data.row.filtered

  ruleForm.filter_function = data.row.filter_function
  ruleForm.filter_option = data.row.filter_option
  ruleForm.ignore_empty = data.row.ignore_empty
  ruleForm.category = data.row.category
  ruleForm.filters = data.row.filters
  tableData.value = data.row.filters ?? [];

  value4.value = data.row.dashboard_section.dashboard.id

  let indicators = []
  data.row.indicators.forEach(function (arrayItem) {
    indicators.push(arrayItem.id)
  })

  ruleForm.indicator_id = indicators

  ruleForm.card_model = data.row.card_model
  ruleForm.categorized = data.row.categorized
  ruleForm.time_field = data.row.time_field || 'createdAt'
  ruleForm.metric_fields = Array.isArray(data.row.metric_fields) ? data.row.metric_fields : []

  ruleForm.categorized = data.row.categorized

  console.log('ruleForm.card_model_field', ruleForm.card_model_field)

  if (data.row.category == "Intervention") {
    console.log("Filter Option >>>>>", data.row.filter_option)
    changeFilterForIndicators()

  } else {
    console.log('Edit Filter Values,', data.row.filter_value)

    handleSelectModel(ruleForm.card_model)


    if (data.row.card_model === "households") {

      chartOptions.value = [
        {
          value: 1,
          label: 'Simple Bar'
        },
        {
          value: 2,
          label: 'Multiple Bar'
        },
        {
          value: 3,
          label: 'Pie'
        },
      {
        value: 10,
        label: 'Donut'
      },

         {
        value: 11,
        label: 'Word Map'
      },
        {
          value: 4,
          label: 'Stacked Bar(100%)'
        },
        {
          value: 9,
          label: 'Stacked Bar(Absolute)'
        },
        {
          value: 5,
          label: 'Line Chart'
        },
        {
          value: 12,
          label: 'Multi-variable Line'
        },

        {
          value: 7,
          label: 'Map Chart'
        },

        {
          value: 8,
          label: 'Population Pyramid'
        },

      ]
    } else {
      chartOptions.value = [
        {
          value: 1,
          label: 'Simple Bar'
        },
        {
          value: 2,
          label: 'Multiple Bar'
        },
        {
          value: 3,
          label: 'Pie'
        },
{
        value: 10,
        label: 'Donut'
      },
       {
        value: 11,
        label: 'Word Map'
      },
        {
          value: 4,
          label: 'Stacked Bar(100%)'
        },
        {
          value: 9,
          label: 'Stacked Bar(Absolute)'
        },
        {
          value: 5,
          label: 'Line Chart'
        },
        {
          value: 12,
          label: 'Multi-variable Line'
        },
        /* {
          value: 6,
          label: 'Stacked Line Chart'
        },
      */
        {
          value: 7,
          label: 'Map Chart'
        },


      ]
    }

    // Funtions to populate lookups 


    handleFilterFunction(data.row.filter_function)



    if (data.row.filter_field) {
      // Get filter values only if the previous chart verison had fulters on
      getFieldValues(data.row.filter_field)
    }

    //handleFilterAggregators( data.row.card_model_field) 


  }




  if (data.row.category == 'Status') {
    showStatusExtras.value = true
  } else {
    showStatusExtras.value = false

  }




  ruleForm.card_model_field = data.row.card_model_field



  formHeader.value = 'Edit Chart'

  console.log('ruleForm', ruleForm)

  AddDialogVisible.value = true
}


const CloneChart = (data: TableSlotDefault) => {
  showSubmitBtn.value = true
  showEditSaveButton.value = false
  console.log('Editing', data)
  formHeader.value = 'Clone Chart'


  ruleForm.title = data.row.title
  ruleForm.dashboard_section_id = data.row.dashboard_section_id
  ruleForm.dashboard_id = data.row.dashboard_section.dashboard_id
  ruleForm.description = data.row.description
  ruleForm.iconColor = data.row.iconColor
  ruleForm.icon = data.row.icon
  ruleForm.aggregation = data.row.aggregation
  ruleForm.type = data.row.type
  ruleForm.filter_field = data.row.filter_field
  ruleForm.filtered = data.row.filtered

  ruleForm.filter_function = data.row.filter_function
  ruleForm.filter_option = data.row.filter_option
  ruleForm.ignore_empty = data.row.ignore_empty
  ruleForm.category = data.row.category
  ruleForm.card_model_field = data.row.card_model_field


  value4.value = data.row.dashboard_section.dashboard.id

  let indicators = []
  data.row.indicators.forEach(function (arrayItem) {
    indicators.push(arrayItem.id)
  })

  ruleForm.indicator_id = indicators

  ruleForm.card_model = data.row.card_model
  ruleForm.categorized = data.row.categorized
  ruleForm.time_field = data.row.time_field || 'createdAt'
  ruleForm.metric_fields = Array.isArray(data.row.metric_fields) ? data.row.metric_fields : []

  if (data.row.category == 'Status') {
    showStatusExtras.value = true
  } else {
    showStatusExtras.value = false

  }

  if (data.row.filter_value) {

    data.row.filter_value.forEach(item => {
      console.log(item);
      filterValues.push(parseInt(item))
    });

    ruleForm.filter_value = data.row.filter_value

  }


  console.log('Edit Filter Values,', data.row.filter_value)

  if (data.row.card_model === "households") {

    chartOptions.value = [
      {
        value: 1,
        label: 'Simple Bar'
      },
      {
        value: 2,
        label: 'Multiple Bar'
      },
      {
        value: 3,
        label: 'Pie'
      },
      {
        value: 10,
        label: 'Donut'
      },
 {
        value: 11,
        label: 'Word Map'
      },
      {
        value: 4,
        label: 'Stacked Bar(100%)'
      },

      {
        value: 9,
        label: 'Stacked Bar(Absolute)'
      },
      {
        value: 5,
        label: 'Line Chart'
      },
      {
        value: 12,
        label: 'Multi-variable Line'
      },

      {
        value: 7,
        label: 'Map Chart'
      },

      {
        value: 8,
        label: 'Population Pyramid'
      },

    ]
  } else {
    chartOptions.value = [
      {
        value: 1,
        label: 'Simple Bar'
      },
      {
        value: 2,
        label: 'Multiple Bar'
      },
      {
        value: 3,
        label: 'Pie'
      },
{
        value: 10,
        label: 'Donut'
      },
       {
        value: 11,
        label: 'Word Map'
      },
      {
        value: 4,
        label: 'Stacked Bar(100%)'
      },
      {
        value: 9,
        label: 'Stacked Bar(Absolute)'
      },
      {
        value: 5,
        label: 'Line Chart'
      },
      {
        value: 12,
        label: 'Multi-variable Line'
      },
      /* {
        value: 6,
        label: 'Stacked Line Chart'
      },
    */
      {
        value: 7,
        label: 'Map Chart'
      },


    ]
  }

  // Funtions to populate lookups 




  handleFilterFunction(data.row.filter_function)
  if (data.row.card_model) {
    //   handleSelectModel(data.row.card_model)  
  }


  if (data.row.filter_field) {
    // Get filter values only if the previous chart verison had fulters on
    getFieldValues(data.row.filter_field)
  }

  //handleFilterAggregators( data.row.card_model_field) 




  console.log('ruleForm', ruleForm)

  AddDialogVisible.value = true
}


const DeleteIndicator = async (data: TableSlotDefault) => {
  console.log('----->', data.row.id)
  let formData = {}
  formData.id = data.row.id
  formData.model = model

  await DeleteRecord(formData).then(response => {
    console.log(response)
    // remove the deleted object from array list 
    let index = tableDataList.value.indexOf(data);
    if (index !== -1) {
      tableDataList.value.splice(index, 1);
    }

  })
    .catch(error => {
      console.log(error)

    });
  await refreshChartList()
}

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  title: '',
  dashboard_section_id: '',
  dashboard_id: '',
  description: '',
  iconColor: '',
  icon: '',
  aggregation: '',
  type: '',
  indicator_id: null,
  card_model_field: null,
  card_model: '',
  categorized: false,
  time_field: 'createdAt',
  metric_fields: [],
  filter_value: [],
  filter_function: '',
  filter_option: '',
  filtered: false,
  filter_field: '',
  ignore_empty: true,
  category: '',
  filters: null,


})
const getPreservedChartContext = () => ({
  dashboard_id: ruleForm.dashboard_id,
  dashboard_section_id: ruleForm.dashboard_section_id,
  category: ruleForm.category,
  card_model: ruleForm.card_model,
  card_model_field: ruleForm.card_model_field,
  type: ruleForm.type,
  aggregation: ruleForm.aggregation,
  categorized: ruleForm.categorized,
  time_field: ruleForm.time_field || 'createdAt',
  metric_fields: Array.isArray(ruleForm.metric_fields) ? [...ruleForm.metric_fields] : [],
  indicator_id: Array.isArray(ruleForm.indicator_id) ? [...ruleForm.indicator_id] : ruleForm.indicator_id,
  ignore_empty: ruleForm.ignore_empty,
  filtered: ruleForm.filtered,
  filter_field: ruleForm.filter_field,
  filter_function: ruleForm.filter_function,
  filter_value: ruleForm.filter_value,
  filter_option: ruleForm.filter_option,
  filters: ruleForm.filters ? JSON.parse(JSON.stringify(ruleForm.filters)) : null,
})

const resetChartForm = ({ closeDrawer = true, preserveContext = null } = {}) => {
  showSubmitBtn.value = true
  showEditSaveButton.value = false
  formHeader.value = 'Add Chart'
  activeStep.value = 0

  ruleForm.id = ''
  ruleForm.title = ''
  ruleForm.dashboard_section_id = ''
  ruleForm.dashboard_id = ''
  ruleForm.description = ''
  ruleForm.iconColor = ''
  ruleForm.icon = ''
  ruleForm.aggregation = ''
  ruleForm.type = ''
  ruleForm.indicator_id = null
  ruleForm.card_model_field = null
  ruleForm.card_model = ''
  ruleForm.categorized = false
  ruleForm.time_field = 'createdAt'
  ruleForm.metric_fields = []
  ruleForm.filter_value = []
  ruleForm.filter_function = ''
  ruleForm.filter_option = ''
  ruleForm.filtered = false
  ruleForm.filter_field = ''
  ruleForm.ignore_empty = true
  ruleForm.category = ''
  ruleForm.filters = null

  if (preserveContext) {
    Object.assign(ruleForm, preserveContext)
    tableData.value = Array.isArray(preserveContext.filters)
      ? JSON.parse(JSON.stringify(preserveContext.filters))
      : []
    showStatusExtras.value = preserveContext.category === 'Status'
  } else {
    tableData.value = []
    showStatusExtras.value = false
  }

  if (closeDrawer) {
    AddDialogVisible.value = false
  } else {
    initialFormJson.value = JSON.stringify(ruleForm)
    ruleFormRef.value?.clearValidate()
  }
  drawerLoading.value = false
}

const handleClose = () => {
  resetChartForm({ closeDrawer: true })
}

const initialFormJson = ref('')
const isFormDirty = computed(() => JSON.stringify(ruleForm) !== initialFormJson.value)
watch(AddDialogVisible, (visible) => {
  if (visible) {
    initialFormJson.value = JSON.stringify(ruleForm)
  }
})

const handleDrawerBeforeClose = (done) => {
  if (isFormDirty.value) {
    ElMessageBox.confirm(
      'You have unsaved changes. Do you really want to discard them and close?',
      'Unsaved Changes',
      { type: 'warning' }
    )
      .then(() => {
        handleClose()
        done()
      })
      .catch(() => {
        // user cancelled, do nothing
      })
  } else {
    handleClose()
    done()
  }
}



const rules = reactive<FormRules>({
  title: [
    { required: true, message: 'Please provide A title', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }
  ],
  dashboard_section_id: [
    { required: true, message: 'Please select a Dashboard', trigger: 'blur' },
  ],
  dashboard_id: [
    { required: true, message: 'Please select a Dashboard', trigger: 'blur' },
  ],

  description: [
    { required: true, message: 'Description is required', trigger: 'blur' },

  ],

  iconColor: [
    { required: true, message: 'iconColor is required', trigger: 'blur' },

  ],

  aggregation: [
    { required: true, message: 'Aggregation method is required', trigger: 'blur' },],


  type: [
    { required: true, message: 'Chart Type   is required', trigger: 'blur' },],

  card_model_field: [
    { required: true, message: 'Field  is required', trigger: 'blur' },],

  card_model: [
    { required: true, message: 'Entity is required  is required', trigger: 'blur' },],

  category: [
    { required: true, message: 'Category is required  is required', trigger: 'blur' },],



  indicator_id: [
    { required: true, message: 'Indicator(s) is required  is required', trigger: 'blur' },],


})

const AddCard = () => {
  AddDialogVisible.value = true
}


const submitForm = async (formEl: FormInstance | undefined, addAnother = false) => {


  if (!showStatusExtras.value) {
    ruleForm.card_model = 'indicator_category_report'
    ruleForm.card_model_field = 'id'
  }



  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ruleForm.model = model
      ruleForm.code = uuid.v4()
      if (!ruleForm.time_field) {
        ruleForm.time_field = 'createdAt'
      }
      if (ruleForm.type == 12) {
        if (!Array.isArray(ruleForm.metric_fields) || ruleForm.metric_fields.length < 2) {
          ElMessage.error('Select at least two metrics for a multi-variable line chart')
          return
        }
        ruleForm.card_model_field = ruleForm.metric_fields[0]
      }

      drawerLoadingText.value = 'Saving...'
      drawerLoading.value = true
      try {
        await CreateRecord(ruleForm)
        ElMessage.success('Chart created')
        await refreshChartList({ silent: true })
        resetChartForm({
          closeDrawer: !addAnother,
          preserveContext: addAnother ? getPreservedChartContext() : null,
        })
      } catch (error) {
        console.error(error)
        ElMessage.error('Failed to create chart')
        drawerLoading.value = false
      }

    } else {
      console.log('error submit!', fields)
    }
  })
}


const editForm = async (formEl: FormInstance | undefined, addAnother = false) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ruleForm.model = model
      if (!ruleForm.time_field) {
        ruleForm.time_field = 'createdAt'
      }
      if (ruleForm.type == 12) {
        if (!Array.isArray(ruleForm.metric_fields) || ruleForm.metric_fields.length < 2) {
          ElMessage.error('Select at least two metrics for a multi-variable line chart')
          return
        }
        ruleForm.card_model_field = ruleForm.metric_fields[0]
      }

      drawerLoadingText.value = 'Saving...'
      drawerLoading.value = true
      try {
        await updateOneRecord(ruleForm)
        ElMessage.success('Chart saved')
        await refreshChartList({ silent: true })
        resetChartForm({
          closeDrawer: !addAnother,
          preserveContext: addAnother ? getPreservedChartContext() : null,
        })
      } catch (error) {
        console.error(error)
        ElMessage.error('Failed to save chart')
        drawerLoading.value = false
      }

    } else {
      console.log('error submit!', fields)
    }
  })
}

const IndicatorCategoryOptions = ref([])


const getIndicatorCategories = async () => {
  const formData = {}

  formData.page = 1
  formData.limit = 10000 // Set a high limit to get all indicators
  formData.curUser = 1 // Id for logged in user
  formData.model = 'indicator'
  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  formData.assocModel = ''

  // - multiple filters -------------------------------------
  formData.filters = []
  formData.filterValues = []
  formData.associated_multiple_models = ['activity']

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('Total indicators loaded:', res.data.length)
  console.log('Total count from API:', res.total)
  
  res.data.forEach(function (arrayItem) {
    console.log(arrayItem)
    // delete arrayItem[associated_Model]['geom'] //  remove the geometry column

    // Skip items without activity or with null activity
    if (!arrayItem.activity || !arrayItem.activity.title) {
      console.warn('Skipping indicator without activity:', arrayItem)
      return
    }

    var opt = {}
    opt.value = arrayItem.id
    opt.label = arrayItem.name + '|' + arrayItem.activity.title
    IndicatorCategoryOptions.value.push(opt)

  })

  console.log('IndicatorCategoryOptions loaded:', IndicatorCategoryOptions.value.length)
}


getdashboardOptions()
getDashSectionOptions()

//getStrategicFocusAreas()
getIndicatorCategories()


const isInterventionsDashboard = ref(false)
const handleFilterDashboards = async (dashboard_id) => {
  const normalizedIds = normalizeDashboardIds(dashboard_id)
  selectedDashboardIds.value = normalizedIds

  if (normalizedIds.length === 0) {
    DashBoardSectionFilterdOptions.value = [...DashBoardSectionOptions.value]
    value3.value = []
    await refreshChartList()
    return
  }

  DashBoardSectionFilterdOptions.value = DashBoardSectionOptions.value.filter((option: any) =>
    normalizedIds.includes(option.dashboard_id)
  )

  const validSectionIds = new Set(DashBoardSectionFilterdOptions.value.map((option: any) => option.value))
  const currentSectionIds = normalizeDashboardIds(value3.value)
  const prunedSectionIds = currentSectionIds.filter((id) => validSectionIds.has(id))
  if (prunedSectionIds.length !== currentSectionIds.length) {
    value3.value = prunedSectionIds
  }

  await refreshChartList()
}


const fieldSet = ref([])
const getModeldefinition = async (selModel) => {
  console.log(selModel)
  var formData = {}
  formData.model = selModel


  await getModelSpecs(formData).then((response) => {

    var data = response.data

    var fieldsToFilter = ['title', 'name', 'geom', 'code', 'createdBy', 'updatedAt', "description", 'createdAt']; // Specify the fields you want to filter out

    var fields = data.filter(function (obj) {
      return !fieldsToFilter.includes(obj.field);
    });

    console.log("fields:", fields)
    //health_facility_fields.value = response.data
    //fieldSet.value = fields2


    fields.forEach(function (arrayItem) {
      // console.log(arrayItem)
      var opt = {}
      opt.value = arrayItem.field
      opt.label = arrayItem.field
      opt.type = arrayItem.type
      //  console.log(countyOpt)
      fieldSet.value.push(opt)
    })


  })

  console.log("getting fields fields", fieldSet.value)


}


const chartOptions = ref([])

const chartTypeLabel = (type) => {
  const match = chartOptions.value.find((item) => item.value === type)
  return match?.label || `Type ${type}`
}

chartOptions.value = [
  {
    value: 1,
    label: 'Simple Bar'
  },
  {
    value: 2,
    label: 'Multiple Bar'
  },
  {
    value: 3,
    label: 'Pie'
  },

  {
    value: 4,
    label: 'Stacked Bar(100%)'
  },
  {
    value: 9,
    label: 'Stacked Bar(Absolute)'
  },
  {
    value: 5,
    label: 'Line Chart'
  },
  {
    value: 12,
    label: 'Multi-variable Line'
  },

  {
    value: 7,
    label: 'Map Chart'
  },

  {
    value: 8,
    label: 'Population Pyramid'
  },
  {
    value: 10,
    label: 'Donut'
  },
   {
        value: 11,
        label: 'Word Map'
      },
]

const hideCategorize = ref(true)

const showTimeFieldConfig = computed(() => ruleForm.type === 5 || ruleForm.type === 6 || ruleForm.type === 12)
const showMetricFieldConfig = computed(() => ruleForm.type === 12 && ruleForm.category === 'Status' && ruleForm.card_model)
const showSingleFieldConfig = computed(() => ruleForm.category === 'Status' && ruleForm.card_model && ruleForm.type !== 12)

const numericMetricFieldOptions = computed(() => {
  const numericTypes = new Set(['INTEGER', 'BIGINT', 'FLOAT', 'DOUBLE', 'DECIMAL'])
  return (fieldSet.value || []).filter((field) => numericTypes.has(field.type))
})

const timeFieldOptions = computed(() => {
  const options = [{ value: 'createdAt', label: 'Created at (default)' }]
  const seen = new Set(['createdAt'])
  for (const field of fieldSet.value || []) {
    if (!field?.value || seen.has(field.value)) continue
    if (field.type === 'INTEGER' || field.type === 'DATE' || field.type === 'DATEONLY') {
      options.push({ value: field.value, label: field.label || field.value })
      seen.add(field.value)
    }
  }
  return options
})

const handleSelectModel = async (selModel) => {

  fieldSet.value = []
  ruleForm.card_model_field = null
  console.log('specs.....')
  await getModeldefinition(selModel)

  if (selModel === "households") {

    chartOptions.value = [
      {
        value: 1,
        label: 'Simple Bar'
      },
      {
        value: 2,
        label: 'Multiple Bar'
      },
      {
        value: 3,
        label: 'Pie'
      },
{
        value: 10,
        label: 'Donut'
      },
       {
        value: 11,
        label: 'Word Map'
      },
      {
        value: 4,
        label: 'Stacked Bar(100%)'
      },

      {
        value: 9,
        label: 'Stacked Bar(Absolute)'
      },
      {
        value: 5,
        label: 'Line Chart'
      },
      {
        value: 12,
        label: 'Multi-variable Line'
      },

      {
        value: 7,
        label: 'Map Chart'
      },

      {
        value: 8,
        label: 'Population Pyramid'
      },

    ]
  } else {
    chartOptions.value = [
      {
        value: 1,
        label: 'Simple Bar'
      },
      {
        value: 2,
        label: 'Multiple Bar'
      },
      {
        value: 3,
        label: 'Pie'
      },

      {
        value: 10,
        label: 'Donut'
      },
 {
        value: 11,
        label: 'Word Map'
      },
      {
        value: 4,
        label: 'Stacked Bar(100%)'
      },
      {
        value: 9,
        label: 'Stacked Bar(Absolute)'
      },
      {
        value: 5,
        label: 'Line Chart'
      },
      {
        value: 12,
        label: 'Multi-variable Line'
      },
      /* {
        value: 6,
        label: 'Stacked Line Chart'
      },
    */
      {
        value: 7,
        label: 'Map Chart'
      },


    ]
  }


}
const handleSelectChart = async (ctype) => {
  if (ctype == 7 || ctype == 12) {
    hideCategorize.value = true
  } else {
    hideCategorize.value = false
  }
  if (ctype == 12 && (!Array.isArray(ruleForm.metric_fields) || ruleForm.metric_fields.length === 0)) {
    ruleForm.metric_fields = []
  }
}

// const handleFilterAggregators = async (selModel) => {
//    console.log('filtreing teh aggregators.....',selModel, fieldSet )
//    fieldSelected.value=true 

//    let selectedField = fieldSet.value.filter(option => option.value  == selModel);
//    console.log('selectedField', selectedField)
//   let selFieldType = selectedField[0].type

//    if (selFieldType==="STRING") {
//      aggregationOptionsFiltered.value = aggregationOptions.filter(option => option.value === 'count');
//      functionOptions.value = [
//          {
//             value: 'all',
//             label: 'All'
//           },

//           {
//             value: 'eq',
//             label: 'Equal'
//           },

//      ]


//    } else {
//     aggregationOptionsFiltered.value =aggregationOptions

//     functionOptions.value = [
//          {
//             value: 'all',
//             label: 'All'
//           },
//           {
//             value: 'lt',
//             label: 'Less Than'
//           },
//           {
//             value: 'lte',
//             label: 'Less than or equal to'
//           },

//           {
//             value: 'eq',
//             label: 'Equal'
//           },
//           {
//             value: 'gte',
//             label: 'Greater than or equal to'
//           },

//      ]

//   }


//   console.log("functionOptions",functionOptions.value)



// }


const getFieldValues = async (selField) => {

  if (ruleForm.category == "Intervention") {

    console.log(selField)
    if (selField == 'programme_implementation_id') {
      fieldOptions.value = implementationOptions.value
      return
    } else {

      fieldOptions.value = []
      return
    }


    //  return 



  }
  console.log('getFieldValues', selField)
  console.log('Filter Fields 1.....', selField)
  fieldOptions.value = []
  const formData = {}
  formData.model = ruleForm.card_model
  //-Search field--------------------------------------------
  formData.selectedField = selField

  //--Single Filter -----------------------------------------


  const res = await getUniqueFieldValues(formData)
  console.log('Filter Fields 2:', res.data)


  res.data.forEach(function (arrayItem: {}) {
    var opt = {}
    console.log(arrayItem)
    opt.value = arrayItem
    opt.label = arrayItem
    // opt.title = arrayItem.category.title

    fieldOptions.value.push(opt)
  })


  // Herer we get the filter functions
  let selectedField = fieldSet.value.filter(option => option.value == selField);
  console.log('selectedField', selectedField)
  let selFieldType = selectedField[0].type

  if (selFieldType === "STRING") {
    aggregationOptionsFiltered.value = aggregationOptions.filter(option => option.value === 'count');
    functionOptions.value = [
      {
        value: 'all',
        label: 'All'
      },

      {
        value: 'eq',
        label: 'Equal'
      },

    ]


  } else {
    aggregationOptionsFiltered.value = aggregationOptions

    functionOptions.value = [
      {
        value: 'all',
        label: 'All'
      },
      {
        value: 'lt',
        label: 'Less Than'
      },
      {
        value: 'lte',
        label: 'Less than or equal to'
      },

      {
        value: 'eq',
        label: 'Equal'
      },
      {
        value: 'gte',
        label: 'Greater than or equal to'
      },

    ]

  }


}

const fieldSelected = ref(false)
const functionOptions = ref([])


const onSwitchChange = async (val) => {

  console.log('onSwitchChange', val)

  if (val) {
    // ruleForm.filter_field=ruleForm.indicator_id
    changeFilterForIndicators()
  } else {
    ruleForm.filter_field = null
    ruleForm.filter_value = []
    changeFilterForIndicators()

  }



  // for interventions show the filter values directlyt
  if (!showStatusExtras.value) {
    console.log('Indicators only....', fieldSelected)
    fieldSelected.value = true   // show filter field 

    functionOptions.value = [
      {
        value: 'all',
        label: 'All'
      },
      {
        value: 'lt',
        label: 'Less Than'
      },
      {
        value: 'lte',
        label: 'Less than or equal to'
      },

      {
        value: 'eq',
        label: 'Equal'
      },
      {
        value: 'gte',
        label: 'Greater than or equal to'
      },

    ]

  }
}

// Filters for interventions
const implementationOptions = ref([])
const getImplementationSponsors = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'programme_implementation',
      searchField: 'title',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    //console.log('Received response:', response)
    //tableDataList.value = response.data
    const ret = response.data

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      const parentOpt = {}
      parentOpt.value = arrayItem.id
      parentOpt.label = arrayItem.acronym
      //  console.log(countyOpt)
      implementationOptions.value.push(parentOpt)
    })
  })
}

getImplementationSponsors()

const filterInterventionsOptions = [
  {
    value: 'quantity',
    label: 'Quantity'
  },

  {
    value: 'programme',
    label: 'Programme'
  }
]




const changeFilterForIndicators = async () => {

  console.log('ruleForm.category', ruleForm.category)


  // fieldSet.value=[]
  // functionOptions.value=[]
  // fieldOptions.value=[]

  // Fieldsets 
  let prog = { 'value': 'programme_implementation_id', 'label': 'Programme' }
  let qty = { 'value': 'amount', 'label': 'Quantity' }
  fieldSet.value.push(prog)
  fieldSet.value.push(qty)

  let func = { 'value': 'eq', 'label': 'Equal' }
  functionOptions.value.push(func)









}



const showFilterValues = ref(false)
const handleFilterFunction = async (val) => {
  if (val == 'all') {
    showFilterValues.value = false
    ruleForm.filter_value = []
  }

  else {
    showFilterValues.value = true

  }



}


const fieldOptions = ref([])
const isMobile = computed(() => appStore.getMobile)

console.log('IsMobile', isMobile)


const categoryOptions = [
  {
    value: 'Status',
    label: 'Status'
  },
  {
    value: 'Intervention',
    label: 'Intervention'
  }
]

const InterventionChart = ref(false)
const handleSelectType = async (status) => {
  //   let selDashboard = DashboardOptions.value.filter(item => item.value === dashboard_id);


  if (status === 'Status') {  // status dashabords 
    showStatusExtras.value = true
    InterventionChart.value = false

  } else {
    showStatusExtras.value = false
    InterventionChart.value = true
  }
}

const infoDialog = ref(false)

const tableData = ref([])

const saveFilter = () => {
  const nonNullItems = tableData.value.filter(item => item.field !== null && item.operation !== null);
  const plainObjects = nonNullItems.map(item => JSON.parse(JSON.stringify(item)));
  ruleForm.filters = plainObjects;
  ElMessage.success('Filters saved');
  console.log('ruleForm', ruleForm)
}

const onAddItem = () => {

  console.log('tableData.value', tableData.value)

  console.log('adding....')

  tableData.value.push({
    field: null,
    operation: null,
    value: []
  })




}



const deleteRow = (index: number) => {
  tableData.value.splice(index, 1)
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


const searchKey = ref('')


// Define the computed property
const charts_filtered = computed(() => {
  const searchValue = searchKey.value.toLowerCase();
  // Log current project_locations value
  return tableDataList.value.filter(data => {
    // Ensure all fields are checked and filtered
    const matchesTitle = data.title.toLowerCase().includes(searchValue);
    return !searchValue || matchesTitle;
  });
});


const activeStep = ref(0)
const nextStep = async () => {
  //console.log(ruleFormRef.value)
  await ruleFormRef.value?.validate((valid) => {
    if (valid) {
      if (activeStep.value < 3) {
        activeStep.value++
      }
    }
  })
}
const prevStep = () => {
  if (activeStep.value > 0) {
    activeStep.value--;
  }
}


const showTourStep0 = ref(false)
const showTourStep1 = ref(false)
const showTourStep2 = ref(false)
const showTourStep3 = ref(false)
const isTourVisible = ref(false)


const showTour = () => {

  isTourVisible.value = true


}

const filteredTourSteps = computed(() => {

  const fil = tourSteps.value.filter(step => step.step == activeStep.value && step.visible == true);
  console.log('filteredTourSteps', fil)
  return fil
});


const endTour = () => {
  showTourStep0.value = false
  showTourStep1.value = false
  showTourStep2.value = false
  showTourStep3.value = false
}


const tourSteps = ref([
  // Steps for activeStep 0
  {
    step: 0,
    target: '#btn1',
    title: 'Select Dashboard',
    content: 'Choose a dashboard from the list to proceed.',
    visible: true
  },
  {
    step: 0,
    target: '#btn2',
    title: 'Select Dashboard Section',
    content: 'Pick a section within the selected dashboard.',
    visible: true

  },
  {
    step: 0,
    target: '#btn3',
    title: 'Enter Title',
    content: 'Provide a title for this chart..',
    visible: true

  },
  {
    step: 0,
    target: '#btn4',
    title: 'Enter Description',
    content: 'Add a description to give more context.',
    visible: true

  },

  // Steps for activeStep 1
  {
    step: 1,
    target: '#btn5',
    title: 'Select Category',
    content: 'Choose the Type of Dashboard.',
    visible: true

  },
  {
    step: 1,
    target: '#btn6',
    title: 'Select Entity',
    content: 'Select an entity to summarize.',
    visible: ruleForm.category === 'Status'

  },
  {
    step: 1,
    target: '#btn7',
    title: 'Select Field',
    content: 'Select the field to summarize if the category is "Status".',
    visible: ruleForm.category === 'Status' && ruleForm.card_model

  },


  {
    step: 1,
    target: '#btn8',
    title: 'Indicator',
    content: 'Select the Indicator(s) to summarize',
    visible: ruleForm.category === 'Intervention'


  },

  {
    step: 1,
    target: '#btn9',
    title: 'Categorization',
    content: 'Categorized by selected field',
    visible: ruleForm.category === 'Status' && ruleForm.card_model && !hideCategorize.value

  },

  {
    step: 1,
    target: '#btn10',
    title: 'Ignore Empty Records',
    content: 'Enable this to ignore records with missing data.',
    visible: true
  },

  {
    step: 1,
    target: '#btn11',
    title: 'Select Chart Type',
    content: 'Choose the type of chart to visualize your data.',
    visible: true
  },

  {
    step: 1,
    target: '#btn12',
    title: 'Select Aggregation',
    content: 'Choose how to aggregate your data.',
    visible: ruleForm.category
  },
  // Steps for activeStep 2

  {
    step: 2,
    target: '#btn13',
    title: 'Add Filters',
    content: 'Add and configure filters for your data.',
    visible: true
  },
]);

// Watch dependencies and log changes (or trigger additional actions)
watch(
  [activeStep, showStatusExtras, hideCategorize, tourSteps],
  (newValues, oldValues) => {
    console.log("Dependencies changed:", newValues);
    console.log("Filtered steps:", filteredTourSteps.value);
    // Any other side effects or actions can be performed here
  },
  { immediate: true }
);

</script>

<template>
  <el-card>

    <el-row type="flex" justify="start" gutter="10" style="display: flex; flex-wrap: nowrap; align-items: center;">

      <div class="max-w-200px">
        <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
          Back
        </el-button>
      </div>

      <!-- Title Search -->
      <el-select
v-model="value5" @change="handleFilterDashboards" @clear="handleClear" multiple clearable
        filterable collapse-tags placeholder="Search Dashboard" style="width: 35%; margin-right: 10px;">
        <el-option v-for="item in dashboardOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>

      <el-select
v-model="value3" @change="handleSelectDashboardSection" @clear="handleClear" multiple clearable
        filterable collapse-tags placeholder="Search Dashboard Section" style="width: 35%; margin-right: 10px;">
        <el-option
v-for="item in DashBoardSectionFilterdOptions" :key="item.value" :label="item.label"
          :value="item.value" />
      </el-select>

      <!-- Action Buttons -->
      <div style="display: flex; align-items: center; gap: 10px; margin-right: 10px;">

        <PermissionWrapper :permissions="'dashboard_section_chart:create'">
          <el-tooltip content="Add Chart" placement="top">
            <el-button :onClick="AddCard" type="primary" :icon="Plus" />
          </el-tooltip>
        </PermissionWrapper>

        <PermissionWrapper :permissions="'dashboard_section_chart:read'">
          <el-tooltip content="Download" placement="top">
            <el-button :onClick="handleDownload" type="primary" :icon="Download" />
          </el-tooltip>
        </PermissionWrapper>

        <el-tooltip content="Clear" placement="top">
          <el-button :onClick="handleClear" type="primary" :icon="Filter" />
        </el-tooltip>


      </div>
      <DownloadAll v-if="showEditButtons" :model="model" :associated_models="associated_multiple_models" />

      <!-- Download All Component -->
    </el-row>


    

    <el-table v-loading="loading" :data="charts_filtered" stripe class="charts-table" table-layout="auto">
      <el-table-column label="Type" min-width="160">
        <template #default="scope">
          <div class="charts-table-type">
            <el-icon :size="18" color="#475569">
              <component :is="resolveChartTypeIcon(scope.row.type)" />
            </el-icon>
            <span>{{ chartTypeLabel(scope.row.type) }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Dashboard" :sort-method="sortByDashboard" sortable min-width="160" show-overflow-tooltip>
        <template #default="scope">
          <span>{{ scope.row.dashboard_section?.dashboard?.title || '-' }}</span>
        </template>
      </el-table-column>

      <el-table-column label="Title" prop="title" sortable min-width="160" show-overflow-tooltip />
      <el-table-column label="Description" prop="description" sortable min-width="200" show-overflow-tooltip />


      <el-table-column label="Operations" min-width="200" align="right">
        <template #header>
          <el-input v-model="searchKey" size="small" placeholder="Filter by title" />
        </template>
        <template #default="scope">
          <PermissionWrapper :permissions="'dashboard_section_chart:update'">
            <el-tooltip content="Edit" placement="top">
              <el-button
size="small" type="success" :icon="Edit" @click="editIndicator(scope as TableSlotDefault)"
                plain />
            </el-tooltip>
          </PermissionWrapper>
          <el-tooltip content="Clone" placement="top">
            <el-button
size="small" type="warning" :icon="CopyDocument" @click="CloneChart(scope as TableSlotDefault)"
              plain />
          </el-tooltip>
          <PermissionWrapper :permissions="'dashboard_section_chart:delete'">
            <el-tooltip content="Delete" placement="top">
              <el-popconfirm
confirm-button-text="Yes" width="340" cancel-button-text="No" :icon="InfoFilled"
                icon-color="#626AEF" title="Are you sure to delete this chart?"
                @confirm="DeleteIndicator(scope as TableSlotDefault)">
                <template #reference>
                  <el-button size="small" v-if="showAdminButtons" type="danger" :icon=Delete plain />
                </template>
              </el-popconfirm>
            </el-tooltip>
          </PermissionWrapper>
        </template>
      </el-table-column>

    </el-table>


    <ElPagination
:layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'" v-model:currentPage="currentPage" v-model:page-size="pSize"
      :page-sizes="[3, 5, 10, 20, 50, 200, 10000]" :total="total" :background="true" @size-change="onpSizeChange"
      @current-change="onPageChange" class="mt-4"
      :small="isMobile"
      :pager-count="isMobile ? 3 : 7" />
  </el-card>


  <el-drawer
    v-model="AddDialogVisible"
    direction="rtl"
    :size="isMobile ? '100%' : '40%'"
    :with-header="false"
    :before-close="handleDrawerBeforeClose"
    v-loading="drawerLoading"
    :element-loading-text="drawerLoadingText"
  >
    <template #header>
      <div class="drawer-header">
        <span class="drawer-title">{{ formHeader }}</span>
        <el-button class="drawer-close" icon="el-icon-close" type="text" @click="AddDialogVisible = false" />
      </div>
    </template>
    <div class="steps-wrapper">
      <el-steps :active="activeStep" align-center finish-status="success">
        <el-step title="Details" description="Basic chart info" />
        <el-step title="Chart Settings" description="Configure visualization" />
        <el-step title="Filters" description="Add data filters" />
      </el-steps>
    </div>

    <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="100px" label-position="top">
      <el-row v-if="activeStep == 0" :gutter="20">
        <el-col :span="24">
          <el-form-item id="btn1" label="Dashboard" prop="dashboard_id">
            <el-select
v-model="ruleForm.dashboard_id" filterable placeholder="Select"
              @change="handleFilterDashboards">
              <el-option v-for="item in dashboardOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>

          <el-form-item id="btn2" label="Dashboard Section" prop="dashboard_section_id">
            <el-select v-model="ruleForm.dashboard_section_id" filterable placeholder="Select">
              <el-option
v-for="item in DashBoardSectionFilterdOptions" :key="item.value" :label="item.label"
                :value="item.value" />
            </el-select>
          </el-form-item>

          <el-form-item id="btn3" label="Title" prop="title">
            <el-input v-model="ruleForm.title" />
          </el-form-item>

          <el-form-item id="btn4" label="Description" prop="description">
            <el-input v-model="ruleForm.description" />
          </el-form-item>

        </el-col>
      </el-row>


      <el-row v-if="activeStep === 1" :gutter="20">
        <el-col :span="12">
          <el-form-item id="btn5" label="Category" prop="category">
            <el-select v-model="ruleForm.category" filterable placeholder="Select" :onChange="handleSelectType">
              <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item id="btn6" label="Entity" v-if="ruleForm.category === 'Status'" prop="card_model">
            <el-select
v-model="ruleForm.card_model" @clear="handleClear" clearable filterable collapse-tags
              @change="handleSelectModel" placeholder="Select Entity to summarize" style="width: 100%;">
              <el-option v-for="item in ModelOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>

          <el-form-item id="btn7" v-if="showSingleFieldConfig" label="Field" prop="card_model_field">
            <el-select
v-model="ruleForm.card_model_field" @clear="handleClear" clearable filterable collapse-tags
              placeholder="Field to summarize">
              <el-option v-for="item in fieldSet" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>

          <el-form-item v-if="showMetricFieldConfig" label="Metrics" prop="metric_fields">
            <el-select
              v-model="ruleForm.metric_fields"
              multiple
              filterable
              collapse-tags
              placeholder="Select two or more metrics"
              style="width: 100%;"
            >
              <el-option
                v-for="item in numericMetricFieldOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>


          <el-form-item id="btn8" label="Indicators" v-if="ruleForm.category === 'Intervention'" prop="indicator_id">
            <el-select
v-model="ruleForm.indicator_id" filterable multiple placeholder="Select" collapse-tags
              style="width: 100%;">
              <el-option
v-for="item in IndicatorCategoryOptions" :key="item.value" :label="item.label"
                :value="item.value" />
            </el-select>
          </el-form-item>

          <el-form-item id="btn9" v-if="ruleForm.category === 'Status' && ruleForm.card_model && !hideCategorize" prop="categorized">
            <el-checkbox v-model="ruleForm.categorized">Categorized by selected field</el-checkbox>
          </el-form-item>

          <el-form-item id="btn10" prop="ignore_empty">
            <el-checkbox v-model="ruleForm.ignore_empty" label="Ignore records with missing data" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item id="btn11" v-if="ruleForm.category" label="Chart Type" prop="type">
            <el-select
style="width: 100%;" v-model="ruleForm.type" @clear="handleClear" clearable filterable
              collapse-tags @change="handleSelectChart" placeholder="Select Type of Chart">
              <el-option v-for="item in chartOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>

          <el-form-item
            v-if="ruleForm.category === 'Status' && showTimeFieldConfig && ruleForm.card_model"
            label="Time period"
            prop="time_field"
          >
            <el-select
              v-model="ruleForm.time_field"
              filterable
              clearable
              placeholder="Time axis for line charts"
              style="width: 100%;"
            >
              <el-option
                v-for="item in timeFieldOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item id="btn12" v-if="ruleForm.category" label="Aggregation" prop="aggregation">
            <el-select
size="default" v-model="ruleForm.aggregation" @clear="handleClear" clearable filterable
              collapse-tags placeholder="Select">
              <el-option
v-for="item in aggregationOptionsFiltered" :key="item.value" :label="item.label"
                :value="item.value" />
            </el-select>
          </el-form-item>


        </el-col>
      </el-row>

      <el-row v-if="activeStep === 2" :gutter="20">



        <el-col :span="24">

          <el-form-item id="btn13" label="Filter" prop="filtered" v-if="ruleForm.card_model">
            <el-switch
v-model="ruleForm.filtered" style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
              active-text="Yes" inactive-text="No" />
          </el-form-item>

          <div>
            <el-table
v-if="ruleForm.filtered" :data="tableData" style="width: 90%; margin-left: 10px;" max-height="250"
              size="small">
              <el-table-column prop="field" label="Field">
                <template #default="scope">
                  <el-select v-model="scope.row.field" placeholder="Select Field" :onChange="getFieldValues" filterable>
                    <el-option v-for="item in fieldSet" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </template>
              </el-table-column>

              <el-table-column prop="operation" label="Operation">
                <template #default="scope">
                  <el-select v-model="scope.row.operation" placeholder="Select Operation">
                    <el-option
v-for="item in functionOptions" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                </template>
              </el-table-column>

              <el-table-column prop="value" label="Value">
                <template #default="scope">
                  <el-select
                    :model-value="Array.isArray(scope.row.value) ? scope.row.value : (scope.row.value != null ? [scope.row.value] : [])"
                    @update:model-value="(val) => { scope.row.value = val; saveFilter(); }"
                    placeholder="Select or type to add value(s)"
                    filterable
                    allow-create
                    multiple
                    collapse-tags-tooltip
                    collapse-tags>
                    <el-option v-for="item in fieldOptions" :key="String(item.value)" :label="String(item.label)" :value="item.value" />
                  </el-select>
                </template>
              </el-table-column>

              <el-table-column>
                <template #default="scope">
                  <el-tooltip content="Remove filter" placement="top">
                    <el-button size="small" @click.prevent="deleteRow(scope.$index)" type="danger" :icon="Delete" />
                  </el-tooltip>

                </template>
              </el-table-column>
            </el-table>

          </div>
          <el-row>
            <el-button-group>
              <el-button v-if="ruleForm.filtered" class="mt-4" style="width: 45%" @click="onAddItem" size="small">
                Add Filter
              </el-button>
              <el-button v-if="ruleForm.filtered" class="mt-4" style="width: 45%" @click="saveFilter" size="small">
                Save Filters
              </el-button>
            </el-button-group>
          </el-row>
        </el-col>



      </el-row>



    </el-form>
    <template #footer>
      <div style="padding:12px 20px; border-top:1px solid #ebeef5; text-align:right;">
        <el-button @click="AddDialogVisible = false" :disabled="drawerLoading">Cancel</el-button>
        <el-button @click="prevStep" :disabled="activeStep===0 || drawerLoading" style="margin:0 8px;">Previous</el-button>
        <el-button @click="nextStep" v-if="activeStep<2" type="primary" :disabled="drawerLoading" style="margin-right:8px;">Next</el-button>
        <PermissionWrapper :permissions="'dashboard_section_chart:create'">
          <el-button v-if="showSubmitBtn&&activeStep===2" type="primary" :loading="drawerLoading" @click="submitForm(ruleFormRef)">Submit</el-button>
          <el-button v-if="showSubmitBtn&&activeStep===2" :loading="drawerLoading" @click="submitForm(ruleFormRef, true)">Submit & Add Another</el-button>
        </PermissionWrapper>
        <PermissionWrapper :permissions="'dashboard_section_chart:update'">
          <el-button v-if="showEditSaveButton&&activeStep===2" type="primary" :loading="drawerLoading" @click="editForm(ruleFormRef)">Save</el-button>
          <el-button v-if="showEditSaveButton&&activeStep===2" :loading="drawerLoading" @click="editForm(ruleFormRef, true)">Save & Add Another</el-button>
        </PermissionWrapper>
      </div>
    </template>


  </el-drawer>



  <el-dialog v-model="infoDialog" width="40%">
    <div class="info-dialog-content">
      <div class="info-dialog-section">
        <h4 class="info-heading">Status Chart:</h4>
        <p>
          A chart that draws data from an entity within the system such as settlements, facilities, etc.
        </p>
      </div>
      <div class="info-dialog-section">
        <h4 class="info-heading"> Interventions Chart:</h4>
        <p>
          A chart that draws data exclusively from slum interventions such as construction of infrastructure,
          issuance of titles, and more.
        </p>
      </div>





    </div>
  </el-dialog>



  <el-tour v-model="isTourVisible" :z-index="100000" :on-close="endTour">
    <el-tour-step
v-for="(step, index) in filteredTourSteps" :key="index" :target="step.target" :title="step.title"
      :description="step.content" />
  </el-tour>

</template>
<style>
.gray-tooltip .el-tooltip__popper {
  background-color: gray;
}
</style>


<style scoped>
.info-dialog-content {
  padding: 5px;
}

.info-dialog-section {
  margin-bottom: 5px;
}

.info-dialog-section h4 {
  font-size: 1.2em;
  margin-bottom: 10px;
}

.info-dialog-section p {
  line-height: 1.5;
}

.info-heading {
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 10px;
}

.gradient-steps .el-step__head {
  background: linear-gradient(135deg, var(--el-color-primary-dark-2), var(--el-color-primary)) !important;
  color: white !important;
}
.gradient-steps .el-step__title {
  font-weight: bold;
  color: #003366;
}
.gradient-steps .el-step__description {
  color: #004c99;
}
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: linear-gradient(135deg, var(--el-color-primary-dark-2), var(--el-color-primary)) !important;
  color: rgb(189, 57, 57);
  position: sticky;
  top: 0;
  z-index: 10;
}
.drawer-title {
  font-size: 20px;
  font-weight: 600;
  color: white;
}
.drawer-close {
  color: white;
  border-radius: 4px;
}
.drawer-close:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>


<style>
.table-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.charts-table {
  width: 100%;
}

.charts-table-type {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>

<style>
.steps-wrapper {
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-8));
  padding: 16px;
  border-radius: 4px;
  margin: 20px 0;
}
</style>