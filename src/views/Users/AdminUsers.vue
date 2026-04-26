<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { getSettlementListByCounty, searchByKeyWord } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { getUserRoles, getByName } from '@/api/users'
import PermissionWrapper from '@/components/PermissionWrapper.vue';

import {
  ElButton, ElSwitch, ElSelect, ElDialog, ElDropdown, ElDropdownItem, ElCheckbox, ElMessage,
  ElFormItem, ElForm, ElInput, ElTable, ElTableColumn, ElAvatar, ElRow, ElDivider, ElPagination, ElTooltip, ElOption, ElCard, ElCol, ElTabs, ElTabPane, ElIcon,
  ElDatePicker,
  ElTag,
} from 'element-plus'
import {
  Position,
  Edit,
  Back,
  Plus,
  Download,
  Filter,
  ArrowDown,
  InfoFilled,
  SwitchButton
} from '@element-plus/icons-vue'

import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { activateUserApi, updateUserApi, getAdminStaff, resetUserPassword, forceLogoutUserApi } from '@/api/users'
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
import xlsx from "json-as-xlsx"
import DownloadAll from '@/views/Components/DownloadAll.vue';

interface Params {
  pageIndex?: number
  xpageSize?: number
}

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const isMobile = computed(() => appStore.getMobile)

console.log('IsMobile', isMobile)

const dialogWidth = ref()
const actionColumnWidth = ref()

if (isMobile.value) {
  dialogWidth.value = "100%"
  actionColumnWidth.value = "60px"
} else {
  dialogWidth.value = "60vw"
  actionColumnWidth.value = "220px"

}



const currentUser = wsCache.get(appStore.getUserInfo)
const currentUserInfo = wsCache.get(appStore.getUserInfo)

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

// County restriction — mirrors User.vue pattern
const isSuperAdmin = computed(() => {
  return currentUser?.roles?.some((role: any) =>
    ['super_admin', 'root_admin'].includes(role.name) ||
    (role.name === 'admin' && role.user_roles?.location_level === 'national')
  ) || false
})

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

// County admins (non-super) should only see users in their own county
const isCountyRestricted = computed(() => {
  return isCountyAdmin.value && !isSuperAdmin.value && !!userCountyId.value
})

const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
const countiesOptions = ref([])
const RolesOptions = ref([])
const FilteredRolesOptions = ref([])


const settlementOptions = ref([])
const userOptions = ref([])

const settlements = ref([])
const filteredSettlements = ref([])
const settlementSearchLoading = ref(false)
const page = ref(1)
const selCounties = []
const loading = ref(true)
const currentPage = ref(1)
const total = ref(0)

// Tab management
const activeTab = ref('national')
const loadingNational = ref(true)
const loadingCounty = ref(true)
const loadingSettlement = ref(true)

// Separate data arrays for each level
let tableDataListNational = ref<UserType[]>([])
let tableDataListCounty = ref<UserType[]>([])
let tableDataListSettlement = ref<UserType[]>([])

// Separate totals for each level
const totalNational = ref(0)
const totalCounty = ref(0)
const totalSettlement = ref(0)

// Separate current pages for each level
const currentPageNational = ref(1)
const currentPageCounty = ref(1)
const currentPageSettlement = ref(1)
 
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
const editUserForm = ref()
const formLabelWidth = computed(() => isMobile.value ? '90px' : '100px')


let tableDataList = ref<UserType[]>([])
let tableDataList_orig = ref<UserType[]>([])

// Helper function to filter users by location level (kept for backward compatibility but optimized in main functions)
const filterUsersByLocationLevel = (users: UserType[], level: string) => {
  return users.filter(user => {
    if (!user.user_roles || !Array.isArray(user.user_roles)) return false
    return user.user_roles.some(role => role.location_level === level)
  })
}

// Helper function to get unique users (in case a user has multiple roles at same level)
const getUniqueUsers = (users: UserType[]) => {
  const seen = new Set()
  return users.filter(user => {
    if (seen.has(user.id)) return false
    seen.add(user.id)
    return true
  })
}

//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var filterValues = []
var tblData = []

const associated_multiple_models = ['county', 'user_roles']

 const nested_models = ['user_roles', 'roles'] // The mother, then followed by the child
 const nested_filter = ['name', ['admin']] //   column and value of the grandchild. Filter by role name 'admin' 


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
  username: null,
  organization_name: ''
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
  currentPageNational.value = 1
  currentPageCounty.value = 1
  currentPageSettlement.value = 1
  tblData = []
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
    (settlement) => settlement.county_id == county_id
  )
  console.log('filyterested settlements------>', filteredSettlements)
  makeSettlementOptions(filteredSettlements)

  // Reset pagination for all tabs when filter changes
  currentPageNational.value = 1
  currentPageCounty.value = 1
  currentPageSettlement.value = 1
  currentPage.value = 1
  page.value = 1

  getFilteredData(filters, filterValues)
}



const onPageChange = async (selPage: any) => {
  console.log('on change change: selected counties ', selCounties)
  page.value = selPage

  // Update the appropriate current page based on active tab
  if (activeTab.value === 'national') {
    currentPageNational.value = selPage
  } else if (activeTab.value === 'county') {
    currentPageCounty.value = selPage
  } else if (activeTab.value === 'settlement') {
    currentPageSettlement.value = selPage
  }

  if (searchString.value == '') {
    getFilteredBySearchData(searchString.value)
  } else {
    getFilteredData(filters, filterValues)
  }

}

const onPageSizeChange = async (size: any) => {
  pageSize.value = size

  if (searchString.value == '') {
    getFilteredBySearchData(searchString.value)
  } else {
    getFilteredData(filters, filterValues)
  }
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


  res.data.forEach(function (arrayItem) {


    //  generate the filter options
    var opt = {}
    opt.value = arrayItem.id
    opt.label = arrayItem.name
    //  console.log(countyOpt)
    RolesOptions.value.push(opt)
    FilteredRolesOptions.value.push(opt)
  })

  console.log('RolesOptions', RolesOptions)
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

const handleForceLogout = async (data: TableSlotDefault) => {
  try {
    await forceLogoutUserApi(data.row.id)
    ElMessage.success(`${data.row.username} has been forcefully logged out.`)
  } catch (error) {
    ElMessage.error('Failed to force logout user.')
  }
}




const getFilteredBySearchData = async (searchString) => {
  loading.value = true
  loadingNational.value = true
  loadingCounty.value = true
  loadingSettlement.value = true
  
  const formData = {}
  // Reduce limit on mobile for faster loading - fetch more on desktop
  formData.limit = isMobile.value ? 200 : 10000 // Get all data to filter client-side on desktop, limited on mobile
  formData.page = 1
  formData.curUser = 1 // Id for logged in user
  formData.model = model

  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchString = searchString
  //--Single Filter -----------------------------------------

  //formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = filters
  formData.filterValues = filterValues
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = nested_models
  formData.nested_filter = nested_filter
  formData.currentUser = currentUser

  //-------------------------
  if (!isMobile.value) {
    console.log('getFilteredBySearchData', formData)
  }
  const res = await getByName(formData)

  if (!isMobile.value) {
    console.log('After -----x ------Querry', res)
  }
  
  // Initialize last_login and filter users by location level
  // Backend already filters by admin role, so we only need to check location_level
  const allNationalUsers: any[] = []
  const allCountyUsers: any[] = []
  const allSettlementUsers: any[] = []
  
  // Single optimized pass through data
  res.data.forEach(user => {
    // keep backend last_login value as-is
    
    if (user.user_roles && Array.isArray(user.user_roles)) {
      // Backend already ensures all user_roles are admin roles, so just check location_level
      const hasNationalAdmin = user.user_roles.some(role => role.location_level === 'national')
      const hasCountyAdmin = user.user_roles.some(role => role.location_level === 'county')
      const hasSettlementAdmin = user.user_roles.some(role => role.location_level === 'settlement')
      
      if (hasNationalAdmin) allNationalUsers.push(user)
      if (hasCountyAdmin) allCountyUsers.push(user)
      if (hasSettlementAdmin) allSettlementUsers.push(user)
    }
  })
  
  tableDataList.value = res.data
  tableDataList_orig.value = res.data // back for post filter

  // Get unique users for each level
  const uniqueNationalUsers = getUniqueUsers(allNationalUsers)
  let uniqueCountyUsers = getUniqueUsers(allCountyUsers)
  let uniqueSettlementUsers = getUniqueUsers(allSettlementUsers)

  // Restrict county admins to only see users in their own county
  if (isCountyRestricted.value && userCountyId.value) {
    uniqueCountyUsers = uniqueCountyUsers.filter(user =>
      user.user_roles?.some((role: any) => role.county_id === userCountyId.value)
    )
    uniqueSettlementUsers = uniqueSettlementUsers.filter(user =>
      user.user_roles?.some((role: any) => role.county_id === userCountyId.value)
    )
  }

  // Update totals
  totalNational.value = uniqueNationalUsers.length
  totalCounty.value = uniqueCountyUsers.length
  totalSettlement.value = uniqueSettlementUsers.length
  total.value = res.total

  // Apply pagination to each level
  const startIndexNational = (currentPageNational.value - 1) * pageSize.value
  const endIndexNational = startIndexNational + pageSize.value
  tableDataListNational.value = uniqueNationalUsers.slice(startIndexNational, endIndexNational)

  const startIndexCounty = (currentPageCounty.value - 1) * pageSize.value
  const endIndexCounty = startIndexCounty + pageSize.value
  tableDataListCounty.value = uniqueCountyUsers.slice(startIndexCounty, endIndexCounty)

  const startIndexSettlement = (currentPageSettlement.value - 1) * pageSize.value
  const endIndexSettlement = startIndexSettlement + pageSize.value
  tableDataListSettlement.value = uniqueSettlementUsers.slice(startIndexSettlement, endIndexSettlement)

  loading.value = false
  loadingNational.value = false
  loadingCounty.value = false
  loadingSettlement.value = false

  tblData = [] // reset the table data

}


const getFilteredData = async (selFilters, selfilterValues) => {
  loading.value = true
  loadingNational.value = true
  loadingCounty.value = true
  loadingSettlement.value = true
  
  const formData = {}
  // Reduce limit on mobile for faster loading - fetch more on desktop
  formData.limit = isMobile.value ? 200 : 10000 // Get all data to filter client-side on desktop, limited on mobile
  formData.page = 1
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
  formData.nested_models = nested_models
  formData.nested_filter = nested_filter
  formData.currentUser = currentUser


  //-------------------------
  if (!isMobile.value) {
    console.log('gettign getAdminStaff users --->', formData)
  }
  const res = await getAdminStaff(formData)

  if (!isMobile.value) {
    console.log('After getting all users', res)
  }
  
  // Initialize last_login and filter users by location level
  // Backend already filters by admin role, so we only need to check location_level
  const allNationalUsers: any[] = []
  const allCountyUsers: any[] = []
  const allSettlementUsers: any[] = []
  
  // Single optimized pass through data
  res.data.forEach(user => {
    // keep backend last_login value as-is

    if (user.user_roles && Array.isArray(user.user_roles)) {
      // Backend already ensures all user_roles are admin roles, so just check location_level
      const hasNationalAdmin = user.user_roles.some(role => role.location_level === 'national')
      const hasCountyAdmin = user.user_roles.some(role => role.location_level === 'county')
      const hasSettlementAdmin = user.user_roles.some(role => role.location_level === 'settlement')

      if (hasNationalAdmin) allNationalUsers.push(user)
      if (hasCountyAdmin) allCountyUsers.push(user)
      if (hasSettlementAdmin) allSettlementUsers.push(user)
    }
  })

  tableDataList.value = res.data
  tableDataList_orig.value = res.data // back for post filter

  // Get unique users for each level
  const uniqueNationalUsers = getUniqueUsers(allNationalUsers)
  let uniqueCountyUsers = getUniqueUsers(allCountyUsers)
  let uniqueSettlementUsers = getUniqueUsers(allSettlementUsers)

  // Restrict county admins to only see users in their own county
  if (isCountyRestricted.value && userCountyId.value) {
    uniqueCountyUsers = uniqueCountyUsers.filter(user =>
      user.user_roles?.some((role: any) => role.county_id === userCountyId.value)
    )
    uniqueSettlementUsers = uniqueSettlementUsers.filter(user =>
      user.user_roles?.some((role: any) => role.county_id === userCountyId.value)
    )
  }

  // Update totals
  totalNational.value = uniqueNationalUsers.length
  totalCounty.value = uniqueCountyUsers.length
  totalSettlement.value = uniqueSettlementUsers.length
  total.value = res.total

  // Apply pagination to each level
  const startIndexNational = (currentPageNational.value - 1) * pageSize.value
  const endIndexNational = startIndexNational + pageSize.value
  tableDataListNational.value = uniqueNationalUsers.slice(startIndexNational, endIndexNational)

  const startIndexCounty = (currentPageCounty.value - 1) * pageSize.value
  const endIndexCounty = startIndexCounty + pageSize.value
  tableDataListCounty.value = uniqueCountyUsers.slice(startIndexCounty, endIndexCounty)

  const startIndexSettlement = (currentPageSettlement.value - 1) * pageSize.value
  const endIndexSettlement = startIndexSettlement + pageSize.value
  tableDataListSettlement.value = uniqueSettlementUsers.slice(startIndexSettlement, endIndexSettlement)

  // Only populate userOptions if not on mobile (to reduce processing)
  if (!isMobile.value) {
    res.data.forEach(function (arrayItem) {
      var opt = {}
      opt.value = arrayItem.id
      opt.label = arrayItem.name  
      userOptions.value.push(opt)
    })
  }

  loading.value = false
  loadingNational.value = false
  loadingCounty.value = false
  loadingSettlement.value = false

}

const searchByName = async (filterString: any) => {
  searchString.value = filterString

  // Reset pagination for all tabs when search changes
  currentPageNational.value = 1
  currentPageCounty.value = 1
  currentPageSettlement.value = 1
  currentPage.value = 1
  page.value = 1

  getFilteredBySearchData(searchString.value)
}

// Helper function to get current table data based on active tab
const getCurrentTableData = computed(() => {
  if (activeTab.value === 'national') {
    return tableDataListNational.value
  } else if (activeTab.value === 'county') {
    return tableDataListCounty.value
  } else if (activeTab.value === 'settlement') {
    return tableDataListSettlement.value
  }
  return []
})

// Helper function to get current total based on active tab
const getCurrentTotal = computed(() => {
  if (activeTab.value === 'national') {
    return totalNational.value
  } else if (activeTab.value === 'county') {
    return totalCounty.value
  } else if (activeTab.value === 'settlement') {
    return totalSettlement.value
  }
  return 0
})

// Helper function to get current loading state based on active tab
const getCurrentLoading = computed(() => {
  if (activeTab.value === 'national') {
    return loadingNational.value
  } else if (activeTab.value === 'county') {
    return loadingCounty.value
  } else if (activeTab.value === 'settlement') {
    return loadingSettlement.value
  }
  return loading.value
})

// Helper function to get current page based on active tab
const getCurrentPage = computed({
  get() {
    if (activeTab.value === 'national') {
      return currentPageNational.value
    } else if (activeTab.value === 'county') {
      return currentPageCounty.value
    } else if (activeTab.value === 'settlement') {
      return currentPageSettlement.value
    }
    return currentPage.value
  },
  set(value: number) {
    if (activeTab.value === 'national') {
      currentPageNational.value = value
    } else if (activeTab.value === 'county') {
      currentPageCounty.value = value
    } else if (activeTab.value === 'settlement') {
      currentPageSettlement.value = value
    } else {
      currentPage.value = value
    }
  }
})

// Handle tab change
const handleTabChange = (tabName: string) => {
  console.log('Tab changed to:', tabName)
  activeTab.value = tabName
  // Data is already loaded and separated, just switch the view
  // No need to re-fetch from backend - the computed properties will handle the display
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


getRoles()
getCountyNames()
getSettlementsOptions()

// County admins land on the county tab by default
if (isCountyRestricted.value) {
  activeTab.value = 'county'
}
getInterventionsAll()



const AddUser = (data: TableSlotDefault) => {

  ElMessage.warning("Coming soon...")
  // push({
  //   path: '/data/settlement/add',
  //   name: 'AddUser'
  // })
}



const EditUser = async (data: TableSlotDefault) => {
  console.log(data)

  tmp_roles.value = []
  form.value.id = data.row.id
  form.value.name = data.row.name
  form.value.county_id = data.row.county_id
  form.value.email = data.row.email
  form.value.phone = data.row.phone
  form.value.avatar = data.row.avatar
  form.value.username = data.row.username
  form.value.organization_name = data.row.organization_name || ''


  // data.row.roles.forEach(async function (arrayItem) {
  //   console.log("tis USers Roles", arrayItem.user_roles)
  //   await handleChangeLevel((arrayItem.user_roles.location_level))


  //   if (arrayItem.user_roles.county_id) {
  //     console.log("Get Settleemntsf ofr thus county", arrayItem.user_roles.county_id)
  //     await getCountySettlements(parseInt(arrayItem.user_roles.county_id))
  //     arrayItem.user_roles.county_id = parseInt(arrayItem.user_roles.county_id, 10);

  //   }


  //   if (arrayItem.user_roles.settlement_id) {
  //     arrayItem.user_roles.settlement_id = parseInt(arrayItem.user_roles.settlement_id, 10);

  //   }
  //   tmp_roles.value.push(arrayItem.user_roles)
  // })

  
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




const search = ref('')





const DownloadXlsx = async () => {
  console.log(tableDataList.value)

  // change here !
  let fields = [
    { label: "S/No", value: "index" }, // Top level data
    { label: "Name", value: "name" }, // Top level data
    { label: "Email", value: "email" }, // Custom format
    { label: "Username", value: "username" }, // Run functions
    { label: "Phone", value: "phone" }, // Run functions
    { label: "County", value: "county" }, // Run functions

  ]


  // Preprae the data object 
  var dataObj = {}
  dataObj.sheet = 'data'
  dataObj.columns = fields

  let dataHolder = []
  // loop through the table data and sort the data 
  // change here !
  for (let i = 0; i < tableDataList.value.length; i++) {
    let thisRecord = {}
    tableDataList.value[i]
    thisRecord.index = i + 1
    thisRecord.name = tableDataList.value[i].name
    thisRecord.county = tableDataList.value[i].county.name
    thisRecord.email = tableDataList.value[i].email
    thisRecord.username = tableDataList.value[i].username
    thisRecord.phone = tableDataList.value[i].phone


    dataHolder.push(thisRecord)
  }
  dataObj.content = dataHolder




  let settings = {
    fileName: model, // Name of the resulting spreadsheet
    writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
    writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
  }

  // Enclose in array since the fucntion expects an array of sheets
  xlsx([dataObj], settings) //  download the excel file

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

const locationOptions = [
  {
    value: 'national',
    label: 'National',
  },
  {
    value: 'county',
    label: 'County',
  },
  {
    value: 'settlement',
    label: 'Settlement',
  }
]

const showSettlement = ref(false)
const showCounty = ref(false)
const handleSelectLevel = async (level) => {
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
  const this_role = {
    userid: form.value.id,
    roleid: null,
    location_level: null,
    county_id: null,
    settlement_id: null,
    expires_at: null,

  }

  console.log('this_role', this_role)
  // Add a new role object with default values to the roles array
  tmp_roles.value.push(this_role);
}


const removeRole = (index) => {
  // Remove the role object at the specified index from the roles array
  tmp_roles.value.splice(index, 1);
}


const validateForm = () => {
  let isValid = true; // To track if the form is valid

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
    const originalUser = tableDataList.value.find(u => u.id === form.value.id) ||
                         tableDataListNational.value.find(u => u.id === form.value.id) ||
                         tableDataListCounty.value.find(u => u.id === form.value.id) ||
                         tableDataListSettlement.value.find(u => u.id === form.value.id);
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

         // Find and update in all three tab arrays
         const nationalIndex = tableDataListNational.value.findIndex(item => item.id === response.user.id);
         const countyIndex = tableDataListCounty.value.findIndex(item => item.id === response.user.id);
         const settlementIndex = tableDataListSettlement.value.findIndex(item => item.id === response.user.id);

          if (nationalIndex !== -1) {
            tableDataListNational.value[nationalIndex] = response.user;
          }
          if (countyIndex !== -1) {
            tableDataListCounty.value[countyIndex] = response.user;
          }
          if (settlementIndex !== -1) {
            tableDataListSettlement.value[settlementIndex] = response.user;
          }

          // Also update the main tableDataList
          const index = tableDataList.value.findIndex(item => item.id === response.user.id);
          if (index !== -1) {
            tableDataList.value[index] = response.user;
          }

          // Refresh data to re-categorize users by location level
          getFilteredData(filters, filterValues)

          console.log('updated user data')




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




    <el-row type="flex" justify="start" gutter="10" style="display: flex; flex-wrap: nowrap; align-items: center;">

      <div class="max-w-200px">
        <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
          Back
        </el-button>
      </div>

      <!-- Title Search -->
      <el-select
style="  margin-right: 10px;" v-model="value2" :onChange="handleSelectCounty" :onClear="handleClear"
        multiple clearable filterable collapse-tags placeholder="Filter by County">
        <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>

      <el-select
v-model="value3" multiple clearable filterable remote :remote-method="searchByName" reserve-keyword
        placeholder="Search by name, username, email or phone" />


      <!-- Action Buttons -->
      <div style="display: flex; align-items: center; gap: 10px; margin-left: 10px;">
        <PermissionWrapper :permissions="['user:create']">
          <el-tooltip content="Add User " placement="top">
            <el-button :onClick="AddUser" type="primary" :icon="Plus" />
          </el-tooltip>
        </PermissionWrapper>

        <DownloadAll :model="model" :associated_models="associated_multiple_models"/>

      </div>

    </el-row>



    <el-tabs v-model="activeTab" @tab-change="handleTabChange" style="margin-top: 20px;">
      <el-tab-pane v-if="!isCountyRestricted" label="National Level" name="national">
        <el-table
          :data="getCurrentTableData"
          style="width: 100% ; margin-top: 30px"
          v-loading="getCurrentLoading"
          :row-class-name="userListRowAccessClassName"
        >

      <el-table-column prop="id" label="#" width="50" />


      <!-- Avatar column -->
      <el-table-column label="Avatar" width="100">
        <template #default="scope">
          <div v-if="scope.row.photo">
            <el-avatar :src="scope.row.photo" size="80px" />
          </div>
          <div v-else>
            <el-avatar size="80px" />
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Name" prop="name" width="280" sortable>
        <template #default="scope">
          <span class="name-with-access-tag">
            <span>{{ scope.row.name }}</span>
            <el-tag v-if="isUserAccessFullyExpired(scope.row)" type="danger" effect="plain" size="small">
              Access expired
            </el-tag>
          </span>
        </template>
      </el-table-column>
      <el-table-column label="Username" prop="username" sortable />
      <el-table-column label="Country" prop="country_name" sortable />

      <el-table-column label="County" prop="county.name" width="120" sortable />
      <el-table-column label="Organization" prop="organization_name" sortable />
      <el-table-column label="Last Login" width="180" sortable>
        <template #default="scope">
          <span v-if="scope.row.last_login">{{ formatDate(scope.row.last_login) }}</span>
          <span v-else style="color: #999;">Never</span>
        </template>
      </el-table-column>

      <el-table-column v-if="!isCountyRestricted" fixed="right" :label="isMobile ? '' : 'Operations'" :width="actionColumnWidth">
        <template #default="scope">

          <el-dropdown v-if="isMobile" trigger="click">
            <el-button type="primary" size="small" circle>
              <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-if="showAdminButtons">
                  <PermissionWrapper :permissions="['user:activate']">
                    <el-switch
                      v-model="scope.row.isactive" 
                      @click="activateDeactivate(scope as TableSlotDefault)"
                      :loading="userLoadingStates[scope.row.id]"
                      :disabled="userLoadingStates[scope.row.id]" />
                    <span style="margin-left: 8px;">Activate/Deactivate</span>
                  </PermissionWrapper>
                </el-dropdown-item>
                <el-dropdown-item v-else>
                  <el-switch
                    v-model="scope.row.isactive" 
                    disabled />
                  <span style="margin-left: 8px;">Activate/Deactivate</span>
                </el-dropdown-item>
                <PermissionWrapper :permissions="['user:update']">
                  <el-dropdown-item @click="EditUser(scope as TableSlotDefault)">
                    <el-icon><Edit /></el-icon>
                    <span style="margin-left: 8px;">Edit</span>
                  </el-dropdown-item>
                </PermissionWrapper>
                <el-dropdown-item
                  :disabled="(!scope.row.email && !scope.row.phone) || resetPasswordLoadingStates[scope.row.id]"
                  @click="handleRowPasswordReset(scope.row)"
                >
                  <Icon icon="material-symbols:lock-reset" />
                  <span style="margin-left: 8px;">Reset Password</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>


          <div v-else class="operations-row">
            <el-tooltip v-if="showAdminButtons" content="Activate" placement="top">
              <PermissionWrapper :permissions="['user:activate']">
                <el-switch
                  v-model="scope.row.isactive" 
                  @click="activateDeactivate(scope as TableSlotDefault)"
                  :loading="userLoadingStates[scope.row.id]"
                  :disabled="userLoadingStates[scope.row.id]"
                  class="my-switch" />
              </PermissionWrapper>
            </el-tooltip>
            <el-tooltip v-else content="No permission to activate" placement="top">
              <el-switch
                v-model="scope.row.isactive" 
                disabled
                class="my-switch" />
            </el-tooltip>
            <PermissionWrapper :permissions="['user:update']">
              <el-tooltip content="Edit" placement="top">
                <ElButton type="primary" :icon="Edit" size="small" @click="EditUser(scope as TableSlotDefault)" circle />
              </el-tooltip>
            </PermissionWrapper>
            <PermissionWrapper  :permissions="['user:update']">
              <el-tooltip content="Force Logout" placement="top">
                <ElButton type="danger" :icon="SwitchButton" size="small" @click="handleForceLogout(scope as TableSlotDefault)" circle />
              </el-tooltip>
            </PermissionWrapper>
            <el-tooltip
              :content="(!scope.row.email && !scope.row.phone) ? 'No email or phone on file' : 'Reset password'"
              placement="top"
            >
              <span>
                <ElButton
                  type="warning"
                  size="small"
                  circle
                  :loading="resetPasswordLoadingStates[scope.row.id]"
                  :disabled="!scope.row.email && !scope.row.phone"
                  @click="handleRowPasswordReset(scope.row)"
                >
                  <Icon icon="material-symbols:lock-reset" />
                </ElButton>
              </span>
            </el-tooltip>
          </div>

        </template>
      </el-table-column>

        </el-table>

        <ElPagination
          :layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'" 
          v-model:currentPage="getCurrentPage"
          v-model:page-size="pageSize" 
          :page-sizes="[5, 10, 20, 50, 100]" 
          :total="getCurrentTotal" 
          :background="true"
          @size-change="onPageSizeChange" 
          @current-change="onPageChange" 
          class="mt-4"
      :small="isMobile"
      :pager-count="isMobile ? 3 : 7" />
      </el-tab-pane>

      <el-tab-pane label="County Level" name="county">
        <el-table
          :data="getCurrentTableData"
          style="width: 100% ; margin-top: 30px"
          v-loading="getCurrentLoading"
          :row-class-name="userListRowAccessClassName"
        >

      <el-table-column prop="id" label="#" width="50" />


      <!-- Avatar column -->
      <el-table-column label="Avatar" width="100">
        <template #default="scope">
          <div v-if="scope.row.photo">
            <el-avatar :src="scope.row.photo" size="80px" />
          </div>
          <div v-else>
            <el-avatar size="80px" />
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Name" prop="name" width="280" sortable>
        <template #default="scope">
          <span class="name-with-access-tag">
            <span>{{ scope.row.name }}</span>
            <el-tag v-if="isUserAccessFullyExpired(scope.row)" type="danger" effect="plain" size="small">
              Access expired
            </el-tag>
          </span>
        </template>
      </el-table-column>
      <el-table-column label="Username" prop="username" sortable />
      <el-table-column label="Country" prop="country_name" sortable />

      <el-table-column label="County" prop="county.name" width="120" sortable />
      <el-table-column label="Organization" prop="organization_name" sortable />
      <el-table-column label="Last Login" width="180" sortable>
        <template #default="scope">
          <span v-if="scope.row.last_login">{{ formatDate(scope.row.last_login) }}</span>
          <span v-else style="color: #999;">Never</span>
        </template>
      </el-table-column>
      <el-table-column v-if="!isCountyRestricted" fixed="right" :label="isMobile ? '' : 'Operations'" :width="actionColumnWidth">
        <template #default="scope">

          <el-dropdown v-if="isMobile" trigger="click">
            <el-button type="primary" size="small" circle>
              <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-if="showAdminButtons">
                  <PermissionWrapper :permissions="['user:activate']">
                    <el-switch
                      v-model="scope.row.isactive" 
                      @click="activateDeactivate(scope as TableSlotDefault)"
                      :loading="userLoadingStates[scope.row.id]"
                      :disabled="userLoadingStates[scope.row.id]" />
                    <span style="margin-left: 8px;">Activate/Deactivate</span>
                  </PermissionWrapper>
                </el-dropdown-item>
                <el-dropdown-item v-else>
                  <el-switch
                    v-model="scope.row.isactive" 
                    disabled />
                  <span style="margin-left: 8px;">Activate/Deactivate</span>
                </el-dropdown-item>
                <PermissionWrapper :permissions="['user:update']">
                  <el-dropdown-item @click="EditUser(scope as TableSlotDefault)">
                    <el-icon><Edit /></el-icon>
                    <span style="margin-left: 8px;">Edit</span>
                  </el-dropdown-item>
                </PermissionWrapper>
                <el-dropdown-item
                  :disabled="(!scope.row.email && !scope.row.phone) || resetPasswordLoadingStates[scope.row.id]"
                  @click="handleRowPasswordReset(scope.row)"
                >
                  <Icon icon="material-symbols:lock-reset" />
                  <span style="margin-left: 8px;">Reset Password</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>


          <div v-else class="operations-row">
            <el-tooltip v-if="showAdminButtons" content="Activate" placement="top">
              <PermissionWrapper :permissions="['user:activate']">
                <el-switch
                  v-model="scope.row.isactive" 
                  @click="activateDeactivate(scope as TableSlotDefault)"
                  :loading="userLoadingStates[scope.row.id]"
                  :disabled="userLoadingStates[scope.row.id]"
                  class="my-switch" />
              </PermissionWrapper>
            </el-tooltip>
            <el-tooltip v-else content="No permission to activate" placement="top">
              <el-switch
                v-model="scope.row.isactive" 
                disabled
                class="my-switch" />
            </el-tooltip>
            <PermissionWrapper :permissions="['user:update']">
              <el-tooltip content="Edit" placement="top">
                <ElButton type="primary" :icon="Edit" size="small" @click="EditUser(scope as TableSlotDefault)" circle />
              </el-tooltip>
            </PermissionWrapper>
            <PermissionWrapper  :permissions="['user:update']">
              <el-tooltip content="Force Logout" placement="top">
                <ElButton type="danger" :icon="SwitchButton" size="small" @click="handleForceLogout(scope as TableSlotDefault)" circle />
              </el-tooltip>
            </PermissionWrapper>
            <el-tooltip
              :content="(!scope.row.email && !scope.row.phone) ? 'No email or phone on file' : 'Reset password'"
              placement="top"
            >
              <span>
                <ElButton
                  type="warning"
                  size="small"
                  circle
                  :loading="resetPasswordLoadingStates[scope.row.id]"
                  :disabled="!scope.row.email && !scope.row.phone"
                  @click="handleRowPasswordReset(scope.row)"
                >
                  <Icon icon="material-symbols:lock-reset" />
                </ElButton>
              </span>
            </el-tooltip>
          </div>

        </template>
      </el-table-column>

        </el-table>

        <ElPagination
          :layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'" 
          v-model:currentPage="getCurrentPage"
          v-model:page-size="pageSize" 
          :page-sizes="[5, 10, 20, 50, 100]" 
          :total="getCurrentTotal" 
          :background="true"
          @size-change="onPageSizeChange" 
          @current-change="onPageChange" 
          class="mt-4"
      :small="isMobile"
      :pager-count="isMobile ? 3 : 7" />
      </el-tab-pane>

      <el-tab-pane label="Settlement Level" name="settlement">
        <el-table
          :data="getCurrentTableData"
          style="width: 100% ; margin-top: 30px"
          v-loading="getCurrentLoading"
          :row-class-name="userListRowAccessClassName"
        >

      <el-table-column prop="id" label="#" width="50" />


      <!-- Avatar column -->
      <el-table-column label="Avatar" width="100">
        <template #default="scope">
          <div v-if="scope.row.photo">
            <el-avatar :src="scope.row.photo" size="80px" />
          </div>
          <div v-else>
            <el-avatar size="80px" />
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Name" prop="name" width="280" sortable>
        <template #default="scope">
          <span class="name-with-access-tag">
            <span>{{ scope.row.name }}</span>
            <el-tag v-if="isUserAccessFullyExpired(scope.row)" type="danger" effect="plain" size="small">
              Access expired
            </el-tag>
          </span>
        </template>
      </el-table-column>
      <el-table-column label="Username" prop="username" sortable />
      <el-table-column label="Settlement" width="160">
        <template #default="scope">
          {{ settlementOptions.find(s => s.value === scope.row.user_roles?.find((r: any) => r.settlement_id)?.settlement_id)?.label || '—' }}
        </template>
      </el-table-column>
      <el-table-column label="Organization" prop="organization_name" sortable />
      <el-table-column label="Last Login" width="180" sortable>
        <template #default="scope">
          <span v-if="scope.row.last_login">{{ formatDate(scope.row.last_login) }}</span>
          <span v-else style="color: #999;">Never</span>
        </template>
      </el-table-column>
      <el-table-column v-if="!isCountyRestricted" fixed="right" :label="isMobile ? '' : 'Operations'" :width="actionColumnWidth">
        <template #default="scope">

          <el-dropdown v-if="isMobile" trigger="click">
            <el-button type="primary" size="small" circle>
              <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-if="showAdminButtons">
                  <PermissionWrapper :permissions="['user:activate']">
                    <el-switch
                      v-model="scope.row.isactive" 
                      @click="activateDeactivate(scope as TableSlotDefault)"
                      :loading="userLoadingStates[scope.row.id]"
                      :disabled="userLoadingStates[scope.row.id]" />
                    <span style="margin-left: 8px;">Activate/Deactivate</span>
                  </PermissionWrapper>
                </el-dropdown-item>
                <el-dropdown-item v-else>
                  <el-switch
                    v-model="scope.row.isactive" 
                    disabled />
                  <span style="margin-left: 8px;">Activate/Deactivate</span>
                </el-dropdown-item>
                <PermissionWrapper :permissions="['user:update']">
                  <el-dropdown-item @click="EditUser(scope as TableSlotDefault)">
                    <el-icon><Edit /></el-icon>
                    <span style="margin-left: 8px;">Edit</span>
                  </el-dropdown-item>
                </PermissionWrapper>
                <el-dropdown-item
                  :disabled="(!scope.row.email && !scope.row.phone) || resetPasswordLoadingStates[scope.row.id]"
                  @click="handleRowPasswordReset(scope.row)"
                >
                  <Icon icon="material-symbols:lock-reset" />
                  <span style="margin-left: 8px;">Reset Password</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>


          <div v-else class="operations-row">
            <el-tooltip v-if="showAdminButtons" content="Activate" placement="top">
              <PermissionWrapper :permissions="['user:activate']">
                <el-switch
                  v-model="scope.row.isactive" 
                  @click="activateDeactivate(scope as TableSlotDefault)"
                  :loading="userLoadingStates[scope.row.id]"
                  :disabled="userLoadingStates[scope.row.id]"
                  class="my-switch" />
              </PermissionWrapper>
            </el-tooltip>
            <el-tooltip v-else content="No permission to activate" placement="top">
              <el-switch
                v-model="scope.row.isactive" 
                disabled
                class="my-switch" />
            </el-tooltip>
            <PermissionWrapper :permissions="['user:update']">
              <el-tooltip content="Edit" placement="top">
                <ElButton type="primary" :icon="Edit" size="small" @click="EditUser(scope as TableSlotDefault)" circle />
              </el-tooltip>
            </PermissionWrapper>
            <PermissionWrapper  :permissions="['user:update']">
              <el-tooltip content="Force Logout" placement="top">
                <ElButton type="danger" :icon="SwitchButton" size="small" @click="handleForceLogout(scope as TableSlotDefault)" circle />
              </el-tooltip>
            </PermissionWrapper>
            <el-tooltip
              :content="(!scope.row.email && !scope.row.phone) ? 'No email or phone on file' : 'Reset password'"
              placement="top"
            >
              <span>
                <ElButton
                  type="warning"
                  size="small"
                  circle
                  :loading="resetPasswordLoadingStates[scope.row.id]"
                  :disabled="!scope.row.email && !scope.row.phone"
                  @click="handleRowPasswordReset(scope.row)"
                >
                  <Icon icon="material-symbols:lock-reset" />
                </ElButton>
              </span>
            </el-tooltip>
          </div>

        </template>
      </el-table-column>

        </el-table>

        <ElPagination
          :layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'" 
          v-model:currentPage="getCurrentPage"
          v-model:page-size="pageSize" 
          :page-sizes="[5, 10, 20, 50, 100]" 
          :total="getCurrentTotal" 
          :background="true"
          @size-change="onPageSizeChange" 
          @current-change="onPageChange" 
          class="mt-4"
      :small="isMobile"
      :pager-count="isMobile ? 3 : 7" />
      </el-tab-pane>
    </el-tabs>



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

          <el-table-column prop="role" label="Role" :width="isMobile ? 120 : 150">
            <template #default="{ row }">
              <el-select
v-model="row.roleid" placeholder="Select Role" size="small" :style="{ width: isMobile ? '100%' : '100%' }" searchable
                filterable>
                <el-option v-for="item in RolesOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="level" label="Level" :width="isMobile ? 100 : 120">
            <template #default="{ row }">
              <el-select
v-model="row.location_level" placeholder="Select level" size="small" filterable
                @change="handleChangeLevel(row.location_level)" :style="{ width: '100%' }">
                <el-option v-for="item in locationOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </template>
          </el-table-column>

          <el-table-column prop="county_id" label="County" :width="isMobile ? 120 : 150">
            <template #default="{ row }">
              <el-select
                v-model="row.county_id" 
                placeholder="County" 
                clearable 
                :disabled="isNationalLevel" 
                filterable
                @change="async (countyId) => { 
                  row.settlement_id = null; 
                  settlementOptions.value = []; 
                  if (countyId) await searchSettlements('', countyId); 
                }" 
                size="small" 
                :style="{ width: '100%' }">
                <el-option :value="0" label="Not Applicable" />
                <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
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
