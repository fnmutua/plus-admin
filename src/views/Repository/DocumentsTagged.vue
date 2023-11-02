<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { getSettlementListByCounty } from '@/api/settlements'
import { ElButton, ElBadge } from 'element-plus'
import {
  Position, View, Plus, User, TopRight, Briefcase, Download, Delete, Edit,
  Filter, InfoFilled, CopyDocument, Search, Setting, Loading
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

import { getSummarybyFieldFromMultipleIncludes } from '@/api/summary'
import { getCountyListApi, getListWithoutGeo } from '@/api/counties'
import { getFile } from '@/api/summary'


const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)

// // Hide buttons if not admin 
const userIsAdmin = ref(false)

if (userInfo.roles.includes("admin") || userInfo.roles.includes("super_admin")) {
  userIsAdmin.value = true
}




console.log("userInfo--->", userInfo)
console.log("userIsAdmin--->", userIsAdmin)

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




//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']

const model = 'document'

const associated_multiple_models = ['project', 'indicator_category_report', 'document_type']
//// ------------------parameters -----------------------////
const nested_models = ['settlement', 'county'] // The mother, then followed by the child

const { t } = useI18n()


const groups = ref()


const totalDocs = ref()
const filters = ref([])
const filterValues = ref([])
const searchTerm = ref('')
const currentlyFiltered = ref(false)
const downloading = ref(false)





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
  return data.reduce((result, item) => {
    const { group, type, count } = item;
    if (!result[group]) {
      result[group] = {};
    }
    result[group][type] = count;
    return result;
  }, {});
}


const getCategoryCounts = async () => {
  loading.value = true
  const formData = {}
  formData.model = 'document'
  formData.summaryField = 'document_type.group'
  formData.summaryFunction = 'count'
  //formData.assoc_models = ['county']
  formData.assoc_models = associated_multiple_models
  formData.groupFields = ['document_type.group', 'document_type.type']

  formData.filterField = []
  formData.filterValue = []
  formData.filterOperator = ['eq']

  console.log('Filter FormData : ', formData)
  const response = await getSummarybyFieldFromMultipleIncludes(formData);
  console.log('groups...', response)
  loading.value = false

  groups_v2.value = reformatData(response.Total)

  console.log('groups_v2', groups_v2.value)

  console.log('groups_v1', groups)
}

const getFilteredDataV2 = async () => {
  //loading.value = true
  const formData = {}
  formData.limit = 5
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
        // console.log("userIsAdmin.value", userIsAdmin.value)
        // console.log("createdBy", doc.createdBy === userInfo.id || !doc.protectedFile)

        if (doc.createdBy === userInfo.id || userIsAdmin.value) {
          doc.deletable = true

        } else {
          doc.deletable = false
        }
        console.log("Deletable", doc.deletable)

        if (userIsAdmin.value) {
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

const docTypes = ref([])
const getDocumentTypes = async () => {

  try {
    const response = await getListWithoutGeo({
      params: {
        curUser: 1,
        model: 'document_type',
        associated_multiple_models: [],
        searchField: 'name',
        searchKeyword: '',
        sort: 'ASC'
      }
    });

    console.log('Doc Types', response.data)
    docTypes.value = response.data

  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

getDocumentTypes()
getCategoryCounts()













const handlePageChange = async (newPage) => {

  currentPage.value = newPage;
  await getFilteredDataV2()
}


const getFilteredCategoryCounts = async (filterIDs) => {

  const formData = {}
  formData.model = 'document'
  formData.summaryField = 'document_type.group'
  formData.summaryFunction = 'count'
  //formData.assoc_models = ['county']
  formData.assoc_models = associated_multiple_models
  formData.groupFields = ['document_type.group', 'document_type.type']

  formData.filterField = ['id']
  formData.filterValue = [filterIDs]
  formData.filterOperator = ['eq']

  console.log('Filter FormData : ', formData)
  const response = await getSummarybyFieldFromMultipleIncludes(formData);
  console.log('groups.Filtredt..', response)


  groups_v2.value = reformatData(response.Total)

  console.log('groups_v2', groups_v2.value)

  console.log('groups_v1', groups)
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
            // console.log("userIsAdmin.value", userIsAdmin.value)
            console.log("doc", doc.id)
            resultsIDs.push(doc.id)

            if (doc.createdBy === userInfo.id || userIsAdmin.value) {
              doc.deletable = true

            } else {
              doc.deletable = false
            }
            console.log("Deletable", doc.deletable)




            if (userIsAdmin.value) {
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
  downloading.value = true
  console.log(data)
  console.log(data.row.name)
 

  const formData = {}

  let fname 
  const filename = data.row.name;
      // Check if the filename has an extension
      if (!/\.\w+$/.test(filename)) {
         fname=filename + '.'+data.row.format
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
      //link.setAttribute('download', data.row.name + data.row.format )
      const filename = data.row.name;
      // Check if the filename has an extension
      if (!/\.\w+$/.test(filename)) {
        link.setAttribute('download', `${filename}.${data.row.format}`);
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
  const documentUrl = data.url; // Use 'data.url' to access the document URL

  const formData = {};
 

  
  let fname 
  const filename = data.row.name;
      // Check if the filename has an extension
      if (!/\.\w+$/.test(filename)) {
         fname=filename + '.'+data.row.format
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
  console.log('----->', data.row)
  let formData = {}
  formData.id = data.row.id
  formData.model = 'document'
  formData.filesToDelete = [data.row.name]
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
  console.log('Edit', data.row)

  // Copy all properties from data.row to documentForm
  for (const key in data.row) {
    if (Object.prototype.hasOwnProperty.call(data.row, key)) {
      if (key === "name") {
        // If the property name is "name" and contains a dot, strip the text after the dot
        const propertyName = data.row[key].split('.')[0];
        console.log(propertyName)
        documentForm['name'] = data.row[key].split('.')[0];
      } else {
        documentForm[key] = data.row[key];
      }
    }
  }


  console.log('documentForm', documentForm)
  documentName.value = "Editing: " + data.row.name

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
        countyOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
      }

      else {
        countyOpt.label = arrayItem.title + '(' + arrayItem.id + ')'

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




</script>

<template>
  <ContentWrap
:title="t('Document Repository')" :message="t('Use the filters to subset')" v-loading="loading"
    element-loading-text="Getting the documents.......">
    <el-input
v-model="searchTerm" placeholder="Search documents by name/settlement/county/format" class="search-input"
      clearable @change="handleInputChange" @clear="getCategoryCounts" />
    <el-collapse accordion>
      <el-collapse-item v-for="(group, groupName) in groups_v2" :key="groupName">
        <template #title>
          <Icon icon="material-symbols:folder-open-outline" class="collapsible-header-icon  " width="48" />
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

            <el-table :data="filterLiveDocs" v-loading="downloading" style="width: 100%; margin-left: 30px" size="small">
              <el-table-column label="#" type="index" width="50">
                <template #default="{ $index }">
                  <span>{{ ($index + 1) + ((currentPage - 1) * pageSize) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="Title" />
              <el-table-column prop="settlement.name" label="Settlement" />
              <el-table-column prop="settlement.county.name" label="County" />
              <el-table-column prop="size" label="Size(Mb)" />
              <el-table-column label="Action">
                <template #default="scope">
                  <!-- <el-button   @click="downloadFile(scope)" type="primary" icon="el-icon-download">Download</el-button> -->
                  <el-button v-if="scope.row.deletable" type="success" @click="editDocument(scope)" :icon="Edit" circle />
                  <el-button type="warning" @click="downloadFile(scope)" :icon="Download" circle />

                  <el-button type="primary"  @click="viewDocument(scope.row)"  :icon="TopRight" circle />

                  <el-button
v-if="scope.row.deletable" type="danger" @click="removeDocument(scope)" :icon="Delete"
                    circle />




                </template>
              </el-table-column>
            </el-table>


            <div class="pagination-wrapper" v-if="totalDocs > 5">
              <el-pagination
:page-size="5" background small layout="prev, pager, next" :total="totalDocs"
                @current-change="handlePageChange" />

            </div>
          </el-collapse-item>
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

  </ContentWrap>
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
</style>

