<script setup lang="ts">
import { Form, FormExpose } from '@/components/Form'
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { reactive, unref, ref, Ref } from 'vue'
import {
  ElButton,
  ElSelect,
  ElForm,
  ElFormItem,
  ElInput,
  ElCascader,
  ElOption,
  ElCard,
  ElCol,
  ElIcon,
  ElRow,
  ElDivider,
  ElUpload,
  ElDatePicker,
  ElInputNumber,
  FormRules,
  ElSteps,
  ElStep,
  ElButtonGroup,
  ElSwitch,
  ElMessage
} from 'element-plus'

import {
  MapboxMap,
  MapboxGeocoderControl,
  MapboxDrawControl,
  MapboxGeolocateControl,
  MapboxNavigationControl,

} from 'vue-mapbox-ts'
import { DocumentAdd, Edit, Plus, Picture, Location, Upload, ArrowRight, Promotion, RefreshLeft, UploadFilled } from '@element-plus/icons-vue'


import { getCountyListApi } from '@/api/counties'

import { CreateRecord, deleteDocument, uploadDocuments } from '@/api/settlements'

import type { FormInstance } from 'element-plus'
import { uuid } from 'vue-uuid'
import { Icon } from '@iconify/vue';
import documentAttach from '@iconify-icons/ion/document-attach';
import type { UploadProps, UploadUserFile } from 'element-plus'

import { readFile } from 'jsonfile';
import type { UploadInstance } from 'element-plus'
import { useRouter } from 'vue-router'
import readShapefileAndConvertToGeoJSON from '@/utils/readShapefile'
import { util } from 'echarts'

import { isProxy, toRaw } from 'vue';
import JSZip from 'jszip';
//import  shapefile   from 'shapefile';
import { open } from 'shapefile';
import * as turf from '@turf/turf'

import '@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css';

import MapboxDraw from "@mapbox/mapbox-gl-draw";

import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'
import { onMounted } from 'vue'

import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

import { MapboxLayerSwitcherControl } from "mapbox-layer-switcher";
import "mapbox-layer-switcher/styles.css";





const uploadRef = ref<UploadInstance>()
const { push } = useRouter()

const fileList = ref([])

const model = 'settlement'
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
  name: '',
  county_id: '',
  settlement_type: '',
  geom: '',
  area: '',
  population: '',
  code: '',
  description: '',


})





const programmeOptions = ref([])
const getProgrammeOptions = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'programme',
      searchField: 'title',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    var ret = response.data

    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var countyOpt = {}
      countyOpt.value = arrayItem.id
      countyOpt.label = arrayItem.title + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      programmeOptions.value.push(countyOpt)
    })
  })
}

//id","name","county_id","settlement_type","geom","area","population","code","description"
const getParentNames = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'county',
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
getProgrammeOptions()




console.log('--> parent options', parentOptions.value)

const geoJson = ref({})
const polygons = ref([]) as Ref<[number, number][][]>


const rules = reactive<FormRules>({
  name: [{ required: true, message: 'Please select a Settlement', trigger: 'blur' }],
  county_id: [{ required: true, message: 'county_id is required', trigger: 'blur' }],
  settlement_type: [{ required: true, message: 'settlement_type is required', trigger: 'blur' }],
  area: [{ required: true, message: 'area is required', trigger: 'blur' }],
  population: [{ required: true, message: 'population is required', trigger: 'blur' }],
  description: [{ required: true, message: 'description is required', trigger: 'blur' }],



})

const countries = 'ke'





// uploading the documents 






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
      ruleForm.geom = geoJson.value

      console.log("Shp----->", geoJson.value)





      const fileTypes = []
      const filesFormData = new FormData()
      for (var i = 0; i < fileList.value.length; i++) {
        console.log('------>file', fileList.value[i])
        var format = fileList.value[i].name.split('.').pop() // get file extension
        fileTypes.push(format)

        filesFormData.append('file', fileList.value[i].raw)
        filesFormData.append('DocType', format)

      }



      const report = await CreateRecord(ruleForm)




      filesFormData.append('parent_code', report.data.id)
      filesFormData.append('model', model)
      filesFormData.append('grp', 'Settlement Documentation')
      filesFormData.append('code', uuid.v4())
      filesFormData.append('column', 'settlement_id')



      console.log('Upload starting ')
      await uploadDocuments(formData)


      console.log("Creationg report :", report)







    } else {
      console.log('error submit!', fields)
    }
  })
}



const uploadPolygon = (poly) => {

  // Zoom in to layer 
  map.value.getSource("polygons").setData(poly.features);
  bounds.value = turf.bbox((poly))
  console.log("From poly File", bounds.value)
  map.value.fitBounds(bounds.value, { padding: 20 })




  console.log('Digitixed', poly)
  console.log('Len', poly.features.length)

  //polygons.value.push(poly.features[0].geometry.coordinates[0])
  for (let i = 0; i < poly.features.length; i++) {

    if (poly.features[i].geometry.type == 'Point' || poly.features[i].geometry.type == 'LineString') {

      for (let j = 0; j < poly.features[i].geometry.coordinates.length; j++) {
        console.log('j', j, poly.features[i].geometry.coordinates[j])
        polygons.value.push(poly.features[i].geometry.coordinates[j])
      }
    }
    else {
      polygons.value.push(poly.features[i].geometry.coordinates[0])
    }


  }

  console.log('OBJ-TYPE', poly.features[0].geometry.type)

  var multiPoly = turf.multiPolygon(polygons);
  console.log(multiPoly)

  geoJson.value.type = poly.features[0].geometry.type
  //geoJson.value.type = 'MultiPolygon'
  // const merge3 = polygons.value.flat(1);

  geoJson.value.coordinates = polygons
  // ruleForm.geom = poly
  console.log('Len', geoJson.value)


}



const title = 'Add/Create Settlement'


const active = ref(0)
const showForm = ref(true)
const showGeoFields = ref(false)
const showUploadDocuments = ref(false)
var bounds = ref()
const next = () => {
  console.log('Step:', active)

  if (active.value++ > 2) active.value = 0
  if (active.value == 0) {
    showForm.value = true
    showGeoFields.value = false
    showUploadDocuments.value = false

  }
  else if (active.value == 1) {
    showForm.value = false
    showGeoFields.value = true
    showUploadDocuments.value = false
  }
  else if (active.value == 2) {
    showForm.value = false
    showGeoFields.value = false
    showUploadDocuments.value = true
  }
}

const settlementPoly = ref([])
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


// const getGeoJSON = async (file) => {
//   // read the shapefile using the FileReader API
//   const zip = new JSZip();
//   await zip.loadAsync(file);
//   const keys = Object.keys(zip.files)
//   //const shpName = keys.findIndex(element => element.includes(".shp "));
//   const shpName = keys.filter(arr => arr.match(".shp") !== null)
//   const dbf = keys.filter(arr => arr.match(".shp") !== null)
//   console.log(shpName)

//   const x = ref({ name: 'John' });
//   zip.file(shpName[0]).async("ArrayBuffer").then(async function (data) {

//     const arr = ref([])
//     open(data)
//       .then(source => source.read()
//         .then(async function log(result) {
//           if (result.done) {
//             console.log(arr.value)
//             uploadPolygon(turf.featureCollection(arr.value))
//             return
//           };
//           // console.log(result.value);
//           arr.value.push(result.value)
//           return source.read().then(log);
//         }))
//       .catch(error => console.error(error.stack));

//   })

// }

const readShp = async (file) => {
  console.log('Reading Shp file....')

  // await getGeoJSON(file)
  readShapefileAndConvertToGeoJSON(file)
    .then((geojson) => {

      let feat = turf.featureCollection(geojson)
      // Zoom in to layer 
      map.value.getSource("polygons").setData(feat);
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

const readJson = (event) => {
  console.log('Reading Josn file....', event)
  let str = event.target.result

  try {
    let json = JSON.parse(str)
    console.log(json)
    settlementPoly.value = json  // Display on map

    // Zoom in to layer 
    map.value.getSource("polygons").setData(settlementPoly.value);
    bounds.value = turf.bbox((settlementPoly.value))
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
const geoSource = ref(false)

const AddSettlement = () => {
  console.log('Adding settlement')
  push({
    path: '/settlement/add',
    name: 'AddSettlement'
  })
}

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
const map = ref()

onMounted(() => {
  console.log('Loaded.......')
  loadMap()
})



const updatePoly = (e) => {
  console.log("Poly", e)
  settlementPoly.value = e

  var feat = turf.featureCollection(settlementPoly.value.features)
  uploadPolygon(feat)

}

const deletePoly = (e) => {
  console.log("Poly", e)
  settlementPoly.value = []
}


// Load map
const loadMap = () => {
  mapboxgl.accessToken = 'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw';
  map.value = new mapboxgl.Map({
    container: 'mapContainer',
    // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [37.137343, 0.737451], // starting position
    zoom: 5
  });

  const nav = new mapboxgl.NavigationControl();
  map.value.addControl(nav, "top-left");

  map.value.on('load', () => {


    if (settlementPoly.value) {

      map.value.addSource('polygons', {
        type: 'geojson',
        //data: settlementPoly.value
        data: turf.featureCollection(settlementPoly.value),
      });
      map.value.addLayer({
        'id': 'polygons-layer',
        "type": "fill",
        'source': 'polygons',
        'paint': {
          'fill-color': '#0080ff', // blue color fill
          'fill-opacity': 0.2
        }

      });
    }


    bounds.value = turf.bbox((settlementPoly.value));
    map.value.fitBounds(bounds.value, { padding: 20 });


  });

  const draw = new MapboxDraw({
    displayControlsDefault: false,
    // Select which mapbox-gl-draw control buttons to add to the map.
    controls: {
      polygon: true,
      line_string: true,
      uncombine_features: false,
      point: true,
      trash: false
    },
    // Set mapbox-gl-draw to draw by default.
    // The user does not have to click the polygon control button first.
    defaultMode: 'draw_polygon'
  });
  map.value.addControl(draw);
  map.value.addControl(new MapboxLayerSwitcherControl());


  map.value.on('draw.create', updatePoly);
  map.value.on('draw.delete', deletePoly);
  map.value.on('draw.update', updatePoly);

  map.value.resize()



  //--- 
}


</script>

<template>
  <ContentWrap :title="toTitleCase(title)">

    <el-row :gutter="10">
      <el-col :xl="12" :lg="12" :md="12" :sm="12" :xs="24">
        <el-card>
          <el-steps :active="active">
            <el-step title="Details" :icon="Edit" />
            <el-step title="Location" :icon="Location" />
            <el-step title="Documentation" :icon="Upload" />
          </el-steps>
          <el-divider />
          <el-form label-position="left" ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="100px"
            status-icon>
            <el-col v-if="showForm" :span="24" :lg="24" :md="12" :sm="12" :xs="24">
              <el-form-item label="Name" prop="name">
                <el-input v-model="ruleForm.name" />
              </el-form-item>
              <el-form-item label="County" prop="county_id">
                <el-select v-model="ruleForm.county_id" filterable placeholder="Select County">
                  <el-option v-for="item in parentOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
                <el-button type="succcess" @click="AddSettlement()" :icon="Plus" />
              </el-form-item>
              <el-form-item label="Type" prop="settlement_type">
                <el-select v-model="ruleForm.settlement_type" placeholder="Type">
                  <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="Population">
                <el-input-number v-model="ruleForm.population" />
              </el-form-item>
              <el-form-item label="Area(Ha.)">
                <el-input-number :precision="2" v-model="ruleForm.area" />
              </el-form-item>
              <el-form-item label="Description" prop="description">
                <el-input v-model="ruleForm.description" type="textarea" />
              </el-form-item>
            </el-col>

            <el-form-item v-if="showGeoFields" label="Location">
              <el-switch width="200px" v-model="geoSource"
                style="--el-switch-on-color: orange; --el-switch-off-color: purple" class="mb-2"
                active-text="Upload Geojson File" inactive-text="Draw on Map" />
            </el-form-item>

            <el-upload v-if="showGeoFields && geoSource" class="upload-demo" drag ref="uploadRef" :auto-upload="false"
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

            <el-upload v-if="showUploadDocuments" v-model:file-list="fileList" class="upload-demo" multiple
              :auto-upload="false" action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
              :on-change="handleUploadDocuments">
              <el-button type="primary">Click to upload documentation</el-button>
              <template #tip>
                <div class="el-upload__tip">
                  pdf/xlsx/jpg/png files with a size less than 500kb
                </div>
              </template>
            </el-upload>


          </el-form>

          <el-divider />
          <el-button-group>
            <el-button type="primary" :icon="ArrowRight" @click="next">Next Step</el-button>
            <el-button v-if="showUploadDocuments" @click="submitForm(ruleFormRef)" type="success"
              :icon="Promotion">Submit</el-button>
            <el-button v-if="showUploadDocuments" @click="submitForm(ruleFormRef)" type="warning"
              :icon="RefreshLeft">Reset</el-button>
          </el-button-group>
        </el-card>
      </el-col>

      <el-col :xl="12" :lg="12" :md="12" :sm="12" :xs="24">
        <el-card>
          <!-- <mapbox-map :center="[37.817, 0.606]" :zoom="5" :height="mapHeight" :accessToken="MapBoxToken"
            mapStyle="mapbox://styles/mapbox/light-v10">
            <mapbox-geocoder-control :countries="countries" />
            <mapbox-geolocate-control />
            <mapbox-draw-control v-if="geoSource === false" @create="uploadPolygon" />
            <mapbox-navigation-control position="bottom-right" />
          </mapbox-map> -->

          <div id="mapContainer" class="basemap"></div>



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
</style>