<script setup lang="ts">
import { Form, FormExpose } from '@/components/Form'
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { reactive, unref, onMounted, ref } from 'vue'
import {
  ElButton,
  ElSelect,
  ElForm,
  ElFormItem,
  ElInput,
  ElCascader,
  ElSwitch,
  ElOption,
  ElCard,
  ElCol,
  ElIcon,
  ElRow,
  ElDivider,
  ElDatePicker,
  ElInputNumber,
  FormRules
} from 'element-plus'



import {
  CircleCheckFilled,
  RefreshLeft
} from '@element-plus/icons-vue'

import { getCountyListApi } from '@/api/counties'

import { CreateRecord } from '@/api/settlements'

import type { FormInstance } from 'element-plus'
import { uuid } from 'vue-uuid'
import mapboxgl from "mapbox-gl";
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { MapboxLayerSwitcherControl, MapboxLayerDefinition } from "mapbox-layer-switcher";

import "mapbox-layer-switcher/styles.css";
import * as turf from '@turf/turf'
import { getOneGeo, getfilteredGeo } from '@/api/settlements'



import {
  countyOptions, cascadeOptions, settlementOptionsV2, subcountyOptions,
  wasteOptions, frequencyOptions, phase_options, FacilityConditionOptions
} from './../common/index.ts'
import { generalOwnership } from '../common'

import { useRouter } from 'vue-router'


const { push } = useRouter()

const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'
mapboxgl.accessToken = MapBoxToken;

const geoJson =ref([])
const bounds =ref()



const model = 'other_facility'
const parentOptions = ref([])
const loading = ref(true)
const tmpSel = ref([])

///--------switches to enable fields on form based on selected feature --------------
const rating = ref(false)
const phase = ref(false)
const height = ref(false)
const date_install = ref(false)
const stances = ref(false)
const cost = ref(false)
const waste = ref(false)
const security = ref(false)
const hazards = ref(false)
///----------------------------------------------------------------------------------
const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  type: '',
  condition: '',
  type_waste: '',
  cost_per_use: 0,
  number_stances: 0,
  number_staff: 0,
  number_phases: '',
  size_reserve: 0,
  rating: '',
  number_vehicles: 0,
  height: 0,
  frequency: '',
  date_install: Date.now(),
  ownership_type: '',
  owner: '',
  settlement_id: '',
  county_id: '',
  subcounty_id: '',
  latitude: null,
  longitude: null,
  geom: null,
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




console.log('--> parent options', parentOptions.value)

const rules = reactive<FormRules>({
  county_id: [{ required: true, message: 'Please select a county', trigger: 'blur' }],
  subcounty_id: [{ required: true, message: 'Please select a Subcounty', trigger: 'blur' }],
  type: [{ required: true, message: 'Facility Type is required', trigger: 'blur' }],
  condition: [{ required: true, message: 'Facility condition is required', trigger: 'blur' }],
})









const active = ref(0)






function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}


const handleChange = (selected) => {
  //  console.log(selected.length)
  // console.log(selected[selected.length - 1])
  ruleForm.type = selected[selected.length - 1]
  var selection = selected[selected.length - 1]
  // console.log(ruleForm)


  //------------------rating and phases------------------
  if (selection === 'primary_substation' || selection === 'powerline' || selection === 'floodlight' || selection === 'secondary_substation') {
    rating.value = true
    phase.value = true
  } else {
    rating.value = false
    phase.value = false
  }

  //---------------height of floodlights----------
  if (selection === 'floodlight') {
    height.value = true
    date_install.value = true
  } else {
    height.value = false
    date_install.value = false
  }

  //---------------stances----------
  if (selection === 'toilet' || selection === 'shower') {
    stances.value = true
  } else {
    stances.value = false
  }

  //---------------stances----------
  if (selection === 'toilet' || selection === 'shower') {
    stances.value = true
    cost.value = true
  } else {
    stances.value = false
    cost.value = false
  }

  if (selection === 'illegal_dumping_site' || selection === 'legal_dumping_site' || selection === 'treatment_center' || selection === 'collection_point' || selection === 'waste_mgmt_project' || selection === 'other_waste_mgmt') {
    waste.value = true
    cost.value = true
  } else {
    waste.value = false
    cost.value = false
  }

  if (selection === 'police_stn' || selection === 'police_post' || selection === 'chiefs_camp') {
    security.value = true
  } else {
    security.value = false

  }

  if (selection === 'other_hazard' || selection === 'landslide' || selection === 'flooding' || selection === 'fire') {
    hazards.value = true
  } else {
    hazards.value = false

  }










}


const submitForm = async (formEl: FormInstance | undefined) => {

  console.log("submit................", formEl)
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ruleForm.model = model
      ruleForm.code = uuid.v4()

      console.log(ruleForm)

      const res = await CreateRecord(ruleForm)
      console.log('after---->', res)


   
      console.log('res>>>', res)
      if (res.code === "0000") {
        // code 0000 is successfule
        push({
      path: '/facilities/other',
      name: 'OtherFacility'
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
      <el-col :span="12" :lg="12" :md="24" :sm="24" :xs="24">
        <el-card class="box-card">
          <el-form
ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px" class="demo-ruleForm"
            status-icon>

            <el-divider content-position="left" />

            <el-row :gutter="10">
              <el-col :xl="12" :lg="12" :md="12" :sm="12" :xs="24">
                <el-form-item label="County" prop="county_id">
                  <el-select v-model="ruleForm.county_id" filterable placeholder="County" :onChange="handleSelectCounty">
                    <el-option v-for="item in countyOptions" :key="item.value" :label="item.label" :value="item.value" />
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

            <el-row :gutter="10">
              <el-col :span="24" :lg="12" :md="24" :sm="24" :xs="24">
                <el-form-item label="Settlement" prop="settlement_id">
                  <el-select v-model="ruleForm.settlement_id" filterable placeholder="Settlement" :onChange="handleSelectSettlement">
                    <el-option
v-for="item in settlementfilteredOptions" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>

            </el-row>


            <el-row :gutter="10">

              <el-col :span="24" :lg="12" :md="24" :sm="24" :xs="24">


                <el-form-item label="Type" prop="type">
                  <el-cascader
v-model="tmpSel" :options="cascadeOptions" :show-all-levels="false"
                    @change="handleChange" />

                </el-form-item>

                <el-form-item v-if="rating" label="Rating(V)" prop="rating">
                  <el-input v-model="ruleForm.rating" />
                </el-form-item>

                <el-form-item v-if="height" label="Height(m)" prop="height">
                  <el-input-number v-model="ruleForm.height" />
                </el-form-item>

                <el-form-item v-if="height" label="Installation Date" prop="date_install">
                  <el-date-picker v-model="ruleForm.date_install" type="date" placeholder="Select date" :size="small" />
                </el-form-item>

                <el-form-item v-if="stances" label="# of Stances" prop="stances">
                  <el-input-number v-model="ruleForm.number_stances" />
                </el-form-item>

                <el-form-item v-if="cost" label="Cost per use" prop="cost">
                  <el-input-number v-model="ruleForm.cost_per_use" />
                </el-form-item>

                <el-form-item v-if="security" label="#Patrol Vehicles" prop="cost">
                  <el-input-number v-model="ruleForm.number_vehicles" />
                </el-form-item>

                <el-form-item v-if="security" label="#Security staff" prop="cost">
                  <el-input-number v-model="ruleForm.number_staff" />
                </el-form-item>


                <el-form-item label="Ownership" prop="ownership_type">
                  <el-select v-model="ruleForm.ownership_type" filterable placeholder="Select">
                    <el-option
v-for="item in generalOwnership" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                </el-form-item>

              </el-col>
              <el-col :span="24" :lg="12" :md="24" :sm="24" :xs="24">

                <el-form-item v-if="phase" label="Phase" prop="phase">
                  <el-select v-model="ruleForm.number_phases" filterable placeholder="Select">
                    <el-option v-for="item in phase_options" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>


                <el-form-item v-if="waste" label="Type of Waste" prop="type">
                  <el-select v-model="ruleForm.type_waste" filterable placeholder="Select">
                    <el-option v-for="item in wasteOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>

                <el-form-item v-if="hazards" label="Frequency" prop="frequency">
                  <el-select v-model="ruleForm.frequency" filterable placeholder="Select">
                    <el-option
v-for="item in frequencyOptions" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                </el-form-item>



                <el-form-item label="Owner" prop="owner">
                  <el-input v-model="ruleForm.owner" />
                </el-form-item>

                <el-form-item label="Condition" prop="asset_condition">
                  <el-select v-model="ruleForm.condition" filterable placeholder="Select">
                    <el-option
v-for="item in FacilityConditionOptions" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                </el-form-item>


              </el-col>
            </el-row>
            <el-col :span="24" :lg="12" :md="24" :sm="24" :xs="24">
              <el-form-item label="Location" prop="location">
                <el-switch
style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949" v-model="digitize"
                  @change="handleFlipSwitch" class="mb-2" active-text="Coordinates" inactive-text="Digitize" />
              </el-form-item>
            </el-col>


            <el-row :gutter="10">
              <el-col :span="24" :lg="12" :md="24" :sm="24" :xs="24">
                <el-form-item v-if="digitize" label="Latitude" prop="latitude">
                  <el-input-number
v-model="ruleForm.latitude" :precision="5" :step="0.01" :min="-4.6" :max="4.64"
                    @change="handleInputCoordinates" />
                </el-form-item>
              </el-col>
              <el-col :span="24" :lg="12" :md="24" :sm="24" :xs="24">
                <el-form-item v-if="digitize" label="Longitude" prop="longitude">
                  <el-input-number
v-model="ruleForm.longitude" :precision="5" :step="0.01" :min="33.9" :max="42"
                    @change="handleInputCoordinates" />
                </el-form-item>
              </el-col>

            </el-row>

          </el-form>


      
            <el-row class="mb-4  md-5" justify="center">

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

      <el-col :span="12" :lg="12" :md="24" :sm="24" :xs="24">
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

