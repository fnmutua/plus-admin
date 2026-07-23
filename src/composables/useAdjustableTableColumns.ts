import { computed, ref } from 'vue'
import { useCache } from '@/hooks/web/useCache'

export type AdjustableColumnKey = string

export type AdjustableColumnSetting = {
  key: AdjustableColumnKey
  label: string
  width: number
  minWidth?: number
  visible: boolean
  hideable: boolean
}

export function useAdjustableTableColumns(
  storageKey: string,
  createDefaults: () => AdjustableColumnSetting[]
) {
  const { wsCache } = useCache()

  const loadColumns = (): AdjustableColumnSetting[] => {
    const defaults = createDefaults()
    const saved = wsCache.get(storageKey) as Partial<AdjustableColumnSetting>[] | undefined
    if (!Array.isArray(saved)) {
      return defaults
    }
    return defaults.map((col) => {
      const match = saved.find((s) => s.key === col.key)
      if (!match) return col
      return {
        ...col,
        width: typeof match.width === 'number' && match.width > 40 ? match.width : col.width,
        visible: !col.hideable ? true : match.visible !== false,
      }
    })
  }

  const columns = ref<AdjustableColumnSetting[]>(loadColumns())
  const showColumnPicker = ref(false)

  const saveColumns = () => {
    wsCache.set(
      storageKey,
      columns.value.map(({ key, width, visible }) => ({ key, width, visible }))
    )
  }

  const isColumnVisible = (key: AdjustableColumnKey) =>
    columns.value.find((c) => c.key === key)?.visible !== false

  const columnWidth = (key: AdjustableColumnKey) => columns.value.find((c) => c.key === key)?.width

  const columnMinWidth = (key: AdjustableColumnKey) =>
    columns.value.find((c) => c.key === key)?.minWidth

  const hideableColumns = computed(() => columns.value.filter((c) => c.hideable))

  const visibleColumnKeys = computed({
    get: () => hideableColumns.value.filter((c) => c.visible).map((c) => c.key),
    set: (keys: AdjustableColumnKey[]) => {
      const selected = new Set(keys)
      columns.value.forEach((col) => {
        if (col.hideable) {
          col.visible = selected.has(col.key)
        }
      })
      saveColumns()
    },
  })

  const onHeaderDragend = (
    newWidth: number,
    _oldWidth: number,
    column: { columnKey?: string }
  ) => {
    const key = column.columnKey as AdjustableColumnKey | undefined
    if (!key) return
    const col = columns.value.find((c) => c.key === key)
    if (!col) return
    col.width = Math.max(col.minWidth ?? 60, Math.round(newWidth))
    saveColumns()
  }

  const resetColumns = () => {
    columns.value = createDefaults()
    saveColumns()
  }

  const toggleColumnPicker = () => {
    showColumnPicker.value = !showColumnPicker.value
  }

  return {
    columns,
    showColumnPicker,
    isColumnVisible,
    columnWidth,
    columnMinWidth,
    hideableColumns,
    visibleColumnKeys,
    onHeaderDragend,
    resetColumns,
    toggleColumnPicker,
  }
}
