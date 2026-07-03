'use strict';

/** Unified per-user SMS/email delivery inbox. */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [exists] = await queryInterface.sequelize.query(
      `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'user_notification'
        ) AS exists;
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!exists?.exists) {
      await queryInterface.createTable('user_notification', {
        id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        channel: { type: Sequelize.STRING(20), allowNull: false },
        subject: { type: Sequelize.STRING(255), allowNull: true },
        body: { type: Sequelize.TEXT, allowNull: false },
        source_module: { type: Sequelize.STRING(50), allowNull: false },
        source_type: { type: Sequelize.STRING(50), allowNull: true },
        source_id: { type: Sequelize.INTEGER, allowNull: true },
        status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'pending' },
        provider_code: { type: Sequelize.STRING(50), allowNull: true },
        provider_message: { type: Sequelize.TEXT, allowNull: true },
        address: { type: Sequelize.STRING(255), allowNull: true },
        sent_at: { type: Sequelize.DATE, allowNull: true },
        read_at: { type: Sequelize.DATE, allowNull: true },
        legacy_table: { type: Sequelize.STRING(80), allowNull: true },
        legacy_id: { type: Sequelize.INTEGER, allowNull: true },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      await queryInterface.addIndex('user_notification', ['user_id'], {
        name: 'user_notification_user_id_idx'
      });
      await queryInterface.addIndex('user_notification', ['user_id', 'sent_at'], {
        name: 'user_notification_user_sent_idx'
      });
      await queryInterface.addIndex('user_notification', ['user_id', 'read_at'], {
        name: 'user_notification_user_read_idx'
      });
      await queryInterface.addIndex('user_notification', ['channel'], {
        name: 'user_notification_channel_idx'
      });
      await queryInterface.addIndex('user_notification', ['status'], {
        name: 'user_notification_status_idx'
      });
      await queryInterface.addIndex('user_notification', ['legacy_table', 'legacy_id'], {
        name: 'user_notification_legacy_unique',
        unique: true
      });
    }

    const crColumns = await queryInterface.sequelize.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'communication_recipient'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const crColSet = new Set(crColumns.map((row) => row.column_name));
    const quoteCol = (name) => (name && name.includes('_') ? name : `"${name}"`);
    const crCreated = crColSet.has('created_at')
      ? 'created_at'
      : (crColSet.has('createdAt') ? 'createdAt' : null);
    const crUpdated = crColSet.has('updated_at')
      ? 'updated_at'
      : (crColSet.has('updatedAt') ? 'updatedAt' : null);
    const crCreatedSql = crCreated ? quoteCol(crCreated) : null;
    const crUpdatedSql = crUpdated ? quoteCol(crUpdated) : null;
    const crSentExpr = crCreatedSql ? `COALESCE(cr.sent_at, cr.${crCreatedSql})` : 'COALESCE(cr.sent_at, NOW())';
    const crCreatedExpr = crCreatedSql ? `COALESCE(cr.${crCreatedSql}, NOW())` : 'NOW()';
    const crUpdatedExpr = crUpdatedSql ? `COALESCE(cr.${crUpdatedSql}, NOW())` : crCreatedExpr;

    if (crColSet.size > 0) {
      await queryInterface.sequelize.query(`
        INSERT INTO user_notification (
          user_id, channel, subject, body, source_module, source_type, source_id,
          status, provider_code, provider_message, address, sent_at,
          legacy_table, legacy_id, created_at, updated_at
        )
        SELECT
          cr.user_id,
          cr.channel,
          c.subject,
          c.body,
          'communication',
          'broadcast',
          c.id,
          CASE
            WHEN LOWER(COALESCE(cr.status, '')) = 'sent' THEN 'sent'
            WHEN LOWER(COALESCE(cr.status, '')) = 'failed' THEN 'failed'
            ELSE 'pending'
          END,
          cr.provider_code,
          cr.provider_message,
          cr.address,
          ${crSentExpr},
          'communication_recipient',
          cr.id,
          ${crCreatedExpr},
          ${crUpdatedExpr}
        FROM communication_recipient cr
        INNER JOIN communication c ON c.id = cr.communication_id
        WHERE cr.user_id IS NOT NULL
        ON CONFLICT (legacy_table, legacy_id) DO NOTHING;
      `);
    }

    const users = await queryInterface.sequelize.query(
      `SELECT id, phone, email FROM users WHERE phone IS NOT NULL OR email IS NOT NULL`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const gnColumns = await queryInterface.sequelize.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'grievance_notification'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const gnColSet = new Set(gnColumns.map((row) => row.column_name));
    const gnCreated = gnColSet.has('created_at') ? 'created_at' : (gnColSet.has('createdAt') ? 'createdAt' : null);
    const gnUpdated = gnColSet.has('updated_at') ? 'updated_at' : (gnColSet.has('updatedAt') ? 'updatedAt' : null);
    const gnSelectCols = ['id', 'grievance_id', 'message', 'medium', 'type', 'recipient', 'status'];
    if (gnCreated) gnSelectCols.push(gnCreated);
    if (gnUpdated && gnUpdated !== gnCreated) gnSelectCols.push(gnUpdated);

    const grievanceRows = gnColSet.size > 0
      ? await queryInterface.sequelize.query(
        `SELECT ${gnSelectCols.map((col) => (col.includes('_') ? col : `"${col}"`)).join(', ')} FROM grievance_notification`,
        { type: Sequelize.QueryTypes.SELECT }
      )
      : [];

    const normalizePhone = (value) => {
      if (!value) return '';
      let digits = String(value).replace(/\D/g, '');
      if (digits.startsWith('0')) digits = `254${digits.slice(1)}`;
      if (!digits.startsWith('254') && digits.length <= 10) digits = `254${digits}`;
      return digits;
    };

    const userByPhone = new Map();
    const userByEmail = new Map();
    for (const user of users) {
      if (user.phone) userByPhone.set(normalizePhone(user.phone), user.id);
      if (user.email) userByEmail.set(String(user.email).trim().toLowerCase(), user.id);
    }

    for (const row of grievanceRows) {
      const medium = String(row.medium || '').toLowerCase();
      const channel = medium.includes('mail') ? 'email' : 'sms';
      const address = row.recipient || '';
      const userId = channel === 'email'
        ? userByEmail.get(String(address).trim().toLowerCase())
        : userByPhone.get(normalizePhone(address));
      if (!userId) continue;

      const statusRaw = String(row.status || '').toLowerCase();
      let status = 'sent';
      if (statusRaw.includes('fail') || statusRaw.includes('error') || statusRaw.includes('disable')) {
        status = 'failed';
      } else if (statusRaw.includes('pending')) {
        status = 'pending';
      }

      await queryInterface.sequelize.query(
        `
          INSERT INTO user_notification (
            user_id, channel, subject, body, source_module, source_type, source_id,
            status, address, sent_at, legacy_table, legacy_id, created_at, updated_at
          )
          VALUES (
            :userId, :channel, :subject, :body, 'grievance', :sourceType, :sourceId,
            :status, :address, :sentAt, 'grievance_notification', :legacyId, :createdAt, :updatedAt
          )
          ON CONFLICT (legacy_table, legacy_id) DO NOTHING;
        `,
        {
          replacements: {
            userId,
            channel,
            subject: row.type || 'Grievance notification',
            body: row.message,
            sourceType: row.type || 'notification',
            sourceId: row.grievance_id,
            status,
            address,
            sentAt: row.created_at || row.createdAt,
            legacyId: row.id,
            createdAt: row.created_at || row.createdAt || new Date(),
            updatedAt: row.updated_at || row.updatedAt || row.created_at || row.createdAt || new Date()
          }
        }
      );
    }
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('user_notification');
  }
};
