'use strict';

/** Central SMS delivery log for admin tracking. */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [exists] = await queryInterface.sequelize.query(
      `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'sms_log'
        ) AS exists;
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (exists?.exists) return;

    await queryInterface.createTable('sms_log', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      source_module: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      source_type: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      source_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      sender_shortcode: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      destination: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'pending'
      },
      provider_code: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      provider_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      initiated_by_user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('sms_log', ['source_module'], { name: 'sms_log_source_module_idx' });
    await queryInterface.addIndex('sms_log', ['status'], { name: 'sms_log_status_idx' });
    await queryInterface.addIndex('sms_log', ['destination'], { name: 'sms_log_destination_idx' });
    await queryInterface.addIndex('sms_log', ['sent_at'], { name: 'sms_log_sent_at_idx' });
    await queryInterface.addIndex('sms_log', ['createdAt'], { name: 'sms_log_created_at_idx' });

    const [unExists] = await queryInterface.sequelize.query(
      `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'user_notification'
        ) AS exists;
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (unExists?.exists) {
      const unColumns = await queryInterface.sequelize.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_notification'`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      const unColSet = new Set(unColumns.map((row) => row.column_name));
      const unCreated = unColSet.has('created_at')
        ? 'created_at'
        : (unColSet.has('createdAt') ? '"createdAt"' : null);
      const unUpdated = unColSet.has('updated_at')
        ? 'updated_at'
        : (unColSet.has('updatedAt') ? '"updatedAt"' : null);
      const unSentExpr = unColSet.has('sent_at') ? 'un.sent_at' : null;
      const createdExpr = unCreated ? `COALESCE(un.${unCreated}, NOW())` : 'NOW()';
      const updatedExpr = unUpdated ? `COALESCE(un.${unUpdated}, ${createdExpr})` : createdExpr;
      const sentExpr = unSentExpr ? `COALESCE(${unSentExpr}, ${createdExpr})` : createdExpr;

      await queryInterface.sequelize.query(`
        INSERT INTO sms_log (
          source_module, source_type, source_id, sender_shortcode, destination, message,
          status, provider_code, provider_message, sent_at, "createdAt", "updatedAt"
        )
        SELECT
          un.source_module,
          un.source_type,
          un.source_id,
          'KISIP',
          COALESCE(un.address, ''),
          un.body,
          CASE
            WHEN LOWER(COALESCE(un.status, '')) = 'sent' THEN 'sent'
            WHEN LOWER(COALESCE(un.status, '')) = 'failed' THEN 'failed'
            ELSE 'pending'
          END,
          un.provider_code,
          un.provider_message,
          ${sentExpr},
          ${createdExpr},
          ${updatedExpr}
        FROM user_notification un
        WHERE LOWER(COALESCE(un.channel, '')) = 'sms'
          AND COALESCE(un.address, '') <> '';
      `);
    }
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('sms_log');
  }
};
