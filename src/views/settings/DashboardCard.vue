<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { ElButton, ElSelect, ElColorPicker, ElCard, ElPopconfirm } from 'element-plus'
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

import { ref, reactive, computed } from 'vue'
import {
  ElPagination, ElCol, ElTooltip, ElOption, ElDialog, ElForm, ElFormItem, ElInput, FormRules, ElRow,
  ElTable, ElSwitch, ElTableColumn, ElStep, ElSteps, ElSelectV2
} from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord } from '@/api/settlements'
import { getUniqueFieldValues } from '@/api/households'
import { uuid } from 'vue-uuid'
import type { FormInstance } from 'element-plus'

import { getModelSpecs, } from '@/api/fields'

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


console.log("userInfo--->", userInfo)

const showAdminButtons = ref(appStore.getAdminButtons)


const showStatusExtras = ref(false)
const ModelOptions = [
  {
    value: 'settlement',
    label: 'Settlement'
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
const indicatorsOptions = ref([])
const componentOptions = ref([])
const categories = ref([])
const filteredIndicators = ref([])
const page = ref(1)
const pSize = ref(5)
const selCounties = []
const loading = ref(true)
const pageSize = ref(5)
const currentPage = ref(1)
const total = ref(0)
const downloadLoading = ref(false)




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


const getFilteredData = async (selFilters, selfilterValues) => {
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
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('After Querry', res)
  tableDataList.value = res.data
  total.value = res.total
  loading.value = false

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

    loading.value = false
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
    countyOpt.label = arrayItem.title + '(' + arrayItem.id + ')'
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
      curUser: 1, // Id for logged in user
      model: 'dashboard',
      searchField: 'title',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    var ret = response.data

    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var opt = {}
      opt.value = arrayItem.id
      opt.label = arrayItem.title + '(' + arrayItem.id + ')'
      opt.type = arrayItem.type
      //  console.log(countyOpt)
      DashboardOptions.value.push(opt)
    })
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

    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var countyOpt = {}
      countyOpt.value = arrayItem.id
      countyOpt.label = arrayItem.title + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      strategicFocusOptions.value.push(countyOpt)
    })
  })
}

const editIndicator = async (data: TableSlotDefault) => {
  showSubmitBtn.value = false
  console.log('Edit--->', data)
  ruleForm.card_model = data.row.card_model





  await handleSelectModel(data.row.card_model)
  if (data.row.filter_field) {
    await handleFilterAggregators(data.row.filter_field)
  }




  showEditSaveButton.value = true

  ruleForm.id = data.row.id
  ruleForm.title = data.row.title
  ruleForm.dashboard_id = data.row.dashboard_id
  ruleForm.description = data.row.description
  ruleForm.iconColor = data.row.iconColor
  ruleForm.icon = data.row.icon
  ruleForm.aggregation = data.row.aggregation
  ruleForm.indicator_id = data.row.indicator_id
  ruleForm.card_model_field = data.row.card_model_field
  ruleForm.filter_value = data.row.filter_value
  ruleForm.computation = data.row.computation
  ruleForm.filter_function = data.row.filter_function
  ruleForm.filter_field = data.row.filter_field
  ruleForm.filtered = data.row.filtered
  ruleForm.unique = data.row.unique
  ruleForm.filters = data.row.filters
  tableData.value = data.row.filters ?? [];
  ruleForm.category = data.row.category


  console.log('Edit Mode', data.row)




  if (data.row.filter_value) {
    fieldSelected.value = true
    showFilterValues.value = true
  } else {
    fieldSelected.value = false

  }

  //fieldSelected.value && showFilterValues && ruleForm.filtered

  showStatusExtras.value = true


  //  if (data.row.dashboard.type=='status') {
  //    showStatusExtras.value = true
  //    fieldSelected.value=true
  //  } else {
  //   showStatusExtras.value=false

  // }



  formHeader.value = 'Edit Card'


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
  indicator_id: null,
  card_model_field: '',
  filter_value: null,
  filter_function: null,
  filter_field: null,
  filtered: null,
  card_model: '',
  computation: null,
  unique: false,
  filters: null,
  category: ''



})
const handleClose = () => {

  console.log("Clsoing the dialoig")
  showSubmitBtn.value = true
  showEditSaveButton.value = false

  ruleForm.id = ''
  ruleForm.category = ''
  formHeader.value = 'Add Card'
  activeStep.value = 0
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
  indicator_id: [
    { required: true, message: 'Indicator is required.', trigger: 'blur' },
  ],

  computation: [
    { required: true, message: 'computation is required.', trigger: 'blur' },
  ]



})

const AddCard = () => {
  AddDialogVisible.value = true
}


const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      ruleForm.model = model
      ruleForm.code = uuid.v4()
      const res = CreateRecord(ruleForm)

    } else {
      console.log('error submit!', fields)
    }
  })
}


const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      ruleForm.model = model

      updateOneRecord(ruleForm).then(() => { })

      // dialogFormVisible.value = false


    } else {
      console.log('error submit!', fields)
    }
  })
}




//getIndicatorOptions()
getInterventionsAll()
getDashboardOptions()
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
  ruleForm.category = ''


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
  console.log('Filter Fields 2:', res.data)


  res.data.forEach(function (arrayItem: {}) {
    var opt = {}
    console.log(arrayItem)
    opt.value = arrayItem
    opt.label = arrayItem
    // opt.title = arrayItem.category.title

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


  ruleForm.card_model = data.row.card_model


  await handleSelectModel(data.row.card_model)
  if (data.row.filter_field) {
    await handleFilterAggregators(data.row.filter_field)
  }


  ruleForm.title = data.row.title
  ruleForm.dashboard_id = data.row.dashboard_id
  ruleForm.description = data.row.description
  ruleForm.iconColor = data.row.iconColor
  ruleForm.icon = data.row.icon
  ruleForm.aggregation = data.row.aggregation
  ruleForm.indicator_id = data.row.indicator_id
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
  console.log('Filter Fields 2:', res.data)

  // Flatten all levels of nested arrays
  const flattenedData = res.data.flat(Infinity);
  console.log('Flattened Data:', flattenedData);


  flattenedData.forEach(function (arrayItem: {}) {
    var opt = {}
    console.log(arrayItem)
    opt.value = arrayItem
    opt.label = arrayItem
    // opt.title = arrayItem.category.title

    //fieldOptions.value.push(opt)

    // Check if an item with the same value or label already exists
    const exists = fieldOptions.value.some((existingItem) => {
      return existingItem.value === opt.value || existingItem.label === opt.label;
    });

    // If the item doesn't exist, push it into the array
    if (!exists) {
      fieldOptions.value.push(opt);
    }


  })

}


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
const nextStep = async () => {
  //console.log(ruleFormRef.value)
  await ruleFormRef.value?.validate((valid) => {
    if (valid) {
      if (activeStep.value < 4) {
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
v-model="value3" :onChange="handleSelectDashboard" :onClear="handleClear" multiple clearable filterable
        collapse-tags placeholder="Filter by Dashboard" style="width: 45%; margin-right: 10px;">
        <el-option v-for="item in DashboardOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>



      <!-- Action Buttons -->
      <div style="display: flex; align-items: center; gap: 10px; margin-right: 10px;">

        <el-tooltip content="Add Card" placement="top">
          <el-button :onClick="AddCard" type="primary" :icon="Plus" />
        </el-tooltip>

        <el-tooltip content="Download" placement="top">
          <el-button :onClick="handleDownload" type="primary" :icon="Download" />
        </el-tooltip>

        <el-tooltip content="Clear" placement="top">
          <el-button :onClick="handleClear" type="primary" :icon="Filter" />
        </el-tooltip>


      </div>

      <!-- Download All Component -->
    </el-row> 

    
    <el-table :data="cards_filtered" stripe>
      <el-table-column type="index" />
      <el-table-column prop="title" label="Title" />
      <el-table-column prop="dashboard.title" label="Dashboard" />
      <el-table-column prop="icon" label="Icon" />
      <el-table-column label="Operations">
        <template #header>
          <el-input v-model="searchKey" size="small" placeholder="Filter" />
        </template>
        <template #default="scope">
          <el-tooltip content="Edit" placement="top">
            <el-button
size="small" type="success" :icon="Edit" @click="editIndicator(scope as TableSlotDefault)"
              plain />
          </el-tooltip>
          <el-tooltip content="Clone" placement="top">
            <el-button
size="small" type="warning" :icon="CopyDocument" @click="CloneCard(scope as TableSlotDefault)"
              plain />
          </el-tooltip>
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
        </template>
      </el-table-column>
    </el-table>


  <ElPagination
layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
      v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 200, 10000]" :total="total" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
  </el-card>

  <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formHeader" width="40%">
    <el-steps :active="activeStep" align-center finish-status="success" style="margin-bottom: 20px;">
      <el-step title="Details" />
      <el-step title="Icons" />
      <el-step title="Computation" />
    </el-steps>

    <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="100px" label-position="top">
      <el-row v-if="activeStep == 0" :gutter="20">
        <el-col :span="24">
          <el-form-item label="Dashboard" prop="dashboard_id">
            <el-select v-model="ruleForm.dashboard_id" filterable placeholder="Select" :onChange="handleSelectType">
              <el-option v-for="item in DashboardOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="Title" prop="title">
            <el-input v-model="ruleForm.title" />
          </el-form-item>
          <el-form-item label="Description" prop="description">
            <el-input v-model="ruleForm.description" />
          </el-form-item>
        </el-col>
      </el-row>


      <el-row v-if="activeStep === 1" :gutter="20">
        <el-col :span="18">

          <el-form-item label="Icon" prop="icon">
            <el-tooltip content="Get icons from https://icon-sets.iconify.design/" placement="top">
              <el-input v-model="ruleForm.icon" />
            </el-tooltip>
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="Icon Color" prop="iconColor">
            <el-color-picker v-model="ruleForm.iconColor" />
          </el-form-item>

        </el-col>
      </el-row>

      <el-row v-if="activeStep === 2" :gutter="20">
        <el-col :span="12">

          <el-form-item label="Category" prop="category">
            <el-select v-model="ruleForm.category" filterable placeholder="Select" :onChange="handleSelectType">
              <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-button plain style="margin-left: 5px" :icon="InfoFilled" @click="infoDialog = true" />
          </el-form-item>
          <el-form-item label="Agg.Field" prop="card_model_field">
            <el-select
v-model="ruleForm.card_model_field" :onClear="handleClear" clearable filterable collapse-tags
              placeholder="Field to summarize">
              <el-option v-for="item in fieldSet" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="Type" prop="card_model">
            <el-select
v-model="ruleForm.card_model" :onClear="handleClear" clearable filterable collapse-tags
              :onChange="handleSelectModel" placeholder="Select Entity to summarize">
              <el-option v-for="item in ModelOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>

          <el-form-item label="Aggregation" prop="aggregation">
            <el-select
size="default" v-model="ruleForm.aggregation" :onClear="handleClear" style="width: 90%" clearable
              filterable collapse-tags placeholder="Select">
              <el-option
v-for="item in aggregationOptionsFiltered" :key="item.value" :label="item.label"
                :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row> 

      <el-row v-if="activeStep === 3" :gutter="20">
        <el-col :span="24">
          <el-form-item label="Computation" prop="computation" class="mt-4">
            <el-select
size="default" v-model="ruleForm.computation" :onClear="handleClear" clearable filterable
              collapse-tags placeholder="Select">
              <el-option label="Proportion(%)" value="proportion" />
              <el-option label="Absolute" value="absolute" /> </el-select>
          </el-form-item>
          <el-form-item label="Filter" prop="filtered" v-if="ruleForm.card_model" class="mt-4">
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
          <el-row>
            <el-button-group>
              <el-button v-if="ruleForm.filtered" class="mt-4" style="width: 45%" @click="onAddItem" size="small">
                Add Filter
              </el-button>
              <el-button v-if="ruleForm.filtered" class="mt-4" style="width: 45%" @click="onAddFilter" size="small">
                Save Filters
              </el-button>
            </el-button-group>
          </el-row>
        </el-col>

      </el-row>

    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-row :gutter="5">
          <el-col :span="24">
            <!-- <el-button type="primary" plain @click="openHelp = true">Help</el-button> -->
            <el-button @click="prevStep" :disabled="activeStep === 0">Previous</el-button>

            <el-button @click="nextStep" v-if="activeStep < 3">Next</el-button>
            <el-button @click="AddDialogVisible = false">Cancel</el-button>
            <el-button
v-if="showSubmitBtn && activeStep === 3" type="primary"
              @click="submitForm(ruleFormRef)">Submit</el-button>
            <el-button
v-if="showEditSaveButton && activeStep === 3" type="primary"
              @click="editForm(ruleFormRef)">Save</el-button>
          </el-col>
        </el-row>
      </span>
    </template>


  </el-dialog>












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