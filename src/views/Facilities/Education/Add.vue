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

const parentOptions = ref([])
const loading = ref(true)

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  name: '',
  settlement_id: '',
  category: '',
  school_number: '',
  reg_status: '',
  level: '',
  owner: '',
  ownership_type: '',
  male_enrollment: '',
  female_enrollment: '',
  number_teachers: '',
  number_other_staff: '',
  number_classrooms: '',
  number_male_toilets: '',
  number_female_toilets: '',
  number_handwashing_stns: '',
  avg_fees_term: '',
  mhm: '',
  parcel_tenure: '',
  tenancy: '',
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

  category: [
    { required: true, message: 'The Facility Type is required', trigger: 'blur' }
  ],

  reg_status: [
    { required: true, message: 'The Registration status is required', trigger: 'blur' }
  ],
  school_number: [
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
  ]




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

const active = ref(0)

const next = () => {
  if (active.value++ > 1) active.value = 0
  console.log(active.value)
}

const LevelOptions = [
  {
    value: '201',
    label: 'Nursery school / ECD'
  },
  {
    value: '202',
    label: ' Primary school'
  }, {
    value: '203',
    label: 'Secondary school'
  },
  {
    value: '204',
    label: 'Village Polytechnique'
  },
  {
    value: '205',
    label: 'Adult Education School'
  },
  {
    value: '206',
    label: 'School for physically challenged '
  },
  {
    value: '207',
    label: 'School for deaf'
  },

  {
    value: '208',
    label: 'School for blind'
  },
  {
    value: '209',
    label: 'School for mentally disabled'
  },
  {
    value: '299',
    label: 'Other'
  }

]

const ownsershipOptions = [
  {
    value: 'Private Practice',
    label: 'Private Practice'
  },
  {
    value: 'Ministry of Education',
    label: 'Ministry of Education'
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
const mhmOptions = [
  {
    value: '100',
    label: 'Free pads'
  },
  {
    value: '200',
    label: 'Disposal bins'
  },
  {
    value: '300',
    label: 'Information, Education and Communication(IEC)'
  }
]


const tenancyOptions = [
  {
    value: '100',
    label: 'Rented'
  },
  {
    value: '200',
    label: 'Owned'
  }
]






const submitForm = async (formEl: FormInstance | undefined) => {

  console.log("submit................", formEl)
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      ruleForm.model = 'education_facility'
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

const title = 'Add/Create Education Facility'
const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'

const mapHeight = '450px'

</script>

<template>
  <ContentWrap :title="title">

    <el-row :gutter="20">
      <el-col :span="10" :lg="10" :md="12" :sm="12" :xs="24">
        <el-card class="box-card">


          <el-steps :active="active" finish-status="success">
            <el-step title="Profile" />
            <el-step title="Enrollment/Staff" />
            <el-step title="Infrastructure" />

          </el-steps>

          <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px" class="demo-ruleForm"
            status-icon>

            <el-row v-if="active === 0" :gutter="20">
              <el-divider content-position="left" />

              <el-col :span="12" :lg="12" :md="12" :sm="12" :xs="24">
                <el-form-item label="Name" prop="name">
                  <el-input v-model="ruleForm.name" />
                </el-form-item>

                <div class="grid-content ep-bg-purple">
                  <el-form-item label="Facility No." prop="facility_number">
                    <el-input v-model="ruleForm.school_number" />
                  </el-form-item>
                  <el-form-item label="Settlement" prop="settlement_id">
                    <el-select v-model="ruleForm.settlement_id" filterable placeholder="Settlement">
                      <el-option v-for="item in parentOptions" :key="item.value" :label="item.label"
                        :value="item.value" />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="Type" prop="category">
                    <el-select v-model="ruleForm.category" placeholder="Type">
                      <el-option v-for="item in ftypeOtions" :key="item.value" :label="item.label"
                        :value="item.value" />
                    </el-select>
                  </el-form-item>


                </div>
              </el-col>
              <el-col :span="12" :lg="12" :md="12" :sm="12" :xs="24">
                <div class="grid-content ep-bg-purple">

                  <el-form-item label="Registration" prop="reg_status">
                    <el-select v-model="ruleForm.reg_status" placeholder="Registration">
                      <el-option v-for="item in regOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="Ownership" prop="ownership_type">
                    <el-select v-model="ruleForm.ownership_type" placeholder="Ownership">
                      <el-option v-for="item in ownsershipOptions" :key="item.value" :label="item.label"
                        :value="item.value" />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="Owner" prop="owner">
                    <el-input v-model="ruleForm.owner" />
                  </el-form-item>

                  <el-form-item label="Level" prop="level">
                    <el-select v-model="ruleForm.level" placeholder="Level">
                      <el-option v-for="item in LevelOptions" :key="item.value" :label="item.label"
                        :value="item.value" />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="Avg. Fees/term">
                    <el-input-number v-model="ruleForm.avg_fees_term" />
                  </el-form-item>


                </div>
              </el-col>

            </el-row>







            <el-row v-if="active === 1" :gutter="20">
              <el-divider content-position="left" />

              <div class="grid-content ep-bg-purple">

                <el-form-item label="Male">
                  <el-input-number v-model="ruleForm.male_enrollment" />
                </el-form-item>

              </div>
              <div class="grid-content ep-bg-purple">
                <el-form-item label="Female">
                  <el-input-number v-model="ruleForm.female_enrollment" />
                </el-form-item>
              </div>
              <div class="grid-content ep-bg-purple">
                <el-form-item label="Teachers">
                  <el-input-number v-model="ruleForm.number_teachers" />
                </el-form-item>
              </div>
              <div class="grid-content ep-bg-purple">
                <el-form-item label="Staff">
                  <el-input-number v-model="ruleForm.number_other_staff" />
                </el-form-item>
              </div>
            </el-row>





            <el-row v-if="active === 2" :gutter="10">
              <el-divider content-position="left" />

              <el-col :span="24" :lg="24" :md="12" :sm="12" :xs="24">
                <el-form-item label="No. Classrooms" prop="number_classrooms">
                  <el-input-number v-model="ruleForm.number_classrooms" />
                </el-form-item>

                <div class="grid-content ep-bg-purple">
                  <el-form-item label="Female toilets" prop="number_female_toilets">
                    <el-input-number v-model="ruleForm.number_female_toilets" />
                  </el-form-item>
                  <el-form-item label="No. Male Toilets" prop="number_male_toilets">
                    <el-input-number v-model="ruleForm.number_male_toilets" />
                  </el-form-item>


                  <el-form-item label="Handwashing Stn.s" prop="number_handwashing_stns">
                    <el-input-number v-model="ruleForm.number_handwashing_stns" />
                  </el-form-item>
                  <el-form-item label="Mens. Hygiene" prop="mhm">
                    <el-select v-model="ruleForm.mhm" filterable placeholder="MHM">
                      <el-option v-for="item in mhmOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="Tenancy" prop="tenancy">
                    <el-select v-model="ruleForm.tenancy" filterable placeholder="Owned/Rented">
                      <el-option v-for="item in tenancyOptions" :key="item.value" :label="item.label"
                        :value="item.value" />
                    </el-select>
                  </el-form-item>


                  <el-form-item label="Parcel Title" prop="tenure">
                    <el-switch v-model="ruleForm.parcel_tenure" class="mb-2" inline-prompt size="large"
                      style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949" active-text="Yes"
                      inactive-text="No" />
                  </el-form-item>


                </div>
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
            />
          </mapbox-map>
        </el-card>
      </el-col>
    </el-row>
  </ContentWrap>
</template>
