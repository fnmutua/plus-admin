'use strict';

/**
 * Convert police_station."PC_Number_of_Vehicles" from varchar to integer.
 *
 * It is a count, and its sibling "PC_Number_of_Officers" is already an integer — the varchar
 * type meant the app sent and stored it as a string, so it sorted lexicographically ("10" < "2")
 * and could not be aggregated without a cast.
 *
 * Every stored value is a plain digit string or empty; verified before writing this migration:
 *   SELECT DISTINCT "PC_Number_of_Vehicles" FROM police_station
 *   WHERE "PC_Number_of_Vehicles" IS NOT NULL
 *     AND trim("PC_Number_of_Vehicles") <> ''
 *     AND "PC_Number_of_Vehicles" !~ '^[0-9]+$';   -- returns no rows
 *
 * NULLIF maps blanks to NULL rather than failing the cast.
 */

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE police_station
      ALTER COLUMN "PC_Number_of_Vehicles" TYPE integer
      USING NULLIF(btrim("PC_Number_of_Vehicles"), '')::integer;
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE police_station
      ALTER COLUMN "PC_Number_of_Vehicles" TYPE character varying
      USING "PC_Number_of_Vehicles"::character varying;
    `);
  },
};
