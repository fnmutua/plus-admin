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



const model = 'road_asset'
const parentOptions = ref([])
const loading = ref(true)

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  road_id: '',
  asset_type: '',
  asset_condition: '',
  geom: '',
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



const AssetTypeOptions = [
  {
    value: '100',
    label: 'Footpath'
  },
  {
    value: '200',
    label: 'Cycling Lane'
  }, {
    value: '300',
    label: 'Streetlights'
  }, {
    value: '400',
    label: 'Culvert'
  }, {
    value: '500',
    label: 'Bridge'
  },
  {
    value: '600',
    label: 'Drift'
  },
  {
    value: '700',
    label: 'Parking'
  },

]

const AssetConditionOptions = [
  {
    value: '100',
    label: 'Excellent'
  },
  {
    value: '200',
    label: 'Good'
  },
  {
    value: '300',
    label: 'Fair'
  },
  {
    value: '400',
    label: 'Poor'
  },
  {
    value: '500',
    label: 'Very Poor'
  },
  {
    value: '600',
    label: 'Under Construction'
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
      //  delete shp[0].type

      console.log(shp[0].features[0].geometry.type)

      // ST_GEojson only accepts teh geometry part alone.
      var poly = {
        type: shp[0].features[0].geometry.type,
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
          <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px" class="demo-ruleForm"
            status-icon>

            <el-row :gutter="20">
              <el-divider content-position="left" />

              <el-col :span="24" :lg="24" :md="12" :sm="12" :xs="24">

                <el-form-item label="Settlement" prop="road_id">
                  <el-select v-model="ruleForm.road_id" filterable placeholder="Road">
                    <el-option v-for="item in parentOptions" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                </el-form-item>
                <el-form-item label="Type" prop="asset_type">
                  <el-select v-model="ruleForm.asset_type" filterable placeholder="Select">
                    <el-option v-for="item in AssetTypeOptions" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                </el-form-item>
                <el-form-item label="Condition" prop="asset_condition">
                  <el-select v-model="ruleForm.asset_condition" filterable placeholder="Select">
                    <el-option v-for="item in AssetConditionOptions" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
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
