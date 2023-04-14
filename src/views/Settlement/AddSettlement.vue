<script setup lang="ts">
import { Form, FormExpose } from '@/components/Form'
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { reactive, onMounted, ref } from 'vue'
import {
  ElButton,
  ElSelect,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElCard,
  ElCol,
  ElIcon,
  ElRow,
  ElDivider,
  ElSkeleton,
  ElInputNumber,
  ElRadio,
  ElSteps,
  ElStep,
  ElSwitch,
  ElRadioGroup,
  ElUpload,
  ElMessage,
  FormRules
} from 'element-plus'



import {
  ArrowLeft,
  ArrowRight,
  Delete,
  Edit,
  Share,
  CircleCheckFilled,
  RefreshLeft
} from '@element-plus/icons-vue'

import { getCountyListApi } from '@/api/counties'

import { CreateRecord } from '@/api/settlements'

import type { FormInstance } from 'element-plus'
import { uuid } from 'vue-uuid'
import {
  countyOptions, SchoolLevelOptions, settlementOptionsV2, subcountyOptions,
  regOptions, mhmOptions, tenancyOptions, generalOwnership,
} from './common/index.ts'


import mapboxgl from "mapbox-gl";
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { MapboxLayerSwitcherControl, MapboxLayerDefinition } from "mapbox-layer-switcher";

import "mapbox-layer-switcher/styles.css";
import * as turf from '@turf/turf'

import readShapefileAndConvertToGeoJSON from '@/utils/readShapefile'

import { useCache } from '@/hooks/web/useCache'
import { useAppStoreWithOut } from '@/store/modules/app'




const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)





const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'
mapboxgl.accessToken = MapBoxToken;

const geoJson = ref({})



const parentOptions = ref([])
const loading = ref(true)

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  name: '',
  settlement_id: '',
  county_id: '',
  subcounty_id: '',
  settlement_type: '',
  geom: '',
  area: '',
  population: '',
  code: '',
  description: '',
  isApproved: 'Pending'
})




const fileList = ref([])



const countyRefList = ref()

const projectScopeGeo = ref([])

const typeOptions = [
  {
    value: '1',
    label: 'Slum'
  },
  {
    value: '2',
    label: 'Informal Settlement'
  },

  {
    value: '3',
    label: 'Project Location'
  },
]

const subcountyfilteredOptions = ref([])
const settlementfilteredOptions = ref([])


const handleSelectCounty = async (county_id: any) => {
  console.log(county_id)

  var subset = [];
  for (let i = 0; i < subcountyOptions.value.length; i++) {
    if (subcountyOptions.value[i].county_id == county_id) {
      subset.push(subcountyOptions.value[i]);
    }
  }
  console.log(subset)
  subcountyfilteredOptions.value = subset

  // filter settleemnts 
  var subset_settlements = [];
  for (let i = 0; i < settlementOptionsV2.value.length; i++) {
    if (settlementOptionsV2.value[i].county_id == county_id) {
      subset_settlements.push(settlementOptionsV2.value[i]);
    }
  }
  console.log("Subset Setts", subset_settlements)
  settlementfilteredOptions.value = subset_settlements


  // Get the select subcoites GEO
}




console.log('--> parent options', parentOptions.value)
const polygons = ref([]) as Ref<[number, number][][]>
const shp = []
const rules = reactive<FormRules>({
  name: [
    { required: true, message: 'Please provide  name', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }
  ],

 




})

const countries = 'ke'

const showForm = ref(true)
const showGeoFields = ref(false)
const showUploadDocuments = ref(false)
const submitBtns = ref(false)
const geoSource = ref(false)

const active = ref(0)

const next = () => {
  if (active.value < 2) {
    active.value++
  } else {
    active.value = 0
  }

  if (active.value == 0) {
    showForm.value = true
    showGeoFields.value = false
    submitBtns.value = false

  }
  else if (active.value == 1) {
    showForm.value = false
    showGeoFields.value = true
    submitBtns.value = true
  }
}


const back = () => {
  if (active.value > 0) {
    active.value--
  }
}





const submitForm = async (formEl: FormInstance | undefined) => {

  console.log("submit................", formEl)
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      ruleForm.model = 'settlement'
      ruleForm.code = uuid.v4()
      ruleForm.geom = geoJson.value

      
      ruleForm.isApproved = 'Pending'
      ruleForm.createdBy = userInfo.id

      console.log("Shp----->", geoJson.value)



      const res = CreateRecord(ruleForm)
      //   console.log(res)
      ///
    } else {
      console.log('error submit!', fields)
    }
  })
}

const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
}
const addPolygon = (poly: any) => {
  polygons.value.push(poly.features[0].geometry.coordinates[0])
  var polyShape = poly

  shp.push(polyShape)
  // ruleForm.geom = poly
}

const title = 'Add/Create Education Facility'


const map = ref()
const draw = ref()
const showDrawMarker = ref(false)



const handleFlipSwitch = (e) => {

  console.log(draw.value.isDrawEnabled)
  // if (draw.value.isDrawEnabled) {
  //   draw.value.deleteAll();
  //   draw.value.changeMode('simple_select');
  // } else {
  //   draw.value.changeMode('draw_point');
  // }
  // draw.value.isDrawEnabled = !draw.value.isDrawEnabled;
}


onMounted(() => {

  console.log("Showmarkr ICons", showDrawMarker)
  map.value = new mapboxgl.Map({
    container: 'mapContainer',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [37.137343, 1.137451],
    zoom: 5
  });

  map.value.addControl(new mapboxgl.NavigationControl());
  // add marker for project location 


  draw.value = new MapboxDraw({
    displayControlsDefault: false,
    controls: {
      point: true,
      line_string: false,
      polygon: false,
      trash: true
    },
    styles: [
      // define the style for the default blue marker icon
      {
        "id": "gl-draw-point",
        "type": "circle",
        "paint": {
          "circle-radius": 6,
          "circle-color": "red"
        }
      }
    ]
  });
  map.value.addControl(draw.value, 'top-left');


  function updateRuleform(feature) {
    // do something with the new marker feature
    var crs = { type: 'name', properties: { name: 'EPSG:4326' } }
    feature.geometry.crs = crs
    console.log('----feature', feature);



    ruleForm.geom = feature.geometry
    console.log(ruleForm)
  }

  // listen for the draw.create event
  map.value.on('draw.create', function (e) {
    // check if the new feature is a marker
    if (e.features[0].geometry.type === 'Point') {
      // trigger your function here
      updateRuleform(e.features[0]);
    }
  });

  map.value.on('mousemove', function (e) {
    document.getElementById('coordinates').innerHTML =
      'Lon: ' + e.lngLat.lng.toFixed(5) + ' Lat: ' + e.lngLat.lat.toFixed(5);
  });


  map.value.on('load', function () {
    // code to execute after the map has finished loading
    console.log("Map has loaded......")


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
      data: turf.featureCollection(projectScopeGeo.value),
    });
    
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


  });


})





var markers = [];

 




const digitize = ref()


const readShp = async (file) => {
  console.log('Reading Shp file....')

  // await getGeoJSON(file)
  readShapefileAndConvertToGeoJSON(file)
    .then((geojson) => {

      let feat = turf.featureCollection(geojson)
      // Zoom in to layer 
      map.value.getSource("scope").setData(feat);
      bounds.value = turf.bbox((feat))
      console.log("From File", bounds.value)
      map.value.fitBounds(bounds.value, { padding: 20 })

      uploadPolygon(feat)
    })
    .catch((error) => {
      console.error(error)
      ElMessage.error('Invalid shapefiles. Check your zipped file')


    })

  //uploadPolygon(feat)
}

const settlementPoly = ref([])

var bounds = ref()

const readJson = (event) => {
  console.log('Reading Josn file....', event)
  let str = event.target.result

  try {
    let json = JSON.parse(str)
    console.log(json)
    settlementPoly.value = json  // Display on map

    // Zoom in to layer 
    map.value.getSource("scope").setData(json);
    bounds.value = turf.bbox((json))
    console.log("From File", bounds.value)
    map.value.fitBounds(bounds.value, { padding: 20 })
    uploadPolygon(json)
  }
  catch (err) {
    console.log(err.message)

    ElMessage.error('Invalid Geojson Format')
    fileList.value = []
  }










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




const uploadPolygon = (poly) => {

// Zoom in to layer 
map.value.getSource("scope").setData(poly.features);
bounds.value = turf.bbox((poly))
console.log("From poly File", bounds.value)
map.value.fitBounds(bounds.value, { padding: 20 })




console.log('Digitixed', poly)
console.log('Len', poly.features.length)

//polygons.value.push(poly.features[0].geometry.coordinates[0])
// for (let i = 0; i < poly.features.length; i++) {

//   if (poly.features[i].geometry.type == 'Point' || poly.features[i].geometry.type == 'LineString') {

//     for (let j = 0; j < poly.features[i].geometry.coordinates.length; j++) {
//       console.log('j', j, poly.features[i].geometry.coordinates[j])
//       polygons.value.push(poly.features[i].geometry.coordinates[j])
//     }
//   }
//   else {
//     polygons.value.push(poly.features[i].geometry.coordinates[0])
//   }


// }

console.log('OBJ-TYPE', poly.features[0].geometry.type)

// var multiPoly = turf.multiPolygon(poly);
// console.log(multiPoly)

const multiPoly = turf.combine(poly);

console.log(multiPoly); // Output: Feature(MultiPolygon)


geoJson.value.type = poly.features[0].geometry.type
//geoJson.value.type = 'MultiPolygon'
// const merge3 = polygons.value.flat(1);

   // do something with the new marker feature
   var crs = { type: 'name', properties: { name: 'EPSG:4326' } }
  

geoJson.value.coordinates = multiPoly.features[0].geometry.coordinates
geoJson.value.crs = crs
// ruleForm.geom = poly
console.log('final GEojson', geoJson.value)


}
</script>

<template>
  <ContentWrap :title="title">

    <el-row :gutter="5">
      <el-col :xl="12" :lg="12" :md="12" :sm="12" :xs="24">
        <el-card class="box-card">
          <el-steps :active="active" finish-status="success" simple>
            <el-step title="Profile" />
            <el-step title="Location" />
          </el-steps>
          <el-form
ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px" class="demo-ruleForm"
            status-icon>
            <el-row v-if="active === 0">
              <el-divider content-position="left" />
              <el-row>
                <el-col :span="24" :lg="24" :md="24" :sm="24" :xs="24">
                  <el-form-item label="Name" prop="name">
                    <el-input v-model="ruleForm.name" />
                  </el-form-item>
                </el-col>

                <el-col :span="12" :lg="12" :md="24" :sm="24" :xs="24">
               
              <el-form-item label="Type" prop="settlement_type">
                <el-select v-model="ruleForm.settlement_type" placeholder="Type">
                  <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="12" :lg="12" :md="24" :sm="24" :xs="24">
                  <el-form-item label="County" prop="county_id">
                    <el-select
v-model="ruleForm.county_id" filterable placeholder="County"
                      :onChange="handleSelectCounty">
                      <el-option
v-for="item in countyOptions" :key="item.value" :label="item.label"
                        :value="item.value" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12" :lg="12" :md="24" :sm="24" :xs="24">
                  <el-form-item label="Subcounty" prop="subcounty_id">
                    <el-select v-model="ruleForm.subcounty_id" filterable placeholder="Sub County">
                      <el-option
v-for="item in subcountyfilteredOptions" :key="item.value" :label="item.label"
                        :value="item.value" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="12" :lg="12" :md="24" :sm="24" :xs="24">
                  <el-form-item label="Population">
                <el-input-number v-model="ruleForm.population" />
              </el-form-item>
                </el-col>
                <el-col :span="12" :lg="12" :md="24" :sm="24" :xs="24">
                  <el-form-item label="Area(Ha.)">
                <el-input-number :precision="2" v-model="ruleForm.area" />
              </el-form-item>
                </el-col>
              </el-row>

             
 
        
            </el-row>
            <el-row v-if="active === 1" :gutter="10">
              <el-divider content-position="left" />
 

              <el-form-item v-if="showGeoFields" label="Location">
              <el-switch
width="200px" v-model="geoSource"
                style="--el-switch-on-color: orange; --el-switch-off-color: purple" class="mb-2"
                active-text="Upload Geojson File" inactive-text="Draw on Map" />
            </el-form-item>


            <el-upload
v-if="showGeoFields && geoSource" class="upload-demo" drag ref="uploadRef" :auto-upload="false"
              action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" :on-change="handleUploadGeo">
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                Drop Geometry File here or <em>Click to upload</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  GeoJson files with a size less than 500kb
                </div>
              </template>
            </el-upload>


            </el-row>

 




          </el-form>


          <el-row class="mb-4  md-5">
            <el-button @click="back" type="primary">
              <ArrowLeft /> <el-icon class="el-icon--left" /> Back
            </el-button>
            <el-button @click="next" type="primary"> Next <el-icon class="el-icon--right">
                <ArrowRight />
              </el-icon>
            </el-button>
            <el-button @click="submitForm(ruleFormRef)" type="success">Save<el-icon class="el-icon--right">
                <CircleCheckFilled />
              </el-icon>
            </el-button>
            <el-button @click="resetForm(ruleFormRef)" type="warning">Reset<el-icon class="el-icon--right">
                <RefreshLeft />
              </el-icon>
            </el-button>
          </el-row>



        </el-card>

      </el-col>

      <el-col :xl="12" :lg="12" :md="12" :sm="12" :xs="24">
        <el-card class="box-card">
          <div id="mapContainer" class="basemap"></div>
          <div id='coordinates' class='coordinates'></div>

        </el-card>
      </el-col>
    </el-row>
  </ContentWrap>
</template>

<style scoped>
.basemap {
  width: 100%;
  height: 500px;
}


.coordinates {
  display: block;
  position: relative;
  width: 24%;
  bottom: 20px;
  left: 40%;
  background-color: rgba(7, 7, 7, 0.85);
  color: #fbfbfb;
  text-align: center;
  /* Center the text inside the paragraph element */
  font-size: 10px;
  z-index: 10;
  border-radius: 5px;

}
</style>