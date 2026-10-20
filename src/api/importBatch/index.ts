import request from '@/config/axios'
import { apiOrigin as prod } from '@/config/apiBase'

export type ImportBatchStatus = 'active' | 'partially_reverted' | 'reverted'
export type ImportItemState = 'revertable' | 'conflict' | 'missing' | 'reverted'

export interface ImportBatchRow {
  id: string
  model: string
  source: string | null
  label: string | null
  status: ImportBatchStatus
  insertedCount: number
  updatedCount: number
  failedCount: number
  createdBy: number | null
  createdByName: string | null
  createdAt: string
  revertedAt: string | null
  revertedByName: string | null
  items?: number
  revertedItems?: number
}

export interface ImportItem {
  id: number
  model: string
  recordId: string
  action: 'insert' | 'update'
  label: string
  state: ImportItemState
  reason: string | null
  editedFields: string[]
  laterBatchId: string | null
  revertedAt: string | null
  changes: Array<{ field: string; before?: any; after?: any; geometry?: boolean }>
}

export interface ImportSummary {
  revertable: number
  conflict: number
  missing: number
  reverted: number
  willDelete: number
  willRestore: number
  total: number
}

// Responses carry no result code, so the axios wrapper hands back the whole
// response; unwrap the body either way.
const body = (res: any) => res?.data ?? res

export const listImportBatches = async (params: Record<string, any> = {}) =>
  body(await request.get({ url: prod + '/api/v1/import-batches', params })) as {
    rows: ImportBatchRow[]
    total: number
    canRevert: boolean
  }

export const getImportBatch = async (id: string) =>
  body(await request.get({ url: prod + `/api/v1/import-batches/${id}` })) as {
    batch: ImportBatchRow
    summary: ImportSummary
    items: ImportItem[]
  }

export const getImportBatchFeatures = async (id: string) =>
  body(await request.get({ url: prod + `/api/v1/import-batches/${id}/features` }))

export const revertImportBatch = async (id: string, data: { dryRun?: boolean; itemIds?: number[] } = {}) =>
  body(await request.post({ url: prod + `/api/v1/import-batches/${id}/revert`, data })) as {
    deleted?: number
    restored?: number
    summary: ImportSummary
    items: ImportItem[]
  }
