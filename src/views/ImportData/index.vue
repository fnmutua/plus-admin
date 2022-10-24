<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { useForm } from '@/hooks/web/useForm'
import { ElButton, ElSelect, MessageParamsWithType } from 'element-plus'
import { Form } from '@/components/Form'
import { ElMessage, ElDialog } from 'element-plus'
import { Filter, Upload, MessageBox, DocumentAdd } from '@element-plus/icons-vue'

import { ref, reactive } from 'vue'
import { ElPagination, ElTooltip, ElOption, ElDivider } from 'element-plus'
import { useRouter } from 'vue-router'
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
const settlementOptions = ref([])

const loading = ref(true)

const visible = ref(false)

//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']

const selModel = ref()
const selSettlement = ref()
const selCounty = ref()
const showCounty = ref(false)
const disableUpload = ref(true)
const disableSaveBtn = ref(true)

const columns = ref([])
const formData = {}
//// ------------------parameters -----------------------////

const EntityOptions = [
  {
    value: 'settlement',
    label: 'Settlements'
  },
  {
    value: 'parcel',
    label: 'Parcels',
    disabled: true
  },
  {
    value: 'household',
    label: 'Households'
  },
  {
    value: 'beneficiary',
    label: 'Beneficiaries'
  }
]
const csv = ref()

const hh_fields = ref()

const { t } = useI18n()
const showSettlementSelet = ref(false)

const handleClear = async () => {
  console.log('cleared....')
  disableUpload.value = true
  selCounty.value = ''
  selSettlement.value = ''
}

const handleSelectEntity = async (model: any) => {
  selModel.value = model
  // here we hide the Settlement select option if we are uppoading settleements
  if (model != 'settlement') {
    showCounty.value = false // hide for non-settlements

    showSettlementSelet.value = true
    if (selSettlement.value) {
      disableUpload.value = false
    } else {
      disableUpload.value = true
    }
  } else {
    showSettlementSelet.value = false
    showCounty.value = true // show only for settlements

    if (selCounty.value) {
      disableUpload.value = false // enbale upload button only after county is selecetd
    }
  }
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}
const handleSelectSettlement = async (settlement: any) => {
  selSettlement.value = settlement
  disableUpload.value = false
}
const handleSelectCounty = async (county: any) => {
  selCounty.value = county
  disableUpload.value = false
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

getSettlementsOptions()
getCountyNames()

const showDialog = async () => {
  visible.value = true
  if (selModel.value === 'settlement')
    hh_fields.value = {
      name: { required: true, label: 'Name' },
      population: { required: true, label: 'Population' }
    }
  else if (selModel.value === 'parcel') {
    hh_fields.value = {
      area_ha: { required: true, label: 'Area' },
      parcel_id: { required: true, label: 'Parcel ID' }
    }
  } else if (selModel.value === 'household') {
    hh_fields.value = {
      name: { required: true, label: 'Name' },
      national_id: { required: true, label: 'National ID' }
    }
  } else {
    // beneficiaries
    hh_fields.value = {
      hh_id: { required: true, label: 'Household ID' },
      intervention_id: { required: true, label: 'Intervention ID' },
      intervention_phase: { required: true, label: 'Intervention Phase' },
      benefit_type_id: { required: true, label: 'Beneficiary Type' }
    }
  }
}

const reviewData = () => {
  disableSaveBtn.value = false // enable the save button
  visible.value = false // hide the dialog
  var csvData = csv.value
  // Append settlment_id if and only if  seleccted
  if (selSettlement.value) {
    csvData.forEach(function (itm) {
      itm.settlement_id = selSettlement.value
    })
  }

  //append cunty_id if the county has been selected. Applies to settlements only

  if (selCounty.value) {
    csvData.forEach(function (itm) {
      itm.county_id = selCounty.value
    })
  }

  console.log('csvData', csvData)

  formData.model = selModel.value
  formData.data = csv.value
  //const res = BatchImport(formData)

  ElMessage.success('Uploading...')

  var cols = Object.keys(csvData[0])
  console.log(cols)

  Object.keys(csvData[0]).forEach(function (key, index) {
    // key: the name of the object key
    // index: the ordinal position of the key within the object
    console.log(key, index)
    var col = {}
    col.field = key
    col.label = toTitleCase(key)
    columns.value.push(col)
  })

  console.log(columns)
}

const uploadData = () => {
  console.log(formData)
  //const res = BatchImport(formData)
}
const cancelUpload = () => {
  ElMessage.error('Upload Cancelled...')
  csv.value = []
  visible.value = false
}
</script>

<template>
  <ContentWrap :title="t('Import Data')" :message="t('Select the desired data to import')">
    <el-divider border-style="dashed" content-position="left">Filters</el-divider>

    <div style="display: inline-block; margin-left: 20px">
      <el-select
        v-model="value1"
        :onChange="handleSelectEntity"
        :onClear="handleClear"
        clearable
        filterable
        collapse-tags
        placeholder="Select Type of Data"
      >
        <el-option
          v-for="item in EntityOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-select
        v-model="value2"
        v-if="showSettlementSelet"
        :onChange="handleSelectSettlement"
        :onClear="handleClear"
        clearable
        filterable
        collapse-tags
        placeholder="Select Settlement"
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
      <el-select
        v-model="value3"
        v-if="showCounty"
        :onChange="handleSelectCounty"
        :onClear="handleClear"
        clearable
        filterable
        collapse-tags
        placeholder="Select County"
      >
        <el-option
          v-for="item in countiesOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>

    <div style="display: inline-block; margin-left: 20px">
      <el-button @click="showDialog" :disabled="disableUpload" type="primary" :icon="Upload" />
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="handleClear" type="primary" :icon="Filter" />
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-button
        type="success"
        :onClick="uploadData"
        :disabled="disableSaveBtn"
        :icon="DocumentAdd"
      />
    </div>
    <el-divider border-style="dashed" content-position="left">Data</el-divider>

    <Table :columns="columns" border :data="csv" />
    <el-dialog v-model="visible" :show-close="false">
      <template #header="{ close, titleId, titleClass }">
        <div class="my-header">
          <h4 :id="titleId" :class="titleClass">Upload {{ selModel }} {{ selSettlement }}</h4>
          <el-button type="danger" @click="close">
            <el-icon class="el-icon--left"><CircleCloseFilled /></el-icon>
            Close
          </el-button>
        </div>
      </template>

      <vue-csv-import v-model="csv" :fields="hh_fields">
        <vue-csv-toggle-headers />
        <vue-csv-errors />
        <vue-csv-input />
        <vue-csv-map :auto-match="false" :table-attributes="{ id: 'csv-table' }" />
      </vue-csv-import>

      <template #footer>
        <span class="dialog-footer">
          <el-button type="danger" @click="cancelUpload">Cancel</el-button>
          <el-button type="primary" @click="reviewData"> Review </el-button>
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
