/**
 * Capture documentation screenshots for Docs.vue.
 * Usage: node tools/capture-docs-screenshots.mjs
 * Requires: local dev server (port 4000), API backend, and credentials in .env
 */
import { chromium } from 'playwright'
import { config as loadEnv } from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'src/assets/documentation')

loadEnv({ path: path.join(ROOT, '.env') })

const BASE = process.env.DOCS_SCREENSHOT_BASE || 'http://localhost:4000'
const USER = process.env.DOCS_SCREENSHOT_USER || process.env.VITE_APP_COLLECTOR_EMAIL
const PASS = process.env.DOCS_SCREENSHOT_PASS || process.env.VITE_APP_COLLECTOR_PASSWORD

if (!USER || !PASS) {
  console.error('Missing credentials. Set DOCS_SCREENSHOT_USER/PASS or VITE_APP_COLLECTOR_* in .env')
  process.exit(1)
}

fs.mkdirSync(OUT_DIR, { recursive: true })

const shots = []

async function snap(page, name, opts = {}) {
  const file = path.join(OUT_DIR, name)
  await page.screenshot({ path: file, ...opts })
  shots.push(name)
  console.log('  saved', name)
}

async function login(page) {
  await page.goto(`${BASE}/#/login`, { waitUntil: 'networkidle', timeout: 120000 })
  await page.locator('input').first().fill(USER)
  await page.locator('input[type="password"]').first().fill(PASS)
  await page.getByRole('button').filter({ hasText: /sign in|login/i }).first().click()
  await page.waitForURL(/#\/(dashboard|data|home|status)/i, { timeout: 120000 }).catch(async () => {
    await page.waitForTimeout(5000)
  })
  await page.waitForTimeout(2000)
}

async function waitForLoaded(page) {
  await page.waitForTimeout(2500)
  const mask = page.locator('.el-loading-mask')
  if (await mask.count()) {
    await mask.first().waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {})
  }
}

async function firstHrefMatching(page, pattern) {
  const link = page.locator(`a[href*="${pattern}"], [role="link"]`).first()
  if (await link.count()) return null
  return null
}

async function captureSettlementList(page) {
  await page.setViewportSize({ width: 1100, height: 900 })
  await page.goto(`${BASE}/#/data/settlement/list`, { waitUntil: 'domcontentloaded' })
  await waitForLoaded(page)
  await snap(page, 'settlement-toolbar-compact.png', { fullPage: false })

  const filterBtn = page.locator('button').filter({ has: page.locator('.el-icon, svg') }).filter({ hasText: /./ })
    .locator('xpath=ancestor::button[contains(@class,"el-button")]')
  const locationFilter = page.getByRole('button').filter({ hasText: /^$/ }).first()
  const tooltipFilter = page.locator('.sett-toolbar-filter-badge button, .header-version-actions button, button .el-icon').first()

  // Open location filters dialog via filter icon in toolbar
  const filterIconBtn = page.locator('.sett-toolbar-filter-badge .el-button, .sett-toolbar-actions .el-button').first()
  if (await filterIconBtn.count()) {
    await filterIconBtn.click({ timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(800)
    const dialog = page.locator('.el-dialog').filter({ hasText: /Location filters/i })
    if (await dialog.count()) {
      await snap(page, 'settlement-location-filters-dialog.png')
      await page.keyboard.press('Escape')
    }
  }

  // Geo download scope dialog
  const geoBtn = page.locator('button').filter({ has: page.locator('[icon], .iconify') }).last()
  const geoIcon = page.locator('button').filter({ hasText: /./ }).filter({ has: page.locator('svg, .iconify') })
  for (const btn of await page.locator('.sett-toolbar-actions button, .sett-toolbar-actions .el-button').all()) {
    const html = await btn.innerHTML().catch(() => '')
    if (html.includes('layer-download') || html.includes('gis:layer')) {
      await btn.click().catch(() => {})
      await page.waitForTimeout(1000)
      const dlg = page.locator('.el-dialog').filter({ hasText: /Displayed|Filtered|GeoJSON|scope/i })
      if (await dlg.count()) {
        await snap(page, 'settlement-geo-download-scope.png')
        await page.keyboard.press('Escape')
      }
      break
    }
  }
}

async function captureClimateList(page) {
  await page.setViewportSize({ width: 1100, height: 900 })
  await page.goto(`${BASE}/#/data/settlement/climate-assessments`, { waitUntil: 'domcontentloaded' })
  await waitForLoaded(page)
  await snap(page, 'climate-list-compact-toolbar.png', { fullPage: false })

  const drawerBtn = page.locator('button').filter({ has: page.locator('.iconify, svg') }).first()
  const filterOpen = page.locator('.filter-action-badge button, button').filter({ has: page.locator('[data-icon="mdi:filter-variant"], .iconify') }).first()
  if (await filterOpen.count()) {
    await filterOpen.click().catch(() => {})
    await page.waitForTimeout(1000)
    const drawer = page.locator('.el-drawer').filter({ hasText: /County|Status|Vulnerability/i })
    if (await drawer.count()) {
      await snap(page, 'climate-list-filters-drawer.png')
      await page.keyboard.press('Escape')
    }
  }
}

async function captureClimateAssessment(page) {
  await page.goto(`${BASE}/#/data/settlement/climate-assessments`, { waitUntil: 'domcontentloaded' })
  await waitForLoaded(page)
  const previewBtn = page.getByRole('button', { name: /preview|view|edit|open/i }).first()
  const actionBtn = page.locator('table tbody tr').first().locator('button').first()
  if (await actionBtn.count()) {
    await actionBtn.click().catch(() => {})
    await page.waitForTimeout(3000)
    await waitForLoaded(page)
    if (page.url().includes('climate-assessment')) {
      await page.setViewportSize({ width: 1400, height: 900 })
      await snap(page, 'climate-assessment-header.png', { fullPage: false })
      const historyTab = page.getByRole('tab', { name: /Submission History/i })
      if (await historyTab.count()) {
        await historyTab.click()
        await page.waitForTimeout(1500)
        await snap(page, 'climate-submission-history.png', { fullPage: false })
      }
      return
    }
  }
  // Fallback: try first assessment URL from table link
  const link = page.locator('table tbody a, table tbody button').first()
  if (await link.count()) {
    await link.click().catch(() => {})
    await waitForLoaded(page)
    await snap(page, 'climate-assessment-header.png', { fullPage: false })
  }
}

async function captureSettlementDetails(page) {
  await page.goto(`${BASE}/#/data/settlement/list`, { waitUntil: 'domcontentloaded' })
  await waitForLoaded(page)
  const row = page.locator('.el-table__body tbody tr').first()
  if (!(await row.count())) return
  await row.dblclick().catch(async () => { await row.click() })
  await page.waitForTimeout(3000)
  if (!page.url().includes('/data/settlement/') || page.url().includes('/list')) return

  await page.setViewportSize({ width: 1400, height: 900 })
  await snap(page, 'settlement-details-header-tags.png', { fullPage: false })

  const docsTab = page.getByRole('tab', { name: /Documents/i })
  if (await docsTab.count()) {
    await docsTab.click()
    await waitForLoaded(page)
    const shareBtn = page.getByRole('button', { name: /Share upload link/i })
    if (await shareBtn.count()) {
      await shareBtn.click()
      await page.waitForTimeout(1200)
      const drawer = page.locator('.el-drawer').filter({ hasText: /upload link|Create link|expiry/i })
      if (await drawer.count()) {
        await snap(page, 'settlement-upload-share-drawer.png')
        await page.keyboard.press('Escape')
      }
    }
  }
}

async function captureProjectDetails(page) {
  await page.goto(`${BASE}/#/data/settlement/list`, { waitUntil: 'domcontentloaded' })
  // Try projects via API discovery - navigate to a known listing under programmes is complex.
  // Use settlement details projects tab link if available
  const row = page.locator('.el-table__body tbody tr').first()
  if (await row.count()) {
    await row.dblclick().catch(() => {})
    await page.waitForTimeout(2500)
  }
  const projTab = page.getByRole('tab', { name: /Projects/i })
  if (await projTab.count()) {
    await projTab.click()
    await waitForLoaded(page)
    const moreBtn = page.locator('table tbody button, table tbody .el-button').first()
    if (await moreBtn.count()) {
      await moreBtn.click()
      await page.waitForTimeout(3000)
    }
  }
  if (!page.url().includes('/prj/')) {
    // brute: try low project ids
    for (const id of [1, 2, 3, 5, 10, 20, 50, 100]) {
      await page.goto(`${BASE}/#/prj/${id}`, { waitUntil: 'domcontentloaded' })
      await waitForLoaded(page)
      const empty = page.locator('.el-empty, :text("not found")')
      if (!(await empty.count())) break
    }
  }
  if (!page.url().includes('/prj/')) return

  await page.setViewportSize({ width: 1400, height: 900 })
  await snap(page, 'project-details-header.png', { fullPage: false })

  for (const [tabName, file] of [
    ['Disbursements', 'project-disbursements-tab.png'],
    ['Timeline', 'project-timeline-tab.png'],
    ['Documentation', 'project-documentation-tab.png'],
  ]) {
    const tab = page.getByRole('tab', { name: new RegExp(tabName, 'i') })
    if (await tab.count()) {
      await tab.click()
      await waitForLoaded(page)
      await snap(page, file, { fullPage: false })
    }
  }
}

async function captureClimateSettings(page) {
  await page.goto(`${BASE}/#/settings/platform/climate-settings`, { waitUntil: 'domcontentloaded' })
  await waitForLoaded(page)
  const toolB = page.getByRole('tab', { name: /^Tool B$/i })
  if (await toolB.count()) {
    await toolB.click()
    await page.waitForTimeout(2000)
    await snap(page, 'climate-settings-toolb.png', { fullPage: false })
  }
}

async function captureDataRequestClarifications(page) {
  await page.goto(`${BASE}/#/admin/data-requests`, { waitUntil: 'domcontentloaded' })
  await waitForLoaded(page)
  const row = page.locator('.el-table__body tbody tr').first()
  if (!(await row.count())) return
  await row.click()
  await page.waitForTimeout(2500)
  const clarTab = page.getByRole('tab', { name: /Clarifications/i })
  if (await clarTab.count()) {
    await clarTab.click()
    await page.waitForTimeout(1500)
    await snap(page, 'data-request-clarifications-tab.png', { fullPage: false })
  }
}

async function main() {
  console.log('Launching browser...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } })
  const page = await context.newPage()

  try {
    console.log('Logging in...')
    await login(page)

    console.log('Settlement list...')
    await captureSettlementList(page).catch((e) => console.warn('  settlement list:', e.message))

    console.log('Climate list...')
    await captureClimateList(page).catch((e) => console.warn('  climate list:', e.message))

    console.log('Climate assessment...')
    await captureClimateAssessment(page).catch((e) => console.warn('  climate assessment:', e.message))

    console.log('Settlement details...')
    await captureSettlementDetails(page).catch((e) => console.warn('  settlement details:', e.message))

    console.log('Project details...')
    await captureProjectDetails(page).catch((e) => console.warn('  project details:', e.message))

    console.log('Climate settings...')
    await captureClimateSettings(page).catch((e) => console.warn('  climate settings:', e.message))

    console.log('Data request clarifications...')
    await captureDataRequestClarifications(page).catch((e) => console.warn('  data requests:', e.message))

    console.log(`\nDone. ${shots.length} screenshots in ${OUT_DIR}`)
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
