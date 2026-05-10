<script setup lang="ts">
import {
  ElRow, ElCol, ElCard, ElEmpty, ElTabs, ElTabPane, ElSkeleton, ElSkeletonItem, ElSelect, ElOption, ElButton, ElDrawer
} from 'element-plus'
import { ref, reactive, onBeforeMount, onMounted, onBeforeUnmount, watch } from 'vue'
import { Icon } from '@iconify/vue';
import {
  pieOptions,  multipleBarChart, stacklineOptions, treemapOptions,pyramidOptions,
  lineOptions, stackedbarOptions, simpleBarChart,stackedbarOptionsAbs,
  mapChartOptions, mapChartSourceFooterFill, mapChartNoDataFill, mapChartNoDataAreaColor,
  mergeApexChartOptionsWithTheme, mergeEchartsMapOptionForTheme,
} from './chart-types'
import { registerMap } from 'echarts/core'
import { getSettlementListByCounty } from '@/api/settlements'
import { useI18n } from '@/hooks/web/useI18n'
import {
  getSummarybyFieldFromMultipleIncludes,
  getSummaryBatchByFieldFromMultipleIncludes,
  getSummaryGroupByMultipleFields,
} from '@/api/summary'
import { getListWithoutGeo } from '@/api/counties'
import { getfilteredGeo } from '@/api/settlements'
import * as turf from '@turf/turf'
import { getAllGeo } from '@/api/settlements'
import { useRoute } from 'vue-router'
import VChart from 'vue-echarts';
import { getRoutesList } from '@/api/settlements'
import { useRouter } from 'vue-router'
import { Loading, Download } from '@element-plus/icons-vue'
import { geoCache as _geoCache } from '@/utils/dashboardCache'
import { useAppStore } from '@/store/modules/app'

const { push } = useRouter()
const appStore = useAppStore()

 
 




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
  const res = await getRoutesList(formData)

  //dashboard_id.value =res.data[0].id  // get the id of the first dashboard

  res.data.forEach(function async(arrayItem) {

    if (arrayItem.main_dashboard) {
      dashboard_id.value = arrayItem.id  // get the id of the first dashboard

    }

   })

}
//getDynamicDashboards()


onBeforeMount( async () => {
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
      
    } catch (error) {
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
/** Plain object (not Map) so Vue tracks updates when messages change. */
const chartLoadingMessages = ref<Record<string, string>>({})
const filtersVisible = ref(false)
const tempCounty = ref([])
const tempSubCounty = ref([])

// Toggle filters visibility
const toggleFilters = () => {
  filtersVisible.value = !filtersVisible.value
  if (filtersVisible.value) {
    // Store current values when opening
    tempCounty.value = [...selectCounty.value]
    tempSubCounty.value = [...selectSubCounty.value]
  }
}

// Cancel filter changes
const cancelFilters = () => {
  // Restore original values
  selectCounty.value = [...tempCounty.value]
  selectSubCounty.value = [...tempSubCounty.value]
  filtersVisible.value = false
}

// Handle drawer close (for before-close prop)
const handleDrawerClose = (done: () => void) => {
  // Just close the drawer without clearing filter values
  filtersVisible.value = false
  done()
}

// Confirm and apply filters
const confirmFilters = () => {
  // Apply filters based on what's selected
  if (selectCounty.value.length > 0) {
    filterCounty(selectCounty.value)
    // If subcounty is also selected, apply it after county
    if (selectSubCounty.value.length > 0) {
      setTimeout(() => {
        filterSubCounty(selectSubCounty.value)
      }, 100)
    }
  } else if (selectSubCounty.value.length > 0) {
    // Only subcounty selected
    filterSubCounty(selectSubCounty.value)
  } else {
    // Both cleared - reset all
    handleClear()
  }
  filtersVisible.value = false
}

// Listen for filter toggle event from TagsView
onMounted(() => {
  window.addEventListener('toggle-national-filters', toggleFilters)
})

onBeforeUnmount(() => {
  window.removeEventListener('toggle-national-filters', toggleFilters)
})

// Helper functions for chart loading states
const chartKey = (chartId: string | number) => String(chartId)

const setChartLoading = (chartId: string | number, message = 'Loading chart...') => {
  const k = chartKey(chartId)
  chartLoadingMessages.value = { ...chartLoadingMessages.value, [k]: message }
}

const setChartLoaded = (chartId: string | number) => {
  const k = chartKey(chartId)
  const next = { ...chartLoadingMessages.value }
  delete next[k]
  chartLoadingMessages.value = next
}

const isChartLoading = (chartId: string | number) => {
  return chartKey(chartId) in chartLoadingMessages.value
}

const getChartLoadingMessage = (chartId: string | number) => {
  return chartLoadingMessages.value[chartKey(chartId)] || 'Loading chart...'
}

const cards = ref([])
const tabs = ref([])

/** Apex/ECharts options snapshot getters at build time; re-merge plain colors when dark mode toggles. */
function refreshDashboardChartThemes() {
  for (const tab of (tabs.value as any[]) || []) {
    for (const ch of (tab.charts as any[]) || []) {
      if (!ch.chart) continue
      try {
        if (ch.type === 7) {
          ch.chart = mergeEchartsMapOptionForTheme(ch.chart as Record<string, unknown>)
        } else if (ch.type === 8) {
          const c = ch.chart as Record<string, unknown>
          if (c.chartOptions) {
            ch.chart = {
              ...c,
              chartOptions: mergeApexChartOptionsWithTheme(c.chartOptions as Record<string, unknown>),
            }
          }
        } else {
          ch.chart = mergeApexChartOptionsWithTheme(ch.chart as Record<string, unknown>)
        }
      } catch {
        /* ignore */
      }
    }
  }
}

watch(
  () => appStore.getIsDark,
  () => {
    refreshDashboardChartThemes()
  },
)

const filterLevel = ref('national')
const selectedCounties = ref([])
const selectedSubCounties = ref([])
const selectedWards = ref([])
const options = ref([])


// Selected settlement for download
const selectedSettlement = ref<{name: string, value: number, chartId: string} | null>(null)

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

      // Return cached county geo if already fetched this session
      if (_geoCache.has('county')) {
        countyGeo.value = _geoCache.get('county')
        const bbox = turf.bbox(countyGeo.value)
        const y_coord = (bbox[1] + bbox[3]) / 2
        aspect.value = Math.cos(y_coord * Math.PI / 180)
        registerMap('KE', countyGeo.value)
        fmap.value = true
        return
      }

      const formData = {}
      formData.model = 'county'
      const res = await getAllGeo(formData)
      if (res.data[0].json_build_object.features) {
        countyGeo.value = res.data[0].json_build_object
        _geoCache.set('county', countyGeo.value)

        var bbox = turf.bbox(countyGeo.value);
        const y_coord = (bbox[1] + bbox[3]) / 2;
        aspect.value = Math.cos(y_coord * Math.PI / 180);

        registerMap('KE', res.data[0].json_build_object);
        fmap.value=true
      }
    } catch (error) {
    } finally {
      geoLoading.value = false;
    }
  }


const getSubsetGeo = async (model, filterFields, filterValues) => {
  try {

    const geoCacheKey = `${model}:${filterFields.join(',')}:${JSON.stringify(filterValues)}`
    if (_geoCache.has(geoCacheKey)) {
      subCountyGeo.value = _geoCache.get(geoCacheKey)
      const bbox = turf.bbox(subCountyGeo.value)
      const y_coord = (bbox[1] + bbox[3]) / 2
      aspect.value = Math.cos(y_coord * Math.PI / 180)
      return
    }

    const formData = {}
    formData.model = model
    formData.columnFilterField = filterFields
    formData.selectedParents = filterValues
    formData.id = filterValues

    const res = await getfilteredGeo(formData)

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
      throw new Error('Invalid geo response structure')
    }

    var collection = turf.featureCollection(geoJSON.features);
    subCountyGeo.value = collection
    _geoCache.set(geoCacheKey, collection)
    var bbox = turf.bbox(subCountyGeo.value);
    const y_coord = (bbox[1] + bbox[3]) / 2;
    aspect.value = Math.cos(y_coord * Math.PI / 180);

    // Do NOT register the map here; caller decides which map name to use
  } catch (error) {
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

  // getSummary(arrayItem.card_model,arrayItem.card_model_field)

  //var ids = await getIndicatorConfigurations(indicator)


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


  try {
    const response01 = await getSummarybyFieldFromMultipleIncludes(formData);

    // const response = await getSumFilter(sumQuery);
    const amount = response01.Total[0][aggregMethod] ? parseInt(response01.Total[0][aggregMethod]) : 0

    return amount;
  } catch (error) {
    // Handle any errors that occur during the asynchronous operation
    //return null; // or any default value you prefer
    return 0; // or any default value you prefer
  }
};

function xtransformData(data, chartType, aggregationMethod, cfield) {


  // Create array of unique names (categories)
  const uniqueNames = [...new Set(data.map(item => item.name))];
  uniqueNames.sort();



  const uniqueCategoryTitles = [...new Set(data.map(item => item[cfield]))];
  uniqueCategoryTitles.sort();


  // Loop through categories and create the resulting object, padding as needed
  const result = uniqueCategoryTitles.map(category => {

    const dataArr = []
    uniqueNames.map(name => {
      const filteredData = data.filter(item => item[cfield] === category && item.name === name);

      let arr = filteredData.length > 0 ? filteredData.map(item => (item[aggregationMethod] ? parseInt(item[aggregationMethod]) : 0)) : [0]
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

/** Build POST body for /summary/byfield/multiple (batch + single). */
function buildChartSummaryFormData(thisChart: any) {
  const associated_Models: string[] = []
  const filterFields: string[] = []
  const filterValues: any[] = []
  const groupFields: string[] = []
  const filterOperators: string[] = []

  const cmodel = thisChart.card_model
  const filters = thisChart.filters
  const cfield = thisChart.card_model_field
  const cAggregation = thisChart.aggregation
  const chartType = thisChart.type
  const categorizedField = thisChart.categorized
  const unique = thisChart.unique ? thisChart.unique : false
  const ignoreEmpty = thisChart.ignore_empty ? thisChart.ignore_empty : false

  if (filters) {
    for (const item of filters) {
      if (item.field) {
        filterFields.push(item.field)
        filterValues.push(item.value)
        filterOperators.push(item.operation)
      }
    }
  }

  if (categorizedField) {
    groupFields.push(cmodel + '.' + cfield)
  }

  if (chartType == 5 || chartType == 6) {
    groupFields.push(cmodel + '.createdAt')
  }

  if (filterLevel.value === 'county') {
    associated_Models.push('subcounty')
    filterFields.push('county_id')
    filterValues.push(selectedCounties.value)
    filterOperators.push('or')
    if (chartType != 3 && chartType != 10) {
      groupFields.push('subcounty.name')
    }
  } else if (filterLevel.value === 'subcounty') {
    associated_Models.push('ward')
    filterFields.push('subcounty_id')
    filterValues.push(selectedSubCounties.value)
    filterOperators.push('or')
    if (chartType != 3 && chartType != 10) {
      groupFields.push('ward.name')
    }
  } else if (filterLevel.value === 'national') {
    associated_Models.push('county')
    if (chartType != 3 && chartType != 10) {
      groupFields.push('county.name')
    }
  }

  const formData: Record<string, any> = {}
  formData.model = cmodel
  formData.summaryField = cmodel + '.' + cfield
  formData.summaryFunction = cAggregation
  formData.assoc_models = associated_Models
  formData.groupFields = groupFields
  formData.filterField = filterFields
  formData.filterOperator = filterOperators
  formData.filterValue = filterValues
  if (cmodel === 'indicator_category_report' && thisChart.indicator_category_id) {
    formData.indicator_category_id = thisChart.indicator_category_id
  }
  formData.uniqueCounts = unique
  formData.ignoreEmpty = ignoreEmpty
  return formData
}

function transformMultipleSummaryTotal(thisChart: any, amount: any[]) {
  const cfield = thisChart.card_model_field
  const cAggregation = thisChart.aggregation
  const chartType = thisChart.type

  if (!amount || !Array.isArray(amount) || amount.length === 0) {
    return [[], []]
  }

  const categoryArray: any[] = []
  amount.forEach((obj) => {
    if (!categoryArray.includes(obj.name)) {
      categoryArray.push(obj.name)
    }
  })

  if (chartType == 5) {
    const keys = amount.reduce((allKeys: string[], obj: any) => allKeys.concat(Object.keys(obj)), [])
    const uniqueKeys = [...new Set(keys)]
    const values: Record<string, any[]> = {}
    uniqueKeys.forEach((key) => {
      values[key] = amount.map((obj) => obj[key] || null)
    })
    const aggKey = String(cAggregation)
    return [values.createdAt, values[aggKey]]
  }

  if (chartType == 6) {
    const dates = [...new Set(amount.map((item: any) => item.createdAt))].sort()
    const result: Record<string, any> = {}
    for (const item of amount) {
      const createdAt = item.createdAt
      const aggVal = item[cAggregation]
      if (!result[item[cfield]]) {
        result[item[cfield]] = {
          name: item[cfield],
          type: 'line',
          stack: 'Total',
          data: [],
        }
      }
      const dateIndex = dates.indexOf(createdAt)
      result[item[cfield]].data.push([dateIndex, Number(aggVal)])
    }
    return [dates, Object.values(result)]
  }

  if (chartType == 3 || chartType == 10) {
    const keys = Object.keys(amount[0])
    const extractedData = keys.map((key) => amount.map((item) => item[key]))
    return [extractedData[0], convertStringsToNumbers(extractedData[1])]
  }

  if (chartType == 11) {
    const keys = Object.keys(amount[0])
    const extractedData = keys.map((key) => amount.map((item) => item[key]))
    const seriesData = [
      {
        data: extractedData[0].map((label: any, index: number) => ({
          x: label,
          y: convertStringsToNumbers([extractedData[1][index]])[0],
        })),
      },
    ]
    return [extractedData[0], seriesData]
  }

  if (chartType == 7) {
    let maxSum = Number.MIN_SAFE_INTEGER
    let minSum = Number.MAX_SAFE_INTEGER
    for (const item of amount) {
      const vals = Object.values(item)
      for (const value of vals) {
        if (!isNaN(value as any)) {
          const numValue = parseInt(String(value), 10)
          maxSum = Math.max(maxSum, numValue)
          minSum = Math.min(minSum, numValue)
        }
      }
    }
    if (minSum === maxSum) {
      minSum = 0
    }
    const newPropertyName = 'value'
    for (let i = 0; i < amount.length; i++) {
      const rowKeys = Object.keys(amount[i])
      if (rowKeys.length > 1) {
        const oldValue = rowKeys[1]
        amount[i][newPropertyName] = amount[i][oldValue]
        delete amount[i][oldValue]
      }
    }
    return [[minSum, maxSum], amount]
  }

  const seriesData = xtransformData(amount, chartType, cAggregation, cfield)
  categoryArray.sort()
  return [categoryArray, seriesData]
}

const xgetSummaryMultipleParentsGrouped = async (thisChart: any, preloaded?: any) => {
  try {
    let amount: any
    if (preloaded && preloaded.Total !== undefined && preloaded.Total !== null) {
      amount = preloaded.Total
    } else {
      const formData = buildChartSummaryFormData(thisChart)
      const response = await getSummarybyFieldFromMultipleIncludes(formData)
      amount = response.Total
    }
    return transformMultipleSummaryTotal(thisChart, amount)
  } catch {
    return []
  }
}

// Request ID to track current request and prevent race conditions
let currentCardRequestId = 0

const getCardData = async () => {
  // Increment request ID for this request
  currentCardRequestId++
  const requestId = currentCardRequestId

  var filters = ['dashboard_id']
  var filterValues = [[dashboard_id.value]]  // make sure the inner array is array

  // Clear cards at the start of a new request
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
  const res = await getSettlementListByCounty(formData)

  // Check if this request is still the latest one
  if (requestId !== currentCardRequestId) {
    return
  }

  // cards.value = res.data
 
  // Phase 1: add all cards immediately with loading state (undefined value shows skeleton)
  res.data.forEach((arrayItem) => {
    const cardSymbol = arrayItem.computation === 'proportion' ? '%' : ''
    const existingCardIndex = cards.value.findIndex(c => c.id === arrayItem.id)
    if (existingCardIndex === -1) {
      const card = { ...arrayItem, value: undefined, symbol: cardSymbol }
      cards.value.push(card)
    } else {
      cards.value[existingCardIndex].value = undefined
      cards.value[existingCardIndex].symbol = cardSymbol
    }
  })
  cards.value.sort((a, b) => a.id - b.id)

  // Phase 2: fetch all summaries in parallel
  await Promise.all(res.data.map(async (arrayItem) => {
    const cardSymbol = arrayItem.computation === 'proportion' ? '%' : ''
    try {
      const crd = await getSummary(arrayItem)
      if (requestId !== currentCardRequestId) return
      const cardIndex = cards.value.findIndex(c => c.id === arrayItem.id)
      if (cardIndex !== -1) {
        cards.value[cardIndex].value = (crd !== null && crd !== undefined) ? crd : 0
        cards.value[cardIndex].symbol = cardSymbol
        cards.value.sort((a, b) => a.id - b.id)
      }
    } catch (e) {
    }
  }))

}

const getCards = async () => {
  try {
    cardLoading.value = true;
    await getCardData();
  } catch (error) {
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

    const summaryByChartId = new Map<string, any>()
    try {
      const forBatch = response.data.filter(
        (c: any) => Number(c.type) !== 8 && c.card_model && c.card_model_field,
      )
      if (forBatch.length > 0) {
        const items = forBatch.map((c: any) => ({
          id: String(c.id),
          payload: buildChartSummaryFormData(c),
        }))
        const batchRes: any = await getSummaryBatchByFieldFromMultipleIncludes({ items })
        const list = batchRes?.results ?? []
        for (const r of list) {
          if (r.ok && r.data) summaryByChartId.set(r.id, r.data)
        }
      }
    } catch {
      /* charts fall back to individual /summary/byfield/multiple calls */
    }

    const processPromises: Promise<void>[] = []
    response.data.forEach(function(thisChart) {
      
      // Build subtitle with filter label
      const filterLabel = getActiveFilterLabel()
      const subtitleText = filterLabel ? `${filterLabel} |` : ''
      const sourceText = `Source: National Geodatabase of Slums, ${new Date().getFullYear()}`
      const subtitleWithSource = `${subtitleText}\n${sourceText}`


      // Set initial loading state for this chart
      setChartLoading(thisChart.id, 'Preparing chart...')



      // function to process processMultiBarChart charts 
 async function processPieChart() {
  const promises = [async function () {
    
    // Set loading state for this chart
    setChartLoading(thisChart.id, 'Loading pie chart data...');

    try {
      const cdata = await xgetSummaryMultipleParentsGrouped(thisChart, summaryByChartId.get(String(thisChart.id)));

      const isDonut = thisChart.type == '10'; // Custom flag you can define

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
          subtitle: {
            ...pieOptions.subtitle,
            text: subtitleWithSource
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
    }
  }];

  await promises[0]();

  charts.push(thisChart);
  setChartLoaded(thisChart.id); // Mark chart as loaded
}


// Function to process treemap charts
async function processTreemapChart() {
  const promises = [async function () {
    
    // Set loading state for this chart
    setChartLoading(thisChart.id, 'Loading treemap data...');

    try {
      const cdata = await xgetSummaryMultipleParentsGrouped(thisChart, summaryByChartId.get(String(thisChart.id)));

      const UpdatedTreemapOptions = {
        ...treemapOptions,
        chart: {
          ...treemapOptions.chart,
          type: 'treemap', // Ensure type is treemap
          toolbar: {
            ...(treemapOptions.chart?.toolbar || {}),
            show: true,
            export: {
              scale: 3,
              width: 1800
            }
          }
        },
        title: {
          ...treemapOptions.title,
          text: thisChart.title,
        },
        subtitle: {
          ...treemapOptions.subtitle,
          text: subtitleWithSource,
        },
        //series: [{ data: cdata[0].map((label, index) => ({ x: label, y: cdata[1][index] })) }], // Combine labels and series into treemap format
        series:cdata[1],
        plotOptions: {
          ...treemapOptions.plotOptions,
          treemap: {
            ...treemapOptions.plotOptions?.treemap,
            distributed: true,
            enableShades: false,
          },
        },
        legend: {
          show: false,
        },
      };


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
    }
  }];

  await promises[0]();

  charts.push(thisChart);
  setChartLoaded(thisChart.id); // Mark chart as loaded
}


      // function to process processMultiBarChart charts 
      async function processSimpleBarChart() {
        const promises = [async function () {
          setChartLoading(thisChart.id, 'Loading bar chart data...');
          try {

            var cdata = await xgetSummaryMultipleParentsGrouped(thisChart, summaryByChartId.get(String(thisChart.id)));

            const allCats: any[] = Array.isArray(cdata[0]) ? cdata[0] : []
            const allSeries: any[] = Array.isArray(cdata[1]) ? cdata[1] : []

            // Descending by total: Apex horizontal bar shows first category at the top
            const indexed = allCats.map((cat: any, i: number) => ({
              cat,
              total: allSeries.reduce((sum: number, s: any) =>
                sum + (Array.isArray(s.data) ? (Number(s.data[i]) || 0) : 0), 0),
              idx: i,
            }))
            indexed.sort((a: any, b: any) => b.total - a.total)

            const sortedCats = indexed.map((x: any) => x.cat)
            const sortedSeries = allSeries.map((s: any) => ({
              ...s,
              data: Array.isArray(s.data) ? indexed.map((x: any) => s.data[x.idx]) : s.data,
            }))

            thisChart.chartDataFull = { categories: sortedCats, series: sortedSeries }
            thisChart.chartExpanded = false
            const PAGE = 10
            const displayCats = sortedCats.slice(0, PAGE)
            const displaySeries = sortedSeries.map((s: any) => ({
              ...s, data: Array.isArray(s.data) ? s.data.slice(0, PAGE) : s.data,
            }))
            thisChart.chartHeight = Math.max(320, Math.min(PAGE, sortedCats.length) * 22 + 160)

            const UpdatedBarOptionsMultiple = {
              ...simpleBarChart,
              title: { ...simpleBarChart.title, text: thisChart.title },
              subtitle: { ...simpleBarChart.subtitle, text: subtitleWithSource },
              chart: { ...simpleBarChart.chart, height: thisChart.chartHeight },
              xaxis: { ...simpleBarChart.xaxis, categories: displayCats },
              series: displaySeries,
            };

            thisChart.chart = UpdatedBarOptionsMultiple;

            if (allCats.length === 0) {
              thisChart.chart.graphic = [{
                type: 'text', left: 'center', top: 'middle',
                style: { text: 'No data available', fill: '#999', fontSize: 16 },
                z: 100
              }];
            }

          } catch (error) {
            // Handle any errors that occurred during the process
          }
        }];

        await promises[0]();

        charts.push(thisChart)
        setChartLoaded(thisChart.id); // Mark chart as loaded
      }
      // function to process processMultiBarChart charts 
      async function processMultiBarChart() {
        const promises = [async function () {

          try {

            var cdata = await xgetSummaryMultipleParentsGrouped(thisChart, summaryByChartId.get(String(thisChart.id))); // first array is the categories // second is the data

            const UpdatedBarOptionsMultiple = {
              ...multipleBarChart,
              title: {
                ...multipleBarChart.title,
                text: thisChart.title
              },
              subtitle: {
                ...multipleBarChart.subtitle,
                text: subtitleWithSource
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





        charts.push(thisChart)
        setChartLoaded(thisChart.id); // Mark chart as loaded
        // Continue with the rest of your code here
      }

      // function to process processStackedBarChart charts 
      async function processStackedBarChart() {
        const promises = [async function () {
 
          try {

            var cdata = await xgetSummaryMultipleParentsGrouped(thisChart, summaryByChartId.get(String(thisChart.id))); // first array is the categories // second is the data

            const allCats: any[] = Array.isArray(cdata[0]) ? cdata[0] : []
            const allSeries: any[] = Array.isArray(cdata[1]) ? cdata[1] : []

            // Store full dataset for expand toggle
            thisChart.chartDataFull = { categories: allCats, series: allSeries }
            thisChart.chartExpanded = false
            const PAGE = 10
            const displayCats = allCats.slice(0, PAGE)
            const displaySeries = allSeries.map((s: any) => ({ ...s, data: Array.isArray(s.data) ? s.data.slice(0, PAGE) : s.data }))
            thisChart.chartHeight = Math.max(320, Math.min(PAGE, allCats.length) * 22 + 160)

            const UpdatedBarOptionsMultiple = {
              ...stackedbarOptions,
              title: { ...stackedbarOptions.title, text: thisChart.title },
              subtitle: { ...stackedbarOptions.subtitle, text: subtitleWithSource },
              chart: { ...stackedbarOptions.chart, height: thisChart.chartHeight },
              xaxis: { ...stackedbarOptions.xaxis, categories: displayCats },
              series: displaySeries
            };

            thisChart.chart = UpdatedBarOptionsMultiple

            if (allCats.length === 0) {
              thisChart.chart.graphic = [{
                type: 'text', left: 'center', top: 'middle',
                style: { text: 'No data  available', fill: '#999', fontSize: 16 },
                z: 100
              }]
            }

          } catch (error) {
            // Handle any errors that occurred during the process
          }
        }];

        //     await Promise.all(promises);
        await promises[0]();

        // The loop has completed and all promises have been resolved/rejected





        charts.push(thisChart)
        setChartLoaded(thisChart.id); // Mark chart as loaded
        // Continue with the rest of your code here
      }



       // function to process processStackedBarChart charts 
       async function processStackedBarChartAbs() {
        const promises = [async function () {
 
          try {

            var cdata = await xgetSummaryMultipleParentsGrouped(thisChart, summaryByChartId.get(String(thisChart.id))); // first array is the categories // second is the data

            const allCats: any[] = Array.isArray(cdata[0]) ? cdata[0] : []
            const allSeries: any[] = Array.isArray(cdata[1]) ? cdata[1] : []

            // Descending by total stack height (sum across series) — largest at top for horizontal bars
            const indexed = allCats.map((cat: any, i: number) => ({
              cat,
              total: allSeries.reduce((sum: number, s: any) =>
                sum + (Array.isArray(s.data) ? (Number(s.data[i]) || 0) : 0), 0),
              idx: i,
            }))
            indexed.sort((a: any, b: any) => b.total - a.total)

            const sortedCats = indexed.map((x: any) => x.cat)
            const sortedSeries = allSeries.map((s: any) => ({
              ...s,
              data: Array.isArray(s.data) ? indexed.map((x: any) => s.data[x.idx]) : s.data,
            }))

            thisChart.chartDataFull = { categories: sortedCats, series: sortedSeries }
            thisChart.chartExpanded = false
            const PAGE = 10
            const displayCats = sortedCats.slice(0, PAGE)
            const displaySeries = sortedSeries.map((s: any) => ({
              ...s, data: Array.isArray(s.data) ? s.data.slice(0, PAGE) : s.data,
            }))
            thisChart.chartHeight = Math.max(320, Math.min(PAGE, sortedCats.length) * 22 + 160)

            const UpdatedBarOptionsMultiple = {
              ...stackedbarOptionsAbs,
              title: { ...stackedbarOptionsAbs.title, text: thisChart.title },
              subtitle: { ...stackedbarOptionsAbs.subtitle, text: subtitleWithSource },
              chart: { ...stackedbarOptionsAbs.chart, height: thisChart.chartHeight },
              xaxis: { ...stackedbarOptionsAbs.xaxis, categories: displayCats },
              series: displaySeries
            };

            thisChart.chart = UpdatedBarOptionsMultiple

            if (allCats.length === 0) {
              thisChart.chart.graphic = [{
                type: 'text', left: 'center', top: 'middle',
                style: { text: 'No data  available', fill: '#999', fontSize: 16 },
                z: 100
              }]
            }

          } catch (error) {
            // Handle any errors that occurred during the process
          }
        }];

        //     await Promise.all(promises);
        await promises[0]();

        // The loop has completed and all promises have been resolved/rejected

        charts.push(thisChart)
        setChartLoaded(thisChart.id); // Mark chart as loaded
        // Continue with the rest of your code here
      }



      // function to process processMultiBarChart charts 
      async function processLineChart() {
        const promises = [async function () {

          try {

            var cdata = await xgetSummaryMultipleParentsGrouped(thisChart, summaryByChartId.get(String(thisChart.id))); // first array is the categories // second is the data



            const UpdatedBarOptionsMultiple = {
              ...lineOptions,
              title: {
                ...lineOptions.title,
                text: thisChart.title
              },
              subtitle: {
                ...lineOptions.subtitle,
                text: subtitleWithSource
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





        charts.push(thisChart)
        setChartLoaded(thisChart.id); // Mark chart as loaded
        // Continue with the rest of your code here
      }
      // function to process processMultiBarChart charts 
      async function processStackLineChart() {
        const promises = [async function () {

          try {

            var cdata = await xgetSummaryMultipleParentsGrouped(thisChart, summaryByChartId.get(String(thisChart.id))); // first array is the categories // second is the data


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
              subtitle: {
                ...stacklineOptions.subtitle,
                text: subtitleWithSource
              },
              xAxis: {
                ...stacklineOptions.xAxis,
                data: cdata[0]  // categories as recieved 
              },

            };
            UpdatedBarOptionsMultiple.series = cdata[1]



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





        charts.push(thisChart)
        setChartLoaded(thisChart.id); // Mark chart as loaded
        // Continue with the rest of your code here
      }


      // function to process processMultiBarChart charts 
      async function processMapChart() {
        const promises = [async function () {

          try {

            const cdata = await xgetSummaryMultipleParentsGrouped(thisChart, summaryByChartId.get(String(thisChart.id))); // first array is the categories // second is the data
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
            
            
            let geoToUse = null;
            let mapName = 'KE_county'; // default: national counties
            
            if (currentSelectedCounties.length > 0 && currentFilterLevel == 'county') {
              // Counties selected -> show subcounties within those counties
              try {
                await getSubsetGeo('subcounty', ['county_id'], currentSelectedCounties)
                geoToUse = subCountyGeo.value;
                mapName = 'KE_subcounty';
              } catch (error) {
                await getCountyGeo()
                geoToUse = countyGeo.value;
                mapName = 'KE_county';
              }
            } else if (currentSelectedSubCounties.length > 0 && currentFilterLevel === 'subcounty') {
              // Subcounties selected -> show wards within those subcounties
              try {
                await getSubsetGeo('ward', ['subcounty_id'], currentSelectedSubCounties)
                geoToUse = subCountyGeo.value;
                mapName = 'KE_ward';
              } catch (error) {
                await getCountyGeo()
                geoToUse = countyGeo.value;
                mapName = 'KE_county';
              }
            } else {
              // National level - use full county geo (47 counties)
              await getCountyGeo()
              geoToUse = countyGeo.value;
              mapName = 'KE_county';
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
            }

            // Register the appropriate geo with a specific name
            if (geoToUse && geoToUse.features) {
              registerMap(mapName, geoToUse);
            }


            const mapSeriesBase = (mapChartOptions.series?.[0] ?? {}) as Record<string, unknown>
            const isMapEmpty = mapData.length === 0

            const sourceFooterGraphic = {
              type: 'text' as const,
              left: 'center' as const,
              bottom: 5,
              z: 100,
              zlevel: 2,
              style: {
                text: `Source: National Geodatabase of Slums, ${new Date().getFullYear()}`,
                fill: mapChartSourceFooterFill(),
                font: '12px sans-serif',
              },
            }

            const graphicList: unknown[] = [sourceFooterGraphic]
            if (isMapEmpty) {
              graphicList.unshift({
                type: 'text' as const,
                left: 'center' as const,
                top: 'middle' as const,
                z: 3000,
                zlevel: 20,
                style: {
                  text: 'No data available',
                  fill: mapChartNoDataFill(),
                  fontSize: 17,
                  fontWeight: 600,
                },
              })
            }

            const UpdatedMapOtions = {
              ...mapChartOptions,
              title: {
                ...mapChartOptions.title,
                text: thisChart.title,
                subtext: subtitleWithSource,
                left: 'right',
              },
              graphic: graphicList,
              visualMap: isMapEmpty
                ? { show: false }
                : {
                    ...mapChartOptions.visualMap,
                    min: MaxMin[0],
                    max: MaxMin[1],
                  },
              toolbox: {
                ...mapChartOptions.toolbox,
                left: 'left',
                top: 'top',
                feature: {
                  dataView: { readOnly: false },
                  restore: {},
                  saveAsImage: {},
                },
              },
              series: [
                {
                  ...mapSeriesBase,
                  name: thisChart.title,
                  map: mapName,
                  nameProperty: geoNameProperty,
                  aspectScale: aspect.value,
                  data: mapData,
                  ...(isMapEmpty
                    ? {
                        itemStyle: {
                          ...(mapSeriesBase.itemStyle as Record<string, unknown>),
                          areaColor: mapChartNoDataAreaColor(),
                        },
                      }
                    : {}),
                },
              ],
            }

            thisChart.chart = UpdatedMapOtions


          } catch (error) {
            // Handle any errors that occurred during the process
          }
        }];

        //     await Promise.all(promises);
        await promises[0]();

        // The loop has completed and all promises have been resolved/rejected





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
                            text: thisChart.title
                          },
                          subtitle: {
                            ...(pyramidOptions.chartOptions.subtitle || {}),
                            text: subtitleWithSource
                          },
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





        charts.push(thisChart)
        setChartLoaded(thisChart.id); // Mark chart as loaded
        // Continue with the rest of your code here
      }
 


      // Run the approriate funtion 
      if (thisChart.type == 1) {
        processPromises.push(processSimpleBarChart())
      }

      else if (thisChart.type == 2) {
        processPromises.push(processMultiBarChart());
      }

      else if (thisChart.type == 3 || thisChart.type == 10) {
        processPromises.push(processPieChart());
      }

      else if (thisChart.type == 11) {
        processPromises.push(processTreemapChart());
      }

      else if (thisChart.type == 4) {
        processPromises.push(processStackedBarChart());
      }

      else if (thisChart.type == 9) {
        processPromises.push(processStackedBarChartAbs());
      }

      else if (thisChart.type == 5) {
        processPromises.push(processLineChart());
      }

      else if (thisChart.type == 6) {
        processPromises.push(processStackLineChart());
      }

      else if (thisChart.type == 7) {
        processPromises.push(processMapChart());
      }

      else if (thisChart.type == 8) {
        processPromises.push(processPyramid());
      }

    })

    // Wait for all chart processes to complete before returning
    await Promise.all(processPromises)

    return charts.sort((a, b) => a.id - b.id);

  } catch (error) {
    // Handle any errors that occur during the asynchronous operation
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
  const res = await getSettlementListByCounty(formData)





  //activeTab.value = tabs.value[0].name;


  async function processSectionsData() {
    const promises = res.data.map(async function (arrayItem) {
      let tab = {};
      tab.id = arrayItem.id;
      tab.label = arrayItem.title;
      tab.name = arrayItem.title;
      tab.charts = await getCharts(arrayItem.id);
      return tab;
    });

    tabs.value = await Promise.all(promises);
    tabs.value.sort((a, b) => a.id - b.id);
    activeTab.value = tabs.value[0] ? tabs.value[0].name : ''

  }

    await processSectionsData();

  } catch (error) {
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

function getActiveFilterLabel() {
  // No filter text for national level
  if (filterLevel.value === 'national') {
    return ''
  }

  const summarize = (labels: string[], max = 3) => {
    if (!labels || labels.length === 0) return ''
    if (labels.length <= max) return labels.join(', ')
    const head = labels.slice(0, max).join(', ')
    return `${head} (+${labels.length - max} more)`
  }

  // County level: list selected counties
  if (filterLevel.value === 'county' && selectedCounties.value?.length) {
    const labels = countyList.value
      .filter((c: any) => selectedCounties.value.includes(c.value))
      .map((c: any) => c.label)

    return summarize(labels)
  }

  // Subcounty level: list selected subcounties
  if (filterLevel.value === 'subcounty' && selectedSubCounties.value?.length) {
    const labels = subCountyList.value
      .filter((s: any) => selectedSubCounties.value.includes(s.value))
      .map((s: any) => s.label)

    return summarize(labels)
  }

  return ''
}

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

}

 



onMounted(() => {
  // Set main loading to false after all data is loaded
  loading.value = false
});



const selectCounty = ref([])
const selectSubCounty = ref([])
const handleClear = async () => {
  selectSubCounty.value = []
  selectCounty.value = []
  selectedSubCounties.value = []
  selectedCounties.value = []
  filteredSubCountyList.value = [...subCountyList.value]
  filterLevel.value = 'national'
  getCards()
  getTabs()
}


// Live cascade: filter subcounty list and clear stale selections as user picks counties
const onCountySelectChange = (county_ids: any[]) => {
  if (!county_ids || county_ids.length === 0) {
    filteredSubCountyList.value = [...subCountyList.value]
  } else {
    filteredSubCountyList.value = subCountyList.value.filter(option => county_ids.includes(option.county_id))
    // Remove any selected subcounties that no longer belong to chosen counties
    const validIds = new Set(filteredSubCountyList.value.map((o: any) => o.value))
    selectSubCounty.value = (selectSubCounty.value || []).filter((id: any) => validIds.has(id))
  }
}

const filterCounty = async (county_id) => {
  filteredSubCountyList.value = county_id.length
    ? subCountyList.value.filter(option => county_id.includes(option.county_id))
    : [...subCountyList.value]

  // Clear subcounty selections that don't belong to the new counties
  const validIds = new Set(filteredSubCountyList.value.map((o: any) => o.value))
  selectSubCounty.value = (selectSubCounty.value || []).filter((id: any) => validIds.has(id))

  selectedCounties.value = county_id
  filterLevel.value = selectedCounties.value.length === 0 ? 'national' : 'county'
  getCards()
  getTabs()
}


const filterSubCounty = async (subcountyId) => {
  //selectSubCounty.value=null
 
selectedSubCounties.value = subcountyId;
 


  if (selectedSubCounties.value.length == 0) {
    filterLevel.value = selectedCounties.value.length ? 'county' : 'national'
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

const STACKED_PAGE = 10

/** Toggle for simple bar: full data is sorted descending; collapsed view is first 10 (largest at top). */
function toggleSimpleBarExpand(chart: any) {
  if (!chart.chartDataFull) return
  chart.chartExpanded = !chart.chartExpanded
  const { categories, series } = chart.chartDataFull
  const displayCats = chart.chartExpanded ? categories : categories.slice(0, STACKED_PAGE)
  const displaySeries = series.map((s: any) => ({
    ...s,
    data: Array.isArray(s.data)
      ? (chart.chartExpanded ? s.data : s.data.slice(0, STACKED_PAGE))
      : s.data,
  }))
  const height = chart.chartExpanded
    ? Math.max(320, categories.length * 22 + 160)
    : Math.max(320, Math.min(STACKED_PAGE, categories.length) * 22 + 160)
  chart.chartHeight = height
  chart.chart = {
    ...chart.chart,
    chart: { ...chart.chart.chart, height },
    xaxis: { ...chart.chart.xaxis, categories: displayCats },
    series: displaySeries,
  }
}

function toggleChartExpand(chart: any) {
  if (!chart.chartDataFull) return
  chart.chartExpanded = !chart.chartExpanded
  const { categories, series } = chart.chartDataFull
  const displayCats = chart.chartExpanded ? categories : categories.slice(0, STACKED_PAGE)
  const displaySeries = series.map((s: any) => ({
    ...s,
    data: Array.isArray(s.data)
      ? (chart.chartExpanded ? s.data : s.data.slice(0, STACKED_PAGE))
      : s.data,
  }))
  const height = chart.chartExpanded
    ? Math.max(320, categories.length * 22 + 160)
    : Math.max(320, Math.min(STACKED_PAGE, categories.length) * 22 + 160)
  chart.chartHeight = height
  chart.chart = {
    ...chart.chart,
    chart: { ...chart.chart.chart, height },
    xaxis: { ...chart.chart.xaxis, categories: displayCats },
    series: displaySeries,
  }
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
    else if (typeId == 11) {
      return 'treemap';
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


// Handle map click to select settlement
const handleMapClick = (params: any, chartId: string) => {
  if (params && params.name) {
    selectedSettlement.value = {
      name: params.name,
      value: params.value || 0,
      chartId: chartId
    };
  }
};

// Download settlement data
const downloadSettlementData = async () => {
  if (!selectedSettlement.value) return;
  
  const settlement = selectedSettlement.value;
  const data = {
    location: settlement.name,
    value: settlement.value,
    timestamp: new Date().toISOString()
  };
  
  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${settlement.name.replace(/\s+/g, '_')}_data.json`;
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

</script>

<template>
  <div class="dashboard-container" v-loading="dashboardLoading" element-loading-text="Loading dashboard..." element-loading-background="rgba(255, 255, 255, 0.75)">
    <!-- Filter Drawer -->
    <el-drawer
      v-model="filtersVisible"
      title="Filters"
      direction="rtl"
      size="300px"
      :before-close="handleDrawerClose"
    >
      <div class="filter-drawer-content">
        <div class="filter-group">
          <label class="filter-label">County</label>
          <el-select
            class="filter-select"
            v-model="selectCounty"
            multiple
            clearable
            filterable
            collapse-tags
            placeholder="Select County"
            size="default"
            @change="onCountySelectChange">
            <el-option v-for="item in countyList" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Constituency</label>
          <el-select 
            class="filter-select"
            v-model="selectSubCounty" 
            clearable 
            multiple 
            filterable 
            collapse-tags 
            placeholder="Select Constituency"
            size="default">
            <el-option v-for="item in filteredSubCountyList" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
        <div class="filter-drawer-actions">
          <el-button @click="cancelFilters">Cancel</el-button>
          <el-button type="primary" @click="confirmFilters">Confirm</el-button>
        </div>
      </div>
    </el-drawer>

    <el-row :gutter="16" class="cards-row">
      <!-- Placeholder skeletons before any cards have loaded -->
      <template v-if="cardLoading && cards.length === 0">
        <el-col v-for="n in 4" :key="'card-ph-' + n" :xs="24" :sm="12" :md="8" :lg="6">
          <div class="tabs-container">
            <el-card shadow="hover" class="stat-card" :body-style="{ padding: '0' }">
              <ElSkeleton animated :loading="true">
                <template #template>
                  <div class="card-skeleton-placeholder">
                    <ElSkeletonItem variant="circle" style="width:40px;height:40px" />
                    <div style="flex:1">
                      <ElSkeletonItem variant="h3" style="width:60%" />
                      <ElSkeletonItem variant="text" style="width:80%;margin-top:8px" />
                    </div>
                  </div>
                </template>
              </ElSkeleton>
            </el-card>
          </div>
        </el-col>
      </template>
      <el-col v-for="(card) in cards" :key="card.id" :span="24 / cards.length" :xs="24" :sm="12" :md="8" :lg="6">
        <div class="tabs-container card-fade-in">
          <ElSkeleton :loading="cardLoading || card.value === undefined || card.value === null" animated>
            <template #template>
              <el-card shadow="hover" class="stat-card" :body-style="{ padding: '0' }">
                <div class="card-skeleton-placeholder">
                  <ElSkeletonItem variant="circle" style="width:40px;height:40px" />
                  <div style="flex:1">
                    <ElSkeletonItem variant="h3" style="width:60%" />
                    <ElSkeletonItem variant="text" style="width:80%;margin-top:8px" />
                  </div>
                </div>
              </el-card>
            </template>
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
    
    <!-- Skeleton for entire sections+charts area while tabs haven't loaded yet -->
    <div v-if="chartsLoading && tabs.length === 0" class="tabs-skeleton-container">
      <div class="tabs-skeleton-header">
        <ElSkeletonItem v-for="n in 3" :key="'tab-ph-'+n" variant="button" class="tab-label-skeleton" />
      </div>
      <el-row :gutter="20" style="margin-top:16px">
        <el-col v-for="n in 4" :key="'tabs-chart-ph-'+n" :span="12" :md="12" :sm="24" :xs="24">
          <div class="charts-container">
            <el-card class="chart-card">
              <ElSkeleton animated :loading="true">
                <template #template>
                  <div class="chart-skeleton-placeholder">
                    <p class="chart-skeleton-loading-text">Loading chart…</p>
                    <ElSkeletonItem variant="h3" style="width:45%;margin-bottom:16px" />
                    <ElSkeletonItem variant="rect" style="width:100%;height:280px;border-radius:4px" />
                  </div>
                </template>
              </ElSkeleton>
            </el-card>
          </div>
        </el-col>
      </el-row>
    </div>

    <div v-show="!chartsLoading || tabs.length > 0" class="tabs-container main-tabs">
      <el-tabs v-model="activeTab" class="dashboard-tabs" tab-position="top">
        <el-tab-pane v-for="(tab) in tabs" :name="tab.name" :key="tab.id" :label="tab.label">
            <el-row :gutter="20">
              <el-col v-if="(!tab.charts || tab.charts.length === 0) && !chartsLoading" :span="24">
                <el-empty description="No charts available for this section" />
              </el-col>
              <!-- Placeholder skeletons while charts are loading -->
              <template v-if="chartsLoading && (!tab.charts || tab.charts.length === 0)">
                <el-col v-for="n in 2" :key="'chart-ph-' + n" :span="12" :md="12" :sm="24" :xs="24">
                  <div class="charts-container">
                    <el-card class="chart-card">
                      <ElSkeleton animated :loading="true">
                        <template #template>
                          <div class="chart-skeleton-placeholder">
                            <p class="chart-skeleton-loading-text">Loading section charts…</p>
                            <ElSkeletonItem variant="h3" style="width:40%;margin-bottom:16px" />
                            <ElSkeletonItem variant="rect" style="width:100%;height:280px;border-radius:4px" />
                          </div>
                        </template>
                      </ElSkeleton>
                    </el-card>
                  </div>
                </el-col>
              </template>
              <template v-if="tab.charts && tab.charts.length > 0">
                <el-col v-for="(chart) in tab.charts" :key="chart.id" :span="12" :xl="12" :lg="12" :md="12" :sm="24" :xs="24">
                  <div class="charts-container">
                    <el-card class="chart-card">
                      <ElSkeleton :loading="chartsLoading || isChartLoading(chart.id)" animated>
                        <template #template>
                          <div class="chart-skeleton-placeholder">
                            <p class="chart-skeleton-loading-text">{{ getChartLoadingMessage(chart.id) }}</p>
                            <ElSkeletonItem variant="h3" style="width:45%;margin-bottom:16px" />
                            <ElSkeletonItem variant="rect" style="width:100%;height:280px;border-radius:4px" />
                          </div>
                        </template>
                        <template v-if="chart.chart">
                          <div v-if="chart.type==7" :id="`map-container-${chart.id}`" style="width: 100%; height: 400px; position: relative;">
                            <v-chart 
                              :key="`map-${chart.id}-${appStore.getIsDark}`"
                              :id="chart.id" 
                              class="chart" 
                              :option="chart.chart" 
                              style="width: 100%; height: 100%;" 
                              autoresize 
                              @click="(params) => handleMapClick(params, chart.id)"
                            />
                            <div 
                              v-if="selectedSettlement && selectedSettlement.chartId === chart.id" 
                              class="settlement-download-btn"
                            >
                              <el-button 
                                type="primary" 
                                :icon="Download" 
                                @click="downloadSettlementData"
                                size="small"
                              >
                                Download {{ selectedSettlement.name }} Data
                              </el-button>
                            </div>
                          </div> 
                          <div v-if="chart.type!=7 && chart.type!=8" class="chart-wrapper">
                            <apexchart 
                              :key="`apex-${chart.id}-${appStore.getIsDark}`"
                              :id="chart.id"
                              :options="chart.chart" 
                              :series="Array.isArray(chart.chart.series) ? chart.chart.series : []" 
                              :type="getChartType(chart.type)" 
                              :height="chart.chartHeight || 300" 
                              autoresize
                            />
                            <div
                            v-if="(chart.type == 1 || chart.type == 4 || chart.type == 9) && chart.chartDataFull && chart.chartDataFull.categories.length > 10"
                            class="chart-expand-row"
                          >
                            <el-button text size="small" @click="chart.type == 1 ? toggleSimpleBarExpand(chart) : toggleChartExpand(chart)">
                              {{ chart.chartExpanded ? '↑ Show top 10' : `↓ Show all ${chart.chartDataFull.categories.length}` }}
                            </el-button>
                            </div>
                          </div>
                          <div v-if="chart.type==8" class="chart-wrapper">
                            <apexchart 
                              :key="`pyr-${chart.id}-${appStore.getIsDark}`"
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
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>


<style scoped>
.dashboard-container {
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;
  /* Fit below app header + tags; keep cards + tab bar on screen */
  height: calc(100vh - var(--top-tool-height) - var(--tags-view-height) - var(--app-content-padding));
  max-height: calc(100vh - var(--top-tool-height) - var(--tags-view-height) - var(--app-content-padding));
  min-height: 0;
  overflow: hidden;
  padding: 12px;
}

.tabs-skeleton-container {
  padding: 0 4px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.tabs-skeleton-header {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid var(--el-border-color-light);
  padding-bottom: 12px;
  margin-bottom: 4px;
}

.tab-label-skeleton {
  width: 100px !important;
  height: 32px !important;
  border-radius: 4px;
}

.card-skeleton-placeholder {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  min-height: 80px;
}

.chart-skeleton-placeholder {
  padding: 16px;
}

.chart-skeleton-loading-text {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  letter-spacing: 0.01em;
  white-space: normal;
  overflow: visible;
  word-break: break-word;
  line-height: 1.4;
}

.card-fade-in {
  animation: fadeInUp 0.3s ease both;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Smooth skeleton shimmer transition */
:deep(.el-loading-mask) {
  transition: opacity 0.3s ease;
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
  flex-shrink: 0;
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
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* flex:1 + min-height:0 for the flex chain only — do NOT set flex-direction here.
   ElTabs renders [content, header] in DOM and uses .el-tabs--top { flex-direction: column-reverse }
   so the nav stays on top; overriding with column puts tabs at the bottom. */
.dashboard-tabs {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* Scroll chart pane only; red thumb; no scroll chaining past end */
.dashboard-tabs :deep(.el-tabs__content) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px 4px 10px 0;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: #d41515 #f0f0f0;
}

.dashboard-tabs :deep(.el-tabs__content)::-webkit-scrollbar {
  width: 8px;
}

.dashboard-tabs :deep(.el-tabs__content)::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 4px;
}

.dashboard-tabs :deep(.el-tabs__content)::-webkit-scrollbar-thumb {
  background: #d41515;
  border-radius: 4px;
}

.dashboard-tabs :deep(.el-tabs__content)::-webkit-scrollbar-thumb:hover {
  background: #b01010;
}

.dashboard-tabs :deep(.el-tabs__header) {
  margin-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
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

/* App store dark mode (html.dark) — stat card caption + section tab labels */
html.dark .value-label {
  color: #ffffff;
}

html.dark .dashboard-tabs :deep(.el-tabs__item) {
  color: #ffffff;
}

html.dark .dashboard-tabs :deep(.el-tabs__item.is-active) {
  color: #79bbff;
  font-weight: 600;
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

.filter-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-icon {
  color: #606266;
}

.filter-drawer-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-drawer-content .filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-drawer-content .filter-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.filter-drawer-content .filter-select {
  width: 100%;
}

.filter-drawer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.chart-wrapper {
  position: relative;
  width: 100%;
}

.chart-expand-row {
  display: flex;
  justify-content: center;
  padding: 4px 0 2px;
  border-top: 1px solid var(--el-border-color-lighter);
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
}


 
</style>
