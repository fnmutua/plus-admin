<script setup lang="ts">
import { Descriptions } from '@/components/Descriptions'
import { useI18n } from '@/hooks/web/useI18n'
import { onMounted, reactive, unref } from 'vue'
import { Form } from '@/components/Form'
import { ElFormItem, ElInput, ElButton } from 'element-plus'
import { useValidator } from '@/hooks/web/useValidator'
import { useForm } from '@/hooks/web/useForm'
import { useRoute } from 'vue-router'
const { register, elFormRef } = useForm()

const { required } = useValidator()
const route = useRoute()

const { t } = useI18n()

const profile = reactive({
  name: 'Kibera',
  county: 'Nairobi',
  subcounty: 'Langata',
  type: 'Slum',
  description:
    'Kibera (Kinubi: Forest or Jungle[1]) is a division of Nairobi Area, Kenya, and neighbourhood of the city of Nairobi, 6.6 kilometres (4.1 mi) from the city centre.[2] Kibera is the largest slum in Nairobi, and the largest urban slum in Africa.[3][4][5] The 2009 Kenya Population and Housing Census reports Kiberas population as 170,070, contrary to previous estimates of one or two million people.[6] ',
  area_ha: '34',
  population: '3500'
})

const housing = reactive({
  no_dwelling: '45',
  pop_density: '10',
  ave_hh_size: '6',
  ave_room_occupancy: '4',
  prop_permanent: '45%',
  prop_semi: '20%',
  prop_temp: '35%',
  avg_cost_perm: '2500',
  avg_cost_semi: '1500',
  avg_cost_temp: '1000'
})

const utilities = reactive({
  prop_avail_piped_water: '25%',
  prop_other_water: '75%',
  prop_conn_elec: '45%',
  prop_conn_other_elec: '55%',
  prop_lpg: '20%',
  prop_firewood: '25%',
  prop_kerosene: '45%',
  prop_biogas: '10%',
  prop_elec: '0%'
})

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
    field: 'county',
    label: t('County')
  },
  {
    field: 'subcounty',
    label: t('SubCounty')
  },

  {
    field: 'population',
    label: t('Population')
  },
  {
    field: 'area_ha',
    label: t('Area(Ha.)')
  },

  {
    field: 'description',
    label: t('Description'),
    span: 40
  }
])

const schemaHousing = reactive<DescriptionsSchema[]>([
  {
    field: 'no_dwelling',
    label: t('Number of Dwellings')
  },

  {
    field: 'pop_density',
    label: t('Population Density')
  },

  {
    field: 'ave_hh_size',
    label: t('Average Household Size')
  },

  {
    field: 'ave_room_occupancy',
    label: t('Average Room Occupancy')
  },

  {
    field: 'prop_permanent',
    label: t('Proportion of Permanent Structures')
  },
  {
    field: 'prop_semi',
    label: t('Proportion of Semi-Permanent Structures')
  },
  {
    field: 'prop_temp',
    label: t('Proportion of Temporary Structures')
  },
  {
    field: 'avg_cost_perm',
    label: t('Average Monthly Rent for Permanent Structures')
  },

  {
    field: 'avg_cost_semi',
    label: t('Average Monthly Rent for Semi-Permanent Structures')
  },

  {
    field: 'avg_cost_temp',
    label: t('Average Monthly Rent for Temporary Structures')
  }
])

const schemaUtilities = reactive<DescriptionsSchema[]>([
  {
    field: 'prop_avail_piped_water',
    label: t('Proportion of Residents with access to Piped Water')
  },
  {
    field: 'prop_other_water',
    label: t('Proportion of Residents without access to Piped Water')
  },
  {
    field: 'prop_conn_elec',
    label: t('Proportion of Residents with access to Electricity')
  },

  {
    field: 'prop_conn_other_elec',
    label: t('Proportion of Residents without access to Electricity')
  },

  {
    field: 'prop_lpg',
    label: t('Proportion of Residents using LPG gas')
  },

  {
    field: 'prop_firewood',
    label: t('Proportion of Residents using Firewood')
  },

  {
    field: 'prop_biogas',
    label: t('Proportion of Residents using Biogas')
  },

  {
    field: 'prop_kerosene',
    label: t('Number of Dwellings')
  },

  {
    field: 'prop_elec',
    label: 'Proportion of Residents using Electricity(Cooking)'
  }
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

onMounted(() => {
  const id = route.params.id
  const settData = route.params.data
  console.log('Settlement ID, Data:', id, settData)
})
</script>

<template>
  <Descriptions
    :title="t('Profile')"
    :message="t('Settlement Profile')"
    :data="profile"
    :schema="schemaProfile"
  />

  <Form is-custom :model="form" @register="register">
    <Descriptions
      :title="t('Housing')"
      :message="t('Settlement Housing')"
      :data="housing"
      :schema="schemaHousing"
    />
  </Form>

  <Form is-custom :model="form" @register="register">
    <Descriptions
      :title="t('Utilities')"
      :message="t('Access to Utilities')"
      :data="utilities"
      :schema="schemaUtilities"
    />
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
