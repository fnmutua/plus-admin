<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
 import { useI18n } from '@/hooks/web/useI18n'
import { getSettlementListByCounty } from '@/api/settlements'
import { ElButton, ElBadge, ElRow, ElCol, ElCard,ElTable, ElTableColumn,ElCheckbox, ElCollapse, ElCollapseItem, ElPagination, ElDialog,
  ElFormItem, ElInput, ElMessage, ElSelect, ElOption, ElForm, ElOptionGroup, ElDrawer, ElDivider, ElSwitch, ElSlider, ElInputNumber } from 'element-plus'
import {
    UploadFilled,
    Loading,
    Document,
    Setting
} from '@element-plus/icons-vue'

import { ref, reactive, computed } from 'vue'
 
import { useCache } from '@/hooks/web/useCache'
import { updateOneRecord, deleteDocument, getDocumentsBySearch } from '@/api/settlements'


import moment from "moment";
import { defineAsyncComponent } from 'vue';



import { getSummarybyFieldFromMultipleIncludes } from '@/api/summary'
import { getListWithoutGeo } from '@/api/counties'
import { getFile } from '@/api/summary'
import { askAIDocument, getAIProviders, getAIModels, processExistingDocumentsWithAI } from '@/api/ai'

import { useAppStore } from '@/store/modules/app'


import UploadComponent from '@/views/Components/UploadComponent.vue';
import TableActions from '@/views/Components/TableActions.vue';
import { Icon } from '@iconify/vue';

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
const loadingText = ref('Loading documents...')
const canCancel = ref(false)

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
const downloading = ref(false)
const selectedGroup = ref('') // Track which group is selected from card click
const activeCollapse = ref('') // Track which collapse item is active





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

const loadAIConfig = () => {
  const saved = localStorage.getItem('aiConfig')
  if (saved) {
    try {
      const config = JSON.parse(saved)
      Object.assign(aiConfig, config)
    } catch (error) {
      console.error('Error loading AI config:', error)
    }
  }
  // Fetch providers and models from backend
  fetchAIProviders()
}

const saveAIConfig = () => {
  try {
    localStorage.setItem('aiConfig', JSON.stringify(aiConfig))
  } catch (error) {
    console.error('Error saving AI config:', error)
  }
}

const getCategoryCounts = async () => {
  loading.value = true
  const formData = {}
  formData.model = 'document'
  formData.summaryField = 'document_type.group'
  formData.summaryFunction = 'count'
  //formData.assoc_models = ['county']
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


console.log('joinedArray',joinedArray)


  groups_v2.value = reformatData(joinedArray)

  
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
  loading.value = true
  loadingText.value = 'Fetching documents from server...'
  canCancel.value = true
  const formData = {}
  formData.limit = 10
  formData.page = currentPage.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model
  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  // Add sorting parameters - sort by creation date descending (latest first)
  formData.sortField = 'createdAt'
  formData.sortOrder = 'DESC'

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



    })
    .catch(error => {
      console.error('Error fetching data:', error)
      ElMessage.error('Failed to load documents')
    })
    .finally(() => {
      loading.value = false
      canCancel.value = false
    })

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
  loadingText.value = `Loading ${type} documents...`
  canCancel.value = true
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
    canCancel.value = false
  }
  else {
    // Add loading state for filtered data
    filterLiveDocs.value = []
    // Simulate a small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 100))
    filterLiveDocs.value = filterLiveDocsBackup.value.filter(obj => obj['document_type.type'] === type);
    loading.value = false
    canCancel.value = false

  }
}

// Handle collapse state changes to clear data when collapsed
const handleCollapseChange = (activeNames) => {
  console.log('Collapse changed:', activeNames)
  
  // If no collapse items are active, clear the data
  if (!activeNames || activeNames.length === 0) {
    filterLiveDocs.value = []
    filterLiveDocsBackup.value = []
    totalDocs.value = 0
    currentPage.value = 1
    currentlyFiltered.value = false
  }
}

function getIconForGroup(groupName) {
  switch (groupName) {
    case 'Total Documents':
      return 'material-symbols:folder-special';
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
  loadingText.value = 'Searching documents...'
  canCancel.value = true


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
          canCancel.value = false
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
          canCancel.value = false
        }




      })
      .catch(error => {
        console.error('Error searching documents:', error)
        ElMessage.error('Search failed')
        loading.value = false
        canCancel.value = false
      });

  }

  else {
    getCategoryCounts()
    loading.value = false
    canCancel.value = false
  }




}





const downloadFile = async (data) => {
  downloading.value = true
  console.log(data)
  console.log(data.name)
 

  const formData = {}

  let fname 
  const filename = data.name;
      // Check if the filename has an extension
      if (!/\.\w+$/.test(filename)) {
         fname=filename + '.'+data.format
      } else {
        fname = filename

      }

  formData.filename =fname
  console.log("file name:", formData)


  formData.responseType = 'blob'
  await getFile(formData)
    .then(response => {
      console.log(response)
      downloading.value = false
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      //link.setAttribute('download', data.name + data.format )
      const filename = data.name;
      // Check if the filename has an extension
      if (!/\.\w+$/.test(filename)) {
        link.setAttribute('download', `${filename}.${data.format}`);
        console.log("file name has no extension")
      } else {
        link.setAttribute('download', filename);
        console.log("file name has   extension")

      }

      document.body.appendChild(link)
      link.click()
      downloading.value = false

    })
    .catch(error => {
      console.error('Error downloading file2:', error);
      ElMessage.error('Download failed.');

      downloading.value = false

    });

}

const viewDocument = async (data) => {
  downloading.value=true
 
  const formData = {};
 

  
  let fname 
  const filename = data.name;
      // Check if the filename has an extension
      if (!/\.\w+$/.test(filename)) {
         fname=filename + '.'+data.format
      } else {
        fname = filename

      }
      formData.filename =fname


  formData.doc_id = data.id;
  formData.responseType = 'blob';

  try {
    const response = await getFile(formData);
    const blobData = new Blob([response.data], { type: response.headers['content-type'] });
    const url = window.URL.createObjectURL(blobData);
    const newTab = window.open(url, '_blank');

    if (newTab) {
      // Attach a load event listener to the new tab's window object
      newTab.addEventListener('load', () => {
        // The new tab has fully loaded
        console.log('New tab has fully loaded.');
        downloading.value=false
      });
    } else {
      console.error('Failed to open a new tab.');
      ElMessage.error('Failed to open the document.');
      downloading.value=false
    }
  } catch (error) {
    console.error(error);
    ElMessage.error('Failed to load the document.');
    downloading.value=false
  }
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




/// Uplaod docuemnts from a central component 

const currentRow = ref()
const addMoreDocuments = ref(false)

// AI Configuration Drawer
const aiConfigDrawer = ref(false)
const aiConfig = reactive({
  provider: 'openai',
  model: 'gpt-3.5-turbo'
})

const aiProviders = ref([])
const availableModels = ref([])

// Fetch providers and models from backend
const fetchAIProviders = async () => {
  try {
    const response = await getAIProviders()
    if (response.success && response.data) {
      aiProviders.value = response.data
      // Set default provider if available
      if (aiProviders.value.length > 0 && !aiProviders.value.find(p => p.id === aiConfig.provider)) {
        aiConfig.provider = aiProviders.value[0].id
      }
      await fetchAIModels()
    } else {
      // Fallback to default providers if API fails
      aiProviders.value = [
        { id: 'xai', name: 'X-AI', description: 'Grok GPT models', isAvailable: true },
        { id: 'openai', name: 'OpenAI', description: 'OpenAI GPT models', isAvailable: true },
        { id: 'ollama', name: 'Ollama (Local)', description: 'Local AI models', isAvailable: true }
      ]
      setDefaultModels()
    }
  } catch (error) {
    console.error('Error fetching AI providers:', error)
    // Fallback to default providers
    aiProviders.value = [
      { id: 'xai', name: 'X-AI', description: 'Grok GPT models', isAvailable: true },
      { id: 'openai', name: 'OpenAI', description: 'OpenAI GPT models', isAvailable: true },
      { id: 'ollama', name: 'Ollama (Local)', description: 'Local AI models', isAvailable: true }
    ]
    setDefaultModels()
  }
}

const fetchAIModels = async () => {
  try {
    const response = await getAIModels()
    if (response.success && response.data) {
      // Filter models for current provider
      availableModels.value = response.data.filter(model => model.provider === aiConfig.provider)
      // Set default model if current one is not available
      if (availableModels.value.length > 0 && !availableModels.value.find(m => m.id === aiConfig.model)) {
        aiConfig.model = availableModels.value[0].id
      }
    } else {
      setDefaultModels()
    }
  } catch (error) {
    console.error('Error fetching AI models:', error)
    setDefaultModels()
  }
}

const setDefaultModels = () => {
  const defaultModels = {
    openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
    anthropic: ['claude-3-sonnet', 'claude-3-opus', 'claude-3-haiku'],
    ollama: ['llama2', 'mistral', 'codellama', 'neural-chat'],
    xai: ['grok-3-mini-fast', 'grok-3-mini', 'grok-3', 'grok-beta', 'grok-pro']
  }
  availableModels.value = (defaultModels[aiConfig.provider] || []).map(model => ({
    id: model,
    name: model,
    provider: aiConfig.provider,
    maxTokens: 4000,
    isAvailable: true
  }))
  
  // Set default model if current one is not available
  if (availableModels.value.length > 0 && !availableModels.value.find(m => m.id === aiConfig.model)) {
    aiConfig.model = availableModels.value[0].id
  }
}

const handleProviderChange = () => {
  fetchAIModels()
  saveAIConfig()
}

const handleModelChange = () => {
  saveAIConfig()
}

// Chat functionality
const chatMessages = ref([])
const currentQuestion = ref('')
const isProcessing = ref(false)
const sessionId = ref('default')
const expandedSources = ref(new Set()) // Track which message sources are expanded

// Process existing documents functionality
const isProcessingExisting = ref(false)
const forceReprocess = ref(false)
const processExistingDocuments = async () => {
  isProcessingExisting.value = true
  try {
    const response = await processExistingDocumentsWithAI({ 
      processAll: true,
      forceReprocess: forceReprocess.value 
    })
    
    if (response.success) {
      const data = response.data || response
      const message = `AI processing completed! Processed: ${data.processed}, Failed: ${data.failed}, Already Processed: ${data.alreadyProcessed || 0}`
      ElMessage.success(message)
    } else {
      ElMessage.error(response.message || 'Failed to start AI processing')
    }
  } catch (error) {
    console.error('Error processing existing documents:', error)
    ElMessage.error('Error: ' + (error.message || error))
  } finally {
    isProcessingExisting.value = false
  }
}

const mfield = null
const ChildComponent = defineAsyncComponent(() => import('@/views/Components/UploadComponent.vue'));
const selectedRow = ref([])
const dynamicComponent = ref();
 const componentProps = ref({
      message: 'Hello from parent',
      showDialog:addMoreDocuments,
      data:currentRow.value,
      umodel:null,
      field:mfield,
      filterOptions:null
    });


    function toggleComponent(groupName) {
  console.log('Compnnent data', [])
      componentProps.value.data=[];
      componentProps.value.filterOptions=groupName;
      dynamicComponent.value = null; // Unload the component
      addMoreDocuments.value = true; // Set any additional props
 
      setTimeout(() => {
        dynamicComponent.value = ChildComponent; // Load the component
  }, 100); // 0.1 seconds


    }




getDocumentTypes()

// Load AI configuration on component mount
loadAIConfig()

// Add computed property for top 4 groups
const top4Groups = computed(() => {
  if (!groups_v2.value || Object.keys(groups_v2.value).length === 0) {
    return [];
  }
  
  // Convert groups_v2 to array and calculate total count for each group
  const groupsArray = Object.entries(groups_v2.value).map(([groupName, types]) => {
    // Properly sum all document type counts within this group
    const totalCount = Object.values(types).reduce((sum, count) => {
      // Ensure count is a number and add it to sum
      const numericCount = typeof count === 'number' ? count : parseInt(count) || 0;
      return sum + numericCount;
    }, 0);
    
    return {
      name: groupName,
      count: totalCount,
      types: types
    };
  });
  
  // Calculate total documents across all groups
  const totalDocuments = groupsArray.reduce((sum, group) => sum + group.count, 0);
  
  // Sort by count descending and take top 3 categories
  const top3Categories = groupsArray
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  
  // Create the result array: [Total, Top3 Categories]
  const result = [
    {
      name: 'Total Documents',
      count: totalDocuments,
      types: {},
      isTotal: true
    },
    ...top3Categories
  ];
  
  return result;
});

// Handle card click to filter by group
const handleCardClick = async (groupName) => {
  loading.value = true;
  console.log('Card clicked for group:', groupName);
  
  // Set the selected group and active collapse
  selectedGroup.value = groupName;
  activeCollapse.value = groupName;
  
  // Clear current data and filters
  filterLiveDocs.value = [];
  filterLiveDocsBackup.value = [];
  filters.value = [];
  filterValues.value = [];
  
  // If "Total Documents" is clicked, show all documents without filtering
  if (groupName === 'Total Documents') {
    await getFilteredDataV2();
    currentlyFiltered.value = true;
    loading.value = false;
    return;
  }
  
  // Get all document types for this group
  const groupTypes = groups_v2.value[groupName];
  const typeIds = [];
  
  // Find the document type IDs for all types in this group
  Object.keys(groupTypes).forEach(typeName => {
    const docType = docTypes.value.find(dt => dt.type === typeName);
    if (docType) {
      typeIds.push(docType.id);
    }
  });
  
  if (typeIds.length > 0) {
    // Set filters to show documents from this group
    filters.value = ['category'];
    filterValues.value = [typeIds];
    
    await getFilteredDataV2();
    
    // Set currentlyFiltered to true so the data shows in the table
    currentlyFiltered.value = true;
  }
  
  loading.value = false;
};

// Show All button when a group is selected
const showAllGroups = () => {
  selectedGroup.value = '';
  activeCollapse.value = '';
  getCategoryCounts();
};

// Get color for group
const getColorForGroup = (groupName) => {
  switch (groupName.toLowerCase()) {
    case 'total documents':
      return '#f11634'; // Red color for total documents
    case 'reports':
      return '#409eff';
    case 'checklists':
      return '#67c23a';
    case 'maps':
      return '#e6a23c';
    case 'data':
      return '#f56c6c';
    case 'engineering':
      return '#909399';
    case 'plans':
      return '#9c27b0';
    default:
      return '#409eff';
  }
}

// Get star rating for category cards (1-3 stars based on ranking)
const getStarRating = (groupName) => {
  if (groupName === 'Total Documents') return 5; // 5 stars for total documents
  
  // Get the top 3 categories
  const groupsArray = Object.entries(groups_v2.value || {}).map(([name, types]) => {
    const totalCount = Object.values(types).reduce((sum, count) => {
      const numericCount = typeof count === 'number' ? count : parseInt(count) || 0;
      return sum + numericCount;
    }, 0);
    return { name, count: totalCount };
  });
  
  const top3Categories = groupsArray
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  
  // Find the position of this category (1-based)
  const position = top3Categories.findIndex(cat => cat.name === groupName) + 1;
  
  // Return stars based on position (3 stars for 1st, 2 for 2nd, 1 for 3rd)
  return position > 0 ? 4 - position : 0;
}

// Custom loading component with cancel option
const CustomLoading = {
  name: 'CustomLoading',
  props: {
    text: {
      type: String,
      default: 'Loading...'
    },
    canCancel: {
      type: Boolean,
      default: false
    }
  },
  emits: ['cancel'],
  setup(props, { emit }) {
    const handleCancel = () => {
      emit('cancel')
    }
    
    return {
      handleCancel
    }
  },
  template: `
    <div style="text-align: center; padding: 20px;">
      <el-icon class="is-loading" style="font-size: 24px; color: #409eff; margin-bottom: 16px;">
        <Loading />
      </el-icon>
      <p style="margin: 16px 0; color: #606266;">{{ text }}</p>
      <el-button 
        v-if="canCancel" 
        @click="handleCancel" 
        size="small" 
        type="danger"
        style="margin-top: 8px;"
      >
        Cancel
      </el-button>
    </div>
  `
}

// Handle loading cancel
const handleLoadingCancel = () => {
  loading.value = false
  loadingText.value = 'Loading documents...'
  canCancel.value = false
  // Clear any ongoing operations
  filterLiveDocs.value = []
  filterLiveDocsBackup.value = []
  totalDocs.value = 0
  currentPage.value = 1
  currentlyFiltered.value = false
  ElMessage.info('Operation cancelled')
}

// AI Configuration Functions
const openAIConfig = () => {
  aiConfigDrawer.value = true
}

// Chat Functions
const sendQuestion = async () => {
  if (!currentQuestion.value.trim() || isProcessing.value) return
  
  const question = currentQuestion.value.trim()
  
  // Add user message
  chatMessages.value.push({
    type: 'user',
    content: question,
    timestamp: new Date()
  })
  
  currentQuestion.value = ''
  isProcessing.value = true
  
  try {
    // Use the actual AI API
    const response = await askAIDocument({
      question,
      sessionId: sessionId.value,
      provider: aiConfig.provider,
      model: aiConfig.model
    })
    
    // Check if response is successful and has the expected structure
    if (response.success && response.answer) {

      console.log('Response', response)
      chatMessages.value.push({
        type: 'ai',
        content: response.answer || 'No response received from AI',
        sources: response.sources || [],
        tokens: response.tokens || 0,
        timestamp: new Date()
      })
    } else if (response.success && response.data && response.data.answer) {
      // Handle case where response is wrapped in data property
      chatMessages.value.push({
        type: 'ai',
        content: response.data.answer || 'No response received from AI',
        sources: response.data.sources || [],
        tokens: response.data.tokens || 0,
        timestamp: new Date()
      })
    } else {
      // Handle API error response
      const errorMessage = response.message || response.error || 'Unknown error occurred'
      chatMessages.value.push({
        type: 'ai',
        content: `Error: ${errorMessage}`,
        timestamp: new Date()
      })
    }
  } catch (error) {
    console.error('Error in sendQuestion:', error)
    const errorMessage = error instanceof Error ? error.message : 'Network error occurred'
    chatMessages.value.push({
      type: 'ai',
      content: `Error: ${errorMessage}`,
      timestamp: new Date()
    })
  } finally {
    isProcessing.value = false
  }
}

const clearChatHistory = () => {
  chatMessages.value = []
  ElMessage.success('Chat history cleared')
}

const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString()
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const toggleSources = (messageIndex) => {
  if (expandedSources.value.has(messageIndex)) {
    expandedSources.value.delete(messageIndex)
  } else {
    expandedSources.value.add(messageIndex)
  }
}

</script>

<template>
  <el-card
 v-loading="loading"
    element-loading-text="Getting the documents.......">

    <!-- Card Header with Title and AI Configuration Button -->
    <template #header>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h3 style="margin: 0; color: #303133;">{{ t('Document Repository') }}</h3>
          <p style="margin: 4px 0 0 0; color: #909399; font-size: 14px;">{{ t('Use the filters to subset') }}</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <el-button @click="$router.push('/repository/ai-chat')" type="success" plain size="small">
            <Icon icon="material-symbols:smart-toy" width="16" style="margin-right: 4px;" />
            AI Chat Interface
          </el-button>
          <el-button @click="openAIConfig" type="primary" plain size="small">
            <Icon icon="material-symbols:settings" width="16" style="margin-right: 4px;" />
            AI Configuration
          </el-button>
        </div>
      </div>
    </template>

    <!-- Top 4 Groups Cards -->
    <el-row :gutter="16" class="cards-row" v-if="top4Groups.length > 0">
      <el-col v-for="group in top4Groups" :key="group.name" :xs="24" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover" class="stat-card" :body-style="{ padding: '0' }" @click="handleCardClick(group.name)">
          <div class="card-content">
            <div class="icon-container" :style="{ backgroundColor: getColorForGroup(group.name) + '15' }">
              <Icon :icon="getIconForGroup(group.name)" width="32" :color="getColorForGroup(group.name)" />
            </div>
            <div class="card-value">
              <p class="value-text">{{ group.count }}</p>
              <p class="value-label">{{ formatText(group.name) }}</p>
              <!-- Star rating for all cards -->
              <div v-if="getStarRating(group.name) > 0" class="star-rating">
                <Icon 
                  v-for="star in getStarRating(group.name)" 
                  :key="star" 
                  icon="material-symbols:star" 
                  width="16" 
                  :color="group.name === 'Total Documents' ? '#ff6b35' : '#ffd700'"
                />
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div v-if="dynamicComponent">
      <upload-component :is="dynamicComponent" v-bind="componentProps"/>
    </div>
    <el-input
v-model="searchTerm" placeholder="Search documents by name/settlement/county/format/uploader name" class="search-input"
      clearable @change="handleInputChange" @clear="getCategoryCounts" />
    
    <!-- Show All button when a group is selected -->
    <div v-if="selectedGroup" style="margin-bottom: 16px;margin-top: 16px;">
      <el-button @click="showAllGroups" type="primary" plain>
        <Icon icon="material-symbols:arrow-back" width="16" style="margin-right: 4px;" />
        Show All Groups
      </el-button>
      <span class="showing-text">Showing: <strong>{{ formatText(selectedGroup) }}</strong></span>
    </div>
    
    <el-collapse v-model="activeCollapse" accordion @change="handleCollapseChange">
      <el-collapse-item v-for="(group, groupName) in groups_v2" :key="groupName" v-show="!selectedGroup || groupName === selectedGroup" :name="groupName">
        <template #title>
          <Icon icon="material-symbols:folder-open-outline" class="collapsible-header-icon" width="30" />
          <span class="collapsible-header-text">{{ formatText(groupName) }}</span>
        </template>
        <el-collapse accordion>
          <el-collapse-item v-for="(typeCount, type) in group" :key="type">
            <template #title>
              <el-button class="collapsible-nested-header-button" type="" link @click="handleItemCollapse(type)">
                <Icon :icon="getIconForGroup(groupName)" color="gray" class="collapsible-nested-header-icon" width="24" />
                {{ formatText(type) }}
              </el-button>
              <el-badge :value="typeCount" class="collapsible-header-badge" />
            </template>

            <!-- Content area with loading state -->
            <div style="position: relative; min-height: 100px;">
              <!-- Loading overlay -->
              <div v-if="loading" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.9); z-index: 10; display: flex; align-items: center; justify-content: center;">
                <CustomLoading 
                  :text="loadingText" 
                  :can-cancel="canCancel"
                  @cancel="handleLoadingCancel"
                />
              </div>

              <!-- Table with data -->
              <el-table 
                v-if="filterLiveDocs.length > 0"
                :data="filterLiveDocs" 
                v-loading="downloading" 
                style="width: 100%; margin-left: 30px" 
                size="small" 
                class="thin-rows-table" 
                border 
              >
                <el-table-column label="#" type="index" width="50">
                  <template #default="{ $index }">
                    <span>{{ ($index + 1) + ((currentPage - 1) * pageSize) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="name" label="Title" />
                <el-table-column prop="settlement.name" label="Settlement" />
                <!-- <el-table-column prop="settlement.county.name" label="County" /> -->
                <el-table-column prop="date" label="Date" :formatter="formatEndDate" />
                 <el-table-column prop="user.name" label="User" />
                <el-table-column prop="size" label="Size(Mb)" />
              



                
          <el-table-column label="Actions" width="250">
            <template #default="{ row }">
              <TableActions :item="row" :buttons="action_buttons" @edit="editDocument" @delete="removeDocument"   @preview="viewDocument"  @download="downloadFile" />
            </template>
          </el-table-column>



              </el-table>

              <!-- No data message -->
              <div v-else-if="!loading && filterLiveDocs.length === 0" style="text-align: center; padding: 20px; color: #909399;">
                <p>No documents found for this category</p>
              </div>


              <div class="pagination-wrapper" v-if="totalDocs > 10 && filterLiveDocs.length > 0 && !loading">
                <el-pagination
:page-size="10" background small layout="prev, pager, next" :total="totalDocs"
                  @current-change="handlePageChange" />

              </div>
            </div>
    
          </el-collapse-item>
         

          <el-button  v-if="showAdminButtons" class="full-width"   style="margin-left: 10px;margin-bottom: 5px ;margin-top: 5px"  type="success"   size="small"   @click="toggleComponent(groupName)" :icon="UploadFilled"> Upload {{ groupName }} files </el-button>

        </el-collapse>

      </el-collapse-item>
    </el-collapse>

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

    <!-- AI Configuration Drawer -->
    <el-drawer
      v-model="aiConfigDrawer"
      direction="rtl"
      size="50%"
      :before-close="() => aiConfigDrawer = false"
    >
      <!-- Custom Header with Provider & Model Selection -->
      <template #header>
        <div style="width: 100%;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0; color: #303133;">🤖 AI Document Assistant</h3>
          </div>
          <!-- Provider & Model Selection in Header -->
          <div style="display: flex; gap: 10px; align-items: center; justify-content: space-between;">
            <div style="display: flex; gap: 10px; align-items: center;">
              <el-select 
                v-model="aiConfig.provider" 
                placeholder="Provider" 
                style="width: 120px" 
                size="small"
                @change="handleProviderChange"
              >
                <el-option
                  v-for="provider in aiProviders"
                  :key="provider.id"
                  :label="provider.name"
                  :value="provider.id"
                />
              </el-select>
              
              <el-select 
                v-model="aiConfig.model" 
                placeholder="Model" 
                style="width: 180px" 
                size="small"
                @change="handleModelChange"
              >
                <el-option
                  v-for="model in availableModels"
                  :key="model.id"
                  :label="model.name"
                  :value="model.id"
                />
              </el-select>
            </div>
            
            <div style="display: flex; gap: 10px; align-items: center;">
              <!-- Clear History Button -->
              <el-button @click="clearChatHistory" type="info" plain size="small">
                Clear History
              </el-button>
              
              <!-- Admin-only: Process Existing Documents Button -->
              <div  style="display: flex; flex-direction: column; gap: 8px; align-items: flex-end;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <el-checkbox 
                    v-model="forceReprocess" 
                    size="small"
                    style="font-size: 12px;"
                  >
                    Force Reprocess
                  </el-checkbox>
                </div>
                <el-button 
                  type="warning" 
                  size="small" 
                  :loading="isProcessingExisting"
                  @click="processExistingDocuments"
                >
                  <Icon icon="material-symbols:bolt" width="18" style="margin-right: 4px;" />
                  Process All Existing Documents with AI
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </template>
      
      <div style="padding: 20px; height: 100%; display: flex; flex-direction: column;">
        
        <!-- Chat Section - Now takes full available space -->
        <div style="flex: 1; display: flex; flex-direction: column;">
          
          <!-- Chat Messages -->
          <div style="flex: 1; overflow-y: auto; background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
            <div v-if="chatMessages.length === 0" style="text-align: center; color: #909399; font-style: italic; padding: 40px 20px;">
              💡 Ask me anything about your documents! I'll use semantic search to find the most relevant information.
            </div>
            
            <div v-for="(message, index) in chatMessages" :key="index" style="margin-bottom: 15px;">
              <div
                :style="{
                  padding: '10px 15px',
                  borderRadius: '8px',
                  maxWidth: '85%',
                  marginLeft: message.type === 'user' ? 'auto' : '0',
                  background: message.type === 'user' ? '#409eff' : 'white',
                  color: message.type === 'user' ? 'white' : '#303133',
                  border: message.type === 'ai' ? '1px solid #e9ecef' : 'none'
                }">
                <div style="font-size: 12px; opacity: 0.7; margin-bottom: 5px;">
                  {{ message.type === 'user' ? 'You' : 'AI Assistant' }} • {{ formatTimestamp(message.timestamp) }}
                  <span v-if="message.tokens"> • {{ message.tokens }} tokens</span>
                </div>
                <div style="line-height: 1.5;">{{ message.content }}</div>
                
                <!-- Sources Toggle Button -->
                <div v-if="message.sources && message.sources.length > 0" style="margin-top: 10px;">
                  <el-button 
                    @click="toggleSources(index)" 
                    type="text" 
                    size="small"
                    style="padding: 4px 8px; color: #409eff; font-size: 12px;"
                  >
                    <Icon 
                      :icon="expandedSources.has(index) ? 'material-symbols:expand-less' : 'material-symbols:expand-more'" 
                      width="16" 
                      style="margin-right: 4px;"
                    />
                    📚 Sources ({{ new Set(message.sources.map(s => s.filename)).size }} documents)
                  </el-button>
                </div>
                
                <!-- Sources Content (Collapsible) -->
                <div v-if="message.sources && message.sources.length > 0 && expandedSources.has(index)" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e9ecef; font-size: 12px;">
                  <div
v-for="document in Object.values(message.sources.reduce((acc, source) => {
                    if (!acc[source.filename]) {
                      acc[source.filename] = {
                        filename: source.filename,
                        chunks: [],
                        maxSimilarity: 0,
                        fileSize: source.fileSize,
                        fileType: source.fileType
                      };
                    }
                    acc[source.filename].chunks.push(source);
                    if (source.similarity && parseFloat(source.similarity) > acc[source.filename].maxSimilarity) {
                      acc[source.filename].maxSimilarity = parseFloat(source.similarity);
                    }
                    return acc;
                  }, {}))" :key="document.filename" style="background: #f8f9fa; padding: 8px; margin: 5px 0; border-radius: 4px; border-left: 3px solid #409eff;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                      <strong style="color: #303133;">{{ document.filename }}</strong>
                      <div style="display: flex; gap: 5px; align-items: center;">
                        <span v-if="document.maxSimilarity > 0" style="padding: 2px 6px; border-radius: 10px; font-size: 10px; background: #e9ecef; color: #606266;">
                          {{ (document.maxSimilarity * 100).toFixed(1) }}% match
                        </span>
                        <span style="padding: 2px 6px; border-radius: 10px; font-size: 10px; background: #f0f9ff; color: #0369a1;">
                          {{ document.chunks.length }} chunks
                        </span>
                      </div>
                    </div>
                    <div v-if="document.chunks[0].preview" style="color: #606266; font-size: 11px; line-height: 1.4; margin-top: 3px;">
                      {{ document.chunks[0].preview }}
                    </div>
                    <div style="margin-top: 3px; font-size: 10px; color: #909399;">
                      <span v-if="document.fileSize">Size: {{ formatFileSize(parseInt(document.fileSize)) }}</span>
                      <span v-if="document.fileType"> • Type: {{ document.fileType.toUpperCase() }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Loading indicator -->
            <div v-if="isProcessing" style="text-align: center; padding: 20px; color: #409eff;">
              <div style="border: 2px solid #f3f3f3; border-top: 2px solid #409eff; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
              Analyzing documents...
            </div>
          </div>
          
          <!-- Input Area -->
          <div style="display: flex; gap: 10px;">
            <el-input
              v-model="currentQuestion"
              placeholder="Ask a question about your documents..."
              type="textarea"
              :rows="2"
              @keydown.enter.prevent="sendQuestion"
              :disabled="isProcessing"
            />
            <el-button 
              @click="sendQuestion" 
              type="primary" 
              :disabled="!currentQuestion.trim() || isProcessing"
              style="align-self: flex-end;"
            >
              Send
            </el-button>
          </div>
        </div>
        
      </div>
    </el-drawer>

  </el-card>
</template>
<style scoped>
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

/* Cards Styles */
.cards-row {
  margin-bottom: 24px;
  overflow-x: hidden;
}

.stat-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  max-width: 100%;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.card-content {
  display: flex;
  align-items: center;
  padding: 20px;
  gap: 16px;
  min-width: 0;
}

.icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 12px;
  flex-shrink: 0;
}

.card-value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.value-text {
  font-size: 28px;
  font-weight: 700;
  color: #f11634;
  margin: 0 0 4px 0;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.value-label {
  font-size: 14px;
  color: #606266;
  margin: 0;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.star-rating {
  display: flex;
  align-items: center;
  margin-top: 4px;
  justify-content: flex-start;
  flex-direction: row;
  gap: 2px;
}

.showing-text {
  margin-left: 16px;
  color: #606266;
  font-size: 14px;
  padding: 8px 12px;
  background-color: var(--el-color-primary-light-9);
  border-radius: 6px;
  border-left: 3px solid var(--el-color-primary);
  color: var(--el-color-primary);
}

@media (max-width: 768px) {
  .card-content {
    padding: 16px;
    gap: 12px;
  }
  
  .icon-container {
    width: 48px;
    height: 48px;
  }
  
  .value-text {
    font-size: 24px;
  }
  
  .value-label {
    font-size: 12px;
  }
}

/* Prevent horizontal scrolling globally */
:deep(.el-row) {
  margin-left: 0 !important;
  margin-right: 0 !important;
}

:deep(.el-col) {
  padding-left: 8px !important;
  padding-right: 8px !important;
}

/* Spinner animation for AI processing */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>

<style scoped>
.thin-rows-table .el-table__body tr {
  height: 10px; /* You can adjust the height according to your preference */
}
</style>