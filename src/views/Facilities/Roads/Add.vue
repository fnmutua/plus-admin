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
  ElRate,
  ElSwitch,
  ElRadioGroup,
  FormRules
} from 'element-plus'


import mapboxgl from "mapbox-gl";
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { MapboxLayerSwitcherControl, MapboxLayerDefinition } from "mapbox-layer-switcher";

import "mapbox-layer-switcher/styles.css";
import * as turf from '@turf/turf'

const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'
mapboxgl.accessToken = MapBoxToken;



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

import { countyOptions, SchoolLevelOptions, settlementOptionsV2, subcountyOptions, drainageTypeOtions, SurfaceTypeOtions, RdClassOptions } from './../common/index.ts'

import { useRouter } from 'vue-router'
import { getOneGeo, getfilteredGeo } from '@/api/settlements'


const { push } = useRouter()


const geoJson =ref([])
const bounds =ref()

const model = 'road'
const parentOptions = ref([])
const loading = ref(true)
const colors = ref(['#99A9BF', '#F7BA2A', '#FF9900']) // same as { 2: '#99A9BF', 4: { value: '#F7BA2A', excluded: true }, 5: '#FF9900' }

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  name: '',
  rdNum: '',
  rdClass: '',
  rdReserve: 0,
  surfaceType: '',
  surfaceCondition: '',
  traffic: '',
  direction: '',
  drainage: '',
  drainageCondition: '',
  settlement_id: '',
  width: 0,
  length:0,
  geom: null
})



console.log('--> parent options', parentOptions.value)
const polygons = ref([]) as Ref<[number, number][][]>
const shp = []
const rules = reactive<FormRules>({
  name: [
    { required: true, message: 'Please provide  name', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }
  ],
  settlement_id: [{ required: true, message: 'Please select a settlement', trigger: 'blur' }],

  width: [{ required: true, message: 'Road Width is required', trigger: 'blur' }],






})

const countries = 'ke'








const active = ref(0)
const showNext=ref(true)
const showSubmit=ref(false)
const next = () => {
  if (active.value<1) {
    active.value++
    showNext.value = true
    showSubmit.value=false
 
  } else {
 //   active.value = 0
    showNext.value = false
    showSubmit.value=true
  }
}

const back = () => {
  if (active.value > 0) {
    active.value--
    showNext.value = true
    showSubmit.value=false
  }
}




function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}




const submitForm = async (formEl: FormInstance | undefined) => {

  console.log("submit................", formEl)
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ruleForm.model = model
      ruleForm.code = uuid.v4()
      ruleForm.length = turf.length(ruleForm.geom, { units: 'meters' });


      const res = await CreateRecord(ruleForm)
      //   console.log(res)
        
      console.log('res>>>', res)
      if (res.code === "0000") {
        // code 0000 is successfule
        push({
      path: '/facilities/road',
      name: 'Road'
    })
      }


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



const title = 'Add/Create ' + model + ' Facility'


const map = ref()
const draw = ref()
const showDrawMarker = ref(false)



onMounted(() => {

  console.log("Showmarkr ICons", showDrawMarker)
  map.value = new mapboxgl.Map({
    container: 'mapContainer',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [37.137343, 1.137451],
    zoom: 5
  });

  
    //  // When the map fails to load, hide the base map and show only the overlays
    //  map.value.on('error', function (e) {
    // console.log('Failed.....', e.error)
    // map.value.setStyle( './style.json');
    //       console.log("Failed to load base map. Showing only overlays.");
    //   });
  map.value.addControl(new mapboxgl.NavigationControl());
  // add marker for project location 



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
    // trigger your function here
    updateRuleform(e.features[0]);
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

  draw.value = new MapboxDraw({
    displayControlsDefault: false,
    controls: {
      point: false,
      line_string: true,
      polygon: false,
      trash: true
    },

  });
  map.value.addControl(draw.value, 'top-left');



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
      data: turf.featureCollection(geoJson.value),
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


const handleSelectSettlement = async (settlement_id: any) => {
  console.log(settlement_id)


  const formData = {}
  formData.model = 'settlement'
  formData.id = settlement_id

  console.log(formData)
  const res = await getOneGeo(formData)

  if (res.data[0].json_build_object.features) {
    geoJson.value = res.data[0].json_build_object

     map.value.getSource("scope").setData(geoJson.value);
    bounds.value = turf.bbox((geoJson.value))
    console.log("From subcounty", bounds.value)
    map.value.fitBounds(bounds.value, { padding: 20 })


  }
  else {

    console.log("The settlement has no shapes...")
 }

  console.log('Got settlement geo', res)

 

}



</script>

<template>
  <ContentWrap :title="toTitleCase(title)">

    <el-row :gutter="20">
      <el-col :span="10" :lg="10" :md="12" :sm="12" :xs="24">
        <el-card class="box-card">


          <el-steps :active="active" finish-status="success">
            <el-step title="Profile" />
            <el-step title="Condition" />

          </el-steps>

          <el-form
ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px" class="demo-ruleForm"
            status-icon>

            <el-row v-if="active === 0" :gutter="20">
              <el-divider content-position="left" />

              <el-col :span="24" :lg="24" :md="12" :sm="12" :xs="24">
                <el-form-item label="Road Name" prop="name">
                  <el-input v-model="ruleForm.name" />
                </el-form-item>
                <el-form-item label="Settlement" prop="settlement_id">
                  <el-select v-model="ruleForm.settlement_id" filterable placeholder="Settlement"   :onChange="handleSelectSettlement">
                    <el-option
v-for="item in settlementOptionsV2" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                </el-form-item>
                <el-form-item label="Road Class" prop="rdClass">
                  <el-select v-model="ruleForm.rdClass" filterable placeholder="A,B,C..">
                    <el-option v-for="item in RdClassOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
                <el-form-item label="Road Width" prop="width">
                  <el-input-number v-model="ruleForm.width" />
                </el-form-item>
                <el-form-item label="Reserve" prop="rdReserve">
                  <el-input-number v-model="ruleForm.rdReserve" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row class="mb-4  md-5" v-if="active === 1" :gutter="20">
              <el-divider content-position="left" />

              <el-col :span="24" :lg="24" :md="12" :sm="12" :xs="24">
                <el-form-item label="Surface Type" prop="mhm">
                  <el-select v-model="ruleForm.surfaceType" filterable placeholder="surfaceType">
                    <el-option
v-for="item in SurfaceTypeOtions" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                </el-form-item>

                <el-form-item label="Condition" prop="mhm">
                  <el-rate
v-model="ruleForm.surfaceCondition" :colors="colors" show-text
                    :texts="['Under Construction', 'Very Poor', 'Poor', 'good', 'Excellent']" />
                </el-form-item>

                <el-form-item label="Drainage Type" prop="mhm">
                  <el-select v-model="ruleForm.drainage" filterable placeholder="drainage">
                    <el-option
v-for="item in drainageTypeOtions" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                </el-form-item>


                <el-form-item label="Condition" prop="mhm">
                  <el-rate
v-model="ruleForm.drainageCondition" :colors="colors" show-text
                    :texts="['Under Construction', 'Very Poor', 'Poor', 'good', 'Excellent']" />
                </el-form-item>


              </el-col>
            </el-row>

          </el-form>


          <el-row class="mb-4  md-5" justify="center">
  <el-button @click="back" type="primary">
    <ArrowLeft /> <el-icon class="el-icon--left" /> Back
  </el-button>
  <el-button v-if="showNext" @click="next" type="primary"> Next <el-icon class="el-icon--right">
    <ArrowRight />
  </el-icon>
  </el-button>
  <el-button v-if="showSubmit" @click="submitForm(ruleFormRef)" type="success">Save<el-icon class="el-icon--right">
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

      <el-col :span="14" :lg="14" :md="12" :sm="12" :xs="24">
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
