<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import {
  ElButton, ElTabPane, ElTabs, ElCard, ElTable, ElTableColumn, ElSelect, ElOption, ElPagination, ElRow,
} from 'element-plus'
import { useRoute } from 'vue-router'
import { Back } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

// Locally
import '@dafcoe/vue-collapsible-panel/dist/vue-collapsible-panel.css'
import { useAppStore } from '@/store/modules/app'
import DownloadCustom from '@/views/Components/DownloadCustomFields.vue';




import {

  getAllSubmissions
} from '@/api/collector'


import "mapbox-layer-switcher/styles.css";
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'


import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'


import { useCache } from '@/hooks/web/useCache'
const { push } = useRouter()




const { wsCache } = useCache()

const appStore = useAppStore()

const MapBoxToken = 'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = MapBoxToken;



const route = useRoute()
const loading = ref(true)






////Configurations //////////////

//// ------------------parameters -----------------------////


//// ------------------parameters -----------------------////

const projectId = route.params.projectId
const formId = route.params.xmlFormId
const form_name = route.params.form_name

onMounted(async () => {



  console.log('')
})


const tableData = ref([]) // Table data extracted from GeoJSON
const tableHeaders = ref([]) // The first five properties
const allProperties = ref([]) // The first five properties
const selectedFields = ref([]); // Ensure it's reactive
const features = ref([])
const totalItems = ref()
const getFormData = async () => {
  // Define the formData object with necessary fields
  const formData = {
    project: projectId,
    form: formId,
    token: localStorage.getItem('collectorToken')
  };

  // Set loading state
  /// loading.value = true;

  try {
    // Await the response from getSubmissions
    const response = await getAllSubmissions(formData);

    console.log('Submissions:', response);



    // Parse GeoJSON data
    features.value = response.data.features || [];
    if (features.value.length > 0) {
      // Extract the first feature's properties
      allProperties.value = features.value[0].properties;
      tableHeaders.value = Object.keys(allProperties.value).slice(0, 5); // Use first 10 fields initially

      // Initialize selectedFields with the default fields to show
      selectedFields.value = tableHeaders.value;

      // Map data for the table
      tableData.value = features.value.map((feature) => {
        const properties = feature.properties;
        const row = {};

        // Loop through the selected fields and assign values from properties
        selectedFields.value.forEach((key) => {
          row[key] = properties[key] || "-"; // Set "-" if the property is missing or undefined
        });

        return row;
      });
    }



    console.log('tableHeaders', tableHeaders.value)
    loading.value = false

  } catch (error) {
    // Handle errors here
    console.error('Error:', error);
  } finally {
    // Reset loading state
    console.log('test')
  }
};



getFormData()




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

const activeName = ref('data')





// Watch for changes in the selected fields and update table data accordingly
watch([selectedFields, features], () => {
  // Ensure features is updated
  console.log('selectedFields', selectedFields.value)
  if (features.value.length > 0) {
    tableData.value = features.value.map((feature) => {
      const properties = feature.properties;
      const row = {};

      // Loop through the selected fields and assign values from properties
      selectedFields.value.forEach((key) => {
        row[key] = properties[key] || "-"; // Set "-" if the property is missing or undefined
      });

      return row;
    });
  }
}, { deep: true });




const pageSize = ref(10);
const currentPage = ref(1);


// Computed property for paginated data based on filtered results
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return tableData.value.slice(start, end);
});

// Watch the filtered data to update totalItems and reset the pagination
watch(tableData, (newValue) => {
  totalItems.value = newValue.length; // Update total based on filtered data

});




const handlePageChange = (page) => {
  currentPage.value = page;
};


const handlePageSizeChange = (newSize) => {
  pageSize.value = newSize;
  currentPage.value = 1; // Reset to first page when changing page size
};









const clickTab = (tab) => {
  console.log('Tab clicked:', tab.props);
  localStorage.setItem('activeTab', tab.props.name);

  if (tab.props.name === 'map') {
    // Delay the loadMap function
    setTimeout(() => {
      loadMap(); // Load map after a brief delay
    }, 500); // Delay in milliseconds (500 ms = 0.5 seconds)
  }


};


const showEditButtons = ref(appStore.getEditButtons)


</script>

<template>
  <el-card>



    <!-- Header Section -->
    <template #header>
      <div class="card-header" style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
            Back
          </el-button>
          {{ form_name }}
        </div>

      </div>
    </template>



    <el-tabs v-model="activeName" class="demo-tabs" type="border-card" @tab-click="clickTab">

      <el-tab-pane label="Data" name="data">
        <el-card v-loading="loading">


          <el-row type="flex" justify="start" gutter="10">

            <el-select v-model="selectedFields" multiple placeholder="Select properties to display"
              :collapse-tags="true" style="margin-bottom: 10px; width: 95%;" class="select-properties">
              <el-option v-for="(, key) in allProperties" :key="key" :label="key" :value="key" />
            </el-select>


            <DownloadCustom :data="paginatedData" :all="tableData" />

          </el-row>








          <el-table :data="paginatedData" style="width: 100%" border stripe>
            <el-table-column v-for="(key, index) in selectedFields" :key="index" :label="key" :prop="key" />
          </el-table>

          <div style="margin-top: 20px;">
 
            <el-pagination layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
              v-model:page-size="pageSize" :page-sizes="[5, 10, 15, 20, 50, 100]" :total="totalItems" :background="true"
              @size-change="handlePageSizeChange" @current-change="handlePageChange" class="mt-4" />

          </div>

        </el-card>

      </el-tab-pane>


      <el-tab-pane label="Map" name="map">
        <div id="mapContainer" class="basemap"></div>
      </el-tab-pane>








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


.basemap {
  width: 100%;
  height: 65vh;
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



.el-table .warning-row {
  --el-table-tr-bg-color: var(--el-color-warning-light-9);
  --el-table-tr-text-color: var(--el-color-warning);
  color: var(--el-table-tr-text-color);
}

.item {
  margin-top: 10px;
  margin-right: 40px;
}


.custom-table .el-table__cell {
  color: rgb(243, 112, 112);
  /* Light gray text color */
  font-style: italic;
  font-size: small;
  /* Italicized text */
}


.italic-green {
  color: rgb(48, 77, 6);
  font-style: italic;
  /* Italicized text */
}

.italic-red {
  color: rgb(243, 11, 11);
  /* Light gray text color */
  font-style: italic;
  /* Italicized text */
}

.td-bold {
  font-weight: bold;
  /* Italicized text */
}
</style>