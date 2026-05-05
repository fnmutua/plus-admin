import request from '@/config/axios'
import type { 
  IResponse, 
  AIProvider, 
  AIModel, 
  AIConfig, 
  DocumentProcessingRequest, 
  DocumentProcessingResponse, 
  DocumentProcessingStatus,
  AIQuestion,
  AIAnswer,
  ConversationHistory,
  AISearchRequest,
  AISearchResult,
  AIStats,
  DocumentAIStats,
  AIDatabaseStatus,
  AILog
} from './types'
import { apiOrigin } from '@/config/apiBase'

const dev = apiOrigin + ':4000' // Add the port for local Dev
const prod = apiOrigin // remove the port for production

// AI Configuration and Provider Management
export const getAIHealth = (): Promise<IResponse<any>> => {
  return request.get({ url: prod + '/api/ai/health' })
}

export const getAIProviders = (): Promise<IResponse<AIProvider[]>> => {
  return request.get({ url: prod + '/api/ai/providers' })
}

export const setAIProvider = (data: { provider: string }): Promise<IResponse<AIProvider>> => {
  return request.post({ url: prod + '/api/ai/provider', data })
}

export const getAIModels = (): Promise<IResponse<AIModel[]>> => {
  return request.get({ url: prod + '/api/ai/models' })
}

// Document AI Processing - Updated to match actual backend routes
export const processExistingDocumentsWithAI = (data: { 
  documentIds?: string[], 
  processAll?: boolean 
}): Promise<IResponse<DocumentProcessingResponse>> => {
  return request.post({ url: prod + '/api/v1/documents/ai/process', data })
}

export const getDocumentAIStatus = (documentId: string): Promise<IResponse<DocumentProcessingStatus>> => {
  return request.get({ url: prod + `/api/v1/documents/${documentId}/ai/status` })
}

export const getAIProcessingStats = (): Promise<IResponse<AIStats>> => {
  return request.get({ url: prod + '/api/v1/documents/ai/stats' })
}

// AI Chat and Querying
export const askAIDocument = (data: AIQuestion): Promise<IResponse<AIAnswer>> => {
  return request.post({ url: prod + '/api/ai/ask', data })
}

// Legacy functions for backward compatibility
export const processDocumentAI = (data: DocumentProcessingRequest): Promise<IResponse<DocumentProcessingResponse>> => {
  return request.post({ url: prod + '/api/v1/documents/ai/process', data })
}

export const processDocumentBatchAI = (data: { 
  documentIds: (string | number)[] 
}): Promise<IResponse<DocumentProcessingResponse[]>> => {
  return request.post({ url: prod + '/api/v1/documents/ai/process', data })
}

export const getAIProcessingStatus = (data: { 
  documentId: string | number 
}): Promise<IResponse<DocumentProcessingStatus>> => {
  return request.get({ url: prod + `/api/v1/documents/${data.documentId}/ai/status` })
}

export const getAIConversationHistory = (data: { 
  sessionId: string 
}): Promise<IResponse<ConversationHistory>> => {
  return request.post({ url: prod + '/api/ai/conversation-history', data })
}

export const clearAIConversationHistory = (data: { 
  sessionId: string 
}): Promise<IResponse<boolean>> => {
  return request.delete({ url: prod + '/api/ai/conversation-history', data })
}

// AI Statistics and Analytics
export const getAIStats = (): Promise<IResponse<AIStats>> => {
  return request.get({ url: prod + '/api/v1/documents/ai/stats' })
}

export const getAIDocumentStats = (data: { 
  documentId?: string | number 
}): Promise<IResponse<DocumentAIStats>> => {
  return request.get({ url: prod + `/api/v1/documents/${data.documentId}/ai/status` })
}

// AI Embeddings and Search
export const searchAIDocuments = (data: AISearchRequest): Promise<IResponse<AISearchResult>> => {
  return request.post({ url: prod + '/api/ai/search', data })
}

export const getAIDocumentEmbeddings = (data: { 
  documentId: string | number 
}): Promise<IResponse<any>> => {
  return request.post({ url: prod + '/api/ai/embeddings', data })
}

// AI Database Management
export const initializeAIDatabase = (): Promise<IResponse<boolean>> => {
  return request.post({ url: prod + '/api/ai/init-database' })
}

export const getAIDatabaseStatus = (): Promise<IResponse<AIDatabaseStatus>> => {
  return request.get({ url: prod + '/api/ai/database-status' })
}

export const resetAIDatabase = (): Promise<IResponse<boolean>> => {
  return request.post({ url: prod + '/api/ai/reset-database' })
}

// AI Configuration
export const getAIConfig = (): Promise<IResponse<AIConfig>> => {
  return request.get({ url: prod + '/api/ai/config' })
}

export const updateAIConfig = (data: Partial<AIConfig>): Promise<IResponse<AIConfig>> => {
  return request.post({ url: prod + '/api/ai/config', data })
}

// AI Error Handling and Logs
export const getAILogs = (data: { 
  level?: string
  limit?: number
  documentId?: string | number
}): Promise<IResponse<AILog[]>> => {
  return request.post({ url: prod + '/api/ai/logs', data })
}

export const clearAILogs = (): Promise<IResponse<boolean>> => {
  return request.delete({ url: prod + '/api/ai/logs' })
} 