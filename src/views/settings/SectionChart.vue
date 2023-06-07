<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { ElButton, ElSelect, ElColorPicker } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Position,
  TopRight,
  User,
  Plus,
  Download,
  Filter,
  MessageBox,
  Edit,
  InfoFilled,
  Delete
} from '@element-plus/icons-vue'

import { ref, reactive } from 'vue'
import { ElPagination, ElTooltip, ElOption, ElDivider, ElDialog, ElForm, ElFormItem, ElInput, FormRules,ElCheckbox, ElPopconfirm } from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import type { FormInstance } from 'element-plus'
import { getModelSpecs, getModelRelatives } from '@/api/fields'


const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


console.log("userInfo--->", userInfo)







const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
var value4 = ref([])

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
const showAdminButtons = ref(false)

// flag for admin buttons
if (userInfo.roles.includes("admin") || userInfo.roles.includes("kisip_staff")) {
  showAdminButtons.value = true
}


console.log("Show Buttons -->", showAdminButtons)



const showStatusExtras =ref(false)
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

aggregationOptionsFiltered.value=aggregationOptions




let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var filterValues = []
var tblData = []
const associated_Model = ''
const associated_multiple_models = ['dashboard_section', 'indicator']
const nested = ['dashboard_section','dashboard' ]

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


const handleSelectDashboardSection = async (indicator: any) => {
  var selectOption = 'dashboard_section_id'
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
  formData.nested_models = nested

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('After cards', res)
  tableDataList.value = res.data
  total.value = res.total

  tblData = [] // reset the table data
  console.log('TBL-b4', tblData)
  res.data.forEach(function (arrayItem) {
    //  console.log(countyOpt)
    // delete arrayItem[associated_Model]['geom'] //  remove the geometry column

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


const DashBoardOptions = ref([])
const selectDashboard = ref()

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
      //  console.log(countyOpt)
      opt.type = arrayItem.type

      DashBoardOptions.value.push(opt)
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

    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var opt = {}
      opt.value = arrayItem.id
      opt.label = arrayItem.title + '(' + arrayItem.id + ')'
      opt.dashboard_id = arrayItem.dashboard_id

      //  console.log(countyOpt)
      DashBoardSectionOptions.value.push(opt)
      DashBoardSectionFilterdOptions.value.push(opt)
      
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

const editIndicator = (data: TableSlotDefault) => {
  showSubmitBtn.value = false
  showEditSaveButton.value = true
  console.log('Editing', data)
  ruleForm.id = data.row.id
  ruleForm.title = data.row.title
  ruleForm.dashboard_section_id = data.row.dashboard_section_id
  ruleForm.description = data.row.description
  ruleForm.iconColor = data.row.iconColor
  ruleForm.icon = data.row.icon
  ruleForm.aggregation = data.row.aggregation
  ruleForm.type = data.row.type
  value4.value =  data.row.dashboard_section.dashboard.id

  let indicators =[]
  data.row.indicators.forEach(function (arrayItem) {
    indicators.push(arrayItem.id)
  })

  ruleForm.indicator_id = indicators

  ruleForm.card_model = data.row.card_model
  ruleForm.card_model_field = data.row.card_model_field
  ruleForm.categorized = data.row.categorized

   if (data.row.dashboard_section.dashboard.type==='status') {
    showStatusExtras.value=true
   } else {
    showStatusExtras.value=false

  }


  if ( data.row.card_model==="households") {
    
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
            label: 'Stacked Bar'
          },

          {
            value: 5,
            label: 'Line Chart'
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
            value: 4,
            label: 'Stacked Bar'
          },

          {
            value: 5,
            label: 'Line Chart'
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


  formHeader.value = 'Edit Section'


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
  dashboard_section_id: '',
  dashboard_id: '',
  description: '',
  iconColor: '',
  icon: '',
  aggregation: '',
  type: '',
  indicator_id: '',
  card_model_field: '',
  card_model:'',
  categorized: false,



})
const handleClose = () => {

  console.log("Clsoing the dialoig")
  showSubmitBtn.value = true
  showEditSaveButton.value = false


  formHeader.value = 'Add Section'

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
    { required: true, message: 'Aggregation method is required', trigger: 'blur' }, ],


    type: [
    { required: true, message: 'Chart Type   is required', trigger: 'blur' }, ],
    

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

const IndicatorCategoryOptions = ref([])
 

const getIndicatorCategories = async ( ) => {
  const formData = {}
  //formData.limit = pSize.value
  //formData.page = page.value
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
  formData.associated_multiple_models = ['activity' ]

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)
 
  res.data.forEach(function (arrayItem) {
     console.log(arrayItem)
    // delete arrayItem[associated_Model]['geom'] //  remove the geometry column

    var opt = {}
      opt.value = arrayItem.id
     // opt.label = arrayItem.indicator_name + '(' + arrayItem.id + ')' + '|' + arrayItem.project.title 
      opt.label = arrayItem.name + '(' + arrayItem.id + ')' + '|' + arrayItem.activity.title 
    IndicatorCategoryOptions.value.push(opt)

  })

  console.log('TBL-4f', tblData)
}



getIndicatorOptions()
getInterventionsAll()
getDashboardOptions()
getDashSectionOptions()

getStrategicFocusAreas()
getIndicatorCategories()



const handleFilterSections = async (dashboard_id) => {
  console.log('filtreing teh aggregators.....', dashboard_id)
  let selDashboard = DashBoardOptions.value.filter(item => item.value === dashboard_id);

  if (selDashboard[0].type==='status') {  // status dashabords 
showStatusExtras.value=true
  } else {
    showStatusExtras.value=false

  }
    
     DashBoardSectionFilterdOptions.value = DashBoardSectionOptions.value.filter(option => option.dashboard_id  == dashboard_id);
   
 }


 const fieldSet = ref([])
const getModeldefinition = async (selModel) => {
console.log(selModel)
var formData = {}
formData.model = selModel


await getModelSpecs(formData).then((response) => {

  var data = response.data

  var fieldsToFilter = ['title', 'name', 'geom', 'code','createdBy','updatedAt',"description",'createdAt']; // Specify the fields you want to filter out

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

console.log("getting fields fields",fieldSet.value)


}


const chartOptions = ref([])

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
            label: 'Stacked Bar'
          },

          {
            value: 5,
            label: 'Line Chart'
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
 const handleSelectModel = async (selModel) => {
  console.log('specs.....')
  getModeldefinition(selModel)

  if (selModel==="households") {
    
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
            label: 'Stacked Bar'
          },

          {
            value: 5,
            label: 'Line Chart'
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
            value: 4,
            label: 'Stacked Bar'
          },

          {
            value: 5,
            label: 'Line Chart'
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

 
const handleFilterAggregators = async (selModel) => {
   console.log('filtreing teh aggregators.....',selModel )
  
   
   let selectedField = fieldSet.value.filter(option => option.value  == selModel);
   console.log('selectedField', selectedField[0].type)
  let selFieldType = selectedField[0].type

   if (selFieldType==="STRING") {
    aggregationOptionsFiltered.value = aggregationOptions.filter(option => option.value === 'count');

   } else {
    aggregationOptionsFiltered.value =aggregationOptions
  }


 }
</script>

<template>
  <ContentWrap :title="t('Dashboard Section Charts')" :message="t('Use the filters to subset')">
    <el-divider border-style="dashed" content-position="left">Filters</el-divider>

    

    <div style="display: inline-block; margin-left: 20px">
      <el-select
v-model="value3" :onChange="handleSelectDashboardSection" :onClear="handleClear" multiple clearable
        filterable collapse-tags placeholder="Search Dashboard Section">
        <el-option v-for="item in DashBoardSectionOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>



    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="handleDownload" type="primary" :icon="Download" />
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="handleClear" type="primary" :icon="Filter" />
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-tooltip content="Add Chart" placement="top">
        <el-button :onClick="AddCard" type="primary" :icon="Plus" />
      </el-tooltip>
    </div>

    <el-divider border-style="dashed" content-position="left">Results</el-divider>

    <Table
:columns="columns" :data="tableDataList" :loading="loading" :selection="true" :pageSize="pageSize"
      :currentPage="currentPage">
      <template #action="data">
        <el-tooltip content="Edit" placement="top">
          <el-button type="success" :icon="Edit" @click="editIndicator(data as TableSlotDefault)" circle />
        </el-tooltip>

        <el-tooltip content="Delete" placement="top">
          <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
            title="Are you sure to delete this record?" @confirm="DeleteIndicator(data as TableSlotDefault)">
            <template #reference>
              <el-button v-if="showAdminButtons" type="danger" :icon="Delete" circle />
            </template>
          </el-popconfirm>
        </el-tooltip>

      </template>
    </Table>
    <ElPagination
layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage" v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 50, 200, 10000]" :total="total" :background="true" @size-change="onPageSizeChange"
      @current-change="onPageChange" class="mt-4" />
  </ContentWrap>

  <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formHeader" width="40%" draggable>
    <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="150px">


      <el-form-item label="Dashboard" prop="dashboard_id" >
        <el-select v-model="ruleForm.dashboard_id" filterable placeholder="Select" :onChange="handleFilterSections">
          <el-option v-for="item in DashBoardOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>  


      <el-form-item label="Dashboard Section" prop="dashboard_section_id">
        <el-select v-model="ruleForm.dashboard_section_id" filterable placeholder="Select">
          <el-option v-for="item in DashBoardSectionFilterdOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>


      <el-form-item label="Title" prop="title">
        <el-input v-model="ruleForm.title" />
      </el-form-item>

      <el-form-item label="Description" prop="description">
        <el-input v-model="ruleForm.description" />
      </el-form-item>
    
 

       <el-form-item label="Entity" v-if="showStatusExtras" prop="card_model">
        <el-select
v-model="ruleForm.card_model" :onClear="handleClear" clearable filterable collapse-tags  :onChange="handleSelectModel"
          placeholder="Select Entity to summarize">
          <el-option v-for="item in ModelOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>


      
      <el-form-item label="Chart Type"  prop="type">
        <el-select
v-model="ruleForm.type" :onClear="handleClear" clearable filterable collapse-tags
          placeholder="Select Type of Chart">
          <el-option v-for="item in chartOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>


       
       <el-form-item label="Field" v-if="showStatusExtras"  prop="card_model_field">
        <el-select
v-model="ruleForm.card_model_field" :onClear="handleClear" clearable filterable collapse-tags :onChange="handleFilterAggregators"
          placeholder="Field to summarize">
          <el-option v-for="item in fieldSet" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <el-form-item  v-if="showStatusExtras" prop="categorized">
        <el-checkbox v-model="ruleForm.categorized"  >Categorized  by selected field</el-checkbox>

      </el-form-item>



      <el-form-item label="Indicators" v-if="!showStatusExtras" prop="indicator_id">
            <el-select v-model="ruleForm.indicator_id" filterable multiple placeholder="Select" style="width: 100%;">
              <el-option v-for="item in IndicatorCategoryOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>


          <el-form-item label="Aggregation" prop="aggregation">
            <el-select
size="default" v-model="ruleForm.aggregation"  :onClear="handleClear"  
            clearable filterable collapse-tags placeholder="Select">
            <el-option v-for="item in aggregationOptionsFiltered" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
       </el-form-item>
    

    </el-form>
    <template #footer>

      <span class="dialog-footer">
        <el-button @click="AddDialogVisible = false">Cancel</el-button>
        <el-button v-if="showSubmitBtn" type="primary" @click="submitForm(ruleFormRef)">Submit</el-button>
        <el-button v-if="showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>
      </span>
    </template>
  </el-dialog>
</template>
<style>
.gray-tooltip .el-tooltip__popper {
  background-color: gray;
}
</style>