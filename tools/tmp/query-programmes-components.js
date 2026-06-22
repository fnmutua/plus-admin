/** List programmes (programmex) vs implementers (programme_implementation) and components */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })
const db = require('../../server/app/models')

async function run() {
  await db.sequelize.authenticate()
  console.log('DB connected:', process.env.VUE_APP_DB)

  const [programmes] = await db.sequelize.query(`
    SELECT id, title, acronym, code, "parentId"
    FROM programmex
    ORDER BY id
  `)

  const [implementers] = await db.sequelize.query(`
    SELECT id, title, acronym, code
    FROM programme_implementation
    ORDER BY id
  `)

  const [components] = await db.sequelize.query(`
    SELECT c.id, c.title, c.acronym, c.programme_id, p.title AS programme_title, p.acronym AS programme_acronym
    FROM component c
    LEFT JOIN programmex p ON p.id = c.programme_id
    ORDER BY c.programme_id, c.id
  `)

  const [projectLinks] = await db.sequelize.query(`
    SELECT
      COUNT(DISTINCT pl.id) AS location_count,
      COUNT(DISTINCT p.id) AS project_count,
      c.programme_id,
      p2.title AS programme_title
    FROM project_location pl
    JOIN project p ON p.id = pl.project_id
    LEFT JOIN component c ON c.id = p.component_id
    LEFT JOIN programmex p2 ON p2.id = c.programme_id
    GROUP BY c.programme_id, p2.title
    ORDER BY location_count DESC
    LIMIT 20
  `)

  console.log('\n=== programmex (programme table) ===')
  console.table(programmes)

  console.log('\n=== programme_implementation (implementers) ===')
  console.table(implementers)

  console.log('\n=== component → programme_id ===')
  console.table(components)

  console.log('\n=== project_location counts by component.programme_id ===')
  console.table(projectLinks)

  console.log('\n=== expand KISIP2 (18) ===')
  const expanded18 = await expandProgrammeIds([18])
  console.log(expanded18)

  console.log('\n=== components for expanded KISIP2 ===')
  const [comps18] = await db.sequelize.query(`
    SELECT id, title, acronym, programme_id FROM component
    WHERE programme_id IN (${expanded18.join(', ')})
    ORDER BY title
  `)
  console.table(comps18)

  process.exit(0)
}

async function expandProgrammeIds(rawIds) {
  const parsed = (Array.isArray(rawIds) ? rawIds : [rawIds])
    .map((v) => parseInt(v, 10))
    .filter((v) => !isNaN(v))
  if (!parsed.length) return []

  const rows = await db.sequelize.query(
    `SELECT id, "parentId" FROM programmex`,
    { type: db.sequelize.QueryTypes.SELECT }
  )

  const childrenByParent = new Map()
  for (const row of rows) {
    const id = parseInt(row.id, 10)
    const parentRaw = row.parentId
    if (parentRaw != null && parentRaw !== '') {
      const parentId = parseInt(parentRaw, 10)
      if (!isNaN(parentId)) {
        if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, [])
        childrenByParent.get(parentId).push(id)
      }
    }
  }

  const expanded = new Set()
  const walk = (id) => {
    expanded.add(id)
    for (const childId of childrenByParent.get(id) || []) walk(childId)
  }
  for (const id of parsed) walk(id)
  return [...expanded]
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
