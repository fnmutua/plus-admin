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

const loading = ref(true)

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
const settlementOptions = ref([])

const settlementfilteredOptions = ref([])

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

    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var parentOpt = {}
      parentOpt.value = arrayItem.id
      parentOpt.county_id = arrayItem.county_id
      parentOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      settlementOptions.value.push(parentOpt)
    })
  })
}
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


const subcountyOptions = ref([])
const subcountyfilteredOptions = ref([])
const subcounties = ref([])
const getSubCounties = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'subcounty',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    //console.log('Received response:', response)
    //tableDataList.value = response.data
    var ret = response.data
    subcounties.value = ret
    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var parentOpt = {}
      parentOpt.value = arrayItem.id
      parentOpt.county_id = arrayItem.county_id
      parentOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      subcountyOptions.value.push(parentOpt)
    })
  })
}

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
  for (let i = 0; i < settlementOptions.value.length; i++) {
    if (settlementOptions.value[i].county_id == county_id) {
      subset_settlements.push(settlementOptions.value[i]);
    }
  }
  console.log("Subset Setts", subset_settlements)
  settlementfilteredOptions.value = subset_settlements


  // Get the select subcoites GEO
}



getSettlements()
getCounties()
getSubCounties()

console.log('--> parent options', settlementOptions.value)
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

const countries = 'ke'
const regOptions = [
  {
    value: 'Registered',
    label: 'Registered'
  },
  {
    value: 'Not Registered',
    label: 'Not Registered'
  }
]


const ftypeOtions = [
  {
    value: 'Medical Clinic',
    label: 'Medical Clinic'
  },
  {
    value: 'Medical Center',
    label: 'Medical Center'
  },
  {
    value: 'Nursing and Maternity Home',
    label: 'Nursing and Maternity Home'
  },

  {
    value: 'Basic Health Centre',
    label: 'Basic Health Centre'
  },


  {
    value: 'Primary care hospitals',
    label: 'Primary care hospitals'
  },


  {
    value: 'Dispensary',
    label: 'Dispensary'
  },

  {
    value: 'VCT',
    label: 'VCT'
  },

  {
    value: 'Comprehensive health Centre',
    label: 'Comprehensive health Centre'
  },
]


const LevelOptions = [
  {
    value: 'Level 1',
    label: 'Level 1'
  },

  {
    value: 'Level 2',
    label: 'Level 2'
  },
  {
    value: 'Level 3',
    label: 'Level 3'
  },
  {
    value: 'Level 4',
    label: 'Level 4'
  }
]

const ownsershipOptions = [
  {
    value: 'Private Practice',
    label: 'Private Practice'
  },
  {
    value: 'Ministry of Health',
    label: 'Ministry of Health'
  },
  {
    value: 'Faith Based Organization',
    label: 'Faith Based Organization'
  },
  {
    value: 'Non - Governmental Organizations',
    label: 'Non - Governmental Organizations'
  }
]






const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      ruleForm.model = 'health_facility'
      ruleForm.code = uuid.v4()
      delete shp[0].target
      delete shp[0].type

      // ST_GEojson only accepts teh geometry part alone.
      var poly = {
        type: 'Point',
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

const title = 'Add/Create Health Care Facility'
const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'

const mapHeight = '450px'



</script>

<template>
  <ContentWrap :title="title">
    <el-row :gutter="20">
      <el-col :xl="12" :lg="12" :md="12" :sm="12" :xs="24">
        <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px" class="demo-ruleForm" status-icon>
          <el-form-item label="Name" prop="name">
            <el-input v-model="ruleForm.name" />
          </el-form-item>
          <el-form-item label="Facility No." prop="facility_number">
            <el-input v-model="ruleForm.facility_number" />
          </el-form-item>

          <el-row>
            <el-col :xl="12" :lg="12" :md="12" :sm="12" :xs="24">
              <el-form-item label="County" prop="county_id">
                <el-select v-model="ruleForm.county_id" filterable placeholder="County" :onChange="handleSelectCounty">
                  <el-option v-for="item in countyOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :xl="12" :lg="12" :md="12" :sm="12" :xs="24">
              <el-form-item label="Subcounty" prop="subcounty_id">
                <el-select v-model="ruleForm.subcounty_id" filterable placeholder="Sub County">
                  <el-option v-for="item in subcountyfilteredOptions" :key="item.value" :label="item.label"
                    :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="Settlement" prop="settlement_id">
            <el-select v-model="ruleForm.settlement_id" filterable placeholder="Settlement">
              <el-option v-for="item in settlementfilteredOptions" :key="item.value" :label="item.label"
                :value="item.value" />
            </el-select>
          </el-form-item>

          <el-row>
            <el-col :xl="12" :lg="12" :md="12" :sm="12" :xs="24">

              <el-form-item label="Type" prop="facility_type">
                <el-select v-model="ruleForm.facility_type" placeholder="Facility Type">
                  <el-option v-for="item in ftypeOtions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xl="12" :lg="12" :md="12" :sm="12" :xs="24">

              <el-form-item label="Level" prop="level">
                <el-select v-model="ruleForm.level" placeholder="Facility Level">
                  <el-option v-for="item in LevelOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="Registration" prop="reg_status">
            <el-select v-model="ruleForm.reg_status" placeholder="Registration">
              <el-option v-for="item in regOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>

          <el-form-item label="Ownership" prop="ownership_type">
            <el-select v-model="ruleForm.ownership_type" placeholder="Ownership">
              <el-option v-for="item in ownsershipOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>


          <el-form-item label="Owner" prop="owner">
            <el-input v-model="ruleForm.owner" />
          </el-form-item>

          <el-form-item label="No. Beds">
            <el-input-number v-model="ruleForm.number_beds" />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="submitForm(ruleFormRef)">Create</el-button>
            <el-button type="warning" @click="resetForm(ruleFormRef)">Reset</el-button>
          </el-form-item>
        </el-form>
      </el-col>

      <el-col :xl="12" :lg="12" :md="12" :sm="12" :xs="24">
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
