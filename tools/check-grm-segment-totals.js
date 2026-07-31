#!/usr/bin/env node
/**
 * Validates GRM UI segment totals against DB status counts.
 * Mirrors partition logic in src/views/Grievances/Open.vue.
 */

require('dotenv').config()
const { Op } = require('sequelize')
const db = require('../server/app/models/index.js')

const NON_DELETED_GRIEVANCE_STATUSES = [
  'Sorting',
  'Under Review',
  'Investigation',
  'Returned',
  'Escalated',
  'In Court',
  'Resolved',
  'Referred',
  'ExternalReferral',
  'Closed',
  'Rejected',
]

const GRIEVANCE_SEGMENT_STATUSES = {
  ReceivedAll: 'excludeDeleted',
  Sorting: ['Sorting'],
  'Under Review': ['Under Review', 'Investigation', 'Returned'],
  Pending: ['Escalated', 'In Court'],
  Resolved: ['Resolved'],
  Referred: ['Referred', 'ExternalReferral'],
  Closed: ['Closed'],
  Rejected: ['Rejected', 'Deleted'],
}

const SEGMENT_ORDER = [
  'ReceivedAll',
  'Sorting',
  'Under Review',
  'Pending',
  'Resolved',
  'Referred',
  'Closed',
  'Rejected',
]

function sumStatuses(leafCountMap, statuses) {
  return statuses.reduce((sum, status) => sum + (leafCountMap[status] || 0), 0)
}

function buildSegmentCounts(leafCountMap, includeDeleted = true) {
  const segments = {}

  for (const segment of SEGMENT_ORDER) {
    const mapping = GRIEVANCE_SEGMENT_STATUSES[segment]

    if (mapping === 'excludeDeleted') {
      segments[segment] = sumStatuses(leafCountMap, NON_DELETED_GRIEVANCE_STATUSES)
      continue
    }

    if (segment === 'Rejected') {
      const rejectedCount = leafCountMap.Rejected || 0
      const deletedCount = includeDeleted ? (leafCountMap.Deleted || 0) : 0
      segments[segment] = {
        total: rejectedCount + deletedCount,
        rejectedCount,
        deletedCount,
      }
      continue
    }

    if (Array.isArray(mapping)) {
      segments[segment] = sumStatuses(leafCountMap, mapping)
    }
  }

  return segments
}

function validatePartition(leafCountMap) {
  const issues = []
  const knownStatuses = new Set([...NON_DELETED_GRIEVANCE_STATUSES, 'Deleted'])
  const allDbStatuses = Object.keys(leafCountMap)

  for (const status of allDbStatuses) {
    if (!knownStatuses.has(status)) {
      issues.push(`Unknown DB status "${status}" (${leafCountMap[status]} records) — not mapped to any segment`)
    }
  }

  const mappedStatuses = new Set()
  for (const [segment, mapping] of Object.entries(GRIEVANCE_SEGMENT_STATUSES)) {
    if (segment === 'ReceivedAll' || mapping === 'excludeDeleted') continue
    for (const status of mapping) {
      if (mappedStatuses.has(status)) {
        issues.push(`Status "${status}" appears in multiple segments`)
      }
      mappedStatuses.add(status)
    }
  }

  for (const status of NON_DELETED_GRIEVANCE_STATUSES) {
    if (!mappedStatuses.has(status)) {
      issues.push(`Non-deleted status "${status}" is not assigned to any workflow segment`)
    }
  }

  if (!mappedStatuses.has('Deleted')) {
    issues.push('Deleted status is not assigned to Rejected segment mapping')
  }

  return issues
}

function validateTallies(leafCountMap, segments) {
  const issues = []
  const receivedAll = segments.ReceivedAll

  const workflowRollup =
    segments.Sorting +
    segments['Under Review'] +
    segments.Pending +
    segments.Resolved +
    segments.Referred +
    segments.Closed +
    segments.Rejected.rejectedCount

  if (workflowRollup !== receivedAll) {
    issues.push(
      `Workflow segments sum (${workflowRollup}) != Received (All) (${receivedAll})`
    )
  }

  const nonDeletedDbTotal = sumStatuses(leafCountMap, NON_DELETED_GRIEVANCE_STATUSES)
  if (nonDeletedDbTotal !== receivedAll) {
    issues.push(
      `DB non-deleted total (${nonDeletedDbTotal}) != Received (All) (${receivedAll})`
    )
  }

  const rejectedSegment = segments.Rejected
  if (rejectedSegment.total !== rejectedSegment.rejectedCount + rejectedSegment.deletedCount) {
    issues.push('Rejected segment total != rejectedCount + deletedCount')
  }

  for (const [segment, mapping] of Object.entries(GRIEVANCE_SEGMENT_STATUSES)) {
    if (!Array.isArray(mapping)) continue
    const expected = sumStatuses(leafCountMap, mapping)
    const actual =
      segment === 'Rejected' ? segments.Rejected.total : segments[segment]
    if (expected !== actual) {
      issues.push(`Segment "${segment}" count (${actual}) != leaf sum (${expected})`)
    }
  }

  const grandTotal =
    receivedAll + (leafCountMap.Deleted || 0)
  const allRecords = Object.values(leafCountMap).reduce((a, b) => a + b, 0)
  if (grandTotal !== allRecords) {
    issues.push(
      `ReceivedAll + Deleted (${grandTotal}) != all known status records (${allRecords}) — likely unmapped statuses`
    )
  }

  return issues
}

async function main() {
  const { sequelize } = db
  const Grievance = db.models.grievance

  try {
    await sequelize.authenticate()

    const rows = await Grievance.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    })

    const leafCountMap = {}
    for (const row of rows) {
      leafCountMap[row.status] = parseInt(row.count, 10)
    }

    const segments = buildSegmentCounts(leafCountMap, true)
    const partitionIssues = validatePartition(leafCountMap)
    const tallyIssues = validateTallies(leafCountMap, segments)

    console.log('\n=== GRM Segment Totals Check ===\n')
    console.log('Leaf status counts:')
    const sortedStatuses = Object.keys(leafCountMap).sort()
    for (const status of sortedStatuses) {
      console.log(`  ${status.padEnd(20)} ${leafCountMap[status]}`)
    }
    console.log(`  ${'—'.repeat(24)}`)
    console.log(`  ${'TOTAL'.padEnd(20)} ${sortedStatuses.reduce((s, k) => s + leafCountMap[k], 0)}`)

    console.log('\nUI segment rollup:')
    for (const segment of SEGMENT_ORDER) {
      if (segment === 'Rejected') {
        const r = segments.Rejected
        console.log(
          `  ${segment.padEnd(16)} ${String(r.total).padStart(6)}  (rejected: ${r.rejectedCount}, deleted: ${r.deletedCount})`
        )
      } else {
        console.log(`  ${segment.padEnd(16)} ${String(segments[segment]).padStart(6)}`)
      }
    }

    console.log('\nValidation:')
    const allIssues = [...partitionIssues, ...tallyIssues]
    if (allIssues.length === 0) {
      console.log('  ✓ All segment totals tally correctly')
      console.log(
        `  ✓ Received (All) = ${segments.ReceivedAll} (excludes ${leafCountMap.Deleted || 0} deleted)`
      )
      console.log(
        `  ✓ Workflow segments sum to Received (All); Rejected includes deleted separately`
      )
    } else {
      console.log('  ✗ Issues found:')
      allIssues.forEach((issue, i) => console.log(`    ${i + 1}. ${issue}`))
      process.exitCode = 1
    }

    // Awaiting confirmation subset check
    const awaitingCount = await Grievance.count({
      where: {
        status: 'Resolved',
        confirmed_by_national_grm: false,
        current_level: { [Op.in]: ['settlement', 'county'] },
      },
    })
    console.log('\nResolved sub-counts:')
    console.log(`  Awaiting confirmation (subset): ${awaitingCount}`)
    console.log(`  Resolved segment total:         ${segments.Resolved}`)
    if (awaitingCount > segments.Resolved) {
      console.log('  ✗ Awaiting confirmation exceeds Resolved total')
      process.exitCode = 1
    } else {
      console.log('  ✓ Awaiting confirmation is within Resolved')
    }
  } catch (error) {
    console.error('Failed to run segment totals check:', error.message)
    process.exitCode = 1
  } finally {
    await sequelize.close()
  }
}

main()
