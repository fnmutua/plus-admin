<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { getUserRoles } from '@/api/users'
import PermissionWrapper from '@/components/PermissionWrapper.vue';

import {
  ElButton, ElSwitch, ElSelect, ElDialog, ElDropdown, ElDropdownItem, ElMessage,
  ElFormItem, ElForm, ElInput, ElTable, ElTableColumn, ElRow, ElPagination, ElTooltip, ElOption, ElCard, ElCol,
  ElDatePicker,
  ElTag,
} from 'element-plus'
import {
  Position,
  Edit,
  Back,
  Plus,
  InfoFilled,
  SwitchButton
} from '@element-plus/icons-vue'

import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getAssignableLocationOptions } from '@/utils/userRoleLocationOptions'
import { activateUserApi, updateUserApi, getSuperAdminStaff, resetUserPassword, forceLogoutUserApi } from '@/api/users'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import {
  disableRoleExpiryDatesBeforeToday,
  disableRoleExpiryHours,
  disableRoleExpiryMinutes,
  disableRoleExpirySeconds,
} from '@/utils/roleExpiryPickerConstraints'
import {
  isUserAccessFullyExpired,
  userListRowAccessClassName,
} from '@/utils/userAccessExpiryDisplay'
import DownloadCustom from '@/views/Components/DownloadCustom.vue';
import UserTableActions from '@/views/Components/UserTableActions.vue';
import { useAdjustableTableColumns } from '@/composables/useAdjustableTableColumns'
import { userTableColumnPresets } from '@/constants/userTableColumnPresets'
import AdjustableTableColumnPicker from '@/components/Users/AdjustableTableColumnPicker.vue'
import UserListAdjustableColumns from '@/components/Users/UserListAdjustableColumns.vue'
import UserListCardToolbar from '@/components/Users/UserListCardToolbar.vue'

interface Params {
  pageIndex?: number
  xpageSize?: number
}

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const isMobile = computed(() => appStore.getMobile)

console.log('IsMobile', isMobile)

const dialogWidth = ref(isMobile.value ? '90%' : '60vw')
const actionColumnWidth = computed(() => (isMobile.value ? '80px' : '100px'))

const currentUser = wsCache.get(appStore.getUserInfo)

const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)

// Check if current user can edit email (national admin, super admin, or root admin at county/national levels)
const canEditEmail = computed(() => {
  return currentUser?.roles?.some((role: any) => {
    // Super admin or root admin
    if (['super_admin', 'root_admin'].includes(role.name)) {
      return true
    }
    // National admin (admin role at national level)
    if (role.name === 'admin' && role.user_roles?.location_level === 'national') {
      return true
    }
    // County admin (admin role at county level)
    if (role.name === 'admin' && role.user_roles?.location_level === 'county') {
      return true
    }
    return false
  }) || false
})

const isRootAdmin = computed(() =>
  currentUser?.roles?.some((role: any) => role.name === 'root_admin') || false
)

// Root admins manage all super admins without county scoping
const isCountyRestricted = computed(() => false)

const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
const countiesOptions = ref([])
const RolesOptions = ref([])
const FilteredRolesOptions = ref([])
const AvailableRolesOptions = ref([])
const superAdminRoleId = ref<number | null>(null)

const settlementOptions = ref([])

const settlements = ref([])
const filteredSettlements = ref([])
const page = ref(1)
const selCounties = []
const loading = ref(true)
const currentPage = ref(1)
const total = ref(0)
 
const tmp_roles = ref([])

// Add loading state for individual user actions
const userLoadingStates = ref<Record<string, boolean>>({})

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

  if (!isRootAdmin.value) {
    ElMessage.error('Only root administrators can manage super admins')
    push({ path: '/users/all', name: 'staff' })
  }
})

const downloadLoading = ref(false)

const dialogFormVisible = ref(false)
const editUserForm = ref()
const formLabelWidth = '100px'

let tableDataList = ref<any[]>([])
let tableDataList_orig = ref<any[]>([])

//// ------------------parameters -----------------------////
var filters: string[] = []
var filterValues: any[] = []

const associated_multiple_models = ['county', 'user_roles']

const nested_models = ['user_roles', 'roles'] // The mother, then followed by the child
const nested_filter = ['id', [9]] //   column and value of the grandchild. In this case roles. 9=Support 

const model = 'users'
const searchString = ref()

//// ------------------parameters -----------------------////
const form = ref({
  id: '',
  name: '',
  email: '',
  phone: '',
  settlement_id: null,
  county_id: null,
  location_level: null,
  location_id: null,
  roles: [],
  avatar: '',
  username: null
})

const {
  showColumnPicker,
  isColumnVisible,
  columnWidth,
  columnMinWidth,
  hideableColumns,
  visibleColumnKeys,
  onHeaderDragend,
  resetColumns,
} = useAdjustableTableColumns('superAdminUsersTableColumns', userTableColumnPresets.minimal)

const { t } = useI18n()

const handleClear = async () => {
  console.log('cleared....')

  // clear all the fileters -------
  filterValues = []
  filters = []
  value1.value = ''
  value2.value = ''
  value3.value = ''
  pageSize.value = 5
  currentPage.value = 1
  //----run the get data--------
  getInterventionsAll()
}

const handleSelectCounty = async (county_id: any) => {
  var selectOption = 'county_id'
  if (!filters.includes(selectOption)) {
    filters.push(selectOption)
  }
  var index = filters.indexOf(selectOption) // 1
  console.log('county : index--->', index)

  // clear previously selected
  if (filterValues[index]) {
    // filterValues[index].length = 0
    filterValues.splice(index, 1)
  }

  if (!filterValues.includes(county_id) && county_id.length > 0) {
    filterValues.splice(index, 0, county_id) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
  }

  // expunge the filter if the filter values are null
  if (county_id.length === 0) {
    filters.splice(index, 1)
  }

  console.log('FilterValues:', filterValues)
  // here we filter the list of settlements based on the selected county
  filteredSettlements.value = settlements.value.filter(
    (settlement: any) => settlement.county_id == county_id
  )
  console.log('filyterested settlements------>', filteredSettlements)
  makeSettlementOptions(filteredSettlements)

  getFilteredData(filters, filterValues)
}

const onPageChange = async (selPage: any) => {
  console.log('on change change: selected counties ', selCounties)
  page.value = selPage

  await getFilteredData(filters, filterValues)
}

const onPageSizeChange = async (size: any) => {
  pageSize.value = size
  page.value = 1
  currentPage.value = 1
  await getFilteredData(filters, filterValues)
}

const getInterventionsAll = async () => {
  getFilteredData(filters, filterValues)
}

const destructure = (obj: any) => {
  // console.log('deconstructing......')
  const simpleObj: any = {}
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

    ret.forEach(function (arrayItem: { id: string; name: string }) {
      var countyOpt: any = {}
      countyOpt.value = arrayItem.id
      countyOpt.label = arrayItem.name  
      //  console.log(countyOpt)
      countiesOptions.value.push(countyOpt)
    })
  })
}

const getRoles = async () => {
  const formData: any = {}
  formData.limit = 100
  formData.page = page.value
  formData.curUser = 1
  formData.model = 'roles'
  formData.currentUser = currentUser

  const res = await getUserRoles(formData)

  RolesOptions.value = []
  FilteredRolesOptions.value = []
  AvailableRolesOptions.value = []

  res.data.forEach(function (arrayItem: any) {
    if (arrayItem.name === 'root_admin') {
      return
    }

    const opt = {
      value: arrayItem.id,
      label: arrayItem.name,
    }

    RolesOptions.value.push(opt)
    FilteredRolesOptions.value.push(opt)
    AvailableRolesOptions.value.push(opt)

    if (arrayItem.name === 'super_admin') {
      superAdminRoleId.value = arrayItem.id
    }
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

    // pass result to the makeoptions

    settlements.value = ret
    makeSettlementOptions(settlements)
  })
}

const makeSettlementOptions = (list: any) => {
  console.log('making the options..............', list)
  settlementOptions.value = []
  list.value.forEach(function (arrayItem: { id: string; name: string }) {
    var countyOpt: any = {}
    countyOpt.value = arrayItem.id
    countyOpt.label = arrayItem.name  
    //  console.log(countyOpt)
    settlementOptions.value.push(countyOpt)
  })
}

const activateDeactivate = async (data: any) => {
  const userId = data.row.id
  data.row.isactive = !data.row.isactive
  
  // Check if user has permission to activate/deactivate
  const currentUserInfo = wsCache.get(appStore.getUserInfo)
  const userPermissions = currentUserInfo && currentUserInfo.permissions ? currentUserInfo.permissions : []
  
  if (!userPermissions.includes('user:activate')) {
    ElMessage.error('You do not have permission to activate/deactivate users')
    return
  }
  
  // Set loading state for this specific user
  userLoadingStates.value[userId] = true
  
  try {
    console.log('Activating user.....', data.row)
    await activateUserApi(data.row, { model: 'users' })
    ElMessage.success('User status updated successfully')
  } catch (error) {
    console.error('Error updating user status:', error)
    ElMessage.error('Failed to update user status')
    // Revert the switch state on error
    data.row.isactive = !data.row.isactive
  } finally {
    // Clear loading state for this user
    userLoadingStates.value[userId] = false
  }
}

const handleForceLogout = async (data: any) => {
  try {
    await forceLogoutUserApi(data.row.id)
    ElMessage.success(`${data.row.username} has been forcefully logged out.`)
  } catch (error) {
    ElMessage.error('Failed to force logout user.')
  }
}

let userRequestId = 0
const getFilteredData = async (selFilters: any, selfilterValues: any) => {
  const requestId = ++userRequestId
  loading.value = true
  const formData: any = {}
  formData.limit = pageSize.value
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  formData.searchString = searchString.value || ''
  //--Single Filter -----------------------------------------

  //formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = selFilters
  formData.filterValues = selfilterValues
  formData.associated_multiple_models = associated_multiple_models
  //formData.nested_models = nested_models
  //formData.nested_filter = nested_filter
  formData.currentUser = currentUser

  //-------------------------
  try {
    const res = await getSuperAdminStaff(formData)
    if (requestId !== userRequestId) return
    tableDataList.value = res.data
    tableDataList_orig.value = res.data
    total.value = res.total
  } catch (error: any) {
    if (requestId === userRequestId) ElMessage.error(error.response?.data?.message || 'Failed to load super admins')
  } finally {
    if (requestId === userRequestId) loading.value = false
  }
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
const searchByName = (filterString: any) => {
  searchString.value = filterString
  page.value = 1
  currentPage.value = 1

  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => getFilteredData(filters, filterValues), 300)
}

getRoles()
getCountyNames()
getSettlementsOptions()
getInterventionsAll()

const AddUser = (data: any) => {
  ElMessage.warning("Coming soon...")
  // push({
  //   path: '/data/settlement/add',
  //   name: 'AddUser'
  // })
}

const EditUser = async (data: any) => {
  console.log(data)

  tmp_roles.value = []
  form.value.id = data.row.id
  form.value.name = data.row.name
  form.value.county_id = data.row.county_id
  form.value.email = data.row.email
  form.value.phone = data.row.phone
  form.value.avatar = data.row.avatar
  form.value.username = data.row.username

  data.row.user_roles.forEach(async function (userRole: any) {
    console.log("User's Role", userRole);

    await handleChangeLevel(userRole.location_level);

    if (userRole.county_id) {
      console.log("Get Settlements for this county", userRole.county_id);
      await getCountySettlements(parseInt(userRole.county_id, 10));
      userRole.county_id = parseInt(userRole.county_id, 10);
    }

    if (userRole.settlement_id) {
      userRole.settlement_id = parseInt(userRole.settlement_id, 10);
    }

    tmp_roles.value.push(userRole);
});

  console.log('tmp_roles>>>>', tmp_roles.value)

  console.log(form)
  dialogFormVisible.value = true
}

const search = ref('')

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

const availableLocationOptions = computed(() =>
  getAssignableLocationOptions(isCountyRestricted.value)
)

const showSettlement = ref(false)
const showCounty = ref(false)
const handleSelectLevel = async (level: any) => {
  console.log('Level', level)
  if (level == 'settlement') {
    showSettlement.value = true
    showCounty.value = true
  }
  else if (level == 'county') {
    showSettlement.value = false
    showCounty.value = true
  }
  else {
    showSettlement.value = false
    showCounty.value = false
  }
}

const isNationalLevel = ref(false)
const isCountyLevel = ref(false)
const isSettlementLevel = ref(false)

const getCountySettlements = async (county_id: any) => {
  settlementOptions.value = []
  
  // If no county is selected or "Not Applicable" (0), don't search
  if (!county_id || county_id === 0) {
    return
  }
  
  const formData: any = {}
  // formData.limit = pageSize.value
  // formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = 'settlement'
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  //formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = ['county_id']
  formData.filterValues = [[county_id]]
  formData.associated_multiple_models = []
  //formData.nested_models = nested_models
  //formData.nested_filter = nested_filter
  formData.currentUser = currentUser

  //-------------------------
  const res = await getSettlementListByCounty(formData)

  res.data.forEach(function (arrayItem: any) {
    var opt: any = {}
    opt.value = arrayItem.id
    opt.label = arrayItem.name  
    settlementOptions.value.push(opt)
  })
}

const handleChangeLevel = async (level: any) => {
  console.log(level)

  if (level == 'national') {
    isNationalLevel.value = true
    isCountyLevel.value = false
    isSettlementLevel.value = false
  }
  else if (level == 'county') {
    isNationalLevel.value = false
    isCountyLevel.value = true
    isSettlementLevel.value = false
  }
  else {
    isSettlementLevel.value = true
    isCountyLevel.value = true
    isNationalLevel.value = false
  }
}

const addRole = () => {
  const this_role = {
    userid: form.value.id,
    roleid: null,
    location_level: 'national',
    county_id: null,
    settlement_id: null,
    expires_at: null,
  }

  handleChangeLevel('national')
  tmp_roles.value.push(this_role);
}

const removeRole = (index: number) => {
  // Remove the role object at the specified index from the roles array
  tmp_roles.value.splice(index, 1);
}

const validateForm = () => {
  let isValid = true;
  const rootAdminRoleId = RolesOptions.value.find((role: any) => role.label === 'root_admin')?.value

  tmp_roles.value.forEach((role: any) => {
    if (rootAdminRoleId != null && Number(role.roleid) === Number(rootAdminRoleId)) {
      ElMessage.error('Root admin role cannot be assigned from this page.')
      isValid = false
    }

    if (role.location_level === "national") {
      // For national level, nullify county_id and settlement_id
      role.county_id = null;
      role.settlement_id = null;
    } else if (role.location_level === "county") {
      // For county level, settlement_id should be null
      role.settlement_id = null;

      // Enforce requirement that county_id must be provided
      if (!role.county_id) {
        console.error('Error: county_id is required for county-level roles.');
        isValid = false;
      }
    } else if (role.location_level === "settlement") {
      // Enforce requirement that both county_id and settlement_id must be provided
      if (!role.county_id) {
        console.error('Error: county_id is required for settlement-level roles.');
        isValid = false;
      }
      if (!role.settlement_id) {
        console.error('Error: settlement_id is required for settlement-level roles.');
        isValid = false;
      }
    }
  });

  return isValid; // Return whether the form is valid or not
};

const userStillHasSuperAdminRole = (user: any) => {
  if (!user?.user_roles?.length || superAdminRoleId.value == null) {
    return false
  }

  return user.user_roles.some(
    (role: any) =>
      Number(role.roleid) === Number(superAdminRoleId.value) ||
      role.role?.name === 'super_admin'
  )
}

const updateUser = () => {
  const isValid = validateForm();

  if (isValid) {
    const originalUser = tableDataList.value.find((u: any) => u.id === form.value.id);
    if (originalUser && (form.value.phone === undefined || form.value.phone === null)) {
      form.value.phone = originalUser.phone || '';
    }

    form.value.roles = tmp_roles.value.map((r: any) => ({
      ...r,
      expires_at: r.expires_at ? r.expires_at : null,
    }))

    updateUserApi(form.value).then((response: any) => {
      const index = tableDataList.value.findIndex((item: any) => item.id === response.user.id);

      if (userStillHasSuperAdminRole(response.user)) {
        if (index !== -1) {
          tableDataList.value[index] = response.user
        }
        ElMessage.success('Super admin updated successfully')
      } else {
        if (index !== -1) {
          tableDataList.value.splice(index, 1)
          total.value = Math.max(0, total.value - 1)
        }
        ElMessage.success('User demoted from super admin')
      }
    }).catch(() => {
      ElMessage.error('Failed to update user roles')
    })

    dialogFormVisible.value = false
  } else {
    ElMessage.error("Please fill out the required fields correctly.")
  }
}

// Row-level password reset
const resetPasswordLoadingStates = reactive<Record<number, boolean>>({})

const handleRowPasswordReset = async (row: { id: number; email?: string; phone?: string; name?: string }) => {
  if (!row.email && !row.phone) {
    ElMessage.warning(`${row.name || 'User'} has no email or phone on file. Cannot send reset instructions.`)
    return
  }
  try {
    resetPasswordLoadingStates[row.id] = true
    const payload = row.email ? { email: row.email } : { phone: row.phone }
    await resetUserPassword(payload)
    ElMessage.success(`Password reset instructions sent to ${row.name || 'user'}`)
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || 'Failed to send reset instructions')
  } finally {
    resetPasswordLoadingStates[row.id] = false
  }
}

</script>

<template>
  <el-card>
    <UserListCardToolbar>
      <template #filters>
        <el-button type="primary" plain :icon="Back" @click="goBack" class="users-toolbar__back">
          Back
        </el-button>

        <el-select
          v-model="value2"
          @change="handleSelectCounty"
          @clear="handleClear"
          multiple
          clearable
          filterable
          collapse-tags
          placeholder="Filter by County"
        >
          <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>

        <el-select
          v-model="value3"
          multiple
          clearable
          filterable
          remote
          :remote-method="searchByName"
          reserve-keyword
          placeholder="Search by name, username, email or phone"
        />
      </template>

      <template #actions>
        <PermissionWrapper :permissions="['user:create']">
          <el-tooltip content="Add User" placement="top">
            <el-button @click="AddUser" type="primary" :icon="Plus" />
          </el-tooltip>
        </PermissionWrapper>

        <PermissionWrapper :permissions="['user:download']">
          <DownloadCustom
            :data="tableDataList"
            :model="model"
            :associated_models="associated_multiple_models"
            :loading="downloadLoading"
            :filters="filters"
            :filter-values="filterValues"
            :total="total"
            :search-keyword="searchString"
            @download-start="downloadLoading = true"
            @download-end="downloadLoading = false"
          />
        </PermissionWrapper>

        <AdjustableTableColumnPicker
          v-model:show-column-picker="showColumnPicker"
          v-model:visible-column-keys="visibleColumnKeys"
          :hideable-columns="hideableColumns"
          @reset="resetColumns"
        />
      </template>
    </UserListCardToolbar>

    <el-table
      :data="tableDataList"
      style="width: 100% ; margin-top: 30px"
      border
      v-loading="loading"
      :row-class-name="userListRowAccessClassName"
      @header-dragend="onHeaderDragend"
    >
      <UserListAdjustableColumns
        id-label="User ID"
        :is-column-visible="isColumnVisible"
        :column-width="columnWidth"
        :column-min-width="columnMinWidth"
      />

      <el-table-column v-if="!isCountyRestricted" fixed="right" :label="isMobile ? '' : 'Operations'" :width="actionColumnWidth">
        <template #default="scope">
          <UserTableActions
            :row="scope.row"
            :show-admin-buttons="showAdminButtons"
            :activate-loading="userLoadingStates[scope.row.id]"
            :reset-password-loading="resetPasswordLoadingStates[scope.row.id]"
            @activate="activateDeactivate(scope as TableSlotDefault)"
            @edit="EditUser(scope as TableSlotDefault)"
            @force-logout="handleForceLogout(scope as TableSlotDefault)"
            @reset-password="handleRowPasswordReset(scope.row)"
          />
        </template>
      </el-table-column>
    </el-table>

    <ElPagination
      :layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'" 
      v-model:currentPage="currentPage"
      v-model:page-size="pageSize" 
      :page-sizes="[5, 10, 20, 50, 100]" 
      :total="total" 
      :background="true"
      @size-change="onPageSizeChange" 
      @current-change="onPageChange" 
      class="mt-4"
      :small="isMobile"
      :pager-count="isMobile ? 3 : 7" />

    <el-dialog draggable v-model="dialogFormVisible" title="User Details" :width="dialogWidth">
      <el-form :model="form">
        <el-row>
          <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
            <el-form-item label="Name" :label-width="formLabelWidth">
              <el-input v-model="form.name" autocomplete="off" />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
            <el-form-item label="Email" :label-width="formLabelWidth">
              <el-input 
                v-model="form.email" 
                autocomplete="off" 
                :disabled="!canEditEmail"
                type="email" />
              <el-tooltip v-if="!canEditEmail" content="Only national admins, super admins, and root admins can edit email addresses" placement="top">
                <el-icon style="margin-left: 5px; color: #909399; cursor: help;"><InfoFilled /></el-icon>
              </el-tooltip>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
            <el-form-item label="Username" :label-width="formLabelWidth">
              <el-input v-model="form.username" autocomplete="off" disabled />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
            <el-form-item label="Phone" :label-width="formLabelWidth">
              <el-input v-model="form.phone" autocomplete="off" />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
            <el-form-item label="County" :label-width="formLabelWidth">
              <el-select
                v-model="form.county_id"
                placeholder="Select County"
                clearable
                filterable
                :style="{ width: '100%' }">
                <el-option :value="0" label="Not Applicable" />
                <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- Table for roles management -->
        <div :style="{ overflowX: 'auto', width: '100%' }">
        <el-table :data="tmp_roles" style="width: 100%; min-width: 780px" size="small">
          <el-table-column prop="role" label="Role">
            <template #default="{ row }">
              <el-select
                v-model="row.roleid" 
                placeholder="Select Role" 
                size="small" 
                style="width:80%" 
                searchable
                filterable>
                <el-option
                  v-for="item in AvailableRolesOptions.length > 0 ? AvailableRolesOptions : FilteredRolesOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="level" label="Level">
            <template #default="{ row }">
              <el-select
                v-model="row.location_level" 
                placeholder="Select level" 
                size="small" 
                filterable
                @change="handleChangeLevel(row.location_level)" 
                style="width:80%">
                <el-option v-for="item in availableLocationOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </template>
          </el-table-column>

          <el-table-column prop="county_id" label="County">
            <template #default="{ row }">
              <el-select
                v-model="row.county_id" 
                placeholder="County" 
                clearable 
                :disabled="isNationalLevel" 
                filterable
                @change="getCountySettlements(row.county_id)" 
                size="small" 
                style="width:80%">
                <el-option :value="0" label="Not Applicable" />
                <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </template>
          </el-table-column>

          <el-table-column prop="settlement_id" label="Settlement">
            <template #default="{ row }">
              <el-select
                v-model="row.settlement_id" 
                placeholder="Settlement" 
                size="small"
                :disabled="!isSettlementLevel" 
                style="width:80%" 
                filterable 
                clearable>
                <el-option
                  v-for="item in settlementOptions" 
                  :key="item.value" 
                  :label="item.label"
                  :value="item.value" />
              </el-select>
            </template>
          </el-table-column>

          <el-table-column prop="expires_at" label="Access expires" :width="isMobile ? 170 : 220">
            <template #default="{ row }">
              <el-date-picker
                v-model="row.expires_at"
                type="datetime"
                placeholder="No expiry"
                clearable
                style="width: 100%"
                size="small"
                :disabled-date="disableRoleExpiryDatesBeforeToday"
                :disabled-hours="disableRoleExpiryHours"
                :disabled-minutes="disableRoleExpiryMinutes"
                :disabled-seconds="disableRoleExpirySeconds"
              />
            </template>
          </el-table-column>

          <el-table-column label="Actions">
            <template #default="{ $index }">
              <el-button @click="removeRole($index)" type="danger" size="small">Remove</el-button>
            </template>
          </el-table-column>
        </el-table>
        </div>

        <el-button @click="addRole" type="primary" style="margin-top: 10px;">Add Role</el-button>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogFormVisible = false">Cancel</el-button>
          <PermissionWrapper :permissions="['user:update']">
            <el-button type="primary" @click="updateUser">Confirm</el-button>
          </PermissionWrapper>
        </span>
      </template>
    </el-dialog>
  </el-card>
</template>

<style scoped>
.el-button--text {
  margin-right: 15px;
}

.el-select {
  width: 300px;
}

.el-input {
  width: 300px;
}

.dialog-footer button:first-child {
  margin-right: 10px;
}

.center-avatar {
  display: flex;
  justify-content: center;
}

.my-switch {
  margin-right: 0;
}

.operations-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.name-with-access-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

:deep(.el-table__body tr.user-list-row-access-expired > td) {
  color: var(--el-text-color-secondary);
}
</style>
