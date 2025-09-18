const db = require('../models')
const Sequelize = require('sequelize')
const moment = require('moment')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const shortid = require('shortid')
const { trackIncidentCreation, trackIncidentUpdate, trackIncidentDeletion, trackStatusChange } = require('../utils/incidentHistoryTracker')

const generateINCCode = async () => {
  const prefix = 'INC'
  const currentYear = moment().format('YYYY')
  const latest = await db.models.incident.findOne({ attributes: ['code'], order: [['createdAt', 'DESC']] })
  let newCode = `${prefix}-${currentYear}-0001`
  if (latest && latest.code) {
    const last = latest.code
    const lastYear = last.substring(4, 8)
    const lastSeq = parseInt(last.substring(9), 10)
    if (lastYear === currentYear) {
      const next = lastSeq + 1
      newCode = `${prefix}-${currentYear}-${String(next).padStart(4, '0')}`
    }
  }
  return newCode
}

exports.generateINCCode = async (req, res) => {
  try {
    const code = await generateINCCode()
    res.status(200).send({ data: code, message: 'Code generated successfully.' })
  } catch (e) {
    res.status(500).send({ message: 'Failed to generate code' })
  }
}

exports.createIncident = async (req, res) => {
  try {
    const body = req.body
    if (!body.code) {
      body.code = await generateINCCode()
    }
    const created = await db.models.incident.create(body)
    
    // Track incident creation
    await trackIncidentCreation(created, req.thisUser, req)
    
    res.status(200).send({ code: '0000', data: created })
  } catch (e) {
    console.error('createIncident error', e)
    res.status(500).send({ message: 'Failed to create incident' })
  }
}

exports.getIncidents = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword } = req.body || {}
    const where = {}
    if (keyword) {
      where[Sequelize.Op.or] = [
        { description: { [Sequelize.Op.iLike]: `%${keyword}%` } },
        { code: { [Sequelize.Op.iLike]: `%${keyword}%` } },
        { location_text: { [Sequelize.Op.iLike]: `%${keyword}%` } }
      ]
    }
    const { rows, count } = await db.models.incident.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: pageSize
    })
    res.status(200).send({ code: '0000', data: rows, total: count })
  } catch (e) {
    console.error('getIncidents error', e)
    res.status(500).send({ message: 'Failed to list incidents' })
  }
}

exports.getIncidentById = async (req, res) => {
  try {
    const { id } = req.body
    const one = await db.models.incident.findByPk(id)
    if (!one) return res.status(404).send({ message: 'Not found' })
    res.status(200).send({ code: '0000', data: one })
  } catch (e) {
    res.status(500).send({ message: 'Failed to fetch incident' })
  }
}

exports.updateIncident = async (req, res) => {
  try {
    const { id, ...updateData } = req.body
    const incident = await db.models.incident.findByPk(id)
    if (!incident) return res.status(404).send({ message: 'Incident not found' })
    
    // Store old values for history tracking
    const oldIncident = { ...incident.toJSON() }
    
    // Update the incident
    await incident.update(updateData)
    
    // Track the update
    await trackIncidentUpdate(oldIncident, incident.toJSON(), req.thisUser, req)
    
    res.status(200).send({ code: '0000', data: incident, message: 'Incident updated successfully' })
  } catch (e) {
    console.error('updateIncident error', e)
    res.status(500).send({ message: 'Failed to update incident' })
  }
}

exports.deleteIncident = async (req, res) => {
  try {
    const { id } = req.body
    const incident = await db.models.incident.findByPk(id)
    if (!incident) return res.status(404).send({ message: 'Incident not found' })
    
    // Track the deletion before deleting
    await trackIncidentDeletion(incident, req.thisUser, req)
    
    // Delete the incident
    await incident.destroy()
    
    res.status(200).send({ code: '0000', message: 'Incident deleted successfully' })
  } catch (e) {
    console.error('deleteIncident error', e)
    res.status(500).send({ message: 'Failed to delete incident' })
  }
}

exports.updateIncidentStatus = async (req, res) => {
  try {
    const { id, status, reason } = req.body
    const incident = await db.models.incident.findByPk(id)
    if (!incident) return res.status(404).send({ message: 'Incident not found' })
    
    const oldStatus = incident.status
    await incident.update({ status })
    
    // Track status change
    await trackStatusChange(id, oldStatus, status, req.thisUser, req, reason)
    
    res.status(200).send({ code: '0000', data: incident, message: 'Status updated successfully' })
  } catch (e) {
    console.error('updateIncidentStatus error', e)
    res.status(500).send({ message: 'Failed to update status' })
  }
}

// --- Documents ---
const incUploadDir = '/data/incidents'
if (!fs.existsSync(incUploadDir)) {
  try { fs.mkdirSync(incUploadDir, { recursive: true }) } catch {}
}

const incStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, incUploadDir)
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})
const incUpload = multer({ storage: incStorage, limits: { fileSize: 100 * 1024 * 1024 } })

exports.uploadIncidentDocument = (req, res) => {
  incUpload.array('files')(req, res, async (err) => {
    if (err) {
      return res.status(500).send({ message: 'Upload failed.' })
    }
    let files = req.files
    if (!Array.isArray(files)) files = [files]
    const objectsToInsert = []
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      const many = files.length > 1
      const obj = {}
      if (many) {
        obj.incident_id = req.body.incident_id[i]
        obj.action_id = req.body.action_id ? req.body.action_id[i] : null
        obj.format = req.body.format[i]
        obj.size = req.body.size[i]
        obj.protected_file = req.body.protected_file[i]
        obj.type = req.body.type ? req.body.type[i] : 'Documentation'
      } else {
        obj.incident_id = req.body.incident_id
        obj.action_id = req.body.action_id || null
        obj.format = req.body.format
        obj.size = req.body.size
        obj.protected_file = req.body.protected_file
        obj.type = req.body.type || 'Documentation'
      }
      obj.name = f.originalname
      obj.location = f.path
      obj.code = shortid.generate()
      objectsToInsert.push(obj)
    }
    try {
      for (const o of objectsToInsert) {
        await db.models.incident_document.create(o)
      }
      res.status(200).send({ code: '0000', message: 'Batch Upload Successful' })
    } catch (e) {
      console.error('uploadIncidentDocument error', e)
      res.status(500).send({ message: 'Upload failed. ' + e })
    }
  })
}

exports.getIncidentDocuments = async (req, res) => {
  try {
    const { incident_id } = req.body
    const docs = await db.models.incident_document.findAll({ where: { incident_id } })
    res.status(200).send({ code: '0000', data: docs })
  } catch (e) {
    res.status(500).send({ message: 'Failed to get documents' })
  }
}

exports.deleteIncidentDocument = async (req, res) => {
  try {
    const { id } = req.body
    const doc = await db.models.incident_document.findByPk(id)
    if (!doc) return res.status(404).send({ message: 'Not found' })
    // try remove file on disk
    try { if (doc.location && fs.existsSync(doc.location)) fs.unlinkSync(doc.location) } catch {}
    await db.models.incident_document.destroy({ where: { id } })
    res.status(200).send({ code: '0000', message: 'Deleted' })
  } catch (e) {
    res.status(500).send({ message: 'Failed to delete document' })
  }
}

exports.downloadIncidentFile = (req, res) => {
  const { filename } = req.body
  const fullPath = path.join(incUploadDir, filename)
  if (!fs.existsSync(fullPath)) {
    return res.status(404).send({ message: 'File not found' })
  }
  res.download(fullPath, filename)
}

exports.getIncidentDocumentById = async (req, res) => {
  try {
    const { id } = req.body
    const doc = await db.models.incident_document.findByPk(id)
    if (!doc) return res.status(404).send({ message: 'Not found' })
    res.status(200).send({ code: '0000', data: doc })
  } catch (e) {
    res.status(500).send({ message: 'Failed to get document' })
  }
}

// --- History Tracking ---
exports.getIncidentHistory = async (req, res) => {
  try {
    const { incident_id, page = 1, pageSize = 20 } = req.body
    const where = { incident_id }
    
    const { rows, count } = await db.models.incident_history.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: pageSize,
      include: [
        {
          model: db.models.users,
          as: 'user',
          attributes: ['id', 'name', 'username', 'email'],
          required: false
        }
      ]
    })
    
    res.status(200).send({ code: '0000', data: rows, total: count })
  } catch (e) {
    console.error('getIncidentHistory error', e)
    res.status(500).send({ message: 'Failed to fetch incident history' })
  }
}

exports.getIncidentHistoryByAction = async (req, res) => {
  try {
    const { incident_id, action, page = 1, pageSize = 20 } = req.body
    const where = { incident_id }
    if (action) {
      where.action = action
    }
    
    const { rows, count } = await db.models.incident_history.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: pageSize,
      include: [
        {
          model: db.models.users,
          as: 'user',
          attributes: ['id', 'name', 'username', 'email'],
          required: false
        }
      ]
    })
    
    res.status(200).send({ code: '0000', data: rows, total: count })
  } catch (e) {
    console.error('getIncidentHistoryByAction error', e)
    res.status(500).send({ message: 'Failed to fetch incident history by action' })
  }
}


