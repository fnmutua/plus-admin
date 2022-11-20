<script setup lang="ts">
import { Descriptions } from '@/components/Descriptions'
import { useI18n } from '@/hooks/web/useI18n'
import { onMounted, ref, reactive, unref } from 'vue'
import { Form } from '@/components/Form'
import { ElFormItem, ElInput, ElButton } from 'element-plus'
import { useValidator } from '@/hooks/web/useValidator'
import { useForm } from '@/hooks/web/useForm'
import { useRoute } from 'vue-router'
import {
  getOneGeo,
  getOneSettlement,
  getSettlementListByCounty,
  getfilteredGeo
} from '@/api/settlements'

// Locally
import { VueCollapsiblePanelGroup, VueCollapsiblePanel } from '@dafcoe/vue-collapsible-panel'
import '@dafcoe/vue-collapsible-panel/dist/vue-collapsible-panel.css'

const { register, elFormRef } = useForm()

const route = useRoute()

const { t } = useI18n()



const schemaProfile = reactive<DescriptionsSchema[]>([
  {
    field: 'name',
    label: t('Name')
  },
  {
    field: 'level',
    label: t('Level')
  },
  {
    field: 'county',
    label: t('County')
  },
  {
    field: 'status',
    label: t('Status')
  },

  {
    field: 'ownership',
    label: t('Ownership')
  },
  {
    field: 'owner',
    label: t('Owner')
  },
])

const schemaStaffing = reactive<DescriptionsSchema[]>([
  {
    field: 'male_enrollment',
    label: t('Number of Male Students')
  },

  {
    field: 'female_enrollment',
    label: t('Number of Female Students')
  },

  {
    field: 'number_teachers',
    label: t('Number of Teachers')
  },

  {
    field: 'number_other_staff',
    label: t('Number of Support Staff')
  },


])

const schemaInfrastructure = reactive<DescriptionsSchema[]>([
  {
    field: 'number_classrooms',
    label: t('Number of Classrooms')
  },

  {
    field: 'number_female_toilets',
    label: t('Number of Female Toilets')
  },

  {
    field: 'number_male_toilets',
    label: t('Number of Male Toilets')
  },
  {
    field: 'number_handwashing_stns',
    label: t('Number of H/W stations')
  },





])


const form = reactive({
  name: '',
  county: '',
  population: '',
  area_ha: '',
  description: '',
  type: '',
  subcounty: ''
})

const page = ref(1)
const pSize = ref(5)
////Configurations //////////////

//// ------------------parameters -----------------------////
var filters = ['id']
const id = route.params.id
var intervenComponent = [id] // the Id of the settleemnt to filter with
var filterValues = [intervenComponent]

//const associated_Model = ''
const associated_multiple_models = ['settlement']
const model = 'education_facility'
const nested_models = ['settlement', 'county'] // The mother, then followed by the child

//// ------------------parameters -----------------------////

let settlement = reactive({
  count: 0,
  name: '',
  flag: false
})
////////////

const profile = reactive({
  name: '',
  county: '',
  level: '',
  status: '',
  settlement: '',
  ownership: '',
  owner: ''
})
const enrollment_staffing = reactive({
  male_enrollment: '',
  female_enrollment: '',
  number_teachers: '',
  number_other_staff: '',
})

const Infrastructure = reactive({
  number_classrooms: '',
  number_female_toilets: '',
  number_male_toilets: '',
  number_handwashing_stns: '',
})







const getFilteredData = async (selFilters, selfilterValues) => {
  const formData = {}
  formData.limit = pSize.value
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  //formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = selFilters
  formData.filterValues = selfilterValues
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = nested_models
  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  // set the settlement details ------------------------------------

  console.log('After Querry', res)

  // set the Facility profile  details ------------------------------------
  profile.name = res.data[0].name
  profile.county = res.data[0].settlement.county.name
  profile.settlement = res.data[0].settlement.name
  profile.level = res.data[0].level
  profile.status = res.data[0].reg_status
  profile.ownership = res.data[0].ownership_type
  profile.owner = res.data[0].owner

  // set the Facility staff  details ------------------------------------
  capacity.number_teachers = res.data[0].number_teachers
  capacity.number_other_staff = res.data[0].number_other_staff
  capacity.male_enrollment = res.data[0].male_enrollment
  capacity.female_enrollment = res.data[0].female_enrollment

  // set the Facility capacity  details ------------------------------------
  staffing.number_classrooms = res.data[0].number_classrooms
  staffing.number_male_toilets = res.data[0].number_male_toilets
  staffing.number_female_toilets = res.data[0].number_female_toilets
  staffing.number_handwashing_stns = res.data[0].number_handwashing_stns


}
onMounted(() => {
  const id = route.params.id
  const settData = route.params.data
  // console.log('Settlement ID, Data:', id, settData)
  //getThisSettlement()

  getFilteredData(filters, filterValues)
  console.log(settlement)
})
</script>

<template>
  <Descriptions :title="t('Profile')" :message="t('Facility Profile')" :data="profile" :schema="schemaProfile" />

  <Form is-custom :model="form" @register="register">
    <Descriptions :title="t('Enrollment/Staffing')" :message="t('Facility Enrollment/Staffing Levels')"
      :data="enrollment_staffing" :schema="schemaStaffing" />
  </Form>

  <Form is-custom :model="form" @register="register">
    <Descriptions :title="t('Infrastructure')" :message="t('Infrastructure')" :data="Infrastructure"
      :schema="schemaInfrastructure" />
  </Form>
</template>

<style lang="less" scoped>
.is-required--item {
  position: relative;

  &::before {
    margin-right: 4px;
    color: var(--el-color-danger);
    content: '*';
  }
}
</style>
