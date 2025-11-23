import apiClient from './api.config'
import type { ApiError } from '../models/auth.types'
import type { 
  RagStoreRequest,
  RagStoreResponse,
  RagQueryRequest,
  RagQueryResponse
} from '../models/rag.types'

/**
 * RAG Service
 * Handles all RAG (Retrieval Augmented Generation) API calls
 */
class RagService {
  /**
   * Get user info from localStorage
   * @returns Object with userId and email
   */
  private getUserInfo(): { userId: string; email: string } {
    const userId = localStorage.getItem('userId') || ''
    const currentUser = localStorage.getItem('currentUser')
    let email = ''
    
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser)
        email = user.email || ''
      } catch (error) {
        console.error('Error parsing currentUser:', error)
      }
    }
    
    return { userId, email }
  }

  /**
   * Store a memory in the RAG vector database
   * @param memoryData - Memory title and content
   * @returns Promise with store response
   */
  async storeMemory(memoryData: { title: string; content: string }): Promise<RagStoreResponse> {
    try {
      const { userId, email } = this.getUserInfo()
      
      const requestData: RagStoreRequest = {
        userId,
        email,
        title: memoryData.title,
        content: memoryData.content
      }
      
      const response = await apiClient.post<RagStoreResponse>('/rag/store', requestData)
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Query memories from the RAG system
   * @param query - User's question/query
   * @returns Promise with query response containing answer and score
   */
  async queryMemories(query: string): Promise<RagQueryResponse> {
    try {
      const { userId, email } = this.getUserInfo()
      
      const requestData: RagQueryRequest = {
        userId,
        email,
        query
      }
      
      const response = await apiClient.post<RagQueryResponse>('/rag/query', requestData)
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Handle API errors
   * @param error - Error object from axios
   * @returns Formatted error object
   */
  private handleError(error: any): ApiError {
    if (error.response) {
      // Server responded with error
      return {
        success: false,
        message: error.response.data?.message || 'An error occurred',
        error: error.response.data?.error || error.message,
        statusCode: error.response.status
      }
    } else if (error.request) {
      // Request made but no response
      return {
        success: false,
        message: 'Network error - Unable to reach server',
        error: 'Network error'
      }
    } else {
      // Error setting up request
      return {
        success: false,
        message: 'An unexpected error occurred',
        error: error.message
      }
    }
  }
}

// Export singleton instance
export const ragService = new RagService()
export default ragService
