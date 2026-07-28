const fs = require('fs');
const path = require('path');
const multer = require('multer');
const shortid = require('shortid');
const db = require('../models');
const { IPC_UPLOAD_DIR, UPLOAD_DIR, ensureDir } = require('../config/paths.config');

const uploadDir = IPC_UPLOAD_DIR;

if (!fs.existsSync(uploadDir)) {
  ensureDir(uploadDir);
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename(_req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
});

function unlinkIfExists(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error('Failed to delete IPC file:', filePath, err);
  }
}

/** Remove uploaded files for ipc_document rows (best-effort). */
exports.deleteIpcDocumentsFromDisk = (rows) => {
  if (!Array.isArray(rows)) return;
  for (const row of rows) {
    const safeName = path.basename(String(row?.name ?? '').trim());
    if (!safeName) continue;
    unlinkIfExists(path.join(uploadDir, safeName));
    unlinkIfExists(path.join(UPLOAD_DIR, safeName));
  }
};

exports.uploadIpcDocument = (req, res) => {
  upload.array('files')(req, res, async (err) => {
    if (err) {
      console.error('IPC upload multer error:', err);
      return res.status(500).send({ message: 'Upload failed.', code: '0000' });
    }

    const regModel = 'ipc_document';
    let myFiles = req.files;
    const objs = [];

    if (!myFiles || myFiles.length === 0) {
      return res.status(400).send({ message: 'No files received.', code: '0000' });
    }

    if (!Array.isArray(myFiles)) {
      myFiles = [myFiles];
    }

    for (let i = 0; i < myFiles.length; i++) {
      const obj = {};
      if (myFiles.length > 1) {
        obj.disbursement_id = req.body.disbursement_id[i];
        obj.project_id = req.body.project_id[i];
        obj.format = req.body.format[i];
        obj.size = req.body.size[i];
        obj.protected_file = req.body.protected_file[i];
        obj.type = (req.body.type && Array.isArray(req.body.type))
          ? (req.body.type[i] || 'Supporting Document')
          : (req.body.type || 'Supporting Document');
        obj.createdBy = req.body.createdBy?.[i] || req.body.createdBy || null;
      } else {
        obj.disbursement_id = req.body.disbursement_id;
        obj.project_id = req.body.project_id;
        obj.format = req.body.format;
        obj.size = req.body.size;
        obj.protected_file = req.body.protected_file;
        obj.type = req.body.type || 'Supporting Document';
        obj.createdBy = req.body.createdBy || null;
      }
      obj.name = myFiles[i].originalname;
      obj.code = shortid.generate();
      objs.push(obj);
    }

    try {
      for (const nobj of objs) {
        await db.models[regModel].create(nobj);
      }
      return res.status(200).send({ message: 'Batch Upload Successful', code: '0000' });
    } catch (error) {
      console.error('IPC document upload error:', error);
      const isDuplicateDoc =
        error &&
        (error.name === 'SequelizeUniqueConstraintError' ||
          error.parent?.code === '23505' ||
          error.original?.code === '23505') &&
        (error.parent?.constraint === 'ipc_document_name_disbursement_id' ||
          error.original?.constraint === 'ipc_document_name_disbursement_id');

      if (isDuplicateDoc) {
        const duplicateName = error.fields?.name || 'this file';
        return res.status(409).send({
          message: `Upload failed: ${duplicateName} already exists for this IPC. Rename the file or remove the existing one first.`,
          code: 'DUPLICATE_IPC_DOCUMENT',
        });
      }

      return res.status(500).send({
        message: `Upload failed: ${error?.message || 'Unknown upload error'}`,
        code: 'UPLOAD_FAILED',
      });
    }
  });
};

exports.downloadFile = async (req, res) => {
  const filenamesToTry = [];
  const addName = (n) => {
    const safe = path.basename(String(n ?? '').trim());
    if (safe && !filenamesToTry.includes(safe)) filenamesToTry.push(safe);
  };

  if (req.body.filename) addName(req.body.filename);

  if (req.body.doc_id != null && req.body.doc_id !== '') {
    try {
      const doc = await db.models.ipc_document.findByPk(Number(req.body.doc_id));
      if (doc) {
        addName(doc.name);
        if (doc.code) addName(doc.code);
        if (doc.location) addName(doc.location);
        const fmt = doc.format ? String(doc.format).trim().replace(/^\./, '') : '';
        if (fmt && doc.name && !String(doc.name).includes('.')) {
          addName(`${doc.name}.${fmt}`);
        }
      }
    } catch (e) {
      console.error('ipc_document lookup in downloadFile', e);
    }
  }

  if (filenamesToTry.length === 0) {
    return res.status(404).send({ message: 'File not found.', code: '0000' });
  }

  const trySendFile = (fileIndex, pathIndex) => {
    if (fileIndex >= filenamesToTry.length) {
      return res.status(404).send({ message: 'File not found.', code: '0000' });
    }

    const safeName = filenamesToTry[fileIndex];
    const primaryPath = path.join(uploadDir, safeName);
    const uploadFallbackPath = path.join(UPLOAD_DIR, safeName);
    const uniquePaths = [primaryPath, uploadFallbackPath].filter(
      (p, i, arr) => arr.findIndex((x) => path.normalize(x) === path.normalize(p)) === i,
    );

    if (pathIndex >= uniquePaths.length) {
      return trySendFile(fileIndex + 1, 0);
    }

    const uploadedFile = uniquePaths[pathIndex];
    fs.access(uploadedFile, fs.constants.F_OK, (accessErr) => {
      if (accessErr) {
        return trySendFile(fileIndex, pathIndex + 1);
      }
      res.sendFile(path.resolve(uploadedFile), (sendErr) => {
        if (sendErr) {
          console.error(sendErr);
          res.status(500).send({ message: 'Download failed. Error occurred.', code: '0000' });
        }
      });
    });
  };

  trySendFile(0, 0);
};
