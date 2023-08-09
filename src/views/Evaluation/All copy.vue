<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { ElButton, ElSelect,ElRate,  MessageParamsWithType } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Position,
  TopRight,
  User,
  Plus,
  Download,
  Filter,
  MessageBox,
  Edit,
  InfoFilled,
  Delete
} from '@element-plus/icons-vue'

import { ref, reactive, computed } from 'vue'
import {
  ElPagination, ElInputNumber, ElTable, ElTag,
  ElTableColumn, ElDropdown, ElDropdownItem, ElDropdownMenu,
  ElDatePicker, ElTooltip, ElOption, ElDivider, ElDialog, ElForm, ElFormItem, ElUpload, ElLink, ElInput, ElCascader, ElOptionGroup, FormRules, ElPopconfirm
} from 'element-plus'

import { CreateRecord, DeleteRecord, updateOneRecord, deleteDocument, uploadDocuments, getfilteredGeo } from '@/api/settlements'
import { uploadFilesBatch } from '@/api/settlements'

import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { uuid } from 'vue-uuid'
import type { FormInstance } from 'element-plus'
import { getFile } from '@/api/summary'
import xlsx from "json-as-xlsx"
import { defineAsyncComponent } from 'vue';

import UploadComponent from '@/views/Components/UploadComponent.vue';
 

 import ListDocuments from '@/views/Components/ListDocuments.vue';





const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


console.log("userInfo--->", userInfo)


const isMobile = computed(() => appStore.getMobile)

console.log('IsMobile', isMobile)

const dialogWidth = ref()
const actionColumnWidth = ref()
const idColumnWidth = ref("50px")

if (isMobile.value) {
  dialogWidth.value = "90%"
  actionColumnWidth.value = "75px"
} else {
  dialogWidth.value = "25%"
  actionColumnWidth.value = "100px"


}
const addMoreDocuments = ref()
const currentRow = ref()

/// Uplaod docuemnts from a central component 
const mfield = 'settlement_id'
const ChildComponent = defineAsyncComponent(() => import('@/views/Components/UploadComponent.vue'));
const selectedRow = ref([])
const dynamicComponent = ref();
 const componentProps = ref({
      message: 'Hello from parent',
      showDialog:addMoreDocuments,
      data:currentRow.value,
      umodel:model,
      field:mfield
    });

 
 
function toggleComponent(row) {
  console.log('Compnnent data', row)
      componentProps.value.data=row
      dynamicComponent.value = null; // Unload the component
      addMoreDocuments.value = true; // Set any additional props

      setTimeout(() => {
        dynamicComponent.value = ChildComponent; // Load the component
  }, 100); // 0.1 seconds


    }


    
// component for docuemnts 
const rowData = ref()
const documentComponent = defineAsyncComponent(() => import('@/views/Components/ListDocuments.vue'));
const dynamicDocumentComponent = ref();
const DocumentComponentProps = ref({
  message: 'documents',
  data: rowData.value,
  docmodel: model,

});


function handleExpand(row) {
   dynamicDocumentComponent.value = null; // Unload the component
    rowData.value = row
    DocumentComponentProps.value.data = row
    setTimeout(() => {
      dynamicDocumentComponent.value = documentComponent; // Load the component
    }, 100); // 0.1 seconds
}





const documentCategory = ref()

const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
const indicatorsOptions = ref([])
const settlementOptions = ref([])
const categories = ref([])
const filteredIndicators = ref([])
const page = ref(1)
const pSize = ref(5)
const selCounties = []
const loading = ref(true)
const pageSize = ref(5)
const currentPage = ref(1)
const total = ref(0)
const downloadLoading = ref(false)
const showAdminButtons = ref(false)
const showEditButtons = ref(false)

// flag for admin buttons
if (userInfo.roles.includes("admin") || userInfo.roles.includes("kisip_staff")) {
  showAdminButtons.value = true
}

// Show Edit buttons 
if (userInfo.roles.includes("staff")|| userInfo.roles.includes("admin")
  || userInfo.roles.includes("county_admin") ||  userInfo.roles.includes("national_monitoring") ) {
    showEditButtons.value = true;
}
console.log("Show Buttons -->", showAdminButtons)

 

let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var filterValues = []
var tblData = []
const associated_Model = ''
const model = 'evaluation'
const associated_multiple_models = ['project', 'evaluation_type']
const nested_models = ['document', 'document_type'] // The mother, then followed by the child

//// ------------------parameters -----------------------////

const { t } = useI18n()
const AddDialogVisible = ref(false)
const formHeader = ref('Add Evaluation')
const showSubmitBtn = ref(true)
const showEditSaveButton = ref(false)
const morefileList = ref<UploadUserFile[]>([])



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


const handleSearchEvaluation = async (indicator: any) => {
  var selectOption = 'evaluation_type_id'
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
  formData.nested_models = nested_models

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

    //var dd = flattenJSON(arrayItem)

    tblData.push(arrayItem)
  })

  console.log('TBL-4f', tblData)
}

const projectOptions = ref([])
const getprojectList = async () => {
  const res = await getCountyListApi({
    params: {
      //   pageIndex: 1,
      //   limit: 100,
      curUser: 1, // Id for logged in user
      model: 'project',
      searchField: 'title',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received projects:', response)
    //tableDataList.value = response.data
    var ret = response.data

    loading.value = false
    // pass result to the makeoptions

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var opt = {}
      opt.value = arrayItem.id
      opt.label = arrayItem.title + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      projectOptions.value.push(opt)
    })
  })
}



const handleChangeProject = async (indicator: any) => {
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

  console.log('FilterValues:', filterValues)

  getFilteredData(filters, filterValues)
}

const handleDownload = () => {
  downloadLoading.value = true
  const data = tblData
  const fileName = 'indicators.xlsx'
  const exportType = exportFromJSON.types.csv
  if (data) exportFromJSON({ data, fileName, exportType })
}

const evaluationOptions = ref([])
const getEvaluationTypes = async () => {
  await getCountyListApi({
    params: {
      //   pageIndex: 1,
      //   limit: 100,
      curUser: 1, // Id for logged in user
      model: 'evaluation_type',
      searchField: 'title',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    // var ret = response

    console.log('Activities', response.data)
    response.data.forEach(function (arrayItem: { id: string; type: string }) {
      //console.log(arrayItem)
      var opt = {}
      opt.value = arrayItem.id
      opt.label = arrayItem.type + '(' + arrayItem.id + ')'

      //  console.log(countyOpt)
      evaluationOptions.value.push(opt)
    })


  })
}
const DocTypes = ref([])
const getDocumentTypes = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'document_type',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Document Typest:', response)
    //tableDataList.value = response.data
    var ret = response.data


    const nestedData = ret.reduce((acc, cur) => {
      const group = cur.group;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(cur);
      return acc;
    }, {});

    console.log(nestedData.Map)
    for (let property in nestedData) {
      let opts = nestedData[property];
      var doc = {}
      doc.label = property
      doc.options = []

      opts.forEach(function (arrayItem) {
        let opt = {}
        opt.value = arrayItem.id
        opt.label = arrayItem.type
        doc.options.push(opt)

      })
      DocTypes.value.push(doc)

    }
    console.log(DocTypes)

  })
}
getDocumentTypes()

getEvaluationTypes()
getprojectList()
getInterventionsAll()

 
const editEvaluation = (data: TableSlotDefault) => {
   

  push({
  name: 'AddEvaluation',
    query: { id: data.row.id }
  
  });

 
}


const DeleteEvaluation = (data: TableSlotDefault) => {
  console.log('----->', data)
  let formData = {}
  formData.id = data.id
  formData.model = model
  DeleteRecord(formData)
  console.log(tableDataList.value)

  // remove the deleted object from array list 
  let index = tableDataList.value.indexOf(data.id);
  if (index !== -1) {
    tableDataList.value.splice(index, 1);
  }

  getFilteredData(filters, filterValues)
}


const handleClose = () => {
  console.log("Clsoing the dialoig")
  showSubmitBtn.value = true
  showEditSaveButton.value = false

  ruleForm.id = ''
  ruleForm.title = ''
  ruleForm.type = ''
  ruleForm.start_date = ''
  ruleForm.end_date = ''
  //ruleForm.findings = null
  ruleForm.evaluation_type_id = null
  ruleForm.project_id = null

  formHeader.value = 'Add Evaluation'

}


const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  title: '',
  type: null,
  start_date: null,
  end_date: null,
  findings: [],
  evaluation_type_id: null,
  project_id: null,
})

const rules = reactive<FormRules>({
  title: [
    { required: true, message: 'Please provide a title', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }],
  type: [{ required: true, message: 'Type is required', trigger: 'blur' }],
  project_id: [{ required: true, message: 'The project   is required', trigger: 'blur' }],
  findings: [{ required: true, message: 'Finding is required', trigger: 'blur' }],
  evaluation_type_id: [{ required: true, message: 'Evaluation Type is required', trigger: 'blur' }],


})

const AddEvaluation = () => {
 // AddDialogVisible.value = true

  push({
     name: 'AddEvaluation'
  })

}


const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      ruleForm.model = model
      ruleForm.code = uuid.v4()
      const res = CreateRecord(ruleForm)

    } else {
      console.log('error submit!', fields)
    }
  })
}


const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      ruleForm.model = model

      updateOneRecord(ruleForm).then(() => { })

      // dialogFormVisible.value = false


    } else {
      console.log('error submit!', fields)
    }
  })
}

const findingsString = ref()
ruleForm.findings = computed(() => {

  if (findingsString.value !== '') {
    var findg = findingsString.value.split(',').map(value => value.trim());

  } else {
    var findg = ruleForm.findings
  }
  return findg
});


const downloadFile = async (data) => {

  console.log(data.name)

  const formData = {}
  formData.filename = data.name
  formData.responseType = 'blob'
  await getFile(formData)
    .then(response => {
      console.log(response)

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', data.name)
      document.body.appendChild(link)
      link.click()

    })
    .catch(error => {
      console.error('Error downloading file:', error);
    });

}

const removeDocument = (data: TableSlotDefault) => {
  console.log('----->', data)
  let formData = {}
  formData.id = data.id
  formData.model = model
  formData.filesToDelete = [data.name]
  deleteDocument(formData)
}


const addMoreDocs = (data: TableSlotDefault) => {

  currentRow.value = data

  addMoreDocuments.value = true

  console.log('currentRow', currentRow.value)

}

const submitMoreDocuments = async () => {
  console.log('More files.....', morefileList)

  // uploading the documents 
  const fileTypes = []
  const formData = new FormData()
  let files = []
  for (var i = 0; i < morefileList.value.length; i++) {
    console.log('------>file', morefileList.value[i])
    var format = morefileList.value[i].name.split('.').pop() // get file extension
    //  formData.append("file",this.multipleFiles[i],this.fileNames[i]+"_"+dateVar+"."+this.fileTypes[i]);
    fileTypes.push(format)
    // formData.append('files', fileList.value[i])
    // formData.file = fileList.value[i]

    formData.append('model', model)

    formData.append('files', morefileList.value[i].raw)
    formData.append('format', morefileList.value[i].name.split('.').pop())
    formData.append('category', documentCategory.value)
    formData.append('field_id', 'evaluation_id')

    formData.append('size', (morefileList.value[i].raw.size / 1024 / 1024).toFixed(2))
    formData.append('code', uuid.v4())
    formData.append('evaluation_id', currentRow.value.id)


  }


  console.log(currentRow.value.id)
  await uploadFilesBatch(formData)

}
const DownloadXlsx = async () => {
  console.log(tableDataList.value)

  // change here !
  let fields = [
    { label: "S/No", value: "index" }, // Top level data
    { label: "Title", value: "title" }, // Top level data
    { label: "Project", value: "project" }, // Custom format
    { label: "Type", value: "type" }, // Custom format
    { label: "Start", value: "start_date" }, // Custom format
    { label: "End", value: "end_date" }, // Custom format

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
    thisRecord.title = tableDataList.value[i].title
    thisRecord.project = tableDataList.value[i].project.title
    thisRecord.type = tableDataList.value[i].evaluation_type.type
    thisRecord.start_date = tableDataList.value[i].start_date
    thisRecord.end_date = tableDataList.value[i].end_date


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
const tableRowClassName = (data) => {
   console.log('Row Styling --------->', data.row)
  if (data.row.documents.length > 0) {
    return 'warning-row'
  }
  return ''
}

const combinedLessons = (row) => {
  const lessons = [];
  for (const key in row) {
    if (key.startsWith('lessons_') && Array.isArray(row[key])) {
      lessons.push(...row[key]);
    }
  }
  return lessons;
};



</script>

<template>
  <ContentWrap :title="t('Evaluations')" :message="t('Use the filters to subset')">
 
    <div style="display: inline-block; margin-left: 0px">
      <el-select
v-model="value3" :onChange="handleChangeProject" :onClear="handleClear" multiple clearable filterable
        collapse-tags placeholder="Filter by project intervention">
        <el-option v-for="item in projectOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-select
v-model="value4" :onChange="handleSearchEvaluation" :onClear="handleClear" multiple clearable filterable
        collapse-tags placeholder="Search for an Evaluation">
        <el-option v-for="item in evaluationOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>



    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="DownloadXlsx" type="primary" :icon="Download" />
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="handleClear" type="primary" :icon="Filter" />
    </div>
    <div style="display: inline-block; margin-bottom: 20px; margin-left: 20px">
      <el-tooltip content="Add Indicator" placement="top">
        <el-button v-if="showEditButtons" :onClick="AddEvaluation" type="primary" :icon="Plus" />
      </el-tooltip>
    </div>

 


    <el-table :data="tableDataList" :loading="loading" border >
    

      <el-table-column type="expand">
            <template #default="props">
              <div m="4">
                <h3>Documents</h3>
                <div>
                  <list-documents :is="dynamicDocumentComponent" v-bind="DocumentComponentProps" />
                </div>
                 <el-button style="margin-left: 10px;margin-top: 5px" size="small" v-if="showEditButtons" type="success" :icon="Plus" circle @click="toggleComponent(props.row)" />
              </div>
            </template>
          </el-table-column>
      <el-table-column label="Id" prop="id" :width="idColumnWidth" sortable />
      <el-table-column label="Title" prop="evaluation_title" sortable />
      <el-table-column label="Project" prop="project.title" sortable />
      <el-table-column label="Type" prop="evaluation_type.type" sortable />
 
      <el-table-column label="Rating (0-Poor, 5-best)"  prop="overall_rating" >
        <template #default="{ row }">
          <div>
            <el-rate
              v-model="row.overall_rating"
              disabled
              show-score
              text-color="#ff9900"
              score-template="{value}"
             />
          </div>
        </template>
      </el-table-column>


      <el-table-column label="Findings"  width="300px">
        <template #default="{ row }">
          <div>
            <el-tag v-for="(lesson, index) in combinedLessons(row)" :key="index">
            {{ lesson }}
          </el-tag>
          </div>
        </template>
      </el-table-column>



      <el-table-column fixed="right" label="Actions" :width="actionColumnWidth">
        <template #default="scope">
          <el-dropdown v-if="isMobile">
            <span class="el-dropdown-link">
              <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
v-if="showEditButtons" @click="editEvaluation(scope as TableSlotDefault)" :icon="Edit"
                  color="green">Edit</el-dropdown-item>
                <el-dropdown-item
v-if="showAdminButtons" @click="DeleteEvaluation(scope.row as TableSlotDefault)"
                  :icon="Delete" color="red">Delete</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <div v-else>

            <el-tooltip v-if="showEditButtons" content="Edit" placement="top">
              <el-button
type="success" size="small" :icon="Edit" @click="editEvaluation(scope as TableSlotDefault)"
                circle />
            </el-tooltip>


            <el-tooltip v-if="showAdminButtons" content="Delete" placement="top">
              <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
                title="Are you sure to delete this record?" width="150"
                @confirm="DeleteEvaluation(scope.row as TableSlotDefault)">
                <template #reference>
                  <el-button type="danger" size="small" :icon=Delete circle />
                </template>
              </el-popconfirm>
            </el-tooltip>

          </div>
        </template>

      </el-table-column>
    </el-table>


    <ElPagination
layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage" v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 50, 200, 10000]" :total="total" :background="true" @size-change="onPageSizeChange"
      @current-change="onPageChange" class="mt-4" />
  </ContentWrap>
 

 
</template>
