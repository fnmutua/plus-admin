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
  ElTag,
  ElCheckTag,
  ElButtonGroup,
  ElSwitch
} from 'element-plus'


import { Edit, Plus, Location, Upload, ArrowDown, ArrowLeft, ArrowRight, Promotion, RefreshLeft, List } from '@element-plus/icons-vue'


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
import { rule } from 'postcss'
import { geojsonType } from '@turf/turf'


const uploadRef = ref<UploadInstance>()
const { push } = useRouter()
const projectPoly = ref([])
const projectScopeGeo = ref([])

const fileList = ref([])

const model = 'project'
const parentOptions = ref([])
const loading = ref(true)
const tmpSel = ref([])
const tmp_domain = ref([])

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

///------------------------------------Get route source-----------------------------------
const route = useRoute()
const component_id = ref()

///----------------------------------------------------------------------------------
const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  location_level: null,
  settlement_id: null,
  county_id: null,
  title: '',
  type: '',
  component_id: component_id.value,
  status: '',
  start_date: '',
  end_date: '',
  cost: 0,
  male_beneficiaries: 0,
  female_beneficiaries: 0,
  description: '',
  activities: '',
  geom: '',
  code: ''
})


const locationOptions = [
  {
    label: "National",
    value: 1
  },
  {
    label: "County",
    value: 2
  },
  {
    label: "Settlement",
    value: 3
  },

  {
    label: "Other",
    value: 4
  },
]

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

    if (projectPoly.value) {

      map.value.addSource('polygons', {
        type: 'geojson',
        //data: projectPoly.value
        data: turf.featureCollection(projectPoly.value),
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
    bounds.value = turf.bbox((projectPoly.value));
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
  component_id.value = route.params.domain
  console.log('component_id', component_id)
  //******** Domains  */

  // id	domain	Group	Group_id
  // 11	Environmental Waste Management	Environment	1
  // 6	Social Infrastructure	Infrastructure	2
  // 7	Physical Infrastructure	Infrastructure	2
  // 10	Shelter Improvement	Infrastructure	2
  // 1	Community Organization and Mobilization	Socio-Economic	3
  // 2	Socio-economic and Physical Mapping	Socio-Economic	3
  // 3	Conflict Prevention and Management	Socio-Economic	3
  // 8	Micro-finance and credit systems	Socio-Economic	3
  // 9	Income Generating Activities	Socio-Economic	3
  // 12	Vulnerable and Disadvantaged Groups	Socio-Economic	3
  // 13	HIV/AIDS prevention and impact mitigation	Socio-Economic	3
  // 14	Capacity Building and networking	Socio-Economic	3
  // 4	Urban Development Strategies	Strategy	4
  // 5	Security of tenure	Tenure	5


  console.log('component_id >>>>', component_id);

  ruleForm.component_id = component_id.value

  loadMap()
  getComponentsProgrameDomains()
})



const updatePoly = (e) => {
  console.log("Poly", e)
  projectPoly.value = e

  var feat = turf.featureCollection(projectPoly.value.features)
  uploadPolygon(feat)

}

const deletePoly = (e) => {
  console.log("Poly", e)
  projectPoly.value = []
}



//id","name","county_id","settlement_type","geom","area","population","code","description"
const activityOptions = ref([])
const getActivities = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 10000,
      curUser: 1, // Id for logged in user
      model: 'activity',
      searchField: 'title',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    var ret = response.data

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var opt = {}
      opt.value = arrayItem.id
      opt.label = arrayItem.title + '(' + arrayItem.id + ')'
      console.log(opt)
      activityOptions.value.push(opt)
    })

    console.log(activityOptions)

  })
}

//id","name","county_id","settlement_type","geom","area","population","code","description"
const settlementsRefList = ref()
const getSettlements = async () => {
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
    settlementsRefList.value = ret
    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var parentOpt = {}
      parentOpt.value = arrayItem.id
      parentOpt.county_id = arrayItem.county_id
      parentOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      parentOptions.value.push(parentOpt)
    })
  })
}

//id","name","county_id","settlement_type","geom","area","population","code","description"
const countyOptions = ref([])
const countyRefList = ref()

const getCounties = async () => {
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
    countyRefList.value = ret
    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var county = {}
      county.value = arrayItem.id
      county.label = arrayItem.name + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      countyOptions.value.push(county)
    })
  })
}
const domainProgrammeOptions = ref([])
const getComponentsProgrameDomains = async () => {
  var filters = ['id']    // filter component options by Domain
  var filterValues = [component_id.value]  // Domain ID acquired from the path 


  const formData = {}
  formData.limit = 100
  formData.page = 1
  formData.curUser = 1 // Id for logged in user
  formData.model = 'component'
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------
  formData.filters = filters
  formData.filterValues = filterValues


  formData.associated_multiple_models = []

  //-------------------------
  console.log(formData)
  await getSettlementListByCounty(formData).then((response: { data: any }) => {
    console.log('component:----------->', response)
    //tableDataList.value = response.data
    var ret = response.data

    loading.value = false

    ret.forEach(function (arrayItem: { id: string; title: string }) {
      let domain = {}
      domain.value = arrayItem.id
      domain.label = arrayItem.title
      domain.children = []


      var comps = arrayItem.project_categories
      console.log('copns........', comps)
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

getSettlements()
getCounties()
getActivities()

console.log('--> parent options', parentOptions.value)
const coordinates = ref([])
const geoJson = ref({})
const polygons = ref([]) as Ref<[number, number][][]>

const shp = []
const rules = reactive<FormRules>({
  location_level: [{ required: true, message: 'Please select a location', trigger: 'blur' }],
  county_id: [{ required: true, message: 'Please select a County', trigger: 'blur' }],
  settlement_id: [{ required: true, message: 'Please select a settlement', trigger: 'blur' }],
  type: [{ required: true, message: 'Type is required', trigger: 'blur' }],
  title: [{ required: true, message: 'Title is required', trigger: 'blur' }],
  start_date: [{ required: true, message: 'Start Date is required', trigger: 'blur' }],
  end_date: [{ required: true, message: 'End Date is required', trigger: 'blur' }],
  status: [{ required: true, message: 'Status is required', trigger: 'blur' }],
  category_id: [{ required: true, message: 'Status is required', trigger: 'blur' }],



})





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


const handleChangeComponent = (selected) => {

  ruleForm.component_id = selected[0]
  ruleForm.category_id = selected[1]

  // console.log(selected)

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


const title = 'Create Project'


const active = ref(0)
const showForm = ref(true)
const showGeoFields = ref(false)
const showUploadDocuments = ref(false)
const showActivityList = ref(false)



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
    projectPoly.value = json  // Display on map

    // Zoom in to layer 
    map.value.getSource("polygons").setData(projectPoly.value);
    bounds.value = turf.bbox((projectPoly.value))
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


const showCounty = ref(false)
const showSettlement = ref(false)

const handleSelectLocation = async (location: any) => {
  if (location == 2) {
    // county 
    showCounty.value = true
    showSettlement.value = false
    ruleForm.settlement_id = null
    ruleForm.geom = null
    resetMap()

  }
  else if (location == 3) {
    //settlement 
    showCounty.value = false
    showSettlement.value = true
    ruleForm.county_id = null
    ruleForm.geom = null
    resetMap()

  } else {
    // National 
    showCounty.value = false
    showSettlement.value = false
    ruleForm.geom = null
    resetMap()

  }

}
const resetMap = async () => {
  let center = [37.137343, 0.737451] // starting position
  let zoom = 5
  // set center of map
  map.value.setCenter(center)
  map.value.setZoom(zoom)
  geoJson.value = {}
  map.value.getSource("polygons").setData(geoJson.value);


  console.log("Resetiing Map.......")
}

const handleSelectSettlement = async (settlement_id: any) => {
  console.log('settlement_id', settlement_id)
  console.log(settlementsRefList.value)

  var newArray = settlementsRefList.value.filter(function (sett) {
    return sett.id == settlement_id;
  }
  );
  console.log(newArray[0].geom)

  ruleForm.county_id = newArray[0].county_id

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
    console.log("From settlement", bounds.value)
    map.value.fitBounds(bounds.value, { padding: 20 })

  } else {

    console.log("The settlement has no shapes...")
  }



  // geom: { type: 'Polygon', coordinates: [ [Array] ] },


}

const handleSelectCounty = async (county_id: any) => {
  console.log('County', county_id)
  console.log(countyRefList.value)

  var newArray = countyRefList.value.filter(function (county) {
    return county.id == county_id;
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
    console.log("From county", bounds.value)
    map.value.fitBounds(bounds.value, { padding: 20 })

  } else {

    console.log("The county has no shapes...")
  }



  // geom: { type: 'Polygon', coordinates: [ [Array] ] },


}


//const active = ref(0)

const xnext = () => {
  if (active.value < 1) {
    active.value++
  } else {
    active.value = 0
  }
}


const next = () => {
  console.log('Step:', active)

  //if (active.value++ > 2) active.value = 0

  if (active.value < 2) {
    active.value++
  } else {
    active.value = 0
  }


  if (active.value == 0) {
    showForm.value = true
    showGeoFields.value = false
    showActivityList.value = false
    showUploadDocuments.value = false

  }
  else if (active.value == 1) {
    showForm.value = false
    showGeoFields.value = true
    showActivityList.value = false
    showUploadDocuments.value = false
  }
  else if (active.value == 2) {
    showForm.value = false
    showGeoFields.value = false
    showActivityList.value = true
    showUploadDocuments.value = false
  }



}


const back = () => {
  if (active.value > 0) {
    active.value--
  }
}


</script>

<template>
  <ContentWrap :title="toTitleCase(title)">


    <el-row :gutter="5">
      <el-col :xl="14" :lg="14" :md="24" :sm="24" :xs="24">
        <el-card>
          <el-steps :active="active" simple>
            <el-step :title="active === 0 ? 'Details' : ''" :icon="Edit" :description="active === 0 ? 'Step 1' : ''"
              :status="active === 0 ? 'process' : ''" :style="{ fontSize: '14px' }" />
            <el-step :title="active === 1 ? 'Location' : ''" :icon="Location" :description="active === 1 ? 'Step 2' : ''"
              :status="active === 1 ? 'process' : ''" :style="{ fontSize: '14px' }" />
            <el-step :title="active === 2 ? 'Activities' : ''" :icon="List" :description="active === 2 ? 'Step 3' : ''"
              :status="active === 2 ? 'process' : ''" :style="{ fontSize: '14px' }" />

          </el-steps>
          <el-divider />
          <el-form label-position="left" ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="100px"
            status-icon>
            <el-col v-if="showForm" :span="24" :lg="24" :md="12" :sm="12" :xs="24">
              <el-form-item label="Location" prop="location_level">
                <el-select v-model="ruleForm.location_level" filterable placeholder="Select Location"
                  @change="handleSelectLocation">
                  <el-option v-for="item in locationOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>

              <el-form-item v-if=showSettlement label="Settlement" prop="settlement_id">
                <el-select v-model="ruleForm.settlement_id" filterable placeholder="Select Settlement"
                  @change="handleSelectSettlement">
                  <el-option v-for="item in parentOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
                <el-button type="succcess" @click="AddSettlement()" :icon="Plus" />
              </el-form-item>

              <el-form-item v-if=showCounty label="County" prop="county_id">
                <el-select v-model="ruleForm.county_id" filterable placeholder="Select County"
                  @change="handleSelectCounty">
                  <el-option v-for="item in countyOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="Title" prop="title">
                <el-input v-model="ruleForm.title" />
              </el-form-item>
              <el-row>
                <el-col :span="12" :lg="12" :md="12" :sm="12" :xs="24">

                  <el-form-item label="Start" prop="start_date">
                    <el-date-picker v-model="ruleForm.start_date" type="date" placeholder="Start" />
                  </el-form-item>
                </el-col>
                <el-col :span="12" :lg="12" :md="12" :sm="12" :xs="24">
                  <el-form-item label="End" prop="end_date">
                    <el-date-picker v-model="ruleForm.end_date" type="date" placeholder="End" />
                  </el-form-item>
                </el-col>
              </el-row>

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
            <el-row v-if="showActivityList">
              <el-col :span="24">
                <el-form-item v-if="showActivityList" label="Activities">
                  <el-select v-model="ruleForm.activities" filterable multiple placeholder="Select" style="width: 100%;">
                    <el-option v-for="item in activityOptions" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row v-if="showGeoFields">
              <el-form-item v-if="showGeoFields" label="Location">
                <el-switch width="200px" v-model="geoSource"
                  style="--el-switch-on-color: orange; --el-switch-off-color: purple" class="mb-2"
                  active-text="Upload Geojson File" inactive-text="Draw on Map" />
              </el-form-item>
            </el-row>


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



            <!-- <el-upload v-if="showUploadDocuments" v-model:file-list="fileList" class="upload-demo" multiple
                                      :auto-upload="false" action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
                                      :on-change="handleUploadDocuments">
                                      <el-button type="primary">Click to upload documentation</el-button>
                                      <template #tip>
                                        <div class="el-upload__tip">
                                          pdf/xlsx/jpg/png files with a size less than 500kb
                                        </div>
                                      </template>
                                    </el-upload> -->


          </el-form>
          <div class="flex justify-between">
            <el-button-group class="flex justify-between items-center ">


              <el-button @click="back" type="primary">
                <ArrowLeft /> <el-icon class="el-icon--left" /> Prev Page
              </el-button>

              <el-button @click="next" type="primary"> Next Page<el-icon class="el-icon--right">
                  <ArrowRight />
                </el-icon>
              </el-button>

              <el-button v-if="showUploadDocuments" @click="submitForm(ruleFormRef)" type="success"
                :icon="Promotion">Submit</el-button>
              <el-button v-if="showUploadDocuments" @click="submitForm(ruleFormRef)" type="warning"
                :icon="RefreshLeft">Reset</el-button>
            </el-button-group>
          </div>



        </el-card>
      </el-col>

      <el-col :xl="10" :lg="10" :md="24" :sm="24" :xs="24">
        <el-card>

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