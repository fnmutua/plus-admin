<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { ElButton, ElSwitch, ElSelect, ElDialog, ElForm, ElFormItem, ElInput, ElTabs, ElCard,ElTable,ElTableColumn,ElRow,
  ElTabPane, ElTransfer, ElDrawer,ElCheckTag,ElCheckbox,ElCollapse,ElCollapseItem,ElCheckboxButton,ElCheckboxGroup,
  ElDropdown, ElDropdownMenu, ElDropdownItem, ElIcon
 } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Plus, Edit, Back, Check, Setting, Switch, ArrowLeft, ArrowRight,
} from '@element-plus/icons-vue'

import { ref, reactive, onMounted, computed } from 'vue'
import { ElPagination, ElTooltip, ElOption, ElDivider } from 'element-plus'
import { useRouter } from 'vue-router'
import { useCache } from '@/hooks/web/useCache'
import { useAppStore } from '@/store/modules/app'
import { service as request } from '@/config/axios/service'

import {
  getRoles,
  createRole,
  updateRole,
  getAllPermissions,
  getRolePermissions,
  setRolePermissions,
  getRoleProgrammes,
  setRoleProgrammes,
  getProgrammeCatalog,
  getUserRoles
} from '@/api/users'
import { sortProgrammeSelectOptions } from '@/utils/programmeComponentTree'
import type { ProgrammeRecord } from '@/utils/programmeValidation'

import { useAppStoreWithOut } from '@/store/modules/app'
import PermissionWrapper from '@/components/PermissionWrapper.vue'

interface Params {
  pageIndex?: number
  xpageSize?: number
}

const isMobile = computed(() => appStore.getMobile)
const actionColumnWidth = computed(() => (isMobile.value ? 80 : 100))


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

let tableDataList = ref([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var filterValues = []
var tblData = []


//// ------------------parameters -----------------------////

const { t } = useI18n()

 
 
 

const getAllRoles = async () => {
  loading.value = true
  try {
    const res = await getRoles({} as any);
    tableDataList.value = (res as any).data?.data || (res as any).data || []
    total.value = tableDataList.value.length
    const maxPage = Math.max(1, Math.ceil(total.value / pageSize.value) || 1)
    if (currentPage.value > maxPage) currentPage.value = maxPage
  } finally {
    loading.value = false
  }
}

const paginatedRoles = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return tableDataList.value.slice(start, start + pageSize.value)
})

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
 
 
  

const activateDeactivate = async (data: TableSlotDefault) => {
  const row = data.row
  if (!row || row.name === 'root_admin' || row.name === 'super_admin') return

  const nextActive = !row.isactive
  try {
    await updateRole({
      id: row.id,
      name: row.name,
      description: row.description,
      subordinates: Array.isArray(row.subordinates) ? row.subordinates : [],
      isactive: nextActive
    } as any)
    row.isactive = nextActive
    ElMessage.success(nextActive ? 'Role activated' : 'Role deactivated')
  } catch (e) {
    ElMessage.error('Failed to update role status')
  }
}
 
 
// const getFilteredData = async (selFilters, selfilterValues) => { ... }

 


const formHeader = ref('Add Category')
const showSubmitBtn = ref(true)
const showEditSaveButton = ref(false)


const AddDialogVisible=ref(false)
const permissions = ref<any[]>([])
const selectedPermissions = ref<number[]>([])
const programmeOptions = ref<{ value: number; label: string }[]>([])
const programmeScopeEnabled = ref(false)
const selectedProgrammeIds = ref<number[]>([])

const fetchProgrammeOptions = async () => {
  try {
    const res = await getProgrammeCatalog()
    const rows = (res as any)?.data || []
    const programmes = rows as ProgrammeRecord[]
    programmeOptions.value = sortProgrammeSelectOptions(
      programmes
        .filter((row: any) => row.parentId == null || row.parentId === '')
        .map((row: any) => ({
          value: Number(row.id),
          label: row.title || row.acronym || row.code || `Programme ${row.id}`,
        })),
      programmes,
    )
  } catch (error) {
    console.error('Failed to load programmes for role scope:', error)
    programmeOptions.value = []
  }
}

const fetchRoleProgrammes = async (roleId: number) => {
  try {
    const res = await getRoleProgrammes({ roleId })
    const payload = (res as any)?.data?.data || (res as any)?.data || {}
    programmeScopeEnabled.value = !!payload.scopeEnabled
    selectedProgrammeIds.value = Array.isArray(payload.programmeIds)
      ? payload.programmeIds.map((id: number) => Number(id))
      : []
  } catch (error) {
    console.error('Failed to load role programme scope:', error)
    programmeScopeEnabled.value = false
    selectedProgrammeIds.value = []
  }
}

const saveRoleProgrammes = async (roleId: number) => {
  await setRoleProgrammes({
    roleId,
    scopeEnabled: programmeScopeEnabled.value,
    programmeIds: selectedProgrammeIds.value,
  })
}

// Fetch all permissions
const fetchPermissions = async () => {
  const res = await getAllPermissions();
  permissions.value = res.data.data || res.data || []
}

// Fetch permissions for a role
const fetchRolePermissions = async (roleId: any) => {
  const res = await getRolePermissions({ roleId } as any);
  selectedPermissions.value = ((res as any).data?.data || []).map((p: any) => p.id)
}

// Default permissions for new roles (read-only permissions based on public role)
const getDefaultPermissions = () => {
  return [
    "article:read",
    "chart_indicator:read",
    "collector:read",
    "collector:submit",
    "community_hall:read",
    "community_project:read",
    "component:read",
    "contractor:read",
    "county:read",
    "crime_hotspot:read",
    "dashboard:read",
    "dashboard_card:read",
    "dashboard_section:read",
    "dashboard_section_chart:read",
    "data:export",
    "document:read",
    "document_category:read",
    "document_type:read",
    "domain:read",
    "dumping_site:read",
    "education_facility:read",
    "facility:read",
    "floodlight:read",
    "hazard_zone:read",
    "health_facility:read",
    "indicator_category_report:read",
    "intervention:read",
    "intervention_type:read",
    "lot:read",
    "mast:read",
    "other_facility:read",
    "otp:read",
    "parcel:read",
    "path:read",
    "piped_water:read",
    "police:read",
    "powerline:read",
    "programme_implementation:read",
    "project:read",
    "project_beneficiary:read",
    "project_location:read",
    "public_facility:read",
    "railway:read",
    "report:export",
    "road:read",
    "road_asset:read",
    "settlement:export",
    "settlement:export_data",
    "settlement:history",
    "settlement:read",
    "settlement:verify",
    "settlement:viewMap",
    "settlement:view_map",
    "settlement_history:export",
    "settlement_history:read",
    "sewer:read",
    "status:read",
    "stream:read",
    "streetlight:read",
    "structure:read",
    "subcounty:read",
    "ward:read",
    "water_point:read",
    "health_facility:read",
    "police_station:read",
    "households:read"
  ]
}

// Get default permission IDs based on available permissions
const getDefaultPermissionIds = () => {
  const defaultPermissionNames = getDefaultPermissions()
  return permissions.value
    .filter(perm => defaultPermissionNames.includes(perm.name))
    .map(perm => perm.id)
}
 
 
const { wsCache } = useCache()
 const appStore = useAppStoreWithOut()



const fetchSubordinateRoles = async () => {
  const currentUser = wsCache.get(appStore.getUserInfo)
  console.log('currentUser',currentUser)
  if (!currentUser) return

  // 1. Get the user's roles (with subordinates)
  const userRolesRes = await getUserRoles(currentUser)
  const userRoles = (userRolesRes as any).data || []

  console.log('userRoles',userRoles)

  // 2. Collect all unique subordinate IDs
  const subordinateIds = [
    ...new Set((userRoles as any[]).flatMap(role => role.subordinates || []))
  ]


  // 3. Fetch all roles
  const allRolesRes = await getRoles({} as any)
  const allRoles = (allRolesRes as any).data?.data || []

  // 4. Filter to only subordinate roles
  const subordinateRoles = allRoles.filter(role => subordinateIds.includes(role.id))

  // 5. Set options for the select
  roleOptions.value = (userRoles as any[]).map((role: any) => ({
    value: Number(role.id),
    label: role.name
  }))
}

onMounted(() => {
  fetchPermissions()
  getAllRoles()
  fetchSubordinateRoles()
  fetchProgrammeOptions()
})

const AddRole = () => {
  AddDialogVisible.value = true
  // Reset form
  ruleForm.id = ''
  ruleForm.name = ''
  ruleForm.description = ''
  ruleForm.subordinates = []
  
  // Set default permissions (read-only permissions)
  selectedPermissions.value = getDefaultPermissionIds()
  programmeScopeEnabled.value = false
  selectedProgrammeIds.value = []
  
  formHeader.value = 'Add Role'
  showSubmitBtn.value = true
  showEditSaveButton.value = false
  activeTab.value = 'details'
  
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
  fetchRoleProgrammes(data.row.id)
  fetchSubordinateRoles()
}

 


const submitForm = async (formEl) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      // The backend will automatically add this new role as a subordinate to root_admin and super_admin
      // so we don't need to modify the subordinates array here
      const res = await createRole(ruleForm as any)
      const newRoleId = (res as any).data?.data?.id || (res as any).data?.id || (res as any).data?.data?.roleId || (res as any).data?.roleId
      if (newRoleId) {
        await setRolePermissions({
          roleId: newRoleId,
          permissions: selectedPermissions.value
        } as any)
        await saveRoleProgrammes(Number(newRoleId))
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
      // The backend will automatically ensure this role remains a subordinate of root_admin and super_admin
      await updateRole(ruleForm as any)
      // Send array of permission ids to backend
      const permissionsPayload = {
        permissions: selectedPermissions.value,
        roleId: ruleForm.id
      }
      await setRolePermissions(permissionsPayload as any)
      await saveRoleProgrammes(Number(ruleForm.id))
      AddDialogVisible.value = false
      getAllRoles()
    } else {
      console.log('error submit!', fields)
    }
  })
}

 

const activeTab = ref('details')

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

function titleCase(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function getEntityKeyFromPermission(perm: { name: string }) {
  return perm.name.split(':')[0]
}

function getBroadCategoryLabel(entityKey: string) {
  const root = entityKey.includes('_') ? entityKey.split('_')[0] : entityKey
  return titleCase(root)
}

function getEntityLabel(entityKey: string) {
  return titleCase(entityKey)
}

const groupedPermissionOptions = computed(() => {
  const broadMap = new Map<string, Map<string, any[]>>()

  for (const perm of permissions.value) {
    const entityKey = getEntityKeyFromPermission(perm)
    const broadLabel = getBroadCategoryLabel(entityKey)
    if (!broadMap.has(broadLabel)) broadMap.set(broadLabel, new Map())
    const entityMap = broadMap.get(broadLabel)!
    if (!entityMap.has(entityKey)) entityMap.set(entityKey, [])
    entityMap.get(entityKey)!.push(perm)
  }

  return Array.from(broadMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, entityMap]) => {
      const entities = Array.from(entityMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([entityKey, options]) => ({
          label: getEntityLabel(entityKey),
          entityKey,
          options
        }))

      return {
        label,
        entities,
        options: entities.flatMap(entity => entity.options)
      }
    })
})

const permissionGroupSearch = ref('')

const filteredGroupedPermissionOptions = computed(() => {
  if (!permissionGroupSearch.value) return groupedPermissionOptions.value

  const search = permissionGroupSearch.value.toLowerCase()

  return groupedPermissionOptions.value
    .map(broadGroup => {
      if (broadGroup.label.toLowerCase().includes(search)) return broadGroup

      const entities = broadGroup.entities
        .map(entity => {
          if (entity.label.toLowerCase().includes(search)) return entity

          const options = entity.options.filter(perm =>
            perm.name?.toLowerCase().includes(search) ||
            perm.description?.toLowerCase().includes(search)
          )

          if (options.length) {
            return { ...entity, options }
          }

          return null
        })
        .filter(Boolean) as typeof broadGroup.entities

      if (!entities.length) return null

      return {
        ...broadGroup,
        entities,
        options: entities.flatMap(entity => entity.options)
      }
    })
    .filter(Boolean) as typeof groupedPermissionOptions.value
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

// Pagination handlers (client-side)
const onPageSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const onPageChange = (page: number) => {
  currentPage.value = page
}

// Form validation rules
const rules = {
  name: [
    { required: true, message: 'Please enter role name', trigger: 'blur' }
  ],
  description: [
    { required: true, message: 'Please enter role description', trigger: 'blur' }
  ]
}

</script>

<template>
   <el-card>
   

    
    <el-row type="flex" justify="space-between" :gutter="10" style="display: flex; flex-wrap: nowrap; align-items: center; width: 100%;">

<div class="max-w-200px">
  <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
    Back
  </el-button>
</div>
 
<!-- Action Buttons -->
<div class="roles-toolbar-actions" :style="{ width: `${actionColumnWidth}px` }">
  <PermissionWrapper :permissions="'roles:create'">
    <el-tooltip content="Add Role " placement="top">
      <el-button :onClick="AddRole" type="primary" :icon="Plus" />
    </el-tooltip>
  </PermissionWrapper>
</div>

</el-row>

  


    <el-table :data="paginatedRoles" style="width: 100% ; "  v-loading="loading">

<el-table-column prop="id" label="#" width="50" />
 
<el-table-column label="Role" prop="name" width="200" sortable />
<el-table-column label="Description" prop="description" sortable />
 <el-table-column
  fixed="right"
  :label="isMobile ? '' : 'Actions'"
  :width="actionColumnWidth"
  align="center"
  header-align="center"
  class-name="roles-actions-col"
>
  <template #default="scope">
    <div class="roles-actions-cell">
    <el-dropdown
      v-if="scope.row.name !== 'root_admin' && scope.row.name !== 'super_admin'"
      trigger="click"
      placement="bottom-end"
    >
      <el-button
        v-if="!isMobile"
        type="primary"
        size="small"
        :icon="Setting"
        circle
      />
      <el-button v-else link size="small">
        <el-icon><Setting /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <PermissionWrapper :permissions="['roles:update']">
            <el-dropdown-item @click="activateDeactivate(scope as TableSlotDefault)">
              <el-icon><Switch /></el-icon>
              <span style="margin-left: 8px;">{{ scope.row.isactive ? 'Deactivate' : 'Activate' }}</span>
            </el-dropdown-item>
          </PermissionWrapper>
          <PermissionWrapper :permissions="['roles:update']">
            <el-dropdown-item @click="editRole(scope as TableSlotDefault)">
              <el-icon><Edit /></el-icon>
              <span style="margin-left: 8px;">Edit</span>
            </el-dropdown-item>
          </PermissionWrapper>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    </div>
  </template>
</el-table-column>

</el-table>

<ElPagination
      :layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 50, 100]"
      :total="total"
      :background="true"
      @size-change="onPageSizeChange"
      @current-change="onPageChange"
      class="mt-4"
      :small="isMobile"
      :pager-count="isMobile ? 3 : 7"
    />
    <el-drawer
      v-model="AddDialogVisible"
      :title="formHeader"
      :size="isMobile ? '100%' : '720px'"
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
              <div style="margin-top: 8px; color: #409EFF; font-size: 13px;">
                Note: This role will automatically become a subordinate of Root Admin and Super Admin (they can manage this role).
              </div>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="Permissions" name="permissions">
          <div style="margin: 24px 0;">
            <el-input
              v-model="permissionGroupSearch"
              placeholder="Search categories, entities, or permissions..."
              clearable
              style="margin-bottom: 16px; width: 100%;"
            />
            <div style="margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
              <span style="color: #409EFF;">
                This role currently has {{ selectedPermissionsCount }} permission{{ selectedPermissionsCount === 1 ? '' : 's' }} assigned.
              </span>
              <el-button
                v-if="selectedPermissions.length > 0"
                type="danger"
                plain
                size="small"
                @click="selectedPermissions = []"
              >Clear All</el-button>
            </div>
            <el-collapse v-model="openGroups" class="permission-category-collapse">
              <el-collapse-item
                v-for="broadGroup in filteredGroupedPermissionOptions"
                :key="broadGroup.label"
                :name="broadGroup.label"
              >
                <template #title>
                  <el-checkbox
                    :model-value="isGroupAllSelected(broadGroup)"
                    :indeterminate="isGroupIndeterminate(broadGroup)"
                    @change="checked => toggleGroupSelection(broadGroup, checked)"
                    @click.stop
                    style="margin-right: 8px;"
                  />
                  <span class="permission-broad-title">{{ broadGroup.label }}</span>
                  <span class="permission-group-meta">
                    {{ broadGroup.entities.length }} {{ broadGroup.entities.length === 1 ? 'entity' : 'entities' }}
                  </span>
                </template>

                <div
                  v-for="entityGroup in broadGroup.entities"
                  :key="entityGroup.entityKey"
                  class="permission-entity-group"
                >
                  <div
                    v-if="broadGroup.entities.length > 1 || entityGroup.label !== broadGroup.label"
                    class="permission-entity-header"
                  >
                    <el-checkbox
                      :model-value="isGroupAllSelected(entityGroup)"
                      :indeterminate="isGroupIndeterminate(entityGroup)"
                      @change="checked => toggleGroupSelection(entityGroup, checked)"
                    />
                    <span class="permission-entity-title">{{ entityGroup.label }}</span>
                  </div>

                  <el-checkbox-group v-model="selectedPermissions" class="permission-checkbox-group">
                    <el-checkbox
                      v-for="perm in entityGroup.options"
                      :key="(perm as any).id"
                      :value="(perm as any).id"
                    >
                      {{ (perm as any).description }}
                    </el-checkbox>
                  </el-checkbox-group>
                </div>
              </el-collapse-item>
            </el-collapse>
            <div style="margin-top: 8px; color: #888; font-size: 13px;">
              Tip: Expand a category to manage permissions by entity. Categories start collapsed.
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="Programme Access" name="programmes">
          <div style="margin: 24px 0;">
            <el-switch
              v-model="programmeScopeEnabled"
              active-text="Limit programmes for this role"
              inactive-text="All programmes (no limit)"
              style="margin-bottom: 16px;"
            />
            <div v-if="programmeScopeEnabled" style="margin-top: 8px;">
              <p style="color: var(--el-text-color-secondary); margin: 0 0 12px;">
                Users with this role will only see projects and programme menus for the selected programmes (including sub-programmes).
              </p>
              <el-select
                v-model="selectedProgrammeIds"
                multiple
                filterable
                collapse-tags
                collapse-tags-tooltip
                placeholder="Select programmes"
                style="width: 100%;"
              >
                <el-option
                  v-for="item in programmeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <div v-if="selectedProgrammeIds.length === 0" style="color: #f56c6c; margin-top: 8px;">
                Select at least one programme, or turn off the limit.
              </div>
            </div>
            <div v-else style="color: var(--el-text-color-secondary); font-size: 13px;">
              This role can access all programmes unless another assigned role applies a limit.
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="Review" name="review">
          <div style="margin: 24px 0;">
            <div v-if="selectedPermissions.length === 0" style="color: #f56c6c;">No permissions selected.</div>
            <div v-else>
              <div v-for="broadGroup in groupedPermissionOptions" :key="broadGroup.label">
                <template v-if="getSelectedPermissionsForGroup(broadGroup).length">
                  <div class="permission-review-broad">{{ broadGroup.label }}</div>
                  <div
                    v-for="entityGroup in broadGroup.entities"
                    :key="entityGroup.entityKey"
                  >
                    <template v-if="getSelectedPermissionsForGroup(entityGroup).length">
                      <div
                        v-if="broadGroup.entities.length > 1 || entityGroup.label !== broadGroup.label"
                        class="permission-review-entity"
                      >
                        {{ entityGroup.label }}
                      </div>
                      <ul class="permission-review-list">
                        <li
                          v-for="perm in getSelectedPermissionsForGroup(entityGroup)"
                          :key="perm.id"
                          class="permission-review-item"
                        >
                          <el-icon style="color: #67c23a;"><Check /></el-icon>
                          <span>{{ perm.description || perm.name }}</span>
                        </li>
                      </ul>
                    </template>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 12px; padding: 8px 0; border-top: 1px solid #f0f0f0; background: #fafbfc;">
          <el-button @click="AddDialogVisible = false">Cancel</el-button>
          <el-button v-if="activeTab === 'details'" type="primary" class="step-btn-next" :icon="ArrowRight" @click="activeTab = 'permissions'">
            Next
          </el-button>
          <el-button v-if="activeTab === 'permissions'" type="primary" class="step-btn-next" :icon="ArrowRight" @click="activeTab = 'programmes'">
            Next
          </el-button>
          <el-button v-if="activeTab === 'programmes'" type="primary" class="step-btn-next" :icon="ArrowRight" @click="activeTab = 'review'">
            Next
          </el-button>
          <el-button v-if="activeTab === 'review'" :icon="ArrowLeft" @click="activeTab = 'programmes'">Back</el-button>
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

  .step-btn-next {
    flex-direction: row-reverse;
    gap: 6px;
  }

  .step-btn-next :deep(.el-icon + span) {
    margin-left: 0;
  }

  .roles-toolbar-actions {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
    margin-left: auto;
  }

  :deep(.roles-actions-col .cell) {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .roles-actions-cell {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
  }

  /* Adjust the space as needed */
  .button-space {
    width: 10px; /* You can change this value to adjust the space */
  }

  .role-drawer .el-drawer__body {
    padding: 0 32px 16px 32px;
  }

  .permission-broad-title {
    font-weight: 600;
  }

  .permission-group-meta {
    margin-left: 8px;
    color: #909399;
    font-size: 12px;
    font-weight: normal;
  }

  .permission-entity-group + .permission-entity-group {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #f0f2f5;
  }

  .permission-entity-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .permission-entity-title {
    font-weight: 500;
    color: #606266;
  }

  .permission-checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-left: 4px;
  }

  .permission-review-broad {
    font-weight: 600;
    margin-top: 16px;
    color: #303133;
  }

  .permission-review-entity {
    font-weight: 500;
    margin: 8px 0 4px 12px;
    color: #606266;
  }

  .permission-review-list {
    margin: 0 0 8px 0;
    padding-left: 28px;
  }

  .permission-review-item {
    list-style: none;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }
</style>
