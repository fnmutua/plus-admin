<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty, getHHsByCounty } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import {
  ElButton, ElSelect, FormInstance, MessageParamsWithType, ElDialog, ElInputNumber, ElDatePicker, ElForm, ElFormItem, ElUpload, ElCascader, FormRules, ElPopconfirm
} from 'element-plus'
import { ElMessage } from 'element-plus'
import { Position, TopRight, Plus, User, Download, Delete, Edit, Filter } from '@element-plus/icons-vue'

import { ref, reactive } from 'vue'
import { ElPagination, ElTooltip, ElOption, ElDivider } from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { CreateRecord, DeleteRecord, updateOneRecord, deleteDocument, uploadDocuments } from '@/api/settlements'

import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { uuid } from 'vue-uuid'

import xlsx from "json-as-xlsx"



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
const formheader = ref('Add Intervention')


let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var intervenComponent = [] // Fiters tenure=1, inf=2, socio=3, caapcity=4
var filterValues = []
var tblData = ref([])
const associated_Model = ''
const associated_multiple_models = ['households', 'settlement', 'benefit_type', 'intervention']

const model = 'beneficiary'
//// ------------------parameters -----------------------////

const { t } = useI18n()

const columns: TableColumn[] = [
  {
    field: 'index',
    label: t('userDemo.index'),
    type: 'index'
  },

  {
    field: 'household.name',
    label: t('Name')
  },

  {
    field: 'household.national_id',
    label: t('National ID')
  },
  {
    field: 'settlement.name',
    label: t('Settlement')
  },
  {
    field: 'benefit_type.type',
    label: t('Benefit')
  },
  {
    field: 'action',
    width: "300",
    fixed: "right",
    label: 'Operations'
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
  tblData.value = []
  //----run the get data--------
  getAllBeneficiaries()
}

const handleSelectPhase = async (phase: any) => {
  var selectOption = 'intervention_phase'
  if (!filters.includes(selectOption)) {
    filters.push(selectOption)
  }
  var index = filters.indexOf(selectOption) // 1
  console.log('intervention_phase : index--->', index)

  // clear previously selected
  if (filterValues[index]) {
    // filterValues[index].length = 0
    filterValues.splice(index, 1)
  }

  if (!filterValues.includes(phase) && phase.length > 0) {
    filterValues.splice(index, 0, phase) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
  }

  // expunge the filter if the filter values are null
  if (phase.length === 0) {
    filters.splice(index, 1)
  }

  console.log('FilterValues:', filterValues)

  getFilteredData(filters, filterValues)
}
const filterByType = async (phase: any) => {
  var selectOption = 'intervention_id'
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

  if (!filterValues.includes(phase) && phase.length > 0) {
    filterValues.splice(index, 0, phase) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
  }

  // expunge the filter if the filter values are null
  if (phase.length === 0) {
    filters.splice(index, 1)
  }

  console.log('FilterValues:', filterValues)

  getFilteredData(filters, filterValues)
}

const filterByBeneficiary = async (settlement: any) => {
  var selectOption = 'hh_id'
  if (!filters.includes(selectOption)) {
    filters.push(selectOption)
  }
  var index = filters.indexOf(selectOption) // 1
  console.log('settlement : index--->', index)

  // clear previously selected
  if (filterValues[index]) {
    // filterValues[index].length = 0
    filterValues.splice(index, 1)
  }

  if (!filterValues.includes(settlement) && settlement.length > 0) {
    filterValues.splice(index, 0, settlement) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
  }

  // expunge the filter if the filter values are null
  if (settlement.length === 0) {
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

  formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = selFilters
  formData.filterValues = selfilterValues
  formData.associated_multiple_models = associated_multiple_models

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('After Querry - associated_multiple_models', res)
  tableDataList.value = res.data
  total.value = res.total

  tblData.value = [] // reset the table data
  console.log('TBL-b4-', tblData)
  res.data.forEach(function (arrayItem) {
    console.log(arrayItem)
    //delete arrayItem[associated_Model]['geom'] //  remove the geometry column

    var dd = destructure(arrayItem)
    delete dd['0']
    delete dd['1']

    tblData.value.push(dd)
  })

  console.log('TBL-4f', tblData)
}

const PhaseOptions = [
  {
    label: 'KISIP I',
    value: 1
  },
  {
    label: 'KISIP II',
    value: 2
  }
]

const getInterventionTypes = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'intervention_type',
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
      countyOpt.label = arrayItem.type + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      interVentionTypeOptions.value.push(countyOpt)
    })
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

const open = (msg: MessageParamsWithType) => {
  ElMessage.error(msg)
}

const handleDownload = () => {
  downloadLoading.value = true
  const data = tblData
  const fileName = 'data.xlsx'
  const exportType = exportFromJSON.types.csv
  if (data.value) exportFromJSON({ data, fileName, exportType })
}




getBeneficiaryType()
getHouseholds()

getInterventionTypes()
getSettlementsOptions()
getAllBeneficiaries()
getInterventions()
console.log('Options---->', interVentionTypeOptions)
const viewProfile = (data: TableSlotDefault) => {
  console.log('On Click.....', data.row.id)

  push({
    path: '/settlement/:id',
    name: 'SettlementDetails',
    params: { data: data.row.id, id: data.row.id }
  })
}




//*****************************Create**************************** */

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  hh_id: '',
  intervention_phase: '',
  intervention_id: null,
  settlement_id: null,
  benefit_type_id: null,
  code: ''
})

const rules = reactive<FormRules>({
  indicator_id: [
    { required: true, message: 'Please provide indicator name', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }
  ],
  category_id: [
    { required: true, message: 'Indicator category is required', trigger: 'blur' }],
  frequency: [{ required: true, message: 'The Indicator frequency is required', trigger: 'blur' }],

})
const AddDialogVisible = ref(false)
const showSubmitBtn = ref(false)

const AddIntervention = () => {
  AddDialogVisible.value = true
  showSubmitBtn.value = true
}

const saveForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ruleForm.model = 'beneficiary'
      ruleForm.code = uuid.v4()
      console.log(ruleForm.value)
      await CreateRecord(ruleForm).then(() => { })
    } else {
      console.log('error submit!', fields)
    }
  })
}




const DeleteBeneficiary = (data: TableSlotDefault) => {
  console.log('----->', data.row.id)
  let formData = {}
  formData.id = data.row.id
  formData.model = 'beneficiary'

  DeleteRecord(formData)

  console.log(tableDataList.value)

  // remove the deleted object from array list 
  let index = tableDataList.value.indexOf(data.row);
  if (index !== -1) {
    tableDataList.value.splice(index, 1);
  }

}

const editBeneficiary = (data: TableSlotDefault) => {
  showSubmitBtn.value = false
  // showEditSaveButton.value = true
  console.log(data)
  ruleForm.id = data.row.id
  ruleForm.intervention_phase = data.row.intervention_phase
  ruleForm.settlement_id = data.row.settlement_id
  ruleForm.hh_id = data.row.hh_id
  ruleForm.intervention_id = data.row.intervention_id
  ruleForm.benefit_type_id = data.row.benefit_type_id
  ruleForm.code = data.row.code


  // formHeader.value = 'Edit Report'
  showEditSaveButton.value = true
  showAddSaveButton.value = false
  AddDialogVisible.value = true
  formheader.value = 'Edit Beneficiary'

}

const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ruleForm.model = 'beneficiary'
      await updateOneRecord(ruleForm).then(() => { })

    } else {
      console.log('error in editiinh!', fields)
    }
  })
}

const handleClose = () => {

  console.log("Closing the dialoig")
  showAddSaveButton.value = true
  showEditSaveButton.value = false

  ruleForm.settlement_id = null
  ruleForm.intervention_phase = null
  ruleForm.intervention_id = null
  ruleForm.hh_id = null
  ruleForm.benefit_type_id = null



  formheader.value = 'Add Beneficiary'
  AddDialogVisible.value = false

}

const onchangeIntervention = async (intervention: any) => {
  console.log('Selected Intervention', intervention)

  let filterObj = interventionsOptions.value.filter((item) => item.value === intervention);

  console.log('Selected filterObj', filterObj[0].settlement_id)
  ruleForm.settlement_id = filterObj[0].settlement_id
  console.log('Selected filterObj', ruleForm)


}



const DownloadXlsx = async () => {
  console.log(tableDataList.value)

  // change here !
  let fields = [
    { label: "S/No", value: "index" }, // Top level data
    { label: "Name", value: "name" }, // Top level data
    { label: "Gender", value: "gender" }, // Custom format
    { label: "Age", value: "age_plot_owner" }, // Run functions
    { label: "Ownership", value: "ownership_status" }, // Run functions
    { label: "Length of Stay", value: "length_stay" }, // Run functions
    { label: "Settlement", value: "settlement" }, // Run functions
    { label: "Programme", value: "benefit_type" }, // Run functions
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
    thisRecord.name = tableDataList.value[i].household.name
    thisRecord.index = i + 1
    thisRecord.gender = tableDataList.value[i].household.gender
    thisRecord.age_plot_owner = tableDataList.value[i].household.age_plot_owner
    thisRecord.ownership_status = tableDataList.value[i].household.ownership_status
    thisRecord.length_stay = tableDataList.value[i].household.length_stay
    thisRecord.settlement = tableDataList.value[i].settlement.name
    thisRecord.benefit_type = tableDataList.value[i].benefit_type.type
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
  <ContentWrap :title="t('Beneficiaries')"
    :message="t('The list of  intervention beneficiaries. Use the filters to subset')">
    <el-divider border-style="dashed" content-position="left">Filters</el-divider>

    <div style="display: inline-block; margin-left: 10px">
      <el-select v-model="value5" :onChange="filterByBeneficiary" :onClear="handleClear" multiple clearable filterable
        collapse-tags placeholder="By Beneficiary">
        <el-option v-for="item in houseHoldOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>

    <div style="display: inline-block; margin-left: 10px">
      <el-select v-model="value4" :onChange="filterByType" :onClear="handleClear" multiple clearable filterable
        collapse-tags placeholder="By Intervention">
        <el-option v-for="item in interventionsOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>

    <div style="display: inline-block; margin-left: 10px">
      <el-select v-model="value2" :onChange="handleSelectPhase" :onClear="handleClear" multiple clearable filterable
        collapse-tags placeholder="By KISIP Phase">
        <el-option v-for="item in PhaseOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>


    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="handleClear" type="primary" :icon="Filter" />
    </div>

    <div style="display: inline-block; margin-left: 20px">
      <el-tooltip content="Add Beneficiary" placement="top">
        <el-button :onClick="AddIntervention" type="primary" :icon="Plus" />
      </el-tooltip>
    </div>

    <div style="display: inline-block; margin-left: 20px">
      <el-tooltip content="Download" placement="top">
        <el-button :onClick="DownloadXlsx" type="primary" :icon="Download" />
      </el-tooltip>
    </div>




    <el-divider border-style="dashed" content-position="left">Results</el-divider>

    <Table :columns="columns" :data="tableDataList" :loading="loading" :selection="true" :pageSize="pageSize"
      :currentPage="currentPage">
      <template #action="data">
        <el-tooltip content="View Profile" placement="top">
          <el-button type="primary" :icon="TopRight" @click="viewProfile(data as TableSlotDefault)" circle />
        </el-tooltip>

        <el-tooltip content="Edit" placement="top">
          <el-button v-show="showAdminButtons" type="success" :icon="Edit"
            @click="editBeneficiary(data as TableSlotDefault)" circle />
        </el-tooltip>

        <el-tooltip content="Delete" placement="top">
          <el-popconfirm confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
            title="Are you sure to delete this record?" @confirm="DeleteBeneficiary(data as TableSlotDefault)">
            <template #reference>
              <el-button v-if="showAdminButtons" type="danger" :icon=Delete circle />
            </template>
          </el-popconfirm>
        </el-tooltip>


      </template>
    </Table>
    <ElPagination layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
      v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 200, 1000]" :total="total" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
  </ContentWrap>



  <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formheader" width="30%" draggable>
    <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px">

      <el-form-item label="Benefit">
        <el-select filterable v-model="ruleForm.benefit_type_id" placeholder="Select Benefit">
          <el-option v-for="item in benefitTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="Beneficiary">
        <el-select filterable v-model="ruleForm.hh_id" placeholder="Select Beneficiary">
          <el-option v-for="item in houseHoldOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="Intervention">
        <el-select filterable v-model="ruleForm.intervention_id" :onChange="onchangeIntervention"
          placeholder="Select Settlement">
          <el-option v-for="item in interventionsOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>


      <el-form-item label="Phase">
        <el-select filterable v-model="ruleForm.intervention_phase" placeholder="Select intervention Phase">
          <el-option v-for="item in PhaseOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>




    </el-form>
    <template #footer>

      <span class="dialog-footer">
        <el-button @click="AddDialogVisible = false">Cancel</el-button>
        <el-button v-if="showAddSaveButton" type="primary" @click="saveForm(ruleFormRef)">Submit</el-button>
        <el-button v-if="showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>

      </span>
    </template>
  </el-dialog>


</template>
