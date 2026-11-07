'use strict';

/**
 * Align parcel land-use class names with Physical and Land Use Planning
 * Handbook 2025 §3.4.3 Table 4 / Table 6. Keep legacy labels as aliases
 * so QGIS imports and older text values still match.
 */

const HANDBOOK_CLASSES = [
  {
    id: 0,
    use: 'Residential',
    aliases: 'residential,residence',
  },
  {
    id: 1,
    use: 'Industrial',
    aliases: 'industrial,industry',
  },
  {
    id: 2,
    use: 'Educational',
    aliases: 'educational,education',
  },
  {
    id: 3,
    use: 'Recreational',
    aliases: 'recreational,recreation',
  },
  {
    id: 4,
    use: 'Public Purpose',
    aliases: 'public purpose',
  },
  {
    id: 5,
    use: 'Commercial',
    aliases: 'commercial,business cum residential',
  },
  {
    id: 6,
    use: 'Public Utilities',
    aliases: 'public utilities,public utility',
  },
  {
    id: 7,
    use: 'Transportation',
    aliases: 'transportation,transport,roads,bus park',
  },
  {
    id: 8,
    use: 'Conservation',
    aliases: 'conservation,undeveloped,vacant,undeveloped land',
  },
  {
    id: 9,
    use: 'Agricultural',
    aliases: 'agricultural,agriculture,agric',
  },
];

const MIXED_USE = {
  id: 10,
  use: 'Mixed use',
  color: '#9E9E9E',
  aliases: 'mixed use,mixed,mixed-use',
  description:
    'Handbook §3.4.3: hatched shading with the dominant land-use colour most pronounced.',
  sort_order: 10,
};

const PREVIOUS_LABELS = {
  0: 'Residential',
  1: 'Industrial',
  2: 'Education',
  3: 'Recreation',
  4: 'Public Purpose',
  5: 'Commercial',
  6: 'Public Utility',
  7: 'Transportation',
  8: 'Undeveloped',
  9: 'Agricultural',
};

module.exports = {
  up: async (queryInterface) => {
    for (const row of HANDBOOK_CLASSES) {
      await queryInterface.sequelize.query(
        `UPDATE landuse_type
            SET use = :use,
                aliases = :aliases
          WHERE id = :id`,
        { replacements: row }
      );
    }

    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM landuse_type WHERE id = :id`,
      { replacements: { id: MIXED_USE.id } }
    );
    if (!existing.length) {
      await queryInterface.sequelize.query(
        `INSERT INTO landuse_type
           (id, use, color, aliases, description, active, sort_order)
         VALUES
           (:id, :use, :color, :aliases, :description, true, :sort_order)`,
        { replacements: MIXED_USE }
      );
    } else {
      await queryInterface.sequelize.query(
        `UPDATE landuse_type
            SET use = :use,
                color = COALESCE(NULLIF(trim(color), ''), :color),
                aliases = :aliases,
                description = COALESCE(description, :description),
                sort_order = :sort_order
          WHERE id = :id`,
        { replacements: MIXED_USE }
      );
    }
  },

  down: async (queryInterface) => {
    for (const [id, use] of Object.entries(PREVIOUS_LABELS)) {
      await queryInterface.sequelize.query(
        `UPDATE landuse_type SET use = :use WHERE id = :id`,
        { replacements: { id: Number(id), use } }
      );
    }
    await queryInterface.sequelize.query(
      `DELETE FROM landuse_type WHERE id = :id`,
      { replacements: { id: MIXED_USE.id } }
    );
  },
};
