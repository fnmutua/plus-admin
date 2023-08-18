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
import {
  ElPagination, ElCol, ElTooltip, ElOption, ElDivider, ElDialog, ElForm, ElFormItem, ElInput, FormRules, ElRow,ElCheckbox,
  ElPopconfirm,ElSwitch
} from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord } from '@/api/settlements'
import { getUniqueFieldValues} from '@/api/households'
import { uuid } from 'vue-uuid'
import type { FormInstance } from 'element-plus'
import { getListWithoutGeo } from '@/api/counties'
import DownloadAll from '@/views/Components/DownloadAll.vue';

import { getModelSpecs, getModelRelatives } from '@/api/fields'

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


console.log("userInfo--->", userInfo)



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
    value: 'project',
    label: 'Project'
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
const showAdminButtons = ref(false)

let filters =[]
let filterValues = []

// flag for admin buttons
if (userInfo.roles.includes("admin") || userInfo.roles.includes("staff")) {
  showAdminButtons.value = true
   
}
const showEditButtons = ref(false)

// Show Edit buttons 
if (userInfo.roles.includes("staff")|| userInfo.roles.includes("admin")
  || userInfo.roles.includes("county_admin") ||  userInfo.roles.includes("national_monitoring") ) {
    showEditButtons.value = true;
}


// filter Charts only admins can see all 
if (userInfo.roles.includes("admin") || userInfo.roles.includes("super_admin") ) {
  showAdminButtons.value = true
  filters = []
  filterValues = []
}
else {

  filters = ['createdBy']
  filterValues = [[userInfo.id]]
}


console.log("Show Buttons -->", showAdminButtons)



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

console.log("getting fields fields",fieldSet.value)


}


const functionOptions = ref([])


 




let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
 
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
    field: 'id',
    label: t('Id'),

  },

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
const getProgrammeOptions = async () => {
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


const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  title: '',
  dashboard_id: '',
  description: '',
  iconColor: 'red',
  icon: '',
  aggregation: '',
  indicator_id: null,
  card_model_field: '',
  filter_value:[],
  filter_function: '',
  filter_option:'',
  card_model:'',
  computation:'',
  unique:false,
  filtered: false,
  category:'',
  filter_field:''
})

const editMode=ref(false)
 const editIndicator = async (data: TableSlotDefault) => {
  showSubmitBtn.value = false
  showEditSaveButton.value = true
   console.log(data.row)
  let vdata = data.row
  ruleForm.id = data.row.id
  ruleForm.title = data.row.title
  ruleForm.dashboard_id = data.row.dashboard_id
  ruleForm.description = data.row.description
  ruleForm.iconColor = data.row.iconColor
  ruleForm.icon = data.row.icon
  ruleForm.aggregation = data.row.aggregation
  ruleForm.indicator_id = data.row.indicator_id
  ruleForm.card_model = data.row.card_model
  ruleForm.card_model_field = data.row.card_model_field
  ruleForm.category = data.row.category


 // ruleForm.filter_value = data.row.filter_value
  ruleForm.computation = data.row.computation
  ruleForm.filter_function = data.row.filter_function
  ruleForm.filter_option = data.row.filter_option
  ruleForm.unique = data.row.unique
  ruleForm.filter_field = vdata.filter_field
  ruleForm.filtered = vdata.filtered
 
   console.log('data.row.filtered', ruleForm)
  

   

   if (data.row.card_model_field) {
    editMode.value=true
    await handleSelectModel(data.row.card_model)
    await handleFilterAggregators(data.row.card_model_field)
   }
  
 var filterValues = []
   if (data.row.filter_value) {

    data.row.filter_value.forEach(item => {
      console.log(item);
      filterValues.push(parseInt(item))
        });   

        ruleForm.filter_value=filterValues
    fieldSelected.value=true
    showFilterValues.value=true
   } else {
    fieldSelected.value=false

  }


  if (data.row.category === 'Status') {
     showStatusExtras.value = true
     fieldSelected.value=true
   } else {
    showStatusExtras.value=false

   }

   console.log('showStatusExtras',showStatusExtras.value)

   
  
  

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

const handleClose = () => {

  console.log("Clsoing the dialoig")
  showSubmitBtn.value = true
  showEditSaveButton.value = false

  ruleForm.id = ''
  ruleForm.category = ''
  formHeader.value = 'Add Card'

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

aggregationOptionsFiltered.value=aggregationOptions
 

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
  ],

  card_model_field: [
    { required: true, message: 'Field is required.', trigger: 'blur' },
  ] 

  


})

const AddCard = () => {
  AddDialogVisible.value = true
}


const submitForm = async (formEl: FormInstance | undefined) => {

  if (!showStatusExtras.value) {
    ruleForm.card_model = 'indicator_category_report'
    ruleForm.card_model_field = 'id'
  }



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

 
const getIndicatorNames = async () => {
  const formData = {}
  formData.curUser = 1 // Id for logged in user
  formData.model = 'indicator'
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  formData.assocModel = ''

  // - multiple filters -------------------------------------
  formData.filters = []
  formData.filterValues = []
  formData.associated_multiple_models = []
  formData.nested_models = ['activity', ['project']]

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)
  console.log('Idnicator_categor', res)

  res.data.forEach(function (arrayItem: { id: string; type: string }) {
    var opt = {}
    console.log('xx-xx--xx--', arrayItem)
    opt.value = arrayItem.id
    opt.label = arrayItem.name  + ' | ' + arrayItem.activity.title
   // opt.title = arrayItem.category.title
  
    indicatorsOptions.value.push(opt)
  })

}


getIndicatorOptions()
getInterventionsAll()
getProgrammeOptions()
getStrategicFocusAreas()
getIndicatorNames()

const handleSelectType = async (status) => {
 //   let selDashboard = DashboardOptions.value.filter(item => item.value === dashboard_id);


  if (status==='Status') {  // status dashabords 
showStatusExtras.value=true
  } else {
    showStatusExtras.value=false

  }
}
 
const handleSelectModel = async (selModel) => {
  fieldOptions.value=[]

  if(!editMode.value) {

    ruleForm.aggregation = ''
   ruleForm.card_model_field = ''
   ruleForm.filter_value = []
   ruleForm.filter_function = null
   ruleForm.filter_option = null
    ruleForm.filter_field = null
   ruleForm.filtered = false
  ruleForm.computation = null
  fieldSet.value=[]
  }
 









  console.log('specs.....')
 await  getModeldefinition(selModel)
}


const fieldSelected = ref(false)
const fieldOptions = ref([])
const disabledoptions = ref(false)

const categoryOptions  = [
         {
            value: 'Status',
            label: 'Status'
          },
          {
            value: 'Intervention',
            label: 'Intervention'
    }
  ] 
const handleFilterAggregators = async (selField) => {
 
   
  
  fieldSelected.value=true   // show filter field 
  fieldOptions.value=[]
   console.log('filtreing teh aggregators.....',selField )
   
   let selectedField = fieldSet.value.filter(option => option.value  == selField);
   console.log('selectedField', selectedField)
  let selFieldType = selectedField[0].type

   if (selFieldType==="STRING") {
    aggregationOptionsFiltered.value = aggregationOptions.filter(option => option.value === 'count');

    functionOptions.value =[
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
  console.log('Filter Fields 2:',res.data)
   

  res.data.forEach(function (arrayItem: { }) {
    var opt = {}
    console.log(arrayItem)
    opt.value = arrayItem
    opt.label = arrayItem
   // opt.title = arrayItem.category.title
  
   fieldOptions.value.push(opt)
  })

 }






 const showFilterValues=ref(false)
 const handleFilterFunction = async (val) => { 
  if (val=='all') {
    showFilterValues.value = false
    ruleForm.filter_value=[]
  } 
  
  else {
    showFilterValues.value=true

  }

   

}
 

const onSwitchChange = async (val) => { 
  if (val) {
    ruleForm.filter_field=ruleForm.indicator_id
  } else {
    ruleForm.filter_field=null
    ruleForm.filter_value=[]
  }
 

  
// for interventions show the filter values directlyt
  if(!showStatusExtras.value) {
    console.log('Indicators only....', fieldSelected  )
    fieldSelected.value = true   // show filter field 
    ruleForm.card_model_field='indicator_category_id'

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

const filterOption = ref()



const changeFilterForIndicators = async (val) => { 

  console.log('val', val)

  if (val=='programme') {
    ruleForm.filter_field = 'programme_implementation_id'
    ruleForm.filter_function='eq'
  } else {
    ruleForm.filter_field = 'amount'


  }

}

const infoDialog=ref(false)


</script>

<template>
  <ContentWrap :title="t('Dashboard Cards')" :message="t('Use the filters to subset')">
    <el-divider border-style="dashed" content-position="left">Filters</el-divider>

    <div style="display: inline-block; margin-left: 20px">
      <el-select
v-model="value3" :onChange="handleSelectDashboard" :onClear="handleClear" multiple clearable filterable
        collapse-tags placeholder="Search Dashboard">
        <el-option v-for="item in DashboardOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="handleDownload" type="primary" :icon="Download" />
    </div>
    <DownloadAll  v-if="showEditButtons"   :model="model" :associated_models="associated_multiple_models"/>

    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="handleClear" type="primary" :icon="Filter" />
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-tooltip content="Add Card" placement="top">
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
    <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px">

      <el-form-item label="Dashboard" prop="dashboard_id" >
        <el-select v-model="ruleForm.dashboard_id" filterable placeholder="Select" >
          <el-option v-for="item in DashboardOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>


      <el-form-item label="Title" prop="title">
           <el-input v-model="ruleForm.title" />
       </el-form-item>
 

       <el-form-item label="Category" prop="category" >
        <el-select v-model="ruleForm.category" filterable placeholder="Select"   :onChange="handleSelectType" >
          <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-button  plain style="margin-left: 5px"  :icon="InfoFilled" @click="infoDialog = true"/>

      </el-form-item>
        

       <el-form-item label="Description" prop="description">
           <el-input v-model="ruleForm.description" />
       </el-form-item>
 

       <el-row>
        <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
        
          <el-form-item label="Icon" prop="icon">
            <el-tooltip class="item" effect="dark" placement="top">
              <template #content>
                <div>
                  <p>Get Icons from <a href="https://iconify.design/" target="_blank">https://iconify.design/</a></p>
                </div>
              </template>
              <el-input v-model="ruleForm.icon" />
            </el-tooltip>
            <a
              v-if="ruleForm.icon"
              :href="'https://icnoffydesign.com/icons/' + ruleForm.icon"
              target="_blank"
              rel="noopener noreferrer"
            >
            </a>
          </el-form-item>
      </el-col>
      <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
      <el-form-item label="Icon Color" prop="iconColor">
           <el-color-picker v-model="ruleForm.iconColor"/>
       </el-form-item>
      </el-col>

      </el-row>
      <el-row :gutter="0">
      <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
      <el-form-item label="Indicator" v-if="!showStatusExtras"  prop="indicator_id" >
        <el-select
style="width: 100%"
v-model="ruleForm.indicator_id" :onClear="handleClear"    clearable
        filterable collapse-tags placeholder="Filter by Project/Indicator">
        <el-option v-for="item in indicatorsOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
       </el-form-item>
      </el-col>
    </el-row>
      <el-row :gutter="0">
            

      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
            <el-form-item label="Aggregation"   v-if="!showStatusExtras" prop="aggregation" >
            <el-select size="default" v-model="ruleForm.aggregation" :onClear="handleClear" style="width: 90%" clearable filterable collapse-tags placeholder="Select">
              <el-option v-for="item in aggregationOptionsFiltered" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-checkbox   v-if="!showStatusExtras"  v-model="ruleForm.unique" label="Unique" size="small" border />


    </el-row>

       <el-form-item label="Entity" v-if="showStatusExtras"   prop="card_model" >
        <el-select
v-model="ruleForm.card_model" :onClear="handleClear" clearable filterable collapse-tags  :onChange="handleSelectModel"
          placeholder="Select Entity to summarize">
          <el-option v-for="item in ModelOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
 
      <el-row :gutter="0">
              <el-col :xs="10" :sm="24" :md="10" :lg="10" :xl="10">
              <el-form-item  v-if="showStatusExtras"  label="Agg.Field" prop="card_model_field" >
                <el-select
        v-model="ruleForm.card_model_field" :onClear="handleClear" clearable filterable collapse-tags  :onChange="handleFilterAggregators"
                  placeholder="Field to summarize">
                  <el-option v-for="item in fieldSet" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="10" :sm="24" :md="10" :lg="10" :xl="10">
            <el-form-item  v-if="showStatusExtras"  label="Function" prop="aggregation" >
            <el-select size="default" v-model="ruleForm.aggregation" :onClear="handleClear" style="width: 90%" clearable filterable collapse-tags placeholder="Select">
              <el-option v-for="item in aggregationOptionsFiltered" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>

          </el-col>
          
        <el-checkbox v-if="showStatusExtras" v-model="ruleForm.unique" label="Unique" size="small" border />
      
      </el-row>
      <el-row>
        <el-form-item label="Filter" >
            <el-switch
            v-model="ruleForm.filtered" 
            @change="onSwitchChange"
            style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949" active-text="Yes" inactive-text="No" />
          </el-form-item> 
          

           <!-- // Filters for Interventions dashbaords -->
           <el-form-item label="Filter By" prop="filterOption" v-if="ruleForm.filtered && !showStatusExtras">
            <el-select v-model="ruleForm.filter_option" :onClear="handleClear" :onChange="changeFilterForIndicators" collapse-tags placeholder="Filter By">
              <el-option v-for="item in filterInterventionsOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>

              

              <el-form-item label="Programme" prop="filter_field" v-if=" ruleForm.filtered && !showStatusExtras && ruleForm.filter_option=='programme'">
                <el-select
v-model="ruleForm.filter_value" :onClear="handleClear"  multiple collapse-tags  
                  placeholder="Field to filter with">
                  <el-option v-for="item in implementationOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
 

      


                <!-- // Filters for Status dashbaords -->


              <el-form-item label="Filter Field" prop="filter_field"  v-if="ruleForm.filtered &&showStatusExtras && ruleForm.filter_option!='programme'">
                <el-select
        v-model="ruleForm.filter_field"   :onClear="handleClear" clearable filterable collapse-tags :onChange="handleFilterAggregators"
                  placeholder="Field to filter with">
                  <el-option v-for="item in fieldSet" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
 


          </el-row>

      <el-row>

           <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
      <el-form-item label="Filter Function" prop="filter_function"  v-if="fieldSelected && ruleForm.filtered && ruleForm.filter_option!='programme'">
        <el-select
                v-model="ruleForm.filter_function" 
                :onClear="handleClear" 
                clearable   
                filterable 
                collapse-tags 
                placeholder="" 
                :onChange="handleFilterFunction">
                  <el-option v-for="item in functionOptions" :key="item.value" :label="item.label" :value="item.value"  />
                </el-select>
              </el-form-item>
         </el-col>


            <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
                <el-select
                  v-if="fieldSelected && showFilterValues && ruleForm.filtered  && ruleForm.filter_option!='programme'" 
                v-model="ruleForm.filter_value" :onClear="handleClear"
                  clearable 
                  multiple
                filterable 
                collapse-tags 
                allow-create
                placeholder="Filter values">
                  <el-option v-for="item in fieldOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-col>

            

      </el-row>
   
 



       <el-form-item label="Computation" prop="computation">
            <el-select
size="default" v-model="ruleForm.computation"  :onClear="handleClear"  
            clearable filterable collapse-tags placeholder="Select">
            <el-option label="Proportion(%)" value="proportion"/>
      <el-option label="Absolute" value="absolute"/>          </el-select>
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

  
  <el-dialog
    v-model="infoDialog"
     width="40%"
  >
    <div class="info-dialog-content">
      <div class="info-dialog-section">
        <h4  class="info-heading">Status Chart:</h4>
        <p>
          A card that draws data from an entity within the system such as settlements, facilities, etc.
        </p>
      </div>
      <div class="info-dialog-section">
        <h4 class="info-heading"> Interventions Chart:</h4>
        <p>
          A card that draws data exclusively from slum interventions such as construction of infrastructure, 
          issuance of titles, and more.  
        </p>
      </div>

      
 


    </div>
  </el-dialog>



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
</style>