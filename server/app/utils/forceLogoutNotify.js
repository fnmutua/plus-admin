const axios = require('axios')
const authConfig = require('../config/auth.config')

/**
 * Ask the chat websocket server to disconnect a user immediately.
 */
async function notifyChatForceLogout(userId) {
  const chatHost = process.env.CHAT_HOST || '127.0.0.1'
  const chatPort = process.env.CHAT_PORT || 3001
  const url = `http://${chatHost}:${chatPort}/internal/force-logout/${userId}`

  try {
    await axios.post(
      url,
      {},
      {
        headers: {
          'x-internal-secret': process.env.INTERNAL_API_SECRET || authConfig.secret
        },
        timeout: 3000
      }
    )
  } catch (error) {
    console.warn(`Chat force-logout notify failed for user ${userId}:`, error.message)
  }
}

module.exports = { notifyChatForceLogout }
