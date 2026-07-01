const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../../..');

function resolveStoragePath(value, defaultPath) {
  if (value) {
    return path.isAbsolute(value) ? value : path.resolve(repoRoot, value);
  }
  return defaultPath;
}

const DATA_ROOT = resolveStoragePath(process.env.DATA_DIR, '/data');
const UPLOAD_DIR = resolveStoragePath(
  process.env.UPLOAD_DIR,
  path.join(DATA_ROOT, 'uploads')
);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

module.exports = {
  repoRoot,
  DATA_ROOT,
  UPLOAD_DIR,
  GRIEVANCE_UPLOAD_DIR: resolveStoragePath(
    process.env.GRIEVANCE_UPLOAD_DIR,
    path.join(DATA_ROOT, 'grievances')
  ),
  INCIDENT_UPLOAD_DIR: resolveStoragePath(
    process.env.INCIDENT_UPLOAD_DIR,
    path.join(DATA_ROOT, 'incidents')
  ),
  IMAGERY_DIR: resolveStoragePath(
    process.env.IMAGERY_DIR,
    path.join(DATA_ROOT, 'imagery')
  ),
  DATA_REQUEST_UPLOAD_DIR: resolveStoragePath(
    process.env.DATA_REQUEST_UPLOAD_DIR,
    path.join(DATA_ROOT, 'data-requests')
  ),
  ensureDir,
};
