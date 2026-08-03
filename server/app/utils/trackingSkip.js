/**
 * User IDs excluded from audit, session, and webchat tracking.
 * Set in .env as a single id or comma-separated list, e.g.:
 *   AUDIT_SKIP_USER_ID=42
 *   AUDIT_SKIP_USER_ID=42,100,101
 */
function parseSkippedTrackingUserIds() {
  const raw = process.env.AUDIT_SKIP_USER_ID || process.env.AUDIT_SKIP_USER_IDS || ''
  if (!String(raw).trim()) return new Set()
  return new Set(
    String(raw)
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
  )
}

function shouldSkipTrackingForUser(userId) {
  if (userId == null || userId === '') return false
  return parseSkippedTrackingUserIds().has(String(userId))
}

function getSkippedTrackingUserIdList() {
  return [...parseSkippedTrackingUserIds()]
}

module.exports = {
  shouldSkipTrackingForUser,
  parseSkippedTrackingUserIds,
  getSkippedTrackingUserIdList
}
