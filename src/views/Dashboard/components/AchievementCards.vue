<script setup lang="ts">
import { ElRow, ElCol, ElCard, ElSkeleton, ElProgress } from 'element-plus'
import { CountTo } from '@/components/CountTo'
import { useDesign } from '@/hooks/web/useDesign'
import { useI18n } from '@/hooks/web/useI18n'
import { ref, reactive } from 'vue'
import { getCountApi } from '@/api/dashboard/analysis'
import type { AnalysisTotalTypes } from '@/api/dashboard/analysis/types'
import { getCountFilter, getSumFilter } from '@/api/settlements'
import { getSummarybyField, getSummarybyFieldNested, getSummarybyFieldFromInclude, getSummarybyFieldFromMultipleIncludes } from '@/api/summary'
import { Icon } from '@iconify/vue';

const { t } = useI18n()

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('panel')

const loading = ref(true)

let totalState = reactive<AnalysisTotalTypes>({
  users: 0,
  messages: 0,
  moneys: 0,
  shoppings: 0,
  Nocounties: 0,
  NoSettlements: 0,
  NoSlums: 0,
  NoSlumResidents: 0,
  NoSlumBeneficiaries: 0,
  communityDevPlans: 0,
  titleDeeds: 0,
  countyStrategies: 0
})

const getCount = async () => {
  const res = await getCountApi()
    .catch(() => { })
    .finally(() => {
      loading.value = false
    })
  totalState = Object.assign(totalState, res?.data || {})
}

const getSettlementSummary = async () => {
  //  this.countQuerry.model = 'settlement'
  const countQuerry = {}
  countQuerry.filterFields = ['settlement_type', 'isApproved']
  countQuerry.criteria = [1, 'Approved']
  countQuerry.model = 'settlement'
  await getCountFilter(countQuerry, { model: 'settlement' }).then((response) => {
    totalState.NoSettlements = response.count
    console.log('The NoSettlements', totalState.NoSettlements)
  })
}

const getPopulationSummary = async () => {
  //  this.countQuerry.model = 'settlement'
  const countQuerry = {}
  countQuerry.filterFields = ['settlement_type', 'isApproved']
  countQuerry.criteria = [1, 'Approved']
  countQuerry.model = 'settlement'
  countQuerry.sumField = 'population'
  await getSumFilter(countQuerry).then((response) => {
    console.log(response.data)
    totalState.NoSlumResidents = parseInt(response.data)
    console.log('The NoSlumResidents', totalState.NoSlumResidents)
  })
}


const getImprovedRoads = async () => {
  //  this.countQuerry.model = 'settlement'
  const countQuerry = {}
  countQuerry.filterFields = ['indicator_category_id']
  countQuerry.criteria = [2]
  countQuerry.model = 'indicator_category_report'
  countQuerry.sumField = 'amount'
  await getSumFilter(countQuerry).then((response) => {

    totalState.roadsKm = parseInt(response.data) / 1000
    console.log('The getImprovedRoads', totalState.roadsKm)
  })
}


const getWaterConnections = async () => {
  //  this.countQuerry.model = 'settlement'
  const countQuerry = {}
  countQuerry.filterFields = ['indicator_category_id']
  countQuerry.criteria = [14]  // water connection
  countQuerry.model = 'indicator_category_report'
  countQuerry.sumField = 'amount'
  await getSumFilter(countQuerry).then((response) => {

    totalState.waterConnections = parseInt(response.data)
    console.log('The waterConnections', totalState.waterConnections)
  })
}


const getCountyStrategies = async () => {
  //  this.countQuerry.model = 'settlement'
  const countQuerry = {}
  countQuerry.filterFields = ['indicator_category_id']
  countQuerry.criteria = [4]  // Counties where next generation of County Integrated Development Plans (CIDPs) include slum upgrading strategies developedunder the project
  countQuerry.model = 'indicator_category_report'
  countQuerry.sumField = 'amount'
  countQuerry.cache_key = 'countiesWIthStrategies'
  await getSumFilter(countQuerry).then((response) => {
    totalState.countyStrategies = parseInt(response.data)
    console.log('The countyStrategies', totalState.countyStrategies)
  })
}



const getCommunityDevPlans = async () => {
  //  this.countQuerry.model = 'settlement'
  const countQuerry = {}
  countQuerry.filterFields = ['indicator_category_id']
  countQuerry.criteria = [3]  //  community Dev plans
  countQuerry.model = 'indicator_category_report'
  countQuerry.sumField = 'amount'
  countQuerry.cache_key = 'getCommunityDevPlans'
  await getSumFilter(countQuerry).then((response) => {
    totalState.communityDevPlans = parseInt(response.data)
    console.log('The communityDevPlans', totalState.communityDevPlans)
  })
}


const getTitleDeeds = async () => {
  //  this.countQuerry.model = 'settlement'
  const countQuerry = {}
  countQuerry.filterFields = ['indicator_category_id']
  countQuerry.criteria = [1]  //  titlee Deeds
  countQuerry.model = 'indicator_category_report'
  countQuerry.sumField = 'amount'
  countQuerry.cache_key = 'getTitleDeeds'
  await getSumFilter(countQuerry).then((response) => {
    totalState.titleDeeds = parseInt(response.data)
    console.log('The communityDevPlans', totalState.titleDeeds)
  })
}





getCount()
getSettlementSummary()
getPopulationSummary()
getImprovedRoads()
getWaterConnections()
getCountyStrategies()
getCommunityDevPlans()
getTitleDeeds()

</script>

<template>
  <ElRow :gutter="10" justify="space-between" :class="prefixCls">


    <ElCol :xl="6" :lg="6" :md="6" :sm="24" :xs="24">
      <ElCard shadow="always" class="mb-20px">
        <ElSkeleton :loading="loading" animated :rows="2">
          <template #default>
            <div :class="`${prefixCls}__item flex justify-between`">
              <div>
                <div :class="`${prefixCls}__item--icon ${prefixCls}__item--message p-16px inline-block rounded-6px`">
                  <Icon icon="mingcute:certificate-2-line" height="60" />
                </div>
              </div>
              <div class="flex flex-col justify-between">
                <div :class="`${prefixCls}__item--text text-16px text-gray-500 text-right`">{{
                  t('Titles Deeds Issued')
                }}</div>
                <CountTo class="text-20px font-700 text-right" :start-val="0" :end-val="totalState.titleDeeds"
                  :duration="2600" />
              </div>
            </div>
          </template>
        </ElSkeleton>
      </ElCard>
    </ElCol>

    <ElCol :xl="6" :lg="6" :md="6" :sm="24" :xs="24">
      <ElCard shadow="always" class="mb-20px">
        <ElSkeleton :loading="loading" animated :rows="2">
          <template #default>
            <div :class="`${prefixCls}__item flex justify-between`">
              <div>
                <div :class="`${prefixCls}__item--icon ${prefixCls}__item--water p-16px inline-block rounded-6px`">
                  <Icon icon="carbon:map-boundary" height="60" />
                </div>
              </div>
              <div class="flex flex-col justify-between">
                <div :class="`${prefixCls}__item--text text-16px text-gray-500 text-right`">{{
                  t('Community Development Plans Prepared')
                }}</div>
                <CountTo class="text-20px font-700 text-right" :start-val="0" :end-val="totalState.communityDevPlans"
                  :duration="2600" />
              </div>
            </div>
          </template>
        </ElSkeleton>
      </ElCard>
    </ElCol>

    <ElCol :xl="6" :lg="6" :md="6" :sm="24" :xs="24">
      <ElCard shadow="always" class="mb-20px">
        <ElSkeleton :loading="loading" animated :rows="2">
          <template #default>
            <div :class="`${prefixCls}__item flex justify-between`">
              <div>
                <div :class="`${prefixCls}__item--icon ${prefixCls}__item--road p-16px inline-block rounded-6px`">
                  <Icon icon="fa6-solid:road-circle-check" height="60" />
                </div>
              </div>
              <div class="flex flex-col justify-between">
                <div :class="`${prefixCls}__item--text text-16px text-gray-500 text-right`">{{
                  t('Roads Upgraded (Km)')
                }}</div>
                <CountTo class="text-20px font-700 text-right" :start-val="0" :end-val="totalState.roadsKm"
                  :duration="2600" />
              </div>
            </div>
          </template>
        </ElSkeleton>
      </ElCard>
    </ElCol>
    <ElCol :xl="6" :lg="6" :md="6" :sm="24" :xs="24">
      <ElCard shadow="always" class="mb-20px">
        <ElSkeleton :loading="loading" animated :rows="2">
          <template #default>
            <div :class="`${prefixCls}__item flex justify-between`">
              <div>
                <div :class="`${prefixCls}__item--icon ${prefixCls}__item--shopping p-16px inline-block rounded-6px`">
                  <Icon icon="ph:strategy-bold" height="60" />
                </div>
              </div>
              <div class="flex flex-col justify-between">
                <div :class="`${prefixCls}__item--text text-16px text-gray-500 text-right`">{{
                  t('Slum Prevention Strategies Developed')
                }}</div>
                <CountTo class="text-20px font-700 text-right" :start-val="0" :end-val="totalState.countyStrategies"
                  :duration="2600" />
              </div>
            </div>
          </template>
        </ElSkeleton>
      </ElCard>
    </ElCol>


  </ElRow>
</template>

<style lang="less" scoped>
@prefix-cls: ~'@{namespace}-panel';

.@{prefix-cls} {
  &__item {
    &--peoples {
      color: #40c9c6;
    }

    &--message {
      color: #36a3f7;
    }

    &--money {
      color: #f4516c;
    }

    &--shopping {
      color: #34bfa3;
    }

    &--road {
      color: #ee0e0e;
    }

    &--water {
      color: #110bba;
    }

    &:always {
      :deep(.@{namespace}-icon) {
        color: #fff !important;
      }

      .@{prefix-cls}__item--icon {
        transition: all 0.38s ease-out;
      }

      .@{prefix-cls}__item--peoples {
        background: #40c9c6;
      }

      .@{prefix-cls}__item--message {
        background: #36a3f7;
      }

      .@{prefix-cls}__item--money {
        background: #f4516c;
      }

      .@{prefix-cls}__item--shopping {
        background: #34bfa3;
      }
    }
  }
}
</style>
