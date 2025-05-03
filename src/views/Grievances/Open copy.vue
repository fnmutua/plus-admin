<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { getListWithoutGeo} from '@/api/counties'

import { getGrievances,updateBulkGrievance } from '@/api/grievance'
import { toRaw } from 'vue';

import {
  signupGRM
} from '@/api/register'

import { ElButton, ElSelect, ElCheckbox, ElCol, ElIcon, ElTag } from 'element-plus'
import {
  Plus, ArrowLeft, ArrowRight, UploadFilled,RefreshLeft,
  Edit,
  Back,Postcard,TopRight,Lock,Guide,TakeawayBox,
  InfoFilled, Position,CircleCheck, Warning,View,
  Delete
} from '@element-plus/icons-vue'
import {   ElSegmented } from 'element-plus'

import { getSettlementListByCounty } from '@/api/settlements'
import {   getGRMStaffByLocation } from '@/api/users'


import { ref, reactive, onMounted, computed } from 'vue'
import {
  ElPagination, ElTooltip, ElOption, ElDialog, ElForm, ElDropdown, ElDropdownItem, ElDropdownMenu, ElTour, ElTourStep, ElUpload,
  ElFormItem, ElRow, ElInput, FormRules, ElStep, ElSteps, ElTable, ElTableColumn, ElCard, ElMessage, ElSwitch
} from 'element-plus'
import { useRouter } from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { DeleteRecord, updateOneRecord } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import type { FormInstance } from 'element-plus'
import xlsx from "json-as-xlsx"

import writeXlsxFile from 'write-excel-file';
import DownloadCustom from '@/views/Components/DownloadCustom.vue';
import type { UploadUserFile } from 'element-plus'

import { getCountyAuth, getSettlementByCountyAuth } from '@/api/register'
import { uploadGrievanceDocuments, generateGrievance, logGrievanceAction,revertGrievanceHistory,logGrievanceActionBulk, batchImportGrievances, getByKeyword } from '@/api/grievance'
import { getModelSpecs } from '@/api/fields'
import exportFromJSON from 'export-from-json'
import Papa from 'papaparse';

import { getSummarybyFieldFromMultipleIncludes } from '@/api/summary'


const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)

const countiesOptions = ref([])
const settlementOptions = ref([])

const isSuperAdmin = ref(userInfo.roles.some(role => role.name === "super_admin"));

console.log("userInfo--->", userInfo)
const selectedCounty=ref()

 
const filters=ref([])
const filterValues=ref([[]])
const filterFunction=ref(['in'])

function getLocationLevels(user) {
  // Check if the 'roles' array exists and has data
  if (user && user.roles && Array.isArray(user.roles)) {
    // Extract the location_level from each role
    return user.roles.map(role => role.user_roles.location_level).filter(level => level); // Filter to remove null/undefined values
  }
  return []; // Return an empty array if no roles exist
}


const current_user_roles = getLocationLevels(userInfo)

console.log('current_user_roles',current_user_roles)

const isCountyOrNational = computed(() =>
  current_user_roles.some(role =>
    role.toLowerCase().includes('county') || role.toLowerCase().includes('national')
  )
);



const Statuses = ref([
  {
    label: 'Sorting',
    value: 'Sorting',
    icon: Postcard,
    count: 0,
    hidden: false,
  },

  {
    label: 'Under Review',
    value: 'Under Review',
    icon: View,
    count: 0,
    hidden: false,
  },


  {
    label: 'Resolved',
    value: 'Resolved',
    icon: CircleCheck,
    count: 0,
    hidden: false,
  },

 
  {
    label: 'Escalated',
    value: 'Escalated',
    icon: TopRight,
    count: 0,
    hidden: false,
  },
  {
    label: 'Closed',
    value: 'Closed',
    icon: Lock,
    count: 0,
    hidden: false,    
 

  },
  {
    label: 'Referred',
    value: 'Referred',
    icon: Guide,
    count: 0,
    hidden: false
  },

  {
    label: 'In Court',
    value: 'In Court',
    icon: TakeawayBox,
    count: 0,
    hidden: false
  },

  {
    label: 'Rejected',
    value: 'Rejected',
    icon: Warning,
    count: 0,
    hidden: false
  },
  {
    label: 'Deleted',
    value: 'Deleted',
    icon: Delete,
    count: 0,
    hidden: !isSuperAdmin.value
  },
])





const currentUser = wsCache.get(appStore.getUserInfo)

const grmUsers=ref([])
const grmUsersLoading=ref(false)

const getGRMUsers = async (countyIds) => {

  grmUsersLoading.value=true
 
  const formData = {}
 
  formData.model = 'users'
 
  // - multiple filters -------------------------------------
  formData.filters = []
  formData.filterValues = []
  formData.associated_multiple_models = ['settlement']
  formData.currentUser = currentUser
  formData.county_id = countyIds
  //formData.settlement_id = FullGrievanceData.value.settlement_id
  formData.currentUser = currentUser
  formData.limit = 10000
  
    //-------------------------
  console.log('gettign getGRMStaff users --->', formData)
  const res = await getGRMStaffByLocation(formData)

  console.log('After getting getGRMStaff users', res)
   
  grmUsersLoading.value=false

  // Assuming res.data is an array of objects with name and phone
    grmUsers.value = res.data.map(user => ({
    label: user.name  + ' (' + user.phone  + ')' ,
    value: user.id,
  }));

 
 
}
 




const isNationalStaff = ref(false)
const isCountyStaff = ref(false)
 
let  roles_filters = [];

const getUserRoles = async () => {
  // Clear existing filters
  roles_filters = [];
  filters.value = [];
  filterValues.value = [];

  const grmRole = userInfo.roles.map(role => {
    if (role.name === "grm" || role.name === "admin" || role.name === "root_admin"|| role.name === "super_admin" || role.name === "staff") {
      let field = null;
      let fieldvalue = null;

      const level = role.user_roles.location_level;

      if (level === "county") {
        isNationalStaff.value = false;
        field = "county_id";
        fieldvalue = role.user_roles.county_id;
        isCountyStaff.value=true 
        console.log ('isCountyStaff.value',isCountyStaff.value)
        //CountyId.value =role.user_roles.county_id;
        selectedCounty.value =role.user_roles.county_id;
        console.log('selectedCounty.value',selectedCounty.value)
          getSubCountyNames()
        filterByCounty(selectedCounty.value)

      } else if (level === "settlement") {
        isNationalStaff.value = false;
        field = "settlement_id";
        fieldvalue = role.user_roles.settlement_id;
      } else if (level === "national" || level === null) {
        isNationalStaff.value = true;
        return { model: "national", field: null, fieldvalue: null };
      } else {
        field = "location_id";
        fieldvalue = role.user_roles.location_id;
      }

      return {
        model: level,
        field,
        fieldvalue,
      };
    }
    return null;
  }).filter(role => role !== null);

  // Check for super_admin role
  isSuperAdmin.value = userInfo.roles.some(role => role.name === "super_admin");

  // Determine filter values based on user roles
  if (isSuperAdmin.value || (grmRole.length > 0 && grmRole[0].model === "national")) {
    console.log('Super admin or national user – no filters applied');
    roles_filters = [];
  } else if (grmRole.length > 0) {
    const { field, fieldvalue } = grmRole[0];
    roles_filters.push({ field, value: fieldvalue });
  }

  // Populate filters and filterValues from roles_filters
  roles_filters.forEach(rf => {
    filters.value.push(rf.field);
    filterValues.value.push([rf.value]); // Wrap in array for uniformity
  });

  // Always apply initial filter: status = 'sorting'
 
  
  console.log('isSuperAdmin.value', isSuperAdmin.value);
  console.log('roles_filters --', roles_filters);
  console.log('filters', filters.value);
  console.log('filterValues', filterValues.value);
};






const isMobile = computed(() => appStore.getMobile)

console.log('IsMobile', isMobile)

const dialogWidth = ref()
const actionColumnWidth = ref()

if (isMobile.value) {
  dialogWidth.value = "90%"
  actionColumnWidth.value = "75px"
} else {
  dialogWidth.value = "25%"
  actionColumnWidth.value = "100px"

}


function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
const indicatorsOptions = ref([])
const GrvOptions = ref([])
const page = ref(1)

const selCounties = []
const loading = ref(true)
const currentPage = ref(1)
const total = ref(0)



const mobileBreakpoint = 768;
const defaultPageSize = 8;
const mobilePageSize = 5;
const pageSize = ref(defaultPageSize);
const pageHeight = ref(600);
const paginationLayout = ref("sizes, prev, pager, next, total")
const pagerCount = ref()
// Function to update pageSize based on window width
const updatePageSize = () => {
  if (window.innerWidth <= mobileBreakpoint) {
    pageSize.value = mobilePageSize;

    paginationLayout.value = ("prev, pager, next")
    pagerCount.value = 2


  } else {
    pageSize.value = defaultPageSize;
    paginationLayout.value = ("sizes, prev, pager, next, total")
    pagerCount.value = undefined
  }

  pageHeight.value = window.innerHeight - 250

  console.log(' pageHeight.value', pageHeight.value)

};



const xgetCounts = async () => {
  console.log('Fetching grievance counts...',filterValues.value,filters.value);

  const formData = {
    model: 'grievance',
    summaryField: 'status',
    summaryFunction: 'count',
    groupFields: ['status'],
    filterField: [],
    filterValue: [],
    filterOperator: []
  };

  // Build filters dynamically
  if (roles_filters.length > 0 && filters.value.length === filterValues.value.length) {
    for (let i = 0; i < filters.value.length; i++) {
      const field = filters.value[i];
      const value = filterValues.value[i];

      if (field && value !== undefined && value !== null) {
        formData.filterField.push(field);

        if (Array.isArray(value)) {
          formData.filterValue.push(value);
          formData.filterOperator.push('in');
        } else {
          formData.filterValue.push([value]);
          formData.filterOperator.push('eq');
        }
      }
    }
  }

  console.log('Constructed formData:', formData);

  try {
    const response = await getSummarybyFieldFromMultipleIncludes(formData);
    const summary = response.Total || [];

    console.log('Grievance status counts:', summary);

    // Update Statuses count dynamically
    Statuses.value.forEach((status) => {
      const match = summary.find((item) => item.status === status.value);
      status.count = match ? parseInt(match.count, 10) : 0;
    });
  } catch (error) {
    console.error('Error fetching status counts:', error);
    // Optionally reset counts on failure
    Statuses.value.forEach((status) => {
      status.count = 0;
    });
  }
};

 
const getCounts = async () => {
  console.log('Fetching grievance counts...', filterValues.value, filters.value);

  const rawFilterValues = toRaw(filterValues.value);
  const rawFilters = toRaw(filters.value);

  const filterField = [];
  const filterValue = [];
  const filterOperator = [];

  if (rawFilters.length === rawFilterValues.length) {
    for (let i = 0; i < rawFilters.length; i++) {
      const field = rawFilters[i];
      const value = rawFilterValues[i];

      if (field && value !== undefined && value !== null) {
        filterField.push(field);

        if (Array.isArray(value)) {
          filterValue.push(value);
          filterOperator.push('eq');
        } else {
          filterValue.push([value]);
          filterOperator.push('eq');
        }
      }
    }
  }

  const formData = {
    model: 'grievance',
    summaryField: 'status',
    summaryFunction: 'count',
    groupFields: ['status'],
    filterField,
    filterValue,
    filterOperator
  };

  console.log('Constructed formData:', formData);

  try {
    const response = await getSummarybyFieldFromMultipleIncludes(formData);
    const summary = response?.Total || [];

    console.log('Grievance status counts:', summary);

    Statuses.value.forEach((status) => {
      const match = summary.find(item => item.status === status.value);
      status.count = match ? parseInt(match.count, 10) : 0;
    });
  } catch (error) {
    console.error('Error fetching status counts:', error);
    Statuses.value.forEach((status) => {
      status.count = 0;
    });
  }
};





const getDeletedCounts = async () => {
  console.log('Fetching deleted grievance count...');

  const formData = {
    model: 'grievance_history',
    summaryField: 'change_type',
    summaryFunction: 'count',
    groupFields: ['change_type'],
    filterField: ['change_type','status'],
    filterValue: [['Delete'],['Open']],
    filterOperator: ['eq','eq']
  };

  try {
    const response = await getSummarybyFieldFromMultipleIncludes(formData);
    const deletedCount = response.Total.find(item => item.change_type === 'Delete')?.count || 0;

    console.log('Deleted grievance count:', response.Total);
    
          // Update only the 'Deleted' status count
      Statuses.value.forEach((status) => {
        if (status.value === 'Deleted') {
          status.count = deletedCount; // Use deletedCount directly
        }
      });

   
  } catch (error) {
    console.error('Error fetching deleted grievance count:', error);
    return 0;
  }
};





onMounted(async () => {
 await getUserRoles()
  await   getDeletedCounts()
    await getCounts()
  // window.addEventListener('resize', updatePageSize);
  // updatePageSize(); // Initial check

   await getInterventionsAll()
})


const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)




let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////




 
const associated_Model = ''
const associated_multiple_models = ['county', 'settlement', 'grievance_document']
const model = 'grievance'
//// ------------------parameters -----------------------////

const { t } = useI18n()
const AddDialogVisible = ref(false)
const formHeader = ref('Add Grievance')
const showSubmitBtn = ref(true)
const showEditSaveButton = ref(false)






const handleClear = async () => {
  console.log('cleared....')

  // clear all the fileters -------
  filterValues.value = []
  filters.value  = []
  value1.value = ''
  value2.value = ''
  value3.value = ''
  pageSize.value = 5
  currentPage.value = 1
  tblData = []
  //----run the get data--------
  getInterventionsAll()
}



const onPageChange = async (selPage: any) => {
  console.log('on change change: selected counties ', selCounties)
  page.value = selPage
  getFilteredData(filters.value, filterValues.value)
}

const onPageSizeChange = async (size: any) => {
  pageSize.value = size
  getFilteredData(filters.value, filterValues.value)
}

const getInterventionsAll = async () => {
  filters.value.push('status')
  filterValues.value.push(['Sorting'])

  getFilteredData(filters.value, filterValues.value)
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


  console.log('selFilters',selFilters, selfilterValues)
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
  formData.filterFunctions = filterFunction.value

  formData.associated_multiple_models = associated_multiple_models


  formData.filterFunctions = [];

// Loop to determine the correct operator (eq or in) per filter
for (let i = 0; i < selfilterValues.length; i++) {
  const val = selfilterValues[i];

  if (Array.isArray(val)) {
    formData.filterFunctions.push('in');
  } else {
    formData.filterFunctions.push('eq');
    // Optional: wrap scalar in array if your backend expects array
    formData.filterValues[i] = [val];
  }
}


  //-------------------------
  //console.log(formData)
  const res = await getGrievances(formData)

  console.log('After Querry', res)
  console.log('After Querry - selFilters', selFilters)
  console.log('After Querry - selfilterValues', selfilterValues)



  tableDataList.value = res.data

  availableFields.value = extractFields(tableDataList.value);



  total.value = res.total

  Statuses.value.forEach(status => {
  if (status.label === activeSegment.value) {
    status.count = res.total; // Update this count dynamically
  }
});


loading.value = false

  console.log('segment', activeSegment.value)
}



const getIndicatorOptions = async (selFilters, selfilterValues) => {
  const formData = {}
   formData.limit = 1000
  formData.page = 1
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
  formData.filterFunctions = filterFunction.value

  formData.associated_multiple_models = associated_multiple_models

  //-------------------------
  //console.log(formData)
  const res = await getGrievances(formData)
 
  makeOptions(res.data)
  
}







const makeOptions = (list) => {
//  console.log('making the options..............', list)
  GrvOptions.value = []
  list.forEach(function (arrayItem: { id: string; type: string }) {
    var countyOpt = {}
    countyOpt.value = arrayItem.id
    countyOpt.label = arrayItem.code
    //  console.log(countyOpt)
    GrvOptions.value.push(countyOpt)
  })
}




console.log('Options---->', indicatorsOptions)
const editIndicator = (data: TableSlotDefault) => {
  showSubmitBtn.value = false
  showEditSaveButton.value = true
  console.log(data)
  ruleForm.id = data.row.id
  ruleForm.title = data.row.title
  ruleForm.shortTitle = data.row.shortTitle



  formHeader.value = 'Edit Component'


  AddDialogVisible.value = true
}


const DeleteIndicator = async (data: TableSlotDefault) => {
  console.log('----->', data.id)
  let formData = {}
  formData.id = data.id
  formData.model = model
  await DeleteRecord(formData)

  // remove the deleted object from array list 
  let index = tableDataList.value.indexOf(data);
  if (index !== -1) {
    console.log('Remove index', index)

    tableDataList.value.splice(index, 1);
    console.log(tableDataList.value)

  }




  getFilteredData(filters, filterValues)
}

const ruleForm = reactive({
  title: '',
  shortTitle: ''
})





const AddComponent = () => {
  AddDialogVisible.value = true
}






const uploadFiles = async (action_id, grievance_id) => {
  const formData = new FormData();

  // Assuming `fileList` is an array of file objects and `grievance_id` is defined
  for (var i = 0; i < fileList.value.length; i++) {
    console.log('------>file', fileList.value[i]);
    formData.append('files', fileList.value[i].raw);
    formData.append('format', fileList.value[i].name.split('.').pop());
    formData.append('grievance_id', grievance_id);
    formData.append('action_id', action_id);
    formData.append('protected_file', true);
    formData.append('type', 'Supporting Documentation');
    formData.append('size', (fileList.value[i].raw.size / 1024 / 1024).toFixed(2));
    formData.append('code', uuid.v4());
  }

  // Printing out the contents of formData
  for (let [key, value] of formData.entries()) {
    console.log(`${key}: ${value}`);
  }

  const res = await uploadGrievanceDocuments(formData)

  console.log("Docuemnts Uploaded", res)




}


const logAction = async (grievance) => {
  console.log('Log---->grievance', grievance)


  const formData = {};

  formData.grievance_id = grievance.id
  formData.action_type = 'Reported'
  formData.action_by = null
  formData.date_actioned = grievance.date_reported
  formData.prev_status = grievance.status
  formData.new_status = grievance.status
  formData.current_level = 'settlement'



  const res = await logGrievanceAction(formData)
  console.log("Log Successful", res)
  return res.data




}


 


function getStageDuration(status) {
    const durations = {
        "Sorting": 7, // 7 days
        "Investigation": 14, // 14 days
        "Escalated": 14 , // 3 days
        "Resolved": 21,  // 3 days
        "Closed": 42,  // 3 days
  
    };
    return (durations[status] || 0) * 24 * 60 * 60 * 1000; // Convert days to milliseconds
}



const submitForm = async () => {
  grmForm.value.date_reported = new Date();
  grmForm.value.status = 'Sorting'

  grmForm.value.current_status_date=new Date();
  grmForm.value.status_expiry_date = new Date(Date.now() + getStageDuration(grmForm.value.status));

      
      grmForm.value.model = 'grievance';
      grmForm.value.current_level = 'settlement';

console.log('grmForm.value',grmForm.value)

  if(grmForm.value.isInCourt) {
        grmForm.value.status = 'In Court'
      } else {
        grmForm.value.status = 'Sorting'
      }





  if (grmForm.value.isgbv) {
        grmForm.value.current_level = 'national';

      }
      else {
        grmForm.value.current_level = 'settlement';

      }




  const formInstance = dynamicFormRef

  formInstance.value.validate(async (valid: boolean) => {
    if (valid) {
      console.log('Is Valid', grmForm)

      //1. Submit teh greivance 
      const grv = await generateGrievance(grmForm.value)
      console.log('res', grv)


      // 2 Log the entry
      let log = await logAction(grv.data)



      console.log('log', log)

      // 3. Uplaod docuemnts 

      await uploadFiles(log.id, grv.data.id)


      ElMessage({
        message: grv.message,
        type: 'success'
      })


    } else {
      console.log('is Not Valid')
      ElMessage({
        message: 'Invalid Form',
        type: 'error'
      })    // felix - show message on success request 

    }
  });


};




getIndicatorOptions()

if (userInfo) {
//  getInterventionsAll()

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


const drawer = ref(false)


const getGrievanceDetails = (data) => {
  // drawer.value = true

  push({
    name: 'GrievanceDetails',
    params: { id: data.row.id }
  })


  console.log(data)
}

 
const showDownloadDialog = ref(false);

const selectedFields = ref([]);
const availableFields = ref([]);



const extractFields = (data) => {
  const fields = new Set();

  function traverse(obj, prefix = "", isNested = false) {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fullPath = prefix ? `${prefix}.${key}` : key;

        if (isNested) {
          // In nested objects or arrays, include only id, name, or title
          if (["id", "name", "title"].includes(key)) {
            fields.add(fullPath);
          }
        } else {
          // In the main array, exclude geo fields
          if (!isGeoField(fullPath)) {
            if (typeof obj[key] === "object" && obj[key] !== null) {
              if (Array.isArray(obj[key])) {
                if (obj[key].length > 0 && typeof obj[key][0] === "object") {
                  traverse(obj[key][0], fullPath, true); // Nested array
                }
              } else {
                traverse(obj[key], fullPath, true); // Nested object
              }
            } else {
              fields.add(fullPath);
            }
          }
        }
      }
    }
  }

  function isGeoField(fieldName) {
    const geoKeywords = ["geo", "lat", "lng", "coordinate", "longitude", "latitude", "createdAt"];
    return geoKeywords.some(keyword => fieldName.toLowerCase().includes(keyword));
  }

  data.forEach(item => traverse(item));
  return Array.from(fields);
};

// Function to extract data based on selected fields
const extractData = (data, selectedFields) => {
  return data.map(row => {
    const extractedRow = {};

    selectedFields.forEach(field => {
      // Split field by dot notation
      const keys = field.split('.');
      let value = row;

      // Traverse through the object using the keys
      for (let key of keys) {
        if (value && value.hasOwnProperty(key)) {
          value = value[key];
        } else {
          value = null;
          break;
        }
      }

      // Assign the extracted value to the extractedRow
      extractedRow[field] = value;
    });

    return extractedRow;
  });
};


const downloadCSV = async () => {
  // Implement your CSV download logic here
  console.log('selectedFields.value', selectedFields.value)
  console.log('tableDataList.value', tableDataList.value)


  const formattedData = computed(() => extractData(tableDataList.value, selectedFields.value));


  console.log('formattedData', formattedData.value)



  // Define column headers
  // Define column headers
  const columns = selectedFields.value.map(field => ({
    type: String,
    value: field,
    fontWeight: 'bold',
    width: 20 // Set the width for each column

  }));



  console.log(columns)
  // Format data according to selected fields
  const formatDataForExport = () => {
    return formattedData.value.map(row => {
      return selectedFields.value.map(field => {
        return {
          type: String,
          value: row[field] ? String(row[field]) : '',
        };
      });
    });
  };
  // Function to download the Excel file

  const rows = formatDataForExport();

  console.log('rows', rows)
  // Prepend the headers (columns) as the first row
  rows.unshift(columns);

  await writeXlsxFile(rows, {
    columns: columns,
    fileName: 'data.xlsx',
  });



};



const handleCloseDialog = () => {
  AddDialogVisible.value = false
}


/// Add GRM 

const dynamicFormRef = ref<FormInstance>()

const grmForm = ref({
  name: '',
  gender: '',
  age: '',
  national_id: '',
  phone: '',
  email: '',
  county_id: '',
  settlement_id: '',
  address: '',
  nature: '',
  isgbv: false,
  description: '',
  plea: '',
  isInCourt:false,
  self_reported:false,
  reporter_name : userInfo.name,
  reporter_phone:userInfo.phone,
  witness: '',
  witness_phone: '',
  witness_statement: '',
});

const validationRules = ({
  // Validation rules for each step
  step1: {
    name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
    gender: [{ required: true, message: 'Gender is required', trigger: 'change' }],
    age: [{ required: true, message: 'Age is required', trigger: 'change' }],
    national_id: [{ required: true, message: 'National ID is required', trigger: 'blur' }],
    phone: [{ required: true, message: 'Phone number is required', trigger: 'blur' }],

  },

  step2: {
    county_id: [{ required: true, message: 'County is required', trigger: 'change' }],
    settlement_id: [{ required: true, message: 'Settlement is required', trigger: 'change' }],
    nature: [{ required: true, message: 'Nature of complaint is required', trigger: 'change' }],
    description: [{ required: true, message: 'Description is required', trigger: 'blur' }],
    plea: [{ required: true, message: 'Plea/request is required', trigger: 'blur' }],
  },



});



const ageRanges = [
  { value: '18-25', label: '18-25' },
  { value: '26-35', label: '26-35' },
  { value: '36-45', label: '36-45' },
  { value: '46-55', label: '46-55' },
  { value: '56-65', label: '56-65' },
  { value: '65+', label: '65+' },
];

const currentStepRules = computed(() => {
  const stepRulesKey = `step${active.value + 1}`;
  console.log('stepRulesKey', stepRulesKey)
  return validationRules[stepRulesKey];
});


const active = ref(0);



const next = async () => {
  console.log(grmForm.value)
  const formInstance = dynamicFormRef
  formInstance.value.validate((valid: boolean) => {
    if (valid) {
      console.log(formInstance)
      active.value++;
    }
  });


};




const prev = () => {
  active.value--;
};


const resetForm = () => {
  const formRef = dynamicFormRef.value;
  if (formRef) {
    formRef.resetFields();
  }
};


const handlePreview = (file) => {
  console.log('Preview:', file);
};

const handleRemove = (file, fileList) => {
  console.log('Remove:', file, fileList);
};

const beforeRemove = () => {
  return true;
};

const handleExceed = () => {
  ElMessage.warning('You can only upload up to 3 files.');
};

const isTourVisible = ref(false)



const showTour = () => {

  isTourVisible.value = true


}

const filteredTourSteps = computed(() => {

  const fil = tourSteps.value.filter(step => step.step == active.value && step.visible == true);
  console.log('filteredTourSteps', fil)
  return fil
});



const fileList = ref<UploadUserFile[]>([

])


const tourSteps = ref([
  {
    step: 0,
    target: '#btn1',
    title: 'Name',
    content: 'Please provide the name of the complainant as it appears on the National ID. Fill ANONYMOUS if  they  want anonymity.',
    visible: true
  },
  {
    step: 0,
    target: '#btn2',
    title: 'Gender',
    content: 'Please select gender.',
    visible: true
  },
  {
    step: 0,
    target: '#btn3',
    title: 'Age',
    content: 'Select age bracket',
    visible: true
  },
  {
    step: 0,
    target: '#btn4',
    title: 'National ID',
    content: 'Enter the national ID especially for land related complaints',
    visible: true
  },
  {
    step: 0,
    target: '#btn5',
    title: 'Phone',
    content: 'Please provide the complainants phone number. We require this for  communication on the status of the complaint',
    visible: true
  },
  {
    step: 0,
    target: '#btn6',
    title: 'Email(optional)',
    content: 'Please provide an email address if available. We may use this for our communication on the status of the complaint',
    visible: true
  },
  {
    step: 0,
    target: '#btn7',
    title: 'Next',
    content: 'Click here to fill in the complaint details',
    visible: true
  },


  {
    step: 0,
    target: '#btn8',
    title: 'Clear Form',
    content: 'Click here to clear this form',
    visible: true
  },


  {
    step: 1,
    target: '#btn10',
    title: 'County Selection',
    content: 'Select the county where the project  is implemented.',
    visible: true
  },

  {
    step: 1,
    target: '#btn11',
    title: 'Settlement Selection',
    content: 'Select the settlement within the selected county.',
    visible: true
  },
  {
    step: 1,
    target: '#btn12',
    title: 'Address',
    content: 'Enter the complainants address e.g-: near XXX Primary school, Plot No. XXX.',
    visible: true
  },
  {
    step: 1,
    target: '#btn13',
    title: 'GBV Related Complaint',
    content: 'Indicate if the complaint is related to Gender-Based Violence.',
    visible: true
  },
  {
    step: 1,
    target: '#btn14',
    title: 'Nature of Complaint',
    content: 'Select the category that best describes the nature of the complaint.',
    visible: true
  },
  {
    step: 1,
    target: '#btn15',
    title: 'Complaint Description',
    content: 'Provide a detailed description of the complaint.',
    visible: true
  },
  {
    step: 1,
    target: '#btn16',
    title: 'Plea/Request',
    content: 'Enter the complainants plea or request regarding the complaint.',
    visible: true
  },

  {
    step: 1,
    target: '#btn9',
    title: 'Previous',
    content: 'Click here to go back one page',
    visible: true
  },


  {
    step: 2,
    target: '#btn17',
    title: 'Witness Name',
    content: 'Enter the name of the witness related to the grievance.',
    visible: true
  },

  {
    step: 2,
    target: '#btn18',
    title: 'Witness Phone',
    content: 'Enter the phone number of the witness.',
    visible: true
  },

  {
    step: 2,
    target: '#btn19',
    title: 'Witness Statement',
    content: 'Provide a statement from the witness regarding the grievance.',
    visible: true
  },
  {
    step: 2,
    target: '#btn20',
    title: 'Supporting Documentation',
    content: 'Upload any supporting documents related to the grievance. Only pdf/jpg/png files with a size less than 10mb are allowed.',
    visible: true
  },
  {
    step: 2,
    target: '#btn21',
    title: 'Submit',
    content: 'Click to submit the form. The complainant  will receive a notification on SMS with a link for future followups.',
    visible: true
  }



]);


const getCounties = async () => {

  const formData = {}
  formData.model = 'county'
  await getCountyAuth({}).then((response) => {
    console.log('List of counties:', response)
    //tableDataList.value = response.data
    var cnty = response.data



    cnty.forEach(function (arrayItem) {
      var countyOpt = {}
      countyOpt.value = arrayItem.id
      countyOpt.label = arrayItem.name
      //  console.log(countyOpt)
      countiesOptions.value.push(countyOpt)
    })


    // sort by value
    countiesOptions.value.sort(function (a, b) {
      return a.value - b.value;
    });

  })
}

getCounties()



const getSettlementByCounty = async (selectCounty) => {
  // nullify selection after change 
  settlementOptions.value = []
  grmForm.value.settlement_id = null


  console.log("County:", selectCounty)

  const formData = {}
  formData.model = 'settlement'
  await getSettlementByCountyAuth({ county_id: selectCounty }).then((response) => {
    console.log('List of settlement:', response)
    //tableDataList.value = response.data
    var opt = response.data



    opt.forEach(function (arrayItem) {
      var item = {}
      item.value = arrayItem.id
      item.label = arrayItem.name
      item.county_id = arrayItem.county_id
      item.subcounty_id = arrayItem.subcounty_id
      item.ward_id = arrayItem.ward_id

      settlementOptions.value.push(item)
    })


    // sort by value
    settlementOptions.value.sort(function (a, b) {
      return a.value - b.value;
    });

  })
}

const handleSelectSettlement = async (settlementId) => {
  console.log(settlementId)
  const filteredOptions = settlementOptions.value.filter(option => option.value === settlementId);
  console.log(filteredOptions[0].subcounty_id)
  grmForm.value.subcounty_id = filteredOptions[0].subcounty_id
  grmForm.value.ward_id = filteredOptions[0].ward_id

}


function convertPhoneNumber(phoneNumber: string | undefined) {

  // console.log(phoneNumber)
  let trimmedPhoneNumber = phoneNumber.replace(/\s+/g, '').trim();
  console.log(trimmedPhoneNumber.startsWith('0'))


  if (trimmedPhoneNumber.startsWith('0')) {
    trimmedPhoneNumber = '254' + trimmedPhoneNumber.slice(1);
  }

  console.log(trimmedPhoneNumber)
  // return trimmedPhoneNumber;
  grmForm.value.phone = trimmedPhoneNumber

}


const uploadDialog = ref(false)

const field_set = ref([])
const uploadData = async () => {
  uploadDialog.value = true
  console.log('Uploading data.......')
  var formData = {}
  formData.model = 'grievance'
  await getModelSpecs(formData).then((response) => {
    console.log(response.data)
    field_set.value = response.data
  })

}

const DownloadTemplate = async () => {

  const data = field_set.value
  const fileName = 'grievance_template'
  const exportType = exportFromJSON.types.csv
  if (data) exportFromJSON({ data, fileName, exportType })

}




function convertStringArraysToProperArrays(data) {
  return data.map(item => {
    const newItem = { ...item }; // Create a shallow copy of the object

    for (const key in newItem) {
      if (newItem.hasOwnProperty(key)) {
        const value = newItem[key];

        // Check if the value is a string and can be parsed as an array
        if (typeof value === 'string') {
          try {
            const parsedValue = JSON.parse(value);

            if (Array.isArray(parsedValue)) {
              newItem[key] = parsedValue;
            }
          } catch (e) {
            // Handle any JSON parsing errors
            console.error(`Error parsing string to array for key ${key}:`, e);
          }
        }
      }
    }

    return newItem;
  });
}



const ImportGrievances = async () => {

  //console.log('deleted_locations',deleted_locations)
  var form = {}
  form.model = 'grievance'

  const dta = convertStringArraysToProperArrays(parsedData.value)
  console.log('dta', dta)


  form.data = dta
  console.log('formData', form)

  const results = await batchImportGrievances(form)

  console.log('BatchImportUpsert', results.insertedDocuments)




}





const handleCsvUpload = async (file) => {

  if (file.raw) {
    parseCSV(file.raw);
  }
}

const parsedData = ref([])

const parseCSV = async (file) => {
  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: (result) => {
      parsedData.value = result.data;

      console.log('parsedData.value', parsedData.value)
      ImportGrievances()
    },
    error: (error) => {
      console.error('Error parsing CSV:', error);
    },
  });
}

const tableRowClassName = (data) => {
  if (data.row.status == 'Sorting') {
    console.log(data.row.status)
    return 'warning-row'
  }

  if (data.row.status == 'Resolved') {
    return 'resolved-row'
  }

  if (data.row.status == 'Rejected') {
    return 'rejected-row'
  }

  if (data.row.status == 'Investigations') {
    return 'escalated-row'
  }



  if (data.row.status == 'Escalated') {
    return 'escalated-row'
  }

  if (data.row.status == 'Closed') {
    return 'closed-row'
  }



  return ''
}


const getFilteredBySearchData = async (searchKey) => {
  console.log('getFilteredBySearchData')

  console.log('filters', filters);
  console.log('filterValues', filterValues);

  const formData = {}
  formData.limit = pageSize.value
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model

  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchString = searchKey
  //--Single Filter -----------------------------------------

  //formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = filters.value
  formData.filterValues = filterValues.value
  formData.filterFunctions = filterFunction.value

  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = []
  //formData.cache_key = 'SeacrchByKey_' + search_string.value

  //-------------------------
  console.log('SeacrchByKey_', formData)

  const res = await getByKeyword(formData)

  console.log('---->', res.data)

  tableDataList.value = res.data




  total.value = res.total
  loading.value = false


}



 





const searchByName = async (filterString: any) => {
  if (filterString && filterString.trim() !== '') {
    await getFilteredBySearchData(filterString);
  }
};

 


const handleRowDblClick = (row) => {

  console.log('Double clicked row:', row);


  push({
    name: 'GrievanceDetails',
    params: { id: row.id }
  })

}

const grv_name =ref()




const activeSegment = ref('Sorting')








const filteredSegments = computed(() => {
  return Statuses.value.filter(option => !option.hidden);
});

const deletedGrievances =ref([])
const deletedGrievancesCount =ref()

const getGrievanceDeleted = async () => {
  deletedGrievances.value=[] // EMpty the  deletedSettlements.value first
const model = 'grievance_history'

const formData = {}
formData.model = model
//-Search field--------------------------------------------
formData.searchField = 'name'
formData.excludeGeom = false
formData.associated_multiple_models = ['users']

//--Single Filter -----------------------------------------


// - multiple filters -------------------------------------
formData.filters = ['change_type','status' ]
formData.filterValues = [['Delete'],['Open']]

//formData.cache_key = 'SeacrchByKey_' + search_string.value

//-------------------------
console.log("formData", formData)
//console.log(formData)
const res = await getSettlementListByCounty(formData)

console.log('History collected........', res.data)
 // Initialize deleted settlements
 
// Process each element in the response
res.data.forEach((item) => {
  const beforeObject = item.changes?.before; // Extract the "before" object if it exists
  if (beforeObject) {
    // Add the history_id to the beforeObject
    beforeObject.history_id = item.id;
    beforeObject.deleted_by = item.user.name;
    beforeObject.delete_date = item.updatedAt;
    
    
    // Push the updated beforeObject to deletedSettlements
    deletedGrievances.value.push(beforeObject);
  }
});

 
deletedGrievancesCount.value = deletedGrievances.value.length;

console.log(' deletedGrievancesCount.value . ', deletedGrievances.value )
 

}

const onSegmentClick = async () => {
  console.log(activeSegment.value)
  tableDataList.value=[]
  currentPage.value=1 // change paignation page to first every time

  if (activeSegment.value === "Sorting") {

    var selectOption = 'status'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }

    var index = filters.value.indexOf(selectOption) // 1

    // clear previously selected
    if (filterValues.value[index]) {
      // filterValues[index].length = 0
      filterValues.value.splice(index, 1)
    }

    if (!filterValues.value.includes('Sorting')) {
      filterValues.value.splice(index, 0, ['Sorting']) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
    } 


    console.log('filters.value',filters.value)
    console.log('filterValues.value',filterValues.value)

  }

  if (activeSegment.value === "Under Review") {
      var selectOption = 'status'
      if (!filters.value.includes(selectOption)) {
        filters.value.push(selectOption)
      }

      var index = filters.value.indexOf(selectOption) // 1

      // clear previously selected
      if (filterValues.value[index]) {
        // filterValues[index].length = 0
        filterValues.value.splice(index, 1)
      }

      if (!filterValues.value.includes('Under Review')) {
        filterValues.value.splice(index, 0, ['Under Review','Investigation']) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
      }




  }



  if (activeSegment.value === "Resolved") {

    var selectOption = 'status'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }

    var index = filters.value.indexOf(selectOption) // 1

    // clear previously selected
    if (filterValues.value[index]) {
      // filterValues[index].length = 0
      filterValues.value.splice(index, 1)
    }

    if (!filterValues.value.includes('Resolved')) {
      filterValues.value.splice(index, 0, ['Resolved']) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
    }

   }

  if (activeSegment.value === "Escalated") {

    var selectOption = 'status'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }

    var index = filters.value.indexOf(selectOption) // 1

    // clear previously selected
    if (filterValues.value[index]) {
      // filterValues[index].length = 0
      filterValues.value.splice(index, 1)
    }

    if (!filterValues.value.includes('Escalated')) {
      filterValues.value.splice(index, 0, ['Escalated','Returned']) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
    }
   
   }

  if (activeSegment.value === "Closed") {
      var selectOption = 'status'
      if (!filters.value.includes(selectOption)) {
        filters.value.push(selectOption)
      }

      var index = filters.value.indexOf(selectOption) // 1

      // clear previously selected
      if (filterValues.value[index]) {
        // filterValues[index].length = 0
        filterValues.value.splice(index, 1)
      }

      if (!filterValues.value.includes('Closed')) {
        filterValues.value.splice(index, 0, ['Closed']) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
      }

   }

 if (activeSegment.value === "Referred") {
      var selectOption = 'status'
      if (!filters.value.includes(selectOption)) {
        filters.value.push(selectOption)
      }

      var index = filters.value.indexOf(selectOption) // 1

      // clear previously selected
      if (filterValues.value[index]) {
        // filterValues[index].length = 0
        filterValues.value.splice(index, 1)
      }

      if (!filterValues.value.includes('Referred')) {
        filterValues.value.splice(index, 0, ['Referred','ExternalReferral']) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
      }




  }

  
 if (activeSegment.value === "In Court") {
      var selectOption = 'status'
      if (!filters.value.includes(selectOption)) {
        filters.value.push(selectOption)
      }

      var index = filters.value.indexOf(selectOption) // 1

      // clear previously selected
      if (filterValues.value[index]) {
        // filterValues[index].length = 0
        filterValues.value.splice(index, 1)
      }

      if (!filterValues.value.includes('In Court')) {
        filterValues.value.splice(index, 0, ['In Court']) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
      }

  }



  if (activeSegment.value === "Rejected") {
      var selectOption = 'status'
      if (!filters.value.includes(selectOption)) {
        filters.value.push(selectOption)
      }

      var index = filters.value.indexOf(selectOption) // 1

      // clear previously selected
      if (filterValues.value[index]) {
        // filterValues[index].length = 0
        filterValues.value.splice(index, 1)
      }

      if (!filterValues.value.includes('Rejected')) {
        filterValues.value.splice(index, 0, ['Rejected']) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
      }

  }


  
  if (activeSegment.value === "Deleted") {
    
    console.log("Deleted settlements.....")
 
   await getGrievanceDeleted()

  }
    // if (roles_filters.length > 0) {
    //     filters.value.push(roles_filters[0].field);  // Add the field to filters if roles_filters is not empty
    //   }

    //   // Prepare filterValues array
    //   if (roles_filters.length > 0) {
    //     filterValues.value.push([roles_filters[0].value]);  // Add the value to filterValues if roles_filters is not empty
    //   }

    // Prepare filters and filterValues arrays dynamically
      roles_filters.forEach((role_filter) => {
        const index = filters.value.indexOf(role_filter.field); // Check if the field already exists in filters

        if (index === -1) {
          // If the field is not in filters, add it
          filters.value.push(role_filter.field);
          filterValues.value.push([role_filter.value]); // Create a new array with the value
        } else {
          // If the field already exists, append the value to the corresponding filterValues entry
          if (!filterValues.value[index].includes(role_filter.value)) {
            filterValues.value[index].push(role_filter.value);
          }
        }
      });

      loading.value=true

console.log('filters.value', filters.value)
  console.log('filterValues.value', filterValues.value)

  getFilteredData(filters.value, filterValues.value)
}




const wardOptions = ref([])
const selectedSubCounty=ref()
const enableSubcounty=ref(false)
 
const value5=ref()
const value6=ref()
const search_string=ref()



const subcountiesOptions = ref([])

 
const getSubCountyNames = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'subcounty',
      searchField: 'county_id',
      searchKeyword: selectedCounty.value,
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received subcounties response:', response)
    var ret = response.data
    subcountiesOptions.value = []
    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var subcountyOpt = {}
      subcountyOpt.value = arrayItem.id
      subcountyOpt.county_id = arrayItem.county_id
      subcountyOpt.label = arrayItem.name
      //  console.log(countyOpt)
      subcountiesOptions.value.push(subcountyOpt)
    })
    console.log('got subcountes')
  })
}

 
const getWardNames = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'ward',
      searchField: 'subcounty_id',
      searchKeyword: selectedSubCounty.value,
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received wards response:', response)
    var ret = response.data
    wardOptions.value = []
    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var opt = {}
      opt.value = arrayItem.id
      opt.subcounty_id = arrayItem.subcounty_id
      opt.label = arrayItem.name
      //  console.log(countyOpt)
      wardOptions.value.push(opt)
    })
  })
}

const filterByCounty = async (county_id: any) => {

if (county_id) {
  enableSubcounty.value = true   // allow selection of subcounty 
  selectedCounty.value = county_id
  getSubCountyNames()
}

value5.value = null // clear the subcounty 
value6.value = null   // clear the ward sr

if (selectedCounty.value) {
  const selectOption = 'county_id';

  // Ensure the filter key exists
  if (!filters.value.includes(selectOption)) {
    filters.value.push(selectOption);
      filterFunction.value.push('in')

  }

  const index = filters.value.indexOf(selectOption);

  // Clear previously selected county filter values
  filterValues.value[index] = [];

  // Insert new county filter value if it's not empty
  if (selectedCounty.value.length > 0) {
    filterValues.value[index] = [...selectedCounty.value];
  }

  // Remove filter key if no values are selected
  if (selectedCounty.value.length === 0) {
    filters.value.splice(index, 1);
    filterValues.value.splice(index, 1);
  }
}


console.log(filters.value)

if (search_string.value) {
  getFilteredBySearchData(search_string.value)
} else {
 // getNewOrRejectedSettlements(activeSegment.value)


  getFilteredData(filters.value, filterValues.value)

}


}


const filterBySubCounty = async (subcounty_id: any) => {

value6.value = null   // clear the ward sr


if (subcounty_id) {
  selectedSubCounty.value = subcounty_id
  getWardNames()
}


if (selectedSubCounty.value ) {
  const selectOption = 'subcounty_id';

  // Ensure the filter key exists
  if (!filters.value.includes(selectOption)) {
    filters.value.push(selectOption);
      filterFunction.value.push('in')

  }

  const index = filters.value.indexOf(selectOption);

  // Clear previously selected county filter values
  filterValues.value[index] = [];

  // Insert new county filter value if it's not empty
  if (selectedSubCounty.value.length  > 0) {
    filterValues.value[index] = [...selectedSubCounty.value];
  }

  // Remove filter key if no values are selected
  if (selectedSubCounty.value.length === 0) {
    filters.value.splice(index, 1);
    filterValues.value.splice(index, 1);
  }
}



if (search_string.value) {
  getFilteredBySearchData(search_string.value)
} else {
  getFilteredData(filters.value, filterValues.value)
}
}


 



const selectedWard=ref()
 



const filterByWard = async (ward_id: any) => {

value6.value = null   // clear the ward sr


if (ward_id) {
  selectedWard.value = ward_id
 
}


if (selectedWard.value ) {
  const selectOption = 'ward_id';

  // Ensure the filter key exists
  if (!filters.value.includes(selectOption)) {
    filters.value.push(selectOption);
      filterFunction.value.push('in')

  }

  const index = filters.value.indexOf(selectOption);

  // Clear previously selected county filter values
  filterValues.value[index] = [];

  // Insert new county filter value if it's not empty
  if (selectedWard.value.length  > 0) {
    filterValues.value[index] = [...selectedWard.value];
  }

  // Remove filter key if no values are selected
  if (selectedWard.value.length === 0) {
    filters.value.splice(index, 1);
    filterValues.value.splice(index, 1);
  }
}



if (search_string.value) {
  getFilteredBySearchData(search_string.value)
} else {
  getFilteredData(filters.value, filterValues.value)
}
}

const getDaysToExpiry = (expiryDate) => {
  if (!expiryDate) return "N/A";  // Handle missing dates
  const expiry = new Date(expiryDate);
  const today = new Date();
  const diffTime = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
//  console.log('expiry',expiry, 'today',today,'diffTime',diffTime )
  return diffTime > 0 ? `${diffTime} days` : "Expired";
};

const getExpiryClass = (expiryDate) => {
  if (!expiryDate) return "";
  const diff = getDaysToExpiry(expiryDate);
  return diff === "Expired" ? "text-red-500" : "text-green-500"; // Apply color styling
};



const formatDate2 = (row, column, dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}



const RevertEdits = async (data: TableSlotDefault) => {
  console.log('Reverts.....', data)

  const formData = {
    model: 'grievance',
    history_id: data.history_id,
  };

  const res = await revertGrievanceHistory(formData);
  console.log('Reverts success.....', res)
  await getGrievanceDeleted()


};


const thisHistory =ref()

const getThisHistory = async (history_id) => {
  try {
    const model = 'grievance_history';

    const formData = {
      model, 
      searchField: 'name', 
      excludeGeom: false,
      associated_multiple_models: ['users'],
      filters: [ 'id'],
      filterValues: [ [history_id]]
    };

    console.log("formData", formData);

    // Fetch the history data
    const res = await getSettlementListByCounty(formData);

    // Check if the response is valid and contains data
    if (res && res.data) {
      console.log('History collected........', res.data);
     
      thisHistory.value = res.data
    } else {
      console.warn("No data found in response.");
      thisHistory.value = []; // Return an empty array if no data is found
    }
  } catch (error) {
    console.error("Error fetching history:", error.message);
    throw new Error("Failed to fetch history. Please try again later."); // Rethrow the error for higher-level handling
  }
};


const ShowReviewDialog=ref(false)
const DeletedGrievance=ref()

const transformGrievanceData = () => {
  if (!DeletedGrievance.value || Object.keys(DeletedGrievance.value).length === 0) return [];

  return Object.keys(DeletedGrievance.value)
    .filter(key => DeletedGrievance.value[key] !== null && DeletedGrievance.value[key] !== '') // Exclude null or empty values
    .map(key => ({
      label: formatSentence(key),
      value: formatSentence(DeletedGrievance.value[key])
    }));
};

const grievanceData=ref()
const DeleteReview = async (data: TableSlotDefault) => {
  console.log('Review .....', data);
  ShowReviewDialog.value = true;

  // Get user who deleted 
  await getThisHistory(data.history_id);

  console.log('thisHistory', thisHistory.value);
  DeletedGrievance.value = data;

  // Transform grievance data
  grievanceData.value = transformGrievanceData();

  console.log('grievanceData.value', grievanceData.value)
  formHeader.value = "Review Deleted Grievance";

  reviewDialog.value=true
};



function formatSentence(text) {

// Replace underscores with spaces
let formattedText = String(text).replace(/_/g, ' ');

// Capitalize the first letter
formattedText = formattedText.charAt(0).toUpperCase() + formattedText.slice(1);

// Ensure proper punctuation and spacing
// This is a basic example; you might need more complex rules based on requirements
formattedText = formattedText.replace(/(\.\s*)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());

return formattedText;
}

 const reviewDialog=ref(false)



 const selectedRows = ref([])

function handleSelectionChange(selection) {
  selectedRows.value = selection
}

const showReferralDialog =ref(false)
async function handleBulkAction() {
  console.log('Bulk Action on:', selectedRows.value)

 // Extract unique county IDs from selected rows
 const countyIds = [...new Set(selectedRows.value.map(row => row.county?.id))];
  console.log('Extracted county IDs:', countyIds);

  showReferralDialog.value = true;
  await getGRMUsers(countyIds);
}

const form = ref({
  grievance_id: null,
  reffered_to_officer: null,
 
});


const formOfficer = reactive({
  optionName: '',
  optionPhone: ''
});



const officerLabel=ref()
const handleOfficerChange = (value) => {
    const selected = grmUsers.value.find(opt => opt.value === value);
    officerLabel.value = selected ? selected.label : '';
  };


  const validateKenyaPhone = (rule, value, callback) => {
        const cleaned = value.replace(/\s+/g, '');
        const pattern = /^(?:\+254|254|0)?(7\d{8}|1\d{8})$/;
        if (!value) {
          callback(new Error("Phone is required"));
        } else if (!pattern.test(cleaned)) {
          callback(new Error("Invalid Kenyan phone number"));
        } else {
          callback();
        }
      };

const OfficerRules = computed(() => ({
  optionName: [
    { required: true, message: "Name is required", trigger: "blur" }
  ],
  optionPhone: [
    { required: true, validator: validateKenyaPhone, trigger: "blur" }
  ]
}));


function convertPhoneNumberX(phoneNumber: string | undefined) {

// console.log(phoneNumber)
let trimmedPhoneNumber = phoneNumber.replace(/\s+/g, '').trim();
console.log(trimmedPhoneNumber.startsWith('0'))


if (trimmedPhoneNumber.startsWith('0')) {
  trimmedPhoneNumber = '254' + trimmedPhoneNumber.slice(1);
}

console.log(trimmedPhoneNumber)
// return trimmedPhoneNumber;
formOfficer.optionPhone = trimmedPhoneNumber

}


 


const isAdding = ref(false)

const onAddOption = () => {
  isAdding.value = true
}

const formRef = ref(null);

const onConfirm = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      console.log('Submit to create account');

      const formData = {
        username: formOfficer.optionPhone,
        name: formOfficer.optionName,
        phone: formOfficer.optionPhone,
        password: "User@2025",
        role: ["grm"],
        isactive:true,
        location_level: "national",
        location_id: formOfficer.optionPhone,
        location_field: "national"
      };

      signupGRM(formData).then((response) => {
        console.log(response);
        grmUsers.value.push({
          label: `${formOfficer.optionName} (${formOfficer.optionPhone})`,
          value: response.user.id,
        });
        // clear();
      });
    } else {
      console.log("Form validation failed");
    }
  });
};




const clear = () => {
  showReferralDialog.value=false

}

const ReferralRef = ref<FormInstance>()



const isRowSelectable = () => {
  return isCountyOrNational.value;
};


 
const submitResolutionForm = async () => {
  const formInstance = ReferralRef;

  formInstance.value.validate(async (valid: boolean) => {
    if (!valid) {
      ElMessage({
        message: 'Please provide all required details',
        type: 'error'
      });
      return;
    }

    let grievances = selectedRows.value;

    // Normalize to array if a single object
    if (!Array.isArray(grievances)) {
      grievances = [grievances];
    }

    if (grievances.length === 0) {
      ElMessage({
        message: 'No grievance selected',
        type: 'warning'
      });
      return;
    }

    const officerNote = form.value.action;
    const officerLabelText = officerLabel.value;

    const bulkPayload = grievances.map(grievance => ({
      code: grievance.code,
      new_status: 'Referred',
      recipient: grievance.phone,
      grievance_id: grievance.id,
      action: `Referred to ${officerLabelText} : ${officerNote}`,
      current_status_date: new Date(),
      status_expiry_date: new Date(Date.now() + getStageDuration('Referred')),
      action_by: userInfo.id,
      action_level: current_user_roles[0] || 'settlement',
      reffered_to_officer: form.value.reffered_to_officer || null,
      date_actioned:  new Date(Date.now()),
      current_level: grievance.current_level,
      prev_status: grievance.status,
      action_type:  'Referred'
    }));

    console.log('Bulk Submission Payload:', bulkPayload);

    try {
      const res = await logGrievanceActionBulk({ logs: bulkPayload });
      const updated = await updateBulkGrievance({ updates: bulkPayload });
      console.log(updated);

      ElMessage({
        message: res.message || 'Grievances updated successfully',
        type: 'success'
      });

      showReferralDialog.value = false;
    } catch (err) {
      ElMessage({
        message: 'Error occurred while submitting referrals.',
        type: 'error'
      });
      console.error(err);
    }
  });
};


 

const grievanceOptions = [
  { label: 'Land Ownership or Title Disputes', value: 'land_ownership' },
  { label: 'Evictions or Displacement', value: 'evictions' },
  { label: 'Compensation or Resettlement Issues', value: 'compensation' },
  { label: 'Poor Road or Pathway Conditions', value: 'poor_roads' },
  { label: 'Infrastructure related ', value: 'infrastructure' },
  { label: 'Drainage and Flooding Problems', value: 'drainage_flooding' },
  { label: 'Water Access and Supply Issues', value: 'water_supply' },
  { label: 'Sanitation and Hygiene Concerns', value: 'sanitation' },
  { label: 'Electricity or Street Lighting Issues', value: 'electricity_lighting' },
  { label: 'Waste Collection and Management', value: 'waste_management' },
  { label: 'Environmental Degradation ', value: 'environmental_issues' },
  { label: 'Health and Safety Hazards', value: 'health_safety' },
  { label: 'Corruption, Mismanagement, or Bribery', value: 'corruption' },
  { label: 'Discrimination, Exclusion or Favoritism', value: 'discrimination' },
  { label: 'Gender-Based Violence or Harassment', value: 'gbv' },
  { label: 'Labour Issues (e.g. unpaid wages, poor conditions)', value: 'labour_issues' },
  { label: 'Lack of Information or Consultation', value: 'information_gap' },
  { label: 'Project Implementation Delays or Inactivity', value: 'delays' },
  { label: 'Other', value: 'other' }
];




const selectedCategories =ref([])
const filterByCategory = async (categories: any) => {

//value6.value = null   // clear the ward sr


if (categories) {
  selectedCategories.value = categories
 
}


if (selectedCategories.value ) {
  const selectOption = 'nature';

  // Ensure the filter key exists
  if (!filters.value.includes(selectOption)) {
    filters.value.push(selectOption);
      filterFunction.value.push('in')

  }

  const index = filters.value.indexOf(selectOption);

  // Clear previously selected county filter values
  filterValues.value[index] = [];

  // Insert new county filter value if it's not empty
  if (selectedCategories.value.length  > 0) {
    filterValues.value[index] = [...selectedCategories.value];
  }

  // Remove filter key if no values are selected
  if (selectedCategories.value.length === 0) {
    filters.value.splice(index, 1);
    filterValues.value.splice(index, 1);
  }
}



if (search_string.value) {
  getFilteredBySearchData(search_string.value)
} else {
  getFilteredData(filters.value, filterValues.value)
}
}


</script>

<template>
  <el-card>
    <el-row
  type="flex"
  justify="start"
  :gutter="10"
  style="flex-wrap: wrap; align-items: center; margin-bottom: 10px"
>
  <!-- Back Button -->
  <el-col :xs="24" :sm="4" :md="4" :lg="3">
    <el-button type="primary" plain :icon="Back" @click="goBack" style="width: 100%;">
      Back
    </el-button>
  </el-col>

  <!-- Category -->
<el-col :xs="24" :sm="24" :md="24" :lg="6">
    <el-select
      size="default"
      v-model="selectedCategories"
      :onChange="filterByCategory"
      multiple
      clearable
      filterable
      collapse-tags
   
      placeholder="Filter By Category"
      style="width: 100%;"
    >
      <el-option
        v-for="item in grievanceOptions"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>
  </el-col>

  <!-- County -->
  <el-col  v-if="isNationalStaff" :xs="24" :sm="12" :md="6" :lg="3">
    <el-select
      size="default"
      v-model="selectedCounty"
      :onChange="filterByCounty"
      :onClear="handleClear"
      multiple
      clearable
      filterable
      collapse-tags
      placeholder="Filter By County"
      style="width: 100%;"
    >
      <el-option
        v-for="item in countiesOptions"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>
  </el-col>

  <!-- Subcounty -->
  <el-col :xs="24" :sm="12" :md="6" :lg="3">
    <el-select
      :disabled="!enableSubcounty"
      size="default"
      v-model="selectedSubCounty"
      :onChange="filterBySubCounty"
      multiple
      clearable
      filterable
      collapse-tags
      placeholder="Filter By Subcounty"
      style="width: 100%;"
    >
      <el-option
        v-for="item in subcountiesOptions"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>
  </el-col>

  <!-- Ward -->
  <el-col :xs="24" :sm="24" :md="24" :lg="3">
    <el-select
      :disabled="!enableSubcounty"
      size="default"
      v-model="selectedWard"
      :onChange="filterByWard"
      multiple
      clearable
      filterable
      collapse-tags
      placeholder="Filter By Ward"
      style="width: 100%;"
    >
      <el-option
        v-for="item in wardOptions"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>
  </el-col>




  <!-- Action Buttons -->
  <el-col :xs="24" :sm="24" :md="12" :lg="4">
    <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-start;">
      <el-tooltip v-if="isNationalStaff || isSuperAdmin" content="Import Data" placement="top">
        <el-button @click="uploadData" type="primary" :icon="UploadFilled" />
      </el-tooltip>
      <el-tooltip content="Add Grievance" placement="top">
        <el-button :onClick="AddComponent" type="primary" :icon="Plus" />
      </el-tooltip>
      <DownloadCustom
        v-if="showEditButtons"
        :data="tableDataList"
        :model="model"
        :associated_models="associated_multiple_models"
      />
    </div>
  </el-col>
</el-row>




    <div class="custom-style">

      <el-segmented v-model="activeSegment" :options="filteredSegments" block :onChange="onSegmentClick">
        <template #default="{ item }">
          <div class="flex flex-col items-center gap-2 p-2">
            <el-icon size="18" :class="item.label === 'Deleted' ? 'text-red-600' : ''">
              <component :is="item.icon" />
            </el-icon>
            <div>{{ item.label }} ({{ item.count }})</div>
          </div>
        </template>
      </el-segmented>


    </div>


  <!-- Search Grievance -->
  <el-col :xs="24" :sm="24" :md="24" :lg="24"  >
    <el-select
      v-model="grv_name"
      multiple
      clearable
      filterable
      remote
      :remote-method="searchByName"
      reserve-keyword
      placeholder="Search Grievance by code, description of name of complainant"
      style="width: 100%; margin-top:10px;"
    />
  </el-col>

    <div v-if="activeSegment === 'Sorting'">

      <el-table
row-key="id" v-loading="loading" :data="tableDataList" :loading="loading"
        @selection-change="handleSelectionChange" style="width: 100% ; margin-top: 10px; " show-overflow-tooltip
        :max-height="pageHeight" @row-click="handleRowDblClick" border :row-class-name="tableRowClassName">
         <el-table-column
v-if="isRowSelectable"
            type="selection"
            width="55"
            :selectable="isRowSelectable"
          />
        <el-table-column label="#" width="80" prop="id" sortable>
          <template #default="scope">
            <div v-if="scope.row.grievance_documents.length > 0" style="display: inline-flex; align-items: center;">
              <span>{{ scope.row.id }}</span>
              <Icon icon="material-symbols:attachment" style="margin-left: 4px;" />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Code" prop="code" sortable width="100"  />

        <el-table-column label="Category" prop="nature" sortable width="150" />
        <el-table-column label="Description" prop="description" sortable  width="350"/>
        <el-table-column label="Location" sortable width="350">
          <template #default="scope">
            <span>{{ scope.row.settlement.name }}, {{ scope.row.county.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="date" label="Date Reported" sortable width="100">
          <!-- Use a scoped slot to customize the rendering of the date column -->
          <template #default="scope">
            <span>{{ formatDate(scope.row.date_reported) }}</span>
          </template>
        </el-table-column>
  

        <!-- <el-table-column label="Level" prop="current_level" sortable width="150" /> -->
        <el-table-column label="Complainant" prop="name" sortable width="150" />
        <el-table-column label="Reported By" width="150">
          <template #default="scope">
            <span v-if="scope.row.self_reported === true">Self</span>
            <span v-else>{{ scope.row.reporter_name }}</span>
          </template>
        </el-table-column>
   
        <el-table-column label="Days to Stage Expiry" width="200">
          <template #default="scope">
            <span :class="getExpiryClass(scope.row.status_expiry_date)" style="margin-right: 5px;">
              {{ getDaysToExpiry(scope.row.status_expiry_date) }}
            </span>
          </template>
        </el-table-column>

      </el-table>
      <div v-if="selectedRows.length > 0" style="margin-top: 10px;">
        <el-button type="primary" plain @click="handleBulkAction">Refer Selected {{ selectedRows.length }} Grievances
        </el-button>
      </div>
      <ElPagination
:layout="paginationLayout" v-model:currentPage="currentPage" :pager-count="pagerCount"
        v-model:page-size="pageSize" :page-sizes="[5, 8, 10, 20, 50, 200, 10000]" :total="total" :background="true"
        @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
    </div>

 

    <div v-if="activeSegment === 'Under Review'">
      <el-table
v-loading="loading" :data="tableDataList" :loading="loading" style="width: 100% ; margin-top: 10px; "
        show-overflow-tooltip :max-height="pageHeight" @row-click="handleRowDblClick" border
        :row-class-name="tableRowClassName">
        <el-table-column label="#" width="80" prop="id" sortable>
          <template #default="scope">
            <div v-if="scope.row.grievance_documents.length > 0" style="display: inline-flex; align-items: center;">
              <span>{{ scope.row.id }}</span>
              <Icon icon="material-symbols:attachment" style="margin-left: 4px;" />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Code" prop="code" sortable width="150" />

        <el-table-column label="Category" prop="nature" sortable width="150" />

        <el-table-column prop="date" label="Date Reported" sortable width="150">
          <!-- Use a scoped slot to customize the rendering of the date column -->
          <template #default="scope">
            <span>{{ formatDate(scope.row.date_reported) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="Status" width="100" sortable>
          <template #default="scope">
            <el-tag
:type="scope.row.status == 'Closed' ? 'info'
                            : scope.row.status == 'Escalated' ? 'secondary'
                            : scope.row.status == 'Returned' ? 'danger'
                            : scope.row.status == 'Referred' ? 'warning'
                            : scope.row.status == 'Sorting' ? 'warning'
                                : scope.row.status == 'Rejected' ? 'danger'
                                  : 'success'" disable-transitions>{{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Days to Stage Expiry" width="200">
          <template #default="scope">
            <span :class="getExpiryClass(scope.row.status_expiry_date)" style="margin-right: 5px;">
              {{ getDaysToExpiry(scope.row.status_expiry_date) }}
            </span>

          </template>
        </el-table-column>
        <el-table-column label="Level" prop="current_level" sortable width="150" />
        <el-table-column label="Complainant" prop="name" sortable width="150" />
        <el-table-column label="Reported By" width="150">
          <template #default="scope">
            <span v-if="scope.row.self_reported === true">Self</span>
            <span v-else>{{ scope.row.reporter_name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Description" prop="description" sortable />
        <el-table-column label="Location" sortable width="350">
          <template #default="scope">
            <span>{{ scope.row.settlement.name }}, {{ scope.row.county.name }}</span>
          </template>
        </el-table-column>

      </el-table>
      <ElPagination
:layout="paginationLayout" v-model:currentPage="currentPage" :pager-count="pagerCount"
        v-model:page-size="pageSize" :page-sizes="[5,8, 10, 20, 50, 200, 10000]" :total="total" :background="true"
        @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
    </div>

    <div v-if="activeSegment === 'Closed'">
      <el-table
v-loading="loading" :data="tableDataList" :loading="loading" style="width: 100% ; margin-top: 10px;"
        show-overflow-tooltip :max-height="pageHeight" @row-click="handleRowDblClick" border
        :row-class-name="tableRowClassName">
        <el-table-column label="#" width="80" prop="id" sortable>
          <template #default="scope">
            <div v-if="scope.row.grievance_documents.length > 0" style="display: inline-flex; align-items: center;">
              <span>{{ scope.row.id }}</span>
              <Icon icon="material-symbols:attachment" style="margin-left: 4px;" />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Code" prop="code" sortable width="150" />

        <el-table-column label="Category" prop="nature" sortable width="150" />

        <el-table-column prop="date" label="Date Reported" sortable width="150">
          <!-- Use a scoped slot to customize the rendering of the date column -->
          <template #default="scope">
            <span>{{ formatDate(scope.row.date_reported) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="Status" width="100" sortable>
          <template #default="scope">
            <el-tag
:type="scope.row.status == 'Closed' ? 'info'
            : scope.row.status == 'Escalated' ? 'secondary'
              : scope.row.status == 'Referred' ? 'warning'
                : scope.row.status == 'Rejected' ? 'danger'
                  : 'success'" disable-transitions>{{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <!-- <el-table-column label="Days to Stage Expiry" width="150">
          <template #default="scope">
            <span :class="getExpiryClass(scope.row.status_expiry_date)">
              {{ getDaysToExpiry(scope.row.status_expiry_date) }}
            </span>
          </template>
        </el-table-column> -->
        <el-table-column label="Level" prop="current_level" sortable width="150" />
        <el-table-column label="Complainant" prop="name" sortable width="150" />
        <el-table-column label="Reported By" width="150">
          <template #default="scope">
            <span v-if="scope.row.self_reported === true">Self</span>
            <span v-else>{{ scope.row.reporter_name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Description" prop="description" sortable width="350" />
        <el-table-column label="Location" sortable width="350">
          <template #default="scope">
            <span>{{ scope.row.settlement.name }}, {{ scope.row.county.name }}</span>
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
v-if="showEditButtons" @click="editIndicator(scope as TableSlotDefault)"
                    :icon="Edit" color="green">Edit</el-dropdown-item>
                  <el-dropdown-item
v-if="showAdminButtons" @click="DeleteIndicator(scope.row as TableSlotDefault)"
                    :icon="Delete" color="red">Delete</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <div v-else>
              <el-button size="small" type="primary" plain :icon="Position" @click="getGrievanceDetails(scope)">
                More
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <ElPagination
:layout="paginationLayout" v-model:currentPage="currentPage" :pager-count="pagerCount"
        v-model:page-size="pageSize" :page-sizes="[5,8, 10, 20, 50, 200, 10000]" :total="total" :background="true"
        @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
    </div>

    <div v-if="activeSegment === 'Resolved'">
      <el-table
v-loading="loading" :data="tableDataList" :loading="loading" style="width: 100% ; margin-top: 10px;"
        show-overflow-tooltip :max-height="pageHeight" @row-click="handleRowDblClick" border
        :row-class-name="tableRowClassName">
        <el-table-column label="#" width="80" prop="id" sortable>
          <template #default="scope">
            <div v-if="scope.row.grievance_documents.length > 0" style="display: inline-flex; align-items: center;">
              <span>{{ scope.row.id }}</span>
              <Icon icon="material-symbols:attachment" style="margin-left: 4px;" />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Code" prop="code" sortable width="150" />

        <el-table-column label="Category" prop="nature" sortable width="150" />

        <el-table-column prop="date" label="Date Reported" sortable width="150">
          <!-- Use a scoped slot to customize the rendering of the date column -->
          <template #default="scope">
            <span>{{ formatDate(scope.row.date_reported) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="Status" width="100" sortable>
          <template #default="scope">
            <el-tag
:type="scope.row.status == 'Closed' ? 'info'
            : scope.row.status == 'Escalated' ? 'secondary'
              : scope.row.status == 'Referred' ? 'warning'
                : scope.row.status == 'Rejected' ? 'danger'
                  : 'success'" disable-transitions>{{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Days to Stage Expiry" width="150">
          <template #default="scope">
            <span :class="getExpiryClass(scope.row.status_expiry_date)">
              {{ getDaysToExpiry(scope.row.status_expiry_date) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Level" prop="current_level" sortable width="150" />
        <el-table-column label="Complainant" prop="name" sortable width="150" />
        <el-table-column label="Reported By" width="150">
          <template #default="scope">
            <span v-if="scope.row.self_reported === true">Self</span>
            <span v-else>{{ scope.row.reporter_name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Description" prop="description" sortable width="350" />
        <el-table-column label="Location" sortable width="350">
          <template #default="scope">
            <span>{{ scope.row.settlement.name }}, {{ scope.row.county.name }}</span>
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
v-if="showEditButtons" @click="editIndicator(scope as TableSlotDefault)"
                    :icon="Edit" color="green">Edit</el-dropdown-item>
                  <el-dropdown-item
v-if="showAdminButtons" @click="DeleteIndicator(scope.row as TableSlotDefault)"
                    :icon="Delete" color="red">Delete</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <div v-else>
              <el-button size="small" type="primary" plain :icon="Position" @click="getGrievanceDetails(scope)">
                More
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <ElPagination
:layout="paginationLayout" v-model:currentPage="currentPage" :pager-count="pagerCount"
        v-model:page-size="pageSize" :page-sizes="[5,8, 10, 20, 50, 200, 10000]" :total="total" :background="true"
        @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
    </div>

    <div v-if="activeSegment === 'Escalated'">
      <el-table
v-loading="loading" :data="tableDataList" :loading="loading" style="width: 100% ; margin-top: 10px;"
        show-overflow-tooltip :max-height="pageHeight" @row-click="handleRowDblClick" border
        :row-class-name="tableRowClassName">
        <el-table-column label="#" width="80" prop="id" sortable>
          <template #default="scope">
            <div v-if="scope.row.grievance_documents.length > 0" style="display: inline-flex; align-items: center;">
              <span>{{ scope.row.id }}</span>
              <Icon icon="material-symbols:attachment" style="margin-left: 4px;" />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Code" prop="code" sortable width="150" />

        <el-table-column label="Category" prop="nature" sortable width="150" />

        <el-table-column prop="date" label="Date Reported" sortable width="150">
          <!-- Use a scoped slot to customize the rendering of the date column -->
          <template #default="scope">
            <span>{{ formatDate(scope.row.date_reported) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="Status" width="100" sortable>
          <template #default="scope">
            <el-tag
:type="scope.row.status == 'Closed' ? 'info'
            : scope.row.status == 'Escalated' ? 'secondary'
            : scope.row.status == 'Returned' ? 'danger'
              : scope.row.status == 'Referred' ? 'warning'
                : scope.row.status == 'Rejected' ? 'danger'
                  : 'success'" disable-transitions>{{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Days to Stage Expiry" width="150">
          <template #default="scope">
            <span :class="getExpiryClass(scope.row.status_expiry_date)">
              {{ getDaysToExpiry(scope.row.status_expiry_date) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Level" prop="current_level" sortable width="150" />
        <el-table-column label="Complainant" prop="name" sortable width="150" />
        <el-table-column label="Reported By" width="150">
          <template #default="scope">
            <span v-if="scope.row.self_reported === true">Self</span>
            <span v-else>{{ scope.row.reporter_name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Description" prop="description" sortable width="350" />
        <el-table-column label="Location" sortable width="350">
          <template #default="scope">
            <span>{{ scope.row.settlement.name }}, {{ scope.row.county.name }}</span>
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
v-if="showEditButtons" @click="editIndicator(scope as TableSlotDefault)"
                    :icon="Edit" color="green">Edit</el-dropdown-item>
                  <el-dropdown-item
v-if="showAdminButtons" @click="DeleteIndicator(scope.row as TableSlotDefault)"
                    :icon="Delete" color="red">Delete</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <div v-else>
              <el-button size="small" type="primary" plain :icon="Position" @click="getGrievanceDetails(scope)">
                More
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <ElPagination
:layout="paginationLayout" v-model:currentPage="currentPage" :pager-count="pagerCount"
        v-model:page-size="pageSize" :page-sizes="[5, 8, 10, 20, 50, 200, 10000]" :total="total" :background="true"
        @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
    </div>

    <div v-if="activeSegment === 'In Court'">
      <el-table
v-loading="loading" :data="tableDataList" :loading="loading" style="width: 100% ; margin-top: 10px;"
        show-overflow-tooltip :max-height="pageHeight" @row-click="handleRowDblClick" border
        :row-class-name="tableRowClassName">
        <el-table-column label="#" width="80" prop="id" sortable>
          <template #default="scope">
            <div v-if="scope.row.grievance_documents.length > 0" style="display: inline-flex; align-items: center;">
              <span>{{ scope.row.id }}</span>
              <Icon icon="material-symbols:attachment" style="margin-left: 4px;" />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Code" prop="code" sortable width="150" />

        <el-table-column label="Category" prop="nature" sortable width="150" />

        <el-table-column prop="date" label="Date Reported" sortable width="150">
          <!-- Use a scoped slot to customize the rendering of the date column -->
          <template #default="scope">
            <span>{{ formatDate(scope.row.date_reported) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="Status" width="100" sortable>
          <template #default="scope">
            <el-tag
:type="scope.row.status == 'Closed' ? 'info'
            : scope.row.status == 'Escalated' ? 'secondary'
              : scope.row.status == 'Referred' ? 'warning'
                : scope.row.status == 'Rejected' ? 'danger'
                  : 'success'" disable-transitions>{{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Level" prop="current_level" sortable width="150" />
        <el-table-column label="Complainant" prop="name" sortable width="150" />
        <el-table-column label="Reported By" width="150">
          <template #default="scope">
            <span v-if="scope.row.self_reported === true">Self</span>
            <span v-else>{{ scope.row.reporter_name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Description" prop="description" sortable width="350" />
        <el-table-column label="Location" sortable width="350">
          <template #default="scope">
            <span>{{ scope.row.settlement.name }}, {{ scope.row.county.name }}</span>
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
v-if="showEditButtons" @click="editIndicator(scope as TableSlotDefault)"
                    :icon="Edit" color="green">Edit</el-dropdown-item>
                  <el-dropdown-item
v-if="showAdminButtons" @click="DeleteIndicator(scope.row as TableSlotDefault)"
                    :icon="Delete" color="red">Delete</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <div v-else>
              <el-button size="small" type="primary" plain :icon="Position" @click="getGrievanceDetails(scope)">
                More
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <ElPagination
:layout="paginationLayout" v-model:currentPage="currentPage" :pager-count="pagerCount"
        v-model:page-size="pageSize" :page-sizes="[5, 8, 10, 20, 50, 200, 10000]" :total="total" :background="true"
        @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
    </div>


    <div v-if="activeSegment === 'Referred'">
      <el-table
v-loading="loading" :data="tableDataList" :loading="loading" style="width: 100% ; margin-top: 10px;"
        show-overflow-tooltip :max-height="pageHeight" @row-click="handleRowDblClick" border
        :row-class-name="tableRowClassName">
        <el-table-column label="#" width="80" prop="id" sortable>
          <template #default="scope">
            <div v-if="scope.row.grievance_documents.length > 0" style="display: inline-flex; align-items: center;">
              <span>{{ scope.row.id }}</span>
              <Icon icon="material-symbols:attachment" style="margin-left: 4px;" />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Code" prop="code" sortable width="150" />

        <el-table-column label="Category" prop="nature" sortable width="150" />

        <el-table-column prop="date" label="Date Reported" sortable width="150">
          <!-- Use a scoped slot to customize the rendering of the date column -->
          <template #default="scope">
            <span>{{ formatDate(scope.row.date_reported) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="Status" width="100" sortable>
          <template #default="scope">
            <el-tag
:type="scope.row.status == 'Closed' ? 'info'
            : scope.row.status == 'Escalated' ? 'secondary'
              : scope.row.status == 'Referred' ? 'warning'
                : scope.row.status == 'Rejected' ? 'danger'
                  : 'success'" disable-transitions>{{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Level" prop="current_level" sortable width="150" />
        <el-table-column label="Complainant" prop="name" sortable width="150" />
        <el-table-column label="Reported By" width="150">
          <template #default="scope">
            <span v-if="scope.row.self_reported === true">Self</span>
            <span v-else>{{ scope.row.reporter_name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Description" prop="description" sortable width="350" />
        <el-table-column label="Location" sortable width="350">
          <template #default="scope">
            <span>{{ scope.row.settlement.name }}, {{ scope.row.county.name }}</span>
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
v-if="showEditButtons" @click="editIndicator(scope as TableSlotDefault)"
                    :icon="Edit" color="green">Edit</el-dropdown-item>
                  <el-dropdown-item
v-if="showAdminButtons" @click="DeleteIndicator(scope.row as TableSlotDefault)"
                    :icon="Delete" color="red">Delete</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <div v-else>
              <el-button size="small" type="primary" plain :icon="Position" @click="getGrievanceDetails(scope)">
                More
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <ElPagination
:layout="paginationLayout" v-model:currentPage="currentPage" :pager-count="pagerCount"
        v-model:page-size="pageSize" :page-sizes="[5, 8, 10, 20, 50, 200, 10000]" :total="total" :background="true"
        @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
    </div>

    <div v-if="activeSegment === 'Rejected'">
      <el-table
v-loading="loading" :data="tableDataList" :loading="loading" style="width: 100% ; margin-top: 10px;"
        show-overflow-tooltip :max-height="pageHeight" @row-click="handleRowDblClick" border
        :row-class-name="tableRowClassName">
        <el-table-column label="#" width="80" prop="id" sortable>
          <template #default="scope">
            <div v-if="scope.row.grievance_documents.length > 0" style="display: inline-flex; align-items: center;">
              <span>{{ scope.row.id }}</span>
              <Icon icon="material-symbols:attachment" style="margin-left: 4px;" />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Code" prop="code" sortable width="150" />

        <el-table-column label="Category" prop="nature" sortable width="150" />

        <el-table-column prop="date" label="Date Reported" sortable width="150">
          <!-- Use a scoped slot to customize the rendering of the date column -->
          <template #default="scope">
            <span>{{ formatDate(scope.row.date_reported) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="Status" width="100" sortable>
          <template #default="scope">
            <el-tag
:type="scope.row.status == 'Closed' ? 'info'
            : scope.row.status == 'Escalated' ? 'secondary'
              : scope.row.status == 'Referred' ? 'warning'
                : scope.row.status == 'Rejected' ? 'danger'
                  : 'success'" disable-transitions>{{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Level" prop="current_level" sortable width="150" />
        <el-table-column label="Complainant" prop="name" sortable width="150" />
        <el-table-column label="Reported By" width="150">
          <template #default="scope">
            <span v-if="scope.row.self_reported === true">Self</span>
            <span v-else>{{ scope.row.reporter_name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Description" prop="description" sortable width="350" />
        <el-table-column label="Location" sortable width="350">
          <template #default="scope">
            <span>{{ scope.row.settlement.name }}, {{ scope.row.county.name }}</span>
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
v-if="showEditButtons" @click="editIndicator(scope as TableSlotDefault)"
                    :icon="Edit" color="green">Edit</el-dropdown-item>
                  <el-dropdown-item
v-if="showAdminButtons" @click="DeleteIndicator(scope.row as TableSlotDefault)"
                    :icon="Delete" color="red">Delete</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <div v-else>
              <el-button size="small" type="primary" plain :icon="Position" @click="getGrievanceDetails(scope)">
                More
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <ElPagination
:layout="paginationLayout" v-model:currentPage="currentPage" :pager-count="pagerCount"
        v-model:page-size="pageSize" :page-sizes="[5, 8, 10, 20, 50, 200, 10000]" :total="total" :background="true"
        @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
    </div>

    <div v-if="activeSegment === 'Deleted'">
      <el-table :data="deletedGrievances" :show-overflow-tooltip="true" style="width: 100% ; margin-top: 10px;" border>
        <el-table-column type="index" width="50" />
        <el-table-column label="code" width="200" prop="code" sortable />
        <el-table-column label="Description" prop="description" sortable />
        <el-table-column label="Date Deleted" prop="delete_date" sortable :formatter="formatDate2" />
        <el-table-column label="Deleted By" prop="deleted_by" sortable />

        <el-table-column fixed="right" label="Operations" min-width="120">
          <template #default="{ row }">
            <el-tooltip content="Review" placement="top">
              <el-button type="primary" size="small" :icon="View" @click="DeleteReview(row)" plain />
            </el-tooltip>
            <el-tooltip content="Restore" placement="top">
              <el-button type="warning" size="small" :icon="RefreshLeft" @click="RevertEdits(row)" />
            </el-tooltip>
          </template>
        </el-table-column>

      </el-table>



    </div>






  </el-card>

  <el-dialog title="Select Fields" v-model="showDownloadDialog" width="60%">
    <el-form>
      <el-form-item>
        <el-row :gutter="20"> <!-- Add gutter for spacing between columns -->
          <el-col v-for="(field) in availableFields" :key="field" :span="6">
            <el-checkbox :label="field" v-model="selectedFields">
              {{ field }}
            </el-checkbox>
          </el-col>
        </el-row>
      </el-form-item>
    </el-form>
    <div class="dialog-footer">
      <el-button @click="showDownloadDialog = false">Cancel</el-button>
      <el-button type="primary" @click="downloadCSV">Download CSV</el-button>
    </div>
  </el-dialog>



  <el-dialog v-model="AddDialogVisible" @close="handleCloseDialog" title="File a grievance" width="65%" draggable>

    <el-steps :active="active" finish-status="success">
      <el-step title="Complainant Details" />
      <el-step title="Grievance Details" />
      <el-step title="Review & Submit" />
    </el-steps>

    <el-form
:model="grmForm" class="demo-form-inline" label-position="top" :rules="currentStepRules"
      ref="dynamicFormRef">
      <el-card shadow="hover">
        <el-row v-if="active === 0" :gutter="10">
          <!-- Step 1: Personal Details -->
          <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
            <el-form-item id="btn1" label="Name of Complainant" prop="name">
              <el-input v-model="grmForm.name" placeholder="Enter name" style="width:90%" />
            </el-form-item>

            <el-form-item id="btn2" label="Gender" prop="gender">
              <el-select v-model="grmForm.gender" placeholder="Select" style="width:90%">
                <el-option label="Female" value="female" />
                <el-option label="Male" value="male" />
                <el-option label="Unspecified" value="unspecified" />
              </el-select>
            </el-form-item>

            <el-form-item id="btn3" label="Age" prop="age">
              <el-select v-model="grmForm.age" placeholder="Select" style="width:90%">
                <el-option v-for="item in ageRanges" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>


          </el-col>


          <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
            <el-form-item id="btn4" label="National ID" prop="national_id">
              <el-input v-model="grmForm.national_id" placeholder="Enter ID number" style="width:90%" />
            </el-form-item>

            <el-form-item id="btn5" label="Phone" prop="phone">
              <el-input
v-model="grmForm.phone" placeholder="Enter phone number" style="width:90%"
                :onChange="convertPhoneNumber" />
            </el-form-item>

            <el-form-item id="btn6" label="Email" prop="email">
              <el-input v-model="grmForm.email" placeholder="Enter Email" style="width:90%" />
            </el-form-item>
          </el-col>


        </el-row>



        <el-row v-if="active === 1" :gutter="10">
          <!-- Step 2: Grievance Details -->
          <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
            <el-form-item id="btn10" label="County" prop="county_id">
              <el-select
filterable v-model="grmForm.county_id" placeholder="County" @change="getSettlementByCounty"
                style="width:90%">
                <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>

            <el-form-item id="btn11" label="Settlement" prop="settlement_id">
              <el-select
filterable v-model="grmForm.settlement_id" placeholder="Settlement"
                @change="handleSelectSettlement" style="width:90%">
                <el-option
v-for="item in settlementOptions" :key="item.value" :label="item.label"
                  :value="item.value" />
              </el-select>
            </el-form-item>

            <el-form-item id="btn12" label="Address" prop="address">
              <el-input v-model="grmForm.address" placeholder="Enter address" style="width:90%" />
            </el-form-item>



            <el-checkbox
id="btn13" v-model="grmForm.isgbv" label="Is this complaint related to Gender-Based Violence?"
              size="large" style="margin-bottom:5px" />




          </el-col>
          <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">

            <el-checkbox
id="btn13" v-model="grmForm.isInCourt" label="Is this complaint currently in court?"
              size="large" style="margin-bottom:5px" />




            <el-form-item v-if="!grmForm.isgbv" id="btn14" label="Nature of Complaint" prop="nature">
              <el-select filterable v-model="grmForm.nature" placeholder="Select category" style="width:90%">
                <!-- <el-option label="Land Ownership Disputes" value="land_ownership" />
                <el-option label="Evictions and Displacement" value="evictions" />
                <el-option label="Compensation Concerns" value="compensation" />
                <el-option label="Labour Wage Disputes" value="labour_wages" />
                <el-option label="Unfair Dismissal or Termination" value="unfair_dismissal" />
                <el-option label="Workplace Harassment" value="workplace_harassment" />
                <el-option label="Unsafe Working Conditions" value="unsafe_conditions" />
                <el-option label="Poor Road Conditions" value="poor_roads" />
                <el-option label="Water and Sanitation Issues" value="water_sanitation" />
                <el-option label="Electricity and Power Supply Concerns" value="electricity" />
                <el-option label="Inadequate Public Transport" value="public_transport" />
                <el-option label="Pollution Complaints" value="pollution" />
                <el-option label="Waste Management Issues" value="waste_management" />
                <el-option label="Public Health Hazards" value="public_health" />
                <el-option label="Deforestation or Land Degradation" value="deforestation" />
                <el-option label="Discrimination and Exclusion" value="discrimination" />
                <el-option label="Corruption and Mismanagement" value="corruption" />
                <el-option label="Others" value="others" /> -->
                <el-option
                    v-for="item in grievanceOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
              </el-select>
            </el-form-item>



            <el-form-item id="btn15" label="Complaint Description" prop="description">
              <el-input
v-model="grmForm.description" type="textarea" rows="2" placeholder="Describe your complaint"
                style="width:90%" />
            </el-form-item>

            <el-form-item id="btn16" label="Plea/Request" prop="plea">
              <el-input
v-model="grmForm.plea" type="textarea" rows="2" placeholder="Enter your plea/request"
                style="width:90%" />
            </el-form-item>
          </el-col>


        </el-row>

        <el-row v-if="active === 2" :gutter="10">
          <!-- Step 3: Review & Submit -->
          <el-col :xs="12" :sm="21" :md="12" :lg="12" :xl="12">
            <el-form-item id="btn17" label="Witness Name" prop="witness">
              <el-input v-model="grmForm.witness" placeholder="Enter witness name" style="width:90%" />
            </el-form-item>

            <el-form-item id="btn18" label="Witness Phone" prop="witness_phone">
              <el-input v-model="grmForm.witness_phone" placeholder="Enter witness phone" style="width:90%" />
            </el-form-item>

            <el-form-item id="btn19" label="Witness Statement" prop="witness_statement">
              <el-input
v-model="grmForm.witness_statement" type="textarea" placeholder="Enter witness statement"
                style="width:90%" />
            </el-form-item>
          </el-col>


          <el-col :xs="12" :sm="12" :md="12" :lg="12" :xl="12">

            <el-form-item id="btn17" label="Are you the complainant?" prop="witness">

              <el-switch
disabled v-model="grmForm.self_reported" class="ml-2" inline-prompt
                style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949" active-text="Yes"
                inactive-text="No" />

            </el-form-item>

            <el-form-item v-if="!grmForm.self_reported" id="btn18" label="Your Name" prop="reporter_name">
              <el-input disabled v-model="grmForm.reporter_name" placeholder="Your Name" style="width:90%" />
            </el-form-item>

            <el-form-item v-if="!grmForm.self_reported" id="btn19" label="Your Phone" prop="reporter_phone">
              <el-input
disabled v-model="grmForm.reporter_phone" type="text" placeholder="Your Phone"
                style="width:90%" />
            </el-form-item>



            <el-upload
id="btn20" class="upload-demo"
              action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" multiple :on-preview="handlePreview"
              :on-remove="handleRemove" :before-remove="beforeRemove" :limit="3" v-model:file-list="fileList"
              :auto-upload="false" :on-exceed="handleExceed">
              <el-button type="primary">Upload Supporting Documentation</el-button>
              <template #tip>
                <div class="el-upload__tip">pdf/jpg/png files with a size less than 500KB.</div>
              </template>
            </el-upload>





          </el-col>

        </el-row>
      </el-card>
    </el-form>

    <template #footer>
      <div
class="steps-navigation"
        style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
        <div>
          <el-tooltip content="Help" placement="top">
            <el-button color="#626aef" type="info" @click="showTour" :icon="InfoFilled" plain />
          </el-tooltip>

          <el-button id="btn9" v-if="active > 0" @click="prev" type="primary" :icon="ArrowLeft">Previous </el-button>
        </div>
        <div>
          <el-button id="btn7" v-if="active < 2" type="primary" @click="next">
            Next <el-icon class="el-icon--right">
              <ArrowRight />
            </el-icon>
          </el-button>

          <el-button
id="btn2" v-if="active === 2" type="primary" @click="submitForm"
            style="margin-left: 10px;">Submit</el-button>
          <el-button id="btn8" @click="resetForm" style="margin-left: 10px;">Reset</el-button>
        </div>
      </div>
    </template>
  </el-dialog>

  <el-dialog v-model="uploadDialog" title="Import Document" width="400" @close="uploadDialog = false">
    <span>
      To upload data on projects, use this
      <button @click="DownloadTemplate" class="template-link">template</button>
      , then upload it below.
    </span>


    <el-upload
class="upload-demo" :on-change="handleCsvUpload" drag :auto-upload="false"
      action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15">
      <div class="el-upload__text">
        Drop file here or <em>click to upload</em>
      </div>

    </el-upload>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="uploadDialog = false">Cancel</el-button>
        <el-button type="primary" @click="uploadData">
          Confirm
        </el-button>
      </div>
    </template>
  </el-dialog>





  <el-dialog v-model="reviewDialog" title="Review Deleted Data" width="50%" @close="reviewDialog = false">

    <el-table :data="grievanceData" style="width: 100%" height="300px" max-height="400px">

      <el-table-column prop="label" label="" width="150">
        <template #default="{ row }">
          <span style="font-weight: bold">{{ row.label }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="value" label="" />
    </el-table>


  </el-dialog>



  <el-tour v-model="isTourVisible" :z-index="100000" :on-close="endTour">
    <el-tour-step
v-for="(step, index) in filteredTourSteps" :key="index" :target="step.target" :title="step.title"
      :description="step.content" />
  </el-tour>



  <el-dialog title="Refer Grievance(s)" v-model="showReferralDialog" width="60%" draggable>
    <el-form   v-loading="grmUsersLoading" :model="form" label-width="auto" ref="ReferralRef" :rules="rules">
      <el-form-item
label="Select Officer" label-position="top" prop="reffered_to_officer" >
        <el-select
          v-model="form.reffered_to_officer" clearable filterable placeholder="Select Officer"
          :loading="grmUsersLoading" :disabled="grmUsersLoading" @change="handleOfficerChange" style="width: 100%">
          <el-option v-for="item in grmUsers" :key="item.value" :label="item.label" :value="item.value" />
          <template #footer>
            <el-button v-if="!isAdding" text bg size="small" @click="onAddOption">
              Add Officer
            </el-button>
            <template v-else>
              <el-form :model="formOfficer" label-width="0" :rules="OfficerRules" ref="formRef">
                <el-form-item prop="optionName">
                  <el-input v-model="formOfficer.optionName" class="option-input" placeholder="Name" size="small" />
                </el-form-item>

                <el-form-item prop="optionPhone">
                  <el-input
                 v-model="formOfficer.optionPhone" class="option-input"
                    placeholder="Enter phone number (254.....)" size="small" :onChange="convertPhoneNumberX" />
                </el-form-item>

                <el-form-item>
                  <el-button type="primary" size="small" @click="onConfirm">
                    Confirm
                  </el-button>
                  <el-button size="small" @click="clear">
                    Cancel
                  </el-button>
                </el-form-item>
              </el-form>
            </template>

          </template>
        </el-select>


      </el-form-item>

      <el-form-item label="Describe the Action Taken" label-position="top" prop="action">
        <el-input
type="textarea" :rows="2" placeholder="Provide details of the resolution here"
          v-model="form.action" />
      </el-form-item>

    </el-form>


    <div style="display: flex; justify-content: end; align-items: center; margin-top: 20px;">
      <el-button @click="showReferralDialog = false">Cancel</el-button>
      <el-button type="primary" @click="submitResolutionForm">Submit</el-button>
    </div>
  </el-dialog>













</template>




<style scoped>
.upload-demo {
  width: 300px;
}

.template-link {
  text-decoration: underline;
  color: #409EFF;
  /* Optional: change link color */
}




.mt-4 {
  margin-top: 16px;
}

@media (max-width: 768px) {
  .el-pagination {
    font-size: 12px;
    /* Adjust font size for small screens */
  }

  .el-pagination .el-pagination__sizes {
    display: none;
    /* Hide size selector on small screens */
  }

  .el-pagination .el-pagination__total {
    display: none;
    /* Hide total count on small screens */
  }



}
</style>


<style>
/* Customize the tooltip style */
.el-tooltip__popper {
  max-width: 300px; /* Set max width for the tooltip */
  background-color: #e00909; /* Dark background */
  color: #fff; /* White text */
  font-size: 14px; /* Adjust font size */
  border-radius: 4px; /* Rounded corners */
  padding: 8px 12px; /* Padding inside the tooltip */
}

/* Optional: Style the arrow of the tooltip */
.el-tooltip__popper[x-placement^="top"] .popper__arrow {
  border-top-color: #333;
}
</style>


<style>
 


.el-table .danger-row {
  --el-table-tr-bg-color: var(--el-color-danger-light-9);
  --el-table-tr-text-color: var(--el-color-danger);
  color: var(--el-table-tr-text-color);
}

.el-table .success-row {
  --el-table-tr-text-color: var(--el-color-success);
  color: var(--el-table-tr-text-color);
}

.el-table .warning-row {
  --el-table-tr-bg-color: var(--el-color-warning-light-9);
}

.el-table .rejected-row {
  --el-table-tr-bg-color: var(--el-color-danger-light-9);
  --el-table-tr-text-color: var(--el-color-danger);
  color: var(--el-table-tr-text-color);
}

.el-table .referred-row {
  --el-table-tr-bg-color: var(--el-color-warning-light-9);
  --el-table-tr-text-color: var(--el-color-warning);
  color: var(--el-table-tr-text-color);
}

.el-table .escalated-row {
  --el-table-tr-bg-color: var(--el-color-secondary);
  --el-table-tr-text-color: var(--el-color-secondary);
  color: var(--el-table-tr-text-color);
}

.el-table .resolved-row {
  --el-table-tr-bg-color: var(--el-color-success-light-9);
  --el-table-tr-text-color: var(--el-color-success);
  color: var(--el-table-tr-text-color);
}

.el-table .closed-row {
  --el-table-tr-bg-color: var(--el-color-info-light-9);
  --el-table-tr-text-color: var(--el-color-info);
  color: var(--el-table-tr-text-color);
}

.item {
  margin-top: 10px;
  margin-right: 40px;
}
</style>


<style scoped>
.custom-style .el-segmented {
  --el-border-radius-base: 5px;
}

.segment-label {
  white-space: nowrap;
  /* Prevent text from wrapping */
  overflow: hidden;
  /* Hide overflowing text */
  text-overflow: ellipsis;
  /* Add ellipsis for truncated text */
}

@media (max-width: 600px) {
  .custom-style .el-segmented {
    font-size: 10px;
    /* Adjust font size on mobile */
    padding: 5px;
    /* Adjust padding for smaller screens */
  }

  .segment-label {
    font-size: 12px;
    /* Smaller font size for labels */
    text-align: center;
    /* Center align text */
    padding: 0 5px;
    /* Add some padding for spacing */
    white-space: normal;
    /* Allow wrapping on smaller screens */
    overflow: visible;
    /* Allow the text to flow properly */
  }
}





</style>