#!/usr/bin/env node
'use strict'

/**
 * Backfill 2019 baseline + county-rate projections for settlements that already
 * have profile population (building estimates) but no year series.
 *
 * Usage (from repo root, with production .env or local .env):
 *   node server/scripts/backfill-settlement-population-series.js --dry-run
 *   node server/scripts/backfill-settlement-population-series.js --scope=pending
 *   node server/scripts/backfill-settlement-population-series.js --scope=missing_baseline
 *   node server/scripts/backfill-settlement-population-series.js --scope=all --county-id=47
 */
require('dotenv').config()

const db = require('../app/models')
const populationProjection = require('../app/services/populationProjection')

function readArg(name, fallback = null) {
  const prefix = `--${name}=`
  const hit = process.argv.find((arg) => arg.startsWith(prefix))
  if (!hit) return fallback
  return hit.slice(prefix.length)
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const scope = readArg('scope', 'pending')
  const countyRaw = readArg('county-id')
  const countyId = countyRaw != null && countyRaw !== '' ? Number(countyRaw) : null
  const throughRaw = readArg('through')
  const projectThroughYear =
    throughRaw != null && throughRaw !== ''
      ? Number(throughRaw)
      : Math.max(new Date().getFullYear(), 2040)

  await db.sequelize.authenticate()
  console.log(
    dryRun
      ? `DRY RUN — scope=${scope}`
      : `Backfilling observed population series — scope=${scope}`
  )

  const t = await db.sequelize.transaction()
  try {
    const result = await populationProjection.backfillObservedPopulationSeries(db, {
      scope,
      county_id: Number.isFinite(countyId) ? countyId : null,
      project_through_year: projectThroughYear,
      dry_run: dryRun,
      source: 'building_estimate',
      method: 'production_backfill',
      transaction: t,
    })

    if (dryRun) {
      await t.rollback()
    } else {
      await t.commit()
    }

    console.log(`Candidates: ${result.total_candidates}`)
    console.log(`Projected:  ${result.projected}`)
    console.log(`Partial:    ${result.partial}`)
    console.log(`Errors:     ${result.errors}`)
    console.log(`Through:    ${result.project_through_year}`)

    const preview = result.preview || []
    if (preview.length) {
      console.log('\nPreview:')
      for (const row of preview.slice(0, 30)) {
        console.log(
          `  #${row.settlement_id} ${row.name || ''} — ${row.status || 'candidate'}` +
            (row.reason ? ` (${row.reason})` : '') +
            (row.population != null ? ` pop=${row.population}` : '')
        )
      }
    }
  } catch (err) {
    try {
      await t.rollback()
    } catch (_) {
      /* ignore */
    }
    throw err
  } finally {
    await db.sequelize.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
