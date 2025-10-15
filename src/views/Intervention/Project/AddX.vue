<template>
  <div>
    <el-card class="box-card" v-loading="isLoading">
     


      <el-steps :active="currentStep" finish-status="success" align-center class="small-steps">
        <el-step
v-for="(step, index) in steps" :key="index" :title="isMobile ? '' : step.title"
          @click="handleStepClick(index)" />
      </el-steps>
      <el-divider />
      <el-form
          :model="formData"
          :rules="currentStepRules"
          label-width="200px"
          ref="dynamicFormRef"
          label-position="top"
        >
          <el-row :gutter="16">
            <el-col
              v-for="(field, index) in currentStepFields"
              :key="index"
              :span="24"
              :xs="24"
              :sm="24"
              :md="24"
              :lg="24"
              :xl="24"
            >
      <el-form-item :id="field.id" :prop="field.name">
        <template #label>
          <el-tooltip
            v-if="field.tooltip"
            class="item"
          
            :content="field.tooltip"
             placement="right"
            effect="dark"
          >
            <span>{{ field.label }}</span>
          </el-tooltip>
          <span v-else>{{ field.label }}</span>
        </template>

        <el-input
          v-if="field.type === 'text'"
          v-model="formData[field.name]"
        />
        <el-input
          v-else-if="field.type === 'textarea'"
          type="textarea"
          v-model="formData[field.name]"
        />
        <el-input-number
          :controls="false"
          :min="field.min"
          v-else-if="field.type === 'number'"
          v-model="formData[field.name]"
          :formatter="formatMoney"
          @change="getFieldChangeHandler(field.name)"
        />
        <el-input
          :min="field.min"
          v-else-if="field.type === 'money'"
          v-model="formData[field.name]"
          @change="getFieldChangeHandler(field.name)"
          :formatter="formatMoney"
          :parser="parseMoney"
        >
          <template #prepend>KSh.</template>
        </el-input>

        <el-date-picker
          v-else-if="field.type === 'date'"
          type="date"
          v-model="formData[field.name]"
        />

        <el-select
          v-else-if="field.type === 'select' && field.multiselect === 'false' && !field.adminUnit"
          v-model="formData[field.name]"
          :filterable="true"
          collapse-tags
          placeholder="Select"
          @change="getFieldChangeHandler(field.name)"
        >
          <el-option
            v-for="option in field.options"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>

        <el-tree-select
          v-else-if="field.type === 'tree' && field.multiselect === 'false'"
          v-model="formData[field.name]"
          :data="field.options"
          :render-after-expand="true"
          node-key="value"
          value-key="value"
          :disabled="newRecord"
          :props="{ label: 'label', children: 'children', value: 'value' }"
          placeholder="Select"
          @change="getFieldChangeHandler(field.name)"
        />

        <el-select
          v-else-if="field.type === 'select' && field.multiselect === 'true'"
          v-model="formData[field.name]"
          :filterable="true"
          multiple
          collapse-tags
          placeholder="Select"
          @change="getFieldChangeHandler(field.name)"
        >
          <el-option
            v-for="option in field.options"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>

        <el-select
          v-else-if="field.type === 'select' && field.adminUnit && field.name === 'county_id'"
          v-model="formData[field.name]"
          :filterable="true"
          collapse-tags
          placeholder="County"
          @change="getFieldChangeHandler(field.name)"
        >
          <el-option
            v-for="option in countyOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>

        <el-select
          v-else-if="field.type === 'select' && field.adminUnit && field.name === 'subcounty_id'"
          v-model="formData[field.name]"
          :filterable="true"
          collapse-tags
          placeholder="Subcounty"
          @change="getFieldChangeHandler(field.name)"
        >
          <el-option
            v-for="option in subcountyOptionsFiltered"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>

        <el-select
          v-else-if="field.type === 'select' && field.adminUnit && field.name === 'ward_id'"
          v-model="formData[field.name]"
          :filterable="true"
          collapse-tags
          placeholder="Ward"
          @change="getFieldChangeHandler(field.name)"
        >
          <el-option
            v-for="option in wardOptionsFiltered"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>

        <el-select
          v-else-if="field.type === 'select' && field.adminUnit && field.name === 'settlement_id'"
          v-model="formData[field.name]"
          :filterable="true"
          collapse-tags
          placeholder="Settlement"
          @change="getFieldChangeHandler(field.name)"
        >
          <el-option
            v-for="option in settOptionsFiltered"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
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
      <!-- <div v-if="currentStep == totalSteps - 1" id="mapContainer" class="basemap"></div>
      <div v-if="currentStep == totalSteps - 1" id='coordinates' class='coordinates'></div> -->
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
import { ref, onMounted, computed, watch } from 'vue';
import { ElCard, ElTooltip, ElTour, ElTourStep, ElDialog, ElMessage, ElUpload,ElTreeSelect } from 'element-plus'
import { useRouter } from 'vue-router'

import { steps, formFields, formData, formRules,regionOptions ,} from './common/fields.ts'
import { subcountyOptions, wardOptions,prog_components   } from './common/index.ts'
import shortid from 'shortid';

import {   nextTick } from 'vue'

import { useRoute } from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'

import mapboxgl from "mapbox-gl";
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { MapboxLayerDefinition } from "mapbox-layer-switcher";
import { CreateRecord, updateOneRecord, getOneGeo, getOneSettlement } from '@/api/settlements'

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
  ElSelect, ElOption} from 'element-plus';
import readShapefileAndConvertToGeoJSON from '@/utils/readShapefile'
import proj4 from 'proj4';
import { countyOptions } from './common';

import { InfoFilled, Back } from '@element-plus/icons-vue'


const props1 = {
  checkStrictly: true,
}

const { push } = useRouter()


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

const labelPosition = ref('left')
if (isMobile.value) {
  labelPosition.value = 'top'

}

// for mobile only 
const county_id = ref()
const subcounty_id = ref()
const CountyOptionsFiltered = ref([])
const subcountyOptionsFiltered = ref([])
const ward_id = ref()
const wardOptionsFiltered = ref([])
const selectAdmin = ref()

const settOptionsFiltered = ref([])
const settlement_id = ref()
const area_ha = ref(0)


const formatMoney = (value) => {
  if (!value) return '';
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const parseMoney = (value) => {
  return value.replace(/\$\s?|(,*)/g, '');
};



const onSelectCounty = (county_id) => {
  formData.subcounty_id = null
  formData.ward_id = null
  formData.settlement_id = null
  subcountyOptionsFiltered.value = subcountyOptions.value.filter((obj) => obj.county_id == county_id);
  console.log('changed county')
  console.log(subcountyOptionsFiltered)
  handleChangeLocation([county_id])

};


const onSelectRegion = (region_id) => {

  console.log
  formData.subcounty_id = null
  formData.ward_id = null

  CountyOptionsFiltered.value = countyOptions.value.filter((obj) => obj.region_id == region_id);

  //handleChangeLocation([region_id])

};


const onSelectSubcounty = (subcounty_id) => {
  formData.ward_id = null
  formData.settlement_id = null

  wardOptionsFiltered.value = wardOptions.value.filter((obj) => obj.subcounty_id == subcounty_id);
  handleChangeLocation([formData.county_id.value, subcounty_id])

};

const centroid = ref(37, 1)




const calculateArea = (geom) => {
  console.log('calculateArea', geom);

  if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
    // Calculate the area using Turf.js
    const areaSquareMeters = turf.area(geom);

    // Convert square meters to hectares
    const areaHectares = areaSquareMeters / 10000;
    area_ha.value = areaHectares.toFixed(4);

    // Get centroid
    const centre = turf.centroid(geom);
    centroid.value = centre.geometry.coordinates;
  } else {
    console.warn('Geometry is not a polygon. Skipping area calculation.');
    area_ha.value = null;
    centroid.value = null;
  }

  console.log(  area_ha.value )
};




const onSelectWard = (ward_id) => {

  formData.settlement_id = null
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
const isLoading = ref(false)

const map = ref()

const mapContainer = ref(null);
const geomScope = ref([])
const model = 'project'
const component_id = ref()
const component_title = ref()

onMounted(async () => {

 
 
  console.log('passed data', route.query.id)
  console.log('formData', formData)

  let params = route.params
  console.log('Loaded.......',params.domain)
  component_id.value = params.domain
 

 
    console.log('new formData ------------,', formData )



  console.log('component_id', component_id)

  const comp_form = {}
  comp_form.model = 'component'
  comp_form.id = route.params.domain
   
  const component = await getOneSettlement(comp_form)

  console.log('component',component.data.title)
  component_title.value=component.data.title

  const form = {}
  form.model = model
  form.id = route.query.id

  let ward_id



  if (route.query.id) {
    isLoading.value = true
    await getOneSettlement(form)
      .then((res) => {
        // Handle the successful response here
        console.log(res.data)
        var curData = res.data
        curData.geom = curData.geom

        console.log('curData', curData)
        geomScope.value = curData.geom


        CountyOptionsFiltered.value = countyOptions.value.filter((obj) => obj.region_id == curData.region_id);


        subcountyOptionsFiltered.value = subcountyOptions.value.filter((obj) => obj.county_id == curData.county_id);
        wardOptionsFiltered.value = wardOptions.value.filter((obj) => obj.subcounty_id == curData.subcounty_id);

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
    isLoading.value = false


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

    formData.component_id =params.domain


    console.log('new record ------------,',formData )


  }
})



// Watch for when prog_components get populated
watch(prog_components, (newVal) => {
  if (newVal && newVal.length && formData.component_id) {
    // Force update of v-model binding by resetting it
    const temp = formData.component_id
    formData.component_id = null
    nextTick(() => {
      formData.component_id = temp
    })
  }
}, { immediate: true })




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




const icon = ref(`<button>  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4.97883 9.68508C2.99294 8.89073 2 8.49355 2 8C2 7.50645 2.99294 7.10927 4.97883 6.31492L7.7873 5.19153C9.77318 4.39718 10.7661 4 12 4C13.2339 4 14.2268 4.39718 16.2127 5.19153L19.0212 6.31492C21.0071 7.10927 22 7.50645 22 8C22 8.49355 21.0071 8.89073 19.0212 9.68508L16.2127 10.8085C14.2268 11.6028 13.2339 12 12 12C10.7661 12 9.77318 11.6028 7.7873 10.8085L4.97883 9.68508Z" fill="#1C274C"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M2 8C2 8.49355 2.99294 8.89073 4.97883 9.68508L7.7873 10.8085C9.77318 11.6028 10.7661 12 12 12C13.2339 12 14.2268 11.6028 16.2127 10.8085L19.0212 9.68508C21.0071 8.89073 22 8.49355 22 8C22 7.50645 21.0071 7.10927 19.0212 6.31492L16.2127 5.19153C14.2268 4.39718 13.2339 4 12 4C10.7661 4 9.77318 4.39718 7.7873 5.19153L4.97883 6.31492C2.99294 7.10927 2 7.50645 2 8Z" fill="#1C274C"></path> <path opacity="0.7" d="M5.76613 10L4.97883 10.3149C2.99294 11.1093 2 11.5065 2 12C2 12.4935 2.99294 12.8907 4.97883 13.6851L7.7873 14.8085C9.77318 15.6028 10.7661 16 12 16C13.2339 16 14.2268 15.6028 16.2127 14.8085L19.0212 13.6851C21.0071 12.8907 22 12.4935 22 12C22 11.5065 21.0071 11.1093 19.0212 10.3149L18.2339 10L16.2127 10.8085C14.2268 11.6028 13.2339 12 12 12C10.7661 12 9.77318 11.6028 7.7873 10.8085L5.76613 10Z" fill="#1C274C"></path> <path opacity="0.4" d="M5.76613 14L4.97883 14.3149C2.99294 15.1093 2 15.5065 2 16C2 16.4935 2.99294 16.8907 4.97883 17.6851L7.7873 18.8085C9.77318 19.6028 10.7661 20 12 20C13.2339 20 14.2268 19.6028 16.2127 18.8085L19.0212 17.6851C21.0071 16.8907 22 16.4935 22 16C22 15.5065 21.0071 15.1093 19.0212 14.3149L18.2339 14L16.2127 14.8085C14.2268 15.6028 13.2339 16 12 16C10.7661 16 9.77318 15.6028 7.7873 14.8085L5.76613 14Z" fill="#1C274C"></path> </g></svg></button>`)

const showSatellite = ref(false)

const toggleFloatingDiv = async () => {
  showSatellite.value = !showSatellite.value;
  console.log('Show Satellite', showSatellite.value);

  // Get the map style
  let style = map.value.getStyle();

  // Get all layers
  let allLayers = style.layers;

  // Log all layers to the console
  console.log('before ', allLayers);



  if (!showSatellite.value) {
    console.log('Remove Satellte');





    if (map.value.getLayer('Satellite')) {
      map.value.removeLayer('Satellite');
      map.value.removeSource('Satellite');

    }


  } else {

    console.log('Add Satellte');



    if (map.value.getLayer('Satellite')) {
      map.value.removeLayer('Satellite');
      map.value.removeSource('Satellite');

    } else {

      icon.value = `<button>  <svg viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="si-glyph si-glyph-satellite" fill="#f20707"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>650</title> <defs> </defs> <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g fill="#fb0e0e"> <path d="M12.495,5.893 C12.832,6.231 14.184,4.877 13.847,4.541 L10.864,1.557 C10.526,1.219 9.174,2.573 9.51,2.909 L12.495,5.893 L12.495,5.893 Z" class="si-glyph-fill"> </path> <path d="M3.288,10.897 C3.072,10.68 2.597,10.802 2.23,11.168 C1.863,11.536 1.742,12.009 1.959,12.228 L3.233,13.501 C3.45,13.719 3.922,13.597 4.289,13.23 C4.658,12.864 4.779,12.388 4.562,12.172 L3.288,10.897 L3.288,10.897 Z" class="si-glyph-fill"> </path> <rect transform="translate(2.240100, 2.131300) rotate(-44.991897) translate(-2.240100, -2.131300) " x="-0.25987605" y="1.13130958" width="4.96295245" height="1.95398128" class="si-glyph-fill"> </rect> <path d="M12.088,8.374 L10.657,9.802 L9.918,9.063 L11.543,7.439 C11.814,7.168 11.81,6.723 11.531,6.447 L9.031,3.948 C8.757,3.673 8.314,3.67 8.043,3.939 L6.419,5.564 L5.684,4.829 L7.113,3.401 L5.718,2.007 L2.221,5.503 L3.614,6.897 L5.028,5.484 L5.763,6.219 L4.134,7.849 C3.864,8.12 3.866,8.564 4.141,8.838 L6.641,11.336 C6.917,11.612 7.363,11.617 7.632,11.346 L9.262,9.717 L10.001,10.456 L8.585,11.869 L9.967,13.25 L13.464,9.753 L12.088,8.374 L12.088,8.374 Z" class="si-glyph-fill"> </path> <rect transform="translate(13.426200, 12.673100) rotate(-45.056720) translate(-13.426200, -12.673100) " x="10.9262228" y="11.6731091" width="4.96795479" height="1.97998198" class="si-glyph-fill"> </rect> </g> </g> </g></svg> </button>`

      map.value.addLayer(
        {
          id: 'Satellite',
          source: { "type": "raster", "url": "mapbox://mapbox.satellite", "tileSize": 256 },
          type: "raster"
        },
        'country-label'
      );
    }



  }

  // Get the map style
  style = map.value.getStyle();

  // Get all layers
  allLayers = style.layers;

  // Log all layers to the console
  console.log('after', allLayers);

}


const loadMap = async () => {

  map.value = new mapboxgl.Map({
    container: 'mapContainer',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [37.137343, 1.137451],
    zoom: 6,
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



    // map.value.addLayer({
    //   id: 'Satellite',
    //   source: { "type": "raster", "url": "mapbox://mapbox.satellite", "tileSize": 256 },
    //   type: "raster"
    // });

    map.value.addLayer({
      id: 'Streets',
      source: { "type": "raster", "url": "mapbox://mapbox.streets", "tileSize": 256 },
      type: "raster"
    } );



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
          'line-color': '#000',
          'line-width': 3
        }
      });

    }

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
        'fill-color': 'red',
        'fill-opacity': 0.5
      },
      'layout': {}
    });

    // switch it off until the user selects to
    //map.value.setLayoutProperty('Satellite', 'visibility', 'none')


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


    // map.value.addControl(new MapboxLayerSwitcherControl(layers));





    var bounds = turf.bbox((geomScope.value));
    // Calculate the center of the bounds
    const center = [
      (bounds[0] + bounds[2]) / 2, // Longitude
      (bounds[1] + bounds[3]) / 2  // Latitude
    ];

    // Use map.flyTo instead of map.fitBounds
    map.value.flyTo({
      center: center, // Use calculated center coordinates
      zoom: 16,       // Optional: Set zoom level
      speed: 1.2,     // Optional: Speed of the fly animation
      curve: 1.42,    // Optional: Curve for the easing function
      essential: true // Animation is considered essential
    });







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




  function addInfo(map) {
    class LayerButton {
      onAdd(map) {
        const div = document.createElement("div");
        div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
        div.innerHTML = icon.value;
        div.addEventListener("contextmenu", (e) => e.preventDefault());
        div.addEventListener("click", () => toggleFloatingDiv());

        return div;
      }
    }
    const lryButton = new LayerButton();
    map.addControl(lryButton, "top-right");
  }
  addInfo(map.value)




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
      formData.createdBy = userInfo.id
      //formData.component_id = component_id.value
      formData.component_title = component_title.value


      // Calculate the area using Turf.js
   //   const areaSquareMeters = turf.area(geomScope.value);

      // Convert square meters to hectares
   //   const areaHectares = areaSquareMeters / 10000;
      formData.area = area_ha.value

      console.log('formData.value', formData.value)



      //formData.geom =geomScope.value

      let project_id
      if (newRecord.value) {
        formData.isApproved = 'Pending'
        formData.code = shortid.generate()

       const createdproject =  await CreateRecord(formData)

        console.log('createdproject', createdproject);
        project_id=createdproject.data.id

      } else {


        // Calculate the area using Turf.js
       // const areaSquareMeters = turf.area(formData.geom);

        // Convert square meters to hectares
       // const areaHectares = areaSquareMeters / 10000;
        formData.area =   area_ha.value
        const ids = formData.activities.map(item => item.id);
        console.log(ids)

        formData.activities = ids
         const udpatedProject= await updateOneRecord(formData)

        project_id=udpatedProject.data.id


        console.log('Edited form', formData);


      }


      push({
          name: 'ProjectDetails',
        params: { id: project_id }
        })



  //    goBack()

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


  if (fieldName == 'region_id') {
    onSelectRegion(formData[fieldName])
  }


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


const tourSteps = ref([
  {
    step: 0,
    target: '#btn1',
    title: 'County Selection',
    content: 'Start by selecting the county where the settlement is located.',
    visible: true
  },
  {
    step: 0,
    target: '#btn2',
    title: 'Constituency Selection',
    content: 'Now, choose the constituency that falls within the selected county.',
    visible: true
  },
  {
    step: 0,
    target: '#btn3',
    title: 'Ward Selection',
    content: 'Next, pick the ward that corresponds to the selected constituency.',
    visible: true
  },
  {
    step: 0,
    target: '#btn4',
    title: 'Settlement Name',
    content: 'Type the settlements name',
    visible: true
  },
  {
    step: 0,
    target: '#btn5',
    title: 'Settlement Type',
    content: 'Indicate whether the settlement is a Slum or an Informal Settlement.',
    visible: true
  },
  {
    step: 0,
    target: '#btn6',
    title: 'Parcel Number',
    content: 'Enter the parcel number for the where the settlement is located.',
    visible: true
  },
  {
    step: 0,
    target: '#btn7',
    title: 'Parcel Ownership',
    content: 'Specify whether the parcel is publicly or privately owned.',
    visible: true
  },
  {
    step: 0,
    target: '#btn8',
    title: 'Survey Plan (RIM)',
    content: 'Provide the RIM or survey plan number associated with this settlement.',
    visible: true
  },
  {
    step: 0,
    target: '#btn9',
    title: 'Area (Ha)',
    content: 'Enter the total area of the parcel in hectares.',
    visible: true
  },
  {
    step: 0,
    target: '#btn10',
    title: 'Population',
    content: 'Estimate the population residing within the settlement.',
    visible: true
  },
  {
    step: 0,
    target: '#btn11',
    title: 'Survey Status',
    content: 'Indicate whether the parcel has been officially surveyed.',
    visible: true
  },
  {
    step: 0,
    target: '#btn12',
    title: 'Land Use',
    content: 'Describe the predominant land use within the settleemnt.',
    visible: true
  },
  {
    step: 0,
    target: '#btn13',
    title: 'Proximity to River',
    content: 'Specify if the parcel is located near a river.',
    visible: true
  },
  {
    step: 0,
    target: '#btn14',
    title: 'Utility Way-leave',
    content: 'Indicate if the parcel lies on a utility way-leave.',
    visible: true
  },
  {
    step: 0,
    target: '#btn15',
    title: 'Road Reserve',
    content: 'Specify if the parcel is on a road reserve.',
    visible: true
  },
  {
    step: 0,
    target: '#btn16',
    title: 'Structure Types',
    content: 'Select the types of structures found in the settlement.',
    visible: true
  },
  {
    step: 0,
    target: '#btn17',
    title: 'Development Level',
    content: 'Choose the level of development within the settlement.',
    visible: true
  },
  {
    step: 0,
    target: '#btn18',
    title: 'Building Materials',
    content: 'Identify the typical building materials used in the area.',
    visible: true
  },
  {
    step: 0,
    target: '#btn19',
    title: 'Structure Spacing',
    content: 'Enter the average distance between structures in meters.',
    visible: true
  },
  {
    step: 0,
    target: '#btn20',
    title: 'Urban Center Proximity',
    content: 'Specify the distance from the parcel to the nearest urban center.',
    visible: true
  },
  {
    step: 0,
    target: '#btn21',
    title: 'Trunk Road Proximity',
    content: 'Enter the distance from the settlement to the nearest trunk road.',
    visible: true
  },
  {
    step: 0,
    target: '#btn22',
    title: 'Encumbrances',
    content: 'Indicate if there are any court cases or claims related to the parcel.',
    visible: true
  },
  {
    step: 0,
    target: '#btn23',
    title: 'Status',
    content: 'Set the current status of the settlement as Active or Decommissioned.',
    visible: true
  },
  {
    step: 0,
    target: '#btn24',
    title: 'Comments/Remarks',
    content: 'Add any additional comments or remarks about the settlement.',
    visible: true
  },

  {
    step: 1,
    target: '#mapContainer',
    title: 'Map',
    content: 'The Map displays the settlement location based on the selected ward. Zoom in to the settlement location',
    visible: true
  },
  {
    step: 1,
    target: '#upload',
    title: 'Upload Location geometry',
    content: 'Upload geojson/shapefile. Current supports .shp (zipped), .json and .geojson ',
    visible: true
  }



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



.el-popper.is-customized {
  /* Set padding to ensure the height is 32px */
  padding: 6px 12px;
  background: linear-gradient(90deg, rgb(159, 229, 151), rgb(204, 229, 129));
}

.el-popper.is-customized .el-popper__arrow::before {
  background: linear-gradient(45deg, #b2e68d, #bce689);
  right: 0;
}
</style>