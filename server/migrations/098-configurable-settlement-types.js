'use strict';

/**
 * Make settlement types configurable.
 *
 * The settlement_type table already held the two types but nothing read it —
 * every screen hardcoded its own list, with three incompatible value
 * conventions ('1'/'2', 1/2 and 'slum'/'Informal Settlement'). That drift put
 * a third value, 'Informal', into settlement.settlement_type.
 *
 * Settlements keep storing the label text, so nothing that reads the type as
 * text has to change. This migration gives the table the columns a managed
 * list needs, and normalises the values that drifted.
 */

/** Variants seen in the data or written by the old hardcoded dropdowns. */
const CANONICAL = {
  Informal: 'Informal Settlement',
  informal: 'Informal Settlement',
  informal_settlement: 'Informal Settlement',
  'informal settlement': 'Informal Settlement',
  slum: 'Slum',
  SLUM: 'Slum',
  1: 'Slum',
  2: 'Informal Settlement',
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = { tableName: 'settlement_type', schema: 'public' };
    const columns = await queryInterface.describeTable(table);

    if (!columns.code) {
      await queryInterface.addColumn(table, 'code', { type: Sequelize.STRING(50), allowNull: true });
    }
    if (!columns.active) {
      await queryInterface.addColumn(table, 'active', {
        type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true,
      });
    }
    if (!columns.sort_order) {
      await queryInterface.addColumn(table, 'sort_order', {
        type: Sequelize.INTEGER, allowNull: false, defaultValue: 0,
      });
    }
    if (!columns.description) {
      await queryInterface.addColumn(table, 'description', { type: Sequelize.TEXT, allowNull: true });
    }

    // `type` is the value stored on settlements, so it must be present and unique.
    await queryInterface.sequelize.query(
      `UPDATE settlement_type
          SET code = lower(regexp_replace(trim(type), '[^a-zA-Z0-9]+', '_', 'g')),
              sort_order = id
        WHERE code IS NULL AND type IS NOT NULL`
    );
    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS ux_settlement_type_code ON settlement_type (code) WHERE code IS NOT NULL`
    );
    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS ux_settlement_type_label ON settlement_type (lower(trim(type)))`
    );

    // Fold the drifted values onto the canonical labels.
    for (const [from, to] of Object.entries(CANONICAL)) {
      await queryInterface.sequelize.query(
        `UPDATE settlement SET settlement_type = :to WHERE settlement_type = :from`,
        { replacements: { from: String(from), to } }
      );
    }

    // Any value left that is not a known type becomes a type of its own rather
    // than being guessed at — losing a settlement's type silently is worse
    // than carrying an odd row into the managed list.
    await queryInterface.sequelize.query(
      `INSERT INTO settlement_type (type, code, active, sort_order, description, "createdAt", "updatedAt")
       SELECT DISTINCT s.settlement_type,
              lower(regexp_replace(trim(s.settlement_type), '[^a-zA-Z0-9]+', '_', 'g')),
              false, 99, 'Carried over from existing settlement data', now(), now()
         FROM settlement s
        WHERE s.settlement_type IS NOT NULL
          AND trim(s.settlement_type) <> ''
          AND NOT EXISTS (
            SELECT 1 FROM settlement_type t WHERE lower(trim(t.type)) = lower(trim(s.settlement_type))
          )`
    );
  },

  down: async (queryInterface) => {
    const table = { tableName: 'settlement_type', schema: 'public' };
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS ux_settlement_type_code`);
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS ux_settlement_type_label`);
    for (const column of ['code', 'active', 'sort_order', 'description']) {
      await queryInterface.removeColumn(table, column).catch(() => {});
    }
    // The normalised settlement values are deliberately left alone: 'Informal'
    // and 'Informal Settlement' were never meant to be different types.
  },
};
