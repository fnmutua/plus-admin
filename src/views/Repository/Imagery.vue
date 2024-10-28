<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { getCountyListApi } from '@/api/counties'

import { getGrievances } from '@/api/grievance'

import { ElButton, ElSelect, ElCheckbox, ElCol, ElIcon, ElTag } from 'element-plus'
import {
  Plus, Download, Filter, More, ArrowLeft, ArrowRight, Upload, UploadFilled,
  Edit,
  Back,
  InfoFilled, Position,
  Delete
} from '@element-plus/icons-vue'

import { ref, onMounted } from 'vue'
import {
  ElPagination, ElTooltip, ElOption, ElDialog, ElForm, ElDropdown, ElDropdownItem, ElDropdownMenu, ElTour, ElTourStep, ElUpload,
  ElFormItem, ElRow, ElInput, FormRules, ElStep, ElSteps, ElTable, ElTableColumn, ElCard, ElDrawer, ElMessage, ElTabPane, ElSwitch
} from 'element-plus'
import { useRouter } from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import type { FormInstance } from 'element-plus'
import xlsx from "json-as-xlsx"
import { uploadToGeoServer, deleteLayer, EditLayerDetails } from '@/api/geoserver'

import writeXlsxFile from 'write-excel-file';
import DownloadCustom from '@/views/Components/DownloadCustom.vue';
import type { UploadProps, UploadUserFile } from 'element-plus'

import { getCountyAuth, getSettlementByCountyAuth } from '@/api/register'
import { uploadGrievanceDocuments, generateGrievance, logGrievanceAction, batchImportGrievances, getByKeyword } from '@/api/grievance'
import { getModelSpecs } from '@/api/fields'
import exportFromJSON from 'export-from-json'
import Papa from 'papaparse';
import axios from 'axios';

import { XMLParser } from 'fast-xml-parser';

import '@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css';
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'


const { wsCache } = useCache()
const appStore = useAppStoreWithOut()

const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = MapBoxToken;




const layers = ref([])
const selOptions = ref([])
const tableDataList = ref([])

const layerName = ref()
const lyr = ref()

const bounds = ref()
const AddDialogVisible = ref(false)
const UploadDialogVisible = ref(false)
const EditDialogVisible = ref(false)
const DialogTitle = ref('Imagery')

const handleSelectLayer = async (lyr: any) => {
  console.log('Layer', lyr)
  layerName.value = lyr;
  DialogTitle.value = lyr
  AddDialogVisible.value = true
  // console.log(layers)

  var filteredLayers = tableDataList.value.filter(function (layer) {
    return layer.name === lyr;
  });

  console.log('filteredLayers', tableDataList.value)


  bounds.value = filteredLayers[0].bbox
  // console.log('filteredLayerss', filteredLayers[0].bbox)

  //loadMap()
  setTimeout(loadMap, 100); // delay for the dialog to fully load

}

const loadMap = () => {
  var map = new mapboxgl.Map({
    container: "mapContainer",
    style: "mapbox://styles/mapbox/streets-v12",
    center: [37.137343, 1.137451], // starting position
    zoom: 6,

  })

  map.addControl(new mapboxgl.NavigationControl());


  map.on('load', () => {

    map.resize()


    var xserver = 'http://159.223.109.100:8080/geoserver/kisip/wms'
    var server = 'https://kesmis.go.ke/geoserver/kisip/wms'

    var local_server = 'http://localhost:8080/geoserver/kisip/wms'

    map.addLayer({
      'id': 'geoserver-wms-layer',
      'type': 'raster',
      'source': {
        'type': 'raster',
        'tiles': [server + '?&bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&transparent=true&width=256&height=256&layers=' + layerName.value],
        'tileSize': 256
      },
      'paint': {}
    });

    //  console.log(bounds.value)
    map.fitBounds([[bounds.value.westBoundLongitude, bounds.value.southBoundLatitude], [bounds.value.eastBoundLongitude
      , bounds.value.northBoundLatitude]]);


  })


}




const loading = ref(false)
onMounted(() => {

  loading.value = true
  let server;
  const envt = import.meta.env.VITE_APP_DB_HOST // remove the port for production
  console.log('Environment >>>', envt)

  if (envt == 'localhost') {
    server = '/imagery/geoserver/kisip/ows/?SERVICE=WMS&REQUEST=GetCapabilities'

  } else {
    server = 'https://kesmis.go.ke/geoserver/kisip/ows/?SERVICE=WMS&REQUEST=GetCapabilities'

  }

  axios.get(server)
    // Remember to revert to below 

    // axios.get('https://kesmis.go.ke/geoserver/kisip/ows/?SERVICE=WMS&REQUEST=GetCapabilities')
    // .get('https://kesmis.go.ke/geoserver/kisip/wms?service=wms&version=1.1.1&request=GetCapabilities')
    .then((response) => {
      const xml = response.data;
      console.log(xml)

      const parser = new XMLParser();
      const json = parser.parse(xml);

      console.log('json', json)

      const glayers = json.WMS_Capabilities.Capability.Layer.Layer.map(layer => ({
        name: layer.Name,
        title: layer.Title,
        label: layer.Name,
        value: layer.Name,
        crs: layer.CRS,
        bbox: layer.EX_GeographicBoundingBox

      }));

      // console.log(glayers)



      tableDataList.value = glayers;
      loading.value = false


      console.log('tableDataList.value', tableDataList.value)
      for (let i = 0; i < glayers.length; i++) {
        var opt = {}
        opt.value = glayers[i].name
        opt.label = glayers[i].name
        opt.bbox = glayers[i].bbox
        // console.log(glayers[i])
        selOptions.value.push(opt)
      }



      //   console.log(selOptions)
      lyr.value = selOptions.value[0].value
      // handleSelectLayer(selOptions.value[0].value)
      //  loadMap()


    })
    .catch((error) => {
      console.error(error);
    });


})

const handleRowDblClick = (row) => {

  console.log('Double clicked row:', row);
  handleSelectLayer(row.name)


}


// Reactive form data
const form = ref({
  geoserverUrl: 'https://kesmis.go.ke/geoserver',
  workspace: 'kisip',
  username: 'admin',
  password: '***REDACTED***',
  crs: 'EPSG:21037',
  name: null,

});






const selectedFiles = ref([false])



const handleFiles = (file, fileList) => {

  selectedFiles.value = fileList;

}

const loadingUploads = ref(false)

const uploadFiles = async () => {

  loadingUploads.value = true
  console.log('Upload files...', loadingUploads.value)

  // Loop through each selected file and process/upload
  for (const file of selectedFiles.value) {
    try {
      // Extract store name from file name
      const store = file.name.replace(/ /g, '_').replace(/\.[^/.]+$/, '');

      // Upload file to GeoServer
      await uploadImageToGeoServer(file, store);
      loadingUploads.value = false
      // Process and publish the image to GeoServer
      // You would need to handle the rest of the workflow like in the Python script
      console.log(`Successfully uploaded and published ${file.name}`);
    } catch (error) {
      console.error(`Error processing ${file.name}: ${error.message}`);
    }
  }
}

const uploadImageToGeoServer = async (file, store) => {
  const url = `${form.value.geoserverUrl}/rest/workspaces/${form.value.workspace}/coveragestores/${store}/file.ecw`;

  console.log('Upload URL:', url);
  console.log('File:', file);

  const formData = new FormData();
  // formData.append('file', file.raw, file.name);
  formData.append('files', file.raw)
  formData.append('crs', form.value.crs); // Use a valid CRS instead of 'tests'

  console.log('Form Data:', formData); // For debugging, check the contents of FormData


  try {
    const res = await uploadToGeoServer(formData)
    console.log(res)

    if(res.code =='0000') {

      UploadDialogVisible.value=false
    }


  } catch (error) {
    console.error(`Error uploading file ${file.name}:`, error.response ? error.response.data : error.message);
  }
};


const deleteLayerStore = async (layer) => {
  try {
    console.log('Delete row:', layer);
    form.value.storeName = layer;

    // Call the deleteLayer function
    const res = await deleteLayer(form.value);

    // Check if the deletion was successful (assuming `res` contains a success flag)
    if (res && res.code === '0000') {
      console.log('Deletion successful:');

      // Find and remove the item from `tableDataList`
      tableDataList.value = tableDataList.value.filter(item => item.name !== layer);
      console.log('Updated tableDataList:', tableDataList.value);
    } else {
      console.error('Deletion failed');
    }
  } catch (error) {
    console.error('Error deleting layer:', error);
  }
};



const crsOptions = ref([
  { value: 'EPSG:21036', label: "Arc 1960 / UTM Zone 36S (EPSG:21036)", description: "UTM projection for parts of Kenya." },
  { value: 'EPSG:21096', label: "Arc 1960 / UTM Zone 36N (EPSG:21096)", description: "UTM projection for parts of Kenya." },
  { value: 'EPSG:21037', label: "Arc 1960 / UTM Zone 37S (EPSG:21037)", description: "UTM projection for East Africa, including Kenya." },
  { value: 'EPSG:21097', label: "Arc 1960 / UTM Zone 37N (EPSG:21097)", description: "UTM projection for East Africa, including Kenya." },
  { value: 'EPSG:4326', label: "WGS 84 (EPSG:4326)", description: "A global geographic coordinate system." },
  { value: 'EPSG:3857', label: "WGS 84 / Pseudo-Mercator (EPSG:3857)", description: "Web Mercator projection for mapping applications." },
  { value: 'Invalid', label: "Invalid Projection", description: "Web Mercator projection for mapping applications." }

])

const oldLayer = ref()
const editLayer = async (lyr: any) => {
  console.log('Layer', lyr)
  oldLayer.value = lyr
  EditDialogVisible.value = true
  form.value.name = lyr.name
  // Check if the CRS exists in the options list, otherwise set it to 'Invalid'
  const selectedCrs = lyr.crs && lyr.crs.length > 0 ? lyr.crs[0] : 'Invalid';
  const isValidCrs = crsOptions.value.some(option => option.value === selectedCrs);
  form.value.crs = isValidCrs ? selectedCrs : 'Invalid';
  form.value.name = lyr.name


}


const saveEdits = async () => {
  console.log('Upload files...')
  form.value.oldLayerName = oldLayer.value.name
  form.value.newLayerName = form.value.name
  form.value.workspace = form.value.workspace
  form.value.newCrs = form.value.crs
  form.value.layer = oldLayer.value



  try {


    // Call the deleteLayer function
    const res = await EditLayerDetails(form.value);

    // Check if the deletion was successful (assuming `res` contains a success flag)
    if (res && res.code === '0000') {
      console.log('EditLayerDetails successful:');


    } else {
      console.error('Edits failed');
    }
  } catch (error) {
    console.error('Error deleting layer:', error);
  }



}

const getCrsLabel = (value) => {

  const crs = crsOptions.value.find(option => option.value === value);
  return crs ? crs.label : 'Invalid CRS :' + value;
}


</script>

<template>
  <el-card>
    <el-row type="flex" justify="start" gutter="10"
      style="display: flex; flex-wrap: nowrap; align-items: center; margin-bottom:10px">

      <div class="max-w-200px">
        <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
          Back
        </el-button>
      </div>


      <!-- Title Search -->
      <el-select v-model="value3" :onChange="handleSelectLayer" clearable filterable collapse-tags
        placeholder="Select Imagery " style=" margin-right: 5px;">
        <el-option v-for="item in selOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>



      <!-- Action Buttons -->
      <div style="display: flex; align-items: center; gap: 10px; margin-right: 10px; ">

        <el-tooltip content="Upload Imagery" placement="top">
          <el-button @click="UploadDialogVisible = true" type="primary" :icon="Plus" />
        </el-tooltip>




        <el-tooltip content="Download" placement="top">
          <el-button @click="selectDownload" type="primary" :icon="Download" />
        </el-tooltip>
        <DownloadCustom v-if="showEditButtons" :data="tableDataList" :model="model"
          :associated_models="associated_multiple_models" />



      </div>

      <!-- Download All Component -->
    </el-row>


    <el-table :data="tableDataList" :loading="loading" style="width: 100%" @row-dblclick="handleRowDblClick">


      <el-table-column label="Name" prop="name" sortable />
      <el-table-column label="Title" prop="title" sortable />
      <!-- CRS Column with value lookup -->
      <el-table-column label="CRS" prop="crs" sortable width="350">
        <template #default="scope">
          <!-- Use the method to get the display label -->
          {{ getCrsLabel(scope.row.crs[0]) }}
        </template>
      </el-table-column>

      <el-table-column fixed="right" label="Actions" width="350">
        <template #default="scope">

          <el-button size="small" type="primary" plain :icon="Position" @click="handleSelectLayer(scope.row.name)">
            View
          </el-button>
          <el-button size="small" type="success" plain :icon="Edit" @click="editLayer(scope.row)">
            Edit
          </el-button>

          <el-button size="small" type="danger" plain :icon="Delete" @click="deleteLayerStore(scope.row.name)">
            Delete
          </el-button>
        </template>

      </el-table-column>
    </el-table>

    <ElPagination :layout="paginationLayout" v-model:currentPage="currentPage" :pager-count="pagerCount"
      v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 200, 10000]" :total="total" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />


  </el-card>




  <el-dialog v-model="AddDialogVisible" :title="DialogTitle" width="75%" draggable>

    <div id="mapContainer" class="basemap"></div>


  </el-dialog>


  <el-dialog v-model="UploadDialogVisible" title="Upload Imagery to Geoserver" width="500">

    <div v-loading="loadingUploads">
      <el-form ref="ruleFormRef" :model="form" label-position="left">
        <el-form-item label="Name">
          <el-input disabled v-model="form.geoserverUrl" />
        </el-form-item>

        <el-form-item label="Username">
          <el-input disabled v-model="form.username" />
        </el-form-item>

        <el-form-item label="Password">
          <el-input disabled v-model="form.password" type="password" />
        </el-form-item>

        <el-form-item label="Workspace">
          <el-input disabled v-model="form.workspace" />
        </el-form-item>



        <el-form-item label="Coordinate System">
          <el-select v-model="form.crs" clearable filterable collapse-tags placeholder="Select Coordinate System "
            style=" margin-right: 5px;">
            <el-option v-for="item in crsOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>

        </el-form-item>

        <el-form-item label="Select Files" style="width: 100%;">
          <el-upload multiple drag :auto-upload="false" :on-change="handleFiles" action="" style="width: 100%;">
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">Drop ECW files here or click to upload</div>
          </el-upload>
        </el-form-item>


      </el-form>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="uploadFiles">
          Confirm
        </el-button>
      </div>
    </template>
  </el-dialog>



  <el-dialog v-model="EditDialogVisible" title="Edit  Imagery Details" width="500">
    <el-form ref="ruleFormRef" :model="form" label-position="left">
      <el-form-item label="Name">
        <el-input disabled v-model="form.geoserverUrl" />
      </el-form-item>



      <el-form-item label="Workspace">
        <el-input disabled v-model="form.workspace" />
      </el-form-item>

      <el-form-item label="Layer Name">
        <el-input v-model="form.name" />
      </el-form-item>

      <el-form-item label="Coordinate System">
        <el-select v-model="form.crs" clearable filterable collapse-tags placeholder="Select Coordinate System "
          style=" margin-right: 5px;">
          <el-option v-for="item in crsOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>



      </el-form-item>


    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="EditDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="saveEdits">
          Confirm
        </el-button>
      </div>
    </template>
  </el-dialog>

</template>



<style scoped>
.upload-demo {
  width: 300px;
}

.template-link {
  text-decoration: underline;
  color: #409EFF;
  /* Optional: change link color */
}




.mt-4 {
  margin-top: 16px;
}

@media (max-width: 768px) {
  .el-pagination {
    font-size: 12px;
    /* Adjust font size for small screens */
  }

  .el-pagination .el-pagination__sizes {
    display: none;
    /* Hide size selector on small screens */
  }

  .el-pagination .el-pagination__total {
    display: none;
    /* Hide total count on small screens */
  }



}
</style>



<style>
.el-table .danger-row {
  --el-table-tr-bg-color: var(--el-color-danger-light-9);
  --el-table-tr-text-color: var(--el-color-danger);
  color: var(--el-table-tr-text-color);
}

.el-table .success-row {
  --el-table-tr-text-color: var(--el-color-success);
  color: var(--el-table-tr-text-color);
}

.el-table .warning-row {
  --el-table-tr-bg-color: var(--el-color-warning-light-9);
}

.el-table .rejected-row {
  --el-table-tr-bg-color: var(--el-color-danger-light-9);
  --el-table-tr-text-color: var(--el-color-danger);
  color: var(--el-table-tr-text-color);
}

.el-table .referred-row {
  --el-table-tr-bg-color: var(--el-color-warning-light-9);
  --el-table-tr-text-color: var(--el-color-warning);
  color: var(--el-table-tr-text-color);
}

.el-table .escalated-row {
  --el-table-tr-bg-color: var(--el-color-secondary);
  --el-table-tr-text-color: var(--el-color-secondary);
  color: var(--el-table-tr-text-color);
}

.el-table .resolved-row {
  --el-table-tr-bg-color: var(--el-color-success-light-9);
  --el-table-tr-text-color: var(--el-color-success);
  color: var(--el-table-tr-text-color);
}

.el-table .closed-row {
  --el-table-tr-bg-color: var(--el-color-info-light-9);
  --el-table-tr-text-color: var(--el-color-info);
  color: var(--el-table-tr-text-color);
}

.item {
  margin-top: 10px;
  margin-right: 40px;
}


.basemap {
  width: 100%;
  height: 65vh;
}
</style>