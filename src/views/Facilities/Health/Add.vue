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
  ElRow,
  ElSkeleton,
  ElSwitch,
  ElInputNumber,
  ElRadio,
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



import { countyOptions, subcountyOptions, settlementOptionsV2, regOptions, LevelOptions, ownsershipOptions, HCFTypeOptions } from './../common/index.ts'


import { getCountyListApi } from '@/api/counties'

import { CreateRecord } from '@/api/settlements'

import type { FormInstance } from 'element-plus'
import { uuid } from 'vue-uuid'
import { useRouter } from 'vue-router'


const { push } = useRouter()

const loading = ref(true)


const geoJson =ref([])
const bounds =ref()



const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  name: '',
  settlement_id: '',
  county_id: '',
  subcounty_id: '',
  facility_type: '',
  facility_number: '',
  reg_status: '',
  level: '',
  owner: '',
  ownership_type: '',
  number_beds: '',
  geom: '',
})

//id","name","county_id","settlement_type","geom","area","population","code","description"



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




console.log('--> parent options', settlementOptionsV2.value)
const polygons = ref([]) as Ref<[number, number][][]>
const shp = []
const rules = reactive<FormRules>({
  name: [
    { required: true, message: 'Please provide  name', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }
  ],
  settlement_id: [{ required: true, message: 'Please select a settlement', trigger: 'blur' }],
  county_id: [{ required: true, message: 'Please select a county', trigger: 'blur' }],
  subcounty_id: [{ required: true, message: 'Please select a subcounty', trigger: 'blur' }],

  facility_type: [
    { required: true, message: 'The Facility Type is required', trigger: 'blur' }
  ],

  reg_status: [
    { required: true, message: 'The Registration status is required', trigger: 'blur' }
  ],
  facility_number: [
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
  ],

  number_beds: [
    { required: true, message: 'The number_beds   is required', trigger: 'blur' }
  ],


})






const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ruleForm.model = 'health_facility'
      ruleForm.code = uuid.v4()



      const res = await CreateRecord(ruleForm)
      //   console.log(res)

      
      console.log('res>>>', res)
      if (res.code === "0000") {
        // code 0000 is successfule
        push({
      path: '/facilities/health',
      name: 'Health'
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

const title = 'Add/Create Health Care Facility'

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



const digitize = ref()




</script>

<template>
  <ContentWrap :title="title">
    <el-row :gutter="20">
      <el-col :span="24" :lg="12" :md="24" :sm="24" :xs="24">
        <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px" class="demo-ruleForm" status-icon>
          <el-form-item label="Name" prop="name">
            <el-input v-model="ruleForm.name" />
          </el-form-item>
          <el-form-item label="Facility No." prop="facility_number">
            <el-input v-model="ruleForm.facility_number" />
          </el-form-item>

          <el-row>
            <el-col :span="24" :lg="12" :md="24" :sm="24" :xs="24">
              <el-form-item label="County" prop="county_id">
                <el-select v-model="ruleForm.county_id" filterable placeholder="County" :onChange="handleSelectCounty">
                  <el-option v-for="item in countyOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="24" :lg="12" :md="24" :sm="24" :xs="24">
              <el-form-item label="Subcounty" prop="subcounty_id">
                <el-select v-model="ruleForm.subcounty_id" filterable placeholder="Sub County" :onChange="handleSelectSubCounty">
                  <el-option
v-for="item in subcountyfilteredOptions" :key="item.value" :label="item.label"
                    :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
           <el-form-item label="Settlement" prop="settlement_id">
            <el-select v-model="ruleForm.settlement_id" filterable placeholder="Settlement" :onChange="handleSelectSettlement">
              <el-option
v-for="item in settlementfilteredOptions" :key="item.value" :label="item.label"
                :value="item.value" />
            </el-select>
          </el-form-item>
 
          <el-row>
            <el-col :span="12" :lg="12" :md="24" :sm="24" :xs="24">
              <el-form-item label="Type" prop="facility_type">
                <el-select v-model="ruleForm.facility_type" placeholder="Facility Type">
                  <el-option v-for="item in HCFTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12" :lg="12" :md="24" :sm="24" :xs="24">
              <el-form-item label="Level" prop="level">
                <el-select v-model="ruleForm.level" placeholder="Facility Level">
                  <el-option v-for="item in LevelOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>


          <el-row>

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
              <el-option v-for="item in ownsershipOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
        </el-row>

        <el-row>
        <el-col :span="12" :lg="12" :md="24" :sm="24" :xs="24">
        <el-form-item label="Owner" prop="owner">
            <el-input v-model="ruleForm.owner" />
          </el-form-item>
        </el-col>
          <el-col :span="12" :lg="12" :md="24" :sm="24" :xs="24">
          <el-form-item label="No. Beds">
            <el-input-number v-model="ruleForm.number_beds" />
          </el-form-item>
        </el-col>
      </el-row>

          <el-form-item label="Location" prop="location">
            <el-switch
style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949" v-model="digitize"
              @change="handleFlipSwitch" class="mb-2" active-text="Input Coordinates" inactive-text="Digitize" />
          </el-form-item>



          <el-row>
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
      
       
      <el-row class="mb-4  md-5" justify="center">
          <el-form-item>
            <el-button type="primary" @click="submitForm(ruleFormRef)">Create</el-button>
            <el-button type="warning" @click="resetForm(ruleFormRef)">Reset</el-button>
          </el-form-item>
        </el-row>
        </el-form>
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

