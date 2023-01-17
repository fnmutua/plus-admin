<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty } from '@/api/settlements'
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

import { ref, reactive, h } from 'vue'
import {
  ElPagination, ElInputNumber, ElTable,
  ElTableColumn,
  ElDatePicker, ElTooltip, ElOption, ElDivider, ElDialog, ElForm, ElFormItem, ElUpload, ElLink, ElInput, ElCascader, FormRules, ElPopconfirm
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

// flag for admin buttons
if (userInfo.roles.includes("admin") || userInfo.roles.includes("kisip_staff")) {
  showAdminButtons.value = true
}

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
const associated_multiple_models = ['settlement', 'county', 'document']
const nested_models = ['indicator_category', 'indicator'] // The mother, then followed by the child

//// ------------------parameters -----------------------////

const fileUploadList = ref<UploadUserFile[]>([])


const fieldSet = ref([])
const show = ref(false)


const { t } = useI18n()
const formatter = (row) => {
  console.log('row', row)
  if (row.document.name) {
    return h(ElLink, { href: row.document.name, download: row.document.name, type: 'danger' }, h(Icon, {
      icon: "ic:outline-download-for-offline", height: '36'
    }))
  } else {
    return
  }

}


const columns: TableColumn[] = [
  {
    field: 'index',
    label: t('userDemo.index'),
    type: 'index'
  },

  {
    field: 'indicator_category.indicator.name',
    label: t('Indicator')
  },
  {
    field: 'settlement.name',
    label: t('Settlement')
  },
  {
    field: 'county.name',
    label: t('County')
  },

  {
    field: 'indicator_category.indicator.unit',
    label: t('Unit')
  },
  {
    field: 'amount',
    label: t('Amount')
  },
  {
    field: 'date',
    label: t('Date')
  },
  {
    field: 'status',
    label: t('Status')
  },
  {
    field: '',
    width: "250",
    label: t('Documentation'),
    type: 'expand'
  },
  {
    field: 'documentation',
    label: t('Documents'),
    formatter: formatter
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
  //makeSettlementOptions(filteredIndicators)

  getFilteredData(filters, filterValues)
}

const handleSelectLocation = async (selectedLocation: any) => {


  if (selectedLocation.length > 1) {
    var selectOption = 'settlement_id'
    var location = [selectedLocation[selectedLocation.length - 1]] // take the last value selected

  } else {
    var selectOption = 'county_id'
    var location = [selectedLocation[0]]

  }

  console.log("Level", selectOption)
  console.log("location", location)



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

  if (!filterValues.includes(location) && location.length > 0) {
    filterValues.splice(index, 0, location) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
  }

  // expunge the filter if the filter values are null
  if (location.length === 0) {
    filters.splice(index, 1)
  }

  console.log('filters:', filters)
  console.log('FilterValues:', filterValues)


  getFilteredData(filters, filterValues)
}



const getCascadeSelectedValues = async (location: any) => {
  console.log("Selected - settlement_id", (location.length))
  ruleForm.county_id = location[0] // take the last value selected
  if (location.length > 1) {
    ruleForm.settlement_id = location[location.length - 1] // take the last value selected
  }

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

const getIndicatorNames = async () => {
  const res = await getCountyListApi({
    params: {
      //   pageIndex: 1,
      //    limit: 100,
      curUser: 1, // Id for logged in user
      model: 'indicator_category',
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
      var opt = {}
      opt.value = arrayItem.id
      opt.label = arrayItem.indicator_name + ' | ' + arrayItem.frequency + ' | ' + arrayItem.category_title
      opt.title = arrayItem.category_title
      //  console.log(countyOpt)
      indicatorsOptions.value.push(opt)
    })
  })
}

const getCounties = async () => {
  const res = await getCountyListApi({
    params: {
      //   pageIndex: 1,
      //   limit: 100,
      curUser: 1, // Id for logged in user
      model: 'county',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received county response:', response)
    //tableDataList.value = response.data
    var ret = response.data

    loading.value = false
    // pass result to the makeoptions

    //categories.value = ret
    makeCountyOptions(ret)
  })
}

const getSettlement = async () => {
  const res = await getCountyListApi({
    params: {
      //   pageIndex: 1,
      //   limit: 100,
      curUser: 1, // Id for logged in user
      model: 'settlement',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then(async (response: { data: any }) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    var ret = response.data


    loading.value = false
    // pass result to the makeoptions
    await getCounties()
    //categories.value = ret
    makeSettlementOptions(ret)


  })
}


const makeCountyOptions = (list) => {
  console.log('making the county options..............', list)
  countyOptions.value = []
  list.forEach(function (arrayItem: { id: string; type: string }) {
    var countyOpt = {}
    countyOpt.value = arrayItem.id
    countyOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
    countyOpt.children = []
    //  console.log(countyOpt)
    countyOptions.value.push(countyOpt)
  })
  console.log("County options", countyOptions)
}

const makeSettlementOptions = (list) => {
  console.log('making the settleemnt options..............', list)
  settlementOptions.value = []
  list.forEach(function (arrayItem: { id: string; type: string }) {
    var settOpt = {}
    settOpt.value = arrayItem.id
    settOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
    settOpt.county_id = arrayItem.county_id
    //  console.log(countyOpt)
    settlementOptions.value.push(settOpt)
  })
  console.log("settlementOptions options", settlementOptions)
  mergeCountyAndSettlementOptions()
}
const handleDownload = () => {
  downloadLoading.value = true
  const data = tblData
  const fileName = 'indicators.xlsx'
  const exportType = exportFromJSON.types.csv
  if (data) exportFromJSON({ data, fileName, exportType })
}


const mergeCountyAndSettlementOptions = () => {


  var arr = countyOptions.value.map(function (thisCounty, i) {
    settlementOptions.value.map(function (sett, i) {
      // console.log(thisCounty)
      if (thisCounty.value == sett.county_id) {
        thisCounty.children.push(sett)

      }
    });
    return thisCounty;
  });

  cascadeOptions.value = arr
  console.log("merged Options", arr)
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
  ruleForm.settlement_id = data.settlement_id
  ruleForm.date = data.date
  ruleForm.amount = data.amount
  ruleForm.indicator_category_id = data.indicator_category_id
  ruleForm.location = [data.county_id]
  if (data.settlement_id) {
    ruleForm.location.push(data.settlement_id)
  }
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
  ruleForm.settlement_id = null
  ruleForm.county_id = null
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
    formData.append('file', morefileList.value[i].raw)
    formData.append('DocType', format)

  }


  formData.append('parent_code', currentRow.value.id)
  formData.append('model', model)
  formData.append('grp', 'M&E Documentation')
  formData.append('code', uuid.v4())
  formData.append('column', 'report_id')  //Column to save ID 



  console.log(formData)
  await uploadDocuments(formData)

}


const changeIndicator = async (indicator: any) => {
  ruleForm.indicator_id = indicator

  var filtredOptions = indicatorsOptions.value.filter(function (el) {
    return el.value == indicator
  });

  console.log("Filtered Idnciators", filtredOptions[0].label)
  //ruleForm.indicator_category_title = filtredOptions[0].category_title

}



function getQuarter(date = new Date()) {
  return Math.floor(date.getMonth() / 3 + 1);
}

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  indicator_category_id: '',
  location: [],
  county_id: '',
  settlement_id: null,
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


getSettlement()


const tableRowClassName = (data) => {
  console.log('Row Styling --------->', data.row)
  if (data.row.status === 'Rejected') {
    return 'danger-row'
  }
  return ''
}




</script>

<template>
  <ContentWrap :title="t('Monitoring and Evaluation Reports')" :message="t('Use the filters to subset')">
    <el-divider border-style="dashed" content-position="left">Filters</el-divider>

    <div style="display: inline-block; margin-left: 20px">
      <el-select v-model="value2" :onChange="handleSelectIndicatorCategory" :onClear="handleClear" multiple clearable
        filterable collapse-tags placeholder="Filter by Indicator">
        <el-option v-for="item in indicatorsOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-cascader :options="cascadeOptions" @change="handleSelectLocation" :props="props1" filterable clearable
        placeholder="Select Location of Monitoring" />

    </div>



    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="handleDownload" type="primary" :icon="Download" />
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-button :onClick="handleClear" type="primary" :icon="Filter" />
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-tooltip content="Add Report " placement="top">
        <el-button :onClick="AddReport" type="primary" :icon="Plus" />
      </el-tooltip>
    </div>

    <div style="display: inline-block; margin-left: 20px">
      <el-tooltip content="Import" placement="top">
        <el-button :onClick="ImportReports" type="primary" :icon="UploadFilled" />
      </el-tooltip>
    </div>



    <el-divider border-style="dashed" content-position="left">Results</el-divider>


    <el-table :data="tableDataList" style="width: 100%" :row-class-name="tableRowClassName">
      <el-table-column type="expand">
        <template #default="props">
          <div m="4">
            <h3>Documents</h3>
            <el-table :data="props.row.documents" class="mb-4">
              <el-table-column label="Name" prop="name" />
              <el-table-column label="Type" prop="category" />
              <el-table-column label="Link" prop="location" />

              <el-table-column label="Operations">
                <template #default="scope">
                  <el-link :href="props.row.documents[scope.$index].name" download>
                    <Icon icon="material-symbols:download-for-offline-rounded" color="#46c93a" width="36" />
                  </el-link>
                  <el-tooltip content="Delete" placement="top">
                    <el-popconfirm confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled"
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
            <el-button @click="addMoreDocs(props.row)" type="info" round>Add More Documents</el-button>

          </div>
        </template>
      </el-table-column>
      <el-table-column label="Indicator" width="400" prop="indicator_category.indicator.name" />
      <el-table-column label="Settlement" prop="settlement.name" />
      <el-table-column label="County" prop="county.name" />
      <el-table-column label="Unit" prop="indicator_category.indicator.unit" />
      <el-table-column label="Amount" prop="amount" />
      <el-table-column label="Status" prop="status" />

      <el-table-column fixed="right" label="Operations" width="120">
        <template #default="scope">

          <el-tooltip content="Edit" placement="top">
            <el-button type="success" :icon="Edit" @click="editReport(scope.row as TableSlotDefault)" circle />
          </el-tooltip>

          <el-tooltip content="Delete" placement="top">
            <el-popconfirm confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
              title="Are you sure to delete this report?" @confirm="DeleteReport(scope.row as TableSlotDefault)">
              <template #reference>
                <el-button v-if="showAdminButtons" type="danger" :icon=Delete circle />
              </template>
            </el-popconfirm>
          </el-tooltip>
        </template>
      </el-table-column>

    </el-table>


    <ElPagination layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
      v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 200, 10000]" :total="total" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
  </ContentWrap>

  <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formHeader" width="30%" draggable>
    <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px">

      <el-form-item label="Indicator">
        <el-select filterable v-model="ruleForm.indicator_category_id" :onChange="changeIndicator"
          placeholder="Select Indicator">
          <el-option v-for="item in indicatorsOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>


      <el-form-item label="Location">
        <el-cascader v-model="ruleForm.location" :options="cascadeOptions" @change="getCascadeSelectedValues"
          :props="props1" filterable clearable placeholder="Select Location of Monitoring" />
      </el-form-item>
      <el-form-item label="Date">
        <el-date-picker v-model="ruleForm.date" type="date" placeholder="Pick a day" />
      </el-form-item>
      <el-form-item label="Quantity">
        <el-input-number v-model="ruleForm.amount" />
      </el-form-item>
      <el-form-item label="Documentation"> <el-upload v-model:file-list="fileUploadList" class="upload-demo" multiple
          :on-preview="handlePreview" :on-remove="handleRemove" :before-remove="beforeRemove" :limit="3"
          :on-exceed="handleExceed" :auto-upload="false">
          <el-button type="primary">Click to upload</el-button>
          <template #tip>
            <div class="el-upload__tip">
              pdf/xlsx/csv/jpg/png files with a size less than 20mb.
            </div>
          </template>
        </el-upload></el-form-item>


    </el-form>
    <template #footer>

      <span class="dialog-footer">
        <el-button @click="AddDialogVisible = false">Cancel</el-button>
        <el-button v-if="showSubmitBtn" type="primary" @click="submitForm(ruleFormRef)">Submit</el-button>
        <el-button v-if="showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>
      </span>
    </template>
  </el-dialog>

  <el-dialog v-model="ImportDialogVisible" @close="handleClose" title="Import multiple reports" width="50%" draggable>
    <el-upload class="upload-demo" drag action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" multiple
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


  <el-dialog v-model="addMoreDocuments" title="Upload More Documents" width="30%">
    <el-upload v-model:file-list="morefileList" class="upload-demo"
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