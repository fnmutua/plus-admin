/**
 * Build the National dashboard bundle (cards + all chart data) for filterLevel=national.
 * Cached in Redis; refreshed on a schedule.
 */

const db = require('../models')
const { invokeController } = require('../utils/invokeController')
const {
  setNationalBundle,
  setDashboardBundleById,
  TTL_SECONDS,
} = require('../utils/dashboardBundleRedis')
const summaryController = require('../controllers/summary.controller')
const chartController = require('../controllers/chart.controller')
const {
  isTargetVsAchievedChart,
  resolveTargetVsAchievedChart,
} = require('./indicatorTargetAchieved')
const {
  sumCategoryAchieved,
  sumCategoryAchievedGrouped,
  parseDashboardLocationFilters,
} = require('./meReporting')

const buildInFlight = new Map()

function plainRow(row) {
  if (!row) return row
  return typeof row.get === 'function' ? row.get({ plain: true }) : { ...row }
}

function parseAxisJson(val) {
  if (val == null || val === '') return null
  if (typeof val === 'object') return val
  try {
    return JSON.parse(val)
  } catch {
    return null
  }
}

function getChartTimeGroupField(model, chart) {
  const raw = String(chart?.time_field || 'createdAt').trim() || 'createdAt'
  if (raw.includes('.')) return raw
  return `${model}.${raw}`
}

function shouldUseAxisEndpoint(chart) {
  if (chart.category && chart.category !== 'Status') return false
  const type = Number(chart.type)
  if (type === 12) {
    return Array.isArray(chart.metric_fields) && chart.metric_fields.length > 0
  }
  const y_axis = parseAxisJson(chart.y_axis)
  if (!y_axis?.aggregation) return false
  const x_axis = parseAxisJson(chart.x_axis)
  if (x_axis?.field) return true
  if (type === 5 || type === 7 || type === 14 || type === 15) return true
  return false
}

function isInterventionCategory(category) {
  return category === 'Intervention' || category === 'Indicator'
}

function buildCardSummaryPayload(card) {
  const associated_Models = ['county']
  const filterFields = []
  const filterValues = []
  const filterOperators = []

  if (Array.isArray(card.filters)) {
    for (const item of card.filters) {
      if (item?.field) {
        filterFields.push(item.field)
        filterValues.push(item.value)
        filterOperators.push(item.operation)
      }
    }
  }

  const formData = {
    model: card.card_model,
    summaryField: `${card.card_model}.${card.card_model_field}`,
    summaryFunction: card.aggregation,
    assoc_models: associated_Models,
    groupFields: [],
    filterField: filterFields,
    filterValue: filterValues,
    filterOperator: filterOperators,
    calculationType: card.computation,
    filter_function: card.filter_function,
    uniqueCounts: card.unique ? card.unique : false,
  }

  if (card.card_model === 'indicator_category_report' && card.indicator_category_id) {
    formData.indicator_category_id = card.indicator_category_id
  }

  return formData
}

function buildChartSummaryPayload(thisChart) {
  const associated_Models = []
  const filterFields = []
  const filterValues = []
  const groupFields = []
  const filterOperators = []

  const cmodel = thisChart.card_model
  const filters = thisChart.filters
  const x_axis = parseAxisJson(thisChart.x_axis)
  const y_axis = parseAxisJson(thisChart.y_axis)
  const series_field = parseAxisJson(thisChart.series_field)
  const chartType = Number(thisChart.type)
  const unique = thisChart.unique ? thisChart.unique : false
  const ignoreEmpty = thisChart.ignore_empty !== false

  const cAggregation = (y_axis?.aggregation || 'count').toLowerCase()
  const measureField = y_axis?.field || 'id'

  if (Array.isArray(filters)) {
    for (const item of filters) {
      if (item?.field) {
        filterFields.push(item.field)
        filterValues.push(item.value)
        filterOperators.push(item.operation)
      }
    }
  }

  if (chartType === 3 || chartType === 10) {
    const sliceField = x_axis?.field || measureField
    groupFields.push(`${cmodel}.${sliceField}`)
  } else if (series_field?.field && x_axis?.field) {
    groupFields.push(`${cmodel}.${x_axis.field}`)
  } else if (x_axis?.field && x_axis.field !== 'county.name') {
    groupFields.push(`${cmodel}.${x_axis.field}`)
  }

  if (chartType === 5 || chartType === 6 || chartType === 12) {
    groupFields.push(getChartTimeGroupField(cmodel, thisChart))
  }

  const isTimeSeriesChart = chartType === 5 || chartType === 6 || chartType === 12

  associated_Models.push('county')
  if (chartType !== 3 && chartType !== 10 && !isTimeSeriesChart) {
    groupFields.push('county.name')
  }

  const formData = {
    model: cmodel,
    assoc_models: associated_Models,
    groupFields,
    filterField: filterFields,
    filterOperator: filterOperators,
    filterValue: filterValues,
    uniqueCounts: unique,
    ignoreEmpty,
  }

  if (chartType === 12) {
    const metrics = Array.isArray(thisChart.metric_fields)
      ? thisChart.metric_fields.filter(Boolean)
      : []
    formData.summaryFields = metrics.map((f) => `${cmodel}.${f}`)
    formData.summaryFunction = cAggregation
    if (metrics.length > 0) {
      formData.summaryField = `${cmodel}.${metrics[0]}`
    }
  } else {
    const summaryField =
      chartType === 3 || chartType === 10 ? x_axis?.field || measureField : measureField
    formData.summaryField = `${cmodel}.${summaryField}`
    formData.summaryFunction = cAggregation
  }

  if (cmodel === 'indicator_category_report' && thisChart.indicator_category_id) {
    formData.indicator_category_id = thisChart.indicator_category_id
  }

  return formData
}

function buildRenderChartPayload(thisChart) {
  const x_axis = parseAxisJson(thisChart.x_axis)
  const y_axis = parseAxisJson(thisChart.y_axis)
  const series_field = parseAxisJson(thisChart.series_field)
  const chartType = Number(thisChart.type)

  const payload = {
    chart_type: chartType,
    model: thisChart.card_model,
    ignore_empty: thisChart.ignore_empty !== false,
  }

  if (x_axis?.field) payload.x_axis = x_axis
  if (y_axis?.aggregation) {
    payload.y_axis = {
      field: y_axis.field || 'id',
      aggregation: y_axis.aggregation,
      label: y_axis.label || y_axis.aggregation,
    }
  }
  if (series_field?.field) payload.series_field = series_field
  if (thisChart.time_field) payload.time_field = thisChart.time_field
  if (Array.isArray(thisChart.metric_fields) && thisChart.metric_fields.length) {
    payload.metric_fields = thisChart.metric_fields
  }

  const mergedFilters = Array.isArray(thisChart.filters) ? [...thisChart.filters] : []
  if (mergedFilters.length) payload.filters = mergedFilters

  return payload
}

function buildPyramidPayload() {
  const males = ['age_group_0_5m', 'age_group_6_17m', 'age_group_18_35m', 'age_group_36_64m', 'age_group_65m']
  const females = ['age_group_0_5f', 'age_group_6_17f', 'age_group_18_35f', 'age_group_36_64f', 'age_group_65f']
  return {
    model: 'households',
    summaryFunction: 'sum',
    assoc_model: [],
    summaryFields: females.concat(males),
    groupField: 'gender',
    filters: [],
    filterValues: [],
  }
}

async function resolveCardValue(card) {
  try {
    if (isInterventionCategory(card.category) && card.indicator_category_id) {
      return await resolveInterventionCardValue(card)
    }
    const payload = buildCardSummaryPayload(card)
    const response = await invokeController(summaryController.sumModelAssociatedMultipleModels, payload)
    const aggregMethod = card.aggregation
    const row = response?.Total?.[0]
    if (!row) return 0
    const raw = row[aggregMethod]
    return raw != null ? parseInt(raw, 10) || 0 : 0
  } catch (err) {
    console.error('[dashboard-bundle] card', card.id, err.message)
    return 0
  }
}

async function resolveInterventionCardValue(card) {
  const location = parseDashboardLocationFilters(Array.isArray(card.filters) ? card.filters : [])
  const categoryId = Number(card.indicator_category_id)
  if (!Number.isFinite(categoryId)) return 0

  try {
    const achieved = await sumCategoryAchieved(categoryId, location, null, { approvedOnly: true })
    return Math.round(achieved) || 0
  } catch (err) {
    console.error('[dashboard-bundle] intervention card', card.id, err.message)
    return 0
  }
}

async function getIndicatorCategoryIds(indicatorId) {
  if (!indicatorId) return []
  const rows = await db.models.indicator_category.findAll({
    where: { indicator_id: indicatorId },
    attributes: ['id'],
    raw: true,
  })
  return rows.map((r) => r.id)
}

async function getChartIndicatorCategoryIds(chart) {
  if (Array.isArray(chart.filters)) {
    for (const item of chart.filters) {
      if (item?.field === 'indicator_category_id' && item?.operation === 'eq') {
        const vals = Array.isArray(item.value) ? item.value : [item.value]
        const ids = vals.map(Number).filter(Boolean)
        if (ids.length) return ids
      }
    }
  }

  const indicatorIds = []
  if (Array.isArray(chart.indicators) && chart.indicators.length) {
    for (const ind of chart.indicators) {
      const id = ind?.id ?? ind
      if (id != null) indicatorIds.push(Number(id))
    }
  } else if (chart.indicator_id != null) {
    const ids = Array.isArray(chart.indicator_id) ? chart.indicator_id : [chart.indicator_id]
    indicatorIds.push(...ids.map(Number).filter(Boolean))
  }
  const categoryIds = new Set()
  for (const indId of indicatorIds) {
    for (const catId of await getIndicatorCategoryIds(indId)) {
      categoryIds.add(catId)
    }
  }
  return [...categoryIds]
}

async function loadChartsForSections(sectionIds) {
  if (!sectionIds.length) return []

  const rows = await db.models.dashboard_section_chart.findAll({
    where: { dashboard_section_id: sectionIds },
    order: [['id', 'ASC']],
    include: [{
      model: db.models.indicator,
      through: { attributes: [] },
      attributes: ['id', 'name', 'type', 'format', 'unit'],
    }],
  })

  return rows.map((row) => {
    const plain = plainRow(row)
    plain.indicators = (row.indicators || []).map((ind) => plainRow(ind))
    return plain
  })
}

function buildInterventionChartPayload(chart, indicatorCategoryIds) {
  const chartType = Number(chart.type)
  const cmodel = 'indicator_category_report'
  const cfield = 'amount'
  const cAggregation = 'sum'
  const groupFields = []
  const filterFields = ['indicator_category_id']
  const filterValues = [indicatorCategoryIds]
  const filterOperators = ['eq']

  if (Array.isArray(chart.filters)) {
    for (const item of chart.filters) {
      if (item?.field) {
        filterFields.push(item.field)
        filterValues.push(item.value)
        filterOperators.push(item.operation)
      }
    }
  }

  if (chart.categorized) {
    groupFields.push(`${cmodel}.${cfield}`)
  }
  if (chartType === 5 || chartType === 6) {
    groupFields.push(`${cmodel}.date`)
  }
  if (chartType !== 3 && chartType !== 10) {
    groupFields.push('county.name')
  }
  if (chartType === 3 || chartType === 10) {
    groupFields.push(`${cmodel}.${cfield}`)
  }

  return {
    model: cmodel,
    summaryField: `${cmodel}.${cfield}`,
    summaryFunction: cAggregation,
    assoc_models: ['county'],
    groupFields,
    filterField: filterFields,
    filterOperator: filterOperators,
    filterValue: filterValues,
    indicator_category_id: indicatorCategoryIds,
    uniqueCounts: chart.unique ? chart.unique : false,
    ignoreEmpty: chart.ignore_empty !== false,
  }
}

async function resolveChartBundleData(chart) {
  const chartType = Number(chart.type)

  try {
    if (isTargetVsAchievedChart(chart)) {
      return await resolveTargetVsAchievedChart(chart)
    }

    if (isInterventionCategory(chart.category)) {
      const categoryIds = await getChartIndicatorCategoryIds(chart)
      if (categoryIds.length) {
        const location = parseDashboardLocationFilters(Array.isArray(chart.filters) ? chart.filters : [])
        const rows = await sumCategoryAchievedGrouped(categoryIds, location, null, {
          approvedOnly: true,
        })
        return { kind: 'summary', Total: rows, intervention: true }
      }
    }

    if (chartType === 8) {
      const payload = buildPyramidPayload()
      const response = await invokeController(summaryController.sumGroupByMultipleColumns, payload)
      return { kind: 'group', Total: response.Total }
    }

    if (shouldUseAxisEndpoint(chart)) {
      const payload = buildRenderChartPayload(chart)
      const response = await invokeController(chartController.renderChart, payload)
      return {
        kind: 'render',
        categories: response.categories ?? [],
        series: response.series ?? [],
        meta: response.meta ?? null,
      }
    }

    const payload = buildChartSummaryPayload(chart)
    const response = await invokeController(summaryController.sumModelAssociatedMultipleModels, payload)
    return { kind: 'summary', Total: response.Total }
  } catch (err) {
    console.error('[national-bundle] chart', chart.id, chart.title, err.message)
    return { kind: 'summary', Total: [], error: err.message }
  }
}

async function findMainDashboardId() {
  const row = await db.models.dashboard.findOne({
    where: { main_dashboard: true },
    attributes: ['id'],
    raw: true,
  })
  if (row?.id) return row.id

  const fallback = await db.models.dashboard.findOne({
    order: [['id', 'ASC']],
    attributes: ['id'],
    raw: true,
  })
  return fallback?.id ?? null
}

async function buildDashboardBundle(dashboardId) {
  if (!dashboardId) {
    throw new Error('dashboardId is required')
  }

  const [cardRows, sectionRows] = await Promise.all([
    db.models.dashboard_card.findAll({
      where: { dashboard_id: dashboardId },
      order: [['id', 'ASC']],
      raw: true,
    }),
    db.models.dashboard_section.findAll({
      where: { dashboard_id: dashboardId },
      order: [['id', 'ASC']],
      raw: true,
    }),
  ])

  const sectionIds = sectionRows.map((s) => s.id)
  const chartRows = await loadChartsForSections(sectionIds)

  const chartsBySection = new Map()
  for (const chart of chartRows) {
    const sid = chart.dashboard_section_id
    if (!chartsBySection.has(sid)) chartsBySection.set(sid, [])
    chartsBySection.get(sid).push(chart)
  }

  const cardsWithValues = await Promise.all(
    cardRows.map(async (card) => ({
      ...plainRow(card),
      value: await resolveCardValue(card),
    })),
  )

  const sections = await Promise.all(
    sectionRows.map(async (section) => {
      const charts = chartsBySection.get(section.id) || []
      const chartsWithData = await Promise.all(
        charts.map(async (chart) => ({
          ...plainRow(chart),
          bundleData: await resolveChartBundleData(chart),
        })),
      )
      return {
        ...plainRow(section),
        name: section.title,
        label: section.title,
        charts: chartsWithData,
      }
    }),
  )

  return {
    dashboardId,
    filterLevel: 'national',
    builtAt: new Date().toISOString(),
    ttlSeconds: TTL_SECONDS,
    cards: cardsWithValues,
    sections,
  }
}

async function refreshDashboardBundle(dashboardId) {
  const id = Number(dashboardId)
  if (buildInFlight.has(id)) return buildInFlight.get(id)

  const promise = (async () => {
    const started = Date.now()
    console.log(`[dashboard-bundle] building dashboard ${id}…`)
    const bundle = await buildDashboardBundle(id)
    await setDashboardBundleById(id, bundle)
    if ((await findMainDashboardId()) === id) {
      await setNationalBundle(bundle)
    }
    const chartCount = bundle.sections.reduce((n, s) => n + s.charts.length, 0)
    console.log(
      `[dashboard-bundle] cached dashboard ${id}: ${bundle.cards.length} cards, ${chartCount} charts in ${Date.now() - started}ms`,
    )
    return bundle
  })()

  buildInFlight.set(id, promise)
  try {
    return await promise
  } finally {
    buildInFlight.delete(id)
  }
}

async function refreshNationalDashboardBundle() {
  const dashboardId = await findMainDashboardId()
  if (!dashboardId) throw new Error('No main dashboard configured')
  return refreshDashboardBundle(dashboardId)
}

async function refreshAllDashboardBundles() {
  const rows = await db.models.dashboard.findAll({ attributes: ['id'], raw: true })
  for (const row of rows) {
    try {
      await refreshDashboardBundle(row.id)
    } catch (err) {
      console.error(`[dashboard-bundle] refresh dashboard ${row.id} failed:`, err.message)
    }
  }
}

async function buildNationalDashboardBundle() {
  const dashboardId = await findMainDashboardId()
  if (!dashboardId) throw new Error('No main dashboard configured')
  return buildDashboardBundle(dashboardId)
}

module.exports = {
  buildDashboardBundle,
  buildNationalDashboardBundle,
  refreshDashboardBundle,
  refreshNationalDashboardBundle,
  refreshAllDashboardBundles,
  findMainDashboardId,
}
