export interface IResponse<T> {
  success: boolean
  code?: string
  message?: string
  data?: T
}

/** One entry of the managed parcel land-use list. */
export interface LanduseTypeItem {
  id: number
  label: string
  color: string
  /** Comma-separated alternate names for import matching. */
  aliases: string
  description: string | null
  active: boolean
  sortOrder: number
  /** How many parcels use it. Only returned with includeInactive. */
  parcels: number
}

export interface LanduseTypePayload {
  label: string
  color?: string
  aliases?: string
  description?: string | null
  active?: boolean
  sortOrder?: number
}
