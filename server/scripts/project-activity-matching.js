/**
 * Infer project activities from tender/project titles (shared by export + import).
 */

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

function uniqCodes(codes) {
  return [...new Set(codes.map(normalizeActivityCode).filter(Boolean))];
}

/**
 * Programme-level fallback when title rules alone do not match.
 */
function programmeFallbackActivities(programmeAcronym, title) {
  const prog = String(programmeAcronym || '').toLowerCase();
  const t = String(title || '');

  if (prog.includes('infra')) {
    return uniqCodes(KISIP2_INFRASTRUCTURE_BUNDLE);
  }
  if (prog.includes('tenure')) {
    return uniqCodes(PLANNING_SURVEY_BUNDLE);
  }
  if (prog.includes('capacity') || prog.includes('institutional')) {
    if (/mapping|geodatabase|slums\/informal/i.test(t)) return ['AC29'];
    if (/national slum upgrading/i.test(t)) return ['AC27'];
    if (/gis|information hub/i.test(t)) return ['AC28'];
    if (/county-specific strateg|slum prevention|slum upgrading strateg/i.test(t)) return ['AC31'];
    return inferActivityCodes(t);
  }
  if (prog.includes('livelihood')) {
    if (/vulnerable|safety net/i.test(t)) return ['AC11'];
    if (/cdp|community development plan|community investment/i.test(t)) return ['AC10', 'AC36'];
    if (/dpw|digital public works/i.test(t)) return ['AC13'];
    if (/licw|labour-intensive/i.test(t)) return ['AC12'];
    return ['AC10'];
  }
  return [];
}

/**
 * KISIP II project → activity codes with conflict resolution.
 * Fixes false "Lot N" / cluster matches on infrastructure upgrading projects.
 */
function inferKisipProjectActivityCodes(title, programmeAcronym) {
  const t = String(title || '');

  if (/infrastructures?\s+upgrading|infrastructure upgrading works/i.test(t)) {
    return uniqCodes(KISIP2_INFRASTRUCTURE_BUNDLE);
  }

  if (/national slum upgrading strategy|updating of the national slum upgrading/i.test(t)) {
    return ['AC27'];
  }

  if (/county-specific strateg|slum prevention and upgrading|county slum upgrading strateg/i.test(t)) {
    return ['AC31'];
  }

  if (/mapping of slums|geodatabase for slums|mapping of informal|informal settlements mapped/i.test(t)) {
    return ['AC29'];
  }

  if (/gis-based housing|information hub|gis and ict/i.test(t)) {
    return ['AC28'];
  }

  if (/community development plan|\bcdp\b|community investment sub-?project/i.test(t)) {
    return uniqCodes(['AC10', 'AC36']);
  }

  if (
    /survey and planning|planning and surveying|physical planning|cadastral survey|topographical survey|consultancy services.*planning|registry index|\brims\b/i.test(
      t,
    ) &&
    !/infrastructure upgrading/i.test(t)
  ) {
    return uniqCodes(PLANNING_SURVEY_BUNDLE);
  }

  if (/preparation of raps|\braps\b|resettlement action plan/i.test(t)) {
    return uniqCodes(['AC-RAP', ...PLANNING_SURVEY_BUNDLE]);
  }

  let codes = inferActivityCodes(t);
  const planningSet = new Set(PLANNING_SURVEY_BUNDLE.map(normalizeActivityCode));

  if (/infrastructure upgrading/i.test(t)) {
    codes = codes.filter((code) => !planningSet.has(code));
    if (!codes.length) codes = KISIP2_INFRASTRUCTURE_BUNDLE.map(normalizeActivityCode);
  }

  if (!codes.length) {
    codes = programmeFallbackActivities(programmeAcronym, t);
  }

  return uniqCodes(codes);
}


module.exports = {
  KISIP2_INFRASTRUCTURE_BUNDLE,
  PLANNING_SURVEY_BUNDLE,
  CODE_ALIASES,
  TENDER_RULES,
  normalizeActivityCode,
  inferTenderType,
  inferActivityCodes,
  inferKisipProjectActivityCodes,
  programmeFallbackActivities,
};
