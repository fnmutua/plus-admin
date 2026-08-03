/**
 * Monitoring & Evaluation — mobile reporting config + baseline API.
 * Configuration is authored in plus-admin; SlumApp consumes these endpoints for field reporting only.
 */
const db = require('../models');
const { Op } = require('sequelize');
const {
  loadLatestCumulativeByIndicator,
  loadProjectTargetsForProject,
  resolveTargetValue,
} = require('../services/meReporting');
const { getMonitoringFiscalYear } = require('../../lib/projectRegions');

function indicatorFormatFlags(indicator) {
  const format = String(indicator?.format || '').trim().toLowerCase();
  const unit = String(indicator?.unit || '').trim();
  const unitLower = unit.toLowerCase();
  return {
    format: indicator?.format || '',
    unit,
    type: indicator?.type || '',
    isQualitative: format === 'boolean' || unitLower === 'yes/no',
    isPercent: format === 'percent' || unit === '%',
  };
}

/**
 * POST /api/v1/monitoring/config
 * Body: { county_id: number, fiscal_year?: string }
 */
exports.getMonitoringConfig = async (req, res) => {
  try {
    const countyId = parseInt(req.body?.county_id ?? req.query?.county_id, 10) || 47;
    const fiscalYear = String(req.body?.fiscal_year || getMonitoringFiscalYear()).trim();
    const {
      project_location,
      project,
      component,
      activity,
      project_activity,
      indicator_category,
      indicator,
      programme,
      indicator_target,
    } = db.models;

    const [
      projectLocations,
      programmesWithComponents,
      activities,
      activityIndicators,
      projectLevelIndicators,
    ] = await Promise.all([
      project_location.findAll({
        where: { county_id: countyId },
        include: [{
          model: project,
          required: true,
          include: [{ model: component, required: true, attributes: ['id', 'title'] }],
          attributes: ['id', 'title', 'component_id', 'implementation_id'],
        }],
        attributes: ['id', 'location_name', 'project_id', 'county_id', 'subcounty_id', 'ward_id', 'settlement_id'],
      }),
      programme.findAll({
        include: [{ model: component, required: true, attributes: ['id', 'title', 'programme_id'] }],
        attributes: ['id', 'title'],
      }),
      activity.findAll({
        attributes: ['id', 'title', 'shortTitle'],
        raw: true,
      }),
      indicator_category.findAll({
        where: {
          activity_id: { [Op.ne]: null },
          indicator_level: { [Op.ne]: 'project' },
        },
        include: [{ model: indicator, required: true, attributes: ['id', 'name', 'format', 'unit', 'type'] }],
        attributes: ['id', 'activity_id', 'category_title', 'indicator_id', 'indicator_level', 'indicator_name'],
      }),
      indicator_category.findAll({
        where: { indicator_level: 'project' },
        include: [{ model: indicator, required: true, attributes: ['id', 'name', 'format', 'unit', 'type'] }],
        attributes: ['id', 'activity_id', 'category_title', 'indicator_id', 'indicator_level', 'indicator_name'],
      }),
    ]);

    const countyProjectIds = [...new Set(projectLocations.map((pl) => pl.project_id).filter(Boolean))];
    const projectActivities = countyProjectIds.length > 0
      ? await project_activity.findAll({
          where: { project_id: { [Op.in]: countyProjectIds } },
          raw: true,
        })
      : [];

    const countyActivityIds = [...new Set(projectActivities.map((pa) => pa.activity_id).filter(Boolean))];
    const activityIndicatorsFiltered =
      countyActivityIds.length > 0
        ? activityIndicators.filter((ic) => ic.activity_id && countyActivityIds.includes(ic.activity_id))
        : activityIndicators;

    const componentMap = new Map();
    const programmeOptions = [];
    programmesWithComponents.forEach((prog) => {
      programmeOptions.push({ label: prog.title, value: prog.id });
      (prog.components || []).forEach((comp) => {
        componentMap.set(comp.id, {
          id: comp.id,
          label: comp.title,
          programme_id: prog.id,
          programme_title: prog.title,
        });
      });
    });
    const componentOptions = Array.from(componentMap.values());

    const locationOptions = [];
    const projectOptionsMap = new Map();
    projectLocations.forEach((loc) => {
      if (!loc || !loc.id || !loc.location_name || !loc.project) return;
      const comp = componentMap.get(loc.project.component_id);
      const componentName = (loc.project.component?.title || comp?.label) || 'Unknown Component';
      const locationName = loc.location_name || 'Unknown Location';
      locationOptions.push({
        label: `${locationName} (${componentName})`,
        value: loc.id,
        project_id: loc.project_id,
        county_id: loc.county_id,
        subcounty_id: loc.subcounty_id,
        ward_id: loc.ward_id,
        settlement_id: loc.settlement_id,
        programme_implementation_id: loc.project.implementation_id,
        component_id: loc.project.component_id,
        component_name: componentName,
      });
      if (!projectOptionsMap.has(loc.project.id)) {
        projectOptionsMap.set(loc.project.id, {
          label: loc.project.title,
          value: loc.project.id,
          implementation_id: loc.project.implementation_id,
          county_id: loc.county_id,
          subcounty_id: loc.subcounty_id,
          ward_id: loc.ward_id,
          settlement_id: loc.settlement_id,
        });
      }
    });
    const projectOptions = Array.from(projectOptionsMap.values());

    const activityOptions = activities.map((a) => ({
      label: a.shortTitle || a.title,
      value: a.id,
    }));

    const indicatorOptionsMap = new Map();
    const addIndicator = (ic) => {
      if (!ic || indicatorOptionsMap.has(ic.id)) return;
      const indName = ic.indicator?.name || ic.indicator_name || 'Unknown Indicator';
      const catTitle = ic.category_title || 'Unknown Category';
      const flags = indicatorFormatFlags(ic.indicator);
      indicatorOptionsMap.set(ic.id, {
        label: `${indName} (${catTitle})`,
        value: ic.id,
        activity: ic.activity_id || null,
        activity_id: ic.activity_id || null,
        project: ic.project_id || null,
        indicator_level: ic.indicator_level || 'activity',
        format: flags.format,
        unit: flags.unit,
        type: flags.type,
        isQualitative: flags.isQualitative,
        isPercent: flags.isPercent,
        valueLabel: flags.isQualitative ? 'Status' : (flags.unit ? `Amount (${flags.unit})` : 'Amount'),
      });
    };
    activityIndicatorsFiltered.forEach(addIndicator);
    projectLevelIndicators.forEach(addIndicator);
    const indicatorOptions = Array.from(indicatorOptionsMap.values());

    let projectIndicatorTargets = [];
    if (countyProjectIds.length > 0 && indicator_target) {
      const targetRows = await indicator_target.findAll({
        where: {
          project_id: { [Op.in]: countyProjectIds },
          fiscal_year: fiscalYear,
          scope_type: 'project',
        },
        attributes: [
          'id',
          'indicator_category_id',
          'project_id',
          'project_location_id',
          'fiscal_year',
          'target_value',
          'target_kind',
          'portfolio_denominator',
          'scope_type',
        ],
        raw: true,
      });
      projectIndicatorTargets = targetRows.map((row) => ({
        indicator_category_id: row.indicator_category_id,
        project_id: row.project_id,
        project_location_id: row.project_location_id,
        fiscal_year: row.fiscal_year,
        target_value: resolveTargetValue(row),
        target_kind: row.target_kind || 'absolute',
        raw_target_value: row.target_value,
        portfolio_denominator: row.portfolio_denominator,
      }));
    }

    res.json({
      code: '0000',
      data: {
        fiscalYear,
        locationOptions,
        projectOptions,
        programmeOptions,
        componentOptions,
        activityOptions,
        ProjectActivityOptions: projectActivities,
        indicatorOptions,
        projectIndicatorTargets,
      },
    });
  } catch (error) {
    console.error('[Monitoring] Error fetching config:', error);
    res.status(500).json({
      code: '9999',
      message: 'Failed to load monitoring config',
      error: error.message,
    });
  }
};

/**
 * POST /api/v1/monitoring/baseline
 * Body: {
 *   project_id, project_location_id?, indicator_category_ids[], exclude_code?, fiscal_year?
 * }
 * Returns latest cumulative achievements + configured targets (main-system semantics).
 */
exports.getMonitoringBaseline = async (req, res) => {
  try {
    const body = req.body || {};
    const projectId = parseInt(body.project_id, 10);
    const projectLocationId = body.project_location_id != null ? parseInt(body.project_location_id, 10) : null;
    const indicatorCategoryIds = Array.isArray(body.indicator_category_ids)
      ? body.indicator_category_ids.map((id) => parseInt(id, 10)).filter(Number.isFinite)
      : [];
    const excludeCode = body.exclude_code ? String(body.exclude_code) : null;
    const fiscalYear = String(body.fiscal_year || getMonitoringFiscalYear()).trim();

    if (!Number.isFinite(projectId) || !indicatorCategoryIds.length) {
      return res.status(400).json({
        code: '9999',
        message: 'project_id and indicator_category_ids are required',
      });
    }

    const [baselineMap, targetMap] = await Promise.all([
      loadLatestCumulativeByIndicator(
        projectId,
        indicatorCategoryIds,
        projectLocationId,
        null,
        excludeCode,
      ),
      loadProjectTargetsForProject(
        projectId,
        indicatorCategoryIds,
        fiscalYear,
        projectLocationId,
      ),
    ]);

    const baselines = {};
    for (const id of indicatorCategoryIds) {
      const row = baselineMap.get(id);
      baselines[id] = {
        cumAmount: row?.cumAmount ?? 0,
        amount: row?.amount ?? 0,
        target: row?.target ?? null,
        qualitative: row?.qualitative ?? null,
      };
    }

    const targets = {};
    for (const id of indicatorCategoryIds) {
      const row = targetMap.get(id);
      if (row) {
        targets[id] = {
          target: row.target,
          targetKind: row.targetKind || 'absolute',
        };
      }
    }

    res.json({
      code: '0000',
      data: {
        fiscalYear,
        baselines,
        targets,
      },
    });
  } catch (error) {
    console.error('[Monitoring] Error fetching baseline:', error);
    res.status(500).json({
      code: '9999',
      message: 'Failed to load monitoring baseline',
      error: error.message,
    });
  }
};
