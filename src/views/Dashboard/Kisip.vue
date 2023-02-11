<script setup lang="ts">
import {
  ElRow, ElCol, ElAvatar, ElCard, ElCollapse, ElCollapseItem, ElDivider, ElTabs, ElTabPane, ElProgress, ElSkeleton
} from 'element-plus'

import { pieOptions, barOptions, lineOptions } from './echarts-data'
import { ref, reactive } from 'vue'
import {
  getUserAccessSourceApi
} from '@/api/dashboard/analysis'
import { set } from 'lodash-es'
import { EChartsOption, registerMap } from 'echarts'
import { useI18n } from '@/hooks/web/useI18n'
import { Echart } from '@/components/Echart'

import { getSummarybyFieldFromMultipleIncludes } from '@/api/summary'
import * as turf from '@turf/turf'
import { getAllGeo } from '@/api/settlements'


import { use } from "echarts/core";
import { GaugeChart } from "echarts/charts";
import PanelGroup from './components/KisipCards.vue'
import { getSettlementListByCounty } from '@/api/settlements'
import { computed } from 'vue'
import { useAppStoreWithOut } from '@/store/modules/app'


use([
  GaugeChart
]);


const { t } = useI18n()

const loading = ref(true)
const colorPalette = ['#ff007f', '#0000ff'];  // Male-Female
const countyGeo = ref([])
const settlementsPercounty = ref([])
const settlementsPercountyMax = ref()
const settlementsPercountyMin = ref()


const aspect = ref()
const appStore = useAppStoreWithOut()

// initialize with long titles
const tenureSupportedTitle = ref("KISIP Tenure-Supported Settlements")
const infrastructureSupportedTitle = ref("Infrastructure-Supported Settlements")
const inclusionSupportedTitle = ref("Social Inclusion Settlements")
const TenureSupportedBeneficiaryTitle = ref("Tenure beneficiaries by gender")
const RoadsImprovedTitle = ref("Roads improved under the KISIP project (Km)")
const footPathsConstructedTitle = ref("Footpaths constructed under the KISIP project(No.)")
const highmastsConstructedTitle = ref("Highmast Security Lights constructed")
const DPWTraineesTitle = ref("DPW: No. of people engaged and trained")

const ShowLegend = ref(true)


// Check whether user screen is mobile 
const isMobile = computed(() => appStore.getMobile)

console.log('isMobile', isMobile.value)

if (isMobile.value) {
  // use shorter chart titles for mobile and longer ones for large screens
  tenureSupportedTitle.value = ("Tenure Settlements")
  infrastructureSupportedTitle.value = ("Infrastructure Settlements")
  inclusionSupportedTitle.value = ("Inclusion Settlements")
  TenureSupportedBeneficiaryTitle.value = ("Beneficiaries (M/F)")
  RoadsImprovedTitle.value = ("Roads Improved(Km)")
  footPathsConstructedTitle.value = ("Footpaths Construct.(No.)")
  highmastsConstructedTitle.value = ("Highmasts Construct.(No.)")
  DPWTraineesTitle.value = ("DPW Trainees(No.)")

  ShowLegend.value = false

}

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


const maleIcon = 'path://m 146.41936,238.8034 c -5.21101,-1.43402 -7.51545,-6.79358 -6.6619,-11.76943 -0.0588,-45.10952 -0.11757,-90.21905 -0.17635,-135.328563 -5.3022,-1.61412 -3.06375,4.34199 -3.52464,7.58816 -0.0576,14.697923 -0.11511,29.395843 -0.17266,44.093773 -1.72718,6.61806 -12.15586,7.45944 -14.19605,0.88682 -1.42909,-4.98857 -0.22146,-10.60033 -0.62062,-15.83232 0.10773,-15.18837 -0.21551,-30.437173 0.16059,-45.587893 1.91842,-11.228608 12.80383,-20.22421 24.26927,-18.689786 10.60777,1.558898 0.0755,-3.65768 -0.79236,-8.596161 -4.23852,-8.688715 0.80002,-20.073014 9.72708,-23.421847 8.82591,-4.162774 20.30103,1.001172 23.52581,10.108188 2.28945,5.67583 1.4368,12.853955 -2.76118,17.571486 -5.15831,4.024926 -3.94241,5.010805 1.85043,4.362909 13.58742,-1.603119 25.03585,11.840701 23.9554,24.967141 -0.0691,18.213333 -0.13818,36.426673 -0.20726,54.640013 -1.5351,4.55905 -7.30638,6.71543 -11.30858,3.96578 -4.81473,-2.8888 -2.73019,-9.20279 -3.19227,-13.88869 -0.0523,-14.05586 -0.10469,-28.11173 -0.15704,-42.167583 -4.85271,-1.54237 -3.37467,3.24601 -3.51022,6.4208 V 231.02616 c -1.3114,6.77368 -9.29063,10.3384 -15.13544,6.61747 -6.62075,-3.7866 -4.17124,-12.04397 -4.62011,-18.29166 v -70.84935 c -4.85175,-1.54283 -3.39102,3.24111 -3.53094,6.42079 -0.0578,25.5528 -0.11553,51.1056 -0.17329,76.65839 -1.7387,5.48439 -7.13811,8.77105 -12.74767,7.2216 z'
const femaleIcon = 'path://m 39.7122,238.0264 c -5.604205,-1.49359 -5.822698,-7.32898 -5.431108,-11.96235 -0.05932,-18.97406 -0.118632,-37.94813 -0.177948,-56.92219 -7.401109,0.0507 -14.802279,0.16954 -22.203547,0.1438 8.050221,-26.97466 15.83106,-54.03787 24.0791,-80.948455 -6.246873,-1.537447 -5.103818,6.332986 -7.12857,10.198179 -4.203419,12.783656 -7.28462,25.995046 -12.31951,38.467156 C 6.215777,147.43407 -0.93895389,129.58252 6.2279437,121.52707 11.709639,105.71684 15.006783,88.999576 22.521999,73.9779 25.487431,65.143259 38.425956,64.174487 43.879817,63.247984 35.242261,58.307767 32.195248,46.181151 37.843175,37.985287 c 5.35176,-7.73122 16.727442,-10.988636 24.757146,-5.16531 11.321083,6.562216 10.452089,25.024381 -1.135269,30.670395 9.830628,-0.28155 20.086569,3.623662 24.845207,12.765524 3.87086,7.45858 5.12438,16.169298 8.137928,24.037484 2.906124,10.26421 6.922833,20.35157 9.297803,30.70045 1.06345,4.17564 -1.66552,9.02385 -6.181687,9.2796 -7.686885,1.11419 -8.783192,-8.80355 -10.70406,-14.18732 -3.87502,-12.5653 -7.681429,-25.15172 -11.575988,-37.711005 -8.798872,-0.113812 1.949333,13.898795 1.781574,19.941085 6.048408,20.20812 12.13493,40.40517 18.089502,60.64114 -7.392371,0.35953 -14.803078,0.14681 -22.203496,0.20388 -0.06597,21.22546 -0.131933,42.45093 -0.1979,63.67639 -2.103142,7.13406 -13.415648,7.74398 -15.969932,0.84281 -1.418088,-4.77754 -0.245017,-10.18282 -0.655178,-15.20454 l -0.156843,-49.31466 c -4.44248,-1.05339 -5.844521,0.93365 -4.913879,5.25338 -0.162881,19.18788 0.325808,38.44483 -0.244801,57.58947 -0.334387,5.03435 -6.719798,7.8699 -11.101102,6.02234 z'





const tenureSettlementsPoints = ref([])
const MapgeopointOptions = ref()

const getKisipTenureSettlementsCountByCounty = async () => {
  const formData = {}
  formData.model = 'intervention'
  formData.summaryField = 'settlement_id'
  formData.summaryFunction = 'count'

  // filter by field 
  formData.filterField = 'intervention_type_id'
  formData.filterValue = 1

  // Asccoiated models 
  formData.assoc_models = ['settlement', 'county']
  formData.groupFields = ['settlement.county.name']
  formData.cache_key = 'getKisipTenureSettlementsCountByCounty'

  let subCategories = []
  var cData = []

  await getSummarybyFieldFromMultipleIncludes(formData)
    .then(response => {
      var results = response.Total
      console.log('Tenure settlements interventions by county', results)

      //   let topTen = results.slice(0, 10)   // get the top 10
      results.forEach(function (item) {
        cData.push(parseInt(item.count))
        subCategories.push(item.name)
      });

      // process nuber of settlemtns per county 

      results.forEach(function (item) {
        var cntySlums = {}
        cntySlums.name = item.name
        cntySlums.value = parseInt(item.count)
        settlementsPercounty.value.push(cntySlums)
      });

      // console.log("settlements by county - II", settlementsPercounty.value)
      settlementsPercountyMax.value = Math.max(...settlementsPercounty.value.map(o => o.value))
      settlementsPercountyMin.value = Math.min(...settlementsPercounty.value.map(o => o.value))




    });

  // Same querry but now to get the settleemnts and their GEO
  var filters = ['intervention_type_id']
  var filterValues = ['1']
  const associated_multiple_models = ['settlement']
  const model = 'intervention'
  //// ------------------parameters -----------------------////

  const fiterModelData = {}
  fiterModelData.curUser = 1 // Id for logged in user
  fiterModelData.model = model
  //-Search field--------------------------------------------
  fiterModelData.searchField = 'name'
  fiterModelData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  //fiterModelData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  fiterModelData.filters = filters
  fiterModelData.filterValues = filterValues
  fiterModelData.associated_multiple_models = associated_multiple_models

  //-------------------------
  //console.log(formData)


  await getSettlementListByCounty(fiterModelData)
    .then(response => {

      for (let i = 0; i < response.data.length; i++) {
        let sett = response.data[i].settlement
        let obj = {}
        if (sett.geom) {
          // console.log(response.data[i].settlement)
          var centroid = turf.centroid(sett.geom)
          //  console.log(sett.name, centroid.geometry.coordinates)
          let coords = centroid.geometry.coordinates
          let value = coords.concat(sett.population)
          obj.name = sett.name
          obj.value = value
          //  console.log(obj)
          tenureSettlementsPoints.value.push(obj)
        }
      }
    });


  MapgeopointOptions.value = {
    title: {
      text: tenureSupportedTitle,
      subtext: 'National Slum Mapping, 2023',
      sublink: "http://kisip.go.ke",
      left: "right",
      textStyle: {
        fontSize: 14
      },
      subtextStyle: {
        fontSize: 12
      }
    },

    toolbox: {
      show: true,
      //orient: 'vertical',
      left: 'left',
      top: 'top',
      feature: {
        dataView: { readOnly: true },
        restore: {},
        saveAsImage: { show: true, pixelRatio: 4 }
      }
    },
    tooltip: {
      trigger: "item"
    },
    legend: {
      orient: "vertical",
      y: "bottom",
      x: "right",
      data: ["Settlements"],
      textStyle: {
        color: "#4c2416"
      }
    },
    geo: {
      map: "KE",
      aspectScale: 0.9999,
      roam: true,
      emphasis: {
        label: {
          show: false
        },
        itemStyle: {
          areaColor: "#2a333d"
        }
      },
      itemStyle: {
        areaColor: "#f0f0f0",
        borderColor: "white"
      }
    },
    series: [

      {
        name: "Settlements",
        type: "effectScatter",
        coordinateSystem: "geo",
        data: tenureSettlementsPoints.value.sort((a, b) => b.value - a.value).slice(0, 6),
        symbolSize: val => val[2] / 100,
        showEffectOn: "render",
        rippleEffect: {
          brushType: "stroke"
        },
        emphasis: {
          scale: true
        },
        tooltip: {
          formatter: function (val) {
            return val.name + ": " + val.value[2];
          }
        },
        label: {
          formatter: "{b}",
          position: "right",
          show: false
        },
        itemStyle: {
          color: "#f4e925",
          shadowBlur: 10,
          shadowColor: "#333"
        },
        zlevel: 1
      }
    ]
  };




}


const InfrastructureSettlementsPercounty = ref([])
const infMax = ref()
const infMin = ref()

const InfrastructureSettlementsMap = ref()
const InfrastructureSettlementsMapPoitns = ref([])
const getKisipInfSettlementsCountByCounty = async () => {
  const formData = {}
  formData.model = 'intervention'
  formData.summaryField = 'settlement_id'
  formData.summaryFunction = 'count'

  // filter by field 
  formData.filterField = 'intervention_type_id'
  formData.filterValue = 2 // Infrastructure

  // Asccoiated models 
  formData.assoc_models = ['settlement', 'county']
  formData.groupFields = ['settlement.county.name']
  formData.cache_key = 'getKisipInfSettlementsCountByCounty'


  let subCategories = []
  var cData = []

  await getSummarybyFieldFromMultipleIncludes(formData)
    .then(response => {
      var results = response.Total
      //  console.log('settlements interventions by county', results)

      //   let topTen = results.slice(0, 10)   // get the top 10
      results.forEach(function (item) {
        cData.push(parseInt(item.count))
        subCategories.push(item.name)
      });

      // process nuber of settlemtns per county 

      results.forEach(function (item) {
        var cntySlums = {}
        cntySlums.name = item.name
        cntySlums.value = parseInt(item.count)
        InfrastructureSettlementsPercounty.value.push(cntySlums)
      });

      //  console.log(" Infrastructure settlements by county - II", InfrastructureSettlementsPercounty.value)
      infMax.value = Math.max(...InfrastructureSettlementsPercounty.value.map(o => o.value))
      infMin.value = Math.min(...InfrastructureSettlementsPercounty.value.map(o => o.value))




    });


  // Same querry but now to get the settleemnts and their GEO
  var filters = ['intervention_type_id']
  var filterValues = ['2']
  const associated_multiple_models = ['settlement']
  const model = 'intervention'
  //// ------------------parameters -----------------------////

  const fiterModelData = {}
  fiterModelData.curUser = 1 // Id for logged in user
  fiterModelData.model = model
  //-Search field--------------------------------------------
  fiterModelData.searchField = 'name'
  fiterModelData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  //fiterModelData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  fiterModelData.filters = filters
  fiterModelData.filterValues = filterValues
  fiterModelData.associated_multiple_models = associated_multiple_models

  //-------------------------
  //console.log(formData)


  await getSettlementListByCounty(fiterModelData)
    .then(response => {

      for (let i = 0; i < response.data.length; i++) {
        let sett = response.data[i].settlement
        let obj = {}
        if (sett.geom) {
          // console.log(response.data[i].settlement)
          var centroid = turf.centroid(sett.geom)
          //  console.log(sett.name, centroid.geometry.coordinates)
          let coords = centroid.geometry.coordinates
          let value = coords.concat(sett.population)
          obj.name = sett.name
          obj.value = value
          //  console.log(obj)
          InfrastructureSettlementsMapPoitns.value.push(obj)
        }
      }
    });


  InfrastructureSettlementsMap.value = {
    title: {
      text: infrastructureSupportedTitle,
      subtext: 'National Slum Mapping, 2023',
      sublink: "http://kisip.go.ke",
      left: "right",
      textStyle: {
        fontSize: 13
      },
      subtextStyle: {
        fontSize: 11
      }
    },

    toolbox: {
      show: true,
      //orient: 'vertical',
      left: 'left',
      top: 'top',
      feature: {
        dataView: { readOnly: true },
        restore: {},
        saveAsImage: { show: true, pixelRatio: 4 }
      }
    },
    tooltip: {
      trigger: "item"
    },
    legend: {
      orient: "vertical",
      y: "bottom",
      x: "right",
      data: ["Settlements"],
      textStyle: {
        color: "#4c2416"
      }
    },
    geo: {
      map: "KE",
      aspectScale: 0.9999,
      roam: true,
      emphasis: {
        label: {
          show: false
        },
        itemStyle: {
          areaColor: "#2a333d"
        }
      },
      itemStyle: {
        areaColor: "#f0f0f0",
        borderColor: "white"
      }
    },
    series: [

      {
        name: "Settlements",
        type: "effectScatter",
        coordinateSystem: "geo",
        data: InfrastructureSettlementsMapPoitns.value.sort((a, b) => b.value - a.value).slice(0, 6),
        symbolSize: val => val[2] / 100,
        showEffectOn: "render",
        rippleEffect: {
          brushType: "stroke"
        },
        emphasis: {
          scale: true
        },
        tooltip: {
          formatter: function (val) {
            return val.name + ": " + val.value[2];
          }
        },
        label: {
          formatter: "{b}",
          position: "right",
          show: false
        },
        itemStyle: {
          color: "#f4e925",
          shadowBlur: 10,
          shadowColor: "#333"
        },
        zlevel: 1
      }
    ]
  };



}





const InclusionSettlementsPercounty = ref([])
const incMax = ref()
const incMin = ref()

const InclusionSettlementsMapPoints = ref([])
const InclusionSettlementsMapOptions = ref()
const getKisipInclusionSettlementsCountByCounty = async () => {
  const formData = {}
  formData.model = 'intervention'
  formData.summaryField = 'settlement_id'
  formData.summaryFunction = 'count'

  // filter by field 
  formData.filterField = 'intervention_type_id'
  formData.filterValue = 3 // Infrastructure

  // Asccoiated models 
  formData.assoc_models = ['settlement', 'county']
  formData.groupFields = ['settlement.county.name']
  formData.cache_key = 'getKisipInclusionSettlementsCountByCounty'

  let subCategories = []
  var cData = []

  await getSummarybyFieldFromMultipleIncludes(formData)
    .then(response => {
      var results = response.Total
      // console.log('settlements interventions by county', results)

      //   let topTen = results.slice(0, 10)   // get the top 10
      results.forEach(function (item) {
        cData.push(parseInt(item.count))
        subCategories.push(item.name)
      });

      // process nuber of settlemtns per county 

      results.forEach(function (item) {
        var cntySlums = {}
        cntySlums.name = item.name
        cntySlums.value = parseInt(item.count)
        InclusionSettlementsPercounty.value.push(cntySlums)
      });

      //   console.log(" Infrastructure inclusion by county - II", InclusionSettlementsPercounty.value)
      incMax.value = Math.max(...InclusionSettlementsPercounty.value.map(o => o.value))
      incMin.value = Math.min(...InclusionSettlementsPercounty.value.map(o => o.value))


      //     console.log("MinMax", incMin, incMax)

    });


  // Same querry but now to get the settleemnts and their GEO
  var filters = ['intervention_type_id']
  var filterValues = ['3']
  const associated_multiple_models = ['settlement']
  const model = 'intervention'
  //// ------------------parameters -----------------------////

  const fiterModelData = {}
  fiterModelData.curUser = 1 // Id for logged in user
  fiterModelData.model = model
  //-Search field--------------------------------------------
  fiterModelData.searchField = 'name'
  fiterModelData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  //fiterModelData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  fiterModelData.filters = filters
  fiterModelData.filterValues = filterValues
  fiterModelData.associated_multiple_models = associated_multiple_models

  //-------------------------
  //console.log(formData)


  await getSettlementListByCounty(fiterModelData)
    .then(response => {

      for (let i = 0; i < response.data.length; i++) {
        let sett = response.data[i].settlement
        let obj = {}
        if (sett.geom) {
          // console.log(response.data[i].settlement)
          var centroid = turf.centroid(sett.geom)
          //  console.log(sett.name, centroid.geometry.coordinates)
          let coords = centroid.geometry.coordinates
          let value = coords.concat(sett.population)
          obj.name = sett.name
          obj.value = value
          //  console.log(obj)
          InclusionSettlementsMapPoints.value.push(obj)
        }
      }
    });


  InclusionSettlementsMapOptions.value = {
    title: {
      text: inclusionSupportedTitle,
      subtext: 'National Slum Mapping, 2023',
      sublink: "http://kisip.go.ke",
      left: "right",
      textStyle: {
        fontSize: 13
      },
      subtextStyle: {
        fontSize: 11
      }
    },

    toolbox: {
      show: true,
      //orient: 'vertical',
      left: 'left',
      top: 'top',
      feature: {
        dataView: { readOnly: true },
        restore: {},
        saveAsImage: { show: true, pixelRatio: 4 }
      }
    },
    tooltip: {
      trigger: "item"
    },
    legend: {
      orient: "vertical",
      y: "bottom",
      x: "right",
      data: ["Settlements"],
      textStyle: {
        color: "#4c2416"
      }
    },
    geo: {
      map: "KE",
      aspectScale: 0.9999,
      roam: true,
      emphasis: {
        label: {
          show: false
        },
        itemStyle: {
          areaColor: "#2a333d"
        }
      },
      itemStyle: {
        areaColor: "#f0f0f0",
        borderColor: "white"
      }
    },
    series: [

      {
        name: "Settlements",
        type: "effectScatter",
        coordinateSystem: "geo",
        data: InclusionSettlementsMapPoints.value.sort((a, b) => b.value - a.value).slice(0, 6),
        symbolSize: val => val[2] / 100,
        showEffectOn: "render",
        rippleEffect: {
          brushType: "stroke"
        },
        emphasis: {
          scale: true
        },
        tooltip: {
          formatter: function (val) {
            return val.name + ": " + val.value[2];
          }
        },
        label: {
          formatter: "{b}",
          position: "right",
          show: false
        },
        itemStyle: {
          color: "#f4e925",
          shadowBlur: 10,
          shadowColor: "#333"
        },
        zlevel: 1
      }
    ]
  };


}



const tenureSettlementsByCountiesMap = ref()
const InfrastructureSettlementsByCountiesMap = ref()
const InclusionSettlementsByCountiesMap = ref()

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

    //Tenure 
    tenureSettlementsByCountiesMap.value = {
      title: {
        text: tenureSupportedTitle,
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
          saveAsImage: { show: true, pixelRatio: 4 }

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

    // Infrastructure
    InfrastructureSettlementsByCountiesMap.value = {
      title: {
        text: infrastructureSupportedTitle,
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
        min: infMin,
        max: infMax,
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
          saveAsImage: { show: true, pixelRatio: 4 }
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
          data: InfrastructureSettlementsPercounty.value
        }
      ]
    };
    // Inclusion
    InclusionSettlementsByCountiesMap.value = {
      title: {
        text: inclusionSupportedTitle,
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
        min: incMin,
        max: incMax,
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
          saveAsImage: { show: true, pixelRatio: 4 }
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
          data: InclusionSettlementsPercounty.value
        }
      ]
    };


  }

  // getSettlementCountByCounty() // This is only called the first time for the first graph
}

const countOfSettlementbeneficiary = ref()
const getBeneficiariesByCounty = async () => {
  const formData = {}
  formData.model = 'beneficiary'
  formData.summaryField = 'beneficiary.settlement_id'
  formData.summaryFunction = 'count'


  // Asccoiated models 
  //formData.assoc_models = ['settlement', 'households']
  //formData.groupFields = ['settlement.name', 'settlement.household.gender']

  formData.assoc_models = ['households', 'settlement']
  formData.groupFields = ['household.settlement.name', 'household.gender']
  formData.cache_key = 'getBeneficiariesByCounty'

  let subCategories = []
  var maleData = []
  var femaleData = []
  /// Direct beneficiaries 
  await getSummarybyFieldFromMultipleIncludes(formData)
    .then(response => {
      var results = response.Total
      console.log('All Settlemnts beneficiariaeies', results)


      results.forEach(function (item) {
        //  cData.push(parseInt(item.count))
        // subCategories.push(item.name)
        if (subCategories.indexOf(item.name) === -1) subCategories.push(item.name);

      });

      results.forEach(function (dt) {
        if (dt.gender === 'Male') {
          console.log(dt)
          maleData.push(parseInt(dt.count))
        } else {
          femaleData.push(parseInt(dt.count))

        }
      })


      countOfSettlementbeneficiary.value = {
        title: {
          text: TenureSupportedBeneficiaryTitle,
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
            // Use axis to trigger tooltip
            type: 'line' // 'shadow' as default; can also be 'line' or 'shadow'
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
        legend: {
          orient: 'horizontal',
          show: ShowLegend,
          type: 'scroll',
          left: 'left',
          itemWidth: 20,
          itemHeight: 20,
          data: [
            {
              name: 'Male',
              icon: maleIcon
            },
            {
              name: 'Female',
              icon: femaleIcon
            }
          ]
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          data: subCategories

        },
        yAxis: {
          type: 'value'

        },
        series: [
          {
            name: 'Male',
            type: 'bar',
            stack: 'total',
            label: {
              show: true
            },
            emphasis: {
              focus: 'series'
            },
            color: colorPalette[1],
            data: maleData
          },
          {
            name: 'Female',
            type: 'bar',
            stack: 'total',
            color: colorPalette[0],

            label: {
              show: true
            },
            emphasis: {
              focus: 'series'
            },
            data: femaleData
          },

        ]
      };


    });


  // indirect beneficiaries 
  const indirect = {}
  indirect.model = 'beneficiary'
  indirect.summaryField = 'household.length_stay'
  indirect.summaryFunction = 'sum'


  // Asccoiated models 
  indirect.assoc_models = ['households', 'settlement']
  indirect.groupFields = ['household.settlement.name', 'household.gender']


  formData.cache_key = 'getBeneficiariesByCountyindirectResults'

  /// Direct beneficiaries 
  const indirectResults = await getSummarybyFieldFromMultipleIncludes(indirect)


  console.log('Indirect', indirectResults)

}

// --------------Kilometers constrcuted under KISIP I --------------------------------
const sumOfGravelRoadsConstructed = ref()
const TotalRoadsConstructed = ref()
const FootPathsConstructed = ref()
const HighMastsConstructed = ref()




const getRoadsConstructed = async () => {
  const formData = {}
  formData.model = 'indicator_category_report'
  formData.summaryField = 'amount'
  formData.summaryFunction = 'sum'
  // Asccoiated models 
  //formData.assoc_models = ['settlement', 'households']
  //formData.groupFields = ['settlement.name', 'settlement.household.gender']

  formData.assoc_models = ['county']
  formData.groupFields = ['county.name']
  formData.filterField = 'indicator_category_id'
  formData.filterValue = 36
  let RdDataTarmac = []
  formData.cache_key = 'getRoadsConstructed'


  /// Gravel Roads
  await getSummarybyFieldFromMultipleIncludes(formData)
    .then(response => {
      var results = response.Total
      console.log('Sum of Tarmac roads constructed per county', results)
      results.forEach(function (item) {
        var rdData = {}
        if (parseInt(item.sum) > 0) {
          //      cData.push(parseInt(item.sum) / 1000)
          //      subCategories.push(item.name)
          rdData.county = item.name
          rdData.Tarmac = item.sum / 1000
          RdDataTarmac.push(rdData)
        }
      });


    });


  /// Gravel Roads
  formData.filterValue = 37 // 37 - Gravel 
  formData.cache_key = 'getRoadsConstructedGravel'

  const RdDataGravel = []
  await getSummarybyFieldFromMultipleIncludes(formData)
    .then(response => {
      var rdData = {}
      var results = response.Total
      console.log('Sum of Gravel roads constructed per county', results)
      results.forEach(function (item) {
        if (parseInt(item.sum) > 0) {
          rdData.county = item.name
          rdData.Gravel = item.sum / 1000
          RdDataGravel.push(rdData)
        }
      });


    });



  const mergeById = (a1, a2) =>
    a1.map(itm => ({
      ...a2.find((item) => (item.county === itm.county) && item),
      ...itm
    }));

  TotalRoadsConstructed.value = mergeById(RdDataTarmac, RdDataGravel)
  console.log(TotalRoadsConstructed.value);



  sumOfGravelRoadsConstructed.value = {
    title: {
      text: RoadsImprovedTitle,
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

    legend: {
      // Try 'horizontal'
      orient: 'horizontal',
      bottom: 20,

    },
    tooltip: {},
    dataset: {
      dimensions: ['county', 'Tarmac', 'Gravel',],
      source: TotalRoadsConstructed,
    },
    xAxis: { type: 'category' },
    yAxis: {
      axisLabel: {
        formatter: '{value} Km'
      },
      axisPointer: {
        snap: true
      }
    },
    // Declare several bar series, each will be mapped
    // to a column of dataset.source by default.
    series: [{ type: 'bar' }, { type: 'bar' }]
  };



  /// Footpaths
  formData.filterValue = 16 // footpaths
  const footPaths = []
  formData.cache_key = 'getRoadsConstructedFootpaths'

  await getSummarybyFieldFromMultipleIncludes(formData)
    .then(response => {

      var results = response.Total
      console.log('Sum of footPaths Constructed per county', results)
      results.forEach(function (item) {
        var rdData = {}
        if (parseInt(item.sum) > 0) {
          rdData.county = item.name
          rdData.Footpaths = item.sum / 1000
          footPaths.push(rdData)
        }
      });


    });

  console.log(footPaths)

  FootPathsConstructed.value = {
    title: {
      text: footPathsConstructedTitle,
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

    legend: {
      // Try 'horizontal'
      orient: 'horizontal',
      bottom: 20,

    },
    tooltip: {},
    dataset: {
      dimensions: ['county', 'Footpaths',],
      source: footPaths,
    },
    xAxis: { type: 'category' },
    yAxis: {
      axisLabel: {
        formatter: '{value} Km'
      },
      axisPointer: {
        snap: true
      }
    },
    // Declare several bar series, each will be mapped
    // to a column of dataset.source by default.
    series: [{ type: 'bar' }]
  };



  /// Footpaths
  formData.filterValue = 8 // footpaths
  const highmasts = []
  formData.cache_key = 'getRoadsConstructedhighmasts'

  await getSummarybyFieldFromMultipleIncludes(formData)
    .then(response => {

      var results = response.Total
      console.log('Sum of footPaths Constructed per county', results)
      results.forEach(function (item) {
        var rdData = {}
        if (parseInt(item.sum) > 0) {
          rdData.county = item.name
          rdData.Highmasts = item.sum
          highmasts.push(rdData)
        }
      });


    });

  console.log(highmasts)

  HighMastsConstructed.value = {
    title: {
      text: highmastsConstructedTitle,
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

    legend: {
      // Try 'horizontal'
      orient: 'horizontal',
      bottom: 20,

    },
    tooltip: {},
    dataset: {
      dimensions: ['county', 'Highmasts',],
      source: highmasts,
    },
    xAxis: { type: 'category' },
    yAxis: {
      axisLabel: {
        formatter: '{value}'
      },
      axisPointer: {
        snap: true
      }
    },
    // Declare several bar series, each will be mapped
    // to a column of dataset.source by default.
    series: [{ type: 'bar' }]
  };




}


// --------------DPW Beneficiaries KISIP II --------------------------------
const DPWBeneficiariesv2 = ref()

const getInclusionBeneficiaries = async () => {
  const formData = {}
  formData.model = 'indicator_category_report'
  formData.summaryField = 'amount'
  formData.summaryFunction = 'sum'

  formData.assoc_models = ['settlement']
  formData.groupFields = ['settlement.name']
  formData.filterField = 'indicator_category_id'
  formData.filterValue = 26

  let subCategories = []
  let maleSeries = []

  /// Gravel Roads
  formData.cache_key = 'getInclusionBeneficiaries'

  await getSummarybyFieldFromMultipleIncludes(formData)
    .then(response => {
      var results = response.Total
      console.log('Inclusion beneficiaries county', results)
      results.forEach(function (item) {
        if (parseInt(item.sum) > 0) {
          if (subCategories.indexOf(item.name) === -1) subCategories.push(item.name);
          maleSeries.push(parseInt(item.sum))
        }
      });

    });

  /// Female
  formData.filterValue = 33
  let femaleSeries = []
  formData.cache_key = 'getInclusionBeneficiaries33'

  await getSummarybyFieldFromMultipleIncludes(formData)
    .then(response => {
      var results = response.Total
      console.log('Sum of Gravel roads constructed per county', results)
      results.forEach(function (item) {
        if (parseInt(item.sum) > 0) {
          femaleSeries.push(parseInt(item.sum))

        }
      });


    });

  DPWBeneficiariesv2.value = {
    title: {
      text: DPWTraineesTitle,
      subtext: 'National Slum Mapping, 2023',
      left: 'center',
      textStyle: {
        fontSize: 14,
        overflow: "truncate",
        ellipsis: '.....',
        width: 350
      },
      subtextStyle: {
        fontSize: 12
      }
    },



    tooltip: {
      trigger: 'axis',

      axisPointer: {
        // Use axis to trigger tooltip
        type: 'line' // 'shadow' as default; can also be 'line' or 'shadow'
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
    legend: {
      orient: 'horizontal',
      show: ShowLegend,
      type: 'scroll',
      left: 'left',
      itemWidth: 20,
      itemHeight: 20,
      data: [
        {
          name: 'Male',
          icon: maleIcon
        },
        {
          name: 'Female',
          icon: femaleIcon
        }
      ]
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      data: subCategories

    },
    yAxis: {
      type: 'value'

    },
    series: [
      {
        name: 'Male',
        type: 'bar',
        stack: 'total',
        label: {
          show: true
        },
        emphasis: {
          focus: 'series'
        },
        color: colorPalette[1],
        data: maleSeries
      },
      {
        name: 'Female',
        type: 'bar',
        stack: 'total',
        color: colorPalette[0],

        label: {
          show: true
        },
        emphasis: {
          focus: 'series'
        },
        data: femaleSeries
      },

    ]
  };

}



const getAllApi = async () => {
  await Promise.all([
    getUserAccessSource(),
    getCountyGeo(),
    getKisipTenureSettlementsCountByCounty(),
    getKisipInfSettlementsCountByCounty(),
    getKisipInclusionSettlementsCountByCounty(),
    getBeneficiariesByCounty(),
    getRoadsConstructed(),
    getInclusionBeneficiaries()

  ])
  loading.value = false
}

getAllApi()


///////////////- MAP




//////////


const activeName = ref('summary')

</script>

<template>
  <PanelGroup />
  <!--   <el-row :gutter="12">
    <el-col :span="6">
      <el-card shadow="always">
        <el-row :gutter="12">
          <el-col :span="12">
            <div class="fa-3x">
              <span class="fa-layers fa-lg">
                <font-awesome-icon icon="fa-solid fa-road" />
                <span class="fa-layers-counter" style="background:yellowgreen">1,419</span>
              </span>
            </div>
          </el-col>
          <el-col :span="12">
            <span align:center>
              Roads improved (Km)
            </span>
          </el-col>
        </el-row>
      </el-card>
    </el-col>

    <el-col :span="6">
      <el-card shadow="always">
        <el-row :gutter="12">
          <el-col :span="12">
            <div class="fa-3x">
              <el-avatar shape="circle" :size="58" fit="fill" :icon="Download" />
            </div>
          </el-col>
          <el-col :span="12">
            <span align:center>
              Roads improved (Km)
            </span>
          </el-col>
        </el-row>
      </el-card> </el-col>
    <el-col :span="6">
      <el-card shadow="always"> Never </el-card>
    </el-col>
    <el-col :span="6">
      <el-card shadow="always"> Never </el-card>
    </el-col>
  </el-row> -->
  <el-tabs v-loading="loading" element-loading-text="Generating maps, charts and tables......." v-model="activeName"
    class="demo-tabs">
    <el-tab-pane label="Summary" name="summary">
      <ElRow :gutter="20" justify="space-between">
        <ElCol :xl="12" :lg="8" :md="24" :sm="24" :xs="24">
          <ElCard shadow="hover" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <Echart :options="tenureSettlementsByCountiesMap" :height="350" />
            </ElSkeleton>
          </ElCard>
        </ElCol>

        <ElCol :xl="12" :lg="8" :md="24" :sm="24" :xs="24">
          <ElCard shadow="hover" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <!-- <Echart :options="topCountiesWithSlumsData" :height="400" /> -->
              <Echart :options="InfrastructureSettlementsByCountiesMap" :height="350" />

            </ElSkeleton>
          </ElCard>
        </ElCol>

        <ElCol :xl="12" :lg="8" :md="24" :sm="24" :xs="24">
          <ElCard shadow="hover" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <!-- <Echart :options="topCountiesWithSlumsData" :height="400" /> -->
              <Echart :options="InclusionSettlementsByCountiesMap" :height="350" />

            </ElSkeleton>
          </ElCard>
        </ElCol>
      </ElRow>
    </el-tab-pane>

    <el-tab-pane label="Tenure" name="tenure">
      <ElRow :gutter="20" justify="space-between">
        <ElCol :xl="16" :lg="16" :md="24" :sm="24" :xs="24">
          <ElCard shadow="hover" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <Echart :options="countOfSettlementbeneficiary" :height="350" />
            </ElSkeleton>
          </ElCard>
        </ElCol>



        <ElCol :xl="8" :lg="8" :md="24" :sm="24" :xs="24">
          <ElCard shadow="hover" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <!-- <Echart :options="topCountiesWithSlumsData" :height="400" /> -->
              <Echart :options="MapgeopointOptions" :height="350" />

            </ElSkeleton>
          </ElCard>
        </ElCol>
      </ElRow>
    </el-tab-pane>
    <el-tab-pane label="Infrastructure" name="Infrastructure">
      <ElRow class="mt-10px" :gutter="10" justify="space-between">
        <ElCol :xl="8" :lg="16" :md="24" :sm="24" :xs="24">
          <ElCard shadow="hover" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <!-- <Echart :options="topCountiesWithSlumsData" :height="400" /> -->
              <Echart :options="sumOfGravelRoadsConstructed" :height="350" />

            </ElSkeleton>
          </ElCard>
        </ElCol>
        <ElCol :xl="8" :lg="8" :md="24" :sm="24" :xs="24">
          <ElCard shadow="hover" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <!-- <Echart :options="SlumsPerCountyChartData" :height="400" /> -->
              <Echart :options="InfrastructureSettlementsMap" :height="350" />
            </ElSkeleton>
          </ElCard>
        </ElCol>
      </ElRow>

      <ElRow class="mt-10px" :gutter="10" justify="space-between">
        <ElCol :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
          <ElCard shadow="hover" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <!-- <Echart :options="topCountiesWithSlumsData" :height="400" /> -->
              <Echart :options="FootPathsConstructed" :height="350" />

            </ElSkeleton>
          </ElCard>
        </ElCol>
        <ElCol :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
          <ElCard shadow="hover" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <!-- <Echart :options="SlumsPerCountyChartData" :height="400" /> -->
              <Echart :options="HighMastsConstructed" :height="350" />
            </ElSkeleton>
          </ElCard>
        </ElCol>
      </ElRow>


    </el-tab-pane>

    <el-tab-pane label="Inclusion" name="inclusion">
      <ElRow class="mt-10px" :gutter="10" justify="space-between">
        <ElCol :xl="8" :lg="16" :md="24" :sm="24" :xs="24">
          <ElCard shadow="hover" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <!-- <Echart :options="topCountiesWithSlumsData" :height="400" /> -->
              <Echart :options="DPWBeneficiariesv2" :height="350" />
            </ElSkeleton>
          </ElCard>
        </ElCol>
        <ElCol :xl="8" :lg="8" :md="24" :sm="24" :xs="24">
          <ElCard shadow="hover" class="mb-20px">
            <ElSkeleton :loading="loading" animated>
              <!-- <Echart :options="SlumsPerCountyChartData" :height="400" /> -->
              <Echart :options="InclusionSettlementsMapOptions" :height="350" />
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