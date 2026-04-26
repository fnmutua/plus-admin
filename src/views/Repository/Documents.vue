<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi, getListWithoutGeo } from '@/api/counties'
import { ElButton, ElSelect } from 'element-plus'
import { ElOptionGroup } from 'element-plus'
import {
  Plus,
  Download,
  Filter,
  InfoFilled,
  Delete
} from '@element-plus/icons-vue'

import { ref, computed } from 'vue'
import {
  ElPagination, ElTooltip, ElOption, ElDivider, 
  ElDropdown, ElDropdownItem, ElDropdownMenu, ElPopconfirm
} from 'element-plus'
import { useRouter } from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { deleteDocument } from '@/api/settlements'
import { getFile } from '@/api/summary'
import xlsx from "json-as-xlsx"


const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


console.log("userInfo--->", userInfo)


const userIsAdmin = ref(false)



if (userInfo.roles.includes("admin")) {
  userIsAdmin.value = true
 }




const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
const value3 = ref([])
const value4 = ref([])
const value5 = ref([])

 const componentOptions = ref([])
 
const page = ref(1)
const pSize = ref(5)
const selCounties = []
const loading = ref(true)
const pageSize = ref(5)
const currentPage = ref(1)
const total = ref(0)
 
const showAdminButtons =  ref(appStore.getAdminButtons)



console.log("Show Buttons -->", showAdminButtons)



let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var filterValues = []
var tblData = []
const associated_Model = ''
const model = 'document'

const associated_multiple_models = ['project', 'settlement', 'indicator_category_report', 'document_type']
//// ------------------parameters -----------------------////

const { t } = useI18n()


const columns: TableColumn[] = [
  {
    field: 'id',
    label: t('Id'),

  },

  {
    field: 'name',
    label: t('Name'),
  },


  {
    field: 'document_type.type',
    label: t('Type')
  },

  {
    field: 'format',
    label: t('Format')
  },
  {
    field: 'size',
    label: t('Size(mb)')
  },
  {
    field: 'settlement.name',
    label: t('Settlement')
  },
  {
    field: 'project.title',
    label: t('Project')
  },
  {
    field: 'action',
    label: t('Actions')
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
  value4.value = ''
  value5.value = ''
  value6.value = ''
  pSize.value = 5
  currentPage.value = 1
  tblData = []
  //----run the get data--------
  getInterventionsAll()
}


const handleSelectReportType = async (indicator: any) => {
  var selectOption = 'category'
  if (!filters.includes(selectOption)) {
    filters.push(selectOption)
  }
  var index = filters.indexOf(selectOption) // 1
  console.log('category : index--->', index)

  // clear previously selected
  if (filterValues[index]) {
    // filterValues[index].length = 0
    filterValues.splice(index, 1)
  }

  if (!filterValues.includes(indicator) && indicator.length > 0) {
    filterValues.splice(index, 0, indicator) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
  }

  // expunge the filter if the filter values are null
  if (indicator.length === 0) {
    filters.splice(index, 1)
  }

  console.log('FilterValues:', filterValues)

  getFilteredData(filters, filterValues)
}

const handleSettlement = async (indicator: any) => {
  var selectOption = 'settlement_id'
  if (!filters.includes(selectOption)) {
    filters.push(selectOption)
  }
  var index = filters.indexOf(selectOption) // 1
  console.log('category : index--->', index)

  // clear previously selected
  if (filterValues[index]) {
    // filterValues[index].length = 0
    filterValues.splice(index, 1)
  }

  if (!filterValues.includes(indicator) && indicator.length > 0) {
    filterValues.splice(index, 0, indicator) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
  }

  // expunge the filter if the filter values are null
  if (indicator.length === 0) {
    filters.splice(index, 1)
  }

  console.log('FilterValues:', filterValues)

  getFilteredData(filters, filterValues)
}


const handleproject = async (indicator: any) => {
  var selectOption = 'project_id'
  if (!filters.includes(selectOption)) {
    filters.push(selectOption)
  }
  var index = filters.indexOf(selectOption) // 1
  console.log('category : index--->', index)

  // clear previously selected
  if (filterValues[index]) {
    // filterValues[index].length = 0
    filterValues.splice(index, 1)
  }

  if (!filterValues.includes(indicator) && indicator.length > 0) {
    filterValues.splice(index, 0, indicator) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
  }

  // expunge the filter if the filter values are null
  if (indicator.length === 0) {
    filters.splice(index, 1)
  }

  console.log('FilterValues:project', indicator, filters, filterValues)

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



const getFilteredData = async (selFilters, selfilterValues) => {
  const formData = {}
  formData.limit = pSize.value
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model
  //-Search field--------------------------------------------
  formData.searchField = 'title'
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

  const filteredItems = res.data.filter(item => item.document_type.group != 'Data');


  console.log('After Querry', res)
  tableDataList.value = filteredItems
  total.value = res.total

  tblData = [] // reset the table data
  console.log('TBL-b4', tblData)
  res.data.forEach(function () {
    //  console.log(countyOpt)
    // delete arrayItem[associated_Model]['geom'] //  remove the geometry column

    //var dd = flattenJSON(arrayItem)

    // tblData.push(dd)
  })

  console.log('TBL-4f', tblData)
}








const programmeOptions = ref([])
const getProgrammeOptions = async () => {
}




const projectOptions = ref([])
const getProjectOptions = async () => {
  const res = await getListWithoutGeo({
    params: {
      curUser: 1,
      model: 'project',
      searchField: 'title',
      searchKeyword: '',
      sort: 'ASC'
    }
  })
  projectOptions.value = res.data.map((item: any) => ({ value: item.id, label: item.title }))
}



const settlementOptions = ref([])
const getSettlementOptions = async () => {
  const res = await getListWithoutGeo({
    params: {
      curUser: 1,
      model: 'settlement',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  })
  settlementOptions.value = res.data.map((item: any) => ({ value: item.id, label: item.name }))
}


const MEReportsOptions = ref([])




getProjectOptions()
getSettlementOptions()
getProgrammeOptions()
getInterventionsAll()


const AddDocuments = () => {


  push({
    path: '/data/docs',
    name: 'ImportDocuments'
  })

}

const DeleteFile = (data: TableSlotDefault) => {
  console.log('----->', data)
  let formData = {}
  formData.id = data.row.id
  formData.model = 'indicator_category_report'
  formData.filesToDelete = [data.row.name]

  deleteDocument(formData)

  // remove the deleted object from array list 
  let index = tableDataList.value.indexOf(data);
  if (index !== -1) {
    tableDataList.value.splice(index, 1);
  }

}

const downloadFile = async (data) => {

  console.log(data.row.name)

  const formData = {}
  formData.filename = data.row.name
  formData.responseType = 'blob'
  await getFile(formData)
    .then(response => {
      console.log(response)

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', data.row.name)
      document.body.appendChild(link)
      link.click()

    })
    .catch(error => {
      console.error('Error downloading file:', error);
    });

}




const handleDownload = async () => {
  console.log(tableDataList.value)

  // change here !
  let fields = [
    { label: "S/No", value: "index" }, // Top level data
    { label: "Name", value: "name" }, // Top level data
    { label: "Size", value: "size" }, // Custom format
    { label: "Type", value: "type" }, // Run functions
    { label: "Report", value: "report" }, // Run functions
    { label: "Settlement", value: "settlement" }, // Run functions
    { label: "Project", value: "project" }, // Run functions

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
    thisRecord.report = tableDataList.value[i].indicator_category_report ? tableDataList.value[i].indicator_category_report.title : ''
    thisRecord.settlement = tableDataList.value[i].settlement ? tableDataList.value[i].settlement.name : ''
    thisRecord.project = tableDataList.value[i].project ? tableDataList.value[i].project.title : ''
    thisRecord.size = tableDataList.value[i].size
    thisRecord.type = tableDataList.value[i].category


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

const isMobile = computed(() => appStore.getMobile)

console.log('IsMobile', isMobile)

const dialogWidth = ref()
const actionColumnWidth = ref()

if (isMobile.value) {
  dialogWidth.value = "90%"
  actionColumnWidth.value = "75px"
} else {
  dialogWidth.value = "25%"
  actionColumnWidth.value = "160px"

}

const DocTypes = ref([])
const getDocumentTypes = async () => {
}
getDocumentTypes()

</script>

<template>
  <ContentWrap :title="t('Document Repository')" :message="t('Use the filters to subset')">
    <el-divider border-style="dashed" content-position="left">Filters</el-divider>

    <div style="display: inline-block; margin-left: 20px">
      <el-select
v-model="value3" :onChange="handleSelectReportType" :onClear="handleClear" multiple clearable filterable
        collapse-tags placeholder="Filter by Type">
        <el-option-group v-for="group in DocTypes" :key="group.label" :label="group.label">
          <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
        </el-option-group>
      </el-select>
    </div>

    <div style="display: inline-block; margin-left: 5px">
      <el-select
v-model="value4" multiple clearable filterable :onChange="handleSettlement"
        placeholder="Filter by Settlement">
        <el-option
v-for="(option, index) in settlementOptions" :key="index" :label="option.label" :value="option.value"
          :disabled="option.disabled" />
      </el-select>
    </div>

    <div style="display: inline-block; margin-left: 5px">
      <el-select v-model="value5" multiple clearable filterable :onChange="handleproject" placeholder="Filter by Project">
        <el-option
v-for="(option, index) in projectOptions" :key="index" :label="option.label" :value="option.value"
          :disabled="option.disabled" />
      </el-select>
    </div>




    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="handleDownload" type="primary" :icon="Download" />
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="handleClear" type="primary" :icon="Filter" />
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-tooltip content="Upload Documents" placement="top">
        <el-button :onClick="AddDocuments" type="primary" :icon="Plus" />
      </el-tooltip>
    </div>

    <el-divider border-style="dashed" content-position="left">Results</el-divider>

    <Table
:columns="columns" :data="tableDataList" :loading="loading" :selection="false" :pageSize="pageSize"
      :currentPage="currentPage">
      <template #action="data">


        <el-dropdown v-if="isMobile">
          <span class="el-dropdown-link">
            <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
@click="downloadFile(data as TableSlotDefault)"
                :icon="Download">Download</el-dropdown-item>
              <el-dropdown-item
v-if="showAdminButtons" @click="DeleteFile(data as TableSlotDefault)" :icon="Delete"
                color="red">Delete</el-dropdown-item>

            </el-dropdown-menu>
          </template>
        </el-dropdown>


        <div v-else>



          <el-tooltip content="Edit" placement="top">
            <el-button type="success" :icon="Download" @click="downloadFile(data as TableSlotDefault)" circle />
          </el-tooltip>

          <el-tooltip content="Delete" placement="top">
            <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
              title="Are you sure to delete this record?" @confirm="DeleteFile(data as TableSlotDefault)">
              <template #reference>
                <el-button v-if="showAdminButtons" type="danger" :icon="Delete" circle />
              </template>
            </el-popconfirm>
          </el-tooltip>
        </div>



      </template>
    </Table>
    <ElPagination
:layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'" v-model:currentPage="currentPage" v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 50, 200, 10000]" :total="total" :background="true" @size-change="onPageSizeChange"
      @current-change="onPageChange" class="mt-4"
      :small="isMobile"
      :pager-count="isMobile ? 3 : 7" />
  </ContentWrap>
</template>
