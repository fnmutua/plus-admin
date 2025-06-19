<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { ElButton, ElSwitch, ElSelect, ElDialog, ElForm, ElFormItem, ElInput } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Plus,Edit} from '@element-plus/icons-vue'

import { ref, reactive, onMounted } from 'vue'
import { ElPagination, ElTooltip, ElOption, ElDivider } from 'element-plus'
import { useRouter } from 'vue-router'
import { useCache } from '@/hooks/web/useCache'
import { useAppStore } from '@/store/modules/app'
import request from '@/config/axios/service'

import {
  getRoles,
  createRole,
  updateRole,
  getAllPermissions,
  getRolePermissions,
  setRolePermissions,
  getUserRoles
} from '@/api/users'

import { useAppStoreWithOut } from '@/store/modules/app'



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
const roleOptions = ref<{ value: number; label: string }[]>([])

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

let tableDataList = ref([])
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
  const res = await getRoles()
  tableDataList.value = res.data.data || res.data || []
  loading.value = false
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
 
 
// const getFilteredData = async (selFilters, selfilterValues) => { ... }

 


const formHeader = ref('Add Category')
const showSubmitBtn = ref(true)
const showEditSaveButton = ref(false)


const AddDialogVisible=ref(false)
const permissions = ref<{ id: number; name: string; description?: string }[]>([])
const selectedPermissions = ref<number[]>([])

// Fetch all permissions
const fetchPermissions = async () => {
  console.log( 'getAllPermissions()')

  const res = await getAllPermissions()
  permissions.value = res.data.data || res.data || []
}

// Fetch permissions for a role
const fetchRolePermissions = async (roleId) => {
  const res = await getRolePermissions({ roleId: roleId })
  // Backend returns an array of permissions in res.data.data
  selectedPermissions.value = (res.data.data || []).map(p => p.id)
}
 
 
const { wsCache } = useCache()
 const appStore = useAppStoreWithOut()



const fetchSubordinateRoles = async () => {
  const currentUser = wsCache.get(appStore.getUserInfo)
  console.log('currentUser',currentUser)
  if (!currentUser) return

  // 1. Get the user's roles (with subordinates)
  const userRolesRes = await getUserRoles(currentUser)
  const userRoles = userRolesRes.data || []

  console.log('userRoles',userRoles)

  // 2. Collect all unique subordinate IDs
  const subordinateIds = [
    ...new Set(userRoles.flatMap(role => role.subordinates || []))
  ]


  // 3. Fetch all roles
  const allRolesRes = await getRoles({})
  const allRoles = allRolesRes.data?.data || []

  // 4. Filter to only subordinate roles
  const subordinateRoles = allRoles.filter(role => subordinateIds.includes(role.id))

  // 5. Set options for the select
  roleOptions.value = userRoles.map(role => ({
    value: role.id,
    label: role.name
  }))
}

onMounted(() => {
  fetchPermissions()
  getAllRoles()
  fetchSubordinateRoles()
})

const AddRole = (data) => {
  ElMessage.warning("Coming soon...")
  AddDialogVisible.value = true
  // Reset selected permissions
  selectedPermissions.value = []
  ruleForm.subordinates = []
  fetchSubordinateRoles()
}


const ruleFormRef = ref()
const ruleForm = reactive({
  id: '',
  name: '',
  description: '',
  subordinates: [] as number[],
})

const editRole = (data) => {
  showSubmitBtn.value = false
  showEditSaveButton.value = true
  ruleForm.id = data.row.id
  ruleForm.name = data.row.name
  ruleForm.description = data.row.description
  ruleForm.subordinates = Array.isArray(data.row.subordinates)
    ? data.row.subordinates
    : []
  formHeader.value = 'Edit Role'
  AddDialogVisible.value = true
  // Fetch and set permissions for this role
  fetchRolePermissions(data.row.id)
  fetchSubordinateRoles()
}

 


const submitForm = async (formEl) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      // Create the role
      const res = await createRole(ruleForm)
      const newRoleId = res.data?.data?.id || res.data?.id || res.data?.data?.roleId || res.data?.roleId
      if (newRoleId) {
        await setRolePermissions({
          roleId: newRoleId,
          permissions: selectedPermissions.value
        })
      }
      AddDialogVisible.value = false
      getAllRoles()
    } else {
      console.log('error submit!', fields)
    }
  })
}


const editForm = async (formEl) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      await updateRole(ruleForm)
      // Send array of permission ids to backend
      const permissionsPayload = {
        permissions: selectedPermissions.value,
        roleId: ruleForm.id
      }
      await setRolePermissions(permissionsPayload)
      AddDialogVisible.value = false
      getAllRoles()
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

    <el-form-item label="Permissions">
      <el-select v-model="selectedPermissions" multiple filterable placeholder="Select permissions">
        <el-option
          v-for="perm in permissions"
          :key="perm.id"
          :label="perm.name"
          :value="perm.id"
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
