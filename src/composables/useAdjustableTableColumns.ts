import { computed, ref } from 'vue'
import { useCache } from '@/hooks/web/useCache'

export type AdjustableColumnKey = string

export type AdjustableColumnSetting = {
  key: AdjustableColumnKey
  label: string
  // Undefined by default so el-table's `fit` distributes the container's full
  // width across visible columns (via their minWidth) instead of leaving a gap
  // or overflowing — regardless of how many columns are toggled on. A concrete
  // number only appears once the user drags that column's border (see
  // widthCustomized below); presets should not set one.
  width?: number
  minWidth?: number
  visible: boolean
  hideable: boolean
  /** True once the user has manually dragged this column — see width above. */
  widthCustomized?: boolean
}

/** Removed from user tables; strip from cached column prefs. */
const DEPRECATED_COLUMN_KEYS = new Set(['avatar'])

const withoutDeprecatedColumns = (cols: AdjustableColumnSetting[]) =>
  cols.filter((col) => !DEPRECATED_COLUMN_KEYS.has(col.key))

export function useAdjustableTableColumns(
  storageKey: string,
  createDefaults: () => AdjustableColumnSetting[]
) {
  const { wsCache } = useCache()

  const loadColumns = (): AdjustableColumnSetting[] => {
    const defaults = withoutDeprecatedColumns(createDefaults())
    const saved = wsCache.get(storageKey) as Partial<AdjustableColumnSetting>[] | undefined
    if (!Array.isArray(saved)) {
      return defaults
    }

    const cleanedSaved = saved.filter(
      (entry) => entry?.key && !DEPRECATED_COLUMN_KEYS.has(entry.key)
    )
    const hadDeprecated = saved.some(
      (entry) => entry?.key && DEPRECATED_COLUMN_KEYS.has(entry.key)
    )

    const merged = defaults.map((col) => {
      const match = cleanedSaved.find((s) => s.key === col.key)
      if (!match) return col
      // Only a genuinely user-resized width survives the merge. Older cached
      // entries were saved back with whatever fixed default width the preset
      // had at the time (pre-dating widthCustomized) — honouring those would
      // silently reintroduce the fixed-width layout this flag exists to avoid.
      const widthCustomized = match.widthCustomized === true
      return {
        ...col,
        width:
          widthCustomized && typeof match.width === 'number' && match.width > 40
            ? match.width
            : col.width,
        widthCustomized,
        visible: !col.hideable ? true : match.visible !== false,
      }
    })

    if (hadDeprecated || cleanedSaved.length !== saved.length) {
      wsCache.set(
        storageKey,
        merged.map(({ key, width, visible, widthCustomized }) => ({
          key,
          width,
          visible,
          widthCustomized,
        }))
      )
    }

    return merged
  }

  const columns = ref<AdjustableColumnSetting[]>(loadColumns())
  const showColumnPicker = ref(false)

  const saveColumns = () => {
    wsCache.set(
      storageKey,
      withoutDeprecatedColumns(columns.value).map(({ key, width, visible, widthCustomized }) => ({
        key,
        width,
        visible,
        widthCustomized,
      }))
    )
  }

  const isColumnVisible = (key: AdjustableColumnKey) =>
    columns.value.find((c) => c.key === key)?.visible !== false

  const columnWidth = (key: AdjustableColumnKey) => columns.value.find((c) => c.key === key)?.width

  const columnMinWidth = (key: AdjustableColumnKey) =>
    columns.value.find((c) => c.key === key)?.minWidth

  const hideableColumns = computed(() =>
    withoutDeprecatedColumns(columns.value).filter((c) => c.hideable)
  )

  const visibleColumnKeys = computed({
    get: () => hideableColumns.value.filter((c) => c.visible).map((c) => c.key),
    set: (keys: AdjustableColumnKey[]) => {
      const selected = new Set(keys.filter((key) => !DEPRECATED_COLUMN_KEYS.has(key)))
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
    col.widthCustomized = true
    saveColumns()
  }

  const resetColumns = () => {
    columns.value = withoutDeprecatedColumns(createDefaults())
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
