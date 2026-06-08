'use strict';

/**
 * Decouple settlement demographics from the settlement row:
 *   - settlement_population: per-settlement, per-year facts
 *   - county_population_growth_rate: per-county, per-year growth (population + households)
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableExists = async (tableName) => {
      const [row] = await queryInterface.sequelize.query(
        `
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = '${tableName}'
          ) AS exists;
        `,
        { type: Sequelize.QueryTypes.SELECT }
      );
      return Boolean(row?.exists);
    };

    if (!(await tableExists('settlement_population'))) {
      await queryInterface.createTable('settlement_population', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        settlement_id: {
          allowNull: false,
          type: Sequelize.INTEGER,
          references: { model: 'settlement', key: 'id' },
          onDelete: 'CASCADE',
        },
        year: {
          allowNull: false,
          type: Sequelize.INTEGER,
          comment: 'Reference year e.g. 2019 census baseline, 2024 projection',
        },
        population: {
          allowNull: false,
          type: Sequelize.INTEGER,
        },
        pop_male: {
          allowNull: true,
          type: Sequelize.INTEGER,
        },
        pop_female: {
          allowNull: true,
          type: Sequelize.INTEGER,
        },
        num_households: {
          allowNull: true,
          type: Sequelize.INTEGER,
        },
        source: {
          allowNull: false,
          type: Sequelize.STRING(32),
          comment: 'census_2019 | projected | building_estimate | manual | survey',
        },
        method: {
          allowNull: true,
          type: Sequelize.STRING(64),
          comment: 'e.g. county_compound_growth, county_sex_ratio_split',
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });

      await queryInterface.addIndex('settlement_population', ['settlement_id', 'year'], {
        unique: true,
        name: 'settlement_population_settlement_id_year_unique',
      });
      await queryInterface.addIndex('settlement_population', ['year'], {
        name: 'settlement_population_year_idx',
      });
      await queryInterface.addIndex('settlement_population', ['settlement_id'], {
        name: 'settlement_population_settlement_id_idx',
      });
    }

    if (!(await tableExists('county_population_growth_rate'))) {
      await queryInterface.createTable('county_population_growth_rate', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        county_id: {
          allowNull: false,
          type: Sequelize.INTEGER,
          references: { model: 'county', key: 'id' },
          onDelete: 'CASCADE',
        },
        year: {
          allowNull: false,
          type: Sequelize.INTEGER,
          comment: 'Year the annual_rate applies to',
        },
        annual_rate: {
          allowNull: false,
          type: Sequelize.DOUBLE,
          comment: 'Compound population growth e.g. 0.028 = 2.8%',
        },
        notes: {
          allowNull: true,
          type: Sequelize.TEXT,
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });

      await queryInterface.addIndex('county_population_growth_rate', ['county_id', 'year'], {
        unique: true,
        name: 'county_population_growth_rate_county_id_year_unique',
      });
      await queryInterface.addIndex('county_population_growth_rate', ['year'], {
        name: 'county_population_growth_rate_year_idx',
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('settlement_population');
    await queryInterface.dropTable('county_population_growth_rate');
  },
};
