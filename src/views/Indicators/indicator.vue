<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { ElButton, ElSelect, MessageParamsWithType } from 'element-plus'
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

import { ref, reactive, computed } from 'vue'
import {
  ElPagination, ElInputNumber, ElTable,
  ElTableColumn, ElDropdown, ElDropdownItem, ElDropdownMenu,
  ElDatePicker, ElTooltip, ElOption, ElDivider, ElDialog, ElForm, ElFormItem, ElUpload, ElLink, ElInput, ElCascader, ElOptionGroup, FormRules, ElPopconfirm
} from 'element-plus'


import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import type { FormInstance } from 'element-plus'
import xlsx from "json-as-xlsx"
import DownloadAll from '@/views/Components/DownloadAll.vue';


const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


console.log("userInfo--->", userInfo)


const isMobile = computed(() => appStore.getMobile)

console.log('IsMobile', isMobile)

const dialogWidth = ref()
const actionColumnWidth = ref()
const idColumnWidth = ref("50px")

if (isMobile.value) {
  dialogWidth.value = "90%"
  actionColumnWidth.value = "75px"
} else {
  dialogWidth.value = "40%"
  actionColumnWidth.value = "160px"


}
  


const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
const indicatorsOptions = ref([])
const settlementOptions = ref([])
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
 

const showAdminButtons =  ref(appStore.getAdminButtons)
const showEditButtons =  ref(appStore.getEditButtons)



console.log("Show Buttons -->", showAdminButtons)



let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var filterValues = []
var tblData = []
const associated_Model = ''
const associated_multiple_models = ['activity']
const model = 'indicator'
//// ------------------parameters -----------------------////

const { t } = useI18n()
const AddDialogVisible = ref(false)
const formHeader = ref('Add Indicator')
const showSubmitBtn = ref(true)
const showEditSaveButton = ref(false)


 
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


const handleSelectIndicator = async (indicator: any) => {
  var selectOption = 'id'
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
  formData.searchField = 'name'
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
      model: 'indicator',
      searchField: 'name',
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
    makeSettlementOptions(categories)
  })
}


const makeSettlementOptions = (list) => {
  console.log('making the options..............', list)
  settlementOptions.value = []
  list.value.forEach(function (arrayItem: { id: string; type: string }) {
    var countyOpt = {}
    countyOpt.value = arrayItem.id
    countyOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
    //  console.log(countyOpt)
    settlementOptions.value.push(countyOpt)
  })
}

const handleDownload = () => {
  downloadLoading.value = true
  const data = tblData
  const fileName = 'indicators.xlsx'
  const exportType = exportFromJSON.types.csv
  if (data) exportFromJSON({ data, fileName, exportType })
}

const activityOptions = ref([])
const getActivityOptions = async () => {
  await getCountyListApi({
    params: {
      //   pageIndex: 1,
      //   limit: 100,
      curUser: 1, // Id for logged in user
      model: 'activity',
      searchField: 'title',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    // var ret = response

    console.log('Activities', response.data)
    response.data.forEach(function (arrayItem: { id: string; type: string }) {
      //console.log(arrayItem)
      var opt = {}
      opt.value = arrayItem.id
      opt.label = arrayItem.title + '(' + arrayItem.id + ')'

      //  console.log(countyOpt)
      activityOptions.value.push(opt)
    })


  })
}


getActivityOptions()
getIndicatorOptions()
getInterventionsAll()

console.log('Options---->', indicatorsOptions)
const editIndicator = (data: TableSlotDefault) => {
  showSubmitBtn.value = false
  showEditSaveButton.value = true
  console.log(data)
  ruleForm.id = data.row.id
  ruleForm.name = data.row.name
  ruleForm.type = data.row.type
  ruleForm.format = data.row.format
  ruleForm.level = data.row.level
  ruleForm.unit = data.row.unit
  ruleForm.activity_id = data.row.activity_id
  formHeader.value = 'Edit Indicator'


  AddDialogVisible.value = true
}


const DeleteIndicator = (data: TableSlotDefault) => {
  console.log('----->', data.id)
  let formData = {}
  formData.id = data.id
  formData.model = 'indicator'
  DeleteRecord(formData)
  console.log(tableDataList.value)

  // remove the deleted object from array list 
  let index = tableDataList.value.indexOf(data);
  if (index !== -1) {
    tableDataList.value.splice(index, 1);
  }

  getFilteredData(filters, filterValues)
}


const handleClose = () => {

  console.log("Clsoing the dialoig")
  showSubmitBtn.value = true
  showEditSaveButton.value = false

  ruleForm.id = ''
  ruleForm.name = ''
  ruleForm.type = ''
  ruleForm.format = ''
  ruleForm.level = ''
  ruleForm.unit = ''
  ruleForm.activity_id

  formHeader.value = 'Add Indicator'

}
interface FormData {
  [key: string]: any;
}

interface FormRules {
  [key: string]: {
    [key: string]: {
      required?: boolean;
      type?: string;
      message?: string;
      trigger?: string;
    }[];
  };
}

const ruleFormRef = ref<FormInstance>()

const ruleForm = reactive({
  name: '',
  type: '',
  unit: '',
  level: '',
  format: '',
  activity_id: '',
  desc: '',
})

const rules = reactive({

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

const AddIndicator = () => {
  AddDialogVisible.value = true
}


// const submitForm = async (formEl: FormInstance | undefined) => {
//   if (!formEl) return
//   await formEl.validate((valid, fields) => {
//     if (valid) {

//       console.log('Is valid....')
//       ruleForm.model = 'indicator'
//       ruleForm.code = uuid.v4()
//       const res = CreateRecord(ruleForm)

//     } else {
//       console.log('error submit!', fields)
//     }
//   })
// }

const submitForm = async (formEl) => {
  const valid = await formEl.validate()
  if (valid) {
    ruleForm.model = 'indicator'
    ruleForm.code = uuid.v4()
    const res = await CreateRecord(ruleForm)
    console.log('res.data', res.data)
    tableDataList.value.push(res.data)  // Add the added object on the list

    console.log(tableDataList.value)

  } else {
    ElMessage.error('Please fill in all the required fields')
  }
}



const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      ruleForm.model = 'indicator'

      updateOneRecord(ruleForm).then(() => { })

      // dialogFormVisible.value = false


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
    { label: "Title", value: "title" }, // Custom format
    { label: "Activity", value: "activity" }, // Top level data
    { label: "level", value: "level" }, // Custom format
    { label: "Format", value: "format" }, // Custom format
    { label: "Unit", value: "unit" } // Custom format

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
    thisRecord.title = tableDataList.value[i].name
    thisRecord.activity = tableDataList.value[i].activity.title
    thisRecord.level = tableDataList.value[i].level
    thisRecord.format = tableDataList.value[i].format
    thisRecord.unit = tableDataList.value[i].unit


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
</script>

<template>
  <ContentWrap :title="t('Indicator List')" :message="t('Use the filters to subset')">
    <el-divider border-style="dashed" content-position="left">Filters</el-divider>

    <div style="display: inline-block; margin-left: 20px">
      <el-select
v-model="value3" :onChange="handleSelectIndicator" :onClear="handleClear" multiple clearable filterable
        collapse-tags placeholder="Search Indicator">
        <el-option v-for="item in settlementOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="DownloadXlsx" type="primary" :icon="Download" />
    </div>
    <DownloadAll  v-if="showEditButtons"   :model="model" :associated_models="associated_multiple_models"/>

    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="handleClear" type="primary" :icon="Filter" />
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-tooltip content="Add Indicator" placement="top">
        <el-button v-if="showAdminButtons" :onClick="AddIndicator" type="primary" :icon="Plus" />
      </el-tooltip>
    </div>

    <el-divider border-style="dashed" content-position="left">Results</el-divider>




    <el-table :data="tableDataList" :loading="loading" border>
      <el-table-column label="Id" prop="id" :width="idColumnWidth" sortable />
      <el-table-column label="Title" prop="name" sortable />
      <el-table-column label="Activity" prop="activity.title" sortable />
       <el-table-column label="Type" prop="type" sortable />
      <el-table-column fixed="right" label="Actions" :width="actionColumnWidth" sortable>
        <template #default="scope">
          <el-dropdown v-if="isMobile">
            <span class="el-dropdown-link">
              <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
v-if="showAdminButtons" @click="editIndicator(scope as TableSlotDefault)" :icon="Edit"
                  color="green">Edit</el-dropdown-item>
                <el-dropdown-item
v-if="showAdminButtons" @click="DeleteIndicator(scope.row as TableSlotDefault)"
                  :icon="Delete" color="red">Delete</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <div v-else>

            <el-tooltip v-if="showAdminButtons" content="Edit" placement="top">
              <el-button
type="success" size="small" :icon="Edit" @click="editIndicator(scope as TableSlotDefault)"
                circle />
            </el-tooltip>


            <el-tooltip v-if="showAdminButtons" content="Delete" placement="top">
              <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
                title="Are you sure to delete this record?" width="150"
                @confirm="DeleteIndicator(scope.row as TableSlotDefault)">
                <template #reference>
                  <el-button type="danger" size="small" :icon=Delete circle />
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

  <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formHeader" :width="dialogWidth" draggable>
    <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px">

      <el-form-item label="Activity" prop="activity_id">
      <el-select filterable v-model="ruleForm.activity_id" placeholder="Select Activity" style="width: 100%">
        <el-option v-for="item in activityOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>



      <el-form-item label="Title" prop="name">
        <el-input v-model="ruleForm.name" />
      </el-form-item>
      <el-form-item label="Type" prop="type">
        <el-select v-model="ruleForm.type" placeholder="Type" >
          <el-option label="Output" value="output" />
          <el-option label="Impact" value="outcome" />
        </el-select>
      </el-form-item>
      <el-form-item label="Format" prop="format">
        <el-select v-model="ruleForm.format" placeholder="Format"  >
          <el-option label="Number" value="number" />
          <el-option label="Percent" value="percent" />
        </el-select>
      </el-form-item>
         <el-form-item label="Unit" prop="format">
        <el-select clearable filterable v-model="ruleForm.unit"  allow-create placeholder="Unit">
          <el-option label="Kilometre" value="Km" />
          <el-option label="Number" value="No." />
          <el-option label="Household" value="HH" />
           
        </el-select>
      </el-form-item>
      <el-form-item label="Level"  prop="level">
        <el-select v-model="ruleForm.level" placeholder="Level" >
          <el-option label="Settlement" value="Settlement" />
          <el-option label="County" value="County" />
          <el-option label="National" value="National" />
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

<!-- 
  <el-dialog v-model="xAddDialogVisible" @close="handleClose" :title="formHeader" :width="dialogWidth" draggable>
   
    <el-form
    ref="ruleFormRef"
    :model="ruleForm"
    :rules="rules"
    label-width="120px"
    class="demo-ruleForm"
    :size="formSize"
    status-icon
  >
    <el-form-item label="Activity name" prop="name">
      <el-input v-model="ruleForm.name" />
    </el-form-item>
    <el-form-item label="Activity zone" prop="region">
      <el-select v-model="ruleForm.region" placeholder="Activity zone">
        <el-option label="Zone one" value="shanghai" />
        <el-option label="Zone two" value="beijing" />
      </el-select>
    </el-form-item>
    <el-form-item label="Activity count" prop="count">
      <el-select-v2
        v-model="ruleForm.count"
        placeholder="Activity count"
        :options="options"
      />
    </el-form-item>
    <el-form-item label="Activity time" required>
      <el-col :span="11">
        <el-form-item prop="date1">
          <el-date-picker
            v-model="ruleForm.date1"
            type="date"
            label="Pick a date"
            placeholder="Pick a date"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col class="text-center" :span="2">
        <span class="text-gray-500">-</span>
      </el-col>
      <el-col :span="11">
        <el-form-item prop="date2">
          <el-time-picker
            v-model="ruleForm.date2"
            label="Pick a time"
            placeholder="Pick a time"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
    </el-form-item>
    <el-form-item label="Instant delivery" prop="delivery">
      <el-switch v-model="ruleForm.delivery" />
    </el-form-item>
    <el-form-item label="Activity type" prop="type">
      <el-checkbox-group v-model="ruleForm.type">
        <el-checkbox label="Online activities" name="type" />
        <el-checkbox label="Promotion activities" name="type" />
        <el-checkbox label="Offline activities" name="type" />
        <el-checkbox label="Simple brand exposure" name="type" />
      </el-checkbox-group>
    </el-form-item>
    <el-form-item label="Resources" prop="resource">
      <el-radio-group v-model="ruleForm.resource">
        <el-radio label="Sponsorship" />
        <el-radio label="Venue" />
      </el-radio-group>
    </el-form-item>
    <el-form-item label="Activity form" prop="desc">
      <el-input v-model="ruleForm.desc" type="textarea" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submitForm(ruleFormRef)">
        Create
      </el-button>
      <el-button @click="resetForm(ruleFormRef)">Reset</el-button>
    </el-form-item>
  </el-form>
    
  </el-dialog> -->

</template>
