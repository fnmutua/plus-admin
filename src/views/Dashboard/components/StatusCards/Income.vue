<script setup lang="ts">
import { ElRow, ElCol, ElCard, ElSkeleton } from 'element-plus'
import { CountTo } from '@/components/CountTo'
import { useDesign } from '@/hooks/web/useDesign'
import { useI18n } from '@/hooks/web/useI18n'
import { ref, reactive } from 'vue'
import { getCountApi } from '@/api/dashboard/analysis'
import type { AnalysisTotalTypes } from '@/api/dashboard/analysis/types'
import { getCountFilter, getSumFilter } from '@/api/settlements'

const { t } = useI18n()

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('panel')

const loading = ref(true)

let totalState = reactive<AnalysisTotalTypes>({
  users: 0,
  messages: 0,
  moneys: 0,
  shoppings: 0,
  NoSettlements: 0,
  NoSlums: 0,
  NoSlumResidents: 0,
  NoSlumBeneficiaries: 0
})

const getCount = async () => {
  const res = await getCountApi()
    .catch(() => {})
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

getCount()
getSettlementSummary()
getPopulationSummary()
</script>

<template>
  <ElRow :gutter="20" justify="space-between" :class="prefixCls">
    <ElCol :xl="6" :lg="8" :md="12" :sm="12" :xs="24">
      <ElCard shadow="always" class="mb-20px">
        <ElSkeleton :loading="loading" animated :rows="2">
          <template #default>
            <div :class="`${prefixCls}__item flex justify-between`">
              <div> </div>
              <div class="flex flex-col justify-between">
                <div :class="`${prefixCls}__item--text text-16px text-gray-500 text-center`">{{
                  t('Average Monthly Household Income (KES)')
                }}</div>
                <CountTo
                  class="text-20px font-700 text-center"
                  :start-val="0"
                  :end-val="totalState.NoSlumResidents"
                  :duration="2600"
                />
              </div>
              <div
                :class="`${prefixCls}__item--icon ${prefixCls}__item--peoples p-16px inline-block rounded-6px`"
              >
                <font-awesome-icon size="4x" icon="fa-solid fa-dollar-sign" />
              </div>
            </div>
          </template>
        </ElSkeleton>
      </ElCard>
    </ElCol>

    <ElCol :xl="8" :lg="7" :md="12" :sm="12" :xs="24">
      <ElCard shadow="always" class="mb-20px">
        <ElSkeleton :loading="loading" animated :rows="2">
          <template #default>
            <div :class="`${prefixCls}__item flex justify-between`">
              <div> </div>
              <div class="flex flex-col justify-between">
                <div :class="`${prefixCls}__item--text text-16px text-gray-500 text-center`">{{
                  t('Proportion of Households with permanent source of income (%)')
                }}</div>
                <CountTo
                  class="text-20px font-700 text-center"
                  :start-val="0"
                  :end-val="80"
                  :duration="2600"
                />
              </div>
              <div
                :class="`${prefixCls}__item--icon ${prefixCls}__item--proportion  p-16px inline-block rounded-6px`"
              >
                <font-awesome-icon size="4x" icon="fa-solid fa-filter-circle-dollar" />
              </div>
            </div>
          </template>
        </ElSkeleton>
      </ElCard>
    </ElCol>

    <ElCol :xl="8" :lg="7" :md="12" :sm="12" :xs="24">
      <ElCard shadow="always" class="mb-20px">
        <ElSkeleton :loading="loading" animated :rows="2">
          <template #default>
            <div :class="`${prefixCls}__item flex justify-between`">
              <div> </div>
              <div class="flex flex-col justify-between">
                <div :class="`${prefixCls}__item--text text-16px text-gray-500 text-center`">{{
                  t('Proportion of Households that own structures within slums')
                }}</div>
                <CountTo
                  class="text-20px font-700 text-center"
                  :start-val="0"
                  :end-val="80"
                  :duration="2600"
                />
              </div>
              <div
                :class="`${prefixCls}__item--icon ${prefixCls}__item--structures  p-16px inline-block rounded-6px`"
              >
                <font-awesome-icon size="4x" icon="fa-solid fa-house-lock" />
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
    &--proportion {
      color: #9240c9;
    }

    &--message {
      color: #36a3f7;
    }
    &--peoples {
      color: #c9d30c;
    }
    &--money {
      color: #f4516c;
    }

    &--shopping {
      color: #34bfa3;
    }
    &--structures {
      color: #ed4415;
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
