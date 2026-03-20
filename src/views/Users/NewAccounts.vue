<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { getSettlementListByCounty, searchByKeyWord } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { getUserRoles, getByName } from '@/api/users'
import PermissionWrapper from '@/components/PermissionWrapper.vue';

import {
  ElButton, ElSwitch, ElSelect, ElDialog, ElDropdown, ElDropdownItem, ElCheckbox,
  ElFormItem, ElForm, ElInput, ElTable, ElTableColumn, ElAvatar, ElRow, ElDivider, ElPagination, ElTooltip, ElOption, ElCard, ElCol, ElIcon
} from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Position,
  Edit,
  Back,
  Plus,
  Download,
  Filter,
  ArrowDown
} from '@element-plus/icons-vue'

import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { activateUserApi, updateUserApi, getCountyStaff } from '@/api/users'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
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
  dialogWidth.value = "90%"
  actionColumnWidth.value = "75px"
} else {
  dialogWidth.value = "50%"
  actionColumnWidth.value = "160px"

}



const currentUser = wsCache.get(appStore.getUserInfo)
const currentUserInfo = wsCache.get(appStore.getUserInfo)

const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)



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
  tableDataList.value = res.data
  // tableDataList_orig.value = res.data // back for post filter

  total.value = res.total
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
  tableDataList.value = res.data
  tableDataList_orig.value = res.data // back for post filter

  total.value = res.total   // instead of usign the erronues total reurned due to left/right joins




  res.data.forEach(function (arrayItem) {
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

const selectedRoles = ref([]);





const addRole = () => {
  const this_role = {
    userid: form.value.id,
    roleid: null,
    location_level: null,
    county_id: null,
    settlement_id: null

  }

  console.log('this_role', this_role)
  // Add a new role object with default values to the roles array
  tmp_roles.value.push(this_role);
}


const removeRole = (index) => {
  // Remove the role object at the specified index from the roles array
  tmp_roles.value.splice(index, 1);
}


const updateUser = () => {

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

  form.value.roles = tmp_roles.value
  console.log('form.value', form.value)





  updateUserApi(form.value).then((response) => {

    console.log("udapyetd")

       // Find the index of the object with the matching ID
       const index = tableDataList.value.findIndex(item => item.id === response.user.id);

        if (index !== -1) {
          // Replace the object with the updated response data
          tableDataList.value[index] = response.user;

          console.log('updated  tableDataList.value', tableDataList.value)
        }




  })

  dialogFormVisible.value = false
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

        <PermissionWrapper :permissions="['user:download']">
          <DownloadAll :model="model" :associated_models="associated_multiple_models"/>
        </PermissionWrapper>

      </div>

    </el-row>



    <el-table :data="tableDataList" style="width: 100% ; margin-top: 30px" v-loading="loading">

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


      <el-table-column label="Name" prop="name" width="200" sortable />
      <el-table-column label="Username" prop="username" sortable />
      <el-table-column label="Country" prop="country_name" sortable />
      <el-table-column label="County" prop="county.name" sortable />
      <el-table-column label="Organization" prop="organization_name" sortable />
      <el-table-column label="Reason for Access" prop="access_reason" sortable>
        <template #default="scope">
          {{ accessReasonLabels[scope.row.access_reason] || scope.row.access_reason || '—' }}
        </template>
      </el-table-column>

      <el-table-column fixed="right" :label="isMobile ? '' : 'Operations'" :width="actionColumnWidth">
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
              </el-dropdown-menu>
            </template>
          </el-dropdown>


          <div v-else>
            <PermissionWrapper :permissions="['user:activate']">
              <el-tooltip content="Activate" placement="top">
                <el-switch
                  v-model="scope.row.isactive" 
                  @click="activateDeactivate(scope as TableSlotDefault)"
                  :loading="userLoadingStates[scope.row.id]"
                  :disabled="userLoadingStates[scope.row.id]"
                  class="my-switch" />
              </el-tooltip>
            </PermissionWrapper>
            <template v-if="!currentUserInfo?.permissions?.includes('user:activate')">
              <el-tooltip content="No permission to activate" placement="top">
                <el-switch
                  v-model="scope.row.isactive" 
                  disabled
                  class="my-switch" />
              </el-tooltip>
            </template>
            <PermissionWrapper :permissions="['user:update']">
              <el-tooltip content="Edit" placement="top">
                <ElButton type="primary" :icon="Edit" size="small" @click="EditUser(scope as TableSlotDefault)" circle />
              </el-tooltip>
            </PermissionWrapper>
          </div>

        </template>
      </el-table-column>

    </el-table>



    <ElPagination
layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
      v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 100]" :total="total" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />



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
          <el-table :data="tmp_roles" style="width: 100%; min-width: 600px" size="small">

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
  margin-right: 10px;
}
</style>
