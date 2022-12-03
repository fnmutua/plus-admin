<script setup lang="ts">
import {
  ElRow, ElCol, ElCard, ElCollapse, ElCollapseItem, ElDivider, ElProgress, ElSkeleton
} from 'element-plus'
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
import Income from './components/StatusCards/Summary.vue'
import { getSummarybyField, getSummarybyFieldNested } from '@/api/summary'
import { Echart } from '@/components/Echart'



const { t } = useI18n()

const loading = ref(true)
const colorPalette = ['#ff007f', '#0000ff'];  // Male-Female

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


function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}


const getAverageIncome = async () => {
  const formData = {}
  formData.model = 'households'
  formData.summaryField = 'income_level'
  formData.summaryFunction = 'count'
  formData.groupField = 'income_level'
  const income_levels = await getSummarybyField(formData)
  // console.log('income_levels---->', income_levels)

}




///////--- Source of Water------------
const water_src_chartOptions = ref()
const water_src_series = ref()
//-----
const stackchartOptions = ref()
const stackchartSeries = ref()

const getWater = async () => {
  const formData = {}
  formData.model = 'households'
  formData.summaryField = 'source_water'
  formData.summaryFunction = 'count'
  formData.groupField = 'source_water'

  let categories = []
  let series = []

  getSummarybyField(formData)
    .then(response => {
      // console.log('waterssss----------', response.Total)
      var results = response.Total
      results.forEach(function (item) {
        let lbl = toTitleCase(item.source_water.replace("_", " "))
        categories.push(lbl)
        series.push(parseInt(item.count)) // very critcal eles wont display on the graph
      });
      //    console.log('----------', categories, series)
      water_src_chartOptions.value = {
        chart: {
          width: 380,
          type: 'pie',
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

            },
            export: {
              csv: {
                filename: undefined,
              },
              svg: {
                filename: undefined,
              },
              png: {
                filename: undefined,
              }
            },
            autoSelected: 'zoom'
          }
        },
        title: {
          text: 'Access to Drinking water',
          align: 'center'
        },
        subtitle: {
          text: 'National Slum Mapping, 2023',
          align: 'center'
        },
        dataLabels: {
          enabled: true
        },
        legend: {
          position: 'bottom'
        },
        labels: categories,
        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: 'bottom'
            }
          }
        }]
      }
      water_src_series.value = series
    });


  //-------------------------------------------------------------------//
  // segregated by the settlement and county// Linking to be done later//
  formData.assoc_model = ['settlement', 'county']
  formData.childGroupField = 'settlement.name'

  let clabels = []
  let subCategories = []
  var cData = []

  await getSummarybyFieldNested(formData)
    .then(response => {
      var results = response.Total
      //  console.log(results)
      results.forEach(function (item) {
        if (!clabels.includes(item.name)) {
          clabels.push(item.name);
        }
        if (!subCategories.includes(item.source_water)) {
          subCategories.push(item.source_water)
        }
      });
      // console.log('clabels....', clabels)
      subCategories.forEach(function (item) {
        var dataObj = {}
        dataObj.name = item
        dataObj.data = []
        results.forEach(function (dt) {
          if (dt.source_water == item)
            dataObj.data.push(parseInt(dt.count))
        })
        cData.push(dataObj)
      })
    });

  stackchartOptions.value = {
    title: {
      text: 'Access to Water Across Settlements in the Counties',
      align: 'center'
    },
    subtitle: {
      text: 'National Slum Mapping, 2023',
      align: 'center'
    },

    dataLabels: {
      enabled: false
    },
    chart: {
      type: 'bar',
      height: 350,
      stacked: true,
      stackType: '100%',
      toolbar: {
        show: true
      },
      zoom: {
        enabled: true,
        autoScaleYaxis: true,
        zoomedArea: {
          fill: {
            color: '#90CAF9',
            opacity: 0.4
          },
          stroke: {
            color: '#0D47A1',
            opacity: 0.4,
            width: 1
          }
        }
      }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        legend: {
          position: 'bottom',
          offsetX: -10,
          offsetY: 0
        }
      }
    }],
    xaxis: {
      categories: clabels,
      tickPlacement: 'on'

    },
    fill: {
      opacity: 1
    },
    legend: {
      position: 'right',
      offsetX: 0,
      offsetY: 50
    },
  }
  stackchartSeries.value = cData

  //-----------end-water------------------------------------


}



///////--- Health------------
//----------pie-----------
const health_access_chartOptions = ref()
const health_access_series = ref()
//-------------stack============
const healthStackchartOptions = ref()
const healthStackchartSeries = ref()

const getAccessTohealth = async () => {
  const formData = {}
  formData.model = 'households'
  formData.summaryField = 'access_health'
  formData.summaryFunction = 'count'
  formData.groupField = 'access_health'

  let categories = []
  let series = []

  getSummarybyField(formData)
    .then(response => {
      // console.log('waterssss----------', response.Total)
      var results = response.Total
      results.forEach(function (item) {
        let lbl = toTitleCase(item.access_health.replace("_", " "))
        categories.push(lbl)
        series.push(parseInt(item.count)) // very critcal eles wont display on the graph
      });
      //    console.log('----------', categories, series)
      health_access_chartOptions.value = {
        chart: {
          width: 380,
          type: 'pie',
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

            },
            export: {
              csv: {
                filename: undefined,
              },
              svg: {
                filename: undefined,
              },
              png: {
                filename: undefined,
              }
            },
            autoSelected: 'zoom'
          }
        },
        title: {
          text: 'Access to Health Services',
          align: 'center'
        },
        subtitle: {
          text: 'National Slum Mapping, 2023',
          align: 'center'
        },
        dataLabels: {
          enabled: true
        },
        legend: {
          position: 'bottom'
        },
        labels: categories,
        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: 'bottom'
            }
          }
        }]
      }
      health_access_series.value = series
    });


  //-------------------------------------------------------------------//
  // segregated by the settlement and county// Linking to be done later//
  formData.assoc_model = ['settlement', 'county']
  formData.childGroupField = 'settlement.name'

  let clabels = []
  let subCategories = []
  var cData = []

  await getSummarybyFieldNested(formData)
    .then(response => {
      var results = response.Total
      //   console.log(results)
      results.forEach(function (item) {
        if (!clabels.includes(item.name)) {
          clabels.push(item.name);
        }
        if (!subCategories.includes(item.access_health)) {
          subCategories.push(item.access_health)
        }
      });
      // console.log('clabels....', clabels)
      subCategories.forEach(function (item) {
        var dataObj = {}
        dataObj.name = item
        dataObj.data = []
        results.forEach(function (dt) {
          if (dt.access_health == item)
            dataObj.data.push(parseInt(dt.count))
        })
        cData.push(dataObj)
      })
    });

  healthStackchartOptions.value = {
    title: {
      text: 'Access to Health Services Settlements',
      align: 'center'
    },
    subtitle: {
      text: 'National Slum Mapping, 2023',
      align: 'center'
    },

    dataLabels: {
      enabled: false
    },
    chart: {
      type: 'bar',
      height: 350,
      stacked: true,
      stackType: '100%',
      toolbar: {
        show: true
      },
      zoom: {
        enabled: true,
        autoScaleYaxis: true,
        zoomedArea: {
          fill: {
            color: '#90CAF9',
            opacity: 0.4
          },
          stroke: {
            color: '#0D47A1',
            opacity: 0.4,
            width: 1
          }
        }
      }
    },
    responsive: [{
      breakpoint: 350,
      options: {
        legend: {
          position: 'bottom',
          offsetX: -10,
          offsetY: 0
        }
      }
    }],
    xaxis: {
      categories: clabels,
      tickPlacement: 'on'

    },
    fill: {
      opacity: 1
    },
    legend: {
      position: 'right',
      offsetX: 0,
      offsetY: 50
    },
  }
  healthStackchartSeries.value = cData

  //-----------end-water------------------------------------


}



///////---Gender------------

//----------pie-----------
const gender_chartOptions = ref()
const gender_series = ref()
const echartOptionsGender = ref()
const getGender = async () => {
  const formData = {}
  formData.model = 'households'
  formData.summaryField = 'gender'
  formData.summaryFunction = 'count'
  formData.groupField = 'gender'

  let categories = []
  let series = []

  let seriesData = []

  getSummarybyField(formData)
    .then(response => {
      var results = response.Total

      console.log(results)
      results.forEach(function (item) {
        let pieObjectEchart = {}
        let lbl = toTitleCase(item.gender.replace("_", " "))
        categories.push(lbl)
        series.push(parseInt(item.count)) // very critcal eles wont display on the graph

        // for eacharts
        pieObjectEchart.value = parseInt(item.count)
        pieObjectEchart.name = lbl
        seriesData.push(pieObjectEchart)


      });
      //    console.log('----------', categories, series)
      gender_chartOptions.value = {
        chart: {
          type: 'pie',
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

            },
            export: {
              csv: {
                filename: undefined,
              },
              svg: {
                filename: undefined,
              },
              png: {
                filename: undefined,
              }
            },
            autoSelected: 'zoom'
          }
        },
        title: {
          text: 'Population Proportion by Gender',
          align: 'center'
        },
        subtitle: {
          text: 'National Slum Mapping, 2023',
          align: 'center'
        },
        dataLabels: {
          enabled: true
        },
        legend: {
          position: 'bottom'
        },
        labels: categories,
        responsive: [
          {
            breakpoint: 1000,
            options: {
              plotOptions: {
                bar: {
                  horizontal: false
                }
              },
              legend: {
                position: "bottom"
              }
            }
          }
        ]
      }
      gender_series.value = series
    });

  echartOptionsGender.value = {
    title: {
      text: 'Population Proportion by Gender',
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



}



///////---Rent------------

const rentEchart = ref()
const getRent = async () => {
  const formData = {}
  formData.model = 'households'
  formData.summaryField = 'rent_payable'
  formData.summaryFunction = 'count'
  formData.groupField = 'rent_payable'

  let categories = []
  let series = []
  let seriesData = []

  getSummarybyField(formData)
    .then(response => {
      var results = response.Total
      results.forEach(function (item) {
        let pieObjectEchart = {}
        let lbl = toTitleCase(item.rent_payable.replace("_", "-"))
        categories.push(lbl)
        series.push(parseInt(item.count)) // very critcal eles wont display on the graph
        // for eacharts
        pieObjectEchart.value = parseInt(item.count)
        pieObjectEchart.name = lbl
        seriesData.push(pieObjectEchart)

      });


    });

  rentEchart.value = {
    title: {
      text: 'Proportion by Rent Payable',
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
      left: 'left',

      bottom: 10,
      textStyle: {
        fontSize: 10
      },
    },
    series: [
      {
        name: 'Proportion',
        type: 'pie',

        data: seriesData,
        radius: ['20%', '70%'],
        roseType: 'area',

        itemStyle: {
          borderRadius: 1,
          borderColor: '#fff',
          borderWidth: 1
        },
      }
    ]
  };
}



///////---Employments------------

const employment_chartOptions = ref()
const getEmployment = async () => {
  const formData = {}
  formData.model = 'households'
  formData.summaryField = 'emp_status'
  formData.summaryFunction = 'count'
  formData.groupField = 'emp_status'


  let series = []

  getSummarybyField(formData)
    .then(response => {
      var results = response.Total
      results.forEach(function (item) {
        let pieObjectEchart = {}
        let lbl = toTitleCase(item.emp_status.replace("_", "-"))
        //  categories.push(lbl)
        // series.push(parseInt(item.count)) // very critcal eles wont display on the graph

        // for eacharts
        pieObjectEchart.value = parseInt(item.count)
        pieObjectEchart.name = lbl
        series.push(pieObjectEchart)
      });

      employment_chartOptions.value = {
        title: {
          text: 'Employment Status ',
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
          bottom: 10,
          textStyle: {
            fontSize: 10
          },
        },

        series: [
          {
            name: 'Proportion',
            type: 'pie',

            data: series,
            radius: ['20%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 5,
              borderColor: '#fff',
              borderWidth: 1
            },

          }
        ]
      };
    });


}






///////--- Sanitation------------
const sanitation = ref([])
const getSanitation = async () => {
  const formData = {}
  formData.model = 'households'
  formData.summaryField = 'sanitation'
  formData.summaryFunction = 'count'
  formData.groupField = 'sanitation'
  sanitation.value = await getSummarybyField(formData)
  //  console.log('sanitation---->', sanitation.value)
}

///////--- Transport------------
const transport = ref([])
const getTransport = async () => {
  const formData = {}
  formData.model = 'households'
  formData.summaryField = 'mode_transport'
  formData.summaryFunction = 'count'
  formData.groupField = 'mode_transport'
  transport.value = await getSummarybyField(formData)
  //  console.log('transport---->', transport.value)
}



///////--- Solid Waste------------
const solid_waste = ref([])
const getSolidWaste = async () => {
  const formData = {}
  formData.model = 'households'
  formData.summaryField = 'solid_waste'
  formData.summaryFunction = 'count'
  formData.groupField = 'solid_waste'
  solid_waste.value = await getSummarybyField(formData)
  //  console.log('solid_waste---->', solid_waste.value)
}



///////--- Tenure------------
const tenure = ref([])
const getOwnershipStatus = async () => {
  const formData = {}
  formData.model = 'households'
  formData.summaryField = 'ownership_status'
  formData.summaryFunction = 'count'
  formData.groupField = 'ownership_status'
  tenure.value = await getSummarybyField(formData)
  // console.log('tenure---->', tenure.value)
}





////////////Housing----------------------------------

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

const getAllApi = async () => {
  await Promise.all([
    getUserAccessSource(),
    getAverageIncome(),
    getRent(),
    getEmployment(),
    getGender(),
    getWater(),
    getSanitation(),
    getTransport(),
    getAccessTohealth(),
    getSolidWaste(),
    getOwnershipStatus(),
    //  getUserAccesstoWater(),
    //getUserAccesstoHousing(),
    getWeeklyUserActivity(),
    getMonthlySales()
  ])
  loading.value = false
}

getAllApi()


//Demographics charts



//housing




// Water access by type


const activeCollapse = ref(['1'])
</script>

<template>
  <el-collapse v-model="activeCollapse">
    <el-collapse-item name="1">
      <template #title>
        <div class="text-20px text-700 myDiv">Summary </div>
      </template>
      <div>
        <Income />
        <el-divider content-position="left" />
        <ElRow class="mt-10px" :gutter="10" justify="space-between">
          <ElCol :xl="12" :lg="8" :md="24" :sm="24" :xs="24">
            <ElCard shadow="hover" class="mb-20px">
              <ElSkeleton :loading="loading" animated>
                <!-- <Echart :options="topCountiesWithSlumsData" :height="400" /> -->
                <!-- <apexchart :height="350" :options="gender_chartOptions" :series="gender_series" /> -->
                <Echart :options="echartOptionsGender" :height="350" />

              </ElSkeleton>
            </ElCard>
          </ElCol>
          <ElCol :xl="12" :lg="8" :md="24" :sm="24" :xs="24">
            <ElCard shadow="hover" class="mb-20px">
              <ElSkeleton :loading="loading" animated>
                <!-- <Echart :options="topCountiesWithSlumsData" :height="400" /> -->
                <!-- <apexchart :height="350" :options="rent_chartOptions" :series="rent_series" /> -->

                <Echart :options="rentEchart" :height="350" />





              </ElSkeleton>
            </ElCard>
          </ElCol>
          <ElCol :xl="12" :lg="8" :md="24" :sm="24" :xs="24">
            <ElCard shadow="hover" class="mb-20px">
              <ElSkeleton :loading="loading" animated>
                <!-- <Echart :options="topCountiesWithSlumsData" :height="400" /> -->
                <!-- <apexchart :height="350" :options="employment_chartOptions" :series="employment_series" /> -->
                <Echart :options="employment_chartOptions" :height="350" />


              </ElSkeleton>
            </ElCard>
          </ElCol>
        </ElRow>
      </div>
    </el-collapse-item>

    <el-collapse-item name="2">
      <template #title>
        <div class="text-20px text-700 myDiv">Health Services </div>
      </template>
      <div>
        <ElRow class="mt-10px" :gutter="10" justify="space-between">

          <ElCol :xl="8" :lg="16" :md="24" :sm="24" :xs="24">
            <ElCard shadow="hover" class="mb-20px">
              <ElSkeleton :loading="loading" animated>
                <!-- <Echart :options="topCountiesWithSlumsData" :height="400" /> -->
                <apexchart height="350" :options="healthStackchartOptions" :series="healthStackchartSeries" />
              </ElSkeleton>
            </ElCard>
          </ElCol>


          <ElCol :xl="8" :lg="8" :md="24" :sm="24" :xs="24">
            <ElCard shadow="hover" class="mb-20px">
              <ElSkeleton :loading="loading" animated>
                <!-- <Echart :options="SlumsPerCountyChartData" :height="400" /> -->
                <apexchart :height="400" :options="health_access_chartOptions" :series="health_access_series" />
              </ElSkeleton>
            </ElCard>
          </ElCol>


        </ElRow>
      </div>
    </el-collapse-item>

    <el-collapse-item name="3">
      <template #title>
        <div class="text-20px text-700 myDiv">Drinking Water</div>
      </template>
      <div>
        <ElRow class="mt-20px" :gutter="20" justify="space-between">
          <ElCol :xl="8" :lg="8" :md="24" :sm="24" :xs="24">
            <ElCard shadow="always" class="mb-20px">
              <ElSkeleton :loading="loading" animated>
                <apexchart :height="400" :options="water_src_chartOptions" :series="water_src_series" />
              </ElSkeleton>
            </ElCard>
          </ElCol>

          <ElCol :xl="8" :lg="16" :md="24" :sm="24" :xs="24">
            <ElCard shadow="always" class="mb-20px">
              <ElSkeleton :loading="loading" animated>
                <!-- <Echart :options="topCountiesWithSlumsData" :height="400" /> -->
                <apexchart height="350" :options="stackchartOptions" :series="stackchartSeries" />

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

<style scoped>
.percentage-value {
  display: block;
  margin-top: 10px;
  font-size: 28px;
}

.percentage-label {
  display: block;
  margin-top: 10px;
  font-size: 12px;
}

.demo-progress .el-progress--line {
  margin-bottom: 15px;
  width: 350px;
}

.demo-progress .el-progress--circle {
  margin-right: 15px;
}
</style>