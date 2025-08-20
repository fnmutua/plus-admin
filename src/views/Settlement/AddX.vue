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
v-for="(field, index) in currentStepFields" :key="index" :span="24" :xs="24" :sm="24" :md="12" :lg="24" :xl="24">
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
               <div v-if="currentStep == totalSteps - 1" class="map-container">
          <div id="mapContainer" style="width: 100%; height: 65vh;"></div>
          <div id='coordinates' class='coordinates'></div>
          <div id='geometry-status' class='geometry-status' style="display: none;">
            <span id='geometry-status-text'>Geometry saved</span>
          </div>
        </div>
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
import { ref, reactive, onMounted, computed, watch, onBeforeUnmount } from 'vue';
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { ElCard, ElPopconfirm, ElCascader, ElCascaderPanel, ElTooltip, ElTour, ElTourStep, ElDialog, ElUpload,   } from 'element-plus'
import { useRouter } from 'vue-router'

import { steps, formFields, formData, formRules } from './common/fields.ts'
import { subcountyOptions, wardOptions, settlementOptionsV2 } from './common/index.ts'
import { createHousehold, getOneHousehold, updateHousehold } from '@/api/households'
import shortid from 'shortid';
import { useRoute } from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'

import { Loader } from '@googlemaps/js-api-loader'
import { CreateRecord, DeleteRecord, updateOneRecord, getOneGeo, getOneSettlement, uploadDocuments, getfilteredGeo, duplicatePreCheck } from '@/api/settlements'

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

// Watch for dark mode changes from the app store
watch(() => appStore.getIsDark, (isDark) => {
  // Update toolbar theme when dark mode changes
  const toolbar = document.querySelector('.google-map-unified-toolbar');
  if (toolbar) {
    const colors = {
      background: isDark ? '#2c2c2c' : '#fff',
      border: isDark ? '#3a3a3a' : '#ccc',
      shadow: isDark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.15)'
    };
    
    const toolbarContainer = toolbar.querySelector('div');
    if (toolbarContainer) {
      toolbarContainer.style.background = colors.background;
      toolbarContainer.style.border = `1px solid ${colors.border}`;
      toolbarContainer.style.boxShadow = colors.shadow;
    }
  }
  
  // Update map theme when dark mode changes
  if (googleMap.value) {
    const mapStyles = isDark ? [
      { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
      { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
      { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
      { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
      { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
      { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
      { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
      { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
      { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
      { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
      { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
      { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
      { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
      { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] }
    ] : [];
    
    googleMap.value.setOptions({ styles: mapStyles });
  }
});


const googleMapsApiKey = 'AIzaSyCrzbOkfG52zkAxYPkMvvRMlxE9qHK4uDk'

// Initialize Google Maps loader
const loader = new Loader({
  apiKey: googleMapsApiKey,
  version: 'weekly',
  libraries: ['drawing', 'geometry'],
  region: 'KE',
  language: 'en'
})


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

const centroid = ref({ lat: 1, lng: 37 })

const calculateArea = (geom) => {
  // Handle different geometry types
  if (geom.type === 'Point') {
    // For points, set area to 0 and use the point coordinates directly
    area_ha.value = 0;
    centroid.value = {
      lat: geom.coordinates[1],
      lng: geom.coordinates[0]
    };
    return;
  }
  
  // Calculate the area using Turf.js for polygons
  try {
    const areaSquareMeters = turf.area(geom);
    
    // Convert square meters to hectares
    const areaHectares = areaSquareMeters / 10000;
    area_ha.value = parseFloat(areaHectares.toFixed(4));
    
    var centre = turf.centroid(geom);
    // Convert to Google Maps LatLng format (lat, lng)
    centroid.value = {
      lat: centre.geometry.coordinates[1],
      lng: centre.geometry.coordinates[0]
    };
  } catch (error) {
    console.error('Error calculating area:', error);
    area_ha.value = 0;
    // Set a default centroid if calculation fails
    if (geom.coordinates && geom.coordinates.length > 0) {
      if (geom.type === 'Polygon') {
        centroid.value = {
          lat: geom.coordinates[0][0][1],
          lng: geom.coordinates[0][0][0]
        };
      } else if (geom.type === 'MultiPolygon') {
        centroid.value = {
          lat: geom.coordinates[0][0][0][1],
          lng: geom.coordinates[0][0][0][0]
        };
      }
    }
  }
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


  const form: { model: string; id: string } = {
    model: model,
    id: String(route.query.id || '')
  }

  let ward_id



  if (route.query.id) {
    await getOneSettlement(form as any)
      .then((res: any) => {
        // Handle the successful response here
        console.log(res.data)
        var curData = res.data
        curData.geom = curData.geom

        console.log('curData', curData)
        geomScope.value = curData.geom


        subcountyOptionsFiltered.value = subcountyOptions.value.filter((obj: any) => obj.county_id == curData.county_id);
        wardOptionsFiltered.value = wardOptions.value.filter((obj: any) => obj.subcounty_id == curData.subcounty_id);
        settOptionsFiltered.value = settlementOptionsV2.value.filter((obj: any) => obj.ward_id == curData.ward_id);

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

      const wform: { model: string; id: string } = {
        model: 'ward',
        id: String(ward_id)
      }

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




const getWard = async (wform: { model: string; id: string }) => {
  console.log(wform)

  let ward = await getOneSettlement(wform as any)
  console.log("ward", ward)

  return (ward as any).data.geom

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
    console.log("From geojson", geomScope.value)

    calculateArea(geom)
    
    // Update Google Maps polygon
    loadExistingGeometry()

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
        console.log("From SHP/KML", geomScope.value)
        calculateArea(geomX)
        
        // Update Google Maps polygon
        loadExistingGeometry()

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
  try {
    console.log("Loading Google Maps...");
    
    // Check if map container exists
    const mapContainer = document.getElementById('mapContainer');
    if (!mapContainer) {
      throw new Error('Map container not found');
    }
    
    // Load Google Maps API
    await loader.load();
    
    // Check if google object is available
    if (!window.google || !window.google.maps) {
      throw new Error('Google Maps API not loaded properly');
    }
    
         // Function to get map styles based on theme
     const getMapStyles = () => {
       const isDark = document.documentElement.classList.contains('dark');
       
       if (isDark) {
         return [
           { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
           { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
           { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
           {
             featureType: 'administrative.locality',
             elementType: 'labels.text.fill',
             stylers: [{ color: '#d59563' }]
           },
           {
             featureType: 'poi',
             elementType: 'labels.text.fill',
             stylers: [{ color: '#d59563' }]
           },
           {
             featureType: 'poi.park',
             elementType: 'geometry',
             stylers: [{ color: '#263c3f' }]
           },
           {
             featureType: 'poi.park',
             elementType: 'labels.text.fill',
             stylers: [{ color: '#6b9a76' }]
           },
           {
             featureType: 'road',
             elementType: 'geometry',
             stylers: [{ color: '#38414e' }]
           },
           {
             featureType: 'road',
             elementType: 'geometry.stroke',
             stylers: [{ color: '#212a37' }]
           },
           {
             featureType: 'road',
             elementType: 'labels.text.fill',
             stylers: [{ color: '#9ca5b3' }]
           },
           {
             featureType: 'road.highway',
             elementType: 'geometry',
             stylers: [{ color: '#746855' }]
           },
           {
             featureType: 'road.highway',
             elementType: 'geometry.stroke',
             stylers: [{ color: '#1f2835' }]
           },
           {
             featureType: 'road.highway',
             elementType: 'labels.text.fill',
             stylers: [{ color: '#f3d19c' }]
           },
           {
             featureType: 'transit',
             elementType: 'geometry',
             stylers: [{ color: '#2f3948' }]
           },
           {
             featureType: 'transit.station',
             elementType: 'labels.text.fill',
             stylers: [{ color: '#d59563' }]
           },
           {
             featureType: 'water',
             elementType: 'geometry',
             stylers: [{ color: '#17263c' }]
           },
           {
             featureType: 'water',
             elementType: 'labels.text.fill',
             stylers: [{ color: '#515c6d' }]
           },
           {
             featureType: 'water',
             elementType: 'labels.text.stroke',
             stylers: [{ color: '#17263c' }]
           }
         ];
       } else {
         return []; // Default light theme
       }
     };
     
           // Initialize map
      googleMap.value = new google.maps.Map(mapContainer, {
        center: { lat: 1.137451, lng: 37.137343 },
        zoom: 8,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false, // Hide default map type controls
        streetViewControl: true,
        fullscreenControl: true,
        styles: getMapStyles()
      });
    
    // Wait for map to be ready
    google.maps.event.addListenerOnce(googleMap.value, 'idle', () => {
      console.log("Map is ready");
      
               // Initialize drawing manager
         try {
           drawingManager.value = new google.maps.drawing.DrawingManager({
             drawingMode: null,
             drawingControl: false, // Hide default drawing controls
             drawingModes: [
               google.maps.drawing.OverlayType.POLYGON
             ],
             polygonOptions: {
               fillColor: '#FF0000',
               fillOpacity: 0.1,
               strokeWeight: 2,
               strokeColor: '#FF0000',
               clickable: true,
               editable: true,
               draggable: false,
               zIndex: 1
             }
           });
           
           // Add drawing manager to map
           drawingManager.value.setMap(googleMap.value);
           
           // Add event listeners
           google.maps.event.addListener(drawingManager.value, 'polygoncomplete', onPolygonComplete);
           google.maps.event.addListener(googleMap.value, 'mousemove', onMouseMove);
           
           // Load existing geometry if available (for editing sessions)
           if (geomScope.value && Object.keys(geomScope.value).length > 0) {
             console.log('Loading existing geometry for editing session');
             console.log('Geometry data:', JSON.stringify(geomScope.value, null, 2));
             ElMessage.info('Loading existing geometry for editing...');
             // Small delay to ensure map is fully rendered
             setTimeout(() => {
               loadExistingGeometry();
             }, 100);
           } else if (newRecord.value && formData.geom) {
             // For new records, if formData.geom exists but geomScope doesn't, use formData.geom
             console.log('Loading ward geometry from formData for new record');
             geomScope.value = formData.geom;
             setTimeout(() => {
               loadExistingGeometry();
             }, 100);
           } else {
             console.log('No existing geometry found - new record mode');
             ElMessage.info('Please select a ward first to get the ward boundary as a guide, then draw your settlement within it');
           }
           
           // Add unified toolbar with upload, draw, and pan tools
           addUnifiedToolbar();
        
        console.log("Google Maps loaded successfully");
        ElMessage.success('Google Maps loaded successfully');
      } catch (drawingError) {
        console.error("Error initializing drawing manager:", drawingError);
        ElMessage.warning('Map loaded but drawing features may not be available');
      }
    });
    
  } catch (error) {
    console.error("Error loading Google Maps:", error);
    
         // Try to load a basic map without drawing features
     try {
       if (window.google && window.google.maps) {
         const getMapStyles = () => {
           const isDark = document.documentElement.classList.contains('dark');
           return isDark ? [
             { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
             { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
             { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
             { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
             { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
             { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
             { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
             { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
             { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
             { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
             { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
             { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
             { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
             { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
             { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
             { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
             { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
             { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] }
           ] : [];
         };
         
                   googleMap.value = new google.maps.Map(document.getElementById('mapContainer'), {
            center: { lat: 1.137451, lng: 37.137343 },
            zoom: 8,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false, // Hide default map type controls
            styles: getMapStyles()
          });
        
        ElMessage.warning('Basic map loaded. Drawing features may not be available.');
      } else {
        ElMessage.error('Failed to load Google Maps. Please check your internet connection and API key.');
      }
    } catch (fallbackError) {
      console.error("Fallback map loading failed:", fallbackError);
      ElMessage.error('Failed to load Google Maps completely.');
    }
  }
}

const googleMap = ref(null);
const drawingManager = ref(null);
const drawnPolygons = ref([]);
const guidePolygonRef = ref(null); // Reference to the guide polygon (ward boundary)
const wardBoundaryGeometry = ref(null); // Store the ward geometry for boundary checking

const loadExistingGeometry = () => {
  if (!geomScope.value || !googleMap.value) {
    console.log('No geometry to load or map not ready');
    return;
  }
  
  // Check if geomScope is a string (might be WKT or JSON string)
  if (typeof geomScope.value === 'string') {
    console.log('geomScope is a string, attempting to parse:', geomScope.value);
    try {
      const parsed = JSON.parse(geomScope.value);
      geomScope.value = parsed;
      console.log('Successfully parsed geomScope string as JSON:', parsed);
    } catch (parseError) {
      console.error('Failed to parse geomScope string:', parseError);
      ElMessage.error('Invalid geometry format');
      return;
    }
  }
  
  // Check if geomScope has a geom property (common in some APIs)
  if (geomScope.value && geomScope.value.geom && !geomScope.value.coordinates) {
    console.log('Found geom property, using it instead:', geomScope.value.geom);
    geomScope.value = geomScope.value.geom;
  }
  
  // Handle FeatureCollection format
  if (geomScope.value && geomScope.value.type === 'FeatureCollection' && geomScope.value.features) {
    console.log('Found FeatureCollection, extracting first feature geometry');
    if (geomScope.value.features.length > 0) {
      geomScope.value = geomScope.value.features[0].geometry;
      console.log('Extracted geometry from FeatureCollection:', geomScope.value);
    } else {
      throw new Error('FeatureCollection has no features');
    }
  }
  
  // Handle Feature format
  if (geomScope.value && geomScope.value.type === 'Feature' && geomScope.value.geometry) {
    console.log('Found Feature, extracting geometry');
    geomScope.value = geomScope.value.geometry;
    console.log('Extracted geometry from Feature:', geomScope.value);
  }
  
  console.log('Loading geometry:', geomScope.value);
  console.log('Geometry type:', geomScope.value.type);
  console.log('Geometry coordinates structure:', JSON.stringify(geomScope.value.coordinates, null, 2));
  console.log('Geometry coordinates type:', typeof geomScope.value.coordinates);
  console.log('Is coordinates array?', Array.isArray(geomScope.value.coordinates));
  
  // Clear any existing polygons and markers first
  drawnPolygons.value.forEach(p => p.setMap(null));
  drawnPolygons.value = [];
  
  try {
    // Handle different geometry types
    if (geomScope.value.type === 'Point') {
      // Handle Point geometry - create a simple marker
      if (Array.isArray(geomScope.value.coordinates) && geomScope.value.coordinates.length === 2) {
        const centerLng = parseFloat(geomScope.value.coordinates[0]);
        const centerLat = parseFloat(geomScope.value.coordinates[1]);
        
        // Validate coordinates
        if (isNaN(centerLat) || isNaN(centerLng)) {
          throw new Error(`Invalid point coordinates: lng=${geomScope.value.coordinates[0]}, lat=${geomScope.value.coordinates[1]}`);
        }
        
        if (centerLat < -90 || centerLat > 90) {
          throw new Error(`Latitude out of bounds: ${centerLat}`);
        }
        
        if (centerLng < -180 || centerLng > 180) {
          throw new Error(`Longitude out of bounds: ${centerLng}`);
        }
        
        if (newRecord.value) {
          // For NEW RECORDS: Create guide polygon (ward boundary) - this is NOT editable, just a visual guide
          // We need to get the ward geometry for the guide
          if (wardBoundaryGeometry.value) {
            // Use existing ward boundary
            loadWardBoundary(wardBoundaryGeometry.value);
          } else {
            // Center map on the point
            googleMap.value.setCenter({ lat: centerLat, lng: centerLng });
            googleMap.value.setZoom(15);
          }
          
          console.log('Point geometry loaded for new record - ward boundary needed');
          ElMessage.info('Point location detected. Please select a ward to get the boundary guide, then draw your settlement within it.');
        } else {
          // For EDITING EXISTING RECORDS: Create editable point marker
          const pointMarker = new google.maps.Marker({
            position: { lat: centerLat, lng: centerLng },
            map: googleMap.value,
            draggable: true,
            title: 'Settlement Location',
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#FF0000"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(24, 24),
              anchor: new google.maps.Point(12, 12)
            }
          });
          
          // Store reference to the editable point marker
          drawnPolygons.value = [pointMarker];
          
          // Add editing event listeners to the point marker
          addPointEditListeners(pointMarker);
          
          // Store original geometry type for proper conversion back
          if (geomScope.value && geomScope.value.type) {
            geomScope.value.originalType = geomScope.value.type;
          }
          
          // Set area to 0 for points
          area_ha.value = 0;
          
          // Center map on the point
          googleMap.value.setCenter({ lat: centerLat, lng: centerLng });
          googleMap.value.setZoom(15);
          
          console.log('Existing settlement point geometry loaded as editable marker');
          ElMessage.success('Existing settlement point location loaded for editing. Drag the marker to move the location.');
        }
        
        return; // Exit early for Point geometry
        
      } else {
        throw new Error(`Point coordinates structure is invalid: ${JSON.stringify(geomScope.value.coordinates)}`);
      }
    }
    
    // Handle Polygon and MultiPolygon geometries
    let rawCoordinates;
    
    // First, check if coordinates is a string (might be WKT or other format)
    if (typeof geomScope.value.coordinates === 'string') {
      console.log('Coordinates is a string, attempting to parse:', geomScope.value.coordinates);
      try {
        // Try to parse as JSON
        const parsed = JSON.parse(geomScope.value.coordinates);
        geomScope.value.coordinates = parsed;
        console.log('Successfully parsed string coordinates as JSON:', parsed);
      } catch (parseError) {
        console.error('Failed to parse coordinates string:', parseError);
        throw new Error(`Coordinates is a string but cannot be parsed: ${geomScope.value.coordinates}`);
      }
    }
    
    // Handle Polygon geometry
    if (geomScope.value.type === 'Polygon') {
      // Standard Polygon: coordinates[0] contains the outer ring
      if (Array.isArray(geomScope.value.coordinates) && geomScope.value.coordinates.length > 0) {
        rawCoordinates = geomScope.value.coordinates[0];
        console.log('Using Polygon coordinates[0]:', rawCoordinates);
      } else {
        throw new Error(`Polygon coordinates structure is invalid: ${JSON.stringify(geomScope.value.coordinates)}`);
      }
    } else if (geomScope.value.type === 'MultiPolygon') {
      // MultiPolygon: coordinates[0][0] contains the first polygon's outer ring
      if (Array.isArray(geomScope.value.coordinates) && 
          geomScope.value.coordinates.length > 0 && 
          Array.isArray(geomScope.value.coordinates[0]) && 
          geomScope.value.coordinates[0].length > 0) {
        rawCoordinates = geomScope.value.coordinates[0][0];
        console.log('Using MultiPolygon coordinates[0][0]:', rawCoordinates);
      } else {
        throw new Error(`MultiPolygon coordinates structure is invalid: ${JSON.stringify(geomScope.value.coordinates)}`);
      }
    } else {
      // Try to handle other geometry types or malformed data
      console.warn(`Unsupported geometry type: ${geomScope.value.type}, attempting fallback`);
      
      // Try different possible structures
      if (Array.isArray(geomScope.value.coordinates)) {
        if (geomScope.value.coordinates.length > 0) {
          if (Array.isArray(geomScope.value.coordinates[0])) {
            if (geomScope.value.coordinates[0].length > 0 && Array.isArray(geomScope.value.coordinates[0][0])) {
              // MultiPolygon-like structure
              rawCoordinates = geomScope.value.coordinates[0][0];
              console.log('Using fallback MultiPolygon-like structure:', rawCoordinates);
            } else {
              // Polygon-like structure
              rawCoordinates = geomScope.value.coordinates[0];
              console.log('Using fallback Polygon-like structure:', rawCoordinates);
            }
          } else {
            // Single coordinate array
            rawCoordinates = geomScope.value.coordinates;
            console.log('Using fallback single coordinate array:', rawCoordinates);
          }
        } else {
          throw new Error(`Coordinates array is empty`);
        }
      } else {
        console.error('Coordinates is not an array:', geomScope.value.coordinates);
        throw new Error(`Cannot parse geometry coordinates structure. Expected array, got: ${typeof geomScope.value.coordinates}`);
      }
    }
    
    console.log('Raw coordinates:', rawCoordinates);
    console.log('Number of coordinate pairs:', rawCoordinates.length);
    
    // Validate coordinates are valid numbers
    const coordinates = rawCoordinates.map(coord => {
      const lat = parseFloat(coord[1]);
      const lng = parseFloat(coord[0]);
      
      // Check if coordinates are valid numbers and within reasonable bounds
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error(`Invalid coordinate: lat=${coord[1]}, lng=${coord[0]}`);
      }
      
      if (lat < -90 || lat > 90) {
        throw new Error(`Latitude out of bounds: ${lat}`);
      }
      
      if (lng < -180 || lng > 180) {
        throw new Error(`Longitude out of bounds: ${lng}`);
      }
      
      return {
        lat: lat,
        lng: lng
      };
    });
    
    console.log('Validated coordinates:', coordinates);
    console.log('Number of validated coordinates:', coordinates.length);
    
    // Ensure we have at least 3 points for a polygon
    if (coordinates.length < 3) {
      throw new Error(`Polygon must have at least 3 points, got ${coordinates.length}. Raw coordinates: ${JSON.stringify(rawCoordinates)}`);
    }
    
    if (newRecord.value) {
      // For NEW RECORDS: Create guide polygon (ward boundary) - this is NOT editable, just a visual guide
      const guidePolygon = new google.maps.Polygon({
        paths: coordinates,
        strokeColor: '#000000', // Black outline
        strokeOpacity: 0.8,
        strokeWeight: 3,
        fillColor: '#000000', // Black fill
        fillOpacity: 0.05, // Very transparent
        map: googleMap.value,
        clickable: false, // Not clickable
        editable: false, // Not editable
        draggable: false, // Not draggable
        zIndex: 1 // Lower z-index so user polygons appear on top
      });
      
      // Store guide polygon reference (but don't add to drawnPolygons array)
      guidePolygonRef.value = guidePolygon;
      
      // Store the ward geometry for boundary checking
      wardBoundaryGeometry.value = geomScope.value;
      
      console.log('Ward geometry loaded as guide polygon for new record');
      ElMessage.success('Ward boundary loaded as guide. Please draw your settlement within the black boundary.');
      
    } else {
      // For EDITING EXISTING RECORDS: Create editable settlement polygon
      const settlementPolygon = new google.maps.Polygon({
        paths: coordinates,
        strokeColor: '#FF0000', // Red outline
        strokeOpacity: 1,
        strokeWeight: 2,
        fillColor: '#FF0000', // Red fill
        fillOpacity: 0.1,
        map: googleMap.value,
        clickable: true,
        editable: true,
        draggable: false,
        zIndex: 2 // Higher z-index so it appears above guide polygons
      });
      
      // Store reference to the editable settlement polygon
      drawnPolygons.value = [settlementPolygon];
      
      // Add editing event listeners to the settlement polygon
      addPolygonEditListeners(settlementPolygon);
      
      // Store original geometry type for proper conversion back
      if (geomScope.value && geomScope.value.type) {
        geomScope.value.originalType = geomScope.value.type;
      }
      
      // Calculate area and centroid (only for polygons)
      if (geomScope.value.type === 'Polygon' || geomScope.value.type === 'MultiPolygon') {
        calculateArea(geomScope.value);
      } else {
        // For points, set area to 0
        area_ha.value = 0;
      }
      
      console.log('Existing settlement geometry loaded as editable polygon');
      ElMessage.success('Existing settlement geometry loaded for editing.');
    }
    
    // Fit bounds to geometry with padding
    const bounds = new google.maps.LatLngBounds();
    coordinates.forEach(coord => bounds.extend(coord));
    
    // Add some padding to the bounds for better visibility
    googleMap.value.fitBounds(bounds, {
      padding: { top: 50, right: 50, bottom: 50, left: 50 }
    });
    
    // Set a minimum zoom level to prevent over-zooming
    google.maps.event.addListenerOnce(googleMap.value, 'bounds_changed', () => {
      if (googleMap.value.getZoom() > 18) {
        googleMap.value.setZoom(18);
      }
    });
    
  } catch (error) {
    console.error('Error loading geometry:', error);
    ElMessage.error(`Failed to load geometry: ${error.message}`);
    
    // Fallback: center map on Kenya
    googleMap.value.setCenter({ lat: 1.137451, lng: 37.137343 });
    googleMap.value.setZoom(8);
  }
}



const addUnifiedToolbar = () => {
  if (!googleMap.value) return;
  
  // Check if toolbar already exists
  const controls = googleMap.value.controls[google.maps.ControlPosition.TOP_LEFT];
  const existingToolbar = Array.from(controls).find(control => 
    control.className === 'google-map-unified-toolbar'
  );
  
  if (existingToolbar) {
    return; // Toolbar already exists, don't add another one
  }
  
  // Function to get current theme colors
  const getThemeColors = () => {
    const isDark = document.documentElement.classList.contains('dark');
    return {
      background: isDark ? '#2c2c2c' : '#fff',
      border: isDark ? '#3a3a3a' : '#ccc',
      shadow: isDark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.15)',
      text: isDark ? '#ffffff' : '#000000'
    };
  };
  
  // Function to update toolbar theme
  const updateToolbarTheme = () => {
    const colors = getThemeColors();
    const toolbarContainer = toolbar.querySelector('div');
    if (toolbarContainer) {
      toolbarContainer.style.background = colors.background;
      toolbarContainer.style.border = `1px solid ${colors.border}`;
      toolbarContainer.style.boxShadow = colors.shadow;
    }
  };
  
  // Create unified toolbar container
  const toolbar = document.createElement('div');
  toolbar.className = 'google-map-unified-toolbar';
  
  // Get initial theme colors
  const colors = getThemeColors();
  
     toolbar.innerHTML = `
     <div style="
       background: ${colors.background};
       border: 1px solid ${colors.border};
       border-radius: 6px;
       padding: 8px;
       box-shadow: ${colors.shadow};
       display: flex;
       gap: 4px;
       align-items: center;
       transition: all 0.3s ease;
     ">
       <!-- Pan Tool -->
       <button id="pan-tool" style="
         background: #4CAF50;
         border: none;
         border-radius: 4px;
         padding: 8px 12px;
         cursor: pointer;
         font-size: 12px;
         color: white;
         display: flex;
         align-items: center;
         gap: 4px;
         transition: background-color 0.2s;
       " title="Pan Tool">
         <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 14px; height: 14px;">
           <path d="M10 9V5L3 12L10 19V15.1C15 15.1 18.5 16.5 21 20C20 15 17 10 10 9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
         </svg>
         Pan
       </button>
       
       <!-- Draw Tool -->
       <button id="draw-tool" style="
         background: #2196F3;
         border: none;
         border-radius: 4px;
         padding: 8px 12px;
         cursor: pointer;
         font-size: 12px;
         color: white;
         display: flex;
         align-items: center;
         gap: 4px;
         transition: background-color 0.2s;
       " title="Draw Polygon">
         <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 14px; height: 14px;">
           <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
           <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
           <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
         </svg>
         Draw
       </button>
       
       <!-- Upload Tool -->
       <button id="upload-tool" style="
         background: #FF9800;
         border: none;
         border-radius: 4px;
         padding: 8px 12px;
         cursor: pointer;
         font-size: 12px;
         color: white;
         display: flex;
         align-items: center;
         gap: 4px;
         transition: background-color 0.2s;
       " title="Upload File">
         <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 14px; height: 14px;">
           <path d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
           <path d="M17 8L12 3L7 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
           <path d="M12 3V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
         </svg>
         Upload
       </button>
       
       <!-- Divider -->
       <div style="width: 1px; height: 24px; background: ${colors.border}; margin: 0 4px;"></div>
       
       <!-- Map Type Tool -->
       <button id="map-type-tool" style="
         background: #9C27B0;
         border: none;
         border-radius: 4px;
         padding: 8px 12px;
         cursor: pointer;
         font-size: 12px;
         color: white;
         display: flex;
         align-items: center;
         gap: 4px;
         transition: background-color 0.2s;
       " title="Switch Map Type">
         <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 14px; height: 14px;">
           <path d="M9 20L3 17V4L9 7M9 20L15 17M9 20V7M15 17L21 20V7L15 4M15 17V4M9 7L15 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
         </svg>
         Map
       </button>
       
       <!-- Satellite Tool -->
       <button id="satellite-tool" style="
         background: #607D8B;
         border: none;
         border-radius: 4px;
         padding: 8px 12px;
         cursor: pointer;
         font-size: 12px;
         color: white;
         display: flex;
         align-items: center;
         gap: 4px;
         transition: background-color 0.2s;
       " title="Satellite View">
         <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 14px; height: 14px;">
           <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
           <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
           <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
         </svg>
         Satellite
       </button>
     </div>
   `;
  
     // Add event listeners
   const panTool = toolbar.querySelector('#pan-tool');
   const drawTool = toolbar.querySelector('#draw-tool');
   const uploadTool = toolbar.querySelector('#upload-tool');
   const mapTypeTool = toolbar.querySelector('#map-type-tool');
   const satelliteTool = toolbar.querySelector('#satellite-tool');
  
  // Pan tool functionality
  panTool.addEventListener('click', () => {
    // Reset all button styles
    panTool.style.background = '#4CAF50';
    drawTool.style.background = '#2196F3';
    
    // Set drawing mode to null (pan mode)
    if (drawingManager.value) {
      drawingManager.value.setDrawingMode(null);
    }
    
    // Change cursor to grab
    googleMap.value.setOptions({ draggableCursor: 'grab' });
    
    ElMessage.info('Pan mode activated. Click and drag to move the map.');
  });
  
  // Draw tool functionality
  drawTool.addEventListener('click', () => {
    // Reset all button styles
    panTool.style.background = '#4CAF50';
    drawTool.style.background = '#1976D2';
    
    // Set drawing mode to polygon
    if (drawingManager.value) {
      drawingManager.value.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    }
    
    // Change cursor to crosshair
    googleMap.value.setOptions({ draggableCursor: 'crosshair' });
    
    ElMessage.info('Draw mode activated. Click to add polygon vertices, double-click to finish.');
  });
  
     // Upload tool functionality
   uploadTool.addEventListener('click', () => {
     showUploadDialog.value = true;
   });
   
   // Map type tool functionality
   mapTypeTool.addEventListener('click', () => {
     // Reset all button styles
     panTool.style.background = '#4CAF50';
     drawTool.style.background = '#2196F3';
     mapTypeTool.style.background = '#7B1FA2';
     satelliteTool.style.background = '#607D8B';
     
     // Set map type to roadmap
     if (googleMap.value) {
       googleMap.value.setMapTypeId(google.maps.MapTypeId.ROADMAP);
     }
     
     ElMessage.info('Switched to Map view');
   });
   
   // Satellite tool functionality
   satelliteTool.addEventListener('click', () => {
     // Reset all button styles
     panTool.style.background = '#4CAF50';
     drawTool.style.background = '#2196F3';
     mapTypeTool.style.background = '#9C27B0';
     satelliteTool.style.background = '#455A64';
     
     // Set map type to satellite
     if (googleMap.value) {
       googleMap.value.setMapTypeId(google.maps.MapTypeId.SATELLITE);
     }
     
     ElMessage.info('Switched to Satellite view');
   });
   
   // Add hover effects
   [panTool, drawTool, uploadTool, mapTypeTool, satelliteTool].forEach(button => {
     button.addEventListener('mouseenter', () => {
       button.style.opacity = '0.8';
     });
     button.addEventListener('mouseleave', () => {
       button.style.opacity = '1';
     });
   });
  
  // Add to map
  googleMap.value.controls[google.maps.ControlPosition.TOP_LEFT].push(toolbar);
  
  // Set initial state to pan mode
  panTool.click();
  
  // Listen for theme changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        updateToolbarTheme();
      }
    });
  });
  
  // Start observing the document element for class changes
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });
  
  // Clean up observer when component is unmounted
  onBeforeUnmount(() => {
    observer.disconnect();
  });
}

const onPolygonComplete = (polygon) => {
  console.log('Polygon completed:', polygon);
  
  // Only check boundary for new records
  if (newRecord.value && wardBoundaryGeometry.value) {
    const isWithinBoundary = checkPolygonWithinBoundary(polygon);
    if (!isWithinBoundary) {
      // Remove the polygon from the map
      polygon.setMap(null);
      ElMessage.error('Settlement must be drawn within the ward boundary! Please try again.');
      return;
    }
  }
  
  // Clear existing polygons
  drawnPolygons.value.forEach(p => p.setMap(null));
  drawnPolygons.value = [];
  
  // Add new polygon to array
  drawnPolygons.value.push(polygon);
  
  // Add editing event listeners to the polygon
  addPolygonEditListeners(polygon);
  
  // Convert to GeoJSON and update form data
  updatePolygonData(polygon);
  
  // Show success message
  ElMessage.success('Settlement polygon drawn successfully! Area: ' + area_ha.value + ' hectares');
}

const addPolygonEditListeners = (polygon) => {
  // Listen for polygon editing events
  google.maps.event.addListener(polygon, 'set_at', () => {
    console.log('Polygon vertex moved');
    // Only check boundary for new records
    if (newRecord.value && wardBoundaryGeometry.value) {
      const isWithinBoundary = checkPolygonWithinBoundary(polygon);
      if (!isWithinBoundary) {
        ElMessage.warning('Warning: Settlement extends outside ward boundary!');
      }
    }
    updatePolygonData(polygon);
  });
  
  google.maps.event.addListener(polygon, 'insert_at', () => {
    console.log('Polygon vertex inserted');
    // Only check boundary for new records
    if (newRecord.value && wardBoundaryGeometry.value) {
      const isWithinBoundary = checkPolygonWithinBoundary(polygon);
      if (!isWithinBoundary) {
        ElMessage.warning('Warning: Settlement extends outside ward boundary!');
      }
    }
    updatePolygonData(polygon);
  });
  
  google.maps.event.addListener(polygon, 'remove_at', () => {
    console.log('Polygon vertex removed');
    updatePolygonData(polygon);
  });
  
     // Removed dragend listener since dragging is now disabled
}

const addPointEditListeners = (marker) => {
  // Listen for marker drag events
  google.maps.event.addListener(marker, 'dragend', () => {
    console.log('Point marker moved');
    updatePointData(marker);
  });
}

const loadWardBoundary = (wardGeometry) => {
  // This function loads the ward boundary as a guide polygon
  if (!wardGeometry || !googleMap.value) return;
  
  try {
    let coordinates;
    
    if (wardGeometry.type === 'Polygon') {
      coordinates = wardGeometry.coordinates[0];
    } else if (wardGeometry.type === 'MultiPolygon') {
      coordinates = wardGeometry.coordinates[0][0];
    } else {
      console.warn('Ward geometry is not a polygon type:', wardGeometry.type);
      return;
    }
    
    // Convert to Google Maps format
    const googleMapsCoordinates = coordinates.map(coord => ({
      lat: parseFloat(coord[1]),
      lng: parseFloat(coord[0])
    }));
    
    // Create guide polygon (ward boundary)
    const guidePolygon = new google.maps.Polygon({
      paths: googleMapsCoordinates,
      strokeColor: '#000000', // Black outline
      strokeOpacity: 0.8,
      strokeWeight: 3,
      fillColor: '#000000', // Black fill
      fillOpacity: 0.05, // Very transparent
      map: googleMap.value,
      clickable: false, // Not clickable
      editable: false, // Not editable
      draggable: false, // Not draggable
      zIndex: 1 // Lower z-index so user polygons appear on top
    });
    
    // Store guide polygon reference
    guidePolygonRef.value = guidePolygon;
    
    // Store the ward geometry for boundary checking
    wardBoundaryGeometry.value = wardGeometry;
    
    console.log('Ward boundary loaded as guide polygon');
    ElMessage.success('Ward boundary loaded as guide. Please draw your settlement within the black boundary.');
    
  } catch (error) {
    console.error('Error loading ward boundary:', error);
    ElMessage.warning('Could not load ward boundary as guide');
  }
}

// Function to check if a polygon is within the ward boundary
const checkPolygonWithinBoundary = (polygon) => {
  try {
    // Get the polygon path
    const path = polygon.getPath();
    const coordinates = [];
    
    // Convert to array of coordinates
    for (let i = 0; i < path.getLength(); i++) {
      const latLng = path.getAt(i);
      coordinates.push([latLng.lng(), latLng.lat()]);
    }
    
    // Create a GeoJSON polygon from the drawn polygon
    const drawnPolygonGeoJSON = {
      type: 'Polygon',
      coordinates: [coordinates]
    };
    
    // Use Turf.js to check if the drawn polygon is within the ward boundary
    const isWithin = turf.booleanWithin(drawnPolygonGeoJSON, wardBoundaryGeometry.value);
    
    console.log('Boundary check result:', isWithin);
    return isWithin;
    
  } catch (error) {
    console.error('Error checking polygon boundary:', error);
    // If there's an error in the check, allow the polygon (fail-safe)
    return true;
  }
}

const updatePolygonData = (polygon) => {
  try {
    // Convert to GeoJSON and update form data
    const path = polygon.getPath();
    const coordinates = [];
    
    for (let i = 0; i < path.getLength(); i++) {
      const latLng = path.getAt(i);
      coordinates.push([latLng.lng(), latLng.lat()]);
    }
    
    let geojson;
    
    // Check if this was originally a Point geometry and convert back if needed
    if (geomScope.value && geomScope.value.originalType === 'Point') {
      // Calculate centroid of the polygon and convert back to Point
      const centerLng = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
      const centerLat = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
      
      geojson = {
        type: 'Point',
        coordinates: [centerLng, centerLat]
      };
      
      console.log('Converted polygon back to Point geometry:', geojson);
    } else {
      // Standard polygon geometry
      geojson = {
        type: 'Polygon',
        coordinates: [coordinates]
      };
    }
    
    // Update both formData and geomScope
    formData.geom = geojson;
    geomScope.value = geojson;
    
    // Recalculate area (only for polygons)
    if (geojson.type === 'Polygon') {
      calculateArea(geojson);
    } else {
      // For points, set area to 0 or a small value
      area_ha.value = 0;
    }
    
    console.log('Geometry data updated successfully:', geojson);
    console.log('formData.geom after update:', formData.geom);
    console.log('geomScope.value after update:', geomScope.value);
    
    // Show user feedback
    if (geojson.type === 'Point') {
      ElMessage.success('Point location updated!');
    } else {
      ElMessage.success('Geometry updated! Area: ' + area_ha.value + ' hectares');
    }
    
    // Show status indicator
    const statusDiv = document.getElementById('geometry-status');
    const statusText = document.getElementById('geometry-status-text');
    if (statusDiv && statusText) {
      if (geojson.type === 'Point') {
        statusText.textContent = `Point location saved`;
      } else {
        statusText.textContent = `Geometry saved (${area_ha.value} ha)`;
      }
      statusDiv.style.display = 'block';
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
    }
    
  } catch (error) {
    console.error('Error updating polygon data:', error);
    ElMessage.error('Failed to update geometry: ' + error.message);
  }
}

const updatePointData = (marker) => {
  try {
    // Get the marker position
    const position = marker.getPosition();
    const lng = position.lng();
    const lat = position.lat();
    
    // Create Point GeoJSON
    const geojson = {
      type: 'Point',
      coordinates: [lng, lat]
    };
    
    // Update both formData and geomScope
    formData.geom = geojson;
    geomScope.value = geojson;
    
    // Set area to 0 for points
    area_ha.value = 0;
    
    console.log('Point data updated successfully:', geojson);
    console.log('formData.geom after update:', formData.geom);
    console.log('geomScope.value after update:', geomScope.value);
    
    // Show user feedback
    ElMessage.success('Point location updated!');
    
    // Show status indicator
    const statusDiv = document.getElementById('geometry-status');
    const statusText = document.getElementById('geometry-status-text');
    if (statusDiv && statusText) {
      statusText.textContent = `Point location saved`;
      statusDiv.style.display = 'block';
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
    }
    
  } catch (error) {
    console.error('Error updating point data:', error);
    ElMessage.error('Failed to update point location: ' + error.message);
  }
}

const onMouseMove = (event) => {
  const coordinatesDiv = document.getElementById('coordinates');
  if (coordinatesDiv) {
    coordinatesDiv.innerHTML = 
      'Lon: ' + event.latLng.lng().toFixed(5) + ' Lat: ' + event.latLng.lat().toFixed(5);
  }
}

// Function to manually save current polygon state
const saveCurrentPolygonState = () => {
  if (drawnPolygons.value && drawnPolygons.value.length > 0) {
    const polygon = drawnPolygons.value[0];
    if (polygon) {
      updatePolygonData(polygon);
      console.log('Current polygon state saved manually');
      return true;
    }
  }
  console.log('No polygon to save');
  return false;
}

 


// Google Maps drawing manager will be initialized when map is ready

// Drawing is now handled by the Google Maps Drawing Manager



const submitForm = async () => {
  const formInstance = dynamicFormRef
  formInstance.value.validate(async (valid: boolean) => {
    if (valid) {
      // Perform form submission logic
      console.log('Form validation passed, preparing to submit...');
      console.log('Current formData before submission:', formData);
      console.log('Current geomScope before submission:', geomScope.value);

      formData.model = model
      formData.component_id = component_id.value

      // Save current polygon state before submission (if any polygon exists)
      const polygonSaved = saveCurrentPolygonState();
      
      // For new records, we need a settlement polygon drawn by the user
      if (newRecord.value) {
        if (drawnPolygons.value.length === 0) {
          ElMessage.error('Please draw your settlement polygon within the ward boundary before submitting');
          return;
        }
        
        // Use the drawn settlement polygon, not the ward geometry
        if (formData.geom && formData.geom.type === 'Polygon') {
          console.log('Using drawn settlement geometry:', formData.geom);
        } else {
          ElMessage.error('No valid settlement geometry found. Please draw your settlement polygon.');
          return;
        }
      } else {
        // For editing existing records, use the existing geometry
        if (geomScope.value && Object.keys(geomScope.value).length > 0) {
          formData.geom = geomScope.value;
          console.log('Geometry set from geomScope for editing:', formData.geom);
        }
      }

      // Calculate area if geometry exists
      if (formData.geom && formData.geom.type === 'Polygon') {
        try {
          const areaSquareMeters = turf.area(formData.geom);
          const areaHectares = areaSquareMeters / 10000;
          formData.area = areaHectares.toFixed(4);
          console.log('Area calculated:', formData.area, 'hectares');
        } catch (areaError) {
          console.error('Error calculating area:', areaError);
          ElMessage.warning('Could not calculate area from geometry');
        }
      } else {
        console.warn('No valid geometry found for area calculation');
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
  // Drawing is now handled by the Google Maps Drawing Manager
  // No need for manual toggle as the drawing controls are always available
  console.log('Location option changed:', value);
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
    // Also set formData.geom for new records to ensure it's available during submission
    formData.geom = res.data[0].json_build_object
    console.log('Geometry set for new record:', formData.geom)
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
.map-container {
  position: relative;
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

.geometry-status {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(76, 175, 80, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: opacity 0.3s ease;
}
</style>