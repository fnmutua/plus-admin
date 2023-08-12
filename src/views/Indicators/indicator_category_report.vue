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
  Position,
  InfoFilled
} from '@element-plus/icons-vue'

import { ref, reactive, computed, h } from 'vue'
import {
  ElPagination, ElInputNumber, ElTable,
  ElTableColumn, ElDropdown, ElDropdownItem, ElDropdownMenu,
  ElDatePicker, ElTooltip, ElOption, ElDialog, ElForm, ElFormItem, ElUpload, ElSlider
  , ElInput, FormRules, ElPopconfirm, ElCol, ElRow
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


import UploadComponent from '@/views/Components/UploadComponent.vue';
import { defineAsyncComponent } from 'vue';
import ListDocuments from '@/views/Components/ListDocuments.vue';
import {
  countyOptions, settlementOptionsV2, subcountyOptions, wardOptions
} from './common/index.ts'



//import downloadForOfflineRounded from '@iconify-icons/material-symbols/download-for-offline-rounded';

import { MapboxLayerSwitcherControl, MapboxLayerDefinition } from "mapbox-layer-switcher";
import "mapbox-layer-switcher/styles.css";
import * as turf from '@turf/turf'


const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'
mapboxgl.accessToken = MapBoxToken;




const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


console.log("userInfo--->", userInfo)







const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
const countyOptions = ref([])


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


// Function to empty all fields in ruleForm
function emptyRuleForm() {
  for (const key in ruleForm) {
    ruleForm[key] = null;
  }
}

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  indicator_category_id: '',
  baseline: 0,
  target:0,
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
  prevAmount:0,
  cumAmount: 0,
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
  progress: [
    { required: true, message: 'Progress is required', trigger: 'blur' }],
})










// flag for admin buttons
if (userInfo.roles.includes("admin") || userInfo.roles.includes("kisip_staff")) {
  showAdminButtons.value = true
}

// Show Edit buttons 
if (userInfo.roles.includes("staff") || userInfo.roles.includes("admin")
  || userInfo.roles.includes("county_admin") || userInfo.roles.includes("national_monitoring")) {
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
 
let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = ['userId']
var filterValues = [[userInfo.id]]  // remember to change here!
var tblData = []
const associated_Model = ''
const model = 'indicator_category_report'
const associated_multiple_models = ['document', 'settlement', 'county', 'users', 'project']
const nested_models = ['indicator_category', 'indicator'] // The mother, then followed by the child

//// ------------------parameters -----------------------////

const fileUploadList = ref<UploadUserFile[]>([])


const fieldSet = ref([])
const show = ref(false)


const { t } = useI18n()


const statusOptions = [
  { label: 'Ongoing', value: 1 },
  { label: 'Suspended', value: 2 },
  { label: 'Completed', value: 3 },
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
  tableDataList.value= res.data.filter(item => item.indicator_category.indicator.type === 'output');


  //tableDataList.value = res.data
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
  formData.associated_multiple_models = ['project', 'category', 'activity', 'indicator']
  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)
  console.log('indicator_category', res)

  res.data.forEach(function (arrayItem: { id: string; type: string }) {
    var opt = {}
    console.log(arrayItem)
    opt.value = arrayItem.id
    opt.label = arrayItem.indicator_name + ' | ' + arrayItem.category.category
    opt.title = arrayItem.category.title
    opt.project_id = arrayItem.project.id
    opt.activity_id = arrayItem.activity.id
    opt.programme_implementation_id = arrayItem.programme_implementation_id

    opt.county_id = arrayItem.project.county_id
    opt.subcounty_id = arrayItem.project.subcounty_id
    opt.settlement_id = arrayItem.project.settlement_id
    opt.ward_id = arrayItem.project.ward_id
    opt.unit = arrayItem.indicator.unit
    opt.baseline = arrayItem.baseline
    opt.target = arrayItem.target

    // Here we collect Output indicators ONLY
    if (arrayItem.indicator.type=='output') {
      indicatorsOptions.value.push(opt)
      indicatorsOptionsFiltered.value.push(opt)
    }
 
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
    opt.programme_implementation_id = arrayItem.implementation_id
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
  ruleForm.activity_id = data.activity_id


  ruleForm.date = data.date
  ruleForm.amount = data.amount
  ruleForm.indicator_category_id = data.indicator_category_id
  ruleForm.programme_implementation_id = data.programme_implementation_id


  ruleForm.ward_id = data.ward_id
  ruleForm.code = data.code
  ruleForm.progress = data.progress
  ruleForm.project_status = data.project_status
  ruleForm.disbursement = data.disbursement
  ruleForm.comments = data.comments

  // Nullify Cumulatives every time theres an edit to avoid multiple editign duplciations
  ruleForm.cumDisbursement = 0
  // ruleForm.cumProgress = 0
  ruleForm.cumAmount = 0

  formHeader.value = 'Edit Report'
  fileUploadList.value = data.documents

  getCumulativeProgressEditPhase( data.indicator_category_id)
  changeIndicator(data.indicator_category_id)

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

  console.log('changeProject', project)

  const filteredOpts = projectOptions.value.filter(item => item.value == project);

  console.log('filteredOpts', filteredOpts[0].programme_implementation_id)

  ruleForm.programme_implementation_id = filteredOpts[0].programme_implementation_id

  console.log(ruleForm)

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


const changeIndicator = async (indicator_category_id: any) => {
  ruleForm.indicator_category_id = indicator_category_id

  console.log('Filtre indicator_category_id', indicator_category_id)

  var filtredOptions = indicatorsOptions.value.filter(function (el) {
    return el.value == indicator_category_id
  });

  ruleForm.project_id = filtredOptions[0].project_id
  ruleForm.settlement_id = filtredOptions[0].settlement_id
  ruleForm.county_id = filtredOptions[0].county_id
  ruleForm.subcounty_id = filtredOptions[0].subcounty_id
  ruleForm.ward_id = filtredOptions[0].ward_id


  console.log("Filtered Indicators", filtredOptions[0])
  ruleForm.units = "Quantity(" + filtredOptions[0].unit + ")"
  ruleForm.cumUnits = "Cumulative(" + filtredOptions[0].unit + ")"

  ruleForm.baseline = filtredOptions[0].baseline
  ruleForm.target = filtredOptions[0].target

  //ruleForm.indicator_category_title = filtredOptions[0].category_title

  getCumulativeProgress(indicator_category_id)
}



function getQuarter(date = new Date()) {
  return Math.floor(date.getMonth() / 3 + 1);
}



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
     // ruleForm.cumDisbursement = ruleForm.cumDisbursement + ruleForm.disbursement
   //   ruleForm.cumProgress = (ruleForm.cumProgress + ruleForm.progress) <= 100 ? (ruleForm.cumProgress + ruleForm.progress) : 100

      console.log('cumProgress', ruleForm.cumProgress)

      ruleForm.cumAmount = ruleForm.cumAmount + ruleForm.amount

      let calculatedProgress = (100 * (ruleForm.cumAmount / ruleForm.target));

            if (isFinite(calculatedProgress)) {
              ruleForm.cumProgress = calculatedProgress.toFixed(2);
            } else {
              ruleForm.cumProgress = '0.00';
            }

   //   ruleForm.cumProgress =  100*((ruleForm.cumAmount - ruleForm.baseline )/(ruleForm.target - ruleForm.baseline )).toFixed(2)

      //Progress towards target (%realized) [(B-A)/(C- A)]

      const report = await CreateRecord(ruleForm)   // first save the form on DB
      console.log("Report", report.data.id)

      emptyRuleForm()

      // uploading the documents 

      const formData = new FormData()
      for (var i = 0; i < fileUploadList.value.length; i++) {
        console.log('------>file', fileList.value[i])
        var column = 'report_id'
        formData.append('files', fileUploadList.value[i].raw)
        formData.append('format', fileUploadList.value[i].name.split('.').pop())
        formData.append('field_id', 'report_id')
        formData.append('category', 2)
        formData.append(column, parseInt(report.data.id))
        formData.append('size', (fileUploadList.value[i].raw.size / 1024 / 1024).toFixed(2))
        formData.append('createdBy', userInfo.id)
        formData.append('protected', false)

        //   {"message":"Upload failed. The field report_id is required errors","code":"0000"}
      }

      formData.append('code', uuid.v4())



      console.log('Befoer submit', formData)
      const docs = await uploadFilesBatch(formData)

      console.log('after submit', docs.data)


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

      //emptyRuleForm()
      // dialogFormVisible.value = false

      const updateformData = new FormData()
      // uploading the documents 

      const formData = new FormData()
      for (var i = 0; i < fileUploadList.value.length; i++) {

        console.log('------>file', fileUploadList.value[i])

        var column = 'report_id'
        updateformData.append('files', fileUploadList.value[i].raw)
        updateformData.append('format', fileUploadList.value[i].name.split('.').pop())
        updateformData.append('field_id', 'report_id')
        updateformData.append('category', 2)
        updateformData.append(column, parseInt(ruleForm.id))
        updateformData.append('size', (fileUploadList.value[i].raw.size / 1024 / 1024).toFixed(2))
        updateformData.append('createdBy', userInfo.id)
        updateformData.append('protected', false)

        //   {"message":"Upload failed. The field report_id is required errors","code":"0000"}
      }

      updateformData.append('code', uuid.v4())



      console.log('Befoer submit', updateformData)
      const docs = await uploadFilesBatch(updateformData)

      console.log('after submit', docs.data)





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





const getCumulativeProgress = async (indicator_category_id) => {

  var filters = ['userId', 'indicator_category_id', 'county_id', 'subcounty_id', 'ward_id', 'project_id', 'programme_implementation_id',
  ]

  var filterValues = [[userInfo.id], [ruleForm.indicator_category_id], [ruleForm.county_id], [ruleForm.subcounty_id], [ruleForm.ward_id],
  [ruleForm.project_id], [ruleForm.programme_implementation_id]  ]  // remember to change here!



  if (ruleForm.settlement_id) {
    filters.push('settlement_id')
    filterValues.push([ruleForm.settlement_id])
  }


  console.log('filters', filters)
  console.log('filterValues', filterValues)
  const formData = {}
  formData.limit = pSize.value
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  formData.assocModel = []

  // - multiple filters -------------------------------------
  formData.filters = filters
  formData.filterValues = filterValues
  formData.associated_multiple_models = []
  formData.nested_models = nested_models

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)


  console.log('yaay. Got last reports', res.data)


  function getLatestReport(dataList) {
    if (dataList.length === 0) {
      return null;
    }

    // Find the latest ID using reduce function
    const latestID = dataList.reduce((prevObj, currentObj) => (currentObj.id > prevObj.id ? currentObj : prevObj)).id;

    // Find the object with the latest ID
    const objectWithLatestID = dataList.find((obj) => obj.id === latestID);

    // Return the object with the latest ID
    return objectWithLatestID;
  }


  // Get the object with the latest date
  const objectWithLatestDate = getLatestReport(res.data);
  console.log('objectWithLatestDate', objectWithLatestDate);

 // ruleForm.cumProgress = parseInt(objectWithLatestDate.cumProgress)
 // ruleForm.cumDisbursement = parseInt(objectWithLatestDate.cumDisbursement)
 ruleForm.cumAmount = parseInt(objectWithLatestDate.cumAmount)
 ruleForm.cumProgress = parseInt(objectWithLatestDate.cumProgress)
 ruleForm.prevAmount = parseInt(objectWithLatestDate.amount)

  console.log('cumProgress ats tart', ruleForm);

}


const getCumulativeProgressEditPhase = async (indicator_category_id) => {

  console.log('programme_implementation_id', [ruleForm.programme_implementation_id])
  var filters = ['userId', 'indicator_category_id', 'county_id', 'subcounty_id', 'ward_id', 'project_id', 'programme_implementation_id',
  ]

  var filterValues = [[userInfo.id], [indicator_category_id], [ruleForm.county_id], [ruleForm.subcounty_id], [ruleForm.ward_id],
  [ruleForm.project_id], [ruleForm.programme_implementation_id]]  // remember to change here!


  if (ruleForm.settlement_id) {
    filters.push('settlement_id')
    filterValues.push([ruleForm.settlement_id])


  }


  const formData = {}
  formData.limit = pSize.value
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  formData.assocModel = []

  // - multiple filters -------------------------------------
  formData.filters = filters
  formData.filterValues = filterValues
  formData.associated_multiple_models = []
  formData.nested_models = nested_models

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)


  console.log('Editing.. Get Last Report', res.data)


  function getReportBeforeCurrentID(dataList, currentID) {
    if (dataList.length === 0) {
      return null;
    }

    // Filter the dataList to get records with IDs less than currentID
    const filteredRecords = dataList.filter((obj) => obj.id < currentID);

    if (filteredRecords.length === 0) {
      return null; // No record before the currentID
    }

    // Find the object with the maximum ID from the filtered records
    const objectWithLatestID = filteredRecords.reduce((prevObj, currentObj) => (currentObj.id > prevObj.id ? currentObj : prevObj));

    // Return the object with the maximum ID (last record before currentID)
    return objectWithLatestID;
  }


  // Get the object with the latest date

  const objectWithLatestDate = getReportBeforeCurrentID(res.data, ruleForm.id);
  console.log('objectWithLatestDate', objectWithLatestDate);


  //ruleForm.cumProgress = parseInt(objectWithLatestDate.cumProgress)
  //ruleForm.cumDisbursement = parseInt(objectWithLatestDate.cumDisbursement)
  ruleForm.cumAmount = parseInt(objectWithLatestDate.cumAmount)
  ruleForm.cumProgress = parseInt(objectWithLatestDate.cumProgress)
  ruleForm.prevAmount = parseInt(objectWithLatestDate.amount)
  
  console.log('cumProgress ats tart', ruleForm);



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
const selectedRow = ref([])
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



const dialogMap = ref(false)

const reportGeom = ref([])
const projectGeom = ref([])

const reportDetails = ref();
const  locationStatus = ref('')
const projectLocationColor=ref('red')
const showMap = (row) => {
  console.log(row)

  reportDetails.value = row



  dialogMap.value = true
  reportGeom.value = reportDetails.value.geom.coordinates
  projectGeom.value = reportDetails.value.project.geom 

 
     var centroid = turf.centroid(reportDetails.value.project.geom );

      var options = {units: 'kilometers'};

  var distance = turf.distance(reportDetails.value.geom, centroid, options);
  console.log('distance , ', distance) 

  if (distance<1) {
    projectLocationColor.value='green'
  }
  
  locationStatus.value='The report is ' + distance.toFixed(2) +  ' kilometers from the center of the project'
  setTimeout(loadMap, 100); // delay for the dialog to fully load
  //loadMap()
}



const closeMap = () => {

  dialogMap.value = false
}

const loadMap = () => {
  var mapCenter = reportGeom.value;

  var nmap = new mapboxgl.Map({
    container: "mapContainer",
    style: "mapbox://styles/mapbox/streets-v12",
    center: mapCenter, // starting position
    zoom: 18,
  });



  nmap.on("load", () => {
    nmap.addLayer({
      id: "Satellite",
      source: { type: "raster", url: "mapbox://mapbox.satellite", tileSize: 256 },
      type: "raster",
    });

    nmap.addLayer({
      id: "Streets",
      source: { type: "raster", url: "mapbox://mapbox.streets", tileSize: 256 },
      type: "raster",
    });

    nmap.setLayoutProperty("Satellite", "visibility", "none");

    const layers = [
      {
        id: "Satellite",
        title: "Satellite",
        visibility: "none",
        type: "base",
      },
      {
        id: "Streets",
        title: "Streets",
        visibility: "none",
        type: "base",
      },
    ];

     //     Add point layer
     nmap.addLayer({
        id: 'point-layer',
        type: 'circle',
        source: {
          type: 'geojson',
          data: projectGeom.value,
        },
        paint: {
          'circle-color': projectLocationColor.value.color,
          'circle-radius': 6,
        },
        filter: ['==', '$type', 'Point'],
      });

        // Add line layer
        nmap.addLayer({
          id: 'line-layer',
          type: 'line',
          source: {
            type: 'geojson',
            data: projectGeom.value,
          },
          paint: {
            'line-color':projectLocationColor.value,
            'line-width': 2,
          },
          filter: ['==', '$type', 'LineString'],
        });

       // Add polygon layer as outline
        nmap.addLayer({
          id: 'polygon-layer',
          type: 'line', // Change to 'line' to display the outline
          source: {
            type: 'geojson',
            data: projectGeom.value,
          },
          paint: {
            'line-color': projectLocationColor.value, // Outline color (replace 'green' with your desired color)
            'line-width': 2, // Outline width in pixels (adjust as needed)
          },
          filter: ['in', '$type', 'Polygon' ], // Include both Polygon and MultiPolygon types
        });


 



    nmap.addControl(new MapboxLayerSwitcherControl(layers));

    const nav = new mapboxgl.NavigationControl();
    nmap.addControl(nav, "top-left");

    // Add a marker at the geom.value position

    function formatDateToYYYYMMDD(dateString) {
      const dateObj = new Date(dateString);
      const year = dateObj.getUTCFullYear();
      const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    // Add a marker at the geom.value position
    var marker = new mapboxgl.Marker().setLngLat(mapCenter).addTo(nmap);
      // Create the marker and specify the color
      var marker = new mapboxgl.Marker({
        color: projectLocationColor.value,
      }).setLngLat(mapCenter)
        .addTo(nmap);
    // Create a simple popup with user information displayed using line breaks
    var popupContent = document.createElement('div');

    // Sample user information (replace these with actual data)
    var userName = reportDetails.value.user.name;
    var phoneNumber = reportDetails.value.user.phone;
    var date = formatDateToYYYYMMDD(reportDetails.value.date);

    var userInfo = `
        <div style="text-align: center;">
          <strong>Submitted By:</strong>
          <hr style="margin: 5px 0;">

        </div>
        <strong>Name:</strong> ${userName}<br>
          <strong>Phone Number:</strong> ${phoneNumber}<br>
          <strong>Date:</strong> ${date}
        `;

    popupContent.innerHTML = userInfo;

    var popup = new mapboxgl.Popup({ anchor: 'right', offset: [-20, 0] }).setDOMContent(popupContent);

    // Attach the popup to the marker
    marker.setPopup(popup);
    nmap.resize();
  });
};


function isGeomNull(geom) {
  console.log('---geom-----', geom)
  return geom === null;
}

function formatDate(dateString) {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }


</script>

<template>
  <ContentWrap :title="t('Monitoring and Evaluation Output Reports(All)')" :message="t('Use the filters to subset')">




    <div v-if="dynamicComponent">
      <upload-component :is="dynamicComponent" v-bind="componentProps" />
    </div>


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
      <el-table-column label="#" width="80" prop="id" sortable />

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

            <el-tooltip content="Map" placement="top">
              <el-button
v-if="showEditButtons" type="warning" :icon="Position" :disabled="isGeomNull(scope.row.geom)"
                @click="showMap(scope.row as TableSlotDefault)" circle />
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


    <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-position="left">
      <el-row :gutter="10">

        <el-col :xl="24" :lg="24" :md="24" :sm="24" :xs="24">

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
filterable v-model="ruleForm.indicator_category_id" :onChange="changeIndicator" style="width: 100%"
              placeholder="Select Indicator">
              <el-option
v-for="item in indicatorsOptionsFiltered" :key="item.value" :label="item.label"
                :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="10">

        <el-col :xl="12" :lg="12" :md="12" :sm="24" :xs="24">
       
          <el-form-item :label="ruleForm.units">
            <el-input-number v-model="ruleForm.amount" />
          </el-form-item>

          <el-form-item label="Baseline">
            <el-input-number v-model="ruleForm.baseline" type="number" disabled>
              <template #prepend>Baseline(Amount)</template>
            </el-input-number>
          </el-form-item>


          <el-form-item label="Date">
            <el-date-picker v-model="ruleForm.date" type="date" placeholder="Pick a day" />
          </el-form-item>

        </el-col>

        <el-col :xl="12" :lg="12" :md="12" :sm="24" :xs="24">

    
          <el-form-item :label="ruleForm.cumUnits">
            <el-input-number v-model="ruleForm.cumAmount" type="number" disabled>
              <template #prepend>Cumulative(Amount)</template>
            </el-input-number>
          </el-form-item>


          <el-form-item label="Target">
            <el-input-number v-model="ruleForm.target" type="number" disabled>
              <template #prepend>Target(Amount)</template>
            </el-input-number>
          </el-form-item>


          <el-form-item label="Progress(%)">
            <el-input-number v-model="ruleForm.cumProgress" type="number" disabled>
              <template #prepend>Cumulative(Amount)</template>
            </el-input-number>
          </el-form-item>

        </el-col>
        

      </el-row>

      <el-row :gutter="10">
         

        <el-col :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
          <el-form-item label="Comments">
            <el-input v-model="ruleForm.comments" type="textarea" placeholder="Do you have any comments?" />
          </el-form-item>
        </el-col>
      </el-row>

      
      <el-row :gutter="10" style="text-align: center;">
        <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">

          <el-upload
v-model:file-list="fileUploadList" class="upload-demo"
            action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" multiple :on-preview="handlePreview"
            :on-remove="handleRemove" :before-remove="beforeRemove" :limit="3" :auto-upload="false"
            :on-exceed="handleExceed">
            <el-button type="primary" :icon="UploadFilled"> Documentation</el-button>
          </el-upload>
        </el-col>

        
      </el-row>

    </el-form>



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

  <el-dialog v-model="dialogMap" width="50%" draggable :before-close="closeMap" :show-close="false">
    <template #header="{ titleId, titleClass }">
      <div class="my-header">
      <h4 :id="titleId" :class="titleClass">Reporting Location</h4>
      <h2 :style="`color: ${projectLocationColor}; font-style: italic;`">{{ locationStatus }}</h2> <!-- Use the 'italicizedColor' variable -->
      <el-button type="danger" :icon="CircleCloseFilled" @click="closeMap">Close Map</el-button>
    </div>
    </template>
    <div id="mapContainer" class="basemap"></div>

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

<style scoped>
.basemap {
  width: 100%;
  height: 450px;
  border: 1px solid #e2dcdc;
  /* Outline */
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.4);
  /* Shadow */
}
</style>

<style scoped>
.my-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
</style>