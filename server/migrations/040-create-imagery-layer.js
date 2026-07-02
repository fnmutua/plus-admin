'use strict';

/**
 * Backfill county_id/settlement_id by intersecting each layer's bbox with the
 * settlement/county geometries. Picks the best match (largest overlap area).
 * Skips layers already linked and near-global bboxes (default -180..180 fallbacks).
 */
async function backfillLocationLinkage(queryInterface) {
  // Link settlements (and their county) for layers with no settlement yet
  const [, settlementResult] = await queryInterface.sequelize.query(`
    UPDATE imagery_layer il
    SET settlement_id = m.settlement_id,
        county_id = COALESCE(m.county_id, il.county_id),
        "updatedAt" = CURRENT_TIMESTAMP
    FROM (
      SELECT DISTINCT ON (l.id)
        l.id AS layer_id,
        s.id AS settlement_id,
        s.county_id AS county_id
      FROM imagery_layer l
      JOIN settlement s
        ON s.geom IS NOT NULL
       AND ST_Intersects(
             s.geom,
             ST_MakeEnvelope(l.bbox_minx, l.bbox_miny, l.bbox_maxx, l.bbox_maxy, 4326)
           )
      WHERE l.settlement_id IS NULL
        AND l.deleted_at IS NULL
        AND l.bbox_minx IS NOT NULL
        AND (l.bbox_maxx - l.bbox_minx) < 10
        AND (l.bbox_maxy - l.bbox_miny) < 10
      ORDER BY
        l.id,
        ST_Area(ST_Intersection(
          ST_MakeValid(s.geom),
          ST_MakeEnvelope(l.bbox_minx, l.bbox_miny, l.bbox_maxx, l.bbox_maxy, 4326)
        )) DESC
    ) m
    WHERE il.id = m.layer_id;
  `);

  // Link counties for layers that still have none (bbox outside any settlement)
  const [, countyResult] = await queryInterface.sequelize.query(`
    UPDATE imagery_layer il
    SET county_id = m.county_id,
        "updatedAt" = CURRENT_TIMESTAMP
    FROM (
      SELECT DISTINCT ON (l.id)
        l.id AS layer_id,
        c.id AS county_id
      FROM imagery_layer l
      JOIN county c
        ON c.geom IS NOT NULL
       AND ST_Intersects(
             c.geom,
             ST_MakeEnvelope(l.bbox_minx, l.bbox_miny, l.bbox_maxx, l.bbox_maxy, 4326)
           )
      WHERE l.county_id IS NULL
        AND l.deleted_at IS NULL
        AND l.bbox_minx IS NOT NULL
        AND (l.bbox_maxx - l.bbox_minx) < 10
        AND (l.bbox_maxy - l.bbox_miny) < 10
      ORDER BY
        l.id,
        ST_Area(ST_Intersection(
          ST_MakeValid(c.geom),
          ST_MakeEnvelope(l.bbox_minx, l.bbox_miny, l.bbox_maxx, l.bbox_maxy, 4326)
        )) DESC
    ) m
    WHERE il.id = m.layer_id;
  `);

  console.log(
    `Imagery linkage backfill: ${settlementResult?.rowCount ?? 0} settlement link(s), ` +
      `${countyResult?.rowCount ?? 0} county-only link(s)`,
  );
}

/** Local catalog for GeoServer imagery — list/filter from DB; GeoServer only on upload/edit/delete. */
module.exports = {
  backfillLocationLinkage,

  up: async (queryInterface, Sequelize) => {
    const tableExists = await queryInterface.sequelize.query(
      `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'imagery_layer'
        );
      `,
      { type: Sequelize.QueryTypes.SELECT },
    );

    if (tableExists[0].exists) {
      // Table already there: just run the one-touch spatial linkage backfill
      await backfillLocationLinkage(queryInterface);
      return;
    }

    await queryInterface.createTable('imagery_layer', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      workspace: {
        type: Sequelize.STRING(64),
        allowNull: false,
        defaultValue: 'kisip',
      },
      layer_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      coverage_store_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      crs: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'EPSG:4326',
      },
      bbox_minx: { type: Sequelize.DOUBLE, allowNull: true },
      bbox_miny: { type: Sequelize.DOUBLE, allowNull: true },
      bbox_maxx: { type: Sequelize.DOUBLE, allowNull: true },
      bbox_maxy: { type: Sequelize.DOUBLE, allowNull: true },
      original_filename: { type: Sequelize.STRING(512), allowNull: true },
      file_path: { type: Sequelize.STRING(1024), allowNull: true },
      file_format: { type: Sequelize.STRING(16), allowNull: true },
      file_size_bytes: { type: Sequelize.BIGINT, allowNull: true },
      county_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'county', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      settlement_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'settlement', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'published',
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      geoserver_published_at: { type: Sequelize.DATE, allowNull: true },
      last_synced_at: { type: Sequelize.DATE, allowNull: true },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('imagery_layer', ['workspace', 'layer_name'], {
      unique: true,
      name: 'imagery_layer_workspace_layer_name_uq',
    });
    await queryInterface.addIndex('imagery_layer', ['county_id'], {
      name: 'imagery_layer_county_id_idx',
    });
    await queryInterface.addIndex('imagery_layer', ['settlement_id'], {
      name: 'imagery_layer_settlement_id_idx',
    });
    await queryInterface.addIndex('imagery_layer', ['status'], {
      name: 'imagery_layer_status_idx',
    });

    await backfillLocationLinkage(queryInterface);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('imagery_layer');
  },
};
