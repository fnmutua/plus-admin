const ACRONYM_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeParentId(parentId) {
  if (parentId == null || parentId === '') return null;
  const parsed = Number(parentId);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeAcronym(acronym) {
  return normalizeText(acronym).toLowerCase();
}

function siblingKey(parentId) {
  return parentId == null ? 'root' : String(parentId);
}

function buildPathSegments(record, byId) {
  const segments = [];
  const visited = new Set();
  let node = record;

  while (node) {
    const acronym = normalizeAcronym(node.acronym);
    if (!acronym) return { segments: null, brokenLink: true };

    segments.unshift(acronym);

    const parentId = normalizeParentId(node.parentId);
    if (parentId == null) break;

    if (visited.has(parentId)) {
      return { segments: null, brokenLink: true };
    }
    visited.add(parentId);

    node = byId.get(parentId);
    if (!node) {
      return { segments: null, brokenLink: true };
    }
  }

  return { segments, brokenLink: false };
}

function getDescendantIds(programmeId, allRows) {
  const childrenByParent = new Map();
  allRows.forEach((row) => {
    const id = Number(row.id);
    const parentId = normalizeParentId(row.parentId);
    if (parentId == null || Number.isNaN(id)) return;
    if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
    childrenByParent.get(parentId).push(id);
  });

  const descendants = new Set();
  const stack = [...(childrenByParent.get(programmeId) || [])];
  while (stack.length) {
    const id = stack.pop();
    if (descendants.has(id)) continue;
    descendants.add(id);
    stack.push(...(childrenByParent.get(id) || []));
  }

  return descendants;
}

async function loadProgrammeRows(db) {
  const rows = await db.models.programme.findAll({
    attributes: ['id', 'title', 'acronym', 'parentId'],
    raw: true,
  });
  return rows.map((row) => ({
    id: Number(row.id),
    title: row.title,
    acronym: row.acronym,
    parentId: normalizeParentId(row.parentId),
  }));
}

async function validateProgrammeRecord(db, payload, options = {}) {
  const excludeId = options.excludeId != null ? Number(options.excludeId) : null;
  const title = normalizeText(payload.title);
  const acronym = normalizeText(payload.acronym);
  const icon = normalizeText(payload.icon);
  const description = normalizeText(payload.description);
  const parentId = normalizeParentId(payload.parentId);
  const normalizedAcronym = normalizeAcronym(acronym);

  if (!title) {
    return { error: 'Title is required' };
  }
  if (!acronym) {
    return { error: 'Acronym is required' };
  }
  if (!ACRONYM_PATTERN.test(acronym)) {
    return {
      error:
        'Acronym must be a valid URL segment (letters, numbers, hyphens; no spaces)',
    };
  }
  if (!icon) {
    return { error: 'Icon is required' };
  }
  if (!description) {
    return { error: 'Description is required' };
  }
  if (excludeId != null && parentId === excludeId) {
    return { error: 'A programme cannot be its own parent' };
  }

  const allRows = await loadProgrammeRows(db);
  const byId = new Map(allRows.map((row) => [row.id, row]));

  if (parentId != null) {
    const parent = byId.get(parentId);
    if (!parent) {
      return { error: 'Selected parent programme does not exist' };
    }

    if (title.toLowerCase() === normalizeText(parent.title).toLowerCase()) {
      return {
        error:
          'Title cannot match the parent programme title (this breaks route path generation)',
      };
    }

    if (normalizedAcronym === normalizeAcronym(parent.acronym)) {
      return {
        error:
          'Acronym cannot match the parent programme acronym (this breaks route path generation)',
      };
    }

    if (excludeId != null) {
      const descendants = getDescendantIds(excludeId, allRows);
      if (descendants.has(parentId)) {
        return {
          error: 'Cannot set parent to a sub-programme of this record (circular reference)',
        };
      }
    }
  }

  for (const row of allRows) {
    if (excludeId != null && row.id === excludeId) continue;
    if (siblingKey(row.parentId) !== siblingKey(parentId)) continue;

    if (normalizeText(row.title).toLowerCase() === title.toLowerCase()) {
      return {
        error: 'Another programme under the same parent already uses this title',
      };
    }

    if (normalizeAcronym(row.acronym) === normalizedAcronym) {
      return {
        error: 'Another programme under the same parent already uses this acronym',
      };
    }
  }

  const candidate = {
    id: excludeId,
    title,
    acronym: normalizedAcronym,
    parentId,
  };

  const candidatePath = buildPathSegments(candidate, byId);
  if (candidatePath.brokenLink || !candidatePath.segments) {
    return { error: 'Invalid parent link — parent chain is broken or circular' };
  }
  const candidateRoute = candidatePath.segments.join('/');

  for (const row of allRows) {
    if (excludeId != null && row.id === excludeId) continue;

    const rowPath = buildPathSegments(row, byId);
    if (rowPath.brokenLink || !rowPath.segments) continue;

    if (rowPath.segments.join('/') === candidateRoute) {
      return {
        error: `Route path "/subprogrammes/${candidateRoute}" is already used by another programme`,
      };
    }
  }

  return {
    normalized: {
      title,
      acronym: normalizedAcronym,
      icon,
      description,
      parentId,
    },
  };
}

function deriveRootProgrammeId(programmeId, allRows) {
  if (programmeId == null || programmeId === '') return null;
  const parsedId = Number(programmeId);
  const byId = new Map(allRows.map((row) => [row.id, row]));
  let current = byId.get(parsedId);
  if (!current) return parsedId;

  while (current.parentId != null) {
    const parent = byId.get(current.parentId);
    if (!parent) break;
    current = parent;
  }

  return current.id;
}

function formatProgrammeLabel(row) {
  const acronym = String(row.acronym || '').trim();
  const title = String(row.title || '').trim();
  if (acronym && title && acronym.toLowerCase() !== title.toLowerCase()) {
    return `${acronym} — ${title}`;
  }
  return acronym || title || 'Programme';
}

/** Root programmes that have at least one sub-programme (high-level parents only). */
function buildRootProgrammesWithChildrenOptions(allRows) {
  const parentsWithChildren = new Set();
  allRows.forEach((row) => {
    const parentId = normalizeParentId(row.parentId);
    if (parentId != null) parentsWithChildren.add(parentId);
  });

  return allRows
    .filter((row) => normalizeParentId(row.parentId) == null && parentsWithChildren.has(row.id))
    .map((row) => ({
      label: formatProgrammeLabel(row),
      value: row.id,
      acronym: row.acronym || null,
      title: row.title || null,
    }))
    .sort((a, b) => String(a.label).localeCompare(String(b.label)));
}

module.exports = {
  validateProgrammeRecord,
  loadProgrammeRows,
  normalizeParentId,
  normalizeAcronym,
  getDescendantIds,
  deriveRootProgrammeId,
  buildRootProgrammesWithChildrenOptions,
};
