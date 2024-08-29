<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { getSettlementListByCounty, uploadFilesBatch } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { ElButton, ElMessageBox, ElSelect, ElSelectV2, ElStep, ElSteps, FormInstance, ElCard, ElTour, ElTourStep, ElText} from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Plus,
  Edit,
  Download,
  Filter,
  Delete,
  UploadFilled,
  Position, Back,
  InfoFilled
} from '@element-plus/icons-vue'

import { ref, reactive, watch, onMounted, nextTick, computed } from 'vue'
import {
  ElPagination, ElInputNumber, ElTable,
  ElTableColumn, ElDropdown, ElDropdownItem, ElDropdownMenu,
  ElDatePicker, ElTooltip, ElOption, ElDialog, ElForm, ElFormItem, ElUpload, ElInput, FormRules, ElPopconfirm, ElCol, ElRow
} from 'element-plus'

import { useRouter } from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord, deleteDocument } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import type { UploadProps, UploadUserFile } from 'element-plus'
import readXlsxFile from 'read-excel-file'
import { getModelSpecs } from '@/api/fields'
import { BatchImportUpsert } from '@/api/settlements'
import { UserType } from '@/api/register/types'
import { Icon } from '@iconify/vue';
import xlsx from "json-as-xlsx"


import UploadComponent from '@/views/Components/UploadComponent.vue';
import { defineAsyncComponent } from 'vue';
import ListDocuments from '@/views/Components/ListDocuments.vue';

import DownloadToCSV from '@/views/Components/DownloadToCSV.vue';
import DownloadAll from '@/views/Components/DownloadAll.vue';


//import downloadForOfflineRounded from '@iconify-icons/material-symbols/download-for-offline-rounded';

import { MapboxLayerSwitcherControl } from "mapbox-layer-switcher";
import "mapbox-layer-switcher/styles.css";
import * as turf from '@turf/turf'


const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = MapBoxToken;




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

const selCounties = []
const currentPage = ref(1)
const total = ref(0)
const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)


const mobileBreakpoint = 768;
const defaultPageSize = 10;
const mobilePageSize = 5;
const pageSize = ref(defaultPageSize);

// Function to update pageSize based on window width
const updatePageSize = () => {
  if (window.innerWidth <= mobileBreakpoint) {
    pageSize.value = mobilePageSize;
  } else {
    pageSize.value = defaultPageSize;
  }
};

onMounted(async () => {


  window.addEventListener('resize', updatePageSize);
  updatePageSize(); // Initial check


})






// Function to empty all fields in ruleForm
function emptyRuleForm() {
  for (const key in ruleForm) {
    ruleForm[key] = null;
  }
}

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  indicator_category_id: null,
  baseline: 0,
  target: 0,
  project_id:null,
  project_location_id: null,
  activity_id: null,
  programme_implementation_id:null,
  settlement_id: null,
  subcounty_id: null,
  ward_id: null,
  county_id: null,
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
  prevAmount: 0,
  cumAmount: 0,
  comments: '',
  units: 'Quantity',
  cumUnits: 'Cumulative(qty)'
})

const rules = reactive<FormRules>({
  project_id: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],

  project_location_id: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],


  activity_id: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],

  indicator_category_id: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],




  amount: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],

  date: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],


  comments: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],









})












const AddDialogVisible = ref(false)
const ImportDialogVisible = ref(false)
const formHeader = ref('Add M&E Report')
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



const handleClear = async () => {
  console.log('cleared....')

  // clear all the fileters -------
  filterValues = []
  filters = []
  value1.value = ''
  value2.value = ''
  value3.value = ''
  pageSize.value = 5
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
  pageSize.value = size
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
  formData.limit = pageSize.value
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
  tableDataList.value = res.data.filter(item => item.indicator_category.indicator.type === 'outcome');




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

const projectOptions = ref([])
const indicatorsOptions = ref([])
const indicatorsOptionsFiltered = ref([])

const getIndicatorNames = async () => {
  console.log('getIndicatorNames >>>>>>>>>>>>>>>>>>>>>>>>>>>>')
  const formData = {
    curUser: 1,
    model: 'indicator_category',
    searchField: 'name',
    searchKeyword: '',
    assocModel: '',
    filters: [],
    filterValues: [],
    associated_multiple_models: ['project', 'category', 'activity', 'indicator'],
  };

  const res = await getSettlementListByCounty(formData);
  console.log('indicator_category Response:', res);

  res.data.forEach((arrayItem) => {

    console.log('=====>',arrayItem.project)
    const opt = {
      value: arrayItem.id,
      label: `${arrayItem.indicator_name} | ${arrayItem.category.category}`,
      title: arrayItem.category.title,
      project_id: arrayItem.project.id,
    // activity_id: arrayItem.activity.id,
      programme_implementation_id: arrayItem.programme_implementation_id,
      county_id: arrayItem.project.county_id,
      subcounty_id: arrayItem.project.subcounty_id,
      settlement_id: arrayItem.project.settlement_id,
      ward_id: arrayItem.project.ward_id,
      unit: arrayItem.indicator.unit,
      baseline: arrayItem.baseline,
      target: arrayItem.target,
    };

    // Collect only output indicators
    if (arrayItem.indicator.type === 'outcome') {
      indicatorsOptions.value.push(opt);
      indicatorsOptionsFiltered.value.push(opt);
    }

    // Configure the project select options
    const projectExists = projectOptions.value.some(
      (prj) => prj.value === arrayItem.project.id
    );

    if (!projectExists) {
      const prj = {
        value: arrayItem.project.id,
        label: arrayItem.project.title,
        programme_implementation_id: arrayItem.project.implementation_id,
      };
      projectOptions.value.push(prj);
    }



    
  });

  console.log('indicatorsOptions.value', indicatorsOptions.value);
  console.log('projectOptions.value', projectOptions.value);

};


 



const editReport = async (data: TableSlotDefault) => {
  showSubmitBtn.value = false

  await getProjectLocations(data.project_id)

  showEditSaveButton.value = true
  console.log('editReport', data)
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
  ruleForm.project_location_id = data.project_location_id

  console.log("project_locations", project_locations.value)
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

  getCumulativeProgressEditPhase(data.indicator_category_id)
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

  formHeader.value = 'Add M&E Report'
  AddDialogVisible.value = false

}


const project_locations = ref([])
const getProjectLocations = async (project_id) => {
  console.log('project_id', project_id);
  console.log("Get Locations for  proejct : ", project_id)

  // Get the project settlement ids
  const formData = {
    model: 'project_location',
    searchField: 'name',
    searchKeyword: '',
    filters: ['project_id'],
    filterValues: [[project_id]],
    associated_multiple_models: []
  };

  const res = await getSettlementListByCounty(formData);
  const sett_ids = res.data.map(item => item.settlement_id); // Extract settlement_id
  console.log('sett_ids', sett_ids);

  // Fetch settlements and their details
  const form = {
    model: 'settlement',
    filters: ['id'],
    filterValues: [sett_ids],
    excludeGeom: true,
    associated_multiple_models: ['county', 'subcounty', 'ward']
  };

  const setts = await getSettlementListByCounty(form);
  console.log('setts', setts);

  // Map settlements to include additional details
  const settlements = setts.data.map(item => ({
    county: item.county.name,
    subcounty: item.subcounty.name,
    ward: item.ward.name,
    settlement: item.name,
    settlement_id: item.id
  }));

  // Join project locations with settlement details based on settlement_id
  project_locations.value = res.data.map(projectLocation => {
    const settlement = settlements.find(sett => sett.settlement_id === projectLocation.settlement_id);
    return {
      ...projectLocation,
      county: settlement ? settlement.county : null,
      subcounty: settlement ? settlement.subcounty : null,
      ward: settlement ? settlement.ward : null,
      settlementName: settlement ? settlement.settlement : null
    };
  });


  console.log('project_locations', project_locations.value);
};


const getProjectActivityIndicators = async (project_id) => {
  const formData = {}
 
  formData.model = 'indicator_category'
  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

 
  // - multiple filters -------------------------------------
 

  formData.filters = ['project_id']
  formData.filterValues = [[project_id]]
 

  formData.associated_multiple_models = ['indicator']
 
  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)
 
  console.log('This Project  Idnicator configs', res.data)
  return res.data
}


const disableIndicator=ref(false)
const changeProject = async (project: any) => {

  console.log('changeProject', project)
  ruleForm.project_location_id=null
   

  const sel_indicators = await getProjectActivityIndicators(project)

      const transformedArray = sel_indicators.map(item => {

        if (item.indicator.type=='outcome'){

          disableIndicator.value=false
          return {
              label: item.indicator_name,
              value: item.id,
              project_id: item.project_id,
              unit: item.indicator.unit
            };

        }else{
          disableIndicator.value=true
          return []
        }
      
      });


      indicatorsOptionsFiltered.value =transformedArray


  const filteredOpts = projectOptions.value.filter(item => item.value == project);

  console.log('filteredOpts', filteredOpts[0].programme_implementation_id)

  ruleForm.programme_implementation_id = filteredOpts[0].programme_implementation_id

  console.log(ruleForm)

  ruleForm.indicator_category_id = []
  ruleForm.activity_id = null

   

  getProjectLocations(project)



}


 

const changeLocation = async (location: any) => {
  console.log('changeLocation', location)

  const selected_location = project_locations.value.find(
    (item) => item.id === location
  );
  console.log('selected_location', selected_location)


  ruleForm.county_id = selected_location.county_id
  ruleForm.subcounty_id = selected_location.subcounty_id
  ruleForm.ward_id = selected_location.ward_id
  ruleForm.settlement_id = selected_location.settlement_id
  //ruleForm.project_location_id = location.id


  console.log('changeLocation', location)

}



const changeIndicator = async (indicator_category_id: any) => {
  ruleForm.indicator_category_id = indicator_category_id

  console.log('Filtre indicatorsOptionsFiltered', indicatorsOptionsFiltered)

  var filtredOptions = indicatorsOptionsFiltered.value.filter(function (el) {
    return el.value == indicator_category_id
  });

  console
  ruleForm.project_id = filtredOptions[0].project_id



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


const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ruleForm.model = 'indicator_category_report'
      ruleForm.period = getQuarter()
      ruleForm.code = uuid.v4()
      ruleForm.userId = userInfo.id

      

      console.log('cumProgress', ruleForm.value)

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





const getCumulativeProgress = async () => {

  var filters = ['userId', 'indicator_category_id', 'county_id', 'subcounty_id', 'ward_id', 'project_id', 'programme_implementation_id',
  ]

  var filterValues = [[userInfo.id], [ruleForm.indicator_category_id], [ruleForm.county_id], [ruleForm.subcounty_id], [ruleForm.ward_id],
  [ruleForm.project_id], [ruleForm.programme_implementation_id]]  // remember to change here!



  if (ruleForm.settlement_id) {
    filters.push('settlement_id')
    filterValues.push([ruleForm.settlement_id])
  }


  console.log('filters', filters)
  console.log('filterValues', filterValues)
  const formData = {}
  formData.limit = pageSize.value
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
  formData.limit = pageSize.value
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
 
//getCategoryOptions()
getInterventionsAll()


 



const tableRowClassName = (data) => {
   
  if (data.row.status == 'Rejected') {
    return 'danger-row'
  }
  if (data.row.status == 'Approved') {
    return 'success-row'
  }

  return ''
}







const DocTypes = ref([])
const getDocumentTypes = async () => {
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
const locationStatus = ref('')
const projectLocationColor = ref('red')
const showMap = (row) => {
  console.log(row)

  reportDetails.value = row



  dialogMap.value = true
  reportGeom.value = reportDetails.value.geom.coordinates
  projectGeom.value = reportDetails.value.project.geom


  var centroid = turf.centroid(reportDetails.value.project.geom);

  var options = { units: 'kilometers' };

  var distance = turf.distance(reportDetails.value.geom, centroid, options);
  console.log('distance , ', distance)

  if (distance < 1) {
    projectLocationColor.value = 'green'
  }

  locationStatus.value = 'The report is ' + distance.toFixed(2) + ' kilometers from the center of the project'
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
        'line-color': projectLocationColor.value,
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
      filter: ['in', '$type', 'Polygon'], // Include both Polygon and MultiPolygon types
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

const openHelp = ref(false)


const activeStep = ref(0)



const nextStep = async () => {
  console.log(ruleFormRef.value)
  await ruleFormRef.value?.validate((valid) => {
    if (valid) {
      if (activeStep.value < 3) {
        activeStep.value++
      }
    }
  })


}



const prevStep = () => {
  if (activeStep.value > 0) {
    activeStep.value--;
  }
}

const tableRef = ref(null);


const handleCancel = () => {
  disableIndicator.value=false
  AddDialogVisible.value = false
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
      <el-select v-model="value2" :onChange="handleSelectIndicatorCategory" :onClear="handleClear" multiple clearable
        filterable collapse-tags placeholder="Filter by Project/Indicator" style="width: 450px; margin-right: 10px;">
        <el-option v-for="item in indicatorsOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>


      <!-- Action Buttons -->
      <div style="display: flex; align-items: center; gap: 10px; margin-right: 10px;">
        <el-tooltip content="Add Report " placement="top">
          <el-button v-if="showEditButtons" :onClick="AddReport" type="primary" :icon="Plus" />
        </el-tooltip>

      </div>



      <!-- Download All Component -->
      <!-- <DownloadToCSV v-if="showEditButtons && tableDataList.length >0" :model="model"  />  -->
      <DownloadAll v-if="showEditButtons" :model="model" :associated_models="associated_multiple_models" />

    </el-row>



    <div v-if="dynamicComponent">
      <upload-component :is="dynamicComponent" v-bind="componentProps" />
    </div>




    <el-table :data="tableDataList" style="width: 100%; margin-top: 10px;" border :row-class-name="tableRowClassName"
      @expand-change="handleExpand" ref="tableRef">

      <el-table-column type="expand">
        <template #default="props">

          <div>
            <list-documents :is="dynamicDocumentComponent" v-bind="DocumentComponentProps"
              @openDialog="toggleComponent(props.row)" />
          </div>

        </template>
      </el-table-column>
      <el-table-column label="#" width="80" prop="id" sortable>
        <template #default="scope">
          <div v-if="scope.row.documents.length > 0" style="display: inline-flex; align-items: center;">
            <span>{{ scope.row.id }}</span>
            <Icon icon="material-symbols:attachment" style="margin-left: 4px;" />
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Indicator" width="400" prop="indicator_category.indicator.name" sortable />
      <el-table-column label="Date" prop="date" sortable>
        <template #default="scope">
          {{ formatDate(scope.row.date) }}
        </template>
      </el-table-column>

      <el-table-column label="Category" prop="indicator_category.category_title" sortable />
      <el-table-column label="Amount" prop="amount" sortable />

      <el-table-column label="Status" prop="status" sortable>
        <template #default="scope">
          <div v-if="scope.row.status === 'Rejected'">
            <el-tooltip :content="scope.row.reject_msg" placement="top">
              <span>{{ scope.row.status }}</span>
            </el-tooltip>
          </div>
          <div v-else>
            <span>{{ scope.row.status }}</span>
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
                <el-dropdown-item v-if="showEditButtons" @click="editReport(scope as TableSlotDefault)"
                  :icon="Edit">Edit</el-dropdown-item>
                <el-dropdown-item v-if="showAdminButtons" @click="DeleteReport(scope.row as TableSlotDefault)"
                  :icon="Delete" color="red">Delete</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <div v-else>
            <el-tooltip content="Edit" placement="top">
              <el-button v-if="showEditButtons" type="success" size="small" :icon="Edit"
                @click="editReport(scope.row as TableSlotDefault)" :disabled="scope.row.status == 'Approved'" circle />
            </el-tooltip>

            <el-tooltip content="Map" placement="top">
              <el-button v-if="showEditButtons" type="warning" size="small" :icon="Position"
                :disabled="isGeomNull(scope.row.geom)" @click="showMap(scope.row as TableSlotDefault)" circle />
            </el-tooltip>
            <el-tooltip content="Delete" placement="top">
              <el-popconfirm confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
                title="Are you sure to delete this report?" @confirm="DeleteReport(scope.row as TableSlotDefault)">
                <template #reference>
                  <el-button v-if="showAdminButtons" type="danger" size="small" :icon=Delete circle />
                </template>
              </el-popconfirm>
            </el-tooltip>

          </div>
        </template>
      </el-table-column>

    </el-table>


    <ElPagination layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
      v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 200, 10000]" :total="total" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
  </el-card>



  <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formHeader" :width="dialogWidth">

    <el-steps :active="activeStep" align-center finish-status="success" style="margin-bottom: 20px;">
      <el-step title="Project Details" />
      <el-step title="Activity Details" />
      <el-step title="Output" />
      <el-step title="Submit" />
    </el-steps>

    <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="100px" label-position="top">
      <el-row v-if="activeStep == 0" :gutter="20">
        <el-col :span="24">
          <el-form-item id="btn1" label="Project" prop="project_id">
            <el-select v-model="ruleForm.project_id" prop="project_id" placeholder="Select Project" clearable filterable
              :onChange="changeProject" style="width: 90%;">
              <el-option v-for="option in projectOptions" :key="option.value" :label="option.label"
                :value="option.value">
                <span class="option-text">{{ option.label }}</span>
              </el-option>
            </el-select>
            <el-text v-if="disableIndicator" class="mx-1" type="danger">No outcome indicators are configured for this project</el-text>

          </el-form-item>

          <el-form-item id="btn2" label="Location" prop="project_location_id">
            <el-select  :disabled="disableIndicator"  ref="ref2" v-model="ruleForm.project_location_id" value-key="id" placeholder="Select"
              @change="changeLocation" style="width: 100%;">
              <el-option v-for="item in project_locations" :key="item.id" :label="item.settlementName" :value="item.id">
                <div style="display: flex; align-items: center;">
                  <span style="flex: 1; text-align: left;">{{ item.settlementName }}</span>
                  <span style="flex: 2; color: var(--el-text-color-secondary); font-size: 12px; text-align: right;">
                    {{ item.ward }}, {{ item.subcounty }}, {{ item.county }}
                  </span>
                </div>
              </el-option>
            </el-select>

          </el-form-item>
        </el-col>
      </el-row>

      <el-row v-if="activeStep == 1" :gutter="20">
        <el-col :span="24">
          <!-- <el-form-item id="btn3" label="Activity" prop="activity_id">
            <el-select-v2 filterable v-model="ruleForm.activity_id" @change="changeActivity" style="width: 100%"
              :options="activityOptionsFiltered" placeholder="Select Activity" />
          </el-form-item> -->

          <el-form-item id="btn4" label="Indicator" prop="indicator_category_id">
            <el-select-v2 filterable v-model="ruleForm.indicator_category_id" @change="changeIndicator"
              :options="indicatorsOptionsFiltered"  :disabled="disableIndicator" style="width: 100%" placeholder="Select Indicator"  empty="No indicators"/>

            </el-form-item>

        </el-col>
      </el-row>

      <el-row v-if="activeStep === 2" :gutter="20">
        <el-col :span="12">
          <el-form-item id="btn5" :label="ruleForm.units" prop="amount">
            <el-input-number v-model="ruleForm.amount" style="width: 100%;" />
          </el-form-item>
          <el-form-item id="btn8" label="Baseline">
            <el-input-number v-model="ruleForm.baseline" type="number" disabled style="width: 100%;">
              <template #prepend>Baseline(Amount)</template>
            </el-input-number>
          </el-form-item>
          <el-form-item id="btn10" label="Date" prop="date">
            <el-date-picker v-model="ruleForm.date" type="date" placeholder="Pick a day" style="width: 100%;" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item id="btn6" :label="ruleForm.cumUnits">
            <el-input-number v-model="ruleForm.cumAmount" type="number" disabled style="width: 100%;">
              <template #prepend>Cumulative(Amount)</template>
            </el-input-number>
          </el-form-item>
          <el-form-item id="btn9" label="Target">
            <el-input-number v-model="ruleForm.target" type="number" disabled style="width: 100%;">
              <template #prepend>Target(Amount)</template>
            </el-input-number>
          </el-form-item>
          <el-form-item id="btn11" label="Progress(%)">
            <el-input-number v-model="ruleForm.cumProgress" type="number" disabled style="width: 100%;">
              <template #prepend>Cumulative(Amount)</template>
            </el-input-number>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row v-if="activeStep === 3" :gutter="20">
        <el-col :span="24">
          <el-form-item id="btn12" label="Comments" prop="comments">
            <el-input v-model="ruleForm.comments" type="textarea" placeholder="Do you have any comments?" />
          </el-form-item>

          <el-upload id="btn13" v-model:file-list="fileUploadList" class="upload-demo"
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
        <el-row :gutter="5">
          <el-col :span="24">
            <!-- <el-button type="primary" plain @click="openHelp = true">Help</el-button> -->
            <el-button @click="prevStep" :disabled="activeStep === 0">Previous</el-button>

            <el-button :disabled="disableIndicator"   @click="nextStep" v-if="activeStep < 3">Next</el-button>
            <el-button @click="handleCancel">Cancel</el-button>
            <el-button v-if="showSubmitBtn && activeStep === 3" type="primary"
              @click="submitForm(ruleFormRef)">Submit</el-button>
            <el-button v-if="showEditSaveButton && activeStep === 3" type="primary"
              @click="editForm(ruleFormRef)">Save</el-button>
          </el-col>
        </el-row>
      </span>
    </template>


  </el-dialog>


  <el-dialog v-model="ImportDialogVisible" @close="handleClose" title="Import multiple reports" :width="dialogWidth"
    draggable>
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

  <el-dialog v-model="dialogMap" width="50%" draggable :before-close="closeMap" :show-close="false">
    <template #header="{ titleId, titleClass }">
      <div class="my-header">
        <h4 :id="titleId" :class="titleClass">Reporting Location</h4>
        <h2 :style="`color: ${projectLocationColor}; font-style: italic;`">{{ locationStatus }}</h2>
        <!-- Use the 'italicizedColor' variable -->
        <el-button type="danger" :icon="CircleCloseFilled" @click="closeMap">Close Map</el-button>
      </div>
    </template>
    <div id="mapContainer" class="basemap"></div>

  </el-dialog>



  <el-tour v-model="openHelp" z-index="100000">
    <el-tour-step target="#btn1" title="Project" description="Select the project you want to set up" />
    <el-tour-step target="#btn2" title="Location"
      description="Select the location where this project is implemented. Repeat this for every settlement the project is being implemented" />
    <el-tour-step target="#btn3" title="Activity"
      description="Select the  specific activity you wish to configure monitoring for" />
    <el-tour-step target="#btn4" title="Indicator"
      description="Select the  indicator associated with that activity. If not configured, use the + button to create a new indicator" />

    <el-tour-step target="#btn5" title="Quantity"
      description="Specify the amount/value/quantity for this reporting period.  " />

    <el-tour-step target="#btn6" title="Cumulative" description=" Shows the cumulative achievements todate" />



    <el-tour-step target="#btn8" title="Baseline" description="Shows the value at the start of the activity" />


    <el-tour-step target="#btn9" title="Target" description="Targeted quantity/amount/value" />


    <el-tour-step target="#btn10" title="Date" description="Specify reporting date." />

    <el-tour-step target="#btn11" title="Progress"
      description="Progress of achievements. How much of the quantity has been achieved todate?" />


    <el-tour-step target="#btn12" title="Comments"
      description="Provide any commentary or additional information related to this submission" />

    <el-tour-step target="#btn13" title="Documentation"
      description="Upload any documentation that is required. It includes photos, reports of data" />




  </el-tour>



</template>



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

<style>
.el-table .danger-row {
  --el-table-tr-bg-color: var(--el-color-danger-light-9);
  --el-table-tr-text-color: var(--el-color-danger);
  color: var(--el-table-tr-text-color);
}

.el-table .success-row {
  --el-table-tr-bg-color: var(--el-color-success-light-9);
  --el-table-tr-text-color: var(--el-color-success);
  color: var(--el-table-tr-text-color);
}

.item {
  margin-top: 10px;
  margin-right: 40px;
}
</style>
