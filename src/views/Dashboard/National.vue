<script setup lang="ts">
import PanelGroup from './components/PanelGroup.vue'

import { ElRow, ElCol, ElCard, ElSkeleton, ElTabs, ElTabPane, ElTable, ElTableColumn } from 'element-plus'
import { Echart } from '@/components/Echart'
import {
  pieOptions,
  barOptions,
  lineOptions
} from './echarts-data'
import { ref, reactive } from 'vue'
import {
  getUserAccessSourceApi,
  getWeeklyUserActivityApi,
  getWaterAccessApi,
  getMonthlySalesApi
} from '@/api/dashboard/analysis'
import { set } from 'lodash-es'
import { EChartsOption, registerMap } from 'echarts'
import { useI18n } from '@/hooks/web/useI18n'
import { getSummarybyField, getSummarybyFieldSimple, getSummarybyFieldNested } from '@/api/summary'
import * as turf from '@turf/turf'
import { getSummarybyFieldFromInclude, } from '@/api/summary'
import { getAllGeo } from '@/api/settlements'

const { t } = useI18n()
const countyGeo = ref([])
const settlementGeo = ref([])
const loading = ref(true)

const settlementsPercounty = ref([])
const settlementsPercountyMax = ref()
const settlementsPercountyMin = ref()
const aspect = ref()

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

let mArray = ref([])
let fArray = ref([])

// 每月销售总额

const pyramidOptions = ref()
const getSettlementPopPyramid = async () => {
  const formData = {}
  formData.model = 'households'
  formData.summaryFunction = 'sum'


  let mf = ['m', 'f']
  let fields = ['age_00_04', 'age_05_09', 'age_10_14', 'age_15_19', 'age_20_24', 'age_24_29', 'age_30_34', 'age_35_39', 'age_40_44', 'age_45_49', 'age_50_54', 'age_55_59', 'age_60_64', 'age_65_69', 'age_70_plus']


  // Asccoiated models 
  formData.assoc_model = ['county']
  formData.childGroupField = 'county.name'

  // looop to genrate male female fields 
  for (var i = 0; i < mf.length; i++) {

    // get summary for each field   
    for (var j = 0; j < fields.length; j++) {
      formData.summaryField = fields[j] + mf[i]
      await getSummarybyFieldSimple(formData)
        .then(response => {
          var results = response.Total
          //console.log("pyramid", results[0].sum)
          let summary = results[0].sum

          if (mf[i] == 'm') {
            mArray.value.push(summary)
          } else {
            fArray.value.push(-1 * summary)
          }
        });


    }
  }

  console.log("Males -", mArray)
  console.log("Females -", fArray)

  pyramidOptions.value = {
    title: {
      text: 'Informal Settlements Age-Gender Profile',
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
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      valueFormatter: (value) => Math.abs(value)
    },
    legend: {
      itemWidth: 20,
      itemHeight: 20,
      orient: 'horizontal',
      type: 'scroll',
      left: 'left',
      top: 10,
      data: [
        {
          name: 'Male',
          icon: 'path://m 146.41936,238.8034 c -5.21101,-1.43402 -7.51545,-6.79358 -6.6619,-11.76943 -0.0588,-45.10952 -0.11757,-90.21905 -0.17635,-135.328563 -5.3022,-1.61412 -3.06375,4.34199 -3.52464,7.58816 -0.0576,14.697923 -0.11511,29.395843 -0.17266,44.093773 -1.72718,6.61806 -12.15586,7.45944 -14.19605,0.88682 -1.42909,-4.98857 -0.22146,-10.60033 -0.62062,-15.83232 0.10773,-15.18837 -0.21551,-30.437173 0.16059,-45.587893 1.91842,-11.228608 12.80383,-20.22421 24.26927,-18.689786 10.60777,1.558898 0.0755,-3.65768 -0.79236,-8.596161 -4.23852,-8.688715 0.80002,-20.073014 9.72708,-23.421847 8.82591,-4.162774 20.30103,1.001172 23.52581,10.108188 2.28945,5.67583 1.4368,12.853955 -2.76118,17.571486 -5.15831,4.024926 -3.94241,5.010805 1.85043,4.362909 13.58742,-1.603119 25.03585,11.840701 23.9554,24.967141 -0.0691,18.213333 -0.13818,36.426673 -0.20726,54.640013 -1.5351,4.55905 -7.30638,6.71543 -11.30858,3.96578 -4.81473,-2.8888 -2.73019,-9.20279 -3.19227,-13.88869 -0.0523,-14.05586 -0.10469,-28.11173 -0.15704,-42.167583 -4.85271,-1.54237 -3.37467,3.24601 -3.51022,6.4208 V 231.02616 c -1.3114,6.77368 -9.29063,10.3384 -15.13544,6.61747 -6.62075,-3.7866 -4.17124,-12.04397 -4.62011,-18.29166 v -70.84935 c -4.85175,-1.54283 -3.39102,3.24111 -3.53094,6.42079 -0.0578,25.5528 -0.11553,51.1056 -0.17329,76.65839 -1.7387,5.48439 -7.13811,8.77105 -12.74767,7.2216 z',
        },
        {
          name: 'Female',
          icon: 'path://m 39.7122,238.0264 c -5.604205,-1.49359 -5.822698,-7.32898 -5.431108,-11.96235 -0.05932,-18.97406 -0.118632,-37.94813 -0.177948,-56.92219 -7.401109,0.0507 -14.802279,0.16954 -22.203547,0.1438 8.050221,-26.97466 15.83106,-54.03787 24.0791,-80.948455 -6.246873,-1.537447 -5.103818,6.332986 -7.12857,10.198179 -4.203419,12.783656 -7.28462,25.995046 -12.31951,38.467156 C 6.215777,147.43407 -0.93895389,129.58252 6.2279437,121.52707 11.709639,105.71684 15.006783,88.999576 22.521999,73.9779 25.487431,65.143259 38.425956,64.174487 43.879817,63.247984 35.242261,58.307767 32.195248,46.181151 37.843175,37.985287 c 5.35176,-7.73122 16.727442,-10.988636 24.757146,-5.16531 11.321083,6.562216 10.452089,25.024381 -1.135269,30.670395 9.830628,-0.28155 20.086569,3.623662 24.845207,12.765524 3.87086,7.45858 5.12438,16.169298 8.137928,24.037484 2.906124,10.26421 6.922833,20.35157 9.297803,30.70045 1.06345,4.17564 -1.66552,9.02385 -6.181687,9.2796 -7.686885,1.11419 -8.783192,-8.80355 -10.70406,-14.18732 -3.87502,-12.5653 -7.681429,-25.15172 -11.575988,-37.711005 -8.798872,-0.113812 1.949333,13.898795 1.781574,19.941085 6.048408,20.20812 12.13493,40.40517 18.089502,60.64114 -7.392371,0.35953 -14.803078,0.14681 -22.203496,0.20388 -0.06597,21.22546 -0.131933,42.45093 -0.1979,63.67639 -2.103142,7.13406 -13.415648,7.74398 -15.969932,0.84281 -1.418088,-4.77754 -0.245017,-10.18282 -0.655178,-15.20454 l -0.156843,-49.31466 c -4.44248,-1.05339 -5.844521,0.93365 -4.913879,5.25338 -0.162881,19.18788 0.325808,38.44483 -0.244801,57.58947 -0.334387,5.03435 -6.719798,7.8699 -11.101102,6.02234 z',
        }
      ]
    },
    toolbox: {
      show: true,
      feature: {
        mark: { show: true },
        dataView: { show: true, readOnly: true },
        restore: { show: true },
        saveAsImage: { show: true, pixelRatio: 4 }
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'value',
        show: true,
        axisLabel: {
          formatter: function (params) {
            return Math.abs(params);
          }
        }
      }
    ],
    yAxis: [
      {
        type: 'category',
        axisTick: {
          show: false
        },
        nameTextStyle: {
          fontStyle: 'oblique',
          fontWeight: 'bold'
        },
        data: [
          '00-04',
          '05-09',
          '10-14',
          '15-19',
          '20-24',
          '25-29',
          '30-34',
          '35-39',
          '40-44',
          '45-49',
          '50-54',
          '55-59',
          '60-64',
          '65-69',
          '70+',
        ]
      }
    ],
    series: [
      {
        name: 'Female',
        type: 'bar',
        color: '#ff007f',
        stack: 'Total',
        label: {
          show: false,
          position: 'right'
        },
        emphasis: {
          focus: 'none'
        },
        data: fArray
      },
      {
        name: 'Male',
        type: 'bar',
        color: '#0000ff',
        stack: 'Total',
        label: {
          show: false,
          position: 'left',
          formatter: function (params) {
            return Math.abs(params.value);
          }
        },
        emphasis: {
          focus: 'none'
        },
        data: mArray
      }
    ]
  };

}


const countofSlumsByCountyOptions = ref()
const settlementsPerCountTable = ref()
const getSettlementCountByCounty = async () => {
  const formData = {}
  formData.model = 'settlement'
  formData.summaryField = 'county_id'
  formData.summaryFunction = 'count'
  formData.groupField = ['county_id']

  // Asccoiated models 
  formData.assoc_model = ['county']
  formData.childGroupField = 'county.name'

  let subCategories = []
  var cData = []

  await getSummarybyFieldNested(formData)
    .then(response => {
      var results = response.Total
      console.log('settlements by county', results)

      let topTen = results.slice(0, 10)   // get the top 10
      topTen.forEach(function (item) {
        cData.push(parseInt(item.count))
        subCategories.push(item.name)
      });

      // process nuber of settlemtns per county 

      results.forEach(function (item) {
        var cntySlums = {}
        cntySlums.name = item.name
        cntySlums.value = parseInt(item.count)
        cntySlums.NoSlums = parseInt(item.count)
        settlementsPercounty.value.push(cntySlums)

      });

      console.log("settlements by county - II", settlementsPercounty.value)
      settlementsPercountyMax.value = Math.max(...settlementsPercounty.value.map(o => o.value))
      settlementsPercountyMin.value = Math.min(...settlementsPercounty.value.map(o => o.value))




    });

  countofSlumsByCountyOptions.value = {
    title: {
      text: 'Counties with the highest number of informal settlements (10)',
      subtext: 'National Slum Mapping, 2023',
      left: 'center',
      textStyle: {
        fontSize: 14
      },
      subtextStyle: {
        fontSize: 12
      }
    },
    toolbox: {
      show: true,
      feature: {
        mark: { show: true },
        dataView: { show: true, readOnly: true },
        restore: { show: true },
        saveAsImage: { show: true, pixelRatio: 4 }
      }
    },
    dataZoom: [
      {
        type: 'slider',
        height: 20,
        bottom: 10,
        start: 0,
        end: 100
      }
    ],
    xAxis: {
      type: 'category',
      data: subCategories,
      axisTick: {
        alignWithLabel: true
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },

    yAxis: {
      type: 'value'
    },
    series: [
      {
        data: cData,
        type: 'bar',
        showBackground: true,
        backgroundStyle: {
          color: 'rgba(180, 180, 180, 0.2)'
        }
      }
    ]
  };

}



const mapOption = ref()
const getCountyGeo = async () => {
  const formData = {}
  formData.model = 'county'
  const res = await getAllGeo(formData)
  console.log(res.data[0].json_build_object)
  if (res.data[0].json_build_object.features) {
    countyGeo.value = res.data[0].json_build_object
    console.log("County-geo", countyGeo.value)

    var bbox = turf.bbox(countyGeo.value);
    const y_coord = (bbox[1] + bbox[3]) / 2;
    aspect.value = Math.cos(y_coord * Math.PI / 180);
    // console.log(aspect.value)
    registerMap('KE', countyGeo.value);
    mapOption.value = {
      title: {
        text: 'Informal Settlements per county',
        subtext: 'National Slum Mapping, 2023',
        sublink: 'https://kisip.go.ke/',
        left: 'right',
        textStyle: {
          fontSize: 14
        },
      },
      tooltip: {
        trigger: 'item',
        showDelay: 0,
        transitionDuration: 0.2
      },
      visualMap: {
        left: 'right',
        min: settlementsPercountyMin,
        max: settlementsPercountyMax,
        inRange: {
          color: [
            '#313695',
            '#4575b4',
            '#74add1',
            '#abd9e9',
            '#e0f3f8',
            '#ffffbf',
            '#fee090',
            '#fdae61',
            '#f46d43',
            '#d73027',
            '#a50026'
          ]
        },
        text: ['High', 'Low'],
        calculable: true
      },
      toolbox: {
        show: true,
        //orient: 'vertical',
        left: 'left',
        top: 'top',
        feature: {
          dataView: { readOnly: true },
          restore: {},
          saveAsImage: {}
        }
      },
      series: [
        {
          name: '# Settlements',
          type: 'map',
          roam: true,
          map: 'KE',
          aspectScale: aspect.value,
          emphasis: {
            label: {
              show: true
            }
          },
          data: settlementsPercounty.value
        }
      ]
    };

    console.log("mapOption", mapOption)


  }

  // getSettlementCountByCounty() // This is only called the first time for the first graph
}




const settlementsPop = ref([])
const settlementsPopMax = ref()
const settlementsPopMin = ref()
const settlementPopulationMap = ref()


const getSettlementPopulation = async () => {
  const formData = {}
  formData.model = 'settlement'
  formData.summaryFunction = 'SUM'


  // segregated by the settlement and county// Linking to be done later//
  formData.assoc_model = ['county']
  formData.summaryField = 'settlement.population'
  formData.groupField = ['county.name']


  // Directbeneficisaries 
  await getSummarybyFieldFromInclude(formData)
    .then(response => {
      var results = response.Total
      console.log('settlement ---> pop', results)
      results.forEach(function (item) {
        var cntySlums = {}
        cntySlums.name = item.name
        cntySlums.value = parseInt(item.SUM)
        settlementsPop.value.push(cntySlums)
      });

      console.log("settlements Population  by county - II", settlementsPop.value)
      settlementsPopMax.value = Math.max(...settlementsPop.value.map(o => o.value))
      settlementsPopMin.value = Math.min(...settlementsPop.value.map(o => o.value))

    });

  settlementPopulationMap.value = {
    title: {
      text: 'Population in informal Settlements per county',
      subtext: 'National Slum Mapping, 2023',
      sublink: 'https://kisip.go.ke/',
      left: 'right',
      textStyle: {
        fontSize: 14
      },
    },
    tooltip: {
      trigger: 'item',
      showDelay: 0,
      transitionDuration: 0.2
    },
    visualMap: {
      left: 'right',
      min: settlementsPopMax,
      max: settlementsPopMin,
      inRange: {
        color: [
          '#313695',
          '#4575b4',
          '#74add1',
          '#abd9e9',
          '#e0f3f8',
          '#ffffbf',
          '#fee090',
          '#fdae61',
          '#f46d43',
          '#d73027',
          '#a50026'
        ]
      },
      text: ['High', 'Low'],
      calculable: true
    },
    toolbox: {
      show: true,
      //orient: 'vertical',
      left: 'left',
      top: 'top',
      feature: {
        dataView: { readOnly: true },
        restore: {},
        saveAsImage: {}
      }
    },
    series: [
      {
        name: '# persons in informal settlements',
        type: 'map',
        roam: true,
        map: 'KE',
        aspectScale: aspect,
        emphasis: {
          label: {
            show: true
          }
        },
        data: settlementsPop.value
      }
    ]
  };

}



const getAllApi = async () => {
  await Promise.all([
    // getUserAccessSource(),
    // getCountyGeo(),
    getSettlementPopulation(),
    getSettlementCountByCounty(),
    getSettlementPopPyramid(),


  ])
  loading.value = false
}
getCountyGeo()
getAllApi()




// Experiment with apex charts

//Demographics charts


const activeName = ref('chart')




</script>

<template>
  <PanelGroup />

  <el-tabs v-loading="loading" element-loading-text="Generating maps, charts and tables......." v-model="activeName"
    class="demo-tabs">
    <el-tab-pane label="Chart" name="chart">
      <ElRow :gutter="20" justify="space-between">
        <ElCol :xl="8" :lg="12" :md="24" :sm="24" :xs="24">
          <ElCard shadow="hover" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <Echart :options="pyramidOptions" :height="350" />
            </ElSkeleton>
          </ElCard>
        </ElCol>
        <ElCol :xl="8" :lg="12" :md="24" :sm="24" :xs="24">
          <ElCard shadow="hover" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <!-- <Echart :options="topCountiesWithSlumsData" :height="400" /> -->
              <Echart :options="countofSlumsByCountyOptions" :height="350" />

            </ElSkeleton>
          </ElCard>
        </ElCol>
      </ElRow>


    </el-tab-pane>
    <el-tab-pane label="Map" name="map">
      <ElRow :gutter="20" justify="space-between">
        <ElCol :xl="8" :lg="12" :md="24" :sm="24" :xs="24">
          <ElCard shadow="hover" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <!-- <Echart :options="topCountiesWithSlumsData" :height="400" /> -->
              <Echart :options="mapOption" :height="350" />

            </ElSkeleton>
          </ElCard>
        </ElCol>
        <ElCol :xl="8" :lg="12" :md="24" :sm="24" :xs="24">
          <ElCard shadow="hover" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <!-- <Echart :options="topCountiesWithSlumsData" :height="400" /> -->
              <Echart :options="settlementPopulationMap" :height="350" />

            </ElSkeleton>
          </ElCard>
        </ElCol>
      </ElRow>
    </el-tab-pane>
    <el-tab-pane label="Table" name="table">
      <ElRow :gutter="20" justify="space-between">
        <ElCol :xl="24" :lg="24" :md="24" :sm="24" :xs="24">
          <ElCard shadow="hover" class="mb-20px">
            <template #header>
              <div class="card-header">
                <span>Number of informal Settlements within Counties of Kenya</span>
                <download-excel :data="settlementsPercounty" worksheet="SettlementsPerCounty"
                  name="SettlementsPerCounty.xls">
                  <font-awesome-icon size="2x" color='red' icon="fa-solid fa-download" />
                </download-excel>
              </div>
            </template>

            <ElSkeleton :loading="loading" animated>

              <el-table height="350" stripe border show-summary :data="settlementsPercounty"
                :default-sort="{ prop: 'NoSlums', order: 'descending' }" style="width: 100%">
                <el-table-column prop="name" label="Name" sortable />
                <el-table-column prop="NoSlums" label="Number of Informal Settlements" sortable />

              </el-table>
            </ElSkeleton>
          </ElCard>
        </ElCol>

      </ElRow>


    </el-tab-pane>
  </el-tabs>


</template>


<style>
.demo-tabs>.el-tabs__content {
  padding: 1px;
  color: hsl(218, 58%, 45%);
  font-size: 16px;
  font-weight: 600;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text {
  font-size: 12px;
}

.item {
  margin-bottom: 18px;
}

.box-card {
  width: 480px;
}
</style>
 