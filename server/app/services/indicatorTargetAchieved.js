'use strict';

/**
 * SUD dashboard target vs achieved charts — delegates to shared M&E reporting service.
 */

const db = require('../models');
const {
  DEFAULT_FISCAL_YEAR,
  loadProgrammeTarget,
  sumProjectTargets,
  sumCategoryAchieved,
  parseDashboardLocationFilters,
} = require('./meReporting');

const HOUSING_CATEGORY_ID = 93;

/** SUD COB indicators — category ids in indicator_target / indicator_category_report. */
const COB_PORTFOLIO = [
  { categoryId: HOUSING_CATEGORY_ID, label: 'Social housing units', useProjectTargets: true },
  { categoryId: 19, label: 'Markets & commercial' },
  { categoryId: 20, label: 'Floodlights' },
  { categoryId: 15, label: 'Access roads (km)' },
  { categoryId: 69, label: 'Footbridges' },
  { categoryId: 22, label: 'Social halls' },
  { categoryId: 18, label: 'Health facilities' },
  { categoryId: 14, label: 'Education blocks' },
];

function parseNum(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

async function loadCategoryLabel(categoryId) {
  const row = await db.models.indicator_category.findByPk(categoryId, {
    attributes: ['indicator_name', 'category_title'],
    raw: true,
  });
  if (!row) return `Category ${categoryId}`;
  return `${row.indicator_name}`.trim();
}

function pctOf(achieved, target, { capDisplay = false } = {}) {
  if (!target || target <= 0) return achieved > 0 ? 100 : 0;
  const pct = Math.round((achieved / target) * 1000) / 10;
  const capped = Math.min(999, pct);
  return capDisplay ? Math.min(100, capped) : capped;
}

async function resolveTargetAchievedRow(entry, chartFilters = []) {
  const categoryId = entry.categoryId;
  const location = parseDashboardLocationFilters(chartFilters);
  const hasLocation =
    location.countyIds.length > 0
    || location.subcountyIds.length > 0
    || location.wardIds.length > 0;

  let target;
  let targetSource;
  if (entry.useProjectTargets) {
    target = await sumProjectTargets(categoryId, location);
    targetSource = hasLocation
      ? 'Project unit targets (filtered)'
      : 'Project unit targets (sum)';
  } else {
    target = await loadProgrammeTarget(categoryId);
    targetSource = `M&E programme target FY ${DEFAULT_FISCAL_YEAR}`;
  }

  const achieved = await sumCategoryAchieved(categoryId, location);
  const label = entry.label || (await loadCategoryLabel(categoryId));

  return {
    categoryId,
    label,
    target,
    achieved,
    pct: pctOf(achieved, target),
    targetSource,
  };
}

function chartTargetMode(chart) {
  if (!Array.isArray(chart.filters)) return null;
  for (const item of chart.filters) {
    if (item?.field === 'target_vs_achieved' && item?.value != null) {
      const val = Array.isArray(item.value) ? item.value[0] : item.value;
      return String(val);
    }
  }
  return null;
}

function chartCategoryId(chart) {
  if (!Array.isArray(chart.filters)) return null;
  for (const item of chart.filters) {
    if (item?.field === 'indicator_category_id' && item?.operation === 'eq') {
      const vals = Array.isArray(item.value) ? item.value : [item.value];
      const id = Number(vals[0]);
      return Number.isFinite(id) ? id : null;
    }
  }
  return null;
}

async function resolvePortfolioTargetAchieved(chartFilters = []) {
  const rows = await Promise.all(COB_PORTFOLIO.map((entry) => resolveTargetAchievedRow(entry, chartFilters)));
  return rows.filter((r) => r.target > 0 || r.achieved > 0);
}

async function resolveTargetVsAchievedChart(chart) {
  const mode = chartTargetMode(chart);
  const chartType = Number(chart.type);
  const chartFilters = Array.isArray(chart.filters) ? chart.filters : [];

  if (mode === 'portfolio') {
    const rows = await resolvePortfolioTargetAchieved(chartFilters);
    const categories = rows.map((r) => r.label);
    const targetData = rows.map((r) => r.target);
    const achievedData = rows.map((r) => r.achieved);

    if (chartType === 15) {
      const totalTarget = targetData.reduce((a, b) => a + b, 0);
      const totalAchieved = achievedData.reduce((a, b) => a + b, 0);
      return {
        kind: 'render',
        categories: ['SUD portfolio'],
        series: [pctOf(totalAchieved, totalTarget, { capDisplay: true })],
        meta: { value: totalAchieved, total: totalTarget, targetVsAchieved: true },
      };
    }

    return {
      kind: 'render',
      categories,
      series: [
        { name: 'Target', data: targetData },
        { name: 'Achieved', data: achievedData },
      ],
      meta: { targetVsAchieved: true, rows },
    };
  }

  const categoryId = chartCategoryId(chart);
  if (!categoryId) {
    return { kind: 'summary', Total: [], error: 'indicator_category_id required for target vs achieved chart' };
  }

  const portfolioEntry = COB_PORTFOLIO.find((e) => e.categoryId === categoryId);
  const row = await resolveTargetAchievedRow(
    portfolioEntry || { categoryId, label: await loadCategoryLabel(categoryId) },
    chartFilters,
  );

  if (chartType === 15) {
    return {
      kind: 'render',
      categories: [row.label],
      series: [pctOf(row.achieved, row.target, { capDisplay: true })],
      meta: {
        value: row.achieved,
        total: row.target,
        targetVsAchieved: true,
        targetSource: row.targetSource,
      },
    };
  }

  if (chartType === 2 || chartType === 1) {
    return {
      kind: 'render',
      categories: [row.label],
      series: [
        { name: 'Target', data: [row.target] },
        { name: 'Achieved', data: [row.achieved] },
      ],
      meta: { targetVsAchieved: true, rows: [row] },
    };
  }

  return {
    kind: 'render',
    categories: [row.label],
    series: [{ name: 'Achieved', data: [row.achieved] }],
    meta: { targetVsAchieved: true, rows: [row] },
  };
}

function isTargetVsAchievedChart(chart) {
  return chartTargetMode(chart) != null;
}

module.exports = {
  COB_PORTFOLIO,
  isTargetVsAchievedChart,
  resolveTargetVsAchievedChart,
  resolvePortfolioTargetAchieved,
};
