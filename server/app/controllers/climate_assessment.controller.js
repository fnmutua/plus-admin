const db = require('../models')
const { Op } = require('sequelize')
const path = require('path')
const fs = require('fs')

let questionsConfigCache = null
const questionsConfigCacheByVersion = new Map()
// Keep short so admin edits propagate quickly.
const QUESTIONS_CACHE_TTL_MS = 10 * 1000

const DIMENSIONS = ['hazard', 'exposure', 'sensitivity', 'adaptive_capacity']

const ASSESSMENT_INCLUDES = [
  { model: db.models.settlement, attributes: ['id', 'name', 'code', 'county_id'] },
  { model: db.models.county, attributes: ['id', 'name'] },
  { model: db.models.users, as: 'assessor', attributes: ['id', 'name', 'username', 'email'] },
]

function isUniqueSettlementViolation(error) {
  return error?.name === 'SequelizeUniqueConstraintError'
    || error?.original?.code === '23505'
}

async function findAssessmentWithIncludes(where) {
  return db.models.climate_assessment.findOne({
    where,
    include: ASSESSMENT_INCLUDES,
  })
}

/**
 * Merge an incoming (partial) set of answers for one dimension into the stored set
 * without clobbering answers other groups already saved.
 *
 * Rules:
 *  - Only question keys present in `incoming` are touched; absent keys are preserved.
 *  - Newest-wins per question: an incoming answer only overwrites the stored one when its
 *    timestamp is greater than or equal to the stored answer's timestamp. This makes
 *    delayed offline syncs safe (an old draft can't overwrite a newer answer).
 *  - `null` clears an answer, but only if the clear is newer than the stored answer.
 *
 * @param {Object} existingResp  stored answers { key: value }
 * @param {Object} existingMeta  stored per-key meta { key: { at, by, group } }
 * @param {Object} incomingResp  incoming (partial) answers { key: value|null }
 * @param {Object} incomingMeta  incoming per-key meta { key: { at, group } }
 * @param {Object} actor         { by, group } identity of the caller for attribution
 * @returns {{ merged: Object, meta: Object, changed: boolean }}
 */
function mergeDimensionResponses(existingResp, existingMeta, incomingResp, incomingMeta, actor) {
  const merged = { ...(existingResp || {}) }
  const meta = { ...(existingMeta || {}) }
  const nowIso = new Date().toISOString()
  let changed = false

  for (const key of Object.keys(incomingResp || {})) {
    const incomingVal = incomingResp[key]
    const incomingAt = incomingMeta?.[key]?.at || nowIso
    const existingAt = meta[key]?.at

    const isNewer = !existingAt || incomingAt >= existingAt

    // Explicit clear
    if (incomingVal === null || incomingVal === undefined || incomingVal === '') {
      if (key in merged && isNewer) {
        delete merged[key]
        delete meta[key]
        changed = true
      }
      continue
    }

    if (isNewer && merged[key] !== incomingVal) {
      merged[key] = incomingVal
      meta[key] = {
        at: incomingAt,
        by: actor?.by ?? null,
        group: incomingMeta?.[key]?.group ?? actor?.group ?? null,
      }
      changed = true
    } else if (isNewer && !meta[key]) {
      // Same value but no recorded meta yet: keep value, record meta for future comparisons.
      meta[key] = {
        at: incomingAt,
        by: actor?.by ?? null,
        group: incomingMeta?.[key]?.group ?? actor?.group ?? null,
      }
    }
  }

  return { merged, meta, changed }
}

function getQuestionsConfigFromFile() {
  const configPath = path.join(__dirname, '../config/climate_assessment_questions.json')
  const raw = fs.readFileSync(configPath, 'utf8')
  return JSON.parse(raw)
}

async function getQuestionsConfigByVersion(version = null, forceRefresh = false) {
  const now = Date.now()
  const cacheKey = version != null ? `v${version}` : 'active'

  if (!forceRefresh) {
    if (version == null && questionsConfigCache && (now - questionsConfigCache.fetchedAt) < QUESTIONS_CACHE_TTL_MS) {
      return questionsConfigCache
    }
    const cached = questionsConfigCacheByVersion.get(cacheKey)
    if (cached && (now - cached.fetchedAt) < QUESTIONS_CACHE_TTL_MS) {
      return cached
    }
  }

  try {
    const whereClause = version != null ? 'version = :version' : 'is_active = TRUE'
    const replacements = version != null ? { version } : {}
    const [row] = await db.sequelize.query(
      `
      SELECT version, config, is_active
      FROM climate_assessment_question_config
      WHERE ${whereClause}
      ORDER BY version DESC, id DESC
      LIMIT 1
      `,
      { type: db.Sequelize.QueryTypes.SELECT, replacements }
    )

    if (row?.config) {
      const payload = {
        version: row.version || 1,
        config: row.config,
        source: 'database',
        is_active: !!row.is_active,
        fetchedAt: now,
      }
      questionsConfigCacheByVersion.set(cacheKey, payload)
      if (version == null) questionsConfigCache = payload
      return payload
    }
  } catch (error) {
    console.error('Error loading climate questions from DB, using file fallback:', error.message || error)
  }

  if (version != null) {
    return null
  }

  const fallbackConfig = getQuestionsConfigFromFile()
  questionsConfigCache = {
    version: 1,
    config: fallbackConfig,
    source: 'file',
    is_active: true,
    fetchedAt: now,
  }
  return questionsConfigCache
}

async function getActiveQuestionsConfig(forceRefresh = false) {
  return getQuestionsConfigByVersion(null, forceRefresh)
}

/**
 * Compute the raw 1–3 average score for a single dimension.
 * Returns the mean of all answered question scores (1–3 scale), or null if nothing answered.
 */
function computeDimensionScore(responses, dimension, config) {
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
    const rawVersion = req.query?.version
    const requestedVersion = rawVersion !== undefined && rawVersion !== null && rawVersion !== ''
      ? parseInt(String(rawVersion), 10)
      : null

    if (requestedVersion != null && Number.isNaN(requestedVersion)) {
      return res.status(400).json({
        message: 'Invalid "version" query parameter',
        code: 'INVALID_PARAMETER',
      })
    }

    const configMeta = await getQuestionsConfigByVersion(requestedVersion)
    if (!configMeta) {
      return res.status(404).json({
        message: `No climate assessment question config found for version ${requestedVersion}`,
        code: 'NOT_FOUND',
      })
    }

    return res.status(200).json({
      message: 'Climate assessment questions retrieved',
      data: configMeta.config,
      version: configMeta.version,
      source: configMeta.source,
      is_active: configMeta.is_active,
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

exports.listQuestionVersions = async (req, res) => {
  try {
    const rows = await db.sequelize.query(
      `
      SELECT DISTINCT ON (version)
        id,
        version,
        is_active,
        "createdAt",
        "updatedAt"
      FROM climate_assessment_question_config
      ORDER BY version DESC, id DESC
      `,
      { type: db.Sequelize.QueryTypes.SELECT }
    )

    return res.status(200).json({
      message: 'Climate assessment question versions retrieved',
      data: rows,
      code: '0000',
    })
  } catch (error) {
    console.error('Error in listQuestionVersions:', error)
    return res.status(500).json({
      message: 'Failed to list question versions',
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
      include: ASSESSMENT_INCLUDES,
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
    const assessment = await findAssessmentWithIncludes({ id })

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

exports.getBySettlement = async (req, res) => {
  try {
    const settlementId = parseInt(String(req.params.settlement_id), 10)
    if (Number.isNaN(settlementId)) {
      return res.status(400).json({
        message: 'Invalid settlement_id',
        code: 'INVALID_PARAMETER',
      })
    }

    const assessment = await findAssessmentWithIncludes({ settlement_id: settlementId })
    if (!assessment) {
      return res.status(404).json({
        message: 'No climate assessment for this settlement',
        code: 'NOT_FOUND',
      })
    }

    return res.status(200).json({
      message: 'Climate assessment retrieved',
      data: assessment,
      code: '0000',
    })
  } catch (error) {
    console.error('Error in climate assessment getBySettlement:', error)
    return res.status(500).json({
      message: 'Failed to retrieve assessment',
      error: error.message,
      code: 'SERVER_ERROR',
    })
  }
}

exports.create = async (req, res) => {
  try {
    const { settlement_id, assessed_at, question_config_version } = req.body

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
    const versionNum = question_config_version != null ? parseInt(String(question_config_version), 10) : null
    const configMeta = await getQuestionsConfigByVersion(
      versionNum != null && !Number.isNaN(versionNum) ? versionNum : null
    )
    const activeConfig = configMeta || (await getActiveQuestionsConfig())

    const existing = await findAssessmentWithIncludes({ settlement_id })
    if (existing) {
      return res.status(200).json({
        message: 'Climate assessment already exists for this settlement',
        data: existing,
        existing: true,
        code: '0000',
      })
    }

    let assessment
    try {
      assessment = await db.models.climate_assessment.create({
        settlement_id,
        county_id: settlement.county_id || null,
        assessor_id: assessorId,
        assessed_at: assessed_at || new Date(),
        status: 'draft',
        hazard_responses: {},
        exposure_responses: {},
        sensitivity_responses: {},
        adaptive_capacity_responses: {},
        response_meta: {},
        question_config_version: activeConfig.version || 1,
      })
    } catch (error) {
      if (isUniqueSettlementViolation(error)) {
        const raced = await findAssessmentWithIncludes({ settlement_id })
        if (raced) {
          return res.status(200).json({
            message: 'Climate assessment already exists for this settlement',
            data: raced,
            existing: true,
            code: '0000',
          })
        }
      }
      throw error
    }

    // Set code for document upload lookup (batch/pcode finds by code)
    await assessment.update({ code: String(assessment.id) })

    const withAssessor = await findAssessmentWithIncludes({ id: assessment.id })
    return res.status(201).json({
      message: 'Climate assessment created',
      data: withAssessor || assessment,
      existing: false,
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
      geom,
      question_config_version,
      response_meta,
      group_label,
    } = req.body

    const incomingByDimension = {
      hazard: hazard_responses,
      exposure: exposure_responses,
      sensitivity: sensitivity_responses,
      adaptive_capacity: adaptive_capacity_responses,
    }

    const assessment = await db.models.climate_assessment.findByPk(id)
    if (!assessment) {
      return res.status(404).json({
        message: 'Assessment not found',
        code: 'NOT_FOUND',
      })
    }

    const versionForScoring = question_config_version != null
      ? parseInt(String(question_config_version), 10)
      : assessment.question_config_version
    const configMeta = await getQuestionsConfigByVersion(
      versionForScoring != null && !Number.isNaN(versionForScoring) ? versionForScoring : null
    )
    const scoringConfig = configMeta || (await getActiveQuestionsConfig())

    const actor = {
      by: req.userid ?? req.userId ?? req.thisUser?.id ?? null,
      group: group_label ?? null,
    }
    const incomingMetaAll = response_meta && typeof response_meta === 'object' ? response_meta : {}
    const existingMetaAll = assessment.response_meta && typeof assessment.response_meta === 'object'
      ? assessment.response_meta
      : {}
    const newMetaAll = { ...existingMetaAll }

    const updateData = {}
    // Per-question deep-merge so concurrent group edits don't clobber one another.
    const responses = {
      hazard: assessment.hazard_responses || {},
      exposure: assessment.exposure_responses || {},
      sensitivity: assessment.sensitivity_responses || {},
      adaptive_capacity: assessment.adaptive_capacity_responses || {},
    }
    for (const dim of DIMENSIONS) {
      const incoming = incomingByDimension[dim]
      if (incoming === undefined) continue
      const { merged, meta } = mergeDimensionResponses(
        assessment[`${dim}_responses`] || {},
        existingMetaAll[dim] || {},
        incoming || {},
        incomingMetaAll[dim] || {},
        actor
      )
      updateData[`${dim}_responses`] = merged
      newMetaAll[dim] = meta
      responses[dim] = merged
    }
    updateData.response_meta = newMetaAll

    if (status !== undefined) updateData.status = status
    if (assessed_at !== undefined) updateData.assessed_at = assessed_at
    if (geom !== undefined && geom && geom.type === 'Point' && Array.isArray(geom.coordinates) && geom.coordinates.length >= 2) updateData.geom = geom
    updateData.question_config_version = scoringConfig.version || assessment.question_config_version || 1

    updateData.hazard_score = computeDimensionScore(responses.hazard, 'hazard', scoringConfig.config)
    updateData.exposure_score = computeDimensionScore(responses.exposure, 'exposure', scoringConfig.config)
    updateData.sensitivity_score = computeDimensionScore(responses.sensitivity, 'sensitivity', scoringConfig.config)
    updateData.adaptive_capacity_score = computeDimensionScore(responses.adaptive_capacity, 'adaptive_capacity', scoringConfig.config)

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
    const updated = await findAssessmentWithIncludes({ id })

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

    const versionForScoring = assessment.question_config_version
    const configMeta = await getQuestionsConfigByVersion(
      versionForScoring != null ? versionForScoring : null
    )
    const scoringConfig = configMeta || (await getActiveQuestionsConfig())

    const dimScores = {
      hazard: computeDimensionScore(assessment.hazard_responses, 'hazard', scoringConfig.config),
      exposure: computeDimensionScore(assessment.exposure_responses, 'exposure', scoringConfig.config),
      sensitivity: computeDimensionScore(assessment.sensitivity_responses, 'sensitivity', scoringConfig.config),
      adaptive_capacity: computeDimensionScore(assessment.adaptive_capacity_responses, 'adaptive_capacity', scoringConfig.config),
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
      question_config_version: scoringConfig.version || assessment.question_config_version || 1,
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
