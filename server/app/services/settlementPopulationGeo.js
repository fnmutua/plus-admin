'use strict'

/**
 * Keep denormalized county / subcounty / ward on settlement_population
 * aligned with the parent settlement row.
 */

async function fetchSettlementGeo(db, settlementId, options = {}) {
  const id = Number(settlementId)
  if (!Number.isFinite(id)) return null

  const row = await db.models.settlement.findByPk(id, {
    attributes: ['id', 'county_id', 'subcounty_id', 'ward_id'],
    raw: true,
    transaction: options.transaction ?? null,
  })

  if (!row) return null

  return {
    county_id: row.county_id ?? null,
    subcounty_id: row.subcounty_id ?? null,
    ward_id: row.ward_id ?? null,
  }
}

async function applySettlementPopulationGeo(db, record, options = {}) {
  if (!record || record.settlement_id == null) return record

  const geo = await fetchSettlementGeo(db, record.settlement_id, options)
  if (!geo) return record

  return {
    ...record,
    county_id: geo.county_id,
    subcounty_id: geo.subcounty_id,
    ward_id: geo.ward_id,
  }
}

async function enrichSettlementPopulationRecords(db, records, options = {}) {
  if (!Array.isArray(records) || records.length === 0) return records

  const settlementIds = [
    ...new Set(
      records
        .map((r) => Number(r.settlement_id))
        .filter((id) => Number.isFinite(id))
    ),
  ]

  if (!settlementIds.length) return records

  const settlements = await db.models.settlement.findAll({
    attributes: ['id', 'county_id', 'subcounty_id', 'ward_id'],
    where: { id: settlementIds },
    raw: true,
    transaction: options.transaction ?? null,
  })

  const geoBySettlementId = new Map(
    settlements.map((s) => [
      Number(s.id),
      {
        county_id: s.county_id ?? null,
        subcounty_id: s.subcounty_id ?? null,
        ward_id: s.ward_id ?? null,
      },
    ])
  )

  return records.map((record) => {
    const geo = geoBySettlementId.get(Number(record.settlement_id))
    if (!geo) return record
    return {
      ...record,
      county_id: geo.county_id,
      subcounty_id: geo.subcounty_id,
      ward_id: geo.ward_id,
    }
  })
}

async function syncSettlementPopulationGeoFromSettlement(db, settlementId, geo = null, options = {}) {
  const id = Number(settlementId)
  if (!Number.isFinite(id)) return { updated: 0 }

  let county_id
  let subcounty_id
  let ward_id

  if (geo) {
    county_id = geo.county_id ?? null
    subcounty_id = geo.subcounty_id ?? null
    ward_id = geo.ward_id ?? null
  } else {
    const fetched = await fetchSettlementGeo(db, id, options)
    if (!fetched) return { updated: 0 }
    county_id = fetched.county_id
    subcounty_id = fetched.subcounty_id
    ward_id = fetched.ward_id
  }

  const [updated] = await db.models.settlement_population.update(
    { county_id, subcounty_id, ward_id },
    {
      where: { settlement_id: id },
      transaction: options.transaction ?? null,
    }
  )

  return { updated: updated ?? 0 }
}

function settlementGeoChanged(existingRecord, updateObj) {
  const geoFields = ['county_id', 'subcounty_id', 'ward_id']
  return geoFields.some((field) => {
    if (updateObj[field] === undefined) return false
    const before = existingRecord[field] ?? null
    const after = updateObj[field] ?? null
    return before !== after
  })
}

module.exports = {
  fetchSettlementGeo,
  applySettlementPopulationGeo,
  enrichSettlementPopulationRecords,
  syncSettlementPopulationGeoFromSettlement,
  settlementGeoChanged,
}
