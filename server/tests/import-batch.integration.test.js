'use strict'

// Import batches against a real PostGIS database: savepoints, row locks and
// geometry round trips cannot be checked with mocks.
//
// Opt-in. Point IMPORT_BATCH_TEST_DB at an empty, disposable database that
// already has PostGIS (it must exist before Sequelize connects):
//   createdb import_batch_test && psql -d import_batch_test -c 'create extension postgis'
//   IMPORT_BATCH_TEST_DB=import_batch_test npm run test:import-batch
// The test creates its own tables and expects none of them to exist.

const { describe, it, after } = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('crypto')
const { Sequelize, DataTypes } = require('sequelize')
require('dotenv').config()

const DB = process.env.IMPORT_BATCH_TEST_DB

const square = (x, y) => ({
  type: 'Polygon',
  crs: { type: 'name', properties: { name: 'EPSG:4326' } },
  coordinates: [[[x, y], [x + 0.001, y], [x + 0.001, y + 0.001], [x, y + 0.001], [x, y]]]
})

async function run(sequelize) {
  const { executeImportUpsert } = require('../app/services/importUpsert.service')
  const svc = require('../app/services/importBatch.service')
  const migration = require('../migrations/102-create-import-batch.js')

  await sequelize.query(`
    CREATE TABLE permissions (id serial primary key, name text, description text, "createdAt" timestamptz, "updatedAt" timestamptz);
    CREATE TABLE roles (id serial primary key, name text);
    CREATE TABLE role_permissions (roleid int, permissionid int);
    INSERT INTO roles (name) VALUES ('admin');
    CREATE TABLE parcel (
      id serial primary key, area_ha double precision not null, settlement_id int not null,
      parcel_no text not null, code text not null unique, landuse_id int, "isApproved" text,
      "createdBy" int, geom geometry(Geometry, 4326), "createdAt" timestamptz, "updatedAt" timestamptz);
    CREATE TABLE beneficiary_parcel (id serial primary key, parcel_id int, settlement_id int,
      "createdAt" timestamptz, "updatedAt" timestamptz);
  `)
  await migration.up(sequelize.getQueryInterface(), Sequelize)
  const [[grant]] = await sequelize.query(`SELECT count(*)::int n FROM role_permissions rp JOIN permissions p ON p.id = rp.permissionid WHERE p.name = 'import:revert'`)
  assert.equal(grant.n, 1, 'migration grants import:revert to admin')

  const parcel = sequelize.define('parcel', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    area_ha: DataTypes.DOUBLE, settlement_id: DataTypes.INTEGER, parcel_no: DataTypes.STRING,
    code: { type: DataTypes.STRING, unique: true }, landuse_id: DataTypes.INTEGER,
    isApproved: DataTypes.STRING, createdBy: DataTypes.INTEGER, geom: DataTypes.GEOMETRY('Geometry', 4326)
  }, { tableName: 'parcel', timestamps: true })
  const beneficiary_parcel = sequelize.define('beneficiary_parcel', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    parcel_id: DataTypes.INTEGER, settlement_id: DataTypes.INTEGER
  }, { tableName: 'beneficiary_parcel', timestamps: true })
  beneficiary_parcel.belongsTo(parcel, { foreignKey: 'parcel_id' })

  const db = {
    sequelize,
    models: { parcel, beneficiary_parcel },
    importBatch: require('../app/models/import_batch.js')(sequelize, DataTypes),
    importBatchItem: require('../app/models/import_batch_item.js')(sequelize, DataTypes)
  }

  const row = (n, extra = {}) => ({ code: `P${n}`, parcel_no: `NO-${n}`, area_ha: n, settlement_id: 7, geom: square(36 + n / 100, -1), ...extra })
  const upsert = (data, extra = {}) =>
    executeImportUpsert({ db, modelName: 'parcel', rawData: data, currentUser: 5, currentUserName: 'surveyor', importSource: 'qgis-connector', importLabel: 'kicheko_parcels', ...extra })

  // 1. One import sent as two requests shares a batch.
  const A = crypto.randomUUID()
  let res = await upsert([row(1), row(2)], { importBatchId: A })
  assert.equal(res.body.insertedCount, 2)
  assert.equal(res.body.importBatchId, A)
  res = await upsert([row(3), row(4)], { importBatchId: A })
  assert.equal(res.body.insertedCount, 2)
  let batchA = await db.importBatch.findByPk(A)
  assert.equal(batchA.insertedCount, 4)
  assert.equal(await db.importBatchItem.count({ where: { batch_id: A } }), 4)

  // Fresh import: nothing conflicts (geometry and dates compare equal after a round trip).
  let detail = await svc.getBatchDetail(db, A)
  assert.equal(detail.summary.revertable, 4, JSON.stringify(detail.items.filter((i) => i.state !== 'revertable')))

  // 2. A later import changes P1; an untracked request gets its own batch.
  await new Promise((r) => setTimeout(r, 20))
  res = await upsert([row(1, { area_ha: 99 })])
  const B = res.body.importBatchId
  assert.ok(B && B !== A)
  const itemB = await db.importBatchItem.findOne({ where: { batch_id: B } })
  assert.equal(itemB.action, 'update')
  assert.equal(itemB.before.area_ha, 1)
  assert.equal(itemB.after.area_ha, 99)
  assert.ok(!('geom' in itemB.before), 'unchanged geometry is not stored for updates')

  // A re-import that changes nothing records nothing.
  res = await upsert([row(4)])
  assert.equal(res.body.updatedCount, 1)
  assert.equal(await db.importBatchItem.count({ where: { batch_id: res.body.importBatchId } }), 0)

  // 3. Someone edits P2 by hand; 4. a beneficiary is linked to P3.
  await parcel.update({ area_ha: 2.5 }, { where: { code: 'P2' } })
  const p3 = await parcel.findOne({ where: { code: 'P3' } })
  await beneficiary_parcel.create({ parcel_id: p3.id, settlement_id: 7 })

  // 5. Preview A.
  res = await svc.revertBatch(db, A, { dryRun: true })
  const byLabel = Object.fromEntries(res.body.items.map((i) => [i.label, i]))
  assert.equal(byLabel.P1.state, 'conflict'); assert.match(byLabel.P1.reason, /later import/)
  assert.equal(byLabel.P2.state, 'conflict'); assert.match(byLabel.P2.reason, /area_ha/)
  assert.equal(byLabel.P3.state, 'conflict'); assert.match(byLabel.P3.reason, /beneficiary_parcel/)
  assert.equal(byLabel.P4.state, 'revertable')
  assert.equal(await parcel.count(), 4, 'dry run changes nothing')

  // 6. Undo B first: P1 gets its old area back.
  res = await svc.revertBatch(db, B, { actorId: 1, actorName: 'admin' })
  assert.equal(res.body.restored, 1)
  assert.equal((await parcel.findOne({ where: { code: 'P1' } })).area_ha, 1)
  assert.equal((await db.importBatch.findByPk(B)).status, 'reverted')

  // 7. Undo A: P1 and P4 go, P2 and P3 stay, batch is partially reverted.
  const deletedHook = []
  res = await svc.revertBatch(db, A, { actorId: 1, actorName: 'admin', hooks: { afterDelete: (m, id) => deletedHook.push(`${m}:${id}`) } })
  assert.equal(res.body.deleted, 2)
  assert.equal(deletedHook.length, 2)
  assert.deepEqual((await parcel.findAll({ order: [['code', 'ASC']] })).map((p) => p.code), ['P2', 'P3'])
  batchA = await db.importBatch.findByPk(A)
  assert.equal(batchA.status, 'partially_reverted')
  assert.equal(batchA.revertedByName, 'admin')

  // Fix the conflicts and undo the rest.
  await beneficiary_parcel.destroy({ where: { parcel_id: p3.id } })
  await parcel.update({ area_ha: 2 }, { where: { code: 'P2' } })
  res = await svc.revertBatch(db, A, {})
  assert.equal(res.body.deleted, 2)
  assert.equal(await parcel.count(), 0)
  assert.equal((await db.importBatch.findByPk(A)).status, 'reverted')

  // 8. Appending to an undone batch, or to someone else's, is refused.
  res = await upsert([row(5)], { importBatchId: A })
  assert.equal(res.status, 409)
  const C = crypto.randomUUID()
  await upsert([row(6)], { importBatchId: C })
  res = await upsert([row(7)], { importBatchId: C, currentUser: 6 })
  assert.equal(res.status, 409)
  res = await upsert([row(8)], { importBatchId: 'not-a-uuid' })
  assert.equal(res.status, 400)
  assert.equal(await parcel.count({ where: { code: ['P5', 'P7', 'P8'] } }), 0)

  // 9. forceInsert on an existing code: the unique violation rolls back to a
  // savepoint and the row is updated in the same transaction, with its item.
  res = await upsert([row(6, { area_ha: 60 })], { forceInsert: true })
  assert.equal(res.body.updatedCount, 1, JSON.stringify(res.body.errors))
  assert.equal((await parcel.findOne({ where: { code: 'P6' } })).area_ha, 60)
  assert.equal(await db.importBatchItem.count({ where: { batch_id: res.body.importBatchId } }), 1)

  // 10. A row that fails mid-batch leaves no ledger entry and does not stop the rest.
  res = await upsert([row(9), { code: 'P10', parcel_no: null, area_ha: 1, settlement_id: 7 }, row(11)])
  assert.equal(res.body.insertedCount, 2)
  assert.equal(res.body.failedCount, 1)
  assert.equal(await db.importBatchItem.count({ where: { batch_id: res.body.importBatchId } }), 2)

  // Undoing an import that moved a geometry puts the old shape back.
  const originalGeom = (await parcel.findOne({ where: { code: 'P9' } })).geom
  res = await upsert([row(9, { geom: square(37, 0) })])
  const D = res.body.importBatchId
  assert.notDeepEqual((await parcel.findOne({ where: { code: 'P9' } })).geom.coordinates, originalGeom.coordinates)
  res = await svc.revertBatch(db, D, {})
  assert.equal(res.body.restored, 1, JSON.stringify(res.body.items))
  assert.deepEqual((await parcel.findOne({ where: { code: 'P9' } })).geom.coordinates, originalGeom.coordinates)

  // Dry runs never open a batch.
  const before = await db.importBatch.count()
  await upsert([row(12)], { dryRun: true })
  assert.equal(await db.importBatch.count(), before)

  // Map features come back without the crs member.
  const fc = await svc.getBatchFeatures(db, C)
  assert.equal(fc.features.length, 1)
  assert.equal(fc.features[0].geometry.type, 'Polygon')
  assert.ok(!('crs' in fc.features[0].geometry))

}

describe('import batches (PostGIS)', { skip: DB ? false : 'set IMPORT_BATCH_TEST_DB to run' }, () => {
  const sequelize = DB
    ? new Sequelize(DB, process.env.VUE_APP_USER, process.env.VUE_APP_PASSWORD, {
        host: process.env.VUE_APP_DB_HOST || 'localhost',
        port: process.env.VUE_APP_DB_PORT,
        dialect: 'postgres',
        logging: false
      })
    : null

  after(() => sequelize && sequelize.close())

  it('records imports and undoes them without losing later work', () => run(sequelize))
})
