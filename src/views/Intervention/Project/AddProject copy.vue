<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { reactive, ref } from 'vue'
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
  ElSwitch
} from 'element-plus'


import { Edit, Plus, Location, Upload, ArrowRight, Promotion, RefreshLeft } from '@element-plus/icons-vue'


import { getCountyListApi } from '@/api/counties'

import { CreateRecord, getSettlementListByCounty, uploadDocuments } from '@/api/settlements'

import type { FormInstance } from 'element-plus'
import { uuid } from 'vue-uuid'
import type { UploadProps, UploadUserFile } from 'element-plus'

import type { UploadInstance } from 'element-plus'
import { useRouter } from 'vue-router'

//import  shapefile   from 'shapefile';
import * as turf from '@turf/turf'


import '@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css';

import MapboxDraw from "@mapbox/mapbox-gl-draw";

import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'
import { onMounted } from 'vue'

import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";



import readShapefileAndConvertToGeoJSON from '@/utils/readShapefile'
import { useRoute } from 'vue-router'


const uploadRef = ref<UploadInstance>()
const { push } = useRouter()

const fileList = ref([])

const model = 'project'
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
var bounds = ref()
const map = ref()
///----------------------------------------------------------------------------------
const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  settlement_id: '',
  title: '',
  type: '',
  programme_id: '',
  component_id: '',
  domain_id: '',
  status: '',
  period: null,
  cost: 0,
  male_beneficiaries: 0,
  female_beneficiaries: 0,
  description: '',
  geom: '',
  code: ''
})
///------------------------------------Get route source-----------------------------------
const route = useRoute()




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
      trash: true
    },
    // Set mapbox-gl-draw to draw by default.
    // The user does not have to click the polygon control button first.
    defaultMode: 'draw_polygon'
  });
  map.value.addControl(draw);


  map.value.on('draw.create', updatePoly);
  map.value.on('draw.delete', deletePoly);
  map.value.on('draw.update', updatePoly);

  map.value.resize()



  //--- 
}
onMounted(() => {
  console.log('Loaded.......')
  const routePath = route.path;
  const lastPath = routePath.substring(routePath.lastIndexOf('/') + 1);
  console.log(routePath);

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


const fileUploadList = ref<UploadUserFile[]>([])



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

const componentOptions = ref([])
const componentOptionsfiltered = ref([])

const getComponentOptions = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'component',
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
      countyOpt.programme_id = arrayItem.programme_id

      //  console.log(countyOpt)
      componentOptions.value.push(countyOpt)
    })
    componentOptionsfiltered.value = componentOptions.value
  })
}

//id","name","county_id","settlement_type","geom","area","population","code","description"
const getParentNames = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'settlement',
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

const domainProgrammeOptions = ref([])
const getComponentsProgrameDomains = async () => {
  const formData = {}
  formData.limit = 100
  formData.page = 1
  formData.curUser = 1 // Id for logged in user
  formData.model = 'domain'
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  formData.associated_multiple_models = ['component']

  //-------------------------
  //console.log(formData)
  await getSettlementListByCounty(formData).then((response: { data: any }) => {
    //console.log('Domains:', response)
    //tableDataList.value = response.data
    var ret = response.data

    loading.value = false

    ret.forEach(function (arrayItem: { id: string; title: string }) {
      let domain = {}
      domain.value = arrayItem.id
      domain.label = arrayItem.title
      domain.children = []


      var comps = arrayItem.components
      //console.log('copns........', comps)
      comps.forEach(function (comp: { id: string; title: string }) {
        var compx = {}
        compx.value = comp.id
        compx.label = comp.title
        //console.log(compx)
        domain.children.push(compx)
        //   console.log('compns', compx)
      })
      // console.log(domain)

      if (domain.children.length > 0) {
        console.log("----->", domain)
        domainProgrammeOptions.value.push(domain)
      }

      //domainProgrammeOptions.value.push(domain)
    })
  })

  console.log('Domain >>>>', domainProgrammeOptions)

}

getParentNames()
getProgrammeOptions()

getComponentOptions()
getComponentsProgrameDomains()

console.log('--> parent options', parentOptions.value)
const coordinates = ref([])
const geoJson = ref({})
const polygons = ref([]) as Ref<[number, number][][]>

const shp = []
const rules = reactive<FormRules>({
  settlement_id: [{ required: true, message: 'Please select a Settlement', trigger: 'blur' }],
  type: [{ required: true, message: 'Type is required', trigger: 'blur' }],
  title: [{ required: true, message: 'Title is required', trigger: 'blur' }],
  programme_id: [{ required: true, message: 'Programme is required', trigger: 'blur' }],
  domain_id: [{ required: true, message: 'Domain is required', trigger: 'blur' }],
  period: [{ required: true, message: 'Period is required', trigger: 'blur' }],
  status: [{ required: true, message: 'Status is required', trigger: 'blur' }],



})

const countries = 'ke'





const cascadeOptions = [
  {
    value: 'road',
    label: 'Roads and Infrastructure',
    children: [
      {
        value: 'new_road',
        label: 'New Road',
      },
      {
        value: 'upgrade_bitumen',
        label: 'Road Upgrade',
      },
      {
        value: 'storm_water',
        label: 'Storm Water Drainage',
      },
    ],
  },

  {
    value: 'nmt',
    label: 'Non-Motorized Transport',
    children: [
      {
        value: 'bicycle',
        label: 'Bicycle Paths',
      },
      {
        value: 'pedestrian',
        label: 'Pedestrian Walkways',
      },

    ],
  },

  {
    value: 'electric',
    label: 'Electricity',
    children: [
      {
        value: 'street_light',
        label: 'Street Lights',
      },
      {
        value: 'security_lighting',
        label: 'Security Lights',
      },
    ],
  },
  {
    value: 'security',
    label: 'Security and Safety',
    children: [

      {
        value: 'police_stn',
        label: 'Police Station',
      },
      {
        value: 'police_post',
        label: 'Police Post',
      },
      {
        value: 'chiefs_camp',
        label: 'Chiefs Camp',
      },
      {
        value: 'crime_spot',
        label: 'Crime Hotspot',
      }

    ],
  },


  {
    value: 'waste',
    label: 'Waste Management',
    children: [
      {
        value: 'waste_collection_point',
        label: 'Waste Collection Points',
      },
      {
        value: 'waste_sorting_point',
        label: 'Waste Sorting Points',
      },
      {
        value: 'treatment_center',
        label: 'Treatment/Recycling centre',
      },

      {
        value: 'other_waste_mgmt',
        label: 'Others e.g Biodigesters',
      },
    ],
  },

  {
    value: 'Sanitation_hygiene',
    label: 'Sanitation and Hygiene',
    children: [

      {
        value: 'toilet',
        label: 'Toilet',
      },
      {
        value: 'shower',
        label: 'Showers',
      },
      {
        value: 'handwashing',
        label: 'HandWashing',
      },
      {
        value: 'other',
        label: 'Other',
      }
    ],
  },


  {
    value: 'utility',
    label: 'Public utilities',
    children: [
      {
        value: 'playground',
        label: 'Playground',
      },

      {
        value: 'community_centre',
        label: 'Community Centre',
      },
      {
        value: 'day_care_Centre',
        label: 'Day Care Centre',
      },
      {
        value: 'youth_center',
        label: 'Youth Centres',
      },
      {
        value: 'open_space',
        label: 'Open Spaces and Parks',
      },
      {
        value: 'vending_platforms',
        label: 'Vending Platform (Vibanda)',
      }
    ],
  },
  {
    value: 'social',
    label: 'Social Projects/Activities',
    children: [
      {
        value: 'social_housing',
        label: 'Social Housing',
      },
      {
        value: 'coming_soon',
        label: 'coming Soon',
      },

    ],
  },

]




const status_options = [
  {
    value: 'planned',
    label: 'Planned',
  },
  {
    value: 'ongoing',
    label: 'Ongoing',
  },
  {
    value: 'completed',
    label: 'Completed',
  }

]




// uploading the documents 


const handleUploadDocuments: UploadProps['onChange'] = async (uploadFile, uploadFiles) => {



  console.log(fileList)
}





function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}


const handleChangeDomain = (selected) => {

  ruleForm.domain_id = selected[0]
  ruleForm.component_id = selected[1]

  // console.log(selected)

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
      ruleForm.geom = geoJson.value

      console.log("Shp----->", geoJson.value)
      const report = await CreateRecord(ruleForm)



      const fileTypes = []
      const filesFormData = new FormData()
      for (var i = 0; i < fileList.value.length; i++) {
        console.log('------>file', fileList.value[i])
        var format = fileList.value[i].name.split('.').pop() // get file extension
        fileTypes.push(format)

        filesFormData.append('file', fileList.value[i].raw)
        filesFormData.append('DocType', format)

      }
      filesFormData.append('parent_code', report.data.id)
      filesFormData.append('model', model)
      filesFormData.append('grp', 'Project Documentation')
      filesFormData.append('code', uuid.v4())
      filesFormData.append('column', 'project_id')

      console.log('Upload starting ')
      // await uploadDocuments(formData)
      await uploadDocuments(filesFormData)

      console.log('uploading complete')

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


const title = 'Add/Create  Project'
const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'

const mapHeight = '500px'

const active = ref(0)
const showForm = ref(true)
const showGeoFields = ref(false)
const showUploadDocuments = ref(false)

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
  var rfile = uploadFile.raw
  var fileType = uploadFile.name.split('.').pop()

  let reader = new FileReader()
  console.log(reader)

  //var mydata = JSON.parse(uploadFile);


  if (fileType === 'geojson') {
    reader.onload = readJson
    reader.readAsText(rfile)
  }
  else {
    readShp(rfile)

    // reader.readAsArrayBuffer(rfile)
  }

}

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



const handleChangeProgramme = async (programme_id: any) => {
  console.log(programme_id)
  console.log(componentOptions)

  componentOptionsfiltered.value = componentOptions.value.filter(x => x.programme_id == programme_id);

  // console.log(componentOptionsfiltered)
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
              <el-form-item label="Location" prop="settlement_id">
                <el-select v-model="ruleForm.settlement_id" filterable placeholder="Select Location">
                  <el-option v-for="item in parentOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
                <el-button type="succcess" @click="AddSettlement()" :icon="Plus" />
              </el-form-item>
              <el-form-item label="Type" prop="type">
                <el-cascader v-model="tmpSel" :options="cascadeOptions" :show-all-levels="false" @change="handleChange" />
              </el-form-item>
              <el-form-item label="Title" prop="title">
                <el-input v-model="ruleForm.title" />
              </el-form-item>
              <el-row v-if="showForm">

                <el-col :span="12" :lg="12" :md="12" :sm="12" :xs="24">
                  <el-form-item label="Programme" prop="programme_id">
                    <!-- <el-select v-model="ruleForm.programme_id" filterable placeholder="Select" :onChange="handleChangeProgramme"> -->
                    <el-select v-model="ruleForm.programme_id" filterable placeholder="Select">
                      <el-option v-for="item in programmeOptions" :key="item.value" :label="item.label"
                        :value="item.value" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12" :lg="12" :md="12" :sm="12" :xs="24">
                  <el-form-item label="Domain" prop="domain_id">
                    <el-cascader v-model="tmpSel" :options="domainProgrammeOptions" :show-all-levels="false"
                      @change="handleChangeDomain" />
                  </el-form-item>
                </el-col>

              </el-row>

              <el-form-item label="Period" prop="period">
                <el-date-picker v-model="ruleForm.period" type="monthrange" range-separator="To"
                  start-placeholder="Start date" end-placeholder="End date" />
              </el-form-item>
              <el-row>
                <el-form-item label="Status" prop="status">
                  <el-select v-model="ruleForm.status" filterable placeholder="Select">
                    <el-option v-for="item in status_options" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
                <el-form-item label="Cost (USD)" prop="cost">
                  <el-input-number v-model="ruleForm.cost" />
                </el-form-item>
              </el-row>
            </el-col>


            <el-row v-if="showForm">
              <el-col :span="12" :lg="12" :md="12" :sm="12" :xs="24">
                <el-form-item label="Beneficiary(#M)" prop="male_beneficiaries">
                  <el-input-number v-model="ruleForm.male_beneficiaries" />
                </el-form-item>
              </el-col>
              <el-col :span="12" :lg="12" :md="12" :sm="12" :xs="24">
                <el-form-item label="Beneficiary(#F)" prop="female_beneficiaries">
                  <el-input-number v-model="ruleForm.female_beneficiaries" />
                </el-form-item>
              </el-col>

            </el-row>
            <el-row v-if="showForm">
              <el-col :span="24" :lg="24" :md="12" :sm="12" :xs="24">

                <el-form-item label="Description" prop="description">
                  <el-input type="textarea" v-model="ruleForm.description" />
                </el-form-item>
              </el-col>

            </el-row>



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