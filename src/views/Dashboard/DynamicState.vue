<script setup lang="ts">
import {
  ElRow, ElCol, ElCard, ElTabs, ElTabPane, ElSkeleton, ElSkeletonItem,
  ElSelect, ElOption,ElEmpty,ElIcon, ElDrawer, ElButton, ElTooltip, ElMessage
} from 'element-plus'
import { Loading, Refresh } from '@element-plus/icons-vue'
import { geoCache as _geoCache, indicatorConfigCache as _indicatorConfigCache } from '@/utils/dashboardCache'
import {
  ensureDashboardGeoBundleLoaded,
  subsetGeoFromCache,
  applyGeoAspect,
} from '@/utils/dashboardGeo'
import { formatDashboardNumberCompact, dashboardNumberTooltip } from '@/utils/formatDashboardNumber'
import {
  dashboardChartTitleSize,
  dashboardChartTitleEmphasisSize,
  dashboardChartAxisPx,
} from '@/utils/dashboardTypography'
import { isInterventionCategory } from '@/utils/dashboardCategory'

import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'



import { Icon } from '@/components/Icon'

import {
  pieOptions, simpleBarChart, multipleBarChart, stacklineOptions, pyramidOptions,
  lineOptions, stackedbarOptions, barMaleFemaleOptions,stackedbarOptionsAbs,
  treemapOptions,
  mapChartOptions, mapChartSourceFooterFill, mapChartNoDataFill, mapChartNoDataAreaColor,
  mergeApexChartOptionsWithTheme, mergeEchartsMapOptionForTheme,
  getExpandableBarChartHeight, withBarChartExport,
  normalizeApexBarSeries,
  buildApexLineSeries,
  buildApexTreemapSeries,
  getChartTimeFieldKey, getChartTimeGroupField, buildMultiVariableLineSeries, getSummaryResultValue,
  heatmapOptions, gaugeOptions, scatterOptions,
} from './chart-types'
import { registerMap, getMap } from 'echarts/core'
import { getSettlementListByCounty } from '@/api/settlements'
import { useI18n } from '@/hooks/web/useI18n'
import {
  getSummarybyFieldFromMultipleIncludes,
  getSummaryBatchByFieldFromMultipleIncludes,
  getSummaryGroupByMultipleFields,
  getChartData,
  renderChart,
} from '@/api/summary'
import { getListWithoutGeo } from '@/api/counties'
import { getfilteredGeo } from '@/api/settlements'

import * as turf from '@turf/turf'
import { getAllGeo } from '@/api/settlements'
import { useRoute } from 'vue-router'



import '@/plugins/echarts'
import VChart from 'vue-echarts'

import { useAppStore } from '@/store/modules/app'
import { useDashboardChartExport } from './composables/useDashboardChartExport'
import DashboardChartExportDrawer from './components/DashboardChartExportDrawer.vue'

import { useRouter } from 'vue-router'
import { getDashboardBundle, type DashboardBundle } from '@/api/dashboard/bundle'

const { push } = useRouter()

const appStore = useAppStore()





const colorPalette = ['#ff007f', '#0000ff'];  // Male-Female

const { t } = useI18n()

const dashboard_id = ref()

const dashboardBundleActive = ref(false)
const dashboardBundlePayload = ref<DashboardBundle | null>(null)
const dashboardBundleRenderById = ref(new Map<string, { categories: any[]; series: any[]; meta?: any }>())
const chartLiveRenderMetaById = ref(new Map<string, any>())
const dashboardBundleGroupById = ref(new Map<string, { Total: any }>())

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

// ── AI loading overlay ────────────────────────────────────────────────────────
const aiMessages = computed(() => {
  const loc = statisticsCardFilterContext.value || 'Kenya'
  return [
    `Querying settlement records for ${loc}…`,
    `Analysing vulnerability patterns in ${loc}…`,
    `Mapping household distributions across ${loc}…`,
    `Aggregating indicator metrics for ${loc}…`,
    `Cross-referencing tenure and infrastructure data in ${loc}…`,
    `Computing population density clusters in ${loc}…`,
    `Correlating water, sanitation and electricity access in ${loc}…`,
    `Scanning grievance trends in ${loc}…`,
    `Joining spatial layers with demographic records for ${loc}…`,
    `Crunching the numbers for ${loc} — almost there…`,
  ]
})
const aiMsgIndex = ref(0)
let aiMsgTimer: ReturnType<typeof setInterval> | null = null

watch(chartsLoading, (loading) => {
  if (loading) {
    aiMsgIndex.value = 0
    aiMsgTimer = setInterval(() => {
      aiMsgIndex.value = (aiMsgIndex.value + 1) % aiMessages.value.length
    }, 2800)
  } else {
    if (aiMsgTimer) { clearInterval(aiMsgTimer); aiMsgTimer = null }
  }
})

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
  () => appStore.getCurrentSize,
  async () => {
    await nextTick()
    refreshDashboardChartThemes()
  },
  { flush: 'post' },
)

watch(
  () => appStore.getIsDark,
  async () => {
    await nextTick()
    refreshDashboardChartThemes()
  },
  { flush: 'post' },
)

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
  await ensureDashboardGeoBundleLoaded()

  if (_geoCache.has('county')) {
    countyGeo.value = _geoCache.get('county')
    aspect.value = applyGeoAspect(countyGeo.value)
    registerMap('KE', countyGeo.value)
    return
  }

  const formData = {}
  formData.model = 'county'
  const res = await getAllGeo(formData)
  console.log('county geo', res.data[0].json_build_object)
  if (res.data[0].json_build_object.features) {
    countyGeo.value = res.data[0].json_build_object
    _geoCache.set('county', countyGeo.value)

    aspect.value = applyGeoAspect(countyGeo.value)
    registerMap('KE', countyGeo.value);
    console.log('✅ Map registered: KE', countyGeo.value.features?.length, 'features');
    if (countyGeo.value.features?.length > 0) {
      const firstProps = countyGeo.value.features[0]?.properties;
      console.log('🗺️ GeoJSON property KEYS:', Object.keys(firstProps || {}));
      console.log('🗺️ First feature properties:', firstProps);
      const allGeoNames = countyGeo.value.features.map((f: any) => f.properties?.name || f.properties?.NAME || f.properties?.Name || Object.values(f.properties || {})[0] || 'no name');
      console.log('🗺️ ALL geoJSON feature names:', allGeoNames);
    }
  }
}


const getSubsetGeo = async (model, filterFields, filterValues) => {
  try {
    console.log('Get all parcels for this settlement - START', { model, filterFields, filterValues })

    await ensureDashboardGeoBundleLoaded()

    const geoCacheKey = `${model}:${filterFields.join(',')}:${JSON.stringify(filterValues)}`
    const cachedSubset = subsetGeoFromCache(model, filterFields, filterValues)
    if (cachedSubset) {
      subCountyGeo.value = cachedSubset
      aspect.value = applyGeoAspect(subCountyGeo.value)
      console.log('getSubsetGeo - served from bundle cache')
      return
    }

    if (_geoCache.has(geoCacheKey)) {
      subCountyGeo.value = _geoCache.get(geoCacheKey)
      aspect.value = applyGeoAspect(subCountyGeo.value)
      console.log('getSubsetGeo - served from cache')
      return
    }

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
    _geoCache.set(geoCacheKey, collection)
    aspect.value = applyGeoAspect(subCountyGeo.value)

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

const getIndicatorConfigurations = async (indicator_id) => {
  // Cache per indicator_id — configs don't change during a session
  if (_indicatorConfigCache.has(indicator_id)) {
    return _indicatorConfigCache.get(indicator_id)
  }

  const formData = {}
  formData.curUser = 1 // Id for logged in user
  formData.model = 'indicator_category'
  formData.searchField = ''
  formData.searchKeyword = ''
  formData.assocModel = ''
  formData.filters = ['indicator_id']
  formData.filterValues = [[indicator_id]]
  formData.associated_multiple_models = []

  const res = await getSettlementListByCounty(formData)
  console.log('indicator configs >>>>', res)
  let ind_config_arr = []
  res.data.forEach(function (arrayItem) {
    ind_config_arr.push(arrayItem.id)
  })

  _indicatorConfigCache.set(indicator_id, ind_config_arr)
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
var filters = scards.filters

if (filters) {
  for (const item of filters) {
    if (item.field) {
      filterFields.push(item.field)
      filterValues.push(item.value)
      filterOperators.push(item.operation)
    }
  }
}

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

else if (filterLevel.value === 'ward') {
  filterFields.push('ward_id')
  filterValues.push(selectedWards.value)
  filterOperators.push('or')
}
 


else if (filterLevel.value === 'national') {
  associated_Models.push('county')


}



const formData = {}
formData.model = 'indicator_category_report'
formData.summaryField = 'amount'
formData.summaryFunction = scards.aggregation || 'sum'
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
  
  // Handle null/empty response
  if (!response01 || !response01.Total || !Array.isArray(response01.Total) || response01.Total.length === 0) {
    console.log('No data returned from backend for intervention card')
    return 0;
  }
  
  const aggregMethod = scards.aggregation || 'sum'
  console.log("Cards sumamrye", response01.Total[0]?.[aggregMethod])
  console.log('indicator_category_id', indicator_category_id)

 // const response = await getSumFilter(sumQuery);
  const amount = response01.Total[0]?.[aggregMethod] ? parseInt(response01.Total[0][aggregMethod]) : 0
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
  if (isInterventionCategory(card.category)) {
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
  var filters = card.filters

  if (filters) {
    for (const item of filters) {
      if (item.field) {
        filterFields.push(item.field)
        filterValues.push(item.value)
        filterOperators.push(item.operation)
      }
    }
  }

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
  else if (filterLevel.value === 'ward') {
    filterFields.push('ward_id')
    filterValues.push(selectedWards.value)
    filterOperators.push('or')
  }
  else if (filterLevel.value === 'national') {
    associated_Models.push('county')
  }
  
  const formData = {}
  formData.model = 'indicator_category_report'
  formData.summaryField = 'amount'
  formData.summaryFunction = card.aggregation || 'sum'
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
    
    // Handle null/empty response
    if (!response01 || !response01.Total || !Array.isArray(response01.Total) || response01.Total.length === 0) {
      console.log('No data returned from backend for indicator card')
      return 0;
    }
    
    const aggregMethod = card.aggregation || 'sum'
    console.log("Indicator Cards summary", response01.Total[0]?.[aggregMethod])
    const amount = response01.Total[0]?.[aggregMethod] ? parseInt(response01.Total[0][aggregMethod]) : 0
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
  else if (filterLevel.value === 'ward') {
    filterFields.push('ward_id')
    filterValues.push(selectedWards.value)
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
    
    // Handle null/empty response
    if (!response01 || !response01.Total || !Array.isArray(response01.Total) || response01.Total.length === 0) {
      console.log('No data returned from backend for entity card:', selectModel)
      return 0;
    }
    
    // Check if the aggregation method result exists
    const resultValue = response01.Total[0]?.[aggregMethod]
    const amount = (resultValue !== null && resultValue !== undefined) ? parseInt(resultValue) : 0
   // console.log("Entity Cards summary", response01)
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

  //console.log('uniqueNames', uniqueNames)
  //console.log('uniqueCategoryTitlesxdata', data)


  const uniqueCategoryTitles = [...new Set(data.map(item => item[cfield]))];
  uniqueCategoryTitles.sort();

 // console.log('uniqueCategoryTitles', uniqueCategoryTitles)

  // Loop through categories and create the resulting object, padding as needed
  const result = uniqueCategoryTitles.map(category => {

    const dataArr = []
    uniqueNames.map(name => {
      const filteredData = data.filter(item => item[cfield] === category && item.name === name);

      //console.log("Filtred", filteredData)
      let arr = filteredData.length > 0 ? filteredData.map(item => (item[aggregationMethod] ? parseInt(item[aggregationMethod]) : 0)) : [0]
      //console.log("arr", arr)
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
 

 

/** Build POST body for /summary/byfield/multiple (batch + single). */
function buildChartSummaryFormData(thisChart: any) {
  const associated_Models: string[] = []
  const filterFields: string[] = []
  const filterValues: any[] = []
  const groupFields: string[] = []
  const filterOperators: string[] = []

  const cmodel = thisChart.card_model
  const filters = thisChart.filters
  const x_axis = parseAxisJson(thisChart.x_axis)
  const y_axis = parseAxisJson(thisChart.y_axis)
  const series_field = parseAxisJson(thisChart.series_field)
  const chartType = Number(thisChart.type)
  const unique = thisChart.unique ? thisChart.unique : false
  const ignoreEmpty = thisChart.ignore_empty ? thisChart.ignore_empty : false

  const cAggregation = (y_axis?.aggregation || 'count').toLowerCase()
  const measureField = y_axis?.field || 'id'

  if (filters) {
    for (const item of filters) {
      if (item.field) {
        filterFields.push(item.field)
        filterValues.push(item.value)
        filterOperators.push(item.operation)
      }
    }
  }

  if (chartType === 3 || chartType === 10) {
    const sliceField = x_axis?.field || measureField
    groupFields.push(cmodel + '.' + sliceField)
  } else if (series_field?.field && x_axis?.field) {
    groupFields.push(cmodel + '.' + x_axis.field)
  } else if (x_axis?.field && x_axis.field !== 'county.name') {
    groupFields.push(cmodel + '.' + x_axis.field)
  }

  if (chartType == 5 || chartType == 6 || chartType == 12) {
    groupFields.push(getChartTimeGroupField(cmodel, thisChart))
  }

  const isTimeSeriesChart = chartType == 5 || chartType == 6 || chartType == 12

  if (filterLevel.value === 'county') {
    associated_Models.push('subcounty')
    filterFields.push('county_id')
    filterValues.push(selectedCounties.value)
    filterOperators.push('or')
    if (chartType != 3 && chartType != 10 && !isTimeSeriesChart) {
      groupFields.push('subcounty.name')
    }
  } else if (filterLevel.value === 'subcounty') {
    associated_Models.push('ward')
    filterFields.push('subcounty_id')
    filterValues.push(selectedSubCounties.value)
    filterOperators.push('or')
    if (chartType != 3 && chartType != 10 && !isTimeSeriesChart) {
      groupFields.push('ward.name')
    }
  } else if (filterLevel.value === 'ward') {
    filterFields.push('ward_id')
    filterValues.push(selectedWards.value)
    filterOperators.push('or')
  } else if (filterLevel.value === 'national') {
    if (!isTimeSeriesChart) {
      associated_Models.push('county')
    }
    if (chartType != 3 && chartType != 10 && !isTimeSeriesChart) {
      groupFields.push('county.name')
    }
  }

  const formData: Record<string, any> = {}
  formData.model = cmodel
  if (chartType == 12) {
    const metrics = Array.isArray(thisChart.metric_fields)
      ? thisChart.metric_fields.filter(Boolean)
      : []
    formData.summaryFields = metrics.map((f: string) => `${cmodel}.${f}`)
    formData.summaryFunction = cAggregation
    if (metrics.length > 0) {
      formData.summaryField = `${cmodel}.${metrics[0]}`
    }
  } else {
    const summaryField = (chartType === 3 || chartType === 10)
      ? (x_axis?.field || measureField)
      : measureField
    formData.summaryField = cmodel + '.' + summaryField
    formData.summaryFunction = cAggregation
  }
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

function convertStringsToNumbers(stringArray: any[]) {
  return stringArray.map(Number)
}

function transformMultipleSummaryTotal(thisChart: any, amount: any[]) {
  const y_axis = parseAxisJson(thisChart.y_axis)
  const x_axis = parseAxisJson(thisChart.x_axis)
  const cAggregation = (y_axis?.aggregation || 'count').toLowerCase()
  const chartType = Number(thisChart.type)
  const cfield = x_axis?.field || y_axis?.field || 'id'

  if (!amount || !Array.isArray(amount) || amount.length === 0) {
    return [[], []]
  }

  let categoryArray: any[] = []
  let seriesData: any[] = []
  amount.forEach((obj) => {
    if (!categoryArray.includes(obj.name)) {
      categoryArray.push(obj.name)
    }
  })

  const timeKey = getChartTimeFieldKey(thisChart)

  if (chartType == 5) {
    const dateSums: Record<string, number> = {}
    for (const obj of amount) {
      const d = obj[timeKey] != null ? String(obj[timeKey]).trim() : ''
      if (!d) continue
      const val = getSummaryResultValue(obj, cAggregation, cfield)
      dateSums[d] = (dateSums[d] || 0) + val
    }
    const sortedDates = Object.keys(dateSums).sort((a, b) => {
      const na = Number(a)
      const nb = Number(b)
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb
      return a.localeCompare(b)
    })
    categoryArray = sortedDates
    seriesData = sortedDates.map((d) => dateSums[d])
    return [categoryArray, seriesData]
  }

  if (chartType == 6) {
    const bySeriesAndDate: Record<string, Record<string, number>> = {}
    for (const item of amount) {
      const d = item[timeKey] != null ? String(item[timeKey]).trim() : ''
      if (!d) continue
      const seriesName = item[cfield]
      if (!bySeriesAndDate[seriesName]) bySeriesAndDate[seriesName] = {}
      const val = getSummaryResultValue(item, cAggregation, cfield)
      bySeriesAndDate[seriesName][d] = (bySeriesAndDate[seriesName][d] || 0) + val
    }
    const dates = [...new Set(amount.map((item) => item[timeKey]).filter((v) => v != null && v !== ''))].sort((a, b) => {
      const na = Number(a)
      const nb = Number(b)
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb
      return String(a).localeCompare(String(b))
    })
    const result: Record<string, any> = {}
    for (const seriesName of Object.keys(bySeriesAndDate)) {
      result[seriesName] = {
        name: seriesName,
        type: 'line',
        stack: 'Total',
        data: dates.map((d, i) => [i, bySeriesAndDate[seriesName][d] || 0]),
      }
    }
    seriesData = Object.values(result)
    categoryArray = dates
    return [categoryArray, seriesData]
  }

  if (chartType == 3 || chartType == 10) {
    if (!amount[0]) return [[], []]
    const keys = Object.keys(amount[0])
    const extractedData = keys.map((key) => amount.map((item) => item[key]))
    categoryArray = extractedData[0]
    seriesData = convertStringsToNumbers(extractedData[1])
    return [categoryArray, seriesData]
  }

  if (chartType == 7) {
    let maxSum = Number.MIN_SAFE_INTEGER
    let minSum = Number.MAX_SAFE_INTEGER
    for (const item of amount) {
      const values = Object.values(item)
      for (const value of values) {
        if (!isNaN(value as number)) {
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
      const keys = Object.keys(amount[i])
      if (keys.length > 1) {
        const oldValue = keys[1]
        amount[i][newPropertyName] = amount[i][oldValue]
        delete amount[i][oldValue]
      }
    }
    categoryArray = [minSum, maxSum]
    seriesData = amount
    return [categoryArray, seriesData]
  }

  seriesData = xtransformData(amount, chartType, cAggregation, cfield)
  categoryArray.sort()
  return [categoryArray, seriesData]
}

/** Parse axis JSONB — may arrive as object or string depending on API path. */
function parseAxisJson(val: any) {
  if (!val) return null
  if (typeof val === 'string') {
    try { return JSON.parse(val) } catch { return null }
  }
  return val
}

/** Route to /chart/render when axis config is present (incl. line/map/multi-line types). */
function shouldUseAxisEndpoint(chart: any): boolean {
  if (chart.category && chart.category !== 'Status') return false
  const type = Number(chart.type)
  // Multi-variable line — metric_fields + time_field only (no y_axis)
  if (type === 12) {
    return Array.isArray(chart.metric_fields) && chart.metric_fields.length > 0
  }
  const y_axis = parseAxisJson(chart.y_axis)
  if (!y_axis?.aggregation) return false
  const x_axis = parseAxisJson(chart.x_axis)
  if (x_axis?.field) return true
  if (type === 5) return true   // line — uses time_field
  if (type === 7) return true   // map — county implicit
  if (type === 14) return true  // heatmap
  if (type === 15) return true  // gauge
  return false
}

/** Use a second Y axis when series magnitudes differ by more than 10×. */
function detectDualAxis(series: { name: string; data: number[] }[]): boolean {
  const maxVals = series.map((s) => Math.max(...s.data, 0)).filter((v) => v > 0)
  if (maxVals.length < 2) return false
  const hi = Math.max(...maxVals)
  const lo = Math.min(...maxVals)
  return lo > 0 && hi / lo > 10
}

/**
 * Fetch chart data via the dedicated per-type endpoint (/api/v1/chart/render).
 * Returns [categories, series] same shape as xgetSummaryMultipleParentsGrouped.
 */
const getAxisChartData = async (thisChart: any): Promise<[any[], any[]]> => {
  const x_axis       = parseAxisJson(thisChart.x_axis)
  const y_axis       = parseAxisJson(thisChart.y_axis)
  const series_field = parseAxisJson(thisChart.series_field)
  const { card_model, time_field, metric_fields, filters, ignore_empty, type } = thisChart
  const chartType = Number(type)

  // Build payload — per-type controller handles missing fields gracefully
  const payload: any = {
    chart_type:   chartType,
    model:        card_model,
    ignore_empty: ignore_empty !== false,
  }

  if (x_axis?.field)       payload.x_axis = x_axis
  if (y_axis?.aggregation) {
    payload.y_axis = {
      field: y_axis.field || 'id',
      aggregation: y_axis.aggregation,
      label: y_axis.label || y_axis.aggregation,
    }
  }
  if (series_field?.field) payload.series_field = series_field
  if (time_field)          payload.time_field = time_field
  if (Array.isArray(metric_fields) && metric_fields.length) payload.metric_fields = metric_fields

  // Merge stored chart filters with the runtime dashboard location filter
  // Qualify with the model table name to avoid ambiguity when admin JOINs are active
  const locationFilters: any[] = []
  if (filterLevel.value === 'county' && selectedCounties.value?.length) {
    locationFilters.push({ field: card_model + '.county_id', operation: 'in', value: selectedCounties.value })
  } else if (filterLevel.value === 'subcounty' && selectedSubCounties.value?.length) {
    locationFilters.push({ field: card_model + '.subcounty_id', operation: 'in', value: selectedSubCounties.value })
  } else if (filterLevel.value === 'ward' && selectedWards.value?.length) {
    locationFilters.push({ field: card_model + '.ward_id', operation: 'in', value: selectedWards.value })
  }
  const mergedFilters = [...(Array.isArray(filters) ? filters : []), ...locationFilters]
  if (mergedFilters.length) payload.filters = mergedFilters

  const res = await renderChart(payload)
  if (res.meta) {
    chartLiveRenderMetaById.value.set(String(thisChart.id), res.meta)
  } else {
    chartLiveRenderMetaById.value.delete(String(thisChart.id))
  }
  const categories: any[] = Array.isArray(res.categories) ? res.categories : (res.data?.categories ?? [])
  const series: any[]     = Array.isArray(res.series) ? res.series : (res.data?.series ?? [])

  // Pie / donut / treemap (types 3, 10, 11) expect [labels, numericValues] not [labels, [{name,data}]]
  if (chartType === 3 || chartType === 10 || chartType === 11) {
    const data = series[0]?.data ?? []
    return [categories, data.map(Number)]
  }

  // Map chart (type 7): backend returns categories=[min,max], series=[{name,value}]
  if (chartType === 7) {
    return [categories, series]
  }

  return [categories, series]
}

const xgetSummaryMultipleParentsGrouped = async (thisChart: any, preloaded?: any) => {
  try {
    const x_axis = parseAxisJson(thisChart.x_axis)
    const y_axis = parseAxisJson(thisChart.y_axis)
    const chartType = Number(thisChart.type)

    const renderPre = dashboardBundleRenderById.value.get(String(thisChart.id))
    if (renderPre && filterLevel.value === 'national' && shouldUseAxisEndpoint({ ...thisChart, x_axis, y_axis })) {
      const categories = renderPre.categories ?? []
      const series = renderPre.series ?? []
      if (chartType === 3 || chartType === 10 || chartType === 11) {
        const data = series[0]?.data ?? series
        return [categories, Array.isArray(data) ? data.map(Number) : []]
      }
      if (chartType === 7) {
        return [categories, series]
      }
      return [categories, series]
    }

    if (shouldUseAxisEndpoint({ ...thisChart, x_axis, y_axis })) {
      return await getAxisChartData({ ...thisChart, x_axis, y_axis, series_field: parseAxisJson(thisChart.series_field) })
    }

    let amount: any
    if (preloaded && preloaded.Total !== undefined && preloaded.Total !== null) {
      amount = preloaded.Total
    } else {
      const formData = buildChartSummaryFormData(thisChart)
      const response = await getSummarybyFieldFromMultipleIncludes(formData)
      amount = response.Total
    }
    return transformMultipleSummaryTotal(thisChart, amount)
  } catch (err) {
    console.error('xgetSummaryMultipleParentsGrouped:', thisChart?.id, thisChart?.title, err)
    return [[], []]
  }
}

const getSummaryChart = async (thisChart, preloaded?: any) => {
  // Check if this is an indicator chart or entity chart
  if (isInterventionCategory(thisChart.category)) {
    return await getSummaryChartForIndicator(thisChart, preloaded)
  } else {
    return await getSummaryChartForEntity(thisChart)
  }
}

const getSummaryChartForIndicator = async (thisChart, preloaded?: any) => {
  console.log('Processing Indicator chart:', thisChart)
  
  let indicator = thisChart.indicator_id
  if (!indicator && Array.isArray(thisChart.indicators) && thisChart.indicators.length) {
    indicator = thisChart.indicators[0].id
  }
  var indicator_categories = await getIndicatorConfigurations(indicator)
  
  return await getSummaryChartIIntervention(indicator_categories, thisChart, preloaded)
}

const getSummaryChartForEntity = async (thisChart) => {
  console.log('Processing Entity chart:', thisChart)
  
  // Use the existing xgetSummaryMultipleParentsGrouped function for entities
  return await xgetSummaryMultipleParentsGrouped(thisChart)
}

const getSummaryChartIIntervention = async (indicator_categories, thisChart, preloaded?: any) => {
  
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

  else if (filterLevel.value === 'ward') {
    filterFields.push('ward_id')
    filterValues.push(selectedWards.value)
    filterOperators.push('or')
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
    let amount: any
    if (preloaded?.Total !== undefined && preloaded?.Total !== null) {
      amount = preloaded.Total
    } else {
      const response = await getSummarybyFieldFromMultipleIncludes(formData);
      amount = response.Total;
    }
    console.log('Data xcounty -inter', amount)


    let categoryArray = [];
    let seriesData = [];
    amount.forEach(obj => {
      if (!categoryArray.includes(obj.name)) {
        categoryArray.push(obj.name);
      }
    });


 
    const timeKey = getChartTimeFieldKey(thisChart)

    if (chartType == 5) {
      console.log('Data line chart ', amount)
      // Aggregate by date so one point per date (sum when backend grouped by date + county/etc.)
      const dateSums = {};
      for (const obj of amount) {
        const d = obj[timeKey] != null ? String(obj[timeKey]).trim() : '';
        if (!d) continue;
        const val = getSummaryResultValue(obj, cAggregation, cfield);
        dateSums[d] = (dateSums[d] || 0) + val;
      }
      const sortedDates = Object.keys(dateSums).sort();
      categoryArray = sortedDates;
      seriesData = sortedDates.map((d) => dateSums[d]);
    }

   

 
    else if (chartType == 6 ) {
      console.log('Multi-line chart ', amount)
      // Aggregate by series and date (sum when backend returned multiple rows per date)
      const bySeriesAndDate = {};
      for (const item of amount) {
        const d = item[timeKey] != null ? String(item[timeKey]).trim() : '';
        if (!d) continue;
        const seriesName = item[cfield];
        if (!bySeriesAndDate[seriesName]) bySeriesAndDate[seriesName] = {};
        const val = getSummaryResultValue(item, cAggregation, cfield);
        bySeriesAndDate[seriesName][d] = (bySeriesAndDate[seriesName][d] || 0) + val;
      }
      const dates = [...new Set(amount.map((item) => item[timeKey]).filter((v) => v != null && v !== ''))].sort();
      const result = {};
      for (const seriesName of Object.keys(bySeriesAndDate)) {
        result[seriesName] = {
          name: seriesName,
          type: 'line',
          stack: 'Total',
          data: dates.map((d, i) => [i, bySeriesAndDate[seriesName][d] || 0])
        };
      }
      seriesData = Object.values(result);
      categoryArray = dates;
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
 
 
  // Phase 1: add all cards immediately with loading state
  res.data.forEach((arrayItem) => {
    const cardSymbol = arrayItem.computation === 'proportion' ? '%' : ''
    const existingCardIndex = cards.value.findIndex(c => c.id === arrayItem.id)
    if (existingCardIndex === -1) {
      cards.value.push({ ...arrayItem, value: undefined, symbol: cardSymbol })
    } else {
      cards.value[existingCardIndex].value = undefined
      cards.value[existingCardIndex].symbol = cardSymbol
    }
  })
  cards.value.sort((a, b) => a.id - b.id)

  // Phase 2: fetch all summaries in parallel (10s timeout per card)
  await Promise.all(res.data.map(async (arrayItem) => {
    const cardSymbol = arrayItem.computation === 'proportion' ? '%' : ''
    const fetchPromise = isInterventionCategory(arrayItem.category)
      ? getSummaryIfIntervention(arrayItem)
      : getSummary(arrayItem)
    const timeoutPromise = new Promise<number>(resolve => setTimeout(() => resolve(0), 10000))
    try {
      const crd = await Promise.race([fetchPromise, timeoutPromise])
      const cardIndex = cards.value.findIndex(c => c.id === arrayItem.id)
      if (cardIndex !== -1) {
        cards.value[cardIndex].value = (crd !== null && crd !== undefined) ? crd : 0
        cards.value[cardIndex].symbol = cardSymbol
        cards.value.sort((a, b) => a.id - b.id)
      }
    } catch (error) {
      console.error('Error loading card:', arrayItem.id, error)
      const cardIndex = cards.value.findIndex(c => c.id === arrayItem.id)
      if (cardIndex !== -1) {
        cards.value[cardIndex].value = 0
        cards.value[cardIndex].symbol = cardSymbol
        cards.value.sort((a, b) => a.id - b.id)
      }
    }
  }))



  // cards.value.sort((a, b) => a.id - b.id);
  // console.log('Sorted',   cards.value)
}

const getCards = async () => {
  try {
    cardLoading.value = true
    await getCardData()
  } catch (error) {
    console.error('Error loading cards:', error)
  } finally {
    cardLoading.value = false
  }
}




///// ----------------Process sections and charts---------------------------------------
////-----------------------------------------------------------------------------------


const getCharts = async (
  section_id,
  bundleOpts: {
    chartDefinitions?: any[]
    summaryByChartId?: Map<string, any>
  } = {},
) => {
  try {
    chartsLoading.value = true
    const { chartDefinitions = null, summaryByChartId: injectedSummary = null } = bundleOpts
    const bundleGroupByChartId = dashboardBundleGroupById.value

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
    const response = chartDefinitions
      ? { data: chartDefinitions }
      : await getSettlementListByCounty(formData);
    //  const charts = response.data;
    console.log('Getting the charts ', response.data)

    const summaryByChartId = injectedSummary ?? new Map<string, any>()
    if (!injectedSummary) {
    try {
      const forBatch = response.data.filter(
        (c: any) =>
          c.category === 'Status' &&
          Number(c.type) !== 8 &&
          c.card_model &&
          !shouldUseAxisEndpoint(c) &&
          (parseAxisJson(c.x_axis)?.field ||
            parseAxisJson(c.y_axis)?.aggregation ||
            (Number(c.type) === 12 &&
              Array.isArray(c.metric_fields) &&
              c.metric_fields.length > 0)),
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
    }

    const processPromises = response.data.map(async (thisChart) => {
      if (!Array.isArray(thisChart.indicators)) {
        thisChart.indicators = []
      }

      console.log('This Chart:', thisChart)

      const filterLabel = getActiveFilterLabel()
      const subtitleText = filterLabel ? `${filterLabel} |` : ''
      const sourceText = `Source: National Geodatabase of Slums, ${new Date().getFullYear()}`
      const subtitleWithSource = `${subtitleText}\n${sourceText}`
      const chartTitle = resolveGeoChartTitle(thisChart.title, thisChart)

      // Set initial loading state for this chart
      setChartLoading(thisChart.id, 'Preparing chart...')



       
 

 async function processPieChart() {
  const promises = [async function () {
    console.log('processPieChart:', thisChart.card_model, thisChart.card_model_field, thisChart.aggregation);
    
    // Set loading state for this chart
    setChartLoading(thisChart.id, 'Loading pie chart data...');

    try {
      const cdata = await xgetSummaryMultipleParentsGrouped(thisChart, summaryByChartId.get(String(thisChart.id)));
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
            text: chartTitle
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
            fontSize: dashboardChartTitleSize()
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

      async function processScatterChart() {
        setChartLoading(thisChart.id, 'Loading scatter data...')
        try {
          const cdata = await xgetSummaryMultipleParentsGrouped(thisChart, summaryByChartId.get(String(thisChart.id)))
          const series: any[] = Array.isArray(cdata[1]) ? cdata[1] : []
          const xAxisCfg = parseAxisJson(thisChart.x_axis)
          const yAxisCfg = parseAxisJson(thisChart.y_axis)
          const xLabel = xAxisCfg?.label || xAxisCfg?.field || ''
          const yLabel = yAxisCfg?.label || yAxisCfg?.field || ''
          thisChart.apexSeries = series
          thisChart.chart = {
            ...scatterOptions,
            title:    { ...scatterOptions.title,    text: chartTitle },
            subtitle: { ...scatterOptions.subtitle, text: subtitleWithSource },
            xaxis: {
              ...scatterOptions.xaxis,
              title: { text: xLabel, style: { color: '#909399', fontSize: dashboardChartAxisPx() } },
            },
            yaxis: {
              ...scatterOptions.yaxis,
              title: { text: yLabel, style: { color: '#909399', fontSize: dashboardChartAxisPx() } },
            },
            series,
          }
          if (!series.length || !series[0]?.data?.length) thisChart.chart.noData = { text: 'No data available' }
        } catch (err) {
          console.error('processScatterChart:', thisChart?.id, err)
          thisChart.apexSeries = []
          thisChart.chart = { ...scatterOptions, title: { ...scatterOptions.title, text: chartTitle }, series: [], noData: { text: 'No data available' } }
        }
        charts.push(thisChart)
        setChartLoaded(thisChart.id)
      }

      async function processHeatmapChart() {
        setChartLoading(thisChart.id, 'Loading heatmap data...')
        try {
          const cdata = await xgetSummaryMultipleParentsGrouped(thisChart, summaryByChartId.get(String(thisChart.id)))
          const categories: string[] = Array.isArray(cdata[0]) ? cdata[0] : []
          const rawSeries: any[]     = Array.isArray(cdata[1]) ? cdata[1] : []
          const heatSeries = rawSeries.map((s: any) => ({
            name: s.name,
            data: categories.map((cat: string, i: number) => ({ x: cat, y: s.data[i] ?? 0 })),
          }))
          thisChart.apexSeries = heatSeries
          thisChart.chart = {
            ...heatmapOptions,
            chart: { ...heatmapOptions.chart, height: Math.max(250, 60 + rawSeries.length * 40) },
            title:    { ...heatmapOptions.title,    text: chartTitle },
            subtitle: { ...heatmapOptions.subtitle, text: subtitleWithSource },
            series: heatSeries,
          }
          if (!heatSeries.length) thisChart.chart.noData = { text: 'No data available' }
        } catch (err) {
          console.error('processHeatmapChart:', thisChart?.id, err)
          thisChart.apexSeries = []
          thisChart.chart = { ...heatmapOptions, title: { ...heatmapOptions.title, text: chartTitle }, series: [], noData: { text: 'No data available' } }
        }
        charts.push(thisChart)
        setChartLoaded(thisChart.id)
      }

      async function processGaugeChart() {
        setChartLoading(thisChart.id, 'Loading gauge data...')
        try {
          const renderPre = dashboardBundleRenderById.value.get(String(thisChart.id))
          const cdata = await xgetSummaryMultipleParentsGrouped(thisChart, summaryByChartId.get(String(thisChart.id)))
          const labels: string[] = Array.isArray(cdata[0]) ? cdata[0] : [chartTitle]
          const series: number[] = Array.isArray(cdata[1]) ? cdata[1].map(Number) : [0]
          const liveMeta = chartLiveRenderMetaById.value.get(String(thisChart.id))
          const meta = filterLevel.value === 'national'
            ? (renderPre?.meta ?? liveMeta)
            : (liveMeta ?? renderPre?.meta)
          const tvaSubtitle =
            meta?.targetVsAchieved && meta.total != null
              ? `${Number(meta.value ?? 0).toLocaleString()} / ${Number(meta.total).toLocaleString()} achieved`
              : null
          thisChart.apexSeries = series
          thisChart.chart = {
            ...gaugeOptions,
            title:    { ...gaugeOptions.title,    text: chartTitle },
            subtitle: { ...gaugeOptions.subtitle, text: tvaSubtitle || subtitleWithSource },
            labels,
            series,
          }
        } catch (err) {
          console.error('processGaugeChart:', thisChart?.id, err)
          thisChart.apexSeries = [0]
          thisChart.chart = { ...gaugeOptions, title: { ...gaugeOptions.title, text: chartTitle }, labels: [chartTitle], series: [0] }
        }
        charts.push(thisChart)
        setChartLoaded(thisChart.id)
      }

      async function processTreemapChart() {
        setChartLoading(thisChart.id, 'Loading word map data...')
        try {
          const xField = parseAxisJson(thisChart.x_axis)?.field
          if (!xField || xField === 'id') {
            thisChart.chart = {
              ...treemapOptions,
              title: { ...treemapOptions.title, text: chartTitle },
              subtitle: { ...treemapOptions.subtitle, text: subtitleWithSource },
              series: [{ data: [] }],
              noData: { text: 'Reconfigure: pick a category field (not id)' },
            }
            thisChart.apexSeries = [{ data: [] }]
            charts.push(thisChart)
            setChartLoaded(thisChart.id)
            return
          }

          const cdata = await xgetSummaryMultipleParentsGrouped(thisChart, summaryByChartId.get(String(thisChart.id)))
          const { series: treemapSeries } = buildApexTreemapSeries(cdata)

          thisChart.apexSeries = treemapSeries
          thisChart.chart = {
            ...treemapOptions,
            chart: {
              ...treemapOptions.chart,
              type: 'treemap',
              animations: { enabled: false },
              toolbar: {
                ...(treemapOptions.chart?.toolbar || {}),
                show: true,
                export: { scale: 3, width: 1800 },
              },
            },
            title:    { ...treemapOptions.title,    text: chartTitle },
            subtitle: { ...treemapOptions.subtitle, text: subtitleWithSource },
            plotOptions: {
              ...treemapOptions.plotOptions,
              treemap: {
                ...treemapOptions.plotOptions?.treemap,
                distributed: true,
                enableShades: false,
              },
            },
            legend: { show: false },
            series: treemapSeries,
          }

          if (!treemapSeries[0]?.data?.length) {
            thisChart.chart.noData = { text: 'No data available' }
          }
        } catch (error) {
          console.error('processTreemapChart:', thisChart?.id, error)
          thisChart.apexSeries = [{ data: [] }]
          thisChart.chart = {
            ...treemapOptions,
            title: { ...treemapOptions.title, text: chartTitle },
            series: [{ data: [] }],
            noData: { text: 'No data available' },
          }
        }

        charts.push(thisChart)
        setChartLoaded(thisChart.id)
      }


      // function to process processMultiBarChart charts 
      async function processSimpleBarChart() {
        const promises = [async function () {
          setChartLoading(thisChart.id, 'Loading bar chart data...');
          try {

            var cdata = await xgetSummaryMultipleParentsGrouped(thisChart, summaryByChartId.get(String(thisChart.id)));

            const allCats: any[] = Array.isArray(cdata[0]) ? cdata[0] : []
            const allSeries: any[] = Array.isArray(cdata[1]) ? cdata[1] : []

            // Descending: Apex horizontal bar lists first category at the top
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
            thisChart.chartHeight = getExpandableBarChartHeight(sortedCats.length, false, PAGE)

            const UpdatedBarOptionsMultiple = {
              ...simpleBarChart,
              title: { ...simpleBarChart.title, text: chartTitle },
              subtitle: { ...simpleBarChart.subtitle, text: subtitleWithSource },
              chart: withBarChartExport(simpleBarChart.chart, thisChart.chartHeight, false),
              xaxis: { ...simpleBarChart.xaxis, categories: displayCats },
              series: displaySeries,
            };

            thisChart.chart = UpdatedBarOptionsMultiple;

            if (allCats.length === 0) {
              thisChart.chart.graphic = [{
                type: 'text', left: 'center', top: 'middle',
                style: { text: 'No data available', fill: '#999', fontSize: dashboardChartTitleSize() },
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
        setChartLoading(thisChart.id, 'Loading chart data...')
        try {
          const cdata = await xgetSummaryMultipleParentsGrouped(thisChart, summaryByChartId.get(String(thisChart.id)))

          const allCats: any[]   = Array.isArray(cdata?.[0]) ? cdata[0] : []
          const allSeries: any[] = Array.isArray(cdata?.[1]) ? cdata[1] : []

          // Sort X categories by combined total descending
          const indexed = allCats.map((cat: any, i: number) => ({
            cat,
            total: allSeries.reduce((sum: number, s: any) =>
              sum + (Array.isArray(s?.data) ? (Number(s.data[i]) || 0) : 0), 0),
            idx: i,
          }))
          indexed.sort((a: any, b: any) => b.total - a.total)

          const sortedCats   = indexed.map((x: any) => x.cat)
          const sortedSeries = allSeries.map((s: any) => ({
            name: s?.name ?? 'Series',
            data: Array.isArray(s?.data) ? indexed.map((x: any) => s.data[x.idx]) : [],
          }))

          thisChart.chartDataFull = { categories: sortedCats, series: sortedSeries }
          thisChart.chartExpanded = false
          const PAGE = 10
          const displayCats   = sortedCats.slice(0, PAGE)
          const displaySeries = normalizeApexBarSeries(
            sortedSeries.map((s: any) => ({
              name: s.name,
              data: Array.isArray(s.data) ? s.data.slice(0, PAGE) : [],
            })),
          )
          thisChart.chartHeight = getExpandableBarChartHeight(sortedCats.length, false, PAGE)

          // Use simpleBarChart base (horizontal grouped bars) — same proven path as type 1
          thisChart.apexSeries = displaySeries
          thisChart.chart = {
            ...simpleBarChart,
            title:    { ...simpleBarChart.title,    text: chartTitle },
            subtitle: { ...simpleBarChart.subtitle, text: subtitleWithSource },
            chart:    withBarChartExport(simpleBarChart.chart, thisChart.chartHeight, false),
            xaxis:    { ...simpleBarChart.xaxis, categories: displayCats },
            series:   displaySeries,
          }

          if (allCats.length === 0 || displaySeries.length === 0) {
            thisChart.chart.noData = { text: 'No data available' }
          }
        } catch (error) {
          console.error('processMultiBarChart:', thisChart?.id, error)
        }

        charts.push(thisChart)
        setChartLoaded(thisChart.id)
      }

  
      // function to process processStackedBarChart charts 
      async function processStackedBarChart() {
        const promises = [async function () {
          try {

            var cdata = await xgetSummaryMultipleParentsGrouped(thisChart, summaryByChartId.get(String(thisChart.id))); // first array is the categories // second is the data

            const allCats: any[] = Array.isArray(cdata[0]) ? cdata[0] : []
            const allSeries: any[] = Array.isArray(cdata[1]) ? cdata[1] : []

            thisChart.chartDataFull = { categories: allCats, series: allSeries }
            thisChart.chartExpanded = false
            const PAGE = 10
            const displayCats = allCats.slice(0, PAGE)
            const displaySeries = allSeries.map((s: any) => ({ ...s, data: Array.isArray(s.data) ? s.data.slice(0, PAGE) : s.data }))
            thisChart.chartHeight = getExpandableBarChartHeight(allCats.length, false, PAGE)

            const UpdatedBarOptionsMultiple = {
              ...stackedbarOptions,
              title: { ...stackedbarOptions.title, text: chartTitle },
              subtitle: { ...stackedbarOptions.subtitle, text: subtitleWithSource },
              chart: withBarChartExport(stackedbarOptions.chart, thisChart.chartHeight, false),
              xaxis: { ...stackedbarOptions.xaxis, categories: displayCats },
              series: displaySeries
            };

            thisChart.chart = UpdatedBarOptionsMultiple

            if (allCats.length === 0) {
              thisChart.chart.graphic = [{
                type: 'text', left: 'center', top: 'middle',
                style: { text: 'No data  available', fill: '#999', fontSize: dashboardChartTitleSize() },
                z: 100
              }]
            }

          } catch (error) {
            // Handle any errors that occurred during the process
          }
        }];

        await promises[0]();

        charts.push(thisChart)
        setChartLoaded(thisChart.id); // Mark chart as loaded
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
            thisChart.chartHeight = getExpandableBarChartHeight(sortedCats.length, false, PAGE)

            const UpdatedBarOptionsMultiple = {
              ...stackedbarOptionsAbs,
              title: { ...stackedbarOptionsAbs.title, text: chartTitle },
              subtitle: { ...stackedbarOptionsAbs.subtitle, text: subtitleWithSource },
              chart: withBarChartExport(stackedbarOptionsAbs.chart, thisChart.chartHeight, false),
              xaxis: { ...stackedbarOptionsAbs.xaxis, categories: displayCats },
              series: displaySeries
            };

            thisChart.chart = UpdatedBarOptionsMultiple

            if (allCats.length === 0) {
              thisChart.chart.graphic = [{
                type: 'text', left: 'center', top: 'middle',
                style: { text: 'No data  available', fill: '#999', fontSize: dashboardChartTitleSize() },
                z: 100
              }]
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
      async function processMultiVariableLineChart() {
        setChartLoading(thisChart.id, 'Loading multi-line chart data...')
        try {
          const cdata = await xgetSummaryMultipleParentsGrouped(thisChart, summaryByChartId.get(String(thisChart.id)))
          const { categories, series } = buildApexLineSeries(cdata, 'Series')
          const dualAxis = detectDualAxis(series)

          const apexSeries = series.map((s, index) => ({
            name: s.name,
            data: s.data,
            ...(dualAxis && index > 0 ? { yAxisIndex: 1 } : {}),
          }))

          thisChart.apexSeries = apexSeries
          thisChart.chart = {
            ...lineOptions,
            title:    { ...lineOptions.title,    text: chartTitle },
            subtitle: { ...lineOptions.subtitle, text: subtitleWithSource },
            xaxis:    { ...lineOptions.xaxis, categories },
            yaxis: dualAxis
              ? [
                  { ...lineOptions.yaxis, title: { text: series[0]?.name || '' } },
                  {
                    opposite: true,
                    title: { text: series[1]?.name || '' },
                    labels: { style: { colors: undefined } },
                  },
                ]
              : lineOptions.yaxis,
            series: apexSeries,
          }

          if (!categories.length || !series.length || series.every((s) => !s.data.length)) {
            thisChart.chart.noData = { text: 'No data available' }
          }
        } catch (error) {
          console.error('processMultiVariableLineChart:', thisChart?.id, error)
        }

        charts.push(thisChart)
        setChartLoaded(thisChart.id)
      }

      async function processLineChart() {
        setChartLoading(thisChart.id, 'Loading line chart data...')
        try {
          const cdata = await xgetSummaryMultipleParentsGrouped(thisChart, summaryByChartId.get(String(thisChart.id)))
          const fallbackName = parseAxisJson(thisChart.y_axis)?.label || 'Series'
          const { categories, series: apexSeries } = buildApexLineSeries(cdata, fallbackName)

          thisChart.apexSeries = apexSeries
          thisChart.chart = {
            ...lineOptions,
            title:    { ...lineOptions.title,    text: chartTitle },
            subtitle: { ...lineOptions.subtitle, text: subtitleWithSource },
            xaxis:    { ...lineOptions.xaxis, categories },
            series:   apexSeries,
          }

          if (!categories.length || !apexSeries.length || apexSeries.every((s) => !s.data.length)) {
            thisChart.chart.noData = { text: 'No data available' }
          }
        } catch (error) {
          console.error('processLineChart:', thisChart?.id, error)
        }

        charts.push(thisChart)
        setChartLoaded(thisChart.id)
      }
      // function to process processMultiBarChart charts 
      async function processStackLineChart() {
        const promises = [async function () {
          console.log('This chart details:', thisChart.card_model, thisChart.card_model_field, thisChart.aggregation);

          try {

            var cdata = await xgetSummaryMultipleParentsGrouped(thisChart, summaryByChartId.get(String(thisChart.id)));
            var categories = Array.isArray(cdata?.[0]) ? cdata[0] : [];
            var seriesData = Array.isArray(cdata?.[1]) ? cdata[1] : [];
            console.log('Multi[e]', cdata);

            // sort and sanitize: each series has .data = [[x,y], ...]; filter nulls and sort
            seriesData.forEach((obj) => {
              if (obj && Array.isArray(obj.data)) {
                obj.data = obj.data
                  .filter((p) => p != null && Array.isArray(p) && p.length >= 2)
                  .map((p) => [Number(p[0]) || 0, Number(p[1]) ?? 0]);
                obj.data.sort((a, b) => a[0] - b[0]);
              }
            });

            const UpdatedBarOptionsMultiple = {
              ...stacklineOptions,
              title: {
                ...stacklineOptions.title,
                text: chartTitle
              },
              subtitle: {
                ...stacklineOptions.subtitle,
                text: subtitleWithSource
              },
              xAxis: {
                ...stacklineOptions.xAxis,
                data: categories
              },

            };
            UpdatedBarOptionsMultiple.series = seriesData;


            console.log("old chart", stacklineOptions)
            console.log("New chart", UpdatedBarOptionsMultiple)

            thisChart.chart = UpdatedBarOptionsMultiple

            // show no data
            if (seriesData.length === 0) {
              thisChart.chart.graphic = [{
                type: 'text',
                left: 'center',
                top: 'middle',
                style: {
                  text: 'No data  available',
                  fill: '#999',
                  fontSize: dashboardChartTitleSize()
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
          console.log('This  map chart details:', thisChart.card_model, thisChart.card_model_field, thisChart.aggregation);

          try {

            const cdata = await xgetSummaryMultipleParentsGrouped(thisChart, summaryByChartId.get(String(thisChart.id))); // first array is the categories // second is the data
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
                  fontSize: dashboardChartTitleEmphasisSize(),
                  fontWeight: 600,
                },
              })
            }

            const UpdatedMapOtions = {
              ...mapChartOptions,
              title: {
                ...mapChartOptions.title,
                text: chartTitle,
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
                  name: chartTitle,
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
            };
            // sort the data such that the graphs start and end proper

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
            else if (filterLevel.value === 'ward') {
              filterFields.push('ward_id')
              filterValues.push([selectedWards.value])
            }

            else if (filterLevel.value === 'national') {


            }

            // Asccoiated models 
            formData.assoc_model = []
            formData.summaryFields = fields
            formData.groupField = 'gender'

            formData.filters = filterFields
            formData.filterValues = filterValues


 

            await (bundleGroupByChartId.has(String(thisChart.id))
              ? Promise.resolve({ Total: bundleGroupByChartId.get(String(thisChart.id))!.Total })
              : getSummaryGroupByMultipleFields(formData))
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
                            text: chartTitle      // replace "Mauritius population pyramid 2011"
                          },
                          subtitle: {
                            ...(pyramidOptions.chartOptions.subtitle || {}),
                            text: subtitleWithSource
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
            var cdata = await getSummaryChart(thisChart, summaryByChartId.get(String(thisChart.id)))   // first array is the categories // second is the data
            console.log('PIEx', cdata[1])

            const UpdatedPieOptionsMultiple = {
              ...pieOptions,
              title: {
                ...pieOptions.title,
                text: chartTitle
              },
              subtitle: {
                ...pieOptions.subtitle,
                text: subtitleWithSource
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
              fontSize: dashboardChartTitleSize()
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
        const applyBarData = (cdata: any) => {
          const UpdatedBarOptionsMultiple = {
            ...simpleBarChart,
            title: {
              ...simpleBarChart.title,
              text: chartTitle
            },
            subtitle: {
              ...simpleBarChart.subtitle,
              text: subtitleWithSource
            },
            xaxis: {
              ...simpleBarChart.xaxis,
              categories: cdata[0]
            },
          }

          thisChart.chart = UpdatedBarOptionsMultiple
          thisChart.chart.series = cdata[1]

          if (cdata[1].length === 0) {
            thisChart.chart.graphic = [{
              type: 'text',
              left: 'center',
              top: 'middle',
              style: {
                text: 'No data  available',
                fill: '#999',
                fontSize: dashboardChartTitleSize()
              },
              z: 100
            }]
          }
        }

        const indicators = Array.isArray(thisChart.indicators) ? thisChart.indicators : []
        const preloaded = summaryByChartId.get(String(thisChart.id))

        if (indicators.length === 0) {
          if (preloaded) {
            try {
              setChartLoading(thisChart.id, 'Loading bar chart data...')
              const cdata = await getSummaryChartIIntervention([], thisChart, preloaded)
              applyBarData(cdata)
            } catch (error) {
              console.error('processSimpleBarChart2 (bundle):', thisChart?.id, error)
            }
          }
          charts.push(thisChart)
          setChartLoaded(thisChart.id)
          return
        }

        const promises = indicators.map(async function (indicator) {
          console.log('processSimpleBarChart2:', indicator)

          try {
            var ids = await getIndicatorConfigurations(indicator.id)
            console.log("bar", ids)
            var cdata = await getSummaryChartIIntervention(ids, thisChart, preloaded)
            console.log('x-cdata',cdata)
            applyBarData(cdata)
          } catch (error) {
            console.error('processSimpleBarChart2:', thisChart?.id, error)
          }
        })

        await Promise.all(promises)
        charts.push(thisChart)
        setChartLoaded(thisChart.id)
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
            var cdata = await getSummaryChartIIntervention(ids, thisChart, summaryByChartId.get(String(thisChart.id)))   // first array is the categories // second is the data
            console.log(cdata)

            const UpdatedBarOptionsMultiple = {
              ...multipleBarChart,
              title: {
                ...multipleBarChart.title,
                text: chartTitle
              },
              subtitle: {
                ...multipleBarChart.subtitle,
                text: subtitleWithSource
              },
              xaxis: {
                ...multipleBarChart.xaxis,
                categories: cdata[0],
              },
              series: cdata[1],
            }

            // show no data 
            if (cdata[0].length===0) {
              thisChart.chart.graphic= [{
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
              text: 'No data  available',
              fill: '#999',
              fontSize: dashboardChartTitleSize()
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
            var cdata = await getSummaryChartIIntervention(ids, thisChart, summaryByChartId.get(String(thisChart.id)))   // first array is the categories // second is the data
            console.log(cdata)

            const UpdatedBarOptionsMultiple = {
              ...barMaleFemaleOptions,
              title: {
                ...barMaleFemaleOptions.title,
                text: chartTitle
              },
              subtitle: {
                ...barMaleFemaleOptions.subtitle,
                text: subtitleWithSource
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
              fontSize: dashboardChartTitleSize()
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
            var ids = await getIndicatorConfigurations(indicator.id)
            console.log("line-IDS", ids)
            var cdata = await getSummaryChartIIntervention(ids, thisChart, summaryByChartId.get(String(thisChart.id)))
            var categories = Array.isArray(cdata?.[0]) ? cdata[0] : [];
            var seriesData = Array.isArray(cdata?.[1]) ? cdata[1] : [];
            var safeData = seriesData.map((v) => (v != null && !Number.isNaN(Number(v)) ? Number(v) : 0));
            console.log('lichecrt data', cdata)

            const UpdatedBarOptionsMultiple = {
              ...lineOptions,
              title: {
                ...lineOptions.title,
                text: chartTitle
              },
              subtitle: {
                ...lineOptions.subtitle,
                text: subtitleWithSource
              },
              xaxis: {
                ...lineOptions.xaxis,
                categories
              },
              series: [
                {
                  ...lineOptions.series[0],
                  name: thisChart.card_model_field || 'Series',
                  data: safeData
                }
              ],
            };


            thisChart.chart = UpdatedBarOptionsMultiple

            // show no data
            if (safeData.length === 0) {
              thisChart.chart.graphic = [{
                type: 'text',
                left: 'center',
                top: 'middle',
                style: {
                  text: 'No data  available',
                  fill: '#999',
                  fontSize: dashboardChartTitleSize()
                },
                z: 100
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
            var ids = await getIndicatorConfigurations(indicator.id)
            console.log("line-IDS", ids)
            var cdata = await getSummaryChartIIntervention(ids, thisChart, summaryByChartId.get(String(thisChart.id)))
            var categories = Array.isArray(cdata?.[0]) ? cdata[0] : [];
            var seriesData = Array.isArray(cdata?.[1]) ? cdata[1] : [];
            console.log('lichecrt data', cdata);

            // sort and sanitize nested data
            seriesData.forEach((obj) => {
              if (obj && Array.isArray(obj.data)) {
                obj.data = obj.data
                  .filter((p) => p != null && Array.isArray(p) && p.length >= 2)
                  .map((p) => [Number(p[0]) || 0, Number(p[1]) ?? 0]);
                obj.data.sort((a, b) => a[0] - b[0]);
              }
            });

            const UpdatedBarOptionsMultiple = {
              ...stacklineOptions,
              title: {
                ...stacklineOptions.title,
                text: chartTitle
              },
              subtitle: {
                ...stacklineOptions.subtitle,
                text: subtitleWithSource
              },
              xAxis: {
                ...stacklineOptions.xAxis,
                data: categories
              },

            };
            UpdatedBarOptionsMultiple.series = seriesData;


            console.log("old chart", stacklineOptions)
            console.log("New chart", UpdatedBarOptionsMultiple)

            thisChart.chart = UpdatedBarOptionsMultiple

            // show no data
            if (seriesData.length === 0) {
              thisChart.chart.graphic= [{
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
              text: 'No data  available',
              fill: '#999',
              fontSize: dashboardChartTitleSize()
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
          console.log('This processMapChart2:', indicator)

          try {
            //  console.log("bar", getIndicatorConfigurations(indicator.id)) 
            //  get the indicator configruation IDS for the indicators in this chart. These could be 1 or more 
            var ids = await getIndicatorConfigurations(indicator.id)
            console.log("line-IDS", ids)
            const cdata = await getSummaryChartIIntervention(ids, thisChart, summaryByChartId.get(String(thisChart.id)))   // first array is the categories // second is the data
            console.log('map data raw (intervention)', cdata)
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
            
            console.log('filterLevel 0002', currentFilterLevel)
            console.log('selectedCounties 0002', currentSelectedCounties)
            console.log('selectedSubCounties 0002', currentSelectedSubCounties)
            
            let geoToUse = null;
            let mapName = 'KE_county'; // default: national counties
            
            if (currentSelectedCounties.length > 0 && currentFilterLevel === 'county') {
              // Counties selected -> show subcounties within those counties
              console.log('About to call getSubsetGeo for subcounty (intervention)...')
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
              console.log('About to call getSubsetGeo for ward (intervention)...')
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
            let geoNameProperty2 = 'name';
            if (geoToUse && geoToUse.features && geoToUse.features[0]?.properties) {
              const props = geoToUse.features[0].properties;
              if (props.name !== undefined) geoNameProperty2 = 'name';
              else if (props.NAME !== undefined) geoNameProperty2 = 'NAME';
              else if (props.Name !== undefined) geoNameProperty2 = 'Name';
              else {
                const firstStringKey = Object.keys(props).find(k => typeof props[k] === 'string');
                if (firstStringKey) geoNameProperty2 = firstStringKey;
              }
              console.log('🗺️ [map2] Detected geoNameProperty:', geoNameProperty2, '| First feature props:', props);
            }

            // Register the appropriate geo with a specific name
            if (geoToUse && geoToUse.features) {
              registerMap(mapName, geoToUse);
              console.log(`✅ Map registered: ${mapName}`, geoToUse.features.length, 'features');
            }

            console.log('apsect 0001',aspect.value)

            const mapSeriesBase2 = (mapChartOptions.series?.[0] ?? {}) as Record<string, unknown>
            const isMapEmpty2 = mapData.length === 0

            const sourceFooterGraphic2 = {
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

            const graphicList2: unknown[] = [sourceFooterGraphic2]
            if (isMapEmpty2) {
              graphicList2.unshift({
                type: 'text' as const,
                left: 'center' as const,
                top: 'middle' as const,
                z: 3000,
                zlevel: 20,
                style: {
                  text: 'No data available',
                  fill: mapChartNoDataFill(),
                  fontSize: dashboardChartTitleEmphasisSize(),
                  fontWeight: 600,
                },
              })
            }

            const UpdatedMapOtions = {
              ...mapChartOptions,
              title: {
                ...mapChartOptions.title,
                text: chartTitle,
                subtext: subtitleWithSource,
                left: 'right',
              },
              graphic: graphicList2,
              visualMap: isMapEmpty2
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
                  ...mapSeriesBase2,
                  name: chartTitle,
                  map: mapName,
                  nameProperty: geoNameProperty2,
                  aspectScale: aspect.value,
                  data: mapData,
                  ...(isMapEmpty2
                    ? {
                        itemStyle: {
                          ...(mapSeriesBase2.itemStyle as Record<string, unknown>),
                          areaColor: mapChartNoDataAreaColor(),
                        },
                      }
                    : {}),
                },
              ],
            };
            // sort the data such that the graphs start and end proper
            console.log('UpdatedMapOtions [map2]', UpdatedMapOtions)
            thisChart.chart = UpdatedMapOtions

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

      else if (thisChart.type == 11 && thisChart.category=="Status") {
        await processTreemapChart();
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

      else if (thisChart.type == 12 && thisChart.category=="Status") {
        await processMultiVariableLineChart();
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

      else if (thisChart.type == 13 && thisChart.category=="Status") {
        await processScatterChart();
      }

      else if (thisChart.type == 14 && thisChart.category=="Status") {
        await processHeatmapChart();
      }

      else if (thisChart.type == 15 && thisChart.category=="Status") {
        await processGaugeChart();
      }


      // For Interventions

      if (thisChart.type == 1 && isInterventionCategory(thisChart.category)  ) {
        console.log('processSimpleBarChart')
        await processSimpleBarChart2()
      }

      else if (thisChart.type == 2 && isInterventionCategory(thisChart.category)) {
        await processMultiBarChart2();
      }

      else if ((thisChart.type == 3 || thisChart.type == 10 )&& isInterventionCategory(thisChart.category)) {
        await processPieChart2();
      }

      else if (thisChart.type == 11 && isInterventionCategory(thisChart.category)) {
        await processTreemapChart();
      }

      else if (thisChart.type == 4 && isInterventionCategory(thisChart.category)) {
        await processStackedBarChart2();
      }

      else if (thisChart.type == 5 && isInterventionCategory(thisChart.category)) {
        await processLineChart2();
      }

      else if (thisChart.type == 6 && isInterventionCategory(thisChart.category)) {
        await processStackLineChart2();
      }

      else if (thisChart.type == 7 && isInterventionCategory(thisChart.category)) {
        await processMapChart2();
      }

      else if (thisChart.type == 8 && isInterventionCategory(thisChart.category)) {
        await processPyramid();
      }

      else if (thisChart.type == 13 && isInterventionCategory(thisChart.category)) {
        await processScatterChart();
      }

      else if (thisChart.type == 14 && isInterventionCategory(thisChart.category)) {
        await processHeatmapChart();
      }

      else if (thisChart.type == 15 && isInterventionCategory(thisChart.category)) {
        await processGaugeChart();
      }

    })

    await Promise.all(processPromises)

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
        tab.id = arrayItem.id;
        tab.label = arrayItem.title;
        tab.name = arrayItem.title;
        tab.charts = await getCharts(arrayItem.id);
        return tab;
      });

      tabs.value = await Promise.all(promises);
      tabs.value.sort((a, b) => a.id - b.id);
      console.log('sections', tabs.value);
      activeTab.value = tabs.value[0] ? tabs.value[0].name : ''
      console.log('activeTab', activeTab.value);

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


function getGeoGroupLevel(): 'county' | 'subcounty' | 'ward' | null {
  if (filterLevel.value === 'national') return 'county'
  if (filterLevel.value === 'county') return 'subcounty'
  if (filterLevel.value === 'subcounty') return 'ward'
  return null
}

/** Whether chart data is grouped by the active admin level (not a fixed category axis). */
function chartUsesLocationGrouping(chart: any): boolean {
  const chartType = Number(chart.type)
  const x_axis = parseAxisJson(chart.x_axis)
  const isTimeSeries = chartType === 5 || chartType === 6 || chartType === 12
  if (isTimeSeries || chartType === 8 || chartType === 15) return false
  if (chartType === 3 || chartType === 10 || chartType === 11) {
    const slice = x_axis?.field || ''
    if (!slice || slice === 'county.name') return chart.category === 'Intervention'
    return false
  }
  const nonGeoAxis = ['project.status', 'component.title', 'location_type', 'project.region']
  if (x_axis?.field && nonGeoAxis.includes(x_axis.field)) return false
  if (x_axis?.field === 'county.name') return true
  if (chart.category === 'Intervention') return true
  if (chart.category === 'Status' && !x_axis?.field) return true
  if (chartType === 7 || chartType === 14) return true
  return false
}

/**
 * Derive chart title for the current dashboard filter level.
 * National → "by county"; county filter → "by subcounty"; subcounty filter → "by ward".
 */
function resolveGeoChartTitle(title: string, chart?: any): string {
  if (!title || typeof title !== 'string') return title ?? ''
  const group = getGeoGroupLevel()
  let result = title

  const replaceGeoPhrases = (target: 'county' | 'subcounty' | 'ward') => {
    const by = `by ${target}`
    result = result
      .replace(/\bby (county|subcounty|ward)\b/gi, by)
      .replace(/\bCounty ×/gi, `${target.charAt(0).toUpperCase()}${target.slice(1)} ×`)
      .replace(/\b(county|subcounty|ward) and\b/gi, `${target} and`)
      .replace(/\bgrouped by (county|subcounty|ward)\b/gi, `grouped by ${target}`)
      .replace(/\bshaded by (county|subcounty|ward)\b/gi, `shaded by ${target}`)
  }

  if (/\bby (county|subcounty|ward)\b/i.test(result)
    || /\bCounty ×/i.test(result)
    || /\b(county|subcounty|ward) and\b/i.test(result)) {
    if (group === 'county') {
      replaceGeoPhrases('county')
    } else if (group === 'subcounty') {
      replaceGeoPhrases('subcounty')
    } else if (group === 'ward') {
      replaceGeoPhrases('ward')
    } else {
      result = result
        .replace(/\s*by (county|subcounty|ward)\b/gi, '')
        .replace(/\s*(County|Subcounty|Ward) ×/gi, '')
        .replace(/\s*(county|subcounty|ward) and\b/gi, ' and')
    }
  } else if (group && group !== 'county' && chart && chartUsesLocationGrouping(chart)) {
    result = `${result} by ${group}`
  }

  return result.replace(/\s+/g, ' ').trim()
}

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

/** Locality line for KPI cards — mirrors chart subtitles (county / constituency names). */
const statisticsCardFilterContext = computed(() => getActiveFilterLabel())

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


function hydrateDashboardBundleMaps(bundle: DashboardBundle) {
  dashboardBundleRenderById.value = new Map()
  dashboardBundleGroupById.value = new Map()
  for (const section of bundle.sections || []) {
    for (const chart of section.charts || []) {
      const bd = chart.bundleData
      if (!bd) continue
      if (bd.kind === 'render') {
        dashboardBundleRenderById.value.set(String(chart.id), {
          categories: bd.categories ?? [],
          series: bd.series ?? [],
          meta: bd.meta ?? null,
        })
      } else if (bd.kind === 'group') {
        dashboardBundleGroupById.value.set(String(chart.id), { Total: bd.Total })
      }
    }
  }
}

async function tryLoadDashboardBundle(): Promise<boolean> {
  if (filterLevel.value !== 'national' || !dashboard_id.value) return false
  try {
    const bundle = await getDashboardBundle(dashboard_id.value)
    if (bundle.code !== '0000' || !bundle.dashboardId) return false
    if (Number(bundle.dashboardId) !== Number(dashboard_id.value)) return false
    dashboardBundleActive.value = true
    dashboardBundlePayload.value = bundle
    hydrateDashboardBundleMaps(bundle)
    return true
  } catch {
    dashboardBundleActive.value = false
    dashboardBundlePayload.value = null
    return false
  }
}

async function applyDashboardBundleCards() {
  const bundle = dashboardBundlePayload.value
  if (!bundle) return
  cardLoading.value = true
  cards.value = bundle.cards.map((c) => ({
    ...c,
    symbol: c.computation === 'proportion' ? '%' : '',
  }))
  cards.value.sort((a, b) => a.id - b.id)
  cardLoading.value = false
}

async function applyDashboardBundleTabs() {
  const bundle = dashboardBundlePayload.value
  if (!bundle) return
  chartsLoading.value = true
  const summaryByChartId = new Map<string, any>()
  for (const section of bundle.sections) {
    for (const chart of section.charts) {
      const bd = chart.bundleData
      if (bd?.kind === 'summary' && bd.Total !== undefined) {
        summaryByChartId.set(String(chart.id), { Total: bd.Total })
      }
    }
  }

  const tabPromises = bundle.sections.map(async (section) => ({
    id: section.id,
    label: section.title,
    name: section.title,
    charts: await getCharts(section.id, {
      chartDefinitions: section.charts,
      summaryByChartId,
    }),
  }))
  tabs.value = await Promise.all(tabPromises)
  tabs.value.sort((a, b) => a.id - b.id)
  activeTab.value = tabs.value[0] ? tabs.value[0].name : ''
  chartsLoading.value = false
}

const dashboardLastUpdatedLabel = computed(() => {
  if (!dashboardBundleActive.value || !dashboardBundlePayload.value?.builtAt) return ''
  try {
    return new Date(dashboardBundlePayload.value.builtAt).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return ''
  }
})

// Initialize dashboard with proper loading states
const initializeDashboard = async () => {
  try {
    dashboardLoading.value = true
    loading.value = true

    const geoBundlePromise = ensureDashboardGeoBundleLoaded()
    
    await Promise.all([getCountySubcountySep(), geoBundlePromise])

    const usedBundle = await tryLoadDashboardBundle()
    if (usedBundle) {
      await Promise.all([applyDashboardBundleCards(), applyDashboardBundleTabs()])
      console.log('Dashboard initialized from bundle')
      return
    }

    await Promise.all([
      getCards(),
      getTabs()
    ])
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
  selectSubCounty.value = []
  selectCounty.value = []
  selectedSubCounties.value = []
  selectedCounties.value = []
  filteredSubCountyList.value = [...subCountyList.value]
  filterLevel.value = 'national'

  dashboardBundleActive.value = false
  dashboardBundlePayload.value = null
  dashboardBundleRenderById.value = new Map()
  dashboardBundleGroupById.value = new Map()
  chartLiveRenderMetaById.value = new Map()
  cardLoading.value = true
  chartsLoading.value = true
  try {
    if (await tryLoadDashboardBundle()) {
      await Promise.all([applyDashboardBundleCards(), applyDashboardBundleTabs()])
    } else {
      await Promise.all([getCards(), getTabs()])
    }
  } catch (error) {
    console.error('Error in handleClear:', error)
  } finally {
    cardLoading.value = false
    chartsLoading.value = false
  }
}


const filterCounty = async (county_id) => {
  if (!county_id || county_id.length === 0) {
    filteredSubCountyList.value = [...subCountyList.value]
  } else {
    filteredSubCountyList.value = subCountyList.value.filter((option) =>
      county_id.includes(option.county_id),
    )
  }
  const validIds = new Set(filteredSubCountyList.value.map((o: any) => o.value))
  selectSubCounty.value = (selectSubCounty.value || []).filter((id: any) => validIds.has(id))

  selectedCounties.value = county_id || []
  if (selectedCounties.value.length == 0) {
    filterLevel.value = 'national'
  } else {
    filterLevel.value = 'county'
  }
  dashboardBundleActive.value = false
  dashboardBundlePayload.value = null
  dashboardBundleRenderById.value = new Map()
  dashboardBundleGroupById.value = new Map()
  chartLiveRenderMetaById.value = new Map()
  cardLoading.value = true
  chartsLoading.value = true
  try {
    if (filterLevel.value === 'national' && (await tryLoadDashboardBundle())) {
      await Promise.all([applyDashboardBundleCards(), applyDashboardBundleTabs()])
    } else {
      await Promise.all([
        getCards(),
        getTabs()
      ])
    }
  } catch (error) {
    console.error('Error in filterCounty:', error)
  } finally {
    // Ensure loading states are cleared
    cardLoading.value = false
    chartsLoading.value = false
  }
  console.log('filterLevel.value', selectedCounties.value)
     
}


const filterSubCounty = async (subcountyId) => {
  //selectSubCounty.value=null
 
selectedSubCounties.value = subcountyId;
 
  console.log('selectedSubCounties',selectedSubCounties.value);  // [1]


  if (selectedSubCounties.value.length == 0) {
    filterLevel.value = selectedCounties.value.length ? 'county' : 'national'
  } else {
    filterLevel.value = 'subcounty'
  }
  dashboardBundleActive.value = false
  dashboardBundlePayload.value = null
  dashboardBundleRenderById.value = new Map()
  dashboardBundleGroupById.value = new Map()
  chartLiveRenderMetaById.value = new Map()
  cardLoading.value = true
  chartsLoading.value = true
  try {
    if (filterLevel.value === 'national' && (await tryLoadDashboardBundle())) {
      await Promise.all([applyDashboardBundleCards(), applyDashboardBundleTabs()])
    } else {
      await Promise.all([
        getCards(),
        getTabs()
      ])
    }
  } catch (error) {
    console.error('Error in filterSubCounty:', error)
  } finally {
    // Ensure loading states are cleared
    cardLoading.value = false
    chartsLoading.value = false
  }
}

const dashboardRefreshing = ref(false)

function clearDashboardClientCaches() {
  dashboardBundleActive.value = false
  dashboardBundlePayload.value = null
  dashboardBundleRenderById.value = new Map()
  dashboardBundleGroupById.value = new Map()
  chartLiveRenderMetaById.value = new Map()
  _geoCache.clear()
  _indicatorConfigCache.clear()
}

async function hardRefreshDashboard() {
  if (dashboardRefreshing.value) return

  dashboardRefreshing.value = true
  cardLoading.value = true
  chartsLoading.value = true
  clearDashboardClientCaches()

  try {
    if (filterLevel.value === 'national' && dashboard_id.value) {
      const bundle = await getDashboardBundle(dashboard_id.value, { refresh: true })
      if (bundle.code === '0000' && bundle.dashboardId) {
        dashboardBundleActive.value = true
        dashboardBundlePayload.value = bundle
        hydrateDashboardBundleMaps(bundle)
        await Promise.all([applyDashboardBundleCards(), applyDashboardBundleTabs()])
      } else {
        await Promise.all([getCards(), getTabs()])
      }
    } else {
      await Promise.all([getCards(), getTabs()])
    }
  } catch (error) {
    console.error('Hard refresh failed:', error)
    ElMessage.error('Failed to refresh dashboard data')
  } finally {
    cardLoading.value = false
    chartsLoading.value = false
    dashboardRefreshing.value = false
  }
}

const chartExportApi = useDashboardChartExport({
  tabs,
  activeTab,
  chartsLoading,
  chartLoadingMessages,
  filterLevel,
  selectedCounties,
  selectedSubCounties,
  selectedWards,
  selectCounty,
  selectSubCounty,
  countyList,
  subCountyList,
  filteredSubCountyList,
  statisticsCardFilterContext,
  isChartLoading,
  getCards,
  getTabs,
})

const { setChartComponentRef } = chartExportApi

const formatNumber = formatDashboardNumberCompact

  const STACKED_PAGE = 10

  function getChartColSpan(chart: any) {
    return chart.chartExpanded ? 24 : 12
  }

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
    const height = getExpandableBarChartHeight(categories.length, chart.chartExpanded, STACKED_PAGE)
    chart.chartHeight = height
    const normalized = normalizeApexBarSeries(displaySeries)
    chart.apexSeries = normalized
    chart.chart = {
      ...chart.chart,
      chart: withBarChartExport(chart.chart.chart, height, chart.chartExpanded),
      xaxis: { ...chart.chart.xaxis, categories: displayCats },
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
    const height = getExpandableBarChartHeight(categories.length, chart.chartExpanded, STACKED_PAGE)
    chart.chartHeight = height
    const normalized = normalizeApexBarSeries(displaySeries)
    chart.apexSeries = normalized
    chart.chart = {
      ...chart.chart,
      chart: withBarChartExport(chart.chart.chart, height, chart.chartExpanded),
      xaxis: { ...chart.chart.xaxis, categories: displayCats },
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

      else if ( typeId==10) {
      return 'donut';
    }
    else if (typeId==11) {
      return 'treemap';
    }
    else if (typeId==5 || typeId==12) {
      return 'area';
    }
    else if (typeId==7) {
      return 'map';
    } 
    else if (typeId==8) {
      return 'pyramid';
    }
    else if (typeId==13) {
      return 'scatter';
    }
    else if (typeId==14) {
      return 'heatmap';
    }
    else if (typeId==15) {
      return 'radialBar';
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
  window.addEventListener('toggle-dynamic-state-filters', toggleFilters)
})

onBeforeUnmount(() => {
  window.removeEventListener('toggle-dynamic-state-filters', toggleFilters)
})

</script>

<template>
  <div class="dashboard-container">
    <!-- AI loading overlay -->
    <Transition name="ai-overlay-fade">
      <div v-if="chartsLoading" class="ai-loading-overlay" :style="{ left: appStore.getCollapse ? 'var(--left-menu-min-width)' : 'var(--left-menu-max-width)' }">
        <div class="ai-loading-box">
          <div class="ai-spinner">
            <div class="ai-ring ai-ring-1"></div>
            <div class="ai-ring ai-ring-2"></div>
            <div class="ai-ring ai-ring-3"></div>
            <Icon icon="material-symbols:query-stats" :size="36" class="ai-center-icon" />
          </div>
          <p class="ai-loading-title">
            Analysing {{ statisticsCardFilterContext || 'Kenya' }} data
          </p>
          <p class="ai-loading-wait">Please wait…</p>
          <Transition name="ai-msg-fade" mode="out-in">
            <p :key="aiMsgIndex" class="ai-loading-msg">{{ aiMessages[aiMsgIndex] }}</p>
          </Transition>
          <div class="ai-dots">
            <span v-for="(_, i) in aiMessages" :key="i" :class="['ai-dot', { active: i === aiMsgIndex }]"></span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Filter Drawer -->
    <el-drawer
      v-model="filtersVisible"
      title="Filters"
      direction="rtl"
      size="300px"
      :before-close="handleDrawerClose"
    >
      <div class="filter-panel-content">
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
            placeholder="Select County"
            size="small">
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
            placeholder="Select Constituency"
            size="small">
            <el-option 
              v-for="item in filteredSubCountyList" 
              :key="item.value" 
              :label="item.label" 
              :value="item.value" />
          </el-select>
        </div>

        <div class="filter-panel-actions">
          <el-button @click="cancelFilters" size="small">Cancel</el-button>
          <el-button type="primary" @click="confirmFilters" size="small">Confirm</el-button>
        </div>
      </div>
    </el-drawer>

    <el-row :gutter="16" class="cards-row">
      <!-- Placeholder skeleton cards while loading -->
      <template v-if="cardLoading && cards.length === 0">
        <el-col v-for="n in 4" :key="'card-ph-'+n" :span="24" :xs="24" :sm="12" :md="8" :lg="6">
          <div class="tabs-container">
            <el-card shadow="never" class="stat-card" :body-style="{ padding: '0' }">
              <ElSkeleton animated :loading="true">
                <template #template>
                  <div class="card-skeleton-placeholder">
                    <ElSkeletonItem variant="circle" style="width:56px;height:56px;border-radius:16px;flex-shrink:0" />
                    <div style="flex:1">
                      <ElSkeletonItem variant="h3" style="width:60%;margin-bottom:8px" />
                      <ElSkeletonItem variant="text" style="width:80%" />
                    </div>
                  </div>
                </template>
              </ElSkeleton>
            </el-card>
          </div>
        </el-col>
      </template>
      <el-col v-for="(card) in cards" :key="card.id" :span="24 / cards.length" :xs="24" :sm="12" :md="8" :lg="6">
        <div class="tabs-container">
          <ElSkeleton :loading="cardLoading || card.value === undefined || card.value === null" animated>
            <el-card shadow="hover" class="stat-card" :body-style="{ padding: '0' }">
              <div class="card-content">
                <div class="icon-container" :style="{ backgroundColor: card.iconColor + '15' }">
                  <Icon :icon="card.icon" :size="32" :color="card.iconColor" />
                </div>
                <div class="card-value">
                  <p class="value-text" @click="handleCardClick(card)" role="link" tabindex="0" @keydown.enter="handleCardClick(card)" :title="dashboardNumberTooltip(card.value, card.symbol)">
                    {{ formatNumber(card.value) }}{{ card.symbol }}
                  </p>
                  <p class="value-label" :title="card.title">{{ card.title }}</p>
                  <p
                    v-if="statisticsCardFilterContext"
                    class="stat-card-filter-scope"
                    :title="statisticsCardFilterContext"
                  >
                    {{ statisticsCardFilterContext }}
                  </p>
                </div>
              </div>
            </el-card>
          </ElSkeleton>
        </div>
      </el-col>
    </el-row>

  <!-- Tabs/charts skeleton while loading and no tabs yet -->
  <template v-if="chartsLoading && tabs.length === 0">
    <div class="tabs-skeleton-container">
      <div class="tabs-skeleton-header">
        <ElSkeletonItem v-for="n in 3" :key="'tab-lbl-'+n" variant="text" class="tab-label-skeleton" />
      </div>
      <el-row :gutter="20">
        <el-col v-for="n in 4" :key="'tabs-chart-ph-'+n" :span="12" :md="12" :sm="24" :xs="24">
          <div class="charts-container">
            <el-card class="chart-card">
              <ElSkeleton animated :loading="true">
                <template #template>
                  <div class="chart-skeleton-placeholder">
                    <p class="chart-skeleton-loading-text">Loading charts…</p>
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
  </template>

  <div class="dashboard-tab-actions">
    <el-tooltip content="Refresh data" placement="top">
      <el-button
        class="dashboard-refresh-btn"
        text
        :icon="Refresh"
        :loading="dashboardRefreshing"
        :disabled="dashboardRefreshing"
        @click="hardRefreshDashboard"
      />
    </el-tooltip>
    <DashboardChartExportDrawer
      :export-api="chartExportApi"
      :charts-loading="chartsLoading || dashboardRefreshing"
    />
  </div>

  <div v-show="!chartsLoading || tabs.length > 0" class="tabs-container main-tabs">
    <el-tabs v-model="activeTab" class="dashboard-tabs" tab-position="top">
      <el-tab-pane v-for="(tab) in tabs" :name="tab.name" :key="tab.id" :label="tab.label">
          <el-row :gutter="20">
            <el-col v-if="(!tab.charts || tab.charts.length === 0) && !chartsLoading" :span="24">
              <el-empty description="No charts available for this section" />
            </el-col>
            <template v-if="tab.charts && tab.charts.length > 0">
              <el-col
                v-for="(chart) in tab.charts"
                :key="chart.id"
                :span="getChartColSpan(chart)"
                :xl="getChartColSpan(chart)"
                :lg="getChartColSpan(chart)"
                :md="getChartColSpan(chart)"
                :sm="24"
                :xs="24"
              >
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
                        <div v-if="chart.type==7" :id="`map-container-${chart.id}`" style="width: 100%; height: 400px;">
                          <v-chart
                            :key="`map-${chart.id}-${appStore.getIsDark}-${appStore.getCurrentSize}`"
                            :ref="(el) => setChartComponentRef(chart.id, el)"
                            :id="chart.id"
                            class="chart"
                            :option="chart.chart"
                            style="width: 100%; height: 100%;"
                            autoresize
                          />
                        </div> 
                        <div v-if="chart.type!=7 && chart.type!=8" class="chart-wrapper">
                          <apexchart
                            :key="`apex-${chart.id}-${appStore.getIsDark}-${appStore.getCurrentSize}-${(chart.apexSeries || chart.chart?.series || []).length}`"
                            :ref="(el) => setChartComponentRef(chart.id, el)"
                            :options="chart.chart"
                            :series="Array.isArray(chart.apexSeries) ? chart.apexSeries : (Array.isArray(chart.chart?.series) ? chart.chart.series : [])"
                            :type="getChartType(chart.type)"
                            :height="chart.chartHeight || 350"
                            autoresize
                          />
                          <div
                            v-if="(chart.type == 1 || chart.type == 2 || chart.type == 4 || chart.type == 9) && chart.chartDataFull && chart.chartDataFull.categories.length > 10"
                            class="chart-expand-row"
                          >
                            <el-button text size="small" @click="chart.type == 1 ? toggleSimpleBarExpand(chart) : toggleChartExpand(chart)">
                              {{ chart.chartExpanded ? '↑ Show top 10' : `↓ Show all ${chart.chartDataFull.categories.length}` }}
                            </el-button>
                          </div>
                        </div>
                        <apexchart
                          v-if="chart.type==8"
                          :key="`pyr-${chart.id}-${appStore.getIsDark}-${appStore.getCurrentSize}`"
                          :ref="(el) => setChartComponentRef(chart.id, el)"
                          type="bar"
                          :options="chart.chart.chartOptions"
                          :series="Array.isArray(chart.chart.series) ? chart.chart.series : []"
                          height="350"
                          autoresize
                        />
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
            <el-col v-else-if="chartsLoading" :span="12" :md="12" :sm="24" :xs="24">
              <div class="charts-container">
                <el-card class="chart-card">
                  <ElSkeleton :loading="true" animated>
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

    <p v-if="dashboardLastUpdatedLabel" class="dashboard-last-updated">
      Data as of {{ dashboardLastUpdatedLabel }} · refreshes every 10 min
    </p>
  </div>
 

 
    
</div>
</template>
 
 
<style scoped>
.dashboard-container {
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--top-tool-height) - var(--tags-view-height) - var(--app-content-padding));
  max-height: calc(100vh - var(--top-tool-height) - var(--tags-view-height) - var(--app-content-padding));
  min-height: 0;
  overflow: hidden;
  padding: 0 12px 12px;
  margin-top: -8px;
}

.dashboard-last-updated {
  flex-shrink: 0;
  margin: 4px 2px 0;
  text-align: right;
  font-size: 11px;
  line-height: 1.3;
  color: var(--el-text-color-placeholder);
  opacity: 0.72;
  user-select: none;
}

:deep(.el-loading-mask) {
  transition: opacity 0.3s ease;
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
  margin-top: 0;
  position: relative;
  z-index: 1;
  max-height: 42vh;
  overflow-y: auto;
  overscroll-behavior: contain;
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
  position: relative;
}

.dashboard-tab-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  padding: 2px 4px 0;
  margin-top: 2px;
}

.dashboard-refresh-btn {
  margin: 0;
  padding: 8px;
}

/* Do not set flex-direction on .dashboard-tabs — Element Plus uses column-reverse for tab-position="top". */
.dashboard-tabs {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

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
  color: #606266;
  margin: 8px 0 0 0;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-card-filter-scope {
  color: var(--el-text-color-secondary);
  margin: 6px 0 0 0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

/* App store dark mode (html.dark) — stat card caption + section tab labels */
html.dark .value-label {
  color: #ffffff;
}

html.dark .stat-card-filter-scope {
  color: #a8abb2;
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

.filter-panel-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0;
}

.filter-panel-content .filter-select {
  width: 100%;
}

.filter-panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
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

.card-skeleton-placeholder {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
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

/* ── AI loading overlay ──────────────────────────────────────────────────────── */
.ai-loading-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.ai-loading-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px 48px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
  max-width: 500px;
  text-align: center;
}

.ai-spinner {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid transparent;
  animation: ai-spin linear infinite;
}
.ai-ring-1 { width: 80px; height: 80px; border-top-color: #3b82f6; animation-duration: 1.2s; }
.ai-ring-2 { width: 60px; height: 60px; border-top-color: #60a5fa; border-right-color: #60a5fa; animation-duration: 1.8s; animation-direction: reverse; }
.ai-ring-3 { width: 40px; height: 40px; border-top-color: #93c5fd; animation-duration: 2.4s; }

@keyframes ai-spin { to { transform: rotate(360deg); } }

.ai-center-icon { color: #93c5fd !important; position: relative; z-index: 1; }

.ai-loading-title {
  font-size: 18px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
  letter-spacing: 0.02em;
}

.ai-loading-wait {
  font-size: 12px;
  color: #64748b;
  margin: -8px 0 0;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.ai-loading-msg {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
  min-height: 36px;
  line-height: 1.6;
  max-width: 320px;
}

.ai-dots { display: flex; gap: 6px; margin-top: 4px; }
.ai-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.3);
  transition: background 0.3s, transform 0.3s;
}
.ai-dot.active { background: #3b82f6; transform: scale(1.3); }

.ai-overlay-fade-enter-active { transition: opacity 0.4s ease; }
.ai-overlay-fade-leave-active { transition: opacity 0.6s ease; }
.ai-overlay-fade-enter-from, .ai-overlay-fade-leave-to { opacity: 0; }

.ai-msg-fade-enter-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.ai-msg-fade-leave-active { transition: opacity 0.2s ease; }
.ai-msg-fade-enter-from { opacity: 0; transform: translateY(6px); }
.ai-msg-fade-leave-to   { opacity: 0; }
</style>

