<template>
  <div>
    <el-card class="box-card">
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
v-for="(field, index) in currentStepFields" :key="index" :span="24" :xs="24" :sm="24" :md="12" :lg="8"
            :xl="8">
            <el-form-item :label="field.label" :prop="field.name">
              <el-input v-if="field.type === 'text'" v-model="formData[field.name]" />
              <el-input-number
:min="field.min" 
v-else-if="field.type === 'number'" v-model="formData[field.name]"
                @change="getFieldChangeHandler(field.name)" />
              <el-date-picker v-else-if="field.type === 'date'" type="date" v-model="formData[field.name]" />
              <!-- Add more conditions for other field types as needed -->
              <el-select
v-else-if="field.type === 'select' && field.multiselect === 'false'"
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

                 
              <el-cascader
v-else-if="field.type === 'cascade' && !isMobile" v-model="formData[field.name]"
                :filterable="true" clearable :options="field.options"  
                @change="getFieldChangeHandler(field.name)"  />
              <div v-else-if="field.type === 'cascade' && isMobile">  
                <el-button type="primary" @click="showOnMobile(field.options)"> Select </el-button> 
                <div>
                  <span style="font-size: 10px;" >{{ selectAdmin }}</span>
                </div>             
              </div>
              <el-upload
                v-else-if="field.type === 'upload' && visibleUpload"
                v-model:file-list="fileList"
                class="upload-demo"
                action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
                :auto-upload="false"
                :show-file-list="false"

                :on-change="handleUploadGeo"
              >
                <template #default>
                  <el-button type="primary">{{ fileList.length > 0 ? fileList[0].name : 'Select Geojson/Zipped Shp' }}</el-button>
                  <span class="upload-filename" v-if="fileList.length > 0">{{ fileList[0].name }}</span>
                </template>
              </el-upload>


            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div class="button-container" style="margin-bottom: 10px;">
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
      <!-- <pre>{{ JSON.stringify(formData, null, 2) }}</pre> -->
      <div v-if="currentStep == totalSteps - 1" id="mapContainer" class="basemap"></div>
        <div v-if="currentStep == totalSteps - 1"  id='coordinates' class='coordinates'></div>
        </el-card>
        <el-dialog v-model="showDialog" title="Select Location" width="70%">
      <el-row  >
          <el-select v-model="county_id" class="m-2"  @change="onSelectCounty"  placeholder="Select" size="large">
            <el-option
              v-for="item in cascadeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>

      <el-select v-model="subcounty_id" class="m-2"   @change="onSelectSubcounty"  placeholder="Select" size="large">
        <el-option
          v-for="item in subcountyOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>

      <el-select v-model="ward_id" class="m-2" placeholder="Select" @change="onSelectWard" size="large">
        <el-option
          v-for="item in wardOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <el-select v-model="settlement_id" class="m-2" placeholder="Select" @change="onSelectSettlement" size="large">
        <el-option
          v-for="item in settOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
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
  </div>

 
</template>


<script lang="ts" setup>
import { ref, reactive, onMounted, computed, Ref } from 'vue';
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { ElCard, ElCascader, ElCascaderPanel, ElDialog, ElMessage , ElUpload, ElSwitch} from 'element-plus'
import { useRouter } from 'vue-router'

import { steps, formFields, formData, formRules } from './common/fields.ts'
import { createHousehold, getOneHousehold, updateHousehold } from '@/api/households'
import shortid from 'shortid';
import { useRoute } from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'

import mapboxgl from "mapbox-gl";
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { MapboxLayerSwitcherControl, MapboxLayerDefinition } from "mapbox-layer-switcher";
import { CreateRecord, DeleteRecord, updateOneRecord,getOneGeo, getOneSettlement, uploadDocuments, getfilteredGeo } from '@/api/settlements'

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




const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'
mapboxgl.accessToken = MapBoxToken;


const isMobile = computed(() => appStore.getMobile)


const route = useRoute()
const { push } = useRouter()


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
const subcountyOptions=ref([])
const ward_id = ref()
const wardOptions = ref([])
const selectAdmin = ref()

const settOptions = ref([])
const settlement_id = ref()

 
const onSelectCounty = (county_id) => {
  subcounty_id.value=null
  const selCounty = cascadeOptions.value.filter((obj) => obj.value === county_id);
  subcountyOptions.value = selCounty[0].children
  console.log(subcountyOptions)
  selectAdmin.value=selCounty[0].label


};
const onSelectSubcounty = (subcounty_id) => {
  ward_id.value= null
  const selSubCounty = subcountyOptions.value.filter((obj) => obj.value === subcounty_id);
  wardOptions.value = selSubCounty[0].children
  console.log(subcountyOptions)
  selectAdmin.value= selectAdmin.value + ' | '+ selSubCounty[0].label
};

const onSelectWard = (ward_id) => {
  settlement_id.value= null
  const selectWard = wardOptions.value.filter((obj) => obj.value === ward_id);
  settOptions.value = selectWard[0].children

   selectAdmin.value= selectAdmin.value + ' | '+ selectWard[0].label
};

const onSelectSettlement = (sett_id) => {
    const selectedSettlement = settOptions.value.filter((obj) => obj.value === sett_id);
  selectAdmin.value= selectAdmin.value + ' | '+ selectedSettlement[0].label
};
 
const setLocationOnMobile = () => {
  formData.county_id = county_id.value
  formData.subcounty_id=subcounty_id.value
  formData.ward_id = ward_id.value
  formData.settlement_id = settlement_id.value
  formData.location =[county_id,subcounty_id,ward_id,settlement_id]

  console.log('formData',formData)
  showDialog.value=false
};
/// - mobile end 

const fileList = ref([])
const visibleUpload = ref(false)

const newRecord = ref(true)

const map = ref()
 
const mapContainer = ref(null);
const projectScopeGeo = ref([])
const model  ='health_facility'
onMounted( async () => {
 
 //formData.value = JSON.parse(route.query.formData);
// console.log('data>>',data)
 console.log('passed data', route.query.id)

 const form = {}
 form.model =model
 form.id = route.query.id

 if (route.query.id) {
     await getOneSettlement(form)
         .then((res) => {
             // Handle the successful response here
             console.log(res.data)
             var curData = res.data
           curData.location = [curData.county_id, curData.subcounty_id, curData.ward_id, curData.settlement_id]
            curData.geom = curData.geom 

           console.log('curData',curData)
           projectScopeGeo.value = curData.geom 
 
 

           //  formData = res.data
             Object.assign(formData, curData);
             console.log(formData)
             newRecord.value=false
         })
         .catch((error) => {
             // Handle the error here
             console.log('Error:', error);
         });
 } else {

     Object.keys(formData).forEach((key) => {
         formData[key] = undefined;
     });
 } 
})



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

              console.log('geometry',geometry)
      let geom = {
        type: json.features[0].geometry.type,
        coordinates: geometry.coordinates
      }
     console.log(geom)
      formData.geom = geom


      projectScopeGeo.value = geom
      map.value.getSource("scope").setData(projectScopeGeo.value);
      bounds.value = turf.bbox((projectScopeGeo.value))
      console.log("From geo", bounds.value)
      map.value.fitBounds(bounds, { padding: 20, maxZoom: 18})

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
          crs:crs

        }
    

        console.log('>>',geom)
        formData.geom = geom

    projectScopeGeo.value = geom
    map.value.getSource("scope").setData(projectScopeGeo.value);
    bounds.value = turf.bbox((projectScopeGeo.value))
    console.log("From shp", bounds.value)
    map.value.fitBounds(bounds.value , { padding: 20, maxZoom: 15})
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

    //   console.log(map.value)

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
    if (e.features[0].geometry.type === 'Point') {
      // trigger your function here
      updateRuleform(e.features[0]);

    }
  });
 
  // Listen for the draw.delete event
  map.value.on('draw.delete', function(event) {
    // Get the IDs of the deleted features
    var deletedFeatureIds = event.features.map(function(feature) {
      return feature.id;
    });

    // Remove the corresponding layers from the map
    deletedFeatureIds.forEach(function(id) {
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

  // Set the state of the layer to "draw" to enable drawing on it
  map.value.setFeatureState({'source': 'draw-layer', 'id': 'draw-layer'}, {'draw': true});
 
  // draw.value = new MapboxDraw({
  //   displayControlsDefault: false,
  //   controls: {
  //     point: true,
  //     line_string: true,
  //     polygon: true,
  //     trash: true
  //   },
    
  // });
  // map.value.addControl(draw.value, 'top-left');




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



    map.value.addSource('scope', {
      type: 'geojson',
      //data: projectPoly.value
      data: (projectScopeGeo.value),
    });
    
    if (newRecord.value) { 
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
    else {
      map.value.addLayer({
        id: 'projectScopeGeo',
        type: 'circle',
        source: 'scope',
        paint: {
          'circle-radius': 6,
          'circle-color': '#ff0000', // Red color
          'circle-stroke-color': '#000',
          'circle-stroke-width': 2
        }
      });

    }
 

    var bounds = turf.bbox((projectScopeGeo.value));
    //map.value.fitBounds(bounds, {padding: 20,duration:1000 });
    map.value.fitBounds(bounds, { padding: 20, maxZoom: 15})



  });
 
      
      // Register the directive
    //  mapContainer.value.__v_directives = [addHomeButton];

} 



const draw = new MapboxDraw({
  displayControlsDefault: false,
  controls: {
    point: true,
    line_string: false,
    polygon: false,
    trash: true
  },

})

const toggleDrawToolbox = (value) => {
  console.log(value)

  if (value == 'digitize') {
    visibleUpload.value=false 

  map.value.addControl(draw, 'top-left');
  console.log('adding')
} else if(value == 'upload') {

  visibleUpload.value=true 
  map.value.removeControl(draw);
  console.log('remove....')
  }
else {
  visibleUpload.value=false 

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
      formData.code = shortid.generate()
      formData.createdBy = userInfo.id


      if (newRecord.value) {
        formData.isApproved = 'Pending'

        await CreateRecord(formData)
 
        console.log('New form', formData);

      } else {
        await updateOneRecord(formData)

        console.log('Edited form', formData);


      }

      push({
         name: 'Health'
      })

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
  //const location = formFields.flat().find((f) => f.name === 'location');

  formData.county_id = value[0]
  formData.subcounty_id = value[1]
  formData.ward_id = value[2]
  formData.settlement_id = value[3]

   
  if (value.length==1) {
    var model = 'county'
    var model_id = value[0]
  } else if (value.length==2) {
    var model = 'subcounty'
    var model_id = value[1]
  }
  else if (value.length==3) {
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


  if (newRecord.value ) {
    projectScopeGeo.value=res.data[0].json_build_object

  }
  //const lastElement = array[array.length - 1];

 
 
  console.log('location field changed:', formData);

};




// Function to get the field change handler based on field name
const getFieldChangeHandler = (fieldName: string) => {
  const field = formFields.flat().find((f) => f.name === fieldName);
  if (fieldName == 'location') {
    handleChangeLocation(formData[fieldName])
  }

  if (fieldName == 'location_option') {
    handleChangeLocationOption(formData[fieldName])
  }
  return undefined;
};


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
  height: 400px;
}



.coordinates {
  display: block;
  position: relative;
  width: 10%;
  bottom: 20px;
  left: 1%;
  background-color: rgba(10, 10, 10, 0.85);
  color: #fbfbfb;
  text-align: center;
  /* Center the text inside the paragraph element */
  font-size: 10px;
  z-index: 10;
  border-radius: 5px;

}
.upload {
  display: block;
  position: relative;
  width: 24%;
  top: 100px;
  left: 20px; /* Updated to move the element to the top left corner */
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