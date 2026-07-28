export interface ProgrammeRecord {
  id?: number | null
  title?: string | null
  acronym?: string | null
  icon?: string | null
  description?: string | null
  parentId?: number | null | string
}

const ACRONYM_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/

function normalizeText(value: unknown): string {
  return String(value ?? '').trim()
}

export function normalizeParentId(parentId: unknown): number | null {
  if (parentId == null || parentId === '') return null
  const parsed = Number(parentId)
  return Number.isNaN(parsed) ? null : parsed
}

function normalizeAcronym(acronym: unknown): string {
  return normalizeText(acronym).toLowerCase()
}

function siblingKey(parentId: number | null): string {
  return parentId == null ? 'root' : String(parentId)
}

function buildPathSegments(record: ProgrammeRecord, byId: Map<number, ProgrammeRecord>) {
  const segments: string[] = []
  const visited = new Set<number>()
  let node: ProgrammeRecord | undefined = record

  while (node) {
    const acronym = normalizeAcronym(node.acronym)
    if (!acronym) return { segments: null as string[] | null, brokenLink: true }

    segments.unshift(acronym)

    const parentId = normalizeParentId(node.parentId)
    if (parentId == null) break

    if (visited.has(parentId)) {
      return { segments: null, brokenLink: true }
    }
    visited.add(parentId)

    node = byId.get(parentId)
    if (!node) {
      return { segments: null, brokenLink: true }
    }
  }

  return { segments, brokenLink: false }
}

export function buildProgrammeTree(flatRows: ProgrammeRecord[]): ProgrammeRecord[] {
  const byId = new Map<number, ProgrammeRecord & { children: ProgrammeRecord[] }>()

  flatRows.forEach((row) => {
    const id = Number(row.id)
    if (Number.isNaN(id)) return
    const { children: _children, parent: _parent, ...rest } = row as ProgrammeRecord & {
      children?: ProgrammeRecord[]
      parent?: ProgrammeRecord
    }
    byId.set(id, { ...rest, children: [] })
  })

  const roots: (ProgrammeRecord & { children: ProgrammeRecord[] })[] = []

  byId.forEach((item) => {
    const parentId = normalizeParentId(item.parentId)
    if (parentId != null && byId.has(parentId) && parentId !== Number(item.id)) {
      byId.get(parentId)!.children.push(item)
    } else {
      roots.push(item)
    }
  })

  const pruneEmptyChildren = (nodes: ProgrammeRecord[]) => {
    nodes.forEach((node) => {
      if (node.children?.length) {
        pruneEmptyChildren(node.children)
      } else {
        delete node.children
      }
    })
  }
  pruneEmptyChildren(roots)

  return roots
}

export function flattenProgrammeTree(nodes: ProgrammeRecord[]): ProgrammeRecord[] {
  const rows: ProgrammeRecord[] = []

  const walk = (items: ProgrammeRecord[]) => {
    items.forEach((item) => {
      const { children, ...rest } = item
      rows.push(rest)
      if (children?.length) walk(children)
    })
  }

  walk(nodes)
  return rows
}

export function getProgrammeDescendantIds(
  programmeId: number,
  allProgrammes: ProgrammeRecord[]
): Set<number> {
  const childrenByParent = new Map<number, number[]>()

  allProgrammes.forEach((row) => {
    const id = Number(row.id)
    const parentId = normalizeParentId(row.parentId)
    if (parentId == null || Number.isNaN(id)) return
    if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, [])
    childrenByParent.get(parentId)!.push(id)
  })

  const descendants = new Set<number>()
  const stack = [...(childrenByParent.get(programmeId) || [])]

  while (stack.length) {
    const id = stack.pop()!
    if (descendants.has(id)) continue
    descendants.add(id)
    stack.push(...(childrenByParent.get(id) || []))
  }

  return descendants
}

export function validateProgramme(
  payload: ProgrammeRecord,
  allProgrammes: ProgrammeRecord[],
  options?: { excludeId?: number | null }
): string | null {
  const excludeId = options?.excludeId != null ? Number(options.excludeId) : null
  const title = normalizeText(payload.title)
  const acronym = normalizeText(payload.acronym)
  const icon = normalizeText(payload.icon)
  const description = normalizeText(payload.description)
  const parentId = normalizeParentId(payload.parentId)
  const normalizedAcronym = normalizeAcronym(acronym)

  if (!title) return 'Title is required'
  if (!acronym) return 'Acronym is required'
  if (!ACRONYM_PATTERN.test(acronym)) {
    return 'Acronym must be a valid URL segment (letters, numbers, hyphens; no spaces)'
  }
  if (!icon) return 'Icon is required'
  if (!description) return 'Description is required'
  if (excludeId != null && parentId === excludeId) {
    return 'A programme cannot be its own parent'
  }

  const rows = allProgrammes.map((row) => ({
    ...row,
    id: Number(row.id),
    parentId: normalizeParentId(row.parentId),
  }))
  const byId = new Map(rows.map((row) => [Number(row.id), row]))

  if (parentId != null) {
    const parent = byId.get(parentId)
    if (!parent) return 'Selected parent programme does not exist'

    if (title.toLowerCase() === normalizeText(parent.title).toLowerCase()) {
      return 'Title cannot match the parent programme title (this breaks route path generation)'
    }

    if (normalizedAcronym === normalizeAcronym(parent.acronym)) {
      return 'Acronym cannot match the parent programme acronym (this breaks route path generation)'
    }

    if (excludeId != null) {
      const descendants = getProgrammeDescendantIds(excludeId, rows)
      if (descendants.has(parentId)) {
        return 'Cannot set parent to a sub-programme of this record (circular reference)'
      }
    }
  }

  for (const row of rows) {
    if (excludeId != null && row.id === excludeId) continue
    if (siblingKey(row.parentId ?? null) !== siblingKey(parentId)) continue

    if (normalizeText(row.title).toLowerCase() === title.toLowerCase()) {
      return 'Another programme under the same parent already uses this title'
    }

    if (normalizeAcronym(row.acronym) === normalizedAcronym) {
      return 'Another programme under the same parent already uses this acronym'
    }
  }

  const candidate: ProgrammeRecord = {
    id: excludeId ?? undefined,
    title,
    acronym: normalizedAcronym,
    parentId,
  }

  const candidatePath = buildPathSegments(candidate, byId)
  if (candidatePath.brokenLink || !candidatePath.segments) {
    return 'Invalid parent link — parent chain is broken or circular'
  }

  const candidateRoute = candidatePath.segments.join('/')

  for (const row of rows) {
    if (excludeId != null && row.id === excludeId) continue

    const rowPath = buildPathSegments(row, byId)
    if (rowPath.brokenLink || !rowPath.segments) continue

    if (rowPath.segments.join('/') === candidateRoute) {
      return `Route path "/subprogrammes/${candidateRoute}" is already used by another programme`
    }
  }

  return null
}
