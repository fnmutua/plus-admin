<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty, uploadFilesBatch } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { ElButton, ElMessageBox, ElSelect, FormInstance } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Plus,
  Edit,
  Download,
  Filter,
  Delete,
  UploadFilled,
  InfoFilled
} from '@element-plus/icons-vue'

import { ref, reactive, computed, h } from 'vue'
import {
  ElPagination, ElInputNumber, ElTable,
  ElTableColumn, ElDropdown, ElDropdownItem, ElDropdownMenu,
  ElDatePicker, ElTooltip, ElOption, ElDivider, ElDialog, ElForm, ElFormItem, ElUpload, ElLink, ElInput, ElCascader, ElOptionGroup, FormRules, ElPopconfirm
} from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord, deleteDocument, uploadDocuments } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import type { UploadProps, UploadUserFile } from 'element-plus'
import readXlsxFile from 'read-excel-file'
import { getModelSpecs } from '@/api/fields'
import { BatchImportUpsert } from '@/api/settlements'
import { UserType } from '@/api/register/types'
import { Icon } from '@iconify/vue';
import { getFile } from '@/api/summary'
import xlsx from "json-as-xlsx"


//import downloadForOfflineRounded from '@iconify-icons/material-symbols/download-for-offline-rounded';





const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


console.log("userInfo--->", userInfo)







const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
const indicatorsOptions = ref([])
const countyOptions = ref([])
const projectOptions = ref([])


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
if (userInfo.roles.includes("kisip_staff") || userInfo.roles.includes("sud_staff")|| userInfo.roles.includes("admin")
  || userInfo.roles.includes("county_admin") ||  userInfo.roles.includes("national_monitoring") ) {
    showEditButtons.value = true;
}
console.log("Show Buttons -->", showAdminButtons)


const AddDialogVisible = ref(false)
const ImportDialogVisible = ref(false)
const formHeader = ref('Add Report')
const showSubmitBtn = ref(false)
const showProcessBtn = ref(true)
const addMoreDocuments = ref(false)

const showEditSaveButton = ref(false)
const cascadeOptions = ref([])
let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = ['userId']
var filterValues = [[userInfo.id]]  // remember to change here!
var tblData = []
const associated_Model = ''
const model = 'indicator_category_report'
const associated_multiple_models = ['document','settlement', 'county']
const nested_models = ['indicator_category', 'indicator'] // The mother, then followed by the child

//// ------------------parameters -----------------------////

const fileUploadList = ref<UploadUserFile[]>([])


const fieldSet = ref([])
const show = ref(false)


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

const handleSelectIndicatorCategory = async (indicator: any) => {
  var selectOption = 'indicator_category_id'
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

  if (!filterValues.includes(indicator) && indicator.length > 0) {
    filterValues.splice(index, 0, indicator) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
  }

  // expunge the filter if the filter values are null
  if (indicator.length === 0) {
    filters.splice(index, 1)
  }

  console.log('FilterValues:', filterValues)
  // here we filter the list of settlements based on the selected county
  filteredIndicators.value = categories.value.filter(
    (category) => category.indicator == indicator
  )
  console.log('filyterested  ------>', filteredIndicators)
  //makeprojectOptions(filteredIndicators)

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


const getModeldefinition = async (selModel) => {

  console.log(selModel)
  var formData = {}
  formData.model = selModel
  console.log("gettign fields")


  await getModelSpecs(formData).then((response) => {

    var data = response.data

    var fields = data.filter(function (obj) {
      return (obj.field !== 'id');
    });

    var fields2 = fields.filter(function (obj) {
      return (obj.field !== 'geom');
    });

    console.log("fields:", fields2)
    //health_facility_fields.value = response.data
    fieldSet.value = fields2
  })


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

  formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = selFilters
  formData.filterValues = selfilterValues
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = nested_models

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('Reports collected........', res)
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



const getIndicatorNames = async () => {
  const formData = {}

  formData.curUser = 1 // Id for logged in user
  formData.model = 'indicator_category'
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  formData.assocModel = ''

  // - multiple filters -------------------------------------
  formData.filters = []
  formData.filterValues = []
  formData.associated_multiple_models = ['project', 'category', 'activity']
  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)
  console.log('Idnicator_categor', res)

  res.data.forEach(function (arrayItem: { id: string; type: string }) {
    var opt = {}
    console.log(arrayItem)
    opt.value = arrayItem.id
    opt.label = arrayItem.indicator_name + ' | '  +arrayItem.activity.title + '|' + arrayItem.project.title + ' | ' + arrayItem.category.category
    opt.title = arrayItem.category.title
    opt.project_id = arrayItem.project.id
    opt.county_id = arrayItem.project.county_id
    opt.subcounty_id = arrayItem.project.subcounty_id
    opt.settlement_id = arrayItem.project.settlement_id

    indicatorsOptions.value.push(opt)
  })

}


const getProjects = async () => {
  const res = await getCountyListApi({
    params: {
      //   pageIndex: 1,
      //   limit: 100,
      curUser: 1, // Id for logged in user
      model: 'project',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then(async (response: { data: any }) => {
    console.log('Projects response:', response)
    //tableDataList.value = response.data
    var ret = response.data


    loading.value = false


    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var opt = {}
      opt.value = arrayItem.id
      opt.label = arrayItem.title + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      projectOptions.value.push(opt)
    })

  })
}





const props1 = {
  checkStrictly: true,
}

const editReport = (data: TableSlotDefault) => {
  showSubmitBtn.value = false

  showEditSaveButton.value = true
  console.log(data)
  ruleForm.id = data.id
  ruleForm.county_id = data.county_id
  ruleForm.subcounty_id = data.subcounty_id

  ruleForm.settlement_id = data.settlement_id
  ruleForm.project_id = data.project_id
  ruleForm.date = data.date
  ruleForm.amount = data.amount
  ruleForm.indicator_category_id = data.indicator_category_id

  ruleForm.code = data.code

  formHeader.value = 'Edit Report'
  fileUploadList.value = data.documents

  console.log(' ruleForm.location', ruleForm.location)

  AddDialogVisible.value = true
}



const DeleteReport = (data: TableSlotDefault) => {
  console.log('----->', data)
  let formData = {}
  formData.id = data.id
  formData.model = 'indicator_category_report'


  DeleteRecord(formData)
  console.log("Docs to de;ete", data.documents.length)

  // Delete docuemnts only if there's any docuemnt to delete 
  if (data.documents.length > 0) {
    formData.filesToDelete = data.documents
    deleteDocument(formData)

    // remove the deleted object from array list 
    let index = tableDataList.value.documents.indexOf(data);
    if (index !== -1) {
      tableDataList.value.documents.value.splice(index, 1);
    }
  }


  console.log(tableDataList.value)

  // remove the deleted object from array list 
  let index = tableDataList.value.indexOf(data);
  if (index !== -1) {
    tableDataList.value.splice(index, 1);
  }

}

const removeDocument = (data: TableSlotDefault) => {
  console.log('----->', data)
  let formData = {}
  formData.id = data.id
  formData.model = 'indicator_category_report'
  formData.filesToDelete = [data.name]



  deleteDocument(formData)



}

const currentRow = ref()
const addMoreDocs = (data: TableSlotDefault) => {

  currentRow.value = data

  addMoreDocuments.value = true

  console.log('currentRow', currentRow.value)

}
const handleClose = () => {

  console.log("Closing the dialoig")
  showSubmitBtn.value = true
  showEditSaveButton.value = false
  ruleForm.indicator_category_id = null
  ruleForm.date = null
  ruleForm.amount = null
  ruleForm.location = []

  formHeader.value = 'Add Report'
  AddDialogVisible.value = false

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
    // formData.append('file', fileList.value[i])
    // formData.file = fileList.value[i]

    formData.append('model', model)

    formData.append('file', morefileList.value[i].raw)
    formData.append('format', morefileList.value[i].name.split('.').pop())
    formData.append('category', documentCategory.value)
    formData.append('field_id', 'report_id')

    formData.append('size', (morefileList.value[i].raw.size / 1024 / 1024).toFixed(2))
    formData.append('code', uuid.v4())
    formData.append('report_id', currentRow.value.id)


  }


  console.log(currentRow.value.id)
  await uploadFilesBatch(formData)

}


const changeIndicator = async (indicator: any) => {
  ruleForm.indicator_id = indicator

  var filtredOptions = indicatorsOptions.value.filter(function (el) {
    return el.value == indicator
  });

  ruleForm.project_id = filtredOptions[0].project_id
  ruleForm.settlement_id = filtredOptions[0].settlement_id
  ruleForm.county_id = filtredOptions[0].county_id
  ruleForm.subcounty_id = filtredOptions[0].subcounty_id


  console.log("Filtered Indicators", filtredOptions[0])
  //ruleForm.indicator_category_title = filtredOptions[0].category_title

}



function getQuarter(date = new Date()) {
  return Math.floor(date.getMonth() / 3 + 1);
}

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  indicator_category_id: '',
  project_id: '',
  settlement_id: '',
  subcounty_id: '',
  county_id: '',
  period: getQuarter,
  date: new Date(),
  amount: '',
  files: '',
  userId: userInfo.id,
  code: ''
})

const rules = reactive<FormRules>({
  indicator_id: [
    { required: true, message: 'Please provide indicator name', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }
  ],
  category_id: [
    { required: true, message: 'Indicator category is required', trigger: 'blur' }],
  frequency: [{ required: true, message: 'The Indicator frequency is required', trigger: 'blur' }],

})

const AddReport = () => {
  AddDialogVisible.value = true
  showSubmitBtn.value = true
}

const ImportReports = () => {
  ImportDialogVisible.value = true
}

const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ruleForm.model = 'indicator_category_report'
      ruleForm.period = getQuarter()
      ruleForm.code = uuid.v4()
      ruleForm.userId = userInfo.id
      const report = await CreateRecord(ruleForm)   // first save the form on DB
      console.log("Report", report.data.id)

      // uploading the documents 
      const fileTypes = []
      const formData = new FormData()
      let files = []
      for (var i = 0; i < fileUploadList.value.length; i++) {
        console.log('------>file', fileUploadList.value[i])
        var format = fileUploadList.value[i].name.split('.').pop() // get file extension
        //  formData.append("file",this.multipleFiles[i],this.fileNames[i]+"_"+dateVar+"."+this.fileTypes[i]);
        fileTypes.push(format)
        // formData.append('file', fileList.value[i])
        // formData.file = fileList.value[i]
        formData.append('file', fileUploadList.value[i].raw)
        formData.append('DocType', format)

      }


      formData.append('parent_code', report.data.id)
      formData.append('model', model)
      formData.append('grp', 'M&E Documentation')
      formData.append('code', uuid.v4())
      formData.append('column', 'report_id')


      // formData.append('DocTypes', fileTypes)

      console.log(formData)
      await uploadDocuments(formData)


      AddDialogVisible.value = false
      handleClose()

    } else {
      console.log('error submit!', fields)
    }
  })
}


const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ruleForm.model = 'indicator_category_report'
      ruleForm.userId = userInfo.id
      console.log(ruleForm.value)
      await updateOneRecord(ruleForm).then(() => { })

      // dialogFormVisible.value = false

      const fileTypes = []
      const updateformData = new FormData()

      for (var i = 0; i < fileUploadList.value.length; i++) {
        console.log('------>file', fileUploadList.value[i])
        var format = fileUploadList.value[i].name.split('.').pop() // get file extension
        //  formData.append("file",this.multipleFiles[i],this.fileNames[i]+"_"+dateVar+"."+this.fileTypes[i]);
        fileTypes.push(format)
        // formData.append('file', fileList.value[i])
        // formData.file = fileList.value[i]
        updateformData.append('file', fileUploadList.value[i].raw)
        updateformData.append('DocType', format)

      }


      updateformData.append('parent_code', ruleForm.id)
      updateformData.append('model', model)
      updateformData.append('grp', 'M&E Documentation')
      updateformData.append('code', uuid.v4())
      updateformData.append('column', 'report_id')


      // formData.append('DocTypes', fileTypes)

      console.log(updateformData)
      await uploadDocuments(updateformData)



    } else {
      console.log('error submit!', fields)
    }
  })
}


const batchData = ref([])
const submitBatchImport = async () => {
  console.log('upload--->', uploadedData.value)
  for (let i = 0; i < uploadedData.value.length; i++) {

    let feature = uploadedData.value[i]
    let conv_feature = {}
    for (var prop in feature) {
      var matched_field = fieldSet.value.filter((obj) => {
        // console.log('+++++', obj)
        return obj.match === prop
      })
      //  console.log(i, matched_field)
      if (matched_field.length > 0) {
        conv_feature[matched_field[0].field] = feature[prop]  // Assign Field Vlue 
      }

      //console.log(conv_feature)
    }
    batchData.value.push(conv_feature)
  }
  console.log('processed:', batchData)

  // ************** prepare data to server ***************** //

  var formData = {}
  formData.model = model
  formData.data = batchData.value


  console.log("importData--->", formData)


  // ************** Send data to server ***************** //
  await BatchImportUpsert(formData)
    .catch((error) => {
      console.log('Error------>', error.response.data.message)
      ElMessage.error(error.response.data.message)
    })



}




/// Import multiple reports - ----------------
// ----------------------------------------------
//const parentModels = ['county']
const parentModels = ['county', 'settlement', 'indicator_category']
const parentCodes = ['countyCode', 'settlementCode', 'indicator_categoryCode']
//const parentCodes = ['countyCode', 'settlementCode', 'indicator_categoryCode']
//const parentCodes = ['countyCode']


const uploadedData = ref([])

const parentData = ref([]);
const getParentOptions = async (parent, parentSNo) => {

  await getCountyListApi({
    params: {
      curUser: 1, // Id for logged in user
      model: parent,
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    //tableDataList.value = response.data
    const ret = response.data
    //  console.log('Received response:', parent, ret)
    parentData.value.push(ret)





  })
}

const fileList = ref<UploadUserFile[]>([])
const morefileList = ref<UploadUserFile[]>([])

const handleRemove: UploadProps['onRemove'] = (file, uploadFiles) => {
  console.log(file, uploadFiles)
  show.value = false
  uploadedData.value = []
  batchData.value = []
  fieldSet.value = []

}

const handlePreview: UploadProps['onPreview'] = (uploadFile) => {
  console.log(uploadFile)
}

const handleExceed: UploadProps['onExceed'] = (files, uploadFiles) => {
  ElMessage.warning(
    `The limit is 1, you selected ${files.length} files this time, add up to ${files.length + uploadFiles.length
    } totally`
  )
}

const beforeRemove: UploadProps['beforeRemove'] = (uploadFile) => {
  return ElMessageBox.confirm(`Cancel the uploading of  ${uploadFile.name} ?`).then(
    () => true,
    () => false
  )
}


const matchOptions = ref([])
const makeOptions = (list) => {
  matchOptions.value = []
  for (let i = 0; i < list.length; i++) {
    var opt = {}
    opt.value = list[i]
    opt.label = list[i]
    matchOptions.value.push(opt)
  }
}

const file = ref()
const readXLSX = async (event) => {
  console.log('on file change.......', event)
  //file.value = event.target.files ? event.target.files[0] : null;   // Direct upload 
  file.value = event   // called from the uplaod funtion 

  console.log('The file---->', file)

  await readXlsxFile(file.value).then((rows) => {
    const fields = Object.values(rows[0]) //  get all proterit4s of the first feature
    console.log("fields-->", fields)


    for (let j = 1; j < rows.length; j++) {
      var record = {}
      for (let i = 0; i < fields.length; i++) {
        var f = fields[i]
        var v = rows[j][i]
        record[f] = v
        //  console.log(record)
      }

      console.log("record", record) // Push to the temporary holder
      uploadedData.value.push(record)

    }  // remove header row

  })





  console.log('Parent data', parentData.value)



  for (let k = 0; k < parentData.value.length; k++) {
    console.log('processing parent', k)
    var pcode = parentCodes[k]
    let editedArrray = []
    console.log('processing code', pcode)

    //  console.log(uploadedData.value[1][pcode])

    for (let i = 0; i < uploadedData.value.length; i++) {


      var parentMatch = parentData.value[k].filter(function (el) {
        return el.code === uploadedData.value[i][pcode]
      });


      if (parentMatch.length > 0) {
        let pkey = parentModels[k] + '_id'
        console.log('parentMatch', pkey, parentMatch)

        parentMatch[0][pkey] = parentMatch[0]['id'];
        console.log(parentMatch[0])


        const keys_to_keep = [pkey];
        const result = parentMatch.map(e => {
          const obj = {};
          keys_to_keep.forEach(k => obj[k] = e[k])
          return obj;
        });

        //  console.log(result);


        const match = { ...uploadedData.value[i], ...result[0] };
        editedArrray.push(match)
      }

    }



    console.log('Proceeed............')
    // proceed
    if (editedArrray.length > 0) {
      uploadedData.value = editedArrray.slice(0);
    }

  }

  const mergedfields = (Object.getOwnPropertyNames(uploadedData.value[0]));  // get properties from first row

  console.log('mergedfields', mergedfields)

  makeOptions(mergedfields)
  show.value = true
  showSubmitBtn.value = true
  showProcessBtn.value = false
}

const submitFiles = async () => {
  console.log('on Submit....', fileList.value.length)


  if (fileList.value.length == 0) {
    ElMessage.error('Select a  File first!')
  } else {
    var rfile = fileList.value[0].raw

    console.log("File type", rfile.name.split('.').pop())
    let reader = new FileReader()
    let ftype = rfile.name.split('.').pop()
    if (ftype == 'xlsx') {

      // Get the parents 

      for (let parent in parentModels) {

        await getParentOptions(parentModels[parent], parent)


      }
      console.log('parent data ---->', parentData.value)
      reader.onload = readXLSX(rfile)
    }
    else {
      console.log("Wrong File Format")
      ElMessage.error('Wrong File Format!. Select XLSX files only!')

    }

  }
}

getModeldefinition(model)

getIndicatorNames()
//getCategoryOptions()
getInterventionsAll()


//getProjects()

 

const tableRowClassName = (data) => {
   console.log('Row Styling --------->', data.row)
  if (data.row.documents.length > 0) {
    return 'warning-row'
  }
  return ''
}

const documentCategory = ref()



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


const DownloadXlsx = async () => {
  console.log(tableDataList.value)

  // change here !
  let fields = [
    { label: "S/No", value: "index" }, // Top level data
    { label: "Indicator", value: "indicator" }, // Top level data
    { label: "Category", value: "category" }, // Top level data
    { label: "Quantity", value: "quantity" }, // Custom format
    { label: "Settlement", value: "settlement" }, // Custom format
    { label: "County", value: "county" }, // Custom format
    { label: "Date", value: "date" }, // Custom format

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
    thisRecord.indicator = tableDataList.value[i].indicator_category.indicator.name
    thisRecord.category = tableDataList.value[i].indicator_category.category_title
    thisRecord.quantity = tableDataList.value[i].amount
    thisRecord.settlement = tableDataList.value[i].settlement.name
    thisRecord.county = tableDataList.value[i].county.name
     thisRecord.date = tableDataList.value[i].date


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
  <ContentWrap :title="t('Monitoring and Evaluation Reports')" :message="t('Use the filters to subset')">
 
    <div style="display: inline-block; margin-left: 0px">
      <el-select
v-model="value2" :onChange="handleSelectIndicatorCategory" :onClear="handleClear" multiple clearable
        filterable collapse-tags placeholder="Filter by Project/Indicator">
        <el-option v-for="item in indicatorsOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>




    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="DownloadXlsx" type="primary" :icon="Download" />
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="handleClear" type="primary" :icon="Filter" />
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-tooltip content="Add Report " placement="top">
        <el-button v-if="showEditButtons" :onClick="AddReport" type="primary" :icon="Plus" />
      </el-tooltip>
    </div>

    <div style="display: inline-block; margin-left: 20px">
      <el-tooltip content="Import" placement="top">
        <el-button v-if="showAdminButtons" :onClick="ImportReports" type="primary" :icon="UploadFilled" />
      </el-tooltip>
    </div>



     <el-table :data="tableDataList" style="width: 100%; margin-top: 10px;" border  :row-class-name="tableRowClassName">
      <el-table-column type="expand">
        <template #default="props">
          <div m="4">
            <h3>Documents</h3>
            <el-table :data="props.row.documents" class="mb-4">
              <el-table-column label="Name" prop="name" />
              <el-table-column label="Type" prop="document_type.type" />
              <el-table-column label="Size(mb)" prop="size" />

              <el-table-column label="Operations">
                <template #default="scope">
                  <el-link :href="null" @click="downloadFile(scope.row)">
                    <Icon icon="material-symbols:download-for-offline-rounded" color="#46c93a" width="36" />
                  </el-link>

                  <el-tooltip content="Delete" placement="top">
                    <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled"
                      icon-color="#626AEF" title="Are you sure to delete this document?"
                      @confirm="removeDocument(scope.row)">
                      <template #reference>
                        <el-button v-if="showAdminButtons" type="danger" :icon=Delete circle />
                      </template>
                    </el-popconfirm>
                  </el-tooltip>
                </template>
              </el-table-column>
            </el-table>
            <el-button
v-if="showEditButtons" type="success" :icon="Plus" circle @click="addMoreDocs(props.row)"
              style="margin-left: 10px;margin-top: 5px" size="small" />
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Indicator" width="400" prop="indicator_category.indicator.name" sortable />
      <el-table-column label="Settlement" prop="settlement.name" sortable />
      <!-- <el-table-column label="County" prop="county.name" sortable /> -->
      <!-- <el-table-column label="Unit" prop="indicator_category.indicator.unit" sortable /> -->
      <el-table-column label="Category" prop="indicator_category.category_title" sortable />
      <el-table-column label="Amount" prop="amount" sortable />
      <el-table-column label="Status" prop="status" sortable />
      <el-table-column fixed="right" label="Actions" :width="actionColumnWidth">
        <template #default="scope">
          <el-dropdown v-if="isMobile">
            <span class="el-dropdown-link">
              <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
v-if="showEditButtons" @click="editReport(scope as TableSlotDefault)"
                  :icon="Edit">Edit</el-dropdown-item>
                <el-dropdown-item
v-if="showAdminButtons" @click="DeleteReport(scope.row as TableSlotDefault)"
                  :icon="Delete" color="red">Delete</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>


          <div v-else>



            <el-tooltip content="Edit" placement="top">
              <el-button
v-if="showEditButtons" type="success" :icon="Edit"
                @click="editReport(scope.row as TableSlotDefault)" circle />
            </el-tooltip>

            <el-tooltip content="Delete" placement="top">
              <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
                title="Are you sure to delete this report?" @confirm="DeleteReport(scope.row as TableSlotDefault)">
                <template #reference>
                  <el-button v-if="showAdminButtons" type="danger" :icon=Delete circle />
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

  <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formHeader" :width="dialogWidth" draggable>

    <el-row :gutter="10">

      <el-col :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
        <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-position="left">

          <el-form-item label="Indicator">
            <el-select
filterable v-model="ruleForm.indicator_category_id" :onChange="changeIndicator"
              placeholder="Select Indicator">
              <el-option v-for="item in indicatorsOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>



          <el-form-item label="Date">
            <el-date-picker v-model="ruleForm.date" type="date" placeholder="Pick a day" />
          </el-form-item>
          <el-form-item label="Quantity">
            <el-input-number v-model="ruleForm.amount" />
          </el-form-item>



        </el-form>

      </el-col>

    </el-row>
    <template #footer>

      <span class="dialog-footer">

        <el-row :gutter="10">

          <el-col :xl="24" :lg="24" :md="24" :sm="24" :xs="24">

            <el-button @click="AddDialogVisible = false">Cancel</el-button>
            <el-button v-if="showSubmitBtn" type="primary" @click="submitForm(ruleFormRef)">Submit</el-button>
            <el-button v-if="showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>


          </el-col>


        </el-row>
      </span>
    </template>
  </el-dialog>

  <el-dialog
v-model="ImportDialogVisible" @close="handleClose" title="Import multiple reports" :width="dialogWidth"
    draggable>
    <el-upload
class="upload-demo" drag action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" multiple
      v-model:file-list="fileList" :on-preview="handlePreview" :on-remove="handleRemove" :before-remove="beforeRemove"
      :limit="5" :on-exceed="handleExceed" :auto-upload="false">
      <div class="el-upload__text"> Drop .xlsx file here or <em>click to upload</em> </div>
    </el-upload>

    <el-table size="small" v-if="show" :data="fieldSet" stripe="stripe">
      <el-table-column prop="column" label="Field">
        <template #default="scope">
          <el-input v-model="scope.row.field" controls-position="left" disabled />
        </template>
      </el-table-column>
      <el-table-column prop="match" label="Match">
        <template #default="scope">
          <el-select v-model="scope.row.match" filterable placeholder="Select">
            <el-option v-for="item in matchOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>

      <span class="dialog-footer">
        <el-button @click="ImportDialogVisible = false">Cancel</el-button>
        <el-button v-if="showProcessBtn" type="secondary" @click="submitFiles()">Process</el-button>
        <el-button v-if="showSubmitBtn" type="primary" @click="submitBatchImport()">Submit</el-button>
        <el-button v-if="showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>
      </span>
    </template>
  </el-dialog>


  <el-dialog v-model="addMoreDocuments" title="Upload More Documents" :width="dialogWidth">

    <el-select v-model="documentCategory" placeholder="Select Type" clearable filterable class="mb-4">
      <el-option-group v-for="group in DocTypes" :key="group.label" :label="group.label">
        <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
      </el-option-group>
    </el-select>


    <el-upload
v-model:file-list="morefileList" class="upload-demo"
      action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" multiple :on-preview="handlePreview"
      :on-remove="handleRemove" :before-remove="beforeRemove" :limit="5" :auto-upload="false" :on-exceed="handleExceed">
      <el-button type="primary">Click to upload</el-button>
      <template #tip>
        <div class="el-upload__tip">
          jpg/png files with a size less than 500KB.
        </div>
      </template>
    </el-upload>
    <el-button type="secondary" @click="submitMoreDocuments()">Submit</el-button>

  </el-dialog>
</template>

<style>
.el-table .danger-row {
  --el-table-tr-bg-color: var(--el-color-danger-light-9);
}

.el-table .success-row {
  --el-table-tr-bg-color: var(--el-color-success-light-9);
}
</style>