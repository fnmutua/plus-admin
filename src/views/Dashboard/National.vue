<script setup lang="ts">
import {
  ElRow, ElCol, ElCard, ElDivider, ElCarousel, ElCarouselItem, ElTabPane, ElSkeleton, ElButton
} from 'element-plus'

import { ref, reactive, watch, onMounted } from 'vue'

import { use } from "echarts/core";


import { Icon } from '@iconify/vue';

import { pieOptions, simpleBarChart, multipleBarChart, stacklineOptions, mapChartOptions, lineOptions, stackedbarOptions, barMaleFemaleOptions } from './chart-types'
import { EChartsOption, registerMap } from 'echarts'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountFilter, getSumFilter } from '@/api/settlements'
import { useI18n } from '@/hooks/web/useI18n'
import { getSummarybyFieldFromMultipleIncludes } from '@/api/summary'
import { getCountyListApi, getListWithoutGeo } from '@/api/counties'
import { getfilteredGeo } from '@/api/settlements'

import { getSummarybyField, getSummaryGroupByMultipleFields, getSummarybyFieldNested } from '@/api/summary'

import * as turf from '@turf/turf'
import { getAllGeo } from '@/api/settlements'
import { useRoute } from 'vue-router'
import { getRoutesList } from '@/api/settlements'

import {
  TopRight, ArrowLeft,
  ArrowRight,
} from '@element-plus/icons-vue'


import { CanvasRenderer } from 'echarts/renderers';
import { PieChart, GaugeChart, BarChart, LineChart, } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  ToolboxComponent,
  GridComponent,

} from 'echarts/components';
import VChart, { THEME_KEY } from 'vue-echarts';
import { provide } from 'vue';
import { useRouter } from 'vue-router'


import { Echart } from '@/components/Echart'

import houseImage1 from '@/assets/imgs/house.svg';
import shanty from '@/assets/imgs/shanty.svg';
import title from '@/assets/imgs/title.svg';


use([
  GaugeChart,
  CanvasRenderer,
  PieChart,
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  ToolboxComponent,
  GridComponent
]);

provide(THEME_KEY, 'light');

const { t } = useI18n()

const dashboard_id = ref()
//////////
const route = useRoute()

const { push } = useRouter()

watch(
  route,
  () => {
    console.log("Watching...............................", route.meta);
    dashboard_id.value = route.meta.dashboard_id
    //  page_title.value = route.meta.title
  },
  { deep: true, immediate: true, }
)




const activeTab = ref();
const loading = ref(true)
const cardLoading = ref(false)


const cards = ref([])
const tabs = ref([])

const filterLevel = ref('national')
const selectedCounties = ref([])
const selectedSubCounties = ref([])
const selectedWards = ref([])
const options = ref([])

const props = {
  expandTrigger: 'hover' as const,
  multiple: true,
}


const mArray = ref([])
const fArray = ref([])
const pyramidOptions = ref()






const countyGeo = ref([])
const subCountyGeo = ref([])
const aspect = ref()

const getCountyGeo = async () => {
  const formData = {}
  formData.model = 'county'
  const res = await getAllGeo(formData)
  console.log('county geo', res.data[0].json_build_object)
  if (res.data[0].json_build_object.features) {
    countyGeo.value = res.data[0].json_build_object
    //  console.log("County-geo", countyGeo.value)

    var bbox = turf.bbox(countyGeo.value);
    const y_coord = (bbox[1] + bbox[3]) / 2;
    aspect.value = Math.cos(y_coord * Math.PI / 180);
    //   console.log(aspect.value)
    registerMap('KE', countyGeo.value);

    getSettlementPopulation()
  }

  // getSettlementCountByCounty() // This is only called the first time for the first graph
}

 




const countyList = ref([])
const subCountyList = ref([])
const filteredSubCountyList = ref([])

 


onMounted(() => {


  console.log(activeTab)
  loading.value = false
});



const selectCounty = ref([])
const selectSubCounty = ref([])
const dashboards = ref([])


const vloading = ref(true)
const getDynamicDashboards = async () => {
  const formData = {}
  formData.limit = 100
  formData.page = 1
  formData.curUser = 1 // Id for logged in user
  formData.model = 'dashboard'
  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------


  // - multiple filters -------------------------------------
  formData.associated_multiple_models = []

  //-------------------------
  //console.log(formData)
  const res = await getRoutesList(formData)
  console.log("dynamo", res)

  dashboards.value = res.data
  vloading.value=false 




}
getDynamicDashboards()


const truncatedDescription = (description) => {

  if (description.length > 70) {
    return description.substring(0, 70) + "...";
  }
  return description;
}


 

const goToDashboard = (title) => {
  console.log(title)
  push({
    name: title
  })
}

const settMaxPopDensity = ref()
const settMinPopDensity = ref()
const settPopDensity = ref([])
const settlementPopulationMap = ref()
const maploading = ref(true)


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
        cntySlums.value = item.AVG? (item.AVG).toFixed(2):0
        settPopDensity.value.push(cntySlums)
      });
      settMaxPopDensity.value = Math.max(...settPopDensity.value.map(o => o.value))
      settMinPopDensity.value = Math.min(...settPopDensity.value.map(o => o.value))

   

    });


  console.log('settlementCountMapMax', settMaxPopDensity.value)
  console.log('settlementsPopMin', settMinPopDensity.value)




  settlementPopulationMap.value = {
    title: {
      text: 'Slum Population Density',
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
        name: '#Persons/Sq.Km',
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
  maploading.value=false
}


const numberOfSlums=ref(0)
const getNumberOfSlums = async () => {
  const formData = {}


  formData.model = 'settlement'
  formData.summaryField = 'settlement.id'
  formData.summaryFunction = 'count'

  // filter by field 
  formData.filterField = 'isApproved'
  formData.filterValue = ['Approved'] //

  // Asccoiated models 
  formData.assoc_models = []
  formData.groupFields = []

  await getSummarybyFieldFromMultipleIncludes(formData)
    .then(response => {

      console.log('Rsponse form filtred counts', response)
       numberOfSlums.value = response.Total[0].count
    

    });

 
}


const personsInSlums=ref(0)
const getNumberOfPersonsInSlums = async () => {
  const formData = {}


  formData.model = 'settlement'
  formData.summaryField = 'settlement.population'
  formData.summaryFunction = 'sum'

  // filter by field 
  formData.filterField = 'isApproved'
  formData.filterValue = ['Approved'] //

  // Asccoiated models 
  formData.assoc_models = []
  formData.groupFields = []

  await getSummarybyFieldFromMultipleIncludes(formData)
    .then(response => {

      console.log('Rsponse form filtred counts', response)
      personsInSlums.value = response.Total[0].sum
    

    });

 
}



const totalInvestMents=ref(0)
const getTotalInvestments = async () => {
  const formData = {}


  formData.model = 'project'
  formData.summaryField = 'project.cost'
  formData.summaryFunction = 'sum'

  // filter by field 
  formData.filterField = 'isApproved'
  formData.filterValue = ['Approved'] //

  // Asccoiated models 
  formData.assoc_models = []
  formData.groupFields = []

  await getSummarybyFieldFromMultipleIncludes(formData)
    .then(response => {

      console.log('Rsponse form filtred counts', response)
      totalInvestMents.value = response.Total[0].sum
    

    });

 
}


const propOwners=ref(0)
const getPlotOwners = async () => {
 

  const formData = {}
  formData.model = 'households'
  formData.summaryField = 'owner_tenant'
  //formData.summaryField =  cmodelField  // concatenating to avoid abiguity
  formData.summaryFunction = 'count'
  //formData.assoc_models = ['county']
  formData.assoc_models = []
  formData.groupFields = []
  // formData.filterField =['indicator_category_id']
  // formData.filterValue = [ids]    
 
  formData.calculationType = 'proportion'
  formData.filterField = 'owner_tenant'
  formData.filterOperator = ['eq' ]  
  formData.filterValue = 'structure_owner'


  try {
    const response01 = await getSummarybyFieldFromMultipleIncludes(formData);
    console.log("Cards sumamrye", response01)
    // console.log('ids', ids)

    // const response = await getSumFilter(sumQuery);
    propOwners.value = response01.Total[0]['count'] ? parseInt(response01.Total[0]['count']) : 0
    //console.log('Cumulative Data', response.data)

   
  } catch (error) {
    // Handle any errors that occur during the asynchronous operation
    console.error(error);
    //return null; // or any default value you prefer
    propOwners.value = 0; // or any default value you prefer
  }

  console.log('foxrmData',formData)
 
}

const getAllApi = async () => {
  await Promise.all([
    getCountyGeo(),
    getNumberOfSlums(),
    getNumberOfPersonsInSlums(),
    getTotalInvestments(),
    getPlotOwners()

  ])
  loading.value = false
}

getAllApi()


const formatNumber =   (value) => {
     if (value >= 1000000) {
      return (value / 1000000).toLocaleString('en-US', { maximumFractionDigits: 2 }) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toLocaleString('en-US', { maximumFractionDigits: 2 }) + 'K';
    }
    return value.toLocaleString('en-US');
  }
 

console.log('settlementPopulationMap',settlementPopulationMap)


const dashboardImages = [houseImage1, shanty, title]
</script>

<template>
  <el-row :gutter="20">

    <el-col :xs="24" :sm="12" :md="8" :lg="6">
      <div class="tabs-container">
        <ElSkeleton :loading="cardLoading" animated>
          <el-card shadow="always">
            <div class="card-content">
              <div class="icon-container">
                <Icon icon='pepicons-pop:map' width="60" color='red' />
              </div>
              <el-divider direction="vertical" />
              <div class="card-value">
                <p class="value-text">{{ numberOfSlums }}</p>
                <p class="value-label">Slums and Informal Settlements</p>
              </div>

            </div>
          </el-card>
        </ElSkeleton>

      </div>
    </el-col>

    <el-col :xs="24" :sm="12" :md="8" :lg="6">
      <div class="tabs-container">
        <ElSkeleton :loading="cardLoading" animated>
          <el-card shadow="always">
            <div class="card-content">
              <div class="icon-container">
                <Icon icon='ic:sharp-people' width="60" color='black' />
              </div>
              <el-divider direction="vertical" />
              <div class="card-value">
                <p class="value-text">{{ formatNumber(personsInSlums) }}</p>
                <p class="value-label">Persons Living in informal Settlements</p>
              </div>
            </div>
          </el-card>
        </ElSkeleton>
      </div>
    </el-col>


    <el-col :xs="24" :sm="12" :md="8" :lg="6">
      <div class="tabs-container">
        <ElSkeleton :loading="cardLoading" animated>
          <el-card shadow="always">
            <div class="card-content">
              <div class="icon-container">
                <Icon icon='mdi:excavator' width="60" color='green' />
              </div>
              <el-divider direction="vertical" />
              <div class="card-value">
                <p class="value-text">{{  formatNumber(totalInvestMents) }}</p>
                <p class="value-label">Worth of Interventions in informal Settlements</p>
              </div>

            </div>
          </el-card>
        </ElSkeleton>

      </div>
    </el-col>


    <el-col :xs="24" :sm="12" :md="8" :lg="6">
      <div class="tabs-container">
        <ElSkeleton :loading="cardLoading" animated>
          <el-card shadow="always">
            <div class="card-content">
              <div class="icon-container">
                <Icon icon='uil:house-user' width="60" color='purple' />
              </div>
              <el-divider direction="vertical" />
              <div class="card-value">
                <p class="value-text">{{propOwners}}%</p>
                <p class="value-label">Own structures in informal Settlements</p>
              </div>
            </div>
          </el-card>
        </ElSkeleton>

      </div>
    </el-col>

  </el-row>


  <el-row :gutter="20">

    <el-col :xs="24" :sm="24" :md="15" :lg="15">
      <div class="tabs-container">
        <el-card class="box-card" shadow="always" style="text-align: center;">

        <ElSkeleton :loading="vloading" animated>
          <el-carousel height="350px">
        <el-carousel-item v-for="(item, index) in dashboards" :key="item">
          <el-row>
            <!-- Column for the text -->
            <el-col :span="24">
              <div class="overlay-text">
                <h3 class="text-style">{{ item.title }} Dashboard</h3>
                <el-button type="primary" plain :icon="TopRight" @click="goToDashboard(item.title)">
                  {{ truncatedDescription(item.description) }}
                </el-button>
              </div>
            </el-col>
          </el-row>
          <el-row>
            <!-- Column for the image -->
            <el-col :span="24">
              <div class="image" style="position: relative;">
                <img :src="dashboardImages[index]" class="image" />
              </div>
            </el-col>
          </el-row>
        </el-carousel-item>
      </el-carousel>

          </ElSkeleton>
          </el-card>


      
      </div>
    </el-col>


    <el-col :xs="24" :sm="24" :md="9" :lg="9">
      <div class="tabs-container">
 
          <ElCard shadow="hover" class="mb-20px">
            <ElSkeleton :loading="maploading" >
              <Echart :options="settlementPopulationMap" :height="350" />

            </ElSkeleton>
          </ElCard>
       </div>
    </el-col>
  </el-row>
</template>
 
<style scoped>
.chart {
  height: 40vh;
}

.card-content {
  display: flex;
  align-items: center;
}

.card-icon {
  margin-right: 10px;
}

.card-divider {
  width: 1px;
  height: 80%;
  background-color: #e4e7ed;
  margin: 0 10px;
}

.card-value {
  flex-grow: 1;
}

.value-text {
  font-size: 24px;
  font-weight: bold;
}

.value-label {
  font-size: 14px;
  color: #999999;
}

.tabs-container {
  margin-top: 20px;
}

.cards-container {
  margin-top: 5px;
}


.icon-container {
  display: inline-block;
  position: relative;
  box-shadow: 0 2px 4px rgba(34, 35, 35, 0.2);
  padding: 5px;
  /* optional padding around the icon */
  border-radius: 10%;
  /* optional border radius for circular icon */
}



.time {
  font-size: 12px;
  color: #999;
}

.bottom {
  margin-top: 13px;
  line-height: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.button {
  padding: 0;
  min-height: auto;
}

.image {
  width: 100%;
  display: block;
}



.overlay-text {
  position: relative;
}

.text-style {
  font-size: 28px;
  font-weight: bold;
  color: rgb(3, 40, 21);
}
</style>