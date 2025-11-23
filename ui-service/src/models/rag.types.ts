/**
 * RAG (Retrieval Augmented Generation) Type Definitions
 * Models for RAG API requests and responses
 */

// ============================================
// RAG STORE - For storing memories in vector database
// ============================================

/**
 * Request model for storing a memory in RAG system
 */
export interface RagStoreRequest {
  userId: string
  email: string
  title: string
  content: string
}

/**
 * Data returned from store operation
 */
export interface RagStoreData {
  documentId: string
  indexed: boolean
}

/**
 * Response model for store operation
 */
export interface RagStoreResponse {
  success: boolean
  message: string
  data?: RagStoreData
  error?: string
}

// ============================================
// RAG QUERY - For querying memories
// ============================================

/**
 * Request model for querying memories
 */
export interface RagQueryRequest {
  userId: string
  email: string
  query: string
}

/**
 * Data returned from query operation
 */
export interface RagQueryData {
  answer: string
  score: number
}

/**
 * Response model for query operation
 */
export interface RagQueryResponse {
  success: boolean
  message: string
  data?: RagQueryData
  error?: string
}
