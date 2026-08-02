/* eslint-disable prettier/prettier */
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const shortid = require('shortid');
const { Op } = require('sequelize');
const db = require('../models');
const { REGIONAL_REPORT_UPLOAD_DIR, ensureDir } = require('../config/paths.config');
const {
  CANONICAL_REGION_ORDER,
  resolveCanonicalRegion,
  getMonitoringFiscalYear,
  getCalendarQuarter,
} = require('../../lib/projectRegions');
const {
  baselineStatusSql,
  loadLatestCumulativeByIndicator,
  loadProjectTargetsForProject,
} = require('../services/meReporting');
const {
  buildPhysicalProgressReportFields,
  buildIndicatorReportFields,
  isQualitativeFormat,
  isPercentFormat,
} = require('../services/indicatorReportFields');

/** Project-level progress indicator used for regional quarterly updates. */
const DEFAULT_PROGRAMME_IMPLEMENTATION_ID = 4;

/**
 * Which existing reports count as "where this project/indicator currently stands".
 * Re-exported from meReporting — see baselineStatusSql() for rationale.
 */
const BASELINE_STATUS_SQL = baselineStatusSql('r');

const MAX_SUBMISSION_DOCUMENTS = 5;
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_DOCUMENT_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
]);
const BLOCKED_DOCUMENT_EXTENSIONS = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.msi',
  '.php',
  '.jar',
  '.com',
  '.scr',
  '.vbs',
  '.ps1',
  '.dll',
  '.apk',
  '.js',
]);

if (!fs.existsSync(REGIONAL_REPORT_UPLOAD_DIR)) {
  ensureDir(REGIONAL_REPORT_UPLOAD_DIR);
}

const regionalReportDocumentStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, REGIONAL_REPORT_UPLOAD_DIR);
  },
  filename(_req, file, cb) {
    const ext = path.extname(String(file.originalname || '')).toLowerCase();
    cb(null, `${shortid.generate()}${ext}`);
  },
});

const regionalReportDocumentUpload = multer({
  storage: regionalReportDocumentStorage,
  limits: { fileSize: MAX_DOCUMENT_BYTES, files: MAX_SUBMISSION_DOCUMENTS },
  fileFilter(_req, file, cb) {
    const ext = path.extname(String(file.originalname || '')).toLowerCase();
    if (BLOCKED_DOCUMENT_EXTENSIONS.has(ext)) {
      return cb(new Error(`File type ${ext} is not allowed`));
    }
    if (!ALLOWED_DOCUMENT_EXTENSIONS.has(ext)) {
      return cb(
        new Error('Only PDF, Word, Excel, and image files are allowed'),
      );
    }
    cb(null, true);
  },
});

function serializeSubmissionDocument(row) {
  return {
    id: row.id,
    name: row.name,
    format: row.format,
    size: row.size != null ? Number(row.size) : null,
    createdAt: row.createdAt,
  };
}

async function loadDocumentsForSubmission(submissionId) {
  const rows = await db.models.regional_report_submission_document.findAll({
    where: { regional_report_submission_id: submissionId },
    order: [['createdAt', 'ASC']],
  });
  return rows.map(serializeSubmissionDocument);
}

function cleanupUploadedFiles(files) {
  if (!Array.isArray(files)) return;
  for (const file of files) {
    try {
      if (file?.path) fs.unlinkSync(file.path);
    } catch (_) {
      // best-effort cleanup
    }
  }
}

function parsePercent(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n < 0 || n > 100) return null;
  return Math.round(n * 100) / 100;
}

function parsePeriod(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1 || n > 4) return null;
  return Math.trunc(n);
}

function parseFiscalYear(value) {
  const text = String(value || '').trim();
  if (!/^\d{4}\/\d{4}$/.test(text)) return null;
  return text;
}

function parseReportDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function parseAmount(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

// buildPhysicalProgressReportFields + buildIndicatorReportFields → indicatorReportFields.js

/** Re-export for regional controller callers. */
const IMPLEMENTATION_STATUS_INDICATOR_ID = require('../constants/indicatorCategories')
  .IMPLEMENTATION_STATUS_CATEGORY_ID;

function normalizeIndicatorRows(indicatorRows) {
  const normalized = [];
  for (const row of indicatorRows || []) {
    const indicatorCategoryId = Number(row?.indicatorCategoryId);
    const qualitative =
      row?.qualitative == null || row?.qualitative === ''
        ? null
        : String(row.qualitative).trim();

    // Target supplied on the public form. Only a proposal — a configured FY target
    // still overrides it in enrichIndicatorPayloadRows.
    const submittedTarget = parseAmount(row?.target);
    const submittedTargetKind =
      row?.targetKind === 'percent' || row?.targetKind === 'absolute' ? row.targetKind : null;

    if (Number.isFinite(indicatorCategoryId) && (qualitative === 'Yes' || qualitative === 'No')) {
      normalized.push({
        indicatorCategoryId,
        cumAmount: qualitative === 'Yes' ? 1 : 0,
        qualitative,
        submittedTarget,
        submittedTargetKind,
      });
      continue;
    }

    const cumAmount = parseAmount(row?.cumAmount);
    if (!Number.isFinite(indicatorCategoryId) || cumAmount == null) continue;
    normalized.push({
      indicatorCategoryId,
      cumAmount,
      qualitative: null,
      submittedTarget,
      submittedTargetKind,
    });
  }
  return normalized;
}

function reportRowKey(projectId, indicatorCategoryId) {
  return `${Number(projectId)}:${Number(indicatorCategoryId)}`;
}

async function loadReportableIndicatorsForProject(projectId, transaction) {
  const pid = Number(projectId);
  if (!Number.isFinite(pid)) return [];

  const projectActivities = await db.models.project_activity.findAll({
    where: { project_id: pid },
    attributes: ['activity_id'],
    transaction,
  });
  const activityIds = [
    ...new Set(projectActivities.map((row) => Number(row.activity_id)).filter(Number.isFinite)),
  ];

  const scopeConditions = [{ indicator_level: 'project' }];
  if (activityIds.length) {
    scopeConditions.push({ activity_id: { [Op.in]: activityIds } });
  }

  return db.models.indicator_category.findAll({
    where: {
      id: { [Op.ne]: IMPLEMENTATION_STATUS_INDICATOR_ID },
      [Op.or]: scopeConditions,
    },
    include: [
      {
        model: db.models.indicator,
        required: true,
        attributes: ['id', 'name', 'format', 'unit', 'type'],
      },
    ],
    attributes: [
      'id',
      'indicator_name',
      'category_title',
      'indicator_level',
      'activity_id',
      'indicator_id',
    ],
    order: [
      ['indicator_level', 'ASC'],
      ['category_title', 'ASC'],
      ['id', 'ASC'],
    ],
    transaction,
  });
}

async function validateIndicatorRowsForProjects(normalizedRows, region, transaction, excludeFilingCode) {
  const projectIds = [...new Set(normalizedRows.map((row) => row.projectId))];
  const { projectById, locationByProject } = await loadProjectContext(
    projectIds,
    region,
    transaction,
  );

  for (const row of normalizedRows) {
    const indicators = row.indicators || [];
    if (!indicators.length) continue;

    const project = projectById.get(row.projectId);
    if (!project) {
      const error = new Error(`Project #${row.projectId} is invalid for this regional report`);
      error.statusCode = 400;
      throw error;
    }

    const location = locationByProject.get(row.projectId);
    const reportable = await loadReportableIndicatorsForProject(row.projectId, transaction);
    const allowedIds = new Set(reportable.map((category) => Number(category.id)));
    const indicatorIds = indicators.map((ind) => ind.indicatorCategoryId);

    for (const indicatorCategoryId of indicatorIds) {
      if (!allowedIds.has(indicatorCategoryId)) {
        const error = new Error(
          `Indicator #${indicatorCategoryId} is not reportable for project "${project.title}"`,
        );
        error.statusCode = 400;
        throw error;
      }
    }

    const baselineByIndicator = await loadLatestCumulativeByIndicator(
      row.projectId,
      indicatorIds,
      location?.id || null,
      transaction,
      excludeFilingCode,
    );

    for (const ind of indicators) {
      const category = reportable.find((item) => Number(item.id) === ind.indicatorCategoryId);
      const isQual = isQualitativeFormat(category?.indicator?.format);

      if (isQual) {
        if (ind.qualitative !== 'Yes' && ind.qualitative !== 'No') {
          const label = category
            ? `${category.indicator_name} ${category.category_title}`.trim()
            : `Indicator #${ind.indicatorCategoryId}`;
          const error = new Error(`Select Yes or No for "${label}" on "${project.title}"`);
          error.statusCode = 400;
          throw error;
        }
        ind.minCumAmount = 0;
        continue;
      }

      const baseline = baselineByIndicator.get(ind.indicatorCategoryId)?.cumAmount ?? 0;
      if (ind.cumAmount + 1e-6 < baseline) {
        const label = category
          ? `${category.indicator_name} ${category.category_title}`.trim()
          : `Indicator #${ind.indicatorCategoryId}`;
        const error = new Error(
          `Cumulative amount for "${label}" on "${project.title}" cannot be below ${baseline}`,
        );
        error.statusCode = 400;
        throw error;
      }
      ind.minCumAmount = baseline;
    }
  }
}

async function enrichIndicatorPayloadRows(normalizedRows, region, fiscalYear, transaction) {
  for (const row of normalizedRows) {
    if (!row.indicators?.length) continue;

    const reportable = await loadReportableIndicatorsForProject(row.projectId, transaction);
    const categoryById = new Map(reportable.map((category) => [Number(category.id), category]));
    const { locationByProject } = await loadProjectContext([row.projectId], region, transaction);
    const location = locationByProject.get(row.projectId);
    const targets = await loadProjectTargetsForProject(
      row.projectId,
      row.indicators.map((ind) => ind.indicatorCategoryId),
      fiscalYear,
      location?.id || null,
      transaction,
    );

    for (const ind of row.indicators) {
      const category = categoryById.get(ind.indicatorCategoryId);
      if (category) {
        ind.label = [category.indicator_name, category.category_title].filter(Boolean).join(' ').trim();
        ind.unit = category.indicator?.unit || '';
        ind.isQualitative = isQualitativeFormat(category.indicator?.format);
      }
      // A target configured for the fiscal year is authoritative; a target typed on the
      // public form only fills the gap where none has been set yet. `needsTargetRow`
      // marks that gap so approval can persist it (see upsertApprovedIndicatorReports).
      const targetMeta = targets.get(ind.indicatorCategoryId);
      if (targetMeta && targetMeta.target != null) {
        ind.target = targetMeta.target;
        ind.targetKind = targetMeta.targetKind;
        ind.needsTargetRow = false;
      } else if (ind.submittedTarget != null && ind.submittedTarget > 0) {
        ind.target = ind.submittedTarget;
        ind.targetKind =
          ind.submittedTargetKind ||
          (isPercentFormat(category?.indicator?.format) ? 'percent' : 'absolute');
        ind.needsTargetRow = true;
      } else {
        ind.needsTargetRow = false;
      }
    }
  }
}

function buildReviewComment(submission, row) {
  const parts = [
    `[Regional report ${submission.filing_code}]`,
    `Submitted by ${submission.submitter_name}`,
  ];
  if (submission.submitter_title) parts.push(`(${submission.submitter_title})`);
  if (submission.co_submitters) parts.push(`Co-submitters: ${submission.co_submitters}`);
  if (row.remarks) parts.push(`Remarks: ${row.remarks}`);
  if (row.workersOnSite != null && row.workersOnSite !== '') {
    parts.push(`Workers on site: ${row.workersOnSite}`);
  }
  return parts.join(' · ').slice(0, 950);
}

function formatFilingDateKey(reportDate) {
  const d = reportDate ? new Date(reportDate) : new Date();
  if (Number.isNaN(d.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  }
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

async function generateNextFilingCode(reportDate, transaction) {
  const dateKey = formatFilingDateKey(reportDate);
  const existing = await db.models.regional_report_submission.findAll({
    where: {
      filing_code: {
        [Op.like]: `${dateKey}-%`,
      },
    },
    attributes: ['filing_code'],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  let maxSeq = 0;
  for (const row of existing) {
    const match = String(row.filing_code || '').match(/^\d{8}-(\d+)$/);
    if (match) maxSeq = Math.max(maxSeq, Number(match[1]));
  }

  return `${dateKey}-${String(maxSeq + 1).padStart(3, '0')}`;
}

async function loadCurrentProgressByProject(projectIds, transaction, excludeFilingCode = null) {
  const ids = [...new Set(projectIds.map((id) => Number(id)).filter(Number.isFinite))];
  if (!ids.length) return new Map();

  const excludeCode = excludeFilingCode ? String(excludeFilingCode) : null;

  const [rows] = await db.sequelize.query(
    `
      SELECT
        p.id AS project_id,
        p.title,
        COALESCE(latest.cum_progress, pl.physical_progress_pct, 0) AS current_progress
      FROM project p
      LEFT JOIN LATERAL (
        SELECT pl2.id, pl2.physical_progress_pct
        FROM project_location pl2
        WHERE pl2.project_id = p.id
        ORDER BY pl2.id
        LIMIT 1
      ) pl ON TRUE
      LEFT JOIN LATERAL (
        SELECT COALESCE(r."cumProgress", r.progress) AS cum_progress
        FROM indicator_category_report r
        WHERE r.project_id = p.id
          AND r.indicator_category_id = ${IMPLEMENTATION_STATUS_INDICATOR_ID}
          AND ${BASELINE_STATUS_SQL}
          ${excludeCode ? 'AND COALESCE(r.code, \'\') <> :excludeCode' : ''}
        ORDER BY r.id DESC
        LIMIT 1
      ) latest ON TRUE
      WHERE p.id IN (:projectIds)
    `,
    {
      replacements: { projectIds: ids, ...(excludeCode ? { excludeCode } : {}) },
      ...(transaction ? { transaction } : {}),
    },
  );

  const byProject = new Map();
  for (const row of rows) {
    const progress = Number(row.current_progress);
    byProject.set(Number(row.project_id), {
      title: String(row.title || ''),
      currentProgress:
        Number.isFinite(progress) && progress >= 0 ? Math.round(progress * 100) / 100 : 0,
    });
  }
  return byProject;
}

async function loadProjectContext(projectIds, region, transaction) {
  const ids = [...new Set(projectIds.map((id) => Number(id)).filter(Number.isFinite))];
  if (!ids.length) {
    return { projectById: new Map(), locationByProject: new Map() };
  }

  const projects = await db.models.project.findAll({
    where: { id: ids, ...(region ? { region } : {}) },
    attributes: ['id', 'title', 'implementation_id', 'region'],
    transaction,
  });
  const projectById = new Map(projects.map((project) => [Number(project.id), project]));

  const locations = await db.models.project_location.findAll({
    where: { project_id: ids },
    attributes: ['id', 'project_id', 'county_id'],
    order: [['id', 'ASC']],
    transaction,
  });
  const locationByProject = new Map();
  for (const loc of locations) {
    const pid = Number(loc.project_id);
    if (!locationByProject.has(pid)) locationByProject.set(pid, loc);
  }

  return { projectById, locationByProject };
}

/**
 * Create the FY target a submitter proposed, when none is configured for that
 * project/indicator/fiscal-year. Re-checks inside the transaction rather than trusting
 * the earlier read, and never updates an existing row.
 */
async function ensureIndicatorTargetRow({
  projectId,
  projectLocationId,
  indicatorCategoryId,
  fiscalYear,
  targetValue,
  targetKind,
  reviewerId,
  transaction,
}) {
  const value = parseAmount(targetValue);
  if (value == null || value <= 0 || !fiscalYear) return;

  const existing = await db.models.indicator_target.findOne({
    where: {
      project_id: Number(projectId),
      indicator_category_id: Number(indicatorCategoryId),
      fiscal_year: fiscalYear,
    },
    transaction,
  });
  if (existing) return;

  await db.models.indicator_target.create(
    {
      indicator_category_id: Number(indicatorCategoryId),
      fiscal_year: fiscalYear,
      scope_type: 'project',
      project_id: Number(projectId),
      project_location_id: projectLocationId || null,
      target_value: value,
      target_kind: targetKind === 'percent' ? 'percent' : 'absolute',
      notes: 'Set from regional progress report submission',
      createdBy: reviewerId || null,
    },
    { transaction },
  );
}

async function upsertApprovedIndicatorReports(submission, normalizedRows, reviewerId, transaction) {
  const projectIds = normalizedRows.map((row) => row.projectId);
  const { projectById, locationByProject } = await loadProjectContext(
    projectIds,
    submission.region,
    transaction,
  );

  const existingReports = await db.models.indicator_category_report.findAll({
    where: { code: submission.filing_code },
    transaction,
  });
  const reportByKey = new Map(
    existingReports.map((report) => [
      reportRowKey(report.project_id, report.indicator_category_id),
      report,
    ]),
  );

  const allIndicatorIds = new Set([IMPLEMENTATION_STATUS_INDICATOR_ID]);
  for (const row of normalizedRows) {
    for (const ind of row.indicators || []) {
      allIndicatorIds.add(ind.indicatorCategoryId);
    }
  }

  const indicatorCategories = await db.models.indicator_category.findAll({
    where: { id: [...allIndicatorIds] },
    include: [{ model: db.models.indicator, attributes: ['format'] }],
    transaction,
  });
  const categoryById = new Map(
    indicatorCategories.map((category) => [Number(category.id), category]),
  );

  const targetByProjectIndicator = new Map();
  for (const row of normalizedRows) {
    const indicatorIds = (row.indicators || []).map((ind) => ind.indicatorCategoryId);
    if (!indicatorIds.length) continue;
    const location = locationByProject.get(row.projectId);
    const targets = await loadProjectTargetsForProject(
      row.projectId,
      indicatorIds,
      submission.fiscal_year,
      location?.id || null,
      transaction,
    );
    for (const [icId, targetRow] of targets.entries()) {
      targetByProjectIndicator.set(reportRowKey(row.projectId, icId), targetRow);
    }
  }

  for (const row of normalizedRows) {
    const project = projectById.get(row.projectId);
    if (!project) {
      const error = new Error(`Project #${row.projectId} is invalid for this regional report`);
      error.statusCode = 400;
      throw error;
    }

    const location = locationByProject.get(row.projectId);
    const comments = buildReviewComment(submission, row);

    if (row.completionPct != null) {
      const progressFields = buildPhysicalProgressReportFields(row.completionPct);
      if (progressFields) {
        const payload = {
          indicator_category_id: IMPLEMENTATION_STATUS_INDICATOR_ID,
          programme_implementation_id:
            Number(project.implementation_id) || DEFAULT_PROGRAMME_IMPLEMENTATION_ID,
          project_id: project.id,
          project_location_id: location?.id || null,
          county_id: location?.county_id || null,
          activity_id: null,
          period: String(submission.period),
          date: submission.report_date,
          ...progressFields,
          status: 'Approved',
          comments,
          code: submission.filing_code,
          userId: reviewerId,
          reject_msg: null,
        };

        const key = reportRowKey(row.projectId, IMPLEMENTATION_STATUS_INDICATOR_ID);
        const existing = reportByKey.get(key);
        if (existing) {
          await existing.update(payload, { transaction });
        } else {
          await db.models.indicator_category_report.create(
            {
              ...payload,
              createdBy: reviewerId,
            },
            { transaction },
          );
        }

        if (location?.id) {
          await db.models.project_location.update(
            { physical_progress_pct: row.completionPct },
            { where: { id: location.id }, transaction },
          );
        }
      }
    }

    for (const ind of row.indicators || []) {
      const category = categoryById.get(ind.indicatorCategoryId);
      if (!category) continue;

      const targetMeta = targetByProjectIndicator.get(
        reportRowKey(row.projectId, ind.indicatorCategoryId),
      );

      // Commit a submitter-proposed target only at approval, and only where the fiscal
      // year has none configured — a public submission must never overwrite a target
      // set by staff. Persisting it means progress % stays computable next quarter.
      if (!targetMeta && ind.needsTargetRow && ind.target > 0) {
        await ensureIndicatorTargetRow({
          projectId: project.id,
          projectLocationId: location?.id || null,
          indicatorCategoryId: ind.indicatorCategoryId,
          fiscalYear: submission.fiscal_year,
          targetValue: ind.target,
          targetKind: ind.targetKind || 'absolute',
          reviewerId,
          transaction,
        });
      }

      const baseline = ind.minCumAmount ?? 0;
      const progressFields = buildIndicatorReportFields({
        cumAmount: ind.cumAmount,
        prevCumAmount: baseline,
        target: targetMeta?.target ?? ind.target ?? null,
        targetKind: targetMeta?.targetKind || ind.targetKind || 'absolute',
        format: category.indicator?.format,
        qualitative: ind.qualitative,
      });
      if (!progressFields) continue;

      const payload = {
        indicator_category_id: ind.indicatorCategoryId,
        programme_implementation_id:
          Number(project.implementation_id) || DEFAULT_PROGRAMME_IMPLEMENTATION_ID,
        project_id: project.id,
        project_location_id: location?.id || null,
        county_id: location?.county_id || null,
        activity_id: category.activity_id || null,
        period: String(submission.period),
        date: submission.report_date,
        ...progressFields,
        status: 'Approved',
        comments,
        code: submission.filing_code,
        userId: reviewerId,
        reject_msg: null,
      };

      const key = reportRowKey(row.projectId, ind.indicatorCategoryId);
      const existing = reportByKey.get(key);
      if (existing) {
        await existing.update(payload, { transaction });
      } else {
        await db.models.indicator_category_report.create(
          {
            ...payload,
            createdBy: reviewerId,
          },
          { transaction },
        );
      }
    }
  }
}

async function rejectIndicatorReportsForSubmission(
  submission,
  normalizedRows,
  reviewerId,
  rejectReason,
  transaction,
) {
  const indicatorReports = await loadIndicatorReportsForSubmission(submission, transaction);
  if (!indicatorReports.length) return;

  const projectIds = normalizedRows.map((row) => row.projectId);
  const baselineByProject = await loadCurrentProgressByProject(
    projectIds,
    transaction,
    submission.filing_code,
  );

  for (const report of indicatorReports) {
    await report.update(
      {
        status: 'Rejected',
        reject_msg: rejectReason,
        userId: reviewerId,
      },
      { transaction },
    );

    const baseline = baselineByProject.get(Number(report.project_id))?.currentProgress ?? 0;
    if (report.project_location_id) {
      await db.models.project_location.update(
        { physical_progress_pct: baseline },
        { where: { id: report.project_location_id }, transaction },
      );
    }
  }
}

exports.getPublicRegionalReportMeta = async (_req, res) => {
  try {
    return res.json({
      regions: CANONICAL_REGION_ORDER,
      defaultFiscalYear: getMonitoringFiscalYear(),
      defaultPeriod: getCalendarQuarter(),
    });
  } catch (error) {
    console.error('getPublicRegionalReportMeta error', error);
    return res.status(500).json({ message: 'Could not load form settings' });
  }
};

exports.getPublicRegionalReportProgrammes = async (_req, res) => {
  try {
    const [programmes, components] = await Promise.all([
      db.sequelize.query(
        `
          SELECT id, title, acronym, "parentId"
          FROM programmex
          ORDER BY title ASC
        `,
        { type: db.sequelize.QueryTypes.SELECT, mapToModel: false },
      ),
      db.sequelize.query(
        `
          SELECT id, title, acronym, programme_id
          FROM component
          ORDER BY title ASC
        `,
        { type: db.sequelize.QueryTypes.SELECT, mapToModel: false },
      ),
    ]);

    return res.json({
      programmes: programmes.map((row) => ({
        id: Number(row.id),
        title: String(row.title || ''),
        acronym: String(row.acronym || ''),
        parentId: row.parentId != null ? Number(row.parentId) : null,
      })),
      components: components.map((row) => ({
        id: Number(row.id),
        title: String(row.title || ''),
        acronym: String(row.acronym || ''),
        programme_id: row.programme_id != null ? Number(row.programme_id) : null,
      })),
    });
  } catch (error) {
    console.error('getPublicRegionalReportProgrammes error', error);
    return res.status(500).json({ message: 'Could not load programmes' });
  }
};

exports.getPublicRegionalReportProjects = async (req, res) => {
  try {
    const region = resolveCanonicalRegion(req.query.region);
    if (!region) {
      return res.status(400).json({ message: 'Select a valid region' });
    }

    const [rows] = await db.sequelize.query(
      `
        SELECT
          p.id,
          p.title,
          p.project_code,
          p.status,
          p.region,
          pl.id AS project_location_id,
          pl.county_id,
          c.name AS county_name,
          pl.physical_progress_pct,
          p.component_id,
          COALESCE(latest.cum_progress, pl.physical_progress_pct) AS current_progress
        FROM project p
        LEFT JOIN LATERAL (
          SELECT pl2.id, pl2.county_id, pl2.physical_progress_pct
          FROM project_location pl2
          WHERE pl2.project_id = p.id
          ORDER BY pl2.id
          LIMIT 1
        ) pl ON TRUE
        LEFT JOIN county c ON c.id = pl.county_id
        LEFT JOIN LATERAL (
          SELECT COALESCE(r."cumProgress", r.progress) AS cum_progress
          FROM indicator_category_report r
          WHERE r.project_id = p.id
            AND r.indicator_category_id = ${IMPLEMENTATION_STATUS_INDICATOR_ID}
            AND ${BASELINE_STATUS_SQL}
          ORDER BY r.id DESC
          LIMIT 1
        ) latest ON TRUE
        WHERE p.region = :region
        ORDER BY c.name NULLS LAST, p.title
      `,
      { replacements: { region } },
    );

    return res.json({
      region,
      projects: rows.map((row) => {
        const progress =
          row.current_progress != null && row.current_progress !== ''
            ? Number(row.current_progress)
            : null
        const currentProgress =
          progress != null && Number.isFinite(progress) && progress >= 0
            ? Math.round(progress * 100) / 100
            : null

        return {
        id: Number(row.id),
        title: String(row.title || ''),
        projectCode: String(row.project_code || ''),
        status: String(row.status || ''),
        county: String(row.county_name || ''),
        projectLocationId: row.project_location_id != null ? Number(row.project_location_id) : null,
        countyId: row.county_id != null ? Number(row.county_id) : null,
        componentId: row.component_id != null ? Number(row.component_id) : null,
        currentProgress,
      }
      }),
    });
  } catch (error) {
    console.error('getPublicRegionalReportProjects error', error);
    return res.status(500).json({ message: 'Could not load regional projects' });
  }
};

exports.getPublicRegionalReportProjectIndicators = async (req, res) => {
  try {
    const region = resolveCanonicalRegion(req.query.region);
    const projectId = Number(req.query.projectId);
    const fiscalYear = parseFiscalYear(req.query.fiscalYear) || getMonitoringFiscalYear();

    if (!region) {
      return res.status(400).json({ message: 'Select a valid region' });
    }
    if (!Number.isFinite(projectId)) {
      return res.status(400).json({ message: 'Select a valid project' });
    }

    const project = await db.models.project.findOne({
      where: { id: projectId, region },
      attributes: ['id', 'title'],
    });
    if (!project) {
      return res.status(404).json({ message: 'Project not found in this region' });
    }

    const locations = await db.models.project_location.findAll({
      where: { project_id: projectId },
      attributes: ['id'],
      order: [['id', 'ASC']],
      limit: 1,
    });
    const projectLocationId = locations[0]?.id != null ? Number(locations[0].id) : null;

    const categories = await loadReportableIndicatorsForProject(projectId);
    const indicatorIds = categories.map((category) => Number(category.id));
    const [baselineByIndicator, targetByIndicator] = await Promise.all([
      loadLatestCumulativeByIndicator(
        projectId,
        indicatorIds,
        projectLocationId,
        null,
        null,
      ),
      loadProjectTargetsForProject(
        projectId,
        indicatorIds,
        fiscalYear,
        projectLocationId,
        null,
      ),
    ]);

    const indicators = categories.map((category) => {
      const icId = Number(category.id);
      const baseline = baselineByIndicator.get(icId) || {
        cumAmount: 0,
        amount: 0,
        target: null,
        qualitative: null,
      };
      const targetMeta = targetByIndicator.get(icId);
      const indicator = category.indicator || {};
      const label = [category.indicator_name, category.category_title].filter(Boolean).join(' ').trim();
      const format = String(indicator.format || '').toLowerCase();
      const isQualitative = isQualitativeFormat(format);

      return {
        indicatorCategoryId: icId,
        label,
        unit: indicator.unit || '',
        format,
        indicatorLevel: category.indicator_level || '',
        activityId: category.activity_id != null ? Number(category.activity_id) : null,
        minCumAmount: baseline.cumAmount,
        currentQualitative: baseline.qualitative,
        target: targetMeta?.target ?? baseline.target,
        targetKind: targetMeta?.targetKind || (isPercentFormat(format) ? 'percent' : 'absolute'),
        isQualitative,
      };
    });

    return res.json({
      projectId,
      fiscalYear,
      indicators,
    });
  } catch (error) {
    console.error('getPublicRegionalReportProjectIndicators error', error);
    return res.status(500).json({ message: 'Could not load project indicators' });
  }
};

exports.submitPublicRegionalReport = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const region = resolveCanonicalRegion(req.body?.region);
    const fiscalYear = parseFiscalYear(req.body?.fiscalYear);
    const period = parsePeriod(req.body?.period);
    const reportDate = parseReportDate(req.body?.reportDate);
    const submitterName = String(req.body?.submitterName || '').trim();
    const submitterTitle = String(req.body?.submitterTitle || '').trim() || null;
    const coSubmitters = String(req.body?.coSubmitters || '').trim() || null;
    const notes = String(req.body?.notes || '').trim() || null;
    const metadata =
      req.body?.metadata && typeof req.body.metadata === 'object' ? req.body.metadata : {};
    const projectRows = Array.isArray(req.body?.projects) ? req.body.projects : [];

    if (!region) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Select a valid region' });
    }
    if (!fiscalYear) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Select a valid fiscal year (e.g. 2025/2026)' });
    }
    if (!period) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Select a valid quarter (1–4)' });
    }
    if (!reportDate) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Enter the report date' });
    }
    if (submitterName.length < 2) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Enter the name of the person submitting this report' });
    }

    const normalizedRows = [];
    for (const row of projectRows) {
      const projectId = Number(row?.projectId);
      const completionPct =
        row?.completionPct == null || row?.completionPct === ''
          ? null
          : parsePercent(row?.completionPct);
      const indicators = normalizeIndicatorRows(row?.indicators);

      if (!Number.isFinite(projectId)) continue;
      if (completionPct == null && !indicators.length) continue;

      normalizedRows.push({
        projectId,
        completionPct,
        remarks: String(row?.remarks || '').trim() || null,
        workersOnSite:
          row?.workersOnSite == null || row?.workersOnSite === ''
            ? null
            : String(row.workersOnSite).trim(),
        indicators,
      });
    }

    if (!normalizedRows.length) {
      await transaction.rollback();
      return res.status(400).json({
        message: 'Enter progress or indicator updates for at least one project',
      });
    }

    const projectIds = [...new Set(normalizedRows.map((row) => row.projectId))];
    const { projectById } = await loadProjectContext(projectIds, region, transaction);

    if (projectById.size !== projectIds.length) {
      await transaction.rollback();
      return res.status(400).json({ message: 'One or more projects are invalid for the selected region' });
    }

    const progressByProject = await loadCurrentProgressByProject(projectIds, transaction);
    for (const row of normalizedRows) {
      if (row.completionPct == null) continue;
      const baseline = progressByProject.get(row.projectId)?.currentProgress ?? 0;
      if (row.completionPct + 1e-6 < baseline) {
        const title = progressByProject.get(row.projectId)?.title || `Project #${row.projectId}`;
        await transaction.rollback();
        return res.status(400).json({
          message: `Progress for "${title.trim()}" cannot be below the current ${baseline}%`,
        });
      }
    }

    await validateIndicatorRowsForProjects(normalizedRows, region, transaction);
    await enrichIndicatorPayloadRows(normalizedRows, region, fiscalYear, transaction);

    const filingCode = await generateNextFilingCode(reportDate, transaction);
    const submissionPayload = {
      region,
      fiscalYear,
      period,
      reportDate,
      submitterName,
      submitterTitle,
      coSubmitters,
      notes,
      projects: normalizedRows,
    };

    const submission = await db.models.regional_report_submission.create(
      {
        filing_code: filingCode,
        region,
        fiscal_year: fiscalYear,
        period,
        report_date: reportDate,
        submitter_name: submitterName,
        submitter_title: submitterTitle,
        co_submitters: coSubmitters,
        notes,
        status: 'submitted',
        project_count: normalizedRows.length,
        metadata: {
          ...metadata,
          source: 'public_regional_report',
          submittedAt: new Date().toISOString(),
          userAgent: String(req.headers['user-agent'] || '').slice(0, 500),
          payload: submissionPayload,
        },
      },
      { transaction },
    );

    await transaction.commit();

    return res.status(201).json({
      message: 'Regional report submitted successfully',
      filingCode,
      submissionId: submission.id,
      projectCount: normalizedRows.length,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('submitPublicRegionalReport error', error);
    return res.status(500).json({ message: 'Could not submit regional report' });
  }
};

function serializeSubmission(row) {
  const review = row.metadata?.review || {};
  return {
    id: row.id,
    filingCode: row.filing_code,
    region: row.region,
    fiscalYear: row.fiscal_year,
    period: row.period,
    reportDate: row.report_date,
    submitterName: row.submitter_name,
    submitterTitle: row.submitter_title,
    coSubmitters: row.co_submitters,
    notes: row.notes,
    status: row.status,
    projectCount: row.project_count,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    reviewNotes: review.notes || null,
    rejectReason: review.rejectReason || null,
    reviewedAt: review.reviewedAt || null,
    reviewedBy: review.reviewedByName || null,
  };
}

async function loadIndicatorReportsForSubmission(submission, transaction) {
  return db.models.indicator_category_report.findAll({
    where: { code: submission.filing_code },
    attributes: [
      'id',
      'project_id',
      'indicator_category_id',
      'project_location_id',
      'status',
      'progress',
      'cumProgress',
      'reject_msg',
    ],
    transaction,
  });
}

function normalizeReviewProjectRows(projectRows) {
  const normalizedRows = [];
  for (const row of projectRows) {
    const projectId = Number(row?.projectId);
    const completionPct =
      row?.completionPct == null || row?.completionPct === ''
        ? null
        : parsePercent(row?.completionPct);
    const indicators = normalizeIndicatorRows(row?.indicators);

    if (!Number.isFinite(projectId)) continue;
    if (completionPct == null && !indicators.length) continue;

    normalizedRows.push({
      projectId,
      completionPct,
      remarks: String(row?.remarks || '').trim() || null,
      workersOnSite:
        row?.workersOnSite == null || row?.workersOnSite === ''
          ? null
          : String(row.workersOnSite).trim(),
      indicators: indicators.map((ind) => ({
        ...ind,
        target: ind.target != null ? parseAmount(ind.target) : null,
        targetKind: ind.targetKind || null,
        minCumAmount: ind.minCumAmount != null ? parseAmount(ind.minCumAmount) : null,
        label: ind.label || null,
        unit: ind.unit || null,
      })),
    });
  }
  return normalizedRows;
}

async function applySubmissionProjectUpdates(submission, normalizedRows, transaction) {
  const progressByProject = await loadCurrentProgressByProject(
    normalizedRows.map((row) => row.projectId),
    transaction,
    submission.filing_code,
  );

  for (const row of normalizedRows) {
    if (row.completionPct == null) continue;
    const baseline = progressByProject.get(row.projectId)?.currentProgress ?? 0;
    if (row.completionPct + 1e-6 < baseline) {
      const title = progressByProject.get(row.projectId)?.title || `Project #${row.projectId}`;
      const error = new Error(`Progress for "${title.trim()}" cannot be below the current ${baseline}%`);
      error.statusCode = 400;
      throw error;
    }
  }

  await validateIndicatorRowsForProjects(
    normalizedRows,
    submission.region,
    transaction,
    submission.filing_code,
  );
  await enrichIndicatorPayloadRows(
    normalizedRows,
    submission.region,
    submission.fiscal_year,
    transaction,
  );

  const payload = submission.metadata?.payload || {};
  const nextMetadata = {
    ...(submission.metadata || {}),
    payload: {
      ...payload,
      projects: normalizedRows,
    },
  };

  await submission.update(
    {
      project_count: normalizedRows.length,
      metadata: nextMetadata,
    },
    { transaction },
  );

  submission.metadata = nextMetadata;
}

async function enrichSubmissionProjects(submission) {
  const payload = submission.metadata?.payload;
  const projectRows = Array.isArray(payload?.projects) ? payload.projects : [];
  const projectIds = [...new Set(projectRows.map((row) => Number(row.projectId)).filter(Boolean))];

  let projectsById = new Map();
  if (projectIds.length) {
    const projects = await db.models.project.findAll({
      where: { id: projectIds },
      attributes: ['id', 'title', 'project_code', 'region'],
    });
    projectsById = new Map(projects.map((project) => [Number(project.id), project]));
  }

  const indicatorReports = await loadIndicatorReportsForSubmission(submission);
  const reportByKey = new Map(
    indicatorReports.map((report) => [
      reportRowKey(report.project_id, report.indicator_category_id),
      report,
    ]),
  );

  const baselineByProject = await loadCurrentProgressByProject(
    projectIds,
    null,
    submission.filing_code,
  );

  const projects = projectRows.map((row) => {
    const project = projectsById.get(Number(row.projectId));
    const progressReport = reportByKey.get(
      reportRowKey(row.projectId, IMPLEMENTATION_STATUS_INDICATOR_ID),
    );
    const baseline = baselineByProject.get(Number(row.projectId))?.currentProgress ?? 0;
    return {
      projectId: Number(row.projectId),
      title: project?.title || `Project #${row.projectId}`,
      projectCode: project?.project_code || '',
      region: project?.region || '',
      completionPct: row.completionPct,
      minCompletionPct: baseline,
      remarks: row.remarks,
      workersOnSite: row.workersOnSite,
      indicatorReportId: progressReport?.id != null ? Number(progressReport.id) : null,
      indicatorStatus: progressReport?.status || null,
      indicators: (row.indicators || []).map((ind) => {
        const report = reportByKey.get(reportRowKey(row.projectId, ind.indicatorCategoryId));
        return {
          indicatorCategoryId: Number(ind.indicatorCategoryId),
          label: ind.label || null,
          unit: ind.unit || null,
          cumAmount: ind.cumAmount,
          minCumAmount: ind.minCumAmount ?? null,
          target: ind.target ?? null,
          targetKind: ind.targetKind || null,
          qualitative: ind.qualitative ?? null,
          isQualitative: ind.isQualitative ?? Boolean(ind.qualitative),
          indicatorReportId: report?.id != null ? Number(report.id) : null,
          indicatorStatus: report?.status || null,
        };
      }),
    };
  });

  return {
    ...serializeSubmission(submission),
    metadata: submission.metadata,
    projects,
    documents: await loadDocumentsForSubmission(submission.id),
  };
}

exports.getRegionalReportSubmissions = async (req, res) => {
  try {
    const {
      region,
      fiscalYear,
      period,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const where = {};
    const canonicalRegion = resolveCanonicalRegion(region);
    if (canonicalRegion) where.region = canonicalRegion;

    const parsedFiscalYear = parseFiscalYear(fiscalYear);
    if (parsedFiscalYear) where.fiscal_year = parsedFiscalYear;

    const parsedPeriod = parsePeriod(period);
    if (parsedPeriod) where.period = parsedPeriod;

    const searchText = String(search || '').trim();
    if (searchText) {
      where[Op.or] = [
        { filing_code: { [Op.iLike]: `%${searchText}%` } },
        { submitter_name: { [Op.iLike]: `%${searchText}%` } },
        { co_submitters: { [Op.iLike]: `%${searchText}%` } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * pageSize;

    const { count, rows } = await db.models.regional_report_submission.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset,
    });

    return res.status(200).json({
      code: '0000',
      message: 'OK',
      results: {
        total: count,
        data: rows.map(serializeSubmission),
      },
    });
  } catch (error) {
    console.error('getRegionalReportSubmissions error', error);
    return res.status(500).json({ code: '5000', message: 'Could not load regional report submissions' });
  }
};

exports.getRegionalReportSubmissionById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ code: '4000', message: 'Invalid submission id' });
    }

    const submission = await db.models.regional_report_submission.findByPk(id);
    if (!submission) {
      return res.status(404).json({ code: '4004', message: 'Submission not found' });
    }

    const results = await enrichSubmissionProjects(submission);
    return res.status(200).json({ code: '0000', results });
  } catch (error) {
    console.error('getRegionalReportSubmissionById error', error);
    return res.status(500).json({ code: '5000', message: 'Could not load regional report submission' });
  }
};

exports.reviewRegionalReportSubmission = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      await transaction.rollback();
      return res.status(400).json({ code: '4000', message: 'Invalid submission id' });
    }

    const action = String(req.body?.action || '').trim().toLowerCase();
    if (!['save', 'approve', 'reject'].includes(action)) {
      await transaction.rollback();
      return res.status(400).json({ code: '4000', message: 'Invalid action. Use save, approve, or reject.' });
    }

    const submission = await db.models.regional_report_submission.findByPk(id, { transaction });
    if (!submission) {
      await transaction.rollback();
      return res.status(404).json({ code: '4004', message: 'Submission not found' });
    }

    const currentStatus = String(submission.status || 'submitted').toLowerCase();
    if (currentStatus === 'approved' || currentStatus === 'rejected') {
      await transaction.rollback();
      return res.status(400).json({ code: '4000', message: 'This submission has already been finalized' });
    }

    const reviewer = await db.models.users.findByPk(req.userid, {
      attributes: ['id', 'name', 'email'],
      transaction,
    });

    const reviewNotes = String(req.body?.reviewNotes || '').trim() || null;
    const rejectReason = String(req.body?.rejectReason || '').trim() || null;
    const projectRows = Array.isArray(req.body?.projects) ? req.body.projects : [];
    const normalizedRows = normalizeReviewProjectRows(projectRows);

    if (!normalizedRows.length) {
      await transaction.rollback();
      return res.status(400).json({ code: '4000', message: 'Provide at least one project update' });
    }

    if (action === 'reject' && !rejectReason) {
      await transaction.rollback();
      return res.status(400).json({ code: '4000', message: 'Enter a rejection reason' });
    }

    await applySubmissionProjectUpdates(submission, normalizedRows, transaction);

    const reviewedAt = new Date().toISOString();
    const reviewMeta = {
      notes: reviewNotes,
      rejectReason: action === 'reject' ? rejectReason : null,
      reviewedAt,
      reviewedById: req.userid,
      reviewedByName: reviewer?.name || reviewer?.email || `User #${req.userid}`,
      action,
    };

    if (action === 'save') {
      await submission.update(
        {
          status: 'submitted',
          metadata: {
            ...(submission.metadata || {}),
            review: {
              ...(submission.metadata?.review || {}),
              lastSavedAt: reviewedAt,
              lastSavedById: req.userid,
              lastSavedByName: reviewMeta.reviewedByName,
              notes: reviewNotes,
            },
          },
        },
        { transaction },
      );
    } else if (action === 'approve') {
      await upsertApprovedIndicatorReports(submission, normalizedRows, req.userid, transaction);

      await submission.update(
        {
          status: 'approved',
          metadata: {
            ...(submission.metadata || {}),
            review: reviewMeta,
          },
        },
        { transaction },
      );
    } else if (action === 'reject') {
      await rejectIndicatorReportsForSubmission(
        submission,
        normalizedRows,
        req.userid,
        rejectReason,
        transaction,
      );

      await submission.update(
        {
          status: 'rejected',
          metadata: {
            ...(submission.metadata || {}),
            review: reviewMeta,
          },
        },
        { transaction },
      );
    }

    await transaction.commit();

    const refreshed = await db.models.regional_report_submission.findByPk(id);
    const results = await enrichSubmissionProjects(refreshed);
    return res.status(200).json({
      code: '0000',
      message:
        action === 'approve'
          ? 'Regional report approved'
          : action === 'reject'
            ? 'Regional report rejected'
            : 'Regional report updated',
      results,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('reviewRegionalReportSubmission error', error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      code: status === 400 ? '4000' : '5000',
      message: error.message || 'Could not update regional report submission',
    });
  }
};

/**
 * Reporting history for one project, shown on the public form so a submitter can see
 * what has already been filed before entering this quarter's numbers.
 *
 * Covers every source (in-app ProjectDetails filings and prior regional reports alike),
 * since they all land in indicator_category_report. Rejected rows are excluded so the
 * history matches the baselines the form validates against.
 */
exports.getPublicRegionalReportProjectHistory = async (req, res) => {
  try {
    const region = resolveCanonicalRegion(req.query.region);
    const projectId = Number(req.query.projectId);

    if (!region) {
      return res.status(400).json({ message: 'Select a valid region' });
    }
    if (!Number.isFinite(projectId)) {
      return res.status(400).json({ message: 'Select a valid project' });
    }

    const project = await db.models.project.findOne({
      where: { id: projectId, region },
      attributes: ['id', 'title'],
    });
    if (!project) {
      return res.status(404).json({ message: 'Project not found in this region' });
    }

    const rows = await db.sequelize.query(
      `
        SELECT
          r.id,
          r.code,
          r.date,
          r.period,
          r.amount,
          r."cumAmount",
          COALESCE(r."cumProgress", r.progress) AS progress,
          r.target,
          r.status,
          r.qualitative,
          r.indicator_category_id,
          ic.indicator_name,
          ic.category_title,
          i.unit
        FROM indicator_category_report r
        LEFT JOIN indicator_category ic ON ic.id = r.indicator_category_id
        LEFT JOIN indicator i ON i.id = ic.indicator_id
        WHERE r.project_id = :projectId
          AND ${BASELINE_STATUS_SQL}
        ORDER BY r.date DESC NULLS LAST, r.id DESC
        LIMIT 200
      `,
      {
        replacements: { projectId },
        type: db.sequelize.QueryTypes.SELECT,
        mapToModel: false,
      },
    );

    return res.json({
      projectId,
      entries: rows.map((row) => ({
        id: Number(row.id),
        code: String(row.code || ''),
        date: row.date,
        period: row.period != null ? String(row.period) : '',
        label:
          [row.indicator_name, row.category_title].filter(Boolean).join(' ').trim() ||
          `Indicator ${row.indicator_category_id}`,
        unit: String(row.unit || ''),
        isImplementationStatus:
          Number(row.indicator_category_id) === IMPLEMENTATION_STATUS_INDICATOR_ID,
        amount: row.amount != null ? Number(row.amount) : null,
        cumAmount: row.cumAmount != null ? Number(row.cumAmount) : null,
        progress: row.progress != null ? Number(row.progress) : null,
        target: row.target != null ? Number(row.target) : null,
        qualitative: row.qualitative || null,
        status: String(row.status || ''),
      })),
    });
  } catch (error) {
    console.error('getPublicRegionalReportProjectHistory error', error);
    return res.status(500).json({ message: 'Could not load project history' });
  }
};

exports.uploadPublicRegionalReportDocuments = (req, res) => {
  regionalReportDocumentUpload.array('files')(req, res, async (uploadErr) => {
    if (uploadErr) {
      cleanupUploadedFiles(req.files);
      return res.status(400).json({
        message: uploadErr.message || 'Upload failed',
      });
    }

    const filingCode = String(req.body?.filingCode || '').trim();
    const files = Array.isArray(req.files) ? req.files : [];

    if (!filingCode) {
      cleanupUploadedFiles(files);
      return res.status(400).json({ message: 'Filing code is required' });
    }
    if (!files.length) {
      return res.status(400).json({ message: 'Select at least one file to upload' });
    }

    try {
      const submission = await db.models.regional_report_submission.findOne({
        where: { filing_code: filingCode },
      });
      if (!submission) {
        cleanupUploadedFiles(files);
        return res.status(404).json({ message: 'Submission not found' });
      }

      const status = String(submission.status || '').toLowerCase();
      if (status !== 'submitted') {
        cleanupUploadedFiles(files);
        return res.status(400).json({
          message: 'Documents can only be added while the submission is pending review',
        });
      }

      const existingCount = await db.models.regional_report_submission_document.count({
        where: { regional_report_submission_id: submission.id },
      });
      if (existingCount + files.length > MAX_SUBMISSION_DOCUMENTS) {
        cleanupUploadedFiles(files);
        return res.status(400).json({
          message: `You can attach up to ${MAX_SUBMISSION_DOCUMENTS} documents per report`,
        });
      }

      const created = [];
      for (const file of files) {
        const ext = path.extname(String(file.originalname || '')).replace('.', '').toLowerCase();
        const sizeMB = parseFloat((file.size / (1024 * 1024)).toFixed(4));
        const doc = await db.models.regional_report_submission_document.create({
          regional_report_submission_id: submission.id,
          name: path.basename(String(file.originalname || 'document')),
          format: ext || null,
          size: sizeMB,
          location: file.path,
          code: path.basename(file.filename),
          createdBy: null,
        });
        created.push(serializeSubmissionDocument(doc));
      }

      return res.status(201).json({
        message: 'Documents uploaded',
        filingCode,
        documents: created,
      });
    } catch (error) {
      cleanupUploadedFiles(files);
      console.error('uploadPublicRegionalReportDocuments error', error);
      if (
        error?.name === 'SequelizeUniqueConstraintError' ||
        error?.parent?.code === '23505'
      ) {
        return res.status(409).json({
          message: 'One of the selected files has already been attached to this report',
        });
      }
      return res.status(500).json({ message: 'Could not upload documents' });
    }
  });
};

exports.downloadRegionalReportSubmissionDocument = async (req, res) => {
  try {
    const submissionId = Number(req.params.id);
    const docId = Number(req.params.docId);
    if (!Number.isFinite(submissionId) || !Number.isFinite(docId)) {
      return res.status(400).json({ code: '4000', message: 'Invalid document reference' });
    }

    const doc = await db.models.regional_report_submission_document.findOne({
      where: {
        id: docId,
        regional_report_submission_id: submissionId,
      },
    });
    if (!doc) {
      return res.status(404).json({ code: '4004', message: 'Document not found' });
    }

    const filePath = doc.location;
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ code: '4004', message: 'File missing on disk' });
    }

    return res.download(filePath, doc.name);
  } catch (error) {
    console.error('downloadRegionalReportSubmissionDocument error', error);
    return res.status(500).json({ code: '5000', message: 'Could not download document' });
  }
};
