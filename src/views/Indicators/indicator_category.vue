<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty, getListManyToMany } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { ElButton, ElSelect, MessageParamsWithType } from 'element-plus'

import {
  Plus,
  Edit,
  Delete,
  Download,
  Filter
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
import xlsx from "json-as-xlsx"

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


console.log("userInfo--->", userInfo)




const isMobile = computed(() => appStore.getMobile)

console.log('IsMobile', isMobile)

const dialogWidth = ref()
const actionColumnWidth = ref()

if (isMobile.value) {
  dialogWidth.value = "100px"
  actionColumnWidth.value = "100px"
} else {
  dialogWidth.value = "25%"
  actionColumnWidth.value = "160px"

}



const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
const categoryOptions = ref([])
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

const AddDialogVisible = ref(false)
const formHeader = ref('Add Indicator')
const showSubmitBtn = ref(true)
const showEditSaveButton = ref(false)


console.log("Show Buttons -->", showAdminButtons)



let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var filterValues = []
var tblData = []
const associated_Model = ''
const associated_multiple_models = ['indicator', 'project', 'activity', 'category']
const model = 'indicator_category'
const nested_models = ['indicator', 'activity'] // The mother, then followed by the child

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
  pSize.value = 5
  currentPage.value = 1
  tblData = []
  //----run the get data--------
  getInterventionsAll()
}

const handleSelectIndicator = async (indicator: any) => {
  var selectOption = 'indicator_id'
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
  makeSettlementOptions(filteredIndicators)

  getFilteredData(filters, filterValues)
}

const handleSelectCategory = async (category: any) => {
  var selectOption = 'category_id'
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

  if (!filterValues.includes(category) && category.length > 0) {
    filterValues.splice(index, 0, category) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
  }

  // expunge the filter if the filter values are null
  if (category.length === 0) {
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
  formData.nested_models = nested_models
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

const indicatorsOptions = ref([])

const getIndicatorNames = async () => {
  const res = await getCountyListApi({
    params: {
      //   pageIndex: 1,
      //    limit: 100,
      curUser: 1, // Id for logged in user
      model: 'indicator',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received indicators:', response)
    //tableDataList.value = response.data
    var ret = response.data

    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var opt = {}
      opt.value = arrayItem.id
      opt.activity_id = arrayItem.activity_id
      opt.label = arrayItem.name + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      indicatorsOptions.value.push(opt)
      indicatorsOptionsFiltered.value.push(opt)
    })
  })
}

const getCategoryOptions = async () => {
  const res = await getCountyListApi({
    params: {
      //   pageIndex: 1,
      //   limit: 100,
      curUser: 1, // Id for logged in user
      model: 'category',
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
  categoryOptions.value = []
  list.value.forEach(function (arrayItem: { id: string; type: string }) {
    var countyOpt = {}
    countyOpt.value = arrayItem.id
    countyOpt.label = arrayItem.category   //+ '(' + arrayItem.id + ')'

    //  console.log(countyOpt)
    categoryOptions.value.push(countyOpt)
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
const activityOptionsFiltered = ref([])

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


//const projectOptions = ref([])
const getProjectOptions = async () => {
  await getCountyListApi({
    params: {
      //   pageIndex: 1,
      //   limit: 100,
      curUser: 1, // Id for logged in user
      model: 'project',
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
      projectOptions.value.push(opt)
    })


  })
}


const projectOptions = ref([])

const getProjectActivities = async () => {
  const formData = {}
  // formData.limit = 10000
  formData.curUser = 1 // Id for logged in user
  formData.model = 'project'
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  formData.assocModel = ''

  // - multiple filters -------------------------------------
  formData.filters = []
  formData.filterValues = []
  formData.associated_multiple_models = ['activity']
  formData.associated_multiple_field = ['project_activity']

  //-------------------------
  //console.log(formData)
  const res = await getListManyToMany(formData)

  console.log('Projects >>', res)
  res.data.forEach(function (arrayItem) {

    //console.log(arrayItem)
    var opt = {}
    opt.value = arrayItem.id
    opt.label = arrayItem.title + '(' + arrayItem.id + ')'

    //  console.log(countyOpt)
    projectOptions.value.push(opt)

    //console.log('projectOptions', arrayItem)

    arrayItem.activities.forEach(function (activity: { id: string; type: string }) {
      //console.log(arrayItem)
      var act_opt = {}
      act_opt.project_id = arrayItem.id   // this the project id that will be used to filter the acivty options 
      act_opt.value = activity.id
      act_opt.label = activity.title + '(' + activity.id + ')'

      //  console.log(countyOpt)
      activityOptions.value.push(act_opt)  // We keep this as backup 
      //activityOptionsFiltered.value.push(act_opt)

    })

  })

}


const changeProject = async (project: any) => {

  console.log('Activities List Project ID>>', activityOptions.value)
  console.log('Activities List >>', project)

  const filter_activities = await activityOptions.value.filter(function (el) {
    return el.project_id == project
  });
  activityOptionsFiltered.value = filter_activities

}

const indicatorsOptionsFiltered = ref([])


const changeActivity = async (activity: any) => {
  indicatorsOptionsFiltered.value = indicatorsOptions.value.filter(function (el) {
    return el.activity_id == activity
  });

}



getProjectActivities()
//getActivityOptions()
//getProjectOptions()

getIndicatorNames()
getCategoryOptions()
getInterventionsAll()




const editIndicator = (data: TableSlotDefault) => {
  showSubmitBtn.value = false
  showEditSaveButton.value = true
  console.log(data)
  ruleForm.id = data.row.id
  ruleForm.indicator_name = data.row.indicator.indicator_name
  ruleForm.indicator_id = data.row.indicator_id
  ruleForm.category_id = data.row.category_id
  ruleForm.frequency = data.row.frequency
  ruleForm.category_title = data.row.category_title
  ruleForm.activity_id = data.row.activity_id
  ruleForm.project_id = data.row.project_id

  formHeader.value = 'Edit Indicator'


  AddDialogVisible.value = true
}


const DeleteIndicator = (data: TableSlotDefault) => {
  console.log('----->', data.row)
  let formData = {}
  formData.id = data.row.id
  formData.model = 'indicator_category'
  DeleteRecord(formData)
  console.log(tableDataList.value)

  // remove the deleted object from array list 
  let index = tableDataList.value.indexOf(data.row);
  if (index !== -1) {
    tableDataList.value.splice(index, 1);
  }

}


const handleClose = () => {

  console.log("Closing the dialoig")
  showSubmitBtn.value = true
  showEditSaveButton.value = false

  ruleForm.indicator_id = ''
  ruleForm.indicator_name = ''
  ruleForm.category_id = ''
  ruleForm.category_title = ''
  ruleForm.frequency = ''


  formHeader.value = 'Add Indicator'
  AddDialogVisible.value = false

}



const changeCategory = async (category: any) => {
  ruleForm.category_id = category
  var filtredCategories = categoryOptions.value.filter(function (el) {
    return el.value == category
  });
  ruleForm.category_title = filtredCategories[0].label

}

const changeIndicator = async (indicator: any) => {
  ruleForm.indicator_id = indicator
  var filtredOptions = indicatorsOptions.value.filter(function (el) {
    return el.value == indicator
  });

  console.log("Filtered Idnciators", filtredOptions[0].label)
  ruleForm.indicator_name = filtredOptions[0].label
}





const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  indicator_id: '',
  indicator_name: '',
  category_id: '',
  category_title: '',
  frequency: '',
  activity_id: null,
  code: null,
  project_id: null
})

const rules = reactive<FormRules>({
  indicator_id: [
    { required: true, message: 'Please provide indicator name', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }
  ],
  category_id: [{ required: true, message: 'Indicator category is required', trigger: 'blur' }],
  frequency: [{ required: true, message: 'The Indicator frequency is required', trigger: 'blur' }],
  activity_id: [{ required: true, message: 'The Indicator Activity is required', trigger: 'blur' }],

})

const AddIndicator = () => {
  AddDialogVisible.value = true
}


const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      ruleForm.model = 'indicator_category'
      ruleForm.code = ruleForm.indicator_id + '_' + ruleForm.activity_id + '_' + ruleForm.project_id + '_' + ruleForm.category_id
      const res = CreateRecord(ruleForm)
      console.log('ruleForm.code >>', ruleForm.code)
      //  AddDialogVisible.value = false

    } else {
      console.log('error submit!', fields)
    }
  })
}


const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      ruleForm.model = 'indicator_category'
      ruleForm.code = ruleForm.indicator_id + '_' + ruleForm.activity_id + '_' + ruleForm.project_id + '_' + ruleForm.category_id

      updateOneRecord(ruleForm).then(() => { })

      // dialogFormVisible.value = false


    } else {
      console.log('error submit!', fields)
    }
  })
}







console.log('Options---->', indicatorsOptions)



const DownloadXlsx = async () => {
  console.log(tableDataList.value)

  // change here !
  let fields = [
    { label: "S/No", value: "index" }, // Top level data
    { label: "Indicator", value: "indicator" }, // Top level data
    { label: "Unit", value: "unit" }, // Custom format
    { label: "Level", value: "level" }, // Custom format
    { label: "Frequency", value: "frequency" }, // Custom format
    { label: "Category", value: "category" }, // Custom format

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
    thisRecord.indicator = tableDataList.value[i].indicator.name
    thisRecord.unit = tableDataList.value[i].indicator.unit
    thisRecord.level = tableDataList.value[i].indicator.level
    thisRecord.frequency = tableDataList.value[i].frequency
    thisRecord.category = tableDataList.value[i].category.category


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
  <ContentWrap :title="t('Indicator Configurations')" :message="t('Use the filters to subset')">
    <el-divider border-style="dashed" content-position="left">Filters</el-divider>

    <div style="display: inline-block; margin-left: 20px">
      <el-select
v-model="value2" :onChange="handleSelectIndicator" :onClear="handleClear" multiple clearable filterable
        collapse-tags placeholder="Filter by Indicator">
        <el-option v-for="item in indicatorsOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-select
v-model="value3" :onChange="handleSelectCategory" :onClear="handleClear" multiple clearable filterable
        collapse-tags placeholder="Filter by Category">
        <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="DownloadXlsx" type="primary" :icon="Download" />
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="handleClear" type="primary" :icon="Filter" />
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-tooltip content="Add Indicator Configuration" placement="top">
        <el-button v-if="showAdminButtons" :onClick="AddIndicator" type="primary" :icon="Plus" />
      </el-tooltip>
    </div>

    <el-divider border-style="dashed" content-position="left">Results</el-divider>





    <el-table :data="tableDataList" :loading="loading" border>
      <el-table-column label="Id" prop="id" width="50px" sortable />
      <el-table-column label="Project" prop="project.title" sortable />
      <el-table-column label="Indicator" prop="indicator.name" sortable />
      <!-- <el-table-column label="Reporting" prop="frequency" sortable /> -->
      <el-table-column label="Activity" prop="activity.title" sortable />
      <el-table-column label="Category" prop="category.category" sortable />


      <el-table-column fixed="right" label="Actions" :width="actionColumnWidth">
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
v-if="showAdminButtons" @click="DeleteIndicator(scope as TableSlotDefault)"
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
                @confirm="DeleteIndicator(scope as TableSlotDefault)">
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

  <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formHeader" draggable>
    <el-col :xl="24" :lg="24" :md="24" :sm="24" :xs="24">

      <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px">

        <el-form-item label="Project">
          <el-select filterable v-model="ruleForm.project_id" :onChange="changeProject" placeholder="Select Project">
            <el-option v-for="item in projectOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="Activity">
          <el-select filterable v-model="ruleForm.activity_id" :onChange="changeActivity" placeholder="Select Activity">
            <el-option
v-for="item in activityOptionsFiltered" :key="item.value" :label="item.label"
              :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="Indicator">
          <el-select
filterable v-model="ruleForm.indicator_id" :onChange="changeIndicator"
            placeholder="Select Indicator">
            <el-option
v-for="item in indicatorsOptionsFiltered" :key="item.value" :label="item.label"
              :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="Category">
          <el-select v-model="ruleForm.category_id" :onChange="changeCategory" placeholder="Select Category">
            <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="Frequency">
          <el-select clearable filterable v-model="ruleForm.frequency" placeholder="Unit">
            <el-option label="Quarterly" value="Quarterly" />
            <el-option label="Monthly" value="Monthly" />
            <el-option label="Annually" value="Annually" />

          </el-select>
        </el-form-item>

      </el-form>

    </el-col>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="AddDialogVisible = false">Cancel</el-button>
        <el-button v-if="showSubmitBtn" type="primary" @click="submitForm(ruleFormRef)">Submit</el-button>
        <el-button v-if="showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>
      </span>
    </template>

  </el-dialog>
</template>
