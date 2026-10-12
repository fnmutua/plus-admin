import { defineStore } from 'pinia'
import { store } from '../index'
import { getSettlementTypes } from '@/api/settlementTypes'
import type { SettlementTypeItem } from '@/api/settlementTypes/types'

/**
 * The settlement type list, loaded once and shared by every picker.
 *
 * Settlements store the type's label text, so a picker's option value is the
 * label itself. Older screens wrote '1', '2', 'slum' or 'informal_settlement'
 * into the same column, so `labelFor` still resolves those rather than showing
 * a raw value to a user.
 */

/** What the long-hardcoded dropdowns used to write, mapped to a type code. */
const LEGACY_VALUES: Record<string, string> = {
  '1': 'slum',
  '2': 'informal_settlement',
  slum: 'slum',
  informal: 'informal_settlement',
  informal_settlement: 'informal_settlement',
  'informal settlement': 'informal_settlement'
}

export interface SettlementTypesState {
  types: SettlementTypeItem[]
  loading: boolean
  loadedAt: number
  error: string | null
}

/** Types are rarely edited; a short window stops every screen refetching. */
const CACHE_MS = 5 * 60 * 1000

export const useSettlementTypesStore = defineStore({
  id: 'settlementTypes',
  state: (): SettlementTypesState => ({
    types: [],
    loading: false,
    loadedAt: 0,
    error: null
  }),
  getters: {
    /** Active types, in display order. */
    activeTypes(): SettlementTypeItem[] {
      return this.types.filter((type) => type.active)
    },
    /** Options for an el-select: the stored label is the value. */
    typeOptions(): Array<{ label: string; value: string }> {
      return this.activeTypes.map((type) => ({ label: type.label, value: type.label }))
    }
  },
  actions: {
    async load(force = false) {
      if (!force && this.types.length && Date.now() - this.loadedAt < CACHE_MS) return this.types
      if (this.loading) return this.types

      this.loading = true
      try {
        const response = await getSettlementTypes()
        if (response.success) {
          this.types = response.data || []
          this.loadedAt = Date.now()
          this.error = null
        }
      } catch (error: any) {
        // A picker with no options is better than a screen that fails to open.
        this.error = error?.message || 'Could not load settlement types'
      } finally {
        this.loading = false
      }
      return this.types
    },

    /** Force a refetch, for the management screen after it saves. */
    invalidate() {
      this.loadedAt = 0
    },

    /**
     * Display label for a stored value, including the legacy ids and slugs
     * written by the old hardcoded dropdowns.
     */
    labelFor(value: unknown): string {
      if (value === null || value === undefined || value === '') return 'N/A'

      const raw = String(value).trim()
      const exact = this.types.find((type) => type.label.toLowerCase() === raw.toLowerCase())
      if (exact) return exact.label

      const code = LEGACY_VALUES[raw.toLowerCase()]
      const byCode = code && this.types.find((type) => type.code === code)
      if (byCode) return byCode.label

      // An unknown value is shown as stored: it is real data, and hiding it
      // behind "N/A" is how the drift went unnoticed in the first place.
      return raw
    },

    /** Look a type up by its stable code, for logic that must target one. */
    byCode(code: string): SettlementTypeItem | undefined {
      return this.types.find((type) => type.code === code)
    }
  }
})

export const useSettlementTypesStoreWithOut = () => useSettlementTypesStore(store)
