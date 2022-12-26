<script setup lang="ts">
import { ElRow, ElCol, ElCard, ElSkeleton } from 'element-plus'
import { CountTo } from '@/components/CountTo'
import { useDesign } from '@/hooks/web/useDesign'
import { useI18n } from '@/hooks/web/useI18n'
import { ref, reactive } from 'vue'
import { getCountApi } from '@/api/dashboard/analysis'
import type { AnalysisTotalTypes } from '@/api/dashboard/analysis/types'
import { getCountFilter, getSumFilter } from '@/api/settlements'
import { getSummarybyFieldFromMultipleIncludes } from '@/api/summary'
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
  InfSettlementsCount: 0,
  TenureSettlementsCount: 0
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
  countQuerry.filterField = 'settlement_type'
  countQuerry.criteria = 1
  countQuerry.model = 'settlement'
  await getCountFilter(countQuerry, { model: 'settlement' }).then((response) => {
    totalState.NoSettlements = response.count
    console.log('The NoSettlements', totalState.NoSettlements)
  })
}

const getPopulationSummary = async () => {
  //  this.countQuerry.model = 'settlement'
  const countQuerry = {}
  countQuerry.filterField = 'settlement_type'
  countQuerry.criteria = 1
  countQuerry.model = 'settlement'
  countQuerry.sumField = 'population'
  await getSumFilter(countQuerry).then((response) => {
    console.log(response.data)
    totalState.NoSlumResidents = parseInt(response.data)
    console.log('The NoSlumResidents', totalState.NoSlumResidents)
  })
}

const getKisipTenureSettlementsCountByCounty = async () => {
  const formData = {}
  formData.model = 'intervention'
  formData.summaryField = 'settlement_id'
  formData.summaryFunction = 'count'

  // filter by field 
  formData.filterField = 'intervention_type_id'
  formData.filterValue = 1

  formData.assoc_models = ['settlement', 'county']

  await getSummarybyFieldFromMultipleIncludes(formData)
    .then(response => {
      var results = response.Total
      console.log('Tenure settlements interventions by county', results)

      totalState.TenureSettlementsCount = response.Total[0].count

    });

}
const getKisipInfSettlementsCountByCounty = async () => {
  const formData = {}
  formData.model = 'intervention'
  formData.summaryField = 'settlement_id'
  formData.summaryFunction = 'count'

  // filter by field 
  formData.filterField = 'intervention_type_id'
  formData.filterValue = 2

  formData.assoc_models = ['settlement', 'county']

  await getSummarybyFieldFromMultipleIncludes(formData)
    .then(response => {
      var results = response.Total
      console.log('Infrastructure settlements interventions by county', results)

      totalState.InfSettlementsCount = response.Total[0].count

    });

}



getCount()
getSettlementSummary()
getPopulationSummary()
getKisipTenureSettlementsCountByCounty()
getKisipInfSettlementsCountByCounty()
</script>

<template>
  <ElRow :gutter="10" justify="space-between" :class="prefixCls">
    <ElCol :xl="6" :lg="6" :md="12" :sm="12" :xs="24">
      <ElCard shadow="hover" class="mb-20px">
        <ElSkeleton :loading="loading" animated :rows="2">
          <template #default>
            <div :class="`${prefixCls}__item flex justify-between`">
              <div>
                <div :class="`${prefixCls}__item--icon ${prefixCls}__item--peoples p-16px inline-block rounded-6px`">
                  <Icon icon="fluent-mdl2:city-next" width="60" />
                </div>
              </div>
              <div class="flex flex-col justify-between">
                <div :class="`${prefixCls}__item--text text-16px text-gray-500 text-right`">{{
                    t('Number of Slums')
                }}</div>
                <CountTo class="text-20px font-700 text-right" :start-val="0" :end-val="totalState.NoSettlements"
                  :duration="2600" />
              </div>
            </div>
          </template>
        </ElSkeleton>
      </ElCard>
    </ElCol>

    <ElCol :xl="6" :lg="6" :md="12" :sm="12" :xs="24">
      <ElCard shadow="hover" class="mb-20px">
        <ElSkeleton :loading="loading" animated :rows="2">
          <template #default>
            <div :class="`${prefixCls}__item flex justify-between`">
              <div>
                <div :class="`${prefixCls}__item--icon ${prefixCls}__item--message p-16px inline-block rounded-6px`">
                  <font-awesome-icon size="4x" icon="fa-solid fa-people-group" />
                </div>
              </div>
              <div class="flex flex-col justify-between">
                <div :class="`${prefixCls}__item--text text-16px text-gray-500 text-right`">{{
                    t('Resident Population')
                }}</div>
                <CountTo class="text-20px font-700 text-right" :start-val="0" :end-val="totalState.NoSlumResidents"
                  :duration="2600" />
              </div>
            </div>
          </template>
        </ElSkeleton>
      </ElCard>
    </ElCol>

    <ElCol :xl="6" :lg="6" :md="12" :sm="12" :xs="24">
      <ElCard shadow="hover" class="mb-20px">
        <ElSkeleton :loading="loading" animated :rows="2">
          <template #default>
            <div :class="`${prefixCls}__item flex justify-between`">
              <div>
                <div :class="`${prefixCls}__item--icon ${prefixCls}__item--money p-16px inline-block rounded-6px`">
                  <Icon icon="icon-park-solid:map-road-two" width="60" />
                </div>
              </div>
              <div class="flex flex-col justify-between">
                <div :class="`${prefixCls}__item--text text-16px text-gray-500 text-right`">{{
                    t('Settlements Supported with Improved Infrastructure ')
                }}</div>
                <CountTo class="text-20px font-700 text-right" :start-val="0" :end-val="totalState.InfSettlementsCount"
                  :duration="2600" />
              </div>
            </div>
          </template>
        </ElSkeleton>
      </ElCard>
    </ElCol>

    <ElCol :xl="6" :lg="6" :md="12" :sm="12" :xs="24">
      <ElCard shadow="hover" class="mb-20px">
        <ElSkeleton :loading="loading" animated :rows="2">
          <template #default>
            <div :class="`${prefixCls}__item flex justify-between`">
              <div>
                <div :class="`${prefixCls}__item--icon ${prefixCls}__item--shopping p-16px inline-block rounded-6px`">
                  <Icon icon="tabler:certificate" height='60' />
                </div>
              </div>
              <div class="flex flex-col justify-between">
                <div :class="`${prefixCls}__item--text text-16px text-gray-500 text-right`">{{
                    t('Settlements Undergoing Tenure Regularization')
                }}</div>
                <CountTo class="text-20px font-700 text-right" :start-val="0"
                  :end-val="totalState.TenureSettlementsCount" :duration="2600" />
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

    &:hover {
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
