const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../models');
const { getSettingConfigValue } = require('./moduleSettingsCache');

const TABLE = 'user_auth_sessions';
const AUTH_MAX_DEVICES_MODULE = 'auth_max_devices';

async function fetchAuthMaxDevicesLimit() {
  const setting = await db.models.module_settings.findOne({
    where: { module: AUTH_MAX_DEVICES_MODULE },
  });
  if (!setting) {
    return String(process.env.MAX_DEVICES_PER_USER ?? '5');
  }
  if (setting.enabled === false) return '0';
  return setting.config_value ?? '5';
}

async function getMaxDevicesPerUser() {
  try {
    const raw = await getSettingConfigValue(
      AUTH_MAX_DEVICES_MODULE,
      fetchAuthMaxDevicesLimit
    );
    const n = parseInt(raw, 10);
    if (!isNaN(n)) return n;
  } catch (error) {
    console.error('Failed to read auth_max_devices setting:', error);
  }

  const envRaw = process.env.MAX_DEVICES_PER_USER;
  if (envRaw == null || envRaw === '') return 5;
  const envN = parseInt(envRaw, 10);
  return isNaN(envN) ? 5 : envN;
}
function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.connection?.remoteAddress
    || req.socket?.remoteAddress
    || 'Unknown'
  );
}

function buildDeviceFingerprint(req) {
  const userAgent = String(req.headers['user-agent'] || 'unknown');
  const deviceId = String(req.headers['x-device-id'] || req.body?.deviceId || '');
  return crypto
    .createHash('sha256')
    .update(`${userAgent}|${deviceId}`)
    .digest('hex');
}

function parseDeviceLabel(userAgent) {
  const ua = String(userAgent || '');
  if (!ua) return 'Unknown device';
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return 'Android device';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'Mac';
  if (/Linux/i.test(ua)) return 'Linux';
  return ua.length > 48 ? `${ua.slice(0, 45)}…` : ua;
}

async function purgeExpiredSessions(userId = null) {
  const now = new Date();
  const replacements = { now };
  let userClause = '';
  if (userId != null) {
    userClause = 'AND user_id = :userId';
    replacements.userId = userId;
  }
  await db.sequelize.query(
    `
      DELETE FROM ${TABLE}
      WHERE expires_at < :now
         OR revoked_at IS NOT NULL
      ${userClause}
    `,
    { replacements }
  );
}

async function getActiveSessions(userId) {
  await purgeExpiredSessions(userId);
  return db.sequelize.query(
    `
      SELECT id, device_label, ip_address, user_agent, last_seen_at, created_at, device_fingerprint
      FROM ${TABLE}
      WHERE user_id = :userId
        AND revoked_at IS NULL
        AND expires_at >= NOW()
      ORDER BY last_seen_at DESC
    `,
    {
      replacements: { userId },
      type: db.sequelize.QueryTypes.SELECT
    }
  );
}

async function findActiveSessionByFingerprint(userId, fingerprint) {
  const rows = await db.sequelize.query(
    `
      SELECT id
      FROM ${TABLE}
      WHERE user_id = :userId
        AND device_fingerprint = :fingerprint
        AND revoked_at IS NULL
        AND expires_at >= NOW()
      LIMIT 1
    `,
    {
      replacements: { userId, fingerprint },
      type: db.sequelize.QueryTypes.SELECT
    }
  );
  return rows[0] || null;
}

async function revokeSession(sessionId) {
  if (!sessionId) return;
  await db.sequelize.query(
    `
      UPDATE ${TABLE}
      SET revoked_at = NOW(), updated_at = NOW()
      WHERE id = :sessionId AND revoked_at IS NULL
    `,
    { replacements: { sessionId } }
  );
}

async function revokeAllSessionsForUser(userId) {
  await db.sequelize.query(
    `
      UPDATE ${TABLE}
      SET revoked_at = NOW(), updated_at = NOW()
      WHERE user_id = :userId AND revoked_at IS NULL
    `,
    { replacements: { userId } }
  );
}

async function createSession(userId, req, expiresInSec) {
  const sessionId = uuidv4();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInSec * 1000);
  const userAgent = String(req.headers['user-agent'] || '');
  const fingerprint = buildDeviceFingerprint(req);

  await db.sequelize.query(
    `
      INSERT INTO ${TABLE}
        (id, user_id, device_fingerprint, device_label, ip_address, user_agent, last_seen_at, expires_at, created_at, updated_at)
      VALUES
        (:id, :userId, :fingerprint, :deviceLabel, :ipAddress, :userAgent, :now, :expiresAt, :now, :now)
    `,
    {
      replacements: {
        id: sessionId,
        userId,
        fingerprint,
        deviceLabel: parseDeviceLabel(userAgent),
        ipAddress: getClientIp(req),
        userAgent,
        now,
        expiresAt
      }
    }
  );

  return sessionId;
}

/**
 * Register a login session. Returns { ok: true, sessionId } or { ok: false, ... }.
 */
async function registerLoginSession(userId, req, expiresInSec = 86400, options = {}) {
  if (options.skipDeviceLimit) {
    const sessionId = await createSession(userId, req, expiresInSec);
    return { ok: true, sessionId };
  }

  const maxDevices = await getMaxDevicesPerUser();
  const fingerprint = buildDeviceFingerprint(req);
  const existingSameDevice = await findActiveSessionByFingerprint(userId, fingerprint);

  if (existingSameDevice) {
    await revokeSession(existingSameDevice.id);
  }

  if (maxDevices > 0) {
    const activeSessions = await getActiveSessions(userId);
    const isNewDevice = !existingSameDevice;
    if (isNewDevice && activeSessions.length >= maxDevices) {
      return {
        ok: false,
        status: 409,
        code: 'DEVICE_LIMIT_REACHED',
        message: `You are already signed in on the maximum of ${maxDevices} device(s). Sign out on another device before logging in here.`,
        maxDevices,
        activeDevices: activeSessions.map((s) => ({
          deviceLabel: s.device_label,
          ipAddress: s.ip_address,
          lastSeenAt: s.last_seen_at
        }))
      };
    }
  }

  const sessionId = await createSession(userId, req, expiresInSec);
  return { ok: true, sessionId };
}

async function validateSession(userId, sessionId) {
  if (!sessionId) return true;
  const rows = await db.sequelize.query(
    `
      SELECT id
      FROM ${TABLE}
      WHERE id = :sessionId
        AND user_id = :userId
        AND revoked_at IS NULL
        AND expires_at >= NOW()
      LIMIT 1
    `,
    {
      replacements: { sessionId, userId },
      type: db.sequelize.QueryTypes.SELECT
    }
  );
  return rows.length > 0;
}

async function touchSession(sessionId, expiresInSec = 86400) {
  if (!sessionId) return;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInSec * 1000);
  await db.sequelize.query(
    `
      UPDATE ${TABLE}
      SET last_seen_at = NOW(),
          updated_at = NOW(),
          expires_at = :expiresAt
      WHERE id = :sessionId AND revoked_at IS NULL
    `,
    { replacements: { sessionId, expiresAt } }
  );
}

module.exports = {
  getMaxDevicesPerUser,
  buildDeviceFingerprint,
  parseDeviceLabel,
  registerLoginSession,
  validateSession,
  touchSession,
  revokeSession,
  revokeAllSessionsForUser,
  getActiveSessions
};
