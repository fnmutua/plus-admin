<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { getSettlementListByCounty, uploadFilesBatch } from '@/api/settlements'
import { ElButton, ElMessageBox, ElSelect, ElSelectV2, ElStep, ElSteps, FormInstance, ElCard } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Plus,
  Edit,
  Download,
  Filter,
  Delete,
  UploadFilled,
  Back,
  InfoFilled
} from '@element-plus/icons-vue'

import { ref, reactive, computed } from 'vue'
import {
  ElPagination, ElInputNumber, ElTable,
  ElTableColumn, ElDropdown, ElDropdownItem, ElDropdownMenu,
  ElTooltip, ElOption, ElDialog, ElForm, ElFormItem, ElUpload, ElInput, FormRules, ElPopconfirm, ElCol, ElRow
} from 'element-plus'

import { useRouter } from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord, deleteDocument } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import type { UploadProps, UploadUserFile } from 'element-plus'
import readXlsxFile from 'read-excel-file'
import { getModelSpecs } from '@/api/fields'
import { UserType } from '@/api/register/types'
import { Icon } from '@iconify/vue';


import UploadComponent from '@/views/Components/UploadComponent.vue';
import { defineAsyncComponent } from 'vue';
import ListDocuments from '@/views/Components/ListDocuments.vue';


 
 

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])


 
const page = ref(1)
const pSize = ref(5)
 const pageSize = ref(5)
const currentPage = ref(1)
const total = ref(0)
const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)


// Function to empty all fields in ruleForm
function emptyRuleForm() {
  for (const key in ruleForm) {
    ruleForm[key] = null;
  }
}

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  project_location_id: null,
  project_id: null,
  ward_id: null,
  settlement_id: null,
  subcounty_id: null,
  county_id: '',
  location_name: '',
  actual_male_ben: null,
  actual_female_ben: null,
  target_male_ben: null,
  target_female_ben: null,
  code: null,
  comments:null
})

const rules = reactive<FormRules>({
  project_id: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],

  project_location_id: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],

  actual_male_ben: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],
  actual_female_ben: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],
  target_male_ben: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],

  target_female_ben: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],


})


const AddDialogVisible = ref(false)
 
const formHeader = ref('Add Beneficiary Report')
const showSubmitBtn = ref(false)
const showProcessBtn = ref(true)
const addMoreDocuments = ref(false)



const showEditSaveButton = ref(false)

let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var filterValues = []  // remember to change here!
var tblData = []
const associated_Model = null
const model = 'project_beneficiary'
const associated_multiple_models = ['project_location', 'document', 'project']
const nested_models = [] // The mother, then followed by the child

//// ------------------parameters -----------------------////

const fileUploadList = ref<UploadUserFile[]>([])


const fieldSet = ref([])
const show = ref(false)


const { t } = useI18n()



const handleClear = async () => {
  //console.log('cleared....')

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

const  handleSelectProject = async (project_id: any) => {
  var selectOption = 'project_id'
  if (!filters.includes(selectOption)) {
    filters.push(selectOption)
  }
  var index = filters.indexOf(selectOption) // 1
  //console.log('county : index--->', index)

  // clear previously selected
  if (filterValues[index]) {
    // filterValues[index].length = 0
    filterValues.splice(index, 1)
  }

  if (!filterValues.includes(project_id) && project_id.length > 0) {
    filterValues.splice(index, 0, project_id) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
  }

  // expunge the filter if the filter values are null
  if (project_id.length === 0) {
    filters.splice(index, 1)
  }

 
 

  getFilteredData(filters, filterValues)
}


const onPageChange = async (selPage: any) => {
  //console.log('on change change: selected counties ', selCounties)
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

  //console.log(selModel)
  var formData = {}
  formData.model = selModel
  //console.log("gettign fields")


  await getModelSpecs(formData).then((response) => {

    var data = response.data

    var fields = data.filter(function (obj) {
      return (obj.field !== 'id');
    });

    var fields2 = fields.filter(function (obj) {
      return (obj.field !== 'geom');
    });

    //console.log("fields:", fields2)
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
  //formData.nested_models = nested_models

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('Reports collected........', res)
  tableDataList.value = res.data;

  //tableDataList.value = res.data
  total.value = res.total


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
  //console.log('indicator_category Re', res)

  res.data.forEach(function (arrayItem: { id: string; type: string }) {
    var opt = {}
    //console.log(arrayItem)
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
    if (arrayItem.indicator.type == 'output') {
      indicatorsOptions.value.push(opt)
      indicatorsOptionsFiltered.value.push(opt)
    }

  })

  //console.log('indicatorsOptions.value', indicatorsOptions.value)
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
  // //console.log('project', res)

  res.data.forEach(function (arrayItem: { id: string; type: string }) {
    var opt = {}
    //console.log(arrayItem)
    opt.value = arrayItem.id
    opt.label = arrayItem.title
    opt.programme_implementation_id = arrayItem.implementation_id
    projectOptions.value.push(opt)


    arrayItem.activities.forEach(function (activity: any) {
      //   //console.log('activity--->', activity)

      var act = {}
      //console.log(activity)
      act.value = activity.id
      act.label = activity.title
      act.project_id = arrayItem.id
      activityOptions.value.push(act)
      activityOptionsFiltered.value.push(act)

    })
  })

}



const editReport = async (data: TableSlotDefault) => {
  showSubmitBtn.value = false

  await getProjectLocations(data.project_id)

  showEditSaveButton.value = true
  //console.log('editReport',data)
  ruleForm.id = data.id
  ruleForm.county_id = data.county_id
  ruleForm.subcounty_id = data.subcounty_id
  ruleForm.settlement_id = data.settlement_id
  ruleForm.ward_id = data.ward_id
  ruleForm.project_location_id = data.project_location_id

  

  ruleForm.project_id = data.project_id
  ruleForm.actual_female_ben = data.actual_female_ben
  ruleForm.actual_male_ben = data.actual_male_ben
  ruleForm.target_female_ben = data.target_female_ben
  ruleForm.target_male_ben = data.target_male_ben
  ruleForm.comments = data.comments


  formHeader.value = 'Edit Beneficiary'
  fileUploadList.value = data.documents


 
  AddDialogVisible.value = true
}



const DeleteReport = (data: TableSlotDefault) => {
  //console.log('----->', data)
  let formData = {}
  formData.id = data.id
  formData.model = 'project_beneficiary'


  DeleteRecord(formData)
  //console.log("Docs to de;ete", data.documents.length)

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


  //console.log(tableDataList.value)

  // remove the deleted object from array list 
  let index = tableDataList.value.indexOf(data);
  if (index !== -1) {
    tableDataList.value.splice(index, 1);
  }

}


const currentRow = ref()

const handleClose = () => {

  //console.log("Closing the dialoig")
  showSubmitBtn.value = true
  showEditSaveButton.value = false

  formHeader.value = 'Add Beneficiary Report'
  AddDialogVisible.value = false
  activeStep.value=0

}


const project_locations = ref([])
const getProjectLocations = async (project_id) => {
  //console.log('project_id', project_id);
  //console.log("Get Locations for  proejct : ", project_id)

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
  //console.log('sett_ids', sett_ids);

  // Fetch settlements and their details
  const form = {
    model: 'settlement',
    filters: ['id'],
    filterValues: [sett_ids],
    excludeGeom: true,
    associated_multiple_models: ['county', 'subcounty', 'ward']
  };

  const setts = await getSettlementListByCounty(form);
  //console.log('setts', setts);

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


  //console.log('project_locations', project_locations.value);
};


const changeProject = async (project: any) => {

  //console.log('changeProject', project)

  const filteredOpts = projectOptions.value.filter(item => item.value == project);

  //console.log('filteredOpts', filteredOpts[0].programme_implementation_id)

  ruleForm.programme_implementation_id = filteredOpts[0].programme_implementation_id

  //console.log(ruleForm)

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

  getProjectLocations(project)



}




const changeLocation = async (location: any) => {
  //console.log('changeLocation', location)

  const selected_location = project_locations.value.find(
    (item) => item.id === location
  );
  //console.log('selected_location', selected_location)


  ruleForm.county_id = selected_location.county_id
  ruleForm.subcounty_id = selected_location.subcounty_id
  ruleForm.ward_id = selected_location.ward_id
  ruleForm.settlement_id = selected_location.settlement_id
  //ruleForm.project_location_id = location.id


  //console.log('changeLocation', location)

}



const changeIndicator = async (indicator_category_id: any) => {
  ruleForm.indicator_category_id = indicator_category_id

  //console.log('Filtre indicator_category_id', indicator_category_id)

  var filtredOptions = indicatorsOptions.value.filter(function (el) {
    return el.value == indicator_category_id
  });

  ruleForm.project_id = filtredOptions[0].project_id



  //console.log("Filtered Indicators", filtredOptions[0])
  ruleForm.units = "Quantity(" + filtredOptions[0].unit + ")"
  ruleForm.cumUnits = "Cumulative(" + filtredOptions[0].unit + ")"

  ruleForm.baseline = filtredOptions[0].baseline
  ruleForm.target = filtredOptions[0].target

  //ruleForm.indicator_category_title = filtredOptions[0].category_title


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
      ruleForm.model = 'project_beneficiary'
      ruleForm.period = getQuarter()
      ruleForm.code = uuid.v4()
      ruleForm.userId = userInfo.id

      //console.log('cumProgress', ruleForm.cumProgress)



      const report = await CreateRecord(ruleForm)   // first save the form on DB
      //console.log("Report", report.data.id)

      emptyRuleForm()

      // uploading the documents 

      const formData = new FormData()
      for (var i = 0; i < fileUploadList.value.length; i++) {
        //console.log('------>file', fileList.value[i])
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



      //console.log('Befoer submit', formData)
      const docs = await uploadFilesBatch(formData)

      //console.log('after submit', docs.data)


      AddDialogVisible.value = false
      handleClose()

    } else {
      //console.log('error submit!', fields)
    }
  })
}



const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ruleForm.model = 'project_beneficiary'
      ruleForm.userId = userInfo.id
      //console.log(ruleForm.value)
      await updateOneRecord(ruleForm).then(() => { })

      //emptyRuleForm()
      // dialogFormVisible.value = false

      const updateformData = new FormData()
      // uploading the documents 

      for (var i = 0; i < fileUploadList.value.length; i++) {

        //console.log('------>file', fileUploadList.value[i])

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



      //console.log('Befoer submit', updateformData)
      const docs = await uploadFilesBatch(updateformData)

      //console.log('after submit', docs.data)





    } else {
      //console.log('error submit!', fields)
    }
  })
}


const batchData = ref([])
 




 

/// Import multiple reports - ----------------
// ----------------------------------------------
//const parentModels = ['county']
const parentModels = ['county', 'settlement', 'indicator_category']
const parentCodes = ['countyCode', 'settlementCode', 'indicator_categoryCode']
 


const uploadedData = ref([])

const parentData = ref([]);
 

const fileList = ref<UploadUserFile[]>([])

const handleRemove: UploadProps['onRemove'] = (file, uploadFiles) => {
  //console.log(file, uploadFiles)
  show.value = false
  uploadedData.value = []
  batchData.value = []
  fieldSet.value = []

}

const handlePreview: UploadProps['onPreview'] = (uploadFile) => {
  //console.log(uploadFile)
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
  //console.log('on file change.......', event)
  //file.value = event.target.files ? event.target.files[0] : null;   // Direct upload 
  file.value = event   // called from the uplaod funtion 

  //console.log('The file---->', file)

  await readXlsxFile(file.value).then((rows) => {
    const fields = Object.values(rows[0]) //  get all proterit4s of the first feature
    //console.log("fields-->", fields)


    for (let j = 1; j < rows.length; j++) {
      var record = {}
      for (let i = 0; i < fields.length; i++) {
        var f = fields[i]
        var v = rows[j][i]
        record[f] = v
        //  //console.log(record)
      }

      //console.log("record", record) // Push to the temporary holder
      uploadedData.value.push(record)

    }  // remove header row

  })





  //console.log('Parent data', parentData.value)



  for (let k = 0; k < parentData.value.length; k++) {
    //console.log('processing parent', k)
    var pcode = parentCodes[k]
    let editedArrray = []
    //console.log('processing code', pcode)

    //  //console.log(uploadedData.value[1][pcode])

    for (let i = 0; i < uploadedData.value.length; i++) {


      var parentMatch = parentData.value[k].filter(function (el) {
        return el.code === uploadedData.value[i][pcode]
      });


      if (parentMatch.length > 0) {
        let pkey = parentModels[k] + '_id'
        //console.log('parentMatch', pkey, parentMatch)

        parentMatch[0][pkey] = parentMatch[0]['id'];
        //console.log(parentMatch[0])


        const keys_to_keep = [pkey];
        const result = parentMatch.map(e => {
          const obj = {};
          keys_to_keep.forEach(k => obj[k] = e[k])
          return obj;
        });

        //  //console.log(result);


        const match = { ...uploadedData.value[i], ...result[0] };
        editedArrray.push(match)
      }

    }



    //console.log('Proceeed............')
    // proceed
    if (editedArrray.length > 0) {
      uploadedData.value = editedArrray.slice(0);
    }

  }

  const mergedfields = (Object.getOwnPropertyNames(uploadedData.value[0]));  // get properties from first row

  //console.log('mergedfields', mergedfields)

  makeOptions(mergedfields)
  show.value = true
  showSubmitBtn.value = true
  showProcessBtn.value = false
}

 

getModeldefinition(model)

getIndicatorNames()
getProjects()
//getCategoryOptions()
getInterventionsAll()


//getProjects()



const tableRowClassName = (data) => {
  // //console.log('Row Styling --------->', data.row)
  // if (data.row.documents.length > 0) {
  //   return 'warning-row'
  // }
  if (data.row.status == 'Rejected') {
    return 'danger-row'
  }
  if (data.row.status == 'Approved') {
    return 'success-row'
  }

  return ''
}

 

 
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

 


/// Uplaod docuemnts from a central component 
const mfield = 'beneficiary_report_id'
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
  //console.log('Compnnent data', row)
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

 

const activeStep = ref(0) 
const nextStep = async () => {
  //console.log(ruleFormRef.value)
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
v-model="value2" :onChange=" handleSelectProject" :onClear="handleClear" multiple clearable collapse-tags

        filterable   placeholder="Filter by Project" style="width: 80%; margin-right: 10px;">
        <el-option v-for="item in projectOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>


      <!-- Action Buttons -->
      <div style="display: flex; align-items: center; gap: 10px; margin-right: 10px;">
        <el-tooltip content="Add Beneficiary " placement="top">
          <el-button v-if="showEditButtons" :onClick="AddReport" type="primary" :icon="Plus" />
        </el-tooltip>
        <el-button :onClick="DownloadXlsx" type="primary" :icon="Download" />
        <el-button :onClick="handleClear" type="primary" :icon="Filter" />

      </div>

      <!-- Download All Component -->
    </el-row>



    <div v-if="dynamicComponent">
      <upload-component :is="dynamicComponent" v-bind="componentProps" />
    </div>

    <el-table
:data="tableDataList" style="width: 100%; margin-top: 10px;" border :row-class-name="tableRowClassName"
      @expand-change="handleExpand">

      <el-table-column type="expand">
        <template #default="props">

          <div>
            <list-documents
:is="dynamicDocumentComponent" v-bind="DocumentComponentProps"
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

      <el-table-column label="Project" width="400" prop="project.title" sortable />
      <el-table-column label="Settlement" prop="project_location.location_name" sortable />

      <el-table-column label="Female Beneficiaries" prop="actual_female_ben" sortable />
      <el-table-column label="Male Beneficiaries" prop="actual_male_ben" sortable />

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
v-if="showEditButtons" type="success" size="small" :icon="Edit"
                @click="editReport(scope.row as TableSlotDefault)" :disabled="scope.row.status == 'Approved'" circle />
            </el-tooltip>
            <el-tooltip content="Delete" placement="top">
              <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
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


    <ElPagination
layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
      v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 200, 10000]" :total="total" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
  </el-card>
 
  <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formHeader" :width="dialogWidth">
    <el-steps :active="activeStep" align-center finish-status="success" style="margin-bottom: 20px;">
      <el-step title="Project Details" />
      <el-step title="Beneficiaries" />
      <el-step title="Submit" />
    </el-steps>

    <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="100px" label-position="top">
      <el-row v-if="activeStep == 0" :gutter="20">
        <el-col :span="24">
          <el-form-item id="btn1" label="Project" prop="project_id">
            <el-select-v2
filterable v-model="ruleForm.project_id" @change="changeProject" style="width: 100%"
              :options="projectOptions" placeholder="Select Project" />
          </el-form-item>

          <el-form-item id="btn2" label="Location" prop="project_location_id">
            <el-select
ref="ref2" v-model="ruleForm.project_location_id" value-key="id" placeholder="Select"
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


      <el-row v-if="activeStep === 1" :gutter="20">
        <el-col :span="12">
          <el-form-item id="btn5" label="Target (Female)" prop="target_female_ben">
            <el-input-number v-model="ruleForm.target_female_ben" style="width: 100%;" />
          </el-form-item>
          <el-form-item id="btn8" label="Target (Male)" prop="target_male_ben">
            <el-input-number v-model="ruleForm.target_male_ben" style="width: 100%;" />
          </el-form-item>

        </el-col>

        <el-col :span="12">
          <el-form-item id="btn5" label="Actual (Female)" prop="actual_female_ben">
            <el-input-number v-model="ruleForm.actual_female_ben" style="width: 100%;" />
          </el-form-item>
          <el-form-item id="btn8" label="Actual (Male)" prop="actual_male_ben">
            <el-input-number v-model="ruleForm.actual_male_ben" style="width: 100%;" />
          </el-form-item>

        </el-col>
      </el-row>

      <el-row v-if="activeStep === 2" :gutter="20">
        <el-col :span="24">
          <el-form-item id="btn12" label="Comments" prop="comments">
            <el-input v-model="ruleForm.comments" type="textarea" placeholder="Do you have any comments?" />
          </el-form-item>

          <el-upload
id="btn13" v-model:file-list="fileUploadList" class="upload-demo"
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

            <el-button @click="nextStep" v-if="activeStep < 2">Next</el-button>
            <el-button @click="AddDialogVisible = false">Cancel</el-button>
            <el-button
v-if="showSubmitBtn && activeStep === 2" type="primary"
              @click="submitForm(ruleFormRef)">Submit</el-button>
            <el-button
v-if="showEditSaveButton && activeStep === 2" type="primary"
              @click="editForm(ruleFormRef)">Save</el-button>
          </el-col>
        </el-row>
      </span>
    </template>


  </el-dialog>

 


 


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
