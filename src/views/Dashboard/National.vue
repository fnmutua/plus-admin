<script setup lang="ts">
import PanelGroup from './components/PanelGroup.vue'
import SettlementsChart from './components/SettlementsChart.vue'

import { ElRow, ElCol, ElCard, ElSkeleton } from 'element-plus'
import { Echart } from '@/components/Echart'
import {
  pieOptions,
  barOptions,
  lineOptions,
  waterOptions,
  housingOptions,
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
import VueApexCharts from 'vue-apexcharts'

const { t } = useI18n()

const loading = ref(true)

const pieOptionsData = reactive<EChartsOption>(pieOptions) as EChartsOption

// 用户来源
const getUserAccessSource = async () => {
  const res = await getUserAccessSourceApi().catch(() => {})
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

const waterOptionsData = reactive<EChartsOption>(waterOptions) as EChartsOption

const getUserAccesstoWater = async () => {
  const res = await getWaterAccessApi().catch(() => {})

  if (res) {
    console.log(res)
    set(
      waterOptionsData,
      'legend.data',
      res.data.map((v) => t(v.name))
    )
    waterOptionsData!.series![0].data = res.data.map((v) => {
      return {
        name: t(v.name),
        value: v.value
      }
    })
  }
}

////////////Housing----------------------------------
const housingOptionsData = reactive<EChartsOption>(housingOptions) as EChartsOption

const SlumsPerCountyChartData = reactive<EChartsOption>(SlumsPerCountyChart) as EChartsOption

const getUserAccesstoHousing = async () => {
  const res = await getWaterAccessApi().catch(() => {})
  if (res) {
    console.log(res)
    set(
      housingOptionsData,
      'legend.data',
      res.data.map((v) => t(v.name))
    )
    housingOptionsData!.series![0].data = res.data.map((v) => {
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
  const res = await getWeeklyUserActivityApi().catch(() => {})
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
  const res = await getMonthlySalesApi().catch(() => {})
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

const getAllApi = async () => {
  await Promise.all([
    getUserAccessSource(),
    //  getUserAccesstoWater(),
    //getUserAccesstoHousing(),
    getWeeklyUserActivity(),
    getMonthlySales()
  ])
  loading.value = false
}

getAllApi()
</script>

<template>
  <PanelGroup />
  <ElRow :gutter="20" justify="space-between">
    <ElCol :xl="10" :lg="12" :md="24" :sm="24" :xs="24">
      <ElCard shadow="hover" class="mb-10px">
        <ElSkeleton :loading="loading" animated>
          <Echart :options="housingOptionsData" :height="300" />
        </ElSkeleton>
      </ElCard>
    </ElCol>
    <ElCol :xl="8" :lg="12" :md="24" :sm="24" :xs="24">
      <ElCard shadow="hover" class="mb-20px">
        <ElSkeleton :loading="loading" animated>
          <Echart :options="waterOptionsData" :height="300" />
        </ElSkeleton>
      </ElCard>
    </ElCol>
    <ElCol :xl="8" :lg="28" :md="24" :sm="24" :xs="24">
      <ElCard shadow="hover" class="mb-20px">
        <ElSkeleton :loading="loading" animated>
          <Echart :options="SlumsPerCountyChartData" :height="400" />
        </ElSkeleton>
      </ElCard>
    </ElCol>
  </ElRow>
</template>
