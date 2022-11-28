<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import {
  ElCard,
  ElCol,
  ElRow,
  ElSelect,
  ElOption,
  ElSkeleton
} from 'element-plus'
import { reactive, ref } from 'vue'



import { getCountyGeoAll } from '@/api/counties'
import { getSummarybyField, getSummarybyFieldNested } from '@/api/summary'

import { LControlLayers, LGeoJson, LMap, LTileLayer } from '@vue-leaflet/vue-leaflet'
import { featureGroup } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { nextTick } from 'vue'

import * as ss from 'simple-statistics'   // clasification of data 
import chroma from "chroma-js"   // color scheme 



const map = ref()
const geo = ref()
const countyGeo = ref([])
const indicator = ref([])
const classBreaks = ref([])
const ChoroPlethcolors = ref([])
const selectedIndicator = ref()


const county = reactive(
  {
    names: [],
    indicator: [],
    chart_title: 'start'
  })


function getColor(d) {

  if (d <= classBreaks.value[1]) {
    return ChoroPlethcolors.value[0]
  }

  if (d > classBreaks.value[1] && d <= classBreaks.value[2]) {
    return ChoroPlethcolors.value[1]
  }

  if (d > classBreaks.value[2] && d <= classBreaks.value[3]) {
    return ChoroPlethcolors.value[2]
  }

  if (d > classBreaks.value[3] && d <= classBreaks.value[4]) {
    return ChoroPlethcolors.value[3]
  }

  if (d > classBreaks.value[4] && d <= classBreaks.value[5]) {
    return ChoroPlethcolors.value[4]
  }



  if (!d) {
    return 'white'
  }





}
function updateStyle() {
  // console.log('Updating style....')

  if (geo.value.leafletObject) {
    const geojsonLayer = geo.value.leafletObject
    // console.log(geojsonLayer)
    if (!geojsonLayer) {
      return
    }

    let styleFunction = (feature) => {
      // add feature here to access this prop
      // console.log(feature.properties.landuse_id)
      return {
        weight: 1,
        opacity: 0.85,
        borderWidth: '2',
        borderColor: 'white',
        color: getColor(feature.properties.indicator), // send it here
        fillOpacity: 0.85

      }
    }
    geo.value.leafletObject.setStyle(styleFunction)

  }
}

function roundup(v) {
  return Math.pow(10, Math.ceil(Math.log10(v)));
}


const getSettlementCountByCounty = async () => {
  const formData = {}
  formData.model = 'settlement'
  formData.summaryField = 'county_id'
  formData.summaryFunction = 'count'
  formData.groupField = 'county_id'

  const settPerCounty = await getSummarybyField(formData)

  console.log("settPerCounty---", settPerCounty)

  // create the jensk breaks and assocaited coloes 
  let result = settPerCounty.Total.map(a => parseInt(a.count))

  classBreaks.value = ss.jenks(result, 5)   // creake breakpoints for colors 
  ChoroPlethcolors.value = chroma.scale(['white', 'red']).mode('lch').colors(5)

  console.log('---------->', classBreaks)

  // clear the chat arrays 
  county.names.splice(0)
  county.indicator.splice(0)
  county.chart_title = 'Number of Settlements by County'

  console.log('Chart-title', county)
  countyGeo.value.features.forEach(function (feature) {
    const cnty = settPerCounty.Total.filter(object => {
      return object.county_id === feature.properties.id;
    });
    if (cnty.length > 0) {
      feature.properties.indicator = parseInt(cnty[0].count)
      //   console.log(cnty[0].count)
      county.names.push(feature.properties.name)
      county.indicator.push(parseInt(cnty[0].count))
    }
  });
  console.log('---------->', countyGeo)
  updateStyle()

}

const getSettlementPopByCounty = async () => {
  const formData = {}
  formData.model = 'settlement'
  formData.summaryField = 'population'
  formData.summaryFunction = 'sum'
  formData.groupField = 'county_id'

  const settPerCounty = await getSummarybyField(formData)
  // create the jensk breaks and assocaited coloes 
  let result = settPerCounty.Total.map(a => parseInt(a.sum))
  classBreaks.value = ss.jenks(result, 5)   // creake breakpoints for colors 
  ChoroPlethcolors.value = chroma.scale(['#ffeda0', '#f03b20']).mode('lch').colors(5)


  console.log('---------->', settPerCounty)
  // clear the chat arrays 
  county.names.splice(0)
  county.indicator.splice(0)
  county.chart_title = 'Total Settlement Population by County'



  countyGeo.value.features.forEach(function (feature) {
    const cnty = settPerCounty.Total.filter(object => {
      return object.county_id === feature.properties.id;
    });
    if (cnty.length > 0) {
      feature.properties.indicator = parseInt(cnty[0].sum)
      //   console.log(cnty[0].count)
      county.names.push(feature.properties.name)
      county.indicator.push(parseInt(cnty[0].sum))
    }
  });
  console.log('----getSettlementPopByCounty------>', countyGeo)
  updateStyle()

}


const getSettlementAreaByCounty = async () => {
  const formData = {}
  formData.model = 'settlement'
  formData.summaryField = 'area'
  formData.summaryFunction = 'AVG'
  formData.groupField = 'county_id'

  const settPerCounty = await getSummarybyField(formData)
  // create the jensk breaks and assocaited coloes 
  let result = settPerCounty.Total.map(a => parseInt(a.AVG))
  classBreaks.value = ss.jenks(result, 5)   // creake breakpoints for colors 
  ChoroPlethcolors.value = chroma.scale(['#ece2f0', '#1c9099']).mode('lch').colors(5)


  console.log('---------->', settPerCounty)

  // clear the chat arrays 
  county.names.splice(0)
  county.indicator.splice(0)
  county.chart_title = 'Average Settlement Size(Ha) by County'



  countyGeo.value.features.forEach(function (feature) {
    const cnty = settPerCounty.Total.filter(object => {
      return object.county_id === feature.properties.id;
    });
    if (cnty.length > 0) {
      feature.properties.indicator = parseInt(cnty[0].AVG)
      //   console.log(cnty[0].count)
      county.names.push(feature.properties.name)
      county.indicator.push(parseInt(cnty[0].AVG))
    }
  });
  console.log('----getSettlementAveAreaByCounty------>', countyGeo)
  updateStyle()

}


function isNotNull(value) {
  return value != null;
}

const getBeneficiariesByCounty = async () => {
  const formData = {}
  formData.model = 'beneficiary'
  formData.summaryField = 'county_id'
  formData.summaryFunction = 'count'
  formData.groupField = 'county_id'

  formData.assoc_model = ['settlement', 'county']

  const settPerCounty = await getSummarybyFieldNested(formData)
  // create the jensk breaks and assocaited coloes 


  let result1 = settPerCounty.Total.filter(function (elt) {
    return elt.county_id != null;
  });

  console.log('Sett-->', result1)

  let result = result1.map(a => parseInt(a.count))


  console.log('Sett-->', result)




  classBreaks.value = ss.jenks(result, 5)   // creake breakpoints for colors 
  ChoroPlethcolors.value = chroma.scale(['#ece2f0', '#1c9099']).mode('lch').colors(5)


  console.log('---------->', classBreaks.value)

  // clear the chat arrays 
  county.names.splice(0)
  county.indicator.splice(0)
  county.chart_title = 'Number of Beneficiaries by County'



  countyGeo.value.features.forEach(function (feature) {
    const cnty = settPerCounty.Total.filter(object => {
      return object.county_id === feature.properties.id;
    });

    //  console.log('filtered-->',cnty )
    if (cnty.length > 0) {
      feature.properties.indicator = parseInt(cnty[0].count)
      //   console.log(cnty[0].count)
      county.names.push(feature.properties.name)
      county.indicator.push(parseInt(cnty[0].count))
    }
  });
  console.log('----getSettlementAveAreaByCounty------>', countyGeo)
  updateStyle()

}






const getCountyGeo = async () => {
  const formData = {}
  formData.model = 'county'
  const res = await getCountyGeoAll(formData)
  console.log(res.data[0].json_build_object)
  if (res.data[0].json_build_object.features) {
    countyGeo.value = res.data[0].json_build_object
    setTimeout(() => {
      // After building your geoJson layers, just add this:
      nextTick().then(() => {
        var group = new featureGroup()

        map.value.leafletObject.eachLayer(function (layer) {
          //    console.log(layer.feature)
          if (layer.feature != undefined) {
            group.addLayer(layer)
          }
        })
      })
    }, 0) // 0ms seems enough to execute resize after tab opens.
  }

  getSettlementCountByCounty() // This is only called the first time for the first graph
}


getCountyGeo()




const selCharts = [
  {
    value: 'NoSettlement',
    label: 'Number of Settlements',
  },
  {
    value: 'SlumPop',
    label: 'Slum Resident Population',
  },

  {
    value: 'AvgSizeHa',
    label: 'Average Slum size (ha)',
  }
]



const handleChangeIndicator = async (indicator: any) => {
  console.log(indicator)

  if (indicator === 'NoSettlement') {
    getSettlementCountByCounty()

  }
  if (indicator === 'SlumPop') {
    getSettlementPopByCounty()

  }
  if (indicator === 'AvgSizeHa') {
    getSettlementAreaByCounty()

  }

}




const categories = { 'categories': county.names }

console.log("Chart-title-2", county.chart_title)
const chartOptions = {

  chart: {
    type: 'bar',
    height: 350
  },
  plotOptions: {
    bar: {
      borderRadius: 4,
      horizontal: true,
    }
  },
  dataLabels: {
    enabled: false
  },

}
chartOptions.xaxis = categories

const series = [{
  data: county.indicator
}]


console.log('--------', chartOptions)

var CartoDB_DarkMatter = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
var osm_tile = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"


</script>
<template>
  <ContentWrap :title="county.chart_title">
    <el-row :gutter="20">
      <el-col :xl="8" :lg="10" :md="24" :sm="24" :xs="24">
        <el-card>
          <el-select v-model="selectedIndicator" :onChange="handleChangeIndicator" placeholder="Select">
            <el-option v-for="item in selCharts" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-skeleton style="--el-skeleton-circle-size: 100px">
            <template #template>
              <div id="chart">
                <apexchart type="bar" height="410" :options="chartOptions" :series="series" />
              </div>
            </template>
          </el-skeleton>
        </el-card>
      </el-col>
      <el-col :xl="8" :lg="14" :md="24" :sm="24" :xs="24">
        <el-card>
          <l-map ref="map" :zoom="6" :center="[0.606, 37.817]" style="height: 410px">
            <l-tile-layer url='https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' layer-type="base"
              min-zoom="1" max-zoom="21" useBounds="true" class="map" name="OpenStreetMap" />
            <l-geo-json ref="geo" layer-type="overlay" name="Counties" :geojson="countyGeo" @ready="updateStyle" />
            <l-control-layers position="topright" />
            <l-control class="leaflet-bottom leaflet-left leaflet-demo-control">
              <div class="key">KEY</div>
              <div class="flex-container">
                <div :style="{ 'background-color': ChoroPlethcolors[0] }">{{ classBreaks[1] }}</div>
                <div :style="{ 'background-color': ChoroPlethcolors[1] }">{{ classBreaks[2] }}</div>
                <div :style="{ 'background-color': ChoroPlethcolors[2] }">{{ classBreaks[3] }}</div>
                <div :style="{ 'background-color': ChoroPlethcolors[3] }">{{ classBreaks[4] }}</div>
                <div :style="{ 'background-color': ChoroPlethcolors[4] }">{{ classBreaks[5] }}</div>
              </div>
            </l-control>
          </l-map>
        </el-card>
      </el-col>

    </el-row>
  </ContentWrap>
</template>


<style>
.flex-container {
  display: flex;
  flex-wrap: nowrap;
  width: 250px;
  text-align: center;

}

.flex-container>div {
  width: 50px;
  margin: 1px;
  text-align: center;
  line-height: 20px;
  color: white;

}


.key {
  text-align: center;
  color: white;
  font-weight: bold;
}
</style>