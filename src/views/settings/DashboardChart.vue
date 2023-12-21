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
  CopyDocument,
  Delete
} from '@element-plus/icons-vue'

import { ref, reactive } from 'vue'
import {
  ElPagination, ElTooltip, ElOption, ElDivider,ElSwitch,ElTable,ElTableColumn,ElRow,ElCol,
  ElDialog, ElForm, ElFormItem, ElInput, FormRules, ElCheckbox, ElPopconfirm
} from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import type { FormInstance } from 'element-plus'
import { getModelSpecs, getModelRelatives } from '@/api/fields'

import { getListWithoutGeo } from '@/api/counties'
import { getUniqueFieldValues} from '@/api/households'
import {  computed  } from 'vue'

import { Icon } from '@iconify/vue';
import DownloadAll from '@/views/Components/DownloadAll.vue';


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
 
let filters =[]
let filterValues = []

//const showAdminButtons =  ref(appStore.getAdminButtons)
const showAdminButtons =  true
//const showEditButtons =  ref(appStore.getEditButtons)
const showEditButtons =  true


 
// filter Charts only admins can see all 
if (userInfo.roles.includes("admin") || userInfo.roles.includes("super_admin") ) {
   filters = []
  filterValues = []
}
else {

  filters = ['createdBy']
  filterValues = [[userInfo.id]]
}




var tblData = []


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

aggregationOptionsFiltered.value=aggregationOptions




let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']

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
  value4.value = ''
  value5.value = ''
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
      opt.label = arrayItem.title + '(' + arrayItem.id + ')'
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

 

const editIndicator = (data: TableSlotDefault) => {
  showSubmitBtn.value = false
  showEditSaveButton.value = true
  console.log('Editing', data)


  ruleForm.id = data.row.id
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


  value4.value =  data.row.dashboard_section.dashboard.id

  let indicators =[]
  data.row.indicators.forEach(function (arrayItem) {
    indicators.push(arrayItem.id)
  })

  ruleForm.indicator_id = indicators

  ruleForm.card_model = data.row.card_model
  ruleForm.categorized = data.row.categorized

   if (data.row.category=='Status') {
    showStatusExtras.value=true
   } else {
    showStatusExtras.value=false

  }

  if (data.row.filter_value) {

    data.row.filter_value.forEach(item => {
      console.log(item);
      filterValues.push(parseInt(item))
    });

    ruleForm.filter_value =  data.row.filter_value

  }


  console.log('Edit Filter Values,', data.row.filter_value)

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


  if(data.row.filter_field) {
    // Get filter values only if the previous chart verison had fulters on
    getFieldValues(data.row.filter_field)
  }
 
   //handleFilterAggregators( data.row.card_model_field) 

  
  formHeader.value = 'Edit Section'

  console.log('ruleForm',ruleForm)

  AddDialogVisible.value = true
}


const CloneChart = (data: TableSlotDefault) => {
  showSubmitBtn.value = true
  showEditSaveButton.value = false
  console.log('Editing', data)


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


  value4.value =  data.row.dashboard_section.dashboard.id

  let indicators =[]
  data.row.indicators.forEach(function (arrayItem) {
    indicators.push(arrayItem.id)
  })

  ruleForm.indicator_id = indicators

  ruleForm.card_model = data.row.card_model
  ruleForm.categorized = data.row.categorized

   if (data.row.category=='Status') {
    showStatusExtras.value=true
   } else {
    showStatusExtras.value=false

  }

  if (data.row.filter_value) {

    data.row.filter_value.forEach(item => {
      console.log(item);
      filterValues.push(parseInt(item))
    });

    ruleForm.filter_value =  data.row.filter_value

  }


  console.log('Edit Filter Values,', data.row.filter_value)

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


  if(data.row.filter_field) {
    // Get filter values only if the previous chart verison had fulters on
    getFieldValues(data.row.filter_field)
  }
 
   //handleFilterAggregators( data.row.card_model_field) 

  
  formHeader.value = 'Edit Section'

  console.log('ruleForm',ruleForm)

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
  filter_value:[],
  filter_function: '',
  filter_option:'',
  filtered:false,
  filter_field:'',
  ignore_empty:true,
  category:''


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

  card_model_field: [
    { required: true, message: 'Field  is required', trigger: 'blur' }, ],

    card_model: [
    { required: true, message: 'Entity is required  is required', trigger: 'blur' }, ],
    
    category: [
    { required: true, message: 'Category is required  is required', trigger: 'blur' }, ],
    
    
    
    indicator_id: [
    { required: true, message: 'Indicator(s) is required  is required', trigger: 'blur' }, ],
    

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

      // if (isInterventionsDashboard.value) {
      //   console.log('add interventions')
      //   ruleForm.card_model='indicator_category_report'
      //   ruleForm.card_model_field='amount'
      // }
      

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


getdashboardOptions()

getIndicatorOptions()
getInterventionsAll()
getDashSectionOptions()

//getStrategicFocusAreas()
getIndicatorCategories()


const isInterventionsDashboard =ref(false)
const handleFilterDashboards = async (dashboard_id) => {
  console.log('filtreing teh aggregators.....', dashboard_id)
  let selDashboard = dashboardOptions.value.filter(item => item.value == dashboard_id);

console.log('selDashboard',selDashboard[0].type)

  // if (selDashboard[0].type === 'status') {  // status dashabords
  //     showStatusExtras.value=true
  // } else {
  //   showStatusExtras.value = false
  //   isInterventionsDashboard.value=true
    

  // }
    
     DashBoardSectionFilterdOptions.value = DashBoardSectionOptions.value.filter(option => option.dashboard_id  == dashboard_id);
   

    // handleSelectDashboard(dashboard_id)
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
            value: 7,
            label: 'Map Chart'
          },

          {
            value: 8,
            label: 'Population Pyramid'
          },

        ]

  const hideCategorize =ref(true)

 const handleSelectModel = async (selModel) => {

   fieldSet.value = []
   ruleForm.card_model_field=''
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
 

  if (ctype!=7) {  
      hideCategorize.value=false
  } else {
    hideCategorize.value=true

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
   console.log('getFieldValues', selField)
  console.log('Filter Fields 1.....', selField)
  fieldOptions.value=[]
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
  

  // Herer we get the filter functions
  let selectedField = fieldSet.value.filter(option => option.value  == selField);
   console.log('selectedField', selectedField)
  let selFieldType = selectedField[0].type

   if (selFieldType==="STRING") {
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
    aggregationOptionsFiltered.value =aggregationOptions

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
  if (val) {
    ruleForm.filter_field=ruleForm.indicator_id
  } else {
    ruleForm.filter_field=null
    ruleForm.filter_value=[]
  }
 

  
// for interventions show the filter values directlyt
  if(!showStatusExtras.value) {
    console.log('Indicators only....', fieldSelected  )
    fieldSelected.value=true   // show filter field 

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


const fieldOptions = ref([])
const isMobile = computed(() => appStore.getMobile)

const value5=ref()
console.log('IsMobile', isMobile)


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

  const handleSelectType = async (status) => {
 //   let selDashboard = DashboardOptions.value.filter(item => item.value === dashboard_id);


  if (status==='Status') {  // status dashabords 
showStatusExtras.value=true
  } else {
    showStatusExtras.value=false

  }
}

const infoDialog=ref(false)

</script>

<template>
  <ContentWrap :title="t('Dashboard Charts')" :message="t('Use the filters to subset')">
    <el-divider border-style="dashed" content-position="left">Filters</el-divider>

    
    <div style="display: inline-block; margin-left: 20px">
      <el-select
v-model="value5" :onChange="handleFilterDashboards" :onClear="handleClear" multiple clearable filterable
        collapse-tags placeholder="Search Dashboard">
        <el-option v-for="item in dashboardOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>



    <div style="display: inline-block; margin-left: 20px">
      <el-select
v-model="value3" :onChange="handleSelectDashboardSection" :onClear="handleClear" multiple clearable
        filterable collapse-tags placeholder="Search Dashboard Section">
        <el-option v-for="item in DashBoardSectionFilterdOptions" :key="item.value" :label="item.label" :value="item.value" />
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
      <el-tooltip content="Add Chart" placement="top">
        <el-button :onClick="AddCard" type="primary" :icon="Plus" />
      </el-tooltip>
    </div>

    <el-divider border-style="dashed" content-position="left">Results</el-divider>

 

    
    <el-table :loading="loading"   :data="tableDataList" stripe="stripe">
      <el-table-column label="Type">
        <template #default="scope">
          <Icon  v-if="scope.row.type === 1"  width="24" icon="tabler:chart-bar" />
          <Icon  v-if="scope.row.type === 2"  width="24" icon="fa-regular:chart-bar" />
          <Icon  v-if="scope.row.type === 3"  width="24" icon="bi:pie-chart-fill" />
          <Icon  v-if="scope.row.type === 4"  width="24" icon="material-symbols:full-stacked-bar-chart" />
          <Icon  v-if="scope.row.type === 5"  width="24" icon="vaadin:line-chart" />
          <Icon  v-if="scope.row.type === 6"  width="24" icon="material-symbols:1x-mobiledata-badge-rounded" />
          <Icon  v-if="scope.row.type === 7"  width="24" icon="foundation:map" />
          <Icon  v-if="scope.row.type === 8"  width="24" icon="carbon:chart-population" />
          <Icon  v-if="scope.row.type === 9"  width="24" icon="ic:baseline-stacked-bar-chart" />

    </template>
  </el-table-column>
  <el-table-column label="#" prop="id" sortable />

      <el-table-column label="Title" prop="title" sortable />
      <el-table-column label="Description" prop="description" sortable />
  
      <el-table-column fixed="right" label="Actions" >
        <template #default="scope">
          <el-dropdown v-if="isMobile">
            <span class="el-dropdown-link">
              <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
v-if="showAdminButtons" @click="editIndicator(scope as TableSlotDefault)"
                  :icon="Edit">Edit</el-dropdown-item>
                  <el-dropdown-item
v-if="showAdminButtons" @click="CloneChart(scope as TableSlotDefault)"
                  :icon="CopyDocument">Clone</el-dropdown-item>               
                  <el-dropdown-item
v-if="showAdminButtons" @click="DeleteIndicator(scope as TableSlotDefault)"
                  :icon="Delete" color="red">Delete</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <div v-else>
            <el-tooltip content="Edit" placement="top">
              <el-button
v-if="showAdminButtons" type="success" :icon="Edit"
                @click="editIndicator(scope as TableSlotDefault)" circle />
            </el-tooltip>

            <el-tooltip content="Clone" placement="top">
              <el-button
v-if="showAdminButtons" type="warning" :icon="CopyDocument"
                @click="CloneChart(scope as TableSlotDefault)" circle />
            </el-tooltip>
             
            <el-tooltip content="Delete" placement="top">
              <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
                title="Are you sure to delete this report?" @confirm="DeleteIndicator(scope as TableSlotDefault)">
                <template #reference>
                  <el-button v-if="showAdminButtons" type="danger" :icon=Delete circle />
                </template>
              </el-popconfirm>
            </el-tooltip>

          </div>
        </template>
      </el-table-column>


    </el-table>


    <ElPagination
layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage" v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 50, 200, 10000]" :total="total" :background="true" @size-change="onPageSizeChange"
      @current-change="onPageChange" class="mt-4" />
  </ContentWrap>

  <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formHeader" width="40%" draggable>
    <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="150px">


      <el-form-item label="Dashboard" prop="dashboard_id" >
        <el-select v-model="ruleForm.dashboard_id" filterable placeholder="Select" :onChange="handleFilterDashboards">
          <el-option v-for="item in dashboardOptions" :key="item.value" :label="item.label" :value="item.value" />
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


      
      <el-form-item label="Category" prop="category" >
        <el-select v-model="ruleForm.category" filterable placeholder="Select"   :onChange="handleSelectType" >
          <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>

        <el-button  plain style="margin-left: 5px"  :icon="InfoFilled" @click="infoDialog = true"/>

      </el-form-item>
        

      <el-form-item label="Description" prop="description">
        <el-input v-model="ruleForm.description" />
      </el-form-item>
    
 

       <el-form-item label="Entity" v-if="showStatusExtras" prop="card_model">
        <el-select
v-model="ruleForm.card_model" :onClear="handleClear" clearable filterable collapse-tags  :onChange="handleSelectModel"
          placeholder="Select Entity to summarize" style="width: 100%;">
          <el-option v-for="item in ModelOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

 
 
          <el-form-item label="Chart Type"  prop="type">
            <el-select
style="width: 100%;"
          v-model="ruleForm.type" :onClear="handleClear" clearable filterable collapse-tags :onChange="handleSelectChart"
              placeholder="Select Type of Chart">
              <el-option v-for="item in chartOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>      
          </el-form-item>
          

          


       
       <el-form-item label="Field" v-if="showStatusExtras &&ruleForm.type!=8 "  prop="card_model_field">
        <el-select
v-model="ruleForm.card_model_field" :onClear="handleClear" clearable filterable collapse-tags  
          placeholder="Field to summarize">
          <el-option v-for="item in fieldSet" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

  

      <el-form-item  v-if="showStatusExtras && !hideCategorize" prop="categorized">
        <el-checkbox v-model="ruleForm.categorized">Categorized  by selected field</el-checkbox>

      </el-form-item>

      <el-form-item label="Indicators" v-if="!showStatusExtras" prop="indicator_id">
            <el-select v-model="ruleForm.indicator_id" filterable multiple placeholder="Select" collapse-tags style="width: 100%;">
              <el-option v-for="item in IndicatorCategoryOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
    
          <el-form-item  prop="ignore_empty">
            <el-checkbox v-model="ruleForm.ignore_empty" label="Ignore records with missing data" />
          </el-form-item>

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
        v-model="ruleForm.filter_field"   :onClear="handleClear" clearable filterable collapse-tags :onChange="getFieldValues"
                  placeholder="Field to filter with">
                  <el-option v-for="item in fieldSet" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
 


          </el-row>


          <el-row>
            <!-- fOR INTERVENTIONS DASHBAORD ONLU  -->
               <el-form-item label="Filter Function" prop="filter_function"  v-if="fieldSelected && !showStatusExtras && ruleForm.filtered && ruleForm.filter_option!='programme'">
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


                </el-form-item>
 
              </el-row>

              <el-row  >

            <!-- FOR STATUS DASHBAORD ONLU  -->
               <el-form-item label="Filter Function" prop="filter_function" v-if="ruleForm.filtered && showStatusExtras "  >
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
 

                   <el-select
                   v-if="showFilterValues"
                  v-model="ruleForm.filter_value" :onClear="handleClear"
                    clearable 
                    multiple
                  filterable 
                  collapse-tags 
                  allow-create
                  placeholder="Filter values">
                    <el-option v-for="item in fieldOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>


                </el-form-item>
 
              </el-row>


 


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


  
  <el-dialog
    v-model="infoDialog"
     width="40%"
  >
    <div class="info-dialog-content">
      <div class="info-dialog-section">
        <h4  class="info-heading">Status Chart:</h4>
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