<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { getListWithoutGeo} from '@/api/counties'

import { getGrievances,updateBulkGrievance, deleteCascade, confirmGrievanceResolution } from '@/api/grievance'
import { watch } from 'vue';

import {
  signupGRM
} from '@/api/register'

import { ElButton, ElSelect, ElCheckbox, ElCol,ElDrawer, ElIcon} from 'element-plus'
import {
  Plus, 
  Back,Postcard,TopRight,Lock,Guide,TakeawayBox,Upload,
  CircleCheck, Warning,View,
  Delete, Search, Refresh, Share, Paperclip, Close, Phone, Loading, Filter,
  Document, InfoFilled, Download} from '@element-plus/icons-vue'

import { getSettlementListByCounty } from '@/api/settlements'
import {   getGRMStaffByLocation } from '@/api/users'


import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import {
  ElPagination, ElOption, ElDialog, ElForm, ElTour, ElUpload,
  ElFormItem, ElRow, ElInput, ElStep, ElSteps, ElTable, ElTableColumn, ElCard, ElMessage, ElMessageBox, ElSwitch,
  ElTag, ElTooltip, ElDatePicker
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
import { uploadGrievanceDocuments, generateGrievance, logGrievanceAction,revertGrievanceHistory,logGrievanceActionBulk, batchImportGrievances, getByKeyword, sendAcknowledgement } from '@/api/grievance'
import { getModelSpecs } from '@/api/fields'
import exportFromJSON from 'export-from-json'
import Papa from 'papaparse';

import { getSummarybyFieldFromMultipleIncludes, getSummaryGroupByMultipleFields } from '@/api/summary'
import { getUserListApi, getUsersByIds } from '@/api/users'
import DownloadCustom from '@/views/Components/DownloadCustom.vue';
import { validateInternationalPhone } from '@/utils/phoneValidation'

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
  confirmed_by_national_grm?: boolean
  confirmed_by_user_id?: number
  date_confirmed_by_national_grm?: string
  confirmation_level?: string
  confirmation_notes?: string
  resolution?: string
  [key: string]: any
}

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)

const countiesOptions = ref<Array<{value: string, label: string}>>([])
const countySelectOptions = computed(() => {
  if (isCountyStaff.value && selectedCounty.value) {
    return countiesOptions.value.filter(option => option.value === selectedCounty.value)
  }
  return countiesOptions.value
})
const settlementOptions = ref<Array<{value: string, label: string, county_id?: string, subcounty_id?: string, ward_id?: string}>>([])
const isFilteringSettlements = ref(false)

const isSuperAdmin = ref(userInfo.roles.some(role => role.name === "super_admin"));
const isRootAdmin = ref(userInfo.roles.some(role => role.name === "root_admin"));
 

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
const selectedConfirmationStatus = ref<string | null>(null)
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

// Check if user has permission to view deleted grievances
const canViewDeletedGrievances = computed(() => {
  const permissions = userInfo?.permissions || [];
  return Array.isArray(permissions) && permissions.includes('grievance:viewDeleted');
})

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
    label: 'External Referral',
    value: 'ExternalReferral',
    icon: Share,
    count: 0,
    hidden: false,
    description: 'Referred to an external agency for resolution'
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
    hidden: true, // Will be updated reactively via watch
    description: 'Grievance has been deleted (mostly training/dummy data)'
  },
])

const visibleStatuses = computed(() => Statuses.value.filter(status => !status.hidden))

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
  grmUsersLoading.value = true

  const normalizedCountyIds: Array<string | number> = []
  if (Array.isArray(countyIds)) {
    countyIds.filter(id => id !== undefined && id !== null).forEach(id => normalizedCountyIds.push(id))
  } else if (countyIds !== undefined && countyIds !== null) {
    normalizedCountyIds.push(countyIds)
  }

  const formData: any = {}

  formData.model = 'users'

  // - multiple filters -------------------------------------
  formData.filters = []
  formData.filterValues = []
  formData.associated_multiple_models = ['settlement']
  formData.currentUser = currentUser
  formData.county_id = normalizedCountyIds
  formData.limit = 10000
  
  //-------------------------
  console.log('gettign getGRMStaff users --->', formData)
  const res = await getGRMStaffByLocation(formData)

  console.log('After getting getGRMStaff users', res)
   
  grmUsersLoading.value = false

  const responseUsers = Array.isArray(res.data) ? res.data : []

  // Further safeguard on frontend: restrict to allowed counties when provided
  const allowedCountyIds = normalizedCountyIds.length > 0 ? normalizedCountyIds : (isCountyStaff.value && userCountyId.value ? [userCountyId.value] : [])

  let filteredUsers = responseUsers
  if (allowedCountyIds.length > 0) {
    filteredUsers = responseUsers.filter(user => {
      const userCounty = user?.settlement?.county_id ?? user?.county_id ?? user?.county?.id
      return allowedCountyIds.includes(userCounty)
    })
  }

  grmUsers.value = filteredUsers.map(user => ({
    label: `${user.name} (${user.phone})`,
    value: user.id,
  }))

  // Also store the users for supporting staff lookup
  filteredUsers.forEach(user => {
    supportingStaffUsers.value[user.id] = user
  })
}
 




const isNationalStaff = ref(false)
const isCountyStaff = ref(false)
const userCountyId = ref<string | number | null>(null)

// Check if user is national GRM (can confirm resolutions)
const isNationalGRM = computed(() => {
  return isNationalStaff.value || isSuperAdmin.value
})

const canSeeDeletedStatus = computed(() => {
  return (
    canViewDeletedGrievances.value &&
    (isNationalStaff.value || isSuperAdmin.value || isNationalGRM.value)
  )
})

// Watch for permission/location changes and update Deleted status visibility
watch(canSeeDeletedStatus, (canSee) => {
  const deletedStatus = Statuses.value.find(s => s.value === 'Deleted')
  if (deletedStatus) {
    deletedStatus.hidden = !canSee
  }
}, { immediate: true })

// Computed properties for download filters - always exclude "Deleted" status
const downloadFilters = computed(() => {
  const downloadFiltersList = [...filters.value];
  const downloadFilterValues = filterValues.value.map(arr => [...arr]);
  const downloadFilterFunctions = [...filterFunction.value];

  const isPrivilegedUser =
    isSuperAdmin.value || isRootAdmin.value || isNationalGRM.value

  const removeFilterAtIndex = (index: number) => {
    downloadFiltersList.splice(index, 1);
    downloadFilterValues.splice(index, 1);
    if (downloadFilterFunctions[index] !== undefined) {
      downloadFilterFunctions.splice(index, 1);
    }
  };

  const stripStatusFilters = () => {
    let statusIdx = downloadFiltersList.indexOf('status')
    while (statusIdx !== -1) {
      removeFilterAtIndex(statusIdx)
      statusIdx = downloadFiltersList.indexOf('status')
    }
  }

  if (isPrivilegedUser) {
    downloadFiltersList.length = 0
    downloadFilterValues.length = 0
    downloadFilterFunctions.length = 0
  } else {
    const statusIndex = downloadFiltersList.indexOf('status');
    let statusFilterPresent = false;

    if (statusIndex !== -1) {
      const statusValues = downloadFilterValues[statusIndex];
      if (Array.isArray(statusValues)) {
        downloadFilterValues[statusIndex] = statusValues.filter(
          (val: any) => val !== 'Deleted'
        );

        if (downloadFilterValues[statusIndex].length === 0) {
          removeFilterAtIndex(statusIndex);
        } else {
          statusFilterPresent = true;
        }
      }
    }

    // Remove any remaining segment filters (status) before enforcing deleted exclusion
    stripStatusFilters()

    if (!statusFilterPresent) {
      downloadFiltersList.push('status');
      downloadFilterValues.push(['Deleted']);
      downloadFilterFunctions.push('notIn');
    }
  }

  return {
    filters: downloadFiltersList,
    filterValues: downloadFilterValues,
    filterFunctions: downloadFilterFunctions
  };
})

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
        isCountyStaff.value = true 
        userCountyId.value = role.user_roles.county_id
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
        userCountyId.value = null
      } else if (level === "national" || level === null) {
        isNationalStaff.value = true;
        userCountyId.value = null
        return { model: "national", field: null, fieldvalue: null };
      } else {
        field = "location_id";
        fieldvalue = role.user_roles.location_id;
        userCountyId.value = null
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

    // Get counts for each specific status (exclude 'All' here and hidden statuses)
    const statusesForCounts = Statuses.value.filter(s => s.value !== 'All' && !s.hidden);
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
    selectedConfirmationStatus: selectedConfirmationStatus.value,
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
      selectedConfirmationStatus.value = parsed.selectedConfirmationStatus || null;
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

      if(selectedConfirmationStatus.value)  {
                filterByConfirmationStatus(selectedConfirmationStatus.value)
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
      selectedConfirmationStatus.value = null;
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

// Store deletion history data for deleted grievances
const deletionHistoryMap = ref<Record<number, any>>({})
//// ------------------parameters -----------------------////

const { t } = useI18n()
const AddDialogVisible = ref(false)
const formHeader = ref('Add Grievance')
const showSubmitBtn = ref(true)
const showEditSaveButton = ref(false)






const handleClear = async () => {
  console.log('cleared....')

  // Preserve role-based location filters before clearing
  const roleBasedLocationFilters: { filter: string, value: any[], function: string }[] = []
  
  if (!isSuperAdmin.value && !isNationalStaff.value) {
    // Check user roles to get location-based filter
    const grmRole = userInfo.roles?.find(role => 
      role.name === "grm" || 
      role.name === "admin" || 
      role.name === "root_admin" || 
      role.name === "super_admin" || 
      role.name === "staff"
    )
    
    if (grmRole && grmRole.user_roles) {
      const level = grmRole.user_roles.location_level
      
      if (level === "county" && grmRole.user_roles.county_id) {
        roleBasedLocationFilters.push({
          filter: "county_id",
          value: [grmRole.user_roles.county_id],
          function: "in"
        })
      } else if (level === "settlement" && grmRole.user_roles.settlement_id) {
        roleBasedLocationFilters.push({
          filter: "settlement_id",
          value: [grmRole.user_roles.settlement_id],
          function: "in"
        })
      } else if (level && grmRole.user_roles.location_id) {
        roleBasedLocationFilters.push({
          filter: "location_id",
          value: [grmRole.user_roles.location_id],
          function: "in"
        })
      }
    }
  }

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
  // Preserve county selection if it's role-based
  if (!isCountyStaff.value) {
    selectedCounty.value = null
  }
  selectedSubCounty.value = null
  selectedWard.value = null
  selectedCategories.value = []
  referredOfficerSearch.value = ''
  selectedConfirmationStatus.value = null
  search_string.value = ''

  // Restore role-based location filters
  roleBasedLocationFilters.forEach(locFilter => {
    filters.value.push(locFilter.filter)
    filterValues.value.push(locFilter.value)
    filterFunction.value.push(locFilter.function)
  })

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

// Helper function to get deleter name from grievance
const getDeleterName = (grievance: GrievanceType): string => {
  // First check if deletion history is already in the grievance data
  if (grievance.grievance_history && Array.isArray(grievance.grievance_history)) {
    const deletionHistory = grievance.grievance_history.find(
      (history: any) => history.change_type === 'Delete'
    );
    if (deletionHistory) {
      // Check multiple possible alias names
      const user = deletionHistory.users || deletionHistory.user || deletionHistory.changed_by_user;
      if (user && user.name) {
        return user.name;
      }
    }
  }
  
  // Check in the deletion history map
  const history = deletionHistoryMap.value[grievance.id];
  if (history) {
    // Check multiple possible alias names
    const user = history.users || history.user || history.changed_by_user;
    if (user && user.name) {
      return user.name;
    }
    // Also check if changed_by is a direct ID and we need to look it up
    if (history.changed_by && typeof history.changed_by === 'number') {
      // This would require a separate lookup, but for now try the above
    }
  }
  
  return 'Unknown';
}

// Function to fetch deletion history for deleted grievances
const fetchDeletionHistory = async () => {
  if (tableDataList.value.length === 0) return;
  
  try {
    // Collect all grievance IDs
    const grievanceIds = tableDataList.value.map(g => g.id);
    
    if (grievanceIds.length === 0) return;
    
    // Fetch deletion history for these grievances
    const formData = {
      model: 'grievance_history',
      filters: ['grievance_id', 'change_type'],
      filterValues: [grievanceIds, ['Delete']],
      filterFunctions: ['in', 'in'],
      associated_multiple_models: ['users'],
      limit: 10000,
      page: 1,
      curUser: 1
    };
    
    console.log('Fetching deletion history with formData:', formData);
    const res = await getSettlementListByCounty(formData as any);
    console.log('Deletion history response:', res);
    
    // Map deletion history by grievance_id
    if (res && res.data && Array.isArray(res.data)) {
      console.log('Deletion history data count:', res.data.length);
      
      // Collect all changed_by user IDs to fetch user names separately
      const userIds = new Set<number>();
      res.data.forEach((history: any) => {
        if (history.changed_by && typeof history.changed_by === 'number') {
          userIds.add(history.changed_by);
        }
      });
      
      // Fetch user details if we have user IDs
      if (userIds.size > 0) {
        const userIdsArray = Array.from(userIds);
        console.log('Fetching user details for IDs:', userIdsArray);
        try {
          const userResponse = await getUsersByIds(userIdsArray, ['id', 'name', 'phone', 'email']);
          console.log('User response:', userResponse);
          
          // Create a map of user ID to user object
          const usersMap = new Map<number, any>();
          if (userResponse.data && Array.isArray(userResponse.data)) {
            userResponse.data.forEach((user: any) => {
              usersMap.set(user.id, user);
            });
          }
          
          // Map deletion history by grievance_id and attach user data
          res.data.forEach((history: any) => {
            if (history.grievance_id) {
              // Attach user data to history
              if (history.changed_by && usersMap.has(history.changed_by)) {
                history.users = usersMap.get(history.changed_by);
              }
              deletionHistoryMap.value[history.grievance_id] = history;
              console.log(`Mapped history for grievance ${history.grievance_id}:`, history);
            }
          });
        } catch (userError) {
          console.error('Error fetching user details:', userError);
          // Still map the history without user data
          res.data.forEach((history: any) => {
            if (history.grievance_id) {
              deletionHistoryMap.value[history.grievance_id] = history;
            }
          });
        }
      } else {
        // No user IDs found, just map the history
        res.data.forEach((history: any) => {
          if (history.grievance_id) {
            deletionHistoryMap.value[history.grievance_id] = history;
          }
        });
      }
      
      console.log('Final deletionHistoryMap:', deletionHistoryMap.value);
    } else {
      console.warn('No deletion history data found in response:', res);
    }
  } catch (error) {
    console.error('Error fetching deletion history:', error);
  }
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

const buildGrievanceRequestFormData = (
  selFilters: string[],
  selFilterValues: any[][],
  options: {
    limit?: number
    page?: number
    includeHistory?: boolean
    searchString?: string
    excludeDeleted?: boolean
  } = {}
) => {
  const formData: any = {
    limit: options.limit ?? pageSize.value,
    page: options.page ?? page.value,
    curUser: 1,
    model,
    searchField: 'name',
    searchKeyword: options.searchString ?? '',
    assocModel: associated_Model,
    filters: [...selFilters],
    filterValues: selFilterValues.map(value =>
      Array.isArray(value) ? [...value] : value
    ),
    filterFunctions: [],
    associated_multiple_models: [...associated_multiple_models]
  }

  const shouldIncludeHistory =
    options.includeHistory ||
    activeSegment.value === 'Deleted' ||
    activeSegment.value === 'Resolved'
  if (
    shouldIncludeHistory &&
    !formData.associated_multiple_models.includes('grievance_history')
  ) {
    formData.associated_multiple_models.push('grievance_history')
  }

  const normalizedFilters: string[] = []
  const normalizedValues: any[][] = []
  const normalizedFunctions: string[] = []

  for (let i = 0; i < formData.filters.length; i++) {
    let value = formData.filterValues[i]

    if (!Array.isArray(value)) {
      value =
        value === undefined || value === null
          ? []
          : [value]
    }

    if (!Array.isArray(value) || value.length === 0) {
      continue
    }

    normalizedFilters.push(formData.filters[i])
    normalizedValues.push(value)
    normalizedFunctions.push(filterFunction.value[i] || 'in')
  }

  formData.filters = normalizedFilters
  formData.filterValues = normalizedValues
  formData.filterFunctions = normalizedFunctions

  const shouldExcludeDeleted =
    (!canViewDeletedGrievances.value && activeSegment.value !== 'Deleted') ||
    options.excludeDeleted

  if (shouldExcludeDeleted) {
    const statusIndex = formData.filters.indexOf('status')
    if (statusIndex !== -1) {
      const statusValues = formData.filterValues[statusIndex]
      if (Array.isArray(statusValues)) {
        formData.filterValues[statusIndex] = statusValues.filter(
          (s: string) => s !== 'Deleted'
        )
        if (formData.filterValues[statusIndex].length === 0) {
          formData.filters.splice(statusIndex, 1)
          formData.filterValues.splice(statusIndex, 1)
          formData.filterFunctions.splice(statusIndex, 1)
        }
      }
    } else {
      formData.filters.push('status')
      formData.filterValues.push(['Deleted'])
      formData.filterFunctions.push('notIn')
    }
  }

  if (options.searchString) {
    formData.searchString = options.searchString
  }

  return formData
}

const getFilteredData = async (selFilters: string[], selfilterValues: any[][]) => {
  loading.value = true
  const formData = buildGrievanceRequestFormData(selFilters, selfilterValues, {
    includeHistory: activeSegment.value === 'Deleted' || activeSegment.value === 'Resolved'
  })

  try {
    const res = await getGrievances(formData)

    console.log('After Querry', res)
    console.log('After Querry - selFilters', selFilters)
    console.log('After Querry - selfilterValues', selfilterValues)

    tableDataList.value = res.data
    availableFields.value = extractFields(tableDataList.value);
    total.value = res.total

    await fetchSupportingStaffData()

    if (activeSegment.value === 'Deleted') {
      await fetchDeletionHistory()
    }

    Statuses.value.forEach(status => {
      if (status.value === activeSegment.value) {
        status.count = res.total;
      }
    });

    await getCounts()

    console.log('segment', activeSegment.value)
  } catch (error) {
    console.error('Error fetching grievances:', error)
    ElMessage({
      message: 'Unable to retrieve grievances. Please try again.',
      type: 'error'
    })
  } finally {
    loading.value = false
  }
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
  if (!fileList.value || fileList.value.length === 0) {
    console.log('No files to upload')
    return
  }

  const formData = new FormData();

  // Assuming `fileList` is an array of file objects and `grievance_id` is defined
  for (var i = 0; i < fileList.value.length; i++) {
    console.log('------>file', fileList.value[i]);
    const file = fileList.value[i];
    if (!file || !file.raw) {
      throw new Error(`File at index ${i} is missing raw file data`)
    }
    formData.append('files', file.raw);
    formData.append('format', file.name.split('.').pop() || '');
    formData.append('grievance_id', grievance_id);
    formData.append('action_id', action_id);
    formData.append('protected_file', 'true');
    formData.append('type', 'Supporting Documentation');
    formData.append('size', (file.raw.size / 1024 / 1024).toFixed(2));
    formData.append('code', uuid.v4());
  }

  // Printing out the contents of formData
  for (let [key, value] of formData.entries()) {
    console.log(`${key}: ${value}`);
  }

  try {
    const res = await uploadGrievanceDocuments(formData)
    console.log("Documents Uploaded", res)
    return res
  } catch (error) {
    console.error('Error in uploadGrievanceDocuments:', error)
    throw error // Re-throw to be caught by caller
  }
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

const sendNotification = async (grievance, action_id) => {
  const formData = {};

  // Additional properties based on the provided JSON object
  formData.type = "acknowledgement"
  formData.action_id = action_id || null;
  formData.grievance_id = grievance.id || null;
  formData.phone = grievance.phone || null;
  formData.project_phone = grievance.project_phone || 'Not Available';
  formData.code = grievance.code || null;
  formData.date = formatDate(grievance.date_reported) || null;
  formData.age = grievance.age || null;
  formData.gender = grievance.gender || null;
  formData.barcode = grievance.barcode || null;
  formData.name = grievance.name || null;
  formData.address = grievance.address || null;
  formData.settlement = grievance.settlement?.name || null;
  formData.email = grievance.email || null;
  formData.complaint = grievance.description || null;
  formData.county = grievance.county?.name || null;
  formData.subcounty = grievance.subcounty?.name || null;
  formData.documents = grievance.documents || null;


  console.log(formData);

  const res = await sendAcknowledgement(formData)

  console.log(res)

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



const disableFutureDates = (date: Date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date.getTime() > today.getTime()
}

const submitForm = async () => {
  if (!grmForm.value.date_reported) {
  grmForm.value.date_reported = new Date();
  }
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

      //1. Submit the grievance and handle the rest of the flow in the promise chain
      generateGrievance(grmForm.value)
        .then(async (grv) => {
          console.log('res', grv)
          AddDialogVisible.value = false

          try {
            // 2 Log the entry
            let log
            try {
              log = await logAction(grv.data)
              console.log('log', log)
            } catch (error) {
              console.error('Error logging grievance action:', error)
              ElMessage({
                message: 'Grievance created but failed to log action. Error: ' + (error?.response?.data?.message || error?.message || 'Unknown error'),
                type: 'error',
                duration: 5000
              })
              throw error // Re-throw to prevent continuing
            }

            // 3. Upload documents 
            if (fileList.value && fileList.value.length > 0) {
              try {
                await uploadFiles(log.id, grv.data.id)
                console.log("Documents uploaded successfully")
              } catch (error) {
                console.error('Error uploading documents:', error)
                ElMessage({
                  message: 'Grievance created and logged, but failed to upload documents. Error: ' + (error?.response?.data?.message || error?.message || 'Unknown error'),
                  type: 'error',
                  duration: 5000
                })
                // Don't throw - allow notification to proceed
              }
            }

            // 4. Send Notification (generates acknowledgment PDF)
            try {
              await sendNotification(grv.data, log.id)
            } catch (error) {
              console.error('Error sending notification:', error)
              ElMessage({
                message: 'Grievance processed but failed to send notification. Error: ' + (error?.response?.data?.message || error?.message || 'Unknown error'),
                type: 'warning',
                duration: 5000
              })
              // Don't throw - main operation succeeded
            }

            ElMessage({
              message: grv.message,
              type: 'success'
            })
          } catch (error) {
            // This catches logging errors that were re-thrown
            console.error('Error in grievance processing:', error)
            // Error message already shown in specific catch block
          }
        })
        .catch((error) => {
          console.error('Failed to submit grievance:', error)
          ElMessage({
            message: 'Failed to create grievance. Error: ' + (error?.response?.data?.message || error?.message || 'Unknown error. Please try again.'),
            type: 'error',
            duration: 5000
          })
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
  project_phase: 'KISIP 2',
  date_reported: null as Date | null,
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
  },

  step3: {
    nature: [{ required: true, message: 'Nature of complaint is required', trigger: 'change' }],
    description: [{ required: true, message: 'Description is required', trigger: 'blur' }],
    plea: [{ required: true, message: 'Plea/request is required', trigger: 'blur' }],
  },



});



const ageRanges = [
  { value: 'unspecified', label: 'Unspecified' },
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
  isFilteringSettlements.value = true
  try {
    const response = await getSettlementByCountyAuth({ county_id: selectCounty })
    console.log('List of settlement:', response)
    var opt = response.data || []

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
  } catch (error) {
    console.error('Failed to fetch settlements', error)
  } finally {
    isFilteringSettlements.value = false
  }
}

watch(
  () => [isCountyStaff.value, selectedCounty.value],
  ([isCounty, county]) => {
    if (isCounty && county) {
      grmForm.value.county_id = county
      getSettlementByCounty(county)
    }
  },
  { immediate: true }
)

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
const isUploading = ref(false)
const isParsing = ref(false)
const uploadFileList = ref<UploadUserFile[]>([])
const importResults = ref<any>(null)
const showImportResults = ref(false)

const field_set = ref([])
const uploadData = async () => {
  uploadDialog.value = true
  uploadFileList.value = []
  importResults.value = null
  showImportResults.value = false
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
  try {
    var form = {}
    form.model = 'grievance'

    const dta = convertStringArraysToProperArrays(parsedData.value)
    console.log('dta', dta)

    form.data = dta
    console.log('formData', form)

    const results = await batchImportGrievances(form)

    console.log('BatchImportUpsert', results)
    
    // Store results for display
    const failedRecordsArray = results.failedRecords || []
    importResults.value = {
      totalRecords: results.totalRecords || dta.length,
      successfulRecords: results.successfulRecords || results.insertedDocuments?.length || 0,
      failedRecords: Array.isArray(failedRecordsArray) ? failedRecordsArray.length : (typeof results.failedRecords === 'number' ? results.failedRecords : 0),
      insertedDocuments: results.insertedDocuments || [],
      failedRecordsArray: failedRecordsArray,
      message: results.message || 'Import completed'
    }
    
    showImportResults.value = true
    
    // Show appropriate message based on results
    if (importResults.value.failedRecords > 0) {
      ElMessage({
        message: `Import completed with ${importResults.value.failedRecords} failed record(s). Check details below.`,
        type: 'warning',
        duration: 5000
      })
    } else {
      ElMessage({
        message: `Successfully imported ${importResults.value.successfulRecords} record(s).`,
        type: 'success'
      })
    }
    
    return results
  } catch (error) {
    console.error('Import error:', error)
    throw error
  }
}





const handleCsvUpload = async (file: any) => {
  // Store the file in the file list
  if (file.raw) {
    uploadFileList.value = [file]
    parsedData.value = [] // Clear previous data
    importResults.value = null
    showImportResults.value = false
  }
}

const parsedData = ref([])

const parseCSV = async (file: File) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (result) => {
        parsedData.value = result.data;
        console.log('parsedData.value', parsedData.value)
        resolve(result.data)
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        ElMessage({
          message: 'Error parsing CSV file. Please check the file format.',
          type: 'error'
        })
        reject(error)
      },
    });
  })
}

const handleRemoveFile = () => {
  uploadFileList.value = []
  parsedData.value = []
  importResults.value = null
  showImportResults.value = false
}

const submitImport = async () => {
  if (uploadFileList.value.length === 0 || !uploadFileList.value[0].raw) {
    ElMessage({
      message: 'Please select a CSV file to upload',
      type: 'warning'
    })
    return
  }

  try {
    isUploading.value = true
    showImportResults.value = false
    
    // Parse the CSV file
    isParsing.value = true
    await parseCSV(uploadFileList.value[0].raw)
    // Parsing is complete, set flag to false
    isParsing.value = false
    
    // Small delay to ensure UI updates
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Import the grievances
    await ImportGrievances()
    
    // Show success message
    ElMessage({
      message: 'Import completed successfully!',
      type: 'success'
    })
    
    // Refresh the data
    await getFilteredData(filters.value, filterValues.value)
    await getCounts()
    
  } catch (error) {
    console.error('Import error:', error)
    isParsing.value = false
    ElMessage({
      message: 'Error importing grievances. Please check the console for details.',
      type: 'error'
    })
  } finally {
    isUploading.value = false
    isParsing.value = false
  }
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

  loading.value = true

  const formData = {}
  formData.limit = pageSize.value
  formData.page = page.value
  formData.curUser = 1
  formData.model = model
  formData.searchField = 'name'
  formData.searchString = searchKey
  formData.filters = filters.value
  formData.filterValues = filterValues.value
  formData.filterFunctions = filterFunction.value

  const associatedModels = [...associated_multiple_models]
  if (activeSegment.value === 'Deleted') {
    associatedModels.push('grievance_history')
  }
  formData.associated_multiple_models = associatedModels
  formData.nested_models = []

  formData.filterFunctions = [];
  for (let i = 0; i < formData.filterValues.length; i++) {
    const val = formData.filterValues[i];
    
    if (!Array.isArray(val)) {
      formData.filterValues[i] = [val];
    } else if (val.length === 0) {
      continue;
    }
    
    formData.filterFunctions.push('in');
  }
  
  const validIndices = [];
  for (let i = 0; i < formData.filterValues.length; i++) {
    if (Array.isArray(formData.filterValues[i]) && formData.filterValues[i].length > 0) {
      validIndices.push(i);
    }
  }
  
  formData.filters = validIndices.map(i => formData.filters[i]);
  formData.filterValues = validIndices.map(i => formData.filterValues[i]);
  formData.filterFunctions = validIndices.map(i => formData.filterFunctions[i]);

  if (!canViewDeletedGrievances.value) {
    const statusIndex = formData.filters.indexOf('status');
    if (statusIndex !== -1) {
      const statusValues = formData.filterValues[statusIndex];
      if (Array.isArray(statusValues)) {
        formData.filterValues[statusIndex] = statusValues.filter(s => s !== 'Deleted');
        if (formData.filterValues[statusIndex].length === 0) {
          formData.filters.splice(statusIndex, 1);
          formData.filterValues.splice(statusIndex, 1);
          formData.filterFunctions.splice(statusIndex, 1);
        }
      }
    } else {
      formData.filters.push('status');
      formData.filterValues.push(['Deleted']);
      formData.filterFunctions.push('notIn');
    }
  }

  console.log('SeacrchByKey_', formData)

  try {
    const res = await getByKeyword(formData)

    console.log('---->', res.data)

    tableDataList.value = res.data
    total.value = res.total
    
    if (activeSegment.value === 'Deleted') {
      await fetchDeletionHistory()
    }
    
    await getCounts()
  } catch (error) {
    console.error('Error searching grievances:', error)
    ElMessage({
      message: 'Search failed. Please try again.',
      type: 'error'
    })
  } finally {
    loading.value = false
  }
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
  
  // Clear deletion history map when switching segments
  if (activeSegment.value !== 'Deleted') {
    deletionHistoryMap.value = {}
  }

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

  } else if (activeSegment.value === "ExternalReferral") {
    var selectOption = 'status'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
      filterFunction.value.push('in')
    }
    var index = filters.value.indexOf(selectOption)
    filterValues.value[index] = ['ExternalReferral']

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
const permanentDeleting = ref(false)

function handleSelectionChange(selection) {
  selectedRows.value = selection
}

const isRowSelected = (row: GrievanceType) => {
  return selectedRows.value.some((selected: GrievanceType) => selected.id === row.id)
}

const toggleMobileSelection = (row: GrievanceType) => {
  const index = selectedRows.value.findIndex((selected: GrievanceType) => selected.id === row.id)
  if (index !== -1) {
    selectedRows.value.splice(index, 1)
  } else {
    selectedRows.value.push(row)
  }
}

const showReferralDialog = ref(false)
async function handleBulkAction() {
  if (selectedRows.value.length === 0) {
    ElMessage({
      message: 'Please select at least one grievance to refer',
      type: 'warning'
    })
    return
  }

  console.log('Bulk Action on:', selectedRows.value)

  // Extract unique county IDs from selected rows
  let countyIds = [...new Set(selectedRows.value.map(row => row.county?.id))].filter(Boolean)

  // County GRMs should only refer to officers within their own county
  if (isCountyStaff.value) {
    if (userCountyId.value) {
      countyIds = [userCountyId.value]
    } else {
      countyIds = []
    }
  }

  console.log('Resolved county IDs for referral:', countyIds)

  showReferralDialog.value = true
  await getGRMUsers(countyIds)
}

// Bulk delete function
const handleBulkDelete = () => {
  if (selectedRows.value.length === 0) {
    ElMessage({
      message: 'No grievances selected',
      type: 'warning'
    })
    return
  }

  ElMessageBox.confirm(
    `Are you sure you want to delete ${selectedRows.value.length} selected grievance(s)? This action cannot be undone.`,
    'Confirm Delete',
    {
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      type: 'warning',
      dangerouslyUseHTMLString: false
    }
  ).then(async () => {
    await performBulkDelete()
  }).catch(() => {
    // User cancelled
  })
}

// Perform the actual bulk delete
const deleting = ref(false)
const performBulkDelete = async () => {
  deleting.value = true
  const deletePromises = selectedRows.value.map(grievance => {
    return deleteCascade({
      model: 'grievance',
      id: grievance.id
    })
  })

  try {
    const results = await Promise.allSettled(deletePromises)
    
    // Count successful and failed deletions
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    // Remove successfully deleted grievances from the table
    const deletedIds = selectedRows.value
      .filter((_, index) => results[index].status === 'fulfilled')
      .map(g => g.id)
    
    tableDataList.value = tableDataList.value.filter(g => !deletedIds.includes(g.id))
    
    // Clear selection
    selectedRows.value = []

    // Show success/error message
    if (successful > 0 && failed === 0) {
      ElMessage({
        message: `Successfully deleted ${successful} grievance(s)`,
        type: 'success'
      })
    } else if (successful > 0 && failed > 0) {
      ElMessage({
        message: `Deleted ${successful} grievance(s), but ${failed} failed`,
        type: 'warning'
      })
    } else {
      ElMessage({
        message: `Failed to delete ${failed} grievance(s)`,
        type: 'error'
      })
    }

    // Refresh the data and counts
    await getFilteredData(filters.value, filterValues.value)
    await getCounts()
  } catch (error) {
    console.error('Error during bulk delete:', error)
    ElMessage({
      message: 'An error occurred while deleting grievances',
      type: 'error'
    })
  } finally {
    deleting.value = false
  }
}

const cascadeDeleteGrievances = async (ids: Array<string | number>) => {
  if (ids.length === 0) {
    ElMessage({
      message: 'No grievances to delete',
      type: 'warning'
    })
    return
  }

  permanentDeleting.value = true

  try {
    const results = await Promise.allSettled(
      ids.map(id =>
        deleteCascade({
          model: 'grievance',
          id,
          permanentDelete: true
        })
      )
    )

    const successful = results.filter(result => result.status === 'fulfilled').length
    const failed = results.length - successful

    if (successful > 0 && failed === 0) {
      ElMessage({
        message: `Deleted ${successful} grievance(s) permanently`,
        type: 'success'
      })
    } else if (successful > 0 && failed > 0) {
      ElMessage({
        message: `Deleted ${successful} grievance(s), ${failed} failed`,
        type: 'warning'
      })
    } else {
      ElMessage({
        message: 'Failed to delete grievances',
        type: 'error'
      })
    }

    selectedRows.value = []
    await getFilteredData(filters.value, filterValues.value)
    await getCounts()
  } catch (error) {
    console.error('Error permanently deleting grievances:', error)
    ElMessage({
      message: 'Unable to delete grievances. Please try again.',
      type: 'error'
    })
  } finally {
    permanentDeleting.value = false
  }
}

const permanentlyDeleteSelected = async () => {
  if (!isRootAdmin.value || activeSegment.value !== 'Deleted') {
    ElMessage({
      message: 'Permanent delete is only available for root admins in the Deleted segment',
      type: 'warning'
    })
    return
  }

  if (selectedRows.value.length === 0) {
    ElMessage({
      message: 'Please select at least one grievance',
      type: 'warning'
    })
    return
  }

  try {
    await ElMessageBox.confirm(
      `This will permanently delete ${selectedRows.value.length} selected grievance(s). Continue?`,
      'Confirm Permanent Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )
  } catch (error) {
    return
  }

  const ids = selectedRows.value.map(grievance => grievance.id)
  await cascadeDeleteGrievances(ids)
}

const fetchAllDeletedGrievanceIds = async (): Promise<Array<string | number>> => {
  const limit = total.value > 0 ? total.value : 1000
  const formData = buildGrievanceRequestFormData(filters.value, filterValues.value, {
    includeHistory: true,
    limit,
    page: 1
  })

  const res = await getGrievances(formData)
  if (res?.data && Array.isArray(res.data)) {
    return res.data.map((item: GrievanceType) => item.id)
  }

  return []
}

const permanentlyDeleteAll = async () => {
  if (!isRootAdmin.value || activeSegment.value !== 'Deleted') {
    ElMessage({
      message: 'Permanent delete is only available for root admins in the Deleted segment',
      type: 'warning'
    })
    return
  }

  try {
    await ElMessageBox.confirm(
      'This will permanently delete all deleted grievances in the current filter. This action cannot be undone. Continue?',
      'Delete All Permanently',
      {
        confirmButtonText: 'Delete All',
        cancelButtonText: 'Cancel',
        type: 'warning',
        dangerouslyUseHTMLString: false
      }
    )
  } catch (error) {
    return
  }

  const ids = await fetchAllDeletedGrievanceIds()
  await cascadeDeleteGrievances(ids)
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
        if (!value) {
          callback(new Error("Phone is required"));
          return;
        }
        
        const validation = validateInternationalPhone(value);
        if (!validation.isValid) {
          callback(new Error(validation.error));
          return;
        }
        
        callback();
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



const canUseRowSelection = computed(() => {
  if (activeSegment.value === 'Deleted') {
    return isRootAdmin.value
  }
  return !['Closed', 'Resolved', 'In Court', 'Deleted', 'Rejected'].includes(activeSegment.value)
})

const isRowSelectable = () => {
  if (activeSegment.value === 'Deleted') {
    return isRootAdmin.value
  }
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


 

const projectPhaseOptions = [
  { label: 'KISIP 2', value: 'KISIP 2' },
  { label: 'KISIP 1', value: 'KISIP 1' },
]

const confirmationStatusOptions = [
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Awaiting Confirmation', value: 'awaiting' },
]

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

// Filter by confirmation status
const filterByConfirmationStatus = async (status: string | null) => {
  if (status !== null && status !== undefined) {
    selectedConfirmationStatus.value = status;
  }

  const selectOption = 'confirmed_by_national_grm';
  const index = filters.value.indexOf(selectOption);

  if (selectedConfirmationStatus.value) {
    // Ensure the filter key exists
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption);
      filterFunction.value.push('eq');
    }

    // Convert status to boolean value
    const filterIndex = filters.value.indexOf(selectOption);
    if (selectedConfirmationStatus.value === 'confirmed') {
      filterValues.value[filterIndex] = [true];
    } else if (selectedConfirmationStatus.value === 'awaiting') {
      filterValues.value[filterIndex] = [false];
    }
  } else {
    // Remove filter if no status selected
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
         (isNationalGRM.value && selectedCounty.value) || 
         selectedSubCounty.value || 
         selectedWard.value || 
         referredOfficerSearch.value ||
         selectedConfirmationStatus.value
})

const activeFilterCount = computed(() => {
  let count = 0
  if (selectedCategories.value.length > 0) count++
  if (isNationalGRM.value && selectedCounty.value) count++
  if (selectedSubCounty.value) count++
  if (selectedWard.value) count++
  if (referredOfficerSearch.value) count++
  if (selectedConfirmationStatus.value) count++
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

const clearConfirmationStatusFilter = () => {
  selectedConfirmationStatus.value = null
  filterByConfirmationStatus(null)
}

// Clear all filters method
const clearAllFilters = async () => {
  // Get role-based location filters from user roles
  let roleBasedLocationFilter: { field: string, value: any } | null = null
  
  if (!isSuperAdmin.value && !isNationalStaff.value) {
    // Check user roles to get location-based filter
    const grmRole = userInfo.roles?.find(role => 
      role.name === "grm" || 
      role.name === "admin" || 
      role.name === "root_admin" || 
      role.name === "super_admin" || 
      role.name === "staff"
    )
    
    if (grmRole && grmRole.user_roles) {
      const level = grmRole.user_roles.location_level
      
      if (level === "county" && grmRole.user_roles.county_id) {
        roleBasedLocationFilter = {
          field: "county_id",
          value: grmRole.user_roles.county_id
        }
      } else if (level === "settlement" && grmRole.user_roles.settlement_id) {
        roleBasedLocationFilter = {
          field: "settlement_id",
          value: grmRole.user_roles.settlement_id
        }
      } else if (level && grmRole.user_roles.location_id) {
        roleBasedLocationFilter = {
          field: "location_id",
          value: grmRole.user_roles.location_id
        }
      }
    }
  }
  
  // Reset all filter selections properly (except role-based location filters)
  selectedCategories.value = []
  // Only clear county if it's not a role-based filter
  if (!isCountyStaff.value) {
    selectedCounty.value = null
  }
  selectedSubCounty.value = null
  selectedWard.value = null
  referredOfficerSearch.value = ''
  selectedConfirmationStatus.value = null
  search_string.value = ''
  
  // Clear the underlying filter arrays, but preserve role-based location filters
  filterValues.value = []
  filters.value = []
  filterFunction.value = []
  
  // Restore role-based location filter if it exists
  if (roleBasedLocationFilter) {
    filters.value.push(roleBasedLocationFilter.field)
    filterValues.value.push([roleBasedLocationFilter.value])
    filterFunction.value.push('in')
    
    // Also update selectedCounty if it's a county filter
    if (roleBasedLocationFilter.field === 'county_id' && isCountyStaff.value) {
      selectedCounty.value = roleBasedLocationFilter.value
    }
  }
  
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
  
  // Apply confirmation status filter if it has a value
  if (selectedConfirmationStatus.value) {
    await filterByConfirmationStatus(selectedConfirmationStatus.value)
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

const getMobileLocation = (row: GrievanceType) => {
  const segments = [
    row.settlement?.name,
    row.county?.name
  ].filter(Boolean)

  return segments.join(', ') || 'N/A'
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

// Confirmation dialog state
const showConfirmationDialog = ref(false)
const confirmationForm = ref({
  grievance_id: null,
  confirmation_level: '',
  confirmation_notes: ''
})
const selectedGrievanceForConfirmation = ref<GrievanceType | null>(null)

// Open confirmation dialog
const openConfirmationDialog = (grievance: GrievanceType) => {
  selectedGrievanceForConfirmation.value = grievance
  confirmationForm.value = {
    grievance_id: grievance.id,
    confirmation_level: grievance.current_level || '',
    confirmation_notes: ''
  }
  showConfirmationDialog.value = true
}

// Confirm grievance resolution
const handleConfirmResolution = async () => {
  if (!confirmationForm.value.grievance_id || !confirmationForm.value.confirmation_level) {
    ElMessage({
      message: 'Please provide all required information',
      type: 'warning'
    })
    return
  }

  try {
    const res = await confirmGrievanceResolution(confirmationForm.value)
    
    ElMessage({
      message: res.message || 'Grievance resolution confirmed successfully',
      type: 'success'
    })

    showConfirmationDialog.value = false
    
    // Refresh the data
    await getFilteredData(filters.value, filterValues.value)
    await getCounts()
  } catch (error: any) {
    console.error('Error confirming resolution:', error)
    ElMessage({
      message: error.response?.data?.message || 'Failed to confirm resolution',
      type: 'error'
    })
  }
}

// Check if grievance can be confirmed
const canConfirmGrievance = (grievance: GrievanceType): boolean => {
  return isNationalGRM.value && 
         grievance.status === 'Resolved' && 
         ['settlement', 'county'].includes(grievance.current_level) &&
         !grievance.confirmed_by_national_grm
}

// Check if grievance is awaiting confirmation
const isAwaitingConfirmation = (grievance: GrievanceType): boolean => {
  return grievance.status === 'Resolved' && 
         ['settlement', 'county'].includes(grievance.current_level) &&
         !grievance.confirmed_by_national_grm
}

</script>

<template>
  <div class="grievance-dashboard">
    <!-- Main Content Card -->
    <el-card class="main-content-card">
      <template #header>
        <div class="card-header">
          <!-- Header Top Row: Title and Actions -->
            <el-row :gutter="12" align="middle" class="header-row">
              <el-col :xs="isMobile ? 4 : 24" :sm="24" :md="2"  :lg="2">
                <el-button
                  type="primary"
                  plain
                  :icon="Back"
                  @click="goBack"
                  class="header-back-btn"
                  :class="{ 'header-back-btn--mobile': isMobile }"
                  aria-label="Go back"
                >
                  <span v-if="!isMobile">Back</span>
                </el-button>
              </el-col>
              <el-col :xs="isMobile ? 20 : 24" :sm="24" :md="18"  :lg="18">
                <div class="header-search" :class="{ 'header-search--mobile': isMobile }">
                  <el-input
                    v-model="searchQuery"
                    placeholder="Search grievances by code, description, or complainant name..."
                    clearable
                    class="header-search-input"
                  >
                    <template #append>
                      <el-icon :class="{ 'is-loading': isSearching }" class="search-spinner">
                        <Loading />
                      </el-icon>
                      <el-button :icon="Search" @click="performSearch(searchQuery)" />
                    </template>
                  </el-input>
                </div>
              </el-col>
              <el-col :xs="24" :sm="24" :md="4"  :lg="4" >
                <div class="header-actions">
                  <div class="total-download-group">
                    <div class="total-count-badge">
                      <div class="count-number">{{ totalGrievanceCount }}</div>
                      <div class="count-label">Total Grievances</div>
                    </div>
                    <DownloadCustom
                      :data="tableDataList"
                      :model="model"
                      :associated_models="['users','county','subcounty','ward','settlement']"
                      :filters="downloadFilters.filters"
                      :filterValues="downloadFilters.filterValues"
                      :filterFunctions="downloadFilters.filterFunctions"
                      class="action-button"
                    />
                  </div>
                  <PermissionWrapper :permissions="['grievance:upload']">
                    <el-tooltip content="Upload data / Download template" placement="top">
                      <el-button
                        type="primary"
                        plain
                        @click="uploadData"
                      >
                        <el-icon><Upload /></el-icon>
                      </el-button>
                    </el-tooltip>
                  </PermissionWrapper>
                  <template>
                    <el-tooltip content="Upload data / Download template" placement="top">
                      <el-button
                        type="primary"
                        plain
                        @click="uploadData"
                      >
                        <el-icon><Upload /></el-icon>
                      </el-button>
                    </el-tooltip>
                  </template>
                </div>
              </el-col>
            </el-row>
 
        <!-- Header Bottom Row: Status Cards -->
        <div class="status-cards-container" v-if="!isMobile">
          <div class="status-cards">
            <template v-for="status in visibleStatuses" :key="status.value">
              <el-tooltip
                :content="status.description"
                placement="bottom"
                effect="light"
                popper-class="status-success-tooltip"
                :manual="true"
                trigger="manual"
                v-model:visible="statusTooltipVisible[status.value]"
                v-if="!['All', 'Deleted'].includes(status.value) && status.value !== 'Rejected'"
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
              
              <el-tooltip
                v-else-if="status.value === 'Rejected'"
                :content="status.description"
                placement="bottom"
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
              <PermissionWrapper 
                v-else-if="status.value === 'Deleted'"
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

        <div v-else class="mobile-status-scroll">
          <div class="mobile-status-track">
            <template v-for="status in visibleStatuses" :key="status.value">
              <div
                v-if="!['All', 'Deleted'].includes(status.value) && status.value !== 'Rejected'"
                :class="['mobile-status-card', { active: activeSegment === status.value }]"
                @click="onSegmentClick(status.value)"
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
              <div
                v-else-if="status.value === 'Rejected'"
                :class="['mobile-status-card', { active: activeSegment === status.value }]"
                @click="onSegmentClick(status.value)"
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
              <PermissionWrapper
                v-else-if="status.value === 'Deleted'"
                :permissions="['grievance:viewDeleted']"
              >
                <div
                  :class="['mobile-status-card', { active: activeSegment === status.value }]"
                  @click="onSegmentClick(status.value)"
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
              v-if="selectedCounty && isNationalGRM" 
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
            <el-tag 
              v-if="selectedConfirmationStatus" 
              size="small" 
              type="info" 
              closable 
              @close="clearConfirmationStatusFilter"
            >
              Confirmation: {{ selectedConfirmationStatus === 'confirmed' ? 'Confirmed' : 'Awaiting' }}
            </el-tag>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="quick-actions" :class="{ 'mobile-quick-actions': isMobile }">
            <el-button 
            v-if="hasActiveFilters" 
            size="small" 
            type="warning" 
            :icon="Refresh" 
            @click="handleClear"
          >
            Clear Filters
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
            <el-button 
              v-if="selectedRows.length > 0 && isSuperAdmin && !['Deleted'].includes(activeSegment)"
              type="danger" 
              :icon="Delete"
              size="small"
              @click="handleBulkDelete"
            >
              Delete ({{ selectedRows.length }})
            </el-button>
            <el-button
              v-if="activeSegment === 'Deleted' && isRootAdmin"
              type="danger"
              :icon="Delete"
              size="small"
              :loading="permanentDeleting"
              :disabled="selectedRows.length === 0"
              @click="permanentlyDeleteSelected"
            >
              Delete Selected Permanently ({{ selectedRows.length }})
            </el-button>
            <el-button
              v-if="activeSegment === 'Deleted' && isRootAdmin"
              type="danger"
              :icon="Delete"
              size="small"
              :loading="permanentDeleting"
              @click="permanentlyDeleteAll"
            >
              Delete All ({{ total }})
            </el-button>
        </div>
      </div>

      <!-- Enhanced Table -->
      <el-table
        v-if="!isMobile"
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
          v-if="canUseRowSelection"
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
                <el-tag v-if="row.project_phase" size="small" type="warning" style="margin-left:6px;">
                  {{ row.project_phase }}
                </el-tag>
                <!-- Confirmation status badge - Show for all resolved grievances at settlement/county level -->
                <el-tag 
                  v-if="row.status === 'Resolved' && row.current_level && ['settlement', 'county'].includes(String(row.current_level).toLowerCase())"
                  size="small" 
                  :type="row.confirmed_by_national_grm ? 'success' : 'warning'" 
                  style="margin-left:6px;"
                >
                  {{ row.confirmed_by_national_grm ? 'Confirmed' : 'Awaiting Confirmation' }}
                </el-tag>
              </div>
              <!-- Show deleter name in Deleted tab -->
              <div v-if="activeSegment === 'Deleted'" class="deleter-info" style="margin-top: 6px; font-size: 12px; color: #909399;">
                <span style="font-weight: 500;">Deleted by:</span> {{ getDeleterName(row) }}
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

        <el-table-column v-if="['Resolved'].includes(activeSegment)" prop="resolution" label="Resolution" min-width="300">
          <template #default="{ row }">
            <div class="resolution-text">
              {{ row.resolution || 'No resolution details' }}
            </div>
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

      <div v-else class="mobile-grievance-list">
        <div
          v-for="row in tableDataList"
          :key="row.id"
          class="mobile-grievance-card"
          @click="handleRowClick(row)"
        >
          <div class="mobile-card-header">
            <div class="card-code">{{ row.code }}</div>
            <el-tag size="small" :type="getStatusType(row.status)">
              {{ row.status }}
            </el-tag>
          </div>
          <div class="mobile-card-body">
            <p class="card-description">{{ row.description }}</p>
            <div class="card-row">
              <span class="card-label">Location</span>
              <span class="card-value">{{ getMobileLocation(row) }}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Reported</span>
              <span class="card-value">{{ formatDate(row.date_reported) }}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Deadline</span>
              <span class="card-value" :class="getExpiryClass(row.status_expiry_date)">
                {{ formatExpiryPhrase(row.status_expiry_date) }}
              </span>
            </div>
            <div
              class="card-row"
              v-if="activeSegment === 'Resolved' && row.resolution"
            >
              <span class="card-label">Resolution</span>
              <span class="card-value">{{ row.resolution }}</span>
            </div>
          </div>
          <div class="mobile-card-footer">
            <el-checkbox
              v-if="canUseRowSelection && isRowSelectable()"
              :model-value="isRowSelected(row)"
              @change="toggleMobileSelection(row)"
              @click.stop
              size="small"
            >
              Select
            </el-checkbox>
            <el-button type="primary" text size="small" @click.stop="handleRowClick(row)">
              View Details
            </el-button>
          </div>
        </div>
      </div>

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
    class="grievance-drawer"
  >
    <!-- Custom Header -->
    <div class="drawer-header">
      <div class="header-content">
        <div class="header-icon">
          <el-icon :size="isMobile ? 20 : 24">
            <Plus />
          </el-icon>
        </div>
        <div class="header-text">
          <h3>File a Grievance</h3>
          <p v-if="!isMobile">Create a new grievance complaint</p>
        </div>
      </div>
      <el-button 
        type="text" 
        @click="AddDialogVisible = false"
        class="close-button"
        :size="isMobile ? 'small' : 'default'"
      >
        <el-icon :size="isMobile ? 18 : 20">
          <Close />
        </el-icon>
      </el-button>
    </div>

    <div class="drawer-content">
      <el-steps 
        :active="active" 
        finish-status="success" 
        :class="['drawer-steps', { 'drawer-steps--icons-only': isMobile }]"
        direction="horizontal"
        :space="isMobile ? 80 : undefined"
      >
        <el-step :title="isMobile ? '' : 'Complainant Details'" :icon="Document" />
        <el-step :title="isMobile ? '' : 'Grievance Details'" :icon="InfoFilled" />
        <el-step :title="isMobile ? '' : 'Complaint Details'" :icon="Paperclip" />
        <el-step :title="isMobile ? '' : 'Review & Submit'" :icon="CircleCheck" />
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
          <el-row :gutter="8">
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn1" label="Name of Complainant(s)" prop="name">
                <el-input v-model="grmForm.name" type="textarea" :rows="2" placeholder="Enter one or more names (separate by comma). Provide complainant's full name(s) as on National ID. Fill Anonymous for anonymity." />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn2" label="Gender" prop="gender">
                <el-select v-model="grmForm.gender" placeholder="Select the complainant's gender" style="width: 100%;" filterable>
                  <el-option label="Male" value="male" />
                  <el-option label="Female" value="female" />
                  <el-option label="Other" value="other" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn3" label="Age Bracket" prop="age">
                <el-select v-model="grmForm.age" placeholder="Select the complainant's age bracket" style="width: 100%;" filterable>
                  <el-option v-for="range in ageRanges" :key="range.value" :label="range.label" :value="range.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn4" label="National ID" prop="national_id">
                <el-input v-model="grmForm.national_id" placeholder="Enter complainant's national ID (required especially for land related complaints)" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn5" label="Phone Number" prop="phone">
                <el-input
                  v-model="grmForm.phone"
                  placeholder="Enter complainant's phone number (254.....) - we will use this to communicate about the complaint status"
                  @input="convertPhoneNumber(grmForm.phone)"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn7" label="Date Reported" prop="date_reported">
                <el-date-picker
                  v-model="grmForm.date_reported"
                  type="date"
                  placeholder="Select date reported"
                  style="width: 100%;"
                  format="YYYY-MM-DD"
                  :disabled-date="disableFutureDates"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- Step 2: Grievance Details -->
        <div v-if="active === 1" class="form-step">
          <el-row :gutter="8">
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn10" label="County" prop="county_id">
                <el-select
                  v-model="grmForm.county_id"
                  placeholder="Select county"
                  style="width: 100%;"
                  filterable
                  @change="getSettlementByCounty(grmForm.county_id)"
                >
                  <el-option
                    v-for="item in countySelectOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn10a" label="Project Phase" prop="project_phase">
                <el-select
                  filterable
                  v-model="grmForm.project_phase"
                  placeholder="Select Project Phase (KISIP 1 or KISIP 2)"
                  style="width: 100%;"
                >
                  <el-option
                    v-for="item in projectPhaseOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn11" prop="settlement_id">
                <template #label>
                  Settlement
                  <span v-if="isFilteringSettlements" class="loading-dots" aria-live="polite" aria-busy="true">
                    <span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
                  </span>
                </template>
                <el-select
                  v-model="grmForm.settlement_id"
                  :placeholder="isFilteringSettlements ? 'Filtering settlements…' : 'Select settlement'"
                  :disabled="!grmForm.county_id || isFilteringSettlements"
                  :loading="isFilteringSettlements"
                  style="width: 100%;"
                  filterable
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
              <el-form-item id="btn12" label="Physical Address" prop="address">
                <el-input v-model="grmForm.address" placeholder="Enter complainant's physical address (e.g., near XXX Primary school, Plot No. XXX)" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn13" label="Is this complaint related to Gender-Based Violence?" prop="isgbv">
                <el-select v-model="grmForm.isgbv" placeholder="Select option" style="width: 100%;" filterable>
                  <el-option label="No" :value="false" />
                  <el-option label="Yes" :value="true" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn13a" label="Is this complaint currently in court?" prop="isInCourt">
                <el-select v-model="grmForm.isInCourt" placeholder="Select option" style="width: 100%;" filterable>
                  <el-option label="No" :value="false" />
                  <el-option label="Yes" :value="true" />
                </el-select>
              </el-form-item>
            </el-col>
            
            
          </el-row>
        </div>

        <!-- Step 3: Complaint Details -->
        <div v-if="active === 2" class="form-step">
          <el-row :gutter="8">
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn14" label="Nature of Complaint" prop="nature">
                <el-select v-model="grmForm.nature" placeholder="Select nature" style="width: 100%;" filterable>
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
                  :rows="isMobile ? 3 : 4"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="24">
              <el-form-item id="btn16" label="Plea/Request" prop="plea">
                <el-input
                  type="textarea"
                  v-model="grmForm.plea"
                  placeholder="Enter complainant's plea or request - what action would you like to be taken?"
                  :rows="isMobile ? 3 : 4"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- Step 4: Review & Submit -->
        <div v-if="active === 3" class="form-step">
          <el-row :gutter="8">
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
                  :rows="isMobile ? 3 : 4"
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
      <div class="drawer-footer" :class="{ 'mobile-footer': isMobile }">
        <el-button 
          id="btn8" 
          v-if="active === 0" 
          @click="resetForm"
          :size="isMobile ? 'small' : 'default'"
          :class="{ 'mobile-button': isMobile }"
        >
          Clear Form
        </el-button>
        <el-button 
          id="btn9" 
          v-if="active > 0" 
          @click="prev"
          :size="isMobile ? 'small' : 'default'"
          :class="{ 'mobile-button': isMobile }"
        >
          Previous
        </el-button>
        <el-button 
          id="btn7" 
          v-if="active < 3" 
          type="primary" 
          @click="next"
          :size="isMobile ? 'small' : 'default'"
          :class="{ 'mobile-button': isMobile }"
        >
          Next
        </el-button>
        <el-button 
          id="btn21" 
          v-if="active === 3" 
          type="primary" 
          @click="submitForm"
          :size="isMobile ? 'small' : 'default'"
          :class="{ 'mobile-button': isMobile }"
        >
          Submit
        </el-button>
        <el-button 
          @click="AddDialogVisible = false"
          :size="isMobile ? 'small' : 'default'"
          :class="{ 'mobile-button': isMobile }"
        >
          Cancel
        </el-button>
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
    :width="isMobile ? '90%' : '60%'"
    draggable
    :close-on-click-modal="false"
    :close-on-press-escape="!isUploading"
  >
    <div v-loading="isUploading" :element-loading-text="isParsing && isUploading ? 'Parsing CSV file...' : isUploading ? 'Importing grievances...' : ''">
      <!-- File Upload Section -->
      <div class="upload-section">
        <el-upload
          :auto-upload="false"
          :on-change="handleCsvUpload"
          :on-remove="handleRemoveFile"
          :file-list="uploadFileList"
          :limit="1"
          accept=".csv"
          :disabled="isUploading"
          drag
          class="upload-dragger"
        >
          <el-icon class="el-icon--upload"><Upload /></el-icon>
          <div class="el-upload__text">
            Drop CSV file here or <em>click to upload</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              <el-icon><InfoFilled /></el-icon>
              Please upload a CSV file with grievance data. Maximum file size: 10MB
            </div>
          </template>
        </el-upload>
      </div>

      <!-- File Info Section -->
      <div v-if="uploadFileList.length > 0" class="file-info-section">
        <el-card shadow="never" class="file-info-card">
          <template #header>
            <div class="file-info-header">
              <el-icon><Document /></el-icon>
              <span>Selected File</span>
            </div>
          </template>
          <div class="file-details">
            <div class="file-detail-item">
              <span class="label">File Name:</span>
              <span class="value">{{ uploadFileList[0].name }}</span>
            </div>
            <div class="file-detail-item" v-if="uploadFileList[0].size">
              <span class="label">File Size:</span>
              <span class="value">{{ (uploadFileList[0].size / 1024 / 1024).toFixed(2) }} MB</span>
            </div>
            <div class="file-detail-item" v-if="parsedData.length > 0">
              <span class="label">Records Found:</span>
              <span class="value">{{ parsedData.length }}</span>
            </div>
          </div>
        </el-card>
      </div>

      <!-- Import Results Section -->
      <div v-if="showImportResults && importResults" class="import-results-section">
        <el-card shadow="never" :class="['results-card', importResults.failedRecords > 0 ? 'has-errors' : 'success']">
          <template #header>
            <div class="results-header">
              <el-icon v-if="importResults.failedRecords === 0"><CircleCheck /></el-icon>
              <el-icon v-else><Warning /></el-icon>
              <span>Import Results</span>
            </div>
          </template>
          <div class="results-content">
            <div class="results-summary">
              <div class="summary-item">
                <span class="summary-label">Total Records:</span>
                <span class="summary-value">{{ importResults.totalRecords }}</span>
              </div>
              <div class="summary-item success">
                <span class="summary-label">Successful:</span>
                <span class="summary-value">{{ importResults.successfulRecords }}</span>
              </div>
              <div class="summary-item" v-if="importResults.failedRecords > 0" :class="importResults.failedRecords > 0 ? 'error' : ''">
                <span class="summary-label">Failed:</span>
                <span class="summary-value">{{ importResults.failedRecords }}</span>
              </div>
            </div>

            <!-- Failed Records Details -->
            <div v-if="importResults.failedRecords > 0 && importResults.failedRecordsArray?.length > 0" class="failed-records">
              <el-collapse>
                <el-collapse-item title="View Failed Records" name="failed">
                  <div class="failed-records-list">
                    <div 
                      v-for="(failed, index) in importResults.failedRecordsArray" 
                      :key="index"
                      class="failed-record-item"
                    >
                      <el-alert
                        :title="`Record ${index + 1}`"
                        :description="failed.error?.message || 'Unknown error'"
                        type="error"
                        :closable="false"
                        show-icon
                      >
                        <template #default>
                          <div class="failed-record-details">
                            <div class="error-message">
                              <strong>Error:</strong> {{ failed.error?.message || 'Unknown error' }}
                            </div>
                            <div v-if="failed.error?.detail" class="error-detail">
                              <strong>Details:</strong> {{ failed.error.detail }}
                            </div>
                            <div v-if="failed.record" class="error-record">
                              <strong>Record Data:</strong>
                              <pre>{{ JSON.stringify(failed.record, null, 2) }}</pre>
                            </div>
                          </div>
                        </template>
                      </el-alert>
                    </div>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </div>
        </el-card>
      </div>

      <!-- Action Buttons -->
      <div class="upload-actions">
        <el-button 
          type="info" 
          :icon="Download" 
          @click="DownloadTemplate"
          :disabled="isUploading"
        >
          Download Template
        </el-button>
        <div class="dialog-footer">
          <el-button 
            @click="uploadDialog = false"
            :disabled="isUploading"
          >
            {{ showImportResults ? 'Close' : 'Cancel' }}
          </el-button>
          <el-button 
            type="primary" 
            :icon="Upload"
            @click="submitImport"
            :loading="isUploading"
            :disabled="uploadFileList.length === 0 || isUploading"
          >
            {{ isUploading ? 'Importing...' : 'Import Grievances' }}
          </el-button>
        </div>
      </div>
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

        <!-- Confirmation Status Filter - Only show when Resolved segment is active -->
        <div class="filter-item" v-if="activeSegment === 'Resolved'">
          <label class="filter-label">Confirmation Status</label>
          <el-select
            v-model="selectedConfirmationStatus"
            clearable
            placeholder="Select confirmation status"
            size="small"
            style="width: 100%"
            @change="filterByConfirmationStatus"
          >
            <el-option
              v-for="item in confirmationStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-text type="info" size="small" style="display: block; margin-top: 4px;">
            Filter resolved grievances by confirmation status
          </el-text>
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

.mobile-status-scroll {
  margin-top: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.mobile-status-track {
  display: flex;
  gap: 10px;
  min-width: max-content;
}

.mobile-status-card {
  min-width: 140px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  background-color: var(--el-bg-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.mobile-status-card.active {
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
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.card-header .header-row {
  margin-bottom: 20px;
}

.card-header .total-download-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: nowrap;
}

.card-header .total-download-group .action-button {
  flex-shrink: 0;
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
  width: 100%;
}

.header-search-input {
  width: 100%;
}

.header-search--mobile {
  width: 100%;
}

.header-back-btn--mobile {
  padding: 6px;
  min-width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-spinner {
  margin-right: 6px;
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
  width: auto;
  font-size: 12px;
  padding: 6px 12px;
  min-width: 120px;
}
.action-button.icon-only {
  width: auto;
  padding: 6px;
}
.action-button.icon-only :deep(.el-icon) {
  font-size: 16px;
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

.resolution-text {
  color: #606266;
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
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
.grievance-drawer :deep(.el-drawer__body) {
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
  }

.drawer-header .header-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.drawer-header .header-icon {
  color: #409eff;
  flex-shrink: 0;
}

.drawer-header .header-text {
  min-width: 0;
  flex: 1;
}

.drawer-header .header-text h3 {
  margin: 0 0 2px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  line-height: 1.3;
  word-wrap: break-word;
}

.drawer-header .header-text p {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.4;
}

.close-button {
  color: #909399;
  flex-shrink: 0;
  padding: 4px;
}

.close-button:hover {
  color: #409eff;
}

.drawer-content {
  padding: 16px 20px;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.drawer-steps {
  margin-bottom: 20px;
}

.drawer-steps :deep(.el-step__title) {
  font-size: 13px;
  line-height: 1.4;
}

.drawer-steps :deep(.el-step__description) {
  font-size: 12px;
}

.grievance-form {
  margin-bottom: 20px;
}

.form-step {
  margin-bottom: 16px;
}

.drawer-footer {
  position: sticky;
  bottom: 0;
  padding: 12px 16px;
   border-top: 1px solid #e9ecef;

  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
  z-index: 10;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
}

.drawer-footer.mobile-footer {
  flex-direction: column;
  gap: 8px;
  padding: 12px;
}

.drawer-footer.mobile-footer .mobile-button {
  width: 100%;
  margin: 0;
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

.mobile-quick-actions {
  flex-wrap: wrap;
}

.mobile-quick-actions .el-button {
  flex: 1 1 100%;
  margin: 4px 0;
}

.mobile-grievance-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-grievance-card {
  background-color: var(--el-bg-color);
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mobile-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.mobile-card-header .card-code {
  font-weight: 600;
  font-size: 15px;
  color: var(--el-text-color-primary);
}

.mobile-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-description {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-regular);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.card-label {
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.card-value {
  flex: 1;
  text-align: left;
  color: var(--el-text-color-primary);
}

.mobile-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.mobile-card-footer .el-button {
  padding: 0;
  margin-left: auto;
}

@media (min-width: 769px) {
  .mobile-grievance-list {
    display: none;
  }
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
  
  .card-header .total-download-group {
    width: 100%;
    justify-content: space-between;
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
  
  .drawer-header {
    padding: 12px 16px;
  }
  
  .drawer-header .header-text h3 {
    font-size: 16px;
  }
  
  .drawer-header .header-text p {
    font-size: 12px;
  }
  
  .drawer-content {
    padding: 12px 16px;
    height: calc(100vh - 140px);
  }
  
  .drawer-steps {
    margin-bottom: 16px;
  }
  
  .drawer-steps :deep(.el-step__title) {
    font-size: 12px;
  }
  
  .drawer-steps :deep(.el-step__head) {
    width: 24px;
    height: 24px;
  }
  
  .drawer-steps :deep(.el-step__icon) {
    width: 24px;
    height: 24px;
    font-size: 12px;
  }
  
  .drawer-steps :deep(.el-step__line) {
    top: 12px;
  }
  
  .grievance-form {
    margin-bottom: 16px;
  }
  
  .form-step {
    margin-bottom: 12px;
  }
  
  .drawer-footer {
    padding: 10px 12px;
    gap: 6px;
  }
  
  .drawer-footer.mobile-footer {
    padding: 10px;
  }
}

@media (max-width: 480px) {
  .drawer-header {
    padding: 10px 12px;
  }
  
  .drawer-header .header-content {
    gap: 8px;
  }
  
  .drawer-header .header-text h3 {
    font-size: 15px;
  }
  
  .drawer-content {
    padding: 10px 12px;
    height: calc(100vh - 120px);
  }
  
  .drawer-steps {
    margin-bottom: 12px;
  }
  
  .drawer-steps :deep(.el-step__title) {
    font-size: 11px;
  }
  
  .drawer-steps :deep(.el-step__head) {
    width: 20px;
    height: 20px;
  }
  
  .drawer-steps :deep(.el-step__icon) {
    width: 20px;
    height: 20px;
    font-size: 11px;
  }
  
  .drawer-steps :deep(.el-step__line) {
    top: 10px;
  }
  
  .grievance-form :deep(.el-form-item) {
    margin-bottom: 12px;
  }
  
  .grievance-form :deep(.el-form-item__label) {
    font-size: 13px;
    margin-bottom: 4px;
    padding-bottom: 0;
  }
  
  .grievance-form :deep(.el-input__wrapper),
  .grievance-form :deep(.el-textarea__inner),
  .grievance-form :deep(.el-select .el-input__wrapper) {
    padding: 4px 8px;
    min-height: 32px;
  }
  
  .grievance-form :deep(.el-input__inner) {
    height: 30px;
    font-size: 14px;
  }
  
  .grievance-form :deep(.el-textarea__inner) {
    padding: 6px 8px;
    font-size: 14px;
    line-height: 1.5;
  }
  
  .drawer-footer {
    padding: 8px 10px;
    gap: 6px;
  }
  
  .drawer-footer.mobile-footer {
    padding: 8px;
  }
  
  .drawer-footer .el-button {
    font-size: 13px;
    padding: 8px 12px;
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

/* Compact form tweaks */
.grievance-form :deep(.el-form-item) {
  margin-bottom: 8px;
}
.grievance-form :deep(.el-input__wrapper),
.grievance-form :deep(.el-textarea__inner),
.grievance-form :deep(.el-select .el-input__wrapper) {
  padding: 2px 8px;
  min-height: 28px;
}
.grievance-form :deep(.el-input__inner) {
  height: 26px;
}
.grievance-form :deep(.el-textarea__inner) {
  padding: 6px 8px;
}

/* Animated dots shown next to Settlement label while filtering */
.loading-dots {
  display: inline-block;
  margin-left: 6px;
}
.loading-dots .dot {
  display: inline-block;
  animation: loading-blink 1.4s infinite both;
}
.loading-dots .dot:nth-child(2) {
  animation-delay: .2s;
}
.loading-dots .dot:nth-child(3) {
  animation-delay: .4s;
}
@keyframes loading-blink {
  0% { opacity: 0.2; }
  20% { opacity: 1; }
  100% { opacity: 0.2; }
}

/* Upload Dialog Styles */
.upload-section {
  margin-bottom: 20px;
}

.upload-dragger {
  width: 100%;
}

.upload-dragger :deep(.el-upload-dragger) {
  width: 100%;
  padding: 40px 20px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  background-color: #fafafa;
  transition: all 0.3s ease;
}

.upload-dragger :deep(.el-upload-dragger:hover) {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.upload-dragger .el-icon--upload {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 16px;
}

.upload-dragger .el-upload__text {
  color: #606266;
  font-size: 14px;
}

.upload-dragger .el-upload__text em {
  color: #409eff;
  font-style: normal;
}

.upload-dragger .el-upload__tip {
  margin-top: 12px;
  color: #909399;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
}

.file-info-section {
  margin-bottom: 20px;
}

.file-info-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.file-info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.file-info-header .el-icon {
  color: #409eff;
  font-size: 18px;
}

.file-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.file-detail-item:last-child {
  border-bottom: none;
}

.file-detail-item .label {
  font-weight: 500;
  color: #606266;
  font-size: 14px;
}

.file-detail-item .value {
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.import-results-section {
  margin-bottom: 20px;
}

.results-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.results-card.success {
  border-color: #67c23a;
  background-color: #f0f9eb;
}

.results-card.has-errors {
  border-color: #f56c6c;
  background-color: #fef0f0;
}

.results-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.results-header .el-icon {
  font-size: 18px;
}

.results-card.success .results-header .el-icon {
  color: #67c23a;
}

.results-card.has-errors .results-header .el-icon {
  color: #f56c6c;
}

.results-content {
  padding: 8px 0;
}

.results-summary {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-radius: 6px;
  min-width: 120px;
}

.summary-item.success {
  background-color: #f0f9eb;
}

.summary-item.error {
  background-color: #fef0f0;
}

.summary-label {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
}

.summary-value {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
}

.summary-item.success .summary-value {
  color: #67c23a;
}

.summary-item.error .summary-value {
  color: #f56c6c;
}

.failed-records {
  margin-top: 16px;
}

.failed-records-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.failed-record-item {
  margin-bottom: 8px;
}

.failed-record-details {
  margin-top: 8px;
  padding: 8px;
  background-color: #fff;
  border-radius: 4px;
}

.error-message,
.error-detail {
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 1.5;
}

.error-message strong,
.error-detail strong {
  color: #303133;
}

.error-record {
  margin-top: 12px;
}

.error-record pre {
  background-color: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
  font-size: 11px;
  overflow-x: auto;
  max-height: 200px;
  overflow-y: auto;
  margin: 8px 0 0 0;
}

.upload-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.upload-actions .dialog-footer {
  display: flex;
  gap: 12px;
  margin: 0;
  padding: 0;
}

/* Responsive styles for upload dialog */
@media (max-width: 768px) {
  .results-summary {
    flex-direction: column;
    gap: 12px;
  }
  
  .summary-item {
    width: 100%;
    min-width: auto;
  }
  
  .upload-actions {
    flex-direction: column;
    gap: 12px;
  }
  
  .upload-actions .dialog-footer {
    width: 100%;
    justify-content: stretch;
  }
  
  .upload-actions .dialog-footer .el-button {
    flex: 1;
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


