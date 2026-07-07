const cron = require('node-cron')
const { runSmsBalanceAlertJob } = require('../jobs/smsBalanceAlertJob')
const { getSmsBalanceAlertSettings } = require('../utils/smsBalanceAlertSettings')

let scheduledTask = null

async function startSmsBalanceScheduler() {
  return rescheduleSmsBalanceScheduler()
}

async function rescheduleSmsBalanceScheduler() {
  if (scheduledTask) {
    scheduledTask.stop()
    scheduledTask = null
  }

  const config = await getSmsBalanceAlertSettings()

  if (!config.enabled) {
    console.log('[SMS Balance Alert] Scheduler disabled in module settings')
    return null
  }

  const { cron: schedule, timezone } = config

  if (!cron.validate(schedule)) {
    console.error(`[SMS Balance Alert] Invalid cron expression: ${schedule}`)
    return null
  }

  scheduledTask = cron.schedule(
    schedule,
    () => {
      runSmsBalanceAlertJob().catch((error) => {
        console.error('[SMS Balance Alert] Scheduled job failed:', error.message || error)
      })
    },
    { timezone }
  )

  const hour = String(config.hour).padStart(2, '0')
  const minute = String(config.minute).padStart(2, '0')
  console.log(
    `[SMS Balance Alert] Scheduled daily check at ${hour}:${minute} (${timezone}) — cron "${schedule}"`
  )
  return scheduledTask
}

module.exports = { startSmsBalanceScheduler, rescheduleSmsBalanceScheduler, runSmsBalanceAlertJob }
