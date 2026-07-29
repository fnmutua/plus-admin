<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { getSettlementListByCounty, getListManyToMany, searchByKeyWord } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import DownloadCustom from '@/views/Components/DownloadCustom.vue'
import { ElButton, ElSelect, ElSelectV2, ElTour, ElTourStep, ElCard } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'

import {
  Plus,
  Edit,
  Delete,
  Download, Back,
  Filter,
  Search
} from '@element-plus/icons-vue'

import { ref, reactive, onMounted, computed, watch } from 'vue'
import {
  ElPagination, ElInputNumber, ElTable,
  ElTableColumn, ElDropdown, ElDropdownItem, ElDropdownMenu, ElSwitch,
  ElTooltip, ElOption, ElDialog, ElDrawer, ElForm, ElRow, ElFormItem, ElInput, FormRules, ElPopconfirm, ElStep, ElSteps
} from 'element-plus'
import type { FormInstance } from 'element-plus'


import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import xlsx from "json-as-xlsx"
import DownloadAll from '@/views/Components/DownloadAll.vue';
import type { ButtonInstance } from 'element-plus'
import { v5 } from 'uuid'
import TableActions from '@/views/Components/TableActions.vue';
import PermissionWrapper from '@/components/PermissionWrapper.vue';
import AdjustableTableColumnPicker from '@/components/Users/AdjustableTableColumnPicker.vue'
import { Icon as AppIcon } from '@/components/Icon'
import { useAdjustableTableColumns, type AdjustableColumnSetting } from '@/composables/useAdjustableTableColumns'


const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)



const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)


const action_buttons = ref([])
if (showAdminButtons.value) {
  action_buttons.value = ['edit', 'delete']
} else if (showEditButtons.value) {

  action_buttons.value = ['edit']
}
else {
  action_buttons.value = []

}





console.log("userInfo--->", userInfo) 
const isMobile = computed(() => appStore.getMobile)

console.log('IsMobile', isMobile)

const dialogWidth = ref()
const actionColumnWidth = ref()

if (isMobile.value) {
  dialogWidth.value = '90%'
  actionColumnWidth.value = '75px'
} else {
  dialogWidth.value = '32%'
  actionColumnWidth.value = '160px'
}

const indicatorCategoryColumnDefaults = (): AdjustableColumnSetting[] => [
  { key: 'id', label: 'Id', width: 80, minWidth: 80, visible: true, hideable: true },
  { key: 'activity', label: 'Activity', width: undefined as any, minWidth: 180, visible: true, hideable: true },
  { key: 'indicator', label: 'Indicator', width: undefined as any, minWidth: 180, visible: true, hideable: true },
  { key: 'dimension', label: 'Dimension', width: undefined as any, minWidth: 140, visible: true, hideable: true },
  { key: 'location', label: 'Location', width: undefined as any, minWidth: 140, visible: true, hideable: true },
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
} = useAdjustableTableColumns('indicatorCategoryTableColumnsV1', indicatorCategoryColumnDefaults)

const equalDataColumnsVisible = computed(
  () => isColumnVisible('activity') && isColumnVisible('indicator')
)

const idColumnWidth = () => {
  const w = columnWidth('id')
  return typeof w === 'number' && w > 40 ? w : 80
}

const getRowActivityLabel = (row: Record<string, any>) => {
  if (row.indicator_level === 'project') return 'Project level'
  const title =
    row.activity?.title ??
    row.activity?.shortTitle ??
    row.indicator?.activity?.title ??
    activityOptionsFiltered.value.find((o) => o.value === row.activity_id)?.label
  if (title) return title
  return row.activity_id ? `Activity #${row.activity_id}` : '—'
}

const getRowIndicatorLabel = (row: Record<string, any>) =>
  row.indicator?.name ?? row.indicator_name ?? '—'

const getRowDimensionLabel = (row: Record<string, any>) =>
  row.category_title ?? row.category?.category ?? '—'

const getRowLocationLabel = (row: Record<string, any>) => {
  const pl = row.project_location
  if (!pl) return '—'
  return (
    pl.settlement?.name ??
    pl.location_name ??
    pl.county?.name ??
    (pl.id ? `Location #${pl.id}` : '—')
  )
}

const flexColumnMinWidth = (key: 'activity' | 'indicator' | 'dimension' | 'location') => {
  const min = columnMinWidth(key) ?? 140
  const w = columnWidth(key)
  if (typeof w === 'number' && w > 40) {
    if (equalDataColumnsVisible.value && (key === 'activity' || key === 'indicator')) {
      const otherKey = key === 'activity' ? 'indicator' : 'activity'
      const otherW = columnWidth(otherKey)
      const saved = [w, otherW].filter((n): n is number => typeof n === 'number' && n > 40)
      if (saved.length) return Math.max(min, ...saved)
    }
    return Math.max(min, w)
  }
  return min
}

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  indicator_level: null,
  indicator_id: null,
  activity_id: null,
  indicator_name: null,
  category_id: null,
  category_title: null,
  frequency: null,
  level: null,
  code: null,
})

const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])

const hasActiveFilters = computed(
  () =>
    (Array.isArray(value2.value) && value2.value.length > 0) ||
    (Array.isArray(value3.value) && value3.value.length > 0)
)

const categoryOptions = ref([])
const categories = ref([])
const filteredIndicators = ref([])
const searchLoading = ref(false)
const downloadLoading = ref(false)
const page = ref(1)
const currentPage = ref(1)
const selCounties = []
const loading = ref(true)
const total = ref(0)

// Keep page and currentPage in sync
watch(page, (newPage) => {
  currentPage.value = newPage
})

watch(currentPage, (newCurrentPage) => {
  page.value = newCurrentPage
})


const mobileBreakpoint = 768;
const defaultPageSize = 10;
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





const AddDialogVisible = ref(false)
const formHeader = ref('Configure Indicator')
const showSubmitBtn = ref(true)
const showEditSaveButton = ref(false)
const activeStep = ref(0)


console.log("Show Buttons -->", showAdminButtons)



let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var filterValues = []
var tblData = []
const associated_Model = ''
const associated_multiple_models = ['indicator', 'project', 'activity', 'category', 'project_location']
const model = 'indicator_category'
// indicator + activity are already in associated_multiple_models; nesting again duplicates indicator and can drop joins
const nested_models = []

//// ------------------parameters -----------------------////

const { t } = useI18n()


const handleClear = async () => {
  console.log('cleared....')

  // clear all the filters -------
  filterValues = []
  filters = []
  value1.value = ''
  value2.value = ''
  value3.value = ''
  // Reset page size based on screen size
  updatePageSize()
  page.value = 1
  currentPage.value = 1
  tblData = []
  // Reset indicators options to show all
  indicatorsOptions.value = [...indicatorsOptionsFiltered.value]
  // Reset category options to show all
  categoryOptions.value = categories.value.map((item: any) => ({
    value: item.id,
    label: item.category
  }))
  //----run the get data--------
  getInterventionsAll()
}

// Filter indicators based on search query
const filterIndicators = async (query: string) => {
  if (!query || query.length < 3) {
    // If query is too short, show all indicators
    indicatorsOptions.value = indicatorsOptionsFiltered.value
    return
  }

  searchLoading.value = true
  
  try {
    const formData: any = {}
    formData.curUser = 1
    formData.model = 'indicator'
    formData.searchField = 'name'
    formData.searchKeyword = query
    formData.limit = 50 // Limit to 50 results for dropdown
    formData.page = 1

    const res: any = await searchByKeyWord(formData)
    
    // Update indicators options with search results
    indicatorsOptions.value = res.data.map((item: any) => ({
      value: item.id,
      label: item.name,
      activity_id: item.activity_id
    }))
  } catch (error) {
    console.error('Error searching indicators:', error)
  } finally {
    searchLoading.value = false
  }
}

// Filter categories based on search query
const filterCategories = async (query: string) => {
  if (!query || query.length < 3) {
    // If query is too short, show all categories
    categoryOptions.value = categories.value.map((item: any) => ({
      value: item.id,
      label: item.category
    }))
    return
  }

  searchLoading.value = true
  
  try {
    const formData: any = {}
    formData.curUser = 1
    formData.model = 'category'
    formData.searchField = 'category'
    formData.searchKeyword = query
    formData.limit = 50 // Limit to 50 results for dropdown
    formData.page = 1

    const res: any = await searchByKeyWord(formData)
    
    // Update category options with search results
    categoryOptions.value = res.data.map((item: any) => ({
      value: item.id,
      label: item.category
    }))
  } catch (error) {
    console.error('Error searching categories:', error)
  } finally {
    searchLoading.value = false
  }
}

const handleSelectIndicator = async (indicator: any) => {
  var selectOption = 'indicator_id'
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
  makeSettlementOptions(filteredIndicators)

  getFilteredData(filters, filterValues)
}

const handleSelectCategory = async (category: any) => {
  var selectOption = 'category_id'
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

  if (!filterValues.includes(category) && category.length > 0) {
    filterValues.splice(index, 0, category) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
  }

  // expunge the filter if the filter values are null
  if (category.length === 0) {
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


const getFilteredData = async (selFilters, selfilterValues) => {
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
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = nested_models
  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('After Querry', res)
  tableDataList.value = res.data
  total.value = res.total

  tblData = [] // reset the table data
  console.log('TBL-b4', tblData)
  res.data.forEach(function (arrayItem) {
    //  console.log(countyOpt)
    // delete arrayItem[associated_Model]['geom'] //  remove the geometry column

    var dd = flattenJSON(arrayItem)

    tblData.push(dd)
  })

  console.log('TBL-4f', tblData)
}


const indicatorsOptions = ref([])

const getIndicatorNames = async () => {
  indicatorsOptions.value = []
  indicatorsOptionsFiltered.value = []
  const res = await getCountyListApi({
    params: {
      //   pageIndex: 1,
      //    limit: 100,
      curUser: 1, // Id for logged in user
      model: 'indicator',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received indicators:', response)

    var ret = response.data

    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var opt = {}
      opt.value = arrayItem.id
      opt.activity_id = arrayItem.activity_id
      opt.label = arrayItem.name  
      //  console.log(countyOpt)
      indicatorsOptions.value.push(opt)
      indicatorsOptionsFiltered.value.push(opt)
    })
  })
}

const getCategoryOptions = async () => {
  const res = await getCountyListApi({
    params: {
      //   pageIndex: 1,
      //   limit: 100,
      curUser: 1, // Id for logged in user
      model: 'category',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)

    var ret = response.data

    loading.value = false
    // pass result to the makeoptions

    categories.value = ret
    // Initialize category options
    categoryOptions.value = ret.map((item: any) => ({
      value: item.id,
      label: item.category
    }))
  })
}

type SelectOption = { label?: string; value?: unknown; [key: string]: unknown }

const sortSelectOptionsByLabel = (options: SelectOption[]) =>
  options.sort((a, b) =>
    String(a.label ?? '').localeCompare(String(b.label ?? ''), undefined, { sensitivity: 'base' })
  )

const activityOptions = ref<SelectOption[]>([])
const activityOptionsFiltered = ref<SelectOption[]>([])

const getActivityOptions = async () => {
  activityOptionsFiltered.value = []
  await getCountyListApi({
    params: {
      curUser: 1,
      model: 'activity',
      searchField: 'title',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    response.data.forEach((arrayItem) => {
      activityOptionsFiltered.value.push({
        value: arrayItem.id,
        label: arrayItem.title
      })
    })
    sortSelectOptionsByLabel(activityOptionsFiltered.value)
  })
}








const frequencyOptions = ref([])

const getFrequencyOptions = async () => {
  frequencyOptions.value = []
  const res = await getCountyListApi({
    params: {
      //   pageIndex: 1,
      //    limit: 100,
      curUser: 1, // Id for logged in user
      model: 'frequency',
      searchField: 'frequency',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received frequency:', response)

    var ret = response.data

    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var opt = {}
      opt.value = arrayItem.id
      opt.label = arrayItem.frequency
      //  console.log(countyOpt)
      frequencyOptions.value.push(opt)
    })
  })
}


getFrequencyOptions()

const projectOptions = ref([])
const projectList = ref([])

const getProjectActivities = async () => {
  projectOptions.value = []
  activityOptions.value = []
  const formData = {}
  formData.curUser = 1 // Id for logged in user
  formData.model = 'project'
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  formData.assocModel = ''

  // - multiple filters -------------------------------------
  formData.filters = []
  formData.filterValues = []
  formData.associated_multiple_models = ['activity']
  formData.associated_multiple_field = ['project_activity']

  //-------------------------
  //console.log(formData)
  const res = await getListManyToMany(formData)

  console.log('Projects >>', res)
  projectList.value = res.data
  res.data.forEach(function (arrayItem) {

    //console.log(arrayItem)
    var opt = {}
    opt.value = arrayItem.id
    opt.label = arrayItem.title  
    opt.activities = arrayItem.activities
    opt.programme_implementation = arrayItem.programme_implementation

    //  console.log(countyOpt)
    projectOptions.value.push(opt)

    //console.log('projectOptions', arrayItem)

    arrayItem.activities.forEach(function (activity: { id: string; type: string }) {
      //console.log(arrayItem)
      var act_opt = {}
      act_opt.project_id = arrayItem.id   // this the project id that will be used to filter the acivty options 
      act_opt.value = activity.id
      act_opt.label = activity.title + '(' + activity.id + ')'

      //  console.log(countyOpt)
      activityOptions.value.push(act_opt)
    })
  })

  sortSelectOptionsByLabel(activityOptions.value)
}

const project_locations = ref([])
const getProjectLocations = async (project_id) => {
  console.log('project_id', project_id);
  console.log("Get Locations for  proejct : ", project_id)

  // Get the project settlement ids
  const formData = {
    model: 'project_location',
    searchField: 'name',
    searchKeyword: '',
    filters: ['project_id'],
    filterValues: [[project_id]],
    associated_multiple_models: []
  };

  const res = await getSettlementListByCounty(formData);
  const sett_ids = res.data.map(item => item.settlement_id); // Extract settlement_id
  console.log('sett_ids', sett_ids);

  // Fetch settlements and their details
  const form = {
    model: 'settlement',
    filters: ['id'],
    filterValues: [sett_ids],
    excludeGeom: true,
    associated_multiple_models: ['county', 'subcounty', 'ward']
  };

  const setts = await getSettlementListByCounty(form);
  console.log('setts', setts);

  // Map settlements to include additional details
  const settlements = setts.data.map(item => ({
    county: item.county.name,
    subcounty: item.subcounty.name,
    ward: item.ward.name,
    settlement: item.name,
    settlement_id: item.id
  }));

  // Join project locations with settlement details based on settlement_id
  project_locations.value = res.data.map(projectLocation => {
    const settlement = settlements.find(sett => sett.settlement_id === projectLocation.settlement_id);
    return {
      ...projectLocation,
      county: settlement ? settlement.county : null,
      subcounty: settlement ? settlement.subcounty : null,
      ward: settlement ? settlement.ward : null,
      settlementName: settlement ? settlement.settlement : null
    };
  });


  console.log('project_locations', project_locations.value);
};

 

// Get Filted Indicators 

const getProjectActivityIndicators = async (activity_id) => {
  const formData = {}
 
  formData.model = 'indicator'
  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

 
  // - multiple filters -------------------------------------

  console.log('undefined',activity_id)

  if(!activity_id){

     formData.filters = ['level']
     formData.filterValues = [['project']]

  } else {
    formData.filters = ['activity_id']
  formData.filterValues = [[activity_id]]

  }



  formData.associated_multiple_models = []
 
  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)
 
  console.log('This activity Idnicator', res.data)
  return res.data
}



const indicatorsOptionsFiltered = ref([])


const changeActivity = async (activity: any) => {
  console.log('Activity selected:', activity)

  // Clear previous selections
  ruleForm.indicator_id = null
  ruleForm.category_id = null
  ruleForm.frequency = null

  if (!activity) {
    indicatorsOptionsFiltered.value = []
    return
  }

  // Get indicators for the selected activity
  const sel_indicators = await getProjectActivityIndicators(activity)

  const transformedArray = sel_indicators.map(item => {
    return {
      label: item.name,
      value: item.id
    };
  });

  indicatorsOptionsFiltered.value = transformedArray
  console.log(`Loaded ${transformedArray.length} indicators for activity ${activity}:`, transformedArray)
}



getProjectActivities()
getActivityOptions()
//getProjectOptions()

getIndicatorNames()
getCategoryOptions()
getInterventionsAll()



const editingMode = ref(false)
const editIndicator = async (data: TableSlotDefault) => {
  showSubmitBtn.value = false
  showEditSaveButton.value = true
  editingMode.value = true
  activeStep.value = 0

  console.log('Editing indicator:', data)
  
  // Ensure activity options are loaded first
  if (activityOptionsFiltered.value.length === 0) {
    await getActivityOptions()
  }

  // Set all form values without triggering change functions
  ruleForm.id = data.id
  ruleForm.indicator_name = data.indicator.indicator_name
  ruleForm.indicator_level = data.indicator_level
  ruleForm.indicator_id = data.indicator_id
  ruleForm.category_id = data.category_id
  ruleForm.frequency = data.frequency
  ruleForm.category_title = data.category_title
  ruleForm.activity_id = data.activity_id

  // Load indicators based on level without clearing fields
  if (data.indicator_level === 'project') {
    const sel_indicators = await getProjectActivityIndicators(undefined)
    const transformedArray = sel_indicators.map(item => ({
      label: item.name,
      value: item.id
    }));
    indicatorsOptionsFiltered.value = transformedArray
  } else if (data.indicator_level === 'activity' && data.activity_id) {
    const sel_indicators = await getProjectActivityIndicators(data.activity_id)
    const transformedArray = sel_indicators.map(item => ({
      label: item.name,
      value: item.id
    }));
    indicatorsOptionsFiltered.value = transformedArray
  }

  formHeader.value = 'Edit Indicator Configuration'

  console.log('Frequency options:', frequencyOptions.value)
  await getFrequencyOptions()
  
  AddDialogVisible.value = true
}


const DeleteIndicator = (data: TableSlotDefault) => {
  console.log('----->', data)
  let formData = {}
  formData.id = data.id
  formData.model = 'indicator_category'
  DeleteRecord(formData)
  console.log(tableDataList.value)

  // remove the deleted object from array list 
  let index = tableDataList.value.indexOf(data);
  if (index !== -1) {
    tableDataList.value.splice(index, 1);
  }

}


const handleClose = () => {
  showSubmitBtn.value = true
  showEditSaveButton.value = false
  activeStep.value = 0

  ruleForm.indicator_id = ''
  ruleForm.indicator_name = ''
  ruleForm.category_id = ''
  ruleForm.category_title = ''
  ruleForm.frequency = ''

  formHeader.value = 'Configure Indicator'
  AddDialogVisible.value = false
}


const changeCategory = async (category: any) => {
  ruleForm.category_id = category
  var filtredCategories = categoryOptions.value.filter(function (el) {
    return el.value == category
  });
  ruleForm.category_title = filtredCategories[0].label

}

const changeIndicator = async (indicator: any) => {
  ruleForm.indicator_id = indicator

  ruleForm.category_id = null
  ruleForm.frequency = null

  // Find the selected indicator from the filtered options
  const selectedIndicator = indicatorsOptionsFiltered.value.find(item => item.value === indicator)
  if (selectedIndicator) {
    ruleForm.indicator_name = selectedIndicator.label
    console.log("Selected Indicator:", selectedIndicator.label)
  }
}






const rules = reactive<FormRules>({
  indicator_id: [
    { required: true, message: 'Please select an indicator', trigger: 'blur' }
  ],
  
  indicator_level: [{ required: true, message: 'The Indicator level is required', trigger: 'blur' }],
  category_id: [{ required: true, message: 'The Indicator category is required', trigger: 'blur' }],
  frequency: [{ required: true, message: 'The Indicator frequency is required', trigger: 'blur' }],
  activity_id: [
    {
      validator: (_rule, value, callback) => {
        if (ruleForm.indicator_level === 'activity' && !value) {
          callback(new Error('The Indicator Activity is required'))
        } else {
          callback()
        }
      },
      trigger: 'change',
    },
  ],
})

const buildIndicatorCategoryCode = () =>
  [ruleForm.indicator_id, ruleForm.activity_id, ruleForm.category_id].filter(Boolean).join('_')

const categoryRules = reactive<FormRules>({
  category: [
    { required: true, message: 'Please enter category title', trigger: 'blur' }
  ]
})

const AddIndicatorConfig = async () => {
  if (activityOptionsFiltered.value.length === 0) {
    await getActivityOptions()
  }
  activeStep.value = 0
  AddDialogVisible.value = true
}

const step0Fields = computed(() => {
  const fields: string[] = ['indicator_level', 'indicator_id']
  if (ruleForm.indicator_level === 'activity') fields.push('activity_id')
  return fields
})

const validateCurrentStep = async () => {
  if (!ruleFormRef.value) return false
  const fields = activeStep.value === 0 ? step0Fields.value : ['category_id', 'frequency']
  try {
    await ruleFormRef.value.validateField(fields)
    return true
  } catch {
    return false
  }
}

const nextStep = async () => {
  const valid = await validateCurrentStep()
  if (valid && activeStep.value < 1) {
    activeStep.value++
  }
}

const prevStep = () => {
  if (activeStep.value > 0) {
    activeStep.value--
  }
}



const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  const fields = [...step0Fields.value, 'category_id', 'frequency']
  try {
    await formEl.validateField(fields)
    ruleForm.model = 'indicator_category'
    ruleForm.code = buildIndicatorCategoryCode()
    await CreateRecord(ruleForm)
    page.value = 1
    currentPage.value = 1
    await getFilteredData(filters, filterValues)
    handleClose()
    ruleForm.activity_id = null
  } catch (fields) {
    console.log('error submit!', fields)
  }
}


const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return

  const fields = [...step0Fields.value, 'category_id', 'frequency']
  try {
    await formEl.validateField(fields)
  } catch (fields) {
    console.log('error submit!', fields)
    return
  }

  ruleForm.model = 'indicator_category'
  ruleForm.code = buildIndicatorCategoryCode()

  await updateOneRecord(ruleForm)
    .then((updatedRecord) => {
      if (updatedRecord) {
        getFilteredData(filters, filterValues)
        AddDialogVisible.value = false
        handleClose()
      }
    })
    .catch((error) => {
      console.error('Error updating record:', error)
    })

  AddDialogVisible.value = false
  ruleForm.activity_id = null
  editingMode.value = false
}







console.log('Options---->', indicatorsOptions)



const DownloadXlsx = async () => {
  console.log(tableDataList.value)

  // change here !
  let fields = [
    { label: "S/No", value: "index" }, // Top level data
    { label: "Indicator", value: "indicator" }, // Top level data
    { label: "Unit", value: "unit" }, // Custom format
    { label: "Level", value: "level" }, // Custom format
    { label: "Frequency", value: "frequency" }, // Custom format
    { label: "Category", value: "category" }, // Custom format

  ]


  // Preprae the data object 
  var dataObj = {}
  dataObj.sheet = 'data'
  dataObj.columns = fields

  let dataHolder = []
  // loop through the table data and sort the data 
  // change here !
  for (let i = 0; i < tableDataList.value.length; i++) {
    let thisRecord = {}
    tableDataList.value[i]
    thisRecord.index = i + 1
    thisRecord.indicator = tableDataList.value[i].indicator.name
    thisRecord.unit = tableDataList.value[i].indicator.unit
    thisRecord.level = tableDataList.value[i].indicator.level
    thisRecord.frequency = tableDataList.value[i].frequency
    thisRecord.category = tableDataList.value[i].category.category


    dataHolder.push(thisRecord)
  }
  dataObj.content = dataHolder




  let settings = {
    fileName: model, // Name of the resulting spreadsheet
    writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
    writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
  }

  // Enclose in array since the fucntion expects an array of sheets
  xlsx([dataObj], settings) //  download the excel file

}


// Add new catrogires 
const categoryFormRef = ref<FormInstance>()
const categoryForm = reactive({
  indicator_id: '',
  indicator_name: '',
  category_id: '',
  category_title: '',
  frequency: '',
  activity_id: null,
  code: null,
  project_id: null
})
const AddCategoryVisible = ref(false)
const AddCategory = () => {

  AddCategoryVisible.value = true
  console.log('adding....')


}


const submitCategoryForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => { // Make the callback function async
    if (valid) {
      categoryForm.model = 'category'
      categoryForm.code = uuid.v4()
      const res = await CreateRecord(categoryForm)

      var cat = {}
      cat.value = res.data.id
      cat.label = res.data.category

      categoryOptions.value.push(cat)


      // Handle the response here
    } else {
      console.log('error categoryForm!', fields)
    }
  })
}





const handleCloseCategory = () => {
  AddCategoryVisible.value = false
}


const handleCancelAddEdit = () => {
  ruleForm.activity_id = null
  editingMode.value = false
  activeStep.value = 0
  AddDialogVisible.value = false
}



// Add new Indicators  
//---------------------------------------------------
const indicatorFormRef = ref<FormInstance>()
const indicatorForm = reactive({
  name: '',
  type: '',
  unit: '',
  level: '',
  format: '',
  activity_id: '',
 
  desc: '',
})

const IndicatorRules = reactive({

  name: [
    { required: true, message: 'Please provide indicator name', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }
  ],
  type: [
    { required: true, message: 'Indicator type is required', trigger: 'blur' }],

  activity_id: [
    { required: true, message: 'Activity is required', trigger: 'blur' }],


  format: [
    { required: true, message: 'Indicator Formatt is required', trigger: 'blur' }],

  level: [
    { required: true, message: 'The  level is required', trigger: 'blur' }
  ]
})
const AddNewIndicatorVisible = ref(false)
const AddIndicator = () => {
  console.log('adding....')
  AddNewIndicatorVisible.value = true
}

const submitIndicatorForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => { // Make the callback function async
    if (valid) {
      indicatorForm.model = 'indicator'
      indicatorForm.code = uuid.v4()
      const res = await CreateRecord(indicatorForm)
      console.log(res.data)
      var ind = {}
      ind.value = res.data.id
      ind.label = res.data.name

      // Add to both the main indicators list and filtered list
      indicatorsOptions.value.push(ind)
      indicatorsOptionsFiltered.value.push(ind)
      
      // Close the dialog
      AddNewIndicatorVisible.value = false
      
      console.log('New indicator added:', ind)
    } else {
      console.log('error indicatorForm!', fields)
    }
  })
}

const handleCloseIndicator = () => {
  AddCategoryVisible.value = false
}




// Add new Activities
//---------------------------------------------------
const AddFrequencyVisible = ref(false)
const freqFormRef = ref<FormInstance>()
const freqForm = reactive({
  frequency: '',
})

const freqRules = reactive({

  frequency: [
    { required: true, message: 'Please provide frequency', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }
  ],

})


const AddNewFreq = () => {
  console.log('adding....')
  AddFrequencyVisible.value = true

  // get this activtys project
  const thisProject = projectList.value.filter(function (el) {
    return el.id == ruleForm.activity_id
  });

  console.log('thisProject', thisProject[0])

}

const submitFreqForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => { // Make the callback function async
    if (valid) {
      freqForm.model = 'frequency'
      freqForm.code = uuid.v4()
      const res = await CreateRecord(freqForm)
      console.log(res.data)
      var act = {}
      act.value = res.data.id
      act.label = res.data.frequency

      frequencyOptions.value.push(act)
    } else {
      console.log('error categoryForm!', fields)
    }
  })
 
}

const handleCloseFreq = () => {
  AddFrequencyVisible.value = false

}

const openHelp = ref()
const openIndicatorHelp = ref()

const ref2 = ref<ButtonInstance>()
const ref3 = ref<ButtonInstance>()
const ref4 = ref<ButtonInstance>()
const ref5 = ref<ButtonInstance>()
const ref6 = ref<ButtonInstance>()



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

 



const handleSwitchChange = async (value) => {
  console.log('Indicator level changed to:', value)

  if (value=='project') {
         console.log('Switch is inactive - showing project level indicators'); 
        const sel_indicators = await getProjectActivityIndicators(undefined)
          const transformedArray = sel_indicators.map(item => {
          return {
            label: item.name,
            value: item.id
          };
          });
          indicatorsOptionsFiltered.value =transformedArray 
          ruleForm.activity_id=null
        // Add your custom logic here
      } else {
        // The switch is active (set to 'Activity Level Indicator')
        console.log('Switch is active - activity level indicators will be shown when activity is selected');
        // Clear indicators until an activity is selected
        indicatorsOptionsFiltered.value = []
      }
}




const indicatorLevels = [
        { value: 'project', label: 'Project' },
        { value: 'activity', label: 'Activity' },
       ]









</script>
<template>
  <el-card class="indicator-category-page-card">
    <div
      class="sett-toolbar-row"
      :class="isMobile ? 'sett-toolbar-row--compact' : 'sett-toolbar-row--wide'"
    >
      <div class="sett-toolbar-col sett-toolbar-col--back">
        <el-button type="primary" plain :icon="Back" @click="goBack" size="small">
          Back
        </el-button>
      </div>

      <div class="sett-toolbar-col sett-toolbar-col--search indicator-category-filters">
        <el-select
          v-model="value2"
          :onChange="handleSelectIndicator"
          :onClear="handleClear"
          multiple
          clearable
          filterable
          collapse-tags
          placeholder="Filter by Indicator"
          style="width: 100%;"
          :filter-method="filterIndicators"
          :loading="searchLoading"
        >
          <el-option v-for="item in indicatorsOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>

        <el-select
          v-model="value3"
          :onChange="handleSelectCategory"
          :onClear="handleClear"
          multiple
          clearable
          filterable
          collapse-tags
          placeholder="Filter by Category"
          style="width: 100%;"
          :filter-method="filterCategories"
          :loading="searchLoading"
        >
          <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>

      <div class="sett-toolbar-col sett-toolbar-col--actions">
        <div class="sett-toolbar-actions" :class="{ 'sett-toolbar-actions--desktop': !isMobile }">
          <PermissionWrapper :permissions="['indicator:create']">
            <el-tooltip content="Add Indicator Configuration" placement="top">
              <el-button @click="AddIndicatorConfig" type="primary" :icon="Plus" />
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

          <PermissionWrapper :permissions="['indicator:read']">
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



    <div class="indicator-category-table-wrap">
      <el-table
        fit
        table-layout="fixed"
        :data="tableDataList"
        :loading="loading"
        :show-overflow-tooltip="true"
        class="indicator-category-table"
        style="width: 100%; margin-top: 10px;"
        border
        row-key="id"
        @header-dragend="onHeaderDragend"
      >
        <el-table-column
          v-if="isColumnVisible('id')"
          column-key="id"
          label="Id"
          prop="id"
          :width="idColumnWidth()"
          :min-width="columnMinWidth('id')"
          sortable
          resizable
        >
          <template #default="{ row }">
            <span>{{ row.id }}</span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="isColumnVisible('activity')"
          column-key="activity"
          label="Activity"
          prop="activity.title"
          class-name="indicator-category-col-equal"
          :min-width="flexColumnMinWidth('activity')"
          sortable
          resizable
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span>{{ getRowActivityLabel(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="isColumnVisible('indicator')"
          column-key="indicator"
          label="Indicator"
          prop="indicator.name"
          class-name="indicator-category-col-equal"
          :min-width="flexColumnMinWidth('indicator')"
          sortable
          resizable
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span>{{ getRowIndicatorLabel(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="isColumnVisible('dimension')"
          column-key="dimension"
          label="Dimension"
          prop="category_title"
          :min-width="flexColumnMinWidth('dimension')"
          sortable
          resizable
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span>{{ getRowDimensionLabel(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="isColumnVisible('location')"
          column-key="location"
          label="Location"
          prop="project_location.location_name"
          :min-width="flexColumnMinWidth('location')"
          sortable
          resizable
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span>{{ getRowLocationLabel(row) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Actions" :width="actionColumnWidth">
          <template #default="{ row }">
            <PermissionWrapper :permissions="['indicator:update', 'indicator:delete']">
              <TableActions :item="row" :buttons="action_buttons" @edit="editIndicator" @delete="DeleteIndicator" />
            </PermissionWrapper>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <ElPagination
      :layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'"
      v-model:currentPage="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 15, 20, 50, 100]"
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
    <el-steps :active="activeStep" align-center finish-status="success" class="indicator-category-drawer-steps">
      <el-step title="Indicator setup" description="Level, activity & indicator" />
      <el-step title="Reporting" description="Category & frequency" />
    </el-steps>

    <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-position="top">
      <template v-if="activeStep === 0">
        <el-form-item id="btn1" label="Indicator level" prop="indicator_level">
          <el-select
            ref="ref1"
            filterable
            v-model="ruleForm.indicator_level"
            :onChange="handleSwitchChange"
            placeholder="Select level"
            style="width: 100%;"
          >
            <el-option
              v-for="item in indicatorLevels"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <p class="field-hint">Project level applies across the whole project; Activity level ties reporting to one implementation activity.</p>
        </el-form-item>

        <el-form-item v-if="ruleForm.indicator_level == 'activity'" id="btn2" label="Activity" prop="activity_id">
          <el-select
            ref="ref3"
            filterable
            v-model="ruleForm.activity_id"
            :onChange="changeActivity"
            placeholder="Select activity"
            style="width: 100%;"
          >
            <el-option
              v-for="item in activityOptionsFiltered"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <p class="field-hint">The work package this indicator tracks. Field teams see the activity <strong>short title</strong> on SlumMapper mobile.</p>
        </el-form-item>

        <el-form-item id="btn3" label="Indicator" prop="indicator_id">
          <div class="form-inline-add">
            <el-select
              ref="ref4"
              filterable
              v-model="ruleForm.indicator_id"
              :onChange="changeIndicator"
              placeholder="Select indicator"
              style="width: 100%;"
            >
              <el-option
                v-for="item in indicatorsOptionsFiltered"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-button type="primary" @click="AddIndicator" :icon="Plus" plain />
          </div>
          <p v-if="ruleForm.indicator_level === 'activity' && !ruleForm.activity_id" class="field-hint">
            Select an activity first to see its indicators.
          </p>
          <p v-else class="field-hint">What is being measured (e.g. Beneficiaries reached). Use <strong>+</strong> to create a new indicator.</p>
        </el-form-item>
      </template>

      <template v-else>
        <el-form-item id="btn4" label="Category" prop="category_id">
          <div class="form-inline-add">
            <el-select
              v-model="ruleForm.category_id"
              :onChange="changeCategory"
              filterable
              placeholder="Select category"
              style="width: 100%;"
            >
              <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-button type="primary" @click="AddCategory" :icon="Plus" plain />
          </div>
          <p class="field-hint">Reporting dimension on mobile — e.g. <em>Male/Female</em>, <em>Trained/Untrained</em>, or <em>Prepared/Approved</em>.</p>
        </el-form-item>

        <el-form-item id="btn5" label="Frequency" prop="frequency">
          <div class="form-inline-add">
            <el-select v-model="ruleForm.frequency" placeholder="Select frequency" style="width: 100%;">
              <el-option v-for="item in frequencyOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-button type="primary" @click="AddNewFreq" :icon="Plus" plain />
          </div>
          <p class="field-hint">How often values are reported (e.g. Monthly, Quarterly).</p>
        </el-form-item>
      </template>
    </el-form>

    <template #footer>
      <div class="drawer-footer-bar">
        <el-button type="primary" plain @click="openHelp = true">Help</el-button>
        <el-button @click="handleCancelAddEdit">Cancel</el-button>
        <el-button v-if="activeStep > 0" @click="prevStep">Previous</el-button>
        <el-button v-if="activeStep < 1" type="primary" @click="nextStep">Next</el-button>
        <el-button id="btn10" v-if="showSubmitBtn && activeStep === 1" type="primary" @click="submitForm(ruleFormRef)">Submit</el-button>
        <el-button id="btn11" v-if="showEditSaveButton && activeStep === 1" type="primary" @click="editForm(ruleFormRef)">Save</el-button>
      </div>
    </template>
  </el-drawer>


  <el-dialog v-model="AddCategoryVisible" @close="handleCloseCategory" title="Add Category" width="30%" draggable>
    <el-form ref="categoryFormRef" :model="categoryForm" :rules="categoryRules" label-width="120px">
      <el-form-item label="Title" prop="category">
        <el-input v-model="categoryForm.category" />
      </el-form-item>

    </el-form>
    <template #footer>

      <span class="dialog-footer">
        <el-button @click="AddCategoryVisible = false">Cancel</el-button>
        <el-button type="primary" @click="submitCategoryForm(categoryFormRef)">Submit</el-button>
      </span>
    </template>
  </el-dialog>



  <el-dialog
v-model="AddNewIndicatorVisible" @close="handleCloseIndicator" title="Add Indicator" :width="dialogWidth"
    draggable>
    <el-form ref="indicatorFormRef" :model="indicatorForm" :rules="IndicatorRules" label-width="120px">

      <el-form-item id="indicator-btn1" label="Activity" prop="activity_id">
        <el-select filterable v-model="indicatorForm.activity_id" placeholder="Select Activity" style="width: 100%">
          <el-option v-for="item in activityOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <el-form-item id="indicator-btn2" label="Title" prop="name">
        <el-input v-model="indicatorForm.name" placeholder="Enter indicator title" />
      </el-form-item>
      <el-form-item id="indicator-btn3" label="Type" prop="type">
        <el-select v-model="indicatorForm.type" placeholder="Type" style="width: 100%">
          <el-option label="Output" value="output" />
          <el-option label="Impact" value="outcome" />
        </el-select>
      </el-form-item>
      <el-form-item id="indicator-btn4" label="Format" prop="format">
        <el-select v-model="indicatorForm.format" placeholder="Format" style="width: 100%">
          <el-option label="Number" value="number" />
          <el-option label="Percent" value="percent" />
        </el-select>
      </el-form-item>

      <el-form-item id="indicator-btn5" label="Level" prop="level">
        <el-select v-model="indicatorForm.level" placeholder="Level" style="width: 100%">
          <el-option label="Settlement" value="Settlement" />
          <el-option label="County" value="County" />
          <el-option label="National" value="National" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>

      <span class="dialog-footer">
        <el-button type="primary" plain @click="openIndicatorHelp = true">Help</el-button>
        <el-button @click="AddNewIndicatorVisible = false">Cancel</el-button>
        <el-button type="primary" @click="submitIndicatorForm(indicatorFormRef)">Submit</el-button>
      </span>
    </template>
  </el-dialog>




  <el-dialog v-model="AddFrequencyVisible" @close="handleCloseFreq" :title="formHeader" :width="dialogWidth" draggable>
    <el-form ref="freqFormRef" :model="freqForm" :rules="freqRules">
      <el-form-item prop="frequency">
        <el-input v-model="freqForm.frequency" :style="{ width: '100%' }" placeholder="Enter frequency" />
      </el-form-item>
    </el-form>
    <template #footer>

      <span class="dialog-footer">
        <el-button @click="AddFrequencyVisible = false">Cancel</el-button>
        <el-button type="primary" @click="submitFreqForm(freqFormRef)">Save</el-button>
      </span>
    </template>
  </el-dialog>


  <el-tour v-model="openHelp" z-index="100000">
    <el-tour-step target="#btn1" title="Indicator Level" description="Select the level at which this indicator will be measured - either at Project level or Activity level" />
    
    <el-tour-step
target="#btn2" title="Activity"
      description="Select the specific activity you wish to configure monitoring for. This field only appears when 'Activity' level is selected" />
      
    <el-tour-step
target="#btn3" title="Indicator"
      description="Select the indicator associated with the activity. If not configured, use the + button to create a new indicator" />

    <el-tour-step
target="#btn4" title="Category"
      description="Specify the dimension/aspect that you want measured (e.g., Male/Female, Prepared/Approved). If not configured, use the + button to create a new category" />

    <el-tour-step
target="#btn5" title="Frequency"
      description="How frequently will this indicator be monitored? If not configured, use the + button to create a new frequency" />

  </el-tour>

  <el-tour v-model="openIndicatorHelp" z-index="100000">
    <el-tour-step target="#indicator-btn1" title="Activity" description="Select the activity this indicator will be associated with" />
    
    <el-tour-step target="#indicator-btn2" title="Title" description="Enter a descriptive title for the indicator (e.g., 'Number of beneficiaries reached')" />
    
    <el-tour-step target="#indicator-btn3" title="Type" description="Select whether this is an Output indicator (immediate results) or Impact indicator (long-term outcomes)" />
    
    <el-tour-step target="#indicator-btn4" title="Format" description="Choose how the indicator will be measured - as a Number or Percentage" />
    
    <el-tour-step target="#indicator-btn5" title="Level" description="Select the geographic level for this indicator - Settlement, County, or National" />

  </el-tour>

</template>

<style scoped>
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

.sett-toolbar-row--wide .sett-toolbar-col--search {
  flex: 1 1 0;
  min-width: 160px;
  max-width: 520px;
}

.sett-toolbar-row--wide .sett-toolbar-col--actions {
  flex: 1 1 auto;
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

.indicator-category-filters {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

@media (min-width: 900px) {
  .indicator-category-filters {
    flex-direction: row;
  }
}

.indicator-category-page-card {
  width: 100%;
}

.indicator-category-page-card :deep(.el-card__body) {
  width: 100%;
}

.indicator-category-table-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.indicator-category-table-wrap :deep(.indicator-category-table),
.indicator-category-table-wrap :deep(.el-table__inner-wrapper),
.indicator-category-table-wrap :deep(.el-table__header-wrapper),
.indicator-category-table-wrap :deep(.el-table__body-wrapper) {
  width: 100% !important;
}

.indicator-category-table-wrap :deep(.el-table__header colgroup col),
.indicator-category-table-wrap :deep(.el-table__body colgroup col) {
  min-width: 0;
}

.indicator-category-table-wrap :deep(.el-table__header table),
.indicator-category-table-wrap :deep(.el-table__body table) {
  width: 100% !important;
  table-layout: fixed;
}

.indicator-category-table-wrap :deep(.el-table__empty-block) {
  width: 100% !important;
}

.drawer-footer-bar {
  padding: 12px 20px;
  border-top: 1px solid var(--el-border-color);
  text-align: right;
}

.indicator-category-drawer-steps {
  margin-bottom: 20px;
}

.field-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.45;
}

.field-hint strong {
  font-weight: 600;
}

.form-inline-add {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.form-inline-add .el-select {
  flex: 1 1 auto;
  min-width: 0;
}

.form-inline-add .el-button {
  flex-shrink: 0;
}
</style>
