<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty, getHHsByCounty, uploadFilesBatch} from '@/api/settlements'
import { getCountyListApi, getListWithoutGeo } from '@/api/counties'
import {
  ElButton, ElSelect, FormInstance, ElDialog, ElForm, ElFormItem, ElCard, ElTable, ElRow, ElCol,
  ElTableColumn, UploadUserFile, ElDropdown, ElDropdownItem, ElDropdownMenu, ElInput, ElDrawer
} from 'element-plus'
import { ElMessage } from 'element-plus'
import { Position, TopRight, Plus, User, Download, Delete, Edit, Filter, InfoFilled, Back, More, CircleCloseFilled } from '@element-plus/icons-vue'

import { ref, reactive, computed, h } from 'vue'
import { ElPagination, ElTooltip, ElOption, ElDivider } from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { CreateRecord, DeleteRecord, updateOneRecord, deleteDocument, uploadDocuments, getfilteredGeo } from '@/api/settlements'

import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { uuid } from 'vue-uuid'
import { getFile } from '@/api/summary'
import PermissionWrapper from '@/components/PermissionWrapper.vue'

import { getAllGeo } from '@/api/settlements'
import {
  searchByKeyWord
} from '@/api/settlements'

import { useRoute } from 'vue-router'



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

import * as enums from '@/utils/enums'
import DownloadCustom from '@/views/Components/DownloadCustom.vue';

import { getFilteredHouseholdsByColumn, getFilteredHouseholdsBykeyword, updateHousehold } from '@/api/households'
import UploadComponent from '@/views/Components/UploadComponent.vue';
import { defineAsyncComponent } from 'vue';
import ListDocuments from '@/views/Components/ListDocuments.vue';





const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = MapBoxToken;






const searchString = ref('')

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


const showAdminButtons =  ref(appStore.getAdminButtons)
const showEditButtons =  ref(appStore.getEditButtons)

const router = useRouter()
const { push } = router
const goBack = () => router?.back()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
var value4 = ref([])
var value5 = ref([])

const morefileList = ref<UploadUserFile[]>([])


const interVentionTypeOptions = ref([])
const benefitTypeOptions = ref([])
const houseHoldOptions = ref([])
const interventionsOptions = ref([])




const settlementOptions = ref([])
const countiesOptions = ref([])
const page = ref(1)
const pSize = ref(5)
const selCounties = []
const loading = ref(true)
const pageSize = ref(5)
const currentPage = ref(1)
const total = ref(0)
const downloadLoading = ref(false)
const showEditSaveButton = ref(false)
const showAddSaveButton = ref(true)
const formheader = ref('Edit Household')


let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']

const route = useRoute()



var filters = []
var filterValues = []

var tblData = []

const associated_Model = ''
//const associated_multiple_models = ['settlement', 'document']
const associated_multiple_models = ['settlement', 'document']

const model = 'households'
//// ------------------parameters -----------------------////

const { t } = useI18n()


const handleClear = async () => {
  filterValues = []
  filters = []
  value1.value = ''
  value2.value = []
  value3.value = ''
  value4.value = []
  value5.value = []
  settOptions.value = []
  pSize.value = 5
  currentPage.value = 1
  tblData.value = []
  searchString.value = ''
  getAllBeneficiaries()
}

// Helper to add/update a filter in the filters/filterValues arrays
const updateFilter = (filterKey: string, values: any[], filtersArr: string[], filterValuesArr: any[]) => {
  const idx = filtersArr.indexOf(filterKey)
  if (values.length > 0) {
    if (idx === -1) {
      filtersArr.push(filterKey)
      filterValuesArr.push(values)
    } else {
      filterValuesArr[idx] = values
    }
  } else if (idx !== -1) {
    filtersArr.splice(idx, 1)
    filterValuesArr.splice(idx, 1)
  }
}

const handleSelectCounty = async (countyIds: any) => {
  updateFilter('county_id', countyIds || [], filters, filterValues)
  value4.value = [] // clear settlement when county changes
  updateFilter('settlement_id', [], filters, filterValues)
  await loadSettlementsByCounty(countyIds)
  getFilteredData(filters, filterValues)
}

const filterBySettlement = async (settlementIds: any) => {
  updateFilter('settlement_id', settlementIds || [], filters, filterValues)
  getFilteredData(filters, filterValues)
}

const filterByGender = async (genders: any) => {
  updateFilter('gender', genders || [], filters, filterValues)
  getFilteredData(filters, filterValues)
}

// Load settlements for selected county/counties
const settlementSearchLoading = ref(false)
const loadSettlementsByCounty = async (countyIds: any) => {
  if (!countyIds || (Array.isArray(countyIds) && countyIds.length === 0)) {
    settOptions.value = []
    return
  }
  const ids = Array.isArray(countyIds) ? countyIds : [countyIds]
  settlementSearchLoading.value = true
  try {
    const formData = {
      curUser: 1,
      model: 'settlement',
      searchField: 'name',
      searchKeyword: '',
      excludeGeom: true,
      excludeGeomAssoc: true,
      associated_multiple_models: ['county'],
      filters: ['county_id'],
      filterValues: [ids],
      currentUser: userInfo
    }
    const res = await searchByKeyWord(formData)
    settOptions.value = (res.data || []).map((item: any) => ({
      value: item.id,
      label: item.name
    }))
  } catch (error) {
    console.error('Error loading settlements:', error)
    settOptions.value = []
  } finally {
    settlementSearchLoading.value = false
  }
}



const currentRow = ref()
const addMoreDocuments = ref()
const addMoreDocs = (data: TableSlotDefault) => {

  currentRow.value = data

  addMoreDocuments.value = true

  console.log('currentRow', currentRow.value)

}

 

const submitMoreDocuments = async () => {
  console.log('More files.....', morefileList)

  // uploading the documents 
  const fileTypes = []
  const formData = new FormData()
  let files = []
  for (var i = 0; i < morefileList.value.length; i++) {
    console.log('------>file', morefileList.value[i])
    var format = morefileList.value[i].name.split('.').pop() // get file extension
    //  formData.append("file",this.multipleFiles[i],this.fileNames[i]+"_"+dateVar+"."+this.fileTypes[i]);
    fileTypes.push(format)
    // formData.append('files', fileList.value[i])
    // formData.file = fileList.value[i]

    formData.append('model', model)

    formData.append('files', morefileList.value[i].raw)
    formData.append('format', morefileList.value[i].name.split('.').pop())
    formData.append('category', documentCategory.value)
    formData.append('field_id', 'hh_id')

    formData.append('size', (morefileList.value[i].raw.size / 1024 / 1024).toFixed(2))
    formData.append('code', uuid.v4())
    formData.append('hh_id', currentRow.value.id)


  }


  console.log(currentRow.value.id)
  await uploadFilesBatch(formData)

}

const documentCategory = ref()


const onPageChange = async (selPage: any) => {
 

  page.value = selPage
  if (searchString.value) {
 
    getFilteredBySearchData(searchString.value)
    
  } else {
    getFilteredData(filters, filterValues)
  }

 




}

const onPageSizeChange = async (size: any) => {
  pSize.value = size
  if (searchString.value) {
 
 getFilteredBySearchData(searchString.value)
 
} else {
 getFilteredData(filters, filterValues)
}

}

const getAllBeneficiaries = async () => {
  getFilteredData(filters, filterValues)
}

const destructure = (obj) => {
  // console.log('deconstructing......')
  const simpleObj = {}
  for (let key in obj) {
    const value = obj[key]
    const type = typeof value
    if (['string', 'boolean'].includes(type) || (type === 'number' && !isNaN(value))) {
      simpleObj[key] = value
    } else if (type === 'object') {
      Object.assign(simpleObj, destructure(value))
    }
  }

  return simpleObj
}


const getFilteredData = async (selFilters, selfilterValues) => {
  const formData = {}
  formData.limit = pSize.value
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model
  //-Search field--------------------------------------------
  formData.searchField = ''
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  //formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = selFilters
  formData.filterValues = selfilterValues
  formData.associated_multiple_models = associated_multiple_models

  //-------------------------
  //console.log(formData)

  // const res = await getHHsByCounty(formData)

  tblData = [] // reset the table data
  console.log("gettign HHS.........")
  loading.value = true
  await getFilteredHouseholdsByColumn(formData)
    .then((response) => {
      tableDataList.value = response.data
      total.value = response.total
    })
    .catch(function (error) {
      console.log('error', error?.response?.data?.message || error)
      ElMessage.error(error?.response?.data?.message || 'Failed to load households')
    })
    .finally(() => {
      loading.value = false
    })
}



const getBeneficiaryType = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'benefit_type',
      searchField: 'type',
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
      opt.label = arrayItem.type  
      //  console.log(countyOpt)
      benefitTypeOptions.value.push(opt)
    })
  })
}
const getHouseholds = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'households',
      searchField: 'name',
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
      opt.label = (arrayItem.code || arrayItem.id) + ' | ' + (arrayItem.gender || '') + ' | ' + arrayItem.id
      //  console.log(countyOpt)
      houseHoldOptions.value.push(opt)
    })
  })
}

const getInterventions = async () => {
  const formData = {}

  formData.model = 'intervention'
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------


  // - multiple filters -------------------------------------

  formData.associated_multiple_models = ['settlement', 'cluster']

  //-------------------------
  //console.log(formData)
  console.log('before Intervention Options')

  //const rxes = await getSettlementListByCounty(formData)
  //console.log('Inside Intervention Options', rxes)

  const res = await getSettlementListByCounty(formData).then((response: { data: any }) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    var ret = response.data

    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var opt = {}
      opt.value = arrayItem.id
      opt.settlement_id = arrayItem.settlement.id

      opt.label = arrayItem.settlement.name + ' | ' + arrayItem.cluster.contract + ' | ' + arrayItem.id
      //  console.log(countyOpt)
      interventionsOptions.value.push(opt)
    })
  })
}




const getSettlementsOptions = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'settlement',
      searchField: 'name',
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
      countyOpt.label = arrayItem.name  
      //  console.log(countyOpt)
      settlementOptions.value.push(countyOpt)
    })
  })
}





const getFilteredBySearchData = async (searchString) => {
   
  const formData = {}
  formData.limit = pSize.value // 
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model

  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = searchString
  //--Single Filter -----------------------------------------

  //formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = filters
  formData.filterValues = filterValues
  formData.associated_multiple_models = associated_multiple_models

  //-------------------------
  console.log(formData)
  const res = await getFilteredHouseholdsBykeyword(formData)

  console.log('After -----x ------Querry', res)
  tableDataList.value = res.data
  total.value = res.total
  loading.value = false

  tblData.value = [] // reset the table data

}

const searchByName = async (filterString: any) => {
  searchString.value = filterString
  getFilteredBySearchData(searchString.value)
}


const programmeOptions = ref([])
const getProgrammeOptions = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'programme',
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
      countyOpt.label = arrayItem.title  
      //  console.log(countyOpt)
      programmeOptions.value.push(countyOpt)
    })
  })
}

 
const settOptions = ref([])

const getCountyNames = async () => {
  try {
    const response = await getListWithoutGeo({
      params: {
        pageIndex: 1,
        limit: 100,
        curUser: 1,
        model: 'county',
        searchField: '',
        searchKeyword: '',
        sort: 'ASC'
      }
    })
    const ret = Array.isArray(response?.data) ? response.data : response?.data?.data ?? []
    countiesOptions.value = ret.map((item: any) => ({ value: item.id, label: item.name }))
  } catch (err) {
    console.error('Error loading counties:', err)
    countiesOptions.value = []
  }
}

getBeneficiaryType()
getHouseholds()

//getInterventionTypes()
// Settlements loaded only when county changes (via handleSelectCounty → loadSettlementsByCounty)
getAllBeneficiaries()
getInterventions()
getProgrammeOptions()
//getGeo()

getCountyNames()

console.log('Options---->', interVentionTypeOptions)





//*****************************Create**************************** */

///----------------------------------------------------------------------------------

const ruleFormRef = ref<FormInstance>()
const rules = {}
const ruleForm = reactive({
  id: '',
  settlement_id: '',
  name: '',
  gender: '',
  national_id: '',
  kra_pin: '',
  marital_status: '',
  education_level: '',
  residence_type: '',
  length_stay: 0,
  owner_tenant: '',
  age_plot_owner: '',
  photo: '',
  age_00_04m: 0,
  age_05_09m: 0,
  age_10_14m: 0,
  age_15_19m: 0,
  age_20_24m: 0,
  age_24_29m: 0,
  age_30_34m: 0,
  age_35_39m: 0,
  age_40_44m: 0,
  age_45_49m: 0,
  age_50_54m: 0,
  age_55_59m: 0,
  age_60_64m: 0,
  age_65_69m: 0,
  age_70_plusm: 0,
  age_00_04f: 0,
  age_05_09f: 0,
  age_10_14f: 0,
  age_15_19f: 0,
  age_20_24f: 0,
  age_24_29f: 0,
  age_30_34f: 0,
  age_35_39f: 0,
  age_40_44f: 0,
  age_45_49f: 0,
  age_50_54f: 0,
  age_55_59f: 0,
  age_60_64f: 0,
  age_65_69f: 0,
  age_70_plusf: 0,
  hh_size: 0,
  terminally_ill: 0,
  ph_disabled: 0,
  orphans: 0,
  ment_disabled: 0,
  hearing_disabled: 0,
  visual_disabled: 0,
  emp_status: '',
  income_level: '',
  type_structure: '',
  struct_owner: '',
  rent_payable: '',
  expense_food: '',
  expense_clothing: '',
  mode_acquisition: '',
  ownership_docs: '',
  shared_ownership: false,
  source_water: '',
  water_cost20l: 0,
  sanitation: '',
  toilet_cost: 0,
  address: '',
  mode_transport: '',
  access_health: '',
  handwashing: '',
  access_education: '',
  distance_to_sch: '',
  lighting_energy: '',
  lighting_energy_cost: 0,
  cooking_energy: '',
  cooking_energy_cost: 0,
  solid_waste: '',
  code: '',
})


const DeleteHH = (data: TableSlotDefault) => {
  console.log('----->', data.id)
  let formData = {}
  formData.id = data.id
  formData.model = model

  DeleteRecord(formData)

  console.log(tableDataList.value)

  // remove the deleted object from array list 
  let index = tableDataList.value.indexOf(data);
  if (index !== -1) {
    tableDataList.value.splice(index, 1);
  }

}


const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ruleForm.model = model
      await updateHousehold(ruleForm).then(() => { })

      AddDialogVisible.value = false


    } else {
      console.log('error in editing!', fields)
    }
  })
}

const handleClose = () => {
  console.log("Closing the dialoig")
  for (const key in ruleForm) {
    ruleForm[key] = null

  }



  formheader.value = 'Add Household'
  AddDialogVisible.value = false

}





const AddHH = () => {
  push({
    path: '/settlement/hh/add',
    name: 'AddHouseholdx'
  })
}

const AddDialogVisible = ref(false)

// Drawer for household details
const detailDrawer = ref(false)
const raw = ref()

const excludeFields = ref([
  'id', 'county_id', 'settlement_id', 'subcounty_id', 'ward_id', 'code', 'geom',
  'documents', 'createdAt', 'updatedAt',
  'respondents_name', 'name', 'telephone', 'national_id', 'phone'
])
const priorityFields = ['gender', 'age', 'hh_size', 'settlement', 'settlement_county']

const humanize = (key) =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())

const flattenForDisplay = (obj, prefix = '') => {
  const result = {}
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue
    const val = obj[key]
    const fullKey = prefix ? `${prefix}_${key}` : key
    if (val === null || val === undefined || val === '') continue
    if (typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      if ('type' in val && 'coordinates' in val) continue // skip geom
      if (val.name !== undefined) {
        result[fullKey] = val.name
        if (val.county?.name) result[`${fullKey}_county`] = val.county.name
      } else if (val.id !== undefined) {
        result[fullKey] = val.id
      } else {
        Object.assign(result, flattenForDisplay(val, fullKey))
      }
    } else {
      result[fullKey] = val
    }
  }
  return result
}

const filteredData = computed(() => {
  if (!raw.value || typeof raw.value !== 'object' || Array.isArray(raw.value)) return []
  const flat = flattenForDisplay(raw.value)
  const entries = Object.entries(flat).filter(
    ([key]) => !excludeFields.value.includes(key)
  )
  const priorityRows = priorityFields
    .map((key) => entries.find(([k]) => k === key))
    .filter((e): e is [string, unknown] => !!e)
  const otherRows = entries
    .filter(([k]) => !priorityFields.includes(k))
    .sort(([a], [b]) => humanize(a).localeCompare(humanize(b)))
  return [...priorityRows, ...otherRows].map(([key, val]) => ({
    field: humanize(key),
    value: val
  }))
})

const showHHDetails = (data: TableSlotDefault) => {
  raw.value = data.row
  detailDrawer.value = true
}

const editHH = (data: TableSlotDefault) => {
  formheader.value = 'Edit Household'
  showEditSaveButton.value = true


  // transfer observed data to form
  ruleForm.id = data.row.id
  for (const key in ruleForm) {
    ruleForm[key] = data.row[key]
   // console.log(key, ruleForm[key])
  }


  // push({
  //   path: '/settlement/hh/add',
  //   name: 'AddHousehold'
  // })
console.log('pasising', data.row.id)
  push({
  name: 'AddHouseholdx',
    query: { id: data.row.id }
  
});



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

const downloadFile = async (data) => {

console.log(data.name)

const formData = {}
formData.filename = data.name
formData.responseType = 'blob'
await getFile(formData)
  .then(response => {
    console.log(response)

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', data.name)
    document.body.appendChild(link)
    link.click()

  })
  .catch(error => {
    console.error('Error downloading file:', error);
  });

}



const isMobile = computed(() => appStore.getMobile)

console.log('IsMobile', isMobile)
const dialogWidth = ref()
const actionColumnWidth = ref()

if (isMobile.value) {
  dialogWidth.value = "90%"
  actionColumnWidth.value = "75px"
} else {
  dialogWidth.value = "25%"
  actionColumnWidth.value = "160px"

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

        if (group =='Other') {
          acc[group].push(cur); 
        }
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


const tableRowClassName = (data) => {
  // console.log('Row Styling --------->', data.row)
  if (data.row.documents.length > 0) {
    return 'warning-row'
  }
  return ''
}





/// Uplaod docuemnts from a central component 
const mfield = 'hh_id'
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



</script>

<template>
  <el-card>
    <div v-if="dynamicComponent">
      <upload-component :is="dynamicComponent" v-bind="componentProps"/>
    </div>

    <div v-loading="loading" element-loading-text="Loading households...">
      <el-row :gutter="10" style="margin-bottom: 10px">
        <el-col :span="24">
          <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px; justify-content: space-between">
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px; flex: 1; min-width: 0">
              <el-button type="primary" plain :icon="Back" @click="goBack">Back</el-button>
              <el-select
                v-model="value2"
                @change="handleSelectCounty"
                @clear="handleSelectCounty([])"
                placeholder="Filter by County"
                clearable
                filterable
                multiple
                collapse-tags
                style="width: 180px">
                <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
              <el-select
                v-model="value4"
                @change="filterBySettlement"
                @clear="filterBySettlement([])"
                :placeholder="(value2 && value2.length) ? 'Filter by Settlement' : 'Select county first'"
                clearable
                filterable
                multiple
                collapse-tags
                :disabled="!value2 || value2.length === 0"
                :loading="settlementSearchLoading"
                style="width: 180px">
                <el-option v-for="item in settOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
               
            </div>
            <div style="display: flex; gap: 8px; align-items: center">
              <el-button type="primary" :icon="Filter" @click="handleClear"  >Clear</el-button>
              <DownloadCustom
                :data="tableDataList"
                :model="model"
                :associated_models="associated_multiple_models"
                :filters="filters"
                :filter-values="filterValues" />
            </div>
          </div>
        </el-col>
      </el-row>

      <el-table :data="tableDataList" border row-key="id" style="width: 100%">
        <el-table-column type="index" width="50" />
        <el-table-column label="Gender" prop="gender" sortable />
        <el-table-column label="Age" prop="age" sortable />
        <el-table-column label="Household Size" prop="hh_size" sortable />
        <el-table-column label="Settlement" sortable>
          <template #default="{ row }">
            {{ row.settlement?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="Actions" width="100">
            <template #default="scope">
              <el-tooltip content="More Details" placement="top">
                <el-button type="success" size="small" :icon="More" @click="showHHDetails(scope as TableSlotDefault)" plain />
              </el-tooltip>
            </template>
          </el-table-column>
      </el-table>

      <div style="margin-top: 20px;">
        <el-pagination
          layout="sizes, prev, pager, next, total"
          v-model:currentPage="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 20, 50, 100]"
          :total="total"
          :background="true"
          @size-change="onPageSizeChange"
          @current-change="onPageChange"
          class="mt-4" />
      </div>
    </div>



    <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formheader" :width="dialogWidth" draggable>
      <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px">

        <el-form-item label="Settlement" prop="settlement_id">
          <el-select v-model="ruleForm.settlement_id" filterable placeholder="Select">
            <el-option v-for="item in settOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="Name">
          <el-input v-model="ruleForm.name" />
        </el-form-item>


        <el-form-item label="Type" prop="gender">
          <el-select v-model="ruleForm.gender" filterable placeholder="gender">
            <el-option v-for="item in enums.genderOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="ID">
          <el-input v-model="ruleForm.national_id" />
        </el-form-item>


        <el-form-item label="KRA PIN">
          <el-input v-model="ruleForm.kra_pin" />
        </el-form-item>



      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="AddDialogVisible = false">Cancel</el-button>
          <el-button v-if="showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>

        </span>
      </template>
    </el-dialog>

    <el-drawer v-model="detailDrawer" :show-close="false">
      <template #header="{ close, titleId, titleClass }">
        <h4 :id="titleId" :class="titleClass">Household Record</h4>
        <el-button type="danger" @click="close">
          <el-icon class="el-icon--left"><CircleCloseFilled /></el-icon>
          Close
        </el-button>
      </template>
      <el-table :data="filteredData" stripe style="width: 100%">
        <el-table-column prop="field" label="" width="200" />
        <el-table-column prop="value" label="" />
      </el-table>
    </el-drawer>
  </el-card>
</template>
 



<style scoped>
.max-w-200px {
  max-width: 200px;
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
</style>