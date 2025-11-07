<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { getCountyListApi } from '@/api/counties'
import { getUserRoles,getByName } from '@/api/users'
import type { UserType } from '@/api/users/types'
import PermissionWrapper from '@/components/PermissionWrapper.vue';

import {
  ElButton, ElSwitch, ElSelect, ElDialog, ElRow, ElDropdown, ElDropdownItem,  
  ElFormItem, ElForm, ElInput, ElTable, ElTableColumn, ElAvatar, ElRadio, ElRadioGroup
} from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Position,
 
  Edit,
 
  Plus,
  Download, 
  Filter 
} from '@element-plus/icons-vue'

import { ref, reactive, computed, watch } from 'vue'
import { ElPagination, ElTooltip, ElOption, ElDivider,ElCol } from 'element-plus'
import { useRouter } from 'vue-router'
 import { activateUserApi, updateUserApi, getCountyStaff } from '@/api/users'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import xlsx from "json-as-xlsx"
import DownloadAll from '@/views/Components/DownloadAll.vue';

import { searchByKeyWord } from '@/api/settlements'

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
  dialogWidth.value = "30%"
  actionColumnWidth.value = "160px"

}
const showAdminButtons =  ref(appStore.getAdminButtons)


const currentUser = wsCache.get(appStore.getUserInfo)

 


const { push } = useRouter()
const value1 = ref<any[]>([])
const value2 = ref<any[]>([])
var value3 = ref<any[]>([])
const countiesOptions = ref<any[]>([])
const RolesOptions = ref<any[]>([])


const settlementOptions = ref<any[]>([])
const userOptions = ref<any[]>([])

const settlements = ref<any[]>([])
const filteredSettlements = ref<any[]>([])
const settlementSearchLoading = ref(false)
const page = ref(1)
const pSize = ref(5)
const selCounties = []
const loading = ref(true)
const pageSize = ref(5)
const currentPage = ref(1)
const total = ref(0)

// Add loading state for individual user actions
const userLoadingStates = ref<Record<string, boolean>>({})

const dialogFormVisible = ref(false)
const formLabelWidth = '100px'


let tableDataList = ref<UserType[]>([])
let tableDataList_orig = ref<UserType[]>([])

//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters: string[] = []
var filterValues: any[] = []
var tblData: any[] = []

const associated_multiple_models = ['county' ,'user_roles']

////const nested_models = ['user_roles', 'roles'] // The mother, then followed by the child
//const nested_filter = ['id', [6, 7, 8]] //   column and value of the grandchild. In this case roles. 5=county Admin 


const model = 'users'
const searchString = ref()


//// ------------------parameters -----------------------////
const form = reactive({
  id: '',
  name: '',
  email: '',
  phone: '',
  county_id: '',
  settlement_id: '',
  roles: [],
  avatar: '',
  username:null
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
  pSize.value = 5
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
  // When county is selected, clear settlement options
  // Settlements will be loaded via remote search when user searches
  settlementOptions.value = []
  filteredSettlements.value = []

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
  pSize.value = size

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

   console.log('Get Roles.....',res.data)

    
  res.data.forEach(function (arrayItem) {
 
   
    //  generate the filter options
    var opt = {}
    opt.value = arrayItem.id
    opt.label = arrayItem.name  
    //  console.log(countyOpt)
    RolesOptions.value.push(opt)
  })

  console.log('RolesOptions', RolesOptions)
}

// Handle settlement select focus - load initial settlements if county is selected
const handleSettlementSelectFocus = () => {
  if (form.county_id && settlementOptions.value.length === 0) {
    // Load initial settlements when user focuses on the select
    searchSettlements('')
  }
}

// Remote search method for settlements - fetches on demand (based on Document.vue implementation)
const searchSettlements = async (keyword = '') => {
  // Get county from dialog form or filter
  const countyId = form.county_id || (value2.value && value2.value.length > 0 ? value2.value[0] : null)
  
  // If no county is selected, don't search
  if (!countyId) {
    settlementOptions.value = []
    return
  }
  
  settlementSearchLoading.value = true
  
  try {
    // Use county from dialog if available, otherwise use filter counties
    const countiesToFilter = form.county_id ? [form.county_id] : (value2.value || [])
    
    const formData = {
      curUser: 1,
      model: 'settlement',
      searchField: 'name',
      searchKeyword: keyword,
      excludeGeom: false,
      excludeGeomAssoc: true,
      associated_multiple_models: ['county', 'subcounty', 'ward'],
      filters: countiesToFilter.length > 0 ? ['county_id'] : [],
      filterValues: countiesToFilter.length > 0 ? [countiesToFilter] : [],
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

// Legacy function - kept for compatibility but not loading all upfront
const getSettlementsOptions = async () => {
  // No longer loading all settlements upfront - using remote search instead
  console.log('Settlements will be loaded via remote search when needed')
}


// Legacy function - settlements now loaded via remote search
const makeSettlementOptions = (list) => {
  // No longer needed - using remote search instead
  console.log('Settlements loaded via remote search')
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
  formData.limit = pSize.value
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
  console.log(formData)
  const res = await getByName(formData)

  console.log('After -----x ------Querry', res)
  tableDataList.value = res.data
  tableDataList_orig.value = res.data // back for post filter

  total.value = res.total
  loading.value = false

  tblData = [] // reset the table data

}

const getFilteredData = async (selFilters, selfilterValues) => {
  loading.value=true
  const formData = {}
  formData.limit = pSize.value
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

  loading.value = false

  tblData = [] // reset the table data
  console.log('TBL-b4', tblData)
  res.data.forEach(function (arrayItem) {
    console.log('arrayItem ----->', arrayItem)
    delete arrayItem[associated_multiple_models[0]]['geom'] //  remove the geometry column
    delete arrayItem['photo'] //  remove the geometry column

    var dd = destructure(arrayItem)
    tblData.push(dd)
    //  generate the filter options
    var opt = {}
    opt.value = arrayItem.id
    opt.label = arrayItem.name  
    //  console.log(countyOpt)
    userOptions.value.push(opt)
  })

  loading.value=false
  console.log('TBL-4f', tblData)
}

const searchByName = async (filterString: any) => {
  searchString.value = filterString

  getFilteredBySearchData(searchString.value)
}

getRoles()
getCountyNames()
getSettlementsOptions()
getInterventionsAll()

// Watch for county changes in the dialog form to enable settlement select
watch(() => form.county_id, async (newCountyId, oldCountyId) => {
  if (dialogFormVisible.value && newCountyId && newCountyId !== oldCountyId) {
    // County changed in dialog, load settlements for that county
    form.settlement_id = ''
    settlementOptions.value = []
    await searchSettlements('')
  } else if (dialogFormVisible.value && !newCountyId) {
    // County cleared, disable settlement select
    form.settlement_id = ''
    settlementOptions.value = []
  }
})



const AddUser = () => {

  ElMessage.warning("Coming soon...")
  // push({
  //   path: '/data/settlement/add',
  //   name: 'AddUser'
  // })
}



const EditUser = (data: TableSlotDefault) => {
  console.log(data)
  form.id = data.row.id
  form.name = data.row.name
  form.county_id = data.row.county_id
  form.settlement_id = data.row.settlement_id || ''
  form.email = data.row.email
  form.phone = data.row.phone
  form.avatar = data.row.avatar
  form.username = data.row.username
  let roles = []
  data.row.roles.forEach(function (arrayItem) {
    console.log(arrayItem.id)
    roles.push(arrayItem.id)
  })


  form.roles = roles
  console.log(form)
  
  // If county is selected, enable settlement search
  if (form.county_id) {
    handleDialogCountyChange(form.county_id)
  } else {
    settlementOptions.value = []
  }
  
  dialogFormVisible.value = true
}

// Handle county change in the dialog
const handleDialogCountyChange = async (countyId: any) => {
  console.log('County changed in dialog:', countyId)
  
  // Clear settlement selection when county changes
  form.settlement_id = ''
  settlementOptions.value = []
  
  // If county is selected, trigger a search to load settlements for that county
  if (countyId) {
    // Small delay to ensure form.county_id is updated
    await new Promise(resolve => setTimeout(resolve, 100))
    // Trigger search with empty query to load settlements for the selected county
    await searchSettlements('')
  }
}

 

const updateUser = () => {
  form.roles=[form.roles ]
  updateUserApi(form).then((response) => {

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



</script>

<template>
  <ContentWrap :title="t('Users')" :message="t('Use the filters to subset')">
    <el-divider border-style="dashed" content-position="left">Filters</el-divider>

    <div style="display: inline-block; margin-left: 20px">
      <el-select
v-model="value2" :onChange="handleSelectCounty" :onClear="handleClear" multiple clearable filterable
        collapse-tags placeholder="Filter by County">
        <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>

    <div style="display: inline-block; margin-left: 20px">
      <el-select
v-model="value3" multiple clearable filterable remote :remote-method="searchByName" reserve-keyword
        placeholder="Search by name, username, email or phone" />
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="DownloadXlsx" type="primary" :icon="Download" />
    </div>

    <DownloadAll :model="model" :associated_models="associated_multiple_models"/>

    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="handleClear" type="primary" :icon="Filter" />
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-tooltip content="Register User" placement="top">
        <el-button :onClick="AddUser" type="primary" :icon="Plus" />
      </el-tooltip>
    </div>

    <el-divider border-style="dashed" content-position="left">Results</el-divider>




    <el-table :data="tableDataList" style="width: 100%" fit v-loading="loading">

      <el-table-column type="index" label="#" width="50">
        <!-- Use the 'index' slot to customize the index column -->
        <template #default="scope">
          {{ scope.$index + 1 }}
        </template>
      </el-table-column>
        <!-- Avatar column -->
  <el-table-column label="Avatar" width="100">
    <template #default="scope">
      <el-avatar :src="scope.row.avatar" :size="80" />
    </template>
  </el-table-column>

 
      <el-table-column label="Name" prop="name" width="200" sortable />
      <el-table-column label="Username" prop="username" sortable />
      <el-table-column label="Country" prop="country_name" sortable />
      <el-table-column label="Organization" prop="organization_name" sortable />

      <el-table-column label="County" prop="county.name" sortable />
      <el-table-column fixed="right" :label="isMobile ? '' : 'Operations'" :width="actionColumnWidth">
        <template #default="scope">

          <el-dropdown v-if="isMobile">
            <span class="el-dropdown-link">
              <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-if="showAdminButtons">
                  <PermissionWrapper :permissions="['user:activate']">
                    <el-switch 
                      v-model="scope.row.isactive" 
                      @click="activateDeactivate(scope as TableSlotDefault)" 
                      :loading="userLoadingStates[scope.row.id]"
                      :disabled="userLoadingStates[scope.row.id]"
                      :icon="Edit" />
                  </PermissionWrapper>
                </el-dropdown-item>
                <el-dropdown-item v-else>
                  <el-switch
                    v-model="scope.row.isactive" 
                    disabled
                    :icon="Edit" />
                </el-dropdown-item>
                <PermissionWrapper :permissions="['user:update']">
                  <el-dropdown-item @click="EditUser(scope as TableSlotDefault)" :icon="Position">Edit</el-dropdown-item>
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
            <el-tooltip content="No permission to activate" placement="top">
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
          </div>

        </template>
      </el-table-column>

    </el-table>



    <ElPagination
layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage" v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 50, 100]" :total="total" :background="true" @size-change="onPageSizeChange"
      @current-change="onPageChange" class="mt-4" />

 
      <el-dialog v-model="dialogFormVisible" title="User Details" :width="dialogWidth">
      <el-form :model="form">

        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" >
        <el-form-item label="Name" :label-width="formLabelWidth">
          <el-input v-model="form.name" autocomplete="off" />
        </el-form-item>

        </el-col>

        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" >
        <el-form-item label="Email" :label-width="formLabelWidth">
          <el-input v-model="form.email" autocomplete="off" disabled />
        </el-form-item>
        </el-col>


           
        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" >
        <el-form-item label="Username" :label-width="formLabelWidth">
          <el-input v-model="form.username" autocomplete="off" disabled />
        </el-form-item>
        </el-col>



        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" >

        <el-form-item label="Phone" :label-width="formLabelWidth">
          <el-input v-model="form.phone" autocomplete="off" />
        </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" >

        <el-form-item label="County" :label-width="formLabelWidth">
          <el-select v-model="form.county_id" placeholder="Please select a county" @change="handleDialogCountyChange">
            <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" >
        <el-form-item label="Settlement" :label-width="formLabelWidth">
          <el-select 
            v-model="form.settlement_id" 
            placeholder="Search settlements (select county first)" 
            filterable
            remote
            :remote-method="searchSettlements"
            :disabled="!form.county_id"
            reserve-keyword
            clearable
            :loading="settlementSearchLoading"
            @focus="handleSettlementSelectFocus">
            <el-option 
              v-for="item in settlementOptions" 
              :key="item.value" 
              :label="item.label" 
              :value="item.value" />
          </el-select>
        </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" >
        <el-form-item label="Role" :label-width="formLabelWidth">
          <el-radio-group v-model="form.roles">
            <el-row :gutter="20">
              <el-col v-for="item in RolesOptions" :key="item.value" :span="12">
                <el-radio :label="item.value">{{ item.label }}</el-radio>
              </el-col> 
  
            </el-row>
          </el-radio-group>
        </el-form-item>
        </el-col>




      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogFormVisible = false">Cancel</el-button>
          <el-button type="primary" @click="updateUser">
            Confirm
          </el-button>
        </span>
      </template>
    </el-dialog>

  </ContentWrap>
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

