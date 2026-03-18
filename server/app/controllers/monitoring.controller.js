/**
 * Monitoring & Evaluation config controller
 * Single endpoint to fetch all M&E form options for a county in one request
 */
const db = require('../models');
const { Op } = require('sequelize');

/**
 * POST /api/v1/monitoring/config
 * Body: { county_id: number }
 * Returns locationOptions, projectOptions, componentOptions, activityOptions,
 * ProjectActivityOptions, and indicatorOptions for the given county.
 */
exports.getMonitoringConfig = async (req, res) => {
  try {
    const countyId = parseInt(req.body?.county_id ?? req.query?.county_id, 10) || 47;
    const { project_location, project, component, activity, project_activity, indicator_category, indicator, programme } = db.models;

    // Run independent queries in parallel
    const [
      projectLocations,
      programmesWithComponents,
      activities,
      activityIndicators,
      projectLevelIndicators
    ] = await Promise.all([
      // 1. Project locations for county (with project + component)
      project_location.findAll({
        where: { county_id: countyId },
        include: [{
          model: project,
          required: true,
          include: [{ model: component, required: true, attributes: ['id', 'title'] }],
          attributes: ['id', 'title', 'component_id', 'implementation_id']
        }],
        attributes: ['id', 'location_name', 'project_id', 'county_id', 'subcounty_id', 'ward_id', 'settlement_id']
      }),

      // 2. Programmes with components (for programmeOptions, componentOptions)
      programme.findAll({
        include: [{ model: component, required: true, attributes: ['id', 'title', 'programme_id'] }],
        attributes: ['id', 'title']
      }),

      // 3. All activities
      activity.findAll({
        attributes: ['id', 'title', 'shortTitle'],
        raw: true
      }),

      // 4. Activity-level indicator categories (activity_id not null, not project-level)
      indicator_category.findAll({
        where: {
          activity_id: { [Op.ne]: null },
          indicator_level: { [Op.ne]: 'project' }
        },
        include: [{ model: indicator, required: true, attributes: ['id', 'name'] }],
        attributes: ['id', 'activity_id', 'category_title', 'indicator_id', 'indicator_level', 'indicator_name']
      }),

      // 5. Project-level indicator categories
      indicator_category.findAll({
        where: { indicator_level: 'project' },
        include: [{ model: indicator, required: true, attributes: ['id', 'name'] }],
        attributes: ['id', 'activity_id', 'category_title', 'indicator_id', 'indicator_level', 'indicator_name']
      })
    ]);

    // 6. Project activities - need project IDs from locations first
    const countyProjectIds = [...new Set(projectLocations.map((pl) => pl.project_id).filter(Boolean))];
    const projectActivities = countyProjectIds.length > 0
      ? await project_activity.findAll({
          where: { project_id: { [Op.in]: countyProjectIds } },
          raw: true
        })
      : [];

    // Filter activity-level indicators to only those for this county's project activities
    const countyActivityIds = [...new Set(projectActivities.map((pa) => pa.activity_id).filter(Boolean))];
    const activityIndicatorsFiltered =
      countyActivityIds.length > 0
        ? activityIndicators.filter((ic) => ic.activity_id && countyActivityIds.includes(ic.activity_id))
        : activityIndicators;

    // Build component lookup from programmes
    const componentMap = new Map();
    const programmeOptions = [];
    programmesWithComponents.forEach((prog) => {
      programmeOptions.push({ label: prog.title, value: prog.id });
      (prog.components || []).forEach((comp) => {
        componentMap.set(comp.id, {
          id: comp.id,
          label: comp.title,
          programme_id: prog.id,
          programme_title: prog.title
        });
      });
    });
    const componentOptions = Array.from(componentMap.values());

    // Build locationOptions and projectOptions from project_locations
    const locationOptions = [];
    const projectOptionsMap = new Map();
    projectLocations.forEach((loc) => {
      if (!loc || !loc.id || !loc.location_name || !loc.project) return;
      const comp = componentMap.get(loc.project.component_id);
      // Prefer loaded component title (from project include), then componentMap, never show "Unknown Component" when we have data
      const componentName = (loc.project.component?.title || (comp && comp.label)) || 'Unknown Component';
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
        component_name: componentName
      });
      if (!projectOptionsMap.has(loc.project.id)) {
        projectOptionsMap.set(loc.project.id, {
          label: loc.project.title,
          value: loc.project.id,
          implementation_id: loc.project.implementation_id,
          county_id: loc.county_id,
          subcounty_id: loc.subcounty_id,
          ward_id: loc.ward_id,
          settlement_id: loc.settlement_id
        });
      }
    });
    const projectOptions = Array.from(projectOptionsMap.values());

    // Build activityOptions
    const activityOptions = activities.map((a) => ({
      label: a.shortTitle || a.title,
      value: a.id
    }));

    // Build indicatorOptions from both activity-level and project-level
    const indicatorOptionsMap = new Map();
    const addIndicator = (ic) => {
      if (!ic || indicatorOptionsMap.has(ic.id)) return;
      const indName = ic.indicator?.name || ic.indicator_name || 'Unknown Indicator';
      const catTitle = ic.category_title || 'Unknown Category';
      indicatorOptionsMap.set(ic.id, {
        label: `${indName} (${catTitle})`,
        value: ic.id,
        activity: ic.activity_id || null,
        project: ic.project_id || null,
        baseline: ic.baseline || 0,
        target: ic.target || 0,
        indicator_level: ic.indicator_level || 'activity'
      });
    };
    activityIndicatorsFiltered.forEach(addIndicator);
    projectLevelIndicators.forEach(addIndicator);
    const indicatorOptions = Array.from(indicatorOptionsMap.values());

    res.json({
      code: '0000',
      data: {
        locationOptions,
        projectOptions,
        programmeOptions,
        componentOptions,
        activityOptions,
        ProjectActivityOptions: projectActivities,
        indicatorOptions
      }
    });
  } catch (error) {
    console.error('[Monitoring] Error fetching config:', error);
    res.status(500).json({
      code: '9999',
      message: 'Failed to load monitoring config',
      error: error.message
    });
  }
};
