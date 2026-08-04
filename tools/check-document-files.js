#!/usr/bin/env node
/**
 * Compare document repository DB rows against files on disk.
 *
 * Report (default — dry run, no changes):
 *   node tools/check-document-files.js
 *   node tools/check-document-files.js --orphans
 *   node tools/check-document-files.js --csv tools/document-missing-files.csv
 *
 * Clean orphans (files on disk with no DB row):
 *   node tools/check-document-files.js --remove-orphans              # dry-run
 *   node tools/check-document-files.js --remove-orphans --apply      # delete files
 *   node tools/check-document-files.js --move-orphans ./data/orphan-docs
 *   node tools/check-document-files.js --move-orphans ./data/orphan-docs --apply
 *
 * Clean missing (DB rows whose file is gone):
 *   node tools/check-document-files.js --remove-missing              # dry-run
 *   node tools/check-document-files.js --remove-missing --apply      # delete DB rows + links
 *
 * Both directions:
 *   node tools/check-document-files.js --remove-orphans --remove-missing --apply
 *   node tools/check-document-files.js --move-orphans /tmp/doc-orphans --remove-missing --apply
 *
 * Safety:
 *   - Default is dry-run. Nothing is deleted/moved unless --apply is set.
 *   - Orphan remove/move only touches files under UPLOAD_DIR.
 *   - --remove-missing also deletes document_link + document_share_item rows.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const REPO_ROOT = path.resolve(__dirname, '..');

function loadEnv() {
  const envPath = path.join(REPO_ROOT, '.env');
  if (!fs.existsSync(envPath)) {
    console.warn(`Warning: .env not found at ${envPath}`);
    return;
  }
  require('dotenv').config({ path: envPath });
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : null;
}

function resolveUploadDir() {
  const dataRoot = process.env.DATA_DIR
    ? path.isAbsolute(process.env.DATA_DIR)
      ? process.env.DATA_DIR
      : path.resolve(REPO_ROOT, process.env.DATA_DIR)
    : '/data';

  const raw = process.env.UPLOAD_DIR;
  if (raw) {
    return path.isAbsolute(raw) ? raw : path.resolve(REPO_ROOT, raw);
  }
  return path.join(dataRoot, 'uploads');
}

function candidatePaths(row, uploadDir) {
  const candidates = [];
  const location = (row.location || '').trim();
  const name = (row.name || '').trim();
  const format = (row.format || '').trim().replace(/^\./, '');

  if (location) {
    if (path.isAbsolute(location)) {
      candidates.push(location);
      candidates.push(path.join(uploadDir, path.basename(location)));
    } else {
      candidates.push(path.resolve(REPO_ROOT, location));
      candidates.push(path.join(uploadDir, location));
      candidates.push(path.join(uploadDir, path.basename(location)));
    }
  }

  if (name) {
    candidates.push(path.join(uploadDir, name));
    if (format && !/\.\w+$/.test(name)) {
      candidates.push(path.join(uploadDir, `${name}.${format}`));
    }
  }

  return [...new Set(candidates.filter(Boolean))];
}

function firstExisting(candidates) {
  for (const p of candidates) {
    try {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
    } catch {
      // ignore
    }
  }
  return null;
}

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue;
      walkFiles(full, out);
    } else if (ent.isFile()) {
      out.push(full);
    }
  }
  return out;
}

function csvEscape(value) {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function isInsideDir(filePath, dir) {
  const resolvedFile = path.resolve(filePath);
  const resolvedDir = path.resolve(dir);
  return resolvedFile === resolvedDir || resolvedFile.startsWith(resolvedDir + path.sep);
}

function uniqueDestPath(destDir, filePath, uploadDir) {
  const rel = path.relative(uploadDir, filePath);
  const safeRel = rel && !rel.startsWith('..') ? rel : path.basename(filePath);
  let dest = path.join(destDir, safeRel);
  if (!fs.existsSync(dest)) return dest;

  const ext = path.extname(dest);
  const base = dest.slice(0, dest.length - ext.length);
  let n = 1;
  while (fs.existsSync(`${base}__${n}${ext}`)) n += 1;
  return `${base}__${n}${ext}`;
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function printUsage() {
  console.log(`Usage:
  node tools/check-document-files.js [options]

Options:
  --orphans                     List orphan files on disk
  --remove-orphans              Delete orphan files (dry-run unless --apply)
  --move-orphans <dir>          Move orphan files to <dir> (dry-run unless --apply)
  --remove-missing              Delete DB rows for missing files (dry-run unless --apply)
  --apply                       Actually perform remove/move actions
  --csv <path>                  Write missing (+ orphans) CSV report
  --limit <n>                   Only check first N document rows
  --help                        Show this help
`);
}

async function deleteMissingDocuments(client, missing, apply) {
  if (!missing.length) {
    console.log('No missing DB rows to remove.');
    return { links: 0, shares: 0, docs: 0 };
  }

  const ids = missing.map((m) => m.id);
  console.log(
    `${apply ? 'APPLY' : 'DRY-RUN'} — remove ${ids.length} document row(s) with missing files`,
  );

  if (!apply) {
    for (const m of missing.slice(0, 50)) {
      console.log(`  would delete document #${m.id}  ${m.name}`);
    }
    if (missing.length > 50) console.log(`  ... and ${missing.length - 50} more`);
    return { links: 0, shares: 0, docs: 0 };
  }

  await client.query('BEGIN');
  try {
    const shareRes = await client.query(
      'DELETE FROM document_share_item WHERE document_id = ANY($1::int[]) RETURNING id',
      [ids],
    );
    const linkRes = await client.query(
      'DELETE FROM document_link WHERE document_id = ANY($1::int[]) RETURNING id',
      [ids],
    );
    const docRes = await client.query(
      'DELETE FROM document WHERE id = ANY($1::int[]) RETURNING id',
      [ids],
    );
    await client.query('COMMIT');
    console.log(
      `Deleted: ${docRes.rowCount} document(s), ${linkRes.rowCount} link(s), ${shareRes.rowCount} share item(s)`,
    );
    return {
      links: linkRes.rowCount,
      shares: shareRes.rowCount,
      docs: docRes.rowCount,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

function cleanOrphans(orphans, { uploadDir, moveDir, remove, apply }) {
  if (!orphans.length) {
    console.log('No orphan files to clean.');
    return { moved: 0, removed: 0, skipped: 0 };
  }

  const mode = moveDir ? 'move' : 'remove';
  console.log(
    `${apply ? 'APPLY' : 'DRY-RUN'} — ${mode} ${orphans.length} orphan file(s)` +
      (moveDir ? ` → ${moveDir}` : ''),
  );

  let moved = 0;
  let removed = 0;
  let skipped = 0;

  for (const filePath of orphans) {
    if (!isInsideDir(filePath, uploadDir)) {
      console.warn(`  SKIP (outside UPLOAD_DIR): ${filePath}`);
      skipped += 1;
      continue;
    }

    if (!apply) {
      if (moved + removed + skipped < 50) {
        console.log(
          moveDir
            ? `  would move ${filePath} → ${uniqueDestPath(moveDir, filePath, uploadDir)}`
            : `  would delete ${filePath}`,
        );
      }
      if (moveDir) moved += 1;
      else removed += 1;
      continue;
    }

    try {
      if (moveDir) {
        const dest = uniqueDestPath(moveDir, filePath, uploadDir);
        ensureParentDir(dest);
        fs.renameSync(filePath, dest);
        console.log(`  moved ${filePath} → ${dest}`);
        moved += 1;
      } else if (remove) {
        fs.unlinkSync(filePath);
        console.log(`  deleted ${filePath}`);
        removed += 1;
      }
    } catch (err) {
      console.error(`  FAILED ${filePath}: ${err.message}`);
      skipped += 1;
    }
  }

  if (!apply && orphans.length > 50) {
    console.log(`  ... and ${orphans.length - 50} more`);
  }

  console.log(
    `Orphan cleanup: moved=${moved}, removed=${removed}, skipped=${skipped}` +
      (apply ? '' : ' (dry-run)'),
  );
  return { moved, removed, skipped };
}

async function main() {
  loadEnv();

  if (hasFlag('--help') || hasFlag('-h')) {
    printUsage();
    process.exit(0);
  }

  const uploadDir = resolveUploadDir();
  const apply = hasFlag('--apply');
  const removeOrphans = hasFlag('--remove-orphans');
  const moveOrphansTo = argValue('--move-orphans');
  const removeMissing = hasFlag('--remove-missing');
  const csvPath = argValue('--csv');
  const limit = Number(argValue('--limit') || 0) || null;

  if (removeOrphans && moveOrphansTo) {
    console.error('Choose one: --remove-orphans OR --move-orphans <dir>, not both.');
    process.exit(1);
  }

  const wantOrphans =
    hasFlag('--orphans') || removeOrphans || Boolean(moveOrphansTo) || Boolean(csvPath);

  if ((removeOrphans || moveOrphansTo || removeMissing) && !apply) {
    console.log('Dry-run mode (no changes). Re-run with --apply to commit.\n');
  }

  const db = {
    host: process.env.VUE_APP_DB_HOST || 'localhost',
    port: Number(process.env.VUE_APP_DB_PORT || 5432),
    user: process.env.VUE_APP_USER || 'postgres',
    password: process.env.VUE_APP_PASSWORD || '',
    database: process.env.VUE_APP_DB || 'kisip',
  };

  console.log('Document file check');
  console.log(`  DB: ${db.user}@${db.host}:${db.port}/${db.database}`);
  console.log(`  UPLOAD_DIR: ${uploadDir}`);
  console.log(`  exists: ${fs.existsSync(uploadDir)}`);
  console.log(`  apply: ${apply}`);
  console.log('');

  const client = new Client(db);
  await client.connect();

  let sql = `
    SELECT id, name, format, size, location, code, category,
           project_id, settlement_id, report_id, "createdAt"
    FROM document
    ORDER BY id
  `;
  if (limit) sql += ` LIMIT ${limit}`;

  const { rows } = await client.query(sql);

  const missing = [];
  const emptyLocation = [];
  const ok = [];
  const claimedPaths = new Set();

  for (const row of rows) {
    const candidates = candidatePaths(row, uploadDir);
    const found = firstExisting(candidates);

    if (!row.location || !String(row.location).trim()) {
      emptyLocation.push(row);
    }

    if (found) {
      ok.push({ ...row, resolved: found });
      claimedPaths.add(path.resolve(found));
      for (const c of candidates) claimedPaths.add(path.resolve(c));
    } else {
      missing.push({
        id: row.id,
        name: row.name,
        format: row.format,
        size: row.size,
        location: row.location,
        code: row.code,
        category: row.category,
        project_id: row.project_id,
        settlement_id: row.settlement_id,
        report_id: row.report_id,
        createdAt: row.createdAt,
        tried: candidates,
      });
    }
  }

  console.log('Summary');
  console.log(`  documents in DB:     ${rows.length}`);
  console.log(`  files found:         ${ok.length}`);
  console.log(`  MISSING files:       ${missing.length}`);
  console.log(`  empty location col:  ${emptyLocation.length}`);
  console.log('');

  if (missing.length) {
    console.log('Missing files (DB record, no file on disk)');
    console.log('-'.repeat(80));
    for (const m of missing.slice(0, 200)) {
      console.log(
        `#${m.id}  ${m.name}  | location=${m.location || '(empty)'}  | format=${m.format || '-'}`,
      );
      if (m.tried.length) {
        console.log(`         tried: ${m.tried[0]}`);
        for (const t of m.tried.slice(1, 3)) console.log(`                ${t}`);
      }
    }
    if (missing.length > 200) console.log(`  ... and ${missing.length - 200} more`);
    console.log('');
  }

  let orphans = [];
  if (wantOrphans) {
    if (!fs.existsSync(uploadDir)) {
      console.warn(`Cannot scan orphans — UPLOAD_DIR missing: ${uploadDir}`);
    } else {
      const files = walkFiles(uploadDir);
      orphans = files.filter((f) => !claimedPaths.has(path.resolve(f)));
      console.log(`Orphan files on disk (no DB match): ${orphans.length}`);
      console.log('-'.repeat(80));
      for (const f of orphans.slice(0, 200)) console.log(`  ${f}`);
      if (orphans.length > 200) console.log(`  ... and ${orphans.length - 200} more`);
      console.log('');
    }
  }

  if (csvPath) {
    const out = path.isAbsolute(csvPath) ? csvPath : path.resolve(REPO_ROOT, csvPath);
    const header = [
      'id',
      'name',
      'format',
      'size',
      'location',
      'code',
      'category',
      'project_id',
      'settlement_id',
      'report_id',
      'createdAt',
      'tried_paths',
    ];
    const lines = [header.join(',')];
    for (const m of missing) {
      lines.push(
        [
          m.id,
          m.name,
          m.format,
          m.size,
          m.location,
          m.code,
          m.category,
          m.project_id,
          m.settlement_id,
          m.report_id,
          m.createdAt,
          (m.tried || []).join(' | '),
        ]
          .map(csvEscape)
          .join(','),
      );
    }
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, lines.join('\n') + '\n', 'utf8');
    console.log(`Wrote missing list: ${out}`);

    if (orphans.length) {
      const orphanOut = out.replace(/(\.csv)?$/i, '-orphans.csv');
      fs.writeFileSync(
        orphanOut,
        ['path', ...orphans.map(csvEscape)].join('\n') + '\n',
        'utf8',
      );
      console.log(`Wrote orphan list: ${orphanOut}`);
    }
  }

  // Cleanup actions
  if (removeMissing) {
    console.log('');
    await deleteMissingDocuments(client, missing, apply);
  }

  if (removeOrphans || moveOrphansTo) {
    console.log('');
    if (moveOrphansTo) {
      const moveDir = path.isAbsolute(moveOrphansTo)
        ? moveOrphansTo
        : path.resolve(process.cwd(), moveOrphansTo);
      if (isInsideDir(moveDir, uploadDir)) {
        console.error(
          `Refusing to move orphans into UPLOAD_DIR itself (${moveDir}). Pick a folder outside uploads.`,
        );
        await client.end();
        process.exit(1);
      }
      if (apply) fs.mkdirSync(moveDir, { recursive: true });
      cleanOrphans(orphans, { uploadDir, moveDir, remove: false, apply });
    } else {
      cleanOrphans(orphans, { uploadDir, moveDir: null, remove: true, apply });
    }
  }

  await client.end();

  if ((removeOrphans || moveOrphansTo || removeMissing) && !apply) {
    console.log('\nDry-run only. Add --apply to perform changes.');
  }

  process.exit(missing.length || orphans.length ? 2 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
