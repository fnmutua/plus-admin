const db = require('../models');

/**
 * Utility functions for tracking user session duration
 */

/**
 * Parse a date value robustly:
 * - Return Date if already a Date
 * - Try native Date parsing
 * - Fallback: append 'Z' to treat as UTC if no TZ info
 * - If still invalid, return new Date() to avoid crashes
 */
function parseFlexibleDate(value) {
  if (value instanceof Date) return value;
  if (value == null) return new Date();
  const nativeParsed = new Date(value);
  if (!isNaN(nativeParsed.getTime())) return nativeParsed;
  const utcFallback = new Date(`${value}Z`);
  if (!isNaN(utcFallback.getTime())) return utcFallback;
  return new Date();
}

/**
 * Format session duration in seconds to human readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "2h 30m 15s")
 */
function formatSessionDuration(seconds) {
  if (!seconds || seconds < 0) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

/**
 * Get the most recent login log for a user
 * @param {string|number} userId - User ID
 * @returns {Object|null} Login log entry or null
 */
async function getLastLoginLog(userId) {
  // Ensure type matches DB column (logs.userId is VARCHAR)
  const normalizedUserId = userId != null ? String(userId) : null;
  try {
    // First try to find a login log with loginTime
    let loginLog = await db.models.logs.findOne({
      where: {
        userId: normalizedUserId,
        action: 'Login',
        status: 'Successful',
        loginTime: { [db.Sequelize.Op.ne]: null }
      },
      order: [['loginTime', 'DESC']]
    });

    // If no login log with loginTime found, try to find any recent login log
    if (!loginLog) {
      console.log(`No login log with loginTime found for user ${userId}, trying to find any recent login...`);
      loginLog = await db.models.logs.findOne({
        where: {
          userId: normalizedUserId,
          action: 'Login',
          status: 'Successful'
        },
        order: [['date', 'DESC']]
      });

      // If we found a login log without loginTime, use the date as loginTime
      if (loginLog && !loginLog.loginTime) {
        console.log(`Using date as loginTime for user ${userId}: ${loginLog.date}`);
        loginLog.loginTime = parseFlexibleDate(loginLog.date);
      }
    }

    // Normalize loginTime to a Date instance if present
    if (loginLog && loginLog.loginTime) {
      loginLog.loginTime = parseFlexibleDate(loginLog.loginTime);
    }

    return loginLog;
  } catch (error) {
    console.error('Error getting last login log:', error);
    return null;
  }
}

/**
 * Create a logout log entry with session duration
 * @param {Object} params - Logout parameters
 * @param {string|number} params.userId - User ID
 * @param {string} params.userName - Username
 * @param {string} params.source - IP address or source
 * @param {Date} params.logoutTime - Logout time (optional, defaults to now)
 * @returns {Object|null} Created log entry or null
 */
async function createLogoutLog({ userId, userName, source, logoutTime = new Date() }) {
  // Ensure type matches DB column (logs.userId is VARCHAR)
  const normalizedUserId = userId != null ? String(userId) : null;
  try {
    console.log(`Updating logout on existing login session for user ${normalizedUserId}...`);
    const loginLog = await getLastLoginLog(normalizedUserId);
    
    if (!loginLog) {
      console.warn(`No login log found for user ${userId}`);
      return null;
    }

    console.log(`Found login log for user ${normalizedUserId}:`, {
      loginTime: loginLog.loginTime,
      date: loginLog.date,
      action: loginLog.action,
      status: loginLog.status
    });

    // Simple direct computation: logoutTime - loginTime
    // Use 'date' field as it appears to be the correct local time
    const originalLoginTime = loginLog.date;
    const loginDateObj = originalLoginTime ? new Date(originalLoginTime) : null;
    const logoutDateObj = logoutTime ? new Date(logoutTime) : null;
    const loginMs = loginDateObj ? loginDateObj.getTime() : NaN;
    const logoutMs = logoutDateObj ? logoutDateObj.getTime() : NaN;

    // Diagnostics: log values before math to trace timezone handling
    try {
      console.log('SessionDuration-Debug:', {
        serverNow: new Date().toString(),
        serverISO: new Date().toISOString(),
        serverTZ: (Intl && Intl.DateTimeFormat().resolvedOptions().timeZone) || 'unknown',
        envTZ: process.env.TZ || 'unset',
        originalLoginTime,
        originalLoginType: typeof originalLoginTime,
        parsedLogin: loginDateObj ? loginDateObj.toString() : null,
        parsedLoginISO: loginDateObj ? loginDateObj.toISOString() : null,
        loginMs,
        loginOffsetMin: loginDateObj ? loginDateObj.getTimezoneOffset() : null,
        providedLogoutTime: logoutTime,
        providedLogoutType: typeof logoutTime,
        parsedLogout: logoutDateObj ? logoutDateObj.toString() : null,
        parsedLogoutISO: logoutDateObj ? logoutDateObj.toISOString() : null,
        logoutMs,
        logoutOffsetMin: logoutDateObj ? logoutDateObj.getTimezoneOffset() : null,
        rawDurationSeconds: Math.floor((logoutMs - loginMs) / 1000)
      });
    } catch (e) {
      console.warn('SessionDuration-Debug logging failed:', e);
    }

    // Simple date subtraction to get seconds
    const sessionDuration = Math.floor((logoutDateObj - loginDateObj) / 1000);
    const sessionDurationFormatted = formatSessionDuration(sessionDuration);

    console.log(`Calculated session duration: ${sessionDuration} seconds (${sessionDurationFormatted})`);

    // Only update existing login session row; do not create a new record
    const fieldsToUpdate = {
      logoutTime: isNaN(logoutMs) ? new Date() : new Date(logoutMs),
      sessionDuration: sessionDuration,
      sessionDurationFormatted: sessionDurationFormatted
    };

    // Backfill optional fields if missing on the login record
    if (source && !loginLog.source) fieldsToUpdate.source = source;
    if (userName && !loginLog.userName) fieldsToUpdate.userName = userName;

    // Ensure we are updating the model instance (not a plain object)
    const loginLogInstance = typeof loginLog.update === 'function' ? loginLog : await db.models.logs.findByPk(loginLog.id);
    await loginLogInstance.update(fieldsToUpdate);

    console.log(`User ${userId} logged out. Session duration updated: ${sessionDurationFormatted}`);
    return loginLogInstance;
  } catch (error) {
    console.error('Error creating logout log:', error);
    console.error('Error stack:', error.stack);
    return null;
  }
}

/**
 * Get session statistics for a user
 * @param {string|number} userId - User ID
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of sessions to retrieve (default: 10)
 * @param {Date} options.fromDate - Start date for filtering
 * @param {Date} options.toDate - End date for filtering
 * @returns {Object} Session statistics
 */
async function getUserSessionStats(userId, options = {}) {
  const normalizedUserId = userId != null ? String(userId) : null;
  try {
    const { limit = 10, fromDate, toDate } = options;
    
    let whereClause = {
      userId: normalizedUserId,
      action: 'Logout',
      status: 'Successful',
      sessionDuration: { [db.Sequelize.Op.ne]: null }
    };

    if (fromDate || toDate) {
      whereClause.date = {};
      if (fromDate) whereClause.date[db.Sequelize.Op.gte] = fromDate;
      if (toDate) whereClause.date[db.Sequelize.Op.lte] = toDate;
    }

    const sessions = await db.models.logs.findAll({
      where: whereClause,
      order: [['logoutTime', 'DESC']],
      limit: limit,
      attributes: [
        'id',
        'loginTime',
        'logoutTime',
        'sessionDuration',
        'sessionDurationFormatted',
        'source',
        'date'
      ]
    });

    // Calculate statistics
    const durations = sessions.map(s => s.sessionDuration).filter(d => d > 0);
    const totalSessions = sessions.length;
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const averageDuration = totalSessions > 0 ? Math.floor(totalDuration / totalSessions) : 0;
    const longestSession = durations.length > 0 ? Math.max(...durations) : 0;
    const shortestSession = durations.length > 0 ? Math.min(...durations) : 0;

    return {
      totalSessions,
      totalDuration: formatSessionDuration(totalDuration),
      averageDuration: formatSessionDuration(averageDuration),
      longestSession: formatSessionDuration(longestSession),
      shortestSession: formatSessionDuration(shortestSession),
      sessions: sessions
    };
  } catch (error) {
    console.error('Error getting user session stats:', error);
    return {
      totalSessions: 0,
      totalDuration: '0s',
      averageDuration: '0s',
      longestSession: '0s',
      shortestSession: '0s',
      sessions: []
    };
  }
}

/**
 * Get active sessions (users who logged in but haven't logged out)
 * @param {Object} options - Query options
 * @param {number} options.hoursThreshold - Consider sessions inactive after this many hours (default: 24)
 * @returns {Array} Array of active session objects
 */
async function getActiveSessions(options = {}) {
  try {
    const { hoursThreshold = 24 } = options;
    const thresholdTime = new Date(Date.now() - (hoursThreshold * 60 * 60 * 1000));

    // Get all successful logins
    const logins = await db.models.logs.findAll({
      where: {
        action: 'Login',
        status: 'Successful',
        loginTime: { [db.Sequelize.Op.ne]: null }
      },
      order: [['loginTime', 'DESC']],
      attributes: ['userId', 'userName', 'loginTime', 'source']
    });

    // Get all successful logouts
    const logouts = await db.models.logs.findAll({
      where: {
        action: 'Logout',
        status: 'Successful',
        logoutTime: { [db.Sequelize.Op.ne]: null }
      },
      order: [['logoutTime', 'DESC']],
      attributes: ['userId', 'logoutTime']
    });

    // Find users who have logged in but not logged out (or logged out before their last login)
    const activeSessions = [];
    const logoutMap = new Map();
    
    // Create a map of user logout times
    logouts.forEach(logout => {
      if (!logoutMap.has(logout.userId) || logoutMap.get(logout.userId) < logout.logoutTime) {
        logoutMap.set(logout.userId, logout.logoutTime);
      }
    });

    logins.forEach(login => {
      const lastLogout = logoutMap.get(login.userId);
      
      // If no logout or last logout was before this login, and login is within threshold
      if ((!lastLogout || lastLogout < login.loginTime) && login.loginTime > thresholdTime) {
        const sessionDuration = Math.floor((new Date() - login.loginTime) / 1000);
        activeSessions.push({
          userId: login.userId,
          userName: login.userName,
          loginTime: login.loginTime,
          sessionDuration: sessionDuration,
          sessionDurationFormatted: formatSessionDuration(sessionDuration),
          source: login.source
        });
      }
    });

    return activeSessions;
  } catch (error) {
    console.error('Error getting active sessions:', error);
    return [];
  }
}

module.exports = {
  formatSessionDuration,
  getLastLoginLog,
  createLogoutLog,
  getUserSessionStats,
  getActiveSessions
};
