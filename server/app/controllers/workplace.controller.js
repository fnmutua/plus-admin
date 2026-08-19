const db = require('../models')
const { Op } = db.Sequelize
const sessionTracker = require('../utils/sessionTracker')
const {
  resolveWorkplaceScope,
  getScopedUserIdList,
  scopedUserWhere,
  startOfDay,
  endOfDay,
  daysAgo,
  newAccountsPeriodStart
} = require('../utils/workplaceScope')
const { queryMergedAuditLogs, normalizeLoginAttemptRow } = require('../utils/auditLogQuery')
const { shouldSkipTrackingForUser, getSkippedTrackingUserIdList } = require('../utils/trackingSkip')

const Users = db.models.users

async function requireScope(req, res) {
  const scope = await resolveWorkplaceScope(req.userid)
  if (!scope.canAccess) {
    res.status(403).send({ code: '9999', message: 'Admin workplace access requires an admin role.' })
    return null
  }
  return scope
}

exports.getAdminStats = async (req, res) => {
  try {
    const scope = await requireScope(req, res)
    if (!scope) return

    const userIds = await getScopedUserIdList(scope)
    const baseWhere = scopedUserWhere(scope, userIds)

    const period = ['week', 'month', 'year'].includes(req.query?.period)
      ? req.query.period
      : 'week'
    const periodStart = newAccountsPeriodStart(period)

    const [totalUsers, unapprovedUsers, countyUsers, newAccountsCount] = await Promise.all([
      Users.count({ where: baseWhere, distinct: true }),
      Users.count({ where: { ...baseWhere, isactive: false }, distinct: true }),
      scope.isNational
        ? Users.count({
            include: [
              {
                model: db.models.user_roles,
                required: true,
                where: { location_level: 'county' }
              }
            ],
            distinct: true
          })
        : Users.count({ where: baseWhere, distinct: true }),
      Users.count({
        where: { ...baseWhere, createdAt: { [Op.gte]: periodStart } },
        distinct: true
      })
    ])

    res.status(200).send({
      code: '0000',
      message: 'Workplace stats retrieved successfully',
      data: {
        totalUsers,
        unapprovedUsers,
        countyUsers,
        newAccountsCount,
        newAccountsPeriod: period,
        usersThisWeek: newAccountsCount,
        scopeLabel: scope.scopeLabel,
        isNational: scope.isNational,
        countyId: scope.countyId,
        countyName: scope.countyName
      }
    })
  } catch (error) {
    console.error('Workplace stats error:', error)
    res.status(500).send({ code: '9999', message: 'Unable to retrieve workplace stats', error: error.message })
  }
}

exports.getActiveSessions = async (req, res) => {
  try {
    const scope = await requireScope(req, res)
    if (!scope) return

    // Users with at least one active auth session (logged in), not only chat websocket presence
    let scopedUserIds = null
    if (!scope.isNational) {
      scopedUserIds = await getScopedUserIdList(scope)
      if (!scopedUserIds || scopedUserIds.length === 0) {
        return res.status(200).send({
          code: '0000',
          message: 'Active sessions retrieved successfully',
          data: { count: 0, sessions: [] }
        })
      }
      scopedUserIds = scopedUserIds.map((id) => parseInt(id, 10)).filter((n) => !isNaN(n))
    }

    const skippedUserIds = getSkippedTrackingUserIdList()
      .map((id) => parseInt(id, 10))
      .filter((n) => !isNaN(n))

    const sessionWhereParts = []
    const sessionReplacements = {}
    if (scopedUserIds) {
      sessionWhereParts.push('AND uas.user_id IN (:scopedUserIds)')
      sessionReplacements.scopedUserIds = scopedUserIds
    }
    if (skippedUserIds.length) {
      sessionWhereParts.push('AND uas.user_id NOT IN (:skippedUserIds)')
      sessionReplacements.skippedUserIds = skippedUserIds
    }
    const sessionWhereClause = sessionWhereParts.join('\n          ')

    const activeRows = (await db.sequelize.query(
      `
        SELECT
          uas.user_id,
          COUNT(*) AS session_count,
          MAX(uas.last_seen_at) AS last_seen_at,
          MIN(uas.created_at) AS earliest_session_at
        FROM user_auth_sessions uas
        WHERE uas.revoked_at IS NULL
          AND uas.expires_at >= NOW()
          ${sessionWhereClause}
        GROUP BY uas.user_id
      `,
      {
        replacements: sessionReplacements,
        type: db.sequelize.QueryTypes.SELECT
      }
    )).filter((row) => !shouldSkipTrackingForUser(row.user_id))

    if (!activeRows.length) {
      return res.status(200).send({
        code: '0000',
        message: 'Active sessions retrieved successfully',
        data: { count: 0, sessions: [] }
      })
    }

    const sessionCountMap = new Map()
    const lastSeenMap = new Map()
    const earliestSessionMap = new Map()
    const userIds = activeRows.map((row) => {
      const uid = Number(row.user_id)
      sessionCountMap.set(uid, parseInt(row.session_count, 10) || 0)
      lastSeenMap.set(uid, row.last_seen_at)
      earliestSessionMap.set(uid, row.earliest_session_at)
      return uid
    })

    const onlineUsers = await db.user.findAll({
      where: { id: { [Op.in]: userIds } },
      include: [{
        model: db.userStatus,
        as: 'status',
        required: false
      }],
      attributes: ['id', 'name', 'email', 'username', 'last_login', 'county_id']
    })

    const countyIds = [...new Set(onlineUsers.map((u) => u.county_id).filter(Boolean))]
    const countyMap = new Map()
    if (countyIds.length) {
      const counties = await db.models.county.findAll({
        where: { id: { [Op.in]: countyIds } },
        attributes: ['id', 'name']
      })
      counties.forEach((c) => countyMap.set(c.id, c.name))
    }

    const sessions = await Promise.all(
      onlineUsers.map(async (user) => {
        const loginLog = await sessionTracker.getLastLoginLog(user.id)
        const earliestSession = earliestSessionMap.get(Number(user.id))
        const loginTime =
          loginLog?.loginTime ||
          earliestSession ||
          user.last_login ||
          user.status?.last_seen
        const loginDate = loginTime ? new Date(loginTime) : new Date()
        const sessionDuration = Math.max(
          0,
          Math.floor((Date.now() - loginDate.getTime()) / 1000)
        )
        const isChatOnline = Boolean(user.status?.is_online)

        return {
          userId: user.id,
          userName: user.username,
          name: user.name,
          email: user.email,
          username: user.username,
          county: user.county_id ? countyMap.get(user.county_id) || null : null,
          loginTime: loginDate.toISOString(),
          sessionDuration,
          sessionDurationFormatted: sessionTracker.formatSessionDuration(sessionDuration),
          source: loginLog?.source || '—',
          status: isChatOnline ? (user.status?.status || 'online') : 'active',
          lastSeen: lastSeenMap.get(Number(user.id)) || user.status?.last_seen,
          activeSessionCount: sessionCountMap.get(Number(user.id)) || 0
        }
      })
    )

    sessions.sort(
      (a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime()
    )

    res.status(200).send({
      code: '0000',
      message: 'Active sessions retrieved successfully',
      data: { count: sessions.length, sessions }
    })
  } catch (error) {
    console.error('Active sessions error:', error)
    res.status(500).send({ code: '9999', message: 'Unable to retrieve active sessions', error: error.message })
  }
}

exports.getLoginAttempts = async (req, res) => {
  try {
    const scope = await requireScope(req, res)
    if (!scope) return

    const {
      page = 1,
      limit = 50,
      days = 1,
      from = '',
      to = ''
    } = req.body || {}

    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50))
    const offset = (pageNum - 1) * limitNum

    let fromDate
    let toDate = endOfDay()

    if (from) {
      fromDate = startOfDay(new Date(from))
      toDate = to ? endOfDay(new Date(to)) : endOfDay(new Date(from))
    } else {
      const dayCount = Math.max(1, parseInt(days, 10) || 1)
      fromDate = daysAgo(dayCount - 1)
    }

    let actorIds = null
    if (!scope.isNational) {
      actorIds = (await getScopedUserIdList(scope))
        ?.filter((id) => !shouldSkipTrackingForUser(id)) || null
      if (!actorIds || actorIds.length === 0) {
        return res.status(200).send({
          code: '0000',
          message: 'Login attempts retrieved successfully',
          data: [],
          total: 0,
          page: pageNum,
          limit: limitNum
        })
      }
    }

    const result = await queryMergedAuditLogs({
      page: pageNum,
      limit: limitNum,
      action: 'login',
      from: fromDate,
      to: toDate,
      actorIds
    })

    res.status(200).send({
      code: '0000',
      message: 'Login attempts retrieved successfully',
      data: result.data.map(normalizeLoginAttemptRow),
      total: result.total,
      page: pageNum,
      limit: limitNum,
      from: fromDate,
      to: toDate
    })
  } catch (error) {
    console.error('Login attempts error:', error)
    res.status(500).send({ code: '9999', message: 'Unable to retrieve login attempts', error: error.message })
  }
}

exports.getMutations = async (req, res) => {
  try {
    const scope = await requireScope(req, res)
    if (!scope) return

    const {
      page = 1,
      limit = 50,
      days = 7,
      from = '',
      to = ''
    } = req.body || {}

    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50))
    const offset = (pageNum - 1) * limitNum

    let fromDate
    let toDate = endOfDay()

    if (from) {
      fromDate = startOfDay(new Date(from))
      toDate = to ? endOfDay(new Date(to)) : endOfDay()
    } else {
      const dayCount = Math.max(1, parseInt(days, 10) || 7)
      fromDate = daysAgo(dayCount - 1)
    }

    const where = {
      action: { [Op.in]: ['update', 'delete'] },
      timestamp: { [Op.between]: [fromDate, toDate] }
    }

    if (!scope.isNational) {
      const userIds = await getScopedUserIdList(scope)
      if (!userIds || userIds.length === 0) {
        return res.status(200).send({
          code: '0000',
          message: 'Mutations retrieved successfully',
          data: [],
          total: 0,
          page: pageNum,
          limit: limitNum
        })
      }
      where.actorId = { [Op.in]: userIds.map(String) }
    }

    const result = await db.auditLog.findAndCountAll({
      where,
      order: [['timestamp', 'DESC']],
      limit: limitNum,
      offset
    })

    res.status(200).send({
      code: '0000',
      message: 'Mutations retrieved successfully',
      data: result.rows.map((r) => r.toJSON()),
      total: result.count,
      page: pageNum,
      limit: limitNum,
      from: fromDate,
      to: toDate
    })
  } catch (error) {
    console.error('Mutations error:', error)
    res.status(500).send({ code: '9999', message: 'Unable to retrieve mutations', error: error.message })
  }
}

exports.getTraffic = async (req, res) => {
  try {
    const scope = await requireScope(req, res)
    if (!scope) return

    const days = [1, 7, 30, 90].includes(Number(req.query?.days)) ? Number(req.query.days) : 30
    const fromDate = daysAgo(days - 1)
    const toDate = endOfDay()
    let actorIds = null
    if (!scope.isNational) {
      actorIds = (await getScopedUserIdList(scope))
        ?.filter((id) => !shouldSkipTrackingForUser(id)) || []
    }

    const result = await queryMergedAuditLogs({
      page: 1,
      limit: 10000,
      maxLimit: 10000,
      action: 'login',
      from: fromDate,
      to: toDate,
      actorIds
    })

    const rows = actorIds && actorIds.length === 0 ? [] : result.data
    const loginActorIds = [...new Set(rows.map((row) => row.actorId).filter(Boolean).map(Number).filter(Number.isFinite))]
    const loginActorNames = [...new Set(rows.map((row) => row.actorName).filter(Boolean))]
    const loginUsers = loginActorIds.length || loginActorNames.length
      ? await Users.findAll({
          where: {
            [Op.or]: [
              ...(loginActorIds.length ? [{ id: { [Op.in]: loginActorIds } }] : []),
              ...(loginActorNames.length ? [{ username: { [Op.in]: loginActorNames } }] : [])
            ]
          },
          attributes: ['id', 'username', 'county_id']
        })
      : []
    const countyIds = [...new Set(loginUsers.map((user) => user.county_id).filter(Boolean))]
    const countyRows = countyIds.length
      ? await db.models.county.findAll({
          where: { id: { [Op.in]: countyIds } },
          attributes: ['id', 'name']
        })
      : []
    const countyNameById = new Map(countyRows.map((county) => [String(county.id), county.name]))
    const countyByActor = new Map()
    loginUsers.forEach((user) => {
      const county = countyNameById.get(String(user.county_id)) || 'Not assigned'
      countyByActor.set(String(user.id), county)
      countyByActor.set(String(user.username).toLowerCase(), county)
    })
    const daily = new Map()
    const localDateKey = (value) => {
      const date = new Date(value)
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${date.getFullYear()}-${month}-${day}`
    }
    const localHourKey = (value) => {
      const date = new Date(value)
      return `${localDateKey(date)}T${String(date.getHours()).padStart(2, '0')}:00`
    }
    if (days === 1) {
      for (let hour = 0; hour < 24; hour += 1) {
        const date = new Date(fromDate)
        date.setHours(hour, 0, 0, 0)
        daily.set(localHourKey(date), { successful: 0, failed: 0 })
      }
    } else {
      for (let i = 0; i < days; i += 1) {
        const date = new Date(fromDate)
        date.setDate(date.getDate() + i)
        daily.set(localDateKey(date), { successful: 0, failed: 0 })
      }
    }

    const counties = new Map()
    const uniqueUsers = new Set()
    let successfulLogins = 0
    let failedLogins = 0
    rows.forEach((row) => {
      const key = days === 1 ? localHourKey(row.timestamp) : localDateKey(row.timestamp)
      const bucket = daily.get(key)
      const failed = String(row.outcome || row.metadata?.legacyStatus || '').toLowerCase().includes('fail')
      if (failed) failedLogins += 1
      else successfulLogins += 1
      if (bucket) bucket[failed ? 'failed' : 'successful'] += 1
      if (row.actorId) uniqueUsers.add(String(row.actorId))
      const county = countyByActor.get(String(row.actorId))
        || countyByActor.get(String(row.actorName || '').toLowerCase())
        || 'Not assigned'
      counties.set(county, (counties.get(county) || 0) + 1)
    })

    const sessionScopeSql = actorIds ? 'AND user_id IN (:actorIds)' : ''
    const [activeSessionRows, activeUsersRows] = actorIds && actorIds.length === 0
      ? [[{ count: 0 }], [{ count: 0 }]]
      : await Promise.all([
          db.sequelize.query(
            `SELECT COUNT(*) AS count FROM user_auth_sessions
             WHERE revoked_at IS NULL AND expires_at >= NOW() ${sessionScopeSql}`,
            { replacements: { actorIds: actorIds || [] }, type: db.sequelize.QueryTypes.SELECT }
          ),
          db.sequelize.query(
            `SELECT COUNT(DISTINCT user_id) AS count FROM user_auth_sessions
             WHERE revoked_at IS NULL AND expires_at >= NOW()
             ${sessionScopeSql}`,
            { replacements: { actorIds: actorIds || [] }, type: db.sequelize.QueryTypes.SELECT }
          )
        ])

    res.status(200).send({
      code: '0000',
      message: 'Traffic analytics retrieved successfully',
      data: {
        days,
        activeSessions: Number(activeSessionRows[0]?.count) || 0,
        activeUsers: Number(activeUsersRows[0]?.count) || 0,
        loginAttempts: successfulLogins + failedLogins,
        successfulLogins,
        failedLogins,
        uniqueUsers: uniqueUsers.size,
        timeline: [...daily.entries()].map(([date, counts]) => ({ date, ...counts })),
        counties: [...counties.entries()]
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8)
      }
    })
  } catch (error) {
    console.error('Workplace traffic error:', error)
    res.status(500).send({ code: '9999', message: 'Unable to retrieve traffic analytics', error: error.message })
  }
}

exports.getScope = async (req, res) => {
  try {
    const scope = await requireScope(req, res)
    if (!scope) return
    res.status(200).send({ code: '0000', data: scope })
  } catch (error) {
    res.status(500).send({ code: '9999', message: 'Unable to resolve scope', error: error.message })
  }
}
