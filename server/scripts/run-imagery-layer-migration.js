require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })

const migration = require('../migrations/040-create-imagery-layer')

const db = require('../app/models')

// Fetch bboxes from GeoServer for rows missing them, so the spatial linkage can match them
async function hydrateMissingBboxes() {
  const imageryLayerService = require('../app/services/imageryLayer.service')
  const ImageryLayer = db.models.imagery_layer

  const rows = await ImageryLayer.findAll({
    where: { bbox_minx: null, deleted_at: null },
  })
  if (!rows.length) return 0

  let hydrated = 0
  for (const row of rows) {
    const metadata = await imageryLayerService.fetchLayerMetadataFromGeoServer(
      row.layer_name,
      row.workspace,
    )
    const bbox = metadata?.bbox
    if (!bbox || bbox.westBoundLongitude == null) {
      console.warn(`No bbox available on GeoServer for ${row.layer_name}`)
      continue
    }
    await row.update({
      bbox_minx: bbox.westBoundLongitude,
      bbox_miny: bbox.southBoundLatitude,
      bbox_maxx: bbox.eastBoundLongitude,
      bbox_maxy: bbox.northBoundLatitude,
      crs: metadata.crs || row.crs,
      last_synced_at: new Date(),
    })
    hydrated += 1
  }
  console.log(`Hydrated bbox for ${hydrated}/${rows.length} layer(s) from GeoServer`)
  return hydrated
}

;(async () => {
  try {
    await migration.up(db.sequelize.getQueryInterface(), db.Sequelize)

    // Layers synced without bounds can't be intersected; fetch bounds then re-link
    const hydrated = await hydrateMissingBboxes()
    if (hydrated > 0) {
      await migration.backfillLocationLinkage(db.sequelize.getQueryInterface())
    }

    console.log('Migration 040-create-imagery-layer completed')
    process.exit(0)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
})()
