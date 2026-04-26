<script setup lang="ts">
// @ts-nocheck
import { useI18n } from '@/hooks/web/useI18n'
import { getSettlementListByCounty, uploadFilesBatch} from '@/api/settlements'
import { getCountyListApi, getListWithoutGeo } from '@/api/counties'
import {
  ElButton, ElSelect, FormInstance, ElDialog, ElForm, ElFormItem, ElCard, ElTable, ElRow, ElCol,
  ElTableColumn, UploadUserFile, ElInput, ElDrawer
} from 'element-plus'
import { ElMessage } from 'element-plus'
import { Filter, Back, View, CircleCloseFilled, Download } from '@element-plus/icons-vue'

import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElPagination, ElTooltip, ElOption } from 'element-plus'
import { useRouter } from 'vue-router'
import { DeleteRecord, deleteDocument } from '@/api/settlements'

import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { uuid } from 'vue-uuid'
import { getFile } from '@/api/summary'

import {
  searchByKeyWord
} from '@/api/settlements'

import { useRoute } from 'vue-router'



import 'element-plus/theme-chalk/display.css'

////////////*************Map Imports***************////////

import '@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css';


import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'
import { UserType } from '@/api/register/types'


import "mapbox-layer-switcher/styles.css";

import * as enums from '@/utils/enums'
import DownloadCustom from '@/views/Components/DownloadCustom.vue';

import {
  getFilteredHouseholdsByColumn,
  getFilteredHouseholdsBykeyword,
  getOneHousehold,
  updateHousehold,
  startHouseholdsExcelExportJob,
  getHouseholdsExcelExportJobStatus,
  downloadHouseholdsExcelExportJob
} from '@/api/households'
import UploadComponent from '@/views/Components/UploadComponent.vue';
import { defineAsyncComponent } from 'vue';





const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = MapBoxToken;






const searchString = ref('')

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)



const router = useRouter()
const { push } = router
const goBack = () => router?.back()
const value1 = ref<any>([])
const value2 = ref<any[]>([])
var value3 = ref<any>([])
var value4 = ref<any[]>([])
var value5 = ref<any[]>([])

const morefileList = ref<UploadUserFile[]>([])


const interVentionTypeOptions = ref([])
const benefitTypeOptions = ref([])
const houseHoldOptions = ref([])
const interventionsOptions = ref([])




const settlementOptions = ref<any[]>([])
const countiesOptions = ref<any[]>([])
const page = ref(1)
const pSize = ref(5)
const loading = ref(true)
const excelDownloadLoading = ref(false)
const pageSize = ref(5)
const currentPage = ref(1)
const total = ref(0)
const showEditSaveButton = ref(false)
const formheader = ref('Edit Household')


let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']




var filters = []
var filterValues = []

var tblData = []

// Keep association payload lean (id + name only from backend include projection).
const associated_multiple_models: string[] = ['settlement', 'county']

const model = 'households'
//// ------------------parameters -----------------------////

const { t } = useI18n()

const hasActiveFilters = computed(() => {
  const hasCountyFilter = Array.isArray(value2.value) && value2.value.length > 0
  const hasSettlementFilter = Array.isArray(value4.value) && value4.value.length > 0
  const hasGenderFilter = Array.isArray(value5.value) && value5.value.length > 0
  const hasSearchFilter = !!searchString.value?.trim()
  return hasCountyFilter || hasSettlementFilter || hasGenderFilter || hasSearchFilter
})

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const downloadHouseholdsExcel = async () => {
  if (excelDownloadLoading.value) return
  excelDownloadLoading.value = true
  try {
    const startRes: any = await startHouseholdsExcelExportJob()
    const jobId = startRes?.data?.job_id || startRes?.job_id
    if (!jobId) throw new Error('Missing export job id')

    let status = 'processing'
    const maxPolls = 60
    for (let i = 0; i < maxPolls; i++) {
      await sleep(1000)
      const statusRes: any = await getHouseholdsExcelExportJobStatus(jobId)
      status = statusRes?.data?.status || statusRes?.status || 'processing'
      if (status === 'completed' || status === 'failed') break
    }

    if (status !== 'completed') {
      throw new Error(status === 'failed' ? 'Export failed on server' : 'Export timed out, please try again')
    }

    const fileRes: any = await downloadHouseholdsExcelExportJob(jobId)
    const blobSource = fileRes?.data ?? fileRes
    const contentType =
      fileRes?.headers?.['content-type'] || 'text/csv;charset=utf-8;'
    const blob = blobSource instanceof Blob ? blobSource : new Blob([blobSource], { type: contentType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const contentDisposition = fileRes?.headers?.['content-disposition'] || ''
    const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
    link.download = fileNameMatch?.[1] || `households_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('Download started')
  } catch (error: any) {
    ElMessage.error(error?.message || 'Failed to download households export')
  } finally {
    excelDownloadLoading.value = false
  }
}


const handleClear = async () => {
  filterValues = []
  filters = []
  value1.value = ''
  value2.value = []
  value3.value = ''
  value4.value = []
  value5.value = []
  settOptions.value = []
  pSize.value = 5
  currentPage.value = 1
  tblData.value = []
  searchString.value = ''
  getAllBeneficiaries()
}

// Helper to add/update a filter in the filters/filterValues arrays
const updateFilter = (filterKey: string, values: any[], filtersArr: string[], filterValuesArr: any[]) => {
  const idx = filtersArr.indexOf(filterKey)
  if (values.length > 0) {
    if (idx === -1) {
      filtersArr.push(filterKey)
      filterValuesArr.push(values)
    } else {
      filterValuesArr[idx] = values
    }
  } else if (idx !== -1) {
    filtersArr.splice(idx, 1)
    filterValuesArr.splice(idx, 1)
  }
}

const normalizeSelectedIds = (ids: any) => {
  const values = Array.isArray(ids) ? ids : ids ? [ids] : []
  return values.map((id: any) => {
    const numericId = Number(id)
    return Number.isNaN(numericId) ? id : numericId
  })
}

const handleSelectCounty = async (countyIds: any) => {
  const selectedCountyIds = normalizeSelectedIds(countyIds)
  value2.value = selectedCountyIds
  updateFilter('county_id', selectedCountyIds, filters, filterValues)
  value4.value = [] // clear settlement when county changes
  updateFilter('settlement_id', [], filters, filterValues)
  await loadSettlementsByCounty(selectedCountyIds)
  getFilteredData(filters, filterValues)
}

const filterBySettlement = async (settlementIds: any) => {
  updateFilter('settlement_id', settlementIds || [], filters, filterValues)
  getFilteredData(filters, filterValues)
}


// Load settlements for selected county/counties
const settlementSearchLoading = ref(false)
const loadSettlementsByCounty = async (countyIds: any) => {
  if (!countyIds || (Array.isArray(countyIds) && countyIds.length === 0)) {
    settOptions.value = []
    return
  }
  const ids = Array.isArray(countyIds) ? countyIds : [countyIds]
  settlementSearchLoading.value = true
  try {
    const formData = {
      curUser: 1,
      model: 'settlement',
      searchField: 'name',
      searchKeyword: '',
      excludeGeom: true,
      excludeGeomAssoc: true,
      associated_multiple_models: ['county'],
      filters: ['county_id'],
      filterValues: [ids],
      currentUser: userInfo
    }
    const res = await searchByKeyWord(formData)
    settOptions.value = (res.data || []).map((item: any) => ({
      value: item.id,
      label: item.name
    }))
  } catch (error) {
    console.error('Error loading settlements:', error)
    settOptions.value = []
  } finally {
    settlementSearchLoading.value = false
  }
}



const currentRow = ref()
const addMoreDocuments = ref()

 


const documentCategory = ref()


const onPageChange = async (selPage: any) => {
  currentPage.value = selPage
  page.value = selPage
  if (searchString.value) {
 
    getFilteredBySearchData(searchString.value)
    
  } else {
    getFilteredData(filters, filterValues)
  }

 




}

const onPageSizeChange = async (size: any) => {
  pSize.value = size
  pageSize.value = size
  currentPage.value = 1
  page.value = 1
  if (searchString.value) {
 
 getFilteredBySearchData(searchString.value)
 
} else {
 getFilteredData(filters, filterValues)
}

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
  formData.limit = pageSize.value
  formData.page = currentPage.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model
  //-Search field--------------------------------------------
  formData.searchField = ''
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  //formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = selFilters
  formData.filterValues = selfilterValues
  formData.associated_multiple_models = associated_multiple_models
  formData.fields = ['id', 'settlement_id', 'gender', 'age', 'hh_size', 'code', 'createdAt']

  //-------------------------
  //console.log(formData)

  // const res = await getHHsByCounty(formData)

  tblData = [] // reset the table data
  console.log("gettign HHS.........")
  loading.value = true
  await getFilteredHouseholdsByColumn(formData)
    .then((response) => {
      tableDataList.value = response.data
      total.value = response.total
    })
    .catch(function (error) {
      console.log('error', error?.response?.data?.message || error)
      ElMessage.error(error?.response?.data?.message || 'Failed to load households')
    })
    .finally(() => {
      loading.value = false
    })
}



const getBeneficiaryType = async () => {
}
const getHouseholds = async () => {
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

}









const getFilteredBySearchData = async (searchString) => {
   
  const formData = {}
  formData.limit = pageSize.value // 
  formData.page = currentPage.value
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
  formData.fields = ['id', 'settlement_id', 'gender', 'age', 'hh_size', 'code', 'createdAt']

  //-------------------------
  console.log(formData)
  const res = await getFilteredHouseholdsBykeyword(formData)

  console.log('After -----x ------Querry', res)
  tableDataList.value = res.data
  total.value = res.total
  loading.value = false

  tblData.value = [] // reset the table data

}



const programmeOptions = ref([])
const getProgrammeOptions = async () => {
}

 
const settOptions = ref<any[]>([])

const getOptionLabel = (item: any) =>
  String(item?.name ?? item?.county_name ?? item?.label ?? item?.Name ?? item?.NAME ?? item?.id ?? '')

const getCountyNames = async () => {
  try {
    const response = await getListWithoutGeo({
      params: {
        pageIndex: 1,
        limit: 100,
        curUser: 1,
        model: 'county',
        searchField: '',
        searchKeyword: '',
        sort: 'ASC'
      }
    })
    const ret = Array.isArray(response?.data) ? response.data : response?.data?.data ?? []
    countiesOptions.value = ret.map((item: any) => ({ value: Number(item.id), label: getOptionLabel(item) }))
  } catch (err) {
    console.error('Error loading counties:', err)
    countiesOptions.value = []
  }
}

getBeneficiaryType()
getHouseholds()

//getInterventionTypes()
// Settlements loaded only when county changes (via handleSelectCounty → loadSettlementsByCounty)
getAllBeneficiaries()
getInterventions()
getProgrammeOptions()
//getGeo()

getCountyNames()

console.log('Options---->', interVentionTypeOptions)





//*****************************Create**************************** */

///----------------------------------------------------------------------------------

const ruleFormRef = ref<FormInstance>()
const rules = {}
const ruleForm = reactive({
  id: '',
  settlement_id: '',
  name: '',
  gender: '',
  national_id: '',
  kra_pin: '',
  marital_status: '',
  education_level: '',
  residence_type: '',
  length_stay: 0,
  owner_tenant: '',
  age_plot_owner: '',
  photo: '',
  age_00_04m: 0,
  age_05_09m: 0,
  age_10_14m: 0,
  age_15_19m: 0,
  age_20_24m: 0,
  age_24_29m: 0,
  age_30_34m: 0,
  age_35_39m: 0,
  age_40_44m: 0,
  age_45_49m: 0,
  age_50_54m: 0,
  age_55_59m: 0,
  age_60_64m: 0,
  age_65_69m: 0,
  age_70_plusm: 0,
  age_00_04f: 0,
  age_05_09f: 0,
  age_10_14f: 0,
  age_15_19f: 0,
  age_20_24f: 0,
  age_24_29f: 0,
  age_30_34f: 0,
  age_35_39f: 0,
  age_40_44f: 0,
  age_45_49f: 0,
  age_50_54f: 0,
  age_55_59f: 0,
  age_60_64f: 0,
  age_65_69f: 0,
  age_70_plusf: 0,
  hh_size: 0,
  terminally_ill: 0,
  ph_disabled: 0,
  orphans: 0,
  ment_disabled: 0,
  hearing_disabled: 0,
  visual_disabled: 0,
  emp_status: '',
  income_level: '',
  type_structure: '',
  struct_owner: '',
  rent_payable: '',
  expense_food: '',
  expense_clothing: '',
  mode_acquisition: '',
  ownership_docs: '',
  shared_ownership: false,
  source_water: '',
  water_cost20l: 0,
  sanitation: '',
  toilet_cost: 0,
  address: '',
  mode_transport: '',
  access_health: '',
  handwashing: '',
  access_education: '',
  distance_to_sch: '',
  lighting_energy: '',
  lighting_energy_cost: 0,
  cooking_energy: '',
  cooking_energy_cost: 0,
  solid_waste: '',
  code: '',
})




const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ruleForm.model = model
      await updateHousehold(ruleForm).then(() => { })

      AddDialogVisible.value = false


    } else {
      console.log('error in editing!', fields)
    }
  })
}

const handleClose = () => {
  console.log("Closing the dialoig")
  for (const key in ruleForm) {
    ruleForm[key] = null

  }



  formheader.value = 'Add Household'
  AddDialogVisible.value = false

}






const AddDialogVisible = ref(false)

// Drawer for household details
const detailDrawer = ref(false)
const raw = ref()

const excludeFields = ref([
  'id', 'county_id', 'settlement_id', 'subcounty_id', 'ward_id', 'code', 'geom',
  'documents', 'createdAt', 'updatedAt',
  'respondents_name', 'name', 'telephone', 'national_id', 'phone'
])
const priorityFields = ['gender', 'age', 'hh_size', 'settlement_id']

const humanize = (key) =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())

const flattenForDisplay = (obj, prefix = '') => {
  const result = {}
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue
    const val = obj[key]
    const fullKey = prefix ? `${prefix}_${key}` : key
    if (val === null || val === undefined || val === '') continue
    if (typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      if ('type' in val && 'coordinates' in val) continue // skip geom
      if (val.name !== undefined) {
        result[fullKey] = val.name
        if (val.county?.name) result[`${fullKey}_county`] = val.county.name
      } else if (val.id !== undefined) {
        result[fullKey] = val.id
      } else {
        Object.assign(result, flattenForDisplay(val, fullKey))
      }
    } else {
      result[fullKey] = val
    }
  }
  return result
}

const filteredData = computed(() => {
  if (!raw.value || typeof raw.value !== 'object' || Array.isArray(raw.value)) return []
  const flat = flattenForDisplay(raw.value)
  const entries = Object.entries(flat).filter(
    ([key]) => !excludeFields.value.includes(key)
  )
  const priorityRows = priorityFields
    .map((key) => entries.find(([k]) => k === key))
    .filter((e): e is [string, unknown] => !!e)
  const otherRows = entries
    .filter(([k]) => !priorityFields.includes(k))
    .sort(([a], [b]) => humanize(a).localeCompare(humanize(b)))
  return [...priorityRows, ...otherRows].map(([key, val]) => ({
    field: humanize(key),
    value: val
  }))
})

const showHHDetails = async (data: TableSlotDefault) => {
  detailDrawer.value = true
  raw.value = data.row
  try {
    const res: any = await getOneHousehold({ id: data.row.id, model })
    if (res?.data) raw.value = res.data
  } catch (error) {
    console.error('Failed to load full household details:', error)
  }
}

const formatLocation = (row: any) => {
  const settlementName = row?.settlement?.name || row?.settlement_name || 'Unknown Settlement'
  const countyName = row?.county?.name || row?.settlement?.county?.name || row?.county_name || 'Unknown County'
  return `${settlementName}, ${countyName}`
}

const isMobileView = ref(typeof window !== 'undefined' ? window.innerWidth <= 768 : false)
const updateViewportState = () => {
  if (typeof window === 'undefined') return
  isMobileView.value = window.innerWidth <= 768
}
const paginationLayout = computed(() =>
  isMobileView.value ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'
)

onMounted(() => {
  updateViewportState()
  window.addEventListener('resize', updateViewportState)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewportState)
})






const isMobile = computed(() => appStore.getMobile)

console.log('IsMobile', isMobile)
const dialogWidth = ref()
const actionColumnWidth = ref()

if (isMobile.value) {
  dialogWidth.value = "90%"
  actionColumnWidth.value = "75px"
} else {
  dialogWidth.value = "25%"
  actionColumnWidth.value = "160px"

}


const DocTypes = ref([])
const getDocumentTypes = async () => {
}
getDocumentTypes()







/// Uplaod docuemnts from a central component 
const mfield = 'hh_id'
const ChildComponent = defineAsyncComponent(() => import('@/views/Components/UploadComponent.vue'));
const dynamicComponent = ref();
 const componentProps = ref({
      message: 'Hello from parent',
      showDialog:addMoreDocuments,
      data:currentRow.value,
      umodel:model,
      field:mfield
    });

 
 


// component for docuemnts 
const rowData = ref()
const documentComponent = defineAsyncComponent(() => import('@/views/Components/ListDocuments.vue'));
const dynamicDocumentComponent = ref();
const DocumentComponentProps = ref({
  message: 'documents',
  data: rowData.value,
  docmodel: model,

});





</script>

<template>
  <el-card>
    <div v-if="dynamicComponent">
      <upload-component :is="dynamicComponent" v-bind="componentProps"/>
    </div>

    <div v-loading="loading" element-loading-text="Loading households...">
      <el-row :gutter="16" class="hh-toolbar-row" style="margin-bottom: 10px">
        <el-col :xs="24" :sm="24" :md="2" :lg="2" class="max-w-200px hh-toolbar-col">
          <div class="max-w-200px">
            <el-button type="primary" plain :icon="Back" @click="goBack" size="small" style="margin-right: 10px;">
              Back
            </el-button>
          </div>
        </el-col>

        <el-col :xs="24" :sm="24" :md="11" :lg="4" class="hh-toolbar-col">
          <el-select
            v-model="value2"
            size="default"
            @change="handleSelectCounty"
            @clear="handleSelectCounty([])"
            placeholder="Filter by County"
            clearable
            filterable
            multiple
            collapse-tags
            collapse-tags-tooltip
            style="width: 100%; margin-right: 5px;">
            <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-col>

        <el-col :xs="24" :sm="24" :md="11" :lg="4" class="hh-toolbar-col">
          <el-select
            v-model="value4"
            size="default"
            @change="filterBySettlement"
            @clear="filterBySettlement([])"
            :placeholder="(value2 && value2.length) ? 'Filter by Settlement' : 'Select county first'"
            clearable
            filterable
            multiple
            collapse-tags
            collapse-tags-tooltip
            :disabled="!value2 || value2.length === 0"
            :loading="settlementSearchLoading"
            style="width: 100%; margin-right: 5px;">
            <el-option v-for="item in settOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-col>

        <el-col :xs="24" :sm="24" :md="24" :lg="14" class="hh-toolbar-col">
          <div class="hh-toolbar-actions">
            <el-tooltip v-if="hasActiveFilters" content="Clear all filters" placement="top">
              <el-button type="primary" :icon="Filter" @click="handleClear">
                Clear
              </el-button>
            </el-tooltip>
            <el-button
              v-if="!hasActiveFilters"
              type="success"
              :icon="Download"
              :loading="excelDownloadLoading"
              @click="downloadHouseholdsExcel">
              Download All
            </el-button>
            <DownloadCustom
              v-if="(value2?.length) || (value4?.length) || (value5?.length)"
              :data="tableDataList"
              :model="model"
              :associated_models="associated_multiple_models"
              :filters="filters"
              :filter-values="filterValues" />
          </div>
        </el-col>
      </el-row>

      <el-table :data="tableDataList" border row-key="id" style="width: 100%">
        <el-table-column type="index" width="50" />
        <el-table-column label="Gender" prop="gender" sortable />
        <el-table-column label="Age" prop="age" sortable />
        <el-table-column label="Household Size" prop="hh_size" sortable />
        <el-table-column label="Location" min-width="220" :formatter="(row) => formatLocation(row)" />
        <el-table-column fixed="right" label="Details" width="90">
            <template #default="scope">
              <el-tooltip content="View household details" placement="top">
                <el-button type="primary" size="small" :icon="View" @click="showHHDetails(scope as TableSlotDefault)" plain />
              </el-tooltip>
            </template>
          </el-table-column>
      </el-table>

      <div style="margin-top: 20px;">
        <el-pagination
          :layout="paginationLayout"
          v-model:currentPage="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 20, 50, 100]"
          :total="total"
          :small="isMobileView"
          :pager-count="isMobileView ? 3 : 7"
          :background="true"
          @size-change="onPageSizeChange"
          @current-change="onPageChange"
          class="mt-4 household-pagination" />
      </div>
    </div>



    <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formheader" :width="dialogWidth" draggable>
      <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px">

        <el-form-item label="Settlement" prop="settlement_id">
          <el-select v-model="ruleForm.settlement_id" filterable placeholder="Select">
            <el-option v-for="item in settOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="Name">
          <el-input v-model="ruleForm.name" />
        </el-form-item>


        <el-form-item label="Type" prop="gender">
          <el-select v-model="ruleForm.gender" filterable placeholder="gender">
            <el-option v-for="item in enums.genderOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="ID">
          <el-input v-model="ruleForm.national_id" />
        </el-form-item>


        <el-form-item label="KRA PIN">
          <el-input v-model="ruleForm.kra_pin" />
        </el-form-item>



      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="AddDialogVisible = false">Cancel</el-button>
          <el-button v-if="showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>

        </span>
      </template>
    </el-dialog>

    <el-drawer
      v-model="detailDrawer"
      :show-close="false"
      :size="isMobileView ? '100%' : '38%'"
      custom-class="hh-detail-drawer">
      <template #header="{ close, titleId, titleClass }">
        <div class="hh-drawer-header">
          <h4 :id="titleId" :class="titleClass">Household Record</h4>
          <el-button type="danger" @click="close">
            <el-icon class="el-icon--left"><CircleCloseFilled /></el-icon>
            Close
          </el-button>
        </div>
      </template>
      <div v-if="isMobileView" class="hh-detail-list">
        <div v-for="item in filteredData" :key="item.field" class="hh-detail-item">
          <div class="hh-detail-label">{{ item.field }}</div>
          <div class="hh-detail-value">{{ item.value ?? '-' }}</div>
        </div>
      </div>
      <el-table v-else :data="filteredData" stripe style="width: 100%">
        <el-table-column prop="field" label="" width="200" />
        <el-table-column prop="value" label="" />
      </el-table>
    </el-drawer>
  </el-card>
</template>
 



<style scoped>
.max-w-200px {
  max-width: 200px;
}

.hh-toolbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
  width: 100%;
}

.hh-toolbar-row :deep(.hh-toolbar-col) {
  margin-bottom: 12px;
}

.hh-toolbar-row :deep(.hh-toolbar-col:last-child) {
  margin-bottom: 0;
}

@media (min-width: 992px) {
  .hh-toolbar-row :deep(.hh-toolbar-col) {
    margin-bottom: 0;
  }
}

:deep(.hh-detail-drawer .el-drawer__header) {
  margin-bottom: 8px;
}

.hh-drawer-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.hh-detail-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hh-detail-item {
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 10px 12px;
  background: var(--el-fill-color-blank);
}

.hh-detail-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.hh-detail-value {
  font-size: 14px;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

@media (max-width: 768px) {
  .hh-drawer-header {
    align-items: flex-start;
    flex-direction: column;
  }

  :deep(.household-pagination) {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
    row-gap: 8px;
  }
}
</style>

<style>
.el-table .warning-row {
  --el-table-tr-bg-color: var(--el-color-warning-light-9);
}

.el-table .success-row {
  --el-table-tr-bg-color: var(--el-color-success-light-9);
}
</style>





<style>
.el-row {
  margin-bottom: 20px;
}

.el-row:last-child {
  margin-bottom: 0;
}

.el-col {
  border-radius: 4px;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
}
</style>