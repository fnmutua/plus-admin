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
  geom: '',
})

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
getParentNames()

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
const RdClassOptions = [
  {
    value: 'A',
    label: 'Class A'
  },
  {
    value: 'B',
    label: 'Class B'
  }, {
    value: 'C',
    label: 'Class C'
  }, {
    value: 'D',
    label: 'Class d'
  }, {
    value: 'county',
    label: 'County Road'
  },
  {
    value: 'unknown',
    label: 'Unclassified'
  },
]

const SurfaceTypeOtions = [
  {
    value: '100',
    label: 'Asphalt'
  },
  {
    value: '200',
    label: ' Surface Dressing'
  },
  {
    value: '300',
    label: 'Gravel'
  },
  {
    value: '400',
    label: 'Earth'
  },
  {
    value: '500',
    label: 'Cabro'
  },
  {
    value: '600',
    label: 'Track'
  },
]

const drainageTypeOtions = [
  {
    value: '100',
    label: 'Left Side'
  },
  {
    value: '200',
    label: 'Right Side'
  },
  {
    value: '300',
    label: 'Both Sides'
  },
  {
    value: '400',
    label: 'None'
  },

]








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
  await formEl.validate((valid, fields) => {
    if (valid) {
      ruleForm.model = model
      ruleForm.code = uuid.v4()
      delete shp[0].target
      delete shp[0].type

      // ST_GEojson only accepts teh geometry part alone.
      var poly = {
        type: 'Linestring',
        coordinates: []
      }

      poly.coordinates = shp[0].features[0].geometry.coordinates

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

const title = 'Add/Create ' + model + ' Facility'
const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'

const mapHeight = '450px'

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

          <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px" class="demo-ruleForm"
            status-icon>

            <el-row v-if="active === 0" :gutter="20">
              <el-divider content-position="left" />

              <el-col :span="24" :lg="24" :md="12" :sm="12" :xs="24">
                <el-form-item label="Road Name" prop="name">
                  <el-input v-model="ruleForm.name" />
                </el-form-item>
                <el-form-item label="Settlement" prop="settlement_id">
                  <el-select v-model="ruleForm.settlement_id" filterable placeholder="Settlement">
                    <el-option v-for="item in parentOptions" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                </el-form-item>
                <el-form-item label="Road Class" prop="rdClass">
                  <el-select v-model="ruleForm.rdClass" filterable placeholder="A,B,C..">
                    <el-option v-for="item in RdClassOptions" :key="item.value" :label="item.label"
                      :value="item.value" />
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
                    <el-option v-for="item in SurfaceTypeOtions" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                </el-form-item>

                <el-form-item label="Condition" prop="mhm">
                  <el-rate v-model="ruleForm.surfaceCondition" :colors="colors" show-text
                    :texts="['Under Construction', 'Very Poor', 'Poor', 'good', 'Excellent']" />
                </el-form-item>

                <el-form-item label="Drainage Type" prop="mhm">
                  <el-select v-model="ruleForm.drainage" filterable placeholder="drainage">
                    <el-option v-for="item in drainageTypeOtions" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                </el-form-item>


                <el-form-item label="Condition" prop="mhm">
                  <el-rate v-model="ruleForm.drainageCondition" :colors="colors" show-text
                    :texts="['Under Construction', 'Very Poor', 'Poor', 'good', 'Excellent']" />
                </el-form-item>





              </el-col>
            </el-row>








          </el-form>


          <el-row class="mb-4  md-5">
            <el-button @click="next" type="primary"> Next Page<el-icon class="el-icon--right">
                <ArrowRight />
              </el-icon>
            </el-button>
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

      <el-col :span="14" :lg="14" :md="12" :sm="12" :xs="24">
        <el-card class="box-card">
          <mapbox-map :center="[37.817, 0.606]" :zoom="5" :height="mapHeight" :accessToken="MapBoxToken"
            mapStyle="mapbox://styles/mapbox/light-v10">
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
