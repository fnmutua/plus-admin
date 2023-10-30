<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi, getListWithoutGeo } from '@/api/counties'
import { ElButton, ElBadge, ElSelect, MessageParamsWithType } from 'element-plus'
import { ElMessage, ElOptionGroup, ElIcon } from 'element-plus'
import {
  Position,
  TopRight,
  User,
  Plus,
  Download,
  Filter,
  MessageBox,
  Edit,
  InfoFilled,
  Delete
} from '@element-plus/icons-vue'

import { ref, reactive, watch, computed } from 'vue'
import {
  ElTable, ElTableColumn, ElCollapse, ElCollapseItem, ElPagination,
  ElFormItem, ElInput, FormRules, ElDropdown, ElDropdownItem, ElDropdownMenu, ElPopconfirm
} from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord, deleteDocument } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import type { FormInstance } from 'element-plus'
import { getFile } from '@/api/summary'
import xlsx from "json-as-xlsx"

const showAdminButtons =  ref(appStore.getAdminButtons)
const showEditButtons =  ref(appStore.getEditButtons)

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


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
 


//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var filterValues = []
const model = 'document'

const associated_multiple_models = ['project', 'indicator_category_report', 'document_type']
//// ------------------parameters -----------------------////
const nested_models = ['settlement', 'county'] // The mother, then followed by the child
const nested_filter = ['id', [6, 7, 8]] //   column and value of the grandchild. In this case roles. 5=county Admin 

const { t } = useI18n()


const groups = ref()
const groups_backup = ref()




function groupByProperties(objects, properties) {
  const result = {};
  for (const object of objects) {
    // Check if the object has all the required properties
    if (properties.some((property) => !object[property])) {
      continue;
    }

    let currentObject = result;

    for (let i = 0; i < properties.length - 1; i++) {
      //   const propertyValue = getPropertyByPath(object, properties[i]);
      const propertyValue = object[properties[i]];

      if (!currentObject[propertyValue]) {
        currentObject[propertyValue] = {};
      }

      currentObject = currentObject[propertyValue];
    }

    // const lastPropertyValue = getPropertyByPath(object, properties[properties.length - 1]);
    const lastPropertyValue = object[properties[properties.length - 1]];

    if (!currentObject[lastPropertyValue]) {
      currentObject[lastPropertyValue] = [];
    }

    currentObject[lastPropertyValue].push(object);
  }
  console.log('>>>result<<<<', result)

  return result;
}



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
const getFilteredData = async ([], []) => {
  loading.value = true
  const formData = {}
  formData.limit = 1000
  formData.page = 1
  formData.curUser = 1 // Id for logged in user
  formData.model = model
  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------


  // - multiple filters -------------------------------------
  formData.filters = []
  formData.filterValues = []
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = nested_models

  //-------------------------
  //console.log(formData)
  await getSettlementListByCounty(formData)
    .then(response => {
      var flattenedObj = flattenArrayOfJSON(response.data);



      const filtDataFiles = flattenedObj.filter(file => {
        const fileName = file.name.toLowerCase();
        return fileName.endsWith('.csv') || fileName.endsWith('.xls') || fileName.endsWith('.zip') || fileName.endsWith('.xlsx');
      });



      groups.value = groupByProperties(filtDataFiles, ['document_type.group', 'document_type.type'])


      groups_backup.value = groupByProperties(filtDataFiles, ['document_type.group', 'document_type.type'])


      // finished laoding 
      loading.value = false



    });





}
//console.log('TBL-4f', liveDocs.value)


const xgroups = ref({
  Reports: {
    socio_economic_reports: [],
    basemap_reports: [],
    stakeholder_analysis_reports: [],
    social_environmental_screening_reports: [],
    planning_reports: [],
    engineering_survey_reports: [],
  },
  Maps: {
    survey_plans: [],
    registry_index_maps: [],
    area_lists: [],
    beacon_certificates: [],

  },
  Plans: {
    local_physical_land_use_development_plans: [],
    social_management_plans: [],
    resettlement_action_plans: [],
    community_development_plans: [],

  },
  Data: {
    households: [],
    shapefiles: [],
    satellite_imagery: [],
    beneficiaries: [],
    others: [],

  },
  Others: {
    photos: [],
    ownership_documents: [],
    registration_documents: [],

  },
})






const downloadFile = async (data) => {

  console.log(data)
  console.log(data.row.name)

  const formData = {}
  formData.filename = data.row.name
  formData.responseType = 'blob'
  await getFile(formData)
    .then(response => {
      console.log(response)

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', data.row.name)
      document.body.appendChild(link)
      link.click()

    })
    .catch(error => {
      console.error('Error downloading file:', error);
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



const groupedDocuments = async (data) => {


  let tmp = data

  function clearArrays(obj) {
    for (let key in obj) {
      if (Array.isArray(obj[key])) {
        obj[key].length = 0;
      } else if (typeof obj[key] === 'object') {
        clearArrays(obj[key]);
      }
    }
  }

  clearArrays(groups)
  console.log('inside grouping....', groups)


  for (const doc of data) {
    // for (let i = 0; i < data.length; i++) {
    //   let doc = data[i]
    //filterLiveDocs
    // console.log('Looping though the data>>>>>>>>', doc)
    if (doc.group === 'Report') {
      // console.log('------------>', doc)
      if (doc.category === 'Socio Economic Report') {
        groups.value.Reports.socio_economic_reports.push(doc);
        //   console.log(doc)
      } else if (doc.category === 'Basemap Report') {
        groups.value.Reports.basemap_reports.push(doc);
      } else if (doc.category === 'Stakeholder Analysis Report') {
        groups.value.Reports.stakeholder_analysis_reports.push(doc);
      }
      else if (doc.category === 'Social Environmental Screening Report') {
        groups.value.Reports.social_environmental_screening_reports.push(doc);
      }
      else if (doc.category === 'Planning Report') {
        groups.value.Reports.planning_reports.push(doc);
      }
      else if (doc.category === 'Engineering Survey Report') {
        groups.value.Reports.engineering_survey_reports.push(doc);
      }
      else {
        groups.value.Reports.planning_reports.push(doc);
      }

    } else if (doc.group === 'Maps') {
      if (doc.category === 'Survey Plans') {
        groups.value.Maps.survey_plans.push(doc);
        console.log(doc)
      } else if (doc.category === 'Registry Index Maps') {
        groups.value.Maps.registry_index_maps.push(doc);
      } else if (doc.category === 'Area List') {
        groups.value.Maps.area_lists.push(doc);
      }
      else if (doc.category === 'Beacon Certificates') {
        groups.value.Maps.beacon_certificates.push(doc);
      }
      else if (doc.category === 'Survey Plans') {
        groups.value.Maps.survey_plans.push(doc);
      }
    }

    else if (doc.group === 'Data') {
      if (doc.category === 'Households') {
        groups.value.Data.households.push(doc);
        console.log(doc)
      } else if (doc.category === 'Shapefile') {
        groups.value.Data.shapefiles.push(doc);
      } else if (doc.category === 'Satellite Imagery') {
        groups.value.Data.satellite_imagery.push(doc);
      }
      else if (doc.category === 'Beneficiaries') {
        groups.value.Data.beneficiaries.push(doc);
      }
      else if (doc.category === 'Other') {
        groups.value.Data.others.push(doc);
      }
    }


    else if (doc.group === 'Plan') {
      if (doc.category === 'Local Physical Land Use Development Plan') {
        groups.value.Plans.local_physical_land_use_development_plans.push(doc);
      } else if (doc.category === 'Social Management Plan') {
        groups.value.Plans.social_management_plans.push(doc);
      } else if (doc.category === 'Resettlement Action Plan') {
        groups.value.Plans.resettlement_action_plans.push(doc);
      }
      else if (doc.category === 'Community Development Plan') {
        groups.value.Plans.community_development_plans.push(doc);
      }

    }


    else if (doc.group === 'Others') {
      if (doc.category === 'Photo') {
        groups.value.Others.photos.push(doc);
        console.log(doc)
      } else if (doc.category === 'Ownership Document') {
        groups.value.Others.ownership_documents.push(doc);
      } else if (doc.category === 'Registration Document') {
        groups.value.Others.registration_documents.push(doc);
      }


    }

  }

  //console.log('after Groups....', groups.value)

  return groups;
}





getFilteredData(filters, filterValues)

//getDocumentTypes()
const searchTerm = ref('')
function searchObjectsByProperties(obj, props, parents = []) {
  let matches = [];

  for (let key in obj) {
    const property = obj[key];
    if (typeof property === 'object' && property !== null) {
      if (Array.isArray(property)) {
        for (let i = 0; i < property.length; i++) {
          const result = searchObjectsByProperties(property[i], props, [...parents, obj]);
          const uniqueMatches = result.filter(match => !parents.includes(match) && !matches.includes(match));
          matches = matches.concat(uniqueMatches);
        }
      } else {
        const result = searchObjectsByProperties(property, props, [...parents, obj]);
        const uniqueMatches = result.filter(match => !parents.includes(match) && !matches.includes(match));
        matches = matches.concat(uniqueMatches);
      }
    } else if (property && props.hasOwnProperty(key) &&
      property.toString().toLowerCase().includes(props[key].toLowerCase())) {
      if (!parents.includes(obj) && !matches.includes(obj)) {
        matches.push(obj);
      }
    }
  }

  return matches;
}








const filteredGroups = async () => {
  //liveDocs.value.settlement.toLowerCase().includes(searchTerm.value.toLowerCase())
  //console.log('cccccccccc>>>>------', groups_backup.value)
  // const filtredData = groups_backup.value
  //   .filter(doc => doc.settlement.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
  //     doc.title.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
  //     doc.group.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
  //     doc.category.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
  //     doc.format.toLowerCase().includes(searchTerm.value.toLowerCase())

  //   )


  let searchWord = searchTerm.value.toLowerCase()

  const props = { 'name': searchWord, 'settlement.name': searchWord, 'settlement.county.name': searchWord };
  console.log(props)
  const result = searchObjectsByProperties(groups_backup.value, props);
  // const result = filterByPropertyValue(groups_backup.value, "name", searchWord);

  //console.log(result)
  const filtered = groupByProperties(result, ['document_type.group', 'document_type.type'])
  console.log('filter', filtered)


  return filtered;
}



watch(
  searchTerm,
  async (newValue, oldValue) => {
    console.log(`Input value changed from ${oldValue} to ${newValue}`);
    // Do something else here
    filterLiveDocs.value = []
    filteredGroups()
      .then(res => {
        // console.log('xxxxxxxxxxxx>>>>>', res)
        //  groupedDocuments(res)
        groups.value = res


      })


    // console.log('filterLiveDocs....', filterLiveDocs.value)
    // console.log('groups....', groups.value)
  },
  {
    immediate: true
  }
);


const handlePageChange = async (newPage) => {

  currentPage.value = newPage;
}

console.log("groups<<<---->>>", groups)

</script>

<template>
  <ContentWrap
:title="t('Data Repository')" :message="t('Use the filters to subset')" v-loading="loading"
    element-loading-text="Getting the documents.......">
    <el-input v-model="searchTerm" placeholder="Search uploaded by name/settlement/county/format" class="search-input" />
    <el-collapse accordion>
      <el-collapse-item v-for="(formats, category) in groups" :key="category">

        <template #title>
          <Icon icon="material-symbols:folder-open-outline" class="collapsible-header-icon  " width="48" />
          <span class="collapsible-header-text">{{ formatText(category) }}</span>
        </template>

        <el-collapse accordion>
          <el-collapse-item v-for="(docs, format) in formats" :key="format">
            <template #title>
              <Icon
v-if="category === 'Report'" icon="ion:document-outline" color='gray'
                class="collapsible-nested-header-icon " width="36" />
              <Icon
v-if="category === 'Map'" icon="ri:road-map-line" class="collapsible-nested-header-icon "
                color='green' width="36" />
              <Icon
v-if="category === 'Data'" icon="material-symbols:chart-data-outline"
                class="collapsible-nested-header-icon " color='gray' width="36" />
              <Icon
v-if="category === 'Other'" icon="material-symbols:linked-camera-outline"
                class="collapsible-nested-header-icon " color='gray' width="24" />
              <Icon
v-if="category === 'Plan'" icon="carbon:heat-map-03" class="collapsible-nested-header-icon "
                color='gray' width="24" />

              <span class="format-header-text">{{ formatText(format) }}</span>
              <el-badge v-if="docs.length > 0" :value="docs.length" class="collapsible-header-badge" />

            </template>
            <el-table
:data="docs.slice((currentPage - 1) * pageSize, currentPage * pageSize)"
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
                  <el-button @click="downloadFile(scope)" type="primary" icon="el-icon-download">Download</el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="pagination-wrapper" v-if="docs.length > 5">
              <el-pagination
:page-size="5" background small layout="prev, pager, next" :total="docs.length"
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
</style>