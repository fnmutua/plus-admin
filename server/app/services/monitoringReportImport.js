'use strict';

/**
 * Normalize indicator_category_report rows on mobile/admin import upsert.
 * Aligns amount / progress fields with indicatorReportFields.js (main system contract).
 */

const db = require('../models');
const { buildIndicatorReportFields, isQualitativeFormat, isPercentFormat } = require('./indicatorReportFields');
const { loadLatestCumulativeByIndicator, loadProjectTargetsForProject } = require('./meReporting');
const { getMonitoringFiscalYear } = require('../../lib/projectRegions');

async function loadIndicatorCategoryMeta(indicatorCategoryIds) {
  const ids = [...new Set(indicatorCategoryIds.map((id) => Number(id)).filter(Number.isFinite))];
  if (!ids.length) return new Map();

  const rows = await db.models.indicator_category.findAll({
    where: { id: { [db.Sequelize.Op.in]: ids } },
    include: [{ model: db.models.indicator, required: false, attributes: ['format', 'unit', 'name'] }],
    attributes: ['id', 'activity_id', 'indicator_level'],
  });

  const meta = new Map();
  for (const row of rows) {
    const plain = row.get ? row.get({ plain: true }) : row;
    meta.set(Number(plain.id), {
      activity_id: plain.activity_id,
      indicator_level: plain.indicator_level,
      format: plain.indicator?.format || '',
      unit: plain.indicator?.unit || '',
    });
  }
  return meta;
}

function resolveTargetForRecord(record, targetMap) {
  const icId = Number(record.indicator_category_id);
  const configured = targetMap?.get(icId);
  if (configured?.target != null) return configured.target;
  const raw = Number(record.target);
  return Number.isFinite(raw) ? raw : 0;
}

function resolveTargetKind(record, targetMap, meta) {
  const icId = Number(record.indicator_category_id);
  const configured = targetMap?.get(icId);
  if (configured?.targetKind) return configured.targetKind;
  const format = meta?.get(icId)?.format || '';
  const unit = meta?.get(icId)?.unit || '';
  if (isPercentFormat(format) || unit === '%') return 'percent';
  return 'absolute';
}

/**
 * Enrich mobile import rows: resolve targets, recompute progress semantics when possible.
 */
async function enrichIndicatorCategoryReportRecords(dbInstance, records) {
  if (!records?.length) return records;

  const indicatorIds = records.map((r) => r.indicator_category_id).filter(Boolean);
  const meta = await loadIndicatorCategoryMeta(indicatorIds);

  const enriched = [];
  for (const orig of records) {
    const record = { ...orig };
    const icId = Number(record.indicator_category_id);
    const indicatorMeta = meta.get(icId) || { format: '', unit: '' };

    if (!record.activity_id && indicatorMeta.activity_id) {
      record.activity_id = indicatorMeta.activity_id;
    }

    const reportDate = record.date ? new Date(record.date) : new Date();
    const fiscalYear = getMonitoringFiscalYear(reportDate);
    const projectId = record.project_id != null ? Number(record.project_id) : null;
    const locId = record.project_location_id != null ? Number(record.project_location_id) : null;

    let targetMap = new Map();
    if (projectId && Number.isFinite(icId)) {
      targetMap = await loadProjectTargetsForProject(projectId, [icId], fiscalYear, locId);
    }

    const target = resolveTargetForRecord(record, targetMap);
    const targetKind = resolveTargetKind(record, targetMap, meta);
    record.target = target;

    const format = indicatorMeta.format || '';
    const unit = String(indicatorMeta.unit || '').trim().toLowerCase();
    const isQual =
      isQualitativeFormat(format) ||
      unit === 'yes/no' ||
      String(indicatorMeta.format || '').toLowerCase() === 'boolean';

    if (isQual) {
      const qualitative = record.qualitative === 'Yes' ? 'Yes' : 'No';
      record.qualitative = qualitative;
      record.amount = 0;
      const progress = qualitative === 'Yes' ? 100 : 0;
      record.progress = progress;
      record.cumProgress = progress;
      if (record.cumAmount == null) record.cumAmount = progress;
      enriched.push(record);
      continue;
    }

    let prevCum = 0;
    if (projectId && Number.isFinite(icId)) {
      const baselineMap = await loadLatestCumulativeByIndicator(
        projectId,
        [icId],
        locId,
        null,
        record.code || null,
      );
      const baseline = baselineMap.get(icId);
      if (baseline) prevCum = baseline.cumAmount ?? 0;
    }

    const amount = Number(record.amount);
    const cumFromClient = Number(record.cumAmount);
    const cumAmount = Number.isFinite(cumFromClient) && cumFromClient >= 0
      ? cumFromClient
      : (Number.isFinite(amount) ? prevCum + amount : prevCum);

    const fields = buildIndicatorReportFields({
      cumAmount,
      prevCumAmount: prevCum,
      target,
      targetKind,
      format,
      qualitative: null,
    });

    if (fields) {
      record.amount = fields.amount;
      record.cumAmount = fields.cumAmount;
      record.progress = fields.progress;
      record.cumProgress = fields.cumProgress;
      record.target = fields.target ?? target;
      record.qualitative = null;
    }

    enriched.push(record);
  }

  return enriched;
}

module.exports = {
  enrichIndicatorCategoryReportRecords,
  loadIndicatorCategoryMeta,
};
