<script setup lang="ts">
import PanelGroup from './components/KisipCards.vue'

import { ElRow, ElCol, ElCard, ElSkeleton } from 'element-plus'
import { Echart } from '@/components/Echart'
import {
  pieOptions,
  barOptions,
  lineOptions,
  waterOptions,
  housingOptions,
  topCountiesWithSlums,
  SlumsPerCountyChart
} from './echarts-data'
import { ref, reactive } from 'vue'
import {
  getUserAccessSourceApi,
  getWeeklyUserActivityApi,
  getWaterAccessApi,
  getMonthlySalesApi
} from '@/api/dashboard/analysis'
import { set } from 'lodash-es'
import { EChartsOption } from 'echarts'
import { useI18n } from '@/hooks/web/useI18n'
import { getSummarybyField, getSummarybyFieldNested, getSummarybyFieldFromInclude, getSummarybyFieldSimple } from '@/api/summary'

const { t } = useI18n()

const loading = ref(true)
const colorPalette = ['#0000ff', '#ff007f'];  // Male-Female

const pieOptionsData = reactive<EChartsOption>(pieOptions) as EChartsOption

// 用户来源
const getUserAccessSource = async () => {
  const res = await getUserAccessSourceApi().catch(() => { })
  if (res) {
    set(
      pieOptionsData,
      'legend.data',
      res.data.map((v) => t(v.name))
    )
    pieOptionsData!.series![0].data = res.data.map((v) => {
      return {
        name: t(v.name),
        value: v.value
      }
    })
  }
}

const barOptionsData = reactive<EChartsOption>(barOptions) as EChartsOption

// 周活跃量
const getWeeklyUserActivity = async () => {
  const res = await getWeeklyUserActivityApi().catch(() => { })
  if (res) {
    set(
      barOptionsData,
      'xAxis.data',
      res.data.map((v) => t(v.name))
    )
    set(barOptionsData, 'series', [
      {
        name: t('analysis.activeQuantity'),
        data: res.data.map((v) => v.value),
        type: 'bar'
      }
    ])
  }
}

const lineOptionsData = reactive<EChartsOption>(lineOptions) as EChartsOption

// 每月销售总额
const getMonthlySales = async () => {
  const res = await getMonthlySalesApi().catch(() => { })
  if (res) {
    set(
      lineOptionsData,
      'xAxis.data',
      res.data.map((v) => t(v.name))
    )
    set(lineOptionsData, 'series', [
      {
        name: t('analysis.estimate'),
        smooth: true,
        type: 'line',
        data: res.data.map((v) => v.estimate),
        animationDuration: 2800,
        animationEasing: 'cubicInOut'
      },
      {
        name: t('analysis.actual'),
        smooth: true,
        type: 'line',
        itemStyle: {},
        data: res.data.map((v) => v.actual),
        animationDuration: 2800,
        animationEasing: 'quadraticOut'
      }
    ])
  }
}


const directBeneficiaries = ref()
const inDirectBeneficiaries = ref()

const getBeneficiaryCount = async () => {
  const formData = {}
  formData.model = 'beneficiary'
  formData.summaryFunction = 'count'


  // segregated by the settlement and county// Linking to be done later//
  formData.assoc_model = ['households']
  formData.summaryField = 'household.gender'
  formData.groupField = ['household.gender']

  var seriesData = []
  var indirectData = []

  // Directbeneficisaries 
  await getSummarybyFieldFromInclude(formData)
    .then(response => {
      var results = response.Total
      console.log(results)
      results.forEach(function (item) {
        let pieObjectEchart = {}
        let lbl = item.gender
        // for eacharts
        if (lbl) {
          pieObjectEchart.value = parseInt(item.count)
          pieObjectEchart.name = lbl
          seriesData.push(pieObjectEchart)
        }
      });
      directBeneficiaries.value = {
        title: {
          text: 'Direct Tenure Beneficiaries, by gender	',
          subtext: 'National Slum Mapping, 2023',
          left: 'center',
          textStyle: {
            fontSize: 14
          },
          subtextStyle: {
            fontSize: 12
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b} : {c} ({d}%)'

        },
        selectedMode: true,

        toolbox: {
          show: true,
          feature: {
            mark: { show: true },
            dataView: { show: true, readOnly: false },
            restore: { show: true },
            saveAsImage: { show: true, pixelRatio: 4 }
          }
        },
        legend: {
          orient: 'horizontal',
          type: 'scroll',
          bottom: 10
        },
        series: [
          {
            name: 'Proportion',
            type: 'pie',
            color: colorPalette,
            data: seriesData,
            radius: '70%',
            center: ['50%', '50%'],
            roseType: 'area',

            itemStyle: {
              borderRadius: 1,
              borderColor: '#fff',
              borderWidth: 1
            },
          }
        ]
      };

    });


  // indirectbeneficisaries 
  const indirect = {}
  indirect.model = 'beneficiary'
  indirect.summaryFunction = 'SUM'


  // segregated by the settlement and county// Linking to be done later//
  indirect.assoc_model = ['households']
  indirect.summaryField = 'household.age_30_34m'
  indirect.groupField = 'household.gender'

  await getSummarybyFieldFromInclude(indirect)
    .then(response => {
      var results = response.Total
      console.log(results)
      results.forEach(function (item) {
        let pieObjectEchart = {}
        let lbl = item.gender
        // for eacharts
        if (lbl) {
          pieObjectEchart.value = parseInt(item.SUM)
          pieObjectEchart.name = lbl
          indirectData.push(pieObjectEchart)
        }
      });

      console.log(indirectData)
      inDirectBeneficiaries.value = {
        title: {
          text: 'Indirect Tenure Beneficiaries, by gender	',
          subtext: 'National Slum Mapping, 2023',
          left: 'center',
          textStyle: {
            fontSize: 14
          },
          subtextStyle: {
            fontSize: 12
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b} : {c} ({d}%)'

        },
        selectedMode: true,

        toolbox: {
          show: true,
          feature: {
            mark: { show: true },
            dataView: { show: true, readOnly: false },
            restore: { show: true },
            saveAsImage: { show: true, pixelRatio: 4 }
          }
        },
        legend: {
          orient: 'horizontal',
          type: 'scroll',
          bottom: 10
        },
        series: [
          {
            name: 'Proportion',
            type: 'pie',
            color: colorPalette,
            data: indirectData,
            radius: '70%',
            center: ['50%', '50%'],
            roseType: 'area',

            itemStyle: {
              borderRadius: 1,
              borderColor: '#fff',
              borderWidth: 1
            },
          }
        ]
      };

    });


}


const getAllApi = async () => {
  await Promise.all([
    getUserAccessSource(),
    //  getUserAccesstoWater(),
    //getUserAccesstoHousing(),
    getWeeklyUserActivity(),
    getMonthlySales(),
    getBeneficiaryCount()
  ])
  loading.value = false
}

getAllApi()

</script>

<template>
  <PanelGroup />
  <ElRow :gutter="20" justify="space-between">
    <ElCol :xl="8" :lg="12" :md="24" :sm="24" :xs="24">
      <ElCard shadow="hover" class="mb-20px">
        <ElSkeleton :loading="loading" animated>
          <!-- <Echart :options="SlumsPerCountyChartData" :height="400" /> -->
          <!--           <apexchart :height="400" :type="radialBar" :options="progressOptions" :series="progresSeries" /> -->
          <Echart :options="directBeneficiaries" :height="350" />

        </ElSkeleton>
      </ElCard>
    </ElCol>
    <ElCol :xl="8" :lg="12" :md="24" :sm="24" :xs="24">
      <ElCard shadow="hover" class="mb-20px">
        <ElSkeleton :loading="loading" animated>
          <!-- <Echart :options="SlumsPerCountyChartData" :height="400" /> -->
          <!--           <apexchart :height="400" :type="radialBar" :options="progressOptions" :series="progresSeries" /> -->
          <Echart :options="inDirectBeneficiaries" :height="350" />

        </ElSkeleton>
      </ElCard>
    </ElCol>



  </ElRow>
</template>
