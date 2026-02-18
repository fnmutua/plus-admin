'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column exists
    const colExists = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'document' 
        AND column_name = 'climate_assessment_id'
      );
    `, { type: Sequelize.QueryTypes.SELECT });

    if (!colExists[0].exists) {
      // Add the column
      await queryInterface.sequelize.query(`
        ALTER TABLE document 
        ADD COLUMN climate_assessment_id INTEGER;
      `);

      // Add foreign key constraint
      await queryInterface.sequelize.query(`
        ALTER TABLE document 
        ADD CONSTRAINT fk_document_climate_assessment 
        FOREIGN KEY (climate_assessment_id) 
        REFERENCES climate_assessment(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
      `);

      // Add index for better query performance
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_document_climate_assessment_id 
        ON document(climate_assessment_id);
      `);
    }
  },

  down: async (queryInterface) => {
    // Drop foreign key constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE document 
      DROP CONSTRAINT IF EXISTS fk_document_climate_assessment;
    `);

    // Drop index
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_document_climate_assessment_id;
    `);

    // Drop column
    await queryInterface.sequelize.query(`
      ALTER TABLE document 
      DROP COLUMN IF EXISTS climate_assessment_id;
    `);
  },
};
