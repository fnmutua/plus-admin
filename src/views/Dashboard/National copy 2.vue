<script setup lang="ts">
import { ref, reactive, onBeforeMount, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { debounce } from 'lodash';
import { ElRow, ElCol, ElCard, ElDivider, ElTabs, ElTabPane, ElSkeleton, ElSelect, ElOption } from 'element-plus';
import { Icon } from '@iconify/vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart, GaugeChart, BarChart, LineChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, ToolboxComponent, GridComponent } from 'echarts/components';
import VChart, { THEME_KEY } from 'vue-echarts';
import VueApexCharts from 'vue3-apexcharts';
import * as turf from '@turf/turf';
import { inject } from 'vue';
import { useI18n } from '@/hooks/web/useI18n';
import { getSettlementListByCounty, getAllGeo, getfilteredGeo, getRoutesList } from '@/api/settlements';
import { getSummarybyFieldFromMultipleIncludes } from '@/api/summary'
import { EChartsOption, registerMap } from 'echarts'

import {  getListWithoutGeo } from '@/api/counties'

import { pieOptions, multipleBarChart, stacklineOptions, mapChartOptions, lineOptions, stackedbarOptions, simpleBarChart, stackedbarOptionsAbs } from './chart-types';
import LRU from 'lru-cache';

// Constants
const CHART_TYPES = {
  SIMPLE_BAR: 1,
  MULTI_BAR: 2,
  PIE: 3,
  STACKED_BAR: 4,
  LINE: 5,
  STACK_LINE: 6,
  MAP: 7,
  PYRAMID: 8,
  STACKED_BAR_ABS: 9,
  DONUT: 10,
} as const;

const COLOR_PALETTE = ['#ff007f', '#0000ff'];

// TypeScript Interfaces
interface Card {
  id: number;
  card_model: string;
  card_model_field: string;
  aggregation: string;
  computation?: string;
  filters?: Array<{ field: string; value: any; operation: string }>;
  value?: number;
  symbol?: string;
  icon: string;
  iconColor: string;
  description: string;
}

interface Chart {
  id: number;
  title: string;
  type: number;
  card_model: string;
  card_model_field: string;
  aggregation: string;
  categorized?: string;
  unique?: boolean;
  ignore_empty?: boolean;
  chart: any;
}

interface Tab {
  id: number;
  label: string;
  name: string;
  cards: Chart[];
}

interface FilterState {
  level: 'national' | 'county' | 'subcounty';
  counties: number[];
  subCounties: number[];
  wards: number[];
}

// Chart Configuration Map
const chartConfigMap = {
  [CHART_TYPES.SIMPLE_BAR]: { options: simpleBarChart, type: 'bar' },
  [CHART_TYPES.MULTI_BAR]: { options: multipleBarChart, type: 'bar' },
  [CHART_TYPES.PIE]: { options: pieOptions, type: 'donut' },
  [CHART_TYPES.STACKED_BAR]: { options: stackedbarOptions, type: 'bar' },
  [CHART_TYPES.LINE]: { options: lineOptions, type: 'area' },
  [CHART_TYPES.STACK_LINE]: { options: stacklineOptions, type: 'area' },
  [CHART_TYPES.MAP]: { options: mapChartOptions, type: 'map' },
  [CHART_TYPES.STACKED_BAR_ABS]: { options: stackedbarOptionsAbs, type: 'bar' },
  [CHART_TYPES.DONUT]: { options: pieOptions, type: 'donut' },
};

// API Service
const apiService = {
  async getSummary(formData: any): Promise<number> {
    const response = await getSummarybyFieldFromMultipleIncludes(formData);
    return response.Total[0][formData.summaryFunction] ? parseInt(response.Total[0][formData.summaryFunction]) : 0;
  },
  async getCharts(formData: any): Promise<any[]> {
    const response = await getSettlementListByCounty(formData);
    return response.data;
  },
  async getGeoData(formData: any): Promise<any> {
    const response = await getAllGeo(formData);
    return response.data[0]?.json_build_object;
  },
  async getFilteredGeo(formData: any): Promise<any> {
    const response = await getfilteredGeo(formData);
    return response.data[0]?.json_build_object;
  },
  async getCountyList(params: any): Promise<any[]> {
    const response = await getListWithoutGeo(params);
    return response.data;
  },
  async getDynamicDashboards(formData: any): Promise<any[]> {
    const response = await getRoutesList(formData);
    return response.data;
  },
};

// Cache Setup
const cache = new LRU({ max: 100, ttl: 1000 * 60 * 5 }); // Cache for 5 minutes

// Reactive State
const dashboard_id = ref<number>();
const activeTab = ref<string>();
const loading = ref(true);
const cardLoading = ref(true);
const cards = ref<Card[]>([]);
const tabs = ref<Tab[]>([]);
const filters = reactive<FilterState>({ level: 'national', counties: [], subCounties: [], wards: [] });
const countyGeo = ref<any[]>([]);
const subCountyGeo = ref<any[]>([]);
const aspect = ref<number>();
const fmap = ref(false);
const countyList = ref<any[]>([]);
const subCountyList = ref<any[]>([]);
const filteredSubCountyList = ref<any[]>([]);
const { t } = useI18n();
const route = useRoute();

// ECharts Setup
use([GaugeChart, CanvasRenderer, PieChart, LineChart, BarChart, TitleComponent, TooltipComponent, LegendComponent, ToolboxComponent, GridComponent]);
const theme = inject(THEME_KEY);
if (import.meta.env.MODE === 'development') console.log('ECharts Theme in use:', theme);

// Utility Functions
const convertStringsToNumbers = (stringArray: string[]): number[] => stringArray.map(Number);

const formatNumber = (value: number): string => {
  if (value >= 1000000) return (value / 1000000).toLocaleString('en-US', { maximumFractionDigits: 2 }) + 'M';
  if (value >= 1000) return (value / 1000).toLocaleString('en-US', { maximumFractionDigits: 2 }) + 'K';
  return value.toLocaleString('en-US');
};

const getDynamicDashboards = async () => {
  const formData = { limit: 100, page: 1, curUser: 1, model: 'dashboard', searchField: 'title', searchKeyword: '' };
  const dashboards = await apiService.getDynamicDashboards(formData);
  const mainDashboard = dashboards.find(item => item.main_dashboard);
  dashboard_id.value = mainDashboard?.id;
};

// Geo Data Handling
const getCountyGeo = async () => {
  if (countyGeo.value.length) return;
  const formData = { model: 'county' };
  const geoData = await apiService.getGeoData(formData);
  if (geoData?.features) {
    countyGeo.value = geoData;
    const bbox = turf.bbox(countyGeo.value);
    aspect.value = Math.cos(((bbox[1] + bbox[3]) / 2) * Math.PI / 180);
    registerMap('KE', countyGeo.value);
    fmap.value = true;
  }
};

const getSubsetGeo = async (model: string, filterFields: string[], filterValues: number[]) => {
  const formData = { model, columnFilterField: filterFields, selectedParents: filterValues, id: filterValues };
  const geoData = await apiService.getFilteredGeo(formData);
  if (geoData?.features) {
    subCountyGeo.value = turf.featureCollection(geoData.features);
    const bbox = turf.bbox(subCountyGeo.value);
    aspect.value = Math.cos(((bbox[1] + bbox[3]) / 2) * Math.PI / 180);
    registerMap('KE', subCountyGeo.value);
  }
};


 // Chart Data Processing
const xtransformData = (data: any[], chartType: number, aggregationMethod: string, cfield: string) => {
  const uniqueNames = [...new Set(data.map(item => item.name || ''))].filter(Boolean).sort(); // Location names (e.g., subcounty.name)
  const uniqueCategoryTitles = [...new Set(data.map(item => item[cfield] || ''))].filter(Boolean).sort(); // Categories (e.g., Male/Female)
  return {
    series: uniqueCategoryTitles.map(category => {
      const dataArr = uniqueNames.map(name => {
        const filteredData = data.filter(item => item[cfield] === category && item.name === name);
        return filteredData.length > 0 ? parseInt(filteredData[0][aggregationMethod]) || 0 : 0;
      });
      return {
        name: category || 'Unknown', // Series label (e.g., Male or Female)
        data: chartType === CHART_TYPES.PIE || chartType === CHART_TYPES.DONUT
          ? uniqueNames.map((name, index) => ({ name: name || 'Unknown', value: dataArr[index] }))
          : dataArr,
      };
    }),
    categories: uniqueNames.length ? uniqueNames : ['No Data'], // X-axis categories
  };
};

const xgetSummaryMultipleParentsGrouped = async (thisChart: Chart): Promise<[any[], any[]]> => {
  const { card_model: cmodel, card_model_field: cfield, aggregation: cAggregation, type: chartType, categorized: categorizedField, unique = false, ignore_empty = false } = thisChart;
  const associated_Models: string[] = [];
  const filterFields: string[] = [];
  const filterValues: any[] = [];
  const groupFields: string[] = [];
  const filterOperators: string[] = [];

  if (thisChart.filters) {
    thisChart.filters.forEach(item => {
      if (item.field) {
        filterFields.push(item.field);
        filterValues.push(item.value);
        filterOperators.push(item.operation);
      }
    });
  }

  if (categorizedField) groupFields.push(`${cmodel}.${cfield}`);
  if (chartType === CHART_TYPES.LINE || chartType === CHART_TYPES.STACK_LINE) groupFields.push(`${cmodel}.createdAt`);

  if (filters.level === 'county') {
    associated_Models.push('subcounty');
    filterFields.push('county_id');
    filterValues.push(filters.counties);
    filterOperators.push('or');
    if (chartType !== CHART_TYPES.PIE && chartType !== CHART_TYPES.DONUT) groupFields.push('subcounty.name');
  } else if (filters.level === 'subcounty') {
    associated_Models.push('ward');
    filterFields.push('subcounty_id');
    filterValues.push(filters.subCounties);
    filterOperators.push('or');
    if (chartType !== CHART_TYPES.PIE && chartType !== CHART_TYPES.DONUT) groupFields.push('ward.name');
  } else if (filters.level === 'national') {
    associated_Models.push('county');
    if (chartType !== CHART_TYPES.PIE && chartType !== CHART_TYPES.DONUT) groupFields.push('county.name');
  }

  const formData = {
    model: cmodel,
    summaryField: `${cmodel}.${cfield}`,
    summaryFunction: cAggregation,
    assoc_models: associated_Models,
    groupFields,
    filterField: filterFields,
    filterOperator: filterOperators,
    filterValue: filterValues,
    uniqueCounts: unique,
    ignoreEmpty: ignore_empty,
  };

  const cacheKey = JSON.stringify(formData);
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) return cachedResult;

  try {
    const response = await getSummarybyFieldFromMultipleIncludes(formData);
    const amount = response.Total || [];
    let categoryArray: any[] = [];
    let seriesData: any[] = [];

    if (chartType === CHART_TYPES.LINE) {
      const keys = [...new Set(amount.reduce((allKeys: string[], obj: any) => allKeys.concat(Object.keys(obj)), []))];
      const values: any = {};
      keys.forEach(key => (values[key] = amount.map((obj: any) => obj[key] || null)));
      categoryArray = values.createdAt || [];
      seriesData = [{ name: cfield || 'Data', data: values[cAggregation] || [] }];
    } else if (chartType === CHART_TYPES.STACK_LINE) {
      const dates = [...new Set(amount.map((item: any) => item.createdAt))].sort();
      const result: any = {};
      for (const item of amount) {
        if (!result[item[cfield]]) {
          result[item[cfield]] = { name: item[cfield] || 'Unknown', type: 'line', stack: 'Total', data: new Array(dates.length).fill(0) };
        }
        const dateIndex = dates.indexOf(item.createdAt);
        result[item[cfield]].data[dateIndex] = Number(item[cAggregation]) || 0;
      }
      seriesData = Object.values(result);
      categoryArray = dates.length ? dates : ['No Data'];
    } else if (chartType === CHART_TYPES.PIE || chartType === CHART_TYPES.DONUT) {
      if (amount.length && amount[0]) {
        const keys = Object.keys(amount[0]);
        const extractedData = keys.map(key => amount.map((item: any) => item[key]));
        categoryArray = extractedData[0] || [];
        seriesData = extractedData[0].map((name: string, index: number) => ({
          name: name || 'Unknown',
          value: convertStringsToNumbers(extractedData[1] || [])[index] || 0,
        }));
      } else {
        seriesData = [{ name: 'No Data', value: 0 }];
        categoryArray = ['No Data'];
      }
    } else if (chartType === CHART_TYPES.MAP) {
      let maxSum = Number.MIN_SAFE_INTEGER;
      let minSum = Number.MAX_SAFE_INTEGER;
      for (const item of amount) {
        const values = Object.values(item);
        for (const value of values) {
          if (!isNaN(value as any)) {
            const numValue = parseInt(value as string);
            maxSum = Math.max(maxSum, numValue);
            minSum = Math.min(minSum, numValue);
          }
        }
      }
      if (minSum === maxSum) minSum = 0;
      for (const item of amount) {
        const keys = Object.keys(item);
        if (keys.length > 1) {
          item.value = item[keys[1]];
          delete item[keys[1]];
        }
      }
      categoryArray = [minSum, maxSum];
      seriesData = amount;
    } else {
      const transformed = xtransformData(amount, chartType, cAggregation, cfield);
      seriesData = transformed.series;
      categoryArray = transformed.categories;
    }

    const result: [any[], any[]] = [categoryArray, seriesData];
    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching summary data:', error);
    return [['No Data'], [{ name: 'Error', data: [0] }]];
  }
};

// Chart Processing
const processChart = async (thisChart: Chart, chartOptions: any, chartType: string): Promise<Chart> => {
  const cdata = await xgetSummaryMultipleParentsGrouped(thisChart);
  const isDonut = thisChart.type === CHART_TYPES.DONUT;
  const isPie = thisChart.type === CHART_TYPES.PIE;
  const seriesData = isPie || isDonut
    ? cdata[1].map((item: any) => item.value) // Extract values for pie/donut
    : cdata[1];
  const updatedOptions = {
    ...chartOptions,
    title: { ...chartOptions.title, text: thisChart.title },
    ...(chartType === 'area' ? { xAxis: { ...chartOptions.xAxis, data: cdata[0] } } : { xaxis: { ...chartOptions.xaxis, categories: cdata[0] } }),
    ...(isPie || isDonut ? {
      plotOptions: {
        pie: {
          donut: isDonut ? { size: '50%' } : {size: '0%'},
          dataLabels: {
            enabled: true,
            formatter: (val: number, opts: any) => cdata[1][opts.dataPointIndex]?.name || 'Unknown',
          },
        },
      },
      labels: cdata[1].map((item: any) => item.name || 'Unknown'), // Use series names as labels
    } : {}),
    ...(chartType === 'bar' ? {
      dataLabels: { enabled: true, position: 'top' },
      plotOptions: {
        bar: {
          dataLabels: { position: 'top' },
        },
      },
    } : {}),
    ...(chartType === 'bar' && (thisChart.type === CHART_TYPES.STACKED_BAR || thisChart.type === CHART_TYPES.STACKED_BAR_ABS) ? {
      plotOptions: {
        bar: {
          horizontal: false,
          dataLabels: { position: 'center' },
        },
      },
    } : {}),
  };
  thisChart.chart = updatedOptions;
  thisChart.chart.series = seriesData;
  if (!seriesData.length || seriesData.every((s: any) => !s.data?.length && !s.value)) {
    thisChart.chart.graphic = [{ type: 'text', left: 'center', top: 'middle', style: { text: 'No data available', fill: '#999', fontSize: 16 }, z: 100 }];
  }
  return thisChart;
};


const processPyramid = async (thisChart: Chart): Promise<Chart> => {
  const formData = {
    model: 'households',
    summaryFunction: 'sum',
    summaryFields: [
      'age_00_04m', 'age_05_09m', 'age_10_14m', 'age_15_19m', 'age_20_24m', 'age_25_29m', 'age_30_34m', 'age_35_39m', 'age_40_44m', 'age_45_49m', 'age_50_54m', 'age_55_59m', 'age_60_64m', 'age_65_69m', 'age_gt_70m',
      'age_00_04f', 'age_05_09f', 'age_10_14f', 'age_15_19f', 'age_20_24f', 'age_25_29f', 'age_30_34f', 'age_35_39f', 'age_40_44f', 'age_45_49f', 'age_50_54f', 'age_55_59f', 'age_60_64f', 'age_65_69f', 'age_gt_70f',
    ],
    groupField: 'gender',
    assoc_model: [],
    filters: filters.level === 'county' ? ['county_id'] : filters.level === 'subcounty' ? ['subcounty_id'] : [],
    filterValues: filters.level === 'county' ? [filters.counties] : filters.level === 'subcounty' ? [filters.subCounties] : [],
  };

  const response = await getSummarybyFieldFromMultipleIncludes(formData);
  const results = response.Total;
  if (!results) return thisChart;

  const keys = Object.keys(results[0]);
  const males = keys.filter(key => key.includes('m')).map(key => parseInt(results[0][key]));
  const females = keys.filter(key => key.includes('f')).map(key => -parseInt(results[0][key]));

  thisChart.chart = {
    title: { text: thisChart.title, subtext: `National Slum Database, ${new Date().getFullYear()}`, left: 'center', textStyle: { fontSize: 14 }, subtextStyle: { fontSize: 12 } },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (value: number) => Math.abs(value) },
    legend: {
      itemWidth: 20, itemHeight: 20, orient: 'horizontal', type: 'scroll', left: 'left', top: 10,
      data: [{ name: 'Male', icon: maleIcon }, { name: 'Female', icon: femaleIcon }],
    },
    toolbox: { show: true, feature: { mark: { show: true }, dataView: { show: true, readOnly: true }, restore: { show: true }, saveAsImage: { show: true, pixelRatio: 4 } } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: [{ type: 'value', axisLabel: { formatter: (params: number) => Math.abs(params) } }],
    yAxis: [{
      type: 'category', axisTick: { show: false }, nameTextStyle: { fontStyle: 'oblique', fontWeight: 'bold' },
      data: ['00-04', '05-09', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70+'],
    }],
    series: [
      { name: 'Female', type: 'bar', color: COLOR_PALETTE[0], stack: 'Total', label: { show: false, position: 'right' }, emphasis: { focus: 'none' }, data: males },
      { name: 'Male', type: 'bar', color: COLOR_PALETTE[1], stack: 'Total', label: { show: false, position: 'left', formatter: (params: any) => Math.abs(params.value) }, emphasis: { focus: 'none' }, data: females },
    ],
  };

  return thisChart;
};

// Card and Tab Data
const getCardData = async () => {
  cardLoading.value = true;
  const formData = { model: 'dashboard_card', filters: ['dashboard_id'], filterValues: [[dashboard_id.value]], searchField: 'title', searchKeyword: '' };
  const data = await apiService.getCharts(formData);
  cards.value = await Promise.all(data.map(async (card: Card) => {
    const formData = {
      model: card.card_model,
      summaryField: `${card.card_model}.${card.card_model_field}`,
      summaryFunction: card.aggregation,
      assoc_models: filters.level === 'county' ? ['subcounty'] : filters.level === 'subcounty' ? ['ward'] : ['county'],
      groupFields: [],
      filterField: [...(card.filters?.map(f => f.field) || []), ...(filters.level === 'county' ? ['county_id'] : filters.level === 'subcounty' ? ['subcounty_id'] : [])],
      filterValue: [...(card.filters?.map(f => f.value) || []), ...(filters.level === 'county' ? [filters.counties] : filters.level === 'subcounty' ? [filters.subCounties] : [])],
      filterOperator: [...(card.filters?.map(f => f.operation) || []), ...(filters.level === 'county' || filters.level === 'subcounty' ? ['or'] : [])],
      calculationType: card.computation,
      uniqueCounts: card.unique || false,
    };
    return { ...card, value: await apiService.getSummary(formData), symbol: card.computation === 'proportion' ? '%' : '' };
  }));
  cards.value.sort((a, b) => a.id - b.id);
  cardLoading.value = false;
};

const getCharts = async (section_id: number): Promise<Chart[]> => {
  const formData = { model: 'dashboard_section_chart', filters: ['dashboard_section_id'], filterValues: [[section_id]], searchField: 'title', searchKeyword: '', associated_multiple_models: ['dashboard_section'] };
  const data = await apiService.getCharts(formData);
  const charts = reactive<Chart[]>([]);
  await Promise.all(data.map(async (thisChart: Chart) => {
    if (thisChart.type === CHART_TYPES.PYRAMID) {
      charts.push(await processPyramid(thisChart));
    } else if (thisChart.type === CHART_TYPES.MAP) {
      const cdata = await xgetSummaryMultipleParentsGrouped(thisChart);
      if (filters.counties.length && filters.level === 'county') await getSubsetGeo('subcounty', ['county_id'], filters.counties);
      if (filters.subCounties.length && filters.level === 'subcounty') await getSubsetGeo('ward', ['subcounty_id'], filters.subCounties);
      thisChart.chart = {
        ...mapChartOptions,
        title: { ...mapChartOptions.title, text: thisChart.title },
        visualMap: { ...mapChartOptions.visualMap, min: cdata[0][0], max: cdata[0][1] },
        series: [{ ...mapChartOptions.series[0], data: cdata[1], aspectScale: aspect.value }],
      };
      if (cdata[1].length === 0) {
        thisChart.chart.graphic = [{ type: 'text', left: 'center', top: 'middle', style: { text: 'No data available', fill: 'red', fontSize: 16 }, z: 100 }];
      }
      charts.push(thisChart);
    } else {
      const config = chartConfigMap[thisChart.type];
      if (config) charts.push(await processChart(thisChart, config.options, config.type));
    }
  }));
  return charts.sort((a, b) => a.id - b.id);
};

const getSectionsData = async () => {
  const formData = { model: 'dashboard_section', filters: ['dashboard_id'], filterValues: [[dashboard_id.value]], searchField: 'title', searchKeyword: '' };
  const data = await apiService.getCharts(formData);
  tabs.value = await Promise.all(data.map(async (item: any) => ({
    id: item.id,
    label: item.title,
    name: item.title,
    cards: await getCharts(item.id),
  })));
  activeTab.value = tabs.value[0]?.name || '';
  tabs.value.sort((a, b) => a.id - b.id);
};

// Filter Handling
const updateFilters = debounce(async (type: 'county' | 'subcounty', values: number[]) => {
  if (type === 'county') {
    filters.counties = values;
    filters.subCounties = [];
    filters.level = values.length ? 'county' : 'national';
    filteredSubCountyList.value = subCountyList.value.filter(option => values.includes(option.county_id));
  } else if (type === 'subcounty') {
    filters.subCounties = values;
    filters.level = values.length ? 'subcounty' : filters.counties.length ? 'county' : 'national';
  }
  await Promise.all([getCardData(), getSectionsData()]);
}, 300);

const filterCounty = (county_id: number[]) => updateFilters('county', county_id);
const filterSubCounty = (subcountyId: number[]) => updateFilters('subcounty', subcountyId);
const handleClear = () => {
  filters.counties = [];
  filters.subCounties = [];
  filters.level = 'national';
  updateFilters('county', []);
};

// County and Subcounty Data
const getCountySubcountySep = async () => {
  const nested = ['subcounty', 'ward'];
  const data = await apiService.getCountyList({ params: { curUser: 1, model: 'county', assocModel: 'subcounty', searchField: 'name', nested_models: nested, searchKeyword: '', sort: 'ASC' } });
  countyList.value = data.map((item: any) => ({
    value: item.id,
    label: `${item.name} county`,
    children: item.subcounties.map((subc: any) => ({
      value: subc.id,
      label: `${subc.name} constituency`,
      county_id: item.id,
      children: subc.wards.map((ward: any) => ({
        value: ward.id,
        label: ward.name,
        subcounty_id: ward.subcounty_id,
        county_id: ward.county_id,
      })),
    })),
  }));
  subCountyList.value = countyList.value.flatMap((county: any) => county.children);
  filteredSubCountyList.value = subCountyList.value;
};

// Lifecycle Hooks
onBeforeMount(async () => {
  await getDynamicDashboards();
  await Promise.all([getCountyGeo(), getCardData(), getCountySubcountySep(), getSectionsData()]);
});

onMounted(() => {
  loading.value = false;
});

// Chart Type Helper
const getChartType = (typeId: number): string => chartConfigMap[typeId]?.type || 'bar';
</script>

<template>
  <el-select :style="{ width: '25%', marginRight: '10px' }" v-model="filters.counties" multiple clearable filterable collapse-tags placeholder="Select County" @change="filterCounty" @clear="handleClear">
    <el-option v-for="item in countyList" :key="item.value" :label="item.label" :value="item.value" />
  </el-select>
  <el-select :style="{ width: '25%' }" v-model="filters.subCounties" clearable multiple filterable collapse-tags placeholder="Select Constituency" @change="filterSubCounty" @clear="handleClear">
    <el-option v-for="item in filteredSubCountyList" :key="item.value" :label="item.label" :value="item.value" />
  </el-select>
  <el-row :gutter="20">
    <el-col v-for="card in cards" :key="card.id" :span="24 / cards.length" :xs="24" :sm="12" :md="8" :lg="6">
      <div class="tabs-container">
        <ElSkeleton :loading="cardLoading" animated>
          <el-card shadow="always">
            <div class="card-content">
              <div class="icon-container">
                <Icon :icon="card.icon" width="60" :color="card.iconColor" />
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
      <el-tab-pane v-for="tab in tabs" :name="tab.name" :key="tab.id" :label="tab.label">
        <el-row v-if="activeTab === tab.name" :gutter="20">
          <el-col v-for="card in tab.cards" :key="card.id" :span="12" :xl="12" :lg="12" :md="12" :sm="24" :xs="24">
            <div class="charts-container">
              <el-card>
                <ElSkeleton :loading="loading" animated>
                  <v-chart v-if="card.type === CHART_TYPES.MAP || card.type === CHART_TYPES.PYRAMID" :id="card.id" class="chart" :option="card.chart" height="350" autoresize />
                  <apexchart v-else :options="card.chart" :series="card.chart.series" :type="getChartType(card.type)" height="350" autoresize />
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
.tabs-container, .charts-container {
  margin-top: 10px;
}
.icon-container {
  display: inline-block;
  position: relative;
  box-shadow: 0 2px 4px rgba(34, 35, 35, 0.2);
  padding: 5px;
  border-radius: 10%;
}
</style>
