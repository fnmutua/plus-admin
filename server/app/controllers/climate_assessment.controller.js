const db = require('../models')
const { Op } = require('sequelize')
const path = require('path')
const fs = require('fs')

let questionsConfig = null

function getQuestionsConfig() {
  if (questionsConfig) return questionsConfig
  const configPath = path.join(__dirname, '../config/climate_assessment_questions.json')
  const raw = fs.readFileSync(configPath, 'utf8')
  questionsConfig = JSON.parse(raw)
  return questionsConfig
}

/**
 * Compute the raw 1–3 average score for a single dimension.
 * Returns the mean of all answered question scores (1–3 scale), or null if nothing answered.
 */
function computeDimensionScore(responses, dimension) {
  const config = getQuestionsConfig()
  const dimConfig = config[dimension]
  if (!dimConfig || !dimConfig.categories) return null

  let total = 0
  let count = 0
  for (const cat of dimConfig.categories) {
    for (const q of cat.questions || []) {
      const answer = responses?.[q.key]
      if (answer != null && answer !== '') {
        const score = q.answers?.[answer]
        if (typeof score === 'number') {
          total += score
          count++
        }
      }
    }
  }
  if (count === 0) return null
  // Return raw average on the 1–3 scale (matching the Excel)
  return Math.round((total / count) * 100) / 100
}

/**
 * Vulnerability = AVG(Sensitivity) − AVG(Adaptive Capacity)
 * Range: [−2, +2]
 * Thresholds: Low ≤ −0.6, Medium (−0.6, 0.6), High ≥ 0.6
 */
function computeVulnerability(sensitivityAvg, adaptiveCapacityAvg) {
  if (sensitivityAvg == null || adaptiveCapacityAvg == null) return { score: null, rating: null }
  const score = Math.round((sensitivityAvg - adaptiveCapacityAvg) * 100) / 100
  let rating = null
  if (score <= -0.6) rating = 'Low'
  else if (score >= 0.6) rating = 'High'
  else rating = 'Medium'
  return { score, rating }
}

/**
 * Risk = AVG(Hazard) + (Exposure × NormalizedVulnerability) / 3
 * where NormalizedVulnerability = (vulnerability_score + 3) / 2
 * Thresholds: Low ≤ 2.17, Medium (2.17, 3.83), High ≥ 3.83
 */
function computeRisk(hazardAvg, exposureAvg, vulnerabilityScore) {
  if (hazardAvg == null || exposureAvg == null || vulnerabilityScore == null) return { score: null, rating: null }
  const normVuln = (vulnerabilityScore + 3) / 2
  const score = Math.round((hazardAvg + (exposureAvg * normVuln) / 3) * 100) / 100
  let rating = null
  if (score <= 2.17) rating = 'Low'
  else if (score >= 3.83) rating = 'High'
  else rating = 'Medium'
  return { score, rating }
}

/**
 * Compute all scores from the four dimension averages.
 * Returns { vulnerability_score, vulnerability_rating, risk_score, risk_rating }.
 */
function computeAllRatings(dimScores) {
  const vuln = computeVulnerability(dimScores.sensitivity, dimScores.adaptive_capacity)
  const risk = computeRisk(dimScores.hazard, dimScores.exposure, vuln.score)
  return {
    vulnerability_score: vuln.score,
    vulnerability_rating: vuln.rating,
    risk_score: risk.score,
    risk_rating: risk.rating,
  }
}

exports.getQuestions = async (req, res) => {
  try {
    const config = getQuestionsConfig()
    return res.status(200).json({
      message: 'Climate assessment questions retrieved',
      data: config,
      code: '0000',
    })
  } catch (error) {
    console.error('Error in getQuestions:', error)
    return res.status(500).json({
      message: 'Failed to retrieve questions',
      error: error.message,
      code: 'SERVER_ERROR',
    })
  }
}

exports.list = async (req, res) => {
  try {
    const { settlement_id, county_id } = req.query
    const where = {}
    if (settlement_id) where.settlement_id = settlement_id
    if (county_id) {
      // Support comma-separated (county_id=1,2,3) or single value; repeated keys often collapse to one in query
      const raw = typeof county_id === 'string' && county_id.includes(',')
        ? county_id.split(',').map((s) => s.trim())
        : Array.isArray(county_id)
          ? county_id.map((s) => String(s))
          : [String(county_id)]
      const numIds = raw.map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n))
      if (numIds.length) where.county_id = { [Op.in]: numIds }
    }

    const assessments = await db.models.climate_assessment.findAll({
      where,
      order: [['assessed_at', 'DESC'], ['created_at', 'DESC']],
      include: [
        { model: db.models.settlement, attributes: ['id', 'name', 'code', 'county_id'] },
        { model: db.models.county, attributes: ['id', 'name'] },
        { model: db.models.users, as: 'assessor', attributes: ['id', 'name', 'username', 'email'] },
      ],
    })

    return res.status(200).json({
      message: 'Climate assessments retrieved',
      data: assessments,
      code: '0000',
    })
  } catch (error) {
    console.error('Error in climate assessment list:', error)
    return res.status(500).json({
      message: 'Failed to retrieve assessments',
      error: error.message,
      code: 'SERVER_ERROR',
    })
  }
}

exports.getOne = async (req, res) => {
  try {
    const { id } = req.params
    const assessment = await db.models.climate_assessment.findByPk(id, {
      include: [
        { model: db.models.settlement, attributes: ['id', 'name', 'code', 'county_id'] },
        { model: db.models.county, attributes: ['id', 'name'] },
        { model: db.models.users, as: 'assessor', attributes: ['id', 'name', 'username', 'email'] },
      ],
    })

    if (!assessment) {
      return res.status(404).json({
        message: 'Assessment not found',
        code: 'NOT_FOUND',
      })
    }

    return res.status(200).json({
      message: 'Climate assessment retrieved',
      data: assessment,
      code: '0000',
    })
  } catch (error) {
    console.error('Error in climate assessment getOne:', error)
    return res.status(500).json({
      message: 'Failed to retrieve assessment',
      error: error.message,
      code: 'SERVER_ERROR',
    })
  }
}

exports.create = async (req, res) => {
  try {
    const { settlement_id, assessed_at } = req.body

    if (!settlement_id) {
      return res.status(400).json({
        message: 'settlement_id is required',
        code: 'INVALID_PARAMETER',
      })
    }

    const settlement = await db.models.settlement.findByPk(settlement_id, {
      attributes: ['id', 'county_id'],
    })
    if (!settlement) {
      return res.status(400).json({
        message: 'Settlement not found',
        code: 'NOT_FOUND',
      })
    }

    // Auth middleware sets req.userid (lowercase); some code uses req.userId
    const assessorId = req.userid ?? req.userId ?? req.thisUser?.id ?? null
    const assessment = await db.models.climate_assessment.create({
      settlement_id,
      county_id: settlement.county_id || null,
      assessor_id: assessorId,
      assessed_at: assessed_at || new Date(),
      status: 'draft',
      hazard_responses: {},
      exposure_responses: {},
      sensitivity_responses: {},
      adaptive_capacity_responses: {},
    })

    // Set code for document upload lookup (batch/pcode finds by code)
    await assessment.update({ code: String(assessment.id) })

    // Return with assessor loaded so client gets username
    const withAssessor = await db.models.climate_assessment.findByPk(assessment.id, {
      include: [
        { model: db.models.settlement, attributes: ['id', 'name', 'code', 'county_id'] },
        { model: db.models.county, attributes: ['id', 'name'] },
        { model: db.models.users, as: 'assessor', attributes: ['id', 'name', 'username', 'email'] },
      ],
    })
    return res.status(201).json({
      message: 'Climate assessment created',
      data: withAssessor || assessment,
      code: '0000',
    })
  } catch (error) {
    console.error('Error in climate assessment create:', error)
    return res.status(500).json({
      message: 'Failed to create assessment',
      error: error.message,
      code: 'SERVER_ERROR',
    })
  }
}

exports.update = async (req, res) => {
  try {
    const { id } = req.params
    const {
      hazard_responses,
      exposure_responses,
      sensitivity_responses,
      adaptive_capacity_responses,
      status,
      assessed_at,
    } = req.body

    const assessment = await db.models.climate_assessment.findByPk(id)
    if (!assessment) {
      return res.status(404).json({
        message: 'Assessment not found',
        code: 'NOT_FOUND',
      })
    }

    const updateData = {}
    if (hazard_responses !== undefined) updateData.hazard_responses = hazard_responses
    if (exposure_responses !== undefined) updateData.exposure_responses = exposure_responses
    if (sensitivity_responses !== undefined) updateData.sensitivity_responses = sensitivity_responses
    if (adaptive_capacity_responses !== undefined) updateData.adaptive_capacity_responses = adaptive_capacity_responses
    if (status !== undefined) updateData.status = status
    if (assessed_at !== undefined) updateData.assessed_at = assessed_at

    const responses = {
      hazard: assessment.hazard_responses || {},
      exposure: assessment.exposure_responses || {},
      sensitivity: assessment.sensitivity_responses || {},
      adaptive_capacity: assessment.adaptive_capacity_responses || {},
    }
    if (hazard_responses !== undefined) responses.hazard = hazard_responses
    if (exposure_responses !== undefined) responses.exposure = exposure_responses
    if (sensitivity_responses !== undefined) responses.sensitivity = sensitivity_responses
    if (adaptive_capacity_responses !== undefined) responses.adaptive_capacity = adaptive_capacity_responses

    updateData.hazard_score = computeDimensionScore(responses.hazard, 'hazard')
    updateData.exposure_score = computeDimensionScore(responses.exposure, 'exposure')
    updateData.sensitivity_score = computeDimensionScore(responses.sensitivity, 'sensitivity')
    updateData.adaptive_capacity_score = computeDimensionScore(responses.adaptive_capacity, 'adaptive_capacity')

    const dimScores = {
      hazard: updateData.hazard_score ?? assessment.hazard_score,
      exposure: updateData.exposure_score ?? assessment.exposure_score,
      sensitivity: updateData.sensitivity_score ?? assessment.sensitivity_score,
      adaptive_capacity: updateData.adaptive_capacity_score ?? assessment.adaptive_capacity_score,
    }
    const ratings = computeAllRatings(dimScores)
    updateData.vulnerability_score = ratings.vulnerability_score
    updateData.vulnerability_rating = ratings.vulnerability_rating
    updateData.risk_score = ratings.risk_score
    updateData.risk_rating = ratings.risk_rating

    await assessment.update(updateData)

    // Reload with associations so the response includes settlement, county, assessor
    const updated = await db.models.climate_assessment.findByPk(id, {
      include: [
        { model: db.models.settlement, attributes: ['id', 'name', 'code', 'county_id'] },
        { model: db.models.county, attributes: ['id', 'name'] },
        { model: db.models.users, as: 'assessor', attributes: ['id', 'name', 'username', 'email'] },
      ],
    })

    return res.status(200).json({
      message: 'Climate assessment updated',
      data: updated,
      code: '0000',
    })
  } catch (error) {
    console.error('Error in climate assessment update:', error)
    return res.status(500).json({
      message: 'Failed to update assessment',
      error: error.message,
      code: 'SERVER_ERROR',
    })
  }
}

exports.computeScores = async (req, res) => {
  try {
    const { id } = req.params
    const assessment = await db.models.climate_assessment.findByPk(id)
    if (!assessment) {
      return res.status(404).json({
        message: 'Assessment not found',
        code: 'NOT_FOUND',
      })
    }

    const dimScores = {
      hazard: computeDimensionScore(assessment.hazard_responses, 'hazard'),
      exposure: computeDimensionScore(assessment.exposure_responses, 'exposure'),
      sensitivity: computeDimensionScore(assessment.sensitivity_responses, 'sensitivity'),
      adaptive_capacity: computeDimensionScore(assessment.adaptive_capacity_responses, 'adaptive_capacity'),
    }
    const ratings = computeAllRatings(dimScores)

    await assessment.update({
      hazard_score: dimScores.hazard,
      exposure_score: dimScores.exposure,
      sensitivity_score: dimScores.sensitivity,
      adaptive_capacity_score: dimScores.adaptive_capacity,
      vulnerability_score: ratings.vulnerability_score,
      vulnerability_rating: ratings.vulnerability_rating,
      risk_score: ratings.risk_score,
      risk_rating: ratings.risk_rating,
    })

    return res.status(200).json({
      message: 'Scores computed',
      data: {
        ...assessment.toJSON(),
        ...dimScores,
        ...ratings,
      },
      code: '0000',
    })
  } catch (error) {
    console.error('Error in computeScores:', error)
    return res.status(500).json({
      message: 'Failed to compute scores',
      error: error.message,
      code: 'SERVER_ERROR',
    })
  }
}

exports.delete = async (req, res) => {
  try {
    const { id } = req.params
    const assessment = await db.models.climate_assessment.findByPk(id)
    if (!assessment) {
      return res.status(404).json({
        message: 'Assessment not found',
        code: 'NOT_FOUND',
      })
    }
    await assessment.destroy()
    return res.status(200).json({
      message: 'Climate assessment deleted',
      code: '0000',
    })
  } catch (error) {
    console.error('Error in climate assessment delete:', error)
    return res.status(500).json({
      message: 'Failed to delete assessment',
      error: error.message,
      code: 'SERVER_ERROR',
    })
  }
}
