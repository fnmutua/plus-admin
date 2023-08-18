<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { useForm } from '@/hooks/web/useForm'
import { ElButton, ElSelect, MessageParamsWithType } from 'element-plus'
import { Form } from '@/components/Form'
import { Position, TopRight, User, Download, Filter } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

import { ref, reactive } from 'vue'
import { ElPagination, ElTooltip, ElOption, ElDivider } from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'

interface Params {
  pageIndex?: number
  xpageSize?: number
}

const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
const countiesOptions = ref([])
const settlementOptions = ref([])
const page = ref(1)
const pSize = ref(5)
const selCounties = []
const loading = ref(true)
const pageSize = ref(5)
const currentPage = ref(1)
const total = ref(0)
const downloadLoading = ref(false)

let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = ['benefit_type_id']
var filterValues = [7] //1-"Secure tenure", 2- "Linkage to Safety Nets", 3- "Community Development Plan",  4-"Improved Infrastructure"
var tblData = []

// Models and their associaions---------
const model = 'beneficiary'
const associated_Model = 'settlement'
const nested_models = ['intervention', 'intervention_type'] // The mother, then followed by the child
const associated_multiple_models = ['settlement', 'households']

//// ------------------parameters -----------------------////

const { t } = useI18n()

const columns: TableColumn[] = [
  {
    field: 'id',
    label: t('userDemo.index')
  },

  {
    field: 'name',
    label: t('Name')
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
    field: 'intervention.intervention_type.type',
    label: t('Intervention')
  },

  {
    field: 'action',
    label: t('userDemo.action')
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

  // - Associted and nested Models
  //formData.assocModel = associated_Model
  formData.nested_models = nested_models
  formData.associated_multiple_models = associated_multiple_models

  // - multiple filters -------------------------------------
  formData.filters = selFilters
  formData.filterValues = selfilterValues
  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('After Querry', res)

  // -- filter data only for tenure -------to be revisted

  tableDataList.value = res.data
  total.value = res.total

  tblData = [] // reset the table data
  console.log('TBL-b4', tblData)
  res.data.forEach(function (arrayItem) {
    //  console.log(countyOpt)
    delete arrayItem[associated_Model]['geom'] //  remove the geometry column

    var dd = destructure(arrayItem)

    tblData.push(dd)
  })
  // console.log('Loading', loading)
  // loading.value = false
  //console.log('Loading', loading)

  // console.log('TBL-4f', tblData)
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
      countiesOptions.value.push(countyOpt)
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

//getInterventionTypes()
getSettlementsOptions()
getInterventionsAll()

console.log('Options---->', countiesOptions)
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
</script>

<template>
  <ContentWrap
    :title="t('Beneficiaries of Short-Term Trainings')"
    :message="t('Use the filters to subset')"
  >
    <el-divider border-style="dashed" content-position="left">Filters</el-divider>
    <div style="display: inline-block; margin-left: 20px">
      <el-select
        v-model="value2"
        :onChange="handleSelectPhase"
        :onClear="handleClear"
        multiple
        clearable
        filterable
        collapse-tags
        placeholder="Filter by KISIP Phase"
      >
        <el-option
          v-for="item in PhaseOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-select
        v-model="value3"
        :onChange="handleSelectSettlement"
        :onClear="handleClear"
        multiple
        clearable
        filterable
        collapse-tags
        placeholder="Filter by Settlement Name"
      >
        <el-option
          v-for="item in settlementOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="handleDownload" type="primary" :icon="Download" />
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="handleClear" type="primary" :icon="Filter" />
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
      :page-sizes="[5, 10, 20, 50, 100]"
      :total="total"
      :background="true"
      @size-change="onPageSizeChange"
      @current-change="onPageChange"
      class="mt-4"
    />
  </ContentWrap>
</template>
