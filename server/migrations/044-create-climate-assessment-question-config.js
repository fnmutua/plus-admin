'use strict';

const fs = require('fs');
const path = require('path');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS public.climate_assessment_question_config (
        id SERIAL PRIMARY KEY,
        version INTEGER NOT NULL DEFAULT 1,
        config JSONB NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_by INTEGER NULL REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        updated_by INTEGER NULL REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS climate_assessment_question_config_active_uniq
      ON public.climate_assessment_question_config (is_active)
      WHERE is_active = TRUE;
    `);

    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM public.climate_assessment_question_config WHERE is_active = TRUE LIMIT 1;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!existing) {
      const configPath = path.join(__dirname, '../app/config/climate_assessment_questions.json');
      const raw = fs.readFileSync(configPath, 'utf8');
      const parsed = JSON.parse(raw);
      await queryInterface.sequelize.query(
        `
          INSERT INTO public.climate_assessment_question_config
            (version, config, is_active, "createdAt", "updatedAt")
          VALUES
            (1, :config::jsonb, TRUE, NOW(), NOW());
        `,
        {
          replacements: { config: JSON.stringify(parsed) },
          type: Sequelize.QueryTypes.INSERT,
        }
      );
    }

    const [hasVersion] = await queryInterface.sequelize.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'climate_assessment'
          AND column_name = 'question_config_version'
      ) AS exists;
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!hasVersion?.exists) {
      await queryInterface.addColumn('climate_assessment', 'question_config_version', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    await queryInterface.sequelize.query(`
      UPDATE public.climate_assessment
      SET question_config_version = 1
      WHERE question_config_version IS NULL;
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('climate_assessment', 'question_config_version').catch(() => {});
    await queryInterface.sequelize.query(`DROP TABLE IF EXISTS public.climate_assessment_question_config;`);
  }
};
