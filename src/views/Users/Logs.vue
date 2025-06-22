<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
// @ts-nocheck
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty, searchByKeyWord } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { ElButton, ElSelect, MessageParamsWithType } from 'element-plus'
import { ElMessage,ElCard } from 'element-plus'
import {
  Position,
  TopRight,
  User,
  Plus,Back,
  Download,
  Filter,
  MessageBox,
  Edit,
  InfoFilled,
  Delete
} from '@element-plus/icons-vue'

import { ref, reactive, onMounted, watch } from 'vue'
import { ElPagination, ElTable, ElTableColumn, ElTooltip, ElOption, ElDivider, ElDialog, ElForm, ElFormItem, ElInput, FormRules, ElDatePicker, ElPopconfirm } from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import type { FormInstance } from 'element-plus'
import DownloadAll from '@/views/Components/DownloadAll.vue';
import PermissionWrapper from '@/components/PermissionWrapper.vue';
import { debounce } from 'lodash-es'
import DownloadCustom from '@/views/Components/DownloadCustom.vue';


const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


console.log("userInfo--->", userInfo)

 





const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
const indicatorsOptions = ref([])
const categoryOptions = ref([])
const categories = ref([])
const page = ref(1)
const pSize = ref(10)
const selCounties = []
const loading = ref(true)
const pageSize = ref(10)
const currentPage = ref(1)
const total = ref(0)
const downloadLoading = ref(false)
 
const showAdminButtons =  ref(appStore.getAdminButtons)
const showEditButtons =  ref(appStore.getEditButtons)


console.log("Show Buttons -->", showAdminButtons)



let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var filterValues = []
var tblData = []
const associated_Model = ''
const associated_multiple_models = []
const model = 'logs'
//// ------------------parameters -----------------------////

const { t } = useI18n()

// DashboardCard/Feedback-style filter arrays
var filters = []
var filterValues = []

const statusOptions = [
  { value: '', label: 'All' },
  { value: 'Successful', label: 'Success' },
  { value: 'Fail', label: 'Fail' }
]
const selectedStatus = ref('')
const searchKey = ref('')

const handleStatusFilter = () => {
  // Remove any existing status filter
  const statusIndex = filters.indexOf('status')
  if (statusIndex !== -1) {
    filters.splice(statusIndex, 1)
    filterValues.splice(statusIndex, 1)
  }
  // Add new status filter if not empty
  if (selectedStatus.value) {
    filters.push('status')
    filterValues.push(selectedStatus.value)
  }
  currentPage.value = 1
  getFilteredData(filters, filterValues)
}

const handleSearch = () => {
  // Remove any existing userName filter
  const searchIndex = filters.indexOf('userName')
  if (searchIndex !== -1) {
    filters.splice(searchIndex, 1)
    filterValues.splice(searchIndex, 1)
  }
  if (searchKey.value) {
    filters.push('userName')
    filterValues.push(searchKey.value)
  }
  currentPage.value = 1
  getFilteredData(filters, filterValues)
}

const handleClear = () => {
  filters = []
  filterValues = []
  selectedStatus.value = ''
  searchKey.value = ''
  currentPage.value = 1
  getFilteredData(filters, filterValues)
}

const getFilteredData = async (selFilters, selfilterValues) => {
  const formData = {}
  formData.limit = pageSize.value
  formData.page = currentPage.value
  formData.model = model
  formData.searchKeyword = searchKey.value
  formData.filters = selFilters
  formData.filterValues = selfilterValues
  formData.associated_multiple_models = []
  const res = await getSettlementListByCounty(formData)
  tableDataList.value = res.data
  total.value = res.total
  loading.value = false
}

onMounted(() => {
  getFilteredData(filters, filterValues)
})

const onPageChange = (page) => {
  currentPage.value = page
  getFilteredData(filters, filterValues)
}
const onPageSizeChange = (size) => {
  pageSize.value = size
  getFilteredData(filters, filterValues)
}

watch(selectedStatus, handleStatusFilter)

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


const searchString = ref('')


const getFilteredBySearchData = async (searchString) => {
  const formData = {}
  formData.limit = pageSize.value
  formData.page = currentPage.value
  formData.model = model
  formData.searchField = 'userName'
  formData.searchKeyword = searchString
  formData.filters = filters
  formData.filterValues = filterValues
  formData.associated_multiple_models = []
  const res = await searchByKeyWord(formData)
  tableDataList.value = res.data
  total.value = res.total
  loading.value = false
}



const searchByName = async (filterString) => {
  searchString.value = filterString
  await getFilteredBySearchData(searchString.value)
}





getInterventionsAll()





const tableRowClassName = (data) => {
  if (data.row.status.includes("Fail")) {
    console.log('Row Styling --------->', data.row.status)
    return 'danger-row'
  }
  else if (data.row.status.includes("Succ")) {

    return 'success-row'

  } else {
    return ''


  }
}

// Add remoteMethod for live search
const remoteMethod = async (keyword) => {
  loading.value = true
  // Remove any existing userName filter
  const searchIndex = filters.indexOf('userName')
  if (searchIndex !== -1) {
    filters.splice(searchIndex, 1)
    filterValues.splice(searchIndex, 1)
  }
  if (keyword) {
    filters.push('userName')
    filterValues.push(keyword)
  }
  currentPage.value = 1
  await getFilteredData(filters, filterValues)
  loading.value = false
}
const router = useRouter()

const goBack = () => {
  if (router) {
    router.back()
  } else {
    console.warn('Router instance not available.')
  }
}


</script>

<template>
  <el-card>
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; width: 100%;">
      <div class="max-w-200px">
          <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
            Back
          </el-button>
        </div>

      <!-- User Name Search Select with remote-method, full width between left and right -->
      <el-select v-model="selectedStatus" placeholder="Filter by Status" style="width: 220px;">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      <el-select
        v-model="value1"
        multiple
        clearable
        filterable
        remote
        :remote-method="searchByName"
        reserve-keyword
        placeholder="Search by User Name"
        style="flex: 1; min-width: 200px; max-width: 1000px; margin-right: 10px;"
      />
      <!-- Right side: status select and buttons -->
      <div style="display: flex; align-items: center; gap: 10px;">
      
        <el-tooltip content="Clear" placement="top">
          <el-button @click="handleClear" type="primary" :icon="Filter" />
        </el-tooltip>
        <PermissionWrapper :permissions="['logs:read']">
          <DownloadCustom
            :data="tableDataList" :model="model"
            :associated_models="associated_multiple_models" />
        </PermissionWrapper>
      </div>
    </div>
    <el-table
      :data="tableDataList" :loading="loading" :pageSize="pageSize" :currentPage="currentPage" border
      style="width: 100%" :row-class-name="tableRowClassName">
      <el-table-column sortable label="S/No" prop="id" />
      <el-table-column sortable label="Date" prop="date" />
      <el-table-column sortable label="User" prop="userName" />
      <el-table-column sortable label="Action" prop="action" />
      <el-table-column sortable label="Status" prop="status" />
      <el-table-column sortable label="Source" prop="source" />
    </el-table>
    <ElPagination
      layout="sizes,prev,pager,next, total" v-model:currentPage="currentPage" v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 50, 200, 10000]" :total="total" :background="true" @size-change="onPageSizeChange"
      @current-change="onPageChange" class="mt-4" />
  </el-card>
</template>

<style>
.el-table .danger-row {
  --el-table-tr-bg-color: var(--el-color-danger-light-7);
}

.el-table .success-row {
  --el-table-tr-bg-color: var(--el-color-success-light-7);
}
</style>

