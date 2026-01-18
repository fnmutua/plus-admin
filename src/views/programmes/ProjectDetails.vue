<script setup lang="ts">
import { onMounted, computed, watch, reactive } from 'vue'
import {
  ElButton, ElDivider, ElTimeline, ElTimelineItem, ElCol, ElRow, ElCheckbox, ElInput, ElOptionGroup, ElForm, ElFormItem, ElUpload, ElMessage,
  ElCard, ElTabs, ElTabPane, ElTable, ElTableColumn, ElTooltip, ElDialog, ElSelect, ElOption, ElDescriptions,
  ElDescriptionsItem, ElText, ElDatePicker, ElPopconfirm, ElStep, ElSteps, FormRules, ElSelectV2, ElInputNumber, ElSwitch, ElPagination,
} from 'element-plus'
// Locally
import { logGrievanceAction, updateGrievanceStatus } from '@/api/grievance'
import { uuid } from 'vue-uuid'
import { getSettlementListByCounty } from '@/api/settlements'
import type { RouteLocationNormalizedLoaded, RouterLinkProps } from 'vue-router'

import { getOneGeo } from '@/api/settlements'

import { Icon } from '@iconify/vue';
import {
  Download, UploadFilled, Edit, Back, CircleCloseFilled, Position, Delete
} from '@element-plus/icons-vue'

import { getCountyListApi, } from '@/api/counties'

import { uploadFilesBatch } from '@/api/settlements'
import { addTask, getTasks, getNestedTasks, batchImport, deleteTask, getClockInHistory } from '@/api/project'

import {
  getOneSettlement
} from '@/api/settlements'

import { updateOneRecord, BatchImportUpsert, deleteDocument } from '@/api/settlements'
import {
  searchByKeyWord
} from '@/api/settlements'

import { CreateRecord, DeleteRecord } from '@/api/settlements'
import type { UploadProps, UploadUserFile } from 'element-plus'


import { MapboxLayerSwitcherControl } from "mapbox-layer-switcher";
import "mapbox-layer-switcher/styles.css";

import { ref } from 'vue'

import '@dafcoe/vue-collapsible-panel/dist/vue-collapsible-panel.css'
import { useRoute } from 'vue-router'

import { useRouter } from 'vue-router'
import { useCache } from '@/hooks/web/useCache'
import { useAppStoreWithOut } from '@/store/modules/app'


import "mapbox-layer-switcher/styles.css";
import * as turf from '@turf/turf'
import { getFile } from '@/api/summary'
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import shortid from 'shortid';
import DownloadCustom from '@/views/Components/DownloadCustom.vue'

import type { FormInstance } from 'element-plus'
import { getModelSpecs } from '@/api/fields'

import exportFromJSON from 'export-from-json'
import Papa from 'papaparse';
 



const MapBoxToken = 'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = MapBoxToken;



const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)

// Role checking setup
const isSuperAdmin = ref(
  userInfo.roles?.some((role: any) => role.name === "super_admin" || role.name === "root_admin")
)
const isNationalStaff = computed(() => {
  return userInfo?.roles?.some((role: any) => 
    role.user_roles?.location_level === 'national'
  ) || false
})

// Process user roles for permission checking
let processedRoles: any[] = []
if (userInfo.roles) {
  processedRoles = userInfo.roles.map((role: any) => {
    const level = role.user_roles?.location_level;
    return {
      role: role.name,
      model: level,
      field: level === 'county' ? 'county_id' : level === 'settlement' ? 'settlement_id' : null,
      fieldvalue: level === 'county' ? role.user_roles?.county_id : level === 'settlement' ? role.user_roles?.settlement_id : null
    };
  }).filter((role: any) => role !== null);
}

// Permission checking functions
const canUserDeleteProject = (project: any): boolean => {
  // Return false if project is undefined or null
  if (!project) {
    return false;
  }

  // Super admins and root admins can delete any project
  if (isSuperAdmin.value) {
    return true;
  }

  // National staff can delete any project
  if (isNationalStaff.value) {
    return true;
  }

  // Check if user has global project:delete permission
  const userPermissions = userInfo.permissions || [];
  if (userPermissions.includes('*.*.*') || userPermissions.includes('project:delete')) {
    // If the project has a createdBy field, check if the current user created it
    const projectCreatedBy = project.createdBy || project.created_by;
    if (projectCreatedBy === userInfo.id) {
      return true;
    }

    // For county staff, check if they are a county admin and the project is in their county
    const countyRole = userInfo.roles.find((role: any) => role.user_roles?.location_level === 'county' && role.name === 'admin');
    if (countyRole && countyRole.user_roles?.county_id) {
      // Check if project has locations in the user's county
      if (project.project_locations && Array.isArray(project.project_locations)) {
        return project.project_locations.some((loc: any) => loc.county_id === countyRole.user_roles.county_id);
      }
      // Fallback: check if project has county_id directly
      if (project.county_id === countyRole.user_roles.county_id) {
        return true;
      }
    }
  }
  return false;
}

const canUserDeleteDocument = (document: any): boolean => {
  // Return false if document is undefined or null
  if (!document) {
    return false;
  }

  // Super admins and root admins can delete any document
  if (isSuperAdmin.value) {
    return true;
  }

  // National staff can delete any document
  if (isNationalStaff.value) {
    return true;
  }

  // Check if user has global document:delete permission
  const userPermissions = userInfo.permissions || [];
  if (userPermissions.includes('*.*.*') || userPermissions.includes('document:delete')) {
    // If the document has a createdBy field, check if the current user created it
    if (document.createdBy === userInfo.id) {
      return true;
    }

    // For county staff, check if they are a county admin and the document is in their county
    const countyRole = userInfo.roles.find((role: any) => role.user_roles?.location_level === 'county' && role.name === 'admin');
    if (countyRole && countyRole.user_roles?.county_id) {
      // If the document is associated with a settlement, check the settlement's county_id
      if (document.settlement?.county_id === countyRole.user_roles.county_id) {
        return true;
      }
      // If the document is associated with a project, check project locations
      if (document.project?.project_locations && Array.isArray(document.project.project_locations)) {
        return document.project.project_locations.some((loc: any) => loc.county_id === countyRole.user_roles.county_id);
      }
    }
  }
  return false;
}

const canUserDeleteProjectLocation = (location: any): boolean => {
  // Return false if location is undefined or null
  if (!location) {
    return false;
  }

  // Super admins and root admins can delete any location
  if (isSuperAdmin.value) {
    return true;
  }

  // National staff can delete any location
  if (isNationalStaff.value) {
    return true;
  }

  // Check if user has global permission
  const userPermissions = userInfo.permissions || [];
  if (userPermissions.includes('*.*.*') || userPermissions.includes('project_location:delete')) {
    // If the location has a createdBy field, check if the current user created it
    if (location.createdBy === userInfo.id) {
      return true;
    }

    // For county staff, check if they are a county admin and the location is in their county
    const countyRole = userInfo.roles.find((role: any) => role.user_roles?.location_level === 'county' && role.name === 'admin');
    if (countyRole && countyRole.user_roles?.county_id) {
      if (location.county_id === countyRole.user_roles.county_id) {
        return true;
      }
    }
  }
  return false;
}

const canUserDeleteTeamMember = (member: any): boolean => {
  // Super admins and root admins can delete any team member
  if (isSuperAdmin.value) {
    return true;
  }

  // National staff can delete any team member
  if (isNationalStaff.value) {
    return true;
  }

  // Check if user has global permission
  const userPermissions = userInfo.permissions || [];
  if (userPermissions.includes('*.*.*') || userPermissions.includes('project_team:delete')) {
    // If the member has a createdBy field, check if the current user created it
    if (member.createdBy === userInfo.id) {
      return true;
    }

    // For county staff, check if they are a county admin
    const countyRole = userInfo.roles.find((role: any) => role.user_roles?.location_level === 'county' && role.name === 'admin');
    if (countyRole) {
      return true; // County admins can delete team members in their projects
    }
  }
  return false;
}

const canUserDeleteContractor = (contractor: any): boolean => {
  // Super admins and root admins can delete any contractor
  if (isSuperAdmin.value) {
    return true;
  }

  // National staff can delete any contractor
  if (isNationalStaff.value) {
    return true;
  }

  // Check if user has global permission
  const userPermissions = userInfo.permissions || [];
  if (userPermissions.includes('*.*.*') || userPermissions.includes('project_contractor:delete')) {
    // If the contractor has a createdBy field, check if the current user created it
    if (contractor.createdBy === userInfo.id) {
      return true;
    }

    // For county staff, check if they are a county admin
    const countyRole = userInfo.roles.find((role: any) => role.user_roles?.location_level === 'county' && role.name === 'admin');
    if (countyRole) {
      return true; // County admins can delete contractors in their projects
    }
  }
  return false;
}

const canUserDeleteDisbursement = (disbursement: any): boolean => {
  // Super admins and root admins can delete any disbursement
  if (isSuperAdmin.value) {
    return true;
  }

  // National staff can delete any disbursement
  if (isNationalStaff.value) {
    return true;
  }

  // Check if user has global permission
  const userPermissions = userInfo.permissions || [];
  if (userPermissions.includes('*.*.*') || userPermissions.includes('disbursement:delete')) {
    // If the disbursement has a createdBy field, check if the current user created it
    if (disbursement.createdBy === userInfo.id) {
      return true;
    }

    // For county staff, check if they are a county admin
    const countyRole = userInfo.roles.find((role: any) => role.user_roles?.location_level === 'county' && role.name === 'admin');
    if (countyRole) {
      return true; // County admins can delete disbursements in their projects
    }
  }
  return false;
}

const canUserDeleteTask = (task: any): boolean => {
  // Super admins and root admins can delete any task
  if (isSuperAdmin.value) {
    return true;
  }

  // National staff can delete any task
  if (isNationalStaff.value) {
    return true;
  }

  // Check if user has global permission
  const userPermissions = userInfo.permissions || [];
  if (userPermissions.includes('*.*.*') || userPermissions.includes('project_task:delete')) {
    // If the task has a createdBy field, check if the current user created it
    if (task.createdBy === userInfo.id) {
      return true;
    }

    // For county staff, check if they are a county admin
    const countyRole = userInfo.roles.find((role: any) => role.user_roles?.location_level === 'county' && role.name === 'admin');
    if (countyRole) {
      return true; // County admins can delete tasks in their projects
    }
  }
  return false;
}




// Resolve, Escalate, Documentation 

const route = useRoute()

const Grievance = ref(
  {
    'code': null,
    'complainant': null,
    'telephone': null,
    'county': null,
    'settlement': null,
    'nature': null,
    'is_GBV': null,
    'description': null,
    'status': null,
    'plea': null,
    'date_reported': null
  }
)



const projectDocuments = ref([])
const projectDocumentsTotal = ref(0)

const projectLogs = ref([])

// Pagination state for Locations tab
const locationCurrentPage = ref(1)
const locationPageSize = ref(10)

// Pagination state for Documentation tab
const docsCurrentPage = ref(1)
const docsPageSize = ref(10)

//// ------------------parameters -----------------------////

//const associated_Model = ''


// Exclude documents from the initial project load; fetch documents separately by project id
const associated_multiple_models = ['county', 'subcounty', 'ward', 'component', 'programme', 'project_team', 'project_contractor', 'project_location']
const nested_models = [] // no nested documents on initial load

function formatSentence(text) {
  // Replace underscores and periods with spaces
  let formattedText = String(text).replace(/[_\.]/g, ' ');

  // Capitalize the first letter of each word
  formattedText = formattedText
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Trim any leading or trailing spaces
  formattedText = formattedText.trim();

  // Remove extra spaces between words
  formattedText = formattedText.replace(/\s+/g, ' ');

  return formattedText;
}


const activityOptions = ref([])

const DocTypes = ref([])
const DocTypesFiltered = ref([])
const DocTypesAll = ref([])
const DocCategories= ref([])
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
  }).then((response) => {
    //tableDataList.value = response.data
    var ret = response.data
    console.log('filterOptions---Docypes-x', response.data)
    DocCategories.value=response.data

    const nestedData = ret.reduce((acc, cur) => {
      const group = cur.group;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(cur);
      return acc;
    }, {});

    //console.log(nestedData.Map)
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
      //    console.log('doc, ', doc)

      DocTypes.value.push(doc)
      DocTypesFiltered.value.push(doc)
      DocTypesAll.value.push(doc)


    }

  })


  //DocTypes.value = DocTypesFiltered.value


console.log(  'DocCategories.value',  DocCategories.value)

}


const getActivities = async () => {

  const formData = {}
  formData.model = 'activity'
  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword = '' 
  formData.returnAll = true
  formData.excludeGeom = false
  formData.associated_multiple_models = []

  //--Single Filter -----------------------------------------


  // - multiple filters -------------------------------------
  formData.filters = []
  formData.filterValues = []

  //formData.cache_key = 'SeacrchByKey_' + search_string.value

  //-------------------------
  console.log("formData", formData)
  const res = await searchByKeyWord(formData)

  console.log("res.data", res.data)

  if (res.data && res.data.length > 0) {
    activityOptions.value = res.data.map(item => ({
      value: item.id,
      id: item.id,
      label: item.title,
      title: item.title,
      code: item.code,

    }));

  }


}


const contractorOptions = ref([])



const getContractors = async (project_id) => {

  const formData = {}
  formData.model = 'contractor'
  //-Search field--------------------------------------------

  //formData.searchKeyword = project_id
  formData.excludeGeom = false
  formData.associated_multiple_models = []



  // - multiple filters -------------------------------------
  formData.filters = []
  formData.filterValues = []

  //formData.cache_key = 'SeacrchByKey_' + search_string.value

  const res = await getSettlementListByCounty(formData)



  if (res.data && res.data.length > 0) {
    contractorOptions.value = res.data.map(item => ({
      value: item.id,
      id: item.id,
      label: item.name,
      name: item.name,
      code: item.code,

    }));

  }

}



const getProjecteam = async (project_id) => {

  const formData = {}
  formData.model = 'project_team'
  //-Search field--------------------------------------------

  //formData.searchKeyword = project_id
  formData.excludeGeom = false
  formData.associated_multiple_models = []



  // - multiple filters -------------------------------------
  formData.filters = ['project_id']
  formData.filterValues = [[project_id]]

  //formData.cache_key = 'SeacrchByKey_' + search_string.value

  const res = await getSettlementListByCounty(formData)

  projectTeamData.value = res.data



}


const getProjecContractors = async (project_id) => {

  const formData = {}
  formData.model = 'project_contractor'
  //-Search field--------------------------------------------

  //formData.searchKeyword = project_id
  formData.excludeGeom = false
  formData.associated_multiple_models = []



  // - multiple filters -------------------------------------
  formData.filters = ['project_id']
  formData.filterValues = [[project_id]]

  //formData.cache_key = 'SeacrchByKey_' + search_string.value

  const res = await getSettlementListByCounty(formData)

  projectContractors.value = res.data



}



const getprojectDisbursements = async (project_id) => {

  const formData = {}
  formData.model = 'disbursement'
  //-Search field--------------------------------------------

  //formData.searchKeyword = project_id
  formData.excludeGeom = false
  formData.associated_multiple_models = []



  // - multiple filters -------------------------------------
  formData.filters = ['project_id']
  formData.filterValues = [[project_id]]

  //formData.cache_key = 'SeacrchByKey_' + search_string.value

  const res = await getSettlementListByCounty(formData)

  projectDisbursements.value = res.data



}










const getLocations = async (
  project_id,
  page = locationCurrentPage.value,
  size = locationPageSize.value
) => {

  const formData = {}
  formData.model = 'project_location'
  //-Search field--------------------------------------------

  //formData.searchKeyword = project_id
  formData.excludeGeom = false
  formData.associated_multiple_models = ['county', 'subcounty', 'ward', 'settlement']



  // - multiple filters -------------------------------------
  formData.filters = ['project_id']
  formData.filterValues = [[project_id]]
  if (page && size) {
    formData.page = page
    formData.limit = size
  }

  //formData.cache_key = 'SeacrchByKey_' + search_string.value

  const res = await getSettlementListByCounty(formData)

  const incoming = res.data || []
  if (page && page > 1 && Array.isArray(projectLocations.value)) {
    const existingIds = new Set(projectLocations.value.map((loc: any) => loc.id))
    const merged = [
      ...projectLocations.value,
      ...incoming.filter((loc: any) => !existingIds.has(loc.id))
    ]
    projectLocations.value = merged
  } else {
    projectLocations.value = incoming
  }
  projectLocationsTotal.value = res.total ?? projectLocations.value.length


  console.log('Locations:', project_id, res)

}

 

const getProjectDocuments = async (
  field,
  fieldValue,
  options: { paginate?: boolean; page?: number; size?: number } = {}
) => {
  const paginate = options.paginate !== false
  const page = options.page ?? docsCurrentPage.value
  const size = options.size ?? docsPageSize.value

  const formData: any = {}
  formData.model = 'document'
  formData.excludeGeom = false
  formData.associated_multiple_models = []

  // - multiple filters -------------------------------------
  formData.filters = [field]
  formData.filterValues = [fieldValue]
  if (paginate) {
    formData.page = page
    formData.limit = size
  }

  try {
    const res = await getSettlementListByCounty(formData as any)

    const resAny: any = res as any
    const docsData = resAny?.data || []
    const totalFromApi =
      resAny?.total ??
      resAny?.totalCount ??
      resAny?.count ??
      resAny?.results?.total ??
      resAny?.results?.totalCount ??
      resAny?.results?.count ??
      resAny?.pagination?.total ??
      resAny?.meta?.total
    projectDocumentsTotal.value = totalFromApi ?? docsData.length

    const enrichedDocs = docsData.map((doc: any) => {
      const match = DocCategories.value.find((item: any) => item.id == doc.category)
      if (match) {
        doc.type = match.type
      }
      // Set deletable property based on permissions
      doc.deletable = canUserDeleteDocument(doc)
      return doc
    })

    // When paginating, append to existing docs to keep earlier pages in memory.
    if (paginate && page > 1 && Array.isArray(projectDocuments.value)) {
      const existingIds = new Set(projectDocuments.value.map((doc: any) => doc.id))
      const merged = [
        ...projectDocuments.value,
        ...enrichedDocs.filter((doc: any) => !existingIds.has(doc.id))
      ]
      projectDocuments.value = merged
    } else if (paginate) {
      projectDocuments.value = enrichedDocs
    }

    return enrichedDocs || [] // Return the result data or an empty array if no data
  } catch (error) {
    console.error('Error fetching project documents:', error)
    return [] // Return an empty array if there is an error
  }
};


const indicatorReports = ref([])
const getIndicatorCategoryReports = async (projectId) => {

  const model = 'indicator_category_report'
  const associated_multiple_models = ['document', 'project', 'county', 'subcounty', 'ward', 'users', 'indicator_category']
  //const nested_models = ['indicator_category', 'indicator'] // The mother, then followed by the child
  const nested_models = ['activity', 'project']  // The mother, then followed by the child



  const formData = {}
  formData.model = model
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.excludeGeom = false
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = nested_models

  //--Single Filter -----------------------------------------


  // - multiple filters -------------------------------------
  formData.filters = ['project_id']
  formData.filterValues = [[projectId]]

  //formData.cache_key = 'SeacrchByKey_' + search_string.value

  //-------------------------
  console.log("formData", formData)
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('Reports collected........', projectId)
  //indicatorReports.value = res.data
  res.data.forEach(item => indicatorReports.value.push(item));

  const indicatorReportIds = res.data.map(item => item.id);
  console.log('indicatorReportIds',indicatorReportIds)

 const reportDocs = await getProjectDocuments('report_id', indicatorReportIds, { paginate: false })

      
      // Check if the documents from reportDocs already exist in projectDocuments.value
      const uniqueReportDocs = reportDocs.filter(doc => {
        // Check if the document's ID already exists in projectDocuments.value
        return !projectDocuments.value.some(existingDoc => existingDoc.id === doc.id);
      });

      // Push only the unique documents that don't exist yet
      if (uniqueReportDocs.length > 0) {
        projectDocuments.value.push(...uniqueReportDocs);
        console.log('Updated projectDocuments:', projectDocuments.value);
      } else {
        console.log('No new documents to add.');
      }

 

}

const AddDialogVisible = ref(false)
const showSubmitBtn = ref(false)

const AddReport = () => {
  AddDialogVisible.value = true
  console.log('addign report')
  showSubmitBtn.value = true
}

const ShowLocationAddDialog = ref(false)
const AddLocation = () => {
  ShowLocationAddDialog.value = true

}




const Project = ref({})
// Define the properties you want to map
const propertiesToMap = [
  'code',
  'name',
  'ward.name',
  'county.name',
  'contract',
  'owner',
  'type',
  'status',
  'number_of_units',
  'start_date',
  'cost',

  'description',

];

const indicatorsOptions = ref([])
const indicatorsOptionsFiltered = ref([])

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
    associated_multiple_models: ['project', 'category', 'indicator'],
    nested_models: ['activity', 'project'],
  };

  const res = await getSettlementListByCounty(formData);
  console.log('indicator_category Response:', res);

  res.data.forEach((arrayItem) => {
    // console.log('=====>', arrayItem);

    const opt = {
      value: arrayItem.id,
      label: `${arrayItem.indicator_name} | ${arrayItem.category.category}`,
      title: arrayItem.category.title,
      activity_id: arrayItem.activity ? arrayItem.activity.id : null,
      unit: arrayItem.indicator.unit,
    };

    //  console.log(opt)
    // Collect only output indicators
    ///if (arrayItem.indicator_level === 'activity') {
    indicatorsOptions.value.push(opt);
    indicatorsOptionsFiltered.value.push(opt);
    //  }


  });


};




function objectToArray(obj) {
  return Object.entries(obj).map(([key, value]) => {
    return {
      property: key,
      value: value
    };
  });
}



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



const changeProject = async (project: any) => {


  ruleForm.project_location_id = null
  ruleForm.project_id = project


  let project_activities = []
  let sel_indicators = []
  let outcome_indicators = []

  console.log('changeProject', project)




  project_activities = await getProjectActivities(project)
  projectScopeChecked.value = project_activities
  sel_indicators = await getProjectActivityIndicators(project_activities)

  console.log('project_activities', project_activities)




  outcome_indicators = await getProjectProjectOutcomeIndicators()

  console.log('outcome_indicators', outcome_indicators)




  console.log('sel_indicators', sel_indicators)



  console.log('outcome_indicators', outcome_indicators)


  // Merging the two arrays
  const merged_indicators = [...sel_indicators, ...outcome_indicators];

  console.log('merged_indicators', merged_indicators)

  const transformedArray = merged_indicators.map(item => {
    //  console.log(item)
    return {
      label: item.indicator.name + ' ' + item.category_title,
      value: item.id,
      project_id: item.project_id,
      unit: item.indicator.unit,
      activity_id: item.activity_id,
     };
  });

  indicatorsOptionsFiltered.value = transformedArray

  console.log('transformedArray', transformedArray)








}



const projectDescription = ref([])
const projectGeom = ref()
const projectScope = ref()
const projectFullData = ref()
const projectTeamData = ref()
const projectContractors = ref()
const projectLocations = ref([])
const projectLocationsTotal = ref(0)
const projectDisbursements = ref()

// Clock-in related data
const clockInHistory = ref([])
const clockDateRange = ref([]) // [startDate, endDate]
const clockMonth = ref(null)   // single month
const downloadClockLoading = ref(false)

// Format YYYY-MM-DD
const formatYMD = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const project_title = ref()
const isLoading = ref(false)
const project_id = ref(route.params.id)


const implementation_scope = ref('settlement')
const isNationalProject = ref(false)
const programme_implementation_id = ref()


onMounted(async () => {
  isLoading.value = true
  const id = route.params.id
  const formData = {}
  formData.model = 'project'
  formData.id = route.params.id
  formData.associated_multiple_models = associated_multiple_models
  formData.id = id
  formData.nested_models = nested_models



  const res = await getOneSettlement(formData)

  projectFullData.value = res.data
  project_title.value = projectFullData.value.title
  console.log('full projec data', res.data)
  projectDocuments.value = []
  projectDocumentsTotal.value =
    res.data?.total_documents ??
    res.data?.documents?.length ??
    projectDocuments.value.length
  projectScope.value = res.data.activities
  projectTeamData.value = res.data.project_teams

  projectContractors.value = res.data.project_contractors
  implementation_scope.value = res.data.implementation_scope


  programme_implementation_id.value = res.data.implementation_id

  await getDocumentTypes()


  getActivities()
  getContractors(route.params.id)
  await getLocations(route.params.id, locationCurrentPage.value, locationPageSize.value)
  getProjecteam(route.params.id)
  getProjecContractors(route.params.id)
  projectDocuments.value = await getProjectDocuments(
    'project_id',
    [route.params.id],
    { paginate: true, page: docsCurrentPage.value, size: docsPageSize.value }
  )

  getprojectDisbursements(route.params.id)


  // fetchNestedParentTasks(route.params.id)
  getIndicatorCategoryReports(route.params.id)





  if ( res.data &&  res.data.implementation_scope == 'National') {
    isNationalProject.value = true
  } 
  console.log('isNationalProject', isNationalProject.value)







  ruleForm.subcounty_id = projectFullData.value.subcounty_id,
    ruleForm.ward_id = projectFullData.value.ward_id,
    ruleForm.county_id = projectFullData.value.county_id,



    getIndicatorNames()
  projectGeom.value = res.data
  for (const key of propertiesToMap) {
    // Split the key on '.' to handle nested properties
    const keys = key.split('.');
    let value = res.data;

    // Navigate through the nested properties
    for (const k of keys) {
      if (value && k in value) {
        value = value[k];
      } else {
        value = undefined; // If any key in the path doesn't exist, set value to undefined
        break; // Exit if a key is missing
      }
    }

    // Assign the found value to Project.value, if defined
    if (value !== undefined) {
      Project.value[key] = value;
    }
  }



  console.log(Project.value)


  projectDescription.value = objectToArray(Project.value);
  console.log(projectDescription);
  isLoading.value = false

  changeProject(route.params.id)
  // get current Tab 
  const savedTab = localStorage.getItem('activeTab');
  if (savedTab) {
    activeName.value = savedTab;
  }

})






const sortedprojectLogs = computed(() => {
  return projectLogs.value.slice().sort((a, b) => new Date(b.date_actioned) - new Date(a.date_actioned));
});



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


const form = ref({
  grievance_id: null,
  action_type: null,
  action_by: null,
  date_actioned: null,
  prev_status: null,
  new_status: null,
  fileList: [],
});




const dialogFormVisible = ref(false)
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



const validateFileUploads = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('Please input the password'))
  } else {
    if (form.value.fileList.length == 0) {
      console.log("Error,", form.value)
      callback(new Error('Please upload at least one document'));
    }
    callback()
  }
}




const dynamicFormRef = ref<FormInstance>()



const uploadFiles = async (action_id, grievance_id) => {
  const formData = new FormData();

  // Assuming `fileList` is an array of file objects and `grievance_id` is defined
  for (var i = 0; i < form.value.fileList.length; i++) {
    console.log('------>file', form.value.fileList[i]);
    formData.append('files', form.value.fileList[i].raw);
    formData.append('format', form.value.fileList[i].name.split('.').pop());
    formData.append('grievance_id', grievance_id);
    formData.append('action_id', action_id);
    formData.append('protected_file', true);
    formData.append('size', (form.value.fileList[i].raw.size / 1024 / 1024).toFixed(2));
    formData.append('code', uuid.v4());
  }

  // Printing out the contents of formData
  for (let [key, value] of formData.entries()) {
    console.log(`${key}: ${value}`);
  }

  //const res =  await uploadprojectDocuments(formData)

  console.log("Docuemnts Uploaded", res)




}

const viewLoading = ref(false)
const downloadingDocId = ref<number | null>(null)

const downloadFile = async (data) => {
  console.log(data);
  viewLoading.value = true;
  downloadingDocId.value = data.id || null
  const formData = {};
  formData.filename = data.name;
  formData.doc_id = data.id;
  formData.responseType = 'blob';

  // Add a flag to track if the download has started


  // Attach a 'beforeunload' event listener to the window
  window.addEventListener('beforeunload', () => {
    if (viewLoading.value) {
      console.log('Download has started.');
      viewLoading.value = false;
    }
  });

  try {
    const response = await getFile(formData);
    console.log(response);

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', data.name);
    document.body.appendChild(link);
    link.click();
    viewLoading.value = false;
    downloadingDocId.value = null
  } catch (error) {
    ElMessage.error('Failed');
    viewLoading.value = false;
    downloadingDocId.value = null
  }
};




let nmap; // Declare the map variable outside the function for scope

 



const icon = ref(`<button>  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4.97883 9.68508C2.99294 8.89073 2 8.49355 2 8C2 7.50645 2.99294 7.10927 4.97883 6.31492L7.7873 5.19153C9.77318 4.39718 10.7661 4 12 4C13.2339 4 14.2268 4.39718 16.2127 5.19153L19.0212 6.31492C21.0071 7.10927 22 7.50645 22 8C22 8.49355 21.0071 8.89073 19.0212 9.68508L16.2127 10.8085C14.2268 11.6028 13.2339 12 12 12C10.7661 12 9.77318 11.6028 7.7873 10.8085L4.97883 9.68508Z" fill="#1C274C"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M2 8C2 8.49355 2.99294 8.89073 4.97883 9.68508L7.7873 10.8085C9.77318 11.6028 10.7661 12 12 12C13.2339 12 14.2268 11.6028 16.2127 10.8085L19.0212 9.68508C21.0071 8.89073 22 8.49355 22 8C22 7.50645 21.0071 7.10927 19.0212 6.31492L16.2127 5.19153C14.2268 4.39718 13.2339 4 12 4C10.7661 4 9.77318 4.39718 7.7873 5.19153L4.97883 6.31492C2.99294 7.10927 2 7.50645 2 8Z" fill="#1C274C"></path> <path opacity="0.7" d="M5.76613 10L4.97883 10.3149C2.99294 11.1093 2 11.5065 2 12C2 12.4935 2.99294 12.8907 4.97883 13.6851L7.7873 14.8085C9.77318 15.6028 10.7661 16 12 16C13.2339 16 14.2268 15.6028 16.2127 14.8085L19.0212 13.6851C21.0071 12.8907 22 12.4935 22 12C22 11.5065 21.0071 11.1093 19.0212 10.3149L18.2339 10L16.2127 10.8085C14.2268 11.6028 13.2339 12 12 12C10.7661 12 9.77318 11.6028 7.7873 10.8085L5.76613 10Z" fill="#1C274C"></path> <path opacity="0.4" d="M5.76613 14L4.97883 14.3149C2.99294 15.1093 2 15.5065 2 16C2 16.4935 2.99294 16.8907 4.97883 17.6851L7.7873 18.8085C9.77318 19.6028 10.7661 20 12 20C13.2339 20 14.2268 19.6028 16.2127 18.8085L19.0212 17.6851C21.0071 16.8907 22 16.4935 22 16C22 15.5065 21.0071 15.1093 19.0212 14.3149L18.2339 14L16.2127 14.8085C14.2268 15.6028 13.2339 16 12 16C10.7661 16 9.77318 15.6028 7.7873 14.8085L5.76613 14Z" fill="#1C274C"></path> </g></svg></button>`)

const showSatellite = ref(false)

const toggleFloatingDiv = async (nmap) => {
  showSatellite.value = !showSatellite.value;
  console.log('Show Satellite', showSatellite.value);

  // Get the map style
  let style = nmap.getStyle();

  // Get all layers
  let allLayers = style.layers;

  // Log all layers to the console
  console.log('before ', allLayers);



  if (!showSatellite.value) {
    console.log('Remove Satellte');


    if (nmap.getLayer('Satellite')) {
      nmap.removeLayer('Satellite');
      nmap.removeSource('Satellite');

    }


  } else {

    console.log('Add Satellte');

    if (nmap.getLayer('Satellite')) {
      nmap.removeLayer('Satellite');
      nmap.removeSource('Satellite');

    } else {

      icon.value = `<button>  <svg viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="si-glyph si-glyph-satellite" fill="#f20707"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>650</title> <defs> </defs> <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g fill="#fb0e0e"> <path d="M12.495,5.893 C12.832,6.231 14.184,4.877 13.847,4.541 L10.864,1.557 C10.526,1.219 9.174,2.573 9.51,2.909 L12.495,5.893 L12.495,5.893 Z" class="si-glyph-fill"> </path> <path d="M3.288,10.897 C3.072,10.68 2.597,10.802 2.23,11.168 C1.863,11.536 1.742,12.009 1.959,12.228 L3.233,13.501 C3.45,13.719 3.922,13.597 4.289,13.23 C4.658,12.864 4.779,12.388 4.562,12.172 L3.288,10.897 L3.288,10.897 Z" class="si-glyph-fill"> </path> <rect transform="translate(2.240100, 2.131300) rotate(-44.991897) translate(-2.240100, -2.131300) " x="-0.25987605" y="1.13130958" width="4.96295245" height="1.95398128" class="si-glyph-fill"> </rect> <path d="M12.088,8.374 L10.657,9.802 L9.918,9.063 L11.543,7.439 C11.814,7.168 11.81,6.723 11.531,6.447 L9.031,3.948 C8.757,3.673 8.314,3.67 8.043,3.939 L6.419,5.564 L5.684,4.829 L7.113,3.401 L5.718,2.007 L2.221,5.503 L3.614,6.897 L5.028,5.484 L5.763,6.219 L4.134,7.849 C3.864,8.12 3.866,8.564 4.141,8.838 L6.641,11.336 C6.917,11.612 7.363,11.617 7.632,11.346 L9.262,9.717 L10.001,10.456 L8.585,11.869 L9.967,13.25 L13.464,9.753 L12.088,8.374 L12.088,8.374 Z" class="si-glyph-fill"> </path> <rect transform="translate(13.426200, 12.673100) rotate(-45.056720) translate(-13.426200, -12.673100) " x="10.9262228" y="11.6731091" width="4.96795479" height="1.97998198" class="si-glyph-fill"> </rect> </g> </g> </g></svg> </button>`

      nmap.addLayer(
        {
          id: 'Satellite',
          source: { "type": "raster", "url": "mapbox://mapbox.satellite", "tileSize": 256 },
          type: "raster"
        },
        'country-label'
      );
    }



  }

  // Get the map style
  style = nmap.getStyle();

  // Get all layers
  allLayers = style.layers;

  // Log all layers to the console
  console.log('after', allLayers);

}

function toFeatureCollection(array) {

  console.log(array)
  return {
    type: "FeatureCollection",
    features: array.map(item => ({
      type: "Feature",
      geometry: JSON.parse(JSON.stringify(item.geom)), // remove Proxy/reactivity
      properties: Object.fromEntries(
        Object.entries(item).filter(([key]) => key !== "geom")
      )
    }))
  };
}




const locationsGeometry = ref()

// Computed data for paginated Locations
const paginatedProjectLocations = computed(() => {
  const list = Array.isArray(projectLocations.value) ? projectLocations.value : []
  const start = (locationCurrentPage.value - 1) * locationPageSize.value
  const end = start + locationPageSize.value
  return list.slice(start, end)
})

// Computed data for paginated Documentation
const paginatedProjectDocuments = computed(() => {
  const list = Array.isArray(projectDocuments.value) ? projectDocuments.value : []
  const start = (docsCurrentPage.value - 1) * docsPageSize.value
  const end = start + docsPageSize.value
  return list.slice(start, end)
})

// Pagination handlers
const handleLocationPageChange = async (page: number) => {
  locationCurrentPage.value = page
  await getLocations(project_id.value, page, locationPageSize.value)
}

const handleLocationSizeChange = async (size: number) => {
  locationPageSize.value = size
  locationCurrentPage.value = 1
  await getLocations(project_id.value, locationCurrentPage.value, size)
}

const handleDocsPageChange = async (page: number) => {
  docsCurrentPage.value = page
  await getProjectDocuments(
    'project_id',
    [project_id.value],
    { paginate: true, page, size: docsPageSize.value }
  )
}

const handleDocsSizeChange = async (size: number) => {
  docsPageSize.value = size
  docsCurrentPage.value = 1
  await getProjectDocuments(
    'project_id',
    [project_id.value],
    { paginate: true, page: docsCurrentPage.value, size }
  )
}

// Utility to compute running index across pages
const rowNumber = (index: number, page: number, size: number) => {
  return (page - 1) * size + index + 1
}

const handleTabClick = async (tab) => {
  console.log('Tab clicked:', tab.props);
  localStorage.setItem('activeTab', tab.props.name);

  console.log('projectLocations.value',projectLocations.value)

  if (tab.props.name === 'map') {
    // Delay the loadMap function
    locationsGeometry.value = toFeatureCollection(projectLocations.value)

    setTimeout(() => {
      loadAllLocationsMap(locationsGeometry.value); // Load map after a brief delay
    }, 500); // Delay in milliseconds (500 ms = 0.5 seconds)
  }

  if (tab.props.name === 'Scope') {
    projectScopeChecked.value = projectScope.value.map(activity => activity.id);

  }

  if (tab.props.name === 'documents') {
    // Always load/refresh documents when Documentation tab is opened
    await getProjectDocuments(
      'project_id',
      [project_id.value],
      { paginate: true, page: docsCurrentPage.value, size: docsPageSize.value }
    )
  }

  if (tab.props.name === 'clockin') {
    getProjectClockIns(route.params.id);
  }
};

const addMoreDocuments = ref(false)



function toggleComponent(row) {

  console.log(row)
  addMoreDocuments.value = true

}



const count = ref(0)
const morefileList = ref([])
const documentCategory = ref()

const showUpload = ref(false)

const handleSelect = async (selected) => {
  showUpload.value = true
}

const protectedFile = ref(false)


const loadingPosting = ref(false)


const submitMoreDocuments = async () => {

  console.log('loadingPosting.value.......', morefileList.value.length)


  if (morefileList.value.length == 0) {
    ElMessage.error('Select at least one file!')
  }


  else {
    // uploading the documents 
    loadingPosting.value = true

    const fileTypes = []
    const formData = new FormData()

    for (var i = 0; i < morefileList.value.length; i++) {
      console.log('------>file', morefileList.value[i])
      var format = morefileList.value[i].name.split('.').pop() // get file extension

      // formData.append('files', fileList.value[i])
      // formData.file = fileList.value[i]

      formData.append('model', 'project')
      formData.append('createdBy', userInfo.id)

      formData.append('files', morefileList.value[i].raw)
      formData.append('format', morefileList.value[i].name.split('.').pop())
      formData.append('category', documentCategory.value)
      formData.append('field_id', 'project_id')
      formData.append('protected', protectedFile.value)

      formData.append('size', (morefileList.value[i].raw.size / 1024 / 1024).toFixed(2))
      formData.append('code', uuid.v4())
      formData.append('project_id', route.params.id)



    }

    const res = await uploadFilesBatch(formData)
       const updatedDocs = await getProjectDocuments(
        'project_id',
        [route.params.id],
        { paginate: true, page: docsCurrentPage.value, size: docsPageSize.value }
      )

        // Check if the documents from updatedDocs already exist in projectDocuments.value
        const uniqueUpdatedDocs = updatedDocs.filter(doc => {
          // Check if the document's ID already exists in projectDocuments.value
          return !projectDocuments.value.some(existingDoc => existingDoc.id === doc.id);
        });

        // Ensure deletable property is set for newly uploaded documents
        uniqueUpdatedDocs.forEach(doc => {
          doc.deletable = canUserDeleteDocument(doc)
        })

        // Push only the unique documents that don't exist yet
        if (uniqueUpdatedDocs.length > 0) {
          projectDocuments.value.push(...uniqueUpdatedDocs);
          console.log('Updated projectDocuments:', projectDocuments.value);
        } else {
          console.log('No new documents to add.');
        }


    if (res.code === "0000") {
      loadingPosting.value = false
      addMoreDocuments.value = false
      // Clear selected files after successful upload
      morefileList.value = []
    }

  }



}


const deleteRow = (index: number) => {
  projectScope.value.splice(index, 1)
}

const projectScopeChecked = ref([])

const updateChanges = async () => {
  // Assuming projectScope.value is an array of objects with an 'id' property
  //projectFullData.value.activities = projectScope.value.map(activity => activity.id);
  projectFullData.value.activities = projectScopeChecked.value;


  projectFullData.value.model = 'project'
  const res = await updateOneRecord(projectFullData.value)
  console.log('updated project Activties', res)
}


const ShowActivityAddDialog = ref(false)




const AddScope = async () => {
  ShowActivityAddDialog.value = true
}

const AddActivity = async () => {
  projectFullData.value.activities = projectScope.value.map(activity => activity.id);
  updateChanges()
}





const toggleActivity = () => {
  console.log(projectScopeChecked.value)

}

// do not use same name with ref
const teamForm = ref({
  project_id: route.params.id,
  name: '',
  phone: '',
  role: '',
  email: null,
  code: shortid.generate()

})

function validateEmail(rule, value, callback) {
  if (!value) {
    callback(new Error('Email is required'));
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      callback(new Error('Invalid email format'));
    } else {
      callback();
    }
  }
}


const rules = ({
  name: [
    { required: true, message: 'Please input a name', trigger: 'blur' },
    { min: 3, message: 'Length should be atleast 3 characters', trigger: 'blur' },
  ],

  phone: [
    { required: true, message: 'Please input a name', trigger: 'blur' },
    { min: 9, message: 'Length should be at least 9 characters', trigger: 'blur' },
  ],
  email: [
    { required: true, message: 'Email is required', trigger: 'blur' },
    { validator: validateEmail, trigger: 'blur' }, // Added email validation
  ],

  role: [
    { required: true, message: 'Please input a name', trigger: 'blur' },
  ],
})


const AddTeamDialog = ref(false)


const AddTeam = async () => {
  AddTeamDialog.value = true
}

const xroles = ['Project Manager', 'Regional Lead', 'CDH', 'Clerk of Works', 'Other'];
const roles = [
  "Team Leader",
  "Resident Engineer (RE)",
  "Assistant Resident Engineer (ARE)",
  "Roads Engineer",
  "Materials Engineer",
  "Water & Sanitation Engineer",
  "Electrical Engineer",
  "Surveyor Engineer",
  "Environmental Expert",
  "Sociologist / Community / Resettlement Expert",
  "Socio-Economist",
  "Procurement and Contract Management Expert",
  "Works Inspector",
  "CAD Technician",
  "Laboratory Technicians",
  "Office Administrator",
  "Chainmen",
  "Other"
]



const ruleFormRef = ref<FormInstance>()

const updateTeam = async () => {

  ruleFormRef.value.validate(async (valid: boolean) => {

    if (valid) {
      console.log('submit!')

      teamForm.value.model = 'project_team'

      const res = await CreateRecord(teamForm.value)


      projectTeamData.value.push(res.data)
      // if (res.data && res.data.length > 0) {
      //   projectTeamData.value = res.data.map(item); 
      // }




    } else {
      console.log('error submit!')
    }


  })


}

const RemoveTeamMember = async (row) => {
  if (!canUserDeleteTeamMember(row)) {
    ElMessage({
      message: 'You do not have permission to delete this team member. Only Super Admins, National Staff, or the County Admin who created this team member can delete it.',
      type: 'warning',
      duration: 5000,
      showClose: true
    });
    return;
  }

  let formData = {}
  formData.id = row.id
  formData.model = 'project_team'

  await DeleteRecord(formData);



  // remove the deleted object from array list 
  let index = projectTeamData.value.indexOf(row);
  if (index !== -1) {
    projectTeamData.value.splice(index, 1);
  }





}




// Fetch clock-in history for the project
const getProjectClockIns = async (project_id, params = {}) => {
  try {
    const res = await getClockInHistory({ project_id, ...params })
    clockInHistory.value = res.data || []
    console.log('Clock-in history:', clockInHistory.value)
  } catch (error) {
    console.error('Error fetching clock-in history:', error)
  }
}

// Format date and time
const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString()
}

// Calculate hours worked  
const calculateHours = (clockIn, clockOut) => {
  if (!clockIn || !clockOut) return '-'
  const start = new Date(clockIn)
  const end = new Date(clockOut)
  const hours = (end - start) / (1000 * 60 * 60)
  return hours.toFixed(2) + ' hrs'
}

// Apply filters (date range or month) to reload clock-ins
const applyClockFilters = () => {
  const params = {}

  if (clockDateRange.value && clockDateRange.value.length === 2 && clockDateRange.value[0] && clockDateRange.value[1]) {
    params.start_date = formatYMD(clockDateRange.value[0])
    params.end_date = formatYMD(clockDateRange.value[1])
  } else if (clockMonth.value) {
    const d = new Date(clockMonth.value)
    const first = new Date(d.getFullYear(), d.getMonth(), 1)
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    params.start_date = formatYMD(first)
    params.end_date = formatYMD(last)
  }

  getProjectClockIns(route.params.id, params)
}

const clearClockFilters = () => {
  clockDateRange.value = []
  clockMonth.value = null
  getProjectClockIns(route.params.id)
}

// Clock-in map preview
const clockDialogMap = ref(false)
const clockMapGeom = ref()

const openClockMap = (row) => {
  clockMapGeom.value = null
  if (row && row.geom) {
    clockMapGeom.value = { geom: row.geom }
  }
  // Fallback: if geom missing, try lat/lon if present
  if (!clockMapGeom.value && row && row.longitude && row.latitude) {
    clockMapGeom.value = {
      geom: {
        type: 'Point',
        coordinates: [Number(row.longitude), Number(row.latitude)]
      }
    }
  }
  if (!clockMapGeom.value) return
  clockDialogMap.value = true
  setTimeout(loadClockMap, 100)
}

const closeClockMap = () => {
  clockDialogMap.value = false
}

const loadClockMap = () => {
  try {
    const centroid = turf.centroid(clockMapGeom.value.geom)
    const mapCenter = centroid.geometry.coordinates
    const nmap = new mapboxgl.Map({
      container: 'clockMapContainer',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: mapCenter,
      zoom: 12,
    })

    nmap.on('load', () => {
      // Add base layers
      nmap.addLayer({
        id: 'Satellite',
        source: { type: 'raster', url: 'mapbox://mapbox.satellite', tileSize: 256 },
        type: 'raster',
      })
      nmap.addLayer({
        id: 'Streets',
        source: { type: 'raster', url: 'mapbox://mapbox.streets', tileSize: 256 },
        type: 'raster',
      })
      nmap.setLayoutProperty('Satellite', 'visibility', 'none')

      // Render point/line/polygon
      const geometryType = clockMapGeom.value.geom?.type
      if (geometryType === 'Point') {
        nmap.addLayer({
          id: 'clock-point',
          type: 'circle',
          source: { type: 'geojson', data: clockMapGeom.value.geom },
          paint: { 'circle-color': 'red', 'circle-radius': 6 },
          filter: ['==', '$type', 'Point'],
        })

        const coords = clockMapGeom.value.geom.coordinates
        const lat = coords[1].toFixed(5)
        const lng = coords[0].toFixed(5)
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`<h3>Clock-in</h3><p>(${lat}, ${lng})</p>`)
        new mapboxgl.Marker().setLngLat(coords).setPopup(popup).addTo(nmap).togglePopup()
      } else if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
        nmap.addLayer({
          id: 'clock-polygon',
          type: 'line',
          source: { type: 'geojson', data: clockMapGeom.value.geom },
          paint: { 'line-color': 'red', 'line-width': 2 },
          filter: ['in', '$type', 'Polygon'],
        })
        const bounds = turf.bbox(clockMapGeom.value.geom)
        nmap.fitBounds(bounds, { padding: 40, animate: true })
      } else if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
        nmap.addLayer({
          id: 'clock-line',
          type: 'line',
          source: { type: 'geojson', data: clockMapGeom.value.geom },
          paint: { 'line-color': 'red', 'line-width': 3 },
          filter: ['in', '$type', 'LineString'],
        })
        const bounds = turf.bbox(clockMapGeom.value.geom)
        nmap.fitBounds(bounds, { padding: 40, animate: true })
      }

      nmap.addControl(new mapboxgl.NavigationControl(), 'top-left')
      nmap.resize()
    })
  } catch (e) {
    console.error('Map load error', e)
  }
}


/// contratcor 

// COntractor 

const AddContractorTeamDialog = ref(false)
const contractorFormRef = ref()

const AddContractorTeam = async () => {
  AddContractorTeamDialog.value = true
}



// do not use same name with ref
const contractorForm = ref({
  project_id: route.params.id,
  contractor_id: null,
  role: null,
  scope: '',
  name: null,
  code: shortid.generate()
})

// contractior RUles 

const contractorRules = ({
  contractor_id: [
    { required: true, message: 'Please input a name', trigger: 'blur' },
  ],

  role: [
    { required: true, message: 'Role is required', trigger: 'blur' },
  ],


  scope: [
    { required: true, message: 'Scope is required', trigger: 'blur' },
  ],
})









const AddDisbursementTeamDialog = ref(false)
const DisbursementFormRef = ref()

const AddDisbursement = async () => {
  AddDisbursementTeamDialog.value = true
}




// do not use same name with ref
const DisbursementForm = ref({
  project_id: route.params.id,
  amount: null,
  disbursement_date: new Date(),
  certificate: null,
  description: null,
  code: shortid.generate()
})





const DisbursementRules = ({

  amount: [
    { required: true, message: 'Amount is required', trigger: 'blur' },
  ],

  description: [
    { required: true, message: 'Description is required', trigger: 'blur' },
  ],

  certificate: [
    { required: true, message: 'IPC certificate is required', trigger: 'blur' },
  ],
})




const updateDisbursement = async () => {

  DisbursementFormRef.value.validate(async (valid: boolean) => {

    if (valid) {
      console.log('submit!')

      DisbursementForm.value.model = 'disbursement'

      const res = await CreateRecord(DisbursementForm.value)


      projectTeamData.value.push(res.data)
      getprojectDisbursements(route.params.id)





    } else {
      console.log('error submit!')
    }


  })


}








const contract_roles = ['Main Contractor', 'Subcontractor', 'Consultant', 'Other'];


const updateContractor = async () => {

  contractorFormRef.value.validate(async (valid: boolean) => {

    if (valid) {
      console.log('submit!')

      contractorForm.value.model = 'project_contractor'

      const res = await CreateRecord(contractorForm.value)

      projectContractors.value.push(res.data)
      AddContractorTeamDialog.value = false
    } else {
      console.log('error submit!')
    }


  })


}


const RemoveContractor = async (row) => {
  if (!canUserDeleteContractor(row)) {
    ElMessage({
      message: 'You do not have permission to delete this contractor. Only Super Admins, National Staff, or the County Admin who created this contractor can delete it.',
      type: 'warning',
      duration: 5000,
      showClose: true
    });
    return;
  }

  let formData = {}
  formData.id = row.id
  formData.model = 'project_contractor'

  await DeleteRecord(formData);



  // remove the deleted object from array list 
  let index = projectContractors.value.indexOf(row);
  if (index !== -1) {
    projectContractors.value.splice(index, 1);
  }

}




const RemoveDocument = async (row) => {
  if (!canUserDeleteDocument(row)) {
    ElMessage({
      message: 'You do not have permission to delete this document. Only Super Admins, National Staff, or the County Admin who created this document can delete it.',
      type: 'warning',
      duration: 5000,
      showClose: true
    });
    return;
  }

  let formData = {}
  formData.id = row.id
  formData.model = 'document'

  await DeleteRecord(formData);



  // remove the deleted object from array list 
  let index = projectDocuments.value.indexOf(row);
  if (index !== -1) {
    projectDocuments.value.splice(index, 1);
  }

}


const RemoveDisbursement = async (row) => {
  if (!canUserDeleteDisbursement(row)) {
    ElMessage({
      message: 'You do not have permission to delete this disbursement. Only Super Admins, National Staff, or the County Admin who created this disbursement can delete it.',
      type: 'warning',
      duration: 5000,
      showClose: true
    });
    return;
  }

  let formData = {}
  formData.id = row.id
  formData.model = 'disbursement'

  await DeleteRecord(formData);



  // remove the deleted object from array list 
  let index = projectDisbursements.value.indexOf(row);
  if (index !== -1) {
    projectDisbursements.value.splice(index, 1);
  }

}



const handleSelectContractor = async (selected) => {
  const selectedContractor = contractorOptions.value.filter(item => item.id == selected);

  contractorForm.value.name = selectedContractor[0].name
  console.log(contractorForm.value)
}



// ASdd Missing Contractot

const showAddNewContractor = ref(false)

const onAddOption = () => {
  showAddNewContractor.value = true
}

// do not use same name with ref
const NewContractorForm = ref({
  name: null,
  contact_person: null,
  email: null,
  address: null,
  phone: '',
  code: shortid.generate()
})




const NewContractorRef = ref()
const ruleFormRules = ({
  name: [
    { required: true, message: 'Please input a name', trigger: 'blur' },
  ],

  phone: [
    { required: true, message: 'Phone is required', trigger: 'blur' },
  ],
  contact_person: [
    { required: true, message: 'Contact Person is required', trigger: 'blur' },
  ],

  address: [
    { required: true, message: 'Address is required', trigger: 'blur' },
  ],

  email: [
    { required: true, message: 'Please enter an email address', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email address', trigger: ['blur', 'change'] }
  ],

})


const createNewContractor = async () => {

  NewContractorRef.value.validate(async (valid: boolean) => {

    if (valid) {
      console.log('submit!')

      NewContractorForm.value.model = 'contractor'

      const res = await CreateRecord(NewContractorForm.value)

      console.log(res.data)

      if (res.data) {
        let new_cont = {}
        new_cont.value = res.data.id
        new_cont.id = res.data.id
        new_cont.label = res.data.name
        new_cont.name = res.data.name
        new_cont.code = res.data.code

        contractorOptions.value.push(new_cont)


      }
      /*  contractorOptions.value = 
         contractorOptions.value = res.data.map(item => ({
           value: item.id,
           id: item.id,
           label: item.name,
           name: item.name,
           code: item.code,
           
         })); */




      showAddNewContractor.value = false


    } else {
      console.log('error submit!')
    }


  })


}


const { push } = useRouter()

const editProject = async () => {
  // push({
  //   path: '/interventions/add/:domain',
  //   name: 'AddInterventionProjectsV2',
  //   query: { id: projectFullData.value.id },
  //   params: { id: projectFullData.value.id, domain: projectFullData.value.component_id }
  // })


  push({
  name: 'AddProject',
  query: { id: projectFullData.value.id },
  params: { domain: projectFullData.value.component_id, id: projectFullData.value.id }
})



}


// Reactive state
const tasks = ref([]);
const dialogVisible = ref(false);
const taskForm = ref({
  project_id: null,
  parentTaskId: null, // Added for parent task selection
  parentTaskPath: [],
  progress: 0,
  status: 'Pending',
  startDate: null,
  endDate: null,
  createdBy: userInfo.id,
  username: userInfo.name,
  code: null,

});
const selectedTask = ref(null);
const expandedRows = ref([]);

const parentTasks = ref([]); // To hold the available parent tasks
const parentTasksOptions = ref([]); // To hold the available parent tasks



function buildNestedTasks(tasks) {
  const taskMap = new Map();

  // Step 1: Prepare task entries and add to the map
  tasks.forEach((task) => {
    taskMap.set(task.id, {
      value: task.id,
      label: task.name,
      children: [],
      startDate: task.startDate,
      endDate: task.endDate,
      progress: task.progress,
      status: task.status,
      time_spent: task.time_spent,
    });
  });

  const nestedTasks = [];

  // Step 2: Assign children based on parentTaskId
  tasks.forEach((task) => {
    const taskEntry = taskMap.get(task.id);
    if (task.parentTaskId) {
      const parentTask = taskMap.get(task.parentTaskId);
      if (parentTask) {
        parentTask.children.push(taskEntry); // Add to parent's children
      }
    } else {
      nestedTasks.push(taskEntry); // Add to top-level if no parent
    }
  });

  return nestedTasks;
}


// Fetch available parent tasks
const fetchParentTasks = async (id) => {
  try {
    // const response = await axios.get('/api/tasks'); // Assuming the API endpoint returns tasks
    const response = await getTasks({ 'project_id': id })
    //   tasks.value=response.data
    console.log('fetchParentTasks', response.data)
    parentTasks.value = response.data

    parentTasksOptions.value = buildNestedTasks(response.data);

    console.log('parentTasksOptions.value', parentTasksOptions.value)

    // parentTasks.value = response.data.filter(task => task.id); // Adjust this as per your API response
  } catch (error) {
    console.error('Failed to fetch parent tasks', error);
  }
};












const disableParent = ref(false)

const AddEditTask = async () => {
  disableParent.value = false
  taskForm.value.parentTaskId = null

  console.log('dialogVisible', dialogVisible.value)
  dialogVisible.value = true
  taskForm.value.project_id = projectFullData.value.id
  fetchParentTasks(projectFullData.value.id)

};

const AddSubTask = async (parent) => {
  // disableParent.value = true

  console.log('dialogVisible', dialogVisible.value)
  dialogVisible.value = true
  taskForm.value.project_id = projectFullData.value.id
  taskForm.value.parentTaskId = parent
  fetchParentTasks(projectFullData.value.id)

};



// Toggle row expansion for subtasks
const toggleRowExpansion = (row) => {
  const index = expandedRows.value.indexOf(row);
  if (index === -1) {
    expandedRows.value.push(row);
  } else {
    expandedRows.value.splice(index, 1);
  }
};

// Check if a row is expanded
const isRowExpanded = (row) => {
  return expandedRows.value.includes(row);
};

// Edit task (open dialog with task details)
const editTask = (task) => {
  selectedTask.value = task;
  taskForm.value.progress = task.progress;
  taskForm.value.status = task.status;
  dialogVisible.value = true;
};

// Submit the task update
const submitTask = async () => {

  console.log(taskForm.value)

  taskForm.value.code = shortid.generate()
  taskForm.value.model = 'project_task'

  try {
    //await axios.put(`/api/tasks/${selectedTask.value.id}`, taskForm);
    await addTask(taskForm.value)
    //fetchTasks(); // Refresh the tasks list
    dialogVisible.value = false; // Close the dialog
  } catch (error) {
    console.error('Failed to update task', error);
  }
};


// Recursive function to find the path for a given task ID
function findPathById(options, targetId, path = []) {
  for (const option of options) {
    //console.log('option>>',option, "ccc", targetId)
    const currentPath = [...path, option.value];

    // Check if this option matches the target ID
    if (option.value == targetId) {
      return currentPath;
    }

    // If children exist, search recursively
    if (option.children) {
      const result = findPathById(option.children, targetId, currentPath);
      if (result) return result;
    }
  }
  return null; // Return null if the path is not found
}

const hasChildren = ref(true)
// Check if a task has children by looking for it in the options array
const checkChildren = (taskId) => {
  const findTask = (options) => {
    for (const option of options) {

      console.log('option of options', option)
      if (option.value === taskId) {
        return option.children && option.children.length > 0;
      }
      if (option.children) {
        const result = findTask(option.children);
        if (result) return result;
      }
    }
    return false;
  };
  return findTask(parentTasksOptions.value);
};


// Edit task handler
const handleEdit = async (task) => {
  console.log('Edit task:', task);
  // Implement the logic to open the edit form/modal here
  taskForm.value.id = task.id;
  taskForm.value.project_id = task.project_id;
  taskForm.value.progress = task.progress;
  taskForm.value.name = task.name;
  taskForm.value.status = task.status;
  taskForm.value.startDate = task.startDate;
  taskForm.value.endDate = task.endDate;
  taskForm.value.parentTaskId = task.parentTaskId;
  dialogVisible.value = true;



  hasChildren.value = await checkChildren(task.id)

  console.log('hasChildren.value', hasChildren.value)



  fetchParentTasks(task.project_id)


  // Get the path to the parent task ID
  const path = findPathById(parentTasksOptions.value, task.parentTaskId);
  taskForm.value.parentTaskPath = path || []; // Set path or empty array if not found
  console.log('Edit task path:', path);

};




// Delete task handler
const handleDelete = async (row) => {
  if (!canUserDeleteTask(row)) {
    ElMessage({
      message: 'You do not have permission to delete this task. Only Super Admins, National Staff, or the County Admin who created this task can delete it.',
      type: 'warning',
      duration: 5000,
      showClose: true
    });
    return;
  }

  console.log('Delete task:', row);
  // You can prompt for confirmation and delete the record
  // Implement the actual delete logic here (e.g., API call)

  const formData = {}
  formData.model = 'project_task'
  formData.id = row.id

  await deleteTask(formData)

  // Check if it's a subtask (it has a parentTaskId)
  if (row.parentTaskId !== null) {
    // Find the parent task that contains this subtask
    const parentTask = tasks.value.find(task => task.id === row.parentTaskId);

    if (parentTask && parentTask.Subtasks) {
      // Filter out the specific subtask from the parent's subtasks array
      parentTask.Subtasks = parentTask.Subtasks.filter(subtask => subtask.id !== row.id);
      console.log(`Subtask ${row.id} removed from Parent Task ${parentTask.id}`);
    }
  } else {
    // If it's a parent task, delete the parent task entirely
    tasks.value = tasks.value.filter(task => task.id !== row.id);
    console.log(`Parent Task ${row.id} and its subtasks removed`);
  }

};

const generateNewId = () => {
  const ids = tasks.value.flatMap(task => [task.id, ...task.subtasks.map(subtask => subtask.id)]);
  return Math.max(...ids) + 1;
};

const handleClone = (row) => {
  console.log('Cloning task or subtask:', row);

  // Create a new task or subtask with a unique id
  const newId = generateNewId();
  const clonedItem = { ...row, id: newId, name: `${row.name} (Cloned)` };

  // Check if it's a subtask
  if (row.parentTaskId !== null) {
    // Find the parent task and add the cloned subtask
    const parentTask = tasks.value.find(task => task.id === row.parentTaskId);
    if (parentTask && parentTask.Subtasks) {
      parentTask.Subtasks.push(clonedItem);
      console.log(`Subtask ${row.id} cloned to Subtask ${newId}`);
    }
  } else {
    // It's a parent task, so add the cloned task to the main tasks array
    clonedItem.Subtasks = clonedItem.Subtasks.map(subtask => ({
      ...subtask,
      id: generateNewId(),
      parentTaskId: newId,
      name: `${subtask.name} (Cloned)`
    }));
    tasks.value.push(clonedItem);
    console.log(`Parent Task ${row.id} cloned to Parent Task ${newId}`);
  }

  console.log('Updated tasks:', tasks.value);
};

const uploadDialog = ref(false)
const field_set = ref([])

const uploadData = async () => {
  uploadDialog.value = true
  console.log('Uploading data.......')
  var formData = {}
  formData.model = 'project_task'
  await getModelSpecs(formData).then((response) => {
    console.log(response.data)
    field_set.value = response.data
  })

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


    // Assuming 'latitude' and 'longitude' are the keys for lat/lon
    if (newItem.latitude && newItem.longitude) {
      newItem.geom = {
        type: "Point",  // You can adjust the type if necessary
        coordinates: [newItem.longitude, newItem.latitude]  // Note: GeoJSON uses [lon, lat]
      };
    }

    return newItem;
  });
}

const ImportProjectTasks = async () => {

  //console.log('deleted_locations',deleted_locations)
  var form = {}
  form.model = 'project_task'

  const dta = convertStringArraysToProperArrays(parsedData.value)
  console.log('dta', dta)


  form.data = dta
  console.log('formData', form)

  const results = await batchImport(form)

  console.log('batchImport', results.insertedDocuments)



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
      //  ImportProjects()
      ImportProjectTasks()
    },
    error: (error) => {
      console.error('Error parsing CSV:', error);
    },
  });
}


const handleDownload = async () => {

  const data = field_set.value
  const fileName = 'task_template'
  const exportType = exportFromJSON.types.csv
  if (data) exportFromJSON({ data, fileName, exportType })
}

const activeName = ref('details')

const DeleteProject = async (id) => {
  const project = projectFullData.value;
  if (!canUserDeleteProject(project)) {
    ElMessage({
      message: 'You do not have permission to delete this project. Only Super Admins, National Staff, or the County Admin who created this project can delete it.',
      type: 'warning',
      duration: 5000,
      showClose: true
    });
    return;
  }

  let formData = {};
  formData.id = id;
  formData.model = 'project';

  try {
    await DeleteRecord(formData);

    // Delete documents only if there are any documents to delete
    if (projectDocuments.value.length > 0) {
      formData.filesToDelete = projectDocuments.value;
      await deleteDocument(formData);
    }

    ElMessage({
      message: 'Project deleted successfully!',
      type: 'success',
      duration: 3000,
    });

    goBack();
  } catch (error) {
    ElMessage({
      message: 'Failed to delete the project. Please try again.',
      type: 'error',
      duration: 3000,
    });
  }
};

const items = [
  {
    title: 'A. PRELIMINARIES',
    icon: 'ic:baseline-plus',
    children: [
      { title: 'Site Handover', icon: 'vscode-icons:file-type-typescript' },
      { title: 'Mobilisation', icon: 'vscode-icons:file-type-typescript' },
      { title: 'Site Establishment - Hoarding, site office, site storage etc', icon: 'vscode-icons:file-type-typescript' },


    ],
  },
  {
    title: 'B. RELOCATION OF EXISTING SEWERLINE',
    children: [
      {
        title: 'Home',
        icon: 'lucide:folder',
        children: [
          { title: 'Card.vue', icon: 'vscode-icons:file-type-vue' },
          { title: 'Button.vue', icon: 'vscode-icons:file-type-vue' },
        ],
      },
    ],
  },
  {


    title: 'C. MARKET BUILDING',
    children: [
      {
        title: 'Concrete Works',
        icon: 'lucide:folder',
        children: [
          { title: 'Basement 2 Slab', icon: 'vscode-icons:file-type-vue' },
          { title: 'Columns', icon: 'vscode-icons:file-type-vue' },
        ],
      },
    ],
  },
  { title: 'app.vue', icon: 'vscode-icons:file-type-vue' },
  { title: 'nuxt.config.ts', icon: 'vscode-icons:file-type-nuxt' },
]



const handleChange = (value) => {
  console.log(value)
  taskForm.value.parentTaskId = value[value.length - 1]; // Only store the last item
  console.log('Last selected value:', taskForm.value.parentTaskId);


}

const props1 = {
  checkStrictly: true,
}


const onClose = () => {
  console.log('Dialog closed');
  // Clear or reset the form when the dialog is closed

  hasChildren.value = true
  dialogVisible.value = false
};



// Method to validate progress and ensure it stays within the range
const validateProgress = () => {
  if (taskForm.value.progress < 0) {
    taskForm.value.progress = 0;
  } else if (taskForm.value.progress > 100) {
    taskForm.value.progress = 100;
  }
};


const tableRowClassName = (data) => {

  if (data.row.status == 'Rejected') {
    return 'danger-row'
  }
  if (data.row.status == 'Approved') {
    return 'success-row'
  }

  return ''
}

function formatDate(dateString) {
  const dateObj = new Date(dateString);
  const year = dateObj.getUTCFullYear();
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


function getQuarter(date = new Date()) {
  return Math.floor(date.getMonth() / 3 + 1);
}
/// here to File a report (m&E)

const ReportRuleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  //indicator_category_id: null,
  indicator_category_id: [],
  indicators: [],
  baseline: 0,
  target: 0,
  project_id: route.params.id,
  project_location_id: null,
  activity_id: null,
  programme_implementation_id: null,
  settlement_id: null,
  subcounty_id: null,
  ward_id: null,
  county_id: null,
  region_id: null,
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
  qualitative: '',
  cumUnits: 'Cumulative(qty)'
})

const ReportRules = reactive<FormRules>({
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


})




const changeIndicator = async (indicator_category_id: any) => {
  ruleForm.indicator_category_id = indicator_category_id

  console.log('Filtre indicatorsOptionsFiltered', indicatorsOptionsFiltered)

  var filtredOptions = indicatorsOptionsFiltered.value.filter(function (el) {
    return el.value == indicator_category_id
  });


  // ruleForm.project_id = filtredOptions[0].project_id
  ruleForm.activity_id = filtredOptions[0].activity_id



  console.log("Filtered Indicators", filtredOptions[0])
  ruleForm.units = "Quantity(" + filtredOptions[0].unit + ")"
  ruleForm.cumUnits = "Cumulative(" + filtredOptions[0].unit + ")"

  ruleForm.baseline = filtredOptions[0].baseline
  //ruleForm.target = filtredOptions[0].target

  //ruleForm.indicator_category_title = filtredOptions[0].category_title

  getCumulativeProgress(indicator_category_id)
}


const activeStep = ref(0)

const nextStep = async () => {
  console.log(ruleFormRef.value)
  await ReportRuleFormRef.value?.validate((valid) => {
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





const firstReport = ref(true)

const getCumulativeProgress = async () => {

  var filters = ['userId', 'indicator_category_id', 'county_id', 'subcounty_id', 'ward_id', 'project_id',
  ]

  var filterValues = [[userInfo.id], [ruleForm.indicator_category_id], [ruleForm.county_id], [ruleForm.subcounty_id], [ruleForm.ward_id],
  [ruleForm.project_id]]  // remember to change here!

  console.log(ruleForm.value)




  console.log('filters', filters)
  console.log('filterValues', filterValues)
  const formData = {}
  formData.limit = 100
  formData.page = 1
  formData.curUser = 1 // Id for logged in user
  formData.model = 'indicator_category_report'
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  formData.assocModel = []

  // - multiple filters -------------------------------------
  formData.filters = filters
  formData.filterValues = filterValues
  formData.associated_multiple_models = []

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
  ruleForm.cumAmount = parseFloat(objectWithLatestDate.cumAmount)
  ruleForm.cumProgress = parseFloat(objectWithLatestDate.cumProgress)
  ruleForm.prevAmount = parseFloat(objectWithLatestDate.amount)

  ruleForm.target = parseFloat(objectWithLatestDate.target)

  console.log('cumProgress ats tart', ruleForm);

}





const fileUploadList = ref<UploadUserFile[]>([])

// Function to empty all fields in ruleForm
function emptyRuleForm() {
  for (const key in ruleForm) {
    ruleForm[key] = null;
  }
}

 

const disableIndicator = ref(false)

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
        project_id: project_id.value,
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
        programme_implementation_id: programme_implementation_id.value,
        settlement_id: ruleForm.settlement_id,
        county_id: ruleForm.county_id,
        subcounty_id: ruleForm.subcounty_id,
        ward_id: ruleForm.ward_id,
        activity_id: indicator.activity_id,
        qualitative: indicator.qualitative,
        geom: ruleForm.geom,
  
 
      };

      console.log('reportPayload>>',reportPayload)

      // Submit individual indicator report
      const report = await CreateRecord(reportPayload);
      //console.log(`Report created for indicator ${indicator.label}: ID ${report.data.id} :${report.data}`);

 
      submittedReportIds.push(report.data.id);
       console.log('After push:', indicatorReports.value);
 
       
    }

    // Upload files for each created report
    if (submittedReportIds.length && fileUploadList.value.length) {
      for (const reportId of submittedReportIds) {
        const formData = new FormData();

        fileUploadList.value.forEach((file) => {
          formData.append('files', file.raw);
          formData.append('format', file.name.split('.').pop());
          formData.append('field_id', 'report_id');
          formData.append('category', 56);   // 56 is montiroing reports
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


    AddDialogVisible.value = false;
    handleClose();


  //  emptyRuleForm();
 

  });


 
};



const DeleteProjectLocation = (data) => {
  if (!canUserDeleteProjectLocation(data.row)) {
    ElMessage({
      message: 'You do not have permission to delete this project location. Only Super Admins, National Staff, or the County Admin who created this location can delete it.',
      type: 'warning',
      duration: 5000,
      showClose: true
    });
    return;
  }

  console.log('----->', data)
  let formData = {}
  formData.id = data.row.id
  formData.model = 'project_location'

  DeleteRecord(formData)


  // remove the deleted object from array list 
  let index = projectLocations.value.indexOf(data.row);
  if (index !== -1) {
    projectLocations.value.splice(index, 1);
  }

}

// const locationOptions = ref([])
// const loading = ref(false)



 
const loading = ref(false)
const locationOptions = ref([])
const firstLoad = ref(true)

const remoteMethod = async (keyword) => {
  loading.value = true
  let model = implementation_scope.value

  // Dynamically assign associated models
  const associatedModels = model === 'settlement'
    ? ['county', 'subcounty', 'ward']
    : model === 'subcounty'
      ? ['county']
      : model === 'ward'
        ? ['subcounty', 'county']
        : []

  const formData = {
    model: model,
    searchField: 'name',
    searchKeyword: firstLoad.value ? '' : keyword, // only empty search on first load
    excludeGeom: false,
    excludeGeomAssoc: true,
    associated_multiple_models: associatedModels,
    filters: [],
    filterValues: [],
    limit: 50, // Limit to first 10 records
    offset: 0
  }

  try {
    const res = await searchByKeyWord(formData)

    if (res.data && res.data.length > 0) {
      locationOptions.value = res.data.map(item => {
        const base = {
          value: item.id,
          label: item.name,
          name: item.name,
          geom: item.geom,
          implementer:programme_implementation_id.value
        }

        if (model === 'settlement') {
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
        } else if (model === 'subcounty') {
          return {
            ...base,
            county: item.county?.name,
            county_id: item.county?.id
          }
        } else if (model === 'ward') {
          return {
            ...base,
            subcounty: item.subcounty?.name,
            county: item.county?.name,
            subcounty_id: item.subcounty?.id,
            county_id: item.county?.id
          }
        } else {
          return base
        }
      })
    }

    firstLoad.value = false // Disable first load flag after first run
    
  } catch (error) {
    console.error("Search error:", error)
  }

  loading.value = false
}


const extra_locations = ref([])


const SaveLocation = async () => {
  var form = {};
  form.model = 'project_location';

  console.log('project_id', project_id.value);
  console.log('locations', extra_locations.value);

  const location_objects = [];

  // Loop through each extra location to build location objects
  for (let i = 0; i < extra_locations.value.length; i++) {
    console.log(extra_locations.value[i]);

    let obj = {};
    obj.project_id = project_id.value;
    obj.implementer = extra_locations.value[i].implementer;
    
    // Check if the location is for settlement, county, subcounty, or ward and assign accordingly
    if (implementation_scope.value == 'settlement') {
      obj.settlement_id = extra_locations.value[i].value;
      obj.ward_id = extra_locations.value[i].ward_id;
      obj.subcounty_id = extra_locations.value[i].subcounty_id;
      obj.county_id = extra_locations.value[i].county_id;
      obj.location_type = 'settlement';
      obj.location_name = extra_locations.value[i].name;
      obj.geom = extra_locations.value[i].geom;
   

      
    } else if (implementation_scope.value == 'county') {
      // If it's a county, only include county_id
      obj.county_id = extra_locations.value[i].value;
      obj.location_type = 'county';
      obj.location_name = extra_locations.value[i].name;
      obj.geom = extra_locations.value[i].geom;
    } else if (implementation_scope.value == 'subcounty') {      // If it's a subcounty, only include subcounty_id and related county
      obj.subcounty_id = extra_locations.value[i].value;
      obj.county_id = extra_locations.value[i].county_id; // Ensure county_id is linked
      obj.location_type = 'subcounty';
      obj.location_name = extra_locations.value[i].name;
      obj.geom = extra_locations.value[i].geom;
    } else if (implementation_scope.value == 'ward') {
      // If it's a ward, only include ward_id and related subcounty, county
      obj.ward_id = extra_locations.value[i].value;
      obj.subcounty_id = extra_locations.value[i].subcounty_id; // Ensure subcounty_id is linked
      obj.county_id = extra_locations.value[i].county_id; // Ensure county_id is linked

      obj.location_type = 'ward';
      obj.location_name = extra_locations.value[i].name;
      obj.geom = extra_locations.value[i].geom;
    }

    location_objects.push(obj);
    console.log('obj', obj);
  }

  form.data = location_objects;
  console.log('formData', form);

  // Call BatchImportUpsert function to process the data
  const loc_res = await BatchImportUpsert(form);
  console.log('loc_res', loc_res);

  // After processing, update locations and reset the selection options
  await getLocations(project_id.value, locationCurrentPage.value, locationPageSize.value);

  // Empty the locations and reset other states
  extra_locations.value = [];
  locationOptions.value = [];
};



const dialogMap = ref(false)





const openMapDialog = async (data) => {
  projectGeom.value = null
  console.log(data)

  const projLocFormData = {}
  projLocFormData.model = 'project_location'
  projLocFormData.id = data.row.id
  projLocFormData.assocModel='ward'
 
  const res = await getOneSettlement(projLocFormData)

     console.log(res.data)

 // const proj_geom = prj_res.data[0].json_build_object
  //var proj_centroid = turf.centroid(res.data.geom);
 // console.log('centroid', proj_centroid)
  projectGeom.value = res.data

  console.log('  projectGeom.value', projectGeom.value)

  // Check if res.data.geom is null, and if so, fall back to res.data.ward.geom
if (!res.data.geom) {
  projectGeom.value.geom = res.data.ward.geom;
}


  dialogMap.value = true




  setTimeout(loadMap, 100); // delay for the dialog to fully load
  //loadMap()
}



const draw = new MapboxDraw({
  displayControlsDefault: false,
  controls: {
    point: true,
    line_string: true,
    polygon: true,
    trash: true
  },

})

 
const handleSaveClick = async () => { 

 
  projectGeom.value.model = 'project_location'
  console.log(projectGeom.value)

 updateOneRecord(projectGeom.value)
}
 


function addHomeButton(map) {
  class HomeButton {
    onAdd(map) {
      const div = document.createElement("div");
      div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
      div.id = "save-button";

      // Use a nice outlined save icon (Heroicons style)
      div.innerHTML = `
        <button style="background: none; border: none; padding: 6px; cursor: pointer;" title="Save Location">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        </button>
      `;


    


      div.addEventListener("contextmenu", (e) => e.preventDefault());
      div.addEventListener("click", () => {
        handleSaveClick(); // Call your function
      });

      return div;
    }
  }

  const homeButton = new HomeButton();
  map.addControl(homeButton, "bottom-left");
}




const loadMap = () => {

  let centroid = turf.centroid(projectGeom.value.geom)
  console.log(centroid.geometry.coordinates)
  
  var mapCenter = centroid.geometry.coordinates;

  var nmap = new mapboxgl.Map({
    container: "mapContainer",
    style: "mapbox://styles/mapbox/streets-v12",
    center: mapCenter, // starting position
    zoom: 12,
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

    // Function to determine the geometry type and add corresponding layers
    const addLayerBasedOnGeometry = (nmap, projectGeom) => {
      // Check the geometry type
      console.log('projectGeom.value.geom',projectGeom.value.geom)
      const geometryType = projectGeom.value.geom?.type;
      console.log('geometryType', geometryType)

      if (geometryType) {
        // Add point layer if geometry is a point
        if (geometryType === 'Point') {
          nmap.addLayer({
            id: 'point-layer',
            type: 'circle',
            source: {
              type: 'geojson',
              data: projectGeom.value.geom,
            },
            paint: {
              'circle-color': 'red',
              'circle-radius': 6,
            },
            filter: ['==', '$type', 'Point'],
          });


            // Create a new popup
            const coords = projectGeom.value.geom.coordinates;
                const lat = coords[1].toFixed(5);
                const lng = coords[0].toFixed(5);

                const project_popup = new mapboxgl.Popup({ offset: 25 })
                  .setHTML(`<h3>Project Location</h3><p> (${lat}, ${lng})</p>`);



            // Add marker to the map
            // Create a new marker and set its position
            const proj_marker = new mapboxgl.Marker()
              .setLngLat(projectGeom.value.geom.coordinates) // Set the marker position using the GeoJSON coordinates
              .addTo(nmap); // Add the marker to the map

        // Attach the popup to the marker
        proj_marker.setPopup(project_popup).togglePopup(); // Automatically open the popup when the marker is added to the map



        }

        // Add polygon layer as outline if geometry is a polygon or multipolygon
        if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
          nmap.addLayer({
            id: 'polygon-layer',
            type: 'line', // Display as line for the polygon outline
            source: {
              type: 'geojson',
              data: projectGeom.value.geom,
            },
            paint: {
              'line-color': 'red', // Outline color
              'line-width': 2, // Outline width
            },
            filter: ['in', '$type', 'Polygon' ], // Include Polygon and MultiPolygon
          });


           // Fit map to bounds of the FeatureCollection
              const bounds = turf.bbox(projectGeom.value.geom); // [minX, minY, maxX, maxY]
              nmap.fitBounds(bounds, {
                padding: 40,
                animate: true,
              });


        }

        // Add line layer if geometry is a LineString or MultiLineString
        if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
          nmap.addLayer({
            id: 'line-layer',
            type: 'line',
            source: {
              type: 'geojson',
              data: projectGeom.value.geom,
            },
            paint: {
              'line-color': 'red', // Line color
              'line-width': 3, // Line width
            },
            filter: ['in', '$type', 'LineString'], // Include LineString (you can omit this if you're using a pure LineString GeoJSON)
          });

          // Fit map to bounds of the line
          const bounds = turf.bbox(projectGeom.value.geom); // [minX, minY, maxX, maxY]
          nmap.fitBounds(bounds, {
            padding: 40,
            animate: true,
          });
        }



        // Add project location layer (also point layer as in your initial code)
        if (geometryType === 'Point') {
          nmap.addLayer({
            id: 'project-layer',
            type: 'circle',
            source: {
              type: 'geojson',
              data: projectGeom.value.geom,
            },
            paint: {
              'circle-color': 'blue', // Change the color for project layer
              'circle-radius': 8, // Slightly larger radius for project location
            },
            filter: ['==', '$type', 'Point'],
          });
        }
      }
    };

    // Example usage (ensure 'nmap' and 'projectGeom' are properly defined)
    addLayerBasedOnGeometry(nmap, projectGeom);


  
  
   



    console.log(nmap)

    nmap.addControl(new MapboxLayerSwitcherControl(layers));

    const nav = new mapboxgl.NavigationControl();
    nmap.addControl(nav, "top-left");
    nmap.addControl(draw, 'top-left');




    nmap.resize();







  });




  
  function updateRuleform(feature) {
    // do something with the new marker feature
    var crs = { type: 'name', properties: { name: 'EPSG:4326' } }
    feature.geometry.crs = crs
    console.log('----feature', feature);



    projectGeom.value.geom = feature.geometry
    console.log(projectGeom.value)
 
  

  }

  // listen for the draw.create event
  nmap.on('draw.create', function (e) {
    // check if the new feature is a marker
    // if (e.features[0].geometry.type === 'Polygon') {
    // trigger your function here
    updateRuleform(e.features[0]);

    //  }
  });


  // listen for the draw.se event
  nmap.on('draw.update', function (e) {
    // check if the new feature is a marker
    //if (e.features[0].geometry.type === 'Polygon') {
    // trigger your function here
    updateRuleform(e.features[0]);

    // }
  });

  // Listen for the draw.delete event
  nmap.on('draw.delete', function (event) {
    // Get the IDs of the deleted features
    var deletedFeatureIds = event.features.map(function (feature) {
      return feature.id;
    });

    // Remove the corresponding layers from the map
    deletedFeatureIds.forEach(function (id) {
      nmap.removeLayer(id);
    });


     




  });

 



  

  addHomeButton(nmap)



};





const closeMap = () => {

  dialogMap.value = false
}

const loadAllLocationsMap = (featureCollection) => {
  const centroid = turf.centroid(featureCollection);
  const mapCenter = centroid.geometry.coordinates;

  const nmap = new mapboxgl.Map({
    container: "mapContainerAll",
    style: "mapbox://styles/mapbox/streets-v12",
    center: mapCenter,
    zoom: 5,
  });

  nmap.on("load", () => {
    // Add base layers
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

    // Add FeatureCollection as a source
    nmap.addSource("project-data", {
      type: "geojson",
      data: featureCollection,
    });

    // Add layers for each feature type

    // Points layer
    nmap.addLayer({
      id: 'points',
      type: 'circle',
      source: 'project-data',
      paint: {
        'circle-color': 'red',
        'circle-radius': 6,
      },
      filter: ['==', '$type', 'Point'],
    });

    // Polygons layer (fill and outline)
    nmap.addLayer({
      id: 'polygons-fill',
      type: 'fill',
      source: 'project-data',
      paint: {
        'fill-color': 'rgba(0, 0, 255, 0.01)', // More transparent fill
        'fill-outline-color': 'red', // Outline color
      },
      filter: ['==', '$type', 'Polygon'],
    });

    nmap.addLayer({
      id: 'polygons-outline',
      type: 'line',
      source: 'project-data',
      paint: {
        'line-color': 'red',
        'line-width': 2,
      },
      filter: ['==', '$type', 'Polygon'],
    });

    // Fit map to bounds of the FeatureCollection
    const bounds = turf.bbox(featureCollection); // [minX, minY, maxX, maxY]
    nmap.fitBounds(bounds, {
      padding: 40,
      animate: true,
    });

    // Add controls
    nmap.addControl(new mapboxgl.NavigationControl(), "top-left");
    nmap.resize();
  });

  // Handle click events for different layers
  nmap.on('click', 'points', (e) => {
    const feature = e.features[0];
    //const coordinates = feature.geometry.coordinates.slice();

    const centroid = turf.centroid(feature);
    const coordinates = centroid.geometry.coordinates;
    console.log('coordinates', coordinates)

    const properties = feature.properties;

    let popupContent = `<h4>Location Details</h4>`;
    popupContent += `<strong>Location:</strong> ${properties['location_name']}, ${properties['location_type']} `;



    new mapboxgl.Popup({ offset: 25 })
      .setLngLat(coordinates)
      .setHTML(popupContent)
      .addTo(nmap);
  });

  nmap.on('click', 'polygons-fill', (e) => {
    const feature = e.features[0];
    // const coordinates = feature.geometry.coordinates[0]; // Polygons have an array of coordinates
    const properties = feature.properties;


    const centroid = turf.centroid(feature);
    const coordinates = centroid.geometry.coordinates;
    console.log('coordinates', coordinates)


    let popupContent = `<strong><h4>Location Details</h4></strong>`;
    popupContent += `<li><strong>Location:</strong> ${properties['location_name']}, ${properties['location_type']} </li>`;


    new mapboxgl.Popup({ offset: 25 })
      .setLngLat(coordinates) // Set popup at the first coordinate of the polygon
      .setHTML(popupContent)
      .addTo(nmap);
  });


  // Remove the popup when mouse leaves the feature
  nmap.on('mouseleave', 'points', (e) => {
    if (e.target.popup) e.target.popup.remove();
  });

  nmap.on('mouseleave', 'polygons-fill', (e) => {
    if (e.target.popup) e.target.popup.remove();
  });



  function addInfo(map) {
    class LayerButton {
      onAdd(map) {
        const div = document.createElement("div");
        div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
        div.innerHTML = icon.value;
        div.addEventListener("contextmenu", (e) => e.preventDefault());
        div.addEventListener("click", () => toggleFloatingDiv(nmap));

        return div;
      }
    }
    const lryButton = new LayerButton();
    nmap.addControl(lryButton, "top-right");
  }
  addInfo(nmap)

};


function disabledFutureDates(date) {
  const today = new Date();
  return date.getTime() > today.getTime(); // Disable dates after today
}


const getSummaries = (param) => {
  const { columns, data } = param;
  const sums = [];

  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = 'Total';
      return;
    }

    if (column.property === 'amount') {
      const total = data.reduce((sum, row) => {
        const value = Number(row[column.property]);
        return isNaN(value) ? sum : sum + value;
      }, 0);
      sums[index] = total.toLocaleString(); // Or format however you like
    } else {
      sums[index] = '';
    }
  });

  return sums;
};


const changeLocation = async (location: any) => {
  console.log('changeLocation', location)

  const selected_location = projectLocations.value.find(
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


  console.log('ruleForm.indicators',ruleForm.indicators)
}


const handleCancel = () => {
  disableIndicator.value = false
  AddDialogVisible.value = false
}



const handleClose = () => {

console.log("Closing the dialoig")
// showSubmitBtn.value = true
// //showEditSaveButton.value = false
// ruleForm.indicator_category_id = []
// ruleForm.date = null
// ruleForm.amount = null
// ruleForm.ward_id = null
// ruleForm.location = []
// ruleForm.indicators = []

// // /formHeader.value = 'Add M&E Report'
AddDialogVisible.value = false

}


function formatLocation(item) {
  if (item.settlement) {
    return [
      item.ward?.name,
      item.subcounty?.name,
      item.county?.name
    ].filter(Boolean).join(', ')
  } 
  else if (item.ward) {
    return [
      item.subcounty?.name,
      item.county?.name
    ].filter(Boolean).join(', ')
  } else if (item.subcounty) {
    return item.county?.name || ''
  } else {
    return '' // For county or if everything's missing
  }
}

</script>

<template>
  <el-card v-loading="isLoading">
    <!-- Header Section -->
    <template #header>
      <div class="card-header">
        <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
          Back
        </el-button>

        <el-text tag="b" size="large"> {{ project_title }} </el-text>
      </div>
    </template>

    <el-tabs v-model="activeName" type="border-card" class="demo-tabs" tab-position="top" @tab-click="handleTabClick">
      <el-tab-pane label="Project Details" name="details">

        <el-card>
          <el-descriptions title="Project Information" border>
            <template #extra>
              <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                <el-button type="primary" :icon="Edit" plain @click="editProject">
                  Edit Project
                </el-button>

                <el-popconfirm
                  v-if="canUserDeleteProject(projectFullData)"
                  width="300" title="Are you sure to delete this project?"
                  @confirm="DeleteProject(projectFullData.id)">
                  <template #reference>
                    <el-button type="danger" plain>
                      <Icon icon="material-symbols:delete" style="margin-right: 5px;" />
                      Delete Project
                    </el-button>
                  </template>
                </el-popconfirm>
              </div>
            </template>

            <el-descriptions-item
v-for="item in projectDescription" :key="item.property"
              :label="formatSentence(item.property)">
              {{ formatSentence(item.value) }}
            </el-descriptions-item>
          </el-descriptions>

        </el-card>

      </el-tab-pane>

      <el-tab-pane v-if="implementation_scope != 'national'" label="Locations" name="Locations">
        <el-button :onClick="AddLocation" style="margin-left :5px;margin-bottom :5px; " plain>
          <Icon icon="material-symbols:add" style=" color: green" size="52" /> Add Location
        </el-button>


        <el-table :data="paginatedProjectLocations" border>
          <el-table-column label="#" width="70">
            <template #default="{ $index }">
              {{ rowNumber($index, locationCurrentPage, locationPageSize) }}
            </template>
          </el-table-column>

          <el-table-column label="County" prop="county.name" />
          <el-table-column label="Subcounty" prop="subcounty.name" />
          <el-table-column label="Ward" prop="ward.name" />
          <el-table-column label="Settlement" prop="settlement.name" />

          <el-table-column label="Actions" width="280">
            <template #default="scope">
              <el-button size="small" :icon="Position" @click="openMapDialog(scope)" type="primary" plain>
                Edit Location 
              </el-button>

              <el-button 
                v-if="canUserDeleteProjectLocation(scope.row)"
                size="small" type="danger" :icon="Delete" @click="DeleteProjectLocation(scope)" plain>
                Delete
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <ElPagination
          v-if="projectLocations && projectLocations.length"
          layout="sizes, prev, pager, next, total"
          v-model:currentPage="locationCurrentPage"
          v-model:page-size="locationPageSize"
          :page-sizes="[5, 10, 20, 50, 100]"
          :total="projectLocationsTotal"
          :background="true"
          class="mt-3"
          @size-change="handleLocationSizeChange"
          @current-change="handleLocationPageChange"
        />

   
        <el-dialog
v-model="ShowLocationAddDialog" title="Add Project Location" width="500"
          :before-close="handleCloseAdd">
          <el-select
id="location-select" v-model="extra_locations" multiple filterable remote reserve-keyword
            :loading="loading" :placeholder="'Search '+ implementation_scope" :remote-method="remoteMethod" style="width: 85%">
            <el-option v-for="item in locationOptions" :key="item.id" :label="item.label" :value="item">
              <div style="display: flex; align-items: center;">
                <span style="flex: 1; text-align: left;">{{ item.label }}</span>
                <span style="flex: 2; color: var(--el-text-color-secondary); font-size: 13px; text-align: right;">
                  {{ item.ward ? item.ward + ', ' : '' }}{{ item.subcounty ? item.subcounty + ', ' : '' }}{{ item.county
                  }}
                </span>
              </div>
            </el-option>
          </el-select>
          <el-tooltip content="Save" placement="top">
            <el-button :onClick="SaveLocation" style="margin-left :10px;" type="primary">
              <Icon icon="ic:round-save" style=" color: white" size="48" />
            </el-button>
          </el-tooltip>
        </el-dialog>



        <el-dialog v-model="dialogMap" width="50%" draggable :before-close="closeMap" :show-close="false">
          <template #header="{ titleId, titleClass }">
            <div class="my-header">
              <h4 :id="titleId" :class="titleClass">Project Location</h4>
              <h2 :style="`color: green; font-style: italic;`">{{ locationStatus }}</h2>
              <!-- Use the 'italicizedColor' variable -->
              <el-button type="danger" :icon="CircleCloseFilled" @click="closeMap">Close Map</el-button>
            </div>
          </template>
          <div id="mapContainer" class="basemap"></div>

        </el-dialog>


      </el-tab-pane>




      <el-tab-pane v-if="implementation_scope != 'national' && projectLocations.length > 0" label="Map" name="map">
        <div id="mapContainerAll" class="basemap"></div>
      </el-tab-pane>



      <el-tab-pane label="Scope" name="Scope">
        <el-card>
          <div style="display: flex; align-items: center; gap: 16px; margin-left: 5px; margin-bottom: 10px;">
            <el-button :onClick="updateChanges" type="success" plain>
              <Icon icon="ic:round-save" style="color: green; margin-right: 5px;" size="24" />
              Save Changes
            </el-button>

           </div>

          <el-divider />

          <el-row :gutter="10">
            <el-col v-for="(activity) in activityOptions" :key="activity.id" :sm="24" :md="24" :lg="24" :xl="12">
              <el-checkbox
v-model="projectScopeChecked" :label="activity.id" @change="toggleActivity()"
                style="max-width: 100%;">
                <span
                  style="display: inline-block; max-width: 100%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;"
                  :title="activity.title">
                  {{ activity.title }}
                </span>
              </el-checkbox>
            </el-col>
          </el-row>
        </el-card>
      </el-tab-pane>



      <el-tab-pane v-if="projectLocations.length > 0" label="Monitoring" name="Indicator">
        <el-card>

          <el-button :onClick="AddReport" style="margin-left :5px;margin-bottom :5px; " plain>
            <Icon icon="material-symbols:add" style=" color: green" size="52" /> Add Report/Achievement
          </el-button>

          <el-table :data="indicatorReports" border :row-class-name="tableRowClassName" ref="tableRef">
            <el-table-column label="#" width="80" prop="id" sortable>
              <template #default="scope">
                <div v-if="scope.row.documents.length > 0" style="display: inline-flex; align-items: center;">
                  <span>{{ scope.row.id }}</span>
                  <Icon icon="material-symbols:attachment" style="margin-left: 4px;" />
                </div>
              </template>
            </el-table-column>
            <el-table-column label="Indicator  " width="400" sortable>
              <template #default="{ row }">
                <div>
                  <span> {{ row.indicator_category.indicator_name }} {{ row.indicator_category.category_title }} </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="Date" prop="date" sortable>
              <template #default="scope">
                {{ formatDate(scope.row.date) }}
              </template>
            </el-table-column>
            <!-- <el-table-column label="Amount" prop="amount" sortable /> -->

         
        <el-table-column label="Qty/Status" sortable>
            <template #default="{ row }">
              <span v-if="row.qualitative !== null">
                {{ row.qualitative === 'Yes' ? 'Yes' : 'No' }}
              </span>
              <span v-else>
                {{ row.amount }}
              </span>
            </template>
          </el-table-column>



            <el-table-column label="Amount (cumulutaive)" prop="cumAmount" sortable />
            <el-table-column label="Status" prop="status" sortable>
              <template #default="scope">
                <div v-if="scope.row.status === 'Rejected'">
                  <el-tooltip :content="'Reason for rejection: ' + scope.row.reject_msg" placement="top">
                    <span>{{ scope.row.status }}</span>
                  </el-tooltip>
                </div>
                <div v-else>
                  <span>{{ scope.row.status }}</span>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="Documentation" name="documents">
        <el-card>
          <el-table :data="paginatedProjectDocuments" style="width: 100%">
            <el-table-column label="#" width="70">
              <template #default="{ $index }">
                {{ rowNumber($index, docsCurrentPage, docsPageSize) }}
              </template>
            </el-table-column>
            <el-table-column prop="name" label="Name" />
            <el-table-column prop="type" label="Type" />
            <el-table-column prop="createdAt" label="Uploaded" />
            <el-table-column label="Size (MB)">
              <template #default="{ row }">
                {{
                  row.size
                    ? Number(row.size).toFixed(2)
                    : (row.raw?.size ? (row.raw.size / 1024 / 1024).toFixed(2) : '—')
                }}
              </template>
            </el-table-column>
            <el-table-column fixed="right" label="">
              <template #default="scope">
                <el-button
                  plain
                  :loading="downloadingDocId === scope.row.id"
                  :disabled="downloadingDocId === scope.row.id"
                  @click="downloadFile(scope.row)"
                >
                  <Icon icon="fa-solid:download" style="  margin-right: 5px;" />
                  <span v-if="downloadingDocId === scope.row.id">Downloading…</span>
                  <span v-else>Download</span>
                </el-button>
              </template>
            </el-table-column>
            <el-table-column fixed="right" label="">
              <template #default="scope">
                <el-button 
                  v-if="canUserDeleteDocument(scope.row)"
                  plain type="danger" @click="RemoveDocument(scope.row)">
                  <Icon icon="material-symbols-light:delete-outline" style="  margin-right: 5px;" />
                  Remove
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <ElPagination
            v-if="projectDocuments && projectDocuments.length"
            layout="sizes, prev, pager, next, total"
            v-model:currentPage="docsCurrentPage"
            v-model:page-size="docsPageSize"
            :page-sizes="[5, 10, 20, 50, 100]"
            :total="projectDocumentsTotal"
            :background="true"
            class="mt-3"
            @size-change="handleDocsSizeChange"
            @current-change="handleDocsPageChange"
          />
          <el-button plain @click="toggleComponent(Project)" style=" margin-top:10px">
            <Icon icon="fa-solid:upload" style=" margin-right:10px" />
            Upload
          </el-button>
        </el-card>

      </el-tab-pane>


      <el-tab-pane label="Team" name="team">
        <el-card>
          <el-button :onClick="AddTeam" style="margin-left :5px;margin-bottom :5px; " plain>
            <Icon icon="material-symbols:add" style=" color: green" size="52" /> Add Team
          </el-button>
          <el-table :data="projectTeamData" style="width: 100%">
            <el-table-column type="index" width="50" />
            <el-table-column prop="name" label="Name" />
            <el-table-column prop="phone" label="Phone" />
            <el-table-column prop="email" label="Email" />
            <el-table-column prop="role" label="Role" />
            <el-table-column fixed="right" label="">
              <template #default="scope">
                <el-button 
                  v-if="canUserDeleteTeamMember(scope.row)"
                  plain type="danger" @click="RemoveTeamMember(scope.row)">
                  <Icon icon="material-symbols-light:delete-outline" style="  margin-right: 5px;" />
                  Remove
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

      </el-tab-pane>

      <el-tab-pane label="Clock-In/Out" name="clockin">
        <el-card>
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 10px; flex-wrap: wrap;">
            <el-date-picker
              v-model="clockDateRange"
              type="daterange"
              range-separator="to"
              start-placeholder="Start date"
              end-placeholder="End date"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="applyClockFilters"
            />

            <el-date-picker
              v-model="clockMonth"
              type="month"
              placeholder="Select month"
              format="YYYY-MM"
              value-format="YYYY-MM"
              @change="applyClockFilters"
            />

            <el-button plain type="primary" @click="applyClockFilters">Apply</el-button>
            <el-button plain @click="clearClockFilters">Clear</el-button>

            <DownloadCustom
              :data="clockInHistory"
              model="project_clockin"
              :associated_models="['project','project_team','project_location']"
              :loading="downloadClockLoading"
              @download-start="downloadClockLoading = true"
              @download-end="downloadClockLoading = false"
            />
          </div>

          <el-table :data="clockInHistory" style="width: 100%" border>
            <el-table-column type="index" width="50" label="#" />
            <el-table-column label="Name" width="180">
              <template #default="scope">
                {{ scope.row.teamMember?.name || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="Role" width="150">
              <template #default="scope">
                {{ scope.row.teamMember?.role || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="Site" width="200">
              <template #default="scope">
                {{ scope.row.projectLocation?.location_name || '-' }}
              </template>
            </el-table-column>
              <el-table-column label="Map" width="100">
                <template #default="scope">
                  <el-button size="small" type="primary" plain @click="openClockMap(scope.row)">
                    <Icon icon="mdi:map" style="margin-right: 4px;" />
                    Map
                  </el-button>
                </template>
              </el-table-column>
            <el-table-column label="Clock In Time" width="180">
              <template #default="scope">
                {{ formatDateTime(scope.row.clock_in_time) }}
              </template>
            </el-table-column>
            <el-table-column label="Clock Out Time" width="180">
              <template #default="scope">
                {{ formatDateTime(scope.row.clock_out_time) }}
              </template>
            </el-table-column>
            <el-table-column label="Status" width="120">
              <template #default="scope">
                <el-tag v-if="scope.row.status === 'active'" type="success">Active</el-tag>
                <el-tag v-else-if="scope.row.status === 'completed'" type="info">Completed</el-tag>
                <el-tag v-else type="warning">{{ scope.row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="Hours Worked" width="120">
              <template #default="scope">
                {{ scope.row.total_hours ? scope.row.total_hours + ' hrs' : calculateHours(scope.row.clock_in_time, scope.row.clock_out_time) }}
              </template>
            </el-table-column>
            <el-table-column label="Notes" min-width="200">
              <template #default="scope">
                {{ scope.row.notes || '-' }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
        <el-dialog v-model="clockDialogMap" width="50%" draggable :before-close="closeClockMap" :show-close="false">
          <template #header="{ titleId, titleClass }">
            <div class="my-header">
              <h4 :id="titleId" :class="titleClass">Clock-in Location</h4>
              <el-button type="danger" :icon="CircleCloseFilled" @click="closeClockMap">Close Map</el-button>
            </div>
          </template>
          <div id="clockMapContainer" class="basemap"></div>
        </el-dialog>
      </el-tab-pane>


      <el-tab-pane label="Contractor" name="contractor">
        <el-card>

          <el-button :onClick="AddContractorTeam" style="margin-left :5px;margin-bottom :5px; " plain>
            <Icon icon="material-symbols:add" style=" color: green" size="52" /> Add Contractor(s)
          </el-button>
          <el-table :data="projectContractors" style="width: 100%">
            <el-table-column type="index" width="50" />
            <el-table-column prop="name" label="Name" />
            <el-table-column prop="role" label="Role" />
            <el-table-column prop="scope" label="Phone" />

            <el-table-column fixed="right" label="">
              <template #default="scope">
                <el-button 
                  v-if="canUserDeleteContractor(scope.row)"
                  plain type="danger" @click="RemoveContractor(scope.row)">
                  <Icon icon="material-symbols-light:delete-outline" style="  margin-right: 5px;" />
                  Remove
                </el-button>


              </template>
            </el-table-column>

          </el-table>
        </el-card>

      </el-tab-pane>


      <el-tab-pane label="Disbursements" name="disbursement">
        <el-card>

          <el-button :onClick="AddDisbursement" style="margin-left :5px;margin-bottom :5px; " plain>
            <Icon icon="material-symbols:add" style=" color: green" size="52" /> Add Disbursement(s)
          </el-button>
          <el-table :data="projectDisbursements" style="width: 100%" show-summary :summary-method="getSummaries">
            <el-table-column type="index" width="100" />
            <el-table-column prop="disbursement_date" label="Date" />
            <el-table-column prop="amount" label="Amount" />
            <el-table-column prop="certificate" label="IPC" />
            <el-table-column fixed="right" label="">
              <template #default="scope">
                <el-button 
                  v-if="canUserDeleteDisbursement(scope.row)"
                  plain type="danger" @click="RemoveDisbursement(scope.row)">
                  <Icon icon="material-symbols-light:delete-outline" style="  margin-right: 5px;" />
                  Remove
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

      </el-tab-pane>



      <el-tab-pane label="Timeline" name="timeline">

        <el-timeline style="max-width: 100%;">
          <el-timeline-item
v-for="(log, index) in sortedprojectLogs" :key="index" placement="top"
            :timestamp="log.date_actioned" timestamp-class="timestamp-class">
            <el-card
class="custom-card" shadow="hover" :class="log.action_type == 'Resolved' ? 'success-background' :
          log.action_type == 'Escalated' ? 'warning-background' :
            log.action_type == 'Closed' ? 'closed-background' :
              log.action_type == 'Referred' ? 'referred-background' :
                'info-background'
          ">
              <el-row align="middle" :gutter="20">
                <!-- Icon in the first 1/4 of the card -->
                <el-col :xs="24" :sm="24" :md="24" :lg="2">
                  <Icon v-if="log.action_type == 'Resolved'" icon="fluent-mdl2:completed-solid" width="60" />
                  <Icon v-if="log.action_type == 'Escalated'" icon="streamline:dangerous-zone-sign-solid" width="60" />
                  <Icon v-if="log.action_type == 'Reported'" icon="fluent-mdl2:report-warning" width="60" />
                  <Icon v-if="log.action_type == 'Referred'" icon="mdi:justice" width="60" />
                  <Icon v-if="log.action_type == 'Closed'" icon="fluent:lock-closed-20-filled" width="60" />

                </el-col>

                <el-col :xs="24" :sm="24" :md="14" :lg="14" :xl="14" :gutter="10">
                  <p class="action-header">{{ log.action_type }} </p>
                  <p class="action-body">{{ log.action ? log.action : 'None' }}</p>
                  <p class="action-footer">By: {{ log.user ? log.user.name : 'System' }}</p>
                </el-col>

                <el-col v-if="log.grievance_documents.length > 0" :xs="24" :sm="24" :md="6" :lg="6" :xl="6">
                  <p class="documents-header">Documentation </p>

                  <p v-for="(doc, docIndex) in log.grievance_documents" :key="docIndex">

                    <el-button @click="downloadFile(doc)" link type="primary" size="small" :icon="Download">{{ doc.name
                      }}</el-button>

                  </p>
                </el-col>

              </el-row>
            </el-card>
          </el-timeline-item>


        </el-timeline>

      </el-tab-pane>

 

    </el-tabs>
  </el-card>

 



  <el-dialog v-model="addMoreDocuments" title="Upload Documents" width="25%">
    <el-select
class="dialog-select" v-model="documentCategory" placeholder="Select Type" clearable filterable
      style="margin-bottom:10px" :onChange="handleSelect">
      <el-option-group v-for="group in DocTypes" :key="group.label" :label="group.label">
        <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
      </el-option-group>
    </el-select>

    <div class="dialog-upload">
      <el-upload
ref="upload" v-if="showUpload" v-model:file-list="morefileList" multiple :limit="10"
        :on-exceed="onExceeed" :auto-upload="false">
        <el-button class="full-width" type="primary" :icon="UploadFilled"> Select File(s) </el-button>

      </el-upload>
    </div>


    <el-tooltip
class="box-item" effect="dark" content="Only the Owner and Admin can view Private documents"
      placement="right-end">
      <el-checkbox v-model="protectedFile">Private File</el-checkbox>
    </el-tooltip>

    <div class="dialog-progress">
      <el-progress
:stroke-width="20" :show-text="false" :percentage="loadingPosting ? '50' : ''" :format="format"
        :indeterminate="true" />
    </div>




    <template #footer>
      <div class="dialog-footer">
        <el-button @click="addMoreDocuments">Cancel</el-button>
        <el-button type="primary" @click="submitMoreDocuments()">
          Confirm
        </el-button>
      </div>
    </template>


  </el-dialog>



  <el-dialog v-model="AddTeamDialog" title="Add Project Team" width="500">
    <el-form
:model="teamForm" label-width="auto" style="max-width: 600px" label-position="top" ref="ruleFormRef"
      :rules="rules">
      <el-form-item label="Role" prop='role'>
        <el-select v-model="teamForm.role" placeholder="Select  Role">
          <el-option v-for="role in roles" :key="role" :label="role" :value="role" />
        </el-select>
      </el-form-item>

      <el-form-item label="Name" prop='name'>
        <el-input v-model="teamForm.name" />
      </el-form-item>
      <el-form-item label="Phone" prop='phone'>
        <el-input v-model="teamForm.phone" />
      </el-form-item>

      <el-form-item label="Email" prop='email'>
        <el-input v-model="teamForm.email" />
      </el-form-item>

      <el-tooltip content="Save" placement="top">
        <el-button :onClick="updateTeam" style="margin-left :10px;" type="primary">
          <Icon icon="ic:round-save" style=" color: white" size="48" /> Save
        </el-button>

      </el-tooltip>

    </el-form>


  </el-dialog>


  <el-dialog v-model="AddContractorTeamDialog" title="Add Project Contractors" width="500">
    <el-form
:model="contractorForm" label-width="auto" style="max-width: 600px" label-position="top"
      ref="contractorFormRef" :rules="contractorRules">
      <el-form-item label="Contractor" prop='contractor'>
        <el-select
v-model="contractorForm.contractor_id" placeholder="Select " filterable
          :onChange="handleSelectContractor">
          <el-option v-for="cont in contractorOptions" :key="cont" :label="cont.label" :value="cont.id" />
          <template #footer>
            <el-button text bg size="small" @click="onAddOption">
              Add A Contractor
            </el-button>

          </template>

        </el-select>
      </el-form-item>

      <el-form-item label="Role" prop='role'>
        <el-select v-model="contractorForm.role" placeholder="Select ">
          <el-option v-for="role in contract_roles" :key="role" :label="role" :value="role" />
        </el-select>
      </el-form-item>

      <el-form-item label="Scope" prop='scope'>
        <el-input v-model="contractorForm.scope" />
      </el-form-item>



      <el-tooltip content="Save" placement="top">
        <el-button :onClick="updateContractor" style="margin-left :10px;" type="primary">
          <Icon icon="ic:round-save" style=" color: white" size="48" /> Save
        </el-button>

      </el-tooltip>

    </el-form>


  </el-dialog>




  <el-dialog v-model="showAddNewContractor" title="Register New Contractors" width="500">
    <el-form
:model="NewContractorForm" label-width="auto" style="max-width: 600px" label-position="top"
      ref="NewContractorRef" :rules="ruleFormRules">


      <el-form-item label="Contractor" prop='name'>
        <el-input v-model="NewContractorForm.name" />
      </el-form-item>

      <el-form-item label="Contact Person" prop='contact_person'>
        <el-input v-model="NewContractorForm.contact_person" />
      </el-form-item>



      <el-form-item label="Email" prop='email'>
        <el-input v-model="NewContractorForm.email" />
      </el-form-item>


      <el-form-item label="Phone" prop='phone'>
        <el-input v-model="NewContractorForm.phone" />
      </el-form-item>



      <el-form-item label="Address" prop='address'>
        <el-input v-model="NewContractorForm.address" />
      </el-form-item>

      <el-tooltip content="Save" placement="top">
        <el-button :onClick="createNewContractor" style="margin-left :10px;" type="primary">
          <Icon icon="ic:round-save" style=" color: white" size="48" /> Save
        </el-button>

      </el-tooltip>

    </el-form>


  </el-dialog>



  <el-dialog v-model="uploadDialog" title="Import Document" width="400" @close="uploadDialog = false">
    <span>
      To upload data on projects, use this
      <button @click="handleDownload" class="template-link">template</button>
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





  <el-dialog v-model="AddDialogVisible"  title="File a Report" width="50%"  @close="AddDialogVisible = false"  >
  <el-steps :active="activeStep" align-center finish-status="success" style="margin-bottom: 20px;">
    <el-step title="Project Details" />
    <el-step title="Indicator Selection" />
    <el-step title="Input Values" />
    <el-step title="Submit" />
  </el-steps>

  <el-form ref="ReportRuleFormRef" :model="ruleForm" :rules="rules" label-width="100px" label-position="top">
    <!-- Step 0 -->
    <el-row v-if="activeStep === 0" :gutter="20">
      <el-col :span="24">
        

        <el-form-item v-if="!isNationalProject" label="Location" prop="project_location_id">
          <el-select   v-model="ruleForm.project_location_id" value-key="id" placeholder="Select" @change="changeLocation" style="width: 100%;">
            <el-option v-for="item in projectLocations" :key="item.id" :label="item.location_name" :value="item.id">
              <div style="display: flex; align-items: center;">
                <span style="flex: 1; text-align: left;">{{ item.location_name }}</span>
                <!-- <span style="flex: 2; color: var(--el-text-color-secondary); font-size: 12px; text-align: right;">
                  {{ item.ward.name }}, {{ item.subcounty.name }}, {{ item.county.name }}
                </span> -->
                <span style="flex: 2; color: var(--el-text-color-secondary); font-size: 12px; text-align: right;">
                      {{ formatLocation(item) }}
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
          <el-button v-if="showSubmitBtn && activeStep === 3" type="primary" @click="submitForm(ReportRuleFormRef)">Submit</el-button>
          <el-button v-if="showEditSaveButton && activeStep === 3" type="primary" @click="editForm(ruleFormRef)">Save</el-button>
        </el-col>
      </el-row>
    </span>
  </template>
</el-dialog>




  <el-dialog v-model="AddDisbursementTeamDialog" title="Add Disbursement/Payemnt" width="500">
    <el-form
:model="DisbursementForm" label-width="auto" style="max-width: 600px" label-position="top"
      ref="DisbursementFormRef" :rules="DisbursementRules">

      <el-form-item label="IPC " prop='certificate'>
        <el-input v-model="DisbursementForm.certificate" style="max-width: 100%" />
      </el-form-item>


      <el-form-item label="Description " prop='description'>
        <el-input v-model="DisbursementForm.description" style="max-width: 100%" />
      </el-form-item>


      <el-form-item label="Amount" prop='amount'>
        <el-input-number min="0" v-model="DisbursementForm.amount" style="max-width: 100%" />
      </el-form-item>


      <el-form-item label="Date" prop='disbursement_date'>
        <el-date-picker
v-model="DisbursementForm.disbursement_date" :disabled-date="disabledFutureDates"
          style="max-width: 100%" />
      </el-form-item>

      <el-tooltip content="Save" placement="top">
        <el-button :onClick="updateDisbursement" style="margin-left :10px;" type="primary">
          <Icon icon="ic:round-save" style=" color: white" size="48" /> Save
        </el-button>

      </el-tooltip>

    </el-form>


  </el-dialog>









</template>
<style scoped>
/* Custom styling for details container */
.details-container {
  margin-top: 20px;
}

/* Custom styling for each detail item */
.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  padding: 5px;
  border-bottom: 1px solid #eee;
}

/* Label styling */
.label-text {
  font-weight: bold;
  color: #333;

  width: 10%;
  /* Adjust as needed */
}

/* Value styling */
.value {
  width: 90%;
  /* Adjust as needed */

}

/* Ensure spacing between rows */
.el-row {
  margin-top: 20px;
}

.card-header {
  display: flex;


  font-weight: bold;
  font-size: 1.2rem;
  color: #333;
}

/* Custom styling for documents container */
.documents-container {
  margin-top: 20px;
}

.documents-container ul {
  list-style-type: none;
  padding: 0;
}

.documents-container li {
  margin-bottom: 10px;
}
</style>
<style scoped>
.action-col {
  padding: 10px;
}

.action-header {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1px;
  color: #333;
}

.documents-header {
  font-size: 0.95rem;
  font-weight: bold;
  margin-bottom: 1px;
  color: #837f7f;
}

.action-body {
  font-size: 1rem;
  font-weight: 200;
  color: #666;
}

.action-footer {
  font-size: 1rem;
  font-weight: 300;
  color: #2e0dc2;
}

.success-background {
  background-color: rgba(226, 248, 231, 0.4);
  /* Light green with 80% opacity */
  color: #1bd847;
  /* Dark green text */
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #c3e6cb;
  /* Border color */

}

.warning-background {
  background-color: rgba(255, 243, 205, 0.4);
  /* Light yellow with 80% opacity */
  color: #856404;
  /* Dark yellow text */
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ffeeba;
  /* Border color */
}

.closed-background {
  background-color: rgba(255, 0, 0, 0.14);
  /* Red with 80% opacity */
  color: #fa0707;
  /* Darker text for contrast */
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #fb050552;
  /* Lighter red border */
}

.referred-background {
  background-color: rgba(247, 155, 7, 0.2);
  /* Pink with 20% opacity */
  color: rgb(255, 192, 254);
  /* Same text color */
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #d6d6d6;
  /* Lighter pink border */
}




.info-background {
  background-color: rgba(204, 229, 255, 0.4);
  /* Light blue with 80% opacity */
  color: #004085;
  /* Dark blue text */
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #b8daff;
  /* Border color */
}


.custom-card {
  padding: 5px;
  /* Reduce padding */
  margin: 5px 0;
  /* Adjust margin as needed */
  min-height: 10px;
  /* Set a minimum height if needed */
}

.timestamp-class {
  font-weight: bold;
  /* Example: Make it bold */
  color: #6c757d;
  /* Example: Set color */
  font-size: 14px;
  /* Example: Adjust font size */
  /* Add any additional styles as needed */
}
</style>



<style scoped>
.basemap {
  width: 100%;
  height: 65vh;
}


.template-link {
  text-decoration: underline;
  color: #409EFF;
  /* Optional: change link color */
}
</style>

<style scoped>
.task-card {
  margin-bottom: 20px;
}

.task-card-item {
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #ffffff56;
}

.task-card-item .task-name {
  margin-bottom: 10px;
  font-weight: lighter;
}

.task-card-item .task-details {
  margin-left: 10px;
  line-height: 1.6;
}


.bold-task {
  font-weight: bold;
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

.my-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
</style>