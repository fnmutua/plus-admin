<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
 import { getSettlementListByCounty } from '@/api/settlements'
 import { ElButton, ElBadge   } from 'element-plus'
 import {
  Position, View, Plus, User, TopRight, Briefcase, Download, Delete, Edit,
  Filter, InfoFilled, CopyDocument, Search, Setting, Loading
} from '@element-plus/icons-vue'

import { ref, reactive, watch, computed } from 'vue'
import {
  ElTable, ElTableColumn, ElCollapse, ElCollapseItem, ElPagination, 
  ElFormItem, ElInput, ElMessage, ElDropdown, ElDropdownItem, ElDropdownMenu, ElPopconfirm
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
 
if (userInfo.roles.includes("admin") || userInfo.roles.includes("super_admin") ) {
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







const downloadFile = async (data) => {
  downloading.value=true
  console.log(data)
  console.log(data.row.name)

  const formData = {}
  formData.filename = data.row.name
  formData.responseType = 'blob'
  await getFile(formData)
    .then(response => {
      console.log(response)
      downloading.value=false
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', data.row.name)
      document.body.appendChild(link)
      link.click()
      downloading.value=false

    })
    .catch(error => {
      console.error('Error downloading file2:', error);
       ElMessage.error('Download failed.');

      downloading.value=false

    });

}






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
  loading.value=true
  const formData = {}
  formData.model = 'document'
  formData.summaryField = 'document_type.group'
  formData.summaryFunction = 'count'
  //formData.assoc_models = ['county']
  formData.assoc_models = associated_multiple_models
  formData.groupFields = ['document_type.group', 'document_type.type']
 
  formData.filterField =[]
  formData.filterValue =[] 
  formData.filterOperator = ['eq']

  console.log('Filter FormData : ', formData)
  const response = await getSummarybyFieldFromMultipleIncludes(formData);
  console.log('groups...', response)
  loading.value=false

  groups_v2.value=reformatData(response.Total)

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

       if(doc.createdBy === userInfo.id  || userIsAdmin.value ) {
        doc.deletable = true 
        
       } else {
        doc.deletable = false 
       }
       console.log("Deletable", doc.deletable )

        if (userIsAdmin.value) {
          return doc
        } else {

          return (doc.createdBy === userInfo.id || !doc.protectedFile)
        }

      });


        console.log(response.total)

      console.log('filteredObjs --v1', filteredObjs)

     
      filterLiveDocs.value=filteredObjs
      filterLiveDocsBackup.value=filteredObjs
      totalDocs.value=response.total
      
     

    });





}

const docTypes=ref([])
const getDocumentTypes = async () => {
 
  try {
    const response = await getListWithoutGeo({
      params: {
        curUser: 1,
        model:'document_type' ,
        associated_multiple_models: [],
        searchField: 'name',
        searchKeyword: '',
        sort: 'ASC'
      }
    });
    
    console.log('Doc Types', response.data)
    docTypes.value=response.data
   
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

formData.filterField =['id']
formData.filterValue =[filterIDs] 
formData.filterOperator = ['eq']

console.log('Filter FormData : ', formData)
const response = await getSummarybyFieldFromMultipleIncludes(formData);
console.log('groups.Filtredt..', response)


groups_v2.value=reformatData(response.Total)

console.log('groups_v2', groups_v2.value)

console.log('groups_v1', groups)
}


const handleItemCollapse = async (type) => {
 loading.value=true
  console.log('type',type)

    console.log('currentlyFiltered',currentlyFiltered)

    if (!currentlyFiltered.value) {
         // clear daata and filers  before laoding next 
      filterLiveDocs.value=[]
      filterLiveDocsBackup.value=[]
      filters.value =[]
      filterValues.value=[]
      // now run the querry 
      console.log(`Item "${type}" is uncollapsed.`);
      const SelectedDocType = docTypes.value.filter(obj => obj.type ==type);
      console.log(SelectedDocType[0].id)

        filters.value =['category']
        filterValues.value = [[SelectedDocType[0].id]]

      await getFilteredDataV2()
      loading.value=false
    } 
    else {
       filterLiveDocs.value = filterLiveDocsBackup.value.filter(obj => obj['document_type.type'] === type);
       loading.value=false

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
    loading.value=true
    
    
    if(keyword) {
      currentlyFiltered.value=true
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
              console.log('response.Total',response.Total)
              if(response.Total>150) {
                console.log("Too many..Refine")
                ElMessage.error('Too Many Results (>150). Refine your search keyword');

                loading.value=false
              } else {
                var flattenedObj = flattenArrayOfJSON(response.data);
                //create the subcategories 
                var filteredObjs = flattenedObj.filter(function (doc) {
                // console.log("userIsAdmin.value", userIsAdmin.value)
                  console.log("doc", doc.id )
                  resultsIDs.push(doc.id)

                  if(doc.createdBy === userInfo.id  || userIsAdmin.value ) {
                      doc.deletable = true 
                      
                    } else {
                      doc.deletable = false 
                    }
                    console.log("Deletable", doc.deletable )


                    

                  if (userIsAdmin.value) {
                    return doc
                  } else {
                    return (doc.createdBy === userInfo.id || !doc.protectedFile)
                  }

                });

                getFilteredCategoryCounts(resultsIDs)
            console.log('filteredObjs --v2', filteredObjs)
            filterLiveDocs.value=filteredObjs
            filterLiveDocsBackup.value=filteredObjs
            totalDocs.value=response.total
            loading.value=false
              }
               



      });

    }

    else {
      getCategoryCounts()
    }
   


 
  }

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

 
</script>

<template>
  <ContentWrap
:title="t('Document Repository')" :message="t('Use the filters to subset')" v-loading="loading"
    element-loading-text="Getting the documents.......">
    <el-input v-model="searchTerm" placeholder="Search documents by name/settlement/county/format" class="search-input" clearable  @change="handleInputChange" @clear="getCategoryCounts" />
    <el-collapse accordion>
      <el-collapse-item v-for="(group, groupName) in groups_v2" :key="groupName">
        <template #title>
              <Icon icon="material-symbols:folder-open-outline" class="collapsible-header-icon  " width="48" />
              <span class="collapsible-header-text">{{ formatText(groupName) }}</span>
            </template>
            <el-collapse accordion>
            <el-collapse-item
              v-for="(typeCount, type) in group"
              :key="type"
            >
              <template #title>
                <el-button
                  class="collapsible-nested-header-button"
                  type=""
                  link
                  @click="handleItemCollapse(type)"
                >
                  <Icon
                    :icon="getIconForGroup(groupName)"
                    color="gray"
                    class="collapsible-nested-header-icon"
                    width="36"
                  />
                  {{ formatText(type) }}
                </el-button>
                <el-badge :value="typeCount" class="collapsible-header-badge" />
              </template>

              <el-table
:data="filterLiveDocs" v-loading="downloading" 
              style="width: 100%; margin-left: 30px" size="small">
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
                  <el-button    type="success"  @click="downloadFile(scope)"  :icon="Download" circle />
                  <el-button  v-if="scope.row.deletable"  type="danger"   @click="removeDocument(scope)" :icon="Delete" circle />

                  


                </template>
              </el-table-column>
            </el-table>

            
            <div class="pagination-wrapper"  v-if="totalDocs > 5">
              <el-pagination
:page-size="5" background small layout="prev, pager, next" :total="totalDocs"
                @current-change="handlePageChange" />

              </div>
            </el-collapse-item>
          </el-collapse>

      </el-collapse-item>
    </el-collapse>



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

