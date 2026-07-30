const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { pipeline } = require('stream/promises');
const { Op } = require('sequelize');
const db = require('../models');
const {
  UPLOAD_DIR,
  IPC_UPLOAD_DIR,
  PROJECT_DELETE_ARCHIVE_DIR,
  ensureDir,
} = require('../config/paths.config');

function safeBasename(name) {
  return path.basename(String(name ?? '').trim());
}

function resolveIpcSourcePaths(row) {
  const safeName = safeBasename(row?.name);
  if (!safeName) return [];
  const paths = [
    path.join(IPC_UPLOAD_DIR, safeName),
    path.join(UPLOAD_DIR, safeName),
  ];
  if (row?.code) paths.push(path.join(IPC_UPLOAD_DIR, safeBasename(row.code)));
  return [...new Set(paths.map((p) => path.normalize(p)))];
}

function resolveDocumentSourcePath(row) {
  const uploadRoot = path.resolve(UPLOAD_DIR);
  const storedPath = row?.location ? path.resolve(String(row.location)) : '';
  if (storedPath && storedPath.startsWith(uploadRoot + path.sep) && fs.existsSync(storedPath)) {
    return storedPath;
  }
  if (storedPath && fs.existsSync(storedPath)) {
    return storedPath;
  }

  let fileName = String(row?.name || '').trim();
  if (fileName && !/\.\w+$/.test(fileName) && row?.format) {
    fileName = `${fileName}.${String(row.format).replace(/^\./, '')}`;
  }

  const byName = path.join(uploadRoot, safeBasename(fileName || row?.name));
  if (fs.existsSync(byName)) return byName;

  const byRawName = path.join(uploadRoot, safeBasename(row?.name));
  if (row?.name && byRawName !== byName && fs.existsSync(byRawName)) return byRawName;

  return null;
}

async function findExistingSource(candidates) {
  for (const candidate of candidates) {
    try {
      await fs.promises.access(candidate, fs.constants.R_OK);
      return candidate;
    } catch {
      // try next
    }
  }
  return null;
}

async function gzipCopy(sourcePath, destPath) {
  ensureDir(path.dirname(destPath));
  await pipeline(
    fs.createReadStream(sourcePath),
    zlib.createGzip({ level: 6 }),
    fs.createWriteStream(destPath),
  );
}

async function gunzipCopy(sourcePath, destPath) {
  ensureDir(path.dirname(destPath));
  await pipeline(
    fs.createReadStream(sourcePath),
    zlib.createGunzip(),
    fs.createWriteStream(destPath),
  );
}

async function removeSourceIfExists(sourcePath) {
  if (!sourcePath) return;
  try {
    await fs.promises.unlink(sourcePath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('Failed to remove archived source file:', sourcePath, err.message);
    }
  }
}

/**
 * Move project IPC + documentation files into a compressed archive before cascade delete.
 * Returns manifest stored on project_history.changes.archived_files
 */
async function archiveProjectDeleteFiles(projectId) {
  const numericId = Number(projectId);
  if (!Number.isFinite(numericId)) return null;

  const archiveKey = `project-${numericId}-${Date.now()}`;
  const archiveRoot = path.join(PROJECT_DELETE_ARCHIVE_DIR, archiveKey);
  ensureDir(archiveRoot);

  const manifest = {
    archiveKey,
    archiveRoot,
    ipc_documents: [],
    documents: [],
  };

  const ipcRows = await db.models.ipc_document.findAll({
    where: { project_id: numericId },
    raw: true,
  });

  for (const row of ipcRows) {
    const sourcePath = await findExistingSource(resolveIpcSourcePaths(row));
    if (!sourcePath) continue;

    const archiveName = `ipc-${row.id}-${safeBasename(row.name)}.gz`;
    const archivePath = path.join(archiveRoot, archiveName);
    try {
      await gzipCopy(sourcePath, archivePath);
      manifest.ipc_documents.push({
        id: row.id,
        name: row.name,
        archiveFile: archiveName,
        compressed: true,
        restoreDir: 'ipc',
      });
      await removeSourceIfExists(sourcePath);
    } catch (err) {
      console.error(`IPC archive failed for doc ${row.id}:`, err.message);
    }
  }

  const docRows = await db.models.document.findAll({
    where: { project_id: numericId },
    raw: true,
  });

  const linkedDocIds = (
    await db.models.document_link.findAll({
      where: { entity_type: 'project', entity_id: numericId },
      attributes: ['document_id'],
      raw: true,
    })
  )
    .map((row) => Number(row.document_id))
    .filter((id) => Number.isFinite(id));

  const linkedOnlyRows =
    linkedDocIds.length > 0
      ? await db.models.document.findAll({
          where: {
            id: linkedDocIds,
            project_id: { [Op.ne]: numericId },
          },
          raw: true,
        })
      : [];

  const docsToArchive = [...docRows];
  const seenDocIds = new Set(docRows.map((row) => row.id));
  for (const row of linkedOnlyRows) {
    if (!seenDocIds.has(row.id)) {
      docsToArchive.push(row);
      seenDocIds.add(row.id);
    }
  }

  for (const row of docsToArchive) {
    const sourcePath = resolveDocumentSourcePath(row);
    if (!sourcePath) continue;

    const archiveName = `doc-${row.id}-${safeBasename(row.name)}.gz`;
    const archivePath = path.join(archiveRoot, archiveName);
    try {
      await gzipCopy(sourcePath, archivePath);
      manifest.documents.push({
        id: row.id,
        name: row.name,
        location: row.location,
        archiveFile: archiveName,
        compressed: true,
        restoreDir: 'upload',
      });

      const otherRefs = row.id
        ? await db.models.document.count({
            where: {
              id: { [Op.ne]: row.id },
              [Op.or]: [
                row.location ? { location: row.location } : null,
                { name: row.name },
              ].filter(Boolean),
            },
          })
        : 0;

      if (otherRefs === 0) {
        await removeSourceIfExists(sourcePath);
      }
    } catch (err) {
      console.error(`Document archive failed for doc ${row.id}:`, err.message);
    }
  }

  if (!manifest.ipc_documents.length && !manifest.documents.length) {
    try {
      await fs.promises.rm(archiveRoot, { recursive: true, force: true });
    } catch {
      // ignore
    }
    return null;
  }

  const manifestPath = path.join(archiveRoot, 'manifest.json');
  await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  return {
    archiveKey,
    ipc_documents: manifest.ipc_documents,
    documents: manifest.documents,
  };
}

async function restoreProjectDeleteFiles(archivedFiles) {
  if (!archivedFiles?.archiveKey) return [];

  const archiveRoot = path.join(PROJECT_DELETE_ARCHIVE_DIR, archivedFiles.archiveKey);
  const restored = [];

  const restoreEntries = [
    ...(archivedFiles.ipc_documents || []).map((e) => ({ ...e, targetDir: IPC_UPLOAD_DIR })),
    ...(archivedFiles.documents || []).map((e) => ({ ...e, targetDir: UPLOAD_DIR })),
  ];

  for (const entry of restoreEntries) {
    const archivePath = path.join(archiveRoot, entry.archiveFile);
    const targetName = safeBasename(entry.name);
    if (!targetName) continue;

    const targetPath = path.join(entry.targetDir, targetName);
    try {
      await fs.promises.access(archivePath, fs.constants.R_OK);
      if (entry.compressed) {
        await gunzipCopy(archivePath, targetPath);
      } else {
        ensureDir(path.dirname(targetPath));
        await fs.promises.copyFile(archivePath, targetPath);
      }
      restored.push(targetName);
    } catch (err) {
      console.error(`File restore failed for ${targetName}:`, err.message);
    }
  }

  return restored;
}

/**
 * Archive one project document file before permanent delete (for history revert).
 */
async function archiveSingleProjectDocument(documentRow, projectId) {
  const numericProjectId = Number(projectId);
  const docId = Number(documentRow?.id);
  if (!Number.isFinite(numericProjectId) || !Number.isFinite(docId)) return null;

  const sourcePath = resolveDocumentSourcePath(documentRow);
  if (!sourcePath) return null;

  const archiveKey = `project-doc-${numericProjectId}-${docId}-${Date.now()}`;
  const archiveRoot = path.join(PROJECT_DELETE_ARCHIVE_DIR, archiveKey);
  ensureDir(archiveRoot);

  const archiveName = `doc-${docId}-${safeBasename(documentRow.name)}.gz`;
  const archivePath = path.join(archiveRoot, archiveName);

  try {
    await gzipCopy(sourcePath, archivePath);
    await removeSourceIfExists(sourcePath);
    return {
      archiveKey,
      name: documentRow.name,
      format: documentRow.format,
      location: documentRow.location,
      sourcePath,
      archiveFile: archiveName,
      compressed: true,
      restoreDir: 'upload',
    };
  } catch (err) {
    console.error(`Single document archive failed for doc ${docId}:`, err.message);
    return null;
  }
}

function buildDocumentRestoreTargetPath(archivedFile) {
  if (archivedFile?.sourcePath) {
    return path.resolve(String(archivedFile.sourcePath));
  }
  if (archivedFile?.location) {
    return path.resolve(String(archivedFile.location));
  }
  let fileName = String(archivedFile?.name || '').trim();
  if (fileName && !/\.\w+$/.test(fileName) && archivedFile?.format) {
    fileName = `${fileName}.${String(archivedFile.format).replace(/^\./, '')}`;
  }
  return path.join(UPLOAD_DIR, safeBasename(fileName || archivedFile?.name));
}

async function restoreArchivedDocumentFile(archivedFile) {
  if (!archivedFile?.archiveKey || !archivedFile?.archiveFile) return null;

  const archiveRoot = path.join(PROJECT_DELETE_ARCHIVE_DIR, archivedFile.archiveKey);
  const archivePath = path.join(archiveRoot, archivedFile.archiveFile);
  const targetPath = buildDocumentRestoreTargetPath(archivedFile);
  if (!targetPath) return null;

  try {
    await fs.promises.access(archivePath, fs.constants.R_OK);
    ensureDir(path.dirname(targetPath));
    if (archivedFile.compressed !== false) {
      await gunzipCopy(archivePath, targetPath);
    } else {
      await fs.promises.copyFile(archivePath, targetPath);
    }
    return targetPath;
  } catch (err) {
    console.error(`Single document file restore failed for ${archivedFile.name}:`, err.message);
    return null;
  }
}

module.exports = {
  archiveProjectDeleteFiles,
  restoreProjectDeleteFiles,
  archiveSingleProjectDocument,
  restoreArchivedDocumentFile,
  resolveDocumentSourcePath,
};
