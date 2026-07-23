<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { getUserRoles,getByName } from '@/api/users'


import {
  ElButton, ElSwitch, ElSelect, ElDialog, ElFooter,ElRow, ElDropdown, ElDropdownItem, ElCheckboxGroup,ElCheckbox,
  ElFormItem, ElForm, ElInput, ElTable, ElTableColumn, ElAvatar,    ElRadio, ElRadioButton, ElRadioGroup
} from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Position,
  TopRight,
  Edit,
  User,
  Plus,
  UserFilled,
  Filter,
  MessageBox
} from '@element-plus/icons-vue'

import { ref, reactive, computed } from 'vue'
import { ElPagination, ElTooltip, ElOption, ElDivider,ElCard,ElCol, ELRow } from 'element-plus'
import { useRouter } from 'vue-router'
import { activateUserApi, updateUserApi, getCountyStaff } from '@/api/users'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import DownloadCustom from '@/views/Components/DownloadCustom.vue'
import UserTableActions from '@/views/Components/UserTableActions.vue'
import PermissionWrapper from '@/components/PermissionWrapper.vue';
import { useAdjustableTableColumns } from '@/composables/useAdjustableTableColumns'
import { userTableColumnPresets } from '@/constants/userTableColumnPresets'
import AdjustableTableColumnPicker from '@/components/Users/AdjustableTableColumnPicker.vue'
import UserListAdjustableColumns from '@/components/Users/UserListAdjustableColumns.vue'
import UserListContentToolbar from '@/components/Users/UserListContentToolbar.vue'

import { searchByKeyWord } from '@/api/settlements'
interface Params {
  pageIndex?: number
  xpageSize?: number
}

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const isMobile = computed(() => appStore.getMobile)

console.log('IsMobile', isMobile)

const dialogWidth = ref(isMobile.value ? '90%' : '25%')
const actionColumnWidth = computed(() => (isMobile.value ? '80px' : '100px'))



const currentUser = wsCache.get(appStore.getUserInfo)

const showAdminButtons =  ref(appStore.getAdminButtons)
const showEditButtons =  ref(appStore.getEditButtons)



const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
const countiesOptions = ref([])
const RolesOptions = ref([])


const settlementOptions = ref([])
const userOptions = ref([])

const settlements = ref([])
const filteredSettlements = ref([])
const page = ref(1)
const pSize = ref(5)
const selCounties = []
const loading = ref(true)
const pageSize = ref(5)
const currentPage = ref(1)
const total = ref(0)
const downloadLoading = ref(false)




const dialogFormVisible = ref(false)
const editUserForm = ref()
const formLabelWidth = '100px'


let tableDataList = ref<UserType[]>([])
let tableDataList_orig = ref<UserType[]>([])

//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = ['county_id']
var filterValues = [currentUser.county_id]
var tblData = []

const associated_multiple_models = ['county' ]

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
  roles: [],
  avatar:''
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
} = useAdjustableTableColumns('countyUsersTableColumns', userTableColumnPresets.minimal)

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

    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var countyOpt = {}
      countyOpt.value = arrayItem.id
      countyOpt.label = arrayItem.name  
      //  console.log(countyOpt)
      countiesOptions.value.push(countyOpt)
    })
  })
}

const xgetRoles = async () => {
  const res = await getUserRoles({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'roles',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    var ret = response.data

    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var roleOpt = {}
      roleOpt.value = arrayItem.id
      roleOpt.label = arrayItem.name
      //  console.log(countyOpt)
      if (arrayItem.name !=='super_admin') {
        RolesOptions.value.push(roleOpt)

      }
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

    loading.value = false
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

const activateDeactivate = (data: TableSlotDefault) => {
  data.row.isactive = !data.row.isactive
  console.log('Activating user.....', data.row)
  activateUserApi(data.row, { model: 'users' })
    .then(() => {})
    .catch(() => {
      data.row.isactive = !data.row.isactive
    })
}


const xgetFilteredBySearchData = async (searchString) => {
  const formData = {}
  formData.limit = pSize.value
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model

  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = searchString
  //--Single Filter -----------------------------------------

  //formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = filters
  formData.filterValues = filterValues
  formData.associated_multiple_models = associated_multiple_models
  //formData.nested_models = nested_models
  //formData.nested_filter = nested_filter

  //-------------------------
  console.log(formData)
  const res = await searchByKeyWord(formData)

  console.log('After -----x ------Querry', res)
  tableDataList.value = res.data
  tableDataList_orig.value = res.data // back for post filter

  total.value = res.total
  loading.value = false

  tblData = [] // reset the table data

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



const AddUser = (data: TableSlotDefault) => {

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
  form.email = data.row.email
  form.phone = data.row.phone
  form.avatar = data.row.avatar
  let roles = []
  data.row.roles.forEach(function (arrayItem) {
    console.log(arrayItem.id)
    roles.push(arrayItem.id)
  })


  form.roles = roles
  console.log(form)
  dialogFormVisible.value = true
}


const updateUser = () => {

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






const search = ref('')

</script>

<template>
  <ContentWrap :title="t('Users')" :message="t('Use the filters to subset')">
    <el-divider border-style="dashed" content-position="left">Filters</el-divider>

    <UserListContentToolbar>
      <template #filters>
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
          placeholder="Search by Name"
        />
      </template>

      <template #actions>
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
        <el-button :onClick="handleClear" type="primary" :icon="Filter" />
        <el-tooltip content="Register User" placement="top">
          <el-button :onClick="AddUser" type="primary" :icon="Plus" />
        </el-tooltip>
        <AdjustableTableColumnPicker
          v-model:show-column-picker="showColumnPicker"
          v-model:visible-column-keys="visibleColumnKeys"
          :hideable-columns="hideableColumns"
          @reset="resetColumns"
        />
      </template>
    </UserListContentToolbar>

    <el-divider border-style="dashed" content-position="left">Results</el-divider>

    <el-table
      :data="tableDataList"
      style="width: 100%"
      border
      fit
      @header-dragend="onHeaderDragend"
    >
      <UserListAdjustableColumns
        :is-column-visible="isColumnVisible"
        :column-width="columnWidth"
        :column-min-width="columnMinWidth"
        avatar-field="avatar"
        use-index-column
      />

      <el-table-column fixed="right" :label="isMobile ? '' : 'Operations'" :width="actionColumnWidth">
        <template #default="scope">
          <UserTableActions
            :row="scope.row"
            :show-admin-buttons="showAdminButtons"
            :show-force-logout="false"
            :show-reset-password="false"
            @activate="activateDeactivate(scope as TableSlotDefault)"
            @edit="EditUser(scope as TableSlotDefault)"
          />
        </template>
      </el-table-column>

    </el-table>



    <ElPagination
:layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'" v-model:currentPage="currentPage" v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 50, 100]" :total="total" :background="true" @size-change="onPageSizeChange"
      @current-change="onPageChange" class="mt-4"
      :small="isMobile"
      :pager-count="isMobile ? 3 : 7" />

     
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

        <el-form-item label="Phone" :label-width="formLabelWidth">
          <el-input v-model="form.phone" autocomplete="off" />
        </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" >

        <el-form-item label="County" :label-width="formLabelWidth">
          <el-select v-model="form.county_id" placeholder="Please select a zone">
            <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
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

