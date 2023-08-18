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
const interVentionTypeOtions = ref([])
const interVentionClusterOtions = ref([])




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
var filters = ['intervention_type_id']
var intervenComponent = [1] // Fiters tenure=1, inf=2, socio=3, caapcity=4
var filterValues = [intervenComponent]
var tblData = []
const associated_Model = ''
const associated_multiple_models = ['settlement', 'intervention_type']

const model = 'intervention'
//// ------------------parameters -----------------------////

const { t } = useI18n()

const columns: TableColumn[] = [
  {
    field: 'index',
    label: t('userDemo.index'),
    type: 'index'
  },

  {
    field: 'settlement.name',
    label: t('Name')
  },

  {
    field: 'settlement.area',
    label: t('Area(Ha.)')
  },
  {
    field: 'intervention_type.type',
    label: t('Type')
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
  filterValues = [intervenComponent]
  filters = ['intervention_type_id']
  value1.value = ''
  value2.value = ''
  value3.value = ''
  pSize.value = 5
  currentPage.value = 1
  tblData = []
  //----run the get data--------
  getInterventionsAll()
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
  var selectOption = 'intervention_type_id'
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

const handleSelectSettlement = async (settlement: any) => {
  var selectOption = 'settlement_id'
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

const getInterventionsAll = async () => {
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

  tblData = [] // reset the table data
  console.log('TBL-b4-', tblData)
  res.data.forEach(function (arrayItem) {
    //  console.log(countyOpt)
    // delete arrayItem[associated_Model]['geom'] //  remove the geometry column

    var dd = destructure(arrayItem)

    tblData.push(dd)
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
      interVentionTypeOtions.value.push(countyOpt)
    })
  })
}

const getInterventionClusters = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'cluster',
      searchField: 'description',
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
      countyOpt.label = arrayItem.contract + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      interVentionClusterOtions.value.push(countyOpt)
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
  if (data) exportFromJSON({ data, fileName, exportType })
}
getInterventionClusters()
getInterventionTypes()
getSettlementsOptions()
getInterventionsAll()

console.log('Options---->', interVentionTypeOtions)
const viewProfile = (data: TableSlotDefault) => {
  console.log('On Click.....', data.row.id)

  push({
    path: '/settlement/:id',
    name: 'SettlementDetails',
    params: { data: data.row.id, id: data.row.id }
  })
}

const viewHHs = (data: TableSlotDefault) => {
  console.log('On Click.....', data.row.id)
  push({
    path: '/settlement/hh/:id',
    name: 'Households',
    params: { id: data.row.id }
  })
}

const viewOnMap = (data: TableSlotDefault) => {
  console.log('On Click.....', data.row)
  if (data.row.settlement.geom) {
    push({
      path: '/settlement/map/:id',
      name: 'SettlementMap',
      params: { id: data.row.id }
    })
  } else {
    var msg = 'This Settlement does not have the boundary defined in the database!'
    open(msg)
  }
}

//*****************************Create**************************** */

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  intervention_type_id: '',
  intervention_phase: '',
  year: null,
  settlement_id: null,
  cluster_id: null,
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
      ruleForm.model = 'intervention'
      ruleForm.code = uuid.v4()
      console.log(ruleForm.value)
      await CreateRecord(ruleForm).then(() => { })
    } else {
      console.log('error submit!', fields)
    }
  })
}




const DeleteIntervention = (data: TableSlotDefault) => {
  console.log('----->', data.row.id)
  let formData = {}
  formData.id = data.row.id
  formData.model = 'intervention'

  DeleteRecord(formData)

  console.log(tableDataList.value)

  // remove the deleted object from array list 
  let index = tableDataList.value.indexOf(data.row);
  if (index !== -1) {
    tableDataList.value.splice(index, 1);
  }

}

const editIntervention = (data: TableSlotDefault) => {
  showSubmitBtn.value = false
  // showEditSaveButton.value = true
  console.log(data)
  ruleForm.id = data.row.id
  ruleForm.intervention_phase = data.row.intervention_phase
  ruleForm.settlement_id = data.row.settlement_id
  ruleForm.year = data.row.date
  ruleForm.intervention_type_id = data.row.intervention_type_id
  ruleForm.cluster_id = data.row.cluster_id
  ruleForm.year = data.row.year
  ruleForm.code = data.row.code

  // formHeader.value = 'Edit Report'
  showEditSaveButton.value = true
  showAddSaveButton.value = false
  AddDialogVisible.value = true
  formheader.value = 'Edit Intervention'

}

const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ruleForm.model = 'intervention'
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
  ruleForm.intervention_type_id = null
  ruleForm.year = null
  ruleForm.cluster_id = null


  formheader.value = 'Add Intervention'
  AddDialogVisible.value = false

}
</script>

<template>
  <ContentWrap
:title="t('Tenure Regularization Settlements')"
    :message="t('The list of tenure regularization settlements. Use the filters to subset')">
    <el-divider border-style="dashed" content-position="left">Filters</el-divider>

    <div style="display: inline-block; margin-left: 20px">
      <el-select
v-model="value2" :onChange="handleSelectPhase" :onClear="handleClear" multiple clearable filterable
        collapse-tags placeholder="By KISIP Phase">
        <el-option v-for="item in PhaseOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-select
v-model="value3" :onChange="handleSelectSettlement" :onClear="handleClear" multiple clearable
        filterable collapse-tags placeholder="By Settlement Name">
        <el-option v-for="item in settlementOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-select
v-model="value4" :onChange="filterByType" :onClear="handleClear" multiple clearable filterable
        collapse-tags placeholder="By Intervention Type">
        <el-option v-for="item in interVentionTypeOtions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>



    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="handleDownload" type="primary" :icon="Download" />
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="handleClear" type="primary" :icon="Filter" />
    </div>

    <div style="display: inline-block; margin-left: 20px">
      <el-tooltip content="Add Tenure Intervention " placement="top">
        <el-button :onClick="AddIntervention" type="primary" :icon="Plus" />
      </el-tooltip>
    </div>

    <el-divider border-style="dashed" content-position="left">Results</el-divider>

    <Table
:columns="columns" :data="tableDataList" :loading="loading" :selection="true" :pageSize="pageSize"
      :currentPage="currentPage">
      <template #action="data">
        <el-tooltip content="View Profile" placement="top">
          <el-button type="primary" :icon="TopRight" @click="viewProfile(data as TableSlotDefault)" circle />
        </el-tooltip>

        <el-tooltip content="View Households" placement="top">
          <el-button
v-show="showAdminButtons" type="success" :icon="User" @click="viewHHs(data as TableSlotDefault)"
            circle />
        </el-tooltip>
        <el-tooltip content="View on Map" placement="top">
          <el-button type="warning" :icon="Position" @click="viewOnMap(data as TableSlotDefault)" circle />
        </el-tooltip>
        <el-tooltip content="Edit" placement="top">
          <el-button
v-show="showAdminButtons" type="success" :icon="Edit"
            @click="editIntervention(data as TableSlotDefault)" circle />
        </el-tooltip>

        <el-tooltip content="Delete" placement="top">
          <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
            title="Are you sure to delete this record?" @confirm="DeleteIntervention(data as TableSlotDefault)">
            <template #reference>
              <el-button v-if="showAdminButtons" type="danger" :icon=Delete circle />
            </template>
          </el-popconfirm>
        </el-tooltip>


      </template>
    </Table>
    <ElPagination
layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
      v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 100]" :total="total" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
  </ContentWrap>



  <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formheader" width="30%" draggable>
    <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px">

      <el-form-item label="Cluster">
        <el-select filterable v-model="ruleForm.cluster_id" placeholder="Select Cluster">
          <el-option
v-for="item in interVentionClusterOtions" :key="item.value" :label="item.label"
            :value="item.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="Settlement">
        <el-select filterable v-model="ruleForm.settlement_id" placeholder="Select Settlement">
          <el-option v-for="item in settlementOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>



      <el-form-item label="Phase">
        <el-select filterable v-model="ruleForm.intervention_phase" placeholder="Select intervention Phase">
          <el-option v-for="item in PhaseOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>


      <el-form-item label="Type">
        <el-select filterable v-model="ruleForm.intervention_type_id" placeholder="Select intervention Type">
          <el-option v-for="item in interVentionTypeOtions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="Year">
        <el-input-number v-model="ruleForm.year" />
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
