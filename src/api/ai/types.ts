export interface IResponse<T> {
  success: boolean
  code?: string
  message?: string
  data?: T
}

export interface AIProvider {
  id: string
  name: string
  description: string
  /** False when the server holds no key for this provider; do not offer it. */
  isAvailable: boolean
  /** False when an administrator has not offered this provider to users. */
  offered?: boolean
  chat: boolean
  embeddings: boolean
}

export interface AIProvidersResponse {
  success: boolean
  data: AIProvider[]
  active: { chat: string; model: string; embeddings: string }
}

export interface AIHealth {
  status: 'healthy' | 'degraded'
  enabled: boolean
  database: { connected: boolean; vectorSearchEnabled: boolean; error?: string | null }
  chat: { provider: string; model: string; ok: boolean; error?: string }
  embeddings: { provider: string; model: string; dimensions: number; ok: boolean; error?: string }
}

export interface AIQuestion {
  question: string
  /** Conversation thread key. Omit to use the caller's own thread. */
  sessionId?: string
  provider?: string
  model?: string
}

export interface AISource {
  filename: string
  preview: string
  /** Cosine similarity for vector hits, ts_rank for keyword hits. */
  similarity: number
  chunkIndex: number
  fileType?: string
  fileSize?: number
}

export interface AIAnswer {
  answer: string
  sources: AISource[]
  tokens: number
  usage?: { prompt: number; completion: number; total: number }
  provider?: string
  model?: string
  processingTime?: number
  /**
   * Which path produced the sources: semantic search, the keyword fallback,
   * a recency lookup for "the latest document", or nothing found.
   */
  /** 'hybrid' | 'vector' | 'keyword' | 'terms' | 'recency' | 'none'. */
  retrieval: string
  /** Set only when the embedding call failed, not when it merely found nothing. */
  vectorError?: string | null
  /** Misspellings mapped onto indexed words. */
  corrections?: Array<{ term: string; corrected: string; df: number }>
  sessionId: string
}

/** One document in the AI index. */
export interface AIIndexedDocument {
  id: string
  /** `document:<id>` for uploads, `path:<file>` for folder imports, `record:<model>:<id>` for rows. */
  sourceKey: string | null
  filename: string
  filePath: string | null
  fileType: string | null
  fileSize: number
  chunks: number
  embeddings: number
  createdAt: string
  updatedAt: string
}

export interface AIStats {
  available: boolean
  documents: number
  chunks: number
  embeddings: number
  embeddingModels: number
  sessions: number
  sourceDocuments: number
  processedDocuments: number
  connected: boolean
  vectorSearchEnabled: boolean
  error?: string | null
}

export interface AIDocumentStatus {
  documentId: string | number
  filename: string
  processed: boolean
  processedAt: string | null
  chunks: number
  warning: string | null
}

export interface AIReindexResponse {
  success: boolean
  code?: string
  message: string
  data: { queued: number }
}

export interface ChatMessage {
  id: number
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  sources?: AISource[]
  tokens?: number
  provider?: string
  model?: string
}

export interface AIModel {
  id: string
  name: string
  provider: string
  size?: number
  /** Release date (Ollama: pull date) as a unix timestamp; the list is sorted by it. */
  created?: number
}

export interface AIModelsResponse {
  success: boolean
  data: AIModel[]
  provider: string
  /** How many models were asked for. 0 means the full catalogue. */
  limit?: number
  /** Present when the provider could not be reached; data is then empty. */
  error?: string
}

export type AISettingGroup = 'general' | 'chat' | 'embeddings' | 'retrieval' | 'indexing' | 'providers' | 'credentials'
export type AISettingType = 'boolean' | 'string' | 'url' | 'int' | 'number' | 'enum' | 'enums' | 'secret'

export interface AISetting {
  key: string
  label: string
  description: string
  group: AISettingGroup
  type: AISettingType
  /** Allowed values when type is 'enum'. */
  values: string[] | null
  min: number | null
  max: number | null
  /** Changing this invalidates existing vectors; the UI warns before saving. */
  requiresReindex: boolean
  /** Value currently in effect. An array for 'enums'; always null for a credential. */
  value: string | number | boolean | string[] | null
  /** What it would fall back to with no override. Always null for a credential. */
  envValue: string | number | boolean | null
  overridden: boolean
  /** Credentials only: the environment variable this falls back to. */
  envVar?: string
  /** Credentials only: whether a key is in effect, from either source. */
  configured?: boolean
  /** Credentials only: masked hint such as `sk-p…7Xa2`, enough to tell keys apart. */
  hint?: string | null
  /** Credentials only: whether the environment holds a key to fall back to. */
  envConfigured?: boolean
  /** Credentials only: a key was revoked here, so the environment one is ignored. */
  revoked?: boolean
  /** Credentials only: false when the server has no encryption key and cannot store one. */
  storable?: boolean
}

export interface AISettingChange {
  key: string
  value?: string | number | boolean | string[]
  /** false drops the override and reverts to the environment value. */
  overridden?: boolean
  /** Credentials only: clear the key and ignore the environment one. */
  revoked?: boolean
}

export interface AISettingsPayload {
  settings: AISetting[]
  providers: AIProvider[]
  /** Whether each API key is present in the environment. Keys are never sent. */
  credentials: Record<string, boolean>
}
