/**
 * Refresh Redis dashboard bundles after config changes (cards, charts, sections, dashboards).
 * Only the affected dashboard is rebuilt; other dashboards keep their existing TTL.
 */

const db = require('../models')
const {
  deleteCachedBundle,
  dashboardBundleKey,
  NATIONAL_BUNDLE_KEY,
} = require('./dashboardBundleRedis')
const {
  refreshDashboardBundle,
  refreshNationalDashboardBundle,
} = require('../services/nationalDashboardBundle')

const DASHBOARD_CONFIG_MODELS = new Set([
  'dashboard',
  'dashboard_card',
  'dashboard_section',
  'dashboard_section_chart',
])

function plainRecord(record) {
  if (!record) return record
  if (typeof record.get === 'function') return record.get({ plain: true })
  if (typeof record.toJSON === 'function') return record.toJSON()
  return { ...record }
}

async function resolveDashboardId(modelName, recordOrBody) {
  const row = plainRecord(recordOrBody)
  if (!row) return null

  if (modelName === 'dashboard') {
    return row.id != null ? Number(row.id) : null
  }

  if (modelName === 'dashboard_card' || modelName === 'dashboard_section') {
    return row.dashboard_id != null ? Number(row.dashboard_id) : null
  }

  if (modelName === 'dashboard_section_chart') {
    const sectionId = row.dashboard_section_id
    if (!sectionId) return null
    const section = await db.models.dashboard_section.findByPk(sectionId, {
      attributes: ['dashboard_id'],
      raw: true,
    })
    return section?.dashboard_id != null ? Number(section.dashboard_id) : null
  }

  return null
}

function scheduleDashboardBundleRefresh(modelName, recordOrBody) {
  if (!DASHBOARD_CONFIG_MODELS.has(modelName)) return

  void (async () => {
    try {
      const dashboardId = await resolveDashboardId(modelName, recordOrBody)
      if (!dashboardId) return
      console.log(`[dashboard-bundle] refreshing dashboard ${dashboardId} after ${modelName} change`)
      await refreshDashboardBundle(dashboardId)
    } catch (err) {
      console.error(`[dashboard-bundle] refresh after ${modelName} change failed:`, err.message)
    }
  })()
}

function scheduleDashboardBundleDelete(record) {
  void (async () => {
    try {
      const row = plainRecord(record)
      const dashboardId = row?.id != null ? Number(row.id) : null
      if (!dashboardId) return

      const wasMain = !!row.main_dashboard
      console.log(`[dashboard-bundle] invalidating cache for deleted dashboard ${dashboardId}`)
      await deleteCachedBundle(dashboardBundleKey(dashboardId))

      if (wasMain) {
        await deleteCachedBundle(NATIONAL_BUNDLE_KEY)
        try {
          await refreshNationalDashboardBundle()
        } catch (err) {
          console.error('[dashboard-bundle] national refresh after main dashboard delete failed:', err.message)
        }
      }
    } catch (err) {
      console.error('[dashboard-bundle] invalidate after dashboard delete failed:', err.message)
    }
  })()
}

module.exports = {
  DASHBOARD_CONFIG_MODELS,
  resolveDashboardId,
  scheduleDashboardBundleRefresh,
  scheduleDashboardBundleDelete,
}
