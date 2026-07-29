<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
// @ts-nocheck
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty,searchByKeyWord } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { ElButton, ElSelect, ElColorPicker, ElCard, ElPopconfirm, ElTour, ElTourStep } from 'element-plus'
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
  ElTable, ElSwitch, ElTableColumn, ElStep, ElSteps, ElSelectV2, ElMessageBox, ElMessage
} from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord } from '@/api/settlements'
import { getUniqueFieldValues } from '@/api/households'
import { getProgrammesList, getComponentsList } from '@/api/project-locations-optimized'
import { uuid } from 'vue-uuid'
import type { FormInstance } from 'element-plus'
import ElementPlusIconPickerField from '@/components/ElementPlusIconPickerField.vue'
import { Icon } from '@/components/Icon'

import { getModelSpecs, } from '@/api/fields'

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)
const isMobile = computed(() => appStore.getMobile)


console.log("userInfo--->", userInfo)

const showAdminButtons = ref(appStore.getAdminButtons)


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
  const roots = allProgrammes.value.filter((p: any) => p.parentId == null || p.parentId === '')
  return roots.map((root: any) => ({
    id: root.id,
    label: root.title || root.acronym,
    rootLabel: `${root.title || root.acronym} (all)`,
    children: allProgrammes.value
      .filter((p: any) => String(p.parentId) === String(root.id))
      .map((p: any) => ({ value: p.id, label: p.title || p.acronym })),
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

  return Array.from(groups.values())
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

    var opts = []
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
  // Set category first
  ruleForm.category = data.row.category
  
  if (data.row.category === 'Status') {
    ruleForm.card_model = data.row.card_model
    await handleSelectModel(data.row.card_model)
    if (data.row.filter_field) {
      await handleFilterAggregators(data.row.filter_field)
    }
  } else if (data.row.category == 'Indicator') {
    // Load indicator categories for Indicator cards
    await getIndicatorCategories()
    ruleForm.indicator_category_id = data.row.indicator_category_id
  }

  showEditSaveButton.value = true

  ruleForm.id = data.row.id
  ruleForm.title = data.row.title
  ruleForm.dashboard_id = data.row.dashboard_id
  ruleForm.description = data.row.description
  ruleForm.iconColor = data.row.iconColor
  ruleForm.icon = data.row.icon
  ruleForm.aggregation = data.row.aggregation
  ruleForm.indicator_category_id = data.row.indicator_category_id
  ruleForm.card_model_field = data.row.card_model_field
  ruleForm.filter_value = data.row.filter_value
  ruleForm.computation = data.row.computation
  ruleForm.filter_function = data.row.filter_function
  ruleForm.filter_field = data.row.filter_field
  ruleForm.filtered = data.row.filtered
  ruleForm.unique = data.row.unique
  ruleForm.filters = data.row.filters
  tableData.value = data.row.filters ?? [];

  console.log('Edit Mode', data.row)

  if (data.row.filter_value) {
    fieldSelected.value = true
    showFilterValues.value = true
  } else {
    fieldSelected.value = false
  }

  showStatusExtras.value = true

  formHeader.value = 'Edit Card'
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
  category: '',
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
  ruleForm.category = ''
  ruleForm.indicator_category_id = null

  if (preserveContext) {
    Object.assign(ruleForm, preserveContext)
    tableData.value = Array.isArray(preserveContext.filters)
      ? JSON.parse(JSON.stringify(preserveContext.filters))
      : []
  } else {
    tableData.value = []
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
  resetCardForm({ closeDrawer: true })
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
        if (ruleForm.category === 'Status' && !value) {
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
        if (ruleForm.category === 'Indicator' && !value) {
          callback(new Error('Indicator category is required for Indicator cards.'))
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
        if (ruleForm.category === 'Status' && !value) {
          callback(new Error('Entity is required for Status cards.'))
        } else {
          callback()
        }
      }
    }
  ]

})

const AddCard = () => {
  AddDialogVisible.value = true
}


const submitForm = async (formEl: FormInstance | undefined, addAnother = false) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ruleForm.model = model
      ruleForm.code = uuid.v4()
      
      // Fix: Ensure indicator_category_id is null for Status cards
      if (ruleForm.category === 'Status') {
        ruleForm.indicator_category_id = null
      }

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
      
      // Fix: Ensure indicator_category_id is null for Status cards
      if (ruleForm.category === 'Status') {
        ruleForm.indicator_category_id = null
      }

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

const handleSelectType = async (dashboard_id) => {
  let selDashboard = DashboardOptions.value.filter(item => item.value === dashboard_id);


  /*   if (selDashboard[0].type==='status') {  // status dashabords 
  showStatusExtras.value=true
    } else {
      showStatusExtras.value=false
  
    } */

  showStatusExtras.value = true

}

// Handle category selection (Status vs Indicator)
const handleCategorySelection = async (category) => {
  console.log('Selected category:', category)
  
  // Reset form fields when category changes
  ruleForm.card_model = ''
  ruleForm.card_model_field = ''
  ruleForm.aggregation = ''
  ruleForm.indicator_category_id = ''
  fieldSet.value = []
  
  if (category === 'Indicator') {
    // For Indicator cards, load indicator categories
    console.log('Indicator card selected - loading indicator categories')
    await getIndicatorCategories()
    ruleForm.card_model = 'indicator_category_report'
    ruleForm.card_model_field = 'amount'
  } else if (category === 'Status') {
    // For Status cards, we need to wait for user to select an entity first
    console.log('Status card selected - waiting for entity selection')
    // Clear fieldSet for Status cards - it will be populated when entity is selected
    fieldSet.value = []
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

  // component_id / programme_id aren't columns on project_location, so getModelSpecs
  // won't surface them — inject them as filterable pseudo-fields (backend resolves
  // them via a project→component subquery).
  if (selModel === 'project_location') {
    fieldSet.value.push(
      { value: 'component_id', label: 'Component (via Project)', type: 'FK_COMPONENT' },
      { value: 'programme_id', label: 'Programme (via Project)', type: 'FK_PROGRAMME' },
    )
  }
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

  // Set category first
  ruleForm.category = data.row.category
  ruleForm.indicator_category_id = data.row.indicator_category_id

  if (data.row.category === 'Status') {
    ruleForm.card_model = data.row.card_model
    await handleSelectModel(data.row.card_model)
    if (data.row.filter_field) {
      await handleFilterAggregators(data.row.filter_field)
    }
  } else if (data.row.category === 'Indicator') {
    // Load indicator categories for Indicator cards
    await getIndicatorCategories()
    ruleForm.indicator_category_id = data.row.indicator_category_id
  }

  ruleForm.title = data.row.title
  ruleForm.dashboard_id = data.row.dashboard_id
  ruleForm.description = data.row.description
  ruleForm.iconColor = data.row.iconColor
  ruleForm.icon = data.row.icon
  ruleForm.aggregation = data.row.aggregation
  ruleForm.card_model_field = data.row.card_model_field
  ruleForm.filter_value = data.row.filter_value
  ruleForm.computation = data.row.computation
  ruleForm.filter_function = data.row.filter_function
  ruleForm.filter_field = data.row.filter_field
  ruleForm.filtered = data.row.filtered
  ruleForm.unique = data.row.unique
  ruleForm.category = data.row.category

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


const categoryOptions = [
  {
    value: 'Status',
    label: 'Status'
  },
  {
    value: 'Indicator',
    label: 'Indicator'
  }
]


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

const showTourStep0 = ref(false)
const showTourStep1 = ref(false)
const showTourStep2 = ref(false)
const showTourStep3 = ref(false)


const showTour = () => {
  if (activeStep.value == 0) {
    showTourStep0.value = true
  }
  else if (activeStep.value == 1) {
    showTourStep1.value = true
  }
  else if (activeStep.value == 2) {
    showTourStep2.value = true
  }
  else if (activeStep.value == 3) {
    showTourStep3.value = true
  }
}
const endTour = () => {
  showTourStep0.value = false
  showTourStep1.value = false
  showTourStep2.value = false
  showTourStep3.value = false

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
            <el-button :onClick="AddCard" type="primary" :icon="Plus" />
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
    direction="rtl"
    :size="isMobile ? '100%' : '40%'"
    :before-close="handleDrawerBeforeClose"
    v-loading="drawerLoading"
    :element-loading-text="drawerLoadingText"
  >
    <template #header>
      <div class="drawer-header">
        <span class="drawer-title">{{ formHeader }}</span>
        <el-button class="drawer-close" icon="el-icon-close" type="text" @click="handleDrawerBeforeClose(() => { AddDialogVisible = false })" />
      </div>
    </template>

    <div class="steps-wrapper">
      <el-steps :active="activeStep" align-center finish-status="success">
        <el-step title="Details" description="Basic card info" />
        <el-step title="Icons" description="Icon and color" />
        <el-step title="Computation" description="Category and aggregation" />
        <el-step title="Filters" description="Computation and filters" />
      </el-steps>
    </div>

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
        <el-col :span="24">
          <el-form-item id="btn6" label="Category" prop="category">
            <el-select v-model="ruleForm.category" filterable placeholder="Select" :onChange="handleCategorySelection" style="width: 100%;">
              <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <div class="field-hint"><b>Status</b> — counts or sums from a database table (settlements, households…). <b>Indicator</b> — pulls a value from a pre-recorded indicator report.</div>
          </el-form-item>
        </el-col>

        <!-- Show Entity selection only for Status cards -->
        <el-col :span="24" v-if="ruleForm.category === 'Status'">
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
        <el-col :span="24" v-if="ruleForm.category === 'Status'">
          <el-form-item id="btn7" label="Aggregation Field" prop="card_model_field">
            <el-select
v-model="ruleForm.card_model_field" :onClear="handleClear" clearable filterable collapse-tags
              placeholder="Field to summarize" style="width: 100%;">
              <el-option v-for="item in fieldSet" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <div class="field-hint">Field to aggregate — leave as <b>id</b> for a plain row count, or pick a numeric field to sum/average.</div>
          </el-form-item>
        </el-col>

        <el-col :span="24" v-if="ruleForm.category === 'Indicator'">
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
v-for="item in aggregationOptionsFiltered" :key="item.value" :label="item.label"
                :value="item.value" />
            </el-select>
            <div class="field-hint"><b>Count</b> — total number of matching records. <b>Sum</b> — total of the chosen field. <b>Average</b> — mean value. <b>Max / Min</b> — highest or lowest value.</div>
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
        <el-col :span="24" v-if="ruleForm.card_model">
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
          <div :class="['filter-actions', { 'filter-actions-mobile': isMobile }]">
            <el-button class="mt-4" @click="onAddItem" size="small">
              Add Filter
            </el-button>
            <el-button class="mt-4" @click="onAddFilter" size="small">
              Save Filters
            </el-button>
          </div>
        </el-col>

      </el-row>

    </el-form>
    <template #footer>
      <div class="drawer-footer-bar">
        <el-button @click="AddDialogVisible = false" :disabled="drawerLoading">Cancel</el-button>
        <el-button @click="prevStep" :disabled="activeStep === 0 || drawerLoading" style="margin: 0 8px;">Previous</el-button>
        <el-button @click="nextStep" v-if="activeStep < 3" type="primary" :disabled="drawerLoading" style="margin-right: 8px;">Next</el-button>
        <el-button color="#626aef" type="info" @click="showTour" :icon="InfoFilled" plain style="margin-right: 8px;" />
        <PermissionWrapper :permissions="'dashboard_card:create'">
          <el-button v-if="showSubmitBtn && activeStep === 3" type="primary" :loading="drawerLoading" @click="submitForm(ruleFormRef)">Submit</el-button>
          <el-button v-if="showSubmitBtn && activeStep === 3" :loading="drawerLoading" @click="submitForm(ruleFormRef, true)">Submit & Add Another</el-button>
        </PermissionWrapper>
        <PermissionWrapper :permissions="'dashboard_card:update'">
          <el-button v-if="showEditSaveButton && activeStep === 3" type="primary" :loading="drawerLoading" @click="editForm(ruleFormRef)">Save</el-button>
          <el-button v-if="showEditSaveButton && activeStep === 3" :loading="drawerLoading" @click="editForm(ruleFormRef, true)">Save & Add Another</el-button>
        </PermissionWrapper>
      </div>
    </template>


  </el-drawer>





  <el-tour v-model="showTourStep0" z-index="100000" :onClose="endTour">
    <el-tour-step
target="#btn1" title="Title"
      description="This is the short name of the dashboards. This is what will appear under the navigation section for dashboards. Use a single short word." />
    <el-tour-step
target="#btn2" title="Type"
      description="The system supports two types of dashboards 'Status' : draws on the various entities within the system eg settlements, facilities, households e.t.c. The 'Indicator' type draws data exclusively from the M&E indicators" />
    />
    <el-tour-step target="#btn3" title="Description" description="Provide a short description of this card" />
    />
  </el-tour>

  <el-tour v-model="showTourStep1" z-index="100000" :onClose="endTour">
    <el-tour-step
target="#btn4" title="Icon"
      description="Use Browse to pick an Element Plus icon, or Paste to enter a name (e.g. House) or legacy Iconify string (e.g. mdi:home-city)." />
    <el-tour-step target="#btn5" title="Icon Color" description="The  color of the ICon on the statistic card" />

  </el-tour>

  <el-tour v-model="showTourStep2" z-index="100000" :onClose="endTour">
    <el-tour-step
target="#btn6" title="Category"
      description="The system supports two types of cards 'Status' : draws on the various entities within the system eg settlements, facilities, households e.t.c. The 'Indicator' type draws data exclusively from the M&E indicators" />
    <el-tour-step target="#btn7" title="Aggregation Field" description="For Status cards: The field to use for summary" />
    <el-tour-step target="#btn7_indicator" title="Indicator Category" description="For Indicator cards: Select the indicator category that will be used to generate reports" />

    <el-tour-step target="#btn8" title="Entity" description="For Status cards: The entity(table) to summarize" />
    <el-tour-step
target="#btn9" title="Aggregation Method"
      description="The computation method to use. Sum only applies to numeric fields" />

  </el-tour>

  <el-tour v-model="showTourStep3" z-index="100000" :onClose="endTour">

    <el-tour-step
target="#btn10" title="Computation Method"
      description="Proportion is a percent of the result against the total entitles in the table. Absolute is teh sum/count" />
    <el-tour-step
target="#btn11" title="Filters"
      description="Switch on if the card features filtering. This can be achieved say, for instance filtering for a specific county, gender etc. You will need to specify the field and its filter values" />

  </el-tour>




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
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: linear-gradient(135deg, var(--el-color-primary-dark-2), var(--el-color-primary)) !important;
  color: white;
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
.steps-wrapper {
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-8));
  padding: 16px;
  border-radius: 4px;
  margin: 20px 0;
}
.drawer-footer-bar {
  padding: 12px 20px;
  border-top: 1px solid #ebeef5;
  text-align: right;
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
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.filter-actions-mobile {
  flex-direction: column;
}
.filter-actions-mobile .el-button {
  width: 100%;
  margin: 0;
}
.field-hint {
  font-size: 11px;
  color: #909399;
  margin-top: 3px;
  line-height: 1.4;
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