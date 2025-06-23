<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { getSettlementListByCounty } from '@/api/settlements'
import { ElButton, ElBadge } from 'element-plus'
import {
  Position, View, Plus, User, TopRight, Briefcase, Download, Delete, Edit,
  Filter, InfoFilled, CopyDocument, Search, Setting, Loading,UploadFilled
} from '@element-plus/icons-vue'

import { ref, reactive, watch, computed } from 'vue'
import {
  ElTable, ElTableColumn, ElCollapse, ElCollapseItem, ElPagination, ElDialog,
  ElFormItem, ElInput, ElMessage, ElSelect, ElOption, ElForm, ElOptionGroup
} from 'element-plus'
import { useRouter } from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord, deleteDocument, getDocumentsBySearch } from '@/api/settlements'
import xlsx from "json-as-xlsx"

import { getSummarybyField, getSummarybyFieldNested, getSummarybyFieldFromInclude, getSummarybyFieldSimple } from '@/api/summary'

import moment from "moment";
import { defineAsyncComponent,onMounted } from 'vue';



import { getSummarybyFieldFromMultipleIncludes } from '@/api/summary'
import { getCountyListApi, getListWithoutGeo } from '@/api/counties'
import { getFile } from '@/api/summary'

import { useAppStore } from '@/store/modules/app'


import UploadComponent from '@/views/Components/UploadComponent.vue';
import TableActions from '@/views/Components/TableActions.vue';
import PermissionWrapper from '@/components/PermissionWrapper.vue';


const { wsCache } = useCache()
const appStore = useAppStore()
const userInfo = wsCache.get(appStore.getUserInfo)
const showAdminButtons =  ref(appStore.getAdminButtons)
const showEditButtons =  ref(appStore.getEditButtons)



const filters = ref([])
const filterValues = ref([])



/// ------------------------------Get User Roles - ----------------------

const processedRoles = userInfo.roles.map(role => {
  // Default values for the role processing
  let field = null;
  let fieldvalue = null;

  // Check the location level and assign values accordingly
  if (role.user_roles.location_level === "county") {
    field = "county_id";
    fieldvalue = role.user_roles.county_id;
  } else if (role.user_roles.location_level === "settlement") {
    field = "settlement_id";
    fieldvalue = role.user_roles.settlement_id;
  } else if (role.user_roles.location_level === "national" || role.user_roles.location_level === null) {
    return {
      role: role.name,        // Role type (e.g., grm, consultant, staff)
      model: "national",
      field: null,
      fieldvalue: null
    };
  } else {
    // Fallback case for other location levels
    field = "location_id";
    fieldvalue = role.user_roles.location_id;
  }

  return {
    role: role.name,           // Role type (e.g., grm, consultant, staff)
    model: role.user_roles.location_level,  // The level (county/settlement)
    field: field,              // Field name (county_id/settlement_id/location_id)
    fieldvalue: fieldvalue     // Actual value of the ID
  };
}).filter(role => role !== null);


console.log('processedRole >>>s', processedRoles)

const isSuperAdmin = userInfo.roles.some(role => role.name === "super_admin");

// Determine roles_filters generically
let roles_filters = [];

if (isSuperAdmin) {
  // If the user is a super_admin, no filters are applied
  roles_filters = [];
} else {
  // Process filters for all roles with location levels
  const applicableRoles = processedRoles.filter(role => role.model !== "national");

  roles_filters = applicableRoles.map(role => ({
    role: role.role,       // Include the role name for context
    field: role.field,     // Field name (county_id/settlement_id/location_id)
    value: role.fieldvalue // Field value
  }));
}

console.log('roles_filters >>>>>>', roles_filters)



// Push Role FIlters ---- ////
const pushRoleFilters = () => {
  if (roles_filters.length > 0) {
    filters.value.push(roles_filters[0].field);  // Add the field to filters if roles_filters is not empty
  }

  // Prepare filterValues array
  if (roles_filters.length > 0) {
    filterValues.value.push([roles_filters[0].value]);  // Add the value to filterValues if roles_filters is not empty
  }

  console.log('With Role filters', filters.value);
  console.log('With Role  filterValues', filterValues.value);

}


pushRoleFilters()


// // Hide buttons if not admin 
  


const action_buttons = ref([])
if (showAdminButtons.value) {
  action_buttons.value = ['edit', 'delete','preview','download' ]
} else if (showEditButtons.value) {

  action_buttons.value = ['edit', 'preview','download' ]
}
else {
  action_buttons.value = [ 'preview','download' ]

}





console.log("userInfo--->", userInfo)
 
const pageSize = ref(5)
const currentPage = ref(1)
const loading = ref(false)

const isMobile = computed(() => appStore.getMobile)

console.log('IsMobile', isMobile)

const dialogWidth = ref()
const actionColumnWidth = ref()

if (isMobile.value) {
  dialogWidth.value = "90%"
  actionColumnWidth.value = "75px"
} else {
  dialogWidth.value = "25%"
  actionColumnWidth.value = "160px"

}


const formatEndDate = (data) => {
 // console.log(data.createdAt)

//return moment(data.end_date).format("YYYY-MM-DD (HH:MM A)");
return moment(data.createdAt).format('lll')

}

//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']

const model = 'document'

const associated_multiple_models = ['project', 'indicator_category_report', 'document_type', 'users']
//// ------------------parameters -----------------------////
const nested_models = ['settlement', 'county'] // The mother, then followed by the child

const { t } = useI18n()



const totalDocs = ref()

const searchTerm = ref('')
const currentlyFiltered = ref(false)

// Most common document types (these will be the cards)
const commonDocTypes = ref([
  { id: 'reports', name: 'Reports', icon: 'Document', color: '#409eff', count: 0 },
  { id: 'maps', name: 'Maps', icon: 'Picture', color: '#67c23a', count: 0 },
  { id: 'plans', name: 'Plans', icon: 'Document', color: '#e6a23c', count: 0 },
  { id: 'data', name: 'Data', icon: 'Document', color: '#f56c6c', count: 0 }
])

// Other document types (these will be in collapsible sections)
const otherDocTypes = ref([])



function flattenArrayOfJSON(arr) {
  const result = [];

  function flattenJSON(jsonObj) {
    const flattenedObj = {};

    function recurse(obj, currentKey) {
      for (const key in obj) {
        const value = obj[key];
        const newKey = currentKey ? `${currentKey}.${key}` : key;

        if (typeof value === "object" && value !== null) {
          if (key !== "geom") {
            recurse(value, newKey);
          }
        } else {
          flattenedObj[newKey] = value;
        }
      }
    }

    recurse(jsonObj, null);
    return flattenedObj;
  }

  for (const jsonObj of arr) {
    const flattenedObj = flattenJSON(jsonObj);
    result.push(flattenedObj);
  }

  return result;
}



const filterLiveDocs = ref([])
const filterLiveDocsBackup = ref([])

//console.log('TBL-4f', liveDocs.value)



function formatText(str) {
  // Replace underscores with spaces
  str = str.replace(/_/g, ' ');
  // Convert to proper text (capitalize first letter of each word)
  str = str.toLowerCase().replace(/\b(\w)/g, function (match, firstLetter) {
    return firstLetter.toUpperCase();
  });
  return str;
}


// 29-10-2023 // 
const groups_v2 = ref([])
function reformatData(data) {
  console.log('------------------------data>>>>>,',data)


  return data.reduce((result, item) => {

    console.log('------------------------item>>>>>,',item)
    const { group, type, count } = item;
    if (!result[group]) {
      result[group] = {};
    }
    result[group][type] = count;
    loading.value = false
    return result;
  }, {});
}

const docTypes = ref([])
const docGroups = ref([])

const getCategoryCounts = async () => {
  loading.value = true
  const formData = {}
  formData.model = 'document'
  formData.summaryField = 'document_type.group'
  formData.summaryFunction = 'count'
  formData.assoc_models = associated_multiple_models
  formData.groupFields = ['document_type.category_id', 'document_type.type']

  formData.filterField = []
  formData.filterValue = []
  formData.filterOperator = ['eq']

  console.log('Filter FormData : ', formData)
  const response = await getSummarybyFieldFromMultipleIncludes(formData);
  console.log('getCategoryCounts...', response)

  let joinedArray = response.Total.map(item => {
    let matchInAnotherArray = docGroups.value.find(entry => entry.id == item.category_id);

    if (matchInAnotherArray) {
      return {
        count: item.count,
        type: item.type,
        group: matchInAnotherArray.title,
      };
    }
  });

  // Remove undefined entries if any
  joinedArray = joinedArray.filter(item => item !== undefined);

  // Sort the array by the 'group' property
  joinedArray.sort((a, b) => a.group.localeCompare(b.group));

  console.log('joinedArray', joinedArray)

  // Update common document types with actual counts
  commonDocTypes.value.forEach(commonType => {
    const matchingItem = joinedArray.find(item => 
      item.group.toLowerCase() === commonType.name.toLowerCase()
    );
    if (matchingItem) {
      commonType.count = matchingItem.count;
    }
  });

  // Separate common types from others
  const commonGroupNames = commonDocTypes.value.map(type => type.name.toLowerCase());
  const otherGroups = joinedArray.filter(item => 
    !commonGroupNames.includes(item.group.toLowerCase())
  );

  // Group other types by their group
  const otherGroupsMap = {};
  otherGroups.forEach(item => {
    if (!otherGroupsMap[item.group]) {
      otherGroupsMap[item.group] = {};
    }
    otherGroupsMap[item.group][item.type] = item.count;
  });

  // Update the groups_v2 for the collapsible sections
  groups_v2.value = otherGroupsMap;

  loading.value = false
}


const getFilteredCategoryCounts = async (filterIDs) => {

const formData = {}
formData.model = 'document'
formData.summaryField = 'document_type.group'
formData.summaryFunction = 'count'
//formData.assoc_models = ['county']
formData.assoc_models = associated_multiple_models
formData.groupFields = ['document_type.category_id', 'document_type.type']

formData.filterField = ['id']
formData.filterValue = [filterIDs]
formData.filterOperator = ['eq']

console.log('Filter FormData : ', formData)
const response = await getSummarybyFieldFromMultipleIncludes(formData);
console.log('getFilteredCategoryCounts.Filtredt..', response)


let joinedArray = response.Total.map(item => {
  let matchInAnotherArray = docGroups.value.find(entry => entry.id == item.category_id);

  if (matchInAnotherArray) {
      return {
           count: item.count,
          type: item.type,
          group: matchInAnotherArray.title,
       };
  }
});

// Remove undefined entries if any
joinedArray = joinedArray.filter(item => item !== undefined);

// Sort the array by the 'group' property
joinedArray.sort((a, b) => a.group.localeCompare(b.group));


console.log('joinedArray filteretd',joinedArray)


groups_v2.value = reformatData(joinedArray)


}


const getFilteredDataV2 = async () => {
  //loading.value = true
  const formData = {}
  formData.limit = 10
  formData.page = currentPage.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model
  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------


  // - multiple filters -------------------------------------
  formData.filters = filters.value
  formData.filterValues = filterValues.value
  formData.associated_multiple_models = associated_multiple_models
  //formData.nested_models = nested_models
  //sformData.nested_filter = [filters, filterValues]
  formData.nested_models = nested_models

  //-------------------------
  console.log(formData)
  await getSettlementListByCounty(formData)
    .then(response => {

      var flattenedObj = flattenArrayOfJSON(response.data);
      //create the subcategories 
      var filteredObjs = flattenedObj.filter(function (doc) {
         // console.log("createdBy", doc.createdBy === userInfo.id || !doc.protectedFile)

        if (doc.createdBy === userInfo.id || showAdminButtons.value) {
          doc.deletable = true

        } else {
          doc.deletable = false
        }
        console.log("Deletable", doc.deletable)

        if (showAdminButtons.value) {
          return doc
        } else {

          return (doc.createdBy === userInfo.id || !doc.protectedFile)
        }

      });


      console.log(response.total)

      console.log('filteredObjs --v1', filteredObjs)


      filterLiveDocs.value = filteredObjs
      filterLiveDocsBackup.value = filteredObjs
      totalDocs.value = response.total



    });





}


const getDocumentTypes = async () => {

  try {
    const response = await getListWithoutGeo({
      params: {
        curUser: 1,
        model: 'document_type',
        associated_multiple_models: ['document_category'],
        searchField: 'name',
        searchKeyword: '',
        sort: 'ASC'
      }
    });

    console.log('Doc Types', response.data)
    docTypes.value = response.data

    response.data.forEach(item => {
      let documentCategory = item.document_category;
    let existingEntry = docGroups.value.find(entry => entry.id === documentCategory.id);

    if (!existingEntry) {
      docGroups.value.push({
            id: documentCategory.id,
            title: documentCategory.title
        });
    }
});

    console.log('Doc docGroups', docGroups.value)
    getCategoryCounts()


  } catch (error) {
    console.error('Error fetching data:', error);
  }
};












const handlePageChange = async (newPage) => {

  currentPage.value = newPage;
  await getFilteredDataV2()
}




const handleItemCollapse = async (type) => {
  loading.value = true
  console.log('type', type)

  console.log('currentlyFiltered', currentlyFiltered)

  if (!currentlyFiltered.value) {
    // clear daata and filers  before laoding next 
    filterLiveDocs.value = []
    filterLiveDocsBackup.value = []
    filters.value = []
    filterValues.value = []
    // now run the querry 
    console.log(`Item "${type}" is uncollapsed.`);
    const SelectedDocType = docTypes.value.filter(obj => obj.type == type);
    console.log(SelectedDocType[0].id)

    filters.value = ['category']
    filterValues.value = [[SelectedDocType[0].id]]

    await getFilteredDataV2()
    loading.value = false
  }
  else {
    filterLiveDocs.value = filterLiveDocsBackup.value.filter(obj => obj['document_type.type'] === type);
    loading.value = false

  }
}



function getIconForGroup(groupName) {
  switch (groupName) {
    case 'Reports':
      return 'ion:document-outline';
    case 'Checklists':
      return 'material-symbols:checklist';
    case 'Maps':
      return 'ri:road-map-line';
    case 'Data':
      return 'material-symbols:chart-data-outline';
    case 'Engineering':
      return 'ion:document-outline';
    case 'Plans':
      return 'carbon:heat-map-03';
    default:
      return 'material-symbols:linked-camera-outline';
  }
}


const handleInputChange = async (keyword) => {
  loading.value = true


  if (keyword) {
    currentlyFiltered.value = true
    console.log(keyword)

    const formData = {}
    formData.limit = 5

    //-Search field--------------------------------------------
    formData.searchTerm = keyword
    formData.assoc_models = associated_multiple_models

    //--Single Filter -----------------------------------------


    //-------------------------
    console.log(formData)

    let resultsIDs = []

    await getDocumentsBySearch(formData)
      .then(response => {
        console.log('response.Total', response.Total)
        if (response.Total > 150) {
          console.log("Too many..Refine")
          ElMessage.error('Too Many Results (>150). Refine your search keyword');

          loading.value = false
        } else {
          var flattenedObj = flattenArrayOfJSON(response.data);
          //create the subcategories 
          var filteredObjs = flattenedObj.filter(function (doc) {
             console.log("doc", doc.id)
            resultsIDs.push(doc.id)

            if (doc.createdBy === userInfo.id || showAdminButtons.value) {
              doc.deletable = true

            } else {
              doc.deletable = false
            }
            console.log("Deletable", doc.deletable)




            if (showAdminButtons.value) {
              return doc
            } else {
              return (doc.createdBy === userInfo.id || !doc.protectedFile)
            }

          });

          getFilteredCategoryCounts(resultsIDs)
          console.log('filteredObjs --v2', filteredObjs)
          filterLiveDocs.value = filteredObjs
          filterLiveDocsBackup.value = filteredObjs
          totalDocs.value = response.total
          loading.value = false
        }




      });

  }

  else {
    getCategoryCounts()
  }




}





const downloadFile = async (data) => {
  // Show immediate success message and start download in background
  ElMessage.success(`Starting download: ${data.name}`);
  
  const formData = {};
  formData.filename = data.name;
  formData.doc_id = data.id;
  formData.responseType = 'blob';
  
  // Start download in background without blocking UI
  getFile(formData)
    .then(response => {
      // Check if the response is an error message
      if (response.data instanceof Blob && response.data.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = () => {
          const errorData = JSON.parse(reader.result);
          ElMessage.error(errorData.message || 'Download failed');
        };
        reader.readAsText(response.data);
        return;
      }
      
      // Create download link and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = data.name;
      if (!/\.\w+$/.test(filename)) {
        link.setAttribute('download', `${filename}.${data.format}`);
      } else {
        link.setAttribute('download', filename);
      }
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Optional: Show completion message
      ElMessage.success(`Download completed: ${data.name}`);
    })
    .catch(error => {
      console.error('Error downloading file:', error);
      ElMessage.error(error.response?.data?.message || 'Download failed');
    });
};

const viewDocument = async (data) => {
  // Show immediate feedback
  ElMessage.info(`Opening document: ${data.name}`);
  
  const formData = {};
  
  let fname 
  const filename = data.name;
  // Check if the filename has an extension
  if (!/\.\w+$/.test(filename)) {
    fname = filename + '.' + data.format
  } else {
    fname = filename
  }
  formData.filename = fname
  formData.doc_id = data.id;
  formData.responseType = 'blob';

  // Start document loading in background
  getFile(formData)
    .then(response => {
      const blobData = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blobData);
      const newTab = window.open(url, '_blank');

      if (newTab) {
        // Optional: Show success message when tab opens
        ElMessage.success(`Document opened in new tab: ${data.name}`);
      } else {
        console.error('Failed to open a new tab.');
        ElMessage.error('Failed to open the document. Please check your popup blocker settings.');
      }
    })
    .catch(error => {
      console.error(error);
      ElMessage.error('Failed to load the document.');
    });
};


const removeDocument = (data) => {
  console.log('----->', data)
  let formData = {}
  formData.id = data.id
  formData.model = 'document'
  formData.filesToDelete = [data.name]
  deleteDocument(formData)


  // remove the deleted object from array list 
  let index = filterLiveDocs.value.indexOf(data);
  if (index !== -1) {
    filterLiveDocs.value.splice(index, 1);
  }

}

/// Edititng Docuent 

// do not use same name with ref
//id, name, report_id, project_id, settlement_id, category, format, size, location, "createdBy", code, "createdAt", "updatedAt", piped_water_id, road_asset_id, health_facility_id, education_facility_id, road_id, water_point_id, sewer_id, other_facility_id, hh_id, evaluation_id, "protectedFile", contractor_id)

const documentForm = reactive({
  id: null,
  name: '',
  category: '',
  parent_id: '',

})

const docCategories = ref([])
const editedDocumentType = ref()

const documentName = ref()
const dialogVisible = ref(false)


const editDocument = (data) => {
  console.log('Edit', data)

  // Copy all properties from data to documentForm
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      if (key === "name") {
        // If the property name is "name" and contains a dot, strip the text after the dot
        const propertyName = data[key].split('.')[0];
        console.log(propertyName)
        documentForm['name'] = data[key].split('.')[0];
      } else {
        documentForm[key] = data[key];
      }
    }
  }


  console.log('documentForm', documentForm)
  documentName.value = "Editing: " + data.name

  // get doument types 
  // documentForm.id=data.row.id
  // documentForm.name=data.row.name
  // documentForm.category=data.row["document_type.id"]
  dialogVisible.value = true

  // get this docuemnts type
  // console.log(data.row["document_type.id"])
  // editedDocumentType.value=data.row["document_type.id"]


  console.log('editedDocumentType', editedDocumentType.value)

  // get all types 
  docTypes.value.forEach(function (arrayItem) {
    let opt = {}
    opt.value = arrayItem.id
    opt.label = arrayItem.type
    docCategories.value.push(opt)

  })


  console.log(docCategories.value)
}




const handleClose = () => {
  dialogVisible.value = false
}




const uploadOptions = [
  {
    label: 'Settlement',
    options: [
      {
        value: 'settlement',
        label: 'Settlements'
      },

      {
        value: 'project',
        label: 'Projects'
      }
    ]
  },
  {
    label: 'Households',
    options: [

      {
        value: 'beneficiary',
        label: 'Beneficiaries'
      },
      {
        value: 'parcel',
        label: 'Parcels'
      },
    ]
  },

  {
    label: 'Facilities',
    options: [
      {
        value: 'health',
        label: 'Health'
      },
      {
        value: 'education',
        label: 'Education'
      },
      {
        value: 'roads',
        label: 'Roads'
      },
      {
        value: 'road_assets',
        label: 'Structures(roads)'
      },
      {
        value: 'water_point',
        label: 'Water'
      },
      {
        value: 'sewer',
        label: 'Sewer'
      },

      {
        value: 'other',
        label: 'Other'
      },

    ]
  },

  {
    label: 'Indicators',
    options: [

      {
        value: 'indicator_category_report',
        label: 'M&E Reports'
      },
    ]
  },
  {
    label: 'Contracts',
    options: [

      {
        value: 'contractor',
        label: 'Contract Documents'
      },
    ]
  },
  {
    label: 'Others',
    options: [

      {
        value: 'other_documents',
        label: 'Other Documents'
      },
    ]
  }
]

const theParentModel = ref()
const parentOptions = ref([])
const document_field = ref()
const hide_parent = ref(false)
const disable_submit = ref(true)

const parentTitle = ref("Parent (selected)")

const getparentOptions = async () => {
  parentOptions.value = []
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 1000,
      curUser: 1, // Id for logged in user
      model: theParentModel.value, //model 
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    // console.log('Received response:', response)
    //tableDataList.value = response.data
    var ret = response.data


    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var countyOpt = {}
      countyOpt.value = arrayItem.id
      console.log(arrayItem)

      if (arrayItem.contract_number) {
        countyOpt.label = arrayItem.contract_number
      }
      else if (arrayItem.name) {
        countyOpt.label = arrayItem.name  
      }

      else {
        countyOpt.label = arrayItem.title  

      }
      console.log(countyOpt)
      parentOptions.value.push(countyOpt)
    })
  })
}

const handleSelectType = async (type: string) => {
  theParentModel.value = type
  console.log('Selected.....>', type)

  disable_submit.value=false
  if (type === 'settlement') {
    document_field.value = 'settlement_id'
    parentTitle.value="Settlement"

    getparentOptions()
  }


  else if (type === 'beneficiary') {
    document_field.value = 'beneficiary_id'
    parentTitle.value="Beneficiary"

    getparentOptions()
  }

  else if (type === 'project') {
    document_field.value = 'project_id'
    parentTitle.value="Project"

    getparentOptions()

  }

  else if (type === 'contractor') {
    document_field.value = 'contractor_id'
    parentTitle.value="Contract"
    getparentOptions()

  }

  else if (type === 'health_facility') {
    document_field.value = 'health_facility_id'
    parentTitle.value="Health Facility"

    getparentOptions()

  }

  else if (type === 'education_facility') {
    document_field.value = 'education_facility_id'
    parentTitle.value="Education Facility"

    getparentOptions()

  }



  else if (type === 'road') {
    document_field.value = 'road_id'
    parentTitle.value="Road"
    getparentOptions()

  }

  else if (type === 'road_asset') {
    document_field.value = 'road_asset_id'
    parentTitle.value="Asset"

    getparentOptions()

  }

  else if (type === 'water_point') {
    document_field.value = 'water_point_id'
    parentTitle.value="Water Point"

    getparentOptions()

  }

  else if (type === 'sewer') {
    document_field.value = 'sewer_id'
    parentTitle.value="Sewer"

    getparentOptions()

  }

  else if (type === 'other_facility') {
    document_field.value = 'other_facility_id'
    parentTitle.value="Other Facility"

    getparentOptions()

  }

  else if (type === 'indicator_category_report') {
    document_field.value = 'indicator_category_report'
    parentTitle.value="M&E Report"

    getparentOptions()

  }
  else if (type === 'other_documents') {
    //document_field.value = 'indicator_category_report'
    //getparentOptions()
    hide_parent.value = true


  }


  console.log(theParentModel.value)

}

const handleSubmitData = async () => {
  

  //location:"/data/uploads/Umoja_RIM.jpg"
  const result = "/data/uploads/" + documentForm.name +'.'+ documentForm.format;  
  documentForm.edited_name = documentForm.name +'.'+ documentForm.format
  console.log('result', result)
  console.log('EditedDocumentForm', documentForm)
 
    
    documentForm.model = 'document'
    await updateOneRecord(documentForm)
 
    dialogVisible.value = false

}




/// Upload documents from a central component 

const showUploadDialog = ref(false)
const currentGroupName = ref('')

function toggleComponent(groupName) {
  console.log('Opening upload for group:', groupName)
  console.log('Current showUploadDialog value:', showUploadDialog.value)
  currentGroupName.value = groupName
  showUploadDialog.value = true
  console.log('New showUploadDialog value:', showUploadDialog.value)
}

// Handle upload completion
const handleUploadComplete = (response) => {
  console.log('Upload completed:', response);
  // Refresh the document list
  getFilteredDataV2();
  getCategoryCounts();
  ElMessage.success('Documents uploaded successfully!');
  showUploadDialog.value = false;
}

// Handle upload errors
const handleUploadError = (error) => {
  console.error('Upload error:', error);
  ElMessage.error('Failed to upload documents. Please try again.');
}

// Handle clicking on common document type cards
const handleCommonTypeClick = (commonType) => {
  console.log('Clicked on common type:', commonType.name)
  // Filter documents by this type
  currentlyFiltered.value = true
  filters.value = ['document_type.group']
  filterValues.value = [[commonType.name]]
  getFilteredDataV2()
}

// Handle uploading to common document type
const handleCommonTypeUpload = (commonType) => {
  console.log('Uploading to common type:', commonType.name)
  currentGroupName.value = commonType.name
  showUploadDialog.value = true
}

// Get icon component for common types
const getCommonTypeIcon = (iconName) => {
  switch (iconName) {
    case 'Document': return CopyDocument
    case 'Picture': return CopyDocument
    default: return CopyDocument
  }
}

getDocumentTypes()




</script>

<template>
  <ContentWrap
    :title="t('Document Repository')" 
    :message="t('Use the filters to subset')" 
    v-loading="loading"
    element-loading-text="Getting the documents......."
  >

    <el-row>
    <el-col :span="6">
      <el-statistic title="Daily active users" :value="268500" />
    </el-col>
    <el-col :span="6">
      <el-statistic :value="138">
        <template #title>
          <div style="display: inline-flex; align-items: center">
            Ratio of men to women
            <el-icon style="margin-left: 4px" :size="12">
              <Male />
            </el-icon>
          </div>
        </template>
        <template #suffix>/100</template>
      </el-statistic>
    </el-col>
    <el-col :span="6">
      <el-statistic title="Total Transactions" :value="outputValue" />
    </el-col>
    <el-col :span="6">
      <el-statistic title="Feedback number" :value="562">
        <template #suffix>
          <el-icon style="vertical-align: -0.125em">
            <ChatLineRound />
          </el-icon>
        </template>
      </el-statistic>
    </el-col>
  </el-row>
  
    <!-- Search Bar -->
    <div class="search-section">
      <el-input
        v-model="searchTerm" 
        placeholder="Search documents by name/settlement/county/format/uploader name" 
        class="search-input"
        clearable 
        @change="handleInputChange" 
      />
    </div>

    <!-- Common Document Types Cards -->
    <div class="common-types-section">
      <h3 class="section-title">Most Common Document Types</h3>
      <div class="common-types-grid">
        <div 
          v-for="commonType in commonDocTypes" 
          :key="commonType.id"
          class="common-type-card"
          :class="{ 'active-filter': currentlyFiltered && filters.includes('category') && filterValues.some(values => values.some(v => docTypes.find(dt => dt.id === v && dt.group?.toLowerCase() === commonType.name.toLowerCase()))) }"
          :style="{ borderColor: commonType.color }"
          @click="handleCommonTypeClick(commonType)"
        >
          <div class="card-header">
            <el-icon :size="32" :color="commonType.color">
              <component :is="getCommonTypeIcon(commonType.icon)" />
            </el-icon>
            <div class="card-count">
              <span class="count-number">{{ commonType.count }}</span>
              <span class="count-label">documents</span>
            </div>
          </div>
          <div class="card-content">
            <h4 class="card-title">{{ commonType.name }}</h4>
            <p class="card-description">View and manage {{ commonType.name.toLowerCase() }} documents</p>
          </div>
          <div class="card-actions">
            <el-button 
              type="primary" 
              size="small" 
              @click.stop="handleCommonTypeUpload(commonType)"
              :icon="UploadFilled"
            >
              Upload
            </el-button>
            <el-button 
              type="default" 
              size="small" 
              @click.stop="handleCommonTypeClick(commonType)"
            >
              View All
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Other Document Types -->
    <div class="other-types-section" v-if="Object.keys(groups_v2).length > 0">
      <h3 class="section-title">Other Document Types</h3>
      <el-collapse accordion>
        <el-collapse-item v-for="(group, groupName) in groups_v2" :key="groupName">
          <template #title>
            <Icon icon="material-symbols:folder-open-outline" class="collapsible-header-icon" width="48" />
            <span class="collapsible-header-text">{{ formatText(groupName) }}</span>
          </template>
          <el-collapse accordion>
            <el-collapse-item v-for="(typeCount, type) in group" :key="type">
              <template #title>
                <el-button class="collapsible-nested-header-button" type="" link @click="handleItemCollapse(type)">
                  <Icon :icon="getIconForGroup(groupName)" color="gray" class="collapsible-nested-header-icon" width="36" />
                  {{ formatText(type) }}
                </el-button>
                <el-badge :value="typeCount" class="collapsible-header-badge" />
              </template>

              <el-table :data="filterLiveDocs" style="width: 100%; margin-left: 30px" size="small" class="thin-rows-table" border >
                <el-table-column label="#" type="index" width="50">
                  <template #default="{ $index }">
                    <span>{{ ($index + 1) + ((currentPage - 1) * pageSize) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="name" label="Title" />
                <el-table-column prop="settlement.name" label="Settlement" />
                <el-table-column prop="date" label="Date" :formatter="formatEndDate" />
                <el-table-column prop="user.name" label="User" />
                <el-table-column prop="size" label="Size(Mb)" />
                
                <el-table-column label="Actions" width="250">
                  <template #default="{ row }">
                    <PermissionWrapper :permissions="['document:update', 'document:delete', 'document:read']">
                      <TableActions :item="row" :buttons="action_buttons" @edit="editDocument" @delete="removeDocument" @preview="viewDocument" @download="downloadFile" />
                    </PermissionWrapper>
                  </template>
                </el-table-column>
              </el-table>

              <div class="pagination-wrapper" v-if="totalDocs > 10">
                <el-pagination
                  :page-size="10" 
                  background 
                  small 
                  layout="prev, pager, next" 
                  :total="totalDocs"
                  @current-change="handlePageChange" 
                />
              </div>
            </el-collapse-item>
          </el-collapse>

          <PermissionWrapper :permissions="['document:create']">
            <el-button 
              class="full-width" 
              style="margin-left: 10px;margin-bottom: 5px;margin-top: 5px" 
              type="success" 
              size="small" 
              @click="toggleComponent(groupName)" 
              :icon="UploadFilled"
            > 
              Upload {{ groupName }} files 
            </el-button>
          </PermissionWrapper>
        </el-collapse-item>
      </el-collapse>
    </div>

    <el-dialog v-model="dialogVisible" :title="documentName" width="25%" :before-close="handleClose">

      <el-form :model="documentForm" label-width="120px" label-position="left">

        <el-form-item label="Name">
          <el-input v-model="documentForm.name" />
        </el-form-item>



        <el-form-item label="Type">
          <el-select v-model="documentForm.category" class="m-2" placeholder="Change Type">
            <el-option v-for="item in docCategories" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="Parent Type">

          <el-select :onChange="handleSelectType" v-model="documentForm.parent_id" class="m-2" placeholder="Select">
            <el-option-group v-for=" group in uploadOptions" :key="group.label" :label="group.label">
              <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
            </el-option-group>
          </el-select>
        </el-form-item>

        <el-form-item  v-if="!hide_parent" :label="parentTitle" >

          <el-select v-model="documentForm[document_field]" placeholder="Select" clearable filterable>
            <el-option v-for="item in parentOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>





      </el-form>



      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">Cancel</el-button>
          <el-button type="primary" :disabled="disable_submit" @click="handleSubmitData">
            Confirm
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Upload Component -->
    <UploadComponent 
      v-if="showUploadDialog"
      :showDialog="showUploadDialog"
      :filterOptions="currentGroupName"
      :umodel="'document'"
      :field="null"
      :data="[]"
      @upload-complete="handleUploadComplete"
      @upload-error="handleUploadError"
    />

  </ContentWrap>
</template>
<style scoped>
/* Common Document Types Cards */
.common-types-section {
  margin: 24px 0;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #f0f0f0;
}

.common-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.common-type-card {
  background: white;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.common-type-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border-color: #409eff;
}

.common-type-card.active-filter {
  border-color: #67c23a !important;
  background-color: #f0f9ff;
  box-shadow: 0 4px 16px rgba(103, 194, 58, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-count {
  text-align: right;
}

.count-number {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
}

.count-label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.card-content {
  margin-bottom: 16px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.card-description {
  font-size: 14px;
  color: #606266;
  margin: 0;
  line-height: 1.4;
}

.card-actions {
  display: flex;
  gap: 8px;
}

/* Other Document Types Section */
.other-types-section {
  margin-top: 32px;
}

/* Search Input */
.search-section {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 24px;
}

.search-input {
  flex: 1;
}

/* Existing Styles */
.collapsible-header-icon {
  margin-right: 8px;
}

.collapsible-nested-header-icon {
  margin-right: 8px;
  margin-left: 20px;
}

.collapsible-header-text {
  vertical-align: middle;
  font-size: 16px;
}

.collapsible-header-style {
  background-color: #a8a0a0;
}

.format-header-text {
  vertical-align: middle;
  font-size: 14px;
}

.doc-list {
  margin-left: 30px;
}

.doc-info {
  display: flex;
  flex-direction: column;
  margin-left: 12px;
}

.doc-title {
  font-weight: bold;
}

.doc-author {
  margin-top: 5px;
}

.doc-date {
  margin-top: 5px;
  font-size: 12px;
  color: #888;
}

.item {
  margin-top: 40px;
  margin-right: 40px;
}

.el-divider {
  margin: 5px 0;
  border-top: 1px solid #dcdfe6;
}

.pagination-wrapper {
  margin-top: 5px;
  display: flex;
  justify-content: center;
}

.thin-rows-table .el-table__body tr {
  height: 10px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .common-types-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .common-type-card {
    padding: 16px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .card-count {
    text-align: left;
  }
  
  .card-actions {
    flex-direction: column;
  }
}
</style>

<style scoped>
.thin-rows-table .el-table__body tr {
  height: 10px; /* You can adjust the height according to your preference */
}
</style>