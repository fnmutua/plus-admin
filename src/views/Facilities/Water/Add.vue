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
import { getOneGeo, getfilteredGeo } from '@/api/settlements'

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


import { countyOptions, subcountyOptions, WaterFacilitytypeOptions, settlementOptionsV2, LevelOptions, ownsershipOptions, regOptions, HCFTypeOptions } from './../common/index.ts'
import { generalOwnership } from '../common'

import { useRouter } from 'vue-router'


const { push } = useRouter()


const geoJson =ref([])
const bounds = ref()


const model = 'water_point'
const parentOptions = ref([])
const loading = ref(true)
const colors = ref(['#99A9BF', '#F7BA2A', '#FF9900']) // same as { 2: '#99A9BF', 4: { value: '#F7BA2A', excluded: true }, 5: '#FF9900' }

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  name: '',
  settlement_id: '',
  county_id: '',
  subcounty_id: '',
  type: '',
  capacity: '',
  cost_20l_jerrican: 0,
  owner: '',
  ownership_type: '',
  depth: 0,
  geom: null,
})

const polygons = ref([]) as Ref<[number, number][][]>
const shp = []
const rules = reactive<FormRules>({
  name: [
    { required: true, message: 'Please provide  name', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }
  ],
  county_id: [{ required: true, message: 'Please select a County', trigger: 'blur' }],
  subcounty_id: [{ required: true, message: 'Please select a Subcounty', trigger: 'blur' }],
  type: [{ required: true, message: 'Facility type is required', trigger: 'blur' }],
})


//id","name","county_id","settlement_type","geom","area","population","code","description"

const settlementfilteredOptions = ref([])






const subcountyfilteredOptions = ref([])

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




//getParentNames()



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


      const res = await CreateRecord(ruleForm)
      //   console.log(res)
      if (res.code === "0000") {
        // code 0000 is successfule
        push({
      path: '/facilities/water/wp',
      name: 'WaterPoint'
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
const addPolygon = (poly: any) => {
  polygons.value.push(poly.features[0].geometry.coordinates[0])
  var polyShape = poly

  shp.push(polyShape)
  // ruleForm.geom = poly
}

const title = 'Add/Create Water Point Facility'


const map = ref()
const draw = ref()
const showDrawMarker = ref(false)



onMounted(() => {

  console.log("Showmarkr ICons", showDrawMarker)
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
      point: true,
      line_string: false,
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


var markers = [];

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





const digitize = ref()



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
  <ContentWrap :title="toTitleCase(title)">

    <el-row :gutter="20">
      <el-col :span="12" :lg="12" :md="12" :sm="12" :xs="24">
        <el-card class="box-card">


          <el-steps :active="active" finish-status="success">
            <el-step title="Profile" />
            <el-step title="Capacity" />

          </el-steps>

          <el-form
ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px" class="demo-ruleForm"
            status-icon>

            <el-row v-if="active === 0" :gutter="10">
              <el-divider content-position="left" />

              <el-col :span="24" :lg="24" :md="12" :sm="12" :xs="24">
                <el-form-item label="Name" prop="name">
                  <el-input v-model="ruleForm.name" />
                </el-form-item>
              </el-col>


              <el-row>
                <el-col :xl="12" :lg="12" :md="12" :sm="12" :xs="24">
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

                <el-col :xl="12" :lg="12" :md="12" :sm="12" :xs="24">
                  <el-form-item label="Subcounty" prop="subcounty_id">
                    <el-select v-model="ruleForm.subcounty_id" filterable placeholder="Sub County"  :onChange="handleSelectSubCounty">
                      <el-option
v-for="item in subcountyfilteredOptions" :key="item.value" :label="item.label"
                        :value="item.value" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-col :xl="12" :lg="12" :md="12" :sm="12" :xs="24">

                <el-form-item label="Settlement" prop="settlement_id">
                  <el-select v-model="ruleForm.settlement_id" filterable placeholder="Settlement"   :onChange="handleSelectSettlement">
                    <el-option
v-for="item in settlementfilteredOptions" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                </el-form-item>


                <el-form-item label="Type" prop="facility_type">
                  <el-select v-model="ruleForm.type" filterable placeholder="select">
                    <el-option
v-for="item in WaterFacilitytypeOptions" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xl="12" :lg="12" :md="12" :sm="12" :xs="24">


                <el-form-item label="Ownership" prop="ownership">
                  <el-select v-model="ruleForm.ownership_type" filterable placeholder="select">
                    <el-option
v-for="item in generalOwnership" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                </el-form-item>
                <el-form-item label="Owner" prop="owner">
                  <el-input v-model="ruleForm.owner" />
                </el-form-item>
              </el-col>



              <el-form-item label="Location" prop="location">
                <el-switch
style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949" v-model="digitize"
                  @change="handleFlipSwitch" class="mb-2" active-text="Input Coordinates" inactive-text="Digitize" />
              </el-form-item>


              <el-form-item v-if="digitize" label="Latitude" prop="latitude">
                <el-input-number
v-model="ruleForm.latitude" :precision="5" :step="0.01" :min="-4.6" :max="4.64"
                  @change="handleInputCoordinates" />
              </el-form-item>

              <el-form-item v-if="digitize" label="Longitude" prop="longitude">
                <el-input-number
v-model="ruleForm.longitude" :precision="5" :step="0.01" :min="33.9" :max="42"
                  @change="handleInputCoordinates" />
              </el-form-item>



            </el-row>

            <el-row class="mb-4  md-5" v-if="active === 1" :gutter="20">
              <el-divider content-position="left" />

              <el-col :span="24" :lg="24" :md="12" :sm="12" :xs="24">
                <el-form-item label="Depth" prop="depth">
                  <el-input-number v-model="ruleForm.depth" />
                </el-form-item>

                <el-form-item label="Depth" prop="depth">
                  <el-input-number v-model="ruleForm.capacity" />
                </el-form-item>

                <el-form-item label="Price(20l)" prop="depth">
                  <el-input-number v-model="ruleForm.cost_20l_jerrican" />
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

      <el-col :span="12" :lg="12" :md="12" :sm="12" :xs="24">
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
  height: 65vh;
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

</style>
