<script setup lang="ts">
import {
  ElRow, ElCol, ElCard, ElDivider, ElTabs, ElTabPane, ElSkeleton, ElCascader, ElCascaderPanel, 
  ElCascaderPanelContext, ElSelect, ElOption,ElEmpty,ElCollapse,ElCollapseItem, ElIcon
} from 'element-plus'
import { Loading } from '@element-plus/icons-vue'

import { ref,computed, reactive, watch, onMounted } from 'vue'

import { use } from "echarts/core";


import { Icon } from '@iconify/vue';

import {
  pieOptions, simpleBarChart, multipleBarChart, stacklineOptions, mapChartOptions,pyramidOptions,
  lineOptions, stackedbarOptions, barMaleFemaleOptions,stackedbarOptionsAbs
} from './chart-types'
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

import { useAppStore } from '@/store/modules/app'

import { useRouter } from 'vue-router'

const { push } = useRouter()

const appStore = useAppStore()



const isDark = computed(() => appStore.getIsDark)





const colorPalette = ['#ff007f', '#0000ff'];  // Male-Female
 

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
const cardLoading = ref(true)
const chartsLoading = ref(true)
const dashboardLoading = ref(true)
const chartLoadingMessages = ref(new Map()) // Track loading messages for individual charts

// Helper functions for chart loading states
const setChartLoading = (chartId, message = 'Loading chart...') => {
  chartLoadingMessages.value.set(chartId, message)
}

const setChartLoaded = (chartId) => {
  chartLoadingMessages.value.delete(chartId)
}

const isChartLoading = (chartId) => {
  return chartLoadingMessages.value.has(chartId)
}

const getChartLoadingMessage = (chartId) => {
  return chartLoadingMessages.value.get(chartId) || 'Loading chart...'
}

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

const getIndicatorConfigurations = async (indicator_id) => {
  const formData = {}

  formData.curUser = 1 // Id for logged in user
  formData.model = 'indicator_category'
  //-Search field--------------------------------------------
  formData.searchField = ''
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  formData.assocModel = ''

  // - multiple filters -------------------------------------
  formData.filters = ['indicator_id']
  formData.filterValues = [[indicator_id]]
  formData.associated_multiple_models = []
  //-------------------------
  const res = await getSettlementListByCounty(formData)
  console.log('indicator configs >>>>', res)
  let ind_config_arr = []
  res.data.forEach(function (arrayItem) {
    ind_config_arr.push(arrayItem.id)
  })

  return ind_config_arr
}


const getSummaryIfIntervention = async (scards) => {

console.log('scards',scards)

// Now using indicator_category_id directly from the card
let indicator_category_id = scards.indicator_category_id

console.log('Using indicator_category_id directly:', indicator_category_id)

// set admin level filtering
let associated_Models = []
let filterFields = ['indicator_category_id'] 
let filterValues = [indicator_category_id] 
let filterOperators = ['eq']


var filter_value = scards.filter_value
var filter_field = scards.filter_field
var filter_function = scards.filter_function


if (filter_value && filter_field ) { 
  filterFields.push(filter_field)
  filterValues.push(filter_value)
  filterOperators.push(filter_function)
}




if (filterLevel.value === 'county') {
  associated_Models.push('subcounty')
   filterFields.push('county_id')
   filterValues.push(selectedCounties.value)
  filterOperators.push('or')
}

else if (filterLevel.value === 'subcounty') { 
  // filter by subcounty 
  associated_Models.push('ward')
  


  filterFields.push('subcounty_id')
   filterValues.push(selectedSubCounties.value)
  filterOperators.push('or')

}
 


else if (filterLevel.value === 'national') {
  associated_Models.push('county')


}



const formData = {}
formData.model = 'indicator_category_report'
formData.summaryField = 'amount'
formData.summaryFunction = 'sum'
//formData.assoc_models = ['county']
formData.assoc_models = associated_Models
formData.groupFields = []
// formData.filterField =['indicator_category_id']
// formData.filterValue = [ids]    
formData.filterField =filterFields
formData.filterValue =filterValues 
formData.filterOperator = filterOperators
// Add indicator_category_id to request body for automatic filtering
formData.indicator_category_id = indicator_category_id

console.log('Filter FormData : ', formData)

try {
  const response01 = await getSummarybyFieldFromMultipleIncludes(formData);
  console.log("Cards sumamrye", response01.Total[0].sum)
  console.log('indicator_category_id', indicator_category_id)

 // const response = await getSumFilter(sumQuery);
  const amount = response01.Total[0].sum ? parseInt(response01.Total[0].sum) : 0
  //console.log('Cumulative Data', response.data)

  return amount;
} catch (error) {
  // Handle any errors that occur during the asynchronous operation
  console.error(error);
  //return null; // or any default value you prefer
  return 0; // or any default value you prefer
}
};

const getSummary = async (card) => {
  // Check if this is an indicator card or entity card
  if (card.category === 'Indicator') {
    return await getSummaryForIndicator(card)
  } else {
    return await getSummaryForEntity(card)
  }
}

const getSummaryForIndicator = async (card) => {
  console.log('Processing Indicator card:', card)
  
  // Now using indicator_category_id directly from the card
  let indicator_category_id = card.indicator_category_id
  
  console.log('Using indicator_category_id directly:', indicator_category_id)
  
  // set admin level filtering
  let associated_Models = []
  let filterFields = ['indicator_category_id'] 
  let filterValues = [indicator_category_id] 
  let filterOperators = ['eq']
  
  var filter_value = card.filter_value
  var filter_field = card.filter_field
  var filter_function = card.filter_function
  
  if (filter_value && filter_field ) { 
    filterFields.push(filter_field)
    filterValues.push(filter_value)
    filterOperators.push(filter_function)
  }
  
  if (filterLevel.value === 'county') {
    associated_Models.push('subcounty')
    filterFields.push('county_id')
    filterValues.push(selectedCounties.value)
    filterOperators.push('or')
  }
  else if (filterLevel.value === 'subcounty') { 
    // filter by subcounty 
    associated_Models.push('ward')
    filterFields.push('subcounty_id')
    filterValues.push(selectedSubCounties.value)
    filterOperators.push('or')
  }
  else if (filterLevel.value === 'national') {
    associated_Models.push('county')
  }
  
  const formData = {}
  formData.model = 'indicator_category_report'
  formData.summaryField = 'amount'
  formData.summaryFunction = 'sum'
  formData.assoc_models = associated_Models
  formData.groupFields = []
  formData.filterField = filterFields
  formData.filterValue = filterValues 
  formData.filterOperator = filterOperators
  // Add indicator_category_id to request body for automatic filtering
  formData.indicator_category_id = indicator_category_id
  
  console.log('Indicator Filter FormData : ', formData)
  
  try {
    const response01 = await getSummarybyFieldFromMultipleIncludes(formData);
    console.log("Indicator Cards summary", response01.Total[0].sum)
    const amount = response01.Total[0].sum ? parseInt(response01.Total[0].sum) : 0
    return amount;
  } catch (error) {
    console.error(error);
    return 0;
  }
}

const getSummaryForEntity = async (card) => {
  console.log('Processing Entity card:', card)
  
  var selectModel = card.card_model
  var cmodelField = card.card_model_field
  var aggregMethod = card.aggregation
  var filter_value = card.filter_value
  var filter_field = card.filter_field
  var computation = card.computation
  var filter_function = card.filter_function
  var unique = card.unique?card.unique:false 
  var filters = card.filters

  console.log('unique',unique)
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
    filterFields.push('county_id')
    filterValues.push(selectedCounties.value)
    filterOperators.push('or')
  }
  else if (filterLevel.value === 'subcounty') { 
    // filter by subcounty 
    associated_Models.push('ward')
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
  formData.summaryFunction = aggregMethod
  formData.assoc_models = associated_Models
  formData.groupFields = []
  formData.filterField = filterFields
  formData.filterValue = filterValues
  formData.calculationType = computation
  formData.filter_function = filter_function
  formData.filterOperator = filterOperators
  formData.uniqueCounts = unique

  console.log('Entity form-c-Data',formData)

  try {
    const response01 = await getSummarybyFieldFromMultipleIncludes(formData);
    console.log("Entity Cards summary", response01)
    const amount = response01.Total[0][aggregMethod] ? parseInt(response01.Total[0][aggregMethod]) : 0
    return amount;
  } catch (error) {
    console.error(error);
    return 0;
  }
}


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
    else if (chartType == 3||chartType ==10) { //3 pie bar chart
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

    if(chartType!=3 &&chartType!=10 ) { 
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


    if(chartType!=3&&chartType!=10) { 
      groupFields.push('ward.name')
    }
  }




  else if (filterLevel.value === 'national' ) {
    associated_Models.push('county')


     if(chartType!=3&&chartType!=10) { 
      groupFields.push('county.name')
    }

  }

  if(chartType==3 ||chartType==10 ) { 
      groupFields.push(cmodel + '.' + cfield )
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

    else if (chartType == 3 || chartType ==10) {
      console.log('thisChart--- ', thisChart)
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

function convertStringsToNumbers(stringArray) {
        return stringArray.map(Number);
      }


const getSummaryChart = async (thisChart) => {
  // Check if this is an indicator chart or entity chart
  if (thisChart.category === 'Indicator') {
    return await getSummaryChartForIndicator(thisChart)
  } else {
    return await getSummaryChartForEntity(thisChart)
  }
}

const getSummaryChartForIndicator = async (thisChart) => {
  console.log('Processing Indicator chart:', thisChart)
  
  // For charts, we still use indicator_id to get indicator category IDs
  let indicator = thisChart.indicator_id
  var indicator_categories = await getIndicatorConfigurations(indicator)
  
  return await getSummaryChartIIntervention(indicator_categories, thisChart)
}

const getSummaryChartForEntity = async (thisChart) => {
  console.log('Processing Entity chart:', thisChart)
  
  // Use the existing xgetSummaryMultipleParentsGrouped function for entities
  return await xgetSummaryMultipleParentsGrouped(thisChart)
}

const getSummaryChartIIntervention = async (indicator_categories,thisChart) => {
  
  //var cdata = await xgetSummaryMultipleParentsGrouped(thisChart.card_model, thisChart.card_model_field, thisChart.aggregation, thisChart.type, thisChart.categorized); // first array is the categories // second is the data

  let associated_Models = []
  let filterFields = ['indicator_category_id'] 
  let filterValues = [indicator_categories]
  let groupFields = []
  let filterOperators = ['eq']
  let cmodel= 'indicator_category_report'
  var filters = thisChart.filters

  var cfield = 'amount'
  var cAggregation = 'sum'
  var chartType = thisChart.type
  var categorizedField =thisChart.categorized
  var unique = thisChart.unique?thisChart.unique:false 
  var ignoreEmpty = thisChart.ignore_empty?thisChart.ignore_empty:false

  console.log('unique',unique)


  console.log('Chart Filters',thisChart )
  // thisChart.card_model,thisChart.card_model_field,thisChart.aggregation,  thisChart.type);

  // set admin level filtering


  var filter_value = thisChart.filter_value
  var filter_field = thisChart.filter_field
  var filter_function = thisChart.filter_function

  // if (filter_value && filter_field ) { 
  //   filterFields.push(filter_field)
  //   filterValues.push(filter_value)
  //   filterOperators.push(filter_function)
  // }
  

 


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
    groupFields.push(cmodel + '.date')

  }
 

  
  if (filterLevel.value === 'county') {
    associated_Models.push('subcounty')

    filterFields.push('county_id')
     filterValues.push(selectedCounties.value)
    filterOperators.push('or')

 
    if(chartType!=3&&chartType!=10) {
      // dont add groups for a piechart
      groupFields.push('subcounty.name')
    }

  }


  else if (filterLevel.value === 'subcounty') { 
    // filter by subcounty 
    associated_Models.push('ward')
    filterValues.push(selectedSubCounties.value)
    filterOperators.push('or')
    filterFields.push('subcounty_id')
 
  
    if(chartType!=3&&chartType!=10) {
      // dont add groups for a piechart
      groupFields.push('ward.name')
    }
  }




  else if (filterLevel.value === 'national') {
    associated_Models.push('county')

    
    if(chartType!=3&&chartType!=10) {
      // dont add groups for a piechart
      groupFields.push('county.name')
    }



  }


  
  if(chartType==3||chartType==10) {
      // dont add groups for a piechart
      groupFields.push(cmodel + '.' + cfield )
    }


  console.log('groupFields-interve', groupFields)
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
formData.filterOperator = filterOperators // Bitumen
formData.filterValue = filterValues

// Add indicator_category_id to request body for automatic filtering
formData.indicator_category_id = indicator_categories

// added for unique couts 
formData.uniqueCounts = unique
formData.ignoreEmpty = ignoreEmpty

  console.log('form-Data',formData)

  try {
    const response = await getSummarybyFieldFromMultipleIncludes(formData);
    const amount = response.Total;
    console.log('Data xcounty -inter', amount)


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

    else if (chartType == 3 || chartType ==10) {
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

       let result
    if (arrayItem.category=='Intervention') {
      result = getSummaryIfIntervention(arrayItem)
      console.log('Intervention Card........')

    } else {
      result = getSummary(arrayItem)

    }
 
    // result.then((crd) => {
    //   console.log('resultx',crd); // "Promise resolved!"
    //   let card = arrayItem
    //   card.value = crd
    //   card.symbol=cardSymbol
    //   cards.value.push(card)
    // });

    result.then((crd) => {
      console.log('resultx',crd); // "Promise resolved!"
      let card = arrayItem

      card.value = crd
      card.symbol=cardSymbol

      console.log('resultx2',card)


      cards.value.push(card)
      cards.value.sort((a, b) => a.id - b.id);

      console.log('Sorted',  cards.value)


    });


  })



  // cards.value.sort((a, b) => a.id - b.id);
  // console.log('Sorted',   cards.value)
}

const getCards = async () => {
  try {
    cardLoading.value = true
    await getCardData()
    // Wait a bit for all card promises to resolve
    await new Promise(resolve => setTimeout(resolve, 500))
  } catch (error) {
    console.error('Error loading cards:', error)
  } finally {
    cardLoading.value = false
  }
}




///// ----------------Process sections and charts---------------------------------------
////-----------------------------------------------------------------------------------


const getCharts = async (section_id) => {
  try {
    chartsLoading.value = true
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
    formData.nested_models = ['indicator', 'activity']

    //-------------------------
    const charts = reactive([]);
    const response = await getSettlementListByCounty(formData);
    //  const charts = response.data;
    console.log('Getting the charts ', response.data)


    response.data.forEach(async (thisChart) => {
      console.log('This Chart:', thisChart)
      // Set initial loading state for this chart
      setChartLoading(thisChart.id, 'Preparing chart...')



       
 

 async function processPieChart() {
  const promises = [async function () {
    console.log('processPieChart:', thisChart.card_model, thisChart.card_model_field, thisChart.aggregation);
    
    // Set loading state for this chart
    setChartLoading(thisChart.id, 'Loading pie chart data...');

    try {
      const cdata = await xgetSummaryMultipleParentsGrouped(thisChart);
      console.log('piechart - cdata', thisChart);

      const isDonut = thisChart.type == '10'; // Custom flag you can define
       console.log('isDonut',isDonut)

        const UpdatedPieOptionsMultiple = {
          ...pieOptions,
          chart: {
            ...pieOptions.chart,
            //type: 'pie'
          },
          title: {
            ...pieOptions.title,
            text: thisChart.title
          },
          labels: cdata[0],
          series: cdata[1],
          plotOptions: {
            pie: {
              donut: {
                ...(isDonut ? { size: '50%' } : {size: '0%'})  // Only include size if donut
              }
            }
          }
        };


      console.log('UpdatedPieOptionsMultiple', UpdatedPieOptionsMultiple);
      console.log('cdata', cdata[1][0]?.data);

      thisChart.chart = UpdatedPieOptionsMultiple;

      // Show "No data" message if data is empty
      if (!cdata[1] || cdata[1].length === 0) {
        thisChart.chart.graphic = [{
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: 'No data available',
            fill: '#999',
            fontSize: 16
          },
          z: 100
        }];
      }
    } catch (error) {
      console.error('Error in processPieChart:', error);
    }
  }];

  await promises[0]();
  console.log('Loop completed');

  charts.push(thisChart);
  setChartLoaded(thisChart.id); // Mark chart as loaded
}


      // function to process processMultiBarChart charts 
      async function processSimpleBarChart() {
        const promises = [async function () {
          console.log('This chart details:', thisChart.card_model, thisChart.card_model_field, thisChart.aggregation);
          
          // Set loading state for this chart
          setChartLoading(thisChart.id, 'Loading bar chart data...');

          try {

            var cdata = await xgetSummaryMultipleParentsGrouped(thisChart ); // first array is the categories // second is the data
            console.log('cdata[0]',cdata[0]);

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
        setChartLoaded(thisChart.id); // Mark chart as loaded
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
        setChartLoaded(thisChart.id); // Mark chart as loaded
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
        setChartLoaded(thisChart.id); // Mark chart as loaded
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
        setChartLoaded(thisChart.id); // Mark chart as loaded
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
        setChartLoaded(thisChart.id); // Mark chart as loaded
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
        setChartLoaded(thisChart.id); // Mark chart as loaded
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
            await getCountyGeo()
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
        setChartLoaded(thisChart.id); // Mark chart as loaded
        // Continue with the rest of your code here
      }
      // function to process processMultiBarChart charts 
      async function processPyramid() {
        const promises = [async function () {

          try {

            const formData = {}
            formData.model = 'households'
            formData.summaryFunction = 'sum'

            let males = ['age_group_0_5m',  'age_group_6_17m',  'age_group_18_35m',  'age_group_36_64m','age_group_65m'  ]
            let females = ['age_group_0_5f',  'age_group_6_17f',  'age_group_18_35f',  'age_group_36_64f','age_group_65f'  ]

      
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
                  fArray.value.push(females)


                  console.log('pyramid---f-->', femaleKeys, females)



                  const UpdatedpyramidOptions = {
                        // copy everything from the original
                        ...pyramidOptions,

                        // 1) Override the series array with your computed data
                        series: [
                          {
                            ...pyramidOptions.series[0], // "Males" template
                            data: males                  // your new males array
                          },
                          {
                            ...pyramidOptions.series[1], // "Females" template
                            data: females                // your new females array
                          }
                        ],

                        // 2) Deep‐spread chartOptions so we can replace title.text
                        chartOptions: {
                          ...pyramidOptions.chartOptions,
                          title: {
                            ...pyramidOptions.chartOptions.title,
                            text: thisChart.title      // replace "Mauritius population pyramid 2011"
                          }
                        }
                      };



                 thisChart.chart = UpdatedpyramidOptions
                // thisChart.chart = UpdatedBarOptionsMultiple;


                }


              });

 
 




          } catch (error) {
            // Handle any errors that occurred during the process
          }
        }];

        //     await Promise.all(promises);
        await promises[0]();

        // The loop has completed and all promises have been resolved/rejected
        console.log('Loop completed pyramd',thisChart);





        charts.push(thisChart)
        setChartLoaded(thisChart.id); // Mark chart as loaded
        // Continue with the rest of your code here
      }
 

      

      // Now same funtions but now for intervnetions 
      //---------
 
 


      async function processPieChart2() {
        const promises = thisChart.indicators.map(async function (indicator) {
          console.log('This processPieChart:', indicator)

          try {
            // Use the unified chart function that handles both indicator and entity charts
            var cdata = await getSummaryChart(thisChart)   // first array is the categories // second is the data
            console.log('PIEx', cdata[1])

            const UpdatedPieOptionsMultiple = {
              ...pieOptions,
              title: {
                ...pieOptions.title,
                text: thisChart.title
              },

              series: {
                ...pieOptions.series[0],
                data: cdata[1]    // data 
              },


            };

            console.log('PIExs', UpdatedPieOptionsMultiple)

            thisChart.chart = UpdatedPieOptionsMultiple

           
            
              
            // show no data 
            if (cdata[1].length===0) {
              thisChart.chart.graphic= [{
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
        });

        await Promise.all(promises);
        // The loop has completed and all promises have been resolved/rejected
        console.log('Loop completed');





        charts.push(thisChart)
        setChartLoaded(thisChart.id); // Mark chart as loaded
        // Continue with the rest of your code here
      }


 
           // function to process processMultiBarChart charts 
      async function processSimpleBarChart2() {
        const promises = thisChart.indicators.map(async function (indicator) {
          console.log('processSimpleBarChart2:', indicator)

          try {
            //  console.log("bar", getIndicatorConfigurations(indicator.id)) 
            //  get the indicator configruation IDS for the indicators in this chart. These could be 1 or more 
            var ids = await getIndicatorConfigurations(indicator.id)
            console.log("bar", ids)
            var cdata = await getSummaryChartIIntervention(ids, thisChart)   // first array is the categories // second is the data
            console.log('x-cdata',cdata)
            console.log('x-cdata[0]',cdata[0])

           

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


            thisChart.chart = UpdatedBarOptionsMultiple

            thisChart.chart.series = cdata[1]
 
            console.log('thisChart',thisChart)
            
            // show no data 
            if (cdata[1].length===0) {
              thisChart.chart.graphic= [{
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
        });

        await Promise.all(promises);
        // The loop has completed and all promises have been resolved/rejected
        console.log('Loop completed');





        charts.push(thisChart)
        setChartLoaded(thisChart.id); // Mark chart as loaded
        // Continue with the rest of your code here
      }
      // function to process processMultiBarChart charts 
      async function processMultiBarChart2() {
        const promises = thisChart.indicators.map(async function (indicator) {
          console.log('This category:', indicator)

          try {
            //  console.log("bar", getIndicatorConfigurations(indicator.id)) 
            //  get the indicator configruation IDS for the indicators in this chart. These could be 1 or more 
            var ids = await getIndicatorConfigurations(indicator.id)
            console.log("bar", ids)
            var cdata = await getSummaryChartIIntervention(ids, thisChart)   // first array is the categories // second is the data
            console.log(cdata)

            const UpdatedBarOptionsMultiple = {
              ...multipleBarChart,
              title: {
                ...multipleBarChart.title,
                text: thisChart.title
              },
              xAxis: {
                ...multipleBarChart.xAxis,
                categories: cdata[0]  // categories as recieved 
              },

            };


            thisChart.chart = UpdatedBarOptionsMultiple

            thisChart.chart.series = cdata[1]

            // show no data 
            if (cdata[0].length===0) {
              thisChart.chart.graphic= [{
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
        });

        await Promise.all(promises);
        // The loop has completed and all promises have been resolved/rejected
        console.log('Loop completed');





        charts.push(thisChart)
        setChartLoaded(thisChart.id); // Mark chart as loaded
        // Continue with the rest of your code here
      }
      // function to process processMultiBarChart charts 
      async function processStackedBarChart2() {
        const promises = thisChart.indicators.map(async function (indicator) {
          console.log('This processStackedBarChart:', indicator)

          try {
            //  console.log("bar", getIndicatorConfigurations(indicator.id)) 
            //  get the indicator configruation IDS for the indicators in this chart. These could be 1 or more 
            var ids = await getIndicatorConfigurations(indicator.id)
            console.log("bar", ids)
            var cdata = await getSummaryChartIIntervention(ids, thisChart)   // first array is the categories // second is the data
            console.log(cdata)

            const UpdatedBarOptionsMultiple = {
              ...barMaleFemaleOptions,
              title: {
                ...barMaleFemaleOptions.title,
                text: thisChart.title
              },
              xAxis: {
                ...barMaleFemaleOptions.xAxis,
                data: cdata[0]  // categories as recieved 
              },

            };

            console.log(UpdatedBarOptionsMultiple)


            thisChart.chart = UpdatedBarOptionsMultiple

            thisChart.chart.series = cdata[1]


            
            // show no data 
            if (cdata[0].length===0) {
              thisChart.chart.graphic= [{
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
        });

        await Promise.all(promises);
        // The loop has completed and all promises have been resolved/rejected
        console.log('Loop completed');





        charts.push(thisChart)
        setChartLoaded(thisChart.id); // Mark chart as loaded
        // Continue with the rest of your code here
      }

      // function to process processMultiBarChart charts 
      async function processLineChart2() {
        const promises = thisChart.indicators.map(async function (indicator) {
          console.log('This processLineChart:', indicator)

          try {
            //  console.log("bar", getIndicatorConfigurations(indicator.id)) 
            //  get the indicator configruation IDS for the indicators in this chart. These could be 1 or more 
            var ids = await getIndicatorConfigurations(indicator.id)
            console.log("line-IDS", ids)
            var cdata = await getSummaryChartIIntervention(ids, thisChart)   // first array is the categories // second is the data
            console.log('lichecrt data', cdata)

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
                data: cdata[1]  // categories as recieved 
              },
            };


            thisChart.chart = UpdatedBarOptionsMultiple
            
            // show no data 
            if (cdata[1].length===0) {
              thisChart.chart.graphic= [{
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
        });

        await Promise.all(promises);
        // The loop has completed and all promises have been resolved/rejected
        console.log('Loop completed');





        charts.push(thisChart)
        setChartLoaded(thisChart.id); // Mark chart as loaded
        // Continue with the rest of your code here
      }
      // function to process processMultiBarChart charts 
      async function processStackLineChart2() {
        const promises = thisChart.indicators.map(async function (indicator) {
          console.log('This processLineChart:', indicator)

          try {
            //  console.log("bar", getIndicatorConfigurations(indicator.id)) 
            //  get the indicator configruation IDS for the indicators in this chart. These could be 1 or more 
            var ids = await getIndicatorConfigurations(indicator.id)
            console.log("line-IDS", ids)
            var cdata = await getSummaryMultipleParentsGrouped(ids, thisChart)   // first array is the categories // second is the data
            console.log('lichecrt data', cdata)


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
            UpdatedBarOptionsMultiple.series=cdata[1]


            console.log("old chart",stacklineOptions)
            console.log("New chart",UpdatedBarOptionsMultiple)

            thisChart.chart = UpdatedBarOptionsMultiple
            
            // show no data 
            if (cdata[1].length===0) {
              thisChart.chart.graphic= [{
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
        });

        await Promise.all(promises);
        // The loop has completed and all promises have been resolved/rejected
        console.log('Loop completed');





        charts.push(thisChart)
        setChartLoaded(thisChart.id); // Mark chart as loaded
        // Continue with the rest of your code here
      }

   // function to process processMultiBarChart charts 
   async function processMapChart2() {
        const promises = thisChart.indicators.map(async function (indicator) {
          console.log('This processLineChart:', indicator)

          try {
            //  console.log("bar", getIndicatorConfigurations(indicator.id)) 
            //  get the indicator configruation IDS for the indicators in this chart. These could be 1 or more 
            var ids = await getIndicatorConfigurations(indicator.id)
            console.log("line-IDS", ids)
            var cdata = await getSummaryChartIIntervention(ids, thisChart)   // first array is the categories // second is the data
            console.log('map data', cdata)
            var MaxMin = cdata[0]
            await getCountyGeo()
            //await getSubsetGeo(model,filterFields, filterValues)
            if (selectedCounties.value.length > 0 && filterLevel.value === 'county') {
              await getSubsetGeo('subcounty', ['county_id'], selectedCounties.value)


              
            }
            if (selectedSubCounties.value.length > 0 && filterLevel.value === 'subcounty') {
              await getSubsetGeo('ward', ['subcounty_id'], selectedSubCounties.value)

            }



            console.log('apsect',aspect.value)


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
            if (cdata[1].length===0) {
              thisChart.chart.graphic= [{
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
        });

        await Promise.all(promises);
        // The loop has completed and all promises have been resolved/rejected
        console.log('Loop completed');





        charts.push(thisChart)
        setChartLoaded(thisChart.id); // Mark chart as loaded
        // Continue with the rest of your code here
      }


   

      // Run the approriate funtion 
      if (thisChart.type == 1 && thisChart.category=="Status"  ) {
        console.log('processSimpleBarChart')
        await processSimpleBarChart()
      }

      else if (thisChart.type == 2 && thisChart.category=="Status") {
        await processMultiBarChart();
      }

      else if ((thisChart.type == 3 || thisChart.type == 10) && thisChart.category=="Status") {
        await processPieChart();
      }

      else if (thisChart.type == 4 && thisChart.category=="Status") {
        await processStackedBarChart();
      }


      else if (thisChart.type == 9 && thisChart.category=="Status") {
        await processStackedBarChartAbs();
      }





      else if (thisChart.type == 5 && thisChart.category=="Status") {
        await processLineChart();
      }

      else if (thisChart.type == 6 && thisChart.category=="Status") {
        await processStackLineChart();
      }

      else if (thisChart.type == 7 && thisChart.category=="Status") {
        await processMapChart();
      }

      else if (thisChart.type == 8 && thisChart.category=="Status") {
        await processPyramid();
      }


      // For Interventions

      if (thisChart.type == 1 && thisChart.category=="Intervention"  ) {
        console.log('processSimpleBarChart')
        await processSimpleBarChart2()
      }

      else if (thisChart.type == 2 && thisChart.category=="Intervention") {
        await processMultiBarChart2();
      }

      else if ((thisChart.type == 3 || thisChart.type == 10 )&& thisChart.category=="Intervention") {
        await processPieChart2();
      }

      else if (thisChart.type == 4 && thisChart.category=="Intervention") {
        await processStackedBarChart2();
      }

      else if (thisChart.type == 5 && thisChart.category=="Intervention") {
        await processLineChart2();
      }

      else if (thisChart.type == 6 && thisChart.category=="Intervention") {
        await processStackLineChart2();
      }

      else if (thisChart.type == 7 && thisChart.category=="Intervention") {
        await processMapChart2();
      }

      else if (thisChart.type == 8 && thisChart.category=="Intervention") {
        await processPyramid();
      }

    })


    // console.log('charts  :', charts)
    //return charts;
    return charts.sort((a, b) => a.id - b.id);
  } catch (error) {
    // Handle any errors that occur during the asynchronous operation
    console.error(error);
    //return null; // or any default value you prefer
    return []; // or any default value you prefer
  }


}


const getSectionsData = async () => {
  try {
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
        tab.charts = await getCharts(arrayItem.id);
        return tab;
      });

      tabs.value = await Promise.all(promises);
      console.log('sections', tabs.value);
      activeTab.value = tabs.value[0] ? tabs.value[0].name : ''
      console.log('activeTab', activeTab.value);
      tabs.value.sort((a, b) => a.id - b.id);

    }

    await processSectionsData();

  } catch (error) {
    console.error('Error loading sections data:', error);
  } finally {
    chartsLoading.value = false;
  }
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
  const  nested =['subcounty','ward','settlement']
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
                        children:[]
                      };
                       ward.settlements.forEach((settlement) => {
                            const sett_option = {
                              value: settlement.id,
                              label: settlement.name+' settlement',
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


const getCountySubcounty = async () => {
  const res = await getListWithoutGeo({
    params: {
      //   pageIndex: 1,
      //  limit: 100,
      curUser: 1, // Id for logged in user
      model: 'county',
      assocModel: 'subcounty',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    const ret = response.data


    const coptions = [];
    ret.forEach((data) => {
      const option = {
        value: data.id,
        label: data.name,
        children: data.subcounties.map((subcounty) => ({
          value: subcounty.id,
          label: subcounty.name
        }))
      };
      coptions.push(option);
    });

    // Sort the options array by value
    coptions.sort((a, b) => a.value - b.value);

    // Sort the children array within each option
    coptions.forEach((option) => {
      option.children.sort((a, b) => a.value - b.value);
    });
    console.log('select county/subcounty', coptions)

    options.value = coptions
  })
}


////-----------------------------------------------------------------------------------


// Initialize dashboard with proper loading states
const initializeDashboard = async () => {
  try {
    dashboardLoading.value = true
    loading.value = true
    
    // Load data in parallel where possible
    await Promise.all([
      getCountySubcountySep(),
      getCards(),
      getTabs()
    ])
    
    console.log('Dashboard initialized')
  } catch (error) {
    console.error('Error initializing dashboard:', error)
  } finally {
    dashboardLoading.value = false
    loading.value = false
  }
}

initializeDashboard()

onMounted(() => {
  console.log(activeTab)
});



const selectCounty = ref([])
const selectSubCounty = ref([])
const handleClear = async () => { 
  selectSubCounty.value=null
  selectCounty.value = null

  cardLoading.value = true
  chartsLoading.value = true
  await Promise.all([
    getCards(),
    getTabs()
  ])
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
  cardLoading.value = true
  chartsLoading.value = true
  await Promise.all([
    getCards(),
    getTabs()
  ])
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
  cardLoading.value = true
  chartsLoading.value = true
  await Promise.all([
    getCards(),
    getTabs()
  ])
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
      return 'pie';
    }

      else if ( typeId==10) {
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
    else if (typeId==12) {
      return 'treemap';
    }
}

const handleCardClick = async (card) => {
  // Route based on card.card_model
  switch (card.card_model) {
    case 'settlement':
      push({ name: 'List' });
      break;
    case 'grievance':
      push({ name: 'OpenGrievances' });
      break;
    // case 'households':
    //   push({ name: 'AllHouseholds' });
    //   break;
    case 'indicator_category_report':
      push({ name: 'PastReports' });
      break;
    case 'article':
      push({ name: 'Articles' });
      break;
    case 'community':
      push({ name: 'Committees' });
      break;
    case 'education_facility':
      push({ name: 'Education' });
      break;
    case 'health_facility':
      push({ name: 'Health' });
      break;
    case 'media':
      push({ name: 'Media' });
      break;
    case 'parcel':
      push({ name: 'Parcel' });
      break;
    case 'piped_water':
      push({ name: 'PipedWater' });
      break;
    case 'document':
      push({ name: 'RepositoryTagged' });
      break;
    case 'sewer':
      push({ name: 'Sewer' });
      break;
    case 'survey':
      push({ name: 'Surveys' });
      break;
    case 'water_point':
      push({ name: 'WaterPoint' });
      break;
    case 'beneficiary':
      push({ name: 'InterventionBeneficiary' });
      break;
    case 'project':
      push({ name: 'ProjectMap' });
      break;
    case 'road':
      push({ name: 'Road' });
      break;
    case 'indicator':
      push({ name: 'Indicators' });
      break;
    case 'users':
      push({ name: 'staff' });
      break;
    default:
      
      break;
  }
};

const activeCollapse = ref([])

</script>

<template>
  <div class="dashboard-container" v-loading="dashboardLoading" element-loading-text="Loading dashboard..." element-loading-spinner="el-icon-loading" element-loading-background="rgba(0, 0, 0, 0.8)">
    <el-collapse v-model="activeCollapse">
      <el-collapse-item name="filters">
        <template #title>
          <div class="filter-header">
            <Icon icon="mdi:filter-variant" width="20" class="filter-icon" />
            <span>Filters</span>
          </div>
        </template>
        <div class="filters-wrapper">
          <div class="filters-container">
            <div class="filter-group">
              <label class="filter-label">County</label>
              <el-select 
                class="filter-select"
                @change="filterCounty" 
                @clear="handleClear" 
                v-model="selectCounty" 
                multiple 
                clearable 
                filterable 
                collapse-tags 
                placeholder="Select County">
                <el-option 
                  v-for="item in countyList" 
                  :key="item.value" 
                  :label="item.label" 
                  :value="item.value" />
              </el-select>
            </div>

            <div class="filter-group">
              <label class="filter-label">Constituency</label>
              <el-select 
                class="filter-select"
                @change="filterSubCounty" 
                @clear="handleClear" 
                v-model="selectSubCounty" 
                clearable 
                multiple 
                filterable 
                collapse-tags 
                placeholder="Select Constituency">
                <el-option 
                  v-for="item in filteredSubCountyList" 
                  :key="item.value" 
                  :label="item.label" 
                  :value="item.value" />
              </el-select>
            </div>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>

    <el-row :gutter="16" class="cards-row">
      <el-col v-if="cards.length === 0 && !cardLoading" :span="24">
        <el-empty description="No cards available" />
      </el-col>
      <el-col v-for="(card) in cards" :key="card.id" :span="24 / cards.length" :xs="24" :sm="12" :md="8" :lg="6">
        <div class="tabs-container">
          <ElSkeleton :loading="cardLoading || !card.value" animated>
            <el-card shadow="hover" class="stat-card" :body-style="{ padding: '0' }">
              <div class="card-content">
                <div class="icon-container" :style="{ backgroundColor: card.iconColor + '15' }">
                  <Icon :icon="card.icon" width="32" :color="card.iconColor" />
                </div>
                <div class="card-value">
                  <p class="value-text" @click="handleCardClick(card)" role="link" tabindex="0" @keydown.enter="handleCardClick(card)" :title="formatNumber(card.value) + card.symbol">
                    {{ formatNumber(card.value) }}{{ card.symbol }}
                  </p>
                  <p class="value-label" :title="card.description">{{ card.description }}</p>
                </div>
              </div>
            </el-card>
          </ElSkeleton>
        </div>
      </el-col>
    </el-row>

  <div class="tabs-container">
    <el-tabs v-model="activeTab"  class="dashboard-tabs">
      <el-tab-pane v-for="(tab) in tabs" :name="tab.name" :key="tab.id" :label="tab.label">
        <div class="tab-content-scrollable">
          <el-row :gutter="20">
            <el-col v-if="(!tab.charts || tab.charts.length === 0) && !chartsLoading" :span="24">
              <el-empty description="No charts available for this section" />
            </el-col>
            <template v-if="tab.charts && tab.charts.length > 0">
              <el-col
                v-for="(chart) in tab.charts"
                :key="chart.id"
                :span="12"
                :xl="12"
                :lg="12"
                :md="12"
                :sm="24"
                :xs="24"
              >
                <div class="charts-container">
                  <el-card class="chart-card">
                    <ElSkeleton :loading="chartsLoading || isChartLoading(chart.id)" animated>
                      <template #template>
                        <div class="chart-loading-container">
                          <div class="chart-loading-spinner">
                            <el-icon class="is-loading"><Loading /></el-icon>
                          </div>
                          <div class="chart-loading-text">{{ getChartLoadingMessage(chart.id) }}</div>
                        </div>
                      </template>
                      <template v-if="chart.chart">
                        <v-chart v-if="chart.type==7" :id="chart.id" class="chart" :option="chart.chart" height="400" autoresize /> 
                        <apexchart v-if="chart.type!=7 && chart.type!=8" :options="chart.chart" :series="chart.chart.series" :type="getChartType(chart.type)" height="350" autoresize/>
                        <apexchart v-if="chart.type==8" type="bar" :options="chart.chart.chartOptions" :series="chart.chart.series" height="350" autoresize />
                      </template>
                      <template v-else>
                        <div class="empty-state-content">
                          <el-empty description="No data available for this chart" />
                        </div>
                      </template>
                    </ElSkeleton>
                  </el-card>
                </div>
              </el-col>
            </template>
            <el-col v-else-if="chartsLoading" :span="24">
              <div class="charts-container">
                <el-card class="chart-card">
                  <ElSkeleton :loading="true" animated>
                    <template #template>
                      <div class="chart-loading-container">
                        <div class="chart-loading-spinner">
                          <el-icon class="is-loading"><Loading /></el-icon>
                        </div>
                        <div class="chart-loading-text">Loading charts...</div>
                      </div>
                    </template>
                  </ElSkeleton>
                </el-card>
              </div>
            </el-col>
            <el-col v-else :span="24">
              <div class="charts-container">
                <el-card class="chart-card empty-state">
                  <div class="empty-state-content">
                    <el-empty description="No charts configured yet for this tab" />
                  </div>
                </el-card>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
 

 
    
</div>
</template>
 
 
<style scoped>
.dashboard-container {
  padding: px;
  min-height: 100vh;
  position: relative;
}

:deep(.el-collapse) {
  border: none;
  margin-bottom: 6px;
  position: relative;
  z-index: 10;
}

:deep(.el-collapse-item__header) {
  border-radius: 2px;
  padding: 0 16px;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  height: 48px;
  line-height: 48px;
}

:deep(.el-collapse-item__wrap) {
  border: none;
  position: absolute;
  width: 100%;
  z-index: 100;
   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

:deep(.el-collapse-item__content) {
  padding: 0;
  margin-top: 6px;
}

.cards-row {
  margin-top: 1rem;
  position: relative;
  z-index: 1;
}

.filters-wrapper {
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  background: var(--el-bg-color);
}

.filters-container {
  display: flex;
  gap: 20px;
  align-items: flex-end;
}

.filter-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 4px;
}

.filter-select {
  width: 100% !important;
}

:deep(.el-select) {
  width: 100%;
}

:deep(.el-select__tags) {
  margin: 4px 0;
}

@media (max-width: 768px) {
  .filters-wrapper {
    padding: 16px;
  }

  .filters-container {
    flex-direction: column;
    gap: 16px;
  }

  .filter-group {
    width: 100%;
  }
}

.tabs-container {
  margin-bottom: 1px;
  margin-top: 1px;
}

.main-tabs {
   border-radius: 8px;
  padding: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.dashboard-tabs :deep(.el-tabs__header) {
  margin-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.dashboard-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: #e4e7ed;
}

.dashboard-tabs :deep(.el-tabs__item) {
  font-size: 14px;
  padding: 0 20px;
  height: 40px;
  line-height: 40px;
  transition: all 0.3s ease;
}

.dashboard-tabs :deep(.el-tabs__item.is-active) {
  color: #409eff;
  font-weight: 600;
}

.dashboard-tabs :deep(.el-tabs__active-bar) {
  background-color: #409eff;
  height: 3px;
  border-radius: 3px;
}

.stat-card {
  border-radius: 12px;
   transition: all 0.3s ease;
  height: 100%;
  border: none;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-content {
  display: flex;
  align-items: center;
  padding: 20px;
  gap: 16px;
}

.icon-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.card-value {
  flex: 1;
  text-align: left;
}

.value-text {
  font-size: 28px;
  font-weight: 700;
  color: #d61515;
  margin: 0;
  cursor: pointer;
  transition: color 0.2s ease;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.value-text:hover {
  color: #409eff;
}

.value-label {
  font-size: 14px;
  color: #606266;
  margin: 8px 0 0 0;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.charts-container {
  padding: 8px;
}

.chart {
  width: 100%;
  height: 100%;
}

.chart-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.chart-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.tab-content-scrollable {
  max-height: calc(100vh - 300px);
  overflow-y: auto;
  padding: 10px;
}

.tab-content-scrollable::-webkit-scrollbar {
  width: 8px;
}

.tab-content-scrollable::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.tab-content-scrollable::-webkit-scrollbar-thumb {
  border-radius: 4px;
}

.tab-content-scrollable::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.filter-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-icon {
  color: #606266;
}

.chart-loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  gap: 16px;
}

.chart-loading-spinner {
  font-size: 24px;
  color: var(--el-color-primary);
}

.chart-loading-text {
  font-size: 14px;
  color: var(--el-text-color-regular);
  text-align: center;
}


/* When the OS/browser is in Dark mode, switch to this: */
@media (prefers-color-scheme: dark) {
  .value-text {
    color: #ffffff;
  }
  
  .filters-wrapper {
    background: var(--el-bg-color-overlay);
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.2);
  }
  
  :deep(.el-collapse-item__header) {
    background: var(--el-bg-color-overlay);
    color: var(--el-text-color-primary);
  }
  
  :deep(.el-collapse-item__wrap) {
    background: var(--el-bg-color-overlay);
  }
  
  .filter-label {
    color: var(--el-text-color-regular);
  }
}


 
</style>

