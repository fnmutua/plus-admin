export type TableSortOrder = 'ascending' | 'descending' | null

export function compareTableValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1

  if (typeof a === 'number' && typeof b === 'number') {
    return a - b
  }

  return String(a).localeCompare(String(b), undefined, { sensitivity: 'base' })
}

export function sortFlatRows<T extends Record<string, unknown>>(
  rows: T[],
  prop: string,
  order: TableSortOrder
): T[] {
  if (!order || !prop) return rows

  const sorted = [...rows].sort((a, b) => compareTableValues(a[prop], b[prop]))
  return order === 'descending' ? sorted.reverse() : sorted
}

export function sortTreeRows<T extends Record<string, unknown>>(
  nodes: T[],
  prop: string,
  order: TableSortOrder,
  childrenKey = 'children'
): T[] {
  if (!order || !prop) return nodes

  const sorted = [...nodes].sort((a, b) => compareTableValues(a[prop], b[prop]))
  const ordered = order === 'descending' ? sorted.reverse() : sorted

  return ordered.map((node) => {
    const children = node[childrenKey]
    if (Array.isArray(children) && children.length) {
      return {
        ...node,
        [childrenKey]: sortTreeRows(children as T[], prop, order, childrenKey),
      }
    }
    return node
  })
}
