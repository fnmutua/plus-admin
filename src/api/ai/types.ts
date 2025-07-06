// AI Provider Types
export interface AIProvider {
  id: string
  name: string
  description: string
  models: AIModel[]
  isAvailable: boolean
  config?: Record<string, any>
}

export interface AIModel {
  id: string
  name: string
  provider: string
  maxTokens: number
  isAvailable: boolean
  costPerToken?: number
}

// AI Configuration Types
export interface AIConfig {
  provider: string
  model: string
  temperature: number
  maxTokens: number
  chunkSize: number
  chunkOverlap: number
  enableAI: boolean
}

// Document Processing Types
export interface DocumentProcessingRequest {
  documentId: string | number
  filename: string
  forceReprocess?: boolean
}

export interface DocumentProcessingResponse {
  success: boolean
  documentId: string | number
  status: 'processing' | 'completed' | 'failed'
  message: string
  chunks?: number
  embeddings?: number
  processingTime?: number
  error?: string
}

export interface DocumentProcessingStatus {
  documentId: string | number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  message: string
  startedAt?: string
  completedAt?: string
  error?: string
}

// Chat and Query Types
export interface AIQuestion {
  question: string
  sessionId?: string
  provider?: string
  model?: string
  documentIds?: (string | number)[]
  temperature?: number
  maxTokens?: number
}

export interface AIAnswer {
  answer: string
  sources: AISource[]
  tokens: number
  processingTime?: number
  confidence?: number
  sessionId?: string
}

export interface AISource {
  filename: string
  preview: string
  similarity: string | number
  distance?: string | number
  chunkIndex?: number
  fileSize?: string | number
  fileType?: string
  documentId?: string | number
}

export interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: string
  sessionId: string
  sources?: AISource[]
  tokens?: number
}

export interface ConversationHistory {
  sessionId: string
  messages: ChatMessage[]
  totalTokens: number
  createdAt: string
  updatedAt: string
}

// Search Types
export interface AISearchRequest {
  query: string
  limit?: number
  threshold?: number
  documentIds?: (string | number)[]
  provider?: string
  model?: string
}

export interface AISearchResult {
  query: string
  results: AISearchDocument[]
  totalResults: number
  processingTime: number
}

export interface AISearchDocument {
  documentId: string | number
  filename: string
  similarity: number
  chunks: AISearchChunk[]
}

export interface AISearchChunk {
  content: string
  similarity: number
  page?: number
  line?: number
}

// Statistics Types
export interface AIStats {
  totalDocuments: number
  processedDocuments: number
  totalChunks: number
  totalEmbeddings: number
  totalConversations: number
  totalTokens: number
  averageProcessingTime: number
  lastProcessedAt?: string
  databaseStatus: 'connected' | 'disconnected' | 'error'
}

export interface DocumentAIStats {
  documentId: string | number
  filename: string
  chunks: number
  embeddings: number
  processingTime: number
  lastProcessedAt: string
  status: 'processed' | 'pending' | 'failed'
  conversations: number
  tokensUsed: number
}

// Database Types
export interface AIDatabaseStatus {
  isConnected: boolean
  tables: string[]
  documentCount: number
  chunkCount: number
  embeddingCount: number
  conversationCount: number
  lastBackup?: string
  size?: string
  version?: string
}

// Log Types
export interface AILog {
  id: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  timestamp: string
  documentId?: string | number
  sessionId?: string
  provider?: string
  model?: string
  metadata?: Record<string, any>
}

// Response Types
export interface IResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
  code?: string
  // For AI responses that return answer directly
  answer?: string
  sources?: AISource[]
  tokens?: number
  processingTime?: number
  confidence?: number
  sessionId?: string
}

// Error Types
export interface AIError {
  code: string
  message: string
  details?: string
  timestamp: string
  documentId?: string | number
  sessionId?: string
} 