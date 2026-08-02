<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
// @ts-nocheck
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty,searchByKeyWord } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { ElButton, ElSelect, ElColorPicker, ElCard, ElPopconfirm, ElRadioGroup, ElRadioButton } from 'element-plus'
import {
  Back,
  Plus,
  Download,
  Filter,
  Edit,
  InfoFilled,
  CopyDocument,
  Delete
} from '@element-plus/icons-vue'
import PermissionWrapper from '@/components/PermissionWrapper.vue'
import { filterDashboardsForUser } from '@/utils/documentPermissions'

import { ref, reactive,watch, onMounted, computed } from 'vue'
import {
  ElPagination, ElCol, ElTooltip, ElOption, ElDrawer, ElForm, ElFormItem, ElInput, FormRules, ElRow,
  ElTable, ElSwitch, ElTableColumn, ElSelectV2, ElMessageBox, ElMessage
} from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord } from '@/api/settlements'
import { getUniqueFieldValues } from '@/api/households'
import { getProgrammesList, getComponentsList } from '@/api/project-locations-optimized'
import { sortProgrammeRecordsByFamily, sortProgrammeSelectOptions } from '@/utils/programmeComponentTree'
import type { ProgrammeRecord } from '@/utils/programmeValidation'
import { uuid } from 'vue-uuid'
import type { FormInstance } from 'element-plus'
import ElementPlusIconPickerField from '@/components/ElementPlusIconPickerField.vue'
import { Icon } from '@/components/Icon'

import { loadDashboardFilterFields } from '@/utils/dashboardFilterFields'
import {
  DEFAULT_DASHBOARD_DATA_CATEGORY,
  isInterventionCategory,
  isStatusCategory,
  normalizeDataCategory,
} from '@/utils/dashboardCategory'

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)
const isMobile = computed(() => appStore.getMobile)


console.log("userInfo--->", userInfo)

const showAdminButtons = ref(appStore.getAdminButtons)

const isInterventionCard = computed(() => isInterventionCategory(ruleForm.category))
const showCardFilters = computed(() => {
  if (!ruleForm.card_model) return false
  if (isStatusCategory(ruleForm.category)) return true
  return isInterventionCard.value && ruleForm.card_model === 'indicator_category_report'
})

/** Tracks last saved data source so we only reset fields when the type actually changes. */
const lastCardCategory = ref('')

const cardCategorySelection = computed({
  get() {
    const normalized = normalizeDataCategory(ruleForm.category)
    if (normalized === 'Status' || normalized === 'Intervention') return normalized
    return DEFAULT_DASHBOARD_DATA_CATEGORY
  },
  set(val: string) {
    void onCardDataSourceChange(val)
  },
})

const syncLastCardCategory = () => {
  lastCardCategory.value = normalizeDataCategory(ruleForm.category) || ruleForm.category || ''
}

const finalizeCardForSave = () => {
  ruleForm.category = normalizeDataCategory(ruleForm.category) || ruleForm.category
  if (isInterventionCategory(ruleForm.category)) {
    ruleForm.card_model = 'indicator_category_report'
    ruleForm.card_model_field = ruleForm.card_model_field || 'amount'
  } else if (isStatusCategory(ruleForm.category)) {
    ruleForm.indicator_category_id = null
  }
}

const dataSourceHint = computed(() => {
  if (isInterventionCategory(ruleForm.category)) {
    return 'Shows the latest reported amount for a selected indicator category — e.g. households reached or kilometres of road constructed.'
  }
  if (isStatusCategory(ruleForm.category)) {
    return 'Counts or sums records from a database table — e.g. projects, settlements, households, or beneficiaries. Supports programme and component filters.'
  }
  return 'Choose whether this card shows an M&E indicator value or a count/sum from an entity table.'
})

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
    value: 'project_location',
    label: 'Projects'
  },

  {
    value: 'project_beneficiary',
    label: 'Beneficiaries'
  },

  {
    value: 'education_facility',
    label: 'Education Facility'
  },
  {
    value: 'health_facility',
    label: 'Health Facility'
  },
  {
    value: 'road',
    label: 'Road'
  },

  {
    value: 'water_point',
    label: 'Water Point'
  },

  {
    value: 'piped_water',
    label: 'Piped Water'
  },


  {
    value: 'sewer',
    label: 'Sewer'
  },


  {
    value: 'other_facility',
    label: 'Other Facilities'
  },

]




const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])

const componentOptions = ref([])
const categories = ref([])

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

// Set up event listener on mount and load table data
onMounted(async () => {
  window.addEventListener('resize', updatepSize);
  updatepSize();
  await getDashboardOptions();
  await getInterventionsAll();
});





const fieldSet = ref([])
const indicatorCategoryOptions = ref([])

// component_id / programme_id aren't real columns on project_location — they're
// resolved server-side via a project→component subquery (summary.controller.js).
// Loaded once and reused for both the Field-injection and the grouped Value picker.
const allProgrammes = ref([])
const allComponentsWithProgramme = ref([])
const programmeHierarchyLoaded = ref(false)

const loadProgrammeComponentHierarchy = async () => {
  if (programmeHierarchyLoaded.value) return
  const progRes = await getProgrammesList({ params: {} })
  allProgrammes.value = progRes.data || []
  const allIds = allProgrammes.value.map((p: any) => p.id)
  if (allIds.length) {
    const compRes = await getComponentsList({ params: { programme_ids: allIds.join(',') } })
    allComponentsWithProgramme.value = compRes.data || []
  }
  programmeHierarchyLoaded.value = true
}

// Programme picker (root + child programmes) — used when filtering directly by
// programme_id. Selecting a root (e.g. SUD) covers all its descendants.
const programmeOptionGroupsForFilter = computed(() => {
  const roots = sortProgrammeRecordsByFamily(
    allProgrammes.value as ProgrammeRecord[],
    allProgrammes.value.filter((p: any) => p.parentId == null || p.parentId === '') as ProgrammeRecord[],
  )
  return roots.map((root: any) => ({
    id: root.id,
    label: root.title || root.acronym,
    rootLabel: `${root.title || root.acronym} (all)`,
    children: sortProgrammeSelectOptions(
      allProgrammes.value
        .filter((p: any) => String(p.parentId) === String(root.id))
        .map((p: any) => ({ value: p.id, label: p.title || p.acronym })),
      allProgrammes.value as ProgrammeRecord[],
    ),
  }))
})

// Component picker grouped by programme (e.g. "SUD / Markets") instead of one
// long undifferentiated list of component titles.
const componentOptionGroupsForFilter = computed(() => {
  const programmeById = new Map(allProgrammes.value.map((p: any) => [p.id, p]))
  const groups = new Map<number, { label: string; children: any[] }>()

  for (const c of allComponentsWithProgramme.value) {
    const programme = programmeById.get(c.programme_id)
    if (!programme) continue
    const root = programme.parentId != null && programme.parentId !== ''
      ? programmeById.get(Number(programme.parentId))
      : null
    const label = root
      ? `${root.title || root.acronym} / ${programme.title || programme.acronym}`
      : (programme.title || programme.acronym)

    if (!groups.has(c.programme_id)) groups.set(c.programme_id, { label, children: [] })
    groups.get(c.programme_id)!.children.push({ value: c.id, label: c.title || c.acronym })
  }

  return sortProgrammeSelectOptions(
    Array.from(groups.entries()).map(([programmeId, group]) => ({
      value: programmeId,
      label: group.label,
      children: group.children,
    })),
    allProgrammes.value as ProgrammeRecord[],
  ).map(({ label, children }) => ({ label, children }))
})

// Get indicator categories for Indicator cards
const getIndicatorCategories = async () => {
  const res = await getCountyListApi({
    params: {
      curUser: 1,
      model: 'indicator_category',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received indicator categories:', response)
    var ret = response.data

    indicatorCategoryOptions.value = []
    ret.forEach(function (arrayItem: { id: string; indicator_name: string; category: any }) {
      var opt = {}
      opt.value = arrayItem.id
      opt.label = `${arrayItem.indicator_name} | ${arrayItem.category_title}`
      opt.indicator_name = arrayItem.indicator_name
      opt.category_title = arrayItem.category_title
      opt.unit = arrayItem.indicator?.unit || ''
      indicatorCategoryOptions.value.push(opt)
    })
  })
}

const getModeldefinition = async (selModel) => {
  console.log(selModel)
  fieldSet.value = await loadDashboardFilterFields(selModel)
  console.log('getting fields fields', fieldSet.value)
}


const functionOptions = ref([])







let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var filterValues = []
var tblData = []
const associated_Model = ''
const associated_multiple_models = ['dashboard']
const model = 'dashboard_card'
//// ------------------parameters -----------------------////

const { t } = useI18n()
const AddDialogVisible = ref(false)
const formHeader = ref('Add Card')
const showSubmitBtn = ref(true)
const showEditSaveButton = ref(false)



const columns: TableColumn[] = [



  {
    field: 'title',
    label: t('Title')
  },


  {
    field: 'icon',
    label: t('Icon')
  },

  {
    field: 'iconColor',
    label: t('Color')
  },

  {
    field: 'action',
    label: t('Actions')
  }

]
const handleClear = async () => {
  console.log('cleared....')

  // clear all the fileters -------
  filterValues = []
  filters = []
  value1.value = ''
  value2.value = ''
  value3.value = ''
  pSize.value = 5
  currentPage.value = 1
  tblData = []
  //----run the get data--------
  getInterventionsAll()
}


const handleSelectDashboard = async (indicator: any) => {
  var selectOption = 'dashboard_id'
  if (!filters.includes(selectOption)) {
    filters.push(selectOption)
  }
  var index = filters.indexOf(selectOption) // 1
  console.log('category : index--->', index)

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

  getFilteredData(filters, filterValues)
}

const onPageChange = async (selPage: any) => {
  console.log('on change change: selected counties ', selCounties)
  page.value = selPage
  getFilteredData(filters, filterValues)
}

const onPageSizeChange = async (size: any) => {
  pSize.value = size
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


const getFilteredData = async (selFilters, selfilterValues, { silent = false } = {}) => {
  if (!silent) loading.value = true
  try {
    const formData = {}
    formData.limit = pSize.value
    formData.page = page.value
    formData.curUser = 1 // Id for logged in user
    formData.model = model
    //-Search field--------------------------------------------
    formData.searchField = 'title'
    formData.searchKeyword = ''
    //--Single Filter -----------------------------------------

    formData.assocModel = associated_Model

    // - multiple filters -------------------------------------
    formData.filters = selFilters
    formData.filterValues = selfilterValues
    formData.associated_multiple_models = associated_multiple_models

    //-------------------------
    const res = await getSettlementListByCounty(formData)

    console.log('After Querry', res)
    tableDataList.value = res.data
    total.value = res.total

    tblData = [] // reset the table data
    console.log('TBL-b4', tblData)
    res.data.forEach(function (arrayItem) {
      var dd = flattenJSON(arrayItem)
      tblData.push(dd)
    })

    console.log('TBL-4f', tblData)
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

const DashboardOptions = ref([])
const getDashboardOptions = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: userInfo?.id || 1, // Use current user ID
      model: 'dashboard',
      searchField: 'title',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    var ret = response.data

    // Filter dashboards to show only user's dashboards and public ones
    const filteredDashboards = filterDashboardsForUser(userInfo, ret)

    DashboardOptions.value = []
    filteredDashboards.forEach(function (arrayItem: { id: string; type: string; title: string; createdBy: number; public: boolean }) {
      var opt = {}
      opt.value = arrayItem.id
      opt.label = arrayItem.title  
      opt.type = arrayItem.type
      opt.createdBy = arrayItem.createdBy
      opt.public = arrayItem.public
      //  console.log(countyOpt)
      DashboardOptions.value.push(opt)
    })
    
    console.log('Filtered dashboards for user:', userInfo?.id, 'Total available:', DashboardOptions.value.length)
    console.log('User ID:', userInfo?.id, 'User roles:', userInfo?.roles)
  })
}


const strategicFocusOptions = ref([])
const getStrategicFocusAreas = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'domain',
      searchField: 'title',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    var ret = response.data

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var countyOpt = {}
      countyOpt.value = arrayItem.id
      countyOpt.label = arrayItem.title  
      //  console.log(countyOpt)
      strategicFocusOptions.value.push(countyOpt)
    })
  })
}

const editIndicator = async (data: TableSlotDefault) => {
  drawerLoadingText.value = 'Loading...'
  drawerLoading.value = true
  AddDialogVisible.value = true
  showSubmitBtn.value = false
  console.log('Edit--->', data)
  
  try {
  ruleForm.category = normalizeDataCategory(data.row.category) || data.row.category || ''
  syncLastCardCategory()
  showEditSaveButton.value = true

  ruleForm.id = data.row.id
  ruleForm.title = data.row.title
  ruleForm.dashboard_id = data.row.dashboard_id
  ruleForm.description = data.row.description
  ruleForm.iconColor = data.row.iconColor
  ruleForm.icon = data.row.icon
  ruleForm.aggregation = data.row.aggregation
  ruleForm.indicator_category_id = data.row.indicator_category_id
  ruleForm.card_model = data.row.card_model
  ruleForm.card_model_field = data.row.card_model_field
  ruleForm.filter_value = data.row.filter_value
  ruleForm.computation = data.row.computation
  ruleForm.filter_function = data.row.filter_function
  ruleForm.filter_field = data.row.filter_field
  ruleForm.filtered = data.row.filtered
  ruleForm.unique = data.row.unique
  ruleForm.filters = data.row.filters
  tableData.value = data.row.filters ?? []

  if (isInterventionCategory(ruleForm.category)) {
    if (ruleForm.aggregation === 'count') ruleForm.aggregation = 'sum'
    ruleForm.card_model = 'indicator_category_report'
    ruleForm.card_model_field = ruleForm.card_model_field || 'amount'
  }

  await loadCardDataSourceOptions(ruleForm.category, { resetSelections: false })

  if (isStatusCategory(ruleForm.category) && data.row.filter_field) {
    await handleFilterAggregators(data.row.filter_field)
  }

  console.log('Edit Mode', data.row)

  fieldSelected.value = !!(data.row.filter_value || data.row.filters?.length)
  showFilterValues.value = !!data.row.filter_value
  showStatusExtras.value = true
  formHeader.value = 'Edit Card'
  initialFormJson.value = JSON.stringify(ruleForm)
  } finally {
    drawerLoading.value = false
  }
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
  getFilteredData(filters, filterValues)
}

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  title: '',
  dashboard_id: '',
  description: '',
  iconColor: '',
  icon: '',
  aggregation: '',
  indicator_category_id: null,
  card_model_field: '',
  filter_value: null,
  filter_function: null,
  filter_field: null,
  filtered: null,
  card_model: '',
  computation: null,
  unique: false,
  filters: null,
  category: DEFAULT_DASHBOARD_DATA_CATEGORY,
  indicator_category_id: null



})
const getPreservedCardContext = () => ({
  dashboard_id: ruleForm.dashboard_id,
  category: ruleForm.category,
  card_model: ruleForm.card_model,
  card_model_field: ruleForm.card_model_field,
  indicator_category_id: ruleForm.indicator_category_id,
  icon: ruleForm.icon,
  iconColor: ruleForm.iconColor,
  aggregation: ruleForm.aggregation,
  computation: ruleForm.computation,
  unique: ruleForm.unique,
  filtered: ruleForm.filtered,
  filter_field: ruleForm.filter_field,
  filter_function: ruleForm.filter_function,
  filter_value: ruleForm.filter_value,
  filters: ruleForm.filters ? JSON.parse(JSON.stringify(ruleForm.filters)) : null,
})

const resetCardForm = ({ closeDrawer = true, preserveContext = null } = {}) => {
  showSubmitBtn.value = true
  showEditSaveButton.value = false
  formHeader.value = 'Add Card'
  activeStep.value = 0

  ruleForm.id = ''
  ruleForm.title = ''
  ruleForm.dashboard_id = ''
  ruleForm.description = ''
  ruleForm.iconColor = ''
  ruleForm.icon = ''
  ruleForm.aggregation = ''
  ruleForm.card_model_field = ''
  ruleForm.filter_value = null
  ruleForm.computation = null
  ruleForm.filter_function = null
  ruleForm.filter_field = null
  ruleForm.filtered = null
  ruleForm.card_model = ''
  ruleForm.unique = false
  ruleForm.filters = null
  ruleForm.category = DEFAULT_DASHBOARD_DATA_CATEGORY
  ruleForm.indicator_category_id = null
  lastCardCategory.value = ''

  if (preserveContext) {
    Object.assign(ruleForm, preserveContext)
    tableData.value = Array.isArray(preserveContext.filters)
      ? JSON.parse(JSON.stringify(preserveContext.filters))
      : []
  } else {
    tableData.value = []
    fieldSet.value = []
    fieldOptions.value = []
    fieldSelected.value = false
    aggregationOptionsFiltered.value = [...aggregationOptions]
  }

  lastCardCategory.value = normalizeDataCategory(ruleForm.category) || ruleForm.category || ''

  if (closeDrawer) {
    AddDialogVisible.value = false
  } else {
    initialFormJson.value = JSON.stringify(ruleForm)
    ruleFormRef.value?.clearValidate()
  }
  drawerLoading.value = false
}

const handleClose = () => {
  resetCardForm({ closeDrawer: true })
}

const cancelDrawer = () => {
  handleDrawerBeforeClose(() => {
    AddDialogVisible.value = false
  })
}


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

const cardAggregationOptions = computed(() => {
  const opts = aggregationOptionsFiltered.value
  if (isInterventionCard.value) {
    return opts.filter((o) => o.value !== 'count')
  }
  return opts
})


const rules = reactive<FormRules>({
  title: [
    { required: true, message: 'Please provide A title', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }
  ],
  dashboard_id: [
    { required: true, message: 'Please select a Dashboard', trigger: 'blur' },
  ],

  icon: [
    { required: true, message: 'Icon is required.', trigger: 'blur' },
  ],

  iconColor: [
    { required: true, message: 'iconColor is required.', trigger: 'blur' },
  ],

  aggregation: [
    { required: true, message: 'Aggregator method is required.', trigger: 'blur' },
  ],

  description: [
    { required: true, message: 'description is required.', trigger: 'blur' },
  ],

  category: [
    { required: true, message: 'Select a data source.', trigger: 'change' },
  ],
  
  computation: [
    { required: true, message: 'computation is required.', trigger: 'blur' },
  ],

  // Conditional validation based on category
  card_model_field: [
    { 
      required: true, 
      message: 'Aggregation field is required for Status cards.', 
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (isStatusCategory(ruleForm.category) && !value) {
          callback(new Error('Aggregation field is required for Status cards.'))
        } else {
          callback()
        }
      }
    }
  ],

  indicator_category_id: [
    { 
      required: true, 
      message: 'Indicator category is required for Indicator cards.', 
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (isInterventionCategory(ruleForm.category) && !value) {
          callback(new Error('Indicator category is required for intervention cards.'))
        } else {
          callback()
        }
      }
    }
  ],

  card_model: [
    { 
      required: true, 
      message: 'Entity is required for Status cards.', 
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (isStatusCategory(ruleForm.category) && !value) {
          callback(new Error('Entity is required for Status cards.'))
        } else {
          callback()
        }
      }
    }
  ]

})

const AddCard = () => {
  resetCardForm({ closeDrawer: false })
  AddDialogVisible.value = true
}


const submitForm = async (formEl: FormInstance | undefined, addAnother = false) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ruleForm.model = model
      ruleForm.code = uuid.v4()
      
      finalizeCardForSave()

      drawerLoadingText.value = 'Saving...'
      drawerLoading.value = true
      try {
        await CreateRecord(ruleForm)
        ElMessage.success('Card created')
        await getFilteredData(filters, filterValues, { silent: true })
        resetCardForm({
          closeDrawer: !addAnother,
          preserveContext: addAnother ? getPreservedCardContext() : null,
        })
      } catch (error) {
        console.error(error)
        ElMessage.error('Failed to create card')
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
      
      finalizeCardForSave()

      drawerLoadingText.value = 'Saving...'
      drawerLoading.value = true
      try {
        await updateOneRecord(ruleForm)
        ElMessage.success('Card saved')
        await getFilteredData(filters, filterValues, { silent: true })
        resetCardForm({
          closeDrawer: !addAnother,
          preserveContext: addAnother ? getPreservedCardContext() : null,
        })
      } catch (error) {
        console.error(error)
        ElMessage.error('Failed to save card')
        drawerLoading.value = false
      }

    } else {
      console.log('error submit!', fields)
    }
  })
}




//getIndicatorOptions()
//getIndicatorCategories() // Only load when Indicator category is selected
//getStrategicFocusAreas()
//getIndicatorNames()

const handleSelectType = async () => {
  showStatusExtras.value = true
}

const resetCardDataFields = () => {
  ruleForm.card_model = ''
  ruleForm.card_model_field = ''
  ruleForm.aggregation = ''
  ruleForm.indicator_category_id = null
  ruleForm.filter_value = null
  ruleForm.filter_function = null
  ruleForm.filter_field = null
  ruleForm.filtered = false
  ruleForm.computation = null
  ruleForm.filters = null
  ruleForm.unique = false
  fieldSet.value = []
  fieldOptions.value = []
  tableData.value = []
  fieldSelected.value = false
  showFilterValues.value = false
}

/** Load dropdown/filter options for the active data source (entity vs indicator). */
const loadCardDataSourceOptions = async (
  category: string,
  { resetSelections = true }: { resetSelections?: boolean } = {},
) => {
  const normalized = normalizeDataCategory(category) || category

  if (isInterventionCategory(normalized)) {
    aggregationOptionsFiltered.value = aggregationOptions.filter((o) => o.value !== 'count')
    await getIndicatorCategories()
    ruleForm.card_model = 'indicator_category_report'
    ruleForm.card_model_field = 'amount'
    if (resetSelections) {
      ruleForm.aggregation = 'sum'
      ruleForm.indicator_category_id = null
    } else if (!ruleForm.aggregation || ruleForm.aggregation === 'count') {
      ruleForm.aggregation = 'sum'
    }
    fieldSet.value = await loadDashboardFilterFields('indicator_category_report')
  } else if (isStatusCategory(normalized)) {
    aggregationOptionsFiltered.value = [...aggregationOptions]
    if (resetSelections) {
      fieldSet.value = []
    } else if (ruleForm.card_model) {
      fieldSet.value = await loadDashboardFilterFields(ruleForm.card_model)
    }
  }
}

// Switch data source (M&E indicator vs entity table) — only resets when type changes
const onCardDataSourceChange = async (category) => {
  const normalized = normalizeDataCategory(category) || category
  if (!normalized) return

  const previous = lastCardCategory.value
  ruleForm.category = normalized
  if (normalized === previous) return

  lastCardCategory.value = normalized
  resetCardDataFields()

  drawerLoading.value = true
  try {
    await loadCardDataSourceOptions(normalized, { resetSelections: true })
  } finally {
    drawerLoading.value = false
  }
}

const handleSelectModel = async (selModel) => {
  fieldOptions.value = []


  ruleForm.aggregation = ''
  ruleForm.card_model_field = ''
  ruleForm.filter_value = null
  ruleForm.filter_function = ''
  ruleForm.filter_field = ''
  ruleForm.filtered = false
  ruleForm.computation = null
  ruleForm.filters = null
  fieldSet.value = []
  // Don't reset category - this was causing the Status selection to be cleared
  // ruleForm.category = ''


  console.log('specs.....')
  await getModeldefinition(selModel)
}


const fieldSelected = ref(false)
const fieldOptions = ref([])
const disabledoptions = ref(false)

const handleFilterAggregators = async (selField) => {

  fieldSelected.value = true   // show filter field 
  fieldOptions.value = []
  console.log('filtreing teh aggregators.....', selField)

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


  console.log('Filter Fields 1.....', selField)
  const formData = {}
  formData.model = ruleForm.card_model
  //-Search field--------------------------------------------
  formData.selectedField = selField
  //--Single Filter -----------------------------------------
  const res = await getUniqueFieldValues(formData)

  res.data.forEach(function (arrayItem: any) {
    const opt = arrayItem !== null && typeof arrayItem === 'object' && 'value' in arrayItem
      ? { value: arrayItem.value, label: arrayItem.label ?? String(arrayItem.value) }
      : { value: arrayItem, label: String(arrayItem) }

    fieldOptions.value.push(opt)
  })

}






const showFilterValues = [];

const handleFilterFunction = async (val, index) => {
  console.log('val, index', val, index);

  if (val === 'all') {
    const newValue = false; // Replace this with the desired value
    showFilterValues.push(newValue);
    // ruleForm.filter_value=[]
  } else {
    const newValue = true; // Replace this with the desired value
    showFilterValues.push(newValue);
  }

  console.log('showFilterValues', showFilterValues);
};



const CloneCard = async (data: TableSlotDefault) => {
  showSubmitBtn.value = true
  showEditSaveButton.value = false

  ruleForm.category = normalizeDataCategory(data.row.category) || data.row.category || ''
  syncLastCardCategory()

  ruleForm.title = data.row.title
  ruleForm.dashboard_id = data.row.dashboard_id
  ruleForm.description = data.row.description
  ruleForm.iconColor = data.row.iconColor
  ruleForm.icon = data.row.icon
  ruleForm.aggregation = data.row.aggregation
  ruleForm.indicator_category_id = data.row.indicator_category_id
  ruleForm.card_model = data.row.card_model
  ruleForm.card_model_field = data.row.card_model_field

  if (isInterventionCategory(ruleForm.category)) {
    if (ruleForm.aggregation === 'count') ruleForm.aggregation = 'sum'
    ruleForm.card_model = 'indicator_category_report'
    ruleForm.card_model_field = ruleForm.card_model_field || 'amount'
  }

  drawerLoading.value = true
  try {
    await loadCardDataSourceOptions(ruleForm.category, { resetSelections: false })
    if (isStatusCategory(ruleForm.category) && data.row.filter_field) {
      await handleFilterAggregators(data.row.filter_field)
    }
  } finally {
    drawerLoading.value = false
  }
  ruleForm.filter_value = data.row.filter_value
  ruleForm.computation = data.row.computation
  ruleForm.filter_function = data.row.filter_function
  ruleForm.filter_field = data.row.filter_field
  ruleForm.filtered = data.row.filtered
  ruleForm.unique = data.row.unique

  if (data.row.filter_value) {
    fieldSelected.value = true
    showFilterValues.value = true
  } else {
    fieldSelected.value = false
  }

  showStatusExtras.value = true

  formHeader.value = 'Clone Card'

  AddDialogVisible.value = true
}

const tableData = ref([])
const deleteRow = (index: number) => {
  tableData.value.splice(index, 1)
}

const onAddItem = () => {

  console.log('tableData.value', tableData.value)

  console.log('adding....')

  tableData.value.push({
    field: null,
    operation: null,
    value: null
  })




}

const onAddFilter = () => {

  const nonNullItems = tableData.value.filter(item => item.field !== null && item.operation !== null);

  // Convert the Vue.js proxies to plain JavaScript objects
  const plainObjects = nonNullItems.map(item => JSON.parse(JSON.stringify(item)));

  ruleForm.filters = plainObjects;


  console.log('ruleForm', ruleForm)



}




const handleChangeFilterField = async (selField) => {

  fieldSelected.value = true   // show filter field 
  fieldOptions.value = []
  console.log('filtreing teh aggregators.....', selField)

  let selectedField = fieldSet.value.filter(option => option.value == selField);
  console.log('selectedField', selectedField)
  let selFieldType = selectedField[0].type

  if (selFieldType === 'FK_COMPONENT' || selFieldType === 'FK_PROGRAMME') {
    // Rendered via the grouped Programme/Component picker in the template, not
    // fieldOptions — just load the hierarchy and set an IN-style operator.
    aggregationOptionsFiltered.value = aggregationOptions.filter(option => option.value === 'count');
    functionOptions.value = [
      { value: 'all', label: 'All' },
      { value: 'eq', label: 'Equal' },
    ]
    await loadProgrammeComponentHierarchy()
    return
  }

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
  }

  else if (selFieldType === "ARRAY") {
    functionOptions.value = [

      {
        value: 'contains',
        label: 'Contains'
      },


    ]
  }
  else {
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


  console.log('Filter Fields 1.....', selField)
  const formData = {}
  formData.model = ruleForm.card_model
  //-Search field--------------------------------------------
  formData.selectedField = selField
  //--Single Filter -----------------------------------------
  const res = await getUniqueFieldValues(formData)

  res.data.flat(Infinity).forEach(function (arrayItem: any) {
    const opt = arrayItem !== null && typeof arrayItem === 'object' && 'value' in arrayItem
      ? { value: arrayItem.value, label: arrayItem.label ?? String(arrayItem.value) }
      : { value: arrayItem, label: String(arrayItem) }

    const exists = fieldOptions.value.some((e) => e.value === opt.value)
    if (!exists) fieldOptions.value.push(opt)
  })

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
const cards_filtered = computed(() => {
  const searchValue = searchKey.value.toLowerCase();
  // Log current project_locations value
  return tableDataList.value.filter(data => {
    // Ensure all fields are checked and filtered
    const matchesTitle = data.title.toLowerCase().includes(searchValue);
    return !searchValue || matchesTitle;
  });
});


const activeStep = ref(0)

const preloadFilterOptions = async () => {
  if (!ruleForm.card_model || !tableData.value.length) return
  const fields = [...new Set(tableData.value.map((r: any) => r.field).filter(Boolean))]
  if (!fields.length) return

  if (fields.includes('component_id') || fields.includes('programme_id')) {
    await loadProgrammeComponentHierarchy()
  }

  fieldOptions.value = []
  for (const field of fields) {
    if (field === 'component_id' || field === 'programme_id') continue
    try {
      const res = await getUniqueFieldValues({ model: ruleForm.card_model, selectedField: field })
      res.data.flat(Infinity).forEach((arrayItem: any) => {
        const opt = arrayItem !== null && typeof arrayItem === 'object' && 'value' in arrayItem
          ? { value: arrayItem.value, label: arrayItem.label ?? String(arrayItem.value) }
          : { value: arrayItem, label: String(arrayItem) }
        if (!fieldOptions.value.some((e: any) => e.value === opt.value)) fieldOptions.value.push(opt)
      })
    } catch { /* ignore per-field failures */ }
  }
}

const nextStep = async () => {
  try {
    await ruleFormRef.value?.validate()
    if (activeStep.value < 4) activeStep.value++
    if (activeStep.value === 3) await preloadFilterOptions()
  } catch { /* validation failed — stay on current step */ }
}
const prevStep = () => {
  if (activeStep.value > 0) {
    activeStep.value--;
  }
}

const remoteMethod = async (keyword) => {
  console.log(keyword)
  loading.value = true
  const formData = {}
  formData.model = model
  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword =searchKey.value
  formData.excludeGeom = false
  formData.excludeGeomAssoc = true
  formData.associated_multiple_models = []
  //--Single Filter -----------------------------------------

  //formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = []
  formData.filterValues = []

  //formData.cache_key = 'SeacrchByKey_' + search_string.value

  //-------------------------
  console.log("formData", formData)
  const res = await searchByKeyWord(formData)

  console.log("res.data", res.data)

  tableDataList.value = res.data
  total.value = res.total
  loading.value = false

}

 

const initialFormJson = ref('')
const isFormDirty = computed(() => JSON.stringify(ruleForm) !== initialFormJson.value)
watch(AddDialogVisible, (visible) => {
  if (visible) {
    if (formHeader.value === 'Add Card' && !ruleForm.id) {
      ruleForm.category = DEFAULT_DASHBOARD_DATA_CATEGORY
      lastCardCategory.value = DEFAULT_DASHBOARD_DATA_CATEGORY
    }
    initialFormJson.value = JSON.stringify(ruleForm)
  } else {
    resetCardForm({ closeDrawer: false })
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

</script>

<template>
  <el-card :class="['cards-settings-card', { 'is-mobile': isMobile }]">
    <div :class="['filter-bar', { 'filter-bar-mobile': isMobile }]">
      <el-button type="primary" plain :icon="Back" @click="goBack" class="filter-bar-back">
        Back
      </el-button>
      <el-input
        v-model="searchKey"
        placeholder="Search by card title"
        prefix-icon="el-icon-search"
        clearable
        class="filter-bar-search"
        @clear="handleClear"
        @input="remoteMethod"
      />
      <el-select
        v-model="value3"
        :onChange="handleSelectDashboard"
        :onClear="handleClear"
        multiple
        clearable
        filterable
        collapse-tags
        collapse-tags-tooltip
        placeholder="Filter by Dashboard"
        class="filter-bar-dashboard"
      >
        <el-option
          v-for="item in DashboardOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <div class="filter-bar-actions">
        <PermissionWrapper :permissions="'dashboard_card:create'">
          <el-tooltip content="Add Card" placement="top">
            <el-button @click="AddCard" type="primary" :icon="Plus" />
          </el-tooltip>
        </PermissionWrapper>
        <PermissionWrapper :permissions="'dashboard_card:read'">
          <el-tooltip content="Download" placement="top">
            <el-button :onClick="handleDownload" type="primary" :icon="Download" />
          </el-tooltip>
        </PermissionWrapper>
        <el-tooltip content="Clear Filters" placement="top">
          <el-button :onClick="handleClear" type="primary" :icon="Filter" />
        </el-tooltip>
      </div>
    </div>

    <div class="cards-table-wrap">
    <el-table v-loading="loading" :data="cards_filtered" stripe class="cards-table" table-layout="auto">
      <el-table-column v-if="!isMobile" type="index" width="50" />
      <el-table-column prop="title" label="Title" :min-width="isMobile ? 130 : 200" show-overflow-tooltip />
      <el-table-column prop="dashboard.title" label="Dashboard" :min-width="isMobile ? 100 : 180" show-overflow-tooltip />
      <el-table-column v-if="!isMobile" prop="icon" label="Icon" min-width="140">
        <template #default="{ row }">
          <div class="cards-table-icon">
            <span v-if="row.icon" class="cards-table-icon-preview">
              <Icon
                :icon="row.icon"
                :size="18"
                :color="row.iconColor || '#475569'"
              />
            </span>
            <span class="cards-table-icon-name">{{ row.icon || '—' }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Operations" :width="isMobile ? 112 : undefined" :min-width="isMobile ? 112 : 200" align="right" fixed="right">
        <template v-if="!isMobile" #header>
          <el-input
v-model="searchKey" size="small" :onChange="remoteMethod" :onBlur="remoteMethod" :onClear="handleClear"
            placeholder="Type to search" />
        </template>
        <template #default="scope">
          <div class="cards-table-ops">
          <PermissionWrapper :permissions="'dashboard_card:update'">
            <el-tooltip content="Edit" placement="top">
              <el-button
size="small" type="success" :icon="Edit" @click="editIndicator(scope as TableSlotDefault)"
                plain />
            </el-tooltip>
          </PermissionWrapper>
          <el-tooltip content="Clone" placement="top">
            <el-button
size="small" type="warning" :icon="CopyDocument" @click="CloneCard(scope as TableSlotDefault)"
              plain />
          </el-tooltip>
          <PermissionWrapper :permissions="'dashboard_card:delete'">
            <el-tooltip content="Delete" placement="top">
              <el-popconfirm
confirm-button-text="Yes" width="340" cancel-button-text="No" :icon="InfoFilled"
                icon-color="#626AEF" title="Are you sure to delete this card?"
                @confirm="DeleteIndicator(scope as TableSlotDefault)">
                <template #reference>
                  <el-button size="small" v-if="showAdminButtons" type="danger" :icon=Delete plain />
                </template>
              </el-popconfirm>
            </el-tooltip>
          </PermissionWrapper>
          </div>
        </template>
      </el-table-column>
    </el-table>
    </div>


    <ElPagination
:layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'" v-model:currentPage="currentPage" v-model:page-size="pSize"
      :page-sizes="[3, 5, 10, 20, 50, 200, 10000]" :total="total" :background="true" @size-change="onPageSizeChange"
      @current-change="onPageChange" class="mt-4"
      :small="isMobile"
      :pager-count="isMobile ? 3 : 7" />
  </el-card>

  <el-drawer
    v-model="AddDialogVisible"
    class="dashboard-card-drawer"
    direction="rtl"
    :size="isMobile ? '100%' : '40%'"
    :show-close="false"
    :before-close="handleDrawerBeforeClose"
    v-loading="drawerLoading"
    :element-loading-text="drawerLoadingText"
  >
    <template #header>
      <div class="drawer-header-wrap">
        <div class="drawer-header">
          <span class="drawer-title">{{ formHeader }}</span>
          <el-button class="drawer-close" icon="el-icon-close" type="text" @click="handleDrawerBeforeClose(() => { AddDialogVisible = false })" />
        </div>
        <p class="step-indicator">Step {{ activeStep + 1 }} of 4</p>
      </div>
    </template>

    <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="100px" label-position="top">
      <el-row v-if="activeStep == 0" :gutter="20">
        <el-col :span="24">
          <el-form-item id="btn1" label="Dashboard" prop="dashboard_id">
            <el-select v-model="ruleForm.dashboard_id" filterable placeholder="Select" :onChange="handleSelectType" style="width: 100%;">
              <el-option v-for="item in DashboardOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <div class="field-hint">Which dashboard this card will appear on.</div>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item id="btn2" label="Title" prop="title">
            <el-input v-model="ruleForm.title" placeholder="e.g. Total Settlements, Households with Electricity…" />
            <div class="field-hint">Short label shown above the number on the card.</div>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item id="btn3" label="Description" prop="description">
            <el-input v-model="ruleForm.description" placeholder="e.g. Count of all registered settlements in the database" />
            <div class="field-hint">Longer explanation shown on hover or in card details.</div>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item id="btn6" label="Data source" prop="category">
            <el-radio-group v-model="cardCategorySelection" class="category-group">
              <el-radio-button value="Status">Entity count / sum</el-radio-button>
              <el-radio-button value="Intervention">M&amp;E indicator value</el-radio-button>
            </el-radio-group>
            <div class="field-hint">{{ dataSourceHint }}</div>
          </el-form-item>
        </el-col>
      </el-row>


      <el-row v-if="activeStep === 1" :gutter="20">
        <el-col :span="24">
          <el-form-item id="btn4" label="Icon" prop="icon" class="icon-picker-form-field">
            <ElementPlusIconPickerField
              v-model="ruleForm.icon"
              :preview-color="ruleForm.iconColor"
            />
            <div class="field-hint">Icon shown on the card. Search by keyword — e.g. "house", "user", "lightning".</div>
          </el-form-item>
        </el-col>

        <el-col :span="24">
          <el-form-item id="btn5" label="Icon Color" prop="iconColor">
            <el-color-picker v-model="ruleForm.iconColor" />
            <div class="field-hint">Accent colour for the icon background.</div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row v-if="activeStep === 2" :gutter="20">
        <!-- Show Entity selection only for Status cards -->
        <el-col :span="24" v-if="isStatusCategory(ruleForm.category)">
          <el-form-item id="btn8" label="Entity" prop="card_model">
            <el-select
v-model="ruleForm.card_model" :onClear="handleClear" clearable filterable collapse-tags
              :onChange="handleSelectModel" placeholder="Select Entity to summarize" style="width: 100%;">
              <el-option v-for="item in ModelOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <div class="field-hint">The database table whose records will be counted or summed.</div>
          </el-form-item>
        </el-col>

        <!-- Show different fields based on category -->
        <el-col :span="24" v-if="isStatusCategory(ruleForm.category)">
          <el-form-item id="btn7" label="Aggregation Field" prop="card_model_field">
            <el-select
v-model="ruleForm.card_model_field" :onClear="handleClear" clearable filterable collapse-tags
              placeholder="Field to summarize" style="width: 100%;">
              <el-option v-for="item in fieldSet" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <div class="field-hint">Field to aggregate — leave as <b>id</b> for a plain row count, or pick a numeric field to sum/average.</div>
          </el-form-item>
        </el-col>

        <el-col :span="24" v-if="isInterventionCard">
          <el-form-item id="btn7_indicator" label="Select Indicator" prop="indicator_category_id">
            <el-select
v-model="ruleForm.indicator_category_id" :onClear="handleClear" clearable filterable collapse-tags
              placeholder="Select Indicator Category" style="width: 100%;">
              <el-option v-for="item in indicatorCategoryOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <div class="field-hint">The indicator category whose latest reported value will be shown on the card.</div>
          </el-form-item>
        </el-col>

        <el-col :span="24">
          <el-form-item id="btn9" label="Aggregation" prop="aggregation">
            <el-select
size="default" v-model="ruleForm.aggregation" :onClear="handleClear" style="width: 100%" clearable
              filterable collapse-tags placeholder="Select">
              <el-option
v-for="item in cardAggregationOptions" :key="item.value" :label="item.label"
                :value="item.value" />
            </el-select>
            <div v-if="isInterventionCard" class="field-hint"><b>Sum</b> — total reported amount. <b>Average</b> — mean reported amount across matching reports.</div>
            <div v-else class="field-hint"><b>Count</b> — total number of matching records. <b>Sum</b> — total of the chosen field. <b>Average</b> — mean value. <b>Max / Min</b> — highest or lowest value.</div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row v-if="activeStep === 3" :gutter="20">
        <el-col :span="24">
          <el-form-item id="btn10" label="Computation" prop="computation" class="mt-4">
            <el-select
size="default" v-model="ruleForm.computation" :onClear="handleClear" clearable filterable
              collapse-tags placeholder="Select" style="width: 100%;">
              <el-option label="Proportion(%)" value="proportion" />
              <el-option label="Absolute" value="absolute" /> </el-select>
            <div class="field-hint"><b>Absolute</b> — show the raw number (e.g. 1 245 households). <b>Proportion</b> — show the filtered count as a % of the total (requires a filter below).</div>
          </el-form-item>
        </el-col>
        <el-col :span="24" v-if="showCardFilters">
          <el-form-item id="btn11" label="Filter" prop="filtered" class="mt-4">
            <div style="display:flex;flex-direction:column;gap:4px;">
              <el-switch
v-model="ruleForm.filtered" style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
                active-text="Yes" inactive-text="No" />
              <div class="field-hint">Enable to restrict the count to a subset of records — e.g. only approved settlements, or only female-headed households.</div>
            </div>
          </el-form-item>
        </el-col>
        
        <el-col :span="24" v-if="ruleForm.filtered">
          <div class="filter-table-wrap">
            <el-table
:data="tableData" style="width: 100%;" max-height="250"
              size="small">
              <el-table-column prop="field" label="Field">
                <template #default="scope">
                  <el-select
size="small" v-model="scope.row.field" placeholder="Select Field"
                    :onChange="handleChangeFilterField">
                    <el-option v-for="item in fieldSet" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </template>
              </el-table-column>

              <el-table-column prop="operation" label="Operation">
                <template #default="scope">
                  <el-select size="small" v-model="scope.row.operation" placeholder="Select Operation">
                    <el-option
v-for="item in functionOptions" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                </template>
              </el-table-column>

              <el-table-column prop="value" label="Value">
                <template #default="scope">
                  <el-select
                    v-if="scope.row.field === 'component_id'"
                    size="small" v-model="scope.row.value" placeholder="Select Component(s)" multiple
                    filterable collapse-tags-tooltip collapse-tags :onChange="onAddFilter">
                    <el-option-group v-for="group in componentOptionGroupsForFilter" :key="group.label" :label="group.label">
                      <el-option v-for="item in group.children" :key="item.value" :label="item.label" :value="item.value" />
                    </el-option-group>
                  </el-select>
                  <el-select
                    v-else-if="scope.row.field === 'programme_id'"
                    size="small" v-model="scope.row.value" placeholder="Select Programme(s)" multiple
                    filterable collapse-tags-tooltip collapse-tags :onChange="onAddFilter">
                    <el-option-group v-for="group in programmeOptionGroupsForFilter" :key="group.id" :label="group.label">
                      <el-option :key="`root-${group.id}`" :label="group.rootLabel" :value="group.id" />
                      <el-option v-for="item in group.children" :key="item.value" :label="item.label" :value="item.value" />
                    </el-option-group>
                  </el-select>
                  <el-select
                    v-else
                    size="small" v-model="scope.row.value" placeholder="Select Value" multiple
                    collapse-tags-tooltip collapse-tags :onChange="onAddFilter">
                    <el-option v-for="item in fieldOptions" :key="item.value" :label="item.label" :value="item.value" />
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
        </el-col>
        
        <el-col :span="24" v-if="ruleForm.filtered">
          <el-row class="filter-actions" :gutter="8">
            <el-col :span="isMobile ? 24 : 12">
              <el-button @click="onAddItem" size="small" style="width: 100%">
                + Add Filter
              </el-button>
            </el-col>
            <el-col :span="isMobile ? 24 : 12">
              <el-button @click="onAddFilter" size="small" type="primary" style="width: 100%">
                Save Filters
              </el-button>
            </el-col>
          </el-row>
        </el-col>

      </el-row>

    </el-form>
    <template #footer>
      <div class="drawer-footer-bar">
        <div class="drawer-footer-left">
          <el-button @click="cancelDrawer" :disabled="drawerLoading">Cancel</el-button>
          <el-button @click="prevStep" :disabled="activeStep === 0 || drawerLoading">Previous</el-button>
        </div>

        <div class="drawer-footer-right">
          <el-button
            v-if="activeStep < 3"
            type="primary"
            @click="nextStep"
            :disabled="drawerLoading"
          >
            Next
          </el-button>
          <PermissionWrapper :permissions="'dashboard_card:create'">
            <el-button
              v-if="showSubmitBtn && activeStep === 3"
              type="primary"
              :loading="drawerLoading"
              @click="submitForm(ruleFormRef)"
            >
              Submit
            </el-button>
            <el-button
              v-if="showSubmitBtn && activeStep === 3"
              :loading="drawerLoading"
              @click="submitForm(ruleFormRef, true)"
            >
              Submit &amp; Add Another
            </el-button>
          </PermissionWrapper>
          <PermissionWrapper :permissions="'dashboard_card:update'">
            <el-button
              v-if="showEditSaveButton && activeStep === 3"
              type="primary"
              :loading="drawerLoading"
              @click="editForm(ruleFormRef)"
            >
              Save
            </el-button>
            <el-button
              v-if="showEditSaveButton && activeStep === 3"
              :loading="drawerLoading"
              @click="editForm(ruleFormRef, true)"
            >
              Save &amp; Add Another
            </el-button>
          </PermissionWrapper>
        </div>
      </div>
    </template>


  </el-drawer>



</template>
<style>
.gray-tooltip .el-tooltip__popper {
  background-color: gray;
}
</style>



<style>
.table-container {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>

<style>
.dashboard-card-drawer :deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 0;
}
.dashboard-card-drawer :deep(.el-drawer__body) {
  padding-top: 0;
}
.drawer-header-wrap {
  width: 100%;
  position: sticky;
  top: 0;
  z-index: 10;
}
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 12px;
  background: linear-gradient(135deg, var(--el-color-primary-dark-2), var(--el-color-primary)) !important;
  color: white;
}
.drawer-title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  color: white;
}
.drawer-close {
  color: white;
  border-radius: 4px;
  padding: 2px;
  min-height: unset;
}
.drawer-close:hover {
  background: rgba(255, 255, 255, 0.1);
}
.step-indicator {
  margin: 0;
  padding: 4px 12px 5px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--el-text-color-secondary);
  border-bottom: 1px solid #ebeef5;
}
.drawer-footer-bar {
  padding: 12px 20px;
  border-top: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.drawer-footer-left,
.drawer-footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.drawer-footer-right {
  margin-left: auto;
  justify-content: flex-end;
}
@media (max-width: 640px) {
  .drawer-footer-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .drawer-footer-left,
  .drawer-footer-right {
    justify-content: center;
  }
  .drawer-footer-right {
    margin-left: 0;
  }
}
.icon-picker-form-field :deep(.icon-picker-panel) {
  width: 100%;
}
.filter-table-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.filter-table-wrap :deep(.el-table) {
  min-width: 560px;
}
.filter-actions {
  margin-top: 12px;
}
.field-hint {
  font-size: 11px;
  color: #909399;
  margin-top: 3px;
  line-height: 1.4;
}
.category-group {
  display: flex;
  width: 100%;
}
.category-group :deep(.el-radio-button) {
  flex: 1;
}
.category-group :deep(.el-radio-button__inner) {
  width: 100%;
  white-space: normal;
  line-height: 1.3;
  padding: 10px 12px;
}
</style>

<style>
.filter-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-radius: 6px;
  margin-bottom: 18px;
}

.filter-bar-search {
  max-width: 220px;
  flex: 1 1 180px;
  min-width: 160px;
}

.filter-bar-dashboard {
  min-width: 200px;
  max-width: 320px;
  flex: 1 1 220px;
}

.filter-bar-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.filter-bar-mobile {
  flex-wrap: wrap;
  align-items: stretch;
  gap: 10px;
  padding: 12px 0 14px;
  margin-bottom: 12px;
}

.filter-bar-mobile .filter-bar-back {
  margin-right: 0;
}

.filter-bar-mobile .filter-bar-search,
.filter-bar-mobile .filter-bar-dashboard {
  width: 100%;
  max-width: none;
  min-width: 0;
  flex: 1 1 100%;
}

.filter-bar-mobile .filter-bar-actions {
  width: 100%;
  margin-left: 0;
  justify-content: flex-end;
}

.cards-table-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.cards-table {
  width: 100%;
}

.cards-settings-card {
  width: 100%;
}

.cards-settings-card :deep(.el-card__body) {
  width: 100%;
}

.cards-settings-card.is-mobile :deep(.el-card__body) {
  padding: 12px;
}

.cards-settings-card.is-mobile :deep(.el-pagination) {
  justify-content: center;
  flex-wrap: wrap;
  row-gap: 8px;
}

.cards-table-ops {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  flex-wrap: nowrap;
}

.cards-table-ops :deep(.el-button) {
  margin-left: 0;
  padding: 5px 8px;
}
.cards-table-icon {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cards-table-icon-preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}

.cards-table-icon-name {
  min-width: 0;
  word-break: break-word;
}
</style>