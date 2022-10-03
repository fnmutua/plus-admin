<script setup lang="ts">
import { ElRow, ElCol, ElCard, ElCollapse, ElCollapseItem, ElSkeleton } from 'element-plus'
import { pieOptions, barOptions, lineOptions } from './echarts-data'
import { ref, reactive } from 'vue'
import {
  getUserAccessSourceApi,
  getWeeklyUserActivityApi,
  getMonthlySalesApi
} from '@/api/dashboard/analysis'
import { set } from 'lodash-es'
import { EChartsOption } from 'echarts'
import { useI18n } from '@/hooks/web/useI18n'
import PanelGroup from './components/PanelGroup.vue'
import Income from './components/StatusCards/Income.vue'

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

////////////Housing----------------------------------

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

//housing
const housingSeries = [44, 55]
const housingFilename = 'housing'
const housingOptions = {
  chart: {
    type: 'pie',
    toolbar: {
      show: true,
      offsetX: 0,
      offsetY: 0,
      tools: {
        download: true
      },
      export: {
        csv: {
          filename: housingFilename,
          columnDelimiter: ',',
          headerCategory: 'category',
          headerValue: 'value',
          dateFormatter(timestamp) {
            return new Date(timestamp).toDateString()
          }
        },
        svg: {
          filename: housingFilename
        },
        png: {
          filename: housingFilename
        }
      }
    }
  },
  title: {
    text: 'Proportion of Structure owners within Slums',
    align: 'center'
  },
  subtitle: {
    text: 'National Slum Mapping, 2022',
    align: 'center'
  },
  dataLabels: {
    enabled: true
  },
  legend: {
    position: 'bottom'
  },
  labels: ['Own', 'Rent'],
  tickPlacement: 'on',
  total: {
    show: false
  },
  toolbar: {
    tools: {
      download: true,
      selection: true,
      zoom: true,
      zoomin: true,
      zoomout: true,
      pan: true,
      reset: true,
      customIcons: []
    }
  }
}

//housing permanent of structures
const structSeries = [25, 55, 30]
const structFilename = 'structure'
const StructOptions = {
  chart: {
    type: 'donut',
    toolbar: {
      show: true,
      offsetX: 0,
      offsetY: 0,
      tools: {
        download: true
      },
      export: {
        csv: {
          filename: structFilename,
          columnDelimiter: ',',
          headerCategory: 'category',
          headerValue: 'value',
          dateFormatter(timestamp) {
            return new Date(timestamp).toDateString()
          }
        },
        svg: {
          filename: structFilename
        },
        png: {
          filename: housingFilename
        }
      }
    }
  },
  dataLabels: {
    enabled: true
  },
  title: {
    text: 'Permanency of Structures within Slums',
    align: 'center'
  },
  subtitle: {
    text: 'National Slum Mapping, 2022',
    align: 'center'
  },
  legend: {
    position: 'bottom'
  },
  labels: ['Permanent', 'Semi-Permanent', 'Temporary'],

  toolbar: {
    tools: {
      download: true,
      selection: true,
      zoom: true,
      zoomin: true,
      zoomout: true,
      pan: true,
      reset: true,
      customIcons: []
    }
  }
}

//Duration of stay within a settleemnt
const ResidencySeries = [25, 55, 56, 70]
const ResidencyFilename = 'residency'
const ResidencyOptions = {
  chart: {
    type: 'donut',
    toolbar: {
      show: true,
      offsetX: 0,
      offsetY: 0,
      tools: {
        download: true
      },
      export: {
        csv: {
          filename: ResidencyFilename,
          columnDelimiter: ',',
          headerCategory: 'category',
          headerValue: 'value',
          dateFormatter(timestamp) {
            return new Date(timestamp).toDateString()
          }
        },
        svg: {
          filename: ResidencyFilename
        },
        png: {
          filename: ResidencyFilename
        }
      }
    }
  },
  dataLabels: {
    enabled: true
  },
  title: {
    text: 'Duration of stay within the settlement',
    align: 'center'
  },
  subtitle: {
    text: 'National Slum Mapping, 2022',
    align: 'center'
  },
  legend: {
    position: 'bottom'
  },
  labels: ['Less than 1 year', '1-5 years', '5-10 years', 'More than 10 years'],

  toolbar: {
    tools: {
      download: true,
      selection: true,
      zoom: true,
      zoomin: true,
      zoomout: true,
      pan: true,
      reset: true,
      customIcons: []
    }
  }
}

// Water access by type
const WaterSeries = [
  {
    name: 'Piped Water',
    data: [440, 505, 414, 671, 227, 413, 201, 352, 752, 320, 257, 160]
  },
  {
    name: 'Other Sources',
    data: [23, 42, 35, 27, 43, 22, 17, 31, 22, 22, 12, 16]
  }
]
const WaterFilename = 'Water'
const WaterOptions = {
  chart: {
    type: 'bar',
    height: 350,
    stacked: true,
    stackType: '100%',
    toolbar: {
      show: true,
      offsetX: 0,
      offsetY: 0,
      tools: {
        download: true,
        selection: true,
        zoom: true,
        zoomin: true,
        zoomout: true,
        pan: true,
        reset: true,
        customIcons: []
      },
      export: {
        csv: {
          filename: WaterFilename,
          columnDelimiter: ',',
          headerCategory: 'category',
          headerValue: 'value',
          dateFormatter(timestamp) {
            return new Date(timestamp).toDateString()
          }
        },
        svg: {
          filename: WaterFilename
        },
        png: {
          filename: WaterFilename
        }
      },
      autoSelected: 'zoom'
    }
  },

  title: {
    text: 'Access to Water'
  },
  dataLabels: {
    enabled: true
  },
  labels: [
    'Nyamira',
    'Muranga',
    'Busia',
    'Kisii',
    'Siaya',
    'Kwale',
    'Narok',
    'Wajir',
    'Kericho',
    'Nyandarua',
    'Bungoma',
    'Tana River'
  ],
  xaxis: {
    type: 'category'
  }
}

const PipedWaterSeries = [44, 55]
const PipedWaterFilename = 'PipedWater'
const PipedWaterOptions = {
  chart: {
    type: 'pie',
    toolbar: {
      show: true,
      offsetX: 0,
      offsetY: 0,
      tools: {
        download: true
      },
      export: {
        csv: {
          filename: PipedWaterFilename,
          columnDelimiter: ',',
          headerCategory: 'category',
          headerValue: 'value',
          dateFormatter(timestamp) {
            return new Date(timestamp).toDateString()
          }
        },
        svg: {
          filename: PipedWaterFilename
        },
        png: {
          filename: PipedWaterFilename
        }
      }
    }
  },
  title: {
    text: 'Access to piped water',
    align: 'center'
  },
  subtitle: {
    text: 'National Slum Mapping, 2022',
    align: 'center'
  },
  dataLabels: {
    enabled: true
  },
  legend: {
    position: 'bottom'
  },
  labels: ['Piped Water', 'Other Sources'],
  tickPlacement: 'on',
  total: {
    show: false
  },
  toolbar: {
    tools: {
      download: true,
      selection: true,
      zoom: true,
      zoomin: true,
      zoomout: true,
      pan: true,
      reset: true,
      customIcons: []
    }
  }
}

const activeCollapse = ref(['2'])
</script>

<template>
  <el-collapse v-model="activeCollapse">
    <el-collapse-item name="1">
      <template #title>
        <div class="text-20px text-700 myDiv"> Income </div>
      </template>
      <div>
        <Income />
      </div>
    </el-collapse-item>

    <el-collapse-item name="2">
      <template #title>
        <div class="text-20px text-700 myDiv">Housing </div>
      </template>
      <div>
        <ElRow class="mt-10px" :gutter="10" justify="space-between">
          <ElCol :xl="8" :lg="8" :md="24" :sm="24" :xs="24">
            <ElCard shadow="hover" class="mb-20px">
              <ElSkeleton :loading="loading" animated>
                <!-- <Echart :options="SlumsPerCountyChartData" :height="400" /> -->
                <apexchart :height="350" :options="housingOptions" :series="housingSeries" />
              </ElSkeleton>
            </ElCard>
          </ElCol>

          <ElCol :xl="8" :lg="8" :md="24" :sm="24" :xs="24">
            <ElCard shadow="hover" class="mb-20px">
              <ElSkeleton :loading="loading" animated>
                <!-- <Echart :options="topCountiesWithSlumsData" :height="400" /> -->
                <apexchart height="350" :options="StructOptions" :series="structSeries" />
              </ElSkeleton>
            </ElCard>
          </ElCol>
          <ElCol :xl="8" :lg="8" :md="24" :sm="24" :xs="24">
            <ElCard shadow="hover" class="mb-20px">
              <ElSkeleton :loading="loading" animated>
                <!-- <Echart :options="topCountiesWithSlumsData" :height="400" /> -->
                <apexchart height="350" :options="ResidencyOptions" :series="ResidencySeries" />
              </ElSkeleton>
            </ElCard>
          </ElCol>
        </ElRow>
      </div>
    </el-collapse-item>

    <el-collapse-item name="3">
      <template #title>
        <div class="text-20px text-700 myDiv">Water </div>
      </template>
      <div>
        <ElRow class="mt-20px" :gutter="20" justify="space-between">
          <ElCol :xl="8" :lg="8" :md="24" :sm="24" :xs="24">
            <ElCard shadow="always" class="mb-20px">
              <ElSkeleton :loading="loading" animated>
                <!-- <Echart :options="SlumsPerCountyChartData" :height="400" /> -->
                <apexchart :height="400" :options="PipedWaterOptions" :series="PipedWaterSeries" />
              </ElSkeleton>
            </ElCard>
          </ElCol>

          <ElCol :xl="8" :lg="16" :md="24" :sm="24" :xs="24">
            <ElCard shadow="always" class="mb-20px">
              <ElSkeleton :loading="loading" animated>
                <!-- <Echart :options="topCountiesWithSlumsData" :height="400" /> -->
                <apexchart height="350" :options="WaterOptions" :series="WaterSeries" />
              </ElSkeleton>
            </ElCard>
          </ElCol>
        </ElRow>
      </div>
    </el-collapse-item>
  </el-collapse>
</template>

<style>
.myDiv {
  text-align: center;
  padding-left: 10px;
}
</style>
