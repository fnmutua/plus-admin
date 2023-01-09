<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import {
  ElButton, ElCascader, ElDatePicker, ElDialog, ElForm, ElFormItem,
  ElInputNumber, ElSelect, FormInstance, FormRules, MessageParamsWithType
} from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Position,
  TopRight,
  User,
  Plus,
  Download,
  Filter,
  Edit,
  Delete,
  MessageBox,
  InfoFilled
} from '@element-plus/icons-vue'

import { ref, reactive } from 'vue'
import { ElPagination, ElTooltip, ElOption, ElPopconfirm, ElDivider, ElInput, ElAutoResizer, ElTableV2 } from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { UserType } from '@/api/register/types'
import { CreateRecord, DeleteRecord, updateOneRecord } from '@/api/settlements'
import xlsx from "json-as-xlsx"

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


console.log("userInfo--->", userInfo)







const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
const countiesOptions = ref([])
const settlementOptions = ref([])
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
const showAdminButtons = ref(false)

// flag for admin buttons
if (userInfo.roles.includes("admin") || userInfo.roles.includes("kisip_staff")) {
  showAdminButtons.value = true
}

const editDialogVisible = ref(false)
const showEditSaveButton = ref(true)

console.log("Show Buttons -->", showAdminButtons)



let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var filterValues = []
var tblData = []
const associated_Model = ''
const associated_multiple_models = ['county']
const model = 'settlement'
//// ------------------parameters -----------------------////

const { t } = useI18n()

const columns: TableColumn[] = [
  {
    field: 'index',
    label: t('userDemo.index'),
    type: 'index'
  },

  {
    field: 'name',
    label: t('Name')
  },
  {
    field: 'population',
    label: t('Population')
  },

  {
    field: 'area',
    label: t('Area(Ha.)')
  },
  {
    field: 'county.name',
    label: t('County')
  },
  {
    field: 'action',
    width: "300",
    fixed: "right",
    label: 'Operations'
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

const handleSelectSettlement = async (settlement: any) => {
  var selectOption = 'id'
  if (!filters.includes(selectOption)) {
    filters.push(selectOption)
  }
  var index = filters.indexOf(selectOption) // 1
  console.log('settlement : index--->', index)

  // clear previously selected
  if (filterValues[index]) {
    // filterValues[index].length = 0
    filterValues.splice(index, 1)
  }

  if (!filterValues.includes(settlement) && settlement.length > 0) {
    filterValues.splice(index, 0, settlement) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
  }

  // expunge the filter if the filter values are null
  if (settlement.length === 0) {
    filters.splice(index, 1)
  }

  console.log('FilterValues:', filterValues)

  getFilteredData(filters, filterValues)
}

const onPageChange = async (selPage: any) => {
  console.log('on change change: selected counties ', selCounties)
  page.value = selPage
  getFilteredData(filters, filterValues)
}

const onPageSizeChange = async (size: any) => {
  pSize.value = size
  getFilteredData(filters, filterValues)
}

const getInterventionsAll = async () => {
  getFilteredData(filters, filterValues)
}

const flattenJSON = (obj = {}, res = {}, extraKey = '') => {
  for (let key in obj) {
    if (key != 'geom') {

      if (typeof obj[key] !== 'object') {
        res[extraKey + key] = obj[key];
      } else {
        flattenJSON(obj[key], res, `${extraKey}${key}.`);
      };
    };
  }
  return res;
};


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

  formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = selFilters
  formData.filterValues = selfilterValues
  formData.associated_multiple_models = associated_multiple_models

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('After Querry', res)
  tableDataList.value = res.data
  total.value = res.total

  tblData = [] // reset the table data
  console.log('TBL-b4', tblData)
  res.data.forEach(function (arrayItem) {
    //  console.log(countyOpt)
    // delete arrayItem[associated_Model]['geom'] //  remove the geometry column

    var dd = flattenJSON(arrayItem)

    tblData.push(dd)
  })

  console.log('TBL-4f', tblData)
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

const open = (msg: MessageParamsWithType) => {
  ElMessage.error(msg)
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

const handleDownload = () => {
  downloadLoading.value = true
  const data = tblData
  const fileName = 'data.xlsx'
  const exportType = exportFromJSON.types.csv
  if (data) exportFromJSON({ data, fileName, exportType })
}

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  id: '',
  name: '',
  county_id: '',
  settlement_type: null,
  area: null,
  population: null,
  description: null,
  code: null,

})

const rules = reactive<FormRules>({
  name: [
    { required: true, message: 'Please provide  a name', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }
  ],
  county_id: [
    { required: true, message: 'Indicator category is required', trigger: 'blur' }],
  code: [{ required: true, message: 'The code is required', trigger: 'blur' }],

})

getCountyNames()
getSettlementsOptions()
getInterventionsAll()

console.log('Options---->', countiesOptions)
const viewProfile = (data: TableSlotDefault) => {
  console.log('On Click.....', data.row.id)

  push({
    path: '/settlement/:id',
    name: 'SettlementDetails',
    params: { data: data.row.id, id: data.row.id }
  })
}

const viewHHs = (data: TableSlotDefault) => {
  console.log('On Click.....', data.row.id)
  push({
    path: '/settlement/hh/:id',
    name: 'Households',
    params: { id: data.row.id, name: data.row.name }
  })
}

const viewOnMap = (data: TableSlotDefault) => {
  console.log('On map.....', data.row)
  if (data.row.geom) {
    push({
      path: '/settlement/map/:id',
      name: 'SettlementMap',
      params: { id: data.row.id }
    })
  } else {
    var msg = 'This Settlement does not have the boundary defined in the database!'
    open(msg)
  }
}
const viewDocuments = (data: TableSlotDefault) => {
  console.log('On map.....', data.row)

  push({
    path: '/settlement/doc/:id',
    name: 'SettlementDocs',
    params: { id: data.row.id }
  })
}

const AddSettlement = (data: TableSlotDefault) => {
  push({
    path: '/settlement/add',
    name: 'AddSettlement'
  })
}

const editSettlement = (data: TableSlotDefault) => {
  editDialogVisible.value = true
  ruleForm.id = data.row.id
  ruleForm.county_id = data.row.county_id
  ruleForm.name = data.row.name
  ruleForm.area = data.row.area
  ruleForm.population = data.row.population
  ruleForm.description = data.row.description
  ruleForm.code = data.row.code
  ruleForm.settlement_type = data.row.settlement_type
}



const saveEdits = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      ruleForm.model = 'settlement'
      console.log(ruleForm)

      updateOneRecord(ruleForm).then(() => { })

      // dialogFormVisible.value = false


    } else {
      console.log('error submit!', fields)
    }
  })
}


const DeleteIndicator = (data: TableSlotDefault) => {
  console.log('----->', data.row.id)
  let formData = {}
  formData.id = data.row.id
  formData.model = model
  DeleteRecord(formData)
  console.log(tableDataList.value)

  // remove the deleted object from array list 
  let index = tableDataList.value.indexOf(data.row);
  if (index !== -1) {
    tableDataList.value.splice(index, 1);
  }

}


const DownloadXlsx = async () => {
  console.log(tableDataList.value)

  // change here !
  let fields = [
    { label: "S/No", value: "index" }, // Top level data
    { label: "Name", value: "name" }, // Top level data
    { label: "Population", value: "population" }, // Custom format
    { label: "Area (HA)", value: "area" }, // Run functions
    { label: "County", value: "county" }, // Run functions
    { label: "Description", value: "description" }, // Run functions


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
    thisRecord.name = tableDataList.value[i].name
    thisRecord.index = i + 1
    thisRecord.population = tableDataList.value[i].population
    thisRecord.area = tableDataList.value[i].area
    thisRecord.county = tableDataList.value[i].county.name
    thisRecord.description = tableDataList.value[i].description

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
  <ContentWrap :title="t('Slums and Informal Settlements')" :message="t('Use the filters to subset')">
    <el-divider border-style="dashed" content-position="left">Filters</el-divider>

    <div style="display: inline-block; margin-left: 20px">
      <el-select v-model="value2" :onChange="handleSelectCounty" :onClear="handleClear" multiple clearable filterable
        collapse-tags placeholder="Filter by County">
        <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-select v-model="value3" :onChange="handleSelectSettlement" :onClear="handleClear" multiple clearable
        filterable collapse-tags placeholder="Filter by Settlement Name">
        <el-option v-for="item in settlementOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="DownloadXlsx" type="primary" :icon="Download" />
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="handleClear" type="primary" :icon="Filter" />
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-tooltip content="Add Settlement" placement="top">
        <el-button :onClick="AddSettlement" type="primary" :icon="Plus" />
      </el-tooltip>
    </div>

    <el-divider border-style="dashed" content-position="left">Results</el-divider>

    <Table :columns="columns" :data="tableDataList" :loading="loading" :selection="true" :pageSize="pageSize"
      :currentPage="currentPage">
      <template #action="data">
        <el-tooltip content="View Profile" placement="top">
          <el-button type="primary" :icon="TopRight" @click="viewProfile(data as TableSlotDefault)" circle />
        </el-tooltip>

        <el-tooltip content="View Households" placement="top">
          <el-button v-if="showAdminButtons" type="success" :icon="User" @click="viewHHs(data as TableSlotDefault)"
            circle />
        </el-tooltip>
        <el-tooltip content="View on Map" placement="top">
          <el-button type="warning" :icon="Position" @click="viewOnMap(data as TableSlotDefault)" circle />
        </el-tooltip>
        <el-tooltip content="View Documents" placement="top">
          <el-button type="primary" :icon="MessageBox" @click="viewDocuments(data as TableSlotDefault)" circle />
        </el-tooltip>
        <el-tooltip content="Edit" placement="top">
          <el-button type="success" :icon="Edit" @click="editSettlement(data as TableSlotDefault)" circle />
        </el-tooltip>

        <el-tooltip content="Delete" placement="top">
          <el-popconfirm confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
            title="Are you sure to delete this Settlement?" @confirm="DeleteIndicator(data as TableSlotDefault)">
            <template #reference>
              <el-button v-if="showAdminButtons" type="danger" :icon="Delete" circle />
            </template>
          </el-popconfirm>
        </el-tooltip>

      </template>
    </Table>
    <ElPagination layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
      v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 200, 10000]" :total="total" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />


    <el-dialog v-model="editDialogVisible" @close="handleClose" :title="formHeader" width="30%" draggable>
      <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px">

        <el-form-item label="Name">
          <el-input v-model="ruleForm.name" />
        </el-form-item>

        <el-form-item label="County">
          <el-select filterable v-model="ruleForm.county_id" :onChange="changeIndicator" placeholder="Select Indicator">
            <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>


        <el-form-item label="Type">
          <el-input v-model="ruleForm.settlement_type" />
        </el-form-item>


        <el-form-item label="Description">
          <el-input v-model="ruleForm.description" />
        </el-form-item>

        <el-form-item label="Area(ha)">
          <el-input-number v-model="ruleForm.area" />
        </el-form-item>

        <el-form-item label="Population">
          <el-input-number v-model="ruleForm.population" />
        </el-form-item>




      </el-form>
      <template #footer>

        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">Cancel</el-button>
          <el-button v-if="showEditSaveButton" type="primary" @click="saveEdits(ruleFormRef)">Save</el-button>
        </span>
      </template>
    </el-dialog>

  </ContentWrap>
</template>
