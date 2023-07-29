<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'

import { getSettlementListByCounty, getHHsByCounty, uploadFilesBatch } from '@/api/settlements'
import { getCountyListApi, getListWithoutGeo } from '@/api/counties'
import {
  ElButton, ElSelect, FormInstance, ElLink, ElTabs, ElTabPane, ElDialog, ElInputNumber,
  ElInput, ElBadge, ElForm, ElDescriptions, ElDescriptionsItem, ElFormItem, ElUpload, ElCascader, FormRules, ElPopconfirm, ElTable, ElCol, ElRow,
  ElTableColumn, UploadUserFile, ElDropdown, ElDropdownMenu, ElDropdownItem, ElOptionGroup, ElStep, ElSteps, ElCheckbox,ElCheckboxGroup, ElCheckboxButton
} from 'element-plus'
import { ElMessage, } from 'element-plus'
import { Position, View, Plus, User, Download, Briefcase, Delete, Edit, Filter, InfoFilled, CopyDocument, Search, Setting, Loading } from '@element-plus/icons-vue'

import { ref, reactive, h, toRef, computed } from 'vue'
import { ElPagination, ElTooltip, ElOption, ElDivider } from 'element-plus'
import { useRouter } from 'vue-router'
import { CreateRecord, DeleteRecord, updateOneRecord, deleteDocument, uploadDocuments, getfilteredGeo } from '@/api/settlements'
import { getFile } from '@/api/summary'

import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { uuid } from 'vue-uuid'
import { defineAsyncComponent } from 'vue';

import xlsx from "json-as-xlsx"
import { getAllGeo } from '@/api/settlements'
import {
  searchByKeyWord
} from '@/api/settlements'

import readShapefileAndConvertToGeoJSON from '@/utils/readShapefile'

import filterDataByKeys from '@/utils/filterArrays'

import { getSummarybyField, getSummarybyFieldNested, getSummarybyFieldFromInclude, getSummarybyFieldSimple } from '@/api/summary'

import { getModelSpecs, getModelRelatives } from '@/api/fields'


import 'element-plus/theme-chalk/display.css'

////////////*************Map Imports***************////////

import '@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css';
import * as turf from '@turf/turf'
import { Icon } from '@iconify/vue';


import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'
import { UserType } from '@/api/register/types'


import { MapboxLayerSwitcherControl } from "mapbox-layer-switcher";
import "mapbox-layer-switcher/styles.css";
import proj4 from 'proj4';

 

import UploadComponent from '@/views/Components/UploadComponent.vue';
 

 import ListDocuments from '@/views/Components/ListDocuments.vue';





const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'
mapboxgl.accessToken = MapBoxToken;





//*****************************Create**************************** */

///----------------------------------------------------------------------------------
const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  name: '',
  county_id: '',
  subcounty_id: '',
  ward_id: '',
  settlement_type: '',
  population: '',
  area: '',
  description: null,
  geom: null,
  id: '',
  dist_trunk: null,
  dist_town: null,
  parcel_no: null,
  parcel_owner: null,
  rim_no: null,
  isApproved: 'Pending',
  isActive: true,
  code: ''
})


const selectedCounty = ref()
const selectedSubCounty = ref(null)


const search_string = ref()

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


// Hide buttons if not admin 
const showAdminButtons = ref(false)
const showEditButtons = ref(false)

if (userInfo.roles.includes("admin")) {
  showAdminButtons.value = true
}

// Show Edit buttons 
if (userInfo.roles.includes("staff") || userInfo.roles.includes("admin")
  || userInfo.roles.includes("county_admin") || userInfo.roles.includes("national_monitoring")) {
  showEditButtons.value = true;
}



const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
const value3 = ref()
var value4 = ref([])
var value5 = ref([])
var value6 = ref([])

const morefileList = ref<UploadUserFile[]>([])
const loadingGetData = ref(false)

const interVentionTypeOptions = ref([])


const settlementOptions = ref([])
const page = ref(1)
const pSize = ref(5)
const selCounties = []
const loading = ref(true)
const pageSize = ref(5)
const currentPage = ref(1)
const activeTab = ref('list')
const enableSubcounty = ref(false)

const total = ref(0)
const totalRejected = ref(0)
const totalApproved = ref(0)
const totalPending = ref(0)
const showEditSaveButton = ref(false)
const showAddSaveButton = ref(true)
const formheader = ref('Edit Settlement')


//let tableDataList = ref<UserType[]>([])
const tableDataList = ref([])
let tableDataListNew = ref<UserType[]>([])
let tableDataListRejected = ref<UserType[]>([])

//// ------------------parameters -----------------------////


const filters = ref(['settlement_type', 'isApproved', 'isActive'])
const filterValues = ref([[1, 2], ['Approved'], ['true']]) // make sure the inner array is array




var tblData = []

const associated_Model = ''
const associated_multiple_models = ['county', 'subcounty', 'ward', 'users']
const nested_models = ['document', 'document_type'] // The mother, then followed by the child

const model = 'settlement'
//// ------------------parameters -----------------------////
const fileUploadList = ref<UploadUserFile[]>([])



const { t } = useI18n()

const isMobile = computed(() => appStore.getMobile)

const reviewWindowWidth = ref('40%')

if (isMobile.value) {
  reviewWindowWidth.value = "100%"
}




const handleClear = async () => {
  console.log('cleared....')
  enableSubcounty.value = false

  // clear all the fileters -------
  filterValues.value = []
  filters.value = []
  value1.value = ''
  value2.value = ''
  value3.value = ''
  value4.value = ''
  value5.value = ''

  pSize.value = 5
  currentPage.value = 1
  tblData.value = []
  //----run the get data--------
  getAllSetllementsInitially()
}




const currentRow = ref()
const addMoreDocuments = ref(false)




const onPageChange = async (selPage: any) => {
  page.value = selPage

  //console.log('', activeTab.value)
  if (activeTab.value == 'list') {
    filters.value = ['settlement_type', 'isApproved', 'isActive']
    filterValues.value = [[1, 2], ['Approved'],]  // make sure the inner array is array
  } else if (activeTab.value == 'New') {
    filters.value = ['settlement_type', 'isApproved', 'isActive']
    filterValues.value = [[1, 2], ['Pending'], ['true']]  // make sure the inner array is array
  }
  else if (activeTab.value == 'Rejected') {
    filters.value = ['settlement_type', 'isApproved', 'isActive']
    filterValues.value = [[1, 2], ['Rejected'], ['true']]  // make sure the inner array is array
  }

  console.log("Where are we?", activeTab.value, filters.value, filterValues.value)

  if (search_string.value) {
    getFilteredBySearchData(activeTab.value, search_string.value)
  } else {
    getNewOrRejectedSettlements(activeTab.value)
  }


}

const onPageSizeChange = async (size: any) => {
  pSize.value = size
  //getFilteredData(filters, filterValues)

  console.log(activeTab.value)
  if (activeTab.value === 'list') {
    filters.value = ['settlement_type', 'isApproved', 'isActive']
    filterValues.value = [[1, 2], ['Approved'], ['true']]  // make sure the inner array is array
  } else if (activeTab.value === 'New') {
    filters.value = ['settlement_type', 'isApproved', 'isActive']
    filterValues.value = [[1, 2], ['Pending'], ['true']]  // make sure the inner array is array

  }
  else if (activeTab.value === 'Rejected') {
    filters.value = ['settlement_type', 'isApproved', 'isActive']
    filterValues.value = [[1, 2], ['Rejected'], ['true']]  // make sure the inner array is array
  }


  if (search_string.value) {
    getFilteredBySearchData(activeTab.value, search_string.value)
  } else {
    getNewOrRejectedSettlements(activeTab.value)
  }



}

const clickTab = async (obj) => {

  page.value = 1
  activeTab.value = obj.props.name

  console.log("Loading tabs.............", obj.props.label)
  console.log("Loading activeTab.............", activeTab.value)
  console.log("Loading search_string.............", search_string.value)
  dynamicDocumentComponent.value=null

  if (obj.props.name === 'list') {
    filters.value = ['settlement_type', 'isApproved', 'isActive']
    filterValues.value = [[1, 2], ['Approved'], ['true']]  // make sure the inner array is array

  } else if (obj.props.name === "New") {
    filters.value = ['settlement_type', 'isApproved', 'isActive']
    filterValues.value = [[1, 2], ['Pending'], ['true']]  // make sure the inner array is array

  }
  else if (obj.props.name === "Rejected") {
    filters.value = ['settlement_type', 'isApproved', 'isActive']
    filterValues.value = [[1, 2], ['Rejected'], ['true']]  // make sure the inner array is array
  }

  console.log('Filters:', filters.value)
  console.log('Filters Value:', filterValues.value)

  if (search_string.value) {
    getFilteredBySearchData(obj.props.name, search_string.value)
  } else {
    getNewOrRejectedSettlements(obj.props.name)
  }
}



const getAllSetllementsInitially = async () => {
  // getFilteredData(filters, filterValues)
  await getNewOrRejectedSettlements('list')
  getSettlementCount()  // This gets the approved/new/rejecetd counts

}





const getSettlementCount = async () => {
  const formData = {}
  formData.model = 'settlement'
  formData.summaryField = 'isApproved'
  formData.summaryFunction = 'count'
  formData.groupField = ['isApproved']

  formData.filterColumn = 'isActive'
  formData.filterValue = 'true'




  const newSettCount = await getSummarybyField(formData)
  console.log('Settleemnt Count---->', newSettCount)

  let pending = await filterDataByKeys(newSettCount.Total, ['isApproved'], ['Pending']);
  let approved = await filterDataByKeys(newSettCount.Total, ['isApproved'], ['Approved']);
  let rejected = await filterDataByKeys(newSettCount.Total, ['isApproved'], ['Rejected']);

  console.log(pending)
  console.log(approved)
  console.log(rejected)

  totalPending.value = pending.length > 0 ? parseInt(pending[0].count) : 0
  totalApproved.value = approved.length > 0 ? parseInt(approved[0].count) : 0
  totalRejected.value = rejected.length > 0 ? parseInt(rejected[0].count) : 0

  console.log('New:', totalPending.value)
  console.log('Approved:', totalApproved.value)
  console.log('Rejecetd:', totalRejected.value)

}


const selectedWard = ref()
const getNewOrRejectedSettlements = async (tab) => {

  loadingGetData.value = true




  if (tab === 'New') {
    filters.value = ['isApproved', 'isActive']
    filterValues.value = [['Pending'], ['true']]  // make sure the inner array is array

  } else if (tab === 'Rejected') {
    filters.value = ['isApproved', 'isActive']
    filterValues.value = [['Rejected'], ['true']]  // make sure the inner array is array
  }

  else {
    filters.value = ['isApproved', 'isActive']
    filterValues.value = [['Approved'], ['true']]  // make sure the inner array is array
  }


  if (selectedCounty.value) {
    var selectOption = 'county_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    var index = filters.value.indexOf(selectOption) // 1

    // clear previously selected
    if (filterValues[index]) {
      // filterValues[index].length = 0
      filterValues.value.splice(index, 1)
    }

    if (!filterValues.value.includes(selectedCounty.value) && selectedCounty.value.length > 0) {
      filterValues.value.splice(index, 0, selectedCounty.value) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
    }

    // expunge the filter if the filter values are null
    if (selectedCounty.value.length === 0) {
      filters.value.splice(index, 1)
    }

  }



  // Filter by subcounty  
  if (selectedSubCounty.value) {
    var selectOption = 'subcounty_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    var index = filters.value.indexOf(selectOption) // 1

    // clear previously selected
    if (filterValues[index]) {
      // filterValues[index].length = 0
      filterValues.value.splice(index, 1)
    }

    if (!filterValues.value.includes(selectedSubCounty.value) && selectedSubCounty.value.length > 0) {
      filterValues.value.splice(index, 0, selectedSubCounty.value) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
    }

    // expunge the filter if the filter values are null
    if (selectedSubCounty.value.length === 0) {
      filters.value.splice(index, 1)
    }

  }


  // Filter by ward  
  if (selectedWard.value) {
    var selectOption = 'ward_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    var index = filters.value.indexOf(selectOption) // 1

    // clear previously selected
    if (filterValues[index]) {
      // filterValues[index].length = 0
      filterValues.value.splice(index, 1)
    }

    if (!filterValues.value.includes(selectedWard.value) && selectedWard.value.length > 0) {
      filterValues.value.splice(index, 0, selectedWard.value) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
    }

    // expunge the filter if the filter values are null
    if (selectedWard.value.length === 0) {
      filters.value.splice(index, 1)
    }

  }



  const formData = {}
  formData.limit = pSize.value
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = filters.value
  formData.filterValues = filterValues.value
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = nested_models
  //formData.cache_key = key

  //-------------------------
  console.log(formData)
  const res = await getSettlementListByCounty(formData)
  //const res = await getListWithoutGeo(formData)

  loadingGetData.value = false
  console.log('found data..', res)
  total.value = res.total
  if (tab === 'New') {
    tableDataListNew.value = res.data
    console.log('New', res.data)
    //  total.value = totalPending.value
    //  console.log('total ---',total.value)

  } else if (tab === 'Rejected') {
    tableDataListRejected.value = res.data
    //   total.value = totalRejected.value

  } else {
    tableDataList.value = res.data
    //  total.value=totalApproved.value

   // console.log('Keys >>>>', flattenNestedArrays(res.data))
   /// model_fields.value = await flattenNestedArrays(res.data)


   res.data.forEach(function (arrayItem) {
    var dd = flattenJSON(arrayItem)

    flattenedData.value.push(dd)
  })



   var obj = flattenJSON(res.data[0])

   console.log('flatteda', obj)
   model_fields.value  = Object.keys(obj);

   
  }

 

}
const flattenJSON = (obj = {}, res = {}, extraKey = '') => {
  for (let key in obj) {
    if (key !== 'geom' && key !== 'id' && key !== 'createdAt'&& key !== 'updatedAt'&& key !== 'email'&& key !== 'phone'&& key !== 'isApproved' && key !== 'createdBy' && key !== 'isActive' && key !== 'documents'&& key !== 'user' && key !== 'code' ) {
      if ((typeof obj[key] !== 'object' || obj[key] === null) && key !== 'id' ) {
        res[extraKey + key] = obj[key];
      } else if (Array.isArray(obj[key]) ) {
        obj[key].forEach((item, index) => {
          flattenJSON(item, res, `${extraKey}${key}.${index}.`);
        });
      } else {
        flattenJSON(obj[key], res, `${extraKey}${key}_`);
      }
    }
  }
  return res;
};


const model_fields = ref([])
const flattenedData = ref([])
const fieldColumns = ref(4)

const getFilteredData = async (selFilters, selfilterValues) => {
  loadingGetData.value = true

  console.log("loadingGetData", loadingGetData.value)
  const formData = {}
  formData.limit = pSize.value
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
  console.log('FormSubmitted', formData)
  const res = await getSettlementListByCounty(formData)

  console.log('After Querry - associated_multiple_models', res)
  tableDataList.value = res.data
  total.value = res.total
  loadingGetData.value = false


  // filter
  //if (showAdminButtons.value) {
  // getSettlementCount()  // This gets the approved/new/rejecetd counts

  //}

  // 


}



 


const viewHHs = (data: TableSlotDefault) => {
  console.log('On Click.....', data.row.id)
  push({
    path: '/settlement/hh/:id',
    name: 'Households',
    params: { id: data.row.id }
  })
}

const ShowReviewDialog = ref(false)
const RejectDialog = ref(false)
const settlement_raw = ref({})


const Review = (data: TableSlotDefault) => {
  console.log('On Click.....', data.row.id)
  ShowReviewDialog.value = true

  // make the descriptions dataset 
  settlement_raw.value.name = data.row.name
  settlement_raw.value.area = data.row.area
  settlement_raw.value.population = data.row.population
  settlement_raw.value.description = data.row.description
  settlement_raw.value.user = data.row.user.name + ' | ' + data.row.user.email
  settlement_raw.value.date = data.row.createdAt

  //
  ruleForm.id = data.row.id
  ruleForm.name = data.row.name
  ruleForm.county_id = data.row.county_id
  ruleForm.subcounty_id = data.row.subcounty_id
  ruleForm.ward_id = data.row.ward_id
  ruleForm.settlement_type = data.row.settlement_type
  ruleForm.population = data.row.population
  ruleForm.area = data.row.area
  ruleForm.description = data.row.description
  ruleForm.code = data.row.code
  ruleForm.geom = data.row.geom
  fileUploadList.value = data.row.documents


  formHeader.value = "Review Settlement"

}

const approve = async () => {
  console.log("Appprove")
  ruleForm.isApproved = 'Approved'
  ruleForm.reviewerId = userInfo.id

  console.log(ruleForm)
  ruleForm.model = 'settlement'
  console.log(ruleForm)
  await updateOneRecord(ruleForm).then(() => { })
  ShowReviewDialog.value = false
  getFilteredData(filters, filterValues)
}


const reject = async () => {
  RejectDialog.value = true
}

const rejectReason = ref('')
const confirmReject = async () => {
  console.log('Reject Msg', rejectReason.value)
  ruleForm.reject_msg = rejectReason.value
  ruleForm.isApproved = 'Rejected'

  console.log(ruleForm)
  ruleForm.model = 'settlement'
  ruleForm.reviewerId = userInfo.id
  console.log(ruleForm)
  await updateOneRecord(ruleForm).then(() => { })
  RejectDialog.value = false
  ShowReviewDialog.value = false

  getFilteredData(filters, filterValues)

}




const viewOnMap = (data: TableSlotDefault) => {
  console.log('On map.....', data.row)
  if (data.row.geom) {
    push({
      path: '/settlement/map/:id',
      name: 'SettlementMap',
      params: { id: data.row.id }
    })
  } else {
    // var msg = 'This Settlement does not have the boundary defined in the database!'
    // open(msg)
    ElMessage({
      message: 'This Settlement does not have the boundary defined in the database!',
      type: 'warning',
    })
    //    ElMessage("No Shapes")
  }
}




const showPagination = ref(true)



const getFilteredBySearchData = async (tab, searchKey) => {


  if (selectedCounty.value) {
    var selectOption = 'county_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    var index = filters.value.indexOf(selectOption) // 1

    // clear previously selected
    if (filterValues[index]) {
      // filterValues[index].length = 0
      filterValues.value.splice(index, 1)
    }

    if (!filterValues.value.includes(selectedCounty.value) && selectedCounty.value.length > 0) {
      filterValues.value.splice(index, 0, selectedCounty.value) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
    }

    // expunge the filter if the filter values are null
    if (selectedCounty.value.length === 0) {
      filters.value.splice(index, 1)
    }

  }

  // Filter by subcounty  
  if (selectedSubCounty.value) {
    var selectOption = 'subcounty_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    var index = filters.value.indexOf(selectOption) // 1

    // clear previously selected
    if (filterValues[index]) {
      // filterValues[index].length = 0
      filterValues.value.splice(index, 1)
    }

    if (!filterValues.value.includes(selectedSubCounty.value) && selectedSubCounty.value.length > 0) {
      filterValues.value.splice(index, 0, selectedSubCounty.value) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
    }

    // expunge the filter if the filter values are null
    if (selectedSubCounty.value.length === 0) {
      filters.value.splice(index, 1)
    }

  }


  const formData = {}
  formData.limit = pSize.value
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model

  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = searchKey
  //--Single Filter -----------------------------------------

  //formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = filters.value
  formData.filterValues = filterValues.value
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = nested_models
  formData.cache_key = 'SeacrchByKey_' + search_string.value

  //-------------------------
  console.log(formData)
  console.log('activeTab', tab)
  const res = await searchByKeyWord(formData)

  if (tab === 'list') {

    tableDataList.value = res.data

    



  } else if (tab === 'New') {
    tableDataListNew.value = res.data

  } else {
    tableDataListRejected.value = res.data


  }


  total.value = res.total
  loading.value = false


}

const searchByName = async (filterString: any) => {

  console.log('filterString', filterString)
  value3.value = filterString
  search_string.value = filterString

  getFilteredBySearchData(activeTab.value, search_string.value)
}



const countiesOptions = ref([])

const getCountyNames = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'county',
      searchField: '',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received countiess:', response)
    //tableDataList.value = response.data
    var ret = response.data

    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var countyOpt = {}
      countyOpt.value = arrayItem.id
      countyOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      countiesOptions.value.push(countyOpt)
    })
  })
}

const wardOptions = ref([])

const getWardNames = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'ward',
      searchField: 'subcounty_id',
      searchKeyword: selectedSubCounty.value,
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received Wards:', response)
    //tableDataList.value = response.data
    var ret = response.data
    wardOptions.value = []

    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var opt = {}
      opt.value = arrayItem.id
      opt.label = arrayItem.name + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      wardOptions.value.push(opt)
    })
  })
}


const subcountiesOptions = ref([])
const subcountyfilteredOptions = ref([])

const getSubCountyNames = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'subcounty',
      searchField: 'county_id',
      searchKeyword: selectedCounty.value,
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received subcounties response:', response)
    //tableDataList.value = response.data
    var ret = response.data
    subcountiesOptions.value = []
    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var subcountyOpt = {}
      subcountyOpt.value = arrayItem.id
      subcountyOpt.county_id = arrayItem.county_id
      subcountyOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      subcountiesOptions.value.push(subcountyOpt)
    })
  })
}





const filterByCounty = async (county_id: any) => {

  if (county_id) {
    enableSubcounty.value = true   // allow selection of subcounty 
    selectedCounty.value = county_id
    getSubCountyNames()
  }

  value5.value = null // clear the subcounty 
  value6.value = null   // clear the ward sr




  // var subset = [];
  // for (let i = 0; i < subcountiesOptions.value.length; i++) {
  //   if (subcountiesOptions.value[i].county_id == county_id) {
  //     subset.push(subcountiesOptions.value[i]);
  //   }
  // }
  // console.log('Subset--->', subset)
  // subcountyfilteredOptions.value = subset


  // getFilteredData(filters, filterValues)

  console.log(filters.value)

  if (search_string.value) {
    getFilteredBySearchData(activeTab.value, search_string.value)
  } else {
    getNewOrRejectedSettlements(activeTab.value)
  }


}


const filterBySubCounty = async (subcounty_id: any) => {

  value6.value = null   // clear the ward sr


  if (subcounty_id) {
    selectedSubCounty.value = subcounty_id
    getWardNames()
  }

  if (search_string.value) {
    getFilteredBySearchData(activeTab.value, search_string.value)
  } else {
    getNewOrRejectedSettlements(activeTab.value)
  }
}


const filterByWard = async (ward_id: any) => {

  if (ward_id) {
    selectedWard.value = ward_id
  }

  if (search_string.value) {
    getFilteredBySearchData(activeTab.value, search_string.value)
  } else {
    getNewOrRejectedSettlements(activeTab.value)
  }
}



//getSettlementsOptions()
getAllSetllementsInitially()


getCountyNames()
getSubCountyNames()


console.log('Options---->', interVentionTypeOptions)





const typeOptions = [
  {
    value: 1,
    label: 'Slum'
  },
  {
    value: 2,
    label: 'Informal Settlement'
  },

]


const documentCategory = ref()

const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ruleForm.model = model
      const result = await updateOneRecord(ruleForm)
      console.log(result.data)
      console.log(activeTab.value)

      var updatedObject = result.data


      if (activeTab.value === 'list') {
        // get the index of the updated object
        const index = tableDataList.value.findIndex(obj => obj.id === updatedObject.id);

        // Get the updatedobjetc keys and updated the old data 
        const updatedKeys = Object.keys(updatedObject);
        for (const key of updatedKeys) {
          tableDataList.value[index][key] = updatedObject[key];
          //   tableDataListNew.value[index_new][key] = updatedObject[key];
          //  tableDataListRejected.value[index_rej][key] = updatedObject[key];
        }
      } else if (activeTab.value === 'New') {

        // get the index of the updated object
        const index = tableDataListNew.value.findIndex(obj => obj.id === updatedObject.id);

        const updatedKeys = Object.keys(updatedObject);
        for (const key of updatedKeys) {
          tableDataListNew.value[index][key] = updatedObject[key];

        }
      }

      else if (activeTab.value === 'Rejected') {
        const index = tableDataListRejected.value.findIndex(obj => obj.id === updatedObject.id);

        const updatedKeys = Object.keys(updatedObject);
        for (const key of updatedKeys) {
          tableDataListRejected.value[index][key] = updatedObject[key];

        }

      }





    } else {
      console.log('error in editiinh!', fields)
    }
  })
}

const handleClose = () => {

  console.log("Closing the dialoig")
  showAddSaveButton.value = true
  showEditSaveButton.value = false

  ruleForm.name = null
  ruleForm.county_id = null
  ruleForm.population = null
  ruleForm.area = null
  ruleForm.description = null



  formheader.value = 'Add Settlement'
  AddDialogVisible.value = false

}





const activeName = ref('list')
const AddSettlement = () => {
  push({
     name: 'AddSettlementX'
  })
}

const AddDialogVisible = ref(false)
const formHeader = ref('Edit Settlement')

const editSettlement = (data: TableSlotDefault) => {

  push({
  name: 'AddSettlementX',
    query: { id: data.row.id }
  
  });


  showEditSaveButton.value = true

  console.log(data)
  ruleForm.id = data.row.id
  ruleForm.name = data.row.name
  ruleForm.county_id = data.row.county_id
  ruleForm.settlement_type = data.row.settlement_type
  ruleForm.population = data.row.population
  ruleForm.area = data.row.area
  ruleForm.description = data.row.description
  ruleForm.code = data.row.code
  ruleForm.dist_town = data.row.dist_town
  ruleForm.dist_trunk = data.row.dist_trunk
  ruleForm.parcel_no = data.row.parcel_no
  ruleForm.parcel_owner = data.row.parcel_owner
  ruleForm.rim_no = data.row.rim_no
  ruleForm.isApproved = data.row.isApproved
  ruleForm.subcounty_id = data.row.subcounty_id
  ruleForm.ward_id = data.row.ward_id
  ruleForm.isApproved = data.row.isApproved
  ruleForm.geom = data.row.geom
  fileUploadList.value = data.row.documents

  //  poulate the selected fields 
  selectedCounty.value = data.row.county_id
  selectedSubCounty.value = data.row.subcounty_id
  selectedWard.value = data.row.ward_id
  getSubCountyNames()
  //filterByCounty(selectedCounty.value)
  getWardNames()



  //AddDialogVisible.value = true
}

const removeDocument = (data: TableSlotDefault) => {
  console.log('----->', data)
  let formData = {}
  formData.id = data.id
  formData.model = model
  formData.filesToDelete = [data.name]
  deleteDocument(formData)
}


const DeleteSettlement = (data: TableSlotDefault) => {
  console.log('----->', data)
  let formData = {}
  formData.id = data.id
  formData.model = model

  DeleteRecord(formData).then(response => {
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

  console.log(tableDataList.value)

  // Delete docuemnts only if there's any docuemnt to delete 
  if (data.documents.length > 0) {
    formData.filesToDelete = data.documents

    deleteDocument(formData)

  }


}





const decommisionSettlement = async (data: TableSlotDefault) => {

  console.log(data)
  ruleForm.id = data.id
  ruleForm.name = data.name
  ruleForm.county_id = data.county_id
  ruleForm.settlement_type = data.settlement_type
  ruleForm.population = data.population
  ruleForm.area = data.area
  ruleForm.description = data.description
  ruleForm.code = data.code
  ruleForm.dist_town = data.dist_town
  ruleForm.dist_trunk = data.dist_trunk
  ruleForm.parcel_no = data.parcel_no
  ruleForm.parcel_owner = data.parcel_owner
  ruleForm.rim_no = data.rim_no
  ruleForm.isApproved = data.isApproved
  ruleForm.subcounty_id = data.subcounty_id
  ruleForm.ward_id = data.ward_id
  ruleForm.isApproved = data.isApproved
  ruleForm.geom = data.geom

  // keep  decommision here !
  ruleForm.isActive = 'false'

  ruleForm.model = model
  const result = await updateOneRecord(ruleForm)
  console.log('archving data', result.data)
  console.log(activeTab.value)

  var updatedObject = result.data


  if (activeTab.value === 'list') {
    // get the index of the updated object
    const index = tableDataList.value.findIndex(obj => obj.id === updatedObject.id);

    // Get the updatedobjetc keys and updated the old data 
    const updatedKeys = Object.keys(updatedObject);
    for (const key of updatedKeys) {
      tableDataList.value[index][key] = updatedObject[key];
      //   tableDataListNew.value[index_new][key] = updatedObject[key];
      //  tableDataListRejected.value[index_rej][key] = updatedObject[key];
    }
  } else if (activeTab.value === 'New') {

    // get the index of the updated object
    const index = tableDataListNew.value.findIndex(obj => obj.id === updatedObject.id);

    const updatedKeys = Object.keys(updatedObject);
    for (const key of updatedKeys) {
      tableDataListNew.value[index][key] = updatedObject[key];

    }
  }

  else if (activeTab.value === 'Rejected') {
    const index = tableDataListRejected.value.findIndex(obj => obj.id === updatedObject.id);

    const updatedKeys = Object.keys(updatedObject);
    for (const key of updatedKeys) {
      tableDataListRejected.value[index][key] = updatedObject[key];

    }

  }

}

const showSelectFields =ref(false)
const selectedFields =ref([])


const DownloadXlsx = async () => {
  showSelectFields.value=true

 } 


const handleDownloadSelectFields = async () => {
   console.log('selectedFields ---', selectedFields.value)

  if (selectedFields.value.length < 1) {
    ElMessage.warning('Specify the fields you want on the exported file')
    return 
    
   }

 

  let fields =[]

  for (let i = 0; i < selectedFields.value.length; i++) { 
    var fld = {}
    fld.label=selectedFields.value[i]
    fld.value = selectedFields.value[i]
    fields.push(fld)
  }

  console.log(fields)

   


  // Preprae the data object 
  var dataObj = {}
  dataObj.sheet = 'data'
  dataObj.columns = fields

  let dataHolder = []
  // loop through the table data and sort the data 
  // change here !
  for (let i = 0; i < flattenedData.value.length; i++) {
    let thisRecord = {}

 //   console.log('flattened ??',i,  flattenedData.value[i])
     
    thisRecord.index = i + 1

    for (let j = 0; j < fields.length; j++) {
      var fld = fields[j].label
      thisRecord[fld] = flattenedData.value[i][fld]

      console.log('fld',thisRecord)


    }
    // thisRecord.name = tableDataList.value[i].name
    // thisRecord.county = tableDataList.value[i].county.name
    // thisRecord.population = tableDataList.value[i].population
    // thisRecord.area = tableDataList.value[i].area
    // thisRecord.description = tableDataList.value[i].description
    // thisRecord.code = tableDataList.value[i].code
    // thisRecord.CountyID = tableDataList.value[i].county_id
    // thisRecord.SubcountyID = tableDataList.value[i].subcounty ? tableDataList.value[i].subcounty.id : null;


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


 

console.log('IsMobile', isMobile)

const dialogWidth = ref()
const actionColumnWidth = ref()

if (isMobile.value) {
  dialogWidth.value = "90%"
  actionColumnWidth.value = "80px"
} else {
  dialogWidth.value = "25%"
  actionColumnWidth.value = "200px"

}

const DocTypes = ref([])
const getDocumentTypes = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'document_type',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Document Typest:', response)
    //tableDataList.value = response.data
    var ret = response.data


    const nestedData = ret.reduce((acc, cur) => {
      const group = cur.group;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(cur);
      return acc;
    }, {});

    console.log(nestedData.Map)
    for (let property in nestedData) {
      let opts = nestedData[property];
      var doc = {}
      doc.label = property
      doc.options = []

      opts.forEach(function (arrayItem) {
        let opt = {}
        opt.value = arrayItem.id
        opt.label = arrayItem.type
        doc.options.push(opt)

      })
      DocTypes.value.push(doc)

    }
    console.log(DocTypes)

  })
}
getDocumentTypes()




const readShp = async (file) => {
  console.log('Reading Shp file....')

  // await getGeoJSON(file)
  readShapefileAndConvertToGeoJSON(file)
    .then((geojson) => {

      console.log("Geo>", geojson.length)
      console.log("Geo1>", geojson[0])


      if (geojson.length != 1) {
        ElMessage.warning('Please uplaod a file with only one feature. This one has ' + geojson.length + ' features')

      }
      else {
        console.log('ok>>', geojson[0])
        let geom = {
          type: geojson[0].geometry.type,
          coordinates: geojson[0].geometry.coordinates
        }
        console.log(geom)
        ruleForm.geom = geom

        console.log(ruleForm)
      }


    })
    .catch((error) => {
      console.error(error)
      ElMessage.error('Invalid shapefiles. Check your zipped file')


    })

  //uploadPolygon(feat)
}

const readJson = (event) => {
  console.log('Reading Josn file....', event)
  let str = event.target.result


  let json = JSON.parse(str)
  console.log('parsed', json.crs)

  const targetProj = "+proj=longlat +datum=WGS84 +no_defs"


  // const sourceProj = '+proj=utm +zone=37 +ellps=WGS84 +datum=WGS84 +units=m +no_defs';
  let sourceProj
  let epsgCode
  let crsProp = json.crs ? json.crs.properties.name : null;

  if (crsProp && crsProp.includes('EPSG')) {
    console.log('The string contains the character "EPSG"');
    epsgCode = crsProp.match(/EPSG::(\d+)/)[1]
  } else {
    epsgCode = 4326
  }


  console.log(epsgCode)


  console.log(epsgCode)

  if (epsgCode == 21037) {
    // zone 37S
    sourceProj = "+proj=utm + zone=37 + south + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs";
  }
  else if (epsgCode == 21097) {
    // zone 37 N
    sourceProj = "+proj=utm + zone=37 + north + a=6378249.145 + rf=293.465 + towgs84=-157,-2,-299,0,0,0,0 + units=m + no_defs";
  }
  else if (epsgCode == 21036) {
    // zone 36 S
    sourceProj = "+proj=utm + zone=36 + south + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs";
  }
  else if (epsgCode == 21096) {
    // zone 36N
    sourceProj = "+proj=utm + zone=36 + north + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs";
  }

  else {
    sourceProj = "+proj=longlat +datum=WGS84 +no_defs"

  }


  proj4.defs("SOURCE_CRS", sourceProj);
  proj4.defs("WGS84", targetProj);


  if (json.features.length != 1) {
    ElMessage.warning('Please uplaod a file with only one feature. This one has ' + json.features.length + ' features')

  }
  else {
    console.log('ok>>', json.features)

    const geometry = json.features[0].geometry;
    console.log(geometry)
    // Check if the geometry type is "Polygon" or "MultiPolygon"
    if (geometry.type === "Polygon") {
      // If it's a single polygon, project its coordinates
      geometry.coordinates[0] = geometry.coordinates[0].map(coordinate => {
        return proj4("SOURCE_CRS", "WGS84", coordinate);
      });
    } else if (geometry.type === "MultiPolygon") {
      // If it's a multi-polygon, loop through all polygons and project their coordinates
      geometry.coordinates.forEach(polygon => {
        polygon[0] = polygon[0].map(coordinate => {
          return proj4("SOURCE_CRS", "WGS84", coordinate);
        });
      });
    }

    console.log('geometry', geometry)
    let geom = {
      type: json.features[0].geometry.type,
      coordinates: geometry.coordinates
    }
    console.log(geom)
    ruleForm.geom = geom
  }

}

const handleUploadGeo = async (uploadFile) => {
  console.log('Upload>>>', uploadFile)
  //  uploadRef.value!.submit()

  console.log("File type", uploadFile.name.split('.').pop())
  var fileType = uploadFile.name.split('.').pop()
  var rfile = uploadFile.raw

  let reader = new FileReader()
  console.log(reader)

  //var mydata = JSON.parse(uploadFile);

  if (fileType === 'geojson' || fileType === 'json') {
    reader.onload = readJson
    reader.readAsText(rfile)
  }
  else if (fileType === 'zip') {
    readShp(rfile)

    // reader.readAsArrayBuffer(rfile)
  } else {
    ElMessage.error('Only geojson or zipped shapefiles are supported at the moment')


  }


}

const tableRowClassName = (data) => {
  // console.log('Row Styling --------->', data.row)
  if (data.row.documents.length > 0) {
    return 'warning-row'
  }
  return ''
}

const activeStep = ref(0)
const next = () => {
  if (activeStep.value++ > 2) activeStep.value = 0
}

const copyToClipboard = (code) => {
  navigator.clipboard.writeText(code)
    .then(() => {
      ElMessage({
        message: 'Code copied to clipboard!',
        type: 'success'
      });
    })
    .catch((error) => {
      console.error(error);
      ElMessage.error('Failed to copy code to clipboard');
    });
}

const hoveredRow = ref()
const showCopyIcon = (row) => {
  hoveredRow.value = row;
}
const hideCopyIcon = (row) => {
  if (hoveredRow.value === row) {
    hoveredRow.value = null;
  }
}

const isCopyIconVisible = (row) => {
  return hoveredRow.value === row;
}



const handleSelectCounty = async (county_id: any) => {
  selectedCounty.value = county_id
  ruleForm.subcounty_id = ''
  ruleForm.ward_id = ''
  getSubCountyNames()

}

const handleSelectSubCounty = async (subcounty_id: any) => {
  selectedSubCounty.value = subcounty_id
  ruleForm.ward_id = ''
  getWardNames()

}

/// Uplaod docuemnts from a central component 
const mfield = 'settlement_id'
const ChildComponent = defineAsyncComponent(() => import('@/views/Components/UploadComponent.vue'));
const selectedRow = ref([])
const dynamicComponent = ref();
 const componentProps = ref({
      message: 'Hello from parent',
      showDialog:addMoreDocuments,
      data:currentRow.value,
      umodel:model,
      field:mfield
    });

 
 
function toggleComponent(row) {
  console.log('Compnnent data', row)
      componentProps.value.data=row
      dynamicComponent.value = null; // Unload the component
      addMoreDocuments.value = true; // Set any additional props

      setTimeout(() => {
        dynamicComponent.value = ChildComponent; // Load the component
  }, 100); // 0.1 seconds


    }


    
// component for docuemnts 
const rowData = ref()
const documentComponent = defineAsyncComponent(() => import('@/views/Components/ListDocuments.vue'));
const dynamicDocumentComponent = ref();
const DocumentComponentProps = ref({
  message: 'documents',
  data: rowData.value,
  docmodel: model,

});


function handleExpand(row) {
   dynamicDocumentComponent.value = null; // Unload the component
    rowData.value = row
    DocumentComponentProps.value.data = row
    setTimeout(() => {
      dynamicDocumentComponent.value = documentComponent; // Load the component
    }, 100); // 0.1 seconds
}




// Revised molde for downlaod

const getModeldefinition = async ( ) => {
 
var formData = {}
formData.model = model
console.log("gettign fields")


await getModelSpecs(formData).then((response) => {

  var data = response.data

  var fields = data.filter(function (obj) {
    return (obj.field !== 'id');
  });

  var fields2 = fields.filter(function (obj) {
    return (obj.field !== 'geom' && obj.field !=='isApproved' && obj.field !=='createdBy' && obj.field !=='updatedAt'  && obj.field !=='createdAt'     );
  });

  fields2.forEach(function (arrayItem: { field: string }) {
       model_fields.value.push(arrayItem.field)
  })
    console.log(model_fields.value)
})


}


// get model fields 

//  getModeldefinition()

console.log('model_fields.value', model_fields.value )

</script>

<template>
  <ContentWrap
:title="t('Settlements')" :message="t('Use the county, subcounty and ward filters to subset')"
    v-loading="loadingGetData" element-loading-text="Loading the data.. Please wait.......">



    <div v-if="dynamicComponent">
      <upload-component :is="dynamicComponent" v-bind="componentProps"/>
    </div>


    <el-row>
      <el-col :xs="24" :sm="24" :md="4" :lg="4" :xl="4">
        <div style="display: inline-block; margin-top: 5px;  margin-right: 5px">
          <el-select
size="default" v-model="value4" :onChange="filterByCounty" :onClear="handleClear" multiple clearable
            filterable collapse-tags placeholder="By County">
            <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
      </el-col>
      <el-col :xs="24" :sm="24" :md="6" :lg="4" :xl="4">
        <div style="display: inline-block; margin-top: 5px;  margin-right: 5px">
          <el-select
:disabled="!enableSubcounty" size="default" v-model="value5" :onChange="filterBySubCounty" multiple
            clearable filterable collapse-tags placeholder="By Subcounty">
            <el-option v-for="item in subcountiesOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>

      </el-col>

      <el-col :xs="12" :sm="12" :md="12" :lg="4" :xl="4">
        <div style="display: inline-block; margin-top: 5px;  margin-right: 5px">
          <el-select
:disabled="!enableSubcounty" size="default" v-model="value6" :onChange="filterByWard" multiple
            clearable filterable collapse-tags placeholder="By Ward">
            <el-option v-for="item in wardOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>

      </el-col>


      <el-col :xs="24" :sm="24" :md="6" :lg="4" :xl="4">
        <div style="display: inline-block; margin-top: 5px">

          <el-input
v-model="search_string" :suffix-icon="Search" placeholder="Enter search text"
            :onInput="searchByName" />

        </div>
      </el-col>
      <el-col :xs="24" :sm="24" :md="6" :lg="6" :xl="6">
        <div style="display: inline-block; margin-top: 5px">
          <div style="display: inline-block; margin-left: 5px">
            <el-button :onClick="handleClear" type="primary" :icon="Filter" />
          </div>

          <div style="display: inline-block; margin-left: 5px">
            <el-tooltip content="Add Settlement" placement="top">
              <el-button v-if="showEditButtons" :onClick="AddSettlement" type="primary" :icon="Plus" />
            </el-tooltip>
          </div>

          <div style="display: inline-block; margin-left: 5px">
            <el-tooltip content="Download" placement="top">
              <el-button :onClick="DownloadXlsx" type="primary" :icon="Download" />
            </el-tooltip>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-tabs @tab-click="clickTab" v-model="activeName" class="custom-tab">
      <el-tab-pane name="list">
        <template #label>
          <span class="custom-tabs-label">
            <el-badge type="primary" :value="totalApproved" class="item">
              <el-button link>List</el-button>
            </el-badge>
          </span>
        </template>

        <el-table :data="tableDataList" style="width: 100%" border :row-class-name="tableRowClassName"    @expand-change="handleExpand">
          <el-table-column type="expand">
            <template #default="props">
              <div m="4">
                <h3>Documents</h3>
                <div>
                  <list-documents :is="dynamicDocumentComponent" v-bind="DocumentComponentProps" />
                </div>
                 <el-button style="margin-left: 10px;margin-top: 5px" size="small" v-if="showEditButtons" type="success" :icon="Plus" circle @click="toggleComponent(props.row)" />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="ID" prop="id" sortable />
          <el-table-column label="Name" width="200" prop="name" sortable />
          <el-table-column label="County" prop="county.name" sortable />
          <el-table-column label="Subcounty" prop="subcounty.name" sortable />
          <el-table-column label="Ward" prop="ward.name" sortable />
          <el-table-column label="Population" prop="population" sortable />
          <el-table-column label="Area(HA)" prop="area" sortable />
          <el-table-column label="Code" prop="code" sortable>
            <template #default="{ row }">
              <div style="position: relative;" @mouseenter="showCopyIcon(row)" @mouseleave="hideCopyIcon(row)">
                <span>{{ row.code }}</span>
                <el-tooltip class="item" effect="dark" content="Copy" placement="top">
                  <el-button
v-show="isCopyIconVisible(row)" type="information" size="small" :icon="CopyDocument" circle
                    plain style="position: absolute; top: 50%; right: 0; transform: translateY(-50%); margin-right: 5px;"
                    @click="copyToClipboard(row.code)" />

                </el-tooltip>
              </div>
            </template>
          </el-table-column>

          <el-table-column fixed="right" label="Actions" :width="actionColumnWidth">
            <template #default="scope">
              <el-dropdown v-if="isMobile">
                <span class="el-dropdown-link">
                  <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
v-if="showEditButtons" @click="editSettlement(scope as TableSlotDefault)"
                      :icon="Edit">Edit</el-dropdown-item>
                    <el-dropdown-item
@click="viewOnMap(scope as TableSlotDefault)"
                      :icon="Position">Map</el-dropdown-item>
                    <el-dropdown-item
v-if="showAdminButtons" @click="DeleteSettlement(scope.row as TableSlotDefault)"
                      :icon="Delete" color="red">Delete</el-dropdown-item>

                  </el-dropdown-menu>
                </template>
              </el-dropdown>


              <div v-else>
                <el-tooltip v-if="showEditButtons" content="Edit" placement="top">
                  <el-button
type="success" size="small" :icon="Edit" @click="editSettlement(scope as TableSlotDefault)"
                    circle />
                </el-tooltip>
                <el-tooltip content="View on Map" placement="top">
                  <el-button
type="warning" size="small" :icon="Position" @click="viewOnMap(scope as TableSlotDefault)"
                    circle />
                </el-tooltip>

                <el-tooltip content="View Households" placement="top">
                  <el-button
v-show="showAdminButtons" type="success" size="small" :icon="User"
                    @click="viewHHs(scope as TableSlotDefault)" circle />
                </el-tooltip>
                <el-tooltip v-if="showAdminButtons" content="Delete" placement="top">
                  <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
                    title="Are you sure to delete this report?"
                    @confirm="DeleteSettlement(scope.row as TableSlotDefault)">
                    <template #reference>
                      <el-button type="danger" size="small" :icon=Delete circle />
                    </template>
                  </el-popconfirm>
                </el-tooltip>
                <el-tooltip v-if="showAdminButtons" content="Decommision" placement="top">
                  <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
                    title="Are you sure to decommision this settlement??"
                    @confirm="decommisionSettlement(scope.row as TableSlotDefault)">
                    <template #reference>
                      <el-button type="danger" size="small" :icon=Briefcase circle />
                    </template>
                  </el-popconfirm>
                </el-tooltip>
              </div>
            </template>

          </el-table-column>

        </el-table>


      </el-tab-pane>

      <el-tab-pane name="New" v-if=showEditButtons>
        <template #label>
          <span class="custom-tabs-label">
            <el-badge type="success" :value="totalPending" class="item">
              <el-button link>New</el-button>
            </el-badge>
          </span>
        </template>

        <el-table :data="tableDataListNew" style="width: 100%" border :row-class-name="tableRowClassName" @expand-change="handleExpand">
          <el-table-column type="expand">
            <template #default="props">
              <div m="4">
                <h3>Documents</h3>
                <div>
                  <list-documents :is="dynamicDocumentComponent" v-bind="DocumentComponentProps" />
                </div>
                 <el-button style="margin-left: 10px;margin-top: 5px" size="small" v-if="showEditButtons" type="success" :icon="Plus" circle @click="toggleComponent(props.row)" />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="ID" prop="id" sortable />
          <el-table-column label="Name" width="200" prop="name" sortable />
          <el-table-column label="County" prop="county.name" sortable />
          <el-table-column label="Subcounty" prop="subcounty.name" sortable />
          <el-table-column label="Ward" prop="ward.name" sortable />

          <el-table-column label="Population" prop="population" sortable />
          <el-table-column label="Area(HA)" prop="area" sortable />
          <el-table-column label="Code" prop="code" sortable>
            <template #default="{ row }">
              <div style="position: relative;" @mouseenter="showCopyIcon(row)" @mouseleave="hideCopyIcon(row)">
                <span>{{ row.code }}</span>
                <el-tooltip class="item" effect="dark" content="Copy" placement="top">
                  <el-button
v-show="isCopyIconVisible(row)" type="information" size="small" :icon="CopyDocument" circle
                    plain style="position: absolute; top: 50%; right: 0; transform: translateY(-50%); margin-right: 5px;"
                    @click="copyToClipboard(row.code)" />

                </el-tooltip>
              </div>
            </template>
          </el-table-column> >
          <el-table-column fixed="right" label="Actions" :width="actionColumnWidth">
            <template #default="scope">
              <el-dropdown v-if="isMobile">
                <span class="el-dropdown-link">
                  <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
v-if="showEditButtons" @click="editSettlement(scope as TableSlotDefault)"
                      :icon="Edit">Edit</el-dropdown-item>
                    <el-dropdown-item
@click="viewOnMap(scope as TableSlotDefault)"
                      :icon="Position">Map</el-dropdown-item>
                    <el-dropdown-item
v-if="showAdminButtons" @click="DeleteSettlement(scope.row as TableSlotDefault)"
                      :icon="Delete" color="red">Delete</el-dropdown-item>

                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <div v-else>
                <el-tooltip v-if="showEditButtons" content="Edit" placement="top">
                  <el-button
type="success" size="small" :icon="Edit" @click="editSettlement(scope as TableSlotDefault)"
                    circle />
                </el-tooltip>
                <el-tooltip content="View on Map" placement="top">
                  <el-button
type="warning" size="small" :icon="Position" @click="viewOnMap(scope as TableSlotDefault)"
                    circle />
                </el-tooltip>

                <el-tooltip content="Review" placement="top">
                  <el-button
v-show="showAdminButtons" type="success" size="small" :icon="View"
                    @click="Review(scope as TableSlotDefault)" circle />
                </el-tooltip>
                <el-tooltip v-if="showAdminButtons" content="Delete" placement="top">
                  <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
                    title="Are you sure to delete this settlement?"
                    @confirm="DeleteSettlement(scope.row as TableSlotDefault)">
                    <template #reference>
                      <el-button type="danger" size="small" :icon=Delete circle />
                    </template>
                  </el-popconfirm>
                </el-tooltip>
                <el-tooltip v-if="showAdminButtons" content="Decommision" placement="top">
                  <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
                    title="Are you sure to decommision this settlement??"
                    @confirm="decommisionSettlement(scope.row as TableSlotDefault)">
                    <template #reference>
                      <el-button type="danger" size="small" :icon=Briefcase circle />
                    </template>
                  </el-popconfirm>
                </el-tooltip>
              </div>
            </template>

          </el-table-column>

        </el-table>


      </el-tab-pane>

      <el-tab-pane name="Rejected" v-if=showEditButtons :badge="5">
        <template #label>
          <span class="custom-tabs-label">
            <el-badge :value="totalRejected" class="item">
              <el-button link>Rejected</el-button>
            </el-badge>
          </span>
        </template>
        <el-table :data="tableDataListRejected" style="width: 100%" border :row-class-name="tableRowClassName" @expand-change="handleExpand">
          <el-table-column type="expand">
            <template #default="props">
              <div m="4">
                <h3>Documents</h3>
                <div>
                  <list-documents :is="dynamicDocumentComponent" v-bind="DocumentComponentProps" />
                </div>
                 <el-button style="margin-left: 10px;margin-top: 5px" size="small" v-if="showEditButtons" type="success" :icon="Plus" circle @click="toggleComponent(props.row)" />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="ID" prop="id" sortable />
          <el-table-column label="Name" width="200" prop="name" sortable />
          <el-table-column label="County" prop="county.name" sortable />
          <el-table-column label="Subcounty" prop="subcounty.name" sortable />
          <el-table-column label="Ward" prop="ward.name" sortable />

          <el-table-column label="Population" prop="population" sortable />
          <el-table-column label="Area(HA)" prop="area" sortable />
          <el-table-column label="Code" prop="code" sortable>
            <template #default="{ row }">
              <div style="position: relative;" @mouseenter="showCopyIcon(row)" @mouseleave="hideCopyIcon(row)">
                <span>{{ row.code }}</span>
                <el-tooltip class="item" effect="dark" content="Copy" placement="top">
                  <el-button
v-show="isCopyIconVisible(row)" type="information" size="small" :icon="CopyDocument" circle
                    plain style="position: absolute; top: 50%; right: 0; transform: translateY(-50%); margin-right: 5px;"
                    @click="copyToClipboard(row.code)" />

                </el-tooltip>
              </div>
            </template>
          </el-table-column>


          <el-table-column fixed="right" label="Actions" :width="actionColumnWidth">
            <template #default="scope">
              <el-dropdown v-if="isMobile">
                <span class="el-dropdown-link">
                  <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
v-if="showEditButtons" @click="editSettlement(scope as TableSlotDefault)"
                      :icon="Edit">Edit</el-dropdown-item>
                    <el-dropdown-item
@click="viewOnMap(scope as TableSlotDefault)"
                      :icon="Position">Map</el-dropdown-item>
                    <el-dropdown-item
v-if="showAdminButtons" @click="DeleteSettlement(scope.row as TableSlotDefault)"
                      :icon="Delete" color="red">Delete</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <div v-else>
                <el-tooltip content="View on Map" placement="top">
                  <el-button
type="warning" size="small" :icon="Position" @click="viewOnMap(scope as TableSlotDefault)"
                    circle />
                </el-tooltip>
                <el-tooltip content="Review" placement="top">
                  <el-button
v-show="showAdminButtons" type="success" size="small" :icon="View"
                    @click="Review(scope as TableSlotDefault)" circle />
                </el-tooltip>
                <el-tooltip content="Delete" placement="top">
                  <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
                    title="Are you sure to delete this report?"
                    @confirm="DeleteSettlement(scope.row as TableSlotDefault)">
                    <template #reference>
                      <el-button v-if="showAdminButtons" type="danger" size="small" :icon=Delete circle />
                    </template>
                  </el-popconfirm>
                </el-tooltip>

                <el-tooltip content="Decommision" placement="top">
                  <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
                    title="Are you sure to decommision this settlement??"
                    @confirm="decommisionSettlement(scope.row as TableSlotDefault)">
                    <template #reference>
                      <el-button v-if="showAdminButtons" type="danger" size="small" :icon=Briefcase circle />
                    </template>
                  </el-popconfirm>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>



      <ElPagination
v-if="showPagination" layout="sizes, prev, pager, next, total" v-model:currentPage="page"
        v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 200, 1000]" :total="total" :background="true"
        @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
    </el-tabs>
    <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formheader" :width="dialogWidth" draggable>
      <el-steps :active="activeStep" finish-button-center simple style="margin-bottom: 10px;">
        <el-step description="Basic Info" :icon="Loading" />
        <el-step description="Details" :icon="Setting" />
        <el-step description="Geometry" :icon="Position" />

      </el-steps>




      <el-row :gutter="10">
        <el-col v-show="activeStep === 0" :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
          <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-position="left">
            <el-form-item label="County" prop="county_id">
              <el-select
v-model="ruleForm.county_id" filterable placeholder="Select County"
                :onChange="handleSelectCounty">
                <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>

            <el-form-item label="Sub County" prop="subcounty_id">
              <el-select
v-model="ruleForm.subcounty_id" filterable placeholder="Select Subcounty"
                :onChange="handleSelectSubCounty">
                <el-option v-for="item in subcountiesOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>

            <el-form-item label="Ward" prop="ward_id">
              <el-select v-model="ruleForm.ward_id" filterable placeholder="Select ward">
                <el-option v-for="item in wardOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>


            <el-form-item label="Name">
              <el-input v-model="ruleForm.name" />
            </el-form-item>
            <el-form-item label="Type" prop="settlement_type">
              <el-select v-model="ruleForm.settlement_type" filterable placeholder="Select type">
                <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Population">
              <el-input-number v-model="ruleForm.population" />
            </el-form-item>
            <el-form-item label="Area(ha)">
              <el-input-number v-model="ruleForm.area" />
            </el-form-item>
          </el-form>
        </el-col>

        <el-col v-show="activeStep === 1" :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
          <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-position="left">
            <el-form-item label="Dist. to Nearest Urban Center(Km.)" prop="dist_town" label-width="240px">
              <el-input-number v-model="ruleForm.dist_town" />
            </el-form-item>
            <el-form-item label="Dist.to Nearest Trunk Road(Km.)" prop="dist_trunk" label-width="240px">
              <el-input-number v-model="ruleForm.dist_trunk" />
            </el-form-item>


            <el-form-item label="Parcel Number" prop="parcel_no">
              <el-input v-model="ruleForm.parcel_no" />
            </el-form-item>

            <el-form-item label="Parcel owner" prop="parcel_owner">
              <el-input v-model="ruleForm.parcel_owner" />
            </el-form-item>

            <el-form-item label="RIM Ref." prop="rim_no">
              <el-input v-model="ruleForm.rim_no" />
            </el-form-item>
            <el-form-item label="Description">
              <el-input maxlength="200" type="textarea" v-model="ruleForm.description" />
            </el-form-item>
          </el-form>

        </el-col>




        <el-col v-show="activeStep === 2" :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
          <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-position="left">
            <el-form-item label="Geometry">
              <el-upload :on-change="handleUploadGeo" multiple :limit="3" :auto-upload="false">
                <el-button type="primary">Click to upload</el-button>
                <template #tip>
                  <div class="el-upload__tip">
                    geojson or zipped shapefile
                  </div>
                </template>
              </el-upload>
            </el-form-item>
          </el-form>
        </el-col>
      </el-row>
      <template #footer>
        <span class="dialog-footer space-between">
          <el-row :gutter="10">

            <el-col :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
              <el-button @click="next">Next</el-button>

              <el-button @click="AddDialogVisible = false">Cancel</el-button>
              <el-button v-if="showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>
            </el-col>
          </el-row>
        </span>
      </template>
    </el-dialog>
  
    <!-- <el-dialog v-model="showSelectFields" title="Select Fields" width="50%">
      <el-checkbox-group   v-model="selectedFields">
    <el-checkbox v-for="field in model_fields" :key="field" :name="field" :label="field">{{ field }}</el-checkbox>
    </el-checkbox-group>
      <el-button type="secondary" @click="handleDownloadSelectFields()">Submit</el-button>
    </el-dialog>   -->

    
    <el-dialog v-model="showSelectFields" title="Select Fields" width="50%">
  <el-row>
    <el-col :span="6" v-for="(field, index) in model_fields" :key="index">
      <el-checkbox v-model="selectedFields" :label="field">{{ field }}</el-checkbox>
    </el-col>
  </el-row>
  <el-button type="success" @click="handleDownloadSelectFields()">Download</el-button>
</el-dialog>



    <el-dialog v-model="ShowReviewDialog" @close="handleClose" :title="formHeader" :width="reviewWindowWidth" draggable>
      <el-descriptions title="" direction="vertical" :column="2" size="small" border>
        <el-descriptions-item label="Name">{{ settlement_raw.name }}</el-descriptions-item>
        <el-descriptions-item label="Area(Ha)" :span="2">{{ settlement_raw.area }}</el-descriptions-item>
        <el-descriptions-item label="Population">{{ settlement_raw.population }}</el-descriptions-item>
        <el-descriptions-item label="Description"> {{ settlement_raw.description }} </el-descriptions-item>
        <el-descriptions-item label="Submitted By"> {{ settlement_raw.user }} </el-descriptions-item>
        <el-descriptions-item label="Date"> {{ settlement_raw.date }} </el-descriptions-item>
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

  </ContentWrap>
</template>
 



<style scoped>
.basemap {
  width: 100%;
  height: 400px;
}
</style>

<style>
.el-table .warning-row {
  --el-table-tr-bg-color: var(--el-color-warning-light-9);
}

.el-table .success-row {
  --el-table-tr-bg-color: var(--el-color-success-light-9);
}
</style>





<style>
.el-row {
  margin-bottom: 20px;
}

.el-row:last-child {
  margin-bottom: 0;
}

.el-col {
  border-radius: 4px;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
}

.item {
  margin-top: 10px;
  margin-right: 40px;
}


.demo-tabs>.el-tabs__content {
  padding: 32px;
  color: #6b778c;
  font-size: 32px;
  font-weight: 600;
}

.demo-tabs .custom-tabs-label .el-icon {
  vertical-align: middle;
}

.demo-tabs .custom-tabs-label span {
  vertical-align: middle;
  margin-left: 4px;
}

.custom-tab.is-active {
  color: red;
}
</style>

