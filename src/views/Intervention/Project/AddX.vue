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
v-for="(field, index) in currentStepFields" :key="index"
            :span="currentStepFields.length === 1 ? 24 : (24 / columnSpan)"
            :xs="currentStepFields.length === 1 ? 24 : (24 / columnSpan)"
            :sm="currentStepFields.length === 1 ? 24 : (24 / columnSpan)" :md="currentStepFields.length === 1 ? 24 : 12"
            :lg="currentStepFields.length === 1 ? 24 : 12" :xl="currentStepFields.length === 1 ? 24 : 12">

            <el-form-item :id="field.id" :label="field.label" :prop="field.name">
              <el-input v-if="field.type === 'text'" v-model="formData[field.name]" />
              <el-input v-if="field.type === 'textarea'" type="textarea" v-model="formData[field.name]" />

              <el-input-number :min="field.min" v-else-if="field.type === 'number'" v-model="formData[field.name]"
                @change="getFieldChangeHandler(field.name)" />

                <el-input :min="field.min" v-else-if="field.type === 'money'" v-model="formData[field.name]"
                @change="getFieldChangeHandler(field.name)"     :formatter="formatMoney"  :parser="parseMoney" >  
                <template #prepend>USD($)</template>
              </el-input> 

              <el-date-picker v-else-if="field.type === 'date'" type="date" v-model="formData[field.name]" />
              
              <!-- Add more conditions for other field types as needed -->
              <el-select
v-else-if="field.type === 'select' && field.multiselect === 'false' && !field.adminUnit"
                v-model="formData[field.name]" :filterable="true" collapse-tags placeholder="Select"
                @change="getFieldChangeHandler(field.name)" style="width: 100%;">
                <el-option
v-for="option in field.options" :key="option.value" :label="option.label"
                  :value="option.value" />
              </el-select>

              <el-select
v-else-if="field.type === 'select' && field.multiselect === 'true'"
                v-model="formData[field.name]" :filterable="true" multiple collapse-tags placeholder="Select"
                @change="getFieldChangeHandler(field.name)" style="width: 100%;">
                <el-option
v-for="option in field.options" :key="option.value" :label="option.label"
                  :value="option.value" />
              </el-select>
              <el-cascader
:props="props" v-else-if="field.type === 'xcascader'" collapse-tags="true"
                v-model="formData[field.name]" :options="field.options" @change="getFieldChangeHandler(field.name)"
                style="width: 100%;" />

              <el-tree-select
v-else-if="field.type === 'cascader'" v-model="formData[field.name]" :data="field.options"
                multiple show-checkbox style="width: 100%" />


 

                <el-select
                  v-else-if="field.type === 'select_remote' "
                  v-model="formData[field.name]"
                  multiple
                  filterable
                  remote
                  reserve-keyword
                  placeholder="Please enter a keyword"
                  remote-show-suffix
                  :remote-method="remoteMethod"
                  :loading="loading"
                  collapse-tags
                  collapse-tags-tooltip
                 
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in sett_options"
                    :key="item.id"
                    :label="item.label"
                    :value="item"   
                  >
                    <span style="float: left">{{ item.label }}</span>
                    <span
                      style="
                        float: right;
                        color: var(--el-text-color-secondary);
                        font-size: 13px;
                      "
                    >
                      {{ item.ward }}, {{ item.subcounty }}, {{ item.county }}
                    </span>
                  </el-option>
                </el-select>


                <el-select  v-else-if="field.type === 'select_add'"  v-model="formData[field.name]" placeholder="Select" style="width: 240px">
                  <el-option
                    v-for="item in field.options"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                  <template #footer>
                    <el-button  text bg size="small" @click="onAddOption(field.source_model)">
                      Add 
                    </el-button>
                     
                  </template>
                </el-select>



            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div class="button-container" style="margin-bottom: 10px;">

        <el-tooltip content="Help" placement="top">
                <el-button color="#626aef"   type="info" @click="showTour"  :icon="InfoFilled" plain />
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


    </el-card>





  </div>


  
  <el-tour v-model="isTourVisible" :z-index="100000" :on-close="endTour">
      <el-tour-step
        v-for="(step, index) in filteredTourSteps"
        :key="index"
        :target="step.target"
        :title="step.title"
        :description="step.content"
      />
    </el-tour>

</template>



<script lang="ts" setup>
import { ref, onMounted, computed, watch } from 'vue';
import { ElCard, ElCascader, ElMessage, ElTreeSelect , ElTour, ElTourStep, ElTooltip} from 'element-plus'
import { useRouter } from 'vue-router'

import { steps, formFields, formData, formRules } from './common/fields.ts'
import { subcountyOptions, wardOptions, settlementOptionsV2 } from './common/index.ts'
import shortid from 'shortid';
import { useRoute } from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'

import mapboxgl from "mapbox-gl";
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { MapboxLayerSwitcherControl, MapboxLayerDefinition } from "mapbox-layer-switcher";
import { CreateRecord, BatchImportUpsert, updateOneRecord, getOneSettlement, getSettlementListByCounty, DeleteMultipleRecord } from '@/api/settlements'
import { InfoFilled,Back} from '@element-plus/icons-vue'



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
import {
  searchByKeyWord} from '@/api/settlements'

const props = { multiple: true }


const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)
const showUploadDialog = ref(false)

const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = MapBoxToken;


const isMobile = computed(() => appStore.getMobile)


const route = useRoute()
//const { push } = useRouter()
const router = useRouter();

const goBack = () => {
  router.back();
};




const labelPosition = ref('left')
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


const onSelectCounty = (county_id) => {

  formData.subcounty_id = null
  formData.ward_id = null
  formData.settlement_id = null
  subcountyOptionsFiltered.value = subcountyOptions.value.filter((obj) => obj.county_id == county_id);
  wardOptionsFiltered.value = wardOptions.value.filter((obj) => obj.county_id == county_id);
  settOptionsFiltered.value = settlementOptionsV2.value.filter((obj) => obj.county_id == county_id);




  handleChangeLocation([county_id])
};





const sett_options =ref([])
const filters =ref([])
const filterValues =ref([])
const loading =ref(false)

const remoteMethod = async (keyword) => {
  console.log(keyword)
  const formData = {}
  formData.model = 'settlement'
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = keyword
  formData.excludeGeom = false
  formData.excludeGeomAssoc = true

  formData.associated_multiple_models = ['county', 'subcounty', 'ward']

  //--Single Filter -----------------------------------------

  //formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = filters.value
  formData.filterValues = filterValues.value

  //formData.cache_key = 'SeacrchByKey_' + search_string.value

  //-------------------------
  console.log("formData",formData)
  loading.value=true
  const res = await searchByKeyWord(formData)
  loading.value=false

  
  console.log(res)

  sett_options.value= res.data.map(item => ({
    value: item.id,
    settlement_id: item.id,
    label: item.name  ,
    county: item.county.name,
    subcounty: item.subcounty.name,
    ward: item.ward.name,
    ward_id: item.ward.id,
    subcounty_id: item.subcounty.id,
    county_id: item.county.id,
    geom: item.geom
  }));

  console.log(sett_options.value)

}



const onSelectSubcounty = (subcounty_id) => {
  formData.ward_id = null
  formData.settlement_id = null

  // update the county to county id of the current subcounty - backward copatibility 
  var thisSubCountyOption = subcountyOptions.value.filter((obj) => obj.value == subcounty_id);
  formData.county_id = thisSubCountyOption.county_id

  wardOptionsFiltered.value = wardOptions.value.filter((obj) => obj.subcounty_id == subcounty_id);
  handleChangeLocation([formData.county_id.value, subcounty_id])

};


const onSelectWard = (ward_id) => {

  formData.settlement_id = null
  // update the county to county id of the current subcounty - backward copatibility 
  var thisWardOption = wardOptions.value.filter((obj) => obj.value == ward_id);
  formData.county_id = thisWardOption[0].county_id
  formData.subcounty_id = thisWardOption[0].subcounty_id
  console.log('thisWardOption', thisWardOption[0])


  settOptionsFiltered.value = settlementOptionsV2.value.filter((obj) => obj.ward_id == ward_id);
  handleChangeLocation([formData.county_id, formData.subcounty_id, ward_id])

};

const onSelectSettlement = (sett_id) => {
  formData.settlement_id = sett_id

  // update the parenst based on current selection - backward copatibility 
  var thisSettOption = settlementOptionsV2.value.filter((obj) => obj.value == sett_id);
  formData.county_id = thisSettOption[0].county_id
  formData.subcounty_id = thisSettOption[0].subcounty_id
  formData.ward_id = thisSettOption[0].ward_id





  handleChangeLocation([formData.county_id, formData.subcounty_id, formData.ward_id, sett_id])

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
const projectScopeGeo = ref([])
const model = 'project'
const component_id = ref()


const getSett = async (sform) => {
  console.log(sform)

  let sett = await getOneSettlement(sform)
  console.log("settlement", sett)

  return sett.data.geom

};
 

const proj_ids=ref([])

const getLocations = async (project_id) => {

  console.log('project_id',project_id)
  const formData = {}

  formData.model = 'project_location'
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------
  formData.filters = ['project_id']
  formData.filterValues = [[project_id]]
  formData.associated_multiple_models = []
 

  const res = await getSettlementListByCounty(formData) 

  const transformedData = res.data.map(item => ({
  ...item,
  value: item.settlement_id, // Replace 'id' with 'value'
  displayValue: `ID: ${item.id}`, // Add another field based on 'id'
}));

  console.log('res.data',transformedData)
  
 // Extract IDs for filterValues
 const settlement_ids = transformedData.map(item => item.value); // Extract `value` which is set to `settlement_id`
   proj_ids.value = transformedData.map(item => item.id); // Extract `value` which is set to `settlement_id`

filters.value = ['id']; // Assuming 'id' is the filter field you want to use
filterValues.value = [settlement_ids]; // Set filterValues to the array of IDs

console.log('filters', filters.value);
console.log('filterValues', filterValues.value);

 await remoteMethod(null)

 filters.value=[]
 filterValues.value=[]
  return transformedData
}


onMounted(async () => {
  try {
    // Log route parameters
    console.log('passed data', route.query.id);
    console.log('Loaded.......');

    // Set component ID from route parameters
    component_id.value = route.params.domain;
    console.log('component_id', component_id);
    console.log('route.params.', route.query);

    // Prepare form data
    const form = {
      model: model,
      id: route.query.id
    };

    // Handle case where route.query.id is present
    if (route.query.id) {
      const res = await getOneSettlement(form);
      console.log(res.data);

      var curData = res.data;
      console.log('curData', curData);

      // Map activities to their IDs
      let activityIds = curData.activities.map(activity => activity.id);
      curData.activities = activityIds;

      // Get locations
      curData.Location = await getLocations(curData.id);

      console.log('curData2', curData);

      // Update formData with fetched data
      Object.assign(formData, curData);
      console.log(formData);

      // Set newRecord flag
      newRecord.value = false;

    } else {
      // Reset formData if no route.query.id
      Object.keys(formData).forEach((key) => {
        formData[key] = undefined;
      });
    }
  } catch (error) {
    // Handle errors
    console.log('Error:', error);
  }
});



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


    //projectScopeGeo.value = geom
    map.value.getSource("scope").setData(projectScopeGeo.value);
    bounds.value = turf.bbox((projectScopeGeo.value))
    console.log("From geo", bounds.value)
    map.value.fitBounds(bounds.value, { padding: 20, maxZoom: 18 })

    //loadMap()
  }

}


const readShp = async (file) => {
  console.log('Reading Shp file....')

  // await getGeoJSON(file)
  readShapefileAndConvertToGeoJSON(file)
    .then((geojson) => {

      console.log("Geo>", geojson.length)
      console.log("Geo1>", geojson[0])


      if (geojson.length != 1) {
        ElMessage.warning('Please upload a file with only one feature. This one has ' + geojson.length + ' features')

      }
      else {
        console.log('ok>>', geojson[0])


        var crs = { type: 'name', properties: { name: 'EPSG:4326' } }

        let geom = {
          type: geojson[0].geometry.type,
          coordinates: geojson[0].geometry.coordinates,
          crs: crs

        }


        console.log('>>', geom)
        formData.geom = geom

        //projectScopeGeo.value = geom
        map.value.getSource("scope").setData(projectScopeGeo.value);
        bounds.value = turf.bbox((projectScopeGeo.value))
        console.log("From shp", bounds.value)
        map.value.fitBounds(bounds.value, { padding: 20, maxZoom: 15 })
      }


    })
    .catch((error) => {
      console.error(error)
      ElMessage.error('Invalid shapefiles. Check your zipped file to contain (.shp, .dbf and .prj)')


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
  else if (fileType === 'zip') {
    readShp(rfile)

    // reader.readAsArrayBuffer(rfile)
  } else {
    ElMessage.error('Only geojson or zipped shapefiles are supported at the moment')


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

    //console.log('mapContainer', mapContainer)
   // await new Promise(resolve => setTimeout(resolve, 100));  //delay for 2 seconds the call loadmap

    //loadMap()
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
      data: (projectScopeGeo.value),
    });


    // Edit only if not a new record 
    if (!newRecord.value) {
      toggleDrawToolbox('digitize')
      const geojson = JSON.parse(JSON.stringify(projectScopeGeo.value));
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
        'id': 'projectScopeGeo',
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





    var bounds = turf.bbox((projectScopeGeo.value));
    console.log("projectScopeGeo.value", projectScopeGeo.value)

    if (projectScopeGeo.value.type == "Point") {
      map.value.fitBounds(bounds, { padding: 20, maxZoom: 15 })

    } else {
      map.value.fitBounds(bounds, { padding: 20, duration: 1000 });

    }



  });


  // Register the directive
  //  mapContainer.value.__v_directives = [addHomeButton];


  function addHomeButton(map) {
    class HomeButton {
      onAdd(map) {
        const div = document.createElement("div");
        div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
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
    line_string: true,
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

const removeDeletedLocations = async (removed_locations, project_id) => { 
    var form = {}
    form.model = 'project_location'
    form.fields = ['project_id','settlement_id']
    form.fieldValues = [[project_id],removed_locations]
    await DeleteMultipleRecord(form)

    console.log('Deleteing.....',form)

}

const insertLocations = async (locations, project_id) => {

  const removed_locations = filterValues.value.filter(item => !locations.includes(item));

  await removeDeletedLocations(removed_locations,project_id)


 //console.log('deleted_locations',deleted_locations)
  var form = {}
  form.model = 'project_location'

  console.log('locations',locations)

  // fist check if theres any proehct with this id exists then delete all

  const location_objects = [];

  for (let i = 0; i < locations.length; i++) {
    console.log(locations[i])
    let obj = {}
    obj.project_id=project_id
    obj.settlement_id=locations[i].settlement_id
    obj.ward_id=locations[i].ward_id
    obj.subcounty_id=locations[i].subcounty_id
    obj.county_id=locations[i].county_id
    obj.location_type= 'settlement'
    obj.geom= locations[i].geom
     location_objects.push(obj)
    console.log('obj',obj)
  }

  form.data = location_objects
  console.log('formData',form)

 const loc_res = await BatchImportUpsert(form)
 console.log('loc_res',loc_res)
}

const submitForm = async () => {
  const formInstance = dynamicFormRef
  formInstance.value.validate(async (valid: boolean) => {
    if (valid) {
      // Perform form submission logic

      formData.model = model
      formData.createdBy = userInfo.id
      formData.component_id = component_id.value
  

      if (newRecord.value) {
        formData.isApproved = 'Pending'
        formData.code = shortid.generate()

        CreateRecord(formData)
          .then((response) => {
            // Assuming CreateRecord returns a response object
            console.log('Record created successfully:', formData.Location, response.data.id);
            const project_id = response.data.id
               insertLocations(formData.Location,project_id)
            // You can access specific properties of the response if needed
            // e.g., console.log('Response Data:', response.data);
          })
          .catch((error) => {
            console.error('Error creating record:', error);
          });




        console.log('New form', formData);

      } else {
       // await updateOneRecord(formData)

        updateOneRecord(formData)
          .then((response) => {
            // Assuming CreateRecord returns a response object
            console.log('Record updated successfully:', formData.Location, response.data.id);
            const project_id = response.data.id
               insertLocations(formData.Location,project_id)
            // You can access specific properties of the response if needed
            // e.g., console.log('Response Data:', response.data);
          })
          .catch((error) => {
            console.error('Error updating record:', error);
          });


        console.log('Edited form', formData);


      }


      goBack()
 

    } else {
      // Handle form validation errors
      console.log('fail validation')
      ElMessage.error('Submision Failed. Fix form errors')

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



  

const onAddOption = (source_model) => {
  
  console.log("Navigating to Add nw model")
 
    
       router.push({ name: source_model })

  
}

 
const formatMoney = (value) => {
      if (!value) return '';
      return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

const parseMoney = (value) => {
      return value.replace(/\$\s?|(,*)/g, '');
    };


/////////Tour

const isTourVisible =ref(false)
const showTour = () => {

isTourVisible.value=true

 
}




const filteredTourSteps = computed(() => {

const fil = tourSteps.value.filter(step => step.step == currentStep.value && step.visible==true);
console.log('filteredTourSteps', fil)
return fil
});


const endTour = () => { 
 
}


const tourSteps = ref([
  {
    step: 0,
    target: '#btn1',
    title: 'Title',
    content: 'Provide the title for the project.',
    visible:true
  },
  {
    step: 0,
    target: '#btn2',
    title: 'Project Code',
    content: 'Enter the unique project code.',
    visible:true
  },
  {
    step: 0,
    target: '#btn3',
    title: 'Status',
    content: 'Select the current status of the project.',
    visible:true
  },
  {
    step: 0,
    target: '#btn4',
    title: 'Delivery Unit',
    content: 'Choose the delivery unit responsible for the project.',
    visible:true
  },
  {
    step: 0,
    target: '#btn5',
    title: 'Commencement Date',
    content: 'Select the start date of the project.',
    visible:true
  },
  {
    step: 0,
    target: '#btn6',
    title: 'Completion Date',
    content: 'Select the end date of the project.',
    visible:true
  },
  {
    step: 0,
    target: '#btn7',
    title: 'Total Project Cost',
    content: 'Enter the total cost of the project.',
    visible:true
  },
  {
    step: 0,
    target: '#btn8',
    title: 'Source of Funding',
    content: 'Select the sources of funding for the project.',
    visible:true
  },
  {
    step: 0,
    target: '#btn9',
    title: 'Contractor/Implementer',
    content: 'Choose the contractor or implementer of the project.',
    visible:true
  },
  {
    step: 1,
    target: '#btn10',
    title: 'Project Activities',
    content: 'Select the activities associated with the project.',
    visible:true
  },
  {
    step: 1,
    target: '#btn11',
    title: 'Location',
    content: 'Select the locations where the project is implemented.',
    visible:true
  },
]);


// Watch dependencies and log changes (or trigger additional actions)
watch(
    [currentStep,tourSteps],
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
</style>