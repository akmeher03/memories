// Memory request models
export interface CreateMemoryRequest {
  title?: string
  content: string
}

export interface UpdateMemoryRequest {
  memoryId: string
  title?: string
  content?: string
}

// Memory response models
export interface Memory {
  memoryId: string
  userId: string
  title?: string
  content: string
  createdAt: string
  updatedAt?: string
}

export interface MemoryResponse {
  success: boolean
  message: string
  data?: Memory
  error?: string
}

export interface MemoriesListResponse {
  success: boolean
  message: string
  data?: Memory[]
  error?: string
}
