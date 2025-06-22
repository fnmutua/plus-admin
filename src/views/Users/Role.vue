<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { ElButton, ElSwitch, ElSelect, ElDialog, ElForm, ElFormItem, ElInput, ElTabs, ElCard,ElTable,ElTableColumn,ElRow,
  ElTabPane, ElTransfer, ElDrawer,ElCheckTag,ElCheckbox,ElCollapse,ElCollapseItem,ElCheckboxButton,ElCheckboxGroup
 } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Plus,Edit, Back, Check} from '@element-plus/icons-vue'

import { ref, reactive, onMounted, computed } from 'vue'
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
import PermissionWrapper from '@/components/PermissionWrapper.vue'
import DownloadAll from '@/views/Components/DownloadAll.vue'

interface Params {
  pageIndex?: number
  xpageSize?: number
}

const isMobile = computed(() => appStore.getMobile)


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

 
 
 

const getAllRoles = async () => {
  const res = await getRoles({} as any);
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
const permissions = ref<any[]>([])
const selectedPermissions = ref<number[]>([])

// Fetch all permissions
const fetchPermissions = async () => {
  const res = await getAllPermissions();
  permissions.value = res.data.data || res.data || []
}

// Fetch permissions for a role
const fetchRolePermissions = async (roleId: any) => {
  const res = await getRolePermissions({ roleId } as any);
  selectedPermissions.value = (res.data.data || []).map((p: any) => p.id)
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

 

const activeTab = ref('details')

const groupedPermissions = computed(() => {
  const groups = {};
  for (const perm of permissions.value) {
    if (!perm.category) continue;
    const category = perm.category;
    if (!groups[category]) groups[category] = [];
    groups[category].push(perm);
  }
  return groups;
});

const transferPermissions = computed(() => {
  return permissions.value.map(perm => {
    return {
      key: perm.id,
      label: perm.name + (perm.description ? ' - ' + perm.description : ''),
      category: perm.category,
      ...perm
    };
  });
});

const openGroups = ref<string[]>([])

const groupedPermissionOptions = computed(() => {
  const groups = {};
  for (const perm of permissions.value) {
    if (!perm.category) continue;
    const category = perm.category;
    if (!groups[category]) groups[category] = [];
    groups[category].push(perm);
  }
  return Object.entries(groups).map(([label, options]) => ({
    label,
    options
  }));
});

const permissionGroupSearch = ref('')

const filteredGroupedPermissionOptions = computed(() => {
  if (!permissionGroupSearch.value) return groupedPermissionOptions.value
  const search = permissionGroupSearch.value.toLowerCase()
  return groupedPermissionOptions.value.filter(group =>
    group.label.toLowerCase().includes(search)
  )
})

const selectedPermissionsCount = computed(() => selectedPermissions.value.length)

function getSelectedPermissionsForGroup(group) {
  return group.options.filter(perm => selectedPermissions.value.includes(perm.id))
}

function isGroupAllSelected(group) {
  return group.options.every(perm => selectedPermissions.value.includes(perm.id))
}
function isGroupIndeterminate(group) {
  const selectedCount = group.options.filter(perm => selectedPermissions.value.includes(perm.id)).length
  return selectedCount > 0 && selectedCount < group.options.length
}
function toggleGroupSelection(group, checked) {
  const groupIds = group.options.map(perm => perm.id)
  if (checked) {
    // Add all group permissions
    selectedPermissions.value = Array.from(new Set([...selectedPermissions.value, ...groupIds]))
  } else {
    // Remove all group permissions
    selectedPermissions.value = selectedPermissions.value.filter(id => !groupIds.includes(id))
  }
}


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

</script>

<template>
   <el-card>
   

    
    <el-row type="flex" justify="start" gutter="10" style="display: flex; flex-wrap: nowrap; align-items: center;">

<div class="max-w-200px">
  <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
    Back
  </el-button>
</div>
 
<!-- Action Buttons -->
<div style="display: flex; justify-content: flex-end; align-items: center; ">
  <PermissionWrapper :permissions="'roles:create'">
    <el-tooltip content="Add Role " placement="top">
      <el-button :onClick="AddRole" type="primary" :icon="Plus" />
    </el-tooltip>
  </PermissionWrapper>
  
  <PermissionWrapper :permissions="['user:download']">
    <DownloadAll :model="model" :associated_models="associated_multiple_models"/>
  </PermissionWrapper>
</div>

</el-row>

  


    <el-table :data="tableDataList" style="width: 100% ; "  v-loading="loading">

<el-table-column prop="id" label="#" width="50" />
 
<el-table-column label="Role" prop="name" width="200" sortable />
<el-table-column label="Description" prop="description" sortable />
 <el-table-column fixed="right"  label="Actions"  width="220">
  <template #default="scope">
    <div style="display: flex; gap: 12px; align-items: center; justify-content: center;">
      <PermissionWrapper :permissions="['roles:update', 'roles:delete']">
        <el-tooltip content="Activate/Deactivate" placement="top" v-if="scope.row.name !== 'root_admin' && scope.row.name !== 'super_admin'">
          <el-switch v-model="scope.row.isactive" @click="activateDeactivate(scope as TableSlotDefault)" active-color="#13ce66" inactive-color="#ff4949" />
        </el-tooltip>
        <el-tooltip content="Edit" placement="top" v-if="scope.row.name !== 'root_admin' && scope.row.name !== 'super_admin'">
          <el-button type="primary" :icon="Edit" @click="editRole(scope as TableSlotDefault)"   size="small" />
        </el-tooltip>
      </PermissionWrapper>
    </div>
  </template>
</el-table-column>

</el-table>

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
    <el-drawer
      v-model="AddDialogVisible"
      :title="formHeader"
      :size="isMobile ? '100%' : '600px'"
      direction="rtl"
      class="role-drawer"
      :with-header="true"
      :close-on-click-modal="false"
    >
      <el-tabs v-model="activeTab">
        <el-tab-pane label="Role Details" name="details">
          <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px" style="margin-top: 24px;">
            <el-form-item label="Title">
              <el-input v-model="ruleForm.name" placeholder="Enter role name" />
            </el-form-item>
            <el-form-item label="Description">
              <el-input v-model="ruleForm.description" placeholder="Describe this role" />
            </el-form-item>
            <el-form-item label="Subordinates">
              <el-select multiple v-model="ruleForm.subordinates" placeholder="Select subordinates" filterable>
                <el-option
                  v-for="item in roleOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="Permissions" name="permissions">
          <div style="margin: 24px 0;">
            <el-input
              v-model="permissionGroupSearch"
              placeholder="Search permission groups..."
              clearable
              style="margin-bottom: 16px; width: 100%;"
            />
            <div style="margin-bottom: 10px; color: #409EFF;">
              This role currently has {{ selectedPermissionsCount }} permission{{ selectedPermissionsCount === 1 ? '' : 's' }} assigned.
            </div>
            <el-collapse v-model="openGroups">
              <el-collapse-item
                v-for="group in filteredGroupedPermissionOptions"
                :key="group.label"
                :name="group.label"
              >
                <template #title>
                  <el-checkbox
                    :model-value="isGroupAllSelected(group)"
                    :indeterminate="isGroupIndeterminate(group)"
                    @change="checked => toggleGroupSelection(group, checked)"
                    style="margin-right: 8px;"
                  />
                  <span style="font-weight: bold;">{{ group.label }}</span>
                </template>
                <el-checkbox-group v-model="selectedPermissions">
                  <el-checkbox
                    v-for="perm in group.options"
                    :key="perm.id"
                    :label="perm.id"
                  >
                    {{ perm.description }}
                  </el-checkbox>
                </el-checkbox-group>
              </el-collapse-item>
            </el-collapse>
            <div style="margin-top: 8px; color: #888; font-size: 13px;">
              Tip: Expand a group to check/uncheck permissions. Descriptions are shown for clarity.
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="Review" name="review">
          <div style="margin: 24px 0;">
            <div v-if="selectedPermissions.length === 0" style="color: #f56c6c;">No permissions selected.</div>
            <div v-else>
              <div v-for="group in groupedPermissionOptions" :key="group.label">
                <div v-if="getSelectedPermissionsForGroup(group).length" style="font-weight: bold; margin-top: 12px;">
                  {{ group.label }}
                </div>
                <ul style="margin: 0 0 8px 0; padding-left: 20px;">
                  <li v-for="perm in getSelectedPermissionsForGroup(group)" :key="perm.id" style="list-style: none; display: flex; align-items: center; gap: 6px;">
                    <el-icon style="color: #67c23a;"><Check /></el-icon>
                    <span>{{ perm.description || perm.name }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 12px; padding: 8px 0; border-top: 1px solid #f0f0f0; background: #fafbfc;">
          <el-button @click="AddDialogVisible = false">Cancel</el-button>
          <el-button v-if="activeTab === 'details'" type="primary" @click="activeTab = 'permissions'">Next</el-button>
          <el-button v-if="activeTab === 'permissions'" type="primary" @click="activeTab = 'review'">Next</el-button>
          <el-button v-if="activeTab === 'review'" @click="activeTab = 'permissions'">Back</el-button>
          <el-button v-if="activeTab === 'review' && showSubmitBtn" type="primary" @click="submitForm(ruleFormRef)">Create</el-button>
          <el-button v-if="activeTab === 'review' && showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>
        </div>
      </template>
    </el-drawer>


  </el-card>
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

  .role-drawer .el-drawer__body {
    padding: 0 32px 16px 32px;
  }
</style>
