<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty, getHHsByCounty, uploadFilesBatch} from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import {
  ElButton, ElSelect, FormInstance, ElLink, MessageParamsWithType, ElTabs, ElTabPane, ElDialog, ElInputNumber,
  ElInput, ElDatePicker, ElForm, ElFormItem, ElUpload, ElCascader, FormRules, ElPopconfirm, ElTable, ElCol, ElRow,
  ElTableColumn, UploadUserFile, ElDropdown, ElDropdownItem, ElDropdownMenu,ElOptionGroup
} from 'element-plus'
import { ElMessage } from 'element-plus'
import { Position, TopRight, Plus, User, Download, Delete, Edit, Filter, InfoFilled } from '@element-plus/icons-vue'

import { ref, reactive, computed, h } from 'vue'
import { ElPagination, ElTooltip, ElOption, ElDivider } from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { CreateRecord, DeleteRecord, updateOneRecord, deleteDocument, uploadDocuments, getfilteredGeo } from '@/api/settlements'

import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { uuid } from 'vue-uuid'
import { getFile } from '@/api/summary'

import xlsx from "json-as-xlsx"
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
import DownloadAll from '@/views/Components/DownloadAll.vue';

import { getFilteredHouseholdsByColumn, getFilteredHouseholdsBykeyword, updateHousehold } from '@/api/households'
import UploadComponent from '@/views/Components/UploadComponent.vue';
import { defineAsyncComponent } from 'vue';
import ListDocuments from '@/views/Components/ListDocuments.vue';





const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = MapBoxToken;






const searchString = ref()

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


const showAdminButtons =  ref(appStore.getAdminButtons)
const showEditButtons =  ref(appStore.getEditButtons)

const { push } = useRouter()
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
  tblData.value = []
  //----run the get data--------
  getAllBeneficiaries()
}

const filterBySettlement = async (title: any) => {
  var selectOption = 'settlement_id'
  if (!filters.includes(selectOption)) {
    filters.push(selectOption)
  }
  var index = filters.indexOf(selectOption) // 1
  console.log('intervention_type_id : index--->', index)

  // clear previously selected
  if (filterValues[index]) {
    // filterValues[index].length = 0
    filterValues.splice(index, 1)
  }

  if (!filterValues.includes(title) && title.length > 0) {
    filterValues.splice(index, 0, title) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
  }

  // expunge the filter if the filter values are null
  if (title.length === 0) {
    filters.splice(index, 1)
  }

  console.log('FilterValues:', filterValues)

  getFilteredData(filters, filterValues)
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
  await getFilteredHouseholdsByColumn(formData)
    .then((response) => {
      console.log('Received HHS:', response)
      tableDataList.value = response.data
      total.value = response.total

    })
    .catch(function (error) {
      console.log('error', error.response.data.message);
      open(error.response.data.message)
      ElMessage.error('Upload Cancelled...')

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
      opt.label = arrayItem.type + '(' + arrayItem.id + ')'
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
      opt.label = arrayItem.name + '| ' + arrayItem.gender + ' | ' + arrayItem.national_id
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
      countyOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
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
      countyOpt.label = arrayItem.title + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      programmeOptions.value.push(countyOpt)
    })
  })
}

 
const settOptions = ref([])

const getCountyNames = async () => {
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
      countyOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      settOptions.value.push(countyOpt)
    })
  })
}

getBeneficiaryType()
getHouseholds()

//getInterventionTypes()
getSettlementsOptions()
getAllBeneficiaries()
getInterventions()
getProgrammeOptions()
//getGeo()

getCountyNames()

console.log('Options---->', interVentionTypeOptions)





//*****************************Create**************************** */

///----------------------------------------------------------------------------------

const ruleFormRef = ref<FormInstance>()
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





const activeName = ref('list')
const AddHH = () => {
  push({
    path: '/settlement/hh/add',
    name: 'AddHouseholdx'
  })
}

const AddDialogVisible = ref(false)


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

 

const DownloadXlsx = async () => {
  console.log(tableDataList.value)

  // change here !
  let fields = [
    { label: "S/No", value: "index" }, // Top level data
    { label: "Name", value: "name" }, // Top level data
    { label: "Gender", value: "gender" }, // Custom format
    { label: "Settlement", value: "settlement" }, // Run functions
    { label: "Ownership Status", value: "owner_tenant" }, // Run functions


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
    thisRecord.name = tableDataList.value[i].name
    thisRecord.settlement = tableDataList.value[i].settlement.name
    thisRecord.gender = tableDataList.value[i].gender
    thisRecord.owner_tenant = tableDataList.value[i].owner_tenant


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
  <ContentWrap :title="t('Households')" :message="t('Use the filters to subset')">

    
    <div v-if="dynamicComponent">
      <upload-component :is="dynamicComponent" v-bind="componentProps"/>
    </div>



     <el-row>
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <div style="display: inline-block; margin-right: 5px">
          <el-select
size="default" v-model="value4" :onChange="filterBySettlement" :onClear="handleClear" multiple
            clearable filterable collapse-tags placeholder="By Settlement">
            <el-option v-for="item in settOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>         
        </div>
        
        <div style="display: inline-block; margin-right: 5px">
          <el-select  
size="default" v-model="value3" multiple clearable filterable remote :remote-method="searchByName"
            reserve-keyword placeholder="Search by Name" />
        </div>

      </el-col>
      <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
        <div style="display: inline-block; margin-top: 5px">
          <div style="display: inline-block; margin-left: 20px">
            <el-button :onClick="handleClear" type="primary" :icon="Filter" />
          </div>

          <div v-if="showAdminButtons" style="display: inline-block; margin-left: 20px">
            <el-tooltip content="Add Household" placement="top">
              <el-button :onClick="AddHH" type="primary" :icon="Plus" />
            </el-tooltip>
          </div>

          <div style="display: inline-block; margin-left: 20px">
            <el-tooltip content="Download" placement="top">
              <el-button :onClick="DownloadXlsx" type="primary" :icon="Download" />
            </el-tooltip>
          </div>
          <DownloadAll  v-if="showAdminButtons"   :model="model" :associated_models="associated_multiple_models"/>

        </div>
      </el-col>
    </el-row>


    <el-tabs @tab-click="onMap" v-model="activeName" type="border-card">
      <el-tab-pane label="List" name="list">

     
        <el-table :data="tableDataList" style="width: 100%; margin-top: 10px;" border   :row-class-name="tableRowClassName" @expand-change="handleExpand">
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
          <el-table-column label="#" width="200" prop="id" sortable />
          <el-table-column label="Name" width="200" prop="name" sortable />

          <el-table-column label="Gender" prop="gender" sortable />
          <el-table-column label="Ownership Status" prop="owner_tenant" sortable />
          <el-table-column label="Settlement" prop="settlement.name" sortable />


          <el-table-column fixed="right" label="Actions" :width="actionColumnWidth">
            <template #default="scope">

              <el-dropdown v-if="isMobile">
                <span class="el-dropdown-link">
                  <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
v-if="showAdminButtons" @click="editHH(scope as TableSlotDefault)"
                      :icon="Edit">Edit</el-dropdown-item>
                    <el-dropdown-item
v-if="showAdminButtons" @click="DeleteHH(scope.row as TableSlotDefault)"
                      :icon="Delete" color="red">Delete</el-dropdown-item>

                  </el-dropdown-menu>
                </template>
              </el-dropdown>


              <div v-else>



                <el-tooltip content="Edit" placement="top">
                  <el-button
v-if="showAdminButtons" type="success" :icon="Edit"
                    @click="editHH(scope as TableSlotDefault)" circle />
                </el-tooltip>

                <el-tooltip content="Delete" placement="top">
                  <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" width="220" :icon="InfoFilled"
                    icon-color="#626AEF" title="Are you sure to delete this household?"
                    @confirm="DeleteHH(scope.row as TableSlotDefault)">
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
layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
          v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 100]" :total="total" :background="true"
          @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
      </el-tab-pane>

     
    </el-tabs>



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

  

  </ContentWrap>
</template>
 



<style scoped>
.basemap {
  width: 100%;
  height: 75vh;
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