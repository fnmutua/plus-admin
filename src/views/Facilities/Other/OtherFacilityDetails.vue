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
    field: 'type',
    label: t('Type')
  },
  {
    field: 'settlement',
    label: t('Settlement')
  },
  {
    field: 'county',
    label: t('County')
  },
  {
    field: 'status',
    label: t('Status')
  },



])




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
const model = 'other_facility'
const nested_models = ['settlement', 'county'] // The mother, then followed by the child

//// ------------------parameters -----------------------////

let settlement = reactive({
  count: 0,
  name: 'unnwo',
  flag: false
})
////////////

const profile = reactive({
  name: '',
  county: '',
  type: '',
  status: '',
  settlement: '',
  ownership: '',
  owner: ''
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
  profile.type = res.data[0].type
  profile.status = res.data[0].reg_status
  profile.ownership = res.data[0].ownership_type
  profile.owner = res.data[0].owner


  console.log('After profile', profile)
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
