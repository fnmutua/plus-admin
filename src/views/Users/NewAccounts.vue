<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { getSettlementListByCounty, searchByKeyWord } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { getUserRoles, getByName } from '@/api/users'
import PermissionWrapper from '@/components/PermissionWrapper.vue';

import {
  ElButton, ElSwitch, ElSelect, ElDialog, ElDropdown, ElDropdownItem, ElCheckbox,
  ElFormItem, ElForm, ElInput, ElTable, ElTableColumn, ElAvatar, ElRow, ElDivider, ElPagination, ElTooltip, ElOption, ElCard, ElCol, ElIcon,
  ElDatePicker,
  ElTag,
} from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Position,
  Edit,
  Back,
  Plus,
  Filter,
  ArrowDown
} from '@element-plus/icons-vue'

import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getAssignableLocationOptions } from '@/utils/userRoleLocationOptions'
import { activateUserApi, updateUserApi, getCountyStaff } from '@/api/users'
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
import { loadRoleNameMap, gateActivationOnRole, getActorRoleNames, canModifyUserRoleAssignment, tryRemoveUserRoleRow, canActivateDeactivateUser, assertCanActivateDeactivateUser } from '@/utils/userRoleAssignment'
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
const currentUserInfo = wsCache.get(appStore.getUserInfo)

const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)

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
const editUserForm = ref()
const formLabelWidth = computed(() => isMobile.value ? '90px' : '100px')


let tableDataList = ref<UserType[]>([])
let tableDataList_orig = ref<UserType[]>([])

//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = ['isactive']
var filterValues = [false]
var tblData = []

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
} = useAdjustableTableColumns('newAccountsTableColumns', userTableColumnPresets.standard)

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

  getFilteredData(filters, filterValues)
}



const onPageChange = async (selPage: any) => {
  console.log('on change change: selected counties ', selCounties)
  page.value = selPage

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
  if (
    !assertCanActivateDeactivateUser({
      actorRoleNames: actorRoleNames.value,
      actorUserId: currentUser?.id,
      targetUser: data.row,
      roleNameById: roleNameById.value,
    })
  ) {
    return
  }

  const userId = data.row.id
  const activating = !data.row.isactive
  data.row.isactive = !data.row.isactive

  // Check if user has permission to activate/deactivate
  const currentUserInfo = wsCache.get(appStore.getUserInfo)
  const userPermissions = currentUserInfo && currentUserInfo.permissions ? currentUserInfo.permissions : []

  if (!userPermissions.includes('user:activate')) {
    ElMessage.error('You do not have permission to activate/deactivate users')
    data.row.isactive = !data.row.isactive
    return
  }

  // A role must be confirmed before the account is first switched on
  if (activating) {
    const gate = await gateActivationOnRole(data.row)
    if (gate !== 'ok') {
      data.row.isactive = false
      if (gate === 'assign-role') EditUser(data)
      return
    }
  }
  
  // Set loading state for this specific user
  userLoadingStates.value[userId] = true
  
  try {
    console.log('Activating user.....', data.row)
    await activateUserApi(data.row, { model: 'users' })
    ElMessage.success('User status updated successfully')
    await getFilteredData(filters, filterValues)
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




const getFilteredBySearchData = async (searchString) => {
  const formData = {}
  formData.limit = pageSize.value
  formData.page = page.value
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
  //formData.nested_models = nested_models
  //formData.nested_filter = nested_filter
  formData.currentUser = currentUser

  //-------------------------
  console.log('getFilteredBySearchData', formData)
  const res = await getByName(formData)

  console.log('After -----x ------Querry', res)
  const filteredData = isCountyRestricted.value && userCountyId.value
    ? res.data.filter((user: any) =>
        user.user_roles?.some((role: any) => role.county_id === userCountyId.value)
      )
    : res.data
  tableDataList.value = filteredData

  total.value = filteredData.length
  loading.value = false

  tblData = [] // reset the table data

}


const getFilteredData = async (selFilters, selfilterValues) => {
  loading.value = true
  const formData = {}
  formData.limit = pageSize.value
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
  //formData.nested_models = nested_models
  //formData.nested_filter = nested_filter
  formData.currentUser = currentUser


  //-------------------------
  console.log('gettign getCountyStaff users --->', formData)
  const res = await getCountyStaff(formData)

  console.log('After getting all users', res)
  const filteredData = isCountyRestricted.value && userCountyId.value
    ? res.data.filter((user: any) =>
        user.user_roles?.some((role: any) => role.county_id === userCountyId.value)
      )
    : res.data
  tableDataList.value = filteredData
  tableDataList_orig.value = filteredData // back for post filter

  total.value = filteredData.length

  filteredData.forEach(function (arrayItem) {
    console.log('arrayItem ----->', arrayItem)
    // delete arrayItem[associated_multiple_models[0]]['geom'] //  remove the geometry column
    // delete arrayItem['photo'] //  remove the geometry column


    var opt = {}
    opt.value = arrayItem.id
    opt.label = arrayItem.name  
    //  console.log(countyOpt)
    userOptions.value.push(opt)
  })

  console.log('TBL-4f', tblData)
  loading.value = false
}

const searchByName = async (filterString: any) => {
  searchString.value = filterString



  getFilteredBySearchData(searchString.value)
}

getRoles()
const roleNameById = ref<Record<number, string>>({})
loadRoleNameMap().then((map) => { roleNameById.value = map })

const actorRoleNames = computed(() => getActorRoleNames(currentUser))

const canModifyRoleRow = (roleId: number | string | null | undefined) =>
  canModifyUserRoleAssignment({
    actorRoleNames: actorRoleNames.value,
    targetUserId: form.value.id,
    actorUserId: currentUser?.id,
    roleId,
    roleNameById: roleNameById.value,
  })

const canToggleUserActivation = (row: any) =>
  canActivateDeactivateUser({
    actorRoleNames: actorRoleNames.value,
    actorUserId: currentUser?.id,
    targetUser: row,
    roleNameById: roleNameById.value,
  })

getCountyNames()
getSettlementsOptions()
getInterventionsAll()



const AddUser = (data: TableSlotDefault) => {

  ElMessage.warning("Coming soon...")
  // push({
  //   path: '/data/settlement/add',
  //   name: 'AddUser'
  // })
}



const xEditUser = async (data: TableSlotDefault) => {
  console.log(data)

  tmp_roles.value = []
  form.value.id = data.row.id
  form.value.name = data.row.name
  form.value.county_id = data.row.county_id
  form.value.email = data.row.email
  form.value.phone = data.row.phone
  form.value.avatar = data.row.avatar
  form.value.username = data.row.username


  data.row.roles.forEach(async function (arrayItem) {
    console.log("tis USers Roles", arrayItem.user_roles)
    await handleChangeLevel((arrayItem.user_roles.location_level))


    if (arrayItem.user_roles.county_id) {
      console.log("Get Settleemntsf ofr thus county", arrayItem.user_roles.county_id)
      await getCountySettlements(parseInt(arrayItem.user_roles.county_id))
      arrayItem.user_roles.county_id = parseInt(arrayItem.user_roles.county_id, 10);

    }


    if (arrayItem.user_roles.settlement_id) {
      arrayItem.user_roles.settlement_id = parseInt(arrayItem.user_roles.settlement_id, 10);

    }
    tmp_roles.value.push(arrayItem.user_roles)
  })

  console.log('tmp_roles>>>>', tmp_roles.value)


  console.log(form)
  dialogFormVisible.value = true
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
  form.value.access_reason = data.row.access_reason || ''
  form.value.data_use_description = data.row.data_use_description || ''


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

const selectedRoles = ref([]);





const addRole = () => {
  const this_role = {
    userid: form.value.id,
    roleid: null,
    location_level: null,
    county_id: isCountyRestricted.value && userCountyId.value ? userCountyId.value : null,
    settlement_id: null,
    expires_at: null,

  }

  if (isCountyRestricted.value && userCountyId.value) {
    this_role.location_level = 'county'
    handleChangeLevel('county')
  }

  console.log('this_role', this_role)
  // Add a new role object with default values to the roles array
  tmp_roles.value.push(this_role);
}


const removeRole = (index) => {
  tryRemoveUserRoleRow(index, tmp_roles.value, {
    actorRoleNames: actorRoleNames.value,
    targetUserId: form.value.id,
    actorUserId: currentUser?.id,
    roleNameById: roleNameById.value,
  })
}


const updateUser = async () => {

  tmp_roles.value.forEach(role => {
    if (role.location_level === "national") {
      // If the role is at the national level, nullify county_id and settlement_id
      role.county_id = null;
      role.settlement_id = null;
    }
    if (role.location_level === "county") {
      // If the role is at the national level, nullify county_id and settlement_id
      role.settlement_id = null;
    }
  });

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

  try {
    const response = await updateUserApi(form.value)
    dialogFormVisible.value = false

    if (response.user?.isactive) {
      ElMessage.success('Role assigned and user activated successfully')
      await getFilteredData(filters, filterValues)
    } else {
      const index = tableDataList.value.findIndex(item => item.id === response.user.id)
      if (index !== -1) {
        tableDataList.value[index] = response.user
      }
      ElMessage.success('User updated successfully')
    }
  } catch (error) {
    console.error('Failed to update user:', error)
    ElMessage.error('Failed to update user')
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
          :onChange="handleSelectCounty"
          :onClear="handleClear"
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
        :is-column-visible="isColumnVisible"
        :column-width="columnWidth"
        :column-min-width="columnMinWidth"
        :access-reason-labels="accessReasonLabels"
        :role-name-by-id="roleNameById"
        avatar-field="photo"
      />

      <el-table-column v-if="!isCountyRestricted" fixed="right" :label="isMobile ? '' : 'Operations'" :width="actionColumnWidth">
        <template #default="scope">
          <UserTableActions
            :row="scope.row"
            :show-admin-buttons="showAdminButtons"
            :activate-loading="userLoadingStates[scope.row.id]"
            :activate-disabled="!canToggleUserActivation(scope.row)"
            :show-force-logout="false"
            :show-reset-password="false"
            @activate="activateDeactivate(scope as TableSlotDefault)"
            @edit="EditUser(scope as TableSlotDefault)"
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
              <el-input v-model="form.email" autocomplete="off" disabled />
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
v-model="row.roleid" placeholder="Select Role" size="small" :style="{ width: isMobile ? '100%' : '100%' }" searchable
                filterable :disabled="!canModifyRoleRow(row.roleid)">
                <el-option v-for="item in RolesOptions" :key="item.value" :label="item.label" :value="item.value" />
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
            <template #default="{ row, $index }">
              <el-button
                @click="removeRole($index)"
                type="danger"
                size="small"
                :disabled="!canModifyRoleRow(row.roleid)"
              >Remove</el-button>
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
  margin-right: 10px;
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
