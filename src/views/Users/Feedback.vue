<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty, searchByKeyWord } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { ElButton, ElSelect, MessageParamsWithType } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Position,
  TopRight,
  User,
  Plus,
  Download,
  Filter,
  MessageBox,
  Edit,
  InfoFilled,
  Delete
} from '@element-plus/icons-vue'

import { ref, reactive } from 'vue'
import {
  ElPagination, ElTable, ElTableColumn, ElTooltip, ElOption, ElDivider ,
  ElDialog, ElForm, ElFormItem, ElInput, FormRules, ElDatePicker, ElPopconfirm
} from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import type { FormInstance } from 'element-plus'
 

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
const associated_Model = 'users'
const associated_multiple_models = ['users']
const model = 'feedback'
//// ------------------parameters -----------------------////

const { t } = useI18n()






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


  // - multiple filters -------------------------------------
  formData.filters = []
  formData.filterValues = []
  formData.associated_multiple_models = ['users']

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)
var result = res.data 
result.sort((a, b) => (a.id > b.id) ? -1 : 1);

  console.log(result);


  console.log('After Querry', res)
  tableDataList.value = res.data
  total.value = res.total

  loading.value = false
}


const searchString = ref()


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





getInterventionsAll()





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


</script>

<template>
  <ContentWrap :title="t('Feedback')">
    <!-- <Table :columns="columns" :data="tableDataList" :loading="loading" :selection="true" :pageSize="pageSize"
                                                                                :currentPage="currentPage" :row-class-name="tableRowClassName" /> -->

    <div style="display: inline-block; margin-bottom: 10px">
      <el-select
v-model="value1" multiple clearable filterable remote :remote-method="searchByName" reserve-keyword
        placeholder="Search by Name" />
    </div>

    <el-table
:data="tableDataList" :loading="loading" :pageSize="pageSize" :currentPage="currentPage" border
      style="width: 100%" :row-class-name="tableRowClassName">

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
layout="sizes,prev,pager,next, total" v-model:currentPage="currentPage" v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 50, 200, 10000]" :total="total" :background="true" @size-change="onPageSizeChange"
      @current-change="onPageChange" class="mt-4" />



      
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



  </ContentWrap>
</template>

<style>
.el-table .danger-row {
  --el-table-tr-bg-color: var(--el-color-danger-light-7);
}

.el-table .success-row {
  --el-table-tr-bg-color: var(--el-color-success-light-7);
}
</style>
