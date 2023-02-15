<script setup lang="ts">
import { ElRow, ElCol, ElCard, ElSkeleton } from 'element-plus'
import { CountTo } from '@/components/CountTo'
import { useDesign } from '@/hooks/web/useDesign'
import { useI18n } from '@/hooks/web/useI18n'
import { ref, reactive } from 'vue'
import { getCountApi } from '@/api/dashboard/analysis'
import type { AnalysisTotalTypes } from '@/api/dashboard/analysis/types'
import { getCountFilter, getSumFilter } from '@/api/settlements'
import { getSummarybyField, getSummarybyFieldNested } from '@/api/summary'
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
  NoSettlements: 0,
  NoSlums: 0,
  NoSlumResidents: 0,
  NoSlumBeneficiaries: 0,
  AverageLengthStay: 0,
  proportionOwners: 0,
  majorityIncomeLevel: ''
})


function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}



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
    //   console.log('The NoSettlements', totalState.NoSettlements)
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
    //  console.log(response.data)
    totalState.NoSlumResidents = parseInt(response.data)
    //   console.log('The NoSlumResidents', totalState.NoSlumResidents)
  })
}

const getaverageLengthStay = async () => {
  const formData = {}
  formData.model = 'households'
  formData.summaryField = 'length_stay'
  formData.summaryFunction = 'AVG'
  formData.groupField = ''
  formData.cache_key = 'lengthofStayHHs'

  const length_stay = await getSummarybyField(formData)
  // console.log('length_stay---->', Math.round(length_stay.Total[0].AVG))
  totalState.AverageLengthStay = Math.round(length_stay.Total[0].AVG)
}

// Income 
const getAverageIncome = async () => {
  const formData = {}
  formData.model = 'households'
  formData.summaryField = 'income_level'
  formData.summaryFunction = 'count'
  formData.groupField = ['income_level']
  formData.cache_key = 'incomeLevelData'


  await getSummarybyField(formData)
    .then(response => {
      var res = response.Total
      console.log('summary income---->', response)
      var res = response.Total
      var max = Math.max.apply(Math, res.map(function (o) { return o.count; }))
      //   console.log("max", max)

      res.forEach(function (item) {
        //  console.log("Looping----", item)
        if (item.count == max) {
          //    console.log(item.income_level)
          totalState.majorityIncomeLevel = toTitleCase(item.income_level.replace("_", "-"))

        }
      });

    });


}


///////--- Tenure------------
const tenure = ref([])
const getTenureStatus = async () => {
  const formData = {}
  formData.model = 'households'
  formData.summaryField = 'ownership_status'
  formData.summaryFunction = 'count'
  formData.groupField = ['ownership_status']
  formData.cache_key = 'ownershipStatusKey'

  await getSummarybyField(formData)
    .then(response => {
      var res = response.Total
      //   console.log(res.reduce((n, { count }) => n + parseInt(count), 0))
      var data = res,
        sum = data.reduce((s, { count }) => s + parseInt(count), 0),
        proportion = data.map(({ ownership_status, count }) => ({ ownership_status, percentage: count * 100 / sum }));
      //   console.log(proportion);

      proportion.forEach(function (item) {
        if (item.ownership_status === "plot_Owner") {
          totalState.proportionOwners = Math.round(item.percentage)
        }
      });


    });

}



getCount()
getSettlementSummary()
getPopulationSummary()
getaverageLengthStay()
getTenureStatus()
getAverageIncome()
</script>

<template>
  <ElRow :gutter="20" justify="space-between" :class="prefixCls">
    <ElCol :xl="6" :lg="6" :md="12" :sm="12" :xs="24">
      <ElCard shadow="always" class="mb-20px">
        <ElSkeleton :loading="loading" animated :rows="2">
          <template #default>
            <div :class="`${prefixCls}__item flex justify-between`">
              <div> </div>
              <div class="flex flex-col justify-between">
                <div :class="`${prefixCls}__item--text text-16px text-gray-500 text-center`">{{
                  t('Median Monthly Household Income (KES)')
                }}</div>

                <div class="text-20px font-700 text-center">
                  {{ totalState.majorityIncomeLevel }}</div>

              </div>
              <div :class="`${prefixCls}__item--icon ${prefixCls}__item--peoples p-16px inline-block rounded-6px`">
                <Icon icon="healthicons:money-bag" height="60" />
              </div>
            </div>
          </template>
        </ElSkeleton>
      </ElCard>
    </ElCol>

    <ElCol :xl="6" :lg="6" :md="12" :sm="12" :xs="24">
      <ElCard shadow="always" class="mb-20px">
        <ElSkeleton :loading="loading" animated :rows="2">
          <template #default>
            <div :class="`${prefixCls}__item flex justify-between`">
              <div> </div>
              <div class="flex flex-col justify-between">
                <div :class="`${prefixCls}__item--text text-16px text-gray-500 text-center`">{{
                  t('Average Income of Structure Landlords (KES)')
                }}</div>
                <CountTo class="text-20px font-700 text-center" :start-val="0" :end-val="totalState.AverageLengthStay"
                  :duration="2600" />
              </div>
              <div :class="`${prefixCls}__item--icon ${prefixCls}__item--proportion  p-16px inline-block rounded-6px`">

                <Icon icon="game-icons:take-my-money" height="60" />
              </div>
            </div>
          </template>
        </ElSkeleton>
      </ElCard>
    </ElCol>
    <ElCol :xl="6" :lg="6" :md="12" :sm="12" :xs="24">
      <ElCard shadow="always" class="mb-20px">
        <ElSkeleton :loading="loading" animated :rows="2">
          <template #default>
            <div :class="`${prefixCls}__item flex justify-between`">
              <div> </div>
              <div class="flex flex-col justify-between">
                <div :class="`${prefixCls}__item--text text-16px text-gray-500 text-center`">{{
                  t('Proportion of Absentee Landlords (%)')
                }}</div>
                <CountTo class="text-20px font-700 text-center" :start-val="0" :end-val="totalState.proportionOwners"
                  :duration="2600" />
              </div>
              <div :class="`${prefixCls}__item--icon ${prefixCls}__item--absent  p-16px inline-block rounded-6px`">
                <Icon icon="mdi:person-search" height="60" />
              </div>
            </div>
          </template>
        </ElSkeleton>
      </ElCard>
    </ElCol>
    <ElCol :xl="6" :lg="6" :md="12" :sm="12" :xs="24">
      <ElCard shadow="always" class="mb-20px">
        <ElSkeleton :loading="loading" animated :rows="2">
          <template #default>
            <div :class="`${prefixCls}__item flex justify-between`">
              <div> </div>
              <div class="flex flex-col justify-between">
                <div :class="`${prefixCls}__item--text text-16px text-gray-500 text-center`">{{
                  t('Households that own structures within slums (%)')
                }}</div>
                <CountTo class="text-20px font-700 text-center" :start-val="0" :end-val="totalState.proportionOwners"
                  :duration="2600" />
              </div>
              <div :class="`${prefixCls}__item--icon ${prefixCls}__item--structures  p-16px inline-block rounded-6px`">
                <Icon icon="bi:house-lock-fill" height="60" />
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

    &--absent {
      color: #e10b20;
    }


    &--structures {
      color: #168f5b;
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
