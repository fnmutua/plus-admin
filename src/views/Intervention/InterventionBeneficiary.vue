<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty, getHHsByCounty } from '@/api/settlements'
import { getListWithoutGeo } from '@/api/counties'
import {
  ElButton, ElSelect, FormInstance, ElLink, MessageParamsWithType, ElTabs, ElTabPane, ElDialog, ElInputNumber,
  ElInput, ElDatePicker, ElForm, ElFormItem, ElUpload, ElCascader, FormRules, ElPopconfirm, ElTable, ElCol, ElRow,
  ElTableColumn, UploadUserFile, ElDropdown, ElDropdownItem, ElDropdownMenu
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

import xlsx from "json-as-xlsx"
import { getAllGeo } from '@/api/settlements'
import {
  searchByKeyWord
} from '@/api/settlements'

import { useRoute } from 'vue-router'

import { getAllHouseholds, getFilteredHouseholdsBykeyword, updateHousehold } from '@/api/households'


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




const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'
mapboxgl.accessToken = MapBoxToken;





//*****************************Create**************************** */

///----------------------------------------------------------------------------------

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  hh_id: '',
  project_id: '',
  settlement_id: '',
  code: '',
})
const showSubmitBtn = ref(true)

const searchString = ref()
const projectOptions = ref([])

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


// Hide buttons if not admin 
const showAdminButtons = ref(false)

if (userInfo.roles.includes("admin")) {
  showAdminButtons.value = true
}

const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
var value4 = ref([])
var value5 = ref([])

const morefileList = ref<UploadUserFile[]>([])

const AddDialogVisible = ref(false)
const interVentionTypeOptions = ref([])




const page = ref(1)
const pSize = ref(5)
const selCounties = []
const loading = ref(true)
const pageSize = ref(5)
const currentPage = ref(1)
const total = ref(0)
const showEditSaveButton = ref(false)
const formheader = ref('Edit Household')


let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']




var filters = []
var filterValues = []

var tblData = []

const associated_multiple_models = ['households']

const nested_models = ['project', 'settlement'] // The mother, then followed by the child


const model = 'beneficiary'
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

const filterByProject = async (title: any) => {
  var selectOption = 'project_id'
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




const filterByHousehold = async (title: any) => {
  var selectOption = 'hh_id'
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
  for (var i = 0; i < morefileList.value.length; i++) {
    console.log('------>file', morefileList.value[i])
    var format = morefileList.value[i].name.split('.').pop() // get file extension
    //  formData.append("file",this.multipleFiles[i],this.fileNames[i]+"_"+dateVar+"."+this.fileTypes[i]);
    fileTypes.push(format)
    // formData.append('file', fileList.value[i])
    // formData.file = fileList.value[i]
    formData.append('file', morefileList.value[i].raw)
    formData.append('DocType', format)

  }


  formData.append('parent_code', currentRow.value.id)
  formData.append('model', model)
  formData.append('grp', 'Settlement Documentation')
  formData.append('code', uuid.v4())
  formData.append('column', 'settlement_id')  //Column to save ID 



  console.log(formData)
  await uploadDocuments(formData)

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
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------
  formData.nested_models = nested_models



  // - multiple filters -------------------------------------
  formData.filters = selFilters
  formData.filterValues = selfilterValues
  formData.associated_multiple_models = associated_multiple_models

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('Beneficiaries - associated_multiple_models', res)
  tableDataList.value = res.data
  total.value = res.total


  tblData.value = [] // reset the table data
  console.log('TBL-b4-', tblData)
  let filteredIds = []
  res.data.forEach(function (arrayItem) {
    console.log(arrayItem)
    filteredIds.push(arrayItem.id)

    var dd = destructure(arrayItem)
    delete dd['0']
    delete dd['1']

    tblData.value.push(dd)
  })





  console.log('TBL-4f', tblData)
}





const getFilteredBySearchData = async (searchString) => {
  const formData = {}
  formData.limit = pSize.value
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
 


const settlementOptions = ref([])

const getSettlementsOptions = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
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

const getProjectsOptions = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
       curUser: 1, // Id for logged in user
      model: 'project',
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
      countyOpt.settlement_id = arrayItem.settlement_id
      countyOpt.label = arrayItem.title + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      projectOptions.value.push(countyOpt)
    })
  })
}



const householdOptions = ref([])

const getHouseholdOptions = async () => {
  const formData = {}

  formData.curUser = 1 // Id for logged in user
  formData.model = 'households'
  //-Search field--------------------------------------------
  formData.searchField = ''
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  //formData.assocModel = associated_Model
  formData.associated_multiple_models = []

  //-------------------------
  //console.log(formData)

  // const res = await getHHsByCounty(formData)

  tblData = [] // reset the table data
  console.log("gettign HHS.........")
  await getAllHouseholds(formData)
    .then((response) => {
      console.log('Received HHS:', response)
      var ret = response.data
      ret.forEach(function (arrayItem: { id: string; type: string }) {
        var opt = {}
        opt.value = arrayItem.id
        opt.label = arrayItem.name + '(' + arrayItem.id + ')'
        //  console.log(countyOpt)
        householdOptions.value.push(opt)
      })
    })
    .catch(function (error) {
      console.log('error', error.response.data.message);
      //open(error.response.data.message)
      ElMessage.error('Failed...')

      loading.value = false
    })
}

//getInterventionTypes()
getAllBeneficiaries()
getSettlementsOptions()
getProjectsOptions()
getHouseholdOptions()



console.log('Options---->', interVentionTypeOptions)







const DeleteBeneficiary = (data: TableSlotDefault) => {
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
  showSubmitBtn.value = false
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ruleForm.model = model
      await updateOneRecord(ruleForm).then(() => { })

      AddDialogVisible.value = false
      formheader.value = "Edit Beneficiary"

    } else {
      console.log('error in editing!', fields)
    }
  })
}

const handleClose = () => {
  showSubmitBtn.value = true

  console.log("Closing the dialoig")
  for (const key in ruleForm) {
    ruleForm[key] = null

  }



  formheader.value = 'Add Beneficiary'
  AddDialogVisible.value = false

}





const activeName = ref('list')
const AddHH = () => {
  // push({
  //   path: '/settlement/hh/add',
  //   name: 'AddHousehold'
  // })
  formheader.value = 'Add Beneficiary'

  AddDialogVisible.value = true
}



const editHH = (data: TableSlotDefault) => {
  formheader.value = 'Edit Household'
  showEditSaveButton.value = true
  showSubmitBtn.value = false
  console.log('dataxxxx', data.row)


  ruleForm.id = data.row.id
  ruleForm.hh_id = data.row.hh_id
  ruleForm.project_id = data.row.project_id


  AddDialogVisible.value = true
}

const removeDocument = (data: TableSlotDefault) => {
  console.log('----->', data)
  let formData = {}
  formData.id = data.id
  formData.model = model
  formData.filesToDelete = [data.name]
  deleteDocument(formData)
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

const DownloadXlsx = async () => {
  console.log(tableDataList.value)

  // change here !
  let fields = [
    { label: "S/No", value: "index" }, // Top level data
    { label: "Name", value: "name" }, // Top level data
    { label: "Gender", value: "gender" }, // Custom format
    { label: "Settlement", value: "settlement" }, // Run functions
    { label: "Project", value: "project" }, // Run functions


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
    thisRecord.settlement = tableDataList.value[i].settlement ? tableDataList.value[i].settlement.name : ''
    thisRecord.project = tableDataList.value[i].project ? tableDataList.value[i].project.title : ''
    thisRecord.gender = tableDataList.value[i].gender


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


const handleSelectProject = async (project: any) => {

  console.log(project)

  async function filterPromiseArray() {
    const filteredArray = await Promise.all(projectOptions.value)
      .then((result) => {
        return result.filter((item) => item.value === project);
      })
      .catch((error) => {
        console.log(error);
      });
    return filteredArray;
  }

  filterPromiseArray()
    .then((result) => {

      console.log(result[0].settlement_id)
      ruleForm.settlement_id = result[0].settlement_id
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


</script>

<template>
  <ContentWrap :title="t('Households')" :message="t('Use the filters to subset')">
     <el-row>
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <div style="display: inline-block; margin-top: 5px">
          <div style="display: inline-block; margin-right: 5px">

          <el-select
size="default" v-model="value4" :onChange="filterByProject" :onClear="handleClear" multiple clearable
            filterable collapse-tags placeholder="By Project">
            <el-option v-for="item in projectOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>

          <el-select
size="default" v-model="value5" :onChange="filterByHousehold" :onClear="handleClear" multiple
            clearable filterable collapse-tags placeholder="By Household">
            <el-option v-for="item in householdOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>

        </div>


      </el-col>
    
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <div style="display: inline-block; margin-top: 5px">
          <div style="display: inline-block; margin-left: 20px">
            <el-button :onClick="handleClear" type="primary" :icon="Filter" />
          </div>

          <div v-if="showAdminButtons" style="display: inline-block; margin-left: 20px">
            <el-tooltip content="Add Beneficiary" placement="top">
              <el-button :onClick="AddHH" type="primary" :icon="Plus" />
            </el-tooltip>
          </div>

          <div style="display: inline-block; margin-left: 20px">
            <el-tooltip content="Download" placement="top">
              <el-button :onClick="DownloadXlsx" type="primary" :icon="Download" />
            </el-tooltip>
          </div>
        </div>
      </el-col>
    </el-row>







 
    <el-tabs @tab-click="onMap" v-model="activeName" type="border-card">
      <el-tab-pane label="List" name="list">

        <el-table :data="tableDataList" style="width: 100%" border>
          <el-table-column type="expand">
            <template #default="props">
              <div m="4">
                <h3>Documents</h3>
                <el-table :data="props.row.documents" border>
                  <el-table-column label="Name" prop="name" />
                  <el-table-column label="Type" prop="category" />

                  <el-table-column label="Actions">
                    <template #default="scope">
                      <el-link :href="props.row.documents[scope.$index].name" download>
                        <Icon icon="material-symbols:download-for-offline-rounded" color="#46c93a" width="36" />
                      </el-link>
                      <el-tooltip cont nt="Delete" placement="top">
                        <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled"
                          icon-color="#626AEF" title="Are you sure to delete this document?"
                          @confirm="removeDocument(scope.row)">
                          <template #reference>
                            <el-button v-if="showAdminButtons" type="danger" :icon=Delete circle />
                          </template>
                        </el-popconfirm>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                </el-table>
                <!-- <el-button @click="addMoreDocs(props.row)" type="info" round>Add Documents</el-button> -->

              </div>
            </template>
          </el-table-column>
          <el-table-column label="Name" width="200" prop="name" sortable />
          <el-table-column label="Gender" prop="household.gender" sortable />
          <el-table-column label="Ownership Status" prop="project.title" sortable />


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
v-if="showAdminButtons" @click="DeleteBeneficiary(scope.row as TableSlotDefault)"
                      :icon="Delete" color="red">Delete</el-dropdown-item>

                  </el-dropdown-menu>
                </template>
              </el-dropdown>


              <div v-else>



                <el-tooltip ontent="Edit" placement="top">
                  <el-button
v-if="showAdminButtons" type="success" :icon="Edit"
                    @click="editHH(scope as TableSlotDefault)" circle />
                </el-tooltip>

                <el-tooltip cont nt="Delete" placement="top">
                  <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
                    title="Are you sure to delete this household?"
                    @confirm="DeleteBeneficiary(scope.row as TableSlotDefault)">
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
          v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 200, 1000]" :total="total" :background="true"
          @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
      </el-tab-pane>

       
    </el-tabs>



    <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formheader" :width="dialogWidth" draggable>
      <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px">

        <el-form-item label="Beneficiary" prop="hh_id">
          <el-select v-model="ruleForm.hh_id" filterable placeholder="Select">
            <el-option v-for="item in householdOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>


        <el-form-item label="Project" prop="project_id">
          <el-select v-model="ruleForm.project_id" filterable placeholder="Select" :onChange="handleSelectProject">
            <el-option v-for="item in projectOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>



      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="AddDialogVisible = false">Cancel</el-button>
          <el-button v-if="showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>
          <el-button v-if="showSubmitBtn" type="primary" @click="submitForm(ruleFormRef)">Submit</el-button>

        </span>
      </template>
    </el-dialog>

    <el-dialog v model="addMoreDocuments" title="Upload More Documents" width="30%">
      <el-upload
v-model:file-list="morefileList" class="upload-demo"
        action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" multiple :limit="5" :auto-upload="false">
        <el-button type="primary">Click to upload</el-button>
        <template #tip>
          <div class="el-upload__tip">
            jpg/png files with a size less than 500KB.
          </div>
        </template>
      </el-upload>
      <el-button type="secondary" @click="submitMoreDocuments()">Submit</el-button>

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
</style>
