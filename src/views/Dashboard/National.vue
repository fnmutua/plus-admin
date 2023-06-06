<script setup lang="ts">
import {
  ElRow, ElCol, ElCard, ElDivider, ElCarousel, ElCarouselItem, ElTabPane, ElSkeleton, ElCascader, ElCascaderPanel, ElCascaderPanelContext, ElSelect, ElOption
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


const colorPalette = ['#ff007f', '#0000ff'];  // Male-Female
const maleIcon = 'path://m 146.41936,238.8034 c -5.21101,-1.43402 -7.51545,-6.79358 -6.6619,-11.76943 -0.0588,-45.10952 -0.11757,-90.21905 -0.17635,-135.328563 -5.3022,-1.61412 -3.06375,4.34199 -3.52464,7.58816 -0.0576,14.697923 -0.11511,29.395843 -0.17266,44.093773 -1.72718,6.61806 -12.15586,7.45944 -14.19605,0.88682 -1.42909,-4.98857 -0.22146,-10.60033 -0.62062,-15.83232 0.10773,-15.18837 -0.21551,-30.437173 0.16059,-45.587893 1.91842,-11.228608 12.80383,-20.22421 24.26927,-18.689786 10.60777,1.558898 0.0755,-3.65768 -0.79236,-8.596161 -4.23852,-8.688715 0.80002,-20.073014 9.72708,-23.421847 8.82591,-4.162774 20.30103,1.001172 23.52581,10.108188 2.28945,5.67583 1.4368,12.853955 -2.76118,17.571486 -5.15831,4.024926 -3.94241,5.010805 1.85043,4.362909 13.58742,-1.603119 25.03585,11.840701 23.9554,24.967141 -0.0691,18.213333 -0.13818,36.426673 -0.20726,54.640013 -1.5351,4.55905 -7.30638,6.71543 -11.30858,3.96578 -4.81473,-2.8888 -2.73019,-9.20279 -3.19227,-13.88869 -0.0523,-14.05586 -0.10469,-28.11173 -0.15704,-42.167583 -4.85271,-1.54237 -3.37467,3.24601 -3.51022,6.4208 V 231.02616 c -1.3114,6.77368 -9.29063,10.3384 -15.13544,6.61747 -6.62075,-3.7866 -4.17124,-12.04397 -4.62011,-18.29166 v -70.84935 c -4.85175,-1.54283 -3.39102,3.24111 -3.53094,6.42079 -0.0578,25.5528 -0.11553,51.1056 -0.17329,76.65839 -1.7387,5.48439 -7.13811,8.77105 -12.74767,7.2216 z'
const femaleIcon = 'path://m 39.7122,238.0264 c -5.604205,-1.49359 -5.822698,-7.32898 -5.431108,-11.96235 -0.05932,-18.97406 -0.118632,-37.94813 -0.177948,-56.92219 -7.401109,0.0507 -14.802279,0.16954 -22.203547,0.1438 8.050221,-26.97466 15.83106,-54.03787 24.0791,-80.948455 -6.246873,-1.537447 -5.103818,6.332986 -7.12857,10.198179 -4.203419,12.783656 -7.28462,25.995046 -12.31951,38.467156 C 6.215777,147.43407 -0.93895389,129.58252 6.2279437,121.52707 11.709639,105.71684 15.006783,88.999576 22.521999,73.9779 25.487431,65.143259 38.425956,64.174487 43.879817,63.247984 35.242261,58.307767 32.195248,46.181151 37.843175,37.985287 c 5.35176,-7.73122 16.727442,-10.988636 24.757146,-5.16531 11.321083,6.562216 10.452089,25.024381 -1.135269,30.670395 9.830628,-0.28155 20.086569,3.623662 24.845207,12.765524 3.87086,7.45858 5.12438,16.169298 8.137928,24.037484 2.906124,10.26421 6.922833,20.35157 9.297803,30.70045 1.06345,4.17564 -1.66552,9.02385 -6.181687,9.2796 -7.686885,1.11419 -8.783192,-8.80355 -10.70406,-14.18732 -3.87502,-12.5653 -7.681429,-25.15172 -11.575988,-37.711005 -8.798872,-0.113812 1.949333,13.898795 1.781574,19.941085 6.048408,20.20812 12.13493,40.40517 18.089502,60.64114 -7.392371,0.35953 -14.803078,0.14681 -22.203496,0.20388 -0.06597,21.22546 -0.131933,42.45093 -0.1979,63.67639 -2.103142,7.13406 -13.415648,7.74398 -15.969932,0.84281 -1.418088,-4.77754 -0.245017,-10.18282 -0.655178,-15.20454 l -0.156843,-49.31466 c -4.44248,-1.05339 -5.844521,0.93365 -4.913879,5.25338 -0.162881,19.18788 0.325808,38.44483 -0.244801,57.58947 -0.334387,5.03435 -6.719798,7.8699 -11.101102,6.02234 z'


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


  }

  // getSettlementCountByCounty() // This is only called the first time for the first graph
}


const getSubsetGeo = async (model, filterFields, filterValues) => {
  console.log('Get all parcels for this settlement ')

  const formData = {}
  formData.model = model
  formData.columnFilterField = filterFields
  formData.selectedParents = filterValues
  formData.id = filterValues

  console.log(formData)
  const res = await getfilteredGeo(formData)

  console.log('filtered Geo:', res.data[0].json_build_object.features)
  var collection = turf.featureCollection(res.data[0].json_build_object.features);
  console.log('collection Geo:', collection)
  subCountyGeo.value = collection
  var bbox = turf.bbox(subCountyGeo.value);
  const y_coord = (bbox[1] + bbox[3]) / 2;
  aspect.value = Math.cos(y_coord * Math.PI / 180);

  console.log('collection aspect:', aspect.value)
  registerMap('KE', subCountyGeo.value);

}

///// ----------------Pocess the statistics card---------------------------------------
////-----------------------------------------------------------------------------------


const getSummary = async (card) => {

  //  var result = getSummary(card.card_model, arrayItem.card_model_field, arrayItem.aggregation)

  var selectModel = card.card_model
  var cmodelField = card.card_model_field
  var aggregMethod = card.aggregation
  var filter_value = card.filter_value
  var computation = card.computation
  var filter_function = card.filter_function
  var unique = card.unique ? card.unique : false

  console.log('unique', unique)
  // getSummary(arrayItem.card_model,arrayItem.card_model_field)

  //var ids = await getIndicatorConfigurations(indicator)

  console.log('thisCard', card)

  // set admin level filtering
  let associated_Models = []
  let filterFields = []
  let filterValues = []
  let filterOperator = []

  if (filter_value) {
    filterFields.push(cmodelField)
    filterValues = [filter_value]
    filterOperator.push(filter_function)
  }

  if (filterLevel.value === 'county') {
    associated_Models.push('subcounty')
    filterFields.push('county_id')
    filterValues.push([selectedCounties.value])
    filterOperator.push(['eq'])
  }

  else if (filterLevel.value === 'subcounty') {
    // filter by subcounty 
    associated_Models.push('ward')
    filterFields.push('subcounty_id')
    filterValues.push([selectedSubCounties.value])
  }
  else if (filterLevel.value === 'national') {
    associated_Models.push('county')


  }




  const formData = {}
  formData.model = selectModel
  formData.summaryField = selectModel + '.' + cmodelField  // concatenating to avoid abiguity
  //formData.summaryField =  cmodelField  // concatenating to avoid abiguity
  formData.summaryFunction = aggregMethod
  //formData.assoc_models = ['county']
  formData.assoc_models = associated_Models
  formData.groupFields = []
  // formData.filterField =['indicator_category_id']
  // formData.filterValue = [ids]    
  formData.filterField = filterFields
  formData.filterValue = filterValues
  formData.calculationType = computation
  formData.filter_function = filter_function
  formData.filterOperator = filterOperator
  formData.uniqueCounts = unique

  console.log('foxrmData', formData)

  try {
    const response01 = await getSummarybyFieldFromMultipleIncludes(formData);
    console.log("Cards sumamrye", response01)
    // console.log('ids', ids)

    // const response = await getSumFilter(sumQuery);
    const amount = response01.Total[0][aggregMethod] ? parseInt(response01.Total[0][aggregMethod]) : 0
    //console.log('Cumulative Data', response.data)

    return amount;
  } catch (error) {
    // Handle any errors that occur during the asynchronous operation
    console.error(error);
    //return null; // or any default value you prefer
    return 0; // or any default value you prefer
  }
};

function xtransformData(data, chartType, aggregationMethod, cfield) {


  // Create array of unique names (categories)
  const uniqueNames = [...new Set(data.map(item => item.name))];
  uniqueNames.sort();

  console.log('uniqueNames', uniqueNames)
  console.log('uniqueCategoryTitlesxdata', data)


  const uniqueCategoryTitles = [...new Set(data.map(item => item[cfield]))];
  uniqueCategoryTitles.sort();

  console.log('uniqueCategoryTitles', uniqueCategoryTitles)

  // Loop through categories and create the resulting object, padding as needed
  const result = uniqueCategoryTitles.map(category => {

    const dataArr = []
    uniqueNames.map(name => {
      const filteredData = data.filter(item => item[cfield] === category && item.name === name);

      console.log("Filtred", filteredData)
      let arr = filteredData.length > 0 ? filteredData.map(item => (item[aggregationMethod] ? parseInt(item[aggregationMethod]) : 0)) : [0]
      console.log("arr", arr)
      dataArr.push(arr[0])


    })

    let objChart = {}
    objChart.name = category
    objChart.type = 'bar'
    objChart.data = dataArr

    if (chartType == 4) { //4-stackhed bar chart
      objChart.stack = 'total'
      objChart.label = {
        show: true
      }
    }
    else if (chartType == 3) { //3 pie bar chart
      objChart.value = dataArr
      objChart.name = category

    }


    if (category == 'Female') {
      objChart.color = colorPalette[0];
    } else if (category == 'Female') {
      objChart.color = colorPalette[1];
    }



    return objChart


  });



  return result;
}


const xgetSummaryMultipleParentsGrouped = async (thisChart) => {

  //var cdata = await xgetSummaryMultipleParentsGrouped(thisChart.card_model, thisChart.card_model_field, thisChart.aggregation, thisChart.type, thisChart.categorized); // first array is the categories // second is the data

  let associated_Models = []
  let filterFields = []
  let filterValues = []
  let groupFields = []

  var cmodel = thisChart.card_model
  var cfield = thisChart.card_model_field
  var cAggregation = thisChart.aggregation
  var chartType = thisChart.type
  var categorizedField = thisChart.categorized
  var unique = thisChart.unique ? thisChart.unique : false

  console.log('unique', unique)

  // thisChart.card_model,thisChart.card_model_field,thisChart.aggregation,  thisChart.type);

  // set admin level filtering






  if (categorizedField) {
    groupFields.push(cmodel + '.' + cfield)

  }

  if (chartType == 5 || chartType == 6) {
    // var groupingFields = ['indicator_category_report.createdAt','indicator_category.category_title']
    groupFields.push(cmodel + '.createdAt')

  }


  if (filterLevel.value === 'county') {
    associated_Models.push('subcounty')
    filterFields.push('county_id')
    filterValues.push([selectedCounties.value])
    groupFields.push('subcounty.name')
  }
  else if (filterLevel.value === 'subcounty') {
    // filter by subcounty 
    associated_Models.push('ward')
    filterFields.push('subcounty_id')
    filterValues.push([selectedSubCounties.value])
    groupFields.push('ward.name')
  }
  else if (filterLevel.value === 'national') {
    associated_Models.push('county')
    groupFields.push('county.name')

  }



  console.log('xgroupFields', groupFields)
  console.log('associated_Models', associated_Models)



  const formData = {}
  formData.model = cmodel
  formData.summaryField = cmodel + '.' + cfield  // Remove ambiguous fields 
  formData.summaryFunction = cAggregation
  formData.assoc_models = associated_Models // ['county', 'indicator_category'] 
  formData.groupFields = groupFields //['county.name','indicator_category.category_title']
  // formData.filterField = ['indicator_category_id']
  // formData.filterValue = [indicator_categories]  // Bitumen
  formData.filterField = filterFields
  formData.filterOperator = ['eq'] // Bitumen
  formData.filterValue = filterValues

  // added for unique couts 
  formData.uniqueCounts = unique

  try {
    const response = await getSummarybyFieldFromMultipleIncludes(formData);
    const amount = response.Total;
    console.log('Data xcounty', amount)


    let categoryArray = [];
    let seriesData = [];
    amount.forEach(obj => {
      if (!categoryArray.includes(obj.name)) {
        categoryArray.push(obj.name);
      }
    });





    if (chartType == 5) {
      console.log('Data line chart ', amount)

      const keys = amount.reduce((allKeys, obj) => {
        return allKeys.concat(Object.keys(obj));
      }, []);

      const uniqueKeys = [...new Set(keys)];
      const values = {};
      uniqueKeys.forEach(key => {
        values[key] = amount.map(obj => obj[key] || null);
      });
      categoryArray = values.createdAt
      seriesData = values[cAggregation]
    }


    else if (chartType == 6) {
      console.log('Multi-line chart ', amount)
      //  Step 1: Extract and sort unique dates in ascending order
      const dates = [...new Set(amount.map(item => item.createdAt))].sort();

      // Step 2: Rearrange the data
      const result = {};

      for (const item of amount) {
        const { createdAt, cAggregation } = item;
        //     console.log('xxxx',item,item[cfield])

        if (!result[item[cfield]]) {
          result[item[cfield]] = {
            name: item[cfield],
            type: 'line',
            stack: 'Total',
            data: []
          };
        }

        const dateIndex = dates.indexOf(createdAt);
        result[item[cfield]].data.push([dateIndex, Number(cAggregation)]);

      }


      seriesData = Object.values(result);
      categoryArray = dates
      console.log('seriesData>>>>6', seriesData);



    }


    else if (chartType == 7) {
      console.log('Map chart ', amount)


      let maxSum = Number.MIN_SAFE_INTEGER;
      let minSum = Number.MAX_SAFE_INTEGER;

      for (const item of amount) {
        const values = Object.values(item);
        for (const value of values) {
          if (!isNaN(value)) {
            const numValue = parseInt(value);
            maxSum = Math.max(maxSum, numValue);
            minSum = Math.min(minSum, numValue);
          }
        }
      }
      // if only one value then use min=0
      if (minSum === maxSum) {
        minSum = 0
      }

      console.log("Maximum sum:", maxSum);
      console.log("Minimum sum:", minSum);


      // Rename the property to value 
      const newPropertyName = "value";

      for (let i = 0; i < amount.length; i++) {
        const keys = Object.keys(amount[i]);
        if (keys.length > 1) {
          const oldValue = keys[1];
          amount[i][newPropertyName] = amount[i][oldValue];
          delete amount[i][oldValue];
        }
      }
      categoryArray = [minSum, maxSum]
      seriesData = amount

      console.log('Map chart2 ', amount)


    }


    else {

      //  const valuesArray = amount.map(obj => obj.sum);
      seriesData = xtransformData(amount, chartType, cAggregation, cfield);
      categoryArray.sort();


      console.log('xseries', seriesData)
    }





    //   return amount;
    return [categoryArray, seriesData];
  } catch (error) {
    // Handle any errors that occur during the asynchronous operation
    console.error(error);
    //return null; // or any default value you prefer
    return []; // or any default value you prefer
  }


}

const cardSymbol = ref()
const getCardData = async () => {

  var filters = ['dashboard_id']
  var filterValues = [[dashboard_id.value]]  // make sure the inner array is array



  cards.value = []
  const formData = {}
  // formData.limit = 10
  // formData.page = 1
  // formData.curUser = 1 // Id for logged in user
  formData.model = 'dashboard_card'
  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------
  formData.associated_multiple_models = []

  formData.filters = filters
  formData.filterValues = filterValues

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  // cards.value = res.data

  res.data.forEach(function async(arrayItem) {
    console.log('getting teh card', arrayItem)
    if (arrayItem.computation === 'proportion') {
      cardSymbol.value = '%'
    } else {
      cardSymbol.value = ''
    }



    var result = getSummary(arrayItem)
    //  var result = getSummary(arrayItem.card_model, arrayItem.card_model_field, arrayItem.aggregation)

    result.then((result) => {
      console.log(result); // "Promise resolved!"
      let card = arrayItem
      card.value = result
      card.symbol = cardSymbol.value
      cards.value.push(card)
    });

  })


  console.log('After Querry', res)

}

const getCards = async () => {
  getCardData()
  cardLoading.value = false
}




///// ----------------Process sections and charts---------------------------------------
////-----------------------------------------------------------------------------------






const countyList = ref([])
const subCountyList = ref([])
const filteredSubCountyList = ref([])


const getCountySubcountySep = async () => {
  // initialize every time its called
  const nested = ['subcounty', 'ward', 'settlement']
  const res = await getListWithoutGeo({

    params: {
      //   pageIndex: 1,
      //  limit: 100,
      curUser: 1, // Id for logged in user
      model: 'county',
      assocModel: 'subcounty',
      searchField: 'name',
      nested_models: nested,
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received  cascaded response:', response)
    //tableDataList.value = response.data
    const ret = response.data



    ret.forEach((data) => {
      const coption = {
        value: data.id,
        label: data.name + ' county',
        children: []
      };
      countyList.value.push(coption)

      data.subcounties.forEach((subc) => {
        const soption = {
          value: subc.id,
          label: subc.name + ' constituency',
          county_id: data.id,
          children: []
        };

        subCountyList.value.push(soption);
        filteredSubCountyList.value.push(soption);

        subc.wards.forEach((ward) => {
          const woption = {
            value: ward.id,
            label: ward.name,
            subcounty_id: ward.subcounty_id,
            county_id: ward.county_id,
            children: []
          };
          ward.settlements.forEach((settlement) => {
            const sett_option = {
              value: settlement.id,
              label: settlement.name + ' settlement',
              subcounty_id: settlement.subcounty_id,
              county_id: settlement.county_id,
              ward_id: settlement.ward_id,
            };

            woption.children.push(sett_option)

          })
          soption.children.push(woption)
        })
        coption.children.push(soption)
      })

    });


  })

  // console.log('countyOptions', countyList)
  // console.log('filteredSubCountyList', filteredSubCountyList)
}



////-----------------------------------------------------------------------------------


getCountySubcountySep()



onMounted(() => {


  console.log(activeTab)
  loading.value = false
});



const selectCounty = ref([])
const selectSubCounty = ref([])
const handleClear = async () => {
  selectSubCounty.value = null
  selectCounty.value = null


}


const filterCounty = async (county_id) => {
  //selectSubCounty.value=null
  filteredSubCountyList.value = subCountyList.value.filter(option => county_id.includes(option.county_id));
  console.log('xyz', filteredSubCountyList.value)

  selectedCounties.value = county_id;

  console.log(selectedCounties.value);  // [1]
  if (selectedCounties.value.length == 0) {
    filterLevel.value = 'national'
  } else {
    filterLevel.value = 'county'

  }

  console.log('filterLevel.value', selectedCounties.value)

}




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
                <p class="value-text">1411</p>
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
                <p class="value-text">10,000,000</p>
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
                <p class="value-text">10B</p>
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
                <p class="value-text">45%</p>
                <p class="value-label">Own structures in informal Settlements</p>
              </div>

            </div>
          </el-card>
        </ElSkeleton>

      </div>
    </el-col>

  </el-row>


  <el-row :gutter="20">

    <el-col :xs="24" :sm="24" :md="12" :lg="12">
      <div class="tabs-container">
        <ElSkeleton :loading="cardLoading" animated>
          <el-carousel height="350px">
            <el-carousel-item v-for="item in 2" :key="item">
              <el-card class="box-card">
                <div class="image" style="position: relative;">
                  <img src="@/assets/imgs/dashboard01.png" class="image" />
                  <div class="overlay-text">
                    <h3>Your Text Here</h3>
                    <a href="link_to_resource">Link to Resource</a>
                  </div>
                </div>
              </el-card>
            </el-carousel-item>
          </el-carousel>
        </ElSkeleton>
      </div>
</el-col>

<el-col :xs="24" :sm="24" :md="12" :lg="12">
      <div class="tabs-container">
        <ElSkeleton :loading="cardLoading" animated>
           
          <el-card class="box-card"> 
            <span>Map here..</span>
            </el-card>
        </ElSkeleton>
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
</style>