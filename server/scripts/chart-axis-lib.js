/** Shared legacy → axis conversion (used by migrate + CSV repair scripts). */

const GEO_X = { field: 'county.name', label: 'County / Sub-county / Ward (auto)' }

const SLICE_TYPES = new Set([3, 10, 11])
const BAR_TYPES = new Set([1, 2, 4, 9])

const normAgg = (a) => (a || 'count').toLowerCase()
const labelFor = (field) => field

function parseBool(val) {
  if (val === true || val === false) return val
  if (val == null || val === '') return false
  const s = String(val).trim().toLowerCase()
  return s === 'true' || s === 't' || s === '1' || s === 'yes'
}

/** Infer axis config from legacy flat fields. */
function deriveAxisFromLegacy(chart) {
  const type = Number(chart.type)
  const agg = normAgg(chart.aggregation)
  const field = chart.card_model_field || null
  const categorized = parseBool(chart.categorized)

  if (type === 8) return null
  if (type === 12) return { x_axis: null, y_axis: null, series_field: null }

  if (chart.category === 'Intervention') {
    return { x_axis: null, y_axis: null, series_field: null }
  }

  if (type === 7 || type === 5) {
    const yField = field && field !== 'id' ? field : 'id'
    return {
      x_axis: null,
      y_axis: { field: yField, aggregation: agg, label: agg },
      series_field: null,
    }
  }

  if (SLICE_TYPES.has(type)) {
    if (!field) return null
    return {
      x_axis: { field, label: labelFor(field) },
      y_axis: { field: 'id', aggregation: agg, label: agg },
      series_field: null,
    }
  }

  if (BAR_TYPES.has(type)) {
    if (categorized && field) {
      return {
        x_axis: { field, label: labelFor(field) },
        y_axis: { field: 'id', aggregation: agg, label: agg },
        series_field: null,
      }
    }
    if (field) {
      return {
        x_axis: { ...GEO_X },
        y_axis: { field, aggregation: agg, label: agg },
        series_field: null,
      }
    }
    return null
  }

  return null
}

/** Fix known bad mappings after first migration pass. */
function fixKnownBadAxis(chart, axis) {
  const type = Number(chart.type)
  const field = chart.card_model_field
  const agg = normAgg(chart.aggregation || axis?.y_axis?.aggregation)
  const categorized = chart.categorized != null ? parseBool(chart.categorized) : null

  if (!axis || chart.category === 'Intervention' || type === 8 || type === 12) {
    if (chart.category === 'Intervention') {
      return { x_axis: null, y_axis: null, series_field: null }
    }
    return axis
  }

  if (type === 11 && axis.x_axis?.field === 'id') {
    axis.x_axis = { ...GEO_X }
  }

  if (BAR_TYPES.has(type) && categorized === false && field && axis.x_axis?.field === field) {
    axis.x_axis = { ...GEO_X }
    axis.y_axis = { field, aggregation: agg, label: agg }
  }

  if (
    BAR_TYPES.has(type) &&
    axis.x_axis?.field &&
    axis.x_axis.field !== 'county.name' &&
    axis.x_axis.field !== 'id' &&
    axis.y_axis?.field === 'id'
  ) {
    const measure = axis.x_axis.field
    axis.x_axis = { ...GEO_X }
    axis.y_axis = { field: measure, aggregation: agg, label: agg }
  }

  if (BAR_TYPES.has(type) && (categorized === false || categorized === null) && axis.x_axis?.field === 'id') {
    axis.x_axis = { ...GEO_X }
    axis.y_axis = { field: 'id', aggregation: agg, label: agg }
  }

  if ((type === 5 || type === 7) && field && field !== 'id' && axis.y_axis?.field === 'id') {
    axis.y_axis = { field, aggregation: agg, label: agg }
  }

  return axis
}

function buildAxisFromLegacyRow(row) {
  let axis = deriveAxisFromLegacy(row)
  if (!axis) return null
  return fixKnownBadAxis(row, axis)
}

module.exports = {
  GEO_X,
  deriveAxisFromLegacy,
  fixKnownBadAxis,
  buildAxisFromLegacyRow,
  parseBool,
}
