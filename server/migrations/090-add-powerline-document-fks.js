'use strict';

/**
 * Add the `document` foreign keys for powerline assets and powerlines.
 *
 * Facility photos are stored as `document` rows linked by a per-model FK column
 * (`newObj[field_id] = parent.id` in batchDocumentsUploadByParentCode). The FK map in
 * tables.controller.js already declared `powerline: 'powerline_id'`, but that column was
 * never created — so powerline photos uploaded fine and then linked to nothing, because
 * Sequelize drops attributes the model does not define.
 *
 * `powerline_asset_id` is new: it lets the powerline-asset form capture photos at all.
 *
 * Nullable and unindexed on purpose, matching the other facility FKs on this table
 * (e.g. road_asset_id, other_facility_id).
 */

const COLUMNS = ['powerline_asset_id', 'powerline_id'];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (const col of COLUMNS) {
      const exists = await queryInterface.sequelize.query(
        `
          SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'document'
              AND column_name = '${col}'
          );
        `,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (!exists[0].exists) {
        await queryInterface.addColumn('document', col, {
          type: Sequelize.INTEGER,
          allowNull: true,
        });
      }
    }
  },

  down: async (queryInterface) => {
    for (const col of COLUMNS) {
      await queryInterface.removeColumn('document', col).catch(() => {});
    }
  },
};
