const db = require('../models')
const Sequelize = require('sequelize')
const moment = require('moment')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const shortid = require('shortid')
const { trackIncidentHistory, trackIncidentCreation, trackIncidentUpdate, trackIncidentDeletion, trackStatusChange } = require('../utils/incidentHistoryTracker')
const nodemailer = require('nodemailer')
const axios = require('axios')
const { isIncidentSMSEnabled } = require('../utils/smsSettings')
// PDF generation moved to frontend using jsPDF

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

// SMS Utility Functions
function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return null;
  
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('254')) {
    return cleaned; // Already in correct format
  } else if (cleaned.startsWith('0')) {
    return '254' + cleaned.substring(1); // Convert 07... to 2547...
  } else if (cleaned.startsWith('7') && cleaned.length === 9) {
    return '254' + cleaned; // Convert 7... to 2547...
  } else if (cleaned.length === 9) {
    return '254' + cleaned; // Add 254 prefix
  }
  
  return cleaned; // Return as-is if no pattern matches
}

// Helper function to determine incident level
function getIncidentLevel(incident) {
  // Check if location_level is explicitly set
  if (incident && incident.location_level === 'national') {
    return 'national'
  }
  // If it has county_id or settlement_id, it's county level
  if (incident && (incident.county_id || incident.settlement_id)) {
    return 'county'
  }
  // Default to county for backward compatibility
  return 'county'
}

async function sendNotificationSMS(phone_number, message, incident = null) {
  // Determine the level from the incident data
  const level = getIncidentLevel(incident)
  console.log(`[SMS] Incident level determined: ${level}`, {
    location_level: incident?.location_level,
    county_id: incident?.county_id,
    settlement_id: incident?.settlement_id,
    incident_id: incident?.id
  })
  
  // Check if SMS is enabled for incident module at the determined level
  const moduleName = level === 'national' ? 'sms_incident_national' : 'sms_incident_county'
  const smsEnabled = await isIncidentSMSEnabled(level)
  console.log(`[SMS] Incident SMS status for ${level} level (${moduleName}):`, { enabled: smsEnabled })
  
  if (!smsEnabled) {
    console.log(`[SMS] SMS sending is disabled for incident module at ${level} level (${moduleName}). Skipping SMS notification.`)
    return
  }

  const url = "https://quicksms.advantasms.com/api/services/sendotp/";
  
  if (!phone_number || !message) {
    console.warn("Invalid input: phone_number or message is missing.");
    return;
  }

  const requestData = {
    apikey: "***REDACTED***",
    partnerID: "12108",
    shortcode: "KISIP",
    message: message,
    mobile: formatPhoneNumber(phone_number),
  };

  try {
    const response = await axios.post(url, requestData);
    console.log(`SMS sent to ${phone_number}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error sending SMS to ${phone_number}:`, error);
    throw error;
  }
}

async function getSafeguardsUsers() {
  try {
    const users = await db.models.users.findAll({
      include: [
        {
          model: db.models.user_roles,
          where: {
           // roleid: { [Sequelize.Op.in]: [0, 1, 11] } // Root Admin, Super Admin, and Support roles
            roleid: { [Sequelize.Op.in]: [0,11] } // Root Admin, Super Admin, and Support roles
          }
        }
      ],
      attributes: ['id', 'name', 'phone', 'email', 'username']
    });

    return users;
  } catch (error) {
    console.error('Error fetching safeguards users:', error);
    return [];
  }
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
    
    // Fetch county and settlement names for SMS
    let countyName = 'N/A';
    let settlementName = 'N/A';
    
    try {
      if (created.county_id) {
        const county = await db.models.county.findByPk(created.county_id);
        if (county) countyName = county.name;
      }
      
      if (created.settlement_id) {
        const settlement = await db.models.settlement.findByPk(created.settlement_id);
        if (settlement) settlementName = settlement.name;
      }
    } catch (geoError) {
      console.error('Failed to fetch geographic data:', geoError);
      // Continue with SMS even if geographic data fetch fails
    }

    // Send acknowledgement SMS to the person filing the incident
    console.log('body.reporter_phone', body)
    if (body.reporter_phone) {
      try {
        const serverUrl = `${req.protocol}://${req.get('host')}`;
        const statusUrl = `${serverUrl}/#/incidents/${created.id}`;
        const acknowledgementMessage = `Dear ${body.reported_by || 'Valued User'}, your incident has been received with reference ${body.code}. Location: ${settlementName}, ${countyName}. You can monitor the status of your report here -> ${statusUrl}. Thank you for reporting.`;
        await sendNotificationSMS(body.reporter_phone, acknowledgementMessage, created);
        console.log(`Acknowledgement SMS sent to ${body.reporter_phone}`);
      } catch (smsError) {
        console.error('Failed to send acknowledgement SMS:', smsError);
        // Don't fail the entire request if SMS fails
      }
    }
    
    // Notify safeguards users about the new incident
    try {
      const safeguardsUsers = await getSafeguardsUsers();
      const serverUrl = `${req.protocol}://${req.get('host')}`;
      const incidentUrl = `${serverUrl}/#/incidents/${created.id}`;
      const incidentMessage = `New incident reported: ${body.code}. Location: ${settlementName}, ${countyName}. Type: ${body.incident_types ? body.incident_types.join(', ') : 'N/A'}, Severity: ${body.severity || 'N/A'}. Review and take action here -> ${incidentUrl}`;
      
      const smsPromises = safeguardsUsers.map(async (user) => {
        if (user.phone) {
          try {
            await sendNotificationSMS(user.phone, incidentMessage, created);
            console.log(`SMS notification sent to safeguards user ${user.name} (${user.phone})`);
          } catch (error) {
            console.error(`Failed to send SMS to ${user.name}:`, error.message);
          }
        }
      });
      
      // Wait for all SMS to be sent (but don't fail if some fail)
      await Promise.allSettled(smsPromises);
      console.log(`Notified ${safeguardsUsers.length} safeguards users about incident ${body.code}`);
    } catch (notificationError) {
      console.error('Failed to notify safeguards users:', notificationError);
      // Don't fail the entire request if notification fails
    }
    
    res.status(200).send({ 
      code: '0000', 
      data: created,
      message: 'Incident created successfully. Acknowledgement SMS sent.',
      safeguardsNotified: true
    })
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
    const { id, action_taken, ...updateData } = req.body
    const incident = await db.models.incident.findByPk(id)
    if (!incident) return res.status(404).send({ message: 'Incident not found' })
    
    // Store old values for history tracking
    const oldIncident = { ...incident.toJSON() }
    
    // Check if status is being changed specifically
    const isStatusChange = Object.prototype.hasOwnProperty.call(updateData, 'status') && updateData.status !== oldIncident.status

    // If status is changing, action_taken is required
    if (isStatusChange && (!action_taken || !String(action_taken).trim())) {
      return res.status(400).send({ code: '1001', message: 'Action taken is required when changing status' })
    }
    
    // Update the incident (without action_taken field)
    await incident.update(updateData)
    
    // Track the update
    await trackIncidentUpdate(oldIncident, incident.toJSON(), req.thisUser, req)
    
    // If status was changed and action_taken was provided, track it separately in history
    if (isStatusChange && action_taken) {
      await trackIncidentHistory({
        incidentId: id,
        action: 'status_changed',
        fieldName: 'status',
        oldValue: oldIncident.status,
        newValue: updateData.status,
        changedBy: req.thisUser?.id,
        changedByName: req.thisUser?.name || req.thisUser?.username,
        changeReason: `Status changed from '${oldIncident.status}' to '${updateData.status}'. Action taken: ${action_taken}`,
        ipAddress: req?.ip || req?.connection?.remoteAddress,
        userAgent: req?.get('User-Agent')
      })
    }
    
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
    
    // Track the deletion before removing associations so the audit row is also cleaned
    await trackIncidentDeletion(incident, req.thisUser, req)
    
    // Find all associated documents
    const documents = await db.models.incident_document.findAll({
      where: { incident_id: id }
    })
    
    // Delete physical files from disk
    for (const doc of documents) {
      try {
        if (doc.location && fs.existsSync(doc.location)) {
          fs.unlinkSync(doc.location)
          console.log(`Deleted file: ${doc.location}`)
        }
      } catch (fileError) {
        console.error(`Failed to delete file ${doc.location}:`, fileError)
        // Continue with deletion even if file removal fails
      }
    }
    
    // Delete all associated documents from database
    if (documents.length > 0) {
      await db.models.incident_document.destroy({
        where: { incident_id: id }
      })
      console.log(`Deleted ${documents.length} associated documents`)
    }
    
    // Delete all associated history records
    const historyCount = await db.models.incident_history.destroy({
      where: { incident_id: id }
    })
    if (historyCount > 0) {
      console.log(`Deleted ${historyCount} associated history records`)
    }
    
    // Delete the incident
    await incident.destroy()
    
    res.status(200).send({ 
      code: '0000', 
      message: `Incident deleted successfully. Removed ${documents.length} associated documents and ${historyCount} history records.` 
    })
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

// --- Email ---
exports.sendIncidentEmail = async (req, res) => {
  try {
    const { to, subject, text, html } = req.body || {}

    if (!to || (Array.isArray(to) && to.length === 0)) {
      return res.status(400).send({ code: '1001', message: 'Recipient email(s) required' })
    }

    const recipients = Array.isArray(to) ? to : String(to).split(',').map((x) => x.trim())
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const validEmails = recipients.filter((e) => emailRegex.test(e))
    if (!validEmails.length) {
      return res.status(400).send({ code: '1002', message: 'No valid recipient emails' })
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'kisip.mis@gmail.com',
        pass: process.env.EMAIL_PASS || 'ycoxaqavmfiqljjg'
      }
    })

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'kisip.mis@gmail.com',
      to: validEmails.join(','),
      subject: subject || 'Notification',
      text: text || '',
      html: html || undefined
    })

    res.status(200).send({ code: '0000', message: 'Email sent', data: { messageId: info.messageId } })
  } catch (e) {
    console.error('sendIncidentEmail error', e)
    res.status(500).send({ code: '9999', message: 'Failed to send email' })
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

// --- PDF Report Data ---
exports.getIncidentPDFData = async (req, res) => {
  try {
    const { id } = req.body
    if (!id) {
      return res.status(400).send({ message: 'Incident ID is required' })
    }

    // Fetch incident with all related data
    const incident = await db.models.incident.findByPk(id)
    if (!incident) {
      return res.status(404).send({ message: 'Incident not found' })
    }

    // Fetch incident documents
    const documents = await db.models.incident_document.findAll({
      where: { incident_id: id }
    })

    // Fetch incident history
    const history = await db.models.incident_history.findAll({
      where: { incident_id: id },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: db.models.users,
          as: 'user',
          attributes: ['id', 'name', 'username', 'email'],
          required: false
        }
      ]
    })

    // Return all data for frontend PDF generation
    res.status(200).send({ 
      code: '0000', 
      data: {
        incident,
        documents,
        history
      }
    })

  } catch (e) {
    console.error('getIncidentPDFData error', e)
    res.status(500).send({ message: 'Failed to fetch incident data for PDF' })
  }
}

// Get all users with safeguards roles
exports.getSafeguardsUsers = async (req, res) => {
  try {
    const safeguardsUsers = await getSafeguardsUsers();
    res.status(200).send({ 
      code: '0000', 
      data: safeguardsUsers,
      message: 'Safeguards users retrieved successfully',
      total: safeguardsUsers.length
    });
  } catch (e) {
    console.error('getSafeguardsUsers error', e);
    res.status(500).send({ message: 'Failed to fetch safeguards users' });
  }
}

// Get public incident details (no authentication required)
exports.getPublicIncident = async (req, res) => {
  try {
    const { id } = req.body
    console.log('getPublicIncident called with id:', id)
    
    if (!id) {
      return res.status(400).send({ message: 'Incident ID is required' })
    }

    // First, try to get the incident without associations to debug
    const incident = await db.models.incident.findByPk(id)
    console.log('Incident found:', incident ? 'Yes' : 'No')
    
    if (!incident) {
      return res.status(404).send({ message: 'Incident not found' })
    }

    // Fetch incident history
    const history = await db.models.incident_history.findAll({
      where: { incident_id: id },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: db.models.users,
          as: 'user',
          attributes: ['id', 'name', 'username'],
          required: false
        }
      ]
    })

    console.log('History found:', history.length, 'records')

    // Return all data for public view
    res.status(200).send({ 
      code: '0000', 
      data: {
        incident,
        history
      }
    })

  } catch (e) {
    console.error('getPublicIncident error', e)
    res.status(500).send({ message: 'Failed to fetch incident data' })
  }
}


