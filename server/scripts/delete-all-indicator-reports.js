/**
 * Delete ALL indicator_category_report rows and their attached documents.
 *
 * Report-linked document rows are removed along with their share items and
 * document_links; a stored file is unlinked from disk only when no other
 * document row (settlement, project, other reports, …) still references
 * the same filename.
 *
 *   node server/scripts/delete-all-indicator-reports.js --dry-run
 *   node server/scripts/delete-all-indicator-reports.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })

const fs = require('fs')
const path = require('path')
const db = require('../app/models')
const { Op } = db.Sequelize
const { UPLOAD_DIR } = require('../app/config/paths.config')

const DRY_RUN = process.argv.includes('--dry-run')

async function main() {
  const reportCount = await db.models.indicator_category_report.count()
  const reportDocs = await db.models.document.findAll({
    where: { report_id: { [Op.ne]: null } },
    attributes: ['id', 'name']
  })
  console.log(`Reports: ${reportCount}, report-linked documents: ${reportDocs.length}${DRY_RUN ? ' (dry run — nothing deleted)' : ''}`)
  if (DRY_RUN) return

  const docIds = reportDocs.map((d) => d.id)
  let filesRemoved = 0

  if (docIds.length) {
    await db.models.document_share_item.destroy({ where: { document_id: { [Op.in]: docIds } } })
    await db.models.document_link.destroy({ where: { document_id: { [Op.in]: docIds } } })
    await db.models.document.destroy({ where: { id: { [Op.in]: docIds } } })

    // Unlink stored files whose name is no longer referenced by any document row
    const names = [...new Set(reportDocs.map((d) => d.name))]
    for (const name of names) {
      const stillReferenced = await db.models.document.count({ where: { name } })
      if (stillReferenced === 0) {
        try {
          fs.unlinkSync(path.join(UPLOAD_DIR, name))
          filesRemoved++
        } catch (_) { /* file already gone */ }
      }
    }
  }

  const deletedReports = await db.models.indicator_category_report.destroy({ where: {} })
  console.log(`Deleted ${deletedReports} reports, ${docIds.length} document rows, ${filesRemoved} files from disk.`)
}

main()
  .catch((err) => {
    console.error('Failed:', err)
    process.exitCode = 1
  })
  .finally(() => db.sequelize.close())
