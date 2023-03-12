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


const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


console.log("userInfo--->", userInfo)

const pageSize = ref(5)
const currentPage = ref(1)

const showAdminButtons = ref(false)

// flag for admin buttons
if (userInfo.roles.includes("admin") || userInfo.roles.includes("kisip_staff")) {
  showAdminButtons.value = true
}


console.log("Show Buttons -->", showAdminButtons)



//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var filterValues = []
const model = 'document'

const associated_multiple_models = ['project', 'settlement', 'indicator_category_report', 'document_type']
//// ------------------parameters -----------------------////

const { t } = useI18n()





const liveDocs = ref([])
const filterLiveDocs = ref([])
const getFilteredData = async ([], []) => {
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

  //-------------------------
  //console.log(formData)
  await getSettlementListByCounty(formData)
    .then(response => {
      console.log(response)

      response.data.forEach(function (arrayItem) {
        //    console.log(arrayItem)
        let doc = {}
        doc.title = arrayItem.name
        doc.format = arrayItem.format
        doc.group = arrayItem.document_type.group
        doc.category = arrayItem.document_type.type
        doc.settlement = arrayItem.settlement ? arrayItem.settlement.name : ''
        doc.link = arrayItem.location
        doc.size = arrayItem.size

        liveDocs.value.push(doc)
        filterLiveDocs.value.push(doc)
      })

      groupedDocuments(filterLiveDocs.value)


    });





}
//console.log('TBL-4f', liveDocs.value)


const groups = ref({
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
  console.log(data.row.title)

  const formData = {}
  formData.filename = data.row.title
  formData.responseType = 'blob'
  await getFile(formData)
    .then(response => {
      console.log(response)

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', data.row.title)
      document.body.appendChild(link)
      link.click()

    })
    .catch(error => {
      console.error('Error downloading file:', error);
    });

}



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


const searchTerm = ref('')


const filteredGroups = async () => {
  //liveDocs.value.settlement.toLowerCase().includes(searchTerm.value.toLowerCase())
  const filtredData = liveDocs.value
    .filter(doc => doc.settlement.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      doc.title.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      doc.group.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      doc.format.toLowerCase().includes(searchTerm.value.toLowerCase())

    )
  return filtredData;
}



watch(
  searchTerm,
  async (newValue, oldValue) => {
    console.log(`Input value changed from ${oldValue} to ${newValue}`);
    // Do something else here
    filterLiveDocs.value = []
    filteredGroups()
      .then(res => {
        console.log('xxxxxxxxxxxx>>>>>', res)
        groupedDocuments(res)


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

console.log("groups", groups)

</script>

<template>
  <ContentWrap :title="t('Document Repository')" :message="t('Use the filters to subset')">
    <el-input v-model="searchTerm" placeholder="Search documents by name/settlement/format" class="search-input" />
    <el-collapse accordion>
      <el-collapse-item v-for="(formats, category) in groups" :key="category">

        <template #title>
          <Icon icon="material-symbols:folder-open-outline" class="collapsible-header-icon  " width="48" />
          <span class="collapsible-header-text">{{ formatText(category) }}</span>



        </template>

        <el-collapse accordion>
          <el-collapse-item v-for="(docs, format) in formats" :key="format">
            <template #title>
              <Icon v-if="category === 'Reports'" icon="ion:document-outline" color='gray'
                class="collapsible-nested-header-icon " width="36" />
              <Icon v-if="category === 'Maps'" icon="ri:road-map-line" class="collapsible-nested-header-icon "
                color='green' width="36" />
              <Icon v-if="category === 'Data'" icon="material-symbols:chart-data-outline"
                class="collapsible-nested-header-icon " color='gray' width="36" />
              <Icon v-if="category === 'Others'" icon="material-symbols:linked-camera-outline"
                class="collapsible-nested-header-icon " color='gray' width="24" />
              <Icon v-if="category === 'Plans'" icon="carbon:heat-map-03" class="collapsible-nested-header-icon "
                color='gray' width="24" />

              <span class="format-header-text">{{ formatText(format) }}</span>
              <el-badge v-if="docs.length > 0" :value="docs.length" class="collapsible-header-badge" />

            </template>
            <el-table :data="docs.slice((currentPage - 1) * pageSize, currentPage * pageSize)"
              style="width: 100%; margin-left: 30px" size="small">
              style="width: 100%; margin-left: 30px" size="small">
              <el-table-column prop="title" label="Title" />
              <el-table-column prop="settlement" label="Settlement" />
              <el-table-column prop="size" label="Size(Mb)" />
              <el-table-column label="Action">
                <template #default="scope">
                  <el-button @click="downloadFile(scope)" type="primary" icon="el-icon-download">Download</el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="pagination-wrapper" v-if="docs.length > 5">
              <el-pagination :page-size="5" layout="prev, pager, next" :total="docs.length"
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