import request from '@/config/axios'
import { apiOrigin } from '@/config/apiBase'
import type {
  IResponse,
  AIProvidersResponse,
  AIHealth,
  AIStats,
  AIIndexedDocument,
  AIQuestion,
  AIAnswer,
  AIDocumentStatus,
  AIReindexResponse,
  AIModelsResponse,
  AISetting,
  AISettingChange,
  AISettingsPayload
} from './types'

const base = apiOrigin

/** Health of the database, chat provider and embedding provider. */
export const getAIHealth = (): Promise<IResponse<AIHealth>> =>
  request.get({ url: `${base}/api/ai/health` })

/** Providers this deployment can actually serve, plus the active selection. */
export const getAIProviders = (): Promise<AIProvidersResponse> =>
  request.get({ url: `${base}/api/ai/providers` })

/**
 * Ask a question about indexed documents.
 * Pass an AbortSignal to let the caller stop generation mid-flight; aborting
 * closes the connection, which the server propagates to the model.
 */
export const askAIDocument = (
  data: AIQuestion,
  signal?: AbortSignal
): Promise<IResponse<AIAnswer> & AIAnswer> =>
  request.post({ url: `${base}/api/ai/ask`, data, signal })

/** Drop a conversation thread's stored history. */
export const clearAISession = (sessionId: string): Promise<IResponse<{ removed: number }>> =>
  request.delete({ url: `${base}/api/ai/session`, data: { sessionId } })

/** Index-wide counts. */
export const getAIStats = (): Promise<IResponse<AIStats>> =>
  request.get({ url: `${base}/api/ai/stats` })

/** Every document in the AI index, newest first. */
export const getAIIndexedDocuments = (): Promise<IResponse<AIIndexedDocument[]>> =>
  request.get({ url: `${base}/api/ai/documents` })

/**
 * Re-index one entry of the AI index by its index id. Waits for the result,
 * so the timeout allows for a long PDF.
 */
export const reindexAIIndexEntry = (
  id: string
): Promise<IResponse<{ chunks: number; warning: string | null }>> =>
  request.post({ url: `${base}/api/ai/index/${id}/reindex`, timeout: 10 * 60 * 1000 })

/** Indexing status for one document. */
export const getDocumentAIStatus = (documentId: string | number): Promise<IResponse<AIDocumentStatus>> =>
  request.get({ url: `${base}/api/ai/documents/${documentId}/status` })

/** Queue background indexing. Returns once queued, not once finished. */
export const reindexDocuments = (data: {
  documentIds?: (string | number)[]
  processAll?: boolean
  force?: boolean
}): Promise<AIReindexResponse> =>
  request.post({ url: `${base}/api/ai/reindex`, data })

/**
 * Models the given provider will serve, queried live rather than hardcoded.
 * Chat-capable models only, newest first. The server returns the 10 most recent
 * and never more, however large a `limit` asks for.
 */
export const getAIModels = (provider?: string, limit?: number): Promise<AIModelsResponse> =>
  request.get({
    url: `${base}/api/ai/models`,
    params: {
      ...(provider ? { provider } : {}),
      ...(limit === undefined ? {} : { limit })
    }
  })

/** Effective AI settings, with the environment value each one falls back to. */
export const getAISettings = (): Promise<IResponse<AISettingsPayload>> =>
  request.get({ url: `${base}/api/ai/settings` })

/**
 * Apply settings changes. Send `overridden: false` for a key to drop its
 * override and fall back to the environment value.
 */
export const updateAISettings = (
  settings: AISettingChange[]
): Promise<IResponse<{ settings: AISetting[]; health: AIHealth }>> =>
  request.put({ url: `${base}/api/ai/settings`, data: { settings } })
