<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { getListWithoutGeo} from '@/api/counties'

import { getGrievances,updateBulkGrievance } from '@/api/grievance'
import { watch } from 'vue';

import {
  signupGRM
} from '@/api/register'

import { ElButton, ElSelect, ElCheckbox, ElCol,ElDrawer, ElIcon} from 'element-plus'
import {
  Plus, 
  Back,Postcard,TopRight,Lock,Guide,TakeawayBox,
  CircleCheck, Warning,View,
  Delete, Search, Refresh, Share, Paperclip, Close, Phone, Loading, Filter} from '@element-plus/icons-vue'

import { getSettlementListByCounty } from '@/api/settlements'
import {   getGRMStaffByLocation } from '@/api/users'


import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import {
  ElPagination, ElOption, ElDialog, ElForm, ElTour, ElUpload,
  ElFormItem, ElRow, ElInput, ElStep, ElSteps, ElTable, ElTableColumn, ElCard, ElMessage, ElSwitch,
  ElTag, ElTooltip
} from 'element-plus'
import { useRouter } from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { DeleteRecord } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import type { FormInstance } from 'element-plus'

import writeXlsxFile from 'write-excel-file';
import PermissionWrapper from '@/components/PermissionWrapper.vue';
import type { UploadUserFile } from 'element-plus'

import { getCountyAuth, getSettlementByCountyAuth } from '@/api/register'
import { uploadGrievanceDocuments, generateGrievance, logGrievanceAction,revertGrievanceHistory,logGrievanceActionBulk, batchImportGrievances, getByKeyword } from '@/api/grievance'
import { getModelSpecs } from '@/api/fields'
import exportFromJSON from 'export-from-json'
import Papa from 'papaparse';

import { getSummarybyFieldFromMultipleIncludes, getSummaryGroupByMultipleFields } from '@/api/summary'
import { getUserListApi, getUsersByIds } from '@/api/users'
import DownloadCustom from '@/views/Components/DownloadCustom.vue';

// Type definitions
interface UserType {
  id: string
  name: string
  phone: string
  email: string
  roles: any[]
  [key: string]: any
}

interface GrievanceType {
  id: string
  code: string
  name: string
  description: string
  nature: string
  status: string
  date_reported: string
  status_expiry_date: string
  settlement?: { name: string }
  county?: { name: string }
  grievance_documents?: any[]
  self_reported: boolean
  reporter_name: string
  phone: string
  current_level: string
  reffered_to_officer?: number
  reffered_to_support_staff?: number[]
  users?: { name: string; phone: string; id: number }
  [key: string]: any
}

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)

const countiesOptions = ref<Array<{value: string, label: string}>>([])
const settlementOptions = ref<Array<{value: string, label: string, county_id?: string, subcounty_id?: string, ward_id?: string}>>([])

const isSuperAdmin = ref(userInfo.roles.some(role => role.name === "super_admin"));

console.log("userInfo--->", userInfo)
const selectedCounty=ref()

 
const filters = ref<string[]>([])
const filterValues = ref<any[][]>([])
const filterFunction = ref<string[]>([])

// Type definitions for role filters
interface RoleFilter {
  field: string
  value: any
}

let roles_filters: RoleFilter[] = []

const wardOptions = ref([])
const selectedSubCounty=ref()
const enableSubcounty=ref(false)
 
const value5=ref()
const value6=ref()
const search_string=ref()



const subcountiesOptions = ref([])
const selectedWard=ref()
const selectedCategories =ref([])
const activeSegment = ref('All')





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
    label: 'All Grievances',
    value: 'All',
    icon: Postcard,
    count: 0,
    hidden: false,
    description: 'All grievances regardless of status'
  },
  {
    label: 'Sorting',
    value: 'Sorting',
    icon: Postcard,
    count: 0,
    hidden: false,
    description: 'Grievance has been received on the system but not acted on'
  },

  {
    label: 'Under Review',
    value: 'Under Review',
    icon: View,
    count: 0,
    hidden: false,
    description: 'Grievance is being worked on. The complainant has been informed of the same'
  },


  {
    label: 'Resolved',
    value: 'Resolved',
    icon: CircleCheck,
    count: 0,
    hidden: false,
    description: 'Grievance has been resolved and a corrective action recommended/implemented'
  },

 
  {
    label: 'Escalated',
    value: 'Escalated',
    icon: TopRight,
    count: 0,
    hidden: false,
    description: 'The grievance has been escalated to a higher level for resolution (e.g., SEC → County GRM → NPCT)'
  },
  {
    label: 'Closed',
    value: 'Closed',
    icon: Lock,
    count: 0,
    hidden: false,
    description: 'Grievance has been resolved and the complainant has accepted the resolution'
 

  },
  {
    label: 'Referred',
    value: 'Referred',
    icon: Guide,
    count: 0,
    hidden: false,
    description: 'Reviewed and referred: 1) to a specific officer (CPCT/NPCT), or 2) to an external entity for resolution'
  },

  {
    label: 'In Court',
    value: 'In Court',
    icon: TakeawayBox,
    count: 0,
    hidden: false,
    description: 'The case is in court pending determination'
  },

  {
    label: 'Rejected',
    value: 'Rejected',
    icon: Warning,
    count: 0,
    hidden: false,
    description: 'The grievance is fake or does not qualify (e.g., testing/training data)'
  },
  {
    label: 'Deleted',
    value: 'Deleted',
    icon: Delete,
    count: 0,
    hidden: !isSuperAdmin.value,
    description: 'Grievance has been deleted (mostly training/dummy data)'
  },
])


// Tooltip visibility map for status cards (manual control)
const statusTooltipVisible = ref<Record<string, boolean>>({})

const showStatusTip = (statusValue: string) => {
  statusTooltipVisible.value[statusValue] = true
  window.setTimeout(() => {
    statusTooltipVisible.value[statusValue] = false
  }, 2000)
}





const currentUser = wsCache.get(appStore.getUserInfo)

const grmUsers=ref([])
const grmUsersLoading=ref(false)
const supportingStaffUsers=ref<Record<number, any>>({})
const supportingStaffLoading=ref(false)

const getGRMUsers = async (countyIds: any) => {

  grmUsersLoading.value=true
 
  const formData: any = {}
 
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

  // Also store the users for supporting staff lookup
  res.data.forEach(user => {
    supportingStaffUsers.value[user.id] = user;
  });
 
}
 




const isNationalStaff = ref(false)
const isCountyStaff = ref(false)

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
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return 'Pending';
  }
  
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
const defaultPageSize = 5;
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




 
const getCounts = async () => {
  console.log('Fetching grievance counts...', filterValues.value, filters.value, 'search:', search_string.value);

  try {
    // Build filter parameters
    const filterField: string[] = [];
    const filterValue: any[][] = [];
    const filterOperator: string[] = [];

    // Process current filters (excluding status filter for individual counts)
    for (let i = 0; i < filters.value.length; i++) {
      const field = filters.value[i];
      const value = filterValues.value[i];

      // Skip status filter when getting individual status counts
      if (field === 'status') continue;

      if (field && value !== undefined && value !== null) {
        // Ensure value is an array and not empty
        let arrayValue;
        if (Array.isArray(value)) {
          if (value.length === 0) continue; // Skip empty arrays
          arrayValue = value;
        } else {
          arrayValue = [value];
        }
        
        filterField.push(field);
        filterValue.push(arrayValue);
        filterOperator.push('in');
      }
    }

    // Get counts for each specific status (exclude 'All' here)
    const statusesForCounts = Statuses.value.filter(s => s.value !== 'All');
    const statusCounts = await Promise.all(
      statusesForCounts.map(async (status) => {
        const formData = {
          model: 'grievance',
          summaryField: 'id',
          summaryFunction: 'count',
          filterField: [...filterField, 'status'],
          filterValue: [...filterValue, [status.value]],
          filterOperator: [...filterOperator, 'in']
        };

        // Include search string if active
        if (search_string.value && search_string.value.trim()) {
          formData.searchField = 'name';
          formData.searchString = search_string.value.trim();
        }

        const response = await getSummarybyFieldFromMultipleIncludes(formData);
        return {
          status: status.value,
          count: parseInt(response?.Total?.[0]?.count || '0', 10)
        };
      })
    );

    // Update status counts
    statusCounts.forEach(({ status, count }) => {
      const statusObj = Statuses.value.find(s => s.value === status);
      if (statusObj) {
        statusObj.count = count;
      }
    });

    // Set 'All' as sum of all non-deleted statuses
    const totalExcludingDeleted = statusCounts
      .filter(sc => sc.status !== 'Deleted')
      .reduce((sum, sc) => sum + sc.count, 0);
    const allStatus = Statuses.value.find(s => s.value === 'All');
    if (allStatus) allStatus.count = totalExcludingDeleted;

    console.log('Updated status counts:', statusCounts, 'All:', totalExcludingDeleted);
  } catch (error) {
    console.error('Error fetching status counts:', error);
    // Reset all counts to 0 on error
    Statuses.value.forEach((status) => {
      status.count = 0;
    });
  }
};


 

// Save filters to localStorage
const saveFiltersToLocalStorage = () => {
  console.log('savingn flters')
  localStorage.setItem('grievanceFilters', JSON.stringify({
    filters: filters.value,
    filterValues: filterValues.value,
    filterFunction: filterFunction.value,
    selectedCounty: selectedCounty.value,
    selectedSubCounty: selectedSubCounty.value,
    selectedWard: selectedWard.value,
    selectedCategories: selectedCategories.value,
    activeSegment: activeSegment.value,
  }));
};

// Load filters from localStorage
const loadFiltersFromLocalStorage = async () => {


  const savedFilters = localStorage.getItem('grievanceFilters');

 console.log('loading savedFilters')
  if (savedFilters) {
    try {
      const parsed = JSON.parse(savedFilters);
      console.log(parsed)
      filters.value = parsed.filters || [];
      filterValues.value = parsed.filterValues || [[]];
      filterFunction.value = parsed.filterFunction || ['in'];
      selectedCounty.value = parsed.selectedCounty || null;
      selectedSubCounty.value = parsed.selectedSubCounty || null;
      selectedWard.value = parsed.selectedWard || null;
      selectedCategories.value = parsed.selectedCategories || [];
      activeSegment.value = parsed.activeSegment || 'All';

      console.log('Mounting gettign',selectedCounty.value )


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

        if(selectedCounty.value)  {
            filterByCounty(selectedCounty.value)
        }

      if(selectedSubCounty.value)  {
                filterByCounty(selectedSubCounty.value)
            }


            

        if (search_string.value) {
          await getFilteredBySearchData(search_string.value)
        } else {
        // getNewOrRejectedSettlements(activeSegment.value)

        console.log('Using prelaoded filetrs.....................')
        console.log('selectedCategories filters', filters.value)
            console.log('selectedCategories filterValues', filterValues.value)
   console.log('selectedCategories  filterFunction.value',  filterFunction.value)

          await getFilteredData(filters.value, filterValues.value)

        }



    } catch (error) {
      console.error('Error parsing saved filters from localStorage:', error);
      // Reset to defaults if parsing fails
      filters.value = [];
      filterValues.value = [[]];
      filterFunction.value = ['in'];
      selectedCounty.value = null;
      selectedSubCounty.value = null;
      selectedWard.value = null;
      selectedCategories.value = [];
      activeSegment.value = 'Sorting';
    }
  }
};




onMounted(async () => {

  // Load filters from localStorage


 await getUserRoles()
    await getCounts()
    window.addEventListener('resize', updatePageSize);
   updatePageSize(); // Initial check

    await  loadFiltersFromLocalStorage();



   await getInterventionsAll()
})





 
// Watch for changes in filters and related variables
watch(
  [
   // filters,
   // filterValues,
    //filterFunction,
       selectedCounty,
     selectedSubCounty,
    selectedWard,
    selectedCategories,
      activeSegment,
  ],
  () => {
    saveFiltersToLocalStorage();
  },
  { deep: true } // Ensure deep watching for arrays and objects
);






 



let tableDataList = ref<GrievanceType[]>([])
//// ------------------parameters -----------------------////




 
const associated_Model = ''
const associated_multiple_models = ['county', 'settlement', 'grievance_document', 'users','subcounty','ward']
const model = 'grievance'
//// ------------------parameters -----------------------////

const { t } = useI18n()
const AddDialogVisible = ref(false)
const formHeader = ref('Add Grievance')
const showSubmitBtn = ref(true)
const showEditSaveButton = ref(false)






const handleClear = async () => {
  console.log('cleared....')

  // clear all the filters -------
  filterValues.value = []
  filters.value = []
  filterFunction.value = []
  value1.value = []
  value2.value = []
  value3.value = []
  pageSize.value = 5
  currentPage.value = 1
 
  // Reset filter selections - use null for single selections, empty array for multiple
  selectedCounty.value = null
  selectedSubCounty.value = null
  selectedWard.value = null
  selectedCategories.value = []
  selectedOfficer.value = null
  referredOfficerSearch.value = ''
  search_string.value = ''

  // Clear original table data
  originalTableData.value = []

  localStorage.removeItem('grievanceFilters');

  //----run the get data--------
  await getInterventionsAll()
  
  // Refresh counts after clearing
  await getCounts()
}



const onPageChange = async (selPage: any) => {
  console.log('on change change: selected counties ', selCounties)
  page.value = selPage
  
  // Check if there's an active search and use the appropriate data fetching method
  if (search_string.value && search_string.value.trim()) {
    await getFilteredBySearchData(search_string.value)
  } else {
    await getFilteredData(filters.value, filterValues.value)
  }
}

const onPageSizeChange = async (size: any) => {
  pageSize.value = size
  
  // Check if there's an active search and use the appropriate data fetching method
  if (search_string.value && search_string.value.trim()) {
    await getFilteredBySearchData(search_string.value)
  } else {
    await getFilteredData(filters.value, filterValues.value)
  }
}

const getInterventionsAll = async () => {
  // Don't add any status filter for "All" grievances
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

// Helper function to get supporting staff name by ID
const getSupportingStaffName = (staffId: number): string => {
  const staff = supportingStaffUsers.value[staffId];
  return staff ? staff.name : `Staff ${staffId}`;
}

// Function to fetch supporting staff data
const fetchSupportingStaffData = async () => {
  if (supportingStaffLoading.value) return;
  
  supportingStaffLoading.value = true;
  
  try {
    // Collect all unique supporting staff IDs from the current data
    const staffIds = new Set<number>();
    
    tableDataList.value.forEach(grievance => {
      if (grievance.reffered_to_support_staff && Array.isArray(grievance.reffered_to_support_staff)) {
        grievance.reffered_to_support_staff.forEach(id => {
          if (id && !supportingStaffUsers.value[id]) {
            staffIds.add(id);
          }
        });
      }
    });
    
    // If we have new staff IDs to fetch
    if (staffIds.size > 0) {
      const staffIdsArray = Array.from(staffIds);
      console.log('Fetching supporting staff data for IDs:', staffIdsArray);
      
      // Fetch user details for the supporting staff IDs
      const userResponse = await getUsersByIds(staffIdsArray, ['id', 'name', 'phone', 'email']);
      
      if (userResponse.data) {
        userResponse.data.forEach((user: any) => {
          supportingStaffUsers.value[user.id] = user;
        });
      }
    }
  } catch (error) {
    console.error('Error fetching supporting staff data:', error);
  } finally {
    supportingStaffLoading.value = false;
  }
}

const getFilteredData = async (selFilters: string[], selfilterValues: any[][]) => {

  const formData: any = {}
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

  // Ensure filterFunctions array matches the length of filters and all values are arrays
formData.filterFunctions = [];
for (let i = 0; i < selfilterValues.length; i++) {
  const val = selfilterValues[i];

    // Always ensure filterValues[i] is an array
    if (!Array.isArray(val)) {
      formData.filterValues[i] = [val];
    } else if (val.length === 0) {
      // Handle empty arrays - skip this filter
      continue;
    }
    
    // Always use 'in' operator for array-based filtering
    formData.filterFunctions.push('in');
  }
  
  // Remove any filters that have empty arrays
  const validIndices = [];
  for (let i = 0; i < formData.filterValues.length; i++) {
    if (Array.isArray(formData.filterValues[i]) && formData.filterValues[i].length > 0) {
      validIndices.push(i);
    }
  }
  
  // Rebuild arrays with only valid filters
  formData.filters = validIndices.map(i => formData.filters[i]);
  formData.filterValues = validIndices.map(i => formData.filterValues[i]);
  formData.filterFunctions = validIndices.map(i => formData.filterFunctions[i]);


  //-------------------------
  //console.log(formData)
  const res = await getGrievances(formData)

  console.log('After Querry', res)
  console.log('After Querry - selFilters', selFilters)
  console.log('After Querry - selfilterValues', selfilterValues)



    tableDataList.value = res.data

  availableFields.value = extractFields(tableDataList.value);

  total.value = res.total

  // Fetch supporting staff data if we have referred grievances
  await fetchSupportingStaffData()

  // Update the count for the current active segment
  Statuses.value.forEach(status => {
    if (status.value === activeSegment.value) {
      status.count = res.total; // Update this count dynamically
    }
  });

  // Refresh counts after getting filtered data
  await getCounts()

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

  // Ensure filterFunctions array matches the length of filters and all values are arrays
  formData.filterFunctions = [];
  for (let i = 0; i < formData.filterValues.length; i++) {
    const val = formData.filterValues[i];
    
    // Always ensure filterValues[i] is an array
    if (!Array.isArray(val)) {
      formData.filterValues[i] = [val];
    } else if (val.length === 0) {
      // Handle empty arrays - skip this filter
      continue;
    }
    
    // Always use 'in' operator for array-based filtering
    formData.filterFunctions.push('in');
  }
  
  // Remove any filters that have empty arrays
  const validIndices = [];
  for (let i = 0; i < formData.filterValues.length; i++) {
    if (Array.isArray(formData.filterValues[i]) && formData.filterValues[i].length > 0) {
      validIndices.push(i);
    }
  }
  
  // Rebuild arrays with only valid filters
  formData.filters = validIndices.map(i => formData.filters[i]);
  formData.filterValues = validIndices.map(i => formData.filterValues[i]);
  formData.filterFunctions = validIndices.map(i => formData.filterFunctions[i]);

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

  // Ensure filterFunctions array matches the length of filters and all values are arrays
  formData.filterFunctions = [];
  for (let i = 0; i < formData.filterValues.length; i++) {
    const val = formData.filterValues[i];
    
    // Always ensure filterValues[i] is an array
    if (!Array.isArray(val)) {
      formData.filterValues[i] = [val];
    } else if (val.length === 0) {
      // Handle empty arrays - skip this filter
      continue;
    }
    
    // Always use 'in' operator for array-based filtering
    formData.filterFunctions.push('in');
  }
  
  // Remove any filters that have empty arrays
  const validIndices = [];
  for (let i = 0; i < formData.filterValues.length; i++) {
    if (Array.isArray(formData.filterValues[i]) && formData.filterValues[i].length > 0) {
      validIndices.push(i);
    }
  }
  
  // Rebuild arrays with only valid filters
  formData.filters = validIndices.map(i => formData.filters[i]);
  formData.filterValues = validIndices.map(i => formData.filterValues[i]);
  formData.filterFunctions = validIndices.map(i => formData.filterFunctions[i]);

  //-------------------------
  console.log('SeacrchByKey_', formData)

  const res = await getByKeyword(formData)

  console.log('---->', res.data)

  tableDataList.value = res.data

  total.value = res.total
  
  // Refresh counts after search
  await getCounts()
  
  loading.value = false


}



 





const searchByName = async (filterString: any) => {
  if (filterString && filterString.trim() !== '') {
    await getFilteredBySearchData(filterString);
  }else {

 
    handleClear()
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












const filteredSegments = computed(() => {
  return Statuses.value.filter(option => !option.hidden);
});

// Computed property for total count (unfiltered)
const totalGrievanceCount = computed(() => {
  // Get the "All" count which represents the total unfiltered count
  const allStatus = Statuses.value.find(status => status.value === 'All');
  return allStatus ? allStatus.count : 0;
});

const deletedGrievances =ref([])
const deletedGrievancesCount =ref()



const onSegmentClick = async (statusValue?: string) => {
  if (statusValue) {
    activeSegment.value = statusValue
  }
  console.log(activeSegment.value)
  tableDataList.value=[]
  currentPage.value=1 // change pagination page to first every time
  
  // Clear referred officer search when switching segments
  referredOfficerSearch.value = ''
  
  // Clear original data when switching segments
  originalTableData.value = []

  // Clear existing status filters
  const statusIndex = filters.value.indexOf('status')
  if (statusIndex !== -1) {
    filters.value.splice(statusIndex, 1)
    filterValues.value.splice(statusIndex, 1)
    filterFunction.value.splice(statusIndex, 1)
  }

  if (activeSegment.value === "All") {
    // For "All" grievances, don't add any status filter
    console.log('Showing all grievances')
  } else if (activeSegment.value === "Sorting") {
    var selectOption = 'status'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
      filterFunction.value.push('in')
    }
    var index = filters.value.indexOf(selectOption)
    filterValues.value[index] = ['Sorting']

  } else if (activeSegment.value === "Under Review") {
    var selectOption = 'status'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
      filterFunction.value.push('in')
    }
    var index = filters.value.indexOf(selectOption)
    filterValues.value[index] = ['Under Review', 'Investigation']

  } else if (activeSegment.value === "Resolved") {
    var selectOption = 'status'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
      filterFunction.value.push('in')
    }
    var index = filters.value.indexOf(selectOption)
    filterValues.value[index] = ['Resolved']

  } else if (activeSegment.value === "Escalated") {
    var selectOption = 'status'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
      filterFunction.value.push('in')
    }
    var index = filters.value.indexOf(selectOption)
    filterValues.value[index] = ['Escalated', 'Returned']

  } else if (activeSegment.value === "Closed") {
    var selectOption = 'status'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
      filterFunction.value.push('in')
    }
    var index = filters.value.indexOf(selectOption)
    filterValues.value[index] = ['Closed']

  } else if (activeSegment.value === "Referred") {
    var selectOption = 'status'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
      filterFunction.value.push('in')
    }
    var index = filters.value.indexOf(selectOption)
    filterValues.value[index] = ['Referred', 'ExternalReferral']

  } else if (activeSegment.value === "In Court") {
    var selectOption = 'status'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
      filterFunction.value.push('in')
    }
    var index = filters.value.indexOf(selectOption)
    filterValues.value[index] = ['In Court']

  } else if (activeSegment.value === "Rejected") {
    var selectOption = 'status'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
      filterFunction.value.push('in')
    }
    var index = filters.value.indexOf(selectOption)
    filterValues.value[index] = ['Rejected']

  } else if (activeSegment.value === "Deleted") {
    var selectOption = 'status'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
      filterFunction.value.push('in')
    }
    var index = filters.value.indexOf(selectOption)
    filterValues.value[index] = ['Deleted']
  }

  // Check if there's an active search and use the appropriate data fetching method
  if (search_string.value && search_string.value.trim()) {
    await getFilteredBySearchData(search_string.value)
  } else {
  await getFilteredData(filters.value, filterValues.value)
  }
  
  // Force a fresh count calculation after segment switch to ensure counts are accurate
  // Small delay to ensure filters are fully applied before counting
  await nextTick()
  await getCounts()
}






 
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
    selectedCounty.value = county_id;
    enableSubcounty.value = true; // allow selection of subcounty 
    getSubCountyNames();
  }

  value5.value = null; // clear the subcounty 
  value6.value = null; // clear the ward sr

  const selectOption = 'county_id';
  const index = filters.value.indexOf(selectOption);

  if (selectedCounty.value) {
    // Ensure the filter key exists
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption);
      filterFunction.value.push('in');
    }

    // Update filter values - wrap single value in array for 'in' operator
    const filterIndex = filters.value.indexOf(selectOption);
    filterValues.value[filterIndex] = [selectedCounty.value];
  } else {
    // Remove filter if no county selected
    if (index !== -1) {
      filters.value.splice(index, 1);
      filterFunction.value.splice(index, 1);
      filterValues.value.splice(index, 1);
    }
  }

  if (search_string.value) {
    getFilteredBySearchData(search_string.value);
  } else {
    getFilteredData(filters.value, filterValues.value);
    getCounts();
  }
}


const filterBySubCounty = async (subcounty_id: any) => {
  if (subcounty_id) {
    selectedSubCounty.value = subcounty_id;
    getWardNames();
  }

  value6.value = null; // clear the ward sr

  const selectOption = 'subcounty_id';
  const index = filters.value.indexOf(selectOption);

  if (selectedSubCounty.value) {
    // Ensure the filter key exists
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption);
      filterFunction.value.push('in');
    }

    // Update filter values - wrap single value in array for 'in' operator
    const filterIndex = filters.value.indexOf(selectOption);
    filterValues.value[filterIndex] = [selectedSubCounty.value];
  } else {
    // Remove filter if no subcounty selected
    if (index !== -1) {
      filters.value.splice(index, 1);
      filterFunction.value.splice(index, 1);
      filterValues.value.splice(index, 1);
    }
  }

  if (search_string.value) {
    getFilteredBySearchData(search_string.value);
  } else {
    getFilteredData(filters.value, filterValues.value);
    getCounts();
  }
}


 




 



const filterByWard = async (ward_id: any) => {
  if (ward_id) {
    selectedWard.value = ward_id;
  }

  const selectOption = 'ward_id';
  const index = filters.value.indexOf(selectOption);

  if (selectedWard.value) {
    // Ensure the filter key exists
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption);
      filterFunction.value.push('in');
    }

    // Update filter values - wrap single value in array for 'in' operator
    const filterIndex = filters.value.indexOf(selectOption);
    filterValues.value[filterIndex] = [selectedWard.value];
  } else {
    // Remove filter if no ward selected
    if (index !== -1) {
      filters.value.splice(index, 1);
      filterFunction.value.splice(index, 1);
      filterValues.value.splice(index, 1);
    }
  }

  if (search_string.value) {
    getFilteredBySearchData(search_string.value);
  } else {
    getFilteredData(filters.value, filterValues.value);
    getCounts();
  }
}

const getDaysDiff = (expiryDate: any): number | null => {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  if (isNaN(expiry.getTime())) return null;
  const today = new Date();
  // Compare by day (ignore time component)
  const startOfExpiry = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((startOfExpiry.getTime() - startOfToday.getTime()) / msPerDay);
};

const formatExpiryPhrase = (expiryDate: any): string => {
  const diff = getDaysDiff(expiryDate);
  if (diff === null) return '';
  if (diff === 0) return `Expires today`;

  const absDays = Math.abs(diff);
  let value = absDays;
  let unit = 'day';

  if (absDays > 365) {
    value = Math.ceil(absDays / 365);
    unit = 'year';
  } else if (absDays > 30) {
    value = Math.ceil(absDays / 30);
    unit = 'month';
  }

  const plural = value === 1 ? '' : 's';
  const phrase = `${value} ${unit}${plural}`;

  return diff > 0 ? `${phrase} to expiry` : `${phrase} past expiry`;
};

const getExpiryClass = (expiryDate: any) => {
  const diff = getDaysDiff(expiryDate);
  if (diff === null) return '';
  return diff < 0 || diff === 0 ? 'text-red-500' : 'text-green-500';
};


 



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
  reffered_to_support_staff: [],
 
});


const formOfficer = reactive({
  optionName: '',
  optionPhone: ''
});



const officerLabel=ref()

const removedUsers = ref([]); // Store removed users for potential restoration

const handleOfficerChange = (value) => {
  if (value) {
    // Remove from list
    const index = grmUsers.value.findIndex(opt => opt.value === value);
    if (index !== -1) {
      officerLabel.value = grmUsers.value[index].label;
      removedUsers.value.push(grmUsers.value[index]); // Store for restoration
      grmUsers.value.splice(index, 1);
    }
  } else {
    // Value cleared, restore all removed users
    grmUsers.value.push(...removedUsers.value);
    removedUsers.value.length = 0;
    officerLabel.value = '';
  }
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


const ReferRules = computed(() => ({
  reffered_to_officer: [
    { required: true, message: "This is required", trigger: "blur" }
  ],
  action: [
  { required: true, message: "This is required", trigger: "blur" }
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
      reffered_to_support_staff: form.value.reffered_to_support_staff || [],
   

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
  { label: 'Land Ownership/Titles', value: 'land_ownership' },
  { label: 'Evictions/Displacement', value: 'evictions' },
  { label: 'Compensation Issues', value: 'compensation' },
  { label: 'Poor Roads/Pathways', value: 'poor_roads' },
  { label: 'Infrastructure', value: 'infrastructure' },
  { label: 'Drainage/Flooding', value: 'drainage_flooding' },
  { label: 'Water Access/Supply', value: 'water_supply' },
  { label: 'Sanitation/Hygiene', value: 'sanitation' },
  { label: 'Electricity/Lighting', value: 'electricity_lighting' },
  { label: 'Waste Management', value: 'waste_management' },
  { label: 'Environmental Issues', value: 'environmental_issues' },
  { label: 'Health/Safety', value: 'health_safety' },
  { label: 'Corruption/Bribery', value: 'corruption' },
  { label: 'Discrimination', value: 'discrimination' },
  { label: 'Gender-Based Violence', value: 'gbv' },
  { label: 'Labour Issues', value: 'labour_issues' },
  { label: 'Information Gap', value: 'information_gap' },
  { label: 'Project Delays', value: 'delays' },
  { label: 'Other', value: 'other' }
];





const filterByCategory = async (categories: any) => {
  // Clear the ward selection when category changes
  // value6.value = null;

  if (categories) {
    selectedCategories.value = categories;
  }

  const selectOption = 'nature';
  const index = filters.value.indexOf(selectOption);

  if (selectedCategories.value && selectedCategories.value.length > 0) {
    // Ensure the filter key exists
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption);
      filterFunction.value.push('in');
    }

    // Update filter values - ensure it's always an array
    const filterIndex = filters.value.indexOf(selectOption);
    filterValues.value[filterIndex] = [...selectedCategories.value];
  } else {
    // Remove filter if no categories selected
    if (index !== -1) {
      filters.value.splice(index, 1);
      filterFunction.value.splice(index, 1);
      filterValues.value.splice(index, 1);
    }
  }

  if (search_string.value) {
    getFilteredBySearchData(search_string.value);
  } else {
    getFilteredData(filters.value, filterValues.value);
    getCounts();
  }
}


// New reactive variables for improved UX
const isFiltersOpen = ref(false)
const searchQuery = ref('')
const isSearching = ref(false)
const referredOfficerSearch = ref('')

// Modal filter variables
const filterModalVisible = ref(false)

// Computed properties for modal filters
const hasActiveFilters = computed(() => {
  return selectedCategories.value.length > 0 || 
         selectedCounty.value || 
         selectedSubCounty.value || 
         selectedWard.value || 
         referredOfficerSearch.value
})

const activeFilterCount = computed(() => {
  let count = 0
  if (selectedCategories.value.length > 0) count++
  if (selectedCounty.value) count++
  if (selectedSubCounty.value) count++
  if (selectedWard.value) count++
  if (referredOfficerSearch.value) count++
  return count
})

// Helper functions for getting labels
const getCountyLabel = (countyValue: string) => {
  const county = countiesOptions.value.find(c => c.value === countyValue)
  return county ? county.label : countyValue
}

const getSubCountyLabel = (subCountyValue: string) => {
  const subCounty = subcountiesOptions.value.find(sc => sc.value === subCountyValue)
  return subCounty ? subCounty.label : subCountyValue
}

const getWardLabel = (wardValue: string) => {
  const ward = wardOptions.value.find(w => w.value === wardValue)
  return ward ? ward.label : wardValue
}

// Debounced search function
let searchTimeout: NodeJS.Timeout | null = null
const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    performSearch(searchQuery.value)
  }, 300)
}

// Watch for searchQuery changes for immediate responsiveness
watch(searchQuery, (newValue) => {
  // Synchronize search_string with searchQuery
  search_string.value = newValue
  debouncedSearch()
})

// Debounced referred officer search function
let referredOfficerSearchTimeout: NodeJS.Timeout | null = null
const debouncedReferredOfficerSearch = () => {
  if (referredOfficerSearchTimeout) {
    clearTimeout(referredOfficerSearchTimeout)
  }
  referredOfficerSearchTimeout = setTimeout(() => {
    filterByReferredOfficer()
  }, 300)
}

const performSearch = async (query: string) => {
  if (!query.trim()) {
    // When search is cleared, restore filtered data without search
    search_string.value = ''
    isSearching.value = true
    try {
      await getFilteredData(filters.value, filterValues.value)
      await getCounts()
    } finally {
      isSearching.value = false
    }
    return
  }
  
  isSearching.value = true
  try {
    await getFilteredBySearchData(query)
    // Refresh counts after search
    await getCounts()
  } finally {
    isSearching.value = false
  }
}

// Store original data for restoration
const originalTableData = ref<GrievanceType[]>([])

// Summary dialog state
const showSummaryDialog = ref(false)
const summaryData = ref<any[]>([])
const summaryLoading = ref(false)

// Get summary of grievances by referred officer
const getReferredOfficerSummary = async () => {
  summaryLoading.value = true
  try {
    // Build filter parameters similar to getCounts
    const filterField: string[] = [];
    const filterValue: any[][] = [];
    const filterOperator: string[] = [];

    // Process current filters (excluding status filter for summary)
    for (let i = 0; i < filters.value.length; i++) {
      const field = filters.value[i];
      const value = filterValues.value[i];

      // Skip status filter when getting summary
      if (field === 'status') continue;

      if (field && value !== undefined && value !== null) {
        // Ensure value is an array and not empty
        let arrayValue;
        if (Array.isArray(value)) {
          if (value.length === 0) continue; // Skip empty arrays
          arrayValue = [...value]; // Create a copy of the array
        } else {
          arrayValue = [value];
        }
        
        filterField.push(field);
        filterValue.push(arrayValue);
        filterOperator.push('in');
      }
    }

    // Add status filter for referred grievances
    filterField.push('status');
    filterValue.push(['Referred', 'ExternalReferral']);
    filterOperator.push('in');

    console.log('Summary filterField:', filterField);
    console.log('Summary filterValue:', filterValue);
    console.log('Summary filterOperator:', filterOperator);

    const formData = {
      model: 'grievance',
      summaryField: 'id',
      summaryFunction: 'count',
      groupFields: ['reffered_to_officer'],
      filterField: filterField,
      filterValue: filterValue,
      filterOperator: filterOperator
    }
    
    const response = await getSummarybyFieldFromMultipleIncludes(formData)
    console.log('Summary response:', response)
    
    if (response && response.Total) {
      // Since the backend doesn't include associated model data in grouped results,
      // we need to fetch user details separately
      const officerIds = response.Total.map((item: any) => item.reffered_to_officer).filter(id => id)
      
      if (officerIds.length > 0) {
        // Fetch user details for the officer IDs using the new getUsersByIds API
        const userResponse = await getUsersByIds(officerIds, ['id', 'name', 'phone', 'email'])

        console.log('User response:', userResponse)
        const usersMap = new Map()
        
        if (userResponse.data) {
          userResponse.data.forEach((user: any) => {
            usersMap.set(user.id, user)
          })
        }
        
        // Combine summary data with user details
        summaryData.value = response.Total.map((item: any) => {
          const user = usersMap.get(item.reffered_to_officer)
          return {
            officer_id: item.reffered_to_officer,
            officer_name: user?.name || 'Unknown Officer',
            officer_phone: user?.phone || 'No Phone',
            grievance_count: item.count
          }
        })
      } else {
        summaryData.value = []
      }
    } else {
      summaryData.value = []
    }
    
    showSummaryDialog.value = true
  } catch (error) {
    console.error('Error fetching summary:', error)
    ElMessage({
      message: 'Failed to fetch summary data',
      type: 'error'
    })
  } finally {
    summaryLoading.value = false
  }
}


 



// Filter by referred officer (client-side filtering)
const filterByReferredOfficer = async () => {
  if (!referredOfficerSearch.value.trim()) {
    // If search is empty, restore original data
    if (originalTableData.value.length > 0) {
      tableDataList.value = [...originalTableData.value]
      total.value = originalTableData.value.length
    } else {
      // If no original data stored, get fresh data from server
      await getFilteredData(filters.value, filterValues.value)
    }
    return
  }
  
  // Store original data if not already stored
  if (originalTableData.value.length === 0) {
    originalTableData.value = [...tableDataList.value]
  }
  
  // Client-side filtering for referred officer search
  const search = referredOfficerSearch.value.trim().toLowerCase()
  
  // Filter the current table data
  const filteredData = originalTableData.value.filter(grievance => {
    if (grievance.users && grievance.reffered_to_officer) {
      const officerName = grievance.users.name?.toLowerCase() || ''
      const officerPhone = grievance.users.phone?.toLowerCase() || ''
      return officerName.includes(search) || officerPhone.includes(search)
    }
    return false
  })
  
  // Update the table data with filtered results
  tableDataList.value = filteredData
  total.value = filteredData.length
}

// Modal filter methods
const openFilterModal = () => {
  filterModalVisible.value = true
}

// Clear individual filter methods
const clearCategoryFilter = () => {
  selectedCategories.value = []
  filterByCategory([])
}

const clearCountyFilter = () => {
  selectedCounty.value = null
  filterByCounty(null)
}

const clearSubCountyFilter = () => {
  selectedSubCounty.value = null
  filterBySubCounty(null)
}

const clearWardFilter = () => {
  selectedWard.value = null
  filterByWard(null)
}

const clearOfficerSearch = () => {
  referredOfficerSearch.value = ''
  filterByReferredOfficer()
}

// Clear all filters method
const clearAllFilters = async () => {
  // Reset all filter selections properly
  selectedCategories.value = []
  selectedCounty.value = null
  selectedSubCounty.value = null
  selectedWard.value = null
  selectedOfficer.value = null
  referredOfficerSearch.value = ''
  search_string.value = ''
  
  // Clear the underlying filter arrays
  filterValues.value = []
  filters.value = []
  filterFunction.value = []
  
  // Clear original data and call handleClear
  originalTableData.value = []
  await handleClear()
}

// Apply filters and close modal
const applyFiltersAndClose = async () => {
  // Apply all filters in sequence
  await filterByCategory(selectedCategories.value)
  
  // Apply location filters if they have values
  if (selectedCounty.value) {
    await filterByCounty(selectedCounty.value)
  }
  if (selectedSubCounty.value) {
    await filterBySubCounty(selectedSubCounty.value)
  }
  if (selectedWard.value) {
    await filterByWard(selectedWard.value)
  }
  
  // Apply officer search if it has a value
  if (referredOfficerSearch.value) {
    await filterByReferredOfficer()
  }
  
  // Final data fetch and count update
  if (search_string.value) {
    await getFilteredBySearchData(search_string.value)
  } else {
    await getFilteredData(filters.value, filterValues.value)
    await getCounts()
  }
  
  filterModalVisible.value = false
}

// Apply filters method (can be customized if needed)
const applyFilters = () => {
  if (search_string.value) {
    getFilteredBySearchData(search_string.value)
  } else {
    getFilteredData(filters.value, filterValues.value)
    getCounts()
  }
}

// Enhanced status type mapping
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    'Sorting': 'warning',
    'Under Review': 'info',
    'Investigation': 'info',
    'Resolved': 'success',
    'Escalated': 'danger',
    'Returned': 'danger',
    'Closed': 'info',
    'Referred': 'warning',
    'ExternalReferral': 'warning',
    'In Court': 'danger',
    'Rejected': 'danger',
    'Deleted': 'info'
  }
  return statusMap[status] || 'info'
}

// Enhanced row class name function
const getRowClassName = ({ row }: { row: any }) => {
  const status = row.status
  const baseClass = 'grievance-row'
  
  if (status === 'Sorting') return `${baseClass} status-sorting`
  if (status === 'Resolved') return `${baseClass} status-resolved`
  if (status === 'Rejected') return `${baseClass} status-rejected`
  if (status === 'Escalated' || status === 'Returned') return `${baseClass} status-escalated`
  if (status === 'Closed') return `${baseClass} status-closed`
  if (status === 'Referred' || status === 'ExternalReferral') return `${baseClass} status-referred`
  
  return baseClass
}

// Enhanced row click handler
const handleRowClick = (row: any) => {
  push({
    name: 'GrievanceDetails',
    params: { id: row.id }
  })
}

// Check if currently filtered by a specific officer
const isFilteredByOfficer = computed(() => {
  const officerFilterIndex = filters.value.indexOf('reffered_to_officer')
  if (officerFilterIndex !== -1) {
    const officerValues = filterValues.value[officerFilterIndex]
    // If we have a specific officer filter (not empty array), disable summary
    return officerValues && officerValues.length > 0
  }
  return false
})

// Summary table row class name
const getSummaryRowClassName = ({ row }: { row: any }) => {
  return 'summary-table-row'
}

// Summary table row click handler
const handleSummaryRowClick = (row: any) => {
  // Optional: Add any row click behavior here
  console.log('Summary row clicked:', row)
}

// Filter grievances by specific officer
const filterByOfficer = async (officerId: number, officerName: string) => {
  // Close the summary dialog
  showSummaryDialog.value = false
  
  // Switch to Referred tab if not already there
  if (activeSegment.value !== 'Referred') {
    await onSegmentClick('Referred')
  }
  
  // Add filter for the specific officer
  const selectOption = 'reffered_to_officer'
  
  // Ensure the filter key exists
  if (!filters.value.includes(selectOption)) {
    filters.value.push(selectOption)
    filterFunction.value.push('eq')
  }
  
  const index = filters.value.indexOf(selectOption)
  filterValues.value[index] = [officerId]
  
  // Update the referred officer search to show the officer name
  referredOfficerSearch.value = officerName
  
  // Get filtered data
  await getFilteredData(filters.value, filterValues.value)
  
  // Show success message
  ElMessage({
    message: `Showing grievances referred to ${officerName}`,
    type: 'success'
  })
}

</script>

<template>
  <div class="grievance-dashboard">
  
    <!-- Main Content Card -->
    <el-card class="main-content-card">

      <template #header>
      <div class="card-header">
        <!-- Header Top Row: Title and Actions -->
        <div class="header-top">
          <div class="header-content">
            <el-button type="primary" plain :icon="Back" @click="goBack">
            Back
          </el-button>
              <div class="header-text">
                <h3>Grievance Management</h3>
              </div>
          </div>
          
        <div class="header-actions">
          <div class="header-search" style="flex:1 1 auto; min-width: 220px;">
            <el-input
              v-model="searchQuery"
              placeholder="Search grievances by code, description, or complainant name..."
              clearable
              class="header-search-input"
            >
              <template #append>
                <el-icon :class="{ 'is-loading': isSearching }" style="margin-right: 8px;">
                  <Loading />
                </el-icon>
                <el-button :icon="Search" @click="performSearch(searchQuery)" />
              </template>
            </el-input>
          </div>
          
          <div class="total-count-badge">
            <div class="count-number">{{ totalGrievanceCount }}</div>
            <div class="count-label">Total Grievances</div>
          </div>

          <DownloadCustom 
              :data="tableDataList" 
              :model="model"
              :associated_models="['users','county','subcounty','ward','settlement']" 
              class="action-button"
            />
        </div>
        </div>

        <!-- Header Bottom Row: Status Cards -->
        <div class="status-cards-container">
          <div class="status-cards">
            <template v-for="status in Statuses" :key="status.value">
              <!-- Regular status cards (excluding All) -->
              <el-tooltip
                :content="status.description"
                placement="bottom"
                effect="light"
                popper-class="status-success-tooltip"
                :manual="true"
                trigger="manual"
                v-model:visible="statusTooltipVisible[status.value]"
                v-if="!['All', 'Deleted', 'Rejected'].includes(status.value)"
              >
                <div 
                  :class="['status-card', { active: activeSegment === status.value }]"
                  @click="onSegmentClick(status.value); showStatusTip(status.value)"
                >
                  <div class="status-icon">
                    <el-icon :size="18">
                      <component :is="status.icon" />
                    </el-icon>
                  </div>
                  <div class="status-info">
                    <div class="status-label">{{ status.label }}</div>
                    <div class="status-count">{{ status.count }}</div>
                  </div>
                </div>
              </el-tooltip>
              
              <!-- Permission-wrapped status cards -->
              <PermissionWrapper 
                v-else-if="['Deleted', 'Rejected'].includes(status.value)"
                :permissions="['grievance:viewDeleted']"
              >
                <el-tooltip
                  :content="status.description"
                  placement="top"
                  effect="light"
                  popper-class="status-success-tooltip"
                  :manual="true"
                  trigger="manual"
                  v-model:visible="statusTooltipVisible[status.value]"
                >
                  <div 
                    :class="['status-card', { active: activeSegment === status.value }]"
                    @click="onSegmentClick(status.value); showStatusTip(status.value)"
                  >
                    <div class="status-icon">
                      <el-icon :size="18">
                        <component :is="status.icon" />
                      </el-icon>
                    </div>
                    <div class="status-info">
                      <div class="status-label">{{ status.label }}</div>
                      <div class="status-count">{{ status.count }}</div>
                    </div>
                  </div>
                </el-tooltip>
              </PermissionWrapper>
            </template>
          </div>
        </div>
      </div>
      </template>

      <!-- Compact Filter Bar with Modal -->
      <div class="compact-filter-bar">
        <div class="filter-summary">
          <!-- Filter Button -->
          <el-button 
            type="primary" 
            :icon="Filter"
            size="small"
            @click="openFilterModal"
            class="filter-button"
          >
            Filters
            <el-badge 
              v-if="activeFilterCount > 0" 
              :value="activeFilterCount" 
              class="filter-badge"
            />
          </el-button>

          <!-- Applied Filters Tags -->
          <div class="applied-filters" v-if="hasActiveFilters">
            <el-tag 
              v-if="selectedCategories.length" 
              size="small" 
              type="info" 
              closable 
              @close="clearCategoryFilter"
            >
              Categories ({{ selectedCategories.length }})
            </el-tag>
            <el-tag 
              v-if="selectedCounty" 
              size="small" 
              type="info" 
              closable 
              @close="clearCountyFilter"
            >
              {{ getCountyLabel(selectedCounty) }}
            </el-tag>
            <el-tag 
              v-if="selectedSubCounty" 
              size="small" 
              type="info" 
              closable 
              @close="clearSubCountyFilter"
            >
              {{ getSubCountyLabel(selectedSubCounty) }}
            </el-tag>
            <el-tag 
              v-if="selectedWard" 
              size="small" 
              type="info" 
              closable 
              @close="clearWardFilter"
            >
              {{ getWardLabel(selectedWard) }}
            </el-tag>
            <el-tag 
              v-if="referredOfficerSearch" 
              size="small" 
              type="info" 
              closable 
              @close="clearOfficerSearch"
            >
              Officer: {{ referredOfficerSearch }}
            </el-tag>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="quick-actions">
            <el-button 
            v-if="hasActiveFilters" 
            size="small" 
            type="warning" 
            :icon="Refresh" 
            @click="handleClear"
          >
            Clear All
            </el-button>
            <el-button 
            size="small" 
              type="success" 
            :icon="Plus" 
            @click="AddComponent"
            >
            Add
            </el-button>
            <el-button 
              v-if="selectedRows.length > 0 && !['Closed', 'Resolved', 'In Court', 'Deleted', 'Rejected'].includes(activeSegment)"
              type="primary" 
              :icon="Share"
              size="small"
              @click="handleBulkAction"
            >
              Refer ({{ selectedRows.length }})
            </el-button>
        </div>
      </div>

      <!-- Enhanced Table -->
      <el-table
        v-loading="loading"
        :data="tableDataList"
        :row-class-name="getRowClassName"
        @row-click="handleRowClick"
        class="grievance-table"
        border
        show-overflow-tooltip
        @selection-change="handleSelectionChange"
      >
        <!-- Optional Selection Column for Non-Final Statuses -->
        <el-table-column
          v-if="!['Closed', 'Resolved', 'In Court', 'Deleted', 'Rejected'].includes(activeSegment)"
          type="selection"
          width="50"
          :selectable="isRowSelectable"
        />
      <!-- Optional Selection Column for Non-Final Statuses -->
       


        <el-table-column label="ID" width="100" prop="id">
          <template #default="{ row }">
            <div class="grievance-id">
              <span class="id-number">#{{ row.id }}</span>
              <el-tag v-if="row.grievance_documents?.length" size="small" type="info">
                <el-icon><Paperclip /></el-icon>
                {{ row.grievance_documents.length }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Grievance" min-width="300">
          <template #default="{ row }">
            <div class="grievance-info">
              <div class="grievance-code">{{ row.code }}</div>
              <div class="grievance-description">{{ row.description }}</div>
              <div class="grievance-category">
                <el-tag size="small" :type="getStatusType(row.status)">
                  {{ row.status }}
                </el-tag>
                <el-tag size="small" style="margin-left:6px;">{{ row.nature }}</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Location" width="200">
          <template #default="{ row }">
            <div class="location-info">
              <div class="settlement">{{ row.settlement?.name }}</div>
              <div class="county">{{ row.county?.name }}</div>
            </div>
          </template>
        </el-table-column>

        <!-- <el-table-column label="Status" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column> -->

        <!-- Show only in 'Referred' tab -->
        <el-table-column label="Referred To" width="250" v-if="activeSegment === 'Referred'">
          <template #default="{ row }">
            <div class="referred-officer">
              <div v-if="row.reffered_to_officer && row.users" class="officer-info" style="flex-direction:column;align-items:flex-start;gap:0;">
                <span class="officer-name">{{ row.users.name }}</span>
                <span v-if="row.users.phone" class="officer-phone">{{ row.users.phone }}</span>
              </div>
              <div v-else class="no-officer">
                <el-tag size="small" type="info">Not assigned</el-tag>
              </div>
              
              <!-- Supporting Staff Section -->
              <div v-if="row.reffered_to_support_staff && row.reffered_to_support_staff.length > 0" class="supporting-staff">
                <div class="supporting-staff-label">Supported by:</div>
                <div class="supporting-staff-list">
                  <el-tag 
                    v-for="staffId in row.reffered_to_support_staff" 
                    :key="staffId"
                    size="small" 
                    type="success"
                    class="staff-tag"
                  >
                    {{ getSupportingStaffName(staffId) }}
                  </el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="date_reported" label="Date Reported" width="150">
          <template #default="{ row }">
            <span>{{ formatDate(row.date_reported) }}</span>
          </template>
        </el-table-column>

        
        <el-table-column  v-if="['Resolved'].includes(activeSegment)" prop="date_resolved" label="Date Resolved" width="150">
          <template #default="{ row }">
            <span>{{ formatDate(row.date_resolved) }}</span>
          </template>
        </el-table-column>

        <el-table-column  v-if="['Closed'].includes(activeSegment)" prop="date_closed" label="Date Closed" width="150">
          <template #default="{ row }">
            <span>{{ formatDate(row.date_closed) }}</span>
          </template>
        </el-table-column>
        <!-- Show only in 'Sorting' tab -->
        <el-table-column label="Complainant" prop="name" width="150" v-if="activeSegment === 'Sorting'" />
        <el-table-column label="Reported By" width="150" v-if="activeSegment === 'Sorting'">
          <template #default="{ row }">
            <span v-if="row.self_reported">Self</span>
            <span v-else>{{ row.reporter_name }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Deadline" width="200">
          <template #default="{ row }">
            <div style="display:flex; align-items:center; gap:6px;">
              <span :class="getExpiryClass(row.status_expiry_date)">
                {{ formatExpiryPhrase(row.status_expiry_date) }}
              </span>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <el-pagination
        v-model:currentPage="currentPage"
        v-model:page-size="pageSize"
        :pager-count="pagerCount"
        :page-sizes="[5, 10, 20, 50, 200, 10000]"
        :total="total"
        :layout="paginationLayout"
        :background="true"
        class="pagination"
        @size-change="onPageSizeChange"
        @current-change="onPageChange"
      />
    </el-card>
  </div>

  <!-- Download Fields Dialog -->
  <el-dialog title="Select Fields" v-model="showDownloadDialog" :width="isMobile ? '90%' : '60%'">
    <el-form>
      <el-form-item>
        <el-row :gutter="20">
          <el-col v-for="field in availableFields" :key="field" :span="isMobile ? 12 : 6">
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

  <!-- Add Grievance Drawer -->
  <el-drawer 
    v-model="AddDialogVisible" 
    direction="rtl" 
    :size="isMobile ? '100%' : '50%'"
    :with-header="false"
    :before-close="handleCloseDialog"
  >
    <!-- Custom Header -->
    <div class="drawer-header">
      <div class="header-content">
        <div class="header-icon">
          <el-icon :size="24">
            <Plus />
          </el-icon>
        </div>
        <div class="header-text">
          <h3>File a Grievance</h3>
          <p>Create a new grievance complaint</p>
        </div>
      </div>
      <el-button 
        type="text" 
        @click="AddDialogVisible = false"
        class="close-button"
      >
        <el-icon :size="20">
          <Close />
        </el-icon>
      </el-button>
    </div>

    <div class="drawer-content">
      <el-steps :active="active" finish-status="success" class="drawer-steps">
        <el-step title="Complainant Details" />
        <el-step title="Grievance Details" />
        <el-step title="Review & Submit" />
      </el-steps>

      <el-form
        :model="grmForm"
        class="grievance-form"
        label-position="top"
        :rules="currentStepRules"
        ref="dynamicFormRef"
      >
        <!-- Step 1: Complainant Details -->
        <div v-if="active === 0" class="form-step">
          <el-row :gutter="16">
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn1" label="Name of Complainant" prop="name">
                <el-input v-model="grmForm.name" placeholder="Enter name" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn2" label="Gender" prop="gender">
                <el-select v-model="grmForm.gender" placeholder="Select gender" style="width: 100%;">
                  <el-option label="Male" value="male" />
                  <el-option label="Female" value="female" />
                  <el-option label="Other" value="other" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn3" label="Age Bracket" prop="age">
                <el-select v-model="grmForm.age" placeholder="Select age bracket" style="width: 100%;">
                  <el-option v-for="range in ageRanges" :key="range.value" :label="range.label" :value="range.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn4" label="National ID" prop="national_id">
                <el-input v-model="grmForm.national_id" placeholder="Enter national ID" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn5" label="Phone Number" prop="phone">
                <el-input
                  v-model="grmForm.phone"
                  placeholder="Enter phone number"
                  @input="convertPhoneNumber(grmForm.phone)"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn6" label="Email (Optional)" prop="email">
                <el-input v-model="grmForm.email" placeholder="Enter email" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- Step 2: Grievance Details -->
        <div v-if="active === 1" class="form-step">
          <el-row :gutter="16">
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn10" label="County" prop="county_id">
                <el-select
                  v-model="grmForm.county_id"
                  placeholder="Select county"
                  style="width: 100%;"
                  @change="getSettlementByCounty(grmForm.county_id)"
                >
                  <el-option
                    v-for="item in countiesOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn11" label="Settlement" prop="settlement_id">
                <el-select
                  v-model="grmForm.settlement_id"
                  placeholder="Select settlement"
                  style="width: 100%;"
                  @change="handleSelectSettlement(grmForm.settlement_id)"
                >
                  <el-option
                    v-for="item in settlementOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn12" label="Address" prop="address">
                <el-input v-model="grmForm.address" placeholder="Enter address (e.g., near XXX Primary School)" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn13" label="Is this a GBV-related complaint?">
                <el-switch v-model="grmForm.isgbv" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn14" label="Nature of Complaint" prop="nature">
                <el-select v-model="grmForm.nature" placeholder="Select nature" style="width: 100%;">
                  <el-option
                    v-for="item in grievanceOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn15" label="Description" prop="description">
                <el-input
                  type="textarea"
                  v-model="grmForm.description"
                  placeholder="Provide a detailed description"
                  :rows="4"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn16" label="Plea/Request" prop="plea">
                <el-input
                  type="textarea"
                  v-model="grmForm.plea"
                  placeholder="Enter the complainant's plea or request"
                  :rows="4"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- Step 3: Review & Submit -->
        <div v-if="active === 2" class="form-step">
          <el-row :gutter="16">
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn17" label="Witness Name (Optional)" prop="witness">
                <el-input v-model="grmForm.witness" placeholder="Enter witness name" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn18" label="Witness Phone (Optional)" prop="witness_phone">
                <el-input
                  v-model="grmForm.witness_phone"
                  placeholder="Enter witness phone"
                  @input="convertPhoneNumber(grmForm.witness_phone)"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn19" label="Witness Statement (Optional)" prop="witness_statement">
                <el-input
                  type="textarea"
                  v-model="grmForm.witness_statement"
                  placeholder="Enter witness statement"
                  :rows="4"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn20" label="Supporting Documentation (Optional)">
                <el-upload
                  v-model:file-list="fileList"
                  :auto-upload="false"
                  :on-preview="handlePreview"
                  :on-remove="handleRemove"
                  :before-remove="beforeRemove"
                  :on-exceed="handleExceed"
                  :limit="3"
                  accept=".pdf,.jpg,.png"
                >
                  <el-button type="primary">Click to upload</el-button>
                  <template #tip>
                    <div class="el-upload__tip">
                      Only pdf/jpg/png files with a size less than 10MB
                    </div>
                  </template>
                </el-upload>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-form>

      <!-- Drawer Footer -->
      <div class="drawer-footer">
        <el-button id="btn8" v-if="active === 0" @click="resetForm">Clear Form</el-button>
        <el-button id="btn9" v-if="active > 0" @click="prev">Previous</el-button>
        <el-button id="btn7" v-if="active < 2" type="primary" @click="next">Next</el-button>
        <el-button id="btn21" v-if="active === 2" type="primary" @click="submitForm">Submit</el-button>
        <el-button @click="AddDialogVisible = false">Cancel</el-button>
      </div>
    </div>
  </el-drawer>

  <!-- Referral Dialog -->
 
  <el-dialog title="Refer Grievance(s)" v-model="showReferralDialog" width="60%" draggable>
    <el-form   v-loading="grmUsersLoading" :model="form" label-width="auto" ref="ReferralRef" :rules="ReferRules">
      <el-form-item label="Select Officer" label-position="top" prop="reffered_to_officer" >
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

      <el-form-item label="Select Supporting Officers" label-position="top" prop="reffered_to_support_staff" >
        <el-select
          v-model="form.reffered_to_support_staff" multiple clearable filterable placeholder="Select"
          :loading="grmUsersLoading" :disabled="grmUsersLoading"   style="width: 100%">
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
type="textarea" :rows="2" placeholder="Provide instructions here..."
          v-model="form.action" />
      </el-form-item>

    </el-form>


    <div style="display: flex; justify-content: end; align-items: center; margin-top: 20px;">
      <el-button @click="showReferralDialog = false">Cancel</el-button>
      <el-button type="primary" @click="submitResolutionForm">Submit</el-button>
    </div>
  </el-dialog>


  <!-- Review Deleted Grievance Dialog -->
  <el-dialog
    v-model="ShowReviewDialog"
    :title="formHeader"
    :width="isMobile ? '90%' : '50%'"
    draggable
  >
    <el-descriptions :column="isMobile ? 1 : 2" border>
      <el-descriptions-item
        v-for="item in grievanceData"
        :key="item.label"
        :label="item.label"
      >
        {{ item.value }}
      </el-descriptions-item>
    </el-descriptions>
    <div class="dialog-footer">
      <el-button @click="ShowReviewDialog = false">Cancel</el-button>
      <el-button type="primary" @click="RevertEdits(DeletedGrievance)">Revert Deletion</el-button>
    </div>
  </el-dialog>

  <!-- Upload Dialog -->
  <el-dialog
    v-model="uploadDialog"
    title="Upload Grievances"
    :width="isMobile ? '90%' : '50%'"
    draggable
  >
    <el-upload
      :auto-upload="false"
      :on-change="handleCsvUpload"
      accept=".csv"
    >
      <el-button type="primary">Click to upload CSV</el-button>
      <template #tip>
        <div class="el-upload__tip">
          Please upload a CSV file with grievance data.
        </div>
      </template>
    </el-upload>
    <el-button type="primary" @click="DownloadTemplate" style="margin-top: 20px;">
      Download Template
    </el-button>
    <div class="dialog-footer">
      <el-button @click="uploadDialog = false">Cancel</el-button>
    </div>
  </el-dialog>

  <!-- Summary Dialog -->
  <el-dialog
    v-model="showSummaryDialog"
    title="Grievances by Referred Officer"
    :width="isMobile ? '100%' : '40%'"
    draggable
    class="summary-dialog"
  >
    <div v-loading="summaryLoading">
      <el-table
        :data="summaryData"
        border
        stripe
        :row-class-name="getSummaryRowClassName"
        @row-click="handleSummaryRowClick"
      >
        <el-table-column label="Officer Name" prop="officer_name" width="300">
          <template #default="{ row }">
            <div class="officer-info">
              <div class="officer-name">{{ row.officer_name }}</div>
              <div v-if="row.officer_phone" class="officer-phone">
                <el-icon><Phone /></el-icon>
                {{ row.officer_phone }}
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="Grievance Count" prop="grievance_count" width="150" align="center"/>
      

        <el-table-column label="Actions" width="200" align="center">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small" 
              @click.stop="filterByOfficer(row.officer_id, row.officer_name)"
              class="view-grievances-btn"
            >
              <el-icon><View /></el-icon>
              View Grievances
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div v-if="summaryData.length === 0 && !summaryLoading" class="no-data">
        <el-empty description="No referred grievances found" />
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="showSummaryDialog = false">Close</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- Filter Drawer -->
  <el-drawer
    v-model="filterModalVisible"
    title="Filter Options"
    :size="isMobile ? '100%' : '400px'"
    direction="rtl"
    class="filter-drawer"
  >
    <div class="filter-drawer-content">
      <!-- Filter List -->
      <div class="filter-list">
        <!-- Category Filter -->
        <div class="filter-item">
          <label class="filter-label">Grievance Categories</label>
          <el-select
            v-model="selectedCategories"
            multiple
            clearable
            filterable
            placeholder="Select categories"
            size="small"
            style="width: 100%"
          >
            <el-option
              v-for="item in grievanceOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>

        <!-- County Filter -->
        <div class="filter-item" v-if="isNationalStaff">
          <label class="filter-label">County</label>
          <el-select
            v-model="selectedCounty"
            clearable
            filterable
            placeholder="Select county"
            size="small"
            style="width: 100%"
            @change="filterByCounty"
          >
            <el-option
              v-for="item in countiesOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>

        <!-- Subcounty Filter -->
        <div class="filter-item">
          <label class="filter-label">Subcounty</label>
          <el-select
            v-model="selectedSubCounty"
            :disabled="!selectedCounty"
            clearable
            filterable
            placeholder="Select subcounty"
            size="small"
            style="width: 100%"
            @change="filterBySubCounty"
          >
            <el-option
              v-for="item in subcountiesOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>

        <!-- Ward Filter -->
        <div class="filter-item">
          <label class="filter-label">Ward</label>
          <el-select
            v-model="selectedWard"
            :disabled="!selectedSubCounty"
            clearable
            filterable
            placeholder="Select ward"
            size="small"
            style="width: 100%"
            @change="filterByWard"
          >
            <el-option
              v-for="item in wardOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>

        <!-- Officer Search - Only show in Referred tab -->
        <div class="filter-item" v-if="activeSegment === 'Referred'">
          <label class="filter-label">Officer Search</label>
          <el-input
            v-model="referredOfficerSearch"
            placeholder="Search by officer..."
            :prefix-icon="Search"
            clearable
            size="small"
            @input="debouncedReferredOfficerSearch"
            v-loading="isSearching"
          />
        </div>

        <!-- Officer Summary - Only show in Referred tab -->
        <div class="filter-item" v-if="activeSegment === 'Referred'">
          <label class="filter-label">Officer Summary</label>
          <el-button 
            type="info" 
            :icon="View"
            size="small"
            @click="getReferredOfficerSummary"
            :loading="summaryLoading"
            :disabled="isFilteredByOfficer"
            style="width: 100%"
          >
            Get Summary
          </el-button>
        </div>


      </div>

      <!-- Action Buttons -->
      <div class="filter-drawer-footer">
        <el-button @click="clearAllFilters" :icon="Refresh">Clear All</el-button>
        <el-button type="primary" @click="applyFiltersAndClose" :icon="Filter">Apply Filters</el-button>
      </div>
    </div>
  </el-drawer>

  <!-- Tour -->
  <el-tour v-model="isTourVisible" :steps="filteredTourSteps" />
</template>

<style scoped>
/* Dashboard Layout */
.grievance-dashboard {
  padding: 4px;
  min-height: 100vh;
}

/* Main Content Card - Optimized for older screens */
.main-content-card {
  margin-bottom: 16px;
}

.main-content-card :deep(.el-card__body) {
  padding: 8px;
}

.main-content-card :deep(.el-card__header) {
  padding: 8px 12px;
}

/* Header */
.dashboard-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 2px;
  padding: 20px;
   border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.back-button {
  min-width: 80px;
}

.dashboard-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

/* Filter Panel */
.filter-panel {
  margin-bottom: 5px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.filter-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.filter-content {
  padding: 20px;
}

/* Status Cards in Header - Optimized for older screens */
.status-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 6px;
}

.status-card {
  display: flex;
  align-items: center;
  padding: 8px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.status-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.status-card.active {
  border-color: #d8144f;
   box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.status-icon {
  margin-right: 8px;
  color: #409eff;
}

.status-info {
  flex: 1;
  min-width: 0;
}

.status-label {
  font-weight: 500;
  margin-bottom: 1px;
  color: #303133;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-count {
  font-size: 16px;
  font-weight: bold;
  color: #409eff;
}

/* Card Header - Optimized for older screens */
.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
}

.card-header .header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-header .header-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 0 0 auto;
  flex-wrap: wrap;
}

.card-header .header-icon {
  color: #409eff;
}

.card-header .header-text {
  padding: 4px 8px;
}

.card-header .header-text h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.card-header .header-text p {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.card-header .header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  flex: 1 1 auto;
}

.card-header .status-cards-container {
  margin-top: 8px;
}

/* Total Count Badge - Optimized for older screens */
.total-count-badge {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 6px 10px;
  color: #303133;
  text-align: center;
  box-shadow: none;
  transition: none;
  min-width: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.total-count-badge:hover {
  transform: none;
  box-shadow: none;
}

.count-number {
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
  margin-bottom: 2px;
}

.count-label {
  font-size: 10px;
  font-weight: 500;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.2px;
}

.header-search {
  min-width: 300px;
}

.header-search-input {
  width: 100%;
}

.header-search :deep(.el-input-group__append) .el-icon.is-loading {
  animation: rotating 1s linear infinite;
}

@keyframes rotating {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Redesigned Filters Bar - Compact and Responsive */
.filters-bar-redesigned {
  margin-bottom: 8px;
  margin-top: 4px;
  border-radius: 6px;
  padding: 8px;
  border: 1px solid #e9ecef;
}

.filters-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.filters-row:last-child {
  margin-bottom: 0;
}

.primary-filters {
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 6px;
  margin-bottom: 6px;
}

.action-buttons {
  justify-content: flex-end;
  border-bottom: none;
  padding-bottom: 0;
  margin-bottom: 0;
}

.filter-group {
  min-width: 120px;
  flex: 1;
  max-width: 200px;
}

.button-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}

/* Compact Components */
.compact-select {
  width: 100%;
}

.compact-select :deep(.el-select__tags) {
  max-height: 28px;
  overflow: hidden;
  flex-wrap: nowrap;
}

.compact-select :deep(.el-tag) {
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 2px;
  font-size: 11px;
  height: 20px;
  line-height: 18px;
}

.compact-select :deep(.el-input__inner) {
  height: 28px !important;
  min-height: 28px !important;
  font-size: 12px;
}

.compact-input {
  width: 100%;
}

.compact-input :deep(.el-input__inner) {
  height: 28px !important;
  font-size: 12px;
}

.compact-button {
  font-size: 11px;
  padding: 4px 8px;
  height: 28px;
  min-width: 60px;
}

/* Dropdown improvements */
.compact-select :deep(.el-select-dropdown__item) {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 6px 10px;
  font-size: 12px;
  line-height: 1.3;
}

.quick-filter {
  width: 100%;
}

/* Fix for category select expansion issue */
.category-select :deep(.el-select__tags) {
  max-height: 32px;
  overflow: hidden;
  flex-wrap: nowrap;
}

.category-select :deep(.el-tag) {
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 4px;
}

.category-select :deep(.el-input__inner) {
  height: 32px !important;
  min-height: 32px !important;
}

.category-select :deep(.el-select__input) {
  height: 30px;
}

/* Ellipsis for dropdown options */
.category-select :deep(.el-select-dropdown__item) {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 8px 12px;
}

/* Responsive tag sizes for smaller screens */
@media (max-width: 768px) {
  .category-select :deep(.el-tag) {
    max-width: 80px;
    font-size: 11px;
  }
  
  .category-select :deep(.el-select-dropdown__item) {
    max-width: 150px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .category-select :deep(.el-tag) {
    max-width: 60px;
    font-size: 10px;
  }
  
  .category-select :deep(.el-select-dropdown__item) {
    max-width: 120px;
    font-size: 11px;
  }
}

.action-button {
  width: 100%;
  font-size: 12px;
  padding: 6px 12px;
  min-width: auto;
}

/* Table Styles */
.grievance-table {
  margin-bottom: 10px;
}

.grievance-id {
  display: flex;
  align-items: center;
  gap: 8px;
}

.id-number {
  font-weight: 600;
  color: #409eff;
}

.grievance-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.grievance-code {
  font-weight: 600;
  color: #303133;
}

.grievance-description {
  color: #606266;
  font-size: 14px;
  line-height: 1.4;
}

.grievance-category {
  margin-top: 4px;
}

.location-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.settlement {
  font-weight: 500;
  color: #303133;
}

.county {
  font-size: 12px;
  color: #909399;
}

/* Referred Officer Column */
.referred-officer {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.officer-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.officer-icon {
  color: #409eff;
  font-size: 14px;
}

.officer-name {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.officer-phone {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.no-officer {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Supporting Staff Styles */
.supporting-staff {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e4e7ed;
}

.supporting-staff-label {
  font-size: 11px;
  font-weight: 300;
  color: #606266;
  margin-bottom: 4px;
  text-transform: propercase;
  letter-spacing: 0.5px;
}

.supporting-staff-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.staff-tag {
  font-size: 10px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Row Status Classes */
.grievance-row.status-sorting {
  background-color: #fdf6ec;
}

.grievance-row.status-resolved {
  background-color: #f0f9ff;
}

.grievance-row.status-rejected {
  background-color: #fef0f0;
}

.grievance-row.status-escalated {
  background-color: #fef0f0;
}

.grievance-row.status-closed {
  background-color: #f5f7fa;
}

.grievance-row.status-referred {
  background-color: #fdf6ec;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* Drawer Styles */
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
 }

.drawer-header .header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.drawer-header .header-icon {
  color: #409eff;
}

.drawer-header .header-text h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.drawer-header .header-text p {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.close-button {
  color: #909399;
}

.close-button:hover {
  color: #409eff;
}

.drawer-content {
  padding: 24px;
  height: calc(100vh - 80px);
  overflow-y: auto;
}

.drawer-steps {
  margin-bottom: 24px;
}

.grievance-form {
  margin-bottom: 24px;
}

.form-step {
  margin-bottom: 24px;
}

.drawer-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 24px;
   border-top: 1px solid #e9ecef;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* Responsive Design - Optimized for older screens */
@media (max-width: 1200px) {
  .grievance-dashboard {
    padding: 2px;
  }
  
  .main-content-card :deep(.el-card__body) {
    padding: 6px;
  }
  
  .main-content-card :deep(.el-card__header) {
    padding: 6px 10px;
  }
  
  .card-header {
    padding: 12px 16px;
  }
  
  .card-header .header-content {
    gap: 8px;
  }
  
  .status-cards {
    grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
    gap: 4px;
  }
  
  .status-card {
    padding: 6px;
  }
  
  .status-label {
    font-size: 10px;
  }
  
  .status-count {
    font-size: 14px;
  }
}

/* Compact Filter Bar with Modal */
.compact-filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 12px;
   border: 1px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.filter-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.filter-button {
  position: relative;
}

.filter-badge :deep(.el-badge__content) {
  top: -5px;
  right: -5px;
}

.applied-filters {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}

.quick-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* Filter Drawer */
.filter-drawer :deep(.el-drawer__body) {
  padding: 0;
}

.filter-drawer-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
}

.filter-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.filter-item:last-child {
  margin-bottom: 0;
}

.filter-label {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.filter-drawer-footer {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  border-top: 1px solid #e4e7ed;
  padding-top: 16px;
  margin-top: auto;
}

/* Drawer Responsive Design */
@media (max-width: 768px) {
  .compact-filter-bar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .filter-summary {
    justify-content: space-between;
  }
  
  .quick-actions {
    justify-content: center;
  }
  
  .applied-filters {
    justify-content: center;
    margin-top: 8px;
  }
  
  .filter-drawer-content {
    padding: 16px;
  }
  
  .filter-item {
    margin-bottom: 16px;
  }
}

@media (max-width: 480px) {
  .compact-filter-bar {
    padding: 10px 12px;
  }
  
  .filter-summary {
    gap: 8px;
  }
  
  .quick-actions {
    gap: 6px;
  }
  
  .filter-drawer-footer {
    flex-direction: column;
    gap: 8px;
  }
  
  .filter-drawer-content {
    padding: 12px;
  }
}

/* Additional responsive styles */
@media (max-width: 1024px) {
  .count-number {
    font-size: 16px;
  }
  
  .count-label {
    font-size: 8px;
  }
  
  .header-search {
    min-width: 250px;
  }
  
  .filters-bar {
    padding: 6px 0;
  }
}

/* Responsive Design for Redesigned Filters */
@media (max-width: 768px) {
  .filters-bar-redesigned {
    padding: 6px;
  }
  
  .filters-row {
    gap: 6px;
  }
  
  .filter-group {
    min-width: 100px;
    max-width: 150px;
  }
  
  .compact-select :deep(.el-tag) {
    max-width: 50px;
    font-size: 10px;
    height: 18px;
    line-height: 16px;
  }
  
  .compact-select :deep(.el-input__inner) {
    height: 26px !important;
    font-size: 11px;
  }
  
  .compact-input :deep(.el-input__inner) {
    height: 26px !important;
    font-size: 11px;
  }
  
  .compact-button {
    font-size: 10px;
    padding: 3px 6px;
    height: 26px;
    min-width: 50px;
  }
  
  .compact-select :deep(.el-select-dropdown__item) {
    max-width: 140px;
    font-size: 11px;
    padding: 5px 8px;
  }

  .card-header .header-top {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .card-header .header-content {
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }
  
  .card-header .header-actions {
    flex-direction: column;
    gap: 12px;
  }
  
  .total-count-badge {
    min-width: 80px;
    padding: 6px 12px;
  }
  
  .count-number {
    font-size: 18px;
  }
  
  .count-label {
    font-size: 9px;
  }
  
  .status-cards {
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 4px;
  }
  
  .status-card {
    padding: 4px;
  }
  
  .status-label {
    font-size: 9px;
  }
  
  .status-count {
    font-size: 12px;
  }
  
  .header-search {
    min-width: 180px;
  }
  
  .drawer-content {
    padding: 16px;
  }
  
  .drawer-footer {
    padding: 12px 16px;
  }
}

@media (max-width: 480px) {
  .filters-row {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }
  
  .primary-filters {
    border-bottom: none;
    padding-bottom: 4px;
    margin-bottom: 4px;
  }
  
  .filter-group {
    min-width: auto;
    max-width: none;
    width: 100%;
  }
  
  .button-group {
    justify-content: center;
    width: 100%;
  }
  
  .compact-button {
    flex: 1;
    min-width: 70px;
  }
}

/* Dialog Styles */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.option-input {
  margin-bottom: 8px;
}

/* Summary Dialog Styles */
.summary-dialog .el-dialog__body {
  padding: 20px 24px;
}

.summary-table {
  margin-bottom: 20px;
}

.summary-table-row {
  cursor: pointer;
}

.summary-table-row:hover {
  background-color: #f5f7fa;
}

.summary-table .officer-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-table .officer-name {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.summary-table .officer-phone {
  font-size: 12px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 4px;
}

.summary-table .officer-phone .el-icon {
  font-size: 12px;
  color: #909399;
}

.count-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 10px;
  background-color: #409eff;
  border-radius: 4px;
  color: white;
  min-width: 60px;
}

.count-number {
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
}

.count-label {
  font-size: 10px;
  font-weight: 400;
  opacity: 0.9;
}

.view-grievances-btn {
  font-size: 12px;
  padding: 6px 12px;
}

.view-grievances-btn .el-icon {
  margin-right: 4px;
  font-size: 12px;
}

.no-data {
  text-align: center;
  padding: 40px 0;
}

/* Responsive adjustments for summary table */
@media (max-width: 768px) {
  .summary-table .officer-info {
    gap: 3px;
  }
  
  .summary-table .officer-name {
    font-size: 13px;
  }
  
  .summary-table .officer-phone {
    font-size: 11px;
  }
  
  .count-badge {
    min-width: 50px;
    padding: 4px 8px;
  }
  
  .count-number {
    font-size: 14px;
  }
  
  .count-label {
    font-size: 9px;
  }
  
  .view-grievances-btn {
    font-size: 11px;
    padding: 4px 8px;
  }
}
</style>
<style scoped>
/* Success themed tooltip for status explanations */
:global(.status-success-tooltip) {
  background-color: #f0f9eb !important; /* el-success-lighter */
  color: #67c23a !important;            /* el-success */
  border: 1px solid #c2e7b0 !important; /* subtle border */
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.15) !important;
}

:global(.status-success-tooltip .el-popper__arrow::before) {
  background-color: #f0f9eb !important;
  border: 1px solid #c2e7b0 !important;
}
</style>

