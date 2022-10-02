<script setup lang="ts">
import PanelGroup from './components/PanelGroup.vue'
import SettlementsChart from './components/SettlementsChart.vue'
import VueApexCharts from 'vue-apexcharts'

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

const SlumsPerCountyChartData = reactive<EChartsOption>(SlumsPerCountyChart) as EChartsOption

const topCountiesWithSlumsData = reactive<EChartsOption>(topCountiesWithSlums) as EChartsOption

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

//Demographics charts

const demographSeries = [
  {
    name: 'Males',
    data: [0.4, 0.65, 0.76, 0.88, 1.5, 2.1, 2.9, 3.8, 3.9, 4.2, 4, 4.3, 4.1, 4.2, 4.5, 3.9, 3.5, 3]
  },
  {
    name: 'Females',
    data: [
      -0.8, -1.05, -1.06, -1.18, -1.4, -2.2, -2.85, -3.7, -3.96, -4.22, -4.3, -4.4, -4.1, -4, -4.1,
      -3.4, -3.1, -2.8
    ]
  }
]

const demographOptions = {
  chart: {
    type: 'bar',
    height: 440,
    stacked: true
  },
  colors: ['#008FFB', '#FF4560'],
  plotOptions: {
    bar: {
      horizontal: true,
      barHeight: '80%'
    }
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    width: 1,
    colors: ['#fff']
  },

  grid: {
    xaxis: {
      lines: {
        show: false
      }
    }
  },
  yaxis: {
    min: -5,
    max: 5,
    title: {
      // text: 'Age',
    }
  },
  tooltip: {
    shared: false,
    x: {
      formatter: function (val) {
        return val
      }
    },
    y: {
      formatter: function (val) {
        return Math.abs(val) + '%'
      }
    }
  },
  title: {
    text: "Kenya's Slum Population Pyramid",
    align: 'center',
    style: {
      fontSize: '18px',
      fontWeight: 'bold',
      fontFamily: undefined,
      color: '#263238'
    }
  },
  subtitle: {
    text: 'National Slum Mapping, 2022',
    align: 'center'
  },
  xaxis: {
    categories: [
      '85+',
      '80-84',
      '75-79',
      '70-74',
      '65-69',
      '60-64',
      '55-59',
      '50-54',
      '45-49',
      '40-44',
      '35-39',
      '30-34',
      '25-29',
      '20-24',
      '15-19',
      '10-14',
      '5-9',
      '0-4'
    ],
    title: {
      text: 'Percent',
      align: 'center'
    },

    labels: {
      formatter: function (val) {
        return Math.abs(Math.round(val)) + '%'
      }
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
            :type="bar"
            :options="demographOptions"
            :series="demographSeries"
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
