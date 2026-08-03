const db = require('../models')
const userSessionManager = require('./userSessionManager')
const sessionTracker = require('./sessionTracker')
const { notifyChatForceLogout } = require('./forceLogoutNotify')
const { shouldSkipTrackingForUser } = require('./trackingSkip')

/** Invalidate all sessions for a user (admin force logout, role change, etc.). */
async function forceLogoutUser(userId, options = {}) {
  const { source = 'Admin force logout', userName } = options
  const forceLogoutAt = new Date()

  await db.user.update(
    { force_logout_at: forceLogoutAt },
    { where: { id: userId } }
  )

  await userSessionManager.revokeAllSessionsForUser(userId)

  if (shouldSkipTrackingForUser(userId)) {
    await notifyChatForceLogout(userId)
    return
  }

  let username = userName
  if (!username) {
    const user = await db.user.findByPk(userId, { attributes: ['username'] })
    username = user?.username || `user_${userId}`
  }

  await sessionTracker.createLogoutLog({
    userId,
    userName: username,
    source
  })

  await db.userStatus.update(
    { is_online: false, status: 'offline', last_seen: forceLogoutAt },
    { where: { user_id: userId } }
  )

  await notifyChatForceLogout(userId)
}

module.exports = { forceLogoutUser }
