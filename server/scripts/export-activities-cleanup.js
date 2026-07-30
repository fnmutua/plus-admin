/**
 * Append activities + project-activity sheets to projects-clean.xlsx.
 * Usage: node server/scripts/export-activities-cleanup.js [output-path]
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const XLSX = require('xlsx');

const DB = {
  host: process.env.VUE_APP_DB_HOST || 'localhost',
  port: Number(process.env.VUE_APP_DB_PORT || 5432),
  user: process.env.VUE_APP_USER || 'postgres',
  password: process.env.VUE_APP_PASSWORD || 'Admin@2011',
  database: process.env.VUE_APP_DB || 'kisip',
};

const PROJECTS_CLEAN_PATH = path.join(
  process.cwd(),
  'data',
  'exports',
  'projects-clean.xlsx'
);

const OUTPUT_DEFAULT = PROJECTS_CLEAN_PATH;

const PROPOSED_ACTIVITIES = [
  {
    proposed_code: 'AC-SH',
    title: 'Construct social housing units and associated infrastructure',
    shortTitle: 'Social housing construction',
    category: 'housing',
    tender_types: ['social_housing'],
  },
  {
    proposed_code: 'AC-WAT',
    title: 'Drill, equip boreholes and install water towers',
    shortTitle: 'Borehole drilling and equipping',
    category: 'water_sanitation',
    tender_types: ['water_supply'],
  },
  {
    proposed_code: 'AC-RAP',
    title: 'Prepare resettlement action plans (RAPs)',
    shortTitle: 'RAP preparation',
    category: 'resettlement',
    tender_types: ['rap_preparation'],
  },
  {
    proposed_code: 'AC-CAP',
    title: 'Prepare capacity development plan',
    shortTitle: 'Capacity development planning',
    category: 'capacity_institutional',
    tender_types: ['capacity_plan'],
  },
  {
    proposed_code: 'AC-COMP',
    title: 'Complete, commission and hand over construction works',
    shortTitle: 'Completion and handover',
    category: 'project_management',
    tender_types: ['completion_works', 'handover'],
  },
  {
    proposed_code: 'AC-FURN',
    title: 'Furnish and fit out housing units',
    shortTitle: 'Housing unit furnishing',
    category: 'housing',
    tender_types: ['social_housing', 'furnishing'],
  },
  {
    proposed_code: 'AC-DESIGN',
    title: 'Prepare detailed engineering designs and drawings',
    shortTitle: 'Detailed engineering design',
    category: 'planning_survey',
    tender_types: ['design'],
  },
  {
    proposed_code: 'AC-SUP',
    title: 'Provide construction supervision and contract administration',
    shortTitle: 'Construction supervision',
    category: 'project_management',
    tender_types: ['supervision'],
  },
  {
    proposed_code: 'AC-FEAS',
    title: 'Prepare feasibility studies and project appraisals',
    shortTitle: 'Feasibility studies',
    category: 'planning_survey',
    tender_types: ['feasibility'],
  },
  {
    proposed_code: 'AC-REHAB',
    title: 'Rehabilitate existing infrastructure and facilities',
    shortTitle: 'Infrastructure rehabilitation',
    category: 'infrastructure',
    tender_types: ['rehabilitation'],
  },
  {
    proposed_code: 'AC-DEMO',
    title: 'Demolish unsafe or condemned structures',
    shortTitle: 'Structure demolition',
    category: 'infrastructure',
    tender_types: ['demolition'],
  },
  {
    proposed_code: 'AC-RESET',
    title: 'Resettle and relocate affected households',
    shortTitle: 'Household resettlement',
    category: 'resettlement',
    tender_types: ['resettlement'],
  },
  {
    proposed_code: 'AC-TRAIN',
    title: 'Conduct community training and awareness programmes',
    shortTitle: 'Community training',
    category: 'community_social',
    tender_types: ['training'],
  },
  {
    proposed_code: 'AC-FENC',
    title: 'Construct boundary fencing and security walls',
    shortTitle: 'Boundary fencing',
    category: 'security',
    tender_types: ['fencing'],
  },
  {
    proposed_code: 'AC-SEC',
    title: 'Install security systems and access control infrastructure',
    shortTitle: 'Security systems installation',
    category: 'security',
    tender_types: ['security_systems'],
  },
  {
    proposed_code: 'AC-BRIDGE',
    title: 'Construct bridges, culverts and footbridges',
    shortTitle: 'Bridge and footbridge construction',
    category: 'roads_transport',
    tender_types: ['bridge', 'footbridge'],
  },
  {
    proposed_code: 'AC-LAND',
    title: 'Acquire land and secure wayleaves',
    shortTitle: 'Land acquisition',
    category: 'legal_tenure',
    tender_types: ['land_acquisition'],
  },
  {
    proposed_code: 'AC-VAL',
    title: 'Undertake valuation and compensation assessments',
    shortTitle: 'Valuation and compensation',
    category: 'resettlement',
    tender_types: ['valuation'],
  },
  {
    proposed_code: 'AC-MAINT',
    title: 'Maintain infrastructure and facilities',
    shortTitle: 'Infrastructure maintenance',
    category: 'project_management',
    tender_types: ['maintenance'],
  },
  {
    proposed_code: 'AC-INST',
    title: 'Construct institutional facilities',
    shortTitle: 'Institutional facility construction',
    category: 'institutional',
    tender_types: ['institutional'],
  },
  {
    proposed_code: 'AC-ESMP',
    title: 'Prepare environmental and social management plans (ESMPs)',
    shortTitle: 'ESMP preparation',
    category: 'environment',
    tender_types: ['esmp'],
  },
  {
    proposed_code: 'AC-BASE',
    title: 'Conduct baseline socio-economic surveys',
    shortTitle: 'Baseline surveys',
    category: 'planning_survey',
    tender_types: ['baseline_survey'],
  },
  {
    proposed_code: 'AC-MNE',
    title: 'Conduct monitoring and evaluation',
    shortTitle: 'Monitoring and evaluation',
    category: 'project_management',
    tender_types: ['monitoring_evaluation'],
  },
  {
    proposed_code: 'AC-OHS',
    title: 'Implement occupational health and safety measures',
    shortTitle: 'OHS implementation',
    category: 'project_management',
    tender_types: ['ohs'],
  },
];

const ACTIVITY_CATEGORIES = {
  AC1: 'planning_survey',
  AC4: 'planning_survey',
  AC5: 'planning_survey',
  AC6: 'legal_tenure',
  AC7: 'legal_tenure',
  AC8: 'legal_tenure',
  AC9: 'planning_survey',
  AC10: 'community_social',
  AC11: 'community_social',
  AC2: 'community_social',
  AC3: 'community_social',
  AC12: 'labour_programmes',
  AC13: 'labour_programmes',
  AC14: 'water_sanitation',
  AC16: 'water_sanitation',
  AC25: 'water_sanitation',
  AC26: 'water_sanitation',
  AC42: 'water_sanitation',
  AC15: 'roads_transport',
  AC17: 'roads_transport',
  AC18: 'health',
  AC19: 'markets_commercial',
  AC20: 'energy_lighting',
  AC21: 'energy_lighting',
  AC24: 'energy_lighting',
  AC22: 'community_social',
  AC23: 'drainage_stormwater',
  AC27: 'capacity_institutional',
  AC28: 'capacity_institutional',
  AC29: 'planning_survey',
  AC31: 'capacity_institutional',
  AC35: 'housing',
  AC36: 'community_social',
  AC38: 'environment',
  AC39: 'education',
  AC40: 'education',
  AC41: 'environment',
  AC44: 'markets_commercial',
  AC49: 'markets_commercial',
  AC50: 'environment',
  AC51: 'environment',
  AC53: 'environment',
};

// Verb-led activity wording (work to be done, not assets or project titles).
const ACTIVITY_WORDING = {
  1: {
    clean_title: 'Prepare topographical, engineering plans and maps',
    clean_shortTitle: 'Topographical and engineering mapping',
  },
  2: {
    clean_title: 'Form SEC/GRC committees and undertake stakeholder engagement',
    clean_shortTitle: 'SEC/GRC and stakeholder engagement',
  },
  3: { clean_title: 'Resolve grievances', clean_shortTitle: 'Grievance resolution' },
  4: {
    clean_title: 'Prepare local physical and land use development plans (LP&LUDPs)',
    clean_shortTitle: 'LP&LUDP preparation',
  },
  5: { clean_title: 'Prepare survey plans', clean_shortTitle: 'Survey planning' },
  6: {
    clean_title: 'Amend registry index maps (RIMs)',
    clean_shortTitle: 'RIM amendment',
  },
  7: {
    clean_title: 'Issue letters of regularization',
    clean_shortTitle: 'Regularization letters',
  },
  8: {
    clean_title: 'Prepare titles and leases',
    clean_shortTitle: 'Title and lease preparation',
  },
  9: {
    clean_title: 'Prepare topographical, engineering plans and maps',
    clean_shortTitle: 'Topographical and engineering mapping',
  },
  10: {
    clean_title: 'Prepare community development plans',
    clean_shortTitle: 'CDP preparation',
  },
  11: {
    clean_title: 'Identify vulnerable persons for social safety net programmes',
    clean_shortTitle: 'Vulnerable persons identification',
  },
  12: {
    clean_title: 'Implement labour-intensive civil works (LICW)',
    clean_shortTitle: 'LICW implementation',
  },
  13: {
    clean_title: 'Implement digital public works (DPW)',
    clean_shortTitle: 'DPW implementation',
  },
  14: {
    clean_title: 'Connect households to piped water and reticulation',
    clean_shortTitle: 'Water supply connections',
  },
  15: { clean_title: 'Construct access roads', clean_shortTitle: 'Access road construction' },
  16: {
    clean_title: 'Connect households to improved sanitation facilities',
    clean_shortTitle: 'Sanitation connections',
  },
  17: { clean_title: 'Construct footpaths', clean_shortTitle: 'Footpath construction' },
  18: {
    clean_title: 'Construct health facilities',
    clean_shortTitle: 'Health facility construction',
  },
  19: {
    clean_title: 'Construct markets, bus parks and commercial facilities',
    clean_shortTitle: 'Market and commercial construction',
  },
  20: {
    clean_title: 'Install security and high-mast floodlights (including solar-powered)',
    clean_shortTitle: 'Floodlight installation',
  },
  21: {
    clean_title: 'Install street lighting and electrical power connections',
    clean_shortTitle: 'Street lighting and power',
  },
  22: { clean_title: 'Construct social halls', clean_shortTitle: 'Social hall construction' },
  23: {
    clean_title: 'Construct storm water drainage',
    clean_shortTitle: 'Storm water drainage',
  },
  24: {
    clean_title: 'Install security and high-mast floodlights (including solar-powered)',
    clean_shortTitle: 'Floodlight installation',
  },
  25: {
    clean_title: 'Construct sewer lines and household connections',
    clean_shortTitle: 'Sewer infrastructure',
  },
  26: {
    clean_title: 'Connect households to piped water and reticulation',
    clean_shortTitle: 'Water supply connections',
  },
  27: {
    clean_title: 'Update the national slum upgrading strategy',
    clean_shortTitle: 'National strategy update',
  },
  28: {
    clean_title: 'Establish GIS hub and ICT infrastructure',
    clean_shortTitle: 'GIS and ICT infrastructure',
  },
  29: {
    clean_title: 'Map informal settlements',
    clean_shortTitle: 'Informal settlement mapping',
  },
  30: {
    clean_title: 'Prepare community development plan',
    clean_shortTitle: 'CDP preparation',
  },
  31: {
    clean_title: 'Prepare county-specific slum upgrading and prevention strategies',
    clean_shortTitle: 'County upgrading strategies',
  },
  35: {
    clean_title: 'Construct substructure works and bulk excavation',
    clean_shortTitle: 'Substructure and excavation',
  },
  36: {
    clean_title: 'Implement community development plans',
    clean_shortTitle: 'CDP implementation',
  },
  37: { clean_title: 'Construct market stalls', clean_shortTitle: 'Market stall construction' },
  38: {
    clean_title: 'Prepare environmental and social impact assessment (ESIA) report',
    clean_shortTitle: 'ESIA preparation',
  },
  39: {
    clean_title: 'Construct education facility blocks (classrooms, ablution and kitchen)',
    clean_shortTitle: 'Education facility construction',
  },
  40: {
    clean_title: 'Construct education facility blocks (classrooms, ablution and kitchen)',
    clean_shortTitle: 'Education facility construction',
  },
  41: {
    clean_title: 'Undertake civil works, landscaping and greening',
    clean_shortTitle: 'Civil works and greening',
  },
  42: {
    clean_title: 'Construct water reticulation works',
    clean_shortTitle: 'Water reticulation works',
  },
  43: { clean_title: 'Construct market sheds', clean_shortTitle: 'Market shed construction' },
  44: {
    clean_title: 'Construct markets, bus parks and commercial facilities',
    clean_shortTitle: 'Market and commercial construction',
  },
  46: {
    clean_title: 'Construct storm water drains',
    clean_shortTitle: 'Storm water drain construction',
  },
  48: {
    clean_title: 'Prepare county-specific slum prevention and upgrading strategies',
    clean_shortTitle: 'County slum prevention strategies',
  },
  49: {
    clean_title: 'Construct markets, bus parks and commercial facilities',
    clean_shortTitle: 'Market and commercial construction',
  },
  50: {
    clean_title: 'Construct public parks and open spaces',
    clean_shortTitle: 'Public park construction',
  },
  51: {
    clean_title: 'Implement solid waste management and collection points',
    clean_shortTitle: 'Solid waste management',
  },
  53: {
    clean_title: 'Construct children play areas',
    clean_shortTitle: 'Play area construction',
  },
};

const PROPOSED_WORDING = Object.fromEntries(
  PROPOSED_ACTIVITIES.map((item) => [
    item.proposed_code,
    { clean_title: item.title, clean_shortTitle: item.shortTitle },
  ])
);

const ACTIVITY_MERGES = {
  9: 1,
  24: 20,
  26: 14,
  30: 10,
  37: 19,
  40: 39,
  43: 19,
  44: 19,
  46: 23,
  48: 31,
  49: 19,
};

// Map legacy/alternate codes to canonical master-list codes.
const CODE_ALIASES = {
  AC9: 'AC1',
  AC24: 'AC20',
  AC26: 'AC14',
  AC30: 'AC10',
  AC37: 'AC19',
  AC40: 'AC39',
  AC43: 'AC19',
  AC44: 'AC19',
  AC46: 'AC23',
  AC48: 'AC31',
  AC49: 'AC19',
};

const KISIP2_INFRASTRUCTURE_BUNDLE = [
  'AC14',
  'AC16',
  'AC25',
  'AC15',
  'AC17',
  'AC18',
  'AC19',
  'AC20',
  'AC21',
  'AC22',
  'AC23',
  'AC50',
  'AC11',
];

const PLANNING_SURVEY_BUNDLE = ['AC5', 'AC1', 'AC4', 'AC6', 'AC7', 'AC8'];

const TENDER_RULES = [
  {
    type: 'rap_preparation',
    test: /preparation of raps|\braps\b|resettlement action plan/i,
    codes: ['AC-RAP', ...PLANNING_SURVEY_BUNDLE],
  },
  {
    type: 'capacity_plan',
    test: /capacity development plan/i,
    codes: ['AC-CAP'],
  },
  {
    type: 'completion_works',
    test: /completion works|price variation|finishing works/i,
    codes: ['AC-COMP', 'AC39'],
  },
  {
    type: 'cluster_lot',
    test: /\bcl\s?\d+\b|\bcluster\s+\d|\blot\s+\d/i,
    codes: PLANNING_SURVEY_BUNDLE,
  },
  {
    type: 'mapping',
    test: /mapping of slums|mapping of informal/i,
    codes: ['AC29'],
  },
  {
    type: 'cdp',
    test: /community development plan|\bcdp\b/i,
    codes: ['AC10'],
  },
  {
    type: 'county_strategy',
    test: /county-specific strateg|slum prevention and upgrading/i,
    codes: ['AC31'],
  },
  {
    type: 'national_strategy',
    test: /national slum upgrading strategy/i,
    codes: ['AC27'],
  },
  {
    type: 'gis_hub',
    test: /gis-based housing|information hub/i,
    codes: ['AC28'],
  },
  {
    type: 'planning_survey',
    test: /planning and surveying|survey and planning|consultancy services for physical planning|consultancy services to undertake planning|cadastral survey|topographical survey|physical planning/i,
    codes: PLANNING_SURVEY_BUNDLE,
  },
  {
    type: 'infrastructure_upgrading',
    test: /infrastructures?\s+upgrading|infrastructure upgrading works/i,
    codes: KISIP2_INFRASTRUCTURE_BUNDLE,
  },
  {
    type: 'market',
    test: /market|bus park|multipurpose market|strategic market|market shed|market stall|passenger shed|vending platform/i,
    codes: ['AC19'],
  },
  {
    type: 'floodlight',
    test: /floodlight|flood light|high mast|solar powered/i,
    codes: ['AC20'],
  },
  {
    type: 'social_housing',
    test: /social housing|housing units|bedsit|bedroom unit|met site|kamiti|kasarani|kibera|mariguini|sepu|mukuru|dormitor|design, build and finance|affordable housing|lpg fittings|excavation equipment|furnishing of social|hire of excavation/i,
    codes: ['AC-SH', 'AC15', 'AC25', 'AC23', 'AC20', 'AC35'],
  },
  {
    type: 'education',
    test: /classroom|primary school|secondary school|tuition block|boarding facilit|school facilities|kitchen block|ablution block/i,
    codes: ['AC39'],
  },
  {
    type: 'health',
    test: /health centre|health facility|maternity hospital|hospital/i,
    codes: ['AC18'],
  },
  {
    type: 'water_supply',
    test: /borehole|water tower|water reticulation|drilling , equipping/i,
    codes: ['AC-WAT', 'AC42', 'AC14'],
  },
  {
    type: 'footbridge',
    test: /footbridge/i,
    codes: ['AC-BRIDGE'],
  },
  {
    type: 'river_climate',
    test: /river cleaning|climate/i,
    codes: ['AC41'],
  },
  {
    type: 'institutional',
    test: /police station|prison|gk prison|institutional facilit/i,
    codes: ['AC-INST', 'AC-SH'],
  },
  {
    type: 'design',
    test: /detailed design|engineering design|design and build/i,
    codes: ['AC-DESIGN'],
  },
  {
    type: 'supervision',
    test: /supervision|contract administration|project management consultant|\bpmc\b/i,
    codes: ['AC-SUP'],
  },
  {
    type: 'rehabilitation',
    test: /rehabilitat|renovation|refurbish|repair of existing/i,
    codes: ['AC-REHAB', 'AC-COMP'],
  },
  {
    type: 'demolition',
    test: /demolish|condemned structure|unsafe structure/i,
    codes: ['AC-DEMO'],
  },
  {
    type: 'resettlement',
    test: /resettle|relocate affected|compensation and resettlement/i,
    codes: ['AC-RESET', 'AC-VAL'],
  },
  {
    type: 'training',
    test: /training|awareness|sensitization|sensitisation/i,
    codes: ['AC-TRAIN'],
  },
  {
    type: 'power',
    test: /electricity|power supply|electrification|transformer/i,
    codes: ['AC21'],
  },
  {
    type: 'waste_management',
    test: /solid waste|waste management|dumping|garbage|waste transfer|waste sorting/i,
    codes: ['AC51'],
  },
  {
    type: 'landscaping',
    test: /landscaping|greening|tree planting|beautification/i,
    codes: ['AC41', 'AC50'],
  },
  {
    type: 'maintenance',
    test: /\bmaintenance\b|operate and maintain/i,
    codes: ['AC-MAINT'],
  },
  {
    type: 'bridge',
    test: /bridge|culvert|footbridge/i,
    codes: ['AC-BRIDGE'],
  },
  {
    type: 'bus_terminal',
    test: /bus terminal|bus park|transport facility/i,
    codes: ['AC19'],
  },
  {
    type: 'feasibility',
    test: /feasibility|project appraisal|pre-feasibility/i,
    codes: ['AC-FEAS'],
  },
  {
    type: 'valuation',
    test: /valuation|compensation assessment/i,
    codes: ['AC-VAL'],
  },
  {
    type: 'land_acquisition',
    test: /land acquisition|acquire land|wayleave/i,
    codes: ['AC-LAND'],
  },
  {
    type: 'ict',
    test: /\bict\b|connectivity|information system/i,
    codes: ['AC28'],
  },
  {
    type: 'fencing',
    test: /fencing|boundary wall|perimeter wall/i,
    codes: ['AC-FENC'],
  },
  {
    type: 'security_systems',
    test: /\bcctv\b|access control|security system/i,
    codes: ['AC-SEC', 'AC20'],
  },
  {
    type: 'furnishing',
    test: /furnishing of social|fit out|fittings and bulk storage/i,
    codes: ['AC-FURN'],
  },
  {
    type: 'excavation',
    test: /excavation equipment|bulk excavation|earthworks/i,
    codes: ['AC35', 'AC41'],
  },
  {
    type: 'esia',
    test: /esia|environmental and social impact/i,
    codes: ['AC38', 'AC-ESMP'],
  },
  {
    type: 'esmp',
    test: /esmp|environmental and social management plan/i,
    codes: ['AC-ESMP'],
  },
  {
    type: 'baseline_survey',
    test: /baseline survey|socio-economic survey|socioeconomic survey|household survey/i,
    codes: ['AC-BASE'],
  },
  {
    type: 'stakeholder_engagement',
    test: /stakeholder engagement|public participation|community consultation/i,
    codes: ['AC2'],
  },
  {
    type: 'monitoring_evaluation',
    test: /monitoring and evaluation|\bm\s*&\s*e\b|impact evaluation/i,
    codes: ['AC-MNE'],
  },
  {
    type: 'handover',
    test: /handover|commissioning|defects liability/i,
    codes: ['AC-COMP'],
  },
  {
    type: 'ohs',
    test: /occupational health|health and safety|\bohs\b/i,
    codes: ['AC-OHS'],
  },
  {
    type: 'solar',
    test: /solar panel|solar power|photovoltaic|renewable energy/i,
    codes: ['AC20'],
  },
  {
    type: 'settlement_upgrading',
    test: /slum upgrading|informal settlement upgrading|settlement upgrading|urban upgrading/i,
    codes: KISIP2_INFRASTRUCTURE_BUNDLE,
  },
  {
    type: 'grievance',
    test: /grievance|sec and grc|grc commitees/i,
    codes: ['AC2', 'AC3'],
  },
  {
    type: 'dpw',
    test: /\bdpw\b|digital public works/i,
    codes: ['AC13'],
  },
  {
    type: 'licw',
    test: /\blicw\b/i,
    codes: ['AC12'],
  },
];

function getActivityCategory(code, id) {
  if (ACTIVITY_CATEGORIES[code]) return ACTIVITY_CATEGORIES[code];
  if (id && ACTIVITY_CATEGORIES[`AC${id}`]) return ACTIVITY_CATEGORIES[`AC${id}`];
  const proposed = PROPOSED_ACTIVITIES.find((item) => item.proposed_code === code);
  if (proposed?.category) return proposed.category;
  if (id && ACTIVITY_MERGES[id]) {
    const target = ACTIVITY_MERGES[id];
    return getActivityCategory(`AC${target}`, target);
  }
  return 'general';
}

function normalizeTitle(title) {
  return String(title || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function isUuidCode(code) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(code || '')
  );
}

function isCanonicalActivityCode(code) {
  return /^(AC\d+|AC-[A-Z0-9-]+)$/i.test(String(code || '').trim());
}

function cleanActivityTitle(title) {
  return String(title || '')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function loadCleanProjects() {
  if (!fs.existsSync(PROJECTS_CLEAN_PATH)) return null;

  const workbook = XLSX.readFile(PROJECTS_CLEAN_PATH);
  const sheet = workbook.Sheets.projects;
  if (!sheet) return null;

  return XLSX.utils.sheet_to_json(sheet).filter((row) => {
    const keep = String(row.keep || 'Y').trim().toUpperCase();
    return keep !== 'N';
  });
}

function inferTenderType(title) {
  for (const rule of TENDER_RULES) {
    if (rule.test.test(title)) return rule.type;
  }
  return 'other';
}

function normalizeActivityCode(code) {
  let current = String(code || '').trim();
  if (!current) return current;

  const seen = new Set();
  while (CODE_ALIASES[current] && !seen.has(current)) {
    seen.add(current);
    current = CODE_ALIASES[current];
  }
  return current;
}

function inferActivityCodes(title) {
  const matched = new Set();

  for (const rule of TENDER_RULES) {
    if (rule.test.test(title)) {
      for (const code of rule.codes) {
        matched.add(normalizeActivityCode(code));
      }
    }
  }

  return [...matched];
}

function resolveCanonicalCode(activity, codeById) {
  let currentId = activity.id;
  const seen = new Set();

  while (ACTIVITY_MERGES[currentId] && !seen.has(currentId)) {
    seen.add(currentId);
    currentId = ACTIVITY_MERGES[currentId];
  }

  const canonical = codeById.get(currentId);
  if (!canonical) return activity.code;

  if (isUuidCode(canonical.code) && canonical.id) {
    return normalizeActivityCode(`AC${canonical.id}`);
  }

  return normalizeActivityCode(canonical.code);
}

function getActivityWording(activity) {
  const byId = ACTIVITY_WORDING[activity.id];
  if (byId) return byId;

  const byCode = PROPOSED_WORDING[activity.code];
  if (byCode) return byCode;

  return {
    clean_title: activity.title,
    clean_shortTitle: activity.shortTitle,
  };
}

function getCleanLabel(code, codeToActivity) {
  const activity = codeToActivity.get(code);
  if (!activity) return code;

  if (activity.id) {
    return getActivityWording(activity).clean_title;
  }

  const proposed = PROPOSED_WORDING[code];
  return proposed?.clean_title || activity.title || code;
}

function rowsToSheet(rows, headers) {
  const data = [
    headers,
    ...rows.map((row) => headers.map((key) => row[key] ?? '')),
  ];
  return XLSX.utils.aoa_to_sheet(data);
}

function removeSheet(workbook, name) {
  const idx = workbook.SheetNames.indexOf(name);
  if (idx >= 0) {
    workbook.SheetNames.splice(idx, 1);
    delete workbook.Sheets[name];
  }
}

function loadOrCreateWorkbook(outputPath) {
  if (fs.existsSync(outputPath)) {
    return XLSX.readFile(outputPath);
  }
  return XLSX.utils.book_new();
}

function readMetaRows(workbook) {
  const sheet = workbook.Sheets._meta;
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
}

async function main() {
  const outputPath = path.resolve(process.argv[2] || OUTPUT_DEFAULT);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const cleanProjects = loadCleanProjects();
  const client = new Client(DB);
  await client.connect();

  try {
    const { rows: activities } = await client.query(`
      SELECT
        a.id, a.title, a."shortTitle", a.code,
        COALESCE(p.project_count, 0)::int AS projects,
        COALESCE(i.indicator_count, 0)::int AS indicators
      FROM activity a
      LEFT JOIN (
        SELECT activity_id, COUNT(*) AS project_count
        FROM project_activity
        GROUP BY activity_id
      ) p ON p.activity_id = a.id
      LEFT JOIN (
        SELECT activity_id, COUNT(*) AS indicator_count
        FROM indicator
        GROUP BY activity_id
      ) i ON i.activity_id = a.id
      ORDER BY a.title
    `);

    const codeById = new Map(activities.map((a) => [a.id, a]));
    const codeToActivity = new Map(activities.map((a) => [a.code, a]));
    for (const proposed of PROPOSED_ACTIVITIES) {
      codeToActivity.set(proposed.proposed_code, proposed);
    }

    const projectFilter = cleanProjects
      ? cleanProjects.map((p) => Number(p.id)).filter(Boolean)
      : null;

    const projectQuery = `
      SELECT
        p.id,
        trim(regexp_replace(p.title, E'[\\n\\r]+', ' ', 'g')) AS title,
        COALESCE(p.project_code, '') AS project_code
      FROM project p
      ${projectFilter ? 'WHERE p.id = ANY($1::int[])' : ''}
      ORDER BY p.title, p.id
    `;

    const projectResult = projectFilter
      ? await client.query(projectQuery, [projectFilter])
      : await client.query(projectQuery);

    const { rows: projectActivityRows } = await client.query(`
      SELECT pa.project_id, pa.activity_id, a.title, a.code
      FROM project_activity pa
      JOIN activity a ON a.id = pa.activity_id
      ORDER BY pa.project_id, a.title
    `);

    const currentByProject = new Map();
    for (const row of projectActivityRows) {
      if (!currentByProject.has(row.project_id)) {
        currentByProject.set(row.project_id, []);
      }
      currentByProject.get(row.project_id).push(row);
    }

    const activityRows = activities.map((activity) => {
      const mergeIntoId = ACTIVITY_MERGES[activity.id] || '';
      const isDuplicate = Boolean(mergeIntoId);
      const canonicalTarget = mergeIntoId ? codeById.get(mergeIntoId) : null;
      const unused = activity.projects === 0 && activity.indicators === 0;

      let action = 'keep';
      let keep = 'Y';
      let notes = '';

      if (isDuplicate) {
        action = 'merge';
        keep = 'N';
        notes = `Duplicate — merge into id ${mergeIntoId} (${getActivityWording(canonicalTarget || activity).clean_title})`;
      } else if (unused) {
        action = 'review';
        notes = 'No linked projects or indicators';
      } else if (isUuidCode(activity.code)) {
        notes = 'Replace UUID code with AC-style code on import';
      }

      const cleanCode = isDuplicate
        ? canonicalTarget?.code || activity.code
        : isCanonicalActivityCode(activity.code)
          ? activity.code
          : `AC${activity.id}`;

      const wording = getActivityWording(activity);
      const cleanTitle = cleanActivityTitle(wording.clean_title);
      const wordingIssue =
        activity.id === 14 && /ablution/i.test(activity.shortTitle)
          ? 'shortTitle mismatch — was labelled as ablution, not water connection'
          : activity.id === 42 && /reculation/i.test(activity.title)
            ? 'Fix typo: Reculation → Reticulation'
            : /^(Dumpster|Substructure|subs)$/i.test(activity.shortTitle)
              ? 'Was asset label, not an activity'
              : '';

      return {
        id: activity.id,
        title: cleanTitle,
        shortTitle: wording.clean_shortTitle,
        category: getActivityCategory(activity.code, activity.id),
        master_list: keep,
        db_title: activity.title,
        db_shortTitle: activity.shortTitle,
        code: activity.code,
        activity_code: isDuplicate ? '' : cleanCode,
        projects: activity.projects,
        indicators: activity.indicators,
        canonical_code: resolveCanonicalCode(activity, codeById),
        keep,
        action,
        merge_into_id: mergeIntoId,
        notes: [notes, wordingIssue].filter(Boolean).join(' | '),
      };
    });

    const projectActivityMap = [];
    let withSuggestions = 0;
    let missingLinks = 0;

    for (const project of projectResult.rows) {
      const contractNo =
        cleanProjects?.find((p) => Number(p.id) === Number(project.id))
          ?.contract_no || project.project_code;

      const tenderType = inferTenderType(project.title);
      const suggestedCodes = inferActivityCodes(project.title);
      const current = currentByProject.get(project.id) || [];

      const currentCodes = current.map((row) => {
        const act = codeById.get(row.activity_id);
        if (!act) return normalizeActivityCode(row.code);
        return resolveCanonicalCode(act, codeById);
      });
      const currentCanonical = [...currentCodes];

      const suggestedCanonical = [...new Set(suggestedCodes)];
      const suggestedTitles = suggestedCanonical.map((code) =>
        getCleanLabel(code, codeToActivity)
      );

      const currentTitles = current.map((row) => {
        const act = codeById.get(row.activity_id);
        return act ? getActivityWording(act).clean_title : row.title;
      });

      const missing = suggestedCanonical.filter(
        (code) => !currentCanonical.includes(code)
      );
      const extra = currentCanonical.filter(
        (code) => !suggestedCanonical.includes(code)
      );

      if (suggestedCanonical.length) withSuggestions += 1;
      if (missing.length) missingLinks += 1;

      projectActivityMap.push({
        project_id: project.id,
        project_title: project.title,
        contract_no: contractNo,
        tender_type: tenderType,
        current_activity_count: current.length,
        current_activity_codes: currentCodes.join('; '),
        current_activity_titles: currentTitles.join('; '),
        suggested_activity_codes: suggestedCanonical.join('; '),
        suggested_activity_titles: suggestedTitles.join('; '),
        missing_activities: missing.join('; '),
        extra_activities: extra.join('; '),
        action: missing.length ? 'add_missing' : extra.length ? 'review_extra' : 'ok',
        notes: '',
      });
    }

    const codeUsageCount = new Map();
    for (const row of projectActivityMap) {
      for (const code of String(row.suggested_activity_codes || '')
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean)) {
        codeUsageCount.set(code, (codeUsageCount.get(code) || 0) + 1);
      }
    }

    for (const proposed of PROPOSED_ACTIVITIES) {
      const projectsNeeding = codeUsageCount.get(proposed.proposed_code) || 0;
      activityRows.push({
        id: '',
        title: proposed.title,
        shortTitle: proposed.shortTitle,
        category: proposed.category,
        master_list: 'Y',
        db_title: '',
        db_shortTitle: '',
        code: proposed.proposed_code,
        activity_code: proposed.proposed_code,
        projects: 0,
        indicators: 0,
        canonical_code: proposed.proposed_code,
        keep: 'Y',
        action: projectsNeeding > 0 ? 'add_to_master' : 'anticipated',
        merge_into_id: '',
        notes:
          projectsNeeding > 0
            ? `Required by ${projectsNeeding} clean project(s); add to DB on import`
            : `Anticipated (${proposed.tender_types.join(', ')})`,
      });
    }

    activityRows.sort((a, b) => String(a.title).localeCompare(String(b.title)));

    const activityMergeRows = activityRows
      .filter((row) => row.action === 'merge')
      .map((row) => ({
        duplicate_id: row.id,
        duplicate_code: row.code,
        duplicate_title: row.db_title,
        merge_into_id: row.merge_into_id,
        canonical_code: row.canonical_code,
        canonical_title: row.notes.split(' — merge into')[1]?.replace(/^ id \d+ \(/, '').replace(/\)$/, '') || '',
        action: 'merge_on_import',
        notes: row.notes,
      }));

    const masterActivityRows = activityRows.filter((row) => row.action !== 'merge');

    const proposedCodeSet = new Set(PROPOSED_ACTIVITIES.map((p) => p.proposed_code));

    const activityGaps = [];
    for (const row of projectActivityMap) {
      if (!row.suggested_activity_codes) {
        activityGaps.push({
          gap_type: 'unmapped_project',
          project_id: row.project_id,
          project_title: row.project_title,
          tender_type: row.tender_type,
          issue: 'No activities inferred from tender/project title',
          suggested_master_codes: '',
          notes: 'Review tender wording or assign activities manually',
        });
        continue;
      }

      const missing = String(row.missing_activities || '')
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean);
      const missingProposed = missing.filter(
        (code) => proposedCodeSet.has(code) || /^AC-[A-Z]+$/.test(code)
      );

      if (missingProposed.length) {
        activityGaps.push({
          gap_type: 'missing_master_activity',
          project_id: row.project_id,
          project_title: row.project_title,
          tender_type: row.tender_type,
          issue: `Not in master list: ${missingProposed.join(', ')}`,
          suggested_master_codes: missingProposed.join('; '),
          notes: 'Create proposed activity then link to project',
        });
      }
    }

    const masterActivityGaps = PROPOSED_ACTIVITIES.map((proposed) => {
      const projectsNeeding = codeUsageCount.get(proposed.proposed_code) || 0;
      const projectsMissingLink = projectActivityMap.filter((row) =>
        String(row.missing_activities || '').includes(proposed.proposed_code)
      ).length;

      return {
        proposed_code: proposed.proposed_code,
        title: proposed.title,
        shortTitle: proposed.shortTitle,
        category: proposed.category,
        tender_types: proposed.tender_types.join(', '),
        projects_needing: projectsNeeding,
        projects_missing_link: projectsMissingLink,
        in_master_list: 'Y',
        action: projectsNeeding > 0 ? 'add_to_db' : 'anticipated',
        notes:
          projectsMissingLink > 0
            ? `${projectsMissingLink} clean projects need this activity linked`
            : projectsNeeding > 0
              ? `${projectsNeeding} projects reference this activity`
              : 'Proactive master list entry',
      };
    });

    const workbook = loadOrCreateWorkbook(outputPath);
    const existingMeta = readMetaRows(workbook);

    const activityMeta = [
      [''],
      ['Activities export'],
      ['Exported at', new Date().toISOString()],
      ['Projects in map', String(projectActivityMap.length)],
      ['Activities catalog', String(masterActivityRows.length)],
      ['Merged duplicates', String(activityMergeRows.length)],
      ['Projects with inferred activities', String(withSuggestions)],
      ['Projects missing suggested links', String(missingLinks)],
      ['activities sheet', 'Activity titles rephrased as verb-led work items; db_* columns hold original DB values'],
      ['project_activities sheet', 'Per-project current vs suggested activity links'],
      ['activity_gaps sheet', 'Projects missing master activities or unmapped tender types'],
      ['master_activity_gaps sheet', 'New activities to add to master list from tender analysis'],
    ];

    const meta = [...existingMeta, ...activityMeta];

    removeSheet(workbook, 'activities');
    removeSheet(workbook, 'activity_merges');
    removeSheet(workbook, 'project_activities');
    removeSheet(workbook, 'activity_gaps');
    removeSheet(workbook, 'master_activity_gaps');
    removeSheet(workbook, '_meta');

    if (!workbook.SheetNames.includes('projects')) {
      console.warn('Warning: projects sheet missing — run export-projects-cleanup.js first');
    }

    XLSX.utils.book_append_sheet(
      workbook,
      rowsToSheet(masterActivityRows, [
        'id',
        'title',
        'shortTitle',
        'category',
        'master_list',
        'db_title',
        'db_shortTitle',
        'code',
        'activity_code',
        'projects',
        'indicators',
        'canonical_code',
        'keep',
        'action',
        'merge_into_id',
        'notes',
      ]),
      'activities'
    );
    XLSX.utils.book_append_sheet(
      workbook,
      rowsToSheet(activityMergeRows, [
        'duplicate_id',
        'duplicate_code',
        'duplicate_title',
        'merge_into_id',
        'canonical_code',
        'canonical_title',
        'action',
        'notes',
      ]),
      'activity_merges'
    );
    XLSX.utils.book_append_sheet(
      workbook,
      rowsToSheet(projectActivityMap, [
        'project_id',
        'project_title',
        'contract_no',
        'tender_type',
        'current_activity_count',
        'current_activity_codes',
        'current_activity_titles',
        'suggested_activity_codes',
        'suggested_activity_titles',
        'missing_activities',
        'extra_activities',
        'action',
        'notes',
      ]),
      'project_activities'
    );
    XLSX.utils.book_append_sheet(
      workbook,
      rowsToSheet(activityGaps, [
        'gap_type',
        'project_id',
        'project_title',
        'tender_type',
        'issue',
        'suggested_master_codes',
        'notes',
      ]),
      'activity_gaps'
    );
    XLSX.utils.book_append_sheet(
      workbook,
      rowsToSheet(masterActivityGaps, [
        'proposed_code',
        'title',
        'shortTitle',
        'category',
        'tender_types',
        'projects_needing',
        'projects_missing_link',
        'in_master_list',
        'action',
        'notes',
      ]),
      'master_activity_gaps'
    );
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(meta), '_meta');

    XLSX.writeFile(workbook, outputPath);

    const legacyActivitiesPath = path.join(
      process.cwd(),
      'data',
      'exports',
      'activities-clean.xlsx'
    );
    if (fs.existsSync(legacyActivitiesPath) && legacyActivitiesPath !== outputPath) {
      fs.unlinkSync(legacyActivitiesPath);
    }

    const mergeCount = activityMergeRows.length;
    const addToDbCount = masterActivityRows.filter((r) => r.action === 'add_to_master').length;
    const anticipatedCount = masterActivityRows.filter((r) => r.action === 'anticipated').length;
    const keepCount = masterActivityRows.filter((r) => r.action === 'keep').length;

    console.log(`Appended to ${outputPath}`);
    console.log(`  sheets:       ${workbook.SheetNames.join(', ')}`);
    console.log(`  activities:          ${masterActivityRows.length} (${keepCount} existing + ${addToDbCount} add + ${anticipatedCount} anticipated)`);
    console.log(`  merged_duplicates:   ${mergeCount} (see activity_merges sheet)`);
    console.log(`  project_activities:    ${projectActivityMap.length}`);
    console.log(`  missing_suggestions:   ${missingLinks}`);
    console.log(`  activity_gaps:         ${activityGaps.length}`);
    console.log(`  master_activity_gaps:  ${masterActivityGaps.length}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Export failed:', err.message);
  process.exit(1);
});
