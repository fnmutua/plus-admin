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
  ElCascader,
  ElOption,
  ElCard,
  ElCol,
  ElIcon,
  ElRow,
  ElDivider,
  ElDatePicker,
  ElInputNumber,
  FormRules
} from 'element-plus'

import {
  MapboxMap,
  MapboxGeocoderControl,
  MapboxDrawControl,
  MapboxGeolocateControl,
  MapboxNavigationControl,

} from 'vue-mapbox-ts'


import {
  CircleCheckFilled,
  RefreshLeft
} from '@element-plus/icons-vue'

import { getCountyListApi } from '@/api/counties'

import { CreateRecord } from '@/api/settlements'

import type { FormInstance } from 'element-plus'
import { uuid } from 'vue-uuid'



const model = 'other_facility'
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
  type: '',
  condition: '',
  type_waste: '',
  cost_per_use: 0,
  number_stances: 0,
  number_staff: 0,
  number_phases: '',
  size_reserve: 0,
  rating: '',
  number_vehicles: 0,
  height: 0,
  frequency: '',
  date_install: Date.now(),
  ownership_type: '',
  owner: '',
  settlement_id: '',
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
  settlement_id: [{ required: true, message: 'Please select a settlemtn', trigger: 'blur' }],
  type: [{ required: true, message: 'Facility Type is required', trigger: 'blur' }],
  condition: [{ required: true, message: 'Facility condition is required', trigger: 'blur' }],
})

const countries = 'ke'




const FacilityConditionOptions = [
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


const cascadeOptions = [
  {
    value: 'electric',
    label: 'Electricity',
    children: [
      {
        value: 'powerline',
        label: 'Powerline',
      },
      {
        value: 'power_asset',
        label: 'Power Assets',
        children: [
          {
            value: 'primary_substation',
            label: 'Primary Substation',
          },
          {
            value: 'secondary_substation',
            label: ' Secondary substation(transformer) ',
          },
          {
            value: 'floodlight',
            label: 'Floodlights',
          },
        ],
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
      }

    ],
  },
  {
    value: 'waste',
    label: 'Waste Management',
    children: [

      {
        value: 'dumping',
        label: 'Dumping Sites',
        children: [
          {
            value: 'illegal_dumping_site',
            label: 'Illegal',
          },
          {
            value: 'llegal_dumping_site',
            label: 'Legal',
          },
        ]

      },
      {
        value: 'treatment_center',
        label: 'Treatment/Recycling centre',
      },
      {
        value: 'collection_point',
        label: 'Collection point ',
      },
      {
        value: 'waste_mgmt_project',
        label: 'Waste Management Projects',
      },
      {
        value: 'other_waste_mgmt',
        label: 'Others e.g Biodigesters',
      },
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
        value: 'stadium',
        label: 'Stadium',
      },
      {
        value: 'chiefs_camp',
        label: 'Community Hall',
      },
      {
        value: 'open_space',
        label: 'Open space',
      }

    ],
  },


  {
    value: 'environment',
    label: 'Environment',
    children: [
      {
        value: 'river',
        label: 'River',
      },
      {
        value: 'wetland',
        label: 'Swamp/Wetland',
      },
      {
        value: 'forest',
        label: 'Forest',
      },

      {
        value: 'qurry_pit',
        label: 'Quarry / Open Pits',
      },
      {
        value: 'other_environment_areas',
        label: 'Other Environmentally sensitive areas ',
      },
      {
        value: 'hazard',
        label: 'Hazards',
        children: [
          {
            value: 'flooding',
            label: 'Flooding',
          },
          {
            value: 'fire',
            label: 'Fire',
          },
          {
            value: 'landslide',
            label: 'Landslide',
          },

          {
            value: 'other_hazard',
            label: 'Other',
          },




        ]
      },

    ],
  },
]

const phase_options = [{
  value: 'single',
  label: 'Single-Phase',
},
{
  value: '3_phase',
  label: 'Three-Phase',
}]




const frequencyOptions = [{
  value: 'rare',
  label: 'Rare',
},
{
  value: 'often',
  label: 'Often',
},
{
  value: 'very_often',
  label: 'Very Often',
}

]



const ownsershipOptions = [
  {
    value: 'Private',
    label: 'Private'
  },
  {
    value: 'public',
    label: 'Public'
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

const wasteOptions = [
  {
    value: 'Domestic',
    label: 'Domestic'
  },
  {
    value: 'Industrial',
    label: 'Industrial'
  },
  {
    value: 'Medical',
    label: 'Medical'
  },
  {
    value: 'Environmental',
    label: 'Environmental'
  }
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

                <el-form-item label="Settlement" prop="settlement_id">
                  <el-select v-model="ruleForm.settlement_id" filterable placeholder="Select Settlement">
                    <el-option v-for="item in parentOptions" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                </el-form-item>


                <el-form-item label="Type" prop="type">
                  <el-cascader v-model="tmpSel" :options="cascadeOptions" :show-all-levels="false"
                    @change="handleChange" />

                </el-form-item>

                <el-form-item v-if="rating" label="Rating(V)" prop="rating">
                  <el-input v-model="ruleForm.rating" />
                </el-form-item>

                <el-form-item v-if="height" label="Height(m)" prop="height">
                  <el-input-number v-model="ruleForm.height" />
                </el-form-item>

                <el-form-item v-if="height" label="Installation Date" prop="date_install">
                  <el-date-picker v-model="ruleForm.date_install" type="date" placeholder="Select date" :size="small" />
                </el-form-item>

                <el-form-item v-if="stances" label="# of Stances" prop="stances">
                  <el-input-number v-model="ruleForm.number_stances" />
                </el-form-item>

                <el-form-item v-if="cost" label="Cost per use" prop="cost">
                  <el-input-number v-model="ruleForm.cost_per_use" />
                </el-form-item>

                <el-form-item v-if="security" label="#Patrol Vehicles" prop="cost">
                  <el-input-number v-model="ruleForm.number_vehicles" />
                </el-form-item>

                <el-form-item v-if="security" label="#Security staff" prop="cost">
                  <el-input-number v-model="ruleForm.number_staff" />
                </el-form-item>



                <el-form-item v-if="phase" label="Phase" prop="phase">
                  <el-select v-model="ruleForm.number_phases" filterable placeholder="Select">
                    <el-option v-for="item in phase_options" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                </el-form-item>


                <el-form-item v-if="waste" label="Type of Waste" prop="type">
                  <el-select v-model="ruleForm.type_waste" filterable placeholder="Select">
                    <el-option v-for="item in wasteOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>

                <el-form-item v-if="hazards" label="Frequency" prop="frequency">
                  <el-select v-model="ruleForm.frequency" filterable placeholder="Select">
                    <el-option v-for="item in frequencyOptions" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                </el-form-item>


                <el-form-item label="Ownership" prop="ownership_type">
                  <el-select v-model="ruleForm.ownership_type" filterable placeholder="Select">
                    <el-option v-for="item in ownsershipOptions" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>
                </el-form-item>


                <el-form-item label="Owner" prop="owner">
                  <el-input v-model="ruleForm.owner" />
                </el-form-item>

                <el-form-item label="Condition" prop="asset_condition">
                  <el-select v-model="ruleForm.condition" filterable placeholder="Select">
                    <el-option v-for="item in FacilityConditionOptions" :key="item.value" :label="item.label"
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
