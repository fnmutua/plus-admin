<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { ElButton, ElSelect, ElTour, ElCard, ElTourStep } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Plus,
  Download,
  Filter,
  Edit,Back,
  InfoFilled,
  Delete
} from '@element-plus/icons-vue'

import { ref, reactive, computed } from 'vue'
import {
  ElPagination, ElTable,
  ElTableColumn, ElDropdown, ElDropdownItem, ElDropdownMenu,
  ElTooltip, ElOption, ElDivider, ElDialog, ElForm, ElFormItem, ElInput, ElPopconfirm
} from 'element-plus'


import { useRouter } from 'vue-router'
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
const page = ref(1)
const pSize = ref(5)
const selCounties = []
const loading = ref(true)
const pageSize = ref(5)
const currentPage = ref(1)
const total = ref(0)
const downloadLoading = ref(false)


const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)



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

const openHelp = ref(false)

const AddActivityDialog = ref(false)
const AddNewActivity = () => {
  console.log('adding....')
  AddActivityDialog.value = true

}


const handleCloseActivity = () => {
  AddActivityDialog.value = false

}


const ActivityFormRef = ref<FormInstance>()
const activity_form = reactive({
  title: '',
  shortTitle: ''
})

const freqRules = reactive({

  title: [
    { required: true, message: 'Please provide an activity title', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }
  ],

  shortTitle: [
    { required: true, message: 'A shorter title is required', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }
  ],


})


const submitActivityForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => { // Make the callback function async
    if (valid) {
      activity_form.model = 'activity'
      activity_form.code = uuid.v4()
      const res = await CreateRecord(activity_form)
      console.log(res.data)
      var act = {}
      act.value = res.data.id
      act.label = res.data.title

      activityOptions.value.push(act)
    } else {
      console.log('error categoryForm!', fields)
    }
  })


}


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
v-model="value3" :onChange="handleSelectIndicator" :onClear="handleClear" multiple clearable filterable
        collapse-tags placeholder="Search Indicator">
        <el-option v-for="item in settlementOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>





      <!-- Action Buttons -->
      <div style="display: flex; align-items: center; gap: 10px; margin-left: 10px;">
        <el-tooltip content="Add Indicator" placement="top">
          <el-button v-if="showAdminButtons" :onClick="AddIndicator" type="primary" :icon="Plus" />
        </el-tooltip>
        <el-button :onClick="DownloadXlsx" type="primary" :icon="Download" />
        <DownloadAll v-if="showEditButtons" :model="model" :associated_models="associated_multiple_models" />
        <el-button :onClick="handleClear" type="primary" :icon="Filter" />

      </div>

     </el-row>








    <el-table :data="tableDataList" :loading="loading" border style="width: 100%; margin-top: 10px;">
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
layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
      v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 200, 10000]" :total="total" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
  </el-card>

  <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formHeader" :width="dialogWidth" draggable>
    <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px">

      <el-form-item id="btn1" label="Activity" prop="activity_id">
        <el-select
filterable v-model="ruleForm.activity_id" placeholder="Select Activity"
          style="width: 85%; margin-right: 10px;">
          <el-option v-for="item in activityOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-button type="primary" @click="AddNewActivity" :icon="Plus" plain />

      </el-form-item>



      <el-form-item id="btn2" label="Title" prop="name">
        <el-input v-model="ruleForm.name" />
      </el-form-item>
      <el-form-item id="btn3" label="Type" prop="type">
        <el-select v-model="ruleForm.type" placeholder="Type">
          <el-option label="Output" value="output" />
          <el-option label="Impact" value="outcome" />
        </el-select>
      </el-form-item>
      <el-form-item id="btn4" label="Format" prop="format">
        <el-select v-model="ruleForm.format" placeholder="Format">
          <el-option label="Number" value="number" />
          <el-option label="Percent" value="percent" />
        </el-select>
      </el-form-item>
      <el-form-item id="btn5" label="Unit" prop="format">
        <el-select clearable filterable v-model="ruleForm.unit" allow-create placeholder="Unit">
          <el-option label="Kilometre" value="Km" />
          <el-option label="Number" value="No." />
          <el-option label="Household" value="HH" />

        </el-select>
      </el-form-item>
      <el-form-item id="btn6" label="Level" prop="level">
        <el-select v-model="ruleForm.level" placeholder="Level">
          <el-option label="Settlement" value="Settlement" />
          <el-option label="County" value="County" />
          <el-option label="National" value="National" />
        </el-select>
      </el-form-item>


    </el-form>
    <template #footer>

      <span class="dialog-footer">
        <el-button type="primary" plain @click="openHelp = true">Help</el-button>
        <el-button @click="AddDialogVisible = false">Cancel</el-button>
        <el-button v-if="showSubmitBtn" type="primary" @click="submitForm(ruleFormRef)">Submit</el-button>
        <el-button v-if="showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>
      </span>
    </template>
  </el-dialog>

  <el-tour v-model="openHelp" z-index="100000">
    <el-tour-step
target="#btn1" title="Activity"
      description="Select the project activity you wish to configure an indicator for" />
    <el-tour-step
target="#btn2" title="Title"
      description="Enter a unique name for the indicator. This name will be used to identify the indicator in reports and dashboards." />
    <el-tour-step
target="#btn3" title="Type"
      description="Select whether this indicator measures an 'Impact' or an 'Output.' Impact: Refers to the long-term effects or changes that occur as a result of the activities or interventions, often related to the overall goal.Output: Refers to the immediate results or products of activities, such as services delivered or goods produced." />
    <el-tour-step
target="#btn4" title="Format"
      description="Specify how the indicator will be calculated. Options may include sums, averages, percentages" />

    <el-tour-step
target="#btn5" title="Unit"
      description="Specify the unit of measurement for this indicator (e.g.,  Kilometer, dollars, kilograms). This unit should align with the data being collected and reported, ensuring consistency and clarity in how the indicator's values are interpreted." />

    <el-tour-step
target="#btn6" title="Level"
      description="Select the level at which the indicator's data will be reported." />


  </el-tour>



  <el-dialog
v-model="AddActivityDialog" @close="handleCloseActivity" title="Add Activity" :width="dialogWidth"
    draggable>
    <el-form ref="ActivityFormRef" :model="activity_form" :rules="freqRules">

      <el-form-item label="Title" prop="title">
        <el-input v-model="activity_form.title" :style="{ width: '100%' }" />
      </el-form-item>

      <el-form-item label="Short Title" prop="shortTitle">
        <el-input v-model="activity_form.shortTitle" :style="{ width: '100%' }" />
      </el-form-item>
    </el-form>
    <template #footer>

      <span class="dialog-footer">
        <el-button @click="AddActivityDialog = false">Cancel</el-button>
        <el-button type="primary" @click="submitActivityForm(ActivityFormRef)">Save</el-button>
      </span>
    </template>
  </el-dialog>


</template>
