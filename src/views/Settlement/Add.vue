<script setup lang="ts">
import { Form, FormExpose } from '@/components/Form'
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { reactive, unref, ref } from 'vue'
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
  ElInputNumber,
  ElRadio,
  ElRadioGroup,
  FormRules
} from 'element-plus'

import {
  MapboxMap,
  MapboxGeocoderControl,
  MapboxAttributionControl,
  MapboxDrawControl,
  MapboxGeolocateControl,
  MapboxGeogeometryPolygon,
  MapboxNavigationControl,
  MapboxSourceGeoJson,
  MapboxScaleControl,
  MapboxMarker
} from 'vue-mapbox-ts'




import { getCountyListApi } from '@/api/counties'

import { CreateRecord } from '@/api/settlements'

import type { FormInstance } from 'element-plus'
import { uuid } from 'vue-uuid'

const countiesOptions = ref([])
const loading = ref(true)

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  name: '',
  county_id: '',
  settlement_type: '',
  geom: '',
  area: '',
  population: '',
  code: '',
  isApproved: '',
  description: ''
})

//id","name","county_id","settlement_type","geom","area","population","code","description"

const getCountyNames = async () => {
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
      var countyOpt = {}
      countyOpt.value = arrayItem.id
      countyOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      countiesOptions.value.push(countyOpt)
    })
  })
}
getCountyNames()

console.log('-->County options', countiesOptions.value)
const polygons = ref([]) as Ref<[number, number][][]>
const shp = []
const rules = reactive<FormRules>({
  name: [
    { required: true, message: 'Please provide settlement name', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }
  ],
  county_id: [{ required: true, message: 'Please select a county', trigger: 'blur' }],
  population: [
    { required: true, message: 'Population is required', trigger: 'blur' },
    { min: 500, message: 'Population should be atleast 500', trigger: 'blur' }
  ],
  area: [{ required: true, message: 'The settlement area is required', trigger: 'blur' }],
  settlement_type: [
    { required: true, message: 'The settlement settlement_type is required', trigger: 'blur' }
  ],
  description: [
    { required: true, message: 'The settlement description is required', trigger: 'blur' }
  ]
})

const countries = 'ke'
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
  }
]

const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      ruleForm.model = 'settlement'
      ruleForm.code = uuid.v4()
      ruleForm.isApproved = ''
      delete shp[0].target
      delete shp[0].type

      // ST_GEojson only accepts teh geometry part alone.
      var poly = {
        type: 'Polygon',
        coordinates: []
      }

      poly.coordinates = shp[0].features[0].geometry.coordinates


          // do something with the new marker feature
    var crs = { type: 'name', properties: { name: 'EPSG:4326' } }
    poly.geometry.crs = crs
 


      ruleForm.geom = poly
      const res = CreateRecord(ruleForm)
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

const title = 'Add Settlement'
const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'

const mapHeight = '450px'

</script>

<template>
  <ContentWrap :title="title">
    <el-row :gutter="20">
      <el-col :span="10">
        <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px" class="demo-ruleForm" status-icon>
          <el-form-item label="Name" prop="name">
            <el-input v-model="ruleForm.name" />
          </el-form-item>
          <el-form-item label="County" prop="county_id">
            <el-select v-model="ruleForm.county_id" filterable placeholder="County">
              <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>

          <el-form-item label="Type" prop="settlement_type">
            <el-select v-model="ruleForm.settlement_type" placeholder="Settlement/Location">
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
          <el-form-item label="Geometry" prop="geom_options">
            <el-radio-group v-model="ruleForm.geom_options">
              <el-radio label="Draw from Map" />
              <el-radio label="Upload Geojson" />
            </el-radio-group>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="submitForm(ruleFormRef)">Create</el-button>
            <el-button type="warning" @click="resetForm(ruleFormRef)">Reset</el-button>
          </el-form-item>
        </el-form>
      </el-col>

      <el-col :span="14">
        <el-card class="box-card">
          <mapbox-map
:center="[37.817, 0.606]" :zoom="5" :height="mapHeight" :accessToken="MapBoxToken"
            mapStyle="mapbox://styles/agspatial/clamkcjwx000b14mmgzyx86vv">
            <mapbox-geocoder-control :countries="countries" />
            <mapbox-geolocate-control />
            <mapbox-draw-control @create="addPolygon" />
            <mapbox-navigation-control position="bottom-right" />
          </mapbox-map>
        </el-card>
      </el-col>
    </el-row>
  </ContentWrap>
</template>
