export interface IResponse<T> {
  success: boolean
  code?: string
  message?: string
  data?: T
}

/** One entry of the managed settlement type list. */
export interface SettlementTypeItem {
  id: number
  /** Shown in pickers, and the value stored on a settlement. */
  label: string
  /** Stable slug for code that must recognise a type across renames. */
  code: string
  description: string | null
  /** Inactive types stay on existing settlements but are not offered. */
  active: boolean
  sortOrder: number
  /** How many settlements use it. Only returned with includeInactive. */
  settlements: number
}

export interface SettlementTypePayload {
  label: string
  code?: string
  description?: string | null
  active?: boolean
  sortOrder?: number
}
