'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

const wf = require('../app/utils/grievanceWorkflow')

const role = (name, link = {}) => ({ name, user_roles: link })
const national = wf.getUserScope([role('grm', { location_level: 'national' })])
const superAdmin = wf.getUserScope([role('super_admin')])
const county7 = wf.getUserScope([role('grm', { location_level: 'county', county_id: '7' })])
const settlement42 = wf.getUserScope([role('grm', { location_level: 'settlement', settlement_id: '42' })])
const noGrm = wf.getUserScope([role('viewer', { location_level: 'national' })])

const grievance = (overrides = {}) => ({
  id: 1, status: 'Sorting', current_level: 'settlement', county_id: 7, settlement_id: 42, isgbv: false, ...overrides,
})

describe('grievanceWorkflow.getUserScope', () => {
  it('derives national, county and settlement scope from role links', () => {
    assert.equal(national.isNational, true)
    assert.equal(superAdmin.isSuperAdmin, true)
    assert.deepEqual([...county7.countyIds], ['7'])
    assert.deepEqual([...settlement42.settlementIds], ['42'])
    assert.equal(noGrm.hasGrmAccess, false)
  })
})

describe('grievanceWorkflow.canActOnGrievance', () => {
  it('national and super admin act on any grievance', () => {
    assert.equal(wf.canActOnGrievance(national, grievance({ current_level: 'national' })), true)
    assert.equal(wf.canActOnGrievance(superAdmin, grievance({ county_id: 99 })), true)
  })

  it('county users act only in their county at county/settlement level', () => {
    assert.equal(wf.canActOnGrievance(county7, grievance()), true)
    assert.equal(wf.canActOnGrievance(county7, grievance({ current_level: 'county' })), true)
    assert.equal(wf.canActOnGrievance(county7, grievance({ current_level: 'national' })), false)
    assert.equal(wf.canActOnGrievance(county7, grievance({ county_id: 8 })), false)
  })

  it('settlement users act only on settlement-level grievances in their settlement', () => {
    assert.equal(wf.canActOnGrievance(settlement42, grievance()), true)
    assert.equal(wf.canActOnGrievance(settlement42, grievance({ current_level: 'county' })), false)
    assert.equal(wf.canActOnGrievance(settlement42, grievance({ settlement_id: 43 })), false)
  })

  it('users without a GRM role cannot act', () => {
    assert.equal(wf.canActOnGrievance(noGrm, grievance()), false)
  })
})

describe('grievanceWorkflow.computeTargetLevel', () => {
  it('escalates and returns exactly one level', () => {
    assert.equal(wf.computeTargetLevel('Escalated', 'settlement'), 'county')
    assert.equal(wf.computeTargetLevel('Escalated', 'county'), 'national')
    assert.equal(wf.computeTargetLevel('Escalated', 'national'), null)
    assert.equal(wf.computeTargetLevel('Returned', 'national'), 'county')
    assert.equal(wf.computeTargetLevel('Returned', 'county'), 'settlement')
    assert.equal(wf.computeTargetLevel('Returned', 'settlement'), null)
    assert.equal(wf.computeTargetLevel('Resolved', 'county'), 'county')
  })

  it('uses GBV level mapping for GBV statuses', () => {
    assert.equal(wf.computeTargetLevel('refer_to_county', 'settlement', { isgbv: true }), 'county')
    assert.equal(wf.computeTargetLevel('refer_to_action_support', 'county', { isgbv: true }), 'settlement')
  })
})

describe('grievanceWorkflow.getAllowedTransitions', () => {
  it('blocks escalation/referral at national and return at settlement', () => {
    const atNational = wf.getAllowedTransitions(grievance({ status: 'Escalated', current_level: 'national' }), national)
    assert.ok(!atNational.includes('Escalated'))
    assert.ok(!atNational.includes('Referred'))
    assert.ok(atNational.includes('Returned'))

    const atSettlement = wf.getAllowedTransitions(grievance(), settlement42)
    assert.ok(!atSettlement.includes('Returned'))
    assert.ok(atSettlement.includes('Escalated'))
  })

  it('terminal statuses allow nothing', () => {
    for (const status of ['Closed', 'In Court', 'Deleted']) {
      assert.deepEqual(wf.getAllowedTransitions(grievance({ status }), national), [])
    }
  })

  it('Rejected and ExternalReferral are no longer dead ends', () => {
    assert.ok(wf.getAllowedTransitions(grievance({ status: 'Rejected' }), settlement42).includes('Closed'))
    assert.ok(wf.getAllowedTransitions(grievance({ status: 'ExternalReferral' }), settlement42).includes('Resolved'))
  })

  it('only national staff act on a settlement/county resolution', () => {
    const resolved = grievance({ status: 'Resolved' })
    assert.deepEqual(wf.getAllowedTransitions(resolved, settlement42), [])
    assert.ok(wf.getAllowedTransitions(resolved, national).includes('Closed'))
  })

  it('cannot return a county grievance that has no settlement', () => {
    const g = grievance({ status: 'Escalated', current_level: 'county', settlement_id: null })
    assert.ok(!wf.getAllowedTransitions(g, county7).includes('Returned'))
  })
})

describe('grievanceWorkflow.planStatusChange', () => {
  it('rejects users outside the grievance scope', () => {
    const plan = wf.planStatusChange({ grievance: grievance({ county_id: 8 }), requestedStatus: 'Resolved', scope: county7 })
    assert.equal(plan.ok, false)
    assert.equal(plan.httpStatus, 403)
  })

  it('rejects transitions not in the table', () => {
    const plan = wf.planStatusChange({ grievance: grievance({ status: 'Closed' }), requestedStatus: 'Resolved', scope: national })
    assert.equal(plan.ok, false)
    assert.equal(plan.code, 'INVALID_TRANSITION')
  })

  it('settlement resolution stays Resolved; national resolution auto-closes', () => {
    const local = wf.planStatusChange({ grievance: grievance(), requestedStatus: 'Resolved', scope: settlement42 })
    assert.deepEqual([local.ok, local.finalStatus, local.autoClosed], [true, 'Resolved', false])

    const nat = wf.planStatusChange({ grievance: grievance(), requestedStatus: 'Resolved', scope: national })
    assert.deepEqual([nat.ok, nat.finalStatus, nat.autoClosed], [true, 'Closed', true])
  })

  it('county user escalating a settlement grievance moves it to county, not national', () => {
    const plan = wf.planStatusChange({ grievance: grievance(), requestedStatus: 'Escalated', scope: county7 })
    assert.equal(plan.ok, true)
    assert.equal(plan.targetLevel, 'county')
  })
})

describe('grievanceWorkflow stage dates', () => {
  it('every workflow status gets a non-zero duration', () => {
    for (const status of ['Sorting', 'Investigation', 'Under Review', 'Escalated', 'Referred', 'Returned',
      'ExternalReferral', 'Resolved', 'Rejected', 'In Court', 'Closed', 'SomethingLegacy']) {
      assert.ok(wf.getStageDurationMs(status) > 0, status)
    }
  })

  it('computeStatusDates sets expiry after the status date', () => {
    const now = new Date('2026-01-01T00:00:00Z')
    const { current_status_date, status_expiry_date } = wf.computeStatusDates('Escalated', now)
    assert.equal(current_status_date, now)
    assert.equal(status_expiry_date.getTime() - now.getTime(), 14 * 24 * 60 * 60 * 1000)
  })
})

describe('grievanceWorkflow.planStatusOverride', () => {
  it('only national staff can override', () => {
    const plan = wf.planStatusOverride({ grievance: grievance({ status: 'In Court' }), requestedStatus: 'Referred', scope: county7 })
    assert.equal(plan.ok, false)
    assert.equal(plan.httpStatus, 403)
  })

  it('lets national staff move a terminal grievance to any status', () => {
    for (const requestedStatus of ['Referred', 'Resolved', 'Sorting', 'Escalated']) {
      const plan = wf.planStatusOverride({ grievance: grievance({ status: 'In Court', current_level: 'county' }), requestedStatus, scope: national })
      assert.equal(plan.ok, true, requestedStatus)
      assert.equal(plan.finalStatus, requestedStatus)
      assert.equal(plan.autoClosed, false)
    }
  })

  it('uses the chosen level, or keeps the current one when a move is impossible', () => {
    const chosen = wf.planStatusOverride({ grievance: grievance({ status: 'Closed' }), requestedStatus: 'Referred', targetLevel: 'national', scope: superAdmin })
    assert.equal(chosen.targetLevel, 'national')

    const escalatedAtNational = wf.planStatusOverride({ grievance: grievance({ status: 'Closed', current_level: 'national' }), requestedStatus: 'Escalated', scope: national })
    assert.equal(escalatedAtNational.ok, true)
    assert.equal(escalatedAtNational.targetLevel, 'national')
  })

  it('rejects deleted grievances, unknown statuses, no-op changes and settlement level without a settlement', () => {
    assert.equal(wf.planStatusOverride({ grievance: grievance({ status: 'Deleted' }), requestedStatus: 'Sorting', scope: national }).ok, false)
    assert.equal(wf.planStatusOverride({ grievance: grievance(), requestedStatus: 'Bogus', scope: national }).ok, false)
    assert.equal(wf.planStatusOverride({ grievance: grievance(), requestedStatus: 'Sorting', scope: national }).code, 'NO_CHANGE')
    assert.equal(wf.planStatusOverride({ grievance: grievance({ settlement_id: null, current_level: 'county' }), requestedStatus: 'Sorting', targetLevel: 'settlement', scope: national }).ok, false)
  })
})
