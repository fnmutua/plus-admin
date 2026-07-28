import {
  buildProgrammeTree,
  getProgrammeDescendantIds,
  normalizeParentId,
  type ProgrammeRecord,
} from './programmeValidation'

export interface ComponentRecord {
  id?: number | null
  title?: string | null
  acronym?: string | null
  icon?: string | null
  programme_id?: number | null
  domain_id?: number | null
  domain?: { title?: string | null } | null
  programme?: { title?: string | null } | null
}

export type ProgrammeComponentNodeType = 'programme' | 'component' | 'orphan-group'

export interface ProgrammeComponentTreeNode {
  rowKey: string
  nodeType: ProgrammeComponentNodeType
  id?: number
  title: string
  acronym?: string
  icon?: string
  domainTitle?: string
  programme_id?: number
  domain_id?: number
  children?: ProgrammeComponentTreeNode[]
}

function mapComponentNode(component: ComponentRecord): ProgrammeComponentTreeNode {
  return {
    rowKey: `component-${component.id}`,
    nodeType: 'component',
    id: Number(component.id),
    title: String(component.title || ''),
    acronym: component.acronym ? String(component.acronym) : undefined,
    icon: component.icon ? String(component.icon) : undefined,
    domainTitle: component.domain?.title ? String(component.domain.title) : undefined,
    programme_id:
      component.programme_id != null ? Number(component.programme_id) : undefined,
    domain_id: component.domain_id != null ? Number(component.domain_id) : undefined,
  }
}

export function buildProgrammeComponentTree(
  programmes: ProgrammeRecord[],
  components: ComponentRecord[]
): ProgrammeComponentTreeNode[] {
  const programmeTree = buildProgrammeTree(programmes)
  const componentsByProgramme = new Map<number, ComponentRecord[]>()
  const orphanComponents: ComponentRecord[] = []

  components.forEach((component) => {
    const programmeId = Number(component.programme_id)
    if (Number.isNaN(programmeId)) {
      orphanComponents.push(component)
      return
    }
    if (!componentsByProgramme.has(programmeId)) {
      componentsByProgramme.set(programmeId, [])
    }
    componentsByProgramme.get(programmeId)!.push(component)
  })

  const mapProgrammeNode = (node: ProgrammeRecord): ProgrammeComponentTreeNode => {
    const programmeId = Number(node.id)
    const subProgrammes = (node.children || []).map(mapProgrammeNode)
    const componentNodes = (componentsByProgramme.get(programmeId) || [])
      .sort((a, b) => String(a.title).localeCompare(String(b.title)))
      .map(mapComponentNode)

    const children = [...subProgrammes, ...componentNodes]

    return {
      rowKey: `programme-${programmeId}`,
      nodeType: 'programme',
      id: programmeId,
      title: String(node.title || ''),
      acronym: node.acronym ? String(node.acronym) : undefined,
      icon: node.icon ? String(node.icon) : undefined,
      children: children.length ? children : undefined,
    }
  }

  const roots = programmeTree
    .sort((a, b) => String(a.title).localeCompare(String(b.title)))
    .map(mapProgrammeNode)

  if (orphanComponents.length) {
    roots.push({
      rowKey: 'orphan-components',
      nodeType: 'orphan-group',
      title: 'Unassigned components',
      children: orphanComponents
        .sort((a, b) => String(a.title).localeCompare(String(b.title)))
        .map(mapComponentNode),
    })
  }

  return roots
}

export function filterProgrammeComponentTree(
  tree: ProgrammeComponentTreeNode[],
  programmeIds: number[],
  allProgrammes: ProgrammeRecord[]
): ProgrammeComponentTreeNode[] {
  if (!programmeIds.length) return tree

  const allowed = new Set<number>()
  programmeIds.forEach((id) => {
    allowed.add(id)
    getProgrammeDescendantIds(id, allProgrammes).forEach((childId) => allowed.add(childId))
  })

  const filterNodes = (nodes: ProgrammeComponentTreeNode[]): ProgrammeComponentTreeNode[] => {
    const result: ProgrammeComponentTreeNode[] = []

    nodes.forEach((node) => {
      if (node.nodeType === 'orphan-group') return

      if (node.nodeType === 'component') {
        if (node.programme_id != null && allowed.has(node.programme_id)) {
          result.push(node)
        }
        return
      }

      const filteredChildren = node.children ? filterNodes(node.children) : []
      const includeProgramme = node.id != null && allowed.has(node.id)

      if (includeProgramme || filteredChildren.length) {
        result.push({
          ...node,
          children: filteredChildren.length ? filteredChildren : undefined,
        })
      }
    })

    return result
  }

  return filterNodes(tree)
}

export function flattenProgrammeComponentTree(
  nodes: ProgrammeComponentTreeNode[]
): ProgrammeComponentTreeNode[] {
  const rows: ProgrammeComponentTreeNode[] = []

  const walk = (items: ProgrammeComponentTreeNode[]) => {
    items.forEach((item) => {
      const { children, ...rest } = item
      rows.push(rest)
      if (children?.length) walk(children)
    })
  }

  walk(nodes)
  return rows
}

export function countComponentTreeNodes(nodes: ProgrammeComponentTreeNode[]) {
  let programmes = 0
  let components = 0

  const walk = (items: ProgrammeComponentTreeNode[]) => {
    items.forEach((item) => {
      if (item.nodeType === 'programme') programmes += 1
      if (item.nodeType === 'component') components += 1
      if (item.children?.length) walk(item.children)
    })
  }

  walk(nodes)
  return { programmes, components }
}

export function buildProgrammeSelectOptions(programmes: ProgrammeRecord[]) {
  const tree = buildProgrammeTree(programmes)
  const options: { value: number; label: string }[] = []

  const walk = (nodes: ProgrammeRecord[], depth = 0) => {
    nodes.forEach((node) => {
      const prefix = depth > 0 ? `${'— '.repeat(depth)}` : ''
      options.push({
        value: Number(node.id),
        label: `${prefix}${node.title}`,
      })
      if (node.children?.length) walk(node.children, depth + 1)
    })
  }

  walk(tree)
  return options
}

export interface ComponentTableRow {
  id: number
  title: string
  acronym?: string
  pathLabel: string
  domainTitle?: string
  icon?: string
  programme_id?: number
  domain_id?: number
}

function getProgrammeTitlePath(
  programmeId: number,
  byId: Map<number, ProgrammeRecord>
): string[] {
  const titles: string[] = []
  const visited = new Set<number>()
  let current = byId.get(programmeId)

  while (current) {
    const id = Number(current.id)
    if (visited.has(id)) break
    visited.add(id)
    titles.unshift(String(current.title || current.acronym || id))
    const parentId = normalizeParentId(current.parentId)
    current = parentId != null ? byId.get(parentId) : undefined
  }

  return titles
}

export function buildComponentTableRows(
  programmes: ProgrammeRecord[],
  components: ComponentRecord[]
): ComponentTableRow[] {
  const byId = new Map<number, ProgrammeRecord>()
  programmes.forEach((programme) => {
    const id = Number(programme.id)
    if (!Number.isNaN(id)) byId.set(id, programme)
  })

  return components
    .map((component) => {
      const title = String(component.title || '')
      const programmeId = Number(component.programme_id)
      const programmePath = !Number.isNaN(programmeId)
        ? getProgrammeTitlePath(programmeId, byId)
        : ['Unassigned']

      return {
        id: Number(component.id),
        title,
        acronym: component.acronym ? String(component.acronym) : undefined,
        pathLabel: [...programmePath, title].join(' > '),
        domainTitle: component.domain?.title ? String(component.domain.title) : undefined,
        icon: component.icon ? String(component.icon) : undefined,
        programme_id:
          component.programme_id != null ? Number(component.programme_id) : undefined,
        domain_id: component.domain_id != null ? Number(component.domain_id) : undefined,
      }
    })
    .filter((row) => !Number.isNaN(row.id))
    .sort((a, b) => {
      const pathCompare = a.pathLabel.localeCompare(b.pathLabel)
      if (pathCompare !== 0) return pathCompare
      return a.title.localeCompare(b.title)
    })
}

export function filterComponentTableRows(
  rows: ComponentTableRow[],
  keyword: string
): ComponentTableRow[] {
  const query = keyword.trim().toLowerCase()
  if (!query) return rows

  return rows.filter((row) => {
    const haystack = [row.pathLabel, row.title, row.acronym]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })
}
