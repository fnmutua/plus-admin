'use strict';

/**
 * Backfill project.region from primary project_location county using
 * SUD Regional Tracker groupings (tools/SUD Regional Tracker (1).xlsx).
 */
function normalizeCountyKey(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Canonical region labels (match PROJECT_REGION_OPTIONS in the app). */
const COUNTY_TO_REGION = {
  // Central
  laikipia: 'Central',
  muranga: 'Central',
  nyandarua: 'Central',
  nyeri: 'Central',
  kirinyaga: 'Central',

  // Coast & North Eastern
  garissa: 'Coast & North Eastern',
  kilifi: 'Coast & North Eastern',
  kwale: 'Coast & North Eastern',
  lamu: 'Coast & North Eastern',
  mandera: 'Coast & North Eastern',
  marsabit: 'Coast & North Eastern',
  mombasa: 'Coast & North Eastern',
  'taita taveta': 'Coast & North Eastern',
  'tana river': 'Coast & North Eastern',
  wajir: 'Coast & North Eastern',

  // Eastern
  embu: 'Eastern',
  isiolo: 'Eastern',
  kitui: 'Eastern',
  makueni: 'Eastern',
  meru: 'Eastern',
  'tharaka nithi': 'Eastern',

  // Metropolitan (NAIROBI METRO sheet)
  kajiado: 'Metropolitan',
  machakos: 'Metropolitan',
  kiambu: 'Metropolitan',

  // Nairobi
  nairobi: 'Nairobi',

  // Nyanza
  'homa bay': 'Nyanza',
  homabay: 'Nyanza',
  kisumu: 'Nyanza',
  migori: 'Nyanza',
  siaya: 'Nyanza',

  // Rift Valley - North (N.RIFT)
  'elgeyo marakwet': 'Rift Valley - North',
  nandi: 'Rift Valley - North',
  'trans nzoia': 'Rift Valley - North',
  'uasin gishu': 'Rift Valley - North',
  turkana: 'Rift Valley - North',
  'west pokot': 'Rift Valley - North',
  samburu: 'Rift Valley - North',

  // Rift Valley - South (S.RIFT)
  baringo: 'Rift Valley - South',
  bomet: 'Rift Valley - South',
  kericho: 'Rift Valley - South',
  nakuru: 'Rift Valley - South',
  narok: 'Rift Valley - South',

  // West Rift Valley (WEST RIFT sheet)
  kisii: 'West Rift Valley',
  nyamira: 'West Rift Valley',

  // Western
  bungoma: 'Western',
  busia: 'Western',
  kakamega: 'Western',
  vihiga: 'Western',
};

function regionForCountyName(name) {
  return COUNTY_TO_REGION[normalizeCountyKey(name)] || null;
}

module.exports = {
  up: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;

    const [counties] = await sequelize.query('SELECT id, name FROM county');
    const regionByCountyId = new Map();
    for (const county of counties) {
      const region = regionForCountyName(county.name);
      if (region) regionByCountyId.set(Number(county.id), region);
    }

    const [projects] = await sequelize.query(`
      SELECT id, implementation_scope
      FROM project
      WHERE region IS NULL OR TRIM(region) = ''
    `);

    let updated = 0;
    let skippedNational = 0;
    let skippedNoLocation = 0;
    let skippedUnmapped = 0;

    for (const project of projects) {
      if (String(project.implementation_scope || '').toLowerCase() === 'national') {
        skippedNational += 1;
        continue;
      }

      const [locations] = await sequelize.query(
        `
        SELECT pl.county_id, COUNT(*)::int AS location_count
        FROM project_location pl
        WHERE pl.project_id = :projectId
          AND pl.county_id IS NOT NULL
        GROUP BY pl.county_id
        ORDER BY location_count DESC, MIN(pl.id) ASC
        LIMIT 1
        `,
        { replacements: { projectId: project.id } },
      );

      if (!locations.length) {
        skippedNoLocation += 1;
        continue;
      }

      const region = regionByCountyId.get(Number(locations[0].county_id));
      if (!region) {
        skippedUnmapped += 1;
        continue;
      }

      await sequelize.query(
        `
        UPDATE project
        SET region = :region, "updatedAt" = NOW()
        WHERE id = :projectId
        `,
        { replacements: { region, projectId: project.id } },
      );
      updated += 1;
    }

    console.log(
      `[065] Backfilled project.region: ${updated} updated, ${skippedNational} national skipped, ${skippedNoLocation} without county location, ${skippedUnmapped} unmapped county`,
    );
  },

  down: async () => {
    // Non-destructive data backfill; no rollback.
  },
};
