import apiClient from './api.config'
import type { 
  CreateMemoryRequest,
  UpdateMemoryRequest,
  MemoryResponse,
  MemoriesListResponse
} from '../models/writings.types'
import type { ApiError } from '../models/auth.types'

/**
 * Memory Service
 * Handles all memory-related API calls
 */

class MemoryService {
  /**
   * Create a new memory
   * @param memoryData - Memory content and title
   * @returns Promise with memory response
   */
  async createMemory(memoryData: CreateMemoryRequest): Promise<MemoryResponse> {
    try {
      const response = await apiClient.post<MemoryResponse>('/memories', memoryData)
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Get all memories for the current user
   * @returns Promise with list of memories
   */
  async getMemories(): Promise<MemoriesListResponse> {
    try {
      const response = await apiClient.get<MemoriesListResponse>('/memories')
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Get a specific memory by ID
   * @param memoryId - Memory ID to fetch
   * @returns Promise with memory response
   */
  async getMemory(memoryId: string): Promise<MemoryResponse> {
    try {
      const response = await apiClient.get<MemoryResponse>(`/memories/${memoryId}`)
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Update an existing memory
   * @param memoryData - Memory data to update
   * @returns Promise with memory response
   */
  async updateMemory(memoryData: UpdateMemoryRequest): Promise<MemoryResponse> {
    try {
      const response = await apiClient.put<MemoryResponse>(
        `/memories/${memoryData.memoryId}`,
        memoryData
      )
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Delete a memory
   * @param memoryId - Memory ID to delete
   * @returns Promise with response
   */
  async deleteMemory(memoryId: string): Promise<MemoryResponse> {
    try {
      const response = await apiClient.delete<MemoryResponse>(`/memories/${memoryId}`)
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
export const memoryService = new MemoryService()
export default memoryService
