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
  UploadFilled,
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
import { useRouter } from 'vue-router'

import shortid from 'shortid';


const { push } = useRouter()



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
  geom: null,
  area: '',
  population: '',
  code: '',
  description: '',
  isApproved: 'Pending'
})




const subcounties = ref([])
var bounds = ref()

const getSubcounty = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 500,
      curUser: 1, // Id for logged in user
      model: 'subcounty',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
     var ret = response.data
    subcounties.value = ret
  
  })
}
 
 
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

  // Reset the subounty on changing the county 
  ruleForm.subcounty_id=null

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
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ruleForm.model = 'settlement'
     // ruleForm.code = uuid.v4()
      ruleForm.code = shortid.generate();
      // = geoJson.value


      
      
      ruleForm.isApproved = 'Pending'
      ruleForm.createdBy = userInfo.id

      console.log("Shp----->", ruleForm)



      const res = await CreateRecord(ruleForm)

      console.log('res>>>', res)
      if (res.code === "0000") {
        // code 0000 is successfule
        push({
      path: '/settlement/list',
      name: 'List'
    })
      }
  
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
 

const title = 'Add/Create Settleemnt'


const map = ref()
const draw = ref()
const showDrawMarker = ref(false)

getSubcounty()

 

const showDrawIcons = ref(true)
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
      point: false,
      line_string: false,
      polygon: showDrawIcons.value,
      trash: true
    },
    
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
    if (e.features[0].geometry.type === 'Polygon') {
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

 

const readShp = async (file) => {
  console.log('Reading Shp file....')

  // await getGeoJSON(file)
  readShapefileAndConvertToGeoJSON(file)
    .then((geojson) => {

      console.log("Geo>", geojson.length)
      console.log("Geo1>", geojson[0])


      if (geojson.length != 1) {
        ElMessage.warning('Please uplaod a file with only one feature. This one has ' + geojson.length + ' features')

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
        ruleForm.geom = geom

        geoJson.value = geom
    map.value.getSource("scope").setData(geoJson.value);
    bounds.value = turf.bbox((geoJson.value))
    console.log("From subcounty", bounds.value)
    map.value.fitBounds(bounds.value, { padding: 20 })
      }


    })
    .catch((error) => {
      console.error(error)
      ElMessage.error('Invalid shapefiles. Check your zipped file')


    })

  //uploadPolygon(feat)
}

const readJson = (event) => {
  console.log('Reading Josn file....', event)
  let str = event.target.result

  try {
    let json = JSON.parse(str)
    console.log('parsed', json)

    if (json.features.length != 1) {
      ElMessage.warning('Please uplaod a file with only one feature. This one has ' + json.features.length + ' features')

    }
    else {
      console.log('ok>>', json.features)
      var crs = { type: 'name', properties: { name: 'EPSG:4326' } }

      let geom = {
        type: json.features[0].geometry.type,
        coordinates: json.features[0].geometry.coordinates,
        crs:crs
      }
      console.log(geom)
      ruleForm.geom = geom

      console.log(ruleForm)


      geoJson.value = geom
      map.value.getSource("scope").setData(geoJson.value);
      bounds.value = turf.bbox((geoJson.value))
      console.log("From subcounty", bounds.value)
      map.value.fitBounds(bounds.value, { padding: 20 })


    }

  }
  catch (err) {
    console.log(err.message)

    ElMessage.error('Invalid Geojson Format')

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



const handleSelectSubCounty = async (subcounty_id: any) => {
  console.log(subcounty_id)

  // Get the select subcoites GEO 

  var newArray = await subcounties.value.filter(function (subcounty) {
    return subcounty.id == subcounty_id;
  }
  );
  console.log(newArray[0].geom)
  if (newArray[0].geom != null) {
    console.log(newArray[0].geom)
    let geom = {
      type: newArray[0].geom.type,
      coordinates: newArray[0].geom.coordinates

    }
    console.log(geom)

    geoJson.value = geom
    map.value.getSource("scope").setData(geoJson.value);
    bounds.value = turf.bbox((geoJson.value))
    console.log("From subcounty", bounds.value)
    map.value.fitBounds(bounds.value, { padding: 20 })

  } else {

    console.log("The subcounty has no shapes...")
  }

}

const toggleSwitch = async () => { 

  showDrawIcons.value = !showDrawIcons.value  

  console.log(showDrawIcons.value)
}
 



 
</script>

<template>
  <ContentWrap :title="title">

    <el-row :gutter="5">
      <el-col :xl="12" :lg="12" :md="12" :sm="24" :xs="24">
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
                    <el-select v-model="ruleForm.county_id" filterable placeholder="County" :onChange="handleSelectCounty">
                      <el-option
v-for="item in countyOptions" :key="item.value" :label="item.label"
                        :value="item.value" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12" :lg="12" :md="24" :sm="24" :xs="24">
                  <el-form-item label="Subcounty" prop="subcounty_id">
                    <el-select v-model="ruleForm.subcounty_id" filterable placeholder="Sub County"  :onChange="handleSelectSubCounty">
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
@change="toggleSwitch"
width="200px" v-model="geoSource"
                style="--el-switch-on-color: orange; --el-switch-off-color: purple" class="mb-2"
                active-text="Upload Geojson or zipped Shapefile" inactive-text="Draw on Map" />
            </el-form-item>


            <el-col :span="24" :lg="24" :md="24" :sm="24" :xs="24">

            <el-form-item v-if="showGeoFields" >

            <el-upload
v-if="showGeoFields && geoSource" class="upload-demo" drag ref="uploadRef" :auto-upload="false"
              action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" :on-change="handleUploadGeo">
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                Drop Geometry File here or <em>Click to upload</em>
              </div>
             
            </el-upload>

          </el-form-item>

            </el-col>
            </el-row>

 




          </el-form>

 
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
       



        </el-card>

      </el-col>

      <el-col :xl="12" :lg="12" :md="12" :sm="24" :xs="24">
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