<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { ElButton, ElSwitch, ElSelect, ElDialog, ElFooter, ElFormItem, ElForm, ElInput, MessageParamsWithType } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Position,
  TopRight,
  Edit,
  User,
  Plus,
  Download,
  Filter,
  MessageBox
} from '@element-plus/icons-vue'

import { ref, reactive } from 'vue'
import { ElPagination, ElTooltip, ElOption, ElDivider, ELRow } from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { activateUserApi,updateUserApi } from '@/api/users'

import {
  searchByKeyWord

} from '@/api/settlements'
interface Params {
  pageIndex?: number
  xpageSize?: number
}

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
const formLabelWidth = '140px'


let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var filterValues = []
var tblData = []

const associated_multiple_models = ['county']

const nested_models = ['user_roles', 'roles'] // The mother, then followed by the child
const nested_filter = [ 'id', [5,6,7]] //   column and value of the grandchild. In this case roles. 5=county Admin 


const model = 'users'
const searchString = ref()


//// ------------------parameters -----------------------////
const form = reactive({
  id:'',
  name: '',
  email: '',
  phone: '',
  county_id: '',
  roles: []
})


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
    field: 'username',
    label: t('Username')
  },


  {
    field: 'county.name',
    label: t('County')
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
      countyOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      countiesOptions.value.push(countyOpt)
    })
  })
}
const getRoles = async () => {
  const res = await getCountyListApi({
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
      RolesOptions.value.push(roleOpt)
    })
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
    countyOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
    //  console.log(countyOpt)
    settlementOptions.value.push(countyOpt)
  })
}

const activateDeactivate = (data: TableSlotDefault) => {
  console.log('Activating user.....', data.row)
  // data.mode = 'users'
  activateUserApi(data.row, { model: 'users' }).then(() => { })
}


const handleDownload = () => {
  downloadLoading.value = true
  const data = tblData
  const fileName = 'data.xlsx'
  const exportType = exportFromJSON.types.csv
  if (data) exportFromJSON({ data, fileName, exportType })
}

const getFilteredBySearchData = async (searchString) => {
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
  formData.nested_models = nested_models

  //-------------------------
  console.log(formData)
  const res = await searchByKeyWord(formData)

  console.log('After -----x ------Querry', res)
  tableDataList.value = res.data
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
  formData.nested_models = nested_models
  formData.nested_filter = nested_filter

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('After Querry', res)
  tableDataList.value = res.data
  total.value = res.total
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
    opt.label = arrayItem.name + '(' + arrayItem.id + ')'
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
  //   path: '/settlement/add',
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
  let roles = []
  data.row.user_roles.forEach(function (arrayItem) {
    roles.push(arrayItem.roleid)
  })
  form.roles = roles
  console.log(form)
  dialogFormVisible.value = true
}


const updateUser = () => {
 
  updateUserApi(form).then(() => { })
 
  dialogFormVisible.value = false
}


</script>

<template>
  <ContentWrap :title="t('Users')" :message="t('Use the filters to subset')">
    <el-divider border-style="dashed" content-position="left">Filters</el-divider>

    <div style="display: inline-block; margin-left: 20px">
      <el-select v-model="value2" :onChange="handleSelectCounty" :onClear="handleClear" multiple clearable filterable
        collapse-tags placeholder="Filter by County">
        <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>

    <div style="display: inline-block; margin-left: 20px">
      <el-select v-model="value3" multiple clearable filterable remote :remote-method="searchByName" reserve-keyword
        placeholder="Search by Name" />
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="handleDownload" type="primary" :icon="Download" />
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="handleClear" type="primary" :icon="Filter" />
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-tooltip content="Register User" placement="top">
        <el-button :onClick="AddUser" type="primary" :icon="Plus" />
      </el-tooltip>
    </div>

    <el-divider border-style="dashed" content-position="left">Results</el-divider>

    <Table :columns="columns" :data="tableDataList" :loading="loading" :selection="true" :pageSize="pageSize"
      :currentPage="currentPage">
      <template #action="data">
        <el-row class="mt-4">
          <el-tooltip content="Activate/Deactivate User" placement="top">

            <el-switch v-model="data.row.isactive" @click="activateDeactivate(data as TableSlotDefault)" />
          </el-tooltip>

          <el-tooltip content="View Profile" placement="top">
            <ElButton type="primary" :icon="Edit" size="small" @click="EditUser(data as TableSlotDefault)" circle />
          </el-tooltip>
        </el-row>

      </template>
    </Table>
    <ElPagination layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
      v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 200, 1000]" :total="total" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />

    <el-dialog v-model="dialogFormVisible" title="User Details">
      <el-form :model="form">
        <el-form-item label="Name" :label-width="formLabelWidth">
          <el-input v-model="form.name" autocomplete="off" />
        </el-form-item>

        <el-form-item label="Email" :label-width="formLabelWidth">
          <el-input v-model="form.email" autocomplete="off" />
        </el-form-item>

        <el-form-item label="Phone" :label-width="formLabelWidth">
          <el-input v-model="form.phone" autocomplete="off" />
        </el-form-item>


        <el-form-item label="County" :label-width="formLabelWidth">
          <el-select v-model="form.county_id" placeholder="Please select a zone">
            <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="Roles" :label-width="formLabelWidth">
          <el-select multiple v-model="form.roles" placeholder="Please select a role">
            <el-option v-for="item in RolesOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
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
</style>