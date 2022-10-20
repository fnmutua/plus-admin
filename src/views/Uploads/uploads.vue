<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import {
  ElButton,
  ElSelect,
  MessageParamsWithType,
  ElLink,
  ElOptionGroup,
  ElOption
} from 'element-plus'
import { ElMessage, ElDialog, ElUpload } from 'element-plus'
import {
  Position,
  TopRight,
  User,
  Download,
  Filter,
  UploadFilled,
  CircleCloseFilled,
  ArrowDownBold
} from '@element-plus/icons-vue'

import { ref, reactive } from 'vue'
import { ElPagination, ElTooltip, ElDivider } from 'element-plus'
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
const uploadDialog = ref(false)

let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var filterValues = []
var tblData = []
const associated_Model = ''
const associated_multiple_models = ['settlement']
const nested_models = ['settlement', 'county'] // The mother, then followed by the child

const model = 'settlement_uploads'
//// ------------------parameters -----------------------////

const { t } = useI18n()

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
    field: 'type',
    label: t('Type')
  },
  {
    field: 'settlement.name',
    label: t('Setllement')
  },
  {
    field: 'settlement.county.name',
    label: t('County')
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

const handleSelectType = async (county_id: any) => {
  var selectOption = 'type'
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

  if (!filterValues.includes(county_id) && county_id.length > 0) {
    filterValues.splice(index, 0, county_id) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
  }

  // expunge the filter if the filter values are null
  if (county_id.length === 0) {
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

    var dd = destructure(arrayItem)

    tblData.push(dd)
  })

  console.log('TBL-4f', tblData)
}

const getCountyNames = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'county',
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

getCountyNames()
getSettlementsOptions()
getInterventionsAll()

const DownloadFile = (data: TableSlotDefault) => {
  console.log('Download file.....', data.row)

  const link = document.createElement('a')
  // link.href = '/Embakasi_04_GIS_in_NRM.pptx'
  // link.download = 'filename'
  link.href = '/' + data.row.name
  link.download = data.row.name

  console.log('Download link:', link)

  link.click()
}

const uploadOptions = [
  {
    label: 'Reports',
    options: [
      {
        value: 'socio_economic',
        label: 'Socio Economic Report'
      },
      {
        value: 'stakeholder_report',
        label: 'Stakeholder Report'
      },
      {
        value: 'planning_report',
        label: 'Planning Report'
      },

      {
        value: 'basemap_report',
        label: 'Basemap Report'
      },
      {
        value: 'esia_report',
        label: 'Environmental Screening Report'
      }
    ]
  },
  {
    label: 'Plans',
    options: [
      {
        value: 'ldpdp',
        label: 'Local Development Plan'
      },
      {
        value: 'pdp',
        label: 'Part Development Plan'
      }
    ]
  },
  {
    label: 'Maps',
    options: [
      {
        value: 'survey_plan',
        label: 'Survey Plan'
      },
      {
        value: 'rim',
        label: 'Registry Index Map'
      }
    ]
  },
  {
    label: 'Drawings',
    options: [
      {
        value: 'design',
        label: 'Design Proposals'
      },
      {
        value: 'built',
        label: 'As Built Designs'
      }
    ]
  }
]

const UploadDocuments = (data: TableSlotDefault) => {
  push({
    path: 'upload/file',
    name: 'uploadFiles'
  })
}
</script>

<template>
  <ContentWrap
    :title="t('Slums and Informal Settlements')"
    :message="t('Use the filters to subset')"
  >
    <el-divider border-style="dashed" content-position="left">Filters</el-divider>

    <div style="display: inline-block; margin-left: 20px">
      <el-select
        v-model="value2"
        :onChange="handleSelectType"
        :onClear="handleClear"
        placeholder="Filter by Type"
      >
        <el-option-group v-for="group in uploadOptions" :key="group.label" :label="group.label">
          <el-option
            v-for="item in group.options"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-option-group>
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
        placeholder="Filter by Settlement"
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
      <el-tooltip content="Upload Documents" placement="top">
        <el-button @click="UploadDocuments" type="primary" :icon="UploadFilled" />
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
            :icon="Download"
            @click="DownloadFile(data as TableSlotDefault)"
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

    <el-dialog v-model="uploadDialog" :show-close="false">
      <template #header="{ close, titleId, titleClass }">
        <div class="my-header">
          <h4 :id="titleId" :class="titleClass">Select the files to upload!</h4>
          <el-button type="danger" @click="close" :icon="CircleCloseFilled"> Close </el-button>
        </div>
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
