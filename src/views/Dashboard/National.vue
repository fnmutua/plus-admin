<script setup lang="ts">
import {
  ElRow, ElCol, ElCard, ElTabs, ElTabPane, ElSkeleton
} from 'element-plus'
import { ElTable, ElButton, ElTableColumn } from 'element-plus'
import xlsx from "json-as-xlsx"

import { ref } from 'vue'
import { registerMap } from 'echarts'
import { useI18n } from '@/hooks/web/useI18n'
import { Echart } from '@/components/Echart'

import * as turf from '@turf/turf'
import { getAllGeo } from '@/api/settlements'
import { getSummarybyFieldNested, getSummaryGroupByMultipleFields } from '@/api/summary'


import { use } from "echarts/core";
import { GaugeChart } from "echarts/charts";
import PanelGroup from './components/PanelGroup.vue'
import {
  Download
} from '@element-plus/icons-vue'
import { computed } from 'vue'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useRoute } from 'vue-router'
import { getSummarybyFieldFromMultipleIncludes } from '@/api/summary'


use([
  GaugeChart
]);




const { t } = useI18n()

const loading = ref(true)
const countyGeo = ref([])



const aspect = ref()
const appStore = useAppStoreWithOut()







// use shorter chart titles for mobile and longer ones for large screens
// initialize with long titles
const pyramidChartTitle = ref("Slums/Informal Settlements Age-Gender Profile")
const topSlumCountiesTitle = ref("Top Counties: Slums/Informal Settlements")
const informalSettlementpercountyMapTitle = ref("Slums/Informal Settlements per county")
const informalSettlementPopMapTitle = ref("Population  Density in Slums/Informal Settlements per County")
const TableTitle = ref("Number of Slums/Informal Settlements within Counties of Kenya")
const ShowLegend = ref(true)
const isMobile = computed(() => appStore.getMobile)

console.log('isMobile', isMobile.value)


if (isMobile.value) {
  pyramidChartTitle.value = "Profile"
  topSlumCountiesTitle.value = "Top 10 Counties"
  informalSettlementpercountyMapTitle.value = "Distribution of Slums"
  informalSettlementPopMapTitle.value = "Slum Population Density"
  TableTitle.value = "Slums per County"
  ShowLegend.value = false

}




const getCountyGeo = async () => {
  const formData = {}
  formData.model = 'county'
  const res = await getAllGeo(formData)
  //  console.log(res.data[0].json_build_object)
  if (res.data[0].json_build_object.features) {
    countyGeo.value = res.data[0].json_build_object
    //  console.log("County-geo", countyGeo.value)

    var bbox = turf.bbox(countyGeo.value);
    const y_coord = (bbox[1] + bbox[3]) / 2;
    aspect.value = Math.cos(y_coord * Math.PI / 180);
    //   console.log(aspect.value)
    registerMap('KE', countyGeo.value);


  }

  // getSettlementCountByCounty() // This is only called the first time for the first graph
}




const pyramidOptions = ref()

let mArray = ref([])
let fArray = ref([])



const countofSlumsByCountyOptions = ref()


const settlementsPop = ref([])
const settlementsPopMax = ref()
const settlementsPopMin = ref()
const settlementPopulationMap = ref()
const settlementCountMap = ref()


const settlementsCountMax = ref()
const settlementsCountMin = ref()
const settlementsCount = ref([])

const getSettlementsCountyMap = async () => {
  const formData = {}


  formData.model = 'settlement'
  formData.summaryField = 'settlement.county_id'
  formData.summaryFunction = 'count'

  // filter by field 
  formData.filterField = 'isApproved'
  formData.filterValue = ['Approved'] //

  // Asccoiated models 
  formData.assoc_models = ['county']
  formData.groupFields = ['county.name']
  formData.cache_key = 'getSettlementCountySettlementCountMap1'

  await getSummarybyFieldFromMultipleIncludes(formData)
    .then(response => {

      console.log('Rsponse form filtred counts', response)


      var results = response.Total
      console.log('settlement --001-> pop', results)
      results.forEach(function (item) {
        var cntySlums = {}
        cntySlums.name = item.name
        cntySlums.value = parseInt(item.count)
        settlementsCount.value.push(cntySlums)
      });

      console.log("settlements Population  by county - II", settlementsCount.value)
      settlementsCountMax.value = Math.max(...settlementsCount.value.map(o => o.value))
      settlementsCountMin.value = Math.min(...settlementsCount.value.map(o => o.value))

    });

  console.log("Count per county >>>>>", settlementsCount)
  settlementCountMap.value = {
    title: {
      text: informalSettlementpercountyMapTitle,
      subtext: 'National Slum Database, 202323',
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
      min: settlementsCountMin,
      max: settlementsCountMax,
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
        data: settlementsCount.value
      }
    ]
  };

}



const settMaxPopDensity = ref()
const settMinPopDensity = ref()
const settPopDensity = ref([])

const getSettlementPopulation = async () => {
  const formData = {}


  formData.model = 'settlement'
  formData.summaryField = 'settlement.pop_density'
  formData.summaryFunction = 'AVG'

  // filter by field 
  formData.filterField = 'isApproved'
  formData.filterValue = ['Approved'] //

  // Asccoiated models 
  formData.assoc_models = ['county']
  formData.groupFields = ['county.name']
  formData.cache_key = 'getSettlementCountySettlementPopMap'

  await getSummarybyFieldFromMultipleIncludes(formData)
    .then(response => {

      console.log('Rsponse form filtred counts', response)


      var results = response.Total
      console.log('settlement ---> pop AVG', results)
      results.forEach(function (item) {
        var cntySlums = {}
        cntySlums.name = item.name
        cntySlums.value = (item.AVG)
        settPopDensity.value.push(cntySlums)
      });
      settMaxPopDensity.value = Math.max(...settPopDensity.value.map(o => o.value))
      settMinPopDensity.value = Math.min(...settPopDensity.value.map(o => o.value))

    });


  console.log('settlementCountMapMax', settMaxPopDensity.value)
  console.log('settlementsPopMin', settMinPopDensity.value)




  settlementPopulationMap.value = {
    title: {
      text: informalSettlementPopMapTitle,
      subtext: 'National Slum Database, 202323',
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
      min: settMinPopDensity,
      max: settMaxPopDensity,
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
        data: settPopDensity.value
      }
    ]
  };

}

const settlementsPercounty = ref([])
const settlementsPercountyMax = ref()
const settlementsPercountyMin = ref()

const getTopSettlementCountByCounty = async () => {
  const formData = {}
  formData.model = 'settlement'
  formData.summaryField = 'settlement.county_id'
  formData.summaryFunction = 'count'

  // filter by field 
  formData.filterField = 'isApproved'
  formData.filterValue = ['Approved']  //

  // Asccoiated models 
  formData.assoc_models = ['county']
  formData.groupFields = ['county.name']
  formData.cache_key = 'top10Counties'

  let subCategories = []
  var cData = []

  await getSummarybyFieldFromMultipleIncludes(formData)
    .then(response => {
      var results = response.Total
      console.log('settlements by county - 2023', results)

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


  console.log(settlementsPercountyMax, settlementsPercountyMin)

  countofSlumsByCountyOptions.value = {
    title: {
      text: topSlumCountiesTitle,
      subtext: 'National Slum Database, 2023',
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


const getSettlementPopPyramid = async () => {
  const formData = {}
  formData.model = 'households'
  formData.summaryFunction = 'sum'

 
  let males = ['age_00_04f',  'age_05_09f',  'age_10_14f','age_15_19f', 'age_20_24f', 'age_25_29f',  'age_30_34f',  'age_35_39f',  'age_40_44f', 'age_45_49f', 'age_50_54f',  'age_55_59f', 'age_60_64f', 'age_65_69f', 'age_gt_70f'  ]

let females = [ 'age_00_04m', 'age_05_09m', 'age_10_14m',  'age_15_19m', 'age_20_24m','age_25_29m','age_30_34m','age_35_39m','age_40_44m', 'age_45_49m', 'age_50_54m','age_55_59m',  'age_60_64m', 'age_65_69m','age_gt_70m']
  const fields = females.concat(males);


  // Asccoiated models 
  formData.assoc_model = ['settlement']
  formData.summaryFields = fields
  formData.groupField = 'gender'

  formData.cache_key = 'getSettlementPopPyramid_by_gender'

  await getSummaryGroupByMultipleFields(formData)
    .then(response => {
      if (response.Total) {
        console.log('Reponses -->', response)
        var results = response.Total
        let keys = Object.keys(results[0]);

        // Males
        let maleKeys = keys.filter(key => key.includes("m"));
        let males = maleKeys.map(key => results[0][key])
        // console.log('pyramid---m-->', males)

        mArray.value.push(males)


        // females
        let femaleKeys = keys.filter(key => key.includes("f"));
        let females = femaleKeys.map(key => results[0][key])
        //console.log('pyramid---f-->', femaleKeys, females)
        fArray.value.push(females)



        pyramidOptions.value = {
          title: {
            text: pyramidChartTitle,
            subtext: 'National Slum Database, 2023',
            left: 'center',
            textStyle: {
              fontSize: 14,
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
            show: ShowLegend,
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
              data: males.map(string => parseInt(string))
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
              data: females.map(string => parseInt(string))
            }
          ]
        };
      }


    });




}


const DownloadXlsx = async () => {
  console.log(settlementsPercounty.value)

  // change here !
  let fields = [
    { label: "S/No", value: "index" }, // Top level data
    { label: "Name", value: "name" }, // Top level data
    { label: "Number of Slums/Informal Settlements", value: "count" }, // Custom format

  ]

  // Preprae the data object 
  var dataObj = {}
  dataObj.sheet = 'data'
  dataObj.columns = fields

  let dataHolder = []
  // loop through the table data and sort the data 
  // change here !
  for (let i = 0; i < settlementsPercounty.value.length; i++) {
    let thisRecord = {}
    thisRecord.index = i + 1
    thisRecord.name = settlementsPercounty.value[i].name
    thisRecord.count = settlementsPercounty.value[i].NoSlums


    dataHolder.push(thisRecord)
  }
  dataObj.content = dataHolder




  let settings = {
    fileName: 'InformalSettlements', // Name of the resulting spreadsheet
    writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
    writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
  }

  // Enclose in array since the fucntion expects an array of sheets
  xlsx([dataObj], settings) //  download the excel file

}



const getAllApi = async () => {
  await Promise.all([
    getCountyGeo(),
    getSettlementsCountyMap(),
    getSettlementPopPyramid(),
    getTopSettlementCountByCounty(),
    getSettlementPopulation(),


  ])
  loading.value = false
}

getAllApi()



const activeName = ref('Chart')

</script>

<template>
  <PanelGroup />

  <el-tabs
v-loading="loading" element-loading-text="Generating maps, charts and tables......." v-model="activeName"
    class="demo-tabs">
    <el-tab-pane label="Chart" name="Chart">
      <ElRow :gutter="20" justify="space-between">
        <ElCol :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
          <ElCard shadow="hover" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <Echart :options="pyramidOptions" :height="350" />
            </ElSkeleton>
          </ElCard>
        </ElCol>

        <ElCol :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
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
        <ElCol :xl="16" :lg="12" :md="24" :sm="24" :xs="24">
          <ElCard shadow="hover" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <Echart :options="settlementCountMap" :height="350" />

            </ElSkeleton>
          </ElCard>
        </ElCol>



        <ElCol :xl="8" :lg="12" :md="24" :sm="24" :xs="24">
          <ElCard shadow="hover" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
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
                <span>{{ TableTitle }}</span>
                <div style="display: inline-block; margin-left: 20px">
                  <el-button :onClick="DownloadXlsx" type="primary" :icon="Download" />
                </div>

              </div>
            </template>

            <ElSkeleton :loading="loading" animated>
              <el-table
height="350" stripe border show-summary :data="settlementsPercounty"
                :default-sort="{ prop: 'NoSlums', order: 'descending' }" style="width: 100%">
                <el-table-column prop="name" label="Name" sortable />
                <el-table-column prop="NoSlums" label="Number of Slums/Informal Settlements" sortable />
              </el-table>
            </ElSkeleton>
          </ElCard>
        </ElCol>
      </ElRow>
    </el-tab-pane>



  </el-tabs>
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