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
  Plus,
  Download,Back,
  Filter,
  MessageBox,
  Edit,
  InfoFilled,
  Delete
} from '@element-plus/icons-vue'

import { ref, reactive,onMounted, computed, watch } from 'vue'
import {
  ElPagination, ElTable, ElTableColumn, ElTooltip, ElOption, ElDivider ,ElTabPane,ElTabs,
  ElDialog, ElForm, ElFormItem, ElInput, FormRules, ElDatePicker, ElPopconfirm
} from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import type { FormInstance } from 'element-plus'
import DownloadAll from '@/views/Components/DownloadAll.vue';
import PermissionWrapper from '@/components/PermissionWrapper.vue';
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
 
const selCounties = []
const loading = ref(true)
 
const currentPage = ref(1)
const total = ref(0)
const downloadLoading = ref(false)
 



const mobileBreakpoint = 768;
const defaultPageSize = 10;
const mobilePageSize = 5;
const pageSize = ref(defaultPageSize);

// Function to update pageSize based on window width
const updatePageSize = () => {
  if (window.innerWidth <= mobileBreakpoint) {
    pageSize.value = mobilePageSize;
  } else {
    pageSize.value = defaultPageSize;
  }
};

onMounted(async () => { 

 window.addEventListener('resize', updatePageSize);
   updatePageSize(); // Initial check
 
 })














const showAdminButtons =  ref(appStore.getAdminButtons)
const showEditButtons =  ref(appStore.getEditButtons)

console.log("Show Buttons -->", showAdminButtons)



let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var filterValues = []
var tblData = []
const associated_Model = 'users'
const associated_multiple_models = ['users']
const model = 'feedback'
//// ------------------parameters -----------------------////

const { t } = useI18n()

const statusOptions = [
  { value: '', label: 'All' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Resolved', label: 'Resolved' }
]
const selectedStatus = ref('')

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

const handleClear = () => {
  filters = []
  filterValues = []
  selectedStatus.value = ''
  currentPage.value = 1
  getFilteredData(filters, filterValues)
}

const getFilteredData = async (selFilters, selfilterValues) => {
  const formData = {}
  formData.limit = pageSize.value
  formData.page = currentPage.value
  formData.model = model
  formData.filters = selFilters
  formData.filterValues = selfilterValues
  formData.associated_multiple_models = ['users']
  const res = await getSettlementListByCounty(formData)
  tableDataList.value = res.data
  total.value = res.total
  loading.value = false
}

watch(selectedStatus, handleStatusFilter)

const searchString = ref()


const getFilteredBySearchData = async (searchString) => {
  const formData = {}
  formData.limit = pageSize.value
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

  console.log('After -----x ------Querry', res)
  tableDataList.value = res.data
  total.value = res.total
  loading.value = false

  tblData.value = [] // reset the table data

}



const searchByName = async (filterString: any) => {
  searchString.value = filterString

  getFilteredBySearchData(searchString.value)
}





getFilteredData(filters, filterValues)





const tableRowClassName = (data) => {
  if (data.row.status.includes("Pending")) {
    console.log('Row Styling --------->', data.row.status)
    return 'danger-row'
  }
  else if (data.row.status.includes("Resolved")) {

    return 'success-row'

  } else {
    return ''


  }
}



const feedback = reactive({
  name: '',
  email: '',
  message: '',
  phone: '',
  code: '',
  actionTaken: '',
  actionedBy:'',
  status:''
})

const dialogFeedback = ref(false)
const ruleFormRef = ref<FormInstance>()

const updateFeedback = async (formEl: FormInstance | undefined) => {
 
  feedback.code = uuid.v4()
  feedback.model = 'feedback'
  feedback.actionedBy=userInfo.id
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
        // The form is valid, you can perform further actions here

       await updateOneRecord(feedback)

       
      dialogFeedback.value=false
        
      } else {
        // The form is invalid, you can show an error message or perform other actions
      console.log('Form validation failed.');
        ElMessage.error('Validation Errors. Please address')
      }
    });

}

const feedbackRules =  {
      name: [
        { required: true, message: 'Please enter your name', trigger: 'blur' }
      ],
      email: [
        { required: true, message: 'Please enter your email', trigger: 'blur' },
        { type: 'email', message: 'Please enter a valid email address', trigger: ['blur', 'change'] }
      ],
      message: [
        { required: true, message: 'Please enter a message', trigger: 'blur' }
  ],
  actionTaken: [
        { required: true, message: 'Action Taken is required', trigger: 'blur' }
  ],
      
  status: [
        { required: true, message: 'Please update status', trigger: 'blur' }
      ]
    }
 


const actionColumnWidth = "100px"

const reviewFeedback = (data: TableSlotDefault) => {
   // transfer observed data to form
  feedback.id = data.row.id
  feedback.name = data.row.name
  feedback.email = data.row.email
  feedback.message = data.row.message
  feedback.code = data.row.code
  feedback.actionTaken = data.row.actionTaken
  feedback.actionedBy = data.row.actionedBy
  dialogFeedback.value = true

 
}
const options = [
  {
    value: 'Resolved',
    label: 'Resolved',
  },
  {
    value: 'Pending',
    label: 'Pending',
  },
]

const router = useRouter()

const goBack = () => {
  // Add your logic to handle the back action
  // For example, you can use Vue Router to navigate back
  if (router) {
    // Use router.back() to navigate back
    router.back()
  } else {
    console.warn('Router instance not available.')
  }
}

// On mount, load all feedback
onMounted(() => {
  getFilteredData(filters, filterValues)
  window.addEventListener('resize', updatePageSize)
  updatePageSize()
})

// When paginating, re-fetch all feedback
const onPageChange = (page) => {
  currentPage.value = page
  getFilteredData(filters, filterValues)
}
const onPageSizeChange = (size) => {
  pageSize.value = size
  getFilteredData(filters, filterValues)
}

</script>

<template>
  <el-card>
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; width: 100%;">
      <!-- Back Button -->
 
      <div class="max-w-200px">
          <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
            Back
          </el-button>
        </div>

      <!-- User Name Search Select with remote-method, full width between left and right -->
      <el-select
        v-model="value1"
        multiple
        clearable
        filterable
        remote
        :remote-method="searchByName"
        reserve-keyword
        placeholder="Search by Name"
        style="flex: 1; min-width: 200px; max-width: 1000px; margin-right: 10px;"
      />
      <!-- Right side: status select and buttons -->
      <div style="display: flex; align-items: center; gap: 10px;">
        <el-select v-model="selectedStatus" placeholder="Filter by Status" style="width: 220px;">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-tooltip content="Clear" placement="top">
          <el-button @click="handleClear" type="primary" :icon="Filter" />
        </el-tooltip>
        <PermissionWrapper :permissions="['feedback:read']">
          <DownloadCustom
            :data="tableDataList" :model="model"
            :associated_models="associated_multiple_models"
                      :total="total"
                      :filters="filters"
                      :filter-values="filterValues"
/>
        </PermissionWrapper>
      </div>
    </div>

    <el-table 
      :data="tableDataList" :loading="loading" :pageSize="pageSize" :currentPage="currentPage" border
      style="width: 100%;  margin-top: 10px" :row-class-name="tableRowClassName">
      <el-table-column sortable label="S/No" prop="id" />
      <el-table-column sortable label="Date" prop="createdAt" />
      <el-table-column sortable label="Name" prop="name" />
      <el-table-column sortable label="Email" prop="email" />
      <el-table-column sortable label="Message" prop="message" />
      <el-table-column sortable label="Status" prop="status" />
      <el-table-column sortable label="Staff" prop="user.name" />
      <el-table-column fixed="right" label="Actions" :width="actionColumnWidth">
        <template #default="scope">
          <el-button
            v-if="showAdminButtons" type="success" :icon="Edit"
            @click="reviewFeedback(scope as TableSlotDefault)" circle />
        </template>
      </el-table-column>
    </el-table>

    <ElPagination
      layout="sizes,prev,pager,next, total"
      v-model:currentPage="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 50, 200, 10000]"
      :total="total"
      :background="true"
      @size-change="onPageSizeChange"
      @current-change="onPageChange"
      class="mt-4" />



      
<el-dialog
  title="Send us a message"
  v-model="dialogFeedback"
  width="25%"
  :center="true"
>
  <el-form :model="feedback" :rules="feedbackRules" ref="ruleFormRef"> 
    <el-row>
      <el-col :xs="24" :sm="12">
        <el-form-item label="Name" prop="name">
          <el-input v-model="feedback.name" disabled/>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row>
      <el-col :xs="24" :sm="12">
        <el-form-item label="Email" prop="email">
          <el-input v-model="feedback.email" disabled/>
        </el-form-item>
      </el-col>
    </el-row>
    
    <el-row>
      <el-col :xs="24" :sm="12">
        <el-form-item label="Message" prop="message">
          <el-input v-model="feedback.message" type="textarea" disabled/>
        </el-form-item>
      </el-col>
    </el-row>
 

    <el-row>
      <el-col :xs="24" :sm="12">
        <el-form-item label="Action" prop="actionTaken">
          <el-input v-model="feedback.actionTaken" type="textarea"  />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row>
      <el-col :xs="24" :sm="12">
        <el-form-item label="Status" prop="status">
          <el-select v-model="feedback.status" class="m-2" placeholder="Select"  >
    <el-option
      v-for="item in options"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    />
  </el-select>        </el-form-item>
      </el-col>
    </el-row>


  </el-form>
  <div style="text-align: center">
    <el-button @click="dialogFeedback = false">Cancel</el-button>
    <el-button type="primary" @click="updateFeedback(ruleFormRef)">Submit</el-button>
  </div>

  </el-dialog>



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
