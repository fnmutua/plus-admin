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

// Experiment with apex charts
const series = [
  {
    name: 'Number of Slums',
    data: [13, 14, 14, 17, 18, 20, 24, 99, 148]
  }
]

const chartOptions = {
  chart: {
    type: 'bar',
    height: 400
  },
  plotOptions: {
    bar: {
      barHeight: '100%',
      distributed: true,
      horizontal: true,
      dataLabels: {
        position: 'bottom'
      }
    }
  },
  colors: [
    '#f7f4f9',
    '#e7e1ef',
    '#d4b9da',
    '#c994c7',
    '#df65b0',
    '#e7298a',
    '#ce1256',
    '#980043',
    '#67001f'
  ],
  dataLabels: {
    enabled: true,
    textAnchor: 'start',
    style: {
      colors: ['#fff']
    },
    formatter: function (val, opt) {
      return opt.w.globals.labels[opt.dataPointIndex] + ':  ' + val
    },
    offsetX: 0,
    dropShadow: {
      enabled: true
    }
  },
  stroke: {
    width: 1,
    colors: ['#fff']
  },
  xaxis: {
    categories: [
      'Laikipia',
      'Migori',
      'Uasin Gishu',
      'Turkana',
      'Kiambu',
      'Nakuru',
      'Kirinyaga',
      'Mombasa',
      'Nairobi'
    ]
  },
  yaxis: {
    labels: {
      show: false
    }
  },
  title: {
    text: 'Counties with the highest number of Slums',
    align: 'center',
    style: {
      fontSize: '18px',
      fontWeight: 'bold',
      fontFamily: undefined,
      color: '#263238'
    },
    floating: true
  },
  subtitle: {
    text: 'National Slum Mapping, 2022',
    align: 'center'
  },
  tooltip: {
    theme: 'dark',
    x: {
      show: true
    },
    y: {
      title: {
        formatter: function () {
          return ''
        }
      }
    }
  }
}

const progresSeries = [240000, 560000]

const progressOptions = {
  chart: {
    width: 380,
    type: 'donut'
  },

  plotOptions: {
    pie: {
      startAngle: -90,
      endAngle: 270
    }
  },
  dataLabels: {
    enabled: true
  },
  fill: {
    type: 'gradient'
  },
  legend: {
    formatter: function (val, opts) {
      return val + ' - ' + opts.w.globals.series[opts.seriesIndex]
    }
  },
  title: {
    text: 'Enhanced Tenure Beneficiaries, by gender	',
    style: {
      fontSize: '18px',
      fontWeight: 'bold',
      fontFamily: undefined,
      color: '#263238'
    }
  },
  labels: ['Female', 'Male'],
  legend: {
    show: true,
    position: 'bottom'
  },
  toolbar: {
    tools: {
      download: true,
      selection: true,
      zoom: true,
      zoomin: true,
      zoomout: true,
      pan: true,
      reset: true | '<img src="/static/icons/reset.png" width="20">',
      customIcons: []
    }
  }
}
</script>

<template>
  <PanelGroup />
  <ElRow :gutter="20" justify="space-between">
    <ElCol :xl="8" :lg="12" :md="24" :sm="24" :xs="24">
      <ElCard shadow="hover" class="mb-20px">
        <ElSkeleton :loading="loading" animated>
          <!-- <Echart :options="SlumsPerCountyChartData" :height="400" /> -->
          <apexchart
            :height="400"
            :type="radialBar"
            :options="progressOptions"
            :series="progresSeries"
          />
        </ElSkeleton>
      </ElCard>
    </ElCol>

    <ElCol :xl="8" :lg="12" :md="24" :sm="24" :xs="24">
      <ElCard shadow="hover" class="mb-20px">
        <ElSkeleton :loading="loading" animated>
          <!-- <Echart :options="topCountiesWithSlumsData" :height="400" /> -->
          <apexchart type="bar" height="400" :options="chartOptions" :series="series" />
        </ElSkeleton>
      </ElCard>
    </ElCol>
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
  </ElRow>
</template>
