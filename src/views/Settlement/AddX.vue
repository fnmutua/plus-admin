<template>
  <div>
    <el-card class="box-card">
      <div class="max-w-200px">
        <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
          Back
        </el-button>
      </div>


      <el-steps :active="currentStep" finish-status="success" align-center class="small-steps">
        <el-step
v-for="(step, index) in steps" :key="index" :title="isMobile ? '' : step.title"
          @click="handleStepClick(index)" />
      </el-steps>
      <el-divider />

      <el-form
:model="formData" :rules="currentStepRules" label-width="200px" :label-position="labelPosition"
        ref="dynamicFormRef">
        <el-row :gutter="16">
          <el-col
v-for="(field, index) in currentStepFields" :key="index" :span="24" :xs="24" :sm="24" :md="12" :lg="24"
            :xl="8">
            <el-form-item :id="field.id" :label="field.label" :prop="field.name">
              <el-input v-if="field.type === 'text'" v-model="formData[field.name]" />
              <el-input v-else-if="field.type === 'textarea'" type="textarea" v-model="formData[field.name]" />
              <el-input-number
:min="field.min" v-else-if="field.type === 'number'" v-model="formData[field.name]"
                @change="getFieldChangeHandler(field.name)" />
              <el-date-picker v-else-if="field.type === 'date'" type="date" v-model="formData[field.name]" />
              <!-- Add more conditions for other field types as needed -->
              <el-select
v-else-if="field.type === 'select' && field.multiselect === 'false' && !field.adminUnit"
                v-model="formData[field.name]" :filterable="true" collapse-tags placeholder="Select"
                @change="getFieldChangeHandler(field.name)">
                <el-option
v-for="option in field.options" :key="option.value" :label="option.label"
                  :value="option.value" />
              </el-select>

              <el-select
v-else-if="field.type === 'select' && field.multiselect === 'true'"
                v-model="formData[field.name]" :filterable="true" multiple collapse-tags placeholder="Select"
                @change="getFieldChangeHandler(field.name)">
                <el-option
v-for="option in field.options" :key="option.value" :label="option.label"
                  :value="option.value" />
              </el-select>



              <el-select
v-else-if="field.type === 'select' && field.adminUnit && field.name === 'county_id'"
                v-model="formData[field.name]" :filterable="true" collapse-tags placeholder="County"
                @change="getFieldChangeHandler(field.name)">
                <el-option
v-for="option in countyOptions" :key="option.value" :label="option.label"
                  :value="option.value" />
              </el-select>

              <el-select
v-else-if="field.type === 'select' && field.adminUnit && field.name === 'subcounty_id'"
                v-model="formData[field.name]" :filterable="true" collapse-tags placeholder="Subcounty"
                @change="getFieldChangeHandler(field.name)">
                <el-option
v-for="option in subcountyOptionsFiltered" :key="option.value" :label="option.label"
                  :value="option.value" />
              </el-select>


              <el-select
v-else-if="field.type === 'select' && field.adminUnit && field.name === 'ward_id'"
                v-model="formData[field.name]" :filterable="true" collapse-tags placeholder="Ward"
                @change="getFieldChangeHandler(field.name)">
                <el-option
v-for="option in wardOptionsFiltered" :key="option.value" :label="option.label"
                  :value="option.value" />
              </el-select>

              <el-select
v-else-if="field.type === 'select' && field.adminUnit && field.name === 'settlement_id'"
                v-model="formData[field.name]" :filterable="true" collapse-tags placeholder="Settlement"
                @change="getFieldChangeHandler(field.name)">
                <el-option
v-for="option in settOptionsFiltered" :key="option.value" :label="option.label"
                  :value="option.value" />
              </el-select>


              <!-- <el-upload
v-else-if="field.type === 'upload' && visibleUpload" v-model:file-list="fileList"
                class="upload-demo" action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
                :auto-upload="false" :show-file-list="false" :on-change="handleUploadGeo">
                <template #default>
                  <el-button type="primary">{{ fileList.length > 0 ? fileList[0].name : 'Select Geojson/Zipped Shp'
                  }}</el-button>
                  <span class="upload-filename" v-if="fileList.length > 0">{{ fileList[0].name }}</span>
                </template>
</el-upload> -->


            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div
class="button-container"
        style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <div>
          <el-tooltip content="Help" placement="top">
            <el-button color="#626aef" type="info" @click="showTour" :icon="InfoFilled" plain />
          </el-tooltip>

          <el-button type="primary" @click="prevStep" v-if="currentStep > 0">
            Previous
          </el-button>
          <el-button type="primary" @click="nextStep" v-if="currentStep < totalSteps - 1">
            Next
          </el-button>
          <el-button type="success" @click="submitForm" v-else>
            Submit
          </el-button>
        </div>
        <h3 v-if="currentStep == totalSteps - 1 && showMessage" style="color: rgb(228, 30, 30); font-style: italic;">{{
          wardMessage }}</h3>
      </div>

      <!-- <pre>{{ wardMessage}}</pre>  -->
      <div v-if="currentStep == totalSteps - 1" id="mapContainer" class="basemap"></div>
      <div v-if="currentStep == totalSteps - 1" id='coordinates' class='coordinates'></div>
    </el-card>
    <el-dialog v-model="showDialog" title="Select Location" width="70%">
      <el-row>
        <el-select v-model="county_id" class="m-2" @change="onSelectCounty" placeholder="Select" size="large">
          <el-option v-for="item in cascadeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>

        <el-select v-model="subcounty_id" class="m-2" @change="onSelectSubcounty" placeholder="Select" size="large">
          <el-option
v-for="item in subcountyOptionsFiltered" :key="item.value" :label="item.label"
            :value="item.value" />
        </el-select>

        <el-select v-model="ward_id" class="m-2" placeholder="Select" @change="onSelectWard" size="large">
          <el-option v-for="item in wardOptionsFiltered" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-select v-model="settlement_id" class="m-2" placeholder="Select" @change="onSelectSettlement" size="large">
          <el-option v-for="item in settOptionsFiltered" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>

      </el-row>
      <template #footer>
        <div class="dialog-footer">
          <el-row justify="space-between">
            <el-col :span="12">
              <el-button @click="showDialog = false" style="float: left">Cancel</el-button>
            </el-col>
            <el-col :span="12">
              <el-button type="primary" @click="setLocationOnMobile" style="float: right">
                Confirm
              </el-button>
            </el-col>
          </el-row>
        </div>
      </template>
    </el-dialog>


    <el-dialog v-model="showUploadDialog" title="Upload a Zipped Shapefile/Geojson/KML/KMZ" width="30%">

      <el-upload
v-model:file-list="fileList" class="upload-demo"
        action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" :auto-upload="false"
        :show-file-list="false" :on-change="handleUploadGeo">
        <template #trigger>
          <el-button type="primary">
            <i class="el-icon-upload"></i> <!-- Prepend upload icon here -->
            {{ fileList.length > 0 ? fileList[0].name : 'Select File' }}
          </el-button>
        </template>
        <template #default>
          <span class="upload-filename" v-if="fileList.length > 0">{{ fileList[0].name }}</span>
        </template>
      </el-upload>


    </el-dialog>

  </div>

  <el-tour v-model="isTourVisible" :z-index="100000" :on-close="endTour">
    <el-tour-step
v-for="(step, index) in filteredTourSteps" :key="index" :target="step.target" :title="step.title"
      :description="step.content" />
  </el-tour>




</template>


<script lang="ts" setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { ElCard, ElPopconfirm, ElCascader, ElCascaderPanel, ElTooltip, ElTour, ElTourStep, ElDialog, ElUpload, ElSwitch } from 'element-plus'
import { useRouter } from 'vue-router'

import { steps, formFields, formData, formRules } from './common/fields.ts'
import { subcountyOptions, wardOptions, settlementOptionsV2 } from './common/index.ts'
import { createHousehold, getOneHousehold, updateHousehold } from '@/api/households'
import shortid from 'shortid';
import { useRoute } from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'

import mapboxgl from "mapbox-gl";
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { MapboxLayerSwitcherControl, MapboxLayerDefinition } from "mapbox-layer-switcher";
import { CreateRecord, DeleteRecord, updateOneRecord, getOneGeo, getOneSettlement, uploadDocuments, getfilteredGeo, duplicatePreCheck } from '@/api/settlements'

import "mapbox-layer-switcher/styles.css";
import * as turf from '@turf/turf'
import {
  ElButton,
  ElDivider,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElDatePicker,
  ElSteps,
  ElStep, ElRow, ElCol,
  ElSelect, ElOption,
  Form as ElFormInstance
} from 'element-plus';
import readShapefileAndConvertToGeoJSON from '@/utils/readShapefile'
import proj4 from 'proj4';
import { countyOptions } from './common';

import { Icon } from '@iconify/vue';
import { InfoFilled, Back } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'


const props1 = {
  checkStrictly: true,
}
const xopenMessageBox = (msg, duplicates) => {
  // Check if duplicates exist and dynamically extract keys
  const duplicateRecordsMsg = duplicates && duplicates.length > 0
    ? `The following duplicate records were found:<br><br>` +
    // Loop through duplicates and dynamically display all properties
    duplicates.map(duplicate => {
      return Object.entries(duplicate)
        .map(([key, value]) => `⚠️ ${key}: ${value || 'N/A'}`) // Dynamically generate message for each key-value pair
        .join(); // Add <br> to separate each property
    }).join('<br><br>') // Separate each record by an extra line using <br><br>
    : 'No duplicates found.';

  // Combine the initial message with the duplicates message
  const message = ` ${duplicateRecordsMsg}`;

  // Display the formatted message in a warning box with HTML formatting
  ElMessageBox.confirm(
    message, // Combined message with dynamic properties and HTML line breaks
    'Warning',
    {
      confirmButtonText: 'Proceed',
      cancelButtonText: 'Cancel',
      type: 'warning',
      dangerouslyUseHTMLString: true, // Enable HTML rendering in the message box
    }
  )
    .then(() => {
      ElMessage({
        type: 'success',
        message: 'Action completed',
      });
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: 'Action canceled',
      });
    });
}

const openMessageBox = (msg, duplicates) => {
  // Check if duplicates exist and dynamically extract keys
  const duplicateRecordsMsg = duplicates && duplicates.length > 0
    ? msg + `<br>` +
    // Loop through duplicates and dynamically display all properties in a single line, separated by commas
    duplicates.map((duplicate, index) => {
      // Number each duplicate record starting from 1
      const recordNumber = index + 1;
      return `${recordNumber}. ` +
        Object.entries(duplicate)
          .map(([key, value]) => `${key}: ${value || 'N/A'}`) // Combine key and value
          .join(', '); // Join the properties with commas
    }).join('<br>') // Separate each record with a line break
    : 'No duplicates found.';

  // Combine the initial message with the duplicates message
  const message = ` ${duplicateRecordsMsg}`;

  // Display the formatted message in a warning box with HTML formatting
  ElMessageBox.confirm(
    message, // Combined message with dynamic properties and HTML line breaks
    'Warning',
    {
      confirmButtonText: 'Proceed to Create',
      cancelButtonText: 'Cancel',
      type: 'warning',
      dangerouslyUseHTMLString: true, // Enable HTML rendering in the message box
    }
  )
    .then(() => {
      // Proceed nonethess 

      CreateRecord(formData)
        .then(() => {
          // This block will be executed after CreateRecord succeeds
          goBack(); // Call goBack after successful record creation
        })
        .catch((error) => {
          // Handle any errors that occur during CreateRecord
          console.error("Error creating record:", error);

        });


    })
    .catch(() => {
      console.log("cancelled")
    });
};





const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = MapBoxToken;


const isMobile = computed(() => appStore.getMobile)

const showUploadDialog = ref(false)
const route = useRoute()
//const { push } = useRouter()
const router = useRouter();

const goBack = () => {
  router.back();
};

const props = {
  expandTrigger: 'hover' as const,

};

const labelPosition = ref('top')
if (isMobile.value) {
  labelPosition.value = 'top'

}

// for mobile only 
const county_id = ref()
const subcounty_id = ref()
const subcountyOptionsFiltered = ref([])
const ward_id = ref()
const wardOptionsFiltered = ref([])
const selectAdmin = ref()

const settOptionsFiltered = ref([])
const settlement_id = ref()
const area_ha = ref(0)


const onSelectCounty = (county_id) => {
  formData.subcounty_id = null
  formData.ward_id = null
  formData.settlement_id = null
  subcountyOptionsFiltered.value = subcountyOptions.value.filter((obj) => obj.county_id == county_id);
  console.log('changed county')
  console.log(subcountyOptionsFiltered)
  handleChangeLocation([county_id])

};


const onSelectSubcounty = (subcounty_id) => {
  formData.ward_id = null
  formData.settlement_id = null

  wardOptionsFiltered.value = wardOptions.value.filter((obj) => obj.subcounty_id == subcounty_id);
  handleChangeLocation([formData.county_id.value, subcounty_id])

};

const centroid = ref(37, 1)

const calculateArea = (geom) => {
  // Calculate the area using Turf.js
  const areaSquareMeters = turf.area(geom);

  // Convert square meters to hectares
  const areaHectares = areaSquareMeters / 10000;
  area_ha.value = areaHectares.toFixed(4)

  var centre = turf.centroid(geom);
  centroid.value = centre.geometry.coordinates

};


const onSelectWard = (ward_id) => {

  formData.settlement_id = null
  settOptionsFiltered.value = settlementOptionsV2.value.filter((obj) => obj.ward_id == ward_id);
  handleChangeLocation([formData.county_id.value, formData.subcounty_id.value, ward_id])

};

const onSelectSettlement = (sett_id) => {
  formData.settlement_id = sett_id
  handleChangeLocation([formData.county_id.value, formData.subcounty_id.value, formData.ward_id.value, sett_id])

  // const selectedSettlement = settOptionsFiltered.value.filter((obj) => obj.value === sett_id);
  // selectAdmin.value = selectAdmin.value + ' | ' + selectedSettlement[0].label
};

const setLocationOnMobile = () => {
  formData.county_id = county_id.value
  formData.subcounty_id = subcounty_id.value
  formData.ward_id = ward_id.value
  formData.settlement_id = settlement_id.value
  formData.location = [county_id, subcounty_id, ward_id, settlement_id]
  handleChangeLocation([county_id.value, subcounty_id.value, ward_id.value])

  console.log('formData', formData)
  showDialog.value = false
};
/// - mobile end 

const fileList = ref([])
const visibleUpload = ref(false)

const newRecord = ref(true)

const map = ref()

const mapContainer = ref(null);
const geomScope = ref([])
const model = 'settlement'
const component_id = ref()

onMounted(async () => {

  //formData.value = JSON.parse(route.query.formData);
  // console.log('data>>',data)
  console.log('passed data', route.query.id)

  console.log('Loaded.......')
  component_id.value = route.params.domain
  console.log('component_id', component_id)
  console.log('route.params.', route.query)


  const form = {}
  form.model = model
  form.id = route.query.id

  let ward_id



  if (route.query.id) {
    await getOneSettlement(form)
      .then((res) => {
        // Handle the successful response here
        console.log(res.data)
        var curData = res.data
        curData.geom = curData.geom

        console.log('curData', curData)
        geomScope.value = curData.geom


        subcountyOptionsFiltered.value = subcountyOptions.value.filter((obj) => obj.county_id == curData.county_id);
        wardOptionsFiltered.value = wardOptions.value.filter((obj) => obj.subcounty_id == curData.subcounty_id);
        settOptionsFiltered.value = settlementOptionsV2.value.filter((obj) => obj.ward_id == curData.ward_id);

        ward_id = curData.ward_id




        //  formData = res.data
        Object.assign(formData, curData);
        console.log(formData)
        newRecord.value = false

        calculateArea(formData.geom)
        console.log("This is not a new record........")



      })
      .catch((error) => {
        // Handle the error here
        console.log('Error:', error);
      });


    if (!geomScope.value) {
      // if the settlement does not have geomtery, allocated the ward geom to the settlement 

      const wform = {}
      wform.model = 'ward'
      wform.id = ward_id

      geomScope.value = await getWard(wform)

      console.log("wardGeom - geomScope.value", geomScope.value)

      showMessage.value = true

    }

  } else {

    Object.keys(formData).forEach((key) => {
      formData[key] = undefined;
    });
  }
})




const getWard = async (wform) => {
  console.log(wform)

  let ward = await getOneSettlement(wform)
  console.log("ward", ward)

  return ward.data.geom

};

const showDialog = ref(false)
const cascadeOptions = ref([])
const showOnMobile = (options) => {
  console.log(options)
  cascadeOptions.value = options

  showDialog.value = true
};


const currentStep = ref(0);
//const dynamicFormRef: Ref<string | null> = ref(null);
const dynamicFormRef = ref<FormInstance>()

const currentStepFields = computed(() => formFields[currentStep.value]);

const currentStepRules = computed(() => {
  const stepRulesKey = `step${currentStep.value + 1}`;
  return formRules[stepRulesKey];
});

const totalSteps = computed(() => steps.length);

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};


const bounds = ref([])
const readJson = (event) => {
  console.log('Reading Josn file....', event)
  let str = event.target.result


  let json = JSON.parse(str)
  //  console.log('parsed', json.crs)

  const targetProj = "+proj=longlat +datum=WGS84 +no_defs"

  // const sourceProj = '+proj=utm +zone=37 +ellps=WGS84 +datum=WGS84 +units=m +no_defs';

  // const sourceProj = '+proj=utm +zone=37 +ellps=WGS84 +datum=WGS84 +units=m +no_defs';
  let sourceProj
  let epsgCode
  let crsProp = json.crs ? json.crs.properties.name : null;

  if (crsProp && crsProp.includes('EPSG')) {
    console.log('The string contains the character "EPSG"');
    epsgCode = crsProp.match(/EPSG::(\d+)/)[1]
  } else {
    epsgCode = 4326
  }


  console.log(epsgCode)


  console.log(epsgCode)

  if (epsgCode == 21037) {
    // zone 37S
    sourceProj = "+proj=utm + zone=37 + south + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs";
  }
  else if (epsgCode == 21097) {
    // zone 37 N
    sourceProj = "+proj=utm + zone=37 + north + a=6378249.145 + rf=293.465 + towgs84=-157,-2,-299,0,0,0,0 + units=m + no_defs";
  }
  else if (epsgCode == 21036) {
    // zone 36 S
    sourceProj = "+proj=utm + zone=36 + south + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs";
  }
  else if (epsgCode == 21096) {
    // zone 36N
    sourceProj = "+proj=utm + zone=36 + north + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs";
  }

  else {
    sourceProj = "+proj=longlat +datum=WGS84 +no_defs"

  }


  proj4.defs("SOURCE_CRS", sourceProj);
  proj4.defs("WGS84", targetProj);


  if (json.features.length != 1) {
    ElMessage.warning('Please uplaod a file with only one feature. This one has ' + json.features.length + ' features')

  }
  else {
    console.log('ok>>', json.features)

    const geometry = json.features[0].geometry;
    console.log(geometry)
    // Check if the geometry type is "Polygon" or "MultiPolygon"
    if (geometry.type === "Polygon") {
      // If it's a single polygon, project its coordinates
      geometry.coordinates[0] = geometry.coordinates[0].map(coordinate => {
        return proj4("SOURCE_CRS", "WGS84", coordinate);
      });
    } else if (geometry.type === "MultiPolygon") {
      // If it's a multi-polygon, loop through all polygons and project their coordinates
      geometry.coordinates.forEach(polygon => {
        polygon[0] = polygon[0].map(coordinate => {
          return proj4("SOURCE_CRS", "WGS84", coordinate);
        });
      });
    }

    console.log('geometry', geometry)
    let geom = {
      type: json.features[0].geometry.type,
      coordinates: geometry.coordinates
    }
    console.log(geom)
    formData.geom = geom


    geomScope.value = geom
    map.value.getSource("scope").setData(geomScope.value);
    bounds.value = turf.bbox((geomScope.value))
    console.log("From geojson", geomScope.value)

    calculateArea(geom)
    //map.value.fitBounds(bounds.value, { padding: 20, maxZoom: 18 })

    loadMap()

  }

}


const readShp = async (file) => {
  console.log('Reading Shp file....')

  // await getGeoJSON(file)
  readShapefileAndConvertToGeoJSON(file)
    .then((geojson) => {

      console.log("Geo>", geojson)
      console.log("Geo>", geojson.length)
      console.log("Geo1>", geojson[0])


      if (geojson.length != 1) {
        ElMessage.warning('Please upload a file with only one feature. This one has ' + geojson.length + ' features')

      }
      else {
        console.log('ok>>', geojson[0])


        var crs = { type: 'name', properties: { name: 'EPSG:4326' } }

        let geomX = {
          type: geojson[0].geometry.type,
          coordinates: geojson[0].geometry.coordinates,

        }


        formData.geom = geomX

        geomScope.value = geomX
        map.value.getSource("scope").setData(geomScope.value);
        bounds.value = turf.bbox((geomScope.value))
        console.log("From SHP/KML", geomScope.value)
        //map.value.fitBounds(bounds.value, { padding: 20, maxZoom: 18 })
        calculateArea(geomX)
        loadMap()

      }


    })
    .catch((error) => {
      console.error(error)
      ElMessage.error('Invalid files. Check your zipped file to contain (.shp, .dbf and .prj) or a proper kml/kmz')


    })

  //uploadPolygon(feat)
}

const handleUploadGeo = async (uploadFile) => {
  console.log('Upload>>>', uploadFile)
  //  uploadRef.value!.submit()

  console.log("File type", uploadFile.name.split('.').pop())
  var fileType = uploadFile.name.split('.').pop()
  var rfile = uploadFile.raw

  let reader = new FileReader()
  console.log(reader)

  //var mydata = JSON.parse(uploadFile);

  if (fileType === 'geojson' || fileType === 'json') {
    reader.onload = readJson
    reader.readAsText(rfile)
  }
  else if (fileType === 'zip' || fileType === 'kml' || fileType === 'kmz') {
    readShp(rfile)

    // reader.readAsArrayBuffer(rfile)
  } else {
    ElMessage.error('Only GeoJSON, KML, KMZ or zipped shapefiles are supported at the moment')


  }
  showUploadDialog.value = false

}


















const handleStepClick = (index) => {

  currentStep.value = index;
}


const nextStep = async () => {
  if (currentStep.value < totalSteps.value - 1 && dynamicFormRef) {
    const formInstance = dynamicFormRef
    formInstance.value.validate((valid: boolean) => {
      if (valid) {
        console.log(formInstance)
        currentStep.value++;
      }
    });
  }
  console.log('xxxxx', currentStep.value, totalSteps.value)

  // Once you are on the last step. Load the map
  if ((currentStep.value + 1) == (totalSteps.value - 1)) {
    console.log('Last Step')

    console.log('mapContainer', mapContainer)
    await new Promise(resolve => setTimeout(resolve, 100));  //delay for 2 seconds the call loadmap

    loadMap()
    // toggleDrawToolbox('digitize')

  }
};


const loadMap = async () => {

  map.value = new mapboxgl.Map({
    container: 'mapContainer',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [37.137343, 1.137451],
    zoom: 8
  });



  map.value.addControl(new mapboxgl.NavigationControl());
  // add marker for project location


  function updateRuleform(feature) {
    // do something with the new marker feature
    var crs = { type: 'name', properties: { name: 'EPSG:4326' } }
    feature.geometry.crs = crs
    console.log('----feature', feature);



    formData.geom = feature.geometry
    console.log(formData)
    calculateArea(feature.geometry)

    console.log('centroid.value', centroid.value)

    map.value.getSource('labels').setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: centroid.value, // Update with the actual coordinates
          },
          properties: {
            title: area_ha.value + " Ha.", // Update with the desired label text (area)
          },
        },
      ],
    });

  }

  // listen for the draw.create event
  map.value.on('draw.create', function (e) {
    // check if the new feature is a marker
    // if (e.features[0].geometry.type === 'Polygon') {
    // trigger your function here
    updateRuleform(e.features[0]);

    //  }
  });


  // listen for the draw.se event
  map.value.on('draw.update', function (e) {
    // check if the new feature is a marker
    //if (e.features[0].geometry.type === 'Polygon') {
    // trigger your function here
    updateRuleform(e.features[0]);

    // }
  });

  // Listen for the draw.delete event
  map.value.on('draw.delete', function (event) {
    // Get the IDs of the deleted features
    var deletedFeatureIds = event.features.map(function (feature) {
      return feature.id;
    });

    // Remove the corresponding layers from the map
    deletedFeatureIds.forEach(function (id) {
      map.value.removeLayer(id);
    });


    map.value.getSource('labels').setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: centroid.value, // Update with the actual coordinates
          },
          properties: {
            title: '', // Update with the desired label text (area)
          },
        },
      ],
    });




  });

  map.value.on('mousemove', function (e) {
    document.getElementById('coordinates').innerHTML =
      'Lon: ' + e.lngLat.lng.toFixed(5) + ' Lat: ' + e.lngLat.lat.toFixed(5);
  });


  map.value.on('load', function () {
    // code to execute after the map has finished loading
    console.log("Map has loaded......")
    //map.value.addControl(draw, 'top-left');



    map.value.addLayer({
      id: 'Satellite',
      source: { "type": "raster", "url": "mapbox://mapbox.satellite", "tileSize": 256 },
      type: "raster"
    });

    map.value.addLayer({
      id: 'Streets',
      source: { "type": "raster", "url": "mapbox://mapbox.streets", "tileSize": 256 },
      type: "raster"
    }, 'Satellite');



    map.value.addSource('scope', {
      type: 'geojson',
      //data: projectPoly.value
      data: geomScope.value,
    });




    map.value.addLayer({
      id: 'labels',
      type: 'symbol',
      source: {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: centroid.value, // Replace with initial coordinates
              },
              properties: {
                title: area_ha.value + " Ha.", // Initialize with an empty string
              },
            },
          ],
        },
      },
      layout: {
        'text-field': ['get', 'title'],
        'text-size': 16,
        'text-anchor': 'top',
      },
      paint: {
        'text-color': '#FF0000', // Red text color
        'text-halo-color': '#FFFFFF', // White halo color
        'text-halo-width': 2, // Adjust the halo width as needed    
      },


    });












    // Edit only if not a new record 
    if (!newRecord.value) {
      toggleDrawToolbox('digitize')
      const geojson = JSON.parse(JSON.stringify(geomScope.value));
      var feature = turf.feature(geojson);
      var collection = turf.featureCollection([feature])
      draw.set(collection);
      // Check if the new feature is a polygon
      // if (collection.features[0].type === 'Polygon') {
      // Trigger your function here
      updateRuleform(collection.features[0]);
      //}
    }


    if (newRecord.value) {
      toggleDrawToolbox('digitize')
      // Load this outline only if its a new settlement 
      map.value.addLayer({
        'id': 'geomScope',
        'type': 'line',
        'source': 'scope',
        'layout': {},
        'paint': {
          'line-color': 'red',
          'line-width': 3
        }
      });

    }
    else {


      map.value.addLayer({
      'id': 'draw-layer',
      'type': 'fill',
      'source': {
        'type': 'geojson',
        'data': {
          'type': 'FeatureCollection',
          'features': []
        }
      },
      'paint': {
        'fill-color': '#0080ff', // blue color fill
         'fill-opacity': 1
      },
      'layout': {}
    });
    }


    // switch it off until the user selects to
    map.value.setLayoutProperty('Satellite', 'visibility', 'none')


    const layers: MapboxLayerDefinition[] = [

      {
        id: "Satellite",
        title: "Satellite",
        visibility: 'none',
        type: 'base'
      },

      {
        id: "Streets",
        title: "Streets",
        visibility: 'none',
        type: 'base'
      },

    ];
    map.value.addControl(new MapboxLayerSwitcherControl(layers));





    var bounds = turf.bbox((geomScope.value));
    map.value.fitBounds(bounds, { padding: 20, duration: 1000 });



  });




  //map.value.addControl(ctrlLine, "top-left");



  function addHomeButton(map) {
    class HomeButton {
      onAdd(map) {
        const div = document.createElement("div");
        div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
        div.id = "upload";
        div.innerHTML = `<button>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.5" d="M17 9.00195C19.175 9.01406 20.3529 9.11051 21.1213 9.8789C22 10.7576 22 12.1718 22 15.0002V16.0002C22 18.8286 22 20.2429 21.1213 21.1215C20.2426 22.0002 18.8284 22.0002 16 22.0002H8C5.17157 22.0002 3.75736 22.0002 2.87868 21.1215C2 20.2429 2 18.8286 2 16.0002L2 15.0002C2 12.1718 2 10.7576 2.87868 9.87889C3.64706 9.11051 4.82497 9.01406 7 9.00195" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"></path> <path d="M12 15L12 2M12 2L15 5.5M12 2L9 5.5" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
		
  </button>`; div.addEventListener("contextmenu", (e) => e.preventDefault());
        div.addEventListener("click", () => showUploadDialog.value = true);

        return div;
      }
    }
    const homeButton = new HomeButton();
    map.addControl(homeButton, "top-left");
  }
  addHomeButton(map.value)


}

 


const draw = new MapboxDraw({
  displayControlsDefault: false,
  controls: {
    point: true,
    line_string: false,
    polygon: true,
    trash: true
  },

})

const toggleDrawToolbox = (value) => {
  console.log(value)

  if (value == 'digitize') {
    visibleUpload.value = false

    map.value.addControl(draw, 'top-left');
    console.log('adding')
  } else if (value == 'upload') {

    visibleUpload.value = true
    map.value.removeControl(draw);
    console.log('remove....')
  }
  else {
    visibleUpload.value = false

    map.value.removeControl(draw);
    console.log('remove....')

  }



};



const submitForm = async () => {
  const formInstance = dynamicFormRef
  formInstance.value.validate(async (valid: boolean) => {
    if (valid) {
      // Perform form submission logic

      formData.model = model
      formData.component_id = component_id.value

 



      //formData.geom =geomScope.value

      if (newRecord.value || formData.geom.type == 'Polygon') {
        // Calculate area using Turf.js if newRecord is not present
        const areaSquareMeters = turf.area(formData.geom);
        const areaHectares = areaSquareMeters / 10000;
        formData.area = areaHectares.toFixed(4);
      }





      if (newRecord.value) {
        formData.isApproved = 'Pending';
        formData.createdBy = userInfo.id

        formData.code = shortid.generate();
        formData.checkFields = ["name", "county_id"]; // additional checks for duplicates

        // Perform the duplicate check first
        duplicatePreCheck(formData)
          .then(response => {
            console.log('Success:', response);

            CreateRecord(formData)
              .then(() => {
                // This block will be executed after CreateRecord succeeds
                goBack(); // Call goBack after successful record creation
              })
              .catch((error) => {
                // Handle any errors that occur during CreateRecord
                console.error("Error creating record:", error);

              });

          })
          .catch(error => {
            // Check if duplicates were found 
            openMessageBox(error.response.data.message, error.response.data.duplicates)
            // Prompt user for confirmation 
            console.error('Error during duplicate check:', error);
            // Handle duplicate check error (e.g., server issues)
          });
      } else {


        // Proceed to update the record if no new record creation
        updateOneRecord(formData)
          .then(updateResponse => {
            console.log('Record updated successfully:', updateResponse);
            // Handle the successful update here
          })
          .catch(updateError => {
            console.error('Error during record update:', updateError);
            // Handle server error or other issues
          });
      }



      goBack()

      // push({
      //    name: 'Health'
      // })

    } else {
      // Handle form validation errors
      console.log('fail validation')
    }
  });

};


const handleChangeLocationOption = async (value: any) => {
  toggleDrawToolbox(value)
}

const handleChangeLocation = async (value: any) => {
  console.log('Location field changed:', value);


  if (value.length == 1) {
    var model = 'county'
    var model_id = value[0]
  } else if (value.length == 2) {
    var model = 'subcounty'
    var model_id = value[1]
  }
  else if (value.length == 3) {
    var model = 'ward'
    var model_id = value[2]
  }
  else {
    var model = 'settlement'
    var model_id = value[3]
  }

  const geoForm = {}
  geoForm.model = model
  geoForm.id = model_id

  console.log(geoForm)
  const res = await getOneGeo(geoForm)

  console.log('LocGeo', res.data[0].json_build_object)


  if (newRecord.value) {
    geomScope.value = res.data[0].json_build_object

  }
  //const lastElement = array[array.length - 1];



  console.log('location field changed:', formData);

};




// Function to get the field change handler based on field name
const getFieldChangeHandler = (fieldName: string) => {
  const field = formFields.flat().find((f) => f.name === fieldName);
  if (fieldName == 'county_id') {
    onSelectCounty(formData[fieldName])
  }


  if (fieldName == 'subcounty_id') {
    onSelectSubcounty(formData[fieldName])
  }
  if (fieldName == 'ward_id') {
    onSelectWard(formData[fieldName])
  }
  if (fieldName == 'settlement_id') {
    onSelectSettlement(formData[fieldName])
  }




  if (fieldName == 'location_option') {
    handleChangeLocationOption(formData[fieldName])
  }
  return undefined;
};


// Addd message if project Geometry is not found 
const wardMessage = "This settlement does not have location geometry defined. The ward geometry is shown instead. Edit to reflect the actual settlement location"

const showMessage = ref(false)



const isTourVisible = ref(false)
const showTour = () => {

  isTourVisible.value = true


}

const filteredTourSteps = computed(() => {

  const fil = tourSteps.value.filter(step => step.step == currentStep.value && step.visible == true);
  console.log('filteredTourSteps', fil)
  return fil
});


const endTour = () => {

}

// Tour steps configuration
const tourSteps = ref([
  // Step 0: Basic Information
  {
    step: 0,
    target: '#btn1',
    title: 'County',
    content: 'Select the county where the settlement is located.',
    visible: true,
  },
  {
    step: 0,
    target: '#btn2',
    title: 'Constituency',
    content: 'Choose the constituency within the selected county.',
    visible: true,
  },
  {
    step: 0,
    target: '#btn3',
    title: 'Ward',
    content: 'Select the ward within the chosen constituency.',
    visible: true,
  },
  {
    step: 0,
    target: '#btn4',
    title: 'Name',
    content: 'Enter the name of the settlement.',
    visible: true,
  },
  {
    step: 0,
    target: '#btn5',
    title: 'Settlement Type',
    content: 'Specify if the settlement is a slum or informal settlement.',
    visible: true,
  },
  {
    step: 0,
    target: '#btn6',
    title: 'Parcel Number',
    content: 'Provide the parcel number for the settlement.',
    visible: true,
  },
  {
    step: 0,
    target: '#btn7',
    title: 'Parcel Ownership',
    content: 'Indicate whether the parcel is public, private, or community-owned.',
    visible: true,
  },
  {
    step: 0,
    target: '#btn8',
    title: 'RIM/Survey Plan',
    content: 'Enter the RIM or survey plan number for the parcel.',
    visible: true,
  },
  {
    step: 0,
    target: '#btn9',
    title: 'Survey Status',
    content: 'Specify if the parcel has been surveyed (Yes, No, or Unknown).',
    visible: true,
  },
 
  {
    step: 0,
    target: '#btn11',
    title: 'Land Status',
    content: 'Select the land status (Registered, Unregistered, or Disputed).',
    visible: true,
  },
  {
    step: 0,
    target: '#btn12',
    title: 'Parcel Owner Type',
    content: 'Choose the type of parcel owner (Individual, Government, Community, or Corporate).',
    visible: true,
  },
  // Step 1: Physical & Structural Characteristics
  {
    step: 1,
    target: '#btn13',
    title: 'Area (Ha)',
    content: 'Enter the area of the settlement in hectares.',
    visible: true,
  },
  {
    step: 1,
    target: '#btn14',
    title: 'Population',
    content: 'Provide the estimated population of the settlement.',
    visible: true,
  },
  {
    step: 1,
    target: '#btn15',
    title: 'Population Density',
    content: 'Enter the population density of the settlement.',
    visible: true,
  },
  {
    step: 1,
    target: '#btn16',
    title: 'Land Use',
    content: 'Describe the predominant land use in the settlement.',
    visible: true,
  },
  {
    step: 1,
    target: '#btn17',
    title: 'Near River',
    content: 'Indicate if the settlement is near a river.',
    visible: true,
  },
  {
    step: 1,
    target: '#btn18',
    title: 'Utility Way-leave',
    content: 'Specify if the settlement is on a utility way-leave.',
    visible: true,
  },
  {
    step: 1,
    target: '#btn19',
    title: 'Road Reserve',
    content: 'Indicate if the settlement is on a road reserve.',
    visible: true,
  },
  {
    step: 1,
    target: '#btn20',
    title: 'Structure Types',
    content: 'Select the types of structures in the settlement (e.g., Temporary, Permanent).',
    visible: true,
  },
  {
    step: 1,
    target: '#btn21',
    title: 'Development Level',
    content: 'Choose the development level (Single Storey or Multi Storey).',
    visible: true,
  },
  {
    step: 1,
    target: '#btn22',
    title: 'Building Materials',
    content: 'Select typical building materials used in the settlement.',
    visible: true,
  },
  {
    step: 1,
    target: '#btn23',
    title: 'Structure Spacing',
    content: 'Enter the average distance between structures in meters.',
    visible: true,
  },
  {
    step: 1,
    target: '#btn24',
    title: 'Urban Center Proximity',
    content: 'Provide the distance to the nearest urban center in kilometers.',
    visible: true,
  },
  {
    step: 1,
    target: '#btn25',
    title: 'Trunk Road Proximity',
    content: 'Enter the distance to the nearest trunk road in kilometers.',
    visible: true,
  },
  {
    step: 1,
    target: '#btn26',
    title: 'Electricity Availability',
    content: 'Indicate if electricity is available in the settlement.',
    visible: true,
  },
  {
    step: 1,
    target: '#btn27',
    title: 'Piped Water Availability',
    content: 'Specify if piped water is available in the settlement.',
    visible: true,
  },
  // Step 2: Socio-Economic & Environmental Details
  {
    step: 2,
    target: '#btn28',
    title: 'Court Cases/Claims',
    content: 'Indicate if there are any court cases or claims related to the settlement.',
    visible: true,
  },
  {
    step: 2,
    target: '#btn29',
    title: 'Status',
    content: 'Set the settlement status as Active or Decommissioned.',
    visible: true,
  },
  {
    step: 2,
    target: '#btn30',
    title: 'Approval Status',
    content: 'Select the approval status (Pending, Approved, or Rejected).',
    visible: true,
  },
  {
    step: 2,
    target: '#btn31',
    title: 'Number of Households',
    content: 'Enter the number of households in the settlement.',
    visible: true,
  },
  {
    step: 2,
    target: '#btn32',
    title: 'Average Household Size',
    content: 'Provide the average household size in the settlement.',
    visible: true,
  },
  {
    step: 2,
    target: '#btn33',
    title: 'Median Household Income',
    content: 'Enter the median household income for the settlement.',
    visible: true,
  },
  {
    step: 2,
    target: '#btn34',
    title: 'Plot Ownership Ratio',
    content: 'Provide the ratio of plots owned in the settlement.',
    visible: true,
  },
  {
    step: 2,
    target: '#btn35',
    title: 'Plot Tenant Ratio',
    content: 'Enter the ratio of plots rented in the settlement.',
    visible: true,
  },
  {
    step: 2,
    target: '#btn36',
    title: 'Average Rent',
    content: 'Provide the average rent for plots in the settlement.',
    visible: true,
  },
  {
    step: 2,
    target: '#btn37',
    title: 'Environmental Hazards',
    content: 'Describe the main environmental hazards affecting the settlement.',
    visible: true,
  },
  {
    step: 2,
    target: '#btn38',
    title: 'General Location',
    content: 'Enter a general description of the settlement’s location.',
    visible: true,
  },
 
  {
    step: 2,
    target: '#btn40',
    title: 'Description',
    content: 'Provide a detailed description of the settlement.',
    visible: true,
  },
  {
    step: 2,
    target: '#btn41',
    title: 'Comments/Remarks',
    content: 'Add any additional comments or remarks about the settlement.',
    visible: true,
  },
  // Step 3: Geolocation
  {
    step: 3,
    target: '#btn42',
    title: 'Geometry',
    content: 'Define the settlement’s geometry by drawing on the map or uploading a file.',
    visible: true,
  },
  {
    step: 3,
    target: '#mapContainer',
    title: 'Map',
    content: 'View and edit the settlement’s location on the map. Zoom in to refine the boundaries.',
    visible: true,
  },
  {
    step: 3,
    target: '#upload',
    title: 'Upload Geometry',
    content: 'Upload a GeoJSON, shapefile, KML, or KMZ file to define the settlement’s geometry.',
    visible: true,
  },
]);

 

// Watch dependencies and log changes (or trigger additional actions)
watch(
  [currentStep, tourSteps],
  (newValues, oldValues) => {
    console.log("Dependencies changed:", newValues);
    console.log("Filtered steps:", filteredTourSteps.value);
    // Any other side effects or actions can be performed here
  },
  { immediate: true }
);


</script>
<style>
.small-steps .el-step {
  width: 50px;
  /* Adjust the width as per your requirement */
  height: 35px;
  /* Adjust the height as per your requirement */
  line-height: 20px;
  /* Adjust the line-height as per your requirement */
  padding-bottom: 5px;
  /* Add 5 pixels bottom padding */

}
</style>



<style scoped>
.small-steps .el-step__title {
  display: none;
}


@media (max-width: 768px) {
  .box-card {
    padding: 10px;
  }

  .small-steps .el-step__title {
    display: none;
  }

  .cascader-popper-mobile {
    width: 100% !important;
    left: 0 !important;
    right: 0 !important;
    transform: none !important;
  }

  .button-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 10px;
  }
}

.custom-cascader-popper .el-cascader__dropdown {
  /* Position the popper below instead of on the right */
  top: auto;
  left: 0;
  right: auto;
  bottom: -10px;
}
</style>

<style scoped>
.basemap {
  width: 100%;
  height: 65vh;
}



.coordinates {
  display: block;
  position: absolute;
  /* Use absolute positioning to position it within the container */
  width: 10%;
  bottom: 15;
  /* Set to 0 to align it at the bottom */
  left: 50%;
  /* Set to 50% to horizontally center it */
  transform: translateX(-50%);
  /* Use transform to horizontally center it */
  background-color: rgba(10, 10, 10, 0.85);
  color: #fbfbfb;
  text-align: center;
  font-size: 10px;
  z-index: 10;
  border-radius: 5px;
}


.upload {
  display: block;
  position: relative;
  width: 24%;
  top: 100px;
  left: 20px;
  /* Updated to move the element to the top left corner */
  background-color: rgba(195, 26, 26, 0.85);
  color: #fbfbfb;
  text-align: center;
  font-size: 10px;
  z-index: 10;
  border-radius: 5px;
}

.mapbox-custom-control {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
}

.upload-filename {
  margin-left: 10px;
}

.switch-container {
  display: inline-block;
  width: auto;
  white-space: nowrap;
}


.my-image-button {
  background: url("data:image/png;base64 etc...");
}
</style>