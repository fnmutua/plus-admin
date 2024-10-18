<script setup lang="ts">
import {
  ElRow, ElCol, ElCard, ElDivider, ElTabs, ElTabPane, ElSkeleton, ElCascader, ElCascaderPanel, ElCascaderPanelContext, ElSelect, ElOption
} from 'element-plus'

import { ref, reactive, watch, onBeforeMount, onMounted } from 'vue'

import { use } from "echarts/core";


import { Icon } from '@iconify/vue';

import {
  pieOptions,  multipleBarChart, stacklineOptions, mapChartOptions,
  lineOptions, stackedbarOptions, barMaleFemaleOptions, simpleBarChart,stackedbarOptionsAbs
} from './chart-types'
import { EChartsOption, registerMap } from 'echarts'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountFilter, getSumFilter } from '@/api/settlements'
import { useI18n } from '@/hooks/web/useI18n'
import { getSummarybyFieldFromMultipleIncludes } from '@/api/summary'
import { getCountyListApi, getListWithoutGeo } from '@/api/counties'
import { getfilteredGeo } from '@/api/settlements'

import {  getSummaryGroupByMultipleFields, getSummarybyFieldNested } from '@/api/summary'

import * as turf from '@turf/turf'
import { getAllGeo } from '@/api/settlements'
import { useRoute } from 'vue-router'

import VueApexCharts from "vue3-apexcharts"

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
import { getRoutesList } from '@/api/settlements'

import {
  FullScreen,
} from '@element-plus/icons-vue'


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



function convertStringsToNumbers(stringArray) {
        return stringArray.map(Number);
      }

////-----------------------------------------------------------------------------------

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
  console.log("getRoutesList",res.data[0].id)

  //dashboard_id.value =res.data[0].id  // get the id of the first dashboard

  res.data.forEach(function async(arrayItem) {

    if (arrayItem.main_dashboard) {
      dashboard_id.value = arrayItem.id  // get the id of the first dashboard

      console.log( 'dashboard_id.value', dashboard_id.value)
    }

   })

}
//getDynamicDashboards()


onBeforeMount( async () => {
    console.log("Before mount");
      //dashboard_id.value = 1;
    // page_title.value = this.$route.meta.title;
  await getDynamicDashboards();
    getCountyGeo()
    getCards()
    getCountySubcountySep()
    getTabs()

   console.log(dashboard_id.value)
  });

//  watch(
//   route,
//     () => {
//     console.log("Watching...............................", route.meta);
     
//     // Proceed with other operations or page loading
//       dashboard_id.value = 1
//     // page_title.value = route.meta.title
//   },
//   { deep: true, immediate: true }
// );


const activeTab = ref();
const loading = ref(true)
const cardLoading = ref(true)


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
const fmap = ref(false)

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

    registerMap('KE', res.data[0].json_build_object);
    fmap.value=true
    console.log('fmap',fmap.value)

 
  }  

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
    var unique = card.unique?card.unique:false 
    var filters = card.filters

  console.log('unique',unique)
  // getSummary(arrayItem.card_model,arrayItem.card_model_field)

  //var ids = await getIndicatorConfigurations(indicator)

  console.log('thisCard',card)

  // set admin level filtering
  let associated_Models = []
  let filterFields = []
  let filterValues = []
  let filterOperators =[]

  if(filters) {

for (const item of filters ) {
  if(item.field) {
    filterFields.push(item.field);
  filterValues.push(item.value);
  filterOperators.push(item.operation);
  }

}
}




  if (filterLevel.value === 'county') {
    associated_Models.push('subcounty')
    // filterValues.push(selectedCounties.value)

    // for (let i = 0; i < selectedCounties.value.length; i++) { 
    //   filterFields.push('county_id')
    //   filterOperator.push(['eq'])
    // }


    filterFields.push('county_id')
     filterValues.push(selectedCounties.value)
    filterOperators.push('or')


  }

  else if (filterLevel.value === 'subcounty') { 
    // filter by subcounty 
    associated_Models.push('ward')
    //filterFields.push('subcounty_id')
    // filterValues.push(selectedSubCounties.value)
    // for (let i = 0; i < selectedSubCounties.value.length; i++) { 
    //   filterFields.push('subcounty_id')
    //   filterOperator.push(['eq'])
    // }

    
    filterFields.push('subcounty_id')
     filterValues.push(selectedSubCounties.value)
    filterOperators.push('or')

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
  formData.filterOperator = filterOperators
  formData.uniqueCounts =unique

  console.log('foxrmData',formData)

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


    console.log('Pie-chart',chartType )



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
  let filterOperators = []


  var cmodel = thisChart.card_model
  var filters = thisChart.filters

  var cfield = thisChart.card_model_field
  var cAggregation = thisChart.aggregation
  var chartType = thisChart.type
  var categorizedField =thisChart.categorized
  var unique = thisChart.unique?thisChart.unique:false 
  var ignoreEmpty = thisChart.ignore_empty?thisChart.ignore_empty:false
  console.log('unique',unique)
 


  if(filters) {

    for (const item of filters ) {
      if(item.field) {
        filterFields.push(item.field);
      filterValues.push(item.value);
      filterOperators.push(item.operation);
      }

    }
    }



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
     filterValues.push(selectedCounties.value)
    filterOperators.push('or')

    if(chartType!=3) { 
      groupFields.push('subcounty.name')
    }

  }


  else if (filterLevel.value === 'subcounty') { 
    // filter by subcounty 
    associated_Models.push('ward')
    // filterValues.push(selectedSubCounties.value)

    // for (let i = 0; i < selectedSubCounties.value.length; i++) { 
    //   filterFields.push('subcounty_id')
    // }

    filterFields.push('subcounty_id')
     filterValues.push(selectedSubCounties.value)
    filterOperators.push('or')


    if(chartType!=3) { 
      groupFields.push('ward.name')
    }
  }




  else if (filterLevel.value === 'national' ) {
    associated_Models.push('county')


     if(chartType!=3) { 
      groupFields.push('county.name')
    }

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
  formData.filterOperator =filterOperators // Bitumen
  formData.filterValue = filterValues

  // added for unique couts 
  formData.uniqueCounts = unique
  formData.ignoreEmpty = ignoreEmpty
  

  console.log('form-2-Data',formData)


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

   

 
    else if (chartType == 6 ) {
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

    else if (chartType == 3) {
      console.log('piechart--- ', amount)
  

     // seriesData = xtransformData(amount, chartType, cAggregation, cfield);
     // categoryArray.sort();

      // Extract keys (property names) from the first object
        const keys = Object.keys(amount[0]);

        // Extract values for each key into separate arrays
        const extractedData = keys.map(key => amount.map(item => item[key]));

        console.log('extractedData',extractedData)
        categoryArray =extractedData[0]
        seriesData =convertStringsToNumbers(extractedData[1])


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
      console.log('Proportiongs......')
     var cardSymbol='%'
    } else {
      var cardSymbol = ''
       }



    var result = getSummary(arrayItem)
  //  var result = getSummary(arrayItem.card_model, arrayItem.card_model_field, arrayItem.aggregation)

  result.then((crd) => {
      console.log('resultx',crd); // "Promise resolved!"
      let card = arrayItem
      card.value = crd
      card.symbol=cardSymbol
      cards.value.push(card)
    });

  })


  console.log('After Querry', res)
  cards.value.sort((a, b) => a.id - b.id);

}

const getCards = async () => {
  getCardData()
  cardLoading.value = false
}




///// ----------------Process sections and charts---------------------------------------
////-----------------------------------------------------------------------------------


const getCharts = async (section_id) => {

  const formData = {}
  formData.curUser = 1 // Id for logged in user
  formData.model = 'dashboard_section_chart'
  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword = ''
  formData.filters = ['dashboard_section_id']
  formData.filterValues = [[section_id]]
  //--Single Filter -----------------------------------------
  formData.associated_multiple_models = ['dashboard_section']
  //const nested_models = ['indicator_category', 'indicator'] // The mother, then followed by the child
  //formData.nested_models = ['indicator', 'activity']

  //-------------------------
  const charts = reactive([]);
  try {
    const response = await getSettlementListByCounty(formData);
    //  const charts = response.data;
    console.log('Getting the charts ', response.data)


    response.data.forEach(function async(thisChart) {
      console.log('This Chart:', thisChart)



      // function to process processMultiBarChart charts 
      async function processPieChart() {
        const promises = [async function () {
          console.log('pie  chart details:', thisChart.card_model, thisChart.card_model_field, thisChart.aggregation);

          try {

            var cdata = await xgetSummaryMultipleParentsGrouped(thisChart ); // first array is the categories // second is the data
            console.log('piechart - cdata',cdata);


            const UpdatedPieOptionsMultiple = {
              ...pieOptions,
              title: {
                ...pieOptions.title,
                text: thisChart.title
              },

              // series: {
              //   ...pieOptions.series[0],
              //   data: cdata[1]    // data 
              // },

              labels:cdata[0],
              series:cdata[1] 


            };

            console.log('UpdatedPieOptionsMultiple', UpdatedPieOptionsMultiple)
            console.log('cdata', cdata[1][0].data)

            

            thisChart.chart = UpdatedPieOptionsMultiple




            // show no data 
            if (cdata[1].length === 0) {
              thisChart.chart.graphic = [{
                type: 'text',
                left: 'center',
                top: 'middle',
                style: {
                  text: 'No data  available',
                  fill: '#999',
                  fontSize: 16
                },
                z: 100 // Higher z value to place it on top

              }]
            }





          } catch (error) {
            // Handle any errors that occurred during the process
          }
        }];

        //     await Promise.all(promises);
        await promises[0]();

        // The loop has completed and all promises have been resolved/rejected
        console.log('Loop completed');





        charts.push(thisChart)
        // Continue with the rest of your code here
      }

      // function to process processMultiBarChart charts 
      async function processSimpleBarChart() {
        const promises = [async function () {
          console.log('This chart details:', thisChart.card_model, thisChart.card_model_field, thisChart.aggregation);

          try {

            var cdata = await xgetSummaryMultipleParentsGrouped(thisChart ); // first array is the categories // second is the data
            console.log(cdata);

            const UpdatedBarOptionsMultiple = {
              ...simpleBarChart,
              title: {
                ...simpleBarChart.title,
                text: thisChart.title
              },
              xaxis: {
                ...simpleBarChart.xaxis,
                categories: cdata[0] // categories as received 
              },
            };

            thisChart.chart = UpdatedBarOptionsMultiple;
            thisChart.chart.series = cdata[1];

            // show no data 
            if (cdata[1].length === 0) {
              thisChart.chart.graphic = [{
                type: 'text',
                left: 'center',
                top: 'middle',
                style: {
                  text: 'No data available',
                  fill: '#999',
                  fontSize: 16
                },
                z: 100 // Higher z value to place it on top
              }];
            }

          } catch (error) {
            // Handle any errors that occurred during the process
          }
        }];

        //     await Promise.all(promises);
        await promises[0]();

        // The loop has completed and all promises have been resolved/rejected
        console.log('Loop completed');





        charts.push(thisChart)
        // Continue with the rest of your code here
      }

      // function to process processMultiBarChart charts 
      async function processMultiBarChart() {
        const promises = [async function () {
          console.log('This chart details:', thisChart.card_model, thisChart.card_model_field, thisChart.aggregation);

          try {

            var cdata = await xgetSummaryMultipleParentsGrouped(thisChart ); // first array is the categories // second is the data
            console.log('Multi[e]', cdata);

            const UpdatedBarOptionsMultiple = {
              ...multipleBarChart,
              title: {
                ...multipleBarChart.title,
                text: thisChart.title
              },
              xAxis: {
                ...multipleBarChart.xAxis,
                categories: cdata[0] // categories as received 
              },
            };

            thisChart.chart = UpdatedBarOptionsMultiple;
            thisChart.chart.series = cdata[1];

            // show no data 
            if (cdata[1].length === 0) {
              thisChart.chart.graphic = [{
                type: 'text',
                left: 'center',
                top: 'middle',
                style: {
                  text: 'No data available',
                  fill: '#999',
                  fontSize: 16
                },
                z: 100 // Higher z value to place it on top
              }];
            }

          } catch (error) {
            // Handle any errors that occurred during the process
          }
        }];

        //     await Promise.all(promises);
        await promises[0]();

        // The loop has completed and all promises have been resolved/rejected
        console.log('Loop completed');





        charts.push(thisChart)
        // Continue with the rest of your code here
      }

      // function to process processStackedBarChart charts 
      async function processStackedBarChart() {
        const promises = [async function () {
          console.log('This stack chart details:', thisChart.card_model, thisChart.card_model_field, thisChart.aggregation);
 
          try {

            var cdata = await xgetSummaryMultipleParentsGrouped(thisChart ); // first array is the categories // second is the data
            console.log('stacked.Male.female.', cdata);



            for (var i = 0; i < cdata[1].length; i++) {
              cdata[1][i].label = {
                show: false,
                position: 'inside'
              };
              // cdata[1][i].stack = 'total'
              // cdata[1][i].type = 'bar'
            }



            const UpdatedBarOptionsMultiple = {
              ...stackedbarOptions,
              title: {
                ...stackedbarOptions.title,
                text: thisChart.title
              },
              xaxis: {
                ...stackedbarOptions.xaxis,
                categories: cdata[0],  // categories as recieved 
             //   type:'category'
              },

              series:  cdata[1]   
            };

            console.log('stacked >>>>',  UpdatedBarOptionsMultiple)


            thisChart.chart = UpdatedBarOptionsMultiple



           //thisChart.chart.series = cdata[1]



            // show no data 
            if (cdata[0].length === 0) {
              thisChart.chart.graphic = [{
                type: 'text',
                left: 'center',
                top: 'middle',
                style: {
                  text: 'No data  available',
                  fill: '#999',
                  fontSize: 16
                },
                z: 100 // Higher z value to place it on top

              }]
            }


          } catch (error) {
            // Handle any errors that occurred during the process
          }
        }];

        //     await Promise.all(promises);
        await promises[0]();

        // The loop has completed and all promises have been resolved/rejected
        console.log('Loop completed');





        charts.push(thisChart)
        // Continue with the rest of your code here
      }



       // function to process processStackedBarChart charts 
       async function processStackedBarChartAbs() {
        const promises = [async function () {
          console.log('This stack chart details:', thisChart.card_model, thisChart.card_model_field, thisChart.aggregation);
 
          try {

            var cdata = await xgetSummaryMultipleParentsGrouped(thisChart ); // first array is the categories // second is the data
            console.log('stacked.Male.female.', cdata);
            for (var i = 0; i < cdata[1].length; i++) {
              cdata[1][i].label = {
                show: false,
                position: 'inside'
              };
              // cdata[1][i].stack = 'total'
              // cdata[1][i].type = 'bar'
            }

            const UpdatedBarOptionsMultiple = {
              ...stackedbarOptionsAbs,
              title: {
                ...stackedbarOptionsAbs.title,
                text: thisChart.title
              },
              xaxis: {
                ...stackedbarOptionsAbs.xaxis,
                categories: cdata[0],  // categories as recieved 
             //   type:'category'
              },

              series:  cdata[1]   
            };

            console.log('stackedbarOptionsAbs >>>>',  UpdatedBarOptionsMultiple)


            thisChart.chart = UpdatedBarOptionsMultiple

           //thisChart.chart.series = cdata[1]

            // show no data 
            if (cdata[0].length === 0) {
              thisChart.chart.graphic = [{
                type: 'text',
                left: 'center',
                top: 'middle',
                style: {
                  text: 'No data  available',
                  fill: '#999',
                  fontSize: 16
                },
                z: 100 // Higher z value to place it on top

              }]
            }


          } catch (error) {
            // Handle any errors that occurred during the process
          }
        }];

        //     await Promise.all(promises);
        await promises[0]();

        // The loop has completed and all promises have been resolved/rejected
        console.log('Loop completed');

        charts.push(thisChart)
        // Continue with the rest of your code here
      }



      // function to process processMultiBarChart charts 
      async function processLineChart() {
        const promises = [async function () {
          console.log('This chart details:', thisChart.card_model, thisChart.card_model_field, thisChart.aggregation);

          try {

            var cdata = await xgetSummaryMultipleParentsGrouped(thisChart ); // first array is the categories // second is the data
            console.log('Multi[e]', cdata);



            const UpdatedBarOptionsMultiple = {
              ...lineOptions,
              title: {
                ...lineOptions.title,
                text: thisChart.title
              },
              xAxis: {
                ...lineOptions.xAxis,
                data: cdata[0]  // categories as recieved 
              },
              series: {
                ...lineOptions.series[0],
                data: cdata[1],  // categories as recieved 
                name: thisChart.card_model_field
              },
            };


            thisChart.chart = UpdatedBarOptionsMultiple

            // show no data 
            if (cdata[1].length === 0) {
              thisChart.chart.graphic = [{
                type: 'text',
                left: 'center',
                top: 'middle',
                style: {
                  text: 'No data  available',
                  fill: '#999',
                  fontSize: 16
                },
                z: 100 // Higher z value to place it on top

              }]
            }



          } catch (error) {
            // Handle any errors that occurred during the process
          }
        }];

        //     await Promise.all(promises);
        await promises[0]();

        // The loop has completed and all promises have been resolved/rejected
        console.log('Loop completed');





        charts.push(thisChart)
        // Continue with the rest of your code here
      }
      // function to process processMultiBarChart charts 
      async function processStackLineChart() {
        const promises = [async function () {
          console.log('This chart details:', thisChart.card_model, thisChart.card_model_field, thisChart.aggregation);

          try {

            var cdata = await xgetSummaryMultipleParentsGrouped(thisChart ); // first array is the categories // second is the data
            console.log('Multi[e]', cdata);


            // sort the data such that the graphs start and end proper


            cdata[1].forEach(obj => {
              obj.data.sort((a, b) => a[0] - b[0]); // theres a nested data array 
            });

            const UpdatedBarOptionsMultiple = {
              ...stacklineOptions,
              title: {
                ...stacklineOptions.title,
                text: thisChart.title
              },
              xAxis: {
                ...stacklineOptions.xAxis,
                data: cdata[0]  // categories as recieved 
              },

            };
            UpdatedBarOptionsMultiple.series = cdata[1]


            console.log("old chart", stacklineOptions)
            console.log("New chart", UpdatedBarOptionsMultiple)

            thisChart.chart = UpdatedBarOptionsMultiple

            // show no data 
            if (cdata[1].length === 0) {
              thisChart.chart.graphic = [{
                type: 'text',
                left: 'center',
                top: 'middle',
                style: {
                  text: 'No data  available',
                  fill: '#999',
                  fontSize: 16
                },
                z: 100 // Higher z value to place it on top

              }]
            }

          } catch (error) {
            // Handle any errors that occurred during the process
          }
        }];

        //     await Promise.all(promises);
        await promises[0]();

        // The loop has completed and all promises have been resolved/rejected
        console.log('Loop completed');





        charts.push(thisChart)
        // Continue with the rest of your code here
      }


      // function to process processMultiBarChart charts 
      async function processMapChart() {
        const promises = [async function () {
          console.log('This chart details:', thisChart.card_model, thisChart.card_model_field, thisChart.aggregation);

          try {

            var cdata = await xgetSummaryMultipleParentsGrouped(thisChart ); // first array is the categories // second is the data
            console.log('map data', cdata)
            var MaxMin = cdata[0]
           // await getCountyGeo()
            //await getSubsetGeo(model,filterFields, filterValues)
            if (selectedCounties.value.length > 0 && filterLevel.value === 'county') {
              await getSubsetGeo('subcounty', ['county_id'], selectedCounties.value)

            }
            if (selectedSubCounties.value.length > 0 && filterLevel.value === 'subcounty') {
              await getSubsetGeo('ward', ['subcounty_id'], selectedSubCounties.value)

            }


            console.log('apsect', aspect.value)


            const UpdatedMapOtions = {
              ...mapChartOptions,
              title: {
                ...mapChartOptions.title,
                text: thisChart.title
              },
              visualMap: {
                ...mapChartOptions.visualMap,
                min: MaxMin[0],
                max: MaxMin[1]

              },
              // visualMap: {
              //   ...mapChartOptions.visualMap,
              //   max: MaxMin[1]
              // },

              series: {
                ...mapChartOptions.series[0],
                data: cdata[1],  // categories as recieved ,
                aspectScale: aspect.value
              },
              // series: {
              //   ...mapChartOptions.series[0],
              //   aspectScale: 0.88  // categories as recieved 
              // },


            };
            //   UpdatedMapOtions.series[0].aspectScale=aspect.value

            // sort the data such that the graphs start and end proper

            thisChart.chart = UpdatedMapOtions

            // show no data 
            if (cdata[1].length === 0) {
              thisChart.chart.graphic = [{
                type: 'text',
                left: 'center',
                top: 'middle',
                style: {
                  text: 'No data  available',
                  fill: 'red',
                  fontSize: 16
                },
                z: 100 // Higher z value to place it on top

              }]
            }


          } catch (error) {
            // Handle any errors that occurred during the process
          }
        }];

        //     await Promise.all(promises);
        await promises[0]();

        // The loop has completed and all promises have been resolved/rejected
        console.log('Loop completed');





        charts.push(thisChart)
        // Continue with the rest of your code here
      }
      // function to process processMultiBarChart charts 
      async function processPyramid() {
        const promises = [async function () {

          try {

            const formData = {}
            formData.model = 'households'
            formData.summaryFunction = 'sum'

            let males = ['age_00_04f',  'age_05_09f',  'age_10_14f','age_15_19f', 'age_20_24f', 'age_25_29f',  'age_30_34f',  'age_35_39f',  'age_40_44f', 'age_45_49f', 'age_50_54f',  'age_55_59f', 'age_60_64f', 'age_65_69f', 'age_gt_70f'  ]

            let females = [ 'age_00_04m', 'age_05_09m', 'age_10_14m',  'age_15_19m', 'age_20_24m','age_25_29m','age_30_34m','age_35_39m','age_40_44m', 'age_45_49m', 'age_50_54m','age_55_59m',  'age_60_64m', 'age_65_69m','age_gt_70m']

            const fields = females.concat(males);

            // set admin level filtering
            let filterFields = []
            let filterValues = []

            if (filterLevel.value === 'county') {
              filterFields.push('county_id')
              filterValues.push([selectedCounties.value])


            }
            else if (filterLevel.value === 'subcounty') { 
              // filter by subcounty 
               filterFields.push('subcounty_id')
              filterValues.push([selectedSubCounties.value])
             }

            else if (filterLevel.value === 'national') {


            }

            // Asccoiated models 
            formData.assoc_model = []
            formData.summaryFields = fields
            formData.groupField = 'gender'

            formData.filters = filterFields
            formData.filterValues = filterValues






            //formData.cache_key = 'getSettlementPopPyramid_by_gender'

            await getSummaryGroupByMultipleFields(formData)
              .then(response => {
                if (response.Total) {
                  var results = response.Total
                  let keys = Object.keys(results[0]);

                  // Males
                  let maleKeys = keys.filter(key => key.includes("m"));
                  let males = maleKeys.map(key => parseInt(results[0][key]))
                  // console.log('pyramid---m-->', males)

                  mArray.value.push(males)


                  // females
                  let femaleKeys = keys.filter(key => key.includes("f"));
                  let females = femaleKeys.map(key => -1*parseInt(results[0][key])) // We put Female left (Negative) 
                  //console.log('pyramid---f-->', femaleKeys, females)
                  fArray.value.push(females)


                  var pyOptions = {
                    title: {
                      text: thisChart.title,
                      subtext: `National Slum Database, ${new Date().getFullYear()}`, // Get the current year dynamically
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
                        data: males
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
                        data: females
                      }
                    ]
                  };

                  console.log('pyOptions', pyOptions)

                  thisChart.chart = pyOptions
                }


              });


 


            //   UpdatedMapOtions.series[0].aspectScale=aspect.value

            // sort the data such that the graphs start and end proper






          } catch (error) {
            // Handle any errors that occurred during the process
          }
        }];

        //     await Promise.all(promises);
        await promises[0]();

        // The loop has completed and all promises have been resolved/rejected
        console.log('Loop completed');





        charts.push(thisChart)
        // Continue with the rest of your code here
      }

      // Run the approriate funtion 
      if (thisChart.type == 1) {
        console.log('processSimpleBarChart')
        processSimpleBarChart()
      }

      else if (thisChart.type == 2) {
        processMultiBarChart();
      }

      else if (thisChart.type == 3) {
        processPieChart();

      }

      else if (thisChart.type == 4  ) {
        processStackedBarChart();
      }

      else if (thisChart.type == 9  ) {
        processStackedBarChartAbs();
      }




      else if (thisChart.type == 5) {
        processLineChart();
      }

      else if (thisChart.type == 6) {
        processStackLineChart();
      }

      else if (thisChart.type == 7) {
        processMapChart();
      }

      else if (thisChart.type == 8) {
        processPyramid();
      }



    })



    // console.log('charts  :', charts)
 //   return charts;
    return charts.sort((a, b) => a.id - b.id);

  } catch (error) {
    // Handle any errors that occur during the asynchronous operation
    console.error(error);
    //return null; // or any default value you prefer
    return []; // or any default value you prefer
  }


}


const getSectionsData = async () => {

  var filters = ['dashboard_id']
  var filterValues = [[dashboard_id.value]]  // make sure the inner array is array



  const formData = {}
  formData.curUser = 1 // Id for logged in user
  formData.model = 'dashboard_section'
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





  console.log('sections>>', tabs.value)
  //activeTab.value = tabs.value[0].name;
  console.log('activeTab', tabs.value[0])


  async function processSectionsData() {
    const promises = res.data.map(async function (arrayItem) {
      let tab = {};
      tab.label = arrayItem.title;
      tab.name = arrayItem.title;
      tab.cards = await getCharts(arrayItem.id);
      return tab;
    });

    tabs.value = await Promise.all(promises);
    console.log('sections', tabs.value);
    activeTab.value = tabs.value[0] ? tabs.value[0].name : ''
    console.log('activeTab', activeTab.value);

    tabs.value.sort((a, b) => a.id - b.id);

  }

  processSectionsData();

  



}


const getTabs = async () => {
  // return Cards
  await getSectionsData()


}


const countyList = ref([])
const subCountyList = ref([])
const filteredSubCountyList = ref([])


const getCountySubcountySep = async () => {
    // initialize every time its called
  const  nested =['subcounty','ward']
  const res = await getListWithoutGeo({
  
    params: {
      //   pageIndex: 1,
      //  limit: 100,
      curUser: 1, // Id for logged in user
      model: 'county',
      assocModel: 'subcounty',
      searchField: 'name',
      nested_models:nested,
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
        label: data.name +' county',
        children:[]
      };
      countyList.value.push(coption)
      
             data.subcounties.forEach((subc) => {
              const soption = {
                value: subc.id,
                label: subc.name +' constituency',
                county_id: data.id,
                children:[]
               };

               subCountyList.value.push(soption);
               filteredSubCountyList.value.push(soption);
        
              subc.wards.forEach((ward) => {
                      const woption = {
                        value: ward.id,
                        label: ward.name,
                        subcounty_id: ward.subcounty_id,
                        county_id: ward.county_id,
                       };
                     
                            soption.children.push(woption)
              })
              coption.children.push(soption)
              })

     });

 
  })

  // console.log('countyOptions', countyList)
  // console.log('filteredSubCountyList', filteredSubCountyList)
}

 



onMounted(() => {


  console.log(activeTab)
  loading.value = false



});



const selectCounty = ref([])
const selectSubCounty = ref([])
const handleClear = async () => { 
  selectSubCounty.value=null
  selectCounty.value = null

  getCards()
  getTabs()
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
  getCards()
  getTabs()
console.log('filterLevel.value', selectedCounties.value)
     
}


const filterSubCounty = async (subcountyId) => {
  //selectSubCounty.value=null
 
selectedSubCounties.value = subcountyId;
 
  console.log('selectedSubCounties',selectedSubCounties.value);  // [1]


  if (selectedSubCounties.value.length == 0) {
  filterLevel.value = 'county'
} else {
  filterLevel.value = 'subcounty'


}  
getCards()
  getTabs()    
}


const formatNumber =   (value) => {
     if (value >= 1000000) {
      return (value / 1000000).toLocaleString('en-US', { maximumFractionDigits: 2 }) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toLocaleString('en-US', { maximumFractionDigits: 2 }) + 'K';
    }
    return value.toLocaleString('en-US');
}

const getChartType =   (typeId) => {
     if (typeId ==1 || typeId ==2 ||typeId == 4) {
      return  'bar'
    } else if (typeId==2) {
      return 'bar';
    }
    else if (typeId==3) {
      return 'donut';
    }
    else if (typeId==5) {
      return 'area';
    }
    else if (typeId==7) {
      return 'map';
    } 
    else if (typeId==8) {
      return 'pyramid';
    } 
}
  
  

</script>

<template>
  <el-select :style="{ width: '25% ', marginRight: '10px' }"   @change="filterCounty"   :onClear="handleClear"  v-model="selectCounty"  multiple clearable filterable collapse-tags placeholder="Select County">
    <el-option v-for="item in countyList" :key="item.value" :label="item.label" :value="item.value" />
  </el-select>

  <el-select :style="{ width: '25% ' }"  @change="filterSubCounty"  :onClear="handleClear"  v-model="selectSubCounty" clearable multiple filterable collapse-tags placeholder="Select Constituency">
    <el-option v-for="item in filteredSubCountyList" :key="item.value" :label="item.label" :value="item.value" />
  </el-select>


  <!-- <el-cascader
:style="{ width: '100% ' }" v-model="selectedAdminId" placeholder="Filter by County/Constituency"
    :options="options" :props="props" @change="handleChange" />
  -->

  <el-row :gutter="20">
    <el-col v-for="(card) in cards" :key="card.id" :span="24 / cards.length" :xs="24" :sm="12" :md="8" :lg="6">
      <div class="tabs-container">
        <ElSkeleton :loading="cardLoading" animated>

          <el-card shadow="always">
            <div class="card-content">
              <div class="icon-container">
                <Icon :icon=card.icon width="60" :color=card.iconColor />
              </div>

              <el-divider direction="vertical" />
              <div class="card-value">
                <p class="value-text">{{ formatNumber(card.value) }}{{ card.symbol }}</p>
                <p class="value-label">{{ card.description }}</p>
              </div>

            </div>
          </el-card>
        </ElSkeleton>

      </div>

    </el-col>
  </el-row>
  <div class="tabs-container">
  <el-tabs v-model="activeTab">
    <el-tab-pane v-for="(tab) in tabs" :name="tab.name" :key="tab.id" :label="tab.label">
      <el-row :gutter="20">
        <el-col
          v-for="(card) in tab.cards"
          :key="card.id"
          
          :span="12"
          :xl="12"
          :lg="12"
          :md="12"
          :sm="24"
          :xs="24"
        >
          <div class="charts-container">
            <el-card>
              <ElSkeleton :loading="loading" animated>
                <!-- <v-chart :id="card.id" class="chart" :option="card.chart" autoresize /> -->
                <v-chart  v-if="card.type==7 ||card.type==8 "  :id="card.id"  class="chart" :option="card.chart" height="350"  autoresize /> 
                  <apexchart v-if="card.type!=7 && card.type!=8" :options="card.chart" :series="card.chart.series" :type="getChartType(card.type)" height="350"  autoresize/>
 
              </ElSkeleton>
            </el-card>
          </div>
        </el-col>
      </el-row>
    </el-tab-pane>
  </el-tabs>
</div>

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
  margin-top: 10px;
}


.charts-container {
  margin-top: 10px;
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
</style>