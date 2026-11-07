'use strict';

/**
 * Align parcel land-use colours with Physical and Land Use Planning
 * Handbook 2025 §3.4.3 Table 6 (RGB / screen display values).
 */

const HANDBOOK_COLORS = {
  0: '#D7C29E', // Residential 215,194,158
  1: '#C500FF', // Industrial 197,0,255
  2: '#FFAA00', // Educational 255,170,0
  3: '#A3FF73', // Recreation 163,255,115
  4: '#FFFF00', // Public purpose 255,255,0
  5: '#FF0000', // Commercial 255,0,0
  6: '#0070FF', // Public utilities 0,112,255
  7: '#CCCCCC', // Transportation fill #CCCCCC
  8: '#FFFFBE', // Conservation 255,255,190
  9: '#FFFFE6', // Agricultural 255,255,230
  10: '#9E9E9E', // Mixed use (hatched in handbook; solid fallback)
};

module.exports = {
  up: async (queryInterface) => {
    for (const [id, color] of Object.entries(HANDBOOK_COLORS)) {
      await queryInterface.sequelize.query(
        `UPDATE landuse_type SET color = :color WHERE id = :id`,
        { replacements: { id: Number(id), color } }
      );
    }
  },

  down: async (queryInterface) => {
    const previous = {
      0: '#8C675D',
      1: '#800080',
      2: '#F6C567',
      3: '#6FDC6E',
      4: '#FFFF00',
      5: '#FF1D1E',
      6: '#73B2FF',
      7: '#DCDCDC',
      8: '#FDFD96',
      9: '#90EE90',
    };
    for (const [id, color] of Object.entries(previous)) {
      await queryInterface.sequelize.query(
        `UPDATE landuse_type SET color = :color WHERE id = :id`,
        { replacements: { id: Number(id), color } }
      );
    }
  },
};
