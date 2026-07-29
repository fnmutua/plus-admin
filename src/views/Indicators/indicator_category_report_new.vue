<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { ElButton, ElMessageBox, ElSelect, FormInstance, ElRow, ElCard, ElLink } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Plus,
  Back,
  Download,
  Filter,
  Delete,
  View, Position, CircleCloseFilled,
  InfoFilled,
  Files
} from '@element-plus/icons-vue'

import { ref, reactive, onMounted, computed } from 'vue'
import {
  ElPagination, ElInputNumber, ElTable, ElDescriptions, ElDescriptionsItem,
  ElTableColumn, ElDropdown, ElDropdownItem, ElDropdownMenu,
  ElDatePicker, ElTooltip, ElOption, ElDialog, ElForm, ElFormItem, ElUpload, ElInput, FormRules, ElPopconfirm
} from 'element-plus'
import { useRouter } from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { userHasPrivilegedNationalLocation } from '@/utils/roleScope'
import { CreateRecord, DeleteRecord, updateOneRecord, deleteDocument, uploadDocuments, searchByKeyWord } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import type { UploadProps, UploadUserFile } from 'element-plus'
import readXlsxFile from 'read-excel-file'
import { getModelSpecs } from '@/api/fields'
import { BatchImportUpsert } from '@/api/settlements'
import { UserType } from '@/api/register/types'
import { Icon } from '@iconify/vue';
import xlsx from "json-as-xlsx"
import { getOneGeo } from '@/api/settlements'


import UploadComponent from '@/views/Components/UploadComponent.vue';
import DocumentDrawer from '@/views/Components/DocumentDrawer.vue';
import { defineAsyncComponent } from 'vue';


import { MapboxLayerSwitcherControl } from "mapbox-layer-switcher";
import "mapbox-layer-switcher/styles.css";
import mapboxgl from 'mapbox-gl'
import * as turf from '@turf/turf'
import TableActions from '@/views/Components/TableActions.vue';
import PermissionWrapper from '@/components/PermissionWrapper.vue';


const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = MapBoxToken;



const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
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

console.log('indicator_category_report_new.vue - User location info:', {
  isSuperAdmin: isSuperAdmin.value,
  hasNationalAccess: hasNationalAccess.value,
  userCountyId: userCountyId.value,
  isCountyRestricted: isCountyRestricted.value
})

const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)
console.log('showAdminButtons', showAdminButtons.value)
console.log('showEditButtons', showEditButtons.value)


const action_buttons = ref([])
if (showAdminButtons.value) {
  action_buttons.value = ['delete', 'review', 'viewOnMap', 'documents']
} else if (showEditButtons.value) {

  action_buttons.value = [ 'review', 'viewOnMap', 'documents']
}
else {
  action_buttons.value = ['viewOnMap', 'documents']

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

const getRowIndicatorLabel = (row: Record<string, any>) =>
  row.indicator_category?.indicator_name ??
  row.indicator_category?.indicator?.name ??
  '—'

const getRowCategoryLabel = (row: Record<string, any>) =>
  row.indicator_category?.category_title ??
  row.indicator_category?.category?.category ??
  '—'

const getRowActivityLabel = (row: Record<string, any>) => {
  const level = row.indicator_category?.indicator_level
  if (level === 'project') return 'Project level'
  const title =
    row.activity?.title ??
    row.activity?.shortTitle ??
    row.indicator_category?.activity?.title ??
    row.indicator_category?.indicator?.activity?.title ??
    activityOptionsFiltered.value.find((o) => o.value === row.activity_id)?.label
  if (title) return title
  return row.activity_id ? `Activity #${row.activity_id}` : '—'
}

const getRowSettlementLabel = (row: Record<string, any>) => {
  const name =
    row.settlement?.name ??
    row.project_location?.settlement?.name ??
    row.project_location?.location_name
  if (name) return name
  const ward = row.ward?.name ?? row.project_location?.ward?.name
  const county = row.county?.name ?? row.project_location?.county?.name
  if (ward && county) return `${ward}, ${county}`
  if (county) return county
  if (row.subcounty?.name) return row.subcounty.name
  return row.settlement_id ? `Settlement #${row.settlement_id}` : '—'
}











const reviewWindowWidth = ref('40%')
const isMobile = computed(() => appStore.getMobile)

if (isMobile.value) {
  reviewWindowWidth.value = "100%"
}






const AddDialogVisible = ref(false)
const ImportDialogVisible = ref(false)
const formHeader = ref('Add Report')
const showSubmitBtn = ref(false)
const showProcessBtn = ref(true)
const addMoreDocuments = ref(false)
const ReviewDialog = ref(false)
const RejectDialog = ref(false)
const rejectReason = ref('')

// Document drawer state
const documentDrawerVisible = ref(false)
const selectedRowData = ref(null)


let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
const filters = ['status']
const filterValues = [['New']]  // remember to change here!
var tblData = []

// var filters = ['status']
// var filterValues = [['New']]  // remember to change here!


const associated_Model = ''
const model = 'indicator_category_report'
const associated_multiple_models = ['document', 'settlement', 'county', 'ward', 'subcounty', 'users', 'project', 'activity', 'project_location']
const nested_models = ['indicator_category', 'indicator']

//// ------------------parameters -----------------------////

const fileUploadList = ref<UploadUserFile[]>([])


const fieldSet = ref([])
const show = ref(false)


const { t } = useI18n()




const handleClear = async () => {
  console.log('cleared....')

  // clear all the fileters -------
  value1.value = null
  value2.value = null
  value3.value = null
  selectedSettlements.value = []
  selectedIndicators.value = []
  pageSize.value = 5
  currentPage.value = 1
  tblData = []
  //----run the get data--------
  getInterventionsAll()
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

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('Reports collected........', res)
  tableDataList.value = res.data
  loading.value = false
  // tableDataList.value = res.data.filter(item => item.indicator_category.indicator.type === 'output');

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
const indicatorsOptionsFiltered = ref([])

// Filter options and selections
const settlementFilterOptions = ref([])
const indicatorFilterOptions = ref([])
const selectedSettlements = ref([])
const selectedIndicators = ref([])
const firstLoad = ref(true)

const getIndicatorNames = async () => {
  const formData = {}

  formData.curUser = 1 // Id for logged in user
  formData.model = 'indicator_category'
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  formData.assocModel = ''

  // - multiple filters -------------------------------------
  formData.filters = []
  formData.filterValues = []
  formData.associated_multiple_models = ['project', 'category', 'activity']
  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)
  //console.log('Idnicator_categor', res)

  res.data.forEach(function (arrayItem: { id: string; type: string }) {
    // Skip items with missing required data
    if (!arrayItem || !arrayItem.id || !arrayItem.indicator_name) {
      console.warn('Skipping invalid indicator item:', arrayItem)
      return
    }

    var opt = {}
    console.log(arrayItem)
    opt.value = arrayItem.id
    opt.label = arrayItem.indicator_name + ' | ' + (arrayItem.category?.category || 'N/A')
    opt.title = arrayItem.category?.title || 'N/A'
    opt.project_id = arrayItem.project?.id || null
    opt.activity_id = arrayItem.activity?.id || null

    opt.county_id = arrayItem.project?.county_id || null
    opt.subcounty_id = arrayItem.project?.subcounty_id || null
    opt.settlement_id = arrayItem.project?.settlement_id || null
    opt.ward_id = arrayItem.project?.ward_id || null

    indicatorsOptions.value.push(opt)
    indicatorsOptionsFiltered.value.push(opt)
  })

  console.log('indicatorsOptions.value', indicatorsOptions.value)
}

const projectOptions = ref([])
const activityOptions = ref([])
const activityOptionsFiltered = ref([])

// Remote search method borrowed from ProjectDetails.vue
const remoteMethodSettlement = async (keyword) => {
  loading.value = true
  let model = 'settlement' // Always search settlements for this filter

  // Dynamically assign associated models
  const associatedModels = ['county', 'subcounty', 'ward']

  const formData = {
    model: model,
    searchField: 'name',
    searchKeyword: firstLoad.value ? '' : keyword, // only empty search on first load
    excludeGeom: false,
    excludeGeomAssoc: true,
    associated_multiple_models: associatedModels,
    filters: [],
    filterValues: [],
    limit: 50, // Limit to first 50 records
    offset: 0
  }

  try {
    const res = await searchByKeyWord(formData)

    if (res.data && res.data.length > 0) {
      settlementFilterOptions.value = res.data.map(item => {
        const base = {
          value: item.id,
          label: item.name,
          name: item.name,
          geom: item.geom,
        }

        return {
          ...base,
          settlement_id: item.id,
          county: item.county?.name,
          subcounty: item.subcounty?.name,
          ward: item.ward?.name,
          county_id: item.county?.id,
          subcounty_id: item.subcounty?.id,
          ward_id: item.ward?.id
        }
      })
    }

    firstLoad.value = false // Disable first load flag after first run
    
  } catch (error) {
    console.error("Settlement search error:", error)
  }

  loading.value = false
}

// Filter handler functions
const handleSettlementFilter = async (settlements: any) => {
  var selectOption = 'settlement_id'
  var index = filters.indexOf(selectOption)
  
  // Remove existing filter if present
  if (index !== -1) {
    filters.splice(index, 1)
    filterValues.splice(index, 1)
  }
  
  // Add new filter if settlements selected
  if (settlements && settlements.length > 0) {
    filters.push(selectOption)
    filterValues.push(settlements)
  }
  
  console.log('Settlement Filter:', settlements)
  getFilteredData(filters, filterValues)
}

const handleIndicatorFilter = async (indicators: any) => {
  var selectOption = 'indicator_category_id'
  var index = filters.indexOf(selectOption)
  
  // Remove existing filter if present
  if (index !== -1) {
    filters.splice(index, 1)
    filterValues.splice(index, 1)
  }
  
  // Add new filter if indicators selected
  if (indicators && indicators.length > 0) {
    filters.push(selectOption)
    filterValues.push(indicators)
  }
  
  console.log('Indicator Filter:', indicators)
  getFilteredData(filters, filterValues)
}

const getIndicatorFilterOptions = async () => {
  const formData = {
    curUser: 1,
    model: 'indicator_category',
    searchField: 'indicator_name',
    searchKeyword: '',
    assocModel: '',
    filters: [],
    filterValues: [],
    associated_multiple_models: [],
    nested_models: [],
  };

  const res = await getSettlementListByCounty(formData);
  console.log('Indicator Filter Options Response:', res);

  indicatorFilterOptions.value = res.data.map((item) => ({
    value: item.id,
    label: `${item.indicator_name} | ${item.category_title}`,
  }));
};

const getProjects = async () => {
  const formData = {}

  formData.curUser = 1 // Id for logged in user
  formData.model = 'project'
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
  console.log('project', res)

  res.data.forEach(function (arrayItem: { id: string; type: string }) {
    // Skip items with missing required data
    if (!arrayItem || !arrayItem.id || !arrayItem.title) {
      console.warn('Skipping invalid project item:', arrayItem)
      return
    }

    var opt = {}
    console.log(arrayItem)
    opt.value = arrayItem.id
    opt.label = arrayItem.title
    projectOptions.value.push(opt)

    // Check if activities exist and is an array
    if (arrayItem.activities && Array.isArray(arrayItem.activities)) {
      arrayItem.activities.forEach(function (activity: any) {
        // Skip activities with missing required data
        if (!activity || !activity.id || !activity.title) {
          console.warn('Skipping invalid activity item:', activity)
          return
        }

        var act = {}
        console.log(activity)
        act.value = activity.id
        act.label = activity.title
        act.project_id = arrayItem.id
        activityOptions.value.push(act)
        activityOptionsFiltered.value.push(act)
      })
    }
  })

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
  console.log("Closing the dialog")
  showSubmitBtn.value = true
  
  // Reset form fields
  ruleForm.id = ''
  ruleForm.indicator_category_id = ''
  ruleForm.project_id = ''
  ruleForm.activity_id = ''
  ruleForm.programme_implementation_id = ''
  ruleForm.settlement_id = ''
  ruleForm.subcounty_id = ''
  ruleForm.ward_id = ''
  ruleForm.county_id = ''
  ruleForm.date = new Date()
  ruleForm.amount = 0
  ruleForm.progress = 0
  ruleForm.project_status = ''
  ruleForm.disbursement = 0
  ruleForm.comments = ''
  ruleForm.qualitative = ''
  ruleForm.status = ''
  ruleForm.reject_msg = ''
  
  // Clear file upload list
  fileUploadList.value = []

  formHeader.value = 'Add Report'
  AddDialogVisible.value = false
}





const changeProject = async (project: any) => {
  ruleForm.indicator_category_id = []
  ruleForm.activity_id = []

  // Filter the activities 
  activityOptionsFiltered.value = activityOptions.value.filter(function (el) {
    return el.project_id == project
  });

  // filter the indicators 
  indicatorsOptionsFiltered.value = indicatorsOptions.value.filter(function (el) {
    return el.project_id == project
  });

}


const changeActivity = async (activity: any) => {
  ruleForm.indicator_category_id = []
  indicatorsOptionsFiltered.value = indicatorsOptions.value.filter(function (el) {
    return el.activity_id == activity

  });


}


const changeIndicator = async (indicator: any) => {
  ruleForm.indicator_id = indicator

  var filtredOptions = indicatorsOptions.value.filter(function (el) {
    return el.value == indicator
  });

  ruleForm.project_id = filtredOptions[0].project_id
  ruleForm.settlement_id = filtredOptions[0].settlement_id
  ruleForm.county_id = filtredOptions[0].county_id
  ruleForm.subcounty_id = filtredOptions[0].subcounty_id
  ruleForm.ward_id = filtredOptions[0].ward_id


  console.log("Filtered Indicators", filtredOptions[0])
  //ruleForm.indicator_category_title = filtredOptions[0].category_title

}



function getQuarter(date = new Date()) {
  return Math.floor(date.getMonth() / 3 + 1);
}

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  id: '',
  indicator_category_id: '',
  project_id: '',
  activity_id: '',
  programme_implementation_id: '',
  settlement_id: '',
  subcounty_id: '',
  ward_id: '',
  county_id: '',
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
  cumAmount: 0,
  prevAmount: 0,
  comments: '',
  units: 'Quantity',
  cumUnits: 'Cumulative(qty)',
  qualitative: '',
  status: '',
  reject_msg: ''
})

const rules = reactive<FormRules>({
  project_id: [
    { required: true, message: 'Project is required', trigger: 'blur' }
  ],
  indicator_category_id: [
    { required: true, message: 'Indicator category is required', trigger: 'blur' }
  ],
  amount: [
    { required: true, message: 'Amount is required', trigger: 'blur' }
  ],
  date: [
    { required: true, message: 'Date is required', trigger: 'blur' }
  ]
})



const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ruleForm.model = 'indicator_category_report'
      ruleForm.period = getQuarter()
      ruleForm.code = uuid.v4()
      ruleForm.userId = userInfo.id
      const report = await CreateRecord(ruleForm)   // first save the form on DB
      console.log("Report", report.data.id)

      // uploading the documents 
      const fileTypes = []
      const formData = new FormData()
      for (var i = 0; i < fileUploadList.value.length; i++) {
        console.log('------>file', fileUploadList.value[i])
        var format = fileUploadList.value[i].name.split('.').pop() // get file extension
        //  formData.append("file",this.multipleFiles[i],this.fileNames[i]+"_"+dateVar+"."+this.fileTypes[i]);
        fileTypes.push(format)
        // formData.append('files', fileList.value[i])
        // formData.file = fileList.value[i]
        formData.append('files', fileUploadList.value[i].raw)
        formData.append('DocType', format)

      }


      formData.append('parent_code', report.data.id)
      formData.append('model', model)
      formData.append('grp', 'M&E Documentation')
      formData.append('code', uuid.v4())
      formData.append('column', 'report_id')


      // formData.append('DocTypes', fileTypes)

      console.log(formData)
      await uploadDocuments(formData)


      AddDialogVisible.value = false
      handleClose()

    } else {
      console.log('error submit!', fields)
    }
  })
}




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
getProjects()

// Load filter options - initialize settlement search
remoteMethodSettlement('').then(() => {
  console.log('Settlement filter options loaded successfully')
}).catch(err => {
  console.error('Failed to load settlement filter options:', err)
})
getIndicatorFilterOptions()

//getCategoryOptions()
getInterventionsAll()


//getProjects()



const tableRowClassName = (data) => {
  console.log('Row data for styling:', data.row)
  console.log('Row documents:', data.row.documents)
  if (data.row.status == 'Rejected') {
    return 'danger-row'
  }
  if (data.row.status == 'Approved') {
    return 'success-row'
  }
  return ''
}







const getDocumentTypes = async () => {
}
getDocumentTypes()



const dialogWidth = ref()
const actionColumnWidth = ref()

if (isMobile.value) {
  dialogWidth.value = "90%"
  actionColumnWidth.value = "75px"
} else {
  dialogWidth.value = "45%"
  actionColumnWidth.value = "160px"

}


const DownloadXlsx = async () => {
  console.log(tableDataList.value)

  // change here !
  let fields = [
    { label: "S/No", value: "index" }, // Top level data
    { label: "Indicator", value: "indicator" }, // Top level data
    { label: "Category", value: "category" }, // Top level data
    { label: "Quantity", value: "quantity" }, // Custom format
    { label: "Settlement", value: "settlement" }, // Custom format
    { label: "County", value: "county" }, // Custom format
    { label: "Date", value: "date" }, // Custom format

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
    thisRecord.indicator = tableDataList.value[i].indicator_category.indicator.name
    thisRecord.category = tableDataList.value[i].indicator_category.category_title
    thisRecord.quantity = tableDataList.value[i].amount
    thisRecord.settlement = tableDataList.value[i].settlement.name
    thisRecord.county = tableDataList.value[i].county.name
    thisRecord.date = tableDataList.value[i].date


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
  console.log('Compnnent data', row)
  componentProps.value.data = row
  dynamicComponent.value = null; // Unload the component
  addMoreDocuments.value = true; // Set any additional props

  setTimeout(() => {
    dynamicComponent.value = ChildComponent; // Load the component
  }, 100); // 0.1 seconds


}

// Document drawer functions
const openDocumentDrawer = (row) => {
  console.log('Opening document drawer for row:', row)
  selectedRowData.value = row
  documentDrawerVisible.value = true
}

const handleDocumentRefresh = () => {
  console.log('Document refresh triggered')
  // Refresh the table data when documents are modified
  getFilteredData(filters, filterValues)
}

const handleOpenDialog = (row) => {
  console.log('Opening upload dialog for row:', row)
  toggleComponent(row)
}

// Handle upload completion
const handleUploadComplete = (response) => {
  console.log('Upload completed:', response)
  // Refresh the table data to show new documents
  getFilteredData(filters, filterValues)
  // Close the upload dialog
  addMoreDocuments.value = false
}



const report = ref({})

const review = (data: TableSlotDefault) => {
  console.log('Reviewing report:', data)
  
  // Populate report data for the review dialog
  report.value = {
    project: data.project?.title || 'N/A',
    location: data.settlement?.name || 'N/A',
    indicator: data.indicator_category?.indicator_name || 'N/A',
    amount: data.amount || 0,
    date: formatDate(data.date),
    user: data.user?.name || 'N/A',
    phone: data.user?.phone || 'N/A',
    documents: data.documents || []
  }
  
  // Set the current row data for approve/reject actions
  // Only set the essential fields needed for approval/rejection
  ruleForm.id = data.id
  ruleForm.status = data.status || 'New'
  ruleForm.reject_msg = data.reject_msg || ''
  
  console.log('RuleForm set for review:', {
    id: ruleForm.id,
    status: ruleForm.status,
    reject_msg: ruleForm.reject_msg
  })
  
  // Open the review dialog
  ReviewDialog.value = true
}






const approve = async () => {
  console.log("Approve")
  
  // Create a proper payload for the approval
  const approvalPayload = {
    id: ruleForm.id,
    status: 'Approved',
    model: 'indicator_category_report',
    userId: userInfo.id
  }
  
  console.log('Approval payload:', approvalPayload)
  
  try {
    await updateOneRecord(approvalPayload)
  ReviewDialog.value = false
  getFilteredData(filters, filterValues)
    ElMessage.success('Report approved successfully')
  } catch (error) {
    console.error('Error approving report:', error)
    ElMessage.error('Failed to approve report')
  }
}

const reject = async () => {
  RejectDialog.value = true
}
const confirmReject = async () => {
  console.log('Reject Msg', rejectReason.value)
  
  // Create a proper payload for the rejection
  const rejectionPayload = {
    id: ruleForm.id,
    status: 'Rejected',
    reject_msg: rejectReason.value,
    model: 'indicator_category_report',
    userId: userInfo.id
  }
  
  console.log('Rejection payload:', rejectionPayload)
  
  try {
    await updateOneRecord(rejectionPayload)
  RejectDialog.value = false
  ReviewDialog.value = false
  getFilteredData(filters, filterValues)
    ElMessage.success('Report rejected successfully')
  } catch (error) {
    console.error('Error rejecting report:', error)
    ElMessage.error('Failed to reject report')
  }
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

    // Calculate total for Qty/Status column
    if (column.label === 'Qty/Status') {
      const numericRows = data.filter(row => row.qualitative === null && row.amount);
      const total = numericRows.reduce((sum, row) => {
        const value = Number(row.amount);
        return isNaN(value) ? sum : sum + value;
      }, 0);
      const qualitativeCount = data.filter(row => row.qualitative !== null).length;
      
      if (qualitativeCount > 0 && numericRows.length > 0) {
        sums[index] = `Total: ${total.toLocaleString()} + ${qualitativeCount} Status`;
      } else if (qualitativeCount > 0) {
        sums[index] = `${qualitativeCount} Status Items`;
      } else {
        sums[index] = `Total: ${total.toLocaleString()}`;
      }
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

function isGeomNull(geom) {
  console.log('---geom-----', geom)
  return geom === null;
}

const dialogMap = ref(false)

const reportGeom = ref([])
const projectGeom = ref([])

const reportDetails = ref();
const locationStatus = ref('')
const projectLocationColor = ref('red')
const showMap = async (row) => {
  reportDetails.value = row


  // get the geometry of teh reprot 
  const formData = {}
  formData.model = 'indicator_category_report'
  formData.id = row.id
  console.log(formData)
  const res = await getOneGeo(formData)
  const loc_geom = res.data[0].json_build_object
  var centroid = turf.centroid(loc_geom);
  console.log('centroid', centroid)
  reportGeom.value = centroid


  // now get the geometry of the project lcoation 
  console.log(row)
  const projLocFormData = {}
  projLocFormData.model = 'project_location'
  projLocFormData.id = row.project_location_id

  const prj_res = await getOneGeo(projLocFormData)
  const proj_geom = prj_res.data[0].json_build_object
  var proj_centroid = turf.centroid(proj_geom);
  console.log('centroid', proj_centroid)
  projectGeom.value = proj_centroid


  console.log('  projectGeom.value', projectGeom.value)
  console.log('  projectGeom.value', projectGeom.value)


  dialogMap.value = true

  //   projectGeom.value = reportDetails.value.project.geom



  var options = { units: 'kilometers' };

  var distance = turf.distance(proj_centroid, centroid, options);
  console.log('distance , ', distance)

  if (distance < 1) {
    projectLocationColor.value = 'green'
  }

  locationStatus.value = 'The report is ' + distance.toFixed(2) + ' kilometers from the center of the project'
  setTimeout(loadMap, 100); // delay for the dialog to fully load
  //loadMap()
}



const closeMap = () => {

  dialogMap.value = false
}

const loadMap = () => {
  var mapCenter = reportGeom.value.geometry.coordinates;

  var nmap = new mapboxgl.Map({
    container: "mapContainer",
    style: "mapbox://styles/mapbox/streets-v12",
    center: mapCenter, // starting position
    zoom: 18,
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
    nmap.fitBounds(bounds, { padding: 100 })





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
};




</script>

<template>




  <el-card>

    <el-row :gutter="10" style="margin-bottom: 16px;">
      <el-col :span="3">
        <el-button type="primary" plain :icon="Back" @click="goBack">
          Back
        </el-button>
      </el-col>
      
      <el-col :span="6" style="margin-left: 16px;margin-right: 16px;" >
        <el-select
          v-model="selectedSettlements" 
          @change="handleSettlementFilter" 
          @clear="handleClear" 
          multiple clearable 
          filterable
          remote
          reserve-keyword
          :loading="loading"
          collapse-tags 
          placeholder="Search Settlement"
          :remote-method="remoteMethodSettlement"
          style="width: 100%;">
          <el-option 
            v-for="item in settlementFilterOptions" 
            :key="item.id" 
            :label="item.label" 
            :value="item.value">
            <div style="display: flex; align-items: center;">
              <span style="flex: 1; text-align: left;">{{ item.label }}</span>
              <span style="flex: 2; color: var(--el-text-color-secondary); font-size: 13px; text-align: right;">
                {{ item.ward ? item.ward + ', ' : '' }}{{ item.subcounty ? item.subcounty + ', ' : '' }}{{ item.county }}
              </span>
            </div>
          </el-option>
        </el-select>
      </el-col>
      
      <el-col :span="6" style="margin-right: 16px;" >
        <el-select
          v-model="selectedIndicators" 
          @change="handleIndicatorFilter" 
          @clear="handleClear" 
          multiple clearable filterable
          collapse-tags 
          placeholder="Filter by Indicator"
          style="width: 100%;">
          <el-option v-for="item in indicatorFilterOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-col>
      
      <el-col :span="9">
        <div style="display: flex; align-items: center; gap: 10px; justify-content: flex-right;">
          <el-button :onClick="DownloadXlsx" type="primary" :icon="Download" />
          <el-button :onClick="handleClear" type="primary" :icon="Filter" />
        </div>
      </el-col>
    </el-row>






    <el-table
:data="tableDataList" style="width: 100%; margin-top: 10px;" border show-summary :summary-method="getSummaries" :row-class-name="tableRowClassName"
      v-loading="loading">
 



      <el-table-column label="Indicator" sortable>
        <template #default="{ row }">
          {{ getRowIndicatorLabel(row) }}
        </template>
      </el-table-column>
      <el-table-column label="Category" sortable>
        <template #default="{ row }">
          {{ getRowCategoryLabel(row) }}
        </template>
      </el-table-column>
      <el-table-column label="Activity" sortable show-overflow-tooltip>
        <template #default="{ row }">
          {{ getRowActivityLabel(row) }}
        </template>
      </el-table-column>
      <el-table-column label="Settlement" sortable show-overflow-tooltip>
        <template #default="{ row }">
          {{ getRowSettlementLabel(row) }}
        </template>
      </el-table-column>
      <el-table-column label="Qty/Status" sortable>
        <template #default="{ row }">
          {{ row.qualitative !== null ? (row.qualitative ? 'Yes' : 'No') : row.amount }}
        </template>
      </el-table-column>
      <el-table-column label="Progress %" prop="progress" sortable>
        <template #default="{ row }">
          {{ isFinite(Number(row.progress || 0)) ? Number(row.progress || 0).toFixed(1) : '0.0' }}%
        </template>
      </el-table-column>
      <el-table-column label="Date" prop="date" sortable>
        <template #default="scope">
          {{ formatDate(scope.row.date) }}
        </template>
      </el-table-column>



      <el-table-column label="Status" prop="status" sortable>
        <template #default="{ row }">
          <el-tag :type="row.status === 'Approved' ? 'success' : row.status === 'Rejected' ? 'danger' : 'info'">
            {{ row.status || 'New' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Documents" width="120" align="center">
        <template #default="{ row }">
          <div class="documents-cell">
            <el-button 
              type="primary" 
              size="small" 
              :icon="Files"
              @click="openDocumentDrawer(row)"
              class="documents-button"
            >
              {{ row.documents?.length || 0 }}
            </el-button>
          </div>
        </template>
      </el-table-column>
      <!-- <el-table-column fixed="right" label="Actions" :width="actionColumnWidth">
        <template #default="scope">
          <el-dropdown v-if="isMobile">
            <span class="el-dropdown-link">
              <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
v-if="showEditButtons" @click="review(scope as TableSlotDefault)"
                  :icon="View">View</el-dropdown-item>
                <el-dropdown-item
v-if="showAdminButtons" @click="DeleteReport(scope.row as TableSlotDefault)"
                  :icon="Delete" color="red">Delete</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>


          <div v-else>

            <el-tooltip content="Review" placement="top">
              <el-button
v-if="showAdminButtons" type="primary" :icon="View"
                @click="review(scope as TableSlotDefault)" circle />
            </el-tooltip>

            <el-tooltip content="Map" placement="top">
              <el-button
v-if="showEditButtons" type="warning"   :icon="Position"
                :disabled="isGeomNull(scope.row.geom)" @click="showMap(scope.row as TableSlotDefault)" circle />
            </el-tooltip>

            <el-tooltip content="Delete" placement="top">
              <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF" width="300" 
                title="Are you sure to delete this report?" @confirm="DeleteReport(scope.row as TableSlotDefault)">
                <template #reference>
                  <el-button v-if="showAdminButtons" type="danger" :icon=Delete circle />
                </template>
              </el-popconfirm>
            </el-tooltip>

          </div>
        </template>
      </el-table-column> -->


      <el-table-column label="Actions" width="250">
        <template #default="{ row }">
           <TableActions :item="row" :buttons="action_buttons" @view-on-map="showMap" @review="review" @delete="DeleteReport" @documents="openDocumentDrawer" />


        </template>
      </el-table-column>


    </el-table>


    <ElPagination
:layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'" v-model:currentPage="currentPage"
      v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 200, 10000]" :total="total" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4"
      :small="isMobile"
      :pager-count="isMobile ? 3 : 7" />
  </el-card>

  <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formHeader" :width="dialogWidth" draggable>

    <el-row :gutter="10">

      <el-col :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
        <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-position="left">

          <el-form-item label="Project">
            <el-select
filterable v-model="ruleForm.project_id" :onChange="changeProject" style="width: 100%"
              placeholder="Select Project">
              <el-option v-for="item in projectOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>

          <el-form-item label="Activity">
            <el-select
filterable v-model="ruleForm.activity_id" :onChange="changeActivity" style="width: 100%"
              placeholder="Select Activity">
              <el-option
v-for="item in activityOptionsFiltered" :key="item.value" :label="item.label"
                :value="item.value" />
            </el-select>
          </el-form-item>


          <el-form-item label="Indicator">
            <el-select
filterable v-model="ruleForm.indicator_category_id" :onChange="changeIndicator"
              style="width: 100%" placeholder="Select Indicator">
              <el-option
v-for="item in indicatorsOptionsFiltered" :key="item.value" :label="item.label"
                :value="item.value" />
            </el-select>
          </el-form-item>




          <el-form-item label="Date">
            <el-date-picker v-model="ruleForm.date" type="date" placeholder="Pick a day" />
          </el-form-item>
          <el-form-item label="Quantity">
            <el-input-number v-model="ruleForm.amount" />
          </el-form-item>
          <el-form-item label="Progress %">
            <el-input-number v-model="ruleForm.progress" :min="0" :max="100" />
          </el-form-item>
          <el-form-item label="Comments">
            <el-input v-model="ruleForm.comments" type="textarea" placeholder="Enter comments" />
          </el-form-item>

        </el-form>

      </el-col>

    </el-row>
    <template #footer>

      <span class="dialog-footer">

        <el-row :gutter="10">

          <el-col :xl="24" :lg="24" :md="24" :sm="24" :xs="24">

            <el-button @click="AddDialogVisible = false">Cancel</el-button>
            <el-button v-if="showSubmitBtn" type="primary" @click="submitForm(ruleFormRef)">Submit</el-button>


          </el-col>


        </el-row>
      </span>
    </template>
  </el-dialog>

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

  <el-dialog v-model="ReviewDialog" @close="handleClose" :title="formHeader" :width="reviewWindowWidth" draggable>

    <el-descriptions title="" direction="vertical" :column="2" size="small" border>
      <el-descriptions-item label="Project">{{ report.project }}</el-descriptions-item>
      <el-descriptions-item label="Settlement">{{ report.location }}</el-descriptions-item>
      <el-descriptions-item label="Indicator" :span="2">{{ report.indicator }}</el-descriptions-item>
      <el-descriptions-item label="Amount">{{ report.amount }}</el-descriptions-item>
      <el-descriptions-item label="Date"> {{ report.date }} </el-descriptions-item>
      <el-descriptions-item label="Submitted By"> {{ report.user }} </el-descriptions-item>
      <el-descriptions-item label="Telephone"> {{ report.phone }} </el-descriptions-item>


      <el-descriptions-item label="Documentation" v-if="report.documents && report.documents.length">
        <div v-for="(doc, index) in report.documents" :key="index">
          <el-button @click="downloadFile(doc)" link type="primary" size="small" :icon="Download">{{ doc.name
            }}</el-button>
        </div>
      </el-descriptions-item>


    </el-descriptions>





    <template #footer>
      <span v-if="showAdminButtons" class="dialog-footer">
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


  <el-dialog v-model="dialogMap" width="50%" draggable :before-close="closeMap" :show-close="false">
    <template #header="{ titleId, titleClass }">
      <div class="my-header">
        <h4 :id="titleId" :class="titleClass">Reporting Location</h4>
        <h2 :style="`color: ${projectLocationColor}; font-style: italic;`">{{ locationStatus }}</h2>
        <!-- Use the 'italicizedColor' variable -->
        <el-button type="danger" :icon="CircleCloseFilled" @click="closeMap">Close Map</el-button>
      </div>
    </template>
    <div id="mapContainer" class="basemap"></div>

  </el-dialog>

  <!-- Document Drawer -->
  <DocumentDrawer
    v-model:visible="documentDrawerVisible"
    :data="selectedRowData"
    :docmodel="model"
    @open-dialog="handleOpenDialog"
    @refresh="handleDocumentRefresh"
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
</style>


<style scoped>
.basemap {
  width: 100%;
  height: 450px;
  border: 1px solid #e2dcdc;
  /* Outline */
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.4);
  /* Shadow */
}

.my-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
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
</style>