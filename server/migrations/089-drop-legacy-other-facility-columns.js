'use strict';

/**
 * Drop the `other_facility` columns that belong to facilities which now have their own
 * model and screens (floodlight, powerline, police, dumping sites, hazards).
 *
 * `other_facility` is the catch-all for facility types with no dedicated module, so it had
 * accumulated a union of every specialised field. Those are already owned elsewhere —
 * e.g. hazard frequency by `hazard_zone.frequency_of_occurrence`, waste type by
 * `dumping_site.DS_Type_of_Waste`, rating/height by `floodlight.Rating_Watts` /
 * `Height_Meters` — leaving these copies unwritten by any current form.
 *
 * The columns are already removed from the Sequelize model, so nothing reads or writes them;
 * this reclaims the schema. NOTE: this discards any legacy values still stored in them —
 * check for non-null data before running (see the query in the comment below).
 *
 *   SELECT count(*) FILTER (WHERE frequency IS NOT NULL)      AS frequency,
 *          count(*) FILTER (WHERE type_waste IS NOT NULL)     AS type_waste,
 *          count(*) FILTER (WHERE cost_per_use IS NOT NULL)   AS cost_per_use,
 *          count(*) FILTER (WHERE number_stances IS NOT NULL) AS number_stances,
 *          count(*) FILTER (WHERE number_staff IS NOT NULL)   AS number_staff,
 *          count(*) FILTER (WHERE number_phases IS NOT NULL)  AS number_phases,
 *          count(*) FILTER (WHERE rating IS NOT NULL)         AS rating,
 *          count(*) FILTER (WHERE size_reserve IS NOT NULL)   AS size_reserve,
 *          count(*) FILTER (WHERE number_vehicles IS NOT NULL) AS number_vehicles,
 *          count(*) FILTER (WHERE date_install IS NOT NULL)   AS date_install,
 *          count(*) FILTER (WHERE height IS NOT NULL)         AS height,
 *          count(*) FILTER (WHERE hazard IS NOT NULL)         AS hazard
 *   FROM other_facility;
 *
 * `down` restores the columns with their original types, but not their data.
 */

const LEGACY_COLUMNS = [
  'frequency',
  'type_waste',
  'cost_per_use',
  'number_stances',
  'number_staff',
  'number_phases',
  'rating',
  'size_reserve',
  'number_vehicles',
  'date_install',
  'height',
  'hazard',
];

module.exports = {
  up: async (queryInterface) => {
    for (const col of LEGACY_COLUMNS) {
      await queryInterface.removeColumn('other_facility', col).catch(() => {});
    }
  },

  down: async (queryInterface, Sequelize) => {
    const restore = {
      frequency: { type: Sequelize.STRING, allowNull: true },
      type_waste: { type: Sequelize.STRING, allowNull: true },
      cost_per_use: { type: Sequelize.INTEGER, allowNull: true },
      number_stances: { type: Sequelize.INTEGER, allowNull: true },
      number_staff: { type: Sequelize.INTEGER, allowNull: true },
      number_phases: { type: Sequelize.STRING, allowNull: true },
      rating: { type: Sequelize.STRING, allowNull: true },
      size_reserve: { type: Sequelize.INTEGER, allowNull: true },
      number_vehicles: { type: Sequelize.INTEGER, allowNull: true },
      date_install: { type: Sequelize.DATE, allowNull: true },
      height: { type: Sequelize.INTEGER, allowNull: true },
      hazard: { type: Sequelize.STRING, allowNull: true },
    };

    for (const [col, spec] of Object.entries(restore)) {
      await queryInterface.addColumn('other_facility', col, spec).catch(() => {});
    }
  },
};
