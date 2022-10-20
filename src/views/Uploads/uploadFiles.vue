<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty, uploadFiles } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import {
  ElButton,
  ElSelect,
  MessageParamsWithType,
  ElLink,
  ElOptionGroup,
  ElOption
} from 'element-plus'
import { ElUpload } from 'element-plus'
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
import { ElDivider } from 'element-plus'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

import type { UploadProps, UploadUserFile } from 'element-plus'

interface Params {
  pageIndex?: number
  xpageSize?: number
}

const { push } = useRouter()
const type = ref()
const settlement = ref()
var value3 = ref([])
const countiesOptions = ref([])
const settlementOptions = ref([])

const loading = ref(true)

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

const handleClear = async () => {
  console.log('cleared....')
  type.value = ''
  settlement.value = ''
  // clear all the fileters -------
}

const handleSelectType = async (type: any) => {
  type.value = type
}

const handleSelectSettlement = async (settlement: any) => {
  settlement.value = settlement
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

getCountyNames()
getSettlementsOptions()
getInterventionsAll()

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

const fileList = ref<UploadUserFile[]>([])

const handleRemove: UploadProps['onRemove'] = (file, uploadFiles) => {
  console.log(file, uploadFiles)
}

const handlePreview: UploadProps['onPreview'] = (uploadFile) => {
  console.log(uploadFile)
}

const handleExceed: UploadProps['onExceed'] = (files, uploadFiles) => {
  ElMessage.warning(
    `The limit is 3, you selected ${files.length} files this time, add up to ${
      files.length + uploadFiles.length
    } totally`
  )
}

const beforeRemove: UploadProps['beforeRemove'] = (uploadFile, uploadFiles) => {
  return ElMessageBox.confirm(`Cancel the transfert of ${uploadFile.name} ?`).then(
    () => true,
    () => false
  )
}

const submitFiles = async (files) => {
  console.log('on Submit....', fileList)
  const fileTypes = []
  const formData = new FormData()

  for (var i = 0; i < fileList.value.length; i++) {
    console.log('------>file', fileList.value[i])
    var file = fileList.value[i].name.split('.').pop() // get file extension
    //  formData.append("file",this.multipleFiles[i],this.fileNames[i]+"_"+dateVar+"."+this.fileTypes[i]);
    fileTypes.push(type.value)
    // formData.append('file', fileList.value[i])
    // formData.file = fileList.value[i]
    formData.append('file', fileList.value[i].raw)
  }

  formData.append('settlement_id', settlement.value)
  formData.append('settlement_name', settlement.value)
  formData.append('DocTypes', fileTypes)

  // formData.append('DocTypes', fileTypes)

  console.log(formData)
  const res = await uploadFiles(formData)
  //console.log(res)
}
</script>

<template>
  <ContentWrap :title="t('Upload Settlement Documents')" :message="t('Use the filters to subset')">
    <el-divider border-style="dashed" content-position="left">Filters</el-divider>

    <div style="display: inline-block; margin-left: 20px">
      <el-select
        v-model="type"
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
        v-model="settlement"
        :onChange="handleSelectSettlement"
        :onClear="handleClear"
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

    <el-divider border-style="dashed" content-position="left">Upload</el-divider>
    <el-upload
      class="upload-demo"
      drag
      action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
      multiple
      v-model:file-list="fileList"
      :on-preview="handlePreview"
      :on-remove="handleRemove"
      :before-remove="beforeRemove"
      :limit="10"
      :on-exceed="handleExceed"
      :auto-upload="false"
    >
      <div class="el-upload__text"> Drop file here or <em>click to upload</em> </div>
    </el-upload>
    <div style="display: inline-block; margin-left: 20px">
      <el-button @click="submitFiles" type="success" :icon="UploadFilled" circle />
    </div>
  </ContentWrap>
</template>

<style scoped>
.my-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
</style>

.custom-icon { font-size: 2rem; }
