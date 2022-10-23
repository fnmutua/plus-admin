<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import {
  getSettlementListByCounty,
  searchByKeyWord,
  getOneSettlement,
  BatchImport
} from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { useForm } from '@/hooks/web/useForm'
import { ElButton, ElSelect, MessageParamsWithType } from 'element-plus'
import { Form } from '@/components/Form'
import { ElMessage } from 'element-plus'
import {
  Position,
  TopRight,
  User,
  Download,
  Filter,
  Upload,
  CircleCloseFilled,
  Plus
} from '@element-plus/icons-vue'

import { ref, reactive } from 'vue'
import { ElPagination, ElTooltip, ElOption, ElDialog, ElDivider } from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { useRoute } from 'vue-router'

import {
  VueCsvToggleHeaders,
  VueCsvSubmit,
  VueCsvMap,
  VueCsvInput,
  VueCsvErrors,
  VueCsvImport
} from 'vue-csv-import'

interface Params {
  pageIndex?: number
  xpageSize?: number
}

const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
const countiesOptions = ref([])
const householdOptions = ref([])
const settlementOptions = ref([])
const page = ref(1)
const pSize = ref(5)
const selCounties = []
const loading = ref(true)
const pageSize = ref(5)
const currentPage = ref(1)
const total = ref(0)
const downloadLoading = ref(false)
const settlement = ref()
const searchString = ref()
let tableDataList = ref<UserType[]>([])
const visible = ref(false)

const route = useRoute()

//// ------------------parameters -----------------------////
var filters = ['settlement_id']
const id = route.params.id
var intervenComponent = [id] // the Id of the settleemnt to filter with
var filterValues = [intervenComponent]
var tblData = []
//const associated_Model = ''
const associated_multiple_models = ['settlement']
const model = 'households'
//// ------------------parameters -----------------------////

const { t } = useI18n()
const csv = ref()

const columns: TableColumn[] = [
  {
    field: 'index',
    label: t('userDemo.index'),
    type: 'index'
  },

  {
    field: 'name',
    label: t('Name')
  },
  {
    field: 'gender',
    label: t('Gender')
  },

  {
    field: 'national_id',
    label: t('National ID')
  },
  {
    field: 'settlement.name',
    label: t('Settlement')
  },
  {
    field: 'action',
    label: t('userDemo.action')
  }
]
const handleClear = async () => {
  console.log('cleared....')

  // clear all the fileters -------
  filterValues = [intervenComponent]
  filters = ['settlement_id']
  value1.value = ''
  value2.value = ''
  value3.value = ''
  pSize.value = 5
  currentPage.value = 1
  tblData = []
  //----run the get data--------
  getInterventionsAll()
}

const handleSelectHousehold = async (filterString: any) => {
  searchString.value = filterString

  getFilteredBySearchData(searchString.value)
}
const getSettlement = async (id) => {
  const formData = {}
  formData.model = 'settlement'
  formData.id = id

  console.log(formData)
  const res = await getOneSettlement(formData)

  settlement.value = res.data

  console.log('All settlements Querry', res.data)
}

const onPageChange = async (selPage: any) => {
  console.log('on change change: selected counties ', selCounties)
  page.value = selPage

  if (searchString.value == '') {
    getFilteredBySearchData(searchString.value)
  } else {
    getFilteredData(filters, filterValues)
  }
}
function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}

const onPageSizeChange = async (size: any) => {
  pSize.value = size
  if (searchString.value == '') {
    getFilteredBySearchData(searchString.value)
  } else {
    getFilteredData(filters, filterValues)
  }
}

const getHouseholds = async () => {
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

  //formData.assocModel = associated_Model

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
  loading.value = false

  tblData = [] // reset the table data
  console.log('TBL-b4', tblData)
  res.data.forEach(function (arrayItem) {
    console.log('arrayItem ----->', arrayItem)
    delete arrayItem[associated_multiple_models[0]]['geom'] //  remove the geometry column
    delete arrayItem['photo'] //  remove the geometry column

    var dd = destructure(arrayItem)
    tblData.push(dd)
    //  generate the filter options
    var opt = {}
    opt.value = arrayItem.id
    opt.label = arrayItem.name + '(' + arrayItem.id + ')'
    //  console.log(countyOpt)
    householdOptions.value.push(opt)
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
  const res = await searchByKeyWord(formData)

  console.log('After Querry', res)
  tableDataList.value = res.data
  total.value = res.total
  loading.value = false

  tblData = [] // reset the table data
  console.log('TBL-b4', tblData)
  res.data.forEach(function (arrayItem) {
    console.log('arrayItem ----->', arrayItem)
    delete arrayItem[associated_multiple_models[0]]['geom'] //  remove the geometry column
    delete arrayItem['photo'] //  remove the geometry column

    var dd = destructure(arrayItem)
    tblData.push(dd)
    //  generate the filter options
    var opt = {}
    opt.value = arrayItem.id
    opt.label = arrayItem.name + '(' + arrayItem.id + ')'
    //  console.log(countyOpt)
    householdOptions.value.push(opt)
  })

  console.log('TBL-4f', tblData)
}

const open = (msg: MessageParamsWithType) => {
  ElMessage.error(msg)
}

const uploadHHs = () => {
  var lobs = csv.value

  lobs.forEach(function (itm) {
    itm.settlement_id = id
  })

  console.log('lobs', lobs)

  var formData = {}
  formData.model = 'households'
  formData.data = csv.value
  const res = BatchImport(formData)

  ElMessage.success('Uploading...')
}

const cancelUpload = () => {
  ElMessage.error('Upload Cancelled...')
  csv.value = []
  visible.value = false
}

const handleDownload = () => {
  console.log(tblData)
  downloadLoading.value = true
  const data = tblData
  const fileName = 'data.xlsx'
  const exportType = exportFromJSON.types.csv
  if (data) exportFromJSON({ data, fileName, exportType })
}

//getInterventionTypes()
getSettlement(route.params.id)

getHouseholds()

const viewProfile = (data: TableSlotDefault) => {
  console.log('On Click.....', data.row.id)

  push({
    path: '/settlement/:id',
    name: 'SettlementDetails',
    params: { data: data.row.id, id: data.row.id }
  })
}

function viewHHs() {
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

console.log('CSV---->', csv)
</script>

<template>
  <ContentWrap
    :title="toTitleCase(settlement.name + ' Households')"
    :message="t('Use the filters to subset')"
  >
    <el-divider border-style="dashed" content-position="left">Filters</el-divider>

    <div style="display: inline-block; margin-left: 20px">
      <el-select
        v-model="value3"
        multiple
        clearable
        filterable
        remote
        :remote-method="handleSelectHousehold"
        reserve-keyword
        placeholder="Search by Household Name"
      />
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="handleDownload" type="primary" :icon="Download" />
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="handleClear" type="primary" :icon="Filter" />
    </div>

    <div style="display: inline-block; margin-left: 20px">
      <el-tooltip content="Upload Household list as csv" placement="top">
        <el-button @click="visible = true" type="primary" :icon="Upload" />
      </el-tooltip>
    </div>

    <el-divider border-style="dashed" content-position="left">Results</el-divider>

    <Table
      :columns="columns"
      :data="tableDataList"
      :loading="loading"
      :selection="true"
      :pageSize="pageSize"
      :currentPage="currentPage"
    >
      <template #action="data">
        <el-tooltip content="View Profile" placement="top">
          <el-button
            type="primary"
            :icon="TopRight"
            @click="viewProfile(data as TableSlotDefault)"
            circle
          />
        </el-tooltip>

        <el-tooltip content="View Households" placement="top">
          <el-button
            type="success"
            :icon="User"
            @click="viewHHs(data as TableSlotDefault)"
            circle
          />
        </el-tooltip>
        <el-tooltip content="View on Map" placement="top">
          <el-button
            type="warning"
            :icon="Position"
            @click="viewOnMap(data as TableSlotDefault)"
            circle
          />
        </el-tooltip>
      </template>
    </Table>
    <ElPagination
      layout="sizes, prev, pager, next, total"
      v-model:currentPage="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 50, 200, 1000]"
      :total="total"
      :background="true"
      @size-change="onPageSizeChange"
      @current-change="onPageChange"
      class="mt-4"
    />

    <el-dialog v-model="visible" :show-close="false">
      <template #header="{ close, titleId, titleClass }">
        <div class="my-header">
          <h4 :id="titleId" :class="titleClass">Upload Households</h4>
          <el-button type="danger" @click="close">
            <el-icon class="el-icon--left"><CircleCloseFilled /></el-icon>
            Close
          </el-button>
        </div>
      </template>

      <vue-csv-import
        v-model="csv"
        :fields="{
          name: { required: true, label: 'Name' },
          national_id: { required: true, label: 'National ID' }
        }"
      >
        <vue-csv-toggle-headers />
        <vue-csv-errors />
        <vue-csv-input />
        <vue-csv-map />
      </vue-csv-import>

      <template #footer>
        <span class="dialog-footer">
          <el-button type="danger" @click="cancelUpload">Cancel</el-button>
          <el-button type="primary" @click="uploadHHs"> Save </el-button>
        </span>
      </template>
    </el-dialog>
  </ContentWrap>
</template>

<style scoped>
.my-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
</style>
