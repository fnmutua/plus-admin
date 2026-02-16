'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if table already exists
    const tableExists = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'climate_assessment'
      );
    `, { type: Sequelize.QueryTypes.SELECT });

    if (!tableExists[0].exists) {
      await queryInterface.createTable('climate_assessment', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      settlement_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'settlement', key: 'id' },
        onDelete: 'CASCADE',
      },
      project_location_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'project_location', key: 'id' },
        onDelete: 'CASCADE',
      },
      assessor_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      assessed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'draft',
      },
      hazard_score: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      exposure_score: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      sensitivity_score: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      adaptive_capacity_score: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      vulnerability_rating: {
        type: Sequelize.STRING(32),
        allowNull: true,
      },
      hazard_responses: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      exposure_responses: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      sensitivity_responses: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      adaptive_capacity_responses: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      });
    } else {
      // Table exists, check and add missing columns
      const columns = [
        { name: 'settlement_id', type: 'INTEGER', allowNull: true },
        { name: 'project_location_id', type: 'INTEGER', allowNull: true },
        { name: 'assessor_id', type: 'INTEGER', allowNull: true },
        { name: 'assessed_at', type: 'DATE', allowNull: true },
        { name: 'status', type: 'VARCHAR(32)', allowNull: false, defaultValue: "'draft'" },
        { name: 'hazard_score', type: 'DECIMAL(10, 2)', allowNull: true },
        { name: 'exposure_score', type: 'DECIMAL(10, 2)', allowNull: true },
        { name: 'sensitivity_score', type: 'DECIMAL(10, 2)', allowNull: true },
        { name: 'adaptive_capacity_score', type: 'DECIMAL(10, 2)', allowNull: true },
        { name: 'vulnerability_rating', type: 'VARCHAR(32)', allowNull: true },
        { name: 'hazard_responses', type: 'JSONB', allowNull: true },
        { name: 'exposure_responses', type: 'JSONB', allowNull: true },
        { name: 'sensitivity_responses', type: 'JSONB', allowNull: true },
        { name: 'adaptive_capacity_responses', type: 'JSONB', allowNull: true },
        { name: 'created_at', type: 'DATE', allowNull: true },
        { name: 'updated_at', type: 'DATE', allowNull: true }
      ];

      for (const col of columns) {
        const colExists = await queryInterface.sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'climate_assessment' 
            AND column_name = '${col.name}'
          );
        `, { type: Sequelize.QueryTypes.SELECT });

        if (!colExists[0].exists) {
          const defaultValue = col.defaultValue ? ` DEFAULT ${col.defaultValue}` : '';
          const notNull = col.allowNull === false ? ' NOT NULL' : '';
          await queryInterface.sequelize.query(`
            ALTER TABLE climate_assessment 
            ADD COLUMN ${col.name} ${col.type}${notNull}${defaultValue};
          `);
        }
      }

      // Add foreign key constraints if they don't exist (only if columns exist)
      try {
        const fkSettlement = await queryInterface.sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.table_constraints 
            WHERE constraint_name = 'climate_assessment_settlement_id_fkey'
          );
        `, { type: Sequelize.QueryTypes.SELECT });

        if (!fkSettlement[0].exists) {
          const settlementColExists = await queryInterface.sequelize.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = 'climate_assessment' AND column_name = 'settlement_id'
            );
          `, { type: Sequelize.QueryTypes.SELECT });

          if (settlementColExists[0].exists) {
            await queryInterface.addConstraint('climate_assessment', {
              fields: ['settlement_id'],
              type: 'foreign key',
              name: 'climate_assessment_settlement_id_fkey',
              references: { table: 'settlement', field: 'id' },
              onDelete: 'CASCADE'
            });
          }
        }
      } catch (err) {
        // Foreign key might already exist or table might not have the column yet
        console.log('Note: Could not add foreign key constraint (may already exist)');
      }
    }

    // Add indexes if they don't exist
    const indexes = [
      { name: 'climate_assessment_settlement_idx', columns: ['settlement_id'] },
      { name: 'climate_assessment_project_location_idx', columns: ['project_location_id'] },
      { name: 'climate_assessment_status_idx', columns: ['status'] }
    ];

    for (const idx of indexes) {
      // Check if the column exists before creating index
      const colExists = await queryInterface.sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'climate_assessment' 
          AND column_name = '${idx.columns[0]}'
        );
      `, { type: Sequelize.QueryTypes.SELECT });

      if (colExists[0].exists) {
        const indexExists = await queryInterface.sequelize.query(`
          SELECT EXISTS (
            SELECT FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND indexname = '${idx.name}'
          );
        `, { type: Sequelize.QueryTypes.SELECT });

        if (!indexExists[0].exists) {
          await queryInterface.addIndex('climate_assessment', idx.columns, {
            name: idx.name,
          });
        }
      }
    }

    // Add constraint if it doesn't exist
    const constraintExists = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM pg_constraint 
        WHERE conname = 'climate_assessment_one_target'
      );
    `, { type: Sequelize.QueryTypes.SELECT });

    if (!constraintExists[0].exists) {
      await queryInterface.sequelize.query(`
        ALTER TABLE climate_assessment ADD CONSTRAINT climate_assessment_one_target
        CHECK (
          (settlement_id IS NOT NULL AND project_location_id IS NULL) OR
          (settlement_id IS NULL AND project_location_id IS NOT NULL)
        )
      `);
    }
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(
      'ALTER TABLE climate_assessment DROP CONSTRAINT IF EXISTS climate_assessment_one_target'
    );
    await queryInterface.dropTable('climate_assessment');
  },
};
