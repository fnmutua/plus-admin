<script setup lang="ts">
import { Descriptions } from '@/components/Descriptions'
import { useI18n } from '@/hooks/web/useI18n'
import { onMounted, defineAsyncComponent, ref, reactive, unref, computed } from 'vue'
import { Form } from '@/components/Form'
import { ElInput, ElButton, ElTabPane, ElTabs, ElCard, ElTable, ElTableColumn, ElMessage, ElIcon, } from 'element-plus'
import { useValidator } from '@/hooks/web/useValidator'
import { useForm } from '@/hooks/web/useForm'
import { useRoute } from 'vue-router'
import {
  getOneGeo,
  getOneSettlement,
  getSettlementListByCounty,
  getfilteredGeo
} from '@/api/settlements'
import { Back, Upload, Search } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { getFile } from '@/api/summary'

// Locally
import '@dafcoe/vue-collapsible-panel/dist/vue-collapsible-panel.css'
import UploadComponent from '@/views/Components/UploadComponent.vue';


import { ElCollapseTransition, ElDescriptions, ElDescriptionsItem, ElTooltip } from 'element-plus'


import { useDesign } from '@/hooks/web/useDesign'
import { propTypes } from '@/utils/propTypes'

const route = useRoute()

const { t } = useI18n()

const housing = reactive({
  no_dwelling: '45',
  pop_density: '10',
  ave_hh_size: '6',
  ave_room_occupancy: '4',
  prop_permanent: '45%',
  prop_semi: '20%',
  prop_temp: '35%',
  avg_cost_perm: '2500',
  avg_cost_semi: '1500',
  avg_cost_temp: '1000'
})

const utilities = reactive({
  prop_avail_piped_water: '25%',
  prop_other_water: '75%',
  prop_conn_elec: '45%',
  prop_conn_other_elec: '55%',
  prop_lpg: '20%',
  prop_firewood: '25%',
  prop_kerosene: '45%',
  prop_biogas: '10%',
  prop_elec: '0%'
})

const schemaProfile = reactive<DescriptionsSchema[]>([
  {
    field: 'name',
    label: t('Name')
  },
  {
    field: 'type',
    label: t('Type')
  },
  {
    field: 'county',
    label: t('County')
  },
  {
    field: 'subcounty',
    label: t('SubCounty')
  },

  {
    field: 'population',
    label: t('Population')
  },
  {
    field: 'area_ha',
    label: t('Area(Ha.)')
  },

  {
    field: 'description',
    label: t('Description'),
    span: 40
  }
])

const schemaHousing = reactive<DescriptionsSchema[]>([
  {
    field: 'no_dwelling',
    label: t('Number of Dwellings')
  },

  {
    field: 'pop_density',
    label: t('Population Density')
  },

  {
    field: 'ave_hh_size',
    label: t('Average Household Size')
  },

  {
    field: 'ave_room_occupancy',
    label: t('Average Room Occupancy')
  },

  {
    field: 'prop_permanent',
    label: t('Proportion of Permanent Structures')
  },
  {
    field: 'prop_semi',
    label: t('Proportion of Semi-Permanent Structures')
  },
  {
    field: 'prop_temp',
    label: t('Proportion of Temporary Structures')
  },
  {
    field: 'avg_cost_perm',
    label: t('Average Monthly Rent for Permanent Structures')
  },

  {
    field: 'avg_cost_semi',
    label: t('Average Monthly Rent for Semi-Permanent Structures')
  },

  {
    field: 'avg_cost_temp',
    label: t('Average Monthly Rent for Temporary Structures')
  }
])

const schemaUtilities = reactive<DescriptionsSchema[]>([
  {
    field: 'prop_avail_piped_water',
    label: t('Proportion of Residents with access to Piped Water')
  },
  {
    field: 'prop_other_water',
    label: t('Proportion of Residents without access to Piped Water')
  },
  {
    field: 'prop_conn_elec',
    label: t('Proportion of Residents with access to Electricity')
  },

  {
    field: 'prop_conn_other_elec',
    label: t('Proportion of Residents without access to Electricity')
  },

  {
    field: 'prop_lpg',
    label: t('Proportion of Residents using LPG gas')
  },

  {
    field: 'prop_firewood',
    label: t('Proportion of Residents using Firewood')
  },

  {
    field: 'prop_biogas',
    label: t('Proportion of Residents using Biogas')
  },

  {
    field: 'prop_kerosene',
    label: t('Number of Dwellings')
  },

  {
    field: 'prop_elec',
    label: 'Proportion of Residents using Electricity(Cooking)'
  }
])

const form = reactive({
  name: '',
  county: '',
  population: '',
  area_ha: '',
  description: '',
  type: '',
  subcounty: ''
})

const page = ref(1)
const pSize = ref(5)
////Configurations //////////////

//// ------------------parameters -----------------------////
var filters = ['id']
const id = route.params.id
var intervenComponent = [id] // the Id of the settleemnt to filter with
var filterValues = [intervenComponent]

//const associated_Model = ''
const associated_multiple_models = ['settlement_status', 'county', 'subcounty', 'ward', 'document']
const model = 'settlement'

const nested_models = ['document', 'document_type'] // The mother, then followed by the child

//// ------------------parameters -----------------------////

const settlementDocuments = ref([])


let settlement = reactive({
  count: 0,
  name: 'unnwo',
  flag: false
})
////////////

const profile = reactive({
  name: '',
  county: '',
  subcounty: '',
  type: 'Slum',
  description:
    'Kibera (Kinubi: Forest or Jungle[1]) is a division of Nairobi Area, Kenya, and neighborhood of the city of Nairobi, 6.6 kilometres (4.1 mi) from the city centre.[2] Kibera is the largest slum in Nairobi, and the largest urban slum in Africa.[3][4][5] The 2009 Kenya Population and Housing Census reports Kiberas population as 170,070, contrary to previous estimates of one or two million people.[6] ',
  area_ha: '',
  population: ''
})

function flattenObject(obj, parentKey = '', separator = '.') {
  return Object.keys(obj).reduce((acc, key) => {
    const fullKey = parentKey ? `${parentKey}${separator}${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(acc, flattenObject(obj[key], fullKey, separator));
    } else {
      acc[fullKey] = obj[key];
    }
    return acc;
  }, {});
}



const getFilteredData = async (selFilters, selfilterValues) => {
  const formData = {}
  formData.limit = pSize.value
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  //formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = selFilters
  formData.filterValues = selfilterValues
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = nested_models
  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  // set the settlement details ------------------------------------

  console.log('After Querry', res)

  // set the settlement profile  details ------------------------------------
  profile.id = res.data[0].id
  profile.name = res.data[0].name
  profile.county = res.data[0].county.name
  profile.subcounty = res.data[0].subcounty.name
  profile.area_ha = res.data[0].area
  profile.population = res.data[0].population
  profile.description = res.data[0].description


  //settlementDocuments.value = flattenObject(res.data.documents)

  // Assuming your array is res.data[0].documents
  const nestedArray = res.data[0].documents;

  // Flatten each object in the array
  settlementDocuments.value = nestedArray.map(doc => flattenObject(doc));

  console.log('settlementDocuments.value', settlementDocuments.value)
  // set the settlement hosuing  details ------------------------------------
  var latestReportIndex = res.data[0].settlement_statuses.length - 1 // We get the number of reports so that we can pick the most recent

  housing.no_dwelling = res.data[0].settlement_statuses[latestReportIndex].no_dwelling
  housing.pop_density = res.data[0].settlement_statuses[latestReportIndex].pop_density
  housing.ave_room_occupancy = res.data[0].settlement_statuses[latestReportIndex].ave_room_occupancy
  housing.ave_hh_size = res.data[0].settlement_statuses[latestReportIndex].ave_hh_size
  housing.prop_permanent = res.data[0].settlement_statuses[latestReportIndex].prop_permanent + '%'
  housing.prop_semi = res.data[0].settlement_statuses[latestReportIndex].prop_semi + '%'
  housing.prop_temp = res.data[0].settlement_statuses[latestReportIndex].prop_temp
  housing.avg_cost_perm = res.data[0].settlement_statuses[latestReportIndex].avg_cost_perm
  housing.avg_cost_semi = res.data[0].settlement_statuses[latestReportIndex].avg_cost_semi
  housing.avg_cost_temp = res.data[0].settlement_statuses[latestReportIndex].avg_cost_temp

  // set the utilities  details ------------------------------------
  utilities.prop_avail_piped_water =
    res.data[0].settlement_statuses[latestReportIndex].prop_other_water + '%'
  utilities.prop_other_water =
    res.data[0].settlement_statuses[latestReportIndex].prop_other_water + '%'
  utilities.prop_conn_elec = res.data[0].settlement_statuses[latestReportIndex].prop_conn_elec + '%'
  utilities.prop_lpg = res.data[0].settlement_statuses[latestReportIndex].prop_lpg + '%'
  utilities.prop_other_water =
    res.data[0].settlement_statuses[latestReportIndex].prop_other_water + '%'
  utilities.prop_conn_elec = res.data[0].settlement_statuses[latestReportIndex].prop_conn_elec + '%'
  utilities.prop_lpg = res.data[0].settlement_statuses[latestReportIndex].prop_lpg + '%'
  utilities.prop_firewood = res.data[0].settlement_statuses[latestReportIndex].prop_firewood + '%'
  utilities.prop_kerosene = res.data[0].settlement_statuses[latestReportIndex].prop_kerosene + '%'
  utilities.prop_biogas = res.data[0].settlement_statuses[latestReportIndex].prop_biogas + '%'
  utilities.prop_elec = res.data[0].settlement_statuses[latestReportIndex].prop_elec + '%'
}

onMounted(() => {


  getFilteredData(filters, filterValues)
  console.log(settlement)
})

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

const activeName = ref('profile')

const viewLoading = ref(false)

const downloadFile = async (data) => {
  console.log(data);
  viewLoading.value = true;
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
  } catch (error) {
    ElMessage.error('Failed');
    viewLoading.value = false;
  }
};





/// Uplaod docuemnts from a central component 
const addMoreDocuments = ref(false)
const currentRow = ref()
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

function toggleComponent() {
  console.log('model data', model)
  console.log('Compnnent data', profile)

  componentProps.value.showDialog = true
  componentProps.value.data = profile


  dynamicComponent.value = null; // Unload the component
  addMoreDocuments.value = true; // Set any additional props

  setTimeout(() => {
    dynamicComponent.value = ChildComponent; // Load the component
  }, 100); // 0.1 seconds
}





const clickTab = async (obj) => {
  activeName.value = obj.props.name
  console.log('obj.props.name', obj.props.name)
}



const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('descriptions')
const message = ref('test')
const show = ref(true)
const collapse = ref(true)
const title = ref('title')

const toggleClick = () => {
  if (collapse.value) {
    show.value = !unref(show.value)
  }
}

const collapsedSections = ref({}); // Track collapse state for each type

// Group documents by `document_type.type`
const groupedDocuments = computed(() => {
  return settlementDocuments.value.reduce((groups, doc) => {
    const type = doc["document_type.type"] || "Unknown";
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(doc);
    return groups;
  }, {});
});


const searchQuery = ref('')
// Filter and group documents by `document_type.type`
const filteredGroupedDocuments = computed(() => {
  const query = searchQuery.value.toLowerCase();

  // Filtered documents by search query across the 'name' property only
  const filteredDocs = Object.entries(groupedDocuments.value).reduce((acc, [category, docs]) => {
    const filteredDocsForCategory = docs.filter(doc =>
      doc.name && doc.name.toLowerCase().includes(query) // Check if 'name' includes the query
    );

    if (filteredDocsForCategory.length > 0) {
      acc[category] = filteredDocsForCategory;
    }

    return acc;
  }, {});

  return filteredDocs;
});





// Toggle collapse state for a specific type
const toggleCollapse = (type) => {
  collapsedSections.value[type] = !collapsedSections.value[type];
};

function makePlural(word) {
  // Check if the word is already plural
  if (isPlural(word)) {
    return word;  // If it's already plural, return the word as is
  }

  // Apply regular pluralization rules if it's not plural
  if (word.endsWith("y") && !/aeiou/.test(word[word.length - 2])) {
    // Change y to ies (e.g., city -> cities)
    return word.slice(0, -1) + "ies";
  } else if (word.endsWith("s") || word.endsWith("x") || word.endsWith("z") || word.endsWith("ch") || word.endsWith("sh")) {
    // Add es (e.g., box -> boxes)
    return word + "es";
  } else {
    // Add s for most cases (e.g., cat -> cats)
    return word + "s";
  }
}

function isPlural(word) {
  // Regular expression to check if a word ends with common plural endings
  const pluralPattern = /(s|es|ies)$/i;
  return pluralPattern.test(word);
}


</script>

<template>
  <el-card>


    <div v-if="dynamicComponent">
      <upload-component :is="dynamicComponent" v-bind="componentProps" />
    </div>


    <!-- Header Section -->
    <template #header>
      <div class="card-header">
        <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
          Back
        </el-button>

        {{ profile.name }} , {{ profile.subcounty }} Subcounty, {{ profile.county }} County
      </div>
    </template>


    <el-tabs v-model="activeName" class="demo-tabs" type="border-card" @tab-click="clickTab">
      <el-tab-pane label="Profile" name="profile">

        <Descriptions :title="t('Profile')" :message="t('Settlement Profile')" :data="profile"
          :schema="schemaProfile" />


        <Descriptions :title="t('Housing')" :message="t('Settlement Housing')" :data="housing"
          :schema="schemaHousing" />



        <Descriptions :title="t('Utilities')" :message="t('Access to Utilities')" :data="utilities"
          :schema="schemaUtilities" />



      </el-tab-pane>

      <el-tab-pane label="Documents" name="documents">

        <div>
          <!-- Filter Input -->
          <el-input v-model="searchQuery" type="text" placeholder="Search documents..." style="width: 50%"
            :prefix-icon="Search" clearable />

          <div v-for="(docs, type) in filteredGroupedDocuments" :key="type"
            :class="[prefixCls, 'bg-[var(--el-color-white)] dark:(bg-[var(--el-bg-color)] border-[var(--el-border-color)] border-1px)']">
            <!-- Collapsible Header -->
            <div
              :class="[`${prefixCls}-header`, 'h-50px flex justify-between items-center mb-10px border-bottom-1 border-solid border-[var(--tags-view-border-color)] px-10px cursor-pointer dark:border-[var(--el-border-color)]']"
              @click="toggleCollapse(type)">
              <div :class="[`${prefixCls}-header__title`, 'relative font-18px font-bold ml-10px']">
                <div class="flex items-center">
                  {{ makePlural(type) }} ({{ docs.length }})
                </div>
              </div>
              <Icon :icon="collapsedSections[type] ? 'ep:arrow-down' : 'ep:arrow-up'" />
            </div>

            <!-- Collapsible Content -->
            <ElCollapseTransition>
              <div v-show="collapsedSections[type]" :class="[`${prefixCls}-content`, 'p-10px']">
                <el-table :data="docs" style="width: 100%">
                  <el-table-column type="index" width="50" />
                  <el-table-column prop="name" label="Name" />
                  <el-table-column prop="createdAt" label="Uploaded" />
                  <el-table-column fixed="right" label="">
                    <template #default="scope">
                      <el-button type="primary" @click="downloadFile(scope.row)">
                        <Icon icon="fa-solid:download" style="  margin-right: 5px;" />
                        Download
                      </el-button>


                    </template>
                  </el-table-column>
                </el-table>

                <!-- <el-button @click="toggleComponent()" style="margin-top:10px">Upload</el-button> -->

                <el-button @click="toggleComponent()" style="margin-top:10px">
                  Upload<el-icon class="el-icon--right">
                    <Upload />
                  </el-icon>
                </el-button>



              </div>

            </ElCollapseTransition>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="Lists" name="lists">
        <el-card>

          <el-table :data="settlementDocuments" style="width: 100%">
            <el-table-column type="index" width="50" />
            <el-table-column prop="name" label="Name" />
            <el-table-column prop="createdAt" label="Uploaded" />
            <el-table-column fixed="right" label="">
              <template #default="scope">
                <el-button type="primary" @click="downloadFile(scope.row)">
                  <Icon icon="fa-solid:download" style="  margin-right: 5px;" />
                  Download
                </el-button>


              </template>
            </el-table-column>
          </el-table>

          <el-button @click="toggleComponent()" style="margin-top:10px">Upload</el-button>


        </el-card>


      </el-tab-pane>


      <el-tab-pane label="Task" name="fourth">Task</el-tab-pane>
    </el-tabs>






  </el-card>

</template>

<style lang="less" scoped>
.is-required--item {
  position: relative;

  &::before {
    margin-right: 4px;
    color: var(--el-color-danger);
    content: '*';
  }
}


.card-header {
  display: flex;


  font-weight: bold;
  font-size: 1.2rem;
  color: #333;
}
</style>


<style lang="less" scoped>
@prefix-cls: ~'@{namespace}-descriptions';

.@{prefix-cls}-header {
  &__title {
    &::after {
      position: absolute;
      top: 3px;
      left: -10px;
      width: 4px;
      height: 70%;
      background: var(--el-color-primary);
      content: '';
    }
  }
}

.@{prefix-cls}-content {
  :deep(.@{elNamespace}-descriptions__cell) {
    width: 0;
  }
}
</style>