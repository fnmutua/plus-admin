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

    const sessionWhereClause = scopedUserIds
      ? 'AND uas.user_id IN (:scopedUserIds)'
      : ''

    const activeRows = await db.sequelize.query(
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
        replacements: scopedUserIds ? { scopedUserIds } : {},
        type: db.sequelize.QueryTypes.SELECT
      }
    )

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
      actorIds = await getScopedUserIdList(scope)
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

exports.getScope = async (req, res) => {
  try {
    const scope = await requireScope(req, res)
    if (!scope) return
    res.status(200).send({ code: '0000', data: scope })
  } catch (error) {
    res.status(500).send({ code: '9999', message: 'Unable to resolve scope', error: error.message })
  }
}
