<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { ElButton, ElMessageBox, ElSelect, FormInstance, ElCard } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Plus,
  Back,
  Download,
  Filter,
  Delete,
  View,
  InfoFilled
} from '@element-plus/icons-vue'

import { ref, reactive, computed } from 'vue'
import {
  ElPagination, ElInputNumber, ElTable, ElDescriptions, ElDescriptionsItem,
  ElTableColumn, ElDropdown, ElDropdownItem, ElDropdownMenu,
  ElDatePicker, ElTooltip, ElOption, ElDialog, ElForm, ElFormItem, ElUpload, ElInput, FormRules, ElPopconfirm
} from 'element-plus'
import { useRouter } from 'vue-router'
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


import UploadComponent from '@/views/Components/UploadComponent.vue';
import { defineAsyncComponent } from 'vue';
import ListDocuments from '@/views/Components/ListDocuments.vue';

 

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


console.log("userInfo--->", userInfo)







const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])


const categories = ref([])
const filteredIndicators = ref([])
const page = ref(1)
const pSize = ref(5)
const selCounties = []
const pageSize = ref(5)
const currentPage = ref(1)
const total = ref(0)


const reviewWindowWidth = ref('40%')
const isMobile = computed(() => appStore.getMobile)

if (isMobile.value) {
  reviewWindowWidth.value = "100%"
}



const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)
console.log('showAdminButtons', showAdminButtons.value)
console.log('showEditButtons', showEditButtons.value)


const AddDialogVisible = ref(false)
const ImportDialogVisible = ref(false)
const formHeader = ref('Add Report')
const showSubmitBtn = ref(false)
const showProcessBtn = ref(true)
const addMoreDocuments = ref(false)
const ReviewDialog = ref(false)
const RejectDialog = ref(false)
const rejectReason = ref('')


const showEditSaveButton = ref(false)
let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
const filters = ['status']
const filterValues = [['New']]  // remember to change here!
var tblData = []

// var filters = ['status']
// var filterValues = [['New']]  // remember to change here!


const associated_Model = ''
const model = 'indicator_category_report'
const associated_multiple_models = ['document', 'settlement',  'users', 'project']
const nested_models = ['indicator_category', 'indicator'] // The mother, then followed by the child

//// ------------------parameters -----------------------////

const fileUploadList = ref<UploadUserFile[]>([])


const fieldSet = ref([])
const show = ref(false)


const { t } = useI18n()




const handleClear = async () => {
  console.log('cleared....')

  // clear all the fileters -------
 
  value1.value = null
  value2.value = null
  value3.value = null
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
  //tableDataList.value = res.data
  tableDataList.value = res.data.filter(item => item.indicator_category.indicator.type === 'output');

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


const indicatorsOptions = ref([])
const indicatorsOptionsFiltered = ref([])

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
    opt.label = arrayItem.indicator_name + ' | ' + arrayItem.category.category
    opt.title = arrayItem.category.title
    opt.project_id = arrayItem.project.id
    opt.activity_id = arrayItem.activity.id

    opt.county_id = arrayItem.project.county_id
    opt.subcounty_id = arrayItem.project.subcounty_id
    opt.settlement_id = arrayItem.project.settlement_id
    opt.ward_id = arrayItem.project.ward_id

    indicatorsOptions.value.push(opt)
    indicatorsOptionsFiltered.value.push(opt)
  })

  console.log('indicatorsOptions.value', indicatorsOptions.value)
}

const projectOptions = ref([])
const activityOptions = ref([])
const activityOptionsFiltered = ref([])

const getProjects = async () => {
  const formData = {}

  formData.curUser = 1 // Id for logged in user
  formData.model = 'project'
  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  formData.assocModel = ''

  // - multiple filters -------------------------------------
  formData.filters = []
  formData.filterValues = []
  formData.associated_multiple_models = ['activity']
  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)
  console.log('project', res)

  res.data.forEach(function (arrayItem: { id: string; type: string }) {
    var opt = {}
    console.log(arrayItem)
    opt.value = arrayItem.id
    opt.label = arrayItem.title
    projectOptions.value.push(opt)


    arrayItem.activities.forEach(function (activity: any) {
      console.log('activity--->', activity)

      var act = {}
      console.log(activity)
      act.value = activity.id
      act.label = activity.title
      act.project_id = arrayItem.id
      activityOptions.value.push(act)
      activityOptionsFiltered.value.push(act)

    })
  })

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


const currentRow = ref()

const handleClose = () => {

  console.log("Closing the dialoig")
  showSubmitBtn.value = true
  showEditSaveButton.value = false
  ruleForm.indicator_category_id = null
  ruleForm.date = null
  ruleForm.amount = null
  ruleForm.ward_id = null
  ruleForm.location = []

  formHeader.value = 'Add Report'
  AddDialogVisible.value = false

}





const changeProject = async (project: any) => {
  ruleForm.indicator_category_id = []
  ruleForm.activity_id = []

  // Filter the activities 
  activityOptionsFiltered.value = activityOptions.value.filter(function (el) {
    return el.project_id == project
  });

  // filter the indicators 
  indicatorsOptionsFiltered.value = indicatorsOptions.value.filter(function (el) {
    return el.project_id == project
  });

}


const changeActivity = async (activity: any) => {
  ruleForm.indicator_category_id = []
  indicatorsOptionsFiltered.value = indicatorsOptions.value.filter(function (el) {
    return el.activity_id == activity

  });


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
  ruleForm.ward_id = filtredOptions[0].ward_id


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
  activity_id: '',
  programme_implementation_id: '',
  settlement_id: '',
  subcounty_id: '',
  ward_id: '',
  county_id: '',
  period: getQuarter,
  date: new Date(),
  progress: 0,
  amount: 0,
  files: '',
  project_status: '',
  disbursement: 0,
  userId: userInfo.id,
  code: '',
  cumDisbursement: 0,
  cumProgress: 0,
  cumAmount: 0,
  prevAmount: 0,
  comments: '',
  units: 'Quantity',
  cumUnits: 'Cumulative(qty)'
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
      for (var i = 0; i < fileUploadList.value.length; i++) {
        console.log('------>file', fileUploadList.value[i])
        var format = fileUploadList.value[i].name.split('.').pop() // get file extension
        //  formData.append("file",this.multipleFiles[i],this.fileNames[i]+"_"+dateVar+"."+this.fileTypes[i]);
        fileTypes.push(format)
        // formData.append('files', fileList.value[i])
        // formData.file = fileList.value[i]
        formData.append('files', fileUploadList.value[i].raw)
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
        // formData.append('files', fileList.value[i])
        // formData.file = fileList.value[i]
        updateformData.append('files', fileUploadList.value[i].raw)
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
const getParentOptions = async (parent) => {

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
getProjects()
//getCategoryOptions()
getInterventionsAll()


//getProjects()



const tableRowClassName = (data) => {
  // console.log('Row Styling --------->', data.row)
  if (data.row.documents.length > 0) {
    return 'warning-row'
  }
  return ''
}







const getDocumentTypes = async () => {
}
getDocumentTypes()



const dialogWidth = ref()
const actionColumnWidth = ref()

if (isMobile.value) {
  dialogWidth.value = "90%"
  actionColumnWidth.value = "75px"
} else {
  dialogWidth.value = "45%"
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


/// Uplaod docuemnts from a central component 
const mfield = 'report_id'
const ChildComponent = defineAsyncComponent(() => import('@/views/Components/UploadComponent.vue'));
const dynamicComponent = ref();
const componentProps = ref({
  message: 'Hello from parent',
  showDialog: addMoreDocuments,
  data: currentRow.value,
  umodel: model,
  field: mfield
});



function toggleComponent(row) {
  console.log('Compnnent data', row)
  componentProps.value.data = row
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

const report = ref({})

 

const editIndicator = (data: TableSlotDefault) => {
  showSubmitBtn.value = false

  showEditSaveButton.value = true
  console.log(data)
  ruleForm.id = data.row.id
  ruleForm.county_id = data.row.county_id
  ruleForm.subcounty_id = data.row.subcounty_id
  ruleForm.ward_id = data.row.ward_id
  ruleForm.settlement_id = data.row.settlement_id
  ruleForm.project_id = data.row.project_id
  ruleForm.activity_id = data.row.activity_id


  ruleForm.date = data.row.date
  ruleForm.amount = data.row.amount
  ruleForm.indicator_category_id = data.row.indicator_category_id
  ruleForm.programme_implementation_id = data.row.programme_implementation_id


  ruleForm.ward_id = data.row.ward_id
  ruleForm.code = data.row.code
  ruleForm.progress = data.row.progress
  ruleForm.project_status = data.row.project_status
  ruleForm.disbursement = data.row.disbursement
  ruleForm.comments = data.row.comments
  ruleForm.cumProgress = data.row.cumProgress
  ruleForm.prevAmount = data.row.prevAmount
  ruleForm.cumAmount = data.row.cumAmount



  formHeader.value = 'Edit Report'
  fileUploadList.value = data.row.documents



  formHeader.value = 'Review Report'

  // make the descriptions dataset 
  report.value.county = data.row.county ? data.row.county.name : ''
  report.value.indicator = data.row.indicator_category.indicator_name
  report.value.status = data.row.status
  report.value.date = formatDate(data.row.date )
  report.value.amount = data.row.amount
  report.value.user = data.row.user.name
  report.value.project = data.row.project.title
  report.value.location = data.row.settlement.name



  console.log(' ruleForm.location', ruleForm.location)

  ReviewDialog.value = true
}



const approve = async () => {
  console.log("Appprove")
  ruleForm.status = 'Approved'
  console.log(ruleForm)
  ruleForm.model = 'indicator_category_report'
  ruleForm.userId = userInfo.id
  console.log(ruleForm)
  await updateOneRecord(ruleForm).then(() => { })
  ReviewDialog.value = false
  getFilteredData(filters, filterValues)
}

const reject = async () => {
  RejectDialog.value = true
}
const confirmReject = async () => {
  console.log('Reject Msg', rejectReason.value)
  ruleForm.status = 'Rejected'
  ruleForm.reject_msg = rejectReason.value
  console.log(ruleForm)
  ruleForm.model = 'indicator_category_report'
  ruleForm.userId = userInfo.id
  console.log(ruleForm)
  await updateOneRecord(ruleForm).then(() => { })
  RejectDialog.value = false
  ReviewDialog.value = false

  getFilteredData(filters, filterValues)

}


function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
v-model="value2" :onChange="handleSelectIndicatorCategory" :onClear="handleClear" multiple clearable
        filterable collapse-tags placeholder="Filter by Project/Indicator" style="width: 450px; margin-right: 10px;">
        <el-option v-for="item in indicatorsOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>


      <!-- Action Buttons -->
      <div style="display: flex; align-items: center; gap: 10px; margin-right: 10px;">
        <el-button :onClick="DownloadXlsx" type="primary" :icon="Download" />
        <el-button :onClick="handleClear" type="primary" :icon="Filter" />

      </div>

      <!-- Download All Component -->
      <DownloadAll v-if="showEditButtons" :model="model" :associated_models="associated_multiple_models" />
      <div v-if="dynamicComponent">
      <upload-component :is="dynamicComponent" v-bind="componentProps" />
    </div>

    </el-row>



 


    <el-table
:data="tableDataList" style="width: 100%; margin-top: 10px;" border :row-class-name="tableRowClassName"
      @expand-change="handleExpand">
      <el-table-column type="expand">
        <template #default="props">
          <div m="4">
            <h3>Documents</h3>
            <div>
              <list-documents :is="dynamicDocumentComponent" v-bind="DocumentComponentProps" />
            </div>
            <el-button
style="margin-left: 10px;margin-top: 5px" size="small" v-if="showEditButtons" type="success"
              :icon="Plus" circle @click="toggleComponent(props.row)" />
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Indicator" width="400" prop="indicator_category.indicator.name" sortable />

      <el-table-column label="Date" prop="date" sortable>
        <template #default="scope">
          {{ formatDate(scope.row.date) }}
        </template>
      </el-table-column>

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
v-if="showEditButtons" @click="editIndicator(scope as TableSlotDefault)"
                  :icon="View">View</el-dropdown-item>
                <el-dropdown-item
v-if="showAdminButtons" @click="DeleteReport(scope.row as TableSlotDefault)"
                  :icon="Delete" color="red">Delete</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>


          <div v-else>

            <el-tooltip content="Review" placement="top">
              <el-button
v-if="showAdminButtons" type="primary" :icon="View"
                @click="editIndicator(scope as TableSlotDefault)" circle />
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
layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
      v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 200, 10000]" :total="total" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
  </el-card>

  <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formHeader" :width="dialogWidth" draggable>

    <el-row :gutter="10">

      <el-col :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
        <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-position="left">

          <el-form-item label="Project">
            <el-select
filterable v-model="ruleForm.project_id" :onChange="changeProject" style="width: 100%"
              placeholder="Select Project">
              <el-option v-for="item in projectOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>

          <el-form-item label="Activity">
            <el-select
filterable v-model="ruleForm.activity_id" :onChange="changeActivity" style="width: 100%"
              placeholder="Select Activity">
              <el-option
v-for="item in activityOptionsFiltered" :key="item.value" :label="item.label"
                :value="item.value" />
            </el-select>
          </el-form-item>


          <el-form-item label="Indicator">
            <el-select
filterable v-model="ruleForm.indicator_category_id" :onChange="changeIndicator"
              style="width: 100%" placeholder="Select Indicator">
              <el-option
v-for="item in indicatorsOptionsFiltered" :key="item.value" :label="item.label"
                :value="item.value" />
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

  <el-dialog v-model="ReviewDialog" @close="handleClose" :title="formHeader" :width="reviewWindowWidth" draggable>

    <el-descriptions title="" direction="vertical" :column="2" size="small" border>
      <el-descriptions-item label="Project">{{ report.project }}</el-descriptions-item>
      <el-descriptions-item label="Settlement">{{ report.location }}</el-descriptions-item>
      <el-descriptions-item label="Indicator" :span="2">{{ report.indicator }}</el-descriptions-item>
      <el-descriptions-item label="Amount">{{ report.amount }}</el-descriptions-item>
      <el-descriptions-item label="Date"> {{ report.date }} </el-descriptions-item>
      <el-descriptions-item label="Submitted By"> {{ report.user }} </el-descriptions-item>
    </el-descriptions>



    <template #footer>
      <span v-if="showAdminButtons" class="dialog-footer">
        <el-button type="success" @click="approve">Approve</el-button>
        <el-button type="danger" @click="reject">Reject</el-button>
      </span>
    </template>
  </el-dialog>


  <el-dialog v-model="RejectDialog" title="Reason for rejection" width="20%">
    <el-input v-model="rejectReason" placeholder="" />
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="RejectDialog = false">Cancel</el-button>
        <el-button type="primary" @click="confirmReject">
          Confirm
        </el-button>
      </span>
    </template>
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