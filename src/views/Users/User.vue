<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { getSettlementListByCounty, searchByKeyWord } from '@/api/settlements'
import { getUserRoles } from '@/api/users'
import { getCountyListApi } from '@/api/counties'
import PermissionWrapper from '@/components/PermissionWrapper.vue';
import DownloadCustom from '@/views/Components/DownloadCustom.vue';
import UserTableActions from '@/views/Components/UserTableActions.vue';

import {
  ElButton, ElSwitch, ElSelect, ElDialog, ElDropdown, ElDropdownItem, ElMessage,ElDivider,
  ElFormItem, ElForm, ElInput, ElTable, ElTableColumn, ElRow, ElPagination, ElTooltip, ElOption, ElCard, ElCol, ElIcon, ElTag,
  ElDatePicker, ElPopover, ElCheckbox, ElCheckboxGroup,
} from 'element-plus'
import {
  Position,
  Edit,
  Back,
  Plus,
  ArrowDown,
  InfoFilled,
  SwitchButton,
} from '@element-plus/icons-vue'

import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getAssignableLocationOptions } from '@/utils/userRoleLocationOptions'
import { activateUserApi, updateUserApi, getCountyStaff, resetUserPassword, forceLogoutUserApi } from '@/api/users'
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
import { useAdjustableTableColumns } from '@/composables/useAdjustableTableColumns'
import { userTableColumnPresets } from '@/constants/userTableColumnPresets'
import AdjustableTableColumnPicker from '@/components/Users/AdjustableTableColumnPicker.vue'
import UserListAdjustableColumns from '@/components/Users/UserListAdjustableColumns.vue'
import UserListCardToolbar from '@/components/Users/UserListCardToolbar.vue'


const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const isMobile = computed(() => appStore.getMobile)

console.log('IsMobile', isMobile)

const dialogWidth = ref(isMobile.value ? '90%' : '60vw')
const actionColumnWidth = computed(() => (isMobile.value ? '80px' : '100px'))



const currentUser = wsCache.get(appStore.getUserInfo)

const showAdminButtons = ref(appStore.getAdminButtons)

// County Admin Detection
const isSuperAdmin = computed(() => {
  return currentUser?.roles?.some((role: any) => 
    ['super_admin', 'root_admin'].includes(role.name) ||
    (role.name === 'admin' && role.user_roles?.location_level === 'national')
  ) || false
})

// Check if user has admin role with county location level
const isCountyAdmin = computed(() => {
  return currentUser?.roles?.some((role: any) => 
    ['admin', 'staff'].includes(role.name) && 
    role.user_roles?.location_level === 'county'
  ) || false
})

const userCountyRole = computed(() => {
  return currentUser?.roles?.find((role: any) => 
    role.user_roles?.location_level === 'county'
  )
})

const userCountyId = computed(() => {
  return userCountyRole.value?.user_roles?.county_id || null
})

// Check if user should be restricted to their county
// County admins are users with admin/staff role at county level (not super_admin or national admin)
const isCountyRestricted = computed(() => {
  return isCountyAdmin.value && !!userCountyId.value
})

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



const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
const countiesOptions = ref([])
const RolesOptions = ref([])
const FilteredRolesOptions = ref([])
const AvailableRolesOptions = ref([]) // Roles that can be assigned (subordinate roles)


const settlementOptions = ref([])

const settlements = ref([])
const filteredSettlements = ref([])
const settlementSearchLoading = ref(false)
const page = ref(1)
const selCounties = []
const loading = ref(true)
const currentPage = ref(1)
const total = ref(0)
const downloadLoading = ref(false)

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
})




const dialogFormVisible = ref(false)
const formLabelWidth = computed(() => isMobile.value ? '90px' : '100px')


let tableDataList = ref<UserType[]>([])
let tableDataList_orig = ref<UserType[]>([])

//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var filterValues = []

const associated_multiple_models = ['county', 'user_roles']

////const nested_models = ['user_roles', 'roles'] // The mother, then followed by the child
//const nested_filter = ['id', [6, 7, 8]] //   column and value of the grandchild. In this case roles. 5=county Admin 


const model = 'users'
const searchString = ref()


//// ------------------parameters -----------------------////
const accessReasonLabels: Record<string, string> = {
  research: 'Research',
  journalism: 'Journalism',
  ngo_cso: 'NGO / CSO Work',
  academic: 'Academic Study',
  government: 'Government / Public Sector',
  personal: 'Personal Interest',
  other: 'Other'
}

const {
  showColumnPicker,
  isColumnVisible,
  columnWidth,
  columnMinWidth,
  hideableColumns,
  visibleColumnKeys,
  onHeaderDragend,
  resetColumns,
} = useAdjustableTableColumns('usersTableColumns', userTableColumnPresets.full)

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
  username: null,
  organization_name: '',
  access_reason: '',
  data_use_description: ''
})


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
  
  // If county admin, re-apply their county filter
  if (isCountyRestricted.value && userCountyId.value) {
    handleSelectCounty([userCountyId.value])
  } else {
    //----run the get data--------
    getInterventionsAll()
  }
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
    (settlement) => settlement.county_id == county_id
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



    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var countyOpt = {}
      countyOpt.value = arrayItem.id
      countyOpt.label = arrayItem.name  
      //  console.log(countyOpt)
      countiesOptions.value.push(countyOpt)
    })
  })
}



const getRoles = async () => {

  const formData = {}
  formData.limit = 100
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = 'roles'
  //-Search field--------------------------------------------

  formData.currentUser = currentUser

  console.log('currentUser', currentUser)
  //-------------------------
  const res = await getUserRoles(formData)

  console.log('Get Roles.....', res.data)

  // Get all roles for display
  res.data.forEach(function (arrayItem) {
    //  generate the filter options
    var opt = {}
    opt.value = arrayItem.id
    opt.label = arrayItem.name
    //  console.log(countyOpt)
    RolesOptions.value.push(opt)
    FilteredRolesOptions.value.push(opt)
  })

  // Get subordinate roles (roles that can be assigned by current user)
  // This is already filtered by the backend API endpoint
  AvailableRolesOptions.value = res.data.map((arrayItem: any) => ({
    value: arrayItem.id,
    label: arrayItem.name
  }))

  console.log('RolesOptions', RolesOptions)
  console.log('AvailableRolesOptions (subordinate roles)', AvailableRolesOptions)
}

const getSettlementsOptions = async () => {
}


const makeSettlementOptions = (list) => {
  console.log('making the options..............', list)
  settlementOptions.value = []
  list.value.forEach(function (arrayItem: { id: string; type: string }) {
    var countyOpt = {}
    countyOpt.value = arrayItem.id
    countyOpt.label = arrayItem.name  
    //  console.log(countyOpt)
    settlementOptions.value.push(countyOpt)
  })
}

const activateDeactivate = async (data: TableSlotDefault) => {
  const userId = data.row.id
  data.row.isactive = !data.row.isactive
  
  // Check if user has permission to activate/deactivate
  const currentUserInfo = wsCache.get(appStore.getUserInfo)
  const userPermissions = currentUserInfo && currentUserInfo.permissions ? currentUserInfo.permissions : []
  
  if (!userPermissions.includes('user:activate')) {
    ElMessage.error('You do not have permission to activate/deactivate users')
    return
  }
  
  // If county admin, validate that the user belongs to their county
  if (isCountyRestricted.value && userCountyId.value) {
    const userCountyIdFromRow = data.row.county_id || data.row.county?.id
    if (userCountyIdFromRow && userCountyIdFromRow !== userCountyId.value) {
      ElMessage.error('You can only activate/deactivate users within your county.')
      // Revert the switch state
      data.row.isactive = !data.row.isactive
      return
    }
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

const handleForceLogout = async (data: TableSlotDefault) => {
  try {
    await forceLogoutUserApi(data.row.id)
    ElMessage.success(`${data.row.username} has been forcefully logged out.`)
  } catch (error) {
    ElMessage.error('Failed to force logout user.')
  }
}

let userRequestId = 0
const getFilteredData = async (selFilters, selfilterValues) => {
  const requestId = ++userRequestId
  loading.value = true
  const formData = {}
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
    const res = await getCountyStaff(formData)
    if (requestId !== userRequestId) return
    tableDataList.value = res.data
    tableDataList_orig.value = res.data
    total.value = res.total
  } catch (error: any) {
    if (requestId === userRequestId) ElMessage.error(error.response?.data?.message || 'Failed to load users')
  } finally {
    if (requestId === userRequestId) loading.value = false
  }
}

// Format date for display
const formatDate = (dateString: string | Date | null) => {
  if (!dateString) return null
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return null
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return null
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

// Initialize county admin restrictions
const initializeCountyAdminRestrictions = async () => {
  await getRoles()
  await getCountyNames()
  await getSettlementsOptions()
  
  // If county admin, auto-filter by their county
  if (isCountyRestricted.value && userCountyId.value) {
    console.log('County Admin detected, auto-filtering by county:', userCountyId.value)
    // Set the county filter
    value2.value = [userCountyId.value]
    handleSelectCounty([userCountyId.value])
  } else {
    getInterventionsAll()
  }
}

initializeCountyAdminRestrictions()



const AddUser = () => {

  ElMessage.warning("Coming soon...")
  // push({
  //   path: '/data/settlement/add',
  //   name: 'AddUser'
  // })
}



const EditUser = async (data: TableSlotDefault) => {
  console.log(data)

  // If county admin, validate that the user belongs to their county
  if (isCountyRestricted.value && userCountyId.value) {
    const userCountyIdFromRow = data.row.county_id || data.row.county?.id
    if (userCountyIdFromRow && userCountyIdFromRow !== userCountyId.value) {
      ElMessage.error('You can only manage users within your county.')
      return
    }
  }

  tmp_roles.value = []
  form.value.id = data.row.id
  form.value.name = data.row.name
  form.value.county_id = data.row.county_id
  form.value.email = data.row.email
  form.value.phone = data.row.phone
  form.value.avatar = data.row.avatar
  form.value.username = data.row.username
  form.value.organization_name = data.row.organization_name || ''
  form.value.access_reason = data.row.access_reason || ''
  form.value.data_use_description = data.row.data_use_description || ''

  data.row.user_roles.forEach(async function (userRole) {
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

const isNationalLevel = ref(false)
const isCountyLevel = ref(false)
const isSettlementLevel = ref(false)

// Remote search method for settlements - fetches on demand (based on Document.vue implementation)
const searchSettlements = async (keyword = '', countyId = null) => {
  // Use provided countyId or get from current context
  const targetCountyId = countyId || (value2.value && value2.value.length > 0 ? value2.value[0] : null)
  
  // If no county is selected, don't search
  if (!targetCountyId) {
    settlementOptions.value = []
    return
  }
  
  settlementSearchLoading.value = true
  
  try {
    const formData = {
      curUser: 1,
      model: 'settlement',
      searchField: 'name',
      searchKeyword: keyword,
      excludeGeom: false,
      excludeGeomAssoc: true,
      associated_multiple_models: ['county', 'subcounty', 'ward'],
      filters: ['county_id'],
      filterValues: [[targetCountyId]],
      currentUser: currentUser
    }

    const response = await searchByKeyWord(formData)
    
    if (!response.data || response.data.length === 0) {
      settlementOptions.value = []
      return
    }

    console.log('Settlement search response.data:', response.data)
    
    settlementOptions.value = response.data.map((item: any) => ({
      value: item.id,
      label: item.name || 'Unknown',
      county: item.county?.name,
      subcounty: item.subcounty?.name,
      ward: item.ward?.name,
    }))
    
    console.log('Settlement options updated:', settlementOptions.value.length, 'options')
  } catch (error) {
    console.error('Error searching settlements:', error)
    ElMessage.error((error as Error).message || 'Failed to load settlements')
    settlementOptions.value = []
  } finally {
    settlementSearchLoading.value = false
  }
}

// Legacy function - kept for compatibility, now uses remote search
const getCountySettlements = async (county_id) => {
  if (!county_id) {
    settlementOptions.value = []
    return
  }
  // Clear settlement selection when county changes
  settlementOptions.value = []
  // Load settlements for the selected county using remote search
  await searchSettlements('', county_id)
}

const handleChangeLevel = async (level) => {

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
  const this_role: any = {
    userid: form.value.id,
    roleid: null,
    location_level: null,
    county_id: isCountyRestricted.value && userCountyId.value ? userCountyId.value : null,
    settlement_id: null,
    expires_at: null,

  }

  console.log('this_role', this_role)
  
  // If county admin, set default location level to county
  if (isCountyRestricted.value && userCountyId.value) {
    this_role.location_level = 'county'
    handleChangeLevel('county')
  }
  
  // Add a new role object with default values to the roles array
  tmp_roles.value.push(this_role);
}


const removeRole = (index) => {
  // Remove the role object at the specified index from the roles array
  tmp_roles.value.splice(index, 1);
}


const validateForm = () => {
  let isValid = true; // To track if the form is valid

  // If county admin, validate that all roles are within their county
  if (isCountyRestricted.value && userCountyId.value) {
    tmp_roles.value.forEach(role => {
      // County admins can only assign roles within their county
      if (role.location_level === "county" || role.location_level === "settlement") {
        if (role.county_id && role.county_id !== userCountyId.value) {
          console.error('Error: County admin can only assign roles within their county.');
          ElMessage.error('You can only assign roles within your county.');
          isValid = false;
        }
      }
      // County admins cannot assign national-level roles
      if (role.location_level === "national") {
        console.error('Error: County admin cannot assign national-level roles.');
        ElMessage.error('County admins cannot assign national-level roles.');
        isValid = false;
      }
    });
  }

  tmp_roles.value.forEach(role => {
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


const updateUser = () => {


  // Call the validation function
  const isValid = validateForm();

  if (isValid) {
    // Proceed with form submission or any further processing
    console.log("Form is valid. Proceeding with submission...");

    // Ensure phone is preserved - only if it's undefined or null (not explicitly cleared)
    // Find the original user data to preserve phone if not explicitly provided
    const originalUser = tableDataList.value.find(u => u.id === form.value.id);
    if (originalUser && (form.value.phone === undefined || form.value.phone === null)) {
      // Preserve original phone if it wasn't explicitly provided in the form
      form.value.phone = originalUser.phone || '';
    }

    form.value.roles = tmp_roles.value.map((r: any) => ({
      ...r,
      expires_at: r.expires_at ? r.expires_at : null,
    }))
    console.log('form.value', form.value)
    updateUserApi(form.value).then((response) => {
      console.log("udapyetd", response)

        // Find the index of the object with the matching ID
    const index = tableDataList.value.findIndex(item => item.id === response.user.id);

      if (index !== -1) {
        // Replace the object with the updated response data
        tableDataList.value[index] = response.user;

        console.log('updated  tableDataList.value', tableDataList.value)
      }

      ElMessage.success('User updated successfully')

    }).catch((error) => {
      console.error('Error updating user:', error)
      ElMessage.error('Failed to update user')
    })

    dialogFormVisible.value = false


    // Add your form submission logic here
    // e.g., send data to the server or navigate to the next step
    // axios.post('/api/submit', formData).then(response => { ... });

  } else {
    // Display an error message or handle validation failure
    console.error("Form validation failed. Please check the fields.");

    // Optionally, show an error message to the user
    // alert("Please fill out the required fields correctly.");
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
          v-if="!isCountyRestricted"
          v-model="value2"
          :onChange="handleSelectCounty"
          :onClear="handleClear"
          multiple
          clearable
          filterable
          collapse-tags
          placeholder="Filter by County"
          class="users-toolbar__county-select"
        >
          <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>

        <el-tooltip v-else content="You can only manage users in your county" placement="top">
          <el-tag type="info">
            County: {{ countiesOptions.find((c: any) => c.value === userCountyId)?.label || 'Your County' }}
          </el-tag>
        </el-tooltip>

        <el-select
          v-model="value3"
          multiple
          clearable
          filterable
          remote
          :remote-method="searchByName"
          reserve-keyword
          placeholder="Search by name, username, email or phone"
          class="users-toolbar__search-select"
        />
      </template>

      <template #actions>
        <PermissionWrapper :permissions="['user:create']">
          <el-tooltip content="Add User" placement="top">
            <el-button :onClick="AddUser" type="primary" :icon="Plus" />
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
        :access-reason-labels="accessReasonLabels"
        :format-date="formatDate"
      />

      <el-table-column fixed="right" :label="isMobile ? '' : 'Operations'" :width="actionColumnWidth">
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
:layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'" v-model:currentPage="currentPage"
      v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 100]" :total="total" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4"
      :small="isMobile"
      :pager-count="isMobile ? 3 : 7" />



    <el-dialog :draggable="!isMobile" v-model="dialogFormVisible" title="User Details" :width="dialogWidth">
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
            <el-form-item label="Organization" :label-width="formLabelWidth">
              <el-input v-model="form.organization_name" autocomplete="off" />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
            <el-form-item label="County" :label-width="formLabelWidth">
              <el-select
                v-model="form.county_id"
                placeholder="Select County"
                clearable
                filterable
                :disabled="isCountyRestricted"
                :style="{ width: '100%' }">
                <el-option :value="0" label="Not Applicable" />
                <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
              <el-tooltip v-if="isCountyRestricted" content="County admins can only manage users in their county" placement="top">
                <el-icon style="margin-left: 5px; color: #909399; cursor: help;"><InfoFilled /></el-icon>
              </el-tooltip>
            </el-form-item>
          </el-col>
        </el-row>

        <template v-if="form.access_reason || form.data_use_description">
          <el-divider content-position="left" style="margin: 16px 0 8px;">Data Access Request</el-divider>
          <el-row :gutter="10">
            <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" v-if="form.access_reason">
              <el-form-item label="Reason" :label-width="formLabelWidth">
                <el-input
                  :value="accessReasonLabels[form.access_reason] || form.access_reason"
                  disabled
                  autocomplete="off"
                />
              </el-form-item>
            </el-col>
            <el-col :span="24" v-if="form.data_use_description">
              <el-form-item label="Proposed Use" :label-width="formLabelWidth">
                <el-input
                  v-model="form.data_use_description"
                  type="textarea"
                  :rows="3"
                  disabled
                  autocomplete="off"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <!-- Table for roles management -->
        <div :style="{ overflowX: 'auto', width: '100%' }">
          <el-table :data="tmp_roles" style="width: 100%; min-width: 780px" size="small">

          <el-table-column prop="role" label="Role" :width="isMobile ? 120 : 150">
            <template #default="{ row }">
              <el-select
                v-model="row.roleid" 
                placeholder="Select Role" 
                size="small" 
                :style="{ width: isMobile ? '100%' : '100%' }" 
                searchable
                filterable>
                <!-- Use AvailableRolesOptions (subordinate roles) instead of all roles -->
                <el-option 
                  v-for="item in AvailableRolesOptions.length > 0 ? AvailableRolesOptions : RolesOptions" 
                  :key="item.value" 
                  :label="item.label" 
                  :value="item.value" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="level" label="Level" :width="isMobile ? 100 : 120">
            <template #default="{ row }">
              <el-select
v-model="row.location_level" placeholder="Select level" size="small" filterable
                @change="handleChangeLevel(row.location_level)" :style="{ width: '100%' }">
                <el-option v-for="item in availableLocationOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </template>
          </el-table-column>

          <el-table-column prop="county_id" label="County" :width="isMobile ? 120 : 150">
            <template #default="{ row }">
              <el-select
                v-model="row.county_id" 
                placeholder="County" 
                clearable 
                :disabled="isNationalLevel || isCountyRestricted" 
                filterable
                @change="async (countyId) => { 
                  row.settlement_id = null; 
                  settlementOptions.value = []; 
                  if (countyId) await searchSettlements('', countyId); 
                  // If county admin, ensure county_id matches their county
                  if (isCountyRestricted.value && userCountyId.value && countyId !== userCountyId.value) {
                    ElMessage.warning('You can only assign roles within your county.')
                    row.county_id = userCountyId.value
                  }
                }" 
                size="small" 
                :style="{ width: '100%' }">
                <!-- If county admin, only show their county -->
                <template v-if="isCountyRestricted && userCountyId">
                  <el-option 
                    :key="userCountyId" 
                    :label="countiesOptions.find((c: any) => c.value === userCountyId)?.label || 'Your County'" 
                    :value="userCountyId" />
                </template>
                <template v-else>
                  <el-option 
                    v-for="item in countiesOptions" 
                    :key="item.value" 
                    :label="item.label" 
                    :value="item.value" />
                </template>
              </el-select>
            </template>
          </el-table-column>

          <el-table-column prop="settlement_id" label="Settlement" :width="isMobile ? 140 : 180">
            <template #default="{ row }">
              <el-select
                v-model="row.settlement_id" 
                placeholder="Search settlements" 
                size="small"
                :disabled="!isSettlementLevel || !row.county_id" 
                :style="{ width: '100%' }" 
                filterable 
                remote
                :remote-method="(query) => searchSettlements(query, row.county_id)"
                :loading="settlementSearchLoading"
                reserve-keyword
                clearable
                @focus="() => { if (row.county_id && settlementOptions.length === 0) searchSettlements('', row.county_id) }">
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

          <el-table-column label="Actions" :width="isMobile ? 80 : 120" fixed="right">
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
          <el-button type="primary" @click="updateUser">Confirm</el-button>
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

:deep(.el-table__body tr.user-list-row-access-expired > td) {
  color: var(--el-text-color-secondary);
}
</style>
