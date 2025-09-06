<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { getSettlementListByCounty, getListManyToMany, searchByKeyWord } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import DownloadCustom from '@/views/Components/DownloadCustom.vue'
import { ElButton, ElSelect, ElSelectV2, ElTour, ElTourStep, ElCard } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'

import {
  Plus,
  Edit,
  Delete,
  Download, Back,
  Filter,
  Search
} from '@element-plus/icons-vue'

import { ref, reactive, onMounted, computed, watch } from 'vue'
import {
  ElPagination, ElInputNumber, ElTable,
  ElTableColumn, ElDropdown, ElDropdownItem, ElDropdownMenu, ElSwitch,
  ElTooltip, ElOption, ElDialog, ElForm, ElRow, ElFormItem, ElInput, FormRules, ElPopconfirm
} from 'element-plus'
import type { FormInstance } from 'element-plus'


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
import TableActions from '@/views/Components/TableActions.vue';
import PermissionWrapper from '@/components/PermissionWrapper.vue';


const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)



const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)


const action_buttons = ref([])
if (showAdminButtons.value) {
  action_buttons.value = ['edit', 'delete']
} else if (showEditButtons.value) {

  action_buttons.value = ['edit']
}
else {
  action_buttons.value = []

}





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
  indicator_level:null,
  indicator_id: null,
  activity_id: null,
  indicator_name: null,
  category_id: null,
  category_title:null,
  frequency: null,
  level: null,
  code: null,
 }) 


const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
const categoryOptions = ref([])
const categories = ref([])
const filteredIndicators = ref([])
const searchLoading = ref(false)
const downloadLoading = ref(false)
const page = ref(1)
const currentPage = ref(1)
const selCounties = []
const loading = ref(true)
const total = ref(0)

// Keep page and currentPage in sync
watch(page, (newPage) => {
  currentPage.value = newPage
})

watch(currentPage, (newCurrentPage) => {
  page.value = newCurrentPage
})


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

  // clear all the filters -------
  filterValues = []
  filters = []
  value1.value = ''
  value2.value = ''
  value3.value = ''
  // Reset page size based on screen size
  updatePageSize()
  page.value = 1
  currentPage.value = 1
  tblData = []
  // Reset indicators options to show all
  indicatorsOptions.value = [...indicatorsOptionsFiltered.value]
  // Reset category options to show all
  categoryOptions.value = categories.value.map((item: any) => ({
    value: item.id,
    label: item.category
  }))
  //----run the get data--------
  getInterventionsAll()
}

// Filter indicators based on search query
const filterIndicators = async (query: string) => {
  if (!query || query.length < 3) {
    // If query is too short, show all indicators
    indicatorsOptions.value = indicatorsOptionsFiltered.value
    return
  }

  searchLoading.value = true
  
  try {
    const formData: any = {}
    formData.curUser = 1
    formData.model = 'indicator'
    formData.searchField = 'name'
    formData.searchKeyword = query
    formData.limit = 50 // Limit to 50 results for dropdown
    formData.page = 1

    const res: any = await searchByKeyWord(formData)
    
    // Update indicators options with search results
    indicatorsOptions.value = res.data.map((item: any) => ({
      value: item.id,
      label: item.name,
      activity_id: item.activity_id
    }))
  } catch (error) {
    console.error('Error searching indicators:', error)
  } finally {
    searchLoading.value = false
  }
}

// Filter categories based on search query
const filterCategories = async (query: string) => {
  if (!query || query.length < 3) {
    // If query is too short, show all categories
    categoryOptions.value = categories.value.map((item: any) => ({
      value: item.id,
      label: item.category
    }))
    return
  }

  searchLoading.value = true
  
  try {
    const formData: any = {}
    formData.curUser = 1
    formData.model = 'category'
    formData.searchField = 'category'
    formData.searchKeyword = query
    formData.limit = 50 // Limit to 50 results for dropdown
    formData.page = 1

    const res: any = await searchByKeyWord(formData)
    
    // Update category options with search results
    categoryOptions.value = res.data.map((item: any) => ({
      value: item.id,
      label: item.category
    }))
  } catch (error) {
    console.error('Error searching categories:', error)
  } finally {
    searchLoading.value = false
  }
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
      opt.label = arrayItem.name  
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
    // Initialize category options
    categoryOptions.value = ret.map((item: any) => ({
      value: item.id,
      label: item.category
    }))
  })
}

const getActivityOptions = async () => {
  const res = await getCountyListApi({
    params: {
      //   pageIndex: 1,
      //   limit: 100,
      curUser: 1, // Id for logged in user
      model: 'activity',
      searchField: 'title',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Activities response:', response)

 

    response.data.forEach((arrayItem) => { 

      let act = {}
      act.value=arrayItem.id
      act.label=arrayItem.title
      activityOptionsFiltered.value.push(act)

    })

    console.log('activityOptionsFiltered.value',activityOptionsFiltered.value)
   
   
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
    opt.label = arrayItem.title  
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
 

}



getProjectActivities()
getActivityOptions()
//getProjectOptions()

getIndicatorNames()
getCategoryOptions()
getInterventionsAll()



const editingMode = ref(false)
const editIndicator = async (data: TableSlotDefault) => {
  showSubmitBtn.value = false
  showEditSaveButton.value = true
  editingMode.value = true

  console.log(data)
  ruleForm.id = data.id
  ruleForm.indicator_name = data.indicator.indicator_name
  ruleForm.indicator_level = data.indicator_level

  

  handleSwitchChange(data.indicator_level)
  changeActivity()

  ruleForm.indicator_id = data.indicator_id
  ruleForm.category_id = data.category_id
  ruleForm.frequency = data.frequency
  ruleForm.category_title = data.category_title
  ruleForm.activity_id = data.activity_id
  ruleForm.project_id = data.project_id
  ruleForm.target = data.target
  ruleForm.baseline = data.baseline
  ruleForm.project_location_id = data.project_location_id

  formHeader.value = 'Edit Indicator Configuration'
 // changeProject(data.project_id)

  console.log(frequencyOptions.value)

  await getFrequencyOptions()
  AddDialogVisible.value = true
}


const DeleteIndicator = (data: TableSlotDefault) => {
  console.log('----->', data)
  let formData = {}
  formData.id = data.id
  formData.model = 'indicator_category'
  DeleteRecord(formData)
  console.log(tableDataList.value)

  // remove the deleted object from array list 
  let index = tableDataList.value.indexOf(data);
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
  
  indicator_level:  [{ required: true, message: 'The Indicator level is required', trigger: 'blur' }],
  category_id: [{ required: true, message: 'The Indicator category is required', trigger: 'blur' }],
  frequency: [{ required: true, message: 'The Indicator frequency is required', trigger: 'blur' }],
  activity_id: [{ required: true, message: 'The Indicator Activity is required', trigger: 'blur' }],
  project_id: [{ required: true, message: 'Project is required', trigger: 'blur' }],
  target: [{ required: true, message: 'Target is required', trigger: 'blur' }],
  baseline: [{ required: true, message: 'Baseline is required', trigger: 'blur' }],

})

const categoryRules = reactive<FormRules>({
  category: [
    { required: true, message: 'Please enter category title', trigger: 'blur' }
  ]
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

    //await updateOneRecord(ruleForm);

    await updateOneRecord(ruleForm)
        .then((updatedRecord) => {
          // Assuming you get the updated record back from the API
          if (updatedRecord) {
            getFilteredData(filters, filterValues)
          AddDialogVisible.value=false
            handleClose()
          }
         
        })
        .catch((error) => {
          console.error('Error updating record:', error);
        });



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

  frequency: [
    { required: true, message: 'Please provide frequency', trigger: 'blur' },
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
const openIndicatorHelp = ref()

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

 



const handleSwitchChange = async (value) => {
  indicatorsOptionsFiltered.value=[]

  console.log(value)

  if (value=='project') {
         console.log('Switch is inactive'); 
        const sel_indicators = await getProjectActivityIndicators(undefined)
          const transformedArray = sel_indicators.map(item => {
          return {
            label: item.name,
            value: item.id
          };
          });
          indicatorsOptionsFiltered.value =transformedArray 
          ruleForm.activity_id=null
        // Add your custom logic here
      } else {
        // The switch is active (set to 'Activity Level Indicator')
        console.log('Switch is active');

        
      }


}




const indicatorLevels = [
        { value: 'project', label: 'Project' },
        { value: 'activity', label: 'Activity' },
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

      <!-- Indicator Search -->
      <el-select
        v-model="value2" 
        :onChange="handleSelectIndicator" 
        :onClear="handleClear" 
        multiple 
        clearable 
        filterable
        collapse-tags 
        placeholder="Filter by Indicator" 
        style="margin-right: 10px;"
        :filter-method="filterIndicators"
        :loading="searchLoading">
        <el-option v-for="item in indicatorsOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      
      <el-select
        v-model="value3" 
        :onChange="handleSelectCategory" 
        :onClear="handleClear" 
        multiple 
        clearable 
        filterable
        collapse-tags 
        placeholder="Filter by Category"
        :filter-method="filterCategories"
        :loading="searchLoading">
        <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>

      <!-- Action Buttons -->
      <div style="display: flex; align-items: center; gap: 10px; margin-left: 10px;">
        <PermissionWrapper :permissions="['indicator:create']">
          <el-tooltip content="Add Indicator Configuration" placement="top">
            <el-button v-if="showAdminButtons" :onClick="AddIndicatorConfig" type="primary" :icon="Plus" />
          </el-tooltip>
          <el-tooltip content="Clear" placement="top">
            <el-button @click="handleClear" type="primary">
              <Icon icon="mdi:filter-remove" />
            </el-button>
          </el-tooltip>
          <DownloadCustom
            :data="tableDataList"
            :model="model"
            :associated_models="associated_multiple_models"
            :loading="downloadLoading"
            @download-start="downloadLoading = true"
            @download-end="downloadLoading = false"
          />
        </PermissionWrapper>
         
      </div>

    </el-row>



    <el-table :data="tableDataList" :loading="loading" border style="width: 100%; margin-top: 10px;">
      <el-table-column label="Id" prop="id" width="50px" sortable />
      <!-- <el-table-column label="Activity" prop="activity.title" sortable /> -->
      <!-- <el-table-column label="Settlement" prop="project_location.location_name" sortable /> -->
      <!-- <el-table-column label="Project" prop="project.title" sortable /> -->
      <!-- <el-table-column
      property="project.title"
      label="Project"
      show-overflow-tooltip
    /> -->
    <el-table-column label="Indicator" prop="indicator.name" sortable />
    <el-table-column label="Dimension" prop="category_title" sortable />
      <!-- <el-table-column label="Target" prop="target" sortable /> -->
      <!-- <el-table-column label="Baseline" prop="baseline" sortable /> -->


<!-- 
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

      </el-table-column> -->


      <el-table-column label="Actions" width="250">
        <template #default="{ row }">
          <PermissionWrapper :permissions="['indicator:update', 'indicator:delete']">
            <TableActions :item="row" :buttons="action_buttons" @edit="editIndicator" @delete="DeleteIndicator" />
          </PermissionWrapper>
        </template>
      </el-table-column>

    </el-table>

    <ElPagination
layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
      v-model:page-size="pageSize" :page-sizes="[5, 10, 15, 20, 50, 100]" :total="total" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
  </el-card>

  <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formHeader" draggable width="30%"> 
    <el-row>
      <el-col :xl="24" :lg="24" :md="24" :sm="24" :xs="24">

        <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="180px" label-position="left">

 
   
        <el-form-item id="btn1" label="Indicator level" prop="indicator_level" >
          <el-select
ref="ref1" filterable v-model="ruleForm.indicator_level" :onChange="handleSwitchChange"
            placeholder="Select Level" style="width: 100%;">
            <el-option
v-for="item in indicatorLevels" :key="item.value" :label="item.label"
              :value="item.value" />

          </el-select>
         </el-form-item>

 

        <el-form-item v-if="ruleForm.indicator_level =='activity'" id="btn2" label="Activity" prop="activity_id">
          <el-select
ref="ref3" filterable v-model="ruleForm.activity_id"   :onChange="changeActivity"
            placeholder="Select Activity" style="width: 100%;">
            <el-option
v-for="item in activityOptionsFiltered" :key="item.value" :label="item.label"
              :value="item.value" />
          </el-select> 

        </el-form-item>

        <el-form-item id="btn3" label="Indicator" prop="indicator_id">
          <el-select
ref="ref4" filterable v-model="ruleForm.indicator_id" :onChange="changeIndicator"
            placeholder="Select Indicator" style="width: 70%; margin-right: 10px;">
            <el-option
v-for="item in indicatorsOptions" :key="item.value" :label="item.label"
              :value="item.value" />
          </el-select>
          <el-button type="primary" @click="AddIndicator" :icon="Plus" plain />
        </el-form-item>

 




        <el-form-item id="btn4" label="Category" prop="category_id">
          <el-select
            v-model="ruleForm.category_id" :onChange="changeCategory" filterable placeholder="Select Category"
            style="width: 70%; margin-right: 10px;">
            <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-button type="primary" @click="AddCategory" :icon="Plus" plain />
        </el-form-item>


        <el-form-item id="btn5" label="Frequency" prop="frequency">
          <el-select
          v-model="ruleForm.frequency" placeholder="Select Frequency"
          style="width: 70%; margin-right: 10px;">
            <el-option v-for="item in frequencyOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-button type="primary" @click="AddNewFreq" :icon="Plus" plain />
        </el-form-item>



        </el-form>

      </el-col>
    </el-row>
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
    <el-form ref="categoryFormRef" :model="categoryForm" :rules="categoryRules" label-width="120px">
      <el-form-item label="Title" prop="category">
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

      <el-form-item id="indicator-btn1" label="Activity" prop="activity_id">
        <el-select filterable v-model="indicatorForm.activity_id" placeholder="Select Activity" style="width: 100%">
          <el-option v-for="item in activityOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <el-form-item id="indicator-btn2" label="Title" prop="name">
        <el-input v-model="indicatorForm.name" placeholder="Enter indicator title" />
      </el-form-item>
      <el-form-item id="indicator-btn3" label="Type" prop="type">
        <el-select v-model="indicatorForm.type" placeholder="Type" style="width: 100%">
          <el-option label="Output" value="output" />
          <el-option label="Impact" value="outcome" />
        </el-select>
      </el-form-item>
      <el-form-item id="indicator-btn4" label="Format" prop="format">
        <el-select v-model="indicatorForm.format" placeholder="Format" style="width: 100%">
          <el-option label="Number" value="number" />
          <el-option label="Percent" value="percent" />
        </el-select>
      </el-form-item>

      <el-form-item id="indicator-btn5" label="Level" prop="level">
        <el-select v-model="indicatorForm.level" placeholder="Level" style="width: 100%">
          <el-option label="Settlement" value="Settlement" />
          <el-option label="County" value="County" />
          <el-option label="National" value="National" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>

      <span class="dialog-footer">
        <el-button type="primary" plain @click="openIndicatorHelp = true">Help</el-button>
        <el-button @click="AddNewIndicatorVisible = false">Cancel</el-button>
        <el-button type="primary" @click="submitIndicatorForm(indicatorFormRef)">Submit</el-button>
      </span>
    </template>
  </el-dialog>




  <el-dialog v-model="AddFrequencyVisible" @close="handleCloseFreq" :title="formHeader" :width="dialogWidth" draggable>
    <el-form ref="freqFormRef" :model="freqForm" :rules="freqRules">
      <el-form-item prop="frequency">
        <el-input v-model="freqForm.frequency" :style="{ width: '100%' }" placeholder="Enter frequency" />
      </el-form-item>
    </el-form>
    <template #footer>

      <span class="dialog-footer">
        <el-button @click="AddFrequencyVisible = false">Cancel</el-button>
        <el-button type="primary" @click="submitFreqForm(freqFormRef)">Save</el-button>
      </span>
    </template>
  </el-dialog>


  <el-tour v-model="openHelp" z-index="100000">
    <el-tour-step target="#btn1" title="Indicator Level" description="Select the level at which this indicator will be measured - either at Project level or Activity level" />
    
    <el-tour-step
target="#btn2" title="Activity"
      description="Select the specific activity you wish to configure monitoring for. This field only appears when 'Activity' level is selected" />
      
    <el-tour-step
target="#btn3" title="Indicator"
      description="Select the indicator associated with the activity. If not configured, use the + button to create a new indicator" />

    <el-tour-step
target="#btn4" title="Category"
      description="Specify the dimension/aspect that you want measured (e.g., Male/Female, Prepared/Approved). If not configured, use the + button to create a new category" />

    <el-tour-step
target="#btn5" title="Frequency"
      description="How frequently will this indicator be monitored? If not configured, use the + button to create a new frequency" />

  </el-tour>

  <el-tour v-model="openIndicatorHelp" z-index="100000">
    <el-tour-step target="#indicator-btn1" title="Activity" description="Select the activity this indicator will be associated with" />
    
    <el-tour-step target="#indicator-btn2" title="Title" description="Enter a descriptive title for the indicator (e.g., 'Number of beneficiaries reached')" />
    
    <el-tour-step target="#indicator-btn3" title="Type" description="Select whether this is an Output indicator (immediate results) or Impact indicator (long-term outcomes)" />
    
    <el-tour-step target="#indicator-btn4" title="Format" description="Choose how the indicator will be measured - as a Number or Percentage" />
    
    <el-tour-step target="#indicator-btn5" title="Level" description="Select the geographic level for this indicator - Settlement, County, or National" />

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
