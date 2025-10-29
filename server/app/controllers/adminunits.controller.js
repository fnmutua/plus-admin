const db = require('../models')
const { Op } = require('sequelize')
const Sequelize = require('sequelize')

/**
 * Get all counties with settlement counts and area
 */
exports.getCounties = async (req, res) => {
  try {
    const query = `
      SELECT 
        c.id,
        c.name,
        c.code,
        COALESCE(ST_Area(ST_Transform(c.geom, 3857)) / 1000000, 0) as area_km2,
        COUNT(DISTINCT s.id) as settlements_count
      FROM county c
      LEFT JOIN settlement s ON s.county_id = c.id
      GROUP BY c.id, c.name, c.code, c.geom
      ORDER BY c.name ASC
    `
    
    const counties = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT
    })

    res.status(200).send({
      data: counties,
      code: '0000'
    })
  } catch (error) {
    console.error('Error fetching counties:', error)
    res.status(500).send({
      message: 'Error fetching counties',
      code: 'ERROR'
    })
  }
}

/**
 * Get all subcounties with settlement counts and area
 */
exports.getSubcounties = async (req, res) => {
  try {
    const { county_id } = req.query
    
    let whereClause = ''
    if (county_id) {
      whereClause = `WHERE sc.county_id = ${county_id}`
    }
    
    const query = `
      SELECT 
        sc.id,
        sc.name,
        sc.code,
        sc.county_id,
        c.name as county_name,
        COALESCE(ST_Area(ST_Transform(sc.geom, 3857)) / 1000000, 0) as area_km2,
        COUNT(DISTINCT s.id) as settlements_count
      FROM subcounty sc
      LEFT JOIN county c ON c.id = sc.county_id
      LEFT JOIN settlement s ON s.subcounty_id = sc.id
      ${whereClause}
      GROUP BY sc.id, sc.name, sc.code, sc.county_id, c.name, sc.geom
      ORDER BY c.name ASC, sc.name ASC
    `
    
    const subcounties = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT
    })

    res.status(200).send({
      data: subcounties,
      code: '0000'
    })
  } catch (error) {
    console.error('Error fetching subcounties:', error)
    res.status(500).send({
      message: 'Error fetching subcounties',
      code: 'ERROR'
    })
  }
}

/**
 * Get all wards with settlement counts and area
 */
exports.getWards = async (req, res) => {
  try {
    const { county_id, subcounty_id } = req.query
    
    let whereClause = ''
    const conditions = []
    if (county_id) {
      conditions.push(`w.county_id = ${county_id}`)
    }
    if (subcounty_id) {
      conditions.push(`w.subcounty_id = ${subcounty_id}`)
    }
    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`
    }
    
    const query = `
      SELECT 
        w.id,
        w.name,
        w.code,
        w.county_id,
        w.subcounty_id,
        c.name as county_name,
        sc.name as subcounty_name,
        COALESCE(ST_Area(ST_Transform(w.geom, 3857)) / 1000000, 0) as area_km2,
        COUNT(DISTINCT s.id) as settlements_count
      FROM ward w
      LEFT JOIN county c ON c.id = w.county_id
      LEFT JOIN subcounty sc ON sc.id = w.subcounty_id
      LEFT JOIN settlement s ON s.ward_id = w.id
      ${whereClause}
      GROUP BY w.id, w.name, w.code, w.county_id, w.subcounty_id, c.name, sc.name, w.geom
      ORDER BY c.name ASC, sc.name ASC, w.name ASC
    `
    
    const wards = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT
    })

    res.status(200).send({
      data: wards,
      code: '0000'
    })
  } catch (error) {
    console.error('Error fetching wards:', error)
    res.status(500).send({
      message: 'Error fetching wards',
      code: 'ERROR'
    })
  }
}

/**
 * Get single county by ID
 */
exports.getCountyById = async (req, res) => {
  try {
    const { id } = req.params
    
    const county = await db.models.county.findOne({
      where: { id },
      attributes: { exclude: ['geom'] } // Exclude geom by default, can fetch separately if needed
    })
    
    if (!county) {
      return res.status(404).send({
        message: 'County not found',
        code: 'NOT_FOUND'
      })
    }
    
    res.status(200).send({
      data: county,
      code: '0000'
    })
  } catch (error) {
    console.error('Error fetching county:', error)
    res.status(500).send({
      message: 'Error fetching county',
      code: 'ERROR'
    })
  }
}

/**
 * Get single subcounty by ID
 */
exports.getSubcountyById = async (req, res) => {
  try {
    const { id } = req.params
    
    const subcounty = await db.models.subcounty.findOne({
      where: { id },
      include: [{
        model: db.models.county,
        attributes: ['id', 'name']
      }],
      attributes: { exclude: ['geom'] }
    })
    
    if (!subcounty) {
      return res.status(404).send({
        message: 'Subcounty not found',
        code: 'NOT_FOUND'
      })
    }
    
    res.status(200).send({
      data: subcounty,
      code: '0000'
    })
  } catch (error) {
    console.error('Error fetching subcounty:', error)
    res.status(500).send({
      message: 'Error fetching subcounty',
      code: 'ERROR'
    })
  }
}

/**
 * Get single ward by ID
 */
exports.getWardById = async (req, res) => {
  try {
    const { id } = req.params
    
    const ward = await db.models.ward.findOne({
      where: { id },
      include: [
        {
          model: db.models.county,
          attributes: ['id', 'name']
        },
        {
          model: db.models.subcounty,
          attributes: ['id', 'name']
        }
      ],
      attributes: { exclude: ['geom'] }
    })
    
    if (!ward) {
      return res.status(404).send({
        message: 'Ward not found',
        code: 'NOT_FOUND'
      })
    }
    
    res.status(200).send({
      data: ward,
      code: '0000'
    })
  } catch (error) {
    console.error('Error fetching ward:', error)
    res.status(500).send({
      message: 'Error fetching ward',
      code: 'ERROR'
    })
  }
}

/**
 * Create new county
 */
exports.createCounty = async (req, res) => {
  try {
    const createData = { ...req.body }
    
    // Handle geometry if present
    if (createData.geom && typeof createData.geom === 'object') {
      const geomString = JSON.stringify(createData.geom)
      
      // Create with geometry using raw SQL
      const [result] = await db.sequelize.query(
        `INSERT INTO county (name, code, geom, "createdAt", "updatedAt")
         VALUES (:name, :code, ST_SetSRID(ST_GeomFromGeoJSON(:geom), 4326), NOW(), NOW())
         RETURNING *`,
        {
          replacements: {
            name: createData.name,
            code: createData.code,
            geom: geomString
          },
          type: db.sequelize.QueryTypes.INSERT
        }
      )
      
      const newCounty = await db.models.county.findByPk(result[0].id, {
        attributes: { exclude: ['geom'] }
      })
      
      return res.status(201).send({
        message: 'County created successfully',
        data: newCounty,
        code: '0000'
      })
    }
    
    // Create without geometry
    const county = await db.models.county.create({
      name: createData.name,
      code: createData.code
    })
    
    res.status(201).send({
      message: 'County created successfully',
      data: county,
      code: '0000'
    })
  } catch (error) {
    console.error('Error creating county:', error)
    res.status(500).send({
      message: 'Error creating county',
      code: 'ERROR',
      error: error.message
    })
  }
}

/**
 * Update county with geometry support
 */
exports.updateCounty = async (req, res) => {
  try {
    const { id } = req.params
    const updateData = { ...req.body }

    console.log('updateData', updateData)
    
    const county = await db.models.county.findByPk(id)
    if (!county) {
      return res.status(404).send({
        message: 'County not found',
        code: 'NOT_FOUND'
      })
    }
    
    // Handle geometry if present
    if (updateData.geom && typeof updateData.geom === 'object') {
      const geomString = JSON.stringify(updateData.geom)
      
      // Update with geometry using raw SQL
      await db.sequelize.query(
        `UPDATE county SET 
          name = COALESCE(:name, name),
          code = COALESCE(:code, code),
          geom = ST_SetSRID(ST_GeomFromGeoJSON(:geom), 4326),
          "updatedAt" = NOW()
        WHERE id = :id`,
        {
          replacements: {
            id,
            name: updateData.name || county.name,
            code: updateData.code || county.code,
            geom: geomString
          }
        }
      )
      
      // Fetch updated record
      const updated = await db.models.county.findByPk(id, {
        attributes: { exclude: ['geom'] }
      })
      
      return res.status(200).send({
        message: 'County updated successfully',
        data: updated,
        code: '0000'
      })
    }
    
    // Regular update without geometry - only update if fields are provided
    const fieldsToUpdate = {}
    if (updateData.name !== undefined) fieldsToUpdate.name = updateData.name
    if (updateData.code !== undefined) fieldsToUpdate.code = updateData.code
    
    if (Object.keys(fieldsToUpdate).length > 0) {
      await county.update(fieldsToUpdate)
    }
    
    res.status(200).send({
      message: 'County updated successfully',
      data: county,
      code: '0000'
    })
  } catch (error) {
    console.error('Error updating county:', error)
    res.status(500).send({
      message: 'Error updating county',
      code: 'ERROR',
      error: error.message
    })
  }
}

/**
 * Create new subcounty
 */
exports.createSubcounty = async (req, res) => {
  try {
    const createData = { ...req.body }
    
    // Handle geometry if present
    if (createData.geom && typeof createData.geom === 'object') {
      const geomString = JSON.stringify(createData.geom)
      
      const [result] = await db.sequelize.query(
        `INSERT INTO subcounty (name, code, county_id, geom, "createdAt", "updatedAt")
         VALUES (:name, :code, :county_id, ST_SetSRID(ST_GeomFromGeoJSON(:geom), 4326), NOW(), NOW())
         RETURNING *`,
        {
          replacements: {
            name: createData.name,
            code: createData.code,
            county_id: createData.county_id,
            geom: geomString
          },
          type: db.sequelize.QueryTypes.INSERT
        }
      )
      
      const newSubcounty = await db.models.subcounty.findByPk(result[0].id, {
        attributes: { exclude: ['geom'] },
        include: [{
          model: db.models.county,
          attributes: ['id', 'name']
        }]
      })
      
      return res.status(201).send({
        message: 'Subcounty created successfully',
        data: newSubcounty,
        code: '0000'
      })
    }
    
    // Create without geometry
    const subcounty = await db.models.subcounty.create({
      name: createData.name,
      code: createData.code,
      county_id: createData.county_id
    })
    
    res.status(201).send({
      message: 'Subcounty created successfully',
      data: subcounty,
      code: '0000'
    })
  } catch (error) {
    console.error('Error creating subcounty:', error)
    res.status(500).send({
      message: 'Error creating subcounty',
      code: 'ERROR',
      error: error.message
    })
  }
}

/**
 * Update subcounty with geometry support
 */
exports.updateSubcounty = async (req, res) => {
  try {
    const { id } = req.params
    const updateData = { ...req.body }
    
    const subcounty = await db.models.subcounty.findByPk(id)
    if (!subcounty) {
      return res.status(404).send({
        message: 'Subcounty not found',
        code: 'NOT_FOUND'
      })
    }
    
    // Handle geometry if present
    if (updateData.geom && typeof updateData.geom === 'object') {
      const geomString = JSON.stringify(updateData.geom)
      
      await db.sequelize.query(
        `UPDATE subcounty SET 
          name = COALESCE(:name, name),
          code = COALESCE(:code, code),
          county_id = COALESCE(:county_id, county_id),
          geom = ST_SetSRID(ST_GeomFromGeoJSON(:geom), 4326),
          "updatedAt" = NOW()
        WHERE id = :id`,
        {
          replacements: {
            id,
            name: updateData.name || subcounty.name,
            code: updateData.code || subcounty.code,
            county_id: updateData.county_id || subcounty.county_id,
            geom: geomString
          }
        }
      )
      
      const updated = await db.models.subcounty.findByPk(id, {
        attributes: { exclude: ['geom'] },
        include: [{
          model: db.models.county,
          attributes: ['id', 'name']
        }]
      })
      
      return res.status(200).send({
        message: 'Subcounty updated successfully',
        data: updated,
        code: '0000'
      })
    }
    
    // Regular update without geometry - only update if fields are provided
    const fieldsToUpdate = {}
    if (updateData.name !== undefined) fieldsToUpdate.name = updateData.name
    if (updateData.code !== undefined) fieldsToUpdate.code = updateData.code
    if (updateData.county_id !== undefined) fieldsToUpdate.county_id = updateData.county_id
    
    if (Object.keys(fieldsToUpdate).length > 0) {
      await subcounty.update(fieldsToUpdate)
    }
    
    res.status(200).send({
      message: 'Subcounty updated successfully',
      data: subcounty,
      code: '0000'
    })
  } catch (error) {
    console.error('Error updating subcounty:', error)
    res.status(500).send({
      message: 'Error updating subcounty',
      code: 'ERROR',
      error: error.message
    })
  }
}

/**
 * Create new ward
 */
exports.createWard = async (req, res) => {
  try {
    const createData = { ...req.body }
    
    // Handle geometry if present
    if (createData.geom && typeof createData.geom === 'object') {
      const geomString = JSON.stringify(createData.geom)
      
      const [result] = await db.sequelize.query(
        `INSERT INTO ward (name, code, county_id, subcounty_id, geom, "createdAt", "updatedAt")
         VALUES (:name, :code, :county_id, :subcounty_id, ST_SetSRID(ST_GeomFromGeoJSON(:geom), 4326), NOW(), NOW())
         RETURNING *`,
        {
          replacements: {
            name: createData.name,
            code: createData.code,
            county_id: createData.county_id,
            subcounty_id: createData.subcounty_id,
            geom: geomString
          },
          type: db.sequelize.QueryTypes.INSERT
        }
      )
      
      const newWard = await db.models.ward.findByPk(result[0].id, {
        attributes: { exclude: ['geom'] },
        include: [
          { model: db.models.county, attributes: ['id', 'name'] },
          { model: db.models.subcounty, attributes: ['id', 'name'] }
        ]
      })
      
      return res.status(201).send({
        message: 'Ward created successfully',
        data: newWard,
        code: '0000'
      })
    }
    
    // Create without geometry
    const ward = await db.models.ward.create({
      name: createData.name,
      code: createData.code,
      county_id: createData.county_id,
      subcounty_id: createData.subcounty_id
    })
    
    res.status(201).send({
      message: 'Ward created successfully',
      data: ward,
      code: '0000'
    })
  } catch (error) {
    console.error('Error creating ward:', error)
    res.status(500).send({
      message: 'Error creating ward',
      code: 'ERROR',
      error: error.message
    })
  }
}

/**
 * Update ward with geometry support
 */
exports.updateWard = async (req, res) => {
  try {
    const { id } = req.params
    const updateData = { ...req.body }
    
    const ward = await db.models.ward.findByPk(id)
    if (!ward) {
      return res.status(404).send({
        message: 'Ward not found',
        code: 'NOT_FOUND'
      })
    }
    
    // Handle geometry if present
    if (updateData.geom && typeof updateData.geom === 'object') {
      const geomString = JSON.stringify(updateData.geom)
      
      await db.sequelize.query(
        `UPDATE ward SET 
          name = COALESCE(:name, name),
          code = COALESCE(:code, code),
          county_id = COALESCE(:county_id, county_id),
          subcounty_id = COALESCE(:subcounty_id, subcounty_id),
          geom = ST_SetSRID(ST_GeomFromGeoJSON(:geom), 4326),
          "updatedAt" = NOW()
        WHERE id = :id`,
        {
          replacements: {
            id,
            name: updateData.name || ward.name,
            code: updateData.code || ward.code,
            county_id: updateData.county_id || ward.county_id,
            subcounty_id: updateData.subcounty_id || ward.subcounty_id,
            geom: geomString
          }
        }
      )
      
      const updated = await db.models.ward.findByPk(id, {
        attributes: { exclude: ['geom'] },
        include: [
          { model: db.models.county, attributes: ['id', 'name'] },
          { model: db.models.subcounty, attributes: ['id', 'name'] }
        ]
      })
      
      return res.status(200).send({
        message: 'Ward updated successfully',
        data: updated,
        code: '0000'
      })
    }
    
    // Regular update without geometry - only update if fields are provided
    const fieldsToUpdate = {}
    if (updateData.name !== undefined) fieldsToUpdate.name = updateData.name
    if (updateData.code !== undefined) fieldsToUpdate.code = updateData.code
    if (updateData.county_id !== undefined) fieldsToUpdate.county_id = updateData.county_id
    if (updateData.subcounty_id !== undefined) fieldsToUpdate.subcounty_id = updateData.subcounty_id
    
    if (Object.keys(fieldsToUpdate).length > 0) {
      await ward.update(fieldsToUpdate)
    }
    
    res.status(200).send({
      message: 'Ward updated successfully',
      data: ward,
      code: '0000'
    })
  } catch (error) {
    console.error('Error updating ward:', error)
    res.status(500).send({
      message: 'Error updating ward',
      code: 'ERROR',
      error: error.message
    })
  }
}

