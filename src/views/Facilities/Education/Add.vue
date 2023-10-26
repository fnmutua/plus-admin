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
import { countyOptions, SchoolLevelOptions, settlementOptionsV2, subcountyOptions, regOptions, mhmOptions, tenancyOptions, generalOwnership, } from './../common/index.ts'


import mapboxgl from "mapbox-gl";
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { MapboxLayerSwitcherControl, MapboxLayerDefinition } from "mapbox-layer-switcher";

import "mapbox-layer-switcher/styles.css";
import * as turf from '@turf/turf'
import { useRouter } from 'vue-router'
import { getOneGeo, getfilteredGeo } from '@/api/settlements'


const { push } = useRouter()


const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'
mapboxgl.accessToken = MapBoxToken;



const geoJson =ref([])
const bounds =ref()

const parentOptions = ref([])
const loading = ref(true)

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  name: '',
  settlement_id: '',
  county_id: '',
  subcounty_id: '',
  category: '',
  school_number: '',
  reg_status: '',
  level: '',
  owner: '',
  ownership_type: '',
  male_enrollment: null,
  female_enrollment: null,
  number_teachers: null,
  number_other_staff: null,
  number_classrooms: null,
  number_male_toilets: null,
  number_female_toilets: null,
  number_handwashing_stns: null,
  avg_fees_term: null,
  mhm: '',
  parcel_tenure: '',
  tenancy: '',
  geom: null,
})







const countyRefList = ref()




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

  category: [
    { required: true, message: 'The Facility Type is required', trigger: 'blur' }
  ],

  reg_status: [
    { required: true, message: 'The Registration status is required', trigger: 'blur' }
  ],
  school_number: [
    { required: true, message: 'The facility_number   is required', trigger: 'blur' }
  ],

  level: [
    { required: true, message: 'The level   is required', trigger: 'blur' }
  ],

  owner: [
    { required: true, message: 'The owner   is required', trigger: 'blur' }
  ],
  ownership_type: [
    { required: true, message: 'The ownership_type   is required', trigger: 'blur' }
  ]




})

const countries = 'ke'



const active = ref(0)
const showNext=ref(true)
const showSubmit=ref(false)
const next = () => {
  if (active.value < 2) {
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





const submitForm = async (formEl: FormInstance | undefined) => {

  console.log("submit................", formEl)
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ruleForm.model = 'education_facility'
      ruleForm.code = uuid.v4()


      const res = await CreateRecord(ruleForm)
      //   console.log(res)
      ///
      if (res.code === "0000") {
        // code 0000 is successfule
        push({
      path: '/facilities/edu',
      name: 'Education'
    })
      }

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

const title = 'Add/Create   Project'


const map = ref()
const draw = ref()
const showDrawMarker = ref(false)

 


const state = reactive({
      isOnline: false,
    }); 
    
onMounted(() => {
 
  window.addEventListener('online', () => {
        console.log('is online')
        state.isOnline = true;
      });
  window.addEventListener('offline', () => {
    console.log('is offline')

        state.isOnline = false;
      });
 

    
console.log('Online Status',state)

   map.value = new mapboxgl.Map({
    container: 'mapContainer',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [37.137343, 1.137451],
    zoom: 8
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

  return state
})





var markers = [];




const digitize = ref(true)


const handleFlipSwitch = () => {

console.log('Future hide draw')
}

const handleInputCoordinates = () => {

  if (ruleForm.longitude && ruleForm.latitude) {
    console.log(ruleForm.longitude)
    console.log(ruleForm.latitude)
    var markerCoordinates = [ruleForm.longitude, ruleForm.latitude]


    var geometry = {
      "type": "Point",
      "coordinates": [ruleForm.longitude, ruleForm.latitude],
      "crs": { type: 'name', properties: { name: 'EPSG:4326' } }

    };

    var feature = turf.feature(geometry);
    ruleForm.geom = feature.geometry


    // Remove all the markers from the map
    for (var i = 0; i < markers.length; i++) {
      markers[i].remove();
    }

    markers.push(new mapboxgl.Marker().setLngLat([ruleForm.longitude, ruleForm.latitude]).addTo(map.value));

    // assuming you have a marker object and a map object already defined

    // get the marker coordinates

    // fly to the marker coordinates
    map.value.flyTo({
      center: markerCoordinates,
      zoom: 8, // optional, sets the zoom level
      essential: true // optional, sets the animation as an essential gesture for full-screen mode
    });


  }

}

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
    handleSelectSubCounty(ruleForm.subcounty_id)
}

  console.log('Got settlement geo', res)

 

}

const handleSelectSubCounty = async (subcounty_id: any) => {
  console.log(subcounty_id)


  const formData = {}
  formData.model = 'subcounty'
  formData.id = subcounty_id

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

console.log("The subcounty has no shapes...")
}

  console.log('Got subcounty geo', res)

 

}




</script>

<template>
  <ContentWrap :title="title">

    <el-row :gutter="5">
      <el-col :xl="12" :lg="12" :md="12" :sm="12" :xs="24">
        <el-card class="box-card">
          <el-steps :active="active" finish-status="success" simple>
            <el-step title="Profile" />
            <el-step title="Enrollment" />
            <el-step title="Facilities" />
          </el-steps>
          <el-form
ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px" class="demo-ruleForm"
            status-icon>
            <el-row v-if="active === 0">
              <el-divider content-position="left" />
              
                <el-col :span="24" :lg="24" :md="24" :sm="24" :xs="24">
                  <el-form-item label="Name" prop="name">
                    <el-input v-model="ruleForm.name" />
                  </el-form-item>
                </el-col>

                <el-col :span="12" :lg="12" :md="24" :sm="24" :xs="24">
                  <el-form-item label="Facility No." prop="facility_number">
                    <el-input v-model="ruleForm.school_number" />
                  </el-form-item>
                </el-col>
             
             
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
                    <el-select v-model="ruleForm.subcounty_id" filterable placeholder="Sub County" :onChange="handleSelectSubCounty">
                      <el-option
v-for="item in subcountyfilteredOptions" :key="item.value" :label="item.label"
                        :value="item.value" />
                    </el-select>
                  </el-form-item>
                </el-col>
                
            
                <el-col :span="12" :lg="12" :md="24" :sm="24" :xs="24">
                  <el-form-item label="Settlement" prop="settlement_id">
                    <el-select v-model="ruleForm.settlement_id" filterable placeholder="Settlement" :onChange="handleSelectSettlement">
                      <el-option
v-for="item in settlementfilteredOptions" :key="item.value" :label="item.label"
                        :value="item.value" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12" :lg="12" :md="24" :sm="24" :xs="24">
                  <el-form-item label="Registration" prop="reg_status">
                    <el-select v-model="ruleForm.reg_status" placeholder="Registration">
                      <el-option v-for="item in regOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </el-form-item>
                </el-col>
         
 
                <el-col :span="12" :lg="12" :md="24" :sm="24" :xs="24">
                  <el-form-item label="Ownership" prop="ownership_type">
                    <el-select v-model="ruleForm.ownership_type" placeholder="Ownership">
                      <el-option
v-for="item in generalOwnership" :key="item.value" :label="item.label"
                        :value="item.value" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12" :lg="12" :md="24" :sm="24" :xs="24">
                  <el-form-item label="Owner" prop="owner">
                    <el-input v-model="ruleForm.owner" />
                  </el-form-item>
                </el-col>
 
                 <el-col :span="24" :lg="24" :md="24" :sm="24" :xs="24">
                  <el-form-item label="Location" prop="location">
                    <el-switch
style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949" v-model="digitize"
                      @change="handleFlipSwitch" class="mb-2" active-text="Input Coordinates" inactive-text="Digitize" />
                  </el-form-item>
                </el-col>
                 <el-col :span="12" :lg="12" :md="24" :sm="24" :xs="24">
                  <el-form-item v-if="digitize" label="Latitude" prop="latitude">
                    <el-input-number
v-model="ruleForm.latitude" :precision="5" :step="0.01" :min="-4.6" :max="4.64"
                      @change="handleInputCoordinates" />
                  </el-form-item>
                </el-col>
                <el-col :span="12" :lg="12" :md="24" :sm="24" :xs="24">
                  <el-form-item v-if="digitize" label="Longitude" prop="longitude">
                    <el-input-number
v-model="ruleForm.longitude" :precision="5" :step="0.01" :min="33.9" :max="42"
                      @change="handleInputCoordinates" />
                  </el-form-item>
                </el-col>

             </el-row>
            <el-row v-if="active === 1" :gutter="10">
              <el-divider content-position="left" />

              <el-row>
                <el-col :span="12" :lg="12" :md="24" :sm="24" :xs="24">
                  <el-form-item label="Level" prop="level">
                    <el-select v-model="ruleForm.level" placeholder="Level">
                      <el-option
v-for="item in SchoolLevelOptions" :key="item.value" :label="item.label"
                        :value="item.value" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12" :lg="12" :md="24" :sm="24" :xs="24">
                  <el-form-item label="Avg. Fees/term">
                    <el-input-number v-model="ruleForm.avg_fees_term" />
                  </el-form-item>
                </el-col>
              </el-row>


              <el-col :span="12" :lg="12" :md="24" :sm="24" :xs="24">
                <el-form-item label="Male">
                  <el-input-number v-model="ruleForm.male_enrollment" />
                </el-form-item>
                <el-form-item label="Teachers">
                  <el-input-number v-model="ruleForm.number_teachers" />
                </el-form-item>
              </el-col>

              <el-col :span="12" :lg="12" :md="24" :sm="24" :xs="24">
                <el-form-item label="Female">
                  <el-input-number v-model="ruleForm.female_enrollment" />
                </el-form-item>
                <el-form-item label="Staff">
                  <el-input-number v-model="ruleForm.number_other_staff" />
                </el-form-item>
              </el-col>
            </el-row>


            <el-row v-if="active === 2" :gutter="10">
              <el-divider content-position="left" />
              <el-row>
                <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
                  <el-form-item label="No. Classrooms" prop="number_classrooms">
                    <el-input-number v-model="ruleForm.number_classrooms" />
                  </el-form-item>
                </el-col>
                <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
                  <el-form-item label="Female toilets" prop="number_female_toilets">
                    <el-input-number v-model="ruleForm.number_female_toilets" />
                  </el-form-item>
                </el-col>
              </el-row>


              <el-row>
                <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
                  <el-form-item label="No. Male Toilets" prop="number_male_toilets">
                    <el-input-number v-model="ruleForm.number_male_toilets" />
                  </el-form-item>
                </el-col>
                <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
                  <el-form-item label="H/W stations" prop="number_handwashing_stns">
                    <el-input-number v-model="ruleForm.number_handwashing_stns" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row>
                <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
                  <el-form-item label="Mens. Hygiene" prop="mhm">
                    <el-select v-model="ruleForm.mhm" filterable placeholder="MHM">
                      <el-option v-for="item in mhmOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
                  <el-form-item label="Tenancy" prop="tenancy">
                    <el-select v-model="ruleForm.tenancy" filterable placeholder="Owned/Rented">
                      <el-option
v-for="item in tenancyOptions" :key="item.value" :label="item.label"
                        :value="item.value" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
                  <el-form-item label="Parcel Title" prop="tenure">
                    <el-switch
v-model="ruleForm.parcel_tenure" class="mb-2" inline-prompt size="large"
                      style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949" active-text="Yes"
                      inactive-text="No" />
                  </el-form-item>
                </el-col>

              </el-row>



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
  width: 100%;
  height: 65vh; /* Set the height to 75% of the viewport height */
}



.coordinates {
  display: block;
  position: absolute; /* Use absolute positioning to position it within the container */
  width: 10%;
  bottom: 15; /* Set to 0 to align it at the bottom */
  left: 50%; /* Set to 50% to horizontally center it */
  transform: translateX(-50%); /* Use transform to horizontally center it */
  background-color: rgba(10, 10, 10, 0.85);
  color: #fbfbfb;
  text-align: center;
  font-size: 10px;
  z-index: 10;
  border-radius: 5px;
}
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