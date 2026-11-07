import { defineStore } from 'pinia'
import { store } from '../index'
import { getLanduseTypes } from '@/api/landuseTypes'
import type { LanduseTypeItem } from '@/api/landuseTypes/types'

export interface LanduseTypesState {
  types: LanduseTypeItem[]
  loading: boolean
  loadedAt: number
  error: string | null
}

const CACHE_MS = 5 * 60 * 1000
const FALLBACK_COLOR = '#CCCCCC'

/**
 * Built-in colours used before the API has loaded.
 * Physical and Land Use Planning Handbook 2025 §3.4.3 Table 6 (RGB).
 */
export const FALLBACK_LANDUSE_COLORS: Record<number, string> = {
  0: '#D7C29E', // Residential 215,194,158
  1: '#C500FF', // Industrial 197,0,255
  2: '#FFAA00', // Educational 255,170,0
  3: '#A3FF73', // Recreation 163,255,115
  4: '#FFFF00', // Public purpose 255,255,0
  5: '#FF0000', // Commercial 255,0,0
  6: '#0070FF', // Public utilities 0,112,255
  7: '#CCCCCC', // Transportation fill #CCCCCC
  8: '#FFFFBE', // Conservation 255,255,190
  9: '#FFFFE6', // Agricultural 255,255,230
  10: '#9E9E9E', // Mixed use (hatched in handbook; solid fallback)
}

/** Handbook 2025 §3.4.3 Table 4 / Table 6 zone names. */
export const FALLBACK_LANDUSE_LABELS: Record<number, string> = {
  0: 'Residential',
  1: 'Industrial',
  2: 'Educational',
  3: 'Recreational',
  4: 'Public Purpose',
  5: 'Commercial',
  6: 'Public Utilities',
  7: 'Transportation',
  8: 'Conservation',
  9: 'Agricultural',
  10: 'Mixed use',
}

export const useLanduseTypesStore = defineStore({
  id: 'landuseTypes',
  state: (): LanduseTypesState => ({
    types: [],
    loading: false,
    loadedAt: 0,
    error: null,
  }),
  getters: {
    activeTypes(): LanduseTypeItem[] {
      return this.types.filter((type) => type.active)
    },
    labelById(): Record<number, string> {
      const map: Record<number, string> = { ...FALLBACK_LANDUSE_LABELS }
      for (const type of this.types) {
        map[type.id] = type.label
      }
      return map
    },
    colorById(): Record<number, string> {
      const map: Record<number, string> = { ...FALLBACK_LANDUSE_COLORS }
      for (const type of this.types) {
        if (type.color) map[type.id] = type.color
      }
      return map
    },
    legendItems(): Array<{ label: string; color: string; landuseId: number; show: boolean }> {
      const source = this.activeTypes.length
        ? this.activeTypes
        : Object.entries(FALLBACK_LANDUSE_LABELS).map(([id, label]) => ({
            id: Number(id),
            label,
            color: FALLBACK_LANDUSE_COLORS[Number(id)] || FALLBACK_COLOR,
            aliases: '',
            description: null,
            active: true,
            sortOrder: Number(id),
            parcels: 0,
          }))
      return source.map((type) => ({
        label: type.label,
        color: type.color || FALLBACK_LANDUSE_COLORS[type.id] || FALLBACK_COLOR,
        landuseId: type.id,
        show: false,
      }))
    },
  },
  actions: {
    async load(force = false) {
      if (!force && this.types.length && Date.now() - this.loadedAt < CACHE_MS) {
        return this.types
      }
      if (this.loading) return this.types

      this.loading = true
      try {
        const response = await getLanduseTypes()
        if (response.success) {
          this.types = response.data || []
          this.loadedAt = Date.now()
          this.error = null
        }
      } catch (error: any) {
        this.error = error?.message || 'Could not load land-use types'
      } finally {
        this.loading = false
      }
      return this.types
    },

    invalidate() {
      this.loadedAt = 0
    },

    labelFor(id: number | string | null | undefined): string {
      if (id === null || id === undefined || id === '') return ''
      const numeric = Number(id)
      if (!Number.isFinite(numeric)) return String(id)
      return this.labelById[numeric] ?? String(id)
    },

    colorFor(id: number | string | null | undefined): string {
      if (id === null || id === undefined || id === '') return FALLBACK_COLOR
      const numeric = Number(id)
      if (!Number.isFinite(numeric)) return FALLBACK_COLOR
      return this.colorById[numeric] || FALLBACK_COLOR
    },

    /**
     * Mapbox fill-color match expression driven by the configured types.
     * Falls back to the historic palette when the store has not loaded yet.
     */
    mapboxFillExpression(property = 'landuse_id'): any[] {
      const pairs: Array<number | string> = []
      const source = this.activeTypes.length
        ? this.activeTypes
        : Object.entries(FALLBACK_LANDUSE_COLORS).map(([id, color]) => ({
            id: Number(id),
            color,
          }))
      for (const type of source) {
        pairs.push(type.id, type.color || FALLBACK_COLOR)
      }
      return ['match', ['get', property], ...pairs, 'white']
    },
  },
})

export const useLanduseTypesStoreWithOut = () => useLanduseTypesStore(store)
