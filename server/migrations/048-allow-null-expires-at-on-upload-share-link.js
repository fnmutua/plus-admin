'use strict';

/** upload_share_link.expiresAt must be nullable (blank expiry = link never expires). */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [tableRow] = await queryInterface.sequelize.query(
      `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'upload_share_link'
        ) AS exists;
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!tableRow?.exists) return;

    await queryInterface.sequelize.query(
      'ALTER TABLE "upload_share_link" ALTER COLUMN "expiresAt" DROP NOT NULL;'
    );
  },

  down: async (queryInterface, Sequelize) => {
    const [tableRow] = await queryInterface.sequelize.query(
      `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'upload_share_link'
        ) AS exists;
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!tableRow?.exists) return;

    // Backfill nulls before re-adding NOT NULL (reversible default: 1 year from now)
    await queryInterface.sequelize.query(
      `UPDATE "upload_share_link" SET "expiresAt" = NOW() + INTERVAL '1 year' WHERE "expiresAt" IS NULL;`
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "upload_share_link" ALTER COLUMN "expiresAt" SET NOT NULL;'
    );
  }
};
