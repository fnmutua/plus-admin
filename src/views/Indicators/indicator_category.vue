<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { getSettlementListByCounty, getListManyToMany } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { ElButton, ElSelect, ElSelectV2, ElTour, ElTourStep, ElCard } from 'element-plus'

import {
  Plus,
  Edit,
  Delete,
  Download, Back,
  Filter
} from '@element-plus/icons-vue'

import { ref, reactive, onMounted, computed } from 'vue'
import {
  ElPagination, ElInputNumber, ElTable,
  ElTableColumn, ElDropdown, ElDropdownItem, ElDropdownMenu, ElSwitch,
  ElTooltip, ElOption, ElDialog, ElForm, ElRow, ElFormItem, ElInput, FormRules, ElPopconfirm
} from 'element-plus'


import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import xlsx from "json-as-xlsx"
import DownloadAll from '@/views/Components/DownloadAll.vue';
import type { ButtonInstance } from 'element-plus'
import { v5 } from 'uuid'

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


console.log("userInfo--->", userInfo) 
const isMobile = computed(() => appStore.getMobile)

console.log('IsMobile', isMobile)

const dialogWidth = ref()
const actionColumnWidth = ref()

if (isMobile.value) {
  dialogWidth.value = "100px"
  actionColumnWidth.value = "100px"
} else {
  dialogWidth.value = "25%"
  actionColumnWidth.value = "160px"

}




const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  indicator_id: '',
  indicator_name: '',
  category_id: '',
  baseline: null,
  target: null,
  category_title: '',
  frequency: '',
  activity_id: null,
  code: null,
  project_id: null,
  project_location_id: null
})


const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
const categoryOptions = ref([])
const categories = ref([])
const filteredIndicators = ref([])
const page = ref(1)
const selCounties = []
const loading = ref(true)
const currentPage = ref(1)
const total = ref(0)


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





const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)


const AddDialogVisible = ref(false)
const formHeader = ref('Configure Indicator')
const showSubmitBtn = ref(true)
const showEditSaveButton = ref(false)


console.log("Show Buttons -->", showAdminButtons)



let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var filterValues = []
var tblData = []
const associated_Model = ''
const associated_multiple_models = ['indicator', 'project', 'activity', 'category', 'project_location']
const model = 'indicator_category'
const nested_models = ['indicator', 'activity'] // The mother, then followed by the child
// const nested_models = [] // The mother, then followed by the child

//// ------------------parameters -----------------------////

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

const handleSelectIndicator = async (indicator: any) => {
  var selectOption = 'indicator_id'
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
  makeSettlementOptions(filteredIndicators)

  getFilteredData(filters, filterValues)
}

const handleSelectCategory = async (category: any) => {
  var selectOption = 'category_id'
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

  if (!filterValues.includes(category) && category.length > 0) {
    filterValues.splice(index, 0, category) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
  }

  // expunge the filter if the filter values are null
  if (category.length === 0) {
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

const indicatorsOptions = ref([])

const getIndicatorNames = async () => {
  indicatorsOptions.value = []
  indicatorsOptionsFiltered.value = []
  const res = await getCountyListApi({
    params: {
      //   pageIndex: 1,
      //    limit: 100,
      curUser: 1, // Id for logged in user
      model: 'indicator',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received indicators:', response)

    var ret = response.data

    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var opt = {}
      opt.value = arrayItem.id
      opt.activity_id = arrayItem.activity_id
      opt.label = arrayItem.name + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      indicatorsOptions.value.push(opt)
      indicatorsOptionsFiltered.value.push(opt)
    })
  })
}

const getCategoryOptions = async () => {
  const res = await getCountyListApi({
    params: {
      //   pageIndex: 1,
      //   limit: 100,
      curUser: 1, // Id for logged in user
      model: 'category',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)

    var ret = response.data

    loading.value = false
    // pass result to the makeoptions

    categories.value = ret
    makeSettlementOptions(categories)
  })
}

const makeSettlementOptions = (list) => {
  console.log('making the options..............', list)
  categoryOptions.value = []
  list.value.forEach(function (arrayItem: { id: string; type: string }) {
    var countyOpt = {}
    countyOpt.value = arrayItem.id
    countyOpt.label = arrayItem.category   //+ '(' + arrayItem.id + ')'

    //  console.log(countyOpt)
    categoryOptions.value.push(countyOpt)
  })
}



const frequencyOptions = ref([])

const getFrequencyOptions = async () => {
  frequencyOptions.value = []
  const res = await getCountyListApi({
    params: {
      //   pageIndex: 1,
      //    limit: 100,
      curUser: 1, // Id for logged in user
      model: 'frequency',
      searchField: 'frequency',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received frequency:', response)

    var ret = response.data

    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var opt = {}
      opt.value = arrayItem.id
      opt.label = arrayItem.frequency
      //  console.log(countyOpt)
      frequencyOptions.value.push(opt)
    })
  })
}


getFrequencyOptions()







 
const activityOptions = ref([])
const activityOptionsFiltered = ref([])

 

 

const projectOptions = ref([])
const projectList = ref([])

const getProjectActivities = async () => {
  const formData = {}
  // formData.limit = 10000
  formData.curUser = 1 // Id for logged in user
  formData.model = 'project'
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  formData.assocModel = ''

  // - multiple filters -------------------------------------
  formData.filters = []
  formData.filterValues = []
  formData.associated_multiple_models = ['activity']
  formData.associated_multiple_field = ['project_activity']

  //-------------------------
  //console.log(formData)
  const res = await getListManyToMany(formData)

  console.log('Projects >>', res)
  projectList.value = res.data
  res.data.forEach(function (arrayItem) {

    //console.log(arrayItem)
    var opt = {}
    opt.value = arrayItem.id
    opt.label = arrayItem.title + '(' + arrayItem.id + ')'
    opt.activities = arrayItem.activities
    opt.programme_implementation = arrayItem.programme_implementation

    //  console.log(countyOpt)
    projectOptions.value.push(opt)

    //console.log('projectOptions', arrayItem)

    arrayItem.activities.forEach(function (activity: { id: string; type: string }) {
      //console.log(arrayItem)
      var act_opt = {}
      act_opt.project_id = arrayItem.id   // this the project id that will be used to filter the acivty options 
      act_opt.value = activity.id
      act_opt.label = activity.title + '(' + activity.id + ')'

      //  console.log(countyOpt)
      activityOptions.value.push(act_opt)  // We keep this as backup 
 
    })

  })

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


const changeProject = async (project: any) => {

  console.log('!editingMode.value', editingMode.value)

  if (!editingMode.value) {
    ruleForm.activity_id = null
    ruleForm.indicator_id = null
    ruleForm.category_id = null
    ruleForm.frequency = null
  }



  console.log('Activities List Project ID>>', activityOptions.value)
  console.log('Activities List >>', project)

  const filter_activities = await activityOptions.value.filter(function (el) {
    return el.project_id == project
  });
  activityOptionsFiltered.value = filter_activities

  getProjectLocations(project)

}


// Get Filted Indicators 

const getProjectActivityIndicators = async (activity_id) => {
  const formData = {}
 
  formData.model = 'indicator'
  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

 
  // - multiple filters -------------------------------------

  console.log('undefined',activity_id)

  if(!activity_id){

     formData.filters = ['level']
     formData.filterValues = [['project']]

  } else {
    formData.filters = ['activity_id']
  formData.filterValues = [[activity_id]]

  }



  formData.associated_multiple_models = []
 
  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)
 
  console.log('This activity Idnicator', res.data)
  return res.data
}



const indicatorsOptionsFiltered = ref([])


const changeActivity = async (activity: any) => {

  ruleForm.indicator_id = null
  ruleForm.category_id = null
  ruleForm.frequency = null

  const sel_indicators = await getProjectActivityIndicators(activity)

  const transformedArray = sel_indicators.map(item => {
  return {
    label: item.name,
    value: item.id
  };
});

  indicatorsOptionsFiltered.value =transformedArray
  // indicatorsOptionsFiltered.value = indicatorsOptions.value.filter(function (el) {
  //   return el.activity_id == activity
  // });

}



getProjectActivities()
//getActivityOptions()
//getProjectOptions()

//getIndicatorNames()
getCategoryOptions()
getInterventionsAll()



const editingMode = ref(false)
const editIndicator = async (data: TableSlotDefault) => {
  showSubmitBtn.value = false
  showEditSaveButton.value = true
  editingMode.value = true

  console.log(data)
  ruleForm.id = data.row.id
  ruleForm.indicator_name = data.row.indicator.indicator_name
  ruleForm.indicator_id = data.row.indicator_id
  ruleForm.category_id = data.row.category_id
  ruleForm.frequency = data.row.frequency
  ruleForm.category_title = data.row.category_title
  ruleForm.activity_id = data.row.activity_id
  ruleForm.project_id = data.row.project_id
  ruleForm.target = data.row.target
  ruleForm.baseline = data.row.baseline
  ruleForm.project_location_id = data.row.project_location_id

  formHeader.value = 'Edit Indicator'
  changeProject(data.row.project_id)

  console.log(frequencyOptions.value)

  await getFrequencyOptions()
  AddDialogVisible.value = true
}


const DeleteIndicator = (data: TableSlotDefault) => {
  console.log('----->', data.row)
  let formData = {}
  formData.id = data.row.id
  formData.model = 'indicator_category'
  DeleteRecord(formData)
  console.log(tableDataList.value)

  // remove the deleted object from array list 
  let index = tableDataList.value.indexOf(data.row);
  if (index !== -1) {
    tableDataList.value.splice(index, 1);
  }

}


const handleClose = () => {

  console.log("Closing the dialoig")
  showSubmitBtn.value = true
  showEditSaveButton.value = false

  ruleForm.indicator_id = ''
  ruleForm.indicator_name = ''
  ruleForm.category_id = ''
  ruleForm.category_title = ''
  ruleForm.frequency = ''


  formHeader.value = 'Configure Indicator'
  AddDialogVisible.value = false

}


const changeCategory = async (category: any) => {
  ruleForm.category_id = category
  var filtredCategories = categoryOptions.value.filter(function (el) {
    return el.value == category
  });
  ruleForm.category_title = filtredCategories[0].label

}

const changeIndicator = async (indicator: any) => {
  ruleForm.indicator_id = indicator

  ruleForm.category_id = null
  ruleForm.frequency = null


 
  console.log("Filtered Idnciators", indicatorsOptionsFiltered.value[0].label)
  ruleForm.indicator_name = indicatorsOptionsFiltered.value[0].label
}






const rules = reactive<FormRules>({
  indicator_id: [
    { required: true, message: 'Please select an indicator', trigger: 'blur' }
  ],
  category_id: [{ required: true, message: 'The Indicator category is required', trigger: 'blur' }],
  frequency: [{ required: true, message: 'The Indicator frequency is required', trigger: 'blur' }],
  activity_id: [{ required: true, message: 'The Indicator Activity is required', trigger: 'blur' }],
  project_id: [{ required: true, message: 'Project is required', trigger: 'blur' }],
  target: [{ required: true, message: 'Target is required', trigger: 'blur' }],
  baseline: [{ required: true, message: 'Baseline is required', trigger: 'blur' }],

})

const AddIndicatorConfig = () => {
  AddDialogVisible.value = true
}



const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      ruleForm.model = 'indicator_category'
      ruleForm.code = ruleForm.indicator_id + '_' + ruleForm.activity_id + '_' + ruleForm.project_id + '_' + ruleForm.category_id
      const res = CreateRecord(ruleForm)
      console.log('ruleForm.code >>', ruleForm.code)
      //  AddDialogVisible.value = false

    } else {
      console.log('error submit!', fields)
    }
  })
}


const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;

  const valid = await new Promise<boolean>((resolve) => {
    formEl.validate((valid) => {
      resolve(valid);
    });
  });

  if (valid) {
    ruleForm.model = 'indicator_category';
    ruleForm.code = ruleForm.indicator_id + '_' + ruleForm.activity_id + '_' + ruleForm.project_id + '_' + ruleForm.category_id;

    await updateOneRecord(ruleForm);

    AddDialogVisible.value = false;
    ruleForm.project_id = null;
    ruleForm.activity_id = null;
    editingMode.value = false;
  } else {
    console.log('error submit!', formEl.fields);
  }
}







console.log('Options---->', indicatorsOptions)



const DownloadXlsx = async () => {
  console.log(tableDataList.value)

  // change here !
  let fields = [
    { label: "S/No", value: "index" }, // Top level data
    { label: "Indicator", value: "indicator" }, // Top level data
    { label: "Unit", value: "unit" }, // Custom format
    { label: "Level", value: "level" }, // Custom format
    { label: "Frequency", value: "frequency" }, // Custom format
    { label: "Category", value: "category" }, // Custom format

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
    thisRecord.indicator = tableDataList.value[i].indicator.name
    thisRecord.unit = tableDataList.value[i].indicator.unit
    thisRecord.level = tableDataList.value[i].indicator.level
    thisRecord.frequency = tableDataList.value[i].frequency
    thisRecord.category = tableDataList.value[i].category.category


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


// Add new catrogires 
const categoryFormRef = ref<FormInstance>()
const categoryForm = reactive({
  indicator_id: '',
  indicator_name: '',
  category_id: '',
  category_title: '',
  frequency: '',
  activity_id: null,
  code: null,
  project_id: null
})
const AddCategoryVisible = ref(false)
const AddCategory = () => {

  AddCategoryVisible.value = true
  console.log('adding....')


}


const submitCategoryForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => { // Make the callback function async
    if (valid) {
      categoryForm.model = 'category'
      categoryForm.code = uuid.v4()
      const res = await CreateRecord(categoryForm)

      var cat = {}
      cat.value = res.data.id
      cat.label = res.data.category

      categoryOptions.value.push(cat)


      // Handle the response here
    } else {
      console.log('error categoryForm!', fields)
    }
  })
}





const handleCloseCategory = () => {
  AddCategoryVisible.value = false
}


const handleCancelAddEdit = () => {
  ruleForm.activity_id = null
  ruleForm.project_id = null
  editingMode.value = false
  AddDialogVisible.value = false
}



// Add new Indicators  
//---------------------------------------------------
const indicatorFormRef = ref<FormInstance>()
const indicatorForm = reactive({
  name: '',
  type: '',
  unit: '',
  level: '',
  format: '',
  activity_id: '',
  desc: '',
})

const IndicatorRules = reactive({

  name: [
    { required: true, message: 'Please provide indicator name', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }
  ],
  type: [
    { required: true, message: 'Indicator type is required', trigger: 'blur' }],

  activity_id: [
    { required: true, message: 'Activity is required', trigger: 'blur' }],


  format: [
    { required: true, message: 'Indicator Formatt is required', trigger: 'blur' }],

  level: [
    { required: true, message: 'The  level is required', trigger: 'blur' }
  ]
})
const AddNewIndicatorVisible = ref(false)
const AddIndicator = () => {
  console.log('adding....')
  AddNewIndicatorVisible.value = true
}

const submitIndicatorForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => { // Make the callback function async
    if (valid) {
      indicatorForm.model = 'indicator'
      indicatorForm.code = uuid.v4()
      const res = await CreateRecord(indicatorForm)
      console.log(res.data)
      var ind = {}
      ind.value = res.data.id
      ind.label = res.data.name

      indicatorsOptionsFiltered.value.push(ind)
    } else {
      console.log('error categoryForm!', fields)
    }
  })

 
}

const handleCloseIndicator = () => {
  AddCategoryVisible.value = false
}




// Add new Activities
//---------------------------------------------------
const AddFrequencyVisible = ref(false)
const freqFormRef = ref<FormInstance>()
const freqForm = reactive({
  frequency: '',
})

const freqRules = reactive({

  title: [
    { required: true, message: 'Please provide indicator name', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }
  ],

})


const AddNewFreq = () => {
  console.log('adding....')
  AddFrequencyVisible.value = true

  // get this activtys project
  const thisProject = projectList.value.filter(function (el) {
    return el.id == ruleForm.activity_id
  });

  console.log('thisProject', thisProject[0])

}

const submitFreqForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => { // Make the callback function async
    if (valid) {
      freqForm.model = 'frequency'
      freqForm.code = uuid.v4()
      const res = await CreateRecord(freqForm)
      console.log(res.data)
      var act = {}
      act.value = res.data.id
      act.label = res.data.frequency

      frequencyOptions.value.push(act)
    } else {
      console.log('error categoryForm!', fields)
    }
  })
 
}

const handleCloseFreq = () => {
  AddFrequencyVisible.value = false

}

const openHelp = ref()

const ref2 = ref<ButtonInstance>()
const ref3 = ref<ButtonInstance>()
const ref4 = ref<ButtonInstance>()
const ref5 = ref<ButtonInstance>()
const ref6 = ref<ButtonInstance>()



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

const indicator_level = ref(true)




const handleSwitchChange = async (value) => {
  indicatorsOptionsFiltered.value=[]
  if (!value) {
        // The switch is inactive (set to 'Project Level Indicator')
        console.log('Switch is inactive');
        //getProjectActivityIndicators(undefined)

        const sel_indicators = await getProjectActivityIndicators(undefined)
          const transformedArray = sel_indicators.map(item => {
          return {
            label: item.name,
            value: item.id
          };
          });
          indicatorsOptionsFiltered.value =transformedArray 
        // Add your custom logic here
      } else {
        // The switch is active (set to 'Activity Level Indicator')
        console.log('Switch is active');
      }


}




const options = [
        { value: '1', label: ' This is a very long text option that might overflow the select box This is a very long text option that might overflow the select box This is a very long text option that might overflow the select box' },
        { value: '2', label: 'Another long text option to test wrapping or truncation' },
        { value: '3', label: 'Short option' }
      ]









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
v-model="value2" :onChange="handleSelectIndicator" :onClear="handleClear" multiple clearable filterable
        collapse-tags placeholder="Filter by Indicator" style="margin-right: 10px;">
        <el-option v-for="item in indicatorsOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-select
v-model="value3" :onChange="handleSelectCategory" :onClear="handleClear" multiple clearable filterable
        collapse-tags placeholder="Filter by Category">
        <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>

      <!-- Action Buttons -->
      <div style="display: flex; align-items: center; gap: 10px; margin-left: 10px;">
        <el-tooltip content="Add Indicator Configuration" placement="top">
          <el-button v-if="showAdminButtons" :onClick="AddIndicatorConfig" type="primary" :icon="Plus" />
        </el-tooltip>
        <el-button :onClick="DownloadXlsx" type="primary" :icon="Download" />

        <DownloadAll v-if="showEditButtons" :model="model" :associated_models="associated_multiple_models" />

        <el-button :onClick="handleClear" type="primary" :icon="Filter" />

      </div>

    </el-row>



    <el-table :data="tableDataList" :loading="loading" border style="width: 100%; margin-top: 10px;">
      <el-table-column label="Id" prop="id" width="50px" sortable />
      <!-- <el-table-column label="Activity" prop="activity.title" sortable /> -->
      <el-table-column label="Settlement" prop="project_location.location_name" sortable />
      <!-- <el-table-column label="Project" prop="project.title" sortable /> -->
      <el-table-column
      property="project.title"
      label="Project"
      show-overflow-tooltip
    />
    <el-table-column label="Indicator" prop="indicator.name" sortable />
    <el-table-column label="Dimension" prop="category_title" sortable />
      <el-table-column label="Target" prop="target" sortable />
      <!-- <el-table-column label="Baseline" prop="baseline" sortable /> -->



      <el-table-column fixed="right" label="Actions" :width="actionColumnWidth">
        <template #default="scope">
          <el-dropdown v-if="isMobile">
            <span class="el-dropdown-link">
              <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
v-if="showEditButtons" @click="editIndicator(scope as TableSlotDefault)" :icon="Edit"
                  color="green">Edit</el-dropdown-item>
                <el-dropdown-item
v-if="showAdminButtons" @click="DeleteIndicator(scope as TableSlotDefault)"
                  :icon="Delete" color="red">Delete</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <div v-else>

            <el-tooltip v-if="showEditButtons" content="Edit" placement="top">
              <el-button
type="success" size="small" :icon="Edit" @click="editIndicator(scope as TableSlotDefault)"
                circle />
            </el-tooltip>

            <el-tooltip v-if="showAdminButtons" content="Delete" placement="top">
              <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
                title="Are you sure to delete this record?" width="350"
                @confirm="DeleteIndicator(scope as TableSlotDefault)">
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
layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
      v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 200, 10000]" :total="total" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
  </el-card>

  <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formHeader" draggable>
    <el-col :xl="24" :lg="24" :md="24" :sm="24" :xs="24">

      <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="200px" label-position="left">

 
  
        <el-form-item id="btn1" label="Project" prop="project_id">
        

            <el-select
                v-model="ruleForm.project_id"  
                prop="project_id" 
                placeholder="Select an option" 
                clearable filterable 
                :onChange="changeProject"  
                style="width: 90%;" >
                  <el-option
                    v-for="option in projectOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value">
                    <span class="option-text">{{ option.label }}</span>
                  </el-option>
                </el-select>



        </el-form-item>
        <el-form-item id="btn2" label="Location" prop="project_id">
          <el-select
ref="ref2" v-model="ruleForm.project_location_id" value-key="id" placeholder="Select"
            style="width: 90%; vertical-align: middle">
            <el-option v-for="item in project_locations" :key="item.id" :label="item.settlementName" :value="item.id">
              <div style="display: flex; align-items: center;">
                <span style="flex: 1; text-align: left;">{{ item.settlementName }}</span>
                <span style=" flex: 2; color: var(--el-text-color-secondary);  font-size: 13px;  text-align: right; ">
                  {{ item.ward }}, {{ item.subcounty }}, {{ item.county }}
                </span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item id="xbtn3" label="Activity Level Indicator" prop="">
          <el-switch
            v-model="indicator_level"      
            class="custom-switch"
            @change="handleSwitchChange"
          />
        </el-form-item>

        <el-form-item v-if="indicator_level" id="btn3" label="Activity" prop="activity_id">
          <el-select
ref="ref3" filterable v-model="ruleForm.activity_id" :onChange="changeActivity"
            placeholder="Select Activity" style="width: 90%">
            <el-option
v-for="item in activityOptionsFiltered" :key="item.value" :label="item.label"
              :value="item.value" />
          </el-select>

        </el-form-item>

        <el-form-item id="btn4" label="Indicator" prop="indicator_id">
          <el-select
ref="ref4" filterable v-model="ruleForm.indicator_id" :onChange="changeIndicator"
            placeholder="Select Indicator" style="width: 70%; margin-right: 10px;">
            <el-option
v-for="item in indicatorsOptionsFiltered" :key="item.value" :label="item.label"
              :value="item.value" />

          </el-select>
          <el-button type="primary" @click="AddIndicator" :icon="Plus" plain />
        </el-form-item>


        <el-row>

          <el-form-item id="btn5" label="Baseline" prop="baseline">
            <el-input-number ref="ref5" v-model="ruleForm.baseline" />
          </el-form-item>


          <el-form-item id="btn6" label="Target" prop="target">
            <el-input-number ref="ref6" v-model="ruleForm.target" />
          </el-form-item>
        </el-row>




        <el-form-item id="btn7" label="Category" prop="category_id">
          <el-select
            v-model="ruleForm.category_id" :onChange="changeCategory" filterable placeholder="Select Category"
            style="width: 70%; margin-right: 10px;">
            <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-button type="primary" @click="AddCategory" :icon="Plus" plain />
        </el-form-item>


        <el-form-item id="btn8" label="Frequency" prop="frequency">
          <el-select
          v-model="ruleForm.frequency" placeholder="Select Frequency"
          style="width: 70%; margin-right: 10px;">
            <el-option v-for="item in frequencyOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-button type="primary" @click="AddNewFreq" :icon="Plus" plain />
        </el-form-item>



      </el-form>

    </el-col>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" plain @click="openHelp = true">Help</el-button>
        <el-button @click="handleCancelAddEdit">Cancel</el-button>
        <el-button id="btn10" v-if="showSubmitBtn" type="primary" @click="submitForm(ruleFormRef)">Submit</el-button>
        <el-button id="btn11" v-if="showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>
      </span>
    </template>

  </el-dialog>


  <el-dialog v-model="AddCategoryVisible" @close="handleCloseCategory" title="Add Category" width="30%" draggable>
    <el-form ref="categoryFormRef" :model="ruleForm" :rules="rules" label-width="120px">
      <el-form-item label="Title">
        <el-input v-model="categoryForm.category" />
      </el-form-item>

    </el-form>
    <template #footer>

      <span class="dialog-footer">
        <el-button @click="AddCategoryVisible = false">Cancel</el-button>
        <el-button type="primary" @click="submitCategoryForm(categoryFormRef)">Submit</el-button>
      </span>
    </template>
  </el-dialog>



  <el-dialog
v-model="AddNewIndicatorVisible" @close="handleCloseIndicator" title="Add Indicator" :width="dialogWidth"
    draggable>
    <el-form ref="indicatorFormRef" :model="indicatorForm" :rules="IndicatorRules" label-width="120px">

      <el-form-item label="Activity" prop="activity_id">
        <el-select filterable v-model="indicatorForm.activity_id" placeholder="Select Activity" style="width: 100%">
          <el-option v-for="item in activityOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="Title" prop="name">
        <el-input v-model="indicatorForm.name" />
      </el-form-item>
      <el-form-item label="Type" prop="type">
        <el-select v-model="indicatorForm.type" placeholder="Type">
          <el-option label="Output" value="output" />
          <el-option label="Impact" value="outcome" />
        </el-select>
      </el-form-item>
      <el-form-item label="Format" prop="format">
        <el-select v-model="indicatorForm.format" placeholder="Format">
          <el-option label="Number" value="number" />
          <el-option label="Percent" value="percent" />
        </el-select>
      </el-form-item>

      <el-form-item label="Level" prop="level">
        <el-select v-model="indicatorForm.level" placeholder="Level">
          <el-option label="Settlement" value="Settlement" />
          <el-option label="County" value="County" />
          <el-option label="National" value="National" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>

      <span class="dialog-footer">
        <el-button @click="AddNewIndicatorVisible = false">Cancel</el-button>
        <el-button type="primary" @click="submitIndicatorForm(indicatorFormRef)">Submit</el-button>
      </span>
    </template>
  </el-dialog>




  <el-dialog v-model="AddFrequencyVisible" @close="handleCloseFreq" :title="formHeader" :width="dialogWidth" draggable>
    <el-form ref="freqFormRef" :model="freqForm" :rules="freqRules">
      <el-input v-model="freqForm.frequency" :style="{ width: '100%' }" />
    </el-form>
    <template #footer>

      <span class="dialog-footer">
        <el-button @click="AddFrequencyVisible = false">Cancel</el-button>
        <el-button type="primary" @click="submitFreqForm(freqFormRef)">Save</el-button>
      </span>
    </template>
  </el-dialog>


  <el-tour v-model="openHelp" z-index="100000">
    <el-tour-step target="#btn1" title="Project" description="Select the project you want to set up" />
    <el-tour-step
target="#btn2" title="Location"
      description="Select the location where this project is implemented. Repeat this for every settlement the project is being implemented" />
    <el-tour-step
target="#btn3" title="Activity"
      description="Select the  specific activity you wish to configure monitoring for" />
    <el-tour-step
target="#btn4" title="Indicator"
      description="Select the  indicator associated with that activity. If not configured, use the + button to create a new indicator" />

    <el-tour-step
target="#btn5" title="Baseline"
      description="Specify the baseline value. This is the value at the start of the project. If nto considered put zero(0)" />
    <el-tour-step
target="#btn6" title="Target"
      description="Specify the target value. This is the desired value at the end of the project. Refer to the project results framework" />

    <el-tour-step
target="#btn7" title="Category"
      description="Specify the dimension/aspect that you want measured. e.g Male or Female, Prepared or approved. This must be done for each disaggregation.  Refer to the project results framework. If not configured, use the + button to create a new category" />

    <el-tour-step
target="#btn8" title="Frequency"
      description="How frequently will this indicator be monitored? If not configured, use the + button to create a new frequency " />


  </el-tour>

</template>

<style scoped>
.custom-switch .el-switch__label--left {
  color: gray;
  /* Gray out the inactive text */
  opacity: 0.1;
  /* Optional: Adjust the opacity */
}

.custom-switch .el-switch__label--right {
  color: inherit;
  /* Keep the active text as it is */
}





.responsive-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
  /* Space between the elements */
  margin-bottom: 10px;
  /* Space below the container */
}

.responsive-container>* {
  flex-shrink: 0;
  /* Prevents elements from shrinking below their content size */
}

.responsive-container .el-select {
  max-width: 250px;
  /* Set a maximum width for the select elements */
  flex: 1 1 auto;
  /* Allow the select elements to grow and shrink */
}

.responsive-container .el-button {
  flex-shrink: 0;
  /* Prevents buttons from shrinking */
}


@media (max-width: 768px) {
  .responsive-container {
    justify-content: space-between;
    gap: 10px;
    /* Reduce gap on smaller screens */
  }
}

@media (max-width: 480px) {
  .responsive-container {
    flex-direction: column;
    /* Stack elements on top of each other on very small screens */
    gap: 15px;
    /* Increase gap for stacked items */
  }

  .responsive-container .el-select {
    max-width: 100%;
    /* Allow select to take full width in column layout */
  }
}
</style>
