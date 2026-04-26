<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { getSettlementListByCounty, uploadFilesBatch } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { ElButton, ElMessageBox, ElSelect, ElSelectV2, ElStep, ElSteps, FormInstance, ElCard, ElTour, ElTourStep, ElText,ElSwitch } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Plus,
  Edit,
  Delete, CircleCloseFilled,
  UploadFilled,
  Position, Back,
  InfoFilled,
  Filter,
  Download,
  Files,
  View
} from '@element-plus/icons-vue'

import { ref, reactive, onMounted, computed } from 'vue'
import {
  ElPagination, ElInputNumber, ElTable,
  ElTableColumn, ElDropdown, ElDropdownItem, ElDropdownMenu,
  ElDatePicker, ElTooltip, ElOption, ElDialog, ElForm, ElFormItem, ElUpload, ElInput, FormRules, ElPopconfirm, ElCol, ElRow, ElDescriptions, ElDescriptionsItem
} from 'element-plus'

import { useRouter } from 'vue-router'
import { useCache } from '@/hooks/web/useCache'
import { userHasPrivilegedNationalLocation } from '@/utils/roleScope'
import { CreateRecord, DeleteRecord, updateOneRecord, deleteDocument, searchByKeyWord } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import type { UploadProps, UploadUserFile } from 'element-plus'
import readXlsxFile from 'read-excel-file'
import xlsx from "json-as-xlsx"
import { getModelSpecs } from '@/api/fields'
import { BatchImportUpsert } from '@/api/settlements'
import { UserType } from '@/api/register/types'
import { Icon } from '@iconify/vue';
import { getOneGeo } from '@/api/settlements'


import UploadComponent from '@/views/Components/UploadComponent.vue';
import { defineAsyncComponent } from 'vue';
import ListDocuments from '@/views/Components/ListDocuments.vue';
import DocumentDrawer from '@/views/Components/DocumentDrawer.vue';

import DownloadCustom from '@/views/Components/DownloadCustom.vue';
import TableActions from '@/views/Components/TableActions.vue';
import DownloadAll from '@/views/Components/DownloadAll.vue';


//import downloadForOfflineRounded from '@iconify-icons/material-symbols/download-for-offline-rounded';

import { MapboxLayerSwitcherControl } from "mapbox-layer-switcher";
import "mapbox-layer-switcher/styles.css";
import * as turf from '@turf/turf'
import { useAppStore } from '@/store/modules/app'
import PermissionWrapper from '@/components/PermissionWrapper.vue';


const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = MapBoxToken;




const { wsCache } = useCache()
const appStore = useAppStore()
const userInfo = wsCache.get(appStore.getUserInfo)

// User location-based filtering
const isSuperAdmin = computed(() => {
  return userInfo?.roles?.some((role: any) => 
    role.name === 'super_admin' || role.name === 'root_admin'
  ) || false
})

const hasNationalAccess = computed(() => userHasPrivilegedNationalLocation(userInfo?.roles))

const userCountyRole = computed(() => {
  return userInfo?.roles?.find((role: any) => 
    role.user_roles?.location_level === 'county'
  )
})

const userCountyId = computed(() => {
  return userCountyRole.value?.user_roles?.county_id || null
})

// Check if user should be restricted to their county
const isCountyRestricted = computed(() => {
  return !isSuperAdmin.value && !hasNationalAccess.value && !!userCountyId.value
})

console.log('indicator_category_report.vue - User location info:', {
  isSuperAdmin: isSuperAdmin.value,
  hasNationalAccess: hasNationalAccess.value,
  userCountyId: userCountyId.value,
  isCountyRestricted: isCountyRestricted.value
})

const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)
const downloadLoading = ref(false)

 
console.log("userInfo--->", userInfo)

console.log("showAdminButtons--->", showAdminButtons.value)


const action_buttons = ref([])
if (showAdminButtons.value) {
  action_buttons.value = ['edit', 'delete', 'viewOnMap', 'preview']
} else if (showEditButtons.value) {

  action_buttons.value = ['edit', 'viewOnMap', 'preview']
}
else {
  action_buttons.value = ['viewOnMap', 'preview']

}






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
  indicator_category_id: [],
  indicators: [],
  baseline: 0,
  target: 0,
  project_id: null,
  project_location_id: null,
  activity_id: null,
  programme_implementation_id: null,
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
  qualitative:'',
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


  // comments: [
  //   { required: true, message: 'Required', trigger: 'blur' },
  // ],



})




const AddDialogVisible = ref(false)
const ImportDialogVisible = ref(false)
const PreviewDialog = ref(false)
const formHeader = ref('Add M&E Report')
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
const associated_Model = ''
const model = 'indicator_category_report'
const associated_multiple_models = ['document', 'settlement', 'county', 'users', 'indicator_category']
//const nested_models = ['indicator_category', 'indicator', 'category']  // The mother, then followed by the child
const nested_models = ['activity', 'project']  // The mother, then followed by the child

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
  selectedSettlements.value = []
  selectedIndicators.value = []
  pageSize.value = 5
  currentPage.value = 1
  tblData = []
  //----run the get data--------
  getInterventionsAll()
}

const DownloadXlsx = async () => {
  console.log(tableDataList.value)

  // Define the fields for the Excel export
  let fields = [
    { label: "S/No", value: "index" },
    { label: "Indicator", value: "indicator_name" },
    { label: "Category", value: "category_title" },
    { label: "Quantity", value: "quantity" },
    { label: "Cumulative", value: "cumulative" },
    { label: "Baseline", value: "baseline" },
    { label: "Target", value: "target" },
    { label: "Progress", value: "progress" },
    { label: "Date", value: "date" },
    { label: "Comments", value: "comments" },
    { label: "Status", value: "status" }
  ]

  // Prepare the data object 
  var dataObj = {}
  dataObj.sheet = 'Indicator Category Reports'
  dataObj.columns = fields

  let dataHolder = []
  tableDataList.value.forEach((item, index) => {
    let row = {
      index: index + 1,
      indicator_name: item.indicator_category?.indicator_name || 'N/A',
      category_title: item.indicator_category?.category_title || 'N/A',
      quantity: item.quantity || 0,
      cumulative: item.cumulative || 0,
      baseline: item.baseline || 0,
      target: item.target || 0,
      progress: item.progress || 0,
      date: item.date || 'N/A',
      comments: item.comments || '',
      status: item.status || 'New'
    }
    dataHolder.push(row)
  })

  dataObj.content = dataHolder

  // Download the file
  xlsx([dataObj], { fileName: "Indicator_Category_Reports.xlsx" })
}

const handleSettlementFilter = async (settlements: any) => {
  var selectOption = 'settlement_id'
  var index = filters.indexOf(selectOption)
  
  // Remove existing filter if present
  if (index !== -1) {
    filters.splice(index, 1)
    filterValues.splice(index, 1)
  }
  
  // Add new filter if settlements selected
  if (settlements && settlements.length > 0) {
    filters.push(selectOption)
    filterValues.push(settlements)
  }
  
  console.log('Settlement Filter:', settlements)
  getFilteredData(filters, filterValues)
}

const handleIndicatorFilter = async (indicators: any) => {
  var selectOption = 'indicator_category_id'
  var index = filters.indexOf(selectOption)
  
  // Remove existing filter if present
  if (index !== -1) {
    filters.splice(index, 1)
    filterValues.splice(index, 1)
  }
  
  // Add new filter if indicators selected
  if (indicators && indicators.length > 0) {
    filters.push(selectOption)
    filterValues.push(indicators)
  }
  
  console.log('Indicator Filter:', indicators)
  getFilteredData(filters, filterValues)
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

const loading = ref(false)
const getFilteredData = async (selFilters, selfilterValues) => {

  loading.value = true
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
  
  // Apply county restriction if user is county-restricted (unless super admin or national admin)
  if (isCountyRestricted.value && userCountyId.value) {
    const countyIndex = formData.filters.indexOf('county_id')
    if (countyIndex !== -1) {
      // Update existing county_id filter
      formData.filterValues[countyIndex] = [userCountyId.value]
    } else {
      // Add new county_id filter
      formData.filters.push('county_id')
      formData.filterValues.push([userCountyId.value])
    }
    console.log('Applying county restriction filter for indicator reports, county_id:', userCountyId.value)
  }
  
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = nested_models

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('Reports collected........', res)
  console.log('First report item structure:', res.data?.[0])

  // tableDataList.value = res.data.filter(item => item.indicator_category.indicator_level === 'activity');

  tableDataList.value = res.data
  loading.value = false

  //tableDataList.value = res.data
  total.value = res.total


}

const projectOptions = ref([])
const projectOptionsAll = ref([])
const indicatorsOptions = ref([])
const indicatorsOptionsFiltered = ref([])

// Filter options and selections
const allProjectLocations = ref([])
const settlementFilterOptions = ref([])
const indicatorFilterOptions = ref([])
const selectedSettlements = ref([])
const selectedIndicators = ref([])


// Borrowed word for word from ProjectDetails.vue
const firstLoad = ref(true)

const remoteMethodSettlement = async (keyword) => {
  loading.value = true
  let model = 'settlement' // Always search settlements for this filter

  // Dynamically assign associated models
  const associatedModels = ['county', 'subcounty', 'ward']

  const formData = {
    model: model,
    searchField: 'name',
    searchKeyword: firstLoad.value ? '' : keyword, // only empty search on first load
    excludeGeom: false,
    excludeGeomAssoc: true,
    associated_multiple_models: associatedModels,
    filters: [],
    filterValues: [],
    limit: 50, // Limit to first 50 records
    offset: 0
  }

  try {
    const res = await searchByKeyWord(formData)

    if (res.data && res.data.length > 0) {
      settlementFilterOptions.value = res.data.map(item => {
        const base = {
          value: item.id,
          label: item.name,
          name: item.name,
          geom: item.geom,
        }

        return {
          ...base,
          settlement_id: item.id,
          county: item.county?.name,
          subcounty: item.subcounty?.name,
          ward: item.ward?.name,
          county_id: item.county?.id,
          subcounty_id: item.subcounty?.id,
          ward_id: item.ward?.id
        }
      })
    }

    firstLoad.value = false // Disable first load flag after first run
    
  } catch (error) {
    console.error("Settlement search error:", error)
  }

  loading.value = false
}


const getIndicatorFilterOptions = async () => {
  const formData = {
    curUser: 1,
    model: 'indicator_category',
    searchField: 'indicator_name',
    searchKeyword: '',
    assocModel: '',
    filters: [],
    filterValues: [],
    associated_multiple_models: [],
    nested_models: [],
  };

  const res = await getSettlementListByCounty(formData);
  console.log('Indicator Filter Options Response:', res);

  indicatorFilterOptions.value = res.data.map((item) => ({
    value: item.id,
    label: `${item.indicator_name} | ${item.category_title}`,
  }));
};

const getIndicatorNames = async () => {
  console.log('getIndicatorNames >>>>>>>>>>>>>>>>>>>>>>>>>>>>');

  const formData = {
    curUser: 1,
    model: 'indicator_category',
    searchField: 'name',
    searchKeyword: '',
    assocModel: '',
    filters: [],
    filterValues: [],
    associated_multiple_models: ['project', 'category', 'activity', 'indicator'],
    nested_models: ['activity', 'project'],
  };

  const res = await getSettlementListByCounty(formData);
  console.log('indicator_category Response:', res);

  res.data.forEach((arrayItem) => {
    //console.log('=====>', arrayItem);

    const opt = {
      value: arrayItem.id,
      label: `${arrayItem.indicator_name} | ${arrayItem.category.category}`,
      title: arrayItem.category.title,
      activity_id: arrayItem.activity ? arrayItem.activity.id : null,
      unit: arrayItem.indicator.unit,
    };

    // Collect only output indicators
    ///if (arrayItem.indicator_level === 'activity') {
    indicatorsOptions.value.push(opt);
    indicatorsOptionsFiltered.value.push(opt);
    //  }

    // Check if `activity` exists and has `projects`
    if (arrayItem.activity && Array.isArray(arrayItem.activity.projects)) {
      arrayItem.activity.projects.forEach((project) => {
        const prj = {
          value: project.id,
          label: project.title,
          implementation_scope: project.implementation_scope,
          programme_implementation_id: project.implementation_id,
        };
        projectOptions.value.push(prj);
        projectOptionsAll.value.push(prj);

      });
    } else {
      console.log('No projects found for this activity');

    }
  });

 

};






const editReport = async (data: TableSlotDefault) => {
  showSubmitBtn.value = false;
  await getProjectLocations(data.project_id); // Ensure you have project locations if needed

  showEditSaveButton.value = true;
  console.log('editReport', data);

  // Pre-populate form fields except for indicators
  ruleForm.id = data.id;
  ruleForm.county_id = data.county_id;
  ruleForm.subcounty_id = data.subcounty_id;
  ruleForm.settlement_id = data.settlement_id;
   ruleForm.activity_id = data.activity_id;
  ruleForm.date = data.date;
  ruleForm.amount = data.amount;
  ruleForm.indicator_category_id = [data.indicator_category_id];
  ruleForm.programme_implementation_id = data.programme_implementation_id;
  ruleForm.project_location_id = data.project_location_id;
  ruleForm.ward_id = data.ward_id;
  ruleForm.code = data.code;
  ruleForm.progress = data.progress;
  ruleForm.project_status = data.project_status;
  ruleForm.disbursement = data.disbursement;
  ruleForm.comments = data.comments;
  ruleForm.project_id = data.project_id;
  ruleForm.qualitative= data.qualitative;

 // handleIndicatorsChange([data.indicator_category_id])


   // Get the project object from projectOptions that matches the project_id
   const selectedProject = projectOptionsAll.value.find(project => project.value === data.project_id);
  if (selectedProject) {
    prj_obj.value = selectedProject;  // Assign the full project object, not just the ID
  }



  // Files/Documents linked to this report
  fileUploadList.value = data.documents;

  // Now handle the indicators separately, populating dynamic data
     handleIndicatorsChange([data.indicator_category_id]) // If indicators data is passed, map it. If not, leave it empty.

     changeIndicator(data.indicator_category_id)

     // Ensure indicators have default values if necessary
      ruleForm.indicators = ruleForm.indicators.map((indicator: any) => ({
        ...indicator,
        cumAmount: ruleForm.cumAmount || 0,
        amount: ruleForm.amount || 0,
        progress: ruleForm.progress || '0.00',
        cumProgress: ruleForm.cumProgress || '0.00',
        date: ruleForm.date || new Date(),
        target: ruleForm.target || 0,
        baseline: ruleForm.baseline || 0,
       qualitative: ruleForm.qualitative || 'No',
        activity_id: ruleForm.activity_id || ruleForm.activity_id, // If needed
      }));

      console.log('ruleForm.indicators', ruleForm.indicators);



  console.log('ruleForm.indicatorsEditing', ruleForm.indicator_category_id);

   

  // Header for the dialog when editing
  formHeader.value = 'Edit Report';

  // Fetch cumulative progress for editing indicators
  getCumulativeProgressEditPhase(data.indicator_category_id);
  changeIndicator(data.indicator_category_id); // This might depend on the `indicator_category_id`

  // Check if project scope is National (optional for the form)
  const thisProject = projectOptionsAll.value.filter(prj => prj.value == data.project_id);
  console.log('Edit thisProject', thisProject);
  isNationalProject.value = thisProject && thisProject[0].implementation_scope === 'National';

  // Open the dialog for editing
  AddDialogVisible.value = true;
};





 


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
  ruleForm.indicators = []

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



const getProjectActivityIndicators = async (activity_ids) => {
  const formData = {}

  formData.model = 'indicator_category'
  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------


  // - multiple filters -------------------------------------


  formData.filters = ['activity_id']
  formData.filterValues = [activity_ids]


  formData.associated_multiple_models = ['indicator']

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('This Project  Idnicator configs', res.data)
  return res.data
}

const getProjectProjectOutcomeIndicators = async () => {
  const formData = {}

  formData.model = 'indicator_category'
  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------


  // - multiple filters -------------------------------------


  formData.filters = ['indicator_level']
  formData.filterValues = ['project']


  formData.associated_multiple_models = ['indicator']

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('This Project  level  indicaors', res.data)
  return res.data
}

const getProjectActivities = async (project_id) => {
  const formData = {
    model: 'project_activity',
    searchField: 'title',
    searchKeyword: '',
    filters: ['project_id'],
    filterValues: [[project_id]],
    associated_multiple_models: [],
  };

  const res = await getSettlementListByCounty(formData);

  console.log('This Project Activiies...:', res.data);

  // Return an array of ids
  const activityIds = res.data.map(activity => activity.activity_id);

  return activityIds;
};



const disableIndicator = ref(false)
const isNationalProject = ref(false)
const prj_obj=ref()

const changeProject = async (project: any) => {

  ruleForm.project_location_id = null
  ruleForm.project_id = project.value

  let project_activities = []
  let sel_indicators = []
  let outcome_indicators = []

  console.log('changeProject', project)
  console.log('projectOptionsAll', projectOptionsAll)



  const thisProject = projectOptionsAll.value.filter(prj =>
    prj.value == project.value
  );
  console.log('thisProject', thisProject)
  if (thisProject && thisProject[0].implementation_scope == 'National') {
    isNationalProject.value = true
    console.log('isNationalProject', isNationalProject.value)


  } else {
    isNationalProject.value = false
    project_activities = await getProjectActivities(project.value)
    sel_indicators = await getProjectActivityIndicators(project_activities)

    console.log('project_activities', project_activities)

  }


  outcome_indicators = await getProjectProjectOutcomeIndicators()

  console.log('outcome_indicators', outcome_indicators)


  console.log('sel_indicators', sel_indicators)


  console.log('outcome_indicators', outcome_indicators)


  // Merging the two arrays
  const merged_indicators = [...sel_indicators, ...outcome_indicators];

  console.log('merged_indicators', merged_indicators)

  const transformedArray = merged_indicators.map(item => {
    console.log(item)
    return {
      label: item.indicator.name + ' ' + item.category_title,
      value: item.id,
      project_id: item.project_id,
      unit: item.indicator.unit,
      activity_id: item.activity_id
    };
  });

  indicatorsOptionsFiltered.value = transformedArray

  console.log('transformedArray', transformedArray)


  const filteredOpts = projectOptionsAll.value.filter(item => item.value == project.value);

  console.log('filteredOpts', filteredOpts[0].programme_implementation_id)

  ruleForm.programme_implementation_id = filteredOpts[0].programme_implementation_id

  console.log(ruleForm)



  ruleForm.indicator_category_id = []
  ruleForm.activity_id = null



  getProjectLocations(project.value)



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
  ruleForm.geom = selected_location.geom
  //ruleForm.project_location_id = location.id


  console.log('changeLocationruleForm', ruleForm)

}



const changeIndicator = async (indicator_category_id: any) => {
  //ruleForm.indicator_category_id = indicator_category_id

  console.log('Filtre indicatorsOptionsFiltered', indicatorsOptionsFiltered)

  var filtredOptions = indicatorsOptionsFiltered.value.filter(function (el) {
    return el.value == indicator_category_id
  });


 
  ruleForm.activity_id = filtredOptions[0].activity_id



  console.log("Filtered Indicators", filtredOptions[0])
  ruleForm.units = "Quantity(" + filtredOptions[0].unit + ")"
  ruleForm.cumUnits = "Cumulative(" + filtredOptions[0].unit + ")"

  ruleForm.baseline = filtredOptions[0].baseline
  //ruleForm.target = filtredOptions[0].target

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
  if (!formEl) return;

  await formEl.validate(async (valid, fields) => {
    if (!valid) {
      console.log('Form validation failed:', fields);
      return;
    }

    const submittedReportIds = [];

    for (const indicator of ruleForm.indicators) {
      // Calculate new cumulative amount
      const updatedCumAmount = (indicator.cumAmount || 0) + (indicator.amount || 0);

      // Calculate progress = 100 * (cumAmount / target)
      const progress = isFinite(updatedCumAmount / (indicator.target || 1))
        ? ((updatedCumAmount / indicator.target) * 100).toFixed(2)
        : '0.00';

      const reportPayload = {
        model: 'indicator_category_report',
        period: getQuarter(),
        code: uuid.v4(),
        userId: userInfo.id,
        project_id: prj_obj.value.value,
        project_location_id: ruleForm.project_location_id,
        indicator_category_id: indicator.value,
        amount: indicator.amount || 0,
        baseline: indicator.baseline || 0,
        target: indicator.target || 0,
        date: indicator.date || new Date(),
        cumAmount: updatedCumAmount,
        cumProgress: progress,
        progress:progress,
        comments: ruleForm.comments,
        programme_implementation_id: ruleForm.programme_implementation_id,
        settlement_id: ruleForm.settlement_id,
        county_id: ruleForm.county_id,
        subcounty_id: ruleForm.subcounty_id,
        ward_id: ruleForm.ward_id,
        activity_id: indicator.activity_id,
        qualitative: indicator.qualitative,

        geom: ruleForm.geom,

 
      };

 

      // Submit individual indicator report
      const report = await CreateRecord(reportPayload);
      console.log(`Report created for indicator ${indicator.label}: ID ${report.data.id}`);

      submittedReportIds.push(report.data.id);
    }

    // Upload files for each created report
    if (submittedReportIds.length && fileUploadList.value.length) {
      for (const reportId of submittedReportIds) {
        const formData = new FormData();

        fileUploadList.value.forEach((file) => {
          formData.append('files', file.raw);
          formData.append('format', file.name.split('.').pop());
          formData.append('field_id', 'report_id');
          formData.append('category', 56);
          formData.append('report_id', parseInt(reportId));
          formData.append('size', (file.raw.size / 1024 / 1024).toFixed(2));
          formData.append('createdBy', userInfo.id);
          formData.append('protected', false);
        });

        formData.append('code', uuid.v4());

        const uploaded = await uploadFilesBatch(formData);
        console.log(`Files uploaded for report ID ${reportId}:`, uploaded.data);
      }
    }

    emptyRuleForm();
    AddDialogVisible.value = false;
    handleClose();
  });
};


 
const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;

  await formEl.validate(async (valid, fields) => {
    if (!valid) {
      console.log('Form validation failed:', fields);
      return;
    }

    const updatedReportIds = [];

    console.log('ruleForm.indicators',ruleForm.indicators)

    for (const indicator of ruleForm.indicators) {
      // Calculate new cumulative amount
      const updatedCumAmount = (indicator.cumAmount || 0) + (indicator.amount || 0);

      // Calculate progress = 100 * (cumAmount / target)
      const progress = isFinite(updatedCumAmount / (indicator.target || 1))
        ? ((updatedCumAmount / indicator.target) * 100).toFixed(2)
        : '0.00';

      console.log(ruleForm.qualitative,ruleForm.qualitative,)
      const reportPayload = {
        model: 'indicator_category_report',
        id: ruleForm.id, // Use existing report ID to update
        period: getQuarter(),
        code: uuid.v4(),
        userId: userInfo.id,
        project_id: prj_obj.value.value,
        project_location_id: ruleForm.project_location_id,
        indicator_category_id: indicator.id,
        amount: indicator.amount || 0,
        baseline: indicator.baseline || 0,
        target: indicator.target || 0,
        date: indicator.date || new Date(),
        cumAmount: updatedCumAmount,
        cumProgress: progress,
        progress: progress,
        comments: ruleForm.comments,
        programme_implementation_id: ruleForm.programme_implementation_id,
        settlement_id: ruleForm.settlement_id,
        county_id: ruleForm.county_id,
        subcounty_id: ruleForm.subcounty_id,
        ward_id: ruleForm.ward_id,
        activity_id: ruleForm.activity_id,
        qualitative: indicator.qualitative,

      };

      // Update individual indicator report
      const updatedReport = await updateOneRecord(reportPayload);  // Assuming `UpdateRecord` is the function to update the report
      console.log(`Report updated for indicator ${indicator.label}: ID ${updatedReport.data.id}`);

      updatedReportIds.push(updatedReport.data.id);
    }

    // Upload files for each updated report
    if (updatedReportIds.length && fileUploadList.value.length) {
      for (const reportId of updatedReportIds) {
        const formData = new FormData();

        fileUploadList.value.forEach((file) => {
          formData.append('files', file.raw);
          formData.append('format', file.name.split('.').pop());
          formData.append('field_id', 'report_id');
          formData.append('category', 56);
          formData.append('report_id', parseInt(reportId));
          formData.append('size', (file.raw.size / 1024 / 1024).toFixed(2));
          formData.append('createdBy', userInfo.id);
          formData.append('protected', false);
        });

        formData.append('code', uuid.v4());

        const uploaded = await uploadFilesBatch(formData);
        console.log(`Files uploaded for report ID ${reportId}:`, uploaded.data);
      }
    }

    // Reset the form
    emptyRuleForm();
    AddDialogVisible.value = false;
    handleClose();
  });
};


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



const firstReport = ref(true)

const getCumulativeProgress = async () => {

  var filters = ['userId', 'indicator_category_id', 'county_id', 'subcounty_id', 'ward_id', 'project_id', 'programme_implementation_id',
  ]

  var filterValues = [[userInfo.id], [ruleForm.indicator_category_id], [ruleForm.county_id], [ruleForm.subcounty_id], [ruleForm.ward_id],
  [ruleForm.project_id], [ruleForm.programme_implementation_id]]  // remember to change here!

  console.log(ruleForm.value)

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
  if (res.data.length == 0) {
    firstReport.value = true
  } else {
    firstReport.value = false
  }

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

  ruleForm.target = parseInt(objectWithLatestDate.target)

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

// Load filter options - initialize settlement search
remoteMethodSettlement('').then(() => {
  console.log('Settlement filter options loaded successfully')
}).catch(err => {
  console.error('Failed to load settlement filter options:', err)
})
getIndicatorFilterOptions()

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
const previewWindowWidth = ref('40%')

if (isMobile.value) {
  dialogWidth.value = "90%"
  actionColumnWidth.value = "75px"
  previewWindowWidth.value = "100%"
} else {
  dialogWidth.value = "45%"
  actionColumnWidth.value = "160px"
  previewWindowWidth.value = "40%"
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
  console.log('toggleComponent called with:', row)
  componentProps.value.data = row
  dynamicComponent.value = null; // Unload the component
  addMoreDocuments.value = true; // Set any additional props
  console.log('addMoreDocuments set to:', addMoreDocuments.value)

  setTimeout(() => {
    console.log('Loading ChildComponent...')
    dynamicComponent.value = ChildComponent; // Load the component
    console.log('dynamicComponent set to:', dynamicComponent.value)
  }, 100); // 0.1 seconds
}


function disabledFutureDates(date) {
  const today = new Date();
  return date.getTime() > today.getTime(); // Disable dates after today
}

const report = ref({})

const preview = (data: TableSlotDefault) => {
  console.log('Previewing report:', data)
  
  // Populate report data for the preview dialog
  report.value = {
    project: data.project?.title || 'N/A',
    location: data.settlement?.name || 'N/A',
    indicator: data.indicator_category?.indicator_name || 'N/A',
    category: data.indicator_category?.category_title || 'N/A',
    amount: data.amount || 0,
    progress: data.progress || 0,
    date: formatDate(data.date),
    user: data.user?.name || 'N/A',
    phone: data.user?.phone || 'N/A',
    comments: data.comments || 'N/A',
    documents: data.documents || []
  }
  
  // Open the preview dialog
  PreviewDialog.value = true
}



// Document drawer state
const documentDrawerVisible = ref(false)
const selectedRowData = ref(null)

// Open document drawer
const openDocumentDrawer = (row) => {
  console.log('Opening document drawer for row:', row);
  console.log('Row documents:', row.documents);
  
  selectedRowData.value = row
  documentDrawerVisible.value = true
}

// Close document drawer
const closeDocumentDrawer = () => {
  documentDrawerVisible.value = false
  selectedRowData.value = null
}

// Handle document drawer events
const handleDocumentRefresh = () => {
  // Refresh the table data when documents are modified
  getFilteredData(filters, filterValues)
}

// Handle upload completion
const handleUploadComplete = (response) => {
  console.log('Upload completed:', response)
  // Refresh the table data to show new documents
  getFilteredData(filters, filterValues)
  // Close the upload dialog
  addMoreDocuments.value = false
}

const handleOpenDialog = () => {
  // Handle opening upload dialog
  console.log('handleOpenDialog called!')
  console.log('Opening upload dialog for row:', selectedRowData.value)
  if (selectedRowData.value) {
    console.log('Calling toggleComponent with:', selectedRowData.value)
    toggleComponent(selectedRowData.value)
  } else {
    console.log('No selectedRowData available!')
  }
}

 


const dialogMap = ref(false)

const reportGeom = ref([])
const projectGeom = ref([])

const reportDetails = ref();
const locationStatus = ref('')
const projectLocationColor = ref('red')

const showMap = async (row) => {
  reportDetails.value = row


  // get the geometry of teh reprot 
  const formData = {}
  formData.model = 'indicator_category_report'
  formData.id = row.id
  console.log(formData)
  const res = await getOneGeo(formData)
  const loc_geom = res.data[0].json_build_object
  var centroid = turf.centroid(loc_geom);
  console.log('centroid', centroid)
  reportGeom.value = centroid


  // now get the geometry of the project lcoation 
  console.log(row)
  const projLocFormData = {}
  projLocFormData.model = 'project_location'
  projLocFormData.id = row.project_location_id

  const prj_res = await getOneGeo(projLocFormData)
  const proj_geom = prj_res.data[0].json_build_object
  var proj_centroid = turf.centroid(proj_geom);
  console.log('centroid', proj_centroid)
  projectGeom.value = proj_centroid


  console.log('  projectGeom.value', projectGeom.value)
  console.log('  projectGeom.value', projectGeom.value)


  dialogMap.value = true

  //   projectGeom.value = reportDetails.value.project.geom



  var options = { units: 'kilometers' };

  var distance = turf.distance(proj_centroid, centroid, options);
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
  var mapCenter = reportGeom.value.geometry.coordinates;

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
        'circle-color': 'red',
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



    //     Add Project Location layer
    nmap.addLayer({
      id: 'project-layer',
      type: 'circle',
      source: {
        type: 'geojson',
        data: projectGeom.value,
      },
      paint: {
        'circle-color': 'red',
        'circle-radius': 6,
      },
      filter: ['==', '$type', 'Point'],
    });


    // Add marker to the map
    // Create a new marker and set its position
    const proj_marker = new mapboxgl.Marker()
      .setLngLat(projectGeom.value.geometry.coordinates) // Set the marker position using the GeoJSON coordinates
      .addTo(nmap); // Add the marker to the map

    // Create a new popup
    const project_popup = new mapboxgl.Popup({ offset: 25 }) // Optionally add an offset
      .setHTML('<h3>Project Location</h3><p>Coordinates: ' + projectGeom.value.geometry.coordinates[1] + ', ' + projectGeom.value.geometry.coordinates[0] + '</p>'); // Set the HTML content of the popup

    // Attach the popup to the marker
    proj_marker.setPopup(project_popup).togglePopup(); // Automatically open the popup when the marker is added to the map



    const lineString = {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "LineString",
        "coordinates": [
          projectGeom.value.geometry.coordinates, // First point coordinates
          reportGeom.value.geometry.coordinates  // Second point coordinates
        ]
      }
    };

    nmap.addLayer({
      id: 'distance-layer',
      type: 'line', // Change to 'line' to display the outline
      source: {
        type: 'geojson',
        data: lineString
      },
      'paint': {
        'line-color': 'red',
        'line-width': 1,
        'line-dasharray': [10, 10],


      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      }
    });


    const bounds = turf.bbox((lineString))
    console.log("From geo", bounds)
    nmap.fitBounds(bounds, { padding: 100 })





    console.log(nmap)

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
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

const getSummaries = (param) => {
  const { columns, data } = param;
  const sums = [];

  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = 'Summary';
      return;
    }

    // Calculate total for Amount column
    if (column.property === 'amount') {
      const total = data.reduce((sum, row) => {
        const value = Number(row[column.property]);
        return isNaN(value) ? sum : sum + value;
      }, 0);
      sums[index] = total.toLocaleString();
    } 
    // Calculate average for Progress column
    else if (column.label === 'Progress %') {
      const validProgressValues = data.filter(row => {
        const progress = Number(row.progress || 0);
        return !isNaN(progress) && isFinite(progress);
      });
      
      if (validProgressValues.length > 0) {
        const averageProgress = validProgressValues.reduce((sum, row) => {
          return sum + Number(row.progress || 0);
        }, 0) / validProgressValues.length;
        
        sums[index] = `Avg: ${averageProgress.toFixed(1)}%`;
      } else {
        sums[index] = 'Avg: 0.0%';
      }
    }
    // For other columns, show empty
    else {
      sums[index] = '';
    }
  });

  return sums;
};

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
  disableIndicator.value = false
  AddDialogVisible.value = false
}

const _getFilteredProjects = (query) => {
  const filteredProjects = projectOptionsAll.value.filter(project =>
    project.label.toLowerCase().includes(query.toLowerCase())
  );

  // Create a new Set to store unique project labels
  const uniqueProjects = new Map();

  filteredProjects.forEach(project => {
    if (!uniqueProjects.has(project.label)) {
      uniqueProjects.set(project.label, project);
    }
  });

  // Return the unique values as an array
  return Array.from(uniqueProjects.values());
};


const getFilteredProjects = (query) => {
  let filteredProjects = [];

  // If the query is not provided, return the first 10 projects
  if (!query) {
    filteredProjects = projectOptionsAll.value.slice(0, 10);
  } else {
    // Otherwise, filter the projects based on the query
    filteredProjects = projectOptionsAll.value.filter(project =>
      project.label.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Create a new Map to store unique project labels
  const uniqueProjects = new Map();

  filteredProjects.forEach(project => {
    if (!uniqueProjects.has(project.label)) {
      uniqueProjects.set(project.label, project);
    }
  });

  // Return the unique projects as an array
  return Array.from(uniqueProjects.values());
};


 
const searchProject = (query) => {
  console.log('touched')
  loading.value=true
  if (query !== '') {
    // Simulate API call
    setTimeout(() => {
      projectOptions.value = getFilteredProjects(query); // Replace with API call
      console.log('projectOptions.value1 ', projectOptions.value )

      loading.value=false
    }, 500);
  } else {
    loading.value=false
    projectOptions.value = getFilteredProjects(''); // Replace with API call

    console.log('projectOptions.value2 ', projectOptions.value )

    //projectOptions.value = [];
    

  }
};


 


function handleIndicatorsChange(selectedIds) {
  const selectedIndicators = indicatorsOptionsFiltered.value.filter(opt =>
    selectedIds.includes(opt.value)
  ); 

 console.log('selectedIds',selectedIds)

  ruleForm.indicators = selectedIndicators.map(ind => ({
    ...ind,
    amount: null,
    baseline: null,
    target: null,
    date: new Date(),
    cumProgress: null
  }));


  console.log(ruleForm.indicators,ruleForm.indicators)
}


</script>

<template>
  <el-card>
    <el-row :gutter="10" style="margin-bottom: 10px;">
      <el-col :span="3">
        <el-button type="primary" plain :icon="Back" @click="goBack">
          Back
        </el-button>
      </el-col>
      
      <el-col :span="5">
        <el-select
          v-model="selectedSettlements" 
          @change="handleSettlementFilter" 
          @clear="handleClear" 
          multiple clearable 
          filterable
          remote
          reserve-keyword
          :loading="loading"
          collapse-tags 
          placeholder="Search Settlement"
          :remote-method="remoteMethodSettlement"
          style="width: 100%;">
          <el-option 
            v-for="item in settlementFilterOptions" 
            :key="item.id" 
            :label="item.label" 
            :value="item.value">
            <div style="display: flex; align-items: center;">
              <span style="flex: 1; text-align: left;">{{ item.label }}</span>
              <span style="flex: 2; color: var(--el-text-color-secondary); font-size: 13px; text-align: right;">
                {{ item.ward ? item.ward + ', ' : '' }}{{ item.subcounty ? item.subcounty + ', ' : '' }}{{ item.county }}
              </span>
            </div>
          </el-option>
        </el-select>
      </el-col>
      
      <el-col :span="5">
        <el-select
          v-model="selectedIndicators" 
          @change="handleIndicatorFilter" 
          @clear="handleClear" 
          multiple clearable filterable
          collapse-tags 
          placeholder="Filter by Indicator"
          style="width: 100%;">
          <el-option v-for="item in indicatorFilterOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-col>
      
      <el-col :span="11">
        <div style="display: flex; align-items: center; gap: 10px; justify-content: flex-end;">
          <PermissionWrapper :permissions="['indicator_category_report:create']">
            <el-tooltip content="Add Indicator Category Report" placement="top">
              <el-button :onClick="AddReport" type="primary" :icon="Plus" />
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
      </el-col>
    </el-row>
    <el-table 
      :data="tableDataList" 
      :loading="loading" 
      border 
      show-summary 
      :summary-method="getSummaries" 
      style="width: 100%; margin-top: 10px;">
      <el-table-column label="Indicator" sortable>
        <template #default="{ row }">
          {{ row.indicator_category?.indicator_name || 'N/A' }}
        </template>
      </el-table-column>
      <el-table-column label="Category" sortable>
        <template #default="{ row }">
          {{ row.indicator_category?.category_title || 'N/A' }}
        </template>
      </el-table-column>
      <el-table-column label="Settlement" sortable>
        <template #default="{ row }">
          {{ row.settlement?.name || 'N/A' }}
        </template>
      </el-table-column>
      <el-table-column label="Amount" prop="amount" sortable />
      <el-table-column label="Progress %" prop="progress" sortable>
        <template #default="{ row }">
          {{ isFinite(Number(row.progress || 0)) ? Number(row.progress || 0).toFixed(1) : '0.0' }}%
        </template>
      </el-table-column>
      <el-table-column label="Date" prop="date" sortable>
        <template #default="{ row }">
          {{ formatDate(row.date) }}
        </template>
      </el-table-column>
      <el-table-column label="Status" prop="status" sortable>
        <template #default="{ row }">
          <el-tag :type="row.status === 'Approved' ? 'success' : row.status === 'Rejected' ? 'danger' : 'info'">
            {{ row.status || 'New' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Documents" width="120" align="center">
        <template #default="{ row }">
          <div class="documents-cell">
            <el-button 
              type="primary" 
              size="small" 
              :icon="Files"
              @click="openDocumentDrawer(row)"
              class="documents-button"
            >
              {{ row.documents?.length || 0 }}
            </el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="250">
        <template #default="{ row }">
          <PermissionWrapper :permissions="['indicator_category_report:update', 'indicator_category_report:delete']">
            <TableActions 
              :item="row" 
              :buttons="action_buttons" 
              @edit="editReport" 
              @delete="DeleteReport" 
              @view-on-map="showMap"
              @preview="preview"
              :disabled-buttons="row.geom ? [] : ['viewOnMap']" />
          </PermissionWrapper>
        </template>
      </el-table-column>
    </el-table>
    <ElPagination
      :layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'" v-model:currentPage="currentPage"
      v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 200, 10000]" :total="total" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4"
      :small="isMobile"
      :pager-count="isMobile ? 3 : 7" />
  </el-card>






  <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formHeader" :width="dialogWidth">
  <el-steps :active="activeStep" align-center finish-status="success" style="margin-bottom: 20px;">
    <el-step title="Project Details" />
    <el-step title="Indicator Selection" />
    <el-step title="Input Values" />
    <el-step title="Submit" />
  </el-steps>

  <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="100px" label-position="top">
    <!-- Step 0 -->
    <el-row v-if="activeStep === 0" :gutter="20">
      <el-col :span="24">
        <el-form-item label="Project" prop="project_id">
        
          <el-select
              id="location-select"
              v-model="prj_obj"
              filterable
              remote
              reserve-keyword
              :loading="loading"
              placeholder="Search by Project title, county, settlement"
              :remote-method="searchProject"
              style="width: 100%"
              @change="changeProject"
            >
              <el-option
                v-for="item in projectOptions"
                :key="item.value"
                :label="item.label"
                :value="item"
              >
                <div style="display: flex; align-items: center;">
                  <span style="flex: 1; text-align: left;">{{ item.label }}</span>
                 
                </div>
              </el-option>
            </el-select>

 


          <el-text v-if="disableIndicator" class="mx-1" type="danger">No output indicators are configured for this project</el-text>
        </el-form-item>

        <el-form-item v-if="!isNationalProject" label="Location" prop="project_location_id">
          <el-select :disabled="disableIndicator" v-model="ruleForm.project_location_id" value-key="id" placeholder="Select" @change="changeLocation" style="width: 100%;">
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

    <!-- Step 1 -->
    <el-row v-if="activeStep === 1" :gutter="20">
      <el-col :span="24">
        <el-form-item label="Indicators" prop="indicator_category_id">
          <el-select-v2
            v-model="ruleForm.indicator_category_id"
            multiple
            filterable
            :options="indicatorsOptionsFiltered"
            placeholder="Select one or more indicators"
            style="width: 100%;"
            @change="handleIndicatorsChange"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <!-- Step 2 -->
    <el-row v-if="activeStep === 2" :gutter="20">
      <el-col :span="24">
        <el-table :data="ruleForm.indicators" style="width: 100%;" border>
          <el-table-column label="Indicator" prop="label" />
          <!-- <el-table-column label="Amount">
            <template #default="{ row }">
              <el-input-number min="0"  v-model="row.amount" style="width: 100%;" />
            </template>
          </el-table-column> -->
         
          <el-table-column>
            <template #header>
              <span v-if="ruleForm.indicators.some(i => i.unit === 'Yes/No')">Status</span>
              <span v-else>Amount</span>
            </template>
            <template #default="{ row }">
              <template v-if="row.unit === 'Yes/No'">
                <el-switch
                  v-model="row.qualitative"
                  active-value="Yes"
                  inactive-value="No"
                />
              </template>
              <template v-else>
                <el-input-number
                  min="0"
                  v-model="row.amount"
                  style="width: 100%;"
                />
              </template>
            </template>
          </el-table-column>


          <el-table-column label="Date">
            <template #default="{ row }">
              <el-date-picker  v-model="row.date" type="date" placeholder="Pick a day" style="width: 100%;" :disabled-date="disabledFutureDates" />
            </template>
          </el-table-column>
       
        </el-table>
      </el-col>
    </el-row>

    <!-- Step 3 -->
    <el-row v-if="activeStep === 3" :gutter="20">
      <el-col :span="24">
        <el-form-item label="Comments" prop="comments">
          <el-input v-model="ruleForm.comments" type="textarea" placeholder="Do you have any comments?" />
        </el-form-item>

        <el-upload
          v-model:file-list="fileUploadList"
          class="upload-demo"
          action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
          multiple
          :on-preview="handlePreview"
          :on-remove="handleRemove"
          :before-remove="beforeRemove"
          :limit="3"
          :auto-upload="false"
          :on-exceed="handleExceed"
        >
          <el-button type="primary" :icon="UploadFilled"> Documentation</el-button>
        </el-upload>
      </el-col>
    </el-row>
  </el-form>

  <!-- Footer -->
  <template #footer>
    <span class="dialog-footer">
      <el-row :gutter="5">
        <el-col :span="24">
          <el-button @click="prevStep" :disabled="activeStep === 0">Previous</el-button>
          <el-button :disabled="disableIndicator" @click="nextStep" v-if="activeStep < 3">Next</el-button>
          <el-button @click="handleCancel">Cancel</el-button>
          <el-button v-if="showSubmitBtn && activeStep === 3" type="primary" @click="submitForm(ruleFormRef)">Submit</el-button>
          <el-button v-if="showEditSaveButton && activeStep === 3" type="primary" @click="editForm(ruleFormRef)">Save</el-button>
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
        <h2 :style="`color: ${projectLocationColor}; font-style: italic;`">{{ locationStatus }}</h2>
        <!-- Use the 'italicizedColor' variable -->
        <el-button type="danger" :icon="CircleCloseFilled" @click="closeMap">Close Map</el-button>
      </div>
    </template>
    <div id="mapContainer" class="basemap"></div>

  </el-dialog>

  <el-dialog v-model="PreviewDialog" title="Report Preview" :width="previewWindowWidth" draggable>
    <el-descriptions title="" direction="vertical" :column="2" size="small" border>
      <el-descriptions-item label="Project">{{ report.project }}</el-descriptions-item>
      <el-descriptions-item label="Settlement">{{ report.location }}</el-descriptions-item>
      <el-descriptions-item label="Indicator" :span="2">{{ report.indicator }}</el-descriptions-item>
      <el-descriptions-item label="Category" :span="2">{{ report.category }}</el-descriptions-item>
      <el-descriptions-item label="Amount">{{ report.amount }}</el-descriptions-item>
      <el-descriptions-item label="Progress">{{ report.progress }}%</el-descriptions-item>
      <el-descriptions-item label="Date">{{ report.date }}</el-descriptions-item>
      <el-descriptions-item label="Submitted By">{{ report.user }}</el-descriptions-item>
      <el-descriptions-item label="Telephone">{{ report.phone }}</el-descriptions-item>
      <el-descriptions-item label="Comments" :span="2">{{ report.comments }}</el-descriptions-item>
      <el-descriptions-item label="Documentation" v-if="report.documents && report.documents.length" :span="2">
        <div v-for="(doc, index) in report.documents" :key="index">
          <span>{{ doc.name }}</span>
        </div>
      </el-descriptions-item>
    </el-descriptions>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="PreviewDialog = false">Close</el-button>
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
target="#btn5" title="Quantity"
      description="Specify the amount/value/quantity for this reporting period.  " />

    <el-tour-step target="#btn6" title="Cumulative" description=" Shows the cumulative achievements todate" />



    <el-tour-step target="#btn8" title="Baseline" description="Shows the value at the start of the activity" />


    <el-tour-step target="#btn9" title="Target" description="Targeted quantity/amount/value" />


    <el-tour-step target="#btn10" title="Date" description="Specify reporting date." />

    <el-tour-step
target="#btn11" title="Progress"
      description="Progress of achievements. How much of the quantity has been achieved todate?" />


    <el-tour-step
target="#btn12" title="Comments"
      description="Provide any commentary or additional information related to this submission" />

    <el-tour-step
target="#btn13" title="Documentation"
      description="Upload any documentation that is required. It includes photos, reports of data" />




  </el-tour>

  <!-- Document Drawer -->
  <DocumentDrawer
    v-model:visible="documentDrawerVisible"
    :data="selectedRowData"
    :docmodel="model"
    :permissions="['indicator_category_report:delete', 'document:delete']"
    @refresh="handleDocumentRefresh"
    @open-dialog="handleOpenDialog"
  />

  <!-- Upload Dialog -->
  <component 
    v-if="dynamicComponent" 
    :is="dynamicComponent" 
    v-bind="componentProps"
    @close="addMoreDocuments = false"
    @upload-complete="handleUploadComplete"
  />

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

.documents-cell {
  display: flex;
  justify-content: center;
  align-items: center;
}

.documents-button {
  min-width: 60px;
  font-weight: 600;
}

.no-documents {
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0.5;
}
</style>
