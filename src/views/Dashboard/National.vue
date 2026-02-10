<script setup lang="ts">
import {
  ElRow, ElCol, ElCard, ElEmpty, ElTabs, ElTabPane, ElSkeleton, ElCascader, ElCascaderPanel, ElCascaderPanelContext, ElSelect, ElOption, ElCollapse, ElCollapseItem
} from 'element-plus'
import { ref, reactive, watch, onBeforeMount, onMounted } from 'vue'
import { Icon } from '@iconify/vue';
import {
  pieOptions,  multipleBarChart, stacklineOptions, mapChartOptions,treemapOptions,pyramidOptions,
  lineOptions, stackedbarOptions, barMaleFemaleOptions, simpleBarChart,stackedbarOptionsAbs
} from './chart-types'
import type { EChartsOption } from 'echarts'
import { registerMap, getMap } from 'echarts/core'
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
import VChart, { THEME_KEY } from 'vue-echarts';
import { provide } from 'vue';
import { getRoutesList } from '@/api/settlements'
import { inject } from 'vue'
import { useRouter } from 'vue-router'
import { FullScreen, Loading } from '@element-plus/icons-vue'

const { push } = useRouter()

 
const theme = inject(THEME_KEY)

console.log('ECharts Theme in use:', theme)

 




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
    try {
      // Load critical data first
      await getDynamicDashboards();
      dashboardLoading.value = false;
      
      // Load remaining data in parallel for better performance
      await Promise.all([
        getCountyGeo(),
        getCards(),
        getCountySubcountySep(),
        getTabs()
      ]);
      
      console.log("All dashboard data loaded successfully");
      console.log(dashboard_id.value);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set loading states to false even on error to prevent infinite loading
      dashboardLoading.value = false;
      geoLoading.value = false;
      cardLoading.value = false;
    }
  });

 


const activeTab = ref();
const loading = ref(true)
const cardLoading = ref(true)
const geoLoading = ref(true)
const chartsLoading = ref(true)
const dashboardLoading = ref(true)
const chartLoadingMessages = ref(new Map()) // Track loading messages for individual charts
const activeCollapse = ref([ ])

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
const fmap = ref(false)

const getCountyGeo = async () => {
    try {
      geoLoading.value = true;
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
        console.log('✅ Map registered: KE', countyGeo.value.features?.length, 'features');
        // Log feature property keys and names to help debug data linkage
        if (countyGeo.value.features?.length > 0) {
          const firstProps = countyGeo.value.features[0]?.properties;
          console.log('🗺️ GeoJSON property KEYS:', Object.keys(firstProps || {}));
          console.log('🗺️ First feature properties:', firstProps);
          const allGeoNames = countyGeo.value.features.map((f: any) => f.properties?.name || f.properties?.NAME || f.properties?.Name || Object.values(f.properties || {})[0] || 'no name');
          console.log('🗺️ ALL geoJSON feature names:', allGeoNames);
        }
        fmap.value=true
        console.log('fmap',fmap.value)
      }
    } catch (error) {
      console.error('Error loading county geo data:', error);
    } finally {
      geoLoading.value = false;
    }
  }


const getSubsetGeo = async (model, filterFields, filterValues) => {
  try {
    console.log('Get all parcels for this settlement - START', { model, filterFields, filterValues })

    const formData = {}
    formData.model = model
    formData.columnFilterField = filterFields
    formData.selectedParents = filterValues
    formData.id = filterValues

    console.log('getSubsetGeo - calling API with formData:', formData)
    const res = await getfilteredGeo(formData)
    console.log('getSubsetGeo - API response received:', res)

    // Extract geoJSON from multiple possible shapes
    let geoJSON: any | null = null
    const data = res?.data

    // Shape 1: data[0] is an array of rows: [ { json_build_object: {...} } ]
    if (Array.isArray(data?.[0]) && data[0][0]?.json_build_object) {
      geoJSON = data[0][0].json_build_object
    }

    // Shape 2: data[0] is directly the object: { json_build_object: {...} }
    if (!geoJSON && data?.[0]?.json_build_object) {
      geoJSON = data[0].json_build_object
    }

    // Shape 3: PostgreSQL Result object at data[1].rows[0].json_build_object
    if (!geoJSON && data?.[1]?.rows?.[0]?.json_build_object) {
      geoJSON = data[1].rows[0].json_build_object
    }

    if (!geoJSON || !geoJSON.features) {
      console.error('getSubsetGeo - Invalid geoJSON structure:', res)
      throw new Error('Invalid geo response structure')
    }

    console.log('filtered Geo features:', geoJSON.features)
    var collection = turf.featureCollection(geoJSON.features);
    console.log('collection Geo:', collection)
    subCountyGeo.value = collection
    var bbox = turf.bbox(subCountyGeo.value);
    const y_coord = (bbox[1] + bbox[3]) / 2;
    aspect.value = Math.cos(y_coord * Math.PI / 180);

    console.log('collection aspect:', aspect.value)
    // Do NOT register the map here; caller decides which map name to use
    console.log('getSubsetGeo - COMPLETED successfully')
  } catch (error) {
    console.error('getSubsetGeo - ERROR:', error)
    throw error // Re-throw so caller knows it failed
  }
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

// Add indicator_category_id to request body for automatic filtering if it's an indicator card
if (selectModel === 'indicator_category_report' && card.indicator_category_id) {
  formData.indicator_category_id = card.indicator_category_id
}

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

  //    console.log("Filtred", filteredData)
      let arr = filteredData.length > 0 ? filteredData.map(item => (item[aggregationMethod] ? parseInt(item[aggregationMethod]) : 0)) : [0]
    //  console.log("arr", arr)
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
    else if (chartType == 3 || chartType == 10 ) { //3 pie bar chart
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


    if(chartType!=3&&chartType!=10 ) { 
      groupFields.push('ward.name')
    }
  }




  else if (filterLevel.value === 'national' ) {
    associated_Models.push('county')


     if(chartType!=3&&chartType!=10 ) { 
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

// Add indicator_category_id to request body for automatic filtering if it's an indicator card
if (cmodel === 'indicator_category_report' && thisChart.indicator_category_id) {
  formData.indicator_category_id = thisChart.indicator_category_id
}

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

    else if (chartType == 3 || chartType == 10 ) {
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

    else if (chartType == 11) {
      console.log('treemap chart--- ', amount);
      // For treemaps, series is [{ data: [{ x: label, y: value }, ...] }]
      const keys = Object.keys(amount[0]);
      const extractedData = keys.map((key) => amount.map((item) => item[key]));
      console.log('extractedData', extractedData);
      // Combine labels and values into treemap format
      seriesData = [
        {
          data: extractedData[0].map((label, index) => ({
            x: label,
            y: convertStringsToNumbers([extractedData[1][index]])[0],
          })),
        },
      ];
      console.log('seriesData-tree',seriesData)
      categoryArray = extractedData[0]; // Still return labels for compatibility
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

          console.log('resultx2',card)


          cards.value.push(card)
          cards.value.sort((a, b) => a.id - b.id);

          console.log('Sorted',  cards.value)


        });

  // result.then((crd) => {
  //     console.log('resultx',crd); // "Promise resolved!"
  //     let card = arrayItem
  //     card.value = crd
  //     card.symbol=cardSymbol
  //     cards.value.push(card)
  //   });

  })


  console.log('After Querry', res)
  cards.value.sort((a, b) => a.id - b.id);

}

const getCards = async () => {
  try {
    cardLoading.value = true;
    await getCardData();
  } catch (error) {
    console.error('Error loading cards:', error);
  } finally {
    cardLoading.value = false;
  }
}




///// ----------------Process sections and charts---------------------------------------
////-----------------------------------------------------------------------------------


const getCharts = async (section_id) => {
  try {
    chartsLoading.value = true;
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
    const response = await getSettlementListByCounty(formData);
    //  const charts = response.data;
    console.log('Getting the charts ', response.data)


    response.data.forEach(function async(thisChart) {
      console.log('This Chart:', thisChart)
      
      // Set initial loading state for this chart
      setChartLoading(thisChart.id, 'Preparing chart...')



      // function to process processMultiBarChart charts 
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


// Function to process treemap charts
async function processTreemapChart() {
  const promises = [async function () {
    console.log('processTreemapRequests:', thisChart.card_model, thisChart.card_model_field, thisChart.aggregation);
    
    // Set loading state for this chart
    setChartLoading(thisChart.id, 'Loading treemap data...');

    try {
      const cdata = await xgetSummaryMultipleParentsGrouped(thisChart);
      console.log('treemap - cdata', cdata);

      const UpdatedTreemapOptions = {
        ...treemapOptions,
        chart: {
          ...treemapOptions.chart,
          type: 'treemap', // Ensure type is treemap
        },
        title: {
          ...treemapOptions.title,
          text: thisChart.title,
        },
        //series: [{ data: cdata[0].map((label, index) => ({ x: label, y: cdata[1][index] })) }], // Combine labels and series into treemap format
        series:cdata[1],
        plotOptions: {
          treemap: {
            distributed: true,
            enableShades: false,
          },
        },
        legend: {
          show: false,
        },
      };

      console.log('UpdatedTreemapOptions', UpdatedTreemapOptions);
      console.log('cdata', cdata[1]);

      thisChart.chart = UpdatedTreemapOptions;

      // Show "No data" message if data is empty
      if (!cdata[1] || cdata[1].length === 0) {
        thisChart.chart.graphic = [{
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: 'No data available',
            fill: '#999',
            fontSize: 16,
          },
          z: 100,
        }];
      }
    } catch (error) {
      console.error('Error in processTreemapChart:', error);
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
          console.log('This map chart details:', thisChart.card_model, thisChart.card_model_field, thisChart.aggregation);

          try {

            const cdata = await xgetSummaryMultipleParentsGrouped(thisChart ); // first array is the categories // second is the data
            console.log('map data raw', cdata)
            const rawRange = Array.isArray(cdata?.[0]) ? cdata[0] : [0, 0]
            const rawData = Array.isArray(cdata?.[1]) ? cdata[1] : []

            // Clean and sanitize map data: require a valid name and numeric value
            const mapData = rawData
              .filter((item: any) => item && item.name != null && item.value != null && !isNaN(Number(item.value)))
              .map((item: any) => ({
                name: item.name,
                value: Number(item.value)
              }))

            // Fallback min/max if not provided or if data is empty
            let MaxMin = rawRange
            if ((!Array.isArray(rawRange) || rawRange.length < 2) && mapData.length) {
              const values = mapData.map(d => d.value)
              MaxMin = [Math.min(...values), Math.max(...values)]
            }

            // Determine which geo level to use based on filters
            // Capture current filter values to avoid closure issues
            const currentFilterLevel = filterLevel.value;
            const currentSelectedCounties = selectedCounties.value;
            const currentSelectedSubCounties = selectedSubCounties.value;
            
            console.log('filterLevel 0001', currentFilterLevel)
            console.log('selectedCounties 0001', currentSelectedCounties)
            console.log('currentSelectedCounties length', currentSelectedCounties.length)
            
            let geoToUse = null;
            let mapName = 'KE_county'; // default: national counties
            
            if (currentSelectedCounties.length > 0 && currentFilterLevel == 'county') {
              // Counties selected -> show subcounties within those counties
              console.log('About to call getSubsetGeo for subcounty...')
              try {
                await getSubsetGeo('subcounty', ['county_id'], currentSelectedCounties)
                geoToUse = subCountyGeo.value;
                mapName = 'KE_subcounty';
                console.log('✅ Using subcounty-level geo (filtered by counties)', geoToUse?.features?.length, 'features');
              } catch (error) {
                console.error('Failed to get subcounty geo, falling back to county geo:', error)
                await getCountyGeo()
                geoToUse = countyGeo.value;
                mapName = 'KE_county';
              }
            } else if (currentSelectedSubCounties.length > 0 && currentFilterLevel === 'subcounty') {
              // Subcounties selected -> show wards within those subcounties
              console.log('About to call getSubsetGeo for ward...')
              try {
                await getSubsetGeo('ward', ['subcounty_id'], currentSelectedSubCounties)
                geoToUse = subCountyGeo.value;
                mapName = 'KE_ward';
                console.log('✅ Using ward-level geo (filtered by subcounties)', geoToUse?.features?.length, 'features');
              } catch (error) {
                console.error('Failed to get ward geo, falling back to county geo:', error)
                await getCountyGeo()
                geoToUse = countyGeo.value;
                mapName = 'KE_county';
              }
            } else {
              // National level - use full county geo (47 counties)
              await getCountyGeo()
              geoToUse = countyGeo.value;
              mapName = 'KE_county';
              console.log('✅ Using county-level geo (national - 47 counties)');
            }
            
            // Detect the GeoJSON name property (ECharts defaults to 'name')
            let geoNameProperty = 'name';
            if (geoToUse && geoToUse.features && geoToUse.features[0]?.properties) {
              const props = geoToUse.features[0].properties;
              if (props.name !== undefined) geoNameProperty = 'name';
              else if (props.NAME !== undefined) geoNameProperty = 'NAME';
              else if (props.Name !== undefined) geoNameProperty = 'Name';
              else {
                // Fallback: use the first string property
                const firstStringKey = Object.keys(props).find(k => typeof props[k] === 'string');
                if (firstStringKey) geoNameProperty = firstStringKey;
              }
              console.log('🗺️ Detected geoNameProperty:', geoNameProperty, '| First feature props:', props);
            }

            // Register the appropriate geo with a specific name
            if (geoToUse && geoToUse.features) {
              registerMap(mapName, geoToUse);
              console.log(`✅ Map registered: ${mapName}`, geoToUse.features.length, 'features');
            }

            console.log('apsect 0002', aspect.value)

            // Build map option like the official USA example, but for KE
            const UpdatedMapOtions = {
              title: {
                text: thisChart.title,
                subtext: 'National Slum Database',
                left: 'right'
              },
              tooltip: {
                trigger: 'item',
                showDelay: 0,
                transitionDuration: 0.2
              },
              visualMap: {
                left: 'right',
                min: MaxMin[0],
                max: MaxMin[1],
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
                left: 'left',
                top: 'top',
                feature: {
                  dataView: { readOnly: false },
                  restore: {},
                  saveAsImage: {}
                }
              },
              series: [
                {
                  name: thisChart.title,
                  type: 'map',
                  roam: true,
                  map: mapName,
                  nameProperty: geoNameProperty,
                  aspectScale: aspect.value,
                  emphasis: {
                    label: {
                      show: true
                    }
                  },
                  data: mapData
                }
              ]
            };

            console.log('UpdatedMapOtions 0003', UpdatedMapOtions)
            console.log('mapData 0003 (first 5):', mapData.slice(0, 5))
            // Check name matching using actual geoToUse and detected property
            if (geoToUse?.features) {
              const allGeoNames = geoToUse.features.map((f: any) => f.properties?.[geoNameProperty] || 'no name');
              const allMapDataNames = mapData.map((d: any) => d.name);
              const matched = allMapDataNames.filter(name => allGeoNames.includes(name));
              const unmatched = allMapDataNames.filter(name => !allGeoNames.includes(name));
              console.log(`🗺️ Name matching (prop=${geoNameProperty}):`, matched.length, 'matched,', unmatched.length, 'unmatched');
              if (unmatched.length > 0) console.log('❌ Unmatched data names:', unmatched);
              if (matched.length === 0 && allMapDataNames.length > 0) {
                console.log('⚠️ ZERO matches! Geo names sample:', allGeoNames.slice(0, 5), '| Data names sample:', allMapDataNames.slice(0, 5));
              }
            }
            // Verify map is registered
            const registeredMaps = getMap ? getMap(mapName) : null;
            console.log(`Map ${mapName} registered?`, registeredMaps ? 'YES' : 'NO', registeredMaps ? `(${registeredMaps.geoJSON?.features?.length} features)` : '');
            thisChart.chart = UpdatedMapOtions

            // show no data 
            if (mapData.length === 0) {
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
                  const results = response.Total[0];
                    const keys = Object.keys(results);

                     
                      let Total = 0;
                      for (const key in results) {
                        const value = parseFloat(results[key]);
                        if (!isNaN(value)) {
                          Total += value;
                        }
                      }

                    // 1) Extract raw counts (positive numbers) for male and female:
                    const maleKeys = keys.filter(key => key.endsWith('m'));
                    const rawMale = maleKeys.map(key => parseInt(results[key], 10));

                    const femaleKeys = keys.filter(key => key.endsWith('f'));
                    const rawFemale = femaleKeys.map(key => parseInt(results[key], 10));

                    // 2) Compute percentages for each age bracket:
                    //    malePct[i]   =  (rawMale[i]   / (rawMale[i] + rawFemale[i])) * 100
                    //    femalePct[i] = -(rawFemale[i] / (rawMale[i] + rawFemale[i])) * 100
                    //   (note the negation on femalePct so it shows on the "left" side of a horizontal pyramid)
                    const malePct = [];
                    const femalePct = [];

                    for (let i = 0; i < rawMale.length; i++) {
                        const m = rawMale[i];
                        const f = rawFemale[i];
                        //const total = m + f;

                        if (Total === 0) {
                          // if there's no one in that bracket, show 0%
                          malePct.push(0);
                          femalePct.push(0);
                        } else {
                          // percent of that age group
                          malePct.push(parseFloat(((m / Total) * 100).toFixed(2)));
                          // negative so it appears on the left
                          femalePct.push(-parseFloat(((f / Total) * 100).toFixed(2)));
                        }
                      }

                    // 3) Push into your reactive arrays (or wherever you need them):
                    //mArray.value.push(malePct);
                 //   fArray.value.push(femalePct);

                            console.log(response)

                  const UpdatedpyramidOptions = {
                        // copy everything from the original
                        ...pyramidOptions,

                        // 1) Override the series array with your computed data
                        series: [
                          {
                            ...pyramidOptions.series[0], // "Males" template
                            data: malePct                  // your new males array
                          },
                          {
                            ...pyramidOptions.series[1], // "Females" template
                            data: femalePct                // your new females array
                          }
                        ],

                        // 2) Deep-spread chartOptions so we can replace title.text
                        chartOptions: {
                          ...pyramidOptions.chartOptions,
                          title: {
                            ...pyramidOptions.chartOptions.title,
                            text: thisChart.title      // replace "Mauritius population pyramid 2011"
                          }
                        }
                      };

                      console.log('UpdatedpyramidOptions',UpdatedpyramidOptions)

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
 


      // Run the approriate funtion 
      if (thisChart.type == 1) {
        console.log('processSimpleBarChart')
        processSimpleBarChart()
      }

      else if (thisChart.type == 2) {
        processMultiBarChart();
      }

      else if (thisChart.type == 3 || thisChart.type == 10) {
        processPieChart();

      }

    else if (thisChart.type == 11) {
        processTreemapChart();

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
        console.log('calling processPyramid')
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
  // Set main loading to false after all data is loaded
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
      return 'pie';
    }

        else if (typeId==10) {
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

const xhandleCardClick = async (card) => {
 
      // Route based on card.entity
      switch (card.card_model) {
        case 'settlement':
        push({name: 'Settlements'})
          break;
        case 'Grievance':
        push({name: 'Grievances'})
          break;
        case 'households':
        push({name: 'AllHouseholds'})
          break;
        case 'PastReports':
              push({name: 'PastReports'})
          break;
          case 'Articles':
              push({name: 'Articles'})
          break;
          case 'Committees':
              push({name: 'Committees'})
          break;
          case 'Education':
              push({name: 'Education'})
          break;

          case 'Health':
              push({name: 'Health'})
          break;
          case 'Media':
              push({name: 'Media'})
          break;
          case 'Parcel':
              push({name: 'Parcel'})
          break;
         
          case 'PipedWater':
              push({name: 'PipedWater'})
          break;

          case 'Repository':
              push({name: 'Repository'})
          break;
 
          case 'Sewer':
              push({name: 'Sewer'})
          break;
          case 'Surveys':
              push({name: 'Surveys'})
          break;
  
 
          case 'WaterPoint':
              push({name: 'WaterPoint'})
          break;
 


 












        default:
          // Fallback route or no action
        
          break;
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

const toggleFullscreen = (event: Event, chartId: string) => {
  const chartContainer = document.getElementById(chartId)?.closest('.chart-wrapper');
  if (chartContainer) {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      chartContainer.requestFullscreen();
    }
  }
};

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
                :onClear="handleClear" 
                v-model="selectCounty" 
                multiple 
                clearable 
                filterable 
                collapse-tags 
                placeholder="Select County">
                <el-option v-for="item in countyList" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </div>

            <div class="filter-group">
              <label class="filter-label">Constituency</label>
              <el-select 
                class="filter-select"
                @change="filterSubCounty" 
                :onClear="handleClear" 
                v-model="selectSubCounty" 
                clearable 
                multiple 
                filterable 
                collapse-tags 
                placeholder="Select Constituency">
                <el-option v-for="item in filteredSubCountyList" :key="item.value" :label="item.label" :value="item.value" />
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
          <ElSkeleton :loading="cardLoading" animated>
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
    
    <div class="tabs-container main-tabs">
      <el-tabs v-model="activeTab" class="dashboard-tabs" tab-position="top">
        <el-tab-pane v-for="(tab) in tabs" :name="tab.name" :key="tab.id" :label="tab.label">
          <div class="tab-content-scrollable">
            <el-row :gutter="20">
              <el-col v-if="(!tab.charts || tab.charts.length === 0) && !chartsLoading" :span="24">
                <el-empty description="No charts available for this section" />
              </el-col>
              <template v-if="tab.charts && tab.charts.length > 0">
                <el-col v-for="(chart) in tab.charts" :key="chart.id" :span="12" :xl="12" :lg="12" :md="12" :sm="24" :xs="24">
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
                          <div v-if="chart.type==7" :id="`map-container-${chart.id}`" style="width: 100%; height: 400px;">
                            <v-chart :id="chart.id" class="chart" :option="chart.chart" style="width: 100%; height: 100%;" autoresize />
                          </div> 
                          <div v-if="chart.type!=7 && chart.type!=8" class="chart-wrapper">
                            <div class="chart-actions">
                              <el-button 
                                class="fullscreen-btn" 
                                @click="toggleFullscreen($event, chart.id)"
                                :icon="FullScreen"
                                circle
                              />
                            </div>
                            <apexchart 
                              :id="chart.id"
                              :options="chart.chart" 
                              :series="Array.isArray(chart.chart.series) ? chart.chart.series : []" 
                              :type="getChartType(chart.type)" 
                              height="300" 
                              autoresize
                            />
                          </div>
                          <div v-if="chart.type==8" class="chart-wrapper">
                            <div class="chart-actions">
                              <el-button 
                                class="fullscreen-btn" 
                                @click="toggleFullscreen($event, chart.id)"
                                :icon="FullScreen"
                                circle
                              />
                            </div>
                            <apexchart 
                              :id="chart.id"
                              type="bar" 
                              :options="chart.chart.chartOptions" 
                              :series="Array.isArray(chart.chart.series) ? chart.chart.series : []" 
                              height="300" 
                              autoresize 
                            />
                          </div>
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

.chart-wrapper {
  position: relative;
  width: 100%;
}

.chart-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  display: flex;
  gap: 8px;
}

.fullscreen-btn {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.fullscreen-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.05);
}

/* Dark mode styles */
@media (prefers-color-scheme: dark) {
  .value-text {
    color: #d11d1d;
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
  
  .fullscreen-btn {
    background: rgba(30, 30, 30, 0.9);
    color: #fff;
  }
  
  .fullscreen-btn:hover {
    background: rgba(40, 40, 40, 1);
  }
}


 
</style>
