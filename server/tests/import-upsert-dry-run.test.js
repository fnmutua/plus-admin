'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const {
  parseDryRunFlag,
  preValidateRecords,
  executeImportUpsert
} = require('../app/services/importUpsert.service')

function buildMockModel({
  attributes,
  findOneImpl,
  createImpl,
  updateImpl
}) {
  return {
    rawAttributes: attributes,
    findOne: findOneImpl || (async () => null),
    create: createImpl || (async (item) => ({ id: 101, ...item })),
    update: updateImpl
  }
}

function buildMockDb(modelName, model, queryImpl) {
  let rollbackCalled = false
  let commitCalled = false

  const transaction = {
    rollback: async () => {
      rollbackCalled = true
    },
    commit: async () => {
      commitCalled = true
    }
  }

  const db = {
    models: { [modelName]: model },
    sequelize: {
      transaction: async () => transaction,
      query: queryImpl || (async () => [])
    },
    _transactionState: {
      get rollbackCalled() {
        return rollbackCalled
      },
      get commitCalled() {
        return commitCalled
      }
    }
  }

  return db
}

describe('importUpsert.service', () => {
  it('parseDryRunFlag accepts boolean and string values', () => {
    assert.equal(parseDryRunFlag(true), true)
    assert.equal(parseDryRunFlag('true'), true)
    assert.equal(parseDryRunFlag(1), true)
    assert.equal(parseDryRunFlag('1'), true)
    assert.equal(parseDryRunFlag(false), false)
    assert.equal(parseDryRunFlag(undefined), false)
  })

  it('preValidateRecords reports type mismatch failures', () => {
    const attributes = {
      code: { type: { key: 'STRING' } },
      county_id: { type: { key: 'INTEGER' } }
    }

    const { errors, validRecords } = preValidateRecords(
      [{ code: 'ABC', county_id: 'not-a-number' }],
      attributes
    )

    assert.equal(validRecords.length, 0)
    assert.equal(errors.length, 1)
    assert.equal(errors[0].field, 'county_id')
    assert.match(errors[0].detail, /Expected INTEGER/)
  })

  it('dryRun reports would-insert counts and rolls back without side effects', async () => {
    const modelName = 'sample_model'
    let createCalls = 0
    let aiCalls = 0

    const model = buildMockModel({
      attributes: {
        id: { primaryKey: true, type: { key: 'INTEGER' } },
        code: { type: { key: 'STRING' }, unique: true }
      },
      findOneImpl: async () => null,
      createImpl: async (item) => {
        createCalls += 1
        return { id: 501, ...item }
      }
    })

    const db = buildMockDb(modelName, model)

    const result = await executeImportUpsert({
      db,
      modelName,
      rawData: [{ code: 'DRY-001', name: 'Dry run row' }],
      dryRun: true,
      currentUser: 7,
      processRecordForAI: async () => {
        aiCalls += 1
        return { success: true }
      }
    })

    assert.equal(result.ok, true)
    assert.equal(result.body.dryRun, true)
    assert.equal(result.body.insertedCount, 1)
    assert.equal(result.body.updatedCount, 0)
    assert.equal(result.body.failedCount, 0)
    assert.equal(createCalls, 1)
    assert.equal(aiCalls, 0)
    assert.equal(db._transactionState.rollbackCalled, true)
    assert.equal(db._transactionState.commitCalled, false)
  })

  it('dryRun reports would-update counts for existing code matches', async () => {
    const modelName = 'sample_model'
    let updateCalls = 0
    const existing = {
      id: 42,
      code: 'EXIST-001',
      update: async () => {
        updateCalls += 1
      }
    }

    const model = buildMockModel({
      attributes: {
        id: { primaryKey: true, type: { key: 'INTEGER' } },
        code: { type: { key: 'STRING' }, unique: true },
        name: { type: { key: 'STRING' } }
      },
      findOneImpl: async ({ where }) => (where.code === 'EXIST-001' ? existing : null)
    })

    const db = buildMockDb(modelName, model)

    const result = await executeImportUpsert({
      db,
      modelName,
      rawData: [{ code: 'EXIST-001', name: 'Updated name' }],
      dryRun: true,
      currentUser: 7
    })

    assert.equal(result.body.dryRun, true)
    assert.equal(result.body.insertedCount, 0)
    assert.equal(result.body.updatedCount, 1)
    assert.equal(result.body.failedCount, 0)
    assert.equal(updateCalls, 1)
    assert.equal(db._transactionState.rollbackCalled, true)
  })

  it('dryRun returns validation failures without writing', async () => {
    const modelName = 'sample_model'
    let createCalls = 0

    const model = buildMockModel({
      attributes: {
        code: { type: { key: 'STRING', options: { length: 5 } } }
      },
      createImpl: async () => {
        createCalls += 1
        return { id: 1 }
      }
    })

    const db = buildMockDb(modelName, model)

    const result = await executeImportUpsert({
      db,
      modelName,
      rawData: [{ code: 'THIS_CODE_IS_TOO_LONG' }],
      dryRun: true
    })

    assert.equal(result.body.dryRun, true)
    assert.equal(result.body.insertedCount, 0)
    assert.equal(result.body.updatedCount, 0)
    assert.equal(result.body.failedCount, 1)
    assert.equal(result.body.errors[0].error, 'too_long')
    assert.equal(createCalls, 0)
    assert.equal(db._transactionState.rollbackCalled, true)
  })

  it('non-dryRun import keeps write behavior without rollback', async () => {
    const modelName = 'sample_model'
    let createCalls = 0

    const model = buildMockModel({
      attributes: {
        id: { primaryKey: true, type: { key: 'INTEGER' } },
        code: { type: { key: 'STRING' }, unique: true }
      },
      createImpl: async (item) => {
        createCalls += 1
        return { id: 900, ...item }
      }
    })

    const db = buildMockDb(modelName, model)

    const result = await executeImportUpsert({
      db,
      modelName,
      rawData: [{ code: 'REAL-001' }],
      dryRun: false,
      currentUser: 3
    })

    assert.equal(result.body.dryRun, undefined)
    assert.equal(result.body.insertedCount, 1)
    assert.equal(createCalls, 1)
    assert.equal(db._transactionState.rollbackCalled, false)
    assert.equal(db._transactionState.commitCalled, false)
  })
})
