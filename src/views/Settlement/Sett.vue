<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { getSettlementListByCounty, getDuplicates, mergeDuplicates, downloadSettlementsGeoData, shareDocuments } from '@/api/settlements'
import { getListWithoutGeo } from '@/api/counties'
import {
  ElButton, ElSelect, FormInstance, ElTabs, ElTabPane, ElDialog, ElInputNumber,ElCollapse,ElCollapseItem,
  ElInput, ElBadge, ElForm, ElDescriptions, ElDescriptionsItem, ElFormItem, ElUpload, ElCard, ElPopconfirm, ElTable, ElCol, ElRow,
  ElTableColumn, UploadUserFile, ElDropdown, ElDropdownMenu, ElDropdownItem, ElStep, ElSteps, ElCheckbox, ElIcon, ElDatePicker,ElCheckboxGroup,
  ElRadio, ElRadioGroup, ElAlert, ElDivider, ElDrawer,
} from 'element-plus'
import { ElMessage, ElSegmented, ElMessageBox } from 'element-plus'
import { Position, Plus, Delete, Edit, Filter, InfoFilled, CopyDocument, Clock, Search, Setting, Back, Loading, CircleCheck, Message, CircleClose, Warning, View, RefreshLeft, Location } from '@element-plus/icons-vue'
import { ArrowLeft, ArrowRight, UploadFilled, Postcard, TopRight, Lock, Guide, TakeawayBox } from '@element-plus/icons-vue'
import { ref, reactive, computed, nextTick, watch } from 'vue'
import { ElPagination, ElTooltip, ElOption } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import { DeleteRecord, updateOneRecord, revertHistory, deleteDocument, revertMerge } from '@/api/settlements'
import { useAppStore } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { defineAsyncComponent, onMounted, onActivated } from 'vue';
import xlsx from "json-as-xlsx"
import { searchByKeyWord } from '@/api/settlements'
import readShapefileAndConvertToGeoJSON from '@/utils/readShapefile'
import filterDataByKeys from '@/utils/filterArrays'
import { getSummarybyField } from '@/api/summary'
import * as turf from '@turf/turf'
import '@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css';
import { Icon } from '@iconify/vue';
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'
import { UserType } from '@/api/register/types'
import proj4 from 'proj4';
import UploadComponent from '@/views/Components/UploadComponent.vue';
import ListDocuments from '@/views/Components/ListDocuments.vue';
import DownloadCustom from '@/views/Components/DownloadCustom.vue';
import TableActions from '@/views/Components/TableActions.vue';



import { getSummarybyFieldFromMultipleIncludes } from '@/api/summary'
import PermissionWrapper from '@/components/PermissionWrapper.vue'

const MapBoxToken = 'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = MapBoxToken;

// Filter variables
const filters = ref([  'isActive'])
const filterValues = ref([  ['Approved'], ['true']])
const selectedCounty = ref([])
const selectedSubCounty = ref([])
const selectedWard = ref([])
const search_string = ref('')
const value4 = ref([]) // County select
const value5 = ref([]) // Subcounty select
const value6 = ref([]) // Ward select

const loadingGetData = ref(false)
const loadingGetDataMsg = ref('Loading the data.. Please wait.......')

const DateDialogVisible = ref(false)
const dateRange = ref()

// Save filters to localStorage
const saveFiltersToStorage = () => {
  const filterState = {
    selectedCounty: selectedCounty.value,
    selectedSubCounty: selectedSubCounty.value,
    selectedWard: selectedWard.value,
    search_string: search_string.value,
    filters: filters.value,
    filterValues: filterValues.value,
    value4: value4.value,
    value5: value5.value,
    value6: value6.value,
  }
  localStorage.setItem('settlementFilters', JSON.stringify(filterState))
}

// Load filters from localStorage
const loadFiltersFromStorage = () => {
  const savedFilters = localStorage.getItem('settlementFilters')

  if (savedFilters) {
    const filterState = JSON.parse(savedFilters)

    // Always restore county from saved filters (role-based restrictions are already enforced in getUserRoles)
    selectedCounty.value = filterState.selectedCounty || []
    value4.value = filterState.value4 || []

    selectedSubCounty.value = filterState.selectedSubCounty || []
    selectedWard.value = filterState.selectedWard || []
    search_string.value = (filterState.search_string || '').trim()
    filters.value = filterState.filters || []
    filterValues.value = filterState.filterValues || []
    value5.value = filterState.value5 || []
    value6.value = filterState.value6 || []
  } else if (isCountyStaff.value && selectedCounty.value.length > 0) {
    // No saved filters; for county staff ensure UI reflects their role county
    value4.value = selectedCounty.value
  }

  // Normalize to arrays so .length checks work even if a primitive id was stored
  if (selectedCounty.value && !Array.isArray(selectedCounty.value)) {
    selectedCounty.value = [selectedCounty.value]
  }
  if (value4.value && !Array.isArray(value4.value)) {
    value4.value = [value4.value]
  }
}

// User and role setup
const { wsCache } = useCache()
const appStore = useAppStore()
const userInfo = wsCache.get(appStore.getUserInfo)
const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)
const isSuperAdmin = ref(
  userInfo.roles.some(role => role.name === "super_admin" || role.name === "root_admin")
);
const isNationalStaff = ref(false)
const isCountyStaff = ref(false)
const thisHistory = ref()

// Check if user is a public user
const isPublicUser = computed(() => {
  return userInfo.roles.some(role => role.name === "public" || role.name === "Public")
})

// Check if user is a county admin
const isCountyAdmin = computed(() => {
  return userInfo.roles.some(role => 
    (role.name === "admin" || role.name === "staff") && 
    role.user_roles?.location_level === "county"
  )
})

const action_buttons = computed<string[]>(() => {
  let buttons: string[] = [];
  if (showAdminButtons.value) {
    buttons = ['edit', 'viewOnMap', 'delete'];
  } else if (showEditButtons.value) {
    buttons = ['edit', 'viewOnMap'];
  } else {
    buttons = ['viewOnMap'];
  }
  if (activeSegment.value === 'New' || activeSegment.value === 'Rejected') {
    buttons.push('review');
  }
  if (activeSegment.value === 'Approved' && isSuperAdmin.value) {
    buttons.push('decommission');
  }
  return buttons;
});

// Process user roles
let processedRoles: any[] = []
let roles_filters: { role: string; field: string | null; value: any }[] = [];

const getUserRoles = async () => {
  // Clear existing filters
  roles_filters = [];
  filters.value = [];
  filterValues.value = [];

  processedRoles = userInfo.roles.map(role => {
    let field = null;
    let fieldvalue = null;
    const level = role.user_roles?.location_level;
    
    if (level === "county") {
      isNationalStaff.value = false;
      field = "county_id";
      fieldvalue = role.user_roles.county_id;
      isCountyStaff.value = true;
      // Set selectedCounty for county staff
      if (fieldvalue) {
        selectedCounty.value = [fieldvalue];
        getSubCountyNames();
      }
    } else if (level === "settlement") {
      isNationalStaff.value = false;
      field = "id"; // Use 'id' for settlement_id filter
      fieldvalue = role.user_roles.settlement_id;
    } else if (level === "national" || level === null) {
      isNationalStaff.value = true;
      return {
        role: role.name,
        model: "national",
        field: null,
        fieldvalue: null
      };
    } else {
      field = "location_id";
      fieldvalue = role.user_roles.location_id;
    }
    return {
      role: role.name,
      model: level,
      field: field,
      fieldvalue: fieldvalue
    };
  }).filter(role => role !== null);

  // Determine roles_filters and admin buttons
  if (isSuperAdmin.value) {
    roles_filters = [];
    showAdminButtons.value = true
  } else {
    // For admin/staff/other roles, still apply location-based filters if they exist
    const applicableRoles = processedRoles.filter(role => role.model !== "national");
    roles_filters = applicableRoles.map(role => ({
      role: role.role,
      field: role.field === 'settlement_id' ? 'id' : role.field,
      value: role.fieldvalue
    }));
    
    // Set admin buttons based on role
    if (processedRoles.some(role => role.role === "admin")) {
      showAdminButtons.value = true
    } else if (processedRoles.some(role => role.role === "staff")) {
      showAdminButtons.value = true
    } else {
      showAdminButtons.value = false
    }
  }

  // Populate filters and filterValues from roles_filters
  roles_filters.forEach(rf => {
    if (rf.field && rf.value !== null && rf.value !== undefined) {
      filters.value.push(rf.field);
      filterValues.value.push(Array.isArray(rf.value) ? rf.value : [rf.value]);
    }
  });

  console.log('isSuperAdmin.value', isSuperAdmin.value);
  console.log('isNationalStaff.value', isNationalStaff.value);
  console.log('isCountyStaff.value', isCountyStaff.value);
  console.log('roles_filters --', roles_filters);
  console.log('filters', filters.value);
  console.log('filterValues', filterValues.value);
};

const pushRoleFilters = () => {
  // Re-apply role-based filters after status filters are set
  // This ensures county/settlement users only see their assigned locations
  // Role filters take precedence and should always be applied for county/settlement level users
  roles_filters.forEach(rf => {
    if (rf.field && rf.value !== null && rf.value !== undefined) {
      // Check if this filter field is already in the filters array
      const existingIndex = filters.value.indexOf(rf.field);
      if (existingIndex === -1) {
        // Add new filter
        filters.value.push(rf.field);
        filterValues.value.push(Array.isArray(rf.value) ? rf.value : [rf.value]);
      } else {
        // Update existing filter value (role filters take precedence for county/settlement level users)
        // For county-level users, always use role filter value to ensure they only see their county
        if (rf.field === 'county_id' && isCountyStaff.value) {
          filterValues.value[existingIndex] = Array.isArray(rf.value) ? rf.value : [rf.value];
        } else if (rf.field === 'id' && !isNationalStaff.value && !isSuperAdmin.value) {
          // For settlement-level users, always use role filter
          filterValues.value[existingIndex] = Array.isArray(rf.value) ? rf.value : [rf.value];
        } else {
          // For other cases (non-county staff, non-settlement staff), preserve user selections
          // Only apply role filter if it's a different field or if user hasn't selected anything
          // Don't overwrite user-selected county_id for non-county staff
          if (rf.field === 'county_id' && !isCountyStaff.value && selectedCounty.value.length > 0) {
            // Preserve user's county selection, don't overwrite with role filter
            // The role filter might be for a different purpose (e.g., location_id)
            console.log('🔒 Preserving user county selection:', selectedCounty.value, 'over role filter:', rf.value)
          } else {
            // For other cases, use role filter value
            const existingValue = filterValues.value[existingIndex];
            const roleValue = Array.isArray(rf.value) ? rf.value : [rf.value];
            if (Array.isArray(existingValue)) {
              // Merge arrays, but role filter values take precedence
              filterValues.value[existingIndex] = roleValue;
            } else {
              filterValues.value[existingIndex] = roleValue;
            }
          }
        }
      }
    }
  });
  
  // Final check: Ensure county filter is always present for county-level users
  if (isCountyStaff.value && roles_filters.some(rf => rf.field === 'county_id')) {
    const countyFilter = roles_filters.find(rf => rf.field === 'county_id');
    if (countyFilter && countyFilter.value !== null && countyFilter.value !== undefined) {
      const countyIndex = filters.value.indexOf('county_id');
      if (countyIndex === -1) {
        // Add county filter if missing
        filters.value.push('county_id');
        filterValues.value.push(Array.isArray(countyFilter.value) ? countyFilter.value : [countyFilter.value]);
      } else {
        // Ensure county filter value is correct
        filterValues.value[countyIndex] = Array.isArray(countyFilter.value) ? countyFilter.value : [countyFilter.value];
      }
    }
  }
};

// Location-aware permission checking function
const canUserAccessSettlement = (settlement: any, action: 'edit' | 'delete' | 'create'): boolean => {
  // Super admins and root admins can access everything
  if (isSuperAdmin.value) {
    return true;
  }

  // For delete action, apply stricter rules
  if (action === 'delete') {
    // Check if user is national staff/admin (national level access)
    if (isNationalStaff.value) {
      // Check if user has admin role at national level
      const hasNationalAdminRole = userInfo.roles.some(role => 
        (role.name === "admin" || role.name === "staff") && 
        (role.user_roles?.location_level === "national" || role.user_roles?.location_level === null)
      );
      if (hasNationalAdminRole) {
        return true;
      }
    }

    // Check if user has global settlement:delete permission
    const userPermissions = userInfo.permissions || [];
    if (userPermissions.includes('*.*.*') || userPermissions.includes('settlement:delete')) {
      // If the settlement has a createdBy field, check if the current user created it
      const settlementCreatedBy = settlement.createdBy || settlement.created_by;
      if (settlementCreatedBy === userInfo.id) {
        return true;
      }

      // For county staff, check if they are a county admin and the settlement is in their county
      // AND they created the settlement
      const countyAdminRole = userInfo.roles.find(role => 
        (role.name === "admin" || role.name === "staff") && 
        role.user_roles?.location_level === "county" &&
        role.user_roles?.county_id
      );

      if (countyAdminRole && settlement) {
        const userCountyId = countyAdminRole.user_roles.county_id;
        const settlementCountyId = settlement.county_id;
        const settlementCreatedBy = settlement.createdBy || settlement.created_by;

        // Allow delete if: user is county admin/staff AND settlement is in their county AND user created it
        if (settlementCountyId === userCountyId && settlementCreatedBy === userInfo.id) {
          return true;
        }
      }
    }

    // No other users can delete
    return false;
  }

  // Check if user has the required global permission (for edit/create)
  const userPermissions = userInfo.permissions || [];
  const requiredPermissions = {
    edit: 'settlement:update',
    delete: 'settlement:delete',
    create: 'settlement:create'
  };

  // If user has all permissions (*.*.*), allow access
  if (userPermissions.includes('*.*.*')) {
    return true;
  }

  // Check if user has the specific permission
  if (!userPermissions.includes(requiredPermissions[action])) {
    return false;
  }

  // For create action, check if user can create in any of their assigned locations
  if (action === 'create') {
    return processedRoles.some(role => 
      role.model === 'county' || role.model === 'settlement' || role.model === 'national'
    );
  }

  // For edit actions, check location-based access
  return processedRoles.some(role => {
    if (role.model === 'national') {
      return true; // National level access
    } else if (role.model === 'county') {
      return settlement.county_id === role.fieldvalue;
    } else if (role.model === 'settlement') {
      return settlement.id === role.fieldvalue;
    } else if (role.field === 'location_id') {
      // Check subcounty or ward level access
      return settlement.subcounty_id === role.fieldvalue || settlement.ward_id === role.fieldvalue;
    }
    return false;
  });
};

// Get action buttons for a specific settlement
const getSettlementActionButtons = (settlement: any): string[] => {
  let buttons: string[] = [];
  
  // Always show view on map if settlement has geometry
  if (settlement.geom || settlement.hasGeom) {
    buttons.push('viewOnMap');
  }

  // Check edit permission
  if (canUserAccessSettlement(settlement, 'edit')) {
    buttons.push('edit');
  }

  // Check delete permission
  if (canUserAccessSettlement(settlement, 'delete')) {
    buttons.push('delete');
  }

  // Add review button for New/Rejected segments if user has admin rights
  if ((activeSegment.value === 'New' || activeSegment.value === 'Rejected') && showAdminButtons.value) {
    buttons.push('review');
  }

  // Add decommission button for Approved settlements if super admin
  if (activeSegment.value === 'Approved' && isSuperAdmin.value) {
    buttons.push('decommission');
  }

  // Add merge button if user can edit (merge requires edit permission)
  if (canUserAccessSettlement(settlement, 'edit')) {
    buttons.push('merge');
  }

  // Add update location button if user can edit (available for all settlements)
  if (canUserAccessSettlement(settlement, 'edit')) {
    buttons.push('updateLocation');
  }

  return buttons;
};

// Fixed action column width since we're using a dropdown menu
const actionColumnWidth = computed(() => {
  return isMobile.value ? '80px' : '100px';
});

// Form setup
const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  name: '',
  county_id: '',
  subcounty_id: '',
  ward_id: '',
  settlement_type: '',
  population: '',
  area: '',
  description: null,
  geom: null,
  id: '',
  dist_trunk: null,
  dist_town: null,
  parcel_no: null,
  parcel_owner: null,
  rim_no: null,
  isApproved: 'Pending',
  isActive: true,
  code: ''
})

// Pagination and table setup
const mobileBreakpoint = 768;
const defaultPageSize = 10;
const mobilePageSize = 5;
const basePageSizes = [5, 10, 15, 20, 50, 100];
const pageSize = ref(defaultPageSize);

// Helper to build page-size options and include an "All" option equal to current total
const getPageSizes = (totalCount: number) => {
  const sizes = [...basePageSizes];
  if (typeof totalCount === 'number' && totalCount > 0 && !sizes.includes(totalCount)) {
    sizes.push(totalCount);
  }
  return sizes;
};

const updatePageSize = () => {
  if (window.innerWidth <= mobileBreakpoint) {
    pageSize.value = mobilePageSize;
  } else {
    pageSize.value = defaultPageSize;
  }
};

const getCounts = async () => {
  const formData: any = {}
  formData.model = 'settlement'
  formData.summaryField = 'isApproved'
  formData.summaryFunction = 'count'
  formData.groupFields = ['isApproved']
  
  // Build filter arrays properly
  const filterFields: string[] = []
  const filterValues: any[][] = []
  const filterOperators: string[] = []
  
  // Always include isActive filter
  filterFields.push('isActive')
  filterValues.push(['true'])
  filterOperators.push('in')
  
  // Add role-based filters if they exist
  if (roles_filters.length > 0) {
    roles_filters.forEach(roleFilter => {
      const { field, value } = roleFilter
      if (field && value !== null && value !== undefined) {
        // Check if this filter field is already added
        const existingIndex = filterFields.indexOf(field)
        if (existingIndex === -1) {
          filterFields.push(field)
          // Ensure value is an array
          const filterValue = Array.isArray(value) ? value : [value]
          filterValues.push(filterValue)
          filterOperators.push('in')
        } else {
          // Merge values if field already exists
          const existingValue = filterValues[existingIndex]
          const newValue = Array.isArray(value) ? value : [value]
          filterValues[existingIndex] = [...new Set([...existingValue, ...newValue])]
        }
      }
    })
  }
  
  // Add user-selected location filters (county, subcounty, ward)
  if (selectedCounty.value.length > 0) {
    const existingIndex = filterFields.indexOf('county_id')
    if (existingIndex === -1) {
      filterFields.push('county_id')
      filterValues.push(selectedCounty.value)
      filterOperators.push('in')
    } else {
      // Merge with existing county filter (role-based might have set it)
      const existingValue = filterValues[existingIndex]
      filterValues[existingIndex] = [...new Set([...existingValue, ...selectedCounty.value])]
    }
  }
  
  if (selectedSubCounty.value.length > 0) {
    const existingIndex = filterFields.indexOf('subcounty_id')
    if (existingIndex === -1) {
      filterFields.push('subcounty_id')
      filterValues.push(selectedSubCounty.value)
      filterOperators.push('in')
    } else {
      const existingValue = filterValues[existingIndex]
      filterValues[existingIndex] = [...new Set([...existingValue, ...selectedSubCounty.value])]
    }
  }
  
  if (selectedWard.value.length > 0) {
    const existingIndex = filterFields.indexOf('ward_id')
    if (existingIndex === -1) {
      filterFields.push('ward_id')
      filterValues.push(selectedWard.value)
      filterOperators.push('in')
    } else {
      const existingValue = filterValues[existingIndex]
      filterValues[existingIndex] = [...new Set([...existingValue, ...selectedWard.value])]
    }
  }
  
  // Only add filterField, filterValue, and filterOperator if we have filters
  if (filterFields.length > 0) {
    formData.filterField = filterFields
    formData.filterValue = filterValues
    formData.filterOperator = filterOperators
  }
  
  try {
    const response = await getSummarybyFieldFromMultipleIncludes(formData);
    const amount = response.Total;
    
    // Update the count refs directly instead of modifying computed property
    const pendingMatch = amount.find((item) => item.isApproved === 'Pending');
    const approvedMatch = amount.find((item) => item.isApproved === 'Approved');
    const rejectedMatch = amount.find((item) => item.isApproved === 'Rejected');
    const decommissionedMatch = amount.find((item) => item.isApproved === 'Decommissioned');
    
    totalPending.value = pendingMatch ? parseInt(pendingMatch.count, 10) : 0;
    totalApproved.value = approvedMatch ? parseInt(approvedMatch.count, 10) : 0;
    totalRejected.value = rejectedMatch ? parseInt(rejectedMatch.count, 10) : 0;
    decommSettlementsCount.value = decommissionedMatch ? parseInt(decommissionedMatch.count, 10) : 0;
  } catch (error) {
    console.error(error);
    return [];
  }
}

const applyStatusFilters = () => {
  const statusMap: Record<string, string> = {
    Approved: 'Approved',
    New: 'Pending',
    Rejected: 'Rejected',
    Decommissioned: 'Decommissioned',
  }
  const selected = statusMap[activeSegment.value]
  if (selected) {
    const keptFilters: string[] = []
    const keptValues: any[][] = []
    filters.value.forEach((filter, index) => {
      if (filter === 'isApproved' || filter === 'isActive') return
      keptFilters.push(filter)
      keptValues.push(filterValues.value[index] ?? [])
    })
    filters.value = ['isApproved', 'isActive', ...keptFilters]
    filterValues.value = [[selected], ['true'], ...keptValues]
  }
}

 
const loadDataWithCurrentFilters = async () => {
  // If a county_id is present in the route query (e.g. coming back from AddSettlementNew),
  // use it to restore the county filter and persist it.
  const queryCounty = route.query.county_id
  if (queryCounty && !isCountyStaff.value) {
    const countyId = Array.isArray(queryCounty) ? queryCounty[0] : queryCounty
    if (countyId) {
      selectedCounty.value = [countyId]
      value4.value = [countyId]
      saveFiltersToStorage()
    }
  }

  const hasSavedSearch = !!search_string.value
  const hasRestoredFilters =
    selectedCounty.value.length > 0 ||
    selectedSubCounty.value.length > 0 ||
    selectedWard.value.length > 0 ||
    filters.value.length > 0

  if (selectedCounty.value.length > 0) {
    await getSubCountyNames()
    if (selectedSubCounty.value.length > 0) {
      await getWardNames()
    }
  }

  if (hasSavedSearch) {
    await searchByNewName(true)
  } else if (hasRestoredFilters) {
    await getNewOrRejectedSettlements(activeSegment.value)
  } else {
    await getAllSetllementsInitially(activeSegment.value)
  }
}

onMounted(async () => {
  window.addEventListener('resize', updatePageSize)
  window.addEventListener('resize', () => {
    windowWidth.value = window.innerWidth
  })
  updatePageSize()
  await getUserRoles()

  // Ensure non-national/non-admin users always see Approved segment
  if (!isNationalStaff.value && !isSuperAdmin.value && !isCountyAdmin.value) {
    activeSegment.value = 'Approved'
  }

  // For county staff, sync value4 with selectedCounty immediately after getUserRoles
  if (isCountyStaff.value && selectedCounty.value.length > 0) {
    value4.value = selectedCounty.value
  }

  loadFiltersFromStorage()

  // After loading from storage, ensure county staff value4 is still synced
  if (isCountyStaff.value && selectedCounty.value.length > 0) {
    value4.value = selectedCounty.value
  }

  await getCounts()
  getSettlmentHistory()
  await loadDataWithCurrentFilters()
})

// When navigating back from AddSettlementNew or details, re-apply stored filters and reload data
onActivated(async () => {
  loadFiltersFromStorage()

  if (isCountyStaff.value && selectedCounty.value.length > 0) {
    value4.value = selectedCounty.value
  }

  await getCounts()
  getSettlmentHistory()
  await loadDataWithCurrentFilters()
})

 


const { push } = useRouter()
const route = useRoute()
const page = ref(1)
const loading = ref(true)
const currentPage = ref(1)
const enableSubcounty = ref(false)
const total = ref(0)
const totalRejected = ref(0)
const totalApproved = ref(0)
const totalPending = ref(0)
const showEditSaveButton = ref(false)
const showAddSaveButton = ref(true)
const formheader = ref('Edit Settlement')
// Explicitly type duplicateRecords for Duplicates segment
interface DuplicateGroup {
  header: string;
  records: any[];
  _mergeState?: { selected: any[]; primary: any | null };
}
interface CountyDuplicate {
  parent: string;
  groups: DuplicateGroup[];
  _activeTab: string;
}
const duplicateRecords = ref<CountyDuplicate[]>([])
const duplicateTotal = ref(0)
const deletedSettlements = ref([])
const deletedSettlementsCount = ref(0)
const handleDeletedPageChange = (p: number) => {
  deletedPage.value = p
}
const handleDeletedSizeChange = (s: number) => {
  deletedPageSize.value = s
  deletedPage.value = 1
}
const decommSettlements = ref([])
const decommSettlementsCount = ref(0)
const tableDataList = ref([])
const tableDataListNew = ref<UserType[]>([])
const tableDataListRejected = ref<UserType[]>([])
const associated_Model = ''
const associated_multiple_models = ['county', 'subcounty', 'ward', 'users']
const nested_models = ['document', 'document_type']
const model = 'settlement'
const fileUploadList = ref<UploadUserFile[]>([])
const { t } = useI18n()
const isMobile = computed(() => appStore.getMobile)
const reviewWindowWidth = ref(isMobile.value ? "100%" : "40%")
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)

const handleClear = async () => {
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
          filter: "id",
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

  enableSubcounty.value = false
  search_string.value = ''
  
  // Only clear county selection if it's not role-based
  if (!isCountyStaff.value) {
    selectedCounty.value = []
  }
  selectedSubCounty.value = []
  selectedWard.value = []
  
  // Clear the underlying filter arrays
  filterValues.value = []
  filters.value = []
  value4.value = []
  value5.value = []
  value6.value = []
  dateRange.value = []
  // Reset both page refs to ensure pagination resets
  currentPage.value = 1
  page.value = 1

  // Restore role-based location filters
  roleBasedLocationFilters.forEach(locFilter => {
    filters.value.push(locFilter.filter)
    filterValues.value.push(locFilter.value)
  })

  localStorage.removeItem('settlementFilters'); // Clear stored filters
  // Update counts after clearing filters
  await getCounts()
  // Reset to segment data (not search results) to get correct totals
  await getAllSetllementsInitially(activeSegment.value)
}

const currentRow = ref()
const addMoreDocuments = ref(false)

const onPageChange = async (selPage: any) => {
  page.value = selPage
  // Set status filters - role filters will be applied in getNewOrRejectedSettlements/getFilteredBySearchData
  if (activeSegment.value == 'Approved') {
    filters.value = ['isApproved', 'isActive']
    filterValues.value = [['Approved'], ['true']]
  } else if (activeSegment.value == 'New') {
    filters.value = ['isApproved', 'isActive']
    filterValues.value = [['Pending'], ['true']]
  } else if (activeSegment.value == 'Rejected') {
    filters.value = ['isApproved', 'isActive']
    filterValues.value = [['Rejected'], ['true']]
  }
  saveFiltersToStorage();
  if (search_string.value) {
    getFilteredBySearchData(activeSegment.value, search_string.value)
  } else {
    getNewOrRejectedSettlements(activeSegment.value)
  }
}

const onPageSizeChange = async (size: any) => {
  pageSize.value = size
  // Set status filters - role filters will be applied in getNewOrRejectedSettlements/getFilteredBySearchData
  if (activeSegment.value === 'Approved') {
    filters.value = ['isApproved', 'isActive']
    filterValues.value = [['Approved'], ['true']]
  } else if (activeSegment.value === 'New') {
    filters.value = ['isApproved', 'isActive']
    filterValues.value = [['Pending'], ['true']]
  } else if (activeSegment.value === 'Rejected') {
    filters.value = ['isApproved', 'isActive']
    filterValues.value = [['Rejected'], ['true']]
  }
  saveFiltersToStorage();
  if (search_string.value) {
    getFilteredBySearchData(activeSegment.value, search_string.value)
  } else {
    getNewOrRejectedSettlements(activeSegment.value)
  }
}

const getAllSetllementsInitially = async (tab) => {
  await getNewOrRejectedSettlements(tab)
  await getSettlementCount()
}

const getSettlementCount = async () => {
  const formData: any = {}
  formData.model = 'settlement'
  formData.summaryField = 'isApproved'
  formData.summaryFunction = 'count'
  formData.groupFields = ['isApproved']
  
  // Build filter arrays properly
  const filterFields: string[] = []
  const filterValues: any[][] = []
  const filterOperators: string[] = []
  
  // Always include isActive filter
  filterFields.push('isActive')
  filterValues.push(['true'])
  filterOperators.push('in')
  
  // Add role-based filters if they exist
  if (roles_filters.length > 0) {
    roles_filters.forEach(roleFilter => {
      const { field, value } = roleFilter
      if (field && value !== null && value !== undefined) {
        // Check if this filter field is already added
        const existingIndex = filterFields.indexOf(field)
        if (existingIndex === -1) {
          filterFields.push(field)
          // Ensure value is an array
          const filterValue = Array.isArray(value) ? value : [value]
          filterValues.push(filterValue)
          filterOperators.push('in')
        } else {
          // Merge values if field already exists
          const existingValue = filterValues[existingIndex]
          const newValue = Array.isArray(value) ? value : [value]
          filterValues[existingIndex] = [...new Set([...existingValue, ...newValue])]
        }
      }
    })
  }
  
  // Add user-selected location filters (county, subcounty, ward)
  if (selectedCounty.value.length > 0) {
    const existingIndex = filterFields.indexOf('county_id')
    if (existingIndex === -1) {
      filterFields.push('county_id')
      filterValues.push(selectedCounty.value)
      filterOperators.push('in')
    } else {
      // Merge with existing county filter (role-based might have set it)
      const existingValue = filterValues[existingIndex]
      filterValues[existingIndex] = [...new Set([...existingValue, ...selectedCounty.value])]
    }
  }
  
  if (selectedSubCounty.value.length > 0) {
    const existingIndex = filterFields.indexOf('subcounty_id')
    if (existingIndex === -1) {
      filterFields.push('subcounty_id')
      filterValues.push(selectedSubCounty.value)
      filterOperators.push('in')
    } else {
      const existingValue = filterValues[existingIndex]
      filterValues[existingIndex] = [...new Set([...existingValue, ...selectedSubCounty.value])]
    }
  }
  
  if (selectedWard.value.length > 0) {
    const existingIndex = filterFields.indexOf('ward_id')
    if (existingIndex === -1) {
      filterFields.push('ward_id')
      filterValues.push(selectedWard.value)
      filterOperators.push('in')
    } else {
      const existingValue = filterValues[existingIndex]
      filterValues[existingIndex] = [...new Set([...existingValue, ...selectedWard.value])]
    }
  }
  
  // Only add filterField, filterValue, and filterOperator if we have filters
  if (filterFields.length > 0) {
    formData.filterField = filterFields
    formData.filterValue = filterValues
    formData.filterOperator = filterOperators
  }
  
  const newSettCount = await getSummarybyFieldFromMultipleIncludes(formData)
  let pending = await filterDataByKeys(newSettCount.Total, ['isApproved'], ['Pending']);
  let approved = await filterDataByKeys(newSettCount.Total, ['isApproved'], ['Approved']);
  let rejected = await filterDataByKeys(newSettCount.Total, ['isApproved'], ['Rejected']);
  totalPending.value = pending.length > 0 ? parseInt(pending[0].count) : 0
  totalApproved.value = approved.length > 0 ? parseInt(approved[0].count) : 0
  totalRejected.value = rejected.length > 0 ? parseInt(rejected[0].count) : 0
}

const getNewOrRejectedSettlements = async (tab) => {
  loadingGetData.value = true
  // Set status filters first
  if (tab === 'New') {
    filters.value = ['isApproved', 'isActive']
    filterValues.value = [['Pending'], ['true']]
  } else if (tab === 'Rejected') {
    filters.value = ['isApproved', 'isActive']
    filterValues.value = [['Rejected'], ['true']]
  } else if (tab === 'Decommissioned') {
    filters.value = ['isApproved', 'isActive']
    filterValues.value = [['Decommissioned'], ['true']]
  } else {
    filters.value = ['isApproved', 'isActive']
    filterValues.value = [['Approved'], ['true']]
  }
  
  // Apply role-based filters FIRST to ensure county/settlement restrictions are always present
  pushRoleFilters()
  
  // Normalize county selection to array
  const countyFilterArray = Array.isArray(selectedCounty.value)
    ? selectedCounty.value
    : (selectedCounty.value !== null && selectedCounty.value !== undefined
        ? [selectedCounty.value]
        : [])

  // Then add user-selected location filters (only if not county staff, as county staff should be restricted to their county)
  if (!isCountyStaff.value && countyFilterArray.length > 0) {
    var selectOption = 'county_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
      filterValues.value.push(countyFilterArray)
    } else {
      // Update existing county filter (but role filter takes precedence for county staff)
      var index = filters.value.indexOf(selectOption)
      // For non-county staff, allow user selection to override
      filterValues.value[index] = countyFilterArray
    }
  }
  
  if (selectedSubCounty.value.length > 0) {
    var selectOption = 'subcounty_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
      filterValues.value.push(selectedSubCounty.value)
    } else {
      var index = filters.value.indexOf(selectOption)
      filterValues.value[index] = selectedSubCounty.value
    }
  }
  
  if (selectedWard.value.length > 0) {
    var selectOption = 'ward_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
      filterValues.value.push(selectedWard.value)
    } else {
      var index = filters.value.indexOf(selectOption)
      filterValues.value[index] = selectedWard.value
    }
  }
  
  // Final check: Ensure role filters are still applied (in case user selections overwrote them)
  pushRoleFilters()
  
  console.log('📊 Final filters before API call:', filters.value)
  console.log('📊 Final filter values before API call:', filterValues.value)
  console.log('📊 selectedCounty:', selectedCounty.value)
  const countyIndex = filters.value.indexOf('county_id')
  if (countyIndex !== -1) {
    console.log('📊 county_id filter value at index', countyIndex, ':', filterValues.value[countyIndex])
  } else {
    console.log('⚠️ county_id filter NOT found in filters array!')
  }
  
  const formData = {}
  formData.limit = pageSize.value
  formData.page = page.value
  formData.curUser = 1
  formData.model = model
  formData.searchField = 'name'
  formData.searchKeyword = ''
  formData.assocModel = associated_Model
  formData.filters = filters.value
  formData.filterValues = filterValues.value
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = nested_models
  formData.dateRange = dateRange.value
  


  const res = await getSettlementListByCounty(formData)
  loadingGetData.value = false
  total.value = res.total
  if (tab == 'New') {
    tableDataListNew.value = res.data
    totalPending.value = res.total
  } else if (tab == 'Rejected') {
    tableDataListRejected.value = res.data
    totalRejected.value = res.total
  } else if (tab == 'Decommissioned') {
    decommSettlements.value = res.data
    decommSettlementsCount.value = res.total
  } else {
    tableDataList.value = res.data
    totalApproved.value = res.total
    // Only build flattenedData/model_fields once to avoid heavy work on every page change
    if (!flattenedData.value.length && res.data.length) {
      res.data.forEach(function (arrayItem) {
        var dd = flattenJSON(arrayItem)
        flattenedData.value.push(dd)
      })
      var obj = flattenJSON(res.data[0])
      model_fields.value = Object.keys(obj);
    }
  }
}

const getPotentialDuplicates = async () => {
  loadingGetData.value = true
  loadingGetDataMsg.value = 'Checking for duplicate data.. Please wait.......'
  
  // Apply role-based filters FIRST to ensure county/settlement restrictions are always present
  pushRoleFilters()
  
  // Normalize county selection to array
  const countyFilterArray = Array.isArray(selectedCounty.value)
    ? selectedCounty.value
    : (selectedCounty.value !== null && selectedCounty.value !== undefined
        ? [selectedCounty.value]
        : [])

  // Then add user-selected location filters (only if not county staff, as county staff should be restricted to their county)
  if (!isCountyStaff.value && countyFilterArray.length > 0) {
    var selectOption = 'county_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
      filterValues.value.push(countyFilterArray)
    } else {
      // Update existing county filter (but role filter takes precedence for county staff)
      var index = filters.value.indexOf(selectOption)
      // For non-county staff, allow user selection to override
      filterValues.value[index] = countyFilterArray
    }
  }
  
  if (selectedSubCounty.value.length > 0) {
    var selectOption = 'subcounty_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
      filterValues.value.push(selectedSubCounty.value)
    } else {
      var index = filters.value.indexOf(selectOption)
      filterValues.value[index] = selectedSubCounty.value
    }
  }
  
  if (selectedWard.value.length > 0) {
    var selectOption = 'ward_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
      filterValues.value.push(selectedWard.value)
    } else {
      var index = filters.value.indexOf(selectOption)
      filterValues.value[index] = selectedWard.value
    }
  }
  
  // Final check: Ensure role filters are still applied (in case user selections overwrote them)
  pushRoleFilters()
  const formData: any = {}
  formData.limit = pageSize.value
  formData.page = page.value
  formData.curUser = 1
  formData.model = model
  formData.searchField = 'name'
  formData.searchKeyword = ''
  formData.assocModel = associated_Model
  formData.fields = ['name', 'county_id']
  formData.associated_multiple_models = ['county', 'subcounty', 'ward']
  formData.filters = filters.value
  formData.filterValues = filterValues.value
  formData.associated_model = 'county'
  formData.foreignKey = 'county_id'
  formData.displayField = 'name'
  const res = await getDuplicates(formData)
  const groupedByCounty: Record<string, any[]> = {}
  res.data.forEach((duplicateGroup: any) => {
    if (!duplicateGroup.duplicates.length) return;
    const first = duplicateGroup.duplicates[0]
    let countyName = 'Unknown County'
    if (first.county && first.county.name) {
      countyName = first.county.name
    } else if (first.county_id) {
      countyName = `County ID: ${first.county_id}`
    }
    if (!groupedByCounty[countyName]) {
      groupedByCounty[countyName] = []
    }
    const uniqueNames = [...new Set(duplicateGroup.duplicates.map((d: any) => d.name))]
    groupedByCounty[countyName].push({
      header: uniqueNames.join(' / '),
      records: duplicateGroup.duplicates
    })
  })
  duplicateRecords.value = Object.entries(groupedByCounty).map(([parent, groups]: [string, any[]]) => {
    const countyObj: any = { parent, groups, _activeTab: 'set1' }
    groups.forEach((group, groupIdx) => {
      if (!group._mergeState) {
        group._mergeState = reactive({ selected: [], primary: null })
      }
    })
    return countyObj
  })
  // Debug log
  console.log('duplicateRecords', JSON.parse(JSON.stringify(duplicateRecords.value)))
  // Use backend total for pagination when available, fall back to local grouped count
  const backendTotal = (res as any)?.total
  duplicateTotal.value = typeof backendTotal === 'number' ? backendTotal : duplicateRecords.value.length
  total.value = typeof backendTotal === 'number' ? backendTotal : duplicateRecords.value.length
  loadingGetData.value = false
  loadingGetDataMsg.value = 'Loading the data.. Please wait.......'
}

const flattenJSON = (obj = {}, res = {}, extraKey = '') => {
  for (let key in obj) {
    if (key !== 'geom' && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'email' && key !== 'phone' && key !== 'isApproved' && key !== 'createdBy' && key !== 'isActive' && key !== 'documents' && key !== 'user') {
      if ((typeof obj[key] !== 'object' || obj[key] === null) && key !== 'id') {
        res[extraKey + key] = obj[key];
      } else if (Array.isArray(obj[key])) {
        obj[key].forEach((item, index) => {
          flattenJSON(item, res, `${extraKey}${key}.${index}.`);
        });
      } else {
        flattenJSON(obj[key], res, `${extraKey}${key}_`);
      }
    }
  }
  return res;
};

const model_fields = ref<string[]>([])
const flattenedData = ref<any[]>([])

function getLatLonFromGeom(geom) {
  if (!geom || !geom.type || !geom.coordinates) {
    return { latitude: null, longitude: null };
  }
  switch (geom.type) {
    case 'Point':
      return {
        latitude: geom.coordinates[1].toFixed(5),
        longitude: geom.coordinates[0].toFixed(5)
      };
    case 'MultiPoint':
      if (geom.coordinates.length > 0) {
        return {
          latitude: geom.coordinates[0][1].toFixed(5),
          longitude: geom.coordinates[0][0].toFixed(5)
        };
      }
      return { latitude: null, longitude: null };
    case 'Polygon':
    case 'MultiPolygon':
      const polygonCentroid = turf.centroid(geom);
      return {
        latitude: polygonCentroid.geometry.coordinates[1].toFixed(5),
        longitude: polygonCentroid.geometry.coordinates[0].toFixed(5)
      };
    case 'LineString':
    case 'MultiLineString':
      const lineCentroid = turf.centroid(geom);
      return {
        latitude: lineCentroid.geometry.coordinates[1].toFixed(5),
        longitude: lineCentroid.geometry.coordinates[0].toFixed(5)
      };
    default:
      return { latitude: null, longitude: null };
  }
}

const getFilteredData = async (selFilters, selfilterValues) => {
  loadingGetData.value = true
  pushRoleFilters()
  const formData = {}
  formData.limit = pageSize.value
  formData.page = page.value
  formData.curUser = 1
  formData.model = model
  formData.searchField = 'name'
  formData.searchKeyword = ''
  formData.assocModel = associated_Model
  // Use filters.value and filterValues.value after pushRoleFilters() to ensure role filters are applied
  formData.filters = filters.value
  formData.filterValues = filterValues.value
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = nested_models
  formData.dateRange = dateRange.value


  const res = await getSettlementListByCounty(formData)
  tableDataList.value = res.data
  total.value = res.total
  loadingGetData.value = false
}

const ShowReviewDialog = ref(false)
const RejectDialog = ref(false)
const settlement_raw = ref({})
const DecommissionDialog = ref(false)
const decommissionReason = ref('')
const MergeDialog = ref(false)
const MergeConfirmDialog = ref(false)
const currentSettlementForMerge = ref<any>(null)
const mergeSearchQuery = ref('')
const mergeSearchResults = ref<any[]>([])
const mergeSearchLoading = ref(false)
const selectedSettlementForMerge = ref<any>(null)
const mergePrimaryId = ref<number | null>(null)
const selectedSettlements = ref<any[]>([])
const selectedSettlementsNew = ref<any[]>([])
const selectedSettlementsRejected = ref<any[]>([])
const selectedSettlementsDecommissioned = ref<any[]>([])
const deletedPage = ref(1)
const deletedPageSize = ref(10)
const deletedPageData = computed(() => {
  const start = (deletedPage.value - 1) * deletedPageSize.value
  const end = start + deletedPageSize.value
  return deletedSettlements.value.slice(start, end)
})

const Review = (data: TableSlotDefault) => {
  ShowReviewDialog.value = true
  settlement_raw.value.name = data.name
  settlement_raw.value.area = data.area
  settlement_raw.value.population = data.population
  settlement_raw.value.description = data.description
  settlement_raw.value.user = data.user.name + ' | ' + data.user.email
  settlement_raw.value.date = data.createdAt
  ruleForm.id = data.id
  ruleForm.name = data.name
  ruleForm.county_id = data.county_id
  ruleForm.subcounty_id = data.subcounty_id
  ruleForm.ward_id = data.ward_id
  ruleForm.settlement_type = data.settlement_type
  ruleForm.population = data.population
  ruleForm.area = data.area
  ruleForm.description = data.description
  ruleForm.code = data.code
  ruleForm.geom = data.geom
  fileUploadList.value = data.documents
  formHeader.value = "Review Settlement"
}

const DeleteReview = async (data: TableSlotDefault) => {
  ShowReviewDialog.value = true
  await getThisHistory(data.history_id)
  settlement_raw.value.name = data.name
  settlement_raw.value.area = data.area
  settlement_raw.value.population = data.population
  settlement_raw.value.description = data.description
  settlement_raw.value.date = data.createdAt
  settlement_raw.value.user = thisHistory.value[0].user.name
  settlement_raw.value.delete_date = thisHistory.value[0].createdAt
  ruleForm.id = data.id
  ruleForm.name = data.name
  ruleForm.county_id = data.county_id
  ruleForm.subcounty_id = data.subcounty_id
  ruleForm.ward_id = data.ward_id
  ruleForm.settlement_type = data.settlement_type
  ruleForm.population = data.population
  ruleForm.area = data.area
  ruleForm.description = data.description
  ruleForm.code = data.code
  ruleForm.geom = data.geom
  fileUploadList.value = data.documents
  formHeader.value = "Review Deleted Settlement"
}

const approve = async () => {
  ruleForm.isApproved = 'Approved'
  ruleForm.reviewerId = userInfo.id
  ruleForm.model = 'settlement'
  await updateOneRecord(ruleForm).then(() => { })
  ShowReviewDialog.value = false
  // Remove from New list if reviewing a 'New' settlement
  if (activeSegment.value === 'New') {
    const idx = tableDataListNew.value.findIndex(item => item.id === ruleForm.id)
    if (idx !== -1) tableDataListNew.value.splice(idx, 1)
  } else {
    getFilteredData(filters, filterValues)
  }
}

const reject = async () => {
  RejectDialog.value = true
}

const rejectReason = ref('')
const confirmReject = async () => {
  ruleForm.reject_msg = rejectReason.value
  ruleForm.isApproved = 'Rejected'
  ruleForm.model = 'settlement'
  ruleForm.reviewerId = userInfo.id
  await updateOneRecord(ruleForm).then(() => { })
  RejectDialog.value = false
  ShowReviewDialog.value = false
  // Remove from New list if reviewing a 'New' settlement
  if (activeSegment.value === 'New') {
    const idx = tableDataListNew.value.findIndex(item => item.id === ruleForm.id)
    if (idx !== -1) tableDataListNew.value.splice(idx, 1)
  } else {
    getFilteredData(filters, filterValues)
  }
}

const viewOnMap = (data: TableSlotDefault) => {
  if (data.row.geom) {
    push({
      path: '/settlement/map/:id',
      name: 'SettlementMap',
      params: { id: data.row.id }
    })
  } else {
    ElMessage({
      message: 'This Settlement does not have the boundary defined in the database!',
      type: 'warning',
    })
  }
}

const handleViewOnMap = (data) => {
  console.log(data)
  if (data.geom || data.hasGeom) {
    push({
      path: '/settlement/map/:id',
      name: 'SettlementMap',
      params: { id: data.id }
    })
  } else {
    ElMessage({
      message: 'This Settlement does not have the boundary defined in the database!',
      type: 'warning',
    })
  }
}

const showPagination = ref(true)

const getFilteredBySearchData = async (tab, searchKey) => {
  // Ensure segment status filters are set before searching
  applyStatusFilters()

  // Apply role-based filters FIRST to ensure county/settlement restrictions are always present
  pushRoleFilters()
  
  // Then add user-selected location filters (only if not county staff, as county staff should be restricted to their county)
  if (!isCountyStaff.value && selectedCounty.value.length > 0) {
    var selectOption = 'county_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
      filterValues.value.push(selectedCounty.value)
    } else {
      // Update existing county filter (but role filter takes precedence for county staff)
      var index = filters.value.indexOf(selectOption)
      // For non-county staff, allow user selection to override
      filterValues.value[index] = selectedCounty.value
    }
  }
  
  if (selectedSubCounty.value.length > 0) {
    var selectOption = 'subcounty_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
      filterValues.value.push(selectedSubCounty.value)
    } else {
      var index = filters.value.indexOf(selectOption)
      filterValues.value[index] = selectedSubCounty.value
    }
  }
  
  // Final check: Ensure role filters are still applied (in case user selections overwrote them)
  pushRoleFilters()
  const formData = {}
  formData.limit = pageSize.value
  formData.page = page.value
  formData.curUser = 1
  formData.model = model
  formData.searchField = 'name'
  formData.searchKeyword = searchKey
  // Remove returnAll to enable proper pagination - the API will return paginated results
  formData.filters = filters.value
  formData.filterValues = filterValues.value
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = nested_models
  const res = await searchByKeyWord(formData)
  searchLoading.value = false
  // Use res.total (lowercase) for paginated results, or res.Total if available
  // The total should represent the total count of matching records for pagination
  const totalCount = res.total !== undefined ? res.total : (res.Total !== undefined ? res.Total : (res.data ? res.data.length : 0))
  
  if (tab === 'Approved') {
    tableDataList.value = res.data
    totalApproved.value = totalCount
    total.value = totalCount
  } else if (tab === 'New') {
    tableDataListNew.value = res.data
    totalPending.value = totalCount
    total.value = totalCount
  } else if (tab === 'Decommissioned') {
    decommSettlements.value = res.data
    decommSettlementsCount.value = totalCount
    total.value = totalCount
  } else {
    tableDataListRejected.value = res.data
    totalRejected.value = totalCount
    total.value = totalCount
  }
  loading.value = false
}

const searchLoading = ref(false)

const searchByNewName = async (force = false) => {
  const query = search_string.value?.trim()

  // If search is cleared (empty), reset to segment data
  if (!query || query.length === 0) {
    search_string.value = ''
    page.value = 1
    await getAllSetllementsInitially(activeSegment.value)
    saveFiltersToStorage()
    return
  }

  if (!force && query.length < 4) {
    ElMessage.warning("Please enter at least 4 characters to search.")
    return
  }

  search_string.value = query

  if (!filters.value.includes('isActive')) {
    filters.value.push('isActive')
    filterValues.value.push(['true'])
  }

  searchLoading.value = true
  page.value = 1 // Reset to first page when searching
  await getFilteredBySearchData(activeSegment.value, query)

  saveFiltersToStorage()
}



const countiesOptions = ref([])

const getCountyNames = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1,
      model: 'county',
      searchField: '',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    var ret = response.data
    loading.value = false
    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var countyOpt = {}
      countyOpt.value = arrayItem.id
      countyOpt.label = arrayItem.name
      countiesOptions.value.push(countyOpt)
    })
  })
}

getCountyNames()

const wardOptions = ref([])
const subcountiesOptions = ref([])

const getSubCountyNames = async () => {
  // Handle array for selectedCounty (get first value if array)
  const countyId = Array.isArray(selectedCounty.value) && selectedCounty.value.length > 0 
    ? selectedCounty.value[0] 
    : selectedCounty.value;
  
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1,
      model: 'subcounty',
      searchField: 'county_id',
      searchKeyword: countyId,
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    var ret = response.data
    subcountiesOptions.value = []
    loading.value = false
    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var subcountyOpt = {}
      subcountyOpt.value = arrayItem.id
      subcountyOpt.county_id = arrayItem.county_id
      subcountyOpt.label = arrayItem.name
      subcountiesOptions.value.push(subcountyOpt)
    })
  })
}

const getWardNames = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1,
      model: 'ward',
      searchField: 'subcounty_id',
      searchKeyword: selectedSubCounty.value,
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    var ret = response.data
    wardOptions.value = []
    loading.value = false
    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var opt = {}
      opt.value = arrayItem.id
      opt.label = arrayItem.name
      wardOptions.value.push(opt)
    })
  })
}

const filterByCounty = async (county_id: any) => {
  if (county_id && (Array.isArray(county_id) ? county_id.length > 0 : true)) {
    enableSubcounty.value = true
    // Ensure selectedCounty is always an array
    selectedCounty.value = Array.isArray(county_id) ? county_id : [county_id]
    value4.value = county_id
    await getSubCountyNames()
  } else {
    // Only clear if not county staff (county staff should keep their county)
    if (!isCountyStaff.value) {
      selectedCounty.value = []
      value4.value = []
    }
  }
  selectedSubCounty.value = []
  selectedWard.value = []
  value5.value = []
  value6.value = []

  saveFiltersToStorage()

  // Update counts with new location filters
  await getCounts()

  if (search_string.value) {
    await getFilteredBySearchData(activeSegment.value, search_string.value)
  } else {
    await getNewOrRejectedSettlements(activeSegment.value)
  }
}

const filterBySubCounty = async (subcounty_id: any) => {
  if (subcounty_id) {
    selectedSubCounty.value = subcounty_id
    value5.value = subcounty_id
    await getWardNames()
  } else {
    selectedSubCounty.value = []
    value5.value = []
  }
  selectedWard.value = []
  value6.value = []

  saveFiltersToStorage()

  // Update counts with new location filters
  await getCounts()

  if (search_string.value) {
    await getFilteredBySearchData(activeSegment.value, search_string.value)
  } else {
    await getNewOrRejectedSettlements(activeSegment.value)
  }
}


const filterByWard = async (ward_id: any) => {
  if (ward_id) {
    selectedWard.value = ward_id
    value6.value = ward_id
  } else {
    selectedWard.value = []
    value6.value = []
  }

  saveFiltersToStorage()

  // Update counts with new location filters
  await getCounts()

  if (search_string.value) {
    await getFilteredBySearchData(activeSegment.value, search_string.value)
  } else {
    await getNewOrRejectedSettlements(activeSegment.value)
  }
}


getAllSetllementsInitially('Approved')

const typeOptions = [
  { value: 1, label: 'Slum' },
  { value: 2, label: 'Informal Settlement' },
]

const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ruleForm.model = model
      const result = await updateOneRecord(ruleForm)
      var updatedObject = result.data
      if (activeSegment.value === 'Approved') {
        const index = tableDataList.value.findIndex(obj => obj.id === updatedObject.id);
        const updatedKeys = Object.keys(updatedObject);
        for (const key of updatedKeys) {
          tableDataList.value[index][key] = updatedObject[key];
        }
      } else if (activeSegment.value === 'New') {
        const index = tableDataListNew.value.findIndex(obj => obj.id === updatedObject.id);
        const updatedKeys = Object.keys(updatedObject);
        for (const key of updatedKeys) {
          tableDataListNew.value[index][key] = updatedObject[key];
        }
      } else if (activeSegment.value === 'Rejected') {
        const index = tableDataListRejected.value.findIndex(obj => obj.id === updatedObject.id);
        const updatedKeys = Object.keys(updatedObject);
        for (const key of updatedKeys) {
          tableDataListRejected.value[index][key] = updatedObject[key];
        }
      }
    } else {
      console.log('error in editing!', fields)
    }
  })
}

const handleClose = () => {
  showAddSaveButton.value = true
  showEditSaveButton.value = false
  ruleForm.name = null
  ruleForm.county_id = null
  ruleForm.population = null
  ruleForm.area = null
  ruleForm.description = null
  formheader.value = 'Add Settlement'
  AddDialogVisible.value = false
}

const AddSettlement = () => {
  // Check if user is public user
  if (isPublicUser.value) {
    ElMessage({
      message: 'Public users do not have permission to create settlements.',
      type: 'warning',
    });
    return;
  }
  
  push({ name: 'AddSettlementNew' })
}

const AddDialogVisible = ref(false)
const formHeader = ref('Edit Settlement')

const editSettlement = (data: TableSlotDefault) => {
  push({
    name: 'AddSettlementNew',
    query: { id: data.row.id }
  });
  showEditSaveButton.value = true
  ruleForm.id = data.row.id
  ruleForm.name = data.row.name
  ruleForm.county_id = data.row.county_id
  ruleForm.settlement_type = data.row.settlement_type
  ruleForm.population = data.row.population
  ruleForm.area = data.row.area
  ruleForm.description = data.row.description
  ruleForm.code = data.row.code
  ruleForm.dist_town = data.row.dist_town
  ruleForm.dist_trunk = data.row.dist_trunk
  ruleForm.parcel_no = data.row.parcel_no
  ruleForm.parcel_owner = data.row.parcel_owner
  ruleForm.rim_no = data.row.rim_no
  ruleForm.isApproved = data.row.isApproved
  ruleForm.subcounty_id = data.row.subcounty_id
  ruleForm.ward_id = data.row.ward_id
  ruleForm.geom = data.row.geom
  fileUploadList.value = data.row.documents
  selectedCounty.value = data.row.county_id
  selectedSubCounty.value = data.row.subcounty_id
  selectedWard.value = data.row.ward_id
  value4.value = data.row.county_id
  value5.value = data.row.subcounty_id
  value6.value = data.row.ward_id
  saveFiltersToStorage();
  getSubCountyNames()
  getWardNames()
}

const handleEdit = (data) => {
  // Check if user can edit this settlement
  if (!canUserAccessSettlement(data, 'edit')) {
    ElMessage({
      message: 'You do not have permission to edit this settlement.',
      type: 'warning',
    });
    return;
  }

  push({
    name: 'AddSettlementNew',
    query: { id: data.id }
  });
  showEditSaveButton.value = true
  ruleForm.id = data.id
  ruleForm.name = data.name
  ruleForm.county_id = data.county_id
  ruleForm.settlement_type = data.settlement_type
  ruleForm.population = data.population
  ruleForm.area = data.area
  ruleForm.description = data.description
  ruleForm.code = data.code
  ruleForm.dist_town = data.dist_town
  ruleForm.dist_trunk = data.dist_trunk
  ruleForm.parcel_no = data.parcel_no
  ruleForm.parcel_owner = data.parcel_owner
  ruleForm.rim_no = data.rim_no
  ruleForm.isApproved = data.isApproved
  ruleForm.subcounty_id = data.subcounty_id
  ruleForm.ward_id = data.ward_id
  ruleForm.geom = data.geom
  fileUploadList.value = data.documents
  selectedCounty.value = data.county_id
  selectedSubCounty.value = data.subcounty_id
  selectedWard.value = data.ward_id
  value4.value = data.county_id
  value5.value = data.subcounty_id
  value6.value = data.ward_id
  saveFiltersToStorage();
  getSubCountyNames()
  getWardNames()
}

const DeleteSettlement = (data: TableSlotDefault) => {
  let formData = {}
  formData.id = data.id
  formData.model = model
  DeleteRecord(formData).then(response => {
    let index = tableDataList.value.indexOf(data);
    if (index !== -1) {
      tableDataList.value.splice(index, 1);
    }
  }).catch(error => {
    console.log(error)
  });
  if (data.documents.length > 0) {
    formData.filesToDelete = data.documents
    deleteDocument(formData)
  }
}

const handleDelete = async (data: any) => {
  // Check if user can delete this settlement
  // Handle both TableSlotDefault format and direct item format
  const settlement = data.row || data;
  
  if (!canUserAccessSettlement(settlement, 'delete')) {
    ElMessage({
      message: 'You do not have permission to delete this settlement. Only national/super/root admins or county staff who created the settlement can delete it.',
      type: 'warning',
      duration: 5000,
      showClose: true
    });
    return;
  }

  try {
    const formData: any = {
      id: settlement.id,
      model: model
    };

    // Delete documents first if they exist
    if (settlement.documents && settlement.documents.length > 0) {
      formData.filesToDelete = settlement.documents;
      try {
        await deleteDocument(formData);
      } catch (docError) {
        console.warn('Error deleting documents:', docError);
        // Continue with settlement deletion even if document deletion fails
      }
    }

    // Delete the settlement record
    const response = await DeleteRecord(formData);

    if (response && response.code === '0000') {
      ElMessage.success('Settlement deleted successfully. It has been moved to the Deleted tab and can be restored later.');

      // Remove from the appropriate list based on active segment
      const settlementId = settlement.id;
      
      if (activeSegment.value === 'Approved') {
        const index = tableDataList.value.findIndex((item: any) => item.id === settlementId);
        if (index !== -1) {
          tableDataList.value.splice(index, 1);
        }
      } else if (activeSegment.value === 'New') {
        const index = tableDataListNew.value.findIndex((item: any) => item.id === settlementId);
        if (index !== -1) {
          tableDataListNew.value.splice(index, 1);
        }
      } else if (activeSegment.value === 'Rejected') {
        const index = tableDataListRejected.value.findIndex((item: any) => item.id === settlementId);
        if (index !== -1) {
          tableDataListRejected.value.splice(index, 1);
        }
      } else if (activeSegment.value === 'Decommissioned') {
        const index = decommSettlements.value.findIndex((item: any) => item.id === settlementId);
        if (index !== -1) {
          decommSettlements.value.splice(index, 1);
        }
      }

      // Refresh counts
      await getCounts();

      // Refresh deleted settlements list if on Deleted tab
      if (activeSegment.value === 'Deleted') {
        await getSettlmentHistory();
      }
    } else {
      const errorMessage = response?.message || 'Failed to delete settlement';
      ElMessage.error(errorMessage);
    }
  } catch (error: any) {
    console.error('Error deleting settlement:', error);
    const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete settlement. Please try again.';
    
    // Check if it's a dependency error
    if (error?.response?.data?.code === 'DEPENDENCY_FOUND') {
      ElMessage.error({
        message: errorMessage,
        duration: 6000,
        showClose: true
      });
    } else {
      ElMessage.error(errorMessage);
    }
  }
}

const handleDeleteCascade = async () => {
  const selected = getSelectedSettlements()
  
  if (selected.length < 1) {
    ElMessage.warning('Please select at least one settlement to delete')
    return
  }

  // Filter settlements that user can delete
  const deletableSettlements = selected.filter(s => canUserAccessSettlement(s, 'delete'))
  const unauthorizedSettlements = selected.filter(s => !canUserAccessSettlement(s, 'delete'))

  if (unauthorizedSettlements.length > 0) {
    ElMessage.warning({
      message: `You do not have permission to delete ${unauthorizedSettlements.length} of the selected settlement(s). Only national/super/root admins or county staff who created the settlements can delete them.`,
      duration: 6000,
      showClose: true
    })
  }

  if (deletableSettlements.length < 1) {
    ElMessage.warning('None of the selected settlements can be deleted. Only national/super/root admins or county staff who created the settlements can delete them.')
    return
  }

  // Confirm with user
  try {
    await ElMessageBox.confirm(
      `You are about to permanently delete ${deletableSettlements.length} settlement(s) with all associated data (cascade delete).\n\n` +
      `Settlements to delete:\n${deletableSettlements.map(s => `- ${s.name} (ID: ${s.id})`).join('\n')}\n\n` +
      `This action will delete all related data including documents, roads, projects, facilities, and any other associations.\n\n` +
      `⚠️ WARNING: This action cannot be undone!`,
      'Confirm Cascade Delete',
      {
        type: 'warning',
        confirmButtonText: 'Delete Permanently',
        cancelButtonText: 'Cancel',
        dangerouslyUseHTMLString: false,
        distinguishCancelAndClose: true
      }
    )
  } catch {
    // User cancelled
    return
  }

  try {
    deleteCascadeLoading.value = true
    await nextTick() // Ensure Vue updates the reactive state
    const deletePromises = deletableSettlements.map(async (settlement) => {
      const formData: any = {
        id: settlement.id,
        model: model,
        cascade: true // Flag for cascade delete
      }

      // Delete documents first if they exist
      if (settlement.documents && settlement.documents.length > 0) {
        formData.filesToDelete = settlement.documents
        try {
          await deleteDocument(formData)
        } catch (docError) {
          console.warn(`Error deleting documents for settlement ${settlement.id}:`, docError)
          // Continue with settlement deletion even if document deletion fails
        }
      }

      // Delete the settlement record with cascade
      return DeleteRecord(formData)
    })

    const results = await Promise.allSettled(deletePromises)
    
    let successCount = 0
    let failCount = 0
    const failedSettlements: string[] = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value?.code === '0000') {
        successCount++
      } else {
        failCount++
        failedSettlements.push(deletableSettlements[index].name)
      }
    })

    // Remove successfully deleted settlements from the appropriate list
    const settlementIds = deletableSettlements
      .filter((_, index) => results[index].status === 'fulfilled' && results[index].value?.code === '0000')
      .map(s => s.id)

    if (activeSegment.value === 'Approved') {
      tableDataList.value = tableDataList.value.filter((item: any) => !settlementIds.includes(item.id))
    } else if (activeSegment.value === 'New') {
      tableDataListNew.value = tableDataListNew.value.filter((item: any) => !settlementIds.includes(item.id))
    } else if (activeSegment.value === 'Rejected') {
      tableDataListRejected.value = tableDataListRejected.value.filter((item: any) => !settlementIds.includes(item.id))
    } else if (activeSegment.value === 'Decommissioned') {
      decommSettlements.value = decommSettlements.value.filter((item: any) => !settlementIds.includes(item.id))
    }

    // Clear selected settlements
    selectedSettlements.value = []
    selectedSettlementsNew.value = []
    selectedSettlementsRejected.value = []
    selectedSettlementsDecommissioned.value = []

    // Refresh counts
    await getCounts()

    // Refresh deleted settlements list if on Deleted tab
    if (activeSegment.value === 'Deleted') {
      await getSettlmentHistory()
    }

    // Show results
    if (failCount === 0) {
      ElMessage.success({
        message: `Successfully deleted ${successCount} settlement(s) with all associated data.`,
        duration: 5000,
        showClose: true
      })
    } else {
      ElMessage.warning({
        message: `Deleted ${successCount} settlement(s). Failed to delete ${failCount} settlement(s): ${failedSettlements.join(', ')}`,
        duration: 8000,
        showClose: true
      })
    }
  } catch (error: any) {
    console.error('Error in cascade delete:', error)
    ElMessage.error(error?.response?.data?.message || 'Failed to delete settlements. Please try again.')
  } finally {
    deleteCascadeLoading.value = false
  }
}

const handleDecommission = async (data: TableSlotDefault) => {
  DecommissionDialog.value = true
  ruleForm.id = data.id
  ruleForm.name = data.name
}

const handleMerge = async (data: any) => {
  // Check if user can edit this settlement
  if (!canUserAccessSettlement(data, 'edit')) {
    ElMessage({
      message: 'You do not have permission to merge this settlement.',
      type: 'warning',
    });
    return;
  }
  
  currentSettlementForMerge.value = data
  mergePrimaryId.value = data.id
  selectedSettlementForMerge.value = null
  mergeSearchQuery.value = ''
  mergeSearchResults.value = []
  MergeDialog.value = true
}

const locationUpdateDrawer = ref(false)
const locationUpdateSettlement = ref<any>(null)
const locationUpdateMap = ref<any>(null)
const locationUpdateMapContainer = ref<HTMLElement | null>(null)
const locationUpdateDrawingManager = ref<any>(null)
const locationUpdatePolygon = ref<any>(null)
const locationUpdateMarker = ref<any>(null)
const locationUpdateLoading = ref(false)
const locationUpdateFileList = ref<UploadUserFile[]>([])
const locationUpdateShowUploadDialog = ref(false)
const locationUpdateOriginalGeometry = ref<any>(null)
const locationUpdateGeometryChanged = ref(false)

const handleUpdateLocation = async (data: any) => {
  // Check if user can edit this settlement
  if (!canUserAccessSettlement(data, 'edit')) {
    ElMessage({
      message: 'You do not have permission to update location for this settlement.',
      type: 'warning',
    });
    return;
  }
  
  locationUpdateSettlement.value = data
  // Store original geometry for comparison
  locationUpdateOriginalGeometry.value = data.geom ? JSON.parse(JSON.stringify(data.geom)) : null
  locationUpdateGeometryChanged.value = false
  locationUpdateDrawer.value = true
  
  // Initialize map after drawer is opened
  await nextTick()
  setTimeout(() => {
    initializeLocationUpdateMap()
  }, 300)
}

const initializeLocationUpdateMap = async () => {
  if (!locationUpdateMapContainer.value) {
    console.error('Map container not found')
    return
  }

  try {
    // Load Google Maps API
    const { Loader } = await import('@googlemaps/js-api-loader')
    const googleMapsApiKey = 'AIzaSyCrzbOkfG52zkAxYPkMvvRMlxE9qHK4uDk'
    
    const loader = new Loader({
      apiKey: googleMapsApiKey,
      version: 'weekly',
      libraries: ['drawing', 'geometry', 'places'],
      region: 'KE',
      language: 'en'
    })

    await loader.load()

    if (!window.google || !window.google.maps) {
      throw new Error('Google Maps API not loaded properly')
    }

    // Get existing geometry center or default
    let center = { lat: 1.137451, lng: 37.137343 }
    let zoom = 8
    
    if (locationUpdateSettlement.value?.geom) {
      const geom = locationUpdateSettlement.value.geom
      if (geom.type === 'Point') {
        center = { lat: geom.coordinates[1], lng: geom.coordinates[0] }
        zoom = 15
      } else if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
        const centroid = turf.centroid(geom)
        center = { lat: centroid.geometry.coordinates[1], lng: centroid.geometry.coordinates[0] }
        zoom = 13
      }
    }

    // Initialize map
    locationUpdateMap.value = new google.maps.Map(locationUpdateMapContainer.value, {
      center: center,
      zoom: zoom,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true
    })

    // Initialize drawing manager
    if (google.maps.drawing) {
      locationUpdateDrawingManager.value = new google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: true,
        drawingControlOptions: {
          position: google.maps.ControlPosition.TOP_CENTER,
          drawingModes: [google.maps.drawing.OverlayType.POLYGON]
        },
        polygonOptions: {
          fillColor: '#FF0000',
          fillOpacity: 0.2,
          strokeWeight: 2,
          strokeColor: '#FF0000',
          clickable: true,
          editable: true,
          draggable: false,
          zIndex: 1
        }
      })

      locationUpdateDrawingManager.value.setMap(locationUpdateMap.value)

      // Load existing geometry
      if (locationUpdateSettlement.value?.geom) {
        loadExistingLocationGeometry()
      } else {
        // If no geometry, allow drawing/uploading
        ElMessage.info('No existing geometry found. You can draw a polygon or upload a polygon file.')
      }

      // Listen for polygon completion
      google.maps.event.addListener(locationUpdateDrawingManager.value, 'polygoncomplete', (polygon: any) => {
        // Remove marker if exists (shouldn't happen, but safety check)
        if (locationUpdateMarker.value) {
          locationUpdateMarker.value.setMap(null)
          locationUpdateMarker.value = null
        }
        
        // Remove previous polygon if exists
        if (locationUpdatePolygon.value) {
          locationUpdatePolygon.value.setMap(null)
        }
        
        locationUpdatePolygon.value = polygon
        
        // Make polygon editable
        polygon.setEditable(true)
        polygon.setDraggable(false)
        
        // Listen for geometry changes
        polygon.getPath().addListener('set_at', checkGeometryChanged)
        polygon.getPath().addListener('insert_at', checkGeometryChanged)
        polygon.getPath().addListener('remove_at', checkGeometryChanged)
        
        // Check if geometry changed from original
        checkGeometryChanged()
        
        // Listen for geometry changes
        polygon.getPath().addListener('set_at', checkGeometryChanged)
        polygon.getPath().addListener('insert_at', checkGeometryChanged)
        polygon.getPath().addListener('remove_at', checkGeometryChanged)
      })
    }
  } catch (error: any) {
    console.error('Error initializing map:', error)
    ElMessage.error('Failed to load map. Please try again.')
  }
}

const loadExistingLocationGeometry = () => {
  if (!locationUpdateMap.value || !locationUpdateSettlement.value?.geom) return

  const geom = locationUpdateSettlement.value.geom
  
  try {
    if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
      const coordinates = geom.type === 'Polygon' 
        ? geom.coordinates[0].map((coord: number[]) => ({ lat: coord[1], lng: coord[0] }))
        : geom.coordinates[0][0].map((coord: number[]) => ({ lat: coord[1], lng: coord[0] }))

      // Remove marker if exists
      if (locationUpdateMarker.value) {
        locationUpdateMarker.value.setMap(null)
        locationUpdateMarker.value = null
      }

      if (locationUpdatePolygon.value) {
        locationUpdatePolygon.value.setMap(null)
      }

      locationUpdatePolygon.value = new google.maps.Polygon({
        paths: coordinates,
        fillColor: '#FF0000',
        fillOpacity: 0.2,
        strokeWeight: 2,
        strokeColor: '#FF0000',
        editable: true,
        draggable: false,
        map: locationUpdateMap.value
      })
      
      // Listen for geometry changes
      locationUpdatePolygon.value.getPath().addListener('set_at', checkGeometryChanged)
      locationUpdatePolygon.value.getPath().addListener('insert_at', checkGeometryChanged)
      locationUpdatePolygon.value.getPath().addListener('remove_at', checkGeometryChanged)

      // Fit map to polygon bounds
      const bounds = new google.maps.LatLngBounds()
      coordinates.forEach((coord: any) => bounds.extend(coord))
      locationUpdateMap.value.fitBounds(bounds)
      
      // Check if geometry changed from original
      checkGeometryChanged()
    } else if (geom.type === 'Point' || (geom.type === 'MultiPoint' && geom.coordinates.length > 0)) {
      // Handle Point geometry - show marker (read-only display, user must draw polygon to update)
      const position = geom.type === 'Point'
        ? { lat: geom.coordinates[1], lng: geom.coordinates[0] }
        : { lat: geom.coordinates[0][1], lng: geom.coordinates[0][0] }

      // Remove polygon if exists
      if (locationUpdatePolygon.value) {
        locationUpdatePolygon.value.setMap(null)
        locationUpdatePolygon.value = null
      }

      if (locationUpdateMarker.value) {
        locationUpdateMarker.value.setMap(null)
      }

      // Show marker as read-only reference (not draggable)
      locationUpdateMarker.value = new google.maps.Marker({
        position: position,
        map: locationUpdateMap.value,
        draggable: false, // Read-only
        title: `${locationUpdateSettlement.value.name || 'Settlement'} - Current Point Location (draw polygon to update)`,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          scaledSize: new google.maps.Size(32, 32)
        }
      })

      // Center map on marker
      locationUpdateMap.value.setCenter(position)
      locationUpdateMap.value.setZoom(15)

      ElMessage.info('Current geometry is a Point. Please draw a polygon to update it to a polygon boundary.')
    }
  } catch (error) {
    console.error('Error loading existing geometry:', error)
  }
}

const saveLocationUpdate = async () => {
  if (!locationUpdatePolygon.value) {
    ElMessage.warning('Please draw or edit a polygon on the map')
    return
  }

  try {
    locationUpdateLoading.value = true

    // Get polygon paths
    const paths = locationUpdatePolygon.value.getPath()
    const coordinates: number[][] = []
    
    paths.forEach((latLng: any) => {
      coordinates.push([latLng.lng(), latLng.lat()])
    })

    // Close the polygon (first point = last point)
    if (coordinates.length > 0) {
      const firstCoord = coordinates[0]
      if (coordinates[coordinates.length - 1][0] !== firstCoord[0] || 
          coordinates[coordinates.length - 1][1] !== firstCoord[1]) {
        coordinates.push([firstCoord[0], firstCoord[1]])
      }
    }

    const geom = {
      type: 'Polygon',
      coordinates: [coordinates]
    }

    // Update settlement geometry only
    const formData = {
      id: locationUpdateSettlement.value.id,
      model: 'settlement',
      geom: geom
    }

    const result = await updateOneRecord(formData)
    
    if (result) {
      ElMessage.success('Location updated successfully')
      
      // Update the settlement in the current list
      const updateSettlementInList = (list: any[]) => {
        const index = list.findIndex((s: any) => s.id === locationUpdateSettlement.value.id)
        if (index !== -1) {
          list[index].geom = geom
        }
      }

      if (activeSegment.value === 'Approved') {
        updateSettlementInList(tableDataList.value)
      } else if (activeSegment.value === 'New') {
        updateSettlementInList(tableDataListNew.value)
      } else if (activeSegment.value === 'Rejected') {
        updateSettlementInList(tableDataListRejected.value)
      } else if (activeSegment.value === 'Decommissioned') {
        updateSettlementInList(decommSettlements.value)
      }

      // Close drawer and cleanup
      handleLocationDrawerClose()
    }
  } catch (error: any) {
    console.error('Error updating location:', error)
    ElMessage.error(error?.response?.data?.message || 'Failed to update location. Please try again.')
  } finally {
    locationUpdateLoading.value = false
  }
}

const handleLocationDrawerClose = (done?: () => void) => {
  cleanupLocationUpdateMap()
  if (done && typeof done === 'function') {
    done() // Call done callback to actually close the drawer
  } else {
    locationUpdateDrawer.value = false
  }
}

const checkGeometryChanged = () => {
  if (!locationUpdatePolygon.value) {
    // If no polygon exists, check if original had geometry
    locationUpdateGeometryChanged.value = locationUpdateOriginalGeometry.value !== null
    return
  }
  
  try {
    const paths = locationUpdatePolygon.value.getPath()
    const coordinates: number[][] = []
    
    paths.forEach((latLng: any) => {
      coordinates.push([latLng.lng(), latLng.lat()])
    })
    
    // Close the polygon (first point = last point)
    if (coordinates.length > 0) {
      const firstCoord = coordinates[0]
      if (coordinates[coordinates.length - 1][0] !== firstCoord[0] || 
          coordinates[coordinates.length - 1][1] !== firstCoord[1]) {
        coordinates.push([firstCoord[0], firstCoord[1]])
      }
    }
    
    const currentGeom = {
      type: 'Polygon',
      coordinates: [coordinates]
    }
    
    // Compare with original geometry
    if (!locationUpdateOriginalGeometry.value) {
      // Original had no geometry, so any polygon is a change
      locationUpdateGeometryChanged.value = true
    } else {
      // Deep compare geometries
      const originalStr = JSON.stringify(locationUpdateOriginalGeometry.value)
      const currentStr = JSON.stringify(currentGeom)
      locationUpdateGeometryChanged.value = originalStr !== currentStr
    }
  } catch (error) {
    console.error('Error checking geometry change:', error)
    locationUpdateGeometryChanged.value = false
  }
}

const cleanupLocationUpdateMap = () => {
  if (locationUpdatePolygon.value) {
    locationUpdatePolygon.value.setMap(null)
    locationUpdatePolygon.value = null
  }
  if (locationUpdateMarker.value) {
    locationUpdateMarker.value.setMap(null)
    locationUpdateMarker.value = null
  }
  if (locationUpdateDrawingManager.value) {
    locationUpdateDrawingManager.value.setMap(null)
    locationUpdateDrawingManager.value = null
  }
  if (locationUpdateMap.value) {
    locationUpdateMap.value = null
  }
  locationUpdateSettlement.value = null
  locationUpdateOriginalGeometry.value = null
  locationUpdateGeometryChanged.value = false
  locationUpdateFileList.value = []
  locationUpdateShowUploadDialog.value = false
}

const readLocationUpdateJson = (event: any) => {
  console.log('Reading JSON file for location update....', event)
  let str = event.target.result
  let json = JSON.parse(str)
  
  const targetProj = "+proj=longlat +datum=WGS84 +no_defs"
  let sourceProj
  let epsgCode
  let crsProp = json.crs ? json.crs.properties.name : null;
  
  if (crsProp && crsProp.includes('EPSG')) {
    epsgCode = crsProp.match(/EPSG::(\d+)/)[1]
  } else {
    epsgCode = 4326
  }
  
  if (epsgCode == 21037) {
    sourceProj = "+proj=utm + zone=37 + south + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs";
  } else if (epsgCode == 21097) {
    sourceProj = "+proj=utm + zone=37 + north + a=6378249.145 + rf=293.465 + towgs84=-157,-2,-299,0,0,0,0 + units=m + no_defs";
  } else if (epsgCode == 21036) {
    sourceProj = "+proj=utm + zone=36 + south + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs";
  } else if (epsgCode == 21096) {
    sourceProj = "+proj=utm + zone=36 + north + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs";
  } else {
    sourceProj = "+proj=longlat +datum=WGS84 +no_defs"
  }
  
  proj4.defs("SOURCE_CRS", sourceProj);
  proj4.defs("WGS84", targetProj);
  
  if (json.features && json.features.length != 1) {
    ElMessage.warning('Please upload a file with only one feature. This one has ' + json.features.length + ' features')
    return
  }
  
  // Validate: Only accept Polygon geometry types
  let geometry: any = null
  
  if (json.features && json.features.length === 1) {
    geometry = json.features[0].geometry;
  } else if (json.type === 'FeatureCollection' && json.features) {
    if (json.features.length !== 1) {
      ElMessage.warning('Please upload a file with only one feature. This one has ' + json.features.length + ' features')
      return
    }
    geometry = json.features[0].geometry;
  } else if (json.type === 'Feature' && json.geometry) {
    geometry = json.geometry;
  } else {
    ElMessage.error('Invalid GeoJSON format. Please ensure the file contains a valid Feature or FeatureCollection.')
    return
  }
  
  // Reject non-Polygon geometries
  if (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon') {
    ElMessage.error(`Geometry type "${geometry.type}" is not supported. Only Polygon or MultiPolygon geometries are accepted.`)
    return
  }
  
  // Transform coordinates for Polygon/MultiPolygon
  if (geometry.type === "Polygon") {
    geometry.coordinates[0] = geometry.coordinates[0].map((coordinate: number[]) => {
      return proj4("SOURCE_CRS", "WGS84", coordinate);
    });
  } else if (geometry.type === "MultiPolygon") {
    geometry.coordinates.forEach((polygon: number[][][]) => {
      polygon[0] = polygon[0].map((coordinate: number[]) => {
        return proj4("SOURCE_CRS", "WGS84", coordinate);
      });
    });
  }
  
  let geom = {
    type: geometry.type,
    coordinates: geometry.coordinates
  }
  
  // Update polygon on map
  updateLocationUpdatePolygon(geom)
  locationUpdateShowUploadDialog.value = false
}

const readLocationUpdateShp = async (file: File) => {
  console.log('Reading Shapefile for location update....')
  
  readShapefileAndConvertToGeoJSON(file)
    .then((geojson) => {
      if (geojson.length != 1) {
        ElMessage.warning('Please upload a file with only one feature. This one has ' + geojson.length + ' features')
        return
      }
      
      const geometryType = geojson[0].geometry.type
      
      // Reject non-Polygon geometries
      if (geometryType !== 'Polygon' && geometryType !== 'MultiPolygon') {
        ElMessage.error(`Geometry type "${geometryType}" is not supported. Only Polygon or MultiPolygon geometries are accepted.`)
        return
      }
      
      let geomX = {
        type: geometryType,
        coordinates: geojson[0].geometry.coordinates,
      }
      
      // Update polygon on map
      updateLocationUpdatePolygon(geomX)
      locationUpdateShowUploadDialog.value = false
    })
    .catch((error) => {
      console.error(error)
      ElMessage.error('Invalid files. Check your zipped file to contain (.shp, .dbf and .prj) or a proper kml/kmz')
    })
}

const updateLocationUpdatePolygon = (geom: any) => {
  if (!locationUpdateMap.value) {
    ElMessage.warning('Map not initialized. Please wait for the map to load.')
    return
  }
  
  try {
    // Only accept Polygon or MultiPolygon geometries
    if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
      const coordinates = geom.type === 'Polygon' 
        ? geom.coordinates[0].map((coord: number[]) => ({ lat: coord[1], lng: coord[0] }))
        : geom.coordinates[0][0].map((coord: number[]) => ({ lat: coord[1], lng: coord[0] }))

      // Remove marker if exists
      if (locationUpdateMarker.value) {
        locationUpdateMarker.value.setMap(null)
        locationUpdateMarker.value = null
      }

      // Remove previous polygon if exists
      if (locationUpdatePolygon.value) {
        locationUpdatePolygon.value.setMap(null)
      }

      // Create new polygon
      locationUpdatePolygon.value = new google.maps.Polygon({
        paths: coordinates,
        fillColor: '#FF0000',
        fillOpacity: 0.2,
        strokeWeight: 2,
        strokeColor: '#FF0000',
        editable: true,
        draggable: false,
        map: locationUpdateMap.value
      })
      
      // Listen for geometry changes
      locationUpdatePolygon.value.getPath().addListener('set_at', checkGeometryChanged)
      locationUpdatePolygon.value.getPath().addListener('insert_at', checkGeometryChanged)
      locationUpdatePolygon.value.getPath().addListener('remove_at', checkGeometryChanged)

      // Fit map to polygon bounds
      const bounds = new google.maps.LatLngBounds()
      coordinates.forEach((coord: any) => bounds.extend(coord))
      locationUpdateMap.value.fitBounds(bounds)
      
      // Check if geometry changed from original
      checkGeometryChanged()
      
      ElMessage.success('Polygon loaded successfully. You can edit it by clicking on the polygon.')
    } else {
      ElMessage.warning('Only Polygon or MultiPolygon geometries are accepted. Please upload a file with polygon geometry.')
    }
  } catch (error) {
    console.error('Error updating geometry:', error)
    ElMessage.error('Failed to load geometry on map.')
  }
}

const handleLocationUpdateUploadGeo = async (uploadFile: any) => {
  console.log('Upload for location update>>>', uploadFile)
  
  var fileType = uploadFile.name.split('.').pop()?.toLowerCase()
  var rfile = uploadFile.raw
  
  if (!rfile) {
    ElMessage.error('File not found')
    return
  }
  
  let reader = new FileReader()
  
  if (fileType === 'geojson' || fileType === 'json') {
    reader.onload = readLocationUpdateJson
    reader.readAsText(rfile)
  } else if (fileType === 'zip' || fileType === 'kml' || fileType === 'kmz') {
    readLocationUpdateShp(rfile)
  } else {
    ElMessage.error('Only GeoJSON, KML, KMZ or zipped shapefiles are supported at the moment')
  }
}

const handleSelectionChange = (selection: any[]) => {
  if (activeSegment.value === 'Approved') {
    selectedSettlements.value = selection
  } else if (activeSegment.value === 'New') {
    selectedSettlementsNew.value = selection
  } else if (activeSegment.value === 'Rejected') {
    selectedSettlementsRejected.value = selection
  } else if (activeSegment.value === 'Decommissioned') {
    selectedSettlementsDecommissioned.value = selection
  }
}

const getSelectedSettlements = () => {
  if (activeSegment.value === 'Approved') {
    return selectedSettlements.value
  } else if (activeSegment.value === 'New') {
    return selectedSettlementsNew.value
  } else if (activeSegment.value === 'Rejected') {
    return selectedSettlementsRejected.value
  } else if (activeSegment.value === 'Decommissioned') {
    return selectedSettlementsDecommissioned.value
  }
  return []
}

const handleMergeFromSelection = async () => {
  const selected = getSelectedSettlements()
  
  if (selected.length < 2) {
    ElMessage.warning('Please select at least 2 settlements to merge')
    return
  }
  
  const primary = selected[0]
  const duplicates = selected.slice(1)

  // Check permissions for all settlements
  const unauthorized = selected.filter(s => !canUserAccessSettlement(s, 'edit'))
  if (unauthorized.length > 0) {
    ElMessage({
      message: 'You do not have permission to merge one or more of the selected settlements.',
      type: 'warning',
    });
    return;
  }

  // Confirm with user
  try {
    await ElMessageBox.confirm(
      `You are about to merge ${selected.length} settlements.\n\n` +
      `Primary (kept): ${primary.name} (ID: ${primary.id})\n` +
      `To be merged into it: ${duplicates.map(d => `${d.name} (ID: ${d.id})`).join(', ')}\n\n` +
      `All associated data (documents, roads, projects, facilities, etc.) will be moved to the primary settlement.`,
      'Confirm Merge',
      {
        type: 'warning',
        confirmButtonText: 'Merge',
        cancelButtonText: 'Cancel',
      }
    )
  } catch {
    // User cancelled
    return
  }

  try {
    const formData = {
      model: 'settlement',
      primaryId: primary.id,
      duplicateIds: duplicates.map(d => d.id),
    }

    const res = await mergeDuplicates(formData)

    if (res.code === '0000') {
      const mergeHistoryInfo = res.mergeHistory || []
      const historyMessage = mergeHistoryInfo.length > 0 
        ? ` Merge has been tracked in history (e.g. ID: ${mergeHistoryInfo[0].history_id}). You can restore merged settlements if needed.`
        : ''

      ElMessage.success({
        message: `Settlements merged successfully! All references (documents, roads, projects, facilities, etc.) have been updated.${historyMessage}`,
        duration: 6000,
        showClose: true,
      })

      // Refresh current segment data and counts
      await getNewOrRejectedSettlements(activeSegment.value)
      await getCounts()

      // Clear selected settlements
      selectedSettlements.value = []
      selectedSettlementsNew.value = []
      selectedSettlementsRejected.value = []
      selectedSettlementsDecommissioned.value = []
    } else {
      ElMessage.error('Failed to merge settlements')
    }
  } catch (error: any) {
    console.error('Error merging settlements from selection:', error)
    ElMessage.error(error?.response?.data?.message || 'Failed to merge settlements. Please try again.')
  }
}

const searchSettlementsForMerge = async (keyword = '') => {
  const query = keyword || mergeSearchQuery.value?.trim()
  
  if (!query || query.length < 2) {
    mergeSearchResults.value = []
    return
  }
  
  mergeSearchLoading.value = true
  try {
    // Build filters with role-based filters
    const mergeFilters: string[] = ['isActive']
    const mergeFilterValues: any[][] = [['true']]
    
    // Apply role-based filters
    if (roles_filters.length > 0) {
      roles_filters.forEach(rf => {
        if (rf.field && rf.value !== null && rf.value !== undefined) {
          const existingIndex = mergeFilters.indexOf(rf.field)
          if (existingIndex === -1) {
            mergeFilters.push(rf.field)
            mergeFilterValues.push(Array.isArray(rf.value) ? rf.value : [rf.value])
          } else {
            mergeFilterValues[existingIndex] = Array.isArray(rf.value) ? rf.value : [rf.value]
          }
        }
      })
    }
    
    const formData: any = {
      curUser: 1,
      model: 'settlement',
      searchField: 'name',
      searchKeyword: query,
      excludeGeom: false,
      excludeGeomAssoc: true,
      associated_multiple_models: ['county', 'subcounty', 'ward'],
      filters: mergeFilters,
      filterValues: mergeFilterValues
    }
    
    const res = await searchByKeyWord(formData)
    
    // Filter out the current settlement from results
    mergeSearchResults.value = (res.data || []).filter((s: any) => s.id !== currentSettlementForMerge.value.id)
  } catch (error) {
    console.error('Error searching settlements:', error)
    ElMessage.error('Failed to search settlements')
    mergeSearchResults.value = []
  } finally {
    mergeSearchLoading.value = false
  }
}

// Watch for settlement selection to set default primary
watch(selectedSettlementForMerge, (newValue) => {
  if (newValue && currentSettlementForMerge.value) {
    // Default to current settlement as primary when a settlement is selected
    mergePrimaryId.value = currentSettlementForMerge.value.id
  }
})

const showMergeConfirmation = () => {
  if (!selectedSettlementForMerge.value) {
    ElMessage.warning('Please select a settlement to merge with')
    return
  }
  
  if (!mergePrimaryId.value) {
    ElMessage.warning('Please select which settlement should be the primary record')
    return
  }
  
  MergeConfirmDialog.value = true
}

const confirmMerge = async () => {
  try {
    const primaryId = mergePrimaryId.value
    const duplicateId = mergePrimaryId.value === currentSettlementForMerge.value.id 
      ? selectedSettlementForMerge.value.id 
      : currentSettlementForMerge.value.id
    
    const formData = {
      model: 'settlement',
      primaryId: primaryId,
      duplicateIds: [duplicateId]
    }
    
    const res = await mergeDuplicates(formData)
    
    if (res.code === '0000') {
      const mergeHistoryInfo = res.mergeHistory || []
      const historyMessage = mergeHistoryInfo.length > 0 
        ? ` Merge has been tracked in history (ID: ${mergeHistoryInfo[0].history_id}). You can restore it if needed.`
        : ''
      
      ElMessage.success({
        message: 'Settlements merged successfully! All references (documents, roads, projects, facilities, etc.) have been updated.' + historyMessage,
        duration: 6000,
        showClose: true
      })
      MergeDialog.value = false
      MergeConfirmDialog.value = false
      
      // Refresh the current segment data
      await getNewOrRejectedSettlements(activeSegment.value)
      await getCounts()
      
      // Refresh deleted settlements list if on Deleted tab, or refresh it anyway to keep it updated
      if (activeSegment.value === 'Deleted') {
        await getSettlmentHistory()
      }
      
      // Reset merge state
      currentSettlementForMerge.value = null
      selectedSettlementForMerge.value = null
      mergeSearchQuery.value = ''
      mergeSearchResults.value = []
      mergePrimaryId.value = null
      
      // Clear selected settlements
      selectedSettlements.value = []
      selectedSettlementsNew.value = []
      selectedSettlementsRejected.value = []
      selectedSettlementsDecommissioned.value = []
    } else {
      ElMessage.error('Failed to merge settlements')
    }
  } catch (error: any) {
    console.error('Error merging settlements:', error)
    ElMessage.error(error?.response?.data?.message || 'Failed to merge settlements. Please try again.')
  }
}

const confirmDecommission = async () => {
  try {
    const formData = {
      id: ruleForm.id,
      isApproved: 'Decommissioned',
      model: 'settlement',
      reviewerId: userInfo.id,
      decommission_reason: decommissionReason.value
    };
    
    await updateOneRecord(formData);
    
    // Remove from approved list
    const index = tableDataList.value.findIndex(item => item.id === ruleForm.id);
    if (index !== -1) {
      tableDataList.value.splice(index, 1);
    }
    
    // Update counts
    await getCounts();
    
    DecommissionDialog.value = false
    decommissionReason.value = ''
    
    ElMessage({
      message: 'Settlement decommissioned successfully!',
      type: 'success'
    });
  } catch (error) {
    console.error('Error decommissioning settlement:', error);
    ElMessage({
      message: 'Failed to decommission settlement. Please try again.',
      type: 'error'
    });
  }
}

const showSelectFields = ref(false)
const selectedFields = ref([])

const getFilteredDownloadData = async (selFilters, selfilterValues) => {
  // Apply role filters before downloading
  pushRoleFilters()
  const formData = {}
  formData.model = model
  formData.searchField = 'name'
  formData.searchKeyword = ''
  formData.assocModel = associated_Model
  // Use filters.value and filterValues.value after pushRoleFilters() to ensure role filters are applied
  formData.filters = filters.value
  formData.filterValues = filterValues.value
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = nested_models
  formData.dateRange = dateRange.value


  const res = await getSettlementListByCounty(formData)
  return res.data
}

const downloadLoading = ref(false);
const downloadGeoLoading = ref(false);
const deleteCascadeLoading = ref(false);

const handleDownloadGeoData = async () => {
  try {
    downloadGeoLoading.value = true;
    
    // Set status filter based on active segment first
    if (activeSegment.value === 'New') {
      filters.value = ['isApproved', 'isActive', ...filters.value.filter(f => f !== 'isApproved' && f !== 'isActive')];
      filterValues.value = [['Pending'], ['true'], ...filterValues.value.filter((_, i) => filters.value[i] !== 'isApproved' && filters.value[i] !== 'isActive')];
    } else if (activeSegment.value === 'Rejected') {
      filters.value = ['isApproved', 'isActive', ...filters.value.filter(f => f !== 'isApproved' && f !== 'isActive')];
      filterValues.value = [['Rejected'], ['true'], ...filterValues.value.filter((_, i) => filters.value[i] !== 'isApproved' && filters.value[i] !== 'isActive')];
    } else if (activeSegment.value === 'Decommissioned') {
      filters.value = ['isApproved', 'isActive', ...filters.value.filter(f => f !== 'isApproved' && f !== 'isActive')];
      filterValues.value = [['Decommissioned'], ['true'], ...filterValues.value.filter((_, i) => filters.value[i] !== 'isApproved' && filters.value[i] !== 'isActive')];
    } else {
      // Approved
      filters.value = ['isApproved', 'isActive', ...filters.value.filter(f => f !== 'isApproved' && f !== 'isActive')];
      filterValues.value = [['Approved'], ['true'], ...filterValues.value.filter((_, i) => filters.value[i] !== 'isApproved' && filters.value[i] !== 'isActive')];
    }
    
    // Apply role filters (this will update filters.value and filterValues.value)
    pushRoleFilters();
    
    // Fetch ALL filtered settlements (not just current page)
    const formData: any = {
      // Keep a high cap but only fetch lightweight records (IDs only, no geom)
      limit: 10000,
      page: 1,
      curUser: 1,
      model: model,
      searchField: 'name',
      searchKeyword: search_string.value || '',
      assocModel: associated_Model,
      filters: filters.value,
      filterValues: filterValues.value,
      associated_multiple_models: [],      // avoid heavy joins for export lookup
      nested_models: [],                   // no nested models needed to get IDs
      fields: ['id'],                      // only fetch settlement IDs
      excludeGeom: true,                   // explicitly skip geometry in this query
      dateRange: dateRange.value,
      returnAll: true
    };
    
    ElMessage.info('Fetching filtered settlements...');
    const res = await getSettlementListByCounty(formData);
    
    if (!res.data || res.data.length === 0) {
      ElMessage.warning('No settlements found to download. Please apply filters first.');
      return;
    }
    
    // Extract settlement IDs
    const settlementIds = res.data.map((s: any) => s.id).filter((id: any) => id != null);
    
    if (settlementIds.length === 0) {
      ElMessage.warning('No valid settlement IDs found');
      return;
    }
    
    ElMessage.info(`Preparing geospatial data for ${settlementIds.length} settlement(s)...`);
    
    // Call the API to download geospatial data
    const { blob, shareLink, documentId } = await downloadSettlementsGeoData({
      settlementIds: settlementIds,
      filters: segmentFilters,
      filterValues: segmentFilterValues
    });
    
    console.log('Share link received:', shareLink);
    console.log('Document ID received:', documentId);
    
    // If share link not in header, try to get it via shareDocuments API (same pattern as DocumentsTagged.vue)
    let finalShareLink = shareLink;
    if (!finalShareLink && documentId) {
      try {
        // Create a new share link using the same API as DocumentsTagged.vue
        const shareResponse = await shareDocuments({
          documentIds: [documentId],
          expiresInHours: 0 // No expiry, same as backend creates
        });
        const shareData = shareResponse?.data || shareResponse;
        // Use same pattern as DocumentsTagged.vue line 774-776
        if ((shareData?.code === '0000' && shareData?.data?.url) || (shareResponse?.code === '0000' && shareResponse?.data?.url)) {
          const out = shareData?.data?.url ? shareData : shareResponse;
          finalShareLink = out.data.url;
          console.log('Share link retrieved via API (same as DocumentsTagged.vue):', finalShareLink);
        }
      } catch (err) {
        console.warn('Failed to get share link via API:', err);
      }
    }
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `settlements_geodata_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    // Show share link if available
    if (finalShareLink) {
      console.log('Showing dialog with share link:', finalShareLink);
      // Copy share link to clipboard
      let clipboardSuccess = false;
      try {
        await navigator.clipboard.writeText(finalShareLink);
        clipboardSuccess = true;
      } catch (err) {
        console.warn('Failed to copy to clipboard:', err);
      }
      
      // Show dialog with share link for easy copying and email sharing
      ElMessageBox.alert(
        `<div style="margin: 10px 0;">
          <p style="margin-bottom: 15px; font-size: 14px; color: #333;">
            <strong>Download started!</strong> Your geospatial data is being downloaded.
          </p>
          <p style="margin-bottom: 10px; font-weight: 600; color: #409EFF;">Share Link (No Expiry):</p>
          <div style="background: #f5f7fa; padding: 12px; border-radius: 4px; margin: 10px 0; border: 1px solid #e4e7ed;">
            <p style="word-break: break-all; margin: 0; font-family: monospace; font-size: 13px; color: #303133;">
              ${finalShareLink}
            </p>
          </div>
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e4e7ed;">
            <p style="margin: 0; font-size: 12px; color: #909399;">
              ${clipboardSuccess ? '✓ Link copied to clipboard. You can paste it in an email or share it with others.' : 'Click the link above to copy it, or select and copy the text.'}
            </p>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #909399;">
              This link never expires and provides public access to download the geospatial data.
            </p>
          </div>
        </div>`,
        'Geospatial Data Share Link',
        {
          dangerouslyUseHTMLString: true,
          confirmButtonText: 'Got it',
          type: 'success',
          customClass: 'share-link-dialog'
        }
      ).then(() => {
        // Show a success message after dialog is closed
        ElMessage.success({
          message: `Download completed! Share link: ${finalShareLink}`,
          duration: 8000,
          showClose: true
        });
      });
    } else {
      ElMessage.success(`Geospatial data downloaded successfully for ${settlementIds.length} settlement(s)`);
    }
  } catch (error: any) {
    console.error('Error downloading geospatial data:', error);
    ElMessage.error(error?.response?.data?.message || 'Failed to download geospatial data. Please try again.');
  } finally {
    downloadGeoLoading.value = false;
  }
};

const handleDownloadSelectFields = async () => {
  if (selectedFields.value.length < 1) {
    ElMessage.warning('Specify the fields you want on the exported file')
    return
  }
  downloadLoading.value = true;
  try {
    let dataToDownload = []
    if (filters.value.length > 2 && filterValues.value.length > 1) {
      const downData = await getFilteredDownloadData(filters.value, filterValues.value)
      downData.forEach(function (arrayItem) {
        var dd = flattenJSON(arrayItem)
        dataToDownload.push(dd)
      })
    } else {
      dataToDownload.push(...flattenedData.value)
    }
    let fields = []
    for (let i = 0; i < selectedFields.value.length; i++) {
      var fld = {}
      fld.label = selectedFields.value[i]
      fld.value = selectedFields.value[i]
      fields.push(fld)
    }
    var dataObj = {}
    dataObj.sheet = 'data'
    dataObj.columns = fields
    let dataHolder = []
    for (let i = 0; i < dataToDownload.length; i++) {
      let thisRecord = {}
      thisRecord.index = i + 1
      for (let j = 0; j < fields.length; j++) {
        var fld = fields[j].label
        thisRecord[fld] = dataToDownload[i][fld]
      }
      dataHolder.push(thisRecord)
    }
    dataObj.content = dataHolder
    let settings = {
      fileName: model,
      writeMode: "writeFile",
      writeOptions: {},
    }
    xlsx([dataObj], settings)
  } finally {
    downloadLoading.value = false;
  }
}

const dialogWidth = ref(isMobile.value ? "90%" : "25%")

const getDocumentTypes = async () => {}
getDocumentTypes()

const readShp = async (file) => {
  readShapefileAndConvertToGeoJSON(file)
    .then((geojson) => {
      if (geojson.length != 1) {
        ElMessage.warning('Please upload a file with only one feature. This one has ' + geojson.length + ' features')
      } else {
        let geom = {
          type: geojson[0].geometry.type,
          coordinates: geojson[0].geometry.coordinates
        }
        ruleForm.geom = geom
      }
    })
    .catch((error) => {
      console.error(error)
      ElMessage.error('Invalid shapefiles. Check your zipped file')
    })
}

const readJson = (event) => {
  let str = event.target.result
  let json = JSON.parse(str)
  const targetProj = "+proj=longlat +datum=WGS84 +no_defs"
  let sourceProj
  let epsgCode
  let crsProp = json.crs ? json.crs.properties.name : null;
  if (crsProp && crsProp.includes('EPSG')) {
    epsgCode = crsProp.match(/EPSG::(\d+)/)[1]
  } else {
    epsgCode = 4326
  }
  if (epsgCode == 21037) {
    sourceProj = "+proj=utm + zone=37 + south + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs";
  } else if (epsgCode == 21097) {
    sourceProj = "+proj=utm + zone=37 + north + a=6378249.145 + rf=293.465 + towgs84=-157,-2,-299,0,0,0,0 + units=m + no_defs";
  } else if (epsgCode == 21036) {
    sourceProj = "+proj=utm + zone=36 + south + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs";
  } else if (epsgCode == 21096) {
    sourceProj = "+proj=utm + zone=36 + north + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs";
  } else {
    sourceProj = "+proj=longlat +datum=WGS84 +no_defs"
  }
  proj4.defs("SOURCE_CRS", sourceProj);
  proj4.defs("WGS84", targetProj);
  if (json.features.length != 1) {
    ElMessage.warning('Please upload a file with only one feature. This one has ' + json.features.length + ' features')
  } else {
    const geometry = json.features[0].geometry;
    if (geometry.type === "Polygon") {
      geometry.coordinates[0] = geometry.coordinates[0].map(coordinate => {
        return proj4("SOURCE_CRS", "WGS84", coordinate);
      });
    } else if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach(polygon => {
        polygon[0] = polygon[0].map(coordinate => {
          return proj4("SOURCE_CRS", "WGS84", coordinate);
        });
      });
    }
    let geom = {
      type: json.features[0].geometry.type,
      coordinates: geometry.coordinates
    }
    ruleForm.geom = geom
  }
}

const handleUploadGeo = async (uploadFile) => {
  var fileType = uploadFile.name.split('.').pop()
  var rfile = uploadFile.raw
  let reader = new FileReader()
  if (fileType === 'geojson' || fileType === 'json') {
    reader.onload = readJson
    reader.readAsText(rfile)
  } else if (fileType === 'zip') {
    readShp(rfile)
  } else {
    ElMessage.error('Only geojson or zipped shapefiles are supported at the moment')
  }
}

const tableRowClassName = (data) => {
  if (data.row.documents.length > 0) {
    return 'warning-row'
  }
  return ''
}

const activeStep = ref(0)
const next = () => {
  if (activeStep.value++ > 2) activeStep.value = 0
}

const copyToClipboard = (code) => {
  navigator.clipboard.writeText(code)
    .then(() => {
      ElMessage({
        message: 'Code copied to clipboard!',
        type: 'success'
      });
    })
    .catch((error) => {
      console.error(error);
      ElMessage.error('Failed to copy code to clipboard');
    });
}

const hoveredRow = ref()
const showCopyIcon = (row) => {
  hoveredRow.value = row;
}
const hideCopyIcon = (row) => {
  if (hoveredRow.value === row) {
    hoveredRow.value = null;
  }
}

const isCopyIconVisible = (row) => {
  return hoveredRow.value === row;
}

const handleSelectCounty = async (county_id: any) => {
  selectedCounty.value = county_id
  ruleForm.subcounty_id = ''
  ruleForm.ward_id = ''
  await getSubCountyNames()
  saveFiltersToStorage();
}

const handleSelectSubCounty = async (subcounty_id: any) => {
  selectedSubCounty.value = subcounty_id
  ruleForm.ward_id = ''
  await getWardNames()
  saveFiltersToStorage();
}

const mfield = 'settlement_id'
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
  componentProps.value.data = row
  dynamicComponent.value = null;
  addMoreDocuments.value = true;
  setTimeout(() => {
    dynamicComponent.value = ChildComponent;
  }, 100);
}

const rowData = ref()
const documentComponent = defineAsyncComponent(() => import('@/views/Components/ListDocuments.vue'));
const dynamicDocumentComponent = ref();
const DocumentComponentProps = ref({
  message: 'documents',
  data: rowData.value,
  docmodel: model,
});

const expandedRowKeys = ref([])

function handleExpand(row, expandedRows) {
  dynamicDocumentComponent.value = null;
  rowData.value = row
  DocumentComponentProps.value.data = row
  setTimeout(() => {
    dynamicDocumentComponent.value = documentComponent;
  }, 100);
  if (expandedRows.includes(row)) {
    expandedRowKeys.value = [row.id]
  } else {
    expandedRowKeys.value = []
  }
}

const router = useRouter()

const goBack = () => {
  if (router) {
    router.back()
  } else {
    console.warn('Router instance not available.')
  }
}

function formatDate(row, column, cellValue) {
  if (!cellValue) return '';
  const date = new Date(cellValue);
  return date.toLocaleDateString();
}

const duplicateDialogShow = ref(false)
const selectedDuplicate = ref(null);
const map = ref();
const mapContainer = ref(null);

const showDuplicateMap = (duplicate) => {
  selectedDuplicate.value = duplicate.row;
  duplicateDialogShow.value = true;
  nextTick(() => {
    if (!map.value) {
      mapboxgl.accessToken = 'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg';
      map.value = new mapboxgl.Map({
        container: mapContainer.value,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [37.9062, -0.0236],
        zoom: 12,
      });
      map.value.on('load', () => {
        addDuplicatesToMap(duplicate.row.duplicates);
        map.value.addSource('satellite', {
          type: 'raster',
          url: 'mapbox://mapbox.satellite',
          tileSize: 256
        });
        map.value.addLayer({
          id: 'satellite-layer',
          type: 'raster',
          source: 'satellite',
          layout: {
            visibility: 'none',
          },
        });
      });
    }
  });
};

const toggleLayer = () => {
  const streetsLayerVisibility = map.value.getLayoutProperty('satellite-layer', 'visibility');
  if (streetsLayerVisibility === 'none') {
    map.value.setLayoutProperty('satellite-layer', 'visibility', 'visible');
    map.value.setStyle('mapbox://styles/mapbox/satellite-streets-v11');
  } else {
    map.value.setLayoutProperty('satellite-layer', 'visibility', 'none');
    map.value.setStyle('mapbox://styles/mapbox/streets-v11');
  }
};

const addDuplicatesToMap = (duplicates) => {
  const bounds = new mapboxgl.LngLatBounds();
  duplicates.forEach(duplicate => {
    if (duplicate.geom) {
      const geometryType = duplicate.geom.type;
      if (geometryType === 'Point') {
        bounds.extend(duplicate.geom.coordinates);
      } else if (geometryType === 'Polygon') {
        const polygon = turf.polygon(duplicate.geom.coordinates);
        const centroid = turf.centroid(polygon);
        map.value.addSource(`duplicate-${duplicate.id}`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: duplicate.geom,
          },
        });
        map.value.addLayer({
          id: `duplicate-layer-${duplicate.id}`,
          type: 'fill',
          source: `duplicate-${duplicate.id}`,
          layout: {},
          paint: {
            'fill-color': '#888888',
            'fill-opacity': 0.5,
          },
        });
        if (duplicate.geom.coordinates) {
          duplicate.geom.coordinates.forEach(ring => {
            ring.forEach(coord => {
              bounds.extend(coord);
            });
          });
        }
        bounds.extend(centroid.geometry.coordinates);
      }
    }
  });
  if (!bounds.isEmpty()) {
    map.value.fitBounds(bounds, {
      padding: { top: 50, bottom: 50, left: 50, right: 50 }
    });
  }
};

const resetDialogData = () => {
  mapContainer.value = null
  map.value = null
  selectedDuplicate.value = null
  duplicateDialogShow.value = false
}

const primaryRecord = ref()
const selectedRecords = ref([])
const toMergeRecords = ref([])
const primaryOptions = ref([]);

const mergeRecords = async () => {
  const formData = {}
  formData.model = 'settlement'
  formData.primaryId = primaryRecord.value
  formData.duplicateIds = toMergeRecords.value
  const res = await mergeDuplicates(formData)
  if (res.code == '0000') {
    const rowIndex = duplicateRecords.value.indexOf(expandedRow.value);
    if (rowIndex !== -1) {
      duplicateRecords.value.splice(rowIndex, 1);
    }
  }
  primaryRecord.value = null;
  selectedRecords.value = [];
  primaryOptions.value = [];
}

const handleSelectPrimary = () => {
  toMergeRecords.value = selectedRecords.value.map((record) => record.id).filter((id) => id !== primaryRecord.value);
}

const handleSelection = (selection) => {
  if (selection.length > 0) {
    selectedRecords.value = selection;
    primaryOptions.value = selection.map((record) => ({
      label: record.name + `( Id:${record.id})`,
      value: record.id
    }));
  } else {
    primaryRecord.value = null;
    selectedRecords.value = [];
    primaryOptions.value = [];
  }
};

const expandedRow = ref()
const onExpand = (row, expandedRows) => {
  if (expandedRows.includes(row)) {
    expandedRow.value = row
  }
}

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  // Only paginate counties, not groups
  return duplicateRecords.value.slice(start, end)
})

function handlePageChange(page) {
  currentPage.value = page;
}

const handleRowDblClick = (row) => {
  // Save current filter state before navigation to prevent flash on return
  saveFiltersToStorage()
  push({
    name: 'SettlementDetails',
    params: { id: row.id }
  })
}

const activeSegment = ref('Approved')

const Statuses = computed(() => [
  {
    label: 'Approved',
    value: 'Approved',
    icon: CircleCheck,
    count: totalApproved,
    hidden: false,
  },
  {
    label: 'New',
    value: 'New',
    icon: Message,
    count: totalPending,
    hidden: !(isNationalStaff.value || isSuperAdmin.value || isCountyAdmin.value) || !showAdminButtons.value
  },
  {
    label: 'Rejected',
    value: 'Rejected',
    icon: CircleClose,
    count: totalRejected,
    // Hide for county admin/staff, only show for national/super admin
    hidden: !(isNationalStaff.value || isSuperAdmin.value) || !showAdminButtons.value || isCountyAdmin.value
  },
  {
    label: 'Duplicates',
    value: 'Duplicates',
    icon: Warning,
    count: duplicateTotal,
    // Hide for county admin/staff, only show for national/super admin
    hidden: !(isNationalStaff.value || isSuperAdmin.value) || !showAdminButtons.value || isCountyAdmin.value
  },
  {
    label: 'Decommissioned',
    value: 'Decommissioned',
    icon: Delete,
    count: decommSettlementsCount,
    hidden: !(isNationalStaff.value || isSuperAdmin.value || isCountyAdmin.value)
  },
  {
    label: 'Deleted',
    value: 'Deleted',
    icon: Delete,
    count: deletedSettlementsCount,
    hidden: !(isNationalStaff.value || isSuperAdmin.value || isCountyAdmin.value)
  },
])

const filteredSegments = computed(() => {
  return Statuses.value.filter(option => !option.hidden);
});

const getThisHistory = async (sett_id) => {
  try {
    const model = 'settlement_history';
    const formData = {
      model,
      searchField: 'name',
      excludeGeom: false,
      associated_multiple_models: ['users'],
      filters: ['id'],
      filterValues: [[sett_id]]
    };
    const res = await getSettlementListByCounty(formData);
    if (res && res.data) {
      thisHistory.value = res.data
    } else {
      thisHistory.value = [];
    }
  } catch (error) {
    console.error("Error fetching history:", error.message);
    throw new Error("Failed to fetch history. Please try again later.");
  }
};
 

// Watch activeSegment to ensure non-national/non-admin users always stay on Approved
watch(activeSegment, (newValue) => {
  if (!isNationalStaff.value && !isSuperAdmin.value && !isCountyAdmin.value && newValue !== 'Approved') {
    activeSegment.value = 'Approved'
  }
})

// Watch selectedCounty for county staff to keep value4 in sync and prevent flash
watch(selectedCounty, (newValue) => {
  if (isCountyStaff.value && newValue && newValue.length > 0) {
    // Ensure value4 is always synced with selectedCounty for county staff
    // This prevents the flash when filters are loaded/restored
    if (JSON.stringify(value4.value) !== JSON.stringify(newValue)) {
      value4.value = newValue
    }
  }
}, { immediate: true, deep: true })

const onSegmentClick = async () => {
  // Prevent non-national/non-admin users from changing segments
  if (!isNationalStaff.value && !isSuperAdmin.value && !isCountyAdmin.value) {
    activeSegment.value = 'Approved'
    return
  }

  const statusMap = {
    'Approved': 'Approved',
    'New': 'Pending',
    'Rejected': 'Rejected',
    'Decommissioned': 'Decommissioned',
  }

  const selected = statusMap[activeSegment.value]
  if (selected) {
    filters.value = ['isApproved', 'isActive']
    filterValues.value = [[selected], ['true']]
  }
  
  // Apply role filters to ensure county filter is preserved for county-level users
  pushRoleFilters()

  saveFiltersToStorage()

  if (activeSegment.value === 'Duplicates') {
    showPagination.value = false
    await getPotentialDuplicates()
  } else if (activeSegment.value === 'Deleted') {
    showPagination.value = false
    await getSettlmentHistory()
  } else {
    showPagination.value = true
    await getNewOrRejectedSettlements(activeSegment.value)
  }
}


const getSettlmentHistory = async () => {
  deletedSettlements.value = []
  const model = 'settlement_history'
  
  // Build filters array with role-based filters
  const historyFilters: string[] = ['change_type', 'status']
  const historyFilterValues: any[][] = [['Delete', 'Merge'], ['Open']]
  
  // Apply role-based filters (county, settlement, location filters)
  if (roles_filters.length > 0) {
    roles_filters.forEach(rf => {
      if (rf.field && rf.value !== null && rf.value !== undefined) {
        // For history records, we need to filter by the original settlement's fields
        // The history model might have settlement_id or we need to filter by changes.before fields
        // Check if this filter field is already in the filters array
        const existingIndex = historyFilters.indexOf(rf.field);
        if (existingIndex === -1) {
          // Add new filter - for history, we might need to use a different field name
          // If it's county_id, settlement history might have it directly or in changes.before
          historyFilters.push(rf.field);
          historyFilterValues.push(Array.isArray(rf.value) ? rf.value : [rf.value]);
        } else {
          // Update existing filter value (role filters take precedence)
          historyFilterValues[existingIndex] = Array.isArray(rf.value) ? rf.value : [rf.value];
        }
      }
    });
  }
  
  // Also apply user-selected location filters if they exist
  if (selectedCounty.value.length > 0) {
    const countyIndex = historyFilters.indexOf('county_id');
    if (countyIndex === -1) {
      historyFilters.push('county_id');
      historyFilterValues.push(selectedCounty.value);
    } else {
      historyFilterValues[countyIndex] = selectedCounty.value;
    }
  }
  
  if (selectedSubCounty.value.length > 0) {
    const subcountyIndex = historyFilters.indexOf('subcounty_id');
    if (subcountyIndex === -1) {
      historyFilters.push('subcounty_id');
      historyFilterValues.push(selectedSubCounty.value);
    } else {
      historyFilterValues[subcountyIndex] = selectedSubCounty.value;
    }
  }
  
  if (selectedWard.value.length > 0) {
    const wardIndex = historyFilters.indexOf('ward_id');
    if (wardIndex === -1) {
      historyFilters.push('ward_id');
      historyFilterValues.push(selectedWard.value);
    } else {
      historyFilterValues[wardIndex] = selectedWard.value;
    }
  }
  
  // Fetch both Delete and Merge history records
  const formData = {}
  formData.model = model
  formData.searchField = 'name'
  formData.excludeGeom = false
  formData.associated_multiple_models = ['users']
  formData.filters = historyFilters
  formData.filterValues = historyFilterValues
  // Fetch all records to allow client-side pagination on the Deleted tab
  formData.returnAll = true
  const res = await getSettlementListByCounty(formData)
  
  // Additional client-side filtering by role if needed (for nested data in changes.before)
  let filteredData = res.data;
  if (roles_filters.length > 0 && !isSuperAdmin.value && !isNationalStaff.value) {
    filteredData = res.data.filter((item: any) => {
      const beforeObject = item.changes?.before;
      if (!beforeObject) return false;
      
      // Check each role filter against the before object
      return roles_filters.every(rf => {
        if (!rf.field || rf.value === null || rf.value === undefined) return true;
        
        if (rf.field === 'county_id') {
          return Array.isArray(rf.value) 
            ? rf.value.includes(beforeObject.county_id)
            : beforeObject.county_id === rf.value;
        } else if (rf.field === 'id') {
          // Settlement ID filter
          return Array.isArray(rf.value)
            ? rf.value.includes(beforeObject.id)
            : beforeObject.id === rf.value;
        } else if (rf.field === 'location_id') {
          // Subcounty or ward level
          return beforeObject.subcounty_id === rf.value || beforeObject.ward_id === rf.value;
        }
        return true;
      });
    });
  }
  
  filteredData.forEach((item: any) => {
    const beforeObject = item.changes?.before;
    if (beforeObject) {
      beforeObject.history_id = item.id;
      // For merge records, add merge metadata
      if (item.change_type === 'Merge') {
        beforeObject.merged_into = item.changes?.primary_record;
        beforeObject.merge_type = 'Merge';
        beforeObject.primary_id = item.changes?.primary_id;
      }
      deletedSettlements.value.push(beforeObject);
    }
  });
  deletedSettlementsCount.value = deletedSettlements.value.length;
}

const RevertEdits = async (data: TableSlotDefault) => {
  const formData = {
    model: 'settlement',
    history_id: data.history_id,
  };
  
  // Use revertMerge if this is a merge record, otherwise use revertHistory
  if (data.merge_type === 'Merge') {
    const res = await revertMerge(formData);
    if (res.code === '0000') {
      const totalRestored = res.total_associations_restored || 0;
      const message = totalRestored > 0
        ? `Merge reverted successfully! Settlement restored along with ${totalRestored} association(s) (documents, roads, projects, facilities, etc.).`
        : res.note || 'Merge reverted successfully. Settlement restored.';
      
      ElMessage.success({
        message: message,
        duration: 6000,
        showClose: true
      });
      
      // Refresh the deleted settlements list
      await getSettlmentHistory();
      // Refresh counts
      await getCounts();
    }
  } else {
    const res = await revertHistory(formData);
    if (res.code === '0000') {
      ElMessage.success('Settlement restored successfully.');
      // Refresh the deleted settlements list
      await getSettlmentHistory();
      // Refresh counts
      await getCounts();
    }
  }
};


const handleDateChange = async () => {
  console.log(dateRange.value)

  if (activeSegment.value === 'Approved') {
    filters.value = ['isApproved', 'isActive']
    filterValues.value = [['Approved'], ['true']]
  } else if (activeSegment.value === 'New') {
    filters.value = ['isApproved', 'isActive']
    filterValues.value = [['Pending'], ['true']]
  } else if (activeSegment.value === 'Rejected') {
    filters.value = ['isApproved', 'isActive']
    filterValues.value = [['Rejected'], ['true']]
  }

  saveFiltersToStorage()
  DateDialogVisible.value = false

  // Update counts with new date filters
  await getCounts()

  if (search_string.value) {
    await getFilteredBySearchData(activeSegment.value, search_string.value)
  } else {
    await getNewOrRejectedSettlements(activeSegment.value)
  }
}

// Helper to get geometry icon
function getGeometryIcon(row) {
  if (!row.geom || !row.geom.type) {
    return { icon: 'ep:warning',  tooltip: 'No geometry' };
  }
  if (row.geom.type === 'Point' || row.geom.type === 'MultiPoint') {
    return { icon: 'mdi:map-marker',  tooltip: 'Point geometry' };
  }
  if (row.geom.type === 'Polygon' || row.geom.type === 'MultiPolygon') {
    return { icon: 'material-symbols:map-outline-sharp',  tooltip: 'Polygon geometry' };
  }
  return { icon: 'ep:warning',   tooltip: 'Unknown geometry' };
}

// Helper to sort by geometry (has geometry = 1, no geometry = 0)
function sortByGeometry(a, b) {
  // Get geometry priority: Polygon=2, Point=1, No geometry=0
  const getGeometryPriority = (row) => {
    if (!row.geom || !row.geom.type) return 0;
    if (row.geom.type === 'Polygon' || row.geom.type === 'MultiPolygon') return 2;
    if (row.geom.type === 'Point' || row.geom.type === 'MultiPoint') return 1;
    return 0;
  };
  
  const aPriority = getGeometryPriority(a);
  const bPriority = getGeometryPriority(b);
  return bPriority - aPriority; // Higher priority (Polygon) first
}

// Helper to get settlement type label
function getSettlementTypeLabel(type) {
  if (!type) return 'N/A';
  
  // Handle string values from database
  if (typeof type === 'string') {
    const typeMap = {
      'slum': 'Slum',
      'informal_settlement': 'Informal Settlement',
      'informal settlement': 'Informal Settlement',
      'Informal Settlement': 'Informal Settlement',
      'Slum': 'Slum'
    };
    return typeMap[type.toLowerCase()] || type; // Return original if not mapped
  }
  
  // Handle numeric values (legacy support)
  const typeOption = typeOptions.find(opt => opt.value === type);
  return typeOption ? typeOption.label : 'Unknown';
}

// Helper to group duplicates by name
function groupedByName(duplicates) {
  const groups = {};
  duplicates.forEach(d => {
    if (!groups[d.name]) groups[d.name] = [];
    groups[d.name].push(d);
  });
  return Object.entries(groups).map(([name, records]) => ({ name, records }));
}

// Helper to group duplicates by candidate names (all unique names in the group)
function groupedByCandidates(duplicates) {
  if (!duplicates || !duplicates.length) return [];
  // The backend already gives you a group of candidates (duplicates)
  const uniqueNames = [...new Set(duplicates.map(d => d.name))];
  return [{
    header: uniqueNames.join(' / '),
    records: duplicates
  }];
}

// Add these methods in <script setup> (after mergeRecords, before template):
function ensureMergeState(group) {
  if (!group._mergeState) {
    group._mergeState = reactive({
      selected: [],
      primary: null
    })
  }
}
function handleGroupSelection(selection, group) {
  ensureMergeState(group)
  group._mergeState.selected = selection
  if (!selection.find(r => r.id === group._mergeState.primary)) {
    group._mergeState.primary = null
  }
}
async function mergeGroupRecords(group) {
  ensureMergeState(group)
  const selected = group._mergeState.selected
  const primary = group._mergeState.primary
  if (!primary || selected.length < 2) return
  const toMerge = selected.map(r => r.id).filter(id => id !== primary)
  const formData = {
    model: 'settlement',
    primaryId: primary,
    duplicateIds: toMerge
  }
  const res = await mergeDuplicates(formData)
  if (res.code == '0000') {
    // Remove this group from UI
    const countyGroup = duplicateRecords.value.find(cg => cg.groups.includes(group))
    if (countyGroup) {
      const idx = countyGroup.groups.indexOf(group)
      if (idx !== -1) countyGroup.groups.splice(idx, 1)
      if (countyGroup.groups.length === 0) {
        const cidx = duplicateRecords.value.indexOf(countyGroup)
        if (cidx !== -1) duplicateRecords.value.splice(cidx, 1)
      }
    }
    // Refresh deleted settlements list if on Deleted tab
    if (activeSegment.value === 'Deleted') {
      await getSettlmentHistory()
    }
    // Refresh counts
    await getCounts()
  }
  group._mergeState.selected = []
  group._mergeState.primary = null
}

duplicateRecords.value.forEach(county => {
  county._activeTab = 'set1'
  county.groups.forEach((group, groupIdx) => {
    if (!group._mergeState) {
      group._mergeState = reactive({ selected: [], primary: null })
    }
  })
})

// Add this method in <script setup>:
function handleCheckboxChange(val, row, group) {
  ensureMergeState(group)
  if (val) {
    if (!group._mergeState.selected.includes(row)) {
      group._mergeState.selected.push(row)
    }
  } else {
    group._mergeState.selected = group._mergeState.selected.filter(r => r !== row)
  }
  if (!group._mergeState.selected.find(r => r.id === group._mergeState.primary)) {
    group._mergeState.primary = null
  }
}

// In <script setup>, add:
const expandedCountyKeys = ref([])
function toggleCountyExpand(parent) {
  const idx = expandedCountyKeys.value.indexOf(parent)
  if (idx === -1) {
    expandedCountyKeys.value.push(parent)
  } else {
    expandedCountyKeys.value.splice(idx, 1)
  }
}


duplicateRecords.value.forEach(county => {
  county._expandedGroups = []
  county.groups.forEach(group => {
    if (!group._mergeState) {
      group._mergeState = reactive({ selected: [], primary: null })
    }
  })
})

</script>

<template>
  <el-card v-loading="loadingGetData" :element-loading-text="loadingGetDataMsg">
 
    <div v-if="dynamicComponent">
      <upload-component :is="dynamicComponent" v-bind="componentProps" />
    </div>




    <el-row :gutter="5" style=" margin-bottom:10px;">
      <el-col :xs="24" :sm="24" :md="2" :lg="2" class="max-w-200px">

        <div class="max-w-200px">
          <el-button type="primary" plain :icon="Back" @click="goBack" size="small" style="margin-right: 10px;">
            Back
          </el-button>
        </div>
      </el-col>

      <el-col :xs="24" :sm="24" :md="11" :lg="3" v-if="isNationalStaff || isSuperAdmin">
        <el-select
size="default" v-model="value4" :onChange="filterByCounty" :onClear="handleClear" multiple clearable
          filterable collapse-tags placeholder="By County" style="width: 100%; margin-right: 5px;">
          <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-col>

      <el-col :xs="24" :sm="24" :md="11" :lg="3">
        <el-select
:disabled="!value5" size="default" v-model="value5" :onChange="filterBySubCounty" multiple
          clearable filterable collapse-tags placeholder="By Subcounty" style="width: 100%; margin-right: 5px;">
          <el-option v-for="item in subcountiesOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-col>

      <el-col :xs="24" :sm="24" :md="11" :lg="3">
        <el-select
:disabled="!value6" size="default" v-model="value6" :onChange="filterByWard" multiple
          clearable filterable collapse-tags placeholder="By Ward" style="width: 100%; margin-right: 5px;">
          <el-option v-for="item in wardOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-col>

      <el-col :xs="24" :sm="24" :md="11" :lg="4">

        <el-input
v-model="search_string" clearable :onClear="handleClear"
          placeholder="Search " @change="searchByNewName" class="input-with-select"
          style="width: 100%; margin-right: 5px;">
          <template #append>
            <el-button v-loading="searchLoading" :icon="Search" :onClick="searchByNewName" />
          </template>
        </el-input>
      </el-col>

       


      <el-col :xs="24" :sm="24" :md="24" :lg="9">

        <div style="display: flex; align-items: center; gap: 2px; flex-wrap: wrap;">

          <el-tooltip content="Filter By Date" placement="top">
            <el-button @click="DateDialogVisible = true">
            <Icon
              :icon="(dateRange && dateRange.length > 0)
                ? 'ph:calendar-fill'
                : 'solar:calendar-bold'"
              width="24"
              height="24"
              style="margin-left: 4px;"
            />
          </el-button>



        </el-tooltip>



          <el-tooltip content="Add Settlement" placement="top">
            <el-button v-if="!isPublicUser" :onClick="AddSettlement" type="primary" :icon="Plus" />
          </el-tooltip>
          
          <el-tooltip content="Clear" placement="top">
            <el-button @click="handleClear" type="primary">
              <Icon icon="mdi:filter-remove" />
            </el-button>
          </el-tooltip>
          <DownloadCustom
v-if="showEditButtons" :data="tableDataList" :model="model"
            :associated_models="associated_multiple_models" :loading="downloadLoading"
            :filters="filters" :filterValues="filterValues"
            @download-start="downloadLoading = true"
            @download-end="downloadLoading = false" />
          <PermissionWrapper :permissions="'settlement:downloadGeo'">
            <el-tooltip content="Download Geospatial Data (GeoJSON)" placement="top">
              <el-button 
                :loading="downloadGeoLoading" 
                @click="handleDownloadGeoData" 
                type="primary">
                <Icon icon="gis:layer-download" style="margin-right: 4px;" />
              </el-button>
            </el-tooltip>
          </PermissionWrapper>
 
       
        </div>


      </el-col>



    </el-row>


    <div class="custom-style" v-if="isNationalStaff || isSuperAdmin || isCountyAdmin">

      <el-segmented v-model="activeSegment" :options="filteredSegments" block :onChange="onSegmentClick">
        <template #default="{ item }">
          <div class="flex flex-col items-center gap-2 p-2">
            <el-icon size="18">
              <component :is="item.icon" />
            </el-icon>
            <div>{{ item.label }} ({{ item.count }}) </div>
          </div>
        </template>
      </el-segmented>

    </div>




    <div v-if="activeSegment === 'Approved'">
      <el-alert
        type="info"
        :closable="false"
        :show-icon="false"
        style="margin-top: 8px; margin-bottom: 4px; padding: 6px 12px;">
        <template #default>
          <span style="font-size: 12px;">💡 Double-click on any row to view settlement details</span>
        </template>
      </el-alert>
      <el-table
        table-layout="auto" 
        :data="tableDataList" @row-dblclick="handleRowDblClick" :show-overflow-tooltip="true" fit 
        style="width: 100%; margin-top: 10px;" border :row-class-name="tableRowClassName" row-key="id"
        @selection-change="handleSelectionChange">

        <el-table-column type="selection" width="55" :selectable="(row) => canUserAccessSettlement(row, 'edit')" />
        <!-- NEW: Geometry Icon Column with Infrastructure Badge -->
        <el-table-column label="Geom" width="70" sortable :sort-method="sortByGeometry">
          <template #default="{ row }">
            <el-badge 
              :is-dot="true" 
              :hidden="!(row.hasRoads || row.hasFacilities)"
              class="item">
              <el-tooltip 
                :content="(row.hasRoads || row.hasFacilities) ? 'Profiled' : getGeometryIcon(row).tooltip" 
                placement="top">
                <Icon :icon="getGeometryIcon(row).icon" :color="getGeometryIcon(row).color" width="24" height="24" />
              </el-tooltip>
            </el-badge>
          </template>
        </el-table-column>

        <el-table-column label="Id" width="80" prop="id" sortable>
          <template #default="scope">
            <div v-if="scope.row.documents.length > 0" style="display: inline-flex; align-items: center;">
              <span>{{ scope.row.id }}</span>
              <Icon icon="material-symbols:attachment" style="margin-left: 4px;" />
            </div>
          </template>
        </el-table-column>


        <el-table-column label="Name" prop="name" sortable>
          <template #default="{ row }">
            <span>{{ row.name }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Location" sortable width="400">
          <template #default="scope">
            <span>{{ scope.row.ward.name }} ward, {{ scope.row.subcounty.name }} subcounty, {{ scope.row.county.name
              }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Type" prop="settlement_type" sortable width="150">
          <template #default="{ row }">
            {{ getSettlementTypeLabel(row.settlement_type) }}
          </template>
        </el-table-column>

        <el-table-column label="Population" prop="population" sortable />
        <el-table-column label="Area(HA)" prop="area" sortable :formatter="row => Number(row.area).toFixed(2)" />
        <el-table-column label="Created" prop="updatedAt" sortable :formatter="formatDate" />
        <el-table-column label="Code" prop="code" sortable>
          <template #default="{ row }">
            <div style="position: relative;" @mouseenter="showCopyIcon(row)" @mouseleave="hideCopyIcon(row)">
              <span>{{ row.code }}</span>
              <el-tooltip class="item" effect="dark" content="Copy" placement="top">
                <el-button
v-show="isCopyIconVisible(row)" type="information" size="small" :icon="CopyDocument" circle
                  plain
                  style="position: absolute; left: 50%;  top: 50%;  transform: translateY(-50%); margin-right: 5px;"
                  @click="copyToClipboard(row.code)" />
              </el-tooltip>

            </div>

          </template>
        </el-table-column>

        <el-table-column label="Actions" :width="actionColumnWidth">
          <template #default="{ row }">
            <TableActions
              :item="row" :buttons="getSettlementActionButtons(row)" @view-on-map="handleViewOnMap" @edit="handleEdit"
              @review="Review" @delete="handleDelete" @decommission="handleDecommission" @merge="handleMerge" @update-location="handleUpdateLocation" />
          </template>
        </el-table-column>

      </el-table>
      
      <!-- Merge button for selected settlements -->
      <div v-if="selectedSettlements.length >= 2" style="margin-top: 10px; margin-bottom: 10px;">
        <el-button 
          type="danger" plain
          :icon="TakeawayBox"
          @click="handleMergeFromSelection">
          Merge({{ selectedSettlements[0].name }} + {{ selectedSettlements[1].name }})
        </el-button>
        <el-button 
          type="info" 
          plain
          @click="selectedSettlements = []">
          Clear Selection
        </el-button>
      </div>

      <!-- Delete Cascade button for super admins -->
      <div v-if="isSuperAdmin && selectedSettlements.length >= 1" style="margin-top: 10px; margin-bottom: 10px;">
        <el-button 
          type="danger"
          :icon="deleteCascadeLoading ? undefined : Delete"
          :loading="deleteCascadeLoading"
          :disabled="deleteCascadeLoading"
          @click="handleDeleteCascade">
          Delete Cascade ({{ selectedSettlements.length }} selected)
        </el-button>
      </div>

      <ElPagination
      layout="sizes, prev, pager, next, total" v-model:currentPage="page"
      v-model:page-size="pageSize" :page-sizes="getPageSizes(totalApproved)" :total="totalApproved" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />

      <!-- Merge button for selected settlements (bottom) -->
      <!-- <div v-if="selectedSettlements.length === 2" style="margin-top: 10px;">
        <el-button 
          type="primary" 
          :icon="TakeawayBox"
          @click="handleMergeFromSelection">
          Merge Selected Settlements ({{ selectedSettlements[0].name }} + {{ selectedSettlements[1].name }})
        </el-button>
        <el-button 
          type="info" 
          plain
          @click="selectedSettlements = []">
          Clear Selection
        </el-button>
      </div> -->

    </div>


    <div v-if="activeSegment === 'New'">
      <el-table
:data="tableDataListNew" :show-overflow-tooltip="true" style="width: 100% ; margin-top: 10px;" border
        :row-class-name="tableRowClassName" row-key="id"
        @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" :selectable="(row) => canUserAccessSettlement(row, 'edit')" />
        <!-- NEW: Geometry Icon Column with Infrastructure Badge -->
        <el-table-column label="Geom" width="70" sortable :sort-method="sortByGeometry">
          <template #default="{ row }">
            <el-badge 
              :is-dot="true"
              :hidden="!(row.hasRoads || row.hasFacilities)"
              class="item">
              <el-tooltip 
                :content="(row.hasRoads || row.hasFacilities) ? 'Profiled' : getGeometryIcon(row).tooltip" 
                placement="top">
                <Icon :icon="getGeometryIcon(row).icon" :color="getGeometryIcon(row).color" width="24" height="24" />
              </el-tooltip>
            </el-badge>
          </template>
        </el-table-column>
        <el-table-column label="Id" width="80" prop="id" sortable>
          <template #default="scope">
            <div v-if="scope.row.documents.length > 0" style="display: inline-flex; align-items: center;">
              <span>{{ scope.row.id }}</span>
              <Icon icon="material-symbols:attachment" style="margin-left: 4px;" />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Name" width="200" prop="name" sortable />

        <el-table-column label="Location" sortable width="400">
          <template #default="scope">
            <span>{{ scope.row.ward.name }} ward, {{ scope.row.subcounty.name }} subcounty, {{ scope.row.county.name
              }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Type" prop="settlement_type" sortable width="150">
          <template #default="{ row }">
            {{ getSettlementTypeLabel(row.settlement_type) }}
          </template>
        </el-table-column>
        <el-table-column label="Population" prop="population" sortable />
        <el-table-column label="Area(HA)" prop="area" sortable :formatter="row => Number(row.area).toFixed(2)" />
        <el-table-column label="Created" prop="updatedAt" sortable :formatter="formatDate" />

        <el-table-column label="Code" prop="code" sortable>
          <template #default="{ row }">
            <div style="position: relative;" @mouseenter="showCopyIcon(row)" @mouseleave="hideCopyIcon(row)">
              <span>{{ row.code }}</span>
              <el-tooltip class="item" effect="dark" content="Copy" placement="top">
                <el-button
v-show="isCopyIconVisible(row)" type="information" size="small" :icon="CopyDocument" circle
                  plain style="position: absolute; top: 50%; right: 0; transform: translateY(-50%); margin-right: 5px;"
                  @click="copyToClipboard(row.code)" />

              </el-tooltip>
            </div>
          </template>
        </el-table-column>


        <el-table-column label="Actions" :width="actionColumnWidth">
          <template #default="{ row }">
            <!-- Example 1: Only Edit and Delete buttons -->
            <TableActions
:item="row" :buttons="getSettlementActionButtons(row)" @edit="handleEdit" @review="Review"
              @delete="handleDelete" @view-on-map="handleViewOnMap" @decommission="handleDecommission" @update-location="handleUpdateLocation" />

          </template>
        </el-table-column>

      </el-table>
      <ElPagination
      layout="sizes, prev, pager, next, total" v-model:currentPage="page"
      v-model:page-size="pageSize" :page-sizes="getPageSizes(totalPending)" :total="totalPending" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />

      <!-- Delete Cascade button for super admins -->
      <div v-if="isSuperAdmin && selectedSettlementsNew.length >= 1" style="margin-top: 10px; margin-bottom: 10px;">
        <el-button 
          type="danger"
          :icon="deleteCascadeLoading ? undefined : Delete"
          :loading="deleteCascadeLoading"
          :disabled="deleteCascadeLoading"
          @click="handleDeleteCascade">
          Delete Cascade ({{ selectedSettlementsNew.length }} selected)
        </el-button>
      </div>

      <!-- Merge button for selected settlements (bottom) -->
      <!-- <div v-if="selectedSettlementsNew.length === 2" style="margin-top: 10px;">
        <el-button 
          type="primary" 
          :icon="TakeawayBox"
          @click="handleMergeFromSelection">
          Merge Selected Settlements ({{ selectedSettlementsNew[0].name }} + {{ selectedSettlementsNew[1].name }})
        </el-button>
        <el-button 
          type="info" 
          plain
          @click="selectedSettlementsNew = []">
          Clear Selection
        </el-button>
      </div> -->
    </div>

    <div v-if="activeSegment === 'Rejected'">
      <el-table
:data="tableDataListRejected" :show-overflow-tooltip="true" style="width: 100% ; margin-top: 10px;"
        border :row-class-name="tableRowClassName" @expand-change="handleExpand" row-key="id"   :expand-row-keys="expandedRowKeys"
        @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" :selectable="(row) => canUserAccessSettlement(row, 'edit')" />
        <el-table-column label="Id" width="80" prop="id" sortable>
          <template #default="scope">
            <div v-if="scope.row.documents.length > 0" style="display: inline-flex; align-items: center;">
              <span>{{ scope.row.id }}</span>
              <Icon icon="material-symbols:attachment" style="margin-left: 4px;" />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Name" width="200" prop="name" sortable />

        <el-table-column label="Location" sortable width="400">
          <template #default="scope">
            <span>{{ scope.row.ward.name }} ward, {{ scope.row.subcounty.name }} subcounty, {{ scope.row.county.name
              }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Type" prop="settlement_type" sortable width="150">
          <template #default="{ row }">
            {{ getSettlementTypeLabel(row.settlement_type) }}
          </template>
        </el-table-column>
        <el-table-column label="Population" prop="population" sortable />
        <el-table-column label="Area(HA)" prop="area" sortable :formatter="row => Number(row.area).toFixed(2)" />
        <el-table-column label="Created" prop="updatedAt" sortable :formatter="formatDate" />

        <el-table-column label="Code" prop="code" sortable>
          <template #default="{ row }">
            <div style="position: relative;" @mouseenter="showCopyIcon(row)" @mouseleave="hideCopyIcon(row)">
              <span>{{ row.code }}</span>
              <el-tooltip class="item" effect="dark" content="Copy" placement="top">
                <el-button
v-show="isCopyIconVisible(row)" type="information" size="small" :icon="Clock" circle plain
                  style="position: absolute; top: 50%; right: 0; transform: translateY(-50%); margin-right: 5px;"
                  @click="copyToClipboard(row.code)" />
              </el-tooltip>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Actions" :width="actionColumnWidth">
          <template #default="{ row }">
            <!-- Example 1: Only Edit and Delete buttons -->
            <TableActions
:item="row" :buttons="getSettlementActionButtons(row)" @edit="handleEdit" @review="Review"
              @delete="handleDelete" @view-on-map="handleViewOnMap" @decommission="handleDecommission" @update-location="handleUpdateLocation" />

          </template>
        </el-table-column>

      </el-table>


      <ElPagination
      layout="sizes, prev, pager, next, total" v-model:currentPage="page"
      v-model:page-size="pageSize" :page-sizes="getPageSizes(totalRejected)" :total="totalRejected" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />

      <!-- Delete Cascade button for super admins -->
      <div v-if="isSuperAdmin && selectedSettlementsRejected.length >= 1" style="margin-top: 10px; margin-bottom: 10px;">
        <el-button 
          type="danger"
          :icon="deleteCascadeLoading ? undefined : Delete"
          :loading="deleteCascadeLoading"
          :disabled="deleteCascadeLoading"
          @click="handleDeleteCascade">
          Delete Cascade ({{ selectedSettlementsRejected.length }} selected)
        </el-button>
      </div>

      <!-- Merge button for selected settlements (bottom) -->
      <!-- <div v-if="selectedSettlementsRejected.length === 2" style="margin-top: 10px;">
        <el-button 
          type="primary" 
          :icon="TakeawayBox"
          @click="handleMergeFromSelection">
          Merge Selected Settlements ({{ selectedSettlementsRejected[0].name }} + {{ selectedSettlementsRejected[1].name }})
        </el-button>
        <el-button 
          type="info" 
          plain
          @click="selectedSettlementsRejected = []">
          Clear Selection
        </el-button>
      </div> -->
    </div>


    <div v-if="activeSegment === 'Decommissioned'">
        <el-alert
          type="info"
          :closable="false"
          show-icon
          style="margin-top: 10px; margin-bottom: 5px;">
          <template #default>
            <span style="font-size: 13px;">💡 Double-click on any row to view settlement details</span>
          </template>
        </el-alert>
        <el-table
          :data="decommSettlements" :show-overflow-tooltip="true" style="width: 100% ; margin-top: 10px;"
          border :row-class-name="tableRowClassName" row-key="id"
          @row-dblclick="handleRowDblClick"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" :selectable="(row) => canUserAccessSettlement(row, 'edit')" />
          <el-table-column label="Id" width="80" prop="id" sortable>
            <template #default="scope">
              <div v-if="scope.row.documents.length > 0" style="display: inline-flex; align-items: center;">
                <span>{{ scope.row.id }}</span>
                <Icon icon="material-symbols:attachment" style="margin-left: 4px;" />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Name" width="200" prop="name" sortable />

          <el-table-column label="Location" sortable width="400">
            <template #default="scope">
              <span>{{ scope.row.ward.name }} ward, {{ scope.row.subcounty.name }} subcounty, {{ scope.row.county.name
                }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Type" prop="settlement_type" sortable width="150">
            <template #default="{ row }">
              {{ getSettlementTypeLabel(row.settlement_type) }}
            </template>
          </el-table-column>
          <el-table-column label="Population" prop="population" sortable />
          <el-table-column label="Area(HA)" prop="area" sortable :formatter="row => Number(row.area).toFixed(2)" />
          <el-table-column label="Created" prop="updatedAt" sortable :formatter="formatDate" />

          <el-table-column label="Code" prop="code" sortable>
            <template #default="{ row }">
              <div style="position: relative;" @mouseenter="showCopyIcon(row)" @mouseleave="hideCopyIcon(row)">
                <span>{{ row.code }}</span>
                <el-tooltip class="item" effect="dark" content="Copy" placement="top">
                  <el-button
v-show="isCopyIconVisible(row)" type="information" size="small" :icon="Clock" circle plain
                    style="position: absolute; top: 50%; right: 0; transform: translateY(-50%); margin-right: 5px;"
                    @click="copyToClipboard(row.code)" />
                </el-tooltip>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Actions" :width="actionColumnWidth">
            <template #default="{ row }">
              <!-- Example 1: Only Edit and Delete buttons -->
              <TableActions
:item="row" :buttons="getSettlementActionButtons(row)" @edit="handleEdit" @review="Review"
                @delete="handleDelete" @view-on-map="handleViewOnMap" @decommission="handleDecommission" />

            </template>
          </el-table-column>

        </el-table>


      <ElPagination
      layout="sizes, prev, pager, next, total" v-model:currentPage="page"
      v-model:page-size="pageSize" :page-sizes="getPageSizes(decommSettlementsCount)" :total="decommSettlementsCount" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />

      <!-- Delete Cascade button for super admins -->
      <div v-if="isSuperAdmin && selectedSettlementsDecommissioned.length >= 1" style="margin-top: 10px; margin-bottom: 10px;">
        <el-button 
          type="danger"
          :icon="deleteCascadeLoading ? undefined : Delete"
          :loading="deleteCascadeLoading"
          :disabled="deleteCascadeLoading"
          @click="handleDeleteCascade">
          Delete Cascade ({{ selectedSettlementsDecommissioned.length }} selected)
        </el-button>
      </div>

      <!-- Merge button for selected settlements (bottom) -->
      <!-- <div v-if="selectedSettlementsDecommissioned.length === 2" style="margin-top: 10px;">
        <el-button 
          type="primary" 
          :icon="TakeawayBox"
          @click="handleMergeFromSelection">
          Merge Selected Settlements ({{ selectedSettlementsDecommissioned[0].name }} + {{ selectedSettlementsDecommissioned[1].name }})
        </el-button>
        <el-button 
          type="info" 
          plain
          @click="selectedSettlementsDecommissioned = []">
          Clear Selection
        </el-button>
      </div> -->
    </div>




    <div v-if="activeSegment === 'Deleted'">
      <el-table table-layout="auto"  :data="deletedPageData" :show-overflow-tooltip="true" style="width: 100% ; margin-top: 10px;"  border  >
        <el-table-column type="index" width="50" />
        <el-table-column label="Name" width="200" prop="name" sortable />     
        <el-table-column label="Status" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.merge_type === 'Merge'" type="warning" size="small">Merged</el-tag>
            <el-tag v-else type="danger" size="small">Deleted</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Type" prop="settlement_type" sortable width="150">
          <template #default="{ row }">
            {{ getSettlementTypeLabel(row.settlement_type) }}
          </template>
        </el-table-column>
        <el-table-column label="Merged Into" width="200" v-if="deletedSettlements.some(s => s.merge_type === 'Merge')">
          <template #default="{ row }">
            <span v-if="row.merge_type === 'Merge' && row.merged_into">
              {{ row.merged_into.name }} (ID: {{ row.merged_into.id }})
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="Population" prop="population" sortable />
        <el-table-column label="Area(HA)" prop="area" sortable :formatter="row => Number(row.area).toFixed(2)" />
        <el-table-column label="Created" prop="updatedAt" sortable :formatter="formatDate" />
        <el-table-column label="Code" prop="code" sortable>
          <template #default="{ row }">
            <div style="position: relative;" @mouseenter="showCopyIcon(row)" @mouseleave="hideCopyIcon(row)">
              <span>{{ row.code }}</span>
              <el-tooltip class="item" effect="dark" content="Copy" placement="top">
                <el-button
v-show="isCopyIconVisible(row)" type="information" size="small" :icon="Clock" circle plain
                  style="position: absolute; top: 50%; right: 0; transform: translateY(-50%); margin-right: 5px;"
                  @click="copyToClipboard(row.code)" />
              </el-tooltip>
            </div>
          </template>
        </el-table-column>

        <el-table-column fixed="right" label="Operations" min-width="120">
          <template  #default="{ row }">
            <el-tooltip content="Review" placement="top">
              <el-button
type="primary" size="small" :icon="View" @click="DeleteReview(row)"
                plain />
            </el-tooltip> 
            <el-tooltip content="Restore" placement="top">
            <el-button type="warning"  size="small" :icon="RefreshLeft" @click="RevertEdits(row)" />
          </el-tooltip> 
          </template>
    </el-table-column>

      </el-table>

      <ElPagination
        layout="sizes, prev, pager, next, total" 
        v-model:current-page="deletedPage"
        v-model:page-size="deletedPageSize" 
        :page-sizes="[5, 10, 15, 20, 50, 100, 1000, 2000]" 
        :total="deletedSettlementsCount" 
        :background="true"
        @size-change="(size) => { deletedPageSize = size; deletedPage = 1; }"
        @current-change="(page) => { deletedPage = page; }" 
        class="mt-4" />

    </div>

 
    <div v-if="activeSegment === 'Duplicates'">
  <el-collapse v-model="expandedCountyKeys" accordion>
    <el-collapse-item
      v-for="(county, countyIdx) in paginatedData"
      :key="county.parent"
      :name="county.parent"
    >
      <template #title>
        <span style="margin-right: 12px; color: #888;">{{ countyIdx + 1 }}.</span>
       {{ county.parent }} 
      </template>
      <el-tabs v-model="county._activeTab" type="card" style="margin-top: 8px;">
        <el-tab-pane
          v-for="(group, groupIdx) in county.groups"
          :key="group.header"
          :label="`Set ${groupIdx + 1}`"
          :name="`set${groupIdx + 1}`"
        >
          <el-table :data="group.records" style="margin-bottom: 8px;">
            <el-table-column
              width="40"
              :selectable="() => true"
            >
              <template #default="{ row }">
                <el-checkbox
                  :model-value="group._mergeState && group._mergeState.selected.includes(row)"
                  @change="val => handleCheckboxChange(val, row, group)"
                  @click.stop
                />
              </template>
            </el-table-column>
            <el-table-column type="index" label="No." width="50" />
            <el-table-column label="ID" prop="id" width="80" />
            <el-table-column label="Name" prop="name" min-width="200" sortable/>
            <el-table-column label="Location" min-width="250">
              <template #default="{ row }">
                <div style="font-size: 13px; color: #666;">
                  <div v-if="row.ward">{{ row.ward.name }} ward</div>
                  <div v-else-if="row.ward_id">Ward ID: {{ row.ward_id }}</div>
                  <div v-if="row.subcounty">{{ row.subcounty.name }} subcounty</div>
                  <div v-else-if="row.subcounty_id">Subcounty ID: {{ row.subcounty_id }}</div>
                  <div v-if="row.county">{{ row.county.name }}</div>
                  <div v-else-if="row.county_id">County ID: {{ row.county_id }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="Type" prop="settlement_type" width="150" sortable>
              <template #default="{ row }">
                {{ getSettlementTypeLabel(row.settlement_type) }}
              </template>
            </el-table-column>
            <el-table-column label="Population" prop="population" width="120" />
            <el-table-column label="Area (HA)" prop="area" width="120" />
            <el-table-column label="Code" prop="code" width="120" />
            <el-table-column label="Created At" prop="createdAt" width="140">
              <template #default="{ row }">
                <span>{{ row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Updated At" prop="updatedAt" width="140">
              <template #default="{ row }">
                <span>{{ row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '' }}</span>
              </template>
            </el-table-column>
          </el-table>
          <div style="margin-top: 8px;" v-if="group._mergeState && group._mergeState.selected.length >= 2">
            <el-select v-model="group._mergeState.primary" placeholder="Select primary record" style="width: 220px; margin-right: 8px;">
              <el-option v-for="rec in group._mergeState.selected" :key="rec.id" :label="rec.name + ' (ID:' + rec.id + ')'" :value="rec.id" />
            </el-select>
            <el-button type="success" :disabled="!group._mergeState.primary" @click="mergeGroupRecords(group)">
              Merge Selected
            </el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-collapse-item>
  </el-collapse>
  <el-pagination
  background 
  class="mt-4" 
  layout="sizes, prev, pager, next, jumper" 
  :total="duplicateTotal"
  :page-size="pageSize" 
  :page-sizes="getPageSizes(duplicateTotal)" 
  @current-change="handlePageChange" 
  @size-change="onPageSizeChange" />
</div>








    <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formheader" :width="dialogWidth" draggable>
      <el-steps :active="activeStep" finish-button-center simple style="margin-bottom: 10px;">
        <el-step description="Basic Info" :icon="Loading" />
        <el-step description="Details" :icon="Setting" />
        <el-step description="Geometry" :icon="Position" />

      </el-steps>




      <el-row :gutter="10">
        <el-col v-show="activeStep === 0" :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
          <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-position="left">
            <el-form-item label="County" prop="county_id">
              <el-select
v-model="ruleForm.county_id" filterable placeholder="Select County"
                :onChange="handleSelectCounty">
                <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>

            <el-form-item label="Sub County" prop="subcounty_id">
              <el-select
v-model="ruleForm.subcounty_id" filterable placeholder="Select Subcounty"
                :onChange="handleSelectSubCounty">
                <el-option
v-for="item in subcountiesOptions" :key="item.value" :label="item.label"
                  :value="item.value" />
              </el-select>
            </el-form-item>

            <el-form-item label="Ward" prop="ward_id">
              <el-select v-model="ruleForm.ward_id" filterable placeholder="Select ward">
                <el-option v-for="item in wardOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>


            <el-form-item label="Name">
              <el-input v-model="ruleForm.name" />
            </el-form-item>
            <el-form-item label="Type" prop="settlement_type">
              <el-select v-model="ruleForm.settlement_type" filterable placeholder="Select type">
                <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Population">
              <el-input-number v-model="ruleForm.population" />
            </el-form-item>
            <el-form-item label="Area(ha)">
              <el-input-number v-model="ruleForm.area" />
            </el-form-item>
          </el-form>
        </el-col>

        <el-col v-show="activeStep === 1" :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
          <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-position="left">
            <el-form-item label="Dist. to Nearest Urban Center(Km.)" prop="dist_town" label-width="240px">
              <el-input-number v-model="ruleForm.dist_town" />
            </el-form-item>
            <el-form-item label="Dist.to Nearest Trunk Road(Km.)" prop="dist_trunk" label-width="240px">
              <el-input-number v-model="ruleForm.dist_trunk" />
            </el-form-item>


            <el-form-item label="Parcel Number" prop="parcel_no">
              <el-input v-model="ruleForm.parcel_no" />
            </el-form-item>

            <el-form-item label="Parcel owner" prop="parcel_owner">
              <el-input v-model="ruleForm.parcel_owner" />
            </el-form-item>

            <el-form-item label="RIM Ref." prop="rim_no">
              <el-input v-model="ruleForm.rim_no" />
            </el-form-item>
            <el-form-item label="Description">
              <el-input maxlength="200" type="textarea" v-model="ruleForm.description" />
            </el-form-item>
          </el-form>

        </el-col>




        <el-col v-show="activeStep === 2" :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
          <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-position="left">
            <el-form-item label="Geometry">
              <el-upload :on-change="handleUploadGeo" multiple :limit="3" :auto-upload="false">
                <el-button type="primary">Click to upload</el-button>
                <template #tip>
                  <div class="el-upload__tip">
                    geojson or zipped shapefile
                  </div>
                </template>
              </el-upload>
            </el-form-item>
          </el-form>
        </el-col>
      </el-row>
      <template #footer>
        <span class="dialog-footer space-between">
          <el-row :gutter="10">

            <el-col :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
              <el-button @click="next">Next</el-button>

              <el-button @click="AddDialogVisible = false">Cancel</el-button>
              <el-button v-if="showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>
            </el-col>
          </el-row>
        </span>
      </template>
    </el-dialog>



    <el-dialog v-model="showSelectFields" title="Select Fields" width="50%">
      <el-row>
        <el-col :span="6" v-for="(field, index) in model_fields" :key="index">
          <el-checkbox v-model="selectedFields" :label="field">{{ field }}</el-checkbox>
        </el-col>
      </el-row>
      <el-button type="success" :loading="downloadLoading" @click="handleDownloadSelectFields()">Download</el-button>
    </el-dialog>



    <el-dialog v-model="ShowReviewDialog" @close="handleClose" :title="formHeader" :width="reviewWindowWidth" draggable>
      <el-descriptions title="" direction="vertical" :column="2" size="small" border>
        <el-descriptions-item label="Name">{{ settlement_raw.name }}</el-descriptions-item>
        <el-descriptions-item label="Area(Ha)" :span="2">{{ settlement_raw.area }}</el-descriptions-item>
        <el-descriptions-item label="Population">{{ settlement_raw.population }}</el-descriptions-item>
        <el-descriptions-item label="Description"> {{ settlement_raw.description }} </el-descriptions-item>
        <el-descriptions-item label="Submitted By"> {{ settlement_raw.user }} </el-descriptions-item>
        <el-descriptions-item label="Date"> {{ settlement_raw.date }} </el-descriptions-item>

        <el-descriptions-item   v-if="activeSegment === 'Deleted'"  label="Deleted By"> {{ settlement_raw.user }} </el-descriptions-item>
        <el-descriptions-item   v-if="activeSegment === 'Deleted'"  label="Date Deleted"> {{ settlement_raw.delete_date }} </el-descriptions-item>
 

      </el-descriptions>
      <template #footer>
        <span v-if="showAdminButtons &&  activeSegment != 'Deleted'" class="dialog-footer">
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

    <el-dialog v-model="DecommissionDialog" title="Decommission Settlement" width="30%">
      <el-form>
        <el-form-item label="Settlement Name">
          <el-input v-model="ruleForm.name" disabled />
        </el-form-item>
        <el-form-item label="Reason for Decommission">
          <el-input 
            v-model="decommissionReason" 
            type="textarea" 
            :rows="3"
            placeholder="Please provide a reason for decommissioning this settlement..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="DecommissionDialog = false">Cancel</el-button>
          <el-button type="warning" @click="confirmDecommission">
            Decommission
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Merge Settlement Dialog -->
    <el-dialog v-model="MergeDialog" title="Merge Settlement" width="90%" :close-on-click-modal="false">
      <div v-if="currentSettlementForMerge">
        <el-row :gutter="20">
          <!-- Current Settlement Details -->
          <el-col :span="12">
            <el-card shadow="hover">
              <template #header>
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <span><strong>Current Settlement</strong></span>
                  <el-radio v-model="mergePrimaryId" :label="currentSettlementForMerge.id">
                    Set as Primary
                  </el-radio>
                </div>
              </template>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="ID">{{ currentSettlementForMerge.id }}</el-descriptions-item>
                <el-descriptions-item label="Name">{{ currentSettlementForMerge.name }}</el-descriptions-item>
                <el-descriptions-item label="Code">{{ currentSettlementForMerge.code || 'N/A' }}</el-descriptions-item>
                <el-descriptions-item label="Location">
                  <span v-if="currentSettlementForMerge.ward && currentSettlementForMerge.subcounty && currentSettlementForMerge.county">
                    {{ currentSettlementForMerge.ward.name }} ward, {{ currentSettlementForMerge.subcounty.name }} subcounty, {{ currentSettlementForMerge.county.name }}
                  </span>
                  <span v-else>N/A</span>
                </el-descriptions-item>
                <el-descriptions-item label="Population">{{ currentSettlementForMerge.population || 'N/A' }}</el-descriptions-item>
                <el-descriptions-item label="Area (HA)">{{ currentSettlementForMerge.area ? Number(currentSettlementForMerge.area).toFixed(2) : 'N/A' }}</el-descriptions-item>
                <el-descriptions-item label="Type">{{ currentSettlementForMerge.settlement_type || 'N/A' }}</el-descriptions-item>
                <el-descriptions-item label="Status">{{ currentSettlementForMerge.isApproved || 'N/A' }}</el-descriptions-item>
              </el-descriptions>
  </el-card>
          </el-col>

          <!-- Search and Selected Settlement -->
          <el-col :span="12">
            <el-card shadow="hover">
              <template #header>
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <span><strong>Merge With</strong></span>
                  <el-radio 
                    v-if="selectedSettlementForMerge" 
                    v-model="mergePrimaryId" 
                    :label="selectedSettlementForMerge.id">
                    Set as Primary
                  </el-radio>
                </div>
              </template>
              
              <!-- Selected Settlement Details -->
              <div v-if="selectedSettlementForMerge" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e4e7ed;">
                <el-descriptions :column="1" border size="small" title="Selected Settlement">
                  <el-descriptions-item label="ID">{{ selectedSettlementForMerge.id }}</el-descriptions-item>
                  <el-descriptions-item label="Name">{{ selectedSettlementForMerge.name }}</el-descriptions-item>
                  <el-descriptions-item label="Code">{{ selectedSettlementForMerge.code || 'N/A' }}</el-descriptions-item>
                  <el-descriptions-item label="Location">
                    <span v-if="selectedSettlementForMerge.ward && selectedSettlementForMerge.subcounty && selectedSettlementForMerge.county">
                      {{ selectedSettlementForMerge.ward.name }} ward, {{ selectedSettlementForMerge.subcounty.name }} subcounty, {{ selectedSettlementForMerge.county.name }}
                    </span>
                    <span v-else>N/A</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="Population">{{ selectedSettlementForMerge.population || 'N/A' }}</el-descriptions-item>
                  <el-descriptions-item label="Area (HA)">{{ selectedSettlementForMerge.area ? Number(selectedSettlementForMerge.area).toFixed(2) : 'N/A' }}</el-descriptions-item>
                  <el-descriptions-item label="Type">{{ selectedSettlementForMerge.settlement_type || 'N/A' }}</el-descriptions-item>
                  <el-descriptions-item label="Status">{{ selectedSettlementForMerge.isApproved || 'N/A' }}</el-descriptions-item>
                </el-descriptions>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- Warning Message -->
        <el-alert
          v-if="selectedSettlementForMerge && mergePrimaryId"
          :title="`Merging: Settlement ID ${mergePrimaryId === currentSettlementForMerge.id ? selectedSettlementForMerge.id : currentSettlementForMerge.id} will be merged into Settlement ID ${mergePrimaryId}`"
          type="warning"
          :closable="false"
          style="margin-top: 20px;">
          <template #default>
            <p style="margin: 0;">
              The selected primary settlement will be kept. The other settlement's data will be merged into it, 
              and all references will be updated. This action cannot be undone.
            </p>
          </template>
        </el-alert>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="MergeDialog = false">Cancel</el-button>
          <el-button 
            type="primary" 
            :disabled="!selectedSettlementForMerge || !mergePrimaryId"
            @click="showMergeConfirmation">
            Merge Settlements
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Merge Confirmation Dialog -->
    <el-dialog 
      v-model="MergeConfirmDialog" 
      title="Confirm Merge Settlement" 
      width="600px"
      :close-on-click-modal="false">
      <div v-if="currentSettlementForMerge && selectedSettlementForMerge && mergePrimaryId">
        <!-- <el-alert
          type="warning"
          :closable="false"
          style="margin-bottom: 20px;">
          <template #title>
            <strong>This action cannot be undone!</strong>
          </template>
        </el-alert> -->

        <div style="margin-bottom: 20px;">
          <p><strong>Primary Settlement (will be kept):</strong></p>
          <p style="padding-left: 20px; color: #409EFF;">
            ID: {{ mergePrimaryId }} - 
            {{ mergePrimaryId === currentSettlementForMerge.id ? currentSettlementForMerge.name : selectedSettlementForMerge.name }}
          </p>
        </div>

        <div style="margin-bottom: 20px;">
          <p><strong>Settlement to be merged (will be deleted):</strong></p>
          <p style="padding-left: 20px; color: #F56C6C;">
            ID: {{ mergePrimaryId === currentSettlementForMerge.id ? selectedSettlementForMerge.id : currentSettlementForMerge.id }} - 
            {{ mergePrimaryId === currentSettlementForMerge.id ? selectedSettlementForMerge.name : currentSettlementForMerge.name }}
          </p>
        </div>

        <el-divider />

        <el-alert
          type="info"
          :closable="false">
          <template #default>
            <p style="margin: 0 0 10px 0;">
              <strong>All associated data will be automatically updated:</strong> All references (documents, roads, projects, facilities, and any other entities linked to the settlement being merged) will be automatically updated to point to the primary settlement.
            </p>
            <p style="margin: 0 0 10px 0;">
              The merged settlement record will be permanently deleted, but this operation is tracked in history, allowing you to restore the merged settlement and all its associations if needed.
            </p>
            <p style="margin: 0;">
              <strong>Note:</strong> This action cannot be undone, but you can restore it from the Deleted tab if needed.
            </p>
          </template>
        </el-alert>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="MergeConfirmDialog = false">Cancel</el-button>
          <el-button 
            type="primary" 
            @click="confirmMerge">
            Confirm Merge
          </el-button>
        </span>
      </template>
    </el-dialog>

  </el-card>




  <!-- Dialog for displaying the map -->
  <el-dialog v-model="duplicateDialogShow" @close="resetDialogData" title="Potential Duplicate Locations">
    <div ref="mapContainer" class="map-container"></div>
    <el-button @click="toggleLayer" style="margin-top: 10px;">
      Toggle Satellite View
    </el-button>
  </el-dialog>

  <el-dialog
        title="Filter by Create Date"
        v-model="DateDialogVisible"
        width="30%" >
        <el-form   ref="dateFormRef">
          <el-form-item label="Date Range">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              unlink-panels
              range-separator="To"
              start-placeholder="Start date"
              end-placeholder="End date"
              size="default"
              style="width: 100%;"
              @change="handleDateChange"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="DateDialogVisible=false">Cancel</el-button>
            <el-button type="primary" @click="handleDateChange">Confirm</el-button>
          </span>
        </template>
    </el-dialog>

    <!-- Location Update Drawer -->
    <el-drawer
      v-model="locationUpdateDrawer"
      title="Update Settlement Location"
      :size="isMobile || windowWidth <= 1024 ? '100%' : '60%'"
      :before-close="handleLocationDrawerClose"
      destroy-on-close
      :close-on-click-modal="false"
      :show-close="true">
      <div v-if="locationUpdateSettlement" style="height: 100%; display: flex; flex-direction: column; overflow: hidden;">
        <div style="flex: 1; overflow-y: auto; padding-right: 10px; min-height: 0;">
          <el-card style="margin-bottom: 10px;">
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="Settlement ID">{{ locationUpdateSettlement.id }}</el-descriptions-item>
              <el-descriptions-item label="Name">{{ locationUpdateSettlement.name }}</el-descriptions-item>
              <el-descriptions-item label="Code">{{ locationUpdateSettlement.code || 'N/A' }}</el-descriptions-item>
              <el-descriptions-item label="Location">
                <span v-if="locationUpdateSettlement.ward && locationUpdateSettlement.subcounty && locationUpdateSettlement.county">
                  {{ locationUpdateSettlement.ward.name }} ward, {{ locationUpdateSettlement.subcounty.name }} subcounty, {{ locationUpdateSettlement.county.name }}
                </span>
                <span v-else>N/A</span>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-alert
            type="info"
            :closable="false"
            style="margin-bottom: 10px;">
            <template #default>
              <p style="margin: 0;">
                <strong>Instructions:</strong> 
                <span v-if="locationUpdateSettlement?.geom?.type === 'Point' || locationUpdateSettlement?.geom?.type === 'MultiPoint'">
                  Current geometry is a Point (shown as blue marker). Draw a polygon to convert it to a polygon boundary.
                </span>
                <span v-else>
                  Use the drawing tools above the map to draw or edit the settlement boundary, or upload a polygon GeoJSON/shapefile. 
                  You can click on the polygon to edit its shape. 
                </span>
                When finished, click "Save Location" to update only the geometry (saved as Polygon).
              </p>
            </template>
          </el-alert>

          <div style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
            <el-button type="primary" :icon="UploadFilled" @click="locationUpdateShowUploadDialog = true">
              Upload GeoJSON/Shapefile
            </el-button>
            <div style="display: flex; gap: 10px;">
              <el-button 
                @click="handleLocationDrawerClose">
                Cancel
              </el-button>
              <el-button 
                type="primary" 
                :loading="locationUpdateLoading"
                :disabled="!locationUpdateGeometryChanged"
                @click="saveLocationUpdate">
                Save Location
              </el-button>
            </div>
          </div>

          <div 
            ref="locationUpdateMapContainer" 
            style="height: 650px; width: 100%; border: 1px solid #e4e7ed; border-radius: 4px; margin-bottom: 10px;">
          </div>
        </div>

     
      </div>
    </el-drawer>

    <!-- Upload Dialog for Location Update -->
    <el-dialog 
      v-model="locationUpdateShowUploadDialog" 
      title="Upload GeoJSON/Shapefile/KML/KMZ" 
      width="400px">
      <el-upload
        v-model:file-list="locationUpdateFileList"
        class="upload-demo"
        action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
        :auto-upload="false"
        :show-file-list="true"
        :on-change="handleLocationUpdateUploadGeo"
        :limit="1">
        <template #trigger>
          <el-button type="primary">
            <el-icon><UploadFilled /></el-icon>
            Select File
          </el-button>
        </template>
        <template #tip>
          <div class="el-upload__tip">
            Supported formats: GeoJSON (.geojson, .json), Shapefile (.zip), KML (.kml), KMZ (.kmz)
          </div>
        </template>
      </el-upload>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="locationUpdateShowUploadDialog = false">Close</el-button>
        </span>
      </template>
    </el-dialog>

</template>



<style scoped>
.basemap {
  width: 100%;
  height: 75vh;
}
</style>

<style>
.el-table .warning-row {
  --el-table-tr-bg-color: var(--el-color-warning-light-9);
}

.el-table .success-row {
  --el-table-tr-bg-color: var(--el-color-success-light-9);
}
</style>





<style>
.el-row {
  margin-bottom: 20px;
}

.el-row:last-child {
  margin-bottom: 0;
}

.el-col {
  border-radius: 4px;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
}

.item {
  margin-top: 10px;
  margin-right: 40px;
}


.demo-tabs>.el-tabs__content {
  padding: 32px;
  color: #6b778c;
  font-size: 32px;
  font-weight: 600;
}

.demo-tabs .custom-tabs-label .el-icon {
  vertical-align: middle;
}

.demo-tabs .custom-tabs-label span {
  vertical-align: middle;
  margin-left: 4px;
}

.custom-tab.is-active {
  color: red;
}
</style>


<style>
.el-col {
  border-radius: 4px;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
}


.map-container {
  width: 100%;
  height: 650px;
  /* Set the height of the map container */
}
</style>

<style scoped>
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