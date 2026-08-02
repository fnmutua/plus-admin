'use strict';

/**
 * Canonical field builder for indicator_category_report rows.
 * Used by regional report approval and should be the single write contract.
 */

const { IMPLEMENTATION_STATUS_CATEGORY_ID } = require('../constants/indicatorCategories');

const PHYSICAL_PROGRESS_TARGET = 100;

function parsePercent(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return Math.round(n * 100) / 100;
}

function parseAmount(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

function isQualitativeFormat(format) {
  const f = String(format || '').toLowerCase();
  return f === 'qualitative' || f === 'yes/no' || f === 'yes_no';
}

function isPercentFormat(format) {
  return String(format || '').toLowerCase() === 'percent';
}

/** Physical / construction completion (0–100) — cat 47 and regional completion %. */
function buildPhysicalProgressReportFields(completionPct) {
  const pct = parsePercent(completionPct);
  if (pct == null) return null;
  return {
    amount: pct,
    cumAmount: pct,
    progress: pct,
    cumProgress: pct,
    target: PHYSICAL_PROGRESS_TARGET,
    qualitative: null,
  };
}

function buildIndicatorReportFields({
  cumAmount,
  prevCumAmount,
  target,
  targetKind,
  format,
  qualitative,
}) {
  const cum = parseAmount(cumAmount);
  if (cum == null) return null;
  const prev = parseAmount(prevCumAmount) ?? 0;
  const amount = Math.max(0, Math.round((cum - prev) * 100) / 100);
  const targetNum = parseAmount(target) ?? 0;
  const isQual = isQualitativeFormat(format);

  let progress;
  let cumProgress;
  if (isQual) {
    progress = qualitative === 'Yes' ? 100 : 0;
    cumProgress = progress;
  } else if (isPercentFormat(format) || targetKind === 'percent') {
    progress = amount;
    cumProgress = cum;
  } else if (targetNum > 0) {
    cumProgress = Math.round((cum / targetNum) * 10000) / 100;
    progress = cumProgress;
  } else {
    progress = 0;
    cumProgress = 0;
  }

  return {
    amount,
    cumAmount: cum,
    progress,
    cumProgress,
    target: targetNum || null,
    qualitative: isQual ? qualitative || 'No' : null,
  };
}

module.exports = {
  IMPLEMENTATION_STATUS_INDICATOR_ID: IMPLEMENTATION_STATUS_CATEGORY_ID,
  PHYSICAL_PROGRESS_TARGET,
  parsePercent,
  parseAmount,
  isQualitativeFormat,
  isPercentFormat,
  buildPhysicalProgressReportFields,
  buildIndicatorReportFields,
};
