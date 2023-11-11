<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
 import { ElButton, ElSwitch, ElSelect, ElDialog, ElForm, ElFormItem, ElInput } from 'element-plus'
 import { ElMessage } from 'element-plus'
import {
  Position,
  TopRight,
  User,
   Plus,Edit, 
  Download,
  Filter,
  MessageBox
} from '@element-plus/icons-vue'

import { ref, reactive } from 'vue'
import { ElPagination, ElTooltip, ElOption, ElDivider } from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import {  activateUserApi } from '@/api/users'
import { CreateRecord, DeleteRecord, updateOneRecord } from '@/api/settlements'
import { uuid } from 'vue-uuid'

import {
   searchByKeyWord
 
} from '@/api/settlements'
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
const roleOptions = ref([])

const settlements = ref([])
const filteredSettlements = ref([])
const page = ref(1)
const pSize = ref(10)
const selCounties = []
const loading = ref(true)
const pageSize = ref(10)
const currentPage = ref(1)
const total = ref(0)
const downloadLoading = ref(false)

let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var filterValues = []
var tblData = []
const associated_Model = ''
const associated_multiple_models = []

const model = 'roles'
const searchString = ref()


//// ------------------parameters -----------------------////

const { t } = useI18n()

const columns: TableColumn[] = [
  {
    field: 'id',
    label: t('Id'),
 
  },

  {
    field: 'name',
    label: t('Name')
  },
 
  {
    field: 'description',
    label: t('Description')
  },
 
  {
    field: 'action',
    label: t('Active')
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
  getAllRoles()
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

const getAllRoles = async () => {
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
 
 
  

const activateDeactivate = (data: TableSlotDefault) => {
  console.log('Activating user.....', data.row)
  // data.mode = 'users'

//  activateUserApi(data.row, { model: 'users' }).then(() => {})
}
 
 
const getFilteredData = async (selFilters, selfilterValues) => {
  const formData = {}
  formData.limit = 100
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

  const filteredData = res.data.filter((item) => item.name !== 'super_admin');

  tableDataList.value = filteredData

  total.value = res.total
  loading.value = false

  tblData = [] // reset the table data
  console.log('TBL-b4', tblData)
  res.data.forEach(function (arrayItem) {
    console.log('arrayItem ----->', arrayItem)
 
    var dd = destructure(arrayItem)
    tblData.push(dd)
    //  generate the filter options
    var opt = {}
    opt.value = arrayItem.id
    opt.label = arrayItem.name + '(' + arrayItem.id + ')'
    //  console.log(countyOpt)
    if (arrayItem.name !='super_admin') {
      roleOptions.value.push(opt) 
    }
    
  })

  console.log('roleOptions', roleOptions)
}

 

 
getAllRoles()



const formHeader = ref('Add Category')
const showSubmitBtn = ref(true)
const showEditSaveButton = ref(false)


const AddDialogVisible=ref(false)
const AddRole = (data: TableSlotDefault) => {

  ElMessage.warning("Coming soon...")
  AddDialogVisible.value = true
 
}


const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  name: '',
  description: '',
  subordinates: '',

})

const editRole = (data: TableSlotDefault) => {
  showSubmitBtn.value = false
  showEditSaveButton.value = true
  console.log(data)
  ruleForm.id = data.row.id
  ruleForm.name = data.row.name
  ruleForm.description = data.row.description
  ruleForm.subordinates = data.row.subordinates


  formHeader.value = 'Edit Role'


  AddDialogVisible.value = true
}

 


const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      ruleForm.model = model
      ruleForm.code = uuid.v4()
      const res = CreateRecord(ruleForm)

    } else {
      console.log('error submit!', fields)
    }
  })
}


const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      ruleForm.model = model

      updateOneRecord(ruleForm).then(() => { })

      // dialogFormVisible.value = false


    } else {
      console.log('error submit!', fields)
    }
  })
}

 

</script>

<template>
  <ContentWrap
    :title="t('Users')"
    :message="t('Use the filters to subset')"
  >
  
    <div style="display: inline-block; margin-right: 20px;">
      <el-tooltip content="Create Role" placement="top">
        <el-button :onClick="AddRole" type="primary" :icon="Plus" />
      </el-tooltip>
    </div>

    <el-divider border-style="dashed" content-position="left">Roles</el-divider>

    <Table
      :columns="columns"
      :data="tableDataList"
      :loading="loading"
      :selection="true"
      :pageSize="pageSize"
      :currentPage="currentPage"
    >
    <template #action="data">
          <div class="action-buttons">
            <el-tooltip content="Activate/Deactivate User" placement="top" v-if="data.row.name !== 'super_admin'">
              <ElSwitch v-model="data.row.isactive" @click="activateDeactivate(data as TableSlotDefault)">
              {{ t('tableDemo.action') }}
              </ElSwitch>
            </el-tooltip>

            <!-- Add space here -->
            <div class="button-space"></div>

         <!-- Conditionally render the Edit button based on the role -->
          <el-tooltip content="Edit" placement="top" v-if="data.row.name !== 'super_admin'">
            <el-button type="success" :icon="Edit" @click="editRole(data as TableSlotDefault)" circle />
          </el-tooltip>
          </div>
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


    <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formHeader" width="30%" draggable>
    <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px">
      <el-form-item label="Title">
        <el-input v-model="ruleForm.name" />
      </el-form-item>
      <el-form-item label="Description">
        <el-input v-model="ruleForm.description" />
      </el-form-item>

      <el-form-item label="Subordinates">
        <el-select multiple v-model="ruleForm.subordinates" placeholder="Select">
        <el-option
          v-for="item in roleOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
         />
      </el-select>      
    </el-form-item>

    


    </el-form>
    <template #footer>

      <span class="dialog-footer">
        <el-button @click="AddDialogVisible = false">Cancel</el-button>
        <el-button v-if="showSubmitBtn" type="primary" @click="submitForm(ruleFormRef)">Submit</el-button>
        <el-button v-if="showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>
      </span>
    </template>
  </el-dialog>


  </ContentWrap>
</template>
 
<style>
  .action-buttons {
    display: flex;
    align-items: center;
  }

  /* Adjust the space as needed */
  .button-space {
    width: 10px; /* You can change this value to adjust the space */
  }
</style>
