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
  ElSwitch,
  ElInputNumber,
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

import { roadOptions, AssetConditionOptions, AssetTypeOptions, } from './../common/index.ts'
import mapboxgl from "mapbox-gl";
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { MapboxLayerSwitcherControl, MapboxLayerDefinition } from "mapbox-layer-switcher";

import "mapbox-layer-switcher/styles.css";
import * as turf from '@turf/turf'

import { useRouter } from 'vue-router'
import { getOneGeo, getfilteredGeo } from '@/api/settlements'


const { push } = useRouter()


const geoJson =ref([])
const bounds = ref()


const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'
mapboxgl.accessToken = MapBoxToken;


const model = 'road_asset'
const parentOptions = ref([])
const loading = ref(true)

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  road_id: '',
  asset_type: '',
  asset_condition: '',
  geom: null,
})

//id","name","county_id","settlement_type","geom","area","population","code","description"
const getParentNames = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'road',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    var ret = response.data

    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var parentOpt = {}
      parentOpt.value = arrayItem.id
      parentOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      parentOptions.value.push(parentOpt)
    })
  })
}
getParentNames()

console.log('--> parent options', parentOptions.value)
const polygons = ref([]) as Ref<[number, number][][]>
const shp = []
const rules = reactive<FormRules>({
  name: [
    { required: true, message: 'Please provide  name', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }
  ],
  road_id: [{ required: true, message: 'Please select a road', trigger: 'blur' }],

  asset_type: [{ required: true, message: 'Road asset_type is required', trigger: 'blur' }],
  asset_condition: [{ required: true, message: 'Road asset_type is required', trigger: 'blur' }],


})

const countries = 'ke'




const active = ref(0)

const next = () => {
  if (active.value++ > 0) active.value = 0
  console.log(active.value)
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
      console.log('res>>>', res)
      if (res.code === "0000") {
        // code 0000 is successfule
        push({
      path: '/facilities/road',
      name: 'Road'
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
const addPolygon = (poly: any) => {
  polygons.value.push(poly.features[0].geometry.coordinates[0])
  var polyShape = poly

  shp.push(polyShape)
  // ruleForm.geom = poly
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
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [37.137343, 1.137451],
    zoom: 8
  });
  
     // When the map fails to load, hide the base map and show only the overlays
    //  map.value.on('error', function (e) {
    // console.log('Failed.....', e.error)
    // map.value.setStyle( './style.json');
    //       console.log("Failed to load base map. Showing only overlays.");
    //   });

  map.value.addControl(new mapboxgl.NavigationControl());
  // add marker for project location 



  function updateRuleform(feature) {
    // do something with the new marker feature
    console.log(feature.geometry);
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



const digitize = ref()


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


const handleSelectRoad = async (settlement_id: any) => {
  console.log(settlement_id)


  const formData = {}
  formData.model = 'road'
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
      <el-col :span="24" :lg="12" :md="24" :sm="24" :xs="24">
        <el-card class="box-card">
          <el-form
ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px" class="demo-ruleForm"
            status-icon>

            <el-row>
              <el-divider content-position="left" />
              <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
                <el-form-item label="Road" prop="road_id">
                  <el-select v-model="ruleForm.road_id" filterable placeholder="Road"  :onChange="handleSelectRoad">
                    <el-option v-for="item in parentOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
                <el-form-item label="Type" prop="asset_type">
                  <el-select v-model="ruleForm.asset_type" filterable placeholder="Select">
                    <el-option
v-for="item in AssetTypeOptions" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row>
              <el-form-item label="Condition" prop="asset_condition">
                <el-select v-model="ruleForm.asset_condition" filterable placeholder="Select">
                  <el-option
v-for="item in AssetConditionOptions" :key="item.value" :label="item.label"
                    :value="item.value" />
                </el-select>
              </el-form-item>
            </el-row>
            <el-row>

              <el-form-item label="Location" prop="location">
                <el-switch
style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949" v-model="digitize"
                  @change="handleFlipSwitch" class="mb-2" active-text="Input Coordinates" inactive-text="Digitize" />
              </el-form-item>
            </el-row>

            <el-row>
              <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">

                <el-form-item v-if="digitize" label="Latitude" prop="latitude">
                  <el-input-number
v-model="ruleForm.latitude" :precision="5" :step="0.01" :min="-4.6" :max="4.64"
                    @change="handleInputCoordinates" />
                </el-form-item>
              </el-col>

              <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">

                <el-form-item v-if="digitize" label="Longitude" prop="longitude">
                  <el-input-number
v-model="ruleForm.longitude" :precision="5" :step="0.01" :min="33.9" :max="42"
                    @change="handleInputCoordinates" />
                </el-form-item>
              </el-col>

            </el-row>



          </el-form>


          <el-row class="mb-4  md-5">

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
  height: 65vh;
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

